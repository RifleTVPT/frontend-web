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

const formatNivel = (n) => {
    const letra = obterLetraNivel(n);
    const nomes = { A: 'Júnior', B: 'Intermédio', C: 'Sénior', D: 'Especialista', E: 'Líder de Conhecimento' };
    return letra ? `${letra} - ${nomes[letra]}` : n;
};

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

const HistoricoPedidosSLL = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    
    // --- ESTADOS DE UTILIZADOR ---
    const [utilizador, setUtilizador] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState('https://via.placeholder.com/40');
    const [minhaSL, setMinhaSL] = useState('');

    // --- ESTADOS DA API E FILTROS ---
    const [historicoBD, setHistoricoBD] = useState([]);
    const [periodo, setPeriodo] = useState('3');
    const [areaFiltro, setAreaFiltro] = useState('Todas');
    const [statusFiltro, setStatusFiltro] = useState('Todos');
    const [niveisAtivos, setNiveisAtivos] = useState([]);
    const [areasDisponiveis, setAreasDisponiveis] = useState([]);
    const [estrutura, setEstrutura] = useState({ serviceLines: [], areas: [] });

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
                const [userRes, historicoRes, estRes] = await Promise.all([
                    axios.get(`http://localhost:3000/users/configuracoes/${userLocal.ID_UTILIZADOR}`),
                    axios.get(`http://localhost:3000/pedidos/sll/historico?sl=${encodeURIComponent(slAtual)}`),
                    axios.get('http://localhost:3000/estrutura')
                ]);

                if (userRes.data.success && userRes.data.data.avatar) setAvatarUrl(userRes.data.data.avatar);

                let areasDosBadges = [];
                if (historicoRes.data.success) {
                    const dados = historicoRes.data.data;
                    setHistoricoBD(dados);
                    areasDosBadges = [...new Set(dados.map(p => p.area))];
                }

                if (estRes.data.success) {
                    setEstrutura(estRes.data.data);
                    
                    const slId = estRes.data.data.serviceLines.find(sl => sl.nome === slAtual)?.id;
                    const areasSLL = estRes.data.data.areas.filter(a => a.slId === slId);
                    const niveisParaAtivar = [];
                    areasSLL.forEach(a => {
                        a.niveisAtivos.forEach(n => {
                            if(!niveisParaAtivar.includes(n)) niveisParaAtivar.push(n);
                        });
                    });
                    setNiveisAtivos(niveisParaAtivar);

                    if (slId) {
                        const areasSLL = estRes.data.data.areas.filter(a => a.slId === slId).map(a => a.nome);
                        setAreasDisponiveis([...new Set([...areasSLL, ...areasDosBadges])]);
                    } else {
                        setAreasDisponiveis(areasDosBadges);
                    }
                } else {
                    setAreasDisponiveis(areasDosBadges);
                }
            } catch (error) {
                console.error("Erro ao carregar histórico:", error);
            } finally {
                setLoading(false);
            }
        };
        carregarDados();
        const atualizacao = window.setInterval(carregarDados, 15000);
        return () => window.clearInterval(atualizacao);
    }, [navigate]);

    const handleLogout = () => {
        sessionStorage.removeItem('user');
        navigate('/');
    };

    // --- LÓGICA DE FILTRAGEM COMBINADA ---
    const now = new Date();
    const dadosFiltrados = historicoBD.filter(p => {
        const matchStatus = statusFiltro === 'Todos' || p.status === statusFiltro;
        const matchNivel = niveisAtivos.includes(p.nivel);
        const matchArea = areaFiltro === 'Todas' || p.area === areaFiltro;

        let matchPeriodo = true;
        if (periodo !== 'Todos') {
            const dataPedido = new Date(p.dataISO);
            const diffMeses = (now.getFullYear() - dataPedido.getFullYear()) * 12 + (now.getMonth() - dataPedido.getMonth());
            if (diffMeses > parseInt(periodo)) matchPeriodo = false;
        }

        return matchStatus && matchNivel && matchArea && matchPeriodo;
    });

    const toggleNivel = (n) => {
        setNiveisAtivos(prev => prev.includes(n) ? prev.filter(i => i !== n) : [...prev, n]);
    };

    const todosNiveis = [];
    estrutura.areas.forEach(a => {
        if(a.slId === estrutura.serviceLines.find(sl => sl.nome === minhaSL)?.id) {
            a.niveisAtivos.forEach(n => {
                if(!todosNiveis.includes(n)) todosNiveis.push(n);
            });
        }
    });
    todosNiveis.sort((a, b) => formatNivel(a).localeCompare(formatNivel(b)));

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Aceite': return 'bg-success bg-opacity-10 text-success fw-bold';
            case 'Recusado': return 'bg-danger bg-opacity-10 text-danger fw-bold';
            case 'Envio de volta': return 'bg-warning bg-opacity-10 text-warning fw-bold';
            default: return 'bg-secondary bg-opacity-10 text-secondary fw-bold';
        }
    };

    // ==========================================
    // MÉTODOS DE EXPORTAÇÃO (Excel & PDF)
    // ==========================================
    const exportarExcel = (statusDesejado) => {
        const dadosExportar = dadosFiltrados.filter(p => statusDesejado === 'Todos' || p.status === statusDesejado);
        
        if (dadosExportar.length === 0) {
            alert(`Sem registos de pedidos com estado "${statusDesejado}" para exportar.`);
            return;
        }

        const body = dadosExportar.map(item => ({
            'Consultor': item.consultor,
            'Badge': `${item.badge} - ${item.area} (Nível ${obterLetraNivel(item.nivel) || item.nivel})`,
            'Data Decisão': item.data,
            'Status': item.status,
            'Comentário SLL': item.comentario
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(body);
        XLSX.utils.book_append_sheet(wb, ws, `Histórico SLL`);
        XLSX.writeFile(wb, `Historico_SLL_${statusDesejado.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.xlsx`);
    };

    const exportarPDF = (statusDesejado) => {
        const dadosExportar = dadosFiltrados.filter(p => statusDesejado === 'Todos' || p.status === statusDesejado);
        
        if (dadosExportar.length === 0) {
            alert(`Sem registos de pedidos com estado "${statusDesejado}" para exportar.`);
            return;
        }

        const doc = new jsPDF('p', 'mm', 'a4');
        let currentY = 20;

        doc.setFontSize(18);
        doc.text(`Histórico de Validações (${statusDesejado}): ${minhaSL}`, 14, currentY);
        doc.setFontSize(10);
        doc.setTextColor(100);
        currentY += 8;
        doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, currentY);
        currentY += 15;

        const corpoTabela = dadosExportar.map(item => [
            item.consultor,
            `${item.badge} - ${item.area} (Nível ${obterLetraNivel(item.nivel) || item.nivel})`,
            item.data,
            item.status,
            item.comentario
        ]);

        autoTable(doc, {
            startY: currentY,
            head: [['Consultor', 'Badge', 'Data Decisão', 'Status', 'Comentário']],
            body: corpoTabela,
            theme: 'striped',
            headStyles: { fillColor: [93, 120, 255] },
            styles: { fontSize: 9 }
        });

        doc.save(`Historico_SLL_${statusDesejado.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`);
    };

    if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="d-flex bg-light min-vh-100">
            <SidebarSLL />
            <div className="flex-grow-1 p-4 dashboard-scroll text-start">
                <div className="container-fluid text-start">
                    
                    <CabecalhoDashboard 
                        titulo={`Histórico de Pedidos - ${minhaSL}`}
                        subtitulo="Visualize a decisão tomada de todos os pedidos da sua Service Line"
                        utilizador={utilizador}
                        avatarUrl={avatarUrl}
                    />

                    {/* FILTROS ALINHADOS */}
                    <div className="row g-4 mb-4">
                        <div className="col-md-6">
                            <div className="mb-4">
                                <label className="fw-bold h5 mb-2">Período</label>
                                <select className="form-select border-0 shadow-sm py-2 rounded-3 w-75" value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
                                    <option value="Todos">Todo o Histórico</option>
                                    <option value="3">Últimos 3 meses</option>
                                    <option value="6">Últimos 6 meses</option>
                                    <option value="12">Último ano</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="fw-bold h5 mb-3 d-block">Status</label>
                                <div className="d-flex flex-column gap-2 ms-1">
                                    {['Aceite', 'Recusado', 'Envio de volta', 'Todos'].map(st => (
                                        <div key={st} className="form-check">
                                            <input className="form-check-input" type="radio" name="statusRadio" id={`radio-${st}`}
                                                   checked={statusFiltro === st} onChange={() => setStatusFiltro(st)} />
                                            <label className="form-check-label small fw-medium" htmlFor={`radio-${st}`}>
                                                {st} {st === 'Aceite' && <span className="text-muted" style={{fontSize: '11px'}}>(publicados)</span>}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="col-md-6">
                            <div className="mb-4">
                                <label className="fw-bold h5 mb-2">Área de Competência</label>
                                <select className="form-select border-0 shadow-sm py-2 rounded-3 w-75" value={areaFiltro} onChange={(e) => setAreaFiltro(e.target.value)}>
                                    <option value="Todas">Todas as Áreas</option>
                                    {areasDisponiveis.map(area => (
                                        <option key={area} value={area}>{area}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="fw-bold h5 mb-3 d-block">Nível de Competência</label>
                                <div className="d-flex gap-2">
                                    {todosNiveis.length === 0 && <span className="text-muted small py-2">Sem níveis configurados na sua Service Line</span>}
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
                    </div>

                    <h4 className="fw-bold mb-4 text-dark mt-5">Detalhes das decisões sobre os Pedidos ({dadosFiltrados.length})</h4>

                    <div className="mb-3">
                        <TabelaGenerica colunas={['Consultor', 'Badge', 'Data decisão', 'Última decisão do SLL', 'Comentário do Líder', 'Ação']} emptyMessage={
                            <div className="py-5 text-muted">
                                <i className="bi bi-inbox fs-2 d-block mb-3 opacity-25"></i>
                                Nenhum pedido encontrado para os filtros selecionados.
                            </div>
                        }>
                            {dadosFiltrados.map((p) => (
                                <tr key={p.recordKey || p.id}>
                                    <td className="fw-bold py-3">{p.consultor}</td>
                                    <td className="py-3">
                                        <div className="fw-bold text-dark">{p.badge} - {p.area} (Nível {obterLetraNivel(p.nivel) || p.nivel})</div>
                                    </td>
                                    <td className="py-3">{p.data}</td>
                                    <td className="py-3">
                                        <span className={`badge rounded-pill px-3 py-2 ${getStatusStyle(p.status)}`} style={{ minWidth: '115px', border: '1px solid currentColor' }}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="text-muted small text-truncate py-3" style={{maxWidth: '200px'}} title={p.comentario}>{p.comentario}</td>
                                    <td className="py-3">
                                        <button 
                                            onClick={() => navigate(`/sll/validacoes/validar/${p.id}?readonly=true`)} 
                                            className="btn btn-primary btn-sm rounded-pill px-3 fw-bold shadow-sm"
                                        >
                                            Ver decisão
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </TabelaGenerica>
                    </div>

                    {/* BOTÕES DE EXPORTAÇÃO (Excel & PDF via Dropdown) */}
                    <div className="d-flex justify-content-center gap-3 mt-5 mb-5 flex-wrap">
                        
                        <div className="dropdown">
                            <button className="btn btn-success px-4 py-2 rounded-3 fw-bold shadow-sm d-flex align-items-center" 
                                    style={{backgroundColor: '#82D674', border: 'none'}} type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                Exportar Aceites <i className="bi bi-chevron-down ms-2"></i>
                            </button>
                            <ul className="dropdown-menu shadow border-0 rounded-3 mt-1">
                                <li><button className="dropdown-item fw-bold text-danger py-2" onClick={() => exportarPDF('Aceite')}><i className="bi bi-file-pdf-fill me-2"></i>PDF</button></li>
                                <li><button className="dropdown-item fw-bold text-success py-2" onClick={() => exportarExcel('Aceite')}><i className="bi bi-file-excel-fill me-2"></i>Excel</button></li>
                            </ul>
                        </div>

                        <div className="dropdown">
                            <button className="btn btn-danger px-4 py-2 rounded-3 fw-bold shadow-sm d-flex align-items-center" 
                                    style={{backgroundColor: '#E85353', border: 'none'}} type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                Exportar Recusados <i className="bi bi-chevron-down ms-2"></i>
                            </button>
                            <ul className="dropdown-menu shadow border-0 rounded-3 mt-1">
                                <li><button className="dropdown-item fw-bold text-danger py-2" onClick={() => exportarPDF('Recusado')}><i className="bi bi-file-pdf-fill me-2"></i>PDF</button></li>
                                <li><button className="dropdown-item fw-bold text-success py-2" onClick={() => exportarExcel('Recusado')}><i className="bi bi-file-excel-fill me-2"></i>Excel</button></li>
                            </ul>
                        </div>

                        <div className="dropdown">
                            <button className="btn btn-warning px-4 py-2 rounded-3 fw-bold shadow-sm d-flex align-items-center text-white" 
                                    style={{backgroundColor: '#F3D458', border: 'none'}} type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                Exportar Enviados de volta <i className="bi bi-chevron-down ms-2"></i>
                            </button>
                            <ul className="dropdown-menu shadow border-0 rounded-3 mt-1">
                                <li><button className="dropdown-item fw-bold text-danger py-2" onClick={() => exportarPDF('Envio de volta')}><i className="bi bi-file-pdf-fill me-2"></i>PDF</button></li>
                                <li><button className="dropdown-item fw-bold text-success py-2" onClick={() => exportarExcel('Envio de volta')}><i className="bi bi-file-excel-fill me-2"></i>Excel</button></li>
                            </ul>
                        </div>

                        <div className="dropdown">
                            <button className="btn btn-secondary px-4 py-2 rounded-3 fw-bold shadow-sm border-0 d-flex align-items-center" 
                                    type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                Exportar Todos <i className="bi bi-chevron-down ms-2"></i>
                            </button>
                            <ul className="dropdown-menu shadow border-0 rounded-3 mt-1">
                                <li><button className="dropdown-item fw-bold text-danger py-2" onClick={() => exportarPDF('Todos')}><i className="bi bi-file-pdf-fill me-2"></i>PDF</button></li>
                                <li><button className="dropdown-item fw-bold text-success py-2" onClick={() => exportarExcel('Todos')}><i className="bi bi-file-excel-fill me-2"></i>Excel</button></li>
                            </ul>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
};

export default HistoricoPedidosSLL;
