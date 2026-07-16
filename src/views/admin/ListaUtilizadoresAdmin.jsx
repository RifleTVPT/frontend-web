import React, { useState, useRef, useEffect } from 'react';
import SidebarAdmin from '../../components/SidebarAdmin';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import TabelaGenerica from '../../components/TabelaGenerica';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../assets/dashboard.css';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ListaUtilizadoresAdmin = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    
    // --- ESTADOS DE UTILIZADOR ADMIN ---
    const [adminUser, setAdminUser] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState('https://via.placeholder.com/40');

    // --- ESTADOS DOS DADOS ---
    const [utilizadoresBD, setUtilizadoresBD] = useState([]);
    const [estrutura, setEstrutura] = useState({ serviceLines: [], areas: [] });
    
    // --- ESTADOS DOS FILTROS ---
    const [pesquisa, setPesquisa] = useState('');
    const [filtroFuncao, setFiltroFuncao] = useState('Função');
    const [filtroSL, setFiltroSL] = useState('Service Line');
    const [filtroArea, setFiltroArea] = useState('Área');

    // Alterado: "perfis" agora é um array
    const [novoUser, setNovoUser] = useState({
        nome: '', email: '', perfis: ['Consultor'], sl: 'Todas', area: 'Todas', password: '', confirmarPassword: ''
    });

    useEffect(() => {
        const userLocal = JSON.parse(sessionStorage.getItem('user'));
        if (!userLocal) { navigate('/'); return; }
        
        setAdminUser(userLocal);

        const fetchData = async () => {
            try {
                const [resAdmin, resUtilizadores, resEstrutura] = await Promise.all([
                    axios.get(`https://softinsa-api-riya.onrender.com/users/configuracoes/${userLocal.ID_UTILIZADOR}`),
                    axios.get('https://softinsa-api-riya.onrender.com/admin-users/lista'),
                    axios.get('https://softinsa-api-riya.onrender.com/estrutura')
                ]);
                
                if (resAdmin.data.success && resAdmin.data.data.avatar) {
                    setAvatarUrl(resAdmin.data.data.avatar);
                }
                
                if (resUtilizadores.data.success) {
                    setUtilizadoresBD(resUtilizadores.data.data);
                }
                
                if (resEstrutura.data.success) {
                    setEstrutura(resEstrutura.data.data);
                }
            } catch (error) {
                console.error("Erro ao carregar dados:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [navigate]);

    const carregarUtilizadores = async () => {
        try {
            const res = await axios.get('https://softinsa-api-riya.onrender.com/admin-users/lista');
            if (res.data.success) {
                setUtilizadoresBD(res.data.data);
            }
        } catch (error) {
            console.error("Erro ao carregar lista", error);
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem('user');
        navigate('/');
    };

    const valorEstruturaValido = (valor) => {
        const normalizado = String(valor || '').trim();
        return normalizado && !['Todas', 'N/A', 'Global', 'Service Line', 'Área'].includes(normalizado);
    };

    const resumoFiltrosExportacao = () => ([
        { Filtro: 'Pesquisa', Valor: pesquisa || 'Sem pesquisa' },
        { Filtro: 'Função', Valor: filtroFuncao },
        { Filtro: 'Service Line', Valor: filtroSL },
        { Filtro: 'Área', Valor: filtroArea },
        { Filtro: 'Total exportado', Valor: filtrados.length }
    ]);

    // --- LÓGICA DE CRIAÇÃO DE UTILIZADOR ---
    const handleCriarUtilizador = async () => {
        if(!novoUser.nome || !novoUser.email || !novoUser.password || novoUser.perfis.length === 0) {
            return alert("Preencha os campos obrigatórios e selecione pelo menos um perfil.");
        }
        
        if (novoUser.password !== novoUser.confirmarPassword) {
            return alert('A password temporária e a confirmação não coincidem.');
        }

        const precisaServiceLine = novoUser.perfis.includes('Consultor') || novoUser.perfis.includes('Service Line Leader');
        if (precisaServiceLine && !valorEstruturaValido(novoUser.sl)) {
            return alert('Selecione uma Service Line para criar este utilizador.');
        }
        if (novoUser.perfis.includes('Consultor') && !valorEstruturaValido(novoUser.area)) {
            return alert('Selecione uma Área para criar um utilizador Consultor.');
        }

        let finalSL = isDisabled('sl') ? 'Global' : novoUser.sl;
        
        let finalArea = isDisabled('area') ? 'Global' : novoUser.area;

        try {
            const payload = {
                nome: novoUser.nome,
                email: novoUser.email,
                perfis: novoUser.perfis,
                sl: finalSL,
                area: finalArea,
                passwordTemporaria: novoUser.password
            };
            const response = await axios.post('https://softinsa-api-riya.onrender.com/admin-users/criar', payload);
            if (response.data.success) {
                alert("Utilizador criado com sucesso!");
                setShowModal(false);
                setNovoUser({ nome: '', email: '', perfis: ['Consultor'], sl: 'Todas', area: 'Todas', password: '', confirmarPassword: '' });
                carregarUtilizadores(); 
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Erro ao criar utilizador.');
            console.error(error);
        }
    };

    const handleCheckboxPerfil = (perfil) => {
        setNovoUser(prev => {
            const hasPerfil = prev.perfis.includes(perfil);
            let newPerfis = hasPerfil ? prev.perfis.filter(p => p !== perfil) : [...prev.perfis, perfil];
            return { ...prev, perfis: newPerfis };
        });
    };

    // CORREÇÃO INFALÍVEL DE CORES
    const getStatusBadge = (status) => {
        const text = (status || '').toLowerCase();
        const isInativo = text.includes('inativ');
        const isAtivo = text.includes('ativ') && !isInativo;
        const bg = isAtivo ? '#82D674' : (isInativo ? '#E85353' : '#F3D458');
        return <span className="badge rounded-pill px-3 py-2 text-white fw-bold shadow-sm" style={{ backgroundColor: bg, minWidth: '90px' }}>{status}</span>;
    };

    const handleSLChange = (e) => {
        const sl = e.target.value;
        setNovoUser({ ...novoUser, sl: sl, area: 'N/A' });
    };

    const isDisabled = (campo) => {
        if (campo === 'sl') return !novoUser.perfis.includes('Consultor') && !novoUser.perfis.includes('Service Line Leader');
        if (campo === 'area') return !novoUser.perfis.includes('Consultor');
        return false;
    };

    const filtrados = utilizadoresBD.filter(u => {
        const matchesPesquisa = u.nome.toLowerCase().includes(pesquisa.toLowerCase()) || u.email.toLowerCase().includes(pesquisa.toLowerCase());
        const matchesFuncao = filtroFuncao === 'Função' || u.perfis.includes(filtroFuncao);
        const matchesSL = filtroSL === 'Service Line' || u.sl === filtroSL;
        const matchesArea = filtroArea === 'Área' || u.area === filtroArea;
        return matchesPesquisa && matchesFuncao && matchesSL && matchesArea;
    });

    const areasParaFiltro = filtroSL !== 'Service Line' && filtroSL !== 'Global' 
        ? estrutura.areas.filter(a => a.sl === filtroSL || estrutura.serviceLines.find(s => s.id === a.slId)?.nome === filtroSL)
        : estrutura.areas;

    const exportarExcel = () => {
        if(filtrados.length === 0) return alert('Sem dados para exportar');
        const ws = XLSX.utils.json_to_sheet(filtrados.map(u => ({
            Nome: u.nome, 'E-mail': u.email, Perfil: u.perfis.join(', '), 
            'Service Line': u.perfis.includes('Consultor') || u.perfis.includes('Service Line Leader') ? u.sl : 'Global (Não definida)', 
            'Área': u.perfis.includes('Consultor') ? u.area : 'Global (Não definida)',
            Estado: u.status, 'Último Acesso': u.acesso
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumoFiltrosExportacao()), "Filtros");
        XLSX.utils.book_append_sheet(wb, ws, "Utilizadores");
        XLSX.writeFile(wb, `Lista_Utilizadores_${new Date().toISOString().slice(0,10)}.xlsx`);
    };

    const exportarPDF = () => {
        if(filtrados.length === 0) return alert('Sem dados para exportar');
        const doc = new jsPDF('l', 'mm', 'a4'); 
        doc.setFontSize(18);
        doc.text(`Listagem de Utilizadores`, 14, 20);
        doc.setFontSize(10);
        doc.text(`Filtros: Pesquisa=${pesquisa || 'Sem pesquisa'} | Função=${filtroFuncao} | SL=${filtroSL} | Área=${filtroArea}`, 14, 28);
        
        autoTable(doc, {
            startY: 34,
            head: [['Nome', 'Email', 'Perfil', 'Service Line', 'Área', 'Estado', 'Último Acesso']],
            body: filtrados.map(u => [
                u.nome, 
                u.email,
                u.perfis.join(', '), 
                u.perfis.includes('Consultor') || u.perfis.includes('Service Line Leader') ? (u.sl || 'N/A') : 'Global (Não definida)', 
                u.perfis.includes('Consultor') ? (u.area || 'N/A') : 'Global (Não definida)', 
                u.status, 
                u.acesso
            ]),
            theme: 'grid',
            styles: { fontSize: 8, cellWidth: 'wrap', overflow: 'linebreak' },
            headStyles: { fillColor: [93, 120, 255] }
        });
        doc.save(`Lista_Utilizadores_${new Date().toISOString().slice(0,10)}.pdf`);
    };

    if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="d-flex bg-light min-vh-100">
            <SidebarAdmin />
            <div className="flex-grow-1 p-4 dashboard-scroll text-start">
                <div className="container-fluid px-md-4">
                    
                    {/* CABEÇALHO PADRONIZADO ADMIN */}
                    <CabecalhoDashboard 
                        titulo="Lista de Utilizadores e Permissões"
                        subtitulo="Gerir os utilizadores, os seus papéis e acessos."
                        utilizador={adminUser}
                        avatarUrl={avatarUrl}
                    />

                    {/* Barra de Pesquisa e Criar Utilizador */}
                    <div className="row g-3 mb-4 align-items-center">
                        <div className="col-md-9">
                            <div className="position-relative shadow-sm">
                                <input type="text" className="form-control admin-search-input border-0 py-3 ps-4 rounded-3" 
                                       placeholder="Pesquisar por Nome / Service Line" 
                                       value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} />
                                <i className="bi bi-search position-absolute end-0 top-50 translate-middle-y me-3 text-muted"></i>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <button onClick={() => setShowModal(true)} className="btn btn-primary w-100 py-3 fw-bold shadow-sm rounded-3" style={{backgroundColor: '#5D78FF', border: 'none'}}>
                                + Criar Novo Utilizador
                            </button>
                        </div>
                    </div>

                    {/* Filtros de Pesquisa */}
                    <h5 className="fw-bold mb-3 small text-muted text-uppercase">Filtros de Pesquisa</h5>
                    <div className="row g-3 mb-5">
                        <div className="col-md-3">
                            <select className="form-select border shadow-sm py-2" value={filtroFuncao} onChange={(e) => setFiltroFuncao(e.target.value)}>
                                <option>Função</option>
                                <option>Consultor</option>
                                <option>Service Line Leader</option>
                                <option>Talent Manager</option>
                                <option>Administrador</option>
                            </select>
                        </div>
                        <div className="col-md-3">
                            <select className="form-select border shadow-sm py-2" value={filtroSL} onChange={(e) => setFiltroSL(e.target.value)}>
                                <option>Service Line</option>
                                {estrutura.serviceLines.map(sl => (
                                    <option key={sl.id} value={sl.nome}>{sl.nome}</option>
                                ))}
                                <option value="Global">Global</option>
                            </select>
                        </div>
                        <div className="col-md-3">
                            <select className="form-select border shadow-sm py-2" value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)}>
                                <option>Área</option>
                                {areasParaFiltro.map(a => (
                                    <option key={a.id} value={a.nome}>{a.nome}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-3">
                            <div className="dropdown w-100">
                                <button className="btn btn-light bg-white border w-100 py-2 fw-bold text-muted shadow-sm d-flex justify-content-center align-items-center gap-2" 
                                        type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                    <i className="bi bi-download"></i> Exportar Lista
                                </button>
                                <ul className="dropdown-menu w-100 shadow border-0 rounded-3 mt-2">
                                    <li><button className="dropdown-item py-2 fw-bold text-danger" onClick={exportarPDF}><i className="bi bi-file-earmark-pdf-fill me-2 fs-5"></i> Exportar para PDF</button></li>
                                    <li><button className="dropdown-item py-2 fw-bold text-success" onClick={exportarExcel}><i className="bi bi-file-earmark-excel-fill me-2 fs-5"></i> Exportar para Excel</button></li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Tabela Profissional */}
                    <h5 className="fw-bold mb-3 text-dark">Lista de Utilizadores Registados ({filtrados.length})</h5>
                    <div className="mb-4">
                        <TabelaGenerica colunas={['Nome Utilizador', 'Função / Perfil', 'Service Line', 'Área', 'Último Acesso', 'Estado da Conta', 'Ações']} emptyMessage="Nenhum utilizador encontrado.">
                            {filtrados && filtrados.map(u => {
                                const estadoConta = String(u.status || '').toLowerCase();
                                const contaSemPerfilEditavel = estadoConta.includes('recus') || estadoConta.includes('pendent');
                                return (
                                    <tr key={u.id}>
                                        <td className="fw-bold text-center ps-4">{u.nome}</td>
                                        <td>{u.perfis.join(' / ')}</td>
                                        <td className="text-muted small">{u.perfis.includes('Consultor') || u.perfis.includes('Service Line Leader') ? (u.sl || 'N/A') : 'Global (Não definida)'}</td>
                                        <td className="text-muted small">{u.perfis.includes('Consultor') ? (u.area || 'N/A') : 'Global (Não definida)'}</td>
                                        <td className="small">{u.acesso}</td>
                                        <td>{getStatusBadge(u.status)}</td>
                                        <td>
                                            {contaSemPerfilEditavel ? (
                                                <span className="text-muted small fw-bold">Sem ações</span>
                                            ) : (
                                                <button onClick={() => navigate(`/admin/utilizadores/perfil/${u.id}`)}
                                                        className="btn btn-primary btn-sm rounded-pill px-3 fw-bold shadow-sm text-nowrap"
                                                        style={{backgroundColor: '#5D78FF', border: 'none', minWidth: '86px'}}>Ver Perfil</button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </TabelaGenerica>
                    </div>
                </div>
            </div>

            {/* MODAL: CRIAR UTILIZADOR COM MULTIPLOS PERFIS */}
            {showModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 rounded-4 p-4 shadow-lg">
                            <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                                <h3 className="fw-bold m-0 text-dark">Criar e Configurar Novo Utilizador</h3>
                                <button type="button" className="btn-close shadow-none" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="row g-4 text-start">
                                <div className="col-md-4 text-center border-end">
                                    <h6 className="fw-bold text-muted mb-3 text-start ps-2">Identidade</h6>
                                    <div className="bg-light rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center border" style={{width: '130px', height: '130px', overflow: 'hidden'}}>
                                        {novoUser.nome ? (
                                            <span className="fs-1 fw-bold text-primary">
                                                {novoUser.nome.split(' ').map((n, i, a) => i === 0 || i === a.length - 1 ? n[0] : '').join('').toUpperCase()}
                                            </span>
                                        ) : (
                                            <i className="bi bi-person-fill fs-1 text-secondary opacity-50"></i>
                                        )}
                                    </div>
                                    <small className="text-muted px-3 d-block lh-sm">A foto de perfil poderá ser alterada pelo próprio utilizador.</small>
                                </div>
                                <div className="col-md-8">
                                    <label className="form-label fw-bold small">Nome Completo (*)</label>
                                    <input type="text" className="form-control bg-light border-0 mb-3" placeholder="Nome Completo" 
                                           value={novoUser.nome} onChange={(e) => setNovoUser({...novoUser, nome: e.target.value})} />
                                    
                                    <label className="form-label fw-bold small">Email Profissional (*)</label>
                                    <input type="email" className="form-control bg-light border-0" placeholder="utilizador@pt.softinsa.com" 
                                           value={novoUser.email} onChange={(e) => setNovoUser({...novoUser, email: e.target.value})} />
                                </div>
                                <div className="col-12 mt-2">
                                    <h5 className="fw-bold mb-3 border-bottom pb-2">Perfil e Permissões</h5>
                                    
                                    {/* Múltiplos Perfis com Checkboxes */}
                                    <div className="mb-3">
                                        <label className="small fw-bold mb-2">Selecione os Perfis de Acesso (*):</label>
                                        <div className="d-flex flex-wrap gap-3 p-3 bg-light rounded-3">
                                            {['Consultor', 'Talent Manager', 'Service Line Leader', 'Administrador'].map(p => (
                                                <div key={p} className="form-check m-0">
                                                    <input className="form-check-input shadow-none cursor-pointer" type="checkbox" id={`check-${p}`} 
                                                           checked={novoUser.perfis.includes(p)}
                                                           onChange={() => handleCheckboxPerfil(p)} />
                                                    <label className="form-check-label small fw-bold text-dark cursor-pointer" htmlFor={`check-${p}`}>{p}</label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="small fw-bold text-nowrap">Service Line (se aplicável):</label>
                                            <select className={`form-select border-0 py-2 ${isDisabled('sl') ? 'bg-secondary bg-opacity-25 text-muted' : 'bg-light'}`} 
                                                    disabled={isDisabled('sl')} value={isDisabled('sl') ? 'Global' : novoUser.sl} onChange={handleSLChange}>
                                                {isDisabled('sl') ? (
                                                    <option value="Global">Global</option>
                                                ) : (
                                                    <>
                                                        <option value="Todas">Selecione a Service Line</option>
                                                        {estrutura.serviceLines.map(sl => <option key={sl.id} value={sl.nome}>{sl.nome}</option>)}
                                                    </>
                                                )}
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="small fw-bold">Área (apenas para Consultor):</label>
                                            <select className={`form-select border-0 py-2 ${isDisabled('area') ? 'bg-secondary bg-opacity-25 text-muted' : 'bg-light'}`} 
                                                    disabled={isDisabled('area')} value={isDisabled('area') ? 'Global' : novoUser.area} onChange={(e) => setNovoUser({...novoUser, area: e.target.value})}>
                                                {isDisabled('area') ? (
                                                    <option value="Global">Global</option>
                                                ) : (
                                                    <>
                                                        <option value="N/A">Selecione a Área</option>
                                                        {estrutura.areas.filter(a => {
                                                            const slObj = estrutura.serviceLines.find(s => s.nome === novoUser.sl);
                                                            return slObj && a.slId === slObj.id;
                                                        }).map(a => <option key={a.id} value={a.nome}>{a.nome}</option>)}
                                                    </>
                                                )}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-12 mt-4">
                                    <h5 className="fw-bold mb-3 border-bottom pb-2">Segurança</h5>
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="small fw-bold">Password Temporária (*):</label>
                                            <input type="password" placeholder="Definir Password" 
                                                   className="form-control bg-light border-0 py-2" 
                                                   value={novoUser.password} onChange={(e) => setNovoUser({...novoUser, password: e.target.value})} />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="small fw-bold">Confirmar Password Temporária (*):</label>
                                            <input type="password" placeholder="Repetir Password"
                                                   className="form-control bg-light border-0 py-2"
                                                   value={novoUser.confirmarPassword} onChange={(e) => setNovoUser({...novoUser, confirmarPassword: e.target.value})} />
                                        </div>
                                    </div>
                                </div>
                                <div className="admin-modal-actions col-12 text-center mt-5 mb-2">
                                    <button onClick={handleCriarUtilizador} className="btn btn-primary px-5 py-2 rounded-pill fw-bold shadow-sm me-3" style={{backgroundColor: '#5D78FF', border: 'none'}}>Criar Utilizador</button>
                                    <button className="btn btn-outline-secondary px-5 py-2 rounded-pill fw-bold" onClick={() => setShowModal(false)}>Cancelar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ListaUtilizadoresAdmin;
