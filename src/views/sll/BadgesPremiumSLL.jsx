import React, { useState, useEffect } from 'react';
import SidebarSLL from '../../components/SidebarSLL';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../assets/dashboard.css';

const BadgesPremiumSLL = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [utilizador, setUtilizador] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState('https://via.placeholder.com/40');
    
    const [pesquisa, setPesquisa] = useState('');
    const [conquistas, setConquistas] = useState([]);

    useEffect(() => {
        const userLocal = JSON.parse(sessionStorage.getItem('user'));
        if (!userLocal) { navigate('/'); return; }
        setUtilizador(userLocal);

        const carregarDados = async () => {
            try {
                // 1. Foto de Perfil
                const resUser = await axios.get(`https://softinsa-api-riya.onrender.com/users/configuracoes/${userLocal.ID_UTILIZADOR}`);
                if (resUser.data.success && resUser.data.data.avatar) setAvatarUrl(resUser.data.data.avatar);

                // 2. Catálogo Global de Conquistas (Premium)
                const resPremium = await axios.get('https://softinsa-api-riya.onrender.com/conquistas/global/lista');
                if (resPremium.data.success) {
                    setConquistas(resPremium.data.data);
                }
            } catch (error) {
                console.error("Erro ao carregar conquistas premium:", error);
            } finally {
                setLoading(false);
            }
        };
        carregarDados();
    }, [navigate]);

    const handleLogout = () => {
        sessionStorage.removeItem('user');
        navigate('/');
    };

    const filtrados = conquistas.filter(c => 
        c.titulo.toLowerCase().includes(pesquisa.toLowerCase()) || 
        (c.desc && c.desc.toLowerCase().includes(pesquisa.toLowerCase()))
    );

    if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="d-flex bg-light min-vh-100">
            <SidebarSLL />
            <div className="flex-grow-1 p-4 dashboard-scroll text-start">
                <div className="container-fluid">
                    
                    <CabecalhoDashboard 
                        titulo="Catálogo de Badges Premium"
                        subtitulo="Consulte as conquistas especiais disponíveis para incentivar a sua equipa"
                        utilizador={utilizador}
                        avatarUrl={avatarUrl}
                    />

                    {/* Barra de Pesquisa */}
                    <div className="position-relative mb-5">
                        <input 
                            type="text" 
                            className="form-control py-3 ps-4 rounded-3 border-0 shadow-sm" 
                            placeholder="Pesquisar por nome da conquista..." 
                            value={pesquisa}
                            onChange={(e) => setPesquisa(e.target.value)}
                        />
                        <i className="bi bi-search position-absolute end-0 top-50 translate-middle-y me-3 text-muted"></i>
                    </div>

                    <div className="row g-4 pb-5">
                        {filtrados.map(c => (
                            <div className="col-md-4" key={c.id}>
                                <div className="card shadow-sm p-4 text-center rounded-4 bg-white h-100 transition-all card-hover border-warning" style={{borderWidth: '2px'}}>
                                    <div className="d-flex justify-content-center mb-3">
                                        <div className="rounded-circle d-flex align-items-center justify-content-center shadow-sm overflow-hidden position-relative" 
                                             style={{ width: '85px', height: '85px', backgroundColor: '#F9F1DC', border: '3px solid #D4AF37' }}>
                                            <i className="bi bi-trophy-fill text-warning fs-1 position-absolute" style={{zIndex: 1}}></i>
                                            {c.img && c.img !== 'N/A' && (
                                                <img src={c.img} alt={c.titulo} className="w-100 h-100 position-absolute" style={{objectFit: 'cover', zIndex: 2}} onError={(e) => { e.target.style.display = 'none'; }} />
                                            )}
                                        </div>
                                    </div>
                                    <h5 className="fw-bold mb-2 text-dark text-truncate">{c.titulo}</h5>
                                    <p className="text-muted small mb-3 px-3 text-truncate">{c.desc}</p>
                                    
                                    <div className="mt-auto pt-3 border-top w-100">
                                        <div className="fw-bold text-primary mb-3">+{c.bonus} pontos Bónus</div>
                                        <button 
                                            onClick={() => navigate(`/sll/gamificacao/premium/detalhes/${c.id}`)}
                                            className="btn btn-primary rounded-pill px-4 fw-bold w-100 shadow-sm"
                                            style={{backgroundColor: '#5D78FF', border: 'none'}}
                                        >
                                            Ver Requisitos
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BadgesPremiumSLL;
