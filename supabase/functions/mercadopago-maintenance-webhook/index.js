import { jsonResponse, verifyMercadoPagoSignature } from '../_shared/visit-booking.js';
import { syncManualMaintenancePayment } from '../_shared/maintenance-billing.js';

Deno.serve(async request => {
  if (request.method !== 'POST') return jsonResponse(request, { ok: true });
  try {
    const url = new URL(request.url);
    const body = await request.json().catch(() => ({}));
    const type = String(url.searchParams.get('type') || body?.type || '').toLowerCase();
    const paymentId = String(url.searchParams.get('data.id') || body?.data?.id || '');
    if (type && type !== 'payment') return jsonResponse(request, { ok: true, ignored: true });
    if (!/^\d+$/.test(paymentId)) return jsonResponse(request, { error: 'Notificacion invalida.' }, 400);
    const secret = Deno.env.get('MERCADOPAGO_MAINTENANCE_WEBHOOK_SECRET') || '';
    if (!(await verifyMercadoPagoSignature(request, paymentId, secret))) return jsonResponse(request, { error: 'Firma invalida.' }, 401);
    await syncManualMaintenancePayment(paymentId);
    return jsonResponse(request, { ok: true });
  } catch (error) {
    console.error(error);
    return jsonResponse(request, { error: 'No se pudo procesar el pago de mantencion.' }, 500);
  }
});

