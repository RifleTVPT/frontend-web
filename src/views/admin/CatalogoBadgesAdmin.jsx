import React, { useState, useEffect } from 'react';
import SidebarAdmin from '../../components/SidebarAdmin';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import CartaoBadge from '../../components/CartaoBadge';
import CriarBadgeAdmin from './CriarBadgeAdmin';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../assets/dashboard.css';


const CatalogoBadgesAdmin = () => {
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [badgeParaEditar, setBadgeParaEditar] = useState(null);
    
    const [adminUser, setAdminUser] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState('https://via.placeholder.com/40');
    const [loading, setLoading] = useState(true);

    const [badgesData, setBadgesData] = useState([]);
    const [estrutura, setEstrutura] = useState({ serviceLines: [], areas: [] });

    // ESTADOS DOS FILTROS
    const [pesquisa, setPesquisa] = useState('');
    const [filtroSL, setFiltroSL] = useState('Todas as Service Line');
    const [filtroArea, setFiltroArea] = useState('Todas');
    const [niveisSelecionados, setNiveisSelecionados] = useState([]); 

    useEffect(() => {
        const userLocal = JSON.parse(sessionStorage.getItem('user'));
        if (!userLocal) { navigate('/'); return; }
        
        setAdminUser(userLocal);

        const fetchData = async () => {
            try {
                const [resAdmin, resBadges, resEstrutura] = await Promise.all([
                    axios.get(`https://softinsa-api-riya.onrender.com/users/configuracoes/${userLocal.ID_UTILIZADOR}`),
                    axios.get('https://softinsa-api-riya.onrender.com/catalogo/badges'),
                    axios.get('https://softinsa-api-riya.onrender.com/estrutura')
                ]);
                
                if (resAdmin.data.success && resAdmin.data.data.avatar) {
                    setAvatarUrl(resAdmin.data.data.avatar);
                }
                
                if (resBadges.data.success) {
                    setBadgesData(resBadges.data.data);
                }
                
                if (resEstrutura.data.success) {
                    setEstrutura(resEstrutura.data.data);
                }
            } catch (error) {
                console.error("Erro ao carregar dados do catálogo:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [navigate]);

    const handleLogout = () => {
        sessionStorage.removeItem('user');
        navigate('/');
    };

    const toggleNivel = (nivel) => {
        setNiveisSelecionados(prev => 
            prev.includes(nivel) ? prev.filter(n => n !== nivel) : [...prev, nivel]
        );
    };

    const fetchDados = async () => {
        try {
            const resBadges = await axios.get('https://softinsa-api-riya.onrender.com/catalogo/badges');
            if (resBadges.data.success) {
                setBadgesData(resBadges.data.data);
            }
        } catch(e) {
            console.error("Erro a carregar badges", e);
        }
    };

    const apagarBadge = async (id) => {
        if (!window.confirm("Tem a certeza que deseja eliminar este badge permanentemente?")) return;
        try {
            const res = await axios.delete(`https://softinsa-api-riya.onrender.com/catalogo/admin/badge/${id}`);
            if (res.data.success) {
                alert('Badge eliminado com sucesso!');
                fetchDados();
            }
        } catch(e) {
            alert('Erro ao eliminar badge');
            console.error(e);
        }
    };

    const abrirEdicao = async (id) => {
        try {
            const res = await axios.get(`https://softinsa-api-riya.onrender.com/catalogo/badges/${id}`);
            if(res.data.success) {
                const b = res.data.data;
                setBadgeParaEditar({
                    id: b.id,
                    nome: b.titulo,
                    desc: b.descricao,
                    hasValidade: b.hasValidade,
                    validadeExpiracao: b.validadeExpiracao,
                    pontos: b.pontos,
                    urlImagem: b.urlImagem || b.URL_IMAGEM,
                    requisitos: b.requisitos,
                    serviceLine: b.serviceLine,
                    area: b.area,
                    nivel: b.nivel?.replace('Nível ', '') || 'A'
                });
                setShowModal(true);
            }
        } catch(e) {
            console.error(e);
        }
    };

    // --- LÓGICA DINÂMICA DE FILTROS ---
    const areasDisponiveis = filtroSL === 'Todas as Service Line' ? (estrutura.areas || []) : (estrutura.areas || []).filter(a => {
        const slObj = (estrutura.serviceLines || []).find(s => s.nome === filtroSL);
        return slObj && a.slId === slObj.id;
    });

    const todosNiveis = [];
    areasDisponiveis.forEach(a => {
        if (filtroArea !== 'Todas' && a.nome !== filtroArea) return;
        if (a.niveisAtivos) {
            a.niveisAtivos.forEach((n, idx) => {
                const letra = String.fromCharCode(65 + idx);
                if (!todosNiveis.some(tn => tn.letra === letra)) {
                    todosNiveis.push({ nome: n, letra });
                }
            });
        }
    });
    todosNiveis.sort((a, b) => a.letra.localeCompare(b.letra, 'pt'));

    const badgesFiltrados = badgesData.filter(badge => {
        const matchPesquisa = (badge.serviceLine && badge.serviceLine.toLowerCase().includes(pesquisa.toLowerCase())) || 
                              (badge.area && badge.area.toLowerCase().includes(pesquisa.toLowerCase())) ||
                              (badge.titulo && badge.titulo.toLowerCase().includes(pesquisa.toLowerCase()));
        const matchSL = filtroSL === 'Todas as Service Line' || badge.serviceLine === filtroSL;
        const matchArea = filtroArea === 'Todas' || badge.area === filtroArea;
        const matchNivel = niveisSelecionados.length === 0 || niveisSelecionados.includes(badge.nivel);
        return matchPesquisa && matchSL && matchArea && matchNivel;
    }).sort((a, b) => {
        if (a.serviceLine !== b.serviceLine) return (a.serviceLine || '').localeCompare(b.serviceLine || '');
        if (a.area !== b.area) return (a.area || '').localeCompare(b.area || '');
        return (a.nivel || '').localeCompare(b.nivel || '');
    });

    if (loading) {
        return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;
    }

    return (
        <div className="d-flex bg-light min-vh-100">
            <SidebarAdmin />
            <div className="flex-grow-1 p-4 dashboard-scroll text-start">
                <div className="container-fluid px-md-4">
                    
                    <CabecalhoDashboard 
                        titulo="Catálogo Global de Badges"
                        utilizador={adminUser}
                        avatarUrl={avatarUrl}
                        linkHome="/admin/dashboard"
                    />

                    <div className="row g-5 mb-5 align-items-center">
                        <div className="col-md-8 pe-5">
                            <div className="position-relative shadow-sm">
                                <input 
                                    type="text" 
                                    className="admin-search-input form-control border-0 py-3 ps-4 rounded-3" 
                                    placeholder="Pesquisar por Nome / Service Line / Área" 
                                    value={pesquisa}
                                    onChange={(e) => setPesquisa(e.target.value)}
                                />
                                <i className="bi bi-search position-absolute end-0 top-50 translate-middle-y me-4 text-muted fs-5"></i>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <button onClick={() => setShowModal(true)} className="btn btn-primary w-100 py-3 fw-bold shadow" style={{ backgroundColor: '#5D78FF', border: 'none', borderRadius: '10px' }}>
                                + Criar Novo Badge
                            </button>
                        </div>
                    </div>

                    <div className="row g-4 mb-4">
                        <div className="col-md-6 text-start">
                            <label className="form-label fw-bold h5 text-dark">Filtrar por Service Line</label>
                            <select 
                                className="form-select border-0 shadow-sm py-3 px-4 rounded-3 text-muted" 
                                value={filtroSL}
                                onChange={(e) => {
                                    setFiltroSL(e.target.value);
                                    setFiltroArea('Todas');
                                    setNiveisSelecionados([]);
                                }}
                            >
                                <option>Todas as Service Line</option>
                                {estrutura?.serviceLines?.map(sl => (
                                    <option key={sl.id} value={sl.nome}>{sl.nome}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-6 text-start">
                            <label className="form-label fw-bold h5 text-dark">Filtrar por Área</label>
                            <select 
                                className="form-select border-0 shadow-sm py-3 px-4 rounded-3 text-muted" 
                                value={filtroArea}
                                onChange={(e) => {
                                    setFiltroArea(e.target.value);
                                    setNiveisSelecionados([]);
                                }}
                            >
                                <option value="Todas">Todas as Áreas</option>
                                {areasDisponiveis.map(a => (
                                    <option key={a.id} value={a.nome}>{a.nome}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="row mb-5">
                        <div className="col-12 text-start">
                            <label className="form-label fw-bold h5 text-dark d-block">Nível de Competência</label>
                            <div className="d-flex gap-2 justify-content-start flex-wrap mt-2">
                                {todosNiveis.length === 0 && <span className="text-muted small py-2">Sem níveis configurados para as seleções.</span>}
                                {todosNiveis.map(n => {
                                    const nomeExibicao = `Nível ${n.nome} (${n.letra})`;
                                    return (
                                        <button 
                                            key={n.letra}
                                            onClick={() => toggleNivel(n.letra)}
                                            className={`btn shadow-sm fw-bold px-4 py-2 rounded-pill ${niveisSelecionados.includes(n.letra) ? 'btn-primary' : 'btn-white bg-white text-muted border-0'}`}
                                            style={{fontSize: '14px'}}
                                        >
                                            {nomeExibicao}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="row g-5 pb-5">
                        {badgesFiltrados.length > 0 ? badgesFiltrados.map(b => (
                            <div className="col-xxl-3 col-xl-4 col-lg-4 col-md-6" key={b.id}>
                                <CartaoBadge 
                                    badge={b}
                                    cabecalhoPersonalizado={
                                        <div className="d-flex align-items-center gap-2 bg-light rounded-pill px-2 py-1 border shadow-sm">
                                            <div className={`rounded-circle ${b.status !== 'Inativo' ? 'bg-success' : 'bg-danger'}`} style={{ width: '8px', height: '8px' }}></div>
                                            <span className="small text-muted fw-bold" style={{fontSize: '10px'}}>{b.status || 'Ativo'}</span>
                                        </div>
                                    }
                                    acoesRodape={
                                        <div className="d-flex flex-column gap-2 mt-2">
                                            <button 
                                                onClick={() => navigate(`/admin/badges/detalhes/${b.id}`)} 
                                                className="btn btn-primary w-100 rounded-pill fw-bold shadow-sm"
                                            >
                                                Ver Detalhes
                                            </button>
                                            <div className="d-flex justify-content-center gap-4 mt-2">
                                                <i className="bi bi-pencil-square text-muted cursor-pointer fs-5 hover-primary" title="Editar Badge" onClick={() => abrirEdicao(b.id)}></i>
                                                <i className="bi bi-trash3 text-muted cursor-pointer fs-5 hover-danger" title="Eliminar Badge" onClick={() => apagarBadge(b.id)}></i>
                                            </div>
                                        </div>
                                    }
                                />
                            </div>
                        )) : (
                            <div className="col-12 text-center py-5 text-muted fs-4 italic">
                                Nenhum badge corresponde aos filtros selecionados.
                            </div>
                        )}
                    </div>

                    <div className="text-center mt-4 text-muted fw-bold small">
                        Total de Badges Exibidos : {badgesFiltrados.length}
                    </div>
                </div>
            </div>
            {showModal && <CriarBadgeAdmin onClose={() => { setShowModal(false); setBadgeParaEditar(null); }} onSuccess={fetchDados} estrutura={estrutura} initialData={badgeParaEditar} />}
        </div>
    );
};

export default CatalogoBadgesAdmin;
