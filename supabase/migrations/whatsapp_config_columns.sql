-- Migration: WhatsApp Config Columns for Meta Cloud API
-- Ensures all required WhatsApp integration columns exist in the organizations table.

ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS wa_phone_number_id TEXT,
ADD COLUMN IF NOT EXISTS wa_waba_id TEXT,
ADD COLUMN IF NOT EXISTS wa_access_token TEXT,
ADD COLUMN IF NOT EXISTS wa_connected BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS wa_connected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Index for high-performance webhook organization lookup by Meta Phone Number ID
CREATE INDEX IF NOT EXISTS idx_organizations_wa_phone_number_id ON organizations(wa_phone_number_id);

-- Optional: ensure profiles table also has wa columns for redundancy/user linking
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS wa_phone_number_id TEXT,
ADD COLUMN IF NOT EXISTS wa_status TEXT DEFAULT 'disconnected',
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
