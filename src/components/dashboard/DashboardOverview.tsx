// Sri Balaji Borewells - Dashboard Overview & Real-Time Analytics
import React, { useState } from 'react';
import { 
  Users, 
  Disc, 
  FileText, 
  CreditCard, 
  UploadCloud, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  ArrowUpRight, 
  Calendar, 
  Plus, 
  Printer, 
  AlertTriangle,
  Layers,
  ChevronRight,
  Zap,
  Check
} from 'lucide-react';
import { repository } from '../../services/repository';
import { Bill, Customer, Borewell, Payment } from '../../types';
import { formatINR } from '../../utils/depthCalculator';

interface DashboardOverviewProps {
  onNavigate: (module: 'CUSTOMERS' | 'BOREWELLS' | 'BILLS' | 'PAYMENTS' | 'DOCS' | 'SETTINGS' | 'REPORTS') => void;
  onOpenGenerator: () => void;
  onOpenPrint: (bill: Bill) => void;
  onSelectCustomer: (c: Customer) => void;
  onSelectBorewell: (b: Borewell) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onNavigate,
  onOpenGenerator,
  onOpenPrint,
}) => {
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR'>('ALL');

  const borewells = repository.getBorewells();
  const bills = repository.getBills();
  const payments = repository.getPayments();
  const logs = repository.getActivityLogs();

  // Metrics
  const totalDrillingFeet = borewells.reduce((sum, b) => sum + (Number(b.totalDepth) || 0), 0);
  const completedBorewells = borewells.filter(b => b.status === 'Completed').length;

  const totalBilled = bills.reduce((sum, b) => sum + b.grandTotal, 0);
  const totalReceived = payments.reduce((sum, p) => sum + p.amount, 0);
  const pendingReceivables = Math.max(0, totalBilled - totalReceived);

  return (
    <div className="space-y-4">
      {/* Dark Hero Banner exactly matching design */}
      <div className="bg-[#181e2b] rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
            Sri Balaji Borewells<br className="hidden sm:inline" /> Dashboard
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Real-time drilling metrics, depth billing, collections &amp; field vouchers
          </p>
        </div>

        {/* Date Filters pill group & Quick Bill Generator Button */}
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full md:w-auto">
          <div className="flex bg-[#232b3d] p-1 rounded-full text-xs font-semibold text-slate-300 self-stretch sm:self-auto justify-between sm:justify-start">
            {[
              { id: 'ALL', label: 'All Time' },
              { id: 'TODAY', label: 'Today' },
              { id: 'WEEK', label: 'This Week' },
              { id: 'MONTH', label: 'This Month' },
              { id: 'YEAR', label: 'This Year' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setDateFilter(f.id as any)}
                className={`px-3 py-1 rounded-full transition-all text-xs cursor-pointer ${
                  dateFilter === f.id
                    ? 'bg-white text-slate-900 font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            onClick={onOpenGenerator}
            className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-full text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 fill-slate-900" />
            <span>Quick Bill Generator</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Depth Drilled */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              TOTAL DEPTH<br />DRILLED
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <Disc className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900">
              {totalDrillingFeet.toLocaleString()} Ft
            </div>
            <div className="mt-1 flex items-center gap-2 text-[11px]">
              <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                ✓ {completedBorewells} Done
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-600 font-medium">↑ 105 Ft vs lw</span>
            </div>
          </div>
        </div>

        {/* Total Bill Invoiced */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              TOTAL BILL<br />INVOICED
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900">
              {formatINR(totalBilled)}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
              <span>Across {bills.length} statements</span>
              <span className="text-emerald-600 font-medium">↑ +18.4%</span>
            </div>
          </div>
        </div>

        {/* Collected Cash */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              COLLECTED CASH
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-emerald-600">
              {formatINR(totalReceived)}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
              <span>{payments.length} verified receipt{payments.length === 1 ? '' : 's'}</span>
              <span className="text-emerald-600 font-medium">↑ +5.5%</span>
            </div>
          </div>
        </div>

        {/* Pending Receivables */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              PENDING<br />RECEIVABLES
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900">
              {formatINR(pendingReceivables)}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Remaining balance</span>
              <span className="text-amber-500 font-semibold">Due soon</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Split: Recent Bills & Recent Payment Receipts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Bills Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-600">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <h2 className="font-bold text-xs text-slate-800">Recent Bills &amp; Invoices</h2>
            </div>
            <button
              onClick={() => onNavigate('BILLS')}
              className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold"
            >
              View All ({bills.length}) →
            </button>
          </div>

          <div className="space-y-2">
            {bills.slice(0, 2).map(bill => (
              <div
                key={bill.id}
                onClick={() => onOpenPrint(bill)}
                className="p-3 rounded-xl border border-slate-100 bg-[#fbfcfd] hover:bg-slate-50 flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{bill.billNumber}</span>
                      <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {bill.drillingLocation ? bill.drillingLocation.split(',')[0].toUpperCase() : 'SITE'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {bill.customerName} {bill.customerPhone ? `(${bill.customerPhone})` : ''} • {bill.totalDepth} ft @ ₹220/ft • {bill.billDate}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-bold text-xs text-slate-900">{formatINR(bill.grandTotal)}</div>
                  <div className={`text-[10px] font-semibold mt-0.5 ${
                    bill.pendingBalance <= 0 ? 'text-emerald-600' : 'text-amber-600'
                  }`}>
                    {bill.pendingBalance <= 0 ? 'Paid in Full' : `Bal: ${formatINR(bill.pendingBalance)}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Payment Receipts */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <CreditCard className="w-3.5 h-3.5" />
                </div>
                <h2 className="font-bold text-xs text-slate-800">Recent Payment Receipts</h2>
              </div>
              <button
                onClick={() => onNavigate('PAYMENTS')}
                className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold"
              >
                View All ({payments.length}) →
              </button>
            </div>

            <div className="space-y-2">
              {payments.slice(0, 1).map(p => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl border border-slate-100 bg-[#fbfcfd] flex items-center justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{p.receiptNumber}</span>
                        <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          VERIFIED
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Cash settlement for {p.billNumber || 'BILL-2026-001'} • {p.paymentDate}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-bold text-xs text-emerald-600">+{formatINR(p.amount)}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Field Collect</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Record Receipt banner exactly as in screenshot */}
          <div className="mt-3 p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Need to collect or log another transaction?</span>
            <button
              onClick={() => onNavigate('PAYMENTS')}
              className="px-3 py-1 bg-[#181e2b] hover:bg-slate-800 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 transition-all cursor-pointer shadow-sm"
            >
              <span>+ Record Receipt</span>
            </button>
          </div>
        </div>
      </div>

      {/* Activity Logs & Audit Ribbon */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            RECENT STAFF ACTIONS &amp; SYSTEM AUDIT
          </span>
          <span className="text-[11px] text-slate-400">Last synced today</span>
        </div>

        <div className="space-y-2">
          {logs.slice(0, 3).map((log, idx) => {
            const isPayment = log.module === 'Payment' || log.action.includes('Payment');
            const isPetrol = log.module === 'Petrol Bunk' || log.action.includes('Petrol');
            const badgeBg = isPayment ? 'bg-slate-100 text-slate-700' : (isPetrol ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700');
            const badgeLabel = isPayment ? 'PAYMENT' : (isPetrol ? 'PETROL BUNK' : 'DRILLING');

            return (
              <div key={log.id || idx} className="flex flex-col sm:flex-row sm:items-center justify-between text-xs py-1.5 border-b border-slate-50 last:border-0 gap-1 sm:gap-4">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-wider shrink-0 ${badgeBg}`}>
                    {badgeLabel}
                  </span>
                  <span className="text-slate-800 font-semibold truncate">
                    {log.details || `${log.action} performed`}
                  </span>
                </div>
                <span className="text-slate-400 text-[11px] shrink-0 font-mono">
                  {log.timestamp || '15 Nov 2026 • 03:44'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
