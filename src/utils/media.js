/**
 * Utility to resolve media asset URLs across local development and production deployments.
 * Prevents hardcoding localhost or 127.0.0.1 origins.
 */
export const getMediaUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    // If the URL inadvertently contains localhost or 127.0.0.1 in production, rewrite to relative path
    const isLocalhostAbsolute = url.includes('localhost:8000') || url.includes('127.0.0.1:8000');
    if (isLocalhostAbsolute) {
      const pathOnly = url.replace(/^http:\/\/(localhost|127\.0\.0\.1):8000/, '');
      const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api\/?$/, '');
      return baseUrl ? `${baseUrl}${pathOnly.startsWith('/') ? '' : '/'}${pathOnly}` : pathOnly;
    }
    return url;
  }
  
  const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api\/?$/, '');
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return baseUrl ? `${baseUrl}${cleanUrl}` : cleanUrl;
};

export default getMediaUrl;
