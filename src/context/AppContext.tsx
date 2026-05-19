import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AppState, Role, Property, Tenant, MaintenanceTicket, LedgerTransaction, TicketLog, Vendor } from '../types';
import { initialMockData } from '../data/mockData';

interface AppContextType {
  state: AppState;
  backendStatus: 'connected' | 'local';
  setRole: (role: Role) => void;
  addProperty: (property: Omit<Property, 'id' | 'occupancyRate' | 'monthlyRevenue'>) => void;
  addTenant: (tenant: Omit<Tenant, 'id' | 'balance' | 'status' | 'autopayStatus'>) => void;
  addTicket: (ticket: Omit<MaintenanceTicket, 'id' | 'createdAt' | 'logs'>) => void;
  updateTicketStatus: (ticketId: string, status: MaintenanceTicket['status']) => void;
  assignVendor: (ticketId: string, vendorId: string) => void;
  addTicketLog: (ticketId: string, message: string, authorRole: Role) => void;
  payRent: (tenantId: string, amount: number) => void;
  toggleAutopay: (tenantId: string) => void;
  addLedgerEntry: (entry: Omit<LedgerTransaction, 'id' | 'status'>) => void;
  reconcileTransaction: (ledgerId: string) => void;
  addNewVendor: (vendor: Omit<Vendor, 'id' | 'activeJobs'>) => void;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('lumina_state');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse local storage state', e);
      }
    }
    return initialMockData;
  });

  const [backendStatus, setBackendStatus] = useState<'connected' | 'local'>('local');

  // Hydrate from live backend on mount
  useEffect(() => {
    const syncWithBackend = async () => {
      try {
        const res = await fetch('/api/state');
        if (res.ok) {
          const data = await res.json();
          setState(data);
          setBackendStatus('connected');
        }
      } catch (e) {
        console.warn('Backend server offline. Running in local fallback mode.');
        setBackendStatus('local');
      }
    };
    syncWithBackend();
  }, []);

  // Sync mutations to backend and backup to localStorage
  const syncState = async (next: AppState) => {
    // 1. Sync to local storage
    localStorage.setItem('lumina_state', JSON.stringify(next));
    // 2. Try syncing to server
    try {
      const res = await fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next)
      });
      if (res.ok) {
        setBackendStatus('connected');
      } else {
        setBackendStatus('local');
      }
    } catch {
      setBackendStatus('local');
    }
  };

  const setRole = (role: Role) => {
    setState((prev) => {
      const next = { ...prev, currentRole: role };
      syncState(next);
      return next;
    });
  };

  const resetAllData = () => {
    setState(() => {
      syncState(initialMockData);
      fetch('/api/reset', { method: 'POST' }).catch(() => {});
      return initialMockData;
    });
  };

  const addProperty = (property: Omit<Property, 'id' | 'occupancyRate' | 'monthlyRevenue'>) => {
    const newProp: Property = {
      ...property,
      id: `p${Date.now()}`,
      occupancyRate: 0,
      monthlyRevenue: 0
    };
    setState((prev) => {
      const next = {
        ...prev,
        properties: [...prev.properties, newProp]
      };
      syncState(next);
      return next;
    });
  };

  const addTenant = (tenant: Omit<Tenant, 'id' | 'balance' | 'status' | 'autopayStatus'>) => {
    const newTenant: Tenant = {
      ...tenant,
      id: `t${Date.now()}`,
      balance: tenant.rentAmount, // starts with first month rent due
      status: 'active',
      autopayStatus: false
    };

    setState((prev) => {
      const prevProperty = prev.properties.find(p => p.id === tenant.propertyId);
      if (!prevProperty) return prev;
      
      const updatedProperties = prev.properties.map(p => {
        if (p.id === tenant.propertyId) {
          const activeTenantsCount = prev.tenants.filter(t => t.propertyId === p.id).length + 1;
          const newRate = Math.round((activeTenantsCount / p.units) * 100);
          const newRevenue = p.monthlyRevenue + tenant.rentAmount;
          return { ...p, occupancyRate: Math.min(100, newRate), monthlyRevenue: newRevenue };
        }
        return p;
      });

      const next = {
        ...prev,
        tenants: [...prev.tenants, newTenant],
        properties: updatedProperties
      };
      syncState(next);
      return next;
    });
  };

  const addTicket = (ticket: Omit<MaintenanceTicket, 'id' | 'createdAt' | 'logs'>) => {
    const newTicket: MaintenanceTicket = {
      ...ticket,
      id: `tk${Date.now()}`,
      createdAt: new Date().toISOString(),
      logs: [{
        id: `l${Date.now()}`,
        timestamp: new Date().toISOString(),
        message: 'Ticket successfully filed by resident.',
        authorId: 'resident',
        authorRole: 'tenant'
      }]
    };
    setState((prev) => {
      const next = { ...prev, tickets: [newTicket, ...prev.tickets] };
      syncState(next);
      return next;
    });
  };

  const updateTicketStatus = (ticketId: string, status: MaintenanceTicket['status']) => {
    setState((prev) => {
      const next = {
        ...prev,
        tickets: prev.tickets.map(t => {
          if (t.id === ticketId) {
            const log: TicketLog = {
              id: `l${Date.now()}`,
              timestamp: new Date().toISOString(),
              message: `Ticket status updated to ${status}.`,
              authorId: 'system',
              authorRole: 'landlord'
            };
            return { ...t, status, logs: [...t.logs, log] };
          }
          return t;
        })
      };
      syncState(next);
      return next;
    });
  };

  const assignVendor = (ticketId: string, vendorId: string) => {
    setState((prev) => {
      const vendorName = prev.vendors.find(v => v.id === vendorId)?.name || 'a vendor';
      
      const newTickets = prev.tickets.map(t => {
        if (t.id === ticketId) {
          const log: TicketLog = {
            id: `l${Date.now()}`,
            timestamp: new Date().toISOString(),
            message: `Assigned vendor: ${vendorName}.`,
            authorId: 'admin',
            authorRole: 'landlord'
          };
          return { ...t, vendorId, status: 'assigned' as const, logs: [...t.logs, log] };
        }
        return t;
      });

      const newVendors = prev.vendors.map(v => 
        v.id === vendorId ? { ...v, activeJobs: v.activeJobs + 1 } : v
      );

      const next = {
        ...prev,
        tickets: newTickets,
        vendors: newVendors
      };
      syncState(next);
      return next;
    });
  };

  const addTicketLog = (ticketId: string, message: string, authorRole: Role) => {
    const newLog: TicketLog = {
      id: `l${Date.now()}`,
      timestamp: new Date().toISOString(),
      message,
      authorId: authorRole === 'landlord' ? 'admin' : 'resident',
      authorRole
    };
    setState((prev) => {
      const next = {
        ...prev,
        tickets: prev.tickets.map(t => 
          t.id === ticketId ? { ...t, logs: [...t.logs, newLog] } : t
        )
      };
      syncState(next);
      return next;
    });
  };

  const payRent = (tenantId: string, amount: number) => {
    setState((prev) => {
      const tenant = prev.tenants.find(t => t.id === tenantId);
      if (!tenant) return prev;
      
      const newTenants = prev.tenants.map(t => 
        t.id === tenantId 
          ? { 
              ...t, 
              balance: Math.max(0, Number((t.balance - amount).toFixed(2))), 
              status: (t.balance - amount) <= 0 ? 'active' as const : t.status 
            } 
          : t
      );

      const newLedgerEntry: LedgerTransaction = {
        id: `tr${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        propertyId: tenant.propertyId,
        amount,
        type: 'income',
        category: 'Rent',
        description: `Rent Payment - ${tenant.name} (Unit ${tenant.unitNo})`,
        status: 'cleared'
      };

      const next = { ...prev, tenants: newTenants, ledger: [newLedgerEntry, ...prev.ledger] };
      syncState(next);
      return next;
    });
  };

  const toggleAutopay = (tenantId: string) => {
    setState((prev) => {
      const next = {
        ...prev,
        tenants: prev.tenants.map(t => t.id === tenantId ? { ...t, autopayStatus: !t.autopayStatus } : t)
      };
      syncState(next);
      return next;
    });
  };

  const addLedgerEntry = (entry: Omit<LedgerTransaction, 'id' | 'status'>) => {
    const newEntry: LedgerTransaction = {
      ...entry,
      id: `tr${Date.now()}`,
      status: 'cleared'
    };
    setState((prev) => {
      const next = { ...prev, ledger: [newEntry, ...prev.ledger] };
      syncState(next);
      return next;
    });
  };

  const reconcileTransaction = (ledgerId: string) => {
    setState((prev) => {
      const next = {
        ...prev,
        ledger: prev.ledger.map(t => t.id === ledgerId ? { ...t, status: 'cleared' as const } : t)
      };
      syncState(next);
      return next;
    });
  };

  const addNewVendor = (vendor: Omit<Vendor, 'id' | 'activeJobs'>) => {
    const newVendor: Vendor = {
      ...vendor,
      id: `v${Date.now()}`,
      activeJobs: 0
    };
    setState((prev) => {
      const next = {
        ...prev,
        vendors: [...prev.vendors, newVendor]
      };
      syncState(next);
      return next;
    });
  };

  return (
    <AppContext.Provider value={{ 
      state, 
      backendStatus,
      setRole, 
      addProperty, 
      addTenant, 
      addTicket, 
      updateTicketStatus, 
      assignVendor,
      addTicketLog,
      payRent, 
      toggleAutopay,
      addLedgerEntry, 
      reconcileTransaction,
      addNewVendor,
      resetAllData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
