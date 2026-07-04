import React, { useState, useEffect } from 'react';
import SidebarTalent from '../../components/SidebarTalentManager';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import TabelaGenerica from '../../components/TabelaGenerica';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../../assets/dashboard.css';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const HistoricoPedidosTalent = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [utilizador, setUtilizador] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState('');

    // Estados dos Dados e Filtros
    const [historico, setHistorico] = useState([]);
    const [estrutura, setEstrutura] = useState({ serviceLines: [], areas: [] });
    const [filtroStatus, setFiltroStatus] = useState('Todos');
    const [filtroSL, setFiltroSL] = useState('Todas');
    const [periodo, setPeriodo] = useState('Todos');

    useEffect(() => {
        const userLocal = JSON.parse(sessionStorage.getItem('user'));
        if (!userLocal) {
            navigate('/');
            return;
        }
        setUtilizador(userLocal);

        // Carregar Foto do BD
        const carregarFotoPerfil = async () => {
            try {
                const response = await axios.get(`https://softinsa-api-riya.onrender.com/users/configuracoes/${userLocal.ID_UTILIZADOR}`);
                if (response.data.success && response.data.data.avatar) {
                    setAvatarUrl(response.data.data.avatar);
                } else {
                    const partes = userLocal.NOME_COMPLETO_UTILIZADOR?.trim().split(/\s+/) || [];
                    let iniciais = 'TM';
                    if (partes.length > 0) {
                        iniciais = partes[0][0].toUpperCase();
                        if (partes.length > 1) {
                            iniciais += partes[partes.length - 1][0].toUpperCase();
                        }
                    }
                    setAvatarUrl(`https://ui-avatars.com/api/?name=${iniciais}&background=0d6efd&color=fff`);
                }
            } catch (error) {
                console.error("Erro foto:", error);
            }
        };

        // Carregar Histórico e Estrutura
        const fetchDados = async () => {
            try {
                const [histRes, estRes] = await Promise.all([
                    axios.get('https://softinsa-api-riya.onrender.com/pedidos/tm/historico'),
                    axios.get('https://softinsa-api-riya.onrender.com/estrutura')
                ]);

                if (histRes.data.success) {
                    setHistorico(Array.isArray(histRes.data.data) ? histRes.data.data : []);
                }

                if (estRes.data.success) {
                    setEstrutura(estRes.data.data);
                }
            } catch (error) {
                console.error("Erro ao carregar dados do histórico:", error);
            } finally {
                setLoading(false);
            }
        };

        carregarFotoPerfil();
        fetchDados();
        const atualizacao = window.setInterval(fetchDados, 15000);
        return () => window.clearInterval(atualizacao);
    }, [navigate]);

    const handleLogout = () => {
        sessionStorage.removeItem('user');
        navigate('/');
    };

    const uniqueServiceLines = ['Todas', ...(estrutura.serviceLines || []).map(sl => sl.nome)];

    // Lógica Combinada de Filtros
    const now = new Date();
    const filtrados = historico.filter(p => {
        const matchStatus = filtroStatus === 'Todos' || String(p.status || '').includes(filtroStatus);
        const matchSL = filtroSL === 'Todas' || p.sl === filtroSL;
        
        let matchPeriodo = true;
        if (periodo !== 'Todos') {
            const dataPedido = new Date(p.dataISO);
            const diffMeses = (now.getFullYear() - dataPedido.getFullYear()) * 12 + (now.getMonth() - dataPedido.getMonth());
            if (diffMeses > parseInt(periodo)) matchPeriodo = false;
        }

        return matchStatus && matchSL && matchPeriodo;
    });

    // Função de Exportação Excel
    const exportarExcel = (statusFiltro) => {
        const dados = filtrados.filter(p => statusFiltro === 'Todos' || p.status.includes(statusFiltro));
        
        if (dados.length === 0) {
            alert(`Sem registos de pedidos ${statusFiltro} para exportar.`);
            return;
        }

        const body = dados.map(item => ({
            'ID Pedido': item.id,
            'Consultor': item.consultor,
            'Service Line': item.sl,
            'Badge': item.badge,
            'Data Decisão': item.data,
            'Status': item.status,
            'Comentário': item.comentario
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(body);
        XLSX.utils.book_append_sheet(wb, ws, `Pedidos ${statusFiltro}`);
        XLSX.writeFile(wb, `Historico_Pedidos_${statusFiltro}_${new Date().toISOString().slice(0,10)}.xlsx`);
    };

    // Função de Exportação PDF
    const exportarPDF = (statusFiltro) => {
        const dados = filtrados.filter(p => statusFiltro === 'Todos' || p.status.includes(statusFiltro));
        
        if (dados.length === 0) {
            alert(`Sem registos de pedidos ${statusFiltro} para exportar.`);
            return;
        }

        const doc = new jsPDF();
        doc.text(`Historico de Pedidos - ${statusFiltro}`, 14, 15);
        
        const tableColumn = ["ID", "Consultor", "Service Line", "Badge", "Data Decisao", "Status", "Comentario"];
        const tableRows = [];

        dados.forEach(item => {
            const rowData = [
                item.id ? item.id.toString() : '',
                item.consultor || '',
                item.sl || '',
                item.badge || '',
                item.data || '',
                item.status || '',
                item.comentario || ''
            ];
            tableRows.push(rowData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 20,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: statusFiltro === 'Aceite' ? [25, 135, 84] : [220, 53, 69] }
        });

        doc.save(`Historico_Pedidos_${statusFiltro}_${new Date().toISOString().slice(0,10)}.pdf`);
    };

    if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="d-flex bg-light min-vh-100">
            <SidebarTalent />
            <div className="flex-grow-1 p-4 dashboard-scroll">
                <div className="container-fluid text-start">
                    
                    <CabecalhoDashboard 
                        titulo="Histórico de Pedidos"
                        subtitulo="Visualize e exporte o histórico de pedidos processados"
                        utilizador={utilizador}
                        avatarUrl={avatarUrl}
                    />

                    {/* Filtros: Período e Service Line */}
                    <div className="row g-4 mb-4">
                        <div className="col-md-6">
                            <label className="fw-bold text-muted small text-uppercase mb-2">Período</label>
                            <select className="form-select border-0 shadow-sm py-2 rounded-3 bg-white" value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
                                <option value="Todos">Todo o Histórico</option>
                                <option value="1">Último 1 mês</option>
                                <option value="3">Últimos 3 meses</option>
                                <option value="6">Últimos 6 meses</option>
                            </select>
                        </div>
                        <div className="col-md-6">
                            <label className="fw-bold text-muted small text-uppercase mb-2">Service Line</label>
                            <select className="form-select border-0 shadow-sm py-2 rounded-3 bg-white" value={filtroSL} onChange={(e) => setFiltroSL(e.target.value)}>
                                {uniqueServiceLines.map(sl => (
                                    <option key={sl} value={sl}>{sl === 'Todas' ? 'Todas as Service Lines' : sl}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Filtros Status e Botões Lado a Lado (Justify Content Start para alinhar à esquerda!) */}
                    <div className="row align-items-center mb-5 mt-2">
                        <div className="col-md-6">
                            <label className="fw-bold text-muted small text-uppercase d-block mb-3">Status do Pedido</label>
                            {/* Rádios sem fundo e maiores */}
                            <div className="d-flex gap-4">
                                <label className="d-flex align-items-center gap-2 fw-bold cursor-pointer text-dark">
                                    <input type="radio" name="status" className="form-check-input m-0 cursor-pointer border-secondary" style={{ width: '22px', height: '22px' }} onChange={() => setFiltroStatus('Aceite')} /> 
                                    Aceites
                                </label>
                                <label className="d-flex align-items-center gap-2 fw-bold cursor-pointer text-dark">
                                    <input type="radio" name="status" className="form-check-input m-0 cursor-pointer border-secondary" style={{ width: '22px', height: '22px' }} onChange={() => setFiltroStatus('Recusado')} /> 
                                    Recusados
                                </label>
                                <label className="d-flex align-items-center gap-2 fw-bold cursor-pointer text-dark">
                                    <input type="radio" name="status" className="form-check-input m-0 cursor-pointer border-secondary" style={{ width: '22px', height: '22px' }} defaultChecked onChange={() => setFiltroStatus('Todos')} /> 
                                    Todos
                                </label>
                            </div>
                        </div>

                        {/* Botões de Exportação alinhados à esquerda desta coluna em dropdowns */}
                        <div className="col-md-6 d-flex flex-row justify-content-start gap-3 mt-4 mt-md-0 pt-md-4">
                            <div className="dropdown">
                                <button className="btn btn-outline-success py-2 px-4 rounded-pill fw-bold shadow-sm d-flex align-items-center bg-white dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                    <i className="bi bi-download me-2 fs-5"></i> Exportar Aceites
                                </button>
                                <ul className="dropdown-menu shadow-sm border-0 rounded-3">
                                    <li><button className="dropdown-item d-flex align-items-center gap-2 py-2" onClick={() => exportarExcel('Aceite')}><i className="bi bi-file-earmark-excel text-success fs-5"></i> Excel (.xlsx)</button></li>
                                    <li><button className="dropdown-item d-flex align-items-center gap-2 py-2" onClick={() => exportarPDF('Aceite')}><i className="bi bi-file-earmark-pdf text-danger fs-5"></i> PDF (.pdf)</button></li>
                                </ul>
                            </div>
                            <div className="dropdown">
                                <button className="btn btn-outline-danger py-2 px-4 rounded-pill fw-bold shadow-sm d-flex align-items-center bg-white dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                    <i className="bi bi-download me-2 fs-5"></i> Exportar Recusados
                                </button>
                                <ul className="dropdown-menu shadow-sm border-0 rounded-3">
                                    <li><button className="dropdown-item d-flex align-items-center gap-2 py-2" onClick={() => exportarExcel('Recusado')}><i className="bi bi-file-earmark-excel text-success fs-5"></i> Excel (.xlsx)</button></li>
                                    <li><button className="dropdown-item d-flex align-items-center gap-2 py-2" onClick={() => exportarPDF('Recusado')}><i className="bi bi-file-earmark-pdf text-danger fs-5"></i> PDF (.pdf)</button></li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <h5 className="fw-bold mb-3 text-dark">Pedidos processados pelo Talent Manager ({filtrados.length})</h5>
                    <div className="mb-4">
                        <TabelaGenerica colunas={['Consultor', 'Service Line', 'Badge', 'Data decisão', 'Status final', 'Comentário', 'Ação']} emptyMessage="Nenhum registo encontrado no histórico.">
                            {filtrados.map(p => (
                                <tr key={p.recordKey || p.id}>
                                    <td className="fw-bold text-dark py-3">{p.consultor}</td>
                                    <td className="text-muted py-3">{p.sl}</td>
                                    <td className="fw-bold text-primary py-3">{p.badge}</td>
                                    <td className="py-3">{p.data}</td>
                                    <td className="py-3">
                                        <span className={`badge rounded-pill px-3 py-2 ${String(p.status || '').includes('Aceite') ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'}`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="text-muted small py-3" style={{maxWidth: '200px'}}>{p.comentario}</td>
                                    <td className="py-3">
                                        <button 
                                            onClick={() => navigate(`/talent/validacoes/analisar/${p.id}?readonly=true`)} 
                                            className="btn btn-primary btn-sm rounded-pill px-3 fw-bold shadow-sm"
                                        >
                                            Ver decisão
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </TabelaGenerica>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HistoricoPedidosTalent;
