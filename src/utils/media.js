/**
 * Universal Media & Asset URL Normalizer for DSMS
 * Handles local development, Vite proxies, production deployments (Oracle Cloud / Cloudflare),
 * and prevents Mixed Content (HTTP/HTTPS) browser blocking.
 */

export const DEFAULT_SOCIETY_LOGO =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120' fill='none'%3E%3Crect width='120' height='120' rx='28' fill='%234F46E5'/%3E%3Ccircle cx='60' cy='60' r='42' fill='white' fill-opacity='0.12'/%3E%3Cpath d='M60 26L88 39V63C88 81 60 94 60 94C60 94 32 81 32 63V39L60 26Z' fill='white' fill-opacity='0.25' stroke='white' stroke-width='4' stroke-linejoin='round'/%3E%3Cpath d='M60 42L74 49V64C74 74 60 82 60 82C60 82 46 74 46 64V49L60 42Z' fill='white'/%3E%3C/svg%3E";

export const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80";

/**
 * Normalizes any image or file asset URL for safe browser rendering.
 */
export const getMediaUrl = (url) => {
  if (!url || typeof url !== 'string') return '';

  const trimmed = url.trim();
  if (!trimmed) return '';

  // Data URLs and Blobs can be rendered immediately
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  const rawApiBase = import.meta.env.VITE_API_BASE_URL || '';
  const serverOrigin = rawApiBase ? rawApiBase.replace(/\/api\/?$/, '') : '';

  // 1. Absolute URLs (http:// or https://)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    let resolved = trimmed;

    // If URL contains localhost or 127.0.0.1 in production, rewrite host
    const isLocalhost = resolved.includes('localhost:8000') || resolved.includes('127.0.0.1:8000');
    if (isLocalhost) {
      if (serverOrigin) {
        resolved = resolved.replace(/^https?:\/\/(localhost|127\.0\.0\.1):8000/, serverOrigin);
      } else {
        // In local Vite dev server, route through proxy
        resolved = resolved.replace(/^https?:\/\/(localhost|127\.0\.0\.1):8000/, '');
      }
    }

    // Mixed Content Prevention: if page is HTTPS, force https:// on external assets
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && resolved.startsWith('http://')) {
      resolved = 'https://' + resolved.slice(7);
    }

    return resolved;
  }

  // 2. Relative URLs (/media/... or media/... or uploads/...)
  let cleanPath = trimmed;
  if (!cleanPath.startsWith('/')) {
    cleanPath = `/${cleanPath}`;
  }

  if (serverOrigin) {
    return `${serverOrigin}${cleanPath}`;
  }

  return cleanPath;
};

export const DEFAULT_PHOTO_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300' fill='none'%3E%3Crect width='400' height='300' rx='16' fill='%230f172a'/%3E%3Cpath d='M100 220L170 140L230 220H100Z' fill='%23334155'/%3E%3Ccircle cx='145' cy='115' r='20' fill='%23475569'/%3E%3Cpath d='M210 220L275 125L350 220H210Z' fill='%23475569'/%3E%3C/svg%3E";

/**
 * Image error event handler that prevents broken image icons across all browsers.
 * Replaces broken images with a high-fidelity SVG badge without crashing or looping.
 */
export const handleImageError = (e, fallback) => {
  if (e && e.currentTarget) {
    if (e.currentTarget.getAttribute('data-error-handled') === 'true') {
      return;
    }
    e.currentTarget.setAttribute('data-error-handled', 'true');
    e.currentTarget.onerror = null;

    if (fallback) {
      e.currentTarget.src = fallback;
      return;
    }

    const alt = (e.currentTarget.getAttribute('alt') || '').toLowerCase();
    const className = (e.currentTarget.getAttribute('class') || '').toLowerCase();
    const isPhoto = alt.includes('photo') || alt.includes('gallery') || alt.includes('poster') || alt.includes('showcase') || className.includes('object-cover');
    e.currentTarget.src = isPhoto ? DEFAULT_PHOTO_PLACEHOLDER : DEFAULT_SOCIETY_LOGO;
  }
};

export default getMediaUrl;
