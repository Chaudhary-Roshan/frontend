import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  GraduationCap, ArrowRight, AlertCircle, KeyRound,
  Mail, RefreshCw, CheckCircle2, Eye, EyeOff, Loader2, ShieldCheck
} from 'lucide-react';
import api from '../utils/api';
import AcademicCombobox from '../components/common/AcademicCombobox';





const SEMESTERS = [
  '1st Semester', '2nd Semester', '3rd Semester', '4th Semester',
  '5th Semester', '6th Semester', '7th Semester', '8th Semester',
];

const getPasswordStrength = (pwd) => {
  if (!pwd) return { score: 0, label: '', color: '#334155' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { score, label: 'Weak', color: '#ef4444' };
  if (score <= 2) return { score, label: 'Fair', color: '#f97316' };
  if (score <= 3) return { score, label: 'Good', color: '#eab308' };
  if (score <= 4) return { score, label: 'Strong', color: '#22c55e' };
  return { score, label: 'Very Strong', color: '#10b981' };
};

const inputStyle = {
  width: '100%',
  padding: '11px 14px',
  boxSizing: 'border-box',
  background: 'rgba(15,23,42,0.85)',
  border: '1.5px solid rgba(51,65,85,0.9)',
  borderRadius: '11px',
  color: '#fff',
  fontSize: '13px',
  fontWeight: 500,
  outline: 'none',
  transition: 'border-color 0.2s',
};

const labelStyle = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 700,
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  marginBottom: '6px',
};

const InputField = ({ label, required, hint, error, children }) => (
  <div style={{ marginBottom: '14px' }}>
    <label style={labelStyle}>{label}{required && <span style={{ color: '#f87171', marginLeft: '3px' }}>*</span>}</label>
    {children}
    {hint && <p style={{ fontSize: '11px', color: '#475569', marginTop: '5px', lineHeight: 1.4 }}>{hint}</p>}
    {error && <p style={{ fontSize: '11px', color: '#f87171', marginTop: '5px' }}>{error}</p>}
  </div>
);

