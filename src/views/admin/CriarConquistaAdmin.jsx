import React, { useState, useRef } from 'react';
import axios from 'axios';

const TIPOS = [
    { value: 'TOTAL_BADGES', label: '🏆 Acumular Total de Badges', desc: 'O consultor ganha ao atingir X badges aprovados no total.' },
    { value: 'TOTAL_PONTOS', label: '💎 Atingir X Pontos no Total', desc: 'O consultor ganha ao acumular X pontos totais na plataforma.' },
    { value: 'BADGES_DIAS', label: '⚡ Obter X Badges em Y Dias', desc: 'O consultor ganha ao obter X badges num período de Y dias.' },
    { value: 'MELHOR_ANO', label: '🌟 Melhor Consultor do Ano', desc: 'Atribuído ao consultor com mais pontos no final do ano civil.' },
    { value: 'MELHOR_MESES', label: '🔥 Melhor Consultor por X Meses', desc: 'Atribuído ao consultor com mais pontos por X meses consecutivos.' },
];

const BONUS_OPTIONS = [50, 100, 150, 200, 250, 300, 400, 500, 750, 1000];

const CriarConquistaAdmin = ({ show, onClose, onCreated }) => {
    const [titulo, setTitulo] = useState('');
    const [desc, setDesc] = useState('');
    const [bonus, setBonus] = useState(100);
    const [tipo, setTipo] = useState('');
    const [param1, setParam1] = useState('');
    const [param2, setParam2] = useState('');
    const [imagemFile, setImagemFile] = useState(null);
    const [imagemPreview, setImagemPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const fileRef = useRef();

    if (!show) return null;

    const handleImagemChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImagemFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setImagemPreview(ev.target.result);
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!tipo) { alert('Por favor selecione o tipo de conquista.'); return; }
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('titulo', titulo);
            formData.append('desc', desc);
            formData.append('bonus', bonus);
            formData.append('tipo', tipo);
            if (param1) formData.append('param1', param1);
            if (param2) formData.append('param2', param2);
            if (imagemFile) formData.append('imagem', imagemFile);

            const res = await axios.post('http://localhost:3000/admin-conquistas/criar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.success) {
                alert('Conquista Especial criada com sucesso!');
                onCreated();
                onClose();
                // reset
                setTitulo(''); setDesc(''); setBonus(100); setTipo('');
                setParam1(''); setParam2(''); setImagemFile(null); setImagemPreview(null);
            }
        } catch (error) {
            alert('Erro ao criar conquista: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const tipoInfo = TIPOS.find(t => t.value === tipo);

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
            <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                <div className="modal-content rounded-4 border-0 shadow-lg">
                    {/* Header */}
                    <div className="modal-header border-0 px-4 pt-4 pb-0">
                        <div>
                            <h4 className="fw-bold mb-1" style={{ color: '#1a1a2e' }}>
                                <i className="bi bi-trophy-fill me-2" style={{ color: '#D4AF37' }}></i>
                                Criar Conquista Especial
                            </h4>
                            <p className="text-muted small m-0">Configure os detalhes e as condições de atribuição desta conquista.</p>
                        </div>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="modal-body px-4 py-3">
                            <div className="row g-4">
                                {/* COLUNA ESQUERDA - Imagem */}
                                <div className="col-md-4">
                                    <label className="fw-bold small text-uppercase text-muted d-block mb-2">Imagem da Conquista</label>
                                    <div 
                                        onClick={() => fileRef.current.click()}
                                        className="border rounded-4 d-flex flex-column align-items-center justify-content-center cursor-pointer position-relative overflow-hidden"
                                        style={{ height: '200px', backgroundColor: '#F8F9FA', border: '2px dashed #D4AF37 !important', borderColor: '#D4AF37', cursor: 'pointer' }}
                                    >
                                        {imagemPreview ? (
                                            <img src={imagemPreview} alt="Preview" className="w-100 h-100" style={{ objectFit: 'cover' }} />
                                        ) : (
                                            <div className="text-center">
                                                <div className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3 shadow-sm" style={{ width: '70px', height: '70px', background: 'linear-gradient(135deg, #F9F1DC, #D4AF37)' }}>
                                                    <i className="bi bi-trophy-fill" style={{ fontSize: '2rem', color: '#7B5E10' }}></i>
                                                </div>
                                                <p className="text-muted small mb-1 fw-bold">Clique para selecionar</p>
                                                <p className="text-muted" style={{ fontSize: '11px' }}>ou ficará com o troféu padrão</p>
                                            </div>
                                        )}
                                        <input ref={fileRef} type="file" accept="image/*" className="d-none" onChange={handleImagemChange} />
                                    </div>
                                    {imagemPreview && (
                                        <button type="button" className="btn btn-outline-danger btn-sm w-100 mt-2 rounded-pill" onClick={() => { setImagemFile(null); setImagemPreview(null); }}>
                                            <i className="bi bi-x-circle me-1"></i> Remover Imagem
                                        </button>
                                    )}

                                    {/* Pontos Bonus */}
                                    <div className="mt-4">
                                        <label className="fw-bold small text-uppercase text-muted d-block mb-2">Pontos Bónus</label>
                                        <div className="border rounded-4 p-3 bg-white shadow-sm text-center">
                                            <h2 className="fw-bold mb-0" style={{ color: '#5D78FF' }}>+{bonus}</h2>
                                            <p className="text-muted small mb-2">pontos</p>
                                            <select className="form-select border-0 bg-light fw-bold" value={bonus} onChange={e => setBonus(parseInt(e.target.value))}>
                                                {BONUS_OPTIONS.map(b => <option key={b} value={b}>{b} Pontos</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* COLUNA DIREITA */}
                                <div className="col-md-8">
                                    {/* Tipo de Conquista */}
                                    <div className="mb-3">
                                        <label className="fw-bold small text-uppercase text-muted d-block mb-2">Tipo de Conquista *</label>
                                        <div className="row g-2">
                                            {TIPOS.map(t => (
                                                <div key={t.value} className="col-md-6">
                                                    <div
                                                        onClick={() => { setTipo(t.value); setParam1(''); setParam2(''); }}
                                                        className={`p-3 rounded-3 border-2 cursor-pointer ${tipo === t.value ? 'border-primary bg-primary bg-opacity-10' : 'border bg-white'}`}
                                                        style={{ cursor: 'pointer', borderStyle: 'solid' }}
                                                    >
                                                        <p className="fw-bold small mb-1 text-dark">{t.label}</p>
                                                        <p className="text-muted mb-0" style={{ fontSize: '11px' }}>{t.desc}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Parâmetros dinâmicos */}
                                    {tipo && (
                                        <div className="mb-3 p-3 rounded-3 bg-primary bg-opacity-10 border border-primary border-opacity-25">
                                            <p className="fw-bold small text-primary mb-2"><i className="bi bi-sliders me-1"></i>Parâmetros da Condição</p>
                                            <div className="row g-2">
                                                {tipo === 'TOTAL_BADGES' && (
                                                    <div className="col-12">
                                                        <label className="form-label small fw-bold">Número Total de Badges (X)</label>
                                                        <input type="number" className="form-control" value={param1} onChange={e => setParam1(e.target.value)} required min="1" placeholder="Ex: 10" />
                                                    </div>
                                                )}
                                                {tipo === 'TOTAL_PONTOS' && (
                                                    <div className="col-12">
                                                        <label className="form-label small fw-bold">Total de Pontos a Atingir (X)</label>
                                                        <input type="number" className="form-control" value={param1} onChange={e => setParam1(e.target.value)} required min="1" placeholder="Ex: 1000" />
                                                    </div>
                                                )}
                                                {tipo === 'BADGES_DIAS' && (<>
                                                    <div className="col-md-6">
                                                        <label className="form-label small fw-bold">Número de Badges (X)</label>
                                                        <input type="number" className="form-control" value={param1} onChange={e => setParam1(e.target.value)} required min="1" placeholder="Ex: 5" />
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label small fw-bold">Período em Dias (Y)</label>
                                                        <input type="number" className="form-control" value={param2} onChange={e => setParam2(e.target.value)} required min="1" placeholder="Ex: 30" />
                                                    </div>
                                                </>)}
                                                {tipo === 'MELHOR_ANO' && (
                                                    <div className="col-12">
                                                        <label className="form-label small fw-bold">Ano Alvo</label>
                                                        <input type="number" className="form-control" value={param1} onChange={e => setParam1(e.target.value)} required placeholder="Ex: 2025" />
                                                    </div>
                                                )}
                                                {tipo === 'MELHOR_MESES' && (
                                                    <div className="col-12">
                                                        <label className="form-label small fw-bold">Número de Meses Consecutivos (X)</label>
                                                        <input type="number" className="form-control" value={param1} onChange={e => setParam1(e.target.value)} required min="1" placeholder="Ex: 3" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Título */}
                                    <div className="mb-3">
                                        <label className="fw-bold small text-uppercase text-muted d-block mb-2">Título da Conquista *</label>
                                        <input
                                            type="text"
                                            className="form-control bg-light border-0 py-2 rounded-3"
                                            value={titulo}
                                            onChange={e => setTitulo(e.target.value)}
                                            required
                                            placeholder="Ex: Mestre das Cloud, Melhor de 2025..."
                                        />
                                    </div>

                                    {/* Descrição */}
                                    <div className="mb-3">
                                        <label className="fw-bold small text-uppercase text-muted d-block mb-2">Descrição (Opcional)</label>
                                        <textarea
                                            className="form-control bg-light border-0 py-2 rounded-3"
                                            rows={3}
                                            value={desc}
                                            onChange={e => setDesc(e.target.value)}
                                            placeholder="Descreva o que torna esta conquista especial e como motiva os consultores..."
                                        />
                                        <p className="text-muted mt-1" style={{ fontSize: '11px' }}>
                                            <i className="bi bi-info-circle me-1"></i>
                                            Se deixar em branco, será gerado automaticamente um texto baseado no tipo e parâmetros.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer - botões centralizados, Criar à esquerda */}
                        <div className="modal-footer border-0 px-4 pb-4 pt-0 justify-content-center gap-3">
                            <button type="submit" className="btn btn-primary px-5 py-2 rounded-pill fw-bold shadow-sm" disabled={loading || !tipo || !titulo}>
                                {loading ? (
                                    <><span className="spinner-border spinner-border-sm me-2"></span>A Criar...</>
                                ) : (
                                    <><i className="bi bi-trophy-fill me-2"></i>Criar Conquista Especial</>
                                )}
                            </button>
                            <button type="button" className="btn btn-outline-secondary px-5 py-2 rounded-pill fw-bold" onClick={onClose}>
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CriarConquistaAdmin;
