import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

// Automated County Taxation Specifications
const countyTaxSpecs: { 
  [key: string]: { 
    county: string; 
    stateCode: string; 
    assessedVal: number; 
    assessmentRatio: number; 
    schoolMills: number; 
    muniMills: number; 
    utilityMills: number; 
    dueDate: string;
  } 
} = {
  p1: { county: 'Los Angeles County', stateCode: 'CA', assessedVal: 4500000, assessmentRatio: 0.80, schoolMills: 6.2, muniMills: 4.8, utilityMills: 1.2, dueDate: '2026-11-10' },
  p2: { county: 'Harris County', stateCode: 'TX', assessedVal: 2200000, assessmentRatio: 1.00, schoolMills: 12.4, muniMills: 8.2, utilityMills: 2.1, dueDate: '2026-12-31' },
  p3: { county: 'New York County', stateCode: 'NY', assessedVal: 3200000, assessmentRatio: 0.45, schoolMills: 18.5, muniMills: 16.2, utilityMills: 2.5, dueDate: '2026-10-15' },
  p4: { county: 'Cook County', stateCode: 'IL', assessedVal: 1100000, assessmentRatio: 0.33, schoolMills: 34.2, muniMills: 28.5, utilityMills: 4.1, dueDate: '2026-09-01' },
  p5: { county: 'Miami-Dade County', stateCode: 'FL', assessedVal: 2600000, assessmentRatio: 0.85, schoolMills: 7.8, muniMills: 5.6, utilityMills: 1.1, dueDate: '2026-11-01' }
};

