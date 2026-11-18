// Sri Balaji Borewells - Main Application Container & Responsive Shell
import React, { useEffect, useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Disc, 
  FileText, 
  CreditCard, 
  UploadCloud, 
  DollarSign, 
  BarChart3, 
  Settings, 
  Fuel,
  Menu, 
  X, 
  Plus, 
  Shield, 
  ChevronDown,
  Printer
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { repository } from './services/repository';
import { 
  Customer, 
  Borewell, 
  Bill, 
  Payment, 
  DocumentRecord, 
  BillType, 
  UserRole 
} from './types';
import { Logo } from './components/common/Logo';
import { GlobalSearchBar } from './components/search/GlobalSearchBar';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { CustomerList } from './components/customers/CustomerList';
import { BorewellList } from './components/borewells/BorewellList';
import { BillsList } from './components/billing/BillsList';
import { BillGeneratorModal } from './components/billing/BillGeneratorModal';
import { PrintModal } from './components/print/PrintModal';
import { CustomerDetailModal } from './components/customers/CustomerDetailModal';
import { BorewellContainerModal } from './components/borewells/BorewellContainerModal';
import { DocumentsManager } from './components/documents/DocumentsManager';
import { PaymentsManager } from './components/payments/PaymentsManager';
import { ExpensesManager } from './components/expenses/ExpensesManager';
import { PetrolBunksManager } from './components/petrolBunks/PetrolBunksManager';
import { ReportsManager } from './components/reports/ReportsManager';
import { SettingsManager } from './components/settings/SettingsManager';
import { AddBorewellModal } from './components/borewells/AddBorewellModal';
import { LoginPage } from './components/auth/LoginPage';
import { InactivityLockModal } from './components/auth/InactivityLockModal';
import { DeviceApprovalPendingModal } from './components/auth/DeviceApprovalPendingModal';
import { useIdleTimer } from './utils/useIdleTimer';
import { getDeviceInfo } from './utils/deviceSecurity';
import { APP_ERROR_EVENT } from './services/appErrors';

type ActiveModule = 
  | 'DASHBOARD' 
  | 'CUSTOMERS' 
  | 'BOREWELLS' 
  | 'BILLS' 
  | 'PAYMENTS' 
  | 'DOCS' 
  | 'EXPENSES' 
  | 'PETROL_BUNKS'
  | 'REPORTS' 
  | 'SETTINGS';

const AppContent: React.FC = () => {
  const { 
    currentUser, 
    actualUserRole, 
    setRole, 
    isAuthenticated, 
    isLoading, 
    logout, 
    isDeviceApproved, 
    checkDeviceStatus 
  } = useAuth();
  const [appError, setAppError] = useState('');
  const [activeModule, setActiveModule] = useState<ActiveModule>('DASHBOARD');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  // 10-Minute Inactivity Auto-Lock
  const { isLocked, unlock } = useIdleTimer();
  const deviceInfo = useMemo(() => getDeviceInfo(), []);

  // Global Modal States
  const [printBill, setPrintBill] = useState<Bill | null>(null);
  const [isBillGeneratorOpen, setIsBillGeneratorOpen] = useState(false);
  const [generatorBorewell, setGeneratorBorewell] = useState<Borewell | undefined>(undefined);
  const [generatorBillType, setGeneratorBillType] = useState<BillType>('CUSTOMER');

  // Customer / Borewell selected via Global Search or Tables
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedBorewell, setSelectedBorewell] = useState<Borewell | null>(null);
  const [isAddBorewellModalOpen, setIsAddBorewellModalOpen] = useState(false);
  const [preselectedCustomerForBw, setPreselectedCustomerForBw] = useState<Customer | null>(null);

  const settings = repository.getCompanySettings();

  useEffect(() => {
    const handleAppError = (event: Event) => {
      if (event instanceof CustomEvent && typeof event.detail === 'string') {
        setAppError(event.detail);
      }
    };
    window.addEventListener(APP_ERROR_EVENT, handleAppError);
    return () => window.removeEventListener(APP_ERROR_EVENT, handleAppError);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white text-sm">
        Connecting to Sri Balaji Borewells…
      </div>
    );
  }

  if (!isAuthenticated || !currentUser) {
    return <LoginPage />;
  }

  // Device approval gate: unapproved devices are held until Owner approves
  if (!isDeviceApproved && actualUserRole !== 'OWNER') {
    return (
      <DeviceApprovalPendingModal
        deviceInfo={deviceInfo}
        onRefresh={() => void checkDeviceStatus()}
      />
    );
  }

  const handleOpenPrint = (bill: Bill) => {
    setPrintBill(bill);
  };

  const handleOpenGenerator = (b?: Borewell, type: BillType = 'CUSTOMER') => {
    setGeneratorBorewell(b);
    setGeneratorBillType(type);
    setIsBillGeneratorOpen(true);
  };

  const navItems = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'CUSTOMERS', label: 'Customers', icon: Users },
    { id: 'BOREWELLS', label: 'Borewells', icon: Disc },
    { id: 'BILLS', label: 'Bills & Slabs', icon: FileText },
    { id: 'PAYMENTS', label: 'Payments', icon: CreditCard },
    { id: 'DOCS', label: 'Document Vault', icon: UploadCloud },
    { id: 'EXPENSES', label: 'Expenses', icon: DollarSign },
    { id: 'PETROL_BUNKS', label: 'Petrol Bunks', icon: Fuel },
    { id: 'REPORTS', label: 'Reports', icon: BarChart3 },
    { id: 'SETTINGS', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <div className="flex h-screen bg-[#f7f9fc] text-slate-800 font-sans overflow-hidden">
      {/* Sidebar for Desktop & Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-52 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 lg:static lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo Branding */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <Logo size="xs" variant="dark" showText showTagline />
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden p-1 text-slate-400 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-160px)]">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveModule(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#191f2d] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Role Badge */}
        <div className="p-3 border-t border-slate-200 bg-white">
          <div className="relative">
            <button
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs transition-colors"
            >
              <div className="flex items-center gap-2.5 text-left">
                <div className="w-7 h-7 rounded-full bg-[#191f2d] flex items-center justify-center font-black text-[11px] text-white">
                  {currentUser.role[0]}
                </div>
                <div>
                  <div className="font-bold truncate max-w-[110px]">{currentUser.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono font-semibold uppercase">
                    {actualUserRole === 'OWNER' && currentUser.role !== 'OWNER' ? `Preview: ${currentUser.role}` : currentUser.role}
                  </div>
                </div>
              </div>
              {actualUserRole === 'OWNER' && <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
            </button>

            {/* Role Switcher Menu - Securely available only for confirmed database OWNER */}
            {isRoleDropdownOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 text-xs z-50 animate-in fade-in">
                {actualUserRole === 'OWNER' ? (
                  <>
                    <div className="text-[10px] uppercase font-bold text-slate-500 px-2 py-1">
                      Owner View Testing (Preview Mode):
                    </div>
                    {(['OWNER', 'MANAGER', 'EMPLOYEE'] as UserRole[]).map(role => (
                      <button
                        key={role}
                        onClick={() => {
                          setRole(role);
                          setIsRoleDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                          currentUser.role === role ? 'bg-[#191f2d] text-white font-bold' : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>{role} View</span>
                        {currentUser.role === role && <span className="text-[10px] font-bold">Active</span>}
                      </button>
                    ))}
                    <div className="border-t border-slate-200 my-1"></div>
                  </>
                ) : null}
                <button
                  onClick={() => {
                    setIsRoleDropdownOpen(false);
                    void logout().catch((error: unknown) => {
                      setAppError(error instanceof Error ? error.message : 'Sign out failed.');
                    });
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-red-600 hover:bg-red-50 font-bold flex items-center justify-between"
                >
                  <span>Sign Out / Switch Account</span>
                  <span className="text-[10px]">→</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-14 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between gap-4 shrink-0 shadow-sm z-30">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-950 hover:bg-slate-100"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Global Search Bar Component (Requirement 12) */}
          <div className="flex-1 max-w-2xl">
            <GlobalSearchBar
              onSelectCustomer={(c) => setSelectedCustomer(c)}
              onSelectBorewell={(b) => setSelectedBorewell(b)}
              onSelectBill={(bill) => handleOpenPrint(bill)}
              onSelectDocument={() => setActiveModule('DOCS')}
              onSelectPayment={() => setActiveModule('PAYMENTS')}
            />
          </div>

          {/* Header Quick Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenGenerator(undefined, 'CUSTOMER')}
              className="px-3 py-1.5 bg-[#191f2d] hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Bill</span>
            </button>
            <div className="hidden sm:flex items-center gap-2 border-l border-slate-200 pl-3">
              <div className="w-8 h-8 rounded-full bg-[#191f2d] text-white flex items-center justify-center text-xs font-bold">
                {currentUser.name.trim().charAt(0).toUpperCase()}
              </div>
              <div className="leading-tight">
                <div className="text-xs font-bold text-slate-900">{currentUser.name}</div>
                <div className="text-[10px] uppercase tracking-wide text-slate-500">{currentUser.role}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Body Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {appError && (
            <div role="alert" className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start justify-between gap-3">
              <span>Supabase operation failed: {appError}</span>
              <button
                type="button"
                onClick={() => setAppError('')}
                className="font-bold hover:text-red-950"
                aria-label="Dismiss error"
              >
                Dismiss
              </button>
            </div>
          )}
          {activeModule === 'DASHBOARD' && (
            <DashboardOverview
              onNavigate={(mod) => setActiveModule(mod)}
              onOpenGenerator={() => handleOpenGenerator()}
              onOpenPrint={handleOpenPrint}
              onSelectCustomer={(c) => setSelectedCustomer(c)}
              onSelectBorewell={(b) => setSelectedBorewell(b)}
            />
          )}

          {activeModule === 'CUSTOMERS' && (
            <CustomerList
              onSelectBorewell={(b) => setSelectedBorewell(b)}
              onSelectBill={handleOpenPrint}
              onCreateBorewellForCustomer={(c) => {
                setPreselectedCustomerForBw(c);
                setIsAddBorewellModalOpen(true);
              }}
              onGenerateBillForBorewell={(b) => handleOpenGenerator(b, 'CUSTOMER')}
            />
          )}

          {activeModule === 'BOREWELLS' && (
            <BorewellList
              onSelectBill={handleOpenPrint}
              onGenerateBill={handleOpenGenerator}
              onOpenPrint={handleOpenPrint}
              onAddPayment={() => setActiveModule('PAYMENTS')}
              onUploadDocument={() => setActiveModule('DOCS')}
            />
          )}

          {activeModule === 'BILLS' && (
            <BillsList
              onOpenPrint={handleOpenPrint}
              onOpenGenerator={(type) => handleOpenGenerator(undefined, type)}
              onSelectBill={handleOpenPrint}
            />
          )}

          {activeModule === 'PAYMENTS' && (
            <PaymentsManager />
          )}

          {activeModule === 'DOCS' && (
            <DocumentsManager />
          )}

          {activeModule === 'EXPENSES' && (
            <ExpensesManager />
          )}

          {activeModule === 'PETROL_BUNKS' && (
            <PetrolBunksManager />
          )}

          {activeModule === 'REPORTS' && (
            <ReportsManager />
          )}

          {activeModule === 'SETTINGS' && (
            <SettingsManager />
          )}
        </main>
      </div>

      {/* Global Modals */}

      {/* 4x6 / A4 / A5 Print Engine Modal */}
      {printBill && (
        <PrintModal
          bill={printBill}
          settings={settings}
          isOpen={Boolean(printBill)}
          onClose={() => setPrintBill(null)}
        />
      )}

      {/* Bill Generator Modal */}
      {isBillGeneratorOpen && (
        <BillGeneratorModal
          isOpen={isBillGeneratorOpen}
          initialBorewell={generatorBorewell}
          initialBillType={generatorBillType}
          onClose={() => setIsBillGeneratorOpen(false)}
          onBillCreated={(newBill) => {
            handleOpenPrint(newBill);
          }}
        />
      )}

      {/* Customer Detail Modal from Search / Click */}
      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          isOpen={Boolean(selectedCustomer)}
          onClose={() => setSelectedCustomer(null)}
          onSelectBorewell={(b) => {
            setSelectedCustomer(null);
            setSelectedBorewell(b);
          }}
          onSelectBill={handleOpenPrint}
          onCreateBorewellForCustomer={(c) => {
            setSelectedCustomer(null);
            setPreselectedCustomerForBw(c);
            setIsAddBorewellModalOpen(true);
          }}
          onGenerateBillForBorewell={(b) => {
            setSelectedCustomer(null);
            handleOpenGenerator(b, 'CUSTOMER');
          }}
        />
      )}

      {/* Borewell Container Modal from Search / Click */}
      {selectedBorewell && (
        <BorewellContainerModal
          borewell={selectedBorewell}
          isOpen={Boolean(selectedBorewell)}
          onClose={() => setSelectedBorewell(null)}
          onSelectBill={handleOpenPrint}
          onGenerateBill={(b, type) => {
            setSelectedBorewell(null);
            handleOpenGenerator(b, type);
          }}
          onOpenPrint={handleOpenPrint}
          onAddPayment={() => {
            setSelectedBorewell(null);
            setActiveModule('PAYMENTS');
          }}
          onUploadDocument={() => {
            setSelectedBorewell(null);
            setActiveModule('DOCS');
          }}
        />
      )}

      {/* Add Borewell Modal */}
      {isAddBorewellModalOpen && (
        <AddBorewellModal
          isOpen={isAddBorewellModalOpen}
          preselectedCustomer={preselectedCustomerForBw}
          onClose={() => {
            setIsAddBorewellModalOpen(false);
            setPreselectedCustomerForBw(null);
          }}
          onBorewellSaved={(saved) => {
            setSelectedBorewell(saved);
          }}
        />
      )}

      {/* 10-Minute Inactivity Auto-Lock Overlay */}
      {isLocked && <InactivityLockModal onUnlock={unlock} />}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
