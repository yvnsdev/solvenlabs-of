import { createClient } from 'npm:@supabase/supabase-js@2.112.4';

const corsHeaders = request => {
  const origin = request.headers.get('origin') || '';
  const configuredOrigins = (
    Deno.env.get('BOOKING_ALLOWED_ORIGINS')
    || 'https://solvenlabs.cl,https://www.solvenlabs.cl'
  )
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);

  const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  const allowedOrigin = configuredOrigins.includes(origin) || isLocalhost
    ? origin
    : configuredOrigins[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin'
  };
};

const jsonResponse = (request, body, status = 200) => new Response(
  JSON.stringify(body),
  {
    status,
    headers: {
      ...corsHeaders(request),
      'Content-Type': 'application/json; charset=utf-8'
    }
  }
);

const getAdminClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase no está configurado en la función.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
};

const requirePublicClient = request => {
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
  const bearerToken = (request.headers.get('authorization') || '')
    .replace(/^Bearer\s+/i, '');

  return Boolean(anonKey && bearerToken === anonKey);
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
  if (!requirePublicClient(request)) return jsonResponse(request, { error: 'Solicitud no autorizada.' }, 401);

  try {
    const body = await request.json();
    const customerName = String(body.customer_name || '').trim().slice(0, 100);
    const customerEmail = String(body.customer_email || '').trim().toLowerCase().slice(0, 160);
    const customerPhone = String(body.customer_phone || '').trim().slice(0, 30);
    const company = String(body.company || '').trim().slice(0, 120);
    const topic = String(body.topic || '').trim().slice(0, 500);
    const bookingDate = String(body.booking_date || '');
    const bookingTime = String(body.booking_time || '');

    if (customerName.length < 3 || !/^\S+@\S+\.\S+$/.test(customerEmail) || customerPhone.length < 8) {
      return jsonResponse(request, { error: 'Completa correctamente tus datos de contacto.' }, 400);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(bookingDate) || !/^(1[0-7]):00$/.test(bookingTime)) {
      return jsonResponse(request, { error: 'Elige una fecha y un horario válido.' }, 400);
    }

    const today = chileToday();
    const dateAtNoon = new Date(`${bookingDate}T12:00:00Z`);
    const maxDate = new Date(`${today}T12:00:00Z`);
    maxDate.setUTCDate(maxDate.getUTCDate() + 90);
    if (bookingDate < today || dateAtNoon > maxDate || dateAtNoon.getUTCDay() === 0) {
      return jsonResponse(request, { error: 'Las reuniones se agendan de lunes a sábado y hasta con 90 días de anticipación.' }, 400);
    }
    if (bookingDate === today) {
      const currentHour = Number(new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Santiago', hour: '2-digit', hourCycle: 'h23'
      }).format(new Date()));
      if (Number(bookingTime.slice(0, 2)) <= currentHour) {
        return jsonResponse(request, { error: 'Ese horario ya pasó. Elige uno posterior.' }, 400);
      }
    }

    const admin = getAdminClient();
    const nowIso = new Date().toISOString();
    await admin.from('visit_reservations').update({ status: 'expired', updated_at: nowIso })
      .eq('status', 'pending').lt('expires_at', nowIso);

    const endTime = `${bookingTime.slice(0, 2)}:30:00`;
    const { data, error } = await admin.rpc('book_free_consultation', {
      p_customer_name: customerName,
      p_customer_email: customerEmail,
      p_customer_phone: customerPhone,
      p_company: company,
      p_topic: topic,
      p_booking_date: bookingDate,
      p_booking_time: `${bookingTime}:00`,
      p_end_time: endTime
    });
    if (error) throw error;
    if (!data?.ok) {
      const status = data?.status || 'unavailable';
      return jsonResponse(request, {
        error: status === 'unavailable'
          ? 'Ese horario acaba de ocuparse. Elige otro disponible.'
          : 'No pudimos confirmar la reunión.'
      }, status === 'unavailable' ? 409 : 400);
    }

    return jsonResponse(request, {
      ok: true,
      booking_id: data.booking_id,
      event_id: data.event_id,
      booking_date: bookingDate,
      booking_time: bookingTime
    });
  } catch (error) {
    console.error(error);
    return jsonResponse(request, { error: error instanceof Error ? error.message : 'No pudimos agendar la reunión.' }, 500);
  }
});
