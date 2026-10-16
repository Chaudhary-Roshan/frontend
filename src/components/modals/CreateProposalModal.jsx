import { MediaImage } from '../common/AuthenticatedMedia';
import React, { useState } from 'react';
import { 
  X, Plus, Trash2, Calendar, Clock, MapPin, DollarSign, 
  Users, Sparkles, AlertCircle, FileText, CheckCircle2,
  GraduationCap, CheckSquare, Square, Shield
} from 'lucide-react';
import api from '../../utils/api';
import { uploadFileToServer } from '../../utils/fileUpload';
import AcademicScopeSelector from '../common/AcademicScopeSelector';

const DEFAULT_FACILITIES = [
  'Auditorium or classroom',
  'Sound system & wireless microphones',
  'High-lumen projector',
  'Photography or media coverage',
  'Refreshments & catering',
  'Transport & logistics clearance',
  'Security & protocol clearance',
  'Certificates & mementos',
  'Publicity material & banners'
];

export default function CreateProposalModal({ 
  society, 
  venues = [], 
  onClose, 
  onProposalCreated 
}) {
  const [form, setForm] = useState({
    event_title: '',
    event_type: 'Technical Summit & Workshop',
    event_date: '',
    start_time: '10:00 AM',
    end_time: '01:00 PM',
    venue: 'Campus Main Auditorium',
    academic_year: '2026-2027',
    poster_image_url: '',
    objectives: '1. Facilitate practical technical competencies in emerging technologies.\n2. Strengthen departmental student collaboration and leadership.\n3. Provide verified certification and academic recognition.',
    event_description: 'A comprehensive campus-wide event featuring guest speaker keynotes, hands-on lab workshops, student project demonstrations, and interactive Q&A sessions under faculty advisor supervision.',
    expected_participants: 120,
    target_audience: 'University Students, Faculty & Research Scholars',
    guests: 'Dean of Computing & Information Sciences, Industry Technology Leaders, and Distinguished Guest Speakers',
    funding_source: 'Society Annual Budget Allocation & Corporate Sponsorship',
    expected_outcome: 'Enhanced domain knowledge, networking opportunities, portfolio project building, and post-event institutional documentation.',
    president_contact: ''
  });

  const [isPaid, setIsPaid] = useState(false);
  const [ticketPrice, setTicketPrice] = useState('');

  const [uploadingPoster, setUploadingPoster] = useState(false);

  const [selectedFacilities, setSelectedFacilities] = useState([
    'Auditorium or classroom',
    'Sound system & wireless microphones',
    'High-lumen projector',
    'Photography or media coverage',
    'Refreshments & catering',
    'Certificates & mementos'
  ]);
  const [customFacility, setCustomFacility] = useState('');

  const [budgetItems, setBudgetItems] = useState([
    { item: 'Keynote & Speaker Honorarium', description: 'Travel allowance and guest honorarium', cost: 120.00 },
    { item: 'Refreshments & High Tea', description: 'Catering for registered participants and dignitaries', cost: 150.00 },
    { item: 'Printing & Shields', description: 'Participant certificates and honorary crests', cost: 80.00 }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [dateAvailability, setDateAvailability] = useState(null);
  const [isCheckingDate, setIsCheckingDate] = useState(false);

  // Audience & Department Eligibility State
  const [eligibilityType, setEligibilityType] = useState('all'); // 'all' | 'restricted'
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedPrograms, setSelectedPrograms] = useState([]);

  // Compute live total budget
  const totalBudget = budgetItems.reduce((acc, it) => acc + (parseFloat(it.cost) || 0), 0);

  const handleDateChange = async (dateVal) => {
    setForm(prev => ({ ...prev, event_date: dateVal }));
    if (!dateVal) {
      setDateAvailability(null);
      return;
    }
    setIsCheckingDate(true);
    try {
      const res = await api.get(`date-claims/check_availability/?date=${dateVal}&society_id=${society?.id || ''}`);
      setDateAvailability(res.data);
    } catch (err) {
      setDateAvailability(null);
    } finally {
      setIsCheckingDate(false);
    }
  };

  const toggleFacility = (facility) => {
    setSelectedFacilities(prev => 
      prev.includes(facility) ? prev.filter(f => f !== facility) : [...prev, facility]
    );
  };

  const handleAddCustomFacility = () => {
    if (customFacility.trim() && !selectedFacilities.includes(customFacility.trim())) {
      setSelectedFacilities([...selectedFacilities, customFacility.trim()]);
      setCustomFacility('');
    }
  };

  const handleAddBudgetItem = () => {
    setBudgetItems([...budgetItems, { item: '', description: '', cost: 0 }]);
  };

  const handleUpdateBudgetItem = (index, field, value) => {
    const updated = [...budgetItems];
    updated[index][field] = field === 'cost' ? (parseFloat(value) || 0) : value;
    setBudgetItems(updated);
  };

  const handleRemoveBudgetItem = (index) => {
    setBudgetItems(budgetItems.filter((_, i) => i !== index));
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    try {
      setUploadingPoster(true);
      setErrorMsg(null);
      const url = await uploadFileToServer(file, 'posters');
      setForm(prev => ({ ...prev, poster_image_url: url }));
    } catch (err) {
      console.error("Poster upload failed:", err);
      setErrorMsg("Failed to upload event poster. Please try another image.");
    } finally {
      setUploadingPoster(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.event_title.trim()) {
      setErrorMsg("Please enter an event title.");
      return;
    }
    if (!form.event_date) {
      setErrorMsg("Please select a proposed event date.");
      return;
    }
    if (!form.poster_image_url) {
      setErrorMsg("Please upload an Event Poster / Cover Image for the proposal.");
      return;
    }
    if (isPaid && (!ticketPrice || parseFloat(ticketPrice) < 10)) {
      setErrorMsg("Please specify a valid ticket price (minimum PKR 10) for paid event proposals.");
      return;
    }
    if (eligibilityType === 'restricted') {
      if (selectedDepartments.length === 0) {
        setErrorMsg("Please select at least one department for restricted eligibility.");
        return;
      }
      if (selectedPrograms.length === 0) {
        setErrorMsg("Please select at least one degree program for restricted eligibility.");
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const computedAudience = eligibilityType === 'restricted'
        ? `Exclusively restricted to: ${selectedDepartments.join(', ')} (${selectedPrograms.join(', ')})`
        : form.target_audience;

      const payload = {
        society: society?.id,
        event_title: form.event_title,
        event_type: form.event_type,
        event_date: form.event_date,
        start_time: form.start_time,
        end_time: form.end_time,
        venue: form.venue,
        academic_year: form.academic_year,
        event_image: form.poster_image_url,
        poster_image_url: form.poster_image_url,
        is_paid: isPaid,
        ticket_price: isPaid ? (parseFloat(ticketPrice) || 0) : 0,
        eligibility_type: eligibilityType,
        allowed_departments: eligibilityType === 'restricted' ? selectedDepartments : [],
        allowed_programs: eligibilityType === 'restricted' ? selectedPrograms : [],
        objectives: form.objectives,
        event_description: form.event_description,
        expected_participants: parseInt(form.expected_participants) || 100,
        target_audience: computedAudience,
        guests: form.guests,
        required_facilities: selectedFacilities.join('\n• '),
        budget_items: budgetItems,
        budget: totalBudget,
        funding_source: form.funding_source,
        expected_outcome: form.expected_outcome,
        president_contact: form.president_contact
      };

      const res = await api.post('proposals/', payload);
      if (onProposalCreated) onProposalCreated(res.data);
      onClose();
    } catch (err) {
      const dErr = err.response?.data?.event_date;
      const dateErr = Array.isArray(dErr) ? dErr[0] : dErr;
      const tErr = err.response?.data?.title;
      const titleErr = Array.isArray(tErr) ? tErr[0] : tErr;
      const generalErr = err.response?.data?.error || err.response?.data?.detail;
      setErrorMsg(dateErr || titleErr || generalErr || "Failed to generate event proposal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 font-sans">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 sm:p-6 flex items-center justify-between border-b border-white/10 shrink-0">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300 bg-indigo-900/60 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
              Statutory Workflow Form
            </span>
            <h2 className="text-xl font-black text-white mt-1 flex items-center gap-2">
              <FileText className="text-indigo-400" size={22} />
              Create Official Event Proposal
            </h2>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Draft formal proposal for <strong>{society?.name}</strong> to generate official printable PDF dossier.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* ERROR BANNER */}
        {errorMsg && (
          <div className="bg-rose-50 border-b border-rose-200 p-3.5 px-6 flex items-center gap-3 text-xs font-bold text-rose-700 shrink-0">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* FORM BODY (Scrollable) */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-7 space-y-6 flex-1 text-xs">
          
          {/* SECTION 1: EVENT INFORMATION */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-indigo-700 border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
              <Calendar size={14} /> 1. Event Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={form.event_title}
                  onChange={(e) => setForm({ ...form, event_title: e.target.value })}
                  placeholder="e.g. National Cyber Defense Summit 2026"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Event Poster / Cover Image */}
              <div className="mb-2 sm:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Event Poster / Cover Image *</label>
                <input 
                  type="file" 
                  accept="image/png, image/jpeg" 
                  onChange={(e) => handleImageUpload(e.target.files[0])}
                  className="w-full p-3 border border-gray-300 rounded-lg text-xs bg-slate-50 focus:bg-white"
                  required={!form.poster_image_url} 
                />
                <p className="text-xs text-gray-500 mt-1">Recommended size: 1200x630px (16:9 ratio)</p>
                {uploadingPoster && (
                  <p className="text-xs text-indigo-600 font-bold mt-1.5 animate-pulse flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
                    Uploading event poster to media storage...
                  </p>
                )}
                {form.poster_image_url && (
                  <div className="mt-3 relative w-full h-44 rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-900">
                    <MediaImage 
                      src={form.poster_image_url} 
                      alt="Event Poster Preview" 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                      <CheckCircle2 size={12} /> Poster Attached
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Event Type</label>
                <select
                  value={form.event_type}
                  onChange={(e) => setForm({ ...form, event_type: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option>Technical Summit & Workshop</option>
                  <option>Hackathon & Coding Sprint</option>
                  <option>Seminar & Panel Discussion</option>
                  <option>Cultural Gala & Festival</option>
                  <option>Sports Tournament</option>
                  <option>Networking Meetup & Orientation</option>
                  <option>Annual General Assembly</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Proposed Date *</label>
                <input
                  type="date"
                  required
                  value={form.event_date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                {isCheckingDate && (
                  <p className="text-[10px] text-slate-500 font-semibold mt-1 animate-pulse">
                    Checking university calendar lock status...
                  </p>
                )}
                {!isCheckingDate && dateAvailability && (
                  <div className={`mt-1.5 p-2 rounded-lg text-[11px] font-bold flex items-center gap-1.5 border ${
                    dateAvailability.available 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {dateAvailability.available ? (
                      <>
                        <CheckCircle2 size={13} className="shrink-0 text-emerald-600" />
                        <span>Date available on university calendar.</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={13} className="shrink-0 text-rose-600" />
                        <span>{dateAvailability.message}</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Start Time</label>
                  <input
                    type="text"
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    placeholder="10:00 AM"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">End Time</label>
                  <input
                    type="text"
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                    placeholder="01:00 PM"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Campus Venue *</label>
                <div className="flex gap-2">
                  <select
                    value={form.venue}
                    onChange={(e) => setForm({ ...form, venue: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Campus Main Auditorium">Campus Main Auditorium</option>
                    <option value="Executive Seminar Hall A">Executive Seminar Hall A</option>
                    <option value="Computer Science Lab 3">Computer Science Lab 3</option>
                    <option value="Student Center Amphitheatre">Student Center Amphitheatre</option>
                    <option value="Central Sports Ground">Central Sports Ground</option>
                    {venues.map(v => (
                      <option key={v.id} value={v.name}>{v.name} (Cap: {v.capacity})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Academic Year</label>
                <input
                  type="text"
                  value={form.academic_year}
                  onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
                  placeholder="2026-2027"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">President Contact Ext. / Mobile</label>
                <input
                  type="text"
                  value={form.president_contact}
                  onChange={(e) => setForm({ ...form, president_contact: e.target.value })}
                  placeholder="+92 300 1234567"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              {/* EVENT TICKETING STRUCTURE */}
              <div className="col-span-1 md:col-span-2 lg:col-span-3 mt-2 p-4 border border-gray-200 rounded-xl bg-gray-50">
                <label className="block text-sm font-bold text-[#2A3650] mb-3">Event Ticketing Structure *</label>
                
                <div className="flex gap-6 mb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="ticketing" 
                      checked={!isPaid} 
                      onChange={() => { setIsPaid(false); setTicketPrice("0"); }}
                      className="w-5 h-5 text-purple-600"
                    />
                    <span className="font-semibold text-gray-700">Free Entry</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="ticketing" 
                      checked={isPaid} 
                      onChange={() => setIsPaid(true)}
                      className="w-5 h-5 text-purple-600"
                    />
                    <span className="font-semibold text-gray-700">Paid Registration</span>
                  </label>
                </div>

                {/* Conditional Price Input */}
                {isPaid && (
                  <div className="mt-4 w-full sm:w-1/2">
                    <label className="block text-xs font-bold text-gray-600 mb-1">Ticket Price per student (PKR) *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500 font-bold">Rs.</span>
                      <input 
                        type="number" 
                        min="50"
                        value={ticketPrice}
                        onChange={(e) => setTicketPrice(e.target.value)}
                        required={isPaid}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="e.g. 500"
                      />
                    </div>
                  </div>
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
            </div>
          </div>

          {/* SECTION 2 & 3: OBJECTIVES & DESCRIPTION */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-indigo-700 border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
              <Sparkles size={14} /> 2. Objectives & 3. Description
            </h3>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Event Objectives</label>
              <textarea
                rows={3}
                value={form.objectives}
                onChange={(e) => setForm({ ...form, objectives: e.target.value })}
                placeholder="List key objectives..."
                className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Event Description & Program Details</label>
              <textarea
                rows={3}
                value={form.event_description}
                onChange={(e) => setForm({ ...form, event_description: e.target.value })}
                placeholder="Comprehensive description of the event..."
                className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* SECTION 4: EXPECTED PARTICIPATION */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-indigo-700 border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
              <Users size={14} /> 4. Expected Participation
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Expected Number of Participants</label>
                <input
                  type="number"
                  min="10"
                  value={form.expected_participants}
                  onChange={(e) => setForm({ ...form, expected_participants: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Audience</label>
                <input
                  type="text"
                  value={form.target_audience}
                  onChange={(e) => setForm({ ...form, target_audience: e.target.value })}
                  placeholder="e.g. Undergrad CS & SE Students"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Expected Guests or Keynote Speakers</label>
                <input
                  type="text"
                  value={form.guests}
                  onChange={(e) => setForm({ ...form, guests: e.target.value })}
                  placeholder="Names and designations of invited guests..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
                />
              </div>
            </div>
          </div>

          {/* TICKETING & ENTRY */}
          <div className="mb-6 p-4 border border-gray-200 rounded-xl bg-gray-50">
            <label className="block text-sm font-bold text-gray-800 mb-3 uppercase">Ticketing & Entry</label>
            
            <div className="flex gap-6 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="entryType" 
                  value="free" 
                  checked={!isPaid}
                  onChange={() => {
                    setIsPaid(false);
                    setTicketPrice('');
                  }}
                  className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                />
                <span className="font-semibold text-gray-700">Free Entry</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="entryType" 
                  value="paid"
                  checked={isPaid}
                  onChange={() => setIsPaid(true)}
                  className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                />
                <span className="font-semibold text-gray-700">Paid Event</span>
              </label>
            </div>

            {/* Conditionally reveal the price input if "Paid" is selected */}
            {isPaid && (
              <div className="mt-4 animate-fade-in-down">
                <label className="block text-sm font-bold text-gray-700 mb-2">Ticket Price (PKR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500 font-bold">Rs.</span>
                  <input 
                    type="number" 
                    min="10"
                    required={isPaid}
                    value={ticketPrice}
                    onChange={(e) => setTicketPrice(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 5: REQUIREMENTS & FACILITIES */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-indigo-700 border-b border-slate-200 pb-1.5">
              5. Requirements & Logistics
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              {DEFAULT_FACILITIES.map((facility) => {
                const isSelected = selectedFacilities.includes(facility);
                return (
                  <label
                    key={facility}
                    onClick={() => toggleFacility(facility)}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition select-none ${
                      isSelected 
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="w-3.5 h-3.5 rounded text-indigo-600"
                    />
                    <span className="truncate">{facility}</span>
                  </label>
                );
              })}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={customFacility}
                onChange={(e) => setCustomFacility(e.target.value)}
                placeholder="Add other custom facility requirement..."
                className="w-full p-2 rounded-xl border border-slate-300 font-medium"
              />
              <button
                type="button"
                onClick={handleAddCustomFacility}
                className="bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2 rounded-xl font-bold shrink-0 transition cursor-pointer"
              >
                + Add
              </button>
            </div>
          </div>

          {/* SECTION 6: BUDGET ESTIMATE TABLE */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                <DollarSign size={14} /> 6. Budget Estimate
              </h3>
              <button
                type="button"
                onClick={handleAddBudgetItem}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <Plus size={13} /> Add Line Item
              </button>
            </div>

            <div className="space-y-2 border border-slate-200 rounded-2xl p-3 bg-slate-50/50">
              {budgetItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-xl border border-slate-200">
                  <div className="col-span-4">
                    <input
                      type="text"
                      placeholder="Item Title"
                      value={item.item}
                      onChange={(e) => handleUpdateBudgetItem(index, 'item', e.target.value)}
                      className="w-full p-1.5 rounded-lg border border-slate-300 font-semibold"
                    />
                  </div>
                  <div className="col-span-5">
                    <input
                      type="text"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => handleUpdateBudgetItem(index, 'description', e.target.value)}
                      className="w-full p-1.5 rounded-lg border border-slate-300"
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="relative">
                      <span className="absolute left-2 top-1.5 text-slate-400 font-bold">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={item.cost}
                        onChange={(e) => handleUpdateBudgetItem(index, 'cost', e.target.value)}
                        className="w-full pl-6 p-1.5 rounded-lg border border-slate-300 font-mono font-bold text-right"
                      />
                    </div>
                  </div>
                  <div className="col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveBudgetItem(index)}
                      className="text-slate-400 hover:text-rose-600 transition p-1 cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between pt-2 px-2 font-bold text-xs text-slate-900">
                <span className="uppercase tracking-wider">Total Proposed Budget:</span>
                <span className="font-mono text-sm text-indigo-700 font-black">PKR {totalBudget.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* SECTION 7 & 8: FUNDING SOURCE & EXPECTED OUTCOME */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">7. Funding Source</label>
              <input
                type="text"
                value={form.funding_source}
                onChange={(e) => setForm({ ...form, funding_source: e.target.value })}
                placeholder="e.g. Society Account / Department Grant"
                className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">8. Expected Outcome</label>
              <input
                type="text"
                value={form.expected_outcome}
                onChange={(e) => setForm({ ...form, expected_outcome: e.target.value })}
                placeholder="Key deliverables and impact..."
                className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
              />
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold transition cursor-pointer shadow-lg shadow-indigo-600/30 flex items-center gap-2"
            >
              <CheckCircle2 size={16} />
              {isSubmitting ? 'Generating Official Proposal...' : 'Generate Proposal & PDF'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
