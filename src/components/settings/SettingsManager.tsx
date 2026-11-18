// Sri Balaji Borewells - Settings, Branding, Default Rates & System Administration
import React, { useState, useEffect } from 'react';
import { Settings, Building, Phone, MapPin, Layers, Printer, Shield, Database, Save, Upload, RefreshCw, Check, Globe, Smartphone, CheckCircle2, XCircle } from 'lucide-react';
import { CompanySettings, DrillingRateConfig, DrillingRateSlab, UserDeviceRecord } from '../../types';
import { repository } from '../../services/repository';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../common/Logo';
import { supabase } from '../../services/supabase';

export const SettingsManager: React.FC = () => {
  const { currentUser, canManageSettings, actualUserRole } = useAuth();
  const [settings, setSettings] = useState<CompanySettings>(() => repository.getCompanySettings());
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'RATES' | 'PRINT' | 'ROLES' | 'DEVICES' | 'BACKUP' | 'LOGS'>('PROFILE');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [logs, setLogs] = useState(() => repository.getActivityLogs());
  const [devices, setDevices] = useState<UserDeviceRecord[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);

  const loadDevices = async () => {
    if (!supabase) return;
    setIsLoadingDevices(true);
    try {
      const { data, error } = await supabase
        .from('user_devices')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && !error) {
        setDevices(
          data.map((d: any) => ({
            id: d.id,
            userId: d.user_id,
            deviceId: d.device_id,
            deviceName: d.device_name,
            browser: d.browser,
            os: d.os,
            isApproved: d.is_approved,
            approvedAt: d.approved_at,
            lastActive: d.last_active,
            createdAt: d.created_at,
          }))
        );
      }
    } catch {
      // ignore if table not present
    } finally {
      setIsLoadingDevices(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'DEVICES') {
      void loadDevices();
    }
  }, [activeTab]);

  const handleToggleDeviceApproval = async (device: UserDeviceRecord) => {
    if (!supabase || actualUserRole !== 'OWNER') return;
    const newStatus = !device.isApproved;
    const { error } = await supabase
      .from('user_devices')
      .update({
        is_approved: newStatus,
        approved_by: currentUser.id,
        approved_at: newStatus ? new Date().toISOString() : null,
      })
      .eq('id', device.id);

    if (error) {
      alert('Error updating device status: ' + error.message);
    } else {
      void loadDevices();
    }
  };

  const handleDeleteDevice = async (device: UserDeviceRecord) => {
    if (!supabase || actualUserRole !== 'OWNER') return;
    if (!window.confirm(`Revoke and remove device "${device.deviceName}"?`)) return;
    const { error } = await supabase.from('user_devices').delete().eq('id', device.id);
    if (error) {
      alert('Error deleting device: ' + error.message);
    } else {
      void loadDevices();
    }
  };

  // Form State
  const [primaryPhone, setPrimaryPhone] = useState(settings.primaryPhone);
  const [secondaryPhone, setSecondaryPhone] = useState(settings.secondaryPhone);
  const [email, setEmail] = useState(settings.email);
  const [address, setAddress] = useState(settings.address);
  const [district, setDistrict] = useState(settings.district);
  const [gstNumber, setGstNumber] = useState(settings.gstNumber || '');
  const [billPrefix, setBillPrefix] = useState(settings.billNumberPrefix);
  const [ownerBillPrefix, setOwnerBillPrefix] = useState(settings.ownerBillNumberPrefix);
  const [language, setLanguage] = useState<'en' | 'kn'>(settings.language || 'en');
  const [customLogoUrl, setCustomLogoUrl] = useState(settings.logoUrl || '');

  // Rate template state
  const [rateConfig, setRateConfig] = useState<DrillingRateConfig>(settings.defaultRates);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageSettings) {
      alert('Only the Owner can update company settings and default rates.');
      return;
    }

    const updated: CompanySettings = {
      ...settings,
      companyName: 'Sri Balaji Borewells', // Strictly immutable branding rule
      primaryPhone,
      secondaryPhone,
      email,
      address,
      district,
      gstNumber,
      billNumberPrefix: billPrefix,
      ownerBillNumberPrefix: ownerBillPrefix,
      language,
      logoUrl: customLogoUrl,
      defaultRates: rateConfig,
    };

    repository.saveCompanySettings(updated, currentUser.name);
    setSettings(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleBackupExport = () => {
    const jsonStr = repository.exportBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sri_Balaji_Borewells_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        repository.importBackupJson(content, currentUser.name);
        alert('Database successfully restored from backup! The page will now reload.');
        window.location.reload();
      } catch (err: any) {
        alert('Failed to restore backup: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleResetSeed = () => {
    const confirmed = window.confirm(
      'Are you sure you want to reset all records to the original seed demo data? (Existing bills, customers, and payments will be replaced).'
    );
    if (!confirmed) return;

    repository.resetToSeedData();
    window.location.reload();
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Settings &amp; Administration</h1>
          <p className="text-xs text-slate-500">
            Manage company details, drilling rates template, print preferences, backups, and audit trail
          </p>
        </div>

        {saveSuccess && (
          <div className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
            <Check className="w-4 h-4" /> Changes Saved Successfully!
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-4 gap-2 overflow-x-auto text-xs font-bold">
        {[
          { id: 'PROFILE', label: 'Company Profile & Logo', icon: Building },
          { id: 'RATES', label: 'Default Drilling Rates', icon: Layers },
          { id: 'PRINT', label: 'Print Defaults', icon: Printer },
          { id: 'ROLES', label: 'Roles & Permissions', icon: Shield },
          { id: 'DEVICES', label: 'Authorized Devices', icon: Smartphone },
          { id: 'BACKUP', label: 'Backup & Database', icon: Database },
          { id: 'LOGS', label: 'Audit Trail Logs', icon: Settings },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3.5 px-3 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
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

      {/* Tab Panels */}
      <div className="bg-white rounded-b-2xl p-6 border border-slate-200 border-t-0 shadow-sm">
        {/* Profile Tab */}
        {activeTab === 'PROFILE' && (
          <form onSubmit={handleSave} className="space-y-5 max-w-4xl text-xs">
            <div className="p-4 bg-orange-50/60 rounded-xl border border-orange-200 flex items-center gap-4">
              <Logo size="lg" customLogoUrl={customLogoUrl} />
              <div>
                <span className="font-bold text-slate-900 text-sm">Official Brand: Sri Balaji Borewells</span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  The company name is strictly preserved throughout all bills, receipts, and headers.
                </p>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Official Logo File Path (Centralized)
              </label>
              <input
                type="text"
                value={customLogoUrl}
                onChange={(e) => setCustomLogoUrl(e.target.value)}
                placeholder="/logo.svg"
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Primary Phone</label>
                <input
                  type="text"
                  value={primaryPhone}
                  onChange={(e) => setPrimaryPhone(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Secondary Phone</label>
                <input
                  type="text"
                  value={secondaryPhone}
                  onChange={(e) => setSecondaryPhone(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-xs text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Official Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">District / State</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">GST / Tax Registration #</label>
                <input
                  type="text"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Customer Bill Prefix</label>
                <input
                  type="text"
                  value={billPrefix}
                  onChange={(e) => setBillPrefix(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Owner Statement Prefix</label>
                <input
                  type="text"
                  value={ownerBillPrefix}
                  onChange={(e) => setOwnerBillPrefix(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-xs text-slate-900"
                />
              </div>
            </div>

            {/* Language Toggle (Kannada support ready) */}
            <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-blue-900 flex items-center gap-1.5">
                  <Globe className="w-4 h-4" /> Application Language
                </span>
                <p className="text-[11px] text-blue-800">Switch between English and Kannada (ಕನ್ನಡ)</p>
              </div>
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-blue-200">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1 rounded text-xs font-bold ${language === 'en' ? 'bg-orange-600 text-white' : 'text-slate-600'}`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('kn')}
                  className={`px-3 py-1 rounded text-xs font-bold ${language === 'kn' ? 'bg-orange-600 text-white' : 'text-slate-600'}`}
                >
                  ಕನ್ನಡ (Kannada)
                </button>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#191f2d] hover:bg-slate-800 text-white font-bold rounded-xl shadow flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save Profile Settings
              </button>
            </div>
          </form>
        )}

        {/* Rates Tab */}
        {activeTab === 'RATES' && (
          <form onSubmit={handleSave} className="space-y-4 max-w-3xl text-xs">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Default Drilling Rate Slabs Template</h2>
              <p className="text-slate-500 text-[11px]">
                These rates are automatically applied when registering a new borewell. Every borewell saves a snapshot of these rates, ensuring historical bills are protected.
              </p>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-2.5">Slab From (ft)</th>
                    <th className="p-2.5">Slab To (ft)</th>
                    <th className="p-2.5 text-right">Rate / Ft (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rateConfig.slabs.map((slab, idx) => (
                    <tr key={slab.id} className="bg-white">
                      <td className="p-2.5 font-mono text-slate-800">{slab.fromFeet} ft</td>
                      <td className="p-2.5 font-mono text-slate-800">{slab.toFeet >= 9000 ? 'Onwards' : `${slab.toFeet} ft`}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-blue-700">₹{slab.ratePerFoot}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">MS Casing Rate</label>
                <input
                  type="number"
                  value={rateConfig.defaultCasingRate}
                  onChange={(e) => setRateConfig({ ...rateConfig, defaultCasingRate: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Caller Rate</label>
                <input
                  type="number"
                  value={rateConfig.defaultCallerRate}
                  onChange={(e) => setRateConfig({ ...rateConfig, defaultCallerRate: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Welding Rate</label>
                <input
                  type="number"
                  value={rateConfig.defaultWeldingRate}
                  onChange={(e) => setRateConfig({ ...rateConfig, defaultWeldingRate: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Default Meals</label>
                <input
                  type="number"
                  value={rateConfig.defaultMealsCharge}
                  onChange={(e) => setRateConfig({ ...rateConfig, defaultMealsCharge: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-mono font-bold"
                />
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save Default Rates Template
              </button>
            </div>
          </form>
        )}

        {/* Roles Tab */}
        {activeTab === 'ROLES' && (
          <div className="space-y-4 max-w-3xl text-xs">
            <h2 className="text-sm font-bold text-slate-900">Role-Based Permissions Matrix</h2>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-3">Feature / Capability</th>
                    <th className="p-3 text-center">OWNER</th>
                    <th className="p-3 text-center">MANAGER</th>
                    <th className="p-3 text-center">EMPLOYEE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { feat: 'Add Customers & Drilling Records', owner: true, manager: true, employee: true },
                    { feat: 'Upload External Bills & Field Photos', owner: true, manager: true, employee: true },
                    { feat: 'Generate Customer Invoices', owner: true, manager: true, employee: false },
                    { feat: 'Generate Owner Drilling Statements', owner: true, manager: true, employee: false },
                    { feat: 'Record Payments & Issue Receipts', owner: true, manager: true, employee: false },
                    { feat: 'Link Unlinked Documents', owner: true, manager: true, employee: false },
                    { feat: 'Modify Default Drilling Rates', owner: true, manager: false, employee: false },
                    { feat: 'Edit Company Settings & Profile', owner: true, manager: false, employee: false },
                    { feat: 'Delete Records & Reversals', owner: true, manager: false, employee: false },
                  ].map((row, idx) => (
                    <tr key={idx} className="bg-white">
                      <td className="p-3 font-medium text-slate-800">{row.feat}</td>
                      <td className="p-3 text-center font-bold text-emerald-600">✓ Full</td>
                      <td className="p-3 text-center font-semibold text-blue-600">{row.manager ? '✓ Allowed' : '—'}</td>
                      <td className="p-3 text-center text-slate-500">{row.employee ? '✓ Allowed' : 'Restricted'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Devices Tab */}
        {activeTab === 'DEVICES' && (
          <div className="space-y-4 max-w-4xl text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Authorized Device Management</h2>
                <p className="text-slate-500">
                  Control staff browsers and mobile devices permitted to access company data.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void loadDevices()}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh List
              </button>
            </div>

            {isLoadingDevices ? (
              <div className="p-8 text-center text-slate-400">Loading registered devices…</div>
            ) : devices.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500">
                <Smartphone className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold">No external devices currently registered.</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  When employees log in from a new browser or device, it will appear here for Owner authorization.
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                      <th className="p-3">Device Name & OS</th>
                      <th className="p-3">Browser</th>
                      <th className="p-3">Device ID</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {devices.map(device => (
                      <tr key={device.id} className="hover:bg-slate-50">
                        <td className="p-3 font-semibold text-slate-900">
                          {device.deviceName}
                          <span className="block text-[10px] text-slate-400 font-normal">{device.os}</span>
                        </td>
                        <td className="p-3 text-slate-600">{device.browser}</td>
                        <td className="p-3 font-mono text-[10px] text-slate-500 truncate max-w-[140px]">
                          {device.deviceId}
                        </td>
                        <td className="p-3 text-center">
                          {device.isApproved ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Approved
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                              <XCircle className="w-3 h-3 text-amber-600" /> Pending
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {actualUserRole === 'OWNER' && (
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => void handleToggleDeviceApproval(device)}
                                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] cursor-pointer transition-colors ${
                                  device.isApproved
                                    ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                    : 'bg-emerald-600 text-white hover:bg-emerald-500'
                                }`}
                              >
                                {device.isApproved ? 'Revoke' : 'Approve'}
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDeleteDevice(device)}
                                className="px-2 py-1 text-red-600 hover:bg-red-50 rounded-lg font-bold text-[11px] cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Backup Tab */}
        {activeTab === 'BACKUP' && (
          <div className="space-y-4 max-w-xl text-xs">
            <h2 className="text-sm font-bold text-slate-900">Backup, Restore &amp; Demo Data</h2>
            <p className="text-slate-500">
              Export the full database to a JSON file for safe offline keeping, or restore previous backups.
            </p>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <span className="font-bold text-slate-800 block">Export JSON Database Backup</span>
              <button
                type="button"
                onClick={handleBackupExport}
                className="px-4 py-2 bg-slate-900 hover:bg-blue-600 text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Database className="w-4 h-4" /> Download Full JSON Backup
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <span className="font-bold text-slate-800 block">Restore Database from JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreFile}
                className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-500"
              />
            </div>

            <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-2">
              <span className="font-bold text-red-900 block">Reset to Pre-Seeded Realistic Demo Data</span>
              <p className="text-[11px] text-red-800">
                Restores original sample borewells (805 ft Chandrappa project, Ramesh Patil project), bills, and unlinked documents.
              </p>
              <button
                type="button"
                onClick={handleResetSeed}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" /> Reset Seed Data
              </button>
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'LOGS' && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900">System Activity Audit Trail</h2>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Module</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Details</th>
                    <th className="p-3">User</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-700">
                          {log.module}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-slate-900">{log.action}</td>
                      <td className="p-3 text-slate-600">{log.details}</td>
                      <td className="p-3 font-semibold text-blue-900">{log.performedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
