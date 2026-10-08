import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { Award, Download, Printer, ExternalLink, X, CheckCircle2, ShieldCheck } from 'lucide-react';
import { downloadCertificatePDF, downloadCertificatePNG } from '../../utils/certificateDownloader';

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
  const verificationCode = certificate.verification_code || '00000000-0000-0000-0000-000000000000';
  const issueDate = certificate.issued_at 
    ? new Date(certificate.issued_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  // Dynamic layout & signatories
  const layout = certificate.template_layout || {};
  const certMainTitle = layout.title || 'Certificate of Merit & Completion';
  const certSubtitle = layout.subtitle || 'Digital Society Management System • Campus Network';
  const certBodyText = layout.body_text || 'has actively participated in, completed all practical evaluation requirements, and demonstrated excellence in';
  const primaryTheme = layout.theme_color || '#1e1b4b';
  const advisorTitle = layout.signatory_title_left || 'Faculty Advisor';
  const presidentTitle = layout.signatory_title_right || 'Society President';

  const advisorName = certificate.advisor_name || 'Faculty Advisor';
  const advisorSignature = certificate.advisor_signature || null;
  const presidentName = certificate.president_name || 'Society President';
  const presidentSignature = certificate.president_signature || null;

  const verifyUrl = `${window.location.origin}/verify?code=${verificationCode}`;
  const filename = `Certificate_${recipient.replace(/\s+/g, '_')}_${eventTitle.replace(/\s+/g, '_')}`;

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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl relative my-auto border border-slate-200">
        
        {/* HEADER CONTROLS */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1">
              <ShieldCheck size={12} /> Cryptographically Verified Record
            </span>
            <h3 className="text-lg font-black text-slate-900 mt-1">Official Digital Certificate</h3>
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
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 size={15} className="text-emerald-600" />
            {downloadSuccess}
          </div>
        )}

        {/* CERTIFICATE CANVAS FOR PDF & VIEW */}
        <div className="mt-6 p-2 sm:p-4 bg-slate-50/50 rounded-2xl border border-slate-100 overflow-x-auto">
          <div
            id="printable-certificate-document"
            className="w-[800px] min-w-[800px] h-[560px] mx-auto bg-white p-8 relative flex flex-col justify-between text-center select-none shadow-sm"
            style={{
              border: `12px double ${primaryTheme}`,
              backgroundImage: 'radial-gradient(#e0e7ff 0.75px, transparent 0.75px), radial-gradient(#e0e7ff 0.75px, #ffffff 0.75px)',
              backgroundSize: '30px 30px',
              backgroundPosition: '0 0, 15px 15px'
            }}
          >
            {/* INNER GOLD BORDER */}
            <div className="absolute inset-2 border-2 border-amber-500/50 pointer-events-none"></div>

            {/* TOP HEADER */}
            <div className="relative z-10 pt-2">
              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto shadow-md border-2 border-amber-400/80 text-amber-300"
                style={{ backgroundColor: primaryTheme }}
              >
                <Award size={32} />
              </div>
              <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-800 mt-2">
                {certSubtitle}
              </h4>
              <h2 className="text-2xl font-black uppercase tracking-[0.15em] text-slate-900 mt-1 font-serif">
                {certMainTitle}
              </h2>
            </div>

            {/* BODY TEXT */}
            <div className="relative z-10 my-auto py-2 space-y-1.5">
              <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
                This is to officially certify that
              </p>
              
              <h1 className="text-3xl font-black text-slate-900 font-serif tracking-tight underline decoration-amber-500 decoration-2 underline-offset-8">
                {recipient}
              </h1>

              {(rollNumber || department) && (
                <p className="text-[11px] font-mono text-slate-500 font-bold">
                  {rollNumber && <span>Roll No: {rollNumber}</span>}
                  {rollNumber && department && <span> • </span>}
                  {department && <span>Dept: {department}</span>}
                </p>
              )}

              <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed pt-1">
                {certBodyText}
              </p>

              <h3 className="text-xl font-black font-sans tracking-tight" style={{ color: primaryTheme }}>
                {eventTitle}
              </h3>

              <p className="text-xs font-bold text-slate-700">
                Organized and certified by the <strong className="text-slate-900">{societyName}</strong>
              </p>
            </div>

            {/* FOOTER & VERIFICATION DETAILS */}
            <div className="relative z-10 pt-4 border-t border-slate-200/80 grid grid-cols-3 items-end">
              {/* FACULTY ADVISOR SIGNATURE */}
              <div className="text-left space-y-1">
                <div className="h-10 flex items-end">
                  {advisorSignature ? (
                    <img src={advisorSignature} alt="Advisor signature" className="h-9 max-w-[130px] object-contain" />
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
                <div className="p-1.5 bg-white border border-slate-200 rounded-xl shadow-sm">
                  <QRCode value={verifyUrl} size={64} />
                </div>
                <span className="text-[9px] font-mono text-slate-400 mt-1">
                  ID: {verificationCode.substring(0, 13)}...
                </span>
                <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-widest mt-0.5">
                  ✓ Verified Authentic
                </span>
              </div>

              {/* PRESIDENT SIGNATURE */}
              <div className="text-right space-y-1">
                <div className="h-10 flex items-end justify-end">
                  {presidentSignature ? (
                    <img src={presidentSignature} alt="President signature" className="h-9 max-w-[130px] object-contain ml-auto" />
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
          <a
            href={`/verify?code=${verificationCode}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
          >
            <ExternalLink size={12} /> Open Verification Link
          </a>
        </div>

      </div>
    </div>
  );
};

export default CertificateModal;
