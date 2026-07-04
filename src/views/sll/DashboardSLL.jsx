import React, { useState, useEffect } from 'react';
import SidebarSLL from '../../components/SidebarSLL';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import CartaoEstatistica from '../../components/CartaoEstatistica';
import TabelaGenerica from '../../components/TabelaGenerica';
import { Line, Pie } from 'react-chartjs-2';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { obterServiceLineSLL } from '../../utils/sllServiceLine';
import { resolvePublicBadgeImage, useDefaultBadgeImageOnError } from '../../utils/publicBadgeImage';
import '../../assets/dashboard.css';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, 
  LineElement, ArcElement, Title, Tooltip, Legend, Filler 
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

// Plugin para desenhar a percentagem no centro de cada fatia do gráfico Doughnut/Pie
const pieLabelsPlugin = {
    id: 'pieLabels',
    afterDraw(chart) {
        if (chart.config.type !== 'doughnut' && chart.config.type !== 'pie') return;
        const ctx = chart.ctx;
        chart.data.datasets.forEach((dataset, i) => {
            chart.getDatasetMeta(i).data.forEach((element, index) => {
                const total = dataset.data.reduce((acc, curr) => acc + curr, 0);
                const val = dataset.data[index];
                if (val === 0) return;
                const percentage = Math.round((val / total) * 100) + '%';

                const position = element.tooltipPosition();
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 12px "Inter", sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(percentage, position.x, position.y);
            });
        });
    }
};
ChartJS.register(pieLabelsPlugin);

