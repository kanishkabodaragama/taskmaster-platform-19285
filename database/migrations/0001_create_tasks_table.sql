-- Creates the public.tasks table with required columns and defaults.
-- Run with: psql "$SUPABASE_DB_URL" -f database/migrations/0001_create_tasks_table.sql
-- Or if you have a db_connection.txt containing a psql command, use:
--   $(cat db_connection.txt) -f database/migrations/0001_create_tasks_table.sql

-- Ensure extensions for gen_random_uuid are available
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pgjwt;

-- Create table
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  description text,
  status text,
  due_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ensure updated_at auto-updates on row changes
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'tasks_set_updated_at'
  ) THEN
    CREATE TRIGGER tasks_set_updated_at
      BEFORE UPDATE ON public.tasks
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;
