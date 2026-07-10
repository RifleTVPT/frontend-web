import React, { useState, useEffect } from 'react';
import SidebarTalent from '../../components/SidebarTalentManager';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import TabelaGenerica from '../../components/TabelaGenerica';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../assets/dashboard.css';

const PedidosPendentesTalent = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [utilizador, setUtilizador] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState('');

    // Estados dos Dados e KPIs (BD)
    const [pedidos, setPedidos] = useState([]);
    const [kpis, setKpis] = useState({ aprovadosTotal: 0, rejeitadosTotal: 0 });
    const [estrutura, setEstrutura] = useState({ serviceLines: [], areas: [] });

    const [filtroSL, setFiltroSL] = useState('Todas');
    const [pesquisa, setPesquisa] = useState('');
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');

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

        const fetchPedidos = async () => {
            try {
                const [pedidosRes, estruturaRes] = await Promise.all([
                    axios.get('https://softinsa-api-riya.onrender.com/pedidos/tm/pendentes'),
                    axios.get('https://softinsa-api-riya.onrender.com/estrutura')
                ]);
                
                if (pedidosRes.data.success) {
                    setPedidos(Array.isArray(pedidosRes.data.data) ? pedidosRes.data.data : []);
                    setKpis(pedidosRes.data.kpis || { aprovadosTotal: 0, rejeitadosTotal: 0 });
                }
                
                if (estruturaRes.data.success) {
                    setEstrutura(estruturaRes.data.data);
                }
            } catch (error) {
                console.error("Erro ao carregar dados dos pedidos pendentes:", error);
            } finally {
                setLoading(false);
            }
        };

        carregarFotoPerfil();
        fetchPedidos();
        const atualizacao = window.setInterval(fetchPedidos, 15000);
        return () => window.clearInterval(atualizacao);
    }, [navigate]);

    const handleLogout = () => {
        sessionStorage.removeItem('user');
        navigate('/');
    };

    const uniqueServiceLines = ['Todas', ...(estrutura.serviceLines || []).map(sl => sl.nome)];

    const filteredPedidos = pedidos.filter(p => {
        let matchData = true;
        
        if (dataInicio || dataFim) {
            const [d, m, y] = String(p.data || '').split('/');
            const dPedido = new Date(y, Number(m) - 1, d);
            
            if (dataInicio) {
                const start = new Date(dataInicio);
                start.setHours(0, 0, 0, 0);
                if (dPedido < start) matchData = false;
            }
            if (dataFim) {
                const end = new Date(dataFim);
                end.setHours(23, 59, 59, 999);
                if (dPedido > end) matchData = false;
            }
        }

        return matchData &&
            (filtroSL === 'Todas' || p.sl === filtroSL) &&
            (String(p.consultor || '').toLowerCase().includes(pesquisa.toLowerCase()) ||
             String(p.badge || '').toLowerCase().includes(pesquisa.toLowerCase()) ||
             String(p.idPedido || '').toLowerCase().includes(pesquisa.toLowerCase()));
    });

    const totalPendentes = pedidos.length;

    // MATEMÁTICA DAS PERCENTAGENS
    const totalProcessados = kpis.aprovadosTotal + kpis.rejeitadosTotal;
    const percAceites = totalProcessados > 0 ? Math.round((kpis.aprovadosTotal / totalProcessados) * 100) : 0;
    const percRecusados = totalProcessados > 0 ? (100 - percAceites) : 0; // O restante para dar 100% certo

    if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="d-flex bg-light min-vh-100">
            <SidebarTalent />
            <div className="flex-grow-1 p-4 dashboard-scroll">
                <div className="container-fluid text-start">
                    
                    <CabecalhoDashboard 
                        titulo="Pedidos Pendentes"
                        subtitulo="Gira as candidaturas a badges da sua Service Line"
                        utilizador={utilizador}
                        avatarUrl={avatarUrl}
                    />

                    <div className="row g-3 mb-4">
                        <div className="col-md-4">
                            <div className="card border-primary border-2 shadow-sm p-3 text-center h-100">
                                <div className="fw-bold text-dark">Validações pendentes de decisão</div>
                                <h1 className="display-4 fw-bold text-primary">{totalPendentes}</h1>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="card border-0 shadow-sm p-3 h-100">
                                <div className="row text-center h-100 align-items-center">
                                    <div className="col-12 border-bottom pb-2">
                                        <div className="small text-muted fw-bold">Aceites Globais</div>
                                        <div className="h4 fw-bold text-success mb-0">{kpis.aprovadosTotal}</div>
                                    </div>
                                    <div className="col-12 pt-2">
                                        <div className="h5 fw-bold m-0 text-dark">{percAceites} %</div>
                                        <div className="small text-muted">Taxa de aprovação final</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                             <div className="card border-0 shadow-sm p-3 h-100">
                                <div className="row text-center h-100 align-items-center">
                                    <div className="col-12 border-bottom pb-2">
                                        <div className="small text-muted fw-bold">Recusados Globais</div>
                                        <div className="h4 fw-bold text-danger mb-0">{kpis.rejeitadosTotal}</div>
                                    </div>
                                    <div className="col-12 pt-2">
                                        <div className="h5 fw-bold m-0 text-dark">{percRecusados} %</div>
                                        <div className="small text-muted">Taxa de rejeição final</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-3 rounded-4 shadow-sm mb-4">
                        <div className="row g-3">
                            <div className="col-md-12">
                                <div className="position-relative">
                                    <input type="text" className="form-control border-0 bg-light py-2 ps-4 rounded-pill" placeholder="Pesquisar por ID / Consultor / Badge" value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} />
                                    <i className="bi bi-search position-absolute end-0 top-50 translate-middle-y me-3 text-muted"></i>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <select className="form-select border-0 bg-light py-2 rounded-3" value={filtroSL} onChange={(e) => setFiltroSL(e.target.value)}>
                                    {uniqueServiceLines.map(sl => (
                                        <option key={sl} value={sl}>{sl === 'Todas' ? 'Todas as Service Lines' : sl}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-4">
                                <div className="position-relative">
                                    <input type="date" className="form-control border-0 bg-light py-2 rounded-3 text-muted w-100" title="Data Inicial" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="position-relative">
                                    <input type="date" className="form-control border-0 bg-light py-2 rounded-3 text-muted w-100" title="Data Final" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <h5 className="fw-bold mb-3 text-dark">Pedidos ainda por Analisar ({filteredPedidos.length})</h5>
                    <div className="mb-5">
                        <TabelaGenerica colunas={['ID Pedido', 'Consultor', 'Service Line', 'Badge Pretendido', 'Data do Pedido', 'Ações']} emptyMessage="Nenhum pedido pendente com estes filtros.">
                            {filteredPedidos.map(p => (
                                <tr key={p.id}>
                                    <td className="fw-bold text-muted py-3">{p.idPedido}</td>
                                    <td className="fw-bold text-dark py-3">{p.consultor}</td>
                                    <td className="text-muted py-3">{p.sl}</td>
                                    <td className="fw-bold text-primary py-3">{p.badge}</td>
                                    <td className="py-3">{p.data}</td>
                                    <td className="py-3">
                                        <button onClick={() => navigate(`/talent/validacoes/analisar/${p.id}`)} className="btn btn-primary btn-sm rounded-pill px-3 shadow-sm fw-bold">
                                            Analisar evidências
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

export default PedidosPendentesTalent;
