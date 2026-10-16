import { MediaImage } from '../components/common/AuthenticatedMedia';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  CheckCircle2, XCircle, Search, Award, Download, ShieldCheck, 
  Calendar, MapPin, Building, UserCheck, CreditCard, Ticket, 
  User, Check, Sparkles, AlertCircle, ScanLine, Image as ImageIcon
} from 'lucide-react';
import api from '../utils/api';
import CertificateModal from '../components/modals/CertificateModal';
import { Html5Qrcode } from 'html5-qrcode';

const defaultAvatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250";

const CertificateVerify = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [code, setCode] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'cert', 'member', 'ticket'
  const [result, setResult] = useState(null);
  const [resultType, setResultType] = useState(null); // 'certificate', 'membership', 'ticket'
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    let html5QrCode = null;
    let isComponentMounted = true;

    if (showScanner) {
      html5QrCode = new Html5Qrcode("reader");
      
      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      
      html5QrCode.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          if (isComponentMounted) {
            setCode(decodedText);
            setShowScanner(false);
            verifyCode(decodedText, activeTab !== 'all' ? activeTab : null);
          }
        },
        (error) => {
          // ignore scan errors (they happen every frame a QR is not found)
        }
      ).catch((err) => {
        console.error("Failed to start camera", err);
        if (isComponentMounted) {
          setError("Failed to access camera. Please ensure you have granted camera permissions.");
          setShowScanner(false);
        }
      });
    }

    return () => {
      isComponentMounted = false;
      if (html5QrCode) {
        try {
          if (html5QrCode.isScanning) {
            html5QrCode.stop().then(() => html5QrCode.clear()).catch(console.error);
          } else {
            html5QrCode.clear();
          }
        } catch (e) {
          console.error(e);
        }
      }
    };
  }, [showScanner, activeTab]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const html5QrCode = new Html5Qrcode("reader-hidden");
      const decodedText = await html5QrCode.scanFile(file, true);
      setCode(decodedText);
      setShowScanner(false);
      verifyCode(decodedText, activeTab !== 'all' ? activeTab : null);
      html5QrCode.clear();
    } catch (err) {
      console.error(err);
      setError("No valid QR code found in the uploaded image.");
    }
    // reset input so the same file can be selected again
    e.target.value = '';
  };

  const verifyCode = async (targetCode, explicitType = null) => {
    if (!targetCode) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setResultType(null);

    let cleanCode = targetCode.trim();
    // If user pasted or scanned a full URL or path
    if (cleanCode.includes('/verify/ticket/')) {
      explicitType = 'ticket';
      const parts = cleanCode.split('/verify/ticket/');
      cleanCode = parts[1]?.split(/[?#/]/)[0] || cleanCode;
    } else if (cleanCode.includes('/verify/member/')) {
      explicitType = 'member';
      const parts = cleanCode.split('/verify/member/');
      cleanCode = parts[1]?.split(/[?#/]/)[0] || cleanCode;
    } else if (cleanCode.includes('/verify/cert/') || cleanCode.includes('/verify/certificate/')) {
      explicitType = 'cert';
      const parts = cleanCode.includes('/verify/cert/') 
        ? cleanCode.split('/verify/cert/') 
        : cleanCode.split('/verify/certificate/');
      cleanCode = parts[1]?.split(/[?#/]/)[0] || cleanCode;
    } else if (cleanCode.includes('?')) {
      try {
        const urlObj = new URL(cleanCode, window.location.origin);
        const urlType = urlObj.searchParams.get('type');
        const urlCode = urlObj.searchParams.get('code');
        if (urlCode) cleanCode = urlCode;
        if (urlType && !explicitType) explicitType = urlType;
      } catch (e) {
        // Fallback simple parsing
        const match = cleanCode.match(/[?&]code=([^&]+)/);
        if (match) cleanCode = decodeURIComponent(match[1]);
      }
    } else if (cleanCode.includes('/')) {
      cleanCode = cleanCode.replace(/\/+$/, '');
      cleanCode = cleanCode.split('/').pop();
    }

    cleanCode = cleanCode.trim().replace(/^['"]|['"]$/g, '');

    if (cleanCode.startsWith('DSMS-VERIFY-MEM-')) {
      cleanCode = cleanCode.replace('DSMS-VERIFY-MEM-', '');
      explicitType = 'member';
    }

    const typeToTry = explicitType || searchParams.get('type') || activeTab;

    try {
      // 1. If explicit type is membership or member
      if (typeToTry === 'member' || typeToTry === 'membership') {
        const res = await api.get(`memberships/verify/?code=${encodeURIComponent(cleanCode)}`);
        setResult(res.data);
        setResultType('membership');
        return;
      }

      // 2. If explicit type is ticket
      if (typeToTry === 'ticket') {
        const res = await api.get(`registrations/verify-public/?code=${encodeURIComponent(cleanCode)}`);
        setResult(res.data);
        setResultType('ticket');
        return;
      }

      // 3. If explicit type is cert
      if (typeToTry === 'cert' || typeToTry === 'certificate') {
        const res = await api.get(`certificates/verify/?code=${encodeURIComponent(cleanCode)}`);
        setResult(res.data);
        setResultType('certificate');
        return;
      }

      // 4. Multi-fallback resolution: Try Certificate -> Ticket -> Membership
      try {
        const certRes = await api.get(`certificates/verify/?code=${encodeURIComponent(cleanCode)}`);
        if (certRes.data && (certRes.data.id || certRes.data.verification_code)) {
          setResult(certRes.data);
          setResultType('certificate');
          return;
        }
      } catch (certErr) {
        // fallback to ticket
      }

      try {
        const ticketRes = await api.get(`registrations/verify-public/?code=${encodeURIComponent(cleanCode)}`);
        if (ticketRes.data && (ticketRes.data.valid !== undefined || ticketRes.data.type === 'ticket' || ticketRes.data.id)) {
          setResult(ticketRes.data);
          setResultType('ticket');
          return;
        }
      } catch (ticketErr) {
        // fallback to membership
      }

      try {
        const memRes = await api.get(`memberships/verify/?code=${encodeURIComponent(cleanCode)}`);
        if (memRes.data && (memRes.data.valid !== undefined || memRes.data.type === 'membership' || memRes.data.id)) {
          setResult(memRes.data);
          setResultType('membership');
          return;
        }
      } catch (memErr) {
        // fallback
      }

      throw new Error('No authentic credential matched this identifier');
    } catch (err) {
      setError(
        err.response?.data?.error || 
        err.message || 
        'Invalid or unverified credential code. Please ensure the QR code was issued officially by university authorities.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const codeParam = searchParams.get('code');
    const typeParam = searchParams.get('type');
    if (typeParam) {
      setActiveTab(typeParam);
    }
    if (codeParam) {
      setCode(codeParam);
      verifyCode(codeParam, typeParam);
    }
  }, [searchParams]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (code.trim()) {
      verifyCode(code.trim(), activeTab !== 'all' ? activeTab : null);
    }
  };

  const getMediaUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url;
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api\/?$/, '');
    const clean = url.startsWith('/') ? url : `/${url}`;
    return baseUrl ? `${baseUrl}${clean}` : clean;
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 font-sans flex flex-col items-center">
      <div className="max-w-2xl w-full">
        {/* HEADER SECTION */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl mb-3 shadow-xs">
            <ShieldCheck size={36} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Official University Credential Verification
          </h1>
          <p className="text-slate-500 mt-2 text-xs sm:text-sm max-w-lg mx-auto font-medium">
            Scan from any standard phone camera or enter identifier to validate official Student Membership Cards, Event Passes, and Co-Curricular Certificates.
          </p>

          {/* Verification Mode Pills */}
          <div className="inline-flex p-1 bg-slate-200/80 rounded-2xl mt-5 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'all' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Auto Detect
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('member')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'member' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CreditCard size={14} /> Membership Card
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ticket')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'ticket' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Ticket size={14} /> Event Ticket
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('cert')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'cert' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award size={14} /> Certificate
            </button>
          </div>
        </div>

        {/* SEARCH BOX */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
          <form onSubmit={handleVerify} className="space-y-2">
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500">
              {activeTab === 'member' 
                ? 'Enter Membership Card Reference or ID:' 
                : activeTab === 'ticket'
                ? 'Enter Event Ticket UUID or Scan URL:'
                : activeTab === 'cert'
                ? 'Enter Certificate UUID:'
                : 'Enter Card ID, Ticket UUID, or Verification Code:'}
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder={
                  activeTab === 'member' 
                    ? 'e.g. 5 or DSMS-VERIFY-MEM-5'
                    : 'e.g. 550e8400-e29b-41d4-a716-446655440000 or full URL'
                }
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full pl-4 pr-32 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-mono text-xs text-slate-800"
                required
              />
              <div className="absolute right-2 top-2 bottom-2 flex gap-2">
                <label
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 rounded-xl transition flex items-center justify-center cursor-pointer shadow-xs"
                  title="Upload QR Image"
                >
                  <ImageIcon size={18} />
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileUpload}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setShowScanner(!showScanner)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 rounded-xl transition flex items-center justify-center cursor-pointer shadow-xs"
                  title="Scan QR Code"
                >
                  <ScanLine size={18} />
                </button>
                <button
                  type="submit"
                  disabled={loading || !code.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 rounded-xl transition flex items-center justify-center cursor-pointer shadow-xs"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Search size={18} />
                  )}
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Public verification: Anyone can scan or verify without needing to log in.
            </p>
          </form>

          {showScanner && (
            <div className="mt-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="relative bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-900/10">
                <div id="reader" className="w-full min-h-[300px] bg-slate-900 flex items-center justify-center">
                  <span className="text-white text-xs font-bold animate-pulse">Initializing Camera...</span>
                </div>
                
                {/* Scanner Overlay UI */}
                <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] border-2 border-white/50 rounded-xl pointer-events-none">
                  {/* Corner brackets */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-indigo-500 rounded-tl-lg"></div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-indigo-500 rounded-tr-lg"></div>
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-indigo-500 rounded-bl-lg"></div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-indigo-500 rounded-br-lg"></div>
                </div>

                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <button 
                    type="button"
                    onClick={() => setShowScanner(false)}
                    className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs px-6 py-2 rounded-full transition cursor-pointer shadow-lg flex items-center gap-2"
                  >
                    <XCircle size={16} /> Cancel Scanning
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ERROR ALERT */}
          {error && (
            <div className="bg-rose-50 p-6 rounded-2xl border border-rose-200 text-center animate-in zoom-in-95 space-y-2">
              <XCircle className="text-rose-600 mx-auto" size={40} />
              <h3 className="text-base font-black text-rose-900">Credential Verification Failed</h3>
              <p className="text-xs text-rose-700 font-medium">{error}</p>
            </div>
          )}

          {/* 1. MEMBERSHIP CARD VERIFICATION RESULT */}
          {result && resultType === 'membership' && (
            <div className="bg-emerald-50/70 p-6 sm:p-8 rounded-3xl border-2 border-emerald-300 animate-in zoom-in-95 space-y-6">
              {/* Header Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/30">
                    <CheckCircle2 size={28} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 inline-flex items-center gap-1">
                      <Sparkles size={11} /> Authentic & University Verified
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mt-1">Official Student Membership Card</h3>
                  </div>
                </div>

                <span className="text-[11px] font-mono font-black text-emerald-800 bg-emerald-100/90 px-3 py-1 rounded-xl border border-emerald-300 self-start sm:self-auto">
                  CARD ID: #{result.id}
                </span>
              </div>

              {/* SOCIETY BANNER WITH OFFICIAL LOGO */}
              <div className="p-4 bg-white rounded-2xl border border-emerald-200 shadow-sm flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                  {result.society_logo ? (
                    <MediaImage 
                      src={getMediaUrl(result.society_logo)} 
                      alt={result.society_name} 
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <Building size={26} className="text-indigo-600" />
                  )}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Departmental Society</span>
                  <h4 className="text-base font-black text-slate-900">{result.society_name}</h4>
                  <p className="text-xs text-indigo-600 font-bold">{result.society_category || 'Academic & Co-Curricular'}</p>
                </div>
              </div>

              {/* STUDENT PROFILE & DESIGNATION CARD */}
              <div className="p-5 bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl shadow-md space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-indigo-400 bg-slate-800 shrink-0">
                    <MediaImage
                      src={result.avatar_url ? getMediaUrl(result.avatar_url) : defaultAvatar}
                      alt={result.student_name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = defaultAvatar; }}
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 bg-indigo-950/90 border border-indigo-400/40 px-2.5 py-0.5 rounded-full inline-block mb-1">
                      Designation
                    </span>
                    {/* STUDENT DESIGNATION PROMINENTLY DISPLAYED */}
                    <h2 className="text-xl sm:text-2xl font-black text-amber-400 tracking-tight">
                      {result.designation || 'General Member'}
                    </h2>
                    <h3 className="text-base font-bold text-white truncate mt-0.5">
                      {result.student_name}
                    </h3>
                    <p className="text-xs font-mono text-indigo-200">
                      Roll No: {result.roll_number || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Additional Student Information Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-3 border-t border-slate-700/80 text-xs">
                  {result.student_cnic && (
                    <div className="p-2.5 bg-slate-800/80 rounded-xl">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">CNIC / Identity</span>
                      <span className="font-mono font-bold text-slate-200">{result.student_cnic}</span>
                    </div>
                  )}
                  {result.student_gender && (
                    <div className="p-2.5 bg-slate-800/80 rounded-xl">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Gender</span>
                      <span className="font-bold text-slate-200">{result.student_gender}</span>
                    </div>
                  )}
                  {result.student_father && (
                    <div className="p-2.5 bg-slate-800/80 rounded-xl">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Father's Name</span>
                      <span className="font-bold text-slate-200 truncate block">{result.student_father}</span>
                    </div>
                  )}
                  <div className="p-2.5 bg-slate-800/80 rounded-xl">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Degree Program</span>
                    <span className="font-bold text-slate-200 truncate block">{result.program || 'BS Program'}</span>
                  </div>
                  <div className="p-2.5 bg-slate-800/80 rounded-xl">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Department</span>
                    <span className="font-bold text-slate-200 truncate block">{result.department || 'Computing & IT'}</span>
                  </div>
                  <div className="p-2.5 bg-slate-800/80 rounded-xl">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Batch / Semester</span>
                    <span className="font-bold text-slate-200">{result.batch || 'Current'} {result.semester ? `• Sem ${result.semester}` : ''}</span>
                  </div>
                </div>
              </div>

              {/* STATUTORY AUTHORITY SEAL */}
              <div className="p-4 bg-white rounded-2xl border border-emerald-200 text-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Authority Status</span>
                  <span className="font-black text-emerald-700 flex items-center gap-1.5 mt-0.5">
                    <ShieldCheck size={16} className="text-emerald-600" />
                    Authorized by Directorate of Student Affairs & Society Patron
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Membership Status</span>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-black text-[11px] uppercase">
                    {result.status || 'Active'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 2. EVENT TICKET VERIFICATION RESULT */}
          {result && resultType === 'ticket' && (
            <div className="bg-emerald-50/70 p-6 sm:p-8 rounded-3xl border-2 border-emerald-300 animate-in zoom-in-95 space-y-6">
              {/* Header Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/30">
                    <Ticket size={28} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 inline-flex items-center gap-1">
                      <Sparkles size={11} /> Authentic & Verified Pass
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mt-1">Official Event Entry Pass</h3>
                  </div>
                </div>

                <span className="text-[11px] font-mono font-bold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200 self-start sm:self-auto">
                  REF: {result.ticket_number || (result.ticket_qr_code ? `${result.ticket_qr_code.substring(0, 14)}...` : 'PASS')}
                </span>
              </div>

              {/* EVENT SPOTLIGHT WITH SOCIETY LOGO */}
              <div className="p-4 bg-white rounded-2xl border border-emerald-200 shadow-sm flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                  {result.society_logo ? (
                    <MediaImage 
                      src={getMediaUrl(result.society_logo)} 
                      alt={result.society_name} 
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <Building size={26} className="text-indigo-600" />
                  )}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-600">{result.society_name}</span>
                  <h4 className="text-lg font-black text-slate-900">{result.event_title}</h4>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar size={13} className="text-slate-400" />
                      {result.event_date ? new Date(result.event_date).toLocaleString() : 'Campus Schedule'}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={13} className="text-slate-400" />
                      {result.event_venue || 'University Main Auditorium'}
                    </span>
                  </div>
                </div>
              </div>

              {/* STUDENT PARTICIPANT DETAILS */}
              <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-indigo-200 bg-slate-100 shrink-0">
                    <MediaImage
                      src={result.avatar_url ? getMediaUrl(result.avatar_url) : defaultAvatar}
                      alt={result.student_name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = defaultAvatar; }}
                    />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Registered Attendee</span>
                    <h3 className="text-base font-black text-slate-900">{result.student_name}</h3>
                    <p className="text-xs font-mono text-slate-500 font-bold">
                      Roll Number: {result.roll_number || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-3 border-t border-slate-100 text-xs">
                  {result.student_cnic && (
                    <div className="p-2.5 bg-slate-50 rounded-xl">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">CNIC</span>
                      <span className="font-mono font-bold text-slate-800">{result.student_cnic}</span>
                    </div>
                  )}
                  {result.student_gender && (
                    <div className="p-2.5 bg-slate-50 rounded-xl">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Gender</span>
                      <span className="font-bold text-slate-800">{result.student_gender}</span>
                    </div>
                  )}
                  {result.student_father && (
                    <div className="p-2.5 bg-slate-50 rounded-xl">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Father's Name</span>
                      <span className="font-bold text-slate-800 truncate block">{result.student_father}</span>
                    </div>
                  )}
                  <div className="p-2.5 bg-slate-50 rounded-xl">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Degree Program</span>
                    <span className="font-bold text-slate-800 truncate block">{result.program || 'BS Program'}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Department</span>
                    <span className="font-bold text-slate-800 truncate block">{result.department || 'Computing & IT'}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Payment & Price</span>
                    <span className="font-bold text-emerald-700">
                      {result.is_paid ? `PKR ${result.ticket_price} (Verified)` : 'Free Pass'}
                    </span>
                  </div>
                </div>
              </div>

              {/* GATE ENTRY STATUS */}
              <div className="p-4 bg-emerald-100/90 rounded-2xl border border-emerald-300 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-800 block">Admittance Gate Status</span>
                  <span className="font-black text-emerald-950 flex items-center gap-1.5 mt-0.5">
                    <CheckCircle2 size={16} className="text-emerald-700" />
                    {result.attendance_status 
                      ? 'Already Admitted / Checked-In at Venue Gate' 
                      : 'Valid for Entry • Ready for Scanner Check-in'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 block">Payment Status</span>
                  <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-full font-black text-[11px] uppercase">
                    {result.payment_status}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 3. CERTIFICATE VERIFICATION RESULT */}
          {result && resultType === 'certificate' && (
            <div className="bg-emerald-50/60 p-6 sm:p-8 rounded-3xl border border-emerald-200 animate-in zoom-in-95 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200/80 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300">
                      Authentic & Verified
                    </span>
                    <h3 className="text-lg font-black text-slate-900 mt-0.5">Official Digital Credential</h3>
                  </div>
                </div>

                <span className="text-[11px] font-mono font-bold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200 self-start sm:self-auto">
                  UUID: {result.verification_code ? `${result.verification_code.substring(0, 13)}...` : 'Verified'}
                </span>
              </div>

              {/* DETAILS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-white rounded-2xl border border-emerald-100 shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Recipient Student</span>
                  <p className="text-sm font-black text-slate-900">{result.student_name}</p>
                  <p className="text-[11px] font-mono text-slate-500">
                    {result.student_roll_number ? `Roll: ${result.student_roll_number}` : ''}
                    {result.student_department ? ` • ${result.student_department}` : ''}
                  </p>
                </div>

                <div className="p-3.5 bg-white rounded-2xl border border-emerald-100 shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Certifying Society</span>
                  <p className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                    {result.society_logo && (
                      <MediaImage src={getMediaUrl(result.society_logo)} alt="" className="w-4 h-4 rounded-full object-cover" />
                    )}
                    <Building size={14} className="text-indigo-600 shrink-0" /> {result.society_name}
                  </p>
                  <p className="text-[11px] text-slate-500">Official Campus Student Organization</p>
                </div>

                <div className="p-3.5 bg-white rounded-2xl border border-emerald-100 shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Event Completed</span>
                  <p className="text-sm font-black text-slate-900">{result.event_title}</p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <Calendar size={12} /> {result.event_date ? new Date(result.event_date).toLocaleDateString() : 'Campus Session'}
                  </p>
                </div>

                <div className="p-3.5 bg-white rounded-2xl border border-emerald-100 shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Official Signatories</span>
                  <p className="font-bold text-slate-800 flex items-center gap-1">
                    <UserCheck size={12} className="text-emerald-600 shrink-0" />
                    {result.advisor_name || 'Faculty Advisor'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    President: {result.president_name || 'Society President'}
                  </p>
                </div>
              </div>

              {/* ACTION BUTTON */}
              <button
                type="button"
                onClick={() => setShowCertificateModal(true)}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer"
              >
                <Download size={16} /> View & Download Full PDF / PNG Certificate
              </button>
            </div>
          )}
        </div>
      </div>

      {showCertificateModal && result && (
        <CertificateModal
          certificate={result}
          studentName={result.student_name}
          onClose={() => setShowCertificateModal(false)}
        />
      )}

      {/* Hidden div required by html5-qrcode for file scanning */}
      <div id="reader-hidden" style={{ display: 'none' }}></div>
    </div>
  );
};

export default CertificateVerify;
