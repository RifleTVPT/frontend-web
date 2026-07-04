import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import SidebarAdmin from '../../components/SidebarAdmin';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import '../../assets/dashboard.css';

const TIPO_LABELS = {
    'TOTAL_BADGES': 'Conquista Total de Badges',
    'TOTAL_PONTOS': 'Total de Pontos',
    'BADGES_DIAS':  'Badges em Período',
    'MELHOR_ANO':   'Melhor do Ano',
    'MELHOR_MESES': 'Melhor por Meses',
};

const DetalhesConquistaEspecialAdmin = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [conquista, setConquista] = useState(null);
    const [adminUser, setAdminUser] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState('https://via.placeholder.com/40');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userLocal = JSON.parse(sessionStorage.getItem('user'));
        if (!userLocal) { navigate('/'); return; }
        setAdminUser(userLocal);

        const fetchData = async () => {
            try {
                const [resAdmin, resConq] = await Promise.all([
                    axios.get(`https://softinsa-api-riya.onrender.com/users/configuracoes/${userLocal.ID_UTILIZADOR}`),
                    axios.get(`https://softinsa-api-riya.onrender.com/admin-conquistas/detalhes/${id}`)
                ]);
                if (resAdmin.data.success && resAdmin.data.data.avatar) setAvatarUrl(resAdmin.data.data.avatar);
                if (resConq.data.success) setConquista(resConq.data.data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, navigate]);

    const handleEliminar = async () => {
        if (!window.confirm(`Tem a certeza que deseja eliminar a conquista "${conquista.titulo}"? Esta ação removerá o marco a todos os consultores que já o tenham ganho.`)) return;
        try {
            const res = await axios.delete(`https://softinsa-api-riya.onrender.com/admin-conquistas/${id}`);
            if (res.data.success) {
                alert('Conquista eliminada com sucesso!');
                navigate('/admin/badges/conquistas');
            }
        } catch (e) {
            alert('Erro ao eliminar: ' + e.message);
        }
    };

    if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;
    if (!conquista) return <div className="text-center mt-5 text-muted">Conquista não encontrada.</div>;

    const isImageUrl = conquista.imagem && conquista.imagem.startsWith('http');
    const tipoKey = conquista.tipo || 'TOTAL_PONTOS';
    const tipoLabel = TIPO_LABELS[tipoKey] || tipoKey;

    return (
        <div className="d-flex bg-light min-vh-100">
            <SidebarAdmin />

            <div className="flex-grow-1 p-4 dashboard-scroll text-start">
                <div className="container-fluid px-md-4">

                    <CabecalhoDashboard
                        titulo="Detalhes da Conquista Especial"
                        utilizador={adminUser}
                        avatarUrl={avatarUrl}
                        ocultarSaudacao={true}
                    />

                    <button onClick={() => navigate('/admin/badges/conquistas')} className="btn btn-link text-decoration-none text-secondary small mb-4 p-0 d-flex align-items-center fw-bold">
                        <i className="bi bi-arrow-left me-1"></i> Voltar ao Catálogo de Conquistas
                    </button>

                    <div className="row g-4">
                        {/* Card Esquerdo - Imagem e Pontos */}
                        <div className="col-md-4">
                            <div className="card h-100 border-0 shadow-sm rounded-4 p-4 text-center bg-white" style={{ borderTop: '4px solid #D4AF37' }}>
                                <div className="d-flex justify-content-center mb-4 mt-2">
                                    {isImageUrl ? (
                                        <img src={conquista.imagem} alt={conquista.titulo}
                                            className="rounded-circle shadow"
                                            style={{ width: '150px', height: '150px', objectFit: 'cover', border: '6px solid #D4AF37' }}
                                            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                        />
                                    ) : null}
                                    <div
                                        className={`rounded-circle d-flex align-items-center justify-content-center shadow ${isImageUrl ? 'd-none' : ''}`}
                                        style={{ width: '150px', height: '150px', backgroundColor: '#F9F1DC', border: '6px solid #D4AF37' }}
                                    >
                                        <i className={`bi ${conquista.tipo && conquista.tipo.includes('MELHOR') ? 'bi-star-fill' : 'bi-trophy-fill'} text-warning`} style={{ fontSize: '4rem' }}></i>
                                    </div>
                                </div>
                                <h4 className="fw-bold text-dark mb-2">{conquista.titulo}</h4>
                                <span className="badge rounded-pill mb-3 px-3 py-2" style={{ backgroundColor: '#D4AF37', color: '#1a1a2e', fontSize: '12px' }}>
                                    {tipoLabel}
                                </span>
                                <div className="mt-2 p-3 rounded-3 bg-primary bg-opacity-10">
                                    <h2 className="fw-bold text-primary mb-0">+{conquista.bonus}</h2>
                                    <p className="text-muted small fw-bold text-uppercase mb-0">Pontos Bónus</p>
                                </div>

                                {/* Botão eliminar no rodapé */}
                                <div className="mt-auto pt-4">
                                    <button onClick={handleEliminar} className="btn btn-danger w-100 rounded-pill fw-bold py-2 shadow-sm">
                                        <i className="bi bi-trash3-fill me-2"></i> Eliminar Conquista
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Card Direito - Detalhes */}
                        <div className="col-md-8">
                            <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white" style={{ borderTop: '4px solid #D4AF37' }}>
                                {/* Descrição */}
                                <div className="mb-4">
                                    <h5 className="fw-bold border-bottom pb-2 text-dark">
                                        <i className="bi bi-card-text me-2 text-primary"></i>Descrição
                                    </h5>
                                    <p className="text-muted">{conquista.desc || 'Sem descrição definida.'}</p>
                                </div>

                                {/* Como Obter */}
                                <div className="mb-4">
                                    <h5 className="fw-bold border-bottom pb-2 text-dark">
                                        <i className="bi bi-lightbulb-fill me-2 text-warning"></i>Como os Consultores Obtêm
                                    </h5>
                                    <div className="p-3 rounded-3 bg-warning bg-opacity-10 border border-warning border-opacity-25">
                                        <p className="text-dark mb-0">{conquista.comoObter}</p>
                                    </div>
                                </div>

                                {/* Parâmetros técnicos */}
                                <div className="mb-4">
                                    <h5 className="fw-bold border-bottom pb-2 text-dark">
                                        <i className="bi bi-gear-fill me-2 text-secondary"></i>Configuração Técnica
                                    </h5>
                                    <div className="row g-3">
                                        <div className="col-md-4">
                                            <div className="p-3 bg-light rounded-3 text-center">
                                                <p className="text-muted small fw-bold text-uppercase mb-1">Tipo</p>
                                                <p className="fw-bold text-dark mb-0" style={{ fontSize: '13px' }}>{tipoKey}</p>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="p-3 bg-light rounded-3 text-center">
                                                <p className="text-muted small fw-bold text-uppercase mb-1">Parâmetro 1</p>
                                                <p className="fw-bold text-dark mb-0">{conquista.param1 || (tipoKey === 'TOTAL_PONTOS' ? 1000 : '—')}</p>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="p-3 bg-light rounded-3 text-center">
                                                <p className="text-muted small fw-bold text-uppercase mb-1">Parâmetro 2</p>
                                                <p className="fw-bold text-dark mb-0">{conquista.param2 || '—'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Nota informativa */}
                                <div className="p-3 rounded-3 bg-primary bg-opacity-10 border border-primary border-opacity-25 mt-auto">
                                    <div className="d-flex gap-2">
                                        <i className="bi bi-info-circle-fill text-primary fs-5"></i>
                                        <p className="small text-dark m-0">
                                            Para tipos <strong>TOTAL_BADGES</strong> e <strong>BADGES_DIAS</strong>, a conquista é atribuída automaticamente ao consultor quando este completa os requisitos ao navegar pela plataforma. Para tipos <strong>MELHOR_ANO</strong> e <strong>MELHOR_MESES</strong>, o admin deve acionar manualmente o processamento de rankings.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DetalhesConquistaEspecialAdmin;
