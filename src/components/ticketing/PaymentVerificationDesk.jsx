import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Ticket, Users, CheckCircle2, XCircle, FileText, Loader2 } from 'lucide-react';

const PaymentVerificationDesk = ({ events = [] }) => {
  const [activeTab, setActiveTab] = useState('events'); // 'events' | 'memberships'
  
  // Event Ticket States
  const [pendingSlips, setPendingSlips] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  // Membership Payment States
  const [pendingMemberships, setPendingMemberships] = useState([]);
  const [isLoadingMemberships, setIsLoadingMemberships] = useState(false);
  const [processingMemberId, setProcessingMemberId] = useState(null);

  const getMediaUrl = (url) => {
    if (!url) return '#';
    if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;
    return `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  // Fetch pending registrations when the selected event changes or activeTab is events
  useEffect(() => {
    if (activeTab === 'events') {
      fetchPendingEvents();
    } else {
      fetchPendingMemberships();
    }
  }, [selectedEventId, activeTab]);

  const fetchPendingEvents = async () => {
    setIsLoadingEvents(true);
    try {
      const res = await api.get(`/registrations/pending?eventId=${selectedEventId}`);
      setPendingSlips(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Failed to fetch pending payment slips:', error);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const fetchPendingMemberships = async () => {
    setIsLoadingMemberships(true);
    try {
      const res = await api.get('memberships/');
      const allMembers = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      // Filter for memberships pending approval or with payment proof submitted
      const pending = allMembers.filter(m => m.status === 'pending' || (!m.is_active && m.payment_proof));
      setPendingMemberships(pending);
    } catch (error) {
      console.error('Failed to fetch pending membership payments:', error);
    } finally {
      setIsLoadingMemberships(false);
    }
  };

  const verifyPayment = async (registrationId) => {
    setProcessingId(registrationId);
    try {
      await api.patch(`/registrations/${registrationId}/verify`);
      setPendingSlips(prev => prev.filter(slip => slip.id !== registrationId));
      alert('Payment verified and ticket issued!');
    } catch (error) {
      alert(error.response?.data?.error || error.response?.data?.detail || 'Verification failed.');
    } finally {
      setProcessingId(null);
    }
  };

  const approveMembership = async (membershipId) => {
    setProcessingMemberId(membershipId);
    try {
      await api.post(`memberships/${membershipId}/approve/`);
      setPendingMemberships(prev => prev.filter(m => m.id !== membershipId));
      alert('Membership fee payment approved! Digital Member ID card activated.');
    } catch (error) {
      alert(error.response?.data?.error || error.response?.data?.detail || 'Failed to approve membership.');
    } finally {
      setProcessingMemberId(null);
    }
  };

  const rejectMembership = async (membershipId) => {
    const reason = window.prompt('Enter reason for rejection (optional):', 'Invalid or illegible payment proof');
    if (reason === null) return;

    setProcessingMemberId(membershipId);
    try {
      await api.post(`memberships/${membershipId}/reject/`, { reason });
      setPendingMemberships(prev => prev.filter(m => m.id !== membershipId));
      alert('Membership application rejected.');
    } catch (error) {
      alert(error.response?.data?.error || error.response?.data?.detail || 'Failed to reject membership.');
    } finally {
      setProcessingMemberId(null);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Payment Verification Desk</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Review uploaded transaction receipts and authorize digital passes and society memberships.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('events')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'events' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Ticket size={14} />
            Event Tickets ({pendingSlips.length})
          </button>
          <button
            onClick={() => setActiveTab('memberships')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'memberships' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users size={14} />
            Membership Fees ({pendingMemberships.length})
          </button>
        </div>
      </div>

      {/* ── TAB 1: EVENT TICKETS ── */}
      {activeTab === 'events' && (
        <>
          <div className="flex justify-end mb-4">
            <select 
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg bg-gray-50 min-w-[220px] outline-none focus:border-purple-500 text-xs font-semibold text-gray-800"
            >
              <option value="">All Pending Events</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>{event.title}</option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs uppercase font-bold border-b">
                  <th className="p-3">Student Details</th>
                  <th className="p-3">Event & Amount</th>
                  <th className="p-3">Transaction ID</th>
                  <th className="p-3">Proof</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingEvents ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500 text-sm">
                      <Loader2 className="animate-spin inline mr-2 text-purple-600" size={16} />
                      Loading pending verification slips...
                    </td>
                  </tr>
                ) : pendingSlips.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500 font-medium text-sm">
                      No pending event ticket payments for this selection.
                    </td>
                  </tr>
                ) : (
                  pendingSlips.map((slip) => (
                    <tr key={slip.id} className="border-b hover:bg-gray-50 transition text-sm">
                      <td className="p-3">
                        <p className="font-bold text-gray-900">{slip.student_name}</p>
                        <p className="text-xs text-gray-500 font-mono">{slip.student_roll_number}</p>
                      </td>
                      <td className="p-3">
                        <p className="font-semibold text-gray-800 text-xs">{slip.event_title}</p>
                        <span className="bg-purple-100 text-purple-800 text-[11px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 font-mono">
                          Rs. {slip.amount}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-xs text-gray-700">{slip.transaction_id || 'N/A'}</td>
                      <td className="p-3">
                        {slip.receipt_file && slip.receipt_file !== '#' ? (
                          <a 
                            href={getMediaUrl(slip.receipt_file)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-purple-600 font-bold hover:underline text-xs inline-flex items-center gap-1 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg border border-purple-200 transition"
                          >
                            <FileText size={12} /> View File
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No file</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button 
                          onClick={() => verifyPayment(slip.id)}
                          disabled={processingId === slip.id}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg font-bold text-xs transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                        >
                          {processingId === slip.id ? 'Verifying...' : 'Verify & Approve'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── TAB 2: MEMBERSHIP FEE PAYMENTS ── */}
      {activeTab === 'memberships' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase font-bold border-b">
                <th className="p-3">Applicant Student</th>
                <th className="p-3">Society & Fee Tier</th>
                <th className="p-3">Transaction ID</th>
                <th className="p-3">Payment Proof</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingMemberships ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500 text-sm">
                    <Loader2 className="animate-spin inline mr-2 text-purple-600" size={16} />
                    Loading pending society membership requests...
                  </td>
                </tr>
              ) : pendingMemberships.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500 font-medium text-sm">
                    No pending membership fee payments found.
                  </td>
                </tr>
              ) : (
                pendingMemberships.map((mem) => {
                  const proofUrl = mem.payment_proof;
                  const isProcessing = processingMemberId === mem.id;

                  return (
                    <tr key={mem.id} className="border-b hover:bg-gray-50 transition text-sm">
                      <td className="p-3">
                        <p className="font-bold text-gray-900">{mem.student_name || mem.student_username}</p>
                        <p className="text-xs text-gray-500 font-mono">{mem.student_roll_number || 'No Roll No'}</p>
                        <p className="text-[11px] text-gray-400">{mem.student_email}</p>
                      </td>
                      <td className="p-3">
                        <p className="font-semibold text-gray-800 text-xs">{mem.society_name}</p>
                        <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 font-mono">
                          {parseFloat(mem.fee_paid || 0) > 0 ? `Fee: Rs. ${mem.fee_paid}` : 'Free Membership'}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-xs text-gray-700">
                        {mem.transaction_id || <span className="text-gray-400 italic">None</span>}
                      </td>
                      <td className="p-3">
                        {proofUrl ? (
                          <a 
                            href={getMediaUrl(proofUrl)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-purple-600 font-bold hover:underline text-xs inline-flex items-center gap-1 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg border border-purple-200 transition"
                          >
                            <FileText size={12} /> View Slip
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No receipt file</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => approveMembership(mem.id)}
                            disabled={isProcessing}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold text-xs transition-colors shadow-sm disabled:opacity-50 cursor-pointer flex items-center gap-1"
                          >
                            <CheckCircle2 size={12} />
                            {isProcessing ? 'Updating...' : 'Approve'}
                          </button>
                          <button 
                            onClick={() => rejectMembership(mem.id)}
                            disabled={isProcessing}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-2.5 py-1.5 rounded-lg font-bold text-xs transition-colors border border-rose-200 disabled:opacity-50 cursor-pointer flex items-center gap-1"
                          >
                            <XCircle size={12} />
                            Reject
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
      )}
    </div>
  );
};

export default PaymentVerificationDesk;
