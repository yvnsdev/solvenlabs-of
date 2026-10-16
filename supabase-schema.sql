-- Solven Labs — esquema completo de Supabase
-- Ejecutar TODO en SQL Editor como postgres. Incluye una única transacción.
-- Se puede repetir: no recrea tablas, no duplica políticas/triggers ni datos iniciales.
-- Requiere los esquemas auth y storage y los roles estándar de Supabase.
-- pg_cron es opcional: solo se programa la retención si ya está habilitado.
-- No incluye datos de demostración ni elimina tablas/datos existentes.
-- Para retirar tablas antiguas VACÍAS, ejecutar después supabase-cleanup.sql.
-- Se conservan las políticas de acceso actuales; este archivo no es una auditoría RLS.
-- Orden: tipos; identidad; operaciones; funciones; portal; finanzas; agenda;
-- historial; requerimientos; dependencias del dashboard; vistas finales.

BEGIN;
SET LOCAL search_path = public, extensions;

-- ========== EXTENSIONES ==========
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========== ENUM TYPES ==========
DO $enum$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'client_status') THEN
    CREATE TYPE public.client_status AS ENUM ('active', 'inactive', 'prospect');
  END IF;
END $enum$;
DO $enum$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'client_relationship') THEN
    CREATE TYPE public.client_relationship AS ENUM ('owner', 'manager', 'legal_rep', 'collaborator', 'other');
  END IF;
END $enum$;
DO $enum$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'project_status') THEN
    CREATE TYPE public.project_status AS ENUM ('proposal', 'in_development', 'review', 'completed', 'paused');
  END IF;
END $enum$;
DO $enum$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'invoice_status') THEN
    CREATE TYPE public.invoice_status AS ENUM ('draft', 'pending', 'paid', 'overdue', 'cancelled');
  END IF;
END $enum$;
DO $enum$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'order_status') THEN
    CREATE TYPE public.order_status AS ENUM ('pending', 'in_progress', 'review', 'done');
  END IF;
END $enum$;
DO $enum$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'order_priority') THEN
    CREATE TYPE public.order_priority AS ENUM ('low', 'medium', 'high');
  END IF;
END $enum$;
DO $enum$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'task_priority') THEN
    CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high');
  END IF;
END $enum$;
DO $enum$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'event_type') THEN
    CREATE TYPE public.event_type AS ENUM ('meeting', 'deadline', 'demo', 'kickoff', 'other');
  END IF;
END $enum$;
DO $enum$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'activity_type') THEN
    CREATE TYPE public.activity_type AS ENUM ('project', 'invoice', 'client', 'document', 'deploy', 'general', 'task', 'order', 'team', 'provider');
  END IF;
END $enum$;
DO $enum$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'team_availability') THEN
    CREATE TYPE public.team_availability AS ENUM ('available', 'busy', 'away', 'offline');
  END IF;
END $enum$;
DO $enum$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'doc_folder') THEN
    CREATE TYPE public.doc_folder AS ENUM ('contratos', 'propuestas', 'diseños', 'entregables', 'facturas', 'legal', 'otros');
  END IF;
END $enum$;
DO $enum$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'expense_category') THEN
    CREATE TYPE public.expense_category AS ENUM ('salarios', 'alquiler', 'servicios', 'software', 'hardware', 'viajes', 'marketing', 'legal', 'otro');
  END IF;
END $enum$;
DO $enum$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'expense_status') THEN
    CREATE TYPE public.expense_status AS ENUM ('draft', 'submitted', 'approved', 'rejected', 'paid');
  END IF;
END $enum$;

-- ========== PROFILES ==========
-- Extiende auth.users de Supabase
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('administracion', 'contabilidad', 'team', 'client', 'admin')),
  avatar_url TEXT,
  company TEXT,
  position TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- BEGIN COLUMN COMPAT
-- CREATE TABLE IF NOT EXISTS no actualiza tablas existentes.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name text NOT NULL,
  ADD COLUMN IF NOT EXISTS email text NOT NULL,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'client' CHECK (role IN ('administracion', 'contabilidad', 'team', 'client', 'admin')),
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS company text,
  ADD COLUMN IF NOT EXISTS position text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
-- END COLUMN COMPAT


ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- Política existente del módulo; se reemplaza por las políticas específicas debajo.
DROP POLICY IF EXISTS "Allow all on profiles" ON profiles;
CREATE POLICY "Allow all on profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);

-- Permitir roles personalizados administrados desde el dashboard.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_role_check'
      AND conrelid = 'profiles'::regclass
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_role_check;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_role_not_empty'
      AND conrelid = 'profiles'::regclass
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_role_not_empty;
  END IF;
END $$;

ALTER TABLE profiles ADD CONSTRAINT profiles_role_not_empty CHECK (length(trim(role)) > 0);

CREATE TABLE IF NOT EXISTS dashboard_roles (
  slug TEXT PRIMARY KEY CHECK (slug ~ '^[a-z0-9_]+$'),
  name TEXT NOT NULL,
  description TEXT,
  pages TEXT[] NOT NULL DEFAULT '{}',
  buttons TEXT[] NOT NULL DEFAULT '{}',
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- BEGIN COLUMN COMPAT
-- CREATE TABLE IF NOT EXISTS no actualiza tablas existentes.
ALTER TABLE public.dashboard_roles
  ADD COLUMN IF NOT EXISTS name text NOT NULL,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS pages text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS buttons text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_system boolean NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
-- END COLUMN COMPAT


ALTER TABLE dashboard_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on dashboard_roles" ON dashboard_roles;
CREATE POLICY "Allow all on dashboard_roles" ON dashboard_roles FOR ALL USING (true) WITH CHECK (true);

-- ========== ADMINISTRACIÓN Y PROTECCIÓN DE PERFILES ==========
CREATE OR REPLACE FUNCTION public.is_dashboard_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND lower(trim(role)) IN ('administracion', 'admin', 'administrator', 'administrador')
  );
$$;

-- Los perfiles pueden consultarse dentro del dashboard, pero solo
-- administración puede modificarlos o eliminarlos.
DROP POLICY IF EXISTS "Allow all on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users view profiles" ON public.profiles;
CREATE POLICY "Authenticated users view profiles"
ON public.profiles FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users create own profile" ON public.profiles;
CREATE POLICY "Users create own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (id = auth.uid() OR public.is_dashboard_admin());

DROP POLICY IF EXISTS "Admins update profiles" ON public.profiles;
CREATE POLICY "Admins update profiles"
ON public.profiles FOR UPDATE TO authenticated
USING (public.is_dashboard_admin())
WITH CHECK (public.is_dashboard_admin());

-- Las eliminaciones de usuarios pasan exclusivamente por la Edge Function
-- delete-team-member para borrar Auth y los datos relacionados en conjunto.
DROP POLICY IF EXISTS "Admins delete profiles" ON public.profiles;

CREATE OR REPLACE FUNCTION public.protect_dashboard_admin_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.id = auth.uid() THEN
    RAISE EXCEPTION 'No puedes eliminar tu propia cuenta.' USING ERRCODE = '42501';
  END IF;
  IF lower(trim(OLD.role)) IN ('administracion', 'admin', 'administrator', 'administrador') THEN
    RAISE EXCEPTION 'No se puede eliminar una cuenta administradora.' USING ERRCODE = '42501';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS protect_dashboard_admin_deletion_trigger ON public.profiles;
CREATE TRIGGER protect_dashboard_admin_deletion_trigger
BEFORE DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_dashboard_admin_deletion();

REVOKE ALL ON FUNCTION public.protect_dashboard_admin_deletion() FROM PUBLIC;

-- Los roles son visibles para usuarios autenticados; su administración
-- queda reservada exclusivamente a administración.
DROP POLICY IF EXISTS "Allow all on dashboard_roles" ON public.dashboard_roles;
DROP POLICY IF EXISTS "Authenticated users view dashboard roles" ON public.dashboard_roles;
CREATE POLICY "Authenticated users view dashboard roles"
ON public.dashboard_roles FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Admins manage dashboard roles" ON public.dashboard_roles;
CREATE POLICY "Admins manage dashboard roles"
ON public.dashboard_roles FOR ALL TO authenticated
USING (public.is_dashboard_admin())
WITH CHECK (public.is_dashboard_admin());

CREATE TABLE IF NOT EXISTS site_content (
  section TEXT PRIMARY KEY CHECK (section IN ('pricing', 'cases', 'contact')),
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- BEGIN COLUMN COMPAT
-- CREATE TABLE IF NOT EXISTS no actualiza tablas existentes.
ALTER TABLE public.site_content
  ADD COLUMN IF NOT EXISTS content jsonb NOT NULL DEFAULT CAST('{}' AS jsonb),
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
-- END COLUMN COMPAT


ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on site_content" ON site_content;
CREATE POLICY "Allow all on site_content" ON site_content FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE site_content DROP CONSTRAINT IF EXISTS site_content_section_check;
ALTER TABLE site_content ADD CONSTRAINT site_content_section_check
  CHECK (section IN ('pricing', 'cases', 'contact')) NOT VALID;

CREATE TABLE IF NOT EXISTS site_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  service TEXT,
  budget TEXT,
  message TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'landing',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'archived')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- BEGIN COLUMN COMPAT
-- CREATE TABLE IF NOT EXISTS no actualiza tablas existentes.
ALTER TABLE public.site_messages
  ADD COLUMN IF NOT EXISTS name text NOT NULL,
  ADD COLUMN IF NOT EXISTS email text NOT NULL,
  ADD COLUMN IF NOT EXISTS company text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS service text,
  ADD COLUMN IF NOT EXISTS budget text,
  ADD COLUMN IF NOT EXISTS message text NOT NULL,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'landing',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'archived')),
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT CAST('{}' AS jsonb),
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
-- END COLUMN COMPAT


