import React, { useRef } from 'react';
import { ShieldCheck, Download, Fingerprint, Award, CreditCard, Inbox, CheckCircle } from 'lucide-react';
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
      currentUser.is_cabinet_member || 
      currentUser.cabinet_role || 
      currentUser.role === 'president'
    ),
    cabinet_role: currentUser.cabinet_role || (currentUser.role === 'president' ? 'President' : 'Executive Officer'),
    cabinet_society_name: currentUser.cabinet_society_name || currentUser.society_name || 'Departmental Society',
    avatar: currentUser.profile_photo_url || currentUser.avatar_url || null
  };

  const totalCredentials = memberships.length + (normalizedUser.is_cabinet_member ? 1 : 0);

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
          
          {/* 1. Cabinet Member Card (Previously Bottom Card) */}
          {normalizedUser.is_cabinet_member && (
            <div className="group relative h-full">
              <div id="executive-card" className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-700/80 hover:shadow-indigo-500/10 hover:border-indigo-500/50 transition-all duration-300 overflow-hidden group w-full aspect-[1.586/1] flex flex-col justify-between">
                
                {/* Background Hologram pattern accents */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none -ml-12 -mb-12"></div>

                {/* Top University Branding Bar */}
                <div className="flex items-start justify-between border-b border-white/10 pb-4 mb-5 relative z-10">
                  <div className="flex items-center gap-3">
                    {currentUser.society_logo || memberships.find(m => m.society_name === normalizedUser.cabinet_society_name)?.society_logo ? (
                      <img 
                        src={currentUser.society_logo || memberships.find(m => m.society_name === normalizedUser.cabinet_society_name)?.society_logo} 
                        alt="Society Logo"
                        className="w-14 h-14 rounded-xl object-cover shadow-lg border border-white/10"
                        crossOrigin="anonymous"
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                      />
                    ) : null}
                    <div className={`w-14 h-14 rounded-2xl bg-indigo-600 text-white items-center justify-center font-black text-sm shadow-lg shadow-indigo-600/30 ${currentUser.society_logo || memberships.find(m => m.society_name === normalizedUser.cabinet_society_name)?.society_logo ? 'hidden' : 'flex'}`}>
                      {normalizedUser.cabinet_society_name?.substring(0, 2).toUpperCase() || 'DS'}
                    </div>
                    <div>
                      <span className="text-[7px] font-black uppercase tracking-widest text-white/60 block leading-none mb-0.5">
                        The Islamia University of Bahawalpur
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-400 block mb-0.5">
                        Cabinet Member ID
                      </span>
                      <h3 className="text-base font-black text-white leading-tight">
                        {normalizedUser.cabinet_society_name}
                      </h3>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] font-mono font-bold text-slate-400 block">CARD ID</span>
                    <span className="text-xs font-mono font-black text-amber-400">CAB-{normalizedUser.roll_number?.substring(0,4)}-ID</span>
                  </div>
                </div>

                {/* Middle: Student Picture & Comprehensive Academic Info */}
                <div className="flex items-center gap-4 mb-5 relative z-10">
                  <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden border-2 border-indigo-400/40 bg-slate-800 flex-shrink-0 shadow-md">
                    {normalizedUser.avatar ? (
                      <img src={normalizedUser.avatar} alt={normalizedUser.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500"><Award size={32} /></div>
                    )}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-black text-white truncate">
                        {normalizedUser.name}
                      </h4>
                      <span className="text-[9px] font-black uppercase text-emerald-300 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full shrink-0">
                        Active
                      </span>
                    </div>

                    <p className="text-xs font-bold text-indigo-300">
                      {normalizedUser.cabinet_role}
                    </p>

                    <div className="text-[10px] text-slate-300 space-y-0.5 pt-0.5 font-medium">
                      <p className="font-mono text-slate-200">
                        Roll No: {normalizedUser.roll_number}
                      </p>
                      <p className="text-[9.5px] leading-snug text-slate-300 whitespace-normal font-bold">
                        {normalizedUser.program}
                      </p>
                      <p className="text-[9px] leading-tight text-slate-400 whitespace-normal">
                        {normalizedUser.department}
                      </p>
                      <p className="text-[8px] leading-tight text-slate-500 whitespace-normal uppercase font-bold tracking-wider">
                        {normalizedUser.faculty}
                      </p>
                    </div>
                  </div>

                  {/* Verification QR Code */}
                  <div className="hidden sm:flex flex-col items-center justify-center p-2 bg-white rounded-2xl shadow-lg shrink-0">
                    <QRCode value={`${window.location.origin}/verify/member/${memberships.find(m => m.society_name === normalizedUser.cabinet_society_name)?.card_qr_code || memberships[0]?.card_qr_code || 'invalid'}`} size={56} />
                    <span className="text-[8px] font-black uppercase text-slate-800 mt-1">Scan Verify</span>
                  </div>
                </div>

                {/* Bottom: Statutory Authorities & Endorsements */}
                <div className="pt-3.5 border-t border-white/10 grid grid-cols-2 gap-2 text-[10px] relative z-10">
                  <div>
                    <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Issued By President:</span>
                    <span className="text-white font-black truncate block text-[10px]">{memberships[0]?.society_president || 'Muhammad Roshan Ashraf'}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Faculty Advisor:</span>
                    <span className="text-white font-black truncate block text-[10px]">{memberships[0]?.society_advisor || 'Dr. Sarah Ahmed'}</span>
                  </div>
                </div>

                {/* Validity Bar */}
                <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[9px] text-slate-400 font-mono relative z-10">
                  <span>Term: Academic Session 2026-2027</span>
                  <button 
                    onClick={() => onCardClick?.({ 
                      is_cabinet_card: true,
                      society_name: normalizedUser.cabinet_society_name,
                      role_title: normalizedUser.cabinet_role,
                      student_name: normalizedUser.name,
                      student_roll_number: normalizedUser.roll_number,
                      society_president: memberships[0]?.society_president,
                      society_advisor: memberships[0]?.society_advisor,
                      card_qr_code: memberships.find(m => m.society_name === normalizedUser.cabinet_society_name)?.card_qr_code || memberships[0]?.card_qr_code,
                      ...normalizedUser 
                    })} 
                    className="text-indigo-300 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Click to Expand Full Credential →
                  </button>
                </div>
              </div>
              
              {/* Download Button */}
              <button 
                onClick={() => handleDownload('executive-card', `${normalizedUser.cabinet_society_name}_Executive`)}
                className="download-btn absolute -bottom-4 right-6 bg-indigo-600 text-white hover:bg-indigo-500 px-4 py-2 rounded-full font-bold text-xs shadow-xl flex items-center gap-2 border border-indigo-400 transition-transform transform hover:scale-105 z-20"
              >
                <Download size={14} /> Download ID
              </button>
            </div>
          )}

          {/* 2. General Society Membership Card (Previously Amber/Gold Executive Card) */}
          {memberships.map((membership, idx) => {
            const cardId = `membership-card-${idx}`;
            return (
            <div key={membership.id || membership.membership_id} className="group relative h-full">
              <div id={cardId} className="bg-gradient-to-br from-slate-900 via-slate-800 to-black rounded-3xl p-7 text-amber-400 shadow-2xl relative overflow-hidden transition-all duration-300 transform group-hover:-translate-y-1 group-hover:shadow-amber-500/20 border border-amber-500/30 w-full aspect-[1.586/1] flex flex-col justify-between">
                
                {/* Holographic overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-400/5 via-transparent to-amber-200/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                
                {/* Background Pattern */}
                <div className="absolute -right-16 -top-16 opacity-10 pointer-events-none text-amber-500">
                   <Award size={250} strokeWidth={1} />
                </div>

                {/* Top University Branding Bar */}
                <div className="flex items-start justify-between border-b border-amber-500/20 pb-4 mb-5 relative z-10">
                  <div className="flex items-center gap-3">
                    {membership.society_logo ? (
                      <img 
                        src={membership.society_logo} 
                        alt="Society Logo"
                        className="w-14 h-14 rounded-xl object-cover drop-shadow-md border border-amber-500/30 bg-black/20"
                        crossOrigin="anonymous"
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                      />
                    ) : null}
                    <div className={`w-14 h-14 rounded-xl bg-amber-500/20 text-amber-400 items-center justify-center font-black text-sm border border-amber-500/30 ${membership.society_logo ? 'hidden' : 'flex'}`}>
                      {membership.society_name?.substring(0, 2).toUpperCase() || 'DS'}
                    </div>
                    <div>
                      <span className="text-[7px] font-black uppercase tracking-widest text-white/60 block leading-none mb-0.5">
                        The Islamia University of Bahawalpur
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-amber-500 block mb-0.5">
                        Official Member ID
                      </span>
                      <h3 className="text-base font-black text-white leading-tight">
                        {membership.society_name}
                      </h3>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] font-mono font-bold text-amber-500/70 block">CARD ID</span>
                    <span className="text-xs font-mono font-black text-amber-400">MEM-{normalizedUser.roll_number?.substring(0,4)}-{idx}</span>
                  </div>
                </div>

                {/* Middle: Student Picture & Comprehensive Academic Info */}
                <div className="flex items-center gap-4 mb-5 relative z-10">
                  <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden border-2 border-amber-400/40 bg-slate-800 flex-shrink-0 shadow-md">
                    {normalizedUser.avatar ? (
                      <img src={normalizedUser.avatar} alt={normalizedUser.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500"><Award size={32} /></div>
                    )}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-black text-white truncate">
                        {normalizedUser.name}
                      </h4>
                      <span className="text-[9px] font-black uppercase text-amber-900 bg-amber-400/90 border border-amber-500/30 px-2 py-0.5 rounded-full shrink-0">
                        Active
                      </span>
                    </div>

                    <p className="text-xs font-bold text-amber-300">
                      General Member
                    </p>

                    <div className="text-[10px] text-slate-300 space-y-0.5 pt-0.5 font-medium">
                      <p className="font-mono text-slate-200">
                        Roll No: {normalizedUser.roll_number}
                      </p>
                      <p className="text-[9.5px] leading-snug text-amber-100/90 whitespace-normal font-bold">
                        {normalizedUser.program}
                      </p>
                      <p className="text-[9px] leading-tight text-amber-100/70 whitespace-normal">
                        {normalizedUser.department}
                      </p>
                      <p className="text-[8px] leading-tight text-amber-500/80 whitespace-normal uppercase font-bold tracking-wider">
                        {normalizedUser.faculty}
                      </p>
                    </div>
                  </div>

                  {/* Verification QR Code */}
                  <div className="hidden sm:flex flex-col items-center justify-center p-2 bg-amber-100 rounded-2xl shadow-lg shrink-0">
                    <QRCode value={`${window.location.origin}/verify/member/${membership.card_qr_code || membership.membership_id || membership.id}`} size={56} fgColor="#451a03" bgColor="transparent" />
                    <span className="text-[8px] font-black uppercase text-amber-900 mt-1">Scan Verify</span>
                  </div>
                </div>

                {/* Bottom: Statutory Authorities & Endorsements */}
                <div className="pt-3.5 border-t border-amber-500/20 grid grid-cols-2 gap-2 text-[10px] relative z-10">
                  <div>
                    <span className="text-[8px] font-bold uppercase tracking-wider text-amber-500/70 block mb-0.5">Issued By President:</span>
                    <span className="text-amber-100 font-black truncate block text-[10px]">{membership.society_president || 'Muhammad Roshan Ashraf'}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[8px] font-bold uppercase tracking-wider text-amber-500/70 block mb-0.5">Faculty Advisor:</span>
                    <span className="text-amber-100 font-black truncate block text-[10px]">{membership.society_advisor || 'Dr. Sarah Ahmed'}</span>
                  </div>
                </div>

                {/* Validity Bar */}
                <div className="mt-3 pt-2 border-t border-amber-500/20 flex items-center justify-between text-[9px] text-amber-500/70 font-mono relative z-10">
                  <span>Term: Academic Session 2026-2027</span>
                  <button onClick={() => onCardClick?.(membership)} className="text-amber-400 font-bold hover:underline flex items-center gap-1 cursor-pointer">
                    Click to Expand Full Credential →
                  </button>
                </div>
              </div>

              {/* Download Button */}
              <button 
                onClick={() => handleDownload(cardId, membership.society_name)}
                className="download-btn absolute -bottom-4 right-6 bg-amber-400 text-amber-950 hover:bg-amber-300 px-4 py-2 rounded-full font-bold text-xs shadow-xl flex items-center gap-2 border border-amber-200 transition-transform transform hover:scale-105 z-20"
              >
                <Download size={14} /> Download ID
              </button>
            </div>
          )})}
          
        </div>
      )}
    </div>
  );
};

export default StudentDigitalWallet;
