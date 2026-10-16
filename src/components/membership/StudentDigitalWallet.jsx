import { MediaImage } from '../common/AuthenticatedMedia';
import React, { useRef } from 'react';
import { ShieldCheck, Download, Fingerprint, Award, CreditCard, Inbox, CheckCircle, Sparkles } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import QRCode from 'react-qr-code';

const StudentDigitalWallet = ({ currentUser, memberships = [], onCardClick }) => {
  if (!currentUser) return null;

  const normalizedUser = {
    name: currentUser.name || currentUser.full_name || currentUser.username || 'Student Member',
    roll_number: currentUser.roll_number || 'N/A',
    department: currentUser.department || 'N/A',
    faculty: currentUser.faculty_name || currentUser.faculty || 'Faculty of Computing & Information Technology',
    program: currentUser.program || 'N/A',
    semester: currentUser.semester || 'N/A',
    email: currentUser.email || 'N/A',
    is_cabinet_member: Boolean(
      currentUser.role === 'president' || 
      currentUser.is_cabinet_member
    ),
    cabinet_role: currentUser.cabinet_role || (currentUser.role === 'president' ? 'President' : 'Cabinet Member'),
    cabinet_society_name: currentUser.cabinet_society_name || currentUser.society_name || 'Departmental Society',
    cabinet_society_logo: currentUser.cabinet_society_logo || currentUser.society_logo || null,
    cabinet_society_advisor: currentUser.cabinet_society_advisor || null,
    cabinet_society_president: currentUser.cabinet_society_president || null,
    avatar: currentUser.profile_photo_url || currentUser.avatar_url || null
  };

  // Strictly filter for official active/approved memberships — pending applications DO NOT receive cards
  const activeMemberships = (memberships || []).filter(m => m.status === 'active' && m.is_active);
  const totalCredentials = activeMemberships.length + (normalizedUser.is_cabinet_member ? 1 : 0);

  const handleDownload = async (elementId, cardName) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    try {
      const dataUrl = await htmlToImage.toPng(element, { 
        pixelRatio: 3,
        style: {
          transform: 'none' // Ensures no hover scale affects the capture
        }
      });
      const link = document.createElement('a');
      link.download = `${cardName.replace(/\s+/g, '_')}_ID.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error downloading card:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
             <CreditCard size={20} />
           </div>
           <h2 className="text-2xl font-black text-slate-900 tracking-tight">My Digital IDs</h2>
        </div>
        <span className="text-sm font-bold px-4 py-1.5 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
          {totalCredentials} Credential{totalCredentials === 1 ? '' : 's'}
        </span>
      </div>
      
      {totalCredentials === 0 ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center shadow-inner">
           <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md mb-4 text-slate-300">
              <Inbox size={32} />
           </div>
           <h3 className="text-xl font-bold text-slate-700">No Digital IDs Found</h3>
           <p className="text-slate-500 max-w-md mt-2 font-medium">You currently do not hold any official society memberships or executive positions. Apply for memberships to unlock your digital ID cards.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* 1. Cabinet Member Card */}
          {normalizedUser.is_cabinet_member && (() => {
            const cabinetMembership = memberships.find(m => m.society_name === normalizedUser.cabinet_society_name) || memberships[0];
            const assignedCabinetId = cabinetMembership?.membership_id 
              || (normalizedUser.roll_number && normalizedUser.roll_number !== 'N/A' 
                  ? `CAB-${normalizedUser.cabinet_society_name ? normalizedUser.cabinet_society_name.split(' ').map(w => w[0]).join('').toUpperCase() : 'DSMS'}-${normalizedUser.roll_number}`
                  : 'CAB-EXEC-2026-001');
            const cabinetQrCode = cabinetMembership?.card_qr_code || cabinetMembership?.membership_id || normalizedUser.roll_number || 'valid';

            return (
            <div className="group relative h-full">
              <div 
                id="executive-card" 
                className="relative bg-gradient-to-br from-[#080d1a] via-[#0f172a] to-[#050811] text-white rounded-[30px] p-6 sm:p-7 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_30px_rgba(245,158,11,0.12)] border border-amber-500/40 hover:border-amber-400/70 transition-all duration-300 overflow-hidden group w-full min-h-[420px] flex flex-col justify-between"
              >
                {/* Precision Inner Highlight Ring */}
                <div className="absolute inset-0 rounded-[30px] ring-1 ring-inset ring-amber-400/20 pointer-events-none" />

                {/* Holographic Mesh & Ambient Glow Accents */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-500/15 via-indigo-600/10 to-transparent rounded-full blur-3xl pointer-events-none -mr-24 -mt-24"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-cyan-500/10 via-emerald-500/10 to-transparent rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

                {/* Micro Guilloche / Geometric Security Watermark Pattern */}
                <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="sec-grid-cab" width="36" height="36" patternUnits="userSpaceOnUse">
                      <path d="M 36 0 L 0 36 M 0 0 L 36 36" fill="none" stroke="#fbbf24" strokeWidth="0.75" />
                      <circle cx="18" cy="18" r="9" fill="none" stroke="#38bdf8" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#sec-grid-cab)" />
                </svg>

                {/* Top University & Executive Branding Bar */}
                <div className="flex items-start justify-between border-b border-amber-500/25 pb-4 mb-4 relative z-10">
                  <div className="flex items-center gap-3.5">
                    {/* Society Logo with Dual Metallic Frame */}
                    <div className="relative shrink-0">
                      <div className="p-0.5 rounded-2xl bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 shadow-md">
                        {(normalizedUser.cabinet_society_logo || currentUser.society_logo || cabinetMembership?.society_logo) ? (
                          <MediaImage 
                            src={normalizedUser.cabinet_society_logo || currentUser.society_logo || cabinetMembership?.society_logo} 
                            alt="Society Logo"
                            className="w-14 h-14 sm:w-15 sm:h-15 rounded-[14px] object-cover shadow-inner bg-slate-950"
                            crossOrigin="anonymous"
                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                          />
                        ) : null}
                        <div className={`w-14 h-14 sm:w-15 sm:h-15 rounded-[14px] bg-gradient-to-br from-indigo-950 to-slate-900 text-amber-300 items-center justify-center font-black text-sm shadow-inner ${(normalizedUser.cabinet_society_logo || currentUser.society_logo || cabinetMembership?.society_logo) ? 'hidden' : 'flex'}`}>
                          {normalizedUser.cabinet_society_name?.substring(0, 2).toUpperCase() || 'DS'}
                        </div>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[8px] font-black uppercase tracking-[0.22em] text-slate-300 block leading-none">
                          The Islamia University of Bahawalpur
                        </span>
                      </div>
                      
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-gradient-to-r from-amber-400/20 via-yellow-400/10 to-amber-400/20 border border-amber-400/50 shadow-[0_0_12px_rgba(251,191,36,0.18)] mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-amber-300">
                          Cabinet Member ID
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-black text-white tracking-tight leading-tight truncate drop-shadow-sm">
                        {normalizedUser.cabinet_society_name}
                      </h3>
                    </div>
                  </div>

                  {/* Top-Right: Real Assigned ID & Gold Microchip Graphic */}
                  <div className="text-right flex flex-col items-end shrink-0 pl-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-9 h-6 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 p-[1.5px] shadow-sm border border-amber-300/80 relative overflow-hidden">
                        <div className="w-full h-full border border-amber-800/40 rounded-[2px] grid grid-cols-2 grid-rows-2 gap-[1px] p-[1px]">
                          <div className="border border-amber-800/20 bg-amber-300/30" />
                          <div className="border border-amber-800/20 bg-amber-300/30" />
                          <div className="border border-amber-800/20 bg-amber-300/30" />
                          <div className="border border-amber-800/20 bg-amber-300/30" />
                        </div>
                      </div>
                    </div>
                    <span className="text-[8px] font-mono font-bold tracking-widest text-slate-400 block uppercase">
                      ASSIGNED ID
                    </span>
                    <span className="text-xs sm:text-[13px] font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 tracking-wider">
                      {assignedCabinetId}
                    </span>
                  </div>
                </div>

                {/* Middle: Prominent Member Portrait, Full Details & Large Clear QR */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 my-2 relative z-10">
                  {/* Big Prominent Portrait */}
                  <div className="relative shrink-0">
                    <div className="p-1 rounded-2xl bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 shadow-xl">
                      <div className="w-28 sm:w-32 h-34 sm:h-38 rounded-[14px] overflow-hidden bg-slate-950 border border-black/50 flex-shrink-0">
                        {normalizedUser.avatar ? (
                          <MediaImage 
                            src={normalizedUser.avatar} 
                            alt={normalizedUser.name} 
                            className="w-full h-full object-cover" 
                            crossOrigin="anonymous" 
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-900">
                            <Award size={36} className="text-amber-500/60 mb-1" />
                            <span className="text-[8px] font-mono uppercase text-slate-400">Photo ID</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Authenticity Verified Pin */}
                    <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-black text-[8px] uppercase tracking-wider shadow-md border-2 border-slate-950 flex items-center gap-0.5">
                      <ShieldCheck size={10} strokeWidth={3} />
                      <span>OFFICIAL</span>
                    </div>
                  </div>

                  {/* Academic & Member Credentials */}
                  <div className="space-y-1.5 min-w-0 flex-1 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                      <h4 className="text-lg sm:text-xl font-black text-white tracking-tight truncate drop-shadow-sm">
                        {normalizedUser.name}
                      </h4>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.25)] shrink-0">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                        </span>
                        ACTIVE
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-indigo-200 to-amber-300">
                      {normalizedUser.cabinet_role}
                    </p>

                    <div className="pt-1 space-y-1 text-xs">
                      <div className="inline-block px-2.5 py-0.5 rounded-md bg-amber-400/10 border border-amber-400/30">
                        <span className="font-mono text-amber-300 font-bold text-xs tracking-wide">
                          Roll No: {normalizedUser.roll_number}
                        </span>
                      </div>
                      <p className="text-[11px] leading-snug text-slate-100 font-bold">
                        {normalizedUser.program}
                      </p>
                      <p className="text-[10px] leading-tight text-slate-300">
                        {normalizedUser.department}
                      </p>
                      <p className="text-[9px] leading-tight text-slate-400 uppercase font-black tracking-wider">
                        {normalizedUser.faculty}
                      </p>
                    </div>
                  </div>

                  {/* Big Clear High-Contrast QR Code */}
                  <div className="hidden sm:flex flex-col items-center justify-center p-3 bg-white rounded-2xl shadow-2xl border-2 border-amber-400/40 shrink-0">
                    <span className="text-[7.5px] font-mono font-black uppercase tracking-wider text-slate-500 mb-1">
                      VERIFICATION QR
                    </span>
                    <QRCode 
                      value={`${window.location.origin}/verify/member/${cabinetQrCode}`} 
                      size={88}
                      level="M"
                    />
                    <div className="flex items-center gap-1 mt-1.5 text-[8px] font-black uppercase tracking-wider text-slate-900">
                      <ShieldCheck size={11} className="text-emerald-600 shrink-0" />
                      <span>SCAN TO VERIFY</span>
                    </div>
                  </div>
                </div>

                {/* Bottom: Statutory Authorities & Endorsements */}
                <div className="pt-3 border-t border-amber-500/25 grid grid-cols-2 gap-3 text-xs relative z-10">
                  <div className="bg-slate-950/50 p-2 rounded-xl border border-white/5">
                    <span className="text-[8px] font-black uppercase tracking-[0.16em] text-amber-400/90 block mb-0.5">
                      ISSUED BY PRESIDENT:
                    </span>
                    <span className="text-white font-black truncate block text-xs">
                      {normalizedUser.cabinet_society_president || cabinetMembership?.society_president || 'Muhammad Roshan Ashraf'}
                    </span>
                    <span className="text-[8.5px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                      <CheckCircle size={10} className="text-emerald-400 shrink-0" /> Digitally Signed
                    </span>
                  </div>

                  <div className="text-right bg-slate-950/50 p-2 rounded-xl border border-white/5">
                    <span className="text-[8px] font-black uppercase tracking-[0.16em] text-amber-400/90 block mb-0.5">
                      FACULTY ADVISOR:
                    </span>
                    <span className="text-white font-black truncate block text-xs">
                      {normalizedUser.cabinet_society_advisor || cabinetMembership?.society_advisor || 'Faculty Advisor'}
                    </span>
                    <span className="text-[8.5px] font-mono text-slate-400 flex items-center justify-end gap-1 mt-0.5">
                      <ShieldCheck size={10} className="text-amber-400 shrink-0" /> Official Endorsement
                    </span>
                  </div>
                </div>

                {/* Validity Bar & Click Action */}
                <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400 font-mono relative z-10">
                  <span className="text-slate-400 flex items-center gap-1">
                    Term: Academic Session 2026-2027
                  </span>
                  <button 
                    onClick={() => onCardClick?.({ 
                      is_cabinet_card: true,
                      society_name: normalizedUser.cabinet_society_name,
                      role_title: normalizedUser.cabinet_role,
                      student_name: normalizedUser.name,
                      student_roll_number: normalizedUser.roll_number,
                      membership_id: assignedCabinetId,
                      society_president: normalizedUser.cabinet_society_president || cabinetMembership?.society_president,
                      society_advisor: normalizedUser.cabinet_society_advisor || cabinetMembership?.society_advisor,
                      card_qr_code: cabinetQrCode,
                      ...normalizedUser 
                    })} 
                    className="text-amber-300 font-bold hover:text-amber-200 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    Click to Expand Full Credential →
                  </button>
                </div>
              </div>
              
              {/* Premium Download Action Pill */}
              <button 
                onClick={() => handleDownload('executive-card', `${normalizedUser.cabinet_society_name}_Executive`)}
                className="download-btn absolute -bottom-4 right-6 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 hover:from-amber-300 hover:to-amber-500 px-5 py-2.5 rounded-full font-black text-xs shadow-xl shadow-amber-500/30 flex items-center gap-2 border border-amber-200/90 transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer z-20"
              >
                <Download size={15} className="stroke-[2.5]" /> Download ID
              </button>
            </div>
            );
          })()}

          {/* 2. General Society Membership Card */}
          {activeMemberships.map((membership, idx) => {
            const cardId = `membership-card-${idx}`;
            const assignedMemberId = membership.membership_id || `DSMS-${membership.society_name?.substring(0,4)?.toUpperCase() || 'MEM'}-${normalizedUser.roll_number || idx + 1}`;
            const memberQrCode = membership.card_qr_code || membership.membership_id || membership.id;

            return (
            <div key={membership.id || membership.membership_id} className="group relative h-full">
              <div 
                id={cardId} 
                className="relative bg-gradient-to-br from-[#0c0f17] via-[#161f30] to-[#080b12] rounded-[30px] p-6 sm:p-7 text-amber-400 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_20px_rgba(245,158,11,0.08)] border border-amber-500/35 hover:border-amber-400/60 transition-all duration-300 overflow-hidden group w-full min-h-[420px] flex flex-col justify-between"
              >
                {/* Precision Inner Highlight Ring */}
                <div className="absolute inset-0 rounded-[30px] ring-1 ring-inset ring-amber-400/15 pointer-events-none" />

                {/* Ambient glow */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -ml-16 -mb-16"></div>

                {/* Micro Guilloche Pattern */}
                <svg className="absolute inset-0 w-full h-full opacity-[0.035] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id={`sec-grid-mem-${idx}`} width="32" height="32" patternUnits="userSpaceOnUse">
                      <path d="M 32 0 L 0 32 M 0 0 L 32 32" fill="none" stroke="#fbbf24" strokeWidth="0.75" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill={`url(#sec-grid-mem-${idx})`} />
                </svg>

                {/* Top University Branding Bar */}
                <div className="flex items-start justify-between border-b border-amber-500/20 pb-4 mb-4 relative z-10">
                  <div className="flex items-center gap-3.5">
                    {/* Society Logo with Metallic Frame */}
                    <div className="relative shrink-0">
                      <div className="p-0.5 rounded-2xl bg-gradient-to-b from-amber-400/70 via-amber-600/50 to-amber-700/70 shadow-md">
                        {membership.society_logo ? (
                          <MediaImage 
                            src={membership.society_logo} 
                            alt="Society Logo"
                            className="w-14 h-14 sm:w-15 sm:h-15 rounded-[14px] object-cover shadow-inner bg-slate-950"
                            crossOrigin="anonymous"
                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                          />
                        ) : null}
                        <div className={`w-14 h-14 sm:w-15 sm:h-15 rounded-[14px] bg-slate-900 text-amber-400 items-center justify-center font-black text-sm shadow-inner ${membership.society_logo ? 'hidden' : 'flex'}`}>
                          {membership.society_name?.substring(0, 2).toUpperCase() || 'DS'}
                        </div>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[8px] font-black uppercase tracking-[0.22em] text-slate-300 block leading-none">
                          The Islamia University of Bahawalpur
                        </span>
                      </div>

                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-400/10 border border-amber-400/30 shadow-sm mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-amber-400">
                          Official Member ID
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-black text-white tracking-tight leading-tight truncate drop-shadow-sm">
                        {membership.society_name}
                      </h3>
                    </div>
                  </div>

                  {/* Top-Right: Card Serial ID & Microchip */}
                  <div className="text-right flex flex-col items-end shrink-0 pl-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-9 h-6 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 p-[1.5px] shadow-sm border border-amber-300/60 relative overflow-hidden">
                        <div className="w-full h-full border border-amber-800/30 rounded-[1px] grid grid-cols-2 grid-rows-2 gap-[1px] p-[1px]">
                          <div className="border border-amber-800/20 bg-amber-300/25" />
                          <div className="border border-amber-800/20 bg-amber-300/25" />
                          <div className="border border-amber-800/20 bg-amber-300/25" />
                          <div className="border border-amber-800/20 bg-amber-300/25" />
                        </div>
                      </div>
                    </div>
                    <span className="text-[8px] font-mono font-bold tracking-widest text-amber-500/70 block uppercase">
                      ASSIGNED ID
                    </span>
                    <span className="text-xs sm:text-[13px] font-mono font-black text-amber-400 tracking-wider">
                      {assignedMemberId}
                    </span>
                  </div>
                </div>

                {/* Middle: Prominent Portrait & Details & Large Clear QR */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 my-2 relative z-10">
                  {/* Photo Frame */}
                  <div className="relative shrink-0">
                    <div className="p-1 rounded-2xl bg-gradient-to-b from-amber-400/70 via-slate-700/50 to-amber-500/60 shadow-xl">
                      <div className="w-28 sm:w-32 h-34 sm:h-38 rounded-[14px] overflow-hidden bg-slate-950 border border-black/50 flex-shrink-0">
                        {normalizedUser.avatar ? (
                          <MediaImage 
                            src={normalizedUser.avatar} 
                            alt={normalizedUser.name} 
                            className="w-full h-full object-cover" 
                            crossOrigin="anonymous" 
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-900">
                            <Award size={36} className="text-amber-500/60 mb-1" />
                            <span className="text-[8px] font-mono uppercase text-slate-400">Photo ID</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Member Details */}
                  <div className="space-y-1.5 min-w-0 flex-1 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                      <h4 className="text-lg sm:text-xl font-black text-white tracking-tight truncate drop-shadow-sm">
                        {normalizedUser.name}
                      </h4>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase text-amber-900 bg-amber-400/90 border border-amber-500/30 shrink-0">
                        Active
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm font-bold text-amber-300">
                      {membership.role_title || 'General Member'}
                    </p>

                    <div className="pt-1 space-y-1 text-xs">
                      <div className="inline-block px-2.5 py-0.5 rounded-md bg-amber-400/10 border border-amber-400/30">
                        <span className="font-mono text-amber-200 font-bold text-xs tracking-wide">
                          Roll No: {normalizedUser.roll_number}
                        </span>
                      </div>
                      <p className="text-[11px] leading-snug text-amber-100/90 font-bold">
                        {normalizedUser.program}
                      </p>
                      <p className="text-[10px] leading-tight text-amber-100/70">
                        {normalizedUser.department}
                      </p>
                      <p className="text-[9px] leading-tight text-amber-500/80 uppercase font-black tracking-wider">
                        {normalizedUser.faculty}
                      </p>
                    </div>
                  </div>

                  {/* Big Clear QR Code */}
                  <div className="hidden sm:flex flex-col items-center justify-center p-3 bg-white rounded-2xl shadow-2xl border-2 border-amber-400/40 shrink-0">
                    <span className="text-[7.5px] font-mono font-black uppercase tracking-wider text-slate-500 mb-1">
                      VERIFICATION QR
                    </span>
                    <QRCode 
                      value={`${window.location.origin}/verify/member/${memberQrCode}`} 
                      size={88} 
                      level="M"
                    />
                    <div className="flex items-center gap-1 mt-1.5 text-[8px] font-black uppercase tracking-wider text-slate-900">
                      <ShieldCheck size={11} className="text-amber-800 shrink-0" />
                      <span>SCAN TO VERIFY</span>
                    </div>
                  </div>
                </div>

                {/* Bottom: Statutory Authorities & Endorsements */}
                <div className="pt-3 border-t border-amber-500/20 grid grid-cols-2 gap-3 text-xs relative z-10">
                  <div className="bg-slate-950/50 p-2 rounded-xl border border-white/5">
                    <span className="text-[8px] font-black uppercase tracking-[0.16em] text-amber-500/80 block mb-0.5">
                      ISSUED BY PRESIDENT:
                    </span>
                    <span className="text-amber-100 font-black truncate block text-xs">
                      {membership.society_president || 'Society President'}
                    </span>
                  </div>

                  <div className="text-right bg-slate-950/50 p-2 rounded-xl border border-white/5">
                    <span className="text-[8px] font-black uppercase tracking-[0.16em] text-amber-500/80 block mb-0.5">
                      FACULTY ADVISOR:
                    </span>
                    <span className="text-amber-100 font-black truncate block text-xs">
                      {membership.society_advisor || 'Faculty Advisor'}
                    </span>
                  </div>
                </div>

                {/* Validity Bar */}
                <div className="mt-2.5 pt-2 border-t border-amber-500/20 flex items-center justify-between text-[10px] text-amber-500/70 font-mono relative z-10">
                  <span>Term: Academic Session 2026-2027</span>
                  <button 
                    onClick={() => onCardClick?.({
                      ...membership,
                      membership_id: assignedMemberId,
                      student_name: normalizedUser.name,
                      student_roll_number: normalizedUser.roll_number,
                      card_qr_code: memberQrCode,
                      ...normalizedUser
                    })} 
                    className="text-amber-400 font-bold hover:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    Click to Expand Full Credential →
                  </button>
                </div>
              </div>

              {/* Download Button */}
              <button 
                onClick={() => handleDownload(cardId, membership.society_name)}
                className="download-btn absolute -bottom-4 right-6 bg-amber-400 text-amber-950 hover:bg-amber-300 px-5 py-2.5 rounded-full font-black text-xs shadow-xl flex items-center gap-2 border border-amber-200 transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer z-20"
              >
                <Download size={15} className="stroke-[2.5]" /> Download ID
              </button>
            </div>
          )})}
          
        </div>
      )}
    </div>
  );
};

export default StudentDigitalWallet;
