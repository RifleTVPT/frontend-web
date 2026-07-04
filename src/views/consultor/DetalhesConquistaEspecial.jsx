import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import SidebarConsultor from '../../components/SidebarConsultor';
import { getApiOrigin } from '../../utils/publicBadgeImage';
import { abrirPartilhaLinkedIn } from '../../utils/linkedinShare';
import '../../assets/dashboard.css';

const DetalhesConquistaEspecial = () => {
  const { id } = useParams();
  const [conquista, setConquista] = useState(null);
  const [utilizador, setUtilizador] = useState(null);
  const [loading, setLoading] = useState(true);
  const [linkCopiado, setLinkCopiado] = useState(false);

  useEffect(() => {
    const userLocal = JSON.parse(sessionStorage.getItem('user'));
    if (userLocal) setUtilizador(userLocal);
    
    const fetchDetalhes = async () => {
      try {
        const response = await axios.get(`https://softinsa-api-riya.onrender.com/conquistas/detalhes/${userLocal.ID_UTILIZADOR}/${id}`);
        if (response.data.success) {
          setConquista(response.data.data);
        }
      } catch (error) {
        console.error("Erro:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetalhes();
  }, [id]);

  if (loading || !conquista) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

  const gerarCertificado = async () => {
    try {
        const userLocal = JSON.parse(sessionStorage.getItem('user'));
        
        const response = await axios.get(
            `https://softinsa-api-riya.onrender.com/conquistas/${userLocal.ID_UTILIZADOR}/${id}/certificado`,
            { responseType: 'blob' }
        );

        const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', `Certificado_Conquista_${conquista.titulo.replace(/\s+/g, '_')}.pdf`);
        document.body.appendChild(link);
        link.click();
        
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);

    } catch (error) {
        alert("Erro ao tentar transferir o Certificado Oficial da Conquista.");
        console.error(error);
    }
  };

  const partilharLinkedIn = () => {
    const publicOrigin = (import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, '');
    const urlPublica = `${publicOrigin}/verificacao-especial/${utilizador.ID_UTILIZADOR}/${conquista.id}`;
    const urlPartilha = `${getApiOrigin()}/partilha/linkedin/premium/${utilizador.ID_UTILIZADOR}/${conquista.id}`;
    abrirPartilhaLinkedIn({
      urlPartilha,
      urlPublica,
      texto: `Alcancei a conquista especial "${conquista.titulo}" na Plataforma de Badges Softinsa! +${conquista.bonus} pontos.`
    });
  };

  const copiarLinkPublico = () => {
    const publicOrigin = (import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, '');
    const urlPublica = `${publicOrigin}/verificacao-especial/${utilizador.ID_UTILIZADOR}/${conquista.id}`;
    navigator.clipboard.writeText(urlPublica).then(() => {
        setLinkCopiado(true);
        setTimeout(() => setLinkCopiado(false), 2000);
    }).catch(err => {
        alert("Erro ao copiar link: " + err);
    });
  };

  return (
    <div className="d-flex bg-light min-vh-100">
      <SidebarConsultor />

      <div className="flex-grow-1 p-4 dashboard-scroll">
        <div className="container-fluid text-start">
          
          {/* BOTÃO CORRIGIDO: Volta para a página correta (/conquistas) */}
          <Link to="/conquistas" className="text-decoration-none text-secondary small mb-4 d-inline-block fw-bold">
            <i className="bi bi-arrow-left"></i> Voltar à Galeria de Honra
          </Link>

          <div className="row g-4">
            <div className="col-md-4">
              <div className={`card h-100 border-0 shadow-sm rounded-4 p-5 text-center ${conquista.obtida ? 'bg-white' : 'bg-light'}`}>
                <div className="d-flex justify-content-center mb-4">
                  {conquista.obtida ? (
                    <Link to={`/verificacao-especial/${utilizador?.ID_UTILIZADOR}/${conquista.id}`} target="_blank" rel="noopener noreferrer" className="rounded-circle d-flex align-items-center justify-content-center shadow hover-overlay text-decoration-none" 
                         style={{ 
                           width: '150px', height: '150px', 
                           backgroundColor: '#F9F1DC', 
                           border: '6px solid #D4AF37' 
                         }}>
                      <i className="bi bi-patch-check-fill text-warning" style={{fontSize: '4rem'}}></i>
                    </Link>
                  ) : (
                    <div className="rounded-circle d-flex align-items-center justify-content-center shadow" 
                         style={{ 
                           width: '150px', height: '150px', 
                           backgroundColor: '#E9ECEF', 
                           border: '6px solid #ADB5BD' 
                         }}>
                      <i className="bi bi-lock-fill text-secondary" style={{fontSize: '4rem'}}></i>
                    </div>
                  )}
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
                  <h5 className="fw-bold border-bottom pb-2">Como obter</h5>
                  <p className="text-muted">{conquista.regras}</p>
                  {!conquista.obtida && (
                    <div className="mt-3">
                      <div className="d-flex justify-content-between mb-1 small fw-bold">
                        <span>Progresso Estimado</span>
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
                        <p className="m-0 small text-muted">Este badge especial foi adicionado ao seu perfil em <strong>{conquista.data}</strong></p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-light p-4 rounded-4 border mt-auto text-center">
                    <p className="text-muted mb-0 small"><i className="bi bi-info-circle me-2"></i>Continue a progredir para desbloquear esta recompensa.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {conquista.obtida && (
            <div className="d-flex justify-content-center gap-3 mt-5 flex-wrap">
              <button onClick={copiarLinkPublico} className={`btn ${linkCopiado ? 'btn-success' : 'btn-outline-secondary'} px-4 rounded-pill fw-bold shadow-sm`}>
                <i className={`bi ${linkCopiado ? 'bi-check2' : 'bi-link-45deg'} me-2`}></i> 
                {linkCopiado ? 'Link Copiado!' : 'Copiar Link Público'}
              </button>
              <button onClick={partilharLinkedIn} className="btn btn-outline-primary px-4 rounded-pill fw-bold shadow-sm">
                <i className="bi bi-linkedin me-2"></i> Partilhar no LinkedIn
              </button>
              <button onClick={gerarCertificado} className="btn btn-primary px-4 rounded-pill fw-bold shadow-sm">
                <i className="bi bi-file-earmark-pdf-fill me-2"></i> Descarregar Certificado
              </button>
              <Link to="/performance/ranking" className="btn btn-dark px-4 rounded-pill fw-bold shadow-sm">
                Ver Ranking Global
              </Link>
            </div>
          )}
          {!conquista.obtida && (
            <div className="d-flex justify-content-center mt-5">
              <Link to="/performance/ranking" className="btn btn-primary px-4 rounded-pill fw-bold shadow">
                Ver Ranking Global
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default DetalhesConquistaEspecial;
