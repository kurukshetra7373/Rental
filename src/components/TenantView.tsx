import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const TenantView: React.FC = () => {
  const { state, payRent, toggleAutopay, addTicket } = useApp();
  
  // Simulate logging in as the first delinquent tenant, or the first active tenant
  const tenant = state.tenants.find(t => t.id === 't2') || state.tenants[0] || null;

  // Modals / Overlays
  const [showPayModal, setShowPayModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showLeaseModal, setShowLeaseModal] = useState(false);

  // Pay Form States
  const [payAmount, setPayAmount] = useState(tenant ? tenant.balance : 0);
  const [paymentMethod, setPaymentMethod] = useState<'ach' | 'card'>('ach');
  const [bankRouting, setBankRouting] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [isProcessingPay, setIsProcessingPay] = useState(false);

  // Ticket Form States
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [ticketPriority, setTicketPriority] = useState<'low' | 'medium' | 'high' | 'emergency'>('medium');
  const [mockPhotoName, setMockPhotoName] = useState('');

  // Online Application & Leasing States
  const [activeTab, setActiveTab] = useState<'resident' | 'leasing'>('resident');
  const [appName, setAppName] = useState('');
  const [appEmail, setAppEmail] = useState('');
  const [appPropId, setAppPropId] = useState(state.properties[0]?.id || 'p1');
  const [appIncome, setAppIncome] = useState(5500);
  const [appFiles, setAppFiles] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [appStatus, setAppStatus] = useState<'idle' | 'submitted' | 'processing' | 'approved' | 'signed'>('idle');
  const [signatureText, setSignatureText] = useState('');
  const [creditCheckedScore, setCreditCheckedScore] = useState(740);

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant || payAmount <= 0) return;
    setIsProcessingPay(true);

    setTimeout(() => {
      payRent(tenant.id, payAmount);
      setIsProcessingPay(false);
      setShowPayModal(false);
      alert('✓ Rent payment successfully cleared via Electronic Funds Transfer!');
    }, 2000);
  };

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant || !ticketTitle || !ticketDesc) return;

    addTicket({
      title: ticketTitle,
      description: ticketDesc,
      propertyId: tenant.propertyId,
      tenantId: tenant.id,
      priority: ticketPriority,
      status: 'open'
    });

    setTicketTitle('');
    setTicketDesc('');
    setMockPhotoName('');
    setShowTicketModal(false);
    alert('✓ Maintenance repair ticket dispatched to property managers!');
  };

  const handleDocUpload = (fileName: string) => {
    setIsUploading(true);
    setTimeout(() => {
      setAppFiles(prev => [...prev, fileName]);
      setIsUploading(false);
    }, 1200);
  };

  const handleApplicationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName || !appEmail || appFiles.length === 0) {
      alert('⚠️ Please complete all fields and upload at least one verification document (W-2 or ID).');
      return;
    }
    setAppStatus('submitted');
    
    // Simulate background underwriting scan
    setTimeout(() => {
      setAppStatus('processing');
    }, 1500);

    setTimeout(() => {
      // Generate a credit score between 680 and 790
      const score = Math.floor(Math.random() * 110) + 680;
      setCreditCheckedScore(score);
      setAppStatus('approved');
    }, 4000);
  };

  const handleESignLease = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signatureText) return;
    setAppStatus('signed');
    alert(`🔒 LEASE SUCCESSFULY BINDED & E-SIGNED!\n\nWelcome to your new home! Your signed agreement has been locked and archived under digital ESIGN standards.`);
  };

  // Get active tickets filed by this resident
  const residentTickets = tenant ? state.tickets.filter(t => t.tenantId === tenant.id) : [];
  const currentPropName = tenant ? (state.properties.find(p => p.id === tenant.propertyId)?.name || '') : '';

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Subtab Navigation Bar */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
        <button
          onClick={() => setActiveTab('resident')}
          style={{
            background: activeTab === 'resident' ? 'var(--accent-violet)' : 'transparent',
            color: activeTab === 'resident' ? 'white' : 'var(--text-secondary)',
            border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', fontSize: '0.9rem', cursor: 'pointer'
          }}
        >
          🏠 Resident Hub
        </button>
        <button
          onClick={() => setActiveTab('leasing')}
          style={{
            background: activeTab === 'leasing' ? 'var(--accent-violet)' : 'transparent',
            color: activeTab === 'leasing' ? 'white' : 'var(--text-secondary)',
            border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', fontSize: '0.9rem', cursor: 'pointer'
          }}
        >
          ✍️ Online Application & Leasing Hub
        </button>
      </div>

      {activeTab === 'resident' && (
        <>
          {!tenant ? (
            <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
              <h3 style={{ marginBottom: '10px' }}>No Resident Profile Loaded</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                You currently do not have a signed lease. Go to the **Online Application & Leasing Hub** tab to apply and sign a digital lease in seconds!
              </p>
              <button className="btn-primary" onClick={() => setActiveTab('leasing')}>✍️ Open Leasing Hub</button>
            </div>
          ) : (
            <>
              {/* Welcome Banner */}
              <header className="glass-card" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.8rem', background: 'linear-gradient(to right, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Welcome home, {tenant.name}
                  </h2>
                  <p style={{ color: 'var(--text-secondary)' }}>{currentPropName} | Unit {tenant.unitNo}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${tenant.balance > 0 ? 'badge-danger' : 'badge-success'}`}>
                    {tenant.balance > 0 ? 'Delinquent Balance' : 'Current Account'}
                  </span>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Lease expires: {tenant.leaseEnd}</p>
                </div>
              </header>

      {/* Account balance & Autopay */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
        
        {/* Ledger & Balance Widget */}
        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Outstanding Rent Balance</h3>
          <h1 style={{ 
            fontSize: '4.5rem', 
            fontWeight: 700, 
            margin: '1rem 0', 
            color: tenant.balance > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)',
            letterSpacing: '-0.02em'
          }}>
            ${tenant.balance.toLocaleString()}
          </h1>
          {tenant.balance > 0 ? (
            <button className="btn-primary" onClick={() => setShowPayModal(true)} style={{ padding: '0.9rem 2.5rem', fontSize: '1.1rem', alignSelf: 'center' }}>
              💳 Pay Online Now
            </button>
          ) : (
            <span style={{ color: 'var(--accent-emerald)', fontWeight: '600', fontSize: '1.1rem' }}>✓ Thank you, account settled.</span>
          )}
        </div>

        {/* Autopay settings */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem' }}>📅 Autopay Scheduler</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Configure automated recurring monthly debit clearances on the 1st of each calendar month.</p>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
            <div>
              <strong>Autopay Status</strong>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{tenant.autopayStatus ? 'Active: ACH Clearing on 1st' : 'Inactive'}</p>
            </div>
            
            <button 
              className={tenant.autopayStatus ? 'btn-success' : 'btn-secondary'}
              onClick={() => toggleAutopay(tenant.id)}
              style={{ fontSize: '0.85rem' }}
            >
              {tenant.autopayStatus ? '● Scheduled' : '○ Schedule Autopay'}
            </button>
          </div>
        </div>

      </div>

      {/* Maintenance Request Panel */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3>🔧 Maintenance Request Dispatch</h3>
          <button className="btn-primary" onClick={() => setShowTicketModal(true)}>➕ Submit New Request</button>
        </div>

        <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>My Maintenance History</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {residentTickets.map(t => (
            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.15)' }}>
              <div>
                <strong style={{ fontSize: '0.9rem' }}>{t.title}</strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{t.description}</p>
                <span className={`badge ${t.priority === 'emergency' ? 'badge-danger' : 'badge-neutral'}`} style={{ fontSize: '0.6rem', marginTop: '6px', display: 'inline-block' }}>
                  {t.priority}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>{t.status}</span>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>Filed: {new Date(t.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
          {residentTickets.length === 0 && (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem 0' }}>No active repairs or tickets filed.</p>
          )}
        </div>
      </div>

      {/* Lease Viewer shortcuts */}
      {tenant && (
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3>📄 Lease Documentation</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Preview active covenants, security deposits holding logs, and pet clauses.</p>
          </div>
          <button className="btn-secondary" onClick={() => setShowLeaseModal(true)}>Open Lease Viewer</button>
        </div>
      )}
            </>
          )}
        </>
      )}

      {/* Online Leasing Tab */}
      {activeTab === 'leasing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="glass-card" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', background: 'linear-gradient(to right, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              ✍️ Digital Application & e-Sign Portal
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Apply for vacancies, instantly upload income/ID documentation, run automated credit underwriting, and securely e-sign your lease contract.
            </p>
          </div>

          {appStatus === 'idle' && (
            <form onSubmit={handleApplicationSubmit} className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'white', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
                Step 1: Submit Online Tenancy Application
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="grid-split">
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Full Legal Name</label>
                  <input type="text" value={appName} onChange={(e) => setAppName(e.target.value)} placeholder="e.g. Alice Williams" required />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Email Address</label>
                  <input type="email" value={appEmail} onChange={(e) => setAppEmail(e.target.value)} placeholder="alice@example.com" required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }} className="grid-split">
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Select Building Vacancy</label>
                  <select value={appPropId} onChange={(e) => setAppPropId(e.target.value)}>
                    {state.properties.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.address})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Monthly Verifiable Income ($)</label>
                  <input type="number" min={1} value={appIncome} onChange={(e) => setAppIncome(Number(e.target.value))} required />
                </div>
              </div>

              {/* Upload Documents Zone */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Step 2: Upload Documents (Paystubs, W-2s, or Government ID)
                </label>
                
                <div style={{ 
                  border: '2px dashed var(--border-glass)', 
                  borderRadius: 'var(--radius-md)', 
                  padding: '2rem', 
                  textAlign: 'center', 
                  background: 'rgba(0,0,0,0.15)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  <span style={{ fontSize: '2.5rem' }}>📂</span>
                  <div>
                    <strong style={{ fontSize: '0.9rem' }}>Secure Document Portal</strong>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>PDF, PNG, and JPG files are encrypted and processed securely</p>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button 
                      type="button" 
                      onClick={() => handleDocUpload('W2_Paystub_2026.pdf')} 
                      className="btn-secondary" 
                      style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                      disabled={isUploading}
                    >
                      📎 Attach Paystub / W-2
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleDocUpload('Drivers_License_ID.png')} 
                      className="btn-secondary" 
                      style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                      disabled={isUploading}
                    >
                      📎 Attach Drivers ID
                    </button>
                  </div>

                  {isUploading && (
                    <div style={{ width: '150px', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                      <div style={{ height: '4px', background: 'var(--border-glass)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: 'var(--accent-violet)', animation: 'progressSim 1.2s infinite ease-in-out' }} />
                      </div>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>Encrypting file...</span>
                    </div>
                  )}

                  {appFiles.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                      {appFiles.map(file => (
                        <span key={file} className="badge badge-success" style={{ fontSize: '0.7rem', padding: '4px 8px' }}>
                          ✓ {file}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ padding: '0.85rem', fontSize: '1rem', marginTop: '10px' }}>
                🚀 Submit Online Application & Authorize Screenings
              </button>
            </form>
          )}

          {(appStatus === 'submitted' || appStatus === 'processing') && (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
              <div className="spinner-loader" style={{ 
                width: '50px', height: '50px', 
                border: '4px solid var(--border-glass)', 
                borderTopColor: 'var(--accent-violet)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <div>
                <h3 style={{ fontSize: '1.25rem', color: 'white' }}>
                  {appStatus === 'submitted' ? 'Transmitting Digital Paystub Assets...' : 'Lumina Underwriting Engine Active'}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '450px', margin: '8px auto 0 auto' }}>
                  {appStatus === 'submitted' 
                    ? 'Creating secure SSL tunnels to verify paystub files and identity documents.' 
                    : 'Running real-time Equifax Credit queries, national eviction database sweeps, and income verification ratios.'
                  }
                </p>
              </div>
              <div style={{ width: '300px', height: '6px', background: 'var(--border-glass)', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ 
                  height: '100%', 
                  width: appStatus === 'submitted' ? '30%' : '75%', 
                  background: 'var(--accent-violet)',
                  transition: 'width 1.5s ease-in-out' 
                }} />
              </div>
            </div>
          )}

          {appStatus === 'approved' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.5rem' }} className="grid-split">
              
              {/* Lease Document View */}
              <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'white', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
                  📄 Your Digital Lease Agreement
                </h3>
                <div style={{ 
                  fontSize: '0.8rem', 
                  color: 'var(--text-secondary)', 
                  maxHeight: '350px', 
                  overflowY: 'auto', 
                  background: 'rgba(0,0,0,0.2)', 
                  padding: '1rem', 
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <strong>1. COVENANTS & CONDITIONS</strong>
                  <p>This agreement binds the applicant ({appName}) to the selected building: {state.properties.find(p => p.id === appPropId)?.name || 'Building'}.</p>
                  <strong>2. LEASE AGREEMENT TERM</strong>
                  <p>A standard 12-month calendar lease term starting on the 1st of next month, automatically renewing unless written 60-day notice is dispatched.</p>
                  <strong>3. FINANCIAL COMMITMENTS</strong>
                  <p>Rent is due on the 1st of each month via ACH electronic payment. Tenant agrees to hold renter insurance active throughout the occupancy.</p>
                  <strong>4. ESIGN STANDARD ACT</strong>
                  <p>Entering your signature below constitutes a legally binding electronic seal under federal ESIGN protocols, completely replacing paper-heavy lease signings.</p>
                </div>
              </div>

              {/* Approval stats and signature pad */}
              <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem' }}>
                  <span className="badge badge-success" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>✓ APPLICATION APPROVED</span>
                  <h3 style={{ fontSize: '1.5rem', color: 'var(--accent-emerald)', marginTop: '8px' }}>Credit Score: {creditCheckedScore}</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>No evictions logged • Verified 3.5x Rent-to-Income ratio</p>
                </div>

                <form onSubmit={handleESignLease} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Type Full Legal Name to e-Sign</label>
                    <input 
                      type="text" 
                      placeholder="Type e-Signature" 
                      value={signatureText} 
                      onChange={(e) => setSignatureText(e.target.value)} 
                      style={{ fontFamily: 'Dancing Script, cursive, Georgia, serif', fontSize: '1.4rem', textAlign: 'center', letterSpacing: '1px', color: 'var(--accent-violet)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass-strong)' }}
                      required 
                    />
                  </div>
                  
                  <div style={{ border: '1px dashed var(--border-glass)', padding: '0.75rem', borderRadius: '4px', background: 'rgba(0,0,0,0.1)', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
                      By signing above, you seal this electronic signature as a binding seal under the ESIGN Act.
                    </p>
                  </div>

                  <button type="submit" className="btn-success" style={{ padding: '0.75rem', fontSize: '0.95rem' }}>
                    ✍️ Sign & Finalize Lease Agreement
                  </button>
                </form>
              </div>

            </div>
          )}

          {appStatus === 'signed' && (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '3rem' }}>🔒</span>
              <h2 style={{ color: 'var(--accent-emerald)', fontSize: '1.6rem' }}>Lease Agreement Signed & Active!</h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
                Your online application has been approved, paystub income checked, Equifax screening completed, and lease signed digitally. 
                Paper-heavy leasing has been completely eliminated!
              </p>
              <button 
                onClick={() => {
                  setAppStatus('idle');
                  setAppName('');
                  setAppEmail('');
                  setAppFiles([]);
                  setSignatureText('');
                  setActiveTab('resident');
                }}
                className="btn-primary"
                style={{ marginTop: '1.5rem', padding: '0.75rem 2rem' }}
              >
                Return to Resident Portal
              </button>
            </div>
          )}

        </div>
      )}

      {/* RENT PAYMENT MODAL */}
      {showPayModal && tenant && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handlePaymentSubmit} className="glass-card" style={{ padding: '2rem', width: '450px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3>💳 Tenant Payment Portal</h3>
            
            <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: 'var(--radius-sm)' }}>
              <button 
                type="button"
                onClick={() => setPaymentMethod('ach')}
                style={{ 
                  flex: 1, 
                  background: paymentMethod === 'ach' ? 'var(--accent-violet)' : 'transparent',
                  color: 'white', border: 'none', padding: '0.5rem'
                }}
              >
                🏦 Bank ACH
              </button>
              <button 
                type="button"
                onClick={() => setPaymentMethod('card')}
                style={{ 
                  flex: 1, 
                  background: paymentMethod === 'card' ? 'var(--accent-violet)' : 'transparent',
                  color: 'white', border: 'none', padding: '0.5rem'
                }}
              >
                💳 Credit Card
              </button>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem' }}>Payment Amount ($)</label>
              <input 
                type="number" 
                max={tenant.balance} 
                min={1} 
                value={payAmount} 
                onChange={(e) => setPayAmount(Number(e.target.value))} 
                required 
              />
            </div>

            {paymentMethod === 'ach' ? (
              <>
                <div>
                  <label style={{ fontSize: '0.8rem' }}>Bank Routing Number</label>
                  <input type="text" placeholder="121000248" value={bankRouting} onChange={(e) => setBankRouting(e.target.value)} required />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem' }}>Checking Account Number</label>
                  <input type="text" placeholder="109284019241" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} required />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label style={{ fontSize: '0.8rem' }}>Credit Card Number</label>
                  <input type="text" placeholder="4111 2222 3333 4444" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem' }}>Expiration Date</label>
                    <input type="text" placeholder="MM/YY" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} required />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem' }}>CVC Security Code</label>
                    <input type="text" placeholder="382" required />
                  </div>
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn-primary" disabled={isProcessingPay} style={{ flex: 1 }}>
                {isProcessingPay ? 'Clearing Funds...' : `Authorize $${payAmount} Payment`}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowPayModal(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* TICKET WIZARD MODAL */}
      {showTicketModal && tenant && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleTicketSubmit} className="glass-card" style={{ padding: '2rem', width: '500px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3>🔧 File Repair Request</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem' }}>Request Title</label>
                <input type="text" value={ticketTitle} onChange={(e) => setTicketTitle(e.target.value)} placeholder="e.g. Water heater leaking" required />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem' }}>Priority Level</label>
                <select value={ticketPriority} onChange={(e) => setTicketPriority(e.target.value as any)}>
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="emergency">Emergency / Burst Pipe</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem' }}>Full Description & Details</label>
              <textarea 
                rows={4} 
                value={ticketDesc} 
                onChange={(e) => setTicketDesc(e.target.value)} 
                placeholder="Please describe what is leaking/broken, when it started, and any troubleshooting done." 
                required 
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem' }}>Simulated Photo Upload</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  value={mockPhotoName} 
                  onChange={(e) => setMockPhotoName(e.target.value)} 
                  placeholder="e.g. leaking_valve_photo.jpg" 
                  style={{ flex: 1 }} 
                />
                <button type="button" className="btn-secondary" onClick={() => setMockPhotoName('burst_pipe_image.png')}>
                  📎 Attach
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn-primary" style={{ flex: 1 }}>Submit Ticket</button>
              <button type="button" className="btn-secondary" onClick={() => setShowTicketModal(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* LEASE MODAL */}
      {showLeaseModal && tenant && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ padding: '2rem', width: '600px', maxHeight: '80%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ borderBottom: '2px solid var(--border-glass-strong)', paddingBottom: '0.5rem' }}>
              <h3>📄 Lease Agreement & Covenants</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Resident: {tenant.name} | Unit: {tenant.unitNo}</p>
            </div>
            
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: 'var(--radius-sm)' }}>
              <strong>1. TERM OF LEASE</strong>
              <p>This agreement begins on {tenant.leaseStart} and ends on {tenant.leaseEnd}.</p>
              
              <strong>2. MONTHLY RENT</strong>
              <p>Monthly rent is assessed at ${tenant.rentAmount} payable on the 1st of each calendar month. Late fees ($150) apply if unpaid by the 5th.</p>

              <strong>3. MAINTENANCE RESPONSIBILITIES</strong>
              <p>Resident agrees to notify management immediately of any burst pipes, HVAC failure, or water damage through the portal. Landlord agrees to dispatch licensed independent contractors within 48 hours for standard repairs, or immediately for emergencies.</p>

              <strong>4. E-SIGNATURES & BINDING CONTRACT</strong>
              <p>This document is electronically signed and secured under the U.S. Electronic Signatures in Global and National Commerce Act (ESIGN).</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-glass)', paddingTop: '1rem' }}>
              <span className="badge badge-success" style={{ padding: '0.5rem 1rem' }}>✓ Secured & e-Signed</span>
              <button className="btn-secondary" onClick={() => setShowLeaseModal(false)}>Close Viewer</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TenantView;
