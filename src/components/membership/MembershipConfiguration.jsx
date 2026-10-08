import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const MembershipConfiguration = ({ society, onUpdate }) => {
  const [isPaid, setIsPaid] = useState(false);
  const [fee, setFee] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (society) {
      const currentFee = parseFloat(society.membership_fee || 0);
      setIsPaid(currentFee > 0);
      setFee(currentFee > 0 ? String(currentFee) : '');
      setIsOpen(Boolean(society.is_membership_open));
    }
  }, [society]);

  const handleSave = async (targetOpenState) => {
    if (!society?.id) {
      alert('Please select or configure a society first.');
      return;
    }

    if (isPaid && (!fee || parseFloat(fee) <= 0)) {
      alert('Please enter a valid membership fee amount (PKR).');
      return;
    }

    setIsSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const newOpenStatus = targetOpenState !== undefined ? targetOpenState : true;
      const payload = {
        is_membership_open: newOpenStatus,
        membership_fee: isPaid ? parseFloat(fee) : 0.00
      };

      const res = await api.patch(`societies/${society.id}/`, payload);
      setIsOpen(newOpenStatus);
      setMessage({
        text: newOpenStatus ? 'Membership registration drive is now OPEN!' : 'Membership drive has been closed.',
        type: 'success'
      });
      if (onUpdate) onUpdate(res.data);
    } catch (err) {
      const errMsg = err.response?.data?.error || err.response?.data?.detail || 'Failed to update membership drive settings.';
      setMessage({ text: errMsg, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Membership Drive Settings</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure fee tier and toggle live campus registration for {society?.name || 'this society'}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-black uppercase px-3 py-1 rounded-full border ${
            isOpen ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-gray-100 text-gray-600 border-gray-300'
          }`}>
            {isOpen ? '● Drive Live / Open' : '○ Registration Closed'}
          </span>
        </div>
      </div>

      {message.text && (
        <div className={`p-3 rounded-xl mb-4 text-xs font-bold flex items-center gap-2 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      {/* Free vs Paid Toggle */}
      <div className="flex gap-6 mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input 
            type="radio" 
            name="membershipType"
            checked={!isPaid} 
            onChange={() => setIsPaid(false)} 
            className="text-purple-600 focus:ring-purple-500 h-4 w-4"
          />
          <span className="font-bold text-sm text-gray-800">Free Membership</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input 
            type="radio" 
            name="membershipType"
            checked={isPaid} 
            onChange={() => setIsPaid(true)} 
            className="text-purple-600 focus:ring-purple-500 h-4 w-4"
          />
          <span className="font-bold text-sm text-gray-800">Paid Membership</span>
        </label>
      </div>

      {isPaid && (
        <div className="mb-4">
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Annual Membership Fee (PKR) *
          </label>
          <div className="relative w-full sm:w-1/2 md:w-1/3">
            <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">Rs.</span>
            <input 
              type="number" 
              min="0"
              placeholder="e.g. 500"
              value={fee} 
              onChange={(e) => setFee(e.target.value)} 
              className="border border-gray-300 pl-10 pr-3 py-2 rounded-lg w-full outline-none focus:ring-2 focus:ring-purple-500 font-semibold text-gray-800" 
            />
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            Students applying will be instructed to submit transaction proof to the society bank account.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button 
          onClick={() => handleSave(true)}
          disabled={isSaving}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer"
        >
          {isSaving ? <Loader2 className="animate-spin" size={16} /> : null}
          Open Membership Registration
        </button>

        {isOpen && (
          <button 
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg font-bold text-sm transition-colors border border-gray-300 disabled:opacity-50 cursor-pointer"
          >
            Close Membership Drive
          </button>
        )}
      </div>
    </div>
  );
};

export default MembershipConfiguration;
