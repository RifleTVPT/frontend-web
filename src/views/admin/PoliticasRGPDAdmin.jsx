import React, { useState, useEffect } from 'react';
import SidebarAdmin from '../../components/SidebarAdmin';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../../assets/dashboard.css';

const PoliticasRGPDAdmin = () => {
    const navigate = useNavigate();
    const [adminUser, setAdminUser] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState('https://via.placeholder.com/45');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Estados para o conteúdo editável
    const DEFAULT_TERMOS = "Estes são os termos e condições de utilização da plataforma Softinsa Badges...";
    const DEFAULT_POLITICAS = "A nossa política de privacidade garante a proteção total dos dados dos consultores...";

    const [termosTexto, setTermosTexto] = useState(DEFAULT_TERMOS);
    const [politicasTexto, setPoliticasTexto] = useState(DEFAULT_POLITICAS);
    
    const [isEditingTermos, setIsEditingTermos] = useState(false);
    const [isEditingPoliticas, setIsEditingPoliticas] = useState(false);



    useEffect(() => {
        const userLocal = JSON.parse(sessionStorage.getItem('user'));
        if (!userLocal) { navigate('/'); return; }
        setAdminUser(userLocal);

        const fetchAvatar = async () => {
            try {
                const res = await axios.get(`https://softinsa-api-riya.onrender.com/users/configuracoes/${userLocal.ID_UTILIZADOR}`);
                if (res.data.success && res.data.data.avatar) setAvatarUrl(res.data.data.avatar);
            } catch (err) {
                console.error("Erro ao carregar avatar:", err);
            }
        };

        const fetchConfiguracoes = async () => {
            try {
                const res = await axios.get('https://softinsa-api-riya.onrender.com/configuracoes');
                if (res.data.success && res.data.data) {
                    const cfg = res.data.data;
                    if (cfg.RGPD_TERMOS) setTermosTexto(cfg.RGPD_TERMOS);
                    if (cfg.RGPD_POLITICAS) setPoliticasTexto(cfg.RGPD_POLITICAS);
                }
            } catch (error) {
                console.error("Erro ao obter as configurações:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAvatar();
        fetchConfiguracoes();
    }, [navigate]);

    const handleLogout = () => {
        sessionStorage.removeItem('user');
        navigate('/');
    };



    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await axios.put('https://softinsa-api-riya.onrender.com/configuracoes', {
                RGPD_TERMOS: termosTexto,
                RGPD_POLITICAS: politicasTexto
            });
            if (res.data.success) {
                alert("Políticas e definições guardadas com sucesso!");
                setIsEditingTermos(false);
                setIsEditingPoliticas(false);
            } else {
                alert("Ocorreu um erro ao gravar as definições.");
            }
        } catch (error) {
            console.error("Erro ao gravar:", error);
            alert("Falha de ligação ao servidor.");
        } finally {
            setSaving(false);
        }
    };

    const handleRestaurar = () => {
        if(window.confirm("Tem a certeza que deseja restaurar os textos originais das Políticas e Termos?")) {
            setTermosTexto(DEFAULT_TERMOS);
            setPoliticasTexto(DEFAULT_POLITICAS);
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
                <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
            </div>
        );
    }

    return (
        <div className="d-flex bg-light min-vh-100">
            <SidebarAdmin />
            <div className="flex-grow-1 p-4 dashboard-scroll text-start">
                <div className="container-fluid px-4 pb-5">
                    
                    <CabecalhoDashboard 
                        titulo="Configuração de Políticas RGPD"
                        subtitulo="Gestão de conformidade legal, privacidade e termos de utilização."
                        utilizador={adminUser}
                        avatarUrl={avatarUrl}
                    />

                    {/* 1. TERMOS E CONDIÇÕES */}
                    <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-5">
                        <div className="bg-primary p-3 d-flex justify-content-between align-items-center">
                            <h5 className="text-white m-0 fw-bold"><i className="bi bi-file-earmark-text me-2"></i>Termos e Condições de Utilização</h5>
                            {!isEditingTermos && (
                                <button onClick={() => setIsEditingTermos(true)} className="admin-compact-action-btn btn btn-sm btn-light rounded-pill px-3 fw-bold">
                                    <i className="bi bi-pencil-square me-2"></i>Editar Texto
                                </button>
                            )}
                        </div>
                        <div className="p-4 bg-white">
                            {isEditingTermos ? (
                                <div>
                                    <textarea 
                                        className="form-control border-light bg-light p-3 rounded-3 mb-3" 
                                        rows="8" 
                                        value={termosTexto}
                                        onChange={(e) => setTermosTexto(e.target.value)}
                                    ></textarea>
                                    <div className="d-flex gap-2 justify-content-end">
                                        <button className="btn btn-primary btn-sm rounded-pill px-4" onClick={() => setIsEditingTermos(false)}>Guardar rascunho</button>
                                        <button className="btn btn-outline-secondary btn-sm rounded-pill px-4" onClick={() => setIsEditingTermos(false)}>Cancelar</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-3 bg-light rounded-3 text-muted" style={{whiteSpace: 'pre-line', borderLeft: '4px solid #5D78FF'}}>
                                    {termosTexto}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 2. POLÍTICAS DE PRIVACIDADE */}
                    <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-5">
                        <div className="bg-primary p-3 d-flex justify-content-between align-items-center">
                            <h5 className="text-white m-0 fw-bold"><i className="bi bi-shield-check me-2"></i>Políticas RGPD de Privacidade</h5>
                            {!isEditingPoliticas && (
                                <button onClick={() => setIsEditingPoliticas(true)} className="admin-compact-action-btn btn btn-sm btn-light rounded-pill px-3 fw-bold">
                                    <i className="bi bi-pencil-square me-2"></i>Editar Conteúdo
                                </button>
                            )}
                        </div>
                        <div className="p-4 bg-white">
                            {isEditingPoliticas ? (
                                <div>
                                    <textarea 
                                        className="form-control border-light bg-light p-3 rounded-3 mb-3" 
                                        rows="8" 
                                        value={politicasTexto}
                                        onChange={(e) => setPoliticasTexto(e.target.value)}
                                    ></textarea>
                                    <div className="d-flex gap-2 justify-content-end">
                                        <button className="btn btn-primary btn-sm rounded-pill px-4" onClick={() => setIsEditingPoliticas(false)}>Guardar Alteração</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-3 bg-light rounded-3 text-muted" style={{whiteSpace: 'pre-line', borderLeft: '4px solid #5D78FF'}}>
                                    {politicasTexto}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* BOTÕES GLOBAIS */}
                    <div className="admin-responsive-actions d-flex justify-content-center gap-4 mt-4">
                        <button 
                            className="btn btn-primary px-5 py-3 rounded-pill fw-bold shadow-lg fs-5" 
                            style={{backgroundColor: '#5D78FF', border: 'none', minWidth: '300px'}}
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? 'A Gravar...' : 'Guardar Todas as Políticas'}
                        </button>
                        <button 
                            className="btn btn-outline-secondary px-5 py-3 rounded-pill fw-bold border-2 fs-5" 
                            style={{minWidth: '300px'}}
                            onClick={handleRestaurar}
                        >
                            Restaurar Textos Originais
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default PoliticasRGPDAdmin;
