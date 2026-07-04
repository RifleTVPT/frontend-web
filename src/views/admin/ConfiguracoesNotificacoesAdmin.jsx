import React, { useState, useEffect } from 'react';
import SidebarAdmin from '../../components/SidebarAdmin';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../../assets/dashboard.css';

const EVENTOS_NOTIFICACAO = [
    { id: 'badges', label: 'Badges Atribuídos', icon: 'bi-patch-check' },
    { id: 'pedidos', label: 'Novos Pedidos de Badge', icon: 'bi-file-earmark-plus' },
    { id: 'validacao', label: 'Alteração de Estado de Pedido', icon: 'bi-arrow-left-right' },
    { id: 'expiracao', label: 'Alertas de Expiração', icon: 'bi-clock-history' },
    { id: 'contas', label: 'Gestão de Contas (Registos/Acessos)', icon: 'bi-person-gear' },
    { id: 'avisos', label: 'Avisos Genéricos da Administração', icon: 'bi-megaphone' },
    { id: 'objetivos', label: 'Lembretes de Objetivos e Timeline', icon: 'bi-bullseye' }
];
const PERFIS_NOTIFICACAO = ['Consultor', 'Talent Manager', 'SLL', 'Administrador'];
const criarMatrizPadrao = () => Object.fromEntries(
    EVENTOS_NOTIFICACAO.map(evento => [
        evento.id,
        Object.fromEntries(PERFIS_NOTIFICACAO.map(perfil => [
            perfil,
            { email: true, push: true }
        ]))
    ])
);

