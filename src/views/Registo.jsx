import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import "../Login.css";
import bannerImg from '../assets/login-banner.png';

const Registo = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        nome: '',
        password: '',
        confirmarPassword: '',
        perfis: [],
        slId: '',
        areaId: '',
        motivacao: '' // Novo campo
    });

    const [estrutura, setEstrutura] = useState({ serviceLines: [], areas: [] });
    const [showPoliticas, setShowPoliticas] = useState(false);
    const [politicasText, setPoliticasText] = useState('A carregar políticas do Administrador...');

    useEffect(() => {
        axios.get('https://softinsa-api-riya.onrender.com/estrutura')
            .then(res => {
                if (res.data.success) {
                    setEstrutura(res.data.data);
                    // Pre-selecionar os primeiros se existirem (removido para forçar escolha manual)
                }
            })
            .catch(err => console.error(err));
    }, []);

    const fetchPoliticas = async () => {
        setShowPoliticas(true);
        try {
            const res = await axios.get('https://softinsa-api-riya.onrender.com/configuracoes/rgpd');
            if (res.data.success && res.data.data) {
                const termos = res.data.data.RGPD_TERMOS || 'Termos e condições não definidos.';
                const politicas = res.data.data.RGPD_POLITICAS || 'Políticas de privacidade não definidas.';
                setPoliticasText(`--- TERMOS E CONDIÇÕES ---\n\n${termos}\n\n\n--- POLÍTICAS RGPD ---\n\n${politicas}`);
            } else {
                setPoliticasText('Políticas não definidas pelo Administrador.');
            }
        } catch (error) {
            setPoliticasText('Não foi possível carregar as políticas no momento.');
        }
    };

    const perfisDisponiveis = ["Consultor", "Talent Manager", "Service Line Leader"];

    const togglePerfil = (p) => {
        const novosPerfis = formData.perfis.includes(p)
            ? formData.perfis.filter(i => i !== p)
            : [...formData.perfis, p];
        setFormData({ ...formData, perfis: novosPerfis });
    };

    // Lógica de bloqueio baseada nos perfis selecionados
    const temPerfil = formData.perfis.length > 0;
    const isConsultor = formData.perfis.includes("Consultor");
    const isSLL = formData.perfis.includes("Service Line Leader");
    // Talent puro (sem ser consultor nem SLL) bloqueia tudo
    const isTalentPuro = formData.perfis.includes("Talent Manager") && !isConsultor && !isSLL;

    const validarPassword = (password) => {
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/;
        return regex.test(password);
    };

    const handleRegisto = async (e) => {
        e.preventDefault();
        if (!temPerfil) return alert("Selecione pelo menos um perfil.");
        if (!isTalentPuro && !formData.slId) return alert("É obrigatório selecionar uma Service Line para o(s) perfil(is) escolhido(s).");
        if (isConsultor && !formData.areaId) return alert("É obrigatório selecionar uma Área de Aprendizagem para o perfil de Consultor.");
        
        if (formData.password !== formData.confirmarPassword) {
            return alert("A password e a confirmação de password não coincidem.");
        }
        if (!validarPassword(formData.password)) {
            return alert("A password deve ter pelo menos 8 caracteres, uma letra maiúscula, uma letra minúscula, um número e um caractere especial.");
        }
        
        try {
            const perfilString = formData.perfis.join(' / ');
            
            const slName = isTalentPuro ? 'N/A' : (estrutura.serviceLines.find(s => s.id.toString() === formData.slId.toString())?.nome || 'N/A');
            const areaName = !isConsultor ? 'N/A' : (estrutura.areas.find(a => a.id.toString() === formData.areaId.toString())?.nome || 'N/A');

            const res = await axios.post('https://softinsa-api-riya.onrender.com/users/register', {
                nome: formData.nome,
                email: formData.email,
                password: formData.password,
                perfil: perfilString,
                slRegisto: slName,
                areaRegisto: areaName,
                motivacao: formData.motivacao
            });

            if (res.data.success) {
                alert(res.data.message);
                navigate('/');
            }
        } catch (error) {
            console.error(error);
            alert("Erro ao tentar submeter o registo: " + (error.response?.data?.message || error.message));
        }
    };

    return (
        <div className="container-fluid vh-100 p-0 overflow-hidden bg-white">
            <div className="d-flex h-100 flex-nowrap">
                
                {/* LADO ESQUERDO: FORMULÁRIO (Igual ao Login) */}
                <div className="login-form-side d-flex flex-column justify-content-center align-items-center px-5 bg-white shadow-lg" style={{ overflowY: 'auto' }}>
                    <div style={{ maxWidth: '570px', width: '100%', padding: '20px 0' }}>
                        <div className="mb-4 text-start">
                            <h2 className="fw-bold text-primary mb-0" style={{ letterSpacing: '-1px', fontSize: '2.5rem' }}>
                                SOFT<span style={{ color: '#7DD3FC' }}>I</span>NSA
                            </h2>
                        </div>
                        
                        <div className="text-start">
                            <h3 className="fw-bold mb-1 text-dark">Registo</h3>
                            <p className="text-muted small mb-4">Crie o seu pedido de acesso à plataforma.</p>
                            
                            <form onSubmit={handleRegisto}>
                                <div className="row g-3">
                                    {/* Nome e Email */}
                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold text-dark">Nome Completo</label>
                                        <input type="text" className="form-control login-input border-0 shadow-none" placeholder="O seu nome" required value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold text-dark">Email Profissional</label>
                                        <input type="email" className="form-control login-input border-0 shadow-none" placeholder="email@softinsa.pt" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                                    </div>

                                    {/* Seleção de Perfil (Botões Estilo Figma Pedidos) */}
                                    <div className="col-12">
                                        <label className="form-label small fw-bold text-dark d-block">Perfil Desejado (Selecione um ou mais)</label>
                                        <div className="d-flex gap-2 flex-wrap">
                                            {perfisDisponiveis.map(p => (
                                                <button 
                                                    key={p} 
                                                    type="button" 
                                                    onClick={() => togglePerfil(p)}
                                                    className={`btn btn-sm rounded-pill px-3 fw-bold transition-all ${formData.perfis.includes(p) ? 'btn-primary shadow-sm' : 'btn-outline-primary'}`}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Service Line e Área - Com lógica de bloqueio */}
                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold text-dark">Service Line</label>
                                        <select 
                                            className="form-select login-input border-0 shadow-none"
                                            disabled={!temPerfil || isTalentPuro}
                                            value={isTalentPuro ? "" : formData.slId}
                                            onChange={(e) => setFormData({...formData, slId: e.target.value, areaId: ''})}
                                        >
                                            {isTalentPuro ? <option value="">Não aplicável</option> : <option value="">Selecione uma Service Line</option>}
                                            {!isTalentPuro && estrutura.serviceLines.map(sl => (
                                                <option key={sl.id} value={sl.id}>{sl.nome}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold text-dark">Área de Aprendizagem</label>
                                        <select 
                                            className="form-select login-input border-0 shadow-none"
                                            disabled={!isConsultor}
                                            value={!isConsultor ? "" : formData.areaId}
                                            onChange={(e) => setFormData({...formData, areaId: e.target.value})}
                                        >
                                            {!isConsultor && <option value="">Não aplicável</option>}
                                            {isConsultor && <option value="">Selecione uma Área</option>}
                                            {isConsultor && estrutura.areas.filter(a => a.slId == formData.slId).map(area => (
                                                <option key={area.id} value={area.id}>{area.nome}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Campo de Motivação */}
                                    <div className="col-md-12 mt-3">
                                        <label className="form-label small fw-bold text-dark">Motivação / Mensagem para o Administrador</label>
                                        <textarea 
                                            className="form-control login-input border-0 shadow-none" 
                                            placeholder="Explique resumidamente por que motivo está a pedir o registo na plataforma..." 
                                            rows="3"
                                            style={{resize: 'none'}}
                                            value={formData.motivacao}
                                            onChange={(e) => setFormData({...formData, motivacao: e.target.value})}
                                        ></textarea>
                                    </div>

                                    {/* Passwords */}
                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold text-dark">Password</label>
                                        <input type="password"  className="form-control login-input border-0 shadow-none" placeholder="............" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
                                        <small className="text-muted d-block mt-1" style={{fontSize: '11px'}}>
                                            Mín. 8 caracteres, 1 maiúscula, 1 minúscula, 1 número e 1 especial (@$!%*?&).
                                        </small>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold text-dark">Repetir Password</label>
                                        <input type="password"  className="form-control login-input border-0 shadow-none" placeholder="............" required value={formData.confirmarPassword} onChange={(e) => setFormData({...formData, confirmarPassword: e.target.value})} />
                                    </div>
                                </div>

                                <div className="mt-4 mb-4">
                                    <p className="text-muted" style={{ fontSize: '13px' }}>
                                        Ao registar-se está a concordar com os <span onClick={fetchPoliticas} className="text-primary fw-bold cursor-pointer text-decoration-underline">Termos e Políticas</span> estabelecidos pelo Administrador.
                                    </p>
                                </div>

                                <button type="submit" className="btn login-btn-primary w-100 text-white fw-bold mb-4 shadow-sm">Solicitar Registo</button>
                            </form>

                            <div className="text-center">
                                <p className="small text-muted">Já tem uma conta? <span onClick={() => navigate('/')} className="text-primary fw-bold cursor-pointer text-decoration-none">Faça Login</span></p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* LADO DIREITO: BANNER (Exatamente igual ao Login) */}
                <div className="login-banner-side" style={{ 
                    backgroundImage: `url(${bannerImg})`,
                    backgroundColor: '#335fce',
                    flex: '1'
                }}>
                </div>
            </div>

            {/* MODAL DE POLÍTICAS DO ADMIN */}
            {showPoliticas && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 rounded-4 shadow">
                            <div className="modal-header border-0 pb-0">
                                <h5 className="fw-bold text-primary"><i className="bi bi-shield-lock-fill me-2"></i> Políticas do Administrador</h5>
                                <button type="button" className="btn-close" onClick={() => setShowPoliticas(false)}></button>
                            </div>
                            <div className="modal-body py-4">
                                <div className="p-4 bg-light rounded-3" style={{maxHeight: '400px', overflowY: 'auto', whiteSpace: 'pre-line'}}>
                                    {politicasText}
                                </div>
                            </div>
                            <div className="modal-footer border-0 pt-0">
                                <button type="button" className="btn btn-primary px-4 fw-bold rounded-pill" onClick={() => setShowPoliticas(false)}>Compreendi</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Registo;
