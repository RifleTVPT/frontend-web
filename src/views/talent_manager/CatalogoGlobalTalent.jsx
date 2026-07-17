import React, { useState, useEffect } from 'react';
import SidebarTalent from '../../components/SidebarTalentManager';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import CartaoBadge from '../../components/CartaoBadge';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../assets/dashboard.css';

const CatalogoGlobalTalent = () => {
  const navigate = useNavigate();
  
  const [niveisSelecionados, setNiveisSelecionados] = useState([]);
  const [estrutura, setEstrutura] = useState({ serviceLines: [], areas: [] });

  // Estados Dinâmicos
  const [badges, setBadges] = useState([]);
  const [meusBadges, setMeusBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [utilizador, setUtilizador] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('https://via.placeholder.com/40');

  // Estados dos novos Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedServiceLine, setSelectedServiceLine] = useState('Todas');
  const [selectedArea, setSelectedArea] = useState('Todas');

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
          if (response.data.success) {
              if (response.data.data.avatar) {
                  setAvatarUrl(response.data.data.avatar);
              } else {
                  const partes = userLocal.NOME_COMPLETO_UTILIZADOR?.trim().split(/\s+/) || [];
                  let iniciais = 'TM';
                  if (partes.length > 0) {
                      iniciais = partes[0][0].toUpperCase();
                      if (partes.length > 1) {
                          iniciais += partes[partes.length - 1][0].toUpperCase();
                      }
                  }
                  setAvatarUrl(`https://ui-avatars.com/api/?name=${iniciais}&background=0d6efd&color=fff`);
              }
              setUtilizador(prev => ({
                  ...prev,
                  SL_REGISTO: response.data.data.serviceLine,
                  AREA_REGISTO: response.data.data.area
              }));
          }
      } catch (error) {
          console.error("Erro ao carregar a foto de perfil:", error);
      }
    };
    carregarFotoPerfil();

    const fetchData = async () => {
      try {
        const [badgesRes, estruturaRes] = await Promise.all([
            axios.get('https://softinsa-api-riya.onrender.com/catalogo/badges'),
            axios.get('https://softinsa-api-riya.onrender.com/estrutura')
        ]);
        if (badgesRes.data.success) setBadges(badgesRes.data.data);
        if (estruturaRes.data.success) setEstrutura(estruturaRes.data.data);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }

      // Carregar badges do utilizador separadamente (erro aqui não bloqueia o catálogo)
      try {
        const meusBadgesRes = await axios.get(`https://softinsa-api-riya.onrender.com/meus-badges/consultor/${userLocal.ID_UTILIZADOR}`);
        if (meusBadgesRes.data.success) setMeusBadges(meusBadgesRes.data.data.map(b => b.id));
      } catch (error) {
        console.warn("Não foi possível carregar badges do utilizador:", error);
      }
    };

    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    navigate('/'); 
  };

  const toggleNivel = (n) => {
    if (niveisSelecionados.includes(n)) {
      setNiveisSelecionados(niveisSelecionados.filter(item => item !== n));
    } else {
      setNiveisSelecionados([...niveisSelecionados, n]);
    }
  };

  // Filtrar áreas disponíveis com base na Service Line selecionada
  const areasDisponiveis = selectedServiceLine === 'Todas' 
      ? estrutura.areas 
      : estrutura.areas.filter(a => {
          const sl = estrutura.serviceLines.find(s => s.nome === selectedServiceLine);
          return sl && a.slId === sl.id;
        });

  const levelToLetter = (name) => {
    const l = name.toLowerCase();
    if(l.includes('júnior') || l.includes('junior')) return 'A';
    if(l.includes('intermédio') || l.includes('intermedio')) return 'B';
    if(l.includes('especialista')) return 'C';
    if(l.includes('sénior') || l.includes('senior')) return 'D';
    if(l.includes('líder') || l.includes('lider')) return 'E';
    return name;
  };

  // Extrair lista dinâmica de Níveis das áreas filtradas (em letras A, B, C...)
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

  // Lógica combinada de todos os Filtros (Nível + Service Line + Área + Pesquisa)
  const badgesFiltrados = badges.filter(badge => {
    // 1. Filtro de Nível
    if (niveisSelecionados.length > 0 && !niveisSelecionados.includes(badge.nivel)) {
        return false;
    }
    
    // 2. Filtro de Service Line
    if (selectedServiceLine !== 'Todas' && badge.serviceLine !== selectedServiceLine) {
        return false;
    }

    // 2.5 Filtro de Área
    if (selectedArea !== 'Todas' && badge.area !== selectedArea) {
        return false;
    }

    // 3. Filtro de Pesquisa (Apenas Nome)
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
      <SidebarTalent />

      <div className="flex-grow-1 p-4 dashboard-scroll">
        <div className="container-fluid text-start">
          
          {/* CABEÇALHO PADRONIZADO */}
          <CabecalhoDashboard 
            titulo="Catálogo Global de Badges"
            utilizador={utilizador}
            avatarUrl={avatarUrl}
            linkHome="/talent-manager/dashboard"
          />

          {/* BARRA DE PESQUISA LIGADA AO ESTADO */}
          <div className="position-relative mb-4 mt-2">
            <input 
              type="text" 
              className="form-control py-3 ps-4 border-0 shadow-sm rounded-pill bg-white" 
              placeholder="Pesquisar por nome de Badge..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <i className="bi bi-search position-absolute end-0 top-50 translate-middle-y me-4 text-muted fs-5"></i>
          </div>

          {/* Seção de Filtros */}
          <div className="row mb-4 g-3 align-items-end">
            {/* DROPDOWN SERVICE LINE LIGADO AO ESTADO */}
            <div className="col-md-6">
              <label className="form-label fw-bold h5 titulo-seccao">Filtrar por Service Line</label>
              <select 
                className="form-select border-0 shadow-sm py-2"
                value={selectedServiceLine}
                onChange={(e) => {
                  setSelectedServiceLine(e.target.value);
                  setSelectedArea('Todas');
                  setNiveisSelecionados([]);
                }}
              >
                <option value="Todas">Todas as Service Lines</option>
                {estrutura.serviceLines.map(sl => (
                    <option key={sl.id} value={sl.nome}>
                      {sl.nome} {utilizador && utilizador.SL_REGISTO === sl.nome ? '(minha)' : ''}
                    </option>
                ))}
              </select>
            </div>
            
            {/* DROPDOWN ÁREA LIGADO AO ESTADO */}
            <div className="col-md-6">
              <label className="form-label fw-bold h5 titulo-seccao">Filtrar por Área</label>
              <select 
                className="form-select border-0 shadow-sm py-2"
                value={selectedArea}
                onChange={(e) => {
                  setSelectedArea(e.target.value);
                  setNiveisSelecionados([]);
                }}
              >
                <option value="Todas">Todas as Áreas</option>
                {areasDisponiveis.map(a => (
                    <option key={a.id} value={a.nome}>
                      {a.nome} {utilizador && utilizador.AREA_REGISTO === a.nome ? '(minha)' : ''}
                    </option>
                ))}
              </select>
            </div>
          </div>

          <div className="row mb-5">
            <div className="col-12">
              <label className="form-label d-block fw-bold h5 text-start titulo-seccao">Nível de Competência</label>
              <div className="d-flex gap-2 justify-content-start flex-wrap mt-2">
                {todosNiveis.length === 0 && <span className="text-muted small py-2">Sem níveis configurados para as seleções.</span>}
                {todosNiveis.map(n => {
                  const nivelNameMap = {'A':'Júnior', 'B':'Intermédio', 'C':'Sénior', 'D':'Especialista', 'E':'Líder de Conhecimento'};
                  const nomeExibicao = nivelNameMap[n] ? `Nível ${nivelNameMap[n]} (${n})` : `Nível (${n})`;
                  return (
                    <button 
                      key={n} onClick={() => toggleNivel(n)}
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

          <h5 className="fw-bold mb-4">Badges Disponíveis ({badgesFiltrados.length})</h5>

          <div className="row g-4">
            {badgesFiltrados.length > 0 ? (
              badgesFiltrados.map(badge => (
                <div className="col-xxl-3 col-xl-4 col-lg-4 col-md-6" key={badge.id}>
                  <CartaoBadge 
                    badge={badge}
                    acoesRodape={
                      <div className="d-flex flex-column gap-2">
                        <Link to={`/talent/badge-detalhes/${badge.id}`} className="btn btn-primary btn-sm rounded-pill fw-bold w-100 shadow-sm py-2">
                          Ver Detalhes
                        </Link>
                      </div>
                    }
                  />
                </div>
              ))
            ) : (
              <div className="col-12 text-center py-5">
                <i className="bi bi-search fs-1 text-muted opacity-50 mb-3 d-block"></i>
                <h5 className="fw-bold text-muted">Nenhum Badge encontrado!</h5>
                <p className="text-muted small">Altere os filtros acima para descobrir outros Badges.</p>
                <button className="btn btn-outline-primary rounded-pill btn-sm mt-2 px-4" onClick={() => {setSearchTerm(''); setSelectedServiceLine('Todas'); setNiveisSelecionados(todosNiveis.length > 0 ? [todosNiveis[0]] : []);}}>
                    Limpar Filtros
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CatalogoGlobalTalent;
