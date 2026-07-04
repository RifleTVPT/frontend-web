import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CriarBadgeAdmin = ({ onClose, onSuccess, estrutura, initialData = null }) => {
    const [hasValidade, setHasValidade] = useState(initialData?.hasValidade || false);
    const [pontos, setPontos] = useState(initialData?.pontos || 150);
    
    const [nome, setNome] = useState(initialData?.nome || '');
    const [descricao, setDescricao] = useState(initialData?.desc || '');
    const [serviceLine, setServiceLine] = useState(initialData?.serviceLine || '');
    const [areaSelecionada, setAreaSelecionada] = useState(initialData?.area || '');
    const mapLetterToName = {'A':'Júnior', 'B':'Intermédio', 'C':'Sénior', 'D':'Especialista', 'E':'Líder de Conhecimento'};
    const [nivel, setNivel] = useState(initialData?.nivel ? (mapLetterToName[initialData.nivel] || initialData.nivel) : '');
    
    const [requisitosDinamicos, setRequisitosDinamicos] = useState(
        initialData?.requisitos ? initialData.requisitos.filter(r => !r.isPadrao).map(r => r.desc) : []
    );
    const [novoRequisito, setNovoRequisito] = useState('');
    const [showAddReq, setShowAddReq] = useState(false);
    const [imagemPreview, setImagemPreview] = useState(initialData?.urlImagem || null);
    const fileInputRef = React.useRef(null);
    const [tipoValidade, setTipoValidade] = useState(initialData?.validadeDias ? 'dias' : 'meses');
    const [valorValidade, setValorValidade] = useState(initialData?.validadeDias || initialData?.validadeMeses || '');
    const [configuracoesGlobais, setConfiguracoesGlobais] = useState(null);

    useEffect(() => {
        axios.get('https://softinsa-api-riya.onrender.com/configuracoes')
            .then(res => {
                if (res.data.success) setConfiguracoesGlobais(res.data.data);
            }).catch(e => console.error("Erro a obter configuracoes", e));
    }, []);

    useEffect(() => {
        if (hasValidade && !valorValidade && configuracoesGlobais) {
            setValorValidade(configuracoesGlobais.VALIDADE_MESES_PADRAO || 12);
            setTipoValidade('meses');
        }
    }, [hasValidade, valorValidade, configuracoesGlobais]);

    // Efeitos para preencher valores por defeito
    useEffect(() => {
        if (estrutura?.serviceLines?.length > 0 && !serviceLine && !initialData) {
            setServiceLine(estrutura.serviceLines[0].nome);
        }
    }, [estrutura, serviceLine, initialData]);

    useEffect(() => {
        if (serviceLine && estrutura?.areas) {
            const areasDaSL = estrutura.areas.filter(a => 
                estrutura.serviceLines.find(s => s.id === a.slId)?.nome === serviceLine
            );
            if (areasDaSL.length > 0) {
                if (!areasDaSL.find(a => a.nome === areaSelecionada)) {
                    setAreaSelecionada(areasDaSL[0].nome);
                }
            } else {
                setAreaSelecionada('');
            }
        }
    }, [serviceLine, estrutura]);

    useEffect(() => {
        if (areaSelecionada && estrutura?.areas) {
            const area = estrutura.areas.find(a => a.nome === areaSelecionada);
            if (area && area.niveisAtivos.length > 0) {
                if (!area.niveisAtivos.includes(nivel)) {
                    setNivel(area.niveisAtivos[0]);
                }
            } else {
                setNivel('');
            }
        }
    }, [areaSelecionada, estrutura]);

    useEffect(() => {
        if (!initialData && configuracoesGlobais && nivel && estrutura && areaSelecionada) {
            const areaCompleta = estrutura.areas?.find(a => a.nome === areaSelecionada);
            if (areaCompleta && areaCompleta.niveisAtivos) {
                const index = areaCompleta.niveisAtivos.indexOf(nivel);
                const letraNivel = index !== -1 ? String.fromCharCode(65 + index) : 'OUTRO';
                setPontos(configuracoesGlobais[`PONTOS_DEFAULT_${letraNivel}`] || configuracoesGlobais[`PONTOS_DEFAULT_OUTRO`] || 150);
            }
        }
    }, [nivel, configuracoesGlobais, initialData, estrutura, areaSelecionada]);

    // Calcular requisitos herdados da estrutura
    const areaCompleta = estrutura?.areas?.find(a => a.nome === areaSelecionada);
    const requisitosHerdados = areaCompleta?.requisitos?.filter(r => r.nivel === nivel) || [];
    
    // Obter ID do Nível atual
    const nivelIdAtual = areaCompleta?.niveisIds?.[nivel] || (requisitosHerdados.length > 0 ? requisitosHerdados[0].nivelId : 1);

    const areasDaSLCorrente = estrutura?.areas?.filter(a => 
        estrutura.serviceLines.find(s => s.id === a.slId)?.nome === serviceLine
    ) || [];

    const handleSubmeter = async () => {
        if (!nome || !serviceLine || !areaSelecionada || !nivel) {
            alert('Preencha os campos obrigatórios (Nome, SL, Área e Nível).');
            return;
        }

        const adminId = 1; // Usaria o user local em produção

        let letraNivel = 'A';
        if (areaCompleta?.niveisAtivos?.length > 0) {
            const index = areaCompleta.niveisAtivos.indexOf(nivel);
            letraNivel = String.fromCharCode(65 + (index >= 0 ? index : 0));
        }

        const listaRequisitosFinais = [
            ...requisitosHerdados.map((r, i) => ({ dbId: r.dbId, titulo: `Requisito ${letraNivel}${i+1}`, desc: r.desc })),
            ...requisitosDinamicos.map((r, i) => ({ dbId: null, titulo: `Requisito ${letraNivel}${requisitosHerdados.length + i + 1}`, desc: r }))
        ];

        let payload = {
            nome,
            descricao,
            serviceLine,
            area: areaSelecionada,
            nivelId: nivelIdAtual,
            pontos,
            hasValidade,
            tipoValidade: hasValidade ? tipoValidade : null,
            valorValidade: hasValidade ? valorValidade : null,
            validadeDias: (hasValidade && tipoValidade === 'dias') ? Number(valorValidade) : null,
            validadeMeses: (hasValidade && tipoValidade === 'meses') ? Number(valorValidade) : null,
            adminId,
            requisitos: listaRequisitosFinais,
            urlImagem: initialData?.urlImagem
        };

        if (imagemPreview && imagemPreview.startsWith('data:image')) {
            payload.imagemBase64 = imagemPreview;
        }

        try {
            if (initialData?.id) {
                // Update badge (PUT request)
                const res = await axios.put(`https://softinsa-api-riya.onrender.com/catalogo/admin/badge/${initialData.id}`, payload);
                
                if (res.data.success) {
                    alert('Badge atualizado com sucesso!');
                    if (onSuccess) onSuccess();
                    onClose();
                }
            } else {
                // Create badge (POST request)
                const res = await axios.post('https://softinsa-api-riya.onrender.com/catalogo/admin/badge/criar', payload);

                if (res.data.success) {
                    alert('Badge criado com sucesso!');
                    if (onSuccess) onSuccess();
                    onClose();
                }
            }
        } catch (error) {
            console.error('Erro ao criar badge', error);
            alert('Ocorreu um erro ao criar o badge.');
        }
    };

    // Gera opções de 50 em 50, do 50 ao 1000
    const renderOpcoesPontos = () => {
        const opcoes = [];
        for (let i = 50; i <= 1000; i += 50) {
            opcoes.push(<option key={i} value={i}>{i} Pontos</option>);
        }
        return opcoes;
    };

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1070 }}>
            <div className="modal-dialog modal-dialog-centered modal-xl">
                <div className="modal-content border-0 rounded-5 p-4 shadow-lg text-start">
                    {/* Cabeçalho do Modal */}
                    <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                        <h2 className="fw-bold m-0 text-dark" style={{ fontSize: '1.8rem' }}>
                            {initialData ? 'Editar e Configurar Badge' : 'Criar e Configurar Novo Badge'}
                        </h2>
                        <button type="button" className="btn-close shadow-none fs-4" onClick={onClose}></button>
                    </div>

                    <div className="row g-5">
                        {/* COLUNA ESQUERDA: IDENTIDADE VISUAL */}
                        <div className="col-md-4 border-end">
                            <div className="mb-4">
                                <label className="fw-bold text-muted small mb-3 d-block text-uppercase" style={{letterSpacing: '1px'}}>Área de Imagem</label>
                                <div className="d-flex justify-content-center">
                                    <div 
                                        className="border border-2 border-primary rounded-circle text-center bg-light cursor-pointer transition-all hover-light position-relative overflow-hidden d-flex align-items-center justify-content-center"
                                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                                        style={{ width: '200px', height: '200px' }}
                                    >
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="d-none" 
                                        ref={fileInputRef} 
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => setImagemPreview(reader.result);
                                                reader.readAsDataURL(file);
                                            }
                                        }} 
                                    />
                                    {imagemPreview && imagemPreview !== 'https://via.placeholder.com/150' ? (
                                        <img src={imagemPreview} alt="Preview" className="position-absolute top-0 start-0 w-100 h-100" style={{ objectFit: 'cover', zIndex: 2 }} />
                                    ) : (
                                        <>
                                            <i className="bi bi-trophy-fill text-warning position-absolute" style={{ fontSize: '7rem', zIndex: 1, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}></i>
                                            <div className="position-relative d-flex flex-column align-items-center justify-content-center w-100 h-100" style={{ zIndex: 3 }}>
                                                <p className="small text-dark fw-bold px-4 mb-2 bg-white bg-opacity-75 rounded py-1">Selecionar Imagem</p>
                                                <button type="button" className="btn btn-outline-primary btn-sm rounded-pill px-4 fw-bold mt-2 border-2 bg-white">Alterar</button>
                                            </div>
                                        </>
                                    )}
                                    </div>
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="fw-bold text-muted small mb-2 text-uppercase">Nome do Badge</label>
                                <input type="text" className="form-control border-0 bg-light py-3 rounded-3 fs-5" placeholder="ex: DevOps Specialist" value={nome} onChange={(e) => setNome(e.target.value)} />
                            </div>
                            <div>
                                <label className="fw-bold text-muted small mb-2 text-uppercase">Descrição do Badge</label>
                                <textarea className="form-control border-0 bg-light py-3 rounded-3" rows="5" placeholder="Descreva os objetivos..." value={descricao} onChange={(e) => setDescricao(e.target.value)}></textarea>
                            </div>
                        </div>

                        {/* COLUNA CENTRAL: ESTRUTURA E REQUISITOS */}
                        <div className="col-md-4 border-end">
                            <div className="mb-4">
                                <label className="fw-bold text-muted small mb-2 text-uppercase">Service Line Alocada</label>
                                <select className="form-select border-0 bg-light py-3 rounded-3 fw-bold" value={serviceLine} onChange={(e) => setServiceLine(e.target.value)}>
                                    {estrutura?.serviceLines?.map(sl => <option key={sl.id} value={sl.nome}>{sl.nome}</option>)}
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="fw-bold text-muted small mb-2 text-uppercase">Área de Competência</label>
                                <select className="form-select border-0 bg-light py-3 rounded-3" value={areaSelecionada} onChange={(e) => setAreaSelecionada(e.target.value)}>
                                    {areasDaSLCorrente.map(area => <option key={area.id} value={area.nome}>{area.nome}</option>)}
                                </select>
                            </div>
                            
                            <div className="bg-primary bg-opacity-10 p-3 rounded-4 mb-4 border border-primary border-opacity-25 shadow-sm">
                                <div className="d-flex gap-2">
                                    <i className="bi bi-info-circle-fill text-primary fs-5"></i>
                                    <p className="small text-dark m-0 lh-sm">
                                        Este badge será vinculado de forma automática à Service Line: <strong>{serviceLine}</strong> pertencente ao Learning Path: <strong>{estrutura?.learningPaths?.find(lp => lp.id === estrutura?.serviceLines?.find(s => s.nome === serviceLine)?.lpId)?.nome || 'Desconhecido'}</strong>.
                                    </p>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="fw-bold text-muted small mb-3 text-uppercase d-block">Nível do Badge</label>
                                <div className="row row-cols-3 g-2">
                                    {areaCompleta?.niveisAtivos?.length > 0 ? areaCompleta.niveisAtivos.map((n, i) => {
                                        const letra = String.fromCharCode(65 + i);
                                        return (
                                            <div key={n} className="col">
                                                <div className="form-check d-flex align-items-center gap-2">
                                                    <input className="form-check-input" style={{ transform: 'scale(1.2)' }} type="radio" name="nivel" id={`n${n}`} checked={nivel === n} onChange={() => setNivel(n)} />
                                                    <label className="form-check-label fw-bold text-dark" style={{ fontSize: '13px' }} htmlFor={`n${n}`}>{`${n} (${letra})`}</label>
                                                </div>
                                            </div>
                                        );
                                    }) : <span className="text-muted small">Sem níveis nesta área</span>}
                                </div>
                            </div>

                            <label className="fw-bold text-muted small mb-2 text-uppercase d-block">Requisitos Dinâmicos</label>
                            <div className="p-3 border rounded-4 bg-white mb-3 shadow-sm" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                                <p className="text-muted extra-small mb-3 fw-bold text-uppercase border-bottom pb-1">Requisitos Herdados da Área</p>
                                {requisitosHerdados.length > 0 ? requisitosHerdados.map((r, i) => {
                                    const index = areaCompleta?.niveisAtivos?.indexOf(nivel) || 0;
                                    const letraNivel = String.fromCharCode(65 + index);
                                    return (
                                        <div key={i} className="small mb-2 d-flex justify-content-between align-items-center p-2 bg-light rounded-3">
                                            <span className="fw-medium text-dark"><strong className="me-1">Requisito {letraNivel}{i+1}:</strong> {r.desc}</span>
                                            <i className="bi bi-lock-fill text-muted px-2" title="Herdado da Estrutura Central"></i>
                                        </div>
                                    );
                                }) : <span className="text-muted small mb-3 d-block">Nenhum requisito herdado</span>}
                                
                                {requisitosDinamicos.length > 0 && (
                                    <>
                                        <p className="text-muted extra-small mt-3 mb-3 fw-bold text-uppercase border-bottom pb-1">Requisitos Extra deste Badge</p>
                                        {requisitosDinamicos.map((r, i) => {
                                            const nameToLetterMap = {'Júnior':'A', 'Intermédio':'B', 'Sénior':'C', 'Especialista':'D', 'Líder de Conhecimento':'E'};
                                            const letraNivel = nameToLetterMap[nivel] || nivel;
                                            return (
                                                <div key={i} className="small mb-2 d-flex justify-content-between align-items-center p-2 bg-primary bg-opacity-10 rounded-3 border border-primary border-opacity-25">
                                                    <span className="fw-medium text-dark"><strong className="me-1 text-primary">Requisito {letraNivel}{requisitosHerdados.length + i + 1}:</strong> {r}</span>
                                                    <i className="bi bi-trash-fill text-danger cursor-pointer px-2" onClick={() => setRequisitosDinamicos(prev => prev.filter((_, idx) => idx !== i))}></i>
                                                </div>
                                            );
                                        })}
                                    </>
                                )}

                                {showAddReq ? (
                                    <div className="mt-3">
                                        <input type="text" className="form-control form-control-sm mb-2" placeholder="Descreva o novo requisito..." value={novoRequisito} onChange={(e) => setNovoRequisito(e.target.value)} />
                                        <div className="d-flex gap-2">
                                            <button className="btn btn-primary btn-sm rounded-pill fw-bold" onClick={() => { if(novoRequisito){setRequisitosDinamicos([...requisitosDinamicos, novoRequisito]); setNovoRequisito(''); setShowAddReq(false);} }}>Guardar</button>
                                            <button className="btn btn-outline-secondary btn-sm rounded-pill" onClick={() => {setShowAddReq(false); setNovoRequisito('');}}>Cancelar</button>
                                        </div>
                                    </div>
                                ) : (
                                    <button className="btn btn-outline-primary btn-sm w-100 mt-3 rounded-pill fw-bold py-2 border-2" onClick={() => setShowAddReq(true)}>
                                        + Adicionar Requisito Extra
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* COLUNA DIREITA: PONTOS E VALIDADE */}
                        <div className="col-md-4">
                            <label className="fw-bold text-muted small mb-3 text-uppercase d-block">Sistema de Pontos</label>
                            <div className="border rounded-4 p-4 mb-5 shadow-sm bg-white border-start border-4 border-primary">
                                <label className="small fw-bold text-dark mb-2 d-block">Pontos Conquistados:</label>
                                <select 
                                    className="form-select border-0 bg-light py-2 fw-bold" 
                                    value={pontos} 
                                    onChange={(e) => setPontos(parseInt(e.target.value))}
                                >
                                    {renderOpcoesPontos()}
                                </select>
                                
                                <div className="mt-4 text-center">
                                    <div className="position-relative d-inline-block w-100">
                                        <h2 className="fw-bold text-primary m-0" style={{fontSize: '2.5rem'}}>{pontos} pts</h2>
                                        <p className="text-muted small fw-bold">Padrão da Plataforma: 150 pontos</p>
                                        <div className="progress mt-2 mx-auto rounded-pill shadow-sm" style={{ height: '12px', width: '80%' }}>
                                            <div className="progress-bar progress-bar-striped progress-bar-animated" 
                                                 style={{ width: `${(pontos/500)*100}%`, backgroundColor: '#5D78FF' }}></div>
                                        </div>
                                        <div className="d-flex justify-content-between w-80 mx-auto mt-1 px-4 small text-muted fw-bold">
                                            <span>100 pts</span>
                                            <span>500 pts</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <label className="fw-bold text-muted small mb-3 text-uppercase d-block">Validade do Badge</label>
                            <div className="border rounded-4 p-4 bg-white shadow-sm">
                                <div className="row g-3">
                                    <div className="col-12">
                                        <select className="form-select border-0 bg-light py-2 fw-bold" value={hasValidade ? 'Com' : 'Sem'} onChange={(e) => {
                                            const val = e.target.value === 'Com';
                                            setHasValidade(val);
                                            if (val) {
                                                const defaultMonths = configuracoesGlobais?.VALIDADE_MESES_PADRAO || 12;
                                                setValorValidade(defaultMonths);
                                                setTipoValidade('meses');
                                            } else {
                                                setValorValidade('');
                                            }
                                        }}>
                                            <option value="Sem">Sem Expiração</option>
                                            <option value="Com">Com Validade Definida</option>
                                        </select>
                                    </div>
                                    <div className="col-12 d-flex gap-2">
                                        <input 
                                            type="number" 
                                            min="1"
                                            value={valorValidade}
                                            onChange={(e) => setValorValidade(e.target.value)}
                                            className={`form-control py-2 rounded-3 border-0 ${!hasValidade ? 'bg-secondary bg-opacity-25 text-muted cursor-not-allowed' : 'bg-light'}`} 
                                            disabled={!hasValidade}
                                            placeholder="Duração"
                                        />
                                        <select 
                                            value={tipoValidade}
                                            onChange={(e) => setTipoValidade(e.target.value)}
                                            className={`form-select w-50 py-2 rounded-3 border-0 ${!hasValidade ? 'bg-secondary bg-opacity-25 text-muted cursor-not-allowed' : 'bg-light'}`}
                                            disabled={!hasValidade}
                                        >
                                            <option value="meses">Meses</option>
                                            <option value="dias">Dias</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-center mt-5 d-flex justify-content-center gap-4 border-top pt-4">
                        <button onClick={handleSubmeter} className="btn btn-primary px-5 py-3 rounded-pill fw-bold shadow-lg fs-5" style={{backgroundColor: '#5D78FF', border: 'none'}}>
                            {initialData ? 'Atualizar Badge' : 'Criar Novo Badge'}
                        </button>
                        <button className="btn btn-outline-secondary px-5 py-3 rounded-pill fw-bold border-2 fs-5" onClick={onClose}>
                            Cancelar e Voltar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CriarBadgeAdmin;
