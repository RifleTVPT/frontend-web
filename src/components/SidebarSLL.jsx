import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const SidebarSLL = () => {
    const [openSubmenu, setOpenSubmenu] = useState("");
    const location = useLocation();
    const navigate = useNavigate();

    // Estados dos Dados Base (Integração com BD)
    const [utilizador, setUtilizador] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState('');

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
                        }
                        const serviceLine = response.data.data.serviceLine;
                        if (serviceLine && serviceLine !== 'Indefinida') {
                            const userAtualizado = {
                                ...userLocal,
                                SL_REGISTO: serviceLine,
                                SERVICE_LINE: serviceLine
                            };
                            sessionStorage.setItem('user', JSON.stringify(userAtualizado));
                            setUtilizador(userAtualizado);
                        }
                    }
                    if (!response.data.success || !response.data.data.avatar) {
                        const nomeObj = userLocal.NOME_COMPLETO_UTILIZADOR || 'S';
                        setAvatarUrl(`https://ui-avatars.com/api/?name=${encodeURIComponent(nomeObj)}&background=F4E1EC&color=333333`);
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
                <small className="text-white-50" style={{ fontSize: '10px' }}>SERVICE LINE LEADER SYSTEM</small>
            </div>

            <div className="list-group list-group-flush p-3 flex-grow-1 text-start">
                <Link to="/sll/dashboard" style={{textDecoration: 'none'}}>
                    <button style={menuButtonStyle("Dashboard", "/sll/dashboard")}>
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
                            <Link to="/sll/badges/catalogo" className={subItemStyle("/sll/badges/catalogo")} style={{textDecoration: 'none'}}>Catálogo de Badges</Link>
                            <Link to="/sll/gamificacao/premium" className={subItemStyle("/sll/gamificacao/premium")} style={{textDecoration: 'none'}}>Catálogo Premium</Link>
                            <Link to="/sll/badges/atribuidos" className={subItemStyle("/sll/badges/atribuidos")} style={{textDecoration: 'none'}}>Badges Atribuídos</Link>
                            <Link to="/sll/badges/expiracao" className={subItemStyle("/sll/badges/expiracao")} style={{textDecoration: 'none'}}>Badges em Expiração</Link>
                        </div>
                    </div>
                </div>

                {/* VALIDAÇÕES */}
                <div className="mt-2">
                    <button style={menuButtonStyle("Validações")} onClick={() => toggleSubmenu("Validações")}>
                        <span><i className="bi bi-check-all me-3"></i> Validações</span>
                        <i className={`bi bi-chevron-${openSubmenu === "Validações" ? "up" : "down"} small`}></i>
                    </button>
                    <div className={`collapse ${openSubmenu === "Validações" ? "show" : ""}`}>
                        <div className="mt-1">
                            <Link to="/sll/validacoes/pendentes" className={subItemStyle("/sll/validacoes/pendentes")} style={{textDecoration: 'none'}}>Pedidos Pendentes</Link>
                            <Link to="/sll/validacoes/historico" className={subItemStyle("/sll/validacoes/historico")} style={{textDecoration: 'none'}}>Histórico Pedidos</Link>
                        </div>
                    </div>
                </div>

                {/* CONSULTORES */}
                <div className="mt-2">
                    <button style={menuButtonStyle("Consultores")} onClick={() => toggleSubmenu("Consultores")}>
                        <span><i className="bi bi-people-fill me-3"></i> Consultores</span>
                        <i className={`bi bi-chevron-${openSubmenu === "Consultores" ? "up" : "down"} small`}></i>
                    </button>
                    <div className={`collapse ${openSubmenu === "Consultores" ? "show" : ""}`}>
                        <div className="mt-1">
                            <Link to="/sll/consultores/gestao" className={subItemStyle("/sll/consultores/gestao")} style={{textDecoration: 'none'}}>Gestão de Consultores</Link>
                            <Link to="/sll/consultores/relatorios" className={subItemStyle("/sll/consultores/relatorios")} style={{textDecoration: 'none'}}>Relatórios Detalhados</Link>
                        </div>
                    </div>
                </div>

                {/* GAMIFICAÇÃO */}
                <Link to="/sll/gamificacao" style={{textDecoration: 'none'}}>
                    <button className="mt-2" style={menuButtonStyle("Gamificação", "/sll/gamificacao")}>
                        <span><i className="bi bi-trophy-fill me-3"></i> Gamificações</span>
                    </button>
                </Link>

                {/* CONFIGURAÇÕES - NOVO BOTÃO */}
                <Link to="/sll/configuracoes" style={{textDecoration: 'none'}}>
                    <button className="mt-2" style={menuButtonStyle("Configurações", "/sll/configuracoes")}>
                        <span><i className="bi bi-gear-fill me-3"></i> Configurações</span>
                    </button>
                </Link>
            </div>

            {/* FOOTER: UTILIZADOR (Igual ao do Talent Manager) */}
            <div className="p-3">
                <div className="d-flex align-items-center p-2 rounded-3 bg-white text-dark shadow-sm">
                    <div className="position-relative">
                        <img 
                            src={avatarUrl} 
                            className="rounded-circle border" 
                            style={{ width: '40px', height: '40px', objectFit: 'cover' }} 
                            alt="Avatar" 
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
                            <li><Link className="dropdown-item" to="/sll/configuracoes">O meu perfil</Link></li>
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

export default SidebarSLL;
