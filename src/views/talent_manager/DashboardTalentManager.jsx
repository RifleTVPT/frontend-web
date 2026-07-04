import React, { useState, useEffect } from 'react';
import SidebarTalent from '../../components/SidebarTalentManager'; 
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import CartaoEstatistica from '../../components/CartaoEstatistica';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../assets/dashboard.css';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

const DashboardTalentManager = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [utilizador, setUtilizador] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(() => {
    const user = JSON.parse(sessionStorage.getItem('user'));
    return user ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.NOME_COMPLETO_UTILIZADOR)}&background=0d6efd&color=fff&size=40` : '';
  });

  // Estados dos Dados
  const [stats, setStats] = useState({
    validacoesPendentes: 0, badgesEmitidosAno: 0, crescimentoAno: 0,
    consultoresComBadges: 0, percentagemConsultores: 0, badgesProximosExpiracao: 0
  });
  const [pedidosPendentes, setPedidosPendentes] = useState([]);
  const [topServiceLines, setTopServiceLines] = useState([]); 
  const [avisos, setAvisos] = useState([]); // <-- Estado para as Notificações
  
  // Gráficos
  const [lineData, setLineData] = useState({ labels: [], datasets: [] });
  const [doughnutData, setDoughnutData] = useState({ labels: [], datasets: [] });

  useEffect(() => {
    const userLocal = JSON.parse(sessionStorage.getItem('user'));
    if (!userLocal) {
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
          console.error("Erro ao carregar a foto de perfil no header:", error);
      }
    };
    
    // Carregar dados reais do Dashboard TM
    const carregarDashboard = async () => {
      try {
        const response = await axios.get(`https://softinsa-api-riya.onrender.com/dashboard/talent-manager/dados`);
        if (response.data.success) {
          const dados = response.data.data;
          setStats(dados.stats);
          setPedidosPendentes(dados.pedidosPendentes);
          setTopServiceLines(dados.topServiceLines || []); 
          setLineData(dados.graficoLinhas);
          setDoughnutData(dados.graficoDoughnut);
        }
      } catch (error) {
        console.error("Erro ao carregar dashboard do Talent Manager:", error);
      } finally {
        setLoading(false);
      }
    };

    // Carregar Notificações e Avisos dinâmicos e misturá-los
    const carregarAvisos = async () => {
      try {
        const [notifResult, avisosResult] = await Promise.allSettled([
            axios.get(`https://softinsa-api-riya.onrender.com/notificacoes/user/${userLocal.ID_UTILIZADOR}`),
            axios.get(`https://softinsa-api-riya.onrender.com/avisos?perfil=Talent%20Manager`)
        ]);
        const notifRes = notifResult.status === 'fulfilled' ? notifResult.value : null;
        const avisosRes = avisosResult.status === 'fulfilled' ? avisosResult.value : null;
        
        let listaMista = [];

        if (notifRes?.data?.success && Array.isArray(notifRes.data.data)) {
            const formatadas = notifRes.data.data.map(n => {
                const parts = n.date.split('/');
                const dataStrConvertida = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}T${n.time}` : new Date().toISOString();
                return {
                    titulo: n.title,
                    mensagem: n.desc,
                    dataRaw: new Date(dataStrConvertida).getTime(),
                    dataStr: `${n.date} às ${n.time}`,
                    icone: n.type === 'Alerta' ? 'bi-exclamation-circle-fill' : 'bi-bell-fill',
                    corIcone: n.type === 'Alerta' ? '#dc3545' : '#0d6efd',
                    tipoCSS: 'border-primary bg-white'
                };
            });
            listaMista = [...listaMista, ...formatadas];
        }

        if (avisosRes?.data?.success && Array.isArray(avisosRes.data.data)) {
            const avisosAtivos = avisosRes.data.data.filter(a => a.status === 'Ativo');
            const formatadosAvisos = avisosAtivos.map(a => {
                const parts = a.data.split('/');
                const dataObj = parts.length === 3 ? new Date(parts[2], parts[1]-1, parts[0]).getTime() : new Date().getTime();
                return {
                    titulo: a.titulo,
                    mensagem: a.mensagem,
                    dataRaw: dataObj,
                    dataStr: a.data,
                    icone: 'bi-megaphone-fill',
                    corIcone: '#ffc107',
                    tipoCSS: 'border-warning bg-light'
                };
            });
            listaMista = [...listaMista, ...formatadosAvisos];
        }

        listaMista.sort((a, b) => b.dataRaw - a.dataRaw);
        setAvisos(listaMista.slice(0, 4));
      } catch (error) {
        console.error("Erro ao carregar avisos mistos:", error);
      }
    };

    carregarFotoPerfil();
    carregarDashboard();
    carregarAvisos();
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    navigate('/');
  };

  const percentagePlugin = {
    id: 'percentagePlugin',
    afterDatasetsDraw(chart) {
      const { ctx, data } = chart;
      const meta = chart.getDatasetMeta(0);
      const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
      
      ctx.save();
      meta.data.forEach((element, index) => {
        const val = data.datasets[0].data[index];
        if (val === 0 || total === 0 || data.labels[index] === 'Sem Badges') return; 
        const percentage = ((val / total) * 100).toFixed(2) + '%';
        
        // Garantir que a posição central da fatia é encontrada
        const position = element.tooltipPosition();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.9)';
        ctx.shadowBlur = 4;
        
        ctx.fillText(percentage, position.x, position.y);
      });
      ctx.restore();
    }
  };

  if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="d-flex bg-light min-vh-100">
      <SidebarTalent />

      <div className="flex-grow-1 p-4 dashboard-scroll">
        <div className="container-fluid text-start">
          
          {/* CABEÇALHO PADRONIZADO (IGUAL AO DO CONSULTOR) */}
          <CabecalhoDashboard 
              titulo="Dashboard - Talent Manager"
              utilizador={utilizador}
              avatarUrl={avatarUrl}
              linkHome="/talent-manager/dashboard"
          />

          {/* Primeira Linha: KPIs */}
          <div className="row g-3 mb-4 text-center">
            <div className="col-md-3">
              <CartaoEstatistica 
                  titulo="Validações Pendentes"
                  valor={stats.validacoesPendentes}
                  subtitulo={<span className="text-danger fw-bold"><i className="bi bi-exclamation-triangle"></i> Ação imediata!</span>}
                  corDestaque="warning"
                  alinhamento="center"
              />
            </div>
            <div className="col-md-3">
              <CartaoEstatistica 
                  titulo="Badges Emitidos (ano)"
                  valor={stats.badgesEmitidosAno}
                  subtitulo={<span className="text-success fw-bold">+{stats.crescimentoAno}% vs Ano Anterior</span>}
                  corDestaque="dark"
                  alinhamento="center"
              />
            </div>
            <div className="col-md-3">
              <CartaoEstatistica 
                  titulo="Consultores com Badges"
                  valor={stats.consultoresComBadges}
                  subtitulo={<span className="text-primary fw-bold">{stats.percentagemConsultores}% de todos os Consultores</span>}
                  corDestaque="dark"
                  alinhamento="center"
              />
            </div>
            <div className="col-md-3">
              <CartaoEstatistica 
                  titulo="Badges Próx. expiração"
                  valor={stats.badgesProximosExpiracao}
                  corDestaque="dark"
                  alinhamento="center"
                  acaoBotao={{ label: 'Analisar expirações', onClick: () => navigate('/talent/expiracao') }}
              />
            </div>
          </div>

          {/* Segunda Linha: Gráficos e Pedidos */}
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <div className="card border-0 shadow-sm p-4 h-100 bg-white">
                <div className="d-flex justify-content-between">
                  <h6 className="fw-bold">Evolução das candidaturas (Por Service Line)</h6>
                  <div className="small fw-bold">
                    {lineData.datasets && lineData.datasets.map((ds, idx) => (
                        <span key={idx} className="me-3">
                            <i className="bi bi-dot" style={{ color: ds.borderColor, fontSize: '1.2rem', verticalAlign: 'middle' }}></i> 
                            <span style={{ color: ds.borderColor }}>{ds.label}</span>
                        </span>
                    ))}
                  </div>
                </div>
                <div className="mt-3" style={{ height: '220px' }}>
                  {lineData.datasets.length > 0 && <Line data={lineData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />}
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card border-0 shadow-sm p-4 h-100 text-start bg-white">
                <h6 className="fw-bold mb-3">Pedidos Pendentes ({stats.validacoesPendentes})</h6>
                {pedidosPendentes.length > 0 ? pedidosPendentes.map((pedido, i) => (
                  <div key={i} className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                    <div className="d-flex align-items-center gap-3">
                       {pedido.urlImagem ? (
                          <>
                              <img 
                                  src={pedido.urlImagem.startsWith('http') ? pedido.urlImagem : `https://softinsa-api-riya.onrender.com${pedido.urlImagem}`} 
                                  alt="Badge" 
                                  style={{width: '40px', height: '40px', objectFit: 'contain'}} 
                                  onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextElementSibling.style.setProperty('display', 'flex', 'important');
                                  }}
                              />
                              <div className="bg-light justify-content-center align-items-center rounded-circle" style={{width: '40px', height: '40px', display: 'none'}}>
                                 <i className="bi bi-trophy text-primary fs-4"></i>
                              </div>
                          </>
                       ) : (
                          <div className="bg-light d-flex justify-content-center align-items-center rounded-circle" style={{width: '40px', height: '40px'}}>
                             <i className="bi bi-trophy text-primary fs-4"></i>
                          </div>
                       )}
                       <div className="lh-sm">
                          <div className="fw-bold small">{pedido.nome} - {pedido.sl}</div>
                          <div className="text-muted" style={{fontSize: '11px'}}>{pedido.nivel}</div>
                       </div>
                    </div>
                    {/* LINK CORRIGIDO PARA A ROTA ANALISAR EVIDÊNCIAS DO TALENT */}
                    <Link to={`/talent/validacoes/analisar/${pedido.id}`} className="btn btn-primary btn-sm px-3 rounded-pill fw-bold">Validar agora</Link>
                  </div>
                )) : (
                  <p className="text-muted small mt-4 text-center">Não existem pedidos pendentes.</p>
                )}
                {/* LINK CORRIGIDO PARA A ROTA DA LISTA DE PENDENTES */}
                <Link to="/talent/validacoes/pendentes" className="text-primary small fw-bold text-decoration-none mt-auto text-center d-block">Ver todos os pedidos</Link>
              </div>
            </div>
          </div>

          {/* Terceira Linha: Alertas e Doughnut */}
          <div className="row g-3 mb-4 align-items-stretch">
            <div className="col-md-6 text-start d-flex">
              <div className="card border-0 shadow-sm p-4 w-100 bg-white d-flex flex-column">
                <h6 className="fw-bold mb-3">Avisos e Lembretes Recentes</h6>
                <div className="flex-grow-1 overflow-auto">
                {avisos.length > 0 ? avisos.map((aviso, idx) => (
                  <div key={idx} className={`d-flex align-items-center p-3 mb-2 border-start border-4 shadow-sm rounded-3 ${aviso.tipoCSS}`}>
                      <i className={`bi ${aviso.icone} fs-3 px-3`} style={{color: aviso.corIcone}}></i>
                      <div>
                        <div className="fw-bold small">{aviso.titulo}</div>
                        <small className="text-muted d-block lh-sm">{aviso.mensagem}</small>
                        <small className="text-muted fw-bold" style={{fontSize: '10px'}}>{aviso.dataStr}</small>
                      </div>
                  </div>
                )) : (
                  <small className="text-muted d-block text-center mt-4">Sem avisos recentes.</small>
                )}
                </div>
              </div>
            </div>

            <div className="col-md-6 d-flex">
              <div className="card border-0 shadow-sm p-4 w-100 bg-white d-flex flex-column">
                <h6 className="fw-bold mb-3 text-start">Badges Obtidos (Por Nível)</h6>
                <div className="row align-items-center flex-grow-1 m-0">
                   <div className="col-6 text-start px-0">
                      <div className="d-flex flex-wrap gap-2 text-dark mt-1" style={{fontSize: '14.5px'}}>
                          {doughnutData.labels && doughnutData.labels.map((lbl, idx) => {
                               const bgColors = ['#0d6efd', '#0dcaf0', '#ffc107', '#fd7e14', '#dc3545', '#6f42c1', '#20c997'];
                               return <div key={idx} className="d-flex align-items-center fw-bold" style={{width: '45%'}}><i className="bi bi-circle-fill me-2 fs-5" style={{color: bgColors[idx]}}></i> {lbl}</div>;
                          })}
                      </div>
                   </div>
                   <div className="col-6 d-flex justify-content-center align-items-center">
                      <div style={{width: '190px', height: '190px', marginTop: '-15px'}}>
                        {doughnutData.datasets.length > 0 && <Doughnut data={doughnutData} plugins={[percentagePlugin]} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />}
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quarta Linha: Ranking de Service Lines */}
          <div className="card border-0 shadow-sm p-4 text-start bg-white mb-5">
            <h6 className="fw-bold mb-3">Top 5 Service Lines (últimos 30 dias)</h6>
            <div className="table-responsive">
               <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr style={{fontSize: '13px'}}>
                       <th className="text-center">Service Line</th>
                       <th className="text-center">Badges Obtidos (total)</th>
                       <th className="text-center">Pontos totais</th>
                       <th className="text-center">Ranking</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topServiceLines && topServiceLines.length > 0 ? topServiceLines.map((row, i) => (
                      <tr key={i} style={{fontSize: '12px'}}>
                        <td className="fw-bold text-dark text-center">{row.sl}</td>
                        <td className="text-muted text-center">{row.total}</td>
                        <td className="text-primary fw-bold text-center">{row.pontos} pts</td>
                        <td className="text-center"><span className="badge bg-primary rounded-pill px-3">{row.rank}</span></td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="4" className="text-center text-muted py-3">A carregar dados das Service Lines...</td>
                      </tr>
                    )}
                  </tbody>
               </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DashboardTalentManager;
