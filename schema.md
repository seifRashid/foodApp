# Production Supabase Database Schema & Workflow Guide

This guide is a complete blueprint to configure and launch your production-ready PostgreSQL relational database on Supabase. It features fully-normalized tables, auto-updated timestamps, secure Row-Level Security (RLS) policies, storage bucket rules, and automated database triggers to ensure absolute data persistence and high indexing speed.

---

## 1. Database Architecture & Relationships

```
                  +-------------------------+
                  |       auth.users        |  (Supabase Core Auth)
                  +------------+------------+
                               |
                               | (1:1 Trigger)
                               v
                  +-------------------------+
                  |     public.profiles     |  (User profiles & roles)
                  +------------+------------+
                               |
                               | (1:Many)
                               v
                  +-------------------------+
                  |      public.orders      |  (User purchases)
                  +------------+----+-------+
                               |    |
                      (1:Many) |    | (1:Many JSONB Backup)
                               v    v
+------------------+     +-----+----+---------+
| public.categories|     | public.order_items |  (Normalized line items)
+--------+---------+     +----------+---------+
         |                          |
         | (1:Many Name Link)       | (Many:1)
         v                          |
+--------+---------+                |
|   public.foods   |<---------------+
+------------------+
```

### Table Matrix & Relationships
* **`profiles`**: Maps 1-to-1 with Supabase `auth.users`. Contains user profiles and system access groups (`admin` or `customer`). Uses custom-metadata unpacking triggers.
* **`categories`**: A lookup table of kitchen classifications (e.g. Burgers, Pizza).
* **`foods`**: Linked to `categories(name) ON UPDATE CASCADE` which allows the React frontend to run lightweight single-table queries while preserving complete database integrity.
* **`orders`**: Keeps purchase records. Retains a `JSONB` array of line items to prevent breaking existing single-transaction checkout flows.
* **`order_items`**: Fully normalized transactional table. A post-insert trigger on `orders` automatically extracts, types, and inserts data into this table for reporting and visual operations.

---

## 2. Complete Supabase SQL Script
Copy and run this entire SQL query directly inside your **Supabase SQL Editor**:

```sql
-- =====================================================================
-- 1. EXTENSIONS & PREREQUISITES
-- =====================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- 2. CREATE HELPER FUNCTIONS (TIMESTAMP TRIGGER)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS trigger AS $$
BEGIN
  new.updated_at = timezone('utc'::text, now());
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- 3. TABLES DEFINITION
-- =====================================================================

-- Table: public.profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL CONSTRAINT unique_profile_email UNIQUE,
  role TEXT NOT NULL DEFAULT 'customer' CONSTRAINT check_valid_role CHECK (role IN ('customer', 'admin')),
  full_name TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: public.categories
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: public.foods
CREATE TABLE IF NOT EXISTS public.foods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL CONSTRAINT positive_price CHECK (price >= 0),
  image_url TEXT,
  category TEXT NOT NULL REFERENCES public.categories(name) ON UPDATE CASCADE ON DELETE RESTRICT,
  is_available BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: public.orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  delivery_address TEXT NOT NULL,
  delivery_notes TEXT,
  total_price NUMERIC(10,2) NOT NULL CONSTRAINT positive_total CHECK (total_price >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CONSTRAINT check_order_status CHECK (status IN ('pending', 'preparing', 'delivered', 'cancelled')),
  items JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: public.order_items (Normalized Details)
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  food_id UUID REFERENCES public.foods(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL CONSTRAINT positive_item_price CHECK (price >= 0),
  quantity INTEGER NOT NULL CONSTRAINT positive_quantity CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================================
-- 4. PREHEAT LOOKUP SEEDS (CATEGORIES)
-- =====================================================================
INSERT INTO public.categories (name, slug) VALUES 
  ('Burgers', 'burgers'),
  ('Pizza', 'pizza'),
  ('Sides', 'sides'),
  ('Salads', 'salads'),
  ('Desserts', 'desserts'),
  ('Drinks', 'drinks')
ON CONFLICT (name) DO NOTHING;

-- =====================================================================
-- 5. AUTOMATED TRIGGER COUPLINGS
-- =====================================================================

-- Trigger A: Auto-update the 'updated_at' attribute across modified rows
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER update_foods_updated_at BEFORE UPDATE ON public.foods FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Trigger B: Automate User Profile Synchronization from Supabase Auth Signups
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

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger C: Automatically populate relational order_items table from order JSON trays 
CREATE OR REPLACE FUNCTION public.sync_order_items()
RETURNS trigger AS $$
DECLARE
  item_record jsonb;
BEGIN
  FOR item_record IN SELECT * FROM jsonb_array_elements(new.items)
  LOOP
    INSERT INTO public.order_items (order_id, food_id, name, price, quantity)
    VALUES (
      new.id,
      (item_record->>'food_id')::uuid,
      item_record->>'name',
      (item_record->>'price')::numeric,
      (item_record->>'quantity')::integer
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_order_created
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.sync_order_items();

-- =====================================================================
-- 6. HIGH-PERFORMANCE DATA INDEXES
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_foods_category ON public.foods(category);
CREATE INDEX IF NOT EXISTS idx_foods_available ON public.foods(is_available);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- =====================================================================
-- 7. ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- =====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

-- Secure helper function to bypass RLS recursion by using SECURITY DEFINER.
-- It executes with superuser rights, returning the current user's role securely.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Profiles: owners read/write, admins can inspect all
CREATE POLICY "Profiles read" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.get_my_role() = 'admin');
CREATE POLICY "Profiles update" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.get_my_role() = 'admin');
CREATE POLICY "Profiles service signup insert" ON public.profiles FOR INSERT WITH CHECK (true);

-- Categories: public read, admins write
CREATE POLICY "Categories read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Categories admin CRUD" ON public.categories FOR ALL TO authenticated USING (public.get_my_role() = 'admin');

-- Foods: public read, admins write
CREATE POLICY "Foods read" ON public.foods FOR SELECT USING (true);
CREATE POLICY "Foods admin CRUD" ON public.foods FOR ALL TO authenticated USING (public.get_my_role() = 'admin');

-- Orders: owners read, authenticated place orders, admins manage all
CREATE POLICY "Orders select" ON public.orders FOR SELECT USING (auth.uid() = user_id OR public.get_my_role() = 'admin');
CREATE POLICY "Orders insert" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Orders admin CRUD" ON public.orders FOR ALL TO authenticated USING (public.get_my_role() = 'admin');

-- Order Items: owners read, admins view all (Trigger bypasses check since SECURITY DEFINER runs as admin)
CREATE POLICY "Order items select" ON public.order_items FOR SELECT USING ((SELECT user_id FROM public.orders WHERE id = order_id) = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- =====================================================================
-- 9. SUPABASE STORAGE INTEGRATION (BUCKETS & POLICIES)
-- =====================================================================

-- Auto-register bucket if not present in the storage schema
INSERT INTO storage.buckets (id, name, public) 
VALUES ('food-images', 'food-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Bucket Policies
CREATE POLICY "Allow public read access to food-images" 
ON storage.objects FOR SELECT USING (bucket_id = 'food-images');

CREATE POLICY "Allow admin to insert inside food-images" 
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'food-images' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Allow admin to update inside food-images" 
ON storage.objects FOR UPDATE TO authenticated 
USING (bucket_id = 'food-images' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Allow admin to delete inside food-images" 
ON storage.objects FOR DELETE TO authenticated 
USING (bucket_id = 'food-images' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
```

---

## 3. Storage Integration & Blob Management

Admin-uploaded meal/food images **must never** be stored as direct RAW binary buffers inside the database. Instead:
1. When editing or inserting a food item in the administrator portal, the file binary is captured and pushed to the public Supabase static bucket `food-images` via:
   ```ts
   const { data, error } = await supabase.storage
     .from('food-images')
     .upload(`dishes/${Date.now()}-${file.name}`, file, { cacheControl: '3600' });
   ```
2. Retrieve the public cached CDN URL:
   ```ts
   const { data: { publicUrl } } = supabase.storage
     .from('food-images')
     .getPublicUrl(data.path);
   ```
3. Update the `foods.image_url` attribute in the SQL database table with the resolved URL string (e.g., `https://[id].supabase.co/storage/v1/object/public/food-images/dishes/...`).

---

## 4. Frontend Integration Snippets

### A. Auth Signup Structure
Registering users forwards the explicit application role, which propagates to metadata parsed by SQL triggers to create proper profiles:

```ts
// Customer Sign Up (/register)
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      full_name: fullName,
      role: 'customer'
    }
  }
});
```

### B. Order Placement Single-Transaction (Zero Client Friction)
The client inserts a simple single order array:

```ts
const { error } = await supabase
  .from('orders')
  .insert({
    user_id: user.id,
    user_email: user.email,
    customer_name: fullName,
    customer_phone: phone,
    delivery_address: address,
    delivery_notes: notes,
    total_price: priceAmount,
    status: 'pending',
    items: cart.map(it => ({
      food_id: it.food_id,
      name: it.name,
      price: it.price,
      quantity: it.quantity
    }))
  });
// Postgres 'on_order_created' trigger fires instantly, extracting items array to 'order_items'
```
