import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { resolvePublicBadgeImage, useDefaultBadgeImageOnError } from '../utils/publicBadgeImage';
import AvatarUtilizador from '../components/AvatarUtilizador';

const VerificacaoConquistaEspecial = () => {
    const { idUtilizador, idMarco } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchVerificacao = async () => {
            try {
                const response = await axios.get(`https://softinsa-api-riya.onrender.com/meus-badges/verificacao-especial/${idUtilizador}/${idMarco}`);
                if(response.data.success){
                    setData(response.data.data);
                }
            } catch (err) {
                setError(err.response?.data?.message || "Erro de verificação ou Conquista não encontrada.");
            } finally {
                setLoading(false);
            }
        };
        fetchVerificacao();
    }, [idUtilizador, idMarco]);

    if (loading) return <div className="d-flex justify-content-center align-items-center vh-100" style={{ backgroundColor: '#F4F5F9' }}><div className="spinner-border text-primary"></div></div>;
    if (error) return <div className="d-flex justify-content-center align-items-center vh-100 text-danger fw-bold" style={{ backgroundColor: '#F4F5F9' }}><h3>{error}</h3></div>;

    const { consultor, conquista } = data;

    return (
        <div className="dashboard-scroll" style={{ backgroundColor: '#F4F5F9', minHeight: '100vh', padding: '3rem' }}>
            <div className="container bg-white rounded-4 shadow p-0 mb-5">
                <div className="p-4 text-white d-flex justify-content-between align-items-center" style={{ backgroundColor: '#5D78FF', borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }}>
                    <h2 className="fw-bold m-0">SOFT<span className="text-info">I</span>NSA</h2>
                    <span className="fw-bold pe-3">Verificação de Conquista Especial</span>
                </div>

                <div className="p-5 text-start">
                    <div className="d-flex justify-content-between align-items-center mb-5">
                        <h2 className="fw-bold m-0 text-dark">Conquista Especial - {consultor.nome}</h2>
                        <div className="d-flex gap-2 flex-wrap">
                            <a href="https://www.softinsa.pt/" target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary rounded-pill px-4 fw-bold">
                                Conheça a Softinsa
                            </a>
                            <Link to={`/galeria/${consultor.idUtilizador}`} className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm" style={{backgroundColor: '#5D78FF'}}>Ver Galeria Completa</Link>
                        </div>
                    </div>

                    <div className="row g-5">
                        <div className="col-md-4">
                            <div className="card border-primary p-5 rounded-4 h-100 text-center shadow-sm bg-white">
                                <div className="mb-4 d-flex justify-content-center">
                                    <AvatarUtilizador nome={consultor.nome} foto={consultor.urlFoto} tamanho={120} />
                                </div>
                                <h3 className="fw-bold">{consultor.nome}</h3>
                                <p className="text-muted small mb-1">{consultor.cargo}</p>
                                <p className="text-muted small">{consultor.serviceLine}</p>
                                
                                <div className="mt-4">
                                    <div className="border p-3 rounded-3 mb-3 shadow-sm bg-white">
                                        <div className="small text-muted fw-bold">Classificação Global</div>
                                        <div className="h5 fw-bold text-dark m-0">#{consultor.ranking} de {consultor.totalConsultores}</div>
                                    </div>
                                    <div className="border p-3 rounded-3 mb-3 shadow-sm bg-white">
                                        <div className="small text-muted fw-bold">Badges Ativos</div>
                                        <div className="h5 fw-bold text-dark m-0">{consultor.totalBadges} Badges</div>
                                    </div>
                                    <div className="border p-3 rounded-3 shadow-sm bg-white">
                                        <div className="small text-muted fw-bold">Pontos Totais</div>
                                        <div className="h5 fw-bold text-dark m-0">{consultor.pontosTotais} Pontos</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-8 border rounded-4 p-5 bg-white shadow-sm">
                            <div className="text-center mb-5">
                                <div className="bg-white rounded-circle shadow-sm mx-auto mb-4 mt-3 d-flex align-items-center justify-content-center overflow-hidden" style={{width: '180px', height: '180px', border: '3px solid #D4AF37', backgroundColor: '#F9F1DC'}}>
                                    <img
                                        src={resolvePublicBadgeImage(conquista.urlImagem)}
                                        onError={useDefaultBadgeImageOnError}
                                        alt={conquista.titulo}
                                        className="w-100 h-100"
                                        style={{ objectFit: 'contain', padding: '10px' }}
                                    />
                                </div>
                                <h3 className="fw-bold m-0 mb-3 text-dark">{conquista.titulo}</h3>
                                <div className="text-muted d-flex flex-column gap-1 text-center" style={{fontSize: '15px'}}>
                                  <div><strong className="text-dark">Conquista Especial:</strong> {conquista.tipoMarco}</div>
                                  <div><strong className="text-dark">Pontos Extra:</strong> +{conquista.pontosExtra} Pontos</div>
                                </div>
                            </div>

                            <div className="row text-center mb-5 justify-content-center">
                                <div className="col-6 border-end"><strong>ID da Conquista:</strong><br/><span className="text-muted">ESP-{conquista.id}</span></div>
                                <div className="col-6"><strong>Data de Obtenção:</strong><br/><span className="text-muted">{conquista.dataEmissao}</span></div>
                            </div>

                            <div className="text-center px-4 py-4 rounded-4" style={{ backgroundColor: '#F8F9FA', borderLeft: '5px solid #D4AF37' }}>
                                <i className="bi bi-quote fs-1 text-warning mb-2 d-block"></i>
                                <p className="fst-italic text-muted m-0 fs-5">
                                    "{conquista.descricao}"
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerificacaoConquistaEspecial;
