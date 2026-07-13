import React, { useState, useEffect, useRef } from 'react';
import SidebarConsultor from '../../components/SidebarConsultor';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Radar, Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler,
  Tooltip, Legend, CategoryScale, LinearScale, BarElement, ArcElement
} from 'chart.js';

// Importações Corrigidas para Exportação
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; 
import * as XLSX from 'xlsx';
import '../../assets/dashboard.css';

// Registar componentes
ChartJS.register(
  RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, ArcElement
);

const EstatisticasDetalhesConsultor = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [utilizador, setUtilizador] = useState(null);
  const [dados, setDados] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('https://via.placeholder.com/40');

  // Referências para capturar as imagens dos gráficos
  const radarRef = useRef(null);
  const lineRef = useRef(null);
  const barRef = useRef(null);
  const doughnutRef = useRef(null);
  const isSmallScreen = typeof window !== 'undefined' && window.innerWidth <= 767;

  useEffect(() => {
    const userLocal = JSON.parse(sessionStorage.getItem('user'));
    if (!userLocal) {
        navigate('/');
        return;
    }
    setUtilizador(userLocal);

    // Carregar a foto de perfil da Base de Dados
    const carregarFotoPerfil = async () => {
      try {
          const response = await axios.get(`https://softinsa-api-riya.onrender.com/users/configuracoes/${userLocal.ID_UTILIZADOR}`);
          if (response.data.success && response.data.data.avatar) {
              setAvatarUrl(response.data.data.avatar);
          }
      } catch (error) {
          console.error("Erro ao carregar a foto de perfil:", error);
      }
    };
    carregarFotoPerfil();

    const carregarEstatisticas = async () => {
      try {
        const response = await axios.get(`https://softinsa-api-riya.onrender.com/estatisticas/consultor/${userLocal.ID_UTILIZADOR}/detalhadas`);
        if (response.data.success) {
          setDados(response.data.data);
        }
      } catch (error) {
        console.error("Erro ao carregar estatísticas detalhadas:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarEstatisticas();
  }, [navigate]);

  // ==========================================
  // LÓGICA DE EXPORTAÇÃO (PDF COM GRÁFICOS)
  // ==========================================
  const exportarParaPDF = () => {
    try {
        const doc = new jsPDF('p', 'mm', 'a4'); // Formato A4 Vertical
        let y = 20;
        
        // Cabeçalho
        doc.setFontSize(16);
        doc.text(`Relatório de Estatísticas - ${utilizador.NOME_COMPLETO_UTILIZADOR}`, 14, y);
        doc.setFontSize(10);
        doc.setTextColor(100);
        y += 8;
        doc.text(`Gerado a: ${new Date().toLocaleDateString('pt-PT')}`, 14, y);
        y += 16;

        // Capturar as imagens base64 dos gráficos renderizados
        const radarImg = radarRef.current?.toBase64Image();
        const lineImg = lineRef.current?.toBase64Image();
        const barImg = barRef.current?.toBase64Image();
        const doughnutImg = doughnutRef.current?.toBase64Image();

        const adicionarGrafico = (titulo, img) => {
          if (!img) return;
          if (y > 155) {
            doc.addPage();
            y = 20;
          }
          doc.setTextColor(0);
          doc.setFontSize(12);
          doc.text(titulo, 14, y);
          y += 6;
          doc.addImage(img, 'PNG', 14, y, 180, 82);
          y += 96;
        };

        // Dois gráficos por página, um por baixo do outro.
        doc.setTextColor(0);
        adicionarGrafico("Competências por Área", radarImg);
        adicionarGrafico("Evolução Mensal de Pontos", lineImg);
        adicionarGrafico("Média de Pontos: Empresa vs Eu", barImg);
        adicionarGrafico("Distribuição por Nível", doughnutImg);

        // Adicionar uma nova página para colocar as tabelas de dados numéricos
        doc.addPage();
        doc.setFontSize(14);
        doc.text("Dados Analíticos Tabulares", 14, 20);

        // Tabela 1: Evolução Mensal
        autoTable(doc, {
          startY: 30,
          head: [['Mês', 'Meus Pontos', 'Média Equipa']],
          body: dados.linha.labels.map((mes, index) => [
            mes, 
            dados.linha.data[index], 
            dados.barras.equipa[index] || '0'
          ]),
          theme: 'grid',
          headStyles: { fillColor: [37, 117, 252] }
        });

        // Tabela 2: Competências por Área
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 15,
          head: [['Área', 'Proficiência (%)']],
          body: dados.radar.labels.map((area, index) => [
            area,
            dados.radar.data[index]
          ]),
          theme: 'grid',
          headStyles: { fillColor: [37, 117, 252] }
        });

        // Tabela 3: Distribuição por Nível
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 15,
          head: [['Nível de Competência', 'Total de Badges']],
          body: dados.doughnut.labels.map((nivel, index) => [
            nivel, 
            dados.doughnut.data[index]
          ]),
          theme: 'grid',
          headStyles: { fillColor: [52, 101, 157] }
        });

        // Tabela 4: Comparação Empresa vs Eu
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 15,
          head: [['Mês', 'Média da Empresa', 'Eu']],
          body: dados.barras.labels.map((mes, index) => [
            mes,
            dados.barras.equipa[index] || 0,
            dados.barras.eu[index] || 0
          ]),
          theme: 'grid',
          headStyles: { fillColor: [52, 101, 157] }
        });

        // Descarregar PDF
        doc.save(`Estatisticas_${utilizador.NOME_COMPLETO_UTILIZADOR.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        alert("Ocorreu um erro ao gerar o PDF. Verifique a consola.");
    }
  };

  // ==========================================
  // LÓGICA DE EXPORTAÇÃO EXCEL (DADOS)
  // ==========================================
  const exportarParaExcel = () => {
    try {
        const wb = XLSX.utils.book_new();

        // Folha 1: Evolução Mensal
        const dadosMensais = dados.linha.labels.map((mes, index) => ({
          'Mês': mes,
          'Meus Pontos': dados.linha.data[index],
          'Média da Equipa': dados.barras.equipa[index] || 0
        }));
        const ws1 = XLSX.utils.json_to_sheet(dadosMensais);
        ws1['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, ws1, "Evolução Mensal");

        // Folha 2: Competências por Área
        const dadosCompetencias = dados.radar.labels.map((area, index) => ({
          'Área': area,
          'Proficiência (%)': dados.radar.data[index]
        }));
        const wsCompetencias = XLSX.utils.json_to_sheet(dadosCompetencias);
        wsCompetencias['!cols'] = [{ wch: 35 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, wsCompetencias, "Competências por Área");

        // Folha 3: Badges por Nível
        const dadosNiveis = dados.doughnut.labels.map((nivel, index) => ({
          'Nível': nivel,
          'Total de Badges': dados.doughnut.data[index]
        }));
        const ws2 = XLSX.utils.json_to_sheet(dadosNiveis);
        ws2['!cols'] = [{ wch: 25 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, ws2, "Badges por Nível");

        // Folha 4: Empresa vs Eu
        const dadosComparacao = dados.barras.labels.map((mes, index) => ({
          'Mês': mes,
          'Média da Empresa': dados.barras.equipa[index] || 0,
          'Eu': dados.barras.eu[index] || 0
        }));
        const wsComparacao = XLSX.utils.json_to_sheet(dadosComparacao);
        wsComparacao['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, wsComparacao, "Empresa vs Eu");

        XLSX.writeFile(wb, `Estatisticas_${utilizador.NOME_COMPLETO_UTILIZADOR.replace(/\s+/g, '_')}.xlsx`);
    } catch (error) {
        console.error("Erro ao exportar Excel:", error);
        alert("Ocorreu um erro ao gerar o Excel.");
    }
  };

  if (loading || !dados) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

  const radarData = {
    labels: dados.radar.labels,
    datasets: [{
      label: 'Nível de Proficiência (%)',
      data: dados.radar.data,
      backgroundColor: 'rgba(37, 117, 252, 0.2)',
      borderColor: '#2575fc',
      borderWidth: 2,
      pointBackgroundColor: '#2575fc',
    }]
  };

  const lineData = {
    labels: dados.linha.labels,
    datasets: [{
      label: 'Pontos Mensais',
      data: dados.linha.data,
      borderColor: '#2575fc',
      tension: 0.4,
      fill: false,
    }]
  };

  const barData = {
    labels: dados.barras.labels,
    datasets: [
      {
        label: 'Média da Empresa',
        data: dados.barras.equipa,
        backgroundColor: '#34659D',
      },
      {
        label: 'Eu',
        data: dados.barras.eu,
        backgroundColor: '#2575fc',
      }
    ]
  };

  const doughnutData = {
    labels: dados.doughnut.labels,
    datasets: [{
      data: dados.doughnut.data,
      backgroundColor: ['#2575fc', '#34659D', '#82D674', '#FFC107', '#D1DAE2'],
      borderWidth: 0,
    }]
  };

  return (
    <div className="d-flex bg-light min-vh-100">
      <SidebarConsultor />

      <div className="flex-grow-1 p-4 dashboard-scroll">
        <div className="container-fluid text-start">
          
          {/* CABEÇALHO PADRONIZADO */}
          <CabecalhoDashboard 
            titulo="Estatísticas Detalhadas"
            subtitulo="Visualize várias estatísticas suas e comparações com outros consultores."
            utilizador={utilizador}
            avatarUrl={avatarUrl}
          />

          {/* Grid de Gráficos */}
          <div className="row g-4 mb-4 mt-2">
            {/* Radar: Competências */}
            <div className="col-md-6">
              <div className="consultor-radar-card card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
                <h6 className="fw-bold text-center mb-3">As minhas competências por Área</h6>
                <div className="consultor-radar-chart" style={{ height: '300px' }}>
                  <Radar ref={radarRef} data={radarData} options={{
                    maintainAspectRatio: false,
                    layout: { padding: isSmallScreen ? { left: 28, right: 42, top: 12, bottom: 12 } : 0 },
                    scales: {
                      r: {
                        suggestMin: 0,
                        suggestMax: 100,
                        pointLabels: { font: { size: isSmallScreen ? 9 : 12 } },
                        ticks: { font: { size: isSmallScreen ? 9 : 11 }, backdropPadding: 1 }
                      }
                    }
                  }} />
                </div>
              </div>
            </div>

            {/* Linha: Evolução Mensal */}
            <div className="col-md-6">
              <div className="consultor-doughnut-card card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
                <h6 className="fw-bold text-center mb-3">Evolução Mensal de Pontos</h6>
                <div style={{ height: '300px' }}>
                  <Line ref={lineRef} data={lineData} options={{ maintainAspectRatio: false, scales: { y: { min: 0 } } }} />
                </div>
              </div>
            </div>

            {/* Barras: Comparação Equipa */}
            <div className="col-md-6">
              <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
                <h6 className="fw-bold text-center mb-3">Média de Pontos da Empresa vs Eu</h6>
                <div style={{ height: '300px' }}>
                  <Bar ref={barRef} data={barData} options={{ maintainAspectRatio: false }} />
                </div>
              </div>
            </div>

            {/* Doughnut: Badges por Nível */}
            <div className="col-md-6">
              <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
                <h6 className="fw-bold text-center mb-3">Distribuição de Badges por Nível</h6>
                <div className="consultor-doughnut-wrap d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
                  <div className="consultor-doughnut-chart" style={{ width: '100%', maxWidth: '420px', height: '230px', marginLeft: 'auto', marginRight: 'auto' }}>
                    <Doughnut ref={doughnutRef} data={doughnutData} options={{ 
                      maintainAspectRatio: false,
                      layout: { padding: isSmallScreen ? { left: 0, right: 24 } : { left: 40 } },
                      plugins: {
                        legend: {
                          position: 'right',
                          align: 'start',
                          labels: {
                            padding: isSmallScreen ? 10 : 30,
                            boxWidth: isSmallScreen ? 10 : 15,
                            font: { size: isSmallScreen ? 10 : 12 }
                          }
                        }
                      },
                      cutout: '65%'
                    }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Botão de Exportação */}
          <div className="text-center pb-5 mt-4">
            <div className="dropdown d-inline-block">
              <button className="btn btn-primary px-5 py-2 rounded-3 fw-bold shadow dropdown-toggle" type="button" id="dropdownExport" data-bs-toggle="dropdown" aria-expanded="false">
                <i className="bi bi-download me-2"></i> Exportar Gráficos e Dados
              </button>
              <ul className="dropdown-menu shadow-sm border-0" aria-labelledby="dropdownExport">
                <li>
                  <button className="dropdown-item fw-medium d-flex align-items-center gap-2 py-2" onClick={exportarParaPDF}>
                    <i className="bi bi-file-earmark-pdf text-danger fs-5"></i> Relatório PDF (Gráficos)
                  </button>
                </li>
                <li>
                  <button className="dropdown-item fw-medium d-flex align-items-center gap-2 py-2" onClick={exportarParaExcel}>
                    <i className="bi bi-file-earmark-excel text-success fs-5"></i> Relatório Excel (Dados)
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

export default EstatisticasDetalhesConsultor;
