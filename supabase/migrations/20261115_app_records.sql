-- Data store used by the current application repository.
CREATE TABLE IF NOT EXISTS public.app_records (
    bucket TEXT NOT NULL,
    record_id TEXT NOT NULL,
    data JSONB NOT NULL,
    updated_by UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (bucket, record_id)
);

ALTER TABLE public.app_records ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_records TO authenticated;

CREATE POLICY "Authenticated users can read application records"
ON public.app_records FOR SELECT TO authenticated
USING (
    auth.uid() IS NOT NULL
    AND (
        bucket <> 'borewell_logs_v1'
        OR public.get_auth_role() IN ('OWNER', 'MANAGER')
    )
);

CREATE POLICY "Users can create permitted application records"
ON public.app_records FOR INSERT TO authenticated
WITH CHECK (
    (bucket IN (
        'borewell_customers_v1',
        'borewell_borewells_v1',
        'borewell_documents_v1',
        'borewell_expenses_v1',
        'borewell_petrol_bunks_v1',
        'borewell_logs_v1'
    ))
    OR (
        bucket IN ('borewell_bills_v1', 'borewell_payments_v1')
        AND public.get_auth_role() IN ('OWNER', 'MANAGER')
    )
    OR (
        bucket = 'borewell_settings_v1'
        AND public.get_auth_role() = 'OWNER'
    )
);

CREATE POLICY "Users can update permitted application records"
ON public.app_records FOR UPDATE TO authenticated
USING (
    (
        bucket IN (
            'borewell_customers_v1',
            'borewell_borewells_v1',
            'borewell_documents_v1',
            'borewell_petrol_bunks_v1'
        )
        AND public.get_auth_role() IN ('OWNER', 'MANAGER')
    )
    OR (
        bucket IN (
            'borewell_bills_v1',
            'borewell_payments_v1',
            'borewell_expenses_v1',
            'borewell_settings_v1',
            'borewell_logs_v1'
        )
        AND public.get_auth_role() = 'OWNER'
    )
)
WITH CHECK (
    (
        bucket IN (
            'borewell_customers_v1',
            'borewell_borewells_v1',
            'borewell_documents_v1',
            'borewell_petrol_bunks_v1'
        )
        AND public.get_auth_role() IN ('OWNER', 'MANAGER')
    )
    OR (
        bucket IN (
            'borewell_bills_v1',
            'borewell_payments_v1',
            'borewell_expenses_v1',
            'borewell_settings_v1',
            'borewell_logs_v1'
        )
        AND public.get_auth_role() = 'OWNER'
    )
);

CREATE POLICY "Only owners can delete application records"
ON public.app_records FOR DELETE TO authenticated
USING (
    bucket <> 'borewell_logs_v1'
    AND public.get_auth_role() = 'OWNER'
);

-- New Supabase Auth users start as employees. Promote the initial owner
-- manually in the Supabase SQL editor after creating their Auth account.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
        'EMPLOYEE'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Owners can manage profiles"
ON public.profiles FOR UPDATE TO authenticated
USING (public.get_auth_role() = 'OWNER')
WITH CHECK (public.get_auth_role() = 'OWNER');
