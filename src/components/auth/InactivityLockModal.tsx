import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldAlert, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../common/Logo';
import { OFFICIAL_COMPANY_NAME } from '../../constants/branding';

interface InactivityLockModalProps {
  onUnlock: () => void;
}

export const InactivityLockModal: React.FC<InactivityLockModalProps> = ({ onUnlock }) => {
  const { currentUser, login, logout } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Password is required to resume session.');
      return;
    }

    setError('');
    setIsVerifying(true);
    try {
      await login(currentUser.email, password);
      onUnlock();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid credentials. Please enter your password to unlock.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800">
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 text-center text-white border-b border-slate-800 flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2 border border-amber-500/30">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black tracking-tight uppercase">Session Auto-Locked</h2>
          <p className="text-xs text-slate-400 mt-1">
            Inactive for 10 minutes. Enter your password to continue.
          </p>
        </div>

        <form onSubmit={handleUnlock} className="p-6 space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-9 h-9 rounded-full bg-[#191f2d] text-white flex items-center justify-center font-bold text-xs">
              {currentUser.role[0]}
            </div>
            <div className="text-left flex-1 min-w-0">
              <div className="text-sm font-bold truncate text-slate-900">{currentUser.name || currentUser.email}</div>
              <div className="text-[10px] text-slate-500 font-mono font-semibold uppercase">
                {currentUser.role} • {currentUser.email}
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Account Password
            </label>
            <input
              type="password"
              autoFocus
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password to unlock"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          <button
            type="submit"
            disabled={isVerifying}
            className="w-full py-3 px-4 bg-[#191f2d] hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
          >
            <span>{isVerifying ? 'Verifying…' : 'Unlock & Resume Working'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => void logout()}
            className="w-full py-2.5 px-4 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Completely</span>
          </button>
        </form>
      </div>
    </div>
  );
};
