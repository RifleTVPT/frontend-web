import React, { useState, useEffect } from 'react';
import SidebarConsultor from '../../components/SidebarConsultor';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../assets/dashboard.css';

const MeusBadgesConsultor = () => {
  const navigate = useNavigate();
  const [niveisSelecionados, setNiveisSelecionados] = useState([]);
  const [estrutura, setEstrutura] = useState({ serviceLines: [], areas: [] });

  // Estados Dinâmicos
  const [meusBadges, setMeusBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [utilizador, setUtilizador] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('https://via.placeholder.com/40');

  // Estados dos novos Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedServiceLine, setSelectedServiceLine] = useState('Todas');
  const [selectedArea, setSelectedArea] = useState('Todas');

  const nivelNameMap = {'A':'Júnior', 'B':'Intermédio', 'C':'Sénior', 'D':'Especialista', 'E':'Líder de Conhecimento'};

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
          const response = await axios.get(`http://localhost:3000/users/configuracoes/${userLocal.ID_UTILIZADOR}`);
          if (response.data.success && response.data.data.avatar) {
              setAvatarUrl(response.data.data.avatar);
          }
      } catch (error) {
          console.error("Erro ao carregar a foto de perfil:", error);
      }
    };
    carregarFotoPerfil();

    const fetchData = async () => {
      try {
        const [badgesRes, estruturaRes] = await Promise.all([
            axios.get(`http://localhost:3000/meus-badges/consultor/${userLocal.ID_UTILIZADOR}`),
            axios.get('http://localhost:3000/estrutura')
        ]);
        if (badgesRes.data.success) {
          setMeusBadges(badgesRes.data.data);
        }
        if (estruturaRes.data.success) {
          setEstrutura(estruturaRes.data.data);
        }
      } catch (error) {
        console.error("Erro ao carregar meus badges:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const toggleNivel = (n) => {
    if (niveisSelecionados.includes(n)) {
      setNiveisSelecionados(niveisSelecionados.filter(item => item !== n));
    } else {
      setNiveisSelecionados([...niveisSelecionados, n]);
    }
  };

  const getExpiraColor = (dias) => {
    if (dias === null) return 'text-success'; // Sem validade
    if (dias < 0) return 'text-danger';
    if (dias <= 30) return 'text-danger';
    if (dias <= 100) return 'text-warning';
    return 'text-success';
  };

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    navigate('/');
  };

  // ----------------------------------------------------
  // LÓGICA DE FILTRAGEM COMBINADA
  // ----------------------------------------------------
  
  const areasDisponiveis = selectedServiceLine === 'Todas' 
      ? estrutura.areas 
      : estrutura.areas.filter(a => {
          const sl = estrutura.serviceLines.find(s => s.nome === selectedServiceLine);
          return sl && a.slId === sl.id;
        });

  const levelToLetter = (name) => {
    if (!name) return '';
    const l = String(name).toLowerCase();
    if(l.includes('júnior') || l.includes('junior') || l === '1' || l === 'a') return 'A';
    if(l.includes('intermédio') || l.includes('intermedio') || l === '2' || l === 'b') return 'B';
    if(l.includes('sénior') || l.includes('senior') || l === '3' || l === 'c') return 'C';
    if(l.includes('especialista') || l === '4' || l === 'd') return 'D';
    if(l.includes('líder') || l.includes('lider') || l === '5' || l === 'e') return 'E';
    return String(name).toUpperCase();
  };

  const todosNiveis = [];
  areasDisponiveis.forEach(a => {
      if (selectedArea === 'Todas' || a.nome === selectedArea) {
          a.niveisAtivos.forEach(n => {
              const letra = levelToLetter(n);
              if(!todosNiveis.includes(letra)) todosNiveis.push(letra);
          });
      }
  });
  todosNiveis.sort();

  const filtrados = meusBadges.filter(badge => {
    // 1. Filtro de Service Line
    if (selectedServiceLine !== 'Todas' && badge.serviceLine !== selectedServiceLine) return false;
    
    // 2. Filtro de Área
    if (selectedArea !== 'Todas' && badge.area !== selectedArea) return false;

    // 3. Filtro de Nível (GARANTIA ABSOLUTA DE FUNCIONAMENTO)
    if (niveisSelecionados.length > 0) {
        // Se a letra do badge não estiver no array de níveis selecionados, exclui!
        if (!niveisSelecionados.includes(badge.nivel)) {
            return false;
        }
    }
    
    // 4. Filtro de Pesquisa
    if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const matchTitulo = badge.titulo.toLowerCase().includes(term);
        if (!matchTitulo) return false;
    }
    
    return true;
  }).sort((a, b) => {
    if (a.serviceLine !== b.serviceLine) return (a.serviceLine || '').localeCompare(b.serviceLine || '');
    if (a.area !== b.area) return (a.area || '').localeCompare(b.area || '');
    return (a.nivel || '').localeCompare(b.nivel || '');
  });

  if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="d-flex bg-light min-vh-100">
      <SidebarConsultor />

      <div className="flex-grow-1 p-4 dashboard-scroll">
        <div className="container-fluid text-start">
          
          {/* CABEÇALHO PADRONIZADO */}
          <CabecalhoDashboard 
            titulo="Os Meus Badges conquistados"
            utilizador={utilizador}
            avatarUrl={avatarUrl}
          />

          {/* BARRA DE PESQUISA LIGADA AO ESTADO */}
          <div className="input-group mb-4 shadow-sm rounded-pill overflow-hidden bg-white border">
            <input 
              type="text" 
              className="form-control border-0 px-4 py-3 shadow-none" 
              placeholder="Pesquisar por nome de badge" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <i className="bi bi-search position-absolute end-0 top-50 translate-middle-y me-3 text-muted"></i>
          </div>

          <div className="row mb-4 align-items-end">
            <div className="col text-start pe-2">
              <label className="form-label fw-bold h6 text-secondary">Service Line</label>
              <select 
                className="form-select border-0 shadow-sm py-2"
                value={selectedServiceLine}
                onChange={(e) => {
                    setSelectedServiceLine(e.target.value);
                    setSelectedArea('Todas'); 
                }}
              >
                <option value="Todas">Todas as Service Lines</option>
                {estrutura.serviceLines.map(sl => (
                    <option key={sl.id} value={sl.nome}>{sl.nome}</option>
                ))}
              </select>
            </div>
            
            <div className="col text-start px-2">
              <label className="form-label fw-bold h6 text-secondary text-start w-100">Área Tecnológica</label>
              <select 
                className="form-select border-0 shadow-sm py-2"
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                disabled={selectedServiceLine === 'Todas'}
              >
                <option value="Todas">Todas as Áreas</option>
                {areasDisponiveis.map(a => (
                    <option key={a.id} value={a.nome}>{a.nome} {utilizador?.AREA_REGISTO === a.nome && utilizador?.SL_REGISTO === selectedServiceLine ? '(minha)' : ''}</option>
                ))}
              </select>
            </div>

            <div className="col-auto text-end ps-2">
              <Link to={`/galeria/${utilizador?.ID_UTILIZADOR}`} className="btn btn-outline-primary fw-bold shadow-sm rounded-pill px-4 py-2" style={{ minWidth: '220px' }}>
                <i className="bi bi-globe me-2"></i>Ver Galeria Global
              </Link>
            </div>
          </div>

          <div className="mb-5 d-flex gap-2 justify-content-start flex-wrap align-items-center">
             <span className="text-secondary fw-bold me-2">Níveis disponíveis:</span>
             {todosNiveis.length === 0 ? <span className="text-muted small">Selecione uma área para ver os níveis</span> : null}
             {todosNiveis.map(n => (
               <button 
                 key={n} 
                 onClick={() => toggleNivel(n)}
                 className={`btn btn-sm shadow-sm fw-bold px-4 rounded-pill ${niveisSelecionados.includes(n) ? 'btn-primary' : 'btn-white bg-white text-muted border'}`}
               >
                 Nível {n}
               </button>
             ))}
          </div>

          <h5 className="fw-bold mb-4">Badges normais conquistados ({filtrados.length})</h5>

          <div className="row g-4 pb-5">
            {filtrados.length > 0 ? filtrados.map(badge => (
              <div className="col-md-4" key={badge.id}>
                {/* CSS Inline para o Efeito Hover do Cartão */}
                <div 
                  className="card border-0 shadow-sm rounded-4 text-center h-100 position-relative overflow-hidden bg-white"
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
                  
                  <div className="d-flex justify-content-center pt-4 mb-2">
                    <a href={`/verificacao/${encodeURIComponent(badge.linkPublico)}`} target="_blank" rel="noopener noreferrer" className="rounded-circle border border-primary d-inline-flex align-items-center justify-content-center overflow-hidden bg-white shadow-sm hover-overlay position-relative" style={{width: '90px', height: '90px'}}>
                      <i className="bi bi-trophy-fill text-warning position-absolute" style={{ fontSize: '3.5rem', zIndex: 1 }}></i>
                      {badge.urlImagem && badge.urlImagem.trim() !== '' && !badge.urlImagem.includes('placeholder') && !badge.urlImagem.includes('default-trophy') && !badge.urlImagem.includes('3112946.png') && (
                          <img 
                              src={badge.urlImagem} 
                              onError={(e) => { e.target.style.display = 'none'; }}
                              alt="Badge" 
                              className="position-absolute w-100 h-100"
                              style={{objectFit: 'cover', zIndex: 2}}
                          />
                      )}
                    </a>
                  </div>

                  <div className="pb-3">
                    <small className="d-block text-muted" style={{fontSize: '13px'}}>Obtido em: <span className="fw-bold text-dark">{badge.validade}</span></small>
                    <small className={`fw-bold ${getExpiraColor(badge.diasRestantes)}`} style={{fontSize: '13px'}}>
                      {badge.diasRestantes === null ? 'Sem Validade/Expiração' : (badge.diasRestantes < 0 ? `Expirou há ${Math.abs(badge.diasRestantes)} dias` : `Expira em ${badge.diasRestantes} dias`)}
                    </small>
                  </div>

                  <div className="px-3 pb-3">
                    <h6 className="fw-bold m-0 text-dark" style={{fontSize: '16px', lineHeight: '1.2'}}>{badge.titulo}</h6>
                    <div className="text-muted mt-3 d-flex flex-column gap-1 text-center" style={{fontSize: '13px'}}>
                      <div><strong className="text-dark" style={{fontSize: '13px'}}>Service Line:</strong> <span style={{fontSize: '12px'}}>{badge.serviceLine || 'Geral'}</span></div>
                      <div><strong className="text-dark" style={{fontSize: '13px'}}>Área:</strong> <span style={{fontSize: '12px'}}>{badge.area || 'Geral'}</span></div>
                      <div><strong className="text-dark" style={{fontSize: '13px'}}>Nível:</strong> <span style={{fontSize: '12px'}}>{badge.nivel ? (nivelNameMap[badge.nivel] ? `${nivelNameMap[badge.nivel]} (Nível ${badge.nivel})` : `Nível ${badge.nivel}`) : 'N/A'}</span></div>
                    </div>
                  </div>

                  <div className="bg-light w-100 mt-auto px-0 pt-3 pb-3">
                    <div className="px-4 mb-3 d-flex justify-content-center gap-3 text-center" style={{fontSize: '12px'}}>
                      <div className="text-muted">Requisitos: <span className="text-dark fw-bold">{badge.requisitos}</span></div>
                      <div className="text-muted">Pontos: <span className="text-dark fw-bold">{badge.pontos} pts</span></div>
                    </div>
                    
                    <div className="px-4">
                      <Link to={`/meus-badges/detalhes/${badge.id}`} className="btn btn-primary w-100 rounded-pill fw-bold py-2 shadow-sm">
                        Ver Detalhes do Badge
                      </Link>
                    </div>
                  </div>

                  <div className="py-2 border-top bg-white w-100 text-center">
                    <small className="text-muted fw-bold">
                      <i className={`bi bi-circle-fill text-${badge.corStatus} me-2`} style={{fontSize: '8px'}}></i>
                      Status : {badge.status}
                    </small>
                  </div>

                </div>
              </div>
            )) : (
              <div className="col-12 text-center py-5">
                <i className="bi bi-search fs-1 text-muted opacity-50 mb-3 d-block"></i>
                <h5 className="fw-bold text-muted">Nenhum Badge correspondente!</h5>
                <p className="text-muted small">Tente ajustar a área, o nível ou limpar a pesquisa de texto.</p>
                <button className="btn btn-outline-primary rounded-pill btn-sm mt-2 px-4" onClick={() => {setSearchTerm(''); setSelectedServiceLine('Todas'); setSelectedArea('Todas'); setNiveisSelecionados([]);}}>
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

export default MeusBadgesConsultor;
