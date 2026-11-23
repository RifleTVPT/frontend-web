import React from 'react';

const CartaoEstatistica = ({ 
    titulo, 
    valor, 
    subtitulo, 
    icone, 
    fundoEscuro = false, 
    corDestaque = 'primary', 
    alinhamento = 'start',
    acaoBotao = null
}) => {
    
    const isCenter = alinhamento === 'center';
    
    // Classes condicionais baseadas nas props
    const cardBgClass = fundoEscuro ? `bg-${corDestaque} text-white` : 'bg-white text-dark';
    const textValorClass = fundoEscuro ? 'text-white' : `text-${corDestaque}`;
    const textTituloClass = fundoEscuro ? 'opacity-75' : 'text-muted fw-bold text-uppercase';
    const textSubClass = fundoEscuro ? 'opacity-75' : 'text-muted';

    return (
        <div className={`dashboard-kpi-card card border-0 shadow-sm p-4 rounded-3 h-100 w-100 d-flex flex-column ${cardBgClass} ${isCenter ? 'text-center' : 'text-start'}`} style={{ minHeight: '170px' }}>
            <div className={`small mb-2 ${textTituloClass}`}>
                {icone && <i className={`bi ${icone} me-2`}></i>}
                {titulo}
            </div>
            
            <h1 className={`fw-bold my-auto ${textValorClass}`} style={{fontSize: isCenter ? '2.5rem' : '2rem'}}>
                {valor}
            </h1>
            
            {subtitulo && (
                <div className={`small mt-auto pt-3 fw-bold ${textSubClass}`}>
                    {subtitulo}
                </div>
            )}

            {acaoBotao && (
                <button 
                    onClick={acaoBotao.onClick}
                    className={`btn btn-${corDestaque} btn-sm text-white rounded-pill px-4 mt-3 fw-bold shadow-sm text-nowrap align-self-center`}
                >
                    {acaoBotao.label}
                </button>
            )}
        </div>
    );
};

export default CartaoEstatistica;
