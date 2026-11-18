-- =====================================================================
-- Sri Balaji Borewells - COMPLETE PRODUCTION POSTGRESQL SCHEMA WITH RLS
-- Official Company: Sri Balaji Borewells
-- =====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Users & Roles)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('OWNER', 'MANAGER', 'EMPLOYEE')),
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. COMPANY SETTINGS
CREATE TABLE IF NOT EXISTS company_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name TEXT NOT NULL DEFAULT 'Sri Balaji Borewells',
    tagline TEXT DEFAULT 'Professional Borewell Drilling & Water Exploration',
    logo_url TEXT,
    primary_phone TEXT NOT NULL DEFAULT '+91 98868 87971',
    secondary_phone TEXT DEFAULT '+91 94481 23456',
    email TEXT DEFAULT 'contact@skbsborewells.com',
    address TEXT NOT NULL DEFAULT 'Main Road, Near Old Bus Stand, Chitradurga, Karnataka - 577501',
    village TEXT DEFAULT 'Chitradurga',
    taluk TEXT DEFAULT 'Chitradurga',
    district TEXT DEFAULT 'Chitradurga',
    gst_number TEXT,
    bill_prefix TEXT DEFAULT 'BILL-2026-',
    owner_bill_prefix TEXT DEFAULT 'OBILL-2026-',
    receipt_prefix TEXT DEFAULT 'RCP-2026-',
    currency TEXT DEFAULT 'INR',
    language TEXT DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    alt_phone TEXT,
    village TEXT NOT NULL,
    city TEXT NOT NULL,
    taluk TEXT NOT NULL,
    district TEXT NOT NULL,
    full_address TEXT NOT NULL,
    remarks TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Fast Global Search
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers (LOWER(name));
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers (phone);
CREATE INDEX IF NOT EXISTS idx_customers_alt_phone ON customers (alt_phone);
CREATE INDEX IF NOT EXISTS idx_customers_village ON customers (LOWER(village));
CREATE INDEX IF NOT EXISTS idx_customers_city ON customers (LOWER(city));
CREATE INDEX IF NOT EXISTS idx_customers_district ON customers (LOWER(district));

-- 4. DRILLING RATE TEMPLATES & CONFIGS
CREATE TABLE IF NOT EXISTS drilling_rate_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_name TEXT NOT NULL,
    is_template BOOLEAN DEFAULT FALSE,
    default_casing_rate NUMERIC(10,2) DEFAULT 380.00,
    default_caller_rate NUMERIC(10,2) DEFAULT 450.00,
    default_welding_rate NUMERIC(10,2) DEFAULT 250.00,
    default_meals_charge NUMERIC(10,2) DEFAULT 1500.00,
    default_transport_charge NUMERIC(10,2) DEFAULT 2500.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS drilling_rate_slabs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_id UUID NOT NULL REFERENCES drilling_rate_configs(id) ON DELETE CASCADE,
    from_feet INT NOT NULL,
    to_feet INT NOT NULL,
    rate_per_foot NUMERIC(10,2) NOT NULL,
    sort_order INT NOT NULL
);

