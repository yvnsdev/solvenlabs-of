-- ==========================================================================
-- Solven Labs Dashboard — Supabase Database Schema
-- Ejecutar en Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ==========================================================================
-- NOTA: RLS desactivado por ahora. Activar en producción.
-- ==========================================================================

-- ========== EXTENSIONES ==========
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========== ENUM TYPES ==========
CREATE TYPE client_status AS ENUM ('active', 'inactive', 'prospect');
CREATE TYPE client_relationship AS ENUM ('owner', 'manager', 'legal_rep', 'collaborator', 'other');
CREATE TYPE project_status AS ENUM ('proposal', 'in_development', 'review', 'completed', 'paused');
CREATE TYPE invoice_status AS ENUM ('draft', 'pending', 'paid', 'overdue', 'cancelled');
CREATE TYPE order_status AS ENUM ('pending', 'in_progress', 'review', 'done');
CREATE TYPE order_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE event_type AS ENUM ('meeting', 'deadline', 'demo', 'kickoff', 'other');
CREATE TYPE activity_type AS ENUM ('project', 'invoice', 'client', 'document', 'deploy', 'general', 'task', 'order', 'team', 'provider');
CREATE TYPE team_availability AS ENUM ('available', 'busy', 'away', 'offline');
CREATE TYPE doc_folder AS ENUM ('contratos', 'propuestas', 'diseños', 'entregables', 'facturas', 'legal', 'otros');
CREATE TYPE expense_category AS ENUM ('salarios', 'alquiler', 'servicios', 'software', 'hardware', 'viajes', 'marketing', 'legal', 'otro');
CREATE TYPE expense_status AS ENUM ('draft', 'submitted', 'approved', 'rejected', 'paid');

