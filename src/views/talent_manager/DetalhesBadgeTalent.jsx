import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import SidebarTalent from '../../components/SidebarTalentManager';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import '../../assets/dashboard.css';
import { resolvePublicBadgeImage } from '../../utils/publicBadgeImage';

const DetalhesBadgeTalent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [badgeData, setBadgeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [utilizador, setUtilizador] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    const fetchBadgeDetails = async () => {
      try {
        const userLocal = JSON.parse(sessionStorage.getItem('user'));
        if (!userLocal) {
            navigate('/');
            return;
        }
        setUtilizador(userLocal);

        const [badgeRes, userRes] = await Promise.all([
            axios.get(`https://softinsa-api-riya.onrender.com/catalogo/badges/${id}`),
            axios.get(`https://softinsa-api-riya.onrender.com/users/configuracoes/${userLocal.ID_UTILIZADOR}`)
        ]);

        if (badgeRes.data.success) {
          setBadgeData(badgeRes.data.data);
        }
        if (userRes.data.success && userRes.data.data.avatar) {
          setAvatarUrl(userRes.data.data.avatar);
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
        console.error("Erro ao buscar detalhes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBadgeDetails();
  }, [id, navigate]);

  if (loading || !badgeData) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

  const isNivelA = !badgeData.anterior;
  const isUltimoNivel = !badgeData.proximo;
  const hideEvolutionPath = isNivelA && isUltimoNivel;
  const nivelNameMap = {'A':'Júnior', 'B':'Intermédio', 'C':'Sénior', 'D':'Especialista', 'E':'Líder de Conhecimento'};

  return (
    <div className="d-flex bg-light min-vh-100">
      <SidebarTalent />

      <div className="flex-grow-1 p-4 dashboard-scroll text-start">
        <div className="container-fluid">
          
          <CabecalhoDashboard 
            titulo={<>{badgeData.isPremium && <i className="bi bi-star-fill text-warning me-2"></i>} Detalhes do Badge: {badgeData.titulo}</>}
            subtitulo={badgeData.serviceLine}
            utilizador={utilizador}
            avatarUrl={avatarUrl}
            ocultarSaudacao={true}
          />

          <Link to="/talent/catalogo-global" className="text-decoration-none text-dark small fw-bold d-flex align-items-center mb-4">
            <i className="bi bi-arrow-left me-2"></i> Voltar ao Catálogo Global
          </Link>

          <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
            <div className="row align-items-center">
              <div className="col-md-4 text-start border-end pe-5">
                <div className="d-flex justify-content-center w-100 mb-3">
                  <div className="rounded-circle border border-primary d-inline-flex align-items-center justify-content-center overflow-hidden position-relative bg-light" style={{width: '150px', height: '150px'}}>
                    <i className="bi bi-trophy-fill text-warning position-absolute" style={{ fontSize: '7rem', zIndex: 1 }}></i>
                    {(() => {
                        const imageSrc = badgeData.urlImagem && badgeData.urlImagem.trim() !== '' && !badgeData.urlImagem.includes('placeholder') && !badgeData.urlImagem.includes('default-trophy') && !badgeData.urlImagem.includes('3112946.png') ? resolvePublicBadgeImage(badgeData.urlImagem) : null;
                        if (!imageSrc) return null;
                        return (
                            <img 
                                src={imageSrc} 
                                onError={(e) => { e.target.style.display = 'none'; }}
                                alt="Badge" 
                                className="position-absolute w-100 h-100"
                                style={{ objectFit: 'cover', zIndex: 2 }} 
                            />
                        );
                    })()}
                  </div>
                </div>
                <div className="ps-2 fonte-dados-grande">
                  <p className="mb-1"><strong>Service Line:</strong> {badgeData.serviceLine || 'Geral'}</p>
                  <p className="mb-1"><strong>Área:</strong> {badgeData.area || 'Geral'}</p>
                  <p className="mb-1"><strong>Nível:</strong> {nivelNameMap[badgeData.nivel] ? `${nivelNameMap[badgeData.nivel]} (Nível ${badgeData.nivel})` : badgeData.nivel}</p>
                  <p className="mb-1">
                    <strong>Validade:</strong> {
                      !badgeData.hasValidade
                        ? 'Sem Expiração'
                        : badgeData.validadeExpiracao
                          ? `Expira a ${new Date(badgeData.validadeExpiracao).toLocaleDateString('pt-PT')}`
                          : badgeData.validadeMeses
                            ? `${badgeData.validadeMeses} meses`
                            : 'Sem Expiração'
                    }
                  </p>
                  <p className="mb-1"><strong>Pontos:</strong> {badgeData.pontos} pontos</p>
                </div>
              </div>
              <div className="col-md-8 ps-5">
                <h4 className="titulo-dados-grande mb-3">Descrição</h4>
                <p className="text-muted leading-relaxed small">{badgeData.descricao}</p>
              </div>
            </div>
          </div>

          <h5 className="fw-bold mb-3 text-dark mt-5">Requisitos para Obtenção</h5>
          <div className="row g-3 mb-5">
            {badgeData.requisitos && badgeData.requisitos.map((req, index) => {
              const tituloFinal = (!req.titulo || req.titulo.match(/^Requisito \d+$/i)) 
                                  ? `Requisito ${badgeData.nivel}${index + 1}` 
                                  : req.titulo;
              return (
                <div key={req.id} className="col-md-4">
                  <div className="card border-0 shadow-sm p-4 text-start rounded-3 bg-white h-100">
                    <h6 className="fw-bold text-primary m-0 mb-2">{tituloFinal}</h6>
                    <p className="text-muted small mb-0">{req.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {!hideEvolutionPath && (
            <>
              <h5 className="fw-bold mb-3 text-dark">Caminho de Evolução desta Área</h5>
              <div className="row text-center align-items-center mb-5 pe-3">
                <div className="col-md-4">
                  {!isNivelA && badgeData.anterior ? (
                    <div className="card border-0 shadow-sm p-3 rounded-3 bg-white">
                       <i className="bi bi-arrow-left-circle fs-3 text-secondary mb-2"></i>
                       <p className="small mb-2">Badge anterior:<br/>({badgeData.anterior.titulo})</p>
                       <Link to={`/talent/badge-detalhes/${badgeData.anterior.id}`} className="btn btn-primary btn-sm rounded-pill px-3 fw-bold">Ver Detalhes</Link>
                    </div>
                  ) : <div className="p-3"></div>}
                </div>
                <div className="col-md-4">
                    <div className="card border-primary p-3 rounded-3 bg-white" style={{border: '1.5px dashed #2575fc'}}>
                      <i className="bi bi-patch-check fs-2 text-primary mb-2"></i>
                      <p className="small m-0 fw-bold">Badge Atual: {badgeData.area || 'Geral'}<br/>(Nível {badgeData.nivel})</p>
                   </div>
                </div>
                <div className="col-md-4">
                  {!isUltimoNivel && badgeData.proximo ? (
                    <div className="card border-0 shadow-sm p-3 rounded-3 bg-white">
                       <i className="bi bi-arrow-right-circle fs-3 text-secondary mb-2"></i>
                       <p className="small mb-2">Próximo Badge:<br/>({badgeData.proximo.titulo})</p>
                       <Link to={`/talent/badge-detalhes/${badgeData.proximo.id}`} className="btn btn-primary btn-sm rounded-pill px-3 fw-bold">Ver Detalhes</Link>
                    </div>
                  ) : <div className="p-3"></div>}
                </div>
              </div>
            </>
          )}

          <div className="text-center pb-5 mt-5">
             <p className="small text-muted mb-0">Gestor de Talento não submete candidaturas.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalhesBadgeTalent;
