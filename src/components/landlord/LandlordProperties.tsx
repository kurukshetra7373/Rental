import React, { useState } from 'react';
import type { AppState, Property, Tenant } from '../../types';

const countyTaxSpecs: { 
  [key: string]: { 
    county: string; 
    stateCode: string; 
    assessedVal: number; 
    assessmentRatio: number; 
    schoolMills: number; 
    muniMills: number; 
    utilityMills: number; 
  } 
} = {
  p1: { county: 'Los Angeles County', stateCode: 'CA', assessedVal: 4500000, assessmentRatio: 0.80, schoolMills: 6.2, muniMills: 4.8, utilityMills: 1.2 },
  p2: { county: 'Harris County', stateCode: 'TX', assessedVal: 2200000, assessmentRatio: 1.00, schoolMills: 12.4, muniMills: 8.2, utilityMills: 2.1 },
  p3: { county: 'New York County', stateCode: 'NY', assessedVal: 3200000, assessmentRatio: 0.45, schoolMills: 18.5, muniMills: 16.2, utilityMills: 2.5 },
  p4: { county: 'Cook County', stateCode: 'IL', assessedVal: 1100000, assessmentRatio: 0.33, schoolMills: 34.2, muniMills: 28.5, utilityMills: 4.1 },
  p5: { county: 'Miami-Dade County', stateCode: 'FL', assessedVal: 2600000, assessmentRatio: 0.85, schoolMills: 7.8, muniMills: 5.6, utilityMills: 1.1 }
};

interface PropertiesProps {
  state: AppState;
  addProperty: (property: Omit<Property, 'id' | 'occupancyRate' | 'monthlyRevenue'>) => void;
  addTenant: (tenant: Omit<Tenant, 'id' | 'balance' | 'status' | 'autopayStatus'>) => void;
}

