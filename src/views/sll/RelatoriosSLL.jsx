import React, { useState, useEffect } from 'react';
import SidebarSLL from '../../components/SidebarSLL';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { obterServiceLineSLL } from '../../utils/sllServiceLine';
import '../../assets/dashboard.css';

// Bibliotecas de exportação
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const RelatoriosSLL = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [utilizador, setUtilizador] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState('https://via.placeholder.com/40');
    const [minhaSL, setMinhaSL] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Estados dos Filtros
    const [periodo, setPeriodo] = useState('Todos');
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    const [area, setArea] = useState('Todas');
    const [niveisSelecionados, setNiveisSelecionados] = useState([]);
    const [pesquisa, setPesquisa] = useState('');
    const [estrutura, setEstrutura] = useState({ serviceLines: [], areas: [] });
    const [areasDisponiveis, setAreasDisponiveis] = useState([]);

    // Opções de conteúdo (Checkboxes)
    const [opcoes, setOpcoes] = useState({
        taxas: true,
        evolucao: false,
        badges: true,
        pendentes: false,
        todosPedidos: false,
        catalogo: false,
        historico: true,
        ranking: true,
        expiracao: false
    });

    const conteudosMap = [
        { key: "taxas", label: "Incluir Métricas de Taxa de Aprovação e Rejeição" },
        { key: "evolucao", label: "Incluir Evolução da Pontuação da Service Line" },
        { key: "badges", label: "Incluir Detalhes de Badges Obtidos na Área" },
        { key: "pendentes", label: "Incluir Detalhes de Pedidos Pendentes" },
        { key: "todosPedidos", label: "Incluir Todos os Pedidos da Service Line" },
        { key: "catalogo", label: "Incluir Catálogo de Badges da Service Line e Premium" },
        { key: "historico", label: "Incluir Histórico de Decisões do Líder" },
        { key: "ranking", label: "Incluir Ranking de Consultores da Service Line" },
        { key: "expiracao", label: "Incluir Análise de Badges em Expiração" }
    ];

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
                const [userRes, estRes, histRes] = await Promise.all([
                    axios.get(`https://softinsa-api-riya.onrender.com/users/configuracoes/${userLocal.ID_UTILIZADOR}`),
                    axios.get('https://softinsa-api-riya.onrender.com/estrutura'),
                    axios.get(`https://softinsa-api-riya.onrender.com/pedidos/sll/historico?sl=${encodeURIComponent(slAtual)}`)
                ]);
                if (userRes.data.success && userRes.data.data.avatar) {
                    setAvatarUrl(userRes.data.data.avatar);
                }
                
                let areasExtratas = [];
                if (histRes.data.success) {
                    areasExtratas = [...new Set(histRes.data.data.map(p => p.area).filter(a => a && a !== 'N/A'))];
                }

                if (estRes.data.success) {
                    setEstrutura(estRes.data.data);
                    const slId = estRes.data.data.serviceLines.find(sl => sl.nome === slAtual)?.id;
                    if (slId) {
                        const areasSLL = estRes.data.data.areas.filter(a => a.slId === slId).map(a => a.nome);
                        setAreasDisponiveis(['Todas', ...new Set(areasSLL)]);
                    } else {
                        setAreasDisponiveis(['Todas']);
                    }
                } else {
                    setAreasDisponiveis(['Todas']);
                }
            } catch (e) { 
                console.error(e); 
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

    const toggleOpcao = (key) => setOpcoes(prev => ({ ...prev, [key]: !prev[key] }));

    const limparFiltros = () => {
        setPeriodo('Todos'); setDataInicio(''); setDataFim('');
        setArea('Todas'); setNiveisSelecionados([]); setPesquisa('');
    };

    const toggleNivel = (n) => {
        if (niveisSelecionados.includes(n)) {
            setNiveisSelecionados(niveisSelecionados.filter(item => item !== n));
        } else {
            setNiveisSelecionados([...niveisSelecionados, n]);
        }
    };

    const nameToLetter = (name) => {
        if (name === 'Júnior') return 'A';
        if (name === 'Intermédio') return 'B';
        if (name === 'Sénior') return 'C';
        if (name === 'Especialista') return 'D';
        if (name === 'Líder de Conhecimento') return 'E';
        return name;
    };

    const todosNiveis = [];
    estrutura.areas.forEach(a => {
        if(a.slId === estrutura.serviceLines.find(sl => sl.nome === minhaSL)?.id) {
            if (area !== 'Todas' && a.nome !== area) return;
            a.niveisAtivos.forEach(n => {
                const letter = nameToLetter(n);
                if(!todosNiveis.includes(letter)) todosNiveis.push(letter);
            });
        }
    });
    todosNiveis.sort();

    // Limpar Níveis se deixarem de fazer sentido (ex: muda de área)
    useEffect(() => {
        const niveisValidos = niveisSelecionados.filter(n => todosNiveis.includes(n));
        if (niveisValidos.length === 0 && todosNiveis.length > 0) {
            setNiveisSelecionados([]);
        }
    }, [area, estrutura]);

    const gerarRelatorio = async (formato) => {
        if (!Object.values(opcoes).some(v => v)) {
            alert("Por favor, selecione pelo menos uma opção de conteúdo para o relatório.");
            return;
        }

        setIsGenerating(true);
        try {
            const payload = {
                idUtilizadorAtivo: utilizador.ID_UTILIZADOR,
                serviceLineSLL: minhaSL,
                formatoExportacao: formato,
                filtros: { periodo, dataInicio, dataFim, area, niveis: niveisSelecionados, pesquisa },
                opcoes: opcoes
            };

            const response = await axios.post('https://softinsa-api-riya.onrender.com/relatorios/sll/gerar', payload);
            if (response.data.success) {
                const dados = response.data.data;
                if (formato === 'PDF') exportarPDF(dados);
                else exportarExcel(dados);
            }
        } catch (error) {
            alert("Erro ao gerar relatório. Verifique a consola do servidor.");
            console.error(error);
        } finally { setIsGenerating(false); }
    };

    const exportarPDF = (dados) => {
        const doc = new jsPDF('p', 'mm', 'a4');
        let currentY = 20;

        doc.setFontSize(18);
        doc.text(`Relatório Service Line: ${minhaSL}`, 14, currentY);
        doc.setFontSize(10);
        doc.setTextColor(100);
        currentY += 8;
        doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, currentY);
        currentY += 15;

        // Função utilitária para desenhar tabelas dinamicamente
        const desenharTabela = (titulo, head, body) => {
            if (body && body.length > 0) {
                const safeBody = body.map(row => row.map(cell => cell !== null && cell !== undefined ? String(cell) : ''));
                doc.setFontSize(14);
                doc.setTextColor(0);
                doc.text(titulo, 14, currentY);
                
                autoTable(doc, {
                    startY: currentY + 5,
                    head: [head],
                    body: safeBody,
                    theme: 'grid',
                    headStyles: { fillColor: [93, 120, 255] }
                });
                
                currentY = doc.lastAutoTable.finalY + 15;
                if (currentY > 270) { doc.addPage(); currentY = 20; }
            }
        };

        if (dados.taxas) {
            desenharTabela("Métricas de Validação", ['Métrica', 'Total'], [
                ['Aceites (Publicados)', dados.taxas.aprovados],
                ['Recusados', dados.taxas.rejeitados],
                ['Pendentes (Em Análise SLL)', dados.taxas.pendentes]
            ]);
        }
        if (dados.ranking) desenharTabela("Ranking de Consultores", ['Posição', 'Consultor', 'Pontos'], dados.ranking.map((r, i) => [`${i+1}º`, r.nome, r.pontos]));
        if (dados.evolucao) desenharTabela("Evolução da Pontuação", ['Mês', 'Pontos'], dados.evolucao.map(e => [e.mes, e.pontos]));
        if (dados.badges) desenharTabela("Badges Obtidos", ['Consultor', 'Badge', 'Data Atribuição'], dados.badges.map(b => [b.consultor, b.badge, b.data]));
        if (dados.pendentes) desenharTabela("Pedidos Pendentes", ['Consultor', 'Badge', 'Data Submissão'], dados.pendentes.map(p => [p.consultor, p.badge, p.data]));
        if (dados.todosPedidos) desenharTabela("Todos os Pedidos", ['ID', 'Consultor', 'Badge', 'Estado', 'Submissão', 'Atualização'], dados.todosPedidos.map(p => [p.id, p.consultor, p.badge, p.estado, p.submissao, p.atualizacao]));
        if (dados.catalogo) desenharTabela("Catálogo de Badges", ['ID', 'Badge', 'Categoria', 'Nível', 'Pontos', 'Validade'], dados.catalogo.map(b => [b.id, b.nome, b.categoria, b.nivel, b.pontos, b.validade]));
        if (dados.historico) desenharTabela("Histórico de Decisões", ['Consultor', 'Badge', 'Status', 'Data'], dados.historico.map(p => [p.consultor, p.badge, p.status, p.data]));
        if (dados.expiracao) desenharTabela("Badges em Expiração", ['Consultor', 'Badge', 'Data Expiração'], dados.expiracao.map(e => [e.consultor, e.badge, e.expiraEm]));

        doc.save(`Relatorio_SLL_${minhaSL}_${new Date().toISOString().slice(0,10)}.pdf`);
    };

    const exportarExcel = (dados) => {
        const wb = XLSX.utils.book_new();

        if (dados.taxas) {
            const ws = XLSX.utils.json_to_sheet([
                { Metrica: 'Aceites', Total: dados.taxas.aprovados },
                { Metrica: 'Recusados', Total: dados.taxas.rejeitados },
                { Metrica: 'Pendentes de Análise', Total: dados.taxas.pendentes }
            ]);
            XLSX.utils.book_append_sheet(wb, ws, "Taxas");
        }
        if (dados.ranking && dados.ranking.length > 0) {
            const ws = XLSX.utils.json_to_sheet(dados.ranking.map((r, i) => ({ Posicao: i+1, Nome: r.nome, Pontos: r.pontos })));
            XLSX.utils.book_append_sheet(wb, ws, "Ranking");
        }
        if (dados.evolucao && dados.evolucao.length > 0) {
            const ws = XLSX.utils.json_to_sheet(dados.evolucao);
            XLSX.utils.book_append_sheet(wb, ws, "Evolução de Pontos");
        }
        if (dados.badges && dados.badges.length > 0) {
            const ws = XLSX.utils.json_to_sheet(dados.badges);
            XLSX.utils.book_append_sheet(wb, ws, "Badges");
        }
        if (dados.pendentes && dados.pendentes.length > 0) {
            const ws = XLSX.utils.json_to_sheet(dados.pendentes);
            XLSX.utils.book_append_sheet(wb, ws, "Pendentes");
        }
        if (dados.todosPedidos && dados.todosPedidos.length > 0) {
            const ws = XLSX.utils.json_to_sheet(dados.todosPedidos);
            XLSX.utils.book_append_sheet(wb, ws, "Todos os Pedidos");
        }
        if (dados.catalogo && dados.catalogo.length > 0) {
            const ws = XLSX.utils.json_to_sheet(dados.catalogo);
            XLSX.utils.book_append_sheet(wb, ws, "Catálogo");
        }
        if (dados.historico && dados.historico.length > 0) {
            const ws = XLSX.utils.json_to_sheet(dados.historico);
            XLSX.utils.book_append_sheet(wb, ws, "Histórico");
        }
        if (dados.expiracao && dados.expiracao.length > 0) {
            const ws = XLSX.utils.json_to_sheet(dados.expiracao);
            XLSX.utils.book_append_sheet(wb, ws, "Expiracao");
        }

        XLSX.writeFile(wb, `Relatorio_SLL_${minhaSL}_${new Date().toISOString().slice(0,10)}.xlsx`);
    };

    if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="d-flex bg-light min-vh-100">
            <SidebarSLL />

            <div className="flex-grow-1 p-4 dashboard-scroll text-start" style={{ overflowX: 'hidden' }}>
                <div className="container-fluid">
                    
                    <CabecalhoDashboard 
                        titulo={`Relatórios Detalhados - ${minhaSL}`}
                        subtitulo="Selecione os parâmetros e o tipo de dados a exportar para análise"
                        utilizador={utilizador}
                        avatarUrl={avatarUrl}
                    />

                    <hr className="mb-4 opacity-25" />

                    {/* SECÇÃO: PERÍODO */}
                    <div className="row g-3 mb-4">
                        <div className="col-md-4">
                            <label className="fw-bold small text-muted mb-1 ms-1 d-block text-start">Período</label>
                            <select className="form-select border-0 shadow-sm py-2 rounded-3 text-muted" value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
                                <option value="Todos">Todo o Histórico</option>
                                <option value="3">Últimos 3 meses</option>
                                <option value="6">Últimos 6 meses</option>
                                <option value="Personalizado">Data Personalizada</option>
                            </select>
                        </div>
                        <div className="col-md-4 d-flex align-items-center gap-2">
                            <span className="text-muted small fw-bold text-nowrap mt-3">Data Início:</span>
                            <input type="date" className="form-control border-0 py-2 rounded-3 shadow-sm text-muted mt-3" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} disabled={periodo !== 'Personalizado'} />
                        </div>
                        <div className="col-md-4 d-flex align-items-center gap-2">
                            <span className="text-muted small fw-bold text-nowrap mt-3">Data Fim:</span>
                            <input type="date" className="form-control border-0 py-2 rounded-3 shadow-sm text-muted mt-3" value={dataFim} onChange={(e) => setDataFim(e.target.value)} disabled={periodo !== 'Personalizado'} />
                        </div>
                    </div>

                    {/* SECÇÃO: FILTROS */}
                    <h5 className="fw-bold mb-3 mt-4 text-dark">Filtros Opcionais</h5>
                    <div className="row g-3 mb-4 mt-2">
                        <div className="col-md-4">
                            <label className="fw-bold small text-muted mb-1 ms-1 d-block text-start">Área</label>
                            <select className="form-select border-0 shadow-sm py-2 rounded-3 text-muted" value={area} onChange={(e) => setArea(e.target.value)}>
                                {areasDisponiveis.map(a => (
                                    <option key={a} value={a}>{a === 'Todas' ? 'Todas as Áreas da SL' : a}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-8">
                            <label className="fw-bold small text-muted mb-1 ms-1 d-block text-start">Nível</label>
                            <div className="d-flex gap-2 justify-content-start flex-wrap">
                                {todosNiveis.length === 0 && <span className="text-muted small py-2">Sem níveis configurados para as seleções.</span>}
                                {todosNiveis.map(n => {
                                    const nivelNameMap = {'A':'Júnior', 'B':'Intermédio', 'C':'Sénior', 'D':'Especialista', 'E':'Líder de Conhecimento'};
                                    const nomeExibicao = nivelNameMap[n] ? `Nível ${n} - ${nivelNameMap[n]}` : `Nível (${n})`;
                                    return (
                                        <button 
                                            key={n} onClick={() => toggleNivel(n)}
                                            className={`btn shadow-sm fw-bold px-4 py-2 rounded-pill ${niveisSelecionados.includes(n) ? 'btn-primary' : 'bg-white text-muted border-0'}`}
                                            style={{fontSize: '14px'}}
                                        >
                                            {nomeExibicao}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <h5 className="fw-bold mb-3 mt-4 text-dark">Foco Específico (Opcional)</h5>
                    <div className="row g-3 mb-5 align-items-center">
                        <div className="col-md-8">
                            <div className="position-relative shadow-sm">
                                <input type="text" className="form-control border-0 py-2 ps-4 rounded-3" placeholder="Filtrar por nome de consultor específico..." value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} />
                                <i className="bi bi-search position-absolute end-0 top-50 translate-middle-y me-3 text-muted"></i>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <button className="btn btn-secondary w-100 py-2 rounded-3 fw-bold shadow-sm text-white" style={{ backgroundColor: '#6c757d', border: 'none' }} onClick={limparFiltros}>
                                <i className="bi bi-eraser-fill me-2"></i> Limpar Filtros
                            </button>
                        </div>
                    </div>

                    {/* SECÇÃO: CONTEÚDO */}
                    <div className="card border-0 shadow-sm rounded-4 p-5 mb-5 bg-white overflow-hidden">
                        <h5 className="fw-bold mb-4 text-dark">Informações a Incluir no Relatório</h5>
                        <div className="row g-4 px-2">
                            {conteudosMap.map((item) => (
                                <div key={item.key} className="col-md-6 mb-2">
                                    <div className="form-check d-flex align-items-center gap-3">
                                        <input className="form-check-input border-secondary shadow-sm flex-shrink-0" type="checkbox" id={`check-${item.key}`} checked={opcoes[item.key]} onChange={() => toggleOpcao(item.key)} style={{ width: '22px', height: '22px', cursor: 'pointer' }} />
                                        <label className="form-check-label text-dark fw-medium ms-2" htmlFor={`check-${item.key}`} style={{ cursor: 'pointer' }}>{item.label}</label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* BOTÕES DE GERAÇÃO */}
                    <div className="d-flex justify-content-center flex-wrap gap-4 mt-4 pb-5">
                        <button className="btn px-5 py-3 rounded-pill fw-bold shadow-sm d-flex align-items-center justify-content-center gap-3 text-white" style={{ backgroundColor: '#dc3545', border: 'none' }} onClick={() => gerarRelatorio('PDF')} disabled={isGenerating}>
                            <i className="bi bi-file-earmark-pdf-fill fs-5"></i> {isGenerating ? 'A processar...' : 'Gerar Relatório (PDF)'}
                        </button>
                        <button className="btn px-5 py-3 rounded-pill fw-bold shadow-sm d-flex align-items-center justify-content-center gap-3 text-white" style={{ backgroundColor: '#198754', border: 'none' }} onClick={() => gerarRelatorio('EXCEL')} disabled={isGenerating}>
                            <i className="bi bi-file-earmark-excel-fill fs-5"></i> {isGenerating ? 'A processar...' : 'Gerar Relatório (Excel)'}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default RelatoriosSLL;
