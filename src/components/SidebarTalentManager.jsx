import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { resolveAssetUrl } from '../utils/assetUrl';

const SidebarTalentManager = () => {
  const [openSubmenu, setOpenSubmenu] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  // Estados dos Dados Base (Integração com BD)
  const [utilizador, setUtilizador] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(() => {
    const user = JSON.parse(sessionStorage.getItem('user'));
    return user ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.NOME_COMPLETO_UTILIZADOR)}&background=0d6efd&color=fff&size=40` : '';
  });

  useEffect(() => {
    const userLocal = JSON.parse(sessionStorage.getItem('user'));
    if (userLocal) {
        setUtilizador(userLocal);
        
        // Chamada à Base de Dados para garantir que a foto está sempre atualizada
        const carregarFotoPerfil = async () => {
            try {
                const response = await axios.get(`https://softinsa-api-riya.onrender.com/users/configuracoes/${userLocal.ID_UTILIZADOR}`);
                if (response.data.success) {
                    if (response.data.data.avatar) {
                        setAvatarUrl(response.data.data.avatar);
                    } else {
                        setAvatarUrl(`https://ui-avatars.com/api/?name=${encodeURIComponent(userLocal.NOME_COMPLETO_UTILIZADOR)}&background=0d6efd&color=fff&size=40`);
                    }
                }
            } catch (error) {
                console.error("Erro ao carregar a foto de perfil na sidebar:", error);
            }
        };

        carregarFotoPerfil();
    }
  }, []);

  const toggleSubmenu = (name) => {
    setOpenSubmenu(openSubmenu === name ? "" : name);
  };

  const azulFundo = "#2575fc"; 
  const azulSelecao = "#1a5bbf"; 
  
  const isActive = (path) => location.pathname === path;

  const menuButtonStyle = (name, path) => ({
    backgroundColor: isActive(path) || openSubmenu === name ? azulSelecao : 'transparent',
    color: 'white',
    fontSize: '1.1rem',
    padding: '12px 20px',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: (isActive(path) || openSubmenu === name) ? '8px' : '0',
    transition: '0.3s',
    textDecoration: 'none'
  });

  const subItemStyle = (path) => 
    `list-group-item list-group-item-action border-0 ps-5 py-2 small bg-transparent ${
      isActive(path) ? 'text-white fw-bold' : 'text-white-50'
    }`;

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    navigate('/');
  };
  const avatarFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(utilizador?.NOME_COMPLETO_UTILIZADOR || 'U')}&background=198754&color=fff&size=40`;
  const avatarSrc = resolveAssetUrl(avatarUrl) || avatarFallback;

  return (
    <div className="app-sidebar d-flex flex-column text-white shadow" 
         style={{ width: '280px', minHeight: '100vh', backgroundColor: azulFundo, position: 'sticky', top: 0 }}>
      
      {/* HEADER: LOGO SOFTINSA */}
      <div className="p-4 mb-3 text-center border-bottom border-white-50">
        <div style={{ height: '50px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <h3 className="fw-bold m-0" style={{ letterSpacing: '2px' }}>SOFT<span className="text-info">I</span>NSA</h3>
        </div>
        <small className="text-white-50" style={{ fontSize: '10px' }}>TALENT MANAGEMENT SYSTEM</small>
      </div>

      {/* MENU DE NAVEGAÇÃO */}
      <div className="list-group list-group-flush p-3 flex-grow-1">
        
        {/* DASHBOARD */}
        <Link to="/talent-manager/dashboard" style={{textDecoration: 'none'}}>
          <button style={menuButtonStyle("Dashboard", "/talent-manager/dashboard")}>
            <span><i className="bi bi-house-door-fill me-3"></i> Dashboard</span>
          </button>
        </Link>

        {/* BADGES */}
        <div className="mt-2">
          <button 
            style={menuButtonStyle("Badges")} 
            onClick={() => toggleSubmenu("Badges")}
          >
            <span><i className="bi bi-patch-check-fill me-3"></i> Badges</span>
            <i className={`bi bi-chevron-${openSubmenu === "Badges" ? "up" : "down"} small`}></i>
          </button>
          <div className={`collapse ${openSubmenu === "Badges" ? "show" : ""}`}>
            <div className="mt-1">
              <Link to="/talent/catalogo-global" className={subItemStyle("/talent/catalogo-global")} style={{textDecoration: 'none'}}>
                Catálogo Global
              </Link>
              <Link to="/talent/badges-premium" className={subItemStyle("/talent/badges-premium")} style={{textDecoration: 'none'}}>
                Catálogo Premium
              </Link>
              <Link to="/talent/expiracao" className={subItemStyle("/talent/expiracao")} style={{textDecoration: 'none'}}>
                Badges em Expiração
              </Link>
            </div>
          </div>
        </div>

        {/* VALIDAÇÕES */}
        <div className="mt-2">
          <button 
            style={menuButtonStyle("Validações")} 
            onClick={() => toggleSubmenu("Validações")}
          >
            <span><i className="bi bi-check-all me-3"></i> Validações</span>
            <i className={`bi bi-chevron-${openSubmenu === "Validações" ? "up" : "down"} small`}></i>
          </button>
          <div className={`collapse ${openSubmenu === "Validações" ? "show" : ""}`}>
            <div className="mt-1">
              <Link to="/talent/validacoes/pendentes" className={subItemStyle("/talent/validacoes/pendentes")} style={{textDecoration: 'none'}}>
                Pedidos Pendentes
              </Link>
              <Link to="/talent/validacoes/historico" className={subItemStyle("/talent/validacoes/historico")} style={{textDecoration: 'none'}}>
                Histórico de Pedidos
              </Link>
            </div>
          </div>
        </div>

        {/* CONSULTORES */}
        <div className="mt-2">
          <button 
            style={menuButtonStyle("Consultores")} 
            onClick={() => toggleSubmenu("Consultores")}
          >
            <span><i className="bi bi-people-fill me-3"></i> Consultores</span>
            <i className={`bi bi-chevron-${openSubmenu === "Consultores" ? "up" : "down"} small`}></i>
          </button>
          <div className={`collapse ${openSubmenu === "Consultores" ? "show" : ""}`}>
            <div className="mt-1">
              <Link to="/talent/consultores/lista" className={subItemStyle("/talent/consultores/lista")} style={{textDecoration: 'none'}}>
                Lista e Perfis
              </Link>
              <Link to="/talent/timeline" className={subItemStyle("/talent/timeline")} style={{textDecoration: 'none'}}>
                Atribuir Objetivos
              </Link>
              <Link to="/talent/consultores/relatorios" className={subItemStyle("/talent/consultores/relatorios")} style={{textDecoration: 'none'}}>
                Relatórios
              </Link>
            </div>
          </div>
        </div>

        {/* GAMIFICAÇÕES */}
        <Link to="/talent/gamificacao" style={{textDecoration: 'none'}}>
            <button className="mt-2" style={menuButtonStyle("Gamificações", "/talent/gamificacao")}>
                <span><i className="bi bi-trophy-fill me-3"></i> Gamificações</span>
            </button>
        </Link>

        {/* CONFIGURAÇÕES - NOVO BOTÃO PRINCIPAL */}
        <Link to="/talent/configuracoes" style={{textDecoration: 'none'}}>
            <button className="mt-2" style={menuButtonStyle("Configurações", "/talent/configuracoes")}>
                <span><i className="bi bi-gear-fill me-3"></i> Configurações</span>
            </button>
        </Link>
      </div>

      {/* FOOTER: UTILIZADOR */}
      <div className="p-3">
        <div className="d-flex align-items-center p-2 rounded-3 bg-white text-dark shadow-sm">
          <div className="position-relative">
            <img 
              src={avatarSrc} 
              className="rounded-circle border" 
              style={{ width: '40px', height: '40px', objectFit: 'cover' }} 
              alt="Avatar" 
            />
            <span className="position-absolute bottom-0 end-0 p-1 bg-success border border-white rounded-circle"></span>
          </div>
          <div className="ms-3 flex-grow-1 overflow-hidden">
            <div className="fw-bold small text-truncate">
              {utilizador ? utilizador.NOME_COMPLETO_UTILIZADOR : 'A carregar...'}
            </div>
            <div className="text-muted" style={{ fontSize: '10px' }}>
              {utilizador ? utilizador.EMAIL_UTILIZADOR : ''}
            </div>
          </div>
          <div className="dropdown">
            <button className="btn btn-link text-dark p-0" data-bs-toggle="dropdown">
              <i className="bi bi-three-dots-vertical"></i>
            </button>
            <ul className="dropdown-menu dropdown-menu-end shadow border-0 small">
              {/* Modificado para apontar para as Configurações */}
              <li><Link className="dropdown-item" to="/talent/configuracoes">O meu perfil</Link></li>
              <li><hr className="dropdown-divider" /></li>
              <li>
                <button className="dropdown-item text-danger fw-bold" onClick={handleLogout}>
                  Terminar Sessão
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SidebarTalentManager;
