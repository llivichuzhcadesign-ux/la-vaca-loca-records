-- Invitation-only onboarding. Tokens are stored as SHA-256 hashes, not plaintext.
-- The invitation API also runs the CREATE TABLE IF NOT EXISTS statement on first use,
-- allowing existing Cloudflare D1 installations to adopt this safely.
CREATE TABLE IF NOT EXISTS admin_invitations (
 id TEXT PRIMARY KEY,
 email TEXT NOT NULL,
 role TEXT NOT NULL CHECK(role IN ('owner','admin','editor')),
 token_hash TEXT NOT NULL UNIQUE,
 invited_by TEXT NOT NULL,
 created_at INTEGER NOT NULL,
 expires_at INTEGER NOT NULL,
 used_at INTEGER,
 revoked_at INTEGER
);
CREATE INDEX IF NOT EXISTS admin_invitations_email ON admin_invitations(email);
CREATE INDEX IF NOT EXISTS admin_invitations_expires ON admin_invitations(expires_at);