ALTER TABLE site_messages ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE site_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on site_messages" ON site_messages;
CREATE POLICY "Allow all on site_messages" ON site_messages FOR ALL USING (true) WITH CHECK (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'dashboard_roles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.dashboard_roles;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'site_content'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.site_content;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'site_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.site_messages;
  END IF;

END $$;

INSERT INTO dashboard_roles (slug, name, description, pages, buttons, is_system) VALUES
  (
    'administracion',
    'Administración',
    'Acceso completo al dashboard y a las acciones de gestión.',
    ARRAY['overview','projects','tasks','messages','relations','quotes','contracts','calendar','orders','sii','analytics','reports','team','settings'],
    ARRAY['btn-export-report','btn-export-relations','btn-add-client','btn-add-provider','btn-add-project','btn-add-task','btn-add-order','btn-add-event','btn-site-refresh-messages','btn-export-cotizaciones','btn-nueva-cotizacion','btn-export-payments','btn-add-payment','btn-add-contrato-pers','btn-add-anexo','btn-add-finiquito','btn-export-expenses','btn-add-expense','btn-export-presii','btn-nueva-presii','btn-export-sii','btn-sii-factura-venta','btn-sii-factura-compra','btn-sii-honorarios','btn-sii-gasto','btn-sii-ingreso','btn-export-f29','btn-export-f22'],
    true
  ),
  (
    'contabilidad',
    'Contabilidad',
    'Acceso centrado en finanzas, impuestos, reportes y analíticas.',
    ARRAY['sii','quotes','analytics','reports','settings'],
    ARRAY['btn-export-presii'],
    true
  ),
  (
    'team',
    'Miembro',
    'Acceso operativo a proyectos, tareas, relaciones, tickets y calendario.',
    ARRAY['overview','projects','tasks','messages','sii','relations','calendar','orders','settings'],
    ARRAY['btn-add-project'],
    true
  ),
  (
    'practicante',
    'Practicante',
    'Acceso exclusivo a su bitácora y perfil de práctica.',
    ARRAY['calendar'],
    ARRAY[]::TEXT[],
    true
  )
ON CONFLICT (slug) DO NOTHING;

INSERT INTO site_content (section, content) VALUES
  ('pricing', '{
    "plans": [
      {"name":"Presencia Digital","description":"Implementación inicial para ordenar la base digital del negocio, con acompañamiento mensual para soporte y ajustes.","initial_price":"$299.000","monthly_price":"$39.900","billing_note":"50% al contratar y 50% contra entrega. La mantención se activa después de publicar.","usecase":"emprendimientos, profesionales independientes o negocios que necesitan verse confiables online."},
      {"name":"Impulso Comercial","description":"Implementación de catálogo, pagos y SEO básico, más acompañamiento mensual para medir y mejorar conversiones.","initial_price":"$699.000","monthly_price":"$89.900","billing_note":"50% al contratar y 50% contra entrega. La mantención se activa después de publicar.","usecase":"PYMEs que ya venden y necesitan convertir más consultas en clientes."},
      {"name":"Operación Inteligente","description":"Implementación de agenda, pagos, automatización y dashboard, más acompañamiento mensual de crecimiento.","initial_price":"$1.490.000","monthly_price":"$179.900","billing_note":"50% al contratar y 50% contra entrega. El alcance y la mantención se definen según flujos, integraciones y volumen.","usecase":"negocios que quieren automatizar atención, reservas o ventas."},
      {"name":"Transformación a Medida","description":"Para tiendas, paneles internos, integraciones, IA o flujos propios del negocio.","initial_price":"Inversión personalizada","monthly_price":"","billing_note":"Definimos entregables, etapas y presupuesto después del diagnóstico, antes de contratar.","usecase":"empresas que necesitan una solución a medida."}
    ]
  }'::jsonb),
  ('cases', '{"items":[]}'::jsonb),
  ('contact', '{
    "subject":"Nuevo Lead - Solicitud de Servicio Solven Labs",
    "autoresponse":"Gracias por contactar a Solven Labs. Hemos recibido tu solicitud y nuestro equipo la revisará en las próximas 24-48 horas hábiles.",
    "success_message":"Gracias por contactarnos. Te responderemos en 24-48 horas hábiles."
  }'::jsonb)
ON CONFLICT (section) DO NOTHING;

-- Trigger para crear profile automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''),
             NULLIF(NEW.email, ''), 'Usuario'),
    COALESCE(NEW.email, ''),
    COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'role'), ''), 'client')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

ALTER FUNCTION public.handle_new_user() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ========== TEAM MEMBERS ==========
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role_title TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  availability team_availability NOT NULL DEFAULT 'available',
  weekly_hours NUMERIC(5,1) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- BEGIN COLUMN COMPAT
