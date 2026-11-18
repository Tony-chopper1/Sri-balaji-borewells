// Sri Balaji Borewells - Customer Detail Modal (Connected Borewells, Bills, Payments, Documents)
import React, { useState } from 'react';
import { X, User, Phone, MapPin, Disc, FileText, CreditCard, UploadCloud, Plus, Calendar } from 'lucide-react';
import { Customer, Borewell, Bill, Payment, DocumentRecord } from '../../types';
import { repository } from '../../services/repository';
import { formatINR } from '../../utils/depthCalculator';

interface CustomerDetailModalProps {
  customer: Customer;
  isOpen: boolean;
  onClose: () => void;
  onSelectBorewell: (b: Borewell) => void;
  onSelectBill: (bill: Bill) => void;
  onCreateBorewellForCustomer: (c: Customer) => void;
  onGenerateBillForBorewell: (b: Borewell) => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  customer,
  isOpen,
  onClose,
  onSelectBorewell,
  onSelectBill,
  onCreateBorewellForCustomer,
  onGenerateBillForBorewell,
}) => {
  const [activeTab, setActiveTab] = useState<'BOREWELLS' | 'BILLS' | 'PAYMENTS' | 'DOCUMENTS'>('BOREWELLS');

  if (!isOpen) return null;

  const borewells = repository.getBorewellsByCustomerId(customer.id);
  const bills = repository.getBills().filter(b => b.customerId === customer.id);
  const payments = repository.getPayments().filter(p => p.customerId === customer.id);
  const documents = repository.getDocuments().filter(d => d.customerId === customer.id);

  const totalBilled = bills.filter(b => b.billType === 'CUSTOMER').reduce((sum, b) => sum + b.grandTotal, 0);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const pendingBalance = Math.max(0, totalBilled - totalPaid);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl my-auto flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-start justify-between border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/30 text-blue-400 flex items-center justify-center text-xl font-black">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-white">{customer.name}</h2>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-semibold">
                  {customer.customerCode}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 mt-1">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-blue-400" /> {customer.phone} {customer.altPhone ? `| ${customer.altPhone}` : ''}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-red-400" /> {customer.village}, {customer.taluk}, {customer.district}
                </span>
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

        {/* Customer Balance KPI Ribbon */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Borewells</span>
            <span className="text-lg font-black text-slate-900">{borewells.length} Projects</span>
          </div>
          <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Billed</span>
            <span className="text-lg font-black text-slate-900">{formatINR(totalBilled)}</span>
          </div>
          <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Paid</span>
            <span className="text-lg font-black text-emerald-600">{formatINR(totalPaid)}</span>
          </div>
          <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Pending Balance</span>
            <span className={`text-lg font-black ${pendingBalance > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {formatINR(pendingBalance)}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-white gap-2">
          {[
            { id: 'BOREWELLS', label: `Borewells (${borewells.length})`, icon: Disc },
            { id: 'BILLS', label: `Bills & Statements (${bills.length})`, icon: FileText },
            { id: 'PAYMENTS', label: `Payment History (${payments.length})`, icon: CreditCard },
            { id: 'DOCUMENTS', label: `Documents (${documents.length})`, icon: UploadCloud },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
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

        {/* Tab Content Area */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Borewells Tab */}
          {activeTab === 'BOREWELLS' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-700 uppercase">Customer Borewell Projects</span>
                <button
                  onClick={() => {
                    onClose();
                    onCreateBorewellForCustomer(customer);
                  }}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow hover:bg-blue-500"
                >
                  <Plus className="w-3.5 h-3.5" /> New Borewell
                </button>
              </div>

              {borewells.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs">
                  No borewell projects registered yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {borewells.map(b => (
                    <div
                      key={b.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 shadow-sm transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-sm text-blue-900">{b.borewellCode}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          b.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {b.status}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-slate-600 space-y-1">
                        <p>📍 Location: <span className="font-medium text-slate-800">{b.location}</span></p>
                        <p>📏 Total Depth: <span className="font-bold text-slate-900">{b.totalDepth} Feet</span></p>
                        <p>🚜 Machine: {b.machineDetails} (Driller: {b.drillerName})</p>
                        <p>🪨 Rock: {b.rockType}</p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <button
                          onClick={() => {
                            onClose();
                            onSelectBorewell(b);
                          }}
                          className="text-xs text-blue-600 font-bold hover:underline"
                        >
                          View Borewell Container →
                        </button>
                        <button
                          onClick={() => {
                            onClose();
                            onGenerateBillForBorewell(b);
                          }}
                          className="text-xs text-emerald-600 font-bold hover:underline"
                        >
                          Generate Bill
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Bills Tab */}
          {activeTab === 'BILLS' && (
            <div className="space-y-3">
              {bills.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs">
                  No bills generated yet for this customer.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {bills.map(b => (
                    <div
                      key={b.id}
                      onClick={() => {
                        onClose();
                        onSelectBill(b);
                      }}
                      className="p-3.5 hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-slate-900">{b.billNumber}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            b.billType === 'CUSTOMER' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {b.billType} Bill
                          </span>
                          <span className="text-xs text-slate-500">Date: {b.billDate}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Borewell: <span className="font-mono text-slate-700">{b.borewellCode}</span> • Depth: {b.totalDepth} ft
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-sm text-slate-900">{formatINR(b.grandTotal)}</div>
                        <div className="text-xs text-amber-600 font-semibold">
                          Balance: {formatINR(b.pendingBalance)}
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
            <div className="space-y-3">
              {payments.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs">
                  No payment transactions recorded yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {payments.map(p => (
                    <div key={p.id} className="p-3.5 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-indigo-900">{p.receiptNumber}</span>
                          <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold">
                            {p.paymentMethod}
                          </span>
                          <span className="text-xs text-slate-500">{p.paymentDate}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{p.remarks}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-sm text-emerald-600">+{formatINR(p.amount)}</span>
                        <div className="text-[10px] text-slate-400">Recorded by: {p.recordedBy}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'DOCUMENTS' && (
            <div className="space-y-3">
              {documents.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs">
                  No external bills or photos uploaded for this customer.
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
                        <div className="font-bold text-xs text-slate-800 truncate">{d.title}</div>
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 uppercase font-semibold">
                          {d.category}
                        </span>
                        <div className="text-xs font-mono font-bold text-slate-900 mt-1">{formatINR(d.amount)}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{d.originalDocDate}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
