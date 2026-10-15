import { createClient } from 'npm:@supabase/supabase-js@2.112.4';

export const corsHeaders = request => {
  const origin = request.headers.get('origin') || '';
  const configured = (Deno.env.get('BOOKING_ALLOWED_ORIGINS') || 'https://solvenlabs.cl,https://www.solvenlabs.cl')
    .split(',').map(value => value.trim()).filter(Boolean);
  const allowedOrigin = configured.includes(origin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
    ? origin
    : configured[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info, x-signature, x-request-id',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin'
  };
};

export const jsonResponse = (request, body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders(request), 'Content-Type': 'application/json; charset=utf-8' }
});

export const getAdminClient = () => {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceRole) throw new Error('Supabase no está configurado en la función.');
  return createClient(url, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } });
};

export const requirePublicClient = request => {
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
  const bearer = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  return Boolean(anonKey && bearer === anonKey);
};

const getMercadoPagoPayment = async paymentId => {
  const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
  if (!accessToken) throw new Error('Falta configurar MERCADOPAGO_ACCESS_TOKEN.');
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!response.ok) throw new Error(`Mercado Pago respondió ${response.status}.`);
  return await response.json();
};

export const syncMercadoPagoPayment = async paymentId => {
  const admin = getAdminClient();
  const payment = await getMercadoPagoPayment(paymentId);
  const reservationId = String(payment.external_reference || '');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(reservationId)) {
    throw new Error('El pago no pertenece a una reserva Solven Labs.');
  }

  if (payment.status === 'approved') {
    const { data, error } = await admin.rpc('confirm_paid_visit_reservation', {
      p_reservation_id: reservationId,
      p_payment_id: String(payment.id),
      p_mp_status: String(payment.status),
      p_amount: Number(payment.transaction_amount),
      p_currency: String(payment.currency_id || '')
    });
    if (error) throw error;
    return { reservationId, payment, result: data };
  }

  const terminalStatus = ['rejected', 'cancelled'].includes(payment.status) ? payment.status : null;
  const updates = {
    mercado_pago_payment_id: String(payment.id),
    mercado_pago_status: String(payment.status || 'unknown'),
    updated_at: new Date().toISOString()
  };
  if (terminalStatus) updates.status = terminalStatus;
  const { error } = await admin.from('visit_reservations').update(updates).eq('id', reservationId);
  if (error) throw error;
  return { reservationId, payment, result: { ok: false, status: terminalStatus || 'pending' } };
};

const hex = buffer => [...new Uint8Array(buffer)].map(byte => byte.toString(16).padStart(2, '0')).join('');

const constantTimeEqual = (left, right) => {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
};

export const verifyMercadoPagoSignature = async (request, dataId, secretOverride = '') => {
  const secret = secretOverride || Deno.env.get('MERCADOPAGO_WEBHOOK_SECRET');
  const signature = request.headers.get('x-signature') || '';
  const requestId = request.headers.get('x-request-id') || '';
  if (!secret || !signature || !requestId || !dataId) return false;

  const parts = Object.fromEntries(signature.split(',').map(part => {
    const [key, value] = part.trim().split('=', 2);
    return [key, value];
  }));
  if (!parts.ts || !parts.v1) return false;

  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${parts.ts};`;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(manifest));
  return constantTimeEqual(hex(digest), parts.v1.toLowerCase());
};
