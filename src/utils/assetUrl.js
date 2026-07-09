import { getApiOrigin } from './publicBadgeImage';

export const resolveAssetUrl = (url) => {
  if (!url) return null;
  const value = String(url).trim();
  if (!value || value === 'null' || value === 'undefined') return null;
  if (value.startsWith('data:')) return value;
  if (/^https?:\/\/localhost:3000/i.test(value)) {
    return value.replace(/^https?:\/\/localhost:3000/i, getApiOrigin());
  }
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/')) return `${getApiOrigin()}${value}`;
  return `${getApiOrigin()}/uploads/${value.replace(/^uploads\//, '')}`;
};
