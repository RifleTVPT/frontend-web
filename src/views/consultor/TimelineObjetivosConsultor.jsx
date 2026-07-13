import React, { useState, useEffect } from 'react';
import SidebarConsultor from '../../components/SidebarConsultor';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../assets/dashboard.css';

const TimelineObjetivosConsultor = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [utilizador, setUtilizador] = useState(null);
  const [objetivos, setObjetivos] = useState([]);
  const [avatarUrl, setAvatarUrl] = useState('https://via.placeholder.com/40');

  // Estados do Formulário de Criação
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novaData, setNovaData] = useState('');
  const [novoTipo, setNovoTipo] = useState('Progressão de Nível (A-E)');
  const [novaDescricao, setNovaDescricao] = useState('');

  // 1. CARREGAR DADOS
  const carregarObjetivos = async (userId) => {
    try {
      const response = await axios.get(`https://softinsa-api-riya.onrender.com/objetivos/consultor/${userId}`);
      if (response.data.success) {
        setObjetivos(response.data.data);
      }
    } catch (error) {
      console.error("Erro ao carregar objetivos:", error);
    } finally {
      setLoading(false);
    }
  };

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

    carregarObjetivos(userLocal.ID_UTILIZADOR);
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    navigate('/');
  };

  // 2. CRIAR NOVO OBJETIVO
  const handleCriarObjetivo = async () => {
    if(!novoTitulo || !novaData) {
        alert("Preencha o título e a data do objetivo!");
        return;
    }

    try {
      const response = await axios.post('https://softinsa-api-riya.onrender.com/objetivos/criar', {
        idUtilizador: utilizador.ID_UTILIZADOR,
        titulo: novoTitulo,
        dataMeta: novaData,
        descricao: novaDescricao,
        tipo: novoTipo,
        origem: 'Criado por mim' // Por defeito no front-office do consultor
      });

      if (response.data.success) {
        setShowModal(false);
        // Limpar formulário
        setNovoTitulo('');
        setNovaData('');
        setNovaDescricao('');
        // Recarregar a lista para ver a nova bola na timeline!
        carregarObjetivos(utilizador.ID_UTILIZADOR);
      }
    } catch (error) {
      alert("Erro ao criar objetivo.");
      console.error(error);
    }
  };

  // 3. MARCAR COMO CONCLUÍDO
  const handleConcluir = async (idObjetivo) => {
      try {
          const response = await axios.put(`https://softinsa-api-riya.onrender.com/objetivos/concluir/${idObjetivo}`);
          if(response.data.success) {
              carregarObjetivos(utilizador.ID_UTILIZADOR); // Atualiza os KPIs e muda de lado
          }
      } catch (error) {
          console.error("Erro ao concluir objetivo:", error);
      }
  };

  // 4. CÁLCULOS DOS KPIS
  const total = objetivos.length;
  const ativos = objetivos.filter(obj => !obj.concluido).length;
  const concluidos = objetivos.filter(obj => obj.concluido).length;
  
  const progressoPercent = total > 0 ? Math.round((concluidos / total) * 100) : 0;

  if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="d-flex bg-light min-vh-100">
      <SidebarConsultor />

      <div className="flex-grow-1 p-4 dashboard-scroll">
        <div className="container-fluid">
          
          {/* CABEÇALHO PADRONIZADO */}
          <CabecalhoDashboard 
            titulo="Gestão de Objetivos e Timeline"
            subtitulo="Acompanhe a sua evolução"
            utilizador={utilizador}
            avatarUrl={avatarUrl}
          />

          {/* KPI Header Cards DINÂMICOS */}
          <div className="consultor-timeline-summary card border-0 shadow-sm rounded-pill py-2 px-4 mb-5 mx-auto bg-white" style={{ width: 'fit-content' }}>
            <div className="consultor-timeline-summary-inner d-flex align-items-center gap-4">
              <div className="d-flex align-items-center gap-2">
                <div className="bg-danger bg-opacity-10 p-2 rounded-circle">🎯</div>
                <span className="fw-bold">Total de Objetivos: {total}</span>
              </div>
              <div className="vr"></div>
              <span className="text-primary fw-bold">Em Execução (Ativos): {ativos}</span>
              <div className="vr"></div>
              <span className="text-success fw-bold">Concluídos: {concluidos}</span>
            </div>
          </div>

          {/* Timeline Columns */}
          <div className="row position-relative">
            <div className="position-absolute start-50 translate-middle-x h-100 d-none d-md-block" style={{ width: '4px', backgroundColor: '#dee2e6', zIndex: 0 }}></div>

            {/* Coluna Em Execução */}
            <div className="col-md-6 pe-md-5">
              <h5 className="text-center mb-4"><i className="bi bi-circle-fill text-primary me-2 small"></i> Em Execução</h5>
              {objetivos.filter(o => !o.concluido).length > 0 ? objetivos.filter(o => !o.concluido).map(obj => (
                <div key={obj.id} className="card border-0 shadow-sm rounded-4 p-3 mb-4 text-start position-relative bg-white" style={{ zIndex: 1 }}>
                  <div className="d-flex align-items-center gap-2 text-muted small mb-2">
                    <i className="bi bi-person-circle"></i> {obj.autor}
                  </div>
                  <h5 className="fw-bold mb-1">{obj.titulo}</h5>
                  <p className="small mb-2">Status: <i className={`bi bi-circle-fill text-${obj.corStatus} me-1 small`}></i> {obj.status}</p>
                  <p className="small fw-bold mb-3 text-muted">Data Meta: {obj.data}</p>
                  <button 
                    className="btn btn-primary w-100 rounded-3 py-1 fw-bold shadow-sm"
                    onClick={() => handleConcluir(obj.id)}
                  >
                    <i className="bi bi-check-circle me-2"></i>Marcar como concluído
                  </button>
                </div>
              )) : (
                  <div className="card border-0 shadow-sm rounded-4 p-4 text-center bg-light text-muted opacity-75" style={{ zIndex: 1, minHeight: '100px' }}>
                    <i className="bi bi-inbox fs-3 mb-2"></i>
                    <p className="mb-0">Nenhum objetivo em execução.</p>
                  </div>
              )}
            </div>

            {/* Coluna Concluídos */}
            <div className="col-md-6 ps-md-5 mt-5 mt-md-0">
              <h5 className="text-center mb-4"><i className="bi bi-circle-fill text-success me-2 small"></i> Concluídos</h5>
              {objetivos.filter(o => o.concluido).length > 0 ? objetivos.filter(o => o.concluido).map(obj => (
                <div key={obj.id} className="card border-0 shadow-sm rounded-4 p-3 mb-4 text-start position-relative bg-white opacity-75" style={{ zIndex: 1 }}>
                  <div className="d-flex align-items-center gap-2 text-muted small mb-2">
                    <i className="bi bi-person-circle"></i> {obj.autor}
                  </div>
                  <h5 className="fw-bold mb-1 text-decoration-line-through text-muted">{obj.titulo}</h5>
                  <p className="small mb-1 text-success fw-bold"><i className="bi bi-check-circle-fill me-1"></i> {obj.status}</p>
                  <p className="small text-muted mb-0">Concluído a: {obj.dataConclusao || 'N/A'}</p>
                  {obj.atrasado && (
                    <p className="small text-danger fw-bold mb-0 mt-1">
                      <i className="bi bi-exclamation-triangle-fill me-1"></i>
                      Atrasado {obj.diasAtraso} {obj.diasAtraso === 1 ? 'dia' : 'dias'}
                    </p>
                  )}
                  <div className="text-end mt-2"><i className="bi bi-check-all text-success fs-4"></i></div>
                </div>
              )) : (
                  <div className="card border-0 shadow-sm rounded-4 p-4 text-center bg-light text-muted opacity-75" style={{ zIndex: 1, minHeight: '100px' }}>
                    <i className="bi bi-inbox fs-3 mb-2"></i>
                    <p className="mb-0">Ainda não concluiu objetivos.</p>
                  </div>
              )}
            </div>
          </div>

          {/* BARRA DE PROGRESSO INFERIOR */}
          <div className="mt-5 mb-5 px-5">
            <div className="progress mb-2 shadow-sm" style={{ height: '10px', borderRadius: '10px' }}>
              <div className="progress-bar bg-primary progress-bar-striped progress-bar-animated" 
                   role="progressbar" style={{ width: `${progressoPercent}%` }}></div>
            </div>
            <div className="d-flex justify-content-center border p-2 rounded-pill bg-white shadow-sm mx-auto" style={{maxWidth: '400px'}}>
               <span className="small fw-bold">Marcos Alcançados: {concluidos}/{total} ({progressoPercent}%)</span>
            </div>
          </div>

          {/* Botão para Adicionar */}
          <div className="text-center pb-5 mt-4">
            <button className="btn btn-primary px-5 py-2 rounded-3 fw-bold shadow-lg" onClick={() => setShowModal(true)}>
              + Adicionar Novo Objetivo à Timeline
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: CRIAR OBJETIVO */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 rounded-4 p-4 shadow-lg">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold m-0">Definir Nova Meta de Evolução</h3>
                <button type="button" className="btn-close shadow-none" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="text-start">
                <div className="mb-4">
                  <label className="form-label fw-bold small">Nome do Objetivo (*)</label>
                  <input 
                    type="text" 
                    className="form-control py-2 bg-light border-0 rounded-3 shadow-sm" 
                    placeholder="Ex: Tornar-me Especialista Azure" 
                    value={novoTitulo}
                    onChange={e => setNovoTitulo(e.target.value)}
                  />
                </div>
                <div className="row mb-4">
                  <div className="col-md-6">
                    <label className="form-label fw-bold small">Data Meta para Conclusão (*)</label>
                    <input 
                        type="date" 
                        className="form-control py-2 bg-light border-0 rounded-3 shadow-sm" 
                        value={novaData}
                        onChange={e => setNovaData(e.target.value)}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small">Tipo de Objetivo</label>
                    <select 
                        className="form-select py-2 bg-light border-0 rounded-3 text-muted shadow-sm"
                        value={novoTipo}
                        onChange={e => setNovoTipo(e.target.value)}
                    >
                      <option>Progressão de Nível (A-E)</option>
                      <option>Acúmulo de Pontos</option>
                      <option>Aquisição de Competência</option>
                    </select>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="form-label fw-bold small">Descrição e Plano de Ação</label>
                  <textarea 
                    className="form-control bg-light border-0 rounded-3 shadow-sm" 
                    rows="4" 
                    placeholder="Pretendo estudar 2 horas por dia..."
                    value={novaDescricao}
                    onChange={e => setNovaDescricao(e.target.value)}
                  ></textarea>
                </div>
                <div className="form-check mb-5 d-flex align-items-center">
                  <input className="form-check-input shadow-none cursor-pointer" type="checkbox" id="notifCheck" defaultChecked style={{ width: '18px', height: '18px' }} />
                  <label className="form-check-label text-muted small ms-2 cursor-pointer pt-1" htmlFor="notifCheck">
                    Desejo receber notificações e lembretes sobre este objetivo
                  </label>
                </div>
                <div className="consultor-modal-actions d-flex gap-3 justify-content-center">
                  <button className="btn btn-secondary px-5 rounded-3 fw-bold shadow-sm" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button className="btn btn-primary px-5 rounded-3 fw-bold shadow-sm" onClick={handleCriarObjetivo}>Ativar Objetivo e Adicionar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelineObjetivosConsultor;
