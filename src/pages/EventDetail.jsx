import { MediaImage } from '../components/common/AuthenticatedMedia';
import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  Calendar, MapPin, Users, ArrowLeft, CheckCircle2, 
  Upload, QrCode as QrIcon, ShieldCheck, AlertCircle, Share2, Ticket,
  Image as ImageIcon, Sparkles, Edit3, Tag, Download, Maximize2, ExternalLink, X,
  Trash2, Loader2, GraduationCap, Lock
} from 'lucide-react';
import api from '../utils/api';
import { getMediaUrl, handleImageError } from '../utils/media';
import QRCode from 'react-qr-code';
import { uploadFileToServer } from '../utils/fileUpload';
import EditAdvertisementModal from '../components/modals/EditAdvertisementModal';
import PaymentQrModal from '../components/modals/PaymentQrModal';
import { checkEventEligibility } from '../utils/academicCatalog';

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);

  // Paid event state
  const [showPaidForm, setShowPaidForm] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [receiptDetails, setReceiptDetails] = useState('');
  const [receiptFile, setReceiptFile] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [paidSubmitted, setPaidSubmitted] = useState(false);

  const normalizeEvent = (evData) => {
    if (!evData) return null;
    return {
      ...evData,
      poster_image_url: evData.poster_image_url || evData.image || '/default-placeholder.jpg',
      entry_fee: evData.entry_fee ?? (evData.is_paid ? (evData.discount_price && Number(evData.discount_price) > 0 ? parseFloat(evData.discount_price) : parseFloat(evData.price)) : 0),
      date_time: evData.date_time || (evData.date ? new Date(evData.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'TBD'),
      venue: (typeof evData.venue === 'object' && evData.venue?.name) ? evData.venue.name : (evData.venue_name || (typeof evData.venue === 'string' ? evData.venue : 'Campus Main Auditorium')),
      speakers: Array.isArray(evData.speakers) && evData.speakers.length > 0
        ? evData.speakers
        : (evData.chief_guest ? [evData.chief_guest] : ['Distinguished Keynote Speakers']),
      detailed_description: evData.detailed_description || evData.description || 'No detailed description provided for this event.',
      gallery_images: Array.isArray(evData.gallery_images) ? evData.gallery_images : []
    };
  };

  useEffect(() => {
    fetchEventDetails();

    const handleSync = (e) => {
      const targetId = e?.detail?.id || e?.detail?.event?.id;
      if (targetId && String(targetId) !== String(id)) return;
      fetchEventDetails(true);
    };

    const handleEventUpdated = (e) => {
      const updated = e?.detail;
      if (updated && String(updated.id) === String(id)) {
        const norm = normalizeEvent(updated);
        setEvent(norm);
        setPaidAmount(String(norm.entry_fee || updated.price || ''));
      }
      fetchEventDetails(true);
    };

    const handleStorage = (e) => {
      if (!e.key || e.key.includes('sync') || e.key.includes('event')) {
        fetchEventDetails(true);
      }
    };

    window.addEventListener('dsms:data_synced', handleSync);
    window.addEventListener('dsms:event_updated', handleEventUpdated);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('dsms:data_synced', handleSync);
      window.removeEventListener('dsms:event_updated', handleEventUpdated);
      window.removeEventListener('storage', handleStorage);
    };
  }, [id, user]);

  // Lightbox escape key and scroll lock
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setLightboxImage(null);
    };
    if (lightboxImage) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [lightboxImage]);

  const fetchEventDetails = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const [evRes, regRes] = await Promise.allSettled([
        api.get(`events/${id}/`, { headers: { 'Cache-Control': 'no-cache' } }),
        user ? api.get('registrations/') : Promise.resolve({ data: [] })
      ]);

      if (evRes.status === 'fulfilled') {
        const evData = evRes.value.data;
        const normalized = normalizeEvent(evData);
        setEvent(normalized);
        setPaidAmount(String(normalized.entry_fee || evData.price || ''));
      } else {
        if (!isBackground) setErrorMsg("Failed to load event details. The event may not exist or is pending review.");
      }

      if (regRes.status === 'fulfilled') {
        const matchingReg = regRes.value.data.find(r => String(r.event) === String(id));
        if (matchingReg) {
          setIsRegistered(true);
        }
      }
    } catch (err) {
      console.error(err);
      if (!isBackground) setErrorMsg("Error loading event.");
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    try {
      setIsDeleting(true);
      await api.delete(`events/${event.id}/`);
      navigate('/events', { replace: true });
    } catch (err) {
      console.error("Delete event failed:", err);
      alert(err.response?.data?.error || err.response?.data?.detail || "Failed to delete this event. Please try again.");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };


  const isEventExpired = Boolean(event?.is_expired || (event?.date && new Date(event.date) < new Date()));

  const handleFreeRegister = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (isEventExpired) {
      alert("This event has already concluded. Registrations are closed.");
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await api.post('registrations/', { event: event.id });
      setIsRegistered(true);
      setRegisterSuccess(true);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Registration failed. Please try again.');
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
      alert("Failed to upload receipt image.");
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  const handlePaidSubmit = async (e) => {
    e.preventDefault();
    if (isEventExpired) {
      alert("This event has already concluded. Registrations are closed.");
      return;
    }
    if (!receiptFile && !transactionId) {
      alert("Please provide at least a Transaction ID or upload a Payment Receipt proof.");
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await api.post('registrations/', {
        event: event.id,
        transaction_id: transactionId,
        receipt_file: receiptFile,
        paid_amount: paidAmount || event.entry_fee || event.price,
        receipt_details: receiptDetails
      });
      setIsRegistered(true);
      setPaidSubmitted(true);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Failed to submit paid registration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // High-Resolution Direct Download Helper
  const handleDownloadImage = async (imgUrl, defaultName = 'event-flyer.jpg') => {
    try {
      const resolved = getMediaUrl(imgUrl);
      const res = await fetch(resolved, { mode: 'cors' });
      if (!res.ok) throw new Error('Fetch failed');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = defaultName.replace(/[^a-zA-Z0-9._-]/g, '_');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
    } catch {
      // Safe fallback for cross-origin or direct downloads
      const link = document.createElement('a');
      link.href = getMediaUrl(imgUrl);
      link.download = defaultName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Determine permissions: Only President that owns this event's society, Faculty advisor, or Super Admin
  const canEditAdvertisement = Boolean(
    user && event && (
      user.role === 'admin' ||
      user.is_superuser ||
      user.is_staff ||
      (user.role === 'president' && (
        (user.presided_society_ids && (user.presided_society_ids.includes(event.society) || user.presided_society_ids.includes(event.society?.id))) ||
        (user.society && (Number(user.society) === Number(event.society) || Number(user.society) === Number(event.society?.id))) ||
        (user.society_id && (Number(user.society_id) === Number(event.society) || Number(user.society_id) === Number(event.society?.id))) ||
        (user.society_name && event.society_name && user.society_name.trim().toLowerCase() === event.society_name.trim().toLowerCase())
      )) ||
      (user.role === 'faculty' && (
        (user.advised_society_ids && (user.advised_society_ids.includes(event.society) || user.advised_society_ids.includes(event.society?.id))) ||
        (user.society && (Number(user.society) === Number(event.society) || Number(user.society) === Number(event.society?.id))) ||
        (user.society_id && (Number(user.society_id) === Number(event.society) || Number(user.society_id) === Number(event.society?.id))) ||
        (user.society_name && event.society_name && user.society_name.trim().toLowerCase() === event.society_name.trim().toLowerCase())
      ))
    )
  );

  // Cover image and additional images (second picture and beyond)
  const coverImage = (event?.poster_image_url || event?.image) 
    ? getMediaUrl(event.poster_image_url || event.image) 
    : '/default-placeholder.jpg';

  const additionalImages = React.useMemo(() => {
    if (!event || !Array.isArray(event.gallery_images)) return [];
    return event.gallery_images
      .filter(Boolean)
      .map(img => getMediaUrl(img))
      .filter(img => img !== coverImage);
  }, [event, coverImage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-2xl mx-auto p-8 my-12 bg-white rounded-2xl shadow-lg text-center">
        <AlertCircle size={40} className="text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800">Event Not Found</h2>
        <p className="text-xs text-slate-500 mt-2">{errorMsg || "This event could not be located."}</p>
        <Link to="/events" className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">
          ← Back to Events
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      
      {/* Top Navigation */}
      <div className="max-w-6xl mx-auto mb-4 flex items-center justify-between">
        <Link 
          to="/events" 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
        >
          <ArrowLeft size={16} /> Back to Events Directory
        </Link>
        {canEditAdvertisement && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowEditModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 transition cursor-pointer"
            >
              <Edit3 size={14} /> Edit Live Advertisement
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
              title="Permanently Delete Event"
            >
              <Trash2 size={14} /> Delete Event
            </button>
          </div>
        )}
      </div>

      {/* ORGANIZER EDIT BANNER (Visible only to Society President that owns the event, Faculty advisor, or Super Admin) */}
      {canEditAdvertisement && (
        <div className="max-w-6xl mx-auto mb-5 p-4 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-2xl shadow-lg text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-indigo-500/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/30 shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-white">Event Organizer Portal</span>
                <span className="text-[10px] bg-purple-400/25 text-purple-200 px-2 py-0.5 rounded-full border border-purple-400/30 uppercase font-black">
                  {user.role === 'president' ? 'Society President' : user.role === 'faculty' ? 'Faculty Advisor' : 'Super Admin'}
                </span>
                {!event.is_published && (
                  <span className="text-[10px] bg-amber-500/30 text-amber-200 px-2 py-0.5 rounded-full border border-amber-400/30 font-bold">
                    Draft / Hidden
                  </span>
                )}
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                You have host permissions to update this event's prices, discounts, schedule, cover poster, and attached flyers in real time.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowEditModal(true)}
              className="px-5 py-2.5 bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Edit3 size={14} /> Edit Advertisement 🚀
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2.5 bg-rose-600/90 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
              title="Delete Event"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="max-w-6xl mx-auto mb-4 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Event Details Layout */}
      <div className="max-w-6xl mx-auto p-6 sm:p-8 bg-white rounded-3xl shadow-lg border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          
          {/* Left Column: Full Cover Poster Image & Attached Pictures (Auto-adjusting size + open + download) */}
          <div className="w-full flex flex-col gap-6">
            
            {/* 1. Main Cover Picture */}
            <div className="w-full rounded-2xl overflow-hidden shadow-md border border-slate-200 bg-white flex flex-col group transition hover:shadow-lg">
              <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-200">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-md bg-indigo-500/20 text-indigo-400">
                    <ImageIcon size={14} />
                  </span>
                  <span className="font-bold text-white text-xs">Official Cover Poster</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setLightboxImage({ url: coverImage, title: `${event.title} - Cover Poster` })}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                    title="Open full-resolution image"
                  >
                    <Maximize2 size={12} />
                    <span>Open</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadImage(coverImage, `${event.title}-cover-poster.jpg`)}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center gap-1 text-[11px] font-bold cursor-pointer shadow-xs"
                    title="Download high-resolution image"
                  >
                    <Download size={12} />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              {/* Natural auto-adjusting image container */}
              <div 
                onClick={() => setLightboxImage({ url: coverImage, title: `${event.title} - Cover Poster` })}
                className="w-full cursor-zoom-in bg-slate-50 flex items-center justify-center overflow-hidden"
              >
                <MediaImage 
                  src={coverImage} 
                  alt={event.title} 
                  className="w-full h-auto block object-contain transition-transform duration-300 group-hover:scale-[1.01]"
                  onError={(e) => {
                    e.target.src = '/default-placeholder.jpg';
                  }}
                />
              </div>
            </div>

            {/* 2. Attached Pictures (Second picture and beyond - Auto-adjusting size + Open + Downloadable) */}
            {additionalImages.length > 0 && (
              <div className="w-full space-y-6">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon size={14} className="text-indigo-600" /> Attached Flyers & Materials ({additionalImages.length})
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    Auto-Fit • Click to Expand
                  </span>
                </div>

                {additionalImages.map((img, idx) => (
                  <div 
                    key={idx}
                    className="w-full rounded-2xl overflow-hidden shadow-md border border-slate-200 bg-white flex flex-col group transition hover:shadow-lg"
                  >
                    {/* Header Bar with Picture label, Open & Download actions */}
                    <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded-md bg-purple-500/20 text-purple-400">
                          <ImageIcon size={14} />
                        </span>
                        <span className="font-bold text-white text-xs">Picture #{idx + 2}</span>
                        <span className="text-[10px] text-slate-400 font-mono bg-slate-800 px-1.5 py-0.5 rounded">Flyer / Attachment</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setLightboxImage({ url: img, title: `${event.title} - Picture #${idx + 2}` })}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                          title="Open full-resolution image"
                        >
                          <Maximize2 size={12} />
                          <span>Open</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadImage(img, `${event.title}-picture-${idx + 2}.jpg`)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center gap-1 text-[11px] font-bold cursor-pointer shadow-xs"
                          title="Download high-resolution flyer"
                        >
                          <Download size={12} />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>

                    {/* Auto-adjusting picture body without black sidebars */}
                    <div 
                      onClick={() => setLightboxImage({ url: img, title: `${event.title} - Picture #${idx + 2}` })}
                      className="w-full cursor-zoom-in bg-slate-50 flex items-center justify-center overflow-hidden"
                    >
                      <MediaImage 
                        src={img} 
                        alt={`${event.title} - Attachment ${idx + 2}`} 
                        className="w-full h-auto block object-contain transition-transform duration-300 group-hover:scale-[1.01]"
                        onError={(e) => { e.target.src = '/default-placeholder.jpg'; }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Society Host Info Card */}
            <div className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-3">
                {event.society_logo ? (
                  <MediaImage
                    src={getMediaUrl(event.society_logo)}
                    onError={handleImageError}
                    alt={event.society_name}
                    className="w-8 h-8 rounded-full object-cover shadow-sm"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    {(event.society_name || 'S').substring(0, 1)}
                  </div>
                )}
                <div>
                  <span className="font-bold text-slate-900 text-sm block">{event.society_name}</span>
                  <span className="text-[11px] text-slate-500 font-medium">Departmental Campus Society</span>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                Official Event
              </span>
            </div>
          </div>

          {/* Right Column: Expanded Details, Live Pricing & Registration */}
          <div className="flex flex-col">
            
            {/* Badges & Live Pricing Display */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {isEventExpired ? (
                <span className="bg-rose-100 text-rose-800 border border-rose-300 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 shadow-xs">
                  <AlertCircle size={13} className="text-rose-600" />
                  EXPIRED / CONCLUDED
                </span>
              ) : (
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 shadow-xs">
                  <Sparkles size={13} className="text-emerald-600" />
                  LIVE EVENT
                </span>
              )}
              <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">
                {event.society_name}
              </span>
              
              {/* Pricing & Discount Badges */}
              {event.is_paid ? (
                event.has_discount ? (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-xs font-black text-emerald-800">
                    <span className="line-through text-slate-400 font-normal">Rs. {event.price}</span>
                    <span className="text-emerald-700 font-black">Rs. {event.discount_price}</span>
                    <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                      -{event.discount_percentage}% OFF
                    </span>
                  </div>
                ) : (
                  <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">
                    Rs. {event.price || event.entry_fee}
                  </span>
                )
              ) : (
                <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
                  Free Entry
                </span>
              )}

              {event.discount_note && (
                <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1">
                  <Tag size={12} /> {event.discount_note}
                </span>
              )}
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2 leading-tight">
              {event.title}
            </h1>

            {event.tagline && (
              <p className="text-sm font-semibold text-indigo-600 mb-4 italic">
                "{event.tagline}"
              </p>
            )}
            
            <div className="space-y-3 mb-6 text-sm text-gray-700 bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
              <p className="flex items-center gap-2.5">
                <Calendar size={16} className="text-indigo-600 shrink-0" /> 
                <span><strong>Date & Time:</strong> {event.date_time}</span>
              </p>
              <p className="flex items-center gap-2.5">
                <MapPin size={16} className="text-indigo-600 shrink-0" /> 
                <span><strong>Venue:</strong> {event.venue}</span>
              </p>
              <p className="flex items-center gap-2.5">
                <Users size={16} className="text-indigo-600 shrink-0" /> 
                <span><strong>Speakers / Guest:</strong> {event.speakers.join(', ')}</span>
              </p>
            </div>

            {/* Quick Payment QR Banner if event is paid and has QR */}
            {event.is_paid && (event.effective_payment_qr || event.payment_qr) && (
              <div 
                onClick={() => setShowQrModal(true)}
                className="mb-6 p-3.5 bg-gradient-to-r from-indigo-50/90 via-purple-50/70 to-blue-50/90 border border-indigo-200/80 hover:border-indigo-400 rounded-2xl flex items-center justify-between gap-3 cursor-pointer group transition shadow-xs hover:shadow-md"
                title="Click to view large QR code for mobile scanning"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-white border border-indigo-200 flex items-center justify-center p-1.5 shadow-xs group-hover:scale-105 group-hover:border-indigo-500 transition shrink-0">
                    {((event.effective_payment_qr || event.payment_qr).startsWith('http') || (event.effective_payment_qr || event.payment_qr).startsWith('/')) ? (
                      <MediaImage
                        src={getMediaUrl(event.effective_payment_qr || event.payment_qr)}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        alt="QR"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <QRCode value={event.effective_payment_qr || event.payment_qr} size={38} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-full inline-block">
                      Official Payment QR
                    </span>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate mt-0.5">
                      Scan with JazzCash / Easypaisa / Banking App
                    </h4>
                    <p className="text-[11px] text-slate-500">Tap to open full-screen high-res QR for effortless camera scan.</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs group-hover:bg-indigo-700 transition shrink-0">
                  <QrIcon size={14} />
                  <span className="hidden sm:inline">Open QR</span>
                  <Maximize2 size={12} />
                </div>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-base font-bold text-gray-900 mb-2">About This Event</h3>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                {event.detailed_description}
              </p>
            </div>

            {event.agenda && (
              <div className="mb-6 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                <h4 className="text-xs font-black uppercase text-indigo-900 mb-1 tracking-wider">
                  Event Agenda & Timeline
                </h4>
                <p className="text-xs text-indigo-800 whitespace-pre-line leading-relaxed">
                  {event.agenda}
                </p>
              </div>
            )}

            {/* Academic Eligibility Badge & Notice */}
            {(() => {
              const eligibility = checkEventEligibility(user, event);
              return (
                <div className={`p-4 rounded-2xl border text-xs space-y-2.5 ${
                  event.eligibility_type === 'restricted'
                    ? 'bg-gradient-to-br from-amber-50 to-orange-50/50 border-amber-200 shadow-xs'
                    : 'bg-emerald-50/60 border-emerald-200 shadow-xs'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5 text-slate-700">
                      <GraduationCap size={16} className={event.eligibility_type === 'restricted' ? 'text-amber-700' : 'text-emerald-700'} />
                      Audience & Academic Scope
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] shadow-xs ${
                      event.eligibility_type === 'restricted'
                        ? 'bg-amber-500 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}>
                      {event.eligibility_type === 'restricted' ? '🔒 Program Restricted' : '🌐 Open to All Students'}
                    </span>
                  </div>

                  {event.eligibility_type === 'restricted' ? (
                    <div className="space-y-2 pt-0.5">
                      <p className="text-[11px] text-amber-950 font-medium">
                        This event is strictly reserved for students enrolled in the following program(s):
                      </p>
                      <div className="font-bold text-slate-900 text-xs bg-white/90 p-2.5 rounded-xl border border-amber-200/80 leading-relaxed">
                        {Array.isArray(event.allowed_programs) && event.allowed_programs.length > 0
                          ? event.allowed_programs.join(', ')
                          : (event.allowed_departments?.join(', ') || 'Restricted Academic Programs')}
                      </div>
                      {user && user.role === 'student' && (
                        <div className="pt-1 flex items-center justify-between text-[11px] bg-amber-100/50 p-2 rounded-lg">
                          <span className="text-slate-600">Your Registered Program:</span>
                          <span className={`font-black ${eligibility.eligible ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {user.program || 'Not Specified'} {eligibility.eligible ? '✓ (Eligible)' : '✗ (Ineligible)'}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-emerald-800 font-medium">
                      Open to all registered university students across all departments and programs.
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Registration Action Section */}
            {(() => {
              const eligibility = checkEventEligibility(user, event);

              if (isEventExpired) {
                return (
                  <div className="p-5 bg-slate-100 border border-slate-300 rounded-2xl text-center space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shadow-inner">
                      <Lock size={22} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">Event Concluded — Registrations Closed</h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                        This event has ended. Entrance gate scanner lanes and ticket bookings are permanently closed. Issued certificates remain permanently verifiable and active.
                      </p>
                    </div>
                    {isRegistered && (
                      <div className="pt-1">
                        <Link to="/student-dashboard" className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-indigo-600/20">
                          View Concluded Ticket & Certificate →
                        </Link>
                      </div>
                    )}
                  </div>
                );
              }

              if (registerSuccess || paidSubmitted) {
                return (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                      <span>
                        {event.entry_fee === 0 
                          ? "Registration confirmed! Your QR Ticket is ready in your student profile." 
                          : "Payment receipt submitted successfully! Pending Society review."}
                      </span>
                    </div>
                    <div className="pt-2">
                      <Link to="/student-dashboard" className="underline font-black text-indigo-700">
                        Go to Student Dashboard & View QR Tickets →
                      </Link>
                    </div>
                  </div>
                );
              }

              if (isRegistered) {
                return (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-600" /> You are registered for this event.
                    </span>
                    <Link to="/student-dashboard" className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition">
                      View Ticket
                    </Link>
                  </div>
                );
              }

              if (!user) {
                return (
                  <div className="p-5 bg-indigo-50 border border-indigo-200 rounded-2xl text-center space-y-2">
                    <Ticket className="mx-auto text-indigo-600" size={28} />
                    <h4 className="text-sm font-bold text-slate-900">Student Sign-In Required</h4>
                    <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                      Sign in with your university student credentials to reserve your seat and receive your digital ticket.
                    </p>
                    <Link
                      to="/login"
                      state={{ from: `/events/${event.id}` }}
                      className="block w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition text-center shadow-md shadow-indigo-600/20"
                    >
                      Sign In to Register
                    </Link>
                  </div>
                );
              }

              if (user.role !== 'student') {
                return (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center text-xs text-amber-800 font-semibold">
                    Event ticketing and attendance registration is reserved for student accounts.
                  </div>
                );
              }

              if (user.role === 'student' && !eligibility.eligible) {
                return (
                  <div className="space-y-3">
                    <button 
                      disabled
                      className="w-full py-3 bg-slate-100 text-slate-400 font-bold rounded-xl cursor-not-allowed border border-slate-300 flex items-center justify-center gap-2 shadow-xs"
                    >
                      <Lock size={16} />
                      <span>Registration Ineligible (Program Restricted)</span>
                    </button>
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1.5">
                      <div className="font-bold flex items-center gap-1.5 text-amber-950">
                        <AlertCircle size={15} className="text-amber-700 shrink-0" />
                        <span>Eligibility Requirement Not Met</span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        {eligibility.reason}
                      </p>
                      {eligibility.missingProfile && (
                        <div className="pt-1">
                          <Link to="/profile" className="font-bold text-indigo-700 underline text-xs">
                            Update Your Degree Program in Profile →
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              if (event.entry_fee === 0) {
                return (
                  <button 
                    onClick={handleFreeRegister}
                    disabled={isSubmitting}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? "Securing Seat..." : "Register Now (Free Entry)"}
                  </button>
                );
              }

              if (!showPaidForm) {
                return (
                  <button 
                    onClick={() => setShowPaidForm(true)}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Register Now</span>
                    <span>(Rs. {event.entry_fee})</span>
                    {event.has_discount && (
                      <span className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                        Save {event.discount_percentage}%
                      </span>
                    )}
                  </button>
                );
              }

              return (
              /* Paid Registration Drawer / Form */
              <form onSubmit={handlePaidSubmit} className="mt-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 text-xs text-slate-700">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">Fee Payment (Rs. {event.entry_fee})</span>
                    {event.has_discount && (
                      <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                        Discounted
                      </span>
                    )}
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setShowPaidForm(false)}
                    className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                {/* Society Payment QR code if present */}
                {(event.effective_payment_qr || event.payment_qr) && (
                  <div 
                    onClick={() => setShowQrModal(true)}
                    className="p-3 bg-white border border-indigo-200 hover:border-indigo-400 rounded-xl flex items-center justify-between gap-4 cursor-pointer group transition shadow-xs hover:shadow-sm"
                    title="Click to view large QR code for easy scanning"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="p-1.5 bg-white border border-slate-200 rounded-lg shadow-xs group-hover:ring-2 group-hover:ring-indigo-500 transition shrink-0">
                        {((event.effective_payment_qr || event.payment_qr).startsWith('http') || (event.effective_payment_qr || event.payment_qr).startsWith('/')) ? (
                          <MediaImage
                            src={getMediaUrl(event.effective_payment_qr || event.payment_qr)}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            alt="Payment QR"
                            className="w-16 h-16 object-contain"
                          />
                        ) : (
                          <QRCode value={event.effective_payment_qr || event.payment_qr} size={64} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-black uppercase text-indigo-700 flex items-center gap-1.5">
                          <span>Scan to Pay Fee</span>
                          <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded font-bold">🔍 Tap to Enlarge</span>
                        </span>
                        <p className="text-[11px] text-slate-600 mt-0.5">Scan via JazzCash, Easypaisa, Raast, or Banking app.</p>
                        <span className="text-[10px] text-indigo-600 font-bold underline mt-0.5 block group-hover:text-indigo-800">
                          Click to open high-resolution scanner view →
                        </span>
                      </div>
                    </div>
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition shrink-0">
                      <Maximize2 size={16} />
                    </div>
                  </div>
                )}

                <div>
                  <label className="font-bold block mb-1">Transaction ID / Reference Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TRX-987654321"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">Upload Payment Screenshot / Receipt *</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleReceiptUpload}
                    className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:font-bold cursor-pointer"
                  />
                  {isUploadingReceipt && (
                    <span className="text-[10px] text-blue-600 mt-1 block">Uploading receipt image...</span>
                  )}
                  {receiptFile && (
                    <div className="mt-2 w-16 h-16 rounded border overflow-hidden">
                      <MediaImage src={receiptFile} alt="Receipt" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="font-bold block mb-1">Additional Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="Sender name, account title, etc."
                    value={receiptDetails}
                    onChange={(e) => setReceiptDetails(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isUploadingReceipt}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting Registration..." : "Submit Registration & Receipt"}
                </button>
              </form>
            );
          })()}
          </div>
          
        </div>
      </div>

      {/* EDIT ADVERTISEMENT MODAL */}
      {showEditModal && (
        <EditAdvertisementModal
          event={event}
          onClose={() => setShowEditModal(false)}
          onSaved={(updatedEvent) => {
            const norm = normalizeEvent(updatedEvent);
            setEvent(norm);
            setPaidAmount(String(norm.entry_fee || updatedEvent.price || ''));
            fetchEventDetails(true);
          }}
        />
      )}

      {/* FULL RESOLUTION INTERACTIVE LIGHTBOX VIEWER */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col p-4 animate-in fade-in duration-200 select-none"
          onClick={() => setLightboxImage(null)}
        >
          {/* Lightbox Top Control Bar */}
          <div 
            className="w-full max-w-6xl mx-auto flex items-center justify-between py-2 text-white shrink-0 gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                <ImageIcon size={18} />
              </span>
              <span className="font-bold text-sm line-clamp-1">{lightboxImage.title}</span>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => handleDownloadImage(lightboxImage.url, `${lightboxImage.title.replace(/\s+/g, '-').toLowerCase()}.jpg`)}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                title="Download high-resolution image"
              >
                <Download size={14} />
                <span className="hidden sm:inline">Download</span>
              </button>
              
              <a
                href={getMediaUrl(lightboxImage.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
                title="Open in new browser tab"
              >
                <ExternalLink size={14} />
                <span className="hidden sm:inline">New Tab</span>
              </a>

              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                title="Close viewer (Esc)"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Lightbox Stage (True Aspect Ratio, Max Scaled) */}
          <div 
            className="flex-1 flex items-center justify-center p-2 sm:p-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={getMediaUrl(lightboxImage.url)}
              alt={lightboxImage.title}
              className="max-h-[88vh] max-w-full object-contain rounded-2xl shadow-2xl transition"
              onError={(e) => { e.target.src = '/default-placeholder.jpg'; }}
            />
          </div>
        </div>
      )}

      {/* Event Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-rose-100 text-rose-600">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Delete Event</h3>
                <p className="text-xs text-slate-500">Permanent removal of event record</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to permanently delete <strong className="text-slate-900 font-bold">"{event.title}"</strong>? 
              This will release any scheduled date locks and remove all associated registration passes. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
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

      {/* Payment QR Enlarged High-Resolution Modal */}
      <PaymentQrModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        qrValue={event?.effective_payment_qr || event?.payment_qr}
        eventTitle={event?.title}
        societyName={event?.society_name}
        price={event?.entry_fee ?? event?.price ?? 0}
        bankName={event?.bank_name}
        accountTitle={event?.account_title}
        accountIban={event?.account_iban}
      />

    </div>
  );
}
