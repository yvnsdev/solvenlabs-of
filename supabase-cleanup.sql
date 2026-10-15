-- Solven Labs — limpieza opcional de tablas retiradas del código actual
-- Ejecutar DESPUÉS de supabase-schema.sql, como postgres en Supabase SQL Editor.
-- No borra registros: si CUALQUIERA de estas tablas contiene datos, aborta todo.
-- No usa CASCADE: una dependencia ajena a esta lista también detiene la limpieza.
-- Las tablas con información deben respaldarse/revisarse antes de retirarlas.
-- Se conservan visit_reservations, invoices y maintenance_billing_plans/bills:
-- todavía son consultadas por el dashboard, la agenda o sus vistas y funciones.

BEGIN;
SET LOCAL search_path = public, extensions;
SET LOCAL lock_timeout = '5s';

DO $cleanup$
DECLARE
  table_name TEXT;
  has_rows BOOLEAN;
  occupied_tables TEXT[] := '{}';
  retired_tables TEXT[] := ARRAY[
    'test_intentos', 'tests', 'invoice_items', 'public_site_kpi_settings',
    'meet_rooms', 'contratos_finiquitos', 'contratos_anexos',
    'maintenance_subscription_payments', 'maintenance_subscriptions',
    'dashboard_notification_reads', 'dashboard_notifications',
    'push_subscriptions', 'notification_settings', 'ntek_system_health_state',
    'site_event_registrations'
  ];
  fn RECORD;
  legacy_trigger RECORD;
  job RECORD;
BEGIN
  -- Bloquear antes de comprobar para impedir inserciones entre el chequeo y DROP.
  FOREACH table_name IN ARRAY retired_tables LOOP
    IF to_regclass(format('public.%I', table_name)) IS NOT NULL THEN
      EXECUTE format('LOCK TABLE public.%I IN ACCESS EXCLUSIVE MODE', table_name);
      EXECUTE format('SELECT EXISTS (SELECT 1 FROM public.%I LIMIT 1)', table_name) INTO has_rows;
      IF has_rows THEN occupied_tables := array_append(occupied_tables, table_name); END IF;
    END IF;
  END LOOP;
  IF cardinality(occupied_tables) > 0 THEN
    RAISE EXCEPTION 'Limpieza cancelada: hay datos en %. No se borró ninguna tabla.', array_to_string(occupied_tables, ', ');
  END IF;

  -- Triggers conocidos del antiguo sistema de notificaciones, ya retirado del sitio.
  FOR legacy_trigger IN SELECT * FROM (VALUES
    ('site_messages', 'notify_site_message_insert'), ('orders', 'notify_order_insert'),
    ('service_orders', 'notify_service_order_insert'), ('tasks', 'notify_task_insert'),
    ('tasks', 'notify_ntek_tasks'), ('projects', 'notify_project_insert'),
    ('events', 'notify_ntek_events'), ('facturacion_items', 'notify_ntek_facturacion'),
    ('facturas_presii', 'notify_factura_presii_insert'), ('facturas_presii', 'notify_ntek_facturas_presii'),
    ('maintenance_bills', 'notify_ntek_maintenance_bills'), ('internship_logs', 'notify_ntek_logs'),
    ('clients', 'notify_client_insert'), ('dashboard_notifications', 'dispatch_ntek_push_insert')
  ) AS t(table_name, trigger_name) LOOP
    IF to_regclass(format('public.%I', legacy_trigger.table_name)) IS NOT NULL THEN
      EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', legacy_trigger.trigger_name, legacy_trigger.table_name);
    END IF;
  END LOOP;
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    FOR job IN SELECT jobid FROM cron.job WHERE jobname IN ('ntek-push-retry', 'ntek-notification-reminders') LOOP
      PERFORM cron.unschedule(job.jobid);
    END LOOP;
  END IF;

  FOR fn IN SELECT p.oid::regprocedure AS signature
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = ANY(ARRAY[
      'get_public_site_kpis', 'open_meet_room', 'register_maintenance_subscription_payment',
      'confirm_paid_visit_reservation', 'create_pending_visit_reservation',
      'dispatch_ntek_push_after_insert', 'retry_ntek_pending_push',
      'enqueue_ntek_due_notifications', 'create_ntek_calendar_notification_from_row',
      'create_ntek_notification_from_row', 'claim_ntek_push_notification',
      'record_ntek_system_health', 'create_ntek_notification',
      'create_dashboard_notification', 'ntek_profile_can_access'
    ])
  LOOP
    EXECUTE format('DROP FUNCTION %s RESTRICT', fn.signature);
  END LOOP;
  FOREACH table_name IN ARRAY retired_tables LOOP
    EXECUTE format('DROP TABLE IF EXISTS public.%I RESTRICT', table_name);
  END LOOP;
END $cleanup$;

NOTIFY pgrst, 'reload schema';
COMMIT;
