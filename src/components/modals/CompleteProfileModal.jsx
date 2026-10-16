import { MediaImage } from '../common/AuthenticatedMedia';
import React, { useState } from 'react';
import {
  User, Mail, Phone, GraduationCap, Building2, IdCard,
  CheckCircle2, ArrowRight, X, Upload, Eye, EyeOff,
  Loader2, ShieldCheck, Sparkles, ChevronRight
} from 'lucide-react';
import api from '../../utils/api';
import { uploadFileToServer } from '../../utils/fileUpload';
import AcademicCombobox from '../common/AcademicCombobox';

const STEPS = [
  { id: 1, label: 'Personal', icon: User },
  { id: 2, label: 'Academic', icon: GraduationCap },
  { id: 3, label: 'Security', icon: ShieldCheck },
];

const fieldStyle = {
  width: '100%', padding: '11px 14px', boxSizing: 'border-box',
  background: 'rgba(15,23,42,0.7)', border: '1.5px solid rgba(51,65,85,0.8)',
  borderRadius: '10px', color: '#fff', fontSize: '13px', fontWeight: 500, outline: 'none',
};

const labelStyle = {
  display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8',
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px',
};

const SEMESTERS = [
  '1st Semester','2nd Semester','3rd Semester','4th Semester',
  '5th Semester','6th Semester','7th Semester','8th Semester',
];
const GENDERS = ['Male', 'Female', 'Prefer not to say'];

