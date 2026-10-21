# Multi-administrator upgrade

After deployment, run `migrations/0002_admin_roles.sql` **once** in the Cloudflare D1 `lvl-admin` console. This adds `role` and `active` fields to `admin_users`. Existing accounts become active Owners. This migration is REQUIRED: until it runs, login will fail because session queries now include the new columns.

```sql
ALTER TABLE admin_users ADD COLUMN role TEXT NOT NULL DEFAULT 'owner';
ALTER TABLE admin_users ADD COLUMN active INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS admin_users_role ON admin_users(role);
```

After the D1 migration, redeploy the latest GitHub main commit if Cloudflare has not already done so. Sign in as the current account, then open **Administrators** in the sidebar.

Roles:
- Owner: can add users, assign roles, deactivate/reactivate users, and reset passwords; can publish and upload.
- Admin: can publish and upload, but cannot manage administrators.
- Editor: can edit local drafts, but server-side publishing and media upload are blocked.

There is currently no invitation email or self-service password recovery. An Owner creates an initial password and shares it through a secure channel. An Owner can later reset it. Deactivation and role changes invalidate the affected account's active sessions. You cannot deactivate or demote the last active Owner.

For a production rollout, consider adding activity auditing and rate-limiting to owner user-management endpoints. Keep at least two active Owners if there is a risk of losing the only Owner password.
