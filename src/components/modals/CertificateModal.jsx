import { MediaImage, MediaLink } from '../common/AuthenticatedMedia';
import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { Award, Download, Printer, ExternalLink, X, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { downloadCertificatePDF, downloadCertificatePNG } from '../../utils/certificateDownloader';
import { IUBLogoEmblem, getSocietyCertificateTheme } from '../../utils/societyCertificateThemes';

const CertificateModal = ({ certificate, studentName, onClose }) => {
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [downloadingPNG, setDownloadingPNG] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState('');

  if (!certificate) return null;

  const recipient = studentName || certificate.student_name || 'Campus Student';
  const rollNumber = certificate.student_roll_number || '';
  const department = certificate.student_department || '';
  const eventTitle = certificate.event_title || 'Campus Society Event';
  const societyName = certificate.society_name || 'University Departmental Society';
  const societyId = certificate.society_id;
  const societyLogo = certificate.society_logo;
  const verificationCode = certificate.verification_code || '00000000-0000-0000-0000-000000000000';
  const issueDate = certificate.issued_at 
    ? new Date(certificate.issued_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  // Dedicated, non-identical theme mapped specifically for this society
  const theme = getSocietyCertificateTheme(societyId, societyName);

  // Dynamic layout & signatories from template
  const layout = certificate.template_layout || {};
  const certMainTitle = layout.title || 'Certificate of Merit & Completion';
  const certSubtitle = layout.subtitle || 'The Islamia University of Bahawalpur • Student Directorate';
  const certBodyText = layout.body_text || 'has actively participated in, completed all practical evaluation requirements, and demonstrated distinction in';
  const primaryTheme = layout.theme_color || theme.primaryColor;
  const advisorTitle = layout.signatory_title_left || 'Faculty Advisor';
  const presidentTitle = layout.signatory_title_right || 'Society President';

  const advisorName = certificate.advisor_name || 'Faculty Advisor';
  const advisorSignature = certificate.advisor_signature || null;
  const presidentName = certificate.president_name || 'Society President';
  const presidentSignature = certificate.president_signature || null;

  const verifyUrl = `${window.location.origin}/verify?code=${verificationCode}`;
  const filename = `Certificate_${recipient.replace(/\s+/g, '_')}_${societyName.replace(/\s+/g, '_')}`;

  const handleDownloadPDF = async () => {
    try {
      setDownloadingPDF(true);
      await downloadCertificatePDF('printable-certificate-document', filename);
      setDownloadSuccess('PDF Certificate downloaded successfully!');
      setTimeout(() => setDownloadSuccess(''), 3000);
    } catch (err) {
      alert('Could not generate PDF. Please try the Print option.');
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleDownloadPNG = async () => {
    try {
      setDownloadingPNG(true);
      await downloadCertificatePNG('printable-certificate-document', filename);
      setDownloadSuccess('High-resolution PNG image downloaded!');
      setTimeout(() => setDownloadSuccess(''), 3000);
    } catch (err) {
      alert('Could not export PNG.');
    } finally {
      setDownloadingPNG(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:absolute print:inset-0 print:p-0 print:bg-white print:block print:overflow-visible modal-print-wrapper">
      <div className="bg-white rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl relative my-auto border border-slate-200 print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none modal-print-container">
        
        {/* HEADER CONTROLS */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 print:hidden">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                <ShieldCheck size={12} /> Cryptographically Verified Record
              </span>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                <Sparkles size={11} className="text-amber-500" /> {theme.name}
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900 mt-1">Official Society Certificate</h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={downloadingPDF}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition cursor-pointer disabled:opacity-50"
            >
              <Download size={14} />
              {downloadingPDF ? 'Generating PDF...' : 'Download PDF'}
            </button>

            <button
              onClick={handleDownloadPNG}
              disabled={downloadingPNG}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <Download size={14} />
              {downloadingPNG ? 'Saving...' : 'Save PNG'}
            </button>

            <button
              onClick={() => window.print()}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer size={14} /> Print
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {downloadSuccess && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in print:hidden">
            <CheckCircle2 size={15} className="text-emerald-600" />
            {downloadSuccess}
          </div>
        )}

        {/* CERTIFICATE CANVAS FOR PDF & VIEW */}
        <div className="mt-6 p-2 sm:p-4 bg-slate-50/50 rounded-2xl border border-slate-100 overflow-x-auto print:p-0 print:m-0 print:border-none print:bg-white print:overflow-visible">
          <div
            id="printable-certificate-document"
            className="w-[840px] min-w-[840px] h-[585px] mx-auto bg-white p-6 sm:p-7 relative flex flex-col justify-between text-center select-none shadow-sm certificate-print-document print:shadow-none"
            style={{
              border: theme.outerBorder,
              backgroundImage: theme.bgPattern,
              backgroundSize: theme.bgPatternSize,
              backgroundPosition: '0 0, 14px 14px'
            }}
          >
            {/* THEME INNER BORDER */}
            <div 
              className="absolute inset-2 pointer-events-none" 
              style={{ border: theme.innerBorder }}
            />

            {/* THEME UNIQUE CORNER ORNAMENTS */}
            {theme.cornerRenderer && theme.cornerRenderer()}

            {/* TOP HEADER: TWIN LOGOS (IUB LOGO & SOCIETY LOGO) */}
            <div className="relative z-10 pt-1 px-3 flex items-center justify-between">
              {/* LEFT: ISLAMIA UNIVERSITY OF BAHAWALPUR OFFICIAL LOGO */}
              <div className="flex items-center gap-2.5 text-left w-52 shrink-0">
                <IUBLogoEmblem size={56} />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-950 leading-tight">
                    The Islamia University
                  </span>
                  <span className="text-[9px] font-bold text-amber-700 tracking-wider">
                    of Bahawalpur
                  </span>
                  <span className="text-[8px] font-medium text-slate-400">
                    Estd. 1925 • Main Campus
                  </span>
                </div>
              </div>

              {/* CENTER: TITLES & SOCIETY BADGE */}
              <div className="flex-1 px-2 text-center">
                <span 
                  className="inline-block text-[9px] font-black uppercase tracking-[0.2em] px-3 py-0.5 rounded-full border shadow-xs mb-1"
                  style={{ 
                    backgroundColor: `${primaryTheme}12`, 
                    borderColor: `${theme.accentColor}50`,
                    color: primaryTheme 
                  }}
                >
                  {societyName}
                </span>
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  {certSubtitle}
                </h4>
                <h2 
                  className="text-2xl font-black uppercase tracking-[0.12em] font-serif mt-0.5 leading-tight"
                  style={{ color: primaryTheme }}
                >
                  {certMainTitle}
                </h2>
              </div>

              {/* RIGHT: SOCIETY OFFICIAL LOGO */}
              <div className="flex items-center justify-end gap-2.5 text-right w-52 shrink-0">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-800 leading-tight line-clamp-1 max-w-[130px]">
                    {societyName}
                  </span>
                  <span 
                    className="text-[8px] font-bold uppercase tracking-widest"
                    style={{ color: theme.accentColor }}
                  >
                    Society Seal
                  </span>
                  <span className="text-[8px] font-mono text-slate-400">
                    DSMS Verified
                  </span>
                </div>
                {societyLogo ? (
                  <div className="w-14 h-14 rounded-xl border border-slate-200 bg-white shadow-xs p-1 flex items-center justify-center shrink-0">
                    <MediaImage 
                      src={societyLogo} 
                      alt={societyName} 
                      className="w-full h-full object-contain rounded-lg" 
                    />
                  </div>
                ) : (
                  <div 
                    className="w-14 h-14 rounded-xl border-2 shadow-xs flex flex-col items-center justify-center shrink-0 text-white font-black"
                    style={{ 
                      backgroundColor: primaryTheme,
                      borderColor: theme.accentColor 
                    }}
                  >
                    <Award size={22} className="text-amber-300" />
                    <span className="text-[8px] uppercase tracking-tighter font-mono mt-0.5">
                      {societyName.split(' ').map(w => w[0]).filter(Boolean).slice(0, 3).join('') || 'DSMS'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* BODY TEXT */}
            <div className="relative z-10 my-auto py-1 space-y-1">
              <p className="text-[10.5px] uppercase tracking-[0.25em] text-slate-400 font-bold">
                This is proudly presented to
              </p>
              
              <h1 
                className="text-3xl font-black font-serif tracking-tight underline decoration-2 underline-offset-8"
                style={{ 
                  color: '#0f172a',
                  textDecorationColor: theme.secondaryColor || '#d97706' 
                }}
              >
                {recipient}
              </h1>

              {(rollNumber || department) && (
                <p className="text-[11px] font-mono text-slate-500 font-bold pt-0.5">
                  {rollNumber && <span>Roll No: {rollNumber}</span>}
                  {rollNumber && department && <span> • </span>}
                  {department && <span>Dept: {department}</span>}
                </p>
              )}

              <p className="text-xs text-slate-600 max-w-xl mx-auto leading-relaxed pt-1 font-medium">
                {certBodyText}
              </p>

              <h3 
                className="text-lg font-black tracking-tight"
                style={{ color: primaryTheme }}
              >
                {eventTitle}
              </h3>

              <p className="text-xs font-semibold text-slate-700">
                Organized under the auspices of <strong className="font-black text-slate-900">{societyName}</strong>
              </p>
            </div>

            {/* FOOTER & VERIFICATION DETAILS */}
            <div className="relative z-10 pt-3 border-t border-slate-200/80 grid grid-cols-3 items-end px-3">
              {/* FACULTY ADVISOR SIGNATURE */}
              <div className="text-left space-y-1">
                <div className="h-10 flex items-end">
                  {advisorSignature ? (
                    <MediaImage src={advisorSignature} alt="Advisor signature" className="h-9 max-w-[130px] object-contain" />
                  ) : (
                    <div className="font-serif italic text-sm text-slate-900 font-bold">
                      {advisorName}
                    </div>
                  )}
                </div>
                <div className="w-36 h-0.5 bg-slate-400"></div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                  {advisorName}
                </p>
                <p className="text-[9px] text-slate-500 font-semibold uppercase">{advisorTitle}</p>
              </div>

              {/* VERIFICATION EMBLEM & QR CODE */}
              <div className="flex flex-col items-center justify-center">
                <div className="p-1.5 bg-white border border-slate-200 rounded-xl shadow-xs">
                  <QRCode value={verifyUrl} size={58} />
                </div>
                <span className="text-[8.5px] font-mono text-slate-400 mt-1">
                  ID: {verificationCode.substring(0, 13)}...
                </span>
                <span className="text-[8.5px] font-bold text-emerald-700 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                  ✓ Verified Authentic
                </span>
              </div>

              {/* PRESIDENT SIGNATURE */}
              <div className="text-right space-y-1">
                <div className="h-10 flex items-end justify-end">
                  {presidentSignature ? (
                    <MediaImage src={presidentSignature} alt="President signature" className="h-9 max-w-[130px] object-contain ml-auto" />
                  ) : (
                    <div className="font-serif italic text-sm text-slate-900 font-bold">
                      {presidentName}
                    </div>
                  )}
                </div>
                <div className="w-36 h-0.5 bg-slate-400 ml-auto"></div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                  {presidentName}
                </p>
                <p className="text-[9px] text-slate-500 font-semibold uppercase">{presidentTitle}</p>
              </div>
            </div>

          </div>
        </div>

        {/* VERIFICATION LINK FOOTER */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span className="font-mono text-[11px] text-slate-400">
            Hash: {verificationCode}
          </span>
          <MediaLink
            href={`/verify?code=${verificationCode}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
          >
            <ExternalLink size={12} /> Open Verification Link
          </MediaLink>
        </div>

      </div>
    </div>
  );
};

export default CertificateModal;
