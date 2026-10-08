import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';
import { Users, CheckCircle, XCircle } from 'lucide-react';

const CabinetManagement = () => {
  const { user } = useContext(AuthContext);
  const [cabinet, setCabinet] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ student_username: '', role_title: '', term_year: '', custom_role: '' });
  
  const fetchCabinet = async () => {
    try {
      const res = await api.get('cabinet/');
      setCabinet(res.data.filter(c => c.society === user.society));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user?.society) fetchCabinet();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const finalRole = formData.role_title === 'Other' ? formData.custom_role : formData.role_title;
      await api.post('cabinet/', {
        student_username: formData.student_username,
        role_title: finalRole,
        term_year: formData.term_year
      });
      setShowForm(false);
      setFormData({ student_username: '', role_title: '', term_year: '', custom_role: '' });
      fetchCabinet();
    } catch (err) {
      alert(err.response?.data?.student_username?.[0] || "Failed to add member. Make sure the roll number is correct and they are an active member.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 font-sans">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-4xl font-extrabold text-slate-900 flex items-center gap-3 mb-8">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl"><Users size={28} /></div>
          Cabinet Management
        </h1>
        
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Current Members</h2>
            <button onClick={() => setShowForm(!showForm)} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-600 transition-colors">
              {showForm ? 'Cancel' : '+ Add Member'}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h3 className="font-bold text-lg mb-4">Add Cabinet Member</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <input required type="text" placeholder="Student Roll No" value={formData.student_username} onChange={e => setFormData({...formData, student_username: e.target.value})} className="px-4 py-2 border rounded-xl outline-none focus:border-indigo-500" />
                <select required value={formData.role_title} onChange={e => setFormData({...formData, role_title: e.target.value})} className="px-4 py-2 border rounded-xl outline-none focus:border-indigo-500 bg-white">
                  <option value="" disabled>Select Role...</option>
                  <option value="Vice President">Vice President</option>
                  <option value="General Secretary">General Secretary</option>
                  <option value="Treasurer">Treasurer</option>
                  <option value="Event Coordinator">Event Coordinator</option>
                  <option value="Marketing Head">Marketing Head</option>
                  <option value="Other">Other (Manual)</option>
                </select>
                {formData.role_title === 'Other' && (
                  <input required type="text" placeholder="Enter Custom Role" value={formData.custom_role} onChange={e => setFormData({...formData, custom_role: e.target.value})} className="px-4 py-2 border rounded-xl outline-none focus:border-indigo-500" />
                )}
                <input required type="text" placeholder="Term Year (e.g. 2025-2026)" value={formData.term_year} onChange={e => setFormData({...formData, term_year: e.target.value})} className="px-4 py-2 border rounded-xl outline-none focus:border-indigo-500" />
              </div>
              <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700">Add to Cabinet</button>
            </form>
          )}
          
          {cabinet.length === 0 ? (
            <p className="text-slate-500 italic">No cabinet members recorded.</p>
          ) : (
            <div className="space-y-4">
              {cabinet.map(member => (
                <div key={member.id} className="flex justify-between items-center p-4 border border-slate-100 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-md transition-all">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">{member.username}</h3>
                    <p className="text-sm text-indigo-600 font-semibold">{member.role_title} ({member.term_year})</p>
                  </div>
                  <div>
                    {member.is_verified ? 
                      <span className="flex items-center gap-1 text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full text-xs font-bold"><CheckCircle size={14}/> Verified</span> :
                      <span className="flex items-center gap-1 text-amber-600 bg-amber-100 px-3 py-1 rounded-full text-xs font-bold"><XCircle size={14}/> Pending Faculty Approval</span>
                    }
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CabinetManagement;
