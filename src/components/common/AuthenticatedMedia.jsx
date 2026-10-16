import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getMediaUrl, handleImageError as fallbackImageError, DEFAULT_SOCIETY_LOGO } from '../../utils/media';

// Never send a bearer token to an external image or document host.
export const backendMediaUrl = (value) => {
  if (!value || typeof value !== 'string') return null;
  const base = import.meta.env.VITE_API_BASE_URL || '/api/';
  try {
    const origin = new URL(base, window.location.origin).origin;
    const url = new URL(value, origin);
    return url.origin === origin && url.pathname.startsWith('/media/') ? url.href : null;
  } catch { return null; }
};

export const isSensitiveMedia = (url) => {
  if (!url || typeof url !== 'string') return false;
  const lower = url.toLowerCase();
  return (
    lower.includes('receipt') ||
    lower.includes('/cv') ||
    lower.includes('cvs/') ||
    lower.includes('payment_proof') ||
    lower.includes('proposal_doc') ||
    lower.includes('signed_proposal') ||
    lower.includes('signatures/')
  );
};

// In-memory cache for created blob URLs for sensitive media
const blobUrlCache = new Map();

export const fetchMedia = async (url, signal) => {
  if (!backendMediaUrl(url)) throw new Error('Refusing to authenticate to an external host.');
  const token = localStorage.getItem('access_token');
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'omit',
    cache: 'default',
    redirect: 'error',
    signal,
  });
  if (!response.ok) throw new Error('This file is unavailable or you do not have access.');
  
  const rawBlob = await response.blob();
  let mimeType = rawBlob.type;
  if (!mimeType || mimeType === 'application/octet-stream') {
    const headerType = response.headers.get('content-type');
    if (headerType && headerType !== 'application/octet-stream') {
      mimeType = headerType.split(';')[0].trim();
    } else {
      const ext = url.split('.').pop()?.toLowerCase();
      if (ext === 'png') mimeType = 'image/png';
      else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
      else if (ext === 'webp') mimeType = 'image/webp';
      else if (ext === 'svg') mimeType = 'image/svg+xml';
      else if (ext === 'pdf') mimeType = 'application/pdf';
    }
  }

  return (mimeType && mimeType !== rawBlob.type)
    ? new Blob([rawBlob], { type: mimeType })
    : rawBlob;
};

/**
 * Hybrid MediaImage Component:
 * - Public assets (club logos, banners, avatars, posters) render DIRECTLY as native <img src={getMediaUrl(src)} />.
 *   This eliminates JS fetch overhead, blob allocation, and browser decode issues, using native browser caching.
 * - Sensitive assets (payment receipts, signed proposals) automatically use authenticated fetch + blob conversion.
 */
export const MediaImage = ({ src, onError, alt = '', className = '', isPrivate = false, ...props }) => {
  const auth = useContext(AuthContext);
  const local = backendMediaUrl(src);
  const isSensitive = isPrivate || isSensitiveMedia(local || src);

  // 1. PUBLIC ASSETS: Serve directly via native <img> tag using normalized getMediaUrl()
  if (!isSensitive) {
    const directUrl = getMediaUrl(src);
    return (
      <img
        {...props}
        src={directUrl || undefined}
        alt={alt}
        className={className}
        onError={(e) => {
          fallbackImageError(e);
          onError?.(e);
        }}
        loading={props.loading || 'lazy'}
        decoding="async"
        fetchpriority={props.fetchpriority || (props.priority ? 'high' : 'auto')}
      />
    );
  }

  // 2. SENSITIVE ASSETS: Use authenticated fetch with Bearer token & in-memory blob cache
  const identity = auth?.user?.id ?? 'anon';
  const cacheKey = local ? `${identity}:${local}` : null;

  const [resolvedUrl, setResolvedUrl] = useState(() => {
    if (!local) return getMediaUrl(src);
    if (cacheKey && blobUrlCache.has(cacheKey)) {
      return blobUrlCache.get(cacheKey);
    }
    return getMediaUrl(src);
  });

  useEffect(() => {
    if (!local || !cacheKey) {
      setResolvedUrl(getMediaUrl(src));
      return;
    }

    if (blobUrlCache.has(cacheKey)) {
      setResolvedUrl(blobUrlCache.get(cacheKey));
      return;
    }

    const controller = new AbortController();
    let isCancelled = false;

    fetchMedia(local, controller.signal)
      .then(blob => {
        if (isCancelled) return;
        const objectUrl = URL.createObjectURL(blob);
        blobUrlCache.set(cacheKey, objectUrl);
        setResolvedUrl(objectUrl);
      })
      .catch(error => {
        if (isCancelled || error.name === 'AbortError') return;
        setResolvedUrl(getMediaUrl(src));
      });

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [local, cacheKey, src]);

  const handleImageError = (e) => {
    const fallback = getMediaUrl(src);
    if (resolvedUrl !== fallback && fallback) {
      setResolvedUrl(fallback);
    } else {
      fallbackImageError(e);
    }
    onError?.(e);
  };

  return (
    <img
      {...props}
      src={resolvedUrl || getMediaUrl(src) || undefined}
      alt={alt}
      className={className}
      onError={handleImageError}
      loading={props.loading || 'lazy'}
      decoding="async"
      fetchpriority={props.fetchpriority || (props.priority ? 'high' : 'auto')}
    />
  );
};

export const MediaLink = ({ href, onClick, children, download, ...props }) => {
  const local = backendMediaUrl(href);
  const [error, setError] = useState('');
  const openFile = async (event) => {
    onClick?.(event);
    if (event.defaultPrevented || !local) return;
    event.preventDefault();
    setError('');
    // Open synchronously to preserve the user's browser gesture.
    const tab = download === undefined ? window.open('about:blank', '_blank') : null;
    if (tab) tab.opener = null;
    try {
      const blob = await fetchMedia(local);
      const url = URL.createObjectURL(blob);
      if (tab) tab.location.replace(url);
      else {
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = typeof download === 'string' ? download : decodeURIComponent(new URL(local).pathname.split('/').pop());
        anchor.click();
      }
      // Give the browser time to consume large PDFs before releasing the URL.
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      if (tab) tab.close();
      setError(err.message);
    }
  };
  return <><a {...props} href={href} download={download} onClick={openFile}>{children}</a>{error && <span role="alert" className="block text-xs text-red-600">{error}</span>}</>;
};

export const clickMediaDownload = async (anchor) => {
  const local = backendMediaUrl(anchor.getAttribute('href'));
  if (!local) { anchor.click(); return; }
  const blob = await fetchMedia(local);
  const url = URL.createObjectURL(blob);
  anchor.href = url;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
};
