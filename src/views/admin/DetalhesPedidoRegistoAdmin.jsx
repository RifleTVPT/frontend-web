import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import SidebarAdmin from '../../components/SidebarAdmin';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import axios from 'axios';
import '../../assets/dashboard.css';

const DetalhesPedidoRegistoAdmin = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [adminUser, setAdminUser] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState('https://via.placeholder.com/40');
    const [loading, setLoading] = useState(true);
    const [pedido, setPedido] = useState(null);

    useEffect(() => {
        const userLocal = JSON.parse(sessionStorage.getItem('user'));
        if (!userLocal) { navigate('/'); return; }
        
        setAdminUser(userLocal);

        const fetchData = async () => {
            try {
                // Fetch avatar/configurações do admin
                const resAdmin = await axios.get(`https://softinsa-api-riya.onrender.com/users/configuracoes/${userLocal.ID_UTILIZADOR}`);
                if (resAdmin.data.success && resAdmin.data.data.avatar) setAvatarUrl(resAdmin.data.data.avatar);
                
                // Fetch Detalhes do Registo
                const resPedido = await axios.get(`https://softinsa-api-riya.onrender.com/admin-users/registos/${id}`);
                if (resPedido.data.success) {
                    setPedido(resPedido.data.data);
                } else {
                    alert("Pedido não encontrado!");
                    navigate('/admin/utilizadores/pedidos');
                }
            } catch (error) {
                console.error("Erro ao carregar detalhes:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, navigate]);

    const handleLogout = () => {
        sessionStorage.removeItem('user');
        navigate('/');
    };

    const handleAceitar = async () => {
        try {
            const res = await axios.put(`https://softinsa-api-riya.onrender.com/admin-users/registos/${id}/aceitar`);
            if (res.data.success) {
                alert("Pedido aceite com sucesso!");
                navigate('/admin/utilizadores/lista');
            }
        } catch (error) {
            alert("Erro ao aceitar pedido.");
        }
    };

    const handleRecusar = async () => {
        if (!window.confirm("Pretende mesmo recusar este pedido de registo?")) return;
        try {
            const res = await axios.put(`https://softinsa-api-riya.onrender.com/admin-users/registos/${id}/recusar`);
            if (res.data.success) {
                alert("Pedido recusado.");
                navigate('/admin/utilizadores/pedidos');
            }
        } catch (error) {
            alert("Erro ao recusar pedido.");
        }
    };

    if (loading || !pedido) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="d-flex bg-light min-vh-100">
            <SidebarAdmin />
            <div className="flex-grow-1 p-4 dashboard-scroll text-start">
                <div className="container-fluid px-md-4">
                    <CabecalhoDashboard 
                        titulo={`Análise de Pedido de Registo #${pedido.id}`}
                        subtitulo=""
                        utilizador={adminUser}
                        avatarUrl={avatarUrl}
                    />

                    <Link to="/admin/utilizadores/pedidos" className="text-decoration-none text-secondary small fw-bold mb-5 d-block">
                        <i className="bi bi-arrow-left me-2"></i> Voltar aos Pedidos
                    </Link>

                    <div className="card border-0 shadow-sm rounded-4 p-5 bg-white mb-5">
                        <div className="row g-5">
                            <div className="col-md-4 text-center border-end">
                                <div className="bg-light rounded-circle mx-auto mb-4 d-flex align-items-center justify-content-center border" style={{width: '180px', height: '180px'}}>
                                    <i className="bi bi-person-bounding-box fs-1 text-secondary opacity-50"></i>
                                </div>
                                <h4 className="fw-bold">{pedido.nome}</h4>
                                <p className="text-muted">Pedido efetuado em {pedido.data}</p>
                            </div>
                            <div className="col-md-8">
                                <h5 className="fw-bold border-bottom pb-2 mb-4">Dados da Candidatura</h5>
                                <div className="row g-4 fs-5">
                                    <div className="col-md-6"><strong>Email:</strong> <span className="text-muted">{pedido.email}</span></div>
                                    <div className="col-md-6"><strong>Perfis:</strong> <span className="text-muted">{pedido.perfis}</span></div>
                                    <div className="col-md-6"><strong>Service Line:</strong> <span className="text-muted">{pedido.sl}</span></div>
                                    <div className="col-md-6"><strong>Área principal:</strong> <span className="text-muted">{pedido.area}</span></div>
                                </div>
                                <div className="mt-5 p-4 bg-light rounded-4">
                                    <h6 className="fw-bold mb-2">Motivação do Candidato:</h6>
                                    <p className="text-muted mb-0 italic">"{pedido.motivacao}"</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="admin-request-actions d-flex justify-content-center gap-4">
                        <button className="btn btn-success rounded-pill fw-bold shadow admin-register-decision-btn" style={{backgroundColor: '#82D674', border: 'none'}} onClick={handleAceitar}>
                            Aceitar Pedido e Criar Conta
                        </button>
                        <button className="btn btn-danger rounded-pill fw-bold shadow admin-register-decision-btn" style={{backgroundColor: '#E85353', border: 'none'}} onClick={handleRecusar}>
                            Recusar Pedido
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DetalhesPedidoRegistoAdmin;