const CompleteProfileModal = ({ profile, onClose, onProfileUpdated }) => {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [form, setForm] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    father_name: profile?.father_name || '',
    phone_number: profile?.phone_number || '',
    gender: profile?.gender || '',
    cnic: profile?.cnic || '',
    avatar_url: profile?.avatar_url || '',
    department: profile?.department || '',
    faculty_name: profile?.faculty_name || '',
    program: profile?.program || '',
    batch: profile?.batch || '',
    semester: profile?.semester || '',
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showPwd, setShowPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const url = await uploadFileToServer(file, 'avatars');
      setForm(prev => ({ ...prev, avatar_url: url }));
    } catch {
      setError('Failed to upload photo. Please try again.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const formatCnic = (val) => {
    const d = val.replace(/\D/g, '');
    if (d.length <= 5) return d;
    if (d.length <= 12) return `${d.slice(0, 5)}-${d.slice(5)}`;
    return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12, 13)}`;
  };

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: '#334155' };
    let s = 0;
    if (pwd.length >= 8) s++;
    if (pwd.length >= 12) s++;
    if (/[A-Z]/.test(pwd)) s++;
    if (/[0-9]/.test(pwd)) s++;
    if (/[^A-Za-z0-9]/.test(pwd)) s++;
    if (s <= 1) return { score: s, label: 'Weak', color: '#ef4444' };
    if (s <= 2) return { score: s, label: 'Fair', color: '#f97316' };
    if (s <= 3) return { score: s, label: 'Good', color: '#eab308' };
    if (s <= 4) return { score: s, label: 'Strong', color: '#22c55e' };
    return { score: s, label: 'Very Strong', color: '#10b981' };
  };

  const pwdStrength = getPasswordStrength(form.new_password);

  const handleNext = () => {
    if (step === 1) {
      if (!form.first_name.trim() || !form.last_name.trim()) {
        setError('First and last name are required to continue.');
        return;
      }
    }
    if (step === 2) {
      if (!form.department.trim() || !form.program.trim()) {
        setError('Department and Degree Program are required to continue.');
        return;
      }
    }
    setError(null);
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    setError(null);
    if (form.new_password) {
      if (form.new_password.length < 8) {
        setError('New password must be at least 8 characters.');
        return;
      }
      if (form.new_password !== form.confirm_password) {
        setError('Passwords do not match.');
        return;
      }
    }

    setSaving(true);
    try {
      await api.patch('auth/profile/', {
        first_name: form.first_name,
        last_name: form.last_name,
        father_name: form.father_name,
        phone_number: form.phone_number,
        gender: form.gender,
        cnic: form.cnic,
        avatar_url: form.avatar_url,
        profile_photo_url: form.avatar_url,
        department: form.department,
        faculty_name: form.faculty_name,
        program: form.program,
        batch: form.batch,
        semester: form.semester,
      });

      if (form.new_password && form.current_password) {
        await api.post('auth/change-password/', {
          current_password: form.current_password,
          new_password: form.new_password,
        });
      }

      setSuccess(true);
      setTimeout(() => {
        onProfileUpdated?.();
        onClose?.();
      }, 1800);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Failed to save profile. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const completionFields = [
    !form.first_name || !form.last_name,
    !form.phone_number,
    !form.gender,
    !form.cnic,
    !form.avatar_url,
    !form.department,
    !form.program,
    !form.batch,
    !form.semester,
  ];
  const filled = completionFields.filter(f => !f).length;
  const total = completionFields.length;
  const pct = Math.round((filled / total) * 100);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px', overflowY: 'auto'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #0d1a2e 100%)',
        border: '1px solid rgba(99,102,241,0.25)', borderRadius: '24px',
        maxWidth: '520px', width: '100%',
        boxShadow: '0 40px 100px rgba(0,0,0,0.7)',
        overflow: 'hidden', position: 'relative', margin: 'auto'
      }}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          padding: '24px 28px 20px', position: 'relative'
        }}>
          <button onClick={onClose} style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
            color: '#fff', cursor: 'pointer', padding: '6px',
            display: 'flex', alignItems: 'center'
          }}>
            <X size={15} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <div style={{ padding: '10px', background: 'rgba(255,255,255,0.15)', borderRadius: '14px' }}>
              <Sparkles size={22} color="#fff" />
            </div>
            <div>
              <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 900, margin: '0 0 2px' }}>
                Complete Your Profile
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', margin: 0 }}>
                Help us set up your campus identity
              </p>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Profile Completion</span>
              <span style={{ fontSize: '11px', color: '#fff', fontWeight: 800 }}>{pct}%</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '9999px', height: '6px' }}>
              <div style={{
                width: `${pct}%`, height: '100%', borderRadius: '9999px',
                background: 'linear-gradient(90deg, #a5f3fc, #818cf8)',
                transition: 'width 0.4s ease'
              }} />
            </div>
          </div>
        </div>

        {/* Step Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 28px 0' }}>
          {STEPS.map((s, idx) => (
            <React.Fragment key={s.id}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: step > s.id ? '#22c55e' : step === s.id ? '#6366f1' : 'rgba(51,65,85,0.8)',
                  border: `2px solid ${step > s.id ? '#22c55e' : step === s.id ? '#818cf8' : 'rgba(51,65,85,0.5)'}`,
                  transition: 'all 0.3s', color: '#fff'
                }}>
                  {step > s.id ? <CheckCircle2 size={15} /> : <s.icon size={14} />}
                </div>
                <span style={{
                  fontSize: '10px', fontWeight: 700,
                  color: step >= s.id ? '#94a3b8' : '#475569',
                  textTransform: 'uppercase', letterSpacing: '0.05em'
                }}>{s.label}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <div style={{
                  flex: 1, height: '2px', margin: '0 6px', marginBottom: '16px',
                  background: step > s.id ? '#22c55e' : 'rgba(51,65,85,0.5)',
                  transition: 'background 0.3s'
                }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: '20px 28px 24px' }}>
          {error && (
            <div style={{
              marginBottom: '14px', padding: '11px 14px',
              background: 'rgba(127,29,29,0.5)', border: '1px solid rgba(185,28,28,0.4)',
              borderRadius: '11px', color: '#fca5a5', fontSize: '12px'
            }}>{error}</div>
          )}

          {success ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ display: 'inline-flex', padding: '20px', background: 'rgba(34,197,94,0.15)', borderRadius: '50%', marginBottom: '14px' }}>
                <CheckCircle2 size={40} color="#22c55e" />
              </div>
              <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 900, margin: '0 0 6px' }}>Profile Updated!</h3>
              <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>Your campus profile has been saved successfully.</p>
            </div>
          ) : (
            <>
              {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Avatar Upload */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'rgba(99,102,241,0.08)', borderRadius: '14px', border: '1px solid rgba(99,102,241,0.15)' }}>
                    <div style={{ width: '70px', height: '70px', borderRadius: '16px', flexShrink: 0, overflow: 'hidden', background: 'rgba(51,65,85,0.8)', border: '2px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {form.avatar_url
                        ? <MediaImage src={form.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <User size={28} color="#475569" />}
                    </div>
                    <div>
                      <p style={{ color: '#fff', fontSize: '13px', fontWeight: 700, margin: '0 0 3px' }}>Profile Photo</p>
                      <p style={{ color: '#64748b', fontSize: '11px', margin: '0 0 8px' }}>Upload a clear photo of yourself</p>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: '#6366f1', borderRadius: '9px', color: '#fff', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                        {avatarUploading ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={12} />}
                        {avatarUploading ? 'Uploading...' : 'Choose Photo'}
                        <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                      </label>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={labelStyle}>First Name <span style={{ color: '#f87171' }}>*</span></label>
                      <input name="first_name" value={form.first_name} onChange={handleChange} placeholder="Ali" style={fieldStyle}
                        onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = 'rgba(51,65,85,0.8)'} />
                    </div>
                    <div>
                      <label style={labelStyle}>Last Name <span style={{ color: '#f87171' }}>*</span></label>
                      <input name="last_name" value={form.last_name} onChange={handleChange} placeholder="Khan" style={fieldStyle}
                        onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = 'rgba(51,65,85,0.8)'} />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Father's Name</label>
                    <input name="father_name" value={form.father_name} onChange={handleChange} placeholder="e.g. Muhammad Aslam Khan" style={fieldStyle}
                      onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = 'rgba(51,65,85,0.8)'} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={labelStyle}>Gender</label>
                      <select name="gender" value={form.gender} onChange={handleChange}
                        style={{ ...fieldStyle, cursor: 'pointer' }}
                        onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = 'rgba(51,65,85,0.8)'}>
                        <option value="" style={{ background: '#0f172a' }}>Select gender</option>
                        {GENDERS.map(g => <option key={g} value={g} style={{ background: '#0f172a' }}>{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Phone Number</label>
                      <input name="phone_number" value={form.phone_number} onChange={handleChange} placeholder="03xx-xxxxxxx" style={fieldStyle}
                        onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = 'rgba(51,65,85,0.8)'} />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>CNIC / B-Form</label>
                    <input name="cnic" value={form.cnic} maxLength={15}
                      onChange={e => setForm(prev => ({ ...prev, cnic: formatCnic(e.target.value) }))}
                      placeholder="35201-1234567-1" style={{ ...fieldStyle, fontFamily: 'monospace' }}
                      onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = 'rgba(51,65,85,0.8)'} />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <AcademicCombobox
                    selectedFaculty={form.faculty_name}
                    onFacultyChange={(fac) => setForm(prev => ({ ...prev, faculty_name: fac }))}
                    selectedDepartment={form.department}
                    onDepartmentChange={(dept) => setForm(prev => ({ ...prev, department: dept }))}
                    selectedProgram={form.program}
                    onProgramChange={(prog) => setForm(prev => ({ ...prev, program: prog }))}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={labelStyle}>Academic Batch</label>
                      <input name="batch" value={form.batch} onChange={handleChange}
                        placeholder="e.g. 2023-2027"
                        style={fieldStyle} onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = 'rgba(51,65,85,0.8)'} />
                    </div>
                    <div>
                      <label style={labelStyle}>Current Semester</label>
                      <select name="semester" value={form.semester} onChange={handleChange}
                        style={{ ...fieldStyle, cursor: 'pointer' }}
                        onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = 'rgba(51,65,85,0.8)'}>
                        <option value="" style={{ background: '#0f172a' }}>Select semester</option>
                        {SEMESTERS.map(s => <option key={s} value={s} style={{ background: '#0f172a' }}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Preview card */}
                  <div style={{ padding: '14px', background: 'rgba(99,102,241,0.08)', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.15)' }}>
                    <p style={{ color: '#818cf8', fontSize: '11px', fontWeight: 700, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Profile Preview</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0, overflow: 'hidden', background: 'rgba(51,65,85,0.8)', border: '2px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {form.avatar_url
                          ? <MediaImage src={form.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <User size={22} color="#475569" style={{ margin: '11px' }} />}
                      </div>
                      <div>
                        <p style={{ color: '#fff', fontSize: '13px', fontWeight: 800, margin: '0 0 2px' }}>
                          {form.first_name || 'First'} {form.last_name || 'Last'}
                        </p>
                        <p style={{ color: '#64748b', fontSize: '11px', margin: 0 }}>
                          {form.program || 'Degree Program'} {form.batch ? `· ${form.batch}` : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ padding: '14px', background: 'rgba(99,102,241,0.08)', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.15)', marginBottom: '4px' }}>
                    <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0, lineHeight: 1.6 }}>
                      <strong style={{ color: '#818cf8' }}>Optional:</strong> Update your password now for better security. Leave blank to keep your current password.
                    </p>
                  </div>

                  <div>
                    <label style={labelStyle}>Current Password</label>
                    <div style={{ position: 'relative' }}>
                      <input type={showPwd ? 'text' : 'password'} name="current_password"
                        value={form.current_password} onChange={handleChange}
                        placeholder="Your current password" style={{ ...fieldStyle, paddingRight: '42px' }}
                        onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = 'rgba(51,65,85,0.8)'} />
                      <button type="button" onClick={() => setShowPwd(!showPwd)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex' }}>
                        {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>New Password</label>
                    <div style={{ position: 'relative' }}>
                      <input type={showNewPwd ? 'text' : 'password'} name="new_password"
                        value={form.new_password} onChange={handleChange}
                        placeholder="Min 8 characters" style={{ ...fieldStyle, paddingRight: '42px' }}
                        onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = 'rgba(51,65,85,0.8)'} />
                      <button type="button" onClick={() => setShowNewPwd(!showNewPwd)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex' }}>
                        {showNewPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    {form.new_password && (
                      <div style={{ marginTop: '7px' }}>
                        <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                          {[1,2,3,4,5].map(i => (
                            <div key={i} style={{ flex: 1, height: '3px', borderRadius: '9999px', background: i <= pwdStrength.score ? pwdStrength.color : 'rgba(51,65,85,0.8)', transition: 'background 0.3s' }} />
                          ))}
                        </div>
                        <p style={{ fontSize: '11px', color: pwdStrength.color, margin: 0 }}>Strength: {pwdStrength.label}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={labelStyle}>Confirm New Password</label>
                    <input type="password" name="confirm_password"
                      value={form.confirm_password} onChange={handleChange}
                      placeholder="Re-enter new password"
                      style={{ ...fieldStyle, borderColor: form.confirm_password && form.new_password !== form.confirm_password ? 'rgba(185,28,28,0.7)' : 'rgba(51,65,85,0.8)' }}
                      onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = 'rgba(51,65,85,0.8)'} />
                    {form.confirm_password && form.new_password === form.confirm_password && (
                      <p style={{ fontSize: '11px', color: '#22c55e', marginTop: '5px' }}>Passwords match</p>
                    )}
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '22px' }}>
                <button type="button" onClick={() => step === 1 ? onClose?.() : setStep(s => s - 1)}
                  style={{ padding: '10px 18px', background: 'rgba(51,65,85,0.6)', border: '1px solid rgba(51,65,85,0.8)', borderRadius: '10px', color: '#94a3b8', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                  {step === 1 ? 'Skip for now' : '← Back'}
                </button>

                {step < 3 ? (
                  <button type="button" onClick={handleNext}
                    style={{ padding: '10px 22px', background: 'linear-gradient(135deg, #6366f1, #7c3aed)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}>
                    Next <ChevronRight size={14} />
                  </button>
                ) : (
                  <button type="button" onClick={handleSubmit} disabled={saving}
                    style={{ padding: '10px 22px', background: saving ? 'rgba(34,197,94,0.4)' : 'linear-gradient(135deg, #059669, #0d9488)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '12px', fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {saving ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : <><CheckCircle2 size={14} /> Save Profile</>}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default CompleteProfileModal;
