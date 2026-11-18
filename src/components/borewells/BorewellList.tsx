// Sri Balaji Borewells - Borewell Management List
import React, { useState } from 'react';
import { Disc, Plus, Search, Filter, Eye, FileText, Trash2, Edit2, Layers, MapPin, CheckCircle2, Activity, Truck } from 'lucide-react';
import { Borewell, Bill } from '../../types';
import { repository } from '../../services/repository';
import { useAuth } from '../../context/AuthContext';
import { BorewellContainerModal } from './BorewellContainerModal';
import { AddBorewellModal } from './AddBorewellModal';

interface BorewellListProps {
  onSelectBill: (bill: Bill) => void;
  onGenerateBill: (b: Borewell, type: 'CUSTOMER' | 'OWNER') => void;
  onOpenPrint: (bill: Bill) => void;
  onAddPayment: (b: Borewell) => void;
  onUploadDocument: (b: Borewell) => void;
}

export const BorewellList: React.FC<BorewellListProps> = ({
  onSelectBill,
  onGenerateBill,
  onOpenPrint,
  onAddPayment,
  onUploadDocument,
}) => {
  const { canDelete, currentUser } = useAuth();
  const [borewells, setBorewells] = useState<Borewell[]>(() => repository.getBorewells());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [activeBorewell, setActiveBorewell] = useState<Borewell | null>(null);
  const [borewellToEdit, setBorewellToEdit] = useState<Borewell | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const refreshBorewells = () => {
    setBorewells([...repository.getBorewells()]);
  };

  const filteredBorewells = borewells.filter(b => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      b.borewellCode.toLowerCase().includes(q) ||
      b.customerName.toLowerCase().includes(q) ||
      b.location.toLowerCase().includes(q) ||
      b.drillerName.toLowerCase().includes(q) ||
      b.totalDepth.toString() === q;

    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const totalDepth = borewells.reduce((total, borewell) => total + (Number(borewell.totalDepth) || 0), 0);
  const completedBorewells = borewells.filter(borewell => borewell.status === 'Completed').length;
  const activeBorewells = borewells.filter(borewell => borewell.status === 'In Progress').length;
  const fleetNames = Array.from(new Set(borewells.map(borewell => borewell.machineDetails.trim()).filter(Boolean)));
  const activeFleetCount = new Set(
    borewells.filter(borewell => borewell.status === 'In Progress').map(borewell => borewell.machineDetails.trim()).filter(Boolean)
  ).size;

  const handleDelete = (b: Borewell) => {
    if (!canDelete) {
      alert('Only the Owner is authorized to delete borewell records.');
      return;
    }
    const confirmed = window.confirm(
      `Are you sure you want to delete borewell ${b.borewellCode} for ${b.customerName}?`
    );
    if (!confirmed) return;

    try {
      repository.deleteBorewell(b.id, currentUser.name);
      refreshBorewells();
    } catch (err: any) {
      alert(err.message || 'Error deleting borewell');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Actions */}
      <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Borewell Operations</h1>
          <p className="text-xs text-slate-500">
            Field drilling logs, depth snapshots, and isolated borewell containers
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
              placeholder="Search BW code, customer, depth..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="Planned">Planned</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {/* Register New Borewell */}
          <button
            onClick={() => {
              setBorewellToEdit(null);
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2 bg-[#191f2d] hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Borewell
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: 'Total Holes Logged', value: borewells.length.toLocaleString(), detail: `${activeBorewells} currently drilling`, icon: Disc, tone: 'text-blue-700 bg-blue-50' },
          { label: 'Depth Drilled', value: `${totalDepth.toLocaleString()} Ft`, detail: `Across ${borewells.length} projects`, icon: Layers, tone: 'text-indigo-700 bg-indigo-50' },
          { label: 'Completed Wells', value: completedBorewells.toLocaleString(), detail: borewells.length ? `${Math.round((completedBorewells / borewells.length) * 100)}% of projects` : 'No projects yet', icon: CheckCircle2, tone: 'text-emerald-700 bg-emerald-50' },
          { label: 'Active Rig Fleets', value: `${activeFleetCount} / ${fleetNames.length}`, detail: `${fleetNames.length} registered machines`, icon: Activity, tone: 'text-amber-700 bg-amber-50' },
        ].map(metric => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{metric.label}</span>
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${metric.tone}`}><Icon className="h-4 w-4" /></span>
              </div>
              <div className="mt-1 text-2xl font-black tracking-tight text-slate-900">{metric.value}</div>
              <div className="mt-1 text-[11px] text-slate-500">{metric.detail}</div>
            </div>
          );
        })}
      </div>

      {/* Borewells Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBorewells.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            <Disc className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold">No borewells found.</p>
          </div>
        ) : (
          filteredBorewells.map(borewell => {
            const bills = repository.getBillsByBorewellId(borewell.id);
            const payments = repository.getPaymentsByBorewellId(borewell.id);
            const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

            return (
              <div
                key={borewell.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-cyan-400 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-black text-base text-cyan-950">
                      {borewell.borewellCode}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      borewell.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {borewell.status}
                    </span>
                  </div>

                  {/* Customer Info */}
                  <div className="text-sm font-bold text-slate-900 mb-1">
                    {borewell.customerName}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1 mb-3">
                    <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span className="truncate">{borewell.location}</span>
                  </div>

                  {/* Metrics Badge */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs mb-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Depth</span>
                      <span className="font-mono font-bold text-cyan-800 text-sm">{borewell.totalDepth} Ft</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Drilling Date</span>
                      <span className="font-semibold text-slate-800">{borewell.drillingDate}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-600 space-y-0.5">
                    <p>🚜 Machine: {borewell.machineDetails}</p>
                    <p>👷 Driller: {borewell.drillerName}</p>
                    <p>📄 Bills Generated: <strong className="text-slate-900">{bills.length}</strong></p>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    onClick={() => setActiveBorewell(borewell)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-cyan-700 text-white rounded-lg font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> Open Container
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setBorewellToEdit(borewell);
                        setIsAddModalOpen(true);
                      }}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                      title="Edit Borewell"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(borewell)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete Borewell"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {fleetNames.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900"><Truck className="h-4 w-4 text-slate-600" /> Rig Fleet &amp; Field Activity</h2>
              <p className="mt-0.5 text-[11px] text-slate-500">Current project and drilling status by registered machine</p>
            </div>
            <span className="text-[11px] text-slate-500">{fleetNames.length} registered {fleetNames.length === 1 ? 'machine' : 'machines'}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {fleetNames.slice(0, 6).map(machine => {
              const project = borewells.find(borewell => borewell.machineDetails.trim() === machine);
              if (!project) return null;
              const isActive = project.status === 'In Progress';
              return (
                <div key={machine} className="rounded-xl bg-slate-50 p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-2">
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      <div className="min-w-0">
                        <div className="truncate text-xs font-bold text-slate-900">{machine}</div>
                        <div className="mt-0.5 truncate text-[11px] text-slate-500">{project.location}</div>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>{project.status}</span>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-600">{project.borewellCode} · {project.customerName} · {project.totalDepth.toLocaleString()} Ft</div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Borewell Container Modal */}
      {activeBorewell && (
        <BorewellContainerModal
          borewell={activeBorewell}
          isOpen={Boolean(activeBorewell)}
          onClose={() => setActiveBorewell(null)}
          onSelectBill={onSelectBill}
          onGenerateBill={(b, type) => {
            setActiveBorewell(null);
            onGenerateBill(b, type);
          }}
          onOpenPrint={onOpenPrint}
          onAddPayment={(b) => {
            setActiveBorewell(null);
            onAddPayment(b);
          }}
          onUploadDocument={(b) => {
            setActiveBorewell(null);
            onUploadDocument(b);
          }}
        />
      )}

      {/* Add / Edit Borewell Modal */}
      <AddBorewellModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        borewellToEdit={borewellToEdit}
        onBorewellSaved={() => {
          refreshBorewells();
        }}
      />
    </div>
  );
};
