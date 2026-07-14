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

const BadgesExpiracaoSLL = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    // Estados do Utilizador/SL
    const [utilizador, setUtilizador] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState('https://via.placeholder.com/40');
    const [minhaSL, setMinhaSL] = useState('');

    // Estados da API
    const [dadosExpiracao, setDadosExpiracao] = useState([]);
    const [areasDisponiveis, setAreasDisponiveis] = useState([]);

    // Estados dos Filtros
    const [niveisAtivos, setNiveisAtivos] = useState([]);
    const [pesquisa, setPesquisa] = useState('');
    const [periodo, setPeriodo] = useState('Todas');
    const [areaFiltro, setAreaFiltro] = useState('Todas');

    const [todosNiveis, setTodosNiveis] = useState([]);

    const obterLetraNivel = (nivelStr) => {
        if (!nivelStr) return '';
        const n = nivelStr.toLowerCase();
        if (n.includes('1') || n.includes('júnior') || n.includes('junior') || n === 'a' || n.includes(' a ') || n.startsWith('a -')) return 'A';
        if (n.includes('2') || n.includes('intermédio') || n.includes('intermedio') || n.includes('pleno') || n === 'b' || n.includes(' b ') || n.startsWith('b -')) return 'B';
        if (n.includes('3') || n.includes('especialista') || n === 'c' || n.includes(' c ') || n.startsWith('c -')) return 'C';
        if (n.includes('4') || n.includes('sénior') || n.includes('senior') || n.includes('master') || n === 'd' || n.includes(' d ') || n.startsWith('d -')) return 'D';
        if (n.includes('5') || n.includes('líder') || n.includes('lider') || n === 'e' || n.includes(' e ') || n.startsWith('e -')) return 'E';
        return '';
    };

    const formatNivel = (n) => {
        const letra = obterLetraNivel(n);
        const nomes = { A: 'Júnior', B: 'Intermédio', C: 'Sénior', D: 'Especialista', E: 'Líder de Conhecimento' };
        return letra ? `${letra} - ${nomes[letra]}` : n;
    };

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
                // 1. Foto Perfil
                const resUser = await axios.get(`https://softinsa-api-riya.onrender.com/users/configuracoes/${userLocal.ID_UTILIZADOR}`);
                if (resUser.data.success && resUser.data.data.avatar) setAvatarUrl(resUser.data.data.avatar);

                // 2. Badges em Expiração (filtrados por SL no pedido)
                const response = await axios.get(`https://softinsa-api-riya.onrender.com/expiracao/badges?sl=${encodeURIComponent(slAtual)}`);
                let areasDosBadges = [];
                if (response.data.success) {
                    setDadosExpiracao(response.data.data);
                    areasDosBadges = [...new Set(response.data.data.map(item => item.area))];
                }

                // 3. Obter Áreas Ativas da Estrutura para preencher a Dropdown
                const resEstrutura = await axios.get('https://softinsa-api-riya.onrender.com/estrutura');
                if (resEstrutura.data.success) {
                    const est = resEstrutura.data.data;
                    const slId = est.serviceLines.find(s => s.nome === slAtual)?.id;
                    if (slId) {
                        const areasSLLObj = est.areas.filter(a => a.slId === slId);
                        const areasSLL = areasSLLObj.map(a => a.nome);
                        // Juntar áreas da estrutura com áreas que possam existir nos dados antigos
                        const todas = [...new Set([...areasSLL, ...areasDosBadges])];
                        setAreasDisponiveis(todas);

                        // Extrair níveis ativos para a SL do líder
                        const niveisParaAtivar = [];
                        areasSLLObj.forEach(a => {
                            a.niveisAtivos.forEach(n => {
                                if(!niveisParaAtivar.includes(n)) niveisParaAtivar.push(n);
                            });
                        });
                        niveisParaAtivar.sort((a, b) => formatNivel(a).localeCompare(formatNivel(b)));
                        setTodosNiveis(niveisParaAtivar);
                        setNiveisAtivos(niveisParaAtivar);
                    } else {
                        setAreasDisponiveis(areasDosBadges);
                    }
                } else {
                    setAreasDisponiveis(areasDosBadges);
                }
            } catch (error) {
                console.error("Erro ao carregar expirações:", error);
            } finally {
                setLoading(false);
            }
        };
        carregarDados();
    }, [navigate]);

    const toggleNivel = (nivel) => {
        setNiveisAtivos(prev => prev.includes(nivel) ? prev.filter(n => n !== nivel) : [...prev, nivel]);
    };

    const handleNotificar = async (item) => {
        try {
            const response = await axios.post('https://softinsa-api-riya.onrender.com/expiracao/notificar', {
                idUtilizador: item.idUtilizador,
                badgeNome: item.badge,
                diasRestantes: item.diasRestantes
            });
            if (response.data.success) {
                alert(`Notificação enviada com sucesso para ${item.consultor}!`);
            }
        } catch (error) {
            alert('Erro ao enviar notificação.');
        }
    };

    const getCorDias = (dias) => {
        if (dias < 30) return 'text-danger'; 
        if (dias <= 90) return 'text-warning'; 
        return 'text-success';
    };

    // --- LÓGICA DE FILTRAGEM ---
    const dadosFiltrados = dadosExpiracao.filter(item => {
        const matchArea = areaFiltro === 'Todas' || item.area === areaFiltro;
        const matchNivel = niveisAtivos.includes(item.nivel);
        const matchPeriodo = periodo === 'Todas' || item.diasRestantes <= parseInt(periodo) * 30;
        const matchPesquisa = item.consultor.toLowerCase().includes(pesquisa.toLowerCase());

        return matchArea && matchNivel && matchPeriodo && matchPesquisa;
    });

    // ==========================================
    // MÉTODOS DE EXPORTAÇÃO
    // ==========================================
    const resumoFiltros = () => ({
        'Service Line': minhaSL,
        Área: areaFiltro,
        Níveis: niveisAtivos.length ? niveisAtivos.map(formatNivel).join(', ') : 'Todos',
        Pesquisa: pesquisa || 'Todas',
        Período: periodo === 'Todas' ? 'Qualquer período' : `Próximos ${parseInt(periodo) * 30} dias`,
        Total: dadosFiltrados.length
    });

    const exportarExcel = () => {
        if (dadosFiltrados.length === 0) return alert('Sem dados para exportar com os filtros atuais.');
        
        const ws = XLSX.utils.json_to_sheet(dadosFiltrados.map(item => ({
            'Consultor': item.consultor,
            'Badge': `${item.badge} - ${item.area} (Nível ${obterLetraNivel(item.nivel) || item.nivel})`,
            'Data Atribuição': item.dataAtribuicao,
            'Data Expiração': item.dataExpiracao,
            'Dias Restantes': item.diasRestantes
        })));
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([resumoFiltros()]), "Filtros");
        XLSX.utils.book_append_sheet(wb, ws, "Badges em Expiracao");
        XLSX.writeFile(wb, `Badges_Expiracao_${minhaSL.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.xlsx`);
    };

    const exportarPDF = () => {
        if (dadosFiltrados.length === 0) return alert('Sem dados para exportar com os filtros atuais.');

        const doc = new jsPDF('l', 'mm', 'a4');
        let currentY = 20;

        doc.setFontSize(18);
        doc.text(`Badges em Expiração: ${minhaSL}`, 14, currentY);
        doc.setFontSize(10);
        doc.setTextColor(100);
        currentY += 8;
        doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, currentY);
        currentY += 6;
        doc.text(`Filtros: Área(${areaFiltro}) | Níveis(${niveisAtivos.length ? niveisAtivos.map(formatNivel).join(', ') : 'Todos'}) | Pesquisa(${pesquisa || 'Todas'}) | Período(${periodo === 'Todas' ? 'Qualquer período' : `Próximos ${parseInt(periodo) * 30} dias`})`, 14, currentY);
        currentY += 15;

        const corpoTabela = dadosFiltrados.map(item => [
            item.consultor,
            `${item.badge} - ${item.area} (Nível ${obterLetraNivel(item.nivel) || item.nivel})`,
            item.dataAtribuicao,
            item.dataExpiracao,
            `${item.diasRestantes} dias`
        ]);

        autoTable(doc, {
            startY: currentY,
            head: [['Consultor', 'Badge', 'Data Atribuição', 'Data Expiração', 'Tempo Restante']],
            body: corpoTabela,
            theme: 'striped',
            headStyles: { fillColor: [93, 120, 255] },
            styles: { fontSize: 8, overflow: 'linebreak' }
        });

        doc.save(`Badges_Expiracao_${minhaSL.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`);
    };

    if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="d-flex bg-light min-vh-100">
            <SidebarSLL />

            <div className="flex-grow-1 p-4 dashboard-scroll">
                <div className="container-fluid text-start">
                    
                    <CabecalhoDashboard 
                        titulo={`Badges em Expiração - ${minhaSL}`}
                        subtitulo=""
                        utilizador={utilizador}
                        avatarUrl={avatarUrl}
                    />

                    {/* FILTROS: Grelha Ajustada (5 / 7) */}
                    <div className="row g-4 mb-4 align-items-end justify-content-between">
                        <div className="col-md-5">
                            <label className="form-label fw-bold text-dark h5 mb-3">Período de Expiração</label>
                            <select className="form-select border-0 shadow-sm py-2 rounded-3 bg-white" value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
                                <option value="Todas">Qualquer Período</option>
                                <option value="1">Próximos 30 dias</option>
                                <option value="3">Próximos 3 meses</option>
                                <option value="6">Próximos 6 meses</option>
                                <option value="12">Próximo 1 ano</option>
                            </select>
                        </div>
                        
                        <div className="col-md-5">
                            <label className="form-label fw-bold text-dark h5 mb-3">Área de Competência</label>
                            <select className="form-select border-0 shadow-sm py-2 rounded-3" value={areaFiltro} onChange={(e) => setAreaFiltro(e.target.value)}>
                                <option value="Todas">Todas as Áreas</option>
                                {areasDisponiveis.map(area => <option key={area} value={area}>{area}</option>)}
                            </select>
                        </div>
                        
                        {/* BOTÕES DE EXPORTAÇÃO (Excel e PDF) */}
                        <div className="col-md-2 text-end">
                            <div className="dropdown w-100">
                                <button className="btn btn-primary rounded-3 py-2 w-100 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2" 
                                        style={{backgroundColor: '#5D78FF', border: 'none'}} type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                    <i className="bi bi-download"></i> Exportar
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

                    {/* SEGUNDA LINHA DE FILTROS */}
                    <div className="row g-4 mb-5 align-items-end">
                        <div className="col-md-5">
                            <label className="form-label fw-bold text-dark h5 mb-3">Pesquisar Consultor</label>
                            <div className="position-relative">
                                <input type="text" className="form-control border-0 shadow-sm py-2 rounded-3" placeholder="Ex: João Silva" 
                                       value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} />
                                <i className="bi bi-search position-absolute end-0 top-50 translate-middle-y me-3 text-muted"></i>
                            </div>
                        </div>

                        <div className="col-md-7 text-start">
                            <label className="form-label fw-bold text-dark h5 mb-3 d-block">Nível de Competência</label>
                            <div className="sll-niveis-filter d-flex gap-2 text-start">
                                {todosNiveis.map(n => (
                                    <button key={n} onClick={() => toggleNivel(n)}
                                        className={`btn btn-sm shadow-sm fw-bold px-3 rounded-3 border-0 transition-all py-2 ${niveisAtivos.includes(n) ? 'btn-primary' : 'bg-white text-muted'}`}
                                        style={{ fontSize: '0.8rem' }}>
                                        {formatNivel(n)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* TABELA */}
                    <div className="mb-5">
                        <TabelaGenerica colunas={['Consultor', 'Badge', 'Data Atribuição', 'Data Expiração', 'Tempo Restante', 'Ações']} emptyMessage={
                            <>
                                <i className="bi bi-shield-check fs-2 d-block mb-2 opacity-50"></i>
                                Nenhum badge a expirar neste intervalo para os filtros selecionados.
                            </>
                        }>
                            {dadosFiltrados.map((item, index) => (
                                <tr key={index}>
                                    <td className="fw-bold text-dark py-3">{item.consultor}</td>
                                    <td className="py-3">
                                        <div className="fw-bold text-dark">{item.badge} - {item.area} (Nível {obterLetraNivel(item.nivel) || item.nivel})</div>
                                    </td>
                                    <td className="text-muted py-3">{item.dataAtribuicao}</td>
                                    <td className="fw-bold text-dark py-3">{item.dataExpiracao}</td>
                                    <td className="py-3">
                                        <div className={`${getCorDias(item.diasRestantes)} fw-bold`}>
                                            {item.diasRestantes} dias
                                        </div>
                                    </td>
                                    <td className="py-3">
                                        <button 
                                            className="sll-notificar-btn btn btn-outline-primary btn-sm px-3 rounded-pill fw-bold"
                                            onClick={() => handleNotificar(item)}
                                        >
                                            <i className="bi bi-bell-fill me-2"></i>Notificar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </TabelaGenerica>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BadgesExpiracaoSLL;
