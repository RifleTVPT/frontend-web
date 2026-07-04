export const getApiOrigin = () => {
    const configuredApi = String(import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
    if (configuredApi) return configuredApi;
    if (['localhost', '127.0.0.1'].includes(window.location.hostname)) {
        return `${window.location.protocol}//${window.location.hostname}:3000`;
    }
    // No ambiente de produção, apontamos sempre para o servidor Render da API
    return 'https://softinsa-api-riya.onrender.com';
};

export const getDefaultBadgeImage = () => `${getApiOrigin()}/uploads/default-trophy.png`;

export const resolvePublicBadgeImage = (url) => {
    const fallback = getDefaultBadgeImage();
    if (
        !url
        || !String(url).trim()
        || String(url).includes('placeholder')
        || String(url).includes('3112946.png')
        || String(url).includes('default-trophy')
    ) {
        return fallback;
    }

    const value = String(url).trim();
    if (/^https?:\/\/localhost:3000/i.test(value)) {
        return value.replace(/^https?:\/\/localhost:3000/i, getApiOrigin());
    }
    if (value.startsWith('/')) return `${getApiOrigin()}${value}`;
    if (!/^https?:\/\//i.test(value)) {
        return `${getApiOrigin()}/uploads/${value.replace(/^uploads\//, '')}`;
    }
    return value;
};

export const useDefaultBadgeImageOnError = (event) => {
    const fallback = getDefaultBadgeImage();
    if (event.currentTarget.src !== fallback) {
        event.currentTarget.src = fallback;
    }
};
