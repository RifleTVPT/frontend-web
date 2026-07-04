import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import bannerImg from '../assets/login-banner.png';
import "../Login.css";

const RecuperarPassword = () => {
    const navigate = useNavigate();
    
    const [passo, setPasso] = useState(1); // 1 = Email, 2 = Nova Password, 3 = Sucesso
    const [email, setEmail] = useState('');
    const [novaPassword, setNovaPassword] = useState('');
    const [confirmarPassword, setConfirmarPassword] = useState('');
    const [erro, setErro] = useState('');
    const [loading, setLoading] = useState(false);

    const verificarEmail = async (e) => {
        e.preventDefault();
        setErro('');
        
        if (!email) {
            setErro('Preencha o campo Email.');
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post('https://softinsa-api-riya.onrender.com/users/verificar-email-recuperacao', { email });
            if (res.data.success) setPasso(2);
        } catch (err) {
            setErro('Email não associado a um utilizador registado.');
        } finally {
            setLoading(false);
        }
    };

    const redefinirPassword = async (e) => {
        e.preventDefault();
        setErro('');

        if (!novaPassword || !confirmarPassword) {
            setErro('Preencha todos os campos obrigatórios.');
            return;
        }

        if (novaPassword !== confirmarPassword) {
            setErro('As passwords não coincidem.');
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post('https://softinsa-api-riya.onrender.com/users/recuperar-password', { email, novaPassword, confirmarPassword });
            if (res.data.success) {
                setPasso(3);
            } else {
                setErro(res.data.message || 'Erro ao redefinir a password.');
            }
        } catch (err) {
            setErro(err.response?.data?.message || 'Ocorreu um erro ao redefinir a password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-fluid vh-100 p-0 overflow-hidden bg-white">
            <div className="d-flex h-100 flex-nowrap">
                
                {/* LADO ESQUERDO: FORMULÁRIO */}
                <div className="login-form-side d-flex flex-column justify-content-center align-items-center px-5 bg-white shadow-lg">
                    <div style={{ maxWidth: '570px', width: '100%' }}>
                        <div className="mb-5 text-start">
                            <h2 className="fw-bold text-primary mb-0" style={{ letterSpacing: '-1px', fontSize: '2.5rem' }}>
                                SOFT<span style={{ color: '#7DD3FC' }}>I</span>NSA
                            </h2>
                        </div>
                        
                        <div className="text-start">
                            <h3 className="fw-bold mb-1 text-dark">Recuperar Password</h3>
                            
                            {passo === 1 && (
                                <>
                                    <p className="text-muted small mb-4">Introduza o seu email associado à conta para iniciar a recuperação.</p>
                                    
                                    {erro && (
                                        <div className="alert alert-danger py-2 small fw-bold" role="alert">
                                            <i className="bi bi-exclamation-triangle-fill me-2"></i>{erro}
                                        </div>
                                    )}

                                    <form onSubmit={verificarEmail}>
                                        <div className="mb-4">
                                            <label className="form-label small fw-bold text-dark">Email Profissional</label>
                                            <input 
                                                type="email" 
                                                className="form-control login-input border-0 shadow-none" 
                                                placeholder="Introduza o seu Email" 
                                                required 
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)} 
                                            />
                                        </div>

                                        <button type="submit" disabled={loading} className="btn login-btn-primary w-100 text-white fw-bold mb-3 shadow-sm">
                                            {loading ? 'A verificar...' : 'Avançar'}
                                        </button>
                                        <button type="button" onClick={() => navigate('/')} className="btn btn-outline-secondary w-100 fw-bold shadow-sm">
                                            Cancelar
                                        </button>
                                    </form>
                                </>
                            )}

                            {passo === 2 && (
                                <>
                                    <p className="text-muted small mb-4">Redefina agora a sua nova password de acesso à Plataforma.</p>
                                    
                                    {erro && (
                                        <div className="alert alert-danger py-2 small fw-bold" role="alert">
                                            <i className="bi bi-exclamation-triangle-fill me-2"></i>{erro}
                                        </div>
                                    )}

                                    <form onSubmit={redefinirPassword}>
                                        <div className="mb-3">
                                            <label className="form-label small fw-bold text-dark">Nova Password</label>
                                            <input 
                                                type="password" 
                                                className="form-control login-input border-0 shadow-none" 
                                                placeholder="Introduza a nova password" 
                                                required 
                                                value={novaPassword}
                                                onChange={(e) => setNovaPassword(e.target.value)} 
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <label className="form-label small fw-bold text-dark">Confirmar Password</label>
                                            <input 
                                                type="password" 
                                                className="form-control login-input border-0 shadow-none" 
                                                placeholder="Repita a password" 
                                                required 
                                                value={confirmarPassword}
                                                onChange={(e) => setConfirmarPassword(e.target.value)} 
                                            />
                                        </div>

                                        <button type="submit" disabled={loading} className="btn login-btn-primary w-100 text-white fw-bold mb-3 shadow-sm">
                                            {loading ? 'A guardar...' : 'Redefinir Password'}
                                        </button>
                                        <button type="button" onClick={() => navigate('/')} className="btn btn-outline-secondary w-100 fw-bold shadow-sm">
                                            Cancelar
                                        </button>
                                    </form>
                                </>
                            )}

                            {passo === 3 && (
                                <div className="text-center mt-4">
                                    <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '4rem' }}></i>
                                    <h4 className="fw-bold mt-3 text-success">Sucesso</h4>
                                    <p className="text-muted small">A sua password foi redefinida com sucesso.</p>
                                    <button onClick={() => navigate('/')} className="btn login-btn-primary w-100 text-white fw-bold mt-4 shadow-sm">
                                        Voltar ao Login
                                    </button>
                                </div>
                            )}

                        </div>
                    </div>
                </div>

                {/* LADO DIREITO: BANNER */}
                <div className="login-banner-side" style={{ 
                    backgroundImage: `url(${bannerImg})`,
                    backgroundColor: '#335fce'
                    }} >
                </div>
            </div>
        </div>
    );
};

export default RecuperarPassword;
