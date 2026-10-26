-- Owner-approved password recovery for invited administrators.
-- The runtime also applies CREATE TABLE IF NOT EXISTS on first access.
CREATE TABLE IF NOT EXISTS admin_password_resets (
 id TEXT PRIMARY KEY,
 user_id TEXT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
 requested_at INTEGER NOT NULL,
 approved_at INTEGER,
 approved_by TEXT,
 token_hash TEXT UNIQUE,
 expires_at INTEGER,
 used_at INTEGER,
 revoked_at INTEGER
);
CREATE INDEX IF NOT EXISTS admin_password_resets_user ON admin_password_resets(user_id,requested_at);
CREATE INDEX IF NOT EXISTS admin_password_resets_requested ON admin_password_resets(requested_at);
CREATE TABLE IF NOT EXISTS admin_password_reset_limits (
 fingerprint TEXT PRIMARY KEY,
 window_started INTEGER NOT NULL,
 request_count INTEGER NOT NULL
);
