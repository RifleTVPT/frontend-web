import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import bannerImg from '../assets/login-banner.png';
import '../Login.css';

const PrimeiroAcesso = () => {
    const navigate = useNavigate();
    const [novaPassword, setNovaPassword] = useState('');
    const [confirmarPassword, setConfirmarPassword] = useState('');
    const [erro, setErro] = useState('');
    const [loading, setLoading] = useState(false);
    const [utilizador, setUtilizador] = useState(null);

    useEffect(() => {
        const userLocal = JSON.parse(sessionStorage.getItem('user'));
        if (!userLocal) {
            navigate('/');
            return;
        }
        // Verificar se realmente é o primeiro acesso
        if (!userLocal.firstAccess && userLocal.user?.IS_PRIMEIRO_ACESSO === false) {
            navigate('/dashboard'); // Já não é primeiro acesso
        }
        setUtilizador(userLocal.user);
    }, [navigate]);

    const validarPassword = (password) => {
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/;
        return regex.test(password);
    };

    const handleMudarPassword = async (e) => {
        e.preventDefault();
        setErro('');
        
        if (!novaPassword || !confirmarPassword) return setErro("Preencha todos os campos.");
        if (novaPassword !== confirmarPassword) return setErro("A nova password e a confirmação não coincidem.");
        if (!validarPassword(novaPassword)) return setErro("A password deve ter 8+ caracteres, uma maiúscula, uma minúscula, um número e um caractere especial.");

        setLoading(true);
        try {
            // Nota: Esta rota não exige "passwordAtual" se no backend for ajustado, ou nós enviamos a mesma passwordAtual?
            // O ideal seria criar uma rota dedicada ou ajustar a existente para não pedir password atual no 1º acesso.
            // Para não quebrar a API atual `mudar-password/:id`, enviaremos uma flag no body.
            // Contudo, como não sabemos a password atual (o user acabou de logar, mas não a temos no state), vamos ter de usar o JWT Token para forçar.
            // Felizmente, podemos usar a mesma rota, passando a "passwordAtual" vazia SE o backend não a exigir neste fluxo.
            
            // Vamos fazer um PUT simples para atualizar a password (requer auth header)
            const token = JSON.parse(sessionStorage.getItem('user'))?.token;
            
            const response = await axios.put(
                `https://softinsa-api-riya.onrender.com/users/mudar-password/${utilizador.ID_UTILIZADOR}`, 
                { passwordAtual: 'PRIMEIRO_ACESSO_OVERRIDE', novaPassword: novaPassword },
                { headers: { Authorization: `Bearer ${token}` } } // O backend pode rejeitar se a password atual falhar, temos de fixar isso no backend
            );

            if (response.data.success) {
                alert("Password alterada com sucesso! Bem-vindo(a) à plataforma.");
                const userLocalStorage = JSON.parse(sessionStorage.getItem('user'));
                userLocalStorage.firstAccess = false;
                userLocalStorage.user.IS_PRIMEIRO_ACESSO = false;
                sessionStorage.setItem('user', JSON.stringify(userLocalStorage));
                
                // Redireciona com base no perfil
                if (utilizador.PERFIL_UTILIZADOR === "Talent Manager" || utilizador.PERFIL_UTILIZADOR === "TM") navigate('/talent-manager/dashboard');
                else if (utilizador.PERFIL_UTILIZADOR === "Service Line Leader" || utilizador.PERFIL_UTILIZADOR === "SLL") navigate('/sll/dashboard');
                else if (utilizador.PERFIL_UTILIZADOR === "Administrador" || utilizador.PERFIL_UTILIZADOR === "Admin") navigate('/admin/dashboard');
                else navigate('/dashboard');
            }
        } catch (error) {
            setErro(error.response?.data?.message || "Ocorreu um erro ao alterar a password.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-fluid auth-page p-0 bg-white">
            <div className="d-flex auth-layout flex-nowrap">
                {/* LADO ESQUERDO: FORMULÁRIO */}
                <div className="login-form-side d-flex flex-column justify-content-center align-items-center px-5 bg-white shadow-lg">
                    <div style={{ maxWidth: '500px', width: '100%' }}>
                        <div className="text-center mb-4">
                            <div className="bg-warning bg-opacity-10 p-3 rounded-circle d-inline-block mb-3">
                                <i className="bi bi-shield-lock-fill fs-1 text-warning"></i>
                            </div>
                            <h3 className="fw-bold mb-1 text-dark">Primeiro Acesso</h3>
                            <p className="text-muted small mb-4">
                                Olá, <span className="fw-bold text-dark">{utilizador?.NOME_COMPLETO_UTILIZADOR}</span>. <br/>
                                Por motivos de segurança, é obrigatório alterar a sua password gerada automaticamente antes de aceder à plataforma.
                            </p>
                        </div>
                        
                        {erro && (
                            <div className="alert alert-danger py-2 small fw-bold text-center" role="alert">
                                <i className="bi bi-exclamation-triangle-fill me-2"></i>{erro}
                            </div>
                        )}

                        <form onSubmit={handleMudarPassword}>
                            <div className="mb-3">
                                <label className="form-label small fw-bold text-dark">Nova Password</label>
                                <input 
                                    type="password" 
                                    className="form-control login-input border-0 shadow-none bg-light" 
                                    placeholder="Introduza a nova password" 
                                    required 
                                    value={novaPassword}
                                    onChange={(e) => setNovaPassword(e.target.value)} 
                                />
                                <small className="text-muted d-block mt-1" style={{fontSize: '11px'}}>
                                    Deve conter mín. 8 caracteres, 1 maiúscula, 1 minúscula, 1 número e 1 especial (@$!%*?&).
                                </small>
                            </div>
                            <div className="mb-4">
                                <label className="form-label small fw-bold text-dark">Confirmar Password</label>
                                <input 
                                    type="password" 
                                    className="form-control login-input border-0 shadow-none bg-light" 
                                    placeholder="Repita a password" 
                                    required 
                                    value={confirmarPassword}
                                    onChange={(e) => setConfirmarPassword(e.target.value)} 
                                />
                            </div>

                            <button type="submit" disabled={loading} className="btn btn-warning w-100 fw-bold mb-3 shadow-sm py-3 text-dark">
                                {loading ? 'A Guardar...' : 'Atualizar e Entrar'}
                            </button>
                            <button type="button" className="btn btn-light w-100 text-muted small border-0" onClick={() => { sessionStorage.removeItem('user'); navigate('/'); }}>
                                Cancelar e Terminar Sessão
                            </button>
                        </form>
                    </div>
                </div>

                {/* LADO DIREITO: BANNER */}
                <div className="login-banner-side" style={{ 
                    backgroundImage: `url(${bannerImg})`,
                    backgroundColor: '#335fce'
                }}></div>
            </div>
        </div>
    );
};

export default PrimeiroAcesso;
