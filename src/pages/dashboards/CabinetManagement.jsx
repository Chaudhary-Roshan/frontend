import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';
import { Users, CheckCircle, XCircle } from 'lucide-react';
import { sortSocietyMembers, ROLE_TIER_CATEGORIES, getDynamicRoleRank } from '../../utils/hierarchy';

const CabinetManagement = () => {
  const { user } = useContext(AuthContext);
  const [cabinet, setCabinet] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ student_username: '', role_title: '', priority_rank: 250, term_year: '2026-2027', custom_role: '' });
  
  const currentSocietyId = user?.society || user?.society_id || (user?.presided_societies && user.presided_societies[0]?.id) || (user?.advised_societies && user.advised_societies[0]?.id);

  const fetchCabinet = async () => {
    try {
      const res = await api.get('cabinet/', { params: currentSocietyId ? { society: currentSocietyId } : {} });
      const rawData = Array.isArray(res.data) ? res.data : [];
      const filtered = currentSocietyId ? rawData.filter(c => c.society === currentSocietyId || c.society?.id === currentSocietyId) : rawData;
      setCabinet(sortSocietyMembers(filtered));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (currentSocietyId) fetchCabinet();
  }, [currentSocietyId]);

  const handleToggleActive = async (id) => {
    try {
      const res = await api.post(`cabinet/${id}/toggle_active/`);
      setCabinet(sortSocietyMembers(cabinet.map(c => c.id === id ? { ...c, is_active: res.data.is_active } : c)));
      window.dispatchEvent(new CustomEvent('dsms:cabinet_updated', { detail: { id: currentSocietyId } }));
      window.dispatchEvent(new CustomEvent('dsms:data_synced'));
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  const handleVerify = async (id) => {
    try {
      await api.post(`cabinet/${id}/verify/`);
      fetchCabinet();
      window.dispatchEvent(new CustomEvent('dsms:cabinet_updated', { detail: { id: currentSocietyId } }));
      window.dispatchEvent(new CustomEvent('dsms:data_synced'));
      alert("Cabinet nomination verified! Digital Cabinet Card issued to the student.");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to verify cabinet nomination.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const finalRole = formData.role_title === 'Other' ? formData.custom_role : formData.role_title;
      const rank = Number(formData.priority_rank) || getDynamicRoleRank({ role_title: finalRole });
      const res = await api.post('cabinet/', {
        student_username: formData.student_username.trim(),
        role_title: finalRole,
        priority_rank: rank,
        term_year: formData.term_year,
        society: currentSocietyId
      });
      setShowForm(false);
      setFormData({ student_username: '', role_title: '', priority_rank: 250, term_year: '2026-2027', custom_role: '' });
      fetchCabinet();
      window.dispatchEvent(new CustomEvent('dsms:cabinet_updated', { detail: { id: currentSocietyId } }));
      window.dispatchEvent(new CustomEvent('dsms:data_synced'));
      if (res.data.is_verified) {
        alert(`Cabinet member ${res.data.full_name || res.data.username} successfully inducted and credential card issued!`);
      } else {
        alert(`Cabinet nomination for ${res.data.full_name || res.data.username} submitted! It will appear in the Faculty Advisor desk for verification before cards are issued.`);
      }
    } catch (err) {
      alert(err.response?.data?.student_username?.[0] || err.response?.data?.error || "Failed to add member. Make sure the roll number is correct and they are an active member.");
    }
  };

  const verifiedCabinet = sortSocietyMembers(cabinet.filter(c => c.is_active && c.is_verified));
  const pendingCabinet = sortSocietyMembers(cabinet.filter(c => c.is_active && !c.is_verified));
  const inactiveCabinet = sortSocietyMembers(cabinet.filter(c => !c.is_active));

  return (
    <div className="min-h-screen bg-slate-50 py-12 font-sans">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-4xl font-extrabold text-slate-900 flex items-center gap-3 mb-8">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl"><Users size={28} /></div>
          Cabinet Management
        </h1>
        
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Executive Cabinet ({verifiedCabinet.length} Verified)</h2>
              <p className="text-xs text-slate-400 font-medium">Manage verified appointments, advisor review queue, and archived history</p>
            </div>
            <button onClick={() => setShowForm(!showForm)} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-600 transition-colors cursor-pointer">
              {showForm ? 'Cancel' : '+ Nominate Member'}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h3 className="font-bold text-lg mb-2">Nominate Cabinet Member</h3>
              <p className="text-xs text-slate-500 mb-4">Nominations submitted by President are forwarded to the Faculty Advisor for endorsement before official ID cards are issued.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Student Roll Number</label>
                  <input required type="text" placeholder="e.g. 2022-CS-101" value={formData.student_username} onChange={e => setFormData({...formData, student_username: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none focus:border-indigo-500 bg-white text-xs font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Role Designation</label>
                  <select 
                    required 
                    value={formData.role_title} 
                    onChange={e => {
                      const val = e.target.value;
                      const calculated = getDynamicRoleRank({ role_title: val });
                      setFormData({ ...formData, role_title: val, priority_rank: calculated });
                    }} 
                    className="w-full px-4 py-2 border rounded-xl outline-none focus:border-indigo-500 bg-white text-xs font-bold"
                  >
                    <option value="" disabled>Select Designation Tier...</option>
                    {ROLE_TIER_CATEGORIES.map(cat => (
                      <optgroup key={cat.category} label={cat.category}>
                        {cat.roles.map(r => (
                          <option key={r.title} value={r.title}>{r.title}</option>
                        ))}
                      </optgroup>
                    ))}
                    <option value="Other">+ Custom Designation (Manual)...</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Term Session</label>
                  <input required type="text" placeholder="Term Year (e.g. 2026-2027)" value={formData.term_year} onChange={e => setFormData({...formData, term_year: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none focus:border-indigo-500 bg-white text-xs font-bold" />
                </div>
              </div>

              {formData.role_title === 'Other' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Custom Designation Title *</label>
                    <input 
                      required 
                      type="text" 
                      placeholder="e.g. Lead UI Designer or Stage Decore Head" 
                      value={formData.custom_role} 
                      onChange={e => {
                        const customVal = e.target.value;
                        const autoRank = getDynamicRoleRank({ role_title: customVal });
                        setFormData({ ...formData, custom_role: customVal, priority_rank: autoRank });
                      }} 
                      className="w-full px-4 py-2 border rounded-xl outline-none focus:border-indigo-500 bg-white text-xs font-bold" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Hierarchy Priority Rank (100–900)
                    </label>
                    <input 
                      type="number" 
                      min="1" 
                      max="1000"
                      value={formData.priority_rank} 
                      onChange={e => setFormData({ ...formData, priority_rank: parseInt(e.target.value) || 900 })} 
                      className="w-full px-4 py-2 border rounded-xl outline-none focus:border-indigo-500 bg-white text-xs font-bold" 
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Lower number appears first (100=President, 200=VP, 300=GS, 500=Head, 600=Team).
                    </span>
                  </div>
                </div>
              )}

              <button type="submit" className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 cursor-pointer shadow-md text-xs">
                Submit Cabinet Nomination
              </button>
            </form>
          )}
          
          {cabinet.length === 0 ? (
            <p className="text-slate-500 italic">No cabinet members recorded.</p>
          ) : (
            <div className="space-y-6">
              {/* 1. VERIFIED ACTIVE CABINET */}
              <div className="space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 block">Verified Appointments (Credentials Issued)</span>
                {verifiedCabinet.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No verified cabinet members yet.</p>
                ) : (
                  verifiedCabinet.map(member => (
                    <div key={member.id} className="flex justify-between items-center p-4 border border-slate-100 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-md transition-all">
                      <div>
                        <h3 className="font-bold text-lg text-slate-900">{member.full_name || member.username}</h3>
                        <p className="text-sm text-indigo-600 font-semibold">{member.role_title} ({member.term_year})</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full text-xs font-bold"><CheckCircle size={14}/> Verified Official</span>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(member.id)}
                          className="px-2.5 py-1 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition cursor-pointer"
                        >
                          Deactivate
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* 2. PENDING ADVISOR NOMINATIONS */}
              {pendingCabinet.length > 0 && (
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-600 block">
                      ⏳ Pending Faculty Advisor Endorsement ({pendingCabinet.length} Nominations)
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">Cabinet Card Issued Upon Verification</span>
                  </div>
                  {pendingCabinet.map(member => (
                    <div key={member.id} className="flex justify-between items-center p-4 border border-amber-200 rounded-2xl bg-amber-50/50 hover:bg-white transition-all">
                      <div>
                        <h3 className="font-bold text-lg text-slate-900">{member.full_name || member.username}</h3>
                        <p className="text-sm text-amber-700 font-semibold">{member.role_title} (Term {member.term_year})</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-amber-700 bg-amber-100 border border-amber-300 px-3 py-1 rounded-full text-xs font-bold">
                          Awaiting Advisor Endorsement
                        </span>
                        {(user?.role === 'faculty' || user?.role === 'admin') && (
                          <button
                            type="button"
                            onClick={() => handleVerify(member.id)}
                            className="px-3 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition cursor-pointer"
                          >
                            Verify & Issue Card
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 3. INACTIVE / PAST RECORDS */}
              {inactiveCabinet.length > 0 && (
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">Past / Deactivated Records (Administrative History)</span>
                  {inactiveCabinet.map(member => (
                    <div key={member.id} className="flex justify-between items-center p-4 border border-slate-100 rounded-2xl bg-slate-50/60 opacity-75">
                      <div>
                        <h3 className="font-bold text-base text-slate-600 line-through">{member.full_name || member.username}</h3>
                        <p className="text-xs text-slate-400 font-medium">{member.role_title} ({member.term_year})</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2.5 py-0.5 rounded-full">Inactive</span>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(member.id)}
                          className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition cursor-pointer"
                        >
                          Reactivate
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CabinetManagement;
