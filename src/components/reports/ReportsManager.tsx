// Sri Balaji Borewells - Reports & Financial Analytics Module
import React from 'react';
import { BarChart3, DollarSign, Disc, AlertCircle, FileSpreadsheet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { repository } from '../../services/repository';
import { formatINR } from '../../utils/depthCalculator';
import { Logo } from '../common/Logo';

export const ReportsManager: React.FC = () => {
  const customers = repository.getCustomers();
  const borewells = repository.getBorewells();
  const bills = repository.getBills();
  const payments = repository.getPayments();
  const expenses = repository.getExpenses();

  const customerBills = bills.filter(b => b.billType === 'CUSTOMER');

  // Totals
  const totalDrillingFeet = borewells.reduce((sum, b) => sum + (Number(b.totalDepth) || 0), 0);
  const totalBilled = customerBills.reduce((sum, b) => sum + b.grandTotal, 0);
  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalPending = Math.max(0, totalBilled - totalCollected);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const estimatedGrossProfit = totalCollected - totalExpenses;

  const currentMonth = new Date();
  const cashFlow = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 5 + index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    return {
      key,
      label: new Intl.DateTimeFormat('en', { month: 'short' }).format(date),
      gained: payments
        .filter(payment => payment.paymentDate.startsWith(key))
        .reduce((sum, payment) => sum + payment.amount, 0),
      spent: expenses
        .filter(expense => expense.expenseDate.startsWith(key))
        .reduce((sum, expense) => sum + expense.amount, 0),
    };
  });
  const chartMax = Math.max(1, ...cashFlow.flatMap(month => [month.gained, month.spent]));
  const plotTop = 30;
  const plotBottom = 194;
  const plotLeft = 82;
  const plotRight = 790;
  const plotHeight = plotBottom - plotTop;
  const chartPoints = cashFlow.map((month, index) => ({
    ...month,
    x: plotLeft + (index * (plotRight - plotLeft)) / (cashFlow.length - 1),
    gainedY: plotBottom - (month.gained / chartMax) * plotHeight,
    spentY: plotBottom - (month.spent / chartMax) * plotHeight,
  }));
  const smoothPath = (points: Array<{ x: number; y: number }>) =>
    points.reduce((path, point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`;
      const previous = points[index - 1];
      const beforePrevious = points[index - 2] || previous;
      const next = points[index + 1] || point;
      const control1X = previous.x + (point.x - beforePrevious.x) / 6;
      const control1Y = previous.y + (point.y - beforePrevious.y) / 6;
      const control2X = point.x - (next.x - previous.x) / 6;
      const control2Y = point.y - (next.y - previous.y) / 6;
      return `${path} C ${control1X} ${control1Y}, ${control2X} ${control2Y}, ${point.x} ${point.y}`;
    }, '');
  const gainedLine = smoothPath(chartPoints.map(point => ({ x: point.x, y: point.gainedY })));
  const spentLine = smoothPath(chartPoints.map(point => ({ x: point.x, y: point.spentY })));
  const gainedArea = `${gainedLine} L ${plotRight} ${plotBottom} L ${plotLeft} ${plotBottom} Z`;
  const spentArea = `${spentLine} L ${plotRight} ${plotBottom} L ${plotLeft} ${plotBottom} Z`;
  const compactINR = (amount: number) => {
    if (amount >= 1_000_000) return `₹${(amount / 1_000_000).toFixed(1)}m`;
    if (amount >= 1_000) return `₹${(amount / 1_000).toFixed(0)}k`;
    return `₹${Math.round(amount)}`;
  };

  // Export to CSV Spreadsheet
  const handleExportCSV = () => {
    const headers = ['Borewell Code', 'Customer Name', 'Drilling Date', 'Total Depth (Ft)', 'Bill Amount (₹)', 'Amount Received (₹)', 'Pending Balance (₹)', 'Status'];
    const rows = borewells.map(b => {
      const bBills = customerBills.filter(bill => bill.borewellId === b.id);
      const bPayments = payments.filter(pay => pay.borewellId === b.id);
      const billed = bBills.reduce((sum, bill) => sum + bill.grandTotal, 0);
      const paid = bPayments.reduce((sum, pay) => sum + pay.amount, 0);
      const balance = Math.max(0, billed - paid);

      return [
        b.borewellCode,
        `"${b.customerName}"`,
        b.drillingDate,
        b.totalDepth,
        billed,
        paid,
        balance,
        b.status,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Sri_Balaji_Borewells_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Logo size="lg" className="shrink-0 p-1 bg-slate-50 border border-slate-200 rounded-xl" />
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Business Intelligence &amp; Reports</h1>
            <p className="text-xs text-slate-500">
              Real-time analytics for Sri Balaji Borewells drilling revenue, collections, and net profit
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export CSV Spreadsheet
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase mb-1">
            <span>Total Drilling Feet</span>
            <Disc className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            {totalDrillingFeet.toLocaleString()} Ft
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Across {borewells.length} borewell projects</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase mb-1">
            <span>Total Invoiced</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            {formatINR(totalBilled)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{customerBills.length} Customer bills generated</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase mb-1">
            <span>Collected Cash</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-600">
            {formatINR(totalCollected)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{payments.length} Payments recorded</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase mb-1">
            <span>Gross Cash Margin</span>
            <ArrowDownRight className="w-4 h-4 text-cyan-600" />
          </div>
          <div className={`text-2xl font-black font-mono ${estimatedGrossProfit >= 0 ? 'text-blue-900' : 'text-red-600'}`}>
            {formatINR(estimatedGrossProfit)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Collections minus expenses ({formatINR(totalExpenses)})</div>
        </div>
      </div>

      {/* Monthly Income and Expenses Chart */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              Income vs Expenses
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">Money gained from payments and spent on expenses · last 6 months</p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-full bg-green-600" />
              Income {formatINR(totalCollected)}
            </span>
            <span className="inline-flex items-center gap-1.5 font-semibold text-red-700">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              Expenses {formatINR(totalExpenses)}
            </span>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <svg
            viewBox="0 0 820 240"
            role="img"
            aria-label="Line chart comparing monthly income in green and expenses in red for the last six months"
            className="w-full min-w-[560px] h-56"
          >
            <defs>
              <linearGradient id="income-area" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#16a34a" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#16a34a" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="expense-area" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.24" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {[0, 0.25, 0.5, 0.75, 1].map(fraction => {
              const y = plotBottom - fraction * plotHeight;
              return (
                <g key={fraction}>
                  <line x1={plotLeft} y1={y} x2={plotRight} y2={y} stroke="#e2e8f0" strokeDasharray={fraction === 0 ? undefined : '3 4'} />
                  <text x="66" y={y + 4} textAnchor="end" fill="#64748b" fontSize="10">
                    {compactINR(chartMax * fraction)}
                  </text>
                </g>
              );
            })}
            <path d={gainedArea} fill="url(#income-area)" />
            <path d={spentArea} fill="url(#expense-area)" />
            <path d={gainedLine} fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" />
            <path d={spentLine} fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
            {chartPoints.map(month => {
              return (
                <g key={month.key}>
                  <circle cx={month.x} cy={month.gainedY} r="4.5" fill="#16a34a" stroke="white" strokeWidth="2">
                    <title>{`${month.label}: gained ${formatINR(month.gained)}`}</title>
                  </circle>
                  <circle cx={month.x} cy={month.spentY} r="4.5" fill="#ef4444" stroke="white" strokeWidth="2">
                    <title>{`${month.label}: spent ${formatINR(month.spent)}`}</title>
                  </circle>
                  <text x={month.x} y="218" textAnchor="middle" fill="#475569" fontSize="11" fontWeight="600">
                    {month.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        {totalCollected === 0 && totalExpenses === 0 && (
          <p className="text-center text-xs text-slate-500 mt-2">No payment or expense activity to chart yet.</p>
        )}
      </section>

      {/* Pending Balances Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            Customer Receivables &amp; Pending Payments Ledger
          </h2>
          <span className="text-xs font-bold text-amber-700 font-mono">
            Total Pending: {formatINR(totalPending)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                <th className="p-3">Customer Name</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Village / Area</th>
                <th className="p-3">Borewells</th>
                <th className="p-3 text-right">Total Billed</th>
                <th className="p-3 text-right">Total Paid</th>
                <th className="p-3 text-right">Balance Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map(c => {
                const cBills = customerBills.filter(b => b.customerId === c.id);
                const cPayments = payments.filter(p => p.customerId === c.id);
                const billed = cBills.reduce((sum, b) => sum + b.grandTotal, 0);
                const paid = cPayments.reduce((sum, p) => sum + p.amount, 0);
                const balance = Math.max(0, billed - paid);

                return (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{c.name}</td>
                    <td className="p-3 font-mono text-slate-700">{c.phone}</td>
                    <td className="p-3 text-slate-600">{c.village}, {c.taluk}</td>
                    <td className="p-3">
                      <span className="font-mono px-2 py-0.5 rounded bg-slate-100 font-bold">
                        {repository.getBorewellsByCustomerId(c.id).length}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-semibold">{formatINR(billed)}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-600">{formatINR(paid)}</td>
                    <td className={`p-3 text-right font-mono font-bold ${balance > 0 ? 'text-amber-600 text-sm' : 'text-slate-400'}`}>
                      {formatINR(balance)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
