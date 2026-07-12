import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import PerfilConsultorModal from '../components/PerfilConsultorModal';
import { getApiOrigin, resolvePublicBadgeImage, useDefaultBadgeImageOnError } from '../utils/publicBadgeImage';
import { abrirPartilhaLinkedIn } from '../utils/linkedinShare';
import AvatarUtilizador from '../components/AvatarUtilizador';
import '../assets/public-pages.css';

const GaleriaPublicaBadges = () => {
    const navigate = useNavigate();
    const { idUtilizador } = useParams(); // URL: /galeria/1
    const [showPerfil, setShowPerfil] = useState(false);
    
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const [selectedServiceLine, setSelectedServiceLine] = useState('Todas');
    const [selectedArea, setSelectedArea] = useState('Todas');
    const [selectedNivel, setSelectedNivel] = useState('Todos');
    const [mostrarEspeciais, setMostrarEspeciais] = useState(true);
    const [estrutura, setEstrutura] = useState({ serviceLines: [], areas: [] });
    
    const nivelNameMap = {'A':'Júnior', 'B':'Intermédio', 'C':'Sénior', 'D':'Especialista', 'E':'Líder de Conhecimento'};

    useEffect(() => {
        const fetchGaleria = async () => {
            try {
                const [galeriaRes, estruturaRes] = await Promise.all([
                    axios.get(`https://softinsa-api-riya.onrender.com/meus-badges/galeria/${idUtilizador}`),
                    axios.get('https://softinsa-api-riya.onrender.com/estrutura')
                ]);
                if (galeriaRes.data.success) {
                    setData(galeriaRes.data.data);
                }
                if (estruturaRes.data.success) {
                    setEstrutura(estruturaRes.data.data);
                }
            } catch (err) {
                console.error("Erro ao carregar a galeria:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchGaleria();
    }, [idUtilizador]);

    if (loading) return <div className="d-flex justify-content-center align-items-center vh-100" style={{ backgroundColor: '#F4F5F9' }}><div className="spinner-border text-primary"></div></div>;
    if (!data) return <div className="d-flex justify-content-center align-items-center vh-100 text-danger fw-bold" style={{ backgroundColor: '#F4F5F9' }}><h3>Perfil não encontrado.</h3></div>;

    const { consultor, badges } = data;

    const copyLink = () => {
        const publicOrigin = (import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, '');
        const urlPerfil = `${publicOrigin}/galeria/${encodeURIComponent(idUtilizador)}`;
        navigator.clipboard.writeText(urlPerfil)
            .then(() => alert("Link copiado para a área de transferência!"))
            .catch(() => alert("Erro ao copiar o link."));
    };

    const shareLinkedIn = () => {
        const publicOrigin = (import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, '');
        const urlPerfil = `${publicOrigin}/galeria/${encodeURIComponent(idUtilizador)}`;
        abrirPartilhaLinkedIn({
            urlPartilha: `${getApiOrigin()}/partilha/linkedin/galeria/${encodeURIComponent(idUtilizador)}`,
            urlPublica: urlPerfil,
            texto: `Conheça a minha galeria de badges e conquistas profissionais na Plataforma de Badges Softinsa.`
        });
    };

    const areasDisponiveis = selectedServiceLine === 'Todas' 
        ? estrutura.areas 
        : estrutura.areas.filter(a => {
            const sl = estrutura.serviceLines.find(s => s.nome === selectedServiceLine);
            return sl && a.slId === sl.id;
        });
    
    const todosNiveis = ['A', 'B', 'C', 'D', 'E'];

    const badgesFiltrados = badges.filter(b => {
        if (b.tipoBadge === 'Especial') {
            return mostrarEspeciais;
        }
        const passSL = selectedServiceLine === 'Todas' || b.sl === selectedServiceLine;
        const passArea = selectedArea === 'Todas' || b.area === selectedArea;
        const passNivel = selectedNivel === 'Todos' || b.nivelLetra === selectedNivel;
        return passSL && passArea && passNivel;
    });

    return (
        <div className="dashboard-scroll public-page">
            <div className="container-fluid public-gallery-shell p-0">
                
                <div className="public-topbar">
                    <h2 className="public-brand">SOFT<span className="text-info">I</span>NSA</h2>
                    <div className="d-flex align-items-center gap-2">
                        <i className="bi bi-person-circle fs-3"></i>
                        <span className="fw-bold">{consultor.nome}</span>
                    </div>
                </div>

                <div className="public-content">
                    <div className="public-title-row text-start">
                        <h2 className="public-title">Galeria Pública de Badges - {consultor.nome}</h2>
                        <div className="public-actions">
                            <a
                                href="https://www.softinsa.pt/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-outline-primary rounded-pill px-4 fw-bold public-action-btn"
                            >
                                <i className="bi bi-building me-2"></i>Conheça a Softinsa
                            </a>
                            <div className="dropdown">
                                <button className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm dropdown-toggle public-action-btn" type="button" data-bs-toggle="dropdown" aria-expanded="false" style={{backgroundColor: '#5D78FF'}}>
                                    <i className="bi bi-share-fill me-2"></i>Partilhar Perfil Completo
                                </button>
                                <ul className="dropdown-menu shadow border-0 mt-2 rounded-3">
                                    <li><button className="dropdown-item fw-bold text-secondary py-2" onClick={copyLink}><i className="bi bi-link-45deg me-2 fs-5"></i>Copiar Link</button></li>
                                    <li><button className="dropdown-item fw-bold text-primary py-2" onClick={shareLinkedIn}><i className="bi bi-linkedin me-2 fs-5"></i>Publicar no LinkedIn</button></li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="row g-5 text-start">
                        <div className="col-lg-4">
                            <div className="public-profile-card">
                                <div className="mb-4 d-flex justify-content-center">
                                    <AvatarUtilizador nome={consultor.nome} foto={consultor.urlFoto} tamanho={150} />
                                </div>
                                <h3 className="fw-bold">{consultor.nome}</h3>
                                <p className="text-muted small mb-1">{consultor.cargo}</p>
                                <p className="text-muted small">{consultor.serviceLine}</p>
                                
                                <div className="public-stat-list">
                                    <div className="public-stat">
                                        <div className="small text-muted fw-bold">Classificação Global</div>
                                        <div className="h5 fw-bold text-primary m-0">#{consultor.ranking} de {consultor.totalConsultores}</div>
                                    </div>
                                    <div className="public-stat">
                                        <div className="small text-muted fw-bold">Badges Ativos</div>
                                        <div className="h5 fw-bold text-primary m-0">{consultor.totalBadges} Badges</div>
                                    </div>
                                    <div className="public-stat">
                                        <div className="small text-muted fw-bold">Pontos Totais</div>
                                        <div className="h5 fw-bold text-primary m-0">{consultor.pontosTotais} Pontos</div>
                                    </div>
                                    <button onClick={() => setShowPerfil(true)} className="btn btn-outline-primary w-100 rounded-pill mt-4 fw-bold shadow-sm">Ver Todo o Perfil</button>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-8 border rounded-4 p-4 bg-white shadow-sm">
                            <div className="public-gallery-filters">
                                <div className="form-check form-switch">
                                    <input className="form-check-input shadow-sm" type="checkbox" id="flexSwitchCheckEspeciais" checked={mostrarEspeciais} onChange={(e) => setMostrarEspeciais(e.target.checked)} />
                                    <label className="form-check-label fw-bold text-secondary" htmlFor="flexSwitchCheckEspeciais">
                                        Mostrar Conquistas Especiais
                                    </label>
                                </div>
                                <select className="form-select border-0 shadow-sm" value={selectedServiceLine} onChange={(e) => { setSelectedServiceLine(e.target.value); setSelectedArea('Todas'); setSelectedNivel('Todos'); }}>
                                    <option value="Todas">Todas as Service Lines</option>
                                    {estrutura.serviceLines.map(sl => (
                                        <option key={sl.id} value={sl.nome}>{sl.nome}</option>
                                    ))}
                                </select>
                                <select className="form-select border-0 shadow-sm" value={selectedArea} onChange={(e) => { setSelectedArea(e.target.value); setSelectedNivel('Todos'); }} disabled={selectedServiceLine === 'Todas'}>
                                    <option value="Todas">Todas as Áreas</option>
                                    {areasDisponiveis.map(a => (
                                        <option key={a.id} value={a.nome}>{a.nome}</option>
                                    ))}
                                </select>
                                <select className="form-select border-0 shadow-sm" value={selectedNivel} onChange={(e) => setSelectedNivel(e.target.value)} disabled={selectedArea === 'Todas'}>
                                    <option value="Todos">Todos os Níveis</option>
                                    {todosNiveis.map(n => (
                                        <option key={n} value={n}>Nível {n}</option>
                                    ))}
                                </select>
                            </div>
                            <h5 className="fw-bold mb-4 border-bottom pb-2">Badges Conquistados</h5>
                            <div className="row g-4">
                                {badgesFiltrados.length > 0 ? badgesFiltrados.map(b => (
                                    <div key={b.id} className="col-md-12 col-xl-6">
                                        <div className="card shadow-sm rounded-4 p-4 hover-scale cursor-pointer h-100 d-flex flex-column" 
                                             style={{ border: b.tipoBadge === 'Especial' ? '2px solid #D4AF37' : 'none', borderLeft: b.tipoBadge === 'Especial' ? '2px solid #D4AF37' : `6px solid ${b.color}`, backgroundColor: b.tipoBadge === 'Especial' ? '#fff' : '#F8F9FA', transition: '0.3s' }}
                                             onClick={() => {
                                                 if (b.tipoBadge === 'Normal' && b.linkUnico) {
                                                     navigate(`/verificacao/${encodeURIComponent(b.linkUnico)}`);
                                                 } else if (b.tipoBadge === 'Especial') {
                                                     navigate(`/verificacao-especial/${idUtilizador}/${b.id}`);
                                                 }
                                             }}>
                                            <div className="public-badge-card-main">
                                                {b.tipoBadge === 'Especial' ? (
                                                    <div className="rounded-circle d-flex align-items-center justify-content-center shadow-sm overflow-hidden" 
                                                         style={{ width: '80px', height: '80px', flexShrink: 0, backgroundColor: '#F9F1DC', border: '3px solid #D4AF37' }}>
                                                      <img
                                                        src={resolvePublicBadgeImage(b.urlImagem)}
                                                        onError={useDefaultBadgeImageOnError}
                                                        alt={b.titulo}
                                                        className="w-100 h-100"
                                                        style={{ objectFit: 'contain', padding: '6px' }}
                                                      />
                                                    </div>
                                                ) : (
                                                    <div className="rounded-circle border border-primary d-inline-flex align-items-center justify-content-center overflow-hidden shadow-sm bg-white position-relative" style={{width: '80px', height: '80px', flexShrink: 0}}>
                                                        <img 
                                                            src={resolvePublicBadgeImage(b.urlImagem)}
                                                            onError={useDefaultBadgeImageOnError}
                                                            alt={b.titulo}
                                                            className="w-100 h-100"
                                                            style={{ objectFit: 'contain', padding: '6px' }}
                                                        />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="fw-bold" style={{fontSize: '16px', lineHeight: '1.2'}}>{b.titulo}</div>
                                                    <div className="text-muted mt-2" style={{fontSize: '13px'}}>
                                                        Obtido a: <span className="fw-bold text-dark">{b.emissao}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {b.tipoBadge === 'Normal' ? (
                                                <div className="text-muted mt-auto d-flex flex-column gap-1" style={{fontSize: '13px'}}>
                                                    <div><strong className="text-dark">Service Line:</strong> {b.sl || 'Geral'}</div>
                                                    <div><strong className="text-dark">Área:</strong> {b.area || 'Geral'}</div>
                                                    <div><strong className="text-dark">Nível:</strong> {b.nivelLetra && nivelNameMap[b.nivelLetra] ? `${nivelNameMap[b.nivelLetra]} (Nível ${b.nivelLetra})` : b.nivel}</div>
                                                </div>
                                            ) : (
                                                <div className="text-muted mt-auto d-flex flex-column gap-1" style={{fontSize: '13px'}}>
                                                    <div><strong className="text-dark">Categoria:</strong> Conquista Especial</div>
                                                    <div><strong className="text-dark">Bónus:</strong> +{b.bonus} Pontos Extra</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )) : (
                                  <p className="text-muted">Este utilizador não tem badges para os filtros selecionados.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="py-4"></div>
            </div>
            {showPerfil && <PerfilConsultorModal consultor={consultor} onClose={() => setShowPerfil(false)} />}
        </div>
    );
};

export default GaleriaPublicaBadges;
