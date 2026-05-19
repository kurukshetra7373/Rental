import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import LandlordDashboard from './landlord/LandlordDashboard';
import LandlordProperties from './landlord/LandlordProperties';
import LandlordAccounting from './landlord/LandlordAccounting';
import LandlordMaintenance from './landlord/LandlordMaintenance';
import LandlordAI from './landlord/LandlordAI';
import LandlordAutomation from './landlord/LandlordAutomation';

const LandlordView: React.FC = () => {
  const { 
    state, 
    addProperty, 
    addTenant, 
    updateTicketStatus, 
    assignVendor, 
    addTicketLog, 
    addLedgerEntry, 
    reconcileTransaction 
  } = useApp();
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'properties' | 'accounting' | 'maintenance' | 'ai' | 'automation'>('dashboard');

  return (
    <div className="landlord-layout">
      {/* Side Navigation */}
      <aside className="landlord-aside">
        {[
          { id: 'dashboard', label: '📊 Overview Dashboard' },
          { id: 'properties', label: '🏢 Properties & Residents' },
          { id: 'accounting', label: '💰 Accounting & Finances' },
          { id: 'maintenance', label: '🔧 Repairs & Maintenance' },
          { id: 'ai', label: '✨ AI Assistant' },
          { id: 'automation', label: '⚙️ Automation & Settings' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              background: activeTab === tab.id ? 'var(--bg-glass-hover)' : 'transparent',
              color: activeTab === tab.id ? 'var(--accent-violet)' : 'var(--text-secondary)',
              border: activeTab === tab.id ? '1px solid var(--border-glass-strong)' : '1px solid transparent',
              textAlign: 'left',
              padding: '0.9rem 1.2rem',
              justifyContent: 'flex-start',
              fontSize: '0.95rem',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            {tab.label}
          </button>
        ))}
      </aside>

      {/* Tab Panels */}
      <div style={{ flex: 1 }}>
        {activeTab === 'dashboard' && <LandlordDashboard state={state} />}
        
        {activeTab === 'properties' && (
          <LandlordProperties 
            state={state} 
            addProperty={addProperty} 
            addTenant={addTenant} 
          />
        )}
        
        {activeTab === 'accounting' && (
          <LandlordAccounting 
            state={state} 
            addLedgerEntry={addLedgerEntry} 
            reconcileTransaction={reconcileTransaction} 
          />
        )}
        
        {activeTab === 'maintenance' && (
          <LandlordMaintenance 
            state={state} 
            updateTicketStatus={updateTicketStatus} 
            assignVendor={assignVendor} 
            addTicketLog={addTicketLog} 
            addLedgerEntry={addLedgerEntry} 
          />
        )}
        
        {activeTab === 'ai' && (
          <LandlordAI 
            state={state} 
            addLedgerEntry={addLedgerEntry} 
            assignVendor={assignVendor} 
          />
        )}

        {activeTab === 'automation' && (
          <LandlordAutomation 
            state={state} 
            addLedgerEntry={addLedgerEntry} 
          />
        )}
      </div>
    </div>
  );
};

export default LandlordView;
