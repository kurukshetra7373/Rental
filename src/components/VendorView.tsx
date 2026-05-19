import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { MaintenanceTicket } from '../types';

const VendorView: React.FC = () => {
  const { state, updateTicketStatus, addTicketLog } = useApp();
  
  // Simulate logging in as the first vendor
  const vendor = state.vendors[0];

  const assignedTickets = state.tickets.filter(t => t.vendorId === vendor.id);

  // Modals / Overlays
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState(150);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  if (!vendor) return <div style={{ color: 'var(--text-tertiary)' }}>No vendor profile found. Please register a vendor.</div>;

  const selectedTicket = state.tickets.find(t => t.id === selectedTicketId);
  const currentPropName = selectedTicket ? state.properties.find(p => p.id === selectedTicket.propertyId)?.name : '';

  const handleStatusUpdate = (ticketId: string, status: MaintenanceTicket['status']) => {
    updateTicketStatus(ticketId, status);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage || !selectedTicketId) return;
    addTicketLog(selectedTicketId, chatMessage, 'vendor');
    setChatMessage('');
  };

  const handleInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId || !selectedTicket) return;
    
    // In a real app we'd update the ticket with the invoice amount and status
    // For this simulation, we update status and log it.
    
    // Mutating context safely would require an updateTicketInvoice method.
    // For the mockup, we will just use updateTicketStatus to 'invoiced'.
    updateTicketStatus(selectedTicketId, 'invoiced');
    addTicketLog(selectedTicketId, `Invoice submitted for $${invoiceAmount}. Awaiting landlord approval.`, 'vendor');
    
    setShowInvoiceModal(false);
    setSelectedTicketId(null); // close detail view
    alert(`✓ Invoice for $${invoiceAmount} submitted to property management!`);
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', background: 'linear-gradient(to right, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Contractor Portal
          </h2>
          <p>Welcome back, {vendor.name} ({vendor.specialty})</p>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Active Work Orders</p>
          <h2 style={{ fontSize: '2.5rem', color: 'var(--accent-violet)' }}>{assignedTickets.length}</h2>
        </div>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Pending Invoices</p>
          <h2 style={{ fontSize: '2.5rem', color: 'var(--accent-amber)' }}>
            {assignedTickets.filter(t => t.status === 'invoiced').length}
          </h2>
        </div>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Payments Cleared (YTD)</p>
          <h2 style={{ fontSize: '2.5rem', color: 'var(--accent-emerald)' }}>$1,250</h2>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'flex-start' }}>
        
        {/* Work Order List */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>My Dispatch Queue</h3>
          {assignedTickets.length === 0 && (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>No active work orders at the moment.</p>
          )}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {assignedTickets.map(t => (
              <div 
                key={t.id} 
                onClick={() => setSelectedTicketId(t.id)}
                style={{ 
                  padding: '1rem', 
                  border: selectedTicketId === t.id ? '1px solid var(--accent-violet)' : '1px solid var(--border-glass)',
                  background: selectedTicketId === t.id ? 'var(--bg-glass-hover)' : 'rgba(0,0,0,0.15)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}
              >
                <div>
                  <h4 style={{ marginBottom: '4px' }}>{t.title}</h4>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span className={`badge ${t.priority === 'emergency' ? 'badge-danger' : 'badge-neutral'}`} style={{ fontSize: '0.6rem' }}>
                      {t.priority}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Status: {t.status}</span>
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '1.2rem' }}>➔</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Ticket Details */}
        <div className="glass-card" style={{ padding: '1.5rem', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
          {selectedTicket ? (
            <>
              <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{selectedTicket.title}</h3>
                <p style={{ fontSize: '0.85rem' }}>{selectedTicket.description}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '8px' }}>Property: {currentPropName}</p>
              </div>

              {/* Status Update Actions */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {selectedTicket.status === 'assigned' && (
                  <button className="btn-secondary" onClick={() => handleStatusUpdate(selectedTicket.id, 'in-progress')}>
                    Acknowledge & Start Work
                  </button>
                )}
                {selectedTicket.status === 'in-progress' && (
                  <button className="btn-success" onClick={() => setShowInvoiceModal(true)}>
                    Mark Job Complete & Invoice
                  </button>
                )}
                {selectedTicket.status === 'invoiced' && (
                  <span className="badge badge-warning" style={{ padding: '0.5rem', width: '100%', textAlign: 'center' }}>
                    Awaiting Landlord Invoice Approval
                  </span>
                )}
                {selectedTicket.status === 'completed' && (
                  <span className="badge badge-success" style={{ padding: '0.5rem', width: '100%', textAlign: 'center' }}>
                    ✓ Invoice Paid & Closed
                  </span>
                )}
              </div>

              {/* Communication Thread */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Communication Log</h4>
                <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', padding: '8px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '200px' }}>
                  {selectedTicket.logs.map(log => (
                    <div key={log.id} style={{ display: 'flex', flexDirection: 'column', alignSelf: log.authorRole === 'vendor' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                      <div style={{ 
                        background: log.authorRole === 'vendor' ? 'var(--accent-violet-glow)' : 'rgba(255,255,255,0.06)', 
                        border: log.authorRole === 'vendor' ? '1px solid var(--accent-violet)' : '1px solid var(--border-glass)', 
                        borderRadius: '8px', padding: '6px 10px', fontSize: '0.8rem' 
                      }}>
                        <p>{log.message}</p>
                      </div>
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', marginTop: '2px', alignSelf: log.authorRole === 'vendor' ? 'flex-end' : 'flex-start' }}>
                        {log.authorRole === 'vendor' ? 'Me' : 'Landlord'} • {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Chat Input */}
                <form onSubmit={handleSendChat} style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <input 
                    type="text" 
                    value={chatMessage} 
                    onChange={(e) => setChatMessage(e.target.value)} 
                    placeholder="Message management..." 
                    style={{ padding: '0.5rem', fontSize: '0.85rem' }} 
                  />
                  <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Send</button>
                </form>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-tertiary)', textAlign: 'center' }}>
              <div>
                <p style={{ fontSize: '2.5rem' }}>📋</p>
                <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>Select a work order from your queue to view details and update status.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* INVOICE SUBMISSION MODAL */}
      {showInvoiceModal && selectedTicket && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleInvoiceSubmit} className="glass-card" style={{ padding: '2rem', width: '450px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3>🧾 Submit Service Invoice</h3>
            
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Work Order: {selectedTicket.title}
            </p>

            <div>
              <label style={{ fontSize: '0.8rem' }}>Total Labor & Materials Cost ($)</label>
              <input 
                type="number" 
                min={1} 
                value={invoiceAmount} 
                onChange={(e) => setInvoiceAmount(Number(e.target.value))} 
                required 
                style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-violet)' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem' }}>Upload Receipts / Images</label>
              <div style={{ border: '2px dashed var(--border-glass)', borderRadius: 'var(--radius-sm)', padding: '1rem', textAlign: 'center', background: 'rgba(0,0,0,0.1)' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Drag & drop files here, or browse.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn-primary" style={{ flex: 1 }}>Submit Invoice</button>
              <button type="button" className="btn-secondary" onClick={() => setShowInvoiceModal(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default VendorView;
