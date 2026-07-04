import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import SidebarSLL from '../../components/SidebarSLL';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import axios from 'axios';
import '../../assets/dashboard.css';

const DetalhesPremiumSLL = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [conquista, setConquista] = useState(null);
    const [utilizador, setUtilizador] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState('https://via.placeholder.com/40');

    useEffect(() => {
        const userLocal = JSON.parse(sessionStorage.getItem('user'));
        if (!userLocal) { navigate('/'); return; }
        setUtilizador(userLocal);

        const carregarDados = async () => {
            try {
                // 1. Foto
                const resUser = await axios.get(`http://localhost:3000/users/configuracoes/${userLocal.ID_UTILIZADOR}`);
                if (resUser.data.success && resUser.data.data.avatar) setAvatarUrl(resUser.data.data.avatar);

                // 2. Detalhes Conquista
                const resDetails = await axios.get(`http://localhost:3000/conquistas/global/detalhes/${id}`);
                if (resDetails.data.success) setConquista(resDetails.data.data);
            } catch (error) {
                console.error("Erro ao carregar detalhes premium:", error);
            } finally {
                setLoading(false);
            }
        };
        carregarDados();
    }, [id, navigate]);

    const handleLogout = () => {
        sessionStorage.removeItem('user');
        navigate('/');
    };

    if (loading || !conquista) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="d-flex bg-light min-vh-100">
            <SidebarSLL />
            <div className="flex-grow-1 p-4 dashboard-scroll text-start">
                <div className="container-fluid">
                    <CabecalhoDashboard 
                        titulo={<>Detalhes do Badge: <span className="text-primary">{conquista.titulo}</span></>}
                        utilizador={utilizador}
                        avatarUrl={avatarUrl}
                        ocultarSaudacao={true}
                    />
                    <Link to="/sll/gamificacao/premium" className="text-decoration-none text-dark small fw-bold d-flex align-items-center mb-4">
                        <i className="bi bi-arrow-left me-2"></i> Voltar ao Catálogo Premium
                    </Link>

                    <div className="row g-4">
                        <div className="col-md-4">
                            <div className="card h-100 border-0 shadow-sm rounded-4 p-5 text-center bg-white">
                                <div className="d-flex justify-content-center mb-4">
                                    <div className="rounded-circle d-flex align-items-center justify-content-center shadow-lg overflow-hidden position-relative" 
                                         style={{ width: '160px', height: '160px', backgroundColor: '#FFF9E6', border: '6px solid #FFC107' }}>
                                        <i className={`bi ${conquista.icon || 'bi-trophy-fill'} text-warning position-absolute`} style={{fontSize: '5rem', zIndex: 1}}></i>
                                        {conquista.img && conquista.img !== 'N/A' && (
                                            <img src={conquista.img} alt={conquista.titulo} className="w-100 h-100 position-absolute" style={{objectFit: 'cover', zIndex: 2}} onError={(e) => { e.target.style.display = 'none'; }} />
                                        )}
                                    </div>
                                </div>
                                <h3 className="fw-bold text-dark">{conquista.titulo}</h3>
                                <span className="badge bg-warning text-dark rounded-pill px-4 py-2 mb-4 fs-6">{conquista.raridade}</span>
                                
                                <div className="mt-2">
                                   <h2 className="fw-bold text-primary m-0">+{conquista.bonus}</h2>
                                   <p className="text-muted small fw-bold text-uppercase">Pontos Bónus para o Consultor</p>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-8">
                            <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
                                <div className="mb-4 pb-3 border-bottom">
                                    <h5 className="fw-bold text-dark"><i className="bi bi-info-circle me-2 text-primary"></i>Descrição do Badge Premium</h5>
                                    <p className="text-dark mt-3 fs-5" style={{lineHeight: '1.6'}}>{conquista.descricao}</p>
                                </div>

                                <div className="mb-4 pb-3 border-bottom">
                                    <h5 className="fw-bold text-dark"><i className="bi bi-list-check me-2 text-primary"></i>Requisitos de Atribuição</h5>
                                    <p className="text-dark mt-3 fs-5" style={{lineHeight: '1.6'}}>
                                        {conquista.regras ? conquista.regras.replace('>=', 'Alcançar um mínimo de') : 'Sem requisitos definidos.'}
                                    </p>
                                </div>

                                <div className="mb-4">
                                    <h5 className="fw-bold text-dark"><i className="bi bi-graph-up-arrow me-2 text-primary"></i>Impacto na Service Line</h5>
                                    <p className="text-dark mt-3 fs-5" style={{lineHeight: '1.6'}}>{conquista.impacto}</p>
                                </div>

                                <div className="mt-auto bg-light p-3 rounded-3 border">
                                    <div className="d-flex align-items-center gap-3">
                                        <i className="bi bi-shield-lock-fill text-secondary fs-4"></i>
                                        <p className="m-0 text-muted fs-6">
                                            Estes badges são de atribuição automática pelo sistema. Utilize esta informação para incentivar a progressão dos consultores da sua Service Line.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DetalhesPremiumSLL;
