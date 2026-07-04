import React, { useState, useEffect } from 'react';
import SidebarTalent from '../../components/SidebarTalentManager';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import TabelaGenerica from '../../components/TabelaGenerica';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../assets/dashboard.css';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const ListaConsultoresTalent = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [utilizador, setUtilizador] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState('');
    
    // Estados da BD
    const [consultoresBase, setConsultoresBase] = useState([]);
    const [estrutura, setEstrutura] = useState({ serviceLines: [], areas: [] });
    
    // Estados para os Filtros da Lista Geral
    const [pesquisa, setPesquisa] = useState('');
    const [slFiltro, setSlFiltro] = useState('Todas');
    const [areaFiltro, setAreaFiltro] = useState('Todas');
    const [tipoRanking, setTipoRanking] = useState('Pontos Totais');

    useEffect(() => {
        const userLocal = JSON.parse(sessionStorage.getItem('user'));
        if (!userLocal) {
            navigate('/');
            return;
        }
        setUtilizador(userLocal);

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

        const fetchDados = async () => {
            try {
                const [consRes, estRes] = await Promise.all([
                    axios.get('https://softinsa-api-riya.onrender.com/talent/consultores/lista'),
                    axios.get('https://softinsa-api-riya.onrender.com/estrutura')
                ]);
                
                if (consRes.data.success) {
                    setConsultoresBase(consRes.data.data);
                }
                
                if (estRes.data.success) {
                    setEstrutura(estRes.data.data);
                }
            } catch (error) {
                console.error("Erro ao carregar dados:", error);
            } finally {
                setLoading(false);
            }
        };

        carregarFotoPerfil();
        fetchDados();
    }, [navigate]);

    const handleLogout = () => {
        sessionStorage.removeItem('user');
        navigate('/');
    };

    // Extração Dinâmica de Filtros a partir da API
    const uniqueServiceLines = ['Todas', ...(estrutura.serviceLines || []).map(sl => sl.nome)];
    const uniqueAreas = ['Todas', ...(estrutura.areas || [])
        .filter(a => {
            if (slFiltro === 'Todas') return true;
            const slMatch = estrutura.serviceLines?.find(s => s.nome === slFiltro);
            return slMatch ? a.slId === slMatch.id : true;
        })
        .map(a => a.nome)];

    // 1. Filtragem da Lista Geral
    const listaFiltradaGeral = consultoresBase.filter(c => 
        (pesquisa === '' || c.nome.toLowerCase().includes(pesquisa.toLowerCase())) &&
        (slFiltro === 'Todas' || c.sl === slFiltro) &&
        (areaFiltro === 'Todas' || c.area === areaFiltro)
    );

    // 2. Ordenação para o Ranking Top 5
    const top5Ranking = [...consultoresBase]
        .sort((a, b) => tipoRanking === 'Pontos Totais' ? b.pontos - a.pontos : b.badges - a.badges)
        .slice(0, 5);

    // Exportação Opcional
    const exportarExcel = () => {
        if(listaFiltradaGeral.length === 0) return alert('Sem dados para exportar');
        const ws = XLSX.utils.json_to_sheet(listaFiltradaGeral.map(c => ({
            Consultor: c.nome,
            'Service Line': c.sl,
            'Área': c.area,
            'Total Badges': c.badges,
            'Pontos Totais': c.pontos
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Consultores");
        XLSX.writeFile(wb, `Lista_Consultores_${new Date().toISOString().slice(0,10)}.xlsx`);
    };

    const exportarPDF = () => {
        if(listaFiltradaGeral.length === 0) return alert('Sem dados para exportar');
        
        const doc = new jsPDF();
        doc.text(`Lista de Consultores Ativos`, 14, 15);
        
        const tableColumn = ["Consultor", "Service Line", "Área", "Badges", "Pontos"];
        const tableRows = [];

        listaFiltradaGeral.forEach(item => {
            tableRows.push([
                item.nome || '',
                item.sl || '',
                item.area || '',
                item.badges ? item.badges.toString() : '0',
                item.pontos ? item.pontos.toString() : '0'
            ]);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 20,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [93, 120, 255] }
        });

        doc.save(`Lista_Consultores_${new Date().toISOString().slice(0,10)}.pdf`);
    };

    if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="d-flex bg-light min-vh-100">
            <SidebarTalent />
            
            <div className="flex-grow-1 p-4 dashboard-scroll">
                <div className="container-fluid text-start">
                    
                    <CabecalhoDashboard 
                        titulo="Consultores - Lista e Perfis"
                        subtitulo="Acompanhe a progressão global dos consultores"
                        utilizador={utilizador}
                        avatarUrl={avatarUrl}
                    />

                    {/* FILTROS GERAIS */}
                    <section className="mb-4">
                        <div className="position-relative mb-3 shadow-sm">
                            <input type="text" className="form-control border-0 py-2 ps-4 rounded-3" 
                                   placeholder="Pesquisar por Nome de Consultor" 
                                   value={pesquisa}
                                   onChange={(e) => setPesquisa(e.target.value)} />
                            <i className="bi bi-search position-absolute end-0 top-50 translate-middle-y me-3 text-muted"></i>
                        </div>
                        
                        <div className="row g-3 align-items-end">
                            <div className="col-md-4">
                                <label className="fw-bold small text-muted mb-1 ms-1">Service Line</label>
                                <select className="form-select border-0 shadow-sm py-2" value={slFiltro} 
                                        onChange={(e) => {setSlFiltro(e.target.value); setAreaFiltro('Todas');}}>
                                    {uniqueServiceLines.map(sl => <option key={sl} value={sl}>{sl === 'Todas' ? 'Todas as Service Lines' : sl}</option>)}
                                </select>
                            </div>
                            <div className="col-md-3">
                                <label className="fw-bold small text-muted mb-1 ms-1">Área</label>
                                <select className="form-select border-0 shadow-sm py-2" value={areaFiltro} 
                                        onChange={(e) => setAreaFiltro(e.target.value)}>
                                    {uniqueAreas.map(area => <option key={area} value={area}>{area === 'Todas' ? 'Todas as Áreas' : area}</option>)}
                                </select>
                            </div>
                            <div className="col-md-5 text-end d-flex justify-content-end align-items-center">
                                <div className="dropdown w-50">
                                    <button className="btn btn-primary rounded-3 w-100 py-2 fs-6 fw-bold shadow-sm d-flex align-items-center justify-content-center dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" style={{backgroundColor: '#5D78FF', border: 'none'}}>
                                        <i className="bi bi-download me-2 fs-5"></i> Exportar
                                    </button>
                                    <ul className="dropdown-menu shadow-sm border-0 rounded-3">
                                        <li><button className="dropdown-item d-flex align-items-center gap-2 py-2" onClick={exportarExcel}><i className="bi bi-file-earmark-excel text-success fs-5"></i> Excel (.xlsx)</button></li>
                                        <li><button className="dropdown-item d-flex align-items-center gap-2 py-2" onClick={exportarPDF}><i className="bi bi-file-earmark-pdf text-danger fs-5"></i> PDF (.pdf)</button></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* TABELA GERAL (LIMITADA A 15 PARA VISÃO INICIAL) */}
                    <section className="mb-5">
                        <h5 className="fw-bold mb-3 text-dark">Lista de Consultores Ativos ({listaFiltradaGeral.length})</h5>
                        <div className="mb-4">
                            <TabelaGenerica colunas={['Consultor', 'Service Line', 'Área', 'Badges', 'Pontos', 'Ações']} emptyMessage="Nenhum consultor encontrado.">
                                {listaFiltradaGeral.slice(0, 15).map((c) => (
                                    <tr key={c.id}>
                                        <td className="fw-bold text-dark py-3">{c.nome}</td>
                                        <td className="text-muted py-3">{c.sl}</td>
                                        <td className="text-muted py-3">{c.area}</td>
                                        <td className="fw-bold py-3">{c.badges}</td>
                                        <td className="fw-bold text-primary py-3">{c.pontos}</td>
                                        <td className="py-3">
                                            <button onClick={() => navigate(`/talent/consultores/perfil/${c.id}`)} 
                                                    className="btn btn-primary btn-sm rounded-pill px-4 fw-bold shadow-sm">
                                                Ver Perfil
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </TabelaGenerica>
                        </div>
                        {/* BOTÃO PARA VER TODOS OS CONSULTORS DA LISTA GERAL */}
                        <div className="text-center mt-3">
                            <button className="btn btn-outline-primary rounded-pill px-5 fw-bold shadow-sm bg-white"
                                    data-bs-toggle="modal" data-bs-target="#modalListaCompleta">
                                Ver Lista Completa de Consultores ({consultoresBase.length})
                            </button>
                        </div>
                    </section>

                    {/* QUADRO DE HONRA: TOP 5 RANKING */}
                    <section className="mb-5 p-4 bg-white rounded-4 shadow-sm border border-primary border-opacity-25">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h5 className="fw-bold m-0"><i className="bi bi-trophy-fill text-warning me-2"></i>Top 5 Global</h5>
                            <div className="d-flex align-items-center gap-2">
                                <span className="small fw-bold text-muted">Ordernar por:</span>
                                <select className="form-select form-select-sm border-0 bg-light fw-bold text-primary shadow-sm" 
                                        style={{width: '160px'}} value={tipoRanking} 
                                        onChange={(e) => setTipoRanking(e.target.value)}>
                                    <option>Pontos Totais</option>
                                    <option>Número de Badges</option>
                                </select>
                            </div>
                        </div>
                        <div className="mb-0">
                            <TabelaGenerica colunas={['Posição', 'Consultor', 'Service Line', tipoRanking]} emptyMessage="Sem dados para ranking.">
                                {top5Ranking.map((c, index) => (
                                    <tr key={c.id}>
                                        <td className="fw-bold py-3 text-primary fs-5">{index + 1}º</td>
                                        <td className="fw-bold text-dark py-3">{c.nome}</td>
                                        <td className="text-muted small py-3">{c.sl}</td>
                                        <td className="fw-bold fs-5 text-dark py-3">{tipoRanking === 'Pontos Totais' ? c.pontos : c.badges}</td>
                                    </tr>
                                ))}
                            </TabelaGenerica>
                        </div>
                    </section>
                </div>
            </div>

            {/* POP-UP (MODAL): LISTA COMPLETA DE TODOS OS CONSULTORES */}
            <div className="modal fade" id="modalListaCompleta" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                    <div className="modal-content border-0 shadow-lg rounded-4">
                        <div className="modal-header bg-primary text-white">
                            <h5 className="modal-title fw-bold">Diretório Completo de Consultores</h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div className="modal-body p-0">
                            <table className="table table-hover align-middle text-center mb-0">
                                <thead className="table-light sticky-top">
                                    <tr>
                                        <th className="py-3">Consultor</th>
                                        <th className="py-3">Service Line</th>
                                        <th className="py-3">Área</th>
                                        <th className="py-3">Total Pontos</th>
                                        <th className="py-3">Ação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {consultoresBase.map((c) => (
                                        <tr key={c.id}>
                                            <td className="fw-bold">{c.nome}</td>
                                            <td className="small text-muted">{c.sl}</td>
                                            <td className="small text-muted">{c.area}</td>
                                            <td className="fw-bold text-primary">{c.pontos}</td>
                                            <td>
                                                <button data-bs-dismiss="modal" onClick={() => {
                                                    setTimeout(() => {
                                                        navigate(`/talent/consultores/perfil/${c.id}`);
                                                    }, 300);
                                                }} className="btn btn-sm btn-primary rounded-pill px-3 fw-bold">Ver Perfil</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="modal-footer border-0 bg-light">
                            <button type="button" className="btn btn-secondary rounded-pill px-4 fw-bold" data-bs-dismiss="modal">Fechar Diretório</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ListaConsultoresTalent;
