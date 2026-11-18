// Sri Balaji Borewells - Dedicated Multi-Size Print & PDF Engine (4x6, A4, A5, Custom)
import React, { useState, useRef } from 'react';
import { X, Printer, Download, Settings, RefreshCw, ZoomIn, ZoomOut, Check } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Bill, CompanySettings, PaperSize, ColorMode, PrintOrientation } from '../../types';
import { formatINR, numberToIndianWords } from '../../utils/depthCalculator';
import { Logo } from '../common/Logo';

interface PrintModalProps {
  bill: Bill;
  settings: CompanySettings;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintModal: React.FC<PrintModalProps> = ({
  bill,
  settings,
  isOpen,
  onClose,
}) => {
  const [paperSize, setPaperSize] = useState<PaperSize>(settings.defaultPrintSettings.paperSize || '4x6');
  const [customWidthMm, setCustomWidthMm] = useState<number>(101.6);
  const [customHeightMm, setCustomHeightMm] = useState<number>(152.4);
  const [orientation, setOrientation] = useState<PrintOrientation>('portrait');
  const [colorMode, setColorMode] = useState<ColorMode>('color');
  const [layoutDensity, setLayoutDensity] = useState<'compact' | 'detailed'>('compact');
  const [scalePercent, setScalePercent] = useState<number>(100);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [showPrintControls, setShowPrintControls] = useState<boolean>(false);

  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Paper Dimensions in Millimeters
  const getPaperDimensions = () => {
    switch (paperSize) {
      case '4x6':
        return orientation === 'portrait' ? { w: 101.6, h: 152.4 } : { w: 152.4, h: 101.6 };
      case 'A4':
        return orientation === 'portrait' ? { w: 210, h: 297 } : { w: 297, h: 210 };
      case 'A5':
        return orientation === 'portrait' ? { w: 148, h: 210 } : { w: 210, h: 148 };
      case 'Custom':
        return { w: customWidthMm || 100, h: customHeightMm || 150 };
      default:
        return { w: 101.6, h: 152.4 };
    }
  };

  const { w: paperWidthMm, h: paperHeightMm } = getPaperDimensions();

  // Direct Browser Print handler with dynamic @page rule
  const handleDirectPrint = () => {
    const styleId = 'dynamic-print-page-style';
    let styleTag = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }

    styleTag.innerHTML = `
      @media print {
        @page {
          size: ${paperWidthMm}mm ${paperHeightMm}mm;
          margin: 0;
        }
        body {
          margin: 0;
          padding: 0;
          background: #fff !important;
        }
      }
    `;

    window.print();
  };

