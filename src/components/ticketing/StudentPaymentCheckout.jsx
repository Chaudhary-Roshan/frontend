import { MediaImage } from '../common/AuthenticatedMedia';
import React, { useState } from 'react';
import axios from 'axios';
import api from '../../utils/api';
import { Maximize2, QrCode } from 'lucide-react';
import PaymentQrModal from '../modals/PaymentQrModal';

const StudentPaymentCheckout = ({ event = {}, society = {}, closeModal = () => {} }) => {
  const [transactionId, setTransactionId] = useState('');
  const [paymentProof, setPaymentProof] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const qrUrl = society.payment_qr_url || society.payment_qr || event.effective_payment_qr || '';
  const ticketPrice = event.ticket_price ?? event.price ?? event.entry_fee ?? 0;
  const bankName = society.bank_name || 'Campus Trust Bank';
  const accountTitle = society.account_title || society.bank_account_title || `${society.name || 'Society'} Event Fund`;
  const accountIban = society.account_iban || society.bank_account_number || 'PK82UNIV000192837465';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!paymentProof) {
      alert('Please upload a screenshot or document of your transaction receipt.');
      return;
    }
    setIsSubmitting(true);
    
    const formData = new FormData();
    formData.append('eventId', event.id);
    formData.append('transactionId', transactionId.trim());
    formData.append('payment_proof', paymentProof); // Must use FormData for files

    try {
      await api.post('/registrations/pay', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Payment submitted! Awaiting cabinet verification.');
      closeModal();
    } catch (error) {
      alert(error.response?.data?.error || error.response?.data?.detail || 'Failed to submit registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl space-y-6">
        {/* 1. Bank Details & QR Display */}
        <div className="flex flex-col sm:flex-row gap-6 bg-blue-50 p-4 rounded-xl border border-blue-100 items-center">
          {qrUrl ? (
            <div 
              onClick={() => setShowQrModal(true)}
              className="group relative cursor-pointer shrink-0"
              title="Click to open large QR code for easy scanning"
            >
              <MediaImage 
                src={qrUrl} 
                alt="Bank QR" 
                className="w-32 h-32 rounded-xl object-contain bg-white p-2 border border-blue-200 group-hover:ring-2 group-hover:ring-blue-500 transition shadow-xs" 
              />
              <div className="absolute inset-0 bg-black/50 text-white rounded-xl opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-[11px] font-bold gap-1 p-2 text-center backdrop-blur-xs">
                <Maximize2 size={20} />
                <span>Tap to Enlarge & Scan</span>
              </div>
              <div className="mt-1 text-center">
                <span className="text-[10px] text-blue-600 font-bold group-hover:underline flex items-center justify-center gap-1">
                  <Maximize2 size={10} /> Tap to Enlarge
                </span>
              </div>
            </div>
          ) : (
            <div className="w-32 h-32 rounded-xl bg-white border border-dashed border-blue-300 flex items-center justify-center text-xs text-gray-400 p-2 text-center shrink-0">
              No QR Available
            </div>
          )}
          <div className="text-sm space-y-1 w-full text-gray-800">
            <p className="text-lg font-bold text-blue-900">Total: Rs. {ticketPrice}</p>
            <p><strong>Bank:</strong> {bankName}</p>
            <p><strong>Account:</strong> {accountTitle}</p>
            <p><strong>IBAN:</strong> {accountIban}</p>
            {qrUrl && (
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 underline flex items-center gap-1.5 pt-1 cursor-pointer"
              >
                <QrCode size={14} /> View Large Scanner QR Pass →
              </button>
            )}
          </div>
        </div>

      {/* 2. Transaction ID Input */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">Transaction ID / Reference Number *</label>
        <input 
          type="text" 
          required 
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
          placeholder="e.g., 0123456789"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
        />
      </div>

      {/* 3. Proof Upload */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">Upload Screenshot/Receipt *</label>
        <input 
          type="file" 
          required 
          accept=".png, .jpg, .jpeg, .pdf, image/*, application/pdf" 
          onChange={(e) => setPaymentProof(e.target.files[0])}
          className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 text-sm cursor-pointer"
        />
        <p className="text-xs text-gray-500 mt-1">Accepted formats: PNG, JPG, PDF.</p>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={closeModal}
          className="w-1/3 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={isSubmitting} 
          className="w-2/3 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition shadow-md shadow-blue-600/20"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Payment for Verification'}
        </button>
      </div>
    </form>

    {/* Enlarged Payment QR Modal */}
    <PaymentQrModal
      isOpen={showQrModal}
      onClose={() => setShowQrModal(false)}
      qrValue={qrUrl}
      eventTitle={event.title || 'Event Registration'}
      societyName={society.name}
      price={ticketPrice}
      bankName={bankName}
      accountTitle={accountTitle}
      accountIban={accountIban}
    />
  </>
);
};

export default StudentPaymentCheckout;
