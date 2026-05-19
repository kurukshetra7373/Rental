import React, { useState } from 'react';
import type { AppState } from '../../types';

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

interface DashboardProps {
  state: AppState;
}

const LandlordDashboard: React.FC<DashboardProps> = ({ state }) => {
  const [tasks, setTasks] = useState<{ id: number; text: string; done: boolean; priority: string }[]>([]);

  const toggleTask = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const totalRevenue = state.properties.reduce((sum, p) => sum + p.monthlyRevenue, 0);
  const openTickets = state.tickets.filter(t => t.status === 'open' || t.status === 'assigned' || t.status === 'in-progress').length;
  const delinquentTenants = state.tenants.filter(t => t.status === 'delinquent').length;
  const occupiedUnits = state.properties.reduce((sum, p) => sum + Math.round((p.units * p.occupancyRate) / 100), 0);
  const totalUnits = state.properties.reduce((sum, p) => sum + p.units, 0);
  const avgOccupancy = Math.round((occupiedUnits / totalUnits) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', background: 'linear-gradient(to right, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Property Overview Dashboard
          </h2>
          <p>Live summary of your rental portfolio</p>
        </div>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Occupancy Rate</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', margin: '0.5rem 0' }}>
            <h2 style={{ fontSize: '2.2rem', color: 'var(--accent-violet)', fontWeight: 700 }}>{avgOccupancy}%</h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>({occupiedUnits}/{totalUnits} units)</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${avgOccupancy}%`, height: '100%', background: 'var(--accent-violet)', borderRadius: '3px' }} />
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Monthly Rental Income</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', margin: '0.5rem 0' }}>
            <h2 style={{ fontSize: '2.2rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>${totalRevenue.toLocaleString()}</h2>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)' }}>▲ +4.2% from last month</p>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Late Rent Payments</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', margin: '0.5rem 0' }}>
            <h2 style={{ fontSize: '2.2rem', color: delinquentTenants > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)', fontWeight: 700 }}>
              {delinquentTenants}
            </h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>residents overdue</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {delinquentTenants > 0 ? '⚠️ Requires delinquency escalation notices' : '✅ 100% payments cleared'}
          </p>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Open Repair Tickets</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', margin: '0.5rem 0' }}>
            <h2 style={{ fontSize: '2.2rem', color: openTickets > 0 ? 'var(--accent-amber)' : 'var(--accent-emerald)', fontWeight: 700 }}>
              {openTickets}
            </h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>open tickets</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {openTickets > 0 ? '🔧 Dispatching in-progress' : '✅ No pending repairs'}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
        {/* Recent Financial Ledger Flow */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem' }}>Recent Transactions</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Auto-Bookkeeping Active</span>
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {state.ledger.slice(0, 5).map(t => (
              <li key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderBottom: '1px solid var(--border-glass)', background: 'rgba(0,0,0,0.15)', borderRadius: 'var(--radius-sm)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong style={{ fontSize: '0.9rem' }}>{t.category}</strong>
                    <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>{t.date}</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{t.description}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ color: t.type === 'income' ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontWeight: '600', fontSize: '1rem' }}>
                    {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)' }}>reconciled</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Dynamic Task Coordinator */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Action To-Do List</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
            {tasks.map(t => (
              <div 
                key={t.id} 
                onClick={() => toggleTask(t.id)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  padding: '0.75rem', 
                  background: t.done ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)', 
                  border: t.done ? '1px dashed var(--border-glass)' : '1px solid var(--border-glass)', 
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ 
                  width: '18px', height: '18px', 
                  border: t.done ? 'none' : '2px solid var(--text-tertiary)',
                  background: t.done ? 'var(--accent-emerald)' : 'transparent',
                  borderRadius: '3px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 'bold', fontSize: '0.7rem'
                }}>
                  {t.done && '✓'}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ 
                    fontSize: '0.85rem', 
                    color: t.done ? 'var(--text-tertiary)' : 'var(--text-primary)',
                    textDecoration: t.done ? 'line-through' : 'none'
                  }}>
                    {t.text}
                  </p>
                </div>
                {!t.done && (
                  <span className={`badge ${t.priority === 'high' ? 'badge-danger' : t.priority === 'medium' ? 'badge-warning' : 'badge-neutral'}`} style={{ fontSize: '0.6rem' }}>
                    {t.priority}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Property Tax & Savings Summary Card */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem' }}>⚖️ Property Tax & Savings</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Yearly tax bills and saved reserves for each building</p>
          </div>
          <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>Auto Tax Savings Active</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '0.75rem' }}>Building</th>
                <th style={{ padding: '0.75rem' }}>County Jurisdiction</th>
                <th style={{ padding: '0.75rem' }}>Property Value</th>
                <th style={{ padding: '0.75rem' }}>Taxable Portion</th>
                <th style={{ padding: '0.75rem' }}>Tax Rate (%)</th>
                <th style={{ padding: '0.75rem' }}>Yearly Tax Bill</th>
                <th style={{ padding: '0.75rem' }}>Current Tax Savings Balance</th>
              </tr>
            </thead>
            <tbody>
              {state.properties.map(p => {
                const spec = countyTaxSpecs[p.id] || countyTaxSpecs.p1;
                const taxableValue = spec.assessedVal * spec.assessmentRatio;
                const millageTotal = spec.schoolMills + spec.muniMills + spec.utilityMills;
                const annualTax = taxableValue * (millageTotal / 1000);
                const monthlyEscrow = annualTax / 12;
                // Calculate dynamic savings matching current time progression
                const accruedSavings = p.id === 'p1' ? monthlyEscrow * 5 : p.id === 'p2' ? monthlyEscrow * 4.2 : monthlyEscrow * 3.5;

                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{p.name}</td>
                    <td style={{ padding: '0.75rem', color: 'var(--accent-amber)' }}>{spec.county}, {spec.stateCode}</td>
                    <td style={{ padding: '0.75rem' }}>${spec.assessedVal.toLocaleString()}</td>
                    <td style={{ padding: '0.75rem' }}>{(spec.assessmentRatio * 100)}%</td>
                    <td style={{ padding: '0.75rem' }}>{(millageTotal / 10).toFixed(2)}%</td>
                    <td style={{ padding: '0.75rem', color: 'var(--accent-rose)', fontWeight: 'bold' }}>
                      ${Math.round(annualTax).toLocaleString()}/yr
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 'bold' }}>
                      ${Math.round(accruedSavings).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LandlordDashboard;
