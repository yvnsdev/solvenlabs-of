import { getAdminClient } from './visit-booking.js';

export const maintenancePlans = Object.freeze({
  presencia: { name: 'Presencia Digital', amount: 39900 },
  impulso: { name: 'Impulso Comercial', amount: 89900 },
  operacion: { name: 'Operación Inteligente', amount: 179900 }
});

export const assertBillingAccess = async userId => {
  const admin = getAdminClient();
  const { data: profile, error } = await admin.from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  const role = String(profile?.role || '').trim().toLowerCase();
  if (!['administracion', 'administrador', 'administrator', 'admin', 'contabilidad'].includes(role)) {
    const accessError = new Error('No tienes permisos de Facturación para administrar suscripciones.');
    accessError.status = 403;
    throw accessError;
  }
  return profile;
};

export const mercadoPagoFetch = async (path, options = {}) => {
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
  if (!response.ok) throw new Error(data.message || `Mercado Pago respondió ${response.status}.`);
  return data;
};

const validUuid = value => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export const syncPreapproval = async preapprovalId => {
  const admin = getAdminClient();
  const preapproval = await mercadoPagoFetch(`/preapproval/${encodeURIComponent(preapprovalId)}`);
  const subscriptionId = String(preapproval.external_reference || '');
  if (!validUuid(subscriptionId)) throw new Error('La suscripción no pertenece a Solven Labs.');

  const { data: local, error: localError } = await admin.from('maintenance_subscriptions')
    .select('id,amount,currency').eq('id', subscriptionId).single();
  if (localError || !local) throw new Error('No encontramos la suscripción local.');

  const amount = Number(preapproval.auto_recurring?.transaction_amount || 0);
  const currency = String(preapproval.auto_recurring?.currency_id || '');
  const status = String(preapproval.status || 'pending').toLowerCase();
  const mismatch = amount !== Number(local.amount) || currency !== local.currency;
  const updates = {
    mercado_pago_preapproval_id: String(preapproval.id),
    mercado_pago_status: status,
    status: mismatch ? 'payment_mismatch' : status,
    next_payment_date: preapproval.next_payment_date || null,
    updated_at: new Date().toISOString()
  };
  if (['authorized', 'active'].includes(status) && !mismatch) updates.activated_at = new Date().toISOString();
  if (['cancelled', 'canceled'].includes(status)) updates.cancelled_at = new Date().toISOString();
  const { error } = await admin.from('maintenance_subscriptions').update(updates).eq('id', subscriptionId);
  if (error) throw error;
  return { subscriptionId, preapproval, status: updates.status };
};

export const syncAuthorizedPayment = async authorizedPaymentId => {
  const admin = getAdminClient();
  const invoice = await mercadoPagoFetch(`/authorized_payments/${encodeURIComponent(authorizedPaymentId)}`);
  const preapprovalId = String(invoice.preapproval_id || invoice.subscription_id || '');
  if (!preapprovalId) throw new Error('El cobro no informa su suscripción.');
  const synced = await syncPreapproval(preapprovalId);
  const status = String(invoice.payment?.status || invoice.summarized || invoice.status || 'pending').toLowerCase();
  const paymentId = String(invoice.payment_id || invoice.payment?.id || '');
  const amount = Number(invoice.transaction_amount || invoice.amount || synced.preapproval.auto_recurring?.transaction_amount || 0);
  const currency = String(invoice.currency_id || synced.preapproval.auto_recurring?.currency_id || 'CLP');
  const chargedAt = invoice.debit_date || invoice.date_created || new Date().toISOString();
  const { data, error } = await admin.rpc('register_maintenance_subscription_payment', {
    p_subscription_id: synced.subscriptionId,
    p_authorized_payment_id: String(invoice.id || authorizedPaymentId),
    p_payment_id: paymentId,
    p_status: status,
    p_amount: amount,
    p_currency: currency,
    p_charged_at: chargedAt
  });
  if (error) throw error;
  return { subscriptionId: synced.subscriptionId, invoice, result: data };
};

export const syncSubscriptionPayment = async paymentId => {
  const admin = getAdminClient();
  const payment = await mercadoPagoFetch(`/v1/payments/${encodeURIComponent(paymentId)}`);
  let subscriptionId = String(payment.external_reference || '');
  const preapprovalId = String(
    payment.metadata?.preapproval_id ||
    payment.point_of_interaction?.transaction_data?.subscription_id ||
    payment.subscription_id || ''
  );
  if (!validUuid(subscriptionId) && preapprovalId) subscriptionId = (await syncPreapproval(preapprovalId)).subscriptionId;
  if (!validUuid(subscriptionId)) throw new Error('El pago no pertenece a una mantención Solven Labs.');

  const { data: localSubscription } = await admin.from('maintenance_subscriptions')
    .select('id').eq('id', subscriptionId).maybeSingle();
  if (!localSubscription) return { subscriptionId, payment, ignored: true };

  const { data, error } = await admin.rpc('register_maintenance_subscription_payment', {
    p_subscription_id: subscriptionId,
    p_authorized_payment_id: String(payment.order?.id || `payment-${payment.id}`),
    p_payment_id: String(payment.id),
    p_status: String(payment.status || 'pending'),
    p_amount: Number(payment.transaction_amount || 0),
    p_currency: String(payment.currency_id || ''),
    p_charged_at: payment.date_approved || payment.date_created || new Date().toISOString()
  });
  if (error) throw error;
  return { subscriptionId, payment, result: data };
};
