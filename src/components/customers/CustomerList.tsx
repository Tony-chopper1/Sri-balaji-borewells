// Sri Balaji Borewells - Customer Management List View
import React, { useState } from 'react';
import { UserPlus, Search, Phone, MapPin, Disc, ChevronRight, Edit2, Trash2, Eye } from 'lucide-react';
import { Customer, Borewell } from '../../types';
import { repository } from '../../services/repository';
import { useAuth } from '../../context/AuthContext';
import { CustomerDetailModal } from './CustomerDetailModal';
import { AddCustomerModal } from './AddCustomerModal';

interface CustomerListProps {
  onSelectBorewell: (b: Borewell) => void;
  onSelectBill: (bill: any) => void;
  onCreateBorewellForCustomer: (c: Customer) => void;
  onGenerateBillForBorewell: (b: Borewell) => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({
  onSelectBorewell,
  onSelectBill,
  onCreateBorewellForCustomer,
  onGenerateBillForBorewell,
}) => {
  const { canDelete, currentUser } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>(() => repository.getCustomers());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVillageFilter, setSelectedVillageFilter] = useState<string>('ALL');

  const [activeCustomerDetail, setActiveCustomerDetail] = useState<Customer | null>(null);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const refreshCustomers = () => {
    setCustomers([...repository.getCustomers()]);
  };

  const villages = Array.from(new Set(customers.map(c => c.village))).filter(Boolean);

  const filteredCustomers = customers.filter(c => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.customerCode.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.altPhone && c.altPhone.includes(q)) ||
      c.village.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q);

    const matchesVillage = selectedVillageFilter === 'ALL' || c.village === selectedVillageFilter;
    return matchesSearch && matchesVillage;
  });

  const handleDelete = (c: Customer) => {
    if (!canDelete) {
      alert('Only the Owner can delete customer records.');
      return;
    }
    const confirmed = window.confirm(`Are you sure you want to permanently delete customer ${c.name} (${c.customerCode})?`);
    if (!confirmed) return;

    try {
      repository.deleteCustomer(c.id, currentUser.name);
      refreshCustomers();
    } catch (err: any) {
      alert(err.message || 'Error deleting customer');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Controls Card */}
      <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Customer Directory</h1>
          <p className="text-xs text-slate-500">
            Manage farmers, commercial clients, and their borewell projects
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
              placeholder="Search name, phone, village..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Village Filter */}
          <select
            value={selectedVillageFilter}
            onChange={(e) => setSelectedVillageFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Villages</option>
            {villages.map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>

          {/* Add Customer Button */}
          <button
            onClick={() => {
              setCustomerToEdit(null);
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2 bg-[#191f2d] hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Add Customer
          </button>
        </div>
      </div>

      {/* Customers Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="p-3.5">Customer Code</th>
                <th className="p-3.5">Name</th>
                <th className="p-3.5">Phone Details</th>
                <th className="p-3.5">Location &amp; Village</th>
                <th className="p-3.5 text-center">Borewells</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No customers found matching your search.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(customer => {
                  const borewells = repository.getBorewellsByCustomerId(customer.id);
                  return (
                    <tr key={customer.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-blue-900">
                        {customer.customerCode}
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 text-sm">{customer.name}</div>
                        {customer.remarks && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">{customer.remarks}</div>
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="font-mono text-slate-800 font-medium">📞 {customer.phone}</div>
                        {customer.altPhone && (
                          <div className="font-mono text-slate-500 text-[11px]">Alt: {customer.altPhone}</div>
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-800">📍 {customer.village}</div>
                        <div className="text-[11px] text-slate-500">{customer.taluk}, {customer.district}</div>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-xs">
                          <Disc className="w-3 h-3" />
                          {borewells.length}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setActiveCustomerDetail(customer)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Customer Overview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setCustomerToEdit(customer);
                              setIsAddModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit Details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(customer)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => onCreateBorewellForCustomer(customer)}
                            className="ml-1 px-2.5 py-1 bg-slate-900 hover:bg-blue-600 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            + Borewell
                          </button>
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

      {/* Customer Detail Modal */}
      {activeCustomerDetail && (
        <CustomerDetailModal
          customer={activeCustomerDetail}
          isOpen={Boolean(activeCustomerDetail)}
          onClose={() => setActiveCustomerDetail(null)}
          onSelectBorewell={onSelectBorewell}
          onSelectBill={onSelectBill}
          onCreateBorewellForCustomer={onCreateBorewellForCustomer}
          onGenerateBillForBorewell={onGenerateBillForBorewell}
        />
      )}

      {/* Add / Edit Modal */}
      <AddCustomerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        customerToEdit={customerToEdit}
        onCustomerSaved={() => {
          refreshCustomers();
        }}
      />
    </div>
  );
};
