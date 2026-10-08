import React, { useState } from 'react';
import { Ticket, Layers, CheckCircle2, AlertCircle, RefreshCw, Upload, Check, UserCheck } from 'lucide-react';
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

  // Bulk Engine State
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkReport, setBulkReport] = useState(null);
  const [isUploadingBulk, setIsUploadingBulk] = useState(false);

  const activeEventId = initialEventId || selectedEventId;
  const currentEvent = events.find(ev => String(ev.id) === String(activeEventId));

  // Step 1: Verify the student exists by roll number
  const verifyStudent = async () => {
    if (!rollNumber.trim()) {
      setSingleError('Please enter a roll number.');
      setStudentDetails(null);
      return;
    }
    setIsVerifying(true);
    setSingleError('');
    try {
      const res = await api.get(`/users/verify/${encodeURIComponent(rollNumber.trim())}/`);
      setStudentDetails(res.data);
      setSingleError('');
    } catch (err) {
      setSingleError(err.response?.data?.error || 'Student not found. Check the roll number.');
      setStudentDetails(null);
    } finally {
      setIsVerifying(false);
    }
  };

  // Step 2: Issue individual cash ticket
  const issueSingleTicket = async () => {
    if (!activeEventId) {
      alert('Please select a target event first before issuing a ticket.');
      return;
    }
    if (!studentDetails) return;

    setIsIssuingSingle(true);
    try {
      await api.post('/tickets/manual-issue/', {
        eventId: activeEventId,
        userId: studentDetails.id,
        paymentMethod: 'CASH'
      });
      alert(`Ticket issued successfully for ${studentDetails.name}! It will now appear on their portal.`);
      setStudentDetails(null);
      setRollNumber('');
      setSingleError('');
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

    try {
      const response = await api.post('/tickets/bulk-issue', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const data = response.data;
      setBulkReport({
        successful: Array.isArray(data.successful) ? data.successful : [],
        failed: Array.isArray(data.failed) ? data.failed : (data.failedRollNumbers || [])
      });
      onTicketsIssued();
    } catch (error) {
      alert(error.response?.data?.error || error.response?.data?.detail || 'Upload failed.');
    } finally {
      setIsUploadingBulk(false);
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm">
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
            Issue individual cash tickets on the spot or process batch registrations using a spreadsheet.
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
      <div className="pt-6">
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
          Target Event *
        </label>
        <div className="relative">
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 hover:bg-white focus:bg-white text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-purple-500 transition"
          >
            <option value="">-- Choose an Event --</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title} {ev.is_paid ? `(Rs. ${ev.price || ev.ticket_price || 0})` : '(Free)'}
              </option>
            ))}
          </select>
        </div>
          {currentEvent && (
            <p className="text-xs text-purple-700 font-medium mt-1.5 flex items-center gap-1">
              <CheckCircle2 size={12} />
              Active Event: <strong>{currentEvent.title}</strong>
              {currentEvent.is_paid && <span className="ml-1 text-gray-500 font-mono">• Ticket Price: Rs. {currentEvent.price || currentEvent.ticket_price || 0}</span>}
            </p>
          )}
        </div>

      {/* ── SECTION 1: SINGLE CASH PAYMENT REGISTRATION ── */}
      {(viewMode === 'all' || viewMode === 'single') && (
        <div className={!initialEventId && events.length > 0 ? "pt-6" : "pt-4"}>
          <div className="mb-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              Single Cash Payment Registration
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Type the student's roll number to verify their profile and issue their pass upon cash receipt.
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
                'Verify'
              )}
            </button>
          </div>

          {singleError && (
            <p className="text-rose-600 text-xs mt-2 font-bold flex items-center gap-1">
              <AlertCircle size={13} />
              {singleError}
            </p>
          )}

          {studentDetails && (
            <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 animate-in fade-in duration-150">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
                  <UserCheck size={18} />
                </div>
                <div>
                  <p className="font-bold text-emerald-950 text-sm">
                    {studentDetails.name}
                    <span className="font-mono text-xs text-emerald-700 ml-1.5 font-semibold">
                      ({studentDetails.roll_number})
                    </span>
                  </p>
                  <p className="text-xs text-emerald-800 font-medium">
                    {studentDetails.department || 'Student'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={issueSingleTicket}
                disabled={isIssuingSingle}
                className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 transition text-xs cursor-pointer shadow-sm shadow-emerald-600/20 shrink-0 flex items-center justify-center gap-1.5"
              >
                {isIssuingSingle ? (
                  <>
                    <RefreshCw className="animate-spin" size={14} />
                    Issuing Ticket...
                  </>
                ) : (
                  'Confirm Cash Received & Issue Ticket'
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── DIVIDER (When displaying both sections) ── */}
      {viewMode === 'all' && (
        <div className="relative my-8">
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
        <div className={viewMode === 'bulk' && (!initialEventId && events.length > 0) ? "pt-6" : ""}>
          <div className="mb-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              Bulk Ticketing Engine
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Upload a spreadsheet containing student roll numbers to automatically batch-issue encrypted QR entry passes.
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

          {/* Success & Failure Report */}
          {bulkReport && (
            <div className="mt-6 p-5 bg-gray-50 rounded-2xl border border-gray-200 animate-in fade-in duration-200">
              <h4 className="font-bold text-base text-gray-900 mb-2 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                Upload Processing Report
              </h4>
              <p className="text-emerald-700 font-bold text-sm mb-1">
                ✅ Successfully Issued: {bulkReport.successful.length} tickets
              </p>

              {bulkReport.failed.length > 0 && (
                <div className="mt-3">
                  <p className="text-rose-600 font-bold text-sm mb-2">
                    ❌ Failed (Roll Numbers Not Found or Already Registered): {bulkReport.failed.length}
                  </p>
                  <div className="bg-white border border-gray-200 p-3 rounded-xl max-h-36 overflow-y-auto">
                    <ul className="list-disc pl-5 text-xs text-gray-700 space-y-1">
                      {bulkReport.failed.map((roll, idx) => (
                        <li key={idx} className="font-mono">{roll}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ManualTicketingHub;
