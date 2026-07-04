import React from 'react';

const PerfilConsultorModal = ({ consultor, onClose }) => {
    
    const jornadaOrdenada = consultor?.jornada 
        ? [...consultor.jornada].map(item => ({
            ...item,
            percentagem: Math.round((item.reqSubmetidos / item.reqTotais) * 100)
          })).sort((a, b) => b.percentagem - a.percentagem)
        : [];

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 2000 }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content border-0 rounded-4 p-4 shadow-lg text-start">
                    <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                        <h3 className="fw-bold m-0">Perfil Consolidado - {consultor?.nome || 'Consultor'}</h3>
                        <button onClick={onClose} className="btn-close shadow-none"></button>
                    </div>
                    <div className="row g-4">
                        <div className="col-md-6 border-end">
                            <h5 className="fw-bold text-primary mb-3">Estatísticas Relevantes</h5>
                            <ul className="list-group list-group-flush small mb-4">
                                <li className="list-group-item d-flex justify-content-between py-3">
                                    <span className="text-muted fw-bold">Pontos Totais:</span> 
                                    <strong className="text-dark fs-6">{consultor?.pontosTotais || 0}</strong>
                                </li>
                                <li className="list-group-item d-flex justify-content-between py-3">
                                    <span className="text-muted fw-bold">Classificação Global:</span> 
                                    <strong className="text-dark fs-6">#{consultor?.ranking || '-'} <small className="text-muted fw-normal">de {consultor?.totalConsultores || '-'}</small></strong>
                                </li>
                                <li className="list-group-item d-flex justify-content-between py-3">
                                    <span className="text-muted fw-bold">Badges Conquistados este Ano:</span> 
                                    <strong className="text-primary fs-6">{consultor?.badgesAno || 0} Badges</strong>
                                </li>
                            </ul>
                            
                            <h5 className="fw-bold text-primary mb-3 border-top pt-4">Categoria do Consultor</h5>
                            <div className="d-flex gap-2 flex-wrap mt-2">
                                <span className="badge bg-light text-dark border px-3 py-2 fs-6">{consultor?.serviceLine || 'Sem Service Line'}</span>
                                <span className="badge bg-light text-dark border px-3 py-2 fs-6">{consultor?.cargo || 'Sem Área'}</span>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <h5 className="fw-bold text-primary mb-3">Learning Paths Ativos (Jornada)</h5>
                            <div className="space-y-4 pe-2" style={{maxHeight: '400px', overflowY: 'auto'}}>
                                {jornadaOrdenada.length === 0 ? (
                                    <small className="text-muted">Este utilizador não tem candidaturas a badges em processo no momento.</small>
                                ) : (
                                    jornadaOrdenada.map((item, idx) => (
                                        <div key={idx} className="mb-4">
                                            <div className="d-flex justify-content-between align-items-end small mb-2">
                                                <div className="lh-sm">
                                                    <span className="fw-bold d-block text-dark" style={{fontSize: '14px'}}>{item.nome}</span>
                                                    <span className="text-muted" style={{fontSize: '12px'}}>{item.serviceLine} - Nível {item.nivel || 'A'}</span>
                                                </div>
                                                <div className="text-end">
                                                    <span className="text-primary fw-bold d-block fs-6">{item.percentagem}%</span>
                                                </div>
                                            </div>
                                            <div className="progress shadow-sm" style={{height: '8px', borderRadius: '10px', backgroundColor: '#e9ecef'}}>
                                                <div className="progress-bar bg-primary progress-bar-striped progress-bar-animated" role="progressbar" style={{ width: `${item.percentagem}%`, borderRadius: '10px' }}></div>
                                            </div>
                                            <div className="text-end mt-1">
                                                <small className="text-muted" style={{fontSize: '11px'}}>{item.reqSubmetidos} de {item.reqTotais} Requisitos</small>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PerfilConsultorModal;