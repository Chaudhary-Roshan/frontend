import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ShieldCheck, LogIn, ShieldAlert, ArrowRight, KeyRound,
  X, CheckCircle, Eye, EyeOff, Loader2
} from 'lucide-react';
import api from '../utils/api';

const Login = () => {
  const [loginPortal, setLoginPortal] = useState('student'); // 'student' | 'executive'
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [unverifiedUser, setUnverifiedUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot Password Flow State
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotIdentity, setForgotIdentity] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotPwd, setShowForgotPwd] = useState(false);
  const [showForgotConfirmPwd, setShowForgotConfirmPwd] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState(null);
  const [forgotSuccess, setForgotSuccess] = useState(null);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError(null);
    setUnverifiedUser(null);

    const input = identity.trim();

    if (!input) {
      setError(loginPortal === 'student' 
        ? 'Please enter your registered University Email address.' 
        : 'Please enter your issued Username.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    if (loginPortal === 'student') {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
      if (!isEmail) {
        setError('Students must log in using their registered Email address.');
        return;
      }
    } else {
      if (input.includes('@')) {
        setError('Presidents, Faculty Advisors, and Super Admins must sign in with their assigned Username (e.g. president_cssc), not an email address.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const userData = await login(input, password);

      const getRoleDashboard = (role) => {
        if (role === 'admin') return '/admin-dashboard';
        if (role === 'faculty') return '/advisor-dashboard';
        if (role === 'president') return '/president-dashboard';
        return '/student-dashboard';
      };

      const targetDashboard = getRoleDashboard(userData.role);
      const isDashboardRoute = from && (
        from.includes('dashboard') ||
        ['/admin-dashboard', '/advisor-dashboard', '/president-dashboard', '/student-dashboard'].includes(from)
      );

      if (from && from !== '/login' && !isDashboardRoute) {
        navigate(from, { replace: true });
      } else {
        navigate(targetDashboard, { replace: true });
      }
    } catch (err) {
      if (err.response?.data?.requires_otp) {
        setUnverifiedUser({
          username: err.response.data.username || input,
          email: err.response.data.email,
          userId: err.response.data.user_id,
          detail: err.response.data.detail || 'Email verification is required before you can access your campus portal.',
        });
        setError(null);
      } else if (err.response?.data?.is_active === false) {
        setError(
          err.response.data.detail ||
          'This university account has been deactivated or suspended. Please contact campus administration.'
        );
      } else if (!err.response) {
        setError('Network error. Unable to connect to university server. Please check your internet connection.');
      } else if (err.response.status >= 500) {
        setError('Server error. The portal backend is currently restarting or experiencing an issue. Please try again in a moment.');
      } else {
        setError(
          err.response?.data?.detail ||
          err.response?.data?.error ||
          'Account not found. Please use your registered Email or Roll Number.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestResetOtp = async (e) => {
    e.preventDefault();
    if (!forgotIdentity.trim()) return;
    setForgotLoading(true);
    setForgotError(null);
    setForgotSuccess(null);
    try {
      const res = await api.post('auth/forgot-password/', { email: forgotIdentity.trim() });
      setForgotOtp('');
      setForgotSuccess(res.data.message || 'A password reset token has been sent to your registered email.');
      setForgotStep(2);
    } catch (err) {
      setForgotError(err.response?.data?.error || 'Account not found with this username or email.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!forgotOtp.trim() || !forgotNewPassword.trim()) return;
    if (forgotNewPassword.length < 8) {
      setForgotError('New password must be at least 8 characters long.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Passwords do not match. Please re-enter.');
      return;
    }
    setForgotLoading(true);
    setForgotError(null);
    try {
      const res = await api.post('auth/reset-password/', {
        email: forgotIdentity.trim(),
        token: forgotOtp.trim(),
        new_password: forgotNewPassword,
      });
      setForgotSuccess(res.data.status || 'Password reset successfully! You can now sign in.');
      setIdentity(forgotIdentity.trim());
      setPassword(forgotNewPassword);
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotStep(1);
        setForgotSuccess(null);
        setForgotError(null);
      }, 1800);
    } catch (err) {
      setForgotError(err.response?.data?.error || 'Failed to reset password. Please check your verification code.');
    } finally {
      setForgotLoading(false);
    }
  };

  const openForgotPassword = () => {
    setForgotIdentity(identity || '');
    setForgotError(null);
    setForgotSuccess(null);
    setForgotStep(1);
    setForgotOtp('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setShowForgotPassword(true);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-8 sm:px-6 lg:px-8 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1a2e 50%, #0a0f1e 100%)' }}>

      {/* Background ambient glows */}
      <div style={{
        position: 'absolute', top: '-80px', left: '50%', transform: 'translateX(-50%)',
        width: '700px', height: '400px', background: 'radial-gradient(ellipse, rgba(99,102,241,0.18) 0%, transparent 70%)',
        pointerEvents: 'none', borderRadius: '50%'
      }} />
      <div style={{
        position: 'absolute', bottom: '-60px', right: '-60px',
        width: '450px', height: '450px', background: 'radial-gradient(ellipse, rgba(59,130,246,0.10) 0%, transparent 70%)',
        pointerEvents: 'none', borderRadius: '50%'
      }} />

      {/* Header */}
      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '0 16px', marginBottom: '24px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          padding: '14px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: '18px', color: '#818cf8', marginBottom: '16px',
          boxShadow: '0 8px 32px rgba(99,102,241,0.2)'
        }}>
          <ShieldCheck size={32} />
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
          University <span style={{ color: '#818cf8' }}>DSMS</span> Portal
        </h1>
        <p style={{ fontSize: '13px', color: '#64748b', margin: 0, fontWeight: 500 }}>
          Departmental Society Management System · Secure Access
        </p>
      </div>

      {/* Card */}
      <div style={{ position: 'relative', zIndex: 10, margin: '0 auto', width: '100%', maxWidth: '460px', padding: '0 16px' }}>
        <div style={{
          background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(51,65,85,0.8)', borderRadius: '24px',
          padding: '32px', boxShadow: '0 25px 60px rgba(0,0,0,0.5)'
        }}>

          {/* Error Banner */}
          {error && (
            <div style={{
              marginBottom: '20px', padding: '14px 16px',
              background: 'rgba(127,29,29,0.6)', border: '1px solid rgba(185,28,28,0.5)',
              borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '10px'
            }}>
              <ShieldAlert size={18} style={{ color: '#f87171', flexShrink: 0 }} />
              <span style={{ color: '#fca5a5', fontSize: '13px', lineHeight: 1.5 }}>{error}</span>
            </div>
          )}

          {/* Unverified Account Banner */}
          {unverifiedUser && (
            <div style={{
              marginBottom: '20px', padding: '16px',
              background: 'rgba(120,53,15,0.5)', border: '1px solid rgba(217,119,6,0.5)',
              borderRadius: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
                <ShieldAlert size={18} style={{ color: '#fbbf24', flexShrink: 0, marginTop: '1px' }} />
                <div>
                  <p style={{ color: '#fcd34d', fontSize: '13px', fontWeight: 700, margin: '0 0 4px' }}>
                    Account Activation Required
                  </p>
                  <p style={{ color: '#fde68a', fontSize: '12px', margin: '0 0 4px', lineHeight: 1.5 }}>
                    {unverifiedUser.detail}
                  </p>
                  {unverifiedUser.email && (
                    <p style={{ color: '#fbbf24', fontSize: '11px', margin: 0, fontFamily: 'monospace' }}>
                      OTP dispatched to: {unverifiedUser.email}
                    </p>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <button
                  type="button"
                  onClick={() => navigate('/register', {
                    state: { step: 'otp', username: unverifiedUser.username, email: unverifiedUser.email }
                  })}
                  style={{
                    padding: '8px 16px', background: '#d97706', color: '#000',
                    border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: 800,
                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  Verify OTP Now <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}

          {/* PORTAL SELECTOR TABS */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px',
            background: 'rgba(30,41,59,0.7)', padding: '5px', borderRadius: '16px',
            marginBottom: '20px', border: '1px solid rgba(51,65,85,0.7)'
          }}>
            <button
              type="button"
              onClick={() => { setLoginPortal('student'); setError(null); }}
              style={{
                padding: '9px 12px', borderRadius: '12px', border: 'none',
                background: loginPortal === 'student' ? '#6366f1' : 'transparent',
                color: loginPortal === 'student' ? '#fff' : '#94a3b8',
                fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                transition: 'all 0.2s', boxShadow: loginPortal === 'student' ? '0 4px 12px rgba(99,102,241,0.35)' : 'none'
              }}
            >
              🎓 Student Portal
            </button>
            <button
              type="button"
              onClick={() => { setLoginPortal('executive'); setError(null); }}
              style={{
                padding: '9px 12px', borderRadius: '12px', border: 'none',
                background: loginPortal === 'executive' ? '#8b5cf6' : 'transparent',
                color: loginPortal === 'executive' ? '#fff' : '#94a3b8',
                fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                transition: 'all 0.2s', boxShadow: loginPortal === 'executive' ? '0 4px 12px rgba(139,92,246,0.35)' : 'none'
              }}
            >
              👑 Executive / Staff
            </button>
          </div>

          <form onSubmit={handleLogin} noValidate autoComplete="on">
            {/* Identity Field */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{
                display: 'block', fontSize: '11px', fontWeight: 700,
                color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px'
              }}>
                {loginPortal === 'student' ? 'Registered Email *' : 'Official Username *'}
              </label>
              <input
                type={loginPortal === 'student' ? 'email' : 'text'}
                id="login-identity"
                name="username"
                autoComplete={loginPortal === 'student' ? 'email' : 'username'}
                required
                placeholder={loginPortal === 'student' ? 'e.g. yourname@gmail.com' : 'e.g. president_cssc, faculty_advisor, superadmin'}
                value={identity}
                onChange={(e) => { setIdentity(e.target.value); setError(null); }}
                style={{
                  width: '100%', padding: '13px 16px', boxSizing: 'border-box',
                  background: 'rgba(15,23,42,0.8)', border: '1.5px solid rgba(51,65,85,0.9)',
                  borderRadius: '12px', color: '#fff', fontSize: '14px', fontWeight: 500,
                  outline: 'none', transition: 'border-color 0.2s',
                  '::placeholder': { color: '#475569' }
                }}
                onFocus={e => e.target.style.borderColor = loginPortal === 'student' ? '#6366f1' : '#8b5cf6'}
                onBlur={e => e.target.style.borderColor = 'rgba(51,65,85,0.9)'}
              />
              <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                {loginPortal === 'student'
                  ? 'Students must log in using their verified email address and password.'
                  : 'Presidents, Faculty Advisors, and Super Admins must log in using their assigned username.'}
              </p>
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{
                  fontSize: '11px', fontWeight: 700, color: '#94a3b8',
                  textTransform: 'uppercase', letterSpacing: '0.08em'
                }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={openForgotPassword}
                  style={{
                    fontSize: '12px', color: '#818cf8', fontWeight: 700,
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0
                  }}
                >
                  Forgot Password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="login-password"
                  name="password"
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  style={{
                    width: '100%', padding: '13px 48px 13px 16px', boxSizing: 'border-box',
                    background: 'rgba(15,23,42,0.8)', border: '1.5px solid rgba(51,65,85,0.9)',
                    borderRadius: '12px', color: '#fff', fontSize: '14px', fontWeight: 500,
                    outline: 'none', transition: 'border-color 0.2s'
                  }}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e => e.target.style.borderColor = 'rgba(51,65,85,0.9)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#64748b',
                    display: 'flex', alignItems: 'center', padding: 0
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%', padding: '14px', border: 'none', borderRadius: '13px',
                background: isSubmitting ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
                color: '#fff', fontSize: '14px', fontWeight: 800, cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: isSubmitting ? 'none' : '0 8px 24px rgba(99,102,241,0.35)',
                transition: 'all 0.2s', letterSpacing: '0.01em'
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Campus Hub</span>
                  <LogIn size={17} />
                </>
              )}
            </button>
          </form>

          {/* Footer link */}
          <div style={{ marginTop: '22px', textAlign: 'center', borderTop: '1px solid rgba(51,65,85,0.5)', paddingTop: '18px' }}>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              New university student?{' '}
              <Link to="/register" style={{ color: '#818cf8', fontWeight: 700, textDecoration: 'none' }}>
                Register Student Account
              </Link>
            </p>
          </div>
        </div>

        {/* Security note */}
        <p style={{ textAlign: 'center', fontSize: '11px', color: '#334155', marginTop: '16px' }}>
          🔒 Your connection is encrypted · DSMS Secure Portal
        </p>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      {showForgotPassword && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            background: '#0f172a', border: '1px solid rgba(51,65,85,0.9)',
            borderRadius: '24px', maxWidth: '440px', width: '100%',
            padding: '28px 28px 24px', boxShadow: '0 30px 80px rgba(0,0,0,0.7)',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowForgotPassword(false)}
              style={{
                position: 'absolute', top: '16px', right: '16px',
                background: 'rgba(51,65,85,0.6)', border: 'none', borderRadius: '50%',
                color: '#94a3b8', cursor: 'pointer', padding: '6px',
                display: 'flex', alignItems: 'center'
              }}
            >
              <X size={16} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              <div style={{
                padding: '12px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: '14px', color: '#818cf8'
              }}>
                <KeyRound size={22} />
              </div>
              <div>
                <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 900, margin: '0 0 2px' }}>
                  Password Recovery
                </h3>
                <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>
                  {forgotStep === 1 ? 'Step 1 of 2 — Identify your account' : 'Step 2 of 2 — Set a new password'}
                </p>
              </div>
            </div>

            {/* Step indicator */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
              {[1, 2].map(s => (
                <div key={s} style={{
                  flex: 1, height: '3px', borderRadius: '9999px',
                  background: forgotStep >= s ? '#6366f1' : 'rgba(51,65,85,0.8)',
                  transition: 'background 0.3s'
                }} />
              ))}
            </div>

            {forgotError && (
              <div style={{
                marginBottom: '16px', padding: '12px 14px',
                background: 'rgba(127,29,29,0.5)', border: '1px solid rgba(185,28,28,0.4)',
                borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <ShieldAlert size={15} style={{ color: '#f87171', flexShrink: 0 }} />
                <span style={{ color: '#fca5a5', fontSize: '12px' }}>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div style={{
                marginBottom: '16px', padding: '12px 14px',
                background: 'rgba(6,78,59,0.5)', border: '1px solid rgba(5,150,105,0.4)',
                borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <CheckCircle size={15} style={{ color: '#34d399', flexShrink: 0 }} />
                <span style={{ color: '#a7f3d0', fontSize: '12px' }}>{forgotSuccess}</span>
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleRequestResetOtp}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8',
                    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '7px'
                  }}>
                    University Email or Roll Number
                  </label>
                  <input
                    type="text"
                    required
                    autoComplete="email"
                    placeholder="e.g. student@iub.edu.pk or S23BINCE1M04014"
                    value={forgotIdentity}
                    onChange={(e) => setForgotIdentity(e.target.value)}
                    style={{
                      width: '100%', padding: '12px 14px', boxSizing: 'border-box',
                      background: 'rgba(15,23,42,0.9)', border: '1.5px solid rgba(51,65,85,0.9)',
                      borderRadius: '11px', color: '#fff', fontSize: '13px', outline: 'none'
                    }}
                  />
                  <p style={{ fontSize: '11px', color: '#475569', marginTop: '6px', lineHeight: 1.5 }}>
                    A secure reset token will be sent from{' '}
                    <span style={{ color: '#818cf8', fontFamily: 'monospace' }}>cssc.dice@gmail.com</span>
                    {' '}to your registered email address.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setShowForgotPassword(false)}
                    style={{
                      padding: '10px 18px', background: 'rgba(51,65,85,0.7)', border: '1px solid rgba(51,65,85,0.9)',
                      borderRadius: '10px', color: '#94a3b8', fontSize: '12px', fontWeight: 700, cursor: 'pointer'
                    }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={forgotLoading || !forgotIdentity.trim()}
                    style={{
                      padding: '10px 20px',
                      background: forgotLoading ? 'rgba(99,102,241,0.4)' : '#6366f1',
                      border: 'none', borderRadius: '10px', color: '#fff',
                      fontSize: '12px', fontWeight: 700, cursor: forgotLoading ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: '6px'
                    }}>
                    {forgotLoading ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Sending...</> : 'Send Reset Instructions'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordSubmit}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{
                    display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8',
                    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '7px'
                  }}>
                    Reset Token (from email)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Paste the token from your email"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    style={{
                      width: '100%', padding: '12px 14px', boxSizing: 'border-box',
                      background: 'rgba(15,23,42,0.9)', border: '1.5px solid rgba(51,65,85,0.9)',
                      borderRadius: '11px', color: '#fff', fontSize: '13px', outline: 'none',
                      fontFamily: 'monospace', textAlign: 'center', letterSpacing: '4px', fontWeight: 700
                    }}
                  />
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{
                    display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8',
                    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '7px'
                  }}>
                    New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showForgotPwd ? 'text' : 'password'}
                      required
                      placeholder="Min 8 characters"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      style={{
                        width: '100%', padding: '12px 42px 12px 14px', boxSizing: 'border-box',
                        background: 'rgba(15,23,42,0.9)', border: '1.5px solid rgba(51,65,85,0.9)',
                        borderRadius: '11px', color: '#fff', fontSize: '13px', outline: 'none'
                      }}
                    />
                    <button type="button" onClick={() => setShowForgotPwd(!showForgotPwd)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                      {showForgotPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div style={{ marginBottom: '18px' }}>
                  <label style={{
                    display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8',
                    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '7px'
                  }}>
                    Confirm New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showForgotConfirmPwd ? 'text' : 'password'}
                      required
                      placeholder="Re-enter new password"
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      style={{
                        width: '100%', padding: '12px 42px 12px 14px', boxSizing: 'border-box',
                        background: 'rgba(15,23,42,0.9)',
                        border: `1.5px solid ${forgotConfirmPassword && forgotNewPassword !== forgotConfirmPassword ? 'rgba(185,28,28,0.7)' : 'rgba(51,65,85,0.9)'}`,
                        borderRadius: '11px', color: '#fff', fontSize: '13px', outline: 'none'
                      }}
                    />
                    <button type="button" onClick={() => setShowForgotConfirmPwd(!showForgotConfirmPwd)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                      {showForgotConfirmPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {forgotConfirmPassword && forgotNewPassword !== forgotConfirmPassword && (
                    <p style={{ fontSize: '11px', color: '#f87171', marginTop: '4px' }}>Passwords do not match</p>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <button type="button" onClick={() => setForgotStep(1)}
                    style={{ fontSize: '12px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                    ← Back
                  </button>
                  <button type="submit" disabled={forgotLoading || !forgotOtp.trim() || !forgotNewPassword.trim()}
                    style={{
                      padding: '10px 20px',
                      background: forgotLoading ? 'rgba(5,150,105,0.4)' : 'linear-gradient(135deg, #059669, #0d9488)',
                      border: 'none', borderRadius: '10px', color: '#fff',
                      fontSize: '12px', fontWeight: 700, cursor: forgotLoading ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: '6px'
                    }}>
                    {forgotLoading ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : 'Save Password & Sign In'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #475569; }
        input:focus { border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
      `}</style>
    </div>
  );
};

export default Login;
