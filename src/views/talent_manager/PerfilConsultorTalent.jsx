import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import SidebarTalent from '../../components/SidebarTalentManager';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import AvatarUtilizador from '../../components/AvatarUtilizador';
import axios from 'axios';
import '../../assets/dashboard.css';

const PerfilConsultorTalent = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [utilizador, setUtilizador] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState('');

    const [mostrarEspeciais, setMostrarEspeciais] = useState(true);
    const [dadosPerfil, setDadosPerfil] = useState(null);

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

        const fetchPerfil = async () => {
            try {
                const response = await axios.get(`https://softinsa-api-riya.onrender.com/talent/consultores/perfil/${id}`);
                if (response.data.success) {
                    setDadosPerfil(response.data.data);
                } else {
                    alert("Consultor não encontrado.");
                    navigate('/talent/consultores/lista');
                }
            } catch (error) {
                console.error("Erro ao carregar perfil:", error);
                navigate('/talent/consultores/lista');
            } finally {
                setLoading(false);
            }
        };

        carregarFotoPerfil();
        fetchPerfil();
    }, [id, navigate]);

    const handleLogout = () => {
        sessionStorage.removeItem('user');
        navigate('/');
    };

    if (loading || !dadosPerfil) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

    const badgesExibidos = mostrarEspeciais 
        ? dadosPerfil.badges 
        : dadosPerfil.badges.filter(b => !b.especial);

    return (
        <div className="d-flex bg-light min-vh-100">
            <SidebarTalent />
            <div className="flex-grow-1 p-4 dashboard-scroll">
                <div className="container-fluid text-start">
                    
                    <CabecalhoDashboard 
                        titulo="Perfil do Consultor"
                        subtitulo=""
                        utilizador={utilizador}
                        avatarUrl={avatarUrl}
                        ocultarSaudacao={true}
                    />

                    <Link to="/talent/consultores/lista" className="text-decoration-none text-dark small fw-bold d-flex align-items-center mb-4">
                        <i className="bi bi-arrow-left me-2"></i> Voltar à lista de Consultores
                    </Link>

                    {/* Perfil Header - FOTO AGORA VEM DA BASE DE DADOS */}
                    <div className="d-flex align-items-center mb-5 bg-white p-4 rounded-4 shadow-sm border-start border-5 border-primary">
                        <div className="bg-light rounded-circle shadow-sm d-flex align-items-center justify-content-center overflow-hidden" style={{ width: '90px', height: '90px' }}>
                            <AvatarUtilizador
                                nome={dadosPerfil.nome}
                                foto={dadosPerfil.avatarConsultor}
                                tamanho={90}
                            />
                        </div>
                        <div className="ms-4">
                            <h2 className="fw-bold m-0 text-dark">{dadosPerfil.nome}</h2>
                            <p className="text-muted mb-0">Consultor da Service Line de <span className="fw-bold text-primary">{dadosPerfil.sl}</span></p>
                            <p className="text-muted small mb-0 fw-bold">Área: {dadosPerfil.area}</p>
                        </div>
                    </div>

                    {/* KPI Cards */}
                    <div className="row g-4 mb-5">
                        <div className="col-md-4">
                            <div className="card border-0 shadow-sm p-4 bg-primary text-white text-center rounded-4 h-100">
                                <div className="small mb-2 fw-bold text-white-50 text-uppercase">Pontos totais acumulados</div>
                                <div className="h1 fw-bold m-0">{dadosPerfil.pontos}</div>
                                <div className="small text-warning fw-bold mt-2 fs-6">
                                    <i className="bi bi-graph-up-arrow me-1"></i>
                                    +{dadosPerfil.pontosSemana} obtidos esta semana
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="card border-0 shadow-sm p-4 bg-white text-center rounded-4 h-100 border-bottom border-5 border-warning">
                                <div className="small text-muted fw-bold text-uppercase mb-2">Ranking Pessoal (Global)</div>
                                <div className="h1 fw-bold text-dark m-0">#{dadosPerfil.rank} <small className="text-muted h6 fw-normal">de {dadosPerfil.totalConsultores}</small></div>
                                <div className="small text-muted mt-2">consultores na plataforma</div>
                            </div>
                        </div>
                    </div>

                    {/* Learning Paths Secção */}
                    <h4 className="fw-bold mb-4 text-dark">Progresso em Learning Paths</h4>
                    <div className="row mb-5 align-items-center bg-white p-4 rounded-4 shadow-sm mx-0">
                        <div className="col-md-4 text-center border-end">
                            <div className="position-relative d-inline-block">
                                <div className="h2 fw-bold position-absolute top-50 start-50 translate-middle text-primary">{dadosPerfil.progressoSL}%</div>
                                <svg width="150" height="150">
                                    <circle cx="75" cy="75" r="65" fill="none" stroke="#eee" strokeWidth="12" />
                                    <circle cx="75" cy="75" r="65" fill="none" stroke="#2575fc" strokeWidth="12" 
                                            strokeDasharray="408" strokeDashoffset={408 - (408 * dadosPerfil.progressoSL / 100)} 
                                            strokeLinecap="round" transform="rotate(-90 75 75)" />
                                </svg>
                            </div>
                            <p className="text-muted mt-3 fw-bold small">dos Badges da sua Service Line completos</p>
                        </div>
                        <div className="col-md-8 ps-md-5">
                            <div className="row g-4">
                                {dadosPerfil.aprendizagens.map((item, i) => (
                                    <div key={i} className="col-md-12">
                                        <div className="d-flex align-items-center gap-3 mb-2">
                                            <div className="bg-primary bg-opacity-10 p-2 rounded text-primary"><i className="bi bi-rocket-takeoff-fill"></i></div>
                                            <div className="small fw-bold text-dark">{item.titulo}</div>
                                            <div className="ms-auto small fw-bold text-primary">{item.progresso}%</div>
                                        </div>
                                        <div className="progress rounded-pill bg-light" style={{ height: '8px' }}>
                                            <div className="progress-bar rounded-pill" style={{ width: `${item.progresso}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Galeria de Badges */}
                    <div className="d-flex justify-content-between align-items-center mb-4 mt-5">
                        <h4 className="fw-bold m-0 text-dark">Galeria de Conquistas</h4>
                        <div className="form-check form-switch d-flex align-items-center gap-2 bg-white px-4 py-2 rounded-pill shadow-sm">
                            <span className="small fw-bold text-muted ps-2">Conquistas Especiais</span>
                            <input className="form-check-input m-0 cursor-pointer fs-5 ms-2" type="checkbox" 
                                   checked={mostrarEspeciais} onChange={() => setMostrarEspeciais(!mostrarEspeciais)} />
                        </div>
                    </div>

                    <div className="row g-4 pb-5">
                        {badgesExibidos.length > 0 ? badgesExibidos.map((badge, idx) => {
                            if (badge.especial) {
                                return (
                                    <div key={idx} className="col-md-4">
                                        <div className="card h-100 rounded-4 shadow-sm p-4 text-center border-warning bg-white" style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: '#D4AF37' }}>
                                          <div className="d-flex justify-content-center mb-3">
                                            <div className="rounded-circle d-flex align-items-center justify-content-center shadow-sm" 
                                                 style={{ width: '85px', height: '85px', backgroundColor: '#F9F1DC', border: '3px solid #D4AF37' }}>
                                              <i className="bi bi-star-fill text-warning fs-1"></i>
                                            </div>
                                          </div>
                                          <h5 className="fw-bold mb-2 text-truncate">{badge.area}</h5>
                                          <p className="text-muted small mb-3 px-3 text-truncate">{badge.descricao}</p>
                                          <div className="d-flex justify-content-between align-items-center px-3 mb-3 small">
                                            <span className="text-muted">Obtido a: {badge.data}</span>
                                            <span className="text-primary fw-bold">+{badge.bonus} pontos</span>
                                          </div>
                                          <Link to={`/talent/consultores/${dadosPerfil.idUtilizador}/conquista/${badge.id.toString().replace('M','')}`} className="btn btn-primary rounded-pill px-4 py-2 mx-auto fw-bold shadow-sm" style={{ width: 'fit-content' }}>
                                            Ver Detalhes
                                          </Link>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div key={idx} className="col-md-4">
                                    <div className="card shadow-sm p-4 text-center rounded-4 h-100 border-0 bg-white">
                                        <div className="d-flex justify-content-center mb-3">
                                            <div className="rounded-circle d-flex align-items-center justify-content-center shadow-sm bg-light text-primary" style={{width: '85px', height: '85px'}}>
                                                <i className="bi bi-shield-fill-check fs-1"></i>
                                            </div>
                                        </div>
                                        <h5 className="fw-bold mb-2 text-truncate">{badge.area}</h5>
                                        <p className="text-muted small mb-3 px-3 text-truncate">{badge.sub}</p>
                                        <div className="d-flex justify-content-between align-items-center px-3 mb-3 small">
                                            <span className="text-muted">Obtido a: {badge.data}</span>
                                            <span className="text-primary fw-bold">+{badge.bonus} pontos</span>
                                        </div>
                                        <Link to={`/talent/badge-detalhes/${badge.id}`} 
                                              className="btn btn-outline-primary rounded-pill px-4 py-2 mx-auto fw-bold" style={{ width: 'fit-content' }}>
                                            Ver Detalhes
                                        </Link>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="col-12 text-center py-5 text-muted bg-white rounded-4 shadow-sm">
                                <i className="bi bi-award fs-1 d-block mb-3 opacity-25"></i>
                                Este consultor ainda não possui conquistas visíveis.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PerfilConsultorTalent;
