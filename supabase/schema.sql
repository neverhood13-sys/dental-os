-- ============================================================
-- DentalOS — схема базы данных для Supabase
-- Выполнить в SQL Editor проекта Supabase
-- ============================================================

-- Роли
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('chief_doctor', 'doctor', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Клиники
CREATE TABLE IF NOT EXISTS clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Профили
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'doctor',
  clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
  permissions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Триггер автопрофиля
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Пользователь'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'doctor')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Пациенты
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female')),
  birth_date DATE,
  phone TEXT,
  anamnesis TEXT,
  balance NUMERIC(12,2) DEFAULT 0,
  cloud_links JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Услуги
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  discount_absolute NUMERIC(12,2) DEFAULT 0,
  icon TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- История цен
CREATE TABLE IF NOT EXISTS price_history (
  id BIGSERIAL PRIMARY KEY,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  old_price NUMERIC(12,2),
  new_price NUMERIC(12,2),
  changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION log_price_change() RETURNS trigger AS $$
BEGIN
  IF OLD.price IS DISTINCT FROM NEW.price THEN
    INSERT INTO price_history (service_id, old_price, new_price, changed_by)
    VALUES (NEW.id, OLD.price, NEW.price, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_price_history ON services;
CREATE TRIGGER trg_price_history
AFTER UPDATE ON services
FOR EACH ROW EXECUTE FUNCTION log_price_change();

-- Зубы пациента
CREATE TABLE IF NOT EXISTS patient_teeth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  tooth_number INTEGER NOT NULL,
  state TEXT CHECK (state IN ('present','missing','deciduous','supernumerary','implant')) DEFAULT 'present',
  UNIQUE(patient_id, tooth_number)
);

-- Планы лечения
CREATE TABLE IF NOT EXISTS treatment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  recommendations TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Позиции плана
CREATE TABLE IF NOT EXISTS plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES treatment_plans(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  tooth_number INTEGER,
  quantity INTEGER DEFAULT 1,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  discount_absolute NUMERIC(12,2) DEFAULT 0,
  status TEXT CHECK (status IN ('planned','in_progress','done','cancelled')) DEFAULT 'planned',
  notes TEXT
);

-- Записи календаря
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  doctor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  comment TEXT,
  cloud_link TEXT,
  color TEXT DEFAULT '#6b7280'
);

-- RLS
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_teeth ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Политики
DO $$ BEGIN
  CREATE POLICY "auth read clinics" ON clinics FOR SELECT TO authenticated USING (true);
  CREATE POLICY "auth write clinics" ON clinics FOR ALL TO authenticated USING (true) WITH CHECK (true);
  CREATE POLICY "auth read profiles" ON profiles FOR SELECT TO authenticated USING (true);
  CREATE POLICY "self update profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
  CREATE POLICY "auth all patients" ON patients FOR ALL TO authenticated USING (true) WITH CHECK (true);
  CREATE POLICY "auth all services" ON services FOR ALL TO authenticated USING (true) WITH CHECK (true);
  CREATE POLICY "auth all price_history" ON price_history FOR ALL TO authenticated USING (true) WITH CHECK (true);
  CREATE POLICY "auth all teeth" ON patient_teeth FOR ALL TO authenticated USING (true) WITH CHECK (true);
  CREATE POLICY "auth all plans" ON treatment_plans FOR ALL TO authenticated USING (true) WITH CHECK (true);
  CREATE POLICY "auth all plan_items" ON plan_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
  CREATE POLICY "auth all appts" ON appointments FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;