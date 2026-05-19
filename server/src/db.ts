import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose, { Schema } from 'mongoose';
import dotenv from 'dotenv';
import type { AppState } from './types.js';

// Load environmental variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Local DB settings
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const defaultMockData: AppState = {
  currentRole: 'landlord',
  properties: [
    { id: 'p1', name: 'Sunset Apartments', address: '123 Sunset Blvd, CA', units: 24, occupancyRate: 95, monthlyRevenue: 45000 },
    { id: 'p2', name: 'Oakwood Residences', address: '456 Oak St, TX', units: 12, occupancyRate: 100, monthlyRevenue: 18000 },
    { id: 'p3', name: 'Downtown Lofts', address: '789 Main St, NY', units: 8, occupancyRate: 87, monthlyRevenue: 24000 },
    { id: 'p4', name: 'Riverfront Townhomes', address: '101 River Rd, IL', units: 5, occupancyRate: 80, monthlyRevenue: 12500 },
    { id: 'p5', name: 'Palm View Estates', address: '202 Palm Ave, FL', units: 15, occupancyRate: 93, monthlyRevenue: 30000 },
  ],
  tenants: [
    { id: 't1', name: 'Alice Johnson', email: 'alice.j@example.com', phone: '(555) 123-4567', propertyId: 'p1', unitNo: '101', rentAmount: 1800, balance: 0, autopayStatus: true, leaseStart: '2025-01-01', leaseEnd: '2025-12-31', status: 'active' },
    { id: 't2', name: 'Michael Smith', email: 'mike.s@example.com', phone: '(555) 234-5678', propertyId: 'p1', unitNo: '102', rentAmount: 1850, balance: 1850, autopayStatus: false, leaseStart: '2024-06-01', leaseEnd: '2025-05-31', status: 'delinquent' },
    { id: 't3', name: 'Sarah Williams', email: 'sarah.w@example.com', phone: '(555) 345-6789', propertyId: 'p2', unitNo: 'A1', rentAmount: 1500, balance: 0, autopayStatus: true, leaseStart: '2025-03-01', leaseEnd: '2026-02-28', status: 'active' },
    { id: 't4', name: 'David Brown', email: 'david.b@example.com', phone: '(555) 456-7890', propertyId: 'p3', unitNo: '3B', rentAmount: 3000, balance: 0, autopayStatus: false, leaseStart: '2025-02-01', leaseEnd: '2026-01-31', status: 'active' },
    { id: 't5', name: 'Emily Davis', email: 'emily.d@example.com', phone: '(555) 567-8901', propertyId: 'p4', unitNo: 'Townhome 2', rentAmount: 2500, balance: 5000, autopayStatus: false, leaseStart: '2024-10-01', leaseEnd: '2025-09-30', status: 'notice' },
  ],
  vendors: [
    { id: 'v1', name: 'FixIt Plumbing', specialty: 'Plumbing', email: 'jobs@fixitplumbing.com', phone: '(555) 999-1111', activeJobs: 2 },
    { id: 'v2', name: 'Volt Electricians', specialty: 'Electrical', email: 'service@voltelectric.com', phone: '(555) 999-2222', activeJobs: 1 },
    { id: 'v3', name: 'All-Around Handyman', specialty: 'General', email: 'hello@allaround.com', phone: '(555) 999-3333', activeJobs: 0 },
  ],
  tickets: [
    { id: 'tk1', title: 'Leaking Faucet in Kitchen', description: 'The kitchen sink faucet is dripping constantly.', propertyId: 'p1', tenantId: 't1', status: 'open', priority: 'low', createdAt: new Date().toISOString(), logs: [] },
    { id: 'tk2', title: 'No Hot Water', description: 'Water heater seems broken, completely cold water.', propertyId: 'p3', tenantId: 't4', vendorId: 'v1', status: 'assigned', priority: 'emergency', createdAt: new Date(Date.now() - 86400000).toISOString(), logs: [{ id: 'l1', timestamp: new Date(Date.now() - 80000000).toISOString(), message: 'Assigned to FixIt Plumbing.', authorId: 'admin', authorRole: 'landlord' }] },
  ],
  ledger: [
    { id: 'tr1', date: '2026-05-01', propertyId: 'p1', amount: 1800, type: 'income', category: 'Rent', description: 'Rent Payment - Alice Johnson', status: 'pending' },
    { id: 'tr2', date: '2026-05-02', propertyId: 'p2', amount: 1500, type: 'income', category: 'Rent', description: 'Rent Payment - Sarah Williams', status: 'cleared' },
    { id: 'tr3', date: '2026-05-10', propertyId: 'p1', amount: -250, type: 'expense', category: 'Maintenance', description: 'HVAC Filter Replacements', status: 'pending' },
    { id: 'tr4', date: '2026-05-15', propertyId: 'p3', amount: 3000, type: 'income', category: 'Rent', description: 'Rent Payment - David Brown', status: 'pending' },
  ],
  owners: [
    { id: 'o1', name: 'John Doe', sharePercent: 100, totalDraws: 85000 }
  ]
};