-- CREATE TABLE IF NOT EXISTS no actualiza tablas existentes.
ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES profiles (id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS full_name text NOT NULL,
  ADD COLUMN IF NOT EXISTS role_title text NOT NULL,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS availability team_availability NOT NULL DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS weekly_hours numeric(5, 1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
-- END COLUMN COMPAT


ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on team_members" ON team_members;
DROP POLICY IF EXISTS "Anyone can view team members" ON team_members;
CREATE POLICY "Anyone can view team members"
ON team_members FOR SELECT
USING (true);
DROP POLICY IF EXISTS "Admins manage team members" ON team_members;
DROP POLICY IF EXISTS "Admins create team members" ON team_members;
CREATE POLICY "Admins create team members"
ON team_members FOR INSERT TO authenticated
WITH CHECK (public.is_dashboard_admin());
DROP POLICY IF EXISTS "Admins update team members" ON team_members;
CREATE POLICY "Admins update team members"
ON team_members FOR UPDATE TO authenticated
USING (public.is_dashboard_admin())
WITH CHECK (public.is_dashboard_admin());

-- ========== CLIENTS ==========
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  relationship client_relationship,
  rut TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  region TEXT,
  city TEXT,
  avatar_url TEXT,
  status client_status NOT NULL DEFAULT 'active',
  total_billed BIGINT NOT NULL DEFAULT 0, -- en CLP
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- BEGIN COLUMN COMPAT
-- CREATE TABLE IF NOT EXISTS no actualiza tablas existentes.
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS name text NOT NULL,
  ADD COLUMN IF NOT EXISTS company text NOT NULL,
  ADD COLUMN IF NOT EXISTS relationship client_relationship,
  ADD COLUMN IF NOT EXISTS rut text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS status client_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS total_billed bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
-- END COLUMN COMPAT


CREATE TABLE IF NOT EXISTS providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  relationship client_relationship,
  rut TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  region TEXT,
  city TEXT,
  avatar_url TEXT,
  status client_status NOT NULL DEFAULT 'active',
  payment_account TEXT,
  account_type TEXT,
  bank TEXT,
  account_number TEXT,
  total_billed BIGINT NOT NULL DEFAULT 0, -- en CLP
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- BEGIN COLUMN COMPAT
-- CREATE TABLE IF NOT EXISTS no actualiza tablas existentes.
ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS name text NOT NULL,
  ADD COLUMN IF NOT EXISTS company text NOT NULL,
  ADD COLUMN IF NOT EXISTS relationship client_relationship,
  ADD COLUMN IF NOT EXISTS rut text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS status client_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS payment_account text,
  ADD COLUMN IF NOT EXISTS account_type text,
  ADD COLUMN IF NOT EXISTS bank text,
  ADD COLUMN IF NOT EXISTS account_number text,
  ADD COLUMN IF NOT EXISTS total_billed bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
-- END COLUMN COMPAT


ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on clients" ON clients;
CREATE POLICY "Allow all on clients" ON clients FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on providers" ON providers;
CREATE POLICY "Allow all on providers" ON providers FOR ALL USING (true) WITH CHECK (true);

-- ========== PROJECTS =============
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT,
  status project_status NOT NULL DEFAULT 'proposal',
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  description TEXT,
  technologies TEXT[], -- ej: {'React', 'Node.js', 'PostgreSQL'}
  logo_url TEXT,
  start_date DATE,
  estimated_end_date DATE,
  domain_status TEXT NOT NULL DEFAULT 'unknown',
  frontend_status TEXT NOT NULL DEFAULT 'unknown',
  backend_status TEXT NOT NULL DEFAULT 'unknown',
  supabase_database_status TEXT NOT NULL DEFAULT 'unknown',
  supabase_auth_status TEXT NOT NULL DEFAULT 'unknown',
  supabase_storage_status TEXT NOT NULL DEFAULT 'unknown',
  ssl_status TEXT NOT NULL DEFAULT 'unknown',
  health_check_url TEXT,
  actual_end_date DATE,
  budget BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- BEGIN COLUMN COMPAT
-- CREATE TABLE IF NOT EXISTS no actualiza tablas existentes.
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS name text NOT NULL,
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS client_name text,
  ADD COLUMN IF NOT EXISTS status project_status NOT NULL DEFAULT 'proposal',
  ADD COLUMN IF NOT EXISTS progress integer NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS technologies text[],
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS estimated_end_date date,
  ADD COLUMN IF NOT EXISTS domain_status text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS frontend_status text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS backend_status text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS supabase_database_status text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS supabase_auth_status text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS supabase_storage_status text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS ssl_status text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS health_check_url text,
  ADD COLUMN IF NOT EXISTS actual_end_date date,
  ADD COLUMN IF NOT EXISTS budget bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
-- END COLUMN COMPAT


-- Compatibilidad con instalaciones existentes creadas antes del monitoreo.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS health_check_url TEXT;

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on projects" ON projects;
CREATE POLICY "Allow all on projects" ON projects FOR ALL USING (true) WITH CHECK (true);

-- Relación muchos-a-muchos: proyectos ↔ team_members
CREATE TABLE IF NOT EXISTS project_members (
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'developer',
  PRIMARY KEY (project_id, team_member_id)
);
-- BEGIN COLUMN COMPAT
-- CREATE TABLE IF NOT EXISTS no actualiza tablas existentes.
ALTER TABLE public.project_members
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects (id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS team_member_id uuid REFERENCES team_members (id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'developer';
-- END COLUMN COMPAT


ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on project_members" ON project_members;
CREATE POLICY "Allow all on project_members" ON project_members FOR ALL USING (true) WITH CHECK (true);

-- ========== INVOICES ==========
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT NOT NULL UNIQUE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  amount BIGINT NOT NULL DEFAULT 0, -- en CLP (total con IVA)
  subtotal BIGINT NOT NULL DEFAULT 0, -- subtotal sin IVA
  iva_amount BIGINT NOT NULL DEFAULT 0, -- monto del IVA
  iva_percentage NUMERIC(5,2) DEFAULT 19.0, -- porcentaje de IVA
  status invoice_status NOT NULL DEFAULT 'draft',
  description TEXT,
  bill_to_name TEXT, -- nombre a facturar
  bill_to_rut TEXT, -- RUT del cliente
  bill_to_address TEXT, -- dirección de facturación
  ship_to_name TEXT, -- nombre de contacto para envío
  ship_to_company TEXT, -- empresa para envío
  ship_to_address TEXT, -- dirección de envío
  payment_terms TEXT, -- condiciones de pago
  notes TEXT, -- notas adicionales
  issued_at DATE NOT NULL DEFAULT CURRENT_DATE,
  due_at DATE,
  paid_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- BEGIN COLUMN COMPAT
-- CREATE TABLE IF NOT EXISTS no actualiza tablas existentes.
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS invoice_number text NOT NULL UNIQUE,
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS amount bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subtotal bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS iva_amount bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS iva_percentage numeric(5, 2) DEFAULT 19.0,
  ADD COLUMN IF NOT EXISTS status invoice_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS bill_to_name text,
  ADD COLUMN IF NOT EXISTS bill_to_rut text,
  ADD COLUMN IF NOT EXISTS bill_to_address text,
  ADD COLUMN IF NOT EXISTS ship_to_name text,
  ADD COLUMN IF NOT EXISTS ship_to_company text,
  ADD COLUMN IF NOT EXISTS ship_to_address text,
  ADD COLUMN IF NOT EXISTS payment_terms text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS issued_at date NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS due_at date,
  ADD COLUMN IF NOT EXISTS paid_at date,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
-- END COLUMN COMPAT


ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on invoices" ON invoices;
CREATE POLICY "Allow all on invoices" ON invoices FOR ALL USING (true) WITH CHECK (true);

-- ========== FACTURACIÓN ==========
CREATE TABLE IF NOT EXISTS facturacion_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  invoice_number TEXT,
  customer_name TEXT,
  customer_rut TEXT,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'facturacion',
  billing_cycle TEXT NOT NULL DEFAULT 'one_time',
  payment_terms TEXT,
  renewal_date DATE,
  amount BIGINT NOT NULL DEFAULT 0,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- BEGIN COLUMN COMPAT
-- CREATE TABLE IF NOT EXISTS no actualiza tablas existentes.
ALTER TABLE public.facturacion_items
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS invoice_number text,
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS customer_rut text,
  ADD COLUMN IF NOT EXISTS title text NOT NULL,
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'facturacion',
  ADD COLUMN IF NOT EXISTS billing_cycle text NOT NULL DEFAULT 'one_time',
  ADD COLUMN IF NOT EXISTS payment_terms text,
  ADD COLUMN IF NOT EXISTS renewal_date date,
  ADD COLUMN IF NOT EXISTS amount bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
-- END COLUMN COMPAT


ALTER TABLE facturacion_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on facturacion_items" ON facturacion_items;
CREATE POLICY "Allow all on facturacion_items" ON facturacion_items FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_facturacion_items_project ON public.facturacion_items(project_id);
CREATE INDEX IF NOT EXISTS idx_facturacion_items_status ON public.facturacion_items(status);

-- ========== COTIZACIONES (usadas por dashboard y portal) ==========
CREATE TABLE IF NOT EXISTS public.cotizaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folio BIGINT, fecha DATE, vigencia INTEGER DEFAULT 30,
  estado TEXT DEFAULT 'vigente', cliente TEXT, razon_social TEXT,
  rut_receptor TEXT, giro_receptor TEXT, direccion_receptor TEXT,
  ciudad_receptor TEXT, email_receptor TEXT,
  contacto_proveedor_nombre TEXT, contacto_proveedor_telefono TEXT,
  contacto_proveedor_cargo TEXT,
  exento BOOLEAN DEFAULT false, items JSONB DEFAULT '[]'::jsonb,
  neto NUMERIC DEFAULT 0, iva NUMERIC DEFAULT 0, total NUMERIC DEFAULT 0,
  observaciones TEXT, project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
-- BEGIN COLUMN COMPAT
-- CREATE TABLE IF NOT EXISTS no actualiza tablas existentes.
ALTER TABLE public.cotizaciones
  ADD COLUMN IF NOT EXISTS folio bigint,
  ADD COLUMN IF NOT EXISTS fecha date,
  ADD COLUMN IF NOT EXISTS vigencia integer DEFAULT 30,
  ADD COLUMN IF NOT EXISTS estado text DEFAULT 'vigente',
  ADD COLUMN IF NOT EXISTS cliente text,
  ADD COLUMN IF NOT EXISTS razon_social text,
  ADD COLUMN IF NOT EXISTS rut_receptor text,
  ADD COLUMN IF NOT EXISTS giro_receptor text,
  ADD COLUMN IF NOT EXISTS direccion_receptor text,
  ADD COLUMN IF NOT EXISTS ciudad_receptor text,
  ADD COLUMN IF NOT EXISTS email_receptor text,
  ADD COLUMN IF NOT EXISTS contacto_proveedor_nombre text,
  ADD COLUMN IF NOT EXISTS contacto_proveedor_telefono text,
  ADD COLUMN IF NOT EXISTS contacto_proveedor_cargo text,
  ADD COLUMN IF NOT EXISTS exento boolean DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS items jsonb DEFAULT CAST('[]' AS jsonb),
  ADD COLUMN IF NOT EXISTS neto numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS iva numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS observaciones text,
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
-- END COLUMN COMPAT

ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Dashboard manages quotes" ON public.cotizaciones;
CREATE POLICY "Dashboard manages quotes" ON public.cotizaciones
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
GRANT ALL ON public.cotizaciones TO authenticated, service_role;

-- ========== FACTURAS PRE-SII ==========
-- Datos adicionales de contacto para cotizaciones. La migración es
-- idempotente para no alterar instalaciones que ya tengan estos campos.
ALTER TABLE IF EXISTS public.cotizaciones
  ADD COLUMN IF NOT EXISTS contacto_proveedor_nombre TEXT,
  ADD COLUMN IF NOT EXISTS contacto_proveedor_telefono TEXT,
  ADD COLUMN IF NOT EXISTS contacto_proveedor_cargo TEXT;

CREATE TABLE IF NOT EXISTS facturas_presii (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folio TEXT,
  tipo_dte TEXT,
  razon_social TEXT,
  rut_receptor TEXT,
  fecha DATE,
  fecha_vencimiento DATE,
  items JSONB,
  neto NUMERIC,
  iva NUMERIC,
  total NUMERIC,
  estado TEXT,
  periodo TEXT,
  operacion TEXT DEFAULT 'venta',
  emi_name TEXT,
  emi_rut TEXT,
  emi_giro TEXT,
  emi_address TEXT,
  giro_receptor TEXT,
  direccion_receptor TEXT,
  ciudad_receptor TEXT,
  comuna_receptor TEXT,
  exento BOOLEAN DEFAULT false,
  observaciones TEXT,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  sii_pdf_path TEXT,
  sii_pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- BEGIN COLUMN COMPAT
-- CREATE TABLE IF NOT EXISTS no actualiza tablas existentes.
ALTER TABLE public.facturas_presii
  ADD COLUMN IF NOT EXISTS folio text,
  ADD COLUMN IF NOT EXISTS tipo_dte text,
  ADD COLUMN IF NOT EXISTS razon_social text,
  ADD COLUMN IF NOT EXISTS rut_receptor text,
  ADD COLUMN IF NOT EXISTS fecha date,
  ADD COLUMN IF NOT EXISTS fecha_vencimiento date,
  ADD COLUMN IF NOT EXISTS items jsonb,
  ADD COLUMN IF NOT EXISTS neto numeric,
  ADD COLUMN IF NOT EXISTS iva numeric,
  ADD COLUMN IF NOT EXISTS total numeric,
  ADD COLUMN IF NOT EXISTS estado text,
  ADD COLUMN IF NOT EXISTS periodo text,
  ADD COLUMN IF NOT EXISTS operacion text DEFAULT 'venta',
  ADD COLUMN IF NOT EXISTS emi_name text,
  ADD COLUMN IF NOT EXISTS emi_rut text,
  ADD COLUMN IF NOT EXISTS emi_giro text,
  ADD COLUMN IF NOT EXISTS emi_address text,
  ADD COLUMN IF NOT EXISTS giro_receptor text,
  ADD COLUMN IF NOT EXISTS direccion_receptor text,
  ADD COLUMN IF NOT EXISTS ciudad_receptor text,
  ADD COLUMN IF NOT EXISTS comuna_receptor text,
  ADD COLUMN IF NOT EXISTS exento boolean DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS observaciones text,
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sii_pdf_path text,
  ADD COLUMN IF NOT EXISTS sii_pdf_url text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
-- END COLUMN COMPAT


ALTER TABLE facturas_presii ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on facturas_presii" ON facturas_presii;
CREATE POLICY "Allow all on facturas_presii" ON facturas_presii FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_facturas_presii_rut ON public.facturas_presii USING btree (rut_receptor);
CREATE INDEX IF NOT EXISTS idx_facturas_presii_estado ON public.facturas_presii USING btree (estado);
CREATE INDEX IF NOT EXISTS idx_facturas_presii_project ON public.facturas_presii USING btree (project_id);

-- ========== PAGOS (Honorarios / Contratos) ==========
CREATE TABLE IF NOT EXISTS pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE,
  tipo TEXT,
  operacion TEXT,
  nombre TEXT,
  rut TEXT,
  cargo TEXT,
  bruto NUMERIC,
  descuentos NUMERIC,
  neto NUMERIC,
  descripcion TEXT,
  status TEXT NOT NULL DEFAULT 'pendiente',
  skip_analytics BOOLEAN NOT NULL DEFAULT false,
  sueldo_base NUMERIC NOT NULL DEFAULT 0,
  bono NUMERIC NOT NULL DEFAULT 0,
  gratificacion NUMERIC NOT NULL DEFAULT 0,
  horas_extra NUMERIC NOT NULL DEFAULT 0,
  cot_afp NUMERIC NOT NULL DEFAULT 0,
  cot_vol_afp NUMERIC NOT NULL DEFAULT 0,
  cot_pact_salud NUMERIC NOT NULL DEFAULT 0,
  dif_plan_salud NUMERIC NOT NULL DEFAULT 0,
  seguro_cesantia NUMERIC NOT NULL DEFAULT 0,
  impuesto_unico NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- BEGIN COLUMN COMPAT
-- CREATE TABLE IF NOT EXISTS no actualiza tablas existentes.
ALTER TABLE public.pagos
  ADD COLUMN IF NOT EXISTS fecha date,
  ADD COLUMN IF NOT EXISTS tipo text,
  ADD COLUMN IF NOT EXISTS operacion text,
  ADD COLUMN IF NOT EXISTS nombre text,
  ADD COLUMN IF NOT EXISTS rut text,
  ADD COLUMN IF NOT EXISTS cargo text,
  ADD COLUMN IF NOT EXISTS bruto numeric,
  ADD COLUMN IF NOT EXISTS descuentos numeric,
  ADD COLUMN IF NOT EXISTS neto numeric,
  ADD COLUMN IF NOT EXISTS descripcion text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pendiente',
  ADD COLUMN IF NOT EXISTS skip_analytics boolean NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS sueldo_base numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bono numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gratificacion numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS horas_extra numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cot_afp numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cot_vol_afp numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cot_pact_salud numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dif_plan_salud numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS seguro_cesantia numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS impuesto_unico numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
-- END COLUMN COMPAT


ALTER TABLE pagos ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pendiente';
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS operacion TEXT NOT NULL DEFAULT 'compra';

ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on pagos" ON pagos;
CREATE POLICY "Allow all on pagos" ON pagos FOR ALL USING (true) WITH CHECK (true);

-- ========== ORDERS (Kanban) ==========
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- Frontend, Backend, Diseño, etc.
  status order_status NOT NULL DEFAULT 'pending',
  priority order_priority NOT NULL DEFAULT 'medium',
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES team_members(id) ON DELETE SET NULL,
  due_date DATE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- BEGIN COLUMN COMPAT
-- CREATE TABLE IF NOT EXISTS no actualiza tablas existentes.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS title text NOT NULL,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS status order_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS priority order_priority NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES team_members (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
-- END COLUMN COMPAT


ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on orders" ON orders;
CREATE POLICY "Allow all on orders" ON orders FOR ALL USING (true) WITH CHECK (true);

-- ========== SERVICE ORDERS (Servicio técnico) ==========
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  priority task_priority NOT NULL DEFAULT 'medium',
  category TEXT,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES team_members(id) ON DELETE SET NULL,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- BEGIN COLUMN COMPAT
-- CREATE TABLE IF NOT EXISTS no actualiza tablas existentes.
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS title text NOT NULL,
  ADD COLUMN IF NOT EXISTS completed boolean NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS priority task_priority NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES team_members (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
-- END COLUMN COMPAT


ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on tasks" ON tasks;
CREATE POLICY "Allow all on tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);

-- ========== DOCUMENTS ==========
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- ruta en Supabase Storage
  file_size BIGINT DEFAULT 0, -- bytes
  mime_type TEXT,
  folder doc_folder NOT NULL DEFAULT 'otros',
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- BEGIN COLUMN COMPAT
-- CREATE TABLE IF NOT EXISTS no actualiza tablas existentes.
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS file_name text NOT NULL,
  ADD COLUMN IF NOT EXISTS file_path text NOT NULL,
  ADD COLUMN IF NOT EXISTS file_size bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mime_type text,
  ADD COLUMN IF NOT EXISTS folder doc_folder NOT NULL DEFAULT 'otros',
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS uploaded_by uuid REFERENCES profiles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
-- END COLUMN COMPAT


ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on documents" ON documents;
CREATE POLICY "Allow all on documents" ON documents FOR ALL USING (true) WITH CHECK (true);

-- ========== EXPENSES (Gastos Operacionales) ==========
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  date_incurred DATE,
  receipt_number TEXT,
  cost_center TEXT,
  iva_percentage NUMERIC(5,2) DEFAULT 19,
  iva_amount BIGINT NOT NULL DEFAULT 0,
  discount_amount BIGINT NOT NULL DEFAULT 0,
  category expense_category NOT NULL,
  description TEXT NOT NULL,
  amount BIGINT NOT NULL DEFAULT 0, -- en CLP
  currency TEXT DEFAULT 'CLP',
  vendor TEXT, -- proveedor (ej: "Amazon", "Proveedor SaaS")
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL, -- si es asociado a un proyecto
  submitted_by UUID REFERENCES profiles(id) ON DELETE SET NULL, -- quién registró el gasto
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL, -- quién lo aprobó
  status expense_status NOT NULL DEFAULT 'draft',
  receipt_path TEXT, -- ruta al comprobante en Storage
  receipt_filename TEXT, -- nombre del archivo
  notes TEXT, -- notas adicionales
  payment_method TEXT DEFAULT 'transfer', -- 'transfer', 'cash', 'credit_card', 'check'
  paid_at DATE, -- fecha en que se canceló
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- BEGIN COLUMN COMPAT
-- CREATE TABLE IF NOT EXISTS no actualiza tablas existentes.
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS date date NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS date_incurred date,
  ADD COLUMN IF NOT EXISTS receipt_number text,
  ADD COLUMN IF NOT EXISTS cost_center text,
  ADD COLUMN IF NOT EXISTS iva_percentage numeric(5, 2) DEFAULT 19,
  ADD COLUMN IF NOT EXISTS iva_amount bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS category expense_category NOT NULL,
  ADD COLUMN IF NOT EXISTS description text NOT NULL,
  ADD COLUMN IF NOT EXISTS amount bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'CLP',
  ADD COLUMN IF NOT EXISTS vendor text,
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES profiles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES profiles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status expense_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS receipt_path text,
  ADD COLUMN IF NOT EXISTS receipt_filename text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'transfer',
  ADD COLUMN IF NOT EXISTS paid_at date,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
-- END COLUMN COMPAT


ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on expenses" ON expenses;
CREATE POLICY "Allow all on expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);

-- Índices para expenses
-- El dashboard usa date_incurred; los informes históricos usan date.
UPDATE public.expenses SET date_incurred = date WHERE date_incurred IS NULL;
CREATE OR REPLACE FUNCTION public.sync_expense_dates()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.date_incurred := COALESCE(NEW.date_incurred, NEW.date, CURRENT_DATE);
    NEW.date := NEW.date_incurred;
  ELSIF NEW.date_incurred IS DISTINCT FROM OLD.date_incurred THEN
    NEW.date := COALESCE(NEW.date_incurred, NEW.date);
    NEW.date_incurred := NEW.date;
  ELSIF NEW.date IS DISTINCT FROM OLD.date THEN
    NEW.date_incurred := NEW.date;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS sync_expense_dates ON public.expenses;
CREATE TRIGGER sync_expense_dates BEFORE INSERT OR UPDATE ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.sync_expense_dates();

CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses USING btree (date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses USING btree (category);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses USING btree (status);
CREATE INDEX IF NOT EXISTS idx_expenses_project_id ON expenses USING btree (project_id);

-- ========== CALENDAR EVENTS ==========
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  event_type event_type NOT NULL DEFAULT 'meeting',
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  meet_link TEXT,
  location TEXT,
  timezone TEXT NOT NULL DEFAULT 'America/Santiago',
  ical_uid TEXT NOT NULL DEFAULT (uuid_generate_v4()::TEXT || '@calendar.solvenlabs.cl'),
  ical_sequence INTEGER NOT NULL DEFAULT 0 CHECK (ical_sequence >= 0),
  organizer_mailbox_id UUID,
  meeting_notes TEXT,
  blocks_bookings BOOLEAN NOT NULL DEFAULT false,
  recurrence_group_id UUID,
  recurrence_rule JSONB,
  recurrence_sequence INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- BEGIN COLUMN COMPAT
-- CREATE TABLE IF NOT EXISTS no actualiza tablas existentes.
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS title text NOT NULL,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS event_type event_type NOT NULL DEFAULT 'meeting',
  ADD COLUMN IF NOT EXISTS event_date date NOT NULL,
  ADD COLUMN IF NOT EXISTS start_time time,
  ADD COLUMN IF NOT EXISTS end_time time,
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES profiles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS meet_link text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'America/Santiago',
  ADD COLUMN IF NOT EXISTS ical_uid text NOT NULL DEFAULT CAST(uuid_generate_v4() AS text) || '@calendar.solvenlabs.cl',
  ADD COLUMN IF NOT EXISTS ical_sequence integer NOT NULL DEFAULT 0 CHECK (ical_sequence >= 0),
  ADD COLUMN IF NOT EXISTS organizer_mailbox_id uuid,
  ADD COLUMN IF NOT EXISTS meeting_notes text,
  ADD COLUMN IF NOT EXISTS blocks_bookings boolean NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS recurrence_group_id uuid,
  ADD COLUMN IF NOT EXISTS recurrence_rule jsonb,
  ADD COLUMN IF NOT EXISTS recurrence_sequence integer,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
-- END COLUMN COMPAT


-- Las columnas de agenda se actualizan en COLUMN COMPAT, antes de los índices.

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on events" ON events;
CREATE POLICY "Allow all on events" ON events FOR ALL USING (true) WITH CHECK (true);

CREATE UNIQUE INDEX IF NOT EXISTS idx_events_ical_uid ON events (ical_uid);

CREATE TABLE IF NOT EXISTS event_attendees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'tentative', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (email = lower(email) AND email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  UNIQUE (event_id, email)
);
-- BEGIN COLUMN COMPAT
-- CREATE TABLE IF NOT EXISTS no actualiza tablas existentes.
ALTER TABLE public.event_attendees
  ADD COLUMN IF NOT EXISTS event_id uuid NOT NULL REFERENCES events (id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS email text NOT NULL,
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'tentative', 'declined')),
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
-- END COLUMN COMPAT


CREATE INDEX IF NOT EXISTS idx_event_attendees_event ON event_attendees (event_id);
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users read event attendees" ON event_attendees;
CREATE POLICY "Authenticated users read event attendees"
  ON event_attendees FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Owners manage event attendees" ON event_attendees;
CREATE POLICY "Owners manage event attendees"
  ON event_attendees FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM events e WHERE e.id = event_attendees.event_id AND e.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM events e WHERE e.id = event_attendees.event_id AND e.created_by = auth.uid()));

CREATE TABLE IF NOT EXISTS calendar_invitation_requests (
  request_id UUID PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'cancel')),
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'sent', 'failed')),
  result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- BEGIN COLUMN COMPAT
-- CREATE TABLE IF NOT EXISTS no actualiza tablas existentes.
ALTER TABLE public.calendar_invitation_requests
  ADD COLUMN IF NOT EXISTS owner_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES events (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS action text NOT NULL CHECK (action IN ('create', 'update', 'cancel')),
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'sent', 'failed')),
  ADD COLUMN IF NOT EXISTS result jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
-- END COLUMN COMPAT


ALTER TABLE calendar_invitation_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners read calendar invitation requests" ON calendar_invitation_requests;
CREATE POLICY "Owners read calendar invitation requests"
  ON calendar_invitation_requests FOR SELECT TO authenticated USING (owner_id = auth.uid());

-- ========== ACTIVITY LOG ==========
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_name TEXT,
  activity_type activity_type NOT NULL DEFAULT 'general',
  description TEXT NOT NULL,
  entity_id UUID, -- ID del recurso relacionado
  entity_name TEXT, -- Nombre legible
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- BEGIN COLUMN COMPAT
-- CREATE TABLE IF NOT EXISTS no actualiza tablas existentes.
ALTER TABLE public.activity_log
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES profiles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS user_name text,
  ADD COLUMN IF NOT EXISTS activity_type activity_type NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS description text NOT NULL,
  ADD COLUMN IF NOT EXISTS entity_id uuid,
  ADD COLUMN IF NOT EXISTS entity_name text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
-- END COLUMN COMPAT


ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.activity_log FROM anon, authenticated;
GRANT SELECT, INSERT ON public.activity_log TO authenticated;
DROP POLICY IF EXISTS "Authenticated users read activity log" ON activity_log;
CREATE POLICY "Authenticated users read activity log"
  ON activity_log FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users insert own activity log" ON activity_log;
CREATE POLICY "Users insert own activity log"
  ON activity_log FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- ========== VIEWS ÚTILES ==========

-- Vista: KPIs del dashboard
-- Vista: Facturas con info del cliente
-- Vista: Proyectos con info del cliente y conteo de miembros
-- Vista: Documentos con info del uploader
-- ========== FUNCIONES ==========

-- Auto-actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas con updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS update_dashboard_roles_updated_at ON dashboard_roles;
CREATE TRIGGER update_dashboard_roles_updated_at BEFORE UPDATE ON dashboard_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS update_internship_profiles_updated_at ON internship_profiles;
CREATE TRIGGER update_internship_profiles_updated_at BEFORE UPDATE ON internship_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS update_internship_logs_updated_at ON internship_logs;
CREATE TRIGGER update_internship_logs_updated_at BEFORE UPDATE ON internship_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS update_facturacion_items_updated_at ON facturacion_items;
CREATE TRIGGER update_facturacion_items_updated_at BEFORE UPDATE ON facturacion_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
-- Función: Obtener siguiente número de factura
CREATE OR REPLACE FUNCTION get_next_invoice_number()
RETURNS TEXT AS $$
DECLARE
  last_num INTEGER;
BEGIN
  SELECT COALESCE(
    MAX(CAST(REPLACE(invoice_number, 'INV-', '') AS INTEGER)), 0
  ) + 1 INTO last_num FROM invoices;
  RETURN 'INV-' || LPAD(last_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Función: Registrar actividad
CREATE OR REPLACE FUNCTION log_activity(
  p_user_id UUID,
  p_user_name TEXT,
  p_type activity_type,
  p_description TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_entity_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO activity_log (user_id, user_name, activity_type, description, entity_id, entity_name)
  VALUES (p_user_id, p_user_name, p_type, p_description, p_entity_id, p_entity_name)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Retención de activity_log: conserva los últimos 14 días y limpia el resto
-- una vez por semana. Requiere tener habilitada la extensión pg_cron en Supabase.
CREATE OR REPLACE FUNCTION cleanup_activity_log(
  p_retention INTERVAL DEFAULT INTERVAL '14 days'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.activity_log
  WHERE created_at < NOW() - p_retention;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

REVOKE ALL ON FUNCTION cleanup_activity_log(INTERVAL) FROM PUBLIC;

-- Si pg_cron ya está habilitado, configura la retención semanal.

-- Reemplaza el trabajo si el esquema se ejecuta nuevamente, evitando duplicados.
DO $$
DECLARE
  existing_job_id BIGINT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RAISE NOTICE 'pg_cron no está habilitado: retención semanal no programada.';
    RETURN;
  END IF;
  SELECT jobid INTO existing_job_id
  FROM cron.job
  WHERE jobname = 'cleanup_activity_log_weekly';

  IF existing_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(existing_job_id);
  END IF;

  PERFORM cron.schedule(
    'cleanup_activity_log_weekly',
    '15 3 * * 0',
    $schedule$SELECT public.cleanup_activity_log(INTERVAL '14 days');$schedule$
  );
END;
$$;

-- Función: Estadísticas de facturación
CREATE OR REPLACE FUNCTION get_billing_stats()
RETURNS TABLE(total_billed BIGINT, total_pending BIGINT, total_paid BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(amount), 0)::BIGINT AS total_billed,
    COALESCE(SUM(CASE WHEN status IN ('pending', 'overdue') THEN amount ELSE 0 END), 0)::BIGINT AS total_pending,
    COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0)::BIGINT AS total_paid
  FROM invoices
  WHERE status != 'cancelled';
END;
$$ LANGUAGE plpgsql;

-- Función: Ingresos mensuales (últimos N meses)
CREATE OR REPLACE FUNCTION get_monthly_revenue(months_back INTEGER DEFAULT 6)
RETURNS TABLE(month_label TEXT, total BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(d.month_date, 'Mon') AS month_label,
    COALESCE(SUM(i.amount), 0)::BIGINT AS total
  FROM generate_series(
    DATE_TRUNC('month', CURRENT_DATE) - ((months_back - 1) || ' months')::INTERVAL,
    DATE_TRUNC('month', CURRENT_DATE),
    '1 month'::INTERVAL
  ) AS d(month_date)
  LEFT JOIN invoices i ON DATE_TRUNC('month', i.issued_at) = d.month_date
    AND i.status IN ('paid', 'pending')
  GROUP BY d.month_date
  ORDER BY d.month_date;
END;
$$ LANGUAGE plpgsql;

-- Función: Estadísticas de gastos (últimos N meses)
CREATE OR REPLACE FUNCTION get_monthly_expenses(months_back INTEGER DEFAULT 6)
RETURNS TABLE(month_label TEXT, total BIGINT, by_category JSON) AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(d.month_date, 'Mon') AS month_label,
    COALESCE(SUM(e.amount), 0)::BIGINT AS total,
    COALESCE(json_object_agg(e.category, SUM(e.amount)::BIGINT), '{}'::JSON) AS by_category
  FROM generate_series(
    DATE_TRUNC('month', CURRENT_DATE) - ((months_back - 1) || ' months')::INTERVAL,
    DATE_TRUNC('month', CURRENT_DATE),
    '1 month'::INTERVAL
  ) AS d(month_date)
  LEFT JOIN expenses e ON DATE_TRUNC('month', e.date) = d.month_date
    AND e.status IN ('approved', 'paid')
  GROUP BY d.month_date
  ORDER BY d.month_date;
END;
$$ LANGUAGE plpgsql;

-- Función: Total de gastos por categoría (período actual)
CREATE OR REPLACE FUNCTION get_expenses_by_category()
RETURNS TABLE(category TEXT, total BIGINT, count INT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.category::TEXT,
    COALESCE(SUM(e.amount), 0)::BIGINT AS total,
    COUNT(*)::INT
  FROM expenses e
  WHERE e.status IN ('approved', 'paid')
    AND EXTRACT(YEAR FROM e.date) = EXTRACT(YEAR FROM CURRENT_DATE)
  GROUP BY e.category
  ORDER BY total DESC;
END;
$$ LANGUAGE plpgsql;

-- Función: Gastos pendientes de aprobación
CREATE OR REPLACE FUNCTION get_pending_expenses()
RETURNS TABLE(id UUID, date DATE, category TEXT, description TEXT, amount BIGINT, submitted_by TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.date,
    e.category::TEXT,
    e.description,
    e.amount,
    pr.full_name
  FROM expenses e
  LEFT JOIN profiles pr ON e.submitted_by = pr.id
  WHERE e.status = 'submitted'
  ORDER BY e.date DESC;
END;
$$ LANGUAGE plpgsql;

-- ========== STORAGE BUCKETS ==========
-- Ejecutar DESPUÉS de crear las tablas
-- En Supabase Dashboard: Storage > Create Bucket, o usar el SQL:

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('project-assets', 'project-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acceso a los buckets existentes.
DROP POLICY IF EXISTS "Allow public upload to documents" ON storage.objects;
CREATE POLICY "Allow public upload to documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents');

DROP POLICY IF EXISTS "Allow public read from documents" ON storage.objects;
CREATE POLICY "Allow public read from documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents');

DROP POLICY IF EXISTS "Allow public delete from documents" ON storage.objects;
CREATE POLICY "Allow public delete from documents" ON storage.objects
  FOR DELETE USING (bucket_id = 'documents');

DROP POLICY IF EXISTS "Allow public upload to avatars" ON storage.objects;
CREATE POLICY "Allow public upload to avatars" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Allow public read from avatars" ON storage.objects;
CREATE POLICY "Allow public read from avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Allow public upload to project-assets" ON storage.objects;
CREATE POLICY "Allow public upload to project-assets" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'project-assets');

DROP POLICY IF EXISTS "Allow public read from project-assets" ON storage.objects;
CREATE POLICY "Allow public read from project-assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'project-assets');

-- ========== ÍNDICES ==========
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_due ON invoices(due_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_assigned ON orders(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_folder ON documents(folder);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_recurrence_group ON events(recurrence_group_id) WHERE recurrence_group_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at DESC);

-- ==========================================================================
-- MIGRACIÓN: Portal de Estado de Proyecto para Clientes
-- Integrado en esta ejecución completa.
-- ==========================================================================

-- ========== COLUMNAS ADICIONALES EN PROJECTS ==========

-- Token único corto para que clientes accedan al portal (público, compartible)
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS client_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS client_visible BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS client_notes TEXT;

-- Función para generar token aleatorio de 8 caracteres hex
CREATE OR REPLACE FUNCTION generate_client_token()
RETURNS TEXT AS $$
BEGIN
  RETURN lower(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
END;
$$ LANGUAGE plpgsql;

-- Auto-asignar token al crear un proyecto si no tiene uno
CREATE OR REPLACE FUNCTION set_client_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.client_token IS NULL THEN
    LOOP
      NEW.client_token := lower(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
      EXIT WHEN NOT EXISTS (SELECT 1 FROM projects WHERE client_token = NEW.client_token AND id != NEW.id);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_client_token ON projects;
CREATE TRIGGER trigger_set_client_token
  BEFORE INSERT ON projects
  FOR EACH ROW EXECUTE FUNCTION set_client_token();

-- Generar tokens para proyectos existentes sin token
DO $$
DECLARE r RECORD; tok TEXT;
BEGIN
  FOR r IN SELECT id FROM projects WHERE client_token IS NULL LOOP
    LOOP
      tok := lower(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
      EXIT WHEN NOT EXISTS (SELECT 1 FROM projects WHERE client_token = tok);
    END LOOP;
    UPDATE projects SET client_token = tok WHERE id = r.id;
  END LOOP;
END;
$$;

-- ========== PROJECT UPDATES ==========
-- Actualizaciones visibles para el cliente (timeline de avances)

DO $enum$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'update_type') THEN
    CREATE TYPE public.update_type AS ENUM ('milestone', 'update', 'delivery', 'issue', 'note');
  END IF;
END $enum$;

CREATE TABLE IF NOT EXISTS project_updates (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  type        update_type NOT NULL DEFAULT 'update',
  visible_to_client BOOLEAN NOT NULL DEFAULT true,
  created_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- BEGIN COLUMN COMPAT
-- CREATE TABLE IF NOT EXISTS no actualiza tablas existentes.
ALTER TABLE public.project_updates
  ADD COLUMN IF NOT EXISTS project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS title text NOT NULL,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS type update_type NOT NULL DEFAULT 'update',
  ADD COLUMN IF NOT EXISTS visible_to_client boolean NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES profiles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
-- END COLUMN COMPAT


ALTER TABLE project_updates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on project_updates" ON project_updates;
CREATE POLICY "Allow all on project_updates" ON project_updates FOR ALL USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS update_project_updates_updated_at ON project_updates;
CREATE TRIGGER update_project_updates_updated_at
  BEFORE UPDATE ON project_updates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_project_updates_project ON project_updates(project_id);
CREATE INDEX IF NOT EXISTS idx_project_updates_created ON project_updates(created_at DESC);

-- Vista pública para el portal de clientes
-- ============================================================
-- Solven Labs — Finanzas & Contratos Migration
-- Integrado en esta ejecución completa.
-- ============================================================

-- 1. FINANZAS — Ingresos / Ventas
CREATE TABLE IF NOT EXISTS fin_ingresos (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  fecha      DATE,
  concepto   TEXT        NOT NULL,
  cliente    TEXT,
  origen     TEXT,
  categoria   TEXT        NOT NULL DEFAULT 'servicio',
  metodo_pago TEXT,
  referencia  TEXT,
  observaciones TEXT,
  estado     TEXT        NOT NULL DEFAULT 'registrado',
  monto      BIGINT      NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- BEGIN COLUMN COMPAT
-- CREATE TABLE IF NOT EXISTS no actualiza tablas existentes.
ALTER TABLE public.fin_ingresos
  ADD COLUMN IF NOT EXISTS fecha date,
  ADD COLUMN IF NOT EXISTS concepto text NOT NULL,
  ADD COLUMN IF NOT EXISTS cliente text,
  ADD COLUMN IF NOT EXISTS origen text,
  ADD COLUMN IF NOT EXISTS categoria text NOT NULL DEFAULT 'servicio',
  ADD COLUMN IF NOT EXISTS metodo_pago text,
  ADD COLUMN IF NOT EXISTS referencia text,
  ADD COLUMN IF NOT EXISTS observaciones text,
  ADD COLUMN IF NOT EXISTS estado text NOT NULL DEFAULT 'registrado',
  ADD COLUMN IF NOT EXISTS monto bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
-- END COLUMN COMPAT

ALTER TABLE fin_ingresos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fin_ingresos_all" ON fin_ingresos;
CREATE POLICY "fin_ingresos_all" ON fin_ingresos FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_fin_ingresos_fecha ON fin_ingresos(fecha DESC);

ALTER TABLE fin_ingresos ADD COLUMN IF NOT EXISTS origen TEXT;
ALTER TABLE fin_ingresos ADD COLUMN IF NOT EXISTS categoria TEXT NOT NULL DEFAULT 'servicio';
ALTER TABLE fin_ingresos ADD COLUMN IF NOT EXISTS metodo_pago TEXT;
ALTER TABLE fin_ingresos ADD COLUMN IF NOT EXISTS referencia TEXT;
ALTER TABLE fin_ingresos ADD COLUMN IF NOT EXISTS observaciones TEXT;
ALTER TABLE fin_ingresos ADD COLUMN IF NOT EXISTS estado TEXT NOT NULL DEFAULT 'registrado';

-- 2. FINANZAS — Gastos / Proveedores
CREATE TABLE IF NOT EXISTS fin_gastos (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  fecha      DATE,
  proveedor  TEXT        NOT NULL,
  concepto   TEXT,
  monto      BIGINT      NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- BEGIN COLUMN COMPAT
-- CREATE TABLE IF NOT EXISTS no actualiza tablas existentes.
ALTER TABLE public.fin_gastos
  ADD COLUMN IF NOT EXISTS fecha date,
  ADD COLUMN IF NOT EXISTS proveedor text NOT NULL,
  ADD COLUMN IF NOT EXISTS concepto text,
  ADD COLUMN IF NOT EXISTS monto bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
-- END COLUMN COMPAT

ALTER TABLE fin_gastos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fin_gastos_all" ON fin_gastos;
CREATE POLICY "fin_gastos_all" ON fin_gastos FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_fin_gastos_fecha ON fin_gastos(fecha DESC);

-- 3. CONTRATOS — Personal
CREATE TABLE IF NOT EXISTS contratos_personal (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  empleado      TEXT        NOT NULL,
  cargo         TEXT,
  domicilio     TEXT,
  inicio        DATE,
  fin           DATE,
  estado        TEXT        NOT NULL DEFAULT 'activo',
  bank          TEXT,
  account_type  TEXT,
  account_number TEXT,
  access_token  TEXT,
  access_expires_at TIMESTAMPTZ,
  signed_at     TIMESTAMPTZ,
  signed_name   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- BEGIN COLUMN COMPAT
-- CREATE TABLE IF NOT EXISTS no actualiza tablas existentes.
ALTER TABLE public.contratos_personal
  ADD COLUMN IF NOT EXISTS empleado text NOT NULL,
  ADD COLUMN IF NOT EXISTS cargo text,
  ADD COLUMN IF NOT EXISTS domicilio text,
  ADD COLUMN IF NOT EXISTS inicio date,
  ADD COLUMN IF NOT EXISTS fin date,
  ADD COLUMN IF NOT EXISTS estado text NOT NULL DEFAULT 'activo',
  ADD COLUMN IF NOT EXISTS bank text,
  ADD COLUMN IF NOT EXISTS account_type text,
  ADD COLUMN IF NOT EXISTS account_number text,
  ADD COLUMN IF NOT EXISTS access_token text,
  ADD COLUMN IF NOT EXISTS access_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS signed_name text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
-- END COLUMN COMPAT

ALTER TABLE contratos_personal ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "contratos_personal_all" ON contratos_personal;
CREATE POLICY "contratos_personal_all" ON contratos_personal FOR ALL USING (true) WITH CHECK (true);

-- ─── MIGRATIONS: extend contratos tables with richer employee data ───────────
-- Compatibilidad con instalaciones existentes.

ALTER TABLE contratos_personal
  ADD COLUMN IF NOT EXISTS rut             TEXT,
  ADD COLUMN IF NOT EXISTS email           TEXT,
  ADD COLUMN IF NOT EXISTS telefono        TEXT,
  ADD COLUMN IF NOT EXISTS domicilio       TEXT,
  ADD COLUMN IF NOT EXISTS jornada         TEXT NOT NULL DEFAULT 'completa',
  ADD COLUMN IF NOT EXISTS bank            TEXT,
  ADD COLUMN IF NOT EXISTS account_type    TEXT,
  ADD COLUMN IF NOT EXISTS account_number  TEXT,
  ADD COLUMN IF NOT EXISTS sueldo_bruto    BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sueldo_liquido  BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gratificacion   TEXT NOT NULL DEFAULT 'anual',
  ADD COLUMN IF NOT EXISTS afp             TEXT,
  ADD COLUMN IF NOT EXISTS prevision       TEXT;

-- ==========================================================================
-- HISTORIAL DE VISITAS TÉCNICAS
-- Conservado: el dashboard y la disponibilidad todavía consultan estas reservas.
-- No se crean funciones para iniciar ni confirmar pagos con Mercado Pago.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.visit_reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_name TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  visit_date DATE NOT NULL,
  visit_time TIME NOT NULL,
  end_time TIME NOT NULL,
  amount INTEGER NOT NULL DEFAULT 5000 CHECK (amount = 5000),
  currency TEXT NOT NULL DEFAULT 'CLP' CHECK (currency = 'CLP'),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','cancelled','expired','payment_mismatch','needs_review')),
  mercado_pago_preference_id TEXT UNIQUE,
  mercado_pago_payment_id TEXT UNIQUE,
  mercado_pago_status TEXT,
  event_id UUID UNIQUE REFERENCES public.events(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- BEGIN COLUMN COMPAT
-- CREATE TABLE IF NOT EXISTS no actualiza tablas existentes.
ALTER TABLE public.visit_reservations
  ADD COLUMN IF NOT EXISTS service_name text NOT NULL,
  ADD COLUMN IF NOT EXISTS customer_name text NOT NULL,
  ADD COLUMN IF NOT EXISTS customer_email text NOT NULL,
  ADD COLUMN IF NOT EXISTS customer_phone text NOT NULL,
  ADD COLUMN IF NOT EXISTS visit_date date NOT NULL,
  ADD COLUMN IF NOT EXISTS visit_time time NOT NULL,
  ADD COLUMN IF NOT EXISTS end_time time NOT NULL,
  ADD COLUMN IF NOT EXISTS amount integer NOT NULL DEFAULT 5000 CHECK (amount = 5000),
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'CLP' CHECK (currency = 'CLP'),
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'expired', 'payment_mismatch', 'needs_review')),
  ADD COLUMN IF NOT EXISTS mercado_pago_preference_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS mercado_pago_payment_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS mercado_pago_status text,
  ADD COLUMN IF NOT EXISTS event_id uuid UNIQUE REFERENCES public.events (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz NOT NULL,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
-- END COLUMN COMPAT


CREATE INDEX IF NOT EXISTS idx_visit_reservations_date
  ON public.visit_reservations(visit_date, visit_time);
CREATE INDEX IF NOT EXISTS idx_visit_reservations_payment
  ON public.visit_reservations(mercado_pago_payment_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_visit_reservations_active_slot
  ON public.visit_reservations(visit_date, visit_time)
  WHERE status IN ('pending', 'approved');

ALTER TABLE public.visit_reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Dashboard users can read visit reservations" ON public.visit_reservations;
CREATE POLICY "Dashboard users can read visit reservations"
  ON public.visit_reservations FOR SELECT TO authenticated USING (true);

-- El calendario ya no acepta escrituras anónimas. El dashboard autenticado y
-- las funciones con service_role siguen operando normalmente.
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS blocks_bookings BOOLEAN NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "Allow all on events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users manage events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users read events" ON public.events;
CREATE POLICY "Authenticated users read events"
  ON public.events FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Owners create events" ON public.events;
CREATE POLICY "Owners create events"
  ON public.events FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
DROP POLICY IF EXISTS "Owners update events" ON public.events;
CREATE POLICY "Owners update events"
  ON public.events FOR UPDATE TO authenticated
  USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
DROP POLICY IF EXISTS "Owners delete events" ON public.events;
CREATE POLICY "Owners delete events"
  ON public.events FOR DELETE TO authenticated USING (created_by = auth.uid());

-- ============================================================================
-- REUNIONES INICIALES SIN COSTO
-- Comparten los mismos bloques del calendario y de las visitas técnicas.
-- La función usa el mismo bloqueo transaccional que la confirmación de pago para
-- impedir que dos personas confirmen simultáneamente el mismo horario.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.free_consultation_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  company TEXT,
  topic TEXT,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('confirmed', 'cancelled')),
  event_id UUID UNIQUE REFERENCES public.events(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- BEGIN COLUMN COMPAT
-- CREATE TABLE IF NOT EXISTS no actualiza tablas existentes.
ALTER TABLE public.free_consultation_bookings
  ADD COLUMN IF NOT EXISTS customer_name text NOT NULL,
  ADD COLUMN IF NOT EXISTS customer_email text NOT NULL,
  ADD COLUMN IF NOT EXISTS customer_phone text NOT NULL,
  ADD COLUMN IF NOT EXISTS company text,
  ADD COLUMN IF NOT EXISTS topic text,
  ADD COLUMN IF NOT EXISTS booking_date date NOT NULL,
  ADD COLUMN IF NOT EXISTS booking_time time NOT NULL,
  ADD COLUMN IF NOT EXISTS end_time time NOT NULL,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  ADD COLUMN IF NOT EXISTS event_id uuid UNIQUE REFERENCES public.events (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
-- END COLUMN COMPAT


CREATE INDEX IF NOT EXISTS idx_free_consultation_bookings_date
  ON public.free_consultation_bookings(booking_date, booking_time);
CREATE UNIQUE INDEX IF NOT EXISTS idx_free_consultation_active_slot
  ON public.free_consultation_bookings(booking_date, booking_time)
  WHERE status = 'confirmed';

ALTER TABLE public.free_consultation_bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Dashboard users can read free consultations" ON public.free_consultation_bookings;
CREATE POLICY "Dashboard users can read free consultations"
  ON public.free_consultation_bookings FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.book_free_consultation(
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_customer_phone TEXT,
  p_company TEXT,
  p_topic TEXT,
  p_booking_date DATE,
  p_booking_time TIME,
  p_end_time TIME
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  created_event_id UUID;
  created_booking_id UUID;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_booking_date::text));

  IF EXISTS (
    SELECT 1 FROM public.events
    WHERE event_date = p_booking_date
      AND start_time IS NOT NULL
      AND start_time < p_end_time
      AND COALESCE(end_time, start_time + INTERVAL '1 hour') > p_booking_time
  ) OR EXISTS (
    SELECT 1 FROM public.visit_reservations
    WHERE visit_date = p_booking_date
      AND visit_time < p_end_time
      AND end_time > p_booking_time
      AND (status = 'approved' OR (status = 'pending' AND expires_at > NOW()))
  ) THEN
    RETURN jsonb_build_object('ok', false, 'status', 'unavailable');
  END IF;

  INSERT INTO public.events (
    title, description, event_type, event_date, start_time, end_time
  ) VALUES (
    'Reunión inicial sin costo · ' || p_customer_name,
    'Agendada automáticamente desde solvenlabs.cl.' || E'\n' ||
    'Cliente: ' || p_customer_name || E'\n' ||
    'Correo: ' || p_customer_email || E'\n' ||
    'WhatsApp: ' || p_customer_phone || E'\n' ||
    CASE WHEN coalesce(p_company, '') <> '' THEN 'Empresa: ' || p_company || E'\n' ELSE '' END ||
    CASE WHEN coalesce(p_topic, '') <> '' THEN 'Tema: ' || p_topic ELSE '' END,
    'meeting', p_booking_date, p_booking_time, p_end_time
  ) RETURNING id INTO created_event_id;

  INSERT INTO public.free_consultation_bookings (
    customer_name, customer_email, customer_phone, company, topic,
    booking_date, booking_time, end_time, event_id
  ) VALUES (
    p_customer_name, p_customer_email, p_customer_phone, nullif(p_company, ''), nullif(p_topic, ''),
    p_booking_date, p_booking_time, p_end_time, created_event_id
  ) RETURNING id INTO created_booking_id;

  RETURN jsonb_build_object(
    'ok', true,
    'status', 'confirmed',
    'booking_id', created_booking_id,
    'event_id', created_event_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.book_free_consultation(TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TIME, TIME)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.book_free_consultation(TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TIME, TIME)
  TO service_role;

-- Inhabilita una fecha completa: cancela reservas vinculadas, elimina sus
-- eventos y los reemplaza por un único bloqueo de día completo.
CREATE OR REPLACE FUNCTION public.create_calendar_block(
  p_title TEXT,
  p_description TEXT,
  p_event_date DATE,
  p_start_time TIME,
  p_end_time TIME
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  created_event_id UUID;
  target_event_ids UUID[];
  deleted_events INTEGER := 0;
  cancelled_reservations INTEGER := 0;
  cancelled_consultations INTEGER := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Debes iniciar sesión para bloquear horarios.' USING ERRCODE = '42501';
  END IF;
  IF NOT public.is_dashboard_admin() THEN
    RAISE EXCEPTION 'Solo administración puede bloquear horarios.' USING ERRCODE = '42501';
  END IF;
  IF p_event_date IS NULL
     OR p_start_time IS NULL
     OR p_end_time IS NULL
     OR p_end_time <= p_start_time THEN
    RETURN jsonb_build_object('ok', false, 'status', 'invalid_interval');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(p_event_date::text));

  SELECT array_agg(id ORDER BY start_time NULLS FIRST, id)
  INTO target_event_ids
  FROM public.events
  WHERE event_date = p_event_date;

  IF target_event_ids IS NOT NULL AND cardinality(target_event_ids) > 0 THEN
    UPDATE public.visit_reservations
    SET status = 'cancelled',
        event_id = NULL,
        updated_at = NOW()
    WHERE event_id = ANY(target_event_ids);
    GET DIAGNOSTICS cancelled_reservations = ROW_COUNT;

    UPDATE public.free_consultation_bookings
    SET status = 'cancelled',
        event_id = NULL,
        updated_at = NOW()
    WHERE event_id = ANY(target_event_ids);
    GET DIAGNOSTICS cancelled_consultations = ROW_COUNT;

    DELETE FROM public.events
    WHERE id = ANY(target_event_ids);
    GET DIAGNOSTICS deleted_events = ROW_COUNT;
  END IF;

  INSERT INTO public.events (
    title, description, event_type, event_date, start_time, end_time,
    blocks_bookings, created_by
  ) VALUES (
    COALESCE(NULLIF(trim(p_title), ''), 'No disponible'),
    NULLIF(trim(p_description), ''),
    'other',
    p_event_date,
    p_start_time,
    p_end_time,
    true,
    auth.uid()
  ) RETURNING id INTO created_event_id;

  RETURN jsonb_build_object(
    'ok', true,
    'status', 'created',
    'event_id', created_event_id,
    'events_deleted', deleted_events,
    'reservations_cancelled', cancelled_reservations,
    'consultations_cancelled', cancelled_consultations
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_calendar_block(TEXT, TEXT, DATE, TIME, TIME) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_calendar_block(TEXT, TEXT, DATE, TIME, TIME) TO authenticated;

-- El dashboard elimina eventos mediante este RPC para mantener sincronizadas
-- las visitas pagadas. Cancelar la reserva libera el horario, pero no ejecuta
-- ningún reembolso en Mercado Pago.
CREATE OR REPLACE FUNCTION public.delete_calendar_event(p_event_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_event public.events%ROWTYPE;
  linked_reservation_id UUID;
  linked_consultation_id UUID;
  deleted_events INTEGER := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Debes iniciar sesión para eliminar eventos.'
      USING ERRCODE = '42501';
  END IF;

  SELECT * INTO target_event
  FROM public.events
  WHERE id = p_event_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'event_deleted', false);
  END IF;
  IF target_event.created_by IS DISTINCT FROM auth.uid()
     AND NOT (target_event.created_by IS NULL AND public.is_dashboard_admin()) THEN
    RAISE EXCEPTION 'Solo el organizador puede eliminar este evento.'
      USING ERRCODE = '42501';
  END IF;

  SELECT id
  INTO linked_reservation_id
  FROM public.visit_reservations
  WHERE event_id = p_event_id
  FOR UPDATE;

  IF linked_reservation_id IS NOT NULL THEN
    UPDATE public.visit_reservations
    SET status = 'cancelled',
        event_id = NULL,
        updated_at = NOW()
    WHERE id = linked_reservation_id;
  END IF;

  SELECT id
  INTO linked_consultation_id
  FROM public.free_consultation_bookings
  WHERE event_id = p_event_id
  FOR UPDATE;

  IF linked_consultation_id IS NOT NULL THEN
    UPDATE public.free_consultation_bookings
    SET status = 'cancelled',
        event_id = NULL,
        updated_at = NOW()
    WHERE id = linked_consultation_id;
  END IF;

  DELETE FROM public.events WHERE id = p_event_id;
  GET DIAGNOSTICS deleted_events = ROW_COUNT;

  RETURN jsonb_build_object(
    'ok', deleted_events = 1,
    'event_deleted', deleted_events = 1,
    'reservation_cancelled', linked_reservation_id IS NOT NULL,
    'reservation_id', linked_reservation_id,
    'consultation_cancelled', linked_consultation_id IS NOT NULL,
    'consultation_id', linked_consultation_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.delete_calendar_event(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_calendar_event(UUID) TO authenticated;

-- Elimina una serie recurrente completa de forma atómica. Las reservas
-- vinculadas se cancelan primero para liberar todos los horarios afectados.
CREATE OR REPLACE FUNCTION public.delete_calendar_event_series(p_recurrence_group_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_event_ids UUID[];
  deleted_events INTEGER := 0;
  cancelled_reservations INTEGER := 0;
  cancelled_consultations INTEGER := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Debes iniciar sesión para eliminar eventos.' USING ERRCODE = '42501';
  END IF;

  SELECT array_agg(id ORDER BY event_date, start_time)
  INTO target_event_ids
  FROM public.events
  WHERE recurrence_group_id = p_recurrence_group_id;

  IF target_event_ids IS NULL OR cardinality(target_event_ids) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'events_deleted', 0);
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.events
    WHERE id = ANY(target_event_ids)
      AND created_by IS DISTINCT FROM auth.uid()
      AND NOT (created_by IS NULL AND public.is_dashboard_admin())
  ) THEN
    RAISE EXCEPTION 'Solo el organizador puede eliminar esta serie.' USING ERRCODE = '42501';
  END IF;

  UPDATE public.visit_reservations
  SET status = 'cancelled', event_id = NULL, updated_at = NOW()
  WHERE event_id = ANY(target_event_ids);
  GET DIAGNOSTICS cancelled_reservations = ROW_COUNT;

  UPDATE public.free_consultation_bookings
  SET status = 'cancelled', event_id = NULL, updated_at = NOW()
  WHERE event_id = ANY(target_event_ids);
  GET DIAGNOSTICS cancelled_consultations = ROW_COUNT;

  DELETE FROM public.events WHERE id = ANY(target_event_ids);
  GET DIAGNOSTICS deleted_events = ROW_COUNT;

  RETURN jsonb_build_object(
    'ok', deleted_events > 0,
    'events_deleted', deleted_events,
    'reservations_cancelled', cancelled_reservations,
    'consultations_cancelled', cancelled_consultations
  );
END;
$$;

REVOKE ALL ON FUNCTION public.delete_calendar_event_series(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_calendar_event_series(UUID) TO authenticated;

-- ============================================================================
-- FILTRO DEL HISTORIAL DE ACTIVIDAD
-- ============================================================================
CREATE OR REPLACE FUNCTION public.discard_low_value_activity_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  normalized_description TEXT := lower(trim(COALESCE(NEW.description, '')));
BEGIN
  IF normalized_description = ''
     OR normalized_description ~
       '^(navegó|navego|visitó|visito|abrió|abrio|visualizó|visualizo|consultó|consulto)([[:space:]]|$)' THEN
    RETURN NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS filter_activity_log_noise_before_insert ON public.activity_log;
CREATE TRIGGER filter_activity_log_noise_before_insert
BEFORE INSERT ON public.activity_log
FOR EACH ROW
EXECUTE FUNCTION public.discard_low_value_activity_log();

-- Ficha de Levantamiento de Requerimientos.
CREATE OR REPLACE FUNCTION public.can_manage_requirements()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_dashboard_admin() OR EXISTS (
    SELECT 1 FROM public.profiles p JOIN public.dashboard_roles r ON r.slug = p.role
    WHERE p.id = auth.uid() AND 'requirements' = ANY(r.pages)
  );
$$;
REVOKE ALL ON FUNCTION public.can_manage_requirements() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_manage_requirements() TO authenticated;

CREATE TABLE IF NOT EXISTS public.requirement_intakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE RESTRICT,
  data JSONB NOT NULL CHECK (
    jsonb_typeof(data) = 'object'
    AND length(data::text) <= 3500000
    AND COALESCE(length(trim(data->>'project_name')) BETWEEN 1 AND 300, false)
    AND COALESCE(length(trim(data->>'client_name')) BETWEEN 1 AND 300, false)
    AND COALESCE(length(trim(data->>'version')) BETWEEN 1 AND 40, false)
    AND COALESCE(data->>'status' IN ('En levantamiento', 'En revisión', 'Validada'), false)
    AND COALESCE(jsonb_typeof(data->'features') = 'array', false)
    AND COALESCE(jsonb_typeof(data->'pending') = 'array', false)
  ),
  created_by UUID DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- BEGIN COLUMN COMPAT
-- CREATE TABLE IF NOT EXISTS no actualiza tablas existentes.
ALTER TABLE public.requirement_intakes
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects (id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object' AND length(CAST(data AS text)) <= 3500000 AND COALESCE(length(pg_catalog.btrim(data ->> 'project_name')) BETWEEN 1 AND 300, FALSE) AND COALESCE(length(pg_catalog.btrim(data ->> 'client_name')) BETWEEN 1 AND 300, FALSE) AND COALESCE(length(pg_catalog.btrim(data ->> 'version')) BETWEEN 1 AND 40, FALSE) AND COALESCE(data ->> 'status' IN ('En levantamiento', 'En revisión', 'Validada'), FALSE) AND COALESCE(jsonb_typeof(data -> 'features') = 'array', FALSE) AND COALESCE(jsonb_typeof(data -> 'pending') = 'array', FALSE)),
  ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
-- END COLUMN COMPAT

CREATE INDEX IF NOT EXISTS requirement_intakes_project_idx ON public.requirement_intakes(project_id, updated_at DESC);
ALTER TABLE public.requirement_intakes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS requirement_intakes_read ON public.requirement_intakes;
CREATE POLICY requirement_intakes_read ON public.requirement_intakes FOR SELECT TO authenticated USING (public.can_manage_requirements());
DROP POLICY IF EXISTS requirement_intakes_create ON public.requirement_intakes;
CREATE POLICY requirement_intakes_create ON public.requirement_intakes FOR INSERT TO authenticated WITH CHECK (public.can_manage_requirements());
DROP POLICY IF EXISTS requirement_intakes_update ON public.requirement_intakes;
CREATE POLICY requirement_intakes_update ON public.requirement_intakes FOR UPDATE TO authenticated USING (public.can_manage_requirements()) WITH CHECK (public.can_manage_requirements());
REVOKE ALL ON public.requirement_intakes FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.requirement_intakes TO authenticated;
CREATE OR REPLACE FUNCTION public.stamp_requirement_intake()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at := clock_timestamp();
  IF TG_OP = 'INSERT' THEN
    NEW.created_by := auth.uid();
  ELSE
    NEW.created_by := OLD.created_by;
    NEW.created_at := OLD.created_at;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS stamp_requirement_intake ON public.requirement_intakes;
CREATE TRIGGER stamp_requirement_intake BEFORE INSERT OR UPDATE ON public.requirement_intakes
FOR EACH ROW EXECUTE FUNCTION public.stamp_requirement_intake();
UPDATE public.dashboard_roles SET pages = array_append(pages, 'requirements')
WHERE slug IN ('administracion', 'admin', 'administrator', 'administrador') AND NOT ('requirements' = ANY(pages));

-- ========== DEPENDENCIAS ACTIVAS DEL DASHBOARD ==========
CREATE TABLE IF NOT EXISTS public.order_subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  title TEXT NOT NULL, completed BOOLEAN NOT NULL DEFAULT false,
  due_date DATE, sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- BEGIN COLUMN COMPAT
-- CREATE TABLE IF NOT EXISTS no actualiza tablas existentes.
ALTER TABLE public.order_subtasks
  ADD COLUMN IF NOT EXISTS order_id uuid NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS title text NOT NULL,
  ADD COLUMN IF NOT EXISTS completed boolean NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
-- END COLUMN COMPAT

CREATE INDEX IF NOT EXISTS idx_order_subtasks_order ON public.order_subtasks(order_id, sort_order);
ALTER TABLE public.order_subtasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Dashboard manages order subtasks" ON public.order_subtasks;
CREATE POLICY "Dashboard manages order subtasks" ON public.order_subtasks
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
GRANT ALL ON public.order_subtasks TO authenticated, service_role;

-- Correo: necesario también para seleccionar el remitente de las invitaciones.
-- La entrega de correo requiere el servicio externo configurado por la aplicación.
CREATE TABLE IF NOT EXISTS public.mailboxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  address TEXT NOT NULL UNIQUE, display_name TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- BEGIN COLUMN COMPAT
-- CREATE TABLE IF NOT EXISTS no actualiza tablas existentes.
ALTER TABLE public.mailboxes
  ADD COLUMN IF NOT EXISTS owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS address text NOT NULL UNIQUE,
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
-- END COLUMN COMPAT

CREATE TABLE IF NOT EXISTS public.mail_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mailbox_id UUID NOT NULL REFERENCES public.mailboxes(id) ON DELETE CASCADE,
  message_id TEXT, from_address TEXT, from_name TEXT,
  reply_to_address TEXT, reply_to_name TEXT, to_address TEXT,
  to_addresses JSONB DEFAULT '[]'::jsonb, cc_addresses JSONB DEFAULT '[]'::jsonb,
  bcc_addresses JSONB DEFAULT '[]'::jsonb,
  subject TEXT, body_text TEXT, body_html TEXT, headers JSONB DEFAULT '{}'::jsonb,
  received_at TIMESTAMPTZ DEFAULT now(), sent_at TIMESTAMPTZ,
  is_read BOOLEAN NOT NULL DEFAULT false, read_at TIMESTAMPTZ,
  direction TEXT NOT NULL DEFAULT 'inbound', delivery_status TEXT,
  in_reply_to TEXT, message_references JSONB DEFAULT '[]'::jsonb
);
-- BEGIN COLUMN COMPAT
-- CREATE TABLE IF NOT EXISTS no actualiza tablas existentes.
ALTER TABLE public.mail_messages
  ADD COLUMN IF NOT EXISTS mailbox_id uuid NOT NULL REFERENCES public.mailboxes (id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS message_id text,
  ADD COLUMN IF NOT EXISTS from_address text,
  ADD COLUMN IF NOT EXISTS from_name text,
  ADD COLUMN IF NOT EXISTS reply_to_address text,
  ADD COLUMN IF NOT EXISTS reply_to_name text,
  ADD COLUMN IF NOT EXISTS to_address text,
  ADD COLUMN IF NOT EXISTS to_addresses jsonb DEFAULT CAST('[]' AS jsonb),
  ADD COLUMN IF NOT EXISTS cc_addresses jsonb DEFAULT CAST('[]' AS jsonb),
  ADD COLUMN IF NOT EXISTS bcc_addresses jsonb DEFAULT CAST('[]' AS jsonb),
  ADD COLUMN IF NOT EXISTS subject text,
  ADD COLUMN IF NOT EXISTS body_text text,
  ADD COLUMN IF NOT EXISTS body_html text,
  ADD COLUMN IF NOT EXISTS headers jsonb DEFAULT CAST('{}' AS jsonb),
  ADD COLUMN IF NOT EXISTS received_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_read boolean NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS read_at timestamptz,
  ADD COLUMN IF NOT EXISTS direction text NOT NULL DEFAULT 'inbound',
  ADD COLUMN IF NOT EXISTS delivery_status text,
  ADD COLUMN IF NOT EXISTS in_reply_to text,
  ADD COLUMN IF NOT EXISTS message_references jsonb DEFAULT CAST('[]' AS jsonb);
-- END COLUMN COMPAT

CREATE INDEX IF NOT EXISTS idx_mail_messages_mailbox_received ON public.mail_messages(mailbox_id, received_at DESC);
ALTER TABLE public.mailboxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mail_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners read mailboxes" ON public.mailboxes;
CREATE POLICY "Owners read mailboxes" ON public.mailboxes FOR SELECT TO authenticated
  USING (owner_id = auth.uid());
DROP POLICY IF EXISTS "Owners read mail" ON public.mail_messages;
CREATE POLICY "Owners read mail" ON public.mail_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mailboxes m WHERE m.id = mailbox_id AND m.owner_id = auth.uid()));
DROP POLICY IF EXISTS "Owners delete mail" ON public.mail_messages;
CREATE POLICY "Owners delete mail" ON public.mail_messages FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mailboxes m WHERE m.id = mailbox_id AND m.owner_id = auth.uid()));
GRANT SELECT ON public.mailboxes TO authenticated;
GRANT SELECT, DELETE ON public.mail_messages TO authenticated;
GRANT ALL ON public.mailboxes, public.mail_messages TO service_role;

-- Gestión manual de reservas usada por la pantalla Reservas.
-- No inicia cobros ni verifica pagos; solo administradores pueden confirmar.
CREATE OR REPLACE FUNCTION public.manage_public_booking(
  p_source TEXT, p_booking_id UUID, p_action TEXT,
  p_date DATE DEFAULT NULL, p_start_time TIME DEFAULT NULL, p_end_time TIME DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  target_table TEXT;
  date_column TEXT;
  time_column TEXT;
  confirmed_status TEXT;
  booking JSONB;
  event_id_value UUID;
  booking_date DATE;
  booking_start TIME;
  booking_end TIME;
  lock_date DATE;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_dashboard_admin() THEN
    RAISE EXCEPTION 'Solo administración puede gestionar reservas.' USING ERRCODE = '42501';
  END IF;
  IF p_source NOT IN ('visit', 'consultation') OR p_action NOT IN ('confirm', 'reschedule', 'cancel', 'delete')
     OR p_source IS NULL OR p_action IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'status', 'invalid_action');
  END IF;
  target_table := CASE p_source WHEN 'visit' THEN 'visit_reservations' ELSE 'free_consultation_bookings' END;
  date_column := CASE p_source WHEN 'visit' THEN 'visit_date' ELSE 'booking_date' END;
  time_column := CASE p_source WHEN 'visit' THEN 'visit_time' ELSE 'booking_time' END;
  confirmed_status := CASE p_source WHEN 'visit' THEN 'approved' ELSE 'confirmed' END;
  EXECUTE format('SELECT to_jsonb(b) FROM public.%I b WHERE id = $1', target_table) INTO booking USING p_booking_id;
  IF booking IS NULL THEN RETURN jsonb_build_object('ok', false, 'status', 'not_found'); END IF;
  -- Same date locks used by public booking; acquire both dates in a stable order.
  FOR lock_date IN SELECT DISTINCT d FROM unnest(ARRAY[(booking->>date_column)::DATE, p_date]) d WHERE d IS NOT NULL ORDER BY d LOOP
    PERFORM pg_advisory_xact_lock(hashtext(lock_date::TEXT));
  END LOOP;
  EXECUTE format('SELECT to_jsonb(b) FROM public.%I b WHERE id = $1 FOR UPDATE', target_table) INTO booking USING p_booking_id;
  IF booking IS NULL THEN RETURN jsonb_build_object('ok', false, 'status', 'not_found'); END IF;
  event_id_value := (booking->>'event_id')::UUID;
  IF p_action IN ('cancel', 'delete') THEN
    EXECUTE format('UPDATE public.%I SET status = $2, event_id = NULL, updated_at = now() WHERE id = $1', target_table)
      USING p_booking_id, 'cancelled';
    DELETE FROM public.events WHERE id = event_id_value;
    IF p_action = 'delete' THEN EXECUTE format('DELETE FROM public.%I WHERE id = $1', target_table) USING p_booking_id; END IF;
    RETURN jsonb_build_object('ok', true);
  END IF;
  booking_date := CASE WHEN p_action = 'reschedule' THEN p_date ELSE (booking->>date_column)::DATE END;
  booking_start := CASE WHEN p_action = 'reschedule' THEN p_start_time ELSE (booking->>time_column)::TIME END;
  booking_end := CASE WHEN p_action = 'reschedule' THEN p_end_time ELSE (booking->>'end_time')::TIME END;
  IF booking_date IS NULL OR booking_start IS NULL OR booking_end IS NULL OR booking_end <= booking_start THEN
    RETURN jsonb_build_object('ok', false, 'status', 'invalid_interval');
  END IF;
  IF EXISTS (SELECT 1 FROM public.events e WHERE e.event_date = booking_date
      AND e.id IS DISTINCT FROM event_id_value
      AND e.start_time < booking_end AND COALESCE(e.end_time, e.start_time + INTERVAL '1 hour') > booking_start)
    OR EXISTS (SELECT 1 FROM public.visit_reservations r WHERE r.visit_date = booking_date
      AND NOT (p_source = 'visit' AND r.id = p_booking_id)
      AND r.visit_time < booking_end AND r.end_time > booking_start
      AND (r.status = 'approved' OR (r.status = 'pending' AND r.expires_at > now()))) THEN
    RETURN jsonb_build_object('ok', false, 'status', 'unavailable');
  END IF;
  IF event_id_value IS NULL THEN
    INSERT INTO public.events(title, description, event_date, start_time, end_time)
    VALUES ('Reserva · ' || (booking->>'customer_name'), booking->>'customer_email', booking_date, booking_start, booking_end)
    RETURNING id INTO event_id_value;
  ELSE
    UPDATE public.events SET event_date = booking_date, start_time = booking_start, end_time = booking_end WHERE id = event_id_value;
  END IF;
  EXECUTE format('UPDATE public.%I SET %I = $2, %I = $3, end_time = $4, status = $5, event_id = $6, updated_at = now() WHERE id = $1', target_table, date_column, time_column)
    USING p_booking_id, booking_date, booking_start, booking_end, confirmed_status, event_id_value;
  RETURN jsonb_build_object('ok', true, 'event_id', event_id_value);
END;
$$;
REVOKE ALL ON FUNCTION public.manage_public_booking(TEXT, UUID, TEXT, DATE, TIME, TIME) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.manage_public_booking(TEXT, UUID, TEXT, DATE, TIME, TIME) TO authenticated;

-- ========== VISTAS (tras completar las columnas) ==========
-- Reparar relaciones de lecturas anidadas aunque la columna ya existiera.
-- NOT VALID conserva filas antiguas huérfanas para revisión; las nuevas escrituras
-- sí respetan la relación. No se eliminan ni inventan registros relacionados.
DO $relationships$
DECLARE r RECORD; source_att SMALLINT; target_att SMALLINT;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('projects', 'client_id', 'clients', 'SET NULL'),
    ('tasks', 'project_id', 'projects', 'SET NULL'),
    ('orders', 'project_id', 'projects', 'SET NULL'),
    ('orders', 'assigned_to', 'team_members', 'SET NULL'),
    ('facturacion_items', 'project_id', 'projects', 'SET NULL'),
    ('project_members', 'team_member_id', 'team_members', 'CASCADE'),
    ('project_members', 'project_id', 'projects', 'CASCADE'),
    ('documents', 'uploaded_by', 'profiles', 'SET NULL'),
    ('documents', 'project_id', 'projects', 'SET NULL'),
    ('event_attendees', 'event_id', 'events', 'CASCADE')
  ) AS relationships(source_table, source_column, target_table, delete_action)
  LOOP
    SELECT attnum INTO source_att FROM pg_attribute
      WHERE attrelid = to_regclass('public.' || r.source_table) AND attname = r.source_column AND NOT attisdropped;
    SELECT attnum INTO target_att FROM pg_attribute
      WHERE attrelid = to_regclass('public.' || r.target_table) AND attname = 'id' AND NOT attisdropped;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE contype = 'f'
      AND conrelid = to_regclass('public.' || r.source_table)
      AND confrelid = to_regclass('public.' || r.target_table)
      AND conkey = ARRAY[source_att] AND confkey = ARRAY[target_att]) THEN
      EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.%I(id) ON DELETE %s NOT VALID',
        r.source_table, r.source_table || '_' || r.source_column || '_dashboard_fkey',
        r.source_column, r.target_table, r.delete_action);
    END IF;
  END LOOP;
END;
$relationships$;

CREATE OR REPLACE VIEW dashboard_kpis AS
SELECT
  (SELECT COUNT(*) FROM projects WHERE status = 'in_development') AS active_projects,
  (SELECT COALESCE(SUM(amount), 0) FROM invoices
    WHERE status IN ('paid', 'pending')
    AND EXTRACT(MONTH FROM issued_at) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(YEAR FROM issued_at) = EXTRACT(YEAR FROM CURRENT_DATE)
  ) AS monthly_billing,
  (SELECT COUNT(*) FROM clients WHERE status = 'active') AS active_clients,
  (SELECT COUNT(*) FROM tasks WHERE completed = true) AS completed_tasks,
  (SELECT COUNT(*) FROM tasks) AS total_tasks;

CREATE OR REPLACE VIEW invoices_with_client AS
SELECT
  i.*,
  c.name AS client_name,
  c.company AS client_company,
  p.name AS project_name
FROM invoices i
LEFT JOIN clients c ON i.client_id = c.id
LEFT JOIN projects p ON i.project_id = p.id
ORDER BY i.created_at DESC;

CREATE OR REPLACE VIEW projects_with_details AS
SELECT
  p.id, p.name, p.client_id, p.status, p.progress, p.description,
  p.technologies, p.logo_url, p.start_date, p.estimated_end_date,
  p.domain_status, p.frontend_status, p.backend_status,
  p.supabase_database_status, p.supabase_auth_status, p.supabase_storage_status,
  p.ssl_status, p.health_check_url, p.actual_end_date, p.budget,
  p.created_at, p.updated_at,
  COALESCE(c.name, p.client_name) AS client_name,
  c.company AS client_company,
  (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) AS member_count,
  p.client_token, p.client_visible, p.client_notes
FROM projects p
LEFT JOIN clients c ON p.client_id = c.id
ORDER BY p.created_at DESC;

CREATE OR REPLACE VIEW documents_with_uploader AS
SELECT
  d.*,
  pr.full_name AS uploader_name,
  p.name AS project_name
FROM documents d
LEFT JOIN profiles pr ON d.uploaded_by = pr.id
LEFT JOIN projects p ON d.project_id = p.id
ORDER BY d.created_at DESC;

CREATE OR REPLACE VIEW client_project_view AS
SELECT
  p.id,
  p.client_token,
  p.name,
  p.description,
  p.status,
  p.progress,
  p.technologies,
  p.start_date,
  p.estimated_end_date,
  p.client_notes,
  p.client_visible,
  c.company AS client_company,
  COALESCE(c.name, p.client_name) AS client_name,
  (
    SELECT json_agg(u ORDER BY u.created_at DESC)
    FROM (
      SELECT id, title, description, type, created_at
      FROM project_updates pu
      WHERE pu.project_id = p.id AND pu.visible_to_client = true
      ORDER BY pu.created_at DESC
    ) u
  ) AS updates
FROM projects p
LEFT JOIN clients c ON p.client_id = c.id
WHERE p.client_visible = true;

NOTIFY pgrst, 'reload schema';
COMMIT;
