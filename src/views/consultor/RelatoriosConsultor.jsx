import React, { useState, useEffect } from 'react';
import SidebarConsultor from '../../components/SidebarConsultor';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../assets/dashboard.css';

// Importações Corrigidas para PDF e Excel
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // <-- Importação correta (evita erro doc.autoTable is not a function)
import * as XLSX from 'xlsx';

const RelatoriosConsultor = () => {
  const navigate = useNavigate();
  const [utilizador, setUtilizador] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('https://via.placeholder.com/40');

  // Estados dos Filtros
  const [periodo, setPeriodo] = useState('Todos');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [area, setArea] = useState('Todas');
  const [nivel, setNivel] = useState('Todos');
  const [serviceLine, setServiceLine] = useState('Todas');
  const [estrutura, setEstrutura] = useState({ serviceLines: [], areas: [] });

  // Estados das Checkboxes (Conteúdo)
  const [opcoesConteudo, setOpcoesConteudo] = useState({
    metricas: false,
    evolucao: false,
    badgesObtidos: false,
    pedidosPendentes: false,
    historicoPedidos: false,
    ranking: false,
    badgesEspeciais: false,
    competencias: false
  });

  const conteudosMap = [
    { key: 'metricas', label: "Incluir Métricas de Aprovação e Rejeição" },
    { key: 'evolucao', label: "Incluir Evolução da Pontuação" },
    { key: 'badgesObtidos', label: "Incluir Detalhes de Badges Obtidos" },
    { key: 'pedidosPendentes', label: "Incluir Detalhes de Pedidos Pendentes" },
    { key: 'historicoPedidos', label: "Incluir Histórico de Pedidos" },
    { key: 'ranking', label: "Incluir Ranking Comparação Consultores" },
    { key: 'badgesEspeciais', label: "Incluir Detalhes de Badges Especiais" },
    { key: 'competencias', label: "Incluir detalhes de Competências" }
  ];

  useEffect(() => {
    const userLocal = JSON.parse(sessionStorage.getItem('user'));
    if (!userLocal) {
        navigate('/');
        return;
    }
    setUtilizador(userLocal);

    // Carregar a foto de perfil da Base de Dados e a Estrutura
    const carregarDados = async () => {
      try {
          const [userRes, estRes] = await Promise.all([
              axios.get(`https://softinsa-api-riya.onrender.com/users/configuracoes/${userLocal.ID_UTILIZADOR}`),
              axios.get('https://softinsa-api-riya.onrender.com/estrutura')
          ]);
          if (userRes.data.success && userRes.data.data.avatar) {
              setAvatarUrl(userRes.data.data.avatar);
          }
          if (estRes.data.success) {
              setEstrutura(estRes.data.data);
          }
      } catch (error) {
          console.error("Erro ao carregar dados iniciais:", error);
      }
    };
    carregarDados();
  }, [navigate]);

  const limparFiltros = () => {
    setPeriodo('Todos'); setDataInicio(''); setDataFim('');
    setArea('Todas'); setNivel('Todos'); setServiceLine('Todas');
    setOpcoesConteudo({
      metricas: false, evolucao: false, badgesObtidos: false, pedidosPendentes: false,
      historicoPedidos: false, ranking: false, badgesEspeciais: false, competencias: false
    });
  };

  const handleCheckboxChange = (key) => {
    setOpcoesConteudo(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const todosNiveis = [];
  const areasParaNiveis = estrutura.areas.filter(a => {
      if (serviceLine !== 'Todas') {
          const slRef = estrutura.serviceLines.find(sl => sl.nome === serviceLine);
          if (!slRef || a.slId !== slRef.id) return false;
      }
      if (area !== 'Todas' && a.nome !== area) return false;
      return true;
  });
  areasParaNiveis.forEach(a => {
      a.niveisAtivos.forEach(n => {
          if(!todosNiveis.includes(n)) todosNiveis.push(n);
      });
  });
  todosNiveis.sort();

  // ==============================================
  // LÓGICA DE GERAÇÃO E EXPORTAÇÃO
  // ==============================================
  const gerarRelatorio = async (formato) => {
    if (!Object.values(opcoesConteudo).some(v => v)) {
      alert("Por favor, selecione pelo menos um conteúdo para o relatório.");
      return;
    }

    setIsGenerating(true);

    try {
      const payload = {
        idUtilizador: utilizador.ID_UTILIZADOR,
        filtros: { periodo, dataInicio, dataFim, area, nivel, serviceLine },
        opcoes: opcoesConteudo,
        formatoExportacao: formato
      };

      const response = await axios.post('https://softinsa-api-riya.onrender.com/relatorios/gerar', payload);
      
      if (response.data.success) {
        const dados = response.data.data;
        if (formato === 'PDF') exportarPDF(dados);
        else exportarExcel(dados);
      }
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      alert("Ocorreu um erro ao gerar o relatório.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Exportação PDF TOTALMENTE CORRIGIDA
  const exportarPDF = (dados) => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      let currentY = 20;
      
      const nomeConsultor = utilizador?.NOME_COMPLETO_UTILIZADOR || 'Consultor';

      doc.setFontSize(18);
      doc.text(`Relatório Personalizado - ${nomeConsultor}`, 14, currentY);
      doc.setFontSize(10);
      doc.setTextColor(100);
      currentY += 8;
      const filtrosTexto = [
        `Período: ${periodo}`,
        `Service Line: ${serviceLine}`,
        `Área: ${area}`,
        `Nível: ${nivel}`,
        dataInicio ? `Desde: ${dataInicio}` : null,
        dataFim ? `Até: ${dataFim}` : null
      ].filter(Boolean).join(' | ');
      doc.text(`Gerado a: ${new Date().toLocaleDateString('pt-PT')} | ${filtrosTexto}`, 14, currentY, { maxWidth: 180 });
      currentY += 15;

      // Função segura para desenhar tabelas sem dar erro de "doc.autoTable is not a function"
      const desenharTabela = (titulo, head, body) => {
        if (body && body.length > 0) {
          
          // Converter todos os dados para String previne que "nulls" crashem o jsPDF
          const safeBody = body.map(row => row.map(cell => cell !== null && cell !== undefined ? String(cell) : ''));

          doc.setFontSize(14);
          doc.setTextColor(0);
          doc.text(titulo, 14, currentY);
          
          // Utilizar "autoTable(doc, {...})" em vez de "doc.autoTable({...})"
          autoTable(doc, {
            startY: currentY + 5,
            head: [head],
            body: safeBody,
            theme: 'grid',
            headStyles: { fillColor: [52, 101, 157] }
          });
          
          currentY = doc.lastAutoTable.finalY + 15;
          
          // Fazer quebra de página se não houver espaço
          if (currentY > 270) { 
            doc.addPage(); 
            currentY = 20; 
          }
        }
      };

      if (dados.metricas) {
        desenharTabela("Métricas de Aprovação e Rejeição", ['Estado', 'Total'], [
          ['Aceites', dados.metricas.aprovados],
          ['Recusados', dados.metricas.rejeitados],
          ['Pendentes', dados.metricas.pendentes]
        ]);
      }
      if (dados.evolucao) {
        desenharTabela("Evolução da Pontuação", ['Mês', 'Pontos'], dados.evolucao.map(e => [e.mes, e.pontos]));
      }
      if (dados.badgesObtidos) {
        desenharTabela("Badges Obtidos", ['Badge', 'Área', 'Pontos', 'Data de Obtenção'], dados.badgesObtidos.map(b => [b.nome, b.area, b.pontos, b.data]));
      }
      if (dados.pedidosPendentes) {
        desenharTabela("Pedidos Pendentes", ['Badge', 'Data Submissão', 'Estado'], dados.pedidosPendentes.map(p => [p.nome, p.data, p.estado]));
      }
      if (dados.historicoPedidos) {
        desenharTabela("Histórico de Pedidos", ['Badge', 'Data', 'Estado', 'Última Ação'], dados.historicoPedidos.map(p => [p.nome, p.data, p.estado, p.ultimaAcao]));
      }
      if (dados.ranking) {
        desenharTabela("Ranking da Empresa (Top)", ['Posição', 'Nome', 'Pontos'], dados.ranking.map((r, i) => [`${i+1}º`, r.nome, r.pontos]));
      }
      if (dados.badgesEspeciais) {
        desenharTabela("Conquistas Especiais", ['Título', 'Pontos Bónus', 'Data'], dados.badgesEspeciais.map(m => [m.titulo, m.pontos, m.data]));
      }
      if (dados.competencias) {
        desenharTabela("Competências por Área", ['Área', 'Badges Obtidos', 'Pontos'], dados.competencias.map(c => [c.area, c.badges, c.pontos]));
      }

      doc.save(`Relatorio_Personalizado_${nomeConsultor.replace(/\s+/g, '_')}.pdf`);
    } catch (e) {
      console.error("Falha ao desenhar PDF:", e);
      alert("Erro ao montar o PDF. Verifique a consola.");
    }
  };

  const exportarExcel = (dados) => {
    const wb = XLSX.utils.book_new();

    if (dados.metricas) {
      const ws = XLSX.utils.json_to_sheet([{ Estado: 'Aceites', Total: dados.metricas.aprovados }, { Estado: 'Recusados', Total: dados.metricas.rejeitados }, { Estado: 'Pendentes', Total: dados.metricas.pendentes }]);
      XLSX.utils.book_append_sheet(wb, ws, "Métricas");
    }
    if (dados.evolucao && dados.evolucao.length > 0) {
      const ws = XLSX.utils.json_to_sheet(dados.evolucao);
      XLSX.utils.book_append_sheet(wb, ws, "Evolução Pontos");
    }
    if (dados.badgesObtidos && dados.badgesObtidos.length > 0) {
      const ws = XLSX.utils.json_to_sheet(dados.badgesObtidos);
      XLSX.utils.book_append_sheet(wb, ws, "Badges Obtidos");
    }
    if (dados.pedidosPendentes && dados.pedidosPendentes.length > 0) {
      const ws = XLSX.utils.json_to_sheet(dados.pedidosPendentes);
      XLSX.utils.book_append_sheet(wb, ws, "Pedidos Pendentes");
    }
    if (dados.historicoPedidos && dados.historicoPedidos.length > 0) {
      const ws = XLSX.utils.json_to_sheet(dados.historicoPedidos);
      XLSX.utils.book_append_sheet(wb, ws, "Histórico Pedidos");
    }
    if (dados.ranking && dados.ranking.length > 0) {
      const ws = XLSX.utils.json_to_sheet(dados.ranking);
      XLSX.utils.book_append_sheet(wb, ws, "Ranking");
    }
    if (dados.badgesEspeciais && dados.badgesEspeciais.length > 0) {
      const ws = XLSX.utils.json_to_sheet(dados.badgesEspeciais);
      XLSX.utils.book_append_sheet(wb, ws, "Conquistas Especiais");
    }
    if (dados.competencias && dados.competencias.length > 0) {
      const ws = XLSX.utils.json_to_sheet(dados.competencias);
      XLSX.utils.book_append_sheet(wb, ws, "Competências");
    }

    const nomeConsultor = utilizador?.NOME_COMPLETO_UTILIZADOR || 'Consultor';
    XLSX.writeFile(wb, `Relatorio_Personalizado_${nomeConsultor.replace(/\s+/g, '_')}.xlsx`);
  };

  return (
    <div className="d-flex bg-light min-vh-100">
      <SidebarConsultor />

      <div className="flex-grow-1 p-4 dashboard-scroll text-start">
        <div className="container-fluid">
          
          {/* CABEÇALHO PADRONIZADO */}
          <CabecalhoDashboard 
            titulo="Relatórios detalhados"
            subtitulo="Selecione os parâmetros e o tipo de dados a exportar para analisar"
            utilizador={utilizador}
            avatarUrl={avatarUrl}
          />

          <hr className="mb-5 opacity-25" />

          {/* SECÇÃO: PERÍODO */}
          <h4 className="fw-bold mb-4">Período</h4>
          <div className="row g-3 mb-5 align-items-end">
            <div className="col-md-4">
              <label className="text-muted small fw-bold mb-2">Selecionar Período:</label>
              <select className="form-select border-0 shadow-sm py-2 rounded-3" value={periodo} onChange={e => setPeriodo(e.target.value)}>
                <option value="Todos">Todos</option>
                <option value="Último mês">Último mês</option>
                <option value="Últimos 6 meses">Últimos 6 meses</option>
                <option value="Personalizado">Personalizado</option>
              </select>
            </div>
            
            <div className="col-md-4">
              <label className="text-muted small fw-bold mb-2">Data Início:</label>
              <input type="date" className="form-control border-0 shadow-sm py-2 rounded-3" value={dataInicio} onChange={e => setDataInicio(e.target.value)} disabled={periodo !== 'Personalizado'} />
            </div>
            
            <div className="col-md-4">
              <label className="text-muted small fw-bold mb-2">Data Fim:</label>
              <input type="date" className="form-control border-0 shadow-sm py-2 rounded-3" value={dataFim} onChange={e => setDataFim(e.target.value)} disabled={periodo !== 'Personalizado'} />
            </div>
          </div>

          {/* SECÇÃO: FILTROS */}
          <h4 className="fw-bold mb-4">Filtros para os Relatórios</h4>
          <div className="row g-4 mb-4">
            <div className="col-md-4">
              <select className="form-select border-0 shadow-sm py-2 rounded-3" value={serviceLine} onChange={e => setServiceLine(e.target.value)}>
                <option value="Todas">Todas as Service Lines</option>
                {estrutura.serviceLines.map(sl => (
                  <option key={sl.id} value={sl.nome}>{sl.nome}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <select className="form-select border-0 shadow-sm py-2 rounded-3" value={area} onChange={e => setArea(e.target.value)}>
                <option value="Todas">Todas as Áreas</option>
                {estrutura.areas
                    .filter(a => serviceLine === 'Todas' || a.slId === estrutura.serviceLines.find(sl => sl.nome === serviceLine)?.id)
                    .map(a => (
                  <option key={a.id} value={a.nome}>{a.nome}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <select className="form-select border-0 shadow-sm py-2 rounded-3" value={nivel} onChange={e => setNivel(e.target.value)}>
                <option value="Todos">Todos os Níveis</option>
                {todosNiveis.map(n => (
                  <option key={n} value={n}>Nível {n}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <button className="btn btn-primary w-100 py-2 rounded-3 fw-bold" onClick={limparFiltros} style={{ backgroundColor: '#3b6ea5', border: 'none' }}>
                <i className="bi bi-x-lg me-2"></i> Limpar Filtros
              </button>
            </div>
          </div>

          {/* SECÇÃO: CONTEÚDO DO RELATÓRIO */}
          <h4 className="fw-bold mb-4 mt-5">Conteúdo do Relatório</h4>
          <div className="row g-4 px-2">
            {conteudosMap.map((item, idx) => (
              <div key={idx} className="col-md-6 mb-2">
                <div className="form-check d-flex align-items-center gap-3">
                  <input 
                    className="form-check-input border-secondary shadow-sm cursor-pointer" 
                    type="checkbox" 
                    id={`check-${item.key}`} 
                    checked={opcoesConteudo[item.key]}
                    onChange={() => handleCheckboxChange(item.key)}
                    style={{ width: '22px', height: '22px' }} 
                  />
                  <label className="form-check-label text-secondary fw-medium cursor-pointer" htmlFor={`check-${item.key}`}>
                    {item.label}
                  </label>
                </div>
              </div>
            ))}
          </div>

          {/* BOTÕES DE GERAÇÃO */}
          <div className="consultor-report-actions d-flex justify-content-center gap-4 mt-5 pb-5">
            <button 
              className="btn btn-primary px-5 py-2 rounded-3 fw-bold shadow-sm d-flex align-items-center gap-2"
              onClick={() => gerarRelatorio('PDF')}
              disabled={isGenerating}
            >
              <i className="bi bi-file-earmark-pdf"></i> {isGenerating ? 'A processar...' : 'Gerar Relatório (PDF)'}
            </button>
            <button 
              className="btn btn-success px-5 py-2 rounded-3 fw-bold shadow-sm d-flex align-items-center gap-2"
              onClick={() => gerarRelatorio('EXCEL')}
              disabled={isGenerating}
            >
              <i className="bi bi-file-earmark-excel"></i> {isGenerating ? 'A processar...' : 'Gerar Relatório (Excel)'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RelatoriosConsultor;
