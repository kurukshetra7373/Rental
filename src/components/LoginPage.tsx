import React, { useState, useRef, useEffect } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import type { ConfirmationResult } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

type Step = 'details' | 'otp';
type Role = 'landlord' | 'tenant' | 'vendor';

const roleInfo: Record<Role, { icon: string; label: string; desc: string }> = {
  landlord: { icon: '🏢', label: 'Landlord',  desc: 'Manage properties & residents' },
  tenant:   { icon: '🏠', label: 'Tenant',    desc: 'Pay rent & submit requests' },
  vendor:   { icon: '🔧', label: 'Vendor',    desc: 'View work orders & invoices' },
};

const formatPhone = (val: string) => {
  const digits = val.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0,3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
};

const LoginPage: React.FC = () => {
  const { login } = useAuth();

  const [step, setStep]           = useState<Step>('details');
  const [name, setName]           = useState('');
  const [phone, setPhone]         = useState('');
  const [role, setRole]           = useState<Role>('landlord');
  const [otp, setOtp]             = useState('');
  const [error, setError]         = useState('');
  const [sending, setSending]     = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef    = useRef<RecaptchaVerifier | null>(null);
  const timerRef        = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setInterval(() => setCountdown(c => c - 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [countdown]);

  const setupRecaptcha = () => {
    if (!recaptchaRef.current) {
      recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {},
      });
    }
  };

  const handleSendOtp = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!name.trim() || phone.replace(/\D/g, '').length < 10) return;
    setError('');
    setSending(true);

    try {
      setupRecaptcha();
      const e164 = '+1' + phone.replace(/\D/g, '');
      const result = await signInWithPhoneNumber(auth, e164, recaptchaRef.current!);
      confirmationRef.current = result;
      setStep('otp');
      setCountdown(30);
    } catch (err: any) {
      setError(getFriendlyError(err.code));
      recaptchaRef.current = null; // reset so it can be recreated
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOtp = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!confirmationRef.current || otp.length < 6) return;
    setError('');
    setVerifying(true);

    try {
      await confirmationRef.current.confirm(otp);
      login({
        id:    `user_${Date.now()}`,
        name:  name.trim(),
        phone: phone,
        role,
      });
    } catch (err: any) {
      setError(getFriendlyError(err.code));
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setError('');
    setSending(true);
    try {
      recaptchaRef.current = null;
      setupRecaptcha();
      const e164 = '+1' + phone.replace(/\D/g, '');
      const result = await signInWithPhoneNumber(auth, e164, recaptchaRef.current!);
      confirmationRef.current = result;
      setCountdown(30);
      setOtp('');
    } catch (err: any) {
      setError(getFriendlyError(err.code));
    } finally {
      setSending(false);
    }
  };

  const getFriendlyError = (code: string) => {
    switch (code) {
      case 'auth/invalid-phone-number':   return 'Invalid phone number. Please check and try again.';
      case 'auth/too-many-requests':      return 'Too many attempts. Please wait a few minutes and try again.';
      case 'auth/invalid-verification-code': return 'Incorrect OTP code. Please try again.';
      case 'auth/code-expired':           return 'OTP expired. Please request a new one.';
      case 'auth/quota-exceeded':         return 'SMS quota exceeded. Please try again later.';
      default:                            return 'Something went wrong. Please try again.';
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-dark)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      {/* invisible reCAPTCHA anchor */}
      <div id="recaptcha-container" />

      <div style={{ width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '56px', height: '56px',
            background: 'linear-gradient(135deg, var(--accent-violet), var(--accent-emerald))',
            borderRadius: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 'bold', fontSize: '1.5rem', color: 'white',
            boxShadow: '0 0 24px var(--accent-violet-glow)'
          }}>LR</div>
          <div>
            <h1 style={{ fontSize: '1.6rem', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
              LuminaRental
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
              Property Management Platform
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* STEP 1 — Details */}
          {step === 'details' && (
            <>
              <div>
                <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Sign In / Register</h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  We'll send a one-time passcode to your mobile number to verify your identity.
                </p>
              </div>

              {/* Role Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>I am a</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {(Object.keys(roleInfo) as Role[]).map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      style={{
                        padding: '0.75rem 0.5rem',
                        border: role === r ? '1px solid var(--accent-violet)' : '1px solid var(--border-glass)',
                        background: role === r ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.02)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                        boxShadow: role === r ? '0 0 10px var(--accent-violet-glow)' : 'none',
                        transition: 'all 0.2s'
                      }}
                    >
                      <span style={{ fontSize: '1.4rem' }}>{roleInfo[r].icon}</span>
                      <span style={{ fontSize: '0.78rem', fontWeight: '600', color: role === r ? 'var(--accent-violet)' : 'var(--text-secondary)' }}>
                        {roleInfo[r].label}
                      </span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textAlign: 'center', lineHeight: 1.3 }}>
                        {roleInfo[r].desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. John Smith"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Mobile Number</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>+1</span>
                    <input
                      type="tel"
                      placeholder="(555) 000-0000"
                      value={phone}
                      onChange={e => setPhone(formatPhone(e.target.value))}
                      style={{ paddingLeft: '36px' }}
                      required
                    />
                  </div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                    US numbers only (+1). A real SMS will be sent to this number.
                  </p>
                </div>

                {error && (
                  <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', fontSize: '0.82rem', color: '#f87171' }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={sending || !name.trim() || phone.replace(/\D/g, '').length < 10}
                  style={{ padding: '0.85rem', fontSize: '1rem', marginTop: '4px' }}
                >
                  {sending ? 'Sending OTP...' : '📱 Send OTP via SMS'}
                </button>
              </form>
            </>
          )}

          {/* STEP 2 — OTP */}
          {step === 'otp' && (
            <>
              <div>
                <button
                  type="button"
                  onClick={() => { setStep('details'); setOtp(''); setError(''); }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem', padding: 0, marginBottom: '0.75rem' }}
                >
                  ← Back
                </button>
                <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Verify Your Number</h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  A 6-digit OTP was sent via SMS to <strong style={{ color: 'white' }}>+1 {phone}</strong>
                </p>
              </div>

              {/* SMS sent confirmation */}
              <div style={{
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.85rem 1rem',
                display: 'flex', alignItems: 'center', gap: '10px'
              }}>
                <span style={{ fontSize: '1.4rem' }}>📨</span>
                <div>
                  <p style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--accent-emerald)', margin: 0 }}>SMS Sent Successfully</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, marginTop: '2px' }}>
                    Check your messages. OTP expires in 10 minutes.
                  </p>
                </div>
              </div>

              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Enter 6-digit OTP
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    value={otp}
                    maxLength={6}
                    onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setError(''); }}
                    style={{
                      textAlign: 'center',
                      fontSize: '2rem',
                      letterSpacing: '0.4em',
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      border: error ? '1px solid var(--accent-rose)' : '1px solid var(--border-glass-strong)',
                      color: error ? 'var(--accent-rose)' : 'white'
                    }}
                    required
                    autoFocus
                  />
                </div>

                {error && (
                  <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', fontSize: '0.82rem', color: '#f87171' }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={verifying || otp.length < 6}
                  style={{ padding: '0.85rem', fontSize: '1rem' }}
                >
                  {verifying ? 'Verifying...' : '✓ Verify & Sign In'}
                </button>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={countdown > 0 || sending}
                  style={{
                    background: 'transparent', border: 'none',
                    color: countdown > 0 ? 'var(--text-tertiary)' : 'var(--accent-violet)',
                    cursor: countdown > 0 ? 'default' : 'pointer',
                    fontSize: '0.82rem', textDecoration: countdown > 0 ? 'none' : 'underline'
                  }}
                >
                  {countdown > 0 ? `Resend OTP in ${countdown}s` : sending ? 'Sending...' : 'Resend OTP'}
                </button>
              </form>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
          Protected by Firebase & Google reCAPTCHA · LuminaRental v1.1
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
