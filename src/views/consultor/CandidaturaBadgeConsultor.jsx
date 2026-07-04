import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import SidebarConsultor from '../../components/SidebarConsultor';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import '../../assets/dashboard.css';

const CandidaturaBadgeConsultor = () => {
  const { id } = useParams();
  const nivelNameMap = {'A':'Júnior', 'B':'Intermédio', 'C':'Sénior', 'D':'Especialista', 'E':'Líder de Conhecimento'};
  const navigate = useNavigate();
  
  const [badgeInfo, setBadgeInfo] = useState(null);
  const [requisitos, setRequisitos] = useState([]);
  const [termosAceites, setTermosAceites] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Estados RGPD e Modal
  const [configuracoes, setConfiguracoes] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  // Estado Global de Ficheiros (para o autosave e listagem total)
  const [todosFicheiros, setTodosFicheiros] = useState([]);
  const [ficheirosBinarios, setFicheirosBinarios] = useState([]); // Guarda o File object real

  const [utilizador, setUtilizador] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('https://via.placeholder.com/40');
  const [jaObtido, setJaObtido] = useState(false);
  const [idBadgeObtido, setIdBadgeObtido] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userLocal = JSON.parse(sessionStorage.getItem('user'));
        setUtilizador(userLocal);

        const [badgeRes, configRes, rascunhoRes, userRes] = await Promise.all([
            axios.get(`https://softinsa-api-riya.onrender.com/catalogo/badges/${id}`),
            axios.get(`https://softinsa-api-riya.onrender.com/configuracoes`),
            axios.get(`https://softinsa-api-riya.onrender.com/catalogo/rascunho/${id}/${userLocal.ID_UTILIZADOR}`),
            axios.get(`https://softinsa-api-riya.onrender.com/users/configuracoes/${userLocal.ID_UTILIZADOR}`)
        ]);

        if (userRes.data.success && userRes.data.data.avatar) {
            setAvatarUrl(userRes.data.data.avatar);
        }

        // Verificar se já possui o badge (separado para não bloquear o resto)
        try {
            const meusBadgesRes = await axios.get(`https://softinsa-api-riya.onrender.com/meus-badges/consultor/${userLocal.ID_UTILIZADOR}`);
            if (meusBadgesRes.data.success) {
                const obtido = meusBadgesRes.data.data.find(b => b.id === parseInt(id));
                if (obtido) {
                    setJaObtido(true);
                    setIdBadgeObtido(obtido.id || null);
                    setLoading(false);
                    return;
                }
            }
        } catch (err) {
            console.warn("Não foi possível verificar badges do utilizador:", err);
        }

        let reqsMapeados = [];
        if (badgeRes.data.success) {
          setBadgeInfo(badgeRes.data.data);
          reqsMapeados = badgeRes.data.data.requisitos.map((req, index) => {
            const nivelBadge = badgeRes.data.data.nivel;
            const tituloFinal = (!req.titulo || req.titulo.match(/^Requisito \d+$/i)) 
                                ? `Requisito ${nivelBadge}${index + 1}` 
                                : req.titulo;
            return {
              idBd: req.id,
              codigoApresentacao: `REQ-${req.id}`, 
              titulo: tituloFinal,
              desc: req.desc,
              anexado: false,
              ficheiros: []
            };
          });
        }

        // Restaurar Rascunho se existir
        let ficheirosRascunho = [];
        if (rascunhoRes.data.success && rascunhoRes.data.data) {
            const rascunho = rascunhoRes.data.data;
            const evidencias = rascunho.Evidencias || rascunho.Evidencia || rascunho.evidencias || [];
            if (evidencias.length > 0) {
                ficheirosRascunho = evidencias.map(ev => ({
                    nome: ev.NOME_FICHEIRO,
                    idRequisito: ev.ID_REQUISITO,
                    mapeadoString: ev.REQUISITO_MAPEADO,
                    url: ev.URL_FICHEIRO,
                    indisponivel: !ev.URL_FICHEIRO || ev.URL_FICHEIRO.includes('/uploads/simulacao/')
                }));

                // Preencher requisitos com os ficheiros restaurados
                ficheirosRascunho.forEach(f => {
                    if (f.idRequisito) {
                        const reqIndex = reqsMapeados.findIndex(r => r.idBd === f.idRequisito);
                        if (reqIndex !== -1) {
                            reqsMapeados[reqIndex].ficheiros.push(f.nome);
                            reqsMapeados[reqIndex].anexado = true;
                        }
                    }
                });
            }
        }
        setTodosFicheiros(ficheirosRascunho);
        setRequisitos(reqsMapeados);

        if (configRes.data.success) {
            setConfiguracoes(configRes.data.data);
        }
      } catch (error) {
        console.error("Erro", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const saveDraftToDB = async (novaListaFicheiros, binarios = ficheirosBinarios) => {
      try {
          const userLocal = JSON.parse(sessionStorage.getItem('user'));
          const formData = new FormData();
          formData.append('idBadge', id);
          formData.append('idUtilizador', userLocal.ID_UTILIZADOR);
          formData.append('todosFicheiros', JSON.stringify(novaListaFicheiros));
          binarios.forEach(file => formData.append('ficheiros', file));

          await axios.post('https://softinsa-api-riya.onrender.com/catalogo/rascunho', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
          });
      } catch (err) {
          console.error("Falha ao gravar rascunho", err);
      }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    let novosRequisitos = [...requisitos];
    let novosFicheirosAdicionados = [];
    let novosBinarios = [];
    
    // Função para limpar strings (remover acentos e minúsculas)
    const normalizeStr = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    files.forEach(file => {
      if (todosFicheiros.some(f => f.nome === file.name)) return;

      const nomeFicheiro = normalizeStr(file.name);
      
      // Procura qual o requisito cujas "palavras-chave" estejam no nome do ficheiro
      const reqMatchIndex = novosRequisitos.findIndex(r => {
          // Extrair palavras significativas do título do requisito (ignorando do, da, de, etc.)
          const palavrasChave = normalizeStr(r.titulo)
              .split(/[\s_\-]+/)
              .filter(w => w.length > 2 || (w.length === 2 && /\d/.test(w))); // Ex: "a1", "b2" passam

          // O ficheiro é mapeado se conter ALGUMA das palavras chave do título
          return palavrasChave.some(palavra => nomeFicheiro.includes(palavra));
      });
      
      let objFicheiro = { nome: file.name, idRequisito: null, mapeadoString: 'Não Mapeado' };

      if (reqMatchIndex !== -1) {
          if (!novosRequisitos[reqMatchIndex].ficheiros.includes(file.name)) {
              novosRequisitos[reqMatchIndex].ficheiros.push(file.name);
              novosRequisitos[reqMatchIndex].anexado = true;
              objFicheiro.idRequisito = novosRequisitos[reqMatchIndex].idBd;
              objFicheiro.mapeadoString = `REQ-${objFicheiro.idRequisito}`;
          }
      }
      novosFicheirosAdicionados.push(objFicheiro);
      novosBinarios.push(file);
    });

    if (novosFicheirosAdicionados.length > 0) {
        setRequisitos(novosRequisitos);
        const novaListaGlobal = [...todosFicheiros, ...novosFicheirosAdicionados];
        const novaListaBinarios = [...ficheirosBinarios, ...novosBinarios];
        setTodosFicheiros(novaListaGlobal);
        setFicheirosBinarios(novaListaBinarios);
        saveDraftToDB(novaListaGlobal, novaListaBinarios);
        e.target.value = '';
    }
  };

  const removerFicheiro = (nomeFicheiro) => {
      const novaListaGlobal = todosFicheiros.filter(f => f.nome !== nomeFicheiro);
      
      // Remover dos requisitos mapeados
      let novosRequisitos = [...requisitos];
      novosRequisitos.forEach(req => {
          req.ficheiros = req.ficheiros.filter(fn => fn !== nomeFicheiro);
          req.anexado = req.ficheiros.length > 0;
      });

      setRequisitos(novosRequisitos);
      setTodosFicheiros(novaListaGlobal);
      const novaListaBinarios = ficheirosBinarios.filter(f => f.name !== nomeFicheiro);
      setFicheirosBinarios(novaListaBinarios);
      saveDraftToDB(novaListaGlobal, novaListaBinarios);
  };

  const podeSubmeter = requisitos.every(r => r.anexado) && termosAceites;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const userLocal = JSON.parse(sessionStorage.getItem('user'));
      
      const formData = new FormData();
      formData.append('idBadge', id);
      formData.append('idUtilizador', userLocal.ID_UTILIZADOR);
      formData.append('todosFicheiros', JSON.stringify(todosFicheiros));
      formData.append('termosAceites', String(termosAceites));
      
      ficheirosBinarios.forEach(file => {
          formData.append('ficheiros', file);
      });

      const response = await axios.post('https://softinsa-api-riya.onrender.com/catalogo/candidatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        alert("Pedido submetido com sucesso! O Talent Manager será notificado.");
        navigate('/dashboard');
      }
    } catch (error) {
        alert("Erro ao submeter: " + error.response?.data?.message || error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Corrige bug RGPD: valida imediatamente se o scroll não for necessário
  const modalBodyRef = React.useRef(null);
  useEffect(() => {
      if (showModal && modalBodyRef.current) {
          const el = modalBodyRef.current;
          if (el.scrollHeight <= el.clientHeight) {
              setScrolledToBottom(true);
          }
      }
  }, [showModal]);

  const handleScroll = (e) => {
    // Se o elemento não tiver scroll, liberta automaticamente
    if (e.target.scrollHeight <= e.target.clientHeight) {
        setScrolledToBottom(true);
        return;
    }
    const bottom = Math.abs(e.target.scrollHeight - e.target.scrollTop - e.target.clientHeight) < 5;
    if (bottom) {
      setScrolledToBottom(true);
    }
  };

  const aceitarTermosModal = () => {
      setTermosAceites(true);
      setShowModal(false);
  };

  if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

  // Modal de bloqueio: badge já obtido
  if (jaObtido) return (
    <div className="d-flex bg-light min-vh-100">
      <SidebarConsultor />
      <div className="flex-grow-1 d-flex align-items-center justify-content-center">
        <div className="card border-0 shadow rounded-4 p-5 text-center" style={{maxWidth: '500px'}}>
          <div className="mb-4">
            <div className="rounded-circle bg-success bg-opacity-10 d-inline-flex align-items-center justify-content-center mb-3" style={{width:'90px',height:'90px'}}>
              <i className="bi bi-patch-check-fill text-success" style={{fontSize:'3rem'}}></i>
            </div>
            <h4 className="fw-bold">Badge Já Obtido!</h4>
            <p className="text-muted">Já possui este badge no seu perfil. Não é possível submeter uma nova candidatura para um badge que já lhe foi atribuído.</p>
          </div>
          <div className="d-flex gap-3 justify-content-center flex-wrap">
            <Link to="/pedidos/novo" className="btn btn-outline-primary rounded-pill px-4 fw-bold">
              <i className="bi bi-arrow-left me-2"></i>Voltar ao Novo Pedido
            </Link>
            <Link to={`/meus-badges/detalhes/${idBadgeObtido || ''}`} className="btn btn-primary rounded-pill px-4 fw-bold">
              <i className="bi bi-eye me-2"></i>Ver Badge Obtido
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  if (!badgeInfo) return null;

  return (
    <div className="d-flex bg-light min-vh-100">
      <SidebarConsultor />

      <div className="flex-grow-1 p-4 position-relative dashboard-scroll">
        <div className="container-fluid text-start">
          <Link to={`/detalhes/${id}`} className="text-decoration-none text-secondary small mb-3 d-inline-block fw-bold">
            <i className="bi bi-arrow-left"></i> Voltar ao Detalhe do Badge
          </Link>

          <CabecalhoDashboard 
            titulo={`Candidatura ao Badge: ${badgeInfo.titulo}`}
            subtitulo={`Service Line: ${badgeInfo.serviceLine || 'Geral'}`}
            utilizador={utilizador}
            avatarUrl={avatarUrl}
            ocultarSaudacao={true}
          />

          <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
            <div className="row align-items-center">
              <div className="col-md-4 text-start border-end pe-5">
                <div className="d-flex justify-content-center w-100 mb-3">
                  <div className="rounded-circle border border-primary d-inline-flex align-items-center justify-content-center overflow-hidden position-relative bg-light" style={{width: '150px', height: '150px'}}>
                    <i className="bi bi-trophy-fill text-warning position-absolute" style={{ fontSize: '7rem', zIndex: 1 }}></i>
                    {badgeInfo.urlImagem && badgeInfo.urlImagem.trim() !== '' && !badgeInfo.urlImagem.includes('placeholder') && !badgeInfo.urlImagem.includes('default-trophy') && !badgeInfo.urlImagem.includes('3112946.png') && (
                        <img 
                            src={badgeInfo.urlImagem} 
                            onError={(e) => { e.target.style.display = 'none'; }}
                            alt="Badge" 
                            className="position-absolute w-100 h-100"
                            style={{objectFit: 'cover', zIndex: 2}}
                        />
                    )}
                  </div>
                </div>
                <div className="ps-2 fonte-dados-grande">
                  <p className="mb-1"><strong>Service Line:</strong> {badgeInfo.serviceLine || 'Geral'}</p>
                  <p className="mb-1"><strong>Área:</strong> {badgeInfo.area || 'Geral'}</p>
                  <p className="mb-1"><strong>Nível:</strong> {nivelNameMap[badgeInfo.nivel] ? `${nivelNameMap[badgeInfo.nivel]} (Nível ${badgeInfo.nivel})` : badgeInfo.nivel}</p>
                  <p className="mb-1">
                    <strong>Validade:</strong> {
                      (() => {
                        if (badgeInfo.validadeExpiracao) {
                          return `Até ${new Date(badgeInfo.validadeExpiracao).toLocaleDateString('pt-PT')}`;
                        }
                        const meses = badgeInfo.validadeMeses != null
                          ? Math.round(Number(badgeInfo.validadeMeses))
                          : null;
                        if (!meses) return 'Sem Expiração';
                        const a = Math.floor(meses / 12);
                        const m = meses % 12;
                        let text = '';
                        if (a > 0) text += `${a} ano${a > 1 ? 's' : ''}`;
                        if (m > 0) text += `${a > 0 ? ' e ' : ''}${m} mês${m > 1 ? 'es' : ''}`;
                        if (text === '') text = 'Sem validade';
                        return text;
                      })()
                    }
                  </p>
                  <p className="mb-1"><strong>Pontos:</strong> {badgeInfo.pontos} pontos</p>
                </div>
              </div>

              <div className="col-md-8 ps-5">
                <h5 className="titulo-dados-grande">Descrição</h5>
                <p className="text-muted small mb-4">{badgeInfo.descricao}</p>
                
                <h5 className="titulo-dados-grande">Requisitos Necessários</h5>
                <div className="ps-2">
                    <ul className="list-unstyled text-muted small">
                    {requisitos.map(r => (
                        <li key={r.idBd} className="mb-2 fw-medium">
                            <span className="text-primary fw-bold">{r.titulo}</span> - <span className="fw-normal">{r.desc}</span>
                        </li>
                    ))}
                    </ul>
                </div>
              </div>
            </div>
          </div>

          <h4 className="fw-bold mb-3 mt-5">Carregue as suas evidências</h4>
          
          {/* MENSAGEM EXPLICATIVA DA NOMENCLATURA */}
          <div className="alert border-0 shadow-sm rounded-3 d-flex align-items-center mb-4" style={{backgroundColor: '#e3f2fd', color: '#084298'}}>
            <i className="bi bi-info-circle-fill fs-3 me-3"></i>
            <div>
              <strong>Regra de Associação Automática:</strong> Para que o sistema valide corretamente as suas evidências, certifique-se que o <strong>nome do ficheiro inclui o título do requisito</strong> que está a submeter (ex: se o requisito for "A1", o ficheiro deve conter "A1" no nome). Pode submeter vários ficheiros para o mesmo requisito.
            </div>
          </div>

          <div className="card border-0 shadow-sm rounded-4 p-5 mb-4 text-center position-relative hover-overlay" style={{ border: '2px dashed #a0c2ff !important', backgroundColor: '#f8faff', transition: 'all 0.2s' }}>
            <div className="py-4">
              <i className="bi bi-cloud-arrow-up text-primary" style={{ fontSize: '4.5rem' }}></i>
              <h5 className="mt-3 fw-bold text-primary">Arraste e Largue aqui os seus ficheiros</h5>
              <p className="text-muted small">Suporta múltiplos ficheiros em simultâneo (PDF, PNG, JPG...)</p>
              <input type="file" multiple onChange={handleFileUpload} className="position-absolute h-100 w-100 top-0 start-0 opacity-0" style={{ cursor: 'pointer' }} />
            </div>
          </div>

          <h6 className="fw-bold mb-3">Gestão de Todos os Ficheiros Submetidos</h6>
          {todosFicheiros.length === 0 ? (
              <div className="alert alert-secondary border-0 mb-5"><i className="bi bi-info-circle me-2"></i>Ainda não anexou ficheiros. O rascunho só será criado quando anexar pelo menos uma evidência.</div>
          ) : (
              <div className="mb-5">
                  <ul className="list-group shadow-sm rounded-3">
                      {todosFicheiros.map((f, i) => (
                          <li key={i} className="list-group-item d-flex justify-content-between align-items-center p-3">
                              <div className="d-flex align-items-center gap-3">
                                  <i className="bi bi-file-earmark-text fs-4 text-muted"></i>
                                  <div>
                                      <span className="d-block fw-bold">{f.nome}</span>
                                      {f.idRequisito ? (
                                          <span className="badge bg-success bg-opacity-10 text-success border border-success"><i className="bi bi-check-circle me-1"></i>Mapeado p/ {requisitos.find(r => r.idBd === f.idRequisito)?.titulo}</span>
                                      ) : (
                                          <span className="badge bg-danger bg-opacity-10 text-danger border border-danger"><i className="bi bi-exclamation-triangle me-1"></i>Não Mapeado</span>
                                      )}
                                  </div>
                              </div>
                              <button onClick={() => removerFicheiro(f.nome)} className="btn btn-sm btn-outline-danger border-0"><i className="bi bi-trash3 fs-5"></i></button>
                          </li>
                      ))}
                  </ul>
              </div>
          )}

          <h6 className="fw-bold mb-3 mt-4">Validação por Requisitos</h6>
          <div className="row g-3 mb-5">
            {requisitos.map(req => (
              <div key={req.idBd} className="col-md-4">
                <div className={`card border shadow-sm p-3 d-flex flex-row align-items-center justify-content-between rounded-3 bg-white ${req.anexado ? 'border-success' : 'border-danger'}`}>
                  <div className="d-flex align-items-center gap-3 overflow-hidden">
                    <i className={`bi bi-file-earmark-text fs-4 p-2 rounded ${req.anexado ? 'text-success bg-success bg-opacity-10' : 'text-danger bg-danger bg-opacity-10'}`}></i>
                    <div className="lh-1 text-truncate">
                      <small className="text-muted d-block fw-bold" style={{ fontSize: '11px' }}>{req.titulo}</small>
                      <span className={`small fw-bold mt-1 d-block ${req.anexado ? 'text-success' : 'text-danger fst-italic'}`}>
                        {req.anexado ? `${req.ficheiros.length} ficheiro(s) detetados` : 'Pendente...'}
                      </span>
                    </div>
                  </div>
                  {req.anexado && <i className="bi bi-check-circle-fill text-success fs-5"></i>}
                </div>
              </div>
            ))}
          </div>

          <div className="d-flex flex-column align-items-center mt-5 mb-5 pb-5">
            <div className="form-check mb-4 p-0 d-flex align-items-center gap-2">
              <input 
                  className="form-check-input m-0 shadow-none" 
                  type="checkbox" 
                  id="checkTermos" 
                  checked={termosAceites}
                  readOnly
                  style={{cursor: 'pointer'}}
                  onClick={() => !termosAceites && setShowModal(true)}
              />
              <label className="form-check-label small text-muted cursor-pointer" htmlFor="checkTermos" onClick={() => setShowModal(true)}>
                Li e aceito os <span className="text-primary fw-bold text-decoration-underline">Termos e Condições e a Política RGPD</span>.
              </label>
            </div>

            <div className="d-flex gap-3">
              <button 
                className={`btn px-5 py-3 rounded-3 fw-bold text-white shadow-sm ${podeSubmeter && !submitting ? 'btn-primary' : 'btn-secondary opacity-50 cursor-not-allowed'}`}
                onClick={handleSubmit} 
                disabled={!podeSubmeter || submitting}
              >
                {submitting ? 'A submeter...' : 'Submeter Candidatura'}
              </button>
              <button className="btn btn-outline-secondary px-5 py-3 rounded-3 fw-bold bg-white" onClick={() => navigate(-1)}>Cancelar</button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL RGPD */}
      {showModal && (
          <>
            <div className="modal-backdrop fade show" style={{zIndex: 1040}}></div>
            <div className="modal fade show d-block" tabIndex="-1" style={{zIndex: 1050}}>
              <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content border-0 shadow-lg rounded-4">
                  <div className="modal-header bg-light border-0 px-4 py-3 rounded-top-4">
                    <h5 className="modal-title fw-bold text-primary"><i className="bi bi-shield-check me-2"></i>Termos e Condições & RGPD</h5>
                    <button type="button" className="btn-close shadow-none" onClick={() => setShowModal(false)}></button>
                  </div>
                  
                  <div ref={modalBodyRef} className="modal-body p-4 text-start" style={{maxHeight: '50vh', overflowY: 'auto'}} onScroll={handleScroll}>
                     {configuracoes ? (
                         <>
                            <h6 className="fw-bold mb-3">1. Termos e Condições</h6>
                            <p className="text-muted small lh-lg text-justify mb-4" style={{whiteSpace: 'pre-wrap'}}>
                                {configuracoes.RGPD_TERMOS || 'Nenhuns termos definidos pelo administrador.'}
                            </p>
                            
                            <h6 className="fw-bold mb-3">2. Políticas de Privacidade e Proteção de Dados</h6>
                            <p className="text-muted small lh-lg text-justify mb-2" style={{whiteSpace: 'pre-wrap'}}>
                                {configuracoes.RGPD_POLITICAS || 'Nenhumas políticas definidas pelo administrador.'}
                            </p>
                            
                            {!scrolledToBottom && (
                                <div className="alert alert-warning py-2 mt-4 small mb-0 fw-bold text-center">
                                    <i className="bi bi-arrow-down-circle me-2"></i>Por favor, leia o documento até ao final para desbloquear a aceitação.
                                </div>
                            )}
                         </>
                     ) : (
                         <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
                     )}
                  </div>
                  
                  <div className="modal-footer border-0 px-4 py-3 bg-light rounded-bottom-4 justify-content-between">
                    <button type="button" className="btn btn-outline-secondary fw-bold rounded-3 px-4" onClick={() => setShowModal(false)}>Fechar</button>
                    <button 
                        type="button" 
                        className={`btn fw-bold rounded-3 px-4 shadow-sm ${scrolledToBottom ? 'btn-primary' : 'btn-secondary opacity-50'}`} 
                        onClick={aceitarTermosModal}
                        disabled={!scrolledToBottom}
                    >
                        <i className="bi bi-check-lg me-2"></i>Li e Aceito as Condições
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
      )}

    </div>
  );
};

export default CandidaturaBadgeConsultor;
