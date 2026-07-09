import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { resolvePublicBadgeImage, useDefaultBadgeImageOnError } from '../../utils/publicBadgeImage';
import SidebarSLL from '../../components/SidebarSLL';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import '../../assets/dashboard.css';

const DetalhesConquistaEspecialSLL = () => {
  const { idUtilizador, idMarco } = useParams();
  const navigate = useNavigate();
  const [conquista, setConquista] = useState(null);
  const [sllLogado, setSllLogado] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('https://via.placeholder.com/40');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userLocal = JSON.parse(sessionStorage.getItem('user'));
    if (!userLocal) {
        navigate('/');
        return;
    }
    setSllLogado(userLocal);

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
    carregarFotoPerfil();
    
    const fetchDetalhes = async () => {
      try {
        const response = await axios.get(`https://softinsa-api-riya.onrender.com/conquistas/detalhes/${idUtilizador}/${idMarco}`);
        if (response.data.success) {
          setConquista(response.data.data);
        }
      } catch (error) {
        console.error("Erro ao carregar detalhes do marco:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetalhes();
  }, [idUtilizador, idMarco, navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    navigate('/');
  };

  if (loading || !conquista) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="d-flex bg-light min-vh-100">
      <SidebarSLL />

      <div className="flex-grow-1 p-4 dashboard-scroll">
        <div className="container-fluid text-start">
          
          <CabecalhoDashboard 
            titulo="Detalhes da Conquista Especial"
            subtitulo=""
            utilizador={sllLogado}
            avatarUrl={avatarUrl}
          />

          {/* O link de voltar vai para o perfil do consultor ou lista? Pode ir para a lista ou histórico (-1) */}
          <button onClick={() => navigate(-1)} className="btn btn-link text-decoration-none text-secondary small mb-4 d-inline-flex align-items-center fw-bold p-0">
            <i className="bi bi-arrow-left me-1"></i> Voltar
          </button>

          <div className="row g-4">
            <div className="col-md-4">
              <div className={`card h-100 border-0 shadow-sm rounded-4 p-5 text-center ${conquista.obtida ? 'bg-white' : 'bg-light'}`}>
                <div className="d-flex justify-content-center mb-4">
                  <div className="rounded-circle d-flex align-items-center justify-content-center shadow overflow-hidden" 
                       style={{ 
                         width: '150px', height: '150px', 
                         backgroundColor: conquista.obtida ? '#F9F1DC' : '#E9ECEF', 
                         border: conquista.obtida ? '6px solid #D4AF37' : '6px solid #ADB5BD' 
                       }}>
                    <img
                          src={resolvePublicBadgeImage(conquista.urlImagem || conquista.imagem || conquista.img)}
                          onError={useDefaultBadgeImageOnError}
                          alt={conquista.titulo}
                          className="w-100 h-100"
                          style={{ objectFit: 'contain', padding: '10px', filter: conquista.obtida ? 'none' : 'grayscale(1)', opacity: conquista.obtida ? 1 : 0.75 }}
                        />
                  </div>
                </div>
                <h4 className="fw-bold">{conquista.titulo}</h4>
                <span className={`badge rounded-pill mb-3 ${conquista.obtida ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                  {conquista.raridade}
                </span>
                
                <div className="mt-3">
                   <h2 className="fw-bold text-primary">+{conquista.bonus}</h2>
                   <p className="text-muted small fw-bold text-uppercase">Pontos Bónus</p>
                </div>
              </div>
            </div>

            <div className="col-md-8">
              <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
                <div className="mb-4">
                  <h5 className="fw-bold border-bottom pb-2">Descrição da Conquista</h5>
                  <p className="text-muted">{conquista.descricao}</p>
                </div>

                <div className="mb-4">
                  <h5 className="fw-bold border-bottom pb-2">Regras de Obtenção</h5>
                  <p className="text-muted small">{conquista.regras}</p>
                  {!conquista.obtida && (
                    <div className="mt-3">
                      <div className="d-flex justify-content-between mb-1 small fw-bold">
                        <span>Progresso Estimado do Consultor</span>
                        <span>{conquista.progressoLabel || 'Em curso'}</span>
                      </div>
                      <div className="progress" style={{height: '10px'}}>
                        <div className="progress-bar progress-bar-striped progress-bar-animated bg-primary" style={{width: `${conquista.progressoValor || 0}%`}}></div>
                      </div>
                    </div>
                  )}
                </div>

                {conquista.obtida ? (
                  <div className="bg-success bg-opacity-10 p-4 rounded-4 border border-success border-opacity-25 mt-auto">
                    <div className="d-flex align-items-center gap-3">
                      <i className="bi bi-calendar-check-fill text-success fs-2"></i>
                      <div>
                        <h6 className="fw-bold m-0 text-success">Conquistado com Sucesso!</h6>
                        <p className="m-0 small text-muted">Esta insígnia foi adicionada ao perfil do consultor em <strong>{conquista.data}</strong></p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-light p-4 rounded-4 border mt-auto text-center">
                    <p className="text-muted mb-0 small"><i className="bi bi-info-circle me-2"></i>O consultor ainda não completou os requisitos para esta conquista.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default DetalhesConquistaEspecialSLL;
