ALTER TABLE admin_users ADD COLUMN role TEXT NOT NULL DEFAULT 'owner';
ALTER TABLE admin_users ADD COLUMN active INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS admin_users_role ON admin_users(role);