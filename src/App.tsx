import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import LandlordView from './components/LandlordView';
import TenantView from './components/TenantView';
import VendorView from './components/VendorView';

const App: React.FC = () => {
  const { state, setRole, backendStatus } = useApp();
  const [isMobile, setIsMobile] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [guideTab, setGuideTab] = useState<'overview' | 'script' | 'checklist'>('overview');

  // Interactive checklist states stored locally
  const [checks, setChecks] = useState({
    syndicate: false,
    apply: false,
    screen: false,
    esign: false,
    tax: false,
  });

  const toggleCheck = (key: keyof typeof checks) => {
    setChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="app-container" style={{ position: 'relative', overflowX: 'hidden' }}>
      {/* Top Header / Role Switcher */}
      <header style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-glass)',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '40px', height: '40px',
            background: 'linear-gradient(135deg, var(--accent-violet), var(--accent-emerald))',
            borderRadius: 'var(--radius-sm)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 'bold', fontSize: '1.2rem', color: 'white',
            boxShadow: '0 0 15px var(--accent-violet-glow)'
          }}>
            LR
          </div>
          <h1 style={{ fontSize: '1.5rem', margin: 0, background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            LuminaRental
          </h1>
          <span style={{
            background: backendStatus === 'connected' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.1)',
            color: backendStatus === 'connected' ? '#10b981' : '#94a3b8',
            border: `1px solid ${backendStatus === 'connected' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(148, 163, 184, 0.2)'}`,
            padding: '3px 8px',
            borderRadius: '12px',
            fontSize: '0.7rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            boxShadow: backendStatus === 'connected' ? '0 0 10px rgba(16, 185, 129, 0.2)' : 'none'
          }}>
            {backendStatus === 'connected' ? '⚡ Live Backend' : '💾 Offline Mode'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {/* Glowing Tutorial Hub Button */}
          <button
            onClick={() => setShowGuide(true)}
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(16, 185, 129, 0.2))',
              color: '#ffffff',
              border: '1px solid var(--accent-violet)',
              padding: '0.4rem 1rem',
              borderRadius: '4px',
              fontSize: '0.85rem',
              cursor: 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 0 10px rgba(139, 92, 246, 0.3)'
            }}
          >
            📖 Tutorial Video & Guide
          </button>

          <button
            onClick={() => setIsMobile(!isMobile)}
            style={{
              background: isMobile ? 'var(--accent-emerald)' : 'rgba(255, 255, 255, 0.05)',
              color: 'white',
              border: '1px solid var(--border-glass)',
              padding: '0.4rem 1rem',
              borderRadius: '4px',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            {isMobile ? '🖥️ Desktop View' : '📱 Mobile App View'}
          </button>

          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-dark)', padding: '4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
            {(['landlord', 'tenant', 'vendor'] as const).map(r => (
              <button
                key={r}
                onClick={() => setRole(r)}
                style={{
                  background: state.currentRole === r ? 'var(--accent-violet)' : 'transparent',
                  color: state.currentRole === r ? 'white' : 'var(--text-secondary)',
                  border: 'none',
                  padding: '0.4rem 1rem',
                  borderRadius: '4px',
                  textTransform: 'capitalize',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                {r}
              </button>
            ))}
          </div>
          <div style={{ 
            width: '36px', height: '36px', borderRadius: '50%', 
            background: 'var(--border-glass)', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer' 
          }}>
            👤
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      {isMobile ? (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#070a13', minHeight: 'calc(100vh - 73px)' }}>
          <div className="mobile-device-wrapper">
            <div className="mobile-notch" />
            <div className="mobile-status-bar">
              <span style={{ color: 'white', fontSize: '0.8rem' }}>9:41</span>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.8rem' }}>
                <span>📶</span>
                <span>🛜</span>
                <span>🔋</span>
              </div>
            </div>
            <div className="mobile-scroll-container">
              <main className="main-content">
                {state.currentRole === 'landlord' && <LandlordView />}
                {state.currentRole === 'tenant' && <TenantView />}
                {state.currentRole === 'vendor' && <VendorView />}
              </main>
            </div>
            <div className="mobile-home-indicator" />
          </div>
        </div>
      ) : (
        <main className="main-content">
          {state.currentRole === 'landlord' && <LandlordView />}
          {state.currentRole === 'tenant' && <TenantView />}
          {state.currentRole === 'vendor' && <VendorView />}
        </main>
      )}

      {/* Slide-out Interactive Guide Drawer */}
      {showGuide && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '450px',
          background: 'rgba(11, 15, 26, 0.96)',
          backdropFilter: 'blur(20px)',
          borderLeft: '1px solid var(--border-glass-strong)',
          zIndex: 1000,
          boxShadow: '-10px 0 30px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          padding: '2rem',
          gap: '1.5rem',
          boxSizing: 'border-box'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff' }}>
              📖 Lumina Guide & Script Hub
            </h2>
            <button 
              onClick={() => setShowGuide(false)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.4rem', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>

          {/* Nav Tabs */}
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '4px' }}>
            <button 
              onClick={() => setGuideTab('overview')} 
              style={{ flex: 1, padding: '6px', border: 'none', background: guideTab === 'overview' ? 'var(--accent-violet)' : 'transparent', color: 'white', fontSize: '0.75rem', cursor: 'pointer', borderRadius: '2px' }}
            >
              🏢 Purpose
            </button>
            <button 
              onClick={() => setGuideTab('script')} 
              style={{ flex: 1, padding: '6px', border: 'none', background: guideTab === 'script' ? 'var(--accent-violet)' : 'transparent', color: 'white', fontSize: '0.75rem', cursor: 'pointer', borderRadius: '2px' }}
            >
              🎙️ Video Script
            </button>
            <button 
              onClick={() => setGuideTab('checklist')} 
              style={{ flex: 1, padding: '6px', border: 'none', background: guideTab === 'checklist' ? 'var(--accent-violet)' : 'transparent', color: 'white', fontSize: '0.75rem', cursor: 'pointer', borderRadius: '2px' }}
            >
              🛠️ Interactive Demo
            </button>
          </div>

          {/* Drawer Content */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '4px' }}>
            
            {guideTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <p>
                  <strong>LuminaRental</strong> is an All-in-One Property OS designed in clean, simple English. It connects Landlords, Tenants, and Vendors in one workspace.
                </p>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '4px', border: '1px solid var(--border-glass)' }}>
                  <h4 style={{ color: 'white', marginBottom: '8px' }}>🌾 Landlord Dashboard Tools</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem' }}>Tracks property values, yearly tax bills, and tax savings account reserves using simple, easy county tax formulas.</p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '4px', border: '1px solid var(--border-glass)' }}>
                  <h4 style={{ color: 'white', marginBottom: '8px' }}>✍️ Digital Applicant Funnel</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem' }}>Allows online applicants to submit forms, upload verification paystubs, execute automated credit checks, and cursive-sign digital leases.</p>
                </div>
              </div>
            )}

            {guideTab === 'script' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>🎤 Use this script to record a professional walkthrough video:</span>
                
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '4px', borderLeft: '3px solid var(--accent-violet)' }}>
                  <strong style={{ color: 'white', display: 'block', marginBottom: '4px' }}>1. Intro & Dashboard</strong>
                  <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                    "Hi! Welcome to LuminaRental. We start on the landlord Mission Control dashboard seeing active cash flows, portfolio health stats, and simple property tax reserve accounts at the bottom."
                  </p>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '4px', borderLeft: '3px solid var(--accent-violet)' }}>
                  <strong style={{ color: 'white', display: 'block', marginBottom: '4px' }}>2. Property Tax & Growth Slider</strong>
                  <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                    "Under Accounting ➔ Property Tax & Savings, we can use the appreciation slider to project future bills, and clear taxes directly from reserves with one click."
                  </p>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '4px', borderLeft: '3px solid var(--accent-violet)' }}>
                  <strong style={{ color: 'white', display: 'block', marginBottom: '4px' }}>3. Digital e-Sign leasing</strong>
                  <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                    "In the Tenant view's leasing hub, applicants apply, securely attach W-2s, watch automated Equifax credit sweeps decide approvals, andcursive e-sign their lease instantly!"
                  </p>
                </div>
              </div>
            )}

            {guideTab === 'checklist' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Check off steps as you execute the live app simulation:</span>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer', background: checks.syndicate ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-glass)' }}>
                    <input type="checkbox" checked={checks.syndicate} onChange={() => toggleCheck('syndicate')} />
                    <div>
                      <strong style={{ color: 'white', fontSize: '0.8rem' }}>1. Syndicate Vacancy (Landlord)</strong>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Click 'Syndicate Vacancy' under properties</p>
                    </div>
                  </label>

                  <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer', background: checks.apply ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-glass)' }}>
                    <input type="checkbox" checked={checks.apply} onChange={() => toggleCheck('apply')} />
                    <div>
                      <strong style={{ color: 'white', fontSize: '0.8rem' }}>2. Submit Online Application (Tenant)</strong>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Go to Tenant ➔ attach paystub ➔ Submit</p>
                    </div>
                  </label>

                  <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer', background: checks.screen ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-glass)' }}>
                    <input type="checkbox" checked={checks.screen} onChange={() => toggleCheck('screen')} />
                    <div>
                      <strong style={{ color: 'white', fontSize: '0.8rem' }}>3. Equifax Credit Scan (Tenant)</strong>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Wait 4s for automated approval sweep</p>
                    </div>
                  </label>

                  <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer', background: checks.esign ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-glass)' }}>
                    <input type="checkbox" checked={checks.esign} onChange={() => toggleCheck('esign')} />
                    <div>
                      <strong style={{ color: 'white', fontSize: '0.8rem' }}>4. Cursive handwritten e-Sign (Tenant)</strong>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Type name ➔ see cursive seal ➔ lock lease</p>
                    </div>
                  </label>

                  <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer', background: checks.tax ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-glass)' }}>
                    <input type="checkbox" checked={checks.tax} onChange={() => toggleCheck('tax')} />
                    <div>
                      <strong style={{ color: 'white', fontSize: '0.8rem' }}>5. county Taxes & Savings (Landlord)</strong>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Check growth slider & disburse bills from reserve</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

          </div>

          {/* Footer */}
          <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>LuminaRental v1.1 • Premium Replica</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
