import React from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { usePWA } from '../../context/PWAContext';

const PWAUpdateToast = () => {
  const { hasUpdate, updateApp } = usePWA();

  if (!hasUpdate) return null;

  return (
    <div className="fixed top-16 right-4 sm:right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="bg-slate-900/95 backdrop-blur-md text-white border border-slate-700/60 shadow-2xl rounded-2xl p-4 max-w-sm flex items-start gap-3.5">
        <div className="w-9 h-9 rounded-xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
          <Sparkles size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-black text-white">New Version Available</h4>
          <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
            A new update of the DSMS App Shell is ready. Update now for the latest features.
          </p>
          <div className="mt-2.5 flex items-center gap-2">
            <button
              onClick={updateApp}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm shadow-indigo-600/40"
            >
              <RefreshCw size={12} />
              <span>Update Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAUpdateToast;
