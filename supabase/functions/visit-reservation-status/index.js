import {
  corsHeaders, getAdminClient, jsonResponse, syncMercadoPagoPayment
} from '../_shared/visit-booking.js';

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(request) });
  if (request.method !== 'POST') return jsonResponse(request, { error: 'Método no permitido.' }, 405);
  try {
    const body = await request.json();
    const reservationId = String(body.reservation_id || '');
    const paymentId = String(body.payment_id || '');
    if (!/^[0-9a-f-]{36}$/i.test(reservationId)) return jsonResponse(request, { error: 'Reserva inválida.' }, 400);

    if (/^\d+$/.test(paymentId)) {
      const synced = await syncMercadoPagoPayment(paymentId);
      if (synced.reservationId !== reservationId) return jsonResponse(request, { error: 'El pago no corresponde a esta reserva.' }, 403);
    }

    const admin = getAdminClient();
    const { data: current } = await admin.from('visit_reservations')
      .select('id,status,service_name,visit_date,visit_time,expires_at')
      .eq('id', reservationId).maybeSingle();
    if (!current) return jsonResponse(request, { error: 'No encontramos esta reserva.' }, 404);

    if (current.status === 'pending' && new Date(current.expires_at).getTime() < Date.now()) {
      await admin.from('visit_reservations').update({ status: 'expired', updated_at: new Date().toISOString() }).eq('id', reservationId);
      current.status = 'expired';
    }

    return jsonResponse(request, { reservation: current });
  } catch (error) {
    console.error(error);
    return jsonResponse(request, { error: 'No pudimos validar el pago todavía.' }, 500);
  }
});
