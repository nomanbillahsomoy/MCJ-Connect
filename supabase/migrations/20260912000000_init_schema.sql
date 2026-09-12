-- MCJ Connect: Initial Database Schema (Phase 1)

-- 1. Create Custom Enums
CREATE TYPE user_role_type AS ENUM ('super_admin', 'admin', 'moderator', 'batch_rep', 'member', 'pending');
CREATE TYPE academic_status_type AS ENUM ('current_student', 'graduated', 'dropped_out');
CREATE TYPE claim_status_type AS ENUM ('unclaimed', 'pending', 'verified', 'rejected');
CREATE TYPE visibility_level AS ENUM ('public', 'verified_members', 'connections_only', 'private');
CREATE TYPE opportunity_status_type AS ENUM ('active', 'flagged', 'under_review', 'closed');

-- 2. Create Core Tables

-- Batches Table
CREATE TABLE batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_number INT UNIQUE NOT NULL,
    admission_year INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Identity Registry (The Authoritative Source)
CREATE TABLE identity_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE RESTRICT,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    academic_status academic_status_type NOT NULL,
    claim_status claim_status_type DEFAULT 'unclaimed',
    claimed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_identity_student_id ON identity_registry(student_id);

-- User Roles
CREATE TABLE user_roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role_type DEFAULT 'pending',
    assigned_batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Profiles
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    identity_id UUID UNIQUE NOT NULL REFERENCES identity_registry(id) ON DELETE RESTRICT,
    avatar_url TEXT,
    headline VARCHAR(150),
    bio TEXT,
    blood_group VARCHAR(5),
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_profiles_identity_id ON profiles(identity_id);

-- Contact Info
CREATE TABLE contact_info (
    profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    primary_email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    whatsapp_number VARCHAR(20),
    current_city VARCHAR(100)
);

-- Privacy Settings
CREATE TABLE privacy_settings (
    profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    phone_visibility visibility_level DEFAULT 'connections_only',
    email_visibility visibility_level DEFAULT 'connections_only',
    blood_group_visibility visibility_level DEFAULT 'verified_members',
    employment_visibility visibility_level DEFAULT 'verified_members'
);

-- Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    target_id UUID,
    table_name VARCHAR(50) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_audit_target_id ON audit_logs(target_id);

-- 3. Trigger for updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_identity_registry_updated_at
BEFORE UPDATE ON identity_registry
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 4. RPC: Secure Search Unclaimed Identity
CREATE OR REPLACE FUNCTION search_unclaimed_identity(search_query text)
RETURNS TABLE (id UUID, full_name text, student_id_masked text) AS $$
BEGIN
  IF length(search_query) < 4 THEN RETURN; END IF;
  
  RETURN QUERY SELECT 
    identity_registry.id, 
    identity_registry.full_name, 
    CONCAT(LEFT(identity_registry.student_id, 4), '***')
  FROM identity_registry 
  WHERE claim_status = 'unclaimed' 
    AND (identity_registry.full_name ILIKE '%' || search_query || '%' OR identity_registry.student_id ILIKE '%' || search_query || '%')
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Enable Row Level Security
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (Draft for Phase 1)
-- Batches: Read-only for all authenticated
CREATE POLICY "Batches are readable by authenticated users" 
ON batches FOR SELECT TO authenticated USING (true);

-- Identity Registry: No public read. 
-- Batch reps can view their batch. Admins can view all.
CREATE POLICY "Identity Registry viewable by admins and batch reps"
ON identity_registry FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = auth.uid() AND (
            ur.role IN ('super_admin', 'admin') OR 
            (ur.role = 'batch_rep' AND ur.assigned_batch_id = identity_registry.batch_id)
        )
    )
);

-- Profiles: Viewable by verified members, admins
CREATE POLICY "Profiles viewable by verified members"
ON profiles FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = auth.uid() AND ur.role IN ('super_admin', 'admin', 'moderator', 'member')
    ) AND NOT is_deleted
);

-- Profiles: Users can edit their own profile
CREATE POLICY "Users can edit own profile"
ON profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- Audit Logs: Super Admin only
CREATE POLICY "Audit logs super admin only"
ON audit_logs FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
);
