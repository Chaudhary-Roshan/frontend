import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';
import { 
  UserPlus, Briefcase, Calendar, Clock, Star, Award, 
  CheckCircle2, XCircle, ArrowRight, UserCheck, Search, Filter, 
  FileText, Download, ShieldCheck, Mail, Sparkles, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const RecruitmentManagement = () => {
  const { user } = useContext(AuthContext);
  const [recruitments, setRecruitments] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedRecruitment, setSelectedRecruitment] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({ title: '', deadline: '', customPositions: '' });
  const [selectedAppForLetter, setSelectedAppForLetter] = useState(null);

  // Applicant Review Action States
  const [updatingAppId, setUpdatingAppId] = useState(null);
  const [interviewForms, setInterviewForms] = useState({});

  useEffect(() => {
    fetchRecruitments();
  }, [user]);

  const fetchRecruitments = async () => {
    try {
      const [recRes, appRes] = await Promise.all([
        api.get('recruitments/'),
        api.get('applications/')
      ]);
      let recs = Array.isArray(recRes.data) ? recRes.data : [];
      let apps = Array.isArray(appRes.data) ? appRes.data : [];
      
      const userSocId = user?.society || user?.society_id || (user?.advised_societies && user.advised_societies[0]?.id) || (user?.presided_societies && user.presided_societies[0]?.id);

      if (user?.role === 'president' || user?.role === 'faculty') {
        if (userSocId) {
          recs = recs.filter(r => r.society === userSocId);
          apps = apps.filter(a => a.recruitment_society === userSocId || a.society === userSocId);
        }
      }

      // Deduplicate recruitments by society and title
      const uniqueRecs = [];
      const seenKeys = new Set();
      for (const r of recs) {
        const key = `${r.society}-${r.title?.trim().toLowerCase()}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          uniqueRecs.push(r);
        }
      }

      setRecruitments(uniqueRecs);
      setApplications(apps);
      if (uniqueRecs.length > 0 && !selectedRecruitment) {
        setSelectedRecruitment(uniqueRecs[0]);
      } else if (uniqueRecs.length === 0) {
        setSelectedRecruitment(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateDrive = async (e) => {
    e.preventDefault();
    const userSocId = user?.society || user?.society_id || (user?.advised_societies && user.advised_societies[0]?.id) || (user?.presided_societies && user.presided_societies[0]?.id);

    if (!userSocId && user?.role !== 'admin') {
      alert("No society assigned to your account. Cannot launch recruitment drive.");
      return;
    }
    try {
      const positions = createFormData.customPositions 
        ? createFormData.customPositions.split(',').map(s => s.trim()).filter(Boolean) 
        : [];
        
      const res = await api.post('recruitments/', {
        title: createFormData.title,
        deadline: createFormData.deadline,
        society: userSocId,
        form_fields: ['statement', 'experience'],
        positions: positions.map(title => ({ title, questions: [
          "Why do you want to join this society?",
          "What is your relevant experience or past projects?"
        ] }))
      });
      setShowCreateModal(false);
      setCreateFormData({ title: '', deadline: '', customPositions: '' });
      fetchRecruitments();
      setSelectedRecruitment(res.data);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to launch recruitment drive.");
    }
  };

  const handleUpdateStatus = async (appId, newStatus) => {
    setUpdatingAppId(appId);
    try {
      await api.post(`applications/${appId}/update_status/`, {
        status: newStatus
      });
      fetchRecruitments();
    } catch (err) {
      alert("Failed to update applicant status.");
    } finally {
      setUpdatingAppId(null);
    }
  };

  const handleSaveInterview = async (appId) => {
    setUpdatingAppId(appId);
    try {
      const form = interviewForms[appId] || {};
      await api.post(`applications/${appId}/update_status/`, {
        interview_slot: form.slot || undefined,
        interview_score: form.score ? parseInt(form.score) : undefined
      });
      fetchRecruitments();
      alert("Interview schedule & score updated!");
    } catch (err) {
      alert("Failed to save interview details.");
    } finally {
      setUpdatingAppId(null);
    }
  };

  // Filter applications for the active drive
  const driveApplications = applications.filter(a => {
    if (selectedRecruitment && a.recruitment !== selectedRecruitment.id) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (a.student_name && a.student_name.toLowerCase().includes(q)) ||
             (a.role_applied_for && a.role_applied_for.toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-violet-600 bg-violet-50 px-3 py-1 rounded-full border border-violet-100">
                Phase 2: Society Operations
              </span>
              <span className="text-xs font-bold text-slate-400">Recruitment & Membership Pipeline</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-2 flex items-center gap-3">
              <UserPlus className="text-violet-600" /> Recruitment Scoring Pipeline
            </h1>
            <p className="text-slate-500 text-sm mt-1 max-w-xl font-medium">
              Review applicant portfolios, schedule interview slots, score candidate responses, and issue verified membership appointments.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/president-dashboard"
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
            >
              Back to President Portal
            </Link>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-violet-600/30 transition cursor-pointer"
            >
              <UserPlus size={16} /> Launch New Drive
            </button>
          </div>
        </div>

        {/* DRIVE SELECTOR STRIP */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm flex items-center gap-3 overflow-x-auto">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400 px-3 whitespace-nowrap">
            Select Drive:
          </span>
          {recruitments.map(rec => {
            const count = applications.filter(a => a.recruitment === rec.id).length;
            const isSelected = selectedRecruitment?.id === rec.id;

            return (
              <button
                key={rec.id}
                onClick={() => setSelectedRecruitment(rec)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 transition whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{rec.title}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${isSelected ? 'bg-violet-500 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {count} Applicants
                </span>
              </button>
            );
          })}
        </div>

        {/* RECRUITMENT PIPELINE MAIN VIEW */}
        {selectedRecruitment && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">

            {/* PIPELINE OVERVIEW CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Applicants', count: applications.filter(a => a.recruitment === selectedRecruitment.id).length, color: 'text-slate-900', bg: 'bg-slate-50' },
                { label: 'Shortlisted for Interview', count: applications.filter(a => a.recruitment === selectedRecruitment.id && a.status === 'shortlisted').length, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { label: 'Accepted Members', count: applications.filter(a => a.recruitment === selectedRecruitment.id && a.status === 'accepted').length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Rejected / Archived', count: applications.filter(a => a.recruitment === selectedRecruitment.id && a.status === 'rejected').length, color: 'text-rose-600', bg: 'bg-rose-50' },
              ].map((stat, i) => (
                <div key={i} className={`p-4 rounded-2xl border border-slate-100 ${stat.bg}`}>
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">{stat.label}</p>
                  <p className={`text-2xl font-black mt-1 ${stat.color}`}>{stat.count}</p>
                </div>
              ))}
            </div>

            {/* FILTER & SEARCH */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-100">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Filter by applicant or role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white outline-none"
                />
              </div>

              {/* Status Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                {[
                  { id: 'all', label: 'All Candidates' },
                  { id: 'pending', label: 'Pending' },
                  { id: 'shortlisted', label: 'Shortlisted' },
                  { id: 'accepted', label: 'Accepted' },
                  { id: 'rejected', label: 'Rejected' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      statusFilter === tab.id
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* APPLICANTS PIPELINE ROSTER */}
            {driveApplications.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                <p className="text-slate-400 text-sm font-semibold">No candidates found matching the selected filter.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {driveApplications.map(app => {
                  const statusColors = {
                    pending: 'bg-amber-100 text-amber-800 border-amber-200',
                    shortlisted: 'bg-indigo-100 text-indigo-800 border-indigo-200',
                    accepted: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                    rejected: 'bg-rose-100 text-rose-800 border-rose-200'
                  };

                  return (
                    <div
                      key={app.id}
                      className="p-5 border border-slate-200/90 rounded-2xl bg-white shadow-sm hover:shadow-md transition space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-violet-50 border border-violet-100 text-violet-600 font-black text-base flex items-center justify-center">
                            {(app.student_name || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-slate-900 text-base">{app.student_name}</h3>
                              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${statusColors[app.status]}`}>
                                {app.status}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-slate-500 mt-0.5 mb-1">
                              Applied Role: <strong className="text-violet-600">{app.role_applied_for || 'General Cabinet Member'}</strong>
                            </p>
                            <p className="text-[11px] text-slate-500">
                              <strong>Roll No:</strong> {app.student_roll_number || 'N/A'} | <strong>Phone:</strong> {app.student_phone || 'N/A'} <br/>
                              <strong>Semester:</strong> {app.student_semester || 'N/A'} | <strong>Dept:</strong> {app.student_department || 'N/A'}
                            </p>
                          </div>
                        </div>

                        {/* PIPELINE STATUS TRANSITION BUTTONS */}
                        <div className="flex flex-wrap items-center gap-2">
                          {app.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(app.id, 'shortlisted')}
                                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                              >
                                <Star size={13} /> Shortlist
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(app.id, 'rejected')}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {app.status === 'shortlisted' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(app.id, 'accepted')}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
                              >
                                <CheckCircle2 size={13} /> Accept & Enlist
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(app.id, 'rejected')}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition"
                              >
                                Decline
                              </button>
                            </>
                          )}

                          {app.status === 'accepted' && (
                            <button
                              onClick={() => setSelectedAppForLetter(app)}
                              className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                            >
                              <FileText size={14} /> Official Appointment Letter
                            </button>
                          )}
                        </div>
                      </div>

                      {/* STATEMENT / ANSWERS PREVIEW */}
                      {app.answers?.statement && (
                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-700">
                          <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">Statement of Interest:</span>
                          <p className="italic">"{app.answers.statement}"</p>
                        </div>
                      )}

                      {/* INTERVIEW SCHEDULING & SCORING SECTION */}
                      <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-semibold text-slate-600">
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex items-center gap-1.5">
                            <Clock size={15} className="text-violet-500" />
                            <span>
                              Interview: <strong>{app.interview_slot ? new Date(app.interview_slot).toLocaleString() : 'Not Scheduled'}</strong>
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Award size={15} className="text-amber-500" />
                            <span>
                              Evaluation Score: <strong>{app.interview_score !== null && app.interview_score !== undefined ? `${app.interview_score}/100` : 'Pending'}</strong>
                            </span>
                          </div>
                        </div>

                        {/* Inline Interview Scheduler Form */}
                        <div className="flex items-center gap-2">
                          <input
                            type="datetime-local"
                            value={interviewForms[app.id]?.slot || ''}
                            onChange={(e) => setInterviewForms({ ...interviewForms, [app.id]: { ...interviewForms[app.id], slot: e.target.value } })}
                            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-medium"
                          />
                          <input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="Score (0-100)"
                            value={interviewForms[app.id]?.score || ''}
                            onChange={(e) => setInterviewForms({ ...interviewForms, [app.id]: { ...interviewForms[app.id], score: e.target.value } })}
                            className="w-24 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-medium"
                          />
                          <button
                            onClick={() => handleSaveInterview(app.id)}
                            className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[11px] font-bold hover:bg-slate-800"
                          >
                            Save
                          </button>
                        </div>
                      </div>

                      {/* APPLICATION DETAILS / ANSWERS */}
                      {app.answers && Object.keys(app.answers).length > 0 && (
                        <div className="mt-4 p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">Applicant Responses</h4>
                          <div className="space-y-2.5">
                            {Object.entries(app.answers).map(([key, value]) => {
                              if (key === '0' && app.answers['motivation']) return null; // Avoid duplicate motivation
                              let questionLabel = key;
                              if (key === 'motivation') questionLabel = "Statement of Motivation";
                              else if (!isNaN(key)) questionLabel = `Screening Question ${parseInt(key) + 1}`;
                              
                              return (
                                <div key={key}>
                                  <p className="text-[10.5px] font-bold text-slate-500 mb-1">{questionLabel}</p>
                                  <p className="text-xs text-slate-800 bg-white p-2 rounded-lg border border-slate-200 leading-relaxed shadow-sm">{value}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

      </div>

      {/* CREATE NEW RECRUITMENT DRIVE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
            <h3 className="text-xl font-black text-slate-900 mb-2">Launch Recruitment Drive</h3>
            <p className="text-xs text-slate-500 mb-5">Open an official campaign for cabinet associates and society team members.</p>

            <form onSubmit={handleCreateDrive} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Drive Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fall 2026 Cabinet Recruitment"
                  value={createFormData.title}
                  onChange={(e) => setCreateFormData({ ...createFormData, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Application Deadline
                </label>
                <input
                  type="datetime-local"
                  required
                  value={createFormData.deadline}
                  onChange={(e) => setCreateFormData({ ...createFormData, deadline: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Target Positions / Roles
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vice President, Event Coordinator, Graphic Designer"
                  value={createFormData.customPositions}
                  onChange={(e) => setCreateFormData({ ...createFormData, customPositions: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-violet-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">Leave blank to use default roles. Separate multiple roles with commas.</p>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Publish Drive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OFFICIAL MEMBERSHIP APPOINTMENT LETTER MODAL */}
      {selectedAppForLetter && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl relative border-4 border-indigo-100 print:border-none print:shadow-none">
            {/* PRINT / ACTION BAR */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100 print:hidden">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-emerald-500" /> Verified Appointment Document
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md"
                >
                  <Download size={14} /> Print / Save PDF
                </button>
                <button
                  onClick={() => setSelectedAppForLetter(null)}
                  className="px-3 py-2 bg-slate-100 font-bold text-xs rounded-xl hover:bg-slate-200"
                >
                  Close
                </button>
              </div>
            </div>

            {/* LETTERHEAD CONTENT */}
            <div className="text-center pb-6 border-b-2 border-slate-900">
              <h2 className="text-xl font-black uppercase tracking-widest text-slate-900">
                University Departmental Societies
              </h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                Office of Student Affairs & Society Governance
              </p>
            </div>

            <div className="my-6 space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="flex justify-between font-bold text-slate-500">
                <span>Date: {new Date().toLocaleDateString()}</span>
                <span>Ref: DSMS/MEM/{selectedAppForLetter.id}/2026</span>
              </div>

              <p className="font-bold text-slate-900 text-sm">
                To: {selectedAppForLetter.student_name}
              </p>

              <h3 className="font-black text-slate-900 text-sm uppercase tracking-wide py-1 border-b border-slate-200">
                Subject: Official Appointment Letter - {selectedAppForLetter.role_applied_for || 'Cabinet Associate'}
              </h3>

              <p>
                Dear <strong>{selectedAppForLetter.student_name}</strong>,
              </p>

              <p>
                Following the competitive recruitment drive and interview evaluation conducted by the society executive committee, we are pleased to officially appoint you to the position of <strong>{selectedAppForLetter.role_applied_for || 'Cabinet Associate'}</strong> for the <strong>2025–2026 Academic Term</strong>.
              </p>

              <p>
                In this leadership capacity, you will represent the society, organize student initiatives, uphold university codes of conduct, and contribute towards our mission. Your digital membership card and verifiable activity ledger have been activated in your Student Vault.
              </p>
            </div>

            <div className="mt-10 pt-6 border-t border-slate-200 flex justify-between items-end text-xs font-bold text-slate-600">
              <div>
                <p className="font-black text-slate-900">Alice (President)</p>
                <p className="text-[10px] text-slate-400">Executive Society Council</p>
              </div>
              <div className="text-right">
                <p className="font-black text-slate-900">Dr. Alan Turing</p>
                <p className="text-[10px] text-slate-400">Faculty Advisor Stamp & Seal</p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RecruitmentManagement;
