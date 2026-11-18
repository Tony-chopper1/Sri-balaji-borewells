// Sri Balaji Borewells - Expense Management Module
import React, { useState } from 'react';
import { DollarSign, Plus, Search, Filter, Trash2, Fuel, Wrench, Truck, Package, Users, Disc, X } from 'lucide-react';
import { ExpenseRecord, ExpenseCategory, Borewell } from '../../types';
import { repository } from '../../services/repository';
import { formatINR } from '../../utils/depthCalculator';
import { useAuth } from '../../context/AuthContext';

export const ExpensesManager: React.FC = () => {
  const { canDelete, currentUser } = useAuth();
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => repository.getExpenses());
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [scopeFilter, setScopeFilter] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const borewells = repository.getBorewells();
  const [amount, setAmount] = useState<number>(3500);
  const [category, setCategory] = useState<ExpenseCategory>('Fuel');
  const [expenseDate, setExpenseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>('');
  const [selectedBorewellId, setSelectedBorewellId] = useState<string>('general');

  const refreshExpenses = () => {
    setExpenses([...repository.getExpenses()]);
  };

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

  const filteredExpenses = expenses.filter(e => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      e.description.toLowerCase().includes(q) ||
      (e.borewellCode && e.borewellCode.toLowerCase().includes(q)) ||
      e.category.toLowerCase().includes(q);

    const matchesCat = categoryFilter === 'ALL' || e.category === categoryFilter;
    const matchesScope = scopeFilter === 'ALL'
      || (scopeFilter === 'GENERAL' ? !e.borewellId && !e.borewellCode : e.borewellId === scopeFilter);
    return matchesSearch && matchesCat && matchesScope;
  });

  const handleDelete = (exp: ExpenseRecord) => {
    if (!canDelete) {
      alert('Only the Owner can delete expense entries.');
      return;
    }
    const confirmed = window.confirm(`Delete expense "${exp.description}" (${formatINR(exp.amount)})?`);
    if (!confirmed) return;

    repository.deleteExpense(exp.id, currentUser.name);
    refreshExpenses();
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      alert('Please enter expense description');
      return;
    }

    const isBw = selectedBorewellId !== 'general';
    const targetBw = isBw ? borewells.find(b => b.id === selectedBorewellId) : null;

    const newExp: ExpenseRecord = {
      id: `exp-${Date.now()}`,
      expenseDate,
      category,
      amount: Number(amount),
      borewellId: targetBw?.id,
      borewellCode: targetBw?.borewellCode,
      description: description.trim(),
      createdBy: currentUser.name,
      createdDate: new Date().toISOString().split('T')[0],
    };

    repository.saveExpense(newExp, currentUser.name);
    setIsAddModalOpen(false);
    setDescription('');
    refreshExpenses();
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Operational Expenses</h1>
          <p className="text-xs text-slate-500">
            Total business &amp; rig expenditures recorded: <strong className="text-amber-700">{formatINR(totalExpense)}</strong>
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
              placeholder="Search description, category, borewell..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Categories</option>
            <option value="Fuel">Fuel (Diesel / Oil)</option>
            <option value="Labour">Labour &amp; Crew Batta</option>
            <option value="Repairs">Repairs &amp; Spares</option>
            <option value="Transport">Transport &amp; Toll</option>
            <option value="Materials">Materials</option>
            <option value="Equipment">Equipment</option>
            <option value="Other">Other</option>
          </select>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-[#191f2d] hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Record Expense
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <span className="mr-1 shrink-0 text-[10px] font-bold uppercase tracking-wide text-slate-500">Quick filters</span>
        {[
          { id: 'ALL', label: `All (${formatINR(totalExpense)})` },
          ...borewells.map(borewell => ({
            id: borewell.id,
            label: `${borewell.machineDetails.split(' ')[0] || borewell.borewellCode} (${formatINR(expenses.filter(expense => expense.borewellId === borewell.id).reduce((total, expense) => total + expense.amount, 0))})`,
          })),
          { id: 'GENERAL', label: `General (${formatINR(expenses.filter(expense => !expense.borewellId && !expense.borewellCode).reduce((total, expense) => total + expense.amount, 0))})` },
        ].map(option => (
          <button
            key={option.id}
            type="button"
            onClick={() => setScopeFilter(option.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors ${
              scopeFilter === option.id ? 'bg-[#191f2d] text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Description</th>
                <th className="p-3.5">Connected Borewell</th>
                <th className="p-3.5 text-right">Amount (₹)</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 text-slate-600 whitespace-nowrap">{exp.expenseDate}</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 bg-slate-100 rounded-full text-slate-800 font-semibold text-[11px]">
                        {exp.category}
                      </span>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-900">{exp.description}</td>
                    <td className="p-3.5">
                      {exp.borewellCode ? (
                        <span className="font-mono text-cyan-800 font-bold">{exp.borewellCode}</span>
                      ) : (
                        <span className="text-slate-400 italic">General Overhead</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right font-mono font-black text-amber-700 text-sm">
                      -{formatINR(exp.amount)}
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(exp)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-rose-600" />
                Record Business Expense
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Expense Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-semibold text-slate-900"
                >
                  <option value="Fuel">Fuel (Diesel / Engine Oil)</option>
                  <option value="Labour">Labour &amp; Crew Batta</option>
                  <option value="Repairs">Repairs &amp; Maintenance</option>
                  <option value="Transport">Transport &amp; Toll</option>
                  <option value="Materials">Materials &amp; Hardware</option>
                  <option value="Equipment">Equipment &amp; Bits</option>
                  <option value="Other">Other Expenses</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-rose-50 border-2 border-rose-400 rounded-lg p-2 font-mono text-base font-black text-rose-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Connect to Borewell Project
                </label>
                <select
                  value={selectedBorewellId}
                  onChange={(e) => setSelectedBorewellId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-semibold text-slate-900"
                >
                  <option value="general">General Workshop / Company Overhead</option>
                  {borewells.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.borewellCode} – {b.customerName} ({b.location})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. 150 Ltr diesel for Rig-104 compressor"
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
                  className="px-5 py-2.5 bg-[#191f2d] hover:bg-slate-800 text-white font-bold rounded-xl shadow flex items-center gap-1.5"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
