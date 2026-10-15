import {
  jsonResponse, syncMercadoPagoPayment, verifyMercadoPagoSignature
} from '../_shared/visit-booking.js';

Deno.serve(async request => {
  if (request.method !== 'POST') return jsonResponse(request, { ok: true });

  try {
    const url = new URL(request.url);
    const body = await request.json().catch(() => ({}));
    const paymentId = String(url.searchParams.get('data.id') || body?.data?.id || '');
    const type = String(url.searchParams.get('type') || body?.type || '');
    if (type && type !== 'payment') return jsonResponse(request, { ok: true, ignored: true });
    if (!/^\d+$/.test(paymentId)) return jsonResponse(request, { error: 'Notificación inválida.' }, 400);

    if (!(await verifyMercadoPagoSignature(request, paymentId))) {
      return jsonResponse(request, { error: 'Firma de Mercado Pago inválida.' }, 401);
    }

    await syncMercadoPagoPayment(paymentId);
    return jsonResponse(request, { ok: true });
  } catch (error) {
    console.error(error);
    return jsonResponse(request, { error: 'No se pudo procesar la notificación.' }, 500);
  }
});
