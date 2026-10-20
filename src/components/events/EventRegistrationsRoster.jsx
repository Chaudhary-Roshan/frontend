import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../../utils/api';
import { getMediaUrl } from '../../utils/media';
import { MediaImage, MediaLink } from '../common/AuthenticatedMedia';
import { generateEventAttendancePdf } from '../../utils/officialPdfGenerator';
import {
  Users, Ticket, CheckCircle2, XCircle, Clock, Search, Filter,
  Download, FileSpreadsheet, FileText, RefreshCw, Eye, AlertCircle,
  Calendar, MapPin, DollarSign, UserCheck, ShieldCheck, User, Mail,
  Phone, GraduationCap, X, ChevronRight, BarChart3, ArrowUpDown, Maximize2
} from 'lucide-react';

const EventRegistrationsRoster = ({ 
  events = [], 
  initialEventId = null,
  onEventChange = () => {} 
}) => {
  const [selectedEventId, setSelectedEventId] = useState(initialEventId || (events[0]?.id ? String(events[0].id) : ''));
  const [registrations, setRegistrations] = useState([]);
  const [eventStats, setEventStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'verified' | 'pending' | 'attended' | 'absent'
  const [selectedAttendee, setSelectedAttendee] = useState(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const location = useLocation();
  const isFullScreenPage = Boolean(location?.pathname?.includes('event-records'));

  // Sync selectedEventId if initialEventId changes
  useEffect(() => {
    if (initialEventId && initialEventId !== selectedEventId) {
      setSelectedEventId(String(initialEventId));
    } else if (!selectedEventId && events.length > 0) {
      setSelectedEventId(String(events[0].id));
    }
  }, [initialEventId, events]);

  // Fetch registrations and real-time stats whenever selected event changes
  useEffect(() => {
    if (selectedEventId) {
      fetchEventData(selectedEventId);
      onEventChange(selectedEventId);
    }
  }, [selectedEventId]);

  const activeEvent = useMemo(() => {
    return events.find(e => String(e.id) === String(selectedEventId)) || null;
  }, [events, selectedEventId]);

  const isEventConcluded = Boolean(activeEvent?.is_expired || (activeEvent?.date && new Date(activeEvent.date) < new Date()));

  const fetchEventData = async (eventId) => {
    if (!eventId) return;
    setLoading(true);
    try {
      // 1. Fetch Registrations for this event
      const regRes = await api.get(`registrations/?event=${eventId}`);
      const regData = Array.isArray(regRes.data) ? regRes.data : (regRes.data?.results || []);
      setRegistrations(regData);

      // 2. Fetch or compute real-time event stats
      try {
        const statsRes = await api.get(`events/${eventId}/registration_stats/`);
        setEventStats(statsRes.data);
      } catch (statsErr) {
        // Fallback: calculate stats locally from registration array
        const total = regData.length;
        const verified = regData.filter(r => r.payment_status === 'verified').length;
        const pending = regData.filter(r => ['pending', 'held'].includes(r.payment_status)).length;
        const attended = regData.filter(r => r.attendance_status).length;
        const capacity = activeEvent?.expected_attendees || activeEvent?.capacity || 100;
        const price = parseFloat(activeEvent?.price || activeEvent?.ticket_price || 0);

        setEventStats({
          event_id: eventId,
          total_registrations: total,
          verified_registrations: verified,
          pending_registrations: pending,
          attended_registrations: attended,
          capacity: capacity,
          capacity_remaining: Math.max(0, capacity - verified),
          capacity_percentage: capacity > 0 ? Math.min(100, Math.round((verified / capacity) * 100)) : 0,
          attendance_rate: verified > 0 ? Math.round((attended / verified) * 100) : 0,
          revenue_collected: activeEvent?.is_paid ? Math.round(verified * price) : 0
        });
      }
    } catch (err) {
      console.error('Failed to load event registrations:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchEventData(selectedEventId);
  };

  // Filtered registrations
  const filteredRegistrations = useMemo(() => {
    return registrations.filter(reg => {
      const q = searchQuery.toLowerCase().trim();
      const studentName = (reg.student_name || reg.student?.username || '').toLowerCase();
      const rollNo = (reg.student_roll_number || reg.student?.roll_number || '').toLowerCase();
      const ticketId = (reg.ticket_number || '').toLowerCase();
      const txnId = (reg.transaction_id || '').toLowerCase();
      const dept = (reg.student_department || reg.student?.department || '').toLowerCase();

      const matchesSearch = !q || studentName.includes(q) || rollNo.includes(q) || ticketId.includes(q) || txnId.includes(q) || dept.includes(q);

      let matchesStatus = true;
      if (statusFilter === 'verified') {
        matchesStatus = reg.payment_status === 'verified';
      } else if (statusFilter === 'pending') {
        matchesStatus = ['pending', 'held'].includes(reg.payment_status);
      } else if (statusFilter === 'attended') {
        matchesStatus = Boolean(reg.attendance_status);
      } else if (statusFilter === 'absent') {
        matchesStatus = !reg.attendance_status && reg.payment_status === 'verified';
      }

      return matchesSearch && matchesStatus;
    });
  }, [registrations, searchQuery, statusFilter]);

  // Export to CSV Spreadsheet
  const exportToCsv = () => {
    if (!activeEvent || registrations.length === 0) {
      alert('No registration data available to export.');
      return;
    }

    const headers = [
      'S.No',
      'Roll Number',
      'Student Name',
      'Email',
      'Phone Number',
      'Faculty',
      'Department',
      'Degree Program',
      'Batch',
      'Semester',
      'Ticket Number',
      'Registration Type',
      'Amount (PKR)',
      'Transaction ID',
      'Payment Status',
      'Venue Attendance',
      'Check-in Time',
      'Registered At'
    ];

    const rows = filteredRegistrations.map((r, idx) => [
      idx + 1,
      r.student_roll_number || r.student?.roll_number || '',
      `"${(r.student_name || r.student?.username || '').replace(/"/g, '""')}"`,
      r.student_email || r.student?.email || '',
      r.student_phone || r.student?.phone_number || '',
      `"${(r.student_faculty || r.student?.faculty_name || '').replace(/"/g, '""')}"`,
      `"${(r.student_department || r.student?.department || '').replace(/"/g, '""')}"`,
      `"${(r.student_program || r.student?.program || '').replace(/"/g, '""')}"`,
      r.student_batch || r.student?.batch || '',
      r.student_semester || r.student?.semester || '',
      r.ticket_number || `TKT-${r.id}`,
      activeEvent.is_paid ? 'Paid Ticket' : 'Free Pass',
      activeEvent.is_paid ? (r.amount || activeEvent.price || 0) : 0,
      r.transaction_id || '',
      r.payment_status || '',
      r.attendance_status ? 'Checked In' : 'Absent',
      r.checked_in_at ? new Date(r.checked_in_at).toLocaleString() : '',
      r.created_at ? new Date(r.created_at).toLocaleString() : ''
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeTitle = (activeEvent.title || 'event').replace(/[^a-zA-Z0-9_-]/g, '_');
    link.setAttribute('download', `Registrations_${safeTitle}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export to Official Institutional PDF Roster
  const handleExportPdf = async () => {
    if (!activeEvent) return;
    setIsExportingPdf(true);
    try {
      await generateEventAttendancePdf({
        event: activeEvent,
        registrations: filteredRegistrations
      });
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Failed to generate PDF roster. Please try again.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const capacityTotal = eventStats?.capacity || activeEvent?.expected_attendees || 100;
  const verifiedCount = eventStats?.verified_registrations ?? registrations.filter(r => r.payment_status === 'verified').length;
  const totalCount = eventStats?.total_registrations ?? registrations.length;
  const pendingCount = eventStats?.pending_registrations ?? registrations.filter(r => ['pending', 'held'].includes(r.payment_status)).length;
  const attendedCount = eventStats?.attended_registrations ?? registrations.filter(r => r.attendance_status).length;
  const turnoutRate = verifiedCount > 0 ? Math.round((attendedCount / verifiedCount) * 100) : 0;
  const revenueTotal = eventStats?.revenue_collected ?? (activeEvent?.is_paid ? verifiedCount * parseFloat(activeEvent.price || 0) : 0);
  const capacityPercent = capacityTotal > 0 ? Math.min(100, Math.round((verifiedCount / capacityTotal) * 100)) : 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* ── HEADER & EVENT SELECTOR ── */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-400/30">
              <BarChart3 size={20} />
            </span>
            <h2 className="text-xl font-bold tracking-tight text-white">Event Registration & Attendance Registry</h2>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Audit attendee lists, export attendance sheets to PDF/Excel, monitor ticket sale revenues, and check-in audit records.
          </p>
        </div>

        {/* Action Controls & Event Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[240px]">
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full bg-slate-800/90 text-white font-semibold text-xs py-2 px-3 pr-8 rounded-xl border border-slate-700 outline-none focus:border-indigo-400 cursor-pointer appearance-none shadow-inner"
            >
              {events.length === 0 ? (
                <option value="">No Events Available</option>
              ) : (
                events.map(ev => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} ({ev.is_paid ? `PKR ${ev.price}` : 'Free'})
                  </option>
                ))
              )}
            </select>
            <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer disabled:opacity-50"
            title="Refresh Registration Data"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          </button>

          <button
            type="button"
            onClick={exportToCsv}
            disabled={registrations.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
            title="Download Attendee Spreadsheet"
          >
            <FileSpreadsheet size={14} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExportingPdf || registrations.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
            title="Print Official Institutional Attendance Roster"
          >
            <FileText size={14} />
            <span>{isExportingPdf ? 'Generating PDF...' : 'Official PDF Roster'}</span>
          </button>

          {!isFullScreenPage && (
            <Link
              to={selectedEventId ? `/event-records?event=${selectedEventId}` : '/event-records'}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600/90 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm cursor-pointer whitespace-nowrap"
              title="Open Full Screen Registry"
            >
              <Maximize2 size={14} />
              <span>Full Screen</span>
            </Link>
          )}
        </div>
      </div>

      {/* ── REAL-TIME KPI METRICS TILES ── */}
      <div className="p-6 bg-slate-50 border-b border-gray-200">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Tile 1: Total Registrations */}
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Total Signups</span>
              <Ticket size={14} className="text-purple-600" />
            </div>
            <p className="text-2xl font-black text-gray-900">{totalCount}</p>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded mt-1 inline-block">
              {activeEvent?.is_paid ? 'Paid Admissions' : 'Free Entry'}
            </span>
          </div>

          {/* Tile 2: Confirmed & Ticketed */}
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Confirmed</span>
              <CheckCircle2 size={14} className="text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-700">{verifiedCount}</p>
            <span className="text-[10px] font-bold text-gray-500">
              {totalCount > 0 ? `${Math.round((verifiedCount / totalCount) * 100)}% verified` : '0%'}
            </span>
          </div>

          {/* Tile 3: Pending Slip Verification */}
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Pending Slips</span>
              <Clock size={14} className="text-amber-600" />
            </div>
            <p className="text-2xl font-black text-amber-700">{pendingCount}</p>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded mt-1 inline-block">
              Awaiting Review
            </span>
          </div>

          {/* Tile 4: Venue Turnout / Attended */}
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Gate Check-ins</span>
              <UserCheck size={14} className="text-blue-600" />
            </div>
            <p className="text-2xl font-black text-blue-700">{attendedCount}</p>
            <span className="text-[10px] font-bold text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded mt-1 inline-block">
              Turnout: {turnoutRate}%
            </span>
          </div>

          {/* Tile 5: Capacity Gauge */}
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Capacity Fill</span>
              <Users size={14} className="text-indigo-600" />
            </div>
            <p className="text-xl font-black text-gray-900">
              {verifiedCount} <span className="text-xs font-semibold text-gray-400">/ {capacityTotal}</span>
            </p>
            <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  capacityPercent >= 90 ? 'bg-rose-500' : capacityPercent >= 75 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${capacityPercent}%` }}
              />
            </div>
          </div>

          {/* Tile 6: Revenue Collected */}
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Gross Revenue</span>
              <DollarSign size={14} className="text-emerald-600" />
            </div>
            <p className="text-xl font-black text-emerald-700">
              PKR {revenueTotal.toLocaleString()}
            </p>
            <span className="text-[10px] font-medium text-gray-400">
              {activeEvent?.is_paid ? `@ PKR ${activeEvent.price}/ticket` : 'Free Event'}
            </span>
          </div>
        </div>
      </div>

      {/* ── SEARCH, FILTER & TAB CONTROLS ── */}
      <div className="p-4 bg-white border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3">
        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name, roll number, ticket ID..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-indigo-500 focus:bg-white transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: `All (${registrations.length})` },
            { id: 'verified', label: `Confirmed (${verifiedCount})` },
            { id: 'pending', label: `Pending (${pendingCount})` },
            { id: 'attended', label: `Checked In (${attendedCount})` },
            { 
              id: 'absent', 
              label: isEventConcluded 
                ? `Absent (${Math.max(0, verifiedCount - attendedCount)})` 
                : `Awaiting Arrival (${Math.max(0, verifiedCount - attendedCount)})` 
            }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── PARTICIPANT ROSTER TABLE ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50 text-gray-600 font-bold uppercase tracking-wider border-b border-gray-200 text-[11px]">
              <th className="py-3 px-4">#</th>
              <th className="py-3 px-4">Student Details</th>
              <th className="py-3 px-4">Department & Degree Program</th>
              <th className="py-3 px-4">Ticket & Payment</th>
              <th className="py-3 px-4">Verification Status</th>
              <th className="py-3 px-4">Gate Check-in</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-gray-500 font-medium">
                  <RefreshCw className="animate-spin inline mr-2 text-indigo-600" size={16} />
                  Loading attendee records...
                </td>
              </tr>
            ) : filteredRegistrations.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-10 text-center text-gray-400">
                  <Users size={32} className="mx-auto mb-2 text-gray-300" />
                  <p className="font-semibold text-gray-600 text-sm">No attendee records match your criteria.</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {searchQuery || statusFilter !== 'all' 
                      ? 'Try clearing the search or switching filters.' 
                      : 'No students have signed up for this event yet.'}
                  </p>
                </td>
              </tr>
            ) : (
              filteredRegistrations.map((reg, index) => {
                const studentName = reg.student_name || reg.student?.username || 'Student';
                const rollNo = reg.student_roll_number || reg.student?.roll_number || 'N/A';
                const email = reg.student_email || reg.student?.email || '';
                const dept = reg.student_department || reg.student?.department || 'General';
                const prog = reg.student_program || reg.student?.program || '';
                const ticketId = reg.ticket_number || (reg.id ? `TKT-${reg.id}` : 'PENDING');
                const isPaid = activeEvent?.is_paid;
                const isAttended = Boolean(reg.attendance_status);
                const isVerified = reg.payment_status === 'verified';
                const isPending = ['pending', 'held'].includes(reg.payment_status);
                const proofUrl = reg.receipt_file || reg.payment_proof_url || reg.payment_proof;

                return (
                  <tr key={reg.id || index} className="hover:bg-indigo-50/40 transition">
                    <td className="py-3 px-4 font-mono text-gray-400 font-semibold">{index + 1}</td>
                    
                    {/* Student Info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                          {studentName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-xs">{studentName}</p>
                          <p className="text-[11px] font-mono text-indigo-700 font-semibold">{rollNo}</p>
                          {email && <p className="text-[10px] text-gray-400 truncate max-w-[150px]">{email}</p>}
                        </div>
                      </div>
                    </td>

                    {/* Department / Program */}
                    <td className="py-3 px-4">
                      <p className="font-semibold text-gray-800 text-xs">{dept}</p>
                      {prog && <p className="text-[11px] text-gray-500 font-medium">{prog}</p>}
                    </td>

                    {/* Ticket & Payment Details */}
                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                        {ticketId}
                      </span>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                          isPaid ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {isPaid ? `Fee: PKR ${reg.amount || activeEvent.price}` : 'Free Pass'}
                        </span>
                        {reg.transaction_id && (
                          <span className="text-[10px] font-mono text-gray-400" title="Transaction ID">
                            Ref: {reg.transaction_id.slice(-6)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Verification Status */}
                    <td className="py-3 px-4">
                      {isVerified ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                          <CheckCircle2 size={12} className="text-emerald-600" />
                          <span>Verified</span>
                        </span>
                      ) : isPending ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                          <Clock size={12} className="text-amber-600" />
                          <span>Pending Review</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
                          <XCircle size={12} className="text-rose-600" />
                          <span>{reg.payment_status}</span>
                        </span>
                      )}
                    </td>

                    {/* Gate Check-in Status */}
                    <td className="py-3 px-4">
                      {isAttended ? (
                        <div>
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg">
                            <CheckCircle2 size={12} className="text-blue-600" />
                            <span>Checked In</span>
                          </span>
                          {reg.checked_in_at && (
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {new Date(reg.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                      ) : isEventConcluded ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-lg">
                          <XCircle size={12} className="text-rose-500" />
                          <span>Absent (Missed)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                          <Clock size={12} className="text-amber-500" />
                          <span>Awaiting Event Check-In</span>
                        </span>
                      )}
                    </td>

                    {/* Action Controls */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {proofUrl && proofUrl !== '#' && (
                          <MediaLink
                            href={getMediaUrl(proofUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 rounded-lg transition border border-purple-200"
                            title="View Transaction Proof"
                          >
                            <FileText size={13} />
                          </MediaLink>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedAttendee(reg)}
                          className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 font-bold text-xs border border-gray-200 transition cursor-pointer flex items-center gap-1"
                          title="View complete participant profile"
                        >
                          <Eye size={12} />
                          <span>Details</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── ATTENDEE DETAIL MODAL ── */}
      {selectedAttendee && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl border border-gray-200 my-8">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center font-bold text-base border border-white/20">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    {selectedAttendee.student_name || selectedAttendee.student?.username}
                  </h3>
                  <p className="text-xs text-indigo-300 font-mono">
                    Roll Number: {selectedAttendee.student_roll_number || selectedAttendee.student?.roll_number}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAttendee(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 text-xs">
              {/* Academic Profile */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
                <h4 className="font-bold text-gray-800 flex items-center gap-1.5 uppercase text-[11px] tracking-wider text-indigo-700">
                  <GraduationCap size={14} /> Academic Credentials
                </h4>
                <div className="grid grid-cols-2 gap-2 text-gray-700">
                  <div>
                    <span className="text-gray-400 block text-[10px]">Faculty</span>
                    <span className="font-semibold">{selectedAttendee.student_faculty || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Department</span>
                    <span className="font-semibold">{selectedAttendee.student_department || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Degree Program</span>
                    <span className="font-semibold">{selectedAttendee.student_program || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Batch & Semester</span>
                    <span className="font-semibold">{selectedAttendee.student_batch || 'Batch'} • Semester {selectedAttendee.student_semester || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
                <h4 className="font-bold text-gray-800 flex items-center gap-1.5 uppercase text-[11px] tracking-wider text-purple-700">
                  <Mail size={14} /> Contact Details
                </h4>
                <div className="grid grid-cols-2 gap-2 text-gray-700">
                  <div>
                    <span className="text-gray-400 block text-[10px]">Institutional Email</span>
                    <span className="font-semibold font-mono text-[11px]">{selectedAttendee.student_email || 'None'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Phone Number</span>
                    <span className="font-semibold font-mono text-[11px]">{selectedAttendee.student_phone || 'None'}</span>
                  </div>
                </div>
              </div>

              {/* Registration & Check-in Audit */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
                <h4 className="font-bold text-gray-800 flex items-center gap-1.5 uppercase text-[11px] tracking-wider text-emerald-700">
                  <ShieldCheck size={14} /> Registration & Ticketing Audit
                </h4>
                <div className="grid grid-cols-2 gap-2 text-gray-700">
                  <div>
                    <span className="text-gray-400 block text-[10px]">Ticket ID</span>
                    <span className="font-mono font-bold text-gray-900">{selectedAttendee.ticket_number || `TKT-${selectedAttendee.id}`}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Payment Verification</span>
                    <span className="font-bold text-emerald-700 capitalize">{selectedAttendee.payment_status}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Gate Attendance</span>
                    <span className="font-bold">{selectedAttendee.attendance_status ? 'Checked In' : 'Not Present'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Registration Date</span>
                    <span>{selectedAttendee.created_at ? new Date(selectedAttendee.created_at).toLocaleString() : 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Payment Proof View */}
              {(selectedAttendee.receipt_file || selectedAttendee.payment_proof_url) && (
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-purple-900 text-xs">Payment Slip Attached</p>
                    <p className="text-[10px] text-purple-600 font-mono">Ref: {selectedAttendee.transaction_id || 'N/A'}</p>
                  </div>
                  <MediaLink
                    href={getMediaUrl(selectedAttendee.receipt_file || selectedAttendee.payment_proof_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs transition"
                  >
                    Open Slip
                  </MediaLink>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedAttendee(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventRegistrationsRoster;
