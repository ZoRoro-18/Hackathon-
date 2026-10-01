CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'merchant' CHECK (role IN ('merchant','admin')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  language VARCHAR(5) NOT NULL DEFAULT 'en' CHECK (language IN ('en','hi','mr','gu','bn','ta','te','kn')),
  theme VARCHAR(10) NOT NULL DEFAULT 'system' CHECK (theme IN ('system','light','dark')),
  text_size VARCHAR(10) NOT NULL DEFAULT 'normal' CHECK (text_size IN ('normal','large','xl')),
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS business_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(255) NOT NULL,
  gstin VARCHAR(15),
  state VARCHAR(100),
  address TEXT,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_filename VARCHAR(255),
  type VARCHAR(20) NOT NULL DEFAULT 'other' CHECK (type IN ('invoice','receipt','purchase_order','credit_note','debit_note','quotation','bank_statement','other')),
  direction VARCHAR(10) NOT NULL DEFAULT 'purchase' CHECK (direction IN ('sales','purchase')),
  status VARCHAR(20) NOT NULL DEFAULT 'processing' CHECK (status IN ('processing','done','needs_review','approved','failed')),
  error_message TEXT,
  confidence_score INTEGER CHECK (confidence_score BETWEEN 0 AND 100),
  extracted_data JSONB,
  file_hash CHAR(64) NOT NULL,
  is_sample BOOLEAN NOT NULL DEFAULT false,
  vendor_name VARCHAR(255),
  vendor_gstin VARCHAR(15),
  customer_name VARCHAR(255),
  customer_gstin VARCHAR(15),
  invoice_number VARCHAR(100),
  invoice_date DATE,
  due_date DATE,
  place_of_supply VARCHAR(100),
  subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
  cgst NUMERIC(15,2) NOT NULL DEFAULT 0,
  sgst NUMERIC(15,2) NOT NULL DEFAULT 0,
  igst NUMERIC(15,2) NOT NULL DEFAULT 0,
  cess NUMERIC(15,2) NOT NULL DEFAULT 0,
  round_off NUMERIC(15,2) NOT NULL DEFAULT 0,
  grand_total NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  category VARCHAR(20) CHECK (category IN ('inventory','rent','utilities','transport','salaries','office','other')),
  payment_status VARCHAR(10) NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('paid','unpaid')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_docs_user_date ON documents(user_id, invoice_date);
CREATE INDEX IF NOT EXISTS idx_docs_user_status ON documents(user_id, status);
CREATE INDEX IF NOT EXISTS idx_docs_user_hash ON documents(user_id, file_hash);
CREATE INDEX IF NOT EXISTS idx_docs_user_dir_pay ON documents(user_id, direction, payment_status);
CREATE INDEX IF NOT EXISTS idx_docs_vendor_trgm ON documents USING gin (vendor_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_docs_customer_trgm ON documents USING gin (customer_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_docs_invno_trgm ON documents USING gin (invoice_number gin_trgm_ops);

CREATE TABLE IF NOT EXISTS document_files (
  document_id INTEGER PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
  file_data BYTEA NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS line_items (
  id SERIAL PRIMARY KEY,
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  hsn_sac VARCHAR(20),
  quantity NUMERIC(15,3) NOT NULL DEFAULT 0,
  unit VARCHAR(20),
  unit_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  discount NUMERIC(15,2) NOT NULL DEFAULT 0,
  taxable_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  total NUMERIC(15,2) NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_items_doc ON line_items(document_id);

CREATE TABLE IF NOT EXISTS validation_issues (
  id SERIAL PRIMARY KEY,
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  severity VARCHAR(10) NOT NULL CHECK (severity IN ('warning','error')),
  code VARCHAR(50) NOT NULL,
  field VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  params JSONB
);
CREATE INDEX IF NOT EXISTS idx_issues_doc ON validation_issues(document_id);

CREATE TABLE IF NOT EXISTS bank_accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_name VARCHAR(255) NOT NULL,
  opening_balance NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bank_account_id INTEGER NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
  document_id INTEGER REFERENCES documents(id) ON DELETE SET NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('credit','debit')),
  amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  transaction_date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tx_user_date ON transactions(user_id, transaction_date);
CREATE UNIQUE INDEX IF NOT EXISTS uq_tx_document ON transactions(document_id) WHERE document_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS chat_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  answer TEXT NOT NULL,
  document_ids INTEGER[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_users_updated ON users;
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_profiles_updated ON business_profiles;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON business_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_documents_updated ON documents;
CREATE TRIGGER trg_documents_updated BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION set_updated_at();
