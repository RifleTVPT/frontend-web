import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import SidebarAdmin from '../../components/SidebarAdmin';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import TabelaGenerica from '../../components/TabelaGenerica';
import { abrirEvidenciaProtegida } from '../../utils/evidencias';
import axios from 'axios';
import '../../assets/dashboard.css';

const DetalhesPedidoBadgeAdmin = () => {
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
                
                // Fetch Detalhes do Pedido
                const resPedido = await axios.get(`https://softinsa-api-riya.onrender.com/pedidos/detalhes/${id}`);
                if (resPedido.data.success) {
                    setPedido(resPedido.data.data);
                } else {
                    alert("Pedido não encontrado!");
                    navigate('/admin/badges/pedidos');
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

    const handleEliminar = async () => {
        if (!window.confirm("Pretende mesmo eliminar permanentemente este pedido? Esta ação não pode ser desfeita.")) return;
        
        try {
            const res = await axios.delete(`https://softinsa-api-riya.onrender.com/pedidos/admin/eliminar/${id}`);
            if (res.data.success) {
                alert("Pedido eliminado com sucesso.");
                navigate('/admin/badges/pedidos');
            }
        } catch (error) {
            alert("Erro ao eliminar o pedido.");
        }
    };

    if (loading || !pedido) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="d-flex bg-light min-vh-100">
            <SidebarAdmin />
            <div className="flex-grow-1 p-4 dashboard-scroll text-start">
                <div className="container-fluid px-md-4">
                    <CabecalhoDashboard 
                        titulo={`Validação Badge: ${pedido.titulo}`}
                        subtitulo={pedido.serviceLine}
                        utilizador={adminUser}
                        avatarUrl={avatarUrl}
                        ocultarSaudacao={true}
                    />

                    <Link to="/admin/badges/pedidos" className="text-decoration-none text-secondary small fw-bold d-flex align-items-center mb-5">
                        <i className="bi bi-arrow-left me-2"></i> Voltar à Lista de Todos os Pedidos da Plataforma
                    </Link>

                    <h3 className="text-center fw-bold text-dark mb-1" style={{ fontSize: '1.8rem' }}>Detalhes do Pedido de Badge</h3>
                    <div className="text-center mb-4">
                        <span className={`badge bg-${pedido.corStatus} px-5 py-2 rounded-3 fs-6 shadow-sm`}>{pedido.status}</span>
                        <p className="text-muted small mt-2">Último estado: {pedido.ultimoEstado}</p>
                    </div>

                    <div className="row g-4 mb-5">
                        {/* Informações do Badge */}
                        <div className="col-md-6">
                            <div className="card border-0 shadow-sm rounded-4 p-5 h-100 bg-white">
                                <h4 className="fw-bold mb-4 border-bottom pb-2">Informações do Badge</h4>
                                <div className="lh-lg fs-5">
                                    <p className="mb-2"><strong>Consultor :</strong> {pedido.consultor || 'Desconhecido'}</p>
                                    <p className="mb-2"><strong>Área :</strong> {pedido.infoBadge.area}</p>
                                    <p className="mb-2"><strong>Service Line :</strong> {pedido.serviceLine}</p>
                                    <p className="mb-2"><strong>Nível :</strong> Nível {pedido.infoBadge.nivel.replace('Nível ', '')} ({pedido.infoBadge.nivelExtenso})</p>
                                    <p className="mb-2"><strong>Requisitos Necessários :</strong> {pedido.infoBadge.requisitos} Requisitos</p>
                                    <p className="mb-2"><strong>Pontos Conquistados :</strong> {pedido.infoBadge.pontos}</p>
                                    <p className="mb-4"><strong>Data Expiração Badge :</strong> {pedido.infoBadge.validadePadrao}</p>
                                </div>
                                <button onClick={() => navigate(`/admin/badges/detalhes/${pedido.infoBadge.idBadge}`)} className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm w-fit" style={{backgroundColor: '#5D78FF'}}>Ver Detalhes do Badge</button>
                            </div>
                        </div>

                        {/* Histórico de Validação */}
                        <div className="col-md-6">
                            <div className="card border-0 shadow-sm rounded-4 p-5 h-100 bg-white">
                                <h4 className="fw-bold mb-4 border-bottom pb-2">Histórico de Validação</h4>
                                <div className="ps-3 border-start border-2 border-primary position-relative">
                                    {pedido.timeline.map((h, i) => (
                                        <div key={i} className="mb-4 position-relative">
                                            <i className={`bi ${h.iconType === 'success' ? 'bi-check-circle-fill text-success' : (h.iconType === 'danger' ? 'bi-x-circle-fill text-danger' : 'bi-info-circle-fill text-primary')} position-absolute bg-white`} style={{ left: '-19px', top: '2px' }}></i>
                                            <div className="ms-3 fs-6"><strong>{h.data} :</strong> {h.user} {h.acao}</div>
                                        </div>
                                    ))}
                                    {pedido.observacoes && <div className="text-danger small fw-bold mt-4">Observações: <span className="text-muted fw-normal">{pedido.observacoes}</span></div>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Evidências Submetidas */}
                    <h3 className="fw-bold mb-4 text-dark" style={{ fontSize: '1.8rem' }}>Evidências Submetidas</h3>
                    <div className="mb-5">
                        <TabelaGenerica colunas={['Requisitos', 'Evidência', 'Status', 'Ação']} emptyMessage="Sem evidências associadas.">
                            {pedido.evidencias && pedido.evidencias.map((e, index) => (
                                <tr key={index}>
                                    <td className="fw-bold text-dark">{e.req}</td>
                                    <td className="text-muted">{e.ficheiro}</td>
                                    <td><span className={`fw-bold text-${pedido.corStatus}`}>{pedido.status}</span></td>
                                    <td>
                                        {e.url ? (
                                            <button onClick={() => abrirEvidenciaProtegida(e.url)} className="btn btn-primary btn-sm px-4 rounded-3 fw-bold shadow-sm" style={{ backgroundColor: '#5D78FF', border: 'none' }}>
                                                <i className="bi bi-eye-fill me-2"></i> Ver / Download
                                            </button>
                                        ) : (
                                            <span className="badge bg-warning-subtle text-warning-emphasis border border-warning">
                                                Ficheiro indisponível — requer novo envio
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </TabelaGenerica>
                    </div>

                    <div className="admin-responsive-actions d-flex justify-content-center gap-4 mb-5">
                        {pedido.status !== 'Aceite' && pedido.status !== 'Recusado' && pedido.status !== 'Eliminado' && (
                            <button onClick={handleEliminar} className="btn btn-danger px-5 py-3 rounded-pill fw-bold fs-5 shadow" style={{backgroundColor: '#D9534F', border: 'none', minWidth: '220px'}}>Eliminar Pedido</button>
                        )}
                        <button onClick={() => navigate('/admin/badges/pedidos')} className="btn btn-outline-secondary rounded-pill fw-bold border-2 admin-back-list-btn">Voltar à Lista de Pedidos</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DetalhesPedidoBadgeAdmin;
