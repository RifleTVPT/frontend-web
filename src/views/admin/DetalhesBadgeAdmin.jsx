import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import SidebarAdmin from '../../components/SidebarAdmin';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import CriarBadgeAdmin from './CriarBadgeAdmin';
import '../../assets/dashboard.css';

const DetalhesBadgeAdmin = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [editMode, setEditMode] = useState(false);
    
    const [adminUser, setAdminUser] = useState(null);
    const [badge, setBadge] = useState(null);
    const [estrutura, setEstrutura] = useState({ serviceLines: [], areas: [] });
    const [avatarUrl, setAvatarUrl] = useState("https://via.placeholder.com/40");
    const [loading, setLoading] = useState(true);

    const fetchBadgeDetails = async () => {
        try {
            const u = JSON.parse(sessionStorage.getItem('user'));
            if (u) {
                setAdminUser(u);
                const resAdmin = await axios.get(`http://localhost:3000/users/configuracoes/${u.ID_UTILIZADOR}`);
                if (resAdmin.data.success && resAdmin.data.data.avatar) setAvatarUrl(resAdmin.data.data.avatar);
            }

            const resEstrutura = await axios.get('http://localhost:3000/estrutura');
            if (resEstrutura.data.success) {
                setEstrutura(resEstrutura.data.data);
            }

            const res = await axios.get(`http://localhost:3000/catalogo/badges/${id}`);
            if (res.data.success) {
                setBadge(res.data.data);
            }
        } catch (error) {
            console.error('Erro ao buscar detalhes:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBadgeDetails();
    }, [id]);

    const handleLogout = () => {
        sessionStorage.removeItem('user');
        navigate('/');
    };

    const handleEliminarBadge = async () => {
        if (!window.confirm("Tem a certeza que deseja eliminar este badge permanentemente?")) return;
        try {
            const res = await axios.delete(`http://localhost:3000/catalogo/admin/badge/${id}`);
            if (res.data.success) {
                alert('Badge eliminado com sucesso!');
                navigate('/admin/badges/catalogo');
            }
        } catch(e) {
            alert('Erro ao eliminar badge');
            console.error(e);
        }
    };

    if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;
    if (!badge) return <div className="text-center mt-5">Badge não encontrado.</div>;

    return (
        <div className="d-flex bg-light min-vh-100">
            <SidebarAdmin />
            <div className="flex-grow-1 p-4 dashboard-scroll text-start">
                <div className="container-fluid px-md-4">
                    
                    <CabecalhoDashboard 
                        titulo={`Detalhes do Badge: ${badge.titulo}`}
                        subtitulo={badge.serviceLine}
                        utilizador={adminUser}
                        avatarUrl={avatarUrl}
                        ocultarSaudacao={true}
                    />

                    <Link to="/admin/badges/catalogo" className="text-decoration-none text-secondary small fw-bold mb-5 d-flex align-items-center">
                        <i className="bi bi-arrow-left me-2"></i> Voltar ao Catálogo Global de Badges
                    </Link>

                    {/* CARD DE GESTÃO HORIZONTAL */}
                    <div className="card border-0 shadow-sm rounded-4 p-5 bg-white mb-5">
                        <div className="row align-items-center">
                            {/* Lado Esquerdo: Ícone e Status */}
                            {/* Lado Esquerdo: Ícone e Status */}
                            {/* Lado Esquerdo: Ícone e Status */}
                            <div className="col-md-4 text-center border-end pe-5">
                                <div className="rounded-circle border border-primary border-4 p-1 mb-4 mx-auto position-relative bg-light" style={{ width: '220px', height: '220px', overflow: 'hidden' }}>
                                    <i className="bi bi-trophy-fill text-warning position-absolute" style={{ fontSize: '9rem', zIndex: 1, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}></i>
                                    {(() => {
                                        const imageSrc = badge.urlImagem && badge.urlImagem.trim() !== '' && !badge.urlImagem.includes('placeholder') && !badge.urlImagem.includes('default-trophy') && !badge.urlImagem.includes('3112946.png') ? badge.urlImagem : null;
                                        if (!imageSrc) return null;
                                        return (
                                            <img 
                                                src={imageSrc} 
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                                alt="Badge" 
                                                className="position-absolute w-100 h-100"
                                                style={{ objectFit: 'cover', zIndex: 2, top: 0, left: 0 }} 
                                            />
                                        );
                                    })()}
                                </div>
                                <div className="d-flex align-items-center justify-content-center gap-2 mb-4">
                                    <div className="rounded-circle bg-success" style={{ width: '10px', height: '10px' }}></div>
                                    <span className="small fw-bold text-success">Ativo</span>
                                </div>
                                <div className="text-start mt-4 px-3">
                                    <p className="mb-2"><strong>Service Line:</strong> {badge.serviceLine}</p>
                                    <p className="mb-2"><strong>Área:</strong> {badge.area}</p>
                                    <p className="mb-2">
                                        <strong>Nível:</strong> {badge.nivel === 'A' ? 'A (Júnior)' : badge.nivel === 'B' ? 'B (Intermédio)' : badge.nivel === 'C' ? 'C (Sénior)' : badge.nivel === 'D' ? 'D (Especialista)' : badge.nivel === 'E' ? 'E (Líder)' : badge.nivel}
                                    </p>
                                    <p className="mb-2"><strong>Validade:</strong> {badge.hasValidade ? (badge.validadeExpiracao ? `Expira em ${new Date(badge.validadeExpiracao).toLocaleDateString('pt-PT')}` : `${badge.validadeMeses} meses`) : 'Sem Expiração'}</p>
                                    <p className="mb-1"><strong>Pontos:</strong> {badge.pontos} pontos</p>
                                </div>
                            </div>

                            {/* Lado Direito: Descrição e Botões de Ação */}
                            <div className="col-md-8 ps-md-5 d-flex flex-column" style={{ minHeight: '350px' }}>
                                <div>
                                    <h4 className="fw-bold text-dark mb-3">Descrição</h4>
                                    <p className="text-muted fs-6 lh-lg" style={{ textAlign: 'justify' }}>
                                        {badge.descricao}
                                    </p>
                                </div>
                                
                                <div className="d-flex gap-3 mt-auto justify-content-center w-100 pb-2">
                                    <button onClick={() => setEditMode(true)} className="btn btn-primary px-5 py-2 rounded-3 fw-bold shadow-sm" style={{ backgroundColor: '#5D78FF', border: 'none' }}>
                                        <i className="bi bi-pencil-square me-2"></i> Editar Conteúdo
                                    </button>
                                    <button onClick={handleEliminarBadge} className="btn btn-danger px-5 py-2 rounded-3 fw-bold shadow-sm" style={{ backgroundColor: '#D9534F', border: 'none' }}>
                                        <i className="bi bi-trash3 me-2"></i> Eliminar Badge
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECÇÃO DE REQUISITOS */}
                    <div className="d-flex justify-content-between align-items-center mb-4 mt-5">
                        <h3 className="fw-bold m-0 text-dark" style={{ fontSize: '1.8rem' }}>Requisitos para Obtenção</h3>
                        <button onClick={() => setEditMode(true)} className="btn btn-primary rounded-pill px-4 py-2 fw-bold shadow-sm" style={{ backgroundColor: '#5D78FF', border: 'none' }}>
                            + Adicionar Requisito
                        </button>
                    </div>

                    <div className="row g-4 pb-5">
                        {badge.requisitos && badge.requisitos.length > 0 ? badge.requisitos.map((req, index) => {
                            const tituloFinal = (!req.titulo || req.titulo.match(/^Requisito \d+$/i)) 
                                                ? `Requisito ${badge.nivel}${index + 1}` 
                                                : req.titulo;
                            return (
                                <div key={index} className="col-md-4">
                                    <div className="card border-0 shadow-sm rounded-3 p-4 bg-white h-100 position-relative">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <h6 className="fw-bold text-primary m-0">{tituloFinal}</h6>
                                        </div>
                                        <p className="text-muted small mb-0">{req.desc}</p>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="text-muted">Sem requisitos listados para este badge.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de Edição (Pop-up igual ao Criar Badge) */}
            {editMode && <CriarBadgeAdmin 
                initialData={badge ? {
                    id: badge.id,
                    nome: badge.titulo,
                    desc: badge.descricao,
                    hasValidade: badge.hasValidade,
                    validadeExpiracao: badge.validadeExpiracao,
                    pontos: badge.pontos,
                    requisitos: badge.requisitos,
                    serviceLine: badge.serviceLine,
                    area: badge.area,
                    nivel: badge.nivel,
                    urlImagem: badge.urlImagem
                } : null} 
                estrutura={estrutura}
                onSuccess={() => { fetchBadgeDetails(); setEditMode(false); }}
                onClose={() => setEditMode(false)} 
            />}
        </div>
    );
};

export default DetalhesBadgeAdmin;
