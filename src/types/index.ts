// Sri Balaji Borewells - Complete Type Definitions

export type UserRole = 'OWNER' | 'MANAGER' | 'EMPLOYEE';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
}

export interface UserDeviceRecord {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  deviceId: string;
  deviceName: string;
  browser: string;
  os: string;
  isApproved: boolean;
  approvedAt?: string;
  lastActive: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  customerCode: string; // e.g. CUST-001
  name: string;
  phone: string;
  altPhone?: string;
  village: string;
  city: string;
  taluk: string;
  district: string;
  fullAddress: string;
  remarks?: string;
  createdDate: string;
  createdBy: string;
}

export type BorewellStatus = 'Planned' | 'In Progress' | 'Completed' | 'Cancelled';

export interface DrillingRateSlab {
  id: string;
  fromFeet: number;
  toFeet: number;
  ratePerFoot: number;
}

export interface DrillingRateConfig {
  id: string;
  templateName: string;
  isTemplate?: boolean;
  slabs: DrillingRateSlab[];
  defaultCasingRate: number;
  defaultCallerRate: number;
  defaultWeldingRate: number;
  defaultMealsCharge: number;
  defaultTransportCharge: number;
}

export interface Borewell {
  id: string;
  borewellCode: string; // e.g. BW-2026-001
  customerId: string;
  customerName: string;
  drillingDate: string;
  location: string;
  totalDepth: number; // in feet
  rockType: string;
  drillerName: string;
  machineDetails: string;
  status: BorewellStatus;
  remarks?: string;
  rateConfig: DrillingRateConfig; // snapshot of rates for this borewell
  createdDate: string;
  createdBy: string;
}

export interface CalculatedSlabRow {
  fromFeet: number;
  toFeet: number;
  feetInSlab: number;
  ratePerFoot: number;
  amount: number;
}

export interface OtherChargeItem {
  id: string;
  description: string;
  amount: number;
}

export interface DepthCalculationResult {
  totalDepth: number;
  slabRows: CalculatedSlabRow[];
  drillingSubtotal: number;
  
  casingQty: number;
  casingRate: number;
  casingAmount: number;

  callerQty: number;
  callerRate: number;
  callerAmount: number;

  weldingQty: number;
  weldingRate: number;
  weldingAmount: number;

  mealsCharge: number;
  mealsType: 'fixed' | 'calculated';
  mealsRate?: number;
  mealsQty?: number;

  transportCharge: number;
  transportType: 'fixed' | 'calculated';
  transportRate?: number;
  transportQty?: number;

  otherCharges: OtherChargeItem[];
  otherChargesSubtotal: number;

  grandTotal: number;
}

export type BillType = 'CUSTOMER' | 'OWNER' | 'REBORE';
export type PaymentStatus = 'Unpaid' | 'Partial' | 'Paid';

export interface BillRevision {
  version: number;
  date: string;
  changedBy: string;
  summary: string;
}

export interface Bill {
  id: string;
  billNumber: string; // BILL-2026-001 or OBILL-2026-001
  billType: BillType;
  borewellId: string;
  borewellCode: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  drillingLocation: string;
  rockType: string;
  drillerName: string;
  machineDetails: string;
  billDate: string;
  totalDepth: number;
  calculation: DepthCalculationResult;
  grandTotal: number;
  amountReceived: number;
  pendingBalance: number;
  status: PaymentStatus;
  version: number;
  notes?: string;
  internalRemarks?: string;
  managerName?: string;
  createdBy: string;
  createdDate: string;
  revisions: BillRevision[];
}

export type PaymentMethod = 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque' | 'Other';

export interface Payment {
  id: string;
  receiptNumber: string; // RCP-2026-001
  borewellId: string;
  borewellCode: string;
  billId?: string;
  billNumber?: string;
  customerId: string;
  customerName: string;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  remarks: string;
  recordedBy: string;
  createdDate: string;
}

export type DocumentCategory = 
  | 'Materials' 
  | 'Fuel' 
  | 'Transport' 
  | 'Repairs' 
  | 'Welding' 
  | 'Equipment' 
  | 'Other';

export interface OcrResult {
  billNumber?: string;
  vendorName?: string;
  date?: string;
  amount?: number;
  rawText?: string;
  verified: boolean;
}

export interface DocumentRecord {
  id: string;
  title: string;
  category: DocumentCategory;
  originalDocDate: string;
  uploadDate: string;
  amount: number;
  customerId?: string;
  borewellId?: string;
  borewellCode?: string;
  customerName?: string;
  isLinked: boolean;
  uploadedBy: string;
  fileUrl: string;
  fileType: 'image' | 'pdf';
  fileName: string;
  fileSize: number;
  remarks?: string;
  ocr?: OcrResult;
}

export type ExpenseCategory = 
  | 'Fuel' 
  | 'Repairs' 
  | 'Transport' 
  | 'Materials' 
  | 'Labour' 
  | 'Equipment' 
  | 'Other';

export interface ExpenseRecord {
  id: string;
  expenseDate: string;
  category: ExpenseCategory;
  amount: number;
  borewellId?: string;
  borewellCode?: string;
  description: string;
  documentId?: string;
  createdBy: string;
  createdDate: string;
}

export interface PetrolBunkRecord {
  id: string;
  name: string;
  address: string;
  purchases: PetrolBunkPurchase[];
  payments: PetrolBunkPayment[];
  createdBy: string;
  createdDate: string;
}

export interface PetrolBunkPurchase {
  id: string;
  date: string;
  quantityLitres: number;
}

export interface PetrolBunkPayment {
  id: string;
  date: string;
  amount: number;
}

export interface ActivityLog {
  id: string;
  action: string;
  module: 'Customer' | 'Borewell' | 'Bill' | 'Payment' | 'Document' | 'Expense' | 'Petrol Bunk' | 'Settings' | 'Auth';
  details: string;
  performedBy: string;
  timestamp: string;
}

export type PaperSize = '4x6' | 'A4' | 'A5' | 'Custom';
export type ColorMode = 'color' | 'bw';
export type PrintOrientation = 'portrait' | 'landscape';

export interface PrintSettings {
  paperSize: PaperSize;
  customWidthMm?: number;
  customHeightMm?: number;
  orientation: PrintOrientation;
  colorMode: ColorMode;
  layoutDensity: 'compact' | 'detailed';
  scale: number; // 80 - 120 %
  marginMm: number; // 2 - 20 mm
}

export interface CompanySettings {
  companyName: string; // Strictly 'Sri Balaji Borewells'
  tagline: string;
  logoUrl?: string;
  primaryPhone: string;
  secondaryPhone: string;
  email: string;
  address: string;
  village: string;
  taluk: string;
  district: string;
  gstNumber?: string;
  billNumberPrefix: string;
  ownerBillNumberPrefix: string;
  receiptNumberPrefix: string;
  defaultPrintSettings: PrintSettings;
  language: 'en' | 'kn';
  currency: string;
  defaultRates: DrillingRateConfig;
}
