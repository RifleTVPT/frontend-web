import React, { useState, useEffect, useRef } from 'react';
import SidebarSLL from '../../components/SidebarSLL';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { resolveAssetUrl } from '../../utils/assetUrl';
import '../../assets/dashboard.css';

const ConfiguracoesSLL = () => {
  const navigate = useNavigate();
  const [editando, setEditando] = useState(false);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // Estados dos Dados Base
  const [utilizador, setUtilizador] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const fileInputRef = useRef(null);

  // Lista de Service Lines possíveis (Poderia vir da API se quisesse, mas aqui deixamos as opções standard)
  const serviceLinesOptions = ['Hybrid Cloud', 'Application Operations', 'Enterprise Applications', 'Cybersecurity', 'Data & AI'];

  const [perfil, setPerfil] = useState({
    nome: '',
    email: '',
    serviceLine: '',
    idioma: 'Português',
    receberAprovacoes: true,
    receberExpiracao: true,
    partilharLinkedIn: true,
    receberEmailNotif: true
  });

  const [tempPerfil, setTempPerfil] = useState({});

  // Estados para o Modal de Password e Ajuda
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [passwordAtual, setPasswordAtual] = useState('');
  const [novaPassword, setNovaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [erroPassword, setErroPassword] = useState('');

  useEffect(() => {
    const userLocal = JSON.parse(sessionStorage.getItem('user'));
    if (!userLocal) {
        navigate('/');
        return;
    }
    setUtilizador(userLocal);

    const carregarConfiguracoes = async () => {
      try {
        const response = await axios.get(`https://softinsa-api-riya.onrender.com/users/configuracoes/${userLocal.ID_UTILIZADOR}`);
        if (response.data.success) {
          const dadosAPI = response.data.data;
          
          // Se a SL vier gravada no perfil ou estiver no userLocal, assegurar a compatibilidade
          const loadedSL = dadosAPI.serviceLine || userLocal.SL_REGISTO || userLocal.SERVICE_LINE || '';
          
          const novoPerfil = { ...dadosAPI, serviceLine: loadedSL };
          setPerfil(novoPerfil);
          setTempPerfil(novoPerfil);
          
          if (dadosAPI.avatar) {
              setAvatarUrl(dadosAPI.avatar);
          } else {
              const nomeObj = userLocal.NOME_COMPLETO_UTILIZADOR || 'SLL';
              setAvatarUrl(`https://ui-avatars.com/api/?name=${encodeURIComponent(nomeObj)}&background=F4E1EC&color=333333`);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar configurações:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarConfiguracoes();
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    navigate('/');
  };

  const handleSalvarPerfil = async () => {
    setSalvando(true);
    try {
      const response = await axios.put(`https://softinsa-api-riya.onrender.com/users/configuracoes/${utilizador.ID_UTILIZADOR}`, tempPerfil);
      if (response.data.success) {
        const perfilAtualizado = {
          ...tempPerfil,
          nome: response.data.data?.nome || tempPerfil.nome,
          email: response.data.data?.email || tempPerfil.email,
          avatar: response.data.data?.avatar || tempPerfil.avatar
        };
        setPerfil(perfilAtualizado);
        setTempPerfil(perfilAtualizado);
        setEditando(false);
        
        // Atualiza a cache local
        const userLocalStorage = JSON.parse(sessionStorage.getItem('user'));
        userLocalStorage.NOME_COMPLETO_UTILIZADOR = perfilAtualizado.nome;
        userLocalStorage.EMAIL_UTILIZADOR = perfilAtualizado.email;
        userLocalStorage.SL_REGISTO = perfilAtualizado.serviceLine;
        userLocalStorage.SERVICE_LINE = perfilAtualizado.serviceLine;
        sessionStorage.setItem('user', JSON.stringify(userLocalStorage));
        setUtilizador(userLocalStorage);
      }
    } catch (error) {
      alert("Erro ao gravar alterações. Tente novamente.");
      console.error(error);
    } finally {
      setSalvando(false);
    }
  };

  const handleMudarIdioma = async (novoIdioma) => {
    const novoPerfil = { ...perfil, idioma: novoIdioma };
    setPerfil(novoPerfil);
    setTempPerfil(novoPerfil);
    try { await axios.put(`https://softinsa-api-riya.onrender.com/users/configuracoes/${utilizador.ID_UTILIZADOR}`, novoPerfil); } 
    catch (error) { console.error("Erro ao mudar idioma:", error); }
  };

  const handleTogglePref = async (key) => {
      const novoPerfil = { ...perfil, [key]: !perfil[key] };
      setPerfil(novoPerfil);
      setTempPerfil(novoPerfil);
      try { await axios.put(`https://softinsa-api-riya.onrender.com/users/configuracoes/${utilizador.ID_UTILIZADOR}`, novoPerfil); } 
      catch (error) { console.error("Erro ao mudar preferência:", error); }
  };

  // --- LÓGICA DE UPLOAD DA FOTO ---
  const handleFotoClick = () => {
    fileInputRef.current.click();
  };

  const handleFotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAvatarUrl(URL.createObjectURL(file));
    const formData = new FormData();
    formData.append('avatar', file);

    try {
        const response = await axios.post(`https://softinsa-api-riya.onrender.com/users/upload-avatar/${utilizador.ID_UTILIZADOR}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (response.data.success && (response.data.avatarUrl || response.data.data?.avatar)) {
            const novaFoto = response.data.avatarUrl || response.data.data.avatar;
            setAvatarUrl(novaFoto);
            const userLocalStorage = JSON.parse(sessionStorage.getItem('user'));
            if (userLocalStorage) {
                userLocalStorage.URL_FOTO = novaFoto;
                sessionStorage.setItem('user', JSON.stringify(userLocalStorage));
                setUtilizador(userLocalStorage);
            }
        } else {
            const nomeObj = utilizador.NOME_COMPLETO_UTILIZADOR || 'SLL';
            setAvatarUrl(`https://ui-avatars.com/api/?name=${encodeURIComponent(nomeObj)}&background=F4E1EC&color=333333`);
        }
    } catch (error) {
        console.error("Erro ao fazer upload da foto:", error);
        alert("Ocorreu um erro ao guardar a sua foto no servidor.");
    }
  };

  const validarPassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/;
    return regex.test(password);
  };

  const handleMudarPassword = async () => {
    setErroPassword('');
    if (!passwordAtual || !novaPassword || !confirmarPassword) return setErroPassword("Preencha todos os campos.");
    if (novaPassword !== confirmarPassword) return setErroPassword("A nova password e a confirmação não coincidem.");
    if (!validarPassword(novaPassword)) return setErroPassword("A password deve ter 8+ caracteres, uma maiúscula, uma minúscula, um número e um caractere especial.");

    try {
      const response = await axios.put(`https://softinsa-api-riya.onrender.com/users/mudar-password/${utilizador.ID_UTILIZADOR}`, { passwordAtual, novaPassword });
      if (response.data.success) {
        alert("Password alterada com sucesso!");
        setShowPasswordModal(false);
        setPasswordAtual(''); setNovaPassword(''); setConfirmarPassword('');
      }
    } catch (error) {
      if (error.response && error.response.data) setErroPassword(error.response.data.message);
      else setErroPassword("Erro de conexão ao servidor.");
    }
  };
  const avatarPreviewSrc = resolveAssetUrl(avatarUrl) || avatarUrl;

  if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="d-flex bg-light min-vh-100">
      <SidebarSLL />

      <div className="flex-grow-1 p-4 dashboard-scroll text-start">
        <div className="container-fluid">
          
          <CabecalhoDashboard 
            titulo="Definições Gerais de Perfil e Idioma"
            subtitulo="Gerencie as suas informações pessoais e preferências da plataforma"
            utilizador={utilizador}
            avatarUrl={avatarUrl}
          />

          <div className="row g-4">
            <div className="col-md-7">
              <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
                <h5 className="fw-bold mb-4">Dados Pessoais</h5>
                <div className="d-flex align-items-start gap-4 mb-4 pb-4 border-bottom">
                  <div className="text-center">
                    <div className="position-relative cursor-pointer" onClick={handleFotoClick}>
                        <img src={avatarPreviewSrc} className="rounded-circle shadow-sm border" style={{ width: '100px', height: '100px', objectFit: 'cover' }} alt="Avatar" />
                        <button className="btn btn-sm btn-primary position-absolute bottom-0 end-0 rounded-circle"><i className="bi bi-camera"></i></button>
                    </div>
                    <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFotoChange} />
                    <small className="text-primary d-block mt-2 cursor-pointer fw-bold" onClick={handleFotoClick}>Mudar Foto</small>
                  </div>
                  <div>
                    <h4 className="fw-bold m-0">{perfil.nome}</h4>
                    <p className="text-muted mb-2">Service Line Leader na Softinsa</p>
                    <p className="text-primary small mb-3">{perfil.email}</p>
                    <div className="bg-light p-2 rounded-3 small">
                        <strong>Gestão de Service Line</strong><br/>
                        <span className="text-muted">Líder da área: {perfil.serviceLine}</span>
                    </div>
                    {!editando && (
                      <button className="btn btn-primary btn-sm mt-3 px-4 rounded-pill fw-bold shadow-sm" onClick={() => setEditando(true)}>
                        <i className="bi bi-pencil-square me-2"></i> Editar Perfil
                      </button>
                    )}
                  </div>
                </div>

                <div className={`row g-3 ${!editando ? 'opacity-50' : ''}`}>
                  <div className="col-md-12">
                    <label className="form-label small fw-bold">Nome Completo</label>
                    <input 
                        type="text" 
                        className={`form-control border-0 py-2 ${editando ? 'bg-white shadow-sm' : 'bg-light'}`}
                        value={editando ? tempPerfil.nome : perfil.nome} 
                        onChange={e => setTempPerfil({...tempPerfil, nome: e.target.value})}
                        disabled={!editando} 
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Service Line Alocada</label>
                    <input type="text" className="form-control bg-light border-0 py-2 text-dark fw-bold" value={perfil.serviceLine} disabled />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Email Profissional</label>
                    <input type="email" className={`form-control border-0 py-2 text-muted ${editando ? 'bg-white shadow-sm' : 'bg-light'}`} value={editando ? tempPerfil.email : perfil.email} onChange={e => setTempPerfil({...tempPerfil, email: e.target.value})} disabled={!editando} />
                  </div>
                </div>

                {editando && (
                  <div className="sll-config-actions d-flex gap-3 mt-5">
                    <button className="btn btn-primary px-5 rounded-3 fw-bold shadow-sm" onClick={handleSalvarPerfil} disabled={salvando}>
                        {salvando ? 'A Gravar...' : 'Guardar Alterações'}
                    </button>
                    <button className="btn btn-outline-secondary px-5 rounded-3 fw-bold" onClick={() => { setEditando(false); setTempPerfil(perfil); }}>
                        Cancelar
                    </button>
                  </div>
                )}
              </div>

              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                <h5 className="fw-bold mb-4">Segurança da Conta</h5>
                <button className="btn btn-primary rounded-3 px-4 fw-bold shadow-sm" style={{width: 'fit-content'}} onClick={() => setShowPasswordModal(true)}>
                  Alterar Password
                </button>
              </div>
            </div>

            <div className="col-md-5">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                <h5 className="fw-bold mb-3">Links Úteis</h5>
                <div className="d-grid gap-3">
                    <Link to="/sll/consultores/relatorios" className="btn btn-light text-start border-0 py-3 rounded-3 shadow-sm fw-bold text-dark">
                        <i className="bi bi-file-earmark-bar-graph-fill text-primary me-3 fs-5"></i> Exportar Dados e Relatórios
                    </Link>
                    <button className="btn btn-light text-start border-0 py-3 rounded-3 shadow-sm fw-bold text-dark" onClick={() => setShowHelpModal(true)}>
                        <i className="bi bi-question-circle-fill text-primary me-3 fs-5"></i> Centro de Ajuda de Liderança
                    </button>
                    <button className="btn btn-outline-danger border-0 mt-3 text-start fw-bold fs-6 py-2" onClick={handleLogout}>
                        <i className="bi bi-box-arrow-right me-3"></i> Terminar Sessão da Conta
                    </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPasswordModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 p-4 shadow-lg text-start">
              <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
                <h4 className="fw-bold m-0">Alterar Password</h4>
                <button type="button" className="btn-close shadow-none" onClick={() => setShowPasswordModal(false)}></button>
              </div>

              {erroPassword && <div className="alert alert-danger py-2 small fw-bold rounded-3">{erroPassword}</div>}

              <div className="mb-3">
                <label className="form-label small fw-bold text-muted">Password Atual</label>
                <input type="password" className="form-control bg-light border-0 py-2 rounded-3 shadow-none" value={passwordAtual} onChange={e => setPasswordAtual(e.target.value)} />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold text-muted">Nova Password</label>
                <input type="password" className="form-control bg-light border-0 py-2 rounded-3 shadow-none" value={novaPassword} onChange={e => setNovaPassword(e.target.value)} />
                <small className="text-muted d-block mt-2 fw-bold" style={{fontSize:'10px'}}>
                  Deve conter mín. 8 carateres, 1 maiúscula, 1 minúscula, 1 número e 1 especial (@$!%*?&).
                </small>
              </div>
              <div className="mb-4">
                <label className="form-label small fw-bold text-muted">Confirmar Nova Password</label>
                <input type="password" className="form-control bg-light border-0 py-2 rounded-3 shadow-none" value={confirmarPassword} onChange={e => setConfirmarPassword(e.target.value)} />
              </div>

              <div className="d-flex gap-3 justify-content-end mt-4">
                <button className="btn btn-secondary px-4 rounded-pill fw-bold border-0" style={{backgroundColor: '#6c757d'}} onClick={() => setShowPasswordModal(false)}>Cancelar</button>
                <button className="btn btn-primary px-4 rounded-pill fw-bold shadow-sm" style={{backgroundColor: '#5D78FF', border: 'none'}} onClick={handleMudarPassword}>Guardar Nova Password</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* MODAL CENTRO DE AJUDA */}
      {showHelpModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
            <div className="modal-content border-0 rounded-4 shadow-lg text-start">
              <div className="modal-header border-bottom-0 p-4 pb-0">
                <h4 className="fw-bold m-0"><i className="bi bi-info-circle text-primary me-2"></i>Centro de Ajuda de Liderança (SLL)</h4>
                <button type="button" className="btn-close shadow-none" onClick={() => setShowHelpModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <p className="text-muted mb-4">Bem-vindo ao guia rápido da plataforma Softinsa Gamification (Perfil Service Line Leader). Aqui encontra uma explicação detalhada sobre as funcionalidades disponíveis para a sua liderança.</p>
                
                <div className="mb-4">
                  <h6 className="fw-bold text-primary"><i className="bi bi-people me-2"></i>A Minha Equipa (Gestão de Consultores)</h6>
                  <p className="small text-muted mb-0">Pesquise, filtre e aceda ao perfil detalhado de todos os consultores que pertencem à sua Service Line. É aqui que pode verificar o histórico e o progresso individual de cada elemento.</p>
                </div>
                
                <div className="mb-4">
                  <h6 className="fw-bold text-primary"><i className="bi bi-award me-2"></i>Catálogo de Badges da SL</h6>
                  <p className="small text-muted mb-0">Consulte toda a oferta formativa e os percursos de certificação disponíveis exclusivamente para a sua Service Line, incluindo as metas excecionais do Catálogo Premium.</p>
                </div>

                <div className="mb-4">
                  <h6 className="fw-bold text-primary"><i className="bi bi-check-circle me-2"></i>Aprovação e Validação de Badges</h6>
                  <p className="small text-muted mb-0">Dê o aval técnico aos pedidos de badges submetidos pela sua equipa. Analise as evidências anexadas e determine se o consultor merece a aprovação (necessária antes da validação final pelo Talent Manager).</p>
                </div>

                <div className="mb-4">
                  <h6 className="fw-bold text-primary"><i className="bi bi-graph-up-arrow me-2"></i>Gamificação e Ranking</h6>
                  <p className="small text-muted mb-0"><strong>Dashboard de Gamificação:</strong> Acompanhe as estatísticas, defina objetivos individuais e veja o Top 5 da sua Service Line.<br/><strong>Relatórios:</strong> Aplique filtros e exporte relatórios detalhados do desempenho da sua equipa em PDF.</p>
                </div>

                <div className="mb-0">
                  <h6 className="fw-bold text-primary"><i className="bi bi-gear me-2"></i>Definições Gerais</h6>
                  <p className="small text-muted mb-0">Personalize a sua conta, altere a sua fotografia e gira as preferências de notificações (alertas de pedidos de aprovação e resumos automáticos por email).</p>
                </div>
              </div>
              <div className="modal-footer border-0 p-4 pt-0">
                <button className="btn btn-primary w-100 rounded-pill fw-bold py-2 shadow-sm" style={{backgroundColor: '#5D78FF', border: 'none'}} onClick={() => setShowHelpModal(false)}>Compreendi</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfiguracoesSLL;
