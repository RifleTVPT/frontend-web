import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import SidebarSLL from '../../components/SidebarSLL';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import AvatarUtilizador from '../../components/AvatarUtilizador';
import { resolvePublicBadgeImage, useDefaultBadgeImageOnError } from '../../utils/publicBadgeImage';
import axios from 'axios';
import { obterServiceLineSLL } from '../../utils/sllServiceLine';
import '../../assets/dashboard.css';

const PerfilConsultorSLL = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    
    const [utilizador, setUtilizador] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState('https://via.placeholder.com/40');
    const [minhaSL, setMinhaSL] = useState('');

    const [mostrarEspeciais, setMostrarEspeciais] = useState(true);
    const [dadosPerfil, setDadosPerfil] = useState(null);

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
                const resUser = await axios.get(`https://softinsa-api-riya.onrender.com/users/configuracoes/${userLocal.ID_UTILIZADOR}`);
                if (resUser.data.success && resUser.data.data.avatar) setAvatarUrl(resUser.data.data.avatar);

                const response = await axios.get(`https://softinsa-api-riya.onrender.com/sll-consultores/perfil/${id}?sl=${encodeURIComponent(slAtual)}`);
                if (response.data.success) {
                    setDadosPerfil(response.data.data);
                } else {
                    alert("Consultor não encontrado.");
                    navigate('/sll/consultores/gestao');
                }
            } catch (error) {
                console.error("Erro ao carregar perfil:", error);
                navigate('/sll/consultores/gestao');
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

    if (loading || !dadosPerfil) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

    const badgesExibidos = dadosPerfil.badges.filter(b => {
        if (!mostrarEspeciais && b.especial) return false;
        return true;
    });

    return (
        <div className="d-flex bg-light min-vh-100">
            <SidebarSLL />
            <div className="flex-grow-1 p-4 dashboard-scroll">
                <div className="container-fluid text-start">
                    
                    <CabecalhoDashboard 
                        titulo={`Perfil do Consultor - Gestão ${minhaSL}`}
                        subtitulo=""
                        utilizador={utilizador}
                        avatarUrl={avatarUrl}
                        ocultarSaudacao={true}
                    />

                    <Link to="/sll/consultores/gestao" className="text-decoration-none text-dark small fw-bold d-flex align-items-center mb-4">
                        <i className="bi bi-arrow-left me-2"></i> Voltar à lista de Consultores
                    </Link>

                    {/* Perfil Header */}
                    <div className="sll-profile-header d-flex align-items-center mb-5 bg-white p-4 rounded-4 shadow-sm border-start border-5 border-primary">
                        <div className="sll-profile-avatar bg-light rounded-circle shadow-sm d-flex align-items-center justify-content-center overflow-hidden" style={{ width: '90px', height: '90px' }}>
                            <AvatarUtilizador
                                nome={dadosPerfil.nome}
                                foto={dadosPerfil.avatarConsultor}
                                tamanho={90}
                            />
                        </div>
                        <div className="ms-4">
                            <h2 className="fw-bold m-0 text-dark">{dadosPerfil.nome}</h2>
                            <p className="text-muted mb-0">
                                {dadosPerfil.area !== 'Não Definida' ? `Consultor de ${dadosPerfil.area} ` : 'Consultor '}
                                na Service Line <span className="fw-bold text-primary">{dadosPerfil.sl}</span>
                            </p>
                        </div>
                    </div>

                    {/* KPI Cards SLL */}
                    <div className="row g-4 mb-5">
                        <div className="col-md-4">
                            <div className="card border-0 shadow-sm p-4 bg-primary text-white text-center rounded-4 h-100">
                                <div className="small text-uppercase fw-bold opacity-75 mb-2">Pontos na Service Line</div>
                                <div className="h1 fw-bold m-0">{dadosPerfil.pontos} <small className="fs-5">pontos</small></div>
                                <div className="small opacity-75 mt-2 fw-bold">
                                    <i className="bi bi-arrow-up-circle-fill me-1"></i>
                                    +{dadosPerfil.pontosSemana} estimativa esta semana
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="card border-0 shadow-sm p-4 bg-white text-center rounded-4 h-100 border-start border-primary border-5">
                                <div className="small text-muted fw-bold text-uppercase mb-2">Ranking Pessoal na SL</div>
                                <div className="h1 fw-bold text-primary m-0">#{dadosPerfil.rankSL} <small className="text-muted h5 fw-normal">de {dadosPerfil.totalNaSL}</small></div>
                                <div className="small text-muted fw-bold mt-2">consultores da Service Line</div>
                            </div>
                        </div>
                    </div>

                    {/* Learning Paths Secção */}
                    <h4 className="fw-bold mb-4 text-dark mt-5">Progresso em Learning Paths</h4>
                    <div className="row mb-5 align-items-center bg-white p-4 rounded-4 shadow-sm mx-0">
                        <div className="col-md-4 text-center border-end">
                            <div className="position-relative d-inline-block">
                                <div className="h1 fw-bold position-absolute top-50 start-50 translate-middle text-primary">{dadosPerfil.progressoSL}%</div>
                                <svg width="180" height="180">
                                    <circle cx="90" cy="90" r="75" fill="none" stroke="#f0f0f0" strokeWidth="15" />
                                    <circle cx="90" cy="90" r="75" fill="none" stroke="#5D78FF" strokeWidth="15" 
                                            strokeDasharray="471" strokeDashoffset={471 - (471 * dadosPerfil.progressoSL / 100)} strokeLinecap="round" transform="rotate(-90 90 90)" />
                                </svg>
                            </div>
                            <p className="text-muted mt-3 small fw-bold px-3">dos Badges da Service Line completos</p>
                        </div>
                        <div className="col-md-8 ps-md-5">
                            <h6 className="fw-bold mb-3 text-muted">Aprendizagens ativas</h6>
                            <div className="row g-3">
                                {dadosPerfil.aprendizagens.map((item, i) => (
                                    <div key={i} className="col-md-12">
                                        <div className="d-flex align-items-center gap-3 mb-2">
                                            <div className="bg-primary bg-opacity-10 p-2 rounded text-primary"><i className="bi bi-rocket-takeoff-fill"></i></div>
                                            <div className="small fw-bold text-dark">{item.titulo}</div>
                                            <div className="ms-auto small fw-bold text-primary">{item.progresso}%</div>
                                        </div>
                                        <div className="progress rounded-pill bg-light" style={{ height: '8px' }}>
                                            <div className="progress-bar rounded-pill" style={{ width: `${item.progresso}%`, backgroundColor: '#5D78FF' }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Galeria de Badges */}
                    <div className="d-flex justify-content-between align-items-center mb-4 mt-5">
                        <h4 className="fw-bold m-0 text-dark">Galeria de Conquistas do Consultor</h4>
                        <div className="d-flex gap-3">
                            <div className="form-check form-switch d-flex align-items-center gap-2 bg-white px-4 py-2 rounded-pill shadow-sm">
                                <span className="small fw-bold text-muted ps-2">Conquistas Especiais</span>
                                <input className="form-check-input m-0 cursor-pointer fs-5 ms-2 shadow-none" type="checkbox" 
                                       checked={mostrarEspeciais} onChange={() => setMostrarEspeciais(!mostrarEspeciais)} />
                            </div>
                        </div>
                    </div>

                    <div className="row g-4 pb-5">
                        {badgesExibidos.length > 0 ? badgesExibidos.map((badge, idx) => {
                            if (badge.especial) {
                                return (
                                    <div key={idx} className="col-md-4">
                                        <div className="card h-100 rounded-4 shadow-sm p-4 text-center border-warning bg-white" style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: '#D4AF37' }}>
                                          <div className="d-flex justify-content-center mb-3">
                                            <div className="rounded-circle d-flex align-items-center justify-content-center shadow-sm overflow-hidden"
                                                 style={{ width: '85px', height: '85px', backgroundColor: '#F9F1DC', border: '3px solid #D4AF37' }}>
                                              <img
                                                src={resolvePublicBadgeImage(badge.urlImagem || badge.imagem || badge.img)}
                                                onError={useDefaultBadgeImageOnError}
                                                alt={badge.area}
                                                className="w-100 h-100"
                                                style={{ objectFit: 'contain', padding: '6px' }}
                                              />
                                            </div>
                                          </div>
                                          <h5 className="fw-bold mb-2 text-truncate">{badge.area}</h5>
                                          <p className="text-muted small mb-3 px-3 text-truncate">{badge.descricao}</p>
                                          <div className="d-flex justify-content-between align-items-center px-3 mb-3 small">
                                            <span className="text-muted">Obtido a: {badge.data}</span>
                                            <span className="text-primary fw-bold">+{badge.bonus} pontos</span>
                                          </div>
                                          <Link to={`/sll/consultores/${dadosPerfil.idUtilizador}/conquista/${badge.id.toString().replace('M','')}`} className="btn btn-primary rounded-pill px-4 py-2 mx-auto fw-bold shadow-sm" style={{ width: 'fit-content' }}>
                                            Ver Detalhes
                                          </Link>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div key={idx} className="col-md-4">
                                    <div className={`card p-4 text-center rounded-4 h-100 bg-white ${badge.isOutraSL ? 'border-0 shadow-sm' : 'border border-primary border-2 shadow'}`}>
                                        <div className="d-flex justify-content-center mb-3">
                                            <div className="rounded-circle d-flex align-items-center justify-content-center shadow-sm bg-white text-primary overflow-hidden" style={{width: '85px', height: '85px', border: '2px solid #5D78FF'}}>
                                                <img
                                                  src={resolvePublicBadgeImage(badge.urlImagem || badge.URL_IMAGEM)}
                                                  onError={useDefaultBadgeImageOnError}
                                                  alt={badge.area}
                                                  className="w-100 h-100"
                                                  style={{ objectFit: 'contain', padding: '6px' }}
                                                />
                                            </div>
                                        </div>
                                        <h5 className="fw-bold mb-2 text-truncate">{badge.area}</h5>
                                        <p className="text-muted small mb-3 px-3 text-truncate">{badge.sub}</p>
                                        <div className="d-flex justify-content-between align-items-center px-3 mb-3 small">
                                            <span className="text-muted">Obtido a: {badge.data}</span>
                                            <span className="text-primary fw-bold">+{badge.bonus} pontos</span>
                                        </div>
                                        <Link to={`/sll/badges/detalhes/${badge.id}`} 
                                              className="btn btn-outline-primary rounded-pill px-4 py-2 mx-auto fw-bold" style={{ width: 'fit-content' }}>
                                            Ver Detalhes
                                        </Link>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="col-12 text-center py-5 text-muted bg-white rounded-4 shadow-sm">
                                <i className="bi bi-award fs-1 d-block mb-3 opacity-25"></i>
                                Este consultor ainda não possui conquistas na sua Service Line.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PerfilConsultorSLL;
