# Database setup: public.tasks

This project expects a `public.tasks` table in Supabase Postgres with:
- id (uuid, primary key, default gen_random_uuid())
- user_id (uuid, fk to auth.users)
- title (text)
- description (text)
- status (text)
- due_date (date)
- created_at (timestamptz, default now())
- updated_at (timestamptz, default now(), auto-updated via trigger)

## Applying the migration

Option A) Using a connection URL (recommended if you have `SUPABASE_DB_URL`):
1. Ensure your environment has `SUPABASE_DB_URL` set to a full Postgres URL. Example:
   postgres://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require
2. Run:
   psql "$SUPABASE_DB_URL" -f database/migrations/0001_create_tasks_table.sql

Option B) Using a `db_connection.txt` (if provided by ops):
1. Place a line with your full `psql` command inside `taskmaster-platform-19285/db_connection.txt`, e.g.:
   psql \"postgres://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require\"
2. Run:
   $(cat db_connection.txt) -f database/migrations/0001_create_tasks_table.sql

The migration creates the table if it does not exist and installs a trigger to keep `updated_at` current on updates.

## Notes

- The `user_id` foreign key references `auth.users(id)` and cascades on delete.
- Extensions `pgcrypto` and `pgjwt` are ensured (pgcrypto is needed for gen_random_uuid()).
- If you prefer the Supabase CLI, you can log in and tunnel to the DB, then run the same `psql` command through the CLI session.
