import React, { useState, useEffect } from 'react';
import SidebarConsultor from '../../components/SidebarConsultor';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../assets/dashboard.css';
import { resolvePublicBadgeImage } from '../../utils/publicBadgeImage';

const NovoPedidoConsultor = () => {
  const navigate = useNavigate();
  
  // 1. ESTADOS DOS FILTROS
  const [estrutura, setEstrutura] = useState({ serviceLines: [], areas: [] });
  const [niveisSelecionados, setNiveisSelecionados] = useState([]);
  const [pesquisa, setPesquisa] = useState('');
  const [serviceLine, setServiceLine] = useState('Todas');
  const [areaSelecionada, setAreaSelecionada] = useState('Todas');

  // 2. ESTADOS DINÂMICOS DA BD
  const [badgesAtivos, setBadgesAtivos] = useState([]);
  const [meusBadges, setMeusBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [utilizador, setUtilizador] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('https://via.placeholder.com/40');

  useEffect(() => {
    const userLocal = JSON.parse(sessionStorage.getItem('user'));
    if (!userLocal) {
        navigate('/');
        return;
    }
    setUtilizador(userLocal);

    // Carregar a foto de perfil
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

    const carregarDados = async () => {
      try {
        const [badgesRes, estruturaRes] = await Promise.all([
            axios.get('https://softinsa-api-riya.onrender.com/catalogo/badges'),
            axios.get('https://softinsa-api-riya.onrender.com/estrutura')
        ]);
        if (badgesRes.data.success) {
          setBadgesAtivos(badgesRes.data.data);
        }
        if (estruturaRes.data.success) {
          setEstrutura(estruturaRes.data.data);
        }
      } catch (error) {
        console.error("Erro ao carregar dados para novo pedido:", error);
      } finally {
        setLoading(false);
      }

      // Carregar badges do utilizador separadamente (erro aqui não bloqueia a página)
      try {
        const meusBadgesRes = await axios.get(`https://softinsa-api-riya.onrender.com/meus-badges/consultor/${userLocal.ID_UTILIZADOR}`);
        if (meusBadgesRes.data.success) {
          setMeusBadges(meusBadgesRes.data.data.map(b => b.id));
        }
      } catch (error) {
        console.warn("Não foi possível carregar badges do utilizador:", error);
      }
    };

    carregarDados();
  }, [navigate]);

  const toggleNivel = (n) => {
    if (niveisSelecionados.includes(n)) {
      setNiveisSelecionados(niveisSelecionados.filter(item => item !== n));
    } else {
      setNiveisSelecionados([...niveisSelecionados, n]);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    navigate('/');
  };

  // 3. O CORAÇÃO DOS FILTROS CRUZADOS
  const filtrados = badgesAtivos.filter(badge => {
    const matchNivel = niveisSelecionados.length === 0 || niveisSelecionados.includes(badge.nivel);
    const matchSL = serviceLine === 'Todas' || badge.serviceLine === serviceLine;
    const matchArea = areaSelecionada === 'Todas' || badge.area === areaSelecionada;
    const termo = pesquisa.toLowerCase();
    const matchPesquisa = termo === '' || 
        badge.titulo.toLowerCase().includes(termo) || 
        badge.area.toLowerCase().includes(termo) ||
        badge.serviceLine.toLowerCase().includes(termo);

    return matchNivel && matchSL && matchArea && matchPesquisa;
  });

  const levelToLetter = (l) => {
    if (!l) return 'A';
    const name = String(l).toLowerCase();
    if(name.includes('júnior') || name.includes('junior') || name === '1' || name === 'a') return 'A';
    if(name.includes('intermédio') || name.includes('intermedio') || name === '2' || name === 'b') return 'B';
    if(name.includes('sénior') || name.includes('senior') || name === '3' || name === 'c') return 'C';
    if(name.includes('especialista') || name === '4' || name === 'd') return 'D';
    if(name.includes('líder') || name.includes('lider') || name === '5' || name === 'e') return 'E';
    if(name.includes('master') || name === '6' || name === 'f') return 'F';
    return String(l).toUpperCase();
  };

  const todosNiveis = [];
  estrutura.areas.forEach(a => {
      if (serviceLine === 'Todas' || a.slId === estrutura.serviceLines.find(sl => sl.nome === serviceLine)?.id) {
          if (areaSelecionada === 'Todas' || a.nome === areaSelecionada) {
              a.niveisAtivos.forEach(n => {
                  const letra = levelToLetter(n);
                  if(!todosNiveis.includes(letra)) todosNiveis.push(letra);
              });
          }
      }
  });
  todosNiveis.sort();

  if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="d-flex bg-light min-vh-100">
      <SidebarConsultor />

      <div className="flex-grow-1 p-4 dashboard-scroll">
        <div className="container-fluid">
          
          {/* CABEÇALHO PADRONIZADO */}
          <CabecalhoDashboard 
            titulo="Novo Pedido de Badge"
            utilizador={utilizador}
            avatarUrl={avatarUrl}
          />

          <div className="position-relative mb-5">
            <input 
              type="text" 
              className="form-control py-3 ps-4 rounded-3 border-0 shadow-sm" 
              placeholder="Pesquisar por nome de badge" 
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
            />
            <i className="bi bi-search position-absolute end-0 top-50 translate-middle-y me-3 text-muted"></i>
          </div>

          <div className="row mb-5">
            <div className="col-md-6 text-start mb-3">
              <label className="form-label fw-bold h5 mb-3">Filtrar por Service Line</label>
              <select 
                className="form-select border-0 shadow-sm py-3 rounded-3"
                value={serviceLine}
                onChange={(e) => { setServiceLine(e.target.value); setAreaSelecionada('Todas'); }}
              >
                <option value="Todas">Todas as Service Lines</option>
                {estrutura.serviceLines.map(sl => (
                    <option key={sl.id} value={sl.nome}>{sl.nome}</option>
                ))}
              </select>
            </div>
            
            <div className="col-md-6 text-start mb-3">
              <label className="form-label fw-bold h5 mb-3">Filtrar por Área</label>
              <select 
                className="form-select border-0 shadow-sm py-3 rounded-3"
                value={areaSelecionada}
                onChange={(e) => setAreaSelecionada(e.target.value)}
              >
                <option value="Todas">Todas as Áreas</option>
                {estrutura.areas
                    .filter(a => serviceLine === 'Todas' || a.slId === estrutura.serviceLines.find(sl => sl.nome === serviceLine)?.id)
                    .map(a => (
                    <option key={a.id} value={a.nome}>{a.nome}</option>
                ))}
              </select>
            </div>

            <div className="col-12 text-start mt-4">
              <label className="form-label fw-bold h5 mb-3 d-block text-start">Nível de Competência</label>
              <div className="d-flex gap-2 justify-content-start flex-wrap mt-2">
                {todosNiveis.length === 0 && <span className="text-muted small py-2">Sem níveis configurados para as seleções.</span>}
                {todosNiveis.map(n => {
                  const nivelNameMap = {'A':'Júnior', 'B':'Intermédio', 'C':'Sénior', 'D':'Especialista', 'E':'Líder de Conhecimento', 'F':'Master'};
                  const nomeExibicao = nivelNameMap[n] ? `Nível ${nivelNameMap[n]} (${n})` : `Nível (${n})`;
                  return (
                    <button 
                      key={n}
                      onClick={() => toggleNivel(n)}
                      className={`btn shadow-sm fw-bold px-4 py-2 rounded-pill ${niveisSelecionados.includes(n) ? 'btn-primary' : 'btn-white bg-white text-muted border-0'}`}
                      style={{fontSize: '14px'}}
                    >
                      {nomeExibicao}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <h4 className="fw-bold mb-4">Badges Disponíveis para Candidatura ({filtrados.length})</h4>

          <div className="row g-4 pb-5">
            {filtrados.length > 0 ? filtrados.map(badge => (
              <div className="col-md-4" key={badge.id}>
                {/* CARTÃO ESTILO CATÁLOGO COM HOVER */}
                <div 
                  className="card border-0 shadow-sm rounded-4 text-center h-100 position-relative overflow-hidden bg-white pb-0"
                  style={{ transition: 'transform 0.3s ease, box-shadow 0.3s ease' }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 0.125rem 0.25rem rgba(0,0,0,0.075)';
                  }}
                >
                  <div className="d-flex justify-content-center pt-4 mb-3">
                    <div className="rounded-circle border border-primary border-2 d-flex align-items-center justify-content-center bg-light position-relative" style={{width: '90px', height: '90px', overflow: 'hidden'}}>
                        <i className="bi bi-trophy-fill text-warning position-absolute" style={{ fontSize: '3.5rem', zIndex: 1 }}></i>
                        {(() => {
                            const rawUrl = badge.URL_IMAGEM || badge.urlImagem;
                            const imageSrc = rawUrl && rawUrl.trim() !== '' && !rawUrl.includes('placeholder') && !rawUrl.includes('default-trophy') && !rawUrl.includes('3112946.png') ? resolvePublicBadgeImage(rawUrl) : null;
                            if (!imageSrc) return null;
                            return (
                                <img 
                                    src={imageSrc} 
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                    alt="Badge" 
                                    className="position-absolute w-100 h-100"
                                    style={{objectFit: 'cover', zIndex: 2}} 
                                />
                            );
                        })()}
                    </div>
                  </div>
                  
                  <div className="px-3 pb-2">
                    <h5 className="fw-bold m-0 text-truncate" title={badge.titulo}>{badge.titulo}</h5>
                    <p className="fw-bold text-primary mb-1 mt-2 text-truncate" style={{fontSize: '1rem'}}>Service Line: {badge.serviceLine || 'Geral'}</p>
                    <p className="text-muted fw-bold mb-2 text-truncate" style={{fontSize: '0.85rem'}}>
                      Área: {badge.area || 'Geral'} - Nível {badge.nivel} 
                      {badge.nivel === 'A' ? ' (Júnior)' : badge.nivel === 'B' ? ' (Intermédio)' : badge.nivel === 'C' ? ' (Sénior)' : badge.nivel === 'D' ? ' (Especialista)' : badge.nivel === 'E' ? ' (Líder)' : badge.nivel === 'F' ? ' (Master)' : ''}
                    </p>
                  </div>
                  
                  <div className="bg-light w-100 mt-auto px-4 pt-3 pb-3 text-center border-top mt-3" style={{fontSize: '12px'}}>
                    <div className="d-flex justify-content-center gap-2 my-2">
                        <div className="bg-white border rounded p-1 px-2 shadow-sm w-50">
                            <div className="text-muted mb-1" style={{fontSize: '10px'}}>Requisitos</div>
                            <div className="fw-bold text-dark">{badge.requisitosCount || 'Sem'} reqs.</div>
                        </div>
                        <div className="bg-primary bg-opacity-10 border border-primary border-opacity-25 rounded p-1 px-2 shadow-sm w-50">
                            <div className="text-primary fw-bold mb-1" style={{fontSize: '10px'}}>Pontos Bónus</div>
                            <div className="fw-bold text-primary">+{badge.pontos}</div>
                        </div>
                    </div>
                    
                    <div className="d-flex gap-2 justify-content-center mt-3">
                      {meusBadges.includes(badge.id) ? (
                        <button className="btn btn-secondary w-100 rounded-pill fw-bold shadow-sm py-2" disabled>
                          <i className="bi bi-check-circle-fill me-2"></i> Badge já obtido
                        </button>
                      ) : (
                        <Link to={`/candidatar/${badge.id}`} className="btn btn-primary w-100 rounded-pill fw-bold shadow-sm py-2">
                          + Submeter Pedido
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-12 text-center py-5">
                <i className="bi bi-search fs-1 text-muted opacity-50 mb-3 d-block"></i>
                <h5 className="fw-bold text-muted">Nenhum Badge encontrado!</h5>
                <p className="text-muted small">Tente ajustar a sua pesquisa ou alterar as categorias.</p>
                <button onClick={() => {setPesquisa(''); setServiceLine('Todas'); setAreaSelecionada('Todas'); setNiveisSelecionados(todosNiveis);}} className="btn btn-outline-primary btn-sm rounded-pill mt-2 px-4">
                  Limpar Todos os Filtros
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default NovoPedidoConsultor;
