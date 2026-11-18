// Sri Balaji Borewells - Add / Edit Customer Modal with Accidental Duplicate Detection
import React, { useState, useEffect } from 'react';
import { X, UserPlus, AlertCircle, Check, Phone, MapPin } from 'lucide-react';
import { Customer } from '../../types';
import { repository } from '../../services/repository';
import { useAuth } from '../../context/AuthContext';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerSaved: (customer: Customer) => void;
  customerToEdit?: Customer | null;
}

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  isOpen,
  onClose,
  onCustomerSaved,
  customerToEdit,
}) => {
  const { currentUser } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [village, setVillage] = useState('');
  const [city, setCity] = useState('Chitradurga');
  const [taluk, setTaluk] = useState('Chitradurga');
  const [district, setDistrict] = useState('Chitradurga');
  const [fullAddress, setFullAddress] = useState('');
  const [remarks, setRemarks] = useState('');

  const [duplicateWarning, setDuplicateWarning] = useState<Customer | null>(null);

  useEffect(() => {
    if (customerToEdit) {
      setName(customerToEdit.name);
      setPhone(customerToEdit.phone);
      setAltPhone(customerToEdit.altPhone || '');
      setVillage(customerToEdit.village);
      setCity(customerToEdit.city);
      setTaluk(customerToEdit.taluk);
      setDistrict(customerToEdit.district);
      setFullAddress(customerToEdit.fullAddress);
      setRemarks(customerToEdit.remarks || '');
    } else {
      setName('');
      setPhone('');
      setAltPhone('');
      setVillage('');
      setCity('Chitradurga');
      setTaluk('Chitradurga');
      setDistrict('Chitradurga');
      setFullAddress('');
      setRemarks('');
    }
    setDuplicateWarning(null);
  }, [customerToEdit, isOpen]);

  // Real-time check for accidental duplicates
  useEffect(() => {
    if (!customerToEdit && (phone.trim().length >= 10 || (name.trim().length >= 4 && village.trim().length >= 3))) {
      const match = repository.findDuplicateCustomer(phone, name);
      setDuplicateWarning(match);
    } else {
      setDuplicateWarning(null);
    }
  }, [phone, name, village, customerToEdit]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !phone.trim() || !village.trim()) {
      alert('Please fill all mandatory fields: Customer Name, Phone, and Village.');
      return;
    }

    // If duplicate warning exists and user hasn't overridden
    if (duplicateWarning && !customerToEdit) {
      const proceed = window.confirm(
        `Warning: A customer named "${duplicateWarning.name}" with phone "${duplicateWarning.phone}" already exists (${duplicateWarning.customerCode}). Do you still want to proceed and create a separate record?`
      );
      if (!proceed) return;
    }

    const customerData: Customer = {
      id: customerToEdit?.id || '',
      customerCode: customerToEdit?.customerCode || '',
      name: name.trim(),
      phone: phone.trim(),
      altPhone: altPhone.trim(),
      village: village.trim(),
      city: city.trim(),
      taluk: taluk.trim(),
      district: district.trim(),
      fullAddress: fullAddress.trim() || `${village.trim()}, ${taluk.trim()}, ${district.trim()}`,
      remarks: remarks.trim(),
      createdDate: customerToEdit?.createdDate || new Date().toISOString().split('T')[0],
      createdBy: customerToEdit?.createdBy || currentUser.name,
    };

    const saved = repository.saveCustomer(customerData, currentUser.name);
    onCustomerSaved(saved);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl my-auto overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 text-blue-400 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {customerToEdit ? `Edit Customer (${customerToEdit.customerCode})` : 'Add New Customer'}
              </h2>
              <p className="text-xs text-slate-400">Sri Balaji Borewells Customer Directory</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Duplicate Warning Alert */}
        {duplicateWarning && (
          <div className="p-3 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Possible Duplicate Customer Detected!</span>
              <p className="text-[11px] text-amber-800 mt-0.5">
                A customer record already exists: <span className="font-semibold">{duplicateWarning.name}</span> ({duplicateWarning.customerCode}), Phone: {duplicateWarning.phone}, Village: {duplicateWarning.village}.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Customer Name */}
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Customer Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chandrappa, Ramesh Patil"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 font-medium focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Phones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Primary Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit number (e.g. 9886887971)"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-mono text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Alternate Phone
              </label>
              <input
                type="tel"
                value={altPhone}
                onChange={(e) => setAltPhone(e.target.value)}
                placeholder="Optional second number"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-mono text-slate-900"
              />
            </div>
          </div>

          {/* Location Fields (Village, Taluk, City, District) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Village / Area <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                placeholder="e.g. Musandal, Hirekerur"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Taluk
              </label>
              <input
                type="text"
                value={taluk}
                onChange={(e) => setTaluk(e.target.value)}
                placeholder="e.g. Chitradurga, Holalkere"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                City / Town
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Chitradurga, Davanagere"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                District
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. Chitradurga"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900"
              />
            </div>
          </div>

          {/* Full Address */}
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Full Address / Landmark
            </label>
            <textarea
              rows={2}
              value={fullAddress}
              onChange={(e) => setFullAddress(e.target.value)}
              placeholder="e.g. Near Basaveshwara Temple, Musandal Village"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Remarks &amp; Crop / Land Details
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. 5 acres Arecanut farm, requested 6.5 inch drilling"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
            >
              <Check className="w-4 h-4" /> {customerToEdit ? 'Save Changes' : 'Create Customer Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
