import { createClient } from 'npm:@supabase/supabase-js@2.112.4';

const corsHeaders = request => {
  const origin = request.headers.get('origin') || '';
  const configured = (Deno.env.get('BOOKING_ALLOWED_ORIGINS') || 'https://solvenlabs.cl,https://www.solvenlabs.cl')
    .split(',').map(value => value.trim()).filter(Boolean);
  const allowedOrigin = configured.includes(origin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
    ? origin : configured[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info, x-signature, x-request-id',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin'
  };
};
const jsonResponse = (request, body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders(request), 'Content-Type': 'application/json; charset=utf-8' }
});
const getAdminClient = () => {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceRole) throw new Error('Supabase no esta configurado en la funcion.');
  return createClient(url, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } });
};
const validUuid = value => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const chileDate = () => new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit'
}).format(new Date());
const assertBillingAccess = async userId => {
  const admin = getAdminClient();
  const { data: profile, error } = await admin.from('profiles').select('role').eq('id', userId).maybeSingle();
  if (error) throw error;
  const role = String(profile?.role || '').trim().toLowerCase();
  if (!['administracion', 'administrador', 'administrator', 'admin', 'contabilidad'].includes(role)) {
    const accessError = new Error('No tienes permisos de Facturacion para administrar mantenciones.');
    accessError.status = 403;
    throw accessError;
  }
  return profile;
};

const isValidIssueDate = value => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  const billingDay = Number(value.slice(8, 10));
  return !Number.isNaN(parsed.valueOf())
    && parsed.toISOString().slice(0, 10) === value
    && billingDay >= 1
    && billingDay <= 28;
};

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(request) });
  if (request.method !== 'POST') return jsonResponse(request, { error: 'Metodo no permitido.' }, 405);
  try {
    const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const url = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const auth = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: { user } } = await auth.auth.getUser(token);
    if (!user) return jsonResponse(request, { error: 'Debes iniciar sesion.' }, 401);
    await assertBillingAccess(user.id);
    const body = await request.json();
    const planId = String(body.plan_id || '');
    const action = String(body.action || '');
    if (!validUuid(planId) || !['edit','pause','resume','cancel','delete'].includes(action)) return jsonResponse(request, { error: 'Accion no valida.' }, 400);
    const admin = getAdminClient();

    if (action === 'edit') {
      const planName = String(body.plan_name || '').trim();
      const amount = Number(body.amount || 0);
      const nextIssueDate = String(body.next_issue_date || '');
      if (planName.length < 3 || planName.length > 80) return jsonResponse(request, { error: 'El nombre del plan no es valido.' }, 400);
      if (!Number.isInteger(amount) || amount < 1000 || amount > 5000000) return jsonResponse(request, { error: 'El monto no es valido.' }, 400);
      if (!isValidIssueDate(nextIssueDate)) return jsonResponse(request, { error: 'La fecha de facturacion no es valida.' }, 400);
      if (nextIssueDate < chileDate()) return jsonResponse(request, { error: 'La fecha programada del proximo cobro no puede estar en el pasado.' }, 400);

      const { data: plan, error: planError } = await admin.from('maintenance_billing_plans')
        .select('*').eq('id', planId).is('deleted_at', null).maybeSingle();
      if (planError) throw planError;
      if (!plan) return jsonResponse(request, { error: 'No encontramos la mantencion.' }, 404);
      if (plan.status === 'cancelled') return jsonResponse(request, { error: 'No se puede editar una mantencion cancelada.' }, 409);

      const now = new Date().toISOString();
      const { error: updateError } = await admin.from('maintenance_billing_plans').update({
        plan_name: planName,
        amount,
        billing_day: Number(nextIssueDate.slice(8, 10)),
        next_issue_date: nextIssueDate,
        updated_at: now
      }).eq('id', planId);
      if (updateError) throw updateError;

      // The value shown in the dashboard and the value payable in the portal must
      // never diverge after an edit.
      const { error: pendingError } = await admin.from('maintenance_bills')
        .update({ amount, updated_at: now })
        .eq('billing_plan_id', planId)
        .in('status', ['pending', 'overdue']);
      if (pendingError) throw pendingError;

      return jsonResponse(request, { ok: true, next_issue_date: nextIssueDate });
    }

    const now = new Date().toISOString();
    const updates = action === 'pause' ? { status: 'paused' }
      : action === 'resume' ? { status: 'active' }
      : { status: 'cancelled', cancelled_at: now };
    if (action === 'delete') updates.deleted_at = now;
    updates.updated_at = now;
    const { error } = await admin.from('maintenance_billing_plans').update(updates).eq('id', planId);
    if (error) throw error;
    return jsonResponse(request, { ok: true, status: updates.status, deleted: action === 'delete' });
  } catch (error) {
    console.error(error);
    return jsonResponse(request, { error: error instanceof Error ? error.message : 'No pudimos actualizar la mantencion.' }, Number(error?.status) === 403 ? 403 : 500);
  }
});
