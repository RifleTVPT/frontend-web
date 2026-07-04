import React, { useState, useEffect } from 'react';
import SidebarSLL from '../../components/SidebarSLL';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import TabelaGenerica from '../../components/TabelaGenerica';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { obterServiceLineSLL } from '../../utils/sllServiceLine';
import '../../assets/dashboard.css';

// Bibliotecas de exportação
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const BadgesAtribuidosSLL = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    
    // Estados do Utilizador/SL
    const [utilizador, setUtilizador] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState('https://via.placeholder.com/40');
    const [minhaSL, setMinhaSL] = useState('');

    // Estados da API
    const [dadosBD, setDadosBD] = useState([]);
    const [todasAreas, setTodasAreas] = useState([]); 

    // Estados dos Filtros
    const [areaFiltro, setAreaFiltro] = useState('Todas');
    const [niveisAtivos, setNiveisAtivos] = useState([]);
    const [pesquisaConsultor, setPesquisaConsultor] = useState('');
    const [periodo, setPeriodo] = useState('3'); 

    const [todosNiveis, setTodosNiveis] = useState([]);

    const obterLetraNivel = (nivelStr) => {
        if (!nivelStr) return '';
        const n = nivelStr.toLowerCase();
        if (n.includes('1') || n.includes('júnior') || n.includes('junior') || n === 'a' || n.includes(' a ') || n.startsWith('a -')) return 'A';
        if (n.includes('2') || n.includes('intermédio') || n.includes('intermedio') || n.includes('pleno') || n === 'b' || n.includes(' b ') || n.startsWith('b -')) return 'B';
        if (n.includes('3') || n.includes('sénior') || n.includes('senior') || n === 'c' || n.includes(' c ') || n.startsWith('c -')) return 'C';
        if (n.includes('4') || n.includes('especialista') || n.includes('master') || n === 'd' || n.includes(' d ') || n.startsWith('d -')) return 'D';
        if (n.includes('5') || n.includes('líder') || n.includes('lider') || n === 'e' || n.includes(' e ') || n.startsWith('e -')) return 'E';
        return '';
    };

    const formatNivel = (n) => {
        const letra = obterLetraNivel(n);
        const nomes = { A: 'Júnior', B: 'Intermédio', C: 'Sénior', D: 'Especialista', E: 'Líder de Conhecimento' };
        return letra ? `${letra} - ${nomes[letra]}` : n;
    };

    useEffect(() => {
        const userLocal = JSON.parse(sessionStorage.getItem('user'));
        if (!userLocal) { navigate('/'); return; }
        
        setUtilizador(userLocal);
        let slAtual = userLocal.SL_REGISTO || userLocal.SERVICE_LINE || '';
        setMinhaSL(slAtual);

        const carregarDados = async () => {
            try {
                slAtual = await obterServiceLineSLL(userLocal);
                setMinhaSL(slAtual);
                // 1. Foto Perfil
                const resUser = await axios.get(`http://localhost:3000/users/configuracoes/${userLocal.ID_UTILIZADOR}`);
                if (resUser.data.success && resUser.data.data.avatar) setAvatarUrl(resUser.data.data.avatar);

                // 2. Badges Atribuídos e Áreas dos Badges
                const resBadges = await axios.get(`http://localhost:3000/sll-badges/atribuidos?sl=${encodeURIComponent(slAtual)}`);
                let areasDosBadges = [];
                if (resBadges.data.success) {
                    setDadosBD(resBadges.data.data);
                    areasDosBadges = [...new Set(resBadges.data.data.map(b => b.area))];
                }

                // 3. Obter Áreas Ativas da Estrutura
                const resEstrutura = await axios.get('http://localhost:3000/estrutura');
                if (resEstrutura.data.success) {
                    const est = resEstrutura.data.data;
                    const slId = est.serviceLines.find(s => s.nome === slAtual)?.id;
                    if (slId) {
                        const areasSLLObj = est.areas.filter(a => a.slId === slId);
                        const areasSLL = areasSLLObj.map(a => a.nome);
                        // Juntar áreas da estrutura com áreas que possam existir nos dados antigos
                        const todas = [...new Set([...areasSLL, ...areasDosBadges])];
                        setTodasAreas(todas);

                        // Extrair níveis ativos para a SL do líder
                        const niveisParaAtivar = [];
                        areasSLLObj.forEach(a => {
                            a.niveisAtivos.forEach(n => {
                                if(!niveisParaAtivar.includes(n)) niveisParaAtivar.push(n);
                            });
                        });
                        niveisParaAtivar.sort((a, b) => formatNivel(a).localeCompare(formatNivel(b)));
                        setTodosNiveis(niveisParaAtivar);
                        setNiveisAtivos(niveisParaAtivar);
                    } else {
                        setTodasAreas(areasDosBadges);
                    }
                } else {
                    setTodasAreas(areasDosBadges);
                }
            } catch (error) {
                console.error("Erro ao carregar dados SLL:", error);
            } finally {
                setLoading(false);
            }
        };
        carregarDados();
    }, [navigate]);

    const handleLogout = () => {
        sessionStorage.removeItem('user');
        navigate('/');
    };

    const toggleNivel = (n) => {
        setNiveisAtivos(prev => prev.includes(n) ? prev.filter(i => i !== n) : [...prev, n]);
    };

    // --- LÓGICA DE FILTRAGEM DINÂMICA ---
    const dadosFiltrados = dadosBD.filter(item => {
        const matchArea = areaFiltro === 'Todas' || item.area === areaFiltro;
        const matchNivel = niveisAtivos.includes(item.nivel);
        const matchConsultor = item.consultor.toLowerCase().includes(pesquisaConsultor.toLowerCase());
        
        if (periodo === 'all') return matchArea && matchNivel && matchConsultor;
        
        const dataItem = new Date(item.data);
        const dataLimite = new Date();
        dataLimite.setMonth(dataLimite.getMonth() - parseInt(periodo));
        const matchData = dataItem >= dataLimite;

        return matchArea && matchNivel && matchConsultor && matchData;
    });

    const formatarData = (dataIso) => {
        const d = new Date(dataIso);
        return d.toLocaleDateString('pt-PT');
    };

    // ==========================================
    // MÉTODOS DE EXPORTAÇÃO
    // ==========================================
    const exportarExcel = () => {
        if (dadosFiltrados.length === 0) return alert('Sem dados para exportar com os filtros atuais.');
        
        const ws = XLSX.utils.json_to_sheet(dadosFiltrados.map(item => ({
            'Consultor': item.consultor,
            'Badge': item.nomeBadge,
            'Área': item.area,
            'Nível': formatNivel(item.nivel),
            'Data Atribuição': formatarData(item.data),
            'Pontos Ganhos': item.pontos
        })));
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Badges Atribuidos");
        XLSX.writeFile(wb, `Badges_Atribuidos_${minhaSL.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.xlsx`);
    };

    const exportarPDF = () => {
        if (dadosFiltrados.length === 0) return alert('Sem dados para exportar com os filtros atuais.');

        const doc = new jsPDF('p', 'mm', 'a4');
        let currentY = 20;

        // Cabeçalho
        doc.setFontSize(18);
        doc.text(`Relatório de Badges Atribuídos: ${minhaSL}`, 14, currentY);
        doc.setFontSize(10);
        doc.setTextColor(100);
        currentY += 8;
        doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, currentY);
        currentY += 15;

        const corpoTabela = dadosFiltrados.map(item => [
            item.consultor,
            item.nomeBadge,
            `${item.area} - ${formatNivel(item.nivel)}`,
            formatarData(item.data),
            `${item.pontos} pts`
        ]);

        autoTable(doc, {
            startY: currentY,
            head: [['Consultor', 'Nome do Badge', 'Área e Nível', 'Data Atribuição', 'Pontos']],
            body: corpoTabela,
            theme: 'striped',
            headStyles: { fillColor: [93, 120, 255] },
            styles: { fontSize: 10 }
        });

        doc.save(`Badges_Atribuidos_${minhaSL.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`);
    };

    if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="d-flex bg-light min-vh-100">
            <SidebarSLL />
            
            <div className="flex-grow-1 p-4 dashboard-scroll">
                <div className="container-fluid text-start">
                    
                    <CabecalhoDashboard 
                        titulo={`Badges Atribuídos - ${minhaSL}`}
                        subtitulo=""
                        utilizador={utilizador}
                        avatarUrl={avatarUrl}
                    />

                    {/* PRIMEIRA LINHA DE FILTROS */}
                    <div className="row g-4 mb-4 align-items-end">
                        <div className="col-md-5">
                            <label className="form-label fw-bold text-dark h5 mb-3">Área de Competência</label>
                            <select className="form-select border-0 shadow-sm py-2 rounded-3" value={areaFiltro} onChange={(e) => setAreaFiltro(e.target.value)}>
                                <option value="Todas">Todas as Áreas</option>
                                {todasAreas.map(area => <option key={area} value={area}>{area}</option>)}
                            </select>
                        </div>

                        <div className="col-md-7 text-start">
                            <label className="form-label fw-bold text-dark h5 mb-3 d-block">Nível de Competência</label>
                            <div className="d-flex gap-2 text-start">
                                {todosNiveis.map(n => (
                                    <button key={n} onClick={() => toggleNivel(n)}
                                        className={`btn btn-sm shadow-sm fw-bold px-3 rounded-3 border-0 transition-all py-2 ${niveisAtivos.includes(n) ? 'btn-primary' : 'bg-white text-muted'}`}
                                        style={{ fontSize: '0.8rem' }}>
                                        {formatNivel(n)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* SEGUNDA LINHA DE FILTROS: Grelha Ajustada */}
                    <div className="row g-4 mb-5 align-items-end">
                        <div className="col-md-5">
                            <label className="form-label fw-bold text-dark h5 mb-3">Pesquisar Consultor</label>
                            <div className="position-relative">
                                <input type="text" className="form-control border-0 shadow-sm py-2 rounded-3" placeholder="Ex: João Silva" 
                                       value={pesquisaConsultor} onChange={(e) => setPesquisaConsultor(e.target.value)} />
                                <i className="bi bi-search position-absolute end-0 top-50 translate-middle-y me-3 text-muted"></i>
                            </div>
                        </div>

                        <div className="col-md-3">
                            <label className="form-label fw-bold text-dark h5 mb-3">Período de Atribuição</label>
                            <select className="form-select border-0 shadow-sm py-2 rounded-3" value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
                                <option value="1">Último Mês</option>
                                <option value="3">Últimos 3 Meses</option>
                                <option value="12">Último Ano</option>
                                <option value="all">Todo o Histórico (Sempre)</option>
                            </select>
                        </div>

                        {/* BOTÕES DE EXPORTAÇÃO (Excel e PDF) */}
                        <div className="col-md-4">
                            <label className="form-label fw-bold text-dark h5 mb-3 d-block opacity-0">Exportar</label>
                            <div className="dropdown w-100">
                                <button className="btn btn-primary rounded-3 py-2 w-100 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2" 
                                        style={{backgroundColor: '#5D78FF', border: 'none'}} type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                    <i className="bi bi-download"></i> Exportar Dados
                                </button>
                                <ul className="dropdown-menu w-100 shadow border-0 rounded-3 mt-2">
                                    <li>
                                        <button className="dropdown-item py-2 fw-bold text-danger d-flex align-items-center gap-2" onClick={exportarPDF}>
                                            <i className="bi bi-file-earmark-pdf-fill fs-5"></i> Exportar para PDF
                                        </button>
                                    </li>
                                    <li>
                                        <button className="dropdown-item py-2 fw-bold text-success d-flex align-items-center gap-2" onClick={exportarExcel}>
                                            <i className="bi bi-file-earmark-excel-fill fs-5"></i> Exportar para Excel
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* TABELA DE RESULTADOS */}
                    <div className="mb-5">
                        <TabelaGenerica colunas={['Consultor', 'Badge', 'Data Atribuição', 'Pontos Ganhos']} emptyMessage="Nenhum badge atribuído neste período para os filtros selecionados.">
                            {dadosFiltrados.map((item) => (
                                <tr key={item.id}>
                                    <td className="fw-bold py-3 text-dark">{item.consultor}</td>
                                    <td className="py-3">
                                        <div className="fw-bold text-dark">{item.nomeBadge}</div>
                                        <div className="small text-muted">{item.area} - {formatNivel(item.nivel)}</div>
                                    </td>
                                    <td className="py-3 text-muted">{formatarData(item.data)}</td>
                                    <td className="fw-bold text-primary py-3">+{item.pontos} pts</td>
                                </tr>
                            ))}
                        </TabelaGenerica>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default BadgesAtribuidosSLL;
