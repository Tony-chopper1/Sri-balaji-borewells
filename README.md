# Sri Balaji Borewells

Business management app for customers, borewells, bills, payments, documents,
expenses, petrol bunks, reports, and company settings. Supabase provides
authentication and persistent data storage.

## Set up Supabase

1. Create a Supabase project and copy `.env.example` to `.env`.
2. Set `VITE_SUPABASE_URL` and either `VITE_SUPABASE_PUBLISHABLE_KEY` or `VITE_SUPABASE_ANON_KEY` from the project's API settings. Never put a service-role key in the frontend.
3. Run the migrations in `supabase/migrations` in filename order using the Supabase SQL editor.
4. Create the initial user in Supabase Auth. The database trigger creates an EMPLOYEE profile automatically.
5. Promote the initial owner in the SQL editor:

   ```sql
   UPDATE public.profiles
   SET role = 'OWNER'
   WHERE email = 'owner@example.com';
   ```

The app's OWNER/MANAGER/EMPLOYEE switcher is a UI preview only; database permissions are enforced using the signed-in user's Supabase profile role.

## Run locally

Use Node.js 22.12 or newer.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

## Other commands

```sh
npm run lint
npm run build
```

The repository caches loaded records in browser local storage for immediate UI
reads, while Supabase is the persistent source of truth.
