import { jsonResponse, verifyMercadoPagoSignature } from '../_shared/visit-booking.js';
import { syncAuthorizedPayment, syncPreapproval, syncSubscriptionPayment } from '../_shared/maintenance-subscriptions.js';

Deno.serve(async request => {
  if (request.method !== 'POST') return jsonResponse(request, { ok: true });
  try {
    const url = new URL(request.url);
    const body = await request.json().catch(() => ({}));
    const resourceId = String(url.searchParams.get('data.id') || body?.data?.id || '');
    const type = String(url.searchParams.get('type') || body?.type || '').toLowerCase();
    if (!resourceId) return jsonResponse(request, { error: 'Notificación sin identificador.' }, 400);
    const webhookSecret = Deno.env.get('MERCADOPAGO_SUBSCRIPTIONS_WEBHOOK_SECRET') || '';
    if (!(await verifyMercadoPagoSignature(request, resourceId, webhookSecret))) {
      return jsonResponse(request, { error: 'Firma de Mercado Pago inválida.' }, 401);
    }

    if (type === 'subscription_preapproval') await syncPreapproval(resourceId);
    else if (type === 'subscription_authorized_payment') await syncAuthorizedPayment(resourceId);
    else if (type === 'payment') await syncSubscriptionPayment(resourceId);
    else return jsonResponse(request, { ok: true, ignored: true });
    return jsonResponse(request, { ok: true });
  } catch (error) {
    console.error(error);
    return jsonResponse(request, { error: 'No se pudo procesar la notificación de suscripción.' }, 500);
  }
});
