export const API_URL = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_API_URL || 'https://backend-zetah-production.up.railway.app');
