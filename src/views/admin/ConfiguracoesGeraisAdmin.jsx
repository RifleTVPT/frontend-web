import React, { useState, useEffect, useRef } from 'react';
import SidebarAdmin from '../../components/SidebarAdmin';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import axios from 'axios';
import { resolveAssetUrl } from '../../utils/assetUrl';
import { useNavigate } from 'react-router-dom';
import '../../assets/dashboard.css';

const ConfiguracoesGeraisAdmin = () => {
    const navigate = useNavigate();
    const [adminUser, setAdminUser] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState('');
    const fileInputRef = useRef(null);

    const [editando, setEditando] = useState(false);
    const [perfil, setPerfil] = useState({
        nome: '', email: '', serviceLine: 'Global', area: 'Gestão', idioma: 'Português', receberAprovacoes: true, receberExpiracao: true, partilharLinkedIn: true, receberEmailNotif: true
    });
    const [tempPerfil, setTempPerfil] = useState({});

    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordAtual, setPasswordAtual] = useState('');
    const [novaPassword, setNovaPassword] = useState('');
    const [confirmarPassword, setConfirmarPassword] = useState('');
    const [erroPassword, setErroPassword] = useState('');
    const validarPassword = (password) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/.test(password);

    const [modoManutencao, setModoManutencao] = useState(false);
    
    // Configurações de Pontos Padrão por Nível
    const [pontosDefault, setPontosDefault] = useState({
        A: 150, B: 200, C: 250, D: 350, E: 500, OUTRO: 750
    });

    const [validadeMesesPadrao, setValidadeMesesPadrao] = useState(12);
    const [idiomaPadrao, setIdiomaPadrao] = useState('Português (Portugal)');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const userLocal = JSON.parse(sessionStorage.getItem('user'));
        if (!userLocal) { navigate('/'); return; }
        setAdminUser(userLocal);

        const fetchAvatar = async () => {
            try {
                const res = await axios.get(`https://softinsa-api-riya.onrender.com/users/configuracoes/${userLocal.ID_UTILIZADOR}`);
                if (res.data.success) {
                    if (res.data.data.avatar) {
                        setAvatarUrl(res.data.data.avatar);
                    } else {
                        setAvatarUrl(`https://ui-avatars.com/api/?name=${encodeURIComponent(userLocal.NOME_COMPLETO_UTILIZADOR || 'A')}&background=198754&color=fff&size=100`);
                    }
                    setPerfil(res.data.data);
                    setTempPerfil(res.data.data);
                }
            } catch (err) {
                console.error("Erro ao carregar avatar:", err);
            }
        };

        const fetchConfiguracoes = async () => {
            try {
                const res = await axios.get('https://softinsa-api-riya.onrender.com/configuracoes');
                if (res.data.success && res.data.data) {
                    const cfg = res.data.data;
                    setPontosDefault({
                        A: cfg.PONTOS_DEFAULT_A,
                        B: cfg.PONTOS_DEFAULT_B,
                        C: cfg.PONTOS_DEFAULT_C,
                        D: cfg.PONTOS_DEFAULT_D,
                        E: cfg.PONTOS_DEFAULT_E,
                        OUTRO: cfg.PONTOS_DEFAULT_OUTRO || 750
                    });
                    setValidadeMesesPadrao(cfg.VALIDADE_MESES_PADRAO);
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
                PONTOS_DEFAULT_A: pontosDefault.A,
                PONTOS_DEFAULT_B: pontosDefault.B,
                PONTOS_DEFAULT_C: pontosDefault.C,
                PONTOS_DEFAULT_D: pontosDefault.D,
                PONTOS_DEFAULT_E: pontosDefault.E,
                PONTOS_DEFAULT_OUTRO: pontosDefault.OUTRO,
                VALIDADE_MESES_PADRAO: validadeMesesPadrao
            });
            if (res.data.success) {
                alert("Configurações atualizadas com sucesso!");
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

    const handleSalvarPerfil = async () => {
        try {
            const res = await axios.put(`https://softinsa-api-riya.onrender.com/users/configuracoes/${adminUser.ID_UTILIZADOR}`, tempPerfil);
            if (res.data.success) {
                const perfilAtualizado = {
                    ...tempPerfil,
                    nome: res.data.data?.nome || tempPerfil.nome,
                    email: res.data.data?.email || tempPerfil.email,
                    avatar: res.data.data?.avatar || tempPerfil.avatar
                };
                setPerfil(perfilAtualizado);
                setTempPerfil(perfilAtualizado);
                setEditando(false);
                const userLocalStorage = JSON.parse(sessionStorage.getItem('user'));
                userLocalStorage.NOME_COMPLETO_UTILIZADOR = perfilAtualizado.nome;
                userLocalStorage.EMAIL_UTILIZADOR = perfilAtualizado.email;
                sessionStorage.setItem('user', JSON.stringify(userLocalStorage));
                setAdminUser(userLocalStorage);
            }
        } catch (error) {
            console.error(error);
            alert("Erro ao gravar alterações pessoais.");
        }
    };

    const handleFotoClick = () => { fileInputRef.current.click(); };

    const handleFotoChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setAvatarUrl(URL.createObjectURL(file));
        const formData = new FormData();
        formData.append('avatar', file);
        try {
            const response = await axios.post(`https://softinsa-api-riya.onrender.com/users/upload-avatar/${adminUser.ID_UTILIZADOR}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (response.data.success) {
                const novaFoto = response.data.avatarUrl || response.data.data?.avatar;
                if (novaFoto) {
                    setAvatarUrl(novaFoto);
                    const userLocalStorage = JSON.parse(sessionStorage.getItem('user'));
                    if (userLocalStorage) {
                        userLocalStorage.URL_FOTO = novaFoto;
                        sessionStorage.setItem('user', JSON.stringify(userLocalStorage));
                        setAdminUser(userLocalStorage);
                    }
                }
            }
        } catch (error) {
            console.error("Erro ao upload da foto:", error);
            alert("Erro ao guardar foto no servidor.");
        }
    };

    const handleMudarPassword = async () => {
        setErroPassword('');
        if (!passwordAtual || !novaPassword || !confirmarPassword) return setErroPassword("Preencha todos os campos.");
        if (novaPassword !== confirmarPassword) return setErroPassword("A nova password e a confirmação não coincidem.");
        if (!validarPassword(novaPassword)) return setErroPassword("A password deve ter 8+ caracteres, uma maiúscula, uma minúscula, um número e um caractere especial.");
        try {
            const res = await axios.put(`https://softinsa-api-riya.onrender.com/users/mudar-password/${adminUser.ID_UTILIZADOR}`, { passwordAtual, novaPassword });
            if (res.data.success) {
                alert("Password alterada com sucesso!");
                setShowPasswordModal(false);
                setPasswordAtual(''); setNovaPassword(''); setConfirmarPassword('');
            }
        } catch (error) {
            if (error.response && error.response.data) setErroPassword(error.response.data.message);
            else setErroPassword("Erro de conexão ao servidor.");
        }
    };
    const avatarPreviewSrc = resolveAssetUrl(avatarUrl) || avatarUrl;

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
                <div className="container-fluid px-4">
                    <CabecalhoDashboard 
                        titulo="Configurações Globais e de Perfil"
                        subtitulo="Gerencie a sua conta e as preferências globais do sistema Softinsa."
                        utilizador={adminUser}
                        avatarUrl={avatarUrl}
                    />

                    {/* DADOS PESSOAIS */}
                    <div className="admin-settings-profile-card card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
                        <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
                            <h5 className="fw-bold m-0"><i className="bi bi-person-circle me-2 text-primary"></i>Dados Pessoais e Segurança</h5>
                        </div>
                        <div className="admin-settings-profile-body d-flex align-items-start gap-4">
                            <div className="admin-settings-photo text-center">
                                <div className="position-relative cursor-pointer" onClick={handleFotoClick}>
                                    <img src={avatarPreviewSrc} className="rounded-circle shadow-sm border" style={{ width: '100px', height: '100px', objectFit: 'cover' }} alt="Avatar" />
                                    <button className="btn btn-sm btn-primary position-absolute bottom-0 end-0 rounded-circle"><i className="bi bi-camera"></i></button>
                                </div>
                                <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFotoChange} />
                                <small className="text-primary d-block mt-2 cursor-pointer fw-bold" onClick={handleFotoClick}>Mudar Foto</small>
                            </div>
                            <div className="admin-settings-profile-fields flex-grow-1">
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold text-muted">Nome Completo</label>
                                        <input 
                                            type="text" 
                                            className={`form-control border-0 py-2 ${editando ? 'bg-white shadow-sm border-bottom' : 'bg-light'}`} 
                                            value={editando ? tempPerfil.nome : perfil.nome} 
                                            onChange={e => setTempPerfil({...tempPerfil, nome: e.target.value})}
                                            disabled={!editando} 
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold text-muted">Email Profissional</label>
                                        <input 
                                            type="email" 
                                            className={`form-control border-0 py-2 ${editando ? 'bg-white shadow-sm border-bottom' : 'bg-light text-muted'}`} 
                                            value={editando ? tempPerfil.email : perfil.email} 
                                            onChange={e => setTempPerfil({...tempPerfil, email: e.target.value})}
                                            disabled={!editando} 
                                        />
                                    </div>
                                </div>
                                <div className="mt-3">
                                    {!editando ? (
                                        <div className="admin-settings-inline-actions d-flex gap-2">
                                            <button className="btn btn-primary btn-sm px-4 rounded-pill fw-bold" onClick={() => setEditando(true)}>
                                                <i className="bi bi-pencil-square me-2"></i> Editar Perfil
                                            </button>
                                            <button className="btn btn-outline-primary btn-sm px-4 rounded-pill fw-bold" onClick={() => setShowPasswordModal(true)}>
                                                Alterar Password
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="admin-settings-inline-actions d-flex gap-2 mt-3">
                                            <button className="btn btn-primary px-4 rounded-pill fw-bold" onClick={handleSalvarPerfil}>Guardar Alterações</button>
                                            <button className="btn btn-outline-secondary px-4 rounded-pill fw-bold" onClick={() => { setEditando(false); setTempPerfil(perfil); }}>Cancelar</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ESTADO DO SISTEMA REMOVIDO COMO SOLICITADO */}

                    <div className="row g-4 mb-4">
                        {/* GESTÃO DE PONTOS DEFAULT - ALINHADO À ESQUERDA */}
                        <div className="col-md-7">
                            <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
                                <h5 className="fw-bold mb-4 border-bottom pb-2"><i className="bi bi-trophy me-2 text-primary"></i>Gestão de Pontuação Padrão (Default)</h5>
                                <p className="text-muted small mb-4">Pontos atribuídos automaticamente caso o Admin não defina valores específicos na criação do Badge.</p>
                                
                                <div className="row g-4">
                                    {Object.keys(pontosDefault).map((nivel) => (
                                        <div key={nivel} className="col-md-4">
                                            <div className="text-start">
                                                <label className="fw-bold small text-muted text-uppercase mb-2">{nivel === 'OUTRO' ? 'Outro Nível' : `Nível ${nivel}`}</label>
                                                <div className="input-group shadow-sm rounded-3 overflow-hidden border">
                                                    <input 
                                                        type="number" 
                                                        className="form-control border-0 bg-light py-2 fw-bold" 
                                                        value={pontosDefault[nivel]}
                                                        onChange={(e) => setPontosDefault({...pontosDefault, [nivel]: e.target.value})}
                                                    />
                                                    <span className="input-group-text border-0 bg-light text-muted fw-bold small">pts</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="col-md-5">
                            <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
                                <h5 className="fw-bold mb-4 border-bottom pb-2"><i className="bi bi-calendar-event me-2 text-primary"></i>Gestão de Prazos de Validade</h5>
                                
                                <div className="mb-4">
                                    <label className="fw-bold small text-muted text-uppercase mb-2">Validade Padrão de Badges (Meses)</label>
                                    <input 
                                        type="number" 
                                        className="form-control border-0 bg-light py-3 rounded-3 fw-bold shadow-sm" 
                                        value={validadeMesesPadrao} 
                                        onChange={(e) => setValidadeMesesPadrao(e.target.value)} 
                                    />
                                    <small className="text-muted d-block mt-1">Aplicado na criação do Badge, caso o Admin não defina manualmente a validade (12 = 1 ano).</small>
                                </div>
                            </div>
                        </div>
                    </div>



                    {/* BOTÕES DE ACÇÃO FIXOS */}
                    <div className="admin-responsive-actions admin-final-actions d-flex justify-content-center gap-4 mt-5 pb-5">
                        <button 
                            className="btn btn-primary px-5 py-3 rounded-pill fw-bold shadow-lg fs-5" 
                            style={{backgroundColor: '#5D78FF', border: 'none'}}
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? 'A Guardar...' : 'Guardar todas as Alterações'}
                        </button>
                        <button 
                            className="btn btn-outline-secondary px-5 py-3 rounded-pill fw-bold border-2 fs-5" 
                            onClick={() => window.location.reload()}
                        >
                            Cancelar Alterações
                        </button>
                    </div>
                </div>
            </div>
            {/* MODAL ALTERAR PASSWORD */}
            {showPasswordModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 rounded-4 p-4 shadow-lg text-start">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h4 className="fw-bold m-0">Alterar Password</h4>
                                <button type="button" className="btn-close shadow-none" onClick={() => setShowPasswordModal(false)}></button>
                            </div>

                            {erroPassword && <div className="alert alert-danger py-2 small fw-bold">{erroPassword}</div>}

                            <div className="mb-3">
                                <label className="form-label small fw-bold">Password Atual</label>
                                <input type="password" className="form-control bg-light border-0 py-2" value={passwordAtual} onChange={e => setPasswordAtual(e.target.value)} />
                            </div>
                            
                            <div className="mb-3">
                                <label className="form-label small fw-bold">Requisitos da Nova Password:</label>
                                <ul className="text-muted small mb-3 ps-3">
                                    <li>No mínimo 8 caracteres</li>
                                    <li>Pelo menos uma letra maiúscula e minúscula</li>
                                    <li>Pelo menos um número e um caractere especial (!, @, #, $, etc.)</li>
                                </ul>
                            </div>
                            <div className="mb-3">
                                <label className="form-label small fw-bold">Nova Password</label>
                                <input type="password" className="form-control bg-light border-0 py-2" value={novaPassword} onChange={e => setNovaPassword(e.target.value)} />
                            </div>
                            <div className="mb-4">
                                <label className="form-label small fw-bold">Confirmar Nova Password</label>
                                <input type="password" className="form-control bg-light border-0 py-2" value={confirmarPassword} onChange={e => setConfirmarPassword(e.target.value)} />
                            </div>

                            <div className="d-flex gap-3 justify-content-end mt-2">
                                <button className="btn btn-secondary px-4 rounded-3 fw-bold" onClick={() => setShowPasswordModal(false)}>Cancelar</button>
                                <button className="btn btn-primary px-4 rounded-3 fw-bold shadow" onClick={handleMudarPassword}>Guardar Password</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConfiguracoesGeraisAdmin;
