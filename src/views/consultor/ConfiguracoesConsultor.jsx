import React, { useState, useEffect, useRef } from 'react';
import SidebarConsultor from '../../components/SidebarConsultor';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { resolveAssetUrl } from '../../utils/assetUrl';
import '../../assets/dashboard.css';

const ConfiguracoesConsultor = () => {
  const navigate = useNavigate();
  const [editando, setEditando] = useState(false);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Estados dos Dados Base
  const [utilizador, setUtilizador] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const fileInputRef = useRef(null);

  const [perfil, setPerfil] = useState({
    nome: '',
    email: '',
    serviceLine: '',
    area: '',
    idioma: 'Português',
    receberAprovacoes: true,
    receberExpiracao: true,
    partilharLinkedIn: true,
    receberEmailNotif: true
  });

  const [tempPerfil, setTempPerfil] = useState({});

  // Estados para o Modal de Password
  const [showPasswordModal, setShowPasswordModal] = useState(false);
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
          setPerfil(response.data.data);
          setTempPerfil(response.data.data);
          // Carregar a imagem real da BD se existir!
          if (response.data.data.avatar) {
              setAvatarUrl(response.data.data.avatar);
          } else {
              setAvatarUrl(`https://ui-avatars.com/api/?name=${encodeURIComponent(response.data.data.nome)}&background=198754&color=fff&size=100`);
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
        setPerfil(tempPerfil);
        setEditando(false);
        const userLocalStorage = JSON.parse(sessionStorage.getItem('user'));
        userLocalStorage.NOME_COMPLETO_UTILIZADOR = tempPerfil.nome;
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

  // --- LÓGICA DE UPLOAD DA FOTO COM MULTER ---
  const handleFotoClick = () => {
    fileInputRef.current.click();
  };

  const handleFotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Colocar imagem provisória para feedback visual rápido
    setAvatarUrl(URL.createObjectURL(file));

    // Preparar o FormData (Formato que o Multer exige)
    const formData = new FormData();
    formData.append('avatar', file);

    try {
        const response = await axios.post(`https://softinsa-api-riya.onrender.com/users/upload-avatar/${utilizador.ID_UTILIZADOR}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (response.data.success) {
            // Atualizar o avatar para o link oficial recebido do Backend
            setAvatarUrl(response.data.avatarUrl);
        }
    } catch (error) {
        console.error("Erro ao fazer upload da foto:", error);
        alert("Ocorreu um erro ao guardar a sua foto no servidor.");
    }
  };
  // ------------------------------------------------

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
      <SidebarConsultor />

      <div className="flex-grow-1 p-4 text-start dashboard-scroll">
        <div className="container-fluid">
          
          {/* CABEÇALHO PADRONIZADO */}
          <CabecalhoDashboard 
            titulo="Definições Gerais de Perfil e Idioma"
            subtitulo="Gerencie as suas informações pessoais e preferências da plataforma"
            utilizador={utilizador}
            avatarUrl={avatarUrl}
          />

          <div className="row g-4">
            {/* COLUNA ESQUERDA: DADOS PESSOAIS */}
            <div className="col-md-7">
              <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
                <h5 className="fw-bold mb-4">Dados Pessoais</h5>
                <div className="d-flex align-items-start gap-4 mb-4 pb-4 border-bottom">
                  <div className="text-center">
                    <div className="position-relative cursor-pointer" onClick={handleFotoClick}>
                        <img
                          src={avatarPreviewSrc}
                          className="rounded-circle shadow-sm border"
                          style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                          alt="Avatar"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(perfil.nome || 'U')}&background=198754&color=fff&size=100`;
                          }}
                        />
                        <button className="btn btn-sm btn-primary position-absolute bottom-0 end-0 rounded-circle"><i className="bi bi-camera"></i></button>
                    </div>
                    {/* Input invisível para upload de ficheiros */}
                    <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFotoChange} />
                    
                    <small className="text-primary d-block mt-2 cursor-pointer fw-bold" onClick={handleFotoClick}>Mudar Foto</small>
                  </div>
                  <div>
                    <h4 className="fw-bold m-0">{perfil.nome}</h4>
                    <p className="text-muted mb-2">Consultor na Softinsa</p>
                    <p className="text-primary small mb-3">{perfil.email}</p>
                    <div className="bg-light p-2 rounded-3 small">
                        <strong>{perfil.serviceLine}</strong><br/>
                        <span className="text-muted">Área de formação: {perfil.area}</span>
                    </div>
                    {!editando && (
                      <button className="btn btn-primary btn-sm mt-3 px-4 rounded-pill fw-bold" onClick={() => setEditando(true)}>
                        <i className="bi bi-pencil-square me-2"></i> Editar Perfil
                      </button>
                    )}
                  </div>
                </div>

                {/* FORMULÁRIO DE EDIÇÃO */}
                <div className={`row g-3 ${!editando ? 'opacity-75' : ''}`}>
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Nome Completo</label>
                    <input 
                        type="text" 
                        className={`form-control border py-2 ${editando ? 'bg-white' : 'bg-light'}`}
                        value={editando ? tempPerfil.nome : perfil.nome} 
                        onChange={e => setTempPerfil({...tempPerfil, nome: e.target.value})}
                        disabled={!editando} 
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Email Profissional</label>
                    <input 
                        type="email" 
                        className="form-control bg-light border py-2 text-muted" 
                        value={perfil.email} 
                        disabled 
                    />
                  </div>
                  <div className="col-md-6 text-muted">
                    <label className="form-label small fw-bold">Service Line (Apenas Admin)</label>
                    <input 
                        type="text" 
                        className="form-control bg-light border py-2" 
                        value={perfil.serviceLine} 
                        disabled 
                    />
                  </div>
                  <div className="col-md-6 text-muted">
                    <label className="form-label small fw-bold">Área de Interesse (Apenas Admin)</label>
                    <input 
                        type="text" 
                        className="form-control bg-light border py-2" 
                        value={perfil.area} 
                        disabled 
                    />
                  </div>
                </div>

                {editando && (
                  <div className="d-flex gap-3 mt-5">
                    <button className="btn btn-primary px-5 rounded-3 fw-bold" onClick={handleSalvarPerfil} disabled={salvando}>
                        {salvando ? 'A Gravar...' : 'Guardar Alterações'}
                    </button>
                    <button className="btn btn-outline-secondary px-5 rounded-3" onClick={() => { setEditando(false); setTempPerfil(perfil); }}>
                        Cancelar
                    </button>
                  </div>
                )}
              </div>

              {/* SEGURANÇA */}
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                <h5 className="fw-bold mb-4">Segurança da Conta</h5>
                <button className="btn btn-primary rounded-3 px-4 fw-bold" style={{width: 'fit-content'}} onClick={() => setShowPasswordModal(true)}>
                  Alterar Password
                </button>
              </div>
            </div>

            {/* COLUNA DIREITA: ACÇÕES RÁPIDAS E LINKEDIN */}
            <div className="col-md-5">
              
              {/* ACÇÕES RÁPIDAS */}
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
                <h5 className="fw-bold mb-3">Links Úteis</h5>
                <div className="d-grid gap-2">
                    <Link to="/performance/timeline" className="btn btn-light text-start border-0 py-3 rounded-3 shadow-sm">
                        <i className="bi bi-plus-circle-fill text-primary me-2"></i> Criar Nova Meta de Evolução
                    </Link>
                    <button className="btn btn-light text-start border-0 py-3 rounded-3 shadow-sm" onClick={() => setShowHelpModal(true)}>
                        <i className="bi bi-question-circle-fill text-primary me-2"></i> Centro de Ajuda
                    </button>
                    <button className="btn btn-outline-danger border-0 mt-3 text-start fw-bold" onClick={handleLogout}>
                        <i className="bi bi-box-arrow-right me-2"></i> Terminar Sessão
                    </button>
                </div>
              </div>

              {/* BOTÃO LINKEDIN EXTERNO */}
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white text-center">
                <h5 className="fw-bold mb-3 text-start">Redes Sociais</h5>
                <a href="https://www.linkedin.com/login" target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary w-100 py-2 rounded-3 fw-bold text-decoration-none">
                    <i className="bi bi-linkedin me-2"></i> Conectar com LinkedIn
                </a>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* MODAL ALTERAR PASSWORD */}
      {showPasswordModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 p-4 shadow-lg text-start">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="fw-bold m-0">Alterar Password</h4>
                <button type="button" className="btn-close shadow-none" onClick={() => setShowPasswordModal(false)}></button>
              </div>

              {erroPassword && <div className="alert alert-danger py-2 small fw-bold">{erroPassword}</div>}

              <div className="mb-3">
                <label className="form-label small fw-bold">Password Atual</label>
                <input 
                  type="password" 
                  className="form-control bg-light border-0 py-2" 
                  value={passwordAtual}
                  onChange={e => setPasswordAtual(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold">Nova Password</label>
                <input 
                  type="password" 
                  className="form-control bg-light border-0 py-2" 
                  value={novaPassword}
                  onChange={e => setNovaPassword(e.target.value)}
                />
                <small className="text-muted d-block mt-1" style={{fontSize:'11px'}}>
                  Deve conter mín. 8 carateres, 1 maiúscula, 1 minúscula, 1 número e 1 especial (@$!%*?&).
                </small>
              </div>
              <div className="mb-4">
                <label className="form-label small fw-bold">Confirmar Nova Password</label>
                <input 
                  type="password" 
                  className="form-control bg-light border-0 py-2" 
                  value={confirmarPassword}
                  onChange={e => setConfirmarPassword(e.target.value)}
                />
              </div>

              <div className="d-flex gap-3 justify-content-end mt-2">
                <button className="btn btn-secondary px-4 rounded-3 fw-bold" onClick={() => setShowPasswordModal(false)}>Cancelar</button>
                <button className="btn btn-primary px-4 rounded-3 fw-bold shadow" onClick={handleMudarPassword}>Guardar Password</button>
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
                <h4 className="fw-bold m-0"><i className="bi bi-info-circle text-primary me-2"></i>Centro de Ajuda</h4>
                <button type="button" className="btn-close shadow-none" onClick={() => setShowHelpModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <p className="text-muted mb-4">Bem-vindo ao guia rápido da plataforma Softinsa Gamification. Aqui encontra uma explicação detalhada sobre as funcionalidades do menu lateral.</p>
                
                <div className="mb-4">
                  <h6 className="fw-bold text-primary"><i className="bi bi-house-door me-2"></i>Dashboard (Página Inicial)</h6>
                  <p className="small text-muted mb-0">Visão geral do seu desempenho, badges recentes, progresso nas áreas e resumos estatísticos do seu currículo formativo.</p>
                </div>
                
                <div className="mb-4">
                  <h6 className="fw-bold text-primary"><i className="bi bi-award me-2"></i>O meu Currículo (Meus Badges & Catálogo)</h6>
                  <p className="small text-muted mb-0"><strong>Meus Badges:</strong> Galeria pessoal com todos os certificados que conquistou.<br/><strong>Catálogo Global:</strong> Explore todos os badges oferecidos pela Softinsa e descubra como conquistá-los.</p>
                </div>

                <div className="mb-4">
                  <h6 className="fw-bold text-primary"><i className="bi bi-file-earmark-text me-2"></i>Gestão de Pedidos</h6>
                  <p className="small text-muted mb-0">Submeta aqui os comprovativos e evidências dos cursos que realizou para que as chefias (Service Line Leaders / Talent Managers) possam validar e atribuir-lhe novos badges ou conquistas especiais.</p>
                </div>

                <div className="mb-4">
                  <h6 className="fw-bold text-primary"><i className="bi bi-graph-up-arrow me-2"></i>Performance e Metas</h6>
                  <p className="small text-muted mb-0"><strong>Ranking e Pontos:</strong> Compare-se com outros consultores através de gráficos interativos.<br/><strong>Gestão de Evolução:</strong> Defina prazos e objetivos futuros numa timeline.<br/><strong>Relatórios Detalhados:</strong> Exporte métricas completas do seu perfil em PDF ou Excel.</p>
                </div>

                <div className="mb-0">
                  <h6 className="fw-bold text-primary"><i className="bi bi-gear me-2"></i>Configurações</h6>
                  <p className="small text-muted mb-0">Altere os seus dados pessoais, defina preferências de notificação (alertas de aprovação, expiração), mude a sua password ou altere o idioma e a foto de perfil.</p>
                </div>
              </div>
              <div className="modal-footer border-0 p-4 pt-0">
                <button className="btn btn-primary w-100 rounded-pill fw-bold py-2 shadow-sm" onClick={() => setShowHelpModal(false)}>Compreendi</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfiguracoesConsultor;
