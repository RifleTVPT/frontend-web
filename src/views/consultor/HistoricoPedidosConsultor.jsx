import React, { useState, useEffect } from 'react';
import SidebarConsultor from '../../components/SidebarConsultor';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import TabelaGenerica from '../../components/TabelaGenerica';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../assets/dashboard.css';

const HistoricoPedidosConsultor = () => {
  const navigate = useNavigate();
  const [estrutura, setEstrutura] = useState({ serviceLines: [], areas: [] });
  const [niveisSelecionados, setNiveisSelecionados] = useState(['A', 'B', 'C', 'D', 'E']);
  
  // ESTADOS DOS FILTROS
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [serviceLineFilter, setServiceLineFilter] = useState('Todas');
  const [areaFilter, setAreaFilter] = useState('Todas');
  const [periodoFilter, setPeriodoFilter] = useState('Sempre');

  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [utilizador, setUtilizador] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('https://via.placeholder.com/40');

  useEffect(() => {
    const userLocal = JSON.parse(sessionStorage.getItem('user'));
    if (!userLocal) {
        navigate('/');
        return;
    }
    setUtilizador(userLocal);

    // Carregar a foto de perfil
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

    const carregarDados = async () => {
      try {
        const [pedidosRes, estruturaRes] = await Promise.all([
            axios.get(`https://softinsa-api-riya.onrender.com/pedidos/consultor/${userLocal.ID_UTILIZADOR}`),
            axios.get('https://softinsa-api-riya.onrender.com/estrutura')
        ]);
        if (pedidosRes.data.success) {
          const pedidosFormatados = pedidosRes.data.data.map(p => {
              return {
                  ...p,
                  areaExtraida: p.area || 'Geral',
                  serviceLine: p.serviceLine || 'Indefinida'
              };
          });
          setPedidos(pedidosFormatados);
        }
        if (estruturaRes.data.success) {
          setEstrutura(estruturaRes.data.data);
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
    const intervaloAtualizacao = window.setInterval(carregarDados, 15000);
    return () => window.clearInterval(intervaloAtualizacao);
  }, [navigate]);

  const toggleNivel = (n) => {
    if (niveisSelecionados.includes(n)) {
      setNiveisSelecionados(niveisSelecionados.filter(item => item !== n));
    } else {
      setNiveisSelecionados([...niveisSelecionados, n]);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    navigate('/');
  };

  const uniqueServiceLines = ['Todas', ...(estrutura.serviceLines ? estrutura.serviceLines.map(sl => sl.nome) : [])];
  
  let areasDisponiveis = estrutura.areas || [];
  if (serviceLineFilter !== 'Todas') {
      const selectedSL = estrutura.serviceLines?.find(sl => sl.nome === serviceLineFilter);
      if (selectedSL) {
          areasDisponiveis = areasDisponiveis.filter(a => a.slId === selectedSL.id);
      } else {
          areasDisponiveis = [];
      }
  }
  const uniqueAreas = ['Todas', ...new Set(areasDisponiveis.map(a => a.nome))];
  
  const todosNiveis = [];
  if (estrutura.areas && estrutura.areas.length > 0) {
    estrutura.areas.forEach(a => {
        let nAtivos = a.niveisAtivos || [];
        if (typeof nAtivos === 'string') {
            nAtivos = nAtivos.split(' ').filter(x => x.trim() !== '');
        }
        nAtivos.forEach((nome, index) => {
            const letra = String.fromCharCode(65 + index);
            if (!todosNiveis.some(item => item.letra === letra)) {
                todosNiveis.push({ letra, nome });
            }
        });
    });
  } else {
      // Fallback: se a estrutura falhar, deduzimos dos pedidos!
      pedidos.forEach(p => {
          let letra = p.nivel;
          if (letra && letra.startsWith('Nível ')) letra = letra.replace('Nível ', '').trim();
          if (letra && letra.includes(' ')) letra = letra.split(' ')[0];
          if (letra && letra.length === 1 && !todosNiveis.some(n => n.letra === letra)) {
              todosNiveis.push({ letra, nome: 'Desconhecido' });
          }
      });
  }
  todosNiveis.sort((a, b) => a.letra.localeCompare(b.letra, 'pt'));

  // Efeito para selecionar todos os níveis disponíveis por defeito!
  useEffect(() => {
      if (todosNiveis.length > 0 && niveisSelecionados.length === 5 && !todosNiveis.every(n => niveisSelecionados.includes(n.letra))) {
          setNiveisSelecionados(todosNiveis.map(n => n.letra));
      }
  }, [todosNiveis.length]);

  const parseData = (dataStr) => {
    if (!dataStr || dataStr === '-') return new Date(0);
    const parts = dataStr.split('/');
    if (parts.length === 3) {
      return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00Z`);
    }
    return new Date(0);
  };

  const hoje = new Date();

  const filtrados = pedidos.filter(p => {
    if (statusFilter !== 'Todos' && p.status !== statusFilter) return false;
    if (serviceLineFilter !== 'Todas' && p.serviceLine !== serviceLineFilter) return false;
    if (areaFilter !== 'Todas' && p.areaExtraida !== areaFilter) return false;
    
    if (niveisSelecionados.length > 0 && todosNiveis.length > 0) {
      let letraPedido = p.nivel;
      if (letraPedido && letraPedido.startsWith('Nível ')) {
          letraPedido = letraPedido.replace('Nível ', '').trim();
      }
      if (letraPedido && letraPedido.includes(' ')) {
          letraPedido = letraPedido.split(' ')[0];
      }
      if (letraPedido && !niveisSelecionados.includes(letraPedido)) return false;
    }

    if (periodoFilter !== 'Sempre') {
      const dataSub = parseData(p.dataSub);
      const diffTime = Math.abs(hoje - dataSub);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (periodoFilter === 'Últimos 7 dias' && diffDays > 7) return false;
      if (periodoFilter === 'Últimos 30 dias' && diffDays > 30) return false;
      if (periodoFilter === 'Últimos 6 meses' && diffDays > 180) return false;
      if (periodoFilter === 'Este ano' && dataSub.getFullYear() !== hoje.getFullYear()) return false;
    }

    return true;
  }).sort((a, b) => parseData(b.dataSub) - parseData(a.dataSub));

  if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="d-flex bg-light min-vh-100">
      <SidebarConsultor />

      <div className="flex-grow-1 p-4 dashboard-scroll">
        <div className="container-fluid text-start">
          
          <CabecalhoDashboard 
            titulo="Histórico de Candidaturas" 
            subtitulo="Consulta os teus pedidos submetidos"
            utilizador={utilizador}
            avatarUrl={avatarUrl}
            linkHome="/dashboard"
          />

          <div className="row mb-4">
            <div className="col-md-3">
              <label className="form-label fw-bold h5 titulo-seccao">Status</label>
              <select className="form-select border-0 shadow-sm py-2" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="Todos">Todos os Status</option>
                <option value="Rascunho">Rascunho</option>
                <option value="Pendente">Pendente</option>
                <option value="Em Análise TM">Em Análise TM</option>
                <option value="Em Análise SLL">Em Análise SLL</option>
                <option value="Aceite">Aceite (Aprovado)</option>
                <option value="Devolvido (Correção)">Devolvido (Correção)</option>
                <option value="Recusado">Recusado</option>
              </select>
            </div>
            
            <div className="col-md-3">
              <label className="form-label fw-bold h5 titulo-seccao">Service Line</label>
              <select 
                className="form-select border-0 shadow-sm py-2"
                value={serviceLineFilter}
                onChange={(e) => {
                  setServiceLineFilter(e.target.value);
                  setAreaFilter('Todas');
                }}
              >
                {uniqueServiceLines.map((sl, idx) => <option key={idx} value={sl}>{sl}</option>)}
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label fw-bold h5 titulo-seccao">Área</label>
              <select className="form-select border-0 shadow-sm py-2" value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)}>
                {uniqueAreas.map((a, idx) => <option key={idx} value={a}>{a}</option>)}
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label fw-bold h5 titulo-seccao">Período</label>
              <select className="form-select border-0 shadow-sm py-2" value={periodoFilter} onChange={(e) => setPeriodoFilter(e.target.value)}>
                <option value="Sempre">Sempre</option>
                <option value="Últimos 7 dias">Últimos 7 dias</option>
                <option value="Últimos 30 dias">Últimos 30 dias</option>
                <option value="Últimos 6 meses">Últimos 6 meses</option>
                <option value="Este ano">Este ano</option>
              </select>
            </div>
          </div>

          <div className="row mb-5">
            <div className="col-12">
              <label className="form-label d-block fw-bold h5 text-start titulo-seccao">Nível de Competência</label>
              <div className="d-flex gap-2 justify-content-start flex-wrap mt-2">
                {todosNiveis.length === 0 && <span className="text-muted small py-2">Sem níveis configurados para as seleções.</span>}
                {todosNiveis.map(n => {
                  const nomeExibicao = `Nível ${n.nome} (${n.letra})`;
                  return (
                    <button 
                      key={n.letra} onClick={() => toggleNivel(n.letra)}
                      className={`btn shadow-sm fw-bold px-4 py-2 rounded-pill ${niveisSelecionados.includes(n.letra) ? 'btn-primary' : 'btn-white bg-white text-muted border-0'}`}
                      style={{fontSize: '14px'}}
                    >
                      {nomeExibicao}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          
          <TabelaGenerica 
            colunas={[
                { label: 'Badge — Área (Nível)', className: 'text-center' },
                { label: 'Service Line', className: 'text-center' },
                'Data Submissão',
                'Status Atual',
                'Data última ação',
                'Feedback',
                'Ações'
            ]}
            emptyMessage="Nenhum pedido encontrado com os filtros atuais."
          >
            {filtrados.length > 0 && filtrados.map((item) => (
              <tr key={item.id} className="border-bottom">
                <td className="px-4 fw-bold text-dark py-3 text-center">
                    {item.badge} — {item.areaExtraida} ({item.nivel})
                </td>
                <td className="px-4 small text-muted fw-medium text-center">{item.serviceLine}</td>
                <td className="px-4 small">{item.dataSub}</td>
                <td className="px-4 text-center">
                  <div className="d-flex justify-content-center">
                      <span className={`badge rounded-pill bg-${item.corStatus} px-3 py-2 fw-bold d-flex align-items-center justify-content-center`} style={{ minWidth: '110px', letterSpacing: '0.5px' }}>
                        {item.status}
                      </span>
                  </div>
                </td>
                <td className="px-4 small">{item.dataAcao}</td>
                <td className="px-4 small text-muted fst-italic text-truncate" style={{maxWidth: '200px'}} title={item.feedback}>{item.feedback || '-'}</td>
                <td className="px-4 text-center">
                  <Link to={`/pedidos/detalhes/${item.id}`} className="btn btn-outline-primary btn-sm rounded-pill px-4 fw-bold shadow-sm">
                    Ver Pedido
                  </Link>
                </td>
              </tr>
            ))}
          </TabelaGenerica>
        </div>
      </div>
    </div>
  );
};

export default HistoricoPedidosConsultor;
