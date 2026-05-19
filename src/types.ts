export type Role = 'landlord' | 'tenant' | 'vendor' | 'owner';

export interface Property {
  id: string;
  name: string;
  address: string;
  units: number;
  occupancyRate: number;
  image?: string;
  monthlyRevenue: number;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyId: string;
  unitNo: string;
  rentAmount: number;
  balance: number;
  autopayStatus: boolean;
  leaseStart: string;
  leaseEnd: string;
  status: 'active' | 'delinquent' | 'notice';
}

export interface MaintenanceTicket {
  id: string;
  title: string;
  description: string;
  propertyId: string;
  tenantId: string;
  vendorId?: string;
  status: 'open' | 'assigned' | 'in-progress' | 'completed' | 'invoiced';
  priority: 'low' | 'medium' | 'high' | 'emergency';
  createdAt: string;
  logs: TicketLog[];
  invoiceAmount?: number;
  invoiceUrl?: string;
}

export interface TicketLog {
  id: string;
  timestamp: string;
  message: string;
  authorId: string;
  authorRole: Role;
}

export interface Vendor {
  id: string;
  name: string;
  specialty: string;
  email: string;
  phone: string;
  activeJobs: number;
}

export interface LedgerTransaction {
  id: string;
  date: string;
  propertyId?: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  status: 'cleared' | 'pending';
}

export interface Owner {
  id: string;
  name: string;
  sharePercent: number;
  totalDraws: number;
}

// App State Interface
export interface AppState {
  currentRole: Role;
  properties: Property[];
  tenants: Tenant[];
  tickets: MaintenanceTicket[];
  vendors: Vendor[];
  ledger: LedgerTransaction[];
  owners: Owner[];
}
