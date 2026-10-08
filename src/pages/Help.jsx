import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { HelpCircle, Send } from 'lucide-react';

const Help = () => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({ subject: '', description: '' });
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Please login to submit a ticket.");
      return;
    }
    try {
      await api.post('complaints/', formData);
      setSuccess(true);
      setFormData({ subject: '', description: '' });
    } catch (err) {
      alert("Failed to submit ticket.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 flex justify-center">
      <div className="max-w-xl w-full px-4">
        <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3 mb-8">
          <div className="p-3 bg-red-100 text-red-600 rounded-xl"><HelpCircle size={28} /></div>
          Support & Complaints
        </h1>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          {success ? (
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send size={32} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Ticket Submitted</h2>
              <p className="text-slate-500 mb-6">Our admin team will review your complaint and get back to you.</p>
              <button onClick={() => setSuccess(false)} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold">Submit Another</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Subject</label>
                <input required type="text" placeholder="Brief summary of the issue" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="w-full px-4 py-3 border rounded-xl outline-none focus:border-red-500 bg-slate-50" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Detailed Description</label>
                <textarea required rows={5} placeholder="Provide as much detail as possible..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 border rounded-xl outline-none focus:border-red-500 bg-slate-50" />
              </div>
              <button type="submit" className="w-full bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition-colors mt-4">
                Submit Ticket
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Help;
