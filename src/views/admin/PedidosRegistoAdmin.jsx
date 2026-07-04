import React, { useState, useEffect } from 'react';
import SidebarAdmin from '../../components/SidebarAdmin';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import TabelaGenerica from '../../components/TabelaGenerica';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../assets/dashboard.css';

const PedidosRegistoAdmin = () => {
    const navigate = useNavigate();
    
    // --- ESTADOS DO ADMIN ---
    const [adminUser, setAdminUser] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState('https://via.placeholder.com/40');
    const [loading, setLoading] = useState(true);

    // --- ESTADOS DOS FILTROS ---
    const [pesquisa, setPesquisa] = useState('');
    const [filtroPerfil, setFiltroPerfil] = useState('Perfil Solicitado');
    const [filtroSL, setFiltroSL] = useState('Service Line');
    const [dataInicial, setDataInicial] = useState('');
    const [dataFinal, setDataFinal] = useState('');
    const [estrutura, setEstrutura] = useState({ serviceLines: [], areas: [] });

    const [pedidosMock, setPedidosMock] = useState([]);

    useEffect(() => {
        const userLocal = JSON.parse(sessionStorage.getItem('user'));
        if (!userLocal) { navigate('/'); return; }
        
        setAdminUser(userLocal);

        const fetchData = async () => {
            try {
                // Fetch avatar/configurações do admin
                const resAdmin = await axios.get(`http://localhost:3000/users/configuracoes/${userLocal.ID_UTILIZADOR}`);
                if (resAdmin.data.success && resAdmin.data.data.avatar) setAvatarUrl(resAdmin.data.data.avatar);
                
                // Fetch de registos pendentes e estrutura
                const [resPedidos, resEstrutura] = await Promise.all([
                    axios.get('http://localhost:3000/admin-users/registos/pendentes'),
                    axios.get('http://localhost:3000/estrutura')
                ]);
                
                if (resPedidos.data.success) {
                    setPedidosMock(resPedidos.data.data);
                }
                
                if (resEstrutura.data.success) {
                    setEstrutura(resEstrutura.data.data);
                }
            } catch (error) {
                console.error("Erro ao carregar pedidos de registo:", error);
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

    // --- LÓGICA DE FILTRAGEM ---
    const filtrados = pedidosMock.filter(p => {
        const matchesPesquisa = p.nome.toLowerCase().includes(pesquisa.toLowerCase()) || p.email.toLowerCase().includes(pesquisa.toLowerCase());
        const matchesPerfil = filtroPerfil === 'Perfil Solicitado' || p.perfis.includes(filtroPerfil);
        const matchesSL = filtroSL === 'Service Line' || p.sl === filtroSL;
        
        let matchesData = true;
        if (dataInicial && dataFinal) {
            const dateP = new Date(p.data);
            const dateI = new Date(dataInicial);
            const dateF = new Date(dataFinal);
            matchesData = dateP >= dateI && dateP <= dateF;
        } else if (dataInicial) {
            const dateP = new Date(p.data);
            const dateI = new Date(dataInicial);
            matchesData = dateP >= dateI;
        } else if (dataFinal) {
            const dateP = new Date(p.data);
            const dateF = new Date(dataFinal);
            matchesData = dateP <= dateF;
        }

        return matchesPesquisa && matchesPerfil && matchesSL && matchesData;
    });

    if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="d-flex bg-light min-vh-100">
            <SidebarAdmin />
            <div className="flex-grow-1 p-4 dashboard-scroll text-start">
                <div className="container-fluid px-4">
                    
                    <CabecalhoDashboard 
                        titulo="Pedidos de Registo na Plataforma"
                        subtitulo="Gira os pedidos de registo efetuados por novos utilizadores."
                        utilizador={adminUser}
                        avatarUrl={avatarUrl}
                    />

                    {/* BARRA DE PESQUISA GLOBAL */}
                    <div className="mb-4">
                        <div className="position-relative shadow-sm">
                            <input 
                                type="text" 
                                className="form-control border-0 py-3 ps-4 rounded-3 fs-5" 
                                placeholder="Pesquisar por Nome ou Email do Candidato..." 
                                value={pesquisa}
                                onChange={(e) => setPesquisa(e.target.value)}
                            />
                            <i className="bi bi-search position-absolute end-0 top-50 translate-middle-y me-4 text-muted fs-4"></i>
                        </div>
                    </div>

                    {/* FILTROS DE PESQUISA ESTILIZADOS */}
                    <h5 className="fw-bold mb-3 small text-muted text-uppercase" style={{letterSpacing: '1px'}}>Filtros de Pesquisa</h5>
                    <div className="row g-3 mb-5">
                        <div className="col-md-3">
                            <select className="form-select border-0 shadow-sm py-2 fs-6 rounded-3" value={filtroPerfil} onChange={(e) => setFiltroPerfil(e.target.value)}>
                                <option>Perfil Solicitado</option>
                                <option>Consultor</option>
                                <option>Talent Manager</option>
                                <option>Service Line Leader</option>
                            </select>
                        </div>
                        <div className="col-md-3">
                            <select className="form-select border-0 shadow-sm py-2 fs-6 rounded-3" value={filtroSL} onChange={(e) => setFiltroSL(e.target.value)}>
                                <option>Service Line</option>
                                {estrutura.serviceLines.map(sl => (
                                    <option key={sl.id} value={sl.nome}>{sl.nome}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-3">
                            <div className="input-group shadow-sm rounded-3 overflow-hidden border-0">
                                <span className="input-group-text bg-white border-0 text-muted small">Início</span>
                                <input type="date" className="form-control border-0 py-2" value={dataInicial} onChange={(e) => setDataInicial(e.target.value)} />
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="input-group shadow-sm rounded-3 overflow-hidden border-0">
                                <span className="input-group-text bg-white border-0 text-muted small">Fim</span>
                                <input type="date" className="form-control border-0 py-2" value={dataFinal} onChange={(e) => setDataFinal(e.target.value)} />
                            </div>
                        </div>
                    </div>
                    
                    <div className="row g-3 mb-5">
                        <div className="col-md-3 offset-md-9">
                            <button 
                                onClick={() => { setPesquisa(''); setFiltroPerfil('Perfil Solicitado'); setFiltroSL('Service Line'); setDataInicial(''); setDataFinal(''); }}
                                className="btn btn-light bg-white border w-100 py-2 fw-bold text-muted shadow-sm rounded-3"
                            >
                                <i className="bi bi-arrow-counterclockwise me-2"></i>Limpar Filtros
                            </button>
                        </div>
                    </div>

                    {/* LISTAGEM DE PEDIDOS */}
                    <h5 className="fw-bold mb-3 text-dark">Aguardando Validação do Administrador</h5>
                    <div className="mb-5">
                        <TabelaGenerica colunas={['Candidato', 'Email Profissional', 'Perfil Desejado', 'Service Line', 'Data do Pedido', 'Ação']} emptyMessage="Nenhum pedido de registo encontrado com os filtros atuais.">
                            {filtrados && filtrados.map(p => (
                                <tr key={p.id}>
                                        <td className="fw-bold text-dark text-center py-4">{p.nome}</td>
                                    <td className="text-muted">{p.email}</td>
                                    <td>
                                        <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-3 py-2 rounded-pill">
                                            {p.perfis}
                                        </span>
                                    </td>
                                    <td className="text-muted small">{p.sl}</td>
                                    <td className="text-muted fw-medium">{p.data.split('-').reverse().join('/')}</td>
                                    <td>
                                        <button 
                                            onClick={() => navigate(`/admin/utilizadores/pedidos/detalhes/${p.id}`)} 
                                            className="btn btn-primary btn-sm rounded-pill px-4 fw-bold shadow-sm transition-all hover-scale" 
                                            style={{backgroundColor: '#5D78FF', border: 'none'}}
                                        >
                                            Ver Detalhes
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </TabelaGenerica>
                        <div className="p-3 bg-light text-center border-top small fw-bold text-muted">
                            Página 1 de 1 | Exibindo {filtrados.length} resultados
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PedidosRegistoAdmin;
