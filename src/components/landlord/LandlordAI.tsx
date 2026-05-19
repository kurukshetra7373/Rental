import React, { useState } from 'react';
import type { AppState } from '../../types';

interface AIProps {
  state: AppState;
  addLedgerEntry: (entry: any) => void;
  assignVendor: (ticketId: string, vendorId: string) => void;
}

const LandlordAI: React.FC<AIProps> = ({ state, addLedgerEntry }) => {
  const [activeAITab, setActiveAITab] = useState<'scan' | 'write' | 'agents'>('scan');

  // WRITE WITH AI STATES
  const [selectedTenant, setSelectedTenant] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('delinquency');
  const [selectedTone, setSelectedTone] = useState('firm');
  const [generatedDraft, setGeneratedDraft] = useState('');
  const [draftLanguage, setDraftLanguage] = useState<'en' | 'es' | 'fr'>('en');
  const [isDrafting, setIsDrafting] = useState(false);

  // INVOICE SCAN STATES
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'done'>('idle');
  const [scanResult, setScanResult] = useState<any>(null);
  const [invoiceLogCompleted, setInvoiceLogCompleted] = useState(false);

  // WORKFLOW AGENT STATES
  const [agentAccounting, setAgentAccounting] = useState(true);
  const [agentOperations, setAgentOperations] = useState(false);

  const sampleBills = [
    { id: 'b1', name: 'FixIt Plumbing Sewer Repair - Unit 102.pdf', amount: 350, vendor: 'FixIt Plumbing', category: 'Maintenance', desc: 'Unclogged main kitchen sewer branch' },
    { id: 'b2', name: 'Volt Electric Panel Overhaul - sunset.pdf', amount: 1250, vendor: 'Volt Electricians', category: 'Capital Expense', desc: 'Upgraded main electrical panel board' },
    { id: 'b3', name: 'Handyman General Drywall Patch - riverfront.pdf', amount: 120, vendor: 'All-Around Handyman', category: 'Maintenance', desc: 'Patched drywall in Unit Townhome 2' }
  ];

  const handleInvoiceScan = (bill: typeof sampleBills[0]) => {
    setScanStatus('scanning');
    setInvoiceLogCompleted(false);
    setScanResult(null);

    setTimeout(() => {
      setScanStatus('done');
      setScanResult({
        vendorName: bill.vendor,
        amount: bill.amount,
        dueDate: '2026-05-30',
        invoiceNo: `INV-2026-0${Math.floor(Math.random() * 9000 + 1000)}`,
        category: bill.category,
        description: bill.desc
      });
    }, 3000);
  };

  const handleLogInvoice = () => {
    if (!scanResult) return;
    
    // Dispatch expense ledger
    addLedgerEntry({
      date: new Date().toISOString().split('T')[0],
      propertyId: state.properties[0]?.id || '', // log to first property for ease
      amount: -Math.abs(scanResult.amount),
      type: 'expense',
      category: scanResult.category,
      description: `Lumina AI OCR Auto-Scan: ${scanResult.vendorName} - ${scanResult.description} (${scanResult.invoiceNo})`
    });

    setInvoiceLogCompleted(true);
    alert('Bill logged successfully! General bookkeeping ledger matched.');
  };

  const handleGenerateDraft = () => {
    if (!selectedTenant) return;
    setIsDrafting(true);
    setGeneratedDraft('');

    const tenantObj = state.tenants.find(t => t.id === selectedTenant);
    if (!tenantObj) return;

    setTimeout(() => {
      setIsDrafting(false);
      let draft = '';

      if (selectedTemplate === 'delinquency') {
        if (selectedTone === 'firm') {
          draft = `[URGENT DEMAND FOR PAYMENT]\n\nDear ${tenantObj.name},\n\nOur records indicate that your balance of $${tenantObj.balance} for Unit ${tenantObj.unitNo} remains seriously overdue.\n\nFailure to clear this outstanding rent within 48 hours will result in automatic late fee application ($150) and the initiation of formal delinquency procedures.\n\nPlease remit payment through your tenant resident portal immediately.\n\nManagement Operations Team`;
        } else {
          draft = `Dear ${tenantObj.name},\n\nWe hope you are having a wonderful week! This is a friendly reminder that your rent balance of $${tenantObj.balance} for Unit ${tenantObj.unitNo} is currently past due.\n\nWe understand life gets busy! Please take a quick moment to log into your portal and settle this balance when convenient. Let us know if you need help.\n\nWarm regards,\nManagement`;
        }
      } else if (selectedTemplate === 'renewal') {
        draft = `Dear ${tenantObj.name},\n\nWe have loved having you as a resident in Unit ${tenantObj.unitNo}!\n\nYour current lease is scheduled to expire on ${tenantObj.leaseEnd}. We would love to offer you a renewal lease starting at $${(tenantObj.rentAmount * 1.05).toFixed(0)}/month (only a standard 5% adjustment).\n\nPlease let us know by return email if you would like us to draft the e-sign documents.\n\nBest wishes,\nManagement`;
      } else {
        draft = `Dear residents of Unit ${tenantObj.unitNo},\n\nPlease be advised that we have scheduled emergency maintenance in your building. \n\nNo manual action is required on your part. Contractors may access common areas between 9:00 AM and 1:00 PM tomorrow. Thank you for your cooperation!\n\nManagement Operations`;
      }

      setDraftLanguage('en');
      setGeneratedDraft(draft);
    }, 2000);
  };

  const handleTranslate = (lang: 'en' | 'es' | 'fr') => {
    if (!generatedDraft) return;
    setIsDrafting(true);
    setDraftLanguage(lang);

    const tenantObj = state.tenants.find(t => t.id === selectedTenant);
    const tenantName = tenantObj?.name || 'Resident';
    const rentVal = tenantObj?.balance || '1800';
    const unitNo = tenantObj?.unitNo || '101';

    setTimeout(() => {
      setIsDrafting(false);
      let translated = '';
      if (lang === 'es') {
        if (selectedTemplate === 'delinquency') {
          translated = `[DEMANDA URGENTE DE PAGO]\n\nEstimado/a ${tenantName},\n\nNuestros registros indican que su saldo de $${rentVal} para la Unidad ${unitNo} sigue gravemente vencido.\n\nSi no liquida este alquiler pendiente dentro de las próximas 48 horas, se aplicará un cargo por mora automático ($150) y se iniciarán los procedimientos formales de morosidad.\n\nPor favor, envíe su pago a través del portal de residentes de inmediato.\n\nEquipo de Operaciones de Administración`;
        } else {
          translated = `Estimado/a ${tenantName},\n\n¡Esperamos que esté teniendo una excelente semana! Este es un recordatorio amistoso de que su saldo de alquiler de $${rentVal} para la Unidad ${unitNo} está vencido.\n\nEntendemos que a veces las cosas se complican. Por favor, inicie sesión en su portal para liquidar este saldo.\n\nAtentamente,\nLa Administración`;
        }
      } else if (lang === 'fr') {
        if (selectedTemplate === 'delinquency') {
          translated = `[DEMANDE DE PAIEMENT URGENTE]\n\nCher/Chère ${tenantName},\n\nNos dossiers indiquent que votre solde de $${rentVal} pour l'Unité ${unitNo} reste gravement en retard.\n\nLe fait de ne pas régler ce loyer impayé dans les 48 heures entraînera l'application automatique de frais de retard ($150) et le lancement des procédures formelles de recouvrement.\n\nVeuillez régler ce montant via votre portail de résident immédiatement.\n\nL'Équipe des Opérations de Gestion`;
        } else {
          translated = `Cher/Chère ${tenantName},\n\nNous espérons que vous passez une excellente semaine! Ceci est un rappel amical que votre solde de loyer de $${rentVal} pour l'Unité ${unitNo} est en retard.\n\nVeuillez vous connecter à votre portail résident pour régulariser la situation.\n\nCordialement,\nLa Direction`;
        }
      } else {
        // revert back to English
        handleGenerateDraft();
        return;
      }
      setGeneratedDraft(translated);
    }, 1500);
  };

  return (
    <div style={{ display: 'flex', gap: '2rem', height: '100%' }}>
      
      {/* Side Navigation */}
      <aside style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {[
          { id: 'scan', label: '🧾 AI Invoice Scan' },
          { id: 'write', label: '✉️ Write with AI' },
          { id: 'agents', label: '🤖 AI Workflow Agents' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveAITab(tab.id as any)}
            style={{
              background: activeAITab === tab.id ? 'var(--bg-glass-hover)' : 'transparent',
              color: activeAITab === tab.id ? 'var(--accent-violet)' : 'var(--text-secondary)',
              border: activeAITab === tab.id ? '1px solid var(--border-glass-strong)' : '1px solid transparent',
              textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.9rem'
            }}
          >
            {tab.label}
          </button>
        ))}
      </aside>

      {/* Main AI Viewport */}
      <div style={{ flex: 1 }}>

        {/* AI BILL SCAN TAB */}
        {activeAITab === 'scan' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>🧾 Lumina OCR Bill & Invoice Extractor</h3>
              <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>Upload independent contractor invoices. Lumina AI instantly parses receipts, matches pricing, and drafts ledger postings.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Click a mock invoice below to simulate an OCR scanning cycle:</p>
                {sampleBills.map(b => (
                  <button 
                    key={b.id} 
                    className="btn-secondary" 
                    onClick={() => handleInvoiceScan(b)}
                    disabled={scanStatus === 'scanning'}
                    style={{ justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.03)', fontSize: '0.85rem' }}
                  >
                    <span>📄 {b.name}</span>
                    <strong style={{ color: 'var(--accent-amber)' }}>${b.amount}</strong>
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {scanStatus === 'idle' && (
                <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-tertiary)' }}>
                  <p style={{ fontSize: '2.5rem' }}>🔍</p>
                  <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>Select an invoice to run Lumina AI OCR parsing.</p>
                </div>
              )}

              {scanStatus === 'scanning' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem 0' }}>
                  <div style={{ 
                    width: '50px', height: '50px', 
                    border: '4px solid var(--border-glass)', 
                    borderTopColor: 'var(--accent-violet)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  <strong>Lumina OCR Scanning Documents...</strong>
                  <div style={{ width: '80%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, transparent, var(--accent-violet), transparent)', animation: 'shimmer 1.5s infinite' }} />
                  </div>
                  <style>{`
                    @keyframes spin { to { transform: rotate(360deg); } }
                    @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
                  `}</style>
                </div>
              )}

              {scanStatus === 'done' && scanResult && (
                <div>
                  <h4 style={{ color: 'var(--accent-emerald)', marginBottom: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '4px' }}>
                    ✓ AI Parsed Fields
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                    <p><strong>Vendor Name:</strong> {scanResult.vendorName}</p>
                    <p><strong>Invoice Number:</strong> {scanResult.invoiceNo}</p>
                    <p><strong>Due Date:</strong> {scanResult.dueDate}</p>
                    <p><strong>Billed Total:</strong> <span style={{ color: 'var(--accent-rose)', fontWeight: 'bold' }}>${scanResult.amount}</span></p>
                    <p><strong>Job Details:</strong> {scanResult.description}</p>
                    <p><strong>Ledger Classification:</strong> <span className="badge badge-neutral">{scanResult.category}</span></p>
                  </div>

                  {!invoiceLogCompleted ? (
                    <button className="btn-primary" onClick={handleLogInvoice} style={{ width: '100%' }}>
                      Approve & Post to Bookkeeping
                    </button>
                  ) : (
                    <span className="badge badge-success" style={{ display: 'block', padding: '0.5rem', textAlign: 'center', fontWeight: 'bold' }}>
                      ✓ POSTED TO GENERAL LEDGER
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* WRITE WITH AI TAB */}
        {activeAITab === 'write' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3>✉️ Smart Communication Drafts</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Draft contextualized resident notices and emails instantly utilizing property records.</p>
              
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Select Recipient</label>
                <select value={selectedTenant} onChange={(e) => setSelectedTenant(e.target.value)}>
                  <option value="">-- Choose Tenant --</option>
                  {state.tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.name} (Unit {t.unitNo})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Notice Template</label>
                  <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)}>
                    <option value="delinquency">Rent Delinquency Alert</option>
                    <option value="renewal">Lease Renewal Offer</option>
                    <option value="inspection">Emergency Inspection Notice</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>AI Tone Voice</label>
                  <select value={selectedTone} onChange={(e) => setSelectedTone(e.target.value)}>
                    <option value="firm">Firm / Delinquency Warning</option>
                    <option value="friendly">Warm & Friendly</option>
                  </select>
                </div>
              </div>

              <button 
                className="btn-primary" 
                onClick={handleGenerateDraft}
                disabled={!selectedTenant || isDrafting}
                style={{ width: '100%', padding: '0.75rem', marginTop: '10px' }}
              >
                Generate Communication Draft
              </button>
            </div>

            {/* Generated Output Preview */}
            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', minHeight: '350px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>LUMINA AI DRAFT PREVIEW</span>
                {generatedDraft && !isDrafting && (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {(['en', 'es', 'fr'] as const).map(lang => (
                      <button 
                        key={lang}
                        onClick={() => handleTranslate(lang)}
                        style={{ 
                          padding: '2px 8px', fontSize: '0.7rem', 
                          background: draftLanguage === lang ? 'var(--accent-violet)' : 'transparent',
                          color: draftLanguage === lang ? 'white' : 'var(--text-secondary)'
                        }}
                      >
                        {lang.toUpperCase()}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isDrafting ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    <div style={{ 
                      width: '40px', height: '40px', margin: '0 auto 10px auto',
                      border: '3px solid var(--border-glass)', borderTopColor: 'var(--accent-violet)',
                      borderRadius: '50%', animation: 'spin 1s linear infinite'
                    }} />
                    <p style={{ fontSize: '0.8rem' }}>AI Agent writing draft...</p>
                  </div>
                ) : generatedDraft ? (
                  <pre style={{ 
                    width: '100%', height: '100%', whiteSpace: 'pre-wrap', 
                    fontFamily: 'inherit', fontSize: '0.85rem', color: 'var(--text-primary)',
                    background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: 'var(--radius-sm)'
                  }}>
                    {generatedDraft}
                  </pre>
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    <p style={{ fontSize: '2rem' }}>✉️</p>
                    <p style={{ fontSize: '0.8rem' }}>Configure variables and click generate to formulate drafts.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* AI WORKFLOW AGENTS TAB */}
        {activeAITab === 'agents' && (
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>🤖 Autonomous AI Workflow Agents</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Instruct operational bots to manage bookkeeping ledgers and resident routing autonomous clearances.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Agent 1 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.15)' }}>
                <div style={{ flex: 1, paddingRight: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>💵</span>
                    <strong style={{ fontSize: '0.95rem' }}>AI Accounting & Reconciliation Agent</strong>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Automatically analyzes bank feeds and clears outstanding Delinquency balances if ACH clearing values match outstanding invoice codes perfectly (Values under $3,000).
                  </p>
                </div>
                <div>
                  <button 
                    onClick={() => setAgentAccounting(!agentAccounting)}
                    className={agentAccounting ? 'btn-success' : 'btn-secondary'}
                    style={{ minWidth: '110px', fontSize: '0.85rem' }}
                  >
                    {agentAccounting ? '● Enabled' : '○ Disabled'}
                  </button>
                </div>
              </div>

              {/* Agent 2 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.15)' }}>
                <div style={{ flex: 1, paddingRight: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>🔧</span>
                    <strong style={{ fontSize: '0.95rem' }}>AI Operations & Maintenance Dispatch Agent</strong>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Monitors resident portal tickets. When tenants file emergency complaints (e.g. plumbing/burst pipes), automatically triggers vendor assignment contracts and matches calendar slots.
                  </p>
                </div>
                <div>
                  <button 
                    onClick={() => setAgentOperations(!agentOperations)}
                    className={agentOperations ? 'btn-success' : 'btn-secondary'}
                    style={{ minWidth: '110px', fontSize: '0.85rem' }}
                  >
                    {agentOperations ? '● Enabled' : '○ Disabled'}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default LandlordAI;
