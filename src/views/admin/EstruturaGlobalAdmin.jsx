import React, { useState, useEffect, useRef } from 'react';
import SidebarAdmin from '../../components/SidebarAdmin';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../assets/dashboard.css';

const EstruturaGlobalAdmin = () => {
    const navigate = useNavigate();
    const [adminUser, setAdminUser] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState('https://via.placeholder.com/40');
    const [loading, setLoading] = useState(true);

    // Estados de Seleção e UI
    const [lpSelecionado, setLpSelecionado] = useState(null);
    const [slSelecionada, setSlSelecionada] = useState(null);
    const [areaAtivaEdicao, setAreaAtivaEdicao] = useState(null);
    const [inputRequisito, setInputRequisito] = useState({ nivel: '', placeholder: '', titulo: '', desc: '' });
    
    // Estados para Modais e Controle de Edição
    const [isEditMode, setIsEditMode] = useState(false);
    const [showModalLP, setShowModalLP] = useState(false);
    const [showModalSL, setShowModalSL] = useState(false);
    const [showModalArea, setShowModalArea] = useState(false);

    const [estrutura, setEstrutura] = useState({
        learningPaths: [],
        serviceLines: [],
        areas: []
    });

    const carregarDados = async () => {
        try {
            const res = await axios.get('https://softinsa-api-riya.onrender.com/estrutura');
            if (res.data.success) {
                setEstrutura(res.data.data);
                if(res.data.data.learningPaths.length > 0 && !lpSelecionado) setLpSelecionado(res.data.data.learningPaths[0].id);
            }
        } catch (error) {
            console.error("Erro ao carregar estrutura:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const userLocal = JSON.parse(sessionStorage.getItem('user'));
        if (!userLocal) { navigate('/'); return; }
        setAdminUser(userLocal);

        const fetchAvatar = async () => {
            try {
                const resAdmin = await axios.get(`https://softinsa-api-riya.onrender.com/users/configuracoes/${userLocal.ID_UTILIZADOR}`);
                if (resAdmin.data.success && resAdmin.data.data.avatar) setAvatarUrl(resAdmin.data.data.avatar);
            } catch (error) {
                console.error("Erro avatar:", error);
            }
        };
        fetchAvatar();
        carregarDados();
    }, [navigate]);

    const handleLogout = () => {
        sessionStorage.removeItem('user');
        navigate('/');
    };

    // --- LÓGICA DE GESTÃO ---
    const handleLPChange = (id) => {
        setLpSelecionado(id);
        setSlSelecionada(null);
    };

    const adicionarNovoNivelGlobal = async (areaId) => {
        const area = estrutura.areas.find(a => a.id === areaId);
        const proximoNumero = area.niveisAtivos.length + 1;
        const proximaLetra = String.fromCharCode(64 + proximoNumero);
        const novoNomeMapping = { 1: 'Júnior', 2: 'Intermédio', 3: 'Sénior', 4: 'Especialista', 5: 'Líder de Conhecimento' };
        const novoNome = novoNomeMapping[proximoNumero] || proximaLetra;
        
        try {
            await axios.post(`https://softinsa-api-riya.onrender.com/estrutura/area/${areaId}/nivel`, { nivelNome: novoNome });
            carregarDados();
        } catch (error) {
            console.error(error);
            alert('Erro ao adicionar nível.');
        }
    };

    const eliminarNivelMaisAlto = async (areaId) => {
        if (!window.confirm("Tem a certeza? Isto irá apagar o Nível mais alto desta Área e TODOS os seus requisitos!")) return;
        try {
            await axios.delete(`https://softinsa-api-riya.onrender.com/estrutura/area/${areaId}/nivel`);
            carregarDados();
        } catch (error) {
            console.error(error);
            alert("Erro ao eliminar nível.");
        }
    };

    const prepararNovoRequisito = (letraNivel, areaId) => {
        const area = estrutura.areas.find(a => a.id === areaId);
        const count = area.requisitos.filter(r => r.letra === letraNivel).length + 1;
        setInputRequisito({ nivel: letraNivel, placeholder: `Adicionar Requisito ${letraNivel}${count}...`, titulo: '', desc: '' });
        setAreaAtivaEdicao(areaId);
    };

    const getLetraParaNivel = (n, area) => {
        if (!area || !area.niveisAtivos) return n;
        const index = area.niveisAtivos.indexOf(n);
        return index !== -1 ? String.fromCharCode(65 + index) : n;
    };

    const submeterNovoRequisito = async () => {
        const area = estrutura.areas.find(a => a.id === areaAtivaEdicao);
        const nDb = area._niveisDB.find(n => getLetraParaNivel(n.NOME_NIVEL, area) === inputRequisito.nivel);
        if(!nDb) return alert("Nível não encontrado na base de dados para associar requisito.");

        try {
            await axios.post('https://softinsa-api-riya.onrender.com/estrutura/requisito', {
                nivelId: nDb.ID_NIVEL,
                titulo: `Requisito ${inputRequisito.nivel}`,
                descricao: inputRequisito.desc
            });
            setAreaAtivaEdicao(null);
            carregarDados();
        } catch (error) {
            console.error(error);
            alert("Erro ao criar requisito");
        }
    };

    const eliminarRequisito = async (idReqDb) => {
        if (!window.confirm("Apagar este requisito?")) return;
        try {
            await axios.delete(`https://softinsa-api-riya.onrender.com/estrutura/requisito/${idReqDb}`);
            carregarDados();
        } catch(e) {
            alert("Erro ao eliminar requisito.");
        }
    };

    const eliminarLP = async (id) => {
        if (!window.confirm("Tem a certeza que deseja eliminar este Learning Path?")) return;
        try {
            const res = await axios.delete(`https://softinsa-api-riya.onrender.com/estrutura/learning-path/${id}`);
            if (res.data.success) {
                if (lpSelecionado === id) { setLpSelecionado(null); setSlSelecionada(null); }
                carregarDados();
            } else {
                alert(res.data.message);
            }
        } catch(e) {
            alert("Erro ao eliminar Learning Path.");
        }
    };

    const eliminarSL = async (id) => {
        if (!window.confirm("Tem a certeza que deseja eliminar esta Service Line?")) return;
        try {
            const res = await axios.delete(`https://softinsa-api-riya.onrender.com/estrutura/service-line/${id}`);
            if (res.data.success) {
                if (slSelecionada === id) setSlSelecionada(null);
                carregarDados();
            } else {
                alert(res.data.message);
            }
        } catch(e) {
            alert("Erro ao eliminar Service Line.");
        }
    };

    const eliminarArea = async (id) => {
        if (!window.confirm("Tem a certeza que deseja eliminar esta Área?")) return;
        try {
            const res = await axios.delete(`https://softinsa-api-riya.onrender.com/estrutura/area/${id}`);
            if (res.data.success) {
                if (areaAtivaEdicao === id) setAreaAtivaEdicao(null);
                carregarDados();
            } else {
                alert(res.data.message);
            }
        } catch(e) {
            alert("Erro ao eliminar Área.");
        }
    };

    const RenderModalLP = () => {
        const data = isEditMode ? estrutura.learningPaths.find(l => l.id === lpSelecionado) : { nome: '', desc: '' };
        const nomeRef = useRef(null);
        const descRef = useRef(null);

        const handleSalvar = async () => {
            try {
                if(isEditMode) {
                    await axios.put(`https://softinsa-api-riya.onrender.com/estrutura/learning-path/${data.id}`, {
                        nome: nomeRef.current.value,
                        desc: descRef.current.value
                    });
                } else {
                    await axios.post('https://softinsa-api-riya.onrender.com/estrutura/learning-path', {
                        nome: nomeRef.current.value,
                        desc: descRef.current.value,
                        adminId: adminUser.ID_UTILIZADOR
                    });
                }
                setShowModalLP(false);
                carregarDados();
            } catch(e) { alert("Erro ao guardar LP"); }
        };

        return (
            <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1080 }}>
                <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div className="modal-content border-0 rounded-5 p-5 shadow-lg">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h2 className="fw-bold m-0">{isEditMode ? 'Editar' : 'Criar Novo'} Learning Path</h2>
                            <button type="button" className="btn-close" onClick={() => setShowModalLP(false)}></button>
                        </div>
                        <div className="mb-4 text-start">
                            <label className="fw-bold text-muted small text-uppercase mb-2">Nome do Learning Path</label>
                            <input type="text" ref={nomeRef} className="form-control border-light bg-light py-3 rounded-3 fs-5" defaultValue={data.nome} />
                        </div>
                        <div className="mb-4 text-start">
                            <label className="fw-bold text-muted small text-uppercase mb-2">Descrição</label>
                            <textarea ref={descRef} className="form-control border-light bg-light py-3 rounded-3" rows="6" defaultValue={data.desc}></textarea>
                        </div>
                        <div className="d-flex gap-4 justify-content-center mt-4">
                            <button onClick={handleSalvar} className="btn btn-primary px-5 py-2 rounded-pill fw-bold fs-5 d-flex align-items-center gap-2" style={{backgroundColor: '#5D78FF'}}>
                                <i className="bi bi-check-lg"></i> {isEditMode ? 'Guardar Alterações' : 'Criar Learning Path'}
                            </button>
                            <button className="btn btn-outline-primary px-5 py-2 rounded-pill fw-bold fs-5 border-2" onClick={() => setShowModalLP(false)}>Cancelar e Voltar</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const RenderModalSL = () => {
        const data = isEditMode ? estrutura.serviceLines.find(s => s.id === slSelecionada) : { nome: '', desc: '', lpId: lpSelecionado || '' };
        const nomeRef = useRef(null);
        const descRef = useRef(null);
        const lpRef = useRef(null);

        const handleSalvar = async () => {
            try {
                if(isEditMode) {
                    await axios.put(`https://softinsa-api-riya.onrender.com/estrutura/service-line/${data.id}`, {
                        nome: nomeRef.current.value,
                        desc: descRef.current.value,
                        lpId: lpRef.current.value
                    });
                } else {
                    await axios.post('https://softinsa-api-riya.onrender.com/estrutura/service-line', {
                        nome: nomeRef.current.value,
                        desc: descRef.current.value,
                        lpId: lpRef.current.value,
                        adminId: adminUser.ID_UTILIZADOR
                    });
                }
                setShowModalSL(false);
                carregarDados();
            } catch(e) { alert("Erro ao guardar SL"); }
        };

        return (
            <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1080 }}>
                <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div className="modal-content border-0 rounded-5 p-5 shadow-lg">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h2 className="fw-bold m-0">{isEditMode ? 'Editar' : 'Criar Nova'} Service Line</h2>
                            <button type="button" className="btn-close" onClick={() => setShowModalSL(false)}></button>
                        </div>
                        <div className="mb-4 text-start">
                            <label className="fw-bold text-muted small text-uppercase mb-2">Nome da Service Line</label>
                            <input type="text" ref={nomeRef} className="form-control border-light bg-light py-3 rounded-3 fs-5" defaultValue={data.nome} />
                        </div>
                        <div className="mb-4 text-start">
                            <label className="fw-bold text-muted small text-uppercase mb-2">Learning Path Associado</label>
                            <select ref={lpRef} className="form-select border-light bg-light py-3 rounded-3 fs-5" defaultValue={data.lpId}>
                                {estrutura.learningPaths.map(lp => <option key={lp.id} value={lp.id}>{lp.nome}</option>)}
                            </select>
                        </div>
                        <div className="mb-4 text-start">
                            <label className="fw-bold text-muted small text-uppercase mb-2">Descrição</label>
                            <textarea ref={descRef} className="form-control border-light bg-light py-3 rounded-3" rows="5" defaultValue={data.desc}></textarea>
                        </div>
                        <div className="d-flex gap-4 justify-content-center mt-4">
                            <button onClick={handleSalvar} className="btn btn-primary px-5 py-2 rounded-pill fw-bold fs-5 d-flex align-items-center gap-2" style={{backgroundColor: '#5D78FF'}}>
                                <i className="bi bi-check-lg"></i> {isEditMode ? 'Guardar Alterações' : 'Criar Service Line'}
                            </button>
                            <button className="btn btn-outline-primary px-5 py-2 rounded-pill fw-bold fs-5 border-2" onClick={() => setShowModalSL(false)}>Cancelar e Voltar</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const RenderModalArea = () => {
        const areaMock = isEditMode ? estrutura.areas.find(a => a.id === areaAtivaEdicao) : { nome: '', slId: slSelecionada || '', niveisPadrao: [], niveisAtivos: [], requisitos: [] };
        const nomeRef = useRef(null);
        const slRef = useRef(null);

        const handleSalvar = async () => {
            try {
                if(isEditMode) {
                    await axios.put(`https://softinsa-api-riya.onrender.com/estrutura/area/${areaMock.id}`, {
                        nome: nomeRef.current.value,
                        slId: slRef.current.value
                    });
                } else {
                    await axios.post('https://softinsa-api-riya.onrender.com/estrutura/area', {
                        nome: nomeRef.current.value,
                        slId: slRef.current.value,
                        userId: adminUser.ID_UTILIZADOR
                    });
                }
                setShowModalArea(false);
                carregarDados();
            } catch(e) { alert("Erro ao guardar Área"); }
        };

        return (
            <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1080 }}>
                <div className="modal-dialog modal-dialog-centered modal-xl">
                    <div className="modal-content border-0 rounded-5 p-5 shadow-lg">
                        <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                            <h2 className="fw-bold m-0">{isEditMode ? 'Editar' : 'Criar Nova'} Área de Competência</h2>
                            <button type="button" className="btn-close shadow-none fs-4" onClick={() => setShowModalArea(false)}></button>
                        </div>
                        <div className="row g-5">
                            <div className="col-md-6 border-end text-start">
                                <div className="mb-4">
                                    <label className="fw-bold text-muted small text-uppercase mb-2">Nome da Área</label>
                                    <input type="text" ref={nomeRef} className="form-control border-light bg-light py-2 rounded-3 fs-5" defaultValue={isEditMode ? areaMock.nome : ''} />
                                </div>
                                <div className="mb-5">
                                    <label className="fw-bold text-muted small text-uppercase mb-2">Service Line Associada</label>
                                    <select ref={slRef} className="form-select border-light bg-light py-2 rounded-3 fs-5" defaultValue={isEditMode ? areaMock.slId : slSelecionada || ''}>
                                        {estrutura.serviceLines.map(sl => <option key={sl.id} value={sl.id}>{sl.nome}</option>)}
                                    </select>
                                </div>
                                {isEditMode && (
                                    <div className="mt-2">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <label className="fw-bold text-muted small text-uppercase m-0">Níveis Ativos para esta Área</label>
                                            <div className="d-flex gap-2">
                                                <button className="btn btn-sm btn-outline-danger rounded-pill px-3 fw-bold" onClick={() => eliminarNivelMaisAlto(areaMock.id)}>- Remover Topo</button>
                                                <button className="btn btn-sm btn-light border rounded-pill px-3 fw-bold" onClick={() => adicionarNovoNivelGlobal(areaMock.id)}>+ Novo Nível</button>
                                            </div>
                                        </div>
                                        <div className="d-flex flex-wrap gap-3">
                                            {areaMock.niveisAtivos.map(n => {
                                                const letra = getLetraParaNivel(n, areaMock);
                                                return (
                                                    <span key={n} className="badge bg-primary fs-6 px-3 py-2 rounded-pill shadow-sm" style={{backgroundColor: '#5D78FF'}}>
                                                        Nível {n} ({letra})
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="col-md-6 text-start">
                                {isEditMode ? (
                                    <>
                                        <label className="fw-bold text-muted small text-uppercase mb-3 d-block">Requisitos de Cada Nível</label>
                                        <div className="bg-light p-4 rounded-4" style={{maxHeight: '400px', overflowY: 'auto'}}>
                                            {areaMock.niveisAtivos.map(n => {
                                                const letra = getLetraParaNivel(n, areaMock);
                                                return (
                                                    <div key={n} className="mb-4">
                                                        <h6 className="fw-bold text-secondary mb-3"><i className="bi bi-stack me-2"></i>Nível {n} ({letra})</h6>
                                                        <div className="d-flex flex-column gap-2 mb-3">
                                                            {areaMock.requisitos.filter(r => r.letra === letra).map((req, idx) => (
                                                                <div key={req.dbId} className="input-group shadow-sm border-0">
                                                                    <input type="text" readOnly className="form-control border-light py-2 fs-6" defaultValue={`Requisito ${req.letra}${idx + 1} - ${req.desc}`} />
                                                                    <button className="btn btn-white text-danger border shadow-sm px-3" onClick={() => eliminarRequisito(req.dbId)}><i className="bi bi-trash3-fill"></i></button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <button className="btn btn-primary btn-sm rounded-pill px-4 py-2 fw-bold" style={{backgroundColor: '#5D78FF'}} onClick={() => { prepararNovoRequisito(letra, areaMock.id); setShowModalArea(false); }}>+ Adicionar Requisito ({letra}n)</button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                ) : (
                                    <div className="d-flex h-100 justify-content-center align-items-center text-muted">
                                        <p>Para gerir Níveis e Requisitos, edite a Área depois de a criar.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="d-flex gap-4 justify-content-center mt-5 pt-4 border-top">
                            <button onClick={handleSalvar} className="btn btn-primary px-5 py-2 rounded-pill fw-bold fs-5 shadow d-flex align-items-center gap-2" style={{backgroundColor: '#5D78FF', border: 'none'}}>
                                <i className="bi bi-check-lg"></i> {isEditMode ? 'Guardar Alterações' : 'Criar Nova Área'}
                            </button>
                            <button className="btn btn-outline-primary px-5 py-2 rounded-pill fw-bold fs-5 border-2" onClick={() => setShowModalArea(false)}>Cancelar e Voltar</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="d-flex bg-light min-vh-100">
            <SidebarAdmin />
            <div className="flex-grow-1 p-4 dashboard-scroll text-start">
                <div className="container-fluid px-4 pb-5">
                    <CabecalhoDashboard 
                        titulo="Gestão da Estrutura e Hierarquia da Plataforma"
                        subtitulo="Gerir Learning Paths, Service Lines, Áreas e Níveis"
                        utilizador={adminUser}
                        avatarUrl={avatarUrl}
                    />

                    <div className="row g-4 mb-4">
                        {/* COLUNAS PRINCIPAIS */}
                        <div className="col-md-4">
                            <div className="bg-white p-4 rounded-4 border shadow-sm h-100 position-relative pb-5" style={{minHeight: '80vh'}}>
                                <h4 className="fw-bold mb-4">1. Learning Path</h4>
                                {estrutura.learningPaths.map(lp => (
                                    <div key={lp.id} onClick={() => handleLPChange(lp.id)}
                                        className={`card p-4 mb-3 border-2 cursor-pointer transition-all ${lpSelecionado === lp.id ? 'border-primary bg-primary bg-opacity-10 shadow-sm' : 'border-light bg-white'}`}
                                        style={{ borderRadius: '20px' }}>
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <h6 className="fw-bold m-0 fs-5">{lp.nome}</h6>
                                            <div className="d-flex gap-2">
                                                <i className="bi bi-pencil-square text-muted hover-primary" style={{cursor: 'pointer'}} onClick={(e) => { e.stopPropagation(); setIsEditMode(true); setLpSelecionado(lp.id); setShowModalLP(true); }}></i>
                                                <i className="bi bi-trash3 text-muted hover-danger" style={{cursor: 'pointer'}} onClick={(e) => { e.stopPropagation(); eliminarLP(lp.id); }}></i>
                                            </div>
                                        </div>
                                        <p className="small text-muted mb-0">{lp.desc}</p>
                                    </div>
                                ))}
                                <div className="position-absolute bottom-0 start-0 w-100 p-3 text-center">
                                    <button onClick={() => { setIsEditMode(false); setShowModalLP(true); }} className="btn btn-primary w-90 rounded-pill fw-bold shadow py-3" style={{ backgroundColor: '#5D78FF', border: 'none' }}>+ Novo Learning Path</button>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-4">
                            <div className="bg-white p-4 rounded-4 border shadow-sm h-100 position-relative pb-5" style={{minHeight: '80vh'}}>
                                <h4 className="fw-bold mb-4">2. Service Lines</h4>
                                {estrutura.serviceLines.filter(sl => sl.lpId === lpSelecionado).map(sl => (
                                    <div key={sl.id} onClick={() => setSlSelecionada(sl.id)}
                                        className={`card p-4 mb-3 border-2 cursor-pointer transition-all ${slSelecionada === sl.id ? 'border-primary bg-primary bg-opacity-10 shadow-sm' : 'border-light bg-white'}`}
                                        style={{ borderRadius: '20px' }}>
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <h6 className="fw-bold m-0 fs-5">{sl.nome}</h6>
                                            <div className="d-flex gap-2">
                                                <i className="bi bi-pencil-square text-muted hover-primary" style={{cursor: 'pointer'}} onClick={(e) => { e.stopPropagation(); setIsEditMode(true); setSlSelecionada(sl.id); setShowModalSL(true); }}></i>
                                                <i className="bi bi-trash3 text-muted hover-danger" style={{cursor: 'pointer'}} onClick={(e) => { e.stopPropagation(); eliminarSL(sl.id); }}></i>
                                            </div>
                                        </div>
                                        <p className="small text-muted mb-0">{sl.desc}</p>
                                    </div>
                                ))}
                                <div className="position-absolute bottom-0 start-0 w-100 p-3 text-center">
                                    <button onClick={() => { setIsEditMode(false); setShowModalSL(true); }} className="btn btn-primary w-90 rounded-pill fw-bold shadow py-3" style={{ backgroundColor: '#5D78FF', border: 'none' }}>+ Adicionar Service Line</button>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-4">
                            <div className="bg-white p-4 rounded-4 border shadow-sm h-100 position-relative pb-5" style={{minHeight: '80vh'}}>
                                <h4 className="fw-bold mb-4">3. Áreas e Níveis</h4>
                                {slSelecionada && estrutura.areas.filter(a => a.slId === slSelecionada).map(area => (
                                    <div key={area.id} className="card p-4 mb-4 border-light bg-white rounded-4 shadow-sm border-2">
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <h6 className="fw-bold text-dark m-0 fs-5">Área: {area.nome}</h6>
                                            <div className="d-flex gap-2">
                                                <i className="bi bi-pencil-square text-primary cursor-pointer" onClick={() => { setIsEditMode(true); setAreaAtivaEdicao(area.id); setShowModalArea(true); }}></i>
                                                <i className="bi bi-trash3 text-danger cursor-pointer" onClick={() => eliminarArea(area.id)}></i>
                                            </div>
                                        </div>
                                        <div className="d-flex justify-content-between">
                                            <div>
                                                <p className="small fw-bold text-muted mb-2">Níveis Ativos:</p>
                                                <div className="d-flex flex-wrap gap-2 mb-3">
                                                    {area.niveisAtivos.map(n => {
                                                        const letra = getLetraParaNivel(n, area);
                                                        return (
                                                            <div key={n} className="d-inline-flex flex-column mb-3 me-4">
                                                                <span className="badge bg-primary fs-6 px-3 py-2 rounded-pill shadow-sm mb-2" style={{backgroundColor: '#5D78FF'}}>
                                                                    Nível {n} ({letra})
                                                                </span>
                                                                <span onClick={() => prepararNovoRequisito(letra, area.id)} className="extra-small text-primary fw-bold d-block cursor-pointer mb-1" style={{ fontSize: '10px', textAlign: 'center' }}>+ Req. ({letra}n)</span>
                                                            </div>
                                                        );
                                                    })}
                                                    <div onClick={() => adicionarNovoNivelGlobal(area.id)} className="rounded-3 border border-dashed border-primary text-primary d-flex align-items-center justify-content-center cursor-pointer" style={{ width: '35px', height: '35px' }} title="Adicionar Nível"><i className="bi bi-plus-lg"></i></div>
                                                    {area.niveisAtivos.length > 0 && <div onClick={() => eliminarNivelMaisAlto(area.id)} className="rounded-3 border border-dashed border-danger text-danger d-flex align-items-center justify-content-center cursor-pointer" style={{ width: '35px', height: '35px' }} title="Remover Nível mais alto"><i className="bi bi-dash-lg"></i></div>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="border-top pt-3 mt-2">
                                            {area.niveisAtivos.map(n => {
                                                const letra = getLetraParaNivel(n, area);
                                                const requisitosDoNivel = area.requisitos.filter(r => r.letra === letra);
                                                return (
                                                    <div key={n}>
                                                        {requisitosDoNivel.length > 0 && (
                                                            <div className="small text-muted mb-2">
                                                                <span className="fw-bold text-dark">{requisitosDoNivel.length}x</span> Requisitos nível {letra}
                                                            </div>
                                                        )}
                                                        {requisitosDoNivel.map((req, idx) => (
                                                            <div key={req.dbId} className="d-flex align-items-center gap-2 mb-2 bg-light p-2 rounded-3 border">
                                                                <i className="bi bi-trash3 text-danger small cursor-pointer" onClick={() => eliminarRequisito(req.dbId)}></i>
                                                                <p className="extra-small m-0 text-dark fw-bold">Requisito {req.letra}{idx + 1}: <span className="text-muted fw-normal">{req.desc}</span></p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            })}
                                            {areaAtivaEdicao === area.id && inputRequisito.nivel && (
                                                <div className="input-group input-group-sm mt-3 shadow-sm border rounded-3 overflow-hidden">
                                                    <span className="input-group-text bg-primary text-white border-0 fw-bold">{inputRequisito.nivel}n</span>
                                                    <input type="text" className="form-control border-0 bg-light py-2" placeholder={inputRequisito.placeholder} value={inputRequisito.desc} onChange={(e) => setInputRequisito({...inputRequisito, desc: e.target.value})} autoFocus />
                                                    <button className="btn btn-primary px-3" onClick={submeterNovoRequisito}><i className="bi bi-check-lg"></i></button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <div className="position-absolute bottom-0 start-0 w-100 p-3 text-center">
                                    <button onClick={() => { setIsEditMode(false); setShowModalArea(true); }} className="btn btn-primary w-90 rounded-pill fw-bold shadow py-3" style={{ backgroundColor: '#5D78FF', border: 'none' }}>+ Criar Área de Competência</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {showModalLP && <RenderModalLP />}
            {showModalSL && <RenderModalSL />}
            {showModalArea && <RenderModalArea />}
        </div>
    );
};

export default EstruturaGlobalAdmin;
