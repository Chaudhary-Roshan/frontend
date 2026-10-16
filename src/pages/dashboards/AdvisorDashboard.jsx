import { MediaLink, MediaImage } from '../../components/common/AuthenticatedMedia';
import React, { useContext, useEffect, useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { AuthContext } from '../../context/AuthContext';
import { 
  CheckSquare, Award, Users, CheckCircle, BarChart, 
  Calendar, Megaphone, PlusCircle, QrCode, ShieldCheck, 
  CreditCard, Clock, CheckCircle2, XCircle, ArrowRight,
  FileText, ExternalLink, Eye, AlertCircle, X, Check, UserPlus,
  User, Edit3, Trash2, Loader2, Download
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import EventProposalDocumentModal from '../../components/modals/EventProposalDocumentModal';
import { generateOfficialProposalPDF } from '../../utils/officialPdfGenerator';
import PaymentVerificationDesk from '../../components/ticketing/PaymentVerificationDesk';
import ManualTicketingHub from '../../components/ticketing/ManualTicketingHub';
import ExecutiveProfileModal from '../../components/modals/ExecutiveProfileModal';
import { getMediaUrl } from '../../utils/media';
import { sortSocietyMembers } from '../../utils/hierarchy';

const AdvisorDashboard = () => {
  const { user } = useContext(AuthContext);
  const [society, setSociety] = useState(null);
  const [pendingRegs, setPendingRegs] = useState([]);
  const [events, setEvents] = useState([]);
  const [deleteEventTarget, setDeleteEventTarget] = useState(null);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);
  const [deleteProposalTarget, setDeleteProposalTarget] = useState(null);
  const [isDeletingProposal, setIsDeletingProposal] = useState(false);
  const [pendingEventProposals, setPendingEventProposals] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [selectedProposalDoc, setSelectedProposalDoc] = useState(null);
  const [cabinet, setCabinet] = useState([]);
  const [report, setReport] = useState(null);
  const [venues, setVenues] = useState([]);

  const [assignedSocieties, setAssignedSocieties] = useState([]);
  const [selectedSocietyId, setSelectedSocietyId] = useState('all');

  const [loading, setLoading] = useState(true);

  // Bulk Operations State
  const [bulkEventId, setBulkEventId] = useState('');
  const [bulkFile, setBulkFile] = useState(null);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Modals
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '', description: '', date: '', is_paid: false, price: 0, venue: '', society: ''
  });
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [newsForm, setNewsForm] = useState({ title: '', content: '' });

  // Bank Edit Modal for Faculty Advisors
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankQrFile, setBankQrFile] = useState(null);
  const [bankForm, setBankForm] = useState({
    bank_name: '',
    bank_account_title: '',
    bank_account_number: '',
    payment_instructions: ''
  });

  // Official Signature Management
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatures, setSignatures] = useState([]);
  const [signatureImage, setSignatureImage] = useState('');
  const [signaturePreview, setSignaturePreview] = useState('');

  // Certificate Templates & Endorsements
  const [certificateTemplates, setCertificateTemplates] = useState([]);
  const [selectedTemplateForReview, setSelectedTemplateForReview] = useState(null);

  // Proposal Verification Modal State
  const [selectedProposalForVerify, setSelectedProposalForVerify] = useState(null);
  const [verificationForm, setVerificationForm] = useState({
    advisor_approved: false,
    chairman_approved: false,
    hod_approved: false,
    verification_notes: ''
  });

  // Receipt Preview Modal
  const [selectedReceiptForPreview, setSelectedReceiptForPreview] = useState(null);

  const [toastMsg, setToastMsg] = useState(null);

  const handleDeleteEvent = async () => {
    if (!deleteEventTarget) return;
    try {
      setIsDeletingEvent(true);
      await api.delete(`events/${deleteEventTarget.id}/`);
      setEvents(prev => prev.filter(e => e.id !== deleteEventTarget.id));
      setProposals(prev => prev.filter(p => p.event !== deleteEventTarget.id && p.proposal_no !== deleteEventTarget.proposal_doc_number));
      showToast(`Event "${deleteEventTarget.title}" deleted.`);
      setDeleteEventTarget(null);
    } catch (err) {
      console.error("Delete event failed:", err);
      alert(err.response?.data?.error || err.response?.data?.detail || "Failed to delete event.");
    } finally {
      setIsDeletingEvent(false);
    }
  };

  const handleDeleteProposal = async () => {
    if (!deleteProposalTarget) return;
    try {
      setIsDeletingProposal(true);
      await api.delete(`proposals/${deleteProposalTarget.id}/`);
      setProposals(prev => prev.filter(p => p.id !== deleteProposalTarget.id));
      setEvents(prev => prev.filter(e => e.proposal_doc_number !== deleteProposalTarget.proposal_no));
      showToast(`Proposal "${deleteProposalTarget.event_title || deleteProposalTarget.title}" deleted.`);
      setDeleteProposalTarget(null);
    } catch (err) {
      console.error("Delete proposal failed:", err);
      alert(err.response?.data?.error || err.response?.data?.detail || "Failed to delete proposal.");
    } finally {
      setIsDeletingProposal(false);
    }
  };

  const activeReqIdRef = useRef(0);
  const abortControllerRef = useRef(null);
  const [scopeLoading, setScopeLoading] = useState(false);

  useEffect(() => {
    // Clear previous society displayed data and show loading state
    setSociety(null);
    setReport(null);
    setEvents([]);
    setPendingEventProposals([]);
    setPendingRegs([]);
    setCabinet([]);
    setProposals([]);
    setCertificateTemplates([]);
    setScopeLoading(true);

    fetchData(selectedSocietyId);

    const handleSync = () => {
      fetchData(selectedSocietyId);
    };

    window.addEventListener('dsms:data_synced', handleSync);
    return () => {
      window.removeEventListener('dsms:data_synced', handleSync);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [selectedSocietyId]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const fetchData = async (scopeToFetch = selectedSocietyId) => {
    // Abort previous in-flight requests to eliminate race conditions
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const reqId = ++activeReqIdRef.current;

    try {
      const socRes = await api.get('societies/', { signal: controller.signal });
      if (reqId !== activeReqIdRef.current) return;

      let mySocs = [];
      if (user?.role === 'admin') {
        mySocs = socRes.data;
      } else {
        const userAdvisedIds = (user?.advised_society_ids || []).map(Number);
        mySocs = socRes.data.filter(s => {
          const advId = typeof s.advisor === 'object' ? s.advisor?.id : s.advisor;
          const socId = Number(s.id);
          return (
            advId === user?.id || 
            Number(advId) === Number(user?.id) || 
            socId === Number(user?.society) || 
            userAdvisedIds.includes(socId)
          );
        });
      }
      setAssignedSocieties(mySocs);

      let activeSoc = null;
      if (scopeToFetch !== 'all') {
        // Strictly match the requested society database ID without any other society fallback
        activeSoc = mySocs.find(s => String(s.id) === String(scopeToFetch)) || null;
      }
      setSociety(activeSoc);

      if (activeSoc) {
        setBankForm({
          bank_name: activeSoc.bank_name || '',
          bank_account_title: activeSoc.bank_account_title || '',
          bank_account_number: activeSoc.bank_account_number || '',
          payment_instructions: activeSoc.payment_instructions || ''
        });
      }

      // Query endpoints with explicit society query param
      const queryParams = scopeToFetch !== 'all' ? { society: scopeToFetch } : {};
      const [regRes, evtRes, cabRes, venRes, propRes, sigRes, tmplRes] = await Promise.allSettled([
        api.get('registrations/', { params: queryParams, signal: controller.signal }),
        api.get('events/', { params: queryParams, signal: controller.signal }),
        api.get('cabinet/', { params: queryParams, signal: controller.signal }),
        api.get('venues/', { signal: controller.signal }),
        api.get('proposals/', { params: queryParams, signal: controller.signal }),
        api.get('signatures/', { signal: controller.signal }),
        api.get('certificate-templates/', { params: queryParams, signal: controller.signal })
      ]);

      if (reqId !== activeReqIdRef.current) return;

      const targetSocIds = scopeToFetch !== 'all' ? [Number(scopeToFetch)] : mySocs.map(s => Number(s.id));
      const isInTarget = (socVal) => {
        if (socVal === null || socVal === undefined) return false;
        const id = typeof socVal === 'object' ? socVal.id : socVal;
        return targetSocIds.includes(Number(id));
      };

      if (regRes.status === 'fulfilled') {
        const filteredRegs = regRes.value.data.filter(r => 
          isInTarget(r.society_id) || isInTarget(r.society) || isInTarget(r.event_society)
        );
        setPendingRegs(filteredRegs.filter(r => r.payment_status === 'pending'));
      }

      if (evtRes.status === 'fulfilled') {
        const socEvents = evtRes.value.data.filter(e => isInTarget(e.society));
        setEvents(socEvents);
        setPendingEventProposals(socEvents.filter(e => e.status === 'pending'));
      }

      if (cabRes.status === 'fulfilled') {
        const socCab = cabRes.value.data.filter(c => isInTarget(c.society));
        setCabinet(sortSocietyMembers(socCab.filter(c => !c.is_verified)));
      }

      if (venRes.status === 'fulfilled') {
        setVenues(venRes.value.data);
      }

      if (propRes.status === 'fulfilled') {
        const socProps = propRes.value.data.filter(p => isInTarget(p.society));
        setProposals(socProps);
      }

      if (sigRes.status === 'fulfilled') {
        setSignatures(sigRes.value.data || []);
      }

      if (tmplRes.status === 'fulfilled') {
        const filteredTemplates = tmplRes.value.data.filter(t => isInTarget(t.society));
        setCertificateTemplates(filteredTemplates);
      }

      // Fetch statistics report
      if (activeSoc) {
        try {
          const repRes = await api.get(`societies/${activeSoc.id}/report/`, { signal: controller.signal });
          if (reqId === activeReqIdRef.current) {
            setReport(repRes.data);
          }
        } catch (e) {
          if (reqId === activeReqIdRef.current) setReport(null);
        }
      } else if (scopeToFetch === 'all' && mySocs.length > 0) {
        // Aggregate statistics across all assigned societies
        try {
          const reports = await Promise.allSettled(
            mySocs.map(s => api.get(`societies/${s.id}/report/`, { signal: controller.signal }))
          );
          if (reqId === activeReqIdRef.current) {
            let totalEvents = 0;
            let totalMembers = 0;
            let totalRevenue = 0;
            let totalHealth = 0;
            let validCount = 0;
            reports.forEach(r => {
              if (r.status === 'fulfilled' && r.value.data) {
                totalEvents += r.value.data.total_events || 0;
                totalMembers += r.value.data.active_members || 0;
                totalRevenue += r.value.data.total_revenue || 0;
                totalHealth += r.value.data.health_score || 0;
                validCount++;
              }
            });
            setReport({
              society: `All Assigned Societies (${mySocs.length})`,
              total_events: totalEvents,
              active_members: totalMembers,
              total_revenue: totalRevenue,
              health_score: validCount > 0 ? Math.round(totalHealth / validCount) : 100
            });
          }
        } catch (e) {
          if (reqId === activeReqIdRef.current) setReport(null);
        }
      } else {
        setReport(null);
      }
    } catch (e) {
      if (e.name !== 'CanceledError' && e.name !== 'AbortError') {
        console.error("AdvisorDashboard fetchData error:", e);
      }
    } finally {
      if (reqId === activeReqIdRef.current) {
        setLoading(false);
        setScopeLoading(false);
      }
    }
  };

  const handleBulkApprove = async () => {
    if (!bulkEventId) return showToast("Please select an event to approve.", 'error');
    setIsBulkProcessing(true);
    try {
      const res = await api.post('registrations/bulk_approve/', { event_id: bulkEventId });
      showToast(res.data.status);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to bulk approve.', 'error');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkIssueCSV = async (e) => {
    e.preventDefault();
    if (!bulkEventId) return showToast("Please select an event.", 'error');
    if (!bulkFile) return showToast("Please select a file.", 'error');
    setIsBulkProcessing(true);

    const ext = bulkFile.name.split('.').pop().toLowerCase();

    const processText = async (text) => {
      try {
        const rollNumbers = text.match(/\b([A-Z0-9-]{6,15})\b/gi) || [];
        if (rollNumbers.length === 0) {
          setIsBulkProcessing(false);
          return showToast("No valid roll numbers found in file.", 'error');
        }
        
        const res = await api.post('registrations/bulk_issue_tickets/', {
          event_id: bulkEventId,
          roll_numbers: rollNumbers
        });
        showToast(res.data.status);
        fetchData();
        setBulkFile(null);
      } catch (err) {
        showToast(err.response?.data?.error || 'Failed to bulk issue tickets.', 'error');
      } finally {
        setIsBulkProcessing(false);
      }
    };

    if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        let fullText = '';
        workbook.SheetNames.forEach(sheetName => {
          fullText += XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]) + '\n';
        });
        processText(fullText);
      };
      reader.readAsArrayBuffer(bulkFile);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        processText(event.target.result);
      };
      reader.readAsText(bulkFile);
    }
  };

  const handleReviewReceipt = async (id, studentName, decision = 'approve') => {
    try {
      let reason = '';
      if (decision === 'reject') {
        reason = prompt("Enter reason for rejection (e.g., Transaction ID not found on bank statement):", "Transaction reference not found in university bank ledger.");
        if (!reason) return;
      }
      const idempotencyKey = `idemp-${decision}-${id}-${Date.now()}`;
      await api.post(`registrations/${id}/review_receipt/`, {
        decision,
        reason,
        idempotency_key: idempotencyKey
      });
      if (decision === 'approve') {
        showToast(`Payment verified for ${studentName}. Official QR Ticket generated.`);
      } else {
        showToast(`Receipt rejected for ${studentName}. Seat released back to event capacity.`);
      }
      if (selectedReceiptForPreview && selectedReceiptForPreview.id === id) {
        setSelectedReceiptForPreview(null);
      }
      fetchData();
    } catch (e) {
      alert(e.response?.data?.error || "Failed to process receipt review.");
    }
  };

  const handleVerify = (id, studentName) => handleReviewReceipt(id, studentName, 'approve');

  const handleApproveEvent = async (id) => {
    try {
      await api.post(`events/${id}/approve/`);
      showToast("Event proposal approved and published live!");
      fetchData();
    } catch (e) {
      alert("Failed to approve event.");
    }
  };

  const handleRejectEvent = async (id) => {
    const reason = prompt("Enter reason for rejection:", "Needs date or content revision");
    if (!reason) return;
    try {
      await api.post(`events/${id}/reject/`, { reason });
      showToast("Event proposal rejected with feedback.");
      fetchData();
    } catch (e) {
      alert("Failed to reject event.");
    }
  };

  const openVerifyModal = (evt) => {
    setSelectedProposalForVerify(evt);
    setVerificationForm({
      advisor_approved: Boolean(evt.advisor_approved),
      chairman_approved: Boolean(evt.chairman_approved),
      hod_approved: Boolean(evt.hod_approved),
      verification_notes: evt.verification_notes || ''
    });
  };

  const handleSaveVerification = async (actionType = 'save') => {
    if (!selectedProposalForVerify) return;
    try {
      await api.post(`events/${selectedProposalForVerify.id}/verify_proposal/`, {
        advisor_approved: verificationForm.advisor_approved,
        chairman_approved: verificationForm.chairman_approved,
        hod_approved: verificationForm.hod_approved,
        verification_notes: verificationForm.verification_notes,
        action: actionType
      });
      if (actionType === 'approve') {
        showToast(`Event '${selectedProposalForVerify.title}' fully verified and published live!`);
      } else if (actionType === 'reject') {
        showToast(`Event '${selectedProposalForVerify.title}' rejected/returned for revision.`);
      } else {
        showToast("Statutory physical signature checklist saved.");
      }
      setSelectedProposalForVerify(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update proposal verification.");
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    const targetSocId = eventForm.society ? parseInt(eventForm.society) : (society?.id || assignedSocieties[0]?.id);
    if (!targetSocId) return;
    try {
      await api.post('events/', {
        society: targetSocId,
        title: eventForm.title,
        description: eventForm.description,
        date: eventForm.date,
        is_paid: eventForm.is_paid,
        price: eventForm.is_paid ? parseFloat(eventForm.price) : 0.00,
        venue: eventForm.venue ? parseInt(eventForm.venue) : null
      });
      showToast("Event created and automatically approved by Faculty Advisor!");
      setShowEventModal(false);
      setEventForm({ title: '', description: '', date: '', is_paid: false, price: 0, venue: '', society: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.date || err.response?.data?.title || 'Failed to create event. Date may be locked by another society.');
    }
  };

  const handlePostNews = async (e) => {
    e.preventDefault();
    try {
      await api.post('news/', newsForm);
      showToast("Official announcement published to campus feed.");
      setShowNewsModal(false);
      setNewsForm({ title: '', content: '' });
    } catch (err) {
      alert("Failed to post announcement.");
    }
  };

  const handleGenerateCerts = async (eventId, templateId = null) => {
    try {
      const payload = { event_id: eventId };
      if (templateId) payload.template_id = templateId;
      const res = await api.post('certificates/generate_bulk/', payload);
      showToast(res.data.status);
      fetchData();
    } catch (e) {
      alert(e.response?.data?.error || "Failed to generate certificates.");
    }
  };

  const handleApproveTemplate = async (tmplId) => {
    try {
      const res = await api.post(`certificate-templates/${tmplId}/approve/`);
      setCertificateTemplates(certificateTemplates.map(t => t.id === tmplId ? res.data.template : t));
      setSelectedTemplateForReview(null);
      showToast("Certificate template officially endorsed and approved for issue!");
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to approve template.");
    }
  };

  const handleRejectTemplate = async (tmplId) => {
    try {
      await api.post(`certificate-templates/${tmplId}/reject/`);
      setCertificateTemplates(certificateTemplates.map(t => t.id === tmplId ? { ...t, status: 'rejected' } : t));
      setSelectedTemplateForReview(null);
      showToast("Template sent back to Society President for revisions.");
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to reject template.");
    }
  };

  const handleVerifyCabinet = async (id) => {
    try {
      await api.post(`cabinet/${id}/verify/`);
      showToast("Cabinet member verified.");
      fetchData();
    } catch (err) {
      alert("Verification failed.");
    }
  };

  const handleUpdateBankDetails = async (e) => {
    e.preventDefault();
    if (!society) {
      alert("Please select a specific society to configure bank accounts.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append('bank_name', bankForm.bank_name);
      formData.append('bank_account_title', bankForm.bank_account_title);
      formData.append('bank_account_number', bankForm.bank_account_number);
      formData.append('payment_instructions', bankForm.payment_instructions || '');
      if (bankQrFile) {
        formData.append('payment_qr', bankQrFile);
      }
      await api.patch(`societies/${society.id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast(`Official bank credentials updated for ${society.name}!`);
      setShowBankModal(false);
      setBankQrFile(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update society bank account.");
    }
  };

  const handleSaveSignature = async (e) => {
    e.preventDefault();
    if (!signatureImage) {
      alert("Please provide or upload a signature image.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append('role_title', 'Faculty Advisor');
      if (signatureImage instanceof File) {
        formData.append('signature_image', signatureImage);
      } else {
        formData.append('signature_image', signatureImage);
      }
      const res = await api.post('signatures/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSignatures([res.data, ...signatures]);
      setShowSignatureModal(false);
      setSignatureImage('');
      setSignaturePreview('');
      showToast("Official printed signature asset saved for certificate authorization!");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to save signature asset.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-bold text-slate-500 animate-pulse tracking-widest uppercase">Initializing Advisor Console...</p>
      </div>
    );
  }

  if (!user || (user.role !== 'faculty' && user.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white border border-red-200 p-8 rounded-3xl max-w-md text-center shadow-lg">
          <p className="text-red-600 font-bold">Access Denied. Faculty Advisors only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">

        {toastMsg && (
          <div className="fixed top-24 right-6 z-50 bg-emerald-900 text-emerald-100 border border-emerald-500 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in">
            <CheckCircle2 size={18} className="text-emerald-400" />
            <span className="text-xs font-bold">{toastMsg}</span>
          </div>
        )}

        {/* HEADER */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                Faculty Advisor Portal
              </span>
              <span className="text-xs font-bold text-slate-400">
                {selectedSocietyId === 'all' 
                  ? `All Assigned Societies (${assignedSocieties.length})` 
                  : (society ? society.name : (scopeLoading ? 'Loading society...' : 'Assigned Society'))}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-2 flex items-center gap-3">
              <Users className="text-indigo-600" size={36} /> Academic & Executive Oversight
            </h1>
            <p className="text-slate-500 text-sm mt-1 max-w-2xl font-medium">
              Review and approve event proposals, verify paid ticket receipts, manage official society bank accounts, and endorse credentials.
            </p>

            {/* ADVISOR PROFILE SUMMARY */}
            <div className="flex items-center gap-2.5 mt-3 pt-3 border-t border-slate-100">
              {user?.avatar_url || user?.profile_photo_url ? (
                <div className="w-8 h-8 rounded-full overflow-hidden border border-indigo-200 shrink-0 shadow-xs">
                  <MediaImage
                    src={getMediaUrl(user.avatar_url || user.profile_photo_url)}
                    alt={user.full_name || user.username}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                  {(user?.first_name || user?.username || 'A').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="text-xs">
                <span className="font-bold text-slate-800">
                  {user?.full_name || (user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.username)}
                </span>
                {user?.department && (
                  <span className="text-slate-500 font-medium ml-1.5">
                    • {user.department}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowProfileModal(true)}
                className="ml-auto text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer transition"
              >
                <Edit3 size={12} /> Edit Profile
              </button>
            </div>

            {/* MULTI-SOCIETY SCOPE SELECTOR */}
            {assignedSocieties.length > 0 && (
              <div className="flex flex-wrap items-center gap-2.5 mt-3 pt-3 border-t border-slate-100">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">Active Society Scope:</span>
                <select
                  value={selectedSocietyId}
                  onChange={(e) => setSelectedSocietyId(e.target.value)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-xl text-xs font-black text-slate-900 outline-none cursor-pointer transition"
                >
                  <option value="all">All Assigned Societies ({assignedSocieties.length})</option>
                  {assignedSocieties.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowProfileModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition cursor-pointer"
              title="Edit Faculty Advisor Profile & Photo"
            >
              <User size={15} /> Edit Advisor Profile
            </button>
            {society && (
              <button
                onClick={() => setShowBankModal(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-600/25 transition cursor-pointer"
                title="Configure official university bank account for fee collection"
              >
                <CreditCard size={15} /> Society Bank Details
              </button>
            )}
            <button
              onClick={() => setShowSignatureModal(true)}
              className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 shadow-md shadow-violet-600/25 transition cursor-pointer"
              title="Manage electronic signature reproduction asset"
            >
              <ShieldCheck size={15} /> Advisor Signature
            </button>
            <button
              onClick={() => {
                setEventForm(prev => ({ ...prev, society: selectedSocietyId !== 'all' ? selectedSocietyId : '' }));
                setShowEventModal(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition cursor-pointer"
            >
              <PlusCircle size={15} /> Propose Event
            </button>
            <button
              onClick={() => setShowNewsModal(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Megaphone size={15} /> Announcement
            </button>
            <Link
              to="/attendance"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition"
            >
              <QrCode size={15} /> Scanner
            </Link>
            <Link
              to={selectedSocietyId !== 'all' ? `/president/recruitments?society=${selectedSocietyId}` : "/president/recruitments"}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition"
            >
              <UserPlus size={15} /> Recruitment Drives
            </Link>
            <Link
              to="/membership-roster"
              className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 shadow-md shadow-sky-600/30 transition"
            >
              <Users size={15} /> Membership Roster
            </Link>
          </div>
        </div>

        {/* HEALTH KPI REPORT */}
        {report ? (
          <div className="bg-slate-900 rounded-3xl shadow-xl border border-slate-800 p-8 text-white grid grid-cols-2 md:grid-cols-5 gap-6">
            <div>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">
                {selectedSocietyId === 'all' ? 'Active Scope' : 'Assigned Society'}
              </p>
              <p className="text-xl font-extrabold mt-1 truncate">{report.society}</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Total Events</p>
              <p className="text-2xl font-extrabold mt-1">{report.total_events}</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Active Members</p>
              <p className="text-2xl font-extrabold mt-1">{report.active_members}</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Event Revenue</p>
              <p className="text-2xl font-extrabold text-emerald-400 mt-1">PKR {report.total_revenue}</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                Society Index
              </p>
              <p className="text-2xl font-extrabold text-indigo-400 mt-1">{report.health_score}/100</p>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/60 rounded-3xl border border-slate-800 p-8 text-white flex items-center justify-center">
            <div className="flex items-center gap-3 text-slate-400 text-sm font-bold">
              <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
              <span>{scopeLoading ? 'Loading society statistics...' : 'Select a society to inspect statistics'}</span>
            </div>
          </div>
        )}

        {/* 1. STATUTORY EVENT PROPOSALS & PHYSICAL ENDORSEMENT DESK */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <CheckSquare className="text-indigo-600" size={22} />
                <h2 className="text-xl font-black text-slate-900">
                  Statutory Event Proposals & Advisor Endorsement ({proposals.length})
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Review submitted event dossiers, sign printed physical proposals, verify scanned uploads, and grant advisor endorsements.
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full self-start sm:self-auto">
              Faculty Statutory Oversight
            </span>
          </div>

          {proposals.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-xs">
              No statutory event proposals submitted for review yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {proposals.map(prop => {
                const hasSignedDoc = Boolean(prop.signed_proposal_file);
                const statusColor = {
                  draft: 'bg-slate-100 text-slate-700 border-slate-200',
                  generated: 'bg-blue-50 text-blue-700 border-blue-200',
                  downloaded: 'bg-amber-50 text-amber-700 border-amber-200',
                  signed_uploaded: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                  returned: 'bg-rose-50 text-rose-700 border-rose-200',
                  rejected: 'bg-red-50 text-red-700 border-red-200',
                  archived: 'bg-purple-50 text-purple-700 border-purple-200',
                }[prop.status] || 'bg-slate-100 text-slate-700 border-slate-200';

                return (
                  <div key={prop.id} className="border border-indigo-100 bg-indigo-50/20 rounded-2xl p-5 flex flex-col justify-between hover:shadow-md transition">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full">
                            {prop.proposal_no}
                          </span>
                          <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                            {prop.event_type || 'Seminar & Workshop'}
                          </span>
                          <span className="text-[10px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                            {prop.society_name || assignedSocieties.find(s => s.id === prop.society)?.name || 'Society'}
                          </span>
                        </div>
                        <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${statusColor}`}>
                          {prop.status}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-base">{prop.event_title}</h3>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">{prop.event_description || prop.objectives}</p>

                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-indigo-50 text-[11px] text-slate-600">
                        <div>
                          <span className="text-slate-400 block font-medium">Proposed Date:</span>
                          <span className="font-bold text-slate-800">{prop.event_date}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Est. Budget:</span>
                          <span className="font-bold text-slate-800">PKR {parseFloat(prop.budget || 0).toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Venue:</span>
                          <span className="font-bold text-slate-800 truncate block">{prop.venue}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Expected Attendees:</span>
                          <span className="font-bold text-slate-800">{prop.expected_participants} Delegates</span>
                        </div>
                      </div>

                      {/* Physical Signed Scan Indicator */}
                      <div className="mt-3 p-2.5 rounded-xl border bg-white flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className={hasSignedDoc ? "text-emerald-600" : "text-amber-500"} />
                          <div>
                            <p className="text-[11px] font-bold text-slate-800">
                              {hasSignedDoc ? "Signed Physical Paper Scan Uploaded" : "Awaiting Signed Paper Scan"}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {hasSignedDoc ? "Physical ink endorsement available for inspection" : "President collecting physical signatures"}
                            </p>
                          </div>
                        </div>
                        {hasSignedDoc && (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-md border border-emerald-200">
                            Scan Ready
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-indigo-100/60 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const safeNo = (prop.proposal_no || 'Dossier').replace(/[^a-zA-Z0-9_-]/g, '_');
                            generateOfficialProposalPDF(prop, `Event_Proposal_${safeNo}.pdf`);
                          }}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer flex items-center gap-1.5"
                          title="Download official PDF proposal dossier directly"
                        >
                          <Download size={14} /> Download PDF
                        </button>

                        <button
                          onClick={() => setSelectedProposalDoc(prop)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer flex items-center gap-1.5"
                        >
                          <Eye size={14} /> Review & Sign Statutory Dossier
                        </button>

                        {hasSignedDoc && (
                          <MediaLink
                            href={getMediaUrl(prop.signed_proposal_file)}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs rounded-xl transition flex items-center gap-1"
                          >
                            <ExternalLink size={12} /> View Scan
                          </MediaLink>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setDeleteProposalTarget(prop)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-xl transition cursor-pointer"
                        title="Delete Proposal"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. PAYMENT VERIFICATIONS & CERTIFICATE GENERATION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Payment Verifications */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <CreditCard className="text-emerald-600" /> Pending Paid Ticket Receipts ({pendingRegs.length})
            </h2>

            {pendingRegs.length === 0 ? (
              <p className="text-slate-400 text-xs py-8 text-center">No pending ticket receipts requiring verification.</p>
            ) : (
              <div className="space-y-3">
                {pendingRegs.map(reg => (
                  <div key={reg.id} className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-900 text-sm">{reg.student_name}</h4>
                        <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {reg.student_roll_number || 'Student'}
                        </span>
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                          Bank v{reg.bank_snapshot?.version || reg.bank_version || 1}
                        </span>
                        {(reg.society_name || assignedSocieties.find(s => s.id === (r => r.society_id || r.society)(reg))?.name) && (
                          <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                            {reg.society_name || assignedSocieties.find(s => s.id === (reg.society_id || reg.society))?.name}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 font-medium">
                        Event: <strong className="text-slate-900">{reg.event_title}</strong> (PKR {reg.event_price || '10.00'})
                      </p>
                      <p className="text-[11px] font-mono text-slate-600">
                        Ref ID: <span className="font-bold text-slate-800">{reg.transaction_id || 'N/A'}</span>
                        {reg.bank_snapshot?.bank_name && (
                          <span className="text-slate-400 ml-2 font-sans">
                            • Account: {reg.bank_snapshot?.bank_name} ({reg.bank_snapshot?.bank_account_number})
                          </span>
                        )}
                      </p>
                      {reg.receipt_details && (
                        <p className="text-[11px] text-slate-500 italic">Notes: "{reg.receipt_details}"</p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-start md:self-center shrink-0">
                      {reg.receipt_file && (
                        <button
                          type="button"
                          onClick={() => setSelectedReceiptForPreview(reg)}
                          className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition cursor-pointer flex items-center gap-1"
                        >
                          <FileText size={13} /> View Slip
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleReviewReceipt(reg.id, reg.student_name, 'reject')}
                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReviewReceipt(reg.id, reg.student_name, 'approve')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer whitespace-nowrap"
                      >
                        Verify & Issue Ticket
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bulk Certificate Generation & Template Endorsements */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Award className="text-indigo-600" /> Certificate Engine & Endorsements
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Endorse presidential certificate designs and issue verified digital credentials.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSignatureModal(true)}
                className="text-xs font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 px-3 py-1.5 rounded-xl transition cursor-pointer self-start sm:self-auto flex items-center gap-1.5"
              >
                <ShieldCheck size={14} /> Specimen Signature
              </button>
            </div>

            {/* Pending Template Endorsements Queue */}
            {certificateTemplates.filter(t => t.status === 'pending_approval').length > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <AlertCircle size={14} className="text-amber-600" />
                  Awaiting Advisor Sign-off ({certificateTemplates.filter(t => t.status === 'pending_approval').length})
                </span>
                <div className="space-y-2">
                  {certificateTemplates.filter(t => t.status === 'pending_approval').map(tmpl => (
                    <div key={tmpl.id} className="p-3 bg-white border border-amber-200 rounded-xl flex items-center justify-between gap-3 shadow-sm">
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-slate-900 truncate">{tmpl.title}</h4>
                        <span className="text-[10px] text-slate-500 font-medium block">
                          By: {tmpl.created_by_name || 'Society President'} • {tmpl.event_title || 'Society Default'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedTemplateForReview(tmpl)}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer whitespace-nowrap flex items-center gap-1"
                      >
                        <Eye size={12} /> Review & Endorse
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Approved Templates Summary */}
            {certificateTemplates.filter(t => t.status === 'approved').length > 0 && (
              <div className="text-xs text-slate-500">
                <span className="font-bold text-slate-700">Active Approved Layouts: </span>
                {certificateTemplates.filter(t => t.status === 'approved').map(t => t.title).join(', ')}
              </div>
            )}

            {/* Event Issue List */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Approved Events Ready For Bulk Certification:
              </span>
              {events.filter(e => e.status === 'approved').length === 0 ? (
                <p className="text-slate-400 text-xs py-3 text-center">No approved events ready for issuance.</p>
              ) : (
                events.filter(e => e.status === 'approved').map(evt => {
                  const eventTemplate = certificateTemplates.find(t => t.event === evt.id && t.status === 'approved') ||
                                        certificateTemplates.find(t => t.status === 'approved');
                  return (
                    <div key={evt.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{evt.title}</h4>
                        <span className="text-[10px] text-slate-400 font-semibold">{new Date(evt.date).toLocaleDateString()}</span>
                        {eventTemplate && (
                          <span className="text-[10px] font-mono text-indigo-600 block mt-0.5">
                            Template: {eventTemplate.title}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleGenerateCerts(evt.id, eventTemplate?.id)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
                        >
                          Issue Bulk Certs
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteEventTarget(evt)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                          title="Delete Event"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* 3. PENDING CABINET APPROVALS */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-4">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Users className="text-violet-600" /> Pending Cabinet Role Verifications ({cabinet.length})
          </h2>

          {cabinet.length === 0 ? (
            <p className="text-slate-400 text-xs py-4">No pending cabinet nominations.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {cabinet.map(member => (
                <div key={member.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{member.username}</h4>
                    <p className="text-xs font-bold text-indigo-600">{member.role_title} ({member.term_year})</p>
                    <p className="text-[10px] font-medium text-slate-500 mt-0.5">
                      {member.society_name || assignedSocieties.find(s => s.id === member.society)?.name || ''}
                    </p>
                  </div>
                  <button
                    onClick={() => handleVerifyCabinet(member.id)}
                    className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Verify Role
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* INTEGRATED PAYMENT VERIFICATION & TICKETING SUITE */}
        <div className="mt-8 space-y-8 mb-8">
          <PaymentVerificationDesk events={events} />
          <ManualTicketingHub events={events} onTicketsIssued={fetchData} />
        </div>

      </div>

      {/* CREATE EVENT MODAL */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <h3 className="text-xl font-black text-slate-900 mb-1">Create Advisor Event</h3>
            <p className="text-xs text-slate-500 mb-5">Events created by the Faculty Advisor are published automatically subject to Date-Lock rule.</p>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              {assignedSocieties.length > 1 && (
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Target Society *</label>
                  <select
                    value={eventForm.society || society?.id || assignedSocieties[0]?.id || ''}
                    onChange={e => setEventForm({...eventForm, society: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    {assignedSocieties.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Event Title</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Distinguished Faculty Guest Lecture"
                  value={eventForm.title}
                  onChange={e => setEventForm({...eventForm, title: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Event overview, agenda, and requirements..."
                  value={eventForm.description}
                  onChange={e => setEventForm({...eventForm, description: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Date & Time</label>
                  <input
                    required
                    type="datetime-local"
                    value={eventForm.date}
                    onChange={e => setEventForm({...eventForm, date: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Campus Venue</label>
                  <select
                    value={eventForm.venue}
                    onChange={e => setEventForm({...eventForm, venue: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="">-- Select Venue --</option>
                    {venues.map(v => (
                      <option key={v.id} value={v.id}>{v.name} (Cap: {v.capacity})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={eventForm.is_paid}
                    onChange={e => setEventForm({...eventForm, is_paid: e.target.checked})}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  <span className="text-xs font-bold text-slate-800">Is this a Paid Event?</span>
                </label>

                {eventForm.is_paid && (
                  <div className="pt-2">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase">Registration Fee ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={eventForm.price}
                      onChange={e => setEventForm({...eventForm, price: e.target.value})}
                      className="w-32 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Publish Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POST ANNOUNCEMENT MODAL */}
      {showNewsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <h3 className="text-xl font-black text-slate-900 mb-1">Post Official Campus Announcement</h3>
            <p className="text-xs text-slate-500 mb-5">Broadcast important society news or notifications to all students on the Home page.</p>

            <form onSubmit={handlePostNews} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Announcement Title</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Schedule Change: Guest Seminar Moving to Hall B"
                  value={newsForm.title}
                  onChange={e => setNewsForm({...newsForm, title: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Content</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detailed announcement content..."
                  value={newsForm.content}
                  onChange={e => setNewsForm({...newsForm, content: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewsModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Broadcast News
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STATUTORY PROPOSAL VERIFICATION MODAL */}
      {selectedProposalForVerify && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
                  Statutory Sign-Off Verification
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-2">
                  {selectedProposalForVerify.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Reference: <span className="font-mono text-indigo-900 font-bold">{selectedProposalForVerify.proposal_doc_number || `PROP-2026-${selectedProposalForVerify.id}`}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedProposalForVerify(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Event Specs Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Date & Time</span>
                <span className="text-xs font-bold text-slate-800">{new Date(selectedProposalForVerify.date).toLocaleDateString()}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Venue</span>
                <span className="text-xs font-bold text-slate-800">{selectedProposalForVerify.venue_name || 'Auditorium'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Est. Budget</span>
                <span className="text-xs font-bold text-slate-800">PKR {parseFloat(selectedProposalForVerify.budget_estimate || 0).toFixed(2)}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Expected Turnout</span>
                <span className="text-xs font-bold text-slate-800">{selectedProposalForVerify.expected_attendees || 100} Delegates</span>
              </div>
            </div>

            {/* Agenda & Equipment */}
            <div className="space-y-3 mb-5">
              {selectedProposalForVerify.agenda && (
                <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100">
                  <h4 className="text-xs font-bold text-indigo-900 uppercase">Event Schedule & Agenda</h4>
                  <p className="text-xs text-slate-700 mt-1 whitespace-pre-wrap">{selectedProposalForVerify.agenda}</p>
                </div>
              )}
              {selectedProposalForVerify.chief_guest && (
                <p className="text-xs text-slate-600">
                  <strong>Chief Guest / Keynote:</strong> {selectedProposalForVerify.chief_guest}
                </p>
              )}
              {selectedProposalForVerify.equipment_needed && (
                <p className="text-xs text-slate-600">
                  <strong>Requisitioned Equipment:</strong> {selectedProposalForVerify.equipment_needed}
                </p>
              )}
            </div>

            {/* Physical Scanned Document Showcase */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 mb-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                  <FileText size={15} className="text-indigo-600" /> Uploaded Physical Sign-Off Document
                </h4>
                {selectedProposalForVerify.signed_proposal_doc && (
                  <MediaLink
                    href={selectedProposalForVerify.signed_proposal_doc}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    Open Full Document <ExternalLink size={12} />
                  </MediaLink>
                )}
              </div>

              {selectedProposalForVerify.signed_proposal_doc ? (
                <div className="mt-3">
                  <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 flex items-center justify-center">
                    <MediaImage
                      src={selectedProposalForVerify.signed_proposal_doc}
                      alt="Physical Sign-off Document"
                      className="max-h-64 object-contain rounded-lg shadow-sm"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <div style={{ display: 'none' }} className="p-6 text-center text-xs text-slate-500">
                      Document is hosted externally or is a PDF. <br/>
                      <MediaLink
                        href={selectedProposalForVerify.signed_proposal_doc}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 underline font-bold mt-2 inline-block"
                      >
                        Click to view external scanned document file
                      </MediaLink>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0 text-amber-600" />
                  <span>The Society President has submitted this proposal online but has <strong>not yet uploaded</strong> the scanned document containing the physical signatures from the Advisor, Chairman, and HOD.</span>
                </div>
              )}
            </div>

            {/* Verification Checklist */}
            <div className="bg-indigo-50/40 rounded-2xl p-5 border border-indigo-100 space-y-4 mb-6">
              <h4 className="text-xs font-black uppercase text-indigo-900 tracking-wider">
                Multi-Tier Verification & Approval Order
              </h4>
              <p className="text-xs text-slate-600">
                Confirm that the physical document contains the necessary stamps and endorsements:
              </p>

              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-indigo-300 transition">
                  <input
                    type="checkbox"
                    checked={verificationForm.advisor_approved}
                    onChange={(e) => setVerificationForm({...verificationForm, advisor_approved: e.target.checked})}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <div className="text-xs">
                    <strong className="text-slate-900 block font-bold">1. Society Faculty Advisor Endorsement</strong>
                    <span className="text-slate-500 text-[11px]">Academic merit and date scheduling confirmed.</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-indigo-300 transition">
                  <input
                    type="checkbox"
                    checked={verificationForm.chairman_approved}
                    onChange={(e) => setVerificationForm({...verificationForm, chairman_approved: e.target.checked})}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <div className="text-xs">
                    <strong className="text-slate-900 block font-bold">2. Department Chairman Clearance & Seal</strong>
                    <span className="text-slate-500 text-[11px]">Departmental venue, logistical equipment, and schedule lock approved.</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-indigo-300 transition">
                  <input
                    type="checkbox"
                    checked={verificationForm.hod_approved}
                    onChange={(e) => setVerificationForm({...verificationForm, hod_approved: e.target.checked})}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <div className="text-xs">
                    <strong className="text-slate-900 block font-bold">3. Head of Department (HOD) Final Sanction</strong>
                    <span className="text-slate-500 text-[11px]">Final institutional sanction order granted for campus event execution.</span>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Verification Notes / Administrative Remarks
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Scanned signatures verified against Departmental records. Hall reservation cleared."
                  value={verificationForm.verification_notes}
                  onChange={(e) => setVerificationForm({...verificationForm, verification_notes: e.target.value})}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedProposalForVerify(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveVerification('save')}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Save Progress
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveVerification('reject')}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Reject Proposal
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveVerification('approve')}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 size={15} /> Verify & Publish Live
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STATUTORY PROPOSAL DOCUMENT & SIGN-OFF MODAL */}
      {selectedProposalDoc && (
        <EventProposalDocumentModal
          proposal={selectedProposalDoc}
          currentUser={user}
          onClose={() => setSelectedProposalDoc(null)}
          onProposalUpdated={(updated) => {
            setProposals(prev => prev.map(p => p.id === updated.id ? updated : p));
            setSelectedProposalDoc(updated);
            fetchData();
          }}
        />
      )}

      {/* ADVISOR BANK ACCOUNT CONFIGURATION MODAL */}
      {showBankModal && society && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setShowBankModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <XCircle size={20} />
            </button>

            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <CreditCard className="text-amber-600" /> Configure Society Bank Credentials
              </h3>
              <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full">
                Active Version: v{society.bank_version || 1}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mb-3">
              Authorized Faculty Advisor settings for <strong className="text-slate-900">{society.name}</strong>. Modifications automatically increment the bank version and maintain an immutable audit log.
            </p>
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-[11px] text-amber-900 font-medium mb-4">
              <strong>Audit Notice:</strong> When updated, incoming 24-hour seat holds snapshot this exact configuration (v{(society.bank_version || 1) + 1}). Past registrations preserve their point-in-time bank version.
            </div>

            <form onSubmit={handleUpdateBankDetails} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Bank Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Standard Chartered / HBL"
                    value={bankForm.bank_name}
                    onChange={e => setBankForm({ ...bankForm, bank_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Account Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cyber Security Society"
                    value={bankForm.bank_account_title}
                    onChange={e => setBankForm({ ...bankForm, bank_account_title: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  IBAN / Account Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="PK36SCBL..."
                  value={bankForm.bank_account_number}
                  onChange={e => setBankForm({ ...bankForm, bank_account_number: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Payment Instructions & Proof Guidelines
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide guidance on acceptable receipts, 1Link / Raast reference numbers, and upload requirements."
                  value={bankForm.payment_instructions}
                  onChange={e => setBankForm({ ...bankForm, payment_instructions: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>

              {/* Payment QR Code Upload */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Payment QR Code (For Paid Events)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/png, image/jpeg"
                    onChange={(e) => setBankQrFile(e.target.files[0])}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  {(society?.payment_qr || society?.payment_qr_url) && (
                    <MediaImage src={getMediaUrl(society.payment_qr || society.payment_qr_url)} alt="Saved QR" className="w-10 h-10 rounded border bg-white p-0.5 object-contain shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Students will scan this via banking/wallet apps to pay ticket fees.</p>
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowBankModal(false)}
                  className="px-4 py-2.5 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/30 transition cursor-pointer"
                >
                  Save Official Bank Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADVISOR OFFICIAL SIGNATURE ASSET MODAL */}
      {showSignatureModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setShowSignatureModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <XCircle size={20} />
            </button>

            <h3 className="text-xl font-black text-slate-900 mb-1 flex items-center gap-2">
              <ShieldCheck className="text-violet-600" /> Faculty Advisor Official Signature
            </h3>
            <p className="text-xs text-slate-500 font-medium mb-5">
              Upload your official printed signature specimen. This specimen will be rendered exclusively on approved university certificates and verified event proposals.
            </p>

            <form onSubmit={handleSaveSignature} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Upload Image</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg, image/webp" 
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setSignatureImage(file);
                        setSignaturePreview(URL.createObjectURL(file));
                      }
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 border border-gray-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Quick sample preview */}
              {(signaturePreview || (typeof signatureImage === 'string' && signatureImage)) && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">Preview:</span>
                  <MediaImage src={signaturePreview || signatureImage} alt="Signature specimen" className="max-h-20 mx-auto object-contain" />
                </div>
              )}

              {signatures.length > 0 && (
                <div className="p-3 bg-violet-50 border border-violet-200 rounded-xl space-y-1">
                  <span className="text-[11px] font-bold text-violet-900 block">Existing Approved Signatures:</span>
                  {signatures.map(s => (
                    <div key={s.id} className="text-xs text-violet-700 flex items-center justify-between">
                      <span>{s.role_title} (ID #{s.id})</span>
                      <span className="text-[10px] bg-white px-2 py-0.5 rounded font-mono font-bold">Active</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSignatureModal(false)}
                  className="px-4 py-2.5 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-md shadow-violet-600/30 transition cursor-pointer"
                >
                  Save Signature Specimen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADVISOR TEMPLATE REVIEW & ENDORSEMENT MODAL */}
      {selectedTemplateForReview && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setSelectedTemplateForReview(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <Award className="text-amber-500" size={22} />
              <h3 className="text-xl font-black text-slate-900">Official Certificate Endorsement Review</h3>
            </div>
            <p className="text-xs text-slate-500 font-medium mb-5">
              Verify the typography, certification text, and how your official digital signature specimen will be rendered on student transcripts.
            </p>

            {/* Specimen Visual Preview */}
            <div 
              className="rounded-2xl p-6 bg-white shadow-md border-4 relative text-center min-h-[340px] flex flex-col justify-between my-2"
              style={{
                borderColor: selectedTemplateForReview.layout_json?.theme_color || '#1e1b4b',
                backgroundImage: 'radial-gradient(#e0e7ff 0.75px, transparent 0.75px), radial-gradient(#e0e7ff 0.75px, #ffffff 0.75px)',
                backgroundSize: '24px 24px'
              }}
            >
              <div className="pt-1">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center mx-auto text-amber-300 shadow border mb-1.5"
                  style={{ backgroundColor: selectedTemplateForReview.layout_json?.theme_color || '#1e1b4b' }}
                >
                  <Award size={22} />
                </div>
                <h4 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                  {selectedTemplateForReview.layout_json?.subtitle || 'DSMS Campus Network • Official Transcripts'}
                </h4>
                <h2 className="text-xl font-black uppercase text-slate-900 font-serif mt-0.5">
                  {selectedTemplateForReview.layout_json?.title || selectedTemplateForReview.title}
                </h2>
              </div>

              <div className="py-2 space-y-1">
                <span className="text-[10px] uppercase text-slate-400 font-bold">Awarded to</span>
                <h3 className="text-xl font-black text-slate-900 font-serif underline decoration-amber-500 decoration-1 underline-offset-4">
                  [ Sample Student Name • CS-2023-01 ]
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto pt-1 leading-relaxed">
                  {selectedTemplateForReview.layout_json?.body_text || 'has completed all practical evaluation requirements and demonstrated excellence in'}
                </p>
                <h4 className="text-sm font-black pt-1" style={{ color: selectedTemplateForReview.layout_json?.theme_color || '#1e1b4b' }}>
                  {selectedTemplateForReview.event_title || '[ Society Event Title ]'}
                </h4>
                <p className="text-[11px] font-bold text-slate-700">
                  Organized by {selectedTemplateForReview.society_name || society?.name}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 grid grid-cols-2 text-left items-end">
                <div className="space-y-1">
                  <div className="h-9 flex items-end">
                    {signatures[0]?.signature_image ? (
                      <MediaImage src={signatures[0].signature_image} alt="Advisor signature" className="h-8 max-w-[120px] object-contain" />
                    ) : (
                      <div className="font-serif italic text-xs text-slate-900 font-bold">
                        {user?.full_name || user?.username || 'Faculty Advisor'}
                      </div>
                    )}
                  </div>
                  <div className="w-28 h-0.5 bg-slate-300"></div>
                  <p className="text-[10px] font-extrabold uppercase text-slate-700">{user?.full_name || user?.username}</p>
                  <p className="text-[9px] text-slate-400">{selectedTemplateForReview.layout_json?.signatory_title_left || 'Faculty Advisor'}</p>
                </div>

                <div className="space-y-1 text-right">
                  <div className="h-9 flex items-end justify-end">
                    <div className="font-serif italic text-xs text-slate-900 font-bold">
                      [ Society President ]
                    </div>
                  </div>
                  <div className="w-28 h-0.5 bg-slate-300 ml-auto"></div>
                  <p className="text-[10px] font-extrabold uppercase text-slate-700">[ President Name ]</p>
                  <p className="text-[9px] text-slate-400">{selectedTemplateForReview.layout_json?.signatory_title_right || 'Society President'}</p>
                </div>
              </div>
            </div>

            {/* Endorsement Actions */}
            <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-500 font-medium">
                Submitted by: <strong>{selectedTemplateForReview.created_by_name || 'Society President'}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleRejectTemplate(selectedTemplateForReview.id)}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Request Revision
                </button>
                <button
                  type="button"
                  onClick={() => handleApproveTemplate(selectedTemplateForReview.id)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check size={14} /> Endorse & Approve Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT PREVIEW MODAL */}
      {selectedReceiptForPreview && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedReceiptForPreview(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <XCircle size={20} />
            </button>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 mb-1">
              <FileText className="text-indigo-600" /> Payment Slip Proof
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {selectedReceiptForPreview.student_name} • {selectedReceiptForPreview.event_title} (PKR {selectedReceiptForPreview.event_price})
            </p>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 mb-4">
              <p className="text-xs text-slate-700"><strong>Ref / Transaction ID:</strong> <span className="font-mono font-bold text-slate-900">{selectedReceiptForPreview.transaction_id || 'N/A'}</span></p>
              {selectedReceiptForPreview.receipt_details && (
                <p className="text-xs text-slate-600"><strong>Student Note:</strong> {selectedReceiptForPreview.receipt_details}</p>
              )}
              {selectedReceiptForPreview.receipt_file && (
                <div className="pt-2 text-center">
                  <MediaImage
                    src={getMediaUrl(selectedReceiptForPreview.receipt_file)}
                    alt="Receipt slip"
                    className="max-h-72 object-contain mx-auto rounded-xl border border-slate-200"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <div style={{ display: 'none' }} className="text-xs text-slate-500 p-4">
                    Receipt is hosted externally or in non-image format.<br/>
                    <MediaLink
                      href={getMediaUrl(selectedReceiptForPreview.receipt_file)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 underline font-bold mt-2 inline-block"
                    >
                      Open Full Document Link <ExternalLink size={12} className="inline" />
                    </MediaLink>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedReceiptForPreview(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleReviewReceipt(selectedReceiptForPreview.id, selectedReceiptForPreview.student_name, 'reject')}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Reject Slip
              </button>
              <button
                type="button"
                onClick={() => handleReviewReceipt(selectedReceiptForPreview.id, selectedReceiptForPreview.student_name, 'approve')}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 transition cursor-pointer"
              >
                Verify & Issue Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADVISOR PROFILE EDIT MODAL */}
      <ExecutiveProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onProfileUpdated={() => {
          showToast("Faculty Advisor profile and photo updated successfully!");
        }}
      />

      {/* Delete Event Confirmation Modal */}
      {deleteEventTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-rose-100 text-rose-600">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Delete Event</h3>
                <p className="text-xs text-slate-500">Permanent removal of event</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to permanently delete <strong className="text-slate-900 font-bold">"{deleteEventTarget.title}"</strong>? 
              This will release university date locks and remove all associated attendee passes. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeletingEvent}
                onClick={() => setDeleteEventTarget(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingEvent}
                onClick={handleDeleteEvent}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isDeletingEvent ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Yes, Delete Event
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Proposal Confirmation Modal */}
      {deleteProposalTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-rose-100 text-rose-600">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Delete Event Proposal</h3>
                <p className="text-xs text-slate-500">{deleteProposalTarget.proposal_no}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to delete proposal <strong className="text-slate-900 font-bold">"{deleteProposalTarget.event_title || deleteProposalTarget.title}"</strong>? 
              This will release any provisional date reservations on the campus calendar.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeletingProposal}
                onClick={() => setDeleteProposalTarget(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingProposal}
                onClick={handleDeleteProposal}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isDeletingProposal ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Yes, Delete Proposal
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdvisorDashboard;
