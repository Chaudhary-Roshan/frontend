import { clickMediaDownload, MediaImage, MediaLink } from '../../components/common/AuthenticatedMedia';
import React, { useContext, useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { AuthContext } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  Award, QrCode, UserPlus, Users, DollarSign, MessageSquare, 
  Calendar, Clock, CheckCircle2, ChevronRight, PlusCircle, ShieldCheck, 
  BarChart3, Settings, Image as ImageIcon, AlertTriangle, AlertCircle,
  Landmark, CreditCard, Globe, Edit3, ExternalLink,
  Shield, Check, FileText, Building, Download, UploadCloud,
  Printer, ArrowUpRight, ArrowDownRight, Tag, X, UserMinus,
  Sparkles, Mail, Phone, MapPin, Eye, FileCheck, Layers,
  Folder, FolderOpen, ArrowLeft, Lock, XCircle, User,
  Trash2, Loader2
} from 'lucide-react';
import api from '../../utils/api';
import { getMediaUrl, handleImageError, DEFAULT_SOCIETY_LOGO } from '../../utils/media';
import ImageUploader from '../../components/common/ImageUploader';
import EventProposalDocumentModal from '../../components/modals/EventProposalDocumentModal';
import { generateOfficialProposalPDF } from '../../utils/officialPdfGenerator';
import CreateProposalModal from '../../components/modals/CreateProposalModal';
import ExecutiveProfileModal from '../../components/modals/ExecutiveProfileModal';
import PaymentVerificationDesk from '../../components/ticketing/PaymentVerificationDesk';
import ManualTicketingHub from '../../components/ticketing/ManualTicketingHub';
import MembershipConfiguration from '../../components/membership/MembershipConfiguration';
import { sortSocietyMembers, ROLE_TIER_CATEGORIES, getDynamicRoleRank } from '../../utils/hierarchy';
import EditAdvertisementModal from '../../components/modals/EditAdvertisementModal';
import { IUBLogoEmblem, getSocietyCertificateTheme } from '../../utils/societyCertificateThemes';

