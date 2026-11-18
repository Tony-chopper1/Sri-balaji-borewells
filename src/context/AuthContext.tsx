import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { UserDeviceRecord, UserProfile, UserRole } from '../types';
import { isSupabaseConfigured, supabase } from '../services/supabase';
import { repository } from '../services/repository';
import { getDeviceInfo } from '../utils/deviceSecurity';

interface AuthContextType {
  currentUser: UserProfile;
  actualUserRole: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDeviceApproved: boolean;
  checkDeviceStatus: () => Promise<boolean>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  setRole: (role: UserRole) => void;
  canEditRates: boolean;
  canDelete: boolean;
  canManageSettings: boolean;
  canGenerateOwnerBill: boolean;
  canManageUsers: boolean;
  canRecordPayments: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function isUserRole(role: string): role is UserRole {
  return role === 'OWNER' || role === 'MANAGER' || role === 'EMPLOYEE';
}

async function loadUserProfile(session: Session): Promise<UserProfile> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, phone')
    .eq('id', session.user.id)
    .single();

  if (error) throw new Error(`Could not load your profile: ${error.message}`);
  if (!data || !isUserRole(data.role)) {
    throw new Error('Your profile has no valid role. Ask an administrator to configure it.');
  }

  await repository.initialize();

  return {
    id: data.id,
    email: data.email,
    name: data.full_name,
    role: data.role,
    phone: data.phone || undefined,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [previewRole, setPreviewRole] = useState<UserRole>('OWNER');
  const [isLoading, setIsLoading] = useState(true);
  const [isDeviceApproved, setIsDeviceApproved] = useState<boolean>(true);

  const checkDeviceStatus = useCallback(async (): Promise<boolean> => {
    if (!supabase || !profile) return true;

    // Owners are automatically trusted on all devices
    if (profile.role === 'OWNER') {
      setIsDeviceApproved(true);
      return true;
    }

    const devInfo = getDeviceInfo();
    try {
      // Check user_devices table in Supabase
      const { data, error } = await supabase
        .from('user_devices')
        .select('is_approved')
        .eq('user_id', profile.id)
        .eq('device_id', devInfo.deviceId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.warn('user_devices check notice:', error.message);
      }

      if (data) {
        setIsDeviceApproved(Boolean(data.is_approved));
        return Boolean(data.is_approved);
      }

      // If not registered yet, register device in pending state
      await supabase.from('user_devices').insert({
        user_id: profile.id,
        device_id: devInfo.deviceId,
        device_name: devInfo.deviceName,
        browser: devInfo.browser,
        os: devInfo.os,
        is_approved: false,
      });

      setIsDeviceApproved(false);
      return false;
    } catch {
      // If table is not yet migrated, do not crash application
      return true;
    }
  }, [profile]);

  const applySession = useCallback(async (session: Session | null) => {
    if (!session) {
      setProfile(null);
      return;
    }

    try {
      const loadedProfile = await loadUserProfile(session);
      setProfile(loadedProfile);
      setPreviewRole(loadedProfile.role);
    } catch (error) {
      await supabase?.auth.signOut();
      setProfile(null);
      throw error;
    }
  }, []);

  useEffect(() => {
    if (profile) {
      void checkDeviceStatus();
    }
  }, [profile, checkDeviceStatus]);

  useEffect(() => {
    let active = true;

    const initializeAuth = async () => {
      if (!isSupabaseConfigured || !supabase) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (active) await applySession(data.session);
      } catch (error) {
        console.error('Unable to restore Supabase session:', error);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void initializeAuth();
    const { data: { subscription } } = supabase?.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' && active) setProfile(null);
    }) ?? { data: { subscription: null } };

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, [applySession]);

  const login = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase is not configured. Add the project URL and anon key to .env.');

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    if (!data.session) throw new Error('Supabase sign-in did not return a session.');

    await applySession(data.session);
  };

  const logout = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(`Could not sign out: ${error.message}`);
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    });
    if (error) throw new Error(error.message);
  };

  // Secure Role Switcher: Only true database Owners can switch preview roles!
  const setRole = (role: UserRole) => {
    if (profile?.role !== 'OWNER') {
      console.warn('Security alert: Non-owner attempted to switch role privileges.');
      return;
    }
    setPreviewRole(role);
  };

  // Role permissions: If user is NOT an Owner in the database, role is hard locked to their DB role!
  const effectiveRole = profile?.role === 'OWNER' ? previewRole : (profile?.role || 'EMPLOYEE');

  const currentUser = useMemo(
    () => profile
      ? { ...profile, role: effectiveRole }
      : { id: '', name: '', email: '', role: 'EMPLOYEE' as const },
    [profile, effectiveRole],
  );

  // Secure permission checks: Owner capabilities strictly require genuine DB Owner profile!
  const isActualOwner = profile?.role === 'OWNER';
  const isEffectiveOwner = effectiveRole === 'OWNER' && isActualOwner;
  const isEffectiveManager = effectiveRole === 'MANAGER';

  const value: AuthContextType = {
    currentUser,
    actualUserRole: profile?.role || 'EMPLOYEE',
    isAuthenticated: Boolean(profile),
    isLoading,
    isDeviceApproved,
    checkDeviceStatus,
    login,
    logout,
    resetPassword,
    setRole,
    canEditRates: Boolean(isEffectiveOwner),
    canDelete: Boolean(isEffectiveOwner),
    canManageSettings: Boolean(isEffectiveOwner),
    canGenerateOwnerBill: Boolean(isEffectiveOwner || isEffectiveManager),
    canManageUsers: Boolean(isEffectiveOwner),
    canRecordPayments: Boolean(isEffectiveOwner || isEffectiveManager),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
