import React, { useState } from 'react';
import type { AppState } from '../../types';
import { useApp } from '../../context/AppContext';

interface AutomationProps {
  state: AppState;
  addLedgerEntry: (entry: any) => void;
}

const LandlordAutomation: React.FC<AutomationProps> = ({ state, addLedgerEntry }) => {
  const { resetAllData } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'rules' | 'api' | 'plans'>('rules');
  
  // Late Fee States
  const [gracePeriod, setGracePeriod] = useState(5);
  const [lateFeeAmount, setLateFeeAmount] = useState(150);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationLogs, setEvaluationLogs] = useState<string[]>([]);

  // API Credentials States
  const [apiKey, setApiKey] = useState('');
  const [webhooksActive, setWebhooksActive] = useState(true);
  const [apiConsoleLogs, setApiConsoleLogs] = useState<string[]>([
    'Initializing webhook sandbox gateway...',
    'Webhook listener bound to: https://api.luminarental.com/v1/webhook'
  ]);

  const triggerLateFeeRun = () => {
    setIsEvaluating(true);
    setEvaluationLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Initiating automated late fee audit...`]);

    setTimeout(() => {
      // Find delinquent tenants
      const delinquents = state.tenants.filter(t => t.status === 'delinquent' || t.balance > 0);
      
      if (delinquents.length === 0) {
        setEvaluationLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Check completed: 0 accounts found with outstanding past-due balances.`]);
      } else {
        delinquents.forEach(tenant => {
          // Log late fee expense
          addLedgerEntry({
            date: new Date().toISOString().split('T')[0],
            propertyId: tenant.propertyId,
            amount: lateFeeAmount,
            type: 'income',
            category: 'Late Fee',
            description: `Automated Late Fee Rule Triggered: grace period exceeded (Unit ${tenant.unitNo})`
          });
          
          setEvaluationLogs(prev => [
            ...prev,
            `[${new Date().toLocaleTimeString()}] ✅ Applied $${lateFeeAmount} late fee to resident account: ${tenant.name} (Unit ${tenant.unitNo})`,
            `[${new Date().toLocaleTimeString()}] 📧 Dispatched warning notice to: ${tenant.email}`
          ]);

          // Append webhook event trigger if webhooks are active
          if (webhooksActive) {
            setApiConsoleLogs(prevLogs => [
              `[${new Date().toLocaleTimeString()}] Webhook fired event: "late_fee.assessed"`,
              JSON.stringify({
                event: 'late_fee.assessed',
                timestamp: new Date().toISOString(),
                payload: {
                  tenant_id: tenant.id,
                  tenant_name: tenant.name,
                  fee_amount: lateFeeAmount,
                  unit: tenant.unitNo
                }
              }, null, 2),
              ...prevLogs
            ]);
          }
        });
      }
      setIsEvaluating(false);
    }, 2000);
  };

  const generateApiKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = 'lr_live_';
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setApiKey(key);
    setApiConsoleLogs(prev => [
      `[${new Date().toLocaleTimeString()}] Generated new client API access key credentials: ${key.slice(0,12)}...`,
      ...prev
    ]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Sub tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem', gap: '1rem' }}>
        {[
          { id: 'rules', label: '⚡ Late Fee & Workflows Rules' },
          { id: 'api', label: '🔌 Open API & Webhook Sandbox' },
          { id: 'plans', label: '📦 Subscription Setup Tiers' }
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

      {/* RULES ENGINE TAB */}
      {activeSubTab === 'rules' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1.5rem' }}>
          
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3>⚡ Late Fee Rules Engine</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Automate delinquency fee escalations. LuminaRental evaluates grace periods and charges delinquent cards automatically.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem' }}>Grace Period (Days)</label>
                <input 
                  type="number" 
                  min={1} max={15} 
                  value={gracePeriod} 
                  onChange={(e) => setGracePeriod(Number(e.target.value))} 
                  required 
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem' }}>Late Fee Amount ($)</label>
                <input 
                  type="number" 
                  min={1} 
                  value={lateFeeAmount} 
                  onChange={(e) => setLateFeeAmount(Number(e.target.value))} 
                  required 
                />
              </div>
            </div>

            <button 
              className="btn-primary" 
              onClick={triggerLateFeeRun}
              disabled={isEvaluating}
              style={{ padding: '0.75rem', marginTop: '10px' }}
            >
              {isEvaluating ? 'Evaluating Cron Triggers...' : 'Execute Late Fee Check Now'}
            </button>

            {/* Danger Zone */}
            <div style={{ marginTop: '2rem', borderTop: '1px dashed var(--accent-rose)', paddingTop: '1.5rem' }}>
              <h4 style={{ color: 'var(--accent-rose)', fontSize: '0.9rem', marginBottom: '8px' }}>⚠️ Danger Zone</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                Reset all persistent local storage variables to original factory demo data (restoring delinquent, cleared, and unmatched ledger feeds).
              </p>
              <button 
                type="button"
                className="btn-secondary" 
                onClick={() => {
                  if (confirm('Are you sure you want to reset all mock databases to default? This will clear all transactions, new tenants, and active Zillow syndication logs!')) {
                    resetAllData();
                    alert('✓ Demo Database successfully reset to factory defaults.');
                  }
                }}
                style={{ width: '100%', borderColor: 'var(--accent-rose)', color: 'var(--accent-rose)', padding: '0.5rem' }}
              >
                Reset Database to Factory Defaults
              </button>
            </div>
          </div>

          {/* Running logs console */}
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>System Automation Terminal Feed</h4>
            <div style={{ flex: 1, background: '#070a13', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', fontFamily: '"Courier New", monospace', fontSize: '0.8rem', color: '#4ade80' }}>
              {evaluationLogs.map((log, index) => (
                <div key={index}>{log}</div>
              ))}
              {evaluationLogs.length === 0 && (
                <span style={{ color: 'var(--text-tertiary)' }}>No execution logs generated yet. Click "Execute" to start automated rules.</span>
              )}
            </div>
          </div>

        </div>
      )}

      {/* OPEN API SANDBOX */}
      {activeSubTab === 'api' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1.5rem' }}>
          
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3>🔌 Open API Sandbox Sandbox</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Connect external systems like STAN AI, QuickBooks, custom webhooks, or Zapier flows.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.8rem' }}>Secret API Key Credentials</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  readOnly 
                  value={apiKey || 'Generate your production credentials...'} 
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-glass)', fontSize: '0.85rem', color: apiKey ? 'white' : 'var(--text-tertiary)' }}
                />
                <button className="btn-secondary" onClick={generateApiKey} style={{ padding: '0.5rem 1rem' }}>Generate</button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)', marginTop: '10px' }}>
              <div>
                <strong>Active Webhook Callbacks</strong>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Auto-fire events on payment settlement</p>
              </div>
              <button 
                onClick={() => setWebhooksActive(!webhooksActive)}
                className={webhooksActive ? 'btn-success' : 'btn-secondary'}
                style={{ fontSize: '0.8rem' }}
              >
                {webhooksActive ? '● Webhook Active' : '○ Webhook Disabled'}
              </button>
            </div>
          </div>

          {/* Webhook JSON Terminal */}
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>JSON Webhook Event Monitor</h4>
            <pre style={{ flex: 1, background: '#070a13', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', fontFamily: '"Courier New", monospace', fontSize: '0.75rem', color: '#93c5fd', whiteSpace: 'pre-wrap' }}>
              {apiConsoleLogs.map((log, index) => (
                <div key={index} style={{ borderBottom: log.startsWith('{') ? '1px dashed rgba(255,255,255,0.1)' : 'none', paddingBottom: log.startsWith('{') ? '8px' : '0' }}>{log}</div>
              ))}
            </pre>
          </div>

        </div>
      )}

      {/* PLAN TIERS MATRICES */}
      {activeSubTab === 'plans' && (
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>📦 Unlocked LuminaRental Stack & Licensing Setup</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            
            {/* Essential */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', padding: '1.5rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
                <h4 style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Essential Plan</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Best for simple rent clearing</p>
              </div>
              <ul style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--text-secondary)' }}>
                <li>✓ Online Rent Clearing</li>
                <li>✓ General Ledger</li>
                <li>✓ Standard Tenant Screening</li>
                <li>✓ Basic Maintenance Boards</li>
              </ul>
            </div>

            {/* Growth */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass-strong)', padding: '1.5rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
                <h4 style={{ fontSize: '1.2rem', color: 'var(--accent-emerald)' }}>Growth Plan</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Best for expanding portfolios</p>
              </div>
              <ul style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--text-secondary)' }}>
                <li>✓ Growth e-Signatures</li>
                <li>✓ Advanced Screenings Audit</li>
                <li>✓ Custom Late fee Schedules</li>
                <li>✓ Owner & Vendor Portals</li>
              </ul>
            </div>

            {/* Premium */}
            <div style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid var(--accent-violet)', padding: '1.5rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 0 15px var(--accent-violet-glow)' }}>
              <div style={{ borderBottom: '1px solid var(--accent-violet)', paddingBottom: '0.5rem' }}>
                <h4 style={{ fontSize: '1.2rem', color: 'var(--accent-violet)' }}>Premium Plan</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Best for maximum hands-off operations</p>
              </div>
              <ul style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--text-primary)' }}>
                <li>✓ Lumina AI OCR Bill Scans</li>
                <li>✓ AI Tone Translations email</li>
                <li>✓ Open API keys Sandbox</li>
                <li>✓ Autonomous Bookkeeper bots</li>
              </ul>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default LandlordAutomation;
