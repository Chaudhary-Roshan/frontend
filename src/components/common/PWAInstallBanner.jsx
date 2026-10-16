import React, { useState } from 'react';
import { Download, Sparkles, X, CheckCircle2 } from 'lucide-react';
import { usePWA } from '../../context/PWAContext';

export const PWAInstallButton = ({ className = '' }) => {
  const { isInstallable, isInstalled, promptInstall } = usePWA();
  const [installing, setInstalling] = useState(false);

  if (isInstalled || !isInstallable) return null;

  const handleInstall = async () => {
    setInstalling(true);
    await promptInstall();
    setInstalling(false);
  };

  return (
    <button
      onClick={handleInstall}
      disabled={installing}
      className={`px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95 cursor-pointer ${className}`}
      title="Install DSMS as Progressive Web App"
    >
      <Download size={14} className={installing ? 'animate-bounce' : ''} />
      <span>Install App</span>
    </button>
  );
};

export const PWAInstallCard = () => {
  const { isInstallable, isInstalled, promptInstall } = usePWA();
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled || !isInstallable || dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-purple-900 text-white rounded-2xl p-4 sm:p-5 shadow-xl border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-start gap-3.5 z-10">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center shrink-0">
          <Sparkles size={24} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-black text-sm text-white">Install DSMS Web App</h4>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Offline Ready
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Get instant home screen access, fast offline loading, and a native app experience on your phone or desktop.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 z-10">
        <button
          onClick={promptInstall}
          className="flex-1 sm:flex-initial px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Download size={15} />
          <span>Install Now</span>
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
          title="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default PWAInstallButton;
