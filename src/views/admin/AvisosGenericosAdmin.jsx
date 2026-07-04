import React, { useState, useEffect } from 'react';
import SidebarAdmin from '../../components/SidebarAdmin';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import TabelaGenerica from '../../components/TabelaGenerica';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../../assets/dashboard.css';

const AvisosGenericosAdmin = () => {
    const navigate = useNavigate();
    const [adminUser, setAdminUser] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState('https://via.placeholder.com/45');
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [avisoSelecionado, setAvisoSelecionado] = useState(null);
    const [avisos, setAvisos] = useState([]);

    const fetchAvisos = async () => {
        try {
            const res = await axios.get('https://softinsa-api-riya.onrender.com/avisos');
            if (res.data.success) {
                setAvisos(res.data.data);
            }
        } catch (error) {
            console.error("Erro ao carregar avisos:", error);
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
                const res = await axios.get(`https://softinsa-api-riya.onrender.com/users/configuracoes/${userLocal.ID_UTILIZADOR}`);
                if (res.data.success && res.data.data.avatar) setAvatarUrl(res.data.data.avatar);
            } catch (err) {
                console.error("Erro ao carregar avatar:", err);
            }
        };

        fetchAvatar();
        fetchAvisos();
    }, [navigate]);

    const avisosAtivos = avisos.filter(a => a.status === "Ativo");

    const toggleStatus = async (id) => {
        try {
            const res = await axios.put(`https://softinsa-api-riya.onrender.com/avisos/${id}/status`);
            if (res.data.success) {
                fetchAvisos(); // Recarrega
                setShowModal(false);
            }
        } catch (error) {
            console.error("Erro ao alterar status:", error);
            alert("Erro ao alterar o estado do aviso.");
        }
    };

    const handleDeleteAviso = async (id) => {
        if (!window.confirm("Tem a certeza que deseja eliminar este aviso permanentemente?")) return;
        try {
            const res = await axios.delete(`https://softinsa-api-riya.onrender.com/avisos/${id}`);
            if (res.data.success) {
                fetchAvisos();
                setShowModal(false);
            }
        } catch (error) {
            console.error("Erro ao eliminar aviso:", error);
            alert("Erro ao eliminar o aviso.");
        }
    };

    const handleEdit = (aviso) => {
        setAvisoSelecionado(aviso);
        setIsEditMode(true);
        setIsReadOnly(false);
        setShowModal(true);
    };

    const handleViewDetails = (aviso) => {
        setAvisoSelecionado(aviso);
        setIsEditMode(false);
        setIsReadOnly(true);
        setShowModal(true);
    };

    const handleSaveAviso = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const payload = {
            titulo: formData.get('titulo'),
            mensagem: formData.get('mensagem'),
            visibilidade: formData.get('visibilidade'),
            status: formData.get('status')
        };

        try {
            if (isEditMode && avisoSelecionado) {
                await axios.put(`https://softinsa-api-riya.onrender.com/avisos/${avisoSelecionado.id}`, payload);
            } else {
                await axios.post('https://softinsa-api-riya.onrender.com/avisos', payload);
            }
            setShowModal(false);
            fetchAvisos();
        } catch (error) {
            console.error("Erro ao guardar aviso:", error);
            alert("Erro ao guardar o aviso.");
        }
    };

    // --- COMPONENTE MODAL ---
    const RenderModalAviso = () => (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1080 }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content border-0 rounded-5 p-5 shadow-lg text-start">
                    <form onSubmit={handleSaveAviso}>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h2 className="fw-bold m-0" style={{ fontSize: '1.8rem' }}>
                                {isReadOnly ? 'Detalhes do Aviso' : isEditMode ? 'Editar Conteúdo do Aviso' : 'Criar Novo Aviso'}
                            </h2>
                            <button type="button" className="btn-close shadow-none" onClick={() => setShowModal(false)}></button>
                        </div>
                        
                        <div className="mb-4">
                            <label className="fw-bold text-dark mb-2 fs-5">Mensagem do Aviso</label>
                            <textarea 
                                name="mensagem"
                                className={`form-control border-2 py-3 rounded-4 ${isReadOnly ? 'bg-light' : ''}`} 
                                rows="6" 
                                disabled={isReadOnly}
                                placeholder="Escreva aqui a Mensagem Completa do Aviso..."
                                defaultValue={avisoSelecionado?.mensagem || ''}
                                required
                            ></textarea>
                        </div>

                        <div className="row g-4 mb-4">
                            <div className="col-md-6">
                                <label className="fw-bold small text-muted text-uppercase mb-2">Título do Aviso:</label>
                                <input 
                                    name="titulo"
                                    type="text" 
                                    className={`form-control border-2 py-2 ${isReadOnly ? 'bg-light' : ''}`} 
                                    disabled={isReadOnly}
                                    defaultValue={avisoSelecionado?.titulo || ''} 
                                    required
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="fw-bold small text-muted text-uppercase mb-2">Visibilidade:</label>
                                <select name="visibilidade" className={`form-select border-2 py-2 ${isReadOnly ? 'bg-light' : ''}`} disabled={isReadOnly} defaultValue={avisoSelecionado?.visibilidade || 'Todos'}>
                                    <option value="Todos">Todos</option>
                                    <option value="Apenas Consultores">Apenas Consultores</option>
                                    <option value="Talent + SLL">Talent + SLL</option>
                                    <option value="Apenas Administradores">Apenas Administradores</option>
                                </select>
                            </div>
                            <div className="col-md-6">
                                <label className="fw-bold small text-muted text-uppercase mb-2">Data Publicação:</label>
                                <input 
                                    type="text" 
                                    className={`form-control border-2 py-2 bg-light`} 
                                    disabled={true}
                                    value={avisoSelecionado?.data || new Date().toLocaleDateString('pt-PT')} 
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="fw-bold small text-muted text-uppercase mb-2">Status Aviso:</label>
                                <select name="status" className={`form-select border-2 py-2 ${isReadOnly ? 'bg-light' : ''}`} disabled={isReadOnly} defaultValue={avisoSelecionado?.status || 'Ativo'}>
                                    <option value="Ativo">Ativo</option>
                                    <option value="Inativo">Inativo</option>
                                </select>
                            </div>
                        </div>

                        {/* Botões de ação: Ocultos se for apenas visualização */}
                        {!isReadOnly && (
                            <div className="d-flex gap-4 justify-content-center mt-4">
                                <button type="submit" className="btn btn-primary px-4 py-1 rounded-pill fw-semibold fs-6 shadow" style={{backgroundColor: '#5D78FF', border: 'none'}}>
                                    {isEditMode ? '✓ Atualizar Aviso' : 'Publicar Aviso'}
                                </button>
                                <button type="button" className="btn btn-outline-secondary px-4 py-1 rounded-pill fw-semibold fs-6 border-2" onClick={() => setShowModal(false)}>Cancelar</button>
                            </div>
                        )}
                        
                        {isReadOnly && (
                            <div className="d-flex gap-3 justify-content-center mt-4">
                                {avisoSelecionado?.status === 'Inativo' && (
                                    <button type="button" className="btn btn-success px-4 py-1 rounded-pill fw-semibold fs-6 shadow" onClick={() => toggleStatus(avisoSelecionado.id)}>
                                        <i className="bi bi-arrow-counterclockwise me-2"></i>Voltar a Ativar
                                    </button>
                                )}
                                <button type="button" className="btn btn-danger px-4 py-1 rounded-pill fw-semibold fs-6 shadow" onClick={() => handleDeleteAviso(avisoSelecionado.id)}>
                                    <i className="bi bi-trash3 me-2"></i>Eliminar Aviso
                                </button>
                                <button type="button" className="btn btn-outline-secondary px-4 py-1 rounded-pill fw-semibold fs-6 border-2" onClick={() => setShowModal(false)}>
                                    Fechar Visualização
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );

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
                        titulo="Gestão de Avisos Genéricos"
                        subtitulo="Crie, edite e acompanhe todos os avisos públicos da plataforma."
                        utilizador={adminUser}
                        avatarUrl={avatarUrl}
                    />

                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h3 className="fw-bold m-0 text-dark">Avisos Ativos</h3>
                        <button onClick={() => { setIsEditMode(false); setIsReadOnly(false); setAvisoSelecionado(null); setShowModal(true); }} className="btn btn-primary px-4 py-2 rounded-3 fw-bold shadow-sm border-0" style={{backgroundColor: '#5D78FF'}}>
                            + Criar Novo Aviso
                        </button>
                    </div>
                    <div className="mb-5">
                        <TabelaGenerica colunas={['Título de Publicação', 'Visibilidade', 'Data de Publicação', 'Ações']} emptyMessage="Sem avisos ativos.">
                            {avisosAtivos.slice(0, 5).map(a => (
                                <tr key={a.id}>
                                    <td className="fw-bold text-dark py-4">{a.titulo}</td>
                                    <td className="text-muted py-4">{a.visibilidade}</td>
                                    <td className="text-muted py-4">{a.data}</td>
                                    <td className="py-4">
                                        <div className="d-flex flex-column gap-1 align-items-center">
                                            <button onClick={() => handleEdit(a)} className="btn btn-primary btn-sm rounded-pill px-4 fw-bold w-75 shadow-sm" style={{backgroundColor: '#5D78FF', fontSize: '11px', border: 'none'}}>Editar Conteúdo</button>
                                            <button onClick={() => toggleStatus(a.id)} className="btn btn-danger btn-sm rounded-pill px-4 fw-bold w-75 shadow-sm" style={{backgroundColor: '#E85353', fontSize: '11px', border: 'none'}}>Desativar Aviso</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </TabelaGenerica>
                        <div className="p-3 bg-light text-center border-top small fw-bold text-muted">Página 1 de 1</div>
                    </div>

                    {/* TABELA 2: HISTÓRICO */}
                    <h3 className="fw-bold mb-4 text-dark mt-5">Histórico de Avisos</h3>
                    <div className="mb-4">
                        <TabelaGenerica colunas={['Título de Publicação', 'Visibilidade', 'Data de Publicação', 'Status', 'Ações']} emptyMessage="Sem histórico de avisos.">
                            {avisos.map(a => (
                                <tr key={`hist-${a.id}`}>
                                    <td className="fw-bold text-dark py-4">{a.titulo}</td>
                                    <td className="text-muted py-4">{a.visibilidade}</td>
                                    <td className="text-muted py-4">{a.data}</td>
                                    <td className="py-4">
                                        <span className={`badge rounded-pill px-3 py-2 ${a.status === 'Ativo' ? 'bg-success' : 'bg-danger'} bg-opacity-75`}>
                                            {a.status}
                                        </span>
                                    </td>
                                    <td className="py-4">
                                        <button onClick={() => handleViewDetails(a)} className="btn btn-primary btn-sm rounded-pill px-4 fw-bold shadow-sm" style={{backgroundColor: '#5D78FF', border: 'none'}}>Ver detalhes</button>
                                    </td>
                                </tr>
                            ))}
                        </TabelaGenerica>
                        <div className="p-3 bg-light text-center border-top small fw-bold text-muted">Página 1 de 1</div>
                    </div>
                </div>
            </div>
            {showModal && <RenderModalAviso />}
        </div>
    );
};

export default AvisosGenericosAdmin;
