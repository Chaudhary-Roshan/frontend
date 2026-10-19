import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { getMediaUrl } from '../../utils/media';
import { MediaLink, MediaImage } from '../common/AuthenticatedMedia';
import { 
  Ticket, Users, CheckCircle2, XCircle, FileText, Loader2, 
  ExternalLink, Eye, Copy, Check, X, AlertCircle, Calendar, CreditCard, User
} from 'lucide-react';

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

  // Proof Lightbox / Preview Modal State
  const [previewItem, setPreviewItem] = useState(null); // { item, type: 'event' | 'membership' }
  const [copiedTxn, setCopiedTxn] = useState(false);

  // Helper to extract valid proof URL
  const getProofUrl = (item) => {
    if (!item) return null;
    const url = item.receipt_file || item.payment_proof_url || item.payment_proof || item.proof_url;
    if (!url || url === '#' || url === 'null' || url === 'undefined') return null;
    return url;
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
      if (previewItem?.item?.id === registrationId) {
        setPreviewItem(null);
      }
      alert('Payment verified and digital ticket issued successfully!');
    } catch (error) {
      alert(error.response?.data?.error || error.response?.data?.detail || 'Verification failed.');
    } finally {
      setProcessingId(null);
    }
  };

  const rejectPayment = async (registrationId) => {
    const reason = window.prompt(
      'Enter reason for rejecting this payment proof (optional):', 
      'Payment proof could not be verified against the official bank ledger.'
    );
    if (reason === null) return; // User cancelled prompt

    setProcessingId(registrationId);
    try {
      await api.post(`/registrations/${registrationId}/reject`, { reason });
      setPendingSlips(prev => prev.filter(slip => slip.id !== registrationId));
      if (previewItem?.item?.id === registrationId) {
        setPreviewItem(null);
      }
      alert('Registration payment rejected. Seat hold released.');
    } catch (error) {
      alert(error.response?.data?.error || error.response?.data?.detail || 'Failed to reject registration.');
    } finally {
      setProcessingId(null);
    }
  };

  const approveMembership = async (membershipId) => {
    setProcessingMemberId(membershipId);
    try {
      await api.post(`memberships/${membershipId}/approve/`);
      setPendingMemberships(prev => prev.filter(m => m.id !== membershipId));
      if (previewItem?.item?.id === membershipId) {
        setPreviewItem(null);
      }
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
      if (previewItem?.item?.id === membershipId) {
        setPreviewItem(null);
      }
      alert('Membership application rejected.');
    } catch (error) {
      alert(error.response?.data?.error || error.response?.data?.detail || 'Failed to reject membership.');
    } finally {
      setProcessingMemberId(null);
    }
  };

  const copyTransactionId = (txnId) => {
    if (!txnId || txnId === 'N/A') return;
    navigator.clipboard?.writeText(txnId);
    setCopiedTxn(true);
    setTimeout(() => setCopiedTxn(false), 2000);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Payment Verification Desk</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Review uploaded transaction receipts, inspect payment screenshots, and authorize digital passes and society memberships.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('events')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'events' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Ticket size={14} />
            Event Tickets ({pendingSlips.length})
          </button>
          <button
            onClick={() => setActiveTab('memberships')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
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
          <div className="flex justify-between items-center mb-4 gap-4 flex-wrap">
            <p className="text-xs font-medium text-gray-500">
              Showing pending ticket payments awaiting cabinet verification.
            </p>
            <select 
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg bg-gray-50 min-w-[220px] outline-none focus:border-purple-500 text-xs font-semibold text-gray-800 cursor-pointer"
            >
              <option value="">All Pending Events</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>{event.title}</option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs uppercase font-bold border-b border-gray-200">
                  <th className="p-3">Student Details</th>
                  <th className="p-3">Event & Amount</th>
                  <th className="p-3">Transaction ID</th>
                  <th className="p-3">Proof of Payment</th>
                  <th className="p-3 text-right">Actions</th>
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
                  pendingSlips.map((slip) => {
                    const proofUrl = getProofUrl(slip);
                    const isProcessing = processingId === slip.id;

                    return (
                      <tr key={slip.id} className="border-b border-gray-100 hover:bg-gray-50 transition text-sm">
                        <td className="p-3">
                          <p className="font-bold text-gray-900">{slip.student_name}</p>
                          <p className="text-xs text-gray-500 font-mono">{slip.student_roll_number}</p>
                          {slip.student_email && (
                            <p className="text-[11px] text-gray-400">{slip.student_email}</p>
                          )}
                        </td>
                        <td className="p-3">
                          <p className="font-semibold text-gray-800 text-xs">{slip.event_title}</p>
                          <span className="bg-purple-100 text-purple-800 text-[11px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 font-mono">
                            PKR {slip.amount}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="font-mono text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded-md">
                            {slip.transaction_id || 'N/A'}
                          </span>
                        </td>
                        <td className="p-3">
                          {proofUrl ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setPreviewItem({ item: slip, type: 'event' })}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs border border-purple-200 transition shadow-xs cursor-pointer"
                                title="Click to inspect receipt screenshot"
                              >
                                <Eye size={13} />
                                <span>Inspect Proof</span>
                              </button>
                              <MediaLink 
                                href={getMediaUrl(proofUrl)} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-1.5 text-gray-400 hover:text-purple-600 rounded-lg hover:bg-purple-50 transition"
                                title="Open full document in new tab"
                              >
                                <ExternalLink size={13} />
                              </MediaLink>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">No file uploaded</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => verifyPayment(slip.id)}
                              disabled={isProcessing}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold text-xs transition-colors shadow-sm disabled:opacity-50 cursor-pointer flex items-center gap-1"
                            >
                              <CheckCircle2 size={13} />
                              {isProcessing ? 'Verifying...' : 'Verify & Approve'}
                            </button>
                            <button 
                              onClick={() => rejectPayment(slip.id)}
                              disabled={isProcessing}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-2.5 py-1.5 rounded-lg font-bold text-xs transition-colors border border-rose-200 disabled:opacity-50 cursor-pointer flex items-center gap-1"
                            >
                              <XCircle size={13} />
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
        </>
      )}

      {/* ── TAB 2: MEMBERSHIP FEE PAYMENTS ── */}
      {activeTab === 'memberships' && (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase font-bold border-b border-gray-200">
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
                  const proofUrl = getProofUrl(mem);
                  const isProcessing = processingMemberId === mem.id;

                  return (
                    <tr key={mem.id} className="border-b border-gray-100 hover:bg-gray-50 transition text-sm">
                      <td className="p-3">
                        <p className="font-bold text-gray-900">{mem.student_name || mem.student_username}</p>
                        <p className="text-xs text-gray-500 font-mono">{mem.student_roll_number || 'No Roll No'}</p>
                        <p className="text-[11px] text-gray-400">{mem.student_email}</p>
                      </td>
                      <td className="p-3">
                        <p className="font-semibold text-gray-800 text-xs">{mem.society_name}</p>
                        <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 font-mono">
                          {parseFloat(mem.fee_paid || 0) > 0 ? `Fee: PKR ${mem.fee_paid}` : 'Free Membership'}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-xs text-gray-700">
                        {mem.transaction_id ? (
                          <span className="bg-gray-100 px-2 py-1 rounded-md">{mem.transaction_id}</span>
                        ) : (
                          <span className="text-gray-400 italic">None</span>
                        )}
                      </td>
                      <td className="p-3">
                        {proofUrl ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setPreviewItem({ item: mem, type: 'membership' })}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs border border-purple-200 transition shadow-xs cursor-pointer"
                              title="Click to inspect receipt screenshot"
                            >
                              <Eye size={13} />
                              <span>Inspect Slip</span>
                            </button>
                            <MediaLink 
                              href={getMediaUrl(proofUrl)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-1.5 text-gray-400 hover:text-purple-600 rounded-lg hover:bg-purple-50 transition"
                              title="Open full document in new tab"
                            >
                              <ExternalLink size={13} />
                            </MediaLink>
                          </div>
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
                            <CheckCircle2 size={13} />
                            {isProcessing ? 'Updating...' : 'Approve'}
                          </button>
                          <button 
                            onClick={() => rejectMembership(mem.id)}
                            disabled={isProcessing}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-2.5 py-1.5 rounded-lg font-bold text-xs transition-colors border border-rose-200 disabled:opacity-50 cursor-pointer flex items-center gap-1"
                          >
                            <XCircle size={13} />
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

      {/* ── PROOF LIGHTBOX / INSPECTION MODAL ── */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-gray-200 my-8 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Payment Proof Review</h3>
                  <p className="text-xs text-gray-500">
                    {previewItem.type === 'event' ? 'Event Ticket Registration' : 'Society Membership Application'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setPreviewItem(null)}
                className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 flex items-center justify-center transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Metadata Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold">
                    <User size={13} className="text-purple-600" />
                    <span>Student Applicant</span>
                  </div>
                  <p className="font-bold text-gray-900 text-sm">
                    {previewItem.item.student_name || previewItem.item.student_username}
                  </p>
                  <p className="text-xs font-mono text-purple-700 font-semibold">
                    Roll No: {previewItem.item.student_roll_number || 'N/A'}
                  </p>
                  {previewItem.item.student_email && (
                    <p className="text-xs text-gray-500">{previewItem.item.student_email}</p>
                  )}
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold">
                    <CreditCard size={13} className="text-emerald-600" />
                    <span>Payment Information</span>
                  </div>
                  <p className="font-bold text-emerald-800 text-sm">
                    Amount: PKR {previewItem.type === 'event' ? previewItem.item.amount : (previewItem.item.fee_paid || '0')}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">Ref:</span>
                    <span className="font-mono text-xs font-bold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200">
                      {previewItem.item.transaction_id || 'N/A'}
                    </span>
                    {previewItem.item.transaction_id && previewItem.item.transaction_id !== 'N/A' && (
                      <button 
                        onClick={() => copyTransactionId(previewItem.item.transaction_id)}
                        className="text-xs text-purple-600 hover:text-purple-800 font-semibold flex items-center gap-0.5 cursor-pointer"
                        title="Copy Transaction ID"
                      >
                        {copiedTxn ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 truncate">
                    {previewItem.type === 'event' ? previewItem.item.event_title : previewItem.item.society_name}
                  </p>
                </div>
              </div>

              {previewItem.item.receipt_details && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                  <span className="font-bold">Student Notes / Remarks:</span> {previewItem.item.receipt_details}
                </div>
              )}

              {/* Uploaded Receipt Document / Image Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Uploaded Transaction Receipt / Screenshot
                  </span>
                  {getProofUrl(previewItem.item) && (
                    <MediaLink
                      href={getMediaUrl(getProofUrl(previewItem.item))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-purple-700 font-bold hover:underline flex items-center gap-1"
                    >
                      <ExternalLink size={12} />
                      Open Full Size
                    </MediaLink>
                  )}
                </div>

                <div className="p-4 bg-slate-900 rounded-2xl flex items-center justify-center min-h-[300px] border border-slate-800">
                  {getProofUrl(previewItem.item) ? (
                    <MediaImage
                      src={getMediaUrl(getProofUrl(previewItem.item))}
                      alt="Transaction Receipt"
                      className="max-h-[55vh] max-w-full rounded-xl object-contain shadow-2xl"
                    />
                  ) : (
                    <div className="text-center text-gray-400 text-sm p-8">
                      <AlertCircle className="mx-auto mb-2 text-gray-500" size={32} />
                      <p>No receipt image file available for this record.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Action Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-semibold text-xs hover:bg-gray-100 transition cursor-pointer"
              >
                Close Preview
              </button>

              <div className="flex items-center gap-2">
                {previewItem.type === 'event' ? (
                  <>
                    <button
                      type="button"
                      disabled={processingId === previewItem.item.id}
                      onClick={() => rejectPayment(previewItem.item.id)}
                      className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <XCircle size={14} />
                      Reject Receipt
                    </button>
                    <button
                      type="button"
                      disabled={processingId === previewItem.item.id}
                      onClick={() => verifyPayment(previewItem.item.id)}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={14} />
                      {processingId === previewItem.item.id ? 'Verifying...' : 'Verify & Issue Ticket'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={processingMemberId === previewItem.item.id}
                      onClick={() => rejectMembership(previewItem.item.id)}
                      className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <XCircle size={14} />
                      Reject Membership
                    </button>
                    <button
                      type="button"
                      disabled={processingMemberId === previewItem.item.id}
                      onClick={() => approveMembership(previewItem.item.id)}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={14} />
                      {processingMemberId === previewItem.item.id ? 'Updating...' : 'Approve & Activate ID'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentVerificationDesk;
