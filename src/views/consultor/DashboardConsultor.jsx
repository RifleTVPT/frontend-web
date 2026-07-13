import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/SidebarConsultor';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import CartaoEstatistica from '../../components/CartaoEstatistica';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { resolvePublicBadgeImage, useDefaultBadgeImageOnError } from '../../utils/publicBadgeImage';
import '../../assets/dashboard.css';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const DashboardConsultor = () => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [utilizador, setUtilizador] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('https://via.placeholder.com/40');
  
  const [stats, setStats] = useState({
    totalPontos: 0, pontosSemana: 0, badgesAno: 0, crescimentoAno: 0, ranking: 0,
    totalConsultores: 0, proximaExpiracao: "A carregar...", diasParaExpirar: 0, progressoGeral: 0 
  });

  const [jornadaCarreira, setJornadaCarreira] = useState([]);
  const [badgesRecomendados, setBadgesRecomendados] = useState([]);
  const [avisos, setAvisos] = useState([]);
  
  const [lineData, setLineData] = useState({
    labels: [],
    datasets: [{
      label: 'Pontos',
      data: [],
      borderColor: '#F93131',
      backgroundColor: 'rgba(249, 49, 49, 0.1)',
      tension: 0.4,
      fill: true,
      pointRadius: 5,
    }]
  });

  useEffect(() => {
    const userLocal = JSON.parse(sessionStorage.getItem('user'));
    if (!userLocal || !userLocal.ID_UTILIZADOR) {
      // Se a sessão for antiga e não tiver o ID achatado, força a limpeza e volta ao login!
      sessionStorage.removeItem('user');
      navigate('/');
      return;
    }
    setUtilizador(userLocal);

    // Carregar a foto de perfil oficial da BD para o cabeçalho
    const carregarFotoPerfil = async () => {
      try {
          const response = await axios.get(`https://softinsa-api-riya.onrender.com/users/configuracoes/${userLocal.ID_UTILIZADOR}`);
          if (response.data.success && response.data.data.avatar) {
              setAvatarUrl(response.data.data.avatar);
          }
      } catch (error) {
          console.error("Erro ao carregar a foto de perfil no header:", error);
      }
    };
    carregarFotoPerfil();

    // Carregar os dados do Dashboard
    const carregarDashboard = async () => {
      try {
        const response = await axios.get(`https://softinsa-api-riya.onrender.com/dashboard/consultor/dados/${userLocal.ID_UTILIZADOR}`);
        
        if (response.data.success) {
          const dados = response.data.data;
          
          setStats(dados.stats);
          setJornadaCarreira(dados.jornadaCarreira);
          setBadgesRecomendados(dados.badgesRecomendados);
          setAvisos(dados.avisos);
          
          setLineData({
            labels: dados.grafico.labels,
            datasets: [{
              ...lineData.datasets[0],
              data: dados.grafico.valores,
              pointBackgroundColor: (context) => context.raw === Math.max(...dados.grafico.valores) ? '#F93131' : 'transparent',
            }]
          });
        }
      } catch (error) {
        console.error("Erro ao carregar o dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarDashboard();
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    navigate('/'); 
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100" style={{ backgroundColor: '#F4F5F9' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">A carregar...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex bg-light min-vh-100">
      <Sidebar />

      <div className="flex-grow-1 p-4 dashboard-scroll">
        <div className="container-fluid">
          
          {/* CABEÇALHO PADRONIZADO (COMPONENTE) */}
          <CabecalhoDashboard 
            titulo="Dashboard - Consultor" 
            utilizador={utilizador} 
            avatarUrl={avatarUrl} 
            linkHome="/dashboard" 
          />

          {/* KPIs Principais (COMPONENTES) */}
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <CartaoEstatistica 
                titulo="Total de Pontos"
                valor={`${stats.totalPontos} Pontos`}
                subtitulo={
                  <span>
                    <span 
                      className={stats.pontosSemana > 0 ? "fw-bold fs-6" : (stats.pontosSemana < 0 ? "text-danger fw-bold fs-6" : "")}
                      style={stats.pontosSemana > 0 ? { color: '#39FF14' } : {}}
                    >
                      {stats.pontosSemana > 0 ? '+' : ''}{stats.pontosSemana}
                    </span> obtidos esta semana
                  </span>
                }
                fundoEscuro={true}
                corDestaque="primary"
              />
            </div>
            <div className="col-md-3">
              <CartaoEstatistica 
                titulo="Badges Emitidos (ano)"
                valor={`${stats.badgesAno} Badges`}
                subtitulo={
                  <span>
                    <span className={stats.crescimentoAno > 0 ? "text-success fw-bold" : (stats.crescimentoAno < 0 ? "text-danger fw-bold" : "")}>
                      {stats.crescimentoAno > 0 ? '+' : ''}{stats.crescimentoAno}%
                    </span> vs Ano Anterior
                  </span>
                }
              />
            </div>
            <div className="col-md-3">
              <CartaoEstatistica 
                titulo="Ranking Pessoal"
                valor={`#${stats.ranking}º lugar`}
                subtitulo={`De ${stats.totalConsultores} consultores totais`}
              />
            </div>
            <div className="col-md-3">
              <CartaoEstatistica 
                titulo="Próxima Expiração"
                icone="bi-exclamation-triangle-fill text-warning"
                valor={stats.proximaExpiracao}
                subtitulo={`${stats.diasParaExpirar} dias restantes`}
                corDestaque="danger"
              />
            </div>
          </div>

          {/* Gráficos e Recomendações */}
          <div className="row g-3 mb-4">
            {/* Gráfico Circular de Progresso */}
            <div className="col-md-3">
              <div className="card border-0 shadow-sm p-3 h-100 bg-white text-start">
                <h6 className="fw-bold mb-1">O meu Progresso Geral</h6>
                <small className="text-muted mb-4 d-block">Badges da minha Service Line já obtidos</small>
                <div className="progresso-circular-container">
                  <div className="anel-fundo"></div>
                  <div className="anel-progresso" style={{
                    background: `conic-gradient(#0d6efd ${stats.progressoGeral * 3.6}deg, transparent 0deg)`
                  }}>
                    <div className="bg-white rounded-circle d-flex align-items-center justify-content-center anel-interno">
                      <span className="fs-3 fw-bold text-dark">{stats.progressoGeral}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Badges Recomendados */}
            <div className="col-md-3">
              <div className="card border-0 shadow-sm p-3 h-100 bg-white text-start">
                <h6 className="fw-bold mb-1">Badges Recomendados</h6>
                <small className="text-muted mb-3 d-block">Próximos passos na sua evolução</small>
                
                {badgesRecomendados.length > 0 ? badgesRecomendados.map((badge, i) => (
                  <div key={i} className="dashboard-recommended-item d-flex align-items-center gap-2 mb-2 border-bottom pb-2">
                    <img 
                      src={resolvePublicBadgeImage(badge.URL_IMAGEM)}
                      onError={useDefaultBadgeImageOnError}
                      alt="badge" 
                      style={{ width: '40px', height: '40px', objectFit: 'contain', padding: '3px' }}
                      className="rounded-circle border" 
                    />
                    <div className="lh-sm text-start flex-grow-1 ms-2">
                      <div className="small fw-bold text-dark">{badge.NOME_BADGE}</div>
                      <div className="text-muted mt-1" style={{fontSize: '11px'}}>Service Line {badge.SERVICE_LINE}</div>
                      {badge.AREA && <div className="text-muted" style={{fontSize: '11px'}}>{badge.AREA}</div>}
                      <div className="text-muted" style={{fontSize: '11px'}}>Nível {badge.NIVEL_STR}</div>
                    </div>
                    <Link to={`/detalhes/${badge.ID_BADGE}`} className="btn btn-outline-primary btn-sm px-2"><i className="bi bi-eye"></i></Link>
                  </div>
                )) : (
                  <small className="text-muted mt-4 d-block text-center">Nenhuma recomendação de momento.</small>
                )}
              </div>
            </div>

            {/* Gráfico de Evolução */}
            <div className="col-md-6">
              <div className="card border-0 shadow-sm p-3 h-100 bg-white text-start">
                <div className="d-flex justify-content-between align-items-start">
                  <h6 className="fw-bold">Progresso de Pontos (Últimos 6 meses)</h6>
                  <small className="text-danger fw-bold"><i className="bi bi-dot"></i> Ponto mais alto</small>
                </div>
                <div className="mt-2" style={{ height: '220px' }}>
                  <Line data={lineData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                </div>
              </div>
            </div>
          </div>

          <div className="row g-3 pb-4">
            {/* Jornada de Carreira */}
            <div className="col-md-6">
              <div className="card border-0 shadow-sm p-3 h-100 bg-white text-start">
                <h6 className="fw-bold mb-1">A minha Jornada de Carreira</h6>
                <small className="text-muted mb-4 d-block">Candidaturas Atuais (Evidências Submetidas)</small>
                
                {(() => {
                    const jornadaOrdenada = [...jornadaCarreira].map(item => ({
                        ...item,
                        percentagem: Math.round((item.reqSubmetidos / item.reqTotais) * 100)
                    })).sort((a, b) => b.percentagem - a.percentagem);

                    if (jornadaOrdenada.length === 0) {
                        return <small className="text-muted text-center py-4 d-block">Ainda não tem pedidos de Badge em progresso.</small>;
                    }

                    return jornadaOrdenada.map((item, idx) => (
                      <div key={idx} className="mb-4">
                        <div className="dashboard-journey-row small mb-2" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'end', gap: '0.75rem', width: '100%' }}>
                          <div className="lh-sm" style={{ textAlign: 'left', minWidth: 0 }}>
                            <span className="fw-bold d-block text-dark" style={{fontSize: '13px'}}>{item.nome}</span>
                            <span className="text-muted" style={{fontSize: '11px'}}>{item.serviceLine} - {item.area} <span className="badge bg-light text-secondary ms-1 border">Nível {item.nivel}</span></span>
                          </div>
                          <div className="text-end" style={{ textAlign: 'right' }}>
                              <span className="text-primary fw-bold d-block">{item.percentagem}%</span>
                              <Link to={`/candidatar/${item.idBadge}`} className="btn btn-sm btn-outline-primary py-0 px-2 mt-1" style={{fontSize: '10px'}}><i className="bi bi-pencil me-1"></i>Continuar</Link>
                          </div>
                        </div>
                        <div className="progress" style={{height: '6px', borderRadius: '10px'}}>
                          <div className="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style={{width: `${item.percentagem}%`}}></div>
                        </div>
                      </div>
                    ));
                })()}
              </div>
            </div>

            {/* Avisos e Lembretes */}
            <div className="col-md-6 text-start">
              <div className="card border-0 shadow-sm p-3 h-100 bg-white">
                <h6 className="fw-bold mb-3">Avisos e Lembretes Recentes</h6>
                
                {avisos.length > 0 ? avisos.map((aviso, idx) => (
                  <div key={idx} className={`dashboard-notice-item d-flex align-items-center p-3 mb-2 border-start border-4 shadow-sm rounded-3 ${aviso.tipoCSS}`}>
                      <i className={`bi ${aviso.icone} fs-3 px-3`} style={{color: aviso.corIcone}}></i>
                      <div>
                        <div className="fw-bold small">{aviso.titulo}</div>
                        <small className="text-muted d-block lh-sm">{aviso.mensagem}</small>
                        <small className="text-muted fw-bold" style={{fontSize: '10px'}}>{aviso.data}</small>
                      </div>
                  </div>
                )) : (
                  <small className="text-muted">Sem avisos recentes.</small>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DashboardConsultor;