const OwnerView: React.FC = () => {
  const { state } = useApp();
  // Simulate logging in as the primary owner
  const owner = state.owners[0];

  const [showStatementModal, setShowStatementModal] = useState(false);
  
  // Tax Feature States
  const [selectedTaxProp, setSelectedTaxProp] = useState<string>('p1');
  const [appreciation, setAppreciation] = useState<number>(5); // Default +5% appreciation forecast
  const [autoPayEnabled, setAutoPayEnabled] = useState<{ [key: string]: boolean }>({
    p1: true, p2: true, p3: false, p4: true, p5: false
  });
  const [escrowPaid, setEscrowPaid] = useState<{ [key: string]: boolean }>({});
  const [isProcessingTaxPayment, setIsProcessingTaxPayment] = useState<string | null>(null);

  // Financial YTD calculations
  const totalIncome = state.ledger.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = state.ledger.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const netIncome = totalIncome - totalExpenses;

  // Simulate Owner Draw based on share percent
  const ownerDrawAvailable = (netIncome * (owner.sharePercent / 100));

  // Compute overall taxation metrics
  const getTaxMetrics = (propId: string) => {
    const spec = countyTaxSpecs[propId] || countyTaxSpecs.p1;
    const taxableAssessed = spec.assessedVal * spec.assessmentRatio;
    const millageTotal = spec.schoolMills + spec.muniMills + spec.utilityMills;
    const annualTax = taxableAssessed * (millageTotal / 1000);
    const monthlyEscrow = annualTax / 12;
    // Assuming 5 months of accrued escrow cash in current cycle
    const accruedEscrow = monthlyEscrow * 5; 
    return {
      taxableAssessed,
      millageTotal,
      annualTax,
      monthlyEscrow,
      accruedEscrow
    };
  };

  const activeTaxObj = countyTaxSpecs[selectedTaxProp] || countyTaxSpecs.p1;
  const activeProperty = state.properties.find(p => p.id === selectedTaxProp) || state.properties[0];
  const activeMetrics = getTaxMetrics(selectedTaxProp);

  // Appreciation forecasts
  const forecastedAssessed = activeTaxObj.assessedVal * (1 + appreciation / 100);
  const forecastedTaxable = forecastedAssessed * activeTaxObj.assessmentRatio;
  const forecastedTax = forecastedTaxable * (activeMetrics.millageTotal / 1000);

  const handleTriggerManualPay = (propId: string, countyName: string, amount: number) => {
    setIsProcessingTaxPayment(propId);
    setTimeout(() => {
      setIsProcessingTaxPayment(null);
      setEscrowPaid(prev => ({ ...prev, [propId]: true }));
      alert(`✓ AUTOMATED PROPERTY TAX SETTLEMENT CLEARED:\n\nTransmitted $${Math.round(amount).toLocaleString()} from property escrow reserve to ${countyName} Tax Collector!\n\nReceipt registered: TX-LEVY-2026-${Math.floor(Math.random() * 90000 + 10000)}`);
    }, 2000);
  };

  const handleToggleAutoPay = (propId: string) => {
    setAutoPayEnabled(prev => ({ ...prev, [propId]: !prev[propId] }));
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* HEADER BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', background: 'linear-gradient(to right, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Investor Portal
          </h2>
          <p>Welcome back, {owner.name}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowStatementModal(true)}>
          📄 Download Investor Statement
        </button>
      </div>

      {/* METRICS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid var(--accent-violet)' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Ownership Equity Share</p>
          <h2 style={{ fontSize: '2.5rem' }}>{owner.sharePercent}%</h2>
        </div>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Gross Income (YTD)</p>
          <h2 style={{ fontSize: '2.5rem', color: 'var(--accent-emerald)' }}>${totalIncome.toLocaleString()}</h2>
        </div>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Operating Expenses</p>
          <h2 style={{ fontSize: '2.5rem', color: 'var(--accent-rose)' }}>${totalExpenses.toLocaleString()}</h2>
        </div>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Net Profit</p>
          <h2 style={{ fontSize: '2.5rem', color: netIncome > 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
            ${netIncome.toLocaleString()}
          </h2>
        </div>
      </div>

      {/* PORTFOLIO & CAPITAL ACCOUNTS */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '1.5rem' }}>
        
        {/* Portfolio Table */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Portfolio Performance Breakdown</h3>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '0.75rem' }}>Property Asset</th>
                <th style={{ padding: '0.75rem' }}>Units</th>
                <th style={{ padding: '0.75rem' }}>Occupancy</th>
                <th style={{ padding: '0.75rem' }}>Monthly Revenue</th>
              </tr>
            </thead>
            <tbody>
              {state.properties.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 500 }}>{p.name}</td>
                  <td style={{ padding: '0.75rem' }}>{p.units}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span className={`badge ${p.occupancyRate > 90 ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.7rem' }}>
                      {p.occupancyRate}%
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                    ${p.monthlyRevenue.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Capital Accounts */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h3 style={{ marginBottom: '0.5rem' }}>Capital Accounts</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Based on {owner.sharePercent}% ownership schedule.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem' }}>Previous Draw Total</span>
              <span style={{ fontWeight: 'bold' }}>${owner.totalDraws.toLocaleString()}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--accent-emerald)' }}>Available Distributions</span>
              <span style={{ fontWeight: 'bold', color: 'var(--accent-emerald)' }}>${ownerDrawAvailable.toLocaleString()}</span>
            </div>
          </div>

          <button className="btn-success" style={{ width: '100%', marginTop: 'auto', padding: '0.75rem' }} onClick={() => alert('✓ Transfer Request Dispatched: $18,450 draw transfer scheduled via corporate wire.')}>
            Request Owner Draw Transfer
          </button>
        </div>
      </div>

      {/* COUNTY PROPERTY TAX ASSESSMENT & MILLAGE RATES */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', background: 'linear-gradient(to right, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ⚖️ County-Wise Property Taxation & Automated Escrow Reserves
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Automate annual tax payments by holding back 1/12th of property levy into dedicated escrow vaults, reconciling millage rates in real-time.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
          
          {/* Jurisdiction Ledger Table */}
          <div>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '1rem', color: 'var(--accent-violet)' }}>Jurisdiction Tax Ledger</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.5rem' }}>Property & County</th>
                  <th style={{ padding: '0.5rem' }}>Assessment Ratio</th>
                  <th style={{ padding: '0.5rem' }}>Millage Rate</th>
                  <th style={{ padding: '0.5rem' }}>Monthly Escrow Hold</th>
                  <th style={{ padding: '0.5rem' }}>Auto-Pay Status</th>
                </tr>
              </thead>
              <tbody>
                {state.properties.map(p => {
                  const spec = countyTaxSpecs[p.id] || countyTaxSpecs.p1;
                  const metrics = getTaxMetrics(p.id);
                  const isPaid = escrowPaid[p.id];
                  
                  return (
                    <tr 
                      key={p.id} 
                      onClick={() => setSelectedTaxProp(p.id)}
                      style={{ 
                        borderBottom: '1px solid var(--border-glass)',
                        background: selectedTaxProp === p.id ? 'rgba(255,255,255,0.03)' : 'transparent',
                        cursor: 'pointer'
                      }}
                    >
                      <td style={{ padding: '0.75rem' }}>
                        <strong>{p.name}</strong><br/>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{spec.county}, {spec.stateCode}</span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        {(spec.assessmentRatio * 100)}%
                      </td>
                      <td style={{ padding: '0.75rem', color: 'var(--accent-amber)' }}>
                        {metrics.millageTotal.toFixed(1)} mills
                      </td>
                      <td style={{ padding: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 'bold' }}>
                        ${Math.round(metrics.monthlyEscrow)}/mo
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleAutoPay(p.id);
                            }}
                            className={autoPayEnabled[p.id] ? 'btn-success' : 'btn-secondary'}
                            style={{ padding: '2px 8px', fontSize: '0.65rem' }}
                            disabled={!!isPaid}
                          >
                            {autoPayEnabled[p.id] ? 'Auto' : 'Manual'}
                          </button>
                          {isPaid && (
                            <span className="badge badge-success" style={{ fontSize: '0.6rem', padding: '2px 4px' }}>
                              ✓ Settled
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Interactive Calculator and Millage Breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'rgba(0,0,0,0.15)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
            <div>
              <h4 style={{ fontSize: '1rem', color: 'white', marginBottom: '4px' }}>
                {activeProperty.name} Tax Inspector
              </h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Jurisdiction: {activeTaxObj.county}, {activeTaxObj.stateCode}
              </p>
            </div>

            {/* Millage Graph Split */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span>Millage Tax Apportionment</span>
                <strong style={{ color: 'var(--accent-amber)' }}>{activeMetrics.millageTotal.toFixed(1)} Mills</strong>
              </div>
              <div style={{ display: 'flex', height: '14px', borderRadius: '7px', overflow: 'hidden', border: '1px solid var(--border-glass)' }}>
                <div style={{ width: `${(activeTaxObj.schoolMills / activeMetrics.millageTotal) * 100}%`, background: 'var(--accent-violet)' }} title={`School: ${activeTaxObj.schoolMills} mills`} />
                <div style={{ width: `${(activeTaxObj.muniMills / activeMetrics.millageTotal) * 100}%`, background: 'var(--accent-emerald)' }} title={`Municipal: ${activeTaxObj.muniMills} mills`} />
                <div style={{ width: `${(activeTaxObj.utilityMills / activeMetrics.millageTotal) * 100}%`, background: 'var(--accent-rose)' }} title={`Special Utility: ${activeTaxObj.utilityMills} mills`} />
              </div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '0.7rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <div style={{ width: '8px', height: '8px', background: 'var(--accent-violet)', borderRadius: '50%' }} />
                  School ({activeTaxObj.schoolMills} mills)
                </div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <div style={{ width: '8px', height: '8px', background: 'var(--accent-emerald)', borderRadius: '50%' }} />
                  Muni ({activeTaxObj.muniMills} mills)
                </div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <div style={{ width: '8px', height: '8px', background: 'var(--accent-rose)', borderRadius: '50%' }} />
                  Utility ({activeTaxObj.utilityMills} mills)
                </div>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>County Market valuation:</span>
                <span>${activeTaxObj.assessedVal.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Taxable Assessment ({activeTaxObj.assessmentRatio * 100}%):</span>
                <span>${activeMetrics.taxableAssessed.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderBottom: '1px solid var(--border-glass)', paddingBottom: '4px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>YTD Property Tax Liability:</span>
                <span style={{ color: 'var(--accent-rose)' }}>${Math.round(activeMetrics.annualTax).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-emerald)', fontWeight: 'bold' }}>
                <span>YTD Auto-Escrow Reserve:</span>
                <span>${Math.round(activeMetrics.accruedEscrow).toLocaleString()}</span>
              </div>
            </div>

            {/* Simulation projections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <span>Appreciation Projection:</span>
                <strong style={{ color: appreciation >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                  {appreciation >= 0 ? '+' : ''}{appreciation}%
                </strong>
              </div>
              <input 
                type="range" 
                min={-10} 
                max={15} 
                value={appreciation} 
                onChange={(e) => setAppreciation(Number(e.target.value))}
                style={{ width: '100%', height: '4px', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                <span>Projected Assessment: ${Math.round(forecastedAssessed).toLocaleString()}</span>
                <span>Projected Tax: ${Math.round(forecastedTax).toLocaleString()}</span>
              </div>
            </div>

            {/* Escrow payout actions */}
            {escrowPaid[selectedTaxProp] ? (
              <span className="badge badge-success" style={{ display: 'block', padding: '0.6rem', textAlign: 'center', fontWeight: 'bold' }}>
                ✓ LEVY FULLY ESCROW SETTLED (PAID)
              </span>
            ) : (
              <button 
                type="button"
                className="btn-primary" 
                disabled={isProcessingTaxPayment === selectedTaxProp}
                onClick={() => handleTriggerManualPay(selectedTaxProp, activeTaxObj.county, activeMetrics.annualTax)}
                style={{ width: '100%', padding: '0.6rem' }}
              >
                {isProcessingTaxPayment === selectedTaxProp 
                  ? 'Transmitting Escrow Payout to County...' 
                  : autoPayEnabled[selectedTaxProp]
                    ? `Auto-disburse escrow levy ($${Math.round(activeMetrics.annualTax).toLocaleString()})`
                    : `Disburse manual levy ($${Math.round(activeMetrics.annualTax).toLocaleString()})`
                }
              </button>
            )}

            <p style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
              Next County Tax Assessment payment deadline: <strong>{activeTaxObj.dueDate}</strong>
            </p>
          </div>

        </div>
      </div>

      {/* PDF STATEMENT MODAL */}
      {showStatementModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ padding: '2rem', width: '700px', maxHeight: '90%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: '#fafafa', color: '#111' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid #333', paddingBottom: '1rem' }}>
              <div>
                <h2 style={{ color: '#333', margin: 0 }}>LuminaRental Management</h2>
                <p style={{ fontSize: '0.8rem', color: '#666' }}>100 Executive Parkway, CA<br/>support@luminarental.com</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h3 style={{ color: '#555', margin: 0 }}>INVESTOR STATEMENT</h3>
                <p style={{ fontSize: '0.8rem', color: '#666' }}>Date Generated: {new Date().toLocaleDateString()}</p>
                <p style={{ fontSize: '0.8rem', color: '#666' }}>Investor: {owner.name}</p>
              </div>
            </div>

            <div>
              <h4 style={{ borderBottom: '1px solid #ccc', paddingBottom: '4px', marginBottom: '8px' }}>YTD FINANCIAL SUMMARY</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '4px' }}>
                <span>Gross Income</span>
                <span>${totalIncome.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '4px' }}>
                <span>Operating Expenses</span>
                <span style={{ color: '#d32f2f' }}>(${totalExpenses.toLocaleString()})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 'bold', marginTop: '8px', borderTop: '1px solid #ccc', paddingTop: '8px' }}>
                <span>NET OPERATING INCOME</span>
                <span>${netIncome.toLocaleString()}</span>
              </div>
            </div>

            <div>
              <h4 style={{ borderBottom: '1px solid #ccc', paddingBottom: '4px', marginBottom: '8px' }}>EXPENSE BREAKDOWN</h4>
              <table style={{ width: '100%', fontSize: '0.8rem', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#eee' }}>
                    <th style={{ padding: '6px' }}>Date</th>
                    <th style={{ padding: '6px' }}>Payee / Description</th>
                    <th style={{ padding: '6px' }}>Category</th>
                    <th style={{ padding: '6px', textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {state.ledger.filter(l => l.type === 'expense').map(l => (
                    <tr key={l.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '6px' }}>{l.date}</td>
                      <td style={{ padding: '6px' }}>{l.description}</td>
                      <td style={{ padding: '6px' }}>{l.category}</td>
                      <td style={{ padding: '6px', textAlign: 'right' }}>${Math.abs(l.amount).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', borderTop: '1px solid #ddd', paddingTop: '1rem' }}>
              <button 
                type="button"
                onClick={() => setShowStatementModal(false)}
                style={{ padding: '0.5rem 1rem', background: '#e0e0e0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Close Viewer
              </button>
              <button 
                type="button"
                style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                onClick={() => alert('PDF downloading...')}
              >
                Save PDF
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default OwnerView;
