import { MediaImage, MediaLink } from '../../components/common/AuthenticatedMedia';
import React, { useContext, useEffect, useState, useRef } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { 
  Ticket, FileText, CheckCircle, Clock, Star, Award, 
  Calendar, ShieldCheck, Download, ExternalLink, QrCode, 
  UserCheck, AlertCircle, ArrowRight, Printer, Sparkles,
  User, Mail, Phone, GraduationCap, Building, Edit3,
  Check, X, Landmark, MapPin, BadgeCheck, Copy,
  UploadCloud, CreditCard, AlertTriangle, Lock, Loader2
} from 'lucide-react';
import api from '../../utils/api';
import QRCode from 'react-qr-code';
import { Link } from 'react-router-dom';
import { toPng, toJpeg } from 'html-to-image';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import CertificateModal from '../../components/modals/CertificateModal';
import CompleteProfileModal from '../../components/modals/CompleteProfileModal';
import ImageUploader from '../../components/common/ImageUploader';
import StudentDigitalWallet from '../../components/membership/StudentDigitalWallet';
import { getMediaUrl, handleImageError } from '../../utils/media';
import { 
  FACULTIES, 
  DEPARTMENTS, 
  FACULTY_CATALOG, 
  ACADEMIC_CATALOG, 
  getDepartmentsForFaculty, 
  getProgramsForDepartment, 
  getProgramsForFaculty, 
  getAllPrograms,
  findDepartmentAndFacultyForProgram, 
  findFacultyForDepartment 
} from '../../utils/academicCatalog';

