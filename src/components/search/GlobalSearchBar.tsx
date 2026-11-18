// Sri Balaji Borewells - Global Search Bar Component
import React, { useState, useEffect, useRef } from 'react';
import { Search, X, User, Disc, FileText, UploadCloud, CreditCard, ChevronRight, Filter } from 'lucide-react';
import { repository } from '../../services/repository';
import { Customer, Borewell, Bill, DocumentRecord, Payment } from '../../types';
import { formatINR } from '../../utils/depthCalculator';

interface GlobalSearchProps {
  onSelectCustomer: (customer: Customer) => void;
  onSelectBorewell: (borewell: Borewell) => void;
  onSelectBill: (bill: Bill) => void;
  onSelectDocument: (doc: DocumentRecord) => void;
  onSelectPayment: (payment: Payment) => void;
}

export const GlobalSearchBar: React.FC<GlobalSearchProps> = ({
  onSelectCustomer,
  onSelectBorewell,
  onSelectBill,
  onSelectDocument,
  onSelectPayment,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'CUSTOMERS' | 'BOREWELLS' | 'BILLS' | 'DOCS' | 'PAYMENTS'>('ALL');
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('borewell_recent_searches') || '["Chandrappa", "9886887971", "Musandal", "805"]');
    } catch {
      return ['Chandrappa', '9886887971', 'Musandal', '805'];
    }
  });

  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addRecentSearch = (term: string) => {
    if (!term.trim()) return;
    const updated = [term.trim(), ...recentSearches.filter(s => s.toLowerCase() !== term.trim().toLowerCase())].slice(0, 6);
    setRecentSearches(updated);
    localStorage.setItem('borewell_recent_searches', JSON.stringify(updated));
  };

  const cleanQ = query.trim().toLowerCase();
  const numericQ = cleanQ.replace(/[^0-9]/g, '');

  // Perform multi-entity search across historical database
  const customers = repository.getCustomers().filter(c => {
    if (!cleanQ) return false;
    const phoneClean = c.phone.replace(/[^0-9]/g, '');
    const altPhoneClean = (c.altPhone || '').replace(/[^0-9]/g, '');
    return (
      c.name.toLowerCase().includes(cleanQ) ||
      c.customerCode.toLowerCase().includes(cleanQ) ||
      (numericQ && (phoneClean.includes(numericQ) || altPhoneClean.includes(numericQ))) ||
      c.village.toLowerCase().includes(cleanQ) ||
      c.city.toLowerCase().includes(cleanQ) ||
      c.taluk.toLowerCase().includes(cleanQ) ||
      c.district.toLowerCase().includes(cleanQ) ||
      c.fullAddress.toLowerCase().includes(cleanQ)
    );
  });

  const borewells = repository.getBorewells().filter(b => {
    if (!cleanQ) return false;
    return (
      b.borewellCode.toLowerCase().includes(cleanQ) ||
      b.customerName.toLowerCase().includes(cleanQ) ||
      b.location.toLowerCase().includes(cleanQ) ||
      b.rockType.toLowerCase().includes(cleanQ) ||
      b.drillerName.toLowerCase().includes(cleanQ) ||
      b.machineDetails.toLowerCase().includes(cleanQ) ||
      (numericQ && b.totalDepth.toString() === numericQ) ||
      (b.remarks && b.remarks.toLowerCase().includes(cleanQ))
    );
  });

  const bills = repository.getBills().filter(b => {
    if (!cleanQ) return false;
    return (
      b.billNumber.toLowerCase().includes(cleanQ) ||
      b.customerName.toLowerCase().includes(cleanQ) ||
      b.borewellCode.toLowerCase().includes(cleanQ) ||
      b.drillingLocation.toLowerCase().includes(cleanQ) ||
      (numericQ && b.totalDepth.toString() === numericQ)
    );
  });

  const documents = repository.getDocuments().filter(d => {
    if (!cleanQ) return false;
    return (
      d.title.toLowerCase().includes(cleanQ) ||
      d.category.toLowerCase().includes(cleanQ) ||
      (d.remarks && d.remarks.toLowerCase().includes(cleanQ)) ||
      (d.borewellCode && d.borewellCode.toLowerCase().includes(cleanQ)) ||
      (d.customerName && d.customerName.toLowerCase().includes(cleanQ)) ||
      (d.ocr?.vendorName && d.ocr.vendorName.toLowerCase().includes(cleanQ)) ||
      (d.ocr?.billNumber && d.ocr.billNumber.toLowerCase().includes(cleanQ))
    );
  });

  const payments = repository.getPayments().filter(p => {
    if (!cleanQ) return false;
    return (
      p.receiptNumber.toLowerCase().includes(cleanQ) ||
      p.customerName.toLowerCase().includes(cleanQ) ||
      p.borewellCode.toLowerCase().includes(cleanQ) ||
      p.paymentMethod.toLowerCase().includes(cleanQ) ||
      (p.referenceNumber && p.referenceNumber.toLowerCase().includes(cleanQ)) ||
      (p.remarks && p.remarks.toLowerCase().includes(cleanQ))
    );
  });

  const totalResults = customers.length + borewells.length + bills.length + documents.length + payments.length;

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && query.trim()) {
              addRecentSearch(query);
            }
          }}
          placeholder="Search by customer, phone, borewell ID..."
          className="w-full pl-10 pr-10 py-2 bg-slate-50 hover:bg-white text-slate-800 placeholder-slate-400 text-sm rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 transition-all"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-3 p-1 rounded-md text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden max-h-[82vh] flex flex-col animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Filter Pills */}
          <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto text-xs">
            <span className="text-slate-400 flex items-center gap-1 pl-1 pr-2 font-medium">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>
            {(['ALL', 'CUSTOMERS', 'BOREWELLS', 'BILLS', 'DOCS', 'PAYMENTS'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-2.5 py-1 rounded-full font-medium transition-all ${
                  activeFilter === tab
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <div className="overflow-y-auto p-3 divide-y divide-slate-100 flex-1">
            {/* Recent Searches if query is empty */}
            {!cleanQ && (
              <div className="py-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-2">
                  Recent Searches
                </div>
                <div className="flex flex-wrap gap-2 px-2">
                  {recentSearches.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setQuery(s);
                        addRecentSearch(s);
                      }}
                      className="px-3 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-xs text-slate-700 font-medium transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {cleanQ && totalResults === 0 && (
              <div className="py-8 text-center text-slate-500">
                <Search className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-medium">No results found for "{query}"</p>
                <p className="text-xs text-slate-400 mt-1">Try searching by partial name, village, 10-digit phone, or depth (e.g. 805)</p>
              </div>
            )}

            {/* Customers */}
            {(activeFilter === 'ALL' || activeFilter === 'CUSTOMERS') && customers.length > 0 && (
              <div className="py-2">
                <div className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-1 px-2 flex items-center justify-between">
                  <span>Customers ({customers.length})</span>
                </div>
                {customers.map(c => (
                  <div
                    key={c.id}
                    onClick={() => {
                      addRecentSearch(c.name);
                      onSelectCustomer(c);
                      setIsOpen(false);
                    }}
                    className="p-2.5 rounded-lg hover:bg-blue-50 cursor-pointer flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                          {c.name}
                          <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                            {c.customerCode}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          📞 {c.phone} {c.altPhone ? `| ${c.altPhone}` : ''} • 📍 {c.village}, {c.taluk || c.city}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                ))}
              </div>
            )}

            {/* Borewells */}
            {(activeFilter === 'ALL' || activeFilter === 'BOREWELLS') && borewells.length > 0 && (
              <div className="py-2">
                <div className="text-xs font-bold uppercase tracking-wider text-cyan-700 mb-1 px-2">
                  Borewells ({borewells.length})
                </div>
                {borewells.map(b => (
                  <div
                    key={b.id}
                    onClick={() => {
                      addRecentSearch(b.borewellCode);
                      onSelectBorewell(b);
                      setIsOpen(false);
                    }}
                    className="p-2.5 rounded-lg hover:bg-cyan-50 cursor-pointer flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold text-xs shrink-0">
                        <Disc className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                          <span className="font-mono text-cyan-900">{b.borewellCode}</span>
                          <span className="text-slate-600 font-normal">({b.customerName})</span>
                          <span className="text-[11px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                            {b.totalDepth} ft
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          📍 {b.location} • Status: <span className="font-medium text-slate-700">{b.status}</span> • Driller: {b.drillerName}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-600 transition-colors" />
                  </div>
                ))}
              </div>
            )}

            {/* Bills */}
            {(activeFilter === 'ALL' || activeFilter === 'BILLS') && bills.length > 0 && (
              <div className="py-2">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1 px-2">
                  Bills &amp; Statements ({bills.length})
                </div>
                {bills.map(bill => (
                  <div
                    key={bill.id}
                    onClick={() => {
                      addRecentSearch(bill.billNumber);
                      onSelectBill(bill);
                      setIsOpen(false);
                    }}
                    className="p-2.5 rounded-lg hover:bg-emerald-50 cursor-pointer flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                          <span className="font-mono">{bill.billNumber}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            bill.billType === 'CUSTOMER' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {bill.billType} Bill
                          </span>
                          <span className="text-xs text-slate-500">for {bill.customerName}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Depth: {bill.totalDepth} ft • Grand Total: <span className="font-semibold text-slate-800">{formatINR(bill.grandTotal)}</span> • Balance: <span className="font-semibold text-amber-600">{formatINR(bill.pendingBalance)}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                  </div>
                ))}
              </div>
            )}

            {/* Documents */}
            {(activeFilter === 'ALL' || activeFilter === 'DOCS') && documents.length > 0 && (
              <div className="py-2">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-1 px-2">
                  External Documents ({documents.length})
                </div>
                {documents.map(doc => (
                  <div
                    key={doc.id}
                    onClick={() => {
                      addRecentSearch(doc.title);
                      onSelectDocument(doc);
                      setIsOpen(false);
                    }}
                    className="p-2.5 rounded-lg hover:bg-amber-50 cursor-pointer flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
                        <UploadCloud className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                          {doc.title}
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                            {doc.category}
                          </span>
                          {!doc.isLinked && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-bold animate-pulse">
                              Unlinked
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Amount: <span className="font-semibold text-slate-700">{formatINR(doc.amount)}</span> • {doc.isLinked ? `Linked to ${doc.borewellCode} (${doc.customerName})` : 'Awaiting Borewell link'}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
                  </div>
                ))}
              </div>
            )}

            {/* Payments */}
            {(activeFilter === 'ALL' || activeFilter === 'PAYMENTS') && payments.length > 0 && (
              <div className="py-2">
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-700 mb-1 px-2">
                  Payments &amp; Receipts ({payments.length})
                </div>
                {payments.map(pay => (
                  <div
                    key={pay.id}
                    onClick={() => {
                      addRecentSearch(pay.receiptNumber);
                      onSelectPayment(pay);
                      setIsOpen(false);
                    }}
                    className="p-2.5 rounded-lg hover:bg-indigo-50 cursor-pointer flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                          <span className="font-mono text-indigo-900">{pay.receiptNumber}</span>
                          <span className="font-bold text-emerald-600">+{formatINR(pay.amount)}</span>
                          <span className="text-xs text-slate-500">({pay.paymentMethod})</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Customer: {pay.customerName} • Borewell: {pay.borewellCode} • Date: {pay.paymentDate}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-2 bg-slate-100 border-t border-slate-200 text-center text-[11px] text-slate-500">
            Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-slate-700 font-mono">ESC</kbd> to close • Showing instant database results
          </div>
        </div>
      )}
    </div>
  );
};
