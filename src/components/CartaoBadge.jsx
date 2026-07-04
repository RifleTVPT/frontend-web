import React from 'react';

const CartaoBadge = ({ badge, acoesRodape, cabecalhoPersonalizado }) => {
    return (
        <div className="card border-0 shadow-sm p-4 text-center rounded-4 h-100 bg-white hover-up transition-all cartao-badge">
            
            {/* Header Especial (Status, Icons, etc) */}
            {cabecalhoPersonalizado && (
                <div className="d-flex justify-content-end mb-2 w-100 position-absolute top-0 end-0 p-3">
                    {cabecalhoPersonalizado}
                </div>
            )}

            {/* Imagem do Badge */}
            <div className="d-flex justify-content-center mb-4 mt-2">
                <div className="rounded-circle border border-primary border-2 d-flex align-items-center justify-content-center bg-light position-relative" style={{ width: '90px', height: '90px', overflow: 'hidden' }}>
                    <i className="bi bi-trophy-fill text-warning position-absolute" style={{ fontSize: '3.5rem', zIndex: 1 }}></i>
                    {(() => {
                        const imageSrc = badge.URL_IMAGEM && badge.URL_IMAGEM.trim() !== '' && !badge.URL_IMAGEM.includes('placeholder') && !badge.URL_IMAGEM.includes('default-trophy') ? badge.URL_IMAGEM : null;
                        if (!imageSrc) return null;
                        return (
                            <img 
                                src={imageSrc} 
                                onError={(e) => { e.target.style.display = 'none'; }}
                                alt="Badge" 
                                className="position-absolute w-100 h-100"
                                style={{ objectFit: 'cover', zIndex: 2 }} 
                            />
                        );
                    })()}
                </div>
            </div>
            
            {/* Detalhes de Texto */}
            <h3 className="fw-bold text-dark mb-1 text-truncate px-2" style={{ fontSize: '1.2rem' }} title={badge.titulo}>{badge.titulo}</h3>
            <p className="fw-bold text-primary mb-1 text-truncate px-2" style={{ fontSize: '0.9rem' }}>Service Line {badge.serviceLine || 'Geral'}</p>
            <p className="fw-bold text-muted mb-2" style={{ fontSize: '0.85rem' }}>Área de {badge.area || 'Geral'} - Nível {badge.nivel}</p>
            
            {/* Totais */}
            <div className="d-flex justify-content-center gap-3 my-3">
                <div className="bg-light rounded p-2 px-3">
                    <div className="small text-muted" style={{fontSize: '10px'}}>Requisitos</div>
                    <div className="fw-bold text-dark">{badge.requisitosCount}</div>
                </div>
                <div className="bg-primary bg-opacity-10 rounded p-2 px-3">
                    <div className="small text-primary fw-bold" style={{fontSize: '10px'}}>Pontos</div>
                    <div className="fw-bold text-primary">{badge.pontos}</div>
                </div>
            </div>

            {/* Ações Específicas do Perfil (Injetadas) */}
            <div className="mt-auto pt-3 w-100">
                {acoesRodape}
            </div>
        </div>
    );
};

export default CartaoBadge;
