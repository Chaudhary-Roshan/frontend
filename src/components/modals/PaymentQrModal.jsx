import React, { useEffect } from 'react';
import QRCode from 'react-qr-code';
import { 
  X, Download, QrCode as QrIcon, CheckCircle2, 
  Building2, CreditCard, Smartphone, Sparkles, ShieldCheck 
} from 'lucide-react';
import { MediaImage } from '../common/AuthenticatedMedia';
import { getMediaUrl } from '../../utils/media';

/**
 * PaymentQrModal:
 * High-resolution, full-screen popup for scanning and downloading event payment QR codes.
 */
export default function PaymentQrModal({
  isOpen,
  onClose,
  qrValue,
  eventTitle = 'Event Registration',
  societyName = '',
  price = 0,
  bankName = '',
  accountTitle = '',
  accountIban = ''
}) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !qrValue) return null;

  const isImageUrl = typeof qrValue === 'string' && (
    qrValue.startsWith('http://') || 
    qrValue.startsWith('https://') || 
    qrValue.startsWith('/') ||
    qrValue.startsWith('data:')
  );

  const handleDownload = () => {
    if (isImageUrl) {
      const downloadUrl = getMediaUrl(qrValue);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${eventTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Payment_QR.png`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const svg = document.getElementById('payment-modal-qr-svg');
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);
        const link = document.createElement('a');
        link.href = svgUrl;
        link.download = `${eventTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Payment_QR.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(svgUrl);
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-indigo-100 overflow-hidden relative my-auto animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-5 sm:p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Close"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center justify-center shadow-xs">
              <QrIcon size={22} />
            </div>
            <div className="min-w-0 pr-8">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300 bg-indigo-500/20 px-2.5 py-0.5 rounded-full border border-indigo-400/30">
                Official Payment QR
              </span>
              <h3 className="text-base sm:text-lg font-black text-white truncate mt-1">
                {eventTitle}
              </h3>
              {societyName && (
                <p className="text-xs text-indigo-200 truncate">
                  Organized by {societyName}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 space-y-6">
          
          {/* Price Highlight Banner */}
          <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Admission Fee</span>
              <span className="text-xl sm:text-2xl font-black text-indigo-900">
                {price > 0 ? `Rs. ${price}` : 'Free'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100/80 px-3 py-1.5 rounded-xl border border-emerald-200">
              <ShieldCheck size={16} />
              <span>Verified Account</span>
            </div>
          </div>

          {/* LARGE HIGH-CONTRAST QR CODE DISPLAY */}
          <div className="flex flex-col items-center">
            <div className="relative p-5 sm:p-6 bg-white rounded-3xl border-2 border-dashed border-indigo-200 shadow-lg shadow-indigo-100/50 flex items-center justify-center">
              
              {/* Corner scan brackets */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-indigo-600 rounded-tl"></div>
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-indigo-600 rounded-tr"></div>
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-indigo-600 rounded-bl"></div>
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-indigo-600 rounded-br"></div>

              {isImageUrl ? (
                <MediaImage
                  src={getMediaUrl(qrValue)}
                  alt="High Resolution Payment QR"
                  className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-xl"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <QRCode
                  id="payment-modal-qr-svg"
                  value={qrValue}
                  size={240}
                  level="H"
                  className="rounded-lg"
                />
              )}
            </div>

            <p className="text-xs text-slate-500 font-medium text-center mt-3 flex items-center justify-center gap-1.5">
              <Smartphone size={14} className="text-indigo-600" />
              <span>Point your mobile camera or banking app directly at this QR code</span>
            </p>
          </div>

          {/* Optional Bank Transfer Details */}
          {(bankName || accountTitle || accountIban) && (
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5 text-slate-700">
              <div className="font-bold text-slate-900 flex items-center gap-1.5 pb-1 border-b border-slate-200">
                <CreditCard size={14} className="text-indigo-600" />
                <span>Manual Transfer Alternative:</span>
              </div>
              {bankName && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Bank:</span>
                  <span className="font-semibold text-slate-900">{bankName}</span>
                </div>
              )}
              {accountTitle && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Account Title:</span>
                  <span className="font-semibold text-slate-900">{accountTitle}</span>
                </div>
              )}
              {accountIban && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Account / IBAN:</span>
                  <span className="font-mono font-bold text-indigo-900 select-all">{accountIban}</span>
                </div>
              )}
            </div>
          )}

          {/* Supported Apps Badges */}
          <div className="flex items-center justify-center gap-2 flex-wrap text-[11px] font-bold text-slate-600">
            <span className="px-2.5 py-1 bg-red-50 text-red-700 rounded-lg border border-red-200">JazzCash</span>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">Easypaisa</span>
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">Raast QR</span>
            <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg border border-purple-200">Any Banking App</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleDownload}
              className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download size={15} />
              <span>Save / Download QR</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
