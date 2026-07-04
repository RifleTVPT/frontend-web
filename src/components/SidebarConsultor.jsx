import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios'; // <-- Adicionado o axios para ir à BD

const SidebarConsultor = () => {
  const [openSubmenu, setOpenSubmenu] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  // Estados dos Dados Base
  const [utilizador, setUtilizador] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(() => {
    const user = JSON.parse(sessionStorage.getItem('user'));
    return user ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.NOME_COMPLETO_UTILIZADOR)}&background=198754&color=fff&size=40` : '';
  });

  useEffect(() => {
    const userLocal = JSON.parse(sessionStorage.getItem('user'));
    if (userLocal) {
        setUtilizador(userLocal);
        
        // Chamada à Base de Dados para garantir que a foto está sempre atualizada
        const carregarFotoPerfil = async () => {
            try {
                const response = await axios.get(`http://localhost:3000/users/configuracoes/${userLocal.ID_UTILIZADOR}`);
                if (response.data.success) {
                    if (response.data.data.avatar) {
                        setAvatarUrl(response.data.data.avatar);
                    } else {
                        setAvatarUrl(`https://ui-avatars.com/api/?name=${encodeURIComponent(userLocal.NOME_COMPLETO_UTILIZADOR)}&background=198754&color=fff&size=40`);
                    }
                }
            } catch (error) {
                console.error("Erro ao carregar a foto de perfil na sidebar:", error);
            }
        };

        carregarFotoPerfil();
    }
  }, []);

  const toggleSubmenu = (name) => setOpenSubmenu(openSubmenu === name ? "" : name);
  const handleLogout = () => {
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('perfilAtivo');
    navigate('/');
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
    transition: '0.3s'
  });

  const subItemStyle = (path) => `list-group-item list-group-item-action border-0 ps-5 py-2 small bg-transparent ${isActive(path) ? 'text-white fw-bold' : 'text-white-50'}`;

  return (
    <div className="d-flex flex-column text-white shadow" style={{ width: '280px', minHeight: '100vh', backgroundColor: azulFundo, position: 'sticky', top: 0 }}>
      
      {/* HEADER: LOGO SOFTINSA */}
      <div className="p-4 mb-3 text-center border-bottom border-white-50">
        <h3 className="fw-bold m-0" style={{ letterSpacing: '2px' }}>SOFT<span className="text-info">I</span>NSA</h3>
        <small className="text-white-50" style={{ fontSize: '10px' }}>CONSULTANT SYSTEM</small>
      </div>

      {/* MENU DE NAVEGAÇÃO */}
      <div className="list-group list-group-flush p-3 flex-grow-1">
        
        {/* DASHBOARD */}
        <Link to="/dashboard" style={{textDecoration: 'none'}}>
          <button style={menuButtonStyle("Dashboard", "/dashboard")} onClick={() => setOpenSubmenu("")}>
            <span><i className="bi bi-house-door-fill me-3"></i> Dashboard</span>
          </button>
        </Link>

        {/* BADGES */}
        <div className="mt-2">
          <button style={menuButtonStyle("Badges")} onClick={() => toggleSubmenu("Badges")}>
            <span><i className="bi bi-patch-check-fill me-3"></i> Badges</span>
            <i className={`bi bi-chevron-${openSubmenu === "Badges" ? "up" : "down"} small`}></i>
          </button>
          <div className={`collapse ${openSubmenu === "Badges" ? "show" : ""}`}>
            <div className="mt-1">
              <Link to="/catalogo" className={subItemStyle("/catalogo")} style={{textDecoration: 'none'}}>Catálogo Global</Link>
              <Link to="/meus-badges" className={subItemStyle("/meus-badges")} style={{textDecoration: 'none'}}>Meus Badges</Link>
              <Link to="/conquistas" className={subItemStyle("/conquistas")} style={{textDecoration: 'none'}}>Conquistas Especiais</Link>
            </div>
          </div>
        </div>

        {/* CANDIDATURAS */}
        <div className="mt-2">
          <button style={menuButtonStyle("Candidaturas")} onClick={() => toggleSubmenu("Candidaturas")}>
            <span><i className="bi bi-hourglass-split me-3"></i> Candidaturas</span>
            <i className={`bi bi-chevron-${openSubmenu === "Candidaturas" ? "up" : "down"} small`}></i>
          </button>
          <div className={`collapse ${openSubmenu === "Candidaturas" ? "show" : ""}`}>
            <div className="mt-1">
              <Link to="/pedidos/novo" className={subItemStyle("/pedidos/novo")} style={{textDecoration: 'none'}}>Novo Pedido</Link>
              <Link to="/pedidos/historico" className={subItemStyle("/pedidos/historico")} style={{textDecoration: 'none'}}>Histórico Pedidos</Link>
            </div>
          </div>
        </div>

        {/* PERFORMANCE */}
        <div className="mt-2">
          <button style={menuButtonStyle("Performance")} onClick={() => toggleSubmenu("Performance")}>
            <span><i className="bi bi-star-fill me-3"></i> Performance</span>
            <i className={`bi bi-chevron-${openSubmenu === "Performance" ? "up" : "down"} small`}></i>
          </button>
          <div className={`collapse ${openSubmenu === "Performance" ? "show" : ""}`}>
            <div className="mt-1">
              <Link to="/performance/ranking" className={subItemStyle("/performance/ranking")} style={{textDecoration: 'none'}}>Ranking e Pontos</Link>
              <Link to="/performance/estatisticas" className={subItemStyle("/performance/estatisticas")} style={{textDecoration: 'none'}}>Estatísticas detalhadas</Link>
              <Link to="/performance/timeline" className={subItemStyle("/performance/timeline")} style={{textDecoration: 'none'}}>Timeline de objetivos</Link>
              <Link to="/performance/relatorios" className={subItemStyle("/performance/relatorios")} style={{textDecoration: 'none'}}>Relatórios detalhados</Link>
            </div>
          </div>
        </div>

        {/* CONFIGURAÇÕES */}
        <Link to="/configuracoes" style={{textDecoration: 'none'}}>
          <button className="mt-2" style={menuButtonStyle("Configurações", "/configuracoes")} onClick={() => setOpenSubmenu("")}>
            <span><i className="bi bi-gear-fill me-3"></i> Configurações</span>
          </button>
        </Link>
      </div>

      {/* FOOTER: UTILIZADOR */}
      <div className="p-3">
        <div className="d-flex align-items-center p-2 rounded-3 bg-white text-dark shadow-sm">
          <div className="position-relative">
            {/* A FOTO AGORA VEM DA BD AUTOMATICAMENTE COM FALLBACK SE QUEBRAR */}
            <img 
              src={avatarUrl} 
              className="rounded-circle border" 
              style={{ width: '40px', height: '40px', objectFit: 'cover' }} 
              alt="Avatar" 
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(utilizador?.NOME_COMPLETO_UTILIZADOR || 'U')}&background=198754&color=fff&size=40`;
              }}
            />
            <span className="position-absolute bottom-0 end-0 p-1 bg-success border border-white rounded-circle"></span>
          </div>
          <div className="ms-3 flex-grow-1 overflow-hidden">
            <div className="fw-bold small text-truncate">{utilizador ? utilizador.NOME_COMPLETO_UTILIZADOR : 'Carregando...'}</div>
            <div className="text-muted" style={{ fontSize: '10px' }}>{utilizador ? utilizador.EMAIL_UTILIZADOR : ''}</div>
          </div>
          <div className="dropdown">
            {/* O link direto para as configurações na rodapé */}
            <button className="btn btn-link text-dark p-0" data-bs-toggle="dropdown" aria-expanded="false">
              <i className="bi bi-three-dots-vertical fs-5"></i>
            </button>
            <ul className="dropdown-menu dropdown-menu-end shadow border-0 small">
              <li>
                <Link className="dropdown-item" to="/configuracoes">
                  <i className="bi bi-person-circle me-2"></i>Ver perfil
                </Link>
              </li>
              <li><hr className="dropdown-divider" /></li>
              <li>
                <button className="dropdown-item text-danger fw-bold" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right me-2"></i>Terminar sessão
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
};

export default SidebarConsultor;
