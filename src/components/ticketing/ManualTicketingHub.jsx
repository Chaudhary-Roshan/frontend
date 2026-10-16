import React, { useState } from 'react';
import { 
  Ticket, Layers, CheckCircle2, AlertCircle, RefreshCw, 
  Upload, Check, UserCheck, Lock, Globe, AlertTriangle, 
  ShieldCheck, ShieldAlert, Sparkles, FileSpreadsheet, XCircle
} from 'lucide-react';
import api from '../../utils/api';

const ManualTicketingHub = ({ 
  events = [], 
  eventId: initialEventId = '', 
  onTicketsIssued = () => {} 
}) => {
  // Shared Target Event State
  const [selectedEventId, setSelectedEventId] = useState(initialEventId || '');
  const [viewMode, setViewMode] = useState('all'); // 'all' | 'single' | 'bulk'

  // Single Issuance State
  const [rollNumber, setRollNumber] = useState('');
  const [studentDetails, setStudentDetails] = useState(null);
  const [singleError, setSingleError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isIssuingSingle, setIsIssuingSingle] = useState(false);
  const [allowOverride, setAllowOverride] = useState(false);

  // Bulk Engine State
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkReport, setBulkReport] = useState(null);
  const [isUploadingBulk, setIsUploadingBulk] = useState(false);
  const [bulkAllowOverride, setBulkAllowOverride] = useState(false);
  const [bulkActiveTab, setBulkActiveTab] = useState('summary'); // 'summary' | 'ineligible' | 'failed'

  const activeEventId = initialEventId || selectedEventId;
  const currentEvent = events.find(ev => String(ev.id) === String(activeEventId));

  // Step 1: Verify the student exists and check event eligibility
  const verifyStudent = async () => {
    if (!rollNumber.trim()) {
      setSingleError('Please enter a roll number.');
      setStudentDetails(null);
      return;
    }
    setIsVerifying(true);
    setSingleError('');
    setAllowOverride(false);
    try {
      const params = activeEventId ? { event_id: activeEventId } : {};
      const res = await api.get(`/users/verify/${encodeURIComponent(rollNumber.trim())}/`, { params });
      setStudentDetails(res.data);
      setSingleError('');
    } catch (err) {
      setSingleError(err.response?.data?.error || 'Student not found. Check the roll number.');
      setStudentDetails(null);
    } finally {
      setIsVerifying(false);
    }
  };

  // Step 2: Issue individual cash ticket (or executive guest pass if overridden)
  const issueSingleTicket = async () => {
    if (!activeEventId) {
      alert('Please select a target event first before issuing a ticket.');
      return;
    }
    if (!studentDetails) return;

    setIsIssuingSingle(true);
    try {
      const res = await api.post('/tickets/manual-issue/', {
        eventId: activeEventId,
        userId: studentDetails.id,
        paymentMethod: 'CASH',
        allow_override: allowOverride
      });
      const passTitle = allowOverride ? 'Special Guest Pass' : 'Ticket';
      alert(`Success: ${passTitle} issued for ${studentDetails.name}! It is now active on their student portal.`);
      setStudentDetails(null);
      setRollNumber('');
      setSingleError('');
      setAllowOverride(false);
      onTicketsIssued();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to issue ticket. They might already be registered.');
    } finally {
      setIsIssuingSingle(false);
    }
  };

  // Bulk Upload Action
  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!activeEventId) {
      alert('Please select a target event first.');
      return;
    }
    if (!bulkFile) {
      alert('Please select a CSV or Excel file.');
      return;
    }

    setIsUploadingBulk(true);
    const formData = new FormData();
    formData.append('csv_file', bulkFile);
    formData.append('event_id', activeEventId);
    if (bulkAllowOverride) {
      formData.append('allow_override', 'true');
    }

    try {
      const response = await api.post('/tickets/bulk-issue', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const data = response.data;
      setBulkReport({
        successful: Array.isArray(data.successful) ? data.successful : [],
        failed: Array.isArray(data.failed) ? data.failed : (data.failedRollNumbers || []),
        ineligible: Array.isArray(data.ineligible) ? data.ineligible : [],
        alreadyRegistered: Array.isArray(data.already_registered) ? data.already_registered : [],
        notFound: Array.isArray(data.not_found) ? data.not_found : [],
        capacityReached: Array.isArray(data.capacity_reached) ? data.capacity_reached : [],
        message: data.message
      });
      onTicketsIssued();
    } catch (error) {
      alert(error.response?.data?.error || error.response?.data?.detail || 'Upload failed.');
    } finally {
      setIsUploadingBulk(false);
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
      {/* ── CARD HEADER & VIEW MODE SELECTOR ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <Ticket size={20} />
            </span>
            Manual Cash Ticketing & Bulk Engine
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Smart on-desk registration booth: verifies student eligibility, protects cash collection, and batch-issues encrypted QR entry passes.
          </p>
        </div>

        {/* View mode toggle pills */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl self-start md:self-auto text-xs font-semibold text-gray-600">
          <button
            type="button"
            onClick={() => setViewMode('all')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              viewMode === 'all' ? 'bg-white text-gray-900 font-bold shadow-sm' : 'hover:text-gray-900'
            }`}
          >
            All-in-One
          </button>
          <button
            type="button"
            onClick={() => setViewMode('single')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
              viewMode === 'single' ? 'bg-white text-gray-900 font-bold shadow-sm' : 'hover:text-gray-900'
            }`}
          >
            <Ticket size={12} />
            Single Ticket
          </button>
          <button
            type="button"
            onClick={() => setViewMode('bulk')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
              viewMode === 'bulk' ? 'bg-white text-gray-900 font-bold shadow-sm' : 'hover:text-gray-900'
            }`}
          >
            <Layers size={12} />
            Bulk Upload
          </button>
        </div>
      </div>

      {/* ── SHARED TARGET EVENT SELECTION ── */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
          Target Event *
        </label>
        <div className="relative">
          <select
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              setStudentDetails(null);
              setSingleError('');
            }}
            className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 hover:bg-white focus:bg-white text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-purple-500 transition"
          >
            <option value="">-- Choose an Event --</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title} {ev.is_paid ? `(Rs. ${ev.price || ev.ticket_price || 0})` : '(Free)'} {ev.eligibility_type === 'restricted' ? '🔒 [Restricted]' : '🌐 [Open]'}
              </option>
            ))}
          </select>
        </div>

        {/* Dynamic Event Scope Banner */}
        {currentEvent && (
          <div className={`mt-3 p-3.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            currentEvent.eligibility_type === 'restricted'
              ? 'bg-amber-50/80 border-amber-200 text-amber-950'
              : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
          }`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  currentEvent.eligibility_type === 'restricted'
                    ? 'bg-amber-600 text-white'
                    : 'bg-emerald-600 text-white'
                }`}>
                  {currentEvent.eligibility_type === 'restricted' ? '🔒 Program Restricted Event' : '🌐 Open Campus Event'}
                </span>
                <span className="font-bold text-slate-800">
                  {currentEvent.title}
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                {currentEvent.eligibility_type === 'restricted' ? (
                  <>
                    <strong className="text-amber-900">Allowed Programs: </strong>
                    {Array.isArray(currentEvent.allowed_programs) && currentEvent.allowed_programs.length > 0
                      ? currentEvent.allowed_programs.join(', ')
                      : (currentEvent.allowed_departments?.join(', ') || 'Restricted Academic Programs')}
                  </>
                ) : (
                  'Open to all enrolled university students across all departments and faculties.'
                )}
              </p>
            </div>

            {currentEvent.is_paid && (
              <div className="bg-white/90 px-3 py-1.5 rounded-xl border border-slate-200 font-mono text-xs font-bold text-slate-800 shrink-0 text-center sm:text-right shadow-xs">
                Entry Fee: <span className="text-emerald-700 font-black">Rs. {currentEvent.price || currentEvent.ticket_price || 0}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── SECTION 1: SINGLE CASH PAYMENT REGISTRATION ── */}
      {(viewMode === 'all' || viewMode === 'single') && (
        <div className="pt-2 border-t border-gray-100">
          <div className="mb-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              Single Cash Payment Registration
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Enter student roll number to verify identity and confirm department compliance before receiving cash payment.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="ENTER ROLL NUMBER (E.G., FA22-BCS-042)"
              value={rollNumber}
              onChange={(e) => {
                setRollNumber(e.target.value);
                setSingleError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && verifyStudent()}
              className="flex-1 border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-purple-500 uppercase text-sm font-mono tracking-wide outline-none transition"
            />
            <button
              type="button"
              onClick={verifyStudent}
              disabled={isVerifying}
              className="bg-slate-900 hover:bg-slate-800 text-white px-7 py-3 rounded-xl font-bold text-sm disabled:opacity-50 transition cursor-pointer shadow-sm shrink-0 flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="animate-spin" size={14} />
                  Verifying...
                </>
              ) : (
                'Verify Student'
              )}
            </button>
          </div>

          {singleError && (
            <p className="text-rose-600 text-xs mt-2 font-bold flex items-center gap-1">
              <AlertCircle size={13} />
              {singleError}
            </p>
          )}

          {/* SMART STUDENT VERIFICATION & TRAFFIC LIGHT CARD */}
          {studentDetails && (
            <div className={`mt-4 p-5 rounded-2xl border transition animate-in fade-in duration-200 ${
              studentDetails.is_eligible
                ? 'bg-emerald-50/70 border-emerald-300 shadow-xs'
                : 'bg-amber-50/80 border-amber-300 shadow-xs'
            }`}>
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                
                {/* Student Identity Information */}
                <div className="flex items-start gap-3.5">
                  <div className={`w-11 h-11 rounded-xl text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0 ${
                    studentDetails.is_eligible ? 'bg-emerald-600' : 'bg-amber-600'
                  }`}>
                    {studentDetails.is_eligible ? <UserCheck size={20} /> : <AlertTriangle size={20} />}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-base">
                        {studentDetails.name}
                      </span>
                      <span className="font-mono text-xs text-slate-600 font-semibold bg-white/80 px-2 py-0.5 rounded-md border">
                        {studentDetails.roll_number}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        studentDetails.is_eligible
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-600 text-white'
                      }`}>
                        {studentDetails.is_eligible ? '✓ Eligible for Event' : '⚠️ Program Mismatch'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700">
                      <strong>Department: </strong>{studentDetails.department || 'Not Specified'}
                      {studentDetails.program && (
                        <span> • <strong>Program: </strong>{studentDetails.program}</span>
                      )}
                    </p>

                    {/* Ineligibility Warning & Reason */}
                    {!studentDetails.is_eligible && (
                      <p className="text-xs text-amber-900 font-medium pt-1 bg-amber-100/60 p-2 rounded-lg border border-amber-200">
                        {studentDetails.eligibility_reason || 'This event is restricted to a different department/program.'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Issuance Action Buttons & Executive Override */}
                <div className="flex flex-col items-end gap-2.5 shrink-0">
                  {!studentDetails.is_eligible && (
                    <label className="flex items-center gap-2 text-xs font-bold text-amber-950 bg-white/90 px-3 py-1.5 rounded-xl border border-amber-300 cursor-pointer shadow-2xs hover:bg-white">
                      <input
                        type="checkbox"
                        checked={allowOverride}
                        onChange={(e) => setAllowOverride(e.target.checked)}
                        className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                      />
                      <span>Executive Override: Authorize VIP / Guest Pass</span>
                    </label>
                  )}

                  <button
                    type="button"
                    onClick={issueSingleTicket}
                    disabled={isIssuingSingle || (!studentDetails.is_eligible && !allowOverride)}
                    className={`px-5 py-2.5 rounded-xl font-bold transition text-xs cursor-pointer shadow-sm flex items-center justify-center gap-2 shrink-0 ${
                      studentDetails.is_eligible
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                        : allowOverride
                          ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                    }`}
                  >
                    {isIssuingSingle ? (
                      <>
                        <RefreshCw className="animate-spin" size={14} />
                        Issuing Ticket...
                      </>
                    ) : !studentDetails.is_eligible && !allowOverride ? (
                      <>
                        <Lock size={14} />
                        Registration Restricted
                      </>
                    ) : allowOverride ? (
                      <>
                        <Sparkles size={14} />
                        Confirm Cash & Issue Executive Guest Pass
                      </>
                    ) : (
                      <>
                        <Check size={14} />
                        Confirm Cash Received & Issue Ticket
                      </>
                    )}
                  </button>
                </div>

              </div>
            </div>
          )}
        </div>
      )}

      {/* ── DIVIDER (When displaying both sections) ── */}
      {viewMode === 'all' && (
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 font-bold text-gray-400 tracking-wider">
              Or Batch Processing
            </span>
          </div>
        </div>
      )}

      {/* ── SECTION 2: BULK TICKETING ENGINE ── */}
      {(viewMode === 'all' || viewMode === 'bulk') && (
        <div className="pt-2">
          <div className="mb-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              Bulk Ticketing Engine
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Upload a spreadsheet of student roll numbers. The engine automatically filters by department eligibility, verifies profiles, and batch-issues encrypted QR entry passes.
            </p>
          </div>

          <form onSubmit={handleBulkUpload} className="space-y-4">
            {/* File Upload Zone */}
            <div className="border-2 border-dashed border-gray-300 hover:border-purple-400 p-6 rounded-2xl text-center bg-gray-50/50 hover:bg-purple-50/20 transition cursor-pointer">
              <input
                type="file"
                accept=".csv, .xlsx, .xls, .txt"
                required
                onChange={(e) => setBulkFile(e.target.files[0])}
                className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200 cursor-pointer"
              />
              <p className="text-xs text-gray-500 mt-2 font-medium">
                Upload a CSV or Excel spreadsheet containing student roll numbers.
              </p>
            </div>

            {/* Optional Bulk Executive Override */}
            {currentEvent?.eligibility_type === 'restricted' && (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                <span className="text-amber-950 font-medium">
                  <strong>Notice:</strong> Ineligible students outside the target programs will be automatically skipped unless overridden.
                </span>
                <label className="flex items-center gap-2 font-bold text-amber-950 shrink-0 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bulkAllowOverride}
                    onChange={(e) => setBulkAllowOverride(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Allow Guest Passes for entire batch</span>
                </label>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isUploadingBulk || !activeEventId || !bulkFile}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl disabled:opacity-50 transition cursor-pointer shadow-md shadow-purple-600/20 text-sm flex items-center justify-center gap-2"
            >
              {isUploadingBulk ? (
                <>
                  <RefreshCw className="animate-spin" size={15} />
                  Processing Batch File...
                </>
              ) : (
                'Parse & Issue Bulk Tickets'
              )}
            </button>
          </form>

          {/* SMART CATEGORIZED BATCH PROCESSING REPORT */}
          {bulkReport && (
            <div className="mt-6 p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                <h4 className="font-bold text-base text-gray-900 flex items-center gap-2">
                  <FileSpreadsheet size={18} className="text-purple-600" />
                  Batch Processing Diagnostic Report
                </h4>
                <span className="text-xs text-slate-500 font-medium">
                  {bulkReport.message}
                </span>
              </div>

              {/* KPI Scorecards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div 
                  onClick={() => setBulkActiveTab('summary')}
                  className={`p-3 rounded-xl border cursor-pointer transition ${
                    bulkActiveTab === 'summary' ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400' : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">Issued</span>
                  <p className="text-xl font-black text-emerald-700 mt-0.5">{bulkReport.successful.length}</p>
                </div>

                <div 
                  onClick={() => setBulkActiveTab('ineligible')}
                  className={`p-3 rounded-xl border cursor-pointer transition ${
                    bulkActiveTab === 'ineligible' ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400' : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider">Ineligible</span>
                  <p className="text-xl font-black text-amber-700 mt-0.5">{bulkReport.ineligible?.length || 0}</p>
                </div>

                <div 
                  onClick={() => setBulkActiveTab('alreadyRegistered')}
                  className={`p-3 rounded-xl border cursor-pointer transition ${
                    bulkActiveTab === 'alreadyRegistered' ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-400' : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase text-blue-800 tracking-wider">Registered</span>
                  <p className="text-xl font-black text-blue-700 mt-0.5">{bulkReport.alreadyRegistered?.length || 0}</p>
                </div>

                <div 
                  onClick={() => setBulkActiveTab('notFound')}
                  className={`p-3 rounded-xl border cursor-pointer transition ${
                    bulkActiveTab === 'notFound' ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400' : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase text-rose-800 tracking-wider">Not Found</span>
                  <p className="text-xl font-black text-rose-700 mt-0.5">{bulkReport.notFound?.length || 0}</p>
                </div>
              </div>

              {/* Tab Details */}
              <div className="bg-white border border-slate-200 p-4 rounded-xl max-h-48 overflow-y-auto text-xs">
                {bulkActiveTab === 'summary' && (
                  <div>
                    <h5 className="font-bold text-emerald-800 mb-2 flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-600" />
                      Successfully Issued Tickets ({bulkReport.successful.length}):
                    </h5>
                    {bulkReport.successful.length === 0 ? (
                      <p className="text-slate-400 italic">No tickets issued in this batch.</p>
                    ) : (
                      <ul className="list-disc pl-5 space-y-1 font-mono text-slate-700">
                        {bulkReport.successful.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {bulkActiveTab === 'ineligible' && (
                  <div>
                    <h5 className="font-bold text-amber-800 mb-2 flex items-center gap-1.5">
                      <Lock size={14} className="text-amber-600" />
                      Ineligible Students Skipped ({bulkReport.ineligible?.length || 0}):
                    </h5>
                    {(!bulkReport.ineligible || bulkReport.ineligible.length === 0) ? (
                      <p className="text-slate-400 italic">Zero students were rejected due to department ineligibility.</p>
                    ) : (
                      <ul className="list-disc pl-5 space-y-1 font-mono text-amber-900">
                        {bulkReport.ineligible.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {bulkActiveTab === 'alreadyRegistered' && (
                  <div>
                    <h5 className="font-bold text-blue-800 mb-2 flex items-center gap-1.5">
                      <Check size={14} className="text-blue-600" />
                      Already Registered Students ({bulkReport.alreadyRegistered?.length || 0}):
                    </h5>
                    {(!bulkReport.alreadyRegistered || bulkReport.alreadyRegistered.length === 0) ? (
                      <p className="text-slate-400 italic">No duplicates detected.</p>
                    ) : (
                      <ul className="list-disc pl-5 space-y-1 font-mono text-blue-900">
                        {bulkReport.alreadyRegistered.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {bulkActiveTab === 'notFound' && (
                  <div>
                    <h5 className="font-bold text-rose-800 mb-2 flex items-center gap-1.5">
                      <XCircle size={14} className="text-rose-600" />
                      Roll Numbers Not Found in Directory ({bulkReport.notFound?.length || 0}):
                    </h5>
                    {(!bulkReport.notFound || bulkReport.notFound.length === 0) ? (
                      <p className="text-slate-400 italic">All roll numbers were found in university directory.</p>
                    ) : (
                      <ul className="list-disc pl-5 space-y-1 font-mono text-rose-700">
                        {bulkReport.notFound.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ManualTicketingHub;
