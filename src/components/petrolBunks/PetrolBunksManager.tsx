import React, { useState } from 'react';
import { CircleDollarSign, Fuel, MapPin, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { PetrolBunkPayment, PetrolBunkPurchase, PetrolBunkRecord } from '../../types';
import { repository } from '../../services/repository';
import { useAuth } from '../../context/AuthContext';
import { formatINR } from '../../utils/depthCalculator';

const emptyBunkForm = { name: '', address: '' };
const emptyPurchaseForm = {
  date: new Date().toISOString().split('T')[0],
  quantityLitres: '',
};
const emptyPaymentForm = {
  date: new Date().toISOString().split('T')[0],
  amount: '',
};

const formatDate = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString();

export const PetrolBunksManager: React.FC = () => {
  const { canDelete, currentUser } = useAuth();
  const [bunks, setBunks] = useState<PetrolBunkRecord[]>(() => repository.getPetrolBunks());
  const [searchTerm, setSearchTerm] = useState('');
  const [isBunkModalOpen, setIsBunkModalOpen] = useState(false);
  const [editingBunk, setEditingBunk] = useState<PetrolBunkRecord | null>(null);
  const [bunkForm, setBunkForm] = useState(emptyBunkForm);
  const [selectedBunk, setSelectedBunk] = useState<PetrolBunkRecord | null>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<PetrolBunkPurchase | null>(null);
  const [purchaseForm, setPurchaseForm] = useState(emptyPurchaseForm);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PetrolBunkPayment | null>(null);
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);

  const refreshBunks = () => setBunks([...repository.getPetrolBunks()]);
  const filteredBunks = bunks.filter(bunk => {
    const query = searchTerm.toLowerCase().trim();
    return !query || bunk.name.toLowerCase().includes(query) || bunk.address.toLowerCase().includes(query);
  });

  const closeBunkModal = () => {
    setIsBunkModalOpen(false);
    setEditingBunk(null);
    setBunkForm(emptyBunkForm);
  };

  const openAddBunkModal = () => {
    setEditingBunk(null);
    setBunkForm(emptyBunkForm);
    setIsBunkModalOpen(true);
  };

  const openEditBunkModal = (bunk: PetrolBunkRecord) => {
    setEditingBunk(bunk);
    setBunkForm({ name: bunk.name, address: bunk.address });
    setIsBunkModalOpen(true);
  };

  const handleSaveBunk = (event: React.FormEvent) => {
    event.preventDefault();
    if (!bunkForm.name.trim() || !bunkForm.address.trim()) {
      alert('Please enter the petrol bunk name and address.');
      return;
    }

    repository.savePetrolBunk({
      id: editingBunk?.id || `petrol-bunk-${Date.now()}`,
      name: bunkForm.name.trim(),
      address: bunkForm.address.trim(),
      purchases: editingBunk?.purchases || [],
      payments: editingBunk?.payments || [],
      createdBy: editingBunk?.createdBy || currentUser.name,
      createdDate: editingBunk?.createdDate || new Date().toISOString().split('T')[0],
    }, currentUser.name);
    closeBunkModal();
    refreshBunks();
  };

  const closePurchaseModal = () => {
    setIsPurchaseModalOpen(false);
    setEditingPurchase(null);
    setPurchaseForm(emptyPurchaseForm);
  };

  const openAddPurchaseModal = (bunk: PetrolBunkRecord) => {
    setSelectedBunk(bunk);
    setEditingPurchase(null);
    setPurchaseForm(emptyPurchaseForm);
    setIsPurchaseModalOpen(true);
  };

  const openEditPurchaseModal = (bunk: PetrolBunkRecord, purchase: PetrolBunkPurchase) => {
    setSelectedBunk(bunk);
    setEditingPurchase(purchase);
    setPurchaseForm({
      date: purchase.date,
      quantityLitres: String(purchase.quantityLitres),
    });
    setIsPurchaseModalOpen(true);
  };

  const closePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setEditingPayment(null);
    setPaymentForm(emptyPaymentForm);
  };

  const openAddPaymentModal = (bunk: PetrolBunkRecord) => {
    setSelectedBunk(bunk);
    setEditingPayment(null);
    setPaymentForm(emptyPaymentForm);
    setIsPaymentModalOpen(true);
  };

  const openEditPaymentModal = (bunk: PetrolBunkRecord, payment: PetrolBunkPayment) => {
    setSelectedBunk(bunk);
    setEditingPayment(payment);
    setPaymentForm({ date: payment.date, amount: String(payment.amount) });
    setIsPaymentModalOpen(true);
  };

  const handleSavePurchase = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedBunk || !purchaseForm.date || !purchaseForm.quantityLitres) {
      alert('Please enter the date and petrol quantity.');
      return;
    }

    const quantityLitres = Number(purchaseForm.quantityLitres);
    if (!Number.isFinite(quantityLitres) || quantityLitres < 0) {
      alert('Petrol quantity must be a valid non-negative number.');
      return;
    }

    const purchase: PetrolBunkPurchase = {
      id: editingPurchase?.id || `purchase-${Date.now()}`,
      date: purchaseForm.date,
      quantityLitres,
    };
    const purchases = editingPurchase
      ? selectedBunk.purchases.map(item => item.id === editingPurchase.id ? purchase : item)
      : [...selectedBunk.purchases, purchase];
    const updatedBunk = { ...selectedBunk, purchases };
    repository.savePetrolBunk(updatedBunk, currentUser.name);
    setSelectedBunk(updatedBunk);
    closePurchaseModal();
    refreshBunks();
  };

  const handleSavePayment = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedBunk || !paymentForm.date || !paymentForm.amount) {
      alert('Please enter the payment date and amount.');
      return;
    }

    const amount = Number(paymentForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      alert('Payment amount must be greater than zero.');
      return;
    }

    const payment: PetrolBunkPayment = {
      id: editingPayment?.id || `petrol-payment-${Date.now()}`,
      date: paymentForm.date,
      amount,
    };
    const payments = editingPayment
      ? selectedBunk.payments.map(item => item.id === editingPayment.id ? payment : item)
      : [...selectedBunk.payments, payment];
    const updatedBunk = { ...selectedBunk, payments };
    repository.savePetrolBunk(updatedBunk, currentUser.name);
    setSelectedBunk(updatedBunk);
    closePaymentModal();
    refreshBunks();
  };

  const handleDeletePurchase = (bunk: PetrolBunkRecord, purchase: PetrolBunkPurchase) => {
    if (!canDelete) {
      alert('Only the Owner can delete petrol purchase records.');
      return;
    }
    if (!window.confirm(`Delete the petrol entry dated ${formatDate(purchase.date)}?`)) return;
    const updatedBunk = {
      ...bunk,
      purchases: bunk.purchases.filter(item => item.id !== purchase.id),
    };
    repository.savePetrolBunk(updatedBunk, currentUser.name);
    setSelectedBunk(updatedBunk);
    refreshBunks();
  };

  const handleDeletePayment = (bunk: PetrolBunkRecord, payment: PetrolBunkPayment) => {
    if (!canDelete) {
      alert('Only the Owner can delete petrol payment records.');
      return;
    }
    if (!window.confirm(`Delete the payment dated ${formatDate(payment.date)}?`)) return;
    const updatedBunk = {
      ...bunk,
      payments: bunk.payments.filter(item => item.id !== payment.id),
    };
    repository.savePetrolBunk(updatedBunk, currentUser.name);
    setSelectedBunk(updatedBunk);
    refreshBunks();
  };

  const handleDeleteBunk = (bunk: PetrolBunkRecord) => {
    if (!canDelete) {
      alert('Only the Owner can delete petrol bunk records.');
      return;
    }
    if (!window.confirm(`Delete petrol bunk "${bunk.name}" and its purchase history?`)) return;
    repository.deletePetrolBunk(bunk.id, currentUser.name);
    if (selectedBunk?.id === bunk.id) setSelectedBunk(null);
    refreshBunks();
  };

  const sortedPurchases = (bunk: PetrolBunkRecord) =>
    [...bunk.purchases].sort((a, b) => a.date.localeCompare(b.date));

  const dateRange = (bunk: PetrolBunkRecord) => {
    const purchases = sortedPurchases(bunk);
    if (!purchases.length) return 'No entries';
    const first = purchases[0].date;
    const last = purchases[purchases.length - 1].date;
    return first === last ? formatDate(first) : `${formatDate(first)} – ${formatDate(last)}`;
  };

  const totalQuantity = (bunk: PetrolBunkRecord) =>
    bunk.purchases.reduce((total, purchase) => total + purchase.quantityLitres, 0);
  const totalPaid = (bunk: PetrolBunkRecord) =>
    bunk.payments.reduce((total, payment) => total + payment.amount, 0);

  return (
    <div className="space-y-4">
      <div className="bg-[#191f2d] rounded-2xl p-4 md:p-5 border border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Petrol Bunk Details</h1>
          <p className="text-xs text-slate-300">Track petrol quantities, date ranges, and separate payments for each petrol bunk.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="search"
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              placeholder="Search name or address..."
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <button
            onClick={openAddBunkModal}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-900 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
          >
            <Plus className="w-4 h-4" /> Add Petrol Bunk
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredBunks.length === 0 ? (
          <div className="p-10 text-center">
            <Fuel className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600">
              {bunks.length ? 'No petrol bunks match your search.' : 'No petrol bunk details added yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <th className="p-3.5">Petrol Bunk</th>
                  <th className="p-3.5">Address</th>
                  <th className="p-3.5">Dates</th>
                  <th className="p-3.5 text-right">Petrol Quantity</th>
                  <th className="p-3.5 text-right">Amount Paid</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBunks.map(bunk => (
                  <tr key={bunk.id} className="hover:bg-slate-50/70">
                    <td className="p-3.5 font-bold text-slate-900">
                      <span className="inline-flex items-center gap-2">
                        <Fuel className="w-4 h-4 text-amber-600" />
                        {bunk.name}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-700">
                      <span className="inline-flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" />
                        {bunk.address}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap text-slate-700">{dateRange(bunk)}</td>
                    <td className="p-3.5 text-right font-mono text-slate-700">{totalQuantity(bunk).toLocaleString()} L</td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-700">{formatINR(totalPaid(bunk))}</td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedBunk(bunk)}
                        className="px-2 py-1 text-slate-600 hover:text-amber-700 font-semibold"
                        title="View purchase history"
                      >
                        History
                      </button>
                      <button
                        onClick={() => openAddPurchaseModal(bunk)}
                        className="p-1.5 text-amber-700 hover:bg-amber-50 rounded-lg"
                        title="Add petrol entry"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openAddPaymentModal(bunk)}
                        className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg"
                        title="Record a separate payment"
                      >
                        <CircleDollarSign className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditBunkModal(bunk)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Edit petrol bunk"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteBunk(bunk)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete petrol bunk"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-700">
                  <td colSpan={3} className="p-3.5">Total active bunks: {filteredBunks.length}</td>
                  <td className="p-3.5 text-right">
                    Total consumed: {filteredBunks.reduce((sum, bunk) => sum + totalQuantity(bunk), 0).toLocaleString()} L
                  </td>
                  <td className="p-3.5 text-right text-emerald-700">
                    Paid: {formatINR(filteredBunks.reduce((sum, bunk) => sum + totalPaid(bunk), 0))}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {isBunkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Fuel className="w-5 h-5 text-amber-600" />
                {editingBunk ? 'Edit Petrol Bunk' : 'Add Petrol Bunk'}
              </h2>
              <button onClick={closeBunkModal} className="p-1 text-slate-400 hover:text-slate-800" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveBunk} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Petrol Bunk Name *</label>
                <input
                  required
                  autoFocus
                  value={bunkForm.name}
                  onChange={event => setBunkForm({ ...bunkForm, name: event.target.value })}
                  placeholder="e.g. Indian Oil - Chitradurga"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Address / Location *</label>
                <input
                  required
                  value={bunkForm.address}
                  onChange={event => setBunkForm({ ...bunkForm, address: event.target.value })}
                  placeholder="Street, area, town"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                />
              </div>
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button type="button" onClick={closeBunkModal} className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow">
                  {editingBunk ? 'Save Changes' : 'Save Petrol Bunk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedBunk && !isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">{selectedBunk.name} — History</h2>
                <p className="text-xs text-slate-500 mt-1">{selectedBunk.address}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAddPurchaseModal(selectedBunk)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Entry
                </button>
                <button
                  onClick={() => openAddPaymentModal(selectedBunk)}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <CircleDollarSign className="w-3.5 h-3.5" /> Add Payment
                </button>
                <button onClick={() => setSelectedBunk(null)} className="p-1 text-slate-400 hover:text-slate-800" aria-label="Close history">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="max-h-[65vh] overflow-y-auto space-y-6">
              <section>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-700">Petrol Quantity Entries</h3>
                {selectedBunk.purchases.length === 0 ? (
                  <p className="py-4 text-center text-xs text-slate-500">No petrol entries yet.</p>
                ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-600 border-b border-slate-200">
                      <th className="py-2">Date</th>
                      <th className="py-2 text-right">Quantity</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedPurchases(selectedBunk).map(purchase => (
                      <tr key={purchase.id}>
                        <td className="py-2.5">{formatDate(purchase.date)}</td>
                        <td className="py-2.5 text-right font-mono">{purchase.quantityLitres.toLocaleString()} L</td>
                        <td className="py-2.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => openEditPurchaseModal(selectedBunk, purchase)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 rounded"
                            title="Edit purchase"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {canDelete && (
                            <button
                              onClick={() => handleDeletePurchase(selectedBunk, purchase)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                              title="Delete purchase"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                )}
              </section>
              <section>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-700">Separate Payments</h3>
                {selectedBunk.payments.length === 0 ? (
                  <p className="py-4 text-center text-xs text-slate-500">No payments recorded yet.</p>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-600 border-b border-slate-200">
                        <th className="py-2">Payment Date</th>
                        <th className="py-2 text-right">Amount Paid</th>
                        <th className="py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[...selectedBunk.payments].sort((a, b) => a.date.localeCompare(b.date)).map(payment => (
                        <tr key={payment.id}>
                          <td className="py-2.5">{formatDate(payment.date)}</td>
                          <td className="py-2.5 text-right font-mono font-semibold">{formatINR(payment.amount)}</td>
                          <td className="py-2.5 text-right whitespace-nowrap">
                            <button
                              onClick={() => openEditPaymentModal(selectedBunk, payment)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 rounded"
                              title="Edit payment"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            {canDelete && (
                              <button
                                onClick={() => handleDeletePayment(selectedBunk, payment)}
                                className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                                title="Delete payment"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>
            </div>
          </div>
        </div>
      )}

      {isPurchaseModalOpen && selectedBunk && (
        <div className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h2 className="text-base font-bold text-slate-900">
                {editingPurchase ? 'Edit Petrol Entry' : 'Add Petrol Entry'} — {selectedBunk.name}
              </h2>
              <button onClick={closePurchaseModal} className="p-1 text-slate-400 hover:text-slate-800" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSavePurchase} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={purchaseForm.date}
                  onChange={event => setPurchaseForm({ ...purchaseForm, date: event.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Petrol Quantity (Litres) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={purchaseForm.quantityLitres}
                  onChange={event => setPurchaseForm({ ...purchaseForm, quantityLitres: event.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                />
              </div>
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button type="button" onClick={closePurchaseModal} className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow">
                  {editingPurchase ? 'Save Changes' : 'Save Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPaymentModalOpen && selectedBunk && (
        <div className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h2 className="text-base font-bold text-slate-900">
                {editingPayment ? 'Edit Payment' : 'Record Payment'} — {selectedBunk.name}
              </h2>
              <button onClick={closePaymentModal} className="p-1 text-slate-400 hover:text-slate-800" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSavePayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Payment Date *</label>
                <input
                  type="date"
                  required
                  value={paymentForm.date}
                  onChange={event => setPaymentForm({ ...paymentForm, date: event.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Amount Paid (₹) *</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={event => setPaymentForm({ ...paymentForm, amount: event.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                />
              </div>
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button type="button" onClick={closePaymentModal} className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl shadow">
                  {editingPayment ? 'Save Changes' : 'Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
