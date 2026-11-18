// Sri Balaji Borewells - Bills Management List (Customer Bills and Owner Bills)
import React, { useState } from 'react';
import { FileText, Printer, Search, Plus, Filter, Trash2, Eye, Download, User, Disc, Pencil, Check, X } from 'lucide-react';
import { Bill, BillType } from '../../types';
import { repository } from '../../services/repository';
import { formatINR } from '../../utils/depthCalculator';
import { useAuth } from '../../context/AuthContext';

interface BillsListProps {
  onOpenPrint: (bill: Bill) => void;
  onOpenGenerator: (type?: BillType) => void;
  onSelectBill: (bill: Bill) => void;
}

export const BillsList: React.FC<BillsListProps> = ({
  onOpenPrint,
  onOpenGenerator,
  onSelectBill,
}) => {
  const { canDelete, currentUser } = useAuth();
  const [bills, setBills] = useState<Bill[]>(() => repository.getBills());
  const [searchTerm, setSearchTerm] = useState('');
  const [billTypeFilter, setBillTypeFilter] = useState<'ALL' | 'CUSTOMER' | 'OWNER' | 'REBORE'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Paid' | 'Partial' | 'Unpaid'>('ALL');
  const [editingPaidBillId, setEditingPaidBillId] = useState<string | null>(null);
  const [paidDraft, setPaidDraft] = useState<number>(0);
  const [editingManagerBillId, setEditingManagerBillId] = useState<string | null>(null);
  const [managerDraft, setManagerDraft] = useState<string>('');

  const refreshBills = () => {
    setBills([...repository.getBills()]);
  };

  const handleSavePaidEdit = (bill: Bill) => {
    const updated = repository.updateBillPaymentAmount(bill.id, paidDraft, currentUser.name);
    if (updated) {
      refreshBills();
      setEditingPaidBillId(null);
      setPaidDraft(0);
    }
  };

  const handleSaveManagerEdit = (bill: Bill) => {
    const trimmed = managerDraft.trim();
    if (!trimmed) {
      alert('Manager name cannot be empty.');
      return;
    }

    const updated = [...bills];
    const index = updated.findIndex(item => item.id === bill.id);
    if (index >= 0) {
      updated[index] = { ...updated[index], managerName: trimmed };
      repository.saveBill(updated[index], currentUser.name);
      refreshBills();
      setEditingManagerBillId(null);
      setManagerDraft('');
    }
  };

  const filteredBills = bills.filter(b => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      b.billNumber.toLowerCase().includes(q) ||
      b.customerName.toLowerCase().includes(q) ||
      b.borewellCode.toLowerCase().includes(q) ||
      b.drillingLocation.toLowerCase().includes(q) ||
      b.totalDepth.toString() === q;

    const matchesType = billTypeFilter === 'ALL' || b.billType === billTypeFilter;
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleDelete = (bill: Bill) => {
    if (!canDelete) {
      alert('Only the Owner is authorized to delete bills.');
      return;
    }
    const confirmed = window.confirm(`Are you sure you want to delete ${bill.billNumber}?`);
    if (!confirmed) return;

    repository.deleteBill(bill.id, currentUser.name);
    refreshBills();
  };

  return (
    <div className="space-y-4">
      {/* Top Controls Card */}
      <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Billing &amp; Statements</h1>
          <p className="text-xs text-slate-500">
            Separate Customer Invoices and Internal Owner Drilling Statements
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 md:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search bill #, customer, BW code..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Type Filter */}
          <select
            value={billTypeFilter}
            onChange={(e) => setBillTypeFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Bill Types</option>
            <option value="CUSTOMER">Customer Bills Only</option>
            <option value="OWNER">Owner Statements Only</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Status</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Partial">Partial</option>
            <option value="Paid">Fully Paid</option>
          </select>

          {/* Generate Button */}
          <button
            onClick={() => onOpenGenerator('CUSTOMER')}
            className="px-4 py-2 bg-[#191f2d] hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Bill
          </button>
        </div>
      </div>

      {/* Bills Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="p-3.5">Bill Number</th>
                <th className="p-3.5">Customer &amp; Borewell</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Manager</th>
                <th className="p-3.5 text-right">Depth</th>
                <th className="p-3.5 text-right">Grand Total</th>
                <th className="p-3.5 text-right">Paid</th>
                <th className="p-3.5 text-right">Pending Balance</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    No bills found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredBills.map(bill => {
                  const isEditingPaid = editingPaidBillId === bill.id;
                  const isEditingManager = editingManagerBillId === bill.id;
                  return (
                    <tr key={bill.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-slate-900 text-sm">
                        {bill.billNumber}
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{bill.customerName}</div>
                        <div className="font-mono text-xs text-cyan-800 font-semibold">{bill.borewellCode}</div>
                      </td>
                      <td className="p-3.5 text-slate-600 whitespace-nowrap">
                        {bill.billDate}
                      </td>
                      <td className="p-3.5 text-slate-700 whitespace-nowrap">
                        {isEditingManager ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={managerDraft}
                              onChange={(e) => setManagerDraft(e.target.value)}
                              className="w-28 rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              onClick={() => handleSaveManagerEdit(bill)}
                              className="p-1 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Save manager"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingManagerBillId(null);
                                setManagerDraft('');
                              }}
                              className="p-1 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span>{bill.managerName || bill.createdBy || '—'}</span>
                            <button
                              onClick={() => {
                                setEditingManagerBillId(bill.id);
                                setManagerDraft(bill.managerName || bill.createdBy || '');
                              }}
                              className="p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors"
                              title="Edit manager"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 text-right font-mono font-semibold text-slate-800">
                        {bill.totalDepth} ft
                      </td>
                      <td className="p-3.5 text-right font-mono font-black text-slate-900 text-sm">
                        {formatINR(bill.grandTotal)}
                      </td>
                      <td className="p-3.5 text-right">
                        {isEditingPaid ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <input
                              type="number"
                              min={0}
                              step="1"
                              value={paidDraft}
                              onChange={(e) => setPaidDraft(Number(e.target.value) || 0)}
                              className="w-24 rounded-lg border border-slate-300 bg-white px-2 py-1 text-right font-mono font-bold text-emerald-700 text-[11px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              onClick={() => handleSavePaidEdit(bill)}
                              className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Save paid amount"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingPaidBillId(null);
                                setPaidDraft(0);
                              }}
                              className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="font-mono font-bold text-emerald-600">
                              {formatINR(bill.amountReceived)}
                            </span>
                            <button
                              onClick={() => {
                                setEditingPaidBillId(bill.id);
                                setPaidDraft(bill.amountReceived);
                              }}
                              className="p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors"
                              title="Edit paid amount"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-amber-600">
                        {formatINR(bill.pendingBalance)}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          bill.status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : (bill.status === 'Partial' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800')
                        }`}>
                          {bill.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenPrint(bill)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-blue-600 text-white rounded-lg font-bold flex items-center gap-1 text-[11px] shadow transition-colors cursor-pointer"
                            title="Open 4x6 / A4 Print Preview"
                          >
                            <Printer className="w-3.5 h-3.5" /> Print / 4×6
                          </button>
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(bill)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Bill"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
