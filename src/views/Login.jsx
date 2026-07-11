import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from './auth.service';
import "../Login.css";
import bannerImg from '../assets/login-banner.png';
import Swal from 'sweetalert2';

const Login = () => {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Estados para o Modal de múltiplos perfis
  const [showProfileSelect, setShowProfileSelect] = useState(false);
  const [perfisDisponiveis, setPerfisDisponiveis] = useState([]);

  useEffect(() => {
    if (sessionStorage.getItem('sessionExpiredMessage') === '1') {
      sessionStorage.removeItem('sessionExpiredMessage');
      Swal.fire({
        icon: 'warning',
        title: 'Sessão Expirada',
        text: 'A sua sessão expirou. Por favor, inicie sessão novamente para continuar.',
        confirmButtonText: 'Entendi',
        confirmButtonColor: '#255bbf',
        allowOutsideClick: false,
        allowEscapeKey: false
      });
    }
  }, []);

  // Lógica de Redirecionamento 
  const selecionarPerfil = (perfil) => {
    // Pode guardar o perfil escolhido no LocalStorage para os próximos ecrãs saberem
    sessionStorage.setItem('perfilAtivo', perfil);

    if (perfil === "Consultor") navigate('/dashboard');
    else if (perfil === "Talent Manager" || perfil === "TM") navigate('/talent-manager/dashboard');
    else if (perfil === "Service Line Leader" || perfil === "SLL") navigate('/sll/dashboard');
    else if (perfil === "Administrador" || perfil === "Admin") navigate('/admin/dashboard');
    else navigate('/dashboard');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    AuthService.login(email, password)
      .then((res) => {
        if (res.success === false) {
          setErro(res.message || 'Autenticação falhou.');
          setLoading(false);
        } else {
          const utilizadorReal = res.user;

          let perfisDoUser = utilizadorReal.PERFIL_UTILIZADOR ? utilizadorReal.PERFIL_UTILIZADOR.split(' / ') : [];
          if (perfisDoUser.length === 0) perfisDoUser = ["Consultor"];

          // A LÓGICA DE DECISÃO:
          if (res.firstAccess) {
              navigate('/primeiro-acesso');
          } else {
              if (perfisDoUser.length > 1) {
                  setPerfisDisponiveis(perfisDoUser); // Guarda os perfis
                  setShowProfileSelect(true);         // Abre o Modal!
              } else {
                  selecionarPerfil(perfisDoUser[0]);  // Entra direto (só tem 1 perfil)
              }
          }
        }
      })
      .catch((error) => {
        if (error.response && error.response.data) {
          setErro(error.response.data.message);
        } else {
          setErro('Erro de ligação ao servidor. Verifique se o backend está a correr.');
        }
        setLoading(false);
      });
  };

  return (
    <div className="container-fluid vh-100 p-0 overflow-hidden bg-white">
      <div className="d-flex h-100 flex-nowrap">
        
        {/* LADO ESQUERDO: FORMULÁRIO */}
        <div className="login-form-side d-flex flex-column justify-content-center align-items-center px-5 bg-white shadow-lg">
          <div style={{ maxWidth: '570px', width: '100%' }}>
            <div className="mb-5 text-start">
                <h2 className="fw-bold text-primary mb-0" style={{ letterSpacing: '-1px', fontSize: '2.5rem' }}>
                    SOFT<span style={{ color: '#7DD3FC' }}>I</span>NSA
                </h2>
            </div>
            
            <div className="text-start">
                <h3 className="fw-bold mb-1 text-dark">Login</h3>
                <p className="text-muted small mb-4">Aceda à sua Plataforma de Badges e comece já a evoluir os seus conhecimentos!</p>
                
                {erro && (
                    <div className="alert alert-danger py-2 small fw-bold" role="alert">
                        <i className="bi bi-exclamation-triangle-fill me-2"></i>{erro}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div className="mb-3">
                        <label className="form-label small fw-bold text-dark">Email</label>
                        <input 
                          type="email" 
                          className="form-control login-input border-0 shadow-none" 
                          placeholder="Introduza o seu Email Profissional" 
                          required 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)} 
                        />
                    </div>
                    <div className="mb-1">
                        <label className="form-label small fw-bold text-dark">Password</label>
                        <input 
                          type="password"  
                          className="form-control login-input border-0 shadow-none" 
                          placeholder="............" 
                          required 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div className="text-end mb-4">
                        <small onClick={() => navigate('/recuperar-password')} className="text-primary fw-bold cursor-pointer" style={{ fontSize: '11px' }}>Esqueceu-se da Password ?</small>
                    </div>

                    <button type="submit" disabled={loading} className="btn login-btn-primary w-100 text-white fw-bold mb-4 shadow-sm">
                        {loading ? 'A verificar...' : 'Iniciar Sessão'}
                    </button>
                </form>

                <div className="text-center mt-5">
                    <p className="small text-muted">Não tem uma conta? <span onClick={() => navigate('/registo')} className="text-primary fw-bold cursor-pointer text-decoration-none">Registe-se</span></p>
                </div>
            </div>
          </div>
        </div>

        {/* LADO DIREITO: BANNER */}
        <div className="login-banner-side" style={{ 
          backgroundImage: `url(${bannerImg})`,
          backgroundColor: '#335fce'
          }} >
        </div>
      </div>

      {/* MODAL DE SELEÇÃO DE PERFIL RESTAURADO */}
      {showProfileSelect && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg p-4">
              <div className="text-center mb-4">
                <div className="bg-primary bg-opacity-10 p-3 rounded-circle d-inline-block mb-2">
                    <i className="bi bi-people-fill fs-1 text-primary"></i>
                </div>
                <h4 className="fw-bold mt-2 text-dark">Perfil de Acesso</h4>
                <p className="text-muted small px-3">A sua conta tem múltiplos perfis associados. Escolha como deseja entrar:</p>
              </div>
              <div className="d-grid gap-3">
                {perfisDisponiveis.map(perfil => (
                  <button key={perfil} onClick={() => selecionarPerfil(perfil)} className="btn btn-light py-3 fw-bold rounded-3 d-flex justify-content-between align-items-center border-0 shadow-sm">
                    <span className="text-primary">{perfil}</span>
                    <i className="bi bi-arrow-right-short fs-4 text-primary"></i>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
