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
    const { date = '' } = await request.json();
    const bookingDate = String(date);
    // La agenda pública se muestra por franjas horarias completas. Cualquier
    // cruce dentro de una hora la deja ocupada, aunque el evento interno dure
    // solo 15 o 30 minutos.
    const slotDuration = 60;
    const today = chileToday();
    const dateAtNoon = new Date(`${bookingDate}T12:00:00Z`);
    const maxDate = new Date(`${today}T12:00:00Z`);
    maxDate.setUTCDate(maxDate.getUTCDate() + 90);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(bookingDate) || bookingDate < today
      || dateAtNoon > maxDate || dateAtNoon.getUTCDay() === 0) {
      return jsonResponse(request, { error: 'Elige un día válido entre lunes y sábado.' }, 400);
    }

    const admin = getAdminClient();
    const nowIso = new Date().toISOString();
    await admin.from('visit_reservations').update({ status: 'expired', updated_at: nowIso })
      .eq('status', 'pending').lt('expires_at', nowIso);

    const [eventsResult, reservationsResult] = await Promise.all([
      admin.from('events').select('start_time,end_time').eq('event_date', bookingDate).not('start_time', 'is', null),
      admin.from('visit_reservations').select('visit_time,end_time')
        .eq('visit_date', bookingDate).in('status', ['pending', 'approved'])
    ]);
    if (eventsResult.error) throw eventsResult.error;
    if (reservationsResult.error) throw reservationsResult.error;

    const occupied = new Set();
    const toMinutes = value => {
      const [hours, minutes] = String(value || '').split(':').map(Number);
      return (hours * 60) + (minutes || 0);
    };
    const intervals = [
      ...(eventsResult.data || []).map(row => ({
        start: toMinutes(row.start_time),
        end: row.end_time ? toMinutes(row.end_time) : toMinutes(row.start_time) + 60
      })),
      ...(reservationsResult.data || []).map(row => ({
        start: toMinutes(row.visit_time),
        end: row.end_time ? toMinutes(row.end_time) : toMinutes(row.visit_time) + 60
      }))
    ];
    for (let hour = 10; hour <= 17; hour += 1) {
      const slotStart = hour * 60;
      const slotEnd = slotStart + slotDuration;
      if (intervals.some(interval => interval.start < slotEnd && interval.end > slotStart)) {
        occupied.add(`${String(hour).padStart(2, '0')}:00`);
      }
    }
    if (bookingDate === today) {
      const currentHour = Number(new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Santiago', hour: '2-digit', hourCycle: 'h23'
      }).format(new Date()));
      for (let hour = 10; hour <= Math.min(17, currentHour); hour += 1) {
        occupied.add(`${String(hour).padStart(2, '0')}:00`);
      }
    }
    return jsonResponse(request, { date: bookingDate, occupied: [...occupied].sort() });
  } catch (error) {
    console.error(error);
    return jsonResponse(request, { error: error instanceof Error ? error.message : 'No pudimos consultar la disponibilidad.' }, 500);
  }
});
