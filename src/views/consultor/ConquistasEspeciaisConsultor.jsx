import React, { useState, useEffect } from 'react';
import SidebarConsultor from '../../components/SidebarConsultor';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { resolvePublicBadgeImage, useDefaultBadgeImageOnError } from '../../utils/publicBadgeImage';
import '../../assets/dashboard.css';

const ConquistasEspeciaisConsultor = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [utilizador, setUtilizador] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('https://via.placeholder.com/40');
  
  const [obtidas, setObtidas] = useState([]);
  const [disponiveis, setDisponiveis] = useState([]);

  // Estado para a barra de pesquisa
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const userLocal = JSON.parse(sessionStorage.getItem('user'));
    if (!userLocal) {
      navigate('/');
      return;
    }
    setUtilizador(userLocal);

    // Carregar a foto de perfil da Base de Dados
    const carregarFotoPerfil = async () => {
      try {
          const response = await axios.get(`https://softinsa-api-riya.onrender.com/users/configuracoes/${userLocal.ID_UTILIZADOR}`);
          if (response.data.success && response.data.data.avatar) {
              setAvatarUrl(response.data.data.avatar);
          }
      } catch (error) {
          console.error("Erro ao carregar a foto de perfil:", error);
      }
    };
    carregarFotoPerfil();

    const carregarConquistas = async () => {
      try {
        const response = await axios.get(`https://softinsa-api-riya.onrender.com/conquistas/consultor/${userLocal.ID_UTILIZADOR}`);
        if (response.data.success) {
          setObtidas(response.data.obtidas);
          setDisponiveis(response.data.disponiveis);
        }
      } catch (error) {
        console.error("Erro ao carregar conquistas:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarConquistas();
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    navigate('/');
  };

  // ----------------------------------------------------
  // LÓGICA DE FILTRAGEM (PESQUISA)
  // ----------------------------------------------------
  const filtrarConquistas = (lista) => {
    if (!searchTerm.trim()) return lista;
    const term = searchTerm.toLowerCase();
    return lista.filter(c => 
      c.titulo.toLowerCase().includes(term) || 
      c.descricao.toLowerCase().includes(term)
    );
  };

  const obtidasFiltradas = filtrarConquistas(obtidas);
  const disponiveisFiltradas = filtrarConquistas(disponiveis);

  if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="d-flex bg-light min-vh-100">
      <SidebarConsultor />

      <div className="flex-grow-1 p-4 dashboard-scroll">
        <div className="container-fluid text-start">
          
          {/* CABEÇALHO PADRONIZADO (Sem a Casa central) */}
          <CabecalhoDashboard 
            titulo="Galeria de Honra e Conquistas"
            utilizador={utilizador}
            avatarUrl={avatarUrl}
          />

          {/* BARRA DE PESQUISA LIGADA AO ESTADO */}
          <div className="position-relative mb-5">
            <input 
              type="text" 
              className="form-control py-3 ps-4 rounded-3 border-0 shadow-sm" 
              placeholder="Pesquisar nas conquistas por título ou descrição..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <i className="bi bi-search position-absolute end-0 top-50 translate-middle-y me-3 text-muted"></i>
          </div>

          <h4 className="fw-bold mb-4">As minhas Conquistas Especiais</h4>
          <div className="row g-4 mb-5">
            {obtidasFiltradas.length > 0 ? obtidasFiltradas.map(conq => (
              <div className="col-md-6 col-lg-4" key={conq.id}>
                <div className="card h-100 rounded-4 shadow-sm p-4 text-center border-warning bg-white" style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: '#D4AF37' }}>
                  <div className="d-flex justify-content-center mb-3">
                    <div className="rounded-circle d-flex align-items-center justify-content-center shadow-sm overflow-hidden"
                         style={{ width: '85px', height: '85px', backgroundColor: '#F9F1DC', border: '3px solid #D4AF37' }}>
                      <img
                        src={resolvePublicBadgeImage(conq.urlImagem || conq.imagem || conq.img)}
                        onError={useDefaultBadgeImageOnError}
                        alt={conq.titulo}
                        className="w-100 h-100"
                        style={{ objectFit: 'contain', padding: '6px' }}
                      />
                    </div>
                  </div>
                  <h5 className="fw-bold mb-2 text-truncate">{conq.titulo}</h5>
                  <p className="text-muted small mb-3 px-3 text-truncate">{conq.descricao}</p>
                  <div className="d-flex justify-content-between align-items-center px-3 mb-3 small">
                    <span className="text-muted">Obtido a: {conq.data}</span>
                    <span className="text-primary fw-bold">+{conq.bonus} pontos</span>
                  </div>
                  <Link to={`/performance/conquistas/${conq.id}`} className="btn btn-primary rounded-pill px-4 py-2 mx-auto fw-bold shadow-sm" style={{ width: 'fit-content' }}>
                    Ver Detalhes
                  </Link>
                </div>
              </div>
            )) : (
              <div className="col-12">
                 <p className="text-muted ps-3">{searchTerm ? 'Nenhuma conquista obtida corresponde à sua pesquisa.' : 'Ainda não obteve conquistas especiais.'}</p>
              </div>
            )}
          </div>

          <h4 className="fw-bold mb-4">Conquistas Disponíveis (Por conquistar)</h4>
          <div className="row g-4 pb-5">
            {disponiveisFiltradas.length > 0 ? disponiveisFiltradas.map(conq => (
              <div className="col-md-6 col-lg-4" key={conq.id}>
                <div className="card h-100 rounded-4 shadow-sm p-4 text-center border-0 bg-white">
                  <div className="d-flex justify-content-center mb-3">
                    <div className="rounded-circle d-flex align-items-center justify-content-center opacity-75 overflow-hidden"
                         style={{ width: '85px', height: '85px', backgroundColor: '#F0F0F0', border: '3px solid #C0C0C0' }}>
                      <img
                        src={resolvePublicBadgeImage(conq.urlImagem || conq.imagem || conq.img)}
                        onError={useDefaultBadgeImageOnError}
                        alt={conq.titulo}
                        className="w-100 h-100"
                        style={{ objectFit: 'contain', padding: '6px', filter: 'grayscale(1)', opacity: 0.75 }}
                      />
                    </div>
                  </div>
                  <h5 className="fw-bold mb-2 text-dark text-truncate">{conq.titulo}</h5>
                  <p className="text-muted small mb-3 px-3 text-truncate">{conq.descricao}</p>
                  {conq.progressoLabel && (
                    <div className={`small fw-bold mb-2 ${conq.indisponivel ? 'text-danger' : 'text-primary'}`}>
                      {conq.progressoLabel}
                    </div>
                  )}
                  {conq.prazoLabel && !conq.indisponivel && (
                    <div className="small fw-bold text-danger mb-2">
                      <i className="bi bi-clock-history me-1"></i>{conq.prazoLabel}
                    </div>
                  )}
                  <div className="mb-3 small text-primary fw-bold">+{conq.bonus} pontos Bónus</div>
                  <Link to={`/performance/conquistas/${conq.id}`} className="btn btn-outline-primary rounded-pill px-4 py-2 mx-auto fw-bold" style={{ width: 'fit-content' }}>
                    Ver Requisitos
                  </Link>
                </div>
              </div>
            )) : (
              <div className="col-12">
                 <p className="text-muted ps-3">Nenhuma conquista disponível corresponde à sua pesquisa.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ConquistasEspeciaisConsultor;
