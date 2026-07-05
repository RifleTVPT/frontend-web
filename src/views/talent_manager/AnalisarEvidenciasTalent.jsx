import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import SidebarTalent from '../../components/SidebarTalentManager';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import TabelaGenerica from '../../components/TabelaGenerica';
import axios from 'axios';
import '../../assets/dashboard.css';

const AnalisarEvidenciasTalent = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Verifica se a página deve estar em modo de visualização apenas (vinda do Histórico)
    const queryParams = new URLSearchParams(location.search);
    const modoConsulta = queryParams.get('readonly') === 'true';

    const [loading, setLoading] = useState(true);
    const [utilizador, setUtilizador] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState('');
    
    const [dadosPedido, setDadosPedido] = useState(null);
    const [feedback, setFeedback] = useState('');
    const [clickedEvidences, setClickedEvidences] = useState({});
    const isReadOnly = modoConsulta ||
        (dadosPedido && !['Pendente', 'Em Análise TM'].includes(dadosPedido.estado));

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
                console.error("Erro foto:", error);
            }
        };

        const fetchDetalhesPedido = async () => {
            try {
                const response = await axios.get(`https://softinsa-api-riya.onrender.com/pedidos/tm/analisar/${id}`);
                if (response.data.success) {
                    setDadosPedido(response.data.data);
                }
            } catch (error) {
                console.error("Erro a carregar pedido:", error);
                alert("Erro ao carregar os dados do pedido.");
                navigate('/talent/validacoes/pendentes');
            } finally {
                setLoading(false);
            }
        };

        carregarFotoPerfil();
        fetchDetalhesPedido();
        const atualizacao = window.setInterval(fetchDetalhesPedido, 15000);
        return () => window.clearInterval(atualizacao);
    }, [id, navigate]);

    const handleLogout = () => {
        sessionStorage.removeItem('user');
        navigate('/');
    };

    const handleAcao = async (tipo) => {
        try {
            await axios.post(`https://softinsa-api-riya.onrender.com/pedidos/tm/decisao/${id}`, {
                idUtilizadorAtivo: utilizador.ID_UTILIZADOR,
                decisao: tipo,
                feedback: feedback
            });

            if (tipo === 'SLL') {
        try {
            await axios.post(`https://softinsa-api-riya.onrender.com/pedidos/tm/decisao/${id}`, {
                idUtilizadorAtivo: utilizador.ID_UTILIZADOR,
                decisao: tipo,
                feedback: feedback
            });

            if (tipo === 'SLL') {
                alert("Pedido validado! Enviado com sucesso para o Service Line Leader (SLL) respetivo.");
            } else {
                alert("Pedido rejeitado! O consultor será notificado com o seu feedback.");
            }
            navigate('/talent/validacoes/pendentes');
        } catch (error) {
            console.error("Erro ao enviar decisão:", error);
            alert(error.response?.data?.message || "Falha ao registar a decisão.");
        }
    };

    if (loading || !dadosPedido) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="d-flex bg-light min-vh-100">
            <SidebarTalent />
            
            <div className="flex-grow-1 p-4 dashboard-scroll">
                <div className="container-fluid text-start">
                    
                    {/* CABEÇALHO PADRONIZADO */}
                    <CabecalhoDashboard 
                        titulo={`${isReadOnly ? 'Consulta de Decisão' : 'Validação de Badge'}: ${dadosPedido.badgeName || dadosPedido.area}`}
                        subtitulo={`Consultor: ${dadosPedido.consultor}`}
                        utilizador={utilizador}
                        avatarUrl={avatarUrl}
                        ocultarSaudacao={true}
                    />

                    <Link 
                        to={isReadOnly ? "/talent/validacoes/historico" : "/talent/validacoes/pendentes"} 
                        className="text-decoration-none text-dark small fw-bold d-flex align-items-center mb-4"
                    >
                        <i className="bi bi-arrow-left me-2"></i> 
                        Voltar aos {isReadOnly ? 'Histórico de Pedidos' : 'Pedidos Pendentes'}
                    </Link>

                    <div className="row g-4 mb-4">
                        <div className="col-md-6">
                            <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white d-flex flex-column">
                                <h4 className="fw-bold mb-4 text-dark">Informações do Badge</h4>
                                <div className="d-flex align-items-center mb-4">
                                    <div 
                                        className="rounded-circle bg-light d-flex justify-content-center align-items-center shadow-sm border border-light position-relative overflow-hidden flex-shrink-0" 
                                        style={{ width: '80px', height: '80px' }}
                                    >
                                        {dadosPedido.foto && dadosPedido.foto.trim() !== '' ? (
                                            <>
                                                <img 
                                                    src={resolvePublicBadgeImage(dadosPedido.foto)}
                                                    alt="Badge" 
                                                    style={{width: '100%', height: '100%', objectFit: 'contain', zIndex: 2}}
                                                    className="rounded-circle"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextElementSibling.style.setProperty('display', 'flex', 'important');
                                                    }}
                                                />
                                                <i className="bi bi-trophy-fill text-warning position-absolute" style={{fontSize: '3.5rem', zIndex: 1, display: 'none'}}></i>
                                            </>
                                        ) : (
                                            <i className="bi bi-trophy-fill text-warning position-absolute" style={{fontSize: '3.5rem', zIndex: 1, top: '50%', left: '50%', transform: 'translate(-50%, -50%)'}}></i>
                                        )}
                                    </div>
                                    <div className="ms-3">
                                        <h5 className="fw-bold mb-1 text-primary">{dadosPedido.badgeName || dadosPedido.area}</h5>
                                        <p className="text-muted small mb-0 fw-bold">{dadosPedido.sl} Service Line</p>
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <p className="mb-1"><strong>Área:</strong> {dadosPedido.area}</p>
                                    <p className="mb-1"><strong>Nível:</strong> {dadosPedido.nivel}</p>
                                    <p className="mb-1">
                                      <strong>Validade:</strong> {
                                        (() => {
                                          if (dadosPedido.validadeData) {
                                              return 'Até ' + new Date(dadosPedido.validadeData).toLocaleDateString('pt-PT');
                                          }
                                          if (!dadosPedido.validade) return 'Sem validade';
                                          const meses = dadosPedido.validade;
                                          const a = Math.floor(meses / 12);
                                          const m = meses % 12;
                                          let text = '';
                                          if (a > 0) text += a + ' ano' + (a > 1 ? 's' : '');
                                          if (m > 0) text += (a > 0 ? ' e ' : '') + m + ' mês' + (m > 1 ? 'es' : '');
                                          return text;
                                        })()
                                      }
                                    </p>
                                    <p className="mb-1"><strong>Pontos:</strong> {dadosPedido.pontos || 0} pontos</p>
                                    <p className="mb-1 mt-3"><strong>Requisitos Necessários:</strong> {dadosPedido.reqsNecessarios}</p>
                                </div>
                                <div className="mt-auto">
                                    <Link to={`/talent/badge-detalhes/${dadosPedido.idBadge}`} className="btn btn-primary btn-sm px-4 rounded-pill fw-bold shadow-sm">
                                        Ver Detalhes do Badge
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-6">
                            <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
                                <h4 className="fw-bold mb-4 text-dark">Histórico de Validação</h4>
                                <div className="ps-3 border-start border-2 border-success position-relative">
                                    {dadosPedido.timeline && dadosPedido.timeline.length > 0 ? dadosPedido.timeline.map((hist, idx) => (
                                        <div className={(!isReadOnly || idx < dadosPedido.timeline.length - 1) ? "mb-4" : "mb-0"} key={idx}>
                                            <i className={`bi bi-${hist.iconType === 'success' ? 'check-circle-fill text-success' : (hist.iconType === 'danger' ? 'x-circle-fill text-danger' : (hist.iconType === 'warning' ? 'arrow-repeat text-warning' : 'info-circle-fill text-primary'))} position-absolute start-0 translate-middle-x bg-white`} style={{marginLeft: '-1px'}}></i>
                                            <div className="ms-3">
                                                <div className="fw-bold small">{hist.acao}</div>
                                                <small className="text-muted">{hist.user} • {hist.data}</small>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="mb-0">
                                            <small className="text-muted">A aguardar primeira análise.</small>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <h4 className="fw-bold mb-3 text-dark">Evidências Submetidas</h4>
                    <TabelaGenerica 
                        colunas={['Requisito', 'Evidência', 'Status', 'Ação']}
                        emptyMessage="Sem evidências associadas a este pedido."
                    >
                        {dadosPedido.evidencias.map((e, index) => (
                            <tr key={index}>
                                <td className="py-3">
                                    <span className="fw-bold text-dark d-block">{e.req}</span>
                                    {e.codigoReq && <small className="text-muted">{e.codigoReq}</small>}
                                </td>
                                <td className="py-3">{e.ficheiro || e.doc}</td>
                                <td className="py-3">
                                    <span className={`fw-bold ${clickedEvidences[index] ? 'text-success' : e.color}`}>
                                        {clickedEvidences[index] ? 'Analisado' : e.status}
                                    </span>
                                </td>
                                <td className="py-3">
                                    {e.url ? (
                                        <a 
                                            href={e.url.startsWith('http') ? e.url : `https://softinsa-api-riya.onrender.com${e.url}`}
                                            target="_blank" 
                                            rel="noreferrer" 
                                            className="btn btn-primary btn-sm px-3 rounded-2 fw-bold shadow-sm"
                                            onClick={() => setClickedEvidences(prev => ({...prev, [index]: true}))}
                                        >
                                            <i className="bi bi-download me-2"></i>Ver / Download
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

                    {!isReadOnly ? (
                        <div className="bg-white p-4 rounded-4 shadow-sm mb-5 border-top border-5 border-primary">
                            <h5 className="fw-bold mb-3">Decisão Final</h5>
                            <textarea 
                                className="form-control mb-4 border-light bg-light" 
                                placeholder="Adicionar Comentário / feedback para o consultor em caso de rejeição (opcional)"
                                rows="3"
                                style={{ borderRadius: '15px' }}
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                            ></textarea>
                            <div className="d-flex justify-content-center gap-4">
                                <button 
                                    onClick={() => handleAcao('SLL')} 
                                    className="btn btn-success px-5 py-2 rounded-pill fw-bold shadow-sm"
                                >
                                    Enviar para SLL respetivo
                                </button>
                                <button 
                                    onClick={() => handleAcao('RECUSA')} 
                                    className="btn btn-danger px-5 py-2 rounded-pill fw-bold shadow-sm"
                                >
                                    Rejeitar Pedido
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center mb-5 p-4 bg-white rounded-4 shadow-sm border-top border-5 border-success">
                            <div className="alert alert-success d-inline-block px-5 rounded-pill fw-bold mb-0">
                                <i className="bi bi-shield-check me-2"></i> 
                                Este pedido já foi processado e arquivado no histórico.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnalisarEvidenciasTalent;
