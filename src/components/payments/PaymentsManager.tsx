// Sri Balaji Borewells - Payments Management Module
import React, { useState } from 'react';
import { CreditCard, Plus, Search, Filter, Printer, Trash2, CheckCircle2, User, Disc, X } from 'lucide-react';
import { Payment, PaymentMethod, Borewell } from '../../types';
import { repository } from '../../services/repository';
import { formatINR } from '../../utils/depthCalculator';
import { useAuth } from '../../context/AuthContext';
import { PaymentReceiptModal } from './PaymentReceiptModal';

interface PaymentsManagerProps {
  initialBorewell?: Borewell | null;
}

export const PaymentsManager: React.FC<PaymentsManagerProps> = ({ initialBorewell }) => {
  const { canDelete, currentUser, canRecordPayments } = useAuth();
  const [payments, setPayments] = useState<Payment[]>(() => repository.getPayments());
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');

  const [activeReceipt, setActiveReceipt] = useState<Payment | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(Boolean(initialBorewell));

  // Add Payment Form state
  const borewells = repository.getBorewells();
  const settings = repository.getCompanySettings();

  const [selectedBorewellId, setSelectedBorewellId] = useState<string>(
    initialBorewell?.id || (borewells[0]?.id || '')
  );
  const [amount, setAmount] = useState<number>(50000);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('Advance payment');

  const refreshPayments = () => {
    setPayments([...repository.getPayments()]);
  };

  const selectedBorewell = borewells.find(b => b.id === selectedBorewellId);
  const borewellBills = selectedBorewell ? repository.getBillsByBorewellId(selectedBorewell.id) : [];
  const primaryBill = borewellBills[0];

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  const onlineCollected = payments
    .filter(payment => payment.paymentMethod !== 'Cash')
    .reduce((sum, payment) => sum + payment.amount, 0);
  const directCashCollected = payments
    .filter(payment => payment.paymentMethod === 'Cash')
    .reduce((sum, payment) => sum + payment.amount, 0);
  const paidProjectCount = new Set(payments.map(payment => payment.borewellId)).size;

  const filteredPayments = payments.filter(p => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.receiptNumber.toLowerCase().includes(q) ||
      p.customerName.toLowerCase().includes(q) ||
      p.borewellCode.toLowerCase().includes(q) ||
      p.referenceNumber.toLowerCase().includes(q) ||
      p.remarks.toLowerCase().includes(q);

    const matchesMethod = methodFilter === 'ALL' || p.paymentMethod === methodFilter;
    return matchesSearch && matchesMethod;
  });

  const handleDelete = (payment: Payment) => {
    if (!canDelete) {
      alert('Only the Owner can delete payment entries.');
      return;
    }
    const confirmed = window.confirm(`Delete payment ${payment.receiptNumber} (${formatINR(payment.amount)})?`);
    if (!confirmed) return;

    repository.deletePayment(payment.id, currentUser.name);
    refreshPayments();
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBorewell) {
      alert('Please select a borewell project');
      return;
    }

    if (amount <= 0) {
      alert('Please enter a valid amount greater than 0');
      return;
    }

    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      receiptNumber: '', // assigned by repo
      borewellId: selectedBorewell.id,
      borewellCode: selectedBorewell.borewellCode,
      billId: primaryBill?.id,
      billNumber: primaryBill?.billNumber,
      customerId: selectedBorewell.customerId,
      customerName: selectedBorewell.customerName,
      paymentDate,
      amount: Number(amount),
      paymentMethod,
      referenceNumber: referenceNumber.trim() || `TXN-${Date.now().toString().slice(-6)}`,
      remarks: remarks.trim(),
      recordedBy: currentUser.name,
      createdDate: new Date().toISOString().split('T')[0],
    };

    const saved = repository.savePayment(newPayment, currentUser.name);
    setIsAddModalOpen(false);
    refreshPayments();
    setActiveReceipt(saved); // show receipt immediately
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: 'Total Received', value: formatINR(totalCollected), note: `${payments.length} recorded transactions`, icon: CreditCard, tone: 'text-blue-700 bg-blue-50' },
          { label: 'UPI / Online', value: formatINR(onlineCollected), note: `${payments.filter(payment => payment.paymentMethod !== 'Cash').length} online transactions`, icon: CheckCircle2, tone: 'text-indigo-700 bg-indigo-50' },
          { label: 'Direct Cash', value: formatINR(directCashCollected), note: `${payments.filter(payment => payment.paymentMethod === 'Cash').length} cash settlements`, icon: User, tone: 'text-emerald-700 bg-emerald-50' },
          { label: 'Projects Collected', value: paidProjectCount.toLocaleString(), note: 'Borewell projects with receipts', icon: Disc, tone: 'text-amber-700 bg-amber-50' },
        ].map(metric => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{metric.label}</span>
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${metric.tone}`}><Icon className="h-4 w-4" /></span>
              </div>
              <div className="mt-1 text-2xl font-black tracking-tight text-slate-900">{metric.value}</div>
              <div className="mt-1 text-[11px] text-slate-500">{metric.note}</div>
            </div>
          );
        })}
      </div>

      {/* Top Controls Card */}
      <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Payments &amp; Collections</h1>
          <p className="text-xs text-slate-500">
            Total lifetime collections recorded: <strong className="text-emerald-700">{formatINR(totalCollected)}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search receipt #, customer, txn ref..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Method Filter */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Payment Methods</option>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cheque">Cheque</option>
          </select>

          {canRecordPayments && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Record Payment
            </button>
          )}
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="p-3.5">Receipt #</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Customer &amp; Project</th>
                <th className="p-3.5">Payment Method</th>
                <th className="p-3.5">Reference / Txn ID</th>
                <th className="p-3.5 text-right">Amount (₹)</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-indigo-900 text-sm">
                      {p.receiptNumber}
                    </td>
                    <td className="p-3.5 text-slate-600 whitespace-nowrap">
                      {p.paymentDate}
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{p.customerName}</div>
                      <div className="font-mono text-cyan-800 text-[11px] font-semibold">{p.borewellCode}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 bg-slate-100 rounded-full text-slate-800 font-semibold text-[11px]">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-600">
                      {p.referenceNumber || '-'}
                    </td>
                    <td className="p-3.5 text-right font-mono font-black text-emerald-700 text-sm">
                      +{formatINR(p.amount)}
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setActiveReceipt(p)}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-emerald-600 text-white rounded-lg font-bold flex items-center gap-1 text-[11px] shadow transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" /> Receipt
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(p)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete Payment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                Record Received Payment
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              {/* Select Borewell */}
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Borewell Project <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedBorewellId}
                  onChange={(e) => setSelectedBorewellId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                >
                  {borewells.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.borewellCode} – {b.customerName} ({b.location})
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Amount Received (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-emerald-50 border-2 border-emerald-400 rounded-lg p-2 font-mono text-base font-black text-emerald-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Payment Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                  />
                </div>
              </div>

              {/* Method & Ref */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-semibold text-slate-900"
                  >
                    <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="Cash">Cash at Site</option>
                    <option value="Bank Transfer">NEFT / RTGS / IMPS</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Transaction / Ref #
                  </label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="e.g. UPI/2026/9886887"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-xs text-slate-900"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Payment Remarks
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Advance payment before rig setup / Final settlement"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Save &amp; Generate Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {activeReceipt && (
        <PaymentReceiptModal
          payment={activeReceipt}
          settings={settings}
          isOpen={Boolean(activeReceipt)}
          onClose={() => setActiveReceipt(null)}
        />
      )}
    </div>
  );
};
