import React, { useState, useEffect } from 'react';
import SidebarAdmin from '../../components/SidebarAdmin';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import CartaoEstatistica from '../../components/CartaoEstatistica';
import { Line, Bar } from 'react-chartjs-2';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../../assets/dashboard.css';
import { resolvePublicBadgeImage, useDefaultBadgeImageOnError } from '../../utils/publicBadgeImage';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const DashboardAdmin = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    // Estados de Utilizador (Header)
    const [utilizador, setUtilizador] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState('https://via.placeholder.com/40');

    // Estados Dinâmicos (API)
    const [indicadores, setIndicadores] = useState({
        utilizadoresAtivos: 0, badgesCriados: 0, pedidosRegisto: 0, taxaAprovacao: 0
    });
    const [atividades, setAtividades] = useState([]);
    const [lineData, setLineData] = useState({ labels: [], datasets: [] });
    const [barData, setBarData] = useState({ labels: [], datasets: [] });

    useEffect(() => {
        const userLocal = JSON.parse(sessionStorage.getItem('user'));
        if (!userLocal) { navigate('/'); return; }
        
        setUtilizador(userLocal);

        const carregarFotoPerfil = async () => {
            try {
                const res = await axios.get(`https://softinsa-api-riya.onrender.com/users/configuracoes/${userLocal.ID_UTILIZADOR}`);
                if (res.data.success && res.data.data.avatar) setAvatarUrl(res.data.data.avatar);
            } catch (error) { console.error("Erro foto:", error); }
        };

        const carregarDashboard = async () => {
            try {
                const response = await axios.get('https://softinsa-api-riya.onrender.com/dashboard/admin/dados');
                if (response.data.success) {
                    const dados = response.data.data;
                    setIndicadores(dados.kpis);
                    setAtividades(dados.atividades);

                    setLineData({
                        labels: dados.graficoLinha.labels,
                        datasets: [{
                            label: 'Acessos Diários',
                            data: dados.graficoLinha.data,
                            borderColor: '#2575fc',
                            backgroundColor: 'rgba(37, 117, 252, 0.1)',
                            tension: 0.4, fill: true, pointRadius: 5, pointBackgroundColor: '#2575fc'
                        }]
                    });

                    setBarData({
                        labels: dados.graficoBarras.labels,
                        datasets: [{
                            label: 'Média de Acessos',
                            data: dados.graficoBarras.data,
                            backgroundColor: '#3b6ea5',
                            borderRadius: 4,
                            maxBarThickness: 70,
                            categoryPercentage: 0.7,
                            barPercentage: 0.8
                        }]
                    });
                }
            } catch (error) {
                console.error("Erro carregar Dashboard Admin:", error);
            } finally {
                setLoading(false);
            }
        };

        carregarFotoPerfil();
        carregarDashboard();
    }, [navigate]);

    const handleLogout = () => {
        sessionStorage.removeItem('user');
        navigate('/');
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            y: { beginAtZero: true, grid: { drawBorder: false } },
            x: { grid: { display: false } }
        }
    };

    if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="d-flex bg-light min-vh-100">
            <SidebarAdmin />
            <div className="flex-grow-1 p-4 dashboard-scroll text-start">
                <div className="container-fluid px-md-4">
                    
                    {/* CABEÇALHO PADRONIZADO E CORRIGIDO (FOTO À ESQUERDA) */}
                    <CabecalhoDashboard 
                        titulo="Dashboard - Administrador"
                        utilizador={utilizador}
                        avatarUrl={avatarUrl}
                        linkHome="/admin/dashboard"
                        iconeEsquerda={<><i className="bi bi-shield-lock-fill me-1"></i> Central de Comando</>}
                    />

                    {/* KPIs SUPERIORES */}
                    <div className="row g-3 mb-4 text-center align-items-stretch">
                        <div className="col-md-3 d-flex">
                            <CartaoEstatistica 
                                titulo="Utilizadores Ativos"
                                valor={indicadores.utilizadoresAtivos}
                                subtitulo={
                                    <span className="text-primary">
                                        contas ativas atualmente
                                    </span>
                                }
                                alinhamento="center"
                            />
                        </div>
                        <div className="col-md-3 d-flex">
                            <CartaoEstatistica 
                                titulo="Badges Criados"
                                valor={indicadores.badgesCriados}
                                subtitulo="Gerenciados pela Plataforma"
                                corDestaque="dark"
                                alinhamento="center"
                            />
                        </div>
                        <div className="col-md-3 hover-scale d-flex">
                            <CartaoEstatistica 
                                titulo="Pedidos de Registo"
                                valor={indicadores.pedidosRegisto}
                                corDestaque="warning"
                                alinhamento="center"
                                acaoBotao={{ label: 'Validar Contas', onClick: () => navigate('/admin/utilizadores/pedidos') }}
                            />
                        </div>
                        <div className="col-md-3 d-flex">
                            <CartaoEstatistica 
                                titulo="Taxa Aprovação Badges"
                                valor={`${indicadores.taxaAprovacao} %`}
                                subtitulo={
                                    <span className="text-primary">
                                        pedidos aceites entre pedidos decididos
                                    </span>
                                }
                                alinhamento="center"
                            />
                        </div>
                    </div>

                    {/* ATIVIDADE RECENTE CORRIGIDA (Dados Dinâmicos) */}
                    <div className="card border-0 shadow-sm p-4 mb-4 rounded-4 bg-white">
                        <h5 className="fw-bold mb-4">Ações Pendentes e Alertas do Sistema</h5>
                        <div className="row g-4">
                            {atividades.length > 0 ? atividades.map((item, idx) => (
                                <div key={idx} className="col-md-6">
                                    <div className="dashboard-action-row d-flex align-items-center justify-content-between gap-3 p-3 border border-light rounded-4 shadow-sm" style={{borderLeft: `5px solid ${item.type === 'reg' ? '#ffc107' : '#2575fc'}`}}>
                                        <div className="d-flex align-items-center gap-3 text-start min-w-0">
                                            {item.type === 'badge' ? (
                                                <img
                                                    src={resolvePublicBadgeImage(item.badgeImg)}
                                                    onError={useDefaultBadgeImageOnError}
                                                    alt="Badge"
                                                    className="rounded-circle border"
                                                    style={{ width: '45px', height: '45px', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <div className="bg-warning bg-opacity-10 p-2 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '45px', height: '45px', minWidth: '45px' }}>
                                                    <span className="fw-bold text-warning fs-5 text-nowrap" style={{ lineHeight: 1 }}>
                                                        {item.userName ? item.userName.substring(0, 1) + (item.userName.split(' ').length > 1 ? item.userName.split(' ').pop().substring(0, 1) : '') : 'R'}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="lh-sm min-w-0">
                                                <div className="fw-bold small text-dark mb-1">{item.title}</div>
                                                <div className="text-muted small" style={{fontSize: '11px'}}>{item.detail}</div>
                                                {item.subDetail && (
                                                    <div className="text-primary small fw-bold" style={{fontSize: '11px', marginTop: '2px'}}>{item.subDetail}</div>
                                                )}
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => navigate(item.link)}
                                            className={`btn btn-outline-${item.type === 'reg' ? 'warning' : 'primary'} btn-sm rounded-pill px-3 fw-bold flex-shrink-0`} 
                                            style={{ fontSize: '10px', lineHeight: 1.15, minWidth: item.type === 'reg' ? '112px' : '86px', overflowWrap: 'normal', wordBreak: 'normal', whiteSpace: 'nowrap' }}
                                        >
                                            {item.action}
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <div className="col-12 text-center text-muted small py-3">Sem atividades pendentes no sistema.</div>
                            )}
                        </div>
                    </div>

                    {/* GRÁFICOS */}
                    <div className="row g-4 mb-5">
                        <div className="col-md-6">
                            <div className="card border-0 shadow-sm p-4 h-100 rounded-4 bg-white">
                                <h6 className="fw-bold mb-4">Acessos Diários à Plataforma (Últimos 7 dias)</h6>
                                <div style={{ height: '260px' }}>
                                    <Line data={lineData} options={chartOptions} />
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="card border-0 shadow-sm p-4 h-100 rounded-4 bg-white">
                                <h6 className="fw-bold mb-4">Acessos diários por Service Line (no total)</h6>
                                <div style={{ height: '260px' }}>
                                    <Bar data={barData} options={chartOptions} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* AÇÕES RÁPIDAS DE GESTÃO */}
                    <div className="card border-0 shadow-sm p-4 rounded-4 bg-white mb-5">
                        <h5 className="fw-bold mb-5 text-center">Ações Rápidas de Gestão</h5>
                        <div className="d-flex justify-content-around text-center flex-wrap gap-4">
                            <Link to="/admin/utilizadores/lista" className="text-decoration-none transition-all hover-scale" style={{width: '120px', cursor: 'pointer'}}>
                                <div className="rounded-circle border border-primary border-2 p-3 mb-3 mx-auto d-flex align-items-center justify-content-center bg-white shadow-sm" style={{ width: '75px', height: '75px' }}>
                                    <i className="bi bi-person-gear text-primary fs-2"></i>
                                </div>
                                <div className="small fw-bold text-dark">Gerir Utilizadores</div>
                            </Link>
                            <Link to="/admin/badges/catalogo" className="text-decoration-none transition-all hover-scale" style={{width: '120px', cursor: 'pointer'}}>
                                <div className="rounded-circle border border-primary border-2 p-3 mb-3 mx-auto d-flex align-items-center justify-content-center bg-white shadow-sm" style={{ width: '75px', height: '75px' }}>
                                    <i className="bi bi-shield-check text-primary fs-2"></i>
                                </div>
                                <div className="small fw-bold text-dark">Gerir Badges</div>
                            </Link>
                            <Link to="/admin/badges/estrutura" className="text-decoration-none transition-all hover-scale" style={{width: '120px', cursor: 'pointer'}}>
                                <div className="rounded-circle border border-primary border-2 p-3 mb-3 mx-auto d-flex align-items-center justify-content-center bg-white shadow-sm" style={{ width: '75px', height: '75px' }}>
                                    <i className="bi bi-diagram-3-fill text-primary fs-2"></i>
                                </div>
                                <div className="small fw-bold text-dark">Estrutura Global</div>
                            </Link>
                            <Link to="/admin/performance/metricas" className="text-decoration-none transition-all hover-scale" style={{width: '120px', cursor: 'pointer'}}>
                                <div className="rounded-circle border border-primary border-2 p-3 mb-3 mx-auto d-flex align-items-center justify-content-center bg-white shadow-sm" style={{ width: '75px', height: '75px' }}>
                                    <i className="bi bi-bar-chart-line text-primary fs-2"></i>
                                </div>
                                <div className="small fw-bold text-dark">Performance Global</div>
                            </Link>
                            <Link to="/admin/config/gerais" className="text-decoration-none transition-all hover-scale" style={{width: '120px', cursor: 'pointer'}}>
                                <div className="rounded-circle border border-primary border-2 p-3 mb-3 mx-auto d-flex align-items-center justify-content-center bg-white shadow-sm" style={{ width: '75px', height: '75px' }}>
                                    <i className="bi bi-gear-wide-connected text-primary fs-2"></i>
                                </div>
                                <div className="small fw-bold text-dark">Configurações Gerais</div>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardAdmin;
