import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarAdmin from '../../components/SidebarAdmin';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import CriarConquistaAdmin from './CriarConquistaAdmin';
import axios from 'axios';
import '../../assets/dashboard.css';

const TIPO_LABELS = {
    'TOTAL_BADGES':  { label: 'Conquista Total de Badges',  counterLabel: 'Conquista Total de Badges',  icon: 'bi-stack' },
    'TOTAL_PONTOS':  { label: 'Total de Pontos',            counterLabel: 'Total de Pontos',            icon: 'bi-gem' },
    'BADGES_DIAS':   { label: 'Badges em Período',          counterLabel: 'Badges em Período',          icon: 'bi-lightning-fill' },
    'MELHOR_ANO':    { label: 'Melhor do Ano',              counterLabel: 'Melhor do Ano',              icon: 'bi-star-fill' },
    'MELHOR_MESES':  { label: 'Melhor por Meses',           counterLabel: 'Melhor por Meses',           icon: 'bi-fire' },
};

// Raridade baseada nos pontos bónus
const getRaridade = (bonus) => {
    if (bonus >= 1000) return 'Lendário';
    if (bonus >= 500)  return 'Épico';
    return 'Raro';
};

const CatalogoConquistasAdmin = () => {
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);

    const [adminUser, setAdminUser] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState('https://via.placeholder.com/40');
    const [loading, setLoading] = useState(true);

    const [conquistas, setConquistas] = useState([]);
    const [pesquisa, setPesquisa] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('Todos');

    useEffect(() => {
        const userLocal = JSON.parse(sessionStorage.getItem('user'));
        if (!userLocal) { navigate('/'); return; }
        setAdminUser(userLocal);

        const fetchData = async () => {
            try {
                const [resAdmin, resConq] = await Promise.all([
                    axios.get(`http://localhost:3000/users/configuracoes/${userLocal.ID_UTILIZADOR}`),
                    axios.get('http://localhost:3000/admin-conquistas/lista')
                ]);
                if (resAdmin.data.success && resAdmin.data.data.avatar) setAvatarUrl(resAdmin.data.data.avatar);
                if (resConq.data.success) setConquistas(resConq.data.data);
            } catch (error) {
                console.error('Erro ao carregar conquistas:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [navigate]);

    const fetchDados = async () => {
        try {
            const res = await axios.get('http://localhost:3000/admin-conquistas/lista');
            if (res.data.success) setConquistas(res.data.data);
        } catch (e) {
            console.error('Erro a carregar conquistas', e);
        }
    };

    const apagarConquista = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm('Tem a certeza que deseja eliminar esta conquista permanentemente? Isto irá remover o marco a todos os consultores que já o tenham ganhado.')) return;
        try {
            const res = await axios.delete(`http://localhost:3000/admin-conquistas/${id}`);
            if (res.data.success) {
                alert('Conquista eliminada com sucesso!');
                fetchDados();
            }
        } catch (e) {
            alert('Erro ao apagar conquista: ' + e.message);
        }
    };

    const conquistasFiltradas = conquistas
        .filter(c => (c.titulo || '').toLowerCase().includes(pesquisa.toLowerCase()))
        .filter(c => {
            if (filtroTipo === 'Todos') return true;
            const tipo = c.tipo || 'TOTAL_PONTOS';
            return tipo === filtroTipo;
        });

    if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="d-flex bg-light min-vh-100">
            <SidebarAdmin />

            <div className="flex-grow-1 p-4 dashboard-scroll">
                <div className="container-fluid text-start">

                    <CabecalhoDashboard
                        titulo="Catálogo de Conquistas Especiais"
                        utilizador={adminUser}
                        avatarUrl={avatarUrl}
                    />

                    <div className="card border-0 shadow-sm rounded-4 bg-white p-4 p-md-5 mb-5">

                        {/* Barra de filtros + botão criar */}
                        <div className="row g-3 align-items-stretch mb-4">
                            {/* Pesquisa */}
                            <div className="col-lg-5">
                                <div className="position-relative h-100">
                                    <input
                                        type="text"
                                        className="form-control py-3 ps-4 h-100 rounded-3 border bg-light shadow-none"
                                        placeholder="Pesquisar conquistas..."
                                        value={pesquisa}
                                        onChange={e => setPesquisa(e.target.value)}
                                    />
                                    <i className="bi bi-search position-absolute end-0 top-50 translate-middle-y me-3 text-muted"></i>
                                </div>
                            </div>

                            {/* Filtro tipo */}
                            <div className="col-lg-4">
                                <select
                                    className="form-select py-3 h-100 rounded-3 border bg-light fw-bold"
                                    value={filtroTipo}
                                    onChange={e => setFiltroTipo(e.target.value)}
                                >
                                    <option value="Todos">Todos os Tipos</option>
                                    {Object.entries(TIPO_LABELS).map(([k, v]) => (
                                        <option key={k} value={k}>{v.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Botão Criar — mesmo height que o select */}
                            <div className="col-lg-3">
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="btn fw-bold w-100 h-100 rounded-3 d-flex align-items-center justify-content-center gap-2"
                                    style={{ background: 'linear-gradient(135deg, #5D78FF, #7B5EFF)', border: 'none', color: '#fff', fontSize: '15px', minHeight: '52px' }}
                                >
                                    <i className="bi bi-plus-circle-fill fs-5"></i> + Criar Conquista
                                </button>
                            </div>
                        </div>

                        {/* Contadores */}
                        <div className="row g-3 mb-5">
                            {/* Total geral */}
                            <div className="col-6 col-md-2">
                                <div className="p-3 rounded-3 text-center h-100" style={{ background: 'linear-gradient(135deg, #F9F1DC, #FFF8E7)', border: '2px solid #D4AF37' }}>
                                    <h3 className="fw-bold mb-0" style={{ color: '#7B5E10' }}>{conquistas.length}</h3>
                                    <p className="text-muted small mb-0 fw-bold" style={{ fontSize: '11px' }}>Total</p>
                                </div>
                            </div>

                            {/* Um contador por tipo */}
                            {Object.entries(TIPO_LABELS).map(([k, v]) => {
                                // Mapear legado null para TOTAL_PONTOS na contagem
                                const count = conquistas.filter(c => (c.tipo || 'TOTAL_PONTOS') === k).length;
                                return (
                                    <div key={k} className="col-6 col-md-2">
                                        <div
                                            className="p-3 rounded-3 text-center h-100 bg-white border shadow-sm"
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => setFiltroTipo(filtroTipo === k ? 'Todos' : k)}
                                        >
                                            <h3 className="fw-bold mb-0" style={{ color: '#D4AF37' }}>
                                                {count}
                                            </h3>
                                            <p className="text-muted mb-0 fw-bold" style={{ fontSize: '10px', lineHeight: '1.3' }}>
                                                <i className={`bi ${v.icon} me-1`} style={{ color: '#D4AF37' }}></i>
                                                {v.counterLabel}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Cards */}
                        <div className="row g-4">
                            {conquistasFiltradas.length > 0 ? conquistasFiltradas.map(conq => {
                                const tipoKey = conq.tipo || 'TOTAL_PONTOS';
                                const tipoInfo = TIPO_LABELS[tipoKey] || { label: 'Especial', icon: 'bi-star-fill' };
                                const raridade = getRaridade(conq.bonus || 0);
                                const isImageUrl = conq.imagem && conq.imagem.startsWith('http');

                                return (
                                    <div className="col-md-6 col-xl-4" key={conq.id}>
                                        <div
                                            onClick={() => navigate(`/admin/badges/conquistas/${conq.id}`)}
                                            className="card h-100 rounded-4 p-4 text-center position-relative"
                                            style={{
                                                cursor: 'pointer',
                                                backgroundColor: '#FFFDF5',
                                                border: `2px solid #D4AF37`,
                                                borderTop: `4px solid #D4AF37`,
                                                boxShadow: '0 4px 12px rgba(212,175,55,0.1)',
                                                transition: 'transform 0.2s, box-shadow 0.2s'
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(212,175,55,0.25)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(212,175,55,0.1)'; }}
                                        >
                                            {/* Botão eliminar */}
                                            <button
                                                onClick={e => apagarConquista(e, conq.id)}
                                                className="btn btn-white text-danger position-absolute top-0 end-0 m-3 shadow-sm border rounded-circle d-flex align-items-center justify-content-center p-0"
                                                style={{ width: '32px', height: '32px', zIndex: 2, backgroundColor: '#fff' }}
                                            >
                                                <i className="bi bi-trash-fill" style={{ fontSize: '13px' }}></i>
                                            </button>

                                            {/* Imagem / Icon */}
                                            <div className="d-flex justify-content-center mb-3 mt-4">
                                                {isImageUrl ? (
                                                    <img
                                                        src={conq.imagem}
                                                        alt={conq.titulo}
                                                        className="rounded-circle shadow"
                                                        style={{ width: '90px', height: '90px', objectFit: 'cover', border: `4px solid #D4AF37` }}
                                                        onError={e => e.target.style.display = 'none'}
                                                    />
                                                ) : (
                                                    <div
                                                        className="rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                                                        style={{ width: '90px', height: '90px', background: `linear-gradient(135deg, #F9F1DC, white)`, border: `4px solid #D4AF37` }}
                                                    >
                                                        <i className={`bi ${tipoKey.includes('MELHOR') ? 'bi-star-fill' : 'bi-trophy-fill'}`} style={{ fontSize: '2.5rem', color: '#D4AF37' }}></i>
                                                    </div>
                                                )}
                                            </div>

                                            <h5 className="fw-bold mb-1 text-dark">{conq.titulo}</h5>

                                            {/* Raridade (abaixo do título) */}
                                            <div className="mb-2">
                                                <span className="badge rounded-pill px-3 py-1" style={{ backgroundColor: '#F9F1DC', color: '#D4AF37', fontSize: '11px', border: `1px solid #D4AF3750` }}>
                                                    ✦ {raridade}
                                                </span>
                                            </div>

                                            {conq.desc && (
                                                <p className="text-muted small px-2 mb-2" style={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                                    {conq.desc}
                                                </p>
                                            )}

                                            <div className="mt-2 mb-3">
                                                <span className="badge px-3 py-2 rounded-pill fw-bold" style={{ backgroundColor: '#D4AF37', color: '#fff', fontSize: '13px' }}>
                                                    +{conq.bonus} Pontos
                                                </span>
                                            </div>

                                            <small className="d-block text-secondary border-top pt-3 mt-auto" style={{ fontSize: '11px', borderColor: '#D4AF3740 !important' }}>
                                                <i className="bi bi-eye me-1"></i>Clique para ver detalhes
                                            </small>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="col-12 text-center py-5">
                                    <i className="bi bi-inbox text-muted" style={{ fontSize: '4rem' }}></i>
                                    <p className="text-muted mt-3 fw-medium">Nenhuma conquista especial encontrada.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <CriarConquistaAdmin
                show={showModal}
                onClose={() => setShowModal(false)}
                onCreated={fetchDados}
            />
        </div>
    );
};

export default CatalogoConquistasAdmin;
