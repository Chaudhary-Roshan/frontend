import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { usePWA } from '../../context/PWAContext';

const NetworkStatusBanner = () => {
  const { isOffline } = usePWA();
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (isOffline) {
      setWasOffline(true);
    } else if (wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isOffline, wasOffline]);

  if (showReconnected) {
    return (
      <div className="fixed bottom-20 sm:bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
        <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold border border-emerald-500">
          <Wifi size={16} className="animate-pulse" />
          <span>Connection restored • Back online</span>
        </div>
      </div>
    );
  }

  if (!isOffline) return null;

  return (
    <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-md relative z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <WifiOff size={15} className="text-slate-950 shrink-0" />
          <span>
            <strong>Offline App Shell Active:</strong> You are currently offline. Viewing cached campus data.
          </span>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="ml-3 px-2.5 py-1 bg-slate-950 text-white hover:bg-slate-900 rounded-lg text-[11px] font-black tracking-wide flex items-center gap-1 cursor-pointer transition shrink-0"
        >
          <RefreshCw size={11} />
          <span>Retry</span>
        </button>
      </div>
    </div>
  );
};

export default NetworkStatusBanner;
