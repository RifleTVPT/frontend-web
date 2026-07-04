import React, { useState, useEffect } from 'react';
import axios from 'axios';

const NotificationSystem = () => {
  const [notifications, setNotifications] = useState([]);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [utilizador, setUtilizador] = useState(null);

  useEffect(() => {
    const userLocal = JSON.parse(sessionStorage.getItem('user'));
    if (userLocal) {
        setUtilizador(userLocal);
        carregarNotificacoes(userLocal);
    }
  }, []);

  const carregarNotificacoes = async (userLocal) => {
    try {
        const idUser = userLocal.ID_UTILIZADOR;
        const response = await axios.get(`https://softinsa-api-riya.onrender.com/notificacoes/user/${idUser}`);
        
        let novasNotificacoes = [];
        if(response.data.success) {
            novasNotificacoes = Array.isArray(response.data.data) ? response.data.data : [];
        }

        // Tentar ir buscar avisos gerais
        try {
            const resAvisos = await axios.get('https://softinsa-api-riya.onrender.com/avisos');
            if(resAvisos.data.success) {
                const ativos = (Array.isArray(resAvisos.data.data) ? resAvisos.data.data : [])
                    .filter(a => a.status === 'Ativo');
                const readAvisos = JSON.parse(localStorage.getItem('read_avisos')) || [];

                const avisosFiltrados = ativos.filter(a => {
                    const perfilStr = userLocal.PERFIL_UTILIZADOR || '';
                    if(a.visibilidade === 'Todos') return true;
                    if(a.visibilidade === 'Apenas Consultores' && perfilStr.includes('Consultor') && !perfilStr.includes('Talent') && !perfilStr.includes('Service Line Leader')) return true;
                    if(a.visibilidade === 'Talent + SLL' && (perfilStr.includes('Talent') || perfilStr.includes('Service Line Leader') || perfilStr.includes('SLL'))) return true;
                    if(a.visibilidade === 'Apenas Administradores' && perfilStr.includes('Administrador')) return true;
                    return false;
                });

                const avisosFormatados = avisosFiltrados.map(a => ({
                    id: `aviso-${a.id}`,
                    isAviso: true,
                    realId: a.id,
                    type: 'aviso_global',
                    title: a.titulo,
                    desc: a.mensagem,
                    time: 'Aviso',
                    date: a.data,
                    read: readAvisos.includes(a.id)
                }));

                novasNotificacoes = [...avisosFormatados, ...novasNotificacoes];
            }
        } catch (e) { console.error("Erro ao carregar avisos para notificações", e); }

        setNotifications(novasNotificacoes);
    } catch (error) {
        console.error("Erro ao carregar notificações", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = async (e) => {
    e.stopPropagation(); // Impede o dropdown de fechar
    try {
        await axios.put(`https://softinsa-api-riya.onrender.com/notificacoes/user/${utilizador.ID_UTILIZADOR}/read-all`);
        
        // Marcar todos os avisos como lidos também
        const readAvisos = JSON.parse(localStorage.getItem('read_avisos')) || [];
        const unreadAvisoIds = notifications.filter(n => n.isAviso && !n.read).map(n => n.realId);
        localStorage.setItem('read_avisos', JSON.stringify([...readAvisos, ...unreadAvisoIds]));

        setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (error) {
        console.error("Erro", error);
    }
  };

  const openDetails = async (notif) => {
    setSelectedNotif(notif);
    if (!notif.read) {
        if (notif.isAviso) {
            const readAvisos = JSON.parse(localStorage.getItem('read_avisos')) || [];
            if (!readAvisos.includes(notif.realId)) {
                localStorage.setItem('read_avisos', JSON.stringify([...readAvisos, notif.realId]));
            }
            setNotifications(notifications.map(n => n.id === notif.id ? { ...n, read: true } : n));
        } else {
            try {
                await axios.put(`https://softinsa-api-riya.onrender.com/notificacoes/${notif.id}/read`);
                setNotifications(notifications.map(n => n.id === notif.id ? { ...n, read: true } : n));
            } catch (error) {
                console.error("Erro", error);
            }
        }
    }
  };

  const toggleShowAll = (e) => {
      e.stopPropagation(); // Impede o dropdown de fechar automaticamente!
      setShowAll(!showAll);
  };

  const getTypeStyles = (type) => {
    switch (type) {
      case 'accepted': return { color: '#198754', icon: 'bi-check-circle-fill' };
      case 'rejected': return { color: '#dc3545', icon: 'bi-x-circle-fill' };
      case 'system':   return { color: '#713FAA', icon: 'bi-gear-fill' };
      case 'badge':    return { color: '#0d6efd', icon: 'bi-patch-check-fill' };
      case 'warning':  return { color: '#dc3545', icon: 'bi-exclamation-octagon-fill' };
      case 'aviso_global': return { color: '#ff9800', icon: 'bi-exclamation-triangle-fill' }; // Aviso Laranja forte
      default:         return { color: '#6c757d', icon: 'bi-bell-fill' };
    }
  };

  const displayList = showAll ? notifications : notifications.slice(0, 3);

  return (
    <>
      {/* ATENÇÃO AO data-bs-auto-close="outside" AQUI */}
      <div className="dropdown" data-bs-auto-close="outside">
        <div className="position-relative cursor-pointer" data-bs-toggle="dropdown" aria-expanded="false">
          <i className="bi bi-bell fs-4 text-secondary"></i>
          {unreadCount > 0 && (
            <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle"></span>
          )}
        </div>

        <ul className="dropdown-menu dropdown-menu-end shadow border-0 rounded-4 mt-2 p-0" style={{ width: '320px' }}>
          <li className="p-3 border-bottom d-flex justify-content-between align-items-center">
            <span className="fw-bold">Notificações</span>
            <button className="btn btn-link btn-sm text-decoration-none p-0" onClick={markAllRead}>Ler todas</button>
          </li>
          <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
            {displayList.length > 0 ? displayList.map(n => (
              <li key={n.id} 
                  className={`p-3 border-bottom cursor-pointer transition-all ${n.read ? 'bg-light text-muted' : (n.isAviso ? 'bg-warning bg-opacity-10 text-dark fw-bold border-start border-4 border-warning' : 'bg-white text-dark fw-medium')}`}
                  onClick={() => openDetails(n)}>
                <div className="d-flex gap-2">
                  <i className={`bi ${getTypeStyles(n.type).icon} ${n.isAviso && !n.read ? 'fs-5' : ''}`} style={{ color: getTypeStyles(n.type).color }}></i>
                  <div className="lh-sm w-100">
                    <div className="small fw-bold">{n.title}</div>
                    <div className="text-truncate small" style={{ maxWidth: '230px' }}>{n.desc}</div>
                    <div className="d-flex justify-content-between mt-1">
                        <small className="text-muted fw-bold" style={{ fontSize: '10px', color: n.isAviso ? '#ff9800' : '' }}>{n.time}</small>
                        <small className="text-muted" style={{ fontSize: '10px' }}>{n.date}</small>
                    </div>
                  </div>
                </div>
              </li>
            )) : (
                <div className="p-4 text-center text-muted small">Sem notificações.</div>
            )}
          </div>
          {notifications.length > 3 && (
            <li className="p-2 text-center border-top bg-light rounded-bottom-4">
                <button className="btn btn-sm text-primary fw-bold w-100" onClick={toggleShowAll}>
                {showAll ? "Esconder lista expandida" : "Ver todas as notificações"}
                </button>
            </li>
          )}
        </ul>
      </div>

      {/* Pop-up de Detalhe da Notificação */}
      {selectedNotif && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow p-3">
              <div className="modal-header border-0">
                <h5 className="fw-bold">Detalhes da Notificação</h5>
                <button type="button" className="btn-close shadow-none" onClick={() => setSelectedNotif(null)}></button>
              </div>
              <div className="modal-body text-center p-4">
                <i className={`bi ${getTypeStyles(selectedNotif.type).icon}`} style={{ fontSize: '4rem', color: getTypeStyles(selectedNotif.type).color }}></i>
                <h4 className="fw-bold mt-3" style={{ color: getTypeStyles(selectedNotif.type).color }}>{selectedNotif.title}</h4>
                <p className="text-muted mt-3 px-2">{selectedNotif.desc}</p>
                <div className="d-flex justify-content-center gap-3 mt-4 text-muted small">
                  <span><i className="bi bi-calendar3 me-1"></i> {selectedNotif.date}</span>
                  <span><i className="bi bi-clock me-1"></i> {selectedNotif.time}</span>
                </div>
                <button className="btn btn-primary w-100 rounded-pill mt-4 fw-bold shadow" onClick={() => setSelectedNotif(null)}>Fechar Visualização</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationSystem;
