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
const maintenancePlans = Object.freeze({
  presencia: { name: 'Presencia Digital', amount: 39900 },
  impulso: { name: 'Impulso Comercial', amount: 89900 },
  operacion: { name: 'Operación Inteligente', amount: 179900 }
});
const normalizeRut = value => String(value || '').replace(/[^0-9k]/gi, '').toLowerCase();
const formatRut = value => {
  const clean = normalizeRut(value).slice(0, 9);
  if (!clean) return '';
  if (clean.length === 1) return clean.toUpperCase();
  const body = clean.slice(0, -1);
  return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${clean.slice(-1).toUpperCase()}`;
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

const isoDate = date => date.toISOString().slice(0, 10);
const addMonths = (dateString, count = 1) => {
  const [year, month, day] = String(dateString).split('-').map(Number);
  return isoDate(new Date(Date.UTC(year, month - 1 + count, Math.min(day, 28))));
};

const materializeNextBill = async (admin, plan) => {
  if (!plan || plan.status !== 'active' || plan.deleted_at) return [];
  const today = chileDate();
  let issueDate = String(plan.next_issue_date || '');
  if (!issueDate) return [];
  const { data: openBill, error: openBillError } = await admin.from('maintenance_bills')
    .select('id').eq('billing_plan_id', plan.id)
    .in('status', ['pending', 'overdue', 'payment_mismatch']).limit(1).maybeSingle();
  if (openBillError) throw openBillError;
  let latestDueDate = '';
  let guard = 0;
  while (issueDate <= today && guard < 120) {
    latestDueDate = issueDate;
    issueDate = addMonths(issueDate);
    guard += 1;
  }
  if (issueDate <= today) throw new Error('No pudimos normalizar la fecha de la mantencion.');
  const created = [];
  if (!openBill && latestDueDate) {
    const dueAt = isoDate(new Date(Date.parse(`${latestDueDate}T00:00:00Z`) + 10 * 86400000));
    const { data, error } = await admin.from('maintenance_bills').upsert({
      billing_plan_id: plan.id, project_id: plan.project_id, customer_rut: plan.customer_rut,
      period_start: latestDueDate, issued_at: latestDueDate, due_at: dueAt,
      amount: plan.amount, currency: plan.currency || 'CLP', status: 'pending'
    }, { onConflict: 'billing_plan_id,period_start', ignoreDuplicates: true }).select().maybeSingle();
    if (error) throw error;
    if (data) created.push(data);
  }
  if (issueDate !== plan.next_issue_date) {
    const { error } = await admin.from('maintenance_billing_plans')
      .update({ next_issue_date: issueDate, updated_at: new Date().toISOString() }).eq('id', plan.id);
    if (error) throw error;
  }
  return created;
};

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(request) });
  if (request.method !== 'POST') return jsonResponse(request, { error: 'Metodo no permitido.' }, 405);
  try {
    const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const url = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!token || !url || !anonKey) return jsonResponse(request, { error: 'Sesion no valida.' }, 401);
    const auth = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: { user }, error: authError } = await auth.auth.getUser(token);
    if (authError || !user) return jsonResponse(request, { error: 'Debes iniciar sesion en el dashboard.' }, 401);
    await assertBillingAccess(user.id);

    const body = await request.json();
    const projectId = String(body.project_id || '');
    const planCode = String(body.plan_code || '');
    const customName = String(body.custom_plan_name || '').trim().slice(0, 80);
    const customAmount = Number(body.custom_amount || 0);
    const basePlan = planCode === 'custom' ? { name: customName, amount: customAmount } : maintenancePlans[planCode];
    const firstIssueDate = String(body.first_issue_date || '');
    if (body.balance_confirmed !== true) return jsonResponse(request, { error: 'Confirma primero el pago del saldo del proyecto.' }, 400);
    if (!validUuid(projectId) || !basePlan) return jsonResponse(request, { error: 'Proyecto o plan no valido.' }, 400);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(firstIssueDate)) return jsonResponse(request, { error: 'Indica la primera fecha de facturacion.' }, 400);
    const parsedIssueDate = new Date(`${firstIssueDate}T00:00:00Z`);
    if (Number.isNaN(parsedIssueDate.valueOf()) || parsedIssueDate.toISOString().slice(0, 10) !== firstIssueDate) {
      return jsonResponse(request, { error: 'La fecha de facturacion no es valida.' }, 400);
    }
    if (firstIssueDate < chileDate()) {
      return jsonResponse(request, { error: 'La fecha programada del proximo cobro no puede estar en el pasado.' }, 400);
    }
    if (planCode === 'custom' && (customName.length < 3 || !Number.isInteger(customAmount) || customAmount < 1000 || customAmount > 5000000)) {
      return jsonResponse(request, { error: 'El nombre o monto personalizado no es valido.' }, 400);
    }

    const admin = getAdminClient();
    const { data: project, error: projectError } = await admin.from('projects')
      .select('id,name,client_id,clients(name,company,rut,email,phone)')
      .eq('id', projectId).maybeSingle();
    if (projectError || !project) return jsonResponse(request, { error: 'No encontramos el proyecto.' }, 404);
    const client = Array.isArray(project.clients) ? project.clients[0] : project.clients;
    const { data: existingPlan, error: existingError } = await admin.from('maintenance_billing_plans')
      .select('id').eq('project_id', projectId).in('status', ['active', 'paused']).is('deleted_at', null).maybeSingle();
    if (existingError) throw existingError;
    if (existingPlan) return jsonResponse(request, { error: 'Este proyecto ya tiene una mantencion mensual activa o pausada.' }, 409);
    const normalizedCustomerRut = normalizeRut(client?.rut);
    if (normalizedCustomerRut.length < 8) return jsonResponse(request, { error: 'El cliente vinculado al proyecto debe tener un RUT valido.' }, 400);
    const customerRut = formatRut(normalizedCustomerRut);
    const billingDay = Number(firstIssueDate.slice(8, 10));
    if (billingDay < 1 || billingDay > 28) return jsonResponse(request, { error: 'El dia de facturacion debe estar entre el 1 y el 28.' }, 400);

    const { data: plan, error: insertError } = await admin.from('maintenance_billing_plans').insert({
      project_id: project.id,
      client_id: project.client_id,
      plan_code: planCode,
      plan_name: basePlan.name,
      amount: basePlan.amount,
      customer_name: client?.company || client?.name || project.name,
      customer_rut: customerRut,
      customer_email: client?.email || null,
      customer_phone: client?.phone || null,
      billing_day: billingDay,
      next_issue_date: firstIssueDate,
      status: 'active',
      balance_confirmed_at: new Date().toISOString()
    }).select('*').single();
    if (insertError) throw insertError;
    await materializeNextBill(admin, plan);
    return jsonResponse(request, { ok: true, plan_id: plan.id });
  } catch (error) {
    console.error(error);
    return jsonResponse(request, { error: error instanceof Error ? error.message : 'No pudimos activar la facturacion de mantencion.' }, Number(error?.status) === 403 ? 403 : 500);
  }
});