const TicketCard = ({ selectedTicket, type, userAvatar, defaultAvatar, displayName, profile }) => {
  const isExpired = Boolean(selectedTicket?.is_expired || (selectedTicket?.event_date && new Date(selectedTicket.event_date) < new Date()));
  return (
  <div className="bg-white rounded-3xl w-[800px] shadow-xl overflow-hidden relative flex flex-row border border-slate-200 shrink-0 mx-auto">
    {/* Left Side: Header & Info */}
    <div className="flex-1 flex flex-col">
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-700 text-white p-6 relative flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-2">
          {selectedTicket.society_logo && (
            <MediaImage
              src={getMediaUrl(selectedTicket.society_logo)}
              onError={handleImageError}
              alt={selectedTicket.society_name}
              className="w-7 h-7 rounded-lg object-cover border border-white/20"
            />
          )}
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200 bg-white/20 px-2.5 py-0.5 rounded-full">
            {type}
          </span>
          {isExpired ? (
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-200 bg-rose-950/80 px-2.5 py-0.5 rounded-full border border-rose-500/40">
              {selectedTicket.attendance_status ? 'Concluded (Attended)' : 'Expired (Event Concluded)'}
            </span>
          ) : (
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-400/30">
              {selectedTicket.attendance_status ? 'Checked In ✓' : 'Confirmed'}
            </span>
          )}
        </div>
        <div>
          <h2 className="text-2xl sm:text-3xl font-black leading-snug">
            {selectedTicket.event_title}
          </h2>
          <p className="text-sm text-indigo-200 font-bold mt-1">
            Hosted by {selectedTicket.society_name}
          </p>
        </div>
      </div>
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-indigo-500/40 bg-slate-200 shrink-0">
            <MediaImage
              src={selectedTicket.student_avatar || userAvatar}
              alt={selectedTicket.student_name || displayName}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = defaultAvatar; }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Registered Participant</span>
            <h4 className="text-lg font-black text-slate-900 truncate">
              {selectedTicket.student_name || displayName}
            </h4>
            <div className="text-xs text-slate-500 font-medium space-y-0.5 mt-0.5">
              <p className="font-mono text-slate-700 font-bold">
                Roll No: {selectedTicket.student_roll_number || profile?.roll_number || 'FA22-BCS-042'}
              </p>
              <p className="truncate text-slate-500">
                {selectedTicket.student_program || profile?.program || 'BS Computer Science'}
              </p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Date & Time</span>
            <span className="font-bold text-slate-800 block mt-0.5">
              {selectedTicket.event_date ? new Date(selectedTicket.event_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Event Scheduled'}
            </span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Event Venue</span>
            <span className="font-bold text-slate-800 block mt-0.5">
              {selectedTicket.event_venue || 'Main Campus Auditorium'}
            </span>
          </div>
        </div>
      </div>
    </div>
    
    {/* Perforation */}
    <div className="flex flex-col items-center justify-between relative bg-slate-100/50 px-2 py-4 border-l-2 border-dashed border-slate-300">
      <div className="w-5 h-5 bg-white rounded-full absolute -top-2.5 -left-[11px] shadow-inner"></div>
      <div className="w-5 h-5 bg-white rounded-full absolute -bottom-2.5 -left-[11px] shadow-inner"></div>
    </div>

    {/* Right Side: QR & Tier */}
    <div className="w-64 bg-slate-50 p-6 flex flex-col items-center justify-center space-y-6">
      <div className="text-center">
        <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Ticket Tier</span>
        <span className="font-black text-indigo-600 block text-sm">
          {selectedTicket.event_price > 0 ? `Paid Pass (PKR ${selectedTicket.event_price})` : 'Free General Admission'}
        </span>
      </div>
      <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <QRCode
          value={selectedTicket.ticket_qr_code
            ? `${window.location.origin}/verify/ticket/${selectedTicket.ticket_qr_code}`
            : 'INVALID-TICKET'}
          size={120}
        />
      </div>
      <div className="text-center">
        <p className="text-[10px] font-mono font-bold text-slate-500">
          REF: {selectedTicket.ticket_qr_code}
        </p>
        {isExpired && !selectedTicket.attendance_status && (
          <span className="mt-1 inline-block text-[9px] font-black uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded border border-rose-300">
            Admittance Expired
          </span>
        )}
      </div>
    </div>
  </div>
  );
};


const StudentDashboard = () => {
  const { user, updateUser } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [volunteerHours, setVolunteerHours] = useState([]);
  const [applications, setApplications] = useState([]);
  const [assignedDuties, setAssignedDuties] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedCert, setSelectedCert] = useState(null);
  const [selectedMembershipCard, setSelectedMembershipCard] = useState(null);
  const [showCompleteProfileModal, setShowCompleteProfileModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    father_name: '',
    email: '',
    roll_number: '',
    program: '',
    department: '',
    faculty_name: '',
    phone_number: '',
    gender: '',
    avatar_url: ''
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Change Password state (inside profile modal)
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [changePwForm, setChangePwForm] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [changePwLoading, setChangePwLoading] = useState(false);
  const [changePwError, setChangePwError] = useState(null);
  const [changePwSuccess, setChangePwSuccess] = useState(false);

  // Feedback modal
  const [showFeedbackModal, setShowFeedbackModal] = useState(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // Phase 4: Seat Hold & Receipt Upload Modal
  const [selectedHoldReg, setSelectedHoldReg] = useState(null);
  const [receiptForm, setReceiptForm] = useState({
    transaction_id: '',
    receipt_details: '',
    receipt_file: ''
  });
  const [receiptSubmitting, setReceiptSubmitting] = useState(false);
  const [receiptToast, setReceiptToast] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  const formatTimeRemaining = (seconds, heldUntil) => {
    if (seconds !== null && seconds !== undefined) {
      if (seconds <= 0) return 'Expired';
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      return `${hrs}h ${mins}m left`;
    }
    if (heldUntil) {
      const diff = Math.floor((new Date(heldUntil) - new Date()) / 1000);
      if (diff <= 0) return 'Expired';
      const hrs = Math.floor(diff / 3600);
      const mins = Math.floor((diff % 3600) / 60);
      return `${hrs}h ${mins}m left`;
    }
    return '24h Hold';
  };

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleOpenHoldModal = (reg) => {
    setSelectedHoldReg(reg);
    setReceiptForm({
      transaction_id: reg.transaction_id || '',
      receipt_details: reg.receipt_details || '',
      receipt_file: reg.receipt_file || ''
    });
  };

  const handleUploadReceipt = async (e) => {
    e.preventDefault();
    if (!selectedHoldReg) return;
    setReceiptSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('transaction_id', receiptForm.transaction_id);
      formData.append('receipt_details', receiptForm.receipt_details || '');
      if (receiptForm.receipt_file instanceof File) {
        formData.append('receipt_file', receiptForm.receipt_file);
      } else if (receiptForm.receipt_file) {
        formData.append('receipt_file', receiptForm.receipt_file);
      }
      const res = await api.post(`registrations/${selectedHoldReg.id}/upload_receipt/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setRegistrations(prev => prev.map(r => r.id === selectedHoldReg.id ? res.data.registration : r));
      setSelectedHoldReg(null);
      setReceiptForm({ transaction_id: '', receipt_details: '', receipt_file: null });
      setReceiptToast('Payment proof submitted successfully! Reviewer will verify against the bank ledger.');
      setTimeout(() => setReceiptToast(null), 4500);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit payment receipt.');
    } finally {
      setReceiptSubmitting(false);
    }
  };

  const isFetchingVaultRef = useRef(false);

  useEffect(() => {
    fetchProfileAndVaultData();

    const handleSync = (e) => {
      // Avoid refetching when updating own profile or uploading files to prevent race conditions
      if (e?.detail?.url?.includes('auth/profile/') || e?.detail?.url?.includes('upload')) return;
      fetchProfileAndVaultData(true);
    };

    window.addEventListener('dsms:data_synced', handleSync);
    return () => {
      window.removeEventListener('dsms:data_synced', handleSync);
    };
  }, []);

  const fetchProfileAndVaultData = async (isBackground = false) => {
    if (isFetchingVaultRef.current) return;
    isFetchingVaultRef.current = true;
    if (!isBackground) {
      setLoading(true);
    }
    try {
      const [profRes, regRes, certRes, memRes, volRes, appRes, dutyRes] = await Promise.allSettled([
        api.get('auth/profile/'),
        api.get('registrations/'),
        api.get('certificates/'),
        api.get('memberships/'),
        api.get('volunteer-hours/'),
        api.get('applications/'),
        api.get('staff-assignments/')
      ]);

      if (profRes.status === 'fulfilled') {
        const p = profRes.value.data;
        setProfile(p);
        // Only initialize editForm if modal is NOT open, to avoid overwriting ongoing user edits
        setShowEditProfileModal(isOpen => {
          if (!isOpen) {
            setEditForm({
              first_name: p.first_name || '',
              last_name: p.last_name || '',
              father_name: p.father_name || '',
              email: p.email || '',
              roll_number: p.roll_number || '',
              program: p.program || '',
              department: p.department || '',
              faculty_name: p.faculty_name || '',
              phone_number: p.phone_number || '',
              gender: p.gender || '',
              avatar_url: p.avatar_url || p.profile_photo_url || ''
            });
          }
          return isOpen;
        });
      }
      if (regRes.status === 'fulfilled') setRegistrations(regRes.value.data);
      if (certRes.status === 'fulfilled') setCertificates(certRes.value.data);
      if (memRes.status === 'fulfilled') setMemberships(memRes.value.data);
      if (volRes.status === 'fulfilled') setVolunteerHours(volRes.value.data);
      if (appRes.status === 'fulfilled') setApplications(appRes.value.data);
      if (dutyRes.status === 'fulfilled') {
        const duties = Array.isArray(dutyRes.value.data) ? dutyRes.value.data : [];
        setAssignedDuties(duties.filter(d => ['assigned', 'accepted'].includes(d.status)));
      }
      if (profRes.status === 'fulfilled') {
        const p = profRes.value.data;
        const isIncomplete = !p.first_name || !p.last_name || !p.department || !p.program || !p.phone_number || !p.cnic;
        if (isIncomplete && !sessionStorage.getItem('profileModalDismissed')) {
          setShowCompleteProfileModal(true);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!isBackground) {
        setLoading(false);
      }
      isFetchingVaultRef.current = false;
    }
  };

  const handleCloseCompleteProfile = () => {
    setShowCompleteProfileModal(false);
    sessionStorage.setItem('profileModalDismissed', 'true');
  };

  const handleOpenEditProfile = () => {
    if (profile) {
      let resolvedDept = profile.department || '';
      let resolvedFaculty = profile.faculty_name || '';
      if (profile.program && (!resolvedDept || !resolvedFaculty)) {
        const resolved = findDepartmentAndFacultyForProgram(profile.program);
        if (resolved) {
          if (!resolvedDept) resolvedDept = resolved.department;
          if (!resolvedFaculty) resolvedFaculty = resolved.faculty;
        }
      }
      if (!resolvedFaculty && resolvedDept) {
        resolvedFaculty = findFacultyForDepartment(resolvedDept) || '';
      }

      setEditForm({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        father_name: profile.father_name || '',
        email: profile.email || '',
        roll_number: profile.roll_number || '',
        program: profile.program || '',
        department: resolvedDept,
        faculty_name: resolvedFaculty,
        phone_number: profile.phone_number || '',
        gender: profile.gender || '',
        avatar_url: profile.avatar_url || profile.profile_photo_url || ''
      });
    }
    setShowEditProfileModal(true);
  };

  // Available departments based on selected faculty in profile edit
  const availableEditDepartments = React.useMemo(() => {
    if (editForm.faculty_name && FACULTY_CATALOG[editForm.faculty_name]) {
      return Object.keys(FACULTY_CATALOG[editForm.faculty_name]);
    }
    return DEPARTMENTS;
  }, [editForm.faculty_name]);

  // Available programs based on selected department or faculty in profile edit
  const availableEditPrograms = React.useMemo(() => {
    if (editForm.department && ACADEMIC_CATALOG[editForm.department]) {
      return ACADEMIC_CATALOG[editForm.department];
    }
    if (editForm.faculty_name && FACULTY_CATALOG[editForm.faculty_name]) {
      return getProgramsForFaculty(editForm.faculty_name);
    }
    return getAllPrograms();
  }, [editForm.department, editForm.faculty_name]);

  // If faculty is selected first, narrow departments without auto-selecting department or program
  const handleEditFacultyChange = (newFaculty) => {
    if (!newFaculty) {
      setEditForm(prev => ({ ...prev, faculty_name: '' }));
      return;
    }
    const deptsInFaculty = getDepartmentsForFaculty(newFaculty);
    const keepDept = deptsInFaculty.includes(editForm.department);
    const progsInFaculty = getProgramsForFaculty(newFaculty);
    const keepProg = keepDept && progsInFaculty.includes(editForm.program);

    setEditForm(prev => ({
      ...prev,
      faculty_name: newFaculty,
      department: keepDept ? prev.department : '',
      program: keepProg ? prev.program : ''
    }));
  };

  // If department is selected, auto-align faculty and narrow programs
  const handleEditDepartmentChange = (newDept) => {
    if (!newDept) {
      setEditForm(prev => ({ ...prev, department: '', program: '' }));
      return;
    }
    const parentFaculty = findFacultyForDepartment(newDept);
    const progsInDept = getProgramsForDepartment(newDept);
    const keepProg = progsInDept.includes(editForm.program);

    setEditForm(prev => ({
      ...prev,
      department: newDept,
      faculty_name: parentFaculty || prev.faculty_name,
      program: keepProg ? prev.program : ''
    }));
  };

  // If program is selected, AUTOMATICALLY select its Department and Faculty!
  const handleEditProgramChange = (newProg) => {
    if (!newProg) {
      setEditForm(prev => ({ ...prev, program: '' }));
      return;
    }
    const resolved = findDepartmentAndFacultyForProgram(newProg);
    if (resolved) {
      setEditForm(prev => ({
        ...prev,
        program: resolved.program || newProg,
        department: resolved.department,
        faculty_name: resolved.faculty
      }));
    } else {
      setEditForm(prev => ({ ...prev, program: newProg }));
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        ...editForm,
        avatar_url: editForm.avatar_url,
        profile_photo_url: editForm.avatar_url
      };
      const res = await api.patch('auth/profile/', payload);
      setProfile(res.data);
      if (updateUser) {
        updateUser(res.data);
      }
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setShowEditProfileModal(false);
      }, 1500);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update profile details.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAcceptVolunteer = async (volunteerId) => {
    try {
      const res = await api.post(`volunteer-hours/${volunteerId}/accept/`);
      setVolunteerHours(prev => prev.map(item => item.id === volunteerId ? res.data.volunteer : item));
    } catch (err) {
      alert(err.response?.data?.error || 'Could not accept this volunteer role.');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangePwError(null);
    if (changePwForm.new_password.length < 6) {
      setChangePwError('New password must be at least 6 characters.');
      return;
    }
    if (changePwForm.new_password !== changePwForm.confirm_password) {
      setChangePwError('New password and confirmation do not match.');
      return;
    }
    setChangePwLoading(true);
    try {
      await api.post('auth/change-password/', {
        current_password: changePwForm.old_password,
        new_password: changePwForm.new_password
      });
      setChangePwSuccess(true);
      setChangePwForm({ old_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => { setChangePwSuccess(false); setShowChangePassword(false); }, 2000);
    } catch (err) {
      setChangePwError(err.response?.data?.error || 'Failed to update password.');
    } finally {
      setChangePwLoading(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!showFeedbackModal) return;
    try {
      await api.post('feedbacks/', {
        event: showFeedbackModal.event,
        rating: feedbackRating,
        comment: feedbackComment
      });
      setFeedbackSuccess(true);
      setTimeout(() => {
        setFeedbackSuccess(false);
        setShowFeedbackModal(null);
        setFeedbackComment('');
      }, 2000);
    } catch (err) {
      alert("Failed to submit feedback.");
    }
  };

  const ticketRef = useRef(null);
  const [downloadingTicketPDF, setDownloadingTicketPDF] = useState(false);

  const printTicket = () => {
    document.body.classList.add('printing-ticket-mode');
    const handleAfterPrint = () => {
      document.body.classList.remove('printing-ticket-mode');
      window.removeEventListener('afterprint', handleAfterPrint);
    };
    window.addEventListener('afterprint', handleAfterPrint);
    window.print();
  };

  const downloadTicketImage = async (format) => {
    if (!ticketRef.current) return;
    try {
      let dataUrl = null;
      const convert = format === 'png' ? toPng : toJpeg;
      try {
        dataUrl = await convert(ticketRef.current, { quality: 0.95, pixelRatio: 2.5, cacheBust: true });
      } catch (err1) {
        console.warn("toPng failed, falling back to html2canvas:", err1);
        const canvas = await html2canvas(ticketRef.current, {
          scale: 2.5,
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff'
        });
        dataUrl = canvas.toDataURL(format === 'png' ? 'image/png' : 'image/jpeg', 0.95);
      }
      const link = document.createElement('a');
      link.download = `event-ticket-${selectedTicket?.ticket_number || selectedTicket?.ticket_qr_code || 'pass'}.${format}`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Image export error", err);
      alert(`Failed to export ticket as ${format.toUpperCase()}`);
    }
  };

  const downloadTicketPDF = async () => {
    if (!ticketRef.current) return;
    try {
      setDownloadingTicketPDF(true);
      let dataUrl = null;
      try {
        dataUrl = await toPng(ticketRef.current, {
          quality: 0.98,
          pixelRatio: 2.5,
          cacheBust: true,
          style: { transform: 'none', margin: '0' }
        });
      } catch (err1) {
        console.warn("toPng failed for ticket, falling back to html2canvas:", err1);
        const canvas = await html2canvas(ticketRef.current, {
          scale: 2.5,
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff'
        });
        dataUrl = canvas.toDataURL('image/png');
      }

      if (!dataUrl) throw new Error("Could not capture ticket image");

      const pdf = new jsPDF('l', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(dataUrl);
      const pageWidth = pdf.internal.pageSize.getWidth();   // 297mm
      const pageHeight = pdf.internal.pageSize.getHeight(); // 210mm

      let renderWidth = pageWidth - 20; // 10mm padding on sides
      let renderHeight = (imgProps.height * renderWidth) / imgProps.width;

      if (renderHeight > (pageHeight - 20)) {
        renderHeight = pageHeight - 20;
        renderWidth = (imgProps.width * renderHeight) / imgProps.height;
      }

      const xOffset = Math.max(0, (pageWidth - renderWidth) / 2);
      const yOffset = Math.max(0, (pageHeight - renderHeight) / 2);

      pdf.addImage(dataUrl, 'PNG', xOffset, yOffset, renderWidth, renderHeight);
      pdf.save(`event-ticket-${selectedTicket?.ticket_number || selectedTicket?.ticket_qr_code || 'pass'}.pdf`);
    } catch (err) {
      console.error("PDF export error", err);
      alert("Failed to export ticket as PDF. Please try the Print option.");
    } finally {
      setDownloadingTicketPDF(false);
    }
  };

  const totalVolHours = volunteerHours.reduce((sum, v) => sum + parseFloat(v.hours || 0), 0);

  // Participant fallback image
  const defaultAvatar = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80";
  const userAvatar = profile?.avatar_url || profile?.profile_photo_url || user?.avatar_url || user?.profile_photo_url || defaultAvatar;
  const displayName = profile?.full_name || (profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : profile?.username) || 'Student';

  const isProfileIncomplete = profile && (
    !profile.first_name || !profile.last_name || !profile.department || 
    !profile.program || !profile.phone_number || !profile.cnic
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-bold text-slate-500 animate-pulse tracking-widest uppercase">Initializing Student Profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Profile Completion Banner */}
        {isProfileIncomplete && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 rounded-xl text-amber-600 mt-0.5">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-amber-800 font-bold text-sm">Action Required: Complete Your Profile</h3>
                <p className="text-amber-700/80 text-xs mt-0.5">Your profile is missing important details like your name, department, or CNIC. Please update it to access all portal features.</p>
              </div>
            </div>
            <button 
              onClick={() => setShowCompleteProfileModal(true)}
              className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition"
            >
              Complete Profile Now
            </button>
          </div>
        )}

        {/* Complete Profile Modal */}
        {showCompleteProfileModal && (
          <CompleteProfileModal 
            profile={profile} 
            onClose={handleCloseCompleteProfile}
            onProfileUpdated={() => {
              fetchProfileAndVaultData();
            }}
          />
        )}

        {/* 1. STUDENT PROFILE HEADER CARD */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50/60 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Profile Image / Avatar with status ring */}
              <div className="relative group">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-slate-100 flex-shrink-0">
                  <MediaImage
                    src={userAvatar}
                    alt={displayName}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    onError={(e) => { e.target.src = defaultAvatar; }}
                  />
                </div>
                <button
                  onClick={handleOpenEditProfile}
                  className="absolute -bottom-2 -right-2 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-md transition cursor-pointer"
                  title="Update Profile & Avatar"
                >
                  <Edit3 size={14} />
                </button>
              </div>

              {/* Student Details */}
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
                    My Profile
                  </span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full inline-flex items-center gap-1">
                    <BadgeCheck size={14} className="text-emerald-500" /> Verified Student ID
                  </span>
                  {/* Society Designations — show role from each active membership */}
                  {memberships.filter(m => m.role_title && m.role_title !== 'General Member').map(m => (
                    <span key={m.id} className="text-xs font-bold text-violet-700 bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-full inline-flex items-center gap-1.5">
                      {m.society_logo && (
                        <MediaImage
                          src={getMediaUrl(m.society_logo)}
                          onError={handleImageError}
                          alt={m.society_name}
                          className="w-3.5 h-3.5 rounded-sm object-cover"
                        />
                      )}
                      {m.role_title} · {m.society_name}
                    </span>
                  ))}
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {displayName}
                </h1>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium pt-1">
                  <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg">
                    Roll No: {profile?.roll_number || 'FA22-BCS-042'}
                  </span>
                  {profile?.gender && (
                    <span className="flex items-center gap-1 text-slate-600 capitalize">
                      <User size={13} className="text-slate-400" /> {profile.gender}
                    </span>
                  )}
                  {profile?.father_name && (
                    <span className="flex items-center gap-1 text-slate-600">
                      <span className="text-slate-400 font-normal">S/D of</span> {profile.father_name}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-slate-600">
                    <GraduationCap size={15} className="text-indigo-500" />
                    {profile?.program || 'BS Computer Science'}
                  </span>
                  <span className="flex items-center gap-1 text-slate-600">
                    <Building size={14} className="text-slate-400" />
                    {profile?.department || 'Department of Computer Science'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium pt-1">
                  <span className="flex items-center gap-1 text-slate-600">
                    <Mail size={14} className="text-slate-400" />
                    {profile?.email || 'student@university.edu'}
                  </span>
                  <span className="flex items-center gap-1 text-slate-600">
                    <Phone size={14} className="text-slate-400" />
                    {profile?.phone_number || '+92 300 8765432'}
                  </span>
                  <span className="text-indigo-600 font-semibold">
                    {profile?.faculty_name || 'Faculty of Computing & Information Technology'}
                  </span>
                </div>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleOpenEditProfile}
                className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Edit3 size={15} /> Edit Student Profile
              </button>
              <Link
                to="/student/transcript"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition hover:-translate-y-0.5 cursor-pointer"
              >
                <FileText size={15} /> Co-Curricular Transcript
              </Link>
            </div>
          </div>
        </div>

        {/* METRICS SUMMARY */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Event Passes', count: registrations.length, sub: `${registrations.filter(r => r.attendance_status).length} Attended`, color: 'text-indigo-600', icon: Ticket },
            { label: 'Society Memberships', count: memberships.length, sub: 'Accredited Member Cards', color: 'text-violet-600', icon: ShieldCheck },
            { label: 'Volunteer Service', count: `${totalVolHours.toFixed(1)} hrs`, sub: 'Faculty Approved', color: 'text-emerald-600', icon: Clock },
            { label: 'Verified Certificates', count: certificates.length, sub: 'Official Digital Transcripts', color: 'text-amber-600', icon: Award },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">{stat.label}</span>
                  <p className={`text-2xl font-black mt-1 ${stat.color}`}>{stat.count}</p>
                  <span className="text-[10px] text-slate-400 font-bold block mt-1">{stat.sub}</span>
                </div>
                <div className="p-3 bg-slate-50 text-slate-600 rounded-2xl">
                  <Icon size={20} />
                </div>
              </div>
            );
          })}
        </div>

        {/* ASSIGNED DUTIES (EVENT CHECK-IN VOLUNTEER PASS) */}
        {assignedDuties.length > 0 && (
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none -mr-20 -mt-20"></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                  <QrCode size={14} /> Official Volunteer Assignment
                </div>
                <h2 className="text-2xl font-black tracking-tight">
                  You are an Appointed Gate Check-in Officer
                </h2>
                <p className="text-sm text-white/90 max-w-2xl leading-relaxed">
                  You have been authorized by society leadership to scan attendee tickets and verify student identity at the designated venue gate.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3">
                  {assignedDuties.map((duty) => (
                    <div key={duty.id} className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-bold bg-white/25 px-2 py-0.5 rounded text-white">
                          {duty.gate_name || 'Gate 1'}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1">
                          <CheckCircle size={12} /> Active Duty
                        </span>
                      </div>
                      <p className="font-extrabold text-white text-sm line-clamp-1">{duty.event_title || `Event #${duty.event}`}</p>
                      <p className="text-[11px] text-white/80">
                        {duty.duty_start ? new Date(duty.duty_start).toLocaleDateString() : 'Scheduled Event Window'}
                      </p>
                      <Link
                        to={`/attendance?event=${duty.event}`}
                        className="mt-2 w-full py-2 bg-white text-orange-700 hover:bg-orange-50 font-black text-xs rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <QrCode size={14} /> Launch Scanner
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. DIGITAL WALLET & MEMBERSHIP CARDS */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
          {(() => {
            const approvedMemberships = (memberships || []).filter(m => m.status === 'active' && m.is_active);
            const pendingMemberships = (memberships || []).filter(m => m.status === 'pending');

            return (
              <>
                <StudentDigitalWallet 
                  currentUser={{ 
                    ...user, 
                    ...profile,
                    name: profile?.full_name || profile?.name || user?.full_name || user?.name || user?.username,
                    roll_number: profile?.roll_number || user?.roll_number || 'N/A',
                    is_cabinet_member: Boolean(
                      profile?.is_cabinet_member || user?.is_cabinet_member ||
                      (profile?.cabinet_positions && profile.cabinet_positions.some(c => c.is_active && c.is_verified)) ||
                      (user?.cabinet_positions && user.cabinet_positions.some(c => c.is_active && c.is_verified))
                    ),
                    cabinet_role: profile?.cabinet_role || user?.cabinet_role || '',
                    cabinet_society_name: profile?.cabinet_society_name || user?.cabinet_society_name || profile?.society_name || user?.society_name || '',
                    cabinet_society_logo: profile?.cabinet_society_logo || user?.cabinet_society_logo || profile?.society_logo || user?.society_logo || ''
                  }} 
                  memberships={approvedMemberships} 
                  onCardClick={setSelectedMembershipCard}
                />

                {/* PENDING MEMBERSHIP APPLICATIONS UNDER REVIEW */}
                {pendingMemberships.length > 0 && (
                  <div className="mt-6 p-5 sm:p-6 bg-gradient-to-r from-amber-50/80 to-orange-50/80 border border-amber-200/90 rounded-2xl">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold shrink-0">
                        ⏳
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <h4 className="text-sm font-black text-slate-900">
                            Pending Society Membership Applications ({pendingMemberships.length})
                          </h4>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100/80 px-2.5 py-0.5 rounded-full self-start">
                            Awaiting Leadership Review
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
                          Your membership application has been received. Official student membership cards and verification QR codes are generated and unlocked in your Digital Wallet once approved by the Society President or Faculty Advisor.
                        </p>

                        <div className="mt-3.5 space-y-2">
                          {pendingMemberships.map(pm => (
                            <div key={pm.id} className="p-3 bg-white/90 border border-amber-200/70 rounded-xl flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2.5">
                                {pm.society_logo ? (
                                  <img src={pm.society_logo} alt={pm.society_name} className="w-7 h-7 rounded-lg object-cover border border-amber-100" />
                                ) : (
                                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-[10px]">
                                    {pm.society_name?.substring(0, 2).toUpperCase() || 'DS'}
                                  </div>
                                )}
                                <div>
                                  <span className="font-bold text-slate-900 block">{pm.society_name}</span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    Ref: {pm.membership_id || `REQ-${pm.id}`} • Applied {pm.applied_at ? new Date(pm.applied_at).toLocaleDateString() : 'Recently'}
                                  </span>
                                </div>
                              </div>

                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                                Review in Progress
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {/* 3. EVENT QR TICKETS & BOARDING PASSES (COMPLETE WITH ALL USER & EVENT DETAILS + DOWNLOAD) */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Ticket className="text-indigo-600" size={24} />
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Event Entry Passes & QR Tickets ({registrations.length})
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Official digital event tickets with complete participant information and scannable check-in barcodes.
              </p>
            </div>
            <Link
              to="/events"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3.5 py-1.5 rounded-xl self-start sm:self-auto"
            >
              Browse Campus Events →
            </Link>
          </div>

          {registrations.length === 0 ? (
            <div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 text-xs">
              <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-600 text-sm">No Event Registrations Yet</p>
              <p className="mt-1">Register for workshops, hackathons, and seminars on the campus events page.</p>
              <Link to="/events" className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs">
                Explore Events
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {registrations.map(reg => {
                const isAttended = reg.attendance_status;
                const status = reg.payment_status;
                const isHeld = status === 'held';
                const isPending = status === 'pending';
                const isVerified = status === 'verified';
                const isRejected = status === 'rejected';
                const isHoldExpired = status === 'expired';
                const isEventPast = Boolean(reg.is_expired || (reg.event_date && new Date(reg.event_date) < new Date()));

                return (
                  <div 
                    key={reg.id} 
                    className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Ticket Badge */}
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          isAttended ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          (isEventPast && isVerified) ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                          isVerified ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                          isHeld ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                          isPending ? 'bg-sky-100 text-sky-800 border border-sky-200' :
                          isRejected ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {isAttended ? (isEventPast ? 'Attended ✓ (Concluded)' : 'Attended ✓') :
                           (isEventPast && isVerified) ? 'Expired (Event Concluded)' :
                           isVerified ? 'Valid Pass' :
                           isHeld ? `Seat Held (${formatTimeRemaining(reg.seconds_remaining, reg.held_until)})` :
                           isPending ? 'Proof Under Review' :
                           isRejected ? 'Payment Rejected' :
                           'Hold Expired'}
                        </span>

                        <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                          {reg.event_price > 0 ? `PKR ${reg.event_price}` : 'Free'}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-base line-clamp-1">
                        {reg.event_title}
                      </h3>
                      <p className="text-xs text-indigo-600 font-bold mt-0.5">
                        {reg.society_name}
                      </p>

                      <div className="mt-3 space-y-1.5 text-xs text-slate-500 font-medium">
                        <p className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-slate-400" />
                          {reg.event_date ? new Date(reg.event_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Event Day'}
                        </p>
                        <p className="flex items-center gap-1.5">
                          <MapPin size={13} className="text-slate-400" />
                          {reg.event_venue || 'Main Campus Auditorium'}
                        </p>
                        <p className="flex items-center gap-1.5">
                          <User size={13} className="text-slate-400" />
                          {reg.student_name || displayName} ({reg.student_roll_number || profile?.roll_number || 'Student'})
                        </p>
                      </div>

                      {/* Phase 4 Status Banners */}
                      {isHeld && (
                        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-2xl space-y-1">
                          <div className="flex items-center justify-between text-amber-900 text-[11px] font-black">
                            <span className="flex items-center gap-1">
                              <Clock size={12} className="text-amber-600 animate-pulse" /> 24h Seat Hold Active
                            </span>
                            <span className="font-mono text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded">
                              {formatTimeRemaining(reg.seconds_remaining, reg.held_until)}
                            </span>
                          </div>
                          <p className="text-[10px] text-amber-800 leading-tight">
                            Seat reserved! Transfer PKR {reg.event_price} and upload your receipt before hold expires.
                          </p>
                        </div>
                      )}

                      {isPending && (
                        <div className="mt-3 p-3 bg-sky-50 border border-sky-200 rounded-2xl space-y-1">
                          <p className="text-[11px] font-black text-sky-900 flex items-center gap-1">
                            <Clock size={12} className="text-sky-600" /> Receipt Under Review
                          </p>
                          <p className="text-[10px] text-sky-700 leading-tight">
                            Ref: <span className="font-mono font-bold">{reg.transaction_id || 'Slip uploaded'}</span>. Awaiting Advisor sign-off.
                          </p>
                        </div>
                      )}

                      {isRejected && (
                        <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-2xl space-y-1">
                          <p className="text-[11px] font-black text-rose-900 flex items-center gap-1">
                            <AlertCircle size={12} className="text-rose-600" /> Verification Rejected
                          </p>
                          <p className="text-[10px] text-rose-700 leading-tight">
                            {reg.rejection_reason || 'Bank slip could not be matched with university accounts.'}
                          </p>
                        </div>
                      )}

                      {isHoldExpired && (
                        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                          <p className="text-[11px] font-black text-slate-700 flex items-center gap-1">
                            <Clock size={12} className="text-slate-400" /> Seat Hold Expired
                          </p>
                          <p className="text-[10px] text-slate-500 leading-tight">
                            The 24-hour window elapsed without receipt submission. The seat was returned to general capacity.
                          </p>
                        </div>
                      )}

                      {isEventPast && isVerified && !isAttended && (
                        <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-2xl space-y-1">
                          <p className="text-[11px] font-black text-rose-900 flex items-center gap-1">
                            <AlertCircle size={12} className="text-rose-600" /> Event Concluded — Ticket Inactive
                          </p>
                          <p className="text-[10px] text-rose-700 leading-tight">
                            This event has ended. Entry gate scanning has expired.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Ticket Action Button */}
                    <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400">
                        {reg.ticket_qr_code ? `#${reg.ticket_qr_code.substring(0, 8)}` : (isHeld ? 'Held (Unconfirmed)' : 'Pass Pending')}
                      </span>

                      {isVerified ? (
                        <button
                          onClick={() => setSelectedTicket(reg)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer ${
                            isEventPast ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/10'
                          }`}
                        >
                          <QrCode size={13} /> {isEventPast ? 'View Concluded Ticket' : 'View Digital Ticket'}
                        </button>
                      ) : isHeld ? (
                        <button
                          onClick={() => handleOpenHoldModal(reg)}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-600/20 transition cursor-pointer"
                        >
                          <UploadCloud size={13} /> Upload Receipt
                        </button>
                      ) : isPending ? (
                        <button
                          onClick={() => handleOpenHoldModal(reg)}
                          className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                        >
                          <Landmark size={13} /> View Bank Info
                        </button>
                      ) : (
                        <Link
                          to="/events"
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition"
                        >
                          Re-register <ArrowRight size={12} />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. RECRUITMENT APPLICATIONS TIMELINE */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Clock className="text-violet-600" /> My Recruitment Applications ({applications.length})
            </h2>
          </div>

          {applications.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 text-xs">
              You haven't submitted any recruitment applications yet.
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map(app => (
                <div key={app.id} className="p-5 border border-slate-200 rounded-2xl bg-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        app.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                        app.status === 'shortlisted' ? 'bg-indigo-100 text-indigo-800' :
                        app.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {app.status}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        {app.recruitment_title || 'Recruitment Drive'}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base mt-1">
                      Role Applied For: <span className="text-violet-600">{app.role_applied_for || 'Cabinet Associate'}</span>
                    </h3>
                  </div>

                  <div className="text-xs font-semibold text-slate-600 space-y-1">
                    {app.interview_slot && (
                      <p className="flex items-center gap-1.5 text-indigo-700 font-bold">
                        <Calendar size={14} /> Interview: {new Date(app.interview_slot).toLocaleString()}
                      </p>
                    )}
                    {app.interview_score !== null && app.interview_score !== undefined && (
                      <p className="text-amber-700 font-bold">
                        Evaluation Score: {app.interview_score}/100
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5. EARNED VERIFIED CERTIFICATES */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Award className="text-amber-500" /> Issued Certificates ({certificates.length})
            </h2>
          </div>

          {certificates.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 text-xs">
              No certificates issued yet. Certificates are unlocked after attending events and having attendance finalized.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certificates.map(cert => (
                <div key={cert.id} className="p-5 border border-slate-200 rounded-3xl bg-slate-50 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Verified Certificate
                    </span>
                    <h3 className="font-bold text-slate-900 text-base mt-2">{cert.event_title}</h3>
                    <p className="text-[11px] text-slate-400 font-mono mt-1">ID: {cert.verification_code}</p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-200 flex items-center justify-between">
                    <Link
                      to={`/verify?code=${cert.verification_code}`}
                      className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink size={12} /> Verify Online
                    </Link>
                    <button
                      onClick={() => setSelectedCert(cert)}
                      className="px-3.5 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 flex items-center gap-1.5 shadow-sm"
                    >
                      <Download size={13} /> View & Download PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 6. VOLUNTEER SERVICE & CIVIC ENGAGEMENT */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="text-emerald-600" size={24} />
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Volunteer Service & Civic Engagement ({volunteerHours.length})
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Official faculty-verified community service hours recorded on your institutional co-curricular transcript.
              </p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 px-4 py-1.5 rounded-2xl flex items-center gap-2 self-start sm:self-auto">
              <Sparkles size={14} className="text-emerald-600" />
              <span className="text-xs font-black text-emerald-800">
                Total: {totalVolHours.toFixed(1)} Hours Approved
              </span>
            </div>
          </div>

          {/* Volunteer Milestone & Society Breakdown Tracker */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-200 rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-xs font-black text-emerald-950">
                <span className="flex items-center gap-1.5">
                  <Award size={16} className="text-emerald-600" /> 20-Hour Service Honor Milestone
                </span>
                <span>{Math.min(100, Math.round((totalVolHours / 20) * 100))}%</span>
              </div>
              <div className="w-full bg-emerald-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (totalVolHours / 20) * 100)}%` }}
                />
              </div>
              <p className="text-[11px] font-bold text-emerald-800">
                {totalVolHours >= 20
                  ? "🎉 20-Hour Milestone Achieved! Eligible for Presidential Civic Service Honor Certificate."
                  : `${(20 - totalVolHours).toFixed(1)} more verified hours to unlock Civic Honor Certificate.`}
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Hours Aggregated by Society
              </span>
              <div className="flex flex-wrap gap-2">
                {Object.entries(
                  volunteerHours.reduce((acc, v) => {
                    const sName = v.society_name || 'Campus Society';
                    const hrs = parseFloat(v.hours || 0);
                    acc[sName] = (acc[sName] || 0) + hrs;
                    return acc;
                  }, {})
                ).map(([socName, hrs]) => (
                  <span key={socName} className="text-xs font-bold bg-white border border-slate-200 px-2.5 py-1 rounded-xl text-slate-700 shadow-2xs">
                    {socName}: <strong className="text-emerald-600">{hrs.toFixed(1)} hrs</strong>
                  </span>
                ))}
                {volunteerHours.length === 0 && (
                  <span className="text-xs text-slate-400 font-medium">No society volunteer hours recorded yet.</span>
                )}
              </div>
            </div>
          </div>

          {volunteerHours.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 text-xs">
              <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-600 text-sm">No Volunteer Hours Logged Yet</p>
              <p className="mt-1">Participate as event staff, gate check-in officer, or society organizer to earn verified service credit.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {volunteerHours.map(vol => (
                <div key={vol.id} className="p-5 border border-slate-200/90 rounded-3xl bg-slate-50 flex flex-col justify-between hover:shadow-md transition">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {vol.hours} Hours Credit
                      </span>
                      <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                        {vol.role || 'Volunteer'}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm line-clamp-2">
                      {vol.event_title || `Campus Event #${vol.event}`}
                    </h3>
                    <p className="text-xs text-indigo-600 font-bold">
                      {vol.society_name || 'Campus Society'}
                    </p>
                    {vol.description && (
                      <p className="text-[11px] text-slate-500 italic line-clamp-2">{vol.description}</p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/70 text-[11px] text-slate-500">
                    {vol.status === 'assigned' && (
                      <button
                        type="button"
                        onClick={() => handleAcceptVolunteer(vol.id)}
                        className="w-full mb-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition cursor-pointer"
                      >
                        Accept Volunteer Role
                      </button>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1 font-medium">
                        <UserCheck size={13} className="text-emerald-600" /> Verified by {vol.verified_by_name || 'Faculty Advisor'}
                      </span>
                      <span className="text-emerald-600 font-bold capitalize">
                        {vol.status === 'verified' ? '✓ Verified' : vol.status === 'completed' ? 'Completed' : vol.status === 'accepted' ? 'Accepted' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* FULL DIGITAL EVENT BOARDING PASS TICKET MODAL */}
      {selectedTicket && (
        <>
          {/* SCREEN VIEW MODAL */}
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center p-4 overflow-y-auto hide-on-print">
            <div className="relative animate-in fade-in zoom-in-95 my-8 flex flex-col items-center max-w-full">
              <div className="w-full max-w-[95vw] overflow-x-auto pb-2 flex justify-start sm:justify-center">
                <div ref={ticketRef} className="ticket-container bg-transparent p-2">
                  <TicketCard 
                    selectedTicket={selectedTicket}
                    type="Student Copy"
                    userAvatar={userAvatar}
                    defaultAvatar={defaultAvatar}
                    displayName={displayName}
                    profile={profile}
                  />
                </div>
              </div>

              {/* Action Buttons: PNG, JPG, PDF, Print, Close */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
                <button
                  onClick={() => downloadTicketImage('png')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/25 transition cursor-pointer"
                  title="Export ticket as high-resolution PNG image"
                >
                  <Download size={14} /> Download PNG
                </button>
                <button
                  onClick={() => downloadTicketImage('jpeg')}
                  className="bg-teal-600 hover:bg-teal-700 text-white py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-teal-600/25 transition cursor-pointer"
                  title="Export ticket as JPG image"
                >
                  <Download size={14} /> Download JPG
                </button>
                <button
                  onClick={downloadTicketPDF}
                  disabled={downloadingTicketPDF}
                  className="bg-purple-600 hover:bg-purple-700 text-white py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/25 transition cursor-pointer disabled:opacity-50"
                  title="Export ticket as PDF document"
                >
                  {downloadingTicketPDF ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Generating PDF...
                    </>
                  ) : (
                    <>
                      <Download size={14} /> Download PDF
                    </>
                  )}
                </button>
                <button
                  onClick={printTicket}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 transition cursor-pointer"
                  title="Print dual A4 landscape copies (Student Copy & Department Copy)"
                >
                  <Printer size={15} /> Print A4 Dual Pass
                </button>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer shadow"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
          
          {/* PRINT VIEW CONTAINER (A4 Landscape, 2 Copies) */}
          <div className="ticket-print-container">
            <div className="ticket-card-printable">
              <TicketCard 
                  selectedTicket={selectedTicket}
                  type="Student Copy"
                  userAvatar={userAvatar}
                  defaultAvatar={defaultAvatar}
                  displayName={displayName}
                  profile={profile}
              />
            </div>
            <div className="ticket-card-printable">
              <TicketCard 
                  selectedTicket={selectedTicket}
                  type="Department Copy"
                  userAvatar={userAvatar}
                  defaultAvatar={defaultAvatar}
                  displayName={displayName}
                  profile={profile}
              />
            </div>
          </div>
        </>
      )}

      {/* DETAILED DIGITAL SOCIETY MEMBERSHIP CARD MODAL */}
      {selectedMembershipCard && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gradient-to-br from-[#070b14] via-[#0d1527] to-[#05070f] border border-amber-500/40 text-white rounded-[32px] max-w-xl w-full p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_30px_rgba(245,158,11,0.12)] relative my-8 overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

            <button
              onClick={() => setSelectedMembershipCard(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 transition-colors z-20"
            >
              <X size={18} />
            </button>

            <div className="text-center mb-6 relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400/20 via-yellow-400/10 to-amber-400/20 border border-amber-400/40 shadow-[0_0_12px_rgba(251,191,36,0.15)] mb-2">
                <Sparkles size={11} className="text-amber-300" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-300">
                  {selectedMembershipCard.is_cabinet_card 
                    ? 'Official Executive Cabinet Credential' 
                    : 'Official University Society Credential'}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-sm">{selectedMembershipCard.society_name}</h2>
              <p className="text-xs text-amber-400 font-mono mt-1 font-bold tracking-wider">
                ASSIGNED ID: {selectedMembershipCard.membership_id 
                  || (selectedMembershipCard.is_cabinet_card 
                      ? `CAB-${selectedMembershipCard.society_name ? selectedMembershipCard.society_name.split(' ').map(w => w[0]).join('').toUpperCase() : 'DSMS'}-${selectedMembershipCard.student_roll_number || profile?.roll_number || '2026'}`
                      : `DSMS-MEMBER-${selectedMembershipCard.id}`)}
              </p>
            </div>

            {/* Authentic ID Card Layout */}
            <div className="bg-slate-900/80 border border-amber-500/25 rounded-2xl p-6 space-y-5 relative z-10 shadow-inner">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                {/* Photo Frame */}
                <div className="relative shrink-0">
                  <div className="p-1 rounded-2xl bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 shadow-xl">
                    <div className="w-28 sm:w-32 h-34 sm:h-38 rounded-[14px] overflow-hidden bg-slate-950 border border-black/50">
                      <MediaImage
                        src={selectedMembershipCard.student_avatar || userAvatar}
                        alt={selectedMembershipCard.student_name || displayName}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = defaultAvatar; }}
                      />
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-black text-[8px] uppercase tracking-wider shadow-md border-2 border-slate-950 flex items-center gap-0.5">
                    <ShieldCheck size={10} strokeWidth={3} />
                    <span>OFFICIAL</span>
                  </div>
                </div>

                <div className="space-y-1.5 min-w-0 flex-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                    <h3 className="text-xl sm:text-2xl font-black text-white truncate drop-shadow-sm">
                      {selectedMembershipCard.student_name || displayName}
                    </h3>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.25)]">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                      </span>
                      ACTIVE
                    </span>
                  </div>

                  <p className="text-sm font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-indigo-200 to-amber-300">
                    {selectedMembershipCard.role_title || (selectedMembershipCard.is_cabinet_card ? 'Cabinet Member' : 'General Member')}
                  </p>

                  <div className="pt-1 space-y-1 text-xs">
                    <div className="inline-block px-2.5 py-0.5 rounded-md bg-amber-400/10 border border-amber-400/30">
                      <span className="font-mono text-amber-200/90 font-bold text-xs tracking-wide">
                        Roll Number: {selectedMembershipCard.student_roll_number || profile?.roll_number || 'FA22-BCS-042'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 font-bold">
                      {selectedMembershipCard.student_program || profile?.program || 'BS Computer Science'} • {selectedMembershipCard.student_department || profile?.department || 'Department of Computer Science'}
                    </p>
                    <p className="text-[11px] text-slate-400 uppercase font-black tracking-wider">
                      {selectedMembershipCard.student_faculty || profile?.faculty_name || 'Faculty of Computing & Information Technology'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Statutory Endorsements */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-amber-500/20 text-xs">
                <div className="p-3 bg-slate-950/70 border border-white/5 rounded-xl">
                  <span className="text-[9px] font-black uppercase tracking-widest text-amber-400/80 block">Issued By (Club President)</span>
                  <span className="font-bold text-white block mt-0.5 text-xs truncate">
                    {selectedMembershipCard.issued_by_name || `${selectedMembershipCard.society_president || 'Muhammad Roshan Ashraf'} (President)`}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                    <CheckCircle size={10} className="text-emerald-400 shrink-0" /> Digitally Endorsed
                  </span>
                </div>

                <div className="p-3 bg-slate-950/70 border border-white/5 rounded-xl">
                  <span className="text-[9px] font-black uppercase tracking-widest text-amber-400/80 block">Approved By (Faculty Advisor)</span>
                  <span className="font-bold text-white block mt-0.5 text-xs truncate">
                    {selectedMembershipCard.approved_by_advisor || `${selectedMembershipCard.society_advisor || 'Dr. Sarah Ahmed'} (Faculty Advisor)`}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                    <ShieldCheck size={10} className="text-amber-400 shrink-0" /> Faculty Supervised
                  </span>
                </div>

                <div className="p-3 bg-slate-950/70 border border-white/5 rounded-xl">
                  <span className="text-[9px] font-black uppercase tracking-widest text-amber-400/80 block">Super Admin Endorsement</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1 mt-0.5 text-xs">
                    <BadgeCheck size={14} className="text-emerald-400 shrink-0" /> Directorate of Student Affairs Verified
                  </span>
                </div>

                <div className="p-3 bg-slate-950/70 border border-white/5 rounded-xl">
                  <span className="text-[9px] font-black uppercase tracking-widest text-amber-400/80 block">Term Validity</span>
                  <span className="font-bold text-slate-200 block mt-0.5 font-mono text-xs">
                    {selectedMembershipCard.valid_until || 'Academic Session 2026-2027'}
                  </span>
                </div>
              </div>

              {/* Security QR Scanner Box */}
              <div className="flex items-center justify-between pt-3 border-t border-amber-500/20">
                <div className="p-3 bg-white rounded-2xl shadow-2xl border-2 border-amber-400/40 relative shrink-0">
                  <QRCode 
                    value={`${window.location.origin}/verify/member/${selectedMembershipCard.card_qr_code || selectedMembershipCard.membership_id || selectedMembershipCard.id}`} 
                    size={88} 
                    level="M"
                  />
                  <div className="flex items-center justify-center gap-1 mt-1 text-[7.5px] font-black uppercase tracking-wider text-slate-900">
                    <ShieldCheck size={10} className="text-emerald-600 shrink-0" />
                    <span>SCAN TO VERIFY</span>
                  </div>
                </div>
                <div className="text-right pl-4">
                  <span className="text-[9px] font-mono font-black tracking-widest text-amber-400/90 block uppercase">
                    SCAN TO VERIFY (PUBLIC)
                  </span>
                  <span className="text-xs font-mono text-slate-200 font-bold block mt-0.5">
                    {String(selectedMembershipCard.card_qr_code || selectedMembershipCard.membership_id || selectedMembershipCard.id).substring(0, 20)}...
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Instant verification with smartphone camera
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 relative z-10">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 hover:from-amber-300 hover:to-amber-500 rounded-xl font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
              >
                <Printer size={15} /> Print / Save Card
              </button>
              <button
                onClick={() => setSelectedMembershipCard(null)}
                className="px-5 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition cursor-pointer border border-slate-700/60"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT STUDENT PROFILE MODAL */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
            <button
              onClick={() => setShowEditProfileModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={18} />
            </button>

            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <User size={20} className="text-indigo-600" /> Edit Student Profile Information
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              Update your roll number, program, department, faculty, contact numbers, and profile photo.
            </p>

            {saveSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle size={16} /> Profile updated successfully!
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.first_name}
                    onChange={e => setEditForm({...editForm, first_name: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.last_name}
                    onChange={e => setEditForm({...editForm, last_name: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Father's Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Muhammad Aslam"
                    value={editForm.father_name}
                    onChange={e => setEditForm({...editForm, father_name: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Roll / Student Number</label>
                <input
                  type="text"
                  placeholder="e.g. FA22-BCS-042"
                  value={editForm.roll_number}
                  onChange={e => setEditForm({...editForm, roll_number: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              {/* Hierarchical Academic Affiliation: 1. Faculty -> 2. Department -> 3. Degree Program */}
              <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-1 border-b border-indigo-100/70">
                  <span className="text-[11px] font-black uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                    <GraduationCap size={15} className="text-indigo-600" /> Academic Hierarchy
                  </span>
                  <span className="text-[10px] text-indigo-600 font-semibold">
                    1. Faculty → 2. Department → 3. Degree Program
                  </span>
                </div>

                {/* 1. Faculty Division */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold uppercase text-slate-700 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-black flex items-center justify-center">1</span>
                      Faculty Division
                    </label>
                    <span className="text-[10px] text-slate-500 font-medium">Filters departments below</span>
                  </div>
                  <select
                    value={editForm.faculty_name}
                    onChange={e => handleEditFacultyChange(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-500 rounded-xl text-xs font-bold text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition cursor-pointer"
                  >
                    <option value="">-- Select Faculty (1st Level) --</option>
                    {FACULTIES.map((fac) => (
                      <option key={fac} value={fac}>{fac}</option>
                    ))}
                  </select>
                </div>

                {/* 2. Department */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold uppercase text-slate-700 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-black flex items-center justify-center">2</span>
                      Department
                    </label>
                    <span className="text-[10px] text-slate-500 font-medium">Filters programs below</span>
                  </div>
                  <select
                    value={editForm.department}
                    onChange={e => handleEditDepartmentChange(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-500 rounded-xl text-xs font-bold text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition cursor-pointer"
                  >
                    <option value="">-- Select Department (2nd Level) --</option>
                    {editForm.department && !availableEditDepartments.includes(editForm.department) && (
                      <option value={editForm.department}>{editForm.department} (Current)</option>
                    )}
                    {availableEditDepartments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                {/* 3. Degree Program */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold uppercase text-slate-700 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-black flex items-center justify-center">3</span>
                      Degree Program
                    </label>
                    <span className="text-[10px] text-indigo-600 font-semibold">Auto-selects Faculty & Dept if picked first</span>
                  </div>
                  <select
                    value={editForm.program}
                    onChange={e => handleEditProgramChange(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-indigo-200 hover:border-indigo-300 focus:border-indigo-500 rounded-xl text-xs font-bold text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition cursor-pointer"
                  >
                    <option value="">-- Select Degree Program (3rd Level) --</option>
                    {editForm.program && !availableEditPrograms.includes(editForm.program) && (
                      <option value={editForm.program}>{editForm.program} (Current)</option>
                    )}
                    {availableEditPrograms.map((prog) => (
                      <option key={prog} value={prog}>{prog}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Gmail / University Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. student@university.edu"
                  value={editForm.email}
                  onChange={e => setEditForm({...editForm, email: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              {/* Gender + Phone row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Gender</label>
                  <select
                    value={editForm.gender}
                    onChange={e => setEditForm({...editForm, gender: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    <option value="">Select gender…</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other / Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +92 300 8765432"
                    value={editForm.phone_number}
                    onChange={e => setEditForm({...editForm, phone_number: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Change Password Accordion */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => { setShowChangePassword(p => !p); setChangePwError(null); setChangePwSuccess(false); }}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition text-left cursor-pointer"
                >
                  <span className="text-xs font-black text-slate-700 flex items-center gap-2">
                    <Lock size={14} className="text-indigo-500" /> Change Password
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">{showChangePassword ? '▲ Hide' : '▼ Show'}</span>
                </button>

                {showChangePassword && (
                  <form onSubmit={handleChangePassword} className="p-4 space-y-3 bg-white border-t border-slate-100">
                    {changePwError && (
                      <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 font-bold">{changePwError}</div>
                    )}
                    {changePwSuccess && (
                      <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 font-bold">✓ Password updated successfully!</div>
                    )}
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Current Password</label>
                      <input
                        type="password"
                        required
                        placeholder="Enter your current password"
                        value={changePwForm.old_password}
                        onChange={e => setChangePwForm({...changePwForm, old_password: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">New Password</label>
                        <input
                          type="password"
                          required
                          placeholder="Min. 6 characters"
                          value={changePwForm.new_password}
                          onChange={e => setChangePwForm({...changePwForm, new_password: e.target.value})}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Confirm New</label>
                        <input
                          type="password"
                          required
                          placeholder="Repeat new password"
                          value={changePwForm.confirm_password}
                          onChange={e => setChangePwForm({...changePwForm, confirm_password: e.target.value})}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={changePwLoading}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow cursor-pointer"
                    >
                      {changePwLoading ? 'Updating…' : 'Update Password'}
                    </button>
                  </form>
                )}
              </div>

              <div>
                <ImageUploader
                  label="Profile Photo / Student Picture"
                  hint="Select photo from device storage, phone gallery, or camera"
                  shape="avatar"
                  value={editForm.avatar_url}
                  onChange={(url) => setEditForm(prev => ({ ...prev, avatar_url: url }))}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                {saveSuccess && (
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 mr-auto">
                    <Check size={14} /> Profile saved!
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  {isSaving ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CERTIFICATE PREVIEW & PDF DOWNLOAD MODAL */}
      {selectedCert && (
        <CertificateModal
          certificate={selectedCert}
          studentName={displayName}
          onClose={() => setSelectedCert(null)}
        />
      )}

      {/* POST-EVENT FEEDBACK MODAL */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
            <h3 className="text-xl font-black text-slate-900 mb-1">Event Feedback</h3>
            <p className="text-xs text-slate-500 mb-4">{showFeedbackModal.event_title}</p>

            {feedbackSuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-center text-xs font-bold">
                Thank you! Your feedback has been recorded for the society cabinet.
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-2">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFeedbackRating(star)}
                        className={`p-2 rounded-xl text-lg ${feedbackRating >= star ? 'text-amber-500 bg-amber-50' : 'text-slate-300'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Comments / Suggestions</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Share your thoughts on the speakers, venue, or topics covered..."
                    value={feedbackComment}
                    onChange={e => setFeedbackComment(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowFeedbackModal(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                  >
                    Submit Feedback
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {/* TOAST NOTIFICATION */}
      {receiptToast && (
        <div className="fixed top-24 right-6 z-50 bg-slate-900 text-white border border-slate-700 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in">
          <CheckCircle size={18} className="text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{receiptToast}</span>
        </div>
      )}

      {/* PHASE 4: SEAT HOLD & RECEIPT UPLOAD MODAL */}
      {selectedHoldReg && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative my-8 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setSelectedHoldReg(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={20} />
            </button>

            {/* Modal Header */}
            <div className="mb-5">
              <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                selectedHoldReg.payment_status === 'held' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                'bg-sky-100 text-sky-800 border border-sky-200'
              }`}>
                {selectedHoldReg.payment_status === 'held' ? '24-Hour Seat Hold Active' : 'Payment Proof Submitted'}
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-2">
                {selectedHoldReg.event_title}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Registration Fee: <span className="font-bold text-indigo-600">PKR {selectedHoldReg.event_price || '10.00'}</span> • Hold Remaining: <span className="font-bold text-amber-700">{formatTimeRemaining(selectedHoldReg.seconds_remaining, selectedHoldReg.held_until)}</span>
              </p>
            </div>

            {/* Versioned Bank Account Details Box */}
            <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white p-5 rounded-2xl shadow-md border border-slate-800 space-y-4 mb-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 flex items-center gap-1.5">
                  <Landmark size={14} /> Official Society Bank Snapshot
                </span>
                <span className="text-[10px] font-mono font-bold bg-white/15 px-2 py-0.5 rounded text-white">
                  v{selectedHoldReg.bank_snapshot?.version || selectedHoldReg.bank_version || 1}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Bank Name</span>
                  <span className="font-bold text-slate-200">
                    {selectedHoldReg.bank_snapshot?.bank_name || 'Habib Bank Limited (HBL)'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Account Title</span>
                  <span className="font-bold text-slate-200">
                    {selectedHoldReg.bank_snapshot?.bank_account_title || selectedHoldReg.society_name}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">IBAN / Account Number</span>
                <div className="flex items-center justify-between bg-black/40 px-3 py-2 rounded-xl mt-1 font-mono text-xs font-bold text-amber-300 border border-white/10">
                  <span className="truncate mr-2">
                    {selectedHoldReg.bank_snapshot?.bank_account_number || 'PK36HABB00012345678901'}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(selectedHoldReg.bank_snapshot?.bank_account_number || 'PK36HABB00012345678901', 'iban')}
                    className="text-xs text-white/80 hover:text-white flex items-center gap-1 bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg cursor-pointer transition shrink-0"
                  >
                    {copiedField === 'iban' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    {copiedField === 'iban' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {selectedHoldReg.bank_snapshot?.payment_instructions && (
                <div className="text-[11px] text-slate-300 bg-white/5 p-2.5 rounded-xl border border-white/10">
                  <span className="font-bold text-white block text-[10px] uppercase">Instructions:</span>
                  {selectedHoldReg.bank_snapshot.payment_instructions}
                </div>
              )}
            </div>

            {/* Receipt Upload Form or Submitted Details */}
            {selectedHoldReg.payment_status === 'pending' ? (
              <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-sky-900 font-bold text-sm">
                  <CheckCircle size={16} className="text-sky-600" /> Proof Submitted & Awaiting Verification
                </div>
                <div className="text-xs text-sky-800 space-y-1">
                  <p><strong>Transaction Ref:</strong> {selectedHoldReg.transaction_id || 'N/A'}</p>
                  {selectedHoldReg.receipt_details && (
                    <p><strong>Notes:</strong> {selectedHoldReg.receipt_details}</p>
                  )}
                  {selectedHoldReg.receipt_file && (
                    <div className="pt-2">
                      <MediaLink
                        href={getMediaUrl(selectedHoldReg.receipt_file)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 underline font-bold inline-flex items-center gap-1"
                      >
                        <ExternalLink size={12} /> View Uploaded Receipt File
                      </MediaLink>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleUploadReceipt} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Bank Reference / Transaction ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1Link / Raast Ref: 987654321 or Bank Slip #"
                    value={receiptForm.transaction_id}
                    onChange={e => setReceiptForm({ ...receiptForm, transaction_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Upload Image / Receipt Slip *</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg, image/webp" 
                      onChange={(e) => setReceiptForm({ ...receiptForm, receipt_file: e.target.files[0] })}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 border border-gray-200 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Additional Transfer Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Transferred from Meezan Bank via Raast at 10:15 AM"
                    value={receiptForm.receipt_details}
                    onChange={e => setReceiptForm({ ...receiptForm, receipt_details: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedHoldReg(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-600 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={receiptSubmitting}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    <UploadCloud size={14} />
                    {receiptSubmitting ? 'Submitting Proof...' : 'Submit Payment Proof'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
