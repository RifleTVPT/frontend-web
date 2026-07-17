import React, { useState, useEffect } from 'react';
import SidebarAdmin from '../../components/SidebarAdmin';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import TabelaGenerica from '../../components/TabelaGenerica';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../assets/dashboard.css';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const PedidosBadgeAdmin = () => {
    const navigate = useNavigate();
    
    // --- ESTADOS DO ADMIN ---
    const [adminUser, setAdminUser] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState('https://via.placeholder.com/40');
    const [loading, setLoading] = useState(true);

    // --- ESTADOS DOS FILTROS ---
    const [filtroStatus, setFiltroStatus] = useState('Todos');
    const [filtroSL, setFiltroSL] = useState('Todas as Service Line');
    const [filtroArea, setFiltroArea] = useState('Todas');
    const [niveisSelecionados, setNiveisSelecionados] = useState([]);
    
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    const [estrutura, setEstrutura] = useState({ serviceLines: [], areas: [] });

    const [pedidosRaw, setPedidosRaw] = useState([]);

    useEffect(() => {
        const userLocal = JSON.parse(sessionStorage.getItem('user'));
        if (!userLocal) { navigate('/'); return; }
        
        setAdminUser(userLocal);

        const fetchData = async () => {
            try {
                // Fetch avatar/configurações do admin
                const resAdmin = await axios.get(`https://softinsa-api-riya.onrender.com/users/configuracoes/${userLocal.ID_UTILIZADOR}`);
                if (resAdmin.data.success && resAdmin.data.data.avatar) setAvatarUrl(resAdmin.data.data.avatar);
                
                // Fetch de todos os pedidos e da estrutura
                const [resPedidos, resEstrutura] = await Promise.all([
                    axios.get('https://softinsa-api-riya.onrender.com/pedidos/admin/todos'),
                    axios.get('https://softinsa-api-riya.onrender.com/estrutura')
                ]);
                
                if (resPedidos.data.success) {
                    setPedidosRaw(resPedidos.data.data);
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
        fetchData();
    }, [navigate]);

    // Lógica para obter Áreas baseadas na Service Line
    const areasDisponiveis = filtroSL === 'Todas as Service Line' ? (estrutura.areas || []) : (estrutura.areas || []).filter(a => {
        const slObj = (estrutura.serviceLines || []).find(s => s.nome === filtroSL);
        return slObj && a.slId === slObj.id;
    });

    // Lógica para obter Níveis baseados nas Áreas disponíveis
    const todosNiveis = [];
    areasDisponiveis.forEach(a => {
        if (filtroArea !== 'Todas' && a.nome !== filtroArea) return;
        if (a.niveisAtivos) {
            a.niveisAtivos.forEach((n, idx) => {
                const letra = String.fromCharCode(65 + idx);
                if (!todosNiveis.some(tn => tn.letra === letra)) {
                    todosNiveis.push({ nome: n, letra });
                }
            });
        }
    });

    todosNiveis.sort((a, b) => a.letra.localeCompare(b.letra, 'pt'));

    const toggleNivel = (nivel) => {
        setNiveisSelecionados(prev => 
            prev.includes(nivel) ? prev.filter(n => n !== nivel) : [...prev, nivel]
        );
    };

    // Reset Área se a Service Line mudar e não contiver a Área atual
    useEffect(() => {
        if (filtroArea !== 'Todas') {
            const areaAindaValida = areasDisponiveis.some(a => a.nome === filtroArea);
            if (!areaAindaValida) setFiltroArea('Todas');
        }
    }, [filtroSL, areasDisponiveis, filtroArea]);

    // Reset Níveis se não estiverem mais na lista disponível
    useEffect(() => {
        const letrasDisponiveis = new Set(todosNiveis.map(n => n.letra));
        setNiveisSelecionados(prev => {
            const filtrados = prev.filter(n => letrasDisponiveis.has(n));
            return filtrados.length === prev.length ? prev : filtrados;
        });
    }, [filtroSL, filtroArea, estrutura]);

    // --- LÓGICA DE FILTRAGEM DE PEDIDOS ---
    const pedidosFiltrados = pedidosRaw.filter(p => {
        const matchStatus = filtroStatus === 'Todos' || p.status === filtroStatus;
        const matchSL = filtroSL === 'Todas as Service Line' || p.sl === filtroSL;
        const matchArea = filtroArea === 'Todas' || p.area === filtroArea;
        const matchNivel = niveisSelecionados.length === 0 || niveisSelecionados.includes(p.nivelLetra);
        
        const dataPedido = new Date(p.data);
        const matchDataInicio = dataInicio ? dataPedido >= new Date(dataInicio) : true;
        const matchDataFim = dataFim ? dataPedido <= new Date(`${dataFim}T23:59:59.999`) : true;

        return matchStatus && matchSL && matchArea && matchNivel && matchDataInicio && matchDataFim;
    });

    const getStatusClass = (status) => {
        if (status === 'Aceite') return 'bg-success text-white shadow-sm';
        if (status === 'Recusado') return 'bg-danger text-white shadow-sm';
        if (status === 'Eliminado') return 'bg-dark text-white shadow-sm';
        if (status === 'Devolvido') return 'bg-warning text-dark shadow-sm';
        if (status === 'Em Validação') return 'bg-info text-white shadow-sm';
        return 'bg-secondary text-white shadow-sm';
    };

    const resumoFiltrosExportacao = () => ([
        { Filtro: 'Estado', Valor: filtroStatus },
        { Filtro: 'Service Line', Valor: filtroSL },
        { Filtro: 'Área', Valor: filtroArea },
        { Filtro: 'Níveis', Valor: niveisSelecionados.length ? niveisSelecionados.join(', ') : 'Todos' },
        { Filtro: 'Data início', Valor: dataInicio || 'Sem limite' },
        { Filtro: 'Data fim', Valor: dataFim || 'Sem limite' },
        { Filtro: 'Total exportado', Valor: pedidosFiltrados.length }
    ]);

    const exportarPDFExcel = (tipo) => {
        if(pedidosFiltrados.length === 0) return alert('Sem dados para exportar');
        if (tipo === 'pdf') {
            const doc = new jsPDF('l', 'mm', 'a4'); 
            doc.setFontSize(18);
            doc.text(`Histórico de Pedidos de Badge`, 14, 20);
            doc.setFontSize(9);
            doc.text(`Filtros: Estado=${filtroStatus} | SL=${filtroSL} | Área=${filtroArea} | Níveis=${niveisSelecionados.length ? niveisSelecionados.join(', ') : 'Todos'} | De=${dataInicio || 'Sem limite'} até ${dataFim || 'Sem limite'}`, 14, 28);
            
            autoTable(doc, {
                startY: 34,
                head: [['Consultor', 'Service Line', 'Área', 'Badge/Nível', 'Data', 'Status', 'Comentário']],
                body: pedidosFiltrados.map(p => [
                    p.consultor, p.sl, p.area, `${p.badge} - ${p.area} (Nível ${p.nivelLetra} - ${p.nivelExtenso})`, 
                    new Date(p.data).toLocaleDateString('pt-PT'), 
                    p.status, p.comentario || 'N/A'
                ]),
                theme: 'grid',
                styles: { fontSize: 8, overflow: 'linebreak', cellWidth: 'wrap' },
                columnStyles: { 3: { cellWidth: 70 }, 6: { cellWidth: 55 } },
                headStyles: { fillColor: [93, 120, 255] }
            });
            doc.save(`Pedidos_Badge_${new Date().toISOString().slice(0,10)}.pdf`);
        } else {
            const ws = XLSX.utils.json_to_sheet(pedidosFiltrados.map(p => ({
                'Consultor': p.consultor,
                'Service Line': p.sl,
                'Área': p.area,
                'Badge / Nível': `${p.badge} - ${p.area} (Nível ${p.nivelLetra} - ${p.nivelExtenso})`,
                'Data Submissão': new Date(p.data).toLocaleDateString('pt-PT'),
                'Status': p.status,
                'Comentário': p.comentario || 'N/A'
            })));
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumoFiltrosExportacao()), "Filtros");
            XLSX.utils.book_append_sheet(wb, ws, "Pedidos");
            XLSX.writeFile(wb, `Pedidos_Badge_${new Date().toISOString().slice(0,10)}.xlsx`);
        }
    };

    if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="d-flex bg-light min-vh-100">
            <SidebarAdmin />
            <div className="flex-grow-1 p-4 dashboard-scroll text-start">
                <div className="container-fluid px-md-4">
                    <CabecalhoDashboard 
                        titulo="Gestão Global de Pedidos de Badge"
                        subtitulo="Consulte, filtre e gira o log completo de todos os pedidos efetuados."
                        utilizador={adminUser}
                        avatarUrl={avatarUrl}
                    />

                    <div className="bg-white p-4 rounded-4 shadow-sm mb-5">
                        <div className="row g-4 mb-4">
                            {/* Service Line */}
                            <div className="col-md-4">
                                <label className="form-label fw-bold text-dark mb-2">Service Line</label>
                                <select 
                                    className="form-select border-1 py-2 fs-6 rounded-3 text-dark bg-light"
                                    value={filtroSL}
                                    onChange={(e) => setFiltroSL(e.target.value)}
                                >
                                    <option>Todas as Service Line</option>
                                    {estrutura.serviceLines.map(sl => (
                                        <option key={sl.id} value={sl.nome}>{sl.nome}</option>
                                    ))}
                                </select>
                            </div>
                            {/* Área */}
                            <div className="col-md-4">
                                <label className="form-label fw-bold text-dark mb-2">Área de Competência</label>
                                <select 
                                    className="form-select border-1 py-2 fs-6 rounded-3 text-dark bg-light"
                                    value={filtroArea}
                                    onChange={(e) => setFiltroArea(e.target.value)}
                                >
                                    <option value="Todas">Todas as Áreas</option>
                                    {areasDisponiveis.map(a => (
                                        <option key={a.id} value={a.nome}>{a.nome}</option>
                                    ))}
                                </select>
                            </div>
                            {/* Período */}
                            <div className="col-md-4 admin-log-period-filter">
                                <label className="form-label fw-bold text-dark mb-2">Período de Submissão</label>
                                <div className="admin-log-period-fields d-flex align-items-center gap-2">
                                    <input type="date" className="form-control bg-light border-1" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
                                    <span className="text-muted fw-bold">até</span>
                                    <input type="date" className="form-control bg-light border-1" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
                                </div>
                            </div>
                        </div>

                        {/* Níveis em Cascata */}
                        <div className="row mb-4">
                            <div className="col-12 text-start">
                                <label className="form-label fw-bold text-dark d-block mb-2">Nível de Competência</label>
                                <div className="d-flex gap-2 justify-content-start flex-wrap mt-2">
                                    {todosNiveis.length === 0 && <span className="text-muted small py-2">Sem níveis configurados para as seleções efetuadas.</span>}
                                    {todosNiveis.map(n => {
                                        const nomeExibicao = `Nível ${n.nome} (${n.letra})`;
                                        return (
                                            <button 
                                                key={n.letra}
                                                onClick={() => toggleNivel(n.letra)}
                                                className={`btn shadow-sm fw-bold px-4 py-2 rounded-pill ${niveisSelecionados.includes(n.letra) ? 'btn-primary' : 'btn-light text-muted border-1'}`}
                                                style={{fontSize: '13px'}}
                                            >
                                                {nomeExibicao}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="row mt-4 pt-4 border-top">
                            <div className="col-md-8">
                                <label className="form-label fw-bold text-dark mb-2">Estado do Pedido</label>
                                <div className="d-flex flex-wrap gap-2">
                                    {['Todos', 'Em Validação', 'Rascunho', 'Aceite', 'Recusado', 'Eliminado'].map(s => (
                                        <button 
                                            key={s} 
                                            onClick={() => setFiltroStatus(s)} 
                                            className={`btn btn-sm py-2 px-4 rounded-pill fw-bold shadow-sm transition-all ${filtroStatus === s ? 'btn-primary border-primary' : 'btn-light text-muted border-1'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="admin-log-export col-md-4 d-flex align-items-end justify-content-end">
                                <div className="dropdown w-100">
                                    <button className="btn btn-secondary py-2 rounded-3 fw-bold shadow-sm dropdown-toggle w-100" type="button" data-bs-toggle="dropdown" aria-expanded="false" style={{ backgroundColor: '#2B3A4A', border: 'none' }}>
                                        <i className="bi bi-download me-2"></i> Exportar Dados ({pedidosFiltrados.length})
                                    </button>
                                    <ul className="dropdown-menu shadow border-0 rounded-3 mt-2 w-100">
                                        <li><button className="dropdown-item py-2 fw-bold text-danger" onClick={() => exportarPDFExcel('pdf')}><i className="bi bi-file-earmark-pdf-fill me-2 fs-5"></i> Exportar PDF</button></li>
                                        <li><button className="dropdown-item py-2 fw-bold text-success" onClick={() => exportarPDFExcel('excel')}><i className="bi bi-file-earmark-excel-fill me-2 fs-5"></i> Exportar Excel</button></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TABELA DE PEDIDOS */}
                    <div className="mb-4">
                        <TabelaGenerica colunas={['Consultor', 'Service Line', 'Badge / Área', 'Data Envio', 'Status Final', 'Ação']} emptyMessage="Sem pedidos correspondentes aos filtros aplicados.">
                            {pedidosFiltrados && pedidosFiltrados.map(p => (
                                <tr key={p.id}>
                                    <td className="fw-bold text-dark py-4">{p.consultor}</td>
                                    <td className="text-muted">{p.sl}</td>
                                    <td>
                                        <div className="d-flex flex-column">
                                            <span className="fw-bold text-dark">{p.badge} - {p.area} <span className="text-primary">(Nível {p.nivelLetra} - {p.nivelExtenso})</span></span>
                                        </div>
                                    </td>
                                    <td className="text-muted">{new Date(p.data).toLocaleDateString('pt-PT')}</td>
                                    <td>
                                        <span className={`badge rounded-pill px-3 py-2 ${getStatusClass(p.status)}`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td>
                                        <button 
                                            onClick={() => navigate(`/admin/badges/pedidos/detalhes/${p.id}`)} 
                                            className="btn btn-primary btn-sm rounded-pill px-3 fw-bold shadow-sm text-nowrap" 
                                            style={{ backgroundColor: '#5D78FF', border: 'none', minWidth: '96px' }}
                                        >
                                            Ver detalhes
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

export default PedidosBadgeAdmin;
