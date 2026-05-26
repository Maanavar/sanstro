-- Vinaadi AI PostgreSQL Schema v1
-- Thirukanitham 2026 MVP with Family Aggregate Fortune in MVP 1

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enums
DO $$ BEGIN
  CREATE TYPE language_pref AS ENUM ('ta', 'en', 'ta-en');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE relationship_type AS ENUM ('self', 'spouse', 'child', 'parent', 'sibling', 'grandparent', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE calc_status AS ENUM ('pending', 'completed', 'failed', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_tier AS ENUM ('free', 'personal', 'family', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Users
CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_encrypted BYTEA,
  display_name TEXT,
  default_language language_pref NOT NULL DEFAULT 'ta-en',
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  subscription_tier subscription_tier NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Family Vault
CREATE TABLE IF NOT EXISTS family_vaults (
  family_vault_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_user_id UUID NOT NULL REFERENCES users(user_id),
  name TEXT NOT NULL,
  default_language language_pref NOT NULL DEFAULT 'ta-en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_family_vault_owner ON family_vaults(owner_user_id);

CREATE TABLE IF NOT EXISTS family_members (
  family_member_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_vault_id UUID REFERENCES family_vaults(family_vault_id),
  owner_user_id UUID NOT NULL REFERENCES users(user_id),
  relationship relationship_type NOT NULL DEFAULT 'other',
  display_name TEXT NOT NULL,
  gender_for_traditional_rules TEXT CHECK (gender_for_traditional_rules IN ('male', 'female', 'other', 'not_specified')) DEFAULT 'not_specified',
  date_of_birth_local DATE,
  is_minor BOOLEAN DEFAULT false,
  managed_by_user_id UUID REFERENCES users(user_id),
  consent_status TEXT NOT NULL DEFAULT 'owner_managed',
  member_weight NUMERIC(5,2) NOT NULL DEFAULT 1.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_family_members_vault ON family_members(family_vault_id);
CREATE INDEX IF NOT EXISTS idx_family_members_owner ON family_members(owner_user_id);

-- Birth Profiles
CREATE TABLE IF NOT EXISTS birth_profiles (
  birth_profile_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_user_id UUID NOT NULL REFERENCES users(user_id),
  family_member_id UUID REFERENCES family_members(family_member_id),
  display_name TEXT NOT NULL,
  birth_date_local DATE NOT NULL,
  birth_time_local TIME,
  birth_datetime_utc TIMESTAMPTZ,
  birth_place TEXT NOT NULL,
  birth_latitude NUMERIC(9,6) NOT NULL,
  birth_longitude NUMERIC(9,6) NOT NULL,
  birth_timezone TEXT NOT NULL,
  birth_time_source TEXT NOT NULL DEFAULT 'unknown',
  birth_time_confidence_minutes INT NOT NULL DEFAULT 0,
  calendar_input_type TEXT NOT NULL DEFAULT 'gregorian',
  privacy_mode TEXT NOT NULL DEFAULT 'cloud',
  encrypted_birth_payload BYTEA,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_birth_profiles_owner ON birth_profiles(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_birth_profiles_member ON birth_profiles(family_member_id);

-- Charts
CREATE TABLE IF NOT EXISTS charts (
  chart_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  birth_profile_id UUID NOT NULL REFERENCES birth_profiles(birth_profile_id),
  calculation_version TEXT NOT NULL,
  ephemeris_provider TEXT NOT NULL DEFAULT 'SWISS_EPHEMERIS',
  ephemeris_version TEXT,
  ayanamsa_type TEXT NOT NULL DEFAULT 'LAHIRI',
  ayanamsa_value_degrees NUMERIC(12,8),
  node_type TEXT NOT NULL DEFAULT 'MEAN_NODE',
  house_system_primary TEXT NOT NULL DEFAULT 'WHOLE_SIGN',
  julian_day NUMERIC(16,8) NOT NULL,
  lagna_rasi TEXT NOT NULL,
  lagna_longitude NUMERIC(12,8) NOT NULL,
  moon_rasi TEXT NOT NULL,
  janma_nakshatra TEXT NOT NULL,
  janma_pada INT NOT NULL CHECK (janma_pada BETWEEN 1 AND 4),
  status calc_status NOT NULL DEFAULT 'completed',
  warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_charts_birth_profile ON charts(birth_profile_id);
CREATE INDEX IF NOT EXISTS idx_charts_calc_version ON charts(calculation_version);

-- Planet positions in D1
CREATE TABLE IF NOT EXISTS chart_planets (
  chart_planet_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chart_id UUID NOT NULL REFERENCES charts(chart_id) ON DELETE CASCADE,
  graha TEXT NOT NULL,
  absolute_longitude NUMERIC(12,8) NOT NULL,
  degree_in_rasi NUMERIC(12,8) NOT NULL,
  rasi TEXT NOT NULL,
  nakshatra TEXT NOT NULL,
  pada INT NOT NULL CHECK (pada BETWEEN 1 AND 4),
  house_from_lagna INT NOT NULL CHECK (house_from_lagna BETWEEN 1 AND 12),
  speed_deg_per_day NUMERIC(12,8),
  is_retrograde BOOLEAN NOT NULL DEFAULT false,
  is_combust BOOLEAN NOT NULL DEFAULT false,
  is_sandhi BOOLEAN NOT NULL DEFAULT false,
  dignity TEXT,
  d9_rasi TEXT,
  is_vargottama BOOLEAN NOT NULL DEFAULT false,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(chart_id, graha)
);

CREATE INDEX IF NOT EXISTS idx_chart_planets_chart ON chart_planets(chart_id);
CREATE INDEX IF NOT EXISTS idx_chart_planets_graha ON chart_planets(graha);

-- Varga positions
CREATE TABLE IF NOT EXISTS varga_positions (
  varga_position_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chart_id UUID NOT NULL REFERENCES charts(chart_id) ON DELETE CASCADE,
  varga_code TEXT NOT NULL,
  graha TEXT NOT NULL,
  rasi TEXT NOT NULL,
  house_from_varga_lagna INT CHECK (house_from_varga_lagna BETWEEN 1 AND 12),
  calculation_method TEXT NOT NULL,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(chart_id, varga_code, graha)
);

-- Dasha timeline
CREATE TABLE IF NOT EXISTS dasha_periods (
  dasha_period_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chart_id UUID NOT NULL REFERENCES charts(chart_id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('maha', 'antar', 'pratyantar', 'sookshma', 'prana')),
  lord TEXT NOT NULL,
  parent_dasha_period_id UUID REFERENCES dasha_periods(dasha_period_id),
  start_jd NUMERIC(16,8) NOT NULL,
  end_jd NUMERIC(16,8) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  sequence_index INT NOT NULL,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_dasha_chart_level ON dasha_periods(chart_id, level);
CREATE INDEX IF NOT EXISTS idx_dasha_date_lookup ON dasha_periods(chart_id, start_date, end_date);

-- Panchangam cache
CREATE TABLE IF NOT EXISTS panchangam_cache (
  panchangam_cache_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date_local DATE NOT NULL,
  latitude NUMERIC(9,6) NOT NULL,
  longitude NUMERIC(9,6) NOT NULL,
  timezone TEXT NOT NULL,
  calculation_version TEXT NOT NULL,
  sunrise TIMESTAMPTZ NOT NULL,
  sunset TIMESTAMPTZ NOT NULL,
  vara JSONB NOT NULL,
  tithi JSONB NOT NULL,
  nakshatra JSONB NOT NULL,
  yoga JSONB NOT NULL,
  karana JSONB NOT NULL,
  kalam JSONB NOT NULL,
  hora JSONB NOT NULL,
  abhijit JSONB NOT NULL,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(date_local, latitude, longitude, timezone, calculation_version)
);

CREATE INDEX IF NOT EXISTS idx_panchangam_date_location ON panchangam_cache(date_local, latitude, longitude);

-- Transit snapshots
CREATE TABLE IF NOT EXISTS transit_snapshots (
  transit_snapshot_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  as_of_utc TIMESTAMPTZ NOT NULL,
  calculation_version TEXT NOT NULL,
  planets JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(as_of_utc, calculation_version)
);

-- Daily individual scores
CREATE TABLE IF NOT EXISTS daily_scores (
  daily_score_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chart_id UUID NOT NULL REFERENCES charts(chart_id) ON DELETE CASCADE,
  date_local DATE NOT NULL,
  timezone TEXT NOT NULL,
  score INT NOT NULL CHECK (score BETWEEN 0 AND 100),
  label TEXT NOT NULL,
  score_breakdown JSONB NOT NULL,
  active_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  best_windows JSONB NOT NULL DEFAULT '[]'::jsonb,
  caution_windows JSONB NOT NULL DEFAULT '[]'::jsonb,
  interpretation_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(chart_id, date_local, timezone)
);

CREATE INDEX IF NOT EXISTS idx_daily_scores_chart_date ON daily_scores(chart_id, date_local);

-- Family daily scores
CREATE TABLE IF NOT EXISTS family_daily_scores (
  family_daily_score_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_vault_id UUID NOT NULL REFERENCES family_vaults(family_vault_id) ON DELETE CASCADE,
  date_local DATE NOT NULL,
  timezone TEXT NOT NULL,
  family_score INT NOT NULL CHECK (family_score BETWEEN 0 AND 100),
  family_label TEXT NOT NULL,
  aggregate_breakdown JSONB NOT NULL,
  member_scores JSONB NOT NULL,
  best_family_windows JSONB NOT NULL DEFAULT '[]'::jsonb,
  avoid_for_family_decisions JSONB NOT NULL DEFAULT '[]'::jsonb,
  support_need_index INT NOT NULL DEFAULT 0,
  decision_readiness_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(family_vault_id, date_local, timezone)
);

CREATE INDEX IF NOT EXISTS idx_family_daily_scores_vault_date ON family_daily_scores(family_vault_id, date_local);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id),
  family_vault_id UUID REFERENCES family_vaults(family_vault_id),
  chart_id UUID REFERENCES charts(chart_id),
  type TEXT NOT NULL,
  priority INT NOT NULL CHECK (priority BETWEEN 0 AND 100),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  language language_pref NOT NULL DEFAULT 'ta-en',
  send_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  suppression_reason TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_send ON notifications(user_id, send_at);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);

-- Interpretation outputs
CREATE TABLE IF NOT EXISTS interpretation_outputs (
  interpretation_output_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chart_id UUID REFERENCES charts(chart_id),
  family_vault_id UUID REFERENCES family_vaults(family_vault_id),
  output_type TEXT NOT NULL,
  language language_pref NOT NULL,
  structured_input JSONB NOT NULL,
  output_text JSONB NOT NULL,
  safety_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- QA golden cases
CREATE TABLE IF NOT EXISTS qa_golden_cases (
  golden_case_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_name TEXT NOT NULL,
  case_type TEXT NOT NULL,
  input_payload JSONB NOT NULL,
  expected_payload JSONB NOT NULL,
  tolerance_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  subscription_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id),
  tier subscription_tier NOT NULL,
  provider TEXT,
  provider_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
