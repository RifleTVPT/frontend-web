import React, { useState, useEffect } from 'react';
import SidebarSLL from '../../components/SidebarSLL';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import CartaoBadge from '../../components/CartaoBadge';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { obterServiceLineSLL } from '../../utils/sllServiceLine';
import '../../assets/dashboard.css';

const CatalogoBadgesSLL = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    // Estados do Utilizador
    const [utilizador, setUtilizador] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState('https://via.placeholder.com/40');
    const [minhaSL, setMinhaSL] = useState(''); // Atualizado dinamicamente

    // Estados da API
    const [badgesBD, setBadgesBD] = useState([]);
    const [todasAreas, setTodasAreas] = useState([]);

    // Estados para os Filtros
    const [areaSelecionada, setAreaSelecionada] = useState('Todas');
    const [niveisAtivos, setNiveisAtivos] = useState([]); 
    const [estrutura, setEstrutura] = useState({ serviceLines: [], areas: [] });

    useEffect(() => {
        const userLocal = JSON.parse(sessionStorage.getItem('user'));
        if (!userLocal) {
            navigate('/');
            return;
        }
        setUtilizador(userLocal);
        
        // Define a Service Line do Líder (Se não existir, usa a predefinição para testes)
        let slAtual = userLocal.SL_REGISTO || userLocal.SERVICE_LINE || '';
        setMinhaSL(slAtual);

        const carregarFotoPerfil = async () => {
            try {
                const response = await axios.get(`https://softinsa-api-riya.onrender.com/users/configuracoes/${userLocal.ID_UTILIZADOR}`);
                if (response.data.success && response.data.data.avatar) {
                    setAvatarUrl(response.data.data.avatar);
                }
            } catch (error) {
                console.error("Erro foto:", error);
            }
        };

        // Usa a rota global, mas filtra no frontend para garantir isolamento
        const carregarDados = async () => {
            try {
                slAtual = await obterServiceLineSLL(userLocal);
                setMinhaSL(slAtual);
                let areasDosBadges = [];
                const [badgesRes, estruturaRes] = await Promise.all([
                    axios.get('https://softinsa-api-riya.onrender.com/catalogo/badges'),
                    axios.get('https://softinsa-api-riya.onrender.com/estrutura')
                ]);
                
                if (badgesRes.data.success) {
                    const todosBadges = badgesRes.data.data;
                    const meusBadgesSL = todosBadges.filter(b => b.serviceLine === slAtual);
                    setBadgesBD(meusBadgesSL);
                    areasDosBadges = [...new Set(meusBadgesSL.map(b => b.area))];
                }
                
                if (estruturaRes.data.success) {
                    setEstrutura(estruturaRes.data.data);
                    const est = estruturaRes.data.data;
                    const slId = est.serviceLines.find(s => s.nome === slAtual)?.id;
                    if (slId) {
                        const areasSLL = est.areas.filter(a => a.slId === slId).map(a => a.nome);
                        setTodasAreas([...new Set([...areasSLL, ...areasDosBadges])]);
                    } else {
                        setTodasAreas(areasDosBadges);
                    }
                    
                    // Extrair níveis ativos para a SL do líder
                    const slIdEstrutura = estruturaRes.data.data.serviceLines.find(sl => sl.nome === slAtual)?.id;
                    const areasSLL = estruturaRes.data.data.areas.filter(a => a.slId === slIdEstrutura);
                    const niveisParaAtivar = [];
                    areasSLL.forEach(a => {
                        a.niveisAtivos.forEach(n => {
                            if(!niveisParaAtivar.includes(n)) niveisParaAtivar.push(n);
                        });
                    });
                    setNiveisAtivos(niveisParaAtivar);
                }
            } catch (error) {
                console.error("Erro ao carregar catálogo:", error);
            } finally {
                setLoading(false);
            }
        };

        carregarFotoPerfil();
        carregarDados();
    }, [navigate]);

    const handleLogout = () => {
        sessionStorage.removeItem('user');
        navigate('/');
    };

    // Lógica de toggle para os botões de Nível
    const toggleNivel = (nivel) => {
        if (niveisAtivos.includes(nivel)) {
            setNiveisAtivos(niveisAtivos.filter(n => n !== nivel));
        } else {
            setNiveisAtivos([...niveisAtivos, nivel]);
        }
    };

    const obterLetraNivel = (nivelStr) => {
        if (!nivelStr) return '';
        const n = nivelStr.toLowerCase();
        if (n.includes('1') || n.includes('júnior') || n.includes('junior') || n === 'a' || n.includes(' a ') || n.startsWith('a -')) return 'A';
        if (n.includes('2') || n.includes('intermédio') || n.includes('intermedio') || n.includes('pleno') || n === 'b' || n.includes(' b ') || n.startsWith('b -')) return 'B';
        if (n.includes('3') || n.includes('sénior') || n.includes('senior') || n === 'c' || n.includes(' c ') || n.startsWith('c -')) return 'C';
        if (n.includes('4') || n.includes('especialista') || n.includes('master') || n === 'd' || n.includes(' d ') || n.startsWith('d -')) return 'D';
        if (n.includes('5') || n.includes('líder') || n.includes('lider') || n === 'e' || n.includes(' e ') || n.startsWith('e -')) return 'E';
        return '';
    };

    const formatNivel = (n) => {
        const letra = obterLetraNivel(n);
        const nomes = { A: 'Júnior', B: 'Intermédio', C: 'Sénior', D: 'Especialista', E: 'Líder de Conhecimento' };
        return letra ? `${letra} - ${nomes[letra]}` : n;
    };

    const todosNiveis = [];
    estrutura.areas.forEach(a => {
        if(a.slId === estrutura.serviceLines.find(sl => sl.nome === minhaSL)?.id) {
            a.niveisAtivos.forEach(n => {
                if(!todosNiveis.includes(n)) todosNiveis.push(n);
            });
        }
    });
    // Sort array natively using formatNivel so A - Junior is before B - Pleno
    todosNiveis.sort((a, b) => formatNivel(a).localeCompare(formatNivel(b)));

    const ordemNivel = (nivelStr) => {
        const letra = obterLetraNivel(nivelStr);
        if (!letra) return 999;
        return letra.charCodeAt(0) - 64;
    };

    // --- LÓGICA DE FILTRAGEM ---
    const badgesFiltrados = badgesBD.filter(badge => {
        const matchesArea = areaSelecionada === 'Todas' || badge.area === areaSelecionada;
        const matchesNivel = niveisAtivos.some(nivel => obterLetraNivel(nivel) === obterLetraNivel(badge.nivel));
        return matchesArea && matchesNivel;
    }).sort((a, b) => ordemNivel(a.nivel) - ordemNivel(b.nivel) || String(a.titulo || a.nome || '').localeCompare(String(b.titulo || b.nome || '')));

    // Título Dinâmico conforme Figma
    const getTitulo = () => {
        const prefixo = areaSelecionada === 'Todas' ? "todas as Áreas" : areaSelecionada;
        const niveisFormatados = niveisAtivos.map(formatNivel);
        niveisFormatados.sort();
        const sufixo = niveisFormatados.length > 0 ? ` - Níveis ${niveisFormatados.join(', ')}` : "";
        return `Badges Disponíveis para ${prefixo}${sufixo}`;
    };

    if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="d-flex bg-light min-vh-100">
            <SidebarSLL />
            
            <div className="flex-grow-1 p-4 dashboard-scroll">
                <div className="container-fluid px-md-4 text-start">
                    
                    {/* Header Atualizado (Igual ao do Talent Manager, sem a casa) */}
                    <CabecalhoDashboard 
                        titulo={`Catálogo de Badges - ${minhaSL} Service Line`}
                        utilizador={utilizador}
                        avatarUrl={avatarUrl}
                        linkHome="/sll/dashboard"
                    />

                    {/* SEÇÃO DE FILTROS */}
                    <div className="row g-4 mb-4 align-items-end">
                        {/* Filtro de Área: Dropdown (Select) dinâmico da BD */}
                        <div className="col-md-6">
                            <label className="form-label fw-bold text-dark h5">Área de Competência</label>
                            <select 
                                className="form-select border-0 shadow-sm py-2 rounded-3"
                                value={areaSelecionada}
                                onChange={(e) => setAreaSelecionada(e.target.value)}
                            >
                                <option value="Todas">Todas as Áreas</option>
                                {todasAreas.map(area => (
                                    <option key={area} value={area}>{area}</option>
                                ))}
                            </select>
                        </div>

                        {/* Filtro de Nível: Botões (Seleção Múltipla) */}
                        <div className="col-md-6">
                            <label className="form-label fw-bold text-dark h5 ms-2">Nível de Competência</label>
                            <div className="sll-niveis-filter d-flex gap-2 ms-2">
                                {todosNiveis.length === 0 && <span className="text-muted small py-2">Sem níveis configurados na sua Service Line</span>}
                                {todosNiveis.map(n => (
                                    <button 
                                        key={n} 
                                        onClick={() => toggleNivel(n)}
                                        className={`sll-nivel-btn btn btn-sm shadow-sm fw-bold px-3 py-2 rounded-3 border-0 transition-all ${
                                            niveisAtivos.includes(n) ? 'btn-primary' : 'bg-white text-muted'
                                        }`}
                                        style={{ fontSize: '0.8rem' }}
                                    >
                                        {formatNivel(n)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Título Dinâmico Atualizado */}
                    <h4 className="text-primary fw-medium mb-5" style={{ opacity: 0.8 }}>
                        {getTitulo()}
                    </h4>

                    {/* GRELHA DE BADGES FILTRADA (Dados da API) */}
                    <div className="row g-4 pb-5">
                        {badgesFiltrados.length > 0 ? (
                            badgesFiltrados.map(badge => (
                                <div className="col-xxl-3 col-xl-4 col-lg-4 col-md-6 col-sm-6" key={badge.id}>
                                    <CartaoBadge 
                                        badge={badge}
                                        acoesRodape={
                                            <button 
                                                onClick={() => navigate(`/sll/badges/detalhes/${badge.id}`)}
                                                className="btn btn-primary btn-sm rounded-pill w-100 fw-bold mt-auto shadow-sm py-2"
                                            >
                                                Ver Detalhes
                                            </button>
                                        }
                                    />
                                </div>
                            ))
                        ) : (
                            <div className="col-12 text-center py-5">
                                <i className="bi bi-search text-muted display-4 d-block mb-3 opacity-25"></i>
                                <p className="text-muted fs-5">Nenhum badge corresponde aos filtros selecionados para o nível indicado.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CatalogoBadgesSLL;
