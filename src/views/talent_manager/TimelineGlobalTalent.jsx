import React, { useState, useEffect } from 'react';
import SidebarTalentManager from '../../components/SidebarTalentManager';
import CabecalhoDashboard from '../../components/CabecalhoDashboard';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../assets/dashboard.css';

const TimelineGlobalTalent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [utilizador, setUtilizador] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('');

  // Estados dos Consultores e Estrutura
  const [consultoresBase, setConsultoresBase] = useState([]);
  const [estrutura, setEstrutura] = useState({ serviceLines: [], areas: [] });

  // Filtros
  const [slFiltro, setSlFiltro] = useState('Todas');
  const [areaFiltro, setAreaFiltro] = useState('Todas');
  const [consultorSelecionadoId, setConsultorSelecionadoId] = useState('');

  // Estados da Timeline
  const [objetivos, setObjetivos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novaData, setNovaData] = useState('');
  const [novoTipo, setNovoTipo] = useState('Progressão de Nível (A-E)');
  const [novaDescricao, setNovaDescricao] = useState('');
  const [enviarNotificacao, setEnviarNotificacao] = useState(true);

  useEffect(() => {
    const userLocal = JSON.parse(sessionStorage.getItem('user'));
    if (!userLocal) {
        navigate('/');
        return;
    }
    setUtilizador(userLocal);

    const carregarDadosIniciais = async () => {
        try {
            const [resUser, consRes, estRes] = await Promise.all([
                axios.get(`https://softinsa-api-riya.onrender.com/users/configuracoes/${userLocal.ID_UTILIZADOR}`),
                axios.get('https://softinsa-api-riya.onrender.com/talent/consultores/lista'),
                axios.get('https://softinsa-api-riya.onrender.com/estrutura')
            ]);
            
            if (resUser.data.success && resUser.data.data.avatar) {
                setAvatarUrl(resUser.data.data.avatar);
            } else {
                const partes = userLocal.NOME_COMPLETO_UTILIZADOR?.trim().split(/\s+/) || [];
                let iniciais = 'TM';
                if (partes.length > 0) {
                    iniciais = partes[0][0].toUpperCase();
                    if (partes.length > 1) {
                        iniciais += partes[partes.length - 1][0].toUpperCase();
                    }
                }
                setAvatarUrl(`https://ui-avatars.com/api/?name=${iniciais}&background=0d6efd&color=fff`);
            }
            if (consRes.data.success) {
                setConsultoresBase(consRes.data.data);
            }
            if (estRes.data.success) {
                setEstrutura(estRes.data.data);
            }
        } catch (error) {
            console.error("Erro ao carregar dados iniciais:", error);
        } finally {
            setLoading(false);
        }
    };

    carregarDadosIniciais();
  }, [navigate]);

  const carregarObjetivos = async (userId) => {
    try {
      const response = await axios.get(`https://softinsa-api-riya.onrender.com/objetivos/consultor/${userId}`);
      if (response.data.success) {
        setObjetivos(response.data.data);
      }
    } catch (error) {
      console.error("Erro ao carregar objetivos:", error);
    }
  };

  useEffect(() => {
      if (consultorSelecionadoId) {
          // Precisamos encontrar o ID_UTILIZADOR do consultor selecionado
          const c = consultoresBase.find(c => c.id.toString() === consultorSelecionadoId.toString());
          if (c && c.idUtilizador) {
              carregarObjetivos(c.idUtilizador);
          } else {
             // Tentar obter o idUtilizador do endpoint de perfil caso não esteja na lista base
             axios.get(`https://softinsa-api-riya.onrender.com/talent/consultores/perfil/${consultorSelecionadoId}`).then(res => {
                 if(res.data.success) {
                     carregarObjetivos(res.data.data.idUtilizador);
                 }
             }).catch(e => console.error("Erro ao obter perfil para timeline:", e));
          }
      } else {
          setObjetivos([]);
      }
  }, [consultorSelecionadoId, consultoresBase]);

  // Extração Dinâmica de Filtros
  const uniqueServiceLines = ['Todas', ...(estrutura.serviceLines || []).map(sl => sl.nome)];
  const uniqueAreas = ['Todas', ...(estrutura.areas || [])
      .filter(a => {
          if (slFiltro === 'Todas') return true;
          const slMatch = estrutura.serviceLines?.find(s => s.nome === slFiltro);
          return slMatch ? a.slId === slMatch.id : true;
      })
      .map(a => a.nome)];

  const listaFiltrada = consultoresBase.filter(c => 
      (slFiltro === 'Todas' || c.sl === slFiltro) &&
      (areaFiltro === 'Todas' || c.area === areaFiltro)
  );

  // Criar Novo Objetivo
  const handleCriarObjetivo = async () => {
    if(!novoTitulo || !novaData) {
        alert("Preencha o título e a data do objetivo!");
        return;
    }
    if(!consultorSelecionadoId) return;

    let idUtilizadorAlvo = null;
    const c = consultoresBase.find(c => c.id.toString() === consultorSelecionadoId.toString());
    if (c && c.idUtilizador) {
        idUtilizadorAlvo = c.idUtilizador;
    } else {
        try {
            const res = await axios.get(`https://softinsa-api-riya.onrender.com/talent/consultores/perfil/${consultorSelecionadoId}`);
            if(res.data.success) idUtilizadorAlvo = res.data.data.idUtilizador;
        } catch(e) {}
    }

    if(!idUtilizadorAlvo) {
        alert("Erro ao identificar o utilizador destino.");
        return;
    }

    try {
      const response = await axios.post('https://softinsa-api-riya.onrender.com/objetivos/criar', {
        idUtilizador: idUtilizadorAlvo,
        titulo: novoTitulo,
        dataMeta: novaData,
        descricao: novaDescricao,
        tipo: novoTipo,
        origem: 'Atribuído por Talent Manager',
        enviarNotificacao: enviarNotificacao
      });

      if (response.data.success) {
        setShowModal(false);
        setNovoTitulo('');
        setNovaData('');
        setNovaDescricao('');
        carregarObjetivos(idUtilizadorAlvo);
      }
    } catch (error) {
      alert("Erro ao criar objetivo.");
      console.error(error);
    }
  };

  const total = objetivos.length;
  const ativos = objetivos.filter(obj => !obj.concluido).length;
  const concluidos = objetivos.filter(obj => obj.concluido).length;
  const progressoPercent = total > 0 ? Math.round((concluidos / total) * 100) : 0;

  if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="d-flex bg-light min-vh-100">
      <SidebarTalentManager />

      <div className="flex-grow-1 p-4 dashboard-scroll">
        <div className="container-fluid text-start">
          
          <CabecalhoDashboard 
            titulo="Gestão de Objetivos e Timeline"
            subtitulo="Atribua e acompanhe objetivos profissionais para os consultores"
            utilizador={utilizador}
            avatarUrl={avatarUrl}
          />

          {/* FILTROS PARA SELECIONAR CONSULTOR */}
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-5 bg-white">
            <h5 className="fw-bold mb-3 text-dark">1. Selecionar Consultor</h5>
            <div className="row g-3 align-items-end">
                <div className="col-md-3">
                    <label className="fw-bold small text-muted mb-1 ms-1">Service Line</label>
                    <select className="form-select border-0 shadow-sm py-2 bg-light text-muted" value={slFiltro} 
                            onChange={(e) => {setSlFiltro(e.target.value); setAreaFiltro('Todas'); setConsultorSelecionadoId('');}}>
                        {uniqueServiceLines.map(sl => <option key={sl} value={sl}>{sl === 'Todas' ? 'Todas as Service Lines' : sl}</option>)}
                    </select>
                </div>
                <div className="col-md-3">
                    <label className="fw-bold small text-muted mb-1 ms-1">Área Preferida</label>
                    <select className="form-select border-0 shadow-sm py-2 bg-light text-muted" value={areaFiltro} 
                            onChange={(e) => {setAreaFiltro(e.target.value); setConsultorSelecionadoId('');}}>
                        {uniqueAreas.map(area => <option key={area} value={area}>{area === 'Todas' ? 'Todas as Áreas' : area}</option>)}
                    </select>
                </div>
                <div className="col-md-6">
                    <label className="fw-bold small text-muted mb-1 ms-1">Consultor</label>
                    <select className="form-select border-0 shadow-sm py-2 bg-white border border-primary border-opacity-25" value={consultorSelecionadoId} 
                            onChange={(e) => setConsultorSelecionadoId(e.target.value)}>
                        <option value="">Selecione um Consultor da lista...</option>
                        {listaFiltrada.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                </div>
            </div>
          </div>

          {/* ÁREA DA TIMELINE (SÓ MOSTRA SE UM CONSULTOR ESTIVER SELECIONADO) */}
          {consultorSelecionadoId ? (
            <>
              {/* KPI Header Cards */}
              <div className="card border-0 shadow-sm rounded-pill py-2 px-4 mb-5 mx-auto bg-white" style={{ width: 'fit-content' }}>
                <div className="d-flex align-items-center gap-4">
                  <div className="d-flex align-items-center gap-2">
                    <div className="bg-danger bg-opacity-10 p-2 rounded-circle">🎯</div>
                    <span className="fw-bold text-dark">Total de Objetivos: {total}</span>
                  </div>
                  <div className="vr"></div>
                  <span className="text-primary fw-bold">Em Execução: {ativos}</span>
                  <div className="vr"></div>
                  <span className="text-success fw-bold">Concluídos: {concluidos}</span>
                </div>
              </div>

              {/* Botão para Adicionar */}
              <div className="text-center pb-5">
                <button className="btn btn-primary px-5 py-3 rounded-pill fw-bold shadow-sm" onClick={() => setShowModal(true)} style={{backgroundColor: '#5D78FF', border: 'none'}}>
                  <i className="bi bi-plus-circle-fill me-2"></i> Atribuir Novo Objetivo
                </button>
              </div>

              {/* Timeline Columns */}
              <div className="row position-relative">
                <div className="position-absolute start-50 translate-middle-x h-100 d-none d-md-block" style={{ width: '4px', backgroundColor: '#dee2e6', zIndex: 0 }}></div>

                {/* Coluna Em Execução */}
                <div className="col-md-6 pe-md-5">
                  <h5 className="text-center mb-4"><i className="bi bi-circle-fill text-primary me-2 small"></i> Em Execução</h5>
                  {objetivos.filter(o => !o.concluido).length > 0 ? objetivos.filter(o => !o.concluido).map(obj => (
                    <div key={obj.id} className="card border-0 shadow-sm rounded-4 p-3 mb-4 text-start position-relative bg-white" style={{ zIndex: 1 }}>
                      <div className="d-flex justify-content-between">
                        <div className="d-flex align-items-center gap-2 text-muted small mb-2">
                          <i className="bi bi-person-circle"></i> {obj.autor}
                        </div>
                      </div>
                      <h5 className="fw-bold mb-1 text-dark">{obj.titulo}</h5>
                      <p className="small mb-2 text-dark">Status: <i className={`bi bi-circle-fill text-${obj.corStatus} me-1 small`}></i> {obj.status}</p>
                      <p className="small fw-bold mb-3 text-muted">Data Meta: <span className="text-danger">{obj.data}</span></p>
                    </div>
                  )) : (
                      <p className="text-muted text-center pt-4">Nenhum objetivo em execução.</p>
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
                      <p className="small text-muted mb-0">Concluído a: {obj.dataConclusao || obj.data}</p>
                      {obj.atrasado && (
                        <p className="small text-danger fw-bold mb-0 mt-1">
                          <i className="bi bi-exclamation-triangle-fill me-1"></i>
                          Atrasado {obj.diasAtraso} {obj.diasAtraso === 1 ? 'dia' : 'dias'}
                        </p>
                      )}
                      <div className="text-end mt-2"><i className="bi bi-check-all text-success fs-4"></i></div>
                    </div>
                  )) : (
                      <p className="text-muted text-center pt-4">Ainda não concluiu objetivos.</p>
                  )}
                </div>
              </div>

              {/* BARRA DE PROGRESSO INFERIOR */}
              <div className="mt-5 mb-5 px-5">
                <div className="progress mb-3 shadow-sm" style={{ height: '10px', borderRadius: '10px' }}>
                  <div className="progress-bar progress-bar-striped progress-bar-animated" 
                       role="progressbar" style={{ width: `${progressoPercent}%`, backgroundColor: '#5D78FF' }}></div>
                </div>
                <div className="d-flex justify-content-center border p-3 rounded-4 bg-white shadow-sm mx-auto" style={{maxWidth: '500px'}}>
                   <span className="small fw-bold text-dark">Marcos Alcançados: <span className="text-success">{concluidos}/{total}</span> ({progressoPercent}%)</span>
                </div>
              </div>
            </>
          ) : (
             <div className="text-center py-5 text-muted bg-white rounded-4 shadow-sm border border-dashed border-2 p-5" style={{borderStyle: 'dashed'}}>
                <i className="bi bi-person-vcard fs-1 d-block mb-3 opacity-25"></i>
                Selecione um Consultor acima para gerir os seus Objetivos e Timeline de Evolução.
             </div>
          )}

        </div>
      </div>

      {/* MODAL: CRIAR OBJETIVO PELA TM */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 rounded-4 p-4 shadow-lg">
              <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                <h3 className="fw-bold m-0 text-primary">Atribuir Meta de Evolução</h3>
                <button type="button" className="btn-close shadow-none" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="text-start">
                <div className="mb-4">
                  <label className="form-label fw-bold small text-dark">Nome do Objetivo (*)</label>
                  <input 
                    type="text" 
                    className="form-control py-2 bg-light border-0 rounded-3 shadow-sm" 
                    placeholder="Ex: Concluir Certificação AWS Practitioner" 
                    value={novoTitulo}
                    onChange={e => setNovoTitulo(e.target.value)}
                  />
                </div>
                <div className="row mb-4">
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-dark">Data Limite (Deadline) (*)</label>
                    <input 
                        type="date" 
                        className="form-control py-2 bg-light border-0 rounded-3 shadow-sm text-dark" 
                        value={novaData}
                        onChange={e => setNovaData(e.target.value)}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-dark">Tipo de Objetivo</label>
                    <select 
                        className="form-select py-2 bg-light border-0 rounded-3 text-dark shadow-sm"
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
                  <label className="form-label fw-bold small text-dark">Plano de Ação / Requisitos</label>
                  <textarea 
                    className="form-control bg-light border-0 rounded-3 shadow-sm text-dark" 
                    rows="4" 
                    placeholder="Defina os passos que o consultor deve tomar para atingir este objetivo..."
                    value={novaDescricao}
                    onChange={e => setNovaDescricao(e.target.value)}
                  ></textarea>
                </div>
                <div className="form-check mb-5 d-flex align-items-center justify-content-center bg-light p-3 rounded-3 border">
                  <input className="form-check-input shadow-none cursor-pointer ms-1" type="checkbox" id="notifCheck" checked={enviarNotificacao} onChange={(e) => setEnviarNotificacao(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                  <label className="form-check-label text-dark fw-bold small ms-3 cursor-pointer pt-1" htmlFor="notifCheck">
                    Enviar Notificação Automática ao Consultor com este novo Objetivo
                  </label>
                </div>
                <div className="d-flex gap-3 justify-content-center">
                  <button className="btn btn-primary px-5 rounded-pill fw-bold shadow-sm" style={{backgroundColor: '#5D78FF', border: 'none'}} onClick={handleCriarObjetivo}>Atribuir Objetivo ao Consultor</button>
                  <button className="btn btn-secondary px-4 rounded-pill fw-bold shadow-sm" onClick={() => setShowModal(false)}>Cancelar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelineGlobalTalent;
