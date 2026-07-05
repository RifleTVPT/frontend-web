import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import SidebarSLL from '../../components/SidebarSLL';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import TabelaGenerica from '../../components/TabelaGenerica';
import { resolvePublicBadgeImage } from '../../utils/publicBadgeImage';
import axios from 'axios';
import '../../assets/dashboard.css';

const ValidarPedidoSLL = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    const modoConsulta = new URLSearchParams(location.search).get('readonly') === 'true';

    const [loading, setLoading] = useState(true);
    const [utilizador, setUtilizador] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState('https://via.placeholder.com/40');
    const [pedido, setPedido] = useState(null);
    const [feedback, setFeedback] = useState('');
    const [evidenciasAbertas, setEvidenciasAbertas] = useState({});
    const isReadOnly = modoConsulta ||
        (pedido && pedido.estado !== 'Em Análise SLL');

    useEffect(() => {
        const userLocal = JSON.parse(sessionStorage.getItem('user'));
        if (!userLocal) { navigate('/'); return; }
        setUtilizador(userLocal);

        const carregarDados = async () => {
            try {
                const resUser = await axios.get(`https://softinsa-api-riya.onrender.com/users/configuracoes/${userLocal.ID_UTILIZADOR}`);
                if (resUser.data.success && resUser.data.data.avatar) setAvatarUrl(resUser.data.data.avatar);

                const resPedido = await axios.get(`https://softinsa-api-riya.onrender.com/pedidos/sll/analisar/${id}`);
                if (resPedido.data.success) {
                    setPedido(resPedido.data.data);
                }
            } catch (error) {
                console.error("Erro:", error);
            } finally {
                setLoading(false);
            }
        };
        carregarDados();
        const atualizacao = window.setInterval(carregarDados, 15000);
        return () => window.clearInterval(atualizacao);
    }, [id, navigate]);

    const handleAcaoSLL = async (tipo) => {
        if ((tipo === 'REJEITAR' || tipo === 'VOLTA') && !feedback.trim()) {
            alert('Por favor, adicione um feedback explicando o motivo.');
            return;
        }

        try {
            const response = await axios.post(`https://softinsa-api-riya.onrender.com/pedidos/sll/decisao/${id}`, {
                idUtilizadorAtivo: utilizador.ID_UTILIZADOR,
                decisao: tipo,
                feedback: feedback
            });

            if (response.data.success) {
                const msg = tipo === 'APROVAR' ? "Badge aprovado e publicado no perfil do consultor!" : 
                            tipo === 'REJEITAR' ? "Pedido rejeitado com sucesso." : "Pedido devolvido ao consultor para correção.";
                alert(msg);
                navigate('/sll/validacoes/pendentes');
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Ocorreu um erro ao registar a decisão.');
        }
    };

    if (loading || !pedido) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="d-flex bg-light min-vh-100">
            <SidebarSLL />
            <div className="flex-grow-1 p-4 dashboard-scroll">
                <div className="container-fluid text-start">
                    
                    <CabecalhoDashboard 
                        titulo={isReadOnly ? 'Detalhes da Decisão Final' : `Validação Badge: ${pedido.area} - ${pedido.nivel}`}
                        subtitulo={`${pedido.sl} Service Line`}
                        utilizador={utilizador}
                        avatarUrl={avatarUrl}
                        ocultarSaudacao={true}
                        linkHome="/sll/dashboard"
                    />

                    <Link 
                        to={isReadOnly ? "/sll/validacoes/historico" : "/sll/validacoes/pendentes"} 
                        className="text-decoration-none text-dark small fw-bold d-flex align-items-center mb-4"
                    >
                        <i className="bi bi-arrow-left me-2"></i> Voltar aos {isReadOnly ? 'Histórico de Pedidos' : 'Pedidos Pendentes'}
                    </Link>

                    <div className="row g-4 mb-5">
                        <div className="col-md-6">
                            <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white d-flex flex-column">
                                <h4 className="fw-bold mb-4 text-dark">Informações do Badge</h4>
                                <div className="d-flex align-items-center mb-4">
                                    <div 
                                        className="rounded-circle bg-light d-flex justify-content-center align-items-center shadow-sm border border-light position-relative overflow-hidden flex-shrink-0" 
                                        style={{ width: '80px', height: '80px' }}
                                    >
                                        {pedido.foto && pedido.foto.trim() !== '' ? (
                                            <>
                                              <img 
                                                  src={resolvePublicBadgeImage(pedido.foto)}
                                                  alt="Badge" 
                                                  style={{width: '100%', height: '100%', objectFit: 'cover', zIndex: 2}}
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
                                        <h5 className="fw-bold mb-1 text-primary">{pedido.badgeName || pedido.area}</h5>
                                        <p className="text-muted small mb-0 fw-bold">{pedido.sl} Service Line</p>
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <p className="mb-1"><strong>Área:</strong> {pedido.area}</p>
                                    <p className="mb-1"><strong>Nível:</strong> {pedido.nivel}</p>
                                    <p className="mb-1">
                                      <strong>Validade:</strong> {
                                        (() => {
                                          if (pedido.validadeData) {
                                              return 'Até ' + new Date(pedido.validadeData).toLocaleDateString('pt-PT');
                                          }
                                          if (!pedido.validade) return 'Sem validade';
                                          const meses = pedido.validade;
                                          const a = Math.floor(meses / 12);
                                          const m = meses % 12;
                                          let text = '';
                                          if (a > 0) text += a + ' ano' + (a > 1 ? 's' : '');
                                          if (m > 0) text += (a > 0 ? ' e ' : '') + m + ' mês' + (m > 1 ? 'es' : '');
                                          return text;
                                        })()
                                      }
                                    </p>
                                    {pedido.pontos && <p className="mb-1"><strong>Pontos:</strong> {pedido.pontos} pontos</p>}
                                    <p className="mb-1"><strong>Requisitos:</strong> {pedido.reqsNecessarios}</p>
                                </div>
                                <div className="mt-auto">
                                    <button 
                                        onClick={() => navigate(`/sll/badges/detalhes/${pedido.idBadge}`)} 
                                        className="btn btn-primary btn-sm rounded-pill px-4 fw-bold shadow-sm w-50"
                                    >
                                        Ver Detalhes do Badge
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-6">
                            <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
                                <h4 className="fw-bold mb-4 text-dark">Histórico de Validação</h4>
                                <div className="ps-3 border-start border-2 border-success position-relative">
                                    {pedido.timeline && pedido.timeline.length > 0 ? pedido.timeline.map((hist, idx) => (
                                        <div className={(!isReadOnly || idx < pedido.timeline.length - 1) ? "mb-4" : "mb-0"} key={idx}>
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
                                    {!isReadOnly && (
                                        <div className="mb-0">
                                            <i className="bi bi-hourglass-split text-warning position-absolute start-0 translate-middle-x bg-white" style={{marginLeft: '-1px'}}></i>
                                            <div className="ms-3 fs-6 fw-bold text-primary">
                                                A aguardar a sua decisão.
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <h4 className="fw-bold mb-3 text-dark">Evidências Submetidas</h4>
                    <div className="mb-5">
                        <TabelaGenerica colunas={['Requisito Mapeado', 'Documento de Evidência', 'Estado de abertura (SLL)', 'Ação']} emptyMessage="Sem evidências associadas a este pedido.">
                            {pedido.evidencias.map((e, index) => (
                                <tr key={index}>
                                    <td className="fw-bold text-primary py-3">{e.req}</td>
                                    <td className="py-3">{e.ficheiro || e.doc}</td>
                                    <td className="py-3">
                                        <span className={`fw-bold ${evidenciasAbertas[index] ? 'text-success' : 'text-muted'}`}>
                                            <i className={`bi ${evidenciasAbertas[index] ? 'bi-check-circle' : 'bi-circle'} me-1`}></i>
                                            {evidenciasAbertas[index] ? 'Aberto' : 'Não aberto'}
                                        </span>
                                    </td>
                                    <td className="py-3">
                                        {e.url ? (
                                            <a
                                                href={e.url.startsWith('http') ? e.url : `https://softinsa-api-riya.onrender.com${e.url}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                onClick={() => setEvidenciasAbertas(atuais => ({ ...atuais, [index]: true }))}
                                                className="btn btn-outline-primary btn-sm px-3 rounded-pill fw-bold shadow-sm"
                                            >
                                                <i className="bi bi-eye-fill me-2"></i>Ver / Download
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
                    </div>

                    {/* Secção de Ação */}
                    {!isReadOnly ? (
                        <div className="bg-white p-4 rounded-4 shadow-sm mb-5 border-top border-5 border-primary">
                            <h5 className="fw-bold mb-3 text-dark">Decisão Final e Feedback do SLL</h5>
                            <textarea 
                                className="form-control mb-4 border-light bg-light shadow-none fs-5" 
                                placeholder="Adicionar feedback (obrigatório em caso de rejeição ou devolução para correção)..."
                                rows="3"
                                style={{ borderRadius: '15px' }}
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                            ></textarea>
                            
                            <div className="d-flex justify-content-between gap-3 flex-wrap">
                                <button onClick={() => handleAcaoSLL('APROVAR')} className="btn btn-success px-5 py-3 fs-5 rounded-pill fw-bold shadow-sm flex-grow-1" style={{backgroundColor: '#82D674', border: 'none'}}>Aprovar Pedido</button>
                                <button onClick={() => handleAcaoSLL('REJEITAR')} className="btn btn-danger px-5 py-3 fs-5 rounded-pill fw-bold shadow-sm flex-grow-1" style={{backgroundColor: '#E85353', border: 'none'}}>Rejeitar Pedido</button>
                                <button onClick={() => handleAcaoSLL('VOLTA')} className="btn btn-warning px-5 py-3 fs-5 rounded-pill fw-bold shadow-sm text-white flex-grow-1" style={{backgroundColor: '#F3D458', border: 'none'}}>Enviar para Correção</button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center mb-5 p-4 bg-white rounded-4 shadow-sm border-top border-5 border-success">
                            <div className="alert alert-success d-inline-block px-5 rounded-pill fw-bold mb-0 fs-5">
                                <i className="bi bi-check-all me-2"></i> Este processo já foi finalizado e a decisão está registada.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ValidarPedidoSLL;
