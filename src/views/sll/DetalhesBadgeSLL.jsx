import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import SidebarSLL from '../../components/SidebarSLL';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import axios from 'axios';
import '../../assets/dashboard.css';
import { resolvePublicBadgeImage } from '../../utils/publicBadgeImage';

const DetalhesBadgeSLL = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [badgeData, setBadgeData] = useState(null);
  const [utilizador, setUtilizador] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('https://via.placeholder.com/40');

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
          }
      } catch (error) {
          console.error("Erro ao carregar foto:", error);
      }
    };

    const fetchBadgeDetails = async () => {
      try {
        const response = await axios.get(`https://softinsa-api-riya.onrender.com/catalogo/badges/${id}`);
        if (response.data.success) {
          setBadgeData(response.data.data);
        }
      } catch (error) {
        console.error("Erro ao buscar detalhes:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarFotoPerfil();
    fetchBadgeDetails();
  }, [id, navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    navigate('/');
  };

  if (loading || !badgeData) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

  const temAnterior = badgeData.anterior !== null;
  const temProximo = badgeData.proximo !== null;

  // LÓGICA DE CONVERSÃO: Transforma "Nível 1" em "A", "Nível 2" em "B", etc.
  const obterLetraNivel = (nivelStr) => {
    if (!nivelStr) return '';
    if (nivelStr.includes('1') || nivelStr === '1') return 'A';
    if (nivelStr.includes('2') || nivelStr === '2') return 'B';
    if (nivelStr.includes('3') || nivelStr === '3') return 'C';
    if (nivelStr.includes('4') || nivelStr === '4') return 'D';
    if (nivelStr.includes('5') || nivelStr === '5') return 'E';
    
    // Fallback caso a API já mande A, B, C...
    if (nivelStr.includes('A')) return 'A';
    if (nivelStr.includes('B')) return 'B';
    if (nivelStr.includes('C')) return 'C';
    if (nivelStr.includes('D')) return 'D';
    if (nivelStr.includes('E')) return 'E';
    
    return nivelStr;
  };

  const letraAtual = obterLetraNivel(badgeData.nivel);
  const numAtual = letraAtual.charCodeAt(0) - 64; // Transforma 'A' em 1, 'B' em 2...
  
  // Calcula as letras adjacentes de forma automática
  const letraAnterior = String.fromCharCode(64 + numAtual - 1);
  const letraProximo = String.fromCharCode(64 + numAtual + 1);

  return (
    <div className="d-flex bg-light min-vh-100">
      <SidebarSLL />

      <div className="flex-grow-1 p-4 dashboard-scroll">
        <div className="container-fluid text-start">
          
          <CabecalhoDashboard 
            titulo={<>Detalhes do Badge: <span className="text-primary">{badgeData.titulo}</span></>}
            subtitulo={`${badgeData.serviceLine} Service Line`}
            utilizador={utilizador}
            avatarUrl={avatarUrl}
            ocultarSaudacao={true}
          />

          <Link to="/sll/badges/catalogo" className="text-decoration-none text-dark small fw-bold d-flex align-items-center mb-4">
            <i className="bi bi-arrow-left me-2"></i> Voltar ao Catálogo de Badges
          </Link>

          {/* Secção Principal do Card */}
          <div className="card border-0 shadow-sm rounded-4 p-5 mb-5 bg-white">
            <div className="row align-items-center">
              <div className="col-md-4 text-center d-flex flex-column align-items-center justify-content-center border-end">
                <div className="rounded-circle border border-primary d-inline-flex align-items-center justify-content-center overflow-hidden mb-3 position-relative bg-light" style={{ width: '160px', height: '160px' }}>
                  <i className="bi bi-trophy-fill text-warning position-absolute" style={{ fontSize: '6rem', zIndex: 1 }}></i>
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
                <div className="text-start w-75 small">
                  {/* Apresenta a Letra formatada no Card */}
                  <p className="mb-1"><strong>Nível:</strong> Nível {letraAtual}</p>
                  <p className="mb-1"><strong>Área:</strong> {badgeData.area}</p>
                  <p className="mb-1"><strong>Validade:</strong> {
                    !badgeData.hasValidade
                      ? 'Sem Expiração'
                      : badgeData.validadeExpiracao
                        ? `Expira a ${new Date(badgeData.validadeExpiracao).toLocaleDateString('pt-PT')}`
                        : badgeData.validadeMeses
                          ? `${badgeData.validadeMeses} meses`
                          : 'Sem Expiração'
                  }</p>
                  <p className="mb-1"><strong>Pontos:</strong> {badgeData.pontos} pontos</p>
                </div>
              </div>
              <div className="col-md-8 ps-md-5">
                <h4 className="fw-bold mb-4">Descrição do Badge</h4>
                <p className="text-muted" style={{ lineHeight: '1.8' }}>{badgeData.descricao}</p>
              </div>
            </div>
          </div>

          {/* Requisitos */}
          <h4 className="fw-bold mb-4">Requisitos para Obtenção</h4>
          <div className="row g-3 mb-5">
            {badgeData.requisitos && badgeData.requisitos.map((req, index) => {
              const tituloFinal = (!req.titulo || req.titulo.match(/^Requisito \d+$/i)) 
                                  ? `Requisito ${letraAtual}${index + 1}` 
                                  : req.titulo;
              return (
              <div key={req.id} className="col-md-4">
                <div className="card border-0 shadow-sm p-4 text-start rounded-3 bg-white h-100">
                  <h6 className="fw-bold text-primary m-0 mb-2">{tituloFinal}</h6>
                  <p className="text-muted small mb-0">{req.desc}</p>
                </div>
              </div>
            )})}
            {(!badgeData.requisitos || badgeData.requisitos.length === 0) && (
              <div className="col-12 text-muted">Sem requisitos listados.</div>
            )}
          </div>

          <h5 className="fw-bold mb-3 text-dark mt-5">Caminho de Evolução desta Área</h5>
          <div className="row text-center align-items-center mb-5 pe-3">
            <div className="col-md-4">
              {temAnterior ? (
                <div className="card border-0 shadow-sm p-3 rounded-3 bg-white">
                   <i className="bi bi-arrow-left-circle fs-3 text-secondary mb-2"></i>
                   <p className="small mb-1 fw-bold">Badge Anterior: {badgeData.anterior.titulo}</p>
                   <p className="small text-muted mb-3" style={{fontSize: '11px'}}>{badgeData.anterior.serviceLine} - {badgeData.anterior.area} <br/>(Nível {badgeData.anterior.nivel})</p>
                   <Link to={`/sll/badges/detalhes/${badgeData.anterior.id}`} className="btn btn-primary btn-sm rounded-pill px-3 fw-bold">Ver Detalhes</Link>
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
              {temProximo ? (
                <div className="card border-0 shadow-sm p-3 rounded-3 bg-white">
                   <i className="bi bi-arrow-right-circle fs-3 text-secondary mb-2"></i>
                   <p className="small mb-1 fw-bold">Próximo Badge: {badgeData.proximo.titulo}</p>
                   <p className="small text-muted mb-3" style={{fontSize: '11px'}}>{badgeData.proximo.serviceLine} - {badgeData.proximo.area} <br/>(Nível {badgeData.proximo.nivel})</p>
                   <Link to={`/sll/badges/detalhes/${badgeData.proximo.id}`} className="btn btn-primary btn-sm rounded-pill px-3 fw-bold">Ver Detalhes</Link>
                </div>
              ) : <div className="p-3"></div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalhesBadgeSLL;