const Register = () => {
  const [rollNumber, setRollNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    cnic: '',
    faculty_name: 'Faculty of Engineering',
    department: 'Department of Information and Communication Engineering',
    program: 'BS Cyber Security and Digital Forensics',
    batch: '',
    semester: SEMESTERS[3],
    phone_number: '',
  });

  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [otpCode, setOtpCode] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, verifyOtp, resendOtp } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.step === 'otp') {
      setStep('otp');
      if (location.state?.email) setRegisteredEmail(location.state.email);
      setSuccessMsg('Account found. Please enter your 6-digit OTP to complete activation.');
    }
  }, [location.state]);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (fieldErrors[e.target.name]) {
      setFieldErrors(prev => ({ ...prev, [e.target.name]: null }));
    }
  };

  const handleRollNumberChange = (e) => {
    const val = e.target.value.toUpperCase();
    setRollNumber(val);
    if (fieldErrors.roll_number) setFieldErrors(prev => ({ ...prev, roll_number: null }));
  };

  const formatCnic = (val) => {
    const digits = val.replace(/\D/g, '');
    if (digits.length <= 5) return digits;
    if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
  };

  const handleCnicChange = (e) => {
    const formatted = formatCnic(e.target.value);
    setFormData(prev => ({ ...prev, cnic: formatted }));
  };

  const validateForm = () => {
    const errs = {};
    if (!rollNumber.trim()) errs.roll_number = 'Student Roll Number is required.';
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errs.email = 'A valid login email address is required.';
    if (!formData.first_name.trim()) errs.first_name = 'First name is required.';
    if (!formData.last_name.trim()) errs.last_name = 'Last name is required.';
    if (!formData.department?.trim()) errs.department = 'Academic department is required.';
    if (!formData.program?.trim()) errs.program = 'Degree program is required.';
    if (!formData.password) errs.password = 'Password is required.';
    else if (formData.password.length < 8) errs.password = 'Password must be at least 8 characters.';
    if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    return errs;
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const errs = validateForm();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});
    try {
      const cleanEmail = formData.email.trim().toLowerCase();
      const payload = {
        email: cleanEmail,
        password: formData.password,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        roll_number: rollNumber.trim().toUpperCase(),
        university_email: cleanEmail,
        cnic: formData.cnic,
        faculty_name: formData.faculty_name,
        department: formData.department,
        program: formData.program,
        batch: formData.batch,
        semester: formData.semester,
        phone_number: formData.phone_number,
      };

      const res = await register(payload);
      if (res && res.requires_otp) {
        setRegisteredEmail(res.email || formData.email);
        setStep('otp');
        setResendCooldown(60);
        // Show masked email if available (from backend or GAS response)
        const displayEmail = res.masked_email || res.email || formData.email;
        setSuccessMsg(res.message || `OTP has been sent to ${displayEmail}. Please verify to activate your account.`);
      } else {
        navigate('/student-dashboard');
      }
    } catch (err) {
      console.error("Registration Error Response:", err.response);
      const data = err.response?.data;
      let errMsg = 'Registration failed. Please check your details and try again.';
      if (data) {
        if (typeof data === 'string') {
          errMsg = data;
        } else {
          errMsg = 
            data.email?.[0] || 
            data.roll_number?.[0] || 
            data.username?.[0] || 
            data.password?.[0] ||
            data.cnic?.[0] ||
            data.error || 
            data.detail || 
            data.non_field_errors?.[0] ||
            (Object.keys(data).length > 0 ? `${Object.keys(data)[0]}: ${data[Object.keys(data)[0]][0] || data[Object.keys(data)[0]]}` : errMsg);
        }
      }
      setError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 6) {
      setError('Please enter the complete 6-digit OTP code.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await verifyOtp(registeredEmail || formData.email, otpCode.trim());
      navigate('/student-dashboard');
    } catch (err) {
      const data = err.response?.data;
      // 208 = already verified — account exists, just redirect to login
      if (err.response?.status === 208 || data?.already_verified) {
        navigate('/login', {
          state: { message: 'Your account is already verified. Please log in.' }
        });
        return;
      }
      setError(data?.error || 'Invalid or expired OTP. Please try again or request a new code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const email = registeredEmail || formData.email;
      const name  = `${formData.first_name || ''} ${formData.last_name || ''}`.trim() || 'User';
      const res = await resendOtp(email, name);

      // 208 = already verified — redirect to login with a message
      if (res?.already_verified) {
        navigate('/login', {
          state: { message: 'Your account is already verified. Please log in.' }
        });
        return;
      }

      const displayEmail = res.masked_email || email;
      setSuccessMsg(res.message || `A new OTP has been dispatched to ${displayEmail}.`);
      setResendCooldown(60);
    } catch (err) {
      // Axios throws on non-2xx; also check for 208 in the error response
      const data = err.response?.data;
      if (err.response?.status === 208 || data?.already_verified) {
        navigate('/login', {
          state: { message: 'Your account is already verified. Please log in.' }
        });
        return;
      }
      setError(err.response?.data?.error || err.message || 'Failed to resend OTP. Please wait a moment and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pwdStrength = getPasswordStrength(formData.password);

  return (
    <div className="min-h-screen flex flex-col justify-center py-8 sm:px-6 lg:px-8 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1a2e 50%, #0a0f1e 100%)' }}>

      {/* Ambient glows */}
      <div style={{
        position: 'absolute', top: '-80px', left: '50%', transform: 'translateX(-50%)',
        width: '700px', height: '400px', background: 'radial-gradient(ellipse, rgba(99,102,241,0.16) 0%, transparent 70%)',
        pointerEvents: 'none', borderRadius: '50%'
      }} />
      <div style={{
        position: 'absolute', bottom: '-60px', right: '-40px',
        width: '400px', height: '400px', background: 'radial-gradient(ellipse, rgba(16,185,129,0.08) 0%, transparent 70%)',
        pointerEvents: 'none', borderRadius: '50%'
      }} />

      {/* Header */}
      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '0 16px', marginBottom: '20px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          padding: '14px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: '18px', color: '#818cf8', marginBottom: '14px',
          boxShadow: '0 8px 32px rgba(99,102,241,0.2)'
        }}>
          <GraduationCap size={30} />
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
          {step === 'form' ? <>Student <span style={{ color: '#818cf8' }}>Registration</span></> : <>Verify Your <span style={{ color: '#818cf8' }}>Account</span></>}
        </h1>
        <p style={{ fontSize: '12px', color: '#64748b', margin: 0, fontWeight: 500 }}>
          Official University DSMS · Departmental Societies Management System
        </p>
      </div>

      {/* Card */}
      <div style={{ position: 'relative', zIndex: 10, margin: '0 auto', width: '100%', maxWidth: '540px', padding: '0 16px', paddingBottom: '32px' }}>
        <div style={{
          background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(51,65,85,0.8)', borderRadius: '24px',
          padding: '28px 28px 24px', boxShadow: '0 25px 60px rgba(0,0,0,0.5)'
        }}>

          {/* Alert banners */}
          {error && (
            <div style={{
              marginBottom: '18px', padding: '13px 16px',
              background: 'rgba(127,29,29,0.6)', border: '1px solid rgba(185,28,28,0.5)',
              borderRadius: '13px', display: 'flex', alignItems: 'flex-start', gap: '10px'
            }}>
              <AlertCircle size={16} style={{ color: '#f87171', flexShrink: 0, marginTop: '1px' }} />
              <span style={{ color: '#fca5a5', fontSize: '13px', lineHeight: 1.5 }}>{error}</span>
            </div>
          )}
          {successMsg && (
            <div style={{
              marginBottom: '18px', padding: '13px 16px',
              background: 'rgba(6,78,59,0.5)', border: '1px solid rgba(5,150,105,0.4)',
              borderRadius: '13px', display: 'flex', alignItems: 'flex-start', gap: '10px'
            }}>
              <CheckCircle2 size={16} style={{ color: '#34d399', flexShrink: 0, marginTop: '1px' }} />
              <span style={{ color: '#a7f3d0', fontSize: '13px', lineHeight: 1.5 }}>{successMsg}</span>
            </div>
          )}

          {step === 'form' ? (
            <form onSubmit={handleRegisterSubmit} noValidate autoComplete="on">

              {/* Roll Number */}
              <InputField label="Student Roll Number" required error={fieldErrors.roll_number}
                hint="Your official university roll number (e.g. S23BINCE1M04014)">
                <input
                  type="text"
                  name="roll_number"
                  autoComplete="off"
                  placeholder="e.g. S23BINCE1M04014"
                  value={rollNumber}
                  onChange={handleRollNumberChange}
                  style={{ ...inputStyle, fontFamily: 'monospace', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e => e.target.style.borderColor = fieldErrors.roll_number ? 'rgba(185,28,28,0.7)' : 'rgba(51,65,85,0.9)'}
                />
              </InputField>

              {/* Single Email Address */}
              <InputField label="Email Address (Receives OTP)" required error={fieldErrors.email}
                hint="Single email used for account registration, sign in, and receiving your OTP verification code.">
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  placeholder="e.g. yourname@gmail.com"
                  value={formData.email}
                  onChange={handleChange}
                  style={{ ...inputStyle, borderColor: fieldErrors.email ? 'rgba(185,28,28,0.7)' : 'rgba(51,65,85,0.9)' }}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e => e.target.style.borderColor = fieldErrors.email ? 'rgba(185,28,28,0.7)' : 'rgba(51,65,85,0.9)'}
                />
              </InputField>

              {/* First + Last Name */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <InputField label="First Name" required error={fieldErrors.first_name}>
                  <input
                    type="text"
                    name="first_name"
                    autoComplete="given-name"
                    required
                    placeholder="Ali"
                    value={formData.first_name}
                    onChange={handleChange}
                    style={{ ...inputStyle, borderColor: fieldErrors.first_name ? 'rgba(185,28,28,0.7)' : 'rgba(51,65,85,0.9)' }}
                    onFocus={e => e.target.style.borderColor = '#6366f1'}
                    onBlur={e => e.target.style.borderColor = fieldErrors.first_name ? 'rgba(185,28,28,0.7)' : 'rgba(51,65,85,0.9)'}
                  />
                </InputField>
                <InputField label="Last Name" required error={fieldErrors.last_name}>
                  <input
                    type="text"
                    name="last_name"
                    autoComplete="family-name"
                    required
                    placeholder="Khan"
                    value={formData.last_name}
                    onChange={handleChange}
                    style={{ ...inputStyle, borderColor: fieldErrors.last_name ? 'rgba(185,28,28,0.7)' : 'rgba(51,65,85,0.9)' }}
                    onFocus={e => e.target.style.borderColor = '#6366f1'}
                    onBlur={e => e.target.style.borderColor = fieldErrors.last_name ? 'rgba(185,28,28,0.7)' : 'rgba(51,65,85,0.9)'}
                  />
                </InputField>
              </div>

              {/* CNIC + Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <InputField label="CNIC / B-Form">
                  <input
                    type="text"
                    name="cnic"
                    autoComplete="off"
                    placeholder="35201-1234567-1"
                    value={formData.cnic}
                    onChange={handleCnicChange}
                    maxLength={15}
                    style={{ ...inputStyle, fontFamily: 'monospace' }}
                    onFocus={e => e.target.style.borderColor = '#6366f1'}
                    onBlur={e => e.target.style.borderColor = 'rgba(51,65,85,0.9)'}
                  />
                </InputField>
                <InputField label="Phone Number">
                  <input
                    type="tel"
                    name="phone_number"
                    autoComplete="tel"
                    placeholder="03xx-xxxxxxx"
                    value={formData.phone_number}
                    onChange={handleChange}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#6366f1'}
                    onBlur={e => e.target.style.borderColor = 'rgba(51,65,85,0.9)'}
                  />
                </InputField>
              </div>

              {/* Hierarchical Academic Selector: 1. Faculty -> 2. Department -> 3. Degree Program */}
              <div style={{ marginBottom: '14px' }}>
                <AcademicCombobox
                  selectedFaculty={formData.faculty_name}
                  onFacultyChange={(fac) => setFormData(prev => ({ ...prev, faculty_name: fac }))}
                  selectedDepartment={formData.department}
                  onDepartmentChange={(dept) => setFormData(prev => ({ ...prev, department: dept }))}
                  selectedProgram={formData.program}
                  onProgramChange={(prog) => setFormData(prev => ({ ...prev, program: prog }))}
                  departmentError={fieldErrors.department}
                  programError={fieldErrors.program}
                />
              </div>

              {/* Batch & Semester */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <InputField label="Batch" hint="e.g. 2023-2027">
                  <input
                    type="text"
                    name="batch"
                    autoComplete="off"
                    placeholder="e.g. 2023-2027"
                    value={formData.batch}
                    onChange={handleChange}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#6366f1'}
                    onBlur={e => e.target.style.borderColor = 'rgba(51,65,85,0.9)'}
                  />
                </InputField>

                <InputField label="Current Semester">
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    style={{ ...inputStyle, cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', paddingRight: '36px' }}
                    onFocus={e => e.target.style.borderColor = '#6366f1'}
                    onBlur={e => e.target.style.borderColor = 'rgba(51,65,85,0.9)'}
                  >
                    {SEMESTERS.map(s => <option key={s} value={s} style={{ background: '#0f172a' }}>{s}</option>)}
                  </select>
                </InputField>
              </div>

              {/* Password */}
              <InputField label="Password" required error={fieldErrors.password}>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="new-password"
                    required
                    placeholder="Min 8 characters"
                    value={formData.password}
                    onChange={handleChange}
                    style={{ ...inputStyle, paddingRight: '44px', borderColor: fieldErrors.password ? 'rgba(185,28,28,0.7)' : 'rgba(51,65,85,0.9)' }}
                    onFocus={e => e.target.style.borderColor = '#6366f1'}
                    onBlur={e => e.target.style.borderColor = fieldErrors.password ? 'rgba(185,28,28,0.7)' : 'rgba(51,65,85,0.9)'}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex' }}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {/* Password strength bar */}
                {formData.password && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} style={{
                          flex: 1, height: '3px', borderRadius: '9999px',
                          background: i <= pwdStrength.score ? pwdStrength.color : 'rgba(51,65,85,0.8)',
                          transition: 'background 0.3s'
                        }} />
                      ))}
                    </div>
                    <p style={{ fontSize: '11px', color: pwdStrength.color, margin: 0 }}>
                      Strength: {pwdStrength.label}
                    </p>
                  </div>
                )}
              </InputField>

              {/* Confirm Password */}
              <InputField label="Confirm Password" required error={fieldErrors.confirmPassword}>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    autoComplete="new-password"
                    required
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    style={{
                      ...inputStyle, paddingRight: '44px',
                      borderColor: fieldErrors.confirmPassword ? 'rgba(185,28,28,0.7)' :
                        (formData.confirmPassword && formData.password !== formData.confirmPassword ? 'rgba(185,28,28,0.5)' : 'rgba(51,65,85,0.9)')
                    }}
                    onFocus={e => e.target.style.borderColor = '#6366f1'}
                    onBlur={e => e.target.style.borderColor = 'rgba(51,65,85,0.9)'}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex' }}>
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <p style={{ fontSize: '11px', color: '#22c55e', marginTop: '5px' }}>✓ Passwords match</p>
                )}
              </InputField>

              {/* Security Notice */}
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px',
                background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: '11px', marginBottom: '18px'
              }}>
                <ShieldCheck size={15} style={{ color: '#818cf8', flexShrink: 0, marginTop: '1px' }} />
                <p style={{ fontSize: '11px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  By registering, you confirm that you are an enrolled student at the university.
                  Only <strong style={{ color: '#94a3b8' }}>student accounts</strong> can be self-registered.
                  Executive roles are provisioned by the Super Admin.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%', padding: '13px', border: 'none', borderRadius: '13px',
                  background: isSubmitting ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
                  color: '#fff', fontSize: '14px', fontWeight: 800,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: isSubmitting ? 'none' : '0 8px 24px rgba(99,102,241,0.35)',
                  transition: 'all 0.2s'
                }}
              >
                {isSubmitting ? (
                  <><Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> Registering Account...</>
                ) : (
                  <><span>Proceed to Email Verification</span><ArrowRight size={16} /></>
                )}
              </button>
            </form>
          ) : (
            /* OTP VERIFICATION STEP */
            <div>
              <div style={{
                textAlign: 'center', padding: '20px 16px',
                background: 'rgba(15,23,42,0.8)', borderRadius: '16px',
                border: '1px solid rgba(51,65,85,0.7)', marginBottom: '20px'
              }}>
                <div style={{
                  display: 'inline-flex', padding: '14px', background: 'rgba(99,102,241,0.15)',
                  border: '1px solid rgba(99,102,241,0.3)', borderRadius: '50%', color: '#818cf8', marginBottom: '12px'
                }}>
                  <Mail size={28} />
                </div>
                <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 800, margin: '0 0 8px' }}>
                  Check Your Email
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 4px', lineHeight: 1.6 }}>
                  A 6-digit verification code was sent from{' '}
                  <span style={{ color: '#818cf8', fontFamily: 'monospace', fontWeight: 600 }}>cssc.dice@gmail.com</span>
                  {' '}to{' '}
                  <strong style={{ color: '#e2e8f0' }}>{registeredEmail}</strong>
                </p>
                <p style={{ color: '#475569', fontSize: '11px', margin: 0 }}>
                  Check your inbox and spam folder. The code expires in 10 minutes.
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} style={{ marginBottom: '16px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ ...labelStyle, textAlign: 'center', display: 'block', marginBottom: '10px' }}>
                    Enter 6-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    required
                    placeholder="• • • • • •"
                    value={otpCode}
                    onChange={(e) => {
                      setOtpCode(e.target.value.replace(/\D/g, ''));
                      setError(null);
                    }}
                    style={{
                      ...inputStyle,
                      textAlign: 'center',
                      fontSize: '28px',
                      fontWeight: 900,
                      letterSpacing: '12px',
                      fontFamily: 'monospace',
                      padding: '16px 14px'
                    }}
                    autoFocus
                  />
                  {otpCode.length > 0 && otpCode.length < 6 && (
                    <p style={{ fontSize: '11px', color: '#f97316', marginTop: '6px', textAlign: 'center' }}>
                      {6 - otpCode.length} more digit{6 - otpCode.length !== 1 ? 's' : ''} needed
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || otpCode.length < 6}
                  style={{
                    width: '100%', padding: '13px', border: 'none', borderRadius: '13px',
                    background: (isSubmitting || otpCode.length < 6)
                      ? 'rgba(5,150,105,0.4)'
                      : 'linear-gradient(135deg, #059669, #0d9488)',
                    color: '#fff', fontSize: '14px', fontWeight: 800,
                    cursor: (isSubmitting || otpCode.length < 6) ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    boxShadow: (isSubmitting || otpCode.length < 6) ? 'none' : '0 8px 24px rgba(5,150,105,0.3)',
                    transition: 'all 0.2s'
                  }}
                >
                  {isSubmitting ? (
                    <><Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> Verifying...</>
                  ) : (
                    <><CheckCircle2 size={17} /><span>Activate Account & Sign In</span></>
                  )}
                </button>
              </form>

              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                paddingTop: '14px', borderTop: '1px solid rgba(51,65,85,0.5)'
              }}>
                <button
                  type="button"
                  onClick={() => { setStep('form'); setError(null); setSuccessMsg(null); }}
                  style={{ fontSize: '12px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  ← Edit Details
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || isSubmitting}
                  style={{
                    fontSize: '12px', color: resendCooldown > 0 ? '#475569' : '#818cf8',
                    background: 'none', border: 'none',
                    cursor: (resendCooldown > 0 || isSubmitting) ? 'not-allowed' : 'pointer',
                    fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px'
                  }}
                >
                  <RefreshCw size={12} style={{ animation: (isSubmitting && step === 'otp') ? 'spin 1s linear infinite' : 'none' }} />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(51,65,85,0.5)', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#818cf8', fontWeight: 700, textDecoration: 'none' }}>
                Sign In to Campus Hub
              </Link>
            </p>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '11px', color: '#334155', marginTop: '14px' }}>
          🔒 Your connection is encrypted · DSMS Secure Portal
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #475569 !important; }
        input:focus, select:focus { border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.15) !important; }
        select option { background: #0f172a !important; color: #fff !important; }
      `}</style>
    </div>
  );
};

export default Register;
