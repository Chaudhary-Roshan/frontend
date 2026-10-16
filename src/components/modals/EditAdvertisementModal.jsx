import React, { useState } from 'react';
import { 
  X, Image as ImageIcon, Calendar, MapPin, DollarSign, Tag, 
  Upload, Trash2, CheckCircle2, AlertCircle, Sparkles, Clock, 
  Users, Eye, QrCode as QrIcon, FileText, GraduationCap, CheckSquare, Square, Shield
} from 'lucide-react';
import api from '../../utils/api';
import { MediaImage } from '../common/AuthenticatedMedia';
import { getMediaUrl } from '../../utils/media';
import AcademicScopeSelector from '../common/AcademicScopeSelector';

/**
 * Format a Date or date string to 'YYYY-MM-DDTHH:mm' for <input type="datetime-local" />
 */
function toDateTimeLocalString(dateInput) {
  if (!dateInput) return '';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return '';
  }
}

export default function EditAdvertisementModal({
  event,
  onClose,
  onSaved
}) {
  if (!event) return null;

  // Form State
  const [title, setTitle] = useState(event.title || '');
  const [tagline, setTagline] = useState(event.tagline || '');
  const [eventType, setEventType] = useState(event.event_type || 'Technical Summit & Workshop');
  const [venueName, setVenueName] = useState(event.venue?.name || event.venue_name || event.venue || 'Campus Main Auditorium');
  const [dateTime, setDateTime] = useState(toDateTimeLocalString(event.date || event.date_time));
  const [chiefGuest, setChiefGuest] = useState(
    event.chief_guest || (Array.isArray(event.speakers) ? event.speakers.join(', ') : '')
  );
  const [description, setDescription] = useState(event.detailed_description || event.description || '');
  const [agenda, setAgenda] = useState(event.agenda || '');

  // Pricing & Discount State
  const [isPaid, setIsPaid] = useState(Boolean(event.is_paid));
  const [price, setPrice] = useState(event.price ?? event.ticket_price ?? 0);
  const [discountPrice, setDiscountPrice] = useState(
    event.discount_price ? Number(event.discount_price) : ''
  );
  const [discountNote, setDiscountNote] = useState(event.discount_note || '');

  // Media Cover Image State
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(event.poster_image_url || event.image || '');

  // Payment QR State
  const [qrFile, setQrFile] = useState(null);
  const [qrPreview, setQrPreview] = useState(event.effective_payment_qr || event.payment_qr || '');

  // Attached / Gallery Images State (Second picture and beyond)
  const [existingGallery, setExistingGallery] = useState(
    Array.isArray(event.gallery_images) ? [...event.gallery_images] : []
  );
  const [newGalleryFiles, setNewGalleryFiles] = useState([]);
  const [newGalleryPreviews, setNewGalleryPreviews] = useState([]);

  // Visibility / Publishing
  const [isPublished, setIsPublished] = useState(event.is_published ?? true);

  // Audience & Academic Scope Eligibility
  const [eligibilityType, setEligibilityType] = useState(event.eligibility_type || 'all');
  const [selectedDepartments, setSelectedDepartments] = useState(
    Array.isArray(event.allowed_departments) ? event.allowed_departments : []
  );
  const [selectedPrograms, setSelectedPrograms] = useState(
    Array.isArray(event.allowed_programs) ? event.allowed_programs : []
  );

  // Status & Validation
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Cover Image Selection
  const handleCoverChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onload = () => setCoverPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Payment QR Selection
  const handleQrChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setQrFile(file);
      const reader = new FileReader();
      reader.onload = () => setQrPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Additional Gallery Photos Selection
  const handleNewGalleryFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setNewGalleryFiles(prev => [...prev, ...files]);
    files.forEach(f => {
      const reader = new FileReader();
      reader.onload = () => setNewGalleryPreviews(prev => [...prev, reader.result]);
      reader.readAsDataURL(f);
    });
  };

  const removeExistingGalleryImage = (indexToRemove) => {
    setExistingGallery(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const removeNewGalleryImage = (indexToRemove) => {
    setNewGalleryFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
    setNewGalleryPreviews(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Compute live discount percentage
  const numPrice = parseFloat(price) || 0;
  const numDiscountPrice = parseFloat(discountPrice) || 0;
  const hasValidDiscount = isPaid && numDiscountPrice > 0 && numDiscountPrice < numPrice;
  const discountPercent = hasValidDiscount ? Math.round(((numPrice - numDiscountPrice) / numPrice) * 100) : 0;

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Event title is required.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('tagline', tagline.trim());
      formData.append('event_type', eventType.trim());
      formData.append('venue_name', venueName.trim());
      if (dateTime) {
        formData.append('date', dateTime);
      }
      formData.append('chief_guest', chiefGuest.trim());
      formData.append('description', description);
      formData.append('agenda', agenda);

      // Pricing & Discount
      formData.append('is_paid', isPaid ? 'true' : 'false');
      formData.append('price', isPaid ? String(numPrice) : '0.00');
      formData.append('discount_price', (isPaid && discountPrice !== '') ? String(numDiscountPrice) : '0.00');
      formData.append('discount_note', discountNote.trim());

      // Cover Photo
      if (coverFile) {
        formData.append('cover_photo', coverFile);
      } else if (coverPreview && typeof coverPreview === 'string') {
        formData.append('cover_image', coverPreview);
      }

      // Payment QR
      if (qrFile) {
        formData.append('payment_qr_file', qrFile);
      } else if (qrPreview && typeof qrPreview === 'string') {
        formData.append('payment_qr', qrPreview);
      }

      // Retained Existing Gallery Images
      formData.append('existing_gallery', JSON.stringify(existingGallery));

      // Newly added Gallery Images
      if (newGalleryFiles.length > 0) {
        newGalleryFiles.forEach(file => {
          formData.append('gallery_images', file);
        });
      }

      // Live publishing status
      formData.append('is_published', isPublished ? 'true' : 'false');

      // Academic Scope & Eligibility
      formData.append('eligibility_type', eligibilityType);
      formData.append('allowed_departments', JSON.stringify(eligibilityType === 'restricted' ? selectedDepartments : []));
      formData.append('allowed_programs', JSON.stringify(eligibilityType === 'restricted' ? selectedPrograms : []));

      const res = await api.post(`events/${event.id}/edit-advertisement/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const updated = res.data.event || res.data;
      if (onSaved) {
        onSaved(updated);
      }
      onClose();
    } catch (err) {
      console.error('Error updating advertisement:', err);
      const detail = err.response?.data?.error || err.response?.data?.detail || err.message || 'Failed to update advertisement.';
      setErrorMsg(typeof detail === 'object' ? JSON.stringify(detail) : String(detail));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 font-sans overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto border border-slate-200">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-100 text-purple-700">
                <Sparkles size={18} />
              </span>
              <div>
                <h2 className="text-xl font-black text-slate-900">Edit Live Advertisement</h2>
                <p className="text-xs text-slate-500 font-medium">
                  {event.society_name || 'Society Event'} • Live Campus Marketing & Ticketing Controls
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-6 text-xs">
          
          {/* SECTION 1: BASIC INFORMATION */}
          <div className="space-y-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
            <h3 className="font-black text-sm text-slate-800 flex items-center gap-2">
              <FileText size={16} className="text-indigo-600" /> Event Details & Schedule
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Annual AI & Cyber Innovation Summit 2026"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Marketing Tagline</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Innovate, Code & Conquer"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Event Category / Type</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                >
                  <option value="Technical Summit & Workshop">Technical Summit & Workshop</option>
                  <option value="Seminar / Conference">Seminar / Conference</option>
                  <option value="Hackathon / Coding Sprint">Hackathon / Coding Sprint</option>
                  <option value="Cultural Gala & Arts">Cultural Gala & Arts</option>
                  <option value="Sports Tournament">Sports Tournament</option>
                  <option value="Debating / Parliamentary">Debating / Parliamentary</option>
                  <option value="Networking & Industry Meetup">Networking & Industry Meetup</option>
                  <option value="Guest Lecture & Q&A">Guest Lecture & Q&A</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  <Calendar size={13} className="inline mr-1 text-slate-500" /> Event Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  <MapPin size={13} className="inline mr-1 text-slate-500" /> Venue / Location
                </label>
                <input
                  type="text"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="e.g. Campus Main Auditorium / CS Lab 3"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  <Users size={13} className="inline mr-1 text-slate-500" /> Chief Guest / Keynote Speakers
                </label>
                <input
                  type="text"
                  value={chiefGuest}
                  onChange={(e) => setChiefGuest(e.target.value)}
                  placeholder="e.g. Dr. Jane Smith, VP of Engineering at TechCorp"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: TICKETING, PRICING & DISCOUNTS */}
          <div className="space-y-4 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200/80">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm text-slate-800 flex items-center gap-2">
                <DollarSign size={16} className="text-emerald-600" /> Ticketing, Pricing & Discounts
              </h3>
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-bold text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPaid}
                    onChange={(e) => setIsPaid(e.target.checked)}
                    className="mr-1.5 accent-emerald-600 rounded"
                  />
                  Paid Ticket Event
                </label>
              </div>
            </div>

            {isPaid ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Regular Ticket Price (PKR) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required={isPaid}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Discounted Live Price (PKR)</span>
                    <span className="text-[10px] text-emerald-700 font-semibold">Optional</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(e.target.value)}
                    placeholder="e.g. 350 (leave empty if no discount)"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    <Tag size={13} className="inline mr-1 text-slate-500" /> Discount Badge / Note
                  </label>
                  <input
                    type="text"
                    value={discountNote}
                    onChange={(e) => setDiscountNote(e.target.value)}
                    placeholder="e.g. Early Bird 30% Off • Limited to First 50 Students"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                  />
                </div>

                {hasValidDiscount && (
                  <div className="sm:col-span-2 p-3 bg-emerald-100/80 border border-emerald-300 rounded-xl flex items-center justify-between text-emerald-900 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Sparkles size={14} className="text-emerald-600" />
                      Live Pricing Preview:
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="line-through text-slate-400 font-normal">PKR {numPrice}</span>
                      <span className="text-emerald-800 font-black text-sm">PKR {numDiscountPrice}</span>
                      <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                        -{discountPercent}% OFF
                      </span>
                    </div>
                  </div>
                )}

                {/* Payment QR Code Upload */}
                <div className="sm:col-span-2 border-t border-emerald-200/60 pt-3">
                  <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <QrIcon size={14} className="text-emerald-700" /> Society Payment QR Code
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {qrPreview && (
                      <div className="w-20 h-20 rounded-xl border border-slate-200 bg-white p-1 shrink-0 flex items-center justify-center overflow-hidden">
                        <MediaImage src={qrPreview} alt="Payment QR" className="w-full h-full object-contain" />
                      </div>
                    )}
                    <div className="flex-1 w-full">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleQrChange}
                        className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        Upload Easypaisa, JazzCash, or Bank Account QR for student registration receipts.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-600 italic">
                Free Entry: Students will register with zero ticket fees and automatically receive admission QR passes.
              </p>
            )}
          </div>

          {/* AUDIENCE SCOPE & DEPARTMENT ELIGIBILITY (WITH LIVE SEARCH & FACULTY FILTER) */}
          <AcademicScopeSelector
            eligibilityType={eligibilityType}
            setEligibilityType={setEligibilityType}
            selectedDepartments={selectedDepartments}
            setSelectedDepartments={setSelectedDepartments}
            selectedPrograms={selectedPrograms}
            setSelectedPrograms={setSelectedPrograms}
          />

          {/* SECTION 3: COVER & ATTACHED IMAGES */}
          <div className="space-y-4 bg-indigo-50/40 p-4 rounded-2xl border border-indigo-200/80">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm text-slate-800 flex items-center gap-2">
                <ImageIcon size={16} className="text-indigo-600" /> Event Cover & Attached Pictures
              </h3>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                No Sliders • Pure Vertical Flow
              </span>
            </div>

            {/* 1. Main Cover Picture */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Main Cover Poster (Top Hero Image) *
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {coverPreview && (
                  <div className="w-full sm:w-44 h-28 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 shrink-0">
                    <MediaImage src={coverPreview} alt="Cover Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 w-full">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Select a high-resolution portrait or landscape poster. This will display at the top of the event page.
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Attached Images (Second picture and beyond) */}
            <div className="pt-3 border-t border-indigo-200/60">
              <label className="block font-bold text-slate-700 mb-1">
                Attached Pictures & Additional Flyers (Displayed directly under the cover)
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                The second picture and further attachments appear in order right beneath the cover picture on the live event page without any slider.
              </p>

              {/* Existing Gallery Images */}
              {existingGallery.length > 0 && (
                <div className="mb-3 space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Currently Attached Photos:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {existingGallery.map((imgUrl, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-900 h-24">
                        <MediaImage src={imgUrl} alt={`Attached ${idx + 2}`} className="w-full h-full object-cover" />
                        <div className="absolute top-1 left-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded font-black">
                          #{idx + 2}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeExistingGalleryImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-rose-600/90 hover:bg-rose-700 text-white rounded-lg shadow transition cursor-pointer"
                          title="Remove this photo"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Newly Uploaded Photos Previews */}
              {newGalleryPreviews.length > 0 && (
                <div className="mb-3 space-y-2">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">New Photos to be Added:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {newGalleryPreviews.map((src, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-emerald-400 bg-slate-900 h-24">
                        <img src={src} alt={`New Preview ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeNewGalleryImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-lg shadow transition cursor-pointer"
                          title="Cancel upload"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Photos Input */}
              <div className="mt-2">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleNewGalleryFiles}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-700 file:text-white hover:file:bg-slate-800 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: STUDENT-FACING DESCRIPTION & AGENDA */}
          <div className="space-y-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
            <h3 className="font-black text-sm text-slate-800 flex items-center gap-2">
              <FileText size={16} className="text-slate-700" /> Student Description & Agenda
            </h3>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Detailed Public Description *
              </label>
              <textarea
                rows="4"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write an engaging overview, target audience, learning outcomes, and expectations..."
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Agenda / Schedule Timeline (Optional)
              </label>
              <textarea
                rows="3"
                value={agenda}
                onChange={(e) => setAgenda(e.target.value)}
                placeholder="e.g. 10:00 AM - Opening Keynote | 11:30 AM - Hands-on Lab | 01:00 PM - Lunch & Networking"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
              />
            </div>
          </div>

          {/* SECTION 5: PUBLISHING TOGGLE */}
          <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900 block">Live Visibility on Student Portal</span>
              <p className="text-[11px] text-slate-500">
                {isPublished 
                  ? "Event advertisement is currently active and open for student registrations." 
                  : "Event is hidden in draft mode and not visible to students on the campus portal."}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold shadow-lg shadow-indigo-600/20 transition cursor-pointer flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving Live Advertisement...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Update Advertisement</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
