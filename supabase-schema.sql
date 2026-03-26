-- ============================================================
-- SMARTSCAN - Supabase Database Schema
-- Shelf Product Recognition for Unilever South Africa
-- ============================================================

-- 1. USER PROFILES & ROLES
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  email         TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'field_rep'
                  CHECK (role IN ('admin', 'manager', 'field_rep')),
  phone         TEXT,
  region        TEXT,
  avatar_url    TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. PRODUCT CATALOG
CREATE TABLE brands (
  id            BIGSERIAL PRIMARY KEY,
  name          TEXT NOT NULL UNIQUE,
  category      TEXT NOT NULL CHECK (category IN ('Food', 'Personal Care', 'Home Care', 'Beauty')),
  logo_url      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
  id                BIGSERIAL PRIMARY KEY,
  brand_id          BIGINT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  sku               TEXT UNIQUE,
  size_variant      TEXT,
  packaging_type    TEXT,
  description       TEXT,
  image_url         TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE product_reference_images (
  id            BIGSERIAL PRIMARY KEY,
  product_id    BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url     TEXT NOT NULL,
  image_type    TEXT NOT NULL DEFAULT 'front'
                  CHECK (image_type IN ('front', 'side', 'top', 'shelf', 'logo_closeup')),
  is_primary    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. STORES
CREATE TABLE store_chains (
  id            BIGSERIAL PRIMARY KEY,
  name          TEXT NOT NULL UNIQUE,
  logo_url      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE stores (
  id            BIGSERIAL PRIMARY KEY,
  chain_id      BIGINT NOT NULL REFERENCES store_chains(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  address       TEXT,
  city          TEXT,
  province      TEXT,
  gps_lat       DOUBLE PRECISION,
  gps_lng       DOUBLE PRECISION,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. PLANOGRAMS (expected products per store)
CREATE TABLE store_planograms (
  id            BIGSERIAL PRIMARY KEY,
  store_id      BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id    BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  section       TEXT,
  shelf_position TEXT,
  min_facings   INT DEFAULT 1,
  is_required   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(store_id, product_id)
);

-- 5. AUDITS
CREATE TABLE audits (
  id            BIGSERIAL PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id      BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'in_progress'
                  CHECK (status IN ('in_progress', 'processing', 'completed', 'failed')),
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at  TIMESTAMPTZ,
  notes         TEXT,
  gps_lat       DOUBLE PRECISION,
  gps_lng       DOUBLE PRECISION,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_images (
  id                BIGSERIAL PRIMARY KEY,
  audit_id          BIGINT NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  image_url         TEXT NOT NULL,
  source_type       TEXT NOT NULL DEFAULT 'photo'
                      CHECK (source_type IN ('photo', 'video_frame')),
  source_video_url  TEXT,
  frame_index       INT,
  analysis_status   TEXT NOT NULL DEFAULT 'pending'
                      CHECK (analysis_status IN ('pending', 'processing', 'completed', 'failed')),
  analysis_raw_json JSONB,
  analysis_error    TEXT,
  processed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. AUDIT FINDINGS
CREATE TABLE audit_findings (
  id                BIGSERIAL PRIMARY KEY,
  audit_id          BIGINT NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  audit_image_id    BIGINT REFERENCES audit_images(id) ON DELETE SET NULL,
  product_id        BIGINT REFERENCES products(id) ON DELETE SET NULL,
  brand_id          BIGINT REFERENCES brands(id) ON DELETE SET NULL,
  status            TEXT NOT NULL CHECK (status IN ('found', 'missing', 'unmatched')),
  confidence_score  DOUBLE PRECISION,
  detected_label    TEXT,
  detected_brand    TEXT,
  shelf_position    TEXT,
  facing_count      INT DEFAULT 1,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_stores_chain ON stores(chain_id);
CREATE INDEX idx_stores_active ON stores(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_planograms_store ON store_planograms(store_id);
CREATE INDEX idx_planograms_product ON store_planograms(product_id);
CREATE INDEX idx_audits_user ON audits(user_id);
CREATE INDEX idx_audits_store ON audits(store_id);
CREATE INDEX idx_audits_status ON audits(status);
CREATE INDEX idx_audits_created ON audits(created_at DESC);
CREATE INDEX idx_audit_images_audit ON audit_images(audit_id);
CREATE INDEX idx_audit_images_status ON audit_images(analysis_status);
CREATE INDEX idx_findings_audit ON audit_findings(audit_id);
CREATE INDEX idx_findings_product ON audit_findings(product_id);
CREATE INDEX idx_findings_status ON audit_findings(status);

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_profiles_updated BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_products_updated BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_stores_updated BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_audits_updated BEFORE UPDATE ON audits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins read all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Brands (read: all authenticated, write: admin only)
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read brands" ON brands
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage brands" ON brands
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read products" ON products
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage products" ON products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Product reference images
ALTER TABLE product_reference_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read reference images" ON product_reference_images
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage reference images" ON product_reference_images
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Store chains
ALTER TABLE store_chains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read chains" ON store_chains
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage chains" ON store_chains
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Stores
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read stores" ON stores
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage stores" ON stores
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Store planograms
ALTER TABLE store_planograms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read planograms" ON store_planograms
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage planograms" ON store_planograms
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Audits
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own audits" ON audits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Managers read all audits" ON audits
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "Users create own audits" ON audits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own audits" ON audits
  FOR UPDATE USING (auth.uid() = user_id);

-- Audit images
ALTER TABLE audit_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own audit images" ON audit_images
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM audits WHERE audits.id = audit_images.audit_id AND audits.user_id = auth.uid())
  );

CREATE POLICY "Managers read all audit images" ON audit_images
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "Users create audit images" ON audit_images
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM audits WHERE audits.id = audit_images.audit_id AND audits.user_id = auth.uid())
  );

-- Audit findings
ALTER TABLE audit_findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own findings" ON audit_findings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM audits WHERE audits.id = audit_findings.audit_id AND audits.user_id = auth.uid())
  );

CREATE POLICY "Managers read all findings" ON audit_findings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- ============================================================
-- SEED DATA: Unilever SA Brands
-- ============================================================
INSERT INTO brands (name, category) VALUES
  ('Knorr', 'Food'),
  ('Knorrox', 'Food'),
  ('Rajah', 'Food'),
  ('Robertsons', 'Food'),
  ('Axe', 'Personal Care'),
  ('Pepsodent', 'Personal Care'),
  ('Rexona', 'Personal Care'),
  ('TRESemmé', 'Personal Care'),
  ('Vaseline', 'Personal Care'),
  ('Comfort', 'Home Care'),
  ('Domestos', 'Home Care'),
  ('Handy Andy', 'Home Care'),
  ('OMO', 'Home Care'),
  ('Sunlight', 'Home Care'),
  ('Surf', 'Home Care'),
  ('Dove', 'Beauty')
ON CONFLICT (name) DO NOTHING;

-- Seed major SA store chains
INSERT INTO store_chains (name) VALUES
  ('Checkers'),
  ('Shoprite'),
  ('Pick n Pay'),
  ('Spar'),
  ('Woolworths'),
  ('Game'),
  ('Makro'),
  ('Clicks'),
  ('Dis-Chem')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- STORAGE BUCKETS (run in Supabase Dashboard > Storage)
-- ============================================================
-- Create buckets:
--   1. audit-images (public)
--   2. product-references (public)
--   3. brand-logos (public)
