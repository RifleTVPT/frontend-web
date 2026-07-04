import React, { useState, useEffect } from 'react';
import SidebarConsultor from '../../components/SidebarConsultor';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import TabelaGenerica from '../../components/TabelaGenerica';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

// Importações Corrigidas para Exportação PDF e Excel
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; 
import * as XLSX from 'xlsx';
import '../../assets/dashboard.css';

// Registar componentes do Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const RankingPontosConsultor = () => {
  const navigate = useNavigate();
  const [showFullRanking, setShowFullRanking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [utilizador, setUtilizador] = useState(null);
  const [estatisticas, setEstatisticas] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('https://via.placeholder.com/40');

  useEffect(() => {
    const userLocal = JSON.parse(sessionStorage.getItem('user'));
    if (!userLocal) {
        navigate('/');
        return;
    }
    setUtilizador(userLocal);

    // Carregar a foto de perfil oficial da BD para o cabeçalho
    const carregarFotoPerfil = async () => {
      try {
          const response = await axios.get(`https://softinsa-api-riya.onrender.com/users/configuracoes/${userLocal.ID_UTILIZADOR}`);
          if (response.data.success && response.data.data.avatar) {
              setAvatarUrl(response.data.data.avatar);
          }
      } catch (error) {
          console.error("Erro ao carregar a foto de perfil no header:", error);
      }
    };
    carregarFotoPerfil();

    const carregarEstatisticas = async () => {
      try {
        const response = await axios.get(`https://softinsa-api-riya.onrender.com/estatisticas/consultor/${userLocal.ID_UTILIZADOR}`);
        if (response.data.success) {
          setEstatisticas(response.data.data);
        }
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarEstatisticas();
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    navigate('/');
  };

  // ==========================================
  // LÓGICA DE EXPORTAÇÃO (PDF e EXCEL)
  // ==========================================
  const exportarParaPDF = () => {
    try {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Ranking e Pontuação - Softinsa", 14, 20);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-PT')}`, 14, 28);
        doc.setTextColor(0);
        doc.setFontSize(12);
        doc.text(`Ranking pessoal: ${estatisticas.kpis.ranking} de ${estatisticas.kpis.totalConsultores}`, 14, 40);
        doc.text(`Total de pontos: ${estatisticas.kpis.pontos}`, 14, 47);
        doc.text(`Catálogo concluído: ${estatisticas.kpis.percentagemBadges}%`, 14, 54);

        autoTable(doc, {
          head: [["Mês", "Pontos adquiridos"]],
          body: estatisticas.graficoLinha.labels.map((mes, index) => [
            mes,
            estatisticas.graficoLinha.data[index]
          ]),
          startY: 64,
          theme: 'grid',
          headStyles: { fillColor: [13, 110, 253] }
        });

        autoTable(doc, {
          head: [["Mês", "Badges normais", "Conquistas especiais"]],
          body: estatisticas.graficoBarras.labels.map((mes, index) => [
            mes,
            estatisticas.graficoBarras.normais[index],
            estatisticas.graficoBarras.especiais[index]
          ]),
          startY: doc.lastAutoTable.finalY + 10,
          theme: 'grid',
          headStyles: { fillColor: [52, 73, 94] }
        });

        doc.addPage();
        doc.setFontSize(14);
        doc.text("Classificação completa", 14, 20);
        autoTable(doc, {
          head: [["Posição", "Consultor", "Badges", "Service Line", "Área", "Pontos"]],
          body: estatisticas.rankingCompleto.map(row => [
            row.pos,
            row.nome,
            row.badges,
            row.serviceLine,
            row.area,
            row.pontos
          ]),
          startY: 28,
          theme: 'grid',
          headStyles: { fillColor: [13, 110, 253] }
        });

        doc.save("Softinsa_Ranking_e_Pontuacao.pdf");
    } catch (error) {
        console.error("Erro ao gerar PDF do ranking:", error);
        alert("Ocorreu um erro ao gerar o PDF. Verifique a consola.");
    }
  };

  const exportarParaExcel = () => {
    try {
        const workbook = XLSX.utils.book_new();

        const resumo = XLSX.utils.json_to_sheet([{
          'Ranking Pessoal': estatisticas.kpis.ranking,
          'Total de Consultores': estatisticas.kpis.totalConsultores,
          'Total de Pontos': estatisticas.kpis.pontos,
          'Crescimento vs. Mês Passado (%)': estatisticas.kpis.crescimentoPontos,
          'Catálogo Concluído (%)': estatisticas.kpis.percentagemBadges
        }]);
        XLSX.utils.book_append_sheet(workbook, resumo, "Resumo");

        const pontosMensais = XLSX.utils.json_to_sheet(
          estatisticas.graficoLinha.labels.map((mes, index) => ({
            'Mês': mes,
            'Pontos Adquiridos': estatisticas.graficoLinha.data[index]
          }))
        );
        XLSX.utils.book_append_sheet(workbook, pontosMensais, "Pontos Mensais");

        const badgesMensais = XLSX.utils.json_to_sheet(
          estatisticas.graficoBarras.labels.map((mes, index) => ({
            'Mês': mes,
            'Badges Normais': estatisticas.graficoBarras.normais[index],
            'Conquistas Especiais': estatisticas.graficoBarras.especiais[index]
          }))
        );
        XLSX.utils.book_append_sheet(workbook, badgesMensais, "Badges Mensais");

        const ranking = XLSX.utils.json_to_sheet(estatisticas.rankingCompleto.map(row => ({
          'Posição': row.pos,
          'Nome do Consultor': row.nome,
          'Badges Conquistados': row.badges,
          'Service Line': row.serviceLine,
          'Área': row.area,
          'Pontos Acumulados': row.pontos
        })));
        ranking['!cols'] = [
          { wch: 10 }, { wch: 35 }, { wch: 20 },
          { wch: 22 }, { wch: 22 }, { wch: 20 }
        ];
        XLSX.utils.book_append_sheet(workbook, ranking, "Ranking Completo");

        XLSX.writeFile(workbook, "Softinsa_Ranking_e_Pontuacao.xlsx");
    } catch (error) {
        console.error("Erro ao gerar Excel do ranking:", error);
        alert("Ocorreu um erro ao gerar o ficheiro Excel.");
    }
  };
  // ==========================================

  if (loading || !estatisticas) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

  // Encontrar o valor máximo para destacar no gráfico de linha
  const maxLineValue = Math.max(...estatisticas.graficoLinha.data);

  // Configuração Gráfico de Linha (Progresso do Consultor)
  const lineData = {
    labels: estatisticas.graficoLinha.labels,
    datasets: [{
      label: 'Pontos Adquiridos',
      data: estatisticas.graficoLinha.data,
      borderColor: '#F93131',
      backgroundColor: 'rgba(249, 49, 49, 0.1)',
      tension: 0.4,
      fill: true,
      pointRadius: 5,
      pointBackgroundColor: (context) => context.raw === maxLineValue ? '#F93131' : 'transparent',
    }]
  };

  // Configuração Gráfico de Barras (Evolução do Número de Badges)
  const barData = {
    labels: estatisticas.graficoBarras.labels,
    datasets: [
      {
        label: 'Badges Normais',
        data: estatisticas.graficoBarras.normais,
        backgroundColor: '#0d6efd',
      },
      {
        label: 'Conquistas Especiais',
        data: estatisticas.graficoBarras.especiais,
        backgroundColor: '#34495e',
      }
    ]
  };

  return (
    <div className="d-flex bg-light min-vh-100">
      <SidebarConsultor />

      <div className="flex-grow-1 p-4 dashboard-scroll">
        <div className="container-fluid text-start">
          
          {/* CABEÇALHO PADRONIZADO */}
          <CabecalhoDashboard 
            titulo="Ranking Geral e Pontuação"
            utilizador={utilizador}
            avatarUrl={avatarUrl}
          />

          {/* KPI Cards */}
          <div className="row g-3 mb-4">
            <div className="col-md-4 text-center">
              <div className="card border-primary p-3 shadow-sm rounded-3 h-100 bg-white" style={{ border: '1px solid #0d6efd' }}>
                <h6 className="fw-bold text-dark">Seu Ranking Pessoal</h6>
                <h3 className="fw-bold text-primary my-2">#{estatisticas.kpis.ranking} de {estatisticas.kpis.totalConsultores}</h3>
                <small className="text-muted">Consultores da Empresa</small>
              </div>
            </div>
            <div className="col-md-4 text-center">
              <div className="card border-primary p-3 shadow-sm rounded-3 h-100 bg-white" style={{ border: '1px solid #0d6efd' }}>
                <h6 className="fw-bold text-dark">Total de Pontos Acumulados</h6>
                <h3 className="fw-bold text-primary my-2">{estatisticas.kpis.pontos} pts</h3>
                <small className={`${estatisticas.kpis.crescimentoPontos.toString().startsWith('-') ? 'text-danger' : 'text-success'} fw-bold`}>
                  {estatisticas.kpis.crescimentoPontos}% vs. Mês Passado
                </small>
              </div>
            </div>
            <div className="col-md-4 text-center">
              <div className="card border-primary p-3 shadow-sm rounded-3 h-100 bg-white" style={{ border: '1px solid #0d6efd' }}>
                <h6 className="fw-bold text-dark">Badges que já concluiu</h6>
                <h3 className="fw-bold text-primary my-2">{estatisticas.kpis.percentagemBadges}%</h3>
                <small className="text-muted">do Catálogo Global atual</small>
              </div>
            </div>
          </div>

          {/* Gráficos */}
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <div className="card border-0 shadow-sm p-4 rounded-4 h-100 bg-white">
                <div className="d-flex justify-content-between mb-3">
                  <h6 className="fw-bold m-0">Pontos Conquistados (Últimos 6 meses)</h6>
                  <small className="text-danger fw-bold"><i className="bi bi-dot"></i> Ponto mais alto</small>
                </div>
                <div style={{ height: '250px' }}>
                  <Line data={lineData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card border-0 shadow-sm p-4 rounded-4 h-100 bg-white">
                <h6 className="fw-bold mb-3">Evolução do Número de Badges</h6>
                <div style={{ height: '250px' }}>
                  <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>
            </div>
          </div>

          {/* Tabela de Ranking */}
          <h5 className="fw-bold mb-3 mt-4">Tabela de Classificação Global <small className="fw-normal text-muted">(Top 5)</small></h5>
          <TabelaGenerica colunas={['Posição', 'Consultor', 'Badges Conquistados', 'Pontos totais']}>
            {estatisticas.top5.map((row, idx) => (
              <tr key={idx} className={row.isMe ? 'bg-primary bg-opacity-25' : 'border-bottom'}>
                <td className="py-3 fw-bold">{row.pos}º</td>
                <td className="py-3 text-muted">{row.nome}</td>
                <td className="py-3 text-muted">{row.badges}</td>
                <td className="py-3 fw-bold text-primary">{row.pontos} pontos</td>
              </tr>
            ))}
          </TabelaGenerica>

          {/* Ações com Dropdown de Exportação */}
          <div className="d-flex justify-content-center gap-3 pb-5">
            <button className="btn btn-primary px-5 rounded-3 fw-bold shadow-sm" onClick={() => setShowFullRanking(true)}>
              Ver Todos os Consultores
            </button>
            
            {/* Dropdown de Exportação */}
            <div className="dropdown">
              <button className="btn btn-outline-primary px-5 rounded-3 fw-bold dropdown-toggle shadow-sm bg-white" type="button" id="dropdownExport" data-bs-toggle="dropdown" aria-expanded="false">
                Exportar Ranking
              </button>
              <ul className="dropdown-menu shadow-sm border-0" aria-labelledby="dropdownExport">
                <li>
                  <button className="dropdown-item fw-medium d-flex align-items-center gap-2 py-2" onClick={exportarParaPDF}>
                    <i className="bi bi-file-earmark-pdf text-danger fs-5"></i> Exportar para PDF
                  </button>
                </li>
                <li>
                  <button className="dropdown-item fw-medium d-flex align-items-center gap-2 py-2" onClick={exportarParaExcel}>
                    <i className="bi bi-file-earmark-excel text-success fs-5"></i> Exportar para Excel
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Pop-up de Ranking Completo */}
      {showFullRanking && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header border-bottom-0 p-4 pb-0">
                <h5 className="fw-bold m-0">Ranking Completo (Pontos) - Softinsa</h5>
                <button type="button" className="btn-close shadow-none" onClick={() => setShowFullRanking(false)}></button>
              </div>
              <div className="modal-body p-4">
                <table className="table table-hover align-middle mb-0 text-center">
                    <thead className="bg-light text-secondary">
                        <tr>
                            <th className="py-3 border-0 rounded-start">Pos</th>
                            <th className="py-3 border-0">Consultor</th>
                            <th className="py-3 border-0 text-center">Badges Conquistados</th>
                            <th className="py-3 border-0 text-center">Service Line</th>
                            <th className="py-3 border-0 text-center">Área</th>
                            <th className="py-3 border-0 rounded-end">Pontos</th>
                        </tr>
                    </thead>
                    <tbody>
                        {estatisticas.rankingCompleto.map(row => (
                            <tr key={row.pos} className={row.isMe ? 'bg-primary bg-opacity-10 fw-bold' : ''}>
                                <td className="py-2">{row.pos}º</td>
                                <td className="py-2 text-start ps-4">{row.nome} {row.isMe && <span className="badge bg-primary ms-2">Tu</span>}</td>
                                <td className="py-2 text-center text-muted">{row.badges}</td>
                                <td className="py-2 text-center text-muted">{row.serviceLine}</td>
                                <td className="py-2 text-center text-muted">{row.area}</td>
                                <td className="py-2 text-primary fw-bold">{row.pontos}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
              </div>
              <div className="modal-footer border-0 p-4 pt-0">
                <button className="btn btn-primary w-100 rounded-pill fw-bold py-2 shadow-sm" onClick={() => setShowFullRanking(false)}>Fechar Tabela</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RankingPontosConsultor;
