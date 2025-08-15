// Central place to read env and enforce correctness in prod builds
const RAW = import.meta.env.VITE_API_BASE_URL as string | undefined;

export const API_BASE_URL = (() => {
  if (RAW && RAW.trim()) return RAW.replace(/\/+$/, ''); // trim trailing slash
  if (import.meta.env.PROD) {
    // In production we must have a URL – stop silently falling back to localhost
    throw new Error(
      'VITE_API_BASE_URL is not set for production build. ' +
      'Set it to your Railway backend URL.'
    );
  }
  // Dev fallback
  return 'http://localhost:5000';
})();

export const API_V1 = `${API_BASE_URL}/api/v1`;
