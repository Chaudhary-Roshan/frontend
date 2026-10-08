import React, { useState } from 'react';
import { 
  Printer, Download, UploadCloud, CheckCircle2, AlertTriangle, 
  XCircle, Clock, ShieldCheck, FileText, ChevronRight, Eye, 
  ExternalLink, Check, Calendar, MapPin, DollarSign, Users, Award, X
} from 'lucide-react';
import api from '../../utils/api';
import { getMediaUrl } from '../../utils/media';

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-700 border-slate-300' },
  generated: { label: 'Generated', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  downloaded: { label: 'Downloaded / Awaiting Physical Signature', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  signed_uploaded: { label: 'Signed Document Uploaded / Pending Verification', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  approved: { label: 'Approved & Sanctioned', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  returned: { label: 'Returned for Correction', color: 'bg-rose-100 text-rose-800 border-rose-300' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800 border-red-300' },
  archived: { label: 'Archived Record', color: 'bg-purple-100 text-purple-800 border-purple-300' },
};

const WORKFLOW_STEPS = [
  { key: 'draft', label: 'Draft' },
  { key: 'generated', label: 'Generated' },
  { key: 'downloaded', label: 'Downloaded' },
  { key: 'awaiting_signature', label: 'Awaiting Physical Signature' },
  { key: 'signed_uploaded', label: 'Signed Doc Uploaded' },
  { key: 'pending_verification', label: 'Pending Verification' },
  { key: 'approved', label: 'Approved' },
  { key: 'archived', label: 'Archived' },
];

export default function EventProposalDocumentModal({ 
  proposal, 
  currentUser, 
  onClose, 
  onProposalUpdated 
}) {
  const [activeTab, setActiveTab] = useState('document'); // 'document' | 'verification' | 'history'
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState(null);

  // Signed document upload state
  const [uploadFile, setUploadFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Verification Checklist State (Advisor / Office)
  const [checklist, setChecklist] = useState({
    correct_proposal_no: true,
    complete_pages: true,
    visible_signature: true,
    correct_event_info: true,
    no_unauthorized_changes: true
  });
  const [officialRemarks, setOfficialRemarks] = useState(proposal.official_remarks || '');
  const [rejectionReason, setRejectionReason] = useState(proposal.rejection_reason || '');
  const [advisorComments, setAdvisorComments] = useState(proposal.advisor_comments || '');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const getStepIndex = (status) => {
    switch (status) {
      case 'draft': return 0;
      case 'generated': return 1;
      case 'downloaded': return 2;
      case 'awaiting_signature': return 3;
      case 'signed_uploaded': return 4;
      case 'pending_verification': return 5;
      case 'approved': return 6;
      case 'archived': return 6;
      default: return 1;
    }
  };

  const currentStep = getStepIndex(proposal.status);

  // Handler: Print / Download PDF
  const handlePrintAndDownload = async () => {
    try {
      setIsProcessing(true);
      if (['draft', 'generated'].includes(proposal.status)) {
        const res = await api.post(`proposals/${proposal.id}/mark_downloaded/`);
        if (onProposalUpdated) onProposalUpdated(res.data);
      }
      showToast("Preparing official proposal PDF. Use Print Dialog to Save as PDF.", "info");
      window.print();
    } catch (err) {
      console.error(err);
      window.print();
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler: Upload Signed Proposal Scan
  const handleUploadSignedFile = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      showToast("Please choose a scanned PDF or image file first.", "error");
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', uploadFile);

      const res = await api.post(`proposals/${proposal.id}/upload_signed_doc/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast("Signed document uploaded successfully! Status changed to 'Signed Document Uploaded'.");
      setUploadFile(null);
      if (onProposalUpdated) onProposalUpdated(res.data);
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to upload signed document.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  // Handler: Advisor Endorsement
  const handleAdvisorReview = async (decision) => {
    try {
      setIsProcessing(true);
      const res = await api.post(`proposals/${proposal.id}/advisor_review/`, {
        decision,
        advisor_comments: advisorComments
      });
      showToast(`Advisor decision recorded: ${decision.toUpperCase()}`);
      if (onProposalUpdated) onProposalUpdated(res.data);
    } catch (err) {
      showToast(err.response?.data?.error || "Error recording advisor review.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler: Admin Office Official Verification
  const handleOfficeVerification = async (decision) => {
    if (decision === 'approved') {
      const allChecked = Object.values(checklist).every(Boolean);
      if (!allChecked) {
        showToast("Please verify and check all 5 items on the verification checklist before approval.", "error");
        return;
      }
    }

    if (['returned', 'rejected'].includes(decision) && !rejectionReason.trim()) {
      showToast("Please provide a reason or note for returning or rejecting this proposal.", "error");
      return;
    }

    try {
      setIsProcessing(true);
      const res = await api.post(`proposals/${proposal.id}/verify_and_sanction/`, {
        decision,
        checklist,
        official_remarks: officialRemarks,
        rejection_reason: rejectionReason
      });
      showToast(decision === 'approved' ? "Proposal Approved! Live event published to campus calendar." : `Proposal marked as ${decision.toUpperCase()}.`);
      if (onProposalUpdated) onProposalUpdated(res.data);
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to verify proposal.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler: Archive Proposal
  const handleArchive = async () => {
    try {
      setIsProcessing(true);
      const res = await api.post(`proposals/${proposal.id}/archive/`);
      showToast("Proposal archived into permanent university records.");
      if (onProposalUpdated) onProposalUpdated(res.data);
    } catch (err) {
      showToast("Failed to archive proposal.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const statusBadge = STATUS_CONFIG[proposal.status] || { label: proposal.status, color: 'bg-slate-100 text-slate-800' };
  const budgetList = Array.isArray(proposal.budget_items) ? proposal.budget_items : [];
  const totalBudget = proposal.budget || budgetList.reduce((acc, it) => acc + (parseFloat(it.cost || it.estimated_cost || 0)), 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 print:absolute print:inset-0 print:p-0 print:bg-white print:block print:overflow-visible print:z-[99999]">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[60] px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border text-xs font-bold transition-all ${
          toast.type === 'error' ? 'bg-rose-950 text-rose-200 border-rose-600' :
          toast.type === 'info' ? 'bg-indigo-950 text-indigo-200 border-indigo-600' :
          'bg-emerald-950 text-emerald-200 border-emerald-600'
        }`}>
          {toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden my-auto flex flex-col max-h-[94vh] print:max-w-none print:block print:max-h-none print:border-none print:shadow-none print:rounded-none">
        
        {/* MODAL HEADER - Hidden in Print */}
        <div className="bg-slate-900 text-white p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 print:hidden shrink-0">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-lg">
                {proposal.proposal_no}
              </span>
              <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${statusBadge.color}`}>
                {statusBadge.label}
              </span>
              {proposal.event && (
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                  <Check size={11} /> Live Event Linked
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
              {proposal.event_title}
            </h2>
            <p className="text-xs text-slate-400 font-medium flex items-center gap-2">
              <span>Society: <strong className="text-slate-200">{proposal.society_name}</strong></span>
              <span>•</span>
              <span>Academic Year: <strong className="text-slate-200">{proposal.academic_year || '2026-2027'}</strong></span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            {/* Download / Print PDF Button */}
            <button
              onClick={handlePrintAndDownload}
              disabled={isProcessing}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer"
              title="Generate printable PDF of the official event proposal form"
            >
              <Printer size={15} /> Print / Save PDF
            </button>

            {/* View Signed Document Scan if available */}
            {proposal.signed_proposal_file && (
              <a
                href={getMediaUrl(proposal.signed_proposal_file)}
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition"
              >
                <Eye size={14} /> View Signed Scan
              </a>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Clean Horizontal Stepper */}
        <div className="flex items-center justify-between w-full p-4 bg-slate-50 border-b border-slate-200 print:hidden shrink-0 overflow-x-auto">
          {['Draft', 'Generated', 'Downloaded', 'Awaiting Signature', 'Uploaded', 'Pending Verification', 'Approved'].map((step, index) => (
            <div key={index} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition ${index <= currentStep ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {index + 1}
                </div>
                <span className={`text-[11px] font-bold whitespace-nowrap hidden sm:inline ${index <= currentStep ? 'text-purple-700' : 'text-slate-400'}`}>
                  {step}
                </span>
              </div>
              {index < 6 && <div className={`h-1 w-8 sm:w-12 mx-2 flex-1 ${index < currentStep ? 'bg-purple-600' : 'bg-gray-200'}`}></div>}
            </div>
          ))}
        </div>

        {/* Nav Tabs - Removed the two unwanted options */}
        <div className="flex border-b mb-6 px-6 pt-3 bg-white print:hidden shrink-0">
          <button className="px-4 py-2 border-b-2 border-purple-600 text-purple-600 font-bold text-xs flex items-center gap-2">
            <FileText size={14} /> Official Proposal Document
          </button>
          {/* The "Physical Signature & Verification Desk" and "Audit Log" buttons have been completely removed here */}
        </div>

        {/* MODAL BODY (Scrollable) */}
        <div className="overflow-y-auto p-4 sm:p-8 space-y-6 flex-1 bg-slate-50/50 print:bg-white print:p-0 print:overflow-visible print:block">
          
          {/* THE OFFICIAL STATUTORY PROPOSAL DOCUMENT */}
          <div className="bg-white p-6 sm:p-12 rounded-2xl border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0 max-w-4xl mx-auto font-serif text-slate-900 space-y-8 print:space-y-6">
              
              {/* DOCUMENT HEADER */}
              <div className="text-center border-b-2 border-slate-900 pb-6 space-y-1">
                <h3 className="text-base sm:text-lg font-bold tracking-wider uppercase">
                  DIRECTORATE OF STUDENT AFFAIRS & CAMPUS LIFE
                </h3>
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
                  {proposal.society_name || 'DEPARTMENT / SOCIETY NAME'}
                </h2>
                <div className="pt-2">
                  <span className="inline-block bg-slate-900 text-white font-sans text-xs sm:text-sm font-bold tracking-widest uppercase px-6 py-1 rounded">
                    EVENT PROPOSAL FORM
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-between text-xs font-sans font-medium text-slate-600 pt-4">
                  <p><strong>Proposal No:</strong> <span className="font-mono font-bold text-slate-900">{proposal.proposal_no}</span></p>
                  <p><strong>Submission Date:</strong> {proposal.generated_at ? new Date(proposal.generated_at).toLocaleDateString() : new Date().toLocaleDateString()}</p>
                </div>
              </div>

              {/* 1. EVENT INFORMATION */}
              <div className="space-y-3 font-sans text-xs">
                <h4 className="font-bold text-sm uppercase tracking-wider border-b border-slate-300 pb-1 text-slate-900">
                  1. EVENT INFORMATION
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
                  <div>
                    <span className="text-slate-500 font-bold block">Event Title:</span>
                    <span className="font-bold text-slate-900 text-sm">{proposal.event_title}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block">Event Type:</span>
                    <span className="font-semibold text-slate-900">{proposal.event_type || 'Workshop & Seminar'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block">Proposed Date:</span>
                    <span className="font-semibold text-slate-900">{proposal.event_date}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-slate-500 font-bold block">Start Time:</span>
                      <span className="font-semibold text-slate-900">{proposal.start_time || '10:00 AM'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block">End Time:</span>
                      <span className="font-semibold text-slate-900">{proposal.end_time || '01:00 PM'}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block">Venue:</span>
                    <span className="font-semibold text-slate-900">{proposal.venue || 'Campus Main Auditorium'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block">Organized By:</span>
                    <span className="font-semibold text-slate-900">{proposal.society_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block">Academic Year:</span>
                    <span className="font-semibold text-slate-900">{proposal.academic_year || '2026-2027'}</span>
                  </div>
                </div>

                {(proposal.event_image || proposal.poster_image_url) && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <span className="text-slate-500 font-bold block text-[11px] mb-1.5 uppercase">Attached Event Poster / Publicity Material:</span>
                    <div className="w-full max-w-md h-48 rounded-xl overflow-hidden border border-slate-300 shadow-sm bg-slate-100">
                      <img 
                        src={proposal.event_image || proposal.poster_image_url} 
                        alt={proposal.event_title} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 2. EVENT OBJECTIVES */}
              <div className="space-y-2 font-sans text-xs">
                <h4 className="font-bold text-sm uppercase tracking-wider border-b border-slate-300 pb-1 text-slate-900">
                  2. EVENT OBJECTIVES
                </h4>
                <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                  {proposal.objectives || "The objectives of this event are:\n• Facilitate advanced practical competencies and technological awareness.\n• Foster inter-departmental collaboration and student community networking.\n• Provide recognized certification and leadership opportunities."}
                </p>
              </div>

              {/* 3. EVENT DESCRIPTION */}
              <div className="space-y-2 font-sans text-xs">
                <h4 className="font-bold text-sm uppercase tracking-wider border-b border-slate-300 pb-1 text-slate-900">
                  3. EVENT DESCRIPTION
                </h4>
                <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                  {proposal.event_description || "Detailed agenda, technical modules, hands-on activities, keynote lectures, and project showcases organized under statutory supervision."}
                </p>
              </div>

              {/* 4. EXPECTED PARTICIPATION */}
              <div className="space-y-2 font-sans text-xs">
                <h4 className="font-bold text-sm uppercase tracking-wider border-b border-slate-300 pb-1 text-slate-900">
                  4. EXPECTED PARTICIPATION
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-500 font-bold block">Expected Number of Participants:</span>
                    <span className="font-bold text-slate-900">{proposal.expected_participants || 100} Delegates</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block">Target Audience:</span>
                    <span className="font-semibold text-slate-900">{proposal.target_audience || 'University Students & Faculty'}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-500 font-bold block">Expected Guests or Speakers:</span>
                    <span className="font-semibold text-slate-900">{proposal.guests || 'Distinguished academic faculty, industry experts, and keynote guest speakers.'}</span>
                  </div>
                </div>
              </div>

              {/* 5. REQUIREMENTS */}
              <div className="space-y-2 font-sans text-xs">
                <h4 className="font-bold text-sm uppercase tracking-wider border-b border-slate-300 pb-1 text-slate-900">
                  5. REQUIREMENTS
                </h4>
                <p className="text-slate-600 mb-1">The following facilities or resources are required:</p>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="font-medium text-slate-800 whitespace-pre-line leading-relaxed">
                    {proposal.required_facilities || "• Auditorium or classroom\n• Sound system & Wireless Microphones\n• High-Lumen Projector\n• Photography or media coverage\n• Refreshments & High Tea\n• Transport & Security Clearance\n• Certificates & Publicity Material"}
                  </p>
                </div>
              </div>

              {/* 6. BUDGET ESTIMATE */}
              <div className="space-y-2 font-sans text-xs">
                <h4 className="font-bold text-sm uppercase tracking-wider border-b border-slate-300 pb-1 text-slate-900">
                  6. BUDGET ESTIMATE
                </h4>
                <div className="overflow-x-auto border border-slate-300 rounded-lg">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 text-slate-700">
                        <th className="p-2.5 font-bold">Item</th>
                        <th className="p-2.5 font-bold">Description</th>
                        <th className="p-2.5 font-bold text-right">Estimated Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {budgetList.length > 0 ? (
                        budgetList.map((item, i) => (
                          <tr key={i}>
                            <td className="p-2.5 font-semibold text-slate-900">{item.item || `Item ${i+1}`}</td>
                            <td className="p-2.5 text-slate-600">{item.description || '-'}</td>
                            <td className="p-2.5 text-right font-mono font-bold text-slate-900">PKR {parseFloat(item.cost || item.estimated_cost || 0).toLocaleString()}</td>
                          </tr>
                        ))
                      ) : (
                        <>
                          <tr>
                            <td className="p-2.5 font-semibold text-slate-900">Keynote & Guest Speaker Honorarium</td>
                            <td className="p-2.5 text-slate-600">Travel and honorarium</td>
                            <td className="p-2.5 text-right font-mono font-bold text-slate-900">PKR 12,000</td>
                          </tr>
                          <tr>
                            <td className="p-2.5 font-semibold text-slate-900">Refreshments & Catering</td>
                            <td className="p-2.5 text-slate-600">High tea for attendees and delegates</td>
                            <td className="p-2.5 text-right font-mono font-bold text-slate-900">PKR 15,000</td>
                          </tr>
                          <tr>
                            <td className="p-2.5 font-semibold text-slate-900">Certificates & Shields</td>
                            <td className="p-2.5 text-slate-600">Official certificates and guest shields</td>
                            <td className="p-2.5 text-right font-mono font-bold text-slate-900">PKR 8,000</td>
                          </tr>
                        </>
                      )}
                      <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
                        <td className="p-2.5 uppercase tracking-wider" colSpan={2}>Total Estimated Budget</td>
                        <td className="p-2.5 text-right font-mono text-sm text-indigo-700">PKR {parseFloat(totalBudget || 35000).toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 7. FUNDING SOURCE & 8. EXPECTED OUTCOME */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-sans text-xs">
                <div className="space-y-1.5">
                  <h4 className="font-bold text-sm uppercase tracking-wider border-b border-slate-300 pb-1 text-slate-900">
                    7. FUNDING SOURCE
                  </h4>
                  <p className="text-slate-700">
                    Funding will be provided through: <br />
                    <strong className="text-slate-900">{proposal.funding_source || 'Society Annual Budget Allocation & Corporate Sponsorship'}</strong>
                  </p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-sm uppercase tracking-wider border-b border-slate-300 pb-1 text-slate-900">
                    8. EXPECTED OUTCOME
                  </h4>
                  <p className="text-slate-700">
                    {proposal.expected_outcome || "Increased student engagement, acquired technical competencies, campus recognition, and formal post-event documentation."}
                  </p>
                </div>
              </div>

              {/* 9. DECLARATION & 3-TIER STATUTORY SIGNATURE BOXES */}
              <div className="space-y-6 font-sans text-xs border-t-2 border-slate-900 pt-6">
                <div>
                  <h4 className="font-bold text-sm uppercase tracking-wider mb-1 text-slate-900">
                    9. DECLARATION
                  </h4>
                  <p className="text-slate-600 italic">
                    We confirm that the information provided in this proposal is accurate. The society will conduct the event according to university rules and will submit any required post-event report after completion.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                  
                  {/* BOX 1: PREPARED BY (PRESIDENT) */}
                  <div className="p-4 rounded-xl border border-slate-300 bg-slate-50/50 space-y-3 flex flex-col justify-between">
                    <div>
                      <span className="font-black uppercase text-[11px] text-slate-700 block mb-2 border-b border-slate-200 pb-1">
                        Prepared By:
                      </span>
                      <p><strong>Name:</strong> {proposal.president_name || currentUser?.full_name || 'Society President'}</p>
                      <p><strong>Designation:</strong> President, {proposal.society_name}</p>
                      <p><strong>Contact:</strong> {proposal.president_contact || 'Campus Ext. / Mobile'}</p>
                    </div>

                    <div className="pt-6 border-t border-slate-200 space-y-1 text-slate-500">
                      <p>Signature: <span className="font-serif italic text-slate-900 font-bold text-sm">✍️ {proposal.president_name || 'President'}</span></p>
                      <p>Date: {proposal.generated_at ? new Date(proposal.generated_at).toLocaleDateString() : '_________________'}</p>
                    </div>
                  </div>

                  {/* BOX 2: ADVISOR REVIEW */}
                  <div className="p-4 rounded-xl border border-slate-300 bg-slate-50/50 space-y-3 flex flex-col justify-between">
                    <div>
                      <span className="font-black uppercase text-[11px] text-slate-700 block mb-2 border-b border-slate-200 pb-1">
                        Advisor Review:
                      </span>
                      <p><strong>Advisor Name:</strong> {proposal.advisor_name || 'Faculty Advisor'}</p>
                      <p className="pt-1"><strong>Comments:</strong> <span className="italic text-slate-700">{proposal.advisor_comments || 'Reviewed and endorsed for physical compliance.'}</span></p>
                      
                      <div className="pt-2 flex flex-col gap-1 text-[11px]">
                        <span className="font-bold text-slate-700">Decision:</span>
                        <div className="flex items-center gap-3">
                          <span className={proposal.status === 'approved' || proposal.status === 'signed_uploaded' ? 'font-bold text-emerald-700' : 'text-slate-500'}>
                            [{proposal.status === 'approved' || proposal.status === 'signed_uploaded' ? '✔' : ' '}] Approved
                          </span>
                          <span className={proposal.status === 'returned' ? 'font-bold text-rose-700' : 'text-slate-500'}>
                            [{proposal.status === 'returned' ? '✔' : ' '}] Returned
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-200 space-y-1 text-slate-500">
                      <p>Advisor Signature: <span className="font-serif italic text-slate-900 font-bold text-sm">
                        {proposal.signed_proposal_file ? `✍️ Signed on Paper` : '___________________'}
                      </span></p>
                      <p>Date: {proposal.uploaded_at ? new Date(proposal.uploaded_at).toLocaleDateString() : '_________________'}</p>
                    </div>
                  </div>

                  {/* BOX 3: FOR OFFICE USE */}
                  <div className="p-4 rounded-xl border border-slate-300 bg-slate-50/50 space-y-3 flex flex-col justify-between">
                    <div>
                      <span className="font-black uppercase text-[11px] text-slate-700 block mb-2 border-b border-slate-200 pb-1">
                        For Office Use:
                      </span>
                      <p><strong>Verified By:</strong> {proposal.approved_by_name || (proposal.status === 'approved' ? 'Society Admin Office' : 'Pending Verification')}</p>
                      <p><strong>Verification Date:</strong> {proposal.approved_at ? new Date(proposal.approved_at).toLocaleDateString() : 'Pending'}</p>
                      <p><strong>Final Status:</strong> <span className="font-bold text-slate-900 uppercase">{proposal.status}</span></p>
                      <p className="pt-1"><strong>Official Remarks:</strong> <span className="text-slate-600">{proposal.official_remarks || 'Statutory physical sign-off verified.'}</span></p>
                    </div>

                    <div className="pt-6 border-t border-slate-200 text-slate-500 text-center">
                      <div className="border border-dashed border-slate-400 p-2 rounded text-[10px] uppercase font-bold text-slate-400">
                        {proposal.status === 'approved' ? 'OFFICIAL CAMPUS SEAL APPLIED' : 'OFFICE STAMP / EMBOSS'}
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* PHYSICAL SIGNATURE & VERIFICATION DESK - Inline Under Proposal Form */}
            <div className="max-w-4xl mx-auto space-y-6 pt-6 print:hidden">
              
              {/* STAGE 1: PRESIDENT ACTIONS (Only visible to PRESIDENT role) */}
              {(currentUser?.role === 'president' || currentUser?.role === 'PRESIDENT') && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-purple-700">
                    <UploadCloud size={20} />
                    <h3 className="text-base font-black text-slate-900">
                      Physical Signature Collection & Upload Scan
                    </h3>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    <strong>Workflow Rule:</strong> Print the generated proposal PDF, collect physical ink signatures from the Faculty Advisor, and upload the signed scan below.
                  </p>

                  {proposal.signed_proposal_file ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                          <CheckCircle2 size={22} />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-emerald-900">Signed Document Uploaded</h4>
                          <p className="text-[11px] text-emerald-700 font-medium">
                            Uploaded on: {proposal.uploaded_at ? new Date(proposal.uploaded_at).toLocaleString() : 'Recent'}
                          </p>
                        </div>
                      </div>

                      <a
                        href={getMediaUrl(proposal.signed_proposal_file)}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
                      >
                        <ExternalLink size={13} /> View Uploaded Scan
                      </a>
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
                      <div className="flex items-center gap-2 font-bold">
                        <AlertTriangle size={16} className="text-amber-600" />
                        <span>Physical signature pending upload.</span>
                      </div>
                      <p className="text-amber-800">
                        Print the document using "Print / Save PDF", get physical endorsement from your Faculty Advisor, and upload the signed copy below.
                      </p>
                    </div>
                  )}

                  {/* Strictly Restricted File Upload Form */}
                  <form onSubmit={handleUploadSignedFile} className="flex items-center gap-4 mt-4">
                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      onChange={(e) => setUploadFile(e.target.files[0])}
                      className="file-input text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                    />
                    <button
                      type="submit"
                      disabled={isUploading || !uploadFile}
                      className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow transition"
                    >
                      <UploadCloud size={14} /> {isUploading ? 'Uploading...' : 'Submit Signed Scan'}
                    </button>
                  </form>
                </div>
              )}

              {/* STAGE 2: ADVISOR ENDORSEMENT COMMENTS */}
              {(currentUser?.role === 'faculty' || currentUser?.role === 'admin') && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-violet-700">
                    <Award size={20} />
                    <h3 className="text-base font-black text-slate-900">
                      Advisor Endorsement & Review Comments
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-700 block">
                      Faculty Advisor Official Remarks / Comments:
                    </label>
                    <textarea
                      value={advisorComments}
                      onChange={(e) => setAdvisorComments(e.target.value)}
                      rows={2}
                      placeholder="Enter advisor notes or physical inspection remarks..."
                      className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    />

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleAdvisorReview('approved')}
                        disabled={isProcessing}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <CheckCircle2 size={14} /> Endorse & Recommend Proposal
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAdvisorReview('returned')}
                        disabled={isProcessing}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <AlertTriangle size={14} /> Return for Correction
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STAGE 3: SOCIETY / ADMIN OFFICE STATUTORY VERIFICATION CHECKLIST */}
              {(currentUser?.role === 'admin' || currentUser?.role === 'faculty') && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-indigo-900">
                    <ShieldCheck size={20} />
                    <h3 className="text-base font-black text-slate-900">
                      Step 3: Society/Admin Office Verification Checklist
                    </h3>
                  </div>

                  <p className="text-xs text-slate-600 font-medium">
                    The society office administrator must verify all statutory parameters before granting executive sanction:
                  </p>

                  <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                    <label className="flex items-center gap-2.5 font-bold text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checklist.correct_proposal_no}
                        onChange={(e) => setChecklist({ ...checklist, correct_proposal_no: e.target.checked })}
                        className="w-4 h-4 rounded text-indigo-600"
                      />
                      <span>Correct Proposal Number ({proposal.proposal_no})</span>
                    </label>

                    <label className="flex items-center gap-2.5 font-bold text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checklist.complete_pages}
                        onChange={(e) => setChecklist({ ...checklist, complete_pages: e.target.checked })}
                        className="w-4 h-4 rounded text-indigo-600"
                      />
                      <span>Complete Pages & Sections verified</span>
                    </label>

                    <label className="flex items-center gap-2.5 font-bold text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checklist.visible_signature}
                        onChange={(e) => setChecklist({ ...checklist, visible_signature: e.target.checked })}
                        className="w-4 h-4 rounded text-indigo-600"
                      />
                      <span>Visible physical signature of Faculty Advisor & President</span>
                    </label>

                    <label className="flex items-center gap-2.5 font-bold text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checklist.correct_event_info}
                        onChange={(e) => setChecklist({ ...checklist, correct_event_info: e.target.checked })}
                        className="w-4 h-4 rounded text-indigo-600"
                      />
                      <span>Correct Event Information, date, and venue reservation</span>
                    </label>

                    <label className="flex items-center gap-2.5 font-bold text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checklist.no_unauthorized_changes}
                        onChange={(e) => setChecklist({ ...checklist, no_unauthorized_changes: e.target.checked })}
                        className="w-4 h-4 rounded text-indigo-600"
                      />
                      <span>No unauthorized changes or budget tampering</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Official Sanction Remarks:</label>
                      <input
                        type="text"
                        value={officialRemarks}
                        onChange={(e) => setOfficialRemarks(e.target.value)}
                        placeholder="e.g., Verified against physical ledger. Granted permission."
                        className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Rejection / Return Reason (if any):</label>
                      <input
                        type="text"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Reason for return or rejection..."
                        className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleOfficeVerification('approved')}
                      disabled={isProcessing}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition cursor-pointer"
                    >
                      <CheckCircle2 size={15} /> Approve & Grant Executive Sanction
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOfficeVerification('returned')}
                      disabled={isProcessing}
                      className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <AlertTriangle size={15} /> Return for Correction
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOfficeVerification('rejected')}
                      disabled={isProcessing}
                      className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <XCircle size={15} /> Reject Proposal
                    </button>

                    {proposal.status === 'approved' && (
                      <button
                        type="button"
                        onClick={handleArchive}
                        disabled={isProcessing}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ml-auto"
                      >
                        <ShieldCheck size={15} /> Move to Permanent Archive
                      </button>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>

      </div>
    );
  }
