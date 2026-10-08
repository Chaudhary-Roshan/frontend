import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';
import { Users, CheckCircle, XCircle, Trash2, Search, Filter, Mail, Phone, Calendar, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MembershipRoster = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    fetchMemberships();
  }, []);

  const fetchMemberships = async () => {
    try {
      const res = await api.get('memberships/');
      setMemberships(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus, isActive) => {
    try {
      if (newStatus === 'active') {
        await api.post(`memberships/${id}/approve/`);
      } else {
        await api.patch(`memberships/${id}/`, { status: newStatus, is_active: isActive });
      }
      fetchMemberships();
    } catch (err) {
      alert('Failed to update membership status.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this membership?")) return;
    try {
      await api.delete(`memberships/${id}/`);
      fetchMemberships();
    } catch (err) {
      alert('Failed to delete membership.');
    }
  };

  const filteredMemberships = memberships.filter(m => {
    const matchesSearch = (m.student_name || m.student_username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (m.student_roll_number || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-12 font-sans">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <Users className="text-violet-600" size={32} />
              Official Membership Roster
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">Manage society memberships, verify statuses, and inspect student records.</p>
          </div>
          <button onClick={() => navigate(-1)} className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition hover:bg-slate-300">
            Go Back
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or roll number..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-400" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Members</option>
              <option value="pending">Pending Approval</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-bold">Loading records...</div>
        ) : filteredMemberships.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-bold bg-white rounded-2xl border border-slate-200 shadow-sm">No membership records found.</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Society</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMemberships.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50 transition cursor-pointer" onClick={() => setSelectedMember(m)}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-black">
                            {(m.student_name || m.student_username || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{m.student_name || m.student_username}</p>
                            <p className="text-xs text-slate-500 font-mono">{m.student_roll_number || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700">{m.society_name}</td>
                      <td className="px-6 py-4 font-semibold text-violet-600">{m.role_title}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          m.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                          m.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        {m.status !== 'active' && (
                          <button onClick={() => handleStatusChange(m.id, 'active', true)} className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg tooltip" title="Activate">
                            <CheckCircle size={16} />
                          </button>
                        )}
                        {m.status === 'active' && (
                          <button onClick={() => handleStatusChange(m.id, 'suspended', false)} className="p-2 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg tooltip" title="Suspend">
                            <XCircle size={16} />
                          </button>
                        )}
                        <button onClick={() => handleDelete(m.id)} className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg tooltip" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Profile Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedMember(null)}>
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-violet-100 text-violet-600 rounded-3xl mx-auto flex items-center justify-center font-black text-3xl mb-4 shadow-inner">
                {selectedMember.student_avatar ? (
                  <img src={selectedMember.student_avatar} alt="Profile" className="w-full h-full object-cover rounded-3xl" />
                ) : (selectedMember.student_name || 'U')[0].toUpperCase()}
              </div>
              <h2 className="text-2xl font-black text-slate-900">{selectedMember.student_name || selectedMember.student_username}</h2>
              <p className="text-sm font-bold text-violet-600 uppercase tracking-widest mt-1">{selectedMember.role_title} @ {selectedMember.society_name}</p>
            </div>

            <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <UserCircle className="text-slate-400" size={18} />
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Roll Number / CNIC</p>
                  <p className="text-sm font-bold text-slate-800">{selectedMember.student_roll_number || 'N/A'} • {selectedMember.student_cnic || 'No CNIC'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="text-slate-400" size={18} />
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Email Address</p>
                  <p className="text-sm font-bold text-slate-800">{selectedMember.student_email || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="text-slate-400" size={18} />
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Phone Number</p>
                  <p className="text-sm font-bold text-slate-800">{selectedMember.student_phone || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="text-slate-400" size={18} />
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Academic Details</p>
                  <p className="text-sm font-bold text-slate-800">Sem {selectedMember.student_semester || 'N/A'} • {selectedMember.student_program || 'N/A'} ({selectedMember.student_department || 'N/A'})</p>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <button onClick={() => setSelectedMember(null)} className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm transition shadow-lg shadow-slate-900/20">
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembershipRoster;
