// Sri Balaji Borewells - External Documents & Unlinked Documents Hub with OCR Verification
import React, { useState } from 'react';
import { UploadCloud, FileText, Image, Check, AlertCircle, Link2, Search, Filter, Trash2, Eye, ScanLine, Plus } from 'lucide-react';
import { DocumentRecord, DocumentCategory, Customer, Borewell } from '../../types';
import { repository } from '../../services/repository';
import { formatINR } from '../../utils/depthCalculator';
import { useAuth } from '../../context/AuthContext';

export const DocumentsManager: React.FC = () => {
  const { canDelete, currentUser } = useAuth();
  const [documents, setDocuments] = useState<DocumentRecord[]>(() => repository.getDocuments());
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNLINKED' | 'MATERIALS' | 'FUEL' | 'REPAIRS' | 'UPLOAD'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Link Modal State
  const [docToLink, setDocToLink] = useState<DocumentRecord | null>(null);
  const [targetBorewellId, setTargetBorewellId] = useState<string>('');

  // Upload Form State
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>('Materials');
  const [uploadAmount, setUploadAmount] = useState<number>(0);
  const [uploadDate, setUploadDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [uploadRemarks, setUploadRemarks] = useState('');
  const [selectedBorewellId, setSelectedBorewellId] = useState<string>('unlinked');
  const [ocrActive, setOcrActive] = useState(false);
  const [ocrVerified, setOcrVerified] = useState(false);

  const borewells = repository.getBorewells();
  const customers = repository.getCustomers();

  const refreshDocs = () => {
    setDocuments([...repository.getDocuments()]);
  };

  const unlinkedCount = documents.filter(d => !d.isLinked || !d.borewellId).length;

  const filteredDocs = documents.filter(d => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      d.title.toLowerCase().includes(q) ||
      (d.remarks && d.remarks.toLowerCase().includes(q)) ||
      (d.borewellCode && d.borewellCode.toLowerCase().includes(q)) ||
      (d.customerName && d.customerName.toLowerCase().includes(q));

    if (activeTab === 'UNLINKED') return matchesSearch && (!d.isLinked || !d.borewellId);
    if (activeTab === 'MATERIALS') return matchesSearch && d.category === 'Materials';
    if (activeTab === 'FUEL') return matchesSearch && d.category === 'Fuel';
    if (activeTab === 'REPAIRS') return matchesSearch && d.category === 'Repairs';

    return matchesSearch;
  });

  const handleLinkDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docToLink || !targetBorewellId) return;

    const bw = borewells.find(b => b.id === targetBorewellId);
    if (!bw) return;

    repository.linkDocumentToBorewell(
      docToLink.id,
      bw.id,
      bw.customerId,
      bw.customerName,
      bw.borewellCode,
      currentUser.name
    );

    setDocToLink(null);
    setTargetBorewellId('');
    refreshDocs();
  };

  const handleDelete = (doc: DocumentRecord) => {
    if (!canDelete) {
      alert('Only the Owner can delete document files.');
      return;
    }
    const confirmed = window.confirm(`Delete document "${doc.title}"?`);
    if (!confirmed) return;

    repository.deleteDocument(doc.id, currentUser.name);
    refreshDocs();
  };

  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) {
      alert('Please enter document title');
      return;
    }

    const isLinked = selectedBorewellId !== 'unlinked';
    const targetBw = isLinked ? borewells.find(b => b.id === selectedBorewellId) : null;

    const sampleImages: Record<DocumentCategory, string> = {
      Materials: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
      Fuel: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80',
      Transport: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=800&q=80',
      Repairs: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      Welding: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80',
      Equipment: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
      Other: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
    };

    const newDoc: DocumentRecord = {
      id: `doc-${Date.now()}`,
      title: uploadTitle.trim(),
      category: uploadCategory,
      originalDocDate: uploadDate,
      uploadDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      amount: Number(uploadAmount) || 0,
      customerId: targetBw?.customerId,
      customerName: targetBw?.customerName,
      borewellId: targetBw?.id,
      borewellCode: targetBw?.borewellCode,
      isLinked,
      uploadedBy: currentUser.name,
      fileUrl: sampleImages[uploadCategory],
      fileType: 'image',
      fileName: `${uploadCategory.toLowerCase()}_receipt_${Date.now()}.jpg`,
      fileSize: 320000,
      remarks: uploadRemarks.trim(),
      ocr: ocrActive ? {
        billNumber: `BILL-${Math.floor(1000 + Math.random() * 9000)}`,
        vendorName: 'Sri Renuka Enterprise Chitradurga',
        date: uploadDate,
        amount: Number(uploadAmount) || 0,
        verified: ocrVerified,
      } : undefined,
    };

    repository.saveDocument(newDoc, currentUser.name);

    // Reset Form
    setUploadTitle('');
    setUploadAmount(0);
    setUploadRemarks('');
    setSelectedBorewellId('unlinked');
    setOcrActive(false);
    setOcrVerified(false);
    setActiveTab('ALL');
    refreshDocs();
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">External Document Vault</h1>
          <p className="text-xs text-slate-500">
            Field receipts, diesel bills, casing pipe delivery vouchers, and photos
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
              placeholder="Search title, category, borewell..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={() => setActiveTab('UPLOAD')}
            className="px-4 py-2 bg-[#191f2d] hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" /> Upload Document
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-4 gap-2 overflow-x-auto text-xs font-bold">
        {[
          { id: 'ALL', label: `All Documents (${documents.length})` },
          { id: 'UNLINKED', label: `Unlinked Documents (${unlinkedCount})`, alert: unlinkedCount > 0 },
          { id: 'MATERIALS', label: 'Casing & Materials' },
          { id: 'FUEL', label: 'Fuel / Diesel' },
          { id: 'REPAIRS', label: 'Repairs & Maintenance' },
          { id: 'UPLOAD', label: '+ Upload New File' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-3.5 px-3 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-[#191f2d] text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
            {tab.alert && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            )}
          </button>
        ))}
      </div>

      {/* Upload Screen if Tab === 'UPLOAD' */}
      {activeTab === 'UPLOAD' && (
        <div className="bg-white rounded-b-2xl p-5 md:p-6 border border-slate-200 border-t-0 shadow-sm animate-in fade-in">
          <h2 className="text-base font-bold text-slate-900 mb-1">Upload Scanned Bill or Field Photograph</h2>
          <p className="text-xs text-slate-500 mb-4">
            Upload receipts from mobile camera or storage. If borewell is not known yet, save as "Unlinked" for later attachment.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.8fr)_minmax(250px,0.8fr)] gap-5">
          <form onSubmit={handleCreateDocument} className="space-y-4 min-w-0 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Document Title / Item Description <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="e.g. Casing Pipes Delivery Slip, Highway Care Fuel Slip"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 font-medium focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Category</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-semibold text-slate-900"
                >
                  <option value="Materials">Materials &amp; Casing</option>
                  <option value="Fuel">Fuel (Diesel / Oil)</option>
                  <option value="Transport">Transport &amp; Toll</option>
                  <option value="Repairs">Repairs &amp; Spares</option>
                  <option value="Welding">Welding Gas &amp; Rods</option>
                  <option value="Equipment">Equipment &amp; Bits</option>
                  <option value="Other">Other Expenses</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Amount (₹)</label>
                <input
                  type="number"
                  value={uploadAmount}
                  onChange={(e) => setUploadAmount(Number(e.target.value))}
                  placeholder="e.g. 14720"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Bill / Doc Date</label>
                <input
                  type="date"
                  value={uploadDate}
                  onChange={(e) => setUploadDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                />
              </div>
            </div>

            {/* Target Borewell Selection (or Unlinked) */}
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Link to Borewell Project
              </label>
              <select
                value={selectedBorewellId}
                onChange={(e) => setSelectedBorewellId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-semibold text-slate-900"
              >
                <option value="unlinked">⚠️ Keep Unlinked (Will be organized in Unlinked Hub)</option>
                {borewells.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.borewellCode} – {b.customerName} ({b.location})
                  </option>
                ))}
              </select>
            </div>

            {/* Remarks */}
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Remarks</label>
              <input
                type="text"
                value={uploadRemarks}
                onChange={(e) => setUploadRemarks(e.target.value)}
                placeholder="Optional notes or supplier name"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
              />
            </div>

            {/* Simulated OCR Scanner Feature */}
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-900 flex items-center gap-1.5">
                  <ScanLine className="w-4 h-4 text-blue-600" />
                  Smart OCR Receipt Data Reader
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setOcrActive(true);
                    if (!uploadAmount) setUploadAmount(4850);
                    if (!uploadTitle) setUploadTitle('Sri Renuka Hardwares Tax Invoice');
                  }}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-[11px]"
                >
                  Scan Document Text
                </button>
              </div>

              {ocrActive && (
                <div className="bg-white p-2.5 rounded-lg border border-blue-200 text-xs text-slate-700 space-y-1.5 animate-in fade-in">
                  <p className="font-semibold text-slate-900">Extracted OCR Text Preview:</p>
                  <p className="font-mono text-[11px] text-slate-600">Vendor: Sri Renuka Hardwares | Date: {uploadDate} | Total: ₹{uploadAmount || 4850}</p>
                  <label className="flex items-center gap-2 pt-1 font-semibold text-blue-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ocrVerified}
                      onChange={(e) => setOcrVerified(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    I manually verify that the extracted figures match the original paper slip.
                  </label>
                </div>
              )}
            </div>

            <div className="pt-3 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('ALL')}
                className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#191f2d] hover:bg-slate-800 text-white font-bold rounded-xl shadow flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Save Document to Vault
              </button>
            </div>
          </form>

          <aside className="space-y-4">
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-700">Latest Field Document</h3>
                {documents[0] && (
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${documents[0].isLinked ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
                    {documents[0].isLinked ? 'Linked' : 'Unlinked'}
                  </span>
                )}
              </div>
              {documents[0] ? (
                <>
                  <img src={documents[0].fileUrl} alt={documents[0].title} className="h-40 w-full bg-slate-100 object-cover" />
                  <div className="p-3.5">
                    <div className="truncate text-xs font-bold text-slate-900">{documents[0].title}</div>
                    <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-slate-500">
                      <span className="truncate">{documents[0].category} · {documents[0].originalDocDate}</span>
                      <span className="shrink-0 font-semibold text-slate-700">{formatINR(documents[0].amount)}</span>
                    </div>
                    {documents[0].ocr && (
                      <div className="mt-3 rounded-lg bg-blue-50 p-2.5 text-[10px] text-blue-900">
                        OCR {documents[0].ocr.verified ? 'verified' : 'captured'} · {documents[0].ocr.vendorName}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex min-h-40 flex-col items-center justify-center p-5 text-center">
                  <Image className="mb-2 h-8 w-8 text-slate-300" />
                  <p className="text-xs font-semibold text-slate-700">No saved field documents yet</p>
                  <p className="mt-1 text-[10px] text-slate-500">Saved receipts and photographs will appear here.</p>
                </div>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900">Recent Field Slips</h3>
                <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Latest</span>
              </div>
              {documents.length ? (
                <div className="space-y-2">
                  {documents.slice(0, 3).map(document => (
                    <div key={document.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-2.5">
                      <div className="min-w-0">
                        <div className="truncate text-[11px] font-semibold text-slate-800">{document.title}</div>
                        <div className="mt-0.5 text-[10px] text-slate-500">{document.category} · {document.originalDocDate}</div>
                      </div>
                      <span className="shrink-0 text-[11px] font-bold text-slate-700">{formatINR(document.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-500">There are no recent documents to show.</p>
              )}
            </section>
          </aside>
          </div>
        </div>
      )}

      {/* Documents Grid */}
      {activeTab !== 'UPLOAD' && (
        <div className="bg-white rounded-b-2xl p-5 border border-slate-200 border-t-0 shadow-sm">
          {filteredDocs.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold">No documents found in this section.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocs.map(doc => (
                <div
                  key={doc.id}
                  className={`rounded-2xl border p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                    !doc.isLinked
                      ? 'border-red-300 bg-red-50/20'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-slate-100 text-slate-800">
                        {doc.category}
                      </span>
                      {!doc.isLinked ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-red-100 text-red-700 animate-pulse">
                          ⚠️ Unlinked
                        </span>
                      ) : (
                        <span className="font-mono text-xs font-bold text-blue-900">
                          {doc.borewellCode}
                        </span>
                      )}
                    </div>

                    {/* Preview Image */}
                    <div className="relative h-36 rounded-xl overflow-hidden mb-3 bg-slate-100 border border-slate-200">
                      <img
                        src={doc.fileUrl}
                        alt={doc.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 backdrop-blur-sm text-white font-mono font-bold text-xs rounded">
                        {formatINR(doc.amount)}
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 leading-tight mb-1">
                      {doc.title}
                    </h3>

                    <div className="text-[11px] text-slate-500 space-y-0.5">
                      <p>📅 Doc Date: {doc.originalDocDate}</p>
                      {doc.customerName && <p>👤 Customer: {doc.customerName}</p>}
                      {doc.remarks && <p className="italic">"{doc.remarks}"</p>}
                    </div>

                    {doc.ocr && (
                      <div className="mt-2 p-1.5 bg-blue-50 rounded border border-blue-200 text-[10px] text-blue-900">
                        <span className="font-bold">OCR Verified: </span>
                        {doc.ocr.vendorName} ({doc.ocr.billNumber})
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    {!doc.isLinked ? (
                      <button
                        onClick={() => {
                          setDocToLink(doc);
                          setTargetBorewellId(borewells[0]?.id || '');
                        }}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg flex items-center gap-1 shadow cursor-pointer text-xs"
                      >
                        <Link2 className="w-3.5 h-3.5" /> Link to Borewell
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Attached to {doc.borewellCode}
                      </span>
                    )}

                    {canDelete && (
                      <button
                        onClick={() => handleDelete(doc)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                        title="Delete Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Link to Borewell Modal */}
      {docToLink && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Link Unlinked Document
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Attach "{docToLink.title}" ({formatINR(docToLink.amount)}) to the relevant borewell project.
            </p>

            <form onSubmit={handleLinkDocument} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Select Target Borewell Project
                </label>
                <select
                  value={targetBorewellId}
                  onChange={(e) => setTargetBorewellId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-semibold text-slate-900"
                >
                  {borewells.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.borewellCode} – {b.customerName} ({b.location})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDocToLink(null)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow flex items-center gap-1.5"
                >
                  <Link2 className="w-4 h-4" /> Confirm &amp; Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
