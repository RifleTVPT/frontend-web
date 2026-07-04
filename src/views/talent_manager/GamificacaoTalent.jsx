import React, { useState, useEffect } from 'react';
import SidebarTalent from '../../components/SidebarTalentManager';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import TabelaGenerica from '../../components/TabelaGenerica';
import { Bar, Pie } from 'react-chartjs-2';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../assets/dashboard.css';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';

// Necessário para o ChartJS funcionar corretamente no React
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

// Plugin para desenhar a percentagem no centro de cada fatia do gráfico Pie
const pieLabelsPlugin = {
    id: 'pieLabels',
    afterDraw(chart) {
        if (chart.config.type !== 'pie') return;
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

const GamificacaoTalent = () => {
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);

    // Novos estados para a API e Cabeçalho
    const [utilizador, setUtilizador] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [dadosApi, setDadosApi] = useState(null);

    useEffect(() => {
        const userLocal = JSON.parse(sessionStorage.getItem('user'));
        if (!userLocal) {
            navigate('/');
            return;
        }
        setUtilizador(userLocal);

        const carregarDados = async () => {
            try {
                // 1. Carregar Foto de Perfil
                const responseUser = await axios.get(`https://softinsa-api-riya.onrender.com/users/configuracoes/${userLocal.ID_UTILIZADOR}`);
                if (responseUser.data.success && responseUser.data.data.avatar) {
                    setAvatarUrl(responseUser.data.data.avatar);
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

                // 2. Carregar Estatísticas da API
                const responseStats = await axios.get('https://softinsa-api-riya.onrender.com/estatisticas/talent/gamificacao');
                if (responseStats.data.success) {
                    setDadosApi(responseStats.data.data);
                }
            } catch (error) {
                console.error("Erro ao carregar gamificação:", error);
            } finally {
                setLoading(false);
            }
        };

        carregarDados();
    }, [navigate]);

    const handleLogout = () => {
        sessionStorage.removeItem('user');
        navigate('/');
    };

    if (loading || !dadosApi) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh', backgroundColor: '#F4F5F9' }}>
                <div className="spinner-border text-primary" role="status"></div>
            </div>
        );
    }

    // LIGAÇÃO À API: Substituição dos dados mockados pelos dados reais mantendo o seu formato
    const predefinedColors = ['#5D78FF', '#34659D', '#FFB822', '#F4516C', '#34BFA3', '#716CB0'];

    const barData = {
        labels: dadosApi.graficoBarras.labels,
        datasets: dadosApi.graficoBarras.datasets.map((ds, idx) => ({
            label: ds.label.includes('Premium') || ds.label.includes('Geral') || ds.label.includes('Sem SL') ? ds.label : `${ds.label} Service Line`,
            data: ds.data,
            backgroundColor: predefinedColors[idx % predefinedColors.length],
        }))
    };

    const pieData = {
        labels: dadosApi.graficoPizza.labels.map(l => l.includes('Premium') || l.includes('Geral') || l.includes('Sem SL') ? l : `${l} Service Line`),
        datasets: [{
            data: dadosApi.graficoPizza.data,
            backgroundColor: predefinedColors,
            borderWidth: 0
        }]
    };

    // Preenche o seu array de rankingMock automaticamente com o Top 5
    const rankingMock = dadosApi.rankingCompleto.slice(0, 5).map((r, index) => ({
        pos: `${index + 1}º`,
        nome: r.nome,
        sl: r.sl,
        badges: r.badges,
        pontos: r.pontos
    }));

    return (
        <div className="d-flex bg-light min-vh-100">
            <SidebarTalent />
            
            <div className="flex-grow-1 p-4 dashboard-scroll">
                <div className="container-fluid text-start">
                    
                    <CabecalhoDashboard 
                        titulo="Gamificação e estatísticas"
                        subtitulo=""
                        utilizador={utilizador}
                        avatarUrl={avatarUrl}
                    />

                    {/* 1. KPIs GLOBAIS - Agora com dados reais da API */}
                    <div className="row g-4 mb-4">
                        <div className="col-md-4">
                            <div className="card border-0 shadow-sm p-4 text-center h-100 rounded-3">
                                <div className="fw-bold text-dark small mb-2">Total de pontos obtidos</div>
                                <h2 className="fw-bold text-primary mb-1">{dadosApi.kpis.totalPontos}</h2>
                                <div className="text-muted" style={{fontSize: '11px'}}>Globalmente por todos os consultores</div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="card border-0 shadow-sm p-4 text-center h-100 rounded-3">
                                <div className="fw-bold text-dark small mb-2">Badges Premium Obtidos</div>
                                <h2 className="fw-bold text-primary mb-1">{dadosApi.kpis.badgesPremium}</h2>
                                <div className="text-muted" style={{fontSize: '11px'}}>Total de Marcos (Conquistas Especiais) alcançados</div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="card border-0 shadow-sm p-4 text-center h-100 rounded-3">
                                <div className="fw-bold text-dark small mb-2">Consultores com badge</div>
                                <h2 className="fw-bold text-primary mb-1">{dadosApi.kpis.percComBadge}%</h2>
                                <div className="text-muted" style={{fontSize: '11px'}}>
                                    {dadosApi.kpis.consultoresComBadge} consultores dos {dadosApi.kpis.totalConsultores} registados possuem algum tipo de badge
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. GRÁFICOS */}
                    <div className="row g-4 mb-5">
                        <div className="col-md-6">
                            <div className="card border-0 shadow-sm p-4 h-100 rounded-3 bg-white">
                                <h6 className="fw-bold m-0">Evolução dos Pontos totais</h6>
                                <small className="text-muted d-block mb-4">Evolução dos pontos totais das Service Lines ao longo dos últimos 4 meses</small>
                                <div style={{ height: '280px' }}>
                                    <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false }} />
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="card border-0 shadow-sm p-4 h-100 rounded-3 bg-white">
                                <h6 className="fw-bold mb-4">Badges por Service Line</h6>
                                <div className="row align-items-center">
                                    <div className="col-7">
                                        <div className="mt-3" style={{ height: '240px' }}>
                                            <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                                        </div>
                                    </div>
                                    <div className="col-5">
                                        <ul className="list-unstyled small">
                                            {/* Dinâmico baseado nas labels que vierem da API */}
                                            {pieData.labels.map((label, idx) => (
                                                <li key={idx} className="mb-2">
                                                    <i className="bi bi-circle-fill me-2" style={{color: pieData.datasets[0].backgroundColor[idx]}}></i> 
                                                    {label}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. RANKING TOP 5 */}
                    <h5 className="fw-bold mb-3">Top 5 do Ranking Global de consultores</h5>
                    <div className="mb-4">
                        <TabelaGenerica colunas={['Posição', 'Consultor', 'Service Line', 'Nº Badges obtidos', 'Pontos Totais']} emptyMessage="Sem dados.">
                            {rankingMock.map((r, i) => (
                                <tr key={i}>
                                    <td className="fw-bold py-3">{r.pos}</td>
                                    <td className="fw-bold py-3">{r.nome}</td>
                                    <td className="py-3">{r.sl}</td>
                                    <td className="py-3">{r.badges}</td>
                                    <td className="fw-bold py-3">{r.pontos}</td>
                                </tr>
                            ))}
                        </TabelaGenerica>
                    </div>

                    {/* 4. BOTÃO RANKING COMPLETO (Abre Modal) */}
                    <div className="text-center pb-5">
                        <button 
                            className="btn px-5 rounded-3 fw-bold text-white shadow-sm" 
                            style={{backgroundColor: '#5D78FF'}}
                            data-bs-toggle="modal" 
                            data-bs-target="#modalRankingCompleto"
                        >
                            Ver Ranking Completo
                        </button>
                    </div>

                </div>
            </div>

            {/* MODAL DO RANKING COMPLETO (Pop-up) - Agarra em todos os dados da API */}
            <div className="modal fade" id="modalRankingCompleto" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                    <div className="modal-content border-0 shadow-lg rounded-4">
                        <div className="modal-header text-white" style={{backgroundColor: '#34659D'}}>
                            <h5 className="modal-title fw-bold">Ranking Global Completo (por Pontos)</h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div className="modal-body p-0">
                            <table className="table table-hover text-center mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Posição</th>
                                        <th>Consultor</th>
                                        <th>Service Line</th>
                                        <th>Pontos</th>
                                        <th>Ação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dadosApi.rankingCompleto.sort((a,b) => b.pontos - a.pontos).map((r, i) => (
                                        <tr key={i}>
                                            <td className="fw-bold">{i+1}º</td>
                                            <td>{r.nome}</td>
                                            <td className="small">{r.sl}</td>
                                            <td className="fw-bold text-primary">{r.pontos}</td>
                                            <td>
                                                <button 
                                                    className="btn btn-sm btn-outline-primary rounded-pill px-3"
                                                    data-bs-dismiss="modal"
                                                    onClick={() => {
                                                        setTimeout(() => navigate(`/talent/consultores/perfil/${r.id}`), 300);
                                                    }}
                                                >
                                                    Ver Perfil
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GamificacaoTalent;
