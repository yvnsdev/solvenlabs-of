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
const normalizeRut = value => String(value || '').replace(/[^0-9k]/gi, '').toLowerCase();
const validUuid = value => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const chileDate = () => new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit'
}).format(new Date());
const getPortalProject = async (admin, token) => {
  const normalizedToken = String(token || '').trim().toLowerCase();
  if (normalizedToken.length < 8 || normalizedToken.length > 160) return null;
  const { data, error } = await admin.from('projects')
    .select('id,client_id,client_token,client_visible,clients(name,company,rut,email,phone)')
    .eq('client_token', normalizedToken).eq('client_visible', true).maybeSingle();
  if (error) throw error;
  return data || null;
};
const mercadoPagoFetch = async (path, options = {}) => {
  const accessToken = Deno.env.get('MERCADOPAGO_SUBSCRIPTIONS_ACCESS_TOKEN') || Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
  if (!accessToken) throw new Error('Falta configurar MERCADOPAGO_SUBSCRIPTIONS_ACCESS_TOKEN.');
  const testMode = String(Deno.env.get('MERCADOPAGO_SUBSCRIPTIONS_TEST_MODE') || '').toLowerCase() === 'true';
  const response = await fetch(`https://api.mercadopago.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(testMode ? { 'X-scope': 'stage' } : {}),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Mercado Pago respondio ${response.status}.`);
  return data;
};

const isoDate = date => date.toISOString().slice(0, 10);
const addMonths = (dateString, count = 1) => {
  const [year, month, day] = String(dateString).split('-').map(Number);
  return isoDate(new Date(Date.UTC(year, month - 1 + count, Math.min(day, 28))));
};
const addDays = (dateString, count = 1) => isoDate(
  new Date(Date.parse(`${dateString}T00:00:00Z`) + count * 86400000)
);

