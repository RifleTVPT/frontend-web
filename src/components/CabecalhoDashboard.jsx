import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NotificationSystem from './NotificationSystem';
import { resolveAssetUrl } from '../utils/assetUrl';

const CabecalhoDashboard = ({ titulo, utilizador, avatarUrl, linkHome, iconeEsquerda, ocultarSaudacao }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        if (window.confirm("Pretende terminar a sua sessão?")) {
            sessionStorage.removeItem('user');
            navigate('/'); 
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 12) return 'Bom dia';
        if (hour >= 12 && hour < 20) return 'Boa tarde';
        return 'Boa noite';
    };

    const avatarFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(utilizador ? utilizador.NOME_COMPLETO_UTILIZADOR : 'U')}&background=198754&color=fff`;
    const avatarSrc = resolveAssetUrl(avatarUrl) || avatarFallback;

    const perfil = (
        sessionStorage.getItem('perfilAtivo')
        || utilizador?.PERFIL_ATIVO
        || utilizador?.PERFIL_UTILIZADOR
        || ''
    ).toLowerCase();
    const homeResolvida = linkHome || (
        perfil.includes('service line') || perfil.includes('sll')
            ? '/sll/dashboard'
            : perfil.includes('talent')
                ? '/talent-manager/dashboard'
                : perfil.includes('admin')
                    ? '/admin/dashboard'
                    : '/dashboard'
    );

    return (
        <header className="d-flex justify-content-between align-items-center mb-4 position-relative">
            {/* Lado Esquerdo */}
            <div className="d-flex align-items-center gap-3">
                <h4 className="fw-bold text-dark m-0">{titulo}</h4>
                {iconeEsquerda && (
                    <span className="text-primary fw-bold small bg-primary bg-opacity-10 px-3 py-1 rounded-pill">
                        {iconeEsquerda}
                    </span>
                )}
            </div>
            
            {/* Centro Perfeito - Casa com Olá Nome */}
            <div className="position-absolute start-50 translate-middle-x">
               {!ocultarSaudacao && (
                 <Link to={homeResolvida} className="text-decoration-none fw-bold text-primary d-flex align-items-center gap-2">
                   <i className="bi bi-house-fill fs-5 mb-1"></i> 
                   <span className="fs-5">{getGreeting()}, {utilizador?.NOME_COMPLETO_UTILIZADOR?.split(' ')[0] || 'Utilizador'}!</span>
                 </Link>
               )}
            </div>

            {/* Lado Direito */}
            <div className="d-flex align-items-center gap-4">
               <NotificationSystem />
               
               <div className="d-flex align-items-center gap-2 border-start ps-3 text-start">
                  <img 
                    src={avatarSrc} 
                    onError={(e) => { e.target.onerror = null; e.target.src = avatarFallback; }}
                    className="rounded-circle shadow-sm border" 
                    style={{ width: '40px', height: '40px', objectFit: 'cover' }} 
                    alt="user avatar" 
                  />
                  <div className="lh-1">
                    <div className="small fw-bold">{utilizador?.NOME_COMPLETO_UTILIZADOR}</div>
                    <span 
                      onClick={handleLogout} 
                      className="text-danger fw-bold text-decoration-none mt-1 d-inline-block hover-opacidade" 
                      style={{fontSize: '11px', cursor: 'pointer'}}
                    >
                        <i className="bi bi-box-arrow-right me-1"></i>Terminar sessão
                    </span>
                  </div>
               </div>
            </div>
        </header>
    );
};

export default CabecalhoDashboard;
