import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/',
  timeout: 60000,
});

const attachAuthToken = (config) => {
  const token = localStorage.getItem('access_token');
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

api.interceptors.request.use(attachAuthToken, (error) => Promise.reject(error));
axios.interceptors.request.use(attachAuthToken, (error) => Promise.reject(error));

// In-memory cache + in-flight request deduplication
const cache = new Map();
const inFlight = new Map();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

// Cacheable read-only public catalog endpoints
const CACHEABLE_ROUTES = [
  'societies/',
  'events/',
  'recruitments/',
  'news/',
  'gallery/',
  'gallery/albums/',
  'date-claims/calendar_locks/',
];

export const invalidateCache = (pattern) => {
  if (!pattern) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
};

// Wrap api.get with deduplication & caching (only for guest / unauthenticated public requests)
const originalGet = api.get.bind(api);
api.get = async (url, config = {}) => {
  const hasAuth = Boolean(localStorage.getItem('access_token'));
  // Authenticated dashboard & portal users ALWAYS query live database data directly
  const isCacheable = !hasAuth && CACHEABLE_ROUTES.some(r => url === r || url.startsWith(r)) && !config.headers?.['Cache-Control'];

  if (isCacheable) {
    const cacheKey = `${url}_${JSON.stringify(config.params || {})}`;
    const cached = cache.get(cacheKey);
    const now = Date.now();

    if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
      return Promise.resolve({ ...cached.response, fromCache: true });
    }

    // Deduplicate concurrent in-flight requests for the exact same endpoint
    if (inFlight.has(cacheKey)) {
      return inFlight.get(cacheKey);
    }

    const requestPromise = originalGet(url, config)
      .then((res) => {
        cache.set(cacheKey, { timestamp: Date.now(), response: res });
        inFlight.delete(cacheKey);
        return res;
      })
      .catch((err) => {
        inFlight.delete(cacheKey);
        throw err;
      });

    inFlight.set(cacheKey, requestPromise);
    return requestPromise;
  }

  return originalGet(url, config);
};

let syncTimeout = null;
// Invalidate on mutations and notify all portal listeners
const clearCacheOnMutation = (response) => {
  const method = response.config?.method?.toLowerCase();
  const url = response.config?.url || '';

  // Exclude stateless uploads, login, and auth token operations from invalidating cache or dispatching sync events
  if (url.includes('upload') || url.includes('auth/login') || url.includes('auth/token')) {
    return response;
  }

  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    cache.clear();
    try {
      Object.keys(sessionStorage).forEach(k => {
        if (k.startsWith('dsms_cached_')) sessionStorage.removeItem(k);
      });
    } catch (e) {}

    if (typeof window !== 'undefined') {
      if (syncTimeout) clearTimeout(syncTimeout);
      syncTimeout = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('dsms:data_synced', {
          detail: { method, url: response.config?.url }
        }));
      }, 300);
    }
  }
  return response;
};

api.interceptors.response.use(clearCacheOnMutation, (error) => Promise.reject(error));

export default api;