const ConfiguracoesNotificacoesAdmin = () => {
    const navigate = useNavigate();
    const [adminUser, setAdminUser] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState('https://via.placeholder.com/45');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testingSmtp, setTestingSmtp] = useState(false);

    // Estado para os Toggles Globais
    const [globalEmail, setGlobalEmail] = useState(true);
    const [globalPush, setGlobalPush] = useState(true);

    // Estado da matriz
    const [matriz, setMatriz] = useState({});
    const [smtpHost, setSmtpHost] = useState('');
    const [smtpPort, setSmtpPort] = useState(587);
    const [smtpUser, setSmtpUser] = useState('');
    const [smtpPass, setSmtpPass] = useState('');
    const [smtpSecure, setSmtpSecure] = useState(false);

    // Definições de eventos de notificação
    useEffect(() => {
        const userLocal = JSON.parse(sessionStorage.getItem('user'));
        if (!userLocal) { navigate('/'); return; }
        setAdminUser(userLocal);

        const fetchAvatar = async () => {
            try {
                const res = await axios.get(`http://localhost:3000/users/configuracoes/${userLocal.ID_UTILIZADOR}`);
                if (res.data.success && res.data.data.avatar) setAvatarUrl(res.data.data.avatar);
            } catch (err) {
                console.error("Erro ao carregar avatar:", err);
            }
        };

        const fetchConfiguracoes = async () => {
            try {
                const res = await axios.get('http://localhost:3000/configuracoes');
                if (res.data.success && res.data.data) {
                    const cfg = res.data.data;
                    setGlobalEmail(cfg.GLOBAL_EMAIL ?? true);
                    setGlobalPush(cfg.GLOBAL_PUSH ?? true);
                    if (cfg.MATRIZ_NOTIFICACOES) {
                        try {
                            setMatriz(JSON.parse(cfg.MATRIZ_NOTIFICACOES));
                        } catch (error) {
                            console.error('Matriz de notificações inválida:', error);
                            setMatriz({});
                        }
                    } else {
                        // Predefinir tudo a true se não existir
                        setMatriz(criarMatrizPadrao());
                    }
                    if (cfg.SMTP_HOST) setSmtpHost(cfg.SMTP_HOST);
                    if (cfg.SMTP_PORT) setSmtpPort(cfg.SMTP_PORT);
                    if (cfg.SMTP_USER) setSmtpUser(cfg.SMTP_USER);
                    if (cfg.SMTP_PASS) setSmtpPass(cfg.SMTP_PASS);
                    if (cfg.SMTP_SECURE !== undefined) setSmtpSecure(cfg.SMTP_SECURE);
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

    const handleToggleMatriz = (eventoId, perfil, tipo) => {
        setMatriz(prev => {
            const newState = JSON.parse(JSON.stringify(prev));
            if (!newState[eventoId]) newState[eventoId] = {};
            if (!newState[eventoId][perfil]) newState[eventoId][perfil] = { email: true, push: true };
            
            newState[eventoId][perfil][tipo] = !newState[eventoId][perfil][tipo];
            return newState;
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await axios.put('http://localhost:3000/configuracoes', {
                GLOBAL_EMAIL: globalEmail,
                GLOBAL_PUSH: globalPush,
                MATRIZ_NOTIFICACOES: JSON.stringify(matriz),
                SMTP_HOST: smtpHost,
                SMTP_PORT: smtpPort,
                SMTP_USER: smtpUser,
                SMTP_PASS: smtpPass,
                SMTP_SECURE: smtpSecure
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

    const handleRestaurar = async () => {
        if(window.confirm("Tem a certeza que deseja restaurar as opções para o padrão (tudo ativo)?")) {
            const defaultMatriz = criarMatrizPadrao();
            setGlobalEmail(true);
            setGlobalPush(true);
            setMatriz(defaultMatriz);
            setSmtpHost('');
            setSmtpPort(587);
            setSmtpUser('');
            setSmtpPass('');
            setSmtpSecure(false);
            setSaving(true);
            try {
                await axios.put('http://localhost:3000/configuracoes', {
                    GLOBAL_EMAIL: true,
                    GLOBAL_PUSH: true,
                    MATRIZ_NOTIFICACOES: JSON.stringify(defaultMatriz),
                    SMTP_HOST: null,
                    SMTP_PORT: 587,
                    SMTP_USER: null,
                    SMTP_PASS: null,
                    SMTP_SECURE: false
                });
                alert('Padrões restaurados e gravados com sucesso.');
            } catch (error) {
                console.error('Erro ao restaurar padrões:', error);
                alert(error.response?.data?.message || 'Não foi possível restaurar as configurações.');
            } finally {
                setSaving(false);
            }
        }
    };

    const handleTestarSmtp = async () => {
        setTestingSmtp(true);
        try {
            const res = await axios.post('http://localhost:3000/configuracoes/testar-email', {
                SMTP_HOST: smtpHost,
                SMTP_PORT: smtpPort,
                SMTP_USER: smtpUser,
                SMTP_PASS: smtpPass,
                SMTP_SECURE: smtpSecure
            });
            alert(res.data.message);
        } catch (error) {
            alert(error.response?.data?.message || 'Não foi possível estabelecer a ligação SMTP.');
        } finally {
            setTestingSmtp(false);
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
                <div className="container-fluid px-4">
                    <CabecalhoDashboard 
                        titulo="Gestão de Notificações"
                        subtitulo="Configure as regras de disparo de alertas por email e push para a plataforma."
                        utilizador={adminUser}
                        avatarUrl={avatarUrl}
                    />

                    {/* CONTROLOS GLOBAIS */}
                    <div className="row g-4 mb-5">
                        <div className="col-md-6">
                            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white border-start border-5 border-primary">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="bg-primary bg-opacity-10 p-3 rounded-circle">
                                            <i className="bi bi-envelope-paper text-primary fs-4"></i>
                                        </div>
                                        <div>
                                            <h5 className="fw-bold m-0">Serviço de Email (SMTP)</h5>
                                            <small className="text-muted">Estado: <span className={`fw-bold ${globalEmail ? 'text-success' : 'text-danger'}`}>{globalEmail ? 'Ativo' : 'Inativo'}</span></small>
                                        </div>
                                    </div>
                                    <div className="form-check form-switch fs-3">
                                        <input
                                            id="globalEmail"
                                            aria-label="Ativar envio global de emails"
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={globalEmail}
                                            onChange={() => setGlobalEmail(!globalEmail)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white border-start border-5 border-info">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="bg-info bg-opacity-10 p-3 rounded-circle">
                                            <i className="bi bi-bell text-info fs-4"></i>
                                        </div>
                                        <div>
                                            <h5 className="fw-bold m-0">Notificações Push / Web</h5>
                                            <small className="text-muted">Sistema: <span className={`fw-bold ${globalPush ? 'text-success' : 'text-danger'}`}>{globalPush ? 'Ativo' : 'Inativo'}</span></small>
                                        </div>
                                    </div>
                                    <div className="form-check form-switch fs-3">
                                        <input
                                            id="globalPush"
                                            aria-label="Ativar notificações Push e Web"
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={globalPush}
                                            onChange={() => setGlobalPush(!globalPush)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* MATRIZ DE CONFIGURAÇÃO */}
                    <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-5">
                        <div className="bg-primary p-3">
                            <h5 className="text-white m-0 fw-bold"><i className="bi bi-sliders me-2"></i>Regras de Disparo por Perfil</h5>
                        </div>
                        <div className="table-responsive bg-white">
                            <table className="table table-borderless align-middle mb-0">
                                <thead className="bg-light border-bottom text-center">
                                    <tr>
                                        <th className="text-start ps-4 py-3 fw-bold text-muted small text-uppercase">Evento / Gatilho</th>
                                        {PERFIS_NOTIFICACAO.map(p => (
                                            <th key={p} className="fw-bold text-dark">{p}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {EVENTOS_NOTIFICACAO.map((ev) => (
                                        <tr key={ev.id} className="border-bottom border-light">
                                            <td className="ps-4 py-4">
                                                <div className="d-flex align-items-center gap-3">
                                                    <i className={`bi ${ev.icon} text-primary fs-5`}></i>
                                                    <div>
                                                        <div className="fw-bold text-dark">{ev.label}</div>
                                                        <div className="extra-small text-muted">Email + Push Notification</div>
                                                    </div>
                                                </div>
                                            </td>
                                            {PERFIS_NOTIFICACAO.map(p => {
                                                const isActiveEmail = matriz[ev.id]?.[p]?.email ?? true;
                                                const isActivePush = matriz[ev.id]?.[p]?.push ?? true;
                                                return (
                                                    <td key={p} className="text-center">
                                                        <div className="d-flex justify-content-center gap-2">
                                                            {/* Checkbox para Email */}
                                                            <div title="Notificar por Email">
                                                                <input 
                                                                    type="checkbox" 
                                                                    aria-label={`Email: ${ev.label} — ${p}`}
                                                                    className="form-check-input border-primary" 
                                                                    checked={isActiveEmail} 
                                                                    onChange={() => handleToggleMatriz(ev.id, p, 'email')}
                                                                    style={{width: '20px', height: '20px', cursor: 'pointer'}} 
                                                                />
                                                            </div>
                                                            {/* Checkbox para Push */}
                                                            <div title="Notificar na Plataforma">
                                                                <input 
                                                                    type="checkbox" 
                                                                    aria-label={`Push/Web: ${ev.label} — ${p}`}
                                                                    className="form-check-input border-info" 
                                                                    checked={isActivePush} 
                                                                    onChange={() => handleToggleMatriz(ev.id, p, 'push')}
                                                                    style={{width: '20px', height: '20px', cursor: 'pointer'}} 
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* OPÇÕES AVANÇADAS: SMTP */}
                    <div className="accordion mb-5 shadow-sm rounded-4" id="accordionSMTP">
                        <div className="accordion-item border-0 rounded-4 overflow-hidden">
                            <h2 className="accordion-header" id="headingSMTP">
                                <button className="accordion-button collapsed bg-white fw-bold py-4 text-secondary border-start border-5 border-secondary" type="button" data-bs-toggle="collapse" data-bs-target="#collapseSMTP" aria-expanded="false" aria-controls="collapseSMTP">
                                    <i className="bi bi-gear-fill me-3 fs-5"></i>
                                    Opções Avançadas: Configurações de Servidor de Email (SMTP)
                                </button>
                            </h2>
                            <div id="collapseSMTP" className="accordion-collapse collapse bg-white" aria-labelledby="headingSMTP" data-bs-parent="#accordionSMTP">
                                <div className="accordion-body p-4 border-start border-5 border-secondary">
                                    <div className="d-flex align-items-center gap-3 mb-4 border-bottom pb-3">
                                        <div className="bg-secondary bg-opacity-10 p-3 rounded-circle">
                                            <i className="bi bi-server text-secondary fs-4"></i>
                                        </div>
                                        <div>
                                            <h5 className="fw-bold m-0">Credenciais SMTP</h5>
                                            <small className="text-muted">Defina as credenciais do servidor SMTP que a plataforma irá usar para disparar emails reais para os utilizadores.</small>
                                        </div>
                                    </div>
                                    <div className="row g-4">
                                        <div className="col-md-6">
                                            <label htmlFor="smtpHost" className="fw-bold small text-muted text-uppercase mb-2">Servidor SMTP (Host)</label>
                                            <input 
                                                id="smtpHost"
                                                type="text" 
                                                className="form-control bg-light py-2" 
                                                placeholder="ex: smtp.office365.com"
                                                value={smtpHost}
                                                onChange={(e) => setSmtpHost(e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <label htmlFor="smtpPort" className="fw-bold small text-muted text-uppercase mb-2">Porta SMTP</label>
                                            <input 
                                                id="smtpPort"
                                                type="number" 
                                                className="form-control bg-light py-2" 
                                                placeholder="ex: 587"
                                                value={smtpPort}
                                                onChange={(e) => setSmtpPort(parseInt(e.target.value) || 587)}
                                            />
                                        </div>
                                        <div className="col-md-2 d-flex align-items-end pb-2">
                                            <div className="form-check form-switch">
                                                <input className="form-check-input" type="checkbox" id="smtpSecure" checked={smtpSecure} onChange={() => setSmtpSecure(!smtpSecure)} />
                                                <label className="form-check-label fw-bold small text-muted" htmlFor="smtpSecure">Usar SSL</label>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <label htmlFor="smtpUser" className="fw-bold small text-muted text-uppercase mb-2">Email Remetente (User)</label>
                                            <input 
                                                id="smtpUser"
                                                type="email" 
                                                className="form-control bg-light py-2" 
                                                placeholder="ex: no-reply@softinsa.pt"
                                                value={smtpUser}
                                                onChange={(e) => setSmtpUser(e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label htmlFor="smtpPass" className="fw-bold small text-muted text-uppercase mb-2">Password da Conta</label>
                                            <input 
                                                id="smtpPass"
                                                type="password" 
                                                className="form-control bg-light py-2" 
                                                placeholder="••••••••"
                                                value={smtpPass}
                                                onChange={(e) => setSmtpPass(e.target.value)}
                                            />
                                        </div>
                                        <div className="col-12 d-flex justify-content-end">
                                            <button
                                                type="button"
                                                className="btn btn-outline-primary rounded-pill px-4 fw-bold"
                                                onClick={handleTestarSmtp}
                                                disabled={testingSmtp || saving}
                                            >
                                                <i className="bi bi-send-check me-2"></i>
                                                {testingSmtp ? 'A testar...' : 'Testar ligação e enviar email'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* BOTÕES DE AÇÃO */}
                    <div className="d-flex justify-content-center gap-4 mb-5 pt-3">
                        <button 
                            className="btn btn-primary px-5 py-3 rounded-pill fw-bold shadow-lg fs-5" 
                            style={{backgroundColor: '#5D78FF', border: 'none', minWidth: '280px'}}
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? 'A Gravar...' : 'Guardar Alterações'}
                        </button>
                        <button 
                            className="btn btn-outline-secondary px-5 py-3 rounded-pill fw-bold border-2 fs-5" 
                            style={{minWidth: '280px'}}
                            onClick={handleRestaurar}
                            disabled={saving || testingSmtp}
                        >
                            Restaurar Padrões
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfiguracoesNotificacoesAdmin;
