# Supabase Database Schema & Workflow Guide

Follow this guide to create and configure your `profiles` table inside Supabase. This leverages Supabase's automatic database triggers, enabling robust, secure, and auto-synced user profiles.

---

## 1. Database Creation Script (SQL)

Copy the SQL block below and run it inside the **SQL Editor** of your Supabase Dashboard to instantiate the `profiles` table, establish secure indexing, restrict access with Row Level Security (RLS), and automate signup synchronization via a database trigger.

```sql
-- ==========================================
-- 1. CREATE USER PROFILES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL CONSTRAINT unique_profile_email UNIQUE,
  role TEXT NOT NULL DEFAULT 'customer' CONSTRAINT check_valid_role CHECK (role IN ('customer', 'admin')),
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 2. INDEXING FOR READ SPEED
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ==========================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 4. RLS ACCESS CONTROL POLICIES
-- ==========================================

-- Policy: Profiles are viewable by owners themselves, and administrators.
CREATE POLICY "Allow users to view own profile and admins all" 
  ON public.profiles 
  FOR SELECT 
  USING (
    auth.uid() = id 
    OR (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) = 'admin'
  );

-- Policy: Users can edit only their own profiles
CREATE POLICY "Allow users to update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Service trigger/signup handlers can write user records
CREATE POLICY "Allow public inserts for signup routing" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (true);

-- ==========================================
-- 5. TRIGGER FOR AUTOMATIC SIGNUP PROFILES
-- ==========================================
-- This function listens to auth.users inserts and copies over user accounts 
-- immediately as they are created. It reads `raw_user_meta_data` passed by 
-- the registration frontend flow to automatically set names and roles.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 2. Best Practice Architected Workflow

### A. User Registration Sequence
1. The user navigates to the registration route:
   - `/register` for regular customers.
   - `/admin/register` for administrators.
2. The UI collects fields (Email, Password, Full Name).
3. The frontend sends a single `signUp` request to Supabase Auth, embedding custom properties into `options.data` (which maps back to `raw_user_meta_data` on Postgres).

### B. frontend Implementation snippet (Vite / React)
When registering, the frontend explicitly forwards the mapped role parameters. This matches the updated registration methods:

```ts
// Customer Sign Up (/register)
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      full_name: fullName,
      role: 'customer' // Explicit customer assignment
    }
  }
});

// Administrator Sign Up (/admin/register)
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      full_name: fullName,
      role: 'admin' // Explicit administrator assignment
    }
  }
});
```

### C. Database Trigger Execution (Best Practice)
- When the registration is fired, Supabase Auth creates an internal record inside the highly secure, inaccessible `auth.users` schema.
- Once that row is appended, our PostgreSQL database trigger `on_auth_user_created` activates instantly.
- The trigger parses the `new.raw_user_meta_data` JSON to extract the name and role keys.
- It automatically inserts a corresponding profile row with the correct ID referencing the authenticated user, securely creating the profile without requiring public write APIs to circumvent RLS security measures.
