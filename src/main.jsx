import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import 'bootstrap/dist/css/bootstrap.min.css' // OBRIGATÓRIO PARA O BOOTSTRAP
import 'bootstrap/dist/js/bootstrap.bundle.min' // OBRIGATÓRIO PARA MODALS/DROPDOWNS
import 'bootstrap-icons/font/bootstrap-icons.css';

import axios from 'axios';
import Swal from 'sweetalert2';

// Configurar o Axios para enviar o Token em TODOS os pedidos!
axios.interceptors.request.use(config => {
  // Reescrever localhost:3000 para o domínio real se não estivermos em localhost
  if (config.url && config.url.startsWith('http://localhost:3000')) {
    const origin = window.location.origin;
    if (!origin.includes('localhost')) {
      config.url = config.url.replace('http://localhost:3000', origin);
    }
  }

  const userStr = sessionStorage.getItem('user');
  if (userStr) {
    const user = JSON.parse(userStr);
    if (user && user.token) {
      config.headers['Authorization'] = `Bearer ${user.token}`;
    }
  }
  return config;
}, error => {
  return Promise.reject(error);
});
// Configurar o Axios para lidar com erros 401 (Sessão Expirada)
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/' && currentPath !== '/registo' && currentPath !== '/recuperar-password') {
        sessionStorage.removeItem('user');
        
        Swal.fire({
          icon: 'warning',
          title: 'Sessão Expirada',
          text: 'A sua sessão expirou. Por favor, inicie sessão novamente para continuar.',
          confirmButtonText: 'Voltar ao Login',
          confirmButtonColor: '#255bbf',
          allowOutsideClick: false,
          allowEscapeKey: false
        }).then(() => {
          window.location.href = '/';
        });
      }
    }
    return Promise.reject(error);
  }
);
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
