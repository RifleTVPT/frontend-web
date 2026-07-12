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

const PedidosPendentesSLL = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    
    const [utilizador, setUtilizador] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState('https://via.placeholder.com/40');
    const [minhaSL, setMinhaSL] = useState('');

    const obterLetraNivel = (nivelStr) => {
        if (!nivelStr) return '';
        const n = nivelStr.toLowerCase();
        if (n.includes('1') || n.includes('júnior') || n.includes('junior') || n === 'a' || n.includes(' a ') || n.startsWith('a -')) return 'A';
        if (n.includes('2') || n.includes('intermédio') || n.includes('intermedio') || n.includes('pleno') || n === 'b' || n.includes(' b ') || n.startsWith('b -')) return 'B';
        if (n.includes('3') || n.includes('sénior') || n.includes('senior') || n === 'c' || n.includes(' c ') || n.startsWith('c -')) return 'C';
        if (n.includes('4') || n.includes('especialista') || n.includes('master') || n === 'd' || n.includes(' d ') || n.startsWith('d -')) return 'D';
        if (n.includes('5') || n.includes('líder') || n.includes('lider') || n === 'e' || n.includes(' e ') || n.startsWith('e -')) return 'E';
        return '';
    };

    const [pedidosSLL, setPedidosSLL] = useState([]);
    const [kpis, setKpis] = useState({ aprovadosTotal: 0, rejeitadosTotal: 0, taxaAprovacao: 0, taxaRejeicao: 0 });

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

                const resPendentes = await axios.get(`https://softinsa-api-riya.onrender.com/pedidos/sll/pendentes?sl=${encodeURIComponent(slAtual)}`);
                if (resPendentes.data.success) {
                    setPedidosSLL(resPendentes.data.data);
                    setKpis(resPendentes.data.kpis);
                }
            } catch (error) {
                console.error("Erro:", error);
            } finally {
                setLoading(false);
            }
        };
        carregarDados();
        const atualizacao = window.setInterval(carregarDados, 15000);
        return () => window.clearInterval(atualizacao);
    }, [navigate]);

    // ==========================================
    // MÉTODOS DE EXPORTAÇÃO
    // ==========================================
    const exportarExcel = () => {
        if (pedidosSLL.length === 0) return alert('Sem dados para exportar no momento.');
        
        const ws = XLSX.utils.json_to_sheet(pedidosSLL.map(item => ({
            'Consultor': item.consultor,
            'Badge Pretendido': `${item.badge} - ${item.area} (Nível ${obterLetraNivel(item.nivel) || item.nivel})`,
            'Data do Pedido': item.data
        })));
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{
            'Service Line': minhaSL,
            Total: pedidosSLL.length,
            'Aceites Total': kpis.aprovadosTotal,
            'Rejeitados Total': kpis.rejeitadosTotal,
            'Taxa Aprovação': `${kpis.taxaAprovacao}%`,
            'Taxa Rejeição': `${kpis.taxaRejeicao}%`
        }]), "Resumo");
        XLSX.utils.book_append_sheet(wb, ws, "Pedidos Pendentes");
        XLSX.writeFile(wb, `Pedidos_Pendentes_${minhaSL.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.xlsx`);
    };

    const exportarPDF = () => {
        if (pedidosSLL.length === 0) return alert('Sem dados para exportar no momento.');

        const doc = new jsPDF('l', 'mm', 'a4');
        let currentY = 20;

        // Cabeçalho
        doc.setFontSize(18);
        doc.text(`Pedidos Pendentes de Validação: ${minhaSL}`, 14, currentY);
        doc.setFontSize(10);
        doc.setTextColor(100);
        currentY += 8;
        doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, currentY);
        currentY += 6;
        doc.text(`Resumo: ${pedidosSLL.length} pendentes | ${kpis.aprovadosTotal} aceites | ${kpis.rejeitadosTotal} recusados | Aprovação ${kpis.taxaAprovacao}%`, 14, currentY);
        currentY += 15;

        // Desenhar Tabela com AutoTable
        const corpoTabela = pedidosSLL.map(item => [
            item.consultor,
            `${item.badge} - ${item.area} (Nível ${obterLetraNivel(item.nivel) || item.nivel})`,
            item.data
        ]);

        autoTable(doc, {
            startY: currentY,
            head: [['Consultor', 'Badge Pretendido', 'Data do Pedido']],
            body: corpoTabela,
            theme: 'striped',
            headStyles: { fillColor: [93, 120, 255] },
            styles: { fontSize: 8, overflow: 'linebreak' }
        });

        doc.save(`Pedidos_Pendentes_${minhaSL.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`);
    };

    if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="d-flex bg-light min-vh-100">
            <SidebarSLL />
            
            <div className="flex-grow-1 p-4 dashboard-scroll text-start">
                <div className="container-fluid text-start">
                    
                    <CabecalhoDashboard 
                        titulo={`Pedidos Pendentes - ${minhaSL} Service Line`}
                        subtitulo=""
                        utilizador={utilizador}
                        avatarUrl={avatarUrl}
                    />

                    <div className="row g-4 mb-5">
                        <div className="col-md-5">
                            <div className="card border-primary border-2 shadow-sm p-4 text-center h-100 rounded-0" style={{ borderStyle: 'solid' }}>
                                <div className="fw-bold text-dark h5 mb-3 px-4">Nº total de pedidos pendentes para validação final</div>
                                <h1 className="display-1 fw-bold text-primary mb-0">{pedidosSLL.length}</h1>
                                <small className="text-muted">à espera de decisão</small>
                            </div>
                        </div>

                        <div className="col-md-7">
                            <div className="row g-3 h-100">
                                <div className="col-6">
                                    <div className="card border-0 shadow-sm p-3 h-100 text-center rounded-3 bg-white d-flex justify-content-center">
                                        <div className="small fw-bold text-muted mb-1">Aceites (total)</div>
                                        <div className="h3 fw-bold text-primary">{kpis.aprovadosTotal}</div>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="card border-0 shadow-sm p-3 h-100 text-center rounded-3 bg-white d-flex justify-content-center">
                                        <div className="small fw-bold text-muted mb-1">Recusados (total)</div>
                                        <div className="h3 fw-bold text-primary">{kpis.rejeitadosTotal}</div>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="card border-0 shadow-sm p-3 h-100 text-center rounded-3 bg-white d-flex flex-column justify-content-center">
                                        <div className="h4 fw-bold m-0 text-success">{kpis.taxaAprovacao} %</div>
                                        <div className="text-muted small mt-1">Taxa de aprovação média</div>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="card border-0 shadow-sm p-3 h-100 text-center rounded-3 bg-white d-flex flex-column justify-content-center">
                                        <div className="h4 fw-bold m-0 text-danger">{kpis.taxaRejeicao} %</div>
                                        <div className="text-muted small mt-1">Taxa de rejeição média</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <h4 className="fw-bold mb-4 text-dark">Pedidos Pendentes para validação</h4>

                    <div className="mb-3">
                        <TabelaGenerica colunas={['Consultor', 'Badge Pretendido', 'Data do Pedido', 'Ação']} emptyMessage={
                            <div className="py-5 text-muted text-center">
                                <i className="bi bi-inbox fs-2 d-block mb-2"></i>
                                Não há pedidos pendentes de validação no momento.
                            </div>
                        }>
                            {pedidosSLL.map((p) => (
                                <tr key={p.id}>
                                    <td className="fw-bold py-3">{p.consultor}</td>
                                    <td className="py-3">
                                        <div className="fw-bold text-dark">{p.badge} - {p.area} (Nível {obterLetraNivel(p.nivel) || p.nivel})</div>
                                    </td>
                                    <td className="py-3">{p.data}</td>
                                    <td className="py-3">
                                        <button 
                                            onClick={() => navigate(`/sll/validacoes/validar/${p.id}`)} 
                                            className="btn btn-primary btn-sm rounded-pill px-4 fw-bold shadow-sm"
                                        >
                                            Validar agora
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </TabelaGenerica>
                    </div>

                    {/* BOTÕES DE EXPORTAÇÃO (Excel e PDF) */}
                    <div className="d-flex justify-content-center mt-5 mb-5 pb-4">
                        <div className="dropdown">
                            <button className="btn btn-primary rounded-pill px-5 py-3 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2" 
                                    style={{backgroundColor: '#5D78FF', border: 'none', fontSize: '1.1rem', minWidth: '400px'}} type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                <i className="bi bi-download"></i> Exportar Lista
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
        </div>
    );
};

export default PedidosPendentesSLL;
