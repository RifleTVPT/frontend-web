import React, { useState, useEffect } from 'react';
import SidebarSLL from '../../components/SidebarSLL';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import { Bar, Pie } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { resolvePublicBadgeImage, useDefaultBadgeImageOnError } from '../../utils/publicBadgeImage';
import { obterServiceLineSLL } from '../../utils/sllServiceLine';
import '../../assets/dashboard.css';
import * as XLSX from 'xlsx';

import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

// Plugin para desenhar a percentagem no centro de cada fatia do gráfico Doughnut/Pie
const pieLabelsPlugin = {
    id: 'pieLabels',
    afterDraw(chart) {
        if (chart.config.type !== 'doughnut' && chart.config.type !== 'pie') return;
        const ctx = chart.ctx;
        chart.data.datasets.forEach((dataset, i) => {
            chart.getDatasetMeta(i).data.forEach((element, index) => {
                const total = dataset.data.reduce((acc, curr) => acc + curr, 0);
                const val = dataset.data[index];
                if (val === 0) return;
                const percentage = Math.round((val / total) * 100) + '%';

                const position = element.tooltipPosition();
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 12px "Inter", sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(percentage, position.x, position.y);
            });
        });
    }
};
ChartJS.register(pieLabelsPlugin);

const GamificacaoSLL = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    
    // Estados do Utilizador
    const [utilizador, setUtilizador] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState('https://via.placeholder.com/40');
    const [minhaSL, setMinhaSL] = useState('');

    // Modal & Formulário
    const [showModal, setShowModal] = useState(false);
    const [consultorSelecionado, setConsultorSelecionado] = useState('');
    const [objTitulo, setObjTitulo] = useState('');
    const [objData, setObjData] = useState('');
    const [objTipo, setObjTipo] = useState('');
    const [objDesc, setObjDesc] = useState('');
    const [enviarNotif, setEnviarNotif] = useState(true);

    // Dados da API
    const [dashboardData, setDashboardData] = useState(null);

    useEffect(() => {
        const userLocal = JSON.parse(sessionStorage.getItem('user'));
        if (!userLocal) { navigate('/'); return; }
        
        setUtilizador(userLocal);
        let slAtual = userLocal.SL_REGISTO || userLocal.SERVICE_LINE || '';
        setMinhaSL(slAtual);

        const carregarDados = async () => {
            try {
                slAtual = await obterServiceLineSLL(userLocal);
                setMinhaSL(slAtual);
                const resUser = await axios.get(`https://softinsa-api-riya.onrender.com/users/configuracoes/${userLocal.ID_UTILIZADOR}`);
                if (resUser.data.success && resUser.data.data.avatar) setAvatarUrl(resUser.data.data.avatar);

                const response = await axios.get(`https://softinsa-api-riya.onrender.com/estatisticas/sll/gamificacao?sl=${encodeURIComponent(slAtual)}`);
                if (response.data.success) {
                    setDashboardData(response.data.data);
                }
            } catch (error) {
                console.error("Erro Dashboard SLL:", error);
            } finally {
                setLoading(false);
            }
        };
        carregarDados();
    }, [navigate]);

    const handleLogout = () => {
        sessionStorage.removeItem('user');
        navigate('/');
    };

    const handleCriarObjetivo = async () => {
        if(!consultorSelecionado || !objTitulo || !objData) return alert("Preencha todos os campos obrigatórios (*).");

        try {
            const payload = {
                idUtilizador: consultorSelecionado,
                titulo: objTitulo,
                dataMeta: objData,
                descricao: objDesc || `Tipo de objetivo: ${objTipo}`,
                origem: 'Service Line Leader',
                enviarNotificacao: enviarNotif
            };
            const response = await axios.post('https://softinsa-api-riya.onrender.com/objetivos/criar', payload);
            if (response.data.success) {
                alert("Objetivo atribuído com sucesso!");
                setShowModal(false);
                setObjTitulo(''); setObjData(''); setObjDesc(''); setObjTipo('');
                // Recarregar os dados para atualizar a lista
                const resRefresh = await axios.get(`https://softinsa-api-riya.onrender.com/estatisticas/sll/gamificacao?sl=${encodeURIComponent(minhaSL)}`);
                if (resRefresh.data.success) setDashboardData(resRefresh.data.data);
            }
        } catch (error) {
            alert('Erro ao atribuir objetivo.');
        }
    };

    // ==========================================
    // MÉTODOS DE EXPORTAÇÃO
    // ==========================================
    const exportarExcel = () => {
        if(!dashboardData) return;
        const wb = XLSX.utils.book_new();

        // Aba 1: Resumo KPIs
        const wsKPIs = XLSX.utils.json_to_sheet([
            { Metrica: 'Total de Pontos da Service Line', Valor: dashboardData.kpis.totalPontos },
            { Metrica: 'Média de Pontos por Consultor', Valor: dashboardData.kpis.mediaPontos },
            { Metrica: 'Consultores c/ Badge Atribuído (%)', Valor: `${dashboardData.kpis.percComBadge}%` }
        ]);
        XLSX.utils.book_append_sheet(wb, wsKPIs, "KPIs");

        // Aba 2: Evolução de Pontos (Barras)
        const labelsBarras = dashboardData.bar.labels;
        const dadosBarras = dashboardData.bar.data;
        const wsBarras = XLSX.utils.json_to_sheet(labelsBarras.map((mes, idx) => ({ Mês: mes, Pontos_Obtidos: dadosBarras[idx] })));
        XLSX.utils.book_append_sheet(wb, wsBarras, "Evolução 4 Meses");

        const wsAreas = XLSX.utils.json_to_sheet(
            dashboardData.doughnut.labels.map((area, idx) => ({
                Área: area,
                'Badges atribuídos': dashboardData.doughnut.data[idx] || 0
            }))
        );
        XLSX.utils.book_append_sheet(wb, wsAreas, "Distribuição por Área");

        const wsObjetivos = XLSX.utils.json_to_sheet((dashboardData.objetivos || []).map(obj => ({
            Título: obj.titulo,
            Consultor: obj.consultor,
            Descrição: obj.descricao,
            'Data Meta': obj.dataMeta
        })));
        XLSX.utils.book_append_sheet(wb, wsObjetivos, "Objetivos Ativos");

        const wsPremium = XLSX.utils.json_to_sheet((dashboardData.premiumBadges || []).map(b => ({
            Badge: b.nome,
            Tipo: b.tipo || 'Conquista Especial',
            Pontos: b.pontos || 0
        })));
        XLSX.utils.book_append_sheet(wb, wsPremium, "Badges Premium");

        XLSX.writeFile(wb, `Performance_SL_${minhaSL.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.xlsx`);
    };

    const exportarPDF = () => {
        if(!dashboardData) return;
        const doc = new jsPDF('p', 'mm', 'a4');
        let currentY = 20;

        doc.setFontSize(18);
        doc.text(`Performance Service Line: ${minhaSL}`, 14, currentY);
        doc.setFontSize(10);
        doc.setTextColor(100);
        currentY += 8;
        doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, currentY);
        currentY += 15;

        // Tabela de KPIs
        autoTable(doc, {
            startY: currentY,
            head: [['Métrica', 'Valor']],
            body: [
                ['Total de Pontos da Service Line', dashboardData.kpis.totalPontos],
                ['Média de Pontos por Consultor', dashboardData.kpis.mediaPontos],
                ['Consultores c/ Badge Atribuído (%)', `${dashboardData.kpis.percComBadge}%`]
            ],
            theme: 'striped',
            headStyles: { fillColor: [93, 120, 255] }
        });
        currentY = doc.lastAutoTable.finalY + 15;

        autoTable(doc, {
            startY: currentY,
            head: [['Área', 'Badges atribuídos']],
            body: dashboardData.doughnut.labels.map((area, idx) => [
                area,
                dashboardData.doughnut.data[idx] || 0
            ]),
            theme: 'grid',
            headStyles: { fillColor: [93, 120, 255] }
        });
        currentY = doc.lastAutoTable.finalY + 15;

        // Tabela de Evolução (Barras)
        const labelsBarras = dashboardData.bar.labels;
        const dadosBarras = dashboardData.bar.data;
        const corpoEvolucao = labelsBarras.map((mes, idx) => [mes, dadosBarras[idx]]);

        autoTable(doc, {
            startY: currentY,
            head: [['Mês', 'Pontos Obtidos']],
            body: corpoEvolucao,
            theme: 'grid',
            headStyles: { fillColor: [93, 120, 255] }
        });
        currentY = doc.lastAutoTable.finalY + 15;

        if (currentY > 240) { doc.addPage(); currentY = 20; }
        autoTable(doc, {
            startY: currentY,
            head: [['Objetivo', 'Consultor', 'Descrição', 'Data Meta']],
            body: (dashboardData.objetivos || []).map(obj => [obj.titulo, obj.consultor, obj.descricao, obj.dataMeta]),
            theme: 'grid',
            styles: { fontSize: 8, overflow: 'linebreak' },
            headStyles: { fillColor: [93, 120, 255] }
        });
        currentY = doc.lastAutoTable.finalY + 15;

        if (currentY > 240) { doc.addPage(); currentY = 20; }
        autoTable(doc, {
            startY: currentY,
            head: [['Badge Premium', 'Tipo', 'Pontos']],
            body: (dashboardData.premiumBadges || []).map(b => [b.nome, b.tipo || 'Conquista Especial', b.pontos || 0]),
            theme: 'grid',
            styles: { fontSize: 8, overflow: 'linebreak' },
            headStyles: { fillColor: [93, 120, 255] }
        });

        doc.save(`Performance_SL_${minhaSL.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`);
    };

    if (loading || !dashboardData) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

    const barChartData = {
        labels: dashboardData.bar.labels,
        datasets: [{
            label: 'Pontuação da Equipa',
            data: dashboardData.bar.data,
            backgroundColor: '#5D78FF',
            borderRadius: 6,
            barThickness: 35, 
        }]
    };

    const colors = ['#2575fc', '#82D674', '#ffc107', '#fd7e14', '#dc3545', '#6f42c1', '#20c997', '#0dcaf0', '#adb5bd'];
    const doughnutChartData = {
        labels: dashboardData.doughnut.labels,
        datasets: [{
            data: dashboardData.doughnut.data,
            backgroundColor: dashboardData.doughnut.data.map((_, idx) => colors[idx % colors.length]),
            borderWidth: 0,
            cutout: '67%'
        }]
    };

    const linhasLegendaAreas = Math.ceil((doughnutChartData.labels || []).length / 2);
    const alturaCardGraficos = 320 + Math.max(0, linhasLegendaAreas - 2) * 24;
    const gridLegendaStyle = {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        columnGap: '1rem',
        rowGap: '0.4rem'
    };

    return (
        <div className="d-flex bg-light min-vh-100">
            <SidebarSLL />
            <div className="flex-grow-1 p-4 dashboard-scroll text-start">
                <div className="container-fluid">
                    
                    <CabecalhoDashboard 
                        titulo={`Ranking e Gamificação - ${minhaSL}`}
                        subtitulo=""
                        utilizador={utilizador}
                        avatarUrl={avatarUrl}
                        linkHome="/sll/dashboard"
                    />

                    {/* KPIs ALINHADOS */}
                    <div className="row g-3 mb-4 text-center">
                        <div className="col-md-4">
                            <div className="card border-primary border-2 p-4 shadow-sm h-100 rounded-3 bg-white">
                                <div className="text-muted small fw-bold text-uppercase mb-2">Total de Pontos da Service Line</div>
                                <h2 className="fw-bold text-primary m-0">{dashboardData.kpis.totalPontos}</h2>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="card border-0 p-4 shadow-sm h-100 rounded-3 bg-white">
                                <div className="text-muted small fw-bold text-uppercase mb-2">Média de Pontos por Consultor</div>
                                <h2 className="fw-bold text-dark m-0">{dashboardData.kpis.mediaPontos}</h2>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="card border-0 p-4 shadow-sm h-100 rounded-3 bg-white">
                                <div className="text-muted small fw-bold text-uppercase mb-2">Consultores com Badges</div>
                                <h2 className="fw-bold text-primary m-0">{dashboardData.kpis.percComBadge}%</h2>
                            </div>
                        </div>
                    </div>

                    <div className="row g-4 mb-5">
                        <div className="col-md-5">
                            <div className="card border-0 shadow-sm p-4 h-100 bg-white rounded-4" style={{ minHeight: `${alturaCardGraficos}px` }}>
                                <h5 className="fw-bold mb-4 text-dark">Evolução dos Pontos totais da Equipa</h5>
                                <div className="mt-4" style={{ height: '220px' }}>
                                    <Bar data={barChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                                </div>
                            </div>
                        </div>

                        <div className="col-md-7">
                            <div className="card border-0 shadow-sm p-4 h-100 bg-white rounded-4" style={{ minHeight: `${alturaCardGraficos}px` }}>
                                <h5 className="fw-bold mb-2">Distribuição por Área da Service Line</h5>
                                <p className="small text-muted mb-3">Badges atribuídos atualmente</p>
                                <div className="small fw-bold text-dark mb-3" style={gridLegendaStyle}>
                                    {doughnutChartData.labels && doughnutChartData.labels.map((lbl, idx) => (
                                        <span key={idx} className="d-inline-flex align-items-center" style={{ minWidth: 0, whiteSpace: 'nowrap' }}>
                                            <i className="bi bi-circle-fill me-2" style={{color: colors[idx % colors.length], flex: '0 0 auto'}}></i>
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{lbl}</span>
                                        </span>
                                    ))}
                                </div>
                                <div className="d-flex justify-content-center flex-grow-1">
                                    <div style={{ width: '240px', height: '240px' }}>
                                        <Pie data={doughnutChartData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row g-4 mb-5">
                        <div className="col-md-6">
                            <div className="card border-0 shadow-sm p-4 h-100 bg-white rounded-4">
                                <h5 className="fw-bold mb-4 text-dark">Objetivos de Incentivo Ativos</h5>
                                
                                {dashboardData.objetivos.length > 0 ? dashboardData.objetivos.slice(0, 3).map((obj, i) => (
                                    <div key={i} className="mb-3 border-bottom pb-3 text-start">
                                        <div className="fw-bold text-dark">{obj.titulo} - {obj.consultor}</div>
                                        <div className="small text-muted mt-1">Objetivo: {obj.descricao}. Meta: {obj.dataMeta}</div>
                                    </div>
                                )) : (
                                    <p className="text-muted text-center py-3">Sem objetivos ativos atribuídos no momento.</p>
                                )}
                                
                                <div className="mt-auto pt-3 text-center">
                                    <button onClick={() => setShowModal(true)} className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm" style={{backgroundColor: '#5D78FF', border: 'none'}}>
                                        + Atribuir Novo Objetivo Individual
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-6">
                            <div className="card border-0 shadow-sm p-4 h-100 bg-white rounded-4">
                                <h5 className="fw-bold mb-4 text-dark text-center">Badges Premium Disponíveis (SLL)</h5>
                                
                                <div className="d-flex justify-content-center align-items-start flex-wrap gap-3 mb-4 mt-3">
                                    {dashboardData.premiumBadges && dashboardData.premiumBadges.length > 0 ? (
                                        dashboardData.premiumBadges.slice(0, 3).map((b, i) => (
                                            <div key={b.id || i} className="text-center px-2">
                                                <div className="rounded-circle d-flex align-items-center justify-content-center shadow-sm mb-2 mx-auto overflow-hidden position-relative" 
                                                     style={{ width: '70px', height: '70px', backgroundColor: '#F9F1DC', border: '3px solid #D4AF37' }}>
                                                    <img
                                                            src={resolvePublicBadgeImage(b.urlImagem || b.imagem || b.img)}
                                                            onError={useDefaultBadgeImageOnError}
                                                            alt={b.nome}
                                                            className="w-100 h-100 position-absolute"
                                                            style={{ objectFit: 'contain', padding: '6px', zIndex: 2 }}
                                                        />
                                                    
                                                </div>
                                                <div className="small fw-bold text-dark" style={{maxWidth: '120px', wordWrap: 'break-word'}}>{b.nome}</div>
                                                <div className="text-muted" style={{fontSize: '11px'}}>{b.tipo || 'Conquista Especial'}</div>
                                                <div className="fw-bold text-primary" style={{fontSize: '12px'}}>{b.pontos || 0} pts</div>
                                            </div>
                                        ))
                                    ) : (
                                        <>
                                            <div className="text-center px-2">
                                                <div className="bg-warning bg-opacity-25 rounded-circle mb-2 mx-auto" style={{width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                                    <i className="bi bi-award-fill text-warning fs-3"></i>
                                                </div>
                                                <div className="small fw-bold text-dark">Melhor<br/>Consultor</div>
                                            </div>
                                            <div className="text-center px-2">
                                                <div className="bg-warning bg-opacity-25 rounded-circle mb-2 mx-auto" style={{width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                                    <i className="bi bi-trophy-fill text-warning fs-3"></i>
                                                </div>
                                                <div className="small fw-bold text-dark">Consultor do<br/>Trimestre</div>
                                            </div>
                                            <div className="text-center px-2">
                                                <div className="bg-warning bg-opacity-25 rounded-circle mb-2 mx-auto" style={{width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                                    <i className="bi bi-lightning-charge-fill text-warning fs-3"></i>
                                                </div>
                                                <div className="small fw-bold text-dark">3 Badges em<br/>90 dias</div>
                                            </div>
                                        </>
                                    )}
                                </div>
                                
                                <div className="mt-auto pt-4 text-center">
                                    <button onClick={() => navigate('/sll/gamificacao/premium')} className="btn btn-outline-primary rounded-pill fw-bold w-100 border-2">
                                        Explorar Catálogo Premium
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* BOTÕES DE EXPORTAÇÃO (Excel e PDF) */}
                    <div className="sll-gamificacao-export d-flex justify-content-center mt-5 mb-5 pb-4">
                        <div className="dropdown">
                            <button className="btn btn-primary rounded-pill px-5 py-3 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2" 
                                    style={{backgroundColor: '#5D78FF', border: 'none', fontSize: '1.1rem'}} type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                <i className="bi bi-download"></i> Exportar Relatórios de Performance
                            </button>
                            <ul className="dropdown-menu shadow border-0 rounded-3 mt-2 w-100">
                                <li>
                                    <button className="dropdown-item py-2 fw-bold text-danger d-flex align-items-center gap-2" onClick={exportarPDF}>
                                        <i className="bi bi-file-earmark-pdf-fill fs-5"></i> Exportar para PDF
                                    </button>
                                </li>
                                <li>
                                    <button className="dropdown-item py-2 fw-bold text-success d-flex align-items-center gap-2" onClick={exportarExcel}>
                                        <i className="bi bi-file-earmark-excel-fill fs-5"></i> Exportar para Excel
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL: CRIAR OBJETIVO INDIVIDUAL */}
            {showModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 rounded-4 p-4 shadow-lg">
                            <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
                                <h4 className="fw-bold m-0 text-dark">Definir Novo Objetivo ({minhaSL})</h4>
                                <button type="button" className="btn-close shadow-none" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="text-start">
                                <div className="mb-3">
                                    <label className="form-label fw-bold text-dark small">Selecionar Consultor da Service Line (*)</label>
                                    <select className="form-select bg-light border-0 py-2 rounded-3 shadow-none" 
                                            value={consultorSelecionado} 
                                            onChange={(e) => setConsultorSelecionado(e.target.value)}>
                                        <option value="">Escolha um consultor da equipa...</option>
                                        {dashboardData.consultores.map(c => (
                                            <option key={c.idUtilizador} value={c.idUtilizador}>{c.nome}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-bold text-dark small">Nome do Objetivo (*)</label>
                                    <input type="text" className="form-control py-2 bg-light border-0 rounded-3 shadow-none" placeholder="Ex: Tornar-me Especialista Azure" 
                                           value={objTitulo} onChange={(e) => setObjTitulo(e.target.value)} />
                                </div>
                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold text-dark small">Data Meta para Conclusão (*)</label>
                                        <input type="date" className="form-control py-2 bg-light border-0 rounded-3 shadow-none" 
                                               value={objData} onChange={(e) => setObjData(e.target.value)} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold text-dark small">Tipo de Objetivo</label>
                                        <select className="form-select py-2 bg-light border-0 rounded-3 shadow-none" value={objTipo} onChange={(e) => setObjTipo(e.target.value)}>
                                            <option value="">Selecione...</option>
                                            <option value="Progressão de Nível (A-E)">Progressão de Nível (A-E)</option>
                                            <option value="Acúmulo de Pontos">Acúmulo de Pontos</option>
                                            <option value="Aquisição de Competência">Aquisição de Competência</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label className="form-label fw-bold text-dark small">Descrição e Plano de Ação (A Responsabilidade)</label>
                                    <textarea className="form-control bg-light border-0 rounded-3 shadow-none" rows="3" placeholder="Descreva os passos que o consultor deve seguir para atingir este objetivo..."
                                              value={objDesc} onChange={(e) => setObjDesc(e.target.value)}></textarea>
                                </div>

                                <div className="form-check mb-4">
                                    <input className="form-check-input border-primary shadow-none" type="checkbox" id="checkNotif" 
                                           checked={enviarNotif} onChange={(e) => setEnviarNotif(e.target.checked)} />
                                    <label className="form-check-label small text-muted fw-bold" htmlFor="checkNotif">
                                        Enviar Notificação Automática ao Consultor com este novo Objetivo
                                    </label>
                                </div>

                                <div className="d-flex gap-3 justify-content-center mt-2">
                                    <button className="btn btn-secondary px-5 rounded-pill fw-bold border-0" style={{backgroundColor: '#6c757d'}} onClick={() => setShowModal(false)}>Cancelar</button>
                                    <button className="btn btn-primary px-5 rounded-pill fw-bold shadow-sm" style={{backgroundColor: '#5D78FF', border: 'none'}} onClick={handleCriarObjetivo}>Ativar Objetivo</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GamificacaoSLL;
