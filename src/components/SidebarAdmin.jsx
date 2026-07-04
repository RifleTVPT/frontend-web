import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const SidebarAdmin = () => {
    const [openSubmenu, setOpenSubmenu] = useState("");
    const location = useLocation();
    const navigate = useNavigate();

    // Estados dos Dados Base
    const [utilizador, setUtilizador] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState('');

    useEffect(() => {
        const userLocal = JSON.parse(sessionStorage.getItem('user'));
        if (userLocal) {
            setUtilizador(userLocal);
            const carregarFotoPerfil = async () => {
                try {
                    const response = await axios.get(`https://softinsa-api-riya.onrender.com/users/configuracoes/${userLocal.ID_UTILIZADOR}`);
                    if (response.data.success && response.data.data.avatar) {
                        setAvatarUrl(response.data.data.avatar);
                    }
                } catch (error) { console.error("Erro foto sidebar:", error); }
            };
            carregarFotoPerfil();
        }
    }, []);

    const toggleSubmenu = (name) => setOpenSubmenu(openSubmenu === name ? "" : name);

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

    const subItemStyle = (path) => `list-group-item list-group-item-action border-0 ps-5 py-2 small bg-transparent ${isActive(path) ? 'text-white fw-bold' : 'text-white-50'}`;

    const handleLogout = () => {
        sessionStorage.removeItem('user');
        navigate('/');
    };

    return (
        <div className="d-flex flex-column text-white shadow" style={{ width: '280px', minHeight: '100vh', backgroundColor: azulFundo, position: 'sticky', top: 0 }}>
            
            <div className="p-4 mb-3 text-center border-bottom border-white-50">
                <div style={{ height: '50px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <h3 className="fw-bold m-0" style={{ letterSpacing: '2px' }}>SOFT<span className="text-info">I</span>NSA</h3>
                </div>
                <small className="text-white-50" style={{ fontSize: '10px' }}>ADMINISTRATION SYSTEM</small>
            </div>

            <div className="list-group list-group-flush p-3 flex-grow-1 text-start">
                <Link to="/admin/dashboard" style={{textDecoration: 'none'}}>
                    <button style={menuButtonStyle("Dashboard", "/admin/dashboard")}>
                        <span><i className="bi bi-house-door-fill me-3"></i> Dashboard</span>
                    </button>
                </Link>

                <div className="mt-2">
                    <button style={menuButtonStyle("Utilizadores")} onClick={() => toggleSubmenu("Utilizadores")}>
                        <span><i className="bi bi-people-fill me-3"></i> Utilizadores</span>
                        <i className={`bi bi-chevron-${openSubmenu === "Utilizadores" ? "up" : "down"} small`}></i>
                    </button>
                    <div className={`collapse ${openSubmenu === "Utilizadores" ? "show" : ""}`}>
                        <div className="mt-1">
                            <Link to="/admin/utilizadores/lista" className={subItemStyle("/admin/utilizadores/lista")} style={{textDecoration: 'none'}}>Listagem e Gestão</Link>
                            <Link to="/admin/utilizadores/pedidos" className={subItemStyle("/admin/utilizadores/pedidos")} style={{textDecoration: 'none'}}>Pedidos de Registo</Link>
                            <Link to="/admin/utilizadores/atividade" className={subItemStyle("/admin/utilizadores/atividade")} style={{textDecoration: 'none'}}>Atividade e Histórico</Link>
                        </div>
                    </div>
                </div>

                <div className="mt-2">
                    <button style={menuButtonStyle("Badges")} onClick={() => toggleSubmenu("Badges")}>
                        <span><i className="bi bi-patch-check-fill me-3"></i> Badges e Estrutura</span>
                        <i className={`bi bi-chevron-${openSubmenu === "Badges" ? "up" : "down"} small`}></i>
                    </button>
                    <div className={`collapse ${openSubmenu === "Badges" ? "show" : ""}`}>
                        <div className="mt-1">
                            <Link to="/admin/badges/catalogo" className={subItemStyle("/admin/badges/catalogo")} style={{textDecoration: 'none'}}>Catálogo Global</Link>
                            <Link to="/admin/badges/conquistas" className={subItemStyle("/admin/badges/conquistas")} style={{textDecoration: 'none'}}>Conquistas Especiais</Link>
                            <Link to="/admin/badges/estrutura" className={subItemStyle("/admin/badges/estrutura")} style={{textDecoration: 'none'}}>Estrutura Global</Link>
                            <Link to="/admin/badges/pedidos" className={subItemStyle("/admin/badges/pedidos")} style={{textDecoration: 'none'}}>Logs de Pedidos</Link>
                        </div>
                    </div>
                </div>

                <div className="mt-2">
                    <button style={menuButtonStyle("Performance")} onClick={() => toggleSubmenu("Performance")}>
                        <span><i className="bi bi-bar-chart-line-fill me-3"></i> Performance</span>
                        <i className={`bi bi-chevron-${openSubmenu === "Performance" ? "up" : "down"} small`}></i>
                    </button>
                    <div className={`collapse ${openSubmenu === "Performance" ? "show" : ""}`}>
                        <div className="mt-1">
                            <Link to="/admin/performance/metricas" className={subItemStyle("/admin/performance/metricas")} style={{textDecoration: 'none'}}>Métricas Globais</Link>
                            <Link to="/admin/performance/export" className={subItemStyle("/admin/performance/export")} style={{textDecoration: 'none'}}>Exportação de Dados</Link>
                        </div>
                    </div>
                </div>

                <div className="mt-2">
                    <button style={menuButtonStyle("Configurações")} onClick={() => toggleSubmenu("Configurações")}>
                        <span><i className="bi bi-gear-wide-connected me-3"></i> Configurações</span>
                        <i className={`bi bi-chevron-${openSubmenu === "Configurações" ? "up" : "down"} small`}></i>
                    </button>
                    <div className={`collapse ${openSubmenu === "Configurações" ? "show" : ""}`}>
                        <div className="mt-1">
                            <Link to="/admin/config/gerais" className={subItemStyle("/admin/config/gerais")} style={{textDecoration: 'none'}}>Configurações Gerais</Link>
                            <Link to="/admin/config/notificacoes" className={subItemStyle("/admin/config/notificacoes")} style={{textDecoration: 'none'}}>Gestão de Notificações</Link>
                            <Link to="/admin/config/rgpd" className={subItemStyle("/admin/config/rgpd")} style={{textDecoration: 'none'}}>Políticas e RGPD</Link>
                            <Link to="/admin/config/avisos" className={subItemStyle("/admin/config/avisos")} style={{textDecoration: 'none'}}>Avisos Genéricos</Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* FOOTER: UTILIZADOR */}
            <div className="p-3">
                <div className="d-flex align-items-center p-2 rounded-3 bg-white text-dark shadow-sm">
                    <div className="position-relative d-inline-block">
                        <img 
                            src={avatarUrl || `https://ui-avatars.com/api/?name=${utilizador ? utilizador.NOME_COMPLETO_UTILIZADOR : 'U'}&background=198754&color=fff`} 
                            className="rounded-circle border" 
                            style={{ width: '40px', height: '40px', objectFit: 'cover' }} 
                            alt="Avatar" 
                            onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${utilizador ? utilizador.NOME_COMPLETO_UTILIZADOR : 'U'}&background=198754&color=fff`; }}
                        />
                        <span className="position-absolute bottom-0 end-0 p-1 bg-success border border-white rounded-circle"></span>
                    </div>
                    <div className="ms-3 flex-grow-1 overflow-hidden">
                        <div className="fw-bold small text-truncate text-start">
                            {utilizador ? utilizador.NOME_COMPLETO_UTILIZADOR : 'A carregar...'}
                        </div>
                        <div className="text-muted text-start" style={{ fontSize: '10px' }}>
                            {utilizador ? utilizador.EMAIL_UTILIZADOR : ''}
                        </div>
                    </div>
                    <div className="dropdown">
                        <button className="btn btn-link text-dark p-0" data-bs-toggle="dropdown">
                            <i className="bi bi-three-dots-vertical"></i>
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end shadow border-0 small">
                            <li><Link className="dropdown-item" to="/admin/config/gerais">Configurações</Link></li>
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

export default SidebarAdmin;