  // Genuine PDF Download matching selected dimensions
  const handleDownloadPdf = async () => {
    if (!printAreaRef.current) return;
    setIsGeneratingPdf(true);

    try {
      const element = printAreaRef.current;
      const canvas = await html2canvas(element, {
        scale: 3, // High DPI resolution for crisp printing
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: [paperWidthMm, paperHeightMm],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, paperWidthMm, paperHeightMm);
      const filename = `${bill.billNumber}_${bill.customerName.replace(/\s+/g, '_')}_${paperSize}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Error generating PDF. Please try again or use direct print.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const isCustomerBill = bill.billType === 'CUSTOMER';
  const is4x6 = paperSize === '4x6';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-between overflow-hidden animate-in fade-in duration-200">
      {/* Top Action Bar */}
      <div className="w-full bg-slate-900 border-b border-slate-800 text-white px-4 py-3 flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/30 text-blue-400 rounded-lg">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              Print &amp; PDF Center – {bill.billNumber}
              <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
                isCustomerBill ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'
              }`}>
                {bill.billType} BILL
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Customer: {bill.customerName} • Borewell: {bill.borewellCode} ({bill.totalDepth} ft)
            </p>
          </div>
        </div>

        {/* Quick Paper Size Selectors */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex bg-slate-800 p-1 rounded-lg border border-slate-700">
            {(['4x6', 'A4', 'A5', 'Custom'] as PaperSize[]).map((sz) => (
              <button
                key={sz}
                onClick={() => setPaperSize(sz)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  paperSize === sz
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                {sz === '4x6' ? '4×6" (Thermal / Mini)' : sz}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowPrintControls(!showPrintControls)}
            className={`p-2 rounded-lg border transition-colors flex items-center gap-1.5 text-xs font-medium ${
              showPrintControls
                ? 'bg-slate-700 border-slate-600 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Options</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition-all cursor-pointer"
          >
            {isGeneratingPdf ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> Download PDF
              </>
            )}
          </button>

          <button
            onClick={handleDirectPrint}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print Now
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Settings Drawer (Collapsible) */}
      {showPrintControls && (
        <div className="w-full bg-slate-800 border-b border-slate-700 px-6 py-3 text-slate-200 text-xs flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-md animate-in slide-in-from-top duration-150">
          <div className="flex flex-wrap items-center gap-5">
            {/* Paper Size */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Paper Size:</span>
              <select
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value as PaperSize)}
                className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-white focus:outline-none"
              >
                <option value="4x6">4×6 Inches (101.6 × 152.4 mm)</option>
                <option value="A4">A4 (210 × 297 mm)</option>
                <option value="A5">A5 (148 × 210 mm)</option>
                <option value="Custom">Custom Dimensions</option>
              </select>
            </div>

            {/* Custom Dimensions */}
            {paperSize === 'Custom' && (
              <div className="flex items-center gap-2 bg-slate-900 px-2 py-1 rounded border border-slate-700">
                <span>W (mm):</span>
                <input
                  type="number"
                  value={customWidthMm}
                  onChange={(e) => setCustomWidthMm(Number(e.target.value))}
                  className="w-16 bg-slate-800 px-1.5 py-0.5 rounded text-white text-center border border-slate-600"
                />
                <span>H (mm):</span>
                <input
                  type="number"
                  value={customHeightMm}
                  onChange={(e) => setCustomHeightMm(Number(e.target.value))}
                  className="w-16 bg-slate-800 px-1.5 py-0.5 rounded text-white text-center border border-slate-600"
                />
              </div>
            )}

            {/* Orientation */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Orientation:</span>
              <button
                onClick={() => setOrientation('portrait')}
                className={`px-2 py-1 rounded ${orientation === 'portrait' ? 'bg-blue-600 text-white font-bold' : 'bg-slate-700 text-slate-300'}`}
              >
                Portrait
              </button>
              <button
                onClick={() => setOrientation('landscape')}
                className={`px-2 py-1 rounded ${orientation === 'landscape' ? 'bg-blue-600 text-white font-bold' : 'bg-slate-700 text-slate-300'}`}
              >
                Landscape
              </button>
            </div>

            {/* Color Mode */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Color:</span>
              <button
                onClick={() => setColorMode('color')}
                className={`px-2 py-1 rounded ${colorMode === 'color' ? 'bg-blue-600 text-white font-bold' : 'bg-slate-700 text-slate-300'}`}
              >
                Color
              </button>
              <button
                onClick={() => setColorMode('bw')}
                className={`px-2 py-1 rounded ${colorMode === 'bw' ? 'bg-slate-950 text-white border border-slate-500 font-bold' : 'bg-slate-700 text-slate-300'}`}
              >
                Mono / B&amp;W
              </button>
            </div>

            {/* Layout Density */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Layout:</span>
              <button
                onClick={() => setLayoutDensity('compact')}
                className={`px-2 py-1 rounded ${layoutDensity === 'compact' ? 'bg-blue-600 text-white font-bold' : 'bg-slate-700 text-slate-300'}`}
              >
                Compact (Fit)
              </button>
              <button
                onClick={() => setLayoutDensity('detailed')}
                className={`px-2 py-1 rounded ${layoutDensity === 'detailed' ? 'bg-blue-600 text-white font-bold' : 'bg-slate-700 text-slate-300'}`}
              >
                Detailed
              </button>
            </div>
          </div>

          {/* Scale Control */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Scale:</span>
            <button
              onClick={() => setScalePercent(Math.max(70, scalePercent - 5))}
              className="p-1 bg-slate-700 rounded hover:bg-slate-600"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-white w-10 text-center">{scalePercent}%</span>
            <button
              onClick={() => setScalePercent(Math.min(130, scalePercent + 5))}
              className="p-1 bg-slate-700 rounded hover:bg-slate-600"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Preview Container with Canvas Background */}
      <div className="flex-1 w-full overflow-auto p-4 md:p-8 flex items-center justify-center bg-slate-950/90">
        <div
          style={{
            transform: `scale(${scalePercent / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
          }}
          className="shadow-2xl rounded-sm"
        >
          {/* Printable Element - Ref captured by html2canvas & direct print */}
          <div
            ref={printAreaRef}
            id="print-document"
            style={{
              width: `${paperWidthMm}mm`,
              minHeight: `${paperHeightMm}mm`,
              boxSizing: 'border-box',
              backgroundColor: '#ffffff',
              color: '#000000',
              filter: colorMode === 'bw' ? 'grayscale(100%) contrast(120%)' : 'none',
            }}
            className={`print-container relative ${is4x6 ? 'p-3 text-[10px] leading-tight' : 'p-8 text-xs leading-normal'}`}
          >
            {/* Header: Sri Balaji Borewells */}
            <div className="border-b-2 border-slate-900 pb-2 mb-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Logo 
                  size={is4x6 ? 'print-4x6' : (paperSize === 'A5' ? 'sm' : 'print')} 
                  variant="print" 
                  customLogoUrl="/logo.svg"
                  imageClassName="drop-shadow-sm"
                />
                <div>
                  <h1 className={`font-black tracking-tight text-slate-900 ${is4x6 ? 'text-base leading-tight' : 'text-2xl'}`}>
                    Sri Balaji Borewells
                  </h1>
                  <p className={`font-bold tracking-wide uppercase ${colorMode === 'color' ? 'text-red-700' : 'text-slate-700'} ${is4x6 ? 'text-[8.5px]' : 'text-xs'}`}>
                    Borewell Drilling &amp; Water Solutions
                  </p>
                  <p className={`text-slate-600 ${is4x6 ? 'text-[8px]' : 'text-[11px]'}`}>
                    {settings.address}, {settings.district}
                  </p>
                  <p className={`font-bold text-slate-800 ${is4x6 ? 'text-[8.5px]' : 'text-[11px]'}`}>
                    📞 {settings.primaryPhone} {settings.secondaryPhone ? `| ${settings.secondaryPhone}` : ''}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className={`font-black uppercase inline-block px-2.5 py-1 rounded border-2 ${
                  colorMode === 'color' 
                    ? (isCustomerBill ? 'bg-red-50 text-red-700 border-red-600' : 'bg-orange-50 text-orange-800 border-orange-600') 
                    : 'bg-slate-200 text-black border-slate-900'
                } ${is4x6 ? 'text-[9px]' : 'text-xs'}`}>
                  {bill.billType === 'CUSTOMER' ? 'CUSTOMER INVOICE' : 'OWNER DRILLING STATEMENT'}
                </div>
                <div className={`font-mono font-bold text-slate-900 mt-1 ${is4x6 ? 'text-[10px]' : 'text-sm'}`}>
                  {bill.billNumber}
                </div>
                <div className={`text-slate-600 ${is4x6 ? 'text-[8.5px]' : 'text-xs'}`}>
                  Date: <span className="font-semibold text-slate-900">{bill.billDate}</span>
                </div>
              </div>
            </div>

            {/* Customer & Borewell Details Card */}
            <div className={`grid grid-cols-2 gap-2 p-2 bg-slate-50 border border-slate-300 rounded mb-2.5 ${is4x6 ? 'text-[8.5px]' : 'text-xs'}`}>
              <div>
                <p className="font-bold text-slate-900 uppercase">Customer Details:</p>
                <p className="font-semibold text-slate-900">{bill.customerName}</p>
                <p className="text-slate-700">{bill.customerAddress}</p>
                <p className="text-slate-700 font-mono">Phone: {bill.customerPhone}</p>
                <p className="text-slate-700 font-semibold mt-1">Manager: {bill.managerName || bill.createdBy || '—'}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-900 uppercase">Borewell Particulars:</p>
                <p className="font-semibold text-slate-900 font-mono">Borewell ID: {bill.borewellCode}</p>
                <p className="text-slate-700">Location: {bill.drillingLocation}</p>
                <p className="text-slate-700">
                  Total Depth: <span className="font-bold text-slate-900">{bill.totalDepth} Feet</span>
                </p>
                <p className="text-slate-600">Rock: {bill.rockType} | Rig: {bill.machineDetails}</p>
                <p className="text-slate-700 font-semibold mt-1">Driller: {bill.drillerName}</p>
              </div>
            </div>

            {/* Depth-wise Drilling Table */}
            <div className="mb-2.5">
              <div className={`font-bold text-slate-900 uppercase tracking-wide border-b border-slate-400 pb-0.5 mb-1 ${is4x6 ? 'text-[8.5px]' : 'text-xs'}`}>
                1. Depth-Wise Drilling Charges:
              </div>
              <table className="w-full border-collapse border border-slate-300 text-left">
                <thead>
                  <tr className="bg-slate-200 border-b border-slate-300 text-slate-900">
                    <th className={`border-r border-slate-300 p-1 font-bold ${is4x6 ? 'text-[8px]' : 'text-xs'}`}>Depth Slab</th>
                    <th className={`border-r border-slate-300 p-1 text-right font-bold ${is4x6 ? 'text-[8px]' : 'text-xs'}`}>Feet Drilled</th>
                    <th className={`border-r border-slate-300 p-1 text-right font-bold ${is4x6 ? 'text-[8px]' : 'text-xs'}`}>Rate / Ft</th>
                    <th className={`p-1 text-right font-bold ${is4x6 ? 'text-[8px]' : 'text-xs'}`}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {bill.calculation.slabRows.map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className={`border-r border-slate-300 p-1 font-medium ${is4x6 ? 'text-[8px]' : 'text-xs'}`}>
                        {row.fromFeet} ft to {row.toFeet} ft
                      </td>
                      <td className={`border-r border-slate-300 p-1 text-right font-mono ${is4x6 ? 'text-[8px]' : 'text-xs'}`}>
                        {row.feetInSlab} ft
                      </td>
                      <td className={`border-r border-slate-300 p-1 text-right font-mono ${is4x6 ? 'text-[8px]' : 'text-xs'}`}>
                        ₹{row.ratePerFoot}
                      </td>
                      <td className={`p-1 text-right font-bold font-mono ${is4x6 ? 'text-[8px]' : 'text-xs'}`}>
                        {formatINR(row.amount)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-bold border-t border-slate-400">
                    <td colSpan={3} className={`p-1 text-right border-r border-slate-300 ${is4x6 ? 'text-[8px]' : 'text-xs'}`}>
                      Total Drilling Depth Charges ({bill.totalDepth} ft):
                    </td>
                    <td className={`p-1 text-right font-mono text-slate-900 ${is4x6 ? 'text-[8.5px]' : 'text-xs'}`}>
                      {formatINR(bill.calculation.drillingSubtotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Additional Charges Table (Shown fully on Customer Bill; omitted/condensed on Owner Bill) */}
            {isCustomerBill && (
              <div className="mb-2.5">
                <div className={`font-bold text-slate-900 uppercase tracking-wide border-b border-slate-400 pb-0.5 mb-1 ${is4x6 ? 'text-[8.5px]' : 'text-xs'}`}>
                  2. Materials, Casing &amp; Additional Charges:
                </div>
                <table className="w-full border-collapse border border-slate-300 text-left">
                  <thead>
                    <tr className="bg-slate-200 border-b border-slate-300 text-slate-900">
                      <th className={`border-r border-slate-300 p-1 font-bold ${is4x6 ? 'text-[8px]' : 'text-xs'}`}>Particulars</th>
                      <th className={`border-r border-slate-300 p-1 text-center font-bold ${is4x6 ? 'text-[8px]' : 'text-xs'}`}>Qty / Unit</th>
                      <th className={`border-r border-slate-300 p-1 text-right font-bold ${is4x6 ? 'text-[8px]' : 'text-xs'}`}>Rate (₹)</th>
                      <th className={`p-1 text-right font-bold ${is4x6 ? 'text-[8px]' : 'text-xs'}`}>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {bill.calculation.casingAmount > 0 && (
                      <tr>
                        <td className={`border-r border-slate-300 p-1 font-medium ${is4x6 ? 'text-[8px]' : 'text-xs'}`}>MS Heavy Casing Pipe</td>
                        <td className={`border-r border-slate-300 p-1 text-center font-mono ${is4x6 ? 'text-[8px]' : 'text-xs'}`}>{bill.calculation.casingQty} ft</td>
                        <td className={`border-r border-slate-300 p-1 text-right font-mono ${is4x6 ? 'text-[8px]' : 'text-xs'}`}>₹{bill.calculation.casingRate}</td>
                        <td className={`p-1 text-right font-bold font-mono ${is4x6 ? 'text-[8px]' : 'text-xs'}`}>{formatINR(bill.calculation.casingAmount)}</td>
                      </tr>
                    )}
                    {bill.calculation.callerAmount > 0 && (
                      <tr>
                        <td className={`border-r border-slate-300 p-1 font-medium ${is4x6 ? 'text-[8px]' : 'text-xs'}`}>Caller</td>
                        <td className={`border-r border-slate-300 p-1 text-center font-mono ${is4x6 ? 'text-[8px]' : 'text-xs'}`}>{bill.calculation.callerQty} nos</td>
                        <td className={`border-r border-slate-300 p-1 text-right font-mono ${is4x6 ? 'text-[8px]' : 'text-xs'}`}>₹{bill.calculation.callerRate}</td>
                        <td className={`p-1 text-right font-bold font-mono ${is4x6 ? 'text-[8px]' : 'text-xs'}`}>{formatINR(bill.calculation.callerAmount)}</td>
                      </tr>
                    )}
                    {bill.calculation.weldingAmount > 0 && (
                      <tr>
                        <td className={`border-r border-slate-300 p-1 font-medium ${is4x6 ? 'text-[8px]' : 'text-xs'}`}>Pipe Joint Welding</td>
                        <td className={`border-r border-slate-300 p-1 text-center font-mono ${is4x6 ? 'text-[8px]' : 'text-xs'}`}>{bill.calculation.weldingQty} joints</td>
                        <td className={`border-r border-slate-300 p-1 text-right font-mono ${is4x6 ? 'text-[8px]' : 'text-xs'}`}>₹{bill.calculation.weldingRate}</td>
                        <td className={`p-1 text-right font-bold font-mono ${is4x6 ? 'text-[8px]' : 'text-xs'}`}>{formatINR(bill.calculation.weldingAmount)}</td>
                      </tr>
                    )}
                    {bill.calculation.mealsCharge > 0 && (
                      <tr>
                        <td className={`border-r border-slate-300 p-1 font-medium ${is4x6 ? 'text-[8px]' : 'text-xs'}`}>Crew Meals &amp; Refreshments</td>
                        <td className={`border-r border-slate-300 p-1 text-center ${is4x6 ? 'text-[8px]' : 'text-xs'}`}>{bill.calculation.mealsType === 'fixed' ? 'Fixed' : `${bill.calculation.mealsQty} days`}</td>
                        <td className={`border-r border-slate-300 p-1 text-right font-mono ${is4x6 ? 'text-[8px]' : 'text-xs'}`}>-</td>
                        <td className={`p-1 text-right font-bold font-mono ${is4x6 ? 'text-[8px]' : 'text-xs'}`}>{formatINR(bill.calculation.mealsCharge)}</td>
                      </tr>
                    )}
                    {bill.calculation.transportCharge > 0 && (
                      <tr>
                        <td className={`border-r border-slate-300 p-1 font-medium ${is4x6 ? 'text-[8px]' : 'text-xs'}`}>Vehicle Rig Transport / Batta</td>
                        <td className={`border-r border-slate-300 p-1 text-center ${is4x6 ? 'text-[8px]' : 'text-xs'}`}>{bill.calculation.transportType === 'fixed' ? 'Fixed' : `${bill.calculation.transportQty} trips`}</td>
                        <td className={`border-r border-slate-300 p-1 text-right font-mono ${is4x6 ? 'text-[8px]' : 'text-xs'}`}>-</td>
                        <td className={`p-1 text-right font-bold font-mono ${is4x6 ? 'text-[8px]' : 'text-xs'}`}>{formatINR(bill.calculation.transportCharge)}</td>
                      </tr>
                    )}
                    {bill.calculation.otherCharges.map((other, idx) => (
                      <tr key={idx}>
                        <td className={`border-r border-slate-300 p-1 font-medium ${is4x6 ? 'text-[8px]' : 'text-xs'}`}>{other.description}</td>
                        <td className={`border-r border-slate-300 p-1 text-center ${is4x6 ? 'text-[8px]' : 'text-xs'}`}>1</td>
                        <td className={`border-r border-slate-300 p-1 text-right font-mono ${is4x6 ? 'text-[8px]' : 'text-xs'}`}>₹{other.amount}</td>
                        <td className={`p-1 text-right font-bold font-mono ${is4x6 ? 'text-[8px]' : 'text-xs'}`}>{formatINR(other.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Total, Paid, and Pending Summary Box */}
            <div className="border-2 border-slate-900 rounded p-2 mb-2 bg-slate-50">
              <div className="grid grid-cols-3 gap-2 text-center divide-x divide-slate-300">
                <div>
                  <div className={`text-slate-600 font-bold uppercase ${is4x6 ? 'text-[7.5px]' : 'text-[10px]'}`}>
                    Grand Total Amount
                  </div>
                  <div className={`font-black font-mono text-slate-900 ${is4x6 ? 'text-xs' : 'text-base'}`}>
                    {formatINR(bill.grandTotal)}
                  </div>
                </div>
                <div>
                  <div className={`text-slate-600 font-bold uppercase ${is4x6 ? 'text-[7.5px]' : 'text-[10px]'}`}>
                    Amount Received
                  </div>
                  <div className={`font-black font-mono text-emerald-700 ${is4x6 ? 'text-xs' : 'text-base'}`}>
                    {formatINR(bill.amountReceived)}
                  </div>
                </div>
                <div>
                  <div className={`text-slate-600 font-bold uppercase ${is4x6 ? 'text-[7.5px]' : 'text-[10px]'}`}>
                    Balance Pending
                  </div>
                  <div className={`font-black font-mono ${bill.pendingBalance > 0 ? 'text-red-700' : 'text-slate-900'} ${is4x6 ? 'text-xs' : 'text-base'}`}>
                    {formatINR(bill.pendingBalance)}
                  </div>
                </div>
              </div>

              {/* Amount in Words */}
              <div className={`mt-1.5 pt-1.5 border-t border-slate-200 text-slate-700 italic font-serif ${is4x6 ? 'text-[8px]' : 'text-[11px]'}`}>
                <span className="font-sans font-bold not-italic">Amount in Words: </span>
                {numberToIndianWords(bill.grandTotal)}
              </div>
            </div>

            {/* Internal Remarks on Owner Bill */}
            {!isCustomerBill && bill.internalRemarks && (
              <div className="mb-2 p-1.5 bg-yellow-50 border border-yellow-300 rounded text-[9px] text-yellow-900">
                <span className="font-bold">Internal Statement Notes: </span>
                {bill.internalRemarks}
              </div>
            )}

            {/* Notes / Terms */}
            {bill.notes && (
              <p className={`text-slate-500 mb-2 italic ${is4x6 ? 'text-[7.5px]' : 'text-[10px]'}`}>
                * {bill.notes}
              </p>
            )}

            {/* Signatures Section (3 Signatures: Party, Driller, Manager/Owner) */}
            <div className={`pt-3 border-t border-slate-300 grid grid-cols-3 gap-2 text-center text-slate-800 ${is4x6 ? 'text-[8px]' : 'text-xs'} mt-auto`}>
              <div>
                <div className="h-7 border-b border-dashed border-slate-400 mb-1" />
                <p className="font-bold">Party / Customer Signature</p>
                <p className="text-[8px] text-slate-500">({bill.customerName})</p>
              </div>
              <div>
                <div className="h-7 border-b border-dashed border-slate-400 mb-1" />
                <p className="font-bold">Driller Incharge Signature</p>
                <p className="text-[8px] text-slate-500">({bill.drillerName})</p>
              </div>
              <div>
                <div className="h-7 border-b border-dashed border-slate-400 mb-1" />
                <p className="font-bold">For Sri Balaji Borewells</p>
                <p className="text-[8px] text-slate-500">(Authorized Signatory)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