const materializeNextBill = async (admin, plan) => {
  if (!plan || plan.status !== 'active' || plan.deleted_at) return [];
  const today = chileDate();
  const paymentAvailabilityDate = addDays(today, 7);
  let issueDate = String(plan.next_issue_date || '');
  if (!issueDate) return [];
  const { data: openBill, error: openBillError } = await admin.from('maintenance_bills')
    .select('id').eq('billing_plan_id', plan.id)
    .in('status', ['pending', 'overdue', 'payment_mismatch']).limit(1).maybeSingle();
  if (openBillError) throw openBillError;
  let latestDueDate = '';
  let guard = 0;
  // Publicamos el cobro hasta siete días antes de su fecha para que el cliente
  // pueda pagarlo cuando el dashboard lo marca como "Próxima a vencer".
  while (issueDate <= paymentAvailabilityDate && guard < 120) {
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

const validChileanRut = value => {
  const rut = normalizeRut(value);
  if (!/^\d{7,8}[0-9k]$/.test(rut)) return false;
  const body = rut.slice(0, -1);
  let sum = 0;
  let multiplier = 2;
  for (let index = body.length - 1; index >= 0; index -= 1) {
    sum += Number(body[index]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const result = 11 - (sum % 11);
  const checkDigit = result === 11 ? '0' : result === 10 ? 'k' : String(result);
  return rut.at(-1) === checkDigit;
};

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(request) });
  if (request.method !== 'POST') return jsonResponse(request, { error: 'Metodo no permitido.' }, 405);
  try {
    const body = await request.json();
    const token = String(body.project_token || '');
    const requestedRut = normalizeRut(body.customer_rut);
    const action = String(body.action || 'list');
    const admin = getAdminClient();
    const project = token ? await getPortalProject(admin, token) : null;
    if (!project && !requestedRut) return jsonResponse(request, { error: 'Ingresa el codigo del proyecto o el RUT del cliente.' }, 400);
    if (!project && !validChileanRut(requestedRut)) return jsonResponse(request, { error: 'El RUT ingresado no es valido.' }, 400);
    const normalizedRut = project ? normalizeRut(project.clients?.rut) : requestedRut;
    const { data: plans, error: plansError } = await admin.from('maintenance_billing_plans')
      .select('*').eq('status', 'active').is('deleted_at', null);
    if (plansError) throw plansError;
    const matchingPlans = (plans || []).filter(plan => (
      (project && plan.project_id === project.id) ||
      (normalizedRut && normalizeRut(plan.customer_rut) === normalizedRut)
    ));
    for (const plan of matchingPlans) await materializeNextBill(admin, plan);

    const planIds = matchingPlans.map(plan => plan.id);
    let bills = [];
    if (planIds.length) {
      const today = chileDate();
      const { error: overdueError } = await admin.from('maintenance_bills')
        .update({ status: 'overdue', updated_at: new Date().toISOString() })
        .in('billing_plan_id', planIds).eq('status', 'pending').lt('due_at', today);
      if (overdueError) throw overdueError;
      const { data, error } = await admin.from('maintenance_bills')
        .select('id,billing_plan_id,period_start,issued_at,due_at,amount,currency,status,paid_at,mercado_pago_status,maintenance_billing_plans(plan_name)')
        .in('billing_plan_id', planIds).neq('status', 'cancelled').order('issued_at', { ascending: false }).limit(36);
      if (error) throw error;
      const latestOpen = (data || []).find(bill => ['pending', 'overdue', 'payment_mismatch'].includes(String(bill.status || '').toLowerCase()));
      const latestPaid = (data || []).find(bill => String(bill.status || '').toLowerCase() === 'paid');
      const latestRelevant = latestOpen || latestPaid || (data || [])[0];
      bills = latestRelevant ? [latestRelevant] : [];
    }
    const customerPlan = matchingPlans[0] || null;
    const customer = customerPlan ? {
      name: customerPlan.customer_name || 'Cliente Solven Labs',
      rut: customerPlan.customer_rut || '',
      plan_name: customerPlan.plan_name || 'Mantencion mensual'
    } : null;
    if (action === 'list') return jsonResponse(request, { bills, customer });
    if (action !== 'checkout') return jsonResponse(request, { error: 'Accion no valida.' }, 400);

    const requestedBillIds = Array.isArray(body.bill_ids) ? body.bill_ids : [body.bill_id];
    const billIds = [...new Set(requestedBillIds.map(value => String(value || '')).filter(Boolean))];
    if (!billIds.length || billIds.length > 6 || billIds.some(id => !validUuid(id))) {
      return jsonResponse(request, { error: 'Selecciona entre 1 y 6 periodos validos.' }, 400);
    }
    const selectedBills = billIds.map(id => bills.find(item => item.id === id)).filter(Boolean);
    if (selectedBills.length !== billIds.length) return jsonResponse(request, { error: 'Uno de los cobros no pertenece a este portal.' }, 404);
    if (selectedBills.some(bill => !['pending', 'overdue'].includes(bill.status))) {
      return jsonResponse(request, { error: 'Todos los periodos seleccionados deben estar pendientes o vencidos.' }, 409);
    }
    const currencies = [...new Set(selectedBills.map(bill => String(bill.currency || 'CLP').toUpperCase()))];
    if (currencies.length !== 1) return jsonResponse(request, { error: 'Los periodos seleccionados deben usar la misma moneda.' }, 409);

    const siteUrl = (Deno.env.get('PUBLIC_SITE_URL') || 'https://solvenlabs.cl').replace(/\/$/, '');
    const returnAccess = project
      ? `token=${encodeURIComponent(token)}`
      : `maintenance_rut=${encodeURIComponent(normalizedRut)}`;
    const returnBase = `${siteUrl}/proyecto?${returnAccess}&maintenance_bills=${encodeURIComponent(billIds.join(','))}`;
    const payerEmail = project?.clients?.email || customerPlan?.customer_email || undefined;
    const reference = billIds.length === 1 ? `maintenance_bill:${billIds[0]}` : `maintenance_bills:${billIds.join(',')}`;
    const idempotencySource = [...billIds].sort().join(',');
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(idempotencySource));
    const idempotencyHash = [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('').slice(0, 32);
    const preference = await mercadoPagoFetch('/checkout/preferences', {
      method: 'POST',
      headers: { 'X-Idempotency-Key': `maintenance-${idempotencyHash}` },
      body: JSON.stringify({
        items: selectedBills.map((bill, index) => ({
          id: bill.id,
          title: selectedBills.length === 1
            ? `Mantencion ${bill.maintenance_billing_plans?.plan_name || 'mensual'}`
            : `Mantencion Solven Labs - periodo ${index + 1} de ${selectedBills.length}`,
          quantity: 1,
          currency_id: currencies[0],
          unit_price: Number(bill.amount)
        })),
        payer: { email: payerEmail },
        external_reference: reference,
        notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-maintenance-webhook`,
        back_urls: { success: `${returnBase}&maintenance_payment=success`, pending: `${returnBase}&maintenance_payment=pending`, failure: `${returnBase}&maintenance_payment=failure` },
        auto_return: 'approved',
        statement_descriptor: 'Solven Labs MANTENCION'
      })
    });
    if (!preference.id || !preference.init_point) throw new Error('Mercado Pago no devolvio el checkout.');
    const { error: updateError } = await admin.from('maintenance_bills').update({
      mercado_pago_preference_id: String(preference.id), checkout_url: String(preference.init_point), updated_at: new Date().toISOString()
    }).in('id', billIds);
    if (updateError) throw updateError;
    return jsonResponse(request, { checkout_url: preference.init_point });
  } catch (error) {
    console.error(error);
    return jsonResponse(request, { error: error instanceof Error ? error.message : 'No pudimos cargar la mantencion.' }, 500);
  }
});
