import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

type Step = 'details' | 'otp';
type Role = 'landlord' | 'tenant' | 'vendor';

const roleInfo: Record<Role, { icon: string; label: string; desc: string }> = {
  landlord: { icon: '🏢', label: 'Landlord', desc: 'Manage properties & residents' },
  tenant:   { icon: '🏠', label: 'Tenant',   desc: 'Pay rent & submit requests' },
  vendor:   { icon: '🔧', label: 'Vendor',   desc: 'View work orders & invoices' },
};

const LoginPage: React.FC = () => {
  const { login } = useAuth();

  const [step, setStep] = useState<Step>('details');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Role>('landlord');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0,3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || phone.replace(/\D/g, '').length < 10) return;
    setSending(true);
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    setTimeout(() => {
      setGeneratedOtp(otp);
      setSending(false);
      setStep('otp');
    }, 1500);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setTimeout(() => {
      if (enteredOtp === generatedOtp) {
        login({
          id: `user_${Date.now()}`,
          name: name.trim(),
          phone: phone,
          role,
        });
      } else {
        setOtpError(true);
        setVerifying(false);
      }
    }, 1000);
  };

  const handleResend = () => {
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(otp);
    setEnteredOtp('');
    setOtpError(false);
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

          {step === 'details' && (
            <>
              <div>
                <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Sign In / Register</h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Enter your details and we'll send a one-time passcode to your mobile number.
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
                        background: role === r ? 'rgba(124, 58, 237, 0.15)' : 'rgba(255,255,255,0.02)',
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
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John Smith"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Mobile Number
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                      color: 'var(--text-secondary)', fontSize: '0.9rem', zIndex: 1
                    }}>+1</span>
                    <input
                      type="tel"
                      placeholder="(555) 000-0000"
                      value={phone}
                      onChange={e => setPhone(formatPhone(e.target.value))}
                      style={{ paddingLeft: '36px' }}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={sending || !name.trim() || phone.replace(/\D/g, '').length < 10}
                  style={{ padding: '0.85rem', fontSize: '1rem', marginTop: '4px' }}
                >
                  {sending ? 'Sending OTP...' : '📱 Send OTP to Mobile'}
                </button>
              </form>
            </>
          )}

          {step === 'otp' && (
            <>
              <div>
                <button
                  type="button"
                  onClick={() => { setStep('details'); setEnteredOtp(''); setOtpError(false); }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem', padding: 0, marginBottom: '0.75rem' }}
                >
                  ← Back
                </button>
                <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Enter OTP</h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  A 6-digit code was sent to <strong style={{ color: 'white' }}>{phone}</strong>
                </p>
              </div>

              {/* Simulated SMS Box */}
              <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 'var(--radius-sm)',
                padding: '1rem',
                display: 'flex', flexDirection: 'column', gap: '4px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--accent-emerald)' }}>
                  <span>📱</span>
                  <strong>Simulated SMS — LuminaRental</strong>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Your LuminaRental verification code is:
                </p>
                <p style={{ fontSize: '2rem', fontWeight: '800', letterSpacing: '0.3em', color: 'white', margin: '4px 0 0 0', fontFamily: 'monospace' }}>
                  {generatedOtp}
                </p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', margin: 0 }}>Valid for 10 minutes. Do not share.</p>
              </div>

              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Enter 6-digit OTP
                  </label>
                  <input
                    type="text"
                    placeholder="000000"
                    value={enteredOtp}
                    maxLength={6}
                    onChange={e => { setEnteredOtp(e.target.value.replace(/\D/g, '')); setOtpError(false); }}
                    style={{
                      textAlign: 'center',
                      fontSize: '1.8rem',
                      letterSpacing: '0.4em',
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      border: otpError ? '1px solid var(--accent-rose)' : '1px solid var(--border-glass-strong)',
                      color: otpError ? 'var(--accent-rose)' : 'white'
                    }}
                    required
                    autoFocus
                  />
                  {otpError && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--accent-rose)', marginTop: '4px' }}>
                      Incorrect OTP. Please try again.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={verifying || enteredOtp.length < 6}
                  style={{ padding: '0.85rem', fontSize: '1rem' }}
                >
                  {verifying ? 'Verifying...' : '✓ Verify & Sign In'}
                </button>

                <button
                  type="button"
                  onClick={handleResend}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.82rem', textDecoration: 'underline' }}
                >
                  Resend OTP
                </button>
              </form>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
          LuminaRental v1.1 · Secure Login · ESIGN Compliant
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
