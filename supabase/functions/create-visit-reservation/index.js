import { createClient } from 'npm:@supabase/supabase-js@2.112.4';

const corsHeaders = request => {
  const origin = request.headers.get('origin') || '';
  const configured = (Deno.env.get('BOOKING_ALLOWED_ORIGINS') || 'https://solvenlabs.cl,https://www.solvenlabs.cl')
    .split(',').map(value => value.trim()).filter(Boolean);
  const allowedOrigin = configured.includes(origin)
    || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
    ? origin
    : configured[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info, x-signature, x-request-id',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin'
  };
};

const jsonResponse = (request, body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders(request), 'Content-Type': 'application/json; charset=utf-8' }
});

const getAdminClient = () => {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceRole) throw new Error('Supabase no está configurado en la función.');
  return createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
};

const chileToday = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
};

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(request) });
  if (request.method !== 'POST') return jsonResponse(request, { error: 'Método no permitido.' }, 405);
  try {
    const body = await request.json();
    const serviceName = String(body.service_name || '').trim().slice(0, 120);
    const customerName = String(body.customer_name || '').trim().slice(0, 100);
    const customerEmail = String(body.customer_email || '').trim().toLowerCase().slice(0, 160);
    const customerPhone = String(body.customer_phone || '').trim().slice(0, 30);
    const visitDate = String(body.visit_date || '');
    const visitTime = String(body.visit_time || '');

    if (serviceName.length < 3 || customerName.length < 3 || !/^\S+@\S+\.\S+$/.test(customerEmail) || customerPhone.length < 8) {
      return jsonResponse(request, { error: 'Completa correctamente tus datos de contacto.' }, 400);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(visitDate) || !/^(1[0-7]):00$/.test(visitTime)) {
      return jsonResponse(request, { error: 'Elige una fecha y un horario válido entre las 10:00 y las 18:00.' }, 400);
    }

    const today = chileToday();
    const dateAtNoon = new Date(`${visitDate}T12:00:00Z`);
    const maxDate = new Date(`${today}T12:00:00Z`);
    maxDate.setUTCDate(maxDate.getUTCDate() + 90);
    if (visitDate < today || dateAtNoon > maxDate || dateAtNoon.getUTCDay() === 0) {
      return jsonResponse(request, { error: 'Las visitas se reservan de lunes a sábado y hasta con 90 días de anticipación.' }, 400);
    }

    const admin = getAdminClient();
    const nowIso = new Date().toISOString();
    await admin.from('visit_reservations').update({ status: 'expired', updated_at: nowIso })
      .eq('status', 'pending').lt('expires_at', nowIso);

    const expiresAt = new Date(Date.now() + 20 * 60 * 1000);
    const endHour = String(Number(visitTime.slice(0, 2)) + 1).padStart(2, '0');
    const { data: slotResult, error: insertError } = await admin.rpc('create_pending_visit_reservation', {
      p_service_name: serviceName,
      p_customer_name: customerName,
      p_customer_email: customerEmail,
      p_customer_phone: customerPhone,
      p_visit_date: visitDate,
      p_visit_time: `${visitTime}:00`,
      p_end_time: `${endHour}:00:00`,
      p_expires_at: expiresAt.toISOString()
    });

    if (insertError) {
      if (insertError.code === '23505') return jsonResponse(request, { error: 'Ese horario está temporalmente reservado. Prueba con otro.' }, 409);
      throw insertError;
    }
    if (!slotResult?.ok) {
      return jsonResponse(request, { error: 'Ese horario acaba de ocuparse. Elige otro y continuamos.' }, 409);
    }
    const reservation = {
      id: slotResult.reservation_id,
      expires_at: slotResult.expires_at
    };

    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const siteUrl = (Deno.env.get('PUBLIC_SITE_URL') || 'https://solvenlabs.cl').replace(/\/$/, '');
    if (!accessToken || !supabaseUrl) throw new Error('El sistema de pagos aún no está configurado.');

    const returnBase = `${siteUrl}/?reservation_id=${encodeURIComponent(reservation.id)}`;
    const preferenceResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': reservation.id
      },
      body: JSON.stringify({
        items: [{
          id: 'ntek-visita-tecnica',
          title: `Reserva visita técnica Solven Labs · ${serviceName}`,
          description: `${visitDate} a las ${visitTime}`,
          quantity: 1,
          currency_id: 'CLP',
          unit_price: 5000
        }],
        payer: { name: customerName, email: customerEmail, phone: { number: customerPhone } },
        external_reference: reservation.id,
        notification_url: `${supabaseUrl}/functions/v1/mercadopago-visit-webhook`,
        back_urls: {
          success: `${returnBase}&visit_payment=success`,
          pending: `${returnBase}&visit_payment=pending`,
          failure: `${returnBase}&visit_payment=failure`
        },
        auto_return: 'approved',
        expires: true,
        expiration_date_from: new Date().toISOString(),
        expiration_date_to: expiresAt.toISOString(),
        statement_descriptor: 'Solven Labs'
      })
    });
    const preference = await preferenceResponse.json();
    if (!preferenceResponse.ok || !preference.init_point) {
      await admin.from('visit_reservations').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', reservation.id);
      throw new Error(preference.message || 'Mercado Pago no pudo iniciar el cobro.');
    }

    await admin.from('visit_reservations').update({
      mercado_pago_preference_id: String(preference.id), updated_at: new Date().toISOString()
    }).eq('id', reservation.id);

    return jsonResponse(request, {
      reservation_id: reservation.id,
      payment_url: preference.init_point,
      expires_at: reservation.expires_at
    });
  } catch (error) {
    console.error(error);
    return jsonResponse(request, { error: error instanceof Error ? error.message : 'No pudimos iniciar la reserva.' }, 500);
  }
});
