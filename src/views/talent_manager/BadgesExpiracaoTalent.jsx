import React, { useState, useEffect } from 'react';
import SidebarTalent from '../../components/SidebarTalentManager';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import TabelaGenerica from '../../components/TabelaGenerica';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../assets/dashboard.css';

// Importações para Exportação PDF e Excel
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const BadgesExpiracaoTalent = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [utilizador, setUtilizador] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState('');

    const [dadosExpiracao, setDadosExpiracao] = useState([]);
    
    // Estados dos Filtros
    const [niveisAtivos, setNiveisAtivos] = useState([]);
    const [periodo, setPeriodo] = useState('Todas');
    const [serviceLine, setServiceLine] = useState('Todas');
    const [area, setArea] = useState('Todas');
    const [estrutura, setEstrutura] = useState({ serviceLines: [], areas: [] });

    // Estado para o Dropdown de Exportação
    const [exportOpen, setExportOpen] = useState(false);

    useEffect(() => {
        const userLocal = JSON.parse(sessionStorage.getItem('user'));
        if (!userLocal) {
            navigate('/');
            return;
        }
        setUtilizador(userLocal);

        // Carregar Foto
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
                console.error("Erro ao carregar a foto de perfil:", error);
            }
        };

        // Carregar Badges em Expiração da BD e Estrutura
        const carregarDados = async () => {
            try {
                const [resExpiracoes, resEstrutura] = await Promise.all([
                    axios.get('https://softinsa-api-riya.onrender.com/expiracao/badges'),
                    axios.get('https://softinsa-api-riya.onrender.com/estrutura')
                ]);

                if (resExpiracoes.data.success) {
                    setDadosExpiracao(resExpiracoes.data.data);
                }

                if (resEstrutura.data.success) {
                    setEstrutura(resEstrutura.data.data);
                }
            } catch (error) {
                console.error("Erro ao carregar dados:", error);
            } finally {
                setLoading(false);
            }
        };

        carregarFotoPerfil();
        carregarDados();
    }, [navigate]);

    const handleLogout = () => {
        sessionStorage.removeItem('user');
        navigate('/');
    };

    const alternarNivel = (nivel) => {
        if (niveisAtivos.includes(nivel)) {
            setNiveisAtivos(niveisAtivos.filter(n => n !== nivel));
        } else {
            setNiveisAtivos([...niveisAtivos, nivel]);
        }
    };

    // Função de Notificação via API
    const handleNotificar = async (item) => {
        try {
            const response = await axios.post('https://softinsa-api-riya.onrender.com/expiracao/notificar', {
                idUtilizador: item.idUtilizador,
                badgeNome: item.badge,
                diasRestantes: item.diasRestantes
            });
            
            if (response.data.success) {
                alert(`Notificação enviada com sucesso para ${item.consultor}!`);
            }
        } catch (error) {
            alert('Ocorreu um erro ao notificar o consultor.');
            console.error(error);
        }
    };

    // Função para as Cores
    const getCorDias = (dias) => {
        if (dias < 30) return '#dc3545'; // Vermelho
        if (dias < 90) return '#fd7e14'; // Laranja
        return '#198754'; // Verde
    };

    const uniqueServiceLines = ['Todas', ...(estrutura.serviceLines || []).map(sl => sl.nome)];

    const areasDisponiveis = serviceLine === 'Todas' 
        ? estrutura.areas 
        : estrutura.areas.filter(a => {
            const sl = estrutura.serviceLines.find(s => s.nome === serviceLine);
            return sl && a.slId === sl.id;
          });

    const levelToLetter = (name) => {
        const l = name.toLowerCase();
        if(l.includes('júnior') || l.includes('junior')) return 'A';
        if(l.includes('intermédio') || l.includes('intermedio')) return 'B';
        if(l.includes('sénior') || l.includes('senior')) return 'C';
        if(l.includes('especialista')) return 'D';
        if(l.includes('líder') || l.includes('lider')) return 'E';
        return name;
    };

    const niveisOpcoes = [];
    areasDisponiveis.forEach(a => {
        if (area === 'Todas' || a.nome === area) {
            a.niveisAtivos.forEach(n => {
                const letra = levelToLetter(n);
                if(!niveisOpcoes.includes(letra)) niveisOpcoes.push(letra);
            });
        }
    });
    niveisOpcoes.sort();

    // Lógica de Filtragem Cruzada
    const dadosFiltrados = dadosExpiracao.filter(item => {
        const matchNivel = niveisAtivos.length === 0 || niveisAtivos.includes(levelToLetter(item.nivel));
        const matchSL = serviceLine === 'Todas' || item.sl === serviceLine;
        const matchArea = area === 'Todas' || item.area === area;
        
        let matchPeriodo = true;
        if (periodo !== 'Todas') {
            const maxDias = parseInt(periodo) * 30; // 1 -> 30, 3 -> 90, 6 -> 180
            if (item.diasRestantes > maxDias) matchPeriodo = false;
        }

        return matchNivel && matchSL && matchArea && matchPeriodo;
    });

    // ==============================================
    // LÓGICA DE EXPORTAÇÃO
    // ==============================================
    const resumoFiltros = () => `Filtros: Service Line (${serviceLine}) | Área (${area}) | Níveis (${niveisAtivos.length ? niveisAtivos.join(', ') : 'Todos'}) | Período (${periodo === 'Todas' ? 'Todos' : `Próximos ${parseInt(periodo) * 30} dias`})`;

    const exportarPDF = () => {
        if (dadosFiltrados.length === 0) {
            alert("Não existem dados para exportar.");
            return;
        }
        try {
            const doc = new jsPDF('l', 'mm', 'a4'); // Paisagem (Landscape) para caber bem a tabela
            doc.setFontSize(16);
            doc.text(`Relatório de Badges em Risco de Expiração`, 14, 20);
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Gerado a: ${new Date().toLocaleDateString('pt-PT')} | Total: ${dadosFiltrados.length} registos`, 14, 28);
            doc.text(resumoFiltros(), 14, 35);

            const body = dadosFiltrados.map(item => [
                String(item.consultor),
                String(item.sl),
                String(item.badge),
                String(item.dataAtribuicao),
                String(item.dataExpiracao),
                `${item.diasRestantes} dias`
            ]);

            autoTable(doc, {
                startY: 42,
                head: [['Consultor', 'Service Line', 'Badge', 'Data Atribuição', 'Data Expiração', 'Tempo Restante']],
                body: body,
                theme: 'grid',
                styles: { fontSize: 8, overflow: 'linebreak' },
                headStyles: { fillColor: [52, 101, 157] } 
            });

            doc.save(`Badges_Expiracao_${new Date().toISOString().slice(0,10)}.pdf`);
        } catch (e) {
            console.error("Falha ao desenhar PDF:", e);
            alert("Erro ao montar o PDF. Verifique a consola.");
        }
    };

    const exportarExcel = () => {
        if (dadosFiltrados.length === 0) {
            alert("Não existem dados para exportar.");
            return;
        }
        try {
            const body = dadosFiltrados.map(item => ({
                'Consultor': item.consultor,
                'Service Line': item.sl,
                'Badge': item.badge,
                'Data Atribuição': item.dataAtribuicao,
                'Data Expiração': item.dataExpiracao,
                'Dias Restantes': item.diasRestantes
            }));

            const wb = XLSX.utils.book_new();
            const wsFiltros = XLSX.utils.json_to_sheet([{
                'Service Line': serviceLine,
                'Área': area,
                'Níveis': niveisAtivos.length ? niveisAtivos.join(', ') : 'Todos',
                'Período': periodo === 'Todas' ? 'Todos' : `Próximos ${parseInt(periodo) * 30} dias`,
                'Total Exportado': dadosFiltrados.length
            }]);
            XLSX.utils.book_append_sheet(wb, wsFiltros, "Filtros");
            const ws = XLSX.utils.json_to_sheet(body);
            XLSX.utils.book_append_sheet(wb, ws, "Expirações");
            
            XLSX.writeFile(wb, `Badges_Expiracao_${new Date().toISOString().slice(0,10)}.xlsx`);
        } catch (error) {
            console.error("Falha ao gerar Excel:", error);
            alert("Erro ao gerar o ficheiro Excel.");
        }
    };

    if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="d-flex bg-light min-vh-100">
            <SidebarTalent />

            <div className="flex-grow-1 p-4 dashboard-scroll">
                <div className="container-fluid text-start">
                    
                    {/* CABEÇALHO PADRONIZADO (Sem Casa) */}
                    <CabecalhoDashboard 
                        titulo="Badges Próximos de Expiração"
                        subtitulo="Acompanhe as validades e notifique os consultores"
                        utilizador={utilizador}
                        avatarUrl={avatarUrl}
                    />

                    {/* LINHA 1: Filtros de Seleção */}
                    <div className="row mb-4 g-4 align-items-end">
                        <div className="col-md-4">
                            <label className="form-label fw-bold small text-uppercase text-muted">Filtrar por Período</label>
                            <select className="form-select border-0 shadow-sm py-2 rounded-3 bg-white" value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
                                <option value="Todas">Qualquer Período</option>
                                <option value="1">Até 1 Mês (Urgentes)</option>
                                <option value="3">Até 3 Meses</option>
                                <option value="6">Até 6 Meses</option>
                            </select>
                        </div>
                        
                        {/* Service Line na direita da mesma linha */}
                        <div className="col-md-4">
                            <label className="form-label fw-bold small text-uppercase text-muted">Filtrar por Service Line</label>
                            <select 
                                className="form-select border-0 shadow-sm py-2 rounded-3 bg-white" 
                                value={serviceLine} 
                                onChange={(e) => {
                                    setServiceLine(e.target.value);
                                    setArea('Todas');
                                    setNiveisAtivos([]);
                                }}
                            >
                                {uniqueServiceLines.map(sl => (
                                    <option key={sl} value={sl}>{sl === 'Todas' ? 'Todas as Service Lines' : sl}</option>
                                ))}
                            </select>
                        </div>

                        {/* Área Dinâmica */}
                        <div className="col-md-4">
                            <label className="form-label fw-bold small text-uppercase text-muted">Filtrar por Área</label>
                            <select 
                                className="form-select border-0 shadow-sm py-2 rounded-3 bg-white" 
                                value={area} 
                                onChange={(e) => {
                                    setArea(e.target.value);
                                    setNiveisAtivos([]);
                                }}
                            >
                                <option value="Todas">Todas as Áreas</option>
                                {areasDisponiveis.map(a => (
                                    <option key={a.id} value={a.nome}>{a.nome}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* LINHA 2: Níveis e Botão Exportar (Alinhado com a Service Line à esquerda do seu container) */}
                    <div className="talent-expiracao-export-row row mb-5 align-items-end">
                        <div className="col-md-9">
                            <label className="form-label fw-bold small text-uppercase text-muted ms-2">Nível de Competência</label>
                            <div className="d-flex gap-2 ms-2 flex-wrap">
                                {niveisOpcoes.length === 0 && <span className="text-muted small py-2">Sem níveis para os filtros atuais</span>}
                                {niveisOpcoes.map(n => {
                                    const nivelNameMap = {'A':'Júnior', 'B':'Intermédio', 'C':'Sénior', 'D':'Especialista', 'E':'Líder de Conhecimento'};
                                    const nomeExibicao = nivelNameMap[n] ? `Nível ${nivelNameMap[n]} (${n})` : `Nível (${n})`;
                                    return (
                                        <button 
                                            key={n}
                                            onClick={() => alternarNivel(n)}
                                            className={`btn shadow-sm fw-bold px-4 py-2 rounded-pill transition-all ${
                                                niveisAtivos.includes(n) ? 'btn-primary' : 'bg-white text-muted border-0'
                                            }`}
                                            style={{fontSize: '14px'}}
                                        >
                                            {nomeExibicao}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        
                        {/* Dropdown de Exportação */}
                        <div className="col-md-3 position-relative align-self-end">
                            <button 
                                onClick={() => setExportOpen(!exportOpen)} 
                                className="btn btn-outline-primary w-100 py-2 rounded-3 fw-bold bg-white d-flex align-items-center justify-content-between px-4 shadow-sm"
                            >
                                <span><i className="bi bi-download me-2"></i> Exportar Relatório</span>
                                <i className={`bi bi-chevron-${exportOpen ? 'up' : 'down'}`}></i>
                            </button>

                            {/* Menu Dropdown */}
                            {exportOpen && (
                                <div className="position-absolute w-100 bg-white border border-light shadow rounded-3 p-2 mt-2 z-3" style={{ top: '100%', left: '0' }}>
                                        <button 
                                            onClick={() => { exportarPDF(); setExportOpen(false); }} 
                                            className="btn btn-light w-100 text-start text-danger fw-bold mb-1 border-0"
                                        >
                                            <i className="bi bi-file-earmark-pdf-fill me-2 fs-5"></i> Exportar para PDF
                                        </button>
                                        <button 
                                            onClick={() => { exportarExcel(); setExportOpen(false); }} 
                                            className="btn btn-light w-100 text-start text-success fw-bold border-0"
                                        >
                                            <i className="bi bi-file-earmark-excel-fill me-2 fs-5"></i> Exportar para Excel
                                        </button>
                                    </div>
                                )}
                        </div>
                    </div>

                    {/* Tabela de Expiração */}
                    <h5 className="fw-bold mb-3 text-dark">Badges em risco de expiração ({dadosFiltrados.length})</h5>
                    <TabelaGenerica 
                        colunas={['Consultor', 'Service Line', 'Badge', 'Data Atribuição', 'Data Expiração', 'Ações']}
                        emptyMessage="Nenhum badge corresponde aos filtros atuais."
                    >
                        {dadosFiltrados.map((item, index) => {
                            const cor = getCorDias(item.diasRestantes);
                            return (
                                <tr key={index}>
                                    <td className="fw-bold text-dark py-3">{item.consultor}</td>
                                    <td className="text-muted py-3">{item.sl}</td>
                                    <td className="fw-bold text-primary py-3">{item.badge}</td>
                                    <td className="text-muted py-3">{item.dataAtribuicao}</td>
                                    <td className="py-3">
                                        <span className="d-block fw-bold" style={{ color: cor }}>{item.dataExpiracao}</span>
                                        <div className="small mt-1">
                                            <span 
                                                className="fw-bold" 
                                                style={{ 
                                                    color: cor, 
                                                    textDecoration: 'underline', 
                                                    textDecorationColor: cor, 
                                                    textDecorationThickness: '2px',
                                                    textUnderlineOffset: '3px'
                                                }}>
                                                {item.diasRestantes} dias restantes
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-3">
                                        <button 
                                            className="talent-notificar-btn btn btn-primary btn-sm px-3 rounded-pill fw-bold shadow-sm"
                                            onClick={() => handleNotificar(item)}
                                        >
                                            <i className="bi bi-bell-fill me-2"></i>Notificar
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </TabelaGenerica>
                </div>
            </div>
        </div>
    );
};

export default BadgesExpiracaoTalent;
