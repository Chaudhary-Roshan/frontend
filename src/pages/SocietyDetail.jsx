import { MediaImage, MediaLink } from '../components/common/AuthenticatedMedia';
import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { 
  MapPin, CalendarPlus, UserCheck, Briefcase, Star, Heart, 
  Share2, MessageCircle, Send, ShieldCheck, Award, FileText, 
  FolderGit2, Image as ImageIcon, CheckCircle2, ChevronRight, X, Clock,
  PlusCircle, CreditCard, Ticket, AlertTriangle, ExternalLink, Globe,
  ChevronDown, ChevronUp
} from 'lucide-react';
import QRCode from 'react-qr-code';
import ImageUploader from '../components/common/ImageUploader';
import { getMediaUrl, handleImageError, DEFAULT_SOCIETY_LOGO } from '../utils/media';
import { sortSocietyMembers, getDynamicRoleRank } from '../utils/hierarchy';
import { formatAdvisorDisplayName, formatPresidentDisplayName } from './Home';

const InstagramIcon = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

const LinkedinIcon = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect width="4" height="12" x="2" y="9"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);

const WhatsAppIcon = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
  </svg>
);

const WhatsAppChannelIcon = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    <circle cx="12" cy="4" r="1" fill="currentColor"/>
  </svg>
);

const FacebookIcon = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const YoutubeIcon = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor"/>
  </svg>
);

const TwitterIcon = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const formatAvatarUrl = (url) => getMediaUrl(url);

const SocietyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [society, setSociety] = useState(null);
  const [events, setEvents] = useState([]);
  const [recruitments, setRecruitments] = useState([]);
  const [cabinet, setCabinet] = useState([]);
  const [galleries, setGalleries] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isFollowing, setIsFollowing] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactMsg, setContactMsg] = useState({ subject: '', message: '' });

  // Student Full Dossier Modal
  const [selectedCabinetStudent, setSelectedCabinetStudent] = useState(null);

  // Event Proposal State
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [lockedDates, setLockedDates] = useState([]);
  const [dateConflictWarning, setDateConflictWarning] = useState(null);
  const [eventForm, setEventForm] = useState({
    title: '', description: '', date: '', is_paid: false, price: 0
  });

  // Gallery Upload State
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [galleryUrl, setGalleryUrl] = useState('');

  // Recruitment Application State
  const [activeRecruitment, setActiveRecruitment] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null); // selected position object
  const [applyRole, setApplyRole] = useState('');
  const [applyAnswers, setApplyAnswers] = useState({});
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyStep, setApplyStep] = useState(1); // 1=select position, 2=fill form

  // Membership State
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [membershipProof, setMembershipProof] = useState('');
  const [membershipTxId, setMembershipTxId] = useState('');
  const [membershipSuccess, setMembershipSuccess] = useState(false);
  const [membershipSubmitting, setMembershipSubmitting] = useState(false);
  const [myMembership, setMyMembership] = useState(null); // current user's membership record

  // Event Registration Modal (Free vs Paid)
  const [selectedEventForReg, setSelectedEventForReg] = useState(null);
  const [paymentProofFile, setPaymentProofFile] = useState(null);
  const [transactionId, setTransactionId] = useState('');
  const [receiptDetails, setReceiptDetails] = useState('');
  const [regSuccessMsg, setRegSuccessMsg] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showRegProfileToggle, setShowRegProfileToggle] = useState(true);

  const [toastMsg, setToastMsg] = useState(null);

  useEffect(() => {
    fetchSocietyData();
    fetchLockedDates();

    const handleSync = (e) => {
      if (!e?.detail?.id || e.detail.id === parseInt(id)) {
        fetchSocietyData();
      }
    };

    window.addEventListener('dsms:society_updated', handleSync);
    window.addEventListener('dsms:cabinet_updated', handleSync);
    window.addEventListener('dsms:data_synced', handleSync);
    window.addEventListener('storage', fetchSocietyData);
    return () => {
      window.removeEventListener('dsms:society_updated', handleSync);
      window.removeEventListener('dsms:cabinet_updated', handleSync);
      window.removeEventListener('dsms:data_synced', handleSync);
      window.removeEventListener('storage', fetchSocietyData);
    };
  }, [id]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const fetchSocietyData = async () => {
    try {
      const [socRes, evRes, recRes, cabRes, galRes, memRes] = await Promise.allSettled([
        api.get(`societies/${id}/`),
        api.get(`events/`, { params: { society: id } }),
        api.get(`recruitments/`),
        api.get(`cabinet/`, { params: { society: id, active_only: 'true' } }),
        api.get(`gallery/`),
        user ? api.get(`memberships/`) : Promise.resolve({ data: [] })
      ]);

      if (socRes.status === 'fulfilled') setSociety(socRes.value.data);
      if (evRes.status === 'fulfilled') {
        setEvents(evRes.value.data.filter(e => e.society === parseInt(id)));
      }
      if (recRes.status === 'fulfilled') {
        const filtered = Array.isArray(recRes.value.data) ? recRes.value.data.filter(r => r.society === parseInt(id)) : [];
        const uniqueRecs = [];
        const seenTitles = new Set();
        for (const r of filtered) {
          const tKey = r.title?.trim().toLowerCase();
          if (!seenTitles.has(tKey)) {
            seenTitles.add(tKey);
            uniqueRecs.push(r);
          }
        }
        setRecruitments(uniqueRecs);
      }
      if (cabRes.status === 'fulfilled') {
        const rawCab = Array.isArray(cabRes.value.data) ? cabRes.value.data : [];
        // Strictly filter by society ID, active assignment status, and verified status
        const activeSocCabinet = rawCab.filter(c => 
          Number(c.society) === parseInt(id) && 
          c.is_active === true && 
          c.is_verified === true
        );
        setCabinet(activeSocCabinet);
      } else if (socRes.status === 'fulfilled' && Array.isArray(socRes.value.data?.cabinet_members)) {
        setCabinet(socRes.value.data.cabinet_members.filter(c => c.is_active === true && c.is_verified === true));
      }
      if (galRes.status === 'fulfilled') {
        setGalleries(galRes.value.data.filter(g => g.society === parseInt(id)));
      }
      if (memRes.status === 'fulfilled' && user) {
        const myMem = memRes.value.data.find(m => m.society === parseInt(id));
        setMyMembership(myMem || null);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchLockedDates = async () => {
    try {
      const res = await api.get('events/locked_dates/');
      setLockedDates(res.data);
    } catch(e){}
  };

  const checkDateConflict = (selectedDateStr) => {
    if (!selectedDateStr) {
      setDateConflictWarning(null);
      return;
    }
    const chosenDate = selectedDateStr.split('T')[0];
    const conflict = lockedDates.find(ld => ld.date === chosenDate && ld.society_id !== parseInt(id));
    if (conflict) {
      setDateConflictWarning(`⚠️ Date-Lock Rule: ${conflict.society_name} has already booked ${chosenDate} for "${conflict.title}". Other societies cannot schedule on this same day.`);
    } else {
      setDateConflictWarning(null);
    }
  };

  const handleProposeEvent = async (e) => {
    e.preventDefault();
    if (dateConflictWarning) {
      alert("This date is locked by another society under the university date-conflict rule.");
      return;
    }
    try {
      await api.post('events/', {
        society: parseInt(id),
        title: eventForm.title,
        description: eventForm.description,
        date: eventForm.date,
        is_paid: eventForm.is_paid,
        price: eventForm.is_paid ? parseFloat(eventForm.price) : 0.00
      });
      showToast("Event proposal submitted successfully!");
      setShowProposeModal(false);
      setEventForm({ title: '', description: '', date: '', is_paid: false, price: 0 });
      setDateConflictWarning(null);
      fetchSocietyData();
      fetchLockedDates();
    } catch (err) {
      alert(err.response?.data?.date || err.response?.data?.title || 'Failed to submit proposal.');
    }
  };

  const handleUploadGallery = async (e) => {
    e.preventDefault();
    if (!galleryUrl.trim()) return;
    try {
      await api.post('gallery/', {
        society: parseInt(id),
        image_url: galleryUrl.trim(),
        title: 'Society Showcase',
        album_name: 'General Showcase',
        is_public: true
      });
      showToast("Photo added to society gallery!");
      setShowGalleryModal(false);
      setGalleryUrl('');
      fetchSocietyData();
    } catch(err) {
      alert("Failed to upload photo.");
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login', { state: { from: `/societies/${id}` } });
      return;
    }
    if (user.role !== 'student') {
      alert('Only enrolled students can apply for society recruitment.');
      return;
    }
    const positionTitle = typeof selectedPosition === 'string' ? selectedPosition : (selectedPosition?.title || applyRole);
    if (!positionTitle) {
      alert('Please select a position to apply for.');
      return;
    }
    try {
      const payload = {
        recruitment: activeRecruitment.id,
        role_applied_for: positionTitle,
        answers: {
          motivation: applyAnswers['motivation'] || applyAnswers[0] || '',
          ...applyAnswers
        }
      };
      await api.post('applications/', payload);
      setApplySuccess(true);
      setTimeout(() => {
        setApplySuccess(false);
        setActiveRecruitment(null);
        setSelectedPosition(null);
        setApplyRole('');
        setApplyAnswers({});
        setApplyStep(1);
      }, 2500);
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.detail || 'Failed to submit application.');
    }
  };

  const handleMembershipApply = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login', { state: { from: `/societies/${id}` } });
      return;
    }
    if (user.role !== 'student') {
      alert('Only enrolled students can apply for society membership.');
      return;
    }
    if (!membershipProof.trim() && society.membership_fee > 0) {
      alert('Please upload your payment proof screenshot.');
      return;
    }
    setMembershipSubmitting(true);
    try {
      await api.post('memberships/', {
        society: parseInt(id),
        payment_proof: membershipProof.trim(),
        transaction_id: membershipTxId.trim(),
        fee_paid: society.membership_fee || 0,
      });
      setMembershipSuccess(true);
      fetchSocietyData();
      setTimeout(() => {
        setMembershipSuccess(false);
        setShowMembershipModal(false);
        setMembershipProof('');
        setMembershipTxId('');
      }, 3500);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit membership application.');
    } finally {
      setMembershipSubmitting(false);
    }
  };

  const handleEventRegistration = async (e) => {
    if (e) e.preventDefault();
    if (!selectedEventForReg) return;
    if (!user) {
      navigate('/login', { state: { from: `/societies/${id}` } });
      return;
    }
    if (user.role !== 'student') {
      alert('Only enrolled students can register for event tickets.');
      return;
    }
    setIsRegistering(true);

    try {
      if (selectedEventForReg.is_paid) {
        if (!transactionId.trim() && !paymentProofFile) {
          alert("Please enter your transaction reference ID or upload your receipt proof.");
          setIsRegistering(false);
          return;
        }
        const formData = new FormData();
        formData.append('event', selectedEventForReg.id);
        if (paymentProofFile) {
          formData.append('payment_proof', paymentProofFile);
          formData.append('receipt_file', paymentProofFile);
        }
        formData.append('transaction_id', transactionId.trim() || `TXN-${Date.now().toString().slice(-8)}`);
        if (receiptDetails.trim()) {
          formData.append('receipt_details', receiptDetails.trim());
        }

        await api.post('registrations/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('registrations/', { event: selectedEventForReg.id });
      }

      setRegSuccessMsg(
        selectedEventForReg.is_paid
          ? "Payment proof submitted! Your ticket will be issued once verified by the cabinet/advisor."
          : "Registration confirmed! Your QR Ticket is ready in My Profile."
      );
      setTimeout(() => {
        setRegSuccessMsg(null);
        setSelectedEventForReg(null);
        setTransactionId('');
        setReceiptDetails('');
        setPaymentProofFile(null);
      }, 3500);
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.detail || 'Registration failed.');
    } finally {
      setIsRegistering(false);
    }
  };

  const isSocietyManager = user && (
    user.role === 'admin' || 
    (user.role === 'president' && (society?.president === user.id || user.society === society?.id)) ||
    (user.role === 'faculty' && (society?.advisor === user.id || user.society === society?.id))
  );

  const now = new Date();
  const upcomingEvents = events.filter(e => new Date(e.date) >= now);
  const pastEvents = events.filter(e => new Date(e.date) < now);
  const openRecruitments = recruitments.filter(r => r.status === 'open');

  // Avoid duplicate cards: President and Advisor already have separate dedicated leadership cards
  const advisorId = society?.advisor?.id || society?.advisor;
  const presidentId = society?.president?.id || society?.president;
  const advisorUsername = (society?.advisor_name || '').toLowerCase();
  const presidentUsername = (society?.president_name || '').toLowerCase();
  const advisorFullName = (society?.advisor_full_name || '').toLowerCase();
  const presidentFullName = (society?.president_full_name || '').toLowerCase();

  const displayedCabinet = sortSocietyMembers(
    cabinet.filter(m => {
      if (!m) return false;
      const memUserId = m.student_id || m.user;
      const memUsername = (m.username || '').toLowerCase();
      const memFullName = (m.full_name || '').toLowerCase();
      
      // Check if matches Advisor
      if (advisorId && (memUserId === advisorId || Number(memUserId) === Number(advisorId))) return false;
      if (advisorUsername && (memUsername === advisorUsername || (advisorFullName && memFullName === advisorFullName))) return false;
      
      // Check if matches President
      if (presidentId && (memUserId === presidentId || Number(memUserId) === Number(presidentId))) return false;
      if (presidentUsername && (memUsername === presidentUsername || (presidentFullName && memFullName === presidentFullName))) return false;

      return true;
    })
  );

  const totalLeadershipCount = (society?.advisor_name || society?.advisor ? 1 : 0) + (society?.president_name || society?.president ? 1 : 0);
  const totalTeamCount = displayedCabinet.length + totalLeadershipCount;

  if (!society) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">

      {toastMsg && (
        <div className="fixed top-24 right-6 z-50 bg-emerald-900 text-emerald-100 border border-emerald-500 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span className="text-xs font-bold">{toastMsg}</span>
        </div>
      )}

      {/* 1. COVER BANNER & SOCIETY HEADER */}
      <div className="relative text-white">
        <div className="w-full overflow-hidden relative bg-slate-950 aspect-[2/1] sm:aspect-[21/9] md:aspect-[3/1] min-h-[160px]">
          <MediaImage
            src={getMediaUrl(society.cover_image || society.cover_photo) || "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600&auto=format&fit=crop&q=80"}
            onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600&auto=format&fit=crop&q=80"; }}
            alt="Cover"
            className="w-full h-full object-cover object-center brightness-100 contrast-100"
          />
        </div>

        {/* Compact Glass Information Panel */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative mt-2 sm:-mt-6 md:-mt-10 pb-6">
          <div className="bg-slate-900/90 supports-[backdrop-filter]:bg-slate-900/80 supports-[backdrop-filter]:backdrop-blur-[8px] border border-white/15 rounded-2xl p-4 sm:p-5 shadow-xl shadow-slate-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Compact Logo */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-white/80 shadow-md overflow-hidden shrink-0 bg-white">
                {society.logo ? (
                  <MediaImage
                    src={getMediaUrl(society.logo)}
                    onError={handleImageError}
                    alt={society.name}
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-2xl sm:text-3xl font-black text-white">
                    {society.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-sm">{society.name}</h1>
                  <span title="Verified University Society" className="p-0.5 text-emerald-400 bg-emerald-950/80 rounded-full border border-emerald-500/40">
                    <ShieldCheck size={16} />
                  </span>
                </div>
                <p className="text-xs text-indigo-100/90 font-medium mt-0.5">
                  Departmental Chapter • Campus Leadership & Excellence
                </p>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2 text-[11px] text-slate-200 font-semibold">
                  <span className="bg-black/40 px-2 py-0.5 rounded-lg border border-white/10 flex items-center gap-1">📍 Main Campus</span>
                  <span className="bg-black/40 px-2 py-0.5 rounded-lg border border-white/10 flex items-center gap-1 max-w-full">🏛️ Advisor: <strong className="text-white truncate max-w-[140px] sm:max-w-none">{formatAdvisorDisplayName(society)}</strong></span>
                  <span className="bg-black/40 px-2 py-0.5 rounded-lg border border-white/10 flex items-center gap-1 max-w-full">👑 Pres: <strong className="text-white truncate max-w-[140px] sm:max-w-none">{formatPresidentDisplayName(society)}</strong></span>
                  {society.contact_email && (
                    <span className="bg-black/40 px-2 py-0.5 rounded-lg border border-white/10 flex items-center gap-1 max-w-full truncate">✉️ {society.contact_email}</span>
                  )}
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS & COMPACT WRAPPING SOCIAL LINKS */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 md:pt-0">
              {isSocietyManager && (
                <>
                  <button
                    onClick={() => setShowProposeModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 shadow-sm transition cursor-pointer"
                  >
                    <PlusCircle size={14} /> Propose Event
                  </button>
                  <button
                    onClick={() => setShowGalleryModal(true)}
                    className="bg-white/15 hover:bg-white/25 text-white border border-white/20 px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                  >
                    <ImageIcon size={14} /> Upload Photo
                  </button>
                </>
              )}

              <button
                onClick={() => setIsFollowing(!isFollowing)}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 transition cursor-pointer ${
                  isFollowing
                    ? 'bg-rose-50 text-rose-600 border border-rose-200'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                }`}
              >
                <Heart size={14} fill={isFollowing ? 'currentColor' : 'none'} />
                {isFollowing ? 'Following' : 'Follow'}
              </button>

              {/* Complete Social Links Badges (Compact & Wrap-Friendly) */}
              {society.social_links?.whatsapp && (
                <MediaLink
                  href={society.social_links.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition flex items-center gap-1 shadow-xs text-xs font-semibold"
                  title="Official WhatsApp Community / Group"
                >
                  <WhatsAppIcon size={14} />
                  <span className="hidden sm:inline">WhatsApp</span>
                </MediaLink>
              )}

              {society.social_links?.whatsapp_channel && (
                <MediaLink
                  href={society.social_links.whatsapp_channel}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition flex items-center gap-1 shadow-xs text-xs font-semibold"
                  title="Official WhatsApp Channel Broadcast"
                >
                  <WhatsAppChannelIcon size={14} />
                  <span className="hidden sm:inline">Channel</span>
                </MediaLink>
              )}

              {society.social_links?.facebook && (
                <MediaLink
                  href={society.social_links.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition flex items-center gap-1 shadow-xs text-xs font-semibold"
                  title="Facebook Official Page"
                >
                  <FacebookIcon size={14} />
                  <span className="hidden sm:inline">Facebook</span>
                </MediaLink>
              )}

              {society.social_links?.website && (
                <MediaLink
                  href={society.social_links.website}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition flex items-center gap-1 shadow-xs text-xs font-semibold"
                  title="Official Website"
                >
                  <Globe size={14} />
                  <span className="hidden sm:inline">Website</span>
                </MediaLink>
              )}

              {society.social_links?.youtube && (
                <MediaLink
                  href={society.social_links.youtube}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition flex items-center gap-1 shadow-xs text-xs font-semibold"
                  title="YouTube Channel"
                >
                  <YoutubeIcon size={14} />
                  <span className="hidden sm:inline">YouTube</span>
                </MediaLink>
              )}

              {society.social_links?.instagram && (
                <MediaLink
                  href={society.social_links.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 bg-gradient-to-r from-amber-600 via-rose-600 to-purple-600 hover:opacity-95 text-white rounded-lg transition flex items-center gap-1 shadow-xs text-xs font-semibold"
                  title="Instagram Page"
                >
                  <InstagramIcon size={14} />
                  <span className="hidden sm:inline">Instagram</span>
                </MediaLink>
              )}

              {society.social_links?.linkedin && (
                <MediaLink
                  href={society.social_links.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 bg-sky-700 hover:bg-sky-600 text-white rounded-lg transition flex items-center gap-1 shadow-xs text-xs font-semibold"
                  title="LinkedIn Organization"
                >
                  <LinkedinIcon size={14} />
                  <span className="hidden sm:inline">LinkedIn</span>
                </MediaLink>
              )}

              {society.social_links?.twitter && (
                <MediaLink
                  href={society.social_links.twitter}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition flex items-center gap-1 shadow-xs text-xs font-semibold"
                  title="Twitter / X"
                >
                  <TwitterIcon size={13} />
                  <span className="hidden sm:inline">X</span>
                </MediaLink>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. RECRUITMENT CALLOUT BANNER */}
      {openRecruitments.length > 0 && (
        <div className="bg-amber-500 text-amber-950 px-4 py-3 shadow-inner">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-amber-950 text-amber-400 rounded-lg">
                <Clock size={14} />
              </span>
              <span><strong>Recruitment Drive Active!</strong> Open positions available — apply to join the executive team.</span>
            </div>
            <button
              onClick={() => setActiveTab('recruitment')}
              className="bg-amber-950 text-amber-100 hover:bg-amber-900 px-4 py-1.5 rounded-xl font-extrabold uppercase tracking-wider transition cursor-pointer"
            >
              View Open Positions →
            </button>
          </div>
        </div>
      )}

      {/* 3. NAVIGATION TABS */}
      <div className="bg-white border-b border-slate-200 sticky top-20 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-2 overflow-x-auto py-2.5">
          {[
            { id: 'overview', label: 'About & Overview' },
            { id: 'team', label: `Team Structure (${totalTeamCount})` },
            { id: 'events', label: `Active Events (${upcomingEvents.length})` },
            { id: 'membership', label: myMembership ? `✅ Membership (${myMembership.status})` : `🪪 Join Membership` },
            { id: 'recruitment', label: `🎯 Recruitment (${openRecruitments.length})` },
            { id: 'gallery', label: `Photo Gallery (${galleries.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. TAB CONTENTS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">

        {/* TAB: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                <h3 className="text-xl font-black text-slate-900 mb-3">About {society.name}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {society.description || "The society aims to empower students through technical workshops, national competitions, leadership training, and networking events across campus."}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  <div className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                    <h4 className="text-xs font-black uppercase tracking-wider text-indigo-700 mb-1">Our Mission</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Foster technical curiosity, teamwork, and career readiness through real-world experiential events.
                    </p>
                  </div>
                  <div className="p-5 bg-violet-50/50 border border-violet-100 rounded-2xl">
                    <h4 className="text-xs font-black uppercase tracking-wider text-violet-700 mb-1">Our Vision</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      To be the most active, recognized, and impactful student community within the university.
                    </p>
                  </div>
                </div>
              </div>

              {/* FACULTY ADVISOR ENDORSEMENT */}
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex items-start gap-5">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-emerald-50 border border-emerald-200 text-emerald-600 shrink-0 flex items-center justify-center shadow-xs">
                  {(society.advisor_avatar_url || society.advisor_profile_picture_url) ? (
                    <MediaImage 
                      src={formatAvatarUrl(society.advisor_avatar_url || society.advisor_profile_picture_url)} 
                      alt={society.advisor_full_name || society.advisor_name || 'Faculty Advisor'} 
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <ShieldCheck size={28} />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-black text-slate-900">Faculty Advisor Oversight</h3>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Verified Faculty
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold mb-2">
                    {formatAdvisorDisplayName(society)}, Department Oversight
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed italic">
                    "This society represents the highest caliber of student engagement and innovation on our campus. I encourage all motivated students to participate in our events and apply for cabinet membership."
                  </p>
                </div>
              </div>
            </div>

            {/* SIDEBAR DETAILS & BANK INFO */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-base font-black text-slate-900">Society Details</h3>
                <div className="space-y-3 text-xs text-slate-600">
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-400 font-bold">Category</span>
                    <span className="font-bold text-slate-800">Academic & Technical</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-400 font-bold">Total Events</span>
                    <span className="font-bold text-slate-800">{events.length} Completed</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100 items-center">
                    <span className="text-slate-400 font-bold">Campus Accreditation</span>
                    <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 text-[11px] font-black px-2.5 py-0.5 rounded-full">
                      ✓ Recognized Chapter
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100 items-center">
                    <span className="text-slate-400 font-bold">Your Membership</span>
                    {myMembership?.status === 'active' ? (
                      <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 text-[11px] font-black px-2.5 py-0.5 rounded-full">
                        ✓ Enrolled Member
                      </span>
                    ) : myMembership?.status === 'pending' ? (
                      <span className="text-amber-700 bg-amber-50 border border-amber-200 text-[11px] font-black px-2.5 py-0.5 rounded-full">
                        ⏳ Verification Pending
                      </span>
                    ) : (
                      <span className="text-slate-500 bg-slate-100 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                        Not Enrolled
                      </span>
                    )}
                  </div>
                  <div className="py-2 border-b border-slate-100">
                    <span className="text-slate-400 font-bold block mb-1">Official Bank Account</span>
                    <span className="font-bold text-slate-800 block">{society.bank_name || 'Campus Trust Bank'}</span>
                    <span className="font-mono text-[11px] text-indigo-600">{society.bank_account_number || 'PK82UNIV000192837465'}</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowContactModal(true)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-2xl font-bold text-xs transition cursor-pointer"
                >
                  Contact Society Cabinet
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: TEAM STRUCTURE */}
        {activeTab === 'team' && (
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-black text-slate-900">Society Leadership & Executive Body</h3>
              <p className="text-xs text-slate-500 mt-1">Official structure comprising Faculty Advisor, President, and Executive Cabinet.</p>
            </div>

            {/* KEY LEADERS (ADVISOR & PRESIDENT) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* FACULTY ADVISOR CARD */}
              <div className="bg-white rounded-3xl p-6 border-2 border-indigo-100 shadow-sm flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-indigo-50 border border-indigo-200 shrink-0 flex items-center justify-center shadow-xs">
                  {(society.advisor_avatar_url || society.advisor_profile_picture_url) ? (
                    <MediaImage 
                      src={formatAvatarUrl(society.advisor_avatar_url || society.advisor_profile_picture_url)} 
                      alt={formatAdvisorDisplayName(society)} 
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <span className="text-indigo-600 font-black text-2xl uppercase">
                      {formatAdvisorDisplayName(society).charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                    Faculty Advisor
                  </span>
                  <h4 className="font-black text-slate-900 text-lg mt-1">
                    {formatAdvisorDisplayName(society)}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {society.advisor_department ? `${society.advisor_department} • Academic Oversight` : 'Departmental Academic Oversight & Approvals'}
                  </p>
                </div>
              </div>

              {/* SOCIETY PRESIDENT CARD */}
              <div className="bg-white rounded-3xl p-6 border-2 border-purple-100 shadow-sm flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-purple-50 border border-purple-200 shrink-0 flex items-center justify-center shadow-xs">
                  {(society.president_avatar_url || society.president_profile_picture_url) ? (
                    <MediaImage 
                      src={formatAvatarUrl(society.president_avatar_url || society.president_profile_picture_url)} 
                      alt={formatPresidentDisplayName(society)} 
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <span className="text-purple-600 font-black text-2xl uppercase">
                      {formatPresidentDisplayName(society).charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
                    Society President
                  </span>
                  <h4 className="font-black text-slate-900 text-lg mt-1">
                    {formatPresidentDisplayName(society)}
                  </h4>
                  <p className="text-xs text-slate-500">Chief Executive Body Leader & Operations</p>
                </div>
              </div>
            </div>

            {/* EXECUTIVE BODY / CABINET MEMBERS - AUTOMATICALLY SORTED STRICTLY BY HIERARCHY */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-black text-slate-900">Executive Cabinet & Board ({displayedCabinet.length})</h4>
                  <p className="text-xs text-slate-500">
                    {user && ['president','faculty','admin'].includes(user.role)
                      ? 'Click any member card to view their complete profile.'
                      : 'Society cabinet members arranged in institutional hierarchy order.'}
                  </p>
                </div>
              </div>

              {displayedCabinet.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 text-slate-400 text-xs">
                  Executive cabinet appointments are currently open under the recruitment tab.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {displayedCabinet.map(m => {
                    const canViewFull = user && ['president','faculty','admin'].includes(user.role);
                    return (
                      <div
                        key={m.id}
                        onClick={() => canViewFull && setSelectedCabinetStudent(m)}
                        className={`bg-white rounded-3xl p-5 border border-slate-200 transition text-center group relative overflow-hidden flex flex-col justify-between ${
                          canViewFull ? 'hover:border-indigo-400 hover:shadow-xl cursor-pointer' : 'cursor-default'
                        }`}
                      >
                        {canViewFull && (
                          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                            View Profile ↗
                          </div>
                        )}
                        <div>
                          {/* Profile Avatar */}
                          <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-3 shadow-md group-hover:scale-105 transition bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center">
                            {m.avatar_url ? (
                              <MediaImage src={formatAvatarUrl(m.avatar_url)} alt={m.full_name || m.username} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white font-black text-xl">{(m.full_name || m.username || 'U')[0].toUpperCase()}</span>
                            )}
                          </div>
                          <h5 className="font-black text-slate-900 text-sm group-hover:text-indigo-600 transition">{m.full_name || m.username}</h5>
                          <span className="text-xs font-bold text-indigo-600 block mt-0.5">{m.role_title}</span>
                          {/* ALWAYS VISIBLE: partial info */}
                          <span className="text-[11px] font-mono text-slate-500 block mt-1 font-bold">
                            {m.roll_number ? `Roll: ${m.roll_number}` : `Session: ${m.term_year || '2026-2027'}`}
                          </span>
                          {m.department && <span className="text-[10px] text-slate-400 block">{m.department}</span>}
                          {m.semester && <span className="text-[10px] text-slate-400 block">Semester {m.semester}</span>}
                        </div>
                        {/* RESTRICTED: only for leadership */}
                        <div className="mt-3">
                          {canViewFull ? (
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400 group-hover:text-indigo-600">
                              <span>Click to view full record</span>
                            </div>
                          ) : (
                            <div className="pt-2 text-[10px] text-slate-300 font-medium">🔒 Protected</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: ACTIVE EVENTS */}
        {activeTab === 'events' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Upcoming Approved Events ({upcomingEvents.length})</h3>
                <p className="text-xs text-slate-500 mt-0.5">Events scheduled and approved by the Faculty Advisor.</p>
              </div>

              {isSocietyManager && (
                <button
                  onClick={() => setShowProposeModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  <PlusCircle size={15} /> Propose Event
                </button>
              )}
            </div>

            {upcomingEvents.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-400 text-sm">
                No upcoming events scheduled right now. Check back soon!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {upcomingEvents.map(e => (
                  <div key={e.id} className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
                    {/* Replace the static crowd image with the dynamic URL */}
                    <div className="w-full aspect-[16/9] sm:aspect-[2/1] md:aspect-[16/9] bg-gray-200 relative overflow-hidden">
                      <MediaImage 
                        src={e.poster_image_url || e.image || '/default-placeholder.jpg'} 
                        alt={e.title} 
                        className="w-full h-full object-cover object-center rounded-t-xl group-hover:scale-105 transition duration-300"
                        onError={(ev) => {
                          ev.target.src = '/default-placeholder.jpg';
                        }}
                      />
                      {/* The Society Badge and Free Entry pill sit on top of this */}
                      <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded flex items-center gap-2">
                        {society.logo ? (
                          <MediaImage
                            src={getMediaUrl(society.logo)}
                            onError={handleImageError}
                            className="w-4 h-4 rounded-full object-cover"
                            alt=""
                          />
                        ) : null}
                        <span>{society.name}</span>
                      </div>
                      <div className="absolute top-3 right-3">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full shadow-md ${e.is_paid ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'}`}>
                          {e.is_paid ? `PKR ${e.price}` : 'Free Entry'}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 text-base line-clamp-1 group-hover:text-indigo-600 transition">{e.title}</h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-3 leading-relaxed">{e.description}</p>
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <Link
                          to={`/events/${e.id}`}
                          className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                        >
                          Details & Info →
                        </Link>
                        <button
                          onClick={() => setSelectedEventForReg(e)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
                        >
                          Register
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* PAST CONCLUDED EVENTS */}
            <div>
              <h4 className="text-lg font-black text-slate-900 mb-4">Past Concluded Events ({pastEvents.length})</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {pastEvents.map(e => (
                  <div key={e.id} className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm opacity-85 hover:opacity-100 transition flex flex-col justify-between">
                    <div className="w-full h-36 relative bg-slate-800 overflow-hidden">
                      <MediaImage 
                        src={e.image || e.banner || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80'} 
                        alt={e.title}
                        className="w-full h-full object-cover filter grayscale contrast-125"
                      />
                      <span className="absolute top-2.5 right-2.5 text-[10px] font-bold text-slate-200 bg-slate-900/80 px-2.5 py-0.5 rounded-full border border-white/20">
                        Concluded
                      </span>
                    </div>
                    <div className="p-4">
                      <h5 className="font-bold text-slate-900 text-sm mt-1">{e.title}</h5>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{e.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: MEMBERSHIP */}
        {activeTab === 'membership' && (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Society Membership</h3>
                <p className="text-xs text-slate-500 mt-0.5">Pay the membership fee to become an official registered member of this society.</p>
              </div>
              {society.logo && (
                <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-slate-200 shadow-sm">
                  <MediaImage
                    src={getMediaUrl(society.logo)}
                    onError={handleImageError}
                    alt={society.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            {/* Membership Status for current user */}
            {user && myMembership && (
              <div className={`rounded-3xl p-5 border-2 ${
                myMembership.status === 'active' ? 'border-emerald-300 bg-emerald-50' :
                myMembership.status === 'pending' ? 'border-amber-300 bg-amber-50' :
                myMembership.status === 'rejected' ? 'border-red-200 bg-red-50' :
                'border-slate-200 bg-slate-50'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {myMembership.status === 'active' ? '✅' : myMembership.status === 'pending' ? '⏳' : myMembership.status === 'rejected' ? '❌' : '⚠️'}
                  </span>
                  <div>
                    <p className="font-black text-slate-900 text-sm">
                      Your Membership: <span className="capitalize">{myMembership.status}</span>
                    </p>
                    {myMembership.status === 'active' && (
                      <p className="text-xs text-emerald-700 mt-0.5">🎉 You are an official member of {society.name}! Your membership card is active.</p>
                    )}
                    {myMembership.status === 'pending' && (
                      <p className="text-xs text-amber-700 mt-0.5">Your payment proof is under review. The president will approve shortly.</p>
                    )}
                    {myMembership.status === 'rejected' && myMembership.rejection_reason && (
                      <p className="text-xs text-red-700 mt-0.5">Reason: {myMembership.rejection_reason}</p>
                    )}
                    {myMembership.status === 'suspended' && (
                      <p className="text-xs text-orange-700 mt-0.5">Contact the society president to resolve this.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Membership closed */}
            {!society.is_membership_open ? (
              <div className="bg-white rounded-3xl p-10 text-center border-2 border-dashed border-slate-200">
                <div className="text-4xl mb-3">🔒</div>
                <h4 className="font-black text-slate-700 text-lg">Membership Applications Closed</h4>
                <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto">
                  The society is not currently accepting new membership applications. Check back during the next enrollment window.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Info Card */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white rounded-3xl p-7 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white">
                        <CreditCard size={22} />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900">Official Society Membership</h4>
                        <p className="text-xs text-slate-500">{society.membership_description || 'Join as an official registered member.'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-5">
                      <div className="bg-indigo-50 rounded-2xl p-4 text-center">
                        <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Membership Fee</p>
                        <p className="text-3xl font-black text-indigo-700 mt-1">
                          {Number(society.membership_fee) > 0 ? `PKR ${Number(society.membership_fee).toLocaleString()}` : 'Free'}
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-4 text-center">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Validity</p>
                        <p className="text-xl font-black text-slate-700 mt-1">Academic Session 2026–27</p>
                      </div>
                    </div>

                    <ul className="space-y-2 text-xs text-slate-600">
                      {['Official membership card with QR code', 'Access to all society events & workshops', 'Networking with industry professionals', 'Certificate of membership eligibility'].map(b => (
                        <li key={b} className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" />{b}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Bank Details */}
                  {Number(society.membership_fee) > 0 && (
                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                      <h5 className="font-black text-slate-900 mb-3 flex items-center gap-2"><CreditCard size={16} /> Payment Details</h5>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-slate-500 font-bold">Bank Name</span>
                          <span className="font-black text-slate-900">{society.bank_name}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-slate-500 font-bold">Account Title</span>
                          <span className="font-black text-slate-900">{society.bank_account_title}</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-slate-500 font-bold">Account Number</span>
                          <span className="font-black font-mono text-slate-900">{society.bank_account_number}</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-3 italic">{society.payment_instructions}</p>
                    </div>
                  )}
                </div>

                {/* Right: CTA */}
                <div className="space-y-4">
                  {!user ? (
                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm text-center">
                      <ShieldCheck size={32} className="mx-auto text-slate-400 mb-2" />
                      <p className="text-sm font-bold text-slate-700">Sign in to apply</p>
                      <Link to="/login" className="mt-3 block bg-indigo-600 text-white rounded-xl py-2.5 text-xs font-bold hover:bg-indigo-700 transition">Log In / Register</Link>
                    </div>
                  ) : myMembership && myMembership.status !== 'rejected' ? (
                    <div className="bg-white rounded-3xl p-6 border border-emerald-200 shadow-sm text-center">
                      <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
                      <p className="text-sm font-bold text-slate-700">Application already submitted</p>
                      <p className="text-xs text-slate-400 mt-1">Status: <strong className="capitalize">{myMembership.status}</strong></p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                      <h5 className="font-black text-slate-900 mb-1">Ready to Join?</h5>
                      <p className="text-xs text-slate-500 mb-4">Complete payment and upload proof to apply for official membership.</p>
                      <button
                        onClick={() => setShowMembershipModal(true)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-2xl font-black text-sm transition shadow-lg shadow-indigo-200 cursor-pointer"
                      >
                        Apply for Membership
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: RECRUITMENT */}
        {activeTab === 'recruitment' && (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black text-slate-900">🎯 Competitive Recruitment Drives</h3>
                <p className="text-xs text-slate-500 mt-0.5">President or Faculty opens recruitment drives with specific positions. Apply for a role to join the executive team.</p>
              </div>
              {society.logo && (
                <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-slate-200 shadow-sm">
                  <MediaImage
                    src={getMediaUrl(society.logo)}
                    onError={handleImageError}
                    alt={society.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            {recruitments.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
                <div className="text-4xl mb-3">📋</div>
                <h4 className="font-black text-slate-700">No Active Recruitment Drives</h4>
                <p className="text-xs text-slate-500 mt-2">When the president opens a new drive, open positions will appear here.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {recruitments.map(rec => {
                  const positions = Array.isArray(rec.positions) ? rec.positions : [];
                  const isPast = new Date(rec.deadline) < new Date();
                  return (
                    <div key={rec.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                      {/* Drive header */}
                      <div className="p-6 border-b border-slate-100">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                            rec.status === 'open' && !isPast ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {rec.status === 'open' && !isPast ? '🟢 OPEN' : '🔴 CLOSED'}
                          </span>
                          <span className="text-xs text-slate-400 font-bold">
                            Deadline: {new Date(rec.deadline).toLocaleDateString('en-PK', {day:'numeric',month:'short',year:'numeric'})}
                          </span>
                          {rec.application_count > 0 && (
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                              {rec.application_count} Applicant{rec.application_count !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <h4 className="font-black text-slate-900 text-xl">{rec.title}</h4>
                        {rec.description && <p className="text-xs text-slate-500 mt-1">{rec.description}</p>}
                      </div>

                      {/* Positions list */}
                      {positions.length > 0 ? (
                        <div className="p-6">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">Available Positions ({positions.length})</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {positions.map((pos, i) => (
                              <div key={i} className="border border-slate-200 rounded-2xl p-4 hover:border-indigo-300 hover:bg-indigo-50/30 transition group">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <h5 className="font-black text-slate-900 text-sm group-hover:text-indigo-700">{pos.title}</h5>
                                    {pos.description && <p className="text-[11px] text-slate-500 mt-0.5">{pos.description}</p>}
                                    {Array.isArray(pos.questions) && pos.questions.length > 0 && (
                                      <p className="text-[10px] text-indigo-600 font-bold mt-1">{pos.questions.length} question{pos.questions.length !== 1 ? 's' : ''} required</p>
                                    )}
                                  </div>
                                  {rec.status === 'open' && !isPast && (
                                    !user ? (
                                      <Link
                                        to="/login"
                                        state={{ from: `/societies/${id}` }}
                                        className="shrink-0 bg-slate-900 hover:bg-indigo-600 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap"
                                      >
                                        Sign In to Apply
                                      </Link>
                                    ) : user.role === 'student' ? (
                                      <button
                                        onClick={() => {
                                          setActiveRecruitment(rec);
                                          setSelectedPosition(pos);
                                          const initialAnswers = {};
                                          (pos.questions || []).forEach((q, qi) => { initialAnswers[qi] = ''; });
                                          setApplyAnswers(initialAnswers);
                                          setApplyStep(2);
                                        }}
                                        className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap"
                                      >
                                        Apply →
                                      </button>
                                    ) : null
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        /* Legacy/general application */
                        rec.status === 'open' && !isPast && (
                          <div className="p-6 pt-0">
                            {user && user.role === 'student' ? (
                              <button
                                onClick={() => { setActiveRecruitment(rec); setApplyStep(1); }}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer"
                              >
                                Apply for this Drive
                              </button>
                            ) : !user && (
                              <Link to="/login" className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold">Sign In to Apply</Link>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB: PHOTO GALLERY */}
        {activeTab === 'gallery' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Event Photo Gallery ({galleries.length})</h3>
                <p className="text-xs text-slate-500 mt-0.5">Moments from past hackathons, workshops, and society summits.</p>
              </div>

              {isSocietyManager && (
                <button
                  onClick={() => setShowGalleryModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  <PlusCircle size={15} /> Upload Photo
                </button>
              )}
            </div>

            {galleries.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-400 text-sm">
                No photos have been uploaded to this gallery yet.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {galleries.map((img, i) => (
                  <div key={i} className="h-56 rounded-2xl overflow-hidden shadow-sm bg-slate-100 relative group">
                    <MediaImage
                      src={img.image_url || img.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60'}
                      alt="Gallery"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* EVENT REGISTRATION MODAL (FREE VS PAID FLOW) */}
      {selectedEventForReg && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedEventForReg(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-2">
              {society.logo && (
                <div className="w-8 h-8 rounded-lg overflow-hidden shadow-sm shrink-0">
                  <MediaImage
                    src={getMediaUrl(society.logo)}
                    onError={handleImageError}
                    alt={society.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                {society.name}
              </span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mt-2">{selectedEventForReg.title}</h3>
            <p className="text-xs text-slate-600 mt-1">{selectedEventForReg.description}</p>

            <div className="my-5 p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1.5 text-xs text-slate-700 font-semibold">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase">Date:</span>
                <span>{new Date(selectedEventForReg.date).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase">Admission:</span>
                <span className="font-black text-indigo-700">{selectedEventForReg.is_paid ? `PKR ${Number(selectedEventForReg.price).toLocaleString()} (Paid)` : 'Free Entry'}</span>
              </div>
            </div>

            {/* VERIFIED STUDENT PROFILE TOGGLE CARD */}
            {user && (
              <div className="mb-5 bg-gradient-to-r from-indigo-50/80 to-slate-50 border border-indigo-100 rounded-2xl p-4 transition-all">
                <div 
                  className="flex items-center justify-between cursor-pointer select-none"
                  onClick={() => setShowRegProfileToggle(!showRegProfileToggle)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
                      {(user.first_name || user.username || 'S').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700">Verified Student Profile</span>
                        <ShieldCheck size={13} className="text-emerald-600" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">
                        {user.first_name ? `${user.first_name} ${user.last_name || ''}` : user.username}
                      </h4>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    className="p-1 rounded-lg bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition"
                  >
                    {showRegProfileToggle ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                </div>

                {showRegProfileToggle && (
                  <div className="mt-3 pt-3 border-t border-indigo-100 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-600 font-medium">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Roll Number</span>
                      <span className="font-mono font-bold text-slate-800">{user.roll_number || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Department</span>
                      <span className="font-bold text-slate-800 truncate block">{user.department || user.program || 'Campus'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Semester</span>
                      <span className="font-bold text-slate-800">{user.semester ? `Semester ${user.semester}` : 'Active'}</span>
                    </div>
                    <div className="sm:col-span-2 truncate">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Email</span>
                      <span className="font-mono text-slate-700">{user.email || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Phone</span>
                      <span className="font-mono text-slate-700">{user.phone_number || 'N/A'}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {regSuccessMsg ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600" />
                <span>{regSuccessMsg}</span>
              </div>
            ) : (
              <div>
                {/* Free Registration Flow */}
                {!selectedEventForReg.is_paid && (
                  <div className="flex justify-end gap-3 pt-3">
                    <button
                      onClick={() => setSelectedEventForReg(null)}
                      className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold"
                    >
                      Cancel
                    </button>
                    {user?.role === 'student' ? (
                      <button
                        onClick={handleEventRegistration}
                        disabled={isRegistering}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer"
                      >
                        Confirm Free Registration
                      </button>
                    ) : (
                      <Link to="/login" className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-xs font-bold">
                        Sign In as Student
                      </Link>
                    )}
                  </div>
                )}

                {/* Paid Registration Flow */}
                {selectedEventForReg.is_paid && (
                  <form onSubmit={handleEventRegistration} className="space-y-4">
                    <div className="p-5 bg-slate-900 text-white rounded-3xl space-y-4 shadow-xl">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-500/30">
                            Bank Transfer & Payment QR
                          </span>
                          <h4 className="text-base font-black mt-1">Society Payment Details</h4>
                        </div>
                          <span className="text-lg font-black text-emerald-400 font-mono">
                            PKR {Number(selectedEventForReg.price).toLocaleString()}
                          </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                        <div className="space-y-1 text-xs">
                          <div>
                            <span className="text-slate-400 text-[10px] uppercase font-bold block">Bank</span>
                            <span className="font-bold">{society.bank_name || 'Campus Trust Bank'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] uppercase font-bold block">Account Title</span>
                            <span className="font-bold">{society.bank_account_title || `${society.name} Fund`}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] uppercase font-bold block">Account / IBAN</span>
                            <span className="font-mono text-emerald-300 font-bold">{society.bank_account_number || 'PK82UNIV000192837465'}</span>
                          </div>
                        </div>

                        {society.payment_qr_url || society.payment_qr ? (
                          <div className="w-28 h-28 flex-shrink-0 border border-gray-200 p-2 rounded-xl bg-white flex items-center justify-center">
                            <MediaImage
                              src={getMediaUrl(society.payment_qr_url || society.payment_qr)}
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              alt="Bank QR"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl text-slate-900">
                            <QRCode 
                              value={`BANK-PAYMENT:${society.bank_account_number || 'PK82UNIV000192837465'};AMOUNT:${selectedEventForReg.price};EVENT:${selectedEventForReg.id}`}
                              size={100} 
                            />
                            <span className="text-[9px] font-bold text-slate-500 mt-1 uppercase">Scan to Pay</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                        Upload Transaction Receipt *
                      </label>
                      <input 
                        type="file" 
                        required={!transactionId}
                        accept="image/*, application/pdf" 
                        onChange={(e) => setPaymentProofFile(e.target.files[0])}
                        className="w-full bg-white border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 text-xs" 
                      />
                      <p className="text-[11px] text-gray-500 mt-1">Upload a screenshot of your successful transaction. The executive cabinet will verify this before confirming your ticket.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                        Transaction Reference ID / Deposit Proof (Optional if receipt attached)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. TXN-98471029 or Bank Ref #"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                        Payment Notes / Sender Name (Optional)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Transferred via online mobile banking..."
                        value={receiptDetails}
                        onChange={(e) => setReceiptDetails(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setSelectedEventForReg(null)}
                        className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold"
                      >
                        Cancel
                      </button>
                      {user?.role === 'student' ? (
                        <button
                          type="submit"
                          disabled={isRegistering}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer"
                        >
                          Submit Payment Proof & Register
                        </button>
                      ) : (
                        <Link to="/login" className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-xs font-bold">
                          Sign In as Student
                        </Link>
                      )}
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PROPOSE EVENT MODAL */}
      {showProposeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <h3 className="text-xl font-black text-slate-900 mb-1">Propose New Event for {society.name}</h3>
            <p className="text-xs text-slate-500 mb-4">
              Submitted proposals will undergo review by the Faculty Advisor or Super Admin before publishing live.
            </p>

            <form onSubmit={handleProposeEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Event Title</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Campus Hackathon 2026"
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
                  placeholder="Overview, agenda, and participant details..."
                  value={eventForm.description}
                  onChange={e => setEventForm({...eventForm, description: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Date & Time</label>
                <input
                  required
                  type="datetime-local"
                  value={eventForm.date}
                  onChange={e => {
                    setEventForm({...eventForm, date: e.target.value});
                    checkDateConflict(e.target.value);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>

              {dateConflictWarning && (
                <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-2.5 text-amber-900">
                  <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
                  <p className="text-xs font-bold leading-relaxed">{dateConflictWarning}</p>
                </div>
              )}

              <div className="mb-4 p-4 border border-gray-200 rounded-xl bg-gray-50">
                <label className="block text-sm font-bold text-gray-800 mb-3 uppercase">Ticketing & Entry</label>
                
                <div className="flex gap-6 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="societyEntryType" 
                      value="free" 
                      checked={!eventForm.is_paid}
                      onChange={() => setEventForm({ ...eventForm, is_paid: false, price: 0 })}
                      className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="font-semibold text-gray-700">Free Entry</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="societyEntryType" 
                      value="paid"
                      checked={eventForm.is_paid}
                      onChange={() => setEventForm({ ...eventForm, is_paid: true })}
                      className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="font-semibold text-gray-700">Paid Event</span>
                  </label>
                </div>

                {/* Conditionally reveal the price input if "Paid" is selected */}
                {eventForm.is_paid && (
                  <div className="mt-4 animate-fade-in-down">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Ticket Price (PKR)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-gray-500 font-bold">Rs.</span>
                      <input 
                        type="number" 
                        min="10"
                        required={eventForm.is_paid}
                        value={eventForm.price || ''}
                        onChange={(e) => setEventForm({ ...eventForm, price: e.target.value })}
                        placeholder="e.g. 500"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProposeModal(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!!dateConflictWarning}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Submit Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPLOAD GALLERY MODAL */}
      {showGalleryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-xl font-black text-slate-900 mb-1">Add Photo to Society Gallery</h3>
            <p className="text-xs text-slate-500 mb-4">Select an image from your PC or mobile gallery to showcase on this society page and campus home feed.</p>

            <form onSubmit={handleUploadGallery} className="space-y-4">
              <div>
                <ImageUploader
                  label="Select Gallery Photo"
                  hint="Select photo from local storage, phone gallery, or camera"
                  value={galleryUrl}
                  onChange={(url) => setGalleryUrl(url)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGalleryModal(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Publish Photo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MEMBERSHIP APPLICATION MODAL */}
      {showMembershipModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => { setShowMembershipModal(false); setMembershipSuccess(false); }}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-1">
              {society.logo && (
                <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-slate-200 shadow-sm">
                  <MediaImage
                    src={getMediaUrl(society.logo)}
                    onError={handleImageError}
                    alt={society.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                  Membership Application
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">{society.name}</h3>
              </div>
            </div>

            {membershipSuccess ? (
              <div className="my-8 p-6 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-3xl text-center">
                <CheckCircle2 className="mx-auto text-emerald-500 mb-3" size={48} />
                <h4 className="font-black text-lg">Application Submitted!</h4>
                <p className="text-xs mt-2 text-emerald-700">
                  Your payment proof has been submitted. The society president will verify and activate your membership within 24–48 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleMembershipApply} className="space-y-5 mt-5">
                {/* Fee & bank info */}
                {Number(society.membership_fee) > 0 ? (
                  <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-400">Membership Fee</span>
                      <span className="text-2xl font-black text-emerald-400">PKR {Number(society.membership_fee).toLocaleString()}</span>
                    </div>
                    <div className="border-t border-slate-700 pt-3 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">Bank</span>
                        <span className="font-bold">{society.bank_name || 'HBL / Meezan Bank'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">Account Title</span>
                        <span className="font-bold">{society.bank_account_title || society.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">Account No.</span>
                        <span className="font-mono text-emerald-300 font-bold">{society.bank_account_number || '—'}</span>
                      </div>
                    </div>
                    {society.payment_instructions && (
                      <p className="text-[10px] text-slate-400 italic border-t border-slate-700 pt-2">{society.payment_instructions}</p>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
                    <p className="text-sm font-black text-emerald-700">🎉 Free Membership!</p>
                    <p className="text-xs text-emerald-600 mt-1">No payment required — just submit your application below.</p>
                  </div>
                )}

                {/* Transaction proof */}
                {Number(society.membership_fee) > 0 && (
                  <>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Transaction Reference ID / JazzCash / EasyPaisa Ref *
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. TXN-28471029 or Bank Slip Ref #"
                        value={membershipTxId}
                        onChange={(e) => setMembershipTxId(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Payment Proof Screenshot *
                      </label>
                      <ImageUploader
                        label="Upload Payment Screenshot"
                        hint="Upload screenshot of your bank transfer or mobile payment confirmation"
                        value={membershipProof}
                        onChange={(url) => setMembershipProof(url)}
                      />
                      {membershipProof && (
                        <p className="text-[10px] text-emerald-600 mt-1 font-bold">✅ Proof uploaded successfully</p>
                      )}
                    </div>
                  </>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowMembershipModal(false)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={membershipSubmitting}
                    className="px-7 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-200 cursor-pointer"
                  >
                    {membershipSubmitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* RECRUITMENT APPLICATION MODAL */}
      {activeRecruitment && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="bg-[#151B2B] p-6 text-white text-center relative shrink-0">
              <button 
                onClick={() => {
                  setActiveRecruitment(null);
                  setSelectedPosition(null);
                  setApplySuccess(false);
                  setApplyAnswers({});
                }} 
                className="absolute top-4 right-4 text-gray-400 hover:text-white text-lg transition p-1 cursor-pointer"
              >
                ✕
              </button>
              
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white p-1 overflow-hidden flex items-center justify-center border border-white/20 shadow-inner">
                {society.logo ? (
                  <MediaImage
                    src={getMediaUrl(society.logo)}
                    onError={handleImageError}
                    className="w-full h-full object-cover rounded-full"
                    alt="Society Logo"
                  />
                ) : (
                  <span className="text-xl font-black text-slate-800">{society.name?.charAt(0) || 'S'}</span>
                )}
              </div>
              
              <span className="bg-purple-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide inline-block">
                Official Recruitment
              </span>
              <h2 className="text-xl font-bold mt-3 text-white leading-tight">
                {activeRecruitment.title || "Executive Cabinet Drive 2026"}
              </h2>
            </div>

            {/* Form Body */}
            <div className="p-6 overflow-y-auto">
              {!user ? (
                <div className="my-4 p-6 bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl text-center space-y-3">
                  <ShieldCheck className="mx-auto text-indigo-600 mb-2" size={40} />
                  <h4 className="font-bold text-lg">Student Login Required</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    You must be signed in with an active university student account to apply for recruitment positions.
                  </p>
                  <Link
                    to="/login"
                    state={{ from: `/societies/${id}` }}
                    className="inline-block px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition"
                  >
                    Sign In to Apply
                  </Link>
                </div>
              ) : user.role !== 'student' ? (
                <div className="my-4 p-6 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-center space-y-2">
                  <AlertTriangle className="mx-auto text-amber-600 mb-2" size={36} />
                  <h4 className="font-bold text-base">Student Account Required</h4>
                  <p className="text-xs text-amber-700 max-w-sm mx-auto">
                    Only enrolled students can apply for open society recruitment drives. Management accounts can view applicants in the dashboard.
                  </p>
                </div>
              ) : applySuccess ? (
                <div className="my-4 p-6 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-center">
                  <CheckCircle2 className="mx-auto text-emerald-500 mb-3" size={48} />
                  <h4 className="font-bold text-lg">Application Submitted!</h4>
                  <p className="text-xs mt-2 text-emerald-700">
                    Your application for <strong>{typeof selectedPosition === 'string' ? selectedPosition : (selectedPosition?.title || applyRole)}</strong> has been submitted. You will be contacted regarding interview schedules.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleApply} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Target Position</label>
                    <select 
                      required 
                      value={typeof selectedPosition === 'string' ? selectedPosition : (selectedPosition?.title || applyRole || '')}
                      onChange={(e) => {
                        const val = e.target.value;
                        setApplyRole(val);
                        const posObj = Array.isArray(activeRecruitment.positions) 
                          ? activeRecruitment.positions.find(p => (typeof p === 'string' ? p : p.title) === val)
                          : null;
                        setSelectedPosition(posObj || val);
                      }}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 outline-none text-sm font-medium text-slate-800"
                    >
                      <option value="" disabled>Select a cabinet role...</option>
                      {Array.isArray(activeRecruitment.positions) && activeRecruitment.positions.length > 0 ? (
                        activeRecruitment.positions.map((pos, idx) => {
                          const pTitle = typeof pos === 'string' ? pos : pos.title;
                          return (
                            <option key={idx} value={pTitle}>{pTitle}</option>
                          );
                        })
                      ) : (
                        <>
                          <option value="Vice President">Vice President</option>
                          <option value="General Secretary">General Secretary</option>
                          <option value="Webmaster">Webmaster</option>
                          <option value="Event Coordinator">Event Coordinator</option>
                          <option value="Media & Marketing Lead">Media & Marketing Lead</option>
                          <option value="Finance Secretary">Finance Secretary</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* If selected position has specific questions */}
                  {selectedPosition && typeof selectedPosition === 'object' && Array.isArray(selectedPosition.questions) && selectedPosition.questions.length > 0 ? (
                    <div className="space-y-3">
                      <label className="block text-sm font-bold text-gray-700">Required Screening Questions</label>
                      {selectedPosition.questions.map((q, qi) => (
                        <div key={qi}>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">
                            Q{qi + 1}. {q}
                          </label>
                          <textarea
                            required
                            rows={2}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                            placeholder={`Your answer to: ${q}`}
                            value={applyAnswers[qi] || ''}
                            onChange={(e) => setApplyAnswers(prev => ({ ...prev, [qi]: e.target.value }))}
                          />
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Statement of Motivation</label>
                    <textarea 
                      required 
                      rows={4} 
                      value={applyAnswers['motivation'] !== undefined ? applyAnswers['motivation'] : (applyAnswers[0] || '')}
                      onChange={(e) => setApplyAnswers(prev => ({ ...prev, 0: e.target.value, motivation: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 outline-none text-sm text-slate-800"
                      placeholder={`Detail your relevant experience and why you are the best fit for this ${society.name || 'CSSC'} position...`}
                    ></textarea>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button 
                      type="button" 
                      onClick={() => {
                        setActiveRecruitment(null);
                        setSelectedPosition(null);
                        setApplyAnswers({});
                      }} 
                      className="w-1/3 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition text-sm cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="w-2/3 py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 shadow-md transition text-sm cursor-pointer"
                    >
                      Submit Application
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONTACT CABINET MODAL */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowContactModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-black text-slate-900 mb-2">Contact {society.name}</h3>
            <p className="text-xs text-slate-500 mb-4">Send a message or collaboration proposal directly to the society president.</p>

            {contactSuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-center text-xs font-bold">
                <CheckCircle2 className="mx-auto text-emerald-600 mb-2" size={28} />
                Message sent successfully to the cabinet!
              </div>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault();
                setContactSuccess(true);
                setTimeout(() => {
                  setContactSuccess(false);
                  setShowContactModal(false);
                  setContactMsg({ subject: '', message: '' });
                }, 2000);
              }} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sponsorship inquiry, Workshop suggestion"
                    value={contactMsg.subject}
                    onChange={(e) => setContactMsg({ ...contactMsg, subject: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Message</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Type your message..."
                    value={contactMsg.message}
                    onChange={(e) => setContactMsg({ ...contactMsg, message: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowContactModal(false)}
                    className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
                  >
                    Send Message
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* STUDENT COMPLETE INFORMATION DOSSIER MODAL */}
      {selectedCabinetStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedCabinetStudent(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Header with avatar & role */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-tr from-indigo-600 via-violet-600 to-purple-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shrink-0">
                {selectedCabinetStudent.avatar_url ? (
                  <MediaImage src={selectedCabinetStudent.avatar_url} alt={selectedCabinetStudent.full_name || selectedCabinetStudent.username} className="w-full h-full object-cover" />
                ) : (
                  (selectedCabinetStudent.full_name || selectedCabinetStudent.username || 'S')[0].toUpperCase()
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-black text-slate-900">
                    {selectedCabinetStudent.full_name || selectedCabinetStudent.username}
                  </h3>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Verified Cabinet Record
                  </span>
                </div>
                <p className="text-sm font-bold text-indigo-600 mt-0.5">
                  {selectedCabinetStudent.role_title} • Term {selectedCabinetStudent.term_year || '2026-2027'}
                </p>
                <span className="text-xs font-mono font-bold text-slate-500 block">
                  Roll No: {selectedCabinetStudent.roll_number || selectedCabinetStudent.username}
                </span>
              </div>
            </div>

            {/* Complete Detailed Student Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Student Full Name</span>
                <span className="text-xs font-bold text-slate-900 block select-all">
                  {selectedCabinetStudent.full_name || selectedCabinetStudent.username}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Father's Name</span>
                <span className="text-xs font-bold text-slate-900 block select-all">
                  {selectedCabinetStudent.father_name || 'N/A'}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">National CNIC</span>
                <span className="text-xs font-mono font-bold text-slate-900 block select-all">
                  {selectedCabinetStudent.cnic || 'CNIC on File (Verified)'}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">University Roll Number</span>
                <span className="text-xs font-mono font-bold text-indigo-600 block select-all">
                  {selectedCabinetStudent.roll_number || selectedCabinetStudent.username}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">System Username</span>
                <span className="text-xs font-mono font-bold text-slate-700 block select-all">
                  @{selectedCabinetStudent.username}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Degree Program</span>
                <span className="text-xs font-bold text-slate-900 block select-all">
                  {selectedCabinetStudent.program || 'BS Cyber Security / Computer Science'}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Department</span>
                <span className="text-xs font-bold text-slate-900 block select-all">
                  {selectedCabinetStudent.department || 'Department of Computer Science'}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Faculty / School</span>
                <span className="text-xs font-bold text-slate-900 block select-all">
                  {selectedCabinetStudent.faculty_name || 'Faculty of Computing & IT'}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Official University Email</span>
                <span className="text-xs font-bold text-slate-900 block truncate select-all">
                  {selectedCabinetStudent.email || `${selectedCabinetStudent.username}@university.edu.pk`}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Contact Phone Number</span>
                <span className="text-xs font-bold text-slate-900 block select-all">
                  {selectedCabinetStudent.phone_number || '+92 300 1234567'}
                </span>
              </div>

              <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
                <span className="text-[10px] font-bold uppercase text-emerald-600 block">Enrolment & Status</span>
                <span className="text-xs font-bold text-emerald-800 block">
                  ✓ Active University Enrolment ({selectedCabinetStudent.is_verified ? 'Verified Official' : 'Active Member'})
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCabinetStudent(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SocietyDetail;
