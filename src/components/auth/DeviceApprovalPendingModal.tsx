import React from 'react';
import { Smartphone, ShieldAlert, LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../common/Logo';
import { OFFICIAL_COMPANY_NAME } from '../../constants/branding';
import { DeviceInfo } from '../../utils/deviceSecurity';

interface DeviceApprovalPendingModalProps {
  deviceInfo: DeviceInfo;
  onRefresh: () => void;
}

export const DeviceApprovalPendingModal: React.FC<DeviceApprovalPendingModalProps> = ({
  deviceInfo,
  onRefresh,
}) => {
  const { currentUser, logout } = useAuth();

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800">
        <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 p-6 text-center text-white border-b border-amber-900/50 flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3 border border-amber-500/30">
            <Smartphone className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-black tracking-tight uppercase">New Device Verification</h2>
          <p className="text-xs text-amber-300/80 mt-1">
            Access Pending Owner Approval
          </p>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <p className="leading-relaxed">
              This browser or device has not been approved for company operations yet. For security against unauthorized access, an account with the <strong>OWNER</strong> role must approve it.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">
              Device Signature
            </span>
            <div className="flex justify-between">
              <span className="text-slate-500">Device Name:</span>
              <span className="font-semibold text-slate-800">{deviceInfo.deviceName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Operating System:</span>
              <span className="font-semibold text-slate-800">{deviceInfo.os}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Browser:</span>
              <span className="font-semibold text-slate-800">{deviceInfo.browser}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-200">
              <span className="text-slate-500">Device ID:</span>
              <span className="font-mono text-[10px] text-slate-600 truncate max-w-[180px]">
                {deviceInfo.deviceId}
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={onRefresh}
              className="w-full py-3 px-4 bg-[#191f2d] hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Check Approval Status</span>
            </button>

            <button
              type="button"
              onClick={() => void logout()}
              className="w-full py-2.5 px-4 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
