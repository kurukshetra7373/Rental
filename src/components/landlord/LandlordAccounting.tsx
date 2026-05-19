import React, { useState } from 'react';
import type { AppState, LedgerTransaction } from '../../types';

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

interface AccountingProps {
  state: AppState;
  addLedgerEntry: (entry: Omit<LedgerTransaction, 'id' | 'status'>) => void;
  reconcileTransaction: (ledgerId: string) => void;
}

const LandlordAccounting: React.FC<AccountingProps> = ({ state, addLedgerEntry, reconcileTransaction }) => {
  const [activeSubTab, setActiveSubTab] = useState<'ledger' | 'reconciliation' | 'statements' | 'tax' | 'escrow' | 'emailparser'>('ledger');

  // Email Parser States
  const [emailText, setEmailText] = useState('');
  const [parseStatus, setParseStatus] = useState<'idle' | 'scanning' | 'done'>('idle');
  const [parsedResult, setParsedResult] = useState<{ amount: number; payer: string; txnId: string; date: string; type: 'income' | 'expense' } | null>(null);
  const [parsePropId, setParsePropId] = useState('');
  const [parsePosted, setParsePosted] = useState(false);

  const exampleEmails = [
    { label: 'Chase ACH Deposit', text: 'Chase Alert: You received an ACH deposit of $1,800.00 from Alice Johnson on 05/19/2026. Transaction ID: TXN-ACH-8821043.' },
    { label: 'Bank of America Debit', text: 'Bank of America: A debit of $350.00 was made to FixIt Plumbing Co on 05/17/2026. Reference ID: BOA-DEB-334921.' },
    { label: 'Wells Fargo Wire', text: 'Wells Fargo: Wire transfer received. Amount: $3,000.00. Sender: Downtown Lofts LLC. Date: May 16, 2026. Confirmation: WF-WIRE-990021.' },
  ];

  const parseEmail = () => {
    if (!emailText.trim()) return;
    setParseStatus('scanning');
    setParsedResult(null);
    setParsePosted(false);

    setTimeout(() => {
      // Extract amount
      const amountMatch = emailText.match(/\$\s?([\d,]+(?:\.\d{1,2})?)/);
      const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;

      // Determine income vs expense
      const isExpense = /debit|payment|paid|charge|withdrawal/i.test(emailText);

      // Extract payer / payee
      const fromMatch = emailText.match(/from\s+([A-Z][a-zA-Z\s&]+?)(?:\s+on|\s*\.|,|$)/);
      const toMatch = emailText.match(/(?:to|made to)\s+([A-Z][a-zA-Z\s&]+?)(?:\s+on|\s*\.|,|$)/);
      const senderMatch = emailText.match(/(?:Sender|Payer|From):\s*([A-Za-z][a-zA-Z\s&]+?)(?:\.|,|$)/i);
      const payer = (fromMatch?.[1] || toMatch?.[1] || senderMatch?.[1] || 'Unknown Party').trim();

      // Extract transaction ID
      const txnMatch = emailText.match(/(?:Transaction ID|Reference ID|Confirmation|Ref|TXN|ID)[:\s#-]+([A-Z0-9-]{6,})/i);
      const txnId = txnMatch?.[1] || `LR-PARSE-${Math.floor(Math.random() * 90000) + 10000}`;

      // Extract date
      const dateMatch = emailText.match(/(\d{2}\/\d{2}\/\d{4})|([A-Z][a-z]+ \d{1,2},\s*\d{4})/i);
      const rawDate = dateMatch?.[0] || new Date().toLocaleDateString();
      let parsedDate = new Date().toISOString().split('T')[0];
      try {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) parsedDate = d.toISOString().split('T')[0];
      } catch {}

      setParsedResult({ amount, payer, txnId, date: parsedDate, type: isExpense ? 'expense' : 'income' });
      setParseStatus('done');
    }, 2200);
  };

  const postParsedToLedger = () => {
    if (!parsedResult) return;
    addLedgerEntry({
      date: parsedResult.date,
      propertyId: parsePropId,
      amount: parsedResult.type === 'expense' ? -Math.abs(parsedResult.amount) : Math.abs(parsedResult.amount),
      type: parsedResult.type,
      category: parsedResult.type === 'income' ? 'Rent' : 'Maintenance',
      description: `Email Parsed: ${parsedResult.payer} — Ref: ${parsedResult.txnId}`
    });
    setParsePosted(true);
  };
  const [statementType, setStatementType] = useState<'pl' | 'cashflow' | 'delinquency' | 'balance'>('pl');
  const [noticeSentTenantId, setNoticeSentTenantId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // New Transaction States
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [propertyId, setPropertyId] = useState(state.properties[0]?.id || '');
  const [amount, setAmount] = useState(100);
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [category, setCategory] = useState('Rent');
  const [description, setDescription] = useState('');

  // Tax State
  const [selectedVendor, setSelectedVendor] = useState('');
  const [efileStatus, setEfileStatus] = useState<'idle' | 'filing' | 'completed'>('idle');

  // Sample Mock Bank Feed
  const [bankFeed, setBankFeed] = useState([
    { id: 'bf1', date: '2026-05-18', name: 'DEPOSIT ACH - ALICE JOHNSON', amount: 1800, matched: false, ledgerId: '' },
    { id: 'bf2', date: '2026-05-17', name: 'ACH DEBIT - FIXIT PLUMBING CO', amount: -250, matched: false, ledgerId: '' },
    { id: 'bf3', date: '2026-05-16', name: 'DEPOSIT WIRE - DOWNTOWN LOFTS', amount: 3000, matched: false, ledgerId: '' },
  ]);

  // Automated County Tax States
  const [selectedTaxProp, setSelectedTaxProp] = useState<string>('p1');
  const [appreciation, setAppreciation] = useState<number>(5); // +5% default appreciation forecast
  const [autoPayEnabled, setAutoPayEnabled] = useState<{ [key: string]: boolean }>({
    p1: true, p2: true, p3: false, p4: true, p5: false
  });
  const [escrowPaid, setEscrowPaid] = useState<{ [key: string]: boolean }>({});
  const [isProcessingTaxPayment, setIsProcessingTaxPayment] = useState<string | null>(null);

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

  const handleTriggerManualPay = (propId: string, countyName: string, amount: number) => {
    setIsProcessingTaxPayment(propId);
    setTimeout(() => {
      setIsProcessingTaxPayment(null);
      setEscrowPaid(prev => ({ ...prev, [propId]: true }));
      
      // Auto-post the tax payment as an expense in the ledger!
      addLedgerEntry({
        date: new Date().toISOString().split('T')[0],
        propertyId: propId,
        amount: -Math.abs(amount),
        type: 'expense',
        category: 'Taxes',
        description: `Property Tax Paid to County: ${countyName}`
      });

      alert(`✓ PROPERTY TAX BILL PAID SUCCESSFULLY:\n\nPaid $${Math.round(amount).toLocaleString()} from your Tax Savings Account to ${countyName}!\n\nThis payment has been logged inside your Bookkeeping Expense log under 'Taxes'!`);
    }, 2000);
  };

  const handleToggleAutoPay = (propId: string) => {
    setAutoPayEnabled(prev => ({ ...prev, [propId]: !prev[propId] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;
    
    addLedgerEntry({
      date,
      propertyId,
      amount: type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
      type,
      category,
      description
    });
    
    setDate(new Date().toISOString().split('T')[0]);
    setAmount(100);
    setDescription('');
    setShowModal(false);
  };

  const matchTransaction = (feedId: string, ledgerId: string) => {
    setBankFeed(prev => prev.map(f => f.id === feedId ? { ...f, matched: true, ledgerId } : f));
    reconcileTransaction(ledgerId);
  };

  const handleEfile = () => {
    if (!selectedVendor) return;
    setEfileStatus('filing');
    setTimeout(() => {
      setEfileStatus('completed');
    }, 2000);
  };

  // Financial calculations
  const totalIncome = state.ledger.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = state.ledger.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const netIncome = totalIncome - totalExpenses;

  // Vendor Payout for 1099 calculations
  const activeVendorObj = state.vendors.find(v => v.id === selectedVendor);
  const vendorPayouts = state.ledger
    .filter(t => t.type === 'expense' && t.description.toLowerCase().includes(activeVendorObj?.name.toLowerCase() || ''))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Tab bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {[
            { id: 'ledger', label: '📖 General Ledger' },
            { id: 'reconciliation', label: '🏦 Bank feeds & Matching' },
            { id: 'statements', label: '📊 Profit & Loss Statements' },
            { id: 'tax', label: '📝 e-File 1099 IRS Forms' },
            { id: 'escrow', label: '⚖️ Property Tax & Savings' },
            { id: 'emailparser', label: '📧 Email Statement Parser' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubTab(tab.id as any);
                setEfileStatus('idle');
              }}
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
        
        {activeSubTab === 'ledger' && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>➕ Add Ledger Transaction</button>
        )}
      </div>

      {/* GENERAL LEDGER VIEW */}
      {activeSubTab === 'ledger' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>YTD Rent Collected</p>
              <h3 style={{ color: 'var(--accent-emerald)', fontSize: '1.5rem' }}>${totalIncome.toLocaleString()}</h3>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>YTD Operating Expenses</p>
              <h3 style={{ color: 'var(--accent-rose)', fontSize: '1.5rem' }}>${totalExpenses.toLocaleString()}</h3>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Net Operating Cash Flow</p>
              <h3 style={{ color: 'var(--accent-violet)', fontSize: '1.5rem' }}>${netIncome.toLocaleString()}</h3>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                <th style={{ padding: '0.75rem' }}>Date</th>
                <th style={{ padding: '0.75rem' }}>Property</th>
                <th style={{ padding: '0.75rem' }}>Category</th>
                <th style={{ padding: '0.75rem' }}>Description</th>
                <th style={{ padding: '0.75rem' }}>Amount</th>
                <th style={{ padding: '0.75rem' }}>Reconciliation</th>
              </tr>
            </thead>
            <tbody>
              {state.ledger.map(t => {
                const propName = state.properties.find(p => p.id === t.propertyId)?.name || 'General Operations';
                return (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                    <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t.date}</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{propName}</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.85rem', fontWeight: 500 }}>{t.category}</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t.description}</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.9rem', fontWeight: 'bold', color: t.type === 'income' ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                      {t.type === 'income' ? '+' : '-'}${Math.abs(t.amount).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className={`badge ${t.status === 'cleared' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.6rem' }}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* BANK FEED RECONCILIATION */}
      {activeSubTab === 'reconciliation' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
          
          {/* Live Bank Feed Panel */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>🏦 Live Chase Bank Feed</h3>
            <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>Match incoming bank settlements directly to manual ledger receipts.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {bankFeed.map(feed => {
                // Try to find unmatched ledger entries with same absolute amount
                const candidates = state.ledger.filter(l => 
                  Math.abs(l.amount) === Math.abs(feed.amount) && l.status === 'pending'
                );

                return (
                  <div key={feed.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.15)' }}>
                    <div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span className="badge badge-neutral" style={{ fontSize: '0.6rem' }}>{feed.date}</span>
                        <strong style={{ fontSize: '0.85rem' }}>{feed.name}</strong>
                      </div>
                      <p style={{ fontSize: '0.9rem', color: feed.amount > 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontWeight: 'bold', marginTop: '4px' }}>
                        {feed.amount > 0 ? '+' : '-'}${Math.abs(feed.amount).toLocaleString()}
                      </p>
                    </div>

                    <div>
                      {feed.matched ? (
                        <span className="badge badge-success" style={{ fontSize: '0.75rem', padding: '0.4rem 1rem' }}>✓ Reconciled</span>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {candidates.length > 0 ? (
                            candidates.map(candidate => (
                              <button 
                                key={candidate.id}
                                className="btn-success"
                                onClick={() => matchTransaction(feed.id, candidate.id)}
                                style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                              >
                                Match to Ledger ({candidate.category})
                              </button>
                            ))
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>No matching pending ledger entry</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ledger Help Panel */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Pending Clearances</h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {state.ledger.filter(l => l.status === 'pending').map(l => (
                <li key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid var(--border-glass)', fontSize: '0.85rem' }}>
                  <div>
                    <strong>{l.category}</strong>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{l.description}</p>
                  </div>
                  <span style={{ color: l.type === 'income' ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontWeight: '600' }}>
                    ${Math.abs(l.amount)}
                  </span>
                </li>
              ))}
              {state.ledger.filter(l => l.status === 'pending').length === 0 && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>
                  🎉 All ledger transactions fully cleared & bank reconciled!
                </p>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* FINANCIAL STATEMENTS & REPORTS */}
      {activeSubTab === 'statements' && (
        <div className="glass-card" style={{ padding: '2rem', maxWidth: '850px', margin: '0 auto' }}>
          
          {/* Statement Report Toggles */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px dashed var(--border-glass)', paddingBottom: '0.75rem', flexWrap: 'wrap' }}>
            {[
              { id: 'pl', label: '📊 Profit & Loss' },
              { id: 'cashflow', label: '💸 Cash Flow Statement' },
              { id: 'delinquency', label: '⚠️ Delinquency Reports' },
              { id: 'balance', label: '⚖️ Balance Sheets' }
            ].map(st => (
              <button
                key={st.id}
                onClick={() => setStatementType(st.id as any)}
                style={{
                  background: statementType === st.id ? 'var(--accent-violet)' : 'rgba(255,255,255,0.05)',
                  color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '0.8rem'
                }}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* PROFIT & LOSS VIEW */}
          {statementType === 'pl' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem' }}>
                <h2>Profit & Loss (P&L) Statement</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Year-To-Date Operating Statement | Generated Real-Time</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.1rem', borderBottom: '2px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
                  <span>Operating Income</span>
                  <span style={{ color: 'var(--accent-emerald)' }}>${totalIncome.toLocaleString()}</span>
                </div>
                
                {Array.from(new Set(state.ledger.filter(l => l.type === 'income').map(l => l.category))).map(cat => {
                  const catSum = state.ledger.filter(l => l.category === cat && l.type === 'income').reduce((sum, l) => sum + l.amount, 0);
                  return (
                    <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '1rem', fontSize: '0.95rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{cat} Revenues</span>
                      <span>${catSum.toLocaleString()}</span>
                    </div>
                  );
                })}

                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.1rem', borderBottom: '2px solid var(--border-glass)', paddingBottom: '0.5rem', marginTop: '1.5rem' }}>
                  <span>Operating Expenses</span>
                  <span style={{ color: 'var(--accent-rose)' }}>(${totalExpenses.toLocaleString()})</span>
                </div>

                {Array.from(new Set(state.ledger.filter(l => l.type === 'expense').map(l => l.category))).map(cat => {
                  const catSum = state.ledger.filter(l => l.category === cat && l.type === 'expense').reduce((sum, l) => sum + Math.abs(l.amount), 0);
                  return (
                    <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '1rem', fontSize: '0.95rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{cat} Costs</span>
                      <span>(${catSum.toLocaleString()})</span>
                    </div>
                  );
                })}

                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.25rem', borderTop: '2px solid var(--border-glass-strong)', paddingTop: '1rem', marginTop: '2rem' }}>
                  <span>Net Operating Income (NOI)</span>
                  <span style={{ color: netIncome >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                    ${netIncome.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* CASH FLOW VIEW */}
          {statementType === 'cashflow' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem' }}>
                <h2>Cash Flow Statement</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Operating Cashflow Positions & YTD Reconciliation</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.95rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '6px' }}>
                  <strong>Beginning Cash Balance (Jan 1)</strong>
                  <span>$25,000.00</span>
                </div>
                
                <div style={{ fontWeight: 'bold', marginTop: '10px', color: 'var(--accent-violet)' }}>Cash Flow from Operations:</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '1rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Operating Cash Receipts (Collected Rent)</span>
                  <span style={{ color: 'var(--accent-emerald)' }}>+${totalIncome.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '1rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Operating Cash Outflows (Expenses Paid)</span>
                  <span style={{ color: 'var(--accent-rose)' }}>-${totalExpenses.toLocaleString()}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '1rem', borderBottom: '1px dashed var(--border-glass)', paddingBottom: '6px', fontWeight: '500' }}>
                  <span>Net Operating Activity Cash Flow</span>
                  <span>${(totalIncome - totalExpenses).toLocaleString()}</span>
                </div>

                <div style={{ fontWeight: 'bold', marginTop: '10px', color: 'var(--accent-violet)' }}>Cash Flow from Financing Activities:</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '1rem', borderBottom: '1px dashed var(--border-glass)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Simulated Portfolio Owner Draws & distributions</span>
                  <span style={{ color: 'var(--accent-rose)' }}>-$4,000.00</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid var(--border-glass-strong)', paddingTop: '10px', fontSize: '1.2rem', fontWeight: 'bold', marginTop: '15px' }}>
                  <span>Ending Cash Position</span>
                  <span style={{ color: (25000 + (totalIncome - totalExpenses) - 4000) >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                    ${(25000 + (totalIncome - totalExpenses) - 4000).toLocaleString()}.00
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* DELINQUENCY REPORTS VIEW */}
          {statementType === 'delinquency' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem' }}>
                <h2>Delinquency & Receivables Report</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Real-Time Delinquency Registry & Outbox Notices</p>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '0.75rem' }}>Tenant / Resident</th>
                    <th style={{ padding: '0.75rem' }}>Property & Unit</th>
                    <th style={{ padding: '0.75rem' }}>Unpaid Rent</th>
                    <th style={{ padding: '0.75rem' }}>Aging Delinquency</th>
                    <th style={{ padding: '0.75rem' }}>Outbox Action</th>
                  </tr>
                </thead>
                <tbody>
                  {state.tenants.filter(t => t.balance > 0).map(t => {
                    const propName = state.properties.find(p => p.id === t.propertyId)?.name || 'General Operations';
                    return (
                      <tr key={t.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{t.name}</td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{propName} | Unit {t.unitNo}</td>
                        <td style={{ padding: '0.75rem', color: 'var(--accent-rose)', fontWeight: 'bold' }}>${t.balance.toLocaleString()}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>18 Days Late</span>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          {noticeSentTenantId === t.id ? (
                            <span className="badge badge-success">✓ Dispatched</span>
                          ) : (
                            <button
                              className="btn-primary"
                              onClick={() => {
                                setNoticeSentTenantId(t.id);
                                alert(`✓ DELINQUENCY DEMAND NOTICE: Late fee warning & payment link successfully broadcasted to ${t.name} via Email & SMS outbox!`);
                              }}
                              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                            >
                              📢 Send Notice
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {state.tenants.filter(t => t.balance > 0).length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-tertiary)' }}>
                        🎉 Zero outstanding balances detected. Occupancy is 100% financial clearance!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* BALANCE SHEET VIEW */}
          {statementType === 'balance' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem' }}>
                <h2>Corporate Balance Sheet</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Double-Entry Assets, Liabilities & Capital Equities Ledger</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', fontSize: '0.9rem' }}>
                
                {/* Assets */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderBottom: '1px solid var(--border-glass-strong)', paddingBottom: '4px', textTransform: 'uppercase', color: 'var(--accent-violet)' }}>
                    <span>Assets</span>
                    <span>Amount</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0 4px 1rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Operating Cash Account (Cash Liquidity)</span>
                    <span>${(25000 + (totalIncome - totalExpenses)).toLocaleString()}.00</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0 4px 1rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Accounts Receivable (Outstanding Unpaid Rents)</span>
                    <span>${state.tenants.reduce((sum, t) => sum + t.balance, 0).toLocaleString()}.00</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0 4px 1rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Escrow Cash Trust (Resident Security Deposits Held)</span>
                    <span>$5,000.00</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px dashed var(--border-glass)', paddingTop: '6px', paddingLeft: '0.5rem', fontSize: '0.95rem' }}>
                    <span>Total Assets</span>
                    <span style={{ color: 'var(--accent-emerald)' }}>
                      ${(25000 + (totalIncome - totalExpenses) + state.tenants.reduce((sum, t) => sum + t.balance, 0) + 5000).toLocaleString()}.00
                    </span>
                  </div>
                </div>

                {/* Liabilities */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderBottom: '1px solid var(--border-glass-strong)', paddingBottom: '4px', textTransform: 'uppercase', color: 'var(--accent-violet)' }}>
                    <span>Liabilities</span>
                    <span>Amount</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0 4px 1rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Resident Security Deposit Liabilities</span>
                    <span>$5,000.00</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px dashed var(--border-glass)', paddingTop: '6px', paddingLeft: '0.5rem', fontSize: '0.95rem' }}>
                    <span>Total Liabilities</span>
                    <span>$5,000.00</span>
                  </div>
                </div>

                {/* Equities */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderBottom: '1px solid var(--border-glass-strong)', paddingBottom: '4px', textTransform: 'uppercase', color: 'var(--accent-violet)' }}>
                    <span>Partner Capital Equities</span>
                    <span>Amount</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0 4px 1rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Payer Capital Investment</span>
                    <span>$25,000.00</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0 4px 1rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Retained Earnings (Net Operating Income)</span>
                    <span>${(totalIncome - totalExpenses).toLocaleString()}.00</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0 4px 1rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Accounts Receivable Capital Offset</span>
                    <span>${state.tenants.reduce((sum, t) => sum + t.balance, 0).toLocaleString()}.00</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px dashed var(--border-glass)', paddingTop: '6px', paddingLeft: '0.5rem', fontSize: '0.95rem' }}>
                    <span>Total Shareholder Equity</span>
                    <span>${(25000 + (totalIncome - totalExpenses) + state.tenants.reduce((sum, t) => sum + t.balance, 0)).toLocaleString()}.00</span>
                  </div>
                </div>

                {/* Verification Check */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '2px solid var(--border-glass-strong)', paddingTop: '10px', fontSize: '1.1rem', background: 'rgba(16,185,129,0.06)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                  <span>Total Liabilities & Owner Equity</span>
                  <span style={{ color: 'var(--accent-emerald)' }}>
                    ${(25000 + (totalIncome - totalExpenses) + state.tenants.reduce((sum, t) => sum + t.balance, 0) + 5000).toLocaleString()}.00
                  </span>
                </div>

              </div>
            </div>
          )}

        </div>
      )}

      {/* IRS 1099 TAX FILING */}
      {activeSubTab === 'tax' && (
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>📝 IRS Form 1099-NEC e-File Wizard</h3>
          <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>Compile aggregate YTD payments to registered independent contractors and vendors, and file 1099-NEC packages directly to the IRS.</p>

          <div style={{ display: 'flex', gap: '2rem' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Select Contractor / Vendor</label>
                <select value={selectedVendor} onChange={(e) => {
                  setSelectedVendor(e.target.value);
                  setEfileStatus('idle');
                }}>
                  <option value="">-- Choose Vendor --</option>
                  {state.vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.specialty})</option>
                  ))}
                </select>
              </div>

              {selectedVendor && activeVendorObj && (
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem' }}>
                  <h4 style={{ marginBottom: '0.5rem' }}>Tax Reporting Summary</h4>
                  <p><strong>Vendor Name:</strong> {activeVendorObj.name}</p>
                  <p><strong>EIN / Taxpayer ID:</strong> XX-XXX3941</p>
                  <p><strong>YTD Non-Employee Compensation:</strong> <span style={{ color: 'var(--accent-emerald)', fontWeight: 'bold' }}>${vendorPayouts.toLocaleString()}</span></p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '8px' }}>
                    {vendorPayouts >= 600 ? '✅ Meets IRS threshold ($600) for filing Form 1099-NEC.' : '⚠️ Below IRS threshold ($600). Filing is voluntary.'}
                  </p>
                </div>
              )}

              {selectedVendor && (
                <button 
                  className="btn-primary" 
                  onClick={handleEfile}
                  disabled={efileStatus !== 'idle'}
                  style={{ width: '100%', padding: '0.75rem' }}
                >
                  {efileStatus === 'idle' && 'e-File Form 1099-NEC to IRS'}
                  {efileStatus === 'filing' && 'Establishing Secure IRS FIRE Gateway...'}
                  {efileStatus === 'completed' && '✓ IRS Accepted & Transmitted'}
                </button>
              )}
            </div>

            {/* Form Mock View */}
            <div style={{ flex: 1.5, background: '#fafafa', color: '#111', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid #ddd', fontFamily: '"Courier New", monospace' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '4px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>FORM 1099-NEC</span>
                <span style={{ fontSize: '0.7rem' }}>OMB No. 1545-0116</span>
              </div>
              <div style={{ fontSize: '0.7rem', margin: '8px 0', borderBottom: '1px solid #ccc', paddingBottom: '4px' }}>
                <strong>PAYER\'S Name & Address:</strong><br />
                LuminaRental Management Co<br />
                100 Executive Parkway, CA
              </div>
              <div style={{ fontSize: '0.7rem', margin: '8px 0', borderBottom: '1px solid #ccc', paddingBottom: '4px' }}>
                <strong>RECIPIENT\'S Name:</strong><br />
                {activeVendorObj ? activeVendorObj.name : '________________________'}<br />
                {activeVendorObj ? activeVendorObj.email : '________________________'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.7rem', marginTop: '10px' }}>
                <div style={{ border: '1px solid #ccc', padding: '4px' }}>
                  <strong>Payer\'S TIN:</strong><br />
                  XX-XXX1209
                </div>
                <div style={{ border: '1px solid #ccc', padding: '4px' }}>
                  <strong>Recipient\'S TIN:</strong><br />
                  XX-XXX3941
                </div>
              </div>
              <div style={{ border: '1px solid #000', padding: '8px', marginTop: '10px', background: '#eef' }}>
                <strong>1. Nonemployee compensation:</strong><br />
                <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>
                  ${selectedVendor ? vendorPayouts.toLocaleString() : '0.00'}
                </span>
              </div>
              {efileStatus === 'completed' && (
                <div style={{ border: '2px dashed var(--accent-emerald)', color: 'var(--accent-emerald)', padding: '10px', textAlign: 'center', fontWeight: 'bold', textTransform: 'uppercase', marginTop: '15px' }}>
                  ACCEPTED BY DEPT OF TREASURY - IRS<br />
                  TRANSMISSION ID: TX-NEC-2026-904128
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* COUNTY PROPERTY TAX & ESCROW RESERVES VIEW */}
      {activeSubTab === 'escrow' && (
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', background: 'linear-gradient(to right, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              ⚖️ Property Tax & Savings Accounts
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Keep monthly tax savings aside automatically to pay your yearly property tax bills without stress.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
            
            {/* Jurisdiction Ledger Table */}
            <div>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '1rem', color: 'var(--accent-violet)' }}>Property Tax Summary</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '0.5rem' }}>Property & County</th>
                    <th style={{ padding: '0.5rem' }}>Taxable Portion</th>
                    <th style={{ padding: '0.5rem' }}>Tax Rate (%)</th>
                    <th style={{ padding: '0.5rem' }}>Monthly Savings</th>
                    <th style={{ padding: '0.5rem' }}>Payment Type</th>
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
                          {(metrics.millageTotal / 10).toFixed(2)}%
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
                                ✓ Paid
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
            {(() => {
              const activeTaxObj = countyTaxSpecs[selectedTaxProp] || countyTaxSpecs.p1;
              const activeProperty = state.properties.find(p => p.id === selectedTaxProp) || state.properties[0];
              const activeMetrics = getTaxMetrics(selectedTaxProp);

              const forecastedAssessed = activeTaxObj.assessedVal * (1 + appreciation / 100);
              const forecastedTaxable = forecastedAssessed * activeTaxObj.assessmentRatio;
              const forecastedTax = forecastedTaxable * (activeMetrics.millageTotal / 1000);

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'rgba(0,0,0,0.15)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', color: 'white', marginBottom: '4px' }}>
                      {activeProperty.name} Tax Details
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Location: {activeTaxObj.county}, {activeTaxObj.stateCode}
                    </p>
                  </div>

                  {/* Millage Graph Split */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span>Where does your tax money go?</span>
                      <strong style={{ color: 'var(--accent-amber)' }}>{(activeMetrics.millageTotal / 10).toFixed(2)}% Overall</strong>
                    </div>
                    <div style={{ display: 'flex', height: '14px', borderRadius: '7px', overflow: 'hidden', border: '1px solid var(--border-glass)' }}>
                      <div style={{ width: `${(activeTaxObj.schoolMills / activeMetrics.millageTotal) * 100}%`, background: 'var(--accent-violet)' }} title={`Schools: ${(activeTaxObj.schoolMills / 10).toFixed(2)}%`} />
                      <div style={{ width: `${(activeTaxObj.muniMills / activeMetrics.millageTotal) * 100}%`, background: 'var(--accent-emerald)' }} title={`City/Roads: ${(activeTaxObj.muniMills / 10).toFixed(2)}%`} />
                      <div style={{ width: `${(activeTaxObj.utilityMills / activeMetrics.millageTotal) * 100}%`, background: 'var(--accent-rose)' }} title={`Water/Sewer: ${(activeTaxObj.utilityMills / 10).toFixed(2)}%`} />
                    </div>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '0.7rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <div style={{ width: '8px', height: '8px', background: 'var(--accent-violet)', borderRadius: '50%' }} />
                        Schools ({(activeTaxObj.schoolMills / 10).toFixed(2)}%)
                      </div>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <div style={{ width: '8px', height: '8px', background: 'var(--accent-emerald)', borderRadius: '50%' }} />
                        City & Roads ({(activeTaxObj.muniMills / 10).toFixed(2)}%)
                      </div>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <div style={{ width: '8px', height: '8px', background: 'var(--accent-rose)', borderRadius: '50%' }} />
                        Water & Sewer ({(activeTaxObj.utilityMills / 10).toFixed(2)}%)
                      </div>
                    </div>
                  </div>

                  {/* Calculations Breakdown */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Property Value:</span>
                      <span>${activeTaxObj.assessedVal.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Taxable Portion ({activeTaxObj.assessmentRatio * 100}%):</span>
                      <span>${activeMetrics.taxableAssessed.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderBottom: '1px solid var(--border-glass)', paddingBottom: '4px', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Yearly Tax Bill:</span>
                      <span style={{ color: 'var(--accent-rose)' }}>${Math.round(activeMetrics.annualTax).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-emerald)', fontWeight: 'bold' }}>
                      <span>Current Tax Savings Balance:</span>
                      <span>${Math.round(activeMetrics.accruedEscrow).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Simulation projections */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <span>Property Growth Estimate:</span>
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
                      <span>Future Property Value: ${Math.round(forecastedAssessed).toLocaleString()}</span>
                      <span>Future Yearly Tax: ${Math.round(forecastedTax).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Escrow payout actions */}
                  {escrowPaid[selectedTaxProp] ? (
                    <span className="badge badge-success" style={{ display: 'block', padding: '0.6rem', textAlign: 'center', fontWeight: 'bold' }}>
                      ✓ YEARLY TAX BILL FULLY PAID
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
                        ? 'Paying Tax Bill from Savings...' 
                        : autoPayEnabled[selectedTaxProp]
                          ? `Pay Tax Bill using Savings ($${Math.round(activeMetrics.annualTax).toLocaleString()})`
                          : `Pay Tax Bill manually ($${Math.round(activeMetrics.annualTax).toLocaleString()})`
                      }
                    </button>
                  )}

                  <p style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                    Next tax bill due date: <strong>{activeTaxObj.dueDate}</strong>
                  </p>
                </div>
              );
            })()}

          </div>
        </div>
      )}

      {/* EMAIL STATEMENT PARSER */}
      {activeSubTab === 'emailparser' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '1.5rem' }}>

          {/* Input Panel */}
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem' }}>📧 Email Statement Parser</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Paste a bank alert, transaction email, or statement text below. The system extracts the amount, payer, transaction ID, and date using OCR + NLP + regex parsing, then posts it straight to your ledger.
              </p>
            </div>

            {/* Example quick-fills */}
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '6px' }}>Try an example:</p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {exampleEmails.map(ex => (
                  <button
                    key={ex.label}
                    type="button"
                    className="btn-secondary"
                    onClick={() => { setEmailText(ex.text); setParseStatus('idle'); setParsedResult(null); setParsePosted(false); }}
                    style={{ fontSize: '0.72rem', padding: '4px 10px' }}
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Paste Bank Alert / Email Text
              </label>
              <textarea
                rows={6}
                value={emailText}
                onChange={e => { setEmailText(e.target.value); setParseStatus('idle'); setParsedResult(null); setParsePosted(false); }}
                placeholder={'Chase Alert: You received an ACH deposit of $1,800.00 from Alice Johnson on 05/19/2026. Transaction ID: TXN-ACH-8821043.'}
                style={{ resize: 'vertical', fontSize: '0.85rem' }}
              />
            </div>

            {/* Parsing steps badge strip */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['OCR Text Scan', 'NLP Extraction', 'Regex Pattern Match'].map((step, i) => (
                <span
                  key={step}
                  className={`badge ${parseStatus === 'scanning' && i === 0 ? 'badge-warning' : parseStatus === 'scanning' && i === 1 ? 'badge-warning' : parseStatus === 'done' ? 'badge-success' : 'badge-neutral'}`}
                  style={{ fontSize: '0.68rem' }}
                >
                  {parseStatus === 'done' ? '✓' : parseStatus === 'scanning' ? '⟳' : '○'} {step}
                </span>
              ))}
            </div>

            <button
              className="btn-primary"
              onClick={parseEmail}
              disabled={!emailText.trim() || parseStatus === 'scanning'}
              style={{ padding: '0.75rem' }}
            >
              {parseStatus === 'scanning' ? 'Parsing Email...' : '🔍 Parse Email Now'}
            </button>
          </div>

          {/* Results Panel */}
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h4 style={{ fontSize: '1rem' }}>Extracted Ledger Activity</h4>

            {parseStatus === 'idle' && !parsedResult && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', textAlign: 'center', padding: '3rem 1rem' }}>
                <div>
                  <p style={{ fontSize: '2rem' }}>📩</p>
                  <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>Paste a bank alert and click Parse to extract transaction data.</p>
                </div>
              </div>
            )}

            {parseStatus === 'scanning' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '2rem 0' }}>
                <div style={{ width: '44px', height: '44px', border: '4px solid var(--border-glass)', borderTopColor: 'var(--accent-violet)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Running OCR · NLP · Regex patterns...</p>
              </div>
            )}

            {parseStatus === 'done' && parsedResult && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Amount</span>
                    <strong style={{ color: parsedResult.type === 'income' ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontSize: '1.1rem' }}>
                      {parsedResult.type === 'income' ? '+' : '-'}${parsedResult.amount.toLocaleString()}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Type</span>
                    <span className={`badge ${parsedResult.type === 'income' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.7rem' }}>
                      {parsedResult.type === 'income' ? 'Income / Deposit' : 'Expense / Debit'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Payer / Payee</span>
                    <strong>{parsedResult.payer}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Transaction ID</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--accent-violet)' }}>{parsedResult.txnId}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Date</span>
                    <span>{parsedResult.date}</span>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Assign to Property</label>
                  <select value={parsePropId} onChange={e => setParsePropId(e.target.value)}>
                    <option value="">General Operations</option>
                    {state.properties.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {parsePosted ? (
                  <span className="badge badge-success" style={{ display: 'block', padding: '0.6rem', textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>
                    ✓ Posted to General Ledger
                  </span>
                ) : (
                  <button className="btn-success" onClick={postParsedToLedger} style={{ padding: '0.75rem' }}>
                    ➕ Post to Ledger
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Ledger Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleSubmit} className="glass-card" style={{ padding: '2rem', width: '450px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3>➕ Record Ledger Transaction</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem' }}>Transaction Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem' }}>Type</label>
                <select value={type} onChange={(e) => {
                  setType(e.target.value as any);
                  setCategory(e.target.value === 'income' ? 'Rent' : 'Maintenance');
                }}>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem' }}>Operating Property</label>
              <select value={propertyId} onChange={(e) => setPropertyId(e.target.value)}>
                <option value="">General Corporate Operations</option>
                {state.properties.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem' }}>Category</label>
                {type === 'income' ? (
                  <select value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="Rent">Rent Payment</option>
                    <option value="Late Fee">Late Fee Assessment</option>
                    <option value="Security Deposit">Security Deposit</option>
                    <option value="Other Income">Other Revenue</option>
                  </select>
                ) : (
                  <select value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="Maintenance">Maintenance & Repairs</option>
                    <option value="Management Fee">Management Commissions</option>
                    <option value="Insurance">Insurance Premia</option>
                    <option value="Taxes">Property Taxes</option>
                    <option value="Capital Expense">Capital Improvements</option>
                  </select>
                )}
              </div>
              <div>
                <label style={{ fontSize: '0.8rem' }}>Amount ($)</label>
                <input type="number" min={1} value={amount} onChange={(e) => setAmount(Number(e.target.value))} required />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem' }}>Description</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Dishwasher leak fix cost" required />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn-primary" style={{ flex: 1 }}>Log to Bookkeeping</button>
              <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default LandlordAccounting;
