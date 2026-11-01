# QR Event Ticket (Supabase)

## Architecture
- GitHub Pages: static frontend
- Supabase Auth: attendee and validator email/password accounts
- Supabase Postgres: ticket storage and atomic validation RPC
- Ticket token is stored as SHA-256 hash; each ticket expires one minute after server-side issuance.
- Validation uses a single conditional UPDATE, so simultaneous scans cannot both succeed.

## 1. Create a Supabase project
1. Create a project at https://supabase.com/dashboard
2. Choose a region close to your audience (Seoul if available).
3. Open Project Settings > API. Copy Project URL and anon/public key.
4. Paste them into `public/supabase-config.js`.

## 2. Create database schema
1. Open SQL Editor in Supabase.
2. Open `supabase/schema.sql`, copy all contents, paste, and Run.
3. In Authentication > Providers, enable Email.
4. For easier testing, in Authentication settings you may disable email confirmation. For a real public service, keep email confirmation enabled.

## 3. Create validator account
1. Open `public/validator.html` on your deployed HTTPS site, or use the same Supabase Auth signup flow (the current attendee page signup creates attendee accounts).
2. Create the validator account in Supabase Dashboard > Authentication > Users > Add user.
3. In SQL Editor, run this, replacing the email:
   UPDATE public.profiles SET role='validator'
   WHERE id=(SELECT id FROM auth.users WHERE email='validator@example.com');
4. The validator logs in at `validator.html`.

## 4. Deploy frontend to GitHub Pages
Upload the contents of `public/` to the GitHub Pages publishing folder. The page must use HTTPS for camera access.
No Firebase CLI or Firebase billing upgrade is required.

## 5. Test
- Sign up/log in as attendee at `index.html`.
- Issue ticket; QR expires after 60 seconds.
- Log in as validator at `validator.html`, start camera, scan.
- First scan should approve; a second scan should be rejected as already used.
- Expired and unknown QR codes are rejected.

## Security notes
- Never put the Supabase `service_role` key in frontend files or GitHub.
- Only the anon/public key belongs in `supabase-config.js`.
- Validator role is assigned manually in the SQL Editor. Public signups always get attendee role.
- Configure rate limits, monitoring, and event-specific controls before production use.
