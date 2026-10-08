import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, CheckCircle, XCircle, Loader2, QrCode, BadgeCheck } from 'lucide-react';
import api from '../utils/api';

const VerifyPage = ({ type }) => {
  const { code } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const endpoint = type === 'member'
      ? `verify/member/${code}/`
      : `verify/ticket/${code}/`;

    api.get(endpoint)
      .then(res => setResult(res.data))
      .catch(err => {
        const d = err.response?.data;
        if (d && 'valid' in d) setResult(d);
        else setError('Unable to reach the verification server. Please try again.');
      })
      .finally(() => setLoading(false));
  }, [code, type]);

  const defaultAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80';

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center py-12 px-4" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 70%)', filter: 'blur(60px)' }} />

      <div className="relative z-10 text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 mb-4 rounded-2xl" style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
          <QrCode size={28} className="text-indigo-400" />
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">Digital ID Verification Portal</h1>
        <p className="text-xs text-slate-400 mt-1">Departmental Society Management System • University Portal</p>
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {loading && (
          <div className="rounded-3xl p-10 flex flex-col items-center gap-4 text-slate-300" style={{ background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(71,85,105,0.8)' }}>
            <Loader2 size={36} className="animate-spin text-indigo-400" />
            <p className="text-sm font-bold">Verifying credential with the university registry…</p>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-3xl p-8 text-center space-y-3" style={{ background: 'rgba(127,29,29,0.6)', border: '1px solid rgba(185,28,28,0.5)' }}>
            <XCircle size={40} className="text-rose-400 mx-auto" />
            <p className="text-rose-200 font-bold text-sm">{error}</p>
          </div>
        )}

        {result && !loading && (
          <div className="space-y-4">
            {/* Status Banner */}
            <div className="rounded-3xl p-5 flex items-center gap-4" style={{
              background: result.valid ? 'rgba(6,78,59,0.6)' : 'rgba(127,29,29,0.6)',
              border: `1px solid ${result.valid ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.5)'}`
            }}>
              {result.valid
                ? <CheckCircle size={36} className="text-emerald-400 shrink-0" />
                : <XCircle size={36} className="text-rose-400 shrink-0" />
              }
              <div>
                <p className={`font-black text-base ${result.valid ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {result.valid ? '✓ Credential Verified' : '✗ Verification Failed'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {result.valid ? `${result.credential_type} is authentic and active.` : result.error}
                </p>
              </div>
            </div>

            {result.valid && result.student && (
              <>
                {/* Student Info */}
                <div className="rounded-3xl p-6 space-y-4" style={{ background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(71,85,105,0.7)' }}>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0" style={{ border: '2px solid rgba(99,102,241,0.4)' }}>
                      <img
                        src={result.student.avatar_url || defaultAvatar}
                        alt={result.student.full_name}
                        className="w-full h-full object-cover"
                        onError={e => { e.target.src = defaultAvatar; }}
                      />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-white">{result.student.full_name}</h2>
                      <p className="text-xs font-bold text-indigo-300">
                        {type === 'member' ? (result.membership?.role_title || 'General Member') : 'Event Registrant'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {[
                      { label: 'Roll Number', value: result.student.roll_number, mono: true },
                      { label: 'Gender', value: result.student.gender, capitalize: true },
                      { label: 'Program', value: result.student.program, span: true },
                      { label: 'Department', value: result.student.department, span: true },
                    ].filter(f => f.value).map(f => (
                      <div key={f.label} className={`rounded-xl p-3 ${f.span ? 'col-span-2' : ''}`} style={{ background: 'rgba(15,23,42,0.7)' }}>
                        <span className="block text-[10px] font-bold uppercase text-slate-400">{f.label}</span>
                        <span className={`text-white font-bold ${f.mono ? 'font-mono' : ''} ${f.capitalize ? 'capitalize' : ''}`}>{f.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Membership Details */}
                {type === 'member' && result.society && (
                  <div className="rounded-3xl p-6 space-y-4" style={{ background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(71,85,105,0.7)' }}>
                    <div className="flex items-center gap-3 pb-3" style={{ borderBottom: '1px solid rgba(71,85,105,0.6)' }}>
                      {result.society.logo ? (
                        <img src={result.society.logo} alt={result.society.name} className="w-10 h-10 rounded-xl object-cover" style={{ border: '1px solid rgba(71,85,105,0.6)' }} />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-indigo-700 flex items-center justify-center font-black text-white text-sm">
                          {result.society.name?.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-black text-white">{result.society.name}</p>
                        <p className="text-xs text-indigo-400 font-bold">Departmental Society</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {[
                        { label: 'Membership ID', value: result.membership?.membership_id, amber: true, mono: true },
                        { label: 'Status', value: result.membership?.is_active ? '● Active' : '● Inactive', green: result.membership?.is_active },
                        { label: 'Valid Until', value: result.membership?.valid_until, span: true },
                        { label: 'Issued By (President)', value: result.society.president_name },
                        { label: 'Faculty Advisor', value: result.society.advisor_name },
                      ].filter(f => f.value).map(f => (
                        <div key={f.label} className={`rounded-xl p-3 ${f.span ? 'col-span-2' : ''}`} style={{ background: 'rgba(15,23,42,0.7)' }}>
                          <span className="block text-[10px] font-bold uppercase text-slate-400">{f.label}</span>
                          <span className={`font-bold ${f.amber ? 'text-amber-400 font-mono text-[11px]' : f.green !== undefined ? (f.green ? 'text-emerald-400' : 'text-rose-400') : 'text-white'}`}>{f.value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-2xl" style={{ background: 'rgba(6,78,59,0.4)', border: '1px solid rgba(16,185,129,0.3)' }}>
                      <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                      <p className="text-[11px] text-emerald-300 font-bold">Endorsed by Directorate of Student Affairs &amp; Super Admin</p>
                    </div>
                  </div>
                )}

                {/* Ticket Details */}
                {type === 'ticket' && result.event && (
                  <div className="rounded-3xl p-6 space-y-4" style={{ background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(71,85,105,0.7)' }}>
                    <div className="flex items-center gap-3 pb-3" style={{ borderBottom: '1px solid rgba(71,85,105,0.6)' }}>
                      {result.society?.logo ? (
                        <img src={result.society.logo} alt={result.society.name} className="w-10 h-10 rounded-xl object-cover" style={{ border: '1px solid rgba(71,85,105,0.6)' }} />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-violet-700 flex items-center justify-center font-black text-white text-sm">
                          {result.society?.name?.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-black text-white">{result.event.title}</p>
                        <p className="text-xs text-violet-400 font-bold">{result.society?.name}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {[
                        { label: 'Venue', value: result.event.venue, span: true },
                        { label: 'Date & Time', value: result.event.date ? new Date(result.event.date).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' }) : null, span: true },
                        { label: 'Entry Fee', value: result.event.is_paid ? `PKR ${result.event.price}` : 'Free Entry' },
                        { label: 'Check-In', value: result.ticket?.attendance_status ? '✓ Checked In' : '● Not Yet Scanned', green: result.ticket?.attendance_status },
                      ].filter(f => f.value).map(f => (
                        <div key={f.label} className={`rounded-xl p-3 ${f.span ? 'col-span-2' : ''}`} style={{ background: 'rgba(15,23,42,0.7)' }}>
                          <span className="block text-[10px] font-bold uppercase text-slate-400">{f.label}</span>
                          <span className={`font-bold ${f.green !== undefined ? (f.green ? 'text-emerald-400' : 'text-amber-400') : 'text-white'}`}>{f.value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-2xl" style={{ background: 'rgba(6,78,59,0.4)', border: '1px solid rgba(16,185,129,0.3)' }}>
                      <BadgeCheck size={16} className="text-emerald-400 shrink-0" />
                      <p className="text-[11px] text-emerald-300 font-bold">Payment verified. Ticket is authentic and valid for this event.</p>
                    </div>
                  </div>
                )}

                {result.verified_at && (
                  <p className="text-center text-[11px] text-slate-500 font-mono">
                    Verified at {new Date(result.verified_at).toLocaleString()} via DSMS Portal
                  </p>
                )}
              </>
            )}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link to="/login" className="text-xs text-slate-500 hover:text-slate-300 transition">
            Sign in to campus portal →
          </Link>
        </div>
      </div>
    </div>
  );
};

export const VerifyMemberPage = () => <VerifyPage type="member" />;
export const VerifyTicketPage = () => <VerifyPage type="ticket" />;
export default VerifyPage;
