import React, { useState, useEffect } from 'react';
import SidebarAdmin from '../../components/SidebarAdmin';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import TabelaGenerica from '../../components/TabelaGenerica';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../../assets/dashboard.css';

const AtividadeHistoricoAdmin = () => {
    const navigate = useNavigate();
    
    // --- ESTADOS DO ADMIN ---
    const [adminUser, setAdminUser] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState('https://via.placeholder.com/40');
    const [loading, setLoading] = useState(true);

    // --- MOCK DE DADOS DE ATIVIDADE ---
    const [atividadesRaw, setAtividadesRaw] = useState([]);
    const [estrutura, setEstrutura] = useState({ serviceLines: [] });

    const [pesquisa, setPesquisa] = useState('');
    const [filtroUser, setFiltroUser] = useState('Utilizador');
    const [filtroSL, setFiltroSL] = useState('Service Line');
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    const [paginaAtual, setPaginaAtual] = useState(1);
    const itensPorPagina = 10;

    useEffect(() => {
        const userLocal = JSON.parse(sessionStorage.getItem('user'));
        if (!userLocal) { navigate('/'); return; }
        
        setAdminUser(userLocal);

        const fetchData = async () => {
            try {
                // Fetch avatar do admin
                const resAdmin = await axios.get(`https://softinsa-api-riya.onrender.com/users/configuracoes/${userLocal.ID_UTILIZADOR}`);
                if (resAdmin.data.success && resAdmin.data.data.avatar) setAvatarUrl(resAdmin.data.data.avatar);
                
                // Fetch Atividades e Estrutura
                const [resAtiv, resEstrutura] = await Promise.all([
                    axios.get('https://softinsa-api-riya.onrender.com/admin-users/atividades'),
                    axios.get('https://softinsa-api-riya.onrender.com/estrutura')
                ]);
                
                if (resAtiv.data.success) {
                    setAtividadesRaw(resAtiv.data.data);
                }
                
                if (resEstrutura.data.success) {
                    setEstrutura(resEstrutura.data.data);
                }
            } catch (error) {
                console.error("Erro ao carregar atividades:", error);
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

    const atividadesFiltradas = atividadesRaw.filter(item => {
        const termo = pesquisa.toLowerCase();
        const matchPesquisa = (item.nome || '').toLowerCase().includes(termo) ||
                             (item.detalhes || '').toLowerCase().includes(termo) ||
                             (item.acao || '').toLowerCase().includes(termo);
        const matchUser = filtroUser === 'Utilizador' || item.perfil === filtroUser;
        const matchSL = filtroSL === 'Service Line' || 
                        (filtroSL === 'Global (Não definido)' && (!item.sl || item.sl === 'Global' || item.sl.includes('N/A') || item.sl === 'Global (Não definido)')) || 
                        item.sl === filtroSL;
        const dataItem = new Date(item.data);
        const matchDataInicio = dataInicio ? dataItem >= new Date(dataInicio) : true;
        const matchDataFim = dataFim ? dataItem <= new Date(dataFim) : true;
        return matchPesquisa && matchUser && matchSL && matchDataInicio && matchDataFim;
    });

    const totalPaginas = Math.ceil(atividadesFiltradas.length / itensPorPagina);
    const atividadesExibidas = atividadesFiltradas.slice((paginaAtual - 1) * itensPorPagina, paginaAtual * itensPorPagina);

    const formatarData = (dataISO) => {
        const d = new Date(dataISO);
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    };

    const resumoFiltrosExportacao = () => ([
        { Filtro: 'Pesquisa', Valor: pesquisa || 'Sem pesquisa' },
        { Filtro: 'Perfil', Valor: filtroUser },
        { Filtro: 'Service Line', Valor: filtroSL },
        { Filtro: 'Data início', Valor: dataInicio || 'Sem limite' },
        { Filtro: 'Data fim', Valor: dataFim || 'Sem limite' },
        { Filtro: 'Total exportado', Valor: atividadesFiltradas.length }
    ]);

    const exportarParaExcel = () => {
        if(atividadesFiltradas.length === 0) return alert('Sem dados para exportar');
        const ws = XLSX.utils.json_to_sheet(atividadesFiltradas.map(a => ({
            'Nome': a.nome,
            'Perfil': a.perfil,
            'Service Line': a.sl,
            'Data e Hora': formatarData(a.data),
            'Ação': a.acao,
            'Detalhes': a.detalhes
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumoFiltrosExportacao()), "Filtros");
        XLSX.utils.book_append_sheet(wb, ws, "Atividade");
        XLSX.writeFile(wb, `Log_Atividade_Softinsa_${new Date().toISOString().slice(0,10)}.xlsx`);
    };

    const exportarParaPDF = () => {
        if(atividadesFiltradas.length === 0) return alert('Sem dados para exportar');
        const doc = new jsPDF('landscape');
        
        doc.setFontSize(16);
        doc.text("Atividade e Histórico dos Utilizadores", 14, 15);
        doc.setFontSize(9);
        doc.text(`Filtros: Pesquisa=${pesquisa || 'Sem pesquisa'} | Perfil=${filtroUser} | SL=${filtroSL} | De=${dataInicio || 'Sem limite'} até ${dataFim || 'Sem limite'}`, 14, 22);
        
        const tableColumn = ["Nome", "Perfil", "Service Line", "Data e Hora", "Ação", "Detalhes"];
        const tableRows = atividadesFiltradas.map(a => [
            a.nome,
            a.perfil,
            !a.sl || a.sl === 'Global' ? 'Global (Não definido)' : a.sl,
            formatarData(a.data),
            a.acao,
            a.detalhes
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 28,
            styles: { fontSize: 8, overflow: 'linebreak', cellWidth: 'wrap' },
            columnStyles: { 5: { cellWidth: 90 } },
            headStyles: { fillColor: [93, 120, 255] }
        });

        doc.save(`Log_Atividade_Softinsa_${new Date().toISOString().slice(0,10)}.pdf`);
    };

    if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="d-flex bg-light min-vh-100">
            <SidebarAdmin />
            <div className="flex-grow-1 p-4 dashboard-scroll text-start">
                <div className="container-fluid px-md-4">
                    
                    <CabecalhoDashboard 
                        titulo="Atividade e Histórico dos Utilizadores"
                        subtitulo=""
                        utilizador={adminUser}
                        avatarUrl={avatarUrl}
                    />

                    {/* Barra de Pesquisa Mais Larga */}
                    <div className="mb-5">
                        <div className="position-relative shadow-sm">
                            <input 
                                type="text" 
                                className="form-control admin-search-input border-0 py-3 ps-4 fs-5 rounded-4" 
                                placeholder="Pesquisar por Utilizador / Tipo de Ação / Service Line..."
                                value={pesquisa}
                                onChange={(e) => setPesquisa(e.target.value)}
                            />
                            <i className="bi bi-search position-absolute end-0 top-50 translate-middle-y me-4 text-muted fs-5"></i>
                        </div>
                    </div>

                    {/* Bloco de Filtros Mais Espaçado */}
                    <div className="bg-white p-4 rounded-4 shadow-sm mb-5">
                        <h6 className="fw-bold mb-4 text-muted text-uppercase small" style={{letterSpacing: '1px'}}>Filtros de Pesquisa Avançada</h6>
                        <div className="row g-4 align-items-center">
                            <div className="col-lg-3 col-md-6">
                                <select className="form-select border-light bg-light py-2 px-3 fw-medium" value={filtroUser} onChange={(e) => setFiltroUser(e.target.value)}>
                                    <option>Utilizador</option>
                                    <option>Consultor</option>
                                    <option>Service Line Leader</option>
                                    <option>Talent Manager</option>
                                    <option>Administrador</option>
                                </select>
                            </div>
                            <div className="col-lg-4 col-md-6">
                                <div className="d-flex align-items-center gap-3 bg-light p-2 rounded border border-light">
                                    <input type="date" className="form-control form-control-sm border-0 bg-transparent" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
                                    <span className="text-muted fw-bold small">até</span>
                                    <input type="date" className="form-control form-control-sm border-0 bg-transparent" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
                                </div>
                            </div>
                            <div className="col-lg-3 col-md-6">
                                <select className="form-select border-light bg-light py-2 px-3 fw-medium" value={filtroSL} onChange={(e) => setFiltroSL(e.target.value)}>
                                    <option>Service Line</option>
                                    <option value="Global (Não definido)">Global (Não definido)</option>
                                    {estrutura.serviceLines.map(sl => (
                                        <option key={sl.id} value={sl.nome}>{sl.nome}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-lg-2 col-md-6 dropdown h-100">
                                <button className="btn btn-primary w-100 fw-bold shadow-sm h-100 py-2 dropdown-toggle" type="button" data-bs-toggle="dropdown" style={{backgroundColor: '#5D78FF', border: 'none', fontSize: '0.85rem'}}>
                                    <i className="bi bi-download me-2"></i> Exportar
                                </button>
                                <ul className="dropdown-menu shadow w-100 border-0">
                                    <li><button className="dropdown-item fw-medium small" onClick={exportarParaExcel}><i className="bi bi-file-earmark-excel text-success me-2"></i> Para Excel</button></li>
                                    <li><button className="dropdown-item fw-medium small" onClick={exportarParaPDF}><i className="bi bi-file-earmark-pdf text-danger me-2"></i> Para PDF</button></li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Tabela com Elementos Maiores */}
                    <div className="mb-4">
                        <TabelaGenerica colunas={['Nome Utilizador', 'Função / Perfil', 'Service Line', 'Data / Hora', 'Detalhes / Descrição']} emptyMessage="Sem registos para os critérios selecionados.">
                            {atividadesExibidas.map((item) => (
                                <tr key={item.id}>
                                    <td className="py-4 ps-4 fw-bold text-dark">{item.nome}</td>
                                    <td><span className="badge bg-light text-secondary border px-3 py-2 rounded-pill">{item.perfil}</span></td>
                                    <td className="text-muted">{!item.sl || item.sl === 'Global' ? 'Global (Não definido)' : item.sl}</td>
                                    <td className="fw-medium">{formatarData(item.data)}</td>
                                    <td className="pe-4 text-muted small lh-base" style={{ maxWidth: '400px' }}>{item.detalhes}</td>
                                </tr>
                            ))}
                        </TabelaGenerica>
                    </div>

                    {/* Paginação Estilizada */}
                    <div className="d-flex justify-content-between align-items-center mt-5 px-2 pb-5">
                        <div className="text-muted small fw-medium">
                            A mostrar {atividadesExibidas.length} de {atividadesFiltradas.length} resultados
                        </div>
                        <nav>
                            <ul className="pagination gap-2 m-0 border-0">
                                <li className={`page-item ${paginaAtual === 1 ? 'disabled' : ''}`}>
                                    <button className="btn btn-outline-primary rounded-circle p-2 shadow-sm" onClick={() => setPaginaAtual(prev => prev - 1)}>
                                        <i className="bi bi-chevron-left px-1"></i>
                                    </button>
                                </li>
                                <li className="page-item d-flex align-items-center px-3 fw-bold text-primary">
                                    Página {paginaAtual} de {totalPaginas || 1}
                                </li>
                                <li className={`page-item ${paginaAtual === totalPaginas || totalPaginas === 0 ? 'disabled' : ''}`}>
                                    <button className="btn btn-outline-primary rounded-circle p-2 shadow-sm" onClick={() => setPaginaAtual(prev => prev + 1)}>
                                        <i className="bi bi-chevron-right px-1"></i>
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AtividadeHistoricoAdmin;
