import React from 'react';

const TabelaGenerica = ({ colunas, children, emptyMessage, iconEmpty = "bi-folder-x" }) => {
    // Verificar se existem children válidos (se children é um array de length > 0 ou um element)
    // Usamos React.Children.count para ser robusto
    const hasData = React.Children.count(children) > 0;

    return (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-5 bg-white">
            <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 text-center border-0">
                    <thead className="text-white" style={{backgroundColor: '#5D78FF'}}>
                        <tr>
                            {colunas.map((col, index) => (
                                <th key={index} className={`py-3 px-4 fw-bold border-0 ${col.className || ''}`}>
                                    {col.label || col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {hasData ? (
                            children
                        ) : (
                            <tr>
                                <td colSpan={colunas.length} className="text-center py-5 text-muted">
                                    <i className={`bi ${iconEmpty} fs-1 opacity-25 d-block mb-3`}></i>
                                    {emptyMessage || "Nenhum registo encontrado."}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TabelaGenerica;
