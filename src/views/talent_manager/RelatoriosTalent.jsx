import React, { useState, useEffect } from 'react';
import SidebarTalent from '../../components/SidebarTalentManager';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../assets/dashboard.css';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const RelatoriosTalent = () => {
    const navigate = useNavigate();
    const [utilizador, setUtilizador] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const [periodo, setPeriodo] = useState('Todos');
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    const [slFiltro, setSlFiltro] = useState('Todas');
    const [areaFiltro, setAreaFiltro] = useState('Todas');
    const [niveisSelecionados, setNiveisSelecionados] = useState([]);
    const [pesquisa, setPesquisa] = useState('');
    const [estrutura, setEstrutura] = useState({ serviceLines: [], areas: [] });

    // Estados das Checkboxes
    const [opcoesConteudo, setOpcoesConteudo] = useState({
        taxaAprovacao: false,
        rankingConsultores: false,
        badgesObtidos: false,
        pedidosPendentes: false,
        todosPedidos: false,
        catalogoBadges: false,
        historicoDecisoes: false,
        badgesExpiracao: false
    });

    const conteudosMap = [
        { key: 'taxaAprovacao', label: "Incluir Métricas de Taxa de Aprovação e Rejeição" },
        { key: 'rankingConsultores', label: "Incluir Ranking de Consultores" },
        { key: 'badgesObtidos', label: "Incluir Detalhes de Badges Obtidos" },
        { key: 'pedidosPendentes', label: "Incluir Detalhes de Pedidos Pendentes" },
        { key: 'todosPedidos', label: "Incluir Todos os Pedidos e Estados" },
        { key: 'catalogoBadges', label: "Incluir Catálogo de Badges Disponíveis" },
        { key: 'historicoDecisoes', label: "Incluir Histórico de Decisões" },
        { key: 'badgesExpiracao', label: "Incluir Análise de Badges em Expiração" }
    ];

    useEffect(() => {
        const userLocal = JSON.parse(sessionStorage.getItem('user'));
        if (!userLocal) {
            navigate('/');
            return;
        }
        setUtilizador(userLocal);

        const carregarDados = async () => {
            try {
                const [resUser, resEstrutura] = await Promise.all([
                    axios.get(`http://localhost:3000/users/configuracoes/${userLocal.ID_UTILIZADOR}`),
                    axios.get('http://localhost:3000/estrutura')
                ]);
                
                if (resUser.data.success && resUser.data.data.avatar) {
                    setAvatarUrl(resUser.data.data.avatar);
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
                
                if (resEstrutura.data.success) {
                    setEstrutura(resEstrutura.data.data);
                }
            } catch (error) {
                console.error("Erro dados:", error);
            }
        };
        carregarDados();
    }, [navigate]);

    const handleLogout = () => {
        sessionStorage.removeItem('user');
        navigate('/');
    };

    const uniqueServiceLines = ['Todas', ...(estrutura.serviceLines || []).map(sl => sl.nome)];
    const uniqueAreas = ['Todas', ...(estrutura.areas || [])
        .filter(a => {
            if (slFiltro === 'Todas') return true;
            const slMatch = estrutura.serviceLines?.find(s => s.nome === slFiltro);
            return slMatch ? a.slId === slMatch.id : true;
        })
        .map(a => a.nome)];

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
        const slMatch = estrutura.serviceLines?.find(s => s.nome === slFiltro);
        if (slFiltro !== 'Todas' && slMatch && a.slId !== slMatch.id) return;
        if (areaFiltro !== 'Todas' && a.nome !== areaFiltro) return;

        a.niveisAtivos.forEach(n => {
            const letter = nameToLetter(n);
            if(!todosNiveis.includes(letter)) todosNiveis.push(letter);
        });
    });
    todosNiveis.sort();

    // Se a lista de níveis selecionados estiver vazia ou com níveis que já não pertencem ao novo filtro, atualizamos
    useEffect(() => {
        if (estrutura.areas.length > 0) {
            const niveisAtuaisValidos = niveisSelecionados.filter(n => todosNiveis.includes(n));
            if (niveisAtuaisValidos.length === 0 && todosNiveis.length > 0) {
                setNiveisSelecionados([...todosNiveis]);
            }
        }
    }, [slFiltro, areaFiltro, estrutura]);

    const limparFiltros = () => {
        setPeriodo('Todos'); setDataInicio(''); setDataFim('');
        setSlFiltro('Todas'); setAreaFiltro('Todas'); setPesquisa('');
        setNiveisSelecionados([]);
        setOpcoesConteudo({
            taxaAprovacao: false, rankingConsultores: false, badgesObtidos: false, 
            pedidosPendentes: false, todosPedidos: false, catalogoBadges: false,
            historicoDecisoes: false, badgesExpiracao: false
        });
    };

    const toggleNivel = (n) => {
        if (niveisSelecionados.includes(n)) {
            setNiveisSelecionados(niveisSelecionados.filter(item => item !== n));
        } else {
            setNiveisSelecionados([...niveisSelecionados, n]);
        }
    };

    const handleCheckboxChange = (key) => {
        setOpcoesConteudo(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // ==============================================
    // LÓGICA DE GERAÇÃO E EXPORTAÇÃO
    // ==============================================
    const gerarRelatorio = async (formato) => {
        if (!Object.values(opcoesConteudo).some(v => v)) {
            alert("Por favor, selecione pelo menos uma opção de conteúdo para o relatório.");
            return;
        }

        setIsGenerating(true);

        try {
            const payload = {
                idUtilizadorAtivo: utilizador.ID_UTILIZADOR,
                formatoExportacao: formato,
                filtros: { periodo, dataInicio, dataFim, sl: slFiltro, area: areaFiltro, niveis: niveisSelecionados, pesquisa },
                opcoes: opcoesConteudo
            };

            // Aponta para a nova rota que acabámos de criar no Backend
            const response = await axios.post('http://localhost:3000/relatorios/tm/gerar', payload);
            
            if (response.data.success) {
                const dados = response.data.data;
                if (formato === 'PDF') exportarPDF(dados);
                else exportarExcel(dados);
            }
        } catch (error) {
            console.error("Erro ao gerar relatório:", error);
            alert("Ocorreu um erro ao gerar o relatório.");
        } finally {
            setIsGenerating(false);
        }
    };

    // --- EXPORTAR PDF ---
    const exportarPDF = (dados) => {
        try {
            const doc = new jsPDF('p', 'mm', 'a4');
            let currentY = 20;
            
            doc.setFontSize(18);
            doc.text(`Relatório Global - Talent Manager`, 14, currentY);
            doc.setFontSize(10);
            doc.setTextColor(100);
            currentY += 8;
            doc.text(`Gerado a: ${new Date().toLocaleDateString('pt-PT')} | Filtros Aplicados: SL(${slFiltro}) Área(${areaFiltro}) Níveis(${niveisSelecionados.join(',')})`, 14, currentY);
            currentY += 15;

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
                        headStyles: { fillColor: [52, 101, 157] }
                    });
                    
                    currentY = doc.lastAutoTable.finalY + 15;
                    if (currentY > 270) { doc.addPage(); currentY = 20; }
                }
            };

            if (dados.taxaAprovacao) {
                desenharTabela("Métricas Gerais de Pedidos", ['Estado', 'Total'], [
                    ['Aceites', dados.taxaAprovacao.aprovados],
                    ['Recusados', dados.taxaAprovacao.rejeitados],
                    ['Pendentes', dados.taxaAprovacao.pendentes]
                ]);
            }
            if (dados.rankingConsultores) {
                desenharTabela("Top Consultores (Ranking)", ['Posição', 'Nome', 'Pontos'], dados.rankingConsultores.map((r, i) => [`${i+1}º`, r.nome, r.pontos]));
            }
            if (dados.badgesObtidos) {
                desenharTabela("Últimos Badges Atribuídos", ['Consultor', 'Badge', 'Área', 'Pontos', 'Data'], dados.badgesObtidos.map(b => [b.consultor, b.badge, b.area, b.pontos, b.data]));
            }
            if (dados.pedidosPendentes) {
                desenharTabela("Pedidos Pendentes de Análise", ['ID', 'Consultor', 'Badge', 'Data Submissão'], dados.pedidosPendentes.map(p => [p.id, p.consultor, p.badge, p.data]));
            }
            if (dados.todosPedidos) {
                desenharTabela("Todos os Pedidos", ['ID', 'Consultor', 'Badge', 'Estado', 'Submissão', 'Atualização'], dados.todosPedidos.map(p => [p.id, p.consultor, p.badge, p.estado, p.submissao, p.ultimaAtualizacao]));
            }
            if (dados.catalogoBadges) {
                desenharTabela("Catálogo de Badges", ['ID', 'Badge', 'Service Line / Área', 'Nível', 'Pontos', 'Validade'], dados.catalogoBadges.map(b => [b.id, b.nome, b.categoria, b.nivel, b.pontos, b.validade]));
            }
            if (dados.historicoDecisoes) {
                desenharTabela("Histórico de Decisões Recentes", ['ID', 'Consultor', 'Badge', 'Status', 'Data'], dados.historicoDecisoes.map(p => [p.id, p.consultor, p.badge, p.status, p.data]));
            }
            if (dados.badgesExpiracao) {
                desenharTabela("Badges Próximos de Expirar", ['Consultor', 'Badge', 'Data Expiração'], dados.badgesExpiracao.map(b => [b.consultor, b.badge, b.expiraEm]));
            }

            doc.save(`Relatorio_TalentManager_${new Date().toISOString().slice(0,10)}.pdf`);
        } catch (e) {
            console.error("Falha ao desenhar PDF:", e);
            alert("Erro ao montar o PDF. Verifique a consola.");
        }
    };

    // --- EXPORTAR EXCEL ---
    const exportarExcel = (dados) => {
        try {
            const wb = XLSX.utils.book_new();

            if (dados.taxaAprovacao) {
                const ws = XLSX.utils.json_to_sheet([
                    { Estado: 'Aceites', Total: dados.taxaAprovacao.aprovados }, 
                    { Estado: 'Recusados', Total: dados.taxaAprovacao.rejeitados }, 
                    { Estado: 'Pendentes', Total: dados.taxaAprovacao.pendentes }
                ]);
                XLSX.utils.book_append_sheet(wb, ws, "Métricas Pedidos");
            }
            if (dados.rankingConsultores && dados.rankingConsultores.length > 0) {
                const ws = XLSX.utils.json_to_sheet(dados.rankingConsultores.map((r, i) => ({ Posicao: i+1, Nome: r.nome, Pontos: r.pontos })));
                XLSX.utils.book_append_sheet(wb, ws, "Ranking");
            }
            if (dados.badgesObtidos && dados.badgesObtidos.length > 0) {
                const ws = XLSX.utils.json_to_sheet(dados.badgesObtidos);
                XLSX.utils.book_append_sheet(wb, ws, "Badges Atribuídos");
            }
            if (dados.pedidosPendentes && dados.pedidosPendentes.length > 0) {
                const ws = XLSX.utils.json_to_sheet(dados.pedidosPendentes);
                XLSX.utils.book_append_sheet(wb, ws, "Pedidos Pendentes");
            }
            if (dados.todosPedidos && dados.todosPedidos.length > 0) {
                const ws = XLSX.utils.json_to_sheet(dados.todosPedidos);
                XLSX.utils.book_append_sheet(wb, ws, "Todos os Pedidos");
            }
            if (dados.catalogoBadges && dados.catalogoBadges.length > 0) {
                const ws = XLSX.utils.json_to_sheet(dados.catalogoBadges);
                XLSX.utils.book_append_sheet(wb, ws, "Catálogo de Badges");
            }
            if (dados.historicoDecisoes && dados.historicoDecisoes.length > 0) {
                const ws = XLSX.utils.json_to_sheet(dados.historicoDecisoes);
                XLSX.utils.book_append_sheet(wb, ws, "Histórico");
            }
            if (dados.badgesExpiracao && dados.badgesExpiracao.length > 0) {
                const ws = XLSX.utils.json_to_sheet(dados.badgesExpiracao);
                XLSX.utils.book_append_sheet(wb, ws, "Expirações");
            }

            XLSX.writeFile(wb, `Relatorio_TalentManager_${new Date().toISOString().slice(0,10)}.xlsx`);
        } catch (e) {
            console.error("Falha ao gerar Excel:", e);
            alert("Erro ao montar o Excel.");
        }
    };

    return (
        <div className="d-flex bg-light min-vh-100">
            <SidebarTalent />

            <div className="flex-grow-1 p-4 dashboard-scroll text-start">
                <div className="container-fluid">
                    
                    <CabecalhoDashboard 
                        titulo="Relatórios Detalhados - Talent Manager"
                        subtitulo="Selecione os parâmetros e o tipo de dados a exportar para analisar a performance global"
                        utilizador={utilizador}
                        avatarUrl={avatarUrl}
                    />

                    <hr className="mb-4 opacity-25" />

                    {/* SECÇÃO: PERÍODO */}
                    <h5 className="fw-bold mb-3 text-dark">Período</h5>
                    <div className="row g-3 mb-4 align-items-center">
                        <div className="col-md-4">
                            <select className="form-select border-0 shadow-sm py-2 rounded-3 text-muted" value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
                                <option value="Todos">Todo o Histórico</option>
                                <option value="3">Últimos 3 meses</option>
                                <option value="6">Últimos 6 meses</option>
                                <option value="Personalizado">Personalizado</option>
                            </select>
                        </div>
                        <div className="col-md-4 d-flex align-items-center gap-2">
                            <span className="text-muted small fw-bold text-nowrap">Data Início:</span>
                            <input 
                                type="date" 
                                className="form-control border-0 py-2 shadow-sm text-muted rounded-3" 
                                value={dataInicio} 
                                onChange={(e) => setDataInicio(e.target.value)}
                                disabled={periodo !== 'Personalizado'}
                            />
                        </div>
                        <div className="col-md-4 d-flex align-items-center gap-2">
                            <span className="text-muted small fw-bold text-nowrap">Data Fim:</span>
                            <input 
                                type="date" 
                                className="form-control border-0 py-2 shadow-sm text-muted rounded-3" 
                                value={dataFim} 
                                onChange={(e) => setDataFim(e.target.value)}
                                disabled={periodo !== 'Personalizado'}
                            />
                        </div>
                    </div>

                    {/* SECÇÃO: FILTROS */}
                    <h5 className="fw-bold mb-3 mt-4 text-dark">Filtros Opcionais</h5>
                    <div className="row g-3 mb-4">
                        <div className="col-md-4">
                            <label className="fw-bold small text-muted mb-1 ms-1">Service Line</label>
                            <select className="form-select border-0 shadow-sm py-2 rounded-3 text-muted" value={slFiltro} onChange={(e) => {setSlFiltro(e.target.value); setAreaFiltro('Todas');}}>
                                <option value="Todas">Todas as Service Lines</option>
                                {estrutura.serviceLines.map(sl => (
                                    <option key={sl.id} value={sl.nome}>{sl.nome}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-4">
                            <label className="fw-bold small text-muted mb-1 ms-1">Área Preferida</label>
                            <select className="form-select border-0 shadow-sm py-2 rounded-3 text-muted" value={areaFiltro} onChange={(e) => setAreaFiltro(e.target.value)}>
                                {uniqueAreas.map(a => (
                                    <option key={a} value={a}>{a === 'Todas' ? 'Todas as Áreas' : a}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-4">
                            <div>
                                <label className="fw-bold small text-muted mb-1 ms-1 d-block text-start">Níveis de Competência</label>
                                <div className="d-flex gap-2">
                                    {todosNiveis.map(n => (
                                      <button 
                                        key={n} onClick={() => toggleNivel(n)}
                                        className={`btn shadow-sm fw-bold rounded-3 d-flex align-items-center justify-content-center p-0 ${niveisSelecionados.includes(n) ? 'btn-primary' : 'bg-white text-muted border-0'}`}
                                        style={{ width: '40px', height: '40px' }}
                                      >
                                        {n}
                                      </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECÇÃO: PESQUISA / LIMPAR */}
                    <h5 className="fw-bold mb-3 mt-4 text-dark">Foco Específico (Opcional)</h5>
                    <div className="row g-3 mb-5 align-items-center">
                        <div className="col-md-8">
                            <div className="position-relative shadow-sm">
                                <input 
                                    type="text" 
                                    className="form-control border-0 py-2 ps-4 rounded-3" 
                                    placeholder="Nome do Consultor / ID do Pedido..." 
                                    value={pesquisa}
                                    onChange={(e) => setPesquisa(e.target.value)}
                                />
                                <i className="bi bi-search position-absolute end-0 top-50 translate-middle-y me-3 text-muted"></i>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <button onClick={limparFiltros} className="btn w-100 py-2 rounded-3 fw-bold text-white shadow-sm" style={{ backgroundColor: '#6c757d' }}>
                                <i className="bi bi-eraser-fill me-2"></i> Limpar Filtros
                            </button>
                        </div>
                    </div>

                    {/* SECÇÃO: CONTEÚDO DO RELATÓRIO */}
                    <div className="card border-0 shadow-sm rounded-4 p-5 mb-5 bg-white">
                        <h5 className="fw-bold mb-4 text-dark">Informações a Incluir no Relatório</h5>
                        <div className="row g-4 px-2">
                            {conteudosMap.map((item, idx) => (
                                <div key={idx} className="col-md-6 mb-2">
                                    <div className="form-check d-flex align-items-center gap-3">
                                        <input 
                                            className="form-check-input border-secondary shadow-sm" 
                                            type="checkbox" 
                                            id={`check-${item.key}`} 
                                            checked={opcoesConteudo[item.key]}
                                            onChange={() => handleCheckboxChange(item.key)}
                                            style={{ width: '22px', height: '22px', cursor: 'pointer' }} 
                                        />
                                        <label className="form-check-label text-dark fw-medium" htmlFor={`check-${item.key}`} style={{ cursor: 'pointer' }}>
                                            {item.label}
                                        </label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* BOTÕES DE GERAÇÃO */}
                    <div className="d-flex justify-content-center gap-4 mt-4 pb-5">
                        <button 
                            className="btn px-5 py-3 rounded-pill fw-bold shadow-sm d-flex align-items-center gap-3 text-white" 
                            style={{ backgroundColor: '#dc3545', border: 'none' }}
                            onClick={() => gerarRelatorio('PDF')}
                            disabled={isGenerating}
                        >
                            <i className="bi bi-file-earmark-pdf-fill fs-5"></i> 
                            {isGenerating ? 'A processar PDF...' : 'Gerar Relatório (PDF)'}
                        </button>
                        <button 
                            className="btn px-5 py-3 rounded-pill fw-bold shadow-sm d-flex align-items-center gap-3 text-white" 
                            style={{ backgroundColor: '#198754', border: 'none' }}
                            onClick={() => gerarRelatorio('EXCEL')}
                            disabled={isGenerating}
                        >
                            <i className="bi bi-file-earmark-excel-fill fs-5"></i> 
                            {isGenerating ? 'A processar Excel...' : 'Gerar Relatório (Excel)'}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default RelatoriosTalent;
