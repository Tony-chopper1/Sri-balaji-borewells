// Sri Balaji Borewells - Automatic Depth Calculator & Bill Generator Modal
import React, { useState, useEffect } from 'react';
import { X, Calculator, Plus, Trash2, CheckCircle2, AlertTriangle, Layers, FileText, User, Disc } from 'lucide-react';
import { Borewell, Bill, BillType, Customer, DrillingRateConfig, OtherChargeItem } from '../../types';
import { calculateDepthCharges, formatINR, validateSlabsContinuity } from '../../utils/depthCalculator';
import { repository } from '../../services/repository';
import { useAuth } from '../../context/AuthContext';

interface BillGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBillCreated: (bill: Bill) => void;
  initialBorewell?: Borewell;
  initialBillType?: BillType;
}

export const BillGeneratorModal: React.FC<BillGeneratorModalProps> = ({
  isOpen,
  onClose,
  onBillCreated,
  initialBorewell,
  initialBillType = 'CUSTOMER',
}) => {
  const { currentUser, canGenerateOwnerBill } = useAuth();
  const customers = repository.getCustomers();
  const borewells = repository.getBorewells();

  const [selectedBorewellId, setSelectedBorewellId] = useState<string>(initialBorewell?.id || (borewells[0]?.id || ''));
  const [billType, setBillType] = useState<BillType>(initialBillType);
  const [billDate, setBillDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [customerNameInput, setCustomerNameInput] = useState<string>('');
  const [customerPhoneInput, setCustomerPhoneInput] = useState<string>('');
  const [customerAddressInput, setCustomerAddressInput] = useState<string>('');

  // Borewell details & rate config
  const selectedBorewell = borewells.find(b => b.id === selectedBorewellId) || initialBorewell || borewells[0];
  const selectedCustomer = customers.find(c => c.id === selectedBorewell?.customerId);

  const [totalDepth, setTotalDepth] = useState<number>(selectedBorewell?.totalDepth || 805);
  const [rateConfig, setRateConfig] = useState<DrillingRateConfig>(
    selectedBorewell?.rateConfig || repository.getCompanySettings().defaultRates
  );

  // Additional Charges
  const [casingQty, setCasingQty] = useState<number>(80);
  const [casingRate, setCasingRate] = useState<number>(rateConfig?.defaultCasingRate || 380);

  const [callerQty, setCallerQty] = useState<number>(2);
  const [callerRate, setCallerRate] = useState<number>(rateConfig?.defaultCallerRate || 450);

  const [weldingQty, setWeldingQty] = useState<number>(4);
  const [weldingRate, setWeldingRate] = useState<number>(rateConfig?.defaultWeldingRate || 250);

  const [mealsType, setMealsType] = useState<'fixed' | 'calculated'>('fixed');
  const [mealsCharge, setMealsCharge] = useState<number>(rateConfig?.defaultMealsCharge || 1500);
  const [mealsQty, setMealsQty] = useState<number>(1);
  const [mealsRate, setMealsRate] = useState<number>(1500);

  const [transportType, setTransportType] = useState<'fixed' | 'calculated'>('fixed');
  const [transportCharge, setTransportCharge] = useState<number>(rateConfig?.defaultTransportCharge || 2500);
  const [transportQty, setTransportQty] = useState<number>(1);
  const [transportRate, setTransportRate] = useState<number>(2500);

  const [otherCharges, setOtherCharges] = useState<OtherChargeItem[]>([
    { id: 'item-1', description: 'Bore Cap with Lock', amount: 800 },
  ]);

  const [notes, setNotes] = useState<string>('Standard 15 days payment terms after drilling completion.');
  const [internalRemarks, setInternalRemarks] = useState<string>('Rig performance verified. 100% depth logged.');
  const [showRateEditor, setShowRateEditor] = useState<boolean>(false);

  // Sync when borewell changes
  useEffect(() => {
    if (selectedBorewell) {
      setTotalDepth(selectedBorewell.totalDepth);
      setCustomerNameInput(selectedCustomer?.name || selectedBorewell.customerName || '');
      setCustomerPhoneInput(selectedCustomer?.phone || '');
      setCustomerAddressInput(selectedCustomer ? `${selectedCustomer.village}, ${selectedCustomer.taluk || selectedCustomer.city}` : selectedBorewell.location || '');
      if (selectedBorewell.rateConfig) {
        setRateConfig(selectedBorewell.rateConfig);
        setCasingRate(selectedBorewell.rateConfig.defaultCasingRate);
        setCallerRate(selectedBorewell.rateConfig.defaultCallerRate);
        setWeldingRate(selectedBorewell.rateConfig.defaultWeldingRate);
        setMealsCharge(selectedBorewell.rateConfig.defaultMealsCharge);
        setTransportCharge(selectedBorewell.rateConfig.defaultTransportCharge);
      }
    }
  }, [selectedBorewellId]);

  if (!isOpen || !selectedBorewell || !selectedCustomer) return null;

  // Validate slabs
  const slabsError = validateSlabsContinuity(rateConfig.slabs);

  // Live depth charges calculation
  const isCasingAndChargesAllowed = billType === 'CUSTOMER' || billType === 'REBORE';

  const calculation = calculateDepthCharges({
    totalDepth: Number(totalDepth) || 0,
    rateConfig,
    casingQty: isCasingAndChargesAllowed ? Number(casingQty) || 0 : 0,
    casingRate: Number(casingRate) || 0,
    callerQty: isCasingAndChargesAllowed ? Number(callerQty) || 0 : 0,
    callerRate: Number(callerRate) || 0,
    weldingQty: isCasingAndChargesAllowed ? Number(weldingQty) || 0 : 0,
    weldingRate: Number(weldingRate) || 0,
    mealsCharge: isCasingAndChargesAllowed ? Number(mealsCharge) || 0 : 0,
    mealsType,
    mealsQty: Number(mealsQty) || 1,
    mealsRate: Number(mealsRate) || 0,
    transportCharge: isCasingAndChargesAllowed ? Number(transportCharge) || 0 : 0,
    transportType,
    transportQty: Number(transportQty) || 1,
    transportRate: Number(transportRate) || 0,
    otherCharges: isCasingAndChargesAllowed ? otherCharges : [],
  });

  // Calculate prior payments made for this borewell
  const payments = repository.getPaymentsByBorewellId(selectedBorewell.id);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const pendingBalance = Math.max(0, calculation.grandTotal - totalPaid);

  const handleAddOtherCharge = () => {
    setOtherCharges([
      ...otherCharges,
      { id: `item-${Date.now()}`, description: '', amount: 0 },
    ]);
  };

  const handleRemoveOtherCharge = (id: string) => {
    setOtherCharges(otherCharges.filter(c => c.id !== id));
  };

  const handleUpdateOtherCharge = (id: string, field: 'description' | 'amount', value: any) => {
    setOtherCharges(
      otherCharges.map(item => {
        if (item.id === id) {
          return { ...item, [field]: field === 'amount' ? Number(value) || 0 : value };
        }
        return item;
      })
    );
  };

  const handleSaveBill = () => {
    if (slabsError) {
      alert(`Cannot generate bill: ${slabsError}`);
      return;
    }

    const newBill: Bill = {
      id: `bill-${Date.now()}`,
      billNumber: '', // repo will auto-assign prefix
      billType,
      borewellId: selectedBorewell.id,
      borewellCode: selectedBorewell.borewellCode,
      customerId: selectedCustomer.id,
      customerName: customerNameInput.trim() || selectedCustomer.name,
      customerPhone: customerPhoneInput.trim() || selectedCustomer.phone,
      customerAddress: customerAddressInput.trim() || `${selectedCustomer.village}, ${selectedCustomer.taluk || selectedCustomer.city}`,
      drillingLocation: selectedBorewell.location,
      rockType: selectedBorewell.rockType,
      drillerName: selectedBorewell.drillerName,
      machineDetails: selectedBorewell.machineDetails,
      billDate,
      totalDepth: Number(totalDepth) || 0,
      calculation,
      grandTotal: calculation.grandTotal,
      amountReceived: totalPaid,
      pendingBalance,
      status: pendingBalance <= 0 ? 'Paid' : (totalPaid > 0 ? 'Partial' : 'Unpaid'),
      version: 1,
      notes: billType !== 'OWNER' ? notes : undefined,
      internalRemarks: billType === 'OWNER' ? internalRemarks : undefined,
      managerName: currentUser.name,
      createdBy: currentUser.name,
      createdDate: new Date().toISOString().split('T')[0],
      revisions: [],
    };

    const saved = repository.saveBill(newBill, currentUser.name);

    // Also update borewell depth if modified
    if (selectedBorewell.totalDepth !== totalDepth) {
      selectedBorewell.totalDepth = totalDepth;
      selectedBorewell.rateConfig = rateConfig; // update borewell snapshot
      repository.saveBorewell(selectedBorewell, currentUser.name);
    }

    onBillCreated(saved);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl my-auto flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="bg-[#121927] text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-black tracking-tight text-white">Generate Borewell Bill &amp; Statement</h2>
              <p className="text-xs text-slate-400 font-medium">Sri Balaji Borewells Automated Depth-Wise Billing Engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <div className="p-6 overflow-y-auto divide-y divide-slate-100 space-y-6">
          {/* Bill Type & Target Borewell Selection */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            {/* Bill Type Selector */}
            <div className="md:col-span-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                BILL TYPE
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setBillType('CUSTOMER')}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    billType === 'CUSTOMER'
                      ? 'border-blue-600 bg-white ring-2 ring-blue-500 shadow-sm'
                      : 'border-slate-300 bg-white hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xs font-bold text-blue-900">Customer Bill</span>
                  <span className="text-[10px] text-slate-500 mt-1 leading-tight">Full tax invoice with casing &amp; charges</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBillType('REBORE')}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    billType === 'REBORE'
                      ? 'border-emerald-600 bg-white ring-2 ring-emerald-500 shadow-sm'
                      : 'border-slate-300 bg-white hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xs font-bold text-emerald-900">Reborewell</span>
                  <span className="text-[10px] text-slate-500 mt-1 leading-tight">Flushing, deepen &amp; re-drilling bill</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!canGenerateOwnerBill) {
                      alert('Only Owner or Manager is authorized to generate Owner Bills.');
                      return;
                    }
                    setBillType('OWNER');
                  }}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    billType === 'OWNER'
                      ? 'border-purple-600 bg-white ring-2 ring-purple-500 shadow-sm'
                      : 'border-slate-300 bg-white hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xs font-bold text-purple-900">Owner Bill</span>
                  <span className="text-[10px] text-slate-500 mt-1 leading-tight">Internal drilling statement only</span>
                </button>
              </div>
            </div>

            {/* Customer Details */}
            <div className="md:col-span-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                CUSTOMER DETAILS
              </label>
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={customerNameInput}
                  onChange={(e) => setCustomerNameInput(e.target.value)}
                  placeholder="Customer name"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="tel"
                    value={customerPhoneInput}
                    onChange={(e) => setCustomerPhoneInput(e.target.value)}
                    placeholder="Phone"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={customerAddressInput}
                    onChange={(e) => setCustomerAddressInput(e.target.value)}
                    placeholder="Address"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                Borewell: <span className="font-semibold text-slate-700">{selectedBorewell.borewellCode}</span> • {selectedBorewell.location}
              </div>
            </div>

            {/* Bill Date & Depth */}
            <div className="md:col-span-4 grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  BILL DATE
                </label>
                <input
                  type="date"
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  TOTAL DEPTH (FT)
                </label>
                <input
                  type="number"
                  value={totalDepth}
                  onChange={(e) => setTotalDepth(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-blue-50/50 border border-blue-400 rounded-lg px-3 py-2 text-sm font-bold text-blue-950 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 805"
                />
              </div>
            </div>
          </div>

          {/* Depth Slabs Calculation Preview (The Core Automated Feature) */}
          <div className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  Depth-Wise Drilling Slab Calculation ({totalDepth} Feet)
                </h3>
                <p className="text-xs text-slate-500">
                  Calculated automatically using immutable borewell rate snapshot
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRateEditor(!showRateEditor)}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline cursor-pointer"
              >
                {showRateEditor ? 'Hide Rate Slabs Editor' : 'Edit Rate Slabs'}
              </button>
            </div>

            {slabsError && (
              <div className="p-3 mb-3 bg-red-50 border border-red-300 rounded-lg text-xs text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{slabsError}</span>
              </div>
            )}

            {/* Editable Slabs Table (If toggled) */}
            {showRateEditor && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-300 mb-4 animate-in fade-in">
                <div className="text-xs font-bold text-slate-700 uppercase mb-2">
                  Edit Slabs for this Bill
                </div>
                <div className="space-y-2">
                  {rateConfig.slabs.map((slab, idx) => (
                    <div key={slab.id} className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-slate-500 w-6">{idx + 1}.</span>
                      <span className="font-semibold text-slate-700">From (ft):</span>
                      <input
                        type="number"
                        value={slab.fromFeet}
                        onChange={(e) => {
                          const updated = [...rateConfig.slabs];
                          updated[idx].fromFeet = Number(e.target.value);
                          setRateConfig({ ...rateConfig, slabs: updated });
                        }}
                        className="w-20 bg-white border border-slate-300 rounded px-2 py-1 text-center font-mono"
                      />
                      <span className="font-semibold text-slate-700">To (ft):</span>
                      <input
                        type="number"
                        value={slab.toFeet}
                        onChange={(e) => {
                          const updated = [...rateConfig.slabs];
                          updated[idx].toFeet = Number(e.target.value);
                          setRateConfig({ ...rateConfig, slabs: updated });
                        }}
                        className="w-20 bg-white border border-slate-300 rounded px-2 py-1 text-center font-mono"
                      />
                      <span className="font-semibold text-slate-700">Rate (₹/ft):</span>
                      <input
                        type="number"
                        value={slab.ratePerFoot}
                        onChange={(e) => {
                          const updated = [...rateConfig.slabs];
                          updated[idx].ratePerFoot = Number(e.target.value);
                          setRateConfig({ ...rateConfig, slabs: updated });
                        }}
                        className="w-24 bg-white border border-slate-300 rounded px-2 py-1 text-center font-mono font-bold text-blue-700"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = rateConfig.slabs.filter((_, i) => i !== idx);
                          setRateConfig({ ...rateConfig, slabs: updated });
                        }}
                        className="p-1 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const last = rateConfig.slabs[rateConfig.slabs.length - 1];
                      const newStart = last ? last.toFeet : 0;
                      const newSlab = {
                        id: `slab-${Date.now()}`,
                        fromFeet: newStart,
                        toFeet: newStart + 100,
                        ratePerFoot: (last?.ratePerFoot || 200) + 20,
                      };
                      setRateConfig({ ...rateConfig, slabs: [...rateConfig.slabs, newSlab] });
                    }}
                    className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Slabs Row
                  </button>
                </div>
              </div>
            )}

            {/* Calculated Slab Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-2.5">Depth Slab</th>
                    <th className="p-2.5 text-right">Feet Drilled</th>
                    <th className="p-2.5 text-right">Rate / Foot</th>
                    <th className="p-2.5 text-right">Drilling Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {calculation.slabRows.map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="p-2.5 font-medium text-slate-800">
                        {row.fromFeet} ft – {row.toFeet} ft
                      </td>
                      <td className="p-2.5 text-right font-mono text-slate-700">
                        {row.feetInSlab} ft
                      </td>
                      <td className="p-2.5 text-right font-mono text-slate-700">
                        ₹{row.ratePerFoot}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                        {formatINR(row.amount)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-blue-50/60 font-bold border-t border-slate-300">
                    <td colSpan={3} className="p-2.5 text-right text-blue-950">
                      Total Drilling Depth Charges ({totalDepth} ft):
                    </td>
                    <td className="p-2.5 text-right font-mono text-blue-950 text-sm">
                      {formatINR(calculation.drillingSubtotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Additional Charges (Casing, Caller, Welding, Meals, Transport, Extras) */}
          {(billType === 'CUSTOMER' || billType === 'REBORE') && (
            <div className="pt-4">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                Additional Materials &amp; Field Charges ({billType === 'REBORE' ? 'Reborewell Bill' : 'Customer Bill'})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                {/* MS Casing */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-slate-800 block mb-1">MS Heavy Casing Pipe</span>
                  <div className="flex items-center gap-2 text-xs">
                    <input
                      type="number"
                      value={casingQty}
                      onChange={(e) => setCasingQty(Math.max(0, Number(e.target.value)))}
                      className="w-16 bg-slate-50 border border-slate-300 rounded p-1.5 font-mono text-center"
                      placeholder="Qty (ft)"
                    />
                    <span className="text-slate-500">ft @ ₹</span>
                    <input
                      type="number"
                      value={casingRate}
                      onChange={(e) => setCasingRate(Math.max(0, Number(e.target.value)))}
                      className="w-16 bg-slate-50 border border-slate-300 rounded p-1.5 font-mono text-center"
                      placeholder="Rate"
                    />
                  </div>
                  <div className="mt-2 text-right font-mono font-bold text-xs text-slate-900">
                    = {formatINR(calculation.casingAmount)}
                  </div>
                </div>

                {/* Caller */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-slate-800 block mb-1">Caller Fitting</span>
                  <div className="flex items-center gap-2 text-xs">
                    <input
                      type="number"
                      value={callerQty}
                      onChange={(e) => setCallerQty(Math.max(0, Number(e.target.value)))}
                      className="w-16 bg-slate-50 border border-slate-300 rounded p-1.5 font-mono text-center"
                      placeholder="Qty"
                    />
                    <span className="text-slate-500">nos @ ₹</span>
                    <input
                      type="number"
                      value={callerRate}
                      onChange={(e) => setCallerRate(Math.max(0, Number(e.target.value)))}
                      className="w-16 bg-slate-50 border border-slate-300 rounded p-1.5 font-mono text-center"
                      placeholder="Rate"
                    />
                  </div>
                  <div className="mt-2 text-right font-mono font-bold text-xs text-slate-900">
                    = {formatINR(calculation.callerAmount)}
                  </div>
                </div>

                {/* Welding */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-slate-800 block mb-1">Joint Welding Charges</span>
                  <div className="flex items-center gap-2 text-xs">
                    <input
                      type="number"
                      value={weldingQty}
                      onChange={(e) => setWeldingQty(Math.max(0, Number(e.target.value)))}
                      className="w-16 bg-slate-50 border border-slate-300 rounded p-1.5 font-mono text-center"
                      placeholder="Qty"
                    />
                    <span className="text-slate-500">joints @ ₹</span>
                    <input
                      type="number"
                      value={weldingRate}
                      onChange={(e) => setWeldingRate(Math.max(0, Number(e.target.value)))}
                      className="w-16 bg-slate-50 border border-slate-300 rounded p-1.5 font-mono text-center"
                      placeholder="Rate"
                    />
                  </div>
                  <div className="mt-2 text-right font-mono font-bold text-xs text-slate-900">
                    = {formatINR(calculation.weldingAmount)}
                  </div>
                </div>

                {/* Meals */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800">Crew Meals</span>
                    <select
                      value={mealsType}
                      onChange={(e) => setMealsType(e.target.value as any)}
                      className="text-[10px] bg-slate-100 rounded px-1.5 py-0.5"
                    >
                      <option value="fixed">Fixed</option>
                      <option value="calculated">Per Day</option>
                    </select>
                  </div>
                  {mealsType === 'fixed' ? (
                    <div className="flex items-center gap-2 text-xs">
                      <span>Fixed Amount: ₹</span>
                      <input
                        type="number"
                        value={mealsCharge}
                        onChange={(e) => setMealsCharge(Math.max(0, Number(e.target.value)))}
                        className="w-24 bg-slate-50 border border-slate-300 rounded p-1 font-mono text-right"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs">
                      <input
                        type="number"
                        value={mealsQty}
                        onChange={(e) => setMealsQty(Math.max(0, Number(e.target.value)))}
                        className="w-14 bg-slate-50 border border-slate-300 rounded p-1 font-mono text-center"
                        placeholder="Days"
                      />
                      <span>days @ ₹</span>
                      <input
                        type="number"
                        value={mealsRate}
                        onChange={(e) => setMealsRate(Math.max(0, Number(e.target.value)))}
                        className="w-20 bg-slate-50 border border-slate-300 rounded p-1 font-mono text-right"
                      />
                    </div>
                  )}
                  <div className="mt-2 text-right font-mono font-bold text-xs text-slate-900">
                    = {formatINR(calculation.mealsCharge)}
                  </div>
                </div>

                {/* Transport */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800">Rig Transport</span>
                    <select
                      value={transportType}
                      onChange={(e) => setTransportType(e.target.value as any)}
                      className="text-[10px] bg-slate-100 rounded px-1.5 py-0.5"
                    >
                      <option value="fixed">Fixed</option>
                      <option value="calculated">Per Trip</option>
                    </select>
                  </div>
                  {transportType === 'fixed' ? (
                    <div className="flex items-center gap-2 text-xs">
                      <span>Fixed Amount: ₹</span>
                      <input
                        type="number"
                        value={transportCharge}
                        onChange={(e) => setTransportCharge(Math.max(0, Number(e.target.value)))}
                        className="w-24 bg-slate-50 border border-slate-300 rounded p-1 font-mono text-right"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs">
                      <input
                        type="number"
                        value={transportQty}
                        onChange={(e) => setTransportQty(Math.max(0, Number(e.target.value)))}
                        className="w-14 bg-slate-50 border border-slate-300 rounded p-1 font-mono text-center"
                        placeholder="Trips"
                      />
                      <span>trips @ ₹</span>
                      <input
                        type="number"
                        value={transportRate}
                        onChange={(e) => setTransportRate(Math.max(0, Number(e.target.value)))}
                        className="w-20 bg-slate-50 border border-slate-300 rounded p-1 font-mono text-right"
                      />
                    </div>
                  )}
                  <div className="mt-2 text-right font-mono font-bold text-xs text-slate-900">
                    = {formatINR(calculation.transportCharge)}
                  </div>
                </div>

                {/* Other Charges List */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm md:col-span-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800">Other Custom Charges</span>
                    <button
                      type="button"
                      onClick={handleAddOtherCharge}
                      className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" /> Add Item
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                    {otherCharges.map(c => (
                      <div key={c.id} className="flex items-center gap-1.5 text-xs">
                        <input
                          type="text"
                          value={c.description}
                          placeholder="Charge description"
                          onChange={(e) => handleUpdateOtherCharge(c.id, 'description', e.target.value)}
                          className="flex-1 bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 text-xs"
                        />
                        <span className="text-slate-500">₹</span>
                        <input
                          type="number"
                          value={c.amount}
                          onChange={(e) => handleUpdateOtherCharge(c.id, 'amount', e.target.value)}
                          className="w-16 bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 text-xs font-mono text-right"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveOtherCharge(c.id)}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Remarks & Notes */}
          <div className="pt-4">
            {billType === 'CUSTOMER' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Customer Notes &amp; Payment Terms
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-purple-900 uppercase tracking-wider mb-1.5">
                  Internal Owner Statement Remarks (Strictly Internal)
                </label>
                <input
                  type="text"
                  value={internalRemarks}
                  onChange={(e) => setInternalRemarks(e.target.value)}
                  className="w-full bg-purple-50/50 border border-purple-200 rounded-lg p-2.5 text-xs text-purple-950 font-medium"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer Summary Bar */}
        <div className="bg-[#121927] text-white p-4 md:px-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 shrink-0">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
                BILL SUBTOTAL
              </span>
              <span className="font-mono text-sm font-bold text-slate-200">
                {formatINR(calculation.drillingSubtotal)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
                GRAND TOTAL
              </span>
              <span className="font-mono text-lg font-black text-cyan-400">
                {formatINR(calculation.grandTotal)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
                ALLOCATED PAYMENTS
              </span>
              <span className="font-mono text-sm font-bold text-emerald-400">
                {formatINR(totalPaid)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
                PENDING BALANCE
              </span>
              <span className="font-mono text-sm font-black text-amber-400">
                {formatINR(pendingBalance)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveBill}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" /> Save &amp; Generate {billType} Bill
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
