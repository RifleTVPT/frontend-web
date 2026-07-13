import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import SidebarConsultor from '../../components/SidebarConsultor';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import TabelaGenerica from '../../components/TabelaGenerica';
import '../../assets/dashboard.css';

const DetalhesPedidoConsultor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [utilizador, setUtilizador] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('https://via.placeholder.com/40');

  useEffect(() => {
    const userLocal = JSON.parse(sessionStorage.getItem('user'));
    if (!userLocal) {
        navigate('/login');
        return;
    }
    setUtilizador(userLocal);

    // Carregar a foto de perfil
    const carregarFotoPerfil = async () => {
      try {
          const response = await axios.get(`https://softinsa-api-riya.onrender.com/users/configuracoes/${userLocal.ID_UTILIZADOR}`);
          if (response.data.success && response.data.data.avatar) {
              setAvatarUrl(response.data.data.avatar);
          }
      } catch (error) {
          console.error("Erro ao carregar a foto de perfil:", error);
      }
    };
    carregarFotoPerfil();

    const carregarDetalhes = async () => {
      try {
        const response = await axios.get(`https://softinsa-api-riya.onrender.com/pedidos/detalhes/${id}`);
        if (response.data.success) {
          setPedido(response.data.data);
        }
      } catch (error) {
        console.error("Erro ao carregar pedido:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarDetalhes();
  }, [id, navigate]);

  if (loading || !pedido) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

  const renderTimelineIcon = (tipo) => {
    switch(tipo) {
      case 'success':
        return <div className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center shadow-sm" style={{width: '32px', height: '32px', zIndex: 2}}><i className="bi bi-check fs-5"></i></div>;
      case 'pending':
        return <div className="rounded-circle bg-warning text-dark d-flex align-items-center justify-content-center shadow-sm" style={{width: '32px', height: '32px', zIndex: 2}}><i className="bi bi-hourglass-split fs-6"></i></div>;
      case 'danger':
        return <div className="rounded-circle bg-danger text-white d-flex align-items-center justify-content-center shadow-sm" style={{width: '32px', height: '32px', zIndex: 2}}><i className="bi bi-x fs-5"></i></div>;
      default:
        return <div className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center shadow-sm" style={{width: '32px', height: '32px', zIndex: 2}}><i className="bi bi-info fs-5"></i></div>;
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="d-flex bg-light min-vh-100">
      <SidebarConsultor />

      <div className="flex-grow-1 p-4 dashboard-scroll">
        <div className="container-fluid text-start">
          
          {/* CABEÇALHO PADRONIZADO */}
          <CabecalhoDashboard 
            titulo={`Pedido Badge: ${pedido.titulo}`}
            subtitulo={pedido.serviceLine}
            utilizador={utilizador}
            avatarUrl={avatarUrl}
            ocultarSaudacao={true}
          />

          <Link to="/pedidos/historico" className="text-decoration-none text-secondary small mb-4 d-inline-block fw-bold">
            <i className="bi bi-arrow-left"></i> Voltar ao Histórico de Pedidos
          </Link>

          <div className="text-center mb-5 mt-3">
            <h4 className="fw-bold mb-3">Detalhes do Pedido de Badge</h4>
            <span className={`badge bg-${pedido.corStatus} px-5 py-2 fs-6 rounded-3 shadow-sm`}>
              {pedido.status}
            </span>
            <p className="text-muted small mt-2">Último estado: {pedido.ultimoEstado}</p>
          </div>

          <div className="row g-4 mb-5">
            <div className="col-md-5">
              <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white text-start">
                <h4 className="fw-bold mb-4">Informações do Badge</h4>
                <div className="lh-lg">
                  <p className="mb-1"><strong>Service Line:</strong> {pedido.serviceLine || 'Indefinida'}</p>
                  <p className="mb-1"><strong>Área:</strong> {pedido.infoBadge.area}</p>
                  <p className="mb-1"><strong>Nível:</strong> {pedido.infoBadge.nivel}
                    {pedido.infoBadge.nivel === 'A' ? ' (Júnior)' 
                    : pedido.infoBadge.nivel === 'B' ? ' (Intermédio)'
                    : pedido.infoBadge.nivel === 'C' ? ' (Sénior)'
                    : pedido.infoBadge.nivel === 'D' ? ' (Especialista)'
                    : pedido.infoBadge.nivel === 'E' ? ' (Líder de Conhecimento)'
                    : ''}
                  </p>
                  <p className="mb-1"><strong>Requisitos Necessários:</strong> {pedido.infoBadge.requisitos} requisitos</p>
                  <p className="mb-1"><strong>Pontos a Conquistar:</strong> {pedido.infoBadge.pontos}</p>
                  <p className="mb-4"><strong>Validade Padrão:</strong> {pedido.infoBadge.validadePadrao}</p>
                </div>
                {/* BOTÃO CORRIGIDO: Vai diretamente para os detalhes do badge no Catálogo */}
                <Link to={`/detalhes/${pedido.infoBadge.idBadge}`} className="btn btn-primary rounded-3 px-4 fw-bold text-center">
                  Ver Detalhes do Badge
                </Link>
              </div>
            </div>

            {/* TIMELINE DINÂMICA */}
            <div className="col-md-7">
              <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white text-start">
                <h4 className="fw-bold mb-4">Histórico de Validação</h4>
                <div className="ps-3 pt-2 position-relative">
                  {pedido.timeline.map((step, index) => (
                    <div key={index} className="d-flex gap-3 mb-4 position-relative">
                      {/* Linha vertical que liga os pontos */}
                      {index !== pedido.timeline.length - 1 && (
                        <div className="position-absolute" style={{ width: '2px', top: '32px', bottom: '-24px', backgroundColor: '#E9ECEF', left: '15px', zIndex: 1 }}></div>
                      )}
                      
                      <div className="d-flex flex-column align-items-center" style={{ width: '32px' }}>
                        {renderTimelineIcon(step.iconType)}
                      </div>
                      <div className="pb-2">
                        <h6 className="fw-bold text-dark m-0 mb-1">{step.acao}</h6>
                        <p className="m-0 text-muted small">
                          <i className="bi bi-calendar-event me-1"></i>{step.data} &nbsp;&bull;&nbsp; <i className="bi bi-person-fill me-1"></i>{step.user}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-auto pt-3 border-top">
                  <p className="m-0"><strong className={pedido.status === 'Recusado' ? 'text-danger' : 'text-primary'}>Mensagem da última decisão:</strong> <span className="text-muted small">{pedido.observacoes || 'Sem mensagem adicional.'}</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* TABELA DE EVIDÊNCIAS DINÂMICA */}
          <h4 className="fw-bold text-start mb-3">Evidências Submetidas</h4>
          <TabelaGenerica 
            colunas={['Requisito', 'Evidência (Ficheiro)', 'Ação']}
            emptyMessage="Nenhuma evidência submetida."
          >
            {pedido.evidencias.map((ev, idx) => (
                <tr key={idx} className="border-bottom">
                  <td className="py-3 fw-bold">{ev.req}</td>
                  <td className="py-3 text-muted">{ev.ficheiro}</td>
                  <td className="py-3">
                    {/* Na vida real, o onClick faria download do URL da Evidência */}
                    {ev.url ? (
                      <a
                        href={ev.url.startsWith('http') ? ev.url : `https://softinsa-api-riya.onrender.com${ev.url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="consultor-download-action btn btn-primary btn-sm rounded-3 px-3"
                      >
                        <i className="bi bi-download me-2"></i> Ver / Download
                      </a>
                    ) : (
                      <span className="badge bg-warning-subtle text-warning-emphasis border border-warning">
                        Ficheiro indisponível — requer novo envio
                      </span>
                    )}
                  </td>
                </tr>
            ))}
          </TabelaGenerica>

          <div className="text-center mt-5 pb-5">
             <Link to="/pedidos/historico" className="btn btn-outline-dark px-5 py-2 rounded-3 fw-bold bg-white shadow-sm">
                Voltar à Lista de Pedidos
             </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DetalhesPedidoConsultor;
