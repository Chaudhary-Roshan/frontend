import { MediaImage } from '../components/common/AuthenticatedMedia';
import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { 
  Calendar, MapPin, Search, Filter, Tag, CheckCircle2, 
  Clock, Users, Sparkles, ArrowRight, X, Ticket, Share2, 
  CreditCard, QrCode as QrIcon, AlertCircle, Building, Check,
  ChevronDown, ChevronUp, Upload, Image as ImageIcon, ShieldCheck,
  CheckCircle as CheckCircleIcon, Trash2, Loader2, GraduationCap, Lock
} from 'lucide-react';
import api from '../utils/api';
import { getMediaUrl, handleImageError } from '../utils/media';
import { Link, useSearchParams } from 'react-router-dom';
import { uploadFileToServer } from '../utils/fileUpload';
import StudentPaymentCheckout from '../components/ticketing/StudentPaymentCheckout';
import { checkEventEligibility } from '../utils/academicCatalog';

const Events = () => {
  const { user } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState(() => {
    try {
      const cached = sessionStorage.getItem('dsms_cached_events');
      return cached ? JSON.parse(cached) : [];
    } catch (e) { return []; }
  });
  const [societies, setSocieties] = useState(() => {
    try {
      const cached = sessionStorage.getItem('dsms_cached_societies');
      return cached ? JSON.parse(cached) : [];
    } catch (e) { return []; }
  });
  const [loading, setLoading] = useState(() => {
    try {
      return !sessionStorage.getItem('dsms_cached_events');
    } catch (e) { return true; }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [societyFilter, setSocietyFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [registeredEventIds, setRegisteredEventIds] = useState(new Set());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // Paid event registration form state
  const [paymentProof, setPaymentProof] = useState(null);
  const [transactionId, setTransactionId] = useState('');
  const [receiptDetails, setReceiptDetails] = useState('');
  const [receiptFile, setReceiptFile] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [showProfileDetails, setShowProfileDetails] = useState(true);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paidSubmitted, setPaidSubmitted] = useState(false);
  const [deleteEventTarget, setDeleteEventTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isFetchingEventsRef = useRef(false);

  useEffect(() => {
    fetchEventsData();

    const handleSync = () => {
      fetchEventsData();
    };

    window.addEventListener('dsms:data_synced', handleSync);
    return () => {
      window.removeEventListener('dsms:data_synced', handleSync);
    };
  }, []);

  const fetchEventsData = async () => {
    if (isFetchingEventsRef.current) return;
    isFetchingEventsRef.current = true;
    try {
      const [evRes, socRes, regRes] = await Promise.allSettled([
        api.get('events/'),
        api.get('societies/'),
        user ? api.get('registrations/') : Promise.resolve({ data: [] })
      ]);

      if (evRes.status === 'fulfilled') {
        setEvents(evRes.value.data);
        try { sessionStorage.setItem('dsms_cached_events', JSON.stringify(evRes.value.data)); } catch (e) {}
        const eventIdParam = searchParams.get('event');
        if (eventIdParam) {
          const matched = evRes.value.data.find(e => String(e.id) === String(eventIdParam));
          if (matched) {
            openRegistrationModal(matched);
          }
        }
      }
      if (socRes.status === 'fulfilled') {
        setSocieties(socRes.value.data);
        try { sessionStorage.setItem('dsms_cached_societies', JSON.stringify(socRes.value.data)); } catch (e) {}
      }
      if (regRes.status === 'fulfilled') {
        const ids = new Set(regRes.value.data.map(r => r.event));
        setRegisteredEventIds(ids);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      isFetchingEventsRef.current = false;
    }
  };

  const handleFreeRegister = async (eventId) => {
    const targetEvt = events.find(e => e.id === eventId);
    if (targetEvt && (targetEvt.is_expired || (targetEvt.date && new Date(targetEvt.date) < new Date()))) {
      alert("This event has already concluded. Registrations are closed.");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('registrations/', { event: eventId });
      setRegisteredEventIds(prev => new Set([...prev, eventId]));
      setRegisterSuccess(true);
      setTimeout(() => {
        setRegisterSuccess(false);
        setSelectedEvent(null);
      }, 3000);
    } catch (err) {
      alert(err.response?.data?.error || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReceiptUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingReceipt(true);
    try {
      const url = await uploadFileToServer(file, 'receipts');
      setReceiptFile(url);
    } catch (err) {
      console.error("Receipt upload failed:", err);
      alert("Failed to upload receipt image. Please verify file format.");
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  const canDeleteEvent = (evt) => {
    if (!user || !evt) return false;
    if (user.role === 'admin' || user.is_superuser || user.is_staff) return true;
    const sId = Number(typeof evt.society === 'object' ? evt.society?.id : evt.society);
    if (user.role === 'president') {
      return (
        (user.society_id && Number(user.society_id) === sId) ||
        (user.society && Number(typeof user.society === 'object' ? user.society.id : user.society) === sId) ||
        (user.presided_society_ids && user.presided_society_ids.includes(sId))
      );
    }
    if (user.role === 'faculty') {
      return (
        (user.society_id && Number(user.society_id) === sId) ||
        (user.society && Number(typeof user.society === 'object' ? user.society.id : user.society) === sId) ||
        (user.advised_society_ids && user.advised_society_ids.includes(sId))
      );
    }
    return false;
  };

  const handleDeleteEvent = async () => {
    if (!deleteEventTarget) return;
    try {
      setIsDeleting(true);
      await api.delete(`events/${deleteEventTarget.id}/`);
      setEvents(prev => prev.filter(e => e.id !== deleteEventTarget.id));
      setDeleteEventTarget(null);
    } catch (err) {
      console.error("Delete event failed:", err);
      alert(err.response?.data?.error || err.response?.data?.detail || "Failed to delete event.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePublishEvent = async (eventId, eventTitle) => {
    try {
      await api.post(`events/${eventId}/publish/`);
      setEvents(prev => prev.map(ev => ev.id === eventId ? { ...ev, is_published: true, status: 'approved' } : ev));
      alert(`Event "${eventTitle}" is now published and live on the Student Portal! 🚀`);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to publish event.");
    }
  };

  const handlePaidRegister = async (e) => {
    e.preventDefault();
    if (!transactionId.trim()) {
      alert("Please enter your transaction reference ID after completing payment.");
      return;
    }
    setIsSubmitting(true);
    try {
      const compositeDetails = `Amount: PKR ${paidAmount || selectedEvent.price}${receiptDetails ? ` | ${receiptDetails}` : ''}`.trim();
      await api.post('registrations/', {
        event: selectedEvent.id,
        transaction_id: transactionId.trim(),
        receipt_details: compositeDetails,
        receipt_file: receiptFile
      });
      setRegisteredEventIds(prev => new Set([...prev, selectedEvent.id]));
      setPaidSubmitted(true);
      setTransactionId('');
      setReceiptDetails('');
      setReceiptFile('');
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.detail || 'Payment registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setSelectedEvent(null);
    setPaymentProof(null);
    setPaidSubmitted(false);
    setRegisterSuccess(false);
    setTransactionId('');
    setReceiptDetails('');
    setReceiptFile('');
  };

  const handleStudentRegistration = async (e) => {
    if (e) e.preventDefault();
    if (!selectedEvent) return;

    if (!user) {
      alert("Please sign in as a student to register for events.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedEvent.is_paid) {
        const formData = new FormData();
        formData.append('event', selectedEvent.id);
        if (paymentProof) {
          formData.append('payment_proof', paymentProof);
          formData.append('receipt_file', paymentProof);
        }
        formData.append('transaction_id', transactionId?.trim() || `TXN-${Date.now().toString().slice(-8)}`);
        if (receiptDetails) {
          formData.append('receipt_details', receiptDetails.trim());
        }

        await api.post('registrations/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('registrations/', { event: selectedEvent.id });
      }

      setRegisteredEventIds(prev => new Set([...prev, selectedEvent.id]));
      setRegisterSuccess(true);
      setTimeout(() => {
        setRegisterSuccess(false);
        closeModal();
      }, 3000);
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.detail || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRegistrationModal = (evt) => {
    setSelectedEvent(evt);
    setPaidAmount(evt.price || '');
    setPaidSubmitted(false);
    setRegisterSuccess(false);
    setTransactionId('');
    setReceiptDetails('');
    setReceiptFile('');
    setPaymentProof(null);
    setShowProfileDetails(true);
  };

  // Find society for selected event to display real bank details
  const selectedSocietyObj = selectedEvent 
    ? societies.find(s => s.id === selectedEvent.society) 
    : null;

  const event = selectedEvent ? {
    ...selectedEvent,
    ticket_price: selectedEvent.ticket_price ?? selectedEvent.price ?? selectedEvent.entry_fee ?? 0
  } : null;

  const society = selectedSocietyObj ? {
    ...selectedSocietyObj,
    payment_qr_url: selectedEvent?.effective_payment_qr || selectedEvent?.payment_qr || selectedSocietyObj.payment_qr_url || selectedSocietyObj.payment_qr || '',
    bank_name: selectedSocietyObj.bank_name || 'Campus Trust Bank',
    account_title: selectedSocietyObj.account_title || selectedSocietyObj.bank_account_title || `${selectedSocietyObj.name || 'Society'} Event Fund`,
    account_iban: selectedSocietyObj.account_iban || selectedSocietyObj.bank_account_number || 'PK82UNIV000192837465'
  } : {
    payment_qr_url: selectedEvent?.effective_payment_qr || selectedEvent?.payment_qr || '',
    bank_name: 'Campus Trust Bank',
    account_title: `${selectedEvent?.society_name || 'Society'} Event Fund`,
    account_iban: 'PK82UNIV000192837465'
  };

  // Filter pipeline
  const filteredEvents = events.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (e.society_name && e.society_name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;

    if (societyFilter !== 'all' && e.society !== parseInt(societyFilter)) return false;
    if (priceFilter === 'free' && e.is_paid) return false;
    if (priceFilter === 'paid' && !e.is_paid) return false;
    if (categoryFilter === 'workshops' && !e.title.toLowerCase().includes('workshop')) return false;
    if (categoryFilter === 'competitions' && !(e.title.toLowerCase().includes('hackathon') || e.title.toLowerCase().includes('competition'))) return false;

    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              Campus Events & Workshops
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-2">
              University Events Hub
            </h1>
            <p className="text-slate-500 text-sm mt-1 max-w-xl font-medium">
              Discover official student workshops, technical hackathons, guest seminars, and cultural festivals.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/calendar"
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition"
            >
              <Calendar size={16} /> Open Interactive Calendar
            </Link>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search events, workshops, keywords, or societies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <select
                value={societyFilter}
                onChange={(e) => setSocietyFilter(e.target.value)}
                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none"
              >
                <option value="all">All Societies</option>
                {societies.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none"
              >
                <option value="all">All Admission Types</option>
                <option value="free">Free Events Only</option>
                <option value="paid">Paid Events Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* LEADERSHIP VISIBILITY CONTEXT BANNER */}
        {user && ['faculty', 'president', 'admin'].includes(user.role) && (
          <div className="bg-indigo-50/80 border border-indigo-200 p-4 rounded-2xl flex items-center justify-between text-xs text-indigo-900">
            <div className="flex items-center gap-2.5">
              <Sparkles size={16} className="text-indigo-600 shrink-0" />
              <span>
                <strong>Leadership & Faculty Feed View:</strong> You can see all events for your society across lifecycle stages (Draft, Pending Approval, and Approved). Events marked <span className="bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded border border-yellow-300 font-bold">Hidden from Students</span> will become live on the Student Portal once advertised.
              </span>
            </div>
          </div>
        )}

        {/* EVENTS GRID */}
        {loading ? (
          <div className="p-16 text-center">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 text-slate-400 text-sm space-y-2">
            <p className="font-bold text-slate-700">No events match your search criteria.</p>
            <p className="text-xs text-slate-400">
              {user?.role === 'student'
                ? 'Only approved and advertised events are live on the student feed. New events will appear as soon as societies publish them.'
                : 'No events match your current filter selection.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map(evt => {
              const isRegistered = registeredEventIds.has(evt.id);
              const isEventExpired = Boolean(evt.is_expired || (evt.date && new Date(evt.date) < new Date()));
              return (
                <div 
                  key={evt.id} 
                  className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between group"
                >
                  {/* Replace the static crowd image with the dynamic URL */}
                  <div className="w-full aspect-[16/9] sm:aspect-[2/1] md:aspect-[16/9] bg-gray-200 relative overflow-hidden">
                    <MediaImage 
                      src={evt.poster_image_url || evt.image || '/default-placeholder.jpg'} 
                      alt={evt.title} 
                      className="w-full h-full object-cover object-center rounded-t-xl group-hover:scale-105 transition duration-300"
                      onError={(e) => {
                        e.target.src = '/default-placeholder.jpg';
                      }}
                    />
                    {/* The Society Badge and Free Entry pill sit on top of this */}
                    <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded flex items-center gap-2">
                      {evt.society_logo ? (
                        <MediaImage
                          src={getMediaUrl(evt.society_logo)}
                          onError={handleImageError}
                          className="w-4 h-4 rounded-full object-cover"
                          alt=""
                        />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[8px]">
                          {(evt.society_name || 'S').substring(0, 1)}
                        </div>
                      )}
                      <span>{evt.society_name}</span>
                    </div>
                    <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
                      {isEventExpired && (
                        <span className="bg-rose-600/95 backdrop-blur-xs text-white text-[9px] font-black px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1 uppercase tracking-wider">
                          <AlertCircle size={10} />
                          Concluded
                        </span>
                      )}
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full shadow-md ${
                        evt.is_paid ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
                      }`}>
                        {evt.is_paid ? (
                          (evt.has_discount || (evt.discount_price && Number(evt.discount_price) > 0 && Number(evt.discount_price) < Number(evt.price)))
                            ? `PKR ${evt.discount_price}`
                            : `PKR ${evt.price}`
                        ) : 'Free Entry'}
                      </span>
                      {evt.is_paid && (evt.has_discount || (evt.discount_price && Number(evt.discount_price) > 0 && Number(evt.discount_price) < Number(evt.price))) && (
                        <span className="bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-md">
                          {evt.discount_percentage ? `-${evt.discount_percentage}% OFF` : 'Discounted'}
                        </span>
                      )}
                      {evt.discount_note && (
                        <span className="bg-amber-600/90 backdrop-blur-xs text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-md">
                          {evt.discount_note}
                        </span>
                      )}
                      {Array.isArray(evt.gallery_images) && evt.gallery_images.length > 0 && (
                        <span className="bg-black/80 backdrop-blur-sm text-white text-[10px] font-black px-2.5 py-0.5 rounded-full border border-white/20 shadow-md">
                          📷 {1 + evt.gallery_images.length} Photos
                        </span>
                      )}

                      {/* Academic Eligibility Badge */}
                      {evt.eligibility_type === 'restricted' ? (
                        <span className="bg-amber-600/95 backdrop-blur-xs text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                          <GraduationCap size={11} />
                          <span>Dept Exclusive</span>
                        </span>
                      ) : (
                        <span className="bg-slate-900/80 backdrop-blur-xs text-indigo-200 text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                          <span>🌐 Open to All</span>
                        </span>
                      )}

                      {/* NEW: Visibility Indicator for Admin/Faculty roles */}
                      {user && user.role !== 'student' && (
                        <div className="flex flex-col gap-1 items-end">
                          {!evt.is_published ? (
                            <span className="bg-yellow-100/95 backdrop-blur-xs text-yellow-800 text-[10px] font-bold px-2 py-0.5 rounded border border-yellow-300 shadow-xs">
                              Hidden from Students
                            </span>
                          ) : (
                            <span className="bg-green-100/95 backdrop-blur-xs text-green-800 text-[10px] font-bold px-2 py-0.5 rounded border border-green-300 shadow-xs">
                              Live on Student Portal
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-black text-slate-900 text-lg group-hover:text-indigo-600 transition">{evt.title}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-3 leading-relaxed">{evt.description}</p>

                      <div className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-600 font-semibold">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-indigo-600" />
                          <span>{new Date(evt.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        </div>
                        {evt.eligibility_type === 'restricted' && Array.isArray(evt.allowed_programs) && evt.allowed_programs.length > 0 && (
                          <div className="flex items-center gap-2 text-amber-700 text-[11px] pt-1">
                            <GraduationCap size={14} className="shrink-0 text-amber-600" />
                            <span className="truncate">{evt.allowed_programs.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                    <Link
                      to={`/events/${evt.id}`}
                      className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      Details & Info →
                    </Link>

                    <div className="flex items-center gap-2">
                      {user && ['faculty', 'president', 'admin'].includes(user.role) && !evt.is_published && evt.status === 'approved' && (
                        <button
                          onClick={() => handlePublishEvent(evt.id, evt.title)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold shadow-xs transition cursor-pointer"
                          title="Advertise and make live for all students"
                        >
                          Advertise Event 🚀
                        </button>
                      )}

                      {(() => {
                        if (isEventExpired) {
                          return (
                            <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-1 shadow-xs cursor-default">
                              <Lock size={12} className="text-slate-400" />
                              {isRegistered ? 'Registered (Concluded)' : 'Concluded'}
                            </span>
                          );
                        }
                        const evtEligibility = checkEventEligibility(user, evt);
                        if (!user) {
                          return (
                            <Link
                              to="/login"
                              state={{ from: `/events?event=${evt.id}` }}
                              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
                            >
                              Sign In to Register
                            </Link>
                          );
                        }
                        if (user.role === 'student' && !evtEligibility.eligible) {
                          return (
                            <button
                              onClick={() => openRegistrationModal(evt)}
                              className="px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 cursor-pointer shadow-xs"
                              title={evtEligibility.reason}
                            >
                              <Lock size={13} className="text-amber-600" />
                              <span>Restricted</span>
                            </button>
                          );
                        }
                        return (
                          <button
                            onClick={() => openRegistrationModal(evt)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                              isRegistered
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
                            }`}
                          >
                            {isRegistered ? (
                              <>
                                <CheckCircle2 size={14} /> Registered
                              </>
                            ) : (
                              'Register'
                            )}
                          </button>
                        );
                      })()}

                      {canDeleteEvent(evt) && (
                        <button
                          type="button"
                          onClick={() => setDeleteEventTarget(evt)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Delete Event"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}

      </div>

      {selectedEvent && (() => {
        const event = selectedEvent;
        const society = societies.find(s => s.id === event.society || s.name === event.society_name) || {};
        const modalEligibility = checkEventEligibility(user, event);
        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            {/* Inside the Student Registration Modal */}
            <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={closeModal}
                className="absolute top-5 right-5 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition z-10"
                title="Close"
              >
                <X size={20} />
              </button>

              <div className="p-6 bg-blue-600 text-white">
                <h2 className="text-2xl font-bold">Event Registration</h2>
                <p className="text-blue-100 text-sm mt-1">{event.title}</p>
              </div>

            {Boolean(event.is_expired || (event.date && new Date(event.date) < new Date())) ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200 shadow-sm">
                  <Lock size={26} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-800 bg-rose-100 px-3 py-1 rounded-full border border-rose-300">
                    Event Concluded
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-2">Registrations Closed</h3>
                  <p className="text-xs text-slate-600 max-w-md mx-auto mt-2 leading-relaxed">
                    This event has already taken place. New ticket bookings, payment processing, and entrance check-in lanes are permanently closed.
                  </p>
                </div>
                <div className="flex justify-center gap-3 pt-2">
                  {registeredEventIds.has(event.id) ? (
                    <Link
                      to="/student-dashboard"
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition"
                    >
                      View Concluded Ticket & Certificate
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition"
                    >
                      Close
                    </button>
                  )}
                </div>
              </div>
            ) : registerSuccess ? (
              <div className="p-6 space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3">
                  <CheckCircleIcon className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <h3 className="font-bold">
                      {event.is_paid ? 'Registration & Payment Submitted!' : 'Registration Confirmed!'}
                    </h3>
                    <p className="text-sm">
                      {event.is_paid
                        ? 'Your payment receipt has been submitted for review. Check My Profile for verification status.'
                        : 'Your ticket is confirmed! You can access your QR ticket in My Profile.'}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Link
                    to="/student-dashboard"
                    className="px-6 py-2 rounded-lg bg-blue-600 font-bold text-white hover:bg-blue-700 shadow-md text-sm"
                  >
                    View My Tickets
                  </Link>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-2 rounded-lg bg-gray-100 font-bold text-gray-700 hover:bg-gray-200 text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : registeredEventIds.has(event.id) ? (
              <div className="p-6 space-y-4">
                <div className="bg-blue-50 border border-blue-100 text-blue-900 p-4 rounded-xl flex items-center gap-3">
                  <CheckCircleIcon className="w-6 h-6 text-blue-600 shrink-0" />
                  <div>
                    <h3 className="font-bold">Already Registered</h3>
                    <p className="text-sm">You are already registered for this event. View your ticket or status in your student dashboard.</p>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Link
                    to="/student-dashboard"
                    className="px-6 py-2 rounded-lg bg-blue-600 font-bold text-white hover:bg-blue-700 shadow-md text-sm"
                  >
                    View Ticket in My Profile
                  </Link>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-2 rounded-lg bg-gray-100 font-bold text-gray-700 hover:bg-gray-200 text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : !user ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                  <Ticket size={28} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Student Sign-In Required</h3>
                  <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
                    Please log in with your university student account to register for {event.title} and generate your entry ticket.
                  </p>
                </div>
                <div className="flex justify-center gap-3 pt-2">
                  <Link
                    to="/login"
                    state={{ from: `/events?event=${event.id}` }}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md transition"
                  >
                    Sign In to Register
                  </Link>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : user.role !== 'student' ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
                  <AlertCircle size={28} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Student Account Only</h3>
                  <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
                    Event registration is reserved for student attendees. Executive faculty and presidents can review attendance from their management consoles.
                  </p>
                </div>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (user.role === 'student' && !modalEligibility.eligible) ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                  <GraduationCap size={30} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
                    Academic Scope Restriction
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-2">Registration Ineligible</h3>
                  <p className="text-xs text-slate-600 max-w-md mx-auto mt-2 leading-relaxed">
                    This event is restricted exclusively to students enrolled in:
                  </p>
                  <div className="mt-2 font-black text-indigo-950 text-xs bg-indigo-50/70 p-2.5 rounded-xl border border-indigo-100 max-w-md mx-auto">
                    {Array.isArray(event.allowed_programs) && event.allowed_programs.length > 0 
                      ? event.allowed_programs.join(', ')
                      : (event.allowed_departments?.join(', ') || 'Restricted Programs')}
                  </div>
                  <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl max-w-sm mx-auto text-left text-xs space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Your Current Profile:</div>
                    <div className="text-slate-700 font-semibold flex items-center justify-between">
                      <span>Department:</span>
                      <span className="font-bold text-slate-900">{user.department || 'Not Provided'}</span>
                    </div>
                    <div className="text-slate-700 font-semibold flex items-center justify-between">
                      <span>Program:</span>
                      <span className="font-bold text-slate-900">{user.program || 'Not Provided'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center gap-3 pt-2">
                  {modalEligibility.missingProfile && (
                    <Link
                      to="/profile"
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md"
                    >
                      Update Student Profile
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : event.is_paid ? (
              <StudentPaymentCheckout 
                event={event} 
                society={society} 
                closeModal={() => {
                  fetchEventsData();
                  closeModal();
                }} 
              />
            ) : (
              <form onSubmit={handleStudentRegistration} className="p-6 space-y-6">
                <div className="bg-green-50 border border-green-100 text-green-800 p-4 rounded-xl flex items-center gap-3">
                  <CheckCircleIcon className="w-6 h-6 text-green-600 shrink-0" />
                  <div>
                    <h3 className="font-bold">Free Event</h3>
                    <p className="text-sm">No payment is required to register for this event.</p>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={closeModal} className="px-6 py-2 rounded-lg bg-gray-100 font-bold text-gray-700 hover:bg-gray-200 text-sm">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="px-6 py-2 rounded-lg bg-blue-600 font-bold text-white hover:bg-blue-700 shadow-md text-sm disabled:opacity-50">
                    Confirm Registration
                  </button>
                </div>
              </form>
            )}
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
            This will release scheduled date reservations and remove all associated attendee passes. This action cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => setDeleteEventTarget(null)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleDeleteEvent}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? (
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

    </div>
  );
};

export default Events;
