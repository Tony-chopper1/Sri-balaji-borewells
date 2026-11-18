// Sri Balaji Borewells - Dedicated Borewell Container Modal
import React, { useState } from 'react';
import { X, Disc, FileText, CreditCard, UploadCloud, DollarSign, Printer, Plus, Settings, Layers, Calendar, MapPin } from 'lucide-react';
import { Borewell, Bill, Payment, DocumentRecord, ExpenseRecord } from '../../types';
import { repository } from '../../services/repository';
import { formatINR } from '../../utils/depthCalculator';
import { useAuth } from '../../context/AuthContext';

interface BorewellContainerModalProps {
  borewell: Borewell;
  isOpen: boolean;
  onClose: () => void;
  onSelectBill: (bill: Bill) => void;
  onGenerateBill: (borewell: Borewell, type: 'CUSTOMER' | 'OWNER') => void;
  onOpenPrint: (bill: Bill) => void;
  onAddPayment: (borewell: Borewell) => void;
  onUploadDocument: (borewell: Borewell) => void;
}

export const BorewellContainerModal: React.FC<BorewellContainerModalProps> = ({
  borewell,
  isOpen,
  onClose,
  onSelectBill,
  onGenerateBill,
  onOpenPrint,
  onAddPayment,
  onUploadDocument,
}) => {
  const { canEditRates } = useAuth();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'BILLS' | 'PAYMENTS' | 'DOCS' | 'EXPENSES' | 'RATES'>('OVERVIEW');

  if (!isOpen) return null;

  const bills = repository.getBillsByBorewellId(borewell.id);
  const payments = repository.getPaymentsByBorewellId(borewell.id);
  const documents = repository.getDocumentsByBorewellId(borewell.id);
  const expenses = repository.getExpenses().filter(e => e.borewellId === borewell.id);

  const customerBill = bills.find(b => b.billType === 'CUSTOMER');
  const ownerBill = bills.find(b => b.billType === 'OWNER');

  const totalBilled = customerBill ? customerBill.grandTotal : 0;
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const pendingBalance = Math.max(0, totalBilled - totalPaid);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl my-auto flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-start justify-between border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-600/30 text-cyan-400 flex items-center justify-center">
              <Disc className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold font-mono text-cyan-400">{borewell.borewellCode}</h2>
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                  borewell.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {borewell.status}
                </span>
                <span className="text-xs text-slate-300">
                  Customer: <span className="font-bold text-white">{borewell.customerName}</span>
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-red-400" /> {borewell.location}
                </span>
                <span className="flex items-center gap-1 font-mono text-cyan-300 font-bold">
                  Depth: {borewell.totalDepth} Feet
                </span>
                <span>Driller: {borewell.drillerName}</span>
                <span>Rig: {borewell.machineDetails}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Financial KPI Banner for this Borewell */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Bill Amount</span>
            <span className="text-base font-black text-slate-900">{formatINR(totalBilled)}</span>
          </div>
          <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Amount Received</span>
            <span className="text-base font-black text-emerald-600">{formatINR(totalPaid)}</span>
          </div>
          <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Pending Balance</span>
            <span className={`text-base font-black ${pendingBalance > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {formatINR(pendingBalance)}
            </span>
          </div>
          <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Borewell Expenses</span>
            <span className="text-base font-black text-rose-600">{formatINR(totalExpenses)}</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-white gap-2 overflow-x-auto text-xs">
          {[
            { id: 'OVERVIEW', label: 'Borewell Overview', icon: Disc },
            { id: 'BILLS', label: `Bills (${bills.length})`, icon: FileText },
            { id: 'PAYMENTS', label: `Payments (${payments.length})`, icon: CreditCard },
            { id: 'DOCS', label: `Documents (${documents.length})`, icon: UploadCloud },
            { id: 'EXPENSES', label: `Expenses (${expenses.length})`, icon: DollarSign },
            { id: 'RATES', label: 'Rate Snapshot', icon: Layers },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3.5 font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                  active
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 text-xs">
          {/* Overview */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <h3 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2">
                    Drilling Specifications
                  </h3>
                  <div className="space-y-1.5 text-slate-700">
                    <p><span className="text-slate-500">Borewell Code:</span> <strong className="font-mono text-slate-900">{borewell.borewellCode}</strong></p>
                    <p><span className="text-slate-500">Customer Name:</span> <strong>{borewell.customerName}</strong></p>
                    <p><span className="text-slate-500">Drilling Date:</span> <strong>{borewell.drillingDate}</strong></p>
                    <p><span className="text-slate-500">Location:</span> <strong>{borewell.location}</strong></p>
                    <p><span className="text-slate-500">Total Drilled Depth:</span> <strong className="text-blue-700 font-bold">{borewell.totalDepth} Feet</strong></p>
                    <p><span className="text-slate-500">Rock Strata Type:</span> <strong>{borewell.rockType}</strong></p>
                    <p><span className="text-slate-500">Rig Unit Machine:</span> <strong>{borewell.machineDetails}</strong></p>
                    <p><span className="text-slate-500">Driller Incharge:</span> <strong>{borewell.drillerName}</strong></p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2">
                      Dual Bill Generation Actions
                    </h3>
                    <p className="text-slate-500 text-xs mt-2">
                      Generate official customer invoices with casing and field add-ons, or internal owner statements for rig tracking.
                    </p>
                  </div>

                  <div className="space-y-2 mt-4">
                    <button
                      onClick={() => onGenerateBill(borewell, 'CUSTOMER')}
                      className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow"
                    >
                      <FileText className="w-4 h-4" /> Generate Customer Bill (Tax Invoice)
                    </button>
                    <button
                      onClick={() => onGenerateBill(borewell, 'OWNER')}
                      className="w-full py-2.5 px-4 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow"
                    >
                      <Layers className="w-4 h-4" /> Generate Owner Bill (Internal Statement)
                    </button>
                  </div>
                </div>
              </div>

              {borewell.remarks && (
                <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-blue-950">
                  <span className="font-bold">Borewell Remarks &amp; Water Yield: </span>
                  {borewell.remarks}
                </div>
              )}
            </div>
          )}

          {/* Bills Tab */}
          {activeTab === 'BILLS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 uppercase">Registered Bills for {borewell.borewellCode}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onGenerateBill(borewell, 'CUSTOMER')}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Customer Bill
                  </button>
                  <button
                    onClick={() => onGenerateBill(borewell, 'OWNER')}
                    className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-lg shadow flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Owner Bill
                  </button>
                </div>
              </div>

              {bills.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  No bills generated yet for this borewell.
                </div>
              ) : (
                <div className="space-y-3">
                  {bills.map(b => (
                    <div
                      key={b.id}
                      className="p-4 border border-slate-200 rounded-xl bg-white hover:border-blue-400 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold text-sm text-slate-900">{b.billNumber}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            b.billType === 'CUSTOMER' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {b.billType} BILL
                          </span>
                          <span className="text-slate-500">Date: {b.billDate}</span>
                        </div>
                        <div className="text-slate-600 mt-1">
                          Depth: <strong className="text-slate-900">{b.totalDepth} ft</strong> • Drilling Amount: {formatINR(b.calculation.drillingSubtotal)}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-mono font-black text-sm text-slate-900">{formatINR(b.grandTotal)}</div>
                          <div className="text-[11px] text-amber-600 font-bold">
                            Balance: {formatINR(b.pendingBalance)}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onOpenPrint(b)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-blue-600 text-white rounded-lg font-bold flex items-center gap-1 transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" /> Print / 4×6 / PDF
                          </button>
                          <button
                            onClick={() => onSelectBill(b)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold transition-colors"
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'PAYMENTS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 uppercase">Payment Receipts</span>
                <button
                  onClick={() => onAddPayment(borewell)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Record Payment
                </button>
              </div>

              {payments.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  No payments recorded for this borewell yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {payments.map(p => (
                    <div key={p.id} className="p-3.5 flex items-center justify-between bg-white">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-indigo-900">{p.receiptNumber}</span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">{p.paymentMethod}</span>
                          <span className="text-slate-500">{p.paymentDate}</span>
                        </div>
                        <p className="text-slate-600 mt-1">{p.remarks}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-base text-emerald-600">+{formatINR(p.amount)}</span>
                        <div className="text-[10px] text-slate-400">By: {p.recordedBy}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'DOCS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 uppercase">Borewell Linked Documents &amp; Photos</span>
                <button
                  onClick={() => onUploadDocument(borewell)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Upload Document
                </button>
              </div>

              {documents.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  No documents linked to this borewell.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {documents.map(d => (
                    <div key={d.id} className="p-3 border border-slate-200 rounded-xl bg-white flex items-start gap-3">
                      <img
                        src={d.fileUrl}
                        alt={d.title}
                        className="w-16 h-16 rounded-lg object-cover bg-slate-100 shrink-0 border"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-800 truncate">{d.title}</div>
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 uppercase font-semibold">
                          {d.category}
                        </span>
                        <div className="font-mono font-bold text-slate-900 mt-1">{formatINR(d.amount)}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{d.originalDocDate} • {d.remarks}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Expenses Tab */}
          {activeTab === 'EXPENSES' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 uppercase">Operational Expenses for {borewell.borewellCode}</span>
              </div>
              {expenses.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  No direct expenses logged for this borewell.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {expenses.map(e => (
                    <div key={e.id} className="p-3.5 flex items-center justify-between bg-white">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">{e.category}</span>
                          <span className="text-slate-500">{e.expenseDate}</span>
                        </div>
                        <p className="text-slate-700 mt-1">{e.description}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-sm text-rose-600">-{formatINR(e.amount)}</span>
                        <div className="text-[10px] text-slate-400">By: {e.createdBy}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Rates Snapshot Tab */}
          {activeTab === 'RATES' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Frozen Rate Configuration Snapshot for {borewell.borewellCode}
                </h3>
                <p className="text-slate-500">
                  This rate snapshot is permanently frozen with this borewell. Changing global rates in Settings will never affect these past bills.
                </p>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="p-2.5">Slab Range</th>
                      <th className="p-2.5 text-right">Rate / Foot</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {borewell.rateConfig.slabs.map((slab, idx) => (
                      <tr key={idx} className="bg-white">
                        <td className="p-2.5 font-medium text-slate-800">
                          {slab.fromFeet} ft to {slab.toFeet >= 9000 ? 'Onwards' : `${slab.toFeet} ft`}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-blue-800">
                          ₹{slab.ratePerFoot} / ft
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