-- ========== PROFILES ==========
-- Extiende auth.users de Supabase
CREATE TABLE profiles (
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

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- RLS desactivado: permitir todo
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

CREATE TABLE dashboard_roles (
  slug TEXT PRIMARY KEY CHECK (slug ~ '^[a-z0-9_]+$'),
  name TEXT NOT NULL,
  description TEXT,
  pages TEXT[] NOT NULL DEFAULT '{}',
  buttons TEXT[] NOT NULL DEFAULT '{}',
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE dashboard_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on dashboard_roles" ON dashboard_roles FOR ALL USING (true) WITH CHECK (true);

-- ========== PRÁCTICAS Y BITÁCORA ==========
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

CREATE TABLE IF NOT EXISTS internship_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  institution TEXT,
  program TEXT,
  supervisor_name TEXT,
  start_date DATE,
  end_date DATE,
  weekly_hours_goal NUMERIC(5,1) NOT NULL DEFAULT 20 CHECK (weekly_hours_goal > 0 AND weekly_hours_goal <= 60),
  total_hours_goal NUMERIC(6,1) CHECK (total_hours_goal IS NULL OR (total_hours_goal > 0 AND total_hours_goal <= 5000)),
  objectives TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS internship_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  hours NUMERIC(5,2) NOT NULL CHECK (hours > 0 AND hours <= 16),
  activity TEXT NOT NULL CHECK (length(trim(activity)) > 0),
  learning TEXT,
  evidence_url TEXT,
  status TEXT NOT NULL DEFAULT 'ingresado' CHECK (status IN ('ingresado', 'autorizado', 'validado', 'rechazado')),
  review_note TEXT,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_internship_logs_profile_date ON internship_logs(profile_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_internship_logs_pending ON internship_logs(status, log_date DESC) WHERE deleted_at IS NULL;

-- Mantiene el historial incluso si el rol del usuario cambia en el futuro.
CREATE OR REPLACE FUNCTION public.ensure_internship_profile_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF lower(NEW.role) = 'practicante' THEN
    INSERT INTO public.internship_profiles (profile_id, status)
    VALUES (NEW.id, 'active')
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_internship_profile_history_trigger ON profiles;
CREATE TRIGGER ensure_internship_profile_history_trigger
AFTER INSERT OR UPDATE OF role ON profiles
FOR EACH ROW EXECUTE FUNCTION public.ensure_internship_profile_history();

INSERT INTO internship_profiles (profile_id, status)
SELECT id, 'active' FROM profiles WHERE lower(role) = 'practicante'
ON CONFLICT (profile_id) DO NOTHING;

ALTER TABLE internship_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE internship_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage internship profiles" ON internship_profiles;
CREATE POLICY "Admins manage internship profiles" ON internship_profiles FOR ALL
  USING (public.is_dashboard_admin()) WITH CHECK (public.is_dashboard_admin());
DROP POLICY IF EXISTS "Practitioners view own internship profile" ON internship_profiles;
CREATE POLICY "Practitioners view own internship profile" ON internship_profiles FOR SELECT
  USING (profile_id = auth.uid());
DROP POLICY IF EXISTS "Practitioners create own internship profile" ON internship_profiles;
CREATE POLICY "Practitioners create own internship profile" ON internship_profiles FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid() AND updated_by = auth.uid());
DROP POLICY IF EXISTS "Practitioners update own internship profile" ON internship_profiles;
CREATE POLICY "Practitioners update own internship profile" ON internship_profiles FOR UPDATE TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid() AND updated_by = auth.uid());

DROP POLICY IF EXISTS "Admins manage internship logs" ON internship_logs;
CREATE POLICY "Admins manage internship logs" ON internship_logs FOR ALL
  USING (public.is_dashboard_admin()) WITH CHECK (public.is_dashboard_admin());
DROP POLICY IF EXISTS "Practitioners view own internship logs" ON internship_logs;
CREATE POLICY "Practitioners view own internship logs" ON internship_logs FOR SELECT
  USING (profile_id = auth.uid() AND deleted_at IS NULL);
DROP POLICY IF EXISTS "Practitioners create own internship logs" ON internship_logs;
CREATE POLICY "Practitioners create own internship logs" ON internship_logs FOR INSERT
  WITH CHECK (
    profile_id = auth.uid() AND status = 'ingresado'
    AND reviewed_by IS NULL AND reviewed_at IS NULL
    AND deleted_at IS NULL AND deleted_by IS NULL
  );
DROP POLICY IF EXISTS "Practitioners update own entered logs" ON internship_logs;
CREATE POLICY "Practitioners update own entered logs" ON internship_logs FOR UPDATE
  USING (profile_id = auth.uid() AND status = 'ingresado' AND deleted_at IS NULL)
  WITH CHECK (
    profile_id = auth.uid() AND status = 'ingresado'
    AND reviewed_by IS NULL AND reviewed_at IS NULL
    AND deleted_at IS NULL AND deleted_by IS NULL
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON internship_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON internship_logs TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_dashboard_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_internship_profile_history() TO authenticated;

CREATE TABLE IF NOT EXISTS site_content (
  section TEXT PRIMARY KEY CHECK (section IN ('pricing', 'cases', 'contact')),
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on site_content" ON site_content;
CREATE POLICY "Allow all on site_content" ON site_content FOR ALL USING (true) WITH CHECK (true);

DELETE FROM site_content WHERE section IN ('events', 'countdowns', 'popups');
ALTER TABLE site_content DROP CONSTRAINT IF EXISTS site_content_section_check;
ALTER TABLE site_content ADD CONSTRAINT site_content_section_check
  CHECK (section IN ('pricing', 'cases', 'contact'));

DROP TABLE IF EXISTS public.site_event_registrations;

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
    ARRAY['overview','projects','tasks','messages','relations','quotes','contracts','calendar','orders','service-orders','sii','receipts','maintenance','analytics','reports','practices','practitioner-profile','team','settings'],
    ARRAY['btn-export-report','btn-export-relations','btn-add-client','btn-add-provider','btn-add-project','btn-add-task','btn-add-order','btn-add-service-order','btn-add-event','btn-site-refresh-messages','btn-add-mp-subscription','dashboard-receipt-print','btn-export-cotizaciones','btn-nueva-cotizacion','btn-export-payments','btn-add-payment','btn-add-contrato-pers','btn-add-anexo','btn-add-finiquito','btn-export-expenses','btn-add-expense','btn-export-presii','btn-nueva-presii','btn-export-sii','btn-sii-factura-venta','btn-sii-factura-compra','btn-sii-honorarios','btn-sii-gasto','btn-sii-ingreso','btn-export-f29','btn-export-f22','btn-add-practice-log'],
    true
  ),
  (
    'contabilidad',
    'Contabilidad',
    'Acceso centrado en finanzas, impuestos, reportes y analíticas.',
    ARRAY['sii','receipts','quotes','maintenance','analytics','reports','settings'],
    ARRAY['btn-export-presii','btn-add-mp-subscription'],
    true
  ),
  (
    'team',
    'Miembro',
    'Acceso operativo a proyectos, tareas, relaciones, tickets y calendario.',
    ARRAY['overview','projects','tasks','messages','sii','receipts','relations','calendar','orders','service-orders','settings'],
    ARRAY['btn-add-project','btn-add-service-order'],
    true
  ),
  (
    'practicante',
    'Practicante',
    'Acceso exclusivo a su bitácora y perfil de práctica.',
    ARRAY['practices','practitioner-profile','calendar'],
    ARRAY['btn-add-practice-log'],
    true
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  pages = EXCLUDED.pages,
  buttons = EXCLUDED.buttons,
  is_system = EXCLUDED.is_system,
  updated_at = NOW();

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

-- ==========================================================================
-- Solven Labs Academy — Tests de cursos
-- ==========================================================================
-- Estas tablas complementan la intranet educativa. Se mantienen sin FK dura a
-- cursos/tareas para ser compatibles con instalaciones donde esas tablas ya
-- existen con ids bigint.

CREATE TABLE IF NOT EXISTS tests (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  curso_id BIGINT NOT NULL,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  fecha_limite TIMESTAMPTZ NOT NULL,
  puntaje_total NUMERIC(6,2) NOT NULL DEFAULT 7 CHECK (puntaje_total > 0),
  preguntas JSONB NOT NULL DEFAULT '[]'::jsonb,
  estado TEXT NOT NULL DEFAULT 'publicado' CHECK (estado IN ('borrador', 'publicado', 'archivado')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_actualizacion TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS test_intentos (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  test_id BIGINT NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  curso_id BIGINT NOT NULL,
  estudiante_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  respuestas JSONB NOT NULL DEFAULT '[]'::jsonb,
  puntaje_obtenido NUMERIC(6,2) NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'enviado' CHECK (estado IN ('enviado', 'corregido')),
  fecha_envio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_correccion TIMESTAMPTZ,
  corregido_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (test_id, estudiante_id)
);

CREATE INDEX IF NOT EXISTS idx_tests_curso_id ON tests(curso_id);
CREATE INDEX IF NOT EXISTS idx_test_intentos_test_id ON test_intentos(test_id);
CREATE INDEX IF NOT EXISTS idx_test_intentos_curso_id ON test_intentos(curso_id);
CREATE INDEX IF NOT EXISTS idx_test_intentos_estudiante_id ON test_intentos(estudiante_id);

ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_intentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on tests" ON tests;
CREATE POLICY "Allow all on tests" ON tests FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on test_intentos" ON test_intentos;
CREATE POLICY "Allow all on test_intentos" ON test_intentos FOR ALL USING (true) WITH CHECK (true);

-- Trigger para crear profile automáticamente al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ========== TEAM MEMBERS ==========
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role_title TEXT NOT NULL,
  avatar_url TEXT,
  availability team_availability NOT NULL DEFAULT 'available',
  weekly_hours NUMERIC(5,1) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on team_members" ON team_members;
CREATE POLICY "Anyone can view team members"
ON team_members FOR SELECT
USING (true);
DROP POLICY IF EXISTS "Admins manage team members" ON team_members;
CREATE POLICY "Admins create team members"
ON team_members FOR INSERT TO authenticated
WITH CHECK (public.is_dashboard_admin());
CREATE POLICY "Admins update team members"
ON team_members FOR UPDATE TO authenticated
USING (public.is_dashboard_admin())
WITH CHECK (public.is_dashboard_admin());

-- ========== CLIENTS ==========
CREATE TABLE clients (
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

CREATE TABLE providers (
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
  total_billed BIGINT NOT NULL DEFAULT 0, -- en CLP
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on clients" ON clients FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on providers" ON providers FOR ALL USING (true) WITH CHECK (true);

-- ========== PROJECTS =============
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
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

-- Compatibilidad con instalaciones existentes creadas antes del monitoreo.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS health_check_url TEXT;

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on projects" ON projects FOR ALL USING (true) WITH CHECK (true);

-- Relación muchos-a-muchos: proyectos ↔ team_members
CREATE TABLE project_members (
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'developer',
  PRIMARY KEY (project_id, team_member_id)
);

ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on project_members" ON project_members FOR ALL USING (true) WITH CHECK (true);

-- ========== KPI PÚBLICOS DEL SITIO ==========
-- La web consume solo este resumen agregado. Ningún nombre, correo ni detalle
-- de clientes, integrantes o proyectos forma parte de la respuesta pública.
CREATE TABLE IF NOT EXISTS public_site_kpi_settings (
  singleton BOOLEAN PRIMARY KEY DEFAULT true CHECK (singleton),
  founded_year SMALLINT NOT NULL CHECK (founded_year BETWEEN 1900 AND 2100),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public_site_kpi_settings (singleton, founded_year)
VALUES (true, 2024)
ON CONFLICT (singleton) DO NOTHING;

ALTER TABLE public_site_kpi_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage public site KPI settings" ON public_site_kpi_settings;
CREATE POLICY "Admins manage public site KPI settings"
ON public_site_kpi_settings FOR ALL TO authenticated
USING (public.is_dashboard_admin())
WITH CHECK (public.is_dashboard_admin());

REVOKE ALL ON TABLE public.public_site_kpi_settings FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.public_site_kpi_settings TO authenticated;
GRANT ALL ON TABLE public.public_site_kpi_settings TO service_role;

CREATE OR REPLACE FUNCTION public.get_public_site_kpis()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT jsonb_build_object(
    'founded_year', COALESCE(
      (SELECT founded_year FROM public.public_site_kpi_settings WHERE singleton = true),
      2024
    ),
    'specialists', (
      SELECT COUNT(*) FROM public.profiles
      WHERE lower(trim(role)) IN ('administracion', 'admin', 'administrator', 'administrador')
    ),
    'organizations', (
      SELECT COUNT(DISTINCT lower(trim(company)))
      FROM public.clients
      WHERE status IN ('active', 'inactive')
        AND NULLIF(trim(company), '') IS NOT NULL
    ),
    'completed_projects', (
      SELECT COUNT(*) FROM public.projects WHERE status = 'completed'
    )
  );
$$;

REVOKE ALL ON FUNCTION public.get_public_site_kpis() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_site_kpis() TO anon, authenticated, service_role;

-- ========== INVOICES ==========
CREATE TABLE invoices (
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

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on invoices" ON invoices FOR ALL USING (true) WITH CHECK (true);

-- ========== FACTURACIÓN ==========
CREATE TABLE facturacion_items (
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

ALTER TABLE facturacion_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on facturacion_items" ON facturacion_items FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_facturacion_items_project ON public.facturacion_items(project_id);
CREATE INDEX IF NOT EXISTS idx_facturacion_items_status ON public.facturacion_items(status);

-- Items de factura (líneas de detalle)
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price BIGINT NOT NULL DEFAULT 0,
  total BIGINT NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on invoice_items" ON invoice_items FOR ALL USING (true) WITH CHECK (true);

-- ========== FACTURAS PRE-SII ==========
-- Datos adicionales de contacto para cotizaciones. La migración es
-- idempotente para no alterar instalaciones que ya tengan estos campos.
ALTER TABLE IF EXISTS public.cotizaciones
  ADD COLUMN IF NOT EXISTS contacto_proveedor_nombre TEXT,
  ADD COLUMN IF NOT EXISTS contacto_proveedor_telefono TEXT,
  ADD COLUMN IF NOT EXISTS contacto_proveedor_cargo TEXT;

CREATE TABLE facturas_presii (
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

ALTER TABLE facturas_presii ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on facturas_presii" ON facturas_presii FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_facturas_presii_rut ON public.facturas_presii USING btree (rut_receptor);
CREATE INDEX IF NOT EXISTS idx_facturas_presii_estado ON public.facturas_presii USING btree (estado);
CREATE INDEX IF NOT EXISTS idx_facturas_presii_project ON public.facturas_presii USING btree (project_id);

-- ========== PAGOS (Honorarios / Contratos) ==========
CREATE TABLE pagos (
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pagos ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pendiente';
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS operacion TEXT NOT NULL DEFAULT 'compra';

ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on pagos" ON pagos FOR ALL USING (true) WITH CHECK (true);

-- ========== ORDERS (Kanban) ==========
CREATE TABLE orders (
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

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on orders" ON orders FOR ALL USING (true) WITH CHECK (true);

-- ========== SERVICE ORDERS (Servicio técnico) ==========
CREATE TABLE IF NOT EXISTS service_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  folio TEXT NOT NULL UNIQUE,
  service_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'diagnosis', 'in_progress', 'ready', 'delivered', 'cancelled')),
  provider_rut_name TEXT,
  technician_name TEXT NOT NULL,
  technician_contact TEXT,
  client_name TEXT NOT NULL,
  client_rut TEXT,
  client_phone TEXT,
  service_address TEXT,
  service_at_home BOOLEAN NOT NULL DEFAULT false,
  equipment_received BOOLEAN NOT NULL DEFAULT false,
  diagnosis_only BOOLEAN NOT NULL DEFAULT false,
  equipment_type TEXT NOT NULL,
  brand_model TEXT,
  serial_number TEXT,
  access_password TEXT,
  reported_failure TEXT NOT NULL,
  diagnosis_work TEXT,
  parts_observations TEXT,
  labor_detail TEXT,
  labor_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (labor_amount >= 0),
  materials_detail TEXT,
  materials_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (materials_amount >= 0),
  travel_detail TEXT,
  travel_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (travel_amount >= 0),
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  payment_method TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_method IN ('cash', 'transfer', 'card', 'pending')),
  document_number TEXT,
  technician_signature_name TEXT,
  client_signature_name TEXT,
  client_conformity BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_orders_date ON service_orders(service_date DESC);
CREATE INDEX IF NOT EXISTS idx_service_orders_status ON service_orders(status);
CREATE INDEX IF NOT EXISTS idx_service_orders_client ON service_orders(client_name);

ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on service_orders" ON service_orders FOR ALL USING (true) WITH CHECK (true);

-- ========== TASKS ==========
CREATE TABLE tasks (
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

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);

-- ========== DOCUMENTS ==========
CREATE TABLE documents (
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

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on documents" ON documents FOR ALL USING (true) WITH CHECK (true);

-- ========== EXPENSES (Gastos Operacionales) ==========
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
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

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);

-- Índices para expenses
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses USING btree (date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses USING btree (category);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses USING btree (status);
CREATE INDEX IF NOT EXISTS idx_expenses_project_id ON expenses USING btree (project_id);

-- ========== CALENDAR EVENTS ==========
CREATE TABLE events (
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

-- Si ya existe la tabla, agregar las columnas con:
-- ALTER TABLE events ADD COLUMN IF NOT EXISTS meet_link TEXT;
-- ALTER TABLE events ADD COLUMN IF NOT EXISTS meeting_notes TEXT;
-- ALTER TABLE events ADD COLUMN IF NOT EXISTS blocks_bookings BOOLEAN NOT NULL DEFAULT false;
-- ALTER TABLE events ADD COLUMN IF NOT EXISTS recurrence_group_id UUID;
-- ALTER TABLE events ADD COLUMN IF NOT EXISTS recurrence_rule JSONB;
-- ALTER TABLE events ADD COLUMN IF NOT EXISTS recurrence_sequence INTEGER;

-- ========== COURSE CLASSES ==========
-- Si la tabla clases ya existe en tu BD, agrega el enlace opcional de videollamada.
ALTER TABLE IF EXISTS clases
  ADD COLUMN IF NOT EXISTS meet_link TEXT;

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on events" ON events FOR ALL USING (true) WITH CHECK (true);

CREATE UNIQUE INDEX IF NOT EXISTS idx_events_ical_uid ON events (ical_uid);

CREATE TABLE event_attendees (
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

CREATE INDEX idx_event_attendees_event ON event_attendees (event_id);
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users read event attendees"
  ON event_attendees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owners manage event attendees"
  ON event_attendees FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM events e WHERE e.id = event_attendees.event_id AND e.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM events e WHERE e.id = event_attendees.event_id AND e.created_by = auth.uid()));

CREATE TABLE calendar_invitation_requests (
  request_id UUID PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'cancel')),
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'sent', 'failed')),
  result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE calendar_invitation_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read calendar invitation requests"
  ON calendar_invitation_requests FOR SELECT TO authenticated USING (owner_id = auth.uid());

CREATE TABLE meet_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  description TEXT CHECK (description IS NULL OR char_length(description) <= 2000),
  room_token TEXT NOT NULL UNIQUE CHECK (room_token ~ '^ntek-[0-9a-f-]{32,64}$'),
  room_url TEXT NOT NULL UNIQUE CHECK (room_url ~ '^https://meet\.jit\.si/ntek-[0-9a-f-]{32,64}$'),
  provider TEXT NOT NULL DEFAULT 'jitsi' CHECK (provider = 'jitsi'),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  last_opened_at TIMESTAMPTZ,
  open_count INTEGER NOT NULL DEFAULT 0 CHECK (open_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (expires_at > created_at)
);
CREATE INDEX idx_meet_rooms_owner_created ON meet_rooms (owner_id, created_at DESC);
CREATE INDEX idx_meet_rooms_owner_expiration ON meet_rooms (owner_id, expires_at);
ALTER TABLE meet_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read meet rooms" ON meet_rooms FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Owners create meet rooms" ON meet_rooms FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND revoked_at IS NULL AND open_count = 0);
CREATE POLICY "Owners update meet rooms" ON meet_rooms FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners delete meet rooms" ON meet_rooms FOR DELETE TO authenticated USING (owner_id = auth.uid());
CREATE OR REPLACE FUNCTION public.open_meet_room(p_room_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE target public.meet_rooms%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Debes iniciar sesión.' USING ERRCODE = '42501'; END IF;
  SELECT * INTO target FROM public.meet_rooms WHERE id = p_room_id AND owner_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'status', 'not_found'); END IF;
  IF target.revoked_at IS NOT NULL THEN RETURN jsonb_build_object('ok', false, 'status', 'revoked'); END IF;
  IF target.expires_at <= NOW() THEN RETURN jsonb_build_object('ok', false, 'status', 'expired'); END IF;
  UPDATE public.meet_rooms SET open_count = open_count + 1, last_opened_at = NOW(), updated_at = NOW()
  WHERE id = p_room_id;
  RETURN jsonb_build_object('ok', true, 'room_url', target.room_url);
END;
$$;
REVOKE ALL ON FUNCTION public.open_meet_room(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.open_meet_room(UUID) TO authenticated;

-- ========== ACTIVITY LOG ==========
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_name TEXT,
  activity_type activity_type NOT NULL DEFAULT 'general',
  description TEXT NOT NULL,
  entity_id UUID, -- ID del recurso relacionado
  entity_name TEXT, -- Nombre legible
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.activity_log FROM anon, authenticated;
GRANT SELECT, INSERT ON public.activity_log TO authenticated;
CREATE POLICY "Authenticated users read activity log"
  ON activity_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own activity log"
  ON activity_log FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- ========== VIEWS ÚTILES ==========

-- Vista: KPIs del dashboard
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

-- Vista: Facturas con info del cliente
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

-- Vista: Proyectos con info del cliente y conteo de miembros
CREATE OR REPLACE VIEW projects_with_details AS
SELECT
  p.*,
  c.name AS client_name,
  c.company AS client_company,
  (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) AS member_count
FROM projects p
LEFT JOIN clients c ON p.client_id = c.id
ORDER BY p.created_at DESC;

-- Vista: Documentos con info del uploader
CREATE OR REPLACE VIEW documents_with_uploader AS
SELECT
  d.*,
  pr.full_name AS uploader_name,
  p.name AS project_name
FROM documents d
LEFT JOIN profiles pr ON d.uploaded_by = pr.id
LEFT JOIN projects p ON d.project_id = p.id
ORDER BY d.created_at DESC;

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
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_dashboard_roles_updated_at BEFORE UPDATE ON dashboard_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_internship_profiles_updated_at BEFORE UPDATE ON internship_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_internship_logs_updated_at BEFORE UPDATE ON internship_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_facturacion_items_updated_at BEFORE UPDATE ON facturacion_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

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

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Reemplaza el trabajo si el esquema se ejecuta nuevamente, evitando duplicados.
DO $$
DECLARE
  existing_job_id BIGINT;
BEGIN
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

-- Policies de storage (público, sin RLS por ahora)
CREATE POLICY "Allow public upload to documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Allow public read from documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents');

CREATE POLICY "Allow public delete from documents" ON storage.objects
  FOR DELETE USING (bucket_id = 'documents');

CREATE POLICY "Allow public upload to avatars" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Allow public read from avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Allow public upload to project-assets" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'project-assets');

CREATE POLICY "Allow public read from project-assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'project-assets');

-- ========== SEED DATA (Datos iniciales) ==========

-- Team members
INSERT INTO team_members (full_name, role_title, avatar_url, availability, weekly_hours) VALUES
  ('Rodrigo Sandoval', 'Mobile & UI/UX', 'assets/roro.png', 'available', 32),
  ('Nicolás Araya', 'Fullstack & IA', 'assets/nico.png', 'busy', 40),
  ('Tomás Yevenes', 'DevOps & Fullstack', 'assets/tomas.png', 'available', 38);

-- Clients
INSERT INTO clients (name, company, relationship, email, phone, avatar_url, status, total_billed) VALUES
  ('Bárbara San Martín', 'Centro Médico Carpediem', 'owner', 'barbara@carpediem.cl', '+56 9 1234 5678', 'assets/barbara.jpeg', 'active', 3800000),
  ('Marcela San Martin', 'Ingeodata', 'manager', 'marcela@ingeodata.cl', '+56 9 2345 6789', NULL, 'active', 1500000),
  ('Carola Figueroa', 'IA Ñuble', 'manager', 'carola@ianuble.cl', '+56 9 3456 7890', 'assets/carola.jpg', 'active', 5200000),
  ('Yasna Navarrete', 'Clínica Kennedy', 'legal_rep', 'yasna@kennedy.cl', '+56 9 4567 8901', 'assets/yasna.jpg', 'active', 4100000),
  ('Carlos Jardua', 'Restaurante Viña Jardua', 'owner', 'carlos@jarduawines.cl', '+56 9 5678 9012', NULL, 'inactive', 800000);

-- Projects (usamos subconsultas para obtener client_id)
INSERT INTO projects (name, client_id, status, progress, technologies, start_date, estimated_end_date) VALUES
  ('Centro Médico Carpediem v2',
    (SELECT id FROM clients WHERE company = 'Centro Médico Carpediem' LIMIT 1),
    'in_development', 68, ARRAY['React', 'Node.js', 'PostgreSQL'], '2025-09-01', '2026-03-15'),
  ('Kennedy App Móvil',
    (SELECT id FROM clients WHERE company = 'Clínica Kennedy' LIMIT 1),
    'in_development', 45, ARRAY['Flutter', 'Firebase'], '2025-10-01', '2026-04-30'),
  ('Plataforma IA Ñuble v3',
    (SELECT id FROM clients WHERE company = 'IA Ñuble' LIMIT 1),
    'review', 90, ARRAY['Python', 'TensorFlow', 'Next.js'], '2025-06-01', '2026-02-28'),
  ('Portal Web Ingeodata',
    (SELECT id FROM clients WHERE company = 'Ingeodata' LIMIT 1),
    'completed', 100, ARRAY['React', 'Node.js'], '2025-08-01', '2026-01-31'),
  ('Ecofarmacovigilancia v2', NULL,
    'proposal', 0, ARRAY['Python', 'Vue.js'], NULL, NULL);

-- Invoices
INSERT INTO invoices (invoice_number, client_id, project_id, amount, status, issued_at, due_at) VALUES
  ('INV-0041',
    (SELECT id FROM clients WHERE company = 'Restaurante Viña Jardua' LIMIT 1),
    NULL, 800000, 'paid', '2026-01-10', '2026-01-25'),
  ('INV-0042',
    (SELECT id FROM clients WHERE company = 'Ingeodata' LIMIT 1),
    (SELECT id FROM projects WHERE name = 'Portal Web Ingeodata' LIMIT 1),
    1500000, 'paid', '2026-01-15', '2026-01-30'),
  ('INV-0043',
    (SELECT id FROM clients WHERE company = 'Centro Médico Carpediem' LIMIT 1),
    (SELECT id FROM projects WHERE name = 'Centro Médico Carpediem v2' LIMIT 1),
    1200000, 'overdue', '2026-01-20', '2026-02-08'),
  ('INV-0044',
    (SELECT id FROM clients WHERE company = 'Clínica Kennedy' LIMIT 1),
    (SELECT id FROM projects WHERE name = 'Kennedy App Móvil' LIMIT 1),
    1800000, 'pending', '2026-01-28', '2026-02-15'),
  ('INV-0045',
    (SELECT id FROM clients WHERE company = 'IA Ñuble' LIMIT 1),
    (SELECT id FROM projects WHERE name = 'Plataforma IA Ñuble v3' LIMIT 1),
    2500000, 'pending', '2026-02-01', '2026-02-20');

-- Tasks
INSERT INTO tasks (title, completed, priority, category, project_id, due_date) VALUES
  ('Revisar PR #112a44 — Auth Carpediem', false, 'high', 'Code Review',
    (SELECT id FROM projects WHERE name = 'Centro Médico Carpediem v2' LIMIT 1), '2026-02-06'),
  ('Preparar demo Sprint 4 — Kennedy App', false, 'high', 'Presentación',
    (SELECT id FROM projects WHERE name = 'Kennedy App Móvil' LIMIT 1), '2026-02-12'),
  ('Enviar propuesta técnica — Ecofarma v2', false, 'medium', 'Ventas',
    (SELECT id FROM projects WHERE name = 'Ecofarmacovigilancia v2' LIMIT 1), '2026-02-10'),
  ('Configurar monitoreo — Plataforma IA Ñuble', false, 'medium', 'DevOps',
    (SELECT id FROM projects WHERE name = 'Plataforma IA Ñuble v3' LIMIT 1), '2026-02-14'),
  ('Desplegar Ingeodata v1.2 a producción', true, 'high', 'Deploy',
    (SELECT id FROM projects WHERE name = 'Portal Web Ingeodata' LIMIT 1), '2026-02-04'),
  ('Reunión weekly con equipo', true, 'medium', 'Meeting', NULL, '2026-02-05');

-- Orders (Kanban)
INSERT INTO orders (title, description, category, status, priority, assigned_to, due_date) VALUES
  ('Rediseño landing Ecofarma', 'Crear nuevos mockups para la v2 del sitio', 'Diseño', 'pending', 'high',
    (SELECT id FROM team_members WHERE full_name = 'Rodrigo Sandoval' LIMIT 1), '2026-02-15'),
  ('API integración pagos Kennedy', 'Conectar pasarela de pago con Transbank', 'Backend', 'pending', 'medium',
    (SELECT id FROM team_members WHERE full_name = 'Nicolás Araya' LIMIT 1), '2026-02-18'),
  ('Setup CI/CD Ecofarma', 'Configurar pipeline de despliegue', 'DevOps', 'pending', 'low',
    (SELECT id FROM team_members WHERE full_name = 'Tomás Yevenes' LIMIT 1), '2026-02-22'),
  ('Módulo agenda Carpediem', 'Implementar sistema de reserva de citas online', 'Frontend', 'in_progress', 'high',
    (SELECT id FROM team_members WHERE full_name = 'Nicolás Araya' LIMIT 1), '2026-02-10'),
  ('UI pantallas Kennedy App', 'Maquetar pantallas de historial y perfil', 'Mobile', 'in_progress', 'high',
    (SELECT id FROM team_members WHERE full_name = 'Rodrigo Sandoval' LIMIT 1), '2026-02-12'),
  ('Modelo NLP IA Ñuble', 'Fine-tuning del modelo de análisis de textos', 'IA', 'review', 'medium',
    (SELECT id FROM team_members WHERE full_name = 'Tomás Yevenes' LIMIT 1), '2026-02-08'),
  ('QA Sprint 3 Carpediem', 'Pruebas de integración y UAT', 'Testing', 'review', 'medium',
    (SELECT id FROM team_members WHERE full_name = 'Nicolás Araya' LIMIT 1), '2026-02-09'),
  ('Auth módulo Carpediem', 'Sistema de login con OAuth2', 'Backend', 'done', 'high',
    (SELECT id FROM team_members WHERE full_name = 'Nicolás Araya' LIMIT 1), '2026-02-03'),
  ('Deploy Ingeodata prod', 'Despliegue a producción exitoso', 'Deploy', 'done', 'medium',
    (SELECT id FROM team_members WHERE full_name = 'Tomás Yevenes' LIMIT 1), '2026-02-01');

-- Events
INSERT INTO events (title, description, event_type, event_date, start_time, end_time) VALUES
  ('Weekly Equipo Solven Labs', 'Revisión de sprints y planificación semanal', 'meeting', '2026-02-06', '10:00', '11:00'),
  ('Entrega Sprint 3 — Carpediem', 'Demo del módulo de agendamiento', 'deadline', '2026-02-06', '14:00', NULL),
  ('Call con Yasna — Kennedy', 'Revisión de avances app móvil', 'meeting', '2026-02-06', '16:00', '16:30'),
  ('Demo Sprint 4 — Kennedy App', 'Presentación de avances al cliente', 'demo', '2026-02-12', '10:00', '11:30'),
  ('Kickoff Ecofarma v2', 'Reunión de inicio del proyecto', 'kickoff', '2026-02-15', '10:00', '11:30'),
  ('Revisión modelo NLP', 'Revisar métricas del modelo IA Ñuble', 'meeting', '2026-02-20', '15:00', '16:00');

-- Activity log
INSERT INTO activity_log (user_name, activity_type, description, entity_name) VALUES
  ('Nicolás Araya', 'project', 'completó el módulo de autenticación', 'App Restaurante Jardua'),
  ('Tomás Yevenes', 'deploy', 'desplegó v2.1', 'Plataforma Carpediem'),
  ('Sistema', 'invoice', 'Nueva factura #INV-0045 generada', 'IA Ñuble'),
  ('Rodrigo Sandoval', 'document', 'subió diseños UI al proyecto', 'Kennedy App'),
  ('Sistema', 'client', 'Cliente aprobó la propuesta de rediseño web', 'Ingeodata');

-- ========== ÍNDICES ==========
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_due ON invoices(due_at);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_assigned ON orders(assigned_to);
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_documents_project ON documents(project_id);
CREATE INDEX idx_documents_folder ON documents(folder);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_recurrence_group ON events(recurrence_group_id) WHERE recurrence_group_id IS NOT NULL;
CREATE INDEX idx_activity_log_created ON activity_log(created_at DESC);

-- ==========================================================================
-- MIGRACIÓN: Portal de Estado de Proyecto para Clientes
-- Ejecutar en Supabase SQL Editor después del schema inicial
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

CREATE TYPE update_type AS ENUM ('milestone', 'update', 'delivery', 'issue', 'note');

CREATE TABLE project_updates (
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

ALTER TABLE project_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on project_updates" ON project_updates FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_project_updates_updated_at 
  BEFORE UPDATE ON project_updates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_project_updates_project ON project_updates(project_id);
CREATE INDEX idx_project_updates_created ON project_updates(created_at DESC);

-- Vista pública para el portal de clientes
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
  c.name    AS client_name,
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

-- ============================================================
-- Solven Labs — Finanzas & Contratos Migration
-- Run in Supabase SQL Editor
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
ALTER TABLE fin_ingresos ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE fin_gastos ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE contratos_personal ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contratos_personal_all" ON contratos_personal FOR ALL USING (true) WITH CHECK (true);

-- 4. CONTRATOS — Finiquitos
CREATE TABLE IF NOT EXISTS contratos_finiquitos (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  empleado       TEXT        NOT NULL,
  fecha          DATE,
  indemnizacion  BIGINT      NOT NULL DEFAULT 0,
  motivo         TEXT        NOT NULL DEFAULT 'renuncia',
  estado         TEXT        NOT NULL DEFAULT 'borrador',
  observaciones  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE contratos_finiquitos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contratos_finiquitos_all" ON contratos_finiquitos FOR ALL USING (true) WITH CHECK (true);

-- 5. CONTRATOS — Anexos
CREATE TABLE IF NOT EXISTS contratos_anexos (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  contrato    TEXT        NOT NULL,
  descripcion TEXT        NOT NULL,
  tipo        TEXT        NOT NULL DEFAULT 'otro',
  fecha       DATE,
  estado      TEXT        NOT NULL DEFAULT 'borrador',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE contratos_anexos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contratos_anexos_all" ON contratos_anexos FOR ALL USING (true) WITH CHECK (true);

-- ─── MIGRATIONS: extend contratos tables with richer employee data ───────────
-- Run these if you already have the tables created above

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

ALTER TABLE contratos_finiquitos
  ADD COLUMN IF NOT EXISTS rut               TEXT,
  ADD COLUMN IF NOT EXISTS cargo             TEXT,
  ADD COLUMN IF NOT EXISTS sueldo_base       BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dias_vacaciones   INT    NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monto_vacaciones  BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monto_aviso       BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS otros_beneficios  BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS access_token      TEXT,
  ADD COLUMN IF NOT EXISTS access_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS signed_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS signed_name       TEXT;

ALTER TABLE contratos_anexos
  ADD COLUMN IF NOT EXISTS empleado       TEXT,
  ADD COLUMN IF NOT EXISTS rut            TEXT,
  ADD COLUMN IF NOT EXISTS cargo_anterior TEXT,
  ADD COLUMN IF NOT EXISTS cargo_nuevo    TEXT,
  ADD COLUMN IF NOT EXISTS sueldo_anterior BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sueldo_nuevo    BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS observaciones  TEXT,
  ADD COLUMN IF NOT EXISTS access_token      TEXT,
  ADD COLUMN IF NOT EXISTS access_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS signed_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS signed_name       TEXT;

-- ==========================================================================
-- RESERVAS PAGADAS DE VISITAS TÉCNICAS
-- Ejecutar esta migración antes de desplegar las Edge Functions de reservas.
-- Una reserva pendiente nunca se inserta en `events`; solo la función segura de
-- confirmación crea el evento después de verificar el pago con Mercado Pago.
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
CREATE POLICY "Authenticated users read events"
  ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owners create events"
  ON public.events FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Owners update events"
  ON public.events FOR UPDATE TO authenticated
  USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
CREATE POLICY "Owners delete events"
  ON public.events FOR DELETE TO authenticated USING (created_by = auth.uid());

CREATE OR REPLACE FUNCTION public.confirm_paid_visit_reservation(
  p_reservation_id UUID,
  p_payment_id TEXT,
  p_mp_status TEXT,
  p_amount NUMERIC,
  p_currency TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reservation_row public.visit_reservations%ROWTYPE;
  created_event_id UUID;
BEGIN
  SELECT * INTO reservation_row
  FROM public.visit_reservations
  WHERE id = p_reservation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'status', 'not_found');
  END IF;

  IF reservation_row.status = 'approved' THEN
    RETURN jsonb_build_object('ok', true, 'status', 'approved', 'event_id', reservation_row.event_id);
  END IF;

  -- Serializa todas las confirmaciones que compiten por la misma fecha y hora.
  PERFORM pg_advisory_xact_lock(hashtext(reservation_row.visit_date::text));

  IF p_mp_status <> 'approved' THEN
    UPDATE public.visit_reservations
    SET mercado_pago_payment_id = p_payment_id,
        mercado_pago_status = p_mp_status,
        updated_at = NOW()
    WHERE id = p_reservation_id;
    RETURN jsonb_build_object('ok', false, 'status', p_mp_status);
  END IF;

  IF p_amount <> reservation_row.amount OR upper(coalesce(p_currency, '')) <> reservation_row.currency THEN
    UPDATE public.visit_reservations
    SET status = 'payment_mismatch',
        mercado_pago_payment_id = p_payment_id,
        mercado_pago_status = p_mp_status,
        updated_at = NOW()
    WHERE id = p_reservation_id;
    RETURN jsonb_build_object('ok', false, 'status', 'payment_mismatch');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.events
    WHERE event_date = reservation_row.visit_date
      AND start_time IS NOT NULL
      AND start_time < reservation_row.end_time
      AND COALESCE(end_time, start_time + INTERVAL '1 hour') > reservation_row.visit_time
  ) OR EXISTS (
    SELECT 1 FROM public.visit_reservations
    WHERE id <> reservation_row.id
      AND visit_date = reservation_row.visit_date
      AND visit_time = reservation_row.visit_time
      AND status = 'approved'
  ) THEN
    UPDATE public.visit_reservations
    SET status = 'needs_review',
        mercado_pago_payment_id = p_payment_id,
        mercado_pago_status = p_mp_status,
        updated_at = NOW()
    WHERE id = p_reservation_id;
    RETURN jsonb_build_object('ok', false, 'status', 'needs_review');
  END IF;

  INSERT INTO public.events (
    title, description, event_type, event_date, start_time, end_time
  ) VALUES (
    'Visita técnica · ' || reservation_row.customer_name,
    'Reserva pagada y validada automáticamente.' || E'\n' ||
    'Servicio: ' || reservation_row.service_name || E'\n' ||
    'Cliente: ' || reservation_row.customer_name || E'\n' ||
    'Correo: ' || reservation_row.customer_email || E'\n' ||
    'WhatsApp: ' || reservation_row.customer_phone || E'\n' ||
    'Pago Mercado Pago: ' || p_payment_id,
    'meeting', reservation_row.visit_date, reservation_row.visit_time, reservation_row.end_time
  ) RETURNING id INTO created_event_id;

  UPDATE public.visit_reservations
  SET status = 'approved',
      mercado_pago_preference_id = mercado_pago_preference_id,
      mercado_pago_payment_id = p_payment_id,
      mercado_pago_status = p_mp_status,
      event_id = created_event_id,
      approved_at = NOW(),
      updated_at = NOW()
  WHERE id = p_reservation_id;

  RETURN jsonb_build_object('ok', true, 'status', 'approved', 'event_id', created_event_id);
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_paid_visit_reservation(UUID, TEXT, TEXT, NUMERIC, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_paid_visit_reservation(UUID, TEXT, TEXT, NUMERIC, TEXT) TO service_role;

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

-- Reserva atómicamente una visita pendiente y respeta cualquier intervalo ya
-- ocupado. La función pública de pago usa este RPC con service_role.
CREATE OR REPLACE FUNCTION public.create_pending_visit_reservation(
  p_service_name TEXT,
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_customer_phone TEXT,
  p_visit_date DATE,
  p_visit_time TIME,
  p_end_time TIME,
  p_expires_at TIMESTAMPTZ
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  created_reservation public.visit_reservations%ROWTYPE;
BEGIN
  IF p_visit_time IS NULL OR p_end_time IS NULL OR p_end_time <= p_visit_time THEN
    RETURN jsonb_build_object('ok', false, 'status', 'invalid_interval');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(p_visit_date::text));

  UPDATE public.visit_reservations
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'pending' AND expires_at < NOW();

  IF EXISTS (
    SELECT 1 FROM public.events
    WHERE event_date = p_visit_date
      AND start_time IS NOT NULL
      AND start_time < p_end_time
      AND COALESCE(end_time, start_time + INTERVAL '1 hour') > p_visit_time
  ) OR EXISTS (
    SELECT 1 FROM public.visit_reservations
    WHERE visit_date = p_visit_date
      AND visit_time < p_end_time
      AND end_time > p_visit_time
      AND (status = 'approved' OR (status = 'pending' AND expires_at > NOW()))
  ) THEN
    RETURN jsonb_build_object('ok', false, 'status', 'unavailable');
  END IF;

  INSERT INTO public.visit_reservations (
    service_name, customer_name, customer_email, customer_phone,
    visit_date, visit_time, end_time, amount, currency, status, expires_at
  ) VALUES (
    p_service_name, p_customer_name, p_customer_email, p_customer_phone,
    p_visit_date, p_visit_time, p_end_time, 5000, 'CLP', 'pending', p_expires_at
  ) RETURNING * INTO created_reservation;

  RETURN jsonb_build_object(
    'ok', true,
    'status', 'pending',
    'reservation_id', created_reservation.id,
    'expires_at', created_reservation.expires_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_pending_visit_reservation(TEXT, TEXT, TEXT, TEXT, DATE, TIME, TIME, TIMESTAMPTZ)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_pending_visit_reservation(TEXT, TEXT, TEXT, TEXT, DATE, TIME, TIME, TIMESTAMPTZ)
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
-- SUSCRIPCIONES RECURRENTES DE MANTENCIÓN Solven Labs / MERCADO PAGO
-- Los montos válidos se determinan en la función Edge, nunca en el navegador.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.maintenance_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_code TEXT NOT NULL CHECK (plan_code IN ('presencia','impulso','operacion','custom')),
  plan_name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CLP' CHECK (currency = 'CLP'),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  mercado_pago_preapproval_id TEXT UNIQUE,
  checkout_url TEXT,
  mercado_pago_status TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  next_payment_date TIMESTAMPTZ,
  last_payment_date TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.maintenance_subscriptions
  DROP CONSTRAINT IF EXISTS maintenance_subscriptions_plan_code_check;
ALTER TABLE public.maintenance_subscriptions
  ADD CONSTRAINT maintenance_subscriptions_plan_code_check
  CHECK (plan_code IN ('presencia','impulso','operacion','custom'));
ALTER TABLE public.maintenance_subscriptions
  DROP CONSTRAINT IF EXISTS maintenance_subscriptions_amount_check;
ALTER TABLE public.maintenance_subscriptions
  ADD CONSTRAINT maintenance_subscriptions_amount_check
  CHECK (
    (plan_code = 'presencia' AND amount = 39900) OR
    (plan_code = 'impulso' AND amount = 89900) OR
    (plan_code = 'operacion' AND amount = 179900) OR
    (plan_code = 'custom' AND amount BETWEEN 1000 AND 5000000)
  );

CREATE TABLE IF NOT EXISTS public.maintenance_subscription_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES public.maintenance_subscriptions(id) ON DELETE CASCADE,
  mercado_pago_authorized_payment_id TEXT UNIQUE,
  mercado_pago_payment_id TEXT UNIQUE,
  status TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CLP',
  charged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_subscriptions_status
  ON public.maintenance_subscriptions(status);
ALTER TABLE public.maintenance_subscriptions ADD COLUMN IF NOT EXISTS checkout_url TEXT;
ALTER TABLE public.maintenance_subscriptions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_maintenance_subscriptions_visible
  ON public.maintenance_subscriptions(created_at DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_maintenance_subscription_payments_subscription
  ON public.maintenance_subscription_payments(subscription_id, created_at DESC);

ALTER TABLE public.maintenance_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_subscription_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Dashboard reads maintenance subscriptions" ON public.maintenance_subscriptions;
CREATE POLICY "Dashboard reads maintenance subscriptions"
  ON public.maintenance_subscriptions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Dashboard reads maintenance subscription payments" ON public.maintenance_subscription_payments;
CREATE POLICY "Dashboard reads maintenance subscription payments"
  ON public.maintenance_subscription_payments FOR SELECT TO authenticated USING (true);

ALTER TABLE public.facturacion_items ADD COLUMN IF NOT EXISTS external_source TEXT;
ALTER TABLE public.facturacion_items ADD COLUMN IF NOT EXISTS external_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_facturacion_items_external
  ON public.facturacion_items(external_source, external_id)
  WHERE external_source IS NOT NULL AND external_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.register_maintenance_subscription_payment(
  p_subscription_id UUID,
  p_authorized_payment_id TEXT,
  p_payment_id TEXT,
  p_status TEXT,
  p_amount NUMERIC,
  p_currency TEXT,
  p_charged_at TIMESTAMPTZ
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  subscription_row public.maintenance_subscriptions%ROWTYPE;
  payment_key TEXT;
  payment_row_id UUID;
BEGIN
  SELECT * INTO subscription_row
  FROM public.maintenance_subscriptions
  WHERE id = p_subscription_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'status', 'subscription_not_found');
  END IF;

  payment_key := coalesce(nullif(p_payment_id, ''), p_authorized_payment_id);

  IF lower(p_status) = 'approved' AND (
    p_amount <> subscription_row.amount OR upper(coalesce(p_currency, '')) <> subscription_row.currency
  ) THEN
    UPDATE public.maintenance_subscriptions
    SET status = 'payment_mismatch', updated_at = NOW()
    WHERE id = p_subscription_id;
    RETURN jsonb_build_object('ok', false, 'status', 'payment_mismatch');
  END IF;

  SELECT id INTO payment_row_id
  FROM public.maintenance_subscription_payments
  WHERE subscription_id = p_subscription_id
    AND (
      mercado_pago_authorized_payment_id = nullif(p_authorized_payment_id, '') OR
      mercado_pago_payment_id = nullif(p_payment_id, '')
    )
  LIMIT 1;

  IF payment_row_id IS NULL THEN
    INSERT INTO public.maintenance_subscription_payments (
      subscription_id, mercado_pago_authorized_payment_id, mercado_pago_payment_id,
      status, amount, currency, charged_at
    ) VALUES (
      p_subscription_id, nullif(p_authorized_payment_id, ''), nullif(p_payment_id, ''),
      lower(p_status), round(p_amount), upper(p_currency), p_charged_at
    );
  ELSE
    UPDATE public.maintenance_subscription_payments
    SET mercado_pago_authorized_payment_id = coalesce(mercado_pago_authorized_payment_id, nullif(p_authorized_payment_id, '')),
        mercado_pago_payment_id = coalesce(mercado_pago_payment_id, nullif(p_payment_id, '')),
        status = lower(p_status), amount = round(p_amount), currency = upper(p_currency),
        charged_at = p_charged_at, updated_at = NOW()
    WHERE id = payment_row_id;
  END IF;

  IF lower(p_status) = 'approved' THEN
    UPDATE public.maintenance_subscriptions
    SET status = 'authorized', mercado_pago_status = 'authorized',
        activated_at = coalesce(activated_at, NOW()), last_payment_date = p_charged_at,
        updated_at = NOW()
    WHERE id = p_subscription_id;

    INSERT INTO public.facturacion_items (
      invoice_number, customer_name, title, type, billing_cycle, payment_terms,
      renewal_date, amount, due_date, status, notes, external_source, external_id
    ) VALUES (
      'MP-' || payment_key,
      subscription_row.customer_name,
      'Mantención mensual · ' || subscription_row.plan_name,
      'suscripcion', 'monthly', 'Cobro automático Mercado Pago',
      (coalesce(p_charged_at, NOW()) + INTERVAL '1 month')::date,
      round(p_amount), coalesce(p_charged_at, NOW())::date, 'paid',
      'Cobro recurrente validado por Mercado Pago.', 'mercadopago_subscription', payment_key
    ) ON CONFLICT (external_source, external_id)
      WHERE external_source IS NOT NULL AND external_id IS NOT NULL
      DO NOTHING;
  END IF;

  RETURN jsonb_build_object('ok', true, 'status', lower(p_status));
END;
$$;

REVOKE ALL ON FUNCTION public.register_maintenance_subscription_payment(UUID, TEXT, TEXT, TEXT, NUMERIC, TEXT, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_maintenance_subscription_payment(UUID, TEXT, TEXT, TEXT, NUMERIC, TEXT, TIMESTAMPTZ) TO service_role;

-- ============================================================================
-- MANTENCIONES FACTURADAS CON PAGO MANUAL EN EL PORTAL DEL CLIENTE
-- No crea mandatos ni preaprobaciones: Mercado Pago se abre solo al pagar.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.maintenance_billing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  plan_code TEXT NOT NULL CHECK (plan_code IN ('presencia','impulso','operacion','custom')),
  plan_name TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount BETWEEN 1000 AND 5000000),
  currency TEXT NOT NULL DEFAULT 'CLP' CHECK (currency = 'CLP'),
  customer_name TEXT NOT NULL,
  customer_rut TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  billing_day SMALLINT NOT NULL CHECK (billing_day BETWEEN 1 AND 28),
  next_issue_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','cancelled')),
  balance_confirmed_at TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.maintenance_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_plan_id UUID NOT NULL REFERENCES public.maintenance_billing_plans(id) ON DELETE RESTRICT,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  customer_rut TEXT NOT NULL,
  period_start DATE NOT NULL,
  issued_at DATE NOT NULL,
  due_at DATE NOT NULL,
  amount INTEGER NOT NULL CHECK (amount BETWEEN 1000 AND 5000000),
  currency TEXT NOT NULL DEFAULT 'CLP' CHECK (currency = 'CLP'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','overdue','cancelled','payment_mismatch')),
  mercado_pago_preference_id TEXT,
  mercado_pago_payment_id TEXT UNIQUE,
  mercado_pago_status TEXT,
  checkout_url TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (billing_plan_id, period_start)
);

CREATE INDEX IF NOT EXISTS idx_maintenance_billing_plans_project
  ON public.maintenance_billing_plans(project_id, status) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_maintenance_billing_plans_one_current
  ON public.maintenance_billing_plans(project_id)
  WHERE deleted_at IS NULL AND status IN ('active','paused');
CREATE INDEX IF NOT EXISTS idx_maintenance_bills_project ON public.maintenance_bills(project_id, issued_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_maintenance_bills_one_open
  ON public.maintenance_bills(billing_plan_id)
  WHERE status IN ('pending', 'overdue', 'payment_mismatch');
CREATE INDEX IF NOT EXISTS idx_maintenance_bills_rut
  ON public.maintenance_bills((regexp_replace(lower(customer_rut), '[^0-9k]', '', 'g')), issued_at DESC);

ALTER TABLE public.maintenance_billing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_bills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Dashboard reads maintenance billing plans" ON public.maintenance_billing_plans;
CREATE POLICY "Dashboard reads maintenance billing plans" ON public.maintenance_billing_plans FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Dashboard reads maintenance bills" ON public.maintenance_bills;
CREATE POLICY "Dashboard reads maintenance bills" ON public.maintenance_bills FOR SELECT TO authenticated USING (true);
REVOKE ALL ON public.maintenance_billing_plans FROM anon;
REVOKE ALL ON public.maintenance_bills FROM anon;
GRANT SELECT ON public.maintenance_billing_plans TO authenticated;
GRANT SELECT ON public.maintenance_bills TO authenticated;

-- ============================================================================
-- Las alertas operativas se calculan en el navegador. No se guardan, no usan
-- Realtime, cron ni Edge Functions. Mantener esta limpieza al final permite
-- actualizar instalaciones existentes y deja las instalaciones nuevas sin el
-- subsistema persistente anterior.
-- Las alertas del dashboard se calculan en el navegador y no se persisten.
-- Esta limpieza también elimina el trigger histórico que bloqueaba facturas_presii
-- al insertar una notificación sin recipient_profile_id.

DO $$
DECLARE
  target RECORD;
BEGIN
  FOR target IN SELECT * FROM (VALUES
    ('site_messages', 'notify_site_message_insert'),
    ('orders', 'notify_order_insert'),
    ('service_orders', 'notify_service_order_insert'),
    ('tasks', 'notify_task_insert'),
    ('tasks', 'notify_ntek_tasks'),
    ('projects', 'notify_project_insert'),
    ('events', 'notify_ntek_events'),
    ('facturacion_items', 'notify_ntek_facturacion'),
    ('facturas_presii', 'notify_factura_presii_insert'),
    ('facturas_presii', 'notify_ntek_facturas_presii'),
    ('maintenance_bills', 'notify_ntek_maintenance_bills'),
    ('internship_logs', 'notify_ntek_logs'),
    ('clients', 'notify_client_insert')
  ) AS triggers(table_name, trigger_name)
  LOOP
    IF to_regclass('public.' || target.table_name) IS NOT NULL THEN
      EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', target.trigger_name, target.table_name);
    END IF;
  END LOOP;

  IF to_regclass('public.dashboard_notifications') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS dispatch_ntek_push_insert ON public.dashboard_notifications;
  END IF;
END $$;

DO $$
DECLARE
  job RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    FOR job IN
      SELECT jobid
      FROM cron.job
      WHERE jobname IN ('ntek-push-retry', 'ntek-notification-reminders')
    LOOP
      PERFORM cron.unschedule(job.jobid);
    END LOOP;
  END IF;
END $$;

DROP FUNCTION IF EXISTS public.dispatch_ntek_push_after_insert();
DROP FUNCTION IF EXISTS public.retry_ntek_pending_push();
DROP FUNCTION IF EXISTS public.enqueue_ntek_due_notifications();
DROP FUNCTION IF EXISTS public.create_ntek_calendar_notification_from_row() CASCADE;
DROP FUNCTION IF EXISTS public.create_ntek_notification_from_row() CASCADE;
DROP FUNCTION IF EXISTS public.claim_ntek_push_notification(UUID);
DROP FUNCTION IF EXISTS public.record_ntek_system_health(TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.create_ntek_notification(
  TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, UUID[], UUID
);
DROP FUNCTION IF EXISTS public.create_dashboard_notification() CASCADE;
DROP FUNCTION IF EXISTS public.ntek_profile_can_access(UUID, TEXT);

DROP TABLE IF EXISTS public.dashboard_notification_reads CASCADE;
DROP TABLE IF EXISTS public.dashboard_notifications CASCADE;
DROP TABLE IF EXISTS public.push_subscriptions CASCADE;
DROP TABLE IF EXISTS public.notification_settings CASCADE;
DROP TABLE IF EXISTS public.ntek_system_health_state CASCADE;

-- activity_log conserva cambios relevantes, no telemetría de navegación.
DELETE FROM public.activity_log
WHERE lower(trim(COALESCE(description, ''))) ~
  '^(navegó|navego|visitó|visito|abrió|abrio|visualizó|visualizo|consultó|consulto)([[:space:]]|$)';

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
BEGIN;
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
COMMIT;
NOTIFY pgrst, 'reload schema';
