import React, { useState, useEffect } from 'react';
import SidebarAdmin from '../../components/SidebarAdmin';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import TabelaGenerica from '../../components/TabelaGenerica';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell 
} from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../../assets/dashboard.css';

const MetricasGlobaisAdmin = () => {
    const navigate = useNavigate();
    
    // --- ESTADOS ---
    const [adminUser, setAdminUser] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState('https://via.placeholder.com/40');
    const [loading, setLoading] = useState(true);

    const [statsTopo, setStatsTopo] = useState([]);
    const [dadosAcessos7Dias, setDadosAcessos7Dias] = useState([]);
    const [dadosBadgesSL, setDadosBadgesSL] = useState([]);
    const [utilizadoresAtivos, setUtilizadoresAtivos] = useState([]);
    const [areasInteresse, setAreasInteresse] = useState([]);

    useEffect(() => {
        const userLocal = JSON.parse(sessionStorage.getItem('user'));
        if (!userLocal) { navigate('/'); return; }
        setAdminUser(userLocal);

        const fetchData = async () => {
            try {
                // Fetch avatar
                const resAdmin = await axios.get(`http://localhost:3000/users/configuracoes/${userLocal.ID_UTILIZADOR}`);
                if (resAdmin.data.success && resAdmin.data.data.avatar) setAvatarUrl(resAdmin.data.data.avatar);
                
                // Fetch Métricas
                const resMetricas = await axios.get('http://localhost:3000/estatisticas/admin/metricas');
                if (resMetricas.data.success) {
                    const d = resMetricas.data.data;
                    setStatsTopo(d.statsTopo);
                    setDadosAcessos7Dias(d.dadosAcessos7Dias);
                    setDadosBadgesSL(d.dadosBadgesSL);
                    setUtilizadoresAtivos(d.utilizadoresAtivos);
                    setAreasInteresse(d.areasInteresse);
                }
            } catch (error) {
                console.error("Erro ao carregar dados:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [navigate]);

    const handleLogout = () => {
        sessionStorage.removeItem('user');
        navigate('/');
    };

    // --- FUNÇÕES DE EXPORTAÇÃO ---
    const handleExportExcel = () => {
        const wb = XLSX.utils.book_new();
        
        // Folha 1: KPIs
        const kpisFormato = statsTopo.map(s => ({ Métrica: s.label, Valor: s.valor, Tendência: s.trend }));
        const wsKPIs = XLSX.utils.json_to_sheet(kpisFormato);
        XLSX.utils.book_append_sheet(wb, wsKPIs, "Resumo de KPIs");

        // Folha 2: Acessos 7 Dias
        const acessosFormato = dadosAcessos7Dias.map(d => ({ Dia: d.dia, Acessos: d.acessos }));
        const wsAcessos = XLSX.utils.json_to_sheet(acessosFormato);
        XLSX.utils.book_append_sheet(wb, wsAcessos, "Acessos Diários");

        // Folha 3: Badges por SL
        const badgesSLFormato = dadosBadgesSL.map(d => ({ 'Service Line': d.sl, 'Total Badges': d.total }));
        const wsBadgesSL = XLSX.utils.json_to_sheet(badgesSLFormato);
        XLSX.utils.book_append_sheet(wb, wsBadgesSL, "Badges por SL");

        // Folha 4: Utilizadores
        const usersFormato = utilizadoresAtivos.map(u => ({ Nome: u.nome, Função: u.funcao, 'Service Line': u.sl, Atividade: u.tempo }));
        const wsUsers = XLSX.utils.json_to_sheet(usersFormato);
        XLSX.utils.book_append_sheet(wb, wsUsers, "Utilizadores Ativos");

        // Folha 5: Áreas de Interesse
        const areasFormato = areasInteresse.map(a => ({ Área: a.area, 'Service Line': a.sl, Interações: a.acessos }));
        const wsAreas = XLSX.utils.json_to_sheet(areasFormato);
        XLSX.utils.book_append_sheet(wb, wsAreas, "Áreas de Interesse");

        XLSX.writeFile(wb, "Softinsa_Metricas_Globais.xlsx");
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text("Relatório de Métricas Globais - Softinsa", 14, 20);
        
        // 1. KPIs
        doc.setFontSize(12);
        doc.text("Resumo de KPIs", 14, 30);
        const kpisData = statsTopo.map(s => [s.label, s.valor, s.trend]);
        autoTable(doc, {
            startY: 35,
            head: [['Métrica', 'Valor', 'Tendência']],
            body: kpisData,
            theme: 'grid',
            headStyles: { fillColor: [93, 120, 255] }
        });

        // 2. Acessos 7 Dias
        let currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 60;
        doc.text("Acessos nos Últimos 7 Dias", 14, currentY);
        const acessosData = dadosAcessos7Dias.map(d => [d.dia, d.acessos]);
        autoTable(doc, {
            startY: currentY + 5,
            head: [['Dia', 'Acessos']],
            body: acessosData,
            theme: 'grid',
            headStyles: { fillColor: [93, 120, 255] }
        });

        // 3. Badges por SL
        currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 100;
        doc.text("Badges por Service Line", 14, currentY);
        const badgesSLData = dadosBadgesSL.map(d => [d.sl, d.total]);
        autoTable(doc, {
            startY: currentY + 5,
            head: [['Service Line', 'Total de Badges']],
            body: badgesSLData,
            theme: 'grid',
            headStyles: { fillColor: [93, 120, 255] }
        });

        // 4. Utilizadores Mais Ativos
        currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 140;
        if (currentY > 260) { doc.addPage(); currentY = 20; }
        doc.text("Utilizadores Mais Ativos", 14, currentY);
        const usersData = utilizadoresAtivos.map(u => [u.nome, u.funcao, u.sl, u.tempo]);
        autoTable(doc, {
            startY: currentY + 5,
            head: [['Nome', 'Função', 'Service Line', 'Atividade (Pts/Badges)']],
            body: usersData,
            theme: 'grid',
            headStyles: { fillColor: [93, 120, 255] }
        });

        // 5. Áreas de Interesse
        currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 180;
        if (currentY > 260) { doc.addPage(); currentY = 20; }
        doc.text("Áreas com mais interesse", 14, currentY);
        const areasData = areasInteresse.map(a => [a.area, a.sl, a.acessos]);
        autoTable(doc, {
            startY: currentY + 5,
            head: [['Área', 'Service Line', 'Interações Totais']],
            body: areasData,
            theme: 'grid',
            headStyles: { fillColor: [93, 120, 255] }
        });

        doc.save("Softinsa_Metricas_Globais.pdf");
    };

    if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="d-flex bg-light min-vh-100">
            <SidebarAdmin />
            <div className="flex-grow-1 p-4 dashboard-scroll text-start">
                <div className="container-fluid px-4">
                    
                    <CabecalhoDashboard 
                        titulo="Performance e Métricas da Plataforma"
                        subtitulo="Consulte as estatísticas de acessos, badges e áreas de interesse."
                        utilizador={adminUser}
                        avatarUrl={avatarUrl}
                    />

                    {/* 1. CARDS DE ESTATÍSTICAS SUPERIORES */}
                    <div className="row g-4 mb-5">
                        {statsTopo.map((item, index) => (
                            <div key={index} className="col-md-3 text-center">
                                <div className="bg-white p-4 rounded-4 shadow-sm h-100 border-0">
                                    <p className="fw-bold text-dark mb-3 px-3" style={{fontSize: '1.1rem', height: '3rem'}}>{item.label}</p>
                                    <h2 className="fw-bold text-primary mb-2" style={{fontSize: '2.5rem', color: '#5D78FF'}}>{item.valor}</h2>
                                    <small className={`fw-bold ${item.color}`}>{item.trend}</small>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* 2. GRÁFICOS INTERMÉDIOS */}
                    <div className="row g-4 mb-5">
                        {/* Acessos Diários (Gráfico de Linha) */}
                        <div className="col-md-6">
                            <div className="bg-white p-4 rounded-4 shadow-sm h-100">
                                <h5 className="fw-bold text-dark mb-4 ms-2">Acessos Diários à Plataforma nos últimos 7 dias</h5>
                                <div style={{ width: '100%', height: '300px' }}>
                                    <ResponsiveContainer>
                                        <LineChart data={dadosAcessos7Dias}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                                            <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{fill: '#999', fontSize: 12}} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#999', fontSize: 12}} />
                                            <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                            <Line type="monotone" dataKey="acessos" stroke="#5D78FF" strokeWidth={3} dot={{ r: 6, fill: '#5D78FF' }} activeDot={{ r: 8 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Badges por Service Line (Gráfico de Barras) */}
                        <div className="col-md-6">
                            <div className="bg-white p-4 rounded-4 shadow-sm h-100">
                                <h5 className="fw-bold text-dark mb-4 ms-2">Badges por Service Line</h5>
                                <div style={{ width: '100%', height: '300px' }}>
                                    <ResponsiveContainer>
                                        <BarChart data={dadosBadgesSL} barSize={40}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                                            <XAxis dataKey="sl" axisLine={false} tickLine={false} tick={{fill: '#999', fontSize: 10}} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#999', fontSize: 12}} />
                                            <Tooltip cursor={{fill: '#F8F9FA'}} />
                                            <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                                                {dadosBadgesSL.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={index === 0 ? "#4E69E1" : index === 1 ? "#5A6D90" : "#7B8AB8"} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* 3. TABELAS DE DETALHE INFERIORES */}
                    <div className="row g-5 pb-5">
                        {/* Utilizadores Mais Ativos */}
                        <div className="col-md-6 text-start">
                            <h4 className="fw-bold text-dark mb-4">Utilizadores Mais Ativos</h4>
                            <TabelaGenerica colunas={['Nome utilizador', 'Função', 'Service Line', 'Atividade (Pts/Badges)']} emptyMessage="Sem dados para mostrar.">
                                {utilizadoresAtivos.map((u, i) => (
                                    <tr key={i}>
                                        <td className="fw-bold text-dark py-3">{u.nome}</td>
                                        <td>{u.funcao}</td>
                                        <td className="text-muted">{u.sl}</td>
                                        <td className="fw-bold text-dark">{u.tempo}</td>
                                    </tr>
                                ))}
                            </TabelaGenerica>
                        </div>

                        {/* Áreas com mais interesse */}
                        <div className="col-md-6 text-start">
                            <h4 className="fw-bold text-dark mb-4">Áreas com mais interesse</h4>
                            <TabelaGenerica colunas={['Área', 'Service Line', 'Interações Totais']} emptyMessage="Sem dados para mostrar.">
                                {areasInteresse.map((a, i) => (
                                    <tr key={i}>
                                        <td className="fw-bold text-dark py-3">{a.area}</td>
                                        <td className="text-muted">{a.sl}</td>
                                        <td className="fw-bold text-dark">{a.acessos}</td>
                                    </tr>
                                ))}
                            </TabelaGenerica>
                        </div>
                    </div>

                    {/* Botões de Exportação Centralizados */}
                    <div className="d-flex justify-content-center gap-3 mb-5 mt-2">
                        <button onClick={handleExportPDF} className="btn btn-primary px-5 py-3 rounded-3 fw-bold shadow d-flex align-items-center gap-2" style={{backgroundColor: '#5D78FF', border: 'none'}}>
                            <i className="bi bi-file-earmark-pdf-fill fs-5"></i> Exportar para PDF
                        </button>
                        <button onClick={handleExportExcel} className="btn btn-success px-5 py-3 rounded-3 fw-bold shadow d-flex align-items-center gap-2" style={{border: 'none'}}>
                            <i className="bi bi-file-earmark-excel-fill fs-5"></i> Exportar para Excel
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default MetricasGlobaisAdmin;