// ==========================================
// MONGOOSE SCHEMA DEFINITIONS
// ==========================================

const PropertySchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  address: { type: String, required: true },
  units: { type: Number, required: true },
  occupancyRate: { type: Number, required: true },
  image: { type: String },
  monthlyRevenue: { type: Number, required: true }
});

const TenantSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  propertyId: { type: String, required: true },
  unitNo: { type: String, required: true },
  rentAmount: { type: Number, required: true },
  balance: { type: Number, required: true },
  autopayStatus: { type: Boolean, required: true },
  leaseStart: { type: String, required: true },
  leaseEnd: { type: String, required: true },
  status: { type: String, enum: ['active', 'delinquent', 'notice'], required: true }
});

const TicketLogSchema = new Schema({
  id: { type: String, required: true },
  timestamp: { type: String, required: true },
  message: { type: String, required: true },
  authorId: { type: String, required: true },
  authorRole: { type: String, required: true }
});

const MaintenanceTicketSchema = new Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  propertyId: { type: String, required: true },
  tenantId: { type: String, required: true },
  vendorId: { type: String },
  status: { type: String, enum: ['open', 'assigned', 'in-progress', 'completed', 'invoiced'], required: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'emergency'], required: true },
  createdAt: { type: String, required: true },
  logs: [TicketLogSchema],
  invoiceAmount: { type: Number },
  invoiceUrl: { type: String }
});

const VendorSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  specialty: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  activeJobs: { type: Number, required: true }
});

const LedgerTransactionSchema = new Schema({
  id: { type: String, required: true },
  date: { type: String, required: true },
  propertyId: { type: String },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['cleared', 'pending'], required: true }
});

const OwnerSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  sharePercent: { type: Number, required: true },
  totalDraws: { type: Number, required: true }
});

const AppStateSchema = new Schema({
  key: { type: String, required: true, unique: true, default: 'main_state' },
  currentRole: { type: String, required: true },
  properties: [PropertySchema],
  tenants: [TenantSchema],
  tickets: [MaintenanceTicketSchema],
  vendors: [VendorSchema],
  ledger: [LedgerTransactionSchema],
  owners: [OwnerSchema]
}, { timestamps: true });

const AppStateModel = mongoose.model('AppState', AppStateSchema);

// ==========================================
// DYNAMIC DUAL-ENGINE DB MANAGER
// ==========================================

export class FileDB {
  static isMongoActive = false;

  static async init() {
    const mongoUri = process.env.MONGODB_URI;

    if (mongoUri && mongoUri.trim() !== '') {
      try {
        console.log('🍃 [LuminaRental Database] Connecting to Cloud MongoDB Atlas...');
        await mongoose.connect(mongoUri);
        this.isMongoActive = true;
        console.log('🍃 [LuminaRental Database] Connected to Live cloud MongoDB Atlas!');

        // Check if database is empty, seed it
        const count = await AppStateModel.countDocuments({ key: 'main_state' });
        if (count === 0) {
          console.log('🌱 Seeding initial mock data to Cloud MongoDB Atlas cluster...');
          await AppStateModel.create({
            key: 'main_state',
            ...defaultMockData
          });
        }
      } catch (err) {
        console.error('❌ Failed to connect to MongoDB Atlas, falling back to local storage file.', err);
        this.isMongoActive = false;
        this.initLocalFS();
      }
    } else {
      console.log('💾 [LuminaRental Database] MONGODB_URI not found. Running in resilient local JSON FileDB mode.');
      this.isMongoActive = false;
      this.initLocalFS();
    }
  }

  static initLocalFS() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultMockData, null, 2), 'utf-8');
    }
  }

  static async read(): Promise<AppState> {
    if (this.isMongoActive) {
      try {
        const doc = await AppStateModel.findOne({ key: 'main_state' });
        if (doc) {
          return doc.toObject() as unknown as AppState;
        }
      } catch (err) {
        console.error('Error reading from MongoDB, returning default state', err);
      }
    }

    // Local file fallback
    this.initLocalFS();
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content) as AppState;
    } catch (e) {
      return defaultMockData;
    }
  }

  static async write(data: AppState): Promise<void> {
    if (this.isMongoActive) {
      try {
        await AppStateModel.findOneAndUpdate(
          { key: 'main_state' },
          { $set: data },
          { new: true, upsert: true }
        );
        return;
      } catch (err) {
        console.error('Failed writing state to MongoDB', err);
      }
    }

    // Local file fallback
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write database file', e);
    }
  }

  static async reset(): Promise<void> {
    if (this.isMongoActive) {
      try {
        await AppStateModel.findOneAndUpdate(
          { key: 'main_state' },
          { $set: defaultMockData },
          { new: true, upsert: true }
        );
        return;
      } catch (err) {
        console.error('Failed resetting MongoDB', err);
      }
    }

    await this.write(defaultMockData);
  }
}