const LandlordProperties: React.FC<PropertiesProps> = ({ state, addProperty, addTenant }) => {
  const [activeSubTab, setActiveSubTab] = useState<'buildings' | 'syndication' | 'screening'>('buildings');
  
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showTenantModal, setShowTenantModal] = useState(false);
  
  // Property Form State
  const [propName, setPropName] = useState('');
  const [propAddress, setPropAddress] = useState('');
  const [propUnits, setPropUnits] = useState(1);

  // Tenant Form State
  const [tenantName, setTenantName] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [tenantPropId, setTenantPropId] = useState(state.properties[0]?.id || '');
  const [tenantUnit, setTenantUnit] = useState('');
  const [tenantRent, setTenantRent] = useState(1000);
  const [leaseStart, setLeaseStart] = useState('2026-06-01');
  const [leaseEnd, setLeaseEnd] = useState('2027-05-31');

  // Syndication Form States
  const [syndicatePropId, setSyndicatePropId] = useState(state.properties[0]?.id || '');
  const [syndicateRent, setSyndicateRent] = useState(1950);
  const [syndicateDescription, setSyndicateDescription] = useState(
    'Gorgeous modern loft apartment with open brick concepts, quartz countertops, high-end stainless steel appliances, floor-to-ceiling city views, and pet-friendly policies.'
  );
  
  // Syndication Status
  const [syndicateStatus, setSyndicateStatus] = useState<'idle' | 'syndicating' | 'active'>('idle');
  const [activeChannels, setActiveChannels] = useState<string[]>([]);
  const [inboundLeads, setInboundLeads] = useState<any[]>([
    { id: 'lead1', name: 'Liam Carter', source: 'Zillow', email: 'liam.c@zillow.com', phone: '(555) 777-1234', credit: 742, evictions: 0 },
    { id: 'lead2', name: 'Chloe Sterling', source: 'Apartments.com', email: 'chloe.s@apts.com', phone: '(555) 888-5678', credit: 690, evictions: 0 }
  ]);

  // Screening States
  const [screeningTenant, setScreeningTenant] = useState<string>('');
  const [selectedLeadData, setSelectedLeadData] = useState<any | null>(null);
  const [screeningStatus, setScreeningStatus] = useState<'idle' | 'scanning' | 'done'>('idle');
  const [screeningResult, setScreeningResult] = useState<any>(null);

  // Lease Sign States
  const [leaseDrafted, setLeaseDrafted] = useState(false);
  const [landlordSigned, setLandlordSigned] = useState(false);
  const [tenantSigned, setTenantSigned] = useState(false);

  const handlePropSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!propName || !propAddress) return;
    addProperty({ name: propName, address: propAddress, units: Number(propUnits) });
    setPropName(''); setPropAddress(''); setPropUnits(1);
    setShowPropertyModal(false);
  };

  const handleTenantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantName || !tenantEmail || !tenantUnit) return;
    addTenant({
      name: tenantName,
      email: tenantEmail,
      phone: tenantPhone,
      propertyId: tenantPropId,
      unitNo: tenantUnit,
      rentAmount: Number(tenantRent),
      leaseStart,
      leaseEnd
    });
    setTenantName(''); setTenantEmail(''); setTenantPhone(''); setTenantUnit(''); setTenantRent(1000);
    setShowTenantModal(false);
  };

  // Run the animated syndication pipeline
  const runSyndication = () => {
    setSyndicateStatus('syndicating');
    setActiveChannels([]);
    
    setTimeout(() => {
      setActiveChannels(prev => [...prev, 'Zillow']);
    }, 600);

    setTimeout(() => {
      setActiveChannels(prev => [...prev, 'Apartments.com']);
    }, 1200);

    setTimeout(() => {
      setActiveChannels(prev => [...prev, 'Trulia']);
    }, 1800);

    setTimeout(() => {
      setActiveChannels(prev => [...prev, 'HotPads']);
    }, 2400);

    setTimeout(() => {
      setSyndicateStatus('active');
    }, 3000);
  };

  // Run screening checks
  const startScreening = () => {
    setScreeningStatus('scanning');
    setLeaseDrafted(false);
    setLandlordSigned(false);
    setTenantSigned(false);
    
    setTimeout(() => {
      setScreeningStatus('done');
      if (selectedLeadData) {
        setScreeningResult({
          creditScore: selectedLeadData.credit,
          creditRating: selectedLeadData.credit >= 700 ? 'Excellent' : 'Good / Approved with Deposit',
          background: 'Clean criminal record. Verified credit matching standard ratios.',
          incomeMatch: '3.4x monthly rent (Verified via W-2 payloads)',
          evictionsCount: 0,
          decision: 'APPROVED - ELIGIBLE FOR LEASE CONTRACT'
        });
      } else {
        const selected = state.tenants.find(t => t.id === screeningTenant);
        const isDelinquent = selected?.status === 'delinquent';
        
        setScreeningResult({
          creditScore: isDelinquent ? 582 : 735,
          creditRating: isDelinquent ? 'Subprime / Delinquent History' : 'Excellent',
          background: isDelinquent ? 'Clean criminal record. Flagged eviction: Landlord Dispute (2024)' : 'Clean criminal record. No flags found.',
          incomeMatch: isDelinquent ? '2.1x monthly rent (Below 3x standard)' : '3.6x monthly rent (Verified via tax returns)',
          evictionsCount: isDelinquent ? 1 : 0,
          decision: isDelinquent ? 'REJECTED / HIGH RISK' : 'APPROVED FOR LEASING'
        });
      }
    }, 2500);
  };

  const handleAcceptLead = (lead: any) => {
    setSelectedLeadData(lead);
    setScreeningTenant(''); // clear standard dropdown
    setActiveSubTab('screening');
    setScreeningStatus('idle');
    setScreeningResult(null);
    setInboundLeads(prev => prev.filter(l => l.id !== lead.id));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', background: 'linear-gradient(to right, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Properties & Resident Management
          </h2>
          <p>Manage your buildings, post vacancies, and screen applicants</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={() => setShowPropertyModal(true)}>🏢 Add Property</button>
          <button className="btn-primary" onClick={() => setShowTenantModal(true)}>👤 Add Tenant</button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
        {[
          { id: 'buildings', label: '🏢 Buildings & Residents' },
          { id: 'syndication', label: '📣 Vacancies & Listings' },
          { id: 'screening', label: '🛡️ Applicant Screening & Lease' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            style={{
              background: activeSubTab === tab.id ? 'var(--accent-violet)' : 'transparent',
              color: activeSubTab === tab.id ? 'white' : 'var(--text-secondary)',
              border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', fontSize: '0.85rem'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* BUILDINGS & DIRECTORY TAB */}
      {activeSubTab === 'buildings' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: '1.5rem' }} className="grid-split">
          
          {/* Buildings table */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Your Buildings</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                  <th style={{ padding: '0.75rem' }}>Name & Address</th>
                  <th style={{ padding: '0.75rem' }}>Units</th>
                  <th style={{ padding: '0.75rem' }}>Occupancy Rate</th>
                  <th style={{ padding: '0.75rem' }}>Revenue Stream</th>
                  <th style={{ padding: '0.75rem' }}>⚖️ Property Tax & Savings</th>
                </tr>
              </thead>
              <tbody>
                {state.properties.map(p => {
                  const spec = countyTaxSpecs[p.id] || countyTaxSpecs.p1;
                  const taxableValue = spec.assessedVal * spec.assessmentRatio;
                  const millageTotal = spec.schoolMills + spec.muniMills + spec.utilityMills;
                  const annualTax = taxableValue * (millageTotal / 1000);
                  const monthlyEscrow = annualTax / 12;

                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                      <td style={{ padding: '0.75rem' }}>
                        <strong style={{ fontSize: '0.9rem' }}>{p.name}</strong>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{p.address}</p>
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.9rem' }}>{p.units}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span className={`badge ${p.occupancyRate >= 90 ? 'badge-success' : p.occupancyRate > 0 ? 'badge-warning' : 'badge-neutral'}`} style={{ fontSize: '0.7rem' }}>
                          {p.occupancyRate}%
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.9rem', color: 'var(--accent-emerald)', fontWeight: '600' }}>
                        ${p.monthlyRevenue.toLocaleString()}/mo
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.8rem' }}>
                        <div style={{ fontWeight: 'bold', color: 'var(--accent-amber)' }}>
                          {spec.county}, {spec.stateCode}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          Property Value: ${spec.assessedVal.toLocaleString()} ({spec.assessmentRatio * 100}% taxable portion)
                        </div>
                        <div style={{ color: 'var(--accent-rose)', fontWeight: 'bold', marginTop: '2px' }}>
                          Yearly Tax: ${Math.round(annualTax).toLocaleString()}/yr
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)', fontWeight: '600' }}>
                          Monthly Tax Savings: ${Math.round(monthlyEscrow)}/mo
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Tenant overview */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Resident Directory</h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {state.tenants.map(t => {
                const prop = state.properties.find(p => p.id === t.propertyId)?.name;
                return (
                  <li key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.15)' }}>
                    <div>
                      <strong style={{ fontSize: '0.9rem' }}>{t.name}</strong>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{prop} | Unit {t.unitNo}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge ${t.status === 'active' ? 'badge-success' : t.status === 'delinquent' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '0.65rem' }}>
                        {t.status}
                      </span>
                      <p style={{ fontSize: '0.8rem', fontWeight: 'bold', marginTop: '4px', color: t.balance > 0 ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
                        Bal: ${t.balance}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

        </div>
      )}

      {/* VACANCIES & MARKETING SYNDICATION TAB */}
      {activeSubTab === 'syndication' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1.5rem' }} className="grid-split">
          
          {/* Syndication Controller Card */}
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3>📣 Syndication Control</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>List listing parameters and syndicate the vacancy details across top internet listing channels instantly.</p>
            
            <div>
              <label style={{ fontSize: '0.8rem' }}>Choose Vacant Property</label>
              <select value={syndicatePropId} onChange={(e) => setSyndicatePropId(e.target.value)}>
                {state.properties.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem' }}>Target Monthly Rent ($)</label>
              <input type="number" min={1} value={syndicateRent} onChange={(e) => setSyndicateRent(Number(e.target.value))} required />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem' }}>Listing Description</label>
              <textarea 
                rows={4}
                value={syndicateDescription} 
                onChange={(e) => setSyndicateDescription(e.target.value)} 
                required 
              />
            </div>

            <button 
              className="btn-primary" 
              onClick={runSyndication}
              disabled={syndicateStatus === 'syndicating'}
              style={{ padding: '0.75rem', marginTop: '10px' }}
            >
              {syndicateStatus === 'syndicating' ? 'Pushing Webhook Listings...' : 'Syndicate Vacancy Now'}
            </button>
          </div>

          {/* Inbound Channels and Leads Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Active Channels */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h4 style={{ fontSize: '1rem', marginBottom: '8px' }}>Active syndication Channels</h4>
              
              {syndicateStatus === 'syndicating' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '1rem 0' }}>
                  <div style={{ height: '6px', background: 'var(--border-glass)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(activeChannels.length / 4) * 100}%`, background: 'var(--accent-violet)', transition: 'width 0.4s ease' }} />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Syndicating to platforms: {activeChannels.join(', ')}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                {['Zillow', 'Apartments.com', 'Trulia', 'HotPads'].map(chan => {
                  const isActive = activeChannels.includes(chan) || syndicateStatus === 'active';
                  return (
                    <div 
                      key={chan} 
                      style={{ 
                        padding: '0.5rem 1rem', 
                        border: '1px solid var(--border-glass)', 
                        borderRadius: '20px', 
                        background: isActive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(0,0,0,0.2)',
                        color: isActive ? 'var(--accent-emerald)' : 'var(--text-tertiary)',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {isActive ? '●' : '○'} {chan}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Inbound Leads */}
            <div className="glass-card" style={{ padding: '1.5rem', flex: 1 }}>
              <h4 style={{ fontSize: '1rem', marginBottom: '10px' }}>Live Prospective Tenant Leads</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Review leads submitted through active rental website channels.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {inboundLeads.map(lead => (
                  <div key={lead.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.15)' }}>
                    <div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <strong style={{ fontSize: '0.9rem' }}>{lead.name}</strong>
                        <span className="badge badge-neutral" style={{ fontSize: '0.6rem' }}>{lead.source}</span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>{lead.email} | {lead.phone}</p>
                    </div>
                    <button className="btn-success" onClick={() => handleAcceptLead(lead)} style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                      Accept & Run Screen
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* SCREENING & ONLINE LEASING TAB */}
      {activeSubTab === 'screening' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>🛡️ Automated Screening & Online Leasing</h3>
          <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>Run instant credit checks, criminal background history, eviction registry screenings, and e-sign digital leases.</p>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
            
            {selectedLeadData ? (
              <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Accepting Lead Prospect:</span>
                  <h4 style={{ margin: 0, color: 'white' }}>{selectedLeadData.name} ({selectedLeadData.source})</h4>
                </div>
                <button className="btn-secondary" onClick={() => setSelectedLeadData(null)} style={{ fontSize: '0.75rem', padding: '4px 10px' }}>Clear Lead</button>
              </div>
            ) : (
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Select Resident Applicant</label>
                <select 
                  value={screeningTenant} 
                  onChange={(e) => {
                    setScreeningTenant(e.target.value);
                    setScreeningStatus('idle');
                    setScreeningResult(null);
                  }}
                  style={{ marginTop: '4px' }}
                >
                  <option value="">-- Choose Tenant --</option>
                  {state.tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.name} (Unit {t.unitNo})</option>
                  ))}
                </select>
              </div>
            )}

            <button 
              className="btn-primary" 
              disabled={(!screeningTenant && !selectedLeadData) || screeningStatus === 'scanning'}
              onClick={startScreening}
              style={{ padding: '0.9rem 2rem', marginTop: selectedLeadData ? '0' : '20px' }}
            >
              {screeningStatus === 'scanning' ? 'Running Core Verification...' : 'Launch background Check'}
            </button>
          </div>

          {screeningStatus === 'scanning' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '3rem 0' }}>
              <div style={{ 
                width: '60px', height: '60px', 
                border: '4px solid var(--border-glass-strong)', 
                borderTopColor: 'var(--accent-violet)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
              `}</style>
              <strong>Pulling Equifax & Eviction Registry Feeds...</strong>
            </div>
          )}

          {screeningStatus === 'done' && screeningResult && (
            <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }} className="grid-split">
              <div>
                <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>Screening Report: {selectedLeadData ? selectedLeadData.name : state.tenants.find(t => t.id === screeningTenant)?.name}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                  <div>
                    <strong>Credit Score / Rating: </strong>
                    <span style={{ color: screeningResult.creditScore >= 650 ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontWeight: 'bold' }}>
                      {screeningResult.creditScore} ({screeningResult.creditRating})
                    </span>
                  </div>
                  <div>
                    <strong>Criminal Database Check: </strong>
                    <p style={{ display: 'inline', color: 'var(--text-secondary)' }}>{screeningResult.background}</p>
                  </div>
                  <div>
                    <strong>Income Audit Match: </strong>
                    <span style={{ color: screeningResult.incomeMatch.includes('Below') ? 'var(--accent-rose)' : 'var(--accent-emerald)', fontWeight: 'bold' }}>
                      {screeningResult.incomeMatch}
                    </span>
                  </div>
                  <div>
                    <strong>Previous Eviction Actions: </strong>
                    <span style={{ color: screeningResult.evictionsCount > 0 ? 'var(--accent-rose)' : 'var(--text-primary)', fontWeight: 'bold' }}>
                      {screeningResult.evictionsCount} records
                    </span>
                  </div>
                </div>
              </div>
              
              <div style={{ borderLeft: '1px solid var(--border-glass)', paddingLeft: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>LUMINA AI SCREENING DECISION</p>
                <h3 style={{ 
                  margin: '0.5rem 0 1.5rem 0', 
                  color: screeningResult.decision.includes('APPROVED') ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                  fontWeight: 'bold'
                }}>
                  {screeningResult.decision}
                </h3>
                
                {screeningResult.decision.includes('APPROVED') && (
                  <>
                    {!leaseDrafted ? (
                      <button className="btn-primary" onClick={() => setLeaseDrafted(true)} style={{ width: '100%' }}>
                        Generate Online Lease
                      </button>
                    ) : (
                      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <p style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)' }}>✓ Lease Generated (Delivered to Portal)</p>
                        
                        <button 
                          className="btn-secondary" 
                          disabled={landlordSigned}
                          onClick={() => setLandlordSigned(true)}
                          style={{ background: landlordSigned ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)', color: landlordSigned ? 'var(--accent-emerald)' : 'white' }}
                        >
                          {landlordSigned ? '✓ Landlord e-Signed' : '✍️ Landlord Sign'}
                        </button>

                        <button 
                          className="btn-secondary" 
                          disabled={tenantSigned}
                          onClick={() => setTenantSigned(true)}
                          style={{ background: tenantSigned ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)', color: tenantSigned ? 'var(--accent-emerald)' : 'white' }}
                        >
                          {tenantSigned ? '✓ Tenant e-Signed' : '✍️ Tenant Sign'}
                        </button>

                        {landlordSigned && tenantSigned && (
                          <span className="badge badge-success" style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 'bold' }}>
                            🔒 LEASE SIGNED & ACTIVE
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Property Modal */}
      {showPropertyModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handlePropSubmit} className="glass-card" style={{ padding: '2rem', width: '450px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3>🏢 Register New Property</h3>
            
            <div>
              <label style={{ fontSize: '0.8rem' }}>Property Name</label>
              <input type="text" value={propName} onChange={(e) => setPropName(e.target.value)} placeholder="Palms Condominium" required />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem' }}>Address</label>
              <input type="text" value={propAddress} onChange={(e) => setPropAddress(e.target.value)} placeholder="Full street address" required />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem' }}>Total Units</label>
              <input type="number" min={1} value={propUnits} onChange={(e) => setPropUnits(Number(e.target.value))} required />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn-primary" style={{ flex: 1 }}>Save Property</button>
              <button type="button" className="btn-secondary" onClick={() => setShowPropertyModal(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Tenant Modal */}
      {showTenantModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleTenantSubmit} className="glass-card" style={{ padding: '2rem', width: '500px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3>👤 Onboard New Tenant</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem' }}>Full Name</label>
                <input type="text" value={tenantName} onChange={(e) => setTenantName(e.target.value)} placeholder="Alice Williams" required />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem' }}>Phone</label>
                <input type="text" value={tenantPhone} onChange={(e) => setTenantPhone(e.target.value)} placeholder="(555) 000-0000" />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem' }}>Email Address</label>
              <input type="email" value={tenantEmail} onChange={(e) => setTenantEmail(e.target.value)} placeholder="alice@example.com" required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem' }}>Property Building</label>
                <select value={tenantPropId} onChange={(e) => setTenantPropId(e.target.value)}>
                  {state.properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem' }}>Unit No.</label>
                <input type="text" value={tenantUnit} onChange={(e) => setTenantUnit(e.target.value)} placeholder="104B" required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem' }}>Rent Amount</label>
                <input type="number" min={1} value={tenantRent} onChange={(e) => setTenantRent(Number(e.target.value))} required />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem' }}>Start Date</label>
                <input type="date" value={leaseStart} onChange={(e) => setLeaseStart(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem' }}>End Date</label>
                <input type="date" value={leaseEnd} onChange={(e) => setLeaseEnd(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn-primary" style={{ flex: 1 }}>Save Resident</button>
              <button type="button" className="btn-secondary" onClick={() => setShowTenantModal(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default LandlordProperties;
