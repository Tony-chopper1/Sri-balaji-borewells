// Sri Balaji Borewells - Payment Receipt Voucher Modal
import React, { useRef } from 'react';
import { X, Printer, Download, CreditCard, CheckCircle2 } from 'lucide-react';
import { Payment, CompanySettings } from '../../types';
import { formatINR, numberToIndianWords } from '../../utils/depthCalculator';
import { Logo } from '../common/Logo';

interface PaymentReceiptModalProps {
  payment: Payment;
  settings: CompanySettings;
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  payment,
  settings,
  isOpen,
  onClose,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-auto">
        {/* Top Controls */}
        <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-sm">Payment Receipt Voucher</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Print Receipt
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Area */}
        <div ref={receiptRef} className="p-6 text-slate-900 text-xs">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-3 mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Logo size="print-4x6" variant="print" customLogoUrl="/logo.svg" />
              <div>
                <h1 className="font-black text-base text-slate-900 tracking-tight">Sri Balaji Borewells</h1>
                <p className="text-[10px] text-red-600 font-bold uppercase">Official Payment Receipt</p>
                <p className="text-[9px] text-slate-500">{settings.address}, {settings.district}</p>
                <p className="text-[9px] font-bold text-slate-700">📞 {settings.primaryPhone}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono font-black text-sm text-emerald-800">{payment.receiptNumber}</span>
              <p className="text-[10px] text-slate-500 mt-1">Date: <span className="font-semibold text-slate-900">{payment.paymentDate}</span></p>
            </div>
          </div>

          {/* Receipt Body */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5 mb-4">
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="text-slate-500 font-semibold">Received From:</span>
              <span className="font-bold text-slate-900 text-sm">{payment.customerName}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="text-slate-500 font-semibold">Borewell Project:</span>
              <span className="font-mono font-bold text-cyan-900">{payment.borewellCode}</span>
            </div>
            {payment.billNumber && (
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500 font-semibold">Against Bill No:</span>
                <span className="font-mono font-bold text-slate-800">{payment.billNumber}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="text-slate-500 font-semibold">Payment Mode:</span>
              <span className="font-bold text-slate-800 px-2 py-0.5 rounded bg-white border border-slate-300">
                {payment.paymentMethod}
              </span>
            </div>
            {payment.referenceNumber && (
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500 font-semibold">Ref / Transaction ID:</span>
                <span className="font-mono text-slate-800">{payment.referenceNumber}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2">
              <span className="text-slate-900 font-bold uppercase">Amount Received:</span>
              <span className="font-mono font-black text-lg text-emerald-700">
                {formatINR(payment.amount)}
              </span>
            </div>
          </div>

          {/* Amount in words */}
          <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-950 italic text-[11px] mb-4">
            <span className="font-sans font-bold not-italic">In Words: </span>
            {numberToIndianWords(payment.amount)}
          </div>

          {payment.remarks && (
            <p className="text-[11px] text-slate-600 mb-6 italic">
              Note: {payment.remarks}
            </p>
          )}

          {/* Signature */}
          <div className="flex items-end justify-between pt-6 border-t border-slate-300 mt-6 text-center">
            <div>
              <div className="w-32 border-b border-dashed border-slate-400 mb-1" />
              <p className="text-[9px] text-slate-500">Customer Signature</p>
            </div>
            <div>
              <div className="w-36 border-b border-dashed border-slate-400 mb-1" />
              <p className="font-bold text-[10px] text-slate-900">For Sri Balaji Borewells</p>
              <p className="text-[8px] text-slate-500">Authorized Receiver: {payment.recordedBy}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
