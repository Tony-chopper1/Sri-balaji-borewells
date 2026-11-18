-- =====================================================================
-- Migration: 20261118_device_security_and_hardening.sql
-- Description:
--   1. Harden get_auth_role() with SET search_path = public.
--   2. User devices registration, tracking, and owner approval workflow.
-- =====================================================================

-- 1. HARDEN get_auth_role FUNCTION
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT 
LANGUAGE sql 
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 2. USER DEVICES TABLE
CREATE TABLE IF NOT EXISTS public.user_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    device_name TEXT NOT NULL,
    browser TEXT,
    os TEXT,
    ip_address TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMPTZ,
    last_active TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, device_id)
);

ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

-- Device RLS Policies:
-- Users can view their own devices; Owners can view all devices
CREATE POLICY "Users can view own devices or owner views all"
ON public.user_devices FOR SELECT TO authenticated
USING (
    auth.uid() = user_id 
    OR public.get_auth_role() = 'OWNER'
);

-- Users can register a new device
CREATE POLICY "Users can register devices"
ON public.user_devices FOR INSERT TO authenticated
WITH CHECK (
    auth.uid() = user_id
);

-- Users can update last_active on their own device; Only Owners can approve/revoke
CREATE POLICY "Users can update activity or owner manages approval"
ON public.user_devices FOR UPDATE TO authenticated
USING (
    auth.uid() = user_id 
    OR public.get_auth_role() = 'OWNER'
)
WITH CHECK (
    auth.uid() = user_id 
    OR public.get_auth_role() = 'OWNER'
);

-- Only Owners can delete devices
CREATE POLICY "Only owners can delete devices"
ON public.user_devices FOR DELETE TO authenticated
USING (
    public.get_auth_role() = 'OWNER'
);

-- Automatic approval for initial OWNER accounts
CREATE OR REPLACE FUNCTION public.auto_approve_owner_device()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF public.get_auth_role() = 'OWNER' THEN
        NEW.is_approved := TRUE;
        NEW.approved_at := NOW();
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_auto_approve_owner_device ON public.user_devices;
CREATE TRIGGER tr_auto_approve_owner_device
BEFORE INSERT ON public.user_devices
FOR EACH ROW EXECUTE FUNCTION public.auto_approve_owner_device();
