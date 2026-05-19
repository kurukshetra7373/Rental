import React, { useState } from 'react';
import type { AppState, MaintenanceTicket } from '../../types';

interface MaintenanceProps {
  state: AppState;
  updateTicketStatus: (ticketId: string, status: MaintenanceTicket['status']) => void;
  assignVendor: (ticketId: string, vendorId: string) => void;
  addTicketLog: (ticketId: string, message: string, authorRole: 'landlord' | 'tenant') => void;
  addLedgerEntry: (entry: any) => void;
}

const LandlordMaintenance: React.FC<MaintenanceProps> = ({ state, updateTicketStatus, assignVendor, addTicketLog, addLedgerEntry }) => {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  
  const selectedTicket = state.tickets.find(t => t.id === selectedTicketId);
  const currentPropName = selectedTicket ? state.properties.find(p => p.id === selectedTicket.propertyId)?.name : '';
  const currentTenantName = selectedTicket ? state.tenants.find(t => t.id === selectedTicket.tenantId)?.name : '';
  const currentVendorObj = selectedTicket ? state.vendors.find(v => v.id === selectedTicket.vendorId) : null;

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage || !selectedTicketId) return;
    addTicketLog(selectedTicketId, chatMessage, 'landlord');
    setChatMessage('');
  };

  const handleAssign = (vendorId: string) => {
    if (!selectedTicketId) return;
    assignVendor(selectedTicketId, vendorId);
  };

  const handleStatusChange = (status: MaintenanceTicket['status']) => {
    if (!selectedTicketId) return;
    updateTicketStatus(selectedTicketId, status);
  };

  const handleApproveInvoice = () => {
    if (!selectedTicketId || !selectedTicket) return;
    
    // Add ledger entry
    addLedgerEntry({
      date: new Date().toISOString().split('T')[0],
      propertyId: selectedTicket.propertyId,
      amount: -(selectedTicket.invoiceAmount || 150),
      type: 'expense',
      category: 'Maintenance',
      description: `Vendor Invoice Approved - ${currentVendorObj?.name || 'Vendor'} (Ticket: ${selectedTicket.title})`
    });

    // Mark as completed
    updateTicketStatus(selectedTicketId, 'completed');
    addTicketLog(selectedTicketId, 'Vendor invoice approved and paid. Ticket closed.', 'landlord');
  };

  return (
    <div style={{ display: 'flex', gap: '1.5rem', height: '100%' }}>
      
      {/* Ticket List Panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.8rem', background: 'linear-gradient(to right, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Maintenance Dispatch board
            </h2>
            <p>Assign tasks to contractors, communicate, and authorize repair bills</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {state.tickets.map(t => {
            const prop = state.properties.find(p => p.id === t.propertyId)?.name;
            const hasPendingInvoice = t.status === 'invoiced';

            return (
              <div 
                key={t.id} 
                onClick={() => setSelectedTicketId(t.id)}
                style={{ 
                  padding: '1rem', 
                  border: selectedTicketId === t.id ? '1px solid var(--accent-violet)' : '1px solid var(--border-glass)',
                  borderRadius: 'var(--radius-sm)',
                  background: selectedTicketId === t.id ? 'var(--bg-glass-hover)' : 'rgba(0,0,0,0.15)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span className={`badge ${t.priority === 'emergency' ? 'badge-danger' : t.priority === 'high' ? 'badge-warning' : 'badge-neutral'}`} style={{ fontSize: '0.6rem' }}>
                      {t.priority}
                    </span>
                    <strong style={{ fontSize: '0.95rem' }}>{t.title}</strong>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{prop} | Assigned: {state.vendors.find(v => v.id === t.vendorId)?.name || 'None'}</p>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {hasPendingInvoice && (
                    <span className="badge badge-warning" style={{ fontSize: '0.65rem', animation: 'pulse 1.5s infinite' }}>
                      Invoice Submitted
                    </span>
                  )}
                  <span className={`badge ${t.status === 'completed' ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '0.65rem' }}>
                    {t.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ticket Details & Chat Panel */}
      <div style={{ width: '450px' }} className="glass-card">
        {selectedTicket && selectedTicketId ? (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '500px' }}>
            
            {/* Header info */}
            <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>Ticket #{selectedTicket.id.slice(-5)}</span>
                <span className={`badge ${selectedTicket.priority === 'emergency' ? 'badge-danger' : 'badge-warning'}`}>{selectedTicket.priority}</span>
              </div>
              <h3 style={{ margin: '8px 0 4px 0', fontSize: '1.15rem' }}>{selectedTicket.title}</h3>
              <p style={{ fontSize: '0.85rem' }}>{selectedTicket.description}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '8px' }}>Property: {currentPropName} | Resident: {currentTenantName}</p>
            </div>

            {/* Workflow / Assign Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Assign Independent Contractor</label>
                <select 
                  value={selectedTicket.vendorId || ''} 
                  onChange={(e) => handleAssign(e.target.value)}
                  style={{ marginTop: '4px' }}
                >
                  <option value="">-- Choose Vendor --</option>
                  {state.vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.specialty})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Job Status Code</label>
                <select 
                  value={selectedTicket.status} 
                  onChange={(e) => handleStatusChange(e.target.value as any)}
                  style={{ marginTop: '4px' }}
                >
                  <option value="open">Open / Untriaged</option>
                  <option value="assigned">Assigned</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Vendor Invoice Approval Box */}
            {selectedTicket.status === 'invoiced' && (
              <div style={{ border: '1px solid var(--accent-amber)', background: 'rgba(245, 158, 11, 0.08)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem' }}>
                <h4 style={{ color: 'var(--accent-amber)', fontSize: '0.9rem', marginBottom: '4px' }}>Authorize Contractor Payout</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {currentVendorObj?.name} submitted an invoice for labor & materials.
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  <strong style={{ fontSize: '1.1rem' }}>${selectedTicket.invoiceAmount}</strong>
                  <button className="btn-success" onClick={handleApproveInvoice} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                    Approve & Book Expense
                  </button>
                </div>
              </div>
            )}

            {/* Ticket Logs / Audit History */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '180px' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Activity Logs / Vendor Chat</h4>
              <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', padding: '8px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedTicket.logs.map(log => (
                  <div key={log.id} style={{ display: 'flex', flexDirection: 'column', alignSelf: log.authorRole === 'landlord' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                    <div style={{ 
                      background: log.authorRole === 'landlord' ? 'var(--accent-violet-glow)' : 'rgba(255,255,255,0.06)', 
                      border: log.authorRole === 'landlord' ? '1px solid var(--accent-violet)' : '1px solid var(--border-glass)', 
                      borderRadius: '8px', padding: '6px 10px', fontSize: '0.8rem' 
                    }}>
                      <p>{log.message}</p>
                    </div>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', marginTop: '2px', alignSelf: log.authorRole === 'landlord' ? 'flex-end' : 'flex-start' }}>
                      {log.authorRole === 'landlord' ? 'Landlord' : 'Resident/Vendor'} • {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
                {selectedTicket.logs.length === 0 && (
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', textAlign: 'center', padding: '2rem 0' }}>No messages logged yet.</p>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendChat} style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <input 
                  type="text" 
                  value={chatMessage} 
                  onChange={(e) => setChatMessage(e.target.value)} 
                  placeholder="Send instructions/chat..." 
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }} 
                />
                <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Send</button>
              </form>
            </div>

          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-tertiary)', padding: '2rem', textAlign: 'center' }}>
            <div>
              <p style={{ fontSize: '2rem' }}>🔧</p>
              <h3>No Ticket Selected</h3>
              <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Choose an active repair ticket from the dispatch board to coordinate vendors and review bills.</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default LandlordMaintenance;
