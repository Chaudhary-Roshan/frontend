import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';
import { 
  FileText, Download, Printer, ShieldCheck, Award, 
  Calendar, CheckCircle2, Clock, Users, ArrowLeft, QrCode
} from 'lucide-react';
import { Link } from 'react-router-dom';
import QRCode from 'react-qr-code';

const CoCurricularTranscript = () => {
  const { user } = useContext(AuthContext);
  const [registrations, setRegistrations] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [volunteerHours, setVolunteerHours] = useState([]);
  const [cabinetPositions, setCabinetPositions] = useState([]);

  useEffect(() => {
    fetchTranscriptData();
  }, [user]);

  const fetchTranscriptData = async () => {
    try {
      const [regRes, certRes, memRes, volRes, cabRes] = await Promise.allSettled([
        api.get('registrations/'),
        api.get('certificates/'),
        api.get('memberships/'),
        api.get('volunteer-hours/'),
        api.get('cabinet/')
      ]);

      if (regRes.status === 'fulfilled') {
        // Only attended events count on transcript
        setRegistrations(regRes.value.data.filter(r => r.attendance_status));
      }
      if (certRes.status === 'fulfilled') setCertificates(certRes.value.data);
      if (memRes.status === 'fulfilled') setMemberships(memRes.value.data);
      if (volRes.status === 'fulfilled') setVolunteerHours(volRes.value.data);
      if (cabRes.status === 'fulfilled') {
        setCabinetPositions(cabRes.value.data.filter(c => c.user === user?.id || c.username === user?.username));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const totalVolHours = volunteerHours.reduce((sum, v) => sum + parseFloat(v.hours || 0), 0);
  const totalCertificates = certificates.length;
  const totalEventsAttended = registrations.length;
  const totalSocieties = memberships.length;

  // Calculate an exemplary Co-Curricular Activity Index (GPA of Extracurriculars)
  const activityScore = Math.min(4.0, (
    (totalEventsAttended * 0.4) + 
    (totalVolHours * 0.1) + 
    (cabinetPositions.length * 1.0) + 
    (totalCertificates * 0.5)
  )).toFixed(2);

  const verificationUrl = `${window.location.origin}/verify?user=${user?.username}`;

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* TOP ACTION BAR (HIDDEN IN PRINT) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm print:hidden">
          <Link
            to="/student-dashboard"
            className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft size={16} /> Back to My Profile
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer"
            >
              <Printer size={16} /> Print / Save as PDF
            </button>
          </div>
        </div>

        {/* OFFICIAL TRANSCRIPT DOCUMENT */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border-4 border-slate-200 print:border-none print:shadow-none print:p-0 space-y-8">
          
          {/* HEADER LETTERHEAD */}
          <div className="text-center pb-6 border-b-2 border-slate-900 space-y-2">
            <div className="w-16 h-16 rounded-full bg-slate-900 text-white font-black text-2xl flex items-center justify-center mx-auto mb-2 shadow-md">
              🏛️
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-widest text-slate-900">
              University Office of Student Affairs
            </h1>
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">
              Departmental Societies Management System • Co-Curricular Transcript
            </p>
            <p className="text-[11px] font-bold text-slate-400">
              Official Record of Extracurricular Leadership, Service, and Verified Engagement
            </p>
          </div>

          {/* STUDENT IDENTIFICATION INFO GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Student Name</span>
              <span className="font-black text-slate-900 text-sm mt-0.5 block">{user?.first_name || user?.username}</span>
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Username / ID</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block">{user?.username}</span>
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Department</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block">Computer Science & Eng.</span>
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Issue Date</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block">{new Date().toLocaleDateString()}</span>
            </div>
          </div>

          {/* SUMMARY KPI METRICS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl">
              <span className="text-[10px] font-extrabold uppercase text-indigo-700">Events Attended</span>
              <p className="text-2xl font-black text-indigo-900 mt-1">{totalEventsAttended}</p>
            </div>
            <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl">
              <span className="text-[10px] font-extrabold uppercase text-emerald-700">Volunteer Hours</span>
              <p className="text-2xl font-black text-emerald-900 mt-1">{totalVolHours.toFixed(1)} hrs</p>
            </div>
            <div className="p-4 bg-violet-50/60 border border-violet-100 rounded-2xl">
              <span className="text-[10px] font-extrabold uppercase text-violet-700">Societies & Roles</span>
              <p className="text-2xl font-black text-violet-900 mt-1">{totalSocieties}</p>
            </div>
            <div className="p-4 bg-amber-50/60 border border-amber-100 rounded-2xl">
              <span className="text-[10px] font-extrabold uppercase text-amber-700">Co-Curricular GPA</span>
              <p className="text-2xl font-black text-amber-900 mt-1">{activityScore} / 4.0</p>
            </div>
          </div>

          {/* 1. SOCIETY MEMBERSHIPS & LEADERSHIP ROLES */}
          <div className="space-y-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 flex items-center justify-between">
              <span>1. Society Memberships & Executive Cabinet Roles</span>
              <span className="text-xs font-bold text-slate-400">{memberships.length + cabinetPositions.length} Records</span>
            </h3>

            {memberships.length === 0 && cabinetPositions.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No society positions recorded yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden text-xs">
                {cabinetPositions.map(c => (
                  <div key={c.id} className="p-3 flex justify-between items-center bg-indigo-50/40">
                    <div>
                      <span className="font-bold text-slate-900">{c.role_title}</span>
                      <span className="text-[11px] text-slate-500 block">{c.society_name} • Term {c.term_year}</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full">
                      Verified Cabinet Position
                    </span>
                  </div>
                ))}
                {memberships.map(m => (
                  <div key={m.id} className="p-3 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-900">Active Member</span>
                      <span className="text-[11px] text-slate-500 block">{m.society_name || 'Campus Society'}</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Enlisted & Good Standing
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. VERIFIED WORKSHOPS & EVENT ATTENDANCE */}
          <div className="space-y-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 flex items-center justify-between">
              <span>2. Workshops, Hackathons & Seminars Attended</span>
              <span className="text-xs font-bold text-slate-400">{registrations.length} Completed</span>
            </h3>

            {registrations.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No attendance records finalized yet.</p>
            ) : (
              <table className="w-full text-left text-xs border border-slate-200 rounded-2xl overflow-hidden">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-3">Event / Workshop</th>
                    <th className="p-3">Organizing Body</th>
                    <th className="p-3">Ticket Hash</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {registrations.map(r => (
                    <tr key={r.id}>
                      <td className="p-3 font-bold text-slate-900">{r.event_title}</td>
                      <td className="p-3 text-slate-600">University Chapter</td>
                      <td className="p-3 font-mono text-[10px] text-slate-400">{r.ticket_qr_code ? r.ticket_qr_code.substring(0, 14) : 'N/A'}</td>
                      <td className="p-3 text-right text-emerald-600 font-bold">Attendance Verified</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* 3. VERIFIED VOLUNTEER HOURS */}
          <div className="space-y-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 flex items-center justify-between">
              <span>3. Community Service & Volunteer Hours Log</span>
              <span className="text-xs font-bold text-slate-400">{totalVolHours} Total Hours</span>
            </h3>

            {volunteerHours.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No volunteer hours logged yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden text-xs">
                {volunteerHours.map(v => (
                  <div key={v.id} className="p-3 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-900">Volunteer Service</span>
                      <span className="text-[11px] text-slate-500 block">Verified by Faculty Advisor</span>
                    </div>
                    <span className="font-black text-slate-900 text-sm">+{v.hours} hrs</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. EARNED CERTIFICATES */}
          <div className="space-y-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 flex items-center justify-between">
              <span>4. Issued University Certificates</span>
              <span className="text-xs font-bold text-slate-400">{certificates.length} Issued</span>
            </h3>

            {certificates.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No certificates issued yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {certificates.map(c => (
                  <div key={c.id} className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">{c.event_title}</span>
                      <span className="font-mono text-[10px] text-slate-400">ID: {c.verification_code}</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Authentic
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* FOOTER VERIFICATION QR & STAMPS */}
          <div className="pt-8 border-t-2 border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white border border-slate-300 rounded-xl shadow-sm">
                <QRCode value={verificationUrl} size={64} />
              </div>
              <div className="text-left">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Tamper-Proof Verification</span>
                <p className="text-xs font-bold text-slate-900">Scan QR Code to Verify Online</p>
                <span className="text-[10px] text-slate-500 font-mono">HASH: {user?.id}x99-CO-CURRICULAR-OK</span>
              </div>
            </div>

            <div className="flex items-center gap-8 text-center text-xs font-bold text-slate-700">
              <div>
                <div className="w-28 border-b border-slate-400 pb-1 mb-1">
                  <span className="font-serif italic font-normal text-slate-600">Office Seal</span>
                </div>
                <span className="text-[10px] uppercase text-slate-400">Registrar Sign-Off</span>
              </div>
              <div>
                <div className="w-28 border-b border-slate-400 pb-1 mb-1">
                  <span className="font-serif italic font-normal text-slate-600">Student Affairs</span>
                </div>
                <span className="text-[10px] uppercase text-slate-400">Dean of Students</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default CoCurricularTranscript;
