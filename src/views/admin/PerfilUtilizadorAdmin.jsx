import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import SidebarAdmin from '../../components/SidebarAdmin';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import AvatarUtilizador from '../../components/AvatarUtilizador';
import axios from 'axios';
import '../../assets/dashboard.css';

const PerfilUtilizadorAdmin = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(true);
    
    // --- ESTADOS DO ADMIN LOGADO ---
    const [adminUser, setAdminUser] = useState(null);
    const [avatarAdmin, setAvatarAdmin] = useState('https://via.placeholder.com/40');

    // --- ESTADOS DO PERFIL VIZUALIZADO ---
    const [editMode, setEditMode] = useState(false);
    const [user, setUser] = useState(null);
    const [tempUser, setTempUser] = useState(null);
    const [novaPasswordAdmin, setNovaPasswordAdmin] = useState('');
    const [confirmarPasswordAdmin, setConfirmarPasswordAdmin] = useState('');

    const [estrutura, setEstrutura] = useState({ serviceLines: [], areas: [] });

    useEffect(() => {
        const userLocal = JSON.parse(sessionStorage.getItem('user'));
        if (!userLocal) { navigate('/'); return; }
        setAdminUser(userLocal);

        const fetchData = async () => {
            try {
                const resAdmin = await axios.get(`https://softinsa-api-riya.onrender.com/users/configuracoes/${userLocal.ID_UTILIZADOR}`);
                if (resAdmin.data.success && resAdmin.data.data.avatar) setAvatarAdmin(resAdmin.data.data.avatar);

                const resEstrutura = await axios.get('https://softinsa-api-riya.onrender.com/estrutura');
                if (resEstrutura.data.success) {
                    setEstrutura(resEstrutura.data.data);
                }

                const resPerfil = await axios.get(`https://softinsa-api-riya.onrender.com/admin-users/perfil/${id}`);
                if (resPerfil.data.success) {
                    const dados = resPerfil.data.data;
                    setUser(dados);
                    setTempUser({ ...dados, perfis: [...dados.perfis] });
                } else {
                    alert("Utilizador não encontrado.");
                    navigate('/admin/utilizadores/lista');
                }
            } catch (error) {
                console.error("Erro ao carregar dados:", error);
                navigate('/admin/utilizadores/lista');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, navigate]);

    const handleLogout = () => {
        sessionStorage.removeItem('user');
        navigate('/');
    };

    const handleFotoClick = () => editMode && fileInputRef.current.click();

    const handleFotoChange = async (e) => {
        const file = e.target.files[0];
        if (!file || !editMode) return;

        const preview = URL.createObjectURL(file);
        setUser(prev => ({ ...prev, foto: preview }));
        setTempUser(prev => ({ ...prev, foto: preview }));

        const formData = new FormData();
        formData.append('avatar', file);
        try {
            const response = await axios.post(`https://softinsa-api-riya.onrender.com/users/upload-avatar/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (response.data.success) {
                const novaFoto = response.data.avatarUrl || response.data.data?.avatar;
                if (novaFoto) {
                    setUser(prev => ({ ...prev, foto: novaFoto }));
                    setTempUser(prev => ({ ...prev, foto: novaFoto }));
                }
            }
        } catch (error) {
            alert("Erro ao guardar a foto do utilizador.");
        }
    };

    const handleSalvarPerfil = async () => {
        const passwordPreenchida = novaPasswordAdmin || confirmarPasswordAdmin;
        if (passwordPreenchida) {
            if (novaPasswordAdmin !== confirmarPasswordAdmin) {
                alert('A nova password e a confirmação não coincidem.');
                return;
            }
            if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/.test(novaPasswordAdmin)) {
                alert('A password deve ter 8+ caracteres, uma maiúscula, uma minúscula, um número e um caractere especial.');
                return;
            }
        }

        const removedProfiles = user.perfis.filter(p => !tempUser.perfis.includes(p));
        if (removedProfiles.length > 0) {
            const msg = `Está prestes a remover os seguintes perfis: ${removedProfiles.join(', ')}.\nSe voltar a adicioná-los no futuro, o utilizador perderá o histórico ligado a este perfil.\n\nDeseja mesmo continuar?`;
            if (!window.confirm(msg)) {
                return;
            }
        }

        try {
            const response = await axios.put(`https://softinsa-api-riya.onrender.com/admin-users/perfil/${id}`, {
                nome: tempUser.nome,
                email: tempUser.email,
                perfis: tempUser.perfis,
                sl: tempUser.sl,
                area: tempUser.area,
                novaPassword: passwordPreenchida ? novaPasswordAdmin : undefined
            });

            if (response.data.success) {
                alert("Perfil do utilizador atualizado com sucesso!");
                setUser(tempUser);
                setEditMode(false);
                setNovaPasswordAdmin('');
                setConfirmarPasswordAdmin('');
            }
        } catch (error) {
            alert(error.response?.data?.message || "Ocorreu um erro ao gravar alterações.");
        }
    };

    const handleDesativarConta = async () => {
        if (!window.confirm("Pretende mesmo desativar este utilizador? Ele deixará de ter acesso à plataforma.")) return;

        try {
            const response = await axios.put(`https://softinsa-api-riya.onrender.com/admin-users/desativar/${id}`);
            if (response.data.success) {
                alert("Conta desativada com sucesso.");
                setUser({...user, status: 'Inativo'});
            }
        } catch (error) {
            alert("Erro ao tentar desativar conta.");
        }
    };

    const handleAtivarConta = async () => {
        if (!window.confirm("Pretende reativar este utilizador? Ele voltará a ter acesso à plataforma.")) return;

        try {
            const response = await axios.put(`https://softinsa-api-riya.onrender.com/admin-users/ativar/${id}`);
            if (response.data.success) {
                alert("Conta ativada com sucesso.");
                setUser({...user, status: 'Ativo'});
            }
        } catch (error) {
            alert("Erro ao tentar ativar conta.");
        }
    };

    const handleCheckboxPerfil = (perfil) => {
        setTempUser(prev => {
            const hasPerfil = prev.perfis.includes(perfil);
            let newPerfis = hasPerfil ? prev.perfis.filter(p => p !== perfil) : [...prev.perfis, perfil];
            if (newPerfis.length === 0) newPerfis = ['Consultor'];
            return { ...prev, perfis: newPerfis };
        });
    };

    const handleSLChange = (e) => {
        const sl = e.target.value;
        const slObj = estrutura.serviceLines.find(s => s.nome === sl);
        const areasDestaSL = slObj ? estrutura.areas.filter(a => a.slId === slObj.id) : [];
        const primeiraArea = areasDestaSL.length > 0 ? areasDestaSL[0].nome : 'N/A';
        setTempUser({ ...tempUser, sl: sl, area: primeiraArea });
    };

    if (loading || !user) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

    const isConsultor = user.perfis.includes('Consultor');
    const isSLL = user.perfis.includes('Service Line Leader');
    
    // CORREÇÃO INFALÍVEL
    const textStatus = (user.status || '').toLowerCase();
    const isInativo = textStatus.includes('inativ');
    const isAtivo = textStatus.includes('ativ') && !isInativo;

    return (
        <div className="d-flex bg-light min-vh-100">
            <SidebarAdmin />
            <div className="flex-grow-1 p-4 dashboard-scroll text-start">
                <div className="container-fluid px-md-4">
                    
                    {/* CABEÇALHO PADRONIZADO ADMIN */}
                    <CabecalhoDashboard 
                        titulo={`Perfil de ${user.nome}`}
                        subtitulo="Consulte e edite os dados do utilizador."
                        utilizador={adminUser}
                        avatarUrl={avatarAdmin}
                        ocultarSaudacao={true}
                    />

                    <Link to="/admin/utilizadores/lista" className="text-decoration-none text-secondary small fw-bold d-flex align-items-center mb-4">
                        <i className="bi bi-arrow-left me-2"></i> Voltar à lista
                    </Link>

                    {/* CARD PRINCIPAL - Cabeçalho do Perfil */}
                    <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
                        <div className="row align-items-center">
                            <div className="col-md-auto text-center position-relative">
                                <div className={`bg-light rounded-circle mx-auto mb-2 d-flex align-items-center justify-content-center border shadow-sm ${editMode ? 'cursor-pointer' : ''}`} 
                                     style={{width: '120px', height: '120px', overflow: 'hidden'}}
                                     onClick={handleFotoClick}>
                                    <AvatarUtilizador nome={user.nome} foto={user.foto} tamanho={120} />
                                </div>
                                <input type="file" ref={fileInputRef} className="d-none" accept="image/*" onChange={handleFotoChange} />
                                {editMode && <button className="btn btn-link btn-sm p-0 text-primary fw-bold text-decoration-none" onClick={handleFotoClick}>Alterar Foto</button>}
                            </div>
                            <div className="col-md ps-md-4">
                                {editMode ? (
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="small fw-bold">Nome</label>
                                            <input type="text" className="form-control bg-light border-0 py-2" value={tempUser.nome} onChange={(e) => setTempUser({...tempUser, nome: e.target.value})} />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="small fw-bold">Email</label>
                                            <input type="email" className="form-control bg-light border-0 py-2" value={tempUser.email} onChange={(e) => setTempUser({...tempUser, email: e.target.value})} />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="small fw-bold">Nova Password</label>
                                            <input
                                                type="password"
                                                className="form-control bg-light border-0 py-2"
                                                placeholder="Deixe vazio para manter"
                                                value={novaPasswordAdmin}
                                                onChange={(e) => setNovaPasswordAdmin(e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="small fw-bold">Confirmar Nova Password</label>
                                            <input
                                                type="password"
                                                className="form-control bg-light border-0 py-2"
                                                placeholder="Repetir nova password"
                                                value={confirmarPasswordAdmin}
                                                onChange={(e) => setConfirmarPasswordAdmin(e.target.value)}
                                            />
                                            <small className="text-muted d-block mt-1" style={{fontSize: '10px'}}>
                                                Mín. 8 carateres, 1 maiúscula, 1 minúscula, 1 número e 1 especial.
                                            </small>
                                        </div>
                                        <div className="col-12 mt-3">
                                            <label className="small fw-bold mb-2">Perfis de Acesso</label>
                                            <div className="d-flex flex-wrap gap-3">
                                                {['Consultor', 'Talent Manager', 'Service Line Leader', 'Administrador'].map(p => (
                                                    <div key={p} className="form-check">
                                                        <input className="form-check-input shadow-none cursor-pointer" type="checkbox" id={`edit-check-${p}`} 
                                                               checked={tempUser.perfis.includes(p)}
                                                               onChange={() => handleCheckboxPerfil(p)} />
                                                        <label className="form-check-label small fw-bold text-dark cursor-pointer" htmlFor={`edit-check-${p}`}>{p}</label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <h2 className="fw-bold m-0 text-dark">{user.nome}</h2>
                                        <p className="text-muted mb-2">{user.email}</p>
                                        <p className="small text-muted mb-3">Registo no Sistema: <strong>{user.acesso}</strong></p>
                                        <div className="mb-2">
                                            <span className="badge rounded-pill px-3 py-2 text-white fw-bold shadow-sm" style={{ backgroundColor: isAtivo ? '#82D674' : (isInativo ? '#E85353' : '#F3D458') }}>
                                                Conta {user.status}
                                            </span>
                                        </div>
                                    </>
                                )}
                                <div className="d-flex flex-wrap gap-2 mt-3">
                                    {user.perfis.map(p => <span key={p} className="badge bg-primary rounded-pill px-3">{p}</span>)}
                                </div>
                            </div>
                            <div className="col-md-auto text-end">
                                <button onClick={() => {
                                    if (editMode) {
                                        setTempUser({...user, perfis: [...user.perfis]});
                                        setNovaPasswordAdmin('');
                                        setConfirmarPasswordAdmin('');
                                    }
                                    setEditMode(!editMode);
                                }} className={`btn ${editMode ? 'btn-outline-secondary' : 'btn-primary'} rounded-pill px-4 fw-bold shadow-sm`} style={!editMode ? {backgroundColor: '#5D78FF', border: 'none'} : {}}>
                                    <i className={`bi ${editMode ? 'bi-x-lg' : 'bi-pencil-square'} me-2`}></i> {editMode ? 'Cancelar Edição' : 'Editar Perfil'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* VISTA DINÂMICA: ALOCAÇÃO */}
                    {(tempUser.perfis.includes('Consultor') || tempUser.perfis.includes('Service Line Leader')) && (
                        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4 border-start border-4 border-primary">
                            <h5 className="fw-bold mb-4 text-dark border-bottom pb-2">Alocação e Service Line</h5>
                            <div className="row g-3">
                                <div className="col-md-6 text-start">
                                    <label className="small fw-bold text-muted text-uppercase">Service Line Responsável:</label>
                                    {editMode ? (
                                        <select className="form-select bg-light border-0 py-2 mt-1" 
                                                value={tempUser.sl || 'Global'} 
                                                onChange={handleSLChange}>
                                            <option value="Global">Selecione a Service Line</option>
                                            {estrutura.serviceLines.map(sl => <option key={sl.id} value={sl.nome}>{sl.nome}</option>)}
                                        </select>
                                    ) : <p className="text-dark fw-bold fs-5 mt-1">{user.sl}</p>}
                                </div>
                                {tempUser.perfis.includes('Consultor') && (
                                    <div className="col-md-6 text-start">
                                        <label className="small fw-bold text-muted text-uppercase">Área Favorita (Consultor):</label>
                                        {editMode ? (
                                            <select className="form-select bg-light border-0 py-2 mt-1" value={tempUser.area || 'N/A'} onChange={(e) => setTempUser({...tempUser, area: e.target.value})}>
                                                {estrutura.areas.filter(a => {
                                                    const slObj = estrutura.serviceLines.find(s => s.nome === tempUser.sl);
                                                    return slObj && a.slId === slObj.id;
                                                }).map(a => <option key={a.id} value={a.nome}>{a.nome}</option>)}
                                                {estrutura.areas.filter(a => {
                                                    const slObj = estrutura.serviceLines.find(s => s.nome === tempUser.sl);
                                                    return slObj && a.slId === slObj.id;
                                                }).length === 0 && <option value="N/A">N/A</option>}
                                            </select>
                                        ) : <p className="text-dark fw-bold fs-5 mt-1">{user.area}</p>}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* PROGRESSO EM LEARNING PATHS */}
                    {isConsultor && (
                        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-5">
                            <h4 className="fw-bold mb-4 text-dark"><i className="bi bi-graph-up me-2 text-primary"></i>Progresso em Learning Paths</h4>
                            <div className="row align-items-center">
                                <div className="col-md-3 text-center border-end">
                                    <div className="h1 fw-bold text-primary mb-0">{user.progressoSL}%</div>
                                    <small className="text-muted fw-bold text-uppercase">Badges Completos</small>
                                </div>
                                <div className="col-md-9 ps-md-4">
                                    <div className="row g-3">
                                        {user.aprendizagens && user.aprendizagens.length > 0 ? user.aprendizagens.map((item, i) => (
                                            <div key={i} className="col-md-6">
                                                <div className="p-3 bg-light rounded-3 border shadow-sm">
                                                    <div className="d-flex justify-content-between mb-2">
                                                        <small className="fw-bold text-dark">{item.titulo}</small>
                                                        <small className="fw-bold text-primary">{item.progresso}%</small>
                                                    </div>
                                                    <div className="progress" style={{ height: '8px' }}>
                                                        <div className="progress-bar bg-primary" style={{ width: `${item.progresso}%` }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        )) : <p className="text-muted italic">Nenhuma aprendizagem ativa registada.</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* BOTÕES DE ACÇÃO FINAIS */}
                    {editMode ? (
                        <div className="d-flex justify-content-center gap-4 mt-5 pb-5">
                            <button className="btn btn-primary px-5 py-3 rounded-pill fw-bold shadow-lg" style={{backgroundColor: '#5D78FF', border: 'none'}} onClick={handleSalvarPerfil}>Guardar Alterações</button>
                            <button className="btn btn-light bg-white border px-5 py-3 rounded-pill fw-bold text-muted shadow-sm" onClick={() => {setEditMode(false); setTempUser({...user, perfis: [...user.perfis]}); setNovaPasswordAdmin(''); setConfirmarPasswordAdmin('');}}>Cancelar Alterações</button>
                        </div>
                    ) : (
                        <div className="d-flex justify-content-center gap-4 mt-4 pt-4 border-top">
                           {isInativo ? (
                               <button className="btn btn-success px-5 rounded-pill py-3 fw-bold shadow-sm" 
                                       style={{ backgroundColor: '#82D674', border: 'none' }}
                                       onClick={handleAtivarConta}>
                                   <i className="bi bi-check-circle me-2"></i> Ativar Conta
                               </button>
                           ) : (
                               <button className="btn btn-danger px-5 rounded-pill py-3 fw-bold shadow-sm" 
                                       style={{ backgroundColor: '#E85353', border: 'none' }}
                                       onClick={handleDesativarConta}>
                                   <i className="bi bi-x-circle me-2"></i> Desativar Conta
                               </button>
                           )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PerfilUtilizadorAdmin;
