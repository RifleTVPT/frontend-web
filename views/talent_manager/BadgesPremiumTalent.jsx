import React, { useState, useEffect } from 'react';
import SidebarTalent from '../../components/SidebarTalentManager';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { resolvePublicBadgeImage, useDefaultBadgeImageOnError } from '../../utils/publicBadgeImage';
import '../../assets/dashboard.css';

const BadgesPremiumTalent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [utilizador, setUtilizador] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('https://via.placeholder.com/40');
  const [pesquisa, setPesquisa] = useState('');
  const [conquistas, setConquistas] = useState([]);

  useEffect(() => {
    const userLocal = JSON.parse(sessionStorage.getItem('user'));
    if (!userLocal) {
      navigate('/');
      return;
    }
    setUtilizador(userLocal);

    const carregarDados = async () => {
      try {
        const resUser = await axios.get(`https://softinsa-api-riya.onrender.com/users/configuracoes/${userLocal.ID_UTILIZADOR}`);
        if (resUser.data.success && resUser.data.data.avatar) setAvatarUrl(resUser.data.data.avatar);

        const resPremium = await axios.get('https://softinsa-api-riya.onrender.com/conquistas/global/lista');
        if (resPremium.data.success) setConquistas(resPremium.data.data);
      } catch (error) {
        console.error('Erro ao carregar conquistas premium:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [navigate]);

  const filtrados = conquistas.filter((conquista) =>
    conquista.titulo.toLowerCase().includes(pesquisa.toLowerCase()) ||
    (conquista.desc && conquista.desc.toLowerCase().includes(pesquisa.toLowerCase()))
  );

  if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="d-flex bg-light min-vh-100">
      <SidebarTalent />
      <div className="flex-grow-1 p-4 dashboard-scroll text-start">
        <div className="container-fluid">
          <CabecalhoDashboard
            titulo="Catálogo de Badges Premium"
            subtitulo="Consulte as conquistas especiais disponíveis na plataforma"
            utilizador={utilizador}
            avatarUrl={avatarUrl}
          />

          <div className="position-relative mb-5 talent-search-input">
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
            {filtrados.map((conquista) => (
              <div className="col-md-4" key={conquista.id}>
                <div className="card shadow-sm p-4 text-center rounded-4 bg-white h-100 transition-all card-hover border-warning" style={{ borderWidth: '2px' }}>
                  <div className="d-flex justify-content-center mb-3">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center shadow-sm overflow-hidden position-relative"
                      style={{ width: '85px', height: '85px', backgroundColor: '#F9F1DC', border: '3px solid #D4AF37' }}
                    >
                      <img
                        src={resolvePublicBadgeImage(conquista.urlImagem || conquista.imagem || conquista.img)}
                        onError={useDefaultBadgeImageOnError}
                        alt={conquista.titulo}
                        className="w-100 h-100 position-absolute"
                        style={{ objectFit: 'contain', padding: '6px', zIndex: 2 }}
                      />
                    </div>
                  </div>
                  <h5 className="fw-bold mb-2 text-dark text-truncate">{conquista.titulo}</h5>
                  <p className="text-muted small mb-3 px-3 text-truncate">{conquista.desc}</p>

                  <div className="mt-auto pt-3 border-top w-100">
                    <div className="fw-bold text-primary mb-3">+{conquista.bonus} pontos Bónus</div>
                    <button
                      onClick={() => navigate(`/talent/badges-premium/detalhes/${conquista.id}`)}
                      className="btn btn-primary rounded-pill px-4 fw-bold w-100 shadow-sm"
                      style={{ backgroundColor: '#5D78FF', border: 'none' }}
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

export default BadgesPremiumTalent;