-- 5. BOREWELLS
CREATE TABLE IF NOT EXISTS borewells (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    borewell_code TEXT UNIQUE NOT NULL, -- e.g. BW-2026-001
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    drilling_date DATE NOT NULL DEFAULT CURRENT_DATE,
    location TEXT NOT NULL,
    total_depth_feet INT NOT NULL CHECK (total_depth_feet >= 0),
    rock_type TEXT NOT NULL,
    driller_name TEXT NOT NULL,
    machine_details TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Planned', 'In Progress', 'Completed', 'Cancelled')),
    rate_config_snapshot JSONB NOT NULL, -- Frozen snapshot of rates
    remarks TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_borewells_code ON borewells (borewell_code);
CREATE INDEX IF NOT EXISTS idx_borewells_customer ON borewells (customer_id);
CREATE INDEX IF NOT EXISTS idx_borewells_location ON borewells (LOWER(location));

-- 6. BILLS (Separate Customer Bills and Owner Bills)
CREATE TABLE IF NOT EXISTS bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_number TEXT UNIQUE NOT NULL, -- BILL-2026-001 or OBILL-2026-001
    bill_type TEXT NOT NULL CHECK (bill_type IN ('CUSTOMER', 'OWNER')),
    borewell_id UUID NOT NULL REFERENCES borewells(id) ON DELETE RESTRICT,
    bill_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_depth INT NOT NULL,
    calculation_data JSONB NOT NULL, -- Complete breakdown of slabs, add-ons, subtotals
    grand_total NUMERIC(12,2) NOT NULL,
    amount_received NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    pending_balance NUMERIC(12,2) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Unpaid', 'Partial', 'Paid')),
    version INT NOT NULL DEFAULT 1,
    notes TEXT,
    internal_remarks TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bills_number ON bills (bill_number);
CREATE INDEX IF NOT EXISTS idx_bills_borewell ON bills (borewell_id);
CREATE INDEX IF NOT EXISTS idx_bills_type ON bills (bill_type);

-- Bill Revisions Table
CREATE TABLE IF NOT EXISTS bill_revisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    version INT NOT NULL,
    changed_by UUID REFERENCES profiles(id),
    summary TEXT NOT NULL,
    snapshot JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_number TEXT UNIQUE NOT NULL,
    borewell_id UUID NOT NULL REFERENCES borewells(id) ON DELETE RESTRICT,
    bill_id UUID REFERENCES bills(id),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Other')),
    reference_number TEXT,
    remarks TEXT,
    recorded_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_borewell ON payments (borewell_id);
CREATE INDEX IF NOT EXISTS idx_payments_bill ON payments (bill_id);
CREATE INDEX IF NOT EXISTS idx_payments_receipt ON payments (receipt_number);

-- 8. EXTERNAL DOCUMENTS & UNLINKED DOCUMENTS
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Materials', 'Fuel', 'Transport', 'Repairs', 'Welding', 'Equipment', 'Other')),
    original_doc_date DATE NOT NULL,
    upload_date TIMESTAMPTZ DEFAULT NOW(),
    amount NUMERIC(12,2) DEFAULT 0.00,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    borewell_id UUID REFERENCES borewells(id) ON DELETE SET NULL,
    is_linked BOOLEAN NOT NULL DEFAULT FALSE,
    uploaded_by UUID REFERENCES profiles(id),
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INT,
    remarks TEXT,
    ocr_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_docs_borewell ON documents (borewell_id);
CREATE INDEX IF NOT EXISTS idx_docs_linked ON documents (is_linked);
CREATE INDEX IF NOT EXISTS idx_docs_category ON documents (category);

-- 9. EXPENSES
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT NOT NULL CHECK (category IN ('Fuel', 'Repairs', 'Transport', 'Materials', 'Labour', 'Equipment', 'Other')),
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    borewell_id UUID REFERENCES borewells(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_borewell ON expenses (borewell_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses (category);

-- 10. ACTIVITY LOGS (Audit Trail)
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action TEXT NOT NULL,
    module TEXT NOT NULL,
    details TEXT NOT NULL,
    performed_by TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE borewells ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION get_auth_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Profiles: Authenticated users can read all profiles; only Owner or self can update
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Company Settings: Everyone can read; only OWNER can update
CREATE POLICY "Anyone can view company settings" ON company_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only OWNER can edit company settings" ON company_settings FOR ALL TO authenticated 
USING (get_auth_role() = 'OWNER');

-- Customers:
CREATE POLICY "Authenticated users can view customers" ON customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert customers" ON customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Manager and Owner can update customers" ON customers FOR UPDATE TO authenticated 
USING (get_auth_role() IN ('OWNER', 'MANAGER'));
CREATE POLICY "Only Owner can delete customers" ON customers FOR DELETE TO authenticated 
USING (get_auth_role() = 'OWNER');

-- Borewells:
CREATE POLICY "Authenticated users can view borewells" ON borewells FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert borewells" ON borewells FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Manager and Owner can update borewells" ON borewells FOR UPDATE TO authenticated 
USING (get_auth_role() IN ('OWNER', 'MANAGER'));
CREATE POLICY "Only Owner can delete borewells" ON borewells FOR DELETE TO authenticated 
USING (get_auth_role() = 'OWNER');

-- Bills:
CREATE POLICY "Authenticated users can view bills" ON bills FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manager and Owner can insert bills" ON bills FOR INSERT TO authenticated 
WITH CHECK (get_auth_role() IN ('OWNER', 'MANAGER'));
CREATE POLICY "Only Owner can update or delete bills" ON bills FOR ALL TO authenticated 
USING (get_auth_role() = 'OWNER');

-- Payments:
CREATE POLICY "Authenticated users can view payments" ON payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manager and Owner can record payments" ON payments FOR INSERT TO authenticated 
WITH CHECK (get_auth_role() IN ('OWNER', 'MANAGER'));
CREATE POLICY "Only Owner can edit or delete payments" ON payments FOR ALL TO authenticated 
USING (get_auth_role() = 'OWNER');

-- Documents:
CREATE POLICY "Authenticated users can view documents" ON documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert documents" ON documents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Manager and Owner can update/link documents" ON documents FOR UPDATE TO authenticated 
USING (get_auth_role() IN ('OWNER', 'MANAGER'));
CREATE POLICY "Only Owner can delete documents" ON documents FOR DELETE TO authenticated 
USING (get_auth_role() = 'OWNER');

-- Expenses:
CREATE POLICY "Authenticated users can view expenses" ON expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert expenses" ON expenses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Only Owner can edit/delete expenses" ON expenses FOR ALL TO authenticated 
USING (get_auth_role() = 'OWNER');

-- Activity Logs: Read-only for Owner and Manager; Insertable by all actions
CREATE POLICY "Owner and Manager can view activity logs" ON activity_logs FOR SELECT TO authenticated 
USING (get_auth_role() IN ('OWNER', 'MANAGER'));
CREATE POLICY "System can insert activity logs" ON activity_logs FOR INSERT TO authenticated WITH CHECK (true);
