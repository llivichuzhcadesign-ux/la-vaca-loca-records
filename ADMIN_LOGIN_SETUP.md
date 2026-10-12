# Single-admin login: Cloudflare setup

The admin now uses Cloudflare Pages Functions + D1 with one email/password account and 30-day HttpOnly, Secure, SameSite=Lax cookie sessions. Cloudflare R2 remains the media and published-content store.

## Activate on the existing Cloudflare Pages project

1. In Cloudflare, create a D1 database (for example `lvl-admin`).
2. Bind that database to the **Pages project**, under Settings → Bindings, with variable name exactly `DB`. Bind the same database in Preview if testing there.
3. Run `migrations/0001_admin_auth.sql` in the **D1 database SQL console** (or via Wrangler `wrangler d1 execute <database-name> --remote --file=migrations/0001_admin_auth.sql`). The tables must exist before first login.
4. Under Pages → Settings → Variables and Secrets, create a **secret** named `ADMIN_SETUP_TOKEN` with a long, randomly generated value (prefer 32+ random bytes). Do not put the secret in GitHub or a public variable.
5. Deploy the latest `main` branch to Cloudflare Pages. Verify that Pages Functions are enabled and the `MEDIA` R2 binding is still attached.
6. Open `https://YOUR-PAGES-DOMAIN/admin/setup.html`. Enter that setup token, your admin email, and a unique password of **at least 14 characters**. Only the first account can be created; further setup attempts are rejected.
7. **Delete `ADMIN_SETUP_TOKEN` from Pages secrets after setup and redeploy**, disabling bootstrap entirely.
8. Sign in at `https://YOUR-PAGES-DOMAIN/admin/login.html`. `/admin/` and `/api/admin/*` are protected server-side.

Do not share your password or setup token in chat. Existing `ADMIN_API_KEY` is no longer used by the admin endpoints and can be retired from Cloudflare secrets after confirming uploads and publishing work with the new login.

### Testing checklist
- An unauthenticated visitor to `/admin/` is redirected to login.
- An unauthenticated request to `/api/admin/ping`, `/api/admin/content`, or `/api/admin/media` returns HTTP 401.
- A correct email/password signs in and displays the unchanged admin dashboard.
- Page refresh, browser restarts and uploads remain authenticated via the Secure cookie (up to 30 days).
- Publish live, gallery list/upload, image and audio uploads continue to work.
- Log out ends the server session; the browser cannot reopen the admin without signing in.
- Wrong login credentials are rate-limited: after five failures per IP/email combination, login blocks for 15 minutes.

**Note:** The public GitHub Pages mirror does not run Cloudflare Pages Functions; the authenticated admin must be used on the Cloudflare Pages domain. Sessions persist for up to 30 days unless logged out. Clearing cookies or site data signs the user out.
