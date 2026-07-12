import React, { useState, useEffect } from 'react';
import SidebarSLL from '../../components/SidebarSLL';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import TabelaGenerica from '../../components/TabelaGenerica';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { obterServiceLineSLL } from '../../utils/sllServiceLine';
import '../../assets/dashboard.css';

// Bibliotecas de exportação
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const GestaoConsultoresSLL = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    const [utilizador, setUtilizador] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState('https://via.placeholder.com/40');
    const [minhaSL, setMinhaSL] = useState('');

    const [consultoresDaSL, setConsultoresDaSL] = useState([]);
    const [areasDisponiveis, setAreasDisponiveis] = useState([]);

    const [pesquisa, setPesquisa] = useState('');
    const [areaFiltro, setAreaFiltro] = useState('Todas');
    const [experienciaFiltro, setExperienciaFiltro] = useState('Todas');
    const [tipoRanking, setTipoRanking] = useState('Pontos Totais');

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
                const [resUser, resLista, resEst] = await Promise.all([
                    axios.get(`https://softinsa-api-riya.onrender.com/users/configuracoes/${userLocal.ID_UTILIZADOR}`),
                    axios.get(`https://softinsa-api-riya.onrender.com/sll-consultores/lista?sl=${encodeURIComponent(slAtual)}`),
                    axios.get('https://softinsa-api-riya.onrender.com/estrutura')
                ]);

                if (resUser.data.success && resUser.data.data.avatar) setAvatarUrl(resUser.data.data.avatar);

                let areasExtratas = [];
                if (resLista.data.success) {
                    setConsultoresDaSL(resLista.data.data);
                    areasExtratas = [...new Set(resLista.data.data.map(c => c.area).filter(a => a !== 'N/A'))];
                }

                if (resEst.data.success) {
                    const slId = resEst.data.data.serviceLines.find(sl => sl.nome === slAtual)?.id;
                    if (slId) {
                        const areasSLL = resEst.data.data.areas.filter(a => a.slId === slId);
                        setAreasDisponiveis(['Todas', ...new Set([...areasSLL.map(a => a.nome), ...areasExtratas])]);
                        
                    } else {
                        setAreasDisponiveis(['Todas', ...areasExtratas]);
                    }
                } else {
                    setAreasDisponiveis(['Todas', ...areasExtratas]);
                }
            } catch (error) {
                console.error("Erro ao carregar dados:", error);
            } finally {
                setLoading(false);
            }
        };
        carregarDados();
    }, [navigate]);

    // Lógica de Filtros para a Tabela
    const filtrados = consultoresDaSL.filter(c => 
        (pesquisa === '' || c.nome.toLowerCase().includes(pesquisa.toLowerCase())) &&
        (areaFiltro === 'Todas' || c.area === areaFiltro) &&
        (experienciaFiltro === 'Todas' || c.experiencia === experienciaFiltro)
    );
    const experienciasDisponiveis = ['Todas', ...new Set(
        consultoresDaSL.map(c => c.experiencia).filter(Boolean)
    )];

    const top5Ranking = [...filtrados]
        .sort((a, b) => tipoRanking === 'Pontos Totais' ? b.pontos - a.pontos : b.badges - a.badges)
        .slice(0, 5);

    const top5PorPontos = [...filtrados]
        .sort((a, b) => (b.pontos || 0) - (a.pontos || 0))
        .slice(0, 5);

    const top5PorBadges = [...filtrados]
        .sort((a, b) => (b.badges || 0) - (a.badges || 0))
        .slice(0, 5);

    const mapConsultorExport = (c, index = null) => ({
        ...(index !== null ? { Posição: index + 1 } : {}),
        Consultor: c.nome || '',
        'Service Line': c.sl || minhaSL,
        Área: c.area || '',
        Experiência: c.experiencia || '',
        'Total Badges': c.badges || 0,
        'Pontos Totais': c.pontos || 0
    });

    // ==========================================
    // MÉTODOS DE EXPORTAÇÃO
    // ==========================================
    const exportarExcel = () => {
        if(filtrados.length === 0) return alert('Sem dados para exportar');
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{
            'Service Line': minhaSL,
            Pesquisa: pesquisa || 'Todas',
            Área: areaFiltro,
            Experiência: experienciaFiltro,
            Total: filtrados.length
        }]), "Filtros");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filtrados.map(c => mapConsultorExport(c))), "Consultores");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(top5PorPontos.map((c, i) => mapConsultorExport(c, i))), "Top 5 Pontos");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(top5PorBadges.map((c, i) => mapConsultorExport(c, i))), "Top 5 Badges");
        XLSX.writeFile(wb, `Lista_Consultores_${minhaSL.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.xlsx`);
    };

    const exportarPDF = () => {
        if(filtrados.length === 0) return alert('Sem dados para exportar');

        const doc = new jsPDF('l', 'mm', 'a4');
        let currentY = 20;

        // Cabeçalho
        doc.setFontSize(18);
        doc.text(`Lista de Consultores da Service Line: ${minhaSL}`, 14, currentY);
        doc.setFontSize(10);
        doc.setTextColor(100);
        currentY += 8;
        doc.text(`Gerado em: ${new Date().toLocaleString()} | Filtros: Pesquisa(${pesquisa || 'Todas'}) Área(${areaFiltro}) Experiência(${experienciaFiltro})`, 14, currentY);
        currentY += 15;

        // Tabela
        const corpoTabela = filtrados.map(c => [
            c.nome,
            c.area,
            c.experiencia,
            c.badges,
            `${c.pontos} pts`
        ]);

        autoTable(doc, {
            startY: currentY,
            head: [['Consultor', 'Área', 'Experiência', 'Badges Concluídos', 'Pontos Totais']],
            body: corpoTabela,
            theme: 'striped',
            headStyles: { fillColor: [93, 120, 255] },
            styles: { fontSize: 8, overflow: 'linebreak' }
        });

        doc.addPage('l');
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text('Top 5 por Pontos', 14, 15);
        const tabelaTop = (lista) => lista.map((c, i) => [
            `${i + 1}º`,
            c.nome || '',
            c.area || '',
            c.experiencia || '',
            c.badges || 0,
            `${c.pontos || 0} pts`
        ]);
        autoTable(doc, {
            startY: 22,
            head: [['Posição', 'Consultor', 'Área', 'Experiência', 'Badges', 'Pontos']],
            body: tabelaTop(top5PorPontos),
            theme: 'grid',
            headStyles: { fillColor: [93, 120, 255] },
            styles: { fontSize: 8, overflow: 'linebreak' }
        });

        const nextY = doc.lastAutoTable.finalY + 14;
        doc.text('Top 5 por Número de Badges', 14, nextY);
        autoTable(doc, {
            startY: nextY + 7,
            head: [['Posição', 'Consultor', 'Área', 'Experiência', 'Badges', 'Pontos']],
            body: tabelaTop(top5PorBadges),
            theme: 'grid',
            headStyles: { fillColor: [93, 120, 255] },
            styles: { fontSize: 8, overflow: 'linebreak' }
        });

        doc.save(`Lista_Consultores_${minhaSL.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`);
    };

    if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="d-flex bg-light min-vh-100">
            <SidebarSLL />
            
            <div className="flex-grow-1 p-4 dashboard-scroll text-start">
                <div className="container-fluid text-start">
                    
                    <CabecalhoDashboard 
                        titulo={`Gestão de Consultores - ${minhaSL}`}
                        subtitulo=""
                        utilizador={utilizador}
                        avatarUrl={avatarUrl}
                        linkHome="/sll/dashboard"
                    />

                    <section className="mb-4">
                        <h5 className="fw-bold mb-3">Filtros para a Lista de Consultores</h5>
                        <div className="row g-3">
                            <div className="col-md-4">
                                <div className="input-group shadow-sm border-0 rounded-3 overflow-hidden">
                                    <input type="text" className="form-control border-0 py-2 ps-4" placeholder="Pesquisar Consultores" onChange={(e) => setPesquisa(e.target.value)} />
                                    <span className="input-group-text bg-white border-0 pe-4"><i className="bi bi-search text-muted"></i></span>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <select className="form-select border-0 shadow-sm rounded-3 py-2" value={areaFiltro} onChange={(e) => setAreaFiltro(e.target.value)}>
                                    {areasDisponiveis.map(a => <option key={a} value={a}>{a === 'Todas' ? 'Todas as Áreas' : a}</option>)}
                                </select>
                            </div>
                            <div className="col-md-3">
                                <select className="form-select border-0 shadow-sm rounded-3 py-2" value={experienciaFiltro} onChange={(e) => setExperienciaFiltro(e.target.value)}>
                                    {experienciasDisponiveis.map(exp => <option key={exp} value={exp}>{exp === 'Todas' ? 'Todas as Experiências' : exp}</option>)}
                                </select>
                            </div>
                            <div className="col-md-2 text-end">
                                {/* Botão em Formato de Dropdown (Exportar PDF e Excel) */}
                                <div className="dropdown w-100">
                                    <button className="btn btn-primary rounded-3 w-100 py-2 fw-bold shadow-sm d-flex justify-content-center align-items-center gap-2" 
                                            style={{backgroundColor: '#5D78FF', border: 'none'}} type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                        <i className="bi bi-download"></i> Exportar Dados
                                    </button>
                                    <ul className="dropdown-menu w-100 shadow border-0 rounded-3 mt-2">
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
                    </section>

                    <section className="mb-5">
                        <div className="d-flex justify-content-between align-items-end mb-3 mt-5">
                            <h5 className="fw-bold m-0">Lista de Consultores ({filtrados.length})</h5>
                        </div>
                        <div className="mb-3">
                            <TabelaGenerica colunas={['Consultor', 'Área', 'Experiência', 'Badges Concluídos', 'Pontos Totais', 'Ações']} emptyMessage="Nenhum consultor corresponde aos filtros.">
                                {filtrados.map((c) => (
                                    <tr key={c.id}>
                                        <td className="fw-bold text-dark py-3">{c.nome}</td>
                                        <td className="text-muted py-3">{c.area}</td>
                                        <td className="text-muted py-3">{c.experiencia}</td>
                                        <td className="fw-bold py-3">{c.badges}</td>
                                        <td className="fw-bold text-primary py-3">{c.pontos}</td>
                                        <td className="py-3">
                                            <button onClick={() => navigate(`/sll/consultores/perfil/${c.id}`)} className="btn btn-primary btn-sm rounded-pill px-4 fw-bold shadow-sm" style={{backgroundColor: '#5D78FF', border: 'none'}}>Ver Perfil</button>
                                        </td>
                                    </tr>
                                ))}
                            </TabelaGenerica>
                        </div>
                        <div className="text-end">
                            <button className="btn btn-primary rounded-3 px-4 fw-bold shadow-sm" style={{backgroundColor: '#5D78FF', border: 'none'}} data-bs-toggle="modal" data-bs-target="#modalRankingCompleto">
                                Ver Ranking Completo da Service Line
                            </button>
                        </div>
                    </section>

                    <section className="mb-5 p-4 bg-white rounded-4 shadow-sm border border-primary border-opacity-25">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h5 className="fw-bold m-0"><i className="bi bi-trophy-fill text-warning me-2"></i>Top 5 da Service Line - {minhaSL}</h5>
                            <div className="d-flex align-items-center gap-2">
                                <span className="small fw-bold text-muted">Ordernar por:</span>
                                <select className="form-select form-select-sm border-0 bg-light fw-bold text-primary shadow-sm py-2 px-3 rounded-3" 
                                        style={{width: '180px'}} value={tipoRanking} onChange={(e) => setTipoRanking(e.target.value)}>
                                    <option value="Pontos Totais">Pontos Totais</option>
                                    <option value="Número de Badges">Número de Badges</option>
                                </select>
                            </div>
                        </div>
                        <div className="table-responsive">
                            <table className="table table-sm align-middle text-center mb-0">
                                <thead className="bg-light text-primary">
                                    <tr>
                                        <th className="py-3">Posição</th>
                                        <th className="py-3">Consultor</th>
                                        <th className="py-3">Área</th>
                                        <th className="py-3">{tipoRanking}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {top5Ranking.length > 0 ? top5Ranking.map((c, index) => (
                                        <tr key={c.id}>
                                            <td className="fw-bold py-3 text-primary fs-5">{index + 1}º</td>
                                            <td className="fw-bold text-dark fs-6">{c.nome}</td>
                                            <td className="text-muted">{c.area}</td>
                                            <td className="fw-bold text-primary fs-5">{tipoRanking === 'Pontos Totais' ? c.pontos : c.badges}</td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="4" className="py-3 text-muted">Sem dados para o ranking.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>

            {/* MODAL DO RANKING COMPLETO (SLL) */}
            <div className="modal fade" id="modalRankingCompleto" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                    <div className="modal-content border-0 shadow-lg rounded-4">
                        <div className="modal-header bg-primary text-white">
                            <h5 className="modal-title fw-bold">Ranking Geral {minhaSL}: {tipoRanking}</h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div className="modal-body p-0">
                            <table className="table table-hover align-middle text-center mb-0">
                                <thead className="table-light sticky-top">
                                    <tr>
                                        <th className="py-3">Posição</th>
                                        <th className="py-3">Consultor</th>
                                        <th className="py-3">Área</th>
                                        <th className="py-3">{tipoRanking}</th>
                                        <th className="py-3">Ação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...filtrados].sort((a,b) => tipoRanking === 'Pontos Totais' ? b.pontos - a.pontos : b.badges - a.badges).map((c, index) => (
                                        <tr key={c.id}>
                                            <td className="fw-bold text-primary fs-6">{index + 1}º</td>
                                            <td className="fw-bold text-dark">{c.nome}</td>
                                            <td className="text-muted">{c.area}</td>
                                            <td className="fw-bold text-primary">{tipoRanking === 'Pontos Totais' ? c.pontos : c.badges}</td>
                                            <td>
                                                <button onClick={() => {
                                                    const closeBtn = document.querySelector('#modalRankingCompleto .btn-close');
                                                    if(closeBtn) closeBtn.click();
                                                    setTimeout(() => navigate(`/sll/consultores/perfil/${c.id}`), 250);
                                                }} className="btn btn-sm btn-primary rounded-pill px-4 py-2 fw-bold">Ver Perfil</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="modal-footer border-0 bg-light">
                            <button type="button" className="btn btn-secondary rounded-pill px-4 fw-bold" data-bs-dismiss="modal">Fechar Diretório</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GestaoConsultoresSLL;
