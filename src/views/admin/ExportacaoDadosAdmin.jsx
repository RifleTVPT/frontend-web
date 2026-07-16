import React, { useState, useEffect } from 'react';
import SidebarAdmin from '../../components/SidebarAdmin';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import '../../assets/dashboard.css';

const ExportacaoDadosAdmin = () => {
    const navigate = useNavigate();

    const [adminUser, setAdminUser] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState('https://via.placeholder.com/40');

    // Filtros
    const [pesquisa, setPesquisa] = useState('');
    const [periodoTempo, setPeriodoTempo] = useState('Todos');
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    const [serviceLineFilter, setServiceLineFilter] = useState('Todas');
    const [areaFilter, setAreaFilter] = useState('Todas');

    const [dbServiceLines, setDbServiceLines] = useState([]);
    const [dbAreas, setDbAreas] = useState([]);

    // Opções de Relatório
    const [opcoesSelecionadas, setOpcoesSelecionadas] = useState({
        taxas_globais: true,
        evolucao_pontos: true,
        badges_obtidos: true,
        pedidos_pendentes: true,
        decisoes_sll: true,
        ranking_global: true,
        log_acessos: true,
        expiracao_global: true
    });

    const [loadingExport, setLoadingExport] = useState(false);

    useEffect(() => {
        const userLocal = JSON.parse(sessionStorage.getItem('user'));
        if (!userLocal) { navigate('/'); return; }
        setAdminUser(userLocal);

        const fetchAvatar = async () => {
            try {
                const res = await axios.get(`https://softinsa-api-riya.onrender.com/users/configuracoes/${userLocal.ID_UTILIZADOR}`);
                if (res.data.success && res.data.data.avatar) setAvatarUrl(res.data.data.avatar);
            } catch (err) {
                console.error("Erro ao carregar avatar:", err);
            }
        };

        const fetchFiltrosBD = async () => {
            try {
                const res = await axios.get('https://softinsa-api-riya.onrender.com/estrutura');
                if(res.data.success) {
                    setDbServiceLines(res.data.data.serviceLines);
                    setDbAreas(res.data.data.areas);
                }
            } catch(e) {
                console.error("Erro a carregar SL e Áreas", e);
            }
        };

        fetchAvatar();
        fetchFiltrosBD();
    }, [navigate]);

    const handleLogout = () => {
        sessionStorage.removeItem('user');
        navigate('/');
    };

    const handleCheckToggle = (id) => {
        setOpcoesSelecionadas(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const handleLimparFiltros = () => {
        setPesquisa('');
        setPeriodoTempo('Todos');
        setDataInicio('');
        setDataFim('');
        setServiceLineFilter('Todas');
        setAreaFilter('Todas');
    };

    const handleGerarRelatorio = async (formato) => {
        setLoadingExport(true);
        try {
            const res = await axios.post('https://softinsa-api-riya.onrender.com/relatorios/admin/gerar', {
                idUtilizadorAtivo: adminUser?.ID_UTILIZADOR,
                formatoExportacao: formato,
                filtros: { pesquisa, periodoTempo, dataInicio, dataFim, serviceLineFilter, areaFilter },
                opcoes: opcoesSelecionadas
            });
            
            if(res.data.success) {
                if(formato === 'PDF') {
                    gerarPDF(res.data.data);
                } else {
                    gerarExcel(res.data.data);
                }
            } else {
                alert("Erro ao gerar: " + res.data.message);
            }
        } catch (error) {
            console.error("Erro:", error);
            alert("Erro na ligação ao servidor.");
        } finally {
            setLoadingExport(false);
        }
    };

    const filtrosResumo = () => ([
        { Filtro: 'Pesquisa', Valor: pesquisa || 'Sem pesquisa' },
        { Filtro: 'Período', Valor: periodoTempo },
        { Filtro: 'Data início', Valor: dataInicio || 'Sem limite' },
        { Filtro: 'Data fim', Valor: dataFim || 'Sem limite' },
        { Filtro: 'Service Line', Valor: serviceLineFilter },
        { Filtro: 'Área', Valor: areaFilter },
        { Filtro: 'Secções selecionadas', Valor: Object.entries(opcoesSelecionadas).filter(([, ativo]) => ativo).map(([id]) => id).join(', ') || 'Nenhuma' }
    ]);

    const adicionarSecaoPDF = (doc, titulo, head, body, yPos) => {
        if (yPos > 175) { doc.addPage(); yPos = 20; }
        doc.setFontSize(13);
        doc.text(titulo, 14, yPos);
        autoTable(doc, {
            startY: yPos + 5,
            head: [head],
            body: body.length ? body : [head.map((_, idx) => idx === 0 ? 'Sem dados' : '')],
            theme: 'grid',
            styles: { fontSize: 8, overflow: 'linebreak', cellWidth: 'wrap' },
            headStyles: { fillColor: [93, 120, 255] }
        });
        return doc.lastAutoTable.finalY + 12;
    };

    const gerarPDF = (dados) => {
        const doc = new jsPDF('l', 'mm', 'a4');
        doc.setFontSize(18);
        doc.text("Relatório Global - Administração", 14, 20);
        let yPos = 30;

        yPos = adicionarSecaoPDF(
            doc,
            'Filtros Aplicados',
            ['Filtro', 'Valor'],
            filtrosResumo().map(f => [f.Filtro, f.Valor]),
            yPos
        );

        if(dados.taxasGlobais) {
            yPos = adicionarSecaoPDF(doc, 'Métricas de Aprovação', ['Aceites', 'Recusados', 'Pendentes'], [[dados.taxasGlobais.aprovados, dados.taxasGlobais.rejeitados, dados.taxasGlobais.pendentes]], yPos);
        }

        if(dados.rankingGlobal) {
            yPos = adicionarSecaoPDF(doc, 'Ranking Global', ['Consultor', 'Pontos Totais'], dados.rankingGlobal.map(r => [r.nome, r.pontos]), yPos);
        }

        if(dados.badgesObtidos) {
            yPos = adicionarSecaoPDF(doc, 'Badges Atribuídos', ['Consultor', 'Badge', 'Data'], dados.badgesObtidos.map(b => [b.consultor, b.badge, b.data]), yPos);
        }

        if(dados.pedidosPendentes) {
            yPos = adicionarSecaoPDF(doc, 'Pedidos Pendentes', ['ID', 'Consultor', 'Badge', 'Data Submissão'], dados.pedidosPendentes.map(p => [p.id, p.consultor, p.badge, p.data]), yPos);
        }

        if(dados.historicoDecisoes) {
            yPos = adicionarSecaoPDF(doc, 'Histórico de Decisões', ['ID', 'Consultor', 'Badge', 'Status', 'Data'], dados.historicoDecisoes.map(p => [p.id, p.consultor, p.badge, p.status, p.data]), yPos);
        }

        if(dados.expiracaoGlobal) {
            yPos = adicionarSecaoPDF(doc, 'Badges em Expiração', ['Consultor', 'Badge', 'Expira Em'], dados.expiracaoGlobal.map(e => [e.consultor, e.badge, e.expiraEm]), yPos);
        }

        if(dados.evolucaoPontos) {
            yPos = adicionarSecaoPDF(doc, 'Evolução de Pontos', ['Consultor', 'Pontos', 'Motivo', 'Data'], dados.evolucaoPontos.map(h => [h.consultor, h.pontos, h.motivo, h.data]), yPos);
        }

        if(dados.logAcessos) {
            adicionarSecaoPDF(doc, 'Log de Atividade', ['Utilizador', 'Ação / Ficheiro', 'Data Hora'], dados.logAcessos.map(l => [l.admin, l.tipo, l.data]), yPos);
        }

        doc.save("Relatorio_Global_Admin.pdf");
    };

    const gerarExcel = (dados) => {
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filtrosResumo()), "Filtros");
        
        if(dados.taxasGlobais) {
            const ws = XLSX.utils.json_to_sheet([dados.taxasGlobais]);
            XLSX.utils.book_append_sheet(wb, ws, "Métricas");
        }
        if(dados.rankingGlobal) {
            const ws = XLSX.utils.json_to_sheet(dados.rankingGlobal);
            XLSX.utils.book_append_sheet(wb, ws, "Ranking");
        }
        if(dados.badgesObtidos) {
            const ws = XLSX.utils.json_to_sheet(dados.badgesObtidos);
            XLSX.utils.book_append_sheet(wb, ws, "Badges Obtidos");
        }
        if(dados.pedidosPendentes) {
            const ws = XLSX.utils.json_to_sheet(dados.pedidosPendentes);
            XLSX.utils.book_append_sheet(wb, ws, "Pedidos Pendentes");
        }
        if(dados.historicoDecisoes) {
            const ws = XLSX.utils.json_to_sheet(dados.historicoDecisoes);
            XLSX.utils.book_append_sheet(wb, ws, "Histórico Decisões");
        }
        if(dados.expiracaoGlobal) {
            const ws = XLSX.utils.json_to_sheet(dados.expiracaoGlobal);
            XLSX.utils.book_append_sheet(wb, ws, "Expiração");
        }
        if(dados.evolucaoPontos) {
            const ws = XLSX.utils.json_to_sheet(dados.evolucaoPontos);
            XLSX.utils.book_append_sheet(wb, ws, "Evolução Pontos");
        }
        if(dados.logAcessos) {
            const ws = XLSX.utils.json_to_sheet(dados.logAcessos);
            XLSX.utils.book_append_sheet(wb, ws, "Log Atividade");
        }

        XLSX.writeFile(wb, "Relatorio_Global_Admin.xlsx");
    };

    const opcoesAdminList = [
        { id: "taxas_globais", label: "Incluir Métricas de Taxa de Aprovação e Rejeição" },
        { id: "evolucao_pontos", label: "Incluir Evolução da Pontuação" },
        { id: "badges_obtidos", label: "Incluir Detalhes de Badges Obtidos" },
        { id: "pedidos_pendentes", label: "Incluir Detalhes de Pedidos Pendentes" },
        { id: "decisoes_sll", label: "Incluir Histórico de Decisões" },
        { id: "ranking_global", label: "Incluir Ranking de Consultores" },
        { id: "log_acessos", label: "Incluir Log de Acessos e Atividade" },
        { id: "expiracao_global", label: "Incluir Análise de Badges em Expiração" }
    ];

    return (
        <div className="d-flex bg-light min-vh-100">
            <SidebarAdmin />

            <div className="flex-grow-1 p-4 dashboard-scroll text-start">
                <div className="container-fluid px-md-4">
                    
                    <CabecalhoDashboard 
                        titulo="Relatórios e exportação de estatísticas"
                        subtitulo="Selecione os parâmetros para gerar e exportar relatórios detalhados sobre dados de cada Service Line, dos seus badges, utilizadores e evidências."
                        utilizador={adminUser}
                        avatarUrl={avatarUrl}
                    />

                    {/* PESQUISA DA ANÁLISE */}
                    <div className="mb-5">
                        <h4 className="fw-bold mb-3">Pesquisa da análise desejada</h4>
                        <div className="position-relative shadow-sm">
                            <input 
                                type="text" 
                                className="form-control border-0 py-3 ps-4 rounded-3 fs-5" 
                                placeholder="Pesquisar por Utilizador..."
                                value={pesquisa}
                                onChange={(e) => setPesquisa(e.target.value)}
                            />
                            <i className="bi bi-search position-absolute end-0 top-50 translate-middle-y me-4 text-muted fs-4"></i>
                        </div>
                    </div>

                    {/* PERÍODO */}
                    <div className="mb-5">
                        <h4 className="fw-bold mb-3">Período</h4>
                        <div className="row g-4 align-items-center">
                            <div className="col-md-4">
                                <select 
                                    className="form-select border-0 shadow-sm py-3 rounded-3 fs-5 text-muted"
                                    value={periodoTempo}
                                    onChange={(e) => setPeriodoTempo(e.target.value)}
                                >
                                    <option>Todos</option>
                                    <option>Últimos 3 meses</option>
                                    <option>Últimos 6 meses</option>
                                    <option>Ano Corrente</option>
                                </select>
                            </div>
                            <div className="admin-date-label col-md-1 text-start fw-bold text-muted">Data Início:</div>
                            <div className="col-md-3">
                                <div className="input-group shadow-sm rounded-3 overflow-hidden border-0">
                                    <input type="date" className="form-control border-0 py-3 fs-5" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
                                </div>
                            </div>
                            <div className="admin-date-label col-md-1 text-start fw-bold text-muted">Data Fim:</div>
                            <div className="col-md-3">
                                <div className="input-group shadow-sm rounded-3 overflow-hidden border-0">
                                    <input type="date" className="form-control border-0 py-3 fs-5" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FILTROS E LIMPAR */}
                    <div className="mb-5 mt-5">
                        <h4 className="fw-bold mb-3">Filtros para os Relatórios</h4>
                        <div className="row g-4 align-items-center">
                            <div className="col-md-4">
                                <select 
                                    className="form-select border-0 shadow-sm py-3 rounded-3 fs-5 text-muted"
                                    value={serviceLineFilter}
                                    onChange={(e) => {
                                        setServiceLineFilter(e.target.value);
                                        setAreaFilter('Todas'); // Reset área on SL change
                                    }}
                                >
                                    <option value="Todas">Todas as Service Lines</option>
                                    {dbServiceLines.map(sl => (
                                        <option key={sl.id} value={sl.nome}>{sl.nome}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-4">
                                <select 
                                    className="form-select border-0 shadow-sm py-3 rounded-3 fs-5 text-muted"
                                    value={areaFilter}
                                    onChange={(e) => setAreaFilter(e.target.value)}
                                    disabled={serviceLineFilter === 'Todas'}
                                >
                                    <option value="Todas">Todas as Áreas</option>
                                    {dbAreas
                                        .filter(a => {
                                            if (serviceLineFilter === 'Todas') return true;
                                            const slMatch = dbServiceLines.find(s => s.nome === serviceLineFilter);
                                            return slMatch && a.slId === slMatch.id;
                                        })
                                        .map(a => (
                                            <option key={a.id} value={a.nome}>{a.nome}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-4">
                                <button onClick={handleLimparFiltros} className="btn btn-secondary py-3 rounded-3 fw-bold shadow-sm border-0 d-inline-flex justify-content-center align-items-center gap-2 w-100" style={{ backgroundColor: '#5A6D90' }}>
                                    <i className="bi bi-x-lg fs-5"></i> Limpar Filtros
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* CONTEÚDO DO RELATÓRIO */}
                    <div className="mb-5 mt-5 pt-4">
                        <h4 className="fw-bold mb-4">Conteúdo do Relatório</h4>
                        <div className="row g-5">
                            {opcoesAdminList.map((item) => (
                                <div key={item.id} className="col-md-6">
                                    <div className="form-check d-flex align-items-center gap-4">
                                        <input 
                                            className="form-check-input border-dark shadow-none" 
                                            type="checkbox" 
                                            id={`check-${item.id}`} 
                                            style={{ width: '28px', height: '28px', cursor: 'pointer' }} 
                                            checked={opcoesSelecionadas[item.id] || false}
                                            onChange={() => handleCheckToggle(item.id)}
                                        />
                                        <label className="form-check-label text-dark fw-medium fs-5" htmlFor={`check-${item.id}`} style={{ cursor: 'pointer' }}>
                                            {item.label}
                                        </label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* BOTÕES DE GERAÇÃO */}
                    <div className="admin-responsive-actions admin-final-actions d-flex justify-content-center gap-5 mt-5 pt-5 pb-5">
                        <button 
                            className="btn btn-primary px-5 py-3 rounded-3 fw-bold shadow-lg d-flex align-items-center gap-3 fs-5 border-0 transition-all hover-up" 
                            style={{ backgroundColor: '#5D78FF' }}
                            onClick={() => handleGerarRelatorio('PDF')}
                            disabled={loadingExport}
                        >
                            {loadingExport ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> : <i className="bi bi-file-earmark-pdf fs-4"></i>}
                            {loadingExport ? 'A Gerar...' : 'Gerar Relatório (PDF)'}
                        </button>
                        <button 
                            className="btn btn-success px-5 py-3 rounded-3 fw-bold shadow-lg d-flex align-items-center gap-3 fs-5 border-0 transition-all hover-up" 
                            style={{ backgroundColor: '#5D78FF' }}
                            onClick={() => handleGerarRelatorio('Excel')}
                            disabled={loadingExport}
                        >
                            {loadingExport ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> : <i className="bi bi-file-earmark-excel fs-4"></i>}
                            {loadingExport ? 'A Gerar...' : 'Gerar Relatório (Excel)'}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ExportacaoDadosAdmin;
