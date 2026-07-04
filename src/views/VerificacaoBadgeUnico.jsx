import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { resolvePublicBadgeImage, useDefaultBadgeImageOnError } from '../utils/publicBadgeImage';

const VerificacaoBadgeUnico = () => {
    const { linkUnico } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchVerificacao = async () => {
            try {
                // Usa o encodeURIComponent para evitar que barras na string partam a rota
                const response = await axios.get(`http://localhost:3000/meus-badges/verificacao/${encodeURIComponent(linkUnico)}`);
                if(response.data.success){
                    setData(response.data.data);
                }
            } catch (err) {
                setError(err.response?.data?.message || "Erro de verificação ou Badge não encontrado.");
            } finally {
                setLoading(false);
            }
        };
        fetchVerificacao();
    }, [linkUnico]);

    if (loading) return <div className="d-flex justify-content-center align-items-center vh-100" style={{ backgroundColor: '#F4F5F9' }}><div className="spinner-border text-primary"></div></div>;
    if (error) return <div className="d-flex justify-content-center align-items-center vh-100 text-danger fw-bold" style={{ backgroundColor: '#F4F5F9' }}><h3>{error}</h3></div>;

    const { consultor, badge } = data;

    const nivelNameMap = {'A':'Júnior', 'B':'Intermédio', 'C':'Sénior', 'D':'Especialista', 'E':'Líder de Conhecimento'};

    return (
        <div className="dashboard-scroll" style={{ backgroundColor: '#F4F5F9', minHeight: '100vh', padding: '3rem' }}>
            <div className="container bg-white rounded-4 shadow p-0 mb-5">
                <div className="p-4 text-white d-flex justify-content-between align-items-center" style={{ backgroundColor: '#5D78FF', borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }}>
                    <h2 className="fw-bold m-0">SOFT<span className="text-info">I</span>NSA</h2>
                    <span className="fw-bold pe-3">Verificação de Badge Digital</span>
                </div>

                <div className="p-5 text-start">
                    <div className="d-flex justify-content-between align-items-center mb-5">
                        <h2 className="fw-bold m-0 text-dark">Verificação Individual de Badge - {consultor.nome}</h2>
                        <div className="d-flex gap-2">
                            <a href="https://www.softinsa.pt/" target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary rounded-pill px-4 fw-bold">
                                Conheça a Softinsa
                            </a>
                            <Link to={`/galeria/${consultor.idUtilizador}`} className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm" style={{backgroundColor: '#5D78FF'}}>Ver Galeria Completa</Link>
                        </div>
                    </div>

                    <div className="row g-5">
                        <div className="col-md-4">
                            <div className="card border-primary p-5 rounded-4 h-100 text-center shadow-sm bg-white">
                                <div className="bg-light rounded-circle mx-auto mb-4 d-flex align-items-center justify-content-center" style={{width: '120px', height: '120px'}}>
                                    <i className="bi bi-person-fill text-secondary fs-1"></i>
                                </div>
                                <h3 className="fw-bold">{consultor.nome}</h3>
                                <p className="text-muted small mb-1">{consultor.cargo}</p>
                                <p className="text-muted small">{consultor.serviceLine}</p>
                                
                                <div className="mt-4">
                                    <div className="border p-3 rounded-3 mb-3 shadow-sm bg-white">
                                        <div className="small text-muted fw-bold">Classificação Global</div>
                                        <div className="h5 fw-bold text-primary m-0">#{consultor.ranking} de {consultor.totalConsultores}</div>
                                    </div>
                                    <div className="border p-3 rounded-3 mb-3 shadow-sm bg-white">
                                        <div className="small text-muted fw-bold">Badges Ativos</div>
                                        <div className="h5 fw-bold text-primary m-0">{consultor.totalBadges} Badges</div>
                                    </div>
                                    <div className="border p-3 rounded-3 shadow-sm bg-white">
                                        <div className="small text-muted fw-bold">Pontos Totais</div>
                                        <div className="h5 fw-bold text-primary m-0">{consultor.pontosTotais} Pontos</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-8 border rounded-4 p-5 bg-white shadow-sm">
                            <div className="text-center mb-5">
                                <div className="rounded-circle border border-primary d-inline-flex align-items-center justify-content-center overflow-hidden mb-3 shadow-sm position-relative bg-light" style={{width: '180px', height: '180px'}}>
                                  <img 
                                      src={resolvePublicBadgeImage(badge.urlImagem)}
                                      onError={useDefaultBadgeImageOnError}
                                      alt={badge.titulo}
                                      className="w-100 h-100"
                                      style={{ objectFit: 'contain', padding: '10px' }}
                                  />
                                </div>
                                <h3 className="fw-bold m-0 mb-3">{badge.titulo}</h3>
                                <div className="text-muted d-flex flex-column gap-1 text-center" style={{fontSize: '15px'}}>
                                  <div><strong className="text-dark">Service Line:</strong> {badge.serviceLine || 'Geral'}</div>
                                  <div><strong className="text-dark">Área:</strong> {badge.area || 'Geral'}</div>
                                  <div><strong className="text-dark">Nível:</strong> {badge.nivel && nivelNameMap[badge.nivel] ? `${nivelNameMap[badge.nivel]} (Nível ${badge.nivel})` : badge.nivel}</div>
                                </div>
                            </div>

                            <div className="row text-center mb-5">
                                <div className="col-4 border-end"><strong>ID do Badge:</strong><br/><span className="text-muted">{badge.codigo}</span></div>
                                <div className="col-4 border-end"><strong>Emissão:</strong><br/><span className="text-muted">{badge.dataEmissao}</span></div>
                                <div className="col-4"><strong>Expiração:</strong><br/>
                                  <span className={`badge px-3 py-2 ${badge.dataExpiracao === 'N/A' ? 'bg-success bg-opacity-25 text-success' : 'bg-danger bg-opacity-25 text-danger'}`}>
                                      {badge.dataExpiracao === 'N/A' ? 'Sem expiração' : badge.dataExpiracao}
                                  </span>
                                </div>
                            </div>

                            <h5 className="fw-bold mb-4">Competências Certificadas (Requisitos)</h5>
                            <ul className="list-unstyled space-y-3">
                                {badge.requisitos.map((req, idx) => {
                                    const tituloDisplay = (!req.titulo || req.titulo.match(/^Requisito \d+$/i) || req.titulo.match(/^REQ-\d+/i) || req.titulo.match(/^[A-E]\d+/i)) 
                                        ? '' 
                                        : ` - ${req.titulo}`;
                                    return (
                                        <li key={req.id} className="mb-3 d-flex align-items-center gap-3">
                                            <i className="bi bi-check-circle-fill text-primary fs-4"></i>
                                            <div><strong>Requisito {badge.nivel}{idx + 1}{tituloDisplay}</strong><br/><small className="text-muted">{req.desc}</small></div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerificacaoBadgeUnico;
