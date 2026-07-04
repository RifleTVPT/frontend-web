import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import SidebarConsultor from '../../components/SidebarConsultor';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import { getApiOrigin } from '../../utils/publicBadgeImage';
import { abrirPartilhaLinkedIn } from '../../utils/linkedinShare';
import '../../assets/dashboard.css';

const DetalhesBadgeObtidoConsultor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const nivelNameMap = {'A':'Júnior', 'B':'Intermédio', 'C':'Sénior', 'D':'Especialista', 'E':'Líder de Conhecimento'};
  const [badgeData, setBadgeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [utilizador, setUtilizador] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('https://via.placeholder.com/40');

  useEffect(() => {
    const userLocal = JSON.parse(sessionStorage.getItem('user'));
    if (!userLocal) {
        navigate('/login');
        return;
    }

    const fetchDetalhesObtidos = async () => {
      try {
        setUtilizador(userLocal);
        const [response, userRes] = await Promise.all([
            axios.get(`https://softinsa-api-riya.onrender.com/meus-badges/consultor/${userLocal.ID_UTILIZADOR}/badge/${id}`),
            axios.get(`https://softinsa-api-riya.onrender.com/users/configuracoes/${userLocal.ID_UTILIZADOR}`)
        ]);
        
        if (response.data.success) {
          setBadgeData(response.data.data);
        }
        if (userRes.data.success && userRes.data.data.avatar) {
          setAvatarUrl(userRes.data.data.avatar);
        }
      } catch (error) {
        console.error("Erro ao buscar detalhes do badge obtido:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetalhesObtidos();
  }, [id, navigate]);

  const copiarLinkPublico = () => {
    if (badgeData && badgeData.linkUnico) {
        const publicOrigin = (import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, '');
        const urlVerificacao = `${publicOrigin}/verificacao/${encodeURIComponent(badgeData.linkUnico)}`;
        navigator.clipboard.writeText(urlVerificacao)
        .then(() => alert("Link de verificação copiado para a área de transferência!"))
        .catch(err => console.error('Erro ao copiar: ', err));
    } else {
        alert("Link de verificação não disponível.");
    }
  };

  const partilharLinkedIn = () => {
    const publicOrigin = (import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, '');
    const urlPublica = `${publicOrigin}/verificacao/${encodeURIComponent(badgeData.linkUnico)}`;
    const urlPartilha = `${getApiOrigin()}/partilha/linkedin/badge/${encodeURIComponent(badgeData.linkUnico)}`;
    abrirPartilhaLinkedIn({
      urlPartilha,
      urlPublica,
      texto: `Conquistei o badge "${badgeData.titulo}" na Plataforma de Badges Softinsa.`
    });
  };

  const handleRenovar = async () => {
    if(!window.confirm("Deseja iniciar o processo de renovação? O Badge deixará de estar ativo no seu perfil até ser novamente aprovado.")) return;
    try {
        const userLocal = JSON.parse(sessionStorage.getItem('user'));
        const res = await axios.post('https://softinsa-api-riya.onrender.com/pedidos/consultor/renovar', {
            idUtilizador: userLocal.ID_UTILIZADOR,
            idBadge: badgeData.id
        });
        if(res.data.success) {
            alert("Badge pronto a renovar. Será redirecionado para a candidatura!");
            navigate(`/candidatar/${badgeData.id}`);
        }
    } catch(e) {
        alert("Erro ao renovar: " + (e.response?.data?.message || e.message));
    }
  };

  const gerarPDF = async () => {
    try {
        const userLocal = JSON.parse(sessionStorage.getItem('user'));
        
        // Fazer fetch do PDF como um Blob
        const response = await axios.get(
            `https://softinsa-api-riya.onrender.com/meus-badges/consultor/${userLocal.ID_UTILIZADOR}/badge/${badgeData.id}/certificado`,
            { responseType: 'blob' }
        );

        // Criar link temporário para forçar o download no browser
        const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', `Certificado_${badgeData.titulo.replace(/\s+/g, '_')}.pdf`);
        document.body.appendChild(link);
        link.click();
        
        // Limpeza
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);

    } catch (error) {
        alert("Erro ao tentar transferir o Certificado Oficial da Softinsa.");
        console.error(error);
    }
  };

  const copiarAssinaturaEmail = () => {
      const apiOrigin = ['localhost', '127.0.0.1'].includes(window.location.hostname)
          ? `${window.location.protocol}//${window.location.hostname}:3000`
          : window.location.origin;

      let urlBadge = badgeData.urlImagem && badgeData.urlImagem.trim() !== '' && !badgeData.urlImagem.includes('placeholder') 
          ? badgeData.urlImagem 
          : `${apiOrigin}/uploads/default-trophy.png`;

      if (/^https?:\/\/localhost:3000/i.test(urlBadge)) {
          urlBadge = urlBadge.replace(/^https?:\/\/localhost:3000/i, apiOrigin);
      } else if (urlBadge.startsWith('/')) {
          urlBadge = `${apiOrigin}${urlBadge}`;
      } else if (!/^https?:\/\//i.test(urlBadge)) {
          urlBadge = `${apiOrigin}/uploads/${urlBadge.replace(/^uploads\//, '')}`;
      }
      
      const publicOrigin = (import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, '');
      const urlVerificacao = `${publicOrigin}/verificacao/${encodeURIComponent(badgeData.linkUnico)}`;

      const htmlAssinatura = `
        <div style="font-family: Arial, sans-serif; color: #333; margin-top: 15px; border-top: 1px solid #ccc; padding-top: 10px;">
            <p style="margin: 0; font-weight: bold; font-size: 14px;">${utilizador?.NOME_UTILIZADOR || utilizador?.NOME_COMPLETO_UTILIZADOR || 'Consultor'}</p>
            <p style="margin: 0; font-size: 12px; color: #666;">Consultor | Softinsa</p>
            <table style="margin-top: 10px;">
                <tr>
                    <td>
                        <a href="${urlVerificacao}" target="_blank">
                            <img src="${urlBadge}" alt="Badge ${badgeData.titulo}" width="72" height="72" style="display: block; width: 72px; height: 72px; object-fit: contain; border-radius: 8px;" />
                        </a>
                    </td>
                    <td style="padding-left: 10px;">
                        <p style="margin: 0; font-size: 12px; font-weight: bold; color: #0d6efd;">Competência Certificada</p>
                        <p style="margin: 0; font-size: 16px;"><a href="${urlVerificacao}" style="text-decoration: underline; color: #333; font-weight: bold;">${badgeData.titulo}</a></p>
                        <p style="margin: 0; font-size: 11px; color: #666; margin-top: 3px;">
                            Service Line: <strong>${badgeData.serviceLine || 'Geral'}</strong> | Área: <strong>${badgeData.area || 'Geral'}</strong> | Nível: <strong>${badgeData.nivel}</strong>
                        </p>
                    </td>
                </tr>
            </table>
        </div>
      `;

      // Para copiar HTML para o clipboard (suportado nos browsers modernos)
      const blobHtml = new Blob([htmlAssinatura], { type: "text/html" });
      const blobText = new Blob([`Assinatura de ${badgeData.titulo}`], { type: "text/plain" });
      const data = [new window.ClipboardItem({ "text/html": blobHtml, "text/plain": blobText })];

      navigator.clipboard.write(data).then(
          () => alert("Assinatura copiada! Pode colar diretamente no Outlook ou Gmail."),
          () => alert("Erro ao copiar assinatura de email. Tente manualmente.")
      );
  };

  if (loading || !badgeData) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="d-flex bg-light min-vh-100">
      <SidebarConsultor />

      <div className="flex-grow-1 p-4 dashboard-scroll">
        <div className="container-fluid text-start">
          <Link to="/meus-badges" className="text-decoration-none text-secondary small mb-3 d-inline-block">
            <i className="bi bi-arrow-left"></i> Voltar aos Meus Badges Obtidos
          </Link>
          
          <CabecalhoDashboard 
            titulo={`Detalhes do Badge: ${badgeData.titulo}`}
            subtitulo={`Service Line: ${badgeData.serviceLine || 'Geral'}`}
            utilizador={utilizador}
            avatarUrl={avatarUrl}
            ocultarSaudacao={true}
          />

          <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
            <div className="row align-items-center text-start">
              <div className="col-md-4 text-center border-end">
                <Link to={`/verificacao/${encodeURIComponent(badgeData.linkUnico)}`} target="_blank" rel="noopener noreferrer" className="rounded-circle border border-primary d-inline-flex align-items-center justify-content-center overflow-hidden mb-3 shadow-sm hover-overlay position-relative bg-light" style={{width: '180px', height: '180px', display: 'inline-block'}}>
                  <i className="bi bi-trophy-fill text-warning position-absolute" style={{ fontSize: '7rem', zIndex: 1, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}></i>
                  {(() => {
                      const imageSrc = badgeData.urlImagem && badgeData.urlImagem.trim() !== '' && !badgeData.urlImagem.includes('placeholder') && !badgeData.urlImagem.includes('default-trophy') && !badgeData.urlImagem.includes('3112946.png') ? badgeData.urlImagem : null;
                      if (!imageSrc) return null;
                      return (
                          <img 
                              src={imageSrc} 
                              onError={(e) => { e.target.style.display = 'none'; }}
                              alt="Badge" 
                              className="position-absolute w-100 h-100"
                              style={{ objectFit: 'cover', zIndex: 2, top: 0, left: 0 }} 
                          />
                      );
                  })()}
                </Link>
                
                <div className="mb-4">
                  <span className={`badge rounded-pill px-3 py-2 mb-2 ${badgeData.status === 'Ativo' ? 'bg-success bg-opacity-10 text-success border border-success' : 'bg-danger bg-opacity-10 text-danger border border-danger'}`}>
                    <i className="bi bi-circle-fill me-2" style={{fontSize: '8px'}}></i>Status: {badgeData.status}
                  </span>
                  
                  <div className="text-dark fw-bold mt-2" style={{fontSize: '14px'}}>
                    Obtido em: <span className="text-primary">{badgeData.dataValidado}</span>
                  </div>
                  
                  <div className={`fw-bold mt-1 ${badgeData.status === 'Ativo' ? (badgeData.expiraEm.includes('Sem') || badgeData.expiraEm.includes('Não') ? 'text-success' : 'text-warning') : 'text-danger'}`} style={{fontSize: '14px'}}>
                    {badgeData.expiraEm} {badgeData.dataExpira !== 'N/A' ? `(${badgeData.dataExpira})` : ''}
                  </div>
                </div>

                <div className="text-start ps-4 small mt-4">
                  <p className="mb-1"><strong>Service Line:</strong> {badgeData.serviceLine || 'Geral'}</p>
                  <p className="mb-1"><strong>Área:</strong> {badgeData.area || 'Geral'}</p>
                  <p className="mb-1"><strong>Nível:</strong> {badgeData.nivel && nivelNameMap[badgeData.nivel] ? `${nivelNameMap[badgeData.nivel]} (Nível ${badgeData.nivel})` : badgeData.nivel}</p>
                  <p className="mb-1"><strong>Validade:</strong> {badgeData.validade}</p>
                  <p className="mb-1"><strong>Pontos:</strong> {badgeData.pontos} pontos</p>
                </div>
              </div>

              <div className="col-md-8 ps-5">
                <h4 className="fw-bold mb-3">Descrição</h4>
                <p className="text-muted small leading-relaxed">{badgeData.descricao}</p>
              </div>
            </div>
          </div>

          <h5 className="fw-bold mb-3 mt-5">Requisitos concluídos para a sua Obtenção</h5>
          <div className="row g-3 mb-5">
            {badgeData.requisitos && badgeData.requisitos.map((req, idx) => {
              // Filtrar ficheiros submetidos para este requisito
              const ficheiros = badgeData.ficheiros ? badgeData.ficheiros.filter(f => f.idRequisito === req.idBd) : [];
              return (
                <div key={req.idBd} className="col-md-4">
                  <div className="card border-0 shadow-sm p-4 text-center rounded-3 bg-white h-100 d-flex flex-column justify-content-between">
                    <div>
                        <h6 className="fw-bold m-0 text-primary">Requisito {badgeData.nivel}{idx + 1}</h6>
                        <small className="d-block mt-2 text-muted fw-bold">{req.desc}</small>
                    </div>
                    
                    {ficheiros.length > 0 && (
                        <div className="mt-4 pt-3 border-top text-start">
                            <small className="fw-bold d-block mb-2 text-secondary" style={{fontSize: '11px'}}>Evidências Submetidas:</small>
                            {ficheiros.map((f, idx) => (
                                <a key={idx} href={`https://softinsa-api-riya.onrender.com${f.url}`} target="_blank" rel="noopener noreferrer" className="d-block small text-decoration-none text-truncate mb-1" style={{fontSize: '12px'}}>
                                    <i className="bi bi-file-earmark-text text-primary me-2"></i>{f.nome}
                                </a>
                            ))}
                        </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <h5 className="fw-bold mb-4 mt-5">Partilha e Opções de Badge</h5>
          {badgeData.status === 'Ativo' ? (
              <div className="row g-4 text-center justify-content-center">
                {badgeData.renovavel && (
                  <div className="col-12">
                    <button onClick={handleRenovar} className="btn btn-danger rounded-pill px-5 py-2 fw-bold shadow-sm">
                      <i className="bi bi-arrow-clockwise me-2"></i>Renovar candidatura
                    </button>
                  </div>
                )}
                <div className="col-md-3">
                  <button
                    type="button"
                    onClick={partilharLinkedIn}
                    className="btn btn-white bg-white border shadow-sm w-100 py-3 rounded-3 d-flex flex-column align-items-center justify-content-center gap-1 fw-medium text-decoration-none text-dark hover-overlay h-100"
                  >
                    <i className="bi bi-linkedin text-primary fs-3"></i> 
                    <span className="small">Partilhar no LinkedIn</span>
                  </button>
                </div>
                <div className="col-md-3">
                  <button 
                    className="btn btn-primary w-100 py-3 rounded-3 d-flex flex-column align-items-center justify-content-center gap-1 fw-medium shadow hover-overlay h-100"
                    onClick={copiarLinkPublico}>
                    <i className="bi bi-link-45deg fs-3 text-white"></i> 
                    <span className="small">Link de Verificação</span>
                  </button>
                </div>
                <div className="col-md-3">
                  <button 
                    className="btn btn-white bg-white border shadow-sm w-100 py-3 rounded-3 d-flex flex-column align-items-center justify-content-center gap-1 fw-medium hover-overlay h-100" 
                    onClick={gerarPDF}>
                    <i className="bi bi-file-earmark-pdf fs-3 text-danger"></i> 
                    <span className="small">Certificado Oficial</span>
                  </button>
                </div>
                <div className="col-md-3">
                  <button 
                    className="btn btn-white bg-white border shadow-sm w-100 py-3 rounded-3 d-flex flex-column align-items-center justify-content-center gap-1 fw-medium hover-overlay h-100" 
                    onClick={copiarAssinaturaEmail}>
                    <i className="bi bi-envelope-check fs-3 text-success"></i> 
                    <span className="small">Assinatura de Email</span>
                  </button>
                </div>
              </div>
          ) : (
              <div className="row g-4">
                  <div className="col-md-6">
                      <div className="card bg-white border-danger border border-2 shadow-sm rounded-3 p-4 h-100">
                          <div className="d-flex align-items-center gap-3 text-danger">
                              <i className="bi bi-exclamation-triangle-fill fs-1"></i>
                              <div>
                                  <h6 className="fw-bold m-0">Badge Expirado</h6>
                                  <small className="text-muted">Não é possível partilhar publicamente badges inativos.</small>
                              </div>
                          </div>
                      </div>
                  </div>
                  <div className="col-md-6">
                      <div className="card bg-white border-0 shadow-sm rounded-3 p-4 h-100 d-flex flex-column justify-content-center">
                          <small className="text-muted d-block mb-3">Pode recuperar este badge refazendo os requisitos.</small>
                          <button onClick={handleRenovar} className="btn btn-primary w-100 py-3 rounded-3 fw-bold d-flex align-items-center justify-content-center gap-2">
                              <i className="bi bi-arrow-clockwise fs-5"></i> Renovar Badge Agora
                          </button>
                      </div>
                  </div>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetalhesBadgeObtidoConsultor;
