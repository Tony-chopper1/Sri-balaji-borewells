// Sri Balaji Borewells - Add / Edit Borewell Modal with Rate Snapshot
import React, { useState, useEffect } from 'react';
import { X, Disc, Check, AlertTriangle, Layers } from 'lucide-react';
import { Borewell, Customer, BorewellStatus, DrillingRateConfig } from '../../types';
import { repository } from '../../services/repository';
import { useAuth } from '../../context/AuthContext';

interface AddBorewellModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBorewellSaved: (borewell: Borewell) => void;
  preselectedCustomer?: Customer | null;
  borewellToEdit?: Borewell | null;
}

export const AddBorewellModal: React.FC<AddBorewellModalProps> = ({
  isOpen,
  onClose,
  onBorewellSaved,
  preselectedCustomer,
  borewellToEdit,
}) => {
  const { currentUser } = useAuth();
  const customers = repository.getCustomers();
  const settings = repository.getCompanySettings();

  const [customerId, setCustomerId] = useState<string>(
    preselectedCustomer?.id || borewellToEdit?.customerId || (customers[0]?.id || '')
  );
  const [drillingDate, setDrillingDate] = useState<string>(
    borewellToEdit?.drillingDate || new Date().toISOString().split('T')[0]
  );
  const [location, setLocation] = useState<string>(borewellToEdit?.location || '');
  const [totalDepth, setTotalDepth] = useState<number>(borewellToEdit?.totalDepth || 805);
  const [rockType, setRockType] = useState<string>(
    borewellToEdit?.rockType || 'Hard Blue Granite & Quartz Veins'
  );
  const [drillerName, setDrillerName] = useState<string>(
    borewellToEdit?.drillerName || 'Manjunath Swamy'
  );
  const [machineDetails, setMachineDetails] = useState<string>(
    borewellToEdit?.machineDetails || 'Rig-104 Ashok Leyland 6x4 with 1150 CFM Compressor'
  );
  const [status, setStatus] = useState<BorewellStatus>(
    borewellToEdit?.status || 'Completed'
  );
  const [remarks, setRemarks] = useState<string>(
    borewellToEdit?.remarks || 'Water yield approx 2.5 inches struck.'
  );

  useEffect(() => {
    if (preselectedCustomer) {
      setCustomerId(preselectedCustomer.id);
      setLocation(`${preselectedCustomer.village}, ${preselectedCustomer.taluk}`);
    } else if (borewellToEdit) {
      setCustomerId(borewellToEdit.customerId);
      setDrillingDate(borewellToEdit.drillingDate);
      setLocation(borewellToEdit.location);
      setTotalDepth(borewellToEdit.totalDepth);
      setRockType(borewellToEdit.rockType);
      setDrillerName(borewellToEdit.drillerName);
      setMachineDetails(borewellToEdit.machineDetails);
      setStatus(borewellToEdit.status);
      setRemarks(borewellToEdit.remarks || '');
    }
  }, [preselectedCustomer, borewellToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const customer = customers.find(c => c.id === customerId);
    if (!customer) {
      alert('Please select a valid customer.');
      return;
    }

    // Freeze snapshot of rate template
    const rateSnapshot: DrillingRateConfig = borewellToEdit?.rateConfig
      ? JSON.parse(JSON.stringify(borewellToEdit.rateConfig))
      : JSON.parse(JSON.stringify(settings.defaultRates));

    const borewellData: Borewell = {
      id: borewellToEdit?.id || '',
      borewellCode: borewellToEdit?.borewellCode || '', // repo auto assigns BW-2026-xxx
      customerId: customer.id,
      customerName: customer.name,
      drillingDate,
      location: location.trim() || `${customer.village}, ${customer.district}`,
      totalDepth: Number(totalDepth) || 0,
      rockType: rockType.trim(),
      drillerName: drillerName.trim(),
      machineDetails: machineDetails.trim(),
      status,
      remarks: remarks.trim(),
      rateConfig: rateSnapshot,
      createdDate: borewellToEdit?.createdDate || new Date().toISOString().split('T')[0],
      createdBy: borewellToEdit?.createdBy || currentUser.name,
    };

    const saved = repository.saveBorewell(borewellData, currentUser.name);
    onBorewellSaved(saved);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl my-auto overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/30 text-cyan-400 flex items-center justify-center">
              <Disc className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {borewellToEdit ? `Edit Borewell (${borewellToEdit.borewellCode})` : 'Register New Borewell Project'}
              </h2>
              <p className="text-xs text-slate-400">Sri Balaji Borewells Field Drilling Registry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Select Customer */}
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Customer <span className="text-red-500">*</span>
            </label>
            <select
              value={customerId}
              disabled={Boolean(preselectedCustomer)}
              onChange={(e) => {
                setCustomerId(e.target.value);
                const c = customers.find(item => item.id === e.target.value);
                if (c && !location) setLocation(`${c.village}, ${c.taluk}`);
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.customerCode}) – 📞 {c.phone} [{c.village}]
                </option>
              ))}
            </select>
          </div>

          {/* Date & Depth */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Drilling Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={drillingDate}
                onChange={(e) => setDrillingDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm text-slate-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Total Depth (Feet) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                value={totalDepth}
                onChange={(e) => setTotalDepth(Math.max(0, Number(e.target.value)))}
                placeholder="e.g. 805"
                className="w-full bg-cyan-50 border-2 border-cyan-400 rounded-lg p-2 text-sm font-bold text-cyan-950 font-mono text-center"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Borewell Location / Survey No. <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Musandal Sy. No. 108/2, Near Lake"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900"
            />
          </div>

          {/* Rock Type & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Rock Type / Strata
              </label>
              <select
                value={rockType}
                onChange={(e) => setRockType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
              >
                <option value="Hard Blue Granite & Quartz Veins">Hard Blue Granite &amp; Quartz Veins</option>
                <option value="Mixed Granitic Gneiss">Mixed Granitic Gneiss</option>
                <option value="Weathered Rock & Soft Schist">Weathered Rock &amp; Soft Schist</option>
                <option value="Boulders & Heavy Silt">Boulders &amp; Heavy Silt</option>
                <option value="Sedimentary Sandstone">Sedimentary Sandstone</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Project Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BorewellStatus)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-900"
              >
                <option value="Planned">Planned</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Machine & Driller */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Driller Incharge Name
              </label>
              <input
                type="text"
                value={drillerName}
                onChange={(e) => setDrillerName(e.target.value)}
                placeholder="e.g. Manjunath Swamy"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Rig Machine Details
              </label>
              <input
                type="text"
                value={machineDetails}
                onChange={(e) => setMachineDetails(e.target.value)}
                placeholder="e.g. Rig-104 Ashok Leyland"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Field Remarks / Water Yield
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. 2.5 inches water struck at 680 ft and 790 ft"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
            />
          </div>

          {/* Notice about rate snapshot */}
          <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg text-blue-900 text-[11px] flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              A permanent rate configuration snapshot will be created for this borewell.
            </span>
          </div>

          {/* Footer */}
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
              className="px-5 py-2.5 bg-cyan-700 hover:bg-cyan-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
            >
              <Check className="w-4 h-4" /> {borewellToEdit ? 'Save Changes' : 'Create Borewell Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
