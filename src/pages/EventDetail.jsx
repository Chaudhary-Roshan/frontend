import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  Calendar, MapPin, Users, ArrowLeft, CheckCircle2, 
  Upload, QrCode as QrIcon, ShieldCheck, AlertCircle, Share2, Ticket
} from 'lucide-react';
import api from '../utils/api';
import QRCode from 'react-qr-code';
import { uploadFileToServer } from '../utils/fileUpload';

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

  // Paid event state
  const [showPaidForm, setShowPaidForm] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [receiptDetails, setReceiptDetails] = useState('');
  const [receiptFile, setReceiptFile] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [paidSubmitted, setPaidSubmitted] = useState(false);

  useEffect(() => {
    fetchEventDetails();
  }, [id, user]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const [evRes, regRes] = await Promise.allSettled([
        api.get(`events/${id}/`),
        user ? api.get('registrations/') : Promise.resolve({ data: [] })
      ]);

      if (evRes.status === 'fulfilled') {
        const evData = evRes.value.data;
        // Normalize fields for layout
        const normalized = {
          ...evData,
          poster_image_url: evData.poster_image_url || evData.image || '/default-placeholder.jpg',
          entry_fee: evData.entry_fee ?? (evData.is_paid ? parseFloat(evData.price) : 0),
          date_time: evData.date_time || (evData.date ? new Date(evData.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'TBD'),
          venue: evData.venue?.name || evData.venue_name || evData.venue || 'Campus Main Auditorium',
          speakers: Array.isArray(evData.speakers) && evData.speakers.length > 0
            ? evData.speakers
            : (evData.chief_guest ? [evData.chief_guest] : ['Distinguished Keynote Speakers']),
          detailed_description: evData.detailed_description || evData.description || 'No detailed description provided for this event.',
          gallery_images: Array.isArray(evData.gallery_images) ? evData.gallery_images : []
        };
        setEvent(normalized);
        setPaidAmount(String(evData.price || ''));
      } else {
        setErrorMsg("Failed to load event details. The event may not exist or is pending review.");
      }

      if (regRes.status === 'fulfilled') {
        const matchingReg = regRes.value.data.find(r => String(r.event) === String(id));
        if (matchingReg) {
          setIsRegistered(true);
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Error loading event.");
    } finally {
      setLoading(false);
    }
  };

  const handleFreeRegister = async () => {
    if (!user) {
      navigate('/login');
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
        paid_amount: paidAmount || event.price,
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
      <div className="max-w-6xl mx-auto mb-4">
        <Link 
          to="/events" 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
        >
          <ArrowLeft size={16} /> Back to Events Directory
        </Link>
      </div>

      {errorMsg && (
        <div className="max-w-6xl mx-auto mb-4 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Expanded Details & Info View Layout */}
      <div className="max-w-6xl mx-auto p-6 bg-white rounded-2xl shadow-lg mt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left Column: Full Poster Image */}
          <div className="w-full h-auto flex flex-col items-center">
            <div className="w-full max-h-[580px] overflow-hidden rounded-xl shadow-md bg-slate-900 border border-slate-200">
              <img 
                src={event.poster_image_url} 
                alt={event.title} 
                className="w-full h-full rounded-xl object-cover"
                onError={(e) => {
                  e.target.src = '/default-placeholder.jpg';
                }}
              />
            </div>

            {/* Quick Share or Society Info badge */}
            <div className="w-full mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-2">
                {event.society_logo ? (
                  <img src={event.society_logo} alt={event.society_name} className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                    {(event.society_name || 'S').substring(0, 1)}
                  </div>
                )}
                <span className="font-semibold text-slate-800">{event.society_name}</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Official Departmental Event
              </span>
            </div>
          </div>

          {/* Right Column: Expanded Details */}
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">
                {event.society_name}
              </span>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                {event.entry_fee === 0 ? 'Free Entry' : `Rs. ${event.entry_fee}`}
              </span>
            </div>
            
            <h1 className="text-3xl font-black text-gray-900 mb-4">{event.title}</h1>
            
            <div className="space-y-3 mb-6 text-sm text-gray-700">
              <p className="flex items-center gap-2">📅 <strong>Date & Time:</strong> {event.date_time}</p>
              <p className="flex items-center gap-2">📍 <strong>Venue:</strong> {event.venue}</p>
              <p className="flex items-center gap-2">🎤 <strong>Speakers:</strong> {event.speakers.join(', ')}</p>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-2">About This Event</h3>
              {/* Render rich text/HTML from your database here */}
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {event.detailed_description}
              </p>
            </div>

            {/* Registration Action */}
            {registerSuccess || paidSubmitted ? (
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
            ) : isRegistered ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600" /> You are registered for this event.
                </span>
                <Link to="/student-dashboard" className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition">
                  View Ticket
                </Link>
              </div>
            ) : event.entry_fee === 0 ? (
              <button 
                onClick={handleFreeRegister}
                disabled={isSubmitting}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Securing Seat..." : "Register Now"}
              </button>
            ) : !showPaidForm ? (
              <button 
                onClick={() => setShowPaidForm(true)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
              >
                Register Now (Rs. {event.entry_fee})
              </button>
            ) : (
              /* Paid Registration Drawer / Form */
              <form onSubmit={handlePaidSubmit} className="mt-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 text-xs text-slate-700">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-900 text-sm">Fee Payment (Rs. {event.entry_fee})</span>
                  <button 
                    type="button" 
                    onClick={() => setShowPaidForm(false)}
                    className="text-slate-400 hover:text-slate-600 font-bold"
                  >
                    Cancel
                  </button>
                </div>

                {/* Society Payment QR code if present */}
                {(event.effective_payment_qr || event.payment_qr) && (
                  <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-4">
                    <div className="p-1.5 bg-white border border-slate-200 rounded-lg shadow-sm">
                      {((event.effective_payment_qr || event.payment_qr).startsWith('http') || (event.effective_payment_qr || event.payment_qr).startsWith('/')) ? (
                        <img src={event.effective_payment_qr || event.payment_qr} alt="Payment QR" className="w-16 h-16 object-contain" />
                      ) : (
                        <QRCode value={event.effective_payment_qr || event.payment_qr} size={64} />
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-indigo-700 block">Scan to Pay Fee</span>
                      <p className="text-[11px] text-slate-600">Scan QR via JazzCash, Easypaisa, or Mobile Banking.</p>
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
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">Upload Payment Slip / Receipt Screenshot *</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleReceiptUpload}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs"
                    required={!receiptFile}
                  />
                  {isUploadingReceipt && (
                    <p className="text-xs text-blue-600 font-bold mt-1 animate-pulse">Uploading payment proof...</p>
                  )}
                  {receiptFile && (
                    <div className="mt-2 w-full h-32 rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                      <img src={receiptFile} alt="Payment Receipt" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="font-bold block mb-1">Remarks or Account Title (Optional)</label>
                  <input
                    type="text"
                    placeholder="Account holder name or remarks"
                    value={receiptDetails}
                    onChange={(e) => setReceiptDetails(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting Registration..." : "Submit Registration & Receipt"}
                </button>
              </form>
            )}
          </div>
          
        </div>

        {/* Extra Gallery Highlights */}
        {event.gallery_images && event.gallery_images.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Event Gallery & Additional Materials</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {event.gallery_images.map((imgUrl, i) => (
                <div key={i} className="h-32 rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-900 group">
                  <img 
                    src={imgUrl} 
                    alt={`Highlight ${i+1}`} 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    onError={(e) => { e.target.src = '/default-placeholder.jpg'; }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