const DashboardSLL = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // Estados do Utilizador
  const [utilizador, setUtilizador] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [serviceLine, setServiceLine] = useState('');

  // Estados dos Dados (API)
  const [stats, setStats] = useState({
    totalPontos: 0,
    mediaPontos: 0,
    percComBadge: 0,
    taxaAprovacao: '0%',
    crescimentoBadges: '+0%'
  });
  const [pedidosPendentes, setPedidosPendentes] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [topConsultores, setTopConsultores] = useState([]);
  
  // Estados dos Gráficos
  const [lineData, setLineData] = useState({ labels: [], datasets: [] });
  const [doughnutData, setDoughnutData] = useState({ labels: [], datasets: [] });

  useEffect(() => {
    const userLocal = JSON.parse(sessionStorage.getItem('user'));
    if (!userLocal) { navigate('/'); return; }
    
    setUtilizador(userLocal);
    let slAtual = userLocal.SL_REGISTO || userLocal.SERVICE_LINE || ''; 
    setServiceLine(slAtual);

    const carregarFotoPerfil = async () => {
      try {
          const response = await axios.get(`http://localhost:3000/users/configuracoes/${userLocal.ID_UTILIZADOR}`);
          if (response.data.success && response.data.data.avatar) {
              setAvatarUrl(response.data.data.avatar);
          } else {
              const nomeObj = userLocal.NOME_COMPLETO_UTILIZADOR || 'SLL';
              setAvatarUrl(`https://ui-avatars.com/api/?name=${encodeURIComponent(nomeObj)}&background=F4E1EC&color=333333`);
          }
      } catch (error) { console.error("Erro ao carregar a foto:", error); }
    };
    
    const carregarDashboard = async () => {
      try {
        slAtual = await obterServiceLineSLL(userLocal);
        setServiceLine(slAtual);
        const response = await axios.get(`http://localhost:3000/dashboard/sll/dados?sl=${encodeURIComponent(slAtual)}&id=${userLocal.ID_UTILIZADOR}`);
        if (response.data.success) {
          const dados = response.data.data;
          setStats(prev => ({ ...prev, ...(dados.stats || {}) }));
          setPedidosPendentes(dados.pedidosPendentes || []);
          setAlertas(dados.alertas || []);
          setTopConsultores(dados.topConsultores || []);
          
          setLineData({
            labels: dados.graficoLinha?.labels || [],
            datasets: [{
              label: 'Pontos Obtidos na SL',
              data: dados.graficoLinha?.valores || [],
              borderColor: '#F93131',
              backgroundColor: 'rgba(249, 49, 49, 0.1)',
              tension: 0.4, fill: true, pointRadius: 5
            }]
          });

          // Distribuição Dinâmica vinda do backend
          setDoughnutData({
            labels: dados.graficoDoughnut?.labels || ['Sem Badges'],
            datasets: [{
              data: dados.graficoDoughnut?.valores || [1],
              backgroundColor: ['#2575fc', '#82D674', '#ffc107', '#fd7e14', '#dc3545'],
              borderWidth: 0, cutout: '67%'
            }]
          });
        }
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarFotoPerfil();
    carregarDashboard();
    const atualizacao = window.setInterval(carregarDashboard, 15000);
    return () => window.clearInterval(atualizacao);
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    navigate('/');
  };

  const doughnutOptions = {
    maintainAspectRatio: false,
    plugins: { legend: { display: false } }
  };

  if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="d-flex bg-light min-vh-100">
      <SidebarSLL />
      
      <div className="flex-grow-1 p-4 dashboard-scroll">
        <div className="container-fluid px-md-4 text-start">
          
          {/* CABEÇALHO PADRONIZADO E CORRIGIDO (FOTO À ESQUERDA) */}
          <CabecalhoDashboard 
              titulo={`Dashboard Geral - ${serviceLine}`}
              utilizador={utilizador}
              avatarUrl={avatarUrl}
              linkHome="/sll/dashboard"
          />

          {/* KPI Row (Agregados Reais do Backend) */}
          <div className="row g-3 mb-4 text-center">
            {[
              { label: 'Total Pontos Service Line', val: stats.totalPontos, growth: stats.crescimentoBadges || '+0%', up: !(stats.crescimentoBadges || '').startsWith('-') },
              { label: 'Média de Pontos / Consultor', val: stats.mediaPontos, growth: stats.crescimentoBadges || '+0%', up: !(stats.crescimentoBadges || '').startsWith('-') },
              { label: 'Consultores c/ Badges na SL', val: `${stats.percComBadge}%`, growth: stats.crescimentoBadges || '+0%', up: !(stats.crescimentoBadges || '').startsWith('-') },
              { label: 'Taxa de Aprovação Média', val: stats.taxaAprovacao, growth: '+1.5%', up: true }
            ].map((kpi, i) => (
              <div key={i} className="col-md-3">
                  <CartaoEstatistica 
                      titulo={kpi.label}
                      valor={kpi.val}
                      subtitulo={
                          <span className={kpi.up ? 'text-success' : 'text-danger'}>
                              {kpi.up ? <i className="bi bi-arrow-up-short"></i> : <i className="bi bi-arrow-down-short"></i>}
                              {kpi.growth} <span className="text-muted fw-normal ms-1" style={{fontSize: '11px'}}>face ao mês passado</span>
                          </span>
                      }
                      alinhamento="center"
                  />
              </div>
            ))}
          </div>

          <div className="row g-4 mb-4">
            {/* Gráfico Evolução */}
            <div className="col-md-7">
              <div className="card border-0 shadow-sm p-4 h-100 bg-white rounded-4">
                <h5 className="fw-bold mb-1">Evolução do Rendimento ({serviceLine})</h5>
                <p className="text-muted small mb-4">Pontuação total obtida pela equipa ao longo dos últimos meses</p>
                <div style={{ height: '300px' }}>
                  {lineData.datasets.length > 0 && <Line data={lineData} options={{ responsive: true, maintainAspectRatio: false }} />}
                </div>
              </div>
            </div>

            {/* Pedidos Pendentes */}
            <div className="col-md-5">
              <div className="card border-0 shadow-sm p-4 h-100 bg-white rounded-4 d-flex flex-column">
                <h5 className="fw-bold mb-4 text-primary">A Aguardar Validação SLL ({pedidosPendentes.length})</h5>
                <div className="flex-grow-1">
                    {pedidosPendentes.length > 0 ? pedidosPendentes.slice(0, 4).map((pedido, i) => (
                    <div key={i} className="d-flex align-items-center justify-content-between gap-3 mb-3 border rounded-4 p-3 bg-light bg-opacity-50 shadow-sm">
                        <div className="d-flex align-items-center gap-3 overflow-hidden">
                          <div className="bg-white rounded-circle border border-primary border-opacity-25 shadow-sm d-flex align-items-center justify-content-center overflow-hidden flex-shrink-0" style={{width: '56px', height: '56px'}}>
                            <img
                              src={resolvePublicBadgeImage(pedido.urlImagem)}
                              onError={useDefaultBadgeImageOnError}
                              alt={pedido.badge}
                              className="w-100 h-100"
                              style={{objectFit: 'contain', padding: '5px'}}
                            />
                          </div>
                          <div className="lh-sm overflow-hidden">
                              <div className="fw-bold small text-dark text-truncate" title={pedido.consultor}>
                                <i className="bi bi-person-fill text-primary me-1"></i>{pedido.consultor}
                              </div>
                              <div className="fw-semibold text-primary text-truncate mt-1" style={{fontSize: '12px'}} title={pedido.badge}>{pedido.badge}</div>
                              <div className="text-muted mt-1" style={{fontSize: '11px'}}>
                                <span className="me-2"><i className="bi bi-diagram-3 me-1"></i>{pedido.area}</span>
                                <span><i className="bi bi-bar-chart-steps me-1"></i>{pedido.nivel}</span>
                              </div>
                          </div>
                        </div>
                        <button onClick={() => navigate(`/sll/validacoes/validar/${pedido.id}`)} className="btn btn-primary btn-sm rounded-pill px-3 fw-bold shadow-sm flex-shrink-0">
                          Validar
                        </button>
                    </div>
                    )) : (
                    <div className="text-muted small text-center mt-5 pt-3">
                        <i className="bi bi-check-all fs-2 d-block mb-2 text-success opacity-50"></i>
                        Sem pedidos a aguardar validação.
                    </div>
                    )}
                </div>
                <button onClick={() => navigate('/sll/validacoes/pendentes')} className="btn btn-light text-primary w-100 small fw-bold mt-auto shadow-sm">
                  Ver todos os pedidos ({pedidosPendentes.length})
                </button>
              </div>
            </div>
          </div>

          <div className="row g-4 mb-4">
            {/* Alertas */}
            <div className="col-md-5">
              <div className="card border-0 shadow-sm p-4 h-100 bg-white text-start rounded-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold m-0">Alertas e Notificações</h5>
                  <span className="badge rounded-pill bg-primary">{alertas.length}</span>
                </div>
                <div className="overflow-auto pe-1" style={{ maxHeight: '330px' }}>
                  {alertas.length > 0 ? alertas.map((alerta, i) => (
                    <div
                      key={`${alerta.tipo}-${alerta.dataRaw || i}-${i}`}
                      className={`d-flex align-items-start gap-2 mb-2 p-3 border-start border-4 shadow-sm rounded-3 ${alerta.tipoCSS || 'border-info bg-info bg-opacity-10'}`}
                    >
                      <div
                        className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{ width: '38px', height: '38px' }}
                      >
                        <i className={`bi ${alerta.icone || 'bi-bell-fill'} fs-5`} style={{ color: alerta.corIcone || '#0d6efd' }}></i>
                      </div>
                      <div className="flex-grow-1 overflow-hidden">
                        <div className="fw-bold small text-dark">{alerta.titulo || 'Notificação'}</div>
                        <div className="text-muted lh-sm mt-1" style={{ fontSize: '12px' }}>{alerta.mensagem}</div>
                        <div className="text-muted fw-semibold mt-1" style={{ fontSize: '10px' }}>{alerta.dataStr}</div>
                      </div>
                      {alerta.link && alerta.link !== '#' && (
                        <button
                          onClick={() => navigate(alerta.link)}
                          className="btn btn-sm btn-light text-primary rounded-circle shadow-sm flex-shrink-0"
                          title="Ver detalhes"
                          style={{ width: '32px', height: '32px' }}
                        >
                          <i className="bi bi-chevron-right"></i>
                        </button>
                      )}
                    </div>
                  )) : (
                    <div className="text-muted small text-center py-4">
                      <i className="bi bi-bell-slash fs-3 d-block mb-2 opacity-50"></i>
                      Sem alertas ou notificações.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Distribuição por Área da Service Line */}
            <div className="col-md-7">
              <div className="card border-0 shadow-sm p-4 h-100 bg-white rounded-4">
                <div className="row align-items-center h-100">
                  <div className="col-5">
                    <h5 className="fw-bold mb-3">Distribuição por Área da Service Line</h5>
                    <p className="small text-muted mb-4">Badges atribuídos atualmente</p>
                    <div className="d-flex flex-column gap-2 small fw-bold text-dark">
                        {doughnutData.labels && doughnutData.labels.map((lbl, idx) => {
                             const bgColors = ['#2575fc', '#82D674', '#ffc107', '#fd7e14', '#dc3545'];
                             return <div key={idx} className="d-flex align-items-center"><i className="bi bi-circle-fill me-2" style={{color: bgColors[idx]}}></i> {lbl}</div>;
                        })}
                    </div>
                  </div>
                  <div className="col-7 d-flex justify-content-center">
                    <div style={{ width: '220px', height: '220px' }}>
                      {doughnutData.datasets.length > 0 && <Pie data={doughnutData} options={doughnutOptions} />}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ranking Table */}
          <div className="mb-4">
            <h5 className="fw-bold mb-4">Ranking Service Line (Top 5 Consultores)</h5>
            <TabelaGenerica colunas={['Posição', 'Nome do Consultor', 'Badges Totais', 'Pontuação Total', 'Ações']} emptyMessage="A carregar o Ranking ou SL sem dados suficientes...">
                  {topConsultores.length > 0 && topConsultores.map((row, i) => (
                    <tr key={i}>
                      <td className="fw-bold text-primary fs-5">{i + 1}º</td>
                      <td className="fw-bold text-dark">{row.nome}</td>
                      <td className="fw-bold text-muted">{row.badges}</td>
                      <td className="text-primary fw-bold">{row.pontos} pts</td>
                      <td>
                        <button onClick={() => navigate(`/sll/consultores/perfil/${row.id}`)} className="btn btn-primary btn-sm rounded-pill px-4 fw-bold shadow-sm" style={{backgroundColor: '#5D78FF', border: 'none'}}>Ver Perfil</button>
                      </td>
                    </tr>
                  ))}
            </TabelaGenerica>
          </div>

          {/* Export Footer */}
          <div className="text-center mt-5 mb-5 pb-4">
             <button onClick={() => navigate('/sll/consultores/relatorios')} className="btn btn-primary px-5 py-3 rounded-pill fw-bold shadow-sm" style={{backgroundColor: '#5D78FF', border: 'none', fontSize: '1.1rem'}}>
                 <i className="bi bi-file-earmark-bar-graph me-2"></i>Exportar Relatórios de Performance Detalhados
             </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DashboardSLL;
