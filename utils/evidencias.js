import axios from 'axios';

const API_BASE = 'https://softinsa-api-riya.onrender.com';

const resolverUrl = (url) => {
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_BASE}${url}`;
};

export const abrirEvidenciaProtegida = async (url, { download = false } = {}) => {
  try {
    const urlFinal = resolverUrl(url);
    if (!urlFinal) return;

    const separador = urlFinal.includes('?') ? '&' : '?';
    const response = await axios.get(`${urlFinal}${separador}download=${download ? '1' : '0'}`, {
      responseType: 'blob'
    });

    const contentType = response.headers['content-type'] || 'application/octet-stream';
    const blob = new Blob([response.data], { type: contentType });
    const objectUrl = URL.createObjectURL(blob);
    window.open(objectUrl, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
  } catch (error) {
    alert(error.response?.status === 403
      ? 'Não tem permissões para abrir esta evidência.'
      : 'Não foi possível abrir esta evidência.');
  }
};