const InstagramIcon = () => (
  <svg className="w-3.5 h-3.5 text-pink-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

const LinkedinIcon = () => (
  <svg className="w-3.5 h-3.5 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect width="4" height="12" x="2" y="9"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);

const WhatsAppIcon = ({ size = 14, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
  </svg>
);

const WhatsAppChannelIcon = ({ size = 14, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    <circle cx="12" cy="4" r="1" fill="currentColor"/>
  </svg>
);

const FacebookIcon = ({ size = 14, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const YoutubeIcon = ({ size = 14, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor"/>
  </svg>
);

const TwitterIcon = ({ size = 13, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const PresidentDashboard = () => {
  const { user } = useContext(AuthContext);
  const [society, setSociety] = useState(null);
  const [events, setEvents] = useState([]);
  const [applications, setApplications] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [sponsorships, setSponsorships] = useState([]);
  const [galleries, setGalleries] = useState([]);
  const [cabinet, setCabinet] = useState([]);
  const [lockedDates, setLockedDates] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Bulk Operations State
  const [bulkEventId, setBulkEventId] = useState('');
  const [bulkFile, setBulkFile] = useState(null);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Official Event Proposals & Statutory Workflow
  const [proposals, setProposals] = useState([]);
  const [selectedProposalDoc, setSelectedProposalDoc] = useState(null);
  const [showCreateProposalModal, setShowCreateProposalModal] = useState(false);
  const [venues, setVenues] = useState([]);

  // Two-Stage Publishing & Marketing Materials Workflow (Advertise)
  const [showAdvertiseModal, setShowAdvertiseModal] = useState(false);
  const [advertiseTargetEvent, setAdvertiseTargetEvent] = useState(null);
  const [advertiseCoverFile, setAdvertiseCoverFile] = useState(null);
  const [advertiseCoverPreview, setAdvertiseCoverPreview] = useState('');
  const [advertiseGalleryFiles, setAdvertiseGalleryFiles] = useState([]);
  const [advertiseGalleryPreviews, setAdvertiseGalleryPreviews] = useState([]);
  const [advertiseDescription, setAdvertiseDescription] = useState('');
  const [isSubmittingAdvertise, setIsSubmittingAdvertise] = useState(false);
  const [advertiseError, setAdvertiseError] = useState(null);

  // Gate Volunteer Staff Assignments
  const [staffAssignments, setStaffAssignments] = useState([]);
  const [showAssignVolunteerModal, setShowAssignVolunteerModal] = useState(false);
  const [volunteerForm, setVolunteerForm] = useState({
    event_id: '',
    gate_name: 'Main Gate - Desk 1',
    duty_start: '',
    duty_end: ''
  });
  const [selectedVolunteerStudent, setSelectedVolunteerStudent] = useState(null);
  const [volunteerRollInput, setVolunteerRollInput] = useState('');
  const [volunteerSearchResults, setVolunteerSearchResults] = useState([]);
  const [isLookingUpVolunteer, setIsLookingUpVolunteer] = useState(false);

  // General Volunteer Roles & Service Hours
  const [volunteerHours, setVolunteerHours] = useState([]);
  const [showAssignGeneralVolModal, setShowAssignGeneralVolModal] = useState(false);
  const [generalVolForm, setGeneralVolForm] = useState({
    event_id: '',
    role: 'Decorator',
    description: '',
    date: new Date().toISOString().split('T')[0],
    hours: '3.0'
  });
  const [selectedGeneralVolStudent, setSelectedGeneralVolStudent] = useState(null);
  const [generalVolRollInput, setGeneralVolRollInput] = useState('');
  const [generalVolSearchResults, setGeneralVolSearchResults] = useState([]);
  const [isSearchingGeneralVol, setIsSearchingGeneralVol] = useState(false);

  // Active Ledger Filter
  const [ledgerEventFilter, setLedgerEventFilter] = useState('all');

  // Certificate Templates & Design Studio
  const [certificateTemplates, setCertificateTemplates] = useState([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    title: 'Certificate of Merit & Excellence',
    event: '',
    subtitle: 'Digital Society Management System • Campus Network',
    body_text: 'has actively participated in, completed all practical evaluation requirements, and demonstrated excellence in',
    theme_color: '#1e1b4b',
    signatory_title_left: 'Faculty Advisor',
    signatory_title_right: 'Society President'
  });

  // Modals
  const [showClubEditModal, setShowClubEditModal] = useState(false);
  const [clubEditTab, setClubEditTab] = useState('branding'); // 'branding' | 'cabinet' | 'banking'

  const [showProposeModal, setShowProposeModal] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    tagline: '',
    event_type: 'Technical Summit & Workshop',
    date: '',
    venue_name: 'Campus Main Auditorium',
    expected_attendees: 100,
    agenda: '09:30 AM - Delegate Registration\n10:00 AM - Opening Keynote Address\n11:30 AM - Hands-on Defensive Lab & CTF\n01:00 PM - Lunch & Networking\n02:30 PM - Live Exploit Defense Demonstration\n04:00 PM - Award Ceremony & Certification',
    budget_estimate: 350.00,
    chief_guest: 'Prof. Dr. Tariq Mahmood (Dean of Computing)',
    equipment_needed: '4x Wireless Shure Mics, High-Lumen 4K Projector, Dedicated 1Gbps Fiber Subnet, 20x Lab Power Extensions',
    description: '',
    is_paid: false,
    price: 0
  });
  const [dateConflictWarning, setDateConflictWarning] = useState(null);

  // Proposal Dossier Print / View Modal
  const [selectedProposalForDossier, setSelectedProposalForDossier] = useState(null);

  // Signed Proposal Document Upload Modal
  const [uploadDocModalEvent, setUploadDocModalEvent] = useState(null);
  const [signedDocUrl, setSignedDocUrl] = useState('');

  // Inspect Signed Doc Modal
  const [inspectDocEvent, setInspectDocEvent] = useState(null);

  // Bulk Gallery Upload Modal & Showcase Folders
  const [showBulkGalleryModal, setShowBulkGalleryModal] = useState(false);
  const [selectedShowcaseFolder, setSelectedShowcaseFolder] = useState(null);
  const [activeShowcaseImage, setActiveShowcaseImage] = useState(null);
  const [bulkGalleryForm, setBulkGalleryForm] = useState({
    event_id: '',
    title: '',
    bulk_urls: '',
    images: [],
    is_public: true
  });

  // Budget & Sponsorship Modals
  const [showAddBudgetModal, setShowAddBudgetModal] = useState(false);
  const [budgetForm, setBudgetForm] = useState({
    title: '',
    amount: '',
    is_expense: true,
    category: 'Logistics & Venue',
    payment_method: 'Bank Transfer',
    event_id: '',
    description: '',
    receipt_doc: ''
  });

  const [showAddSponsorModal, setShowAddSponsorModal] = useState(false);
  const [sponsorForm, setSponsorForm] = useState({
    sponsor_name: '',
    amount: '',
    sponsor_tier: 'Gold Sponsor',
    event_id: '',
    details: '',
    status: 'Received'
  });

  // Inline Cabinet Member Form (Inside Club Editing with Roll Number Lookup)
  const [rollNumberInput, setRollNumberInput] = useState('');
  const [lookedUpStudent, setLookedUpStudent] = useState(null);
  const [isLookingUpStudent, setIsLookingUpStudent] = useState(false);
  const [studentLookupError, setStudentLookupError] = useState(null);
  const [studentSearchResults, setStudentSearchResults] = useState([]);
  const [isSearchingStudents, setIsSearchingStudents] = useState(false);
  const [selectedCabinetStudent, setSelectedCabinetStudent] = useState(null);
  const [newCabinetForm, setNewCabinetForm] = useState({
    student_username: '',
    role_title: 'Vice President - Operations',
    priority_rank: 200,
    term_year: '2026-2027'
  });
  const [isCustomCabinetRole, setIsCustomCabinetRole] = useState(false);

  // Recruitment Modal
  const [showRecruitmentModal, setShowRecruitmentModal] = useState(false);
  const [recruitmentForm, setRecruitmentForm] = useState({
    title: '',
    deadline: ''
  });

  // Society Settings & Branding Form
  const [settingsForm, setSettingsForm] = useState({
    description: '',
    cover_image: '',
    logo: '',
    vision: '',
    mission: '',
    contact_email: '',
    contact_phone: '',
    bank_name: '',
    bank_account_title: '',
    bank_account_number: '',
    payment_instructions: '',
    whatsapp: '',
    whatsapp_channel: '',
    facebook: '',
    website: '',
    instagram: '',
    linkedin: '',
    youtube: '',
    twitter: ''
  });

  const [toastMsg, setToastMsg] = useState(null);
  const [deleteEventTarget, setDeleteEventTarget] = useState(null);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);
  const [deleteProposalTarget, setDeleteProposalTarget] = useState(null);
  const [isDeletingProposal, setIsDeletingProposal] = useState(false);

  const isFetchingPresidentRef = useRef(false);

  const handleDeleteEvent = async () => {
    if (!deleteEventTarget) return;
    try {
      setIsDeletingEvent(true);
      await api.delete(`events/${deleteEventTarget.id}/`);
      setEvents(prev => prev.filter(e => e.id !== deleteEventTarget.id));
      setProposals(prev => prev.filter(p => p.event !== deleteEventTarget.id && p.proposal_no !== deleteEventTarget.proposal_doc_number));
      showToast(`Event "${deleteEventTarget.title}" permanently deleted.`);
      setDeleteEventTarget(null);
    } catch (err) {
      console.error("Delete event failed:", err);
      showToast(err.response?.data?.error || err.response?.data?.detail || "Failed to delete event.", "error");
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
      showToast(err.response?.data?.error || err.response?.data?.detail || "Failed to delete proposal.", "error");
    } finally {
      setIsDeletingProposal(false);
    }
  };


  const showToast = (msg, type = 'success') => {
    setToastMsg(typeof msg === 'object' && msg !== null ? msg : { text: msg, type });
    setTimeout(() => setToastMsg(null), 5000);
  };

  const extractErrorMessage = (err, defaultMsg = "Failed to update society profile.") => {
    if (!err) return defaultMsg;
    const data = err.response?.data;
    if (typeof data === 'string') return data;
    if (data?.error) return data.error;
    if (data?.detail) return data.detail;
    if (data?.message) return data.message;
    if (data && typeof data === 'object') {
      const entries = Object.entries(data);
      if (entries.length > 0) {
        const [field, val] = entries[0];
        const readableField = field.replace(/_/g, ' ');
        const text = Array.isArray(val) ? val.join(', ') : String(val);
        return `${readableField}: ${text}`;
      }
    }
    return err.message || defaultMsg;
  };

  const fetchPresidentData = async () => {
    if (isFetchingPresidentRef.current) return;
    isFetchingPresidentRef.current = true;
    setLoading(true);
    try {
      const [socRes, evRes, appRes, memRes, budRes, sponRes, galRes, cabRes, propRes, venRes, staffRes, certTmplRes, volHourRes, regRes] = await Promise.allSettled([
        api.get('societies/'),
        api.get('events/'),
        api.get('applications/'),
        api.get('memberships/'),
        api.get('budgets/'),
        api.get('sponsorships/'),
        api.get('gallery/'),
        api.get('cabinet/'),
        api.get('proposals/'),
        api.get('venues/'),
        api.get('staff-assignments/'),
        api.get('certificate-templates/'),
        api.get('volunteer-hours/'),
        api.get('registrations/')
      ]);

      let mySoc = null;
      if (socRes.status === 'fulfilled') {
        const currentUserId = user?.id ? Number(user.id) : null;
        const currentSocId = user?.society ? Number(typeof user.society === 'object' ? user.society.id : user.society) : null;
        const presidedIds = (user?.presided_society_ids || []).map(Number);

        mySoc = socRes.value.data.find(s => {
          const sId = Number(s.id);
          const sPresId = Number(typeof s.president === 'object' ? s.president?.id : s.president);
          return (
            (currentSocId && sId === currentSocId) ||
            (currentUserId && sPresId === currentUserId) ||
            (presidedIds.includes(sId)) ||
            (s.president_name && user?.username && s.president_name.toLowerCase() === user.username.toLowerCase())
          );
        }) || null;

        if (mySoc) {
          try {
            const freshSoc = await api.get(`societies/${mySoc.id}/`);
            if (freshSoc?.data) {
              mySoc = freshSoc.data;
            }
          } catch (e) {
            console.warn("Using society from catalog list:", e);
          }
        }
        setSociety(mySoc);

        if (mySoc) {
          setSettingsForm({
            description: mySoc.description || '',
            cover_image: mySoc.cover_image ? getMediaUrl(mySoc.cover_image) : 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1600&q=80',
            logo: mySoc.logo ? getMediaUrl(mySoc.logo) : 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=400&q=80',
            vision: mySoc.vision || '',
            mission: mySoc.mission || '',
            contact_email: mySoc.contact_email || '',
            contact_phone: mySoc.contact_phone || '',
            bank_name: mySoc.bank_name || '',
            bank_account_title: mySoc.bank_account_title || '',
            bank_account_number: mySoc.bank_account_number || '',
            payment_instructions: mySoc.payment_instructions || '',
            whatsapp: mySoc.social_links?.whatsapp || '',
            whatsapp_channel: mySoc.social_links?.whatsapp_channel || '',
            facebook: mySoc.social_links?.facebook || '',
            website: mySoc.social_links?.website || '',
            instagram: mySoc.social_links?.instagram || '',
            linkedin: mySoc.social_links?.linkedin || '',
            youtube: mySoc.social_links?.youtube || '',
            twitter: mySoc.social_links?.twitter || ''
          });
        }
      }

      if (evRes.status === 'fulfilled') setEvents(evRes.value.data);
      if (appRes.status === 'fulfilled') setApplications(appRes.value.data);
      if (memRes.status === 'fulfilled') setMemberships(memRes.value.data);
      if (budRes.status === 'fulfilled') setBudgets(budRes.value.data);
      if (sponRes.status === 'fulfilled') setSponsorships(sponRes.value.data);
      if (galRes.status === 'fulfilled') setGalleries(galRes.value.data);
      if (cabRes.status === 'fulfilled') {
        const mySocId = mySoc?.id || (user?.society ? Number(user.society) : null);
        const myCabinet = cabRes.value.data.filter(c => c.society === mySocId);
        setCabinet(myCabinet);
      }
      if (propRes.status === 'fulfilled') setProposals(propRes.value.data);
      if (venRes.status === 'fulfilled') setVenues(venRes.value.data);
      if (staffRes.status === 'fulfilled') setStaffAssignments(staffRes.value.data || []);
      if (certTmplRes.status === 'fulfilled') setCertificateTemplates(certTmplRes.value.data || []);
      if (volHourRes.status === 'fulfilled') setVolunteerHours(volHourRes.value.data || []);
      if (regRes.status === 'fulfilled') setRegistrations(regRes.value.data || []);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      isFetchingPresidentRef.current = false;
    }
  };

  const fetchLockedDates = async () => {
    try {
      const res = await api.get('events/locked_dates/');
      setLockedDates(res.data);
    } catch(e){}
  };

  useEffect(() => {
    fetchPresidentData();
    fetchLockedDates();

    const handleSync = () => {
      fetchPresidentData();
      fetchLockedDates();
    };

    window.addEventListener('dsms:society_updated', handleSync);
    window.addEventListener('dsms:data_synced', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('dsms:society_updated', handleSync);
      window.removeEventListener('dsms:data_synced', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const checkDateConflict = (selectedDateStr) => {
    if (!selectedDateStr) {
      setDateConflictWarning(null);
      return;
    }
    const chosenDate = selectedDateStr.split('T')[0];
    const conflict = lockedDates.find(ld => ld.date === chosenDate && ld.society_id !== society?.id);
    if (conflict) {
      setDateConflictWarning(`⚠️ Date-Lock Rule: ${conflict.society_name} has already booked ${chosenDate} for "${conflict.title}". Other societies cannot schedule on this same day.`);
    } else {
      setDateConflictWarning(null);
    }
  };

  // ADVERTISE & PUBLISH MARKETING MATERIALS WORKFLOW
  const openAdvertiseModal = (evt) => {
    setAdvertiseTargetEvent(evt);
    setShowAdvertiseModal(true);
  };

  const handleAdvertiseSubmit = async (e) => {
    e.preventDefault();
    if (!advertiseTargetEvent) return;

    try {
      setIsSubmittingAdvertise(true);
      setAdvertiseError(null);

      // 1. Use FormData for direct multipart file uploads
      const formData = new FormData();
      if (advertiseCoverFile) {
        formData.append('cover_photo', advertiseCoverFile);
      } else if (advertiseCoverPreview) {
        formData.append('cover_image', advertiseCoverPreview);
      }

      formData.append('description', advertiseDescription);

      if (advertiseGalleryFiles && advertiseGalleryFiles.length > 0) {
        advertiseGalleryFiles.forEach((file) => {
          formData.append('gallery_images', file);
        });
      }

      // 2. Post with multipart/form-data header to publish endpoint
      const endpoint = advertiseTargetEvent.is_proposal 
        ? `proposals/${advertiseTargetEvent.id}/publish_event/` 
        : `events/${advertiseTargetEvent.id}/publish/`;
        
      const res = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      const updatedEvent = res.data.event || res.data;

      // Update state in events list and proposals
      setEvents(prev => {
        const exists = prev.some(ev => ev.id === updatedEvent.id);
        if (exists) {
          return prev.map(ev => ev.id === updatedEvent.id ? { ...ev, ...updatedEvent, is_published: true } : ev);
        }
        return [{ ...updatedEvent, is_published: true }, ...prev];
      });

      if (advertiseTargetEvent.is_proposal) {
        setProposals(prev => prev.map(p => p.id === advertiseTargetEvent.id ? { ...p, status: 'approved', is_published: true } : p));
      }

      showToast(`Event "${advertiseTargetEvent.title}" is now advertised with marketing photos and LIVE on the Student Portal! 🚀`);
      setShowAdvertiseModal(false);
      setAdvertiseTargetEvent(null);
      setAdvertiseCoverFile(null);
      setAdvertiseCoverPreview('');
      setAdvertiseGalleryFiles([]);
      setAdvertiseGalleryPreviews([]);
      setAdvertiseDescription('');
      
      // Broadcast live sync across portals
      window.dispatchEvent(new CustomEvent('dsms:data_synced'));
      window.dispatchEvent(new CustomEvent('dsms:society_updated'));
      setTimeout(() => fetchPresidentData(), 300);
    } catch (err) {
      console.error("Upload error details:", err.response);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.response?.data?.detail || 'Server error';
      setAdvertiseError(`Publish failed: ${errorMsg}`);
    } finally {
      setIsSubmittingAdvertise(false);
    }
  };

  // 1. UPDATE SOCIETY PROFILE & BRANDING
  const handleUpdateClubProfile = async (e) => {
    e.preventDefault();
    if (!society) return;
    try {
      const payload = {
        description: settingsForm.description,
        cover_image: settingsForm.cover_image,
        logo: settingsForm.logo,
        vision: settingsForm.vision,
        mission: settingsForm.mission,
        contact_email: settingsForm.contact_email,
        contact_phone: settingsForm.contact_phone,
        bank_name: settingsForm.bank_name,
        bank_account_title: settingsForm.bank_account_title,
        bank_account_number: settingsForm.bank_account_number,
        payment_instructions: settingsForm.payment_instructions,
        social_links: {
          whatsapp: settingsForm.whatsapp,
          whatsapp_channel: settingsForm.whatsapp_channel,
          facebook: settingsForm.facebook,
          website: settingsForm.website,
          instagram: settingsForm.instagram,
          linkedin: settingsForm.linkedin,
          youtube: settingsForm.youtube,
          twitter: settingsForm.twitter
        }
      };
      const res = await api.patch(`societies/${society.id}/`, payload);
      setSociety(res.data);
      showToast("Society identity, cover photo, and social links updated successfully!");
      setShowClubEditModal(false);
    } catch (err) {
      const errorMessage = extractErrorMessage(err, "Failed to update society profile.");
      showToast(`Update failed: ${errorMessage}`, 'error');
    }
  };

  // 2. LOOKUP STUDENT RECORD BY ROLL NUMBER / SEARCH (READ-ONLY PROFILE VERIFICATION)
  const handleLookupStudent = async (e, rollToLookup = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const roll = (rollToLookup || rollNumberInput).trim();
    if (!roll) {
      setStudentLookupError("Please enter a student university roll number or student name.");
      return;
    }
    setIsLookingUpStudent(true);
    setStudentLookupError(null);
    setLookedUpStudent(null);
    try {
      const res = await api.get(`users/lookup_by_roll/?roll_number=${encodeURIComponent(roll)}`);
      setLookedUpStudent(res.data);
      setNewCabinetForm(prev => ({
        ...prev,
        student_username: res.data.username
      }));
      setStudentSearchResults([]);
    } catch (err) {
      setLookedUpStudent(null);
      setStudentLookupError(err.response?.data?.error || `No registered student found with Roll Number "${roll}". Please verify.`);
    } finally {
      setIsLookingUpStudent(false);
    }
  };

  const handleSearchStudents = async (query) => {
    setRollNumberInput(query);
    if (!query || query.trim().length < 1) {
      setStudentSearchResults([]);
      return;
    }
    setIsSearchingStudents(true);
    try {
      const res = await api.get(`users/search_students/?q=${encodeURIComponent(query.trim())}`);
      setStudentSearchResults(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingStudents(false);
    }
  };

  const handleSelectStudentForCabinet = (student) => {
    setLookedUpStudent(student);
    setRollNumberInput(student.roll_number || student.username);
    setNewCabinetForm(prev => ({
      ...prev,
      student_username: student.username
    }));
    setStudentSearchResults([]);
    setStudentLookupError(null);
  };

  // ADD CABINET MEMBER (INTEGRATED INSIDE CLUB EDITING)
  const handleAddCabinetMember = async (e) => {
    e.preventDefault();
    if (!society) return;
    if (!lookedUpStudent) {
      alert("Please enter a student roll number and lookup the profile first.");
      return;
    }
    try {
      const finalRole = newCabinetForm.role_title;
      const rank = Number(newCabinetForm.priority_rank) || getDynamicRoleRank({ role_title: finalRole });
      const res = await api.post('cabinet/', {
        student_username: (lookedUpStudent.username || lookedUpStudent.roll_number).trim(),
        role_title: finalRole,
        priority_rank: rank,
        term_year: newCabinetForm.term_year,
        society: society.id
      });
      setCabinet(prev => sortSocietyMembers([...prev, res.data]));
      setNewCabinetForm({ student_username: '', role_title: 'Vice President - Operations', priority_rank: 200, term_year: '2026-2027' });
      setIsCustomCabinetRole(false);
      setLookedUpStudent(null);
      showToast(res.data.is_verified 
        ? `Inducted ${res.data.full_name || res.data.username} as ${res.data.role_title}!` 
        : `Nomination submitted! ${res.data.full_name || res.data.username} will receive their Cabinet Card once verified by Faculty Advisor.`);
      window.dispatchEvent(new CustomEvent('dsms:cabinet_updated', { detail: { id: society.id } }));
      window.dispatchEvent(new CustomEvent('dsms:data_synced'));
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.student_username || "Failed to add cabinet member.");
    }
  };

  const handleToggleCabinetActive = async (id) => {
    try {
      const res = await api.post(`cabinet/${id}/toggle_active/`);
      setCabinet(cabinet.map(c => c.id === id ? { ...c, is_active: res.data.is_active } : c));
      showToast(`Cabinet assignment status updated to ${res.data.is_active ? 'Active' : 'Inactive'}. Preserved in history.`);
      window.dispatchEvent(new CustomEvent('dsms:cabinet_updated', { detail: { id: society?.id } }));
      window.dispatchEvent(new CustomEvent('dsms:data_synced'));
    } catch (err) {
      alert(err.response?.data?.error || "Failed to toggle cabinet member active status.");
    }
  };

  const handleRemoveCabinetMember = async (id) => {
    if (!window.confirm("Remove this member from the society executive cabinet?")) return;
    try {
      await api.delete(`cabinet/${id}/`);
      setCabinet(cabinet.filter(c => c.id !== id));
      showToast("Cabinet member removed.");
      window.dispatchEvent(new CustomEvent('dsms:cabinet_updated', { detail: { id: society?.id } }));
      window.dispatchEvent(new CustomEvent('dsms:data_synced'));
    } catch (err) {
      alert("Failed to remove member.");
    }
  };

  // GATE VOLUNTEER ASSIGNMENT HANDLERS
  const handleSearchVolunteers = async (query) => {
    setVolunteerRollInput(query);
    if (!query || query.trim().length < 1) {
      setVolunteerSearchResults([]);
      return;
    }
    setIsLookingUpVolunteer(true);
    try {
      const res = await api.get(`users/search_students/?q=${encodeURIComponent(query.trim())}`);
      setVolunteerSearchResults(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLookingUpVolunteer(false);
    }
  };

  const handleSelectVolunteer = (student) => {
    setSelectedVolunteerStudent(student);
    setVolunteerRollInput(student.roll_number || student.username);
    setVolunteerSearchResults([]);
  };

  const handleAssignVolunteerSubmit = async (e) => {
    e.preventDefault();
    if (!volunteerForm.event_id || !selectedVolunteerStudent) {
      alert("Please select an event and choose a student to assign as volunteer.");
      return;
    }
    try {
      const res = await api.post('staff-assignments/', {
        event: parseInt(volunteerForm.event_id),
        volunteer: selectedVolunteerStudent.id,
        gate_name: volunteerForm.gate_name || 'Main Gate - Desk 1',
        duty_start: volunteerForm.duty_start ? new Date(volunteerForm.duty_start).toISOString() : null,
        duty_end: volunteerForm.duty_end ? new Date(volunteerForm.duty_end).toISOString() : null,
        status: 'assigned'
      });
      setStaffAssignments([res.data, ...staffAssignments]);
      setShowAssignVolunteerModal(false);
      setSelectedVolunteerStudent(null);
      setVolunteerRollInput('');
      setVolunteerForm({ event_id: '', gate_name: 'Main Gate - Desk 1', duty_start: '', duty_end: '' });
      showToast(`Appointed ${selectedVolunteerStudent.full_name || selectedVolunteerStudent.username} as Gate Volunteer!`);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to appoint gate volunteer.");
    }
  };

  const handleRevokeVolunteer = async (id) => {
    if (!window.confirm("Revoke this gate volunteer duty assignment?")) return;
    try {
      await api.post(`staff-assignments/${id}/revoke/`);
      setStaffAssignments(staffAssignments.filter(s => s.id !== id));
      showToast("Volunteer duty revoked.");
    } catch (err) {
      alert("Failed to revoke duty.");
    }
  };

  // GENERAL VOLUNTEER ROLE HANDLERS
  const handleSearchGeneralVolunteers = async (query) => {
    setGeneralVolRollInput(query);
    if (!query.trim() || query.length < 2) {
      setGeneralVolSearchResults([]);
      return;
    }
    setIsSearchingGeneralVol(true);
    try {
      const res = await api.get(`users/?role=student&search=${encodeURIComponent(query.trim())}`);
      setGeneralVolSearchResults(res.data || []);
    } catch {
      setGeneralVolSearchResults([]);
    } finally {
      setIsSearchingGeneralVol(false);
    }
  };

  const handleSelectGeneralVolunteer = (student) => {
    setSelectedGeneralVolStudent(student);
    setGeneralVolRollInput(student.roll_number || student.username);
    setGeneralVolSearchResults([]);
  };

  const handleAssignGeneralVolunteerSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGeneralVolStudent) {
      alert("Please choose a student to assign as volunteer.");
      return;
    }
    try {
      const res = await api.post('volunteer-hours/', {
        student: selectedGeneralVolStudent.id,
        event: generalVolForm.event_id ? parseInt(generalVolForm.event_id) : null,
        society: society?.id,
        role: generalVolForm.role || 'General Volunteer',
        description: generalVolForm.description,
        date: generalVolForm.date || null,
        hours: parseFloat(generalVolForm.hours || 0)
      });
      setVolunteerHours([res.data, ...volunteerHours]);
      setShowAssignGeneralVolModal(false);
      setSelectedGeneralVolStudent(null);
      setGeneralVolRollInput('');
      setGeneralVolForm({
        event_id: '',
        role: 'Decorator',
        description: '',
        date: new Date().toISOString().split('T')[0],
        hours: '3.0'
      });
      showToast(`Assigned ${selectedGeneralVolStudent.full_name || selectedGeneralVolStudent.username} as ${res.data.role} volunteer.`);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to assign volunteer role.");
    }
  };

  const handleMarkVolunteerComplete = async (volId) => {
    const enteredHours = window.prompt("Enter confirmed volunteer service hours:", "3.0");
    if (!enteredHours) return;
    try {
      const res = await api.post(`volunteer-hours/${volId}/mark_complete/`, { hours: parseFloat(enteredHours) });
      setVolunteerHours(volunteerHours.map(v => v.id === volId ? res.data.volunteer : v));
      showToast(`Volunteer hours logged: ${enteredHours} hrs.`);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to mark volunteer complete.");
    }
  };

  const handleVerifyVolunteerHours = async (volId) => {
    if (!window.confirm("Officially verify these volunteer hours for co-curricular credit?")) return;
    try {
      const res = await api.post(`volunteer-hours/${volId}/verify_hours/`);
      setVolunteerHours(volunteerHours.map(v => v.id === volId ? res.data.volunteer : v));
      showToast("Volunteer hours officially verified!");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to verify volunteer hours.");
    }
  };

  // Certificate Template Handlers
  const handleSaveTemplate = async (submitForApproval = false) => {
    if (!templateForm.title.trim()) {
      alert("Please provide a Certificate Title.");
      return;
    }
    try {
      const payload = {
        title: templateForm.title,
        society: society?.id,
        event: templateForm.event ? Number(templateForm.event) : null,
        layout_json: {
          title: templateForm.title,
          subtitle: templateForm.subtitle,
          body_text: templateForm.body_text,
          theme_color: templateForm.theme_color,
          signatory_title_left: templateForm.signatory_title_left,
          signatory_title_right: templateForm.signatory_title_right
        }
      };
      const res = await api.post('certificate-templates/', payload);
      let createdTmpl = res.data;
      if (submitForApproval) {
        const subRes = await api.post(`certificate-templates/${createdTmpl.id}/submit_for_approval/`);
        createdTmpl = subRes.data.template;
        showToast("Certificate template submitted to Faculty Advisor for endorsement!");
      } else {
        showToast("Certificate template saved as draft.");
      }
      setCertificateTemplates([createdTmpl, ...certificateTemplates]);
      setShowTemplateModal(false);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to save certificate template.");
    }
  };

  const handleSubmitExistingTemplate = async (templateId) => {
    try {
      const res = await api.post(`certificate-templates/${templateId}/submit_for_approval/`);
      setCertificateTemplates(certificateTemplates.map(t => t.id === templateId ? res.data.template : t));
      showToast("Template submitted for Faculty Advisor endorsement.");
    } catch (err) {
      alert("Failed to submit template.");
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm("Delete this certificate template draft?")) return;
    try {
      await api.delete(`certificate-templates/${templateId}/`);
      setCertificateTemplates(certificateTemplates.filter(t => t.id !== templateId));
      showToast("Certificate template removed.");
    } catch (err) {
      alert("Failed to delete template.");
    }
  };

  // 3. PROPOSE DETAILED EVENT
  const handleProposeDetailedEvent = async (e) => {
    e.preventDefault();
    if (dateConflictWarning) {
      alert("This date is locked by another society under the university date-conflict rule. Please choose a different date.");
      return;
    }
    if (!society) {
      alert("No society assigned to your presidential account.");
      return;
    }

    try {
      const payload = {
        society: society.id,
        title: eventForm.title,
        tagline: eventForm.tagline,
        event_type: eventForm.event_type,
        date: eventForm.date,
        venue_name: eventForm.venue_name,
        expected_attendees: parseInt(eventForm.expected_attendees) || 100,
        agenda: eventForm.agenda,
        budget_estimate: parseFloat(eventForm.budget_estimate) || 0.00,
        chief_guest: eventForm.chief_guest,
        equipment_needed: eventForm.equipment_needed,
        description: eventForm.description,
        is_paid: eventForm.is_paid,
        price: eventForm.is_paid ? parseFloat(eventForm.price) : 0.00
      };

      const res = await api.post('events/', payload);
      showToast("Detailed statutory event proposal submitted! You can now download the Official Proposal Dossier for physical signatures.");
      setShowProposeModal(false);
      setEventForm({
        title: '', tagline: '', event_type: 'Technical Summit & Workshop',
        date: '', venue_name: 'Campus Main Auditorium', expected_attendees: 100,
        agenda: '', budget_estimate: 0, chief_guest: '', equipment_needed: '',
        description: '', is_paid: false, price: 0
      });
      setDateConflictWarning(null);
      fetchPresidentData();
      fetchLockedDates();
    } catch (err) {
      alert(err.response?.data?.date || err.response?.data?.title || err.response?.data?.error || 'Failed to submit proposal.');
    }
  };

  // 4. UPLOAD PHYSICALLY SIGNED & STAMPED PROPOSAL DOSSIER
  const handleUploadSignedDoc = async (e) => {
    e.preventDefault();
    if (!uploadDocModalEvent || !signedDocUrl.trim()) return;
    try {
      await api.post(`events/${uploadDocModalEvent.id}/upload_signed_proposal/`, {
        signed_proposal_doc: signedDocUrl.trim()
      });
      showToast("Physically signed approval dossier uploaded! Sent to Faculty Advisor and Super Admin for verification.");
      setUploadDocModalEvent(null);
      setSignedDocUrl('');
      fetchPresidentData();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to upload signed proposal document.");
    }
  };

  // 5. BULK SHOWCASE IMAGE UPLOAD (EVENT FOLDER CREATION & PRIVACY TOGGLE)
  const handleBulkGalleryUpload = async (e) => {
    e.preventDefault();
    if (!society) return;

    if (!bulkGalleryForm.event_id) {
      alert("Please select the associated event first.");
      return;
    }

    let urls = [];
    if (bulkGalleryForm.images && bulkGalleryForm.images.length > 0) {
      urls = bulkGalleryForm.images;
    } else if (bulkGalleryForm.bulk_urls && bulkGalleryForm.bulk_urls.trim()) {
      urls = bulkGalleryForm.bulk_urls
        .split(/[\n,]/)
        .map(u => u.trim())
        .filter(u => u.length > 0);
    }

    if (urls.length === 0) {
      alert("Please select images from your PC or mobile gallery before publishing.");
      return;
    }

    const selectedEv = events.find(ev => ev.id === parseInt(bulkGalleryForm.event_id));
    const albumName = bulkGalleryForm.title.trim() || selectedEv?.title || `${society.name} Showcase`;

    try {
      const res = await api.post('gallery/bulk_create/', {
        images: urls,
        society_id: society.id,
        event_id: bulkGalleryForm.event_id ? parseInt(bulkGalleryForm.event_id) : null,
        album_name: albumName,
        title: albumName,
        is_public: bulkGalleryForm.is_public !== undefined ? bulkGalleryForm.is_public : true
      });
      showToast(`Created folder "${albumName}" with ${urls.length} photos!`);
      setShowBulkGalleryModal(false);
      setBulkGalleryForm({ event_id: '', title: '', bulk_urls: '', images: [], is_public: true });
      await fetchPresidentData();

      // Automatically open the created folder in UI
      if (res.data?.folder) {
        setSelectedShowcaseFolder(res.data.folder);
      }
    } catch (err) {
      alert(err.response?.data?.error || "Failed to upload bulk gallery photos.");
    }
  };

  // 6. RECORD EXPENSE / INCOME ITEM
  const handleAddBudgetItem = async (e) => {
    e.preventDefault();
    if (!society) return;
    try {
      await api.post('budgets/', {
        society: society.id,
        title: budgetForm.title,
        amount: parseFloat(budgetForm.amount),
        is_expense: budgetForm.is_expense,
        category: budgetForm.category,
        payment_method: budgetForm.payment_method,
        event: budgetForm.event_id ? parseInt(budgetForm.event_id) : null,
        description: budgetForm.description,
        receipt_doc: budgetForm.receipt_doc
      });
      showToast("Ledger transaction recorded successfully!");
      setShowAddBudgetModal(false);
      setBudgetForm({
        title: '', amount: '', is_expense: true, category: 'Logistics & Venue',
        payment_method: 'Bank Transfer', event_id: '', description: '', receipt_doc: ''
      });
      fetchPresidentData();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to add budget item.");
    }
  };

  // 7. RECORD SPONSORSHIP GRANT
  const handleAddSponsorshipItem = async (e) => {
    e.preventDefault();
    if (!society) return;
    try {
      await api.post('sponsorships/', {
        society: society.id,
        sponsor_name: sponsorForm.sponsor_name,
        amount: parseFloat(sponsorForm.amount),
        sponsor_tier: sponsorForm.sponsor_tier,
        event: sponsorForm.event_id ? parseInt(sponsorForm.event_id) : null,
        details: sponsorForm.details,
        status: sponsorForm.status
      });
      showToast("Corporate sponsorship grant added to ledger!");
      setShowAddSponsorModal(false);
      setSponsorForm({
        sponsor_name: '', amount: '', sponsor_tier: 'Gold Sponsor',
        event_id: '', details: '', status: 'Received'
      });
      fetchPresidentData();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to add sponsorship.");
    }
  };

  // DOWNLOAD PHOTO HELPER FOR STUDENTS / VISITORS
  const handleDownloadPhoto = async (e, imgUrl, filename = 'event_photo.jpg') => {
    e.stopPropagation();
    try {
      const link = document.createElement('a');
      link.href = imgUrl;
      link.download = filename;
      link.target = '_blank';
      link.rel = 'noreferrer';
      document.body.appendChild(link);
      await clickMediaDownload(link);
      document.body.removeChild(link);
      showToast("Photo download started!");
    } catch (err) {
      window.open(imgUrl, '_blank');
    }
  };

  // -------------------------------------------------------------
  // TICKET RECEIPTS VERIFICATION & BULK OPERATIONS
  // -------------------------------------------------------------
  const handleVerifyPayment = async (regId, studentName) => {
    try {
      await api.post(`registrations/${regId}/verify_payment/`);
      setRegistrations(prev => prev.map(r => r.id === regId ? { ...r, payment_status: 'verified' } : r));
      showToast(`Payment confirmed for ${studentName}! Digital pass issued.`);
    } catch (err) {
      showToast(err.response?.data?.error || "Payment verification failed.", 'error');
    }
  };

  const handleBulkApprove = async () => {
    if (!bulkEventId) return showToast("Please select an event.", "error");
    setIsBulkProcessing(true);
    try {
      const res = await api.post('registrations/bulk_approve/', { event_id: bulkEventId });
      showToast(res.data.status);
      fetchPresidentData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to bulk approve.', 'error');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkIssueCSV = async (e) => {
    e.preventDefault();
    if (!bulkEventId) return showToast("Please select an event.", "error");
    if (!bulkFile) return showToast("Please select a file.", "error");
    setIsBulkProcessing(true);

    const ext = bulkFile.name.split('.').pop().toLowerCase();

    const processText = async (text) => {
      try {
        const rollNumbers = text.match(/\b([A-Z0-9-]{6,15})\b/gi) || [];
        if (rollNumbers.length === 0) {
          setIsBulkProcessing(false);
          return showToast("No valid roll numbers found in file.", "error");
        }
        
        const res = await api.post('registrations/bulk_issue_tickets/', {
          event_id: bulkEventId,
          roll_numbers: rollNumbers
        });
        showToast(res.data.status);
        fetchPresidentData();
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

  // OPEN RECRUITMENT DRIVE
  const handleLaunchRecruitment = async (e) => {
    e.preventDefault();
    if (!society) return;
    try {
      await api.post('recruitments/', {
        title: recruitmentForm.title,
        deadline: recruitmentForm.deadline,
        society: society.id,
        form_fields: ['statement', 'experience']
      });
      showToast("Recruitment drive launched live for your society!");
      setShowRecruitmentModal(false);
      setRecruitmentForm({ title: '', deadline: '' });
      fetchPresidentData();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to launch recruitment drive.");
    }
  };

  // Filtered Records
  const societyEvents = events.filter(e => society && (e.society === society.id || e.society_id === society.id));
  const pendingApps = applications.filter(a => society && (a.recruitment_society === society.id || a.society === society.id));
  const societyMemberships = memberships.filter(m => society && m.society === society.id);
  const societyGalleries = galleries.filter(g => society && g.society === society.id);
  
  // Registrations logic
  const societyRegistrations = registrations.filter(r => societyEvents.some(se => se.id === r.event));
  const pendingRegistrations = societyRegistrations.filter(r => r.payment_status === 'pending');

  // Filtered Budget & Sponsorships (Event-Wise Ledger)
  const societyBudgets = budgets.filter(b => society && b.society === society.id);
  const societySponsorships = sponsorships.filter(s => society && s.society === society.id);

  const filteredBudgets = ledgerEventFilter === 'all' 
    ? societyBudgets 
    : societyBudgets.filter(b => b.event === parseInt(ledgerEventFilter));

  const filteredSponsorships = ledgerEventFilter === 'all'
    ? societySponsorships
    : societySponsorships.filter(s => s.event === parseInt(ledgerEventFilter));

  // Ledger Computations
  const totalBudgetExpense = filteredBudgets.filter(b => b.is_expense).reduce((acc, b) => acc + parseFloat(b.amount || 0), 0);
  const totalBudgetIncome = filteredBudgets.filter(b => !b.is_expense).reduce((acc, b) => acc + parseFloat(b.amount || 0), 0);
  const totalSponsorshipsAmount = filteredSponsorships.reduce((acc, s) => acc + parseFloat(s.amount || 0), 0);
  const netLedgerBalance = totalBudgetIncome + totalSponsorshipsAmount - totalBudgetExpense;

  const presidentDisplayName = user?.full_name || (user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.username) || 'President';
  const verifiedCabinet = sortSocietyMembers(cabinet.filter(c => c.is_active && c.is_verified));
  const pendingCabinetNominations = sortSocietyMembers(cabinet.filter(c => c.is_active && !c.is_verified));
  const activeCabinet = sortSocietyMembers(cabinet.filter(c => c.is_active));
  const inactiveCabinet = sortSocietyMembers(cabinet.filter(c => !c.is_active));

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-slate-800 border-t-rose-500 rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(244,63,94,0.5)]"></div>
        <p className="text-sm font-bold text-slate-400 animate-pulse tracking-widest uppercase">Initializing Presidential Core...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">

        {toastMsg && (
          <div className={`fixed top-24 right-6 z-50 ${
            (toastMsg.type === 'error' || toastMsg.isError)
              ? 'bg-rose-900 text-rose-100 border border-rose-500 shadow-rose-950/40'
              : 'bg-emerald-900 text-emerald-100 border border-emerald-500 shadow-emerald-950/40'
          } px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in`}>
            {(toastMsg.type === 'error' || toastMsg.isError) ? (
              <AlertCircle size={18} className="text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            )}
            <span className="text-xs font-bold">{typeof toastMsg === 'string' ? toastMsg : toastMsg.text}</span>
          </div>
        )}

        {/* 1. HIGH-IMPACT CLUB BRANDING HEADER BANNER - 50/50 Overlapping Layout */}
        <div className="w-full">
          {/* 1. Cover Image Section */}
          <div className="w-full aspect-[2/1] sm:aspect-[21/9] md:aspect-[3/1] min-h-[160px] relative rounded-t-2xl sm:rounded-t-3xl overflow-hidden">
            <MediaImage
              src={society?.cover_image ? getMediaUrl(society.cover_image) : 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1600&q=80'}
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1600&q=80'; }}
              alt="Cover"
              className="w-full h-full object-cover object-center"
            />
            {/* Quick Edit Banner Trigger */}
            {society && (
              <button
                onClick={() => {
                  setClubEditTab('branding');
                  setShowClubEditModal(true);
                }}
                className="absolute top-4 right-4 bg-slate-900/80 hover:bg-slate-900 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-lg border border-white/20 cursor-pointer"
              >
                <Edit3 size={13} /> Change Cover & Logo
              </button>
            )}
          </div>

          {/* 2. Transparent Wrapper for the Details Card */}
          <div className="px-4 sm:px-6 bg-transparent">
            {/* 3. The Details Card pulled up smoothly without crushing mobile banner */}
            <div className="relative z-10 mt-2 sm:-mt-10 md:-mt-20 bg-[#151B2B] rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 border border-gray-800">
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                {/* Club Logo Crest */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white p-1 shadow-lg shrink-0 overflow-hidden flex items-center justify-center">
                  <MediaImage
                    src={getMediaUrl(society?.logo) || DEFAULT_SOCIETY_LOGO}
                    onError={handleImageError}
                    alt={society?.name || "Club Logo"}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="space-y-1 text-white">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-violet-300 bg-violet-950/80 px-2.5 py-0.5 rounded-full border border-violet-500/40 flex items-center gap-1">
                      <Shield size={12} /> Executive Presidential Command
                    </span>
                    {society && (
                      <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                        Active Chapter • Session 2026-2027
                      </span>
                    )}
                  </div>

                  <h1 className="text-xl sm:text-2xl font-bold text-white">
                    {society ? society.name : 'Unassigned Presidential Profile'}
                  </h1>
                  
                  <div className="flex items-center gap-2 pt-0.5">
                    {user?.avatar_url || user?.profile_photo_url ? (
                      <div className="w-6 h-6 rounded-full overflow-hidden border border-indigo-400/50 shrink-0">
                        <MediaImage
                          src={getMediaUrl(user.avatar_url || user.profile_photo_url)}
                          alt={presidentDisplayName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-indigo-600/50 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                        {presidentDisplayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <p className="text-sm text-gray-300">
                      President: <button type="button" onClick={() => setShowProfileModal(true)} className="text-white hover:text-indigo-300 font-bold underline-offset-2 hover:underline cursor-pointer transition">{presidentDisplayName || 'Pending'}</button> &nbsp;•&nbsp; Faculty Advisor: {society?.advisor_full_name || society?.advisor_name || 'Unassigned'}
                    </p>
                  </div>

                  {/* Social Badges in Header */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {society?.social_links?.whatsapp && (
                      <MediaLink href={society.social_links.whatsapp} target="_blank" rel="noreferrer" className="px-2.5 py-1 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition" title="WhatsApp Group">
                        <WhatsAppIcon size={13} /> WhatsApp
                      </MediaLink>
                    )}
                    {society?.social_links?.whatsapp_channel && (
                      <MediaLink href={society.social_links.whatsapp_channel} target="_blank" rel="noreferrer" className="px-2.5 py-1 bg-teal-600/90 hover:bg-teal-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition" title="WhatsApp Channel">
                        <WhatsAppChannelIcon size={13} /> Channel
                      </MediaLink>
                    )}
                    {society?.social_links?.facebook && (
                      <MediaLink href={society.social_links.facebook} target="_blank" rel="noreferrer" className="px-2.5 py-1 bg-blue-600/90 hover:bg-blue-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition" title="Facebook Page">
                        <FacebookIcon size={13} /> Facebook
                      </MediaLink>
                    )}
                    {society?.social_links?.website && (
                      <MediaLink href={society.social_links.website} target="_blank" rel="noreferrer" className="px-2.5 py-1 bg-indigo-600/90 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition" title="Official Website">
                        <Globe size={13} /> Website
                      </MediaLink>
                    )}
                    {society?.social_links?.instagram && (
                      <MediaLink href={society.social_links.instagram} target="_blank" rel="noreferrer" className="px-2.5 py-1 bg-gradient-to-r from-amber-600 via-rose-600 to-purple-600 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition" title="Instagram">
                        <InstagramIcon /> Instagram
                      </MediaLink>
                    )}
                    {society?.social_links?.linkedin && (
                      <MediaLink href={society.social_links.linkedin} target="_blank" rel="noreferrer" className="px-2.5 py-1 bg-sky-700/90 hover:bg-sky-600 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition" title="LinkedIn">
                        <LinkedinIcon /> LinkedIn
                      </MediaLink>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons: Edit Profile & Edit Club & Cabinet */}
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-indigo-600/30"
                >
                  <User size={14} /> Edit President Profile
                </button>
                {society && (
                  <button
                    onClick={() => {
                      setClubEditTab('branding');
                      setShowClubEditModal(true);
                    }}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Settings size={14} /> Edit Club & Cabinet
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* WARNING IF NO SOCIETY ASSIGNED */}
        {!society && !loading && (
          <div className="bg-amber-50 border border-amber-300 rounded-3xl p-8 text-center space-y-3 shadow-sm">
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-xl font-black text-amber-900">No Assigned Society Detected</h2>
            <p className="text-sm text-amber-800 max-w-lg mx-auto font-medium leading-relaxed">
              Your presidential profile (<span className="font-bold">{presidentDisplayName}</span>) is active in the system, but Super Admin has not linked you to a campus society yet.
            </p>
          </div>
        )}

        {society && (
          <>
            {/* 2. CLUB MISSION, VISION & CABINET ROSTER CARD */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <Building className="text-indigo-600" size={22} />
                    <h2 className="text-lg font-black text-slate-900">Club Governance, Vision & Executive Cabinet</h2>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Official vision, mission, and assigned roster positions for {society.name}.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setClubEditTab('cabinet');
                    setShowClubEditModal(true);
                  }}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer self-start md:self-auto"
                >
                  <Users size={14} /> Manage Cabinet & Roles ({activeCabinet.length})
                </button>
              </div>

              {/* Vision & Mission Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-[11px] font-black uppercase text-indigo-600 tracking-wider flex items-center gap-1.5 mb-1.5">
                    <Sparkles size={13} /> Official Vision
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {society.vision || "To pioneer technical excellence, departmental community leadership, and innovative student representation."}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-[11px] font-black uppercase text-violet-600 tracking-wider flex items-center gap-1.5 mb-1.5">
                    <ShieldCheck size={13} /> Statutory Mission
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {society.mission || "Organizing high-impact workshops, hackathons, and certifications aligned with university academic excellence."}
                  </p>
                </div>
              </div>

              {/* Cabinet Members Roster Pill Grid */}
              <div>
                <span className="text-xs font-black uppercase text-slate-400 tracking-wider block mb-3">
                  Current Executive Cabinet & Roster ({activeCabinet.length} Leaders)
                </span>

                {activeCabinet.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center">
                    <p className="text-xs text-slate-500 font-medium">
                      No cabinet members assigned yet. Click <strong className="text-indigo-600 cursor-pointer" onClick={() => { setClubEditTab('cabinet'); setShowClubEditModal(true); }}>"Manage Cabinet & Roles"</strong> to induct your Vice President, Secretary, and Treasurer.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {activeCabinet.map((cab) => (
                      <div key={cab.id} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {(cab.full_name || cab.username || 'C')[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-black text-slate-900 truncate">{cab.full_name || cab.username}</h4>
                            <span className="text-[11px] font-bold text-indigo-600 block truncate">{cab.role_title}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{cab.term_year}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 shrink-0">
                          {cab.is_verified ? 'Verified' : 'Active'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 3. EVENT PROPOSALS & STATUTORY WORKFLOW PIPELINE */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <FileText className="text-indigo-600" size={22} />
                    <h2 className="text-lg font-black text-slate-900">Event Proposals & Statutory Workflow Pipeline</h2>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Draft formal event proposals, download university PDF forms, obtain physical Advisor signatures, and upload signed documents for verification.
                  </p>
                </div>

                <button
                  onClick={() => setShowCreateProposalModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition cursor-pointer self-start sm:self-auto"
                >
                  <PlusCircle size={15} /> Propose New Event
                </button>
              </div>

              {proposals.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">No statutory event proposals drafted yet for {society.name}</p>
                  <p className="text-xs text-slate-400 mt-1">Click "Propose New Event" to draft your event dossier and download the sign-off form.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {proposals.map((prop) => {
                    const hasSignedDoc = Boolean(prop.signed_proposal_file);
                    const statusConfig = {
                      draft: { label: 'Draft', color: 'bg-slate-100 text-slate-700 border-slate-300' },
                      generated: { label: 'Generated', color: 'bg-blue-100 text-blue-800 border-blue-300' },
                      downloaded: { label: 'Downloaded / Awaiting Signature', color: 'bg-amber-100 text-amber-800 border-amber-300' },
                      signed_uploaded: { label: 'Signed Doc Uploaded (Pending Verification)', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
                      approved: { label: 'Approved & Live On Campus', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
                      returned: { label: 'Returned for Correction', color: 'bg-rose-100 text-rose-800 border-rose-300' },
                      rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800 border-red-300' },
                      archived: { label: 'Archived', color: 'bg-purple-100 text-purple-800 border-purple-300' },
                    }[prop.status] || { label: prop.status, color: 'bg-slate-100 text-slate-800 border-slate-200' };

                    return (
                      <div key={prop.id} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="space-y-1.5 max-w-2xl">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200">
                              {prop.proposal_no}
                            </span>
                            <span className="text-xs font-black text-slate-900">{prop.event_title}</span>
                            <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${statusConfig.color}`}>
                              {statusConfig.label}
                            </span>
                            {prop.event && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1">
                                <Check size={11} /> Published to Calendar
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-600 line-clamp-2 font-medium">
                            {prop.event_description || prop.objectives || 'Statutory event proposal submitted by society executive.'}
                          </p>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 font-medium">
                            <span>📅 Date: <strong className="text-slate-700">{prop.event_date}</strong> ({prop.start_time} - {prop.end_time})</span>
                            <span>📍 Venue: <strong className="text-slate-700">{prop.venue}</strong></span>
                            <span>👥 Delegates: <strong className="text-slate-700">{prop.expected_participants}</strong></span>
                            <span>💰 Budget: <strong className="text-indigo-700">PKR {parseFloat(prop.budget || 0).toFixed(2)}</strong></span>
                            <span>✍️ Advisor: <strong className="text-slate-700">{prop.advisor_name || 'Assigned Faculty Advisor'}</strong></span>
                          </div>

                          {prop.rejection_reason && (
                            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] font-medium flex items-center gap-2">
                              <AlertCircle size={14} className="text-rose-600 shrink-0" />
                              <span><strong>Remarks / Notes:</strong> {prop.rejection_reason}</span>
                            </div>
                          )}
                        </div>

                        {/* Statutory Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {/* 1. 1-CLICK DIRECT VECTOR PDF DOWNLOAD */}
                          <button
                            onClick={() => {
                              const safeNo = (prop.proposal_no || 'Dossier').replace(/[^a-zA-Z0-9_-]/g, '_');
                              generateOfficialProposalPDF(prop, `Event_Proposal_${safeNo}.pdf`);
                              showToast(`Official Event Proposal PDF downloaded successfully!`);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                            title="Download official PDF proposal dossier directly"
                          >
                            <Download size={14} /> Download PDF
                          </button>

                          {/* 2. VIEW FULL PROPOSAL DOSSIER */}
                          <button
                            onClick={() => setSelectedProposalDoc(prop)}
                            className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                            title="View official statutory proposal form and details"
                          >
                            <Eye size={14} className="text-indigo-600" /> View Proposal
                          </button>

                          {/* 3. UPLOAD SIGNED DOCUMENT / VERIFY */}
                          <button
                            onClick={() => setSelectedProposalDoc(prop)}
                            className={`${hasSignedDoc ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-indigo-600 text-white'} border px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer`}
                          >
                            <UploadCloud size={14} /> {hasSignedDoc ? 'Signed Doc Uploaded' : 'Upload Signed Scan'}
                          </button>

                          {/* 4. AUDIT HISTORY */}
                          <button
                            onClick={() => setSelectedProposalDoc(prop)}
                            className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                            title="View permanent audit trail"
                          >
                            <Clock size={13} /> History
                          </button>

                          {/* 4. ADVERTISE & STATUS TRACKER (IF APPROVED) */}
                          {(() => {
                            const linkedEvt = societyEvents.find(e => e.id === prop.event || e.id === prop.event?.id || e.title === prop.event_title);
                            if (!linkedEvt && prop.status !== 'approved') return null;
                            const evt = linkedEvt || { status: prop.status === 'approved' ? 'APPROVED' : 'PENDING', is_published: false };
                            return (
                              <div className="flex items-center">
                                {evt.status?.toUpperCase() === 'APPROVED' ? (
                                  evt.is_published ? (
                                    Boolean(evt.is_expired || (evt.date && new Date(evt.date) < new Date())) ? (
                                      <span className="bg-rose-100 text-rose-700 border border-rose-200 px-3.5 py-2 rounded-xl font-bold text-xs inline-flex items-center gap-1">
                                        <AlertCircle size={13} /> Concluded Ad
                                      </span>
                                    ) : (
                                      <span className="bg-green-100 text-green-700 px-3.5 py-2 rounded-xl font-bold text-xs inline-flex items-center gap-1">
                                        <CheckCircle2 size={13} /> Live on Student Portal
                                      </span>
                                    )
                                  ) : (
                                    <button 
                                      onClick={() => openAdvertiseModal(evt.id ? evt : { ...evt, id: prop.id, title: prop.title, description: prop.description, image: prop.image, is_proposal: true })}
                                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg transition-all animate-pulse cursor-pointer flex items-center gap-1.5"
                                    >
                                      Advertise Event 🚀
                                    </button>
                                  )
                                ) : (
                                  <span className="text-gray-500 text-xs font-semibold px-2 py-1">Awaiting Approval...</span>
                                )}
                              </div>
                            );
                          })()}
                          {/* 5. DELETE PROPOSAL */}
                          <button
                            type="button"
                            onClick={() => setDeleteProposalTarget(prop)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition cursor-pointer"
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

            {/* 3.1 APPROVED EVENTS & MARKETING STATUS TRACKER (TWO-STAGE PUBLISHING) */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-purple-600" size={22} />
                    <h2 className="text-lg font-black text-slate-900">Approved Events & Marketing Pipeline</h2>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Two-Stage Publishing: Legally approved events are held until advertised with student-facing marketing materials and cover posters.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200">
                    {societyEvents.filter(e => e.is_published).length} Live on Portal • {societyEvents.filter(e => !e.is_published && (e.status?.toUpperCase() === 'APPROVED')).length} Ready to Advertise
                  </span>
                </div>
              </div>

              {societyEvents.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">No events currently recorded for {society.name}</p>
                  <p className="text-xs text-slate-400 mt-1">When an event proposal is approved, it appears here to prepare marketing materials.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {societyEvents.map((evt) => (
                    <div 
                      key={evt.id}
                      className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-purple-300 transition"
                    >
                      <div className="h-44 bg-slate-900 relative overflow-hidden">
                        <MediaImage 
                          src={evt.poster_image_url || evt.image || '/default-placeholder.jpg'} 
                          alt={evt.title} 
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.src = '/default-placeholder.jpg'; }}
                        />
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                          <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-md ${
                            evt.status?.toUpperCase() === 'APPROVED' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                          }`}>
                            {evt.status}
                          </span>
                        </div>
                        <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1">
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md ${
                            evt.is_paid ? 'bg-purple-600 text-white' : 'bg-emerald-600 text-white'
                          }`}>
                            {evt.is_paid ? (
                              (evt.has_discount || (evt.discount_price && Number(evt.discount_price) > 0 && Number(evt.discount_price) < Number(evt.price)))
                                ? `PKR ${evt.discount_price} (was ${evt.ticket_price || evt.price})`
                                : `PKR ${evt.ticket_price || evt.price}`
                            ) : 'Free Entry'}
                          </span>
                          {Array.isArray(evt.gallery_images) && evt.gallery_images.length > 0 && (
                            <span className="bg-black/80 backdrop-blur-sm text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-white/20 shadow">
                              📷 {1 + evt.gallery_images.length} Photos
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Mini thumbnail strip previewing all uploaded pictures */}
                      {Array.isArray(evt.gallery_images) && evt.gallery_images.length > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border-b border-slate-200 overflow-x-auto">
                          <span className="text-[10px] text-slate-500 font-bold shrink-0">Photos:</span>
                          <div className="h-6 w-8 rounded overflow-hidden border border-indigo-500 shrink-0">
                            <MediaImage src={evt.poster_image_url || evt.image} alt="Cover" className="w-full h-full object-cover" />
                          </div>
                          {evt.gallery_images.map((gImg, gIdx) => (
                            <div key={gIdx} className="h-6 w-8 rounded overflow-hidden border border-slate-300 shrink-0">
                              <MediaImage src={gImg} alt={`Gallery ${gIdx+1}`} className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-sm font-black text-slate-900 line-clamp-1">{evt.title}</h3>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                            {evt.description || 'Departmental society event.'}
                          </p>
                          <div className="mt-3 pt-2 border-t border-slate-200/80 text-[11px] text-slate-600 font-semibold space-y-1">
                            <div>📅 {new Date(evt.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</div>
                            <div>📍 {evt.venue_name || evt.venue?.name || 'Campus Main Auditorium'}</div>
                          </div>
                        </div>

                        {/* STATUS TRACKER ACTION BUTTON */}
                        <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                          {evt.status?.toUpperCase() === 'APPROVED' ? (
                            evt.is_published ? (
                              <div className="flex items-center gap-2">
                                {Boolean(evt.is_expired || (evt.date && new Date(evt.date) < new Date())) ? (
                                  <span className="bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-lg font-bold text-xs inline-flex items-center gap-1.5">
                                    <AlertCircle size={14} /> Expired Ad (Concluded)
                                  </span>
                                ) : (
                                  <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg font-bold text-xs inline-flex items-center gap-1.5">
                                    <CheckCircle2 size={14} /> Live
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => openAdvertiseModal(evt)}
                                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1"
                                >
                                  <Edit3 size={12} /> Edit Ad
                                </button>
                              </div>
                            ) : (
                              <button 
                                type="button"
                                onClick={() => openAdvertiseModal(evt)}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg font-bold text-xs shadow-lg transition-all animate-pulse cursor-pointer flex items-center gap-1.5"
                              >
                                Advertise Event 🚀
                              </button>
                            )
                          ) : (
                            <span className="text-gray-500 text-xs font-semibold">Awaiting Approval...</span>
                          )}

                          <div className="flex items-center gap-2">
                            {evt.is_published && (
                              <Link 
                                to={`/events/${evt.id}`}
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
                              >
                                View Portal Page →
                              </Link>
                            )}
                            <button
                              type="button"
                              onClick={() => setDeleteEventTarget(evt)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Delete Event"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. REFINED EVENT-WISE BUDGET & SPONSORSHIP LEDGER */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="text-emerald-600" size={22} />
                    <h2 className="text-lg font-black text-slate-900">Event-Wise Budget & Sponsorship Ledger</h2>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Itemized financial tracking across ticket sales, sponsorships, venue expenses, and operational outlays.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Event Filter Dropdown */}
                  <select
                    value={ledgerEventFilter}
                    onChange={(e) => setLedgerEventFilter(e.target.value)}
                    className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                  >
                    <option value="all">All Society Ledger Pool</option>
                    {societyEvents.map(ev => (
                      <option key={ev.id} value={ev.id}>Event: {ev.title}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => setShowAddBudgetModal(true)}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                  >
                    <PlusCircle size={14} /> Add Transaction
                  </button>
                  <button
                    onClick={() => setShowAddSponsorModal(true)}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition cursor-pointer"
                  >
                    <Award size={14} /> Add Sponsor
                  </button>
                </div>
              </div>

              {/* LEDGER KPI TILES */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Inflows (Income & Grants)</span>
                  <p className="text-xl font-black text-emerald-600 mt-1">PKR {totalBudgetIncome.toFixed(2)}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Outflows (Expenses)</span>
                  <p className="text-xl font-black text-rose-600 mt-1">PKR {totalBudgetExpense.toFixed(2)}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Sponsorships Raised</span>
                  <p className="text-xl font-black text-amber-600 mt-1">PKR {totalSponsorshipsAmount.toFixed(2)}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Net Filtered Balance</span>
                  <p className={`text-xl font-black mt-1 ${netLedgerBalance >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                    PKR {netLedgerBalance.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* ITEMIZED TRANSACTIONS TABLE */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                      <th className="pb-3">Type</th>
                      <th className="pb-3">Description</th>
                      <th className="pb-3">Associated Event</th>
                      <th className="pb-3">Category / Tier</th>
                      <th className="pb-3">Payment Method</th>
                      <th className="pb-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredBudgets.map((b) => (
                      <tr key={`b-${b.id}`} className="hover:bg-slate-50/60 transition">
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            b.is_expense ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {b.is_expense ? 'Expense' : 'Income'}
                          </span>
                        </td>
                        <td className="py-3 font-bold text-slate-900">{b.title}</td>
                        <td className="py-3 text-slate-500">{b.event_title || 'General Society Fund'}</td>
                        <td className="py-3">{b.category || 'General'}</td>
                        <td className="py-3 text-slate-500">{b.payment_method || 'Bank Transfer'}</td>
                        <td className={`py-3 text-right font-black ${b.is_expense ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {b.is_expense ? `-PKR ${parseFloat(b.amount).toLocaleString()}` : `+PKR ${parseFloat(b.amount).toLocaleString()}`}
                        </td>
                      </tr>
                    ))}

                    {filteredSponsorships.map((s) => (
                      <tr key={`s-${s.id}`} className="hover:bg-slate-50/60 transition bg-amber-50/30">
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-200">
                            Sponsor
                          </span>
                        </td>
                        <td className="py-3 font-bold text-slate-900">{s.sponsor_name}</td>
                        <td className="py-3 text-slate-500">{s.event_title || 'General Society Fund'}</td>
                        <td className="py-3 text-amber-700 font-bold">{s.sponsor_tier || 'Gold Sponsor'}</td>
                        <td className="py-3 text-emerald-700 font-bold">{s.status || 'Received'}</td>
                        <td className="py-3 text-right font-black text-amber-600">
                          +PKR {parseFloat(s.amount).toLocaleString()}
                        </td>
                      </tr>
                    ))}

                    {filteredBudgets.length === 0 && filteredSponsorships.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                          No transactions recorded for this filter. Click "Add Transaction" or "Add Sponsor".
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 5. EVENT PHOTO SHOWCASE ORGANIZED BY FOLDERS */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 scroll-mt-24">
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <Folder className="text-rose-600 shrink-0" size={22} />
                    <h2 className="text-base sm:text-lg font-black text-slate-900 flex flex-wrap items-center gap-1.5">
                      <span>Event Photo Showcase</span>
                      <span className="text-slate-500 font-bold text-xs sm:text-sm">— Album Folders & Downloads</span>
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Organized into dedicated event folders. Students and attendees can open folders to view and download high-resolution memories.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {selectedShowcaseFolder && (
                    <button
                      onClick={() => setSelectedShowcaseFolder(null)}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <ArrowLeft size={14} /> Back to Folders
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (selectedShowcaseFolder) {
                        setBulkGalleryForm({
                          event_id: selectedShowcaseFolder.event_id || '',
                          title: selectedShowcaseFolder.album_name || '',
                          bulk_urls: '',
                          images: [],
                          is_public: selectedShowcaseFolder.is_public !== undefined ? selectedShowcaseFolder.is_public : true
                        });
                      }
                      setShowBulkGalleryModal(true);
                    }}
                    className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/30 transition cursor-pointer"
                  >
                    <UploadCloud size={15} /> + Create Folder & Upload
                  </button>
                </div>
              </div>

              {/* VIEW A: INSIDE A SELECTED SHOWCASE FOLDER */}
              {selectedShowcaseFolder ? (
                <div className="space-y-6">
                  {/* Folder Info Banner */}
                  <div className="p-5 bg-gradient-to-r from-rose-50/60 via-indigo-50/40 to-slate-50 border border-rose-100 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-white border border-rose-200 text-rose-600 flex items-center justify-center shrink-0 shadow-sm">
                        <FolderOpen size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-900">{selectedShowcaseFolder.album_name}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                            selectedShowcaseFolder.is_public 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {selectedShowcaseFolder.is_public ? <Globe size={10} /> : <Lock size={10} />}
                            {selectedShowcaseFolder.is_public ? 'Public' : 'Private'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          {selectedShowcaseFolder.event_title} • {selectedShowcaseFolder.images?.length || 0} Photographs
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          showToast(`Downloading all ${selectedShowcaseFolder.images.length} photos...`);
                          selectedShowcaseFolder.images.forEach((img, idx) => {
                            setTimeout(async () => {
                              const link = document.createElement('a');
                              link.href = img.image_url || img.image;
                              link.download = `${selectedShowcaseFolder.album_name.replace(/\s+/g, '_')}_${idx + 1}.jpg`;
                              link.target = '_blank';
                              document.body.appendChild(link);
                              await clickMediaDownload(link);
                              document.body.removeChild(link);
                            }, idx * 300);
                          });
                        }}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                      >
                        <Download size={13} /> Download All ({selectedShowcaseFolder.images?.length || 0})
                      </button>
                    </div>
                  </div>

                  {/* Inside Folder Image Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {selectedShowcaseFolder.images.map((img, idx) => {
                      const src = img.image_url || img.image || 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&auto=format&fit=crop&q=60';
                      return (
                        <div key={img.id || idx} className="relative h-60 rounded-2xl overflow-hidden group shadow-sm border border-slate-200 flex flex-col justify-end bg-slate-900">
                          <MediaImage src={src} alt={img.title || "Photo"} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-90 group-hover:opacity-100" />
                          <div className="relative z-10 p-3 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent flex items-end justify-between">
                            <div className="min-w-0 pr-2">
                              <span className="text-[10px] text-white/80 font-mono block">Photo #{idx + 1}</span>
                              <span className="text-xs font-bold text-white truncate block">{img.title || selectedShowcaseFolder.album_name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setActiveShowcaseImage({ src, title: img.title || selectedShowcaseFolder.album_name })}
                                className="p-1.5 bg-white/20 hover:bg-white/40 text-white rounded-lg backdrop-blur-md transition cursor-pointer"
                                title="Fullscreen Preview"
                              >
                                <Eye size={13} />
                              </button>
                              <button
                                onClick={(e) => handleDownloadPhoto(e, src, `event_photo_${img.id || idx}.jpg`)}
                                className="p-1.5 bg-white hover:bg-slate-100 text-slate-900 rounded-lg text-xs font-bold shadow transition cursor-pointer"
                                title="Download Photo"
                              >
                                <Download size={13} className="text-indigo-600" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* VIEW B: ALL EVENT SHOWCASE FOLDERS GRID */
                <div>
                  {(() => {
                    // Group photos into event folders
                    const albumMap = {};
                    societyGalleries.forEach(img => {
                      const ev = events.find(e => e.id === img.event);
                      const key = (img.album_name || '').trim() || (ev ? `${ev.title} Showcase` : (img.title || 'General Showcase'));
                      if (!albumMap[key]) {
                        albumMap[key] = {
                          album_name: key,
                          event_id: img.event,
                          event_title: ev ? ev.title : key,
                          event_date: ev ? ev.date : img.uploaded_at,
                          cover_photo: img.image_url || img.image,
                          is_public: img.is_public !== undefined ? img.is_public : true,
                          images: []
                        };
                      }
                      albumMap[key].images.push(img);
                    });

                    const folderList = Object.values(albumMap);

                    if (folderList.length === 0) {
                      return (
                        <div className="p-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                          <Folder className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                          <p className="text-sm font-bold text-slate-800">No Event Photo Showcase Folders Yet</p>
                          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                            Click "Create Folder & Upload" to create an event album folder and upload your high-resolution event photographs.
                          </p>
                          <button
                            onClick={() => setShowBulkGalleryModal(true)}
                            className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                          >
                            + Create First Folder
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                        {folderList.map(folder => {
                          const cover = folder.cover_photo || (folder.images[0] && (folder.images[0].image_url || folder.images[0].image)) || 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&auto=format&fit=crop&q=60';
                          return (
                            <div
                              key={folder.album_name}
                              onClick={() => setSelectedShowcaseFolder(folder)}
                              className="group bg-white border border-slate-200 rounded-3xl overflow-hidden hover:shadow-xl hover:border-rose-300 transition-all duration-300 flex flex-col cursor-pointer"
                            >
                              {/* Folder Cover with Glassy Overlays */}
                              <div className="relative h-44 overflow-hidden bg-slate-900/40">
                                <MediaImage
                                  src={cover}
                                  alt={folder.album_name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-90 group-hover:opacity-100"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-white/10 backdrop-blur-[1px]"></div>

                                {/* Badges */}
                                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                                  <span className="text-[10px] font-black uppercase text-white bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/20 flex items-center gap-1.5 shadow-sm">
                                    <Folder size={11} className="text-rose-400" /> {folder.images.length} Photos
                                  </span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border backdrop-blur-md ${
                                    folder.is_public 
                                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40' 
                                      : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                                  }`}>
                                    {folder.is_public ? 'Public' : 'Private'}
                                  </span>
                                </div>
                              </div>

                              {/* Folder Content Info */}
                              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                                <div>
                                  <h3 className="text-xs font-black text-slate-900 group-hover:text-rose-600 transition line-clamp-1">
                                    {folder.album_name}
                                  </h3>
                                  <p className="text-[11px] text-slate-500 font-medium line-clamp-1 mt-0.5">
                                    {folder.event_title}
                                  </p>
                                </div>

                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-slate-400">
                                    {folder.images.length} images
                                  </span>
                                  <span className="text-xs font-bold text-rose-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                    Open Folder <ChevronRight size={13} />
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* 6. EVENT CHECK-IN VOLUNTEER OFFICERS & GATE LANES */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <QrCode className="text-orange-600" size={22} />
                    <h2 className="text-lg font-black text-slate-900">Event Gate Volunteers & Attendance Check-in Lanes</h2>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Appoint eligible verified society students as temporary check-in officers for venue entry gates. Authorized volunteers gain access to the secure gate camera scanner.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Link
                    to="/attendance"
                    className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <QrCode size={14} /> Open Gate Scanner
                  </Link>
                  <button
                    onClick={() => setShowAssignVolunteerModal(true)}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-600/30 transition cursor-pointer"
                  >
                    <UserPlus size={15} /> + Appoint Gate Volunteer
                  </button>
                </div>
              </div>

              {/* Roster of Appointed Gate Volunteers */}
              {staffAssignments.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <QrCode className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">No gate check-in volunteers appointed yet</p>
                  <p className="text-xs text-slate-400 mt-1">Click "Appoint Gate Volunteer" to designate student officers for high-volume entry lanes.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {staffAssignments.map((duty) => (
                    <div key={duty.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-orange-300 transition">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 font-black text-sm flex items-center justify-center shrink-0">
                            {(duty.volunteer_name || duty.volunteer_username || 'V')[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-black text-slate-900 truncate">
                              {duty.volunteer_name || duty.volunteer_username}
                            </h4>
                            <span className="text-[11px] font-mono text-slate-500 font-bold block truncate">
                              Roll: {duty.volunteer_roll || 'N/A'}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 shrink-0">
                          {duty.status}
                        </span>
                      </div>

                      <div className="p-2.5 bg-white border border-slate-200/80 rounded-xl space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-600">Gate / Station:</span>
                          <span className="font-bold text-orange-600 font-mono">{duty.gate_name || 'Gate 1'}</span>
                        </div>
                        <div className="text-[11px] text-slate-600 truncate">
                          <span className="font-bold">Event: </span>{duty.event_title || `Event #${duty.event}`}
                        </div>
                        {duty.duty_start && (
                          <div className="text-[10px] text-slate-400">
                            Window: {new Date(duty.duty_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {duty.duty_end ? new Date(duty.duty_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'End of Event'}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <Link
                          to={`/attendance?event=${duty.event}`}
                          className="text-[11px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                        >
                          <QrCode size={13} /> Launch Duty Lane &rarr;
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleRevokeVolunteer(duty.id)}
                          className="text-[11px] font-bold text-rose-600 hover:text-rose-700 p-1 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        >
                          Revoke
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 6.1 EVENT VOLUNTEER ROSTER & SERVICE HOURS */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <Clock className="text-emerald-600" size={22} />
                    <h2 className="text-lg font-black text-slate-900">Event Volunteer Roster & Service Hours</h2>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Assign student volunteer roles (Decorator, Registration Desk, Security, Media, etc.), log shift completion, and verify hours for official co-curricular credit.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-xl text-xs font-black text-emerald-800">
                    Total Hours: {volunteerHours.reduce((sum, v) => sum + parseFloat(v.hours || 0), 0).toFixed(1)} hrs
                  </div>
                  <button
                    onClick={() => setShowAssignGeneralVolModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition cursor-pointer"
                  >
                    <UserPlus size={15} /> + Assign Volunteer Role
                  </button>
                </div>
              </div>

              {volunteerHours.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">No event volunteers assigned yet</p>
                  <p className="text-xs text-slate-400 mt-1">Assign volunteers to upcoming events to track tasks, coordinate teams, and grant institutional service credits.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {volunteerHours.map((vol) => (
                    <div key={vol.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-emerald-300 transition">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center shrink-0">
                            {(vol.student_name || vol.student_username || 'V')[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-black text-slate-900 truncate">
                              {vol.student_name || vol.student_username}
                            </h4>
                            <span className="text-[11px] font-mono text-slate-500 font-bold block truncate">
                              Roll: {vol.student_roll_number || 'N/A'}
                            </span>
                          </div>
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border shrink-0 ${
                          vol.status === 'verified' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                          vol.status === 'completed' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                          vol.status === 'accepted' ? 'bg-violet-100 text-violet-800 border-violet-300' :
                          'bg-amber-100 text-amber-800 border-amber-300'
                        }`}>
                          {vol.status}
                        </span>
                      </div>

                      <div className="p-2.5 bg-white border border-slate-200/80 rounded-xl space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-600">Volunteer Role:</span>
                          <span className="font-black text-emerald-700">{vol.role || 'General Volunteer'}</span>
                        </div>
                        <div className="text-[11px] text-slate-600 truncate">
                          <span className="font-bold">Event: </span>{vol.event_title || 'General Society Service'}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Hours Logged: <strong className="text-slate-900">{parseFloat(vol.hours || 0).toFixed(1)} hrs</strong></span>
                          <span>{vol.date || 'Active Duty'}</span>
                        </div>
                        {vol.description && (
                          <p className="text-[10px] text-slate-400 italic line-clamp-1 mt-1">{vol.description}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                        {vol.status !== 'verified' && (
                          <button
                            type="button"
                            onClick={() => handleMarkVolunteerComplete(vol.id)}
                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 px-2 py-1 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition cursor-pointer"
                          >
                            Mark Complete / Hours
                          </button>
                        )}
                        {vol.status === 'completed' && (
                          <button
                            type="button"
                            onClick={() => handleVerifyVolunteerHours(vol.id)}
                            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 px-2 py-1 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition cursor-pointer"
                          >
                            Verify Hours ✓
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 7. OFFICIAL CERTIFICATE TEMPLATES & DESIGN STUDIO */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <Award className="text-amber-500" size={22} />
                    <h2 className="text-lg font-black text-slate-900">Official Certificate Templates & Design Studio</h2>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Design custom digital certificates, assign them to society events, and obtain Faculty Advisor endorsement for verified release.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowTemplateModal(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-600/30 transition cursor-pointer self-start sm:self-auto"
                >
                  <PlusCircle size={15} /> Design New Template
                </button>
              </div>

              {certificateTemplates.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Award className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">No custom certificate templates designed yet</p>
                  <p className="text-xs text-slate-400 mt-1">Design a customized certificate with custom titles, theme color accents, and signatory layouts.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {certificateTemplates.map((tmpl) => {
                    const layout = tmpl.layout_json || {};
                    const themeColor = layout.theme_color || '#1e1b4b';
                    const statusConfig = {
                      draft: { label: 'Draft', color: 'bg-slate-100 text-slate-700 border-slate-300' },
                      pending_approval: { label: 'Pending Advisor Endorsement', color: 'bg-amber-100 text-amber-800 border-amber-300' },
                      approved: { label: 'Officially Approved', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
                      rejected: { label: 'Needs Revision', color: 'bg-rose-100 text-rose-800 border-rose-300' }
                    }[tmpl.status] || { label: tmpl.status, color: 'bg-slate-100 text-slate-700 border-slate-200' };

                    return (
                      <div key={tmpl.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-amber-300 transition">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div 
                              className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-white text-xs font-black shadow-sm"
                              style={{ backgroundColor: themeColor }}
                            >
                              <Award size={16} />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-black text-slate-900 truncate">{tmpl.title}</h4>
                              <span className="text-[10px] text-slate-500 font-medium block truncate">
                                {tmpl.event_title ? `Bound to: ${tmpl.event_title}` : 'Society Default Layout'}
                              </span>
                            </div>
                          </div>
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border shrink-0 ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        </div>

                        {/* Visual Swatch & Sample Text */}
                        <div className="p-2.5 bg-white border border-slate-200/80 rounded-xl space-y-1.5 text-[11px]">
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span>Theme Accent:</span>
                            <span className="flex items-center gap-1 font-mono font-bold">
                              <span className="w-2.5 h-2.5 rounded-full inline-block border border-slate-300" style={{ backgroundColor: themeColor }}></span>
                              {themeColor}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-600 line-clamp-2 italic">
                            "{layout.body_text || 'Demonstrated excellence in event participation...'}"
                          </div>
                          <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[9px] font-bold text-slate-400">
                            <span>L: {layout.signatory_title_left || 'Advisor'}</span>
                            <span>R: {layout.signatory_title_right || 'President'}</span>
                          </div>
                        </div>

                        {/* Card Controls */}
                        <div className="flex items-center justify-between pt-1">
                          <button
                            type="button"
                            onClick={() => setPreviewTemplate(tmpl)}
                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                          >
                            <Eye size={12} /> Preview
                          </button>

                          <div className="flex items-center gap-1.5">
                            {tmpl.status === 'draft' && (
                              <button
                                type="button"
                                onClick={() => handleSubmitExistingTemplate(tmpl.id)}
                                className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold transition cursor-pointer"
                              >
                                Submit to Advisor
                              </button>
                            )}
                            {tmpl.status === 'approved' && (
                              <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-0.5">
                                <ShieldCheck size={12} /> Active
                              </span>
                            )}
                            {tmpl.status !== 'approved' && (
                              <button
                                type="button"
                                onClick={() => handleDeleteTemplate(tmpl.id)}
                                className="text-[10px] font-bold text-rose-600 hover:text-rose-700 p-1 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* LIGHTBOX FOR FULLSCREEN PREVIEW */}
            {activeShowcaseImage && (
              <div 
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
                onClick={() => setActiveShowcaseImage(null)}
              >
                <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => setActiveShowcaseImage(null)}
                    className="absolute -top-10 right-0 text-white/80 hover:text-white p-1 cursor-pointer"
                  >
                    <X size={24} />
                  </button>
                  <MediaImage
                    src={activeShowcaseImage.src}
                    alt={activeShowcaseImage.title}
                    className="max-h-[80vh] w-auto rounded-2xl shadow-2xl object-contain border border-white/20"
                  />
                  <div className="mt-3 text-center">
                    <span className="text-sm font-bold text-white drop-shadow">{activeShowcaseImage.title}</span>
                  </div>
                </div>
              </div>
            )}

            {/* INTEGRATED MEMBERSHIP DRIVE & PAYMENT VERIFICATION & TICKETING SUITE */}
            <div className="mt-8 space-y-8">
              
              <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Users className="text-indigo-600" />
                    Student Membership Roster
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">View, activate, suspend, and delete all student members in your society. Access full student digital records.</p>
                </div>
                <Link 
                  to="/membership-roster" 
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-indigo-600/20"
                >
                  Manage Membership Records
                </Link>
              </div>

              <MembershipConfiguration society={society} onUpdate={fetchPresidentData} />
              <PaymentVerificationDesk events={societyEvents} />
              <ManualTicketingHub events={societyEvents} onTicketsIssued={fetchPresidentData} />
            </div>

          </>
        )}

      </div>

      {/* ======================= MODALS ======================= */}

      {/* 1. COMPLETE CLUB EDITING MODAL (WITH INTEGRATED CABINET ROSTER) */}
      {showClubEditModal && society && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-8 shadow-2xl relative max-h-[92vh] flex flex-col overflow-hidden">
            <button
              onClick={() => setShowClubEditModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 cursor-pointer z-10"
            >
              <X size={20} />
            </button>

            <div className="shrink-0 mb-3 pb-2 border-b border-slate-100">
              <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2 mb-1">
                <Settings className="text-indigo-600" /> Edit Complete Club Profile & Cabinet Roster
              </h3>
              <p className="text-xs text-slate-500 font-medium mb-3">
                Customize {society.name}'s cover photo, logo, vision, contact info, and manage cabinet roles all in one place.
              </p>

              {/* TAB SELECTOR */}
              <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setClubEditTab('branding')}
                  className={`pb-2 px-3 text-xs font-black transition cursor-pointer border-b-2 whitespace-nowrap ${
                    clubEditTab === 'branding' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  1. Branding, Logo & Vision
                </button>
                <button
                  type="button"
                  onClick={() => setClubEditTab('cabinet')}
                  className={`pb-2 px-3 text-xs font-black transition cursor-pointer border-b-2 whitespace-nowrap ${
                    clubEditTab === 'cabinet' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  2. Cabinet & Executive Roster ({activeCabinet.length})
                </button>
                <button
                  type="button"
                  onClick={() => setClubEditTab('banking')}
                  className={`pb-2 px-3 text-xs font-black transition cursor-pointer border-b-2 whitespace-nowrap ${
                    clubEditTab === 'banking' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  3. Banking & Fee Accounts
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-4">
              {/* TAB 1: BRANDING & VISUALS */}
              {clubEditTab === 'branding' && (
              <form onSubmit={handleUpdateClubProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <ImageUploader
                      label="Cover Banner Photo (PC / Mobile Gallery)"
                      hint="Select cover image from device storage or camera"
                      shape="banner"
                      value={settingsForm.cover_image}
                      onChange={(url) => setSettingsForm({ ...settingsForm, cover_image: url })}
                    />
                    {/* Optional Quick Presets */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[10px] text-slate-400 font-bold self-center">Quick Presets:</span>
                      {[
                        { label: 'Cyber Tech', url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1600&q=80' },
                        { label: 'AI & Data', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80' },
                        { label: 'Campus Hall', url: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1600&q=80' },
                      ].map(p => (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => setSettingsForm({ ...settingsForm, cover_image: p.url })}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[10px] font-bold cursor-pointer"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <ImageUploader
                      label="Club Logo / Crest (PC / Mobile Gallery)"
                      hint="Upload square logo badge from device"
                      shape="avatar"
                      value={settingsForm.logo}
                      onChange={(url) => setSettingsForm({ ...settingsForm, logo: url })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Vision Statement</label>
                    <textarea
                      rows={2}
                      placeholder="To pioneer departmental excellence and ethical cyber security leadership..."
                      value={settingsForm.vision}
                      onChange={e => setSettingsForm({ ...settingsForm, vision: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Mission Statement</label>
                    <textarea
                      rows={2}
                      placeholder="Cultivating student research, blue-team defense squads, and summits..."
                      value={settingsForm.mission}
                      onChange={e => setSettingsForm({ ...settingsForm, mission: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">About / Club Overview</label>
                  <textarea
                    rows={2}
                    placeholder="Comprehensive description of activities, meetings, and student benefits..."
                    value={settingsForm.description}
                    onChange={e => setSettingsForm({ ...settingsForm, description: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Official Contact Email</label>
                    <input
                      type="email"
                      placeholder="club@university.edu.pk"
                      value={settingsForm.contact_email}
                      onChange={e => setSettingsForm({ ...settingsForm, contact_email: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Official Contact Phone</label>
                    <input
                      type="text"
                      placeholder="+92 300 1234567"
                      value={settingsForm.contact_phone}
                      onChange={e => setSettingsForm({ ...settingsForm, contact_phone: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                    />
                  </div>
                </div>

                {/* Complete Social Links Section */}
                <div className="pt-2 border-t border-slate-200">
                  <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider mb-2">
                    Official Social & Community Channels
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1 flex items-center gap-1">
                        <WhatsAppIcon size={14} className="text-emerald-600" /> WhatsApp Group / Community Link
                      </label>
                      <input
                        type="url"
                        placeholder="https://chat.whatsapp.com/..."
                        value={settingsForm.whatsapp}
                        onChange={e => setSettingsForm({ ...settingsForm, whatsapp: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1 flex items-center gap-1">
                        <WhatsAppChannelIcon size={14} className="text-teal-600" /> WhatsApp Channel Link
                      </label>
                      <input
                        type="url"
                        placeholder="https://whatsapp.com/channel/..."
                        value={settingsForm.whatsapp_channel}
                        onChange={e => setSettingsForm({ ...settingsForm, whatsapp_channel: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1 flex items-center gap-1">
                        <FacebookIcon size={14} className="text-blue-600" /> Facebook Page / Group URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://facebook.com/your_club"
                        value={settingsForm.facebook}
                        onChange={e => setSettingsForm({ ...settingsForm, facebook: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1 flex items-center gap-1">
                        <Globe size={14} className="text-indigo-600" /> Official Website URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://society.university.edu.pk"
                        value={settingsForm.website}
                        onChange={e => setSettingsForm({ ...settingsForm, website: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1 flex items-center gap-1">
                        <InstagramIcon /> Instagram Profile URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://instagram.com/club_handle"
                        value={settingsForm.instagram}
                        onChange={e => setSettingsForm({ ...settingsForm, instagram: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1 flex items-center gap-1">
                        <LinkedinIcon /> LinkedIn Organization URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://linkedin.com/company/club"
                        value={settingsForm.linkedin}
                        onChange={e => setSettingsForm({ ...settingsForm, linkedin: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1 flex items-center gap-1">
                        <YoutubeIcon size={14} className="text-rose-600" /> YouTube Channel URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://youtube.com/@club_official"
                        value={settingsForm.youtube}
                        onChange={e => setSettingsForm({ ...settingsForm, youtube: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1 flex items-center gap-1">
                        <TwitterIcon size={13} className="text-slate-800" /> Twitter / X Profile URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://x.com/club_handle"
                        value={settingsForm.twitter}
                        onChange={e => setSettingsForm({ ...settingsForm, twitter: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-white py-2 z-10">
                  <button
                    type="button"
                    onClick={() => setShowClubEditModal(false)}
                    className="px-4 py-2 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition cursor-pointer"
                  >
                    Save Branding & Visuals
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: INTEGRATED CABINET & ROSTER */}
            {clubEditTab === 'cabinet' && (
              <div className="space-y-5">
                {/* 1. Enter Student Roll Number & Live Search */}
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-indigo-700 tracking-wider flex items-center gap-1.5">
                      <UserPlus size={15} /> Select & Induct Student to Cabinet
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                      Step 1: Student Search & Selection
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          placeholder="Search Student by Roll Number or Name (e.g. 2022-CS-101 or Ali)"
                          value={rollNumberInput}
                          onChange={e => handleSearchStudents(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleLookupStudent();
                            }
                          }}
                          className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 tracking-wide"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={isLookingUpStudent || !rollNumberInput.trim()}
                        onClick={handleLookupStudent}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                      >
                        {isLookingUpStudent ? 'Searching...' : 'Lookup Student Record'}
                      </button>
                    </div>

                    {/* Instant Search Suggestions Dropdown */}
                    {studentSearchResults.length > 0 && (
                      <div className="bg-white border-2 border-indigo-200 rounded-2xl p-2 shadow-lg max-h-56 overflow-y-auto space-y-1 animate-in fade-in">
                        <span className="text-[10px] font-bold uppercase text-slate-400 px-3 py-1 block">
                          Select student below to view complete record:
                        </span>
                        {studentSearchResults.map(s => (
                          <div
                            key={s.id || s.username}
                            onClick={() => handleSelectStudentForCabinet(s)}
                            className="p-2.5 hover:bg-indigo-50 rounded-xl flex items-center justify-between cursor-pointer transition"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                                {(s.full_name || s.username || 'S')[0].toUpperCase()}
                              </div>
                              <div>
                                <h5 className="text-xs font-black text-slate-900">{s.full_name || s.username}</h5>
                                <span className="text-[11px] font-mono text-indigo-600 font-bold">{s.roll_number || s.username} • {s.program || 'BS Computer Science'}</span>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100/70 px-2.5 py-1 rounded-lg">
                              Select & View Profile ↗
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {studentLookupError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-bold text-rose-700 animate-in fade-in">
                      <AlertTriangle size={15} className="shrink-0" />
                      <span>{studentLookupError}</span>
                    </div>
                  )}

                  {/* 2. Read-Only Complete Student Profile (Non-editable as requested) */}
                  {lookedUpStudent && (
                    <div className="bg-white border-2 border-indigo-200 rounded-2xl p-5 shadow-sm space-y-4 animate-in fade-in">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-black text-lg flex items-center justify-center shadow-md">
                            {(lookedUpStudent.full_name || lookedUpStudent.username || 'S')[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-black text-slate-900">{lookedUpStudent.full_name || lookedUpStudent.username}</h4>
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 size={11} /> Verified Database Record
                              </span>
                            </div>
                            <span className="text-xs font-bold text-indigo-600 font-mono">Roll No: {lookedUpStudent.roll_number || lookedUpStudent.username}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setLookedUpStudent(null);
                            setRollNumberInput('');
                          }}
                          className="text-[11px] font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition cursor-pointer"
                        >
                          Change Student
                        </button>
                      </div>

                      {/* Non-editable detailed student information grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Student Full Name</span>
                          <span className="text-xs font-bold text-slate-800 block select-all">{lookedUpStudent.full_name || lookedUpStudent.username}</span>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Father's Name</span>
                          <span className="text-xs font-bold text-slate-800 block select-all">{lookedUpStudent.father_name || 'N/A'}</span>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">University Email</span>
                          <span className="text-xs font-bold text-slate-800 block truncate select-all">{lookedUpStudent.email || 'N/A'}</span>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Faculty / School</span>
                          <span className="text-xs font-bold text-slate-800 block select-all">{lookedUpStudent.faculty_name || 'Faculty of Computing & IT'}</span>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Department</span>
                          <span className="text-xs font-bold text-slate-800 block select-all">{lookedUpStudent.department || 'Department of Computer Science'}</span>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Degree Program</span>
                          <span className="text-xs font-bold text-slate-800 block select-all">{lookedUpStudent.program || 'BS Cyber Security'}</span>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Contact Phone</span>
                          <span className="text-xs font-bold text-slate-800 block select-all">{lookedUpStudent.phone_number || 'N/A'}</span>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">System Username</span>
                          <span className="text-xs font-mono font-bold text-slate-700 block select-all">@{lookedUpStudent.username}</span>
                        </div>

                        <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                          <span className="text-[10px] font-bold uppercase text-emerald-600 block">Enrolment Status</span>
                          <span className="text-xs font-bold text-emerald-800 block">✓ Official University Student</span>
                        </div>
                      </div>

                      {/* 3. Assign Role & Term Year */}
                      <form onSubmit={handleAddCabinetMember} className="pt-3 border-t border-slate-100 space-y-3">
                        <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                          <p className="text-xs font-bold text-amber-800 flex items-center gap-2">
                            <AlertCircle size={14} />
                            Important: The student must be an active verified member of this society before they can be inducted into the Executive Cabinet.
                          </p>
                        </div>
                        <span className="text-xs font-black uppercase text-indigo-700 block">
                          Step 2: Assign Cabinet Role & Tenure Year
                        </span>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                              Cabinet Role Title <span className="text-rose-500">*</span>
                            </label>
                            {isCustomCabinetRole ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  autoFocus
                                  required
                                  placeholder="e.g. Stage Decore Head or Graphic Designer"
                                  value={newCabinetForm.role_title}
                                  onChange={e => {
                                    const customVal = e.target.value;
                                    const autoRank = getDynamicRoleRank({ role_title: customVal });
                                    setNewCabinetForm({ ...newCabinetForm, role_title: customVal, priority_rank: autoRank });
                                  }}
                                  className="w-full px-3.5 py-2.5 bg-white border border-indigo-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <button type="button" onClick={() => {
                                  setIsCustomCabinetRole(false);
                                  setNewCabinetForm({ ...newCabinetForm, role_title: 'Vice President - Operations', priority_rank: 200 });
                                }} className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl" title="Cancel Custom Role">
                                  <XCircle size={16} />
                                </button>
                              </div>
                            ) : (
                              <select
                                value={newCabinetForm.role_title}
                                onChange={e => {
                                  const val = e.target.value;
                                  if (val === 'CUSTOM_ROLE') {
                                    setIsCustomCabinetRole(true);
                                    setNewCabinetForm({ ...newCabinetForm, role_title: '', priority_rank: 900 });
                                  } else {
                                    const calculatedRank = getDynamicRoleRank({ role_title: val });
                                    setNewCabinetForm({ ...newCabinetForm, role_title: val, priority_rank: calculatedRank });
                                  }
                                }}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                              >
                                {ROLE_TIER_CATEGORIES.map(cat => (
                                  <optgroup key={cat.category} label={cat.category}>
                                    {cat.roles.map(r => (
                                      <option key={r.title} value={r.title}>
                                        {r.title}
                                      </option>
                                    ))}
                                  </optgroup>
                                ))}
                                <option value="CUSTOM_ROLE" className="font-black text-indigo-600">+ Add Custom Designation (Manual)...</option>
                              </select>
                            )}
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                              Term Year <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. 2026-2027"
                              value={newCabinetForm.term_year}
                              onChange={e => setNewCabinetForm({ ...newCabinetForm, term_year: e.target.value })}
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                            />
                          </div>
                        </div>

                        {isCustomCabinetRole && (
                          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
                            <label className="block text-[11px] font-bold uppercase text-indigo-900 mb-1">
                              Hierarchy Priority Rank (100–900)
                            </label>
                            <div className="flex items-center gap-3">
                              <input
                                type="number"
                                min="1"
                                max="1000"
                                value={newCabinetForm.priority_rank}
                                onChange={e => setNewCabinetForm({ ...newCabinetForm, priority_rank: parseInt(e.target.value) || 900 })}
                                className="w-32 px-3 py-1.5 bg-white border border-indigo-300 rounded-lg text-xs font-bold text-slate-800"
                              />
                              <span className="text-[10px] text-slate-500">
                                <strong>Hierarchy:</strong> 100=President, 200=VPs, 300=GS/Treasury, 400=Directors, 500=Heads, 600=Team Members, 900=General.
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <p className="text-[11px] text-slate-500 font-medium">
                            Nominations require <strong>Faculty Advisor</strong> verification. Official digital cards are issued once approved.
                          </p>
                          <button
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/30 flex items-center gap-2 cursor-pointer shrink-0"
                          >
                            <UserPlus size={15} /> Nominate {lookedUpStudent.full_name || lookedUpStudent.username} to Cabinet
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>

                {/* Cabinet List */}
                <div className="space-y-6">
                  {/* 1. Verified Active Executive Roster */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-2">
                        Official Executive Cabinet ({verifiedCabinet.length} Verified)
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">
                        Digital ID Cards Issued
                      </span>
                    </div>

                    {verifiedCabinet.length === 0 ? (
                      <p className="text-xs text-slate-400 font-medium p-4 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        No verified executive cabinet members currently. Nominate candidates above.
                      </p>
                    ) : (
                      verifiedCabinet.map(cab => (
                        <div 
                          key={cab.id} 
                          onClick={() => setSelectedCabinetStudent(cab)}
                          className="p-3 bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md transition rounded-2xl flex items-center justify-between cursor-pointer group"
                          title="Click to view full student information"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-sm group-hover:scale-105 transition">
                              {(cab.full_name || cab.username || 'M')[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition">{cab.full_name || cab.username}</h4>
                                <span className="text-[10px] text-slate-400 font-bold hidden sm:inline">({cab.roll_number || cab.username})</span>
                              </div>
                              <span className="text-[11px] font-bold text-violet-600 block">{cab.role_title} • {cab.term_year}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 group-hover:bg-indigo-600 group-hover:text-white px-2 py-0.5 rounded-lg border border-indigo-200 transition">
                              View Info ↗
                            </span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1">
                              ✓ Verified Official
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleCabinetActive(cab.id);
                              }}
                              className="px-2 py-1 text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition cursor-pointer"
                              title="Deactivate member (preserves administrative history)"
                            >
                              Deactivate
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveCabinetMember(cab.id);
                              }}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Permanently Delete Member Record"
                            >
                              <UserMinus size={15} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* 2. Pending Faculty Advisor Nominations */}
                  {pendingCabinetNominations.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase text-amber-600 tracking-wider flex items-center gap-1.5">
                          ⏳ Awaiting Faculty Advisor Endorsement ({pendingCabinetNominations.length} Nominations)
                        </span>
                        <span className="text-[10px] text-amber-600/80 font-bold">
                          Pending Verification
                        </span>
                      </div>

                      {pendingCabinetNominations.map(cab => (
                        <div 
                          key={cab.id} 
                          onClick={() => setSelectedCabinetStudent(cab)}
                          className="p-3 bg-amber-50/50 border border-amber-200 hover:border-amber-400 hover:shadow-md transition rounded-2xl flex items-center justify-between cursor-pointer group"
                          title="Click to view full student information"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
                              {(cab.full_name || cab.username || 'M')[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-black text-slate-900 group-hover:text-amber-700 transition">{cab.full_name || cab.username}</h4>
                                <span className="text-[10px] text-slate-400 font-bold hidden sm:inline">({cab.roll_number || cab.username})</span>
                              </div>
                              <span className="text-[11px] font-bold text-amber-700 block">{cab.role_title} • Term {cab.term_year}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-lg border border-amber-300">
                              Awaiting Advisor Review
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveCabinetMember(cab.id);
                              }}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Cancel Nomination"
                            >
                              <UserMinus size={15} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Administrative History: Inactive / Past Cabinet Members */}
                  {inactiveCabinet.length > 0 && (
                    <div className="pt-4 border-t border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase text-slate-400 tracking-wider block">
                          Past / Inactive Cabinet History ({inactiveCabinet.length} Records)
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Preserved in Administrative History
                        </span>
                      </div>

                      {inactiveCabinet.map(cab => (
                        <div 
                          key={cab.id} 
                          onClick={() => setSelectedCabinetStudent(cab)}
                          className="p-3 bg-slate-50/80 border border-slate-200/80 opacity-75 hover:opacity-100 hover:border-slate-300 transition rounded-2xl flex items-center justify-between cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm">
                              {(cab.full_name || cab.username || 'M')[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold text-slate-700 line-through">{cab.full_name || cab.username}</h4>
                                <span className="text-[10px] text-slate-400 font-bold hidden sm:inline">({cab.roll_number || cab.username})</span>
                              </div>
                              <span className="text-[11px] font-medium text-slate-500 block">{cab.role_title} • {cab.term_year}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-lg">
                              Inactive
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleCabinetActive(cab.id);
                              }}
                              className="px-2 py-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition cursor-pointer"
                              title="Reactivate assignment"
                            >
                              Reactivate
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveCabinetMember(cab.id);
                              }}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Permanently remove"
                            >
                              <UserMinus size={15} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: BANKING DETAILS (READ-ONLY FOR PRESIDENTS AS PER STATUTORY POLICY) */}
            {clubEditTab === 'banking' && (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                  <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0 mt-0.5">
                    <Lock size={16} />
                  </div>
                  <div className="text-xs text-amber-900 leading-relaxed">
                    <strong className="block font-black text-amber-950 uppercase tracking-wider mb-0.5">
                      Statutory Policy: Advisor & Admin Authorization Only
                    </strong>
                    Under Central University Financial Guidelines, society banking accounts, payment collection details, and IBAN credentials can only be edited by the assigned Faculty Advisor or Super Admin. Presidents have read-only access to verify bank information.
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1 flex items-center gap-1">
                        <Lock size={12} className="text-slate-400" /> Bank Name
                      </label>
                      <input
                        type="text"
                        disabled
                        value={settingsForm.bank_name || 'Standard Chartered Bank'}
                        className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1 flex items-center gap-1">
                        <Lock size={12} className="text-slate-400" /> Account Title
                      </label>
                      <input
                        type="text"
                        disabled
                        value={settingsForm.bank_account_title || society.name}
                        className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1 flex items-center gap-1">
                      <Lock size={12} className="text-slate-400" /> IBAN / Account Number
                    </label>
                    <input
                      type="text"
                      disabled
                      value={settingsForm.bank_account_number || 'PK36SCBL0000001123456701'}
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1 flex items-center gap-1">
                      <Lock size={12} className="text-slate-400" /> Payment & Deposit Instructions
                    </label>
                    <textarea
                      rows={3}
                      disabled
                      value={settingsForm.payment_instructions || 'Please transfer fee via 1Link / Raast / Online Banking and upload the verified receipt snapshot with transaction reference.'}
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowClubEditModal(false)}
                    className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Close Banking View
                  </button>
                </div>
              </div>
            )}

            </div>
          </div>
        </div>
      )}

      {/* 2. PROPOSE DETAILED EVENT MODAL */}
      {showProposeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setShowProposeModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-black text-slate-900 mb-1 flex items-center gap-2">
              <PlusCircle className="text-indigo-600" /> Propose Comprehensive Event
            </h3>
            <p className="text-xs text-slate-500 font-medium mb-5">
              Draft full event particulars. Once saved, download the formal document for physical endorsement by Advisor, Chairman, and HOD.
            </p>

            <form onSubmit={handleProposeDetailedEvent} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Event Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cyber Security Summit 2026 & CTF"
                    value={eventForm.title}
                    onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Theme / Tagline</label>
                  <input
                    type="text"
                    placeholder="e.g. Defending National Digital Frontiers"
                    value={eventForm.tagline}
                    onChange={e => setEventForm({ ...eventForm, tagline: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Event Type</label>
                  <select
                    value={eventForm.event_type}
                    onChange={e => setEventForm({ ...eventForm, event_type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="Technical Summit & Workshop">Technical Summit & Workshop</option>
                    <option value="Cyber Hackathon & CTF">Cyber Hackathon & CTF</option>
                    <option value="Guest Keynote Lecture">Guest Keynote Lecture</option>
                    <option value="Hands-on Boot Camp">Hands-on Boot Camp</option>
                    <option value="Annual General Gala">Annual General Gala</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Proposed Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={eventForm.date}
                    onChange={e => {
                      setEventForm({ ...eventForm, date: e.target.value });
                      checkDateConflict(e.target.value);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Venue / Facility</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Campus Main Auditorium"
                    value={eventForm.venue_name}
                    onChange={e => setEventForm({ ...eventForm, venue_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              {dateConflictWarning && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 font-bold">
                  {dateConflictWarning}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Chief Guest / Keynote Speaker</label>
                  <input
                    type="text"
                    placeholder="e.g. Prof. Dr. Tariq Mahmood (Dean of Computing)"
                    value={eventForm.chief_guest}
                    onChange={e => setEventForm({ ...eventForm, chief_guest: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Expected Attendees</label>
                    <input
                      type="number"
                      value={eventForm.expected_attendees}
                      onChange={e => setEventForm({ ...eventForm, expected_attendees: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Budget Estimate ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={eventForm.budget_estimate}
                      onChange={e => setEventForm({ ...eventForm, budget_estimate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Detailed Agenda / Program Schedule</label>
                <textarea
                  rows={3}
                  value={eventForm.agenda}
                  onChange={e => setEventForm({ ...eventForm, agenda: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  placeholder="09:30 AM - Check-in..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Equipment & Logistics Required</label>
                <textarea
                  rows={2}
                  value={eventForm.equipment_needed}
                  onChange={e => setEventForm({ ...eventForm, equipment_needed: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  placeholder="4x Wireless Mics, 4K Projector, Dedicated 1Gbps Fiber Subnet..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Full Description & Objective</label>
                <textarea
                  rows={2}
                  required
                  value={eventForm.description}
                  onChange={e => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  placeholder="Comprehensive event objectives..."
                />
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={eventForm.is_paid}
                    onChange={e => setEventForm({ ...eventForm, is_paid: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  Paid Event (Requires Ticket Payment)
                </label>

                {eventForm.is_paid && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600">Price ($):</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={eventForm.price}
                      onChange={e => setEventForm({ ...eventForm, price: e.target.value })}
                      className="w-24 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                )}
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowProposeModal(false)}
                  className="px-4 py-2 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition cursor-pointer"
                >
                  Submit & Generate Printable Dossier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. OFFICIAL PRINTABLE PROPOSAL DOSSIER MODAL */}
      {selectedProposalForDossier && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-10 shadow-2xl relative max-h-[95vh] overflow-y-auto print:p-0 print:shadow-none print:max-h-full">
            
            {/* Top Bar for Screen Only */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200 print:hidden">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                Official Statutory Dossier Preview
              </span>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition cursor-pointer"
                >
                  <Printer size={15} /> Print / Save as PDF
                </button>
                <button
                  onClick={() => setSelectedProposalForDossier(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* FORMAL PRINTABLE DOCUMENT CONTENT */}
            <div className="border-4 border-slate-900 p-8 sm:p-10 bg-white text-slate-900 font-serif space-y-6">
              {/* University Header */}
              <div className="text-center pb-6 border-b-2 border-slate-900 space-y-1">
                <span className="text-xs font-black uppercase tracking-widest text-slate-600 block font-sans">
                  Directorate of Student Affairs & Campus Societies
                </span>
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900 font-sans">
                  Statutory Event Proposal & Authorization Dossier
                </h1>
                <p className="text-xs text-slate-500 font-sans font-bold">
                  Reference: <span className="font-mono text-indigo-900">{selectedProposalForDossier.proposal_doc_number || `PROP-2026-${selectedProposalForDossier.id}`}</span> • Issued Under DSMS Governance Framework
                </p>
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-300 font-sans text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Departmental Chapter</span>
                  <strong className="text-slate-900">{society?.name}</strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">President (Proposer)</span>
                  <strong className="text-slate-900">{presidentDisplayName}</strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Faculty Advisor</span>
                  <strong className="text-slate-900">{society?.advisor_full_name || society?.advisor_name || 'Dr. Sarah Ahmed'}</strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Submission Date</span>
                  <strong className="text-slate-900">{new Date(selectedProposalForDossier.date).toLocaleDateString()}</strong>
                </div>
              </div>

              {/* Event Particulars */}
              <div className="space-y-4 font-sans text-xs text-slate-800">
                <div className="p-3 bg-slate-100 rounded-lg">
                  <h3 className="text-base font-black text-slate-900">{selectedProposalForDossier.title}</h3>
                  <p className="text-xs font-semibold text-slate-600 mt-0.5">{selectedProposalForDossier.tagline || 'Technical & Departmental Excellence Initiative'}</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="border border-slate-200 p-2.5 rounded-lg">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Category</span>
                    <strong className="text-slate-900">{selectedProposalForDossier.event_type}</strong>
                  </div>
                  <div className="border border-slate-200 p-2.5 rounded-lg">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Venue Assigned</span>
                    <strong className="text-slate-900">{selectedProposalForDossier.venue_name || 'Campus Main Auditorium'}</strong>
                  </div>
                  <div className="border border-slate-200 p-2.5 rounded-lg">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Expected Attendance</span>
                    <strong className="text-slate-900">{selectedProposalForDossier.expected_attendees || 100} Delegates</strong>
                  </div>
                  <div className="border border-slate-200 p-2.5 rounded-lg">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Estimated Outlay</span>
                    <strong className="text-slate-900">PKR {parseFloat(selectedProposalForDossier.budget_estimate || 0).toLocaleString()}</strong>
                  </div>
                </div>

                {/* Agenda */}
                <div className="border border-slate-200 p-3 rounded-lg space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Program Agenda & Timeline</span>
                  <pre className="text-[11px] whitespace-pre-wrap font-sans text-slate-700 leading-relaxed">
                    {selectedProposalForDossier.agenda || 'Detailed schedule will be coordinated with the university events committee.'}
                  </pre>
                </div>

                {/* Logistics */}
                <div className="border border-slate-200 p-3 rounded-lg space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Equipment & Facility Requisition</span>
                  <p className="text-[11px] text-slate-700">
                    {selectedProposalForDossier.equipment_needed || 'Standard AV, microphones, projector, and power backup.'}
                  </p>
                </div>
              </div>

              {/* 4 STATUTORY SIGNATURE & STAMP BOXES */}
              <div className="pt-6 border-t-2 border-slate-900">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 block mb-4 font-sans text-center">
                  Mandatory Statutory Endorsements & Physical Approvals Hierarchy
                </span>

                <div className="grid grid-cols-2 gap-4 font-sans text-xs">
                  {/* BOX 1: PRESIDENT */}
                  <div className="border-2 border-slate-400 p-4 rounded-xl flex flex-col justify-between h-36 bg-slate-50/50">
                    <div>
                      <span className="text-[10px] font-black uppercase text-indigo-800 tracking-wider">1. Society President</span>
                      <p className="text-[11px] text-slate-600 mt-1">Submitted on behalf of {society?.name}</p>
                    </div>
                    <div className="border-t border-dashed border-slate-400 pt-2 flex justify-between items-end">
                      <span className="text-[10px] font-bold text-slate-500">Signature: __________________</span>
                      <span className="text-[10px] font-bold text-slate-500">Date: ______</span>
                    </div>
                  </div>

                  {/* BOX 2: FACULTY ADVISOR */}
                  <div className="border-2 border-slate-400 p-4 rounded-xl flex flex-col justify-between h-36 bg-slate-50/50">
                    <div>
                      <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">2. Faculty Advisor Endorsement</span>
                      <p className="text-[11px] text-slate-600 mt-1">Recommendation Remarks & Official Stamp</p>
                    </div>
                    <div className="border-t border-dashed border-slate-400 pt-2 flex justify-between items-end">
                      <span className="text-[10px] font-bold text-slate-500">Signature: __________________</span>
                      <span className="text-[10px] font-bold text-slate-500">Seal: [ &nbsp; ]</span>
                    </div>
                  </div>

                  {/* BOX 3: DEPARTMENT CHAIRMAN */}
                  <div className="border-2 border-slate-400 p-4 rounded-xl flex flex-col justify-between h-36 bg-slate-50/50">
                    <div>
                      <span className="text-[10px] font-black uppercase text-violet-800 tracking-wider">3. Department Chairman / Chair</span>
                      <p className="text-[11px] text-slate-600 mt-1">Academic Calendar & Venue Clearance</p>
                    </div>
                    <div className="border-t border-dashed border-slate-400 pt-2 flex justify-between items-end">
                      <span className="text-[10px] font-bold text-slate-500">Signature: __________________</span>
                      <span className="text-[10px] font-bold text-slate-500">Seal: [ &nbsp; ]</span>
                    </div>
                  </div>

                  {/* BOX 4: HOD / DEAN */}
                  <div className="border-2 border-slate-400 p-4 rounded-xl flex flex-col justify-between h-36 bg-slate-50/50">
                    <div>
                      <span className="text-[10px] font-black uppercase text-rose-800 tracking-wider">4. Head of Department (HOD) Approval</span>
                      <p className="text-[11px] text-slate-600 mt-1">Final Executive Sanction Order</p>
                    </div>
                    <div className="border-t border-dashed border-slate-400 pt-2 flex justify-between items-end">
                      <span className="text-[10px] font-bold text-slate-500">Signature: __________________</span>
                      <span className="text-[10px] font-bold text-slate-500">Official Stamp</span>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 mt-4 text-center font-sans">
                  * Note: After obtaining physical signatures and stamps in the boxes above, please photograph or scan this document and upload it via the President Portal to activate live event status.
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 4. UPLOAD SIGNED PROPOSAL DOCUMENT MODAL */}
      {uploadDocModalEvent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setUploadDocModalEvent(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-black text-slate-900 mb-1 flex items-center gap-2">
              <UploadCloud className="text-indigo-600" /> Upload Physically Signed Dossier
            </h3>
            <p className="text-xs text-slate-500 font-medium mb-4">
              Attach the scanned or photographed document signed by Faculty Advisor, Department Chairman, and HOD for <strong className="text-slate-800">{uploadDocModalEvent.title}</strong>.
            </p>

            <form onSubmit={handleUploadSignedDoc} className="space-y-4">
              <div>
                <ImageUploader
                  label="Scanned Signed Document / Mobile Photo"
                  hint="Select scanned paper or photo of signed document from PC or mobile gallery"
                  acceptDocs={true}
                  shape="document"
                  value={signedDocUrl}
                  onChange={(url) => setSignedDocUrl(url)}
                />
              </div>

              <div className="p-3 bg-violet-50 border border-violet-200 rounded-xl text-xs text-violet-900 space-y-1">
                <span className="font-bold flex items-center gap-1"><FileCheck size={14} /> Verification Protocol:</span>
                <p className="text-[11px] text-violet-700 leading-snug">
                  Once uploaded, this document will be instantly shared with your Faculty Advisor ({society?.advisor_full_name || society?.advisor_name}) and Super Admin for verification of physical seals.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setUploadDocModalEvent(null)}
                  className="px-4 py-2 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition cursor-pointer"
                >
                  Confirm & Submit Dossier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. INSPECT SIGNED DOCUMENT MODAL */}
      {inspectDocEvent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[92vh] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">{inspectDocEvent.title}</h3>
                <span className="text-xs text-slate-500 font-medium">Physically Signed & Stamped Approval Dossier</span>
              </div>
              <button
                onClick={() => setInspectDocEvent(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 mb-4 text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Advisor Sign-Off</span>
                <strong className={inspectDocEvent.advisor_approved ? 'text-emerald-600' : 'text-slate-700'}>
                  {inspectDocEvent.advisor_approved ? '✓ Verified' : 'Pending Review'}
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Chairman Clearance</span>
                <strong className={inspectDocEvent.chairman_approved ? 'text-emerald-600' : 'text-slate-700'}>
                  {inspectDocEvent.chairman_approved ? '✓ Endorsed' : 'Pending Review'}
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">HOD Sanction</span>
                <strong className={inspectDocEvent.hod_approved ? 'text-emerald-600' : 'text-slate-700'}>
                  {inspectDocEvent.hod_approved ? '✓ Sanctioned' : 'Pending Review'}
                </strong>
              </div>
            </div>

            <div className="flex-1 bg-slate-950 rounded-2xl overflow-hidden min-h-[300px] flex items-center justify-center border border-slate-800">
              <MediaImage
                src={inspectDocEvent.signed_proposal_doc}
                alt="Signed Dossier Scan"
                className="max-h-[60vh] w-auto object-contain"
              />
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end gap-3">
              <MediaLink
                href={inspectDocEvent.signed_proposal_doc}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <ExternalLink size={14} /> Open in New Tab
              </MediaLink>
              <button
                onClick={() => setInspectDocEvent(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. BULK GALLERY UPLOAD MODAL */}
      {showBulkGalleryModal && society && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setShowBulkGalleryModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-black text-slate-900 mb-1 flex items-center gap-2">
              <UploadCloud className="text-rose-600" /> Create Event Album Folder & Bulk Upload
            </h3>
            <p className="text-xs text-slate-500 font-medium mb-4">
              Organize photos into a dedicated Event Folder. Select the event, set the album title/tag, choose whether to make it publicly viewable or private to event attendees, then select photos.
            </p>

            <form onSubmit={handleBulkGalleryUpload} className="space-y-4">
              {/* STEP 1: EVENT SELECTION OR CUSTOM ALBUM */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1 flex items-center justify-between">
                  <span>1. Select Associated Event (or Choose Custom Folder below)</span>
                  <span className="text-[10px] font-semibold text-slate-400">Creates event album folder</span>
                </label>
                <select
                  value={bulkGalleryForm.event_id}
                  onChange={e => {
                    const chosenId = e.target.value;
                    const ev = societyEvents.find(ev => ev.id === parseInt(chosenId));
                    setBulkGalleryForm({ 
                      ...bulkGalleryForm, 
                      event_id: chosenId,
                      title: bulkGalleryForm.title || (ev ? `${ev.title} Showcase` : '')
                    });
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="">-- Choose an Event (Optional if Title specified) --</option>
                  {societyEvents.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.title}</option>
                  ))}
                </select>
              </div>

              {/* STEP 2: ALBUM TITLE / FOLDER NAME */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1 flex items-center justify-between">
                  <span>2. Album Title / Folder Name</span>
                  <span className="text-[10px] text-indigo-600 font-bold">Dedicated Server Folder Created</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cyber Summit 2026 Keynote & CTF Award Ceremony"
                  value={bulkGalleryForm.title}
                  onChange={e => setBulkGalleryForm({ ...bulkGalleryForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>

              {/* STEP 3: PUBLICLY SHOWN TOGGLE (ON / OFF) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black uppercase text-slate-800 block">
                      3. Visibility & Privacy Setting
                    </span>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {bulkGalleryForm.is_public 
                        ? 'Public: Visible on the campus gallery for all students and visitors.'
                        : 'Private: Shared only with students who registered for this event. Hidden from public.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBulkGalleryForm(prev => ({ ...prev, is_public: !prev.is_public }))}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      bulkGalleryForm.is_public ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        bulkGalleryForm.is_public ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                    bulkGalleryForm.is_public 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {bulkGalleryForm.is_public ? '🌐 Publicly Shown (Campus Gallery)' : '🔒 Private (Event Attendees Only)'}
                  </span>
                </div>
              </div>

              {/* STEP 4: BULK IMAGE UPLOADER */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  4. Select Photos for this Album Folder
                </label>
                <ImageUploader
                  isBulk={true}
                  folder={bulkGalleryForm.title || (societyEvents.find(e => e.id === parseInt(bulkGalleryForm.event_id))?.title || 'Event_Showcase')}
                  label="Upload Event Showcase Photos (PC / Mobile Gallery)"
                  hint="Select 1 or multiple photos from device gallery, PC folders, or take new photos"
                  onBulkUpload={(newUrls) => {
                    setBulkGalleryForm(prev => ({
                      ...prev,
                      images: [...(prev.images || []), ...newUrls]
                    }));
                  }}
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowBulkGalleryModal(false)}
                  className="px-4 py-2 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/30 transition cursor-pointer"
                >
                  Create Folder & Upload Photos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. RECORD LEDGER TRANSACTION MODAL */}
      {showAddBudgetModal && society && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowAddBudgetModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-black text-slate-900 mb-1 flex items-center gap-2">
              <DollarSign className="text-emerald-600" /> Record Ledger Transaction
            </h3>
            <p className="text-xs text-slate-500 font-medium mb-4">
              Add itemized expense or income for {society.name}.
            </p>

            <form onSubmit={handleAddBudgetItem} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Transaction Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Auditorium Sound System & Mic Rental"
                  value={budgetForm.title}
                  onChange={e => setBudgetForm({ ...budgetForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Type</label>
                  <select
                    value={budgetForm.is_expense}
                    onChange={e => setBudgetForm({ ...budgetForm, is_expense: e.target.value === 'true' })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="true">Expense (Outflow)</option>
                    <option value="false">Income (Inflow)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 150.00"
                    value={budgetForm.amount}
                    onChange={e => setBudgetForm({ ...budgetForm, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Category</label>
                  <select
                    value={budgetForm.category}
                    onChange={e => setBudgetForm({ ...budgetForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="Logistics & Venue">Logistics & Venue</option>
                    <option value="Refreshments & Catering">Refreshments & Catering</option>
                    <option value="Guest Speaker Honorarium">Guest Speaker Honorarium</option>
                    <option value="Printing, Badges & Certificates">Printing, Badges & Certificates</option>
                    <option value="Ticket Revenue Inflow">Ticket Revenue Inflow</option>
                    <option value="University Grant">University Grant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={budgetForm.payment_method}
                    onChange={e => setBudgetForm({ ...budgetForm, payment_method: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Campus Fund Voucher">Campus Fund Voucher</option>
                    <option value="Cash Advance">Cash Advance</option>
                    <option value="Online Gateway">Online Gateway</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Link to Event (Optional)</label>
                <select
                  value={budgetForm.event_id}
                  onChange={e => setBudgetForm({ ...budgetForm, event_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                >
                  <option value="">General Society Fund</option>
                  {societyEvents.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Receipt / Invoice Ref</label>
                <input
                  type="text"
                  placeholder="e.g. INV-2026-8812 or receipt image link"
                  value={budgetForm.receipt_doc}
                  onChange={e => setBudgetForm({ ...budgetForm, receipt_doc: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddBudgetModal(false)}
                  className="px-4 py-2 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Record Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. RECORD SPONSORSHIP MODAL */}
      {showAddSponsorModal && society && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowAddSponsorModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-black text-slate-900 mb-1 flex items-center gap-2">
              <Award className="text-amber-600" /> Record Corporate Sponsorship
            </h3>
            <p className="text-xs text-slate-500 font-medium mb-4">
              Add corporate sponsorships and external grants secured for {society.name}.
            </p>

            <form onSubmit={handleAddSponsorshipItem} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Sponsor / Partner Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cisco CyberSec / Red Hat"
                  value={sponsorForm.sponsor_name}
                  onChange={e => setSponsorForm({ ...sponsorForm, sponsor_name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Tier</label>
                  <select
                    value={sponsorForm.sponsor_tier}
                    onChange={e => setSponsorForm({ ...sponsorForm, sponsor_tier: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="Title Sponsor">Title Sponsor</option>
                    <option value="Platinum Sponsor">Platinum Sponsor</option>
                    <option value="Gold Sponsor">Gold Sponsor</option>
                    <option value="Silver Sponsor">Silver Sponsor</option>
                    <option value="Media Partner">Media Partner</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Grant Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 500.00"
                    value={sponsorForm.amount}
                    onChange={e => setSponsorForm({ ...sponsorForm, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Associated Event</label>
                <select
                  value={sponsorForm.event_id}
                  onChange={e => setSponsorForm({ ...sponsorForm, event_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                >
                  <option value="">General Society Fund</option>
                  {societyEvents.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Status</label>
                <select
                  value={sponsorForm.status}
                  onChange={e => setSponsorForm({ ...sponsorForm, status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                >
                  <option value="Received">Received (Funds In Bank)</option>
                  <option value="Committed">Committed (MOU Signed)</option>
                  <option value="Invoiced">Invoiced</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddSponsorModal(false)}
                  className="px-4 py-2 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/30 transition cursor-pointer"
                >
                  Save Sponsorship
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. RECRUITMENT MODAL */}
      {showRecruitmentModal && society && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowRecruitmentModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-black text-slate-900 mb-1 flex items-center gap-2">
              <UserPlus className="text-violet-600" /> Open New Recruitment Drive
            </h3>
            <p className="text-xs text-slate-500 font-medium mb-4">
              Launch member and executive induction for {society.name}.
            </p>

            <form onSubmit={handleLaunchRecruitment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Drive Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fall 2026 General Body & Sub-Team Induction"
                  value={recruitmentForm.title}
                  onChange={e => setRecruitmentForm({ ...recruitmentForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Application Deadline</label>
                <input
                  type="datetime-local"
                  required
                  value={recruitmentForm.deadline}
                  onChange={e => setRecruitmentForm({ ...recruitmentForm, deadline: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRecruitmentModal(false)}
                  className="px-4 py-2 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-md shadow-violet-600/30 transition cursor-pointer"
                >
                  Launch Drive Live
                </button>
              </div>
            </form>
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
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-purple-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shrink-0">
                {(selectedCabinetStudent.full_name || selectedCabinetStudent.username || 'S')[0].toUpperCase()}
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

      {/* APPOINT GATE VOLUNTEER MODAL */}
      {showAssignVolunteerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowAssignVolunteerModal(false);
                setSelectedVolunteerStudent(null);
                setVolunteerRollInput('');
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-black text-slate-900 mb-1 flex items-center gap-2">
              <UserPlus className="text-orange-600" /> Appoint Event Gate Volunteer
            </h3>
            <p className="text-xs text-slate-500 font-medium mb-5">
              Select a verified society student to authorize gate check-in duties, attendance scanning, and identity confirmation.
            </p>

            <form onSubmit={handleAssignVolunteerSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Target Event <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={volunteerForm.event_id}
                  onChange={e => setVolunteerForm({ ...volunteerForm, event_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="">Select Scheduled Event...</option>
                  {societyEvents.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.title} ({ev.date})</option>
                  ))}
                </select>
              </div>

              {/* Student Roll Lookup */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase text-slate-700">
                  Select Student Volunteer <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by Roll Number or Name..."
                    value={volunteerRollInput}
                    onChange={e => handleSearchVolunteers(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                  {volunteerSearchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {volunteerSearchResults.map(s => (
                        <div
                          key={s.id || s.username}
                          onClick={() => handleSelectVolunteer(s)}
                          className="p-2.5 hover:bg-orange-50 cursor-pointer flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900 block">{s.full_name || s.username}</span>
                            <span className="text-[11px] font-mono text-slate-400">{s.roll_number || s.username} • {s.department || 'Student'}</span>
                          </div>
                          <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-lg">Select</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedVolunteerStudent && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-emerald-900 block">{selectedVolunteerStudent.full_name || selectedVolunteerStudent.username}</span>
                      <span className="text-[11px] font-mono text-emerald-700">Roll: {selectedVolunteerStudent.roll_number || selectedVolunteerStudent.username}</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">Selected</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Gate / Desk Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Main Auditorium - Gate 1"
                    value={volunteerForm.gate_name}
                    onChange={e => setVolunteerForm({ ...volunteerForm, gate_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Duty Start Window
                  </label>
                  <input
                    type="datetime-local"
                    value={volunteerForm.duty_start}
                    onChange={e => setVolunteerForm({ ...volunteerForm, duty_start: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAssignVolunteerModal(false)}
                  className="px-4 py-2.5 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedVolunteerStudent || !volunteerForm.event_id}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/30 transition cursor-pointer"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN GENERAL EVENT VOLUNTEER ROLE MODAL */}
      {showAssignGeneralVolModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 relative">
            <button
              onClick={() => {
                setShowAssignGeneralVolModal(false);
                setSelectedGeneralVolStudent(null);
                setGeneralVolRollInput('');
              }}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <Clock size={22} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Assign Event Volunteer Role</h3>
                <p className="text-xs text-slate-500 font-medium">Designate student roles (Decorator, Registration, Security, Media, etc.).</p>
              </div>
            </div>

            <form onSubmit={handleAssignGeneralVolunteerSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Target Event (Optional for Society-wide)
                </label>
                <select
                  value={generalVolForm.event_id}
                  onChange={e => setGeneralVolForm({ ...generalVolForm, event_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Society-wide / General Service</option>
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.title} ({new Date(ev.date).toLocaleDateString()})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Select Student <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search student by roll number or username..."
                    value={generalVolRollInput}
                    onChange={e => handleSearchGeneralVolunteers(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {generalVolSearchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50 divide-y divide-slate-100">
                      {generalVolSearchResults.map(s => (
                        <div
                          key={s.id}
                          onClick={() => handleSelectGeneralVolunteer(s)}
                          className="p-2.5 hover:bg-emerald-50 cursor-pointer transition flex items-center justify-between"
                        >
                          <div>
                            <span className="text-xs font-bold text-slate-900 block">{s.full_name || s.username}</span>
                            <span className="text-[11px] font-mono text-slate-500">Roll: {s.roll_number || 'N/A'} • {s.department || 'CS'}</span>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100/60 px-2 py-0.5 rounded-md">Select</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedGeneralVolStudent && (
                  <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-emerald-900 block">{selectedGeneralVolStudent.full_name || selectedGeneralVolStudent.username}</span>
                      <span className="text-[11px] font-mono text-emerald-700">Roll: {selectedGeneralVolStudent.roll_number || 'N/A'}</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-700">Selected ✓</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Volunteer Role <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={generalVolForm.role}
                    onChange={e => setGeneralVolForm({ ...generalVolForm, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Decorator">Decorator & Stage Setup</option>
                    <option value="Registration Desk">Registration Desk Officer</option>
                    <option value="Security">Security & Crowd Control</option>
                    <option value="Photography & Media">Photography & Media Coverage</option>
                    <option value="Ushering & Hospitality">Ushering & Guest Hospitality</option>
                    <option value="Technical Support">Technical & AV Support</option>
                    <option value="Logistics">Logistics & Refreshments</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Estimated Shift Hours
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="24"
                    value={generalVolForm.hours}
                    onChange={e => setGeneralVolForm({ ...generalVolForm, hours: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Specific Task Brief / Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Assist guest registration at main hall from 09:00 AM to 01:00 PM..."
                  value={generalVolForm.description}
                  onChange={e => setGeneralVolForm({ ...generalVolForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignGeneralVolModal(false)}
                  className="px-4 py-2.5 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedGeneralVolStudent}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 transition cursor-pointer"
                >
                  Assign Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRESIDENT PROFILE EDIT MODAL */}
      <ExecutiveProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onProfileUpdated={() => {
          showToast("Presidential profile and photo updated successfully!");
        }}
      />

      {/* CREATE EVENT PROPOSAL MODAL */}
      {showCreateProposalModal && (
        <CreateProposalModal
          society={society}
          venues={venues}
          onClose={() => setShowCreateProposalModal(false)}
          onProposalCreated={(newProp) => {
            setProposals(prev => [newProp, ...prev]);
            setSelectedProposalDoc(newProp);
            showToast(`Proposal ${newProp.proposal_no} generated! Form ready to print.`);
          }}
        />
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
            if (updated.status === 'approved') {
              fetchPresidentData();
            }
          }}
        />
      )}

      {/* EDIT & PUBLISH MARKETING MATERIALS MODAL */}
      {showAdvertiseModal && advertiseTargetEvent && (
        <EditAdvertisementModal
          event={advertiseTargetEvent}
          onClose={() => {
            setShowAdvertiseModal(false);
            setAdvertiseTargetEvent(null);
          }}
          onSaved={(updatedEvent) => {
            setEvents(prev => prev.map(ev => ev.id === updatedEvent.id ? { ...ev, ...updatedEvent } : ev));
            fetchPresidentData();
            showToast(`Advertisement updated for "${updatedEvent.title}"!`);
          }}
        />
      )}

      {/* CERTIFICATE TEMPLATE DESIGN STUDIO MODAL */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowTemplateModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <Award className="text-amber-500" size={22} />
              <h3 className="text-xl font-black text-slate-900">Certificate Template Design Studio</h3>
            </div>
            <p className="text-xs text-slate-500 font-medium mb-6">
              Customize official certificate typography, body statement, and color schemes with live interactive preview.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form Controls */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Certificate Header Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={templateForm.title}
                    onChange={e => setTemplateForm({ ...templateForm, title: e.target.value })}
                    placeholder="e.g. Certificate of Merit & Excellence"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Target Event (Optional)
                  </label>
                  <select
                    value={templateForm.event}
                    onChange={e => setTemplateForm({ ...templateForm, event: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  >
                    <option value="">Society-Wide Default Template</option>
                    {events.map(ev => (
                      <option key={ev.id} value={ev.id}>{ev.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Certification Subtitle
                  </label>
                  <input
                    type="text"
                    value={templateForm.subtitle}
                    onChange={e => setTemplateForm({ ...templateForm, subtitle: e.target.value })}
                    placeholder="e.g. Digital Society Management System • Campus Network"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Body Certification Statement
                  </label>
                  <textarea
                    rows={3}
                    value={templateForm.body_text}
                    onChange={e => setTemplateForm({ ...templateForm, body_text: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                    Theme Color Accent
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { name: 'Royal Navy', hex: '#1e1b4b' },
                      { name: 'Emerald Laurel', hex: '#064e3b' },
                      { name: 'Crimson Honor', hex: '#881337' },
                      { name: 'Imperial Purple', hex: '#4c1d95' },
                      { name: 'Amber Gold', hex: '#78350f' },
                      { name: 'Slate Regal', hex: '#0f172a' },
                    ].map(c => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setTemplateForm({ ...templateForm, theme_color: c.hex })}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                          templateForm.theme_color === c.hex ? 'border-slate-900 bg-slate-900 text-white shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: c.hex }}></span>
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Left Signatory Title
                    </label>
                    <input
                      type="text"
                      value={templateForm.signatory_title_left}
                      onChange={e => setTemplateForm({ ...templateForm, signatory_title_left: e.target.value })}
                      placeholder="Faculty Advisor"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Right Signatory Title
                    </label>
                    <input
                      type="text"
                      value={templateForm.signatory_title_right}
                      onChange={e => setTemplateForm({ ...templateForm, signatory_title_right: e.target.value })}
                      placeholder="Society President"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Real-time Mini Preview Canvas */}
              <div className="space-y-2">
                <span className="block text-xs font-bold uppercase text-slate-700 flex items-center gap-1">
                  <Eye size={13} className="text-amber-500" /> Live Visual Specimen
                </span>
                <div 
                  className="rounded-2xl p-4 bg-white shadow-md relative flex flex-col justify-between text-center select-none min-h-[360px]"
                  style={{
                    border: `6px double ${templateForm.theme_color}`,
                    backgroundImage: 'radial-gradient(#e0e7ff 0.75px, transparent 0.75px), radial-gradient(#e0e7ff 0.75px, #ffffff 0.75px)',
                    backgroundSize: '20px 20px'
                  }}
                >
                  <div className="pt-2">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center mx-auto text-amber-300 shadow border"
                      style={{ backgroundColor: templateForm.theme_color }}
                    >
                      <Award size={22} />
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mt-1 block">
                      {templateForm.subtitle}
                    </span>
                    <h4 className="text-sm font-black uppercase tracking-wide text-slate-900 font-serif mt-0.5">
                      {templateForm.title}
                    </h4>
                  </div>

                  <div className="my-auto py-2 space-y-1">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Awarded to</p>
                    <h2 className="text-lg font-black text-slate-900 font-serif underline decoration-amber-500 decoration-1 underline-offset-4">
                      [ Student Full Name ]
                    </h2>
                    <p className="text-[10px] text-slate-600 max-w-xs mx-auto leading-relaxed pt-1">
                      {templateForm.body_text}
                    </p>
                    <p className="text-xs font-black" style={{ color: templateForm.theme_color }}>
                      {templateForm.event ? (events.find(e => e.id === Number(templateForm.event))?.title || 'Selected Event') : '[ Event Title ]'}
                    </p>
                    <p className="text-[10px] font-bold text-slate-600">
                      Organized by {society?.name || 'Departmental Society'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-200 grid grid-cols-2 text-left">
                    <div className="space-y-0.5">
                      <div className="font-serif italic text-xs text-slate-700 font-bold">[ Advisor Signature ]</div>
                      <div className="w-20 h-0.5 bg-slate-300"></div>
                      <span className="text-[9px] font-bold uppercase text-slate-500">{templateForm.signatory_title_left}</span>
                    </div>
                    <div className="space-y-0.5 text-right">
                      <div className="font-serif italic text-xs text-slate-700 font-bold">[ President Signature ]</div>
                      <div className="w-20 h-0.5 bg-slate-300 ml-auto"></div>
                      <span className="text-[9px] font-bold uppercase text-slate-500">{templateForm.signatory_title_right}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveTemplate(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => handleSaveTemplate(true)}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/30 transition cursor-pointer flex items-center gap-1.5"
              >
                <ShieldCheck size={14} /> Submit for Advisor Endorsement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CERTIFICATE TEMPLATE PREVIEW MODAL */}
      {previewTemplate && (() => {
        const previewTheme = getSocietyCertificateTheme(society?.id, society?.name);
        const primaryColor = previewTemplate.layout_json?.theme_color || previewTheme.primaryColor;
        return (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative">
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="flex items-center justify-between mb-4 pr-8">
                <div className="flex items-center gap-2">
                  <Award className="text-amber-500" size={22} />
                  <div>
                    <h3 className="text-base font-black text-slate-900">{previewTemplate.title}</h3>
                    <span className="text-xs text-slate-500 font-medium">Status: {previewTemplate.status} • {previewTemplate.event_title || 'Society Default'}</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full flex items-center gap-1.5 border border-slate-200">
                  <Sparkles size={13} className="text-amber-500" /> {previewTheme.name}
                </span>
              </div>

              <div 
                className="rounded-2xl p-6 bg-white shadow-sm relative text-center min-h-[340px] flex flex-col justify-between"
                style={{
                  border: previewTheme.outerBorder,
                  backgroundImage: previewTheme.bgPattern,
                  backgroundSize: previewTheme.bgPatternSize,
                  backgroundPosition: '0 0, 12px 12px'
                }}
              >
                {/* Theme Inner Border */}
                <div className="absolute inset-1.5 pointer-events-none" style={{ border: previewTheme.innerBorder }} />

                {/* Theme Corners */}
                {previewTheme.cornerRenderer && previewTheme.cornerRenderer()}

                {/* TWIN LOGO HEADER: IUB (LEFT) & SOCIETY LOGO (RIGHT) */}
                <div className="relative z-10 flex items-center justify-between px-2 pt-1">
                  {/* IUB Logo */}
                  <div className="flex items-center gap-2 text-left w-48 shrink-0">
                    <IUBLogoEmblem size={44} />
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase tracking-wider text-emerald-950 leading-tight">
                        The Islamia University
                      </span>
                      <span className="text-[8px] font-bold text-amber-700">
                        of Bahawalpur
                      </span>
                      <span className="text-[7.5px] font-medium text-slate-400">
                        Estd. 1925 • Main Campus
                      </span>
                    </div>
                  </div>

                  {/* Center Title */}
                  <div className="flex-1 px-2 text-center">
                    <span 
                      className="inline-block text-[8px] font-black uppercase tracking-[0.2em] px-2.5 py-0.5 rounded-full border mb-0.5 shadow-xs"
                      style={{ 
                        backgroundColor: `${primaryColor}12`, 
                        borderColor: `${previewTheme.accentColor}40`,
                        color: primaryColor 
                      }}
                    >
                      {society?.name || 'Departmental Society'}
                    </span>
                    <h4 className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">
                      {previewTemplate.layout_json?.subtitle || 'DSMS Campus Network'}
                    </h4>
                    <h2 
                      className="text-lg font-black uppercase font-serif leading-tight"
                      style={{ color: primaryColor }}
                    >
                      {previewTemplate.layout_json?.title || previewTemplate.title}
                    </h2>
                  </div>

                  {/* Society Logo */}
                  <div className="flex items-center justify-end gap-2 text-right w-48 shrink-0">
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] font-black uppercase text-slate-800 line-clamp-1 max-w-[110px]">
                        {society?.name || 'Society'}
                      </span>
                      <span className="text-[7.5px] font-bold uppercase tracking-wider" style={{ color: previewTheme.accentColor }}>
                        Official Seal
                      </span>
                      <span className="text-[7.5px] font-mono text-slate-400">
                        DSMS Verified
                      </span>
                    </div>
                    {society?.logo ? (
                      <div className="w-11 h-11 rounded-lg border border-slate-200 bg-white p-0.5 flex items-center justify-center shrink-0 shadow-xs">
                        <MediaImage src={society.logo} alt={society.name} className="w-full h-full object-contain rounded" />
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-lg border flex flex-col items-center justify-center shrink-0 text-white font-bold text-[8px]" style={{ backgroundColor: primaryColor, borderColor: previewTheme.accentColor }}>
                        <Award size={16} className="text-amber-300" />
                        <span className="text-[7px]">SOC</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative z-10 py-3 space-y-1">
                  <span className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">Awarded to</span>
                  <h3 
                    className="text-2xl font-black font-serif underline decoration-2 underline-offset-4"
                    style={{ 
                      color: '#0f172a',
                      textDecorationColor: previewTheme.secondaryColor || '#d97706' 
                    }}
                  >
                    [ Student Full Name ]
                  </h3>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto pt-1 font-medium leading-relaxed">
                    {previewTemplate.layout_json?.body_text || 'has actively participated in, completed all practical evaluation requirements, and demonstrated distinction in'}
                  </p>
                  <h4 className="text-sm font-black pt-1" style={{ color: primaryColor }}>
                    {previewTemplate.event_title || '[ Event Title ]'}
                  </h4>
                </div>

                {/* Signatories: Strictly Advisor and President (No DSA) */}
                <div className="relative z-10 pt-2 border-t border-slate-200/80 grid grid-cols-2 text-left text-xs font-bold text-slate-600 px-2">
                  <div>
                    <div className="w-28 h-0.5 bg-slate-300 mb-1"></div>
                    <span className="text-[10px] uppercase tracking-wider">{previewTemplate.layout_json?.signatory_title_left || 'Faculty Advisor'}</span>
                  </div>
                  <div className="text-right">
                    <div className="w-28 h-0.5 bg-slate-300 ml-auto mb-1"></div>
                    <span className="text-[10px] uppercase tracking-wider">{previewTemplate.layout_json?.signatory_title_right || 'Society President'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setPreviewTemplate(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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

export default PresidentDashboard;
