// Sri Balaji Borewells - Supabase-backed Repository Service
import {
  Customer,
  Borewell,
  Bill,
  Payment,
  DocumentRecord,
  ExpenseRecord,
  PetrolBunkRecord,
  CompanySettings,
  ActivityLog,
} from '../types';
import {
  INITIAL_CUSTOMERS,
  INITIAL_BOREWELLS,
  INITIAL_BILLS,
  INITIAL_PAYMENTS,
  INITIAL_DOCUMENTS,
  INITIAL_EXPENSES,
  INITIAL_COMPANY_SETTINGS,
  INITIAL_ACTIVITY_LOGS,
} from './mockData';
import { supabase } from './supabase';
import { reportAppError } from './appErrors';

const STORAGE_KEYS = {
  CUSTOMERS: 'borewell_customers_v1',
  BOREWELLS: 'borewell_borewells_v1',
  BILLS: 'borewell_bills_v1',
  PAYMENTS: 'borewell_payments_v1',
  DOCUMENTS: 'borewell_documents_v1',
  EXPENSES: 'borewell_expenses_v1',
  PETROL_BUNKS: 'borewell_petrol_bunks_v1',
  SETTINGS: 'borewell_settings_v1',
  LOGS: 'borewell_logs_v1',
};

const STORAGE_KEY_LIST = Object.values(STORAGE_KEYS);
const persistenceQueues = new Map<string, Promise<void>>();

interface AppRecord {
  bucket: string;
  record_id: string;
  data: unknown;
}

function getStoredItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item);
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return defaultValue;
  }
}

function setStoredItem<T>(key: string, value: T): void {
  const previous = getStoredItem<unknown>(key, key === STORAGE_KEYS.SETTINGS ? null : []);
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
    reportAppError(e);
    return;
  }

  if (!supabase || !STORAGE_KEY_LIST.includes(key)) return;
  void persistStoredItem(key, previous, value);
}

function getAppRecords(bucket: string, value: unknown): AppRecord[] {
  if (bucket === STORAGE_KEYS.SETTINGS) {
    return value && typeof value === 'object'
      ? [{ bucket, record_id: 'company', data: value }]
      : [];
  }

  if (!Array.isArray(value)) {
    throw new Error(`Expected an array of records for ${bucket}.`);
  }

  return value.map((item, index) => {
    if (!item || typeof item !== 'object' || !('id' in item) || typeof item.id !== 'string') {
      throw new Error(`Record ${index + 1} in ${bucket} is missing a string id.`);
    }
    return { bucket, record_id: item.id, data: item };
  });
}

async function persistStoredItem(key: string, previousValue: unknown, value: unknown): Promise<void> {
  const client = supabase;
  if (!client) return;

  const allRows = getAppRecords(key, value);
  const previousRows = getAppRecords(key, previousValue);
  const previousById = new Map(previousRows.map(row => [row.record_id, row.data]));
  const rows = allRows.filter(row => JSON.stringify(previousById.get(row.record_id)) !== JSON.stringify(row.data));
  const nextIds = new Set(allRows.map(row => row.record_id));
  const removedIds = previousRows
    .map(row => row.record_id)
    .filter(id => !nextIds.has(id));

  const previousWrite = persistenceQueues.get(key) || Promise.resolve();
  const write = previousWrite.catch(() => undefined).then(async () => {
    if (rows.length) {
      const { error } = await client
        .from('app_records')
        .upsert(rows, { onConflict: 'bucket,record_id' });
      if (error) throw new Error(`Could not save ${key} to Supabase: ${error.message}`);
    }

    if (removedIds.length) {
      const { error } = await client
        .from('app_records')
        .delete()
        .eq('bucket', key)
        .in('record_id', removedIds);
      if (error) throw new Error(`Could not delete records from ${key}: ${error.message}`);
    }
  });

  persistenceQueues.set(key, write);
  void write.catch(reportAppError);
}

class RepositoryService {
  public async initialize(): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase is not configured. Add the project URL and public anon key to .env.');
    }

    const { data, error } = await supabase
      .from('app_records')
      .select('bucket, record_id, data');

    if (error) throw new Error(`Could not load application data from Supabase: ${error.message}`);

    for (const key of STORAGE_KEY_LIST) {
      const rows = (data || []).filter(record => record.bucket === key);
      if (key === STORAGE_KEYS.SETTINGS) {
        const settings = rows.find(record => record.record_id === 'company')?.data;
        if (settings) localStorage.setItem(key, JSON.stringify(settings));
        else localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(rows.map(record => record.data)));
      }
    }
  }

  // Activity Logging helper
  public logActivity(action: string, module: ActivityLog['module'], details: string, performedBy: string): void {
    const logs = this.getActivityLogs();
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      action,
      module,
      details,
      performedBy,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    logs.unshift(newLog);
    setStoredItem(STORAGE_KEYS.LOGS, logs.slice(0, 100)); // retain last 100 logs
  }

  public getActivityLogs(): ActivityLog[] {
    return getStoredItem<ActivityLog[]>(STORAGE_KEYS.LOGS, INITIAL_ACTIVITY_LOGS);
  }

  // Company Settings
  public getCompanySettings(): CompanySettings {
    const settings = getStoredItem<CompanySettings>(STORAGE_KEYS.SETTINGS, INITIAL_COMPANY_SETTINGS);
    if (!settings.logoUrl || settings.logoUrl === '/skbs-logo.png') {
      settings.logoUrl = '/logo.svg';
    }
    return settings;
  }

  public saveCompanySettings(settings: CompanySettings, performedBy: string): void {
    // Ensure company name is always Sri Balaji Borewells
    settings.companyName = 'Sri Balaji Borewells';
    setStoredItem(STORAGE_KEYS.SETTINGS, settings);
    this.logActivity('Updated Company Settings', 'Settings', 'Updated company profile and contact details', performedBy);
  }

  // Customers
  public getCustomers(): Customer[] {
    return getStoredItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  }

  public getCustomerById(id: string): Customer | undefined {
    return this.getCustomers().find(c => c.id === id);
  }

  public findDuplicateCustomer(phone: string, name: string, currentId?: string): Customer | null {
    const customers = this.getCustomers();
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const cleanName = name.trim().toLowerCase();

    return customers.find(c => {
      if (currentId && c.id === currentId) return false;
      const cPhone = c.phone.replace(/[^0-9]/g, '');
      const cAltPhone = (c.altPhone || '').replace(/[^0-9]/g, '');
      const samePhone = cleanPhone && (cPhone === cleanPhone || cAltPhone === cleanPhone);
      const sameName = cleanName && c.name.trim().toLowerCase() === cleanName;
      return samePhone || sameName;
    }) || null;
  }

  public saveCustomer(customer: Customer, performedBy: string): Customer {
    const customers = this.getCustomers();
    const index = customers.findIndex(c => c.id === customer.id);
    const isNew = index === -1;

    if (isNew) {
      if (!customer.id) customer.id = `cust-${Date.now()}`;
      if (!customer.customerCode) {
        const nextNum = customers.length + 1;
        customer.customerCode = `CUST-2026-${String(nextNum).padStart(3, '0')}`;
      }
      customer.createdDate = customer.createdDate || new Date().toISOString().split('T')[0];
      customer.createdBy = customer.createdBy || performedBy;
      customers.unshift(customer);
      this.logActivity('Added Customer', 'Customer', `Added customer ${customer.name} (${customer.phone})`, performedBy);
    } else {
      customers[index] = customer;
      this.logActivity('Updated Customer', 'Customer', `Updated customer ${customer.name}`, performedBy);
    }

    setStoredItem(STORAGE_KEYS.CUSTOMERS, customers);
    return customer;
  }

  public deleteCustomer(id: string, performedBy: string): boolean {
    const customers = this.getCustomers();
    const target = customers.find(c => c.id === id);
    if (!target) return false;

    // Check if borewells exist
    const borewells = this.getBorewellsByCustomerId(id);
    if (borewells.length > 0) {
      throw new Error(`Cannot delete customer ${target.name}. There are ${borewells.length} borewell project(s) linked to this customer.`);
    }

    const filtered = customers.filter(c => c.id !== id);
    setStoredItem(STORAGE_KEYS.CUSTOMERS, filtered);
    this.logActivity('Deleted Customer', 'Customer', `Deleted customer ${target.name} (${target.customerCode})`, performedBy);
    return true;
  }

  // Borewells
  public getBorewells(): Borewell[] {
    return getStoredItem<Borewell[]>(STORAGE_KEYS.BOREWELLS, INITIAL_BOREWELLS);
  }

  public getBorewellById(id: string): Borewell | undefined {
    return this.getBorewells().find(b => b.id === id);
  }

  public getBorewellsByCustomerId(customerId: string): Borewell[] {
    return this.getBorewells().filter(b => b.customerId === customerId);
  }

  public saveBorewell(borewell: Borewell, performedBy: string): Borewell {
    const borewells = this.getBorewells();
    const index = borewells.findIndex(b => b.id === borewell.id);
    const isNew = index === -1;

    if (isNew) {
      if (!borewell.id) borewell.id = `bw-${Date.now()}`;
      if (!borewell.borewellCode) {
        const nextNum = borewells.length + 1;
        borewell.borewellCode = `BW-2026-${String(nextNum).padStart(3, '0')}`;
      }
      borewell.createdDate = borewell.createdDate || new Date().toISOString().split('T')[0];
      borewell.createdBy = borewell.createdBy || performedBy;
      borewells.unshift(borewell);
      this.logActivity('Added Borewell', 'Borewell', `Created borewell ${borewell.borewellCode} for ${borewell.customerName} (${borewell.totalDepth} ft)`, performedBy);
    } else {
      borewells[index] = borewell;
      this.logActivity('Updated Borewell', 'Borewell', `Updated borewell ${borewell.borewellCode}`, performedBy);
    }

    setStoredItem(STORAGE_KEYS.BOREWELLS, borewells);
    return borewell;
  }

  public deleteBorewell(id: string, performedBy: string): boolean {
    const borewells = this.getBorewells();
    const target = borewells.find(b => b.id === id);
    if (!target) return false;

    // Prevent deletion if bills exist
    const bills = this.getBillsByBorewellId(id);
    if (bills.length > 0) {
      throw new Error(`Cannot delete borewell ${target.borewellCode} because bills are associated with it.`);
    }

    const filtered = borewells.filter(b => b.id !== id);
    setStoredItem(STORAGE_KEYS.BOREWELLS, filtered);
    this.logActivity('Deleted Borewell', 'Borewell', `Deleted borewell ${target.borewellCode}`, performedBy);
    return true;
  }

  // Bills
  public getBills(): Bill[] {
    return getStoredItem<Bill[]>(STORAGE_KEYS.BILLS, INITIAL_BILLS);
  }

  public getBillById(id: string): Bill | undefined {
    return this.getBills().find(b => b.id === id);
  }

  public getBillsByBorewellId(borewellId: string): Bill[] {
    return this.getBills().filter(b => b.borewellId === borewellId);
  }

  public saveBill(bill: Bill, performedBy: string): Bill {
    const bills = this.getBills();
    const settings = this.getCompanySettings();
    const index = bills.findIndex(b => b.id === bill.id);
    const isNew = index === -1;

    bill.managerName = bill.managerName || bill.createdBy || performedBy;

    // Recalculate pending balance
    const payments = this.getPaymentsByBorewellId(bill.borewellId);
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    bill.amountReceived = totalPaid;
    bill.pendingBalance = Math.max(0, bill.grandTotal - totalPaid);
    bill.status = bill.pendingBalance <= 0 ? 'Paid' : (bill.amountReceived > 0 ? 'Partial' : 'Unpaid');

    if (isNew) {
      if (!bill.id) bill.id = `bill-${Date.now()}`;
      if (!bill.billNumber) {
        let prefix = settings.billNumberPrefix;
        if (bill.billType === 'OWNER') {
          prefix = settings.ownerBillNumberPrefix;
        } else if (bill.billType === 'REBORE') {
          prefix = 'RBILL-2026-';
        }
        const count = bills.filter(b => b.billType === bill.billType).length + 1;
        bill.billNumber = `${prefix}${String(count).padStart(3, '0')}`;
      }
      bill.version = 1;
      bill.createdDate = bill.createdDate || new Date().toISOString().split('T')[0];
      bill.createdBy = bill.createdBy || performedBy;
      bill.revisions = [
        {
          version: 1,
          date: new Date().toISOString().split('T')[0],
          changedBy: performedBy,
          summary: `Initial ${bill.billType} bill generated.`,
        },
      ];
      bills.unshift(bill);
      this.logActivity(`Created ${bill.billType} Bill`, 'Bill', `Generated ${bill.billNumber} for ${bill.customerName} (₹${bill.grandTotal})`, performedBy);
    } else {
      const prev = bills[index];
      bill.version = (prev.version || 1) + 1;
      bill.revisions = [
        ...(prev.revisions || []),
        {
          version: bill.version,
          date: new Date().toISOString().split('T')[0],
          changedBy: performedBy,
          summary: `Bill revised to v${bill.version}.`,
        },
      ];
      bills[index] = bill;
      this.logActivity(`Updated ${bill.billType} Bill`, 'Bill', `Updated ${bill.billNumber} (v${bill.version})`, performedBy);
    }

    setStoredItem(STORAGE_KEYS.BILLS, bills);
    return bill;
  }

  public updateBillPaymentAmount(id: string, amountReceived: number, performedBy: string): Bill | null {
    const bills = this.getBills();
    const index = bills.findIndex(b => b.id === id);
    if (index === -1) return null;

    const bill = bills[index];
    const safeAmount = Math.max(0, Number(amountReceived) || 0);
    bill.amountReceived = safeAmount;
    bill.pendingBalance = Math.max(0, bill.grandTotal - safeAmount);
    bill.status = bill.pendingBalance <= 0 ? 'Paid' : (bill.amountReceived > 0 ? 'Partial' : 'Unpaid');
    bill.managerName = bill.managerName || bill.createdBy || performedBy;

    bills[index] = bill;
    setStoredItem(STORAGE_KEYS.BILLS, bills);
    this.logActivity('Updated Bill Payment', 'Bill', `Adjusted payment for ${bill.billNumber} to ₹${safeAmount}; pending balance ₹${bill.pendingBalance}`, performedBy);
    return bill;
  }

  public deleteBill(id: string, performedBy: string): boolean {
    const bills = this.getBills();
    const target = bills.find(b => b.id === id);
    if (!target) return false;

    const filtered = bills.filter(b => b.id !== id);
    setStoredItem(STORAGE_KEYS.BILLS, filtered);
    this.logActivity(`Deleted ${target.billType} Bill`, 'Bill', `Deleted ${target.billNumber}`, performedBy);
    return true;
  }

  // Payments
  public getPayments(): Payment[] {
    return getStoredItem<Payment[]>(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
  }

  public getPaymentsByBorewellId(borewellId: string): Payment[] {
    return this.getPayments().filter(p => p.borewellId === borewellId);
  }

  public savePayment(payment: Payment, performedBy: string): Payment {
    const payments = this.getPayments();
    const settings = this.getCompanySettings();
    const index = payments.findIndex(p => p.id === payment.id);
    const isNew = index === -1;

    if (isNew) {
      if (!payment.id) payment.id = `pay-${Date.now()}`;
      if (!payment.receiptNumber) {
        const nextNum = payments.length + 1;
        payment.receiptNumber = `${settings.receiptNumberPrefix}${String(nextNum).padStart(3, '0')}`;
      }
      payment.createdDate = payment.createdDate || new Date().toISOString().split('T')[0];
      payment.recordedBy = payment.recordedBy || performedBy;
      payments.unshift(payment);
      this.logActivity('Recorded Payment', 'Payment', `Received ₹${payment.amount} via ${payment.paymentMethod} (${payment.receiptNumber}) for ${payment.customerName}`, performedBy);
    } else {
      payments[index] = payment;
      this.logActivity('Updated Payment', 'Payment', `Updated payment ${payment.receiptNumber}`, performedBy);
    }

    setStoredItem(STORAGE_KEYS.PAYMENTS, payments);

    // Refresh bill balances for this borewell
    const bills = this.getBills();
    let billsUpdated = false;
    const allBorewellPayments = payments.filter(p => p.borewellId === payment.borewellId);
    const totalPaid = allBorewellPayments.reduce((sum, p) => sum + p.amount, 0);

    bills.forEach(b => {
      if (b.borewellId === payment.borewellId) {
        b.amountReceived = totalPaid;
        b.pendingBalance = Math.max(0, b.grandTotal - totalPaid);
        b.status = b.pendingBalance <= 0 ? 'Paid' : (b.amountReceived > 0 ? 'Partial' : 'Unpaid');
        billsUpdated = true;
      }
    });

    if (billsUpdated) {
      setStoredItem(STORAGE_KEYS.BILLS, bills);
    }

    return payment;
  }

  public deletePayment(id: string, performedBy: string): boolean {
    const payments = this.getPayments();
    const target = payments.find(p => p.id === id);
    if (!target) return false;

    const filtered = payments.filter(p => p.id !== id);
    setStoredItem(STORAGE_KEYS.PAYMENTS, filtered);
    this.logActivity('Deleted Payment', 'Payment', `Deleted payment ${target.receiptNumber} (₹${target.amount})`, performedBy);

    // Recalculate bill balance
    const bills = this.getBills();
    const remainingPayments = filtered.filter(p => p.borewellId === target.borewellId);
    const totalPaid = remainingPayments.reduce((sum, p) => sum + p.amount, 0);

    bills.forEach(b => {
      if (b.borewellId === target.borewellId) {
        b.amountReceived = totalPaid;
        b.pendingBalance = Math.max(0, b.grandTotal - totalPaid);
        b.status = b.pendingBalance <= 0 ? 'Paid' : (b.amountReceived > 0 ? 'Partial' : 'Unpaid');
      }
    });
    setStoredItem(STORAGE_KEYS.BILLS, bills);

    return true;
  }

  // Documents
  public getDocuments(): DocumentRecord[] {
    return getStoredItem<DocumentRecord[]>(STORAGE_KEYS.DOCUMENTS, INITIAL_DOCUMENTS);
  }

  public getUnlinkedDocuments(): DocumentRecord[] {
    return this.getDocuments().filter(d => !d.isLinked || !d.borewellId);
  }

  public getDocumentsByBorewellId(borewellId: string): DocumentRecord[] {
    return this.getDocuments().filter(d => d.borewellId === borewellId);
  }

  public saveDocument(doc: DocumentRecord, performedBy: string): DocumentRecord {
    const documents = this.getDocuments();
    const index = documents.findIndex(d => d.id === doc.id);
    const isNew = index === -1;

    if (isNew) {
      if (!doc.id) doc.id = `doc-${Date.now()}`;
      doc.uploadDate = doc.uploadDate || new Date().toISOString().replace('T', ' ').substring(0, 16);
      doc.uploadedBy = doc.uploadedBy || performedBy;
      doc.isLinked = Boolean(doc.borewellId);
      documents.unshift(doc);
      this.logActivity('Uploaded Document', 'Document', `Uploaded ${doc.title} (${doc.category})${!doc.isLinked ? ' [Unlinked]' : ''}`, performedBy);
    } else {
      doc.isLinked = Boolean(doc.borewellId);
      documents[index] = doc;
      this.logActivity('Updated Document', 'Document', `Updated document ${doc.title}`, performedBy);
    }

    setStoredItem(STORAGE_KEYS.DOCUMENTS, documents);
    return doc;
  }

  public linkDocumentToBorewell(docId: string, borewellId: string, customerId: string, customerName: string, borewellCode: string, performedBy: string): DocumentRecord {
    const documents = this.getDocuments();
    const doc = documents.find(d => d.id === docId);
    if (!doc) throw new Error('Document not found');

    doc.borewellId = borewellId;
    doc.borewellCode = borewellCode;
    doc.customerId = customerId;
    doc.customerName = customerName;
    doc.isLinked = true;

    setStoredItem(STORAGE_KEYS.DOCUMENTS, documents);
    this.logActivity('Linked Document', 'Document', `Linked document ${doc.title} to ${borewellCode} (${customerName})`, performedBy);
    return doc;
  }

  public deleteDocument(id: string, performedBy: string): boolean {
    const documents = this.getDocuments();
    const target = documents.find(d => d.id === id);
    if (!target) return false;

    const filtered = documents.filter(d => d.id !== id);
    setStoredItem(STORAGE_KEYS.DOCUMENTS, filtered);
    this.logActivity('Deleted Document', 'Document', `Deleted document ${target.title}`, performedBy);
    return true;
  }

  // Expenses
  public getExpenses(): ExpenseRecord[] {
    return getStoredItem<ExpenseRecord[]>(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
  }

  public getPetrolBunks(): PetrolBunkRecord[] {
    const stored = getStoredItem<Array<PetrolBunkRecord & {
      petrolQuantityLitres?: number;
      amount?: number;
    }>>(STORAGE_KEYS.PETROL_BUNKS, []);
    const bunks = stored.map(bunk => ({
      ...bunk,
      purchases: bunk.purchases?.map(purchase => ({
        id: purchase.id,
        date: purchase.date,
        quantityLitres: Number(purchase.quantityLitres) || 0,
      })) || (
        bunk.petrolQuantityLitres !== undefined
          ? [{
              id: `purchase-${bunk.id}`,
              date: bunk.createdDate,
              quantityLitres: Number(bunk.petrolQuantityLitres) || 0,
            }]
          : []
      ),
      payments: bunk.payments || [],
    }));
    if (bunks.some((bunk, index) => !stored[index].purchases || !stored[index].payments)) {
      setStoredItem(STORAGE_KEYS.PETROL_BUNKS, bunks);
    }
    return bunks;
  }

  public savePetrolBunk(bunk: PetrolBunkRecord, performedBy: string): PetrolBunkRecord {
    const bunks = this.getPetrolBunks();
    const index = bunks.findIndex(item => item.id === bunk.id);
    if (index === -1) {
      if (!bunk.id) bunk.id = `petrol-bunk-${Date.now()}`;
      bunk.createdDate = bunk.createdDate || new Date().toISOString().split('T')[0];
      bunk.createdBy = bunk.createdBy || performedBy;
      bunks.unshift(bunk);
      this.logActivity('Added Petrol Bunk', 'Petrol Bunk', `Added petrol bunk ${bunk.name}`, performedBy);
    } else {
      bunks[index] = bunk;
      this.logActivity('Updated Petrol Bunk', 'Petrol Bunk', `Updated petrol bunk ${bunk.name}`, performedBy);
    }

    setStoredItem(STORAGE_KEYS.PETROL_BUNKS, bunks);
    return bunk;
  }

  public deletePetrolBunk(id: string, performedBy: string): boolean {
    const bunks = this.getPetrolBunks();
    const target = bunks.find(item => item.id === id);
    if (!target) return false;

    setStoredItem(STORAGE_KEYS.PETROL_BUNKS, bunks.filter(item => item.id !== id));
    this.logActivity('Deleted Petrol Bunk', 'Petrol Bunk', `Deleted petrol bunk ${target.name}`, performedBy);
    return true;
  }

  public saveExpense(expense: ExpenseRecord, performedBy: string): ExpenseRecord {
    const expenses = this.getExpenses();
    const index = expenses.findIndex(e => e.id === expense.id);
    const isNew = index === -1;

    if (isNew) {
      if (!expense.id) expense.id = `exp-${Date.now()}`;
      expense.createdDate = expense.createdDate || new Date().toISOString().split('T')[0];
      expense.createdBy = expense.createdBy || performedBy;
      expenses.unshift(expense);
      this.logActivity('Recorded Expense', 'Expense', `Recorded expense of ₹${expense.amount} (${expense.category}: ${expense.description})`, performedBy);
    } else {
      expenses[index] = expense;
      this.logActivity('Updated Expense', 'Expense', `Updated expense ${expense.description}`, performedBy);
    }

    setStoredItem(STORAGE_KEYS.EXPENSES, expenses);
    return expense;
  }

  public deleteExpense(id: string, performedBy: string): boolean {
    const expenses = this.getExpenses();
    const target = expenses.find(e => e.id === id);
    if (!target) return false;

    const filtered = expenses.filter(e => e.id !== id);
    setStoredItem(STORAGE_KEYS.EXPENSES, filtered);
    this.logActivity('Deleted Expense', 'Expense', `Deleted expense of ₹${target.amount} (${target.description})`, performedBy);
    return true;
  }

  // Reset & Backup / Restore
  public resetToSeedData(): void {
    setStoredItem(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    setStoredItem(STORAGE_KEYS.BOREWELLS, INITIAL_BOREWELLS);
    setStoredItem(STORAGE_KEYS.BILLS, INITIAL_BILLS);
    setStoredItem(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
    setStoredItem(STORAGE_KEYS.DOCUMENTS, INITIAL_DOCUMENTS);
    setStoredItem(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
    setStoredItem(STORAGE_KEYS.PETROL_BUNKS, []);
    setStoredItem(STORAGE_KEYS.SETTINGS, INITIAL_COMPANY_SETTINGS);
    setStoredItem(STORAGE_KEYS.LOGS, INITIAL_ACTIVITY_LOGS);
  }

  public exportBackupJson(): string {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      company: 'Sri Balaji Borewells',
      data: {
        customers: this.getCustomers(),
        borewells: this.getBorewells(),
        bills: this.getBills(),
        payments: this.getPayments(),
        documents: this.getDocuments(),
        expenses: this.getExpenses(),
        petrolBunks: this.getPetrolBunks(),
        settings: this.getCompanySettings(),
        logs: this.getActivityLogs(),
      },
    };
    return JSON.stringify(backup, null, 2);
  }

  public importBackupJson(jsonString: string, performedBy: string): void {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.data) throw new Error('Invalid backup file format');

      if (parsed.data.customers) setStoredItem(STORAGE_KEYS.CUSTOMERS, parsed.data.customers);
      if (parsed.data.borewells) setStoredItem(STORAGE_KEYS.BOREWELLS, parsed.data.borewells);
      if (parsed.data.bills) setStoredItem(STORAGE_KEYS.BILLS, parsed.data.bills);
      if (parsed.data.payments) setStoredItem(STORAGE_KEYS.PAYMENTS, parsed.data.payments);
      if (parsed.data.documents) setStoredItem(STORAGE_KEYS.DOCUMENTS, parsed.data.documents);
      if (parsed.data.expenses) setStoredItem(STORAGE_KEYS.EXPENSES, parsed.data.expenses);
      if (parsed.data.petrolBunks) setStoredItem(STORAGE_KEYS.PETROL_BUNKS, parsed.data.petrolBunks);
      if (parsed.data.settings) setStoredItem(STORAGE_KEYS.SETTINGS, parsed.data.settings);

      this.logActivity('Restored Database Backup', 'Settings', 'Restored system database from JSON backup file', performedBy);
    } catch (e) {
      console.error('Import backup failed:', e);
      throw e;
    }
  }
}

export const repository = new RepositoryService();
