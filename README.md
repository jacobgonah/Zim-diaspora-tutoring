# Zim Diaspora Tutoring Platform

Simple website connecting tutors (mainly in Zimbabwe) with diaspora parents abroad.

## Current status (MVP)
- Tutor profile creation (goes live for free — payment step hidden)
- Parent search & filter by subject, level, language
- Individual tutor profile pages + WhatsApp contact
- **Booking time slots** (one-off or recurring) — confirmation message (email service still to connect)
- Privacy policy & terms (no identity checks, data deleted if site closes)
- No ranking by bookings
- Database tables ready for availability, bookings, and no-show reports
- Automatic no-show removal logic and reminder emails still to be fully wired (schema is ready)

## Setup instructions

1. **Create a new Supabase project** (do not use healthcare-jobs-app)
   - Go to supabase.com → New project
   - Copy the Project URL and anon public key

2. **Run the database schema**
   - Open SQL Editor in your new Supabase project
   - Paste and run the contents of `supabase/schema.sql`

3. **Environment variables**
   Create `.env.local` in the project root:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

4. **Install dependencies & run**
   ```bash
   npm install
   npm run dev
   ```

5. **Email and password sign-up**
   - Authentication → Providers → Email: enabled. Leave phone disabled.
   - Turn on email confirmations so a new account must confirm before logging in.
   - Authentication → URL configuration: add `http://localhost:3000/auth/callback` (and your live `/auth/callback` URL).
   - Parents sign up at `/parent-signup`. Tutors sign up at `/tutor-signup`. Both pages ask for email and password.
   - Sign-in is at `/login` and asks for email and password for parents and tutors.
   - After a tutor confirms their email and logs in, they continue to `/become-tutor` to create a profile. Parents continue to `/tutors`.
   - A tutor profile is inserted with `user_id = auth.uid()`. Bookings require a signed-in user. If you already ran an older schema, run `supabase/schema.sql` again or replace the bookings insert policy with "Signed-in users can create bookings".

6. **Deploy**
   - Push to GitHub
   - Import into Vercel
   - Add the same environment variables in Vercel
   - Connect your domain when purchased

## Next features to build
- Weekly availability & booking (one-off + recurring)
- Confirmation + reminder emails
- No-show reporting (shows on both profiles, auto-remove after 3 tutor no-shows)
- Optional CV upload via Supabase Storage

Stripe listing fees will be added later. Profiles go live for free at launch.
