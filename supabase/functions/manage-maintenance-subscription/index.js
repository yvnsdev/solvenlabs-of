import { createClient } from 'npm:@supabase/supabase-js@2.112.4';
import { corsHeaders, getAdminClient, jsonResponse } from '../_shared/visit-booking.js';
import { assertBillingAccess, mercadoPagoFetch, syncPreapproval } from '../_shared/maintenance-subscriptions.js';

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(request) });
  if (request.method !== 'POST') return jsonResponse(request, { error: 'Método no permitido.' }, 405);
  try {
    const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const url = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!token || !url || !anonKey) return jsonResponse(request, { error: 'Sesión no válida.' }, 401);
    const authClient = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) return jsonResponse(request, { error: 'Debes iniciar sesión en el dashboard.' }, 401);
    await assertBillingAccess(user.id);

    const body = await request.json();
    const subscriptionId = String(body.subscription_id || '');
    const action = String(body.action || '');
    const statusByAction = { pause: 'paused', resume: 'authorized', cancel: 'canceled' };
    const validAction = action === 'delete' || Boolean(statusByAction[action]);
    if (!/^[0-9a-f-]{36}$/i.test(subscriptionId) || !validAction) {
      return jsonResponse(request, { error: 'Acción o suscripción inválida.' }, 400);
    }

    const admin = getAdminClient();
    const { data: subscription } = await admin.from('maintenance_subscriptions')
      .select('mercado_pago_preapproval_id,deleted_at').eq('id', subscriptionId).maybeSingle();
    if (!subscription) return jsonResponse(request, { error: 'No encontramos la suscripción.' }, 404);
    if (subscription.deleted_at) return jsonResponse(request, { ok: true, deleted: true, already_applied: true });

    // Los intentos que fallaron antes de crear una autorización en Mercado
    // Pago se pueden retirar del dashboard sin hacer una llamada externa.
    if (!subscription.mercado_pago_preapproval_id) {
      if (action !== 'delete') return jsonResponse(request, { error: 'La suscripción aún no tiene autorización de Mercado Pago.' }, 409);
      const { error: deleteError } = await admin.from('maintenance_subscriptions').update({
        status: 'canceled',
        checkout_url: null,
        cancelled_at: new Date().toISOString(),
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }).eq('id', subscriptionId);
      if (deleteError) throw deleteError;
      return jsonResponse(request, { ok: true, deleted: true, remote_cancelled: false });
    }

    const currentPreapproval = await mercadoPagoFetch(
      `/preapproval/${encodeURIComponent(subscription.mercado_pago_preapproval_id)}`
    );
    const currentStatus = String(currentPreapproval.status || '').toLowerCase();
    const actionAlreadyApplied =
      (action === 'cancel' && ['cancelled', 'canceled'].includes(currentStatus)) ||
      (action === 'pause' && currentStatus === 'paused') ||
      (action === 'resume' && ['authorized', 'active'].includes(currentStatus));

    if (action === 'delete') {
      if (!['cancelled', 'canceled'].includes(currentStatus)) {
        await mercadoPagoFetch(`/preapproval/${encodeURIComponent(subscription.mercado_pago_preapproval_id)}`, {
          method: 'PUT',
          body: JSON.stringify({ status: 'canceled' })
        });
      }
      const now = new Date().toISOString();
      const { error: deleteError } = await admin.from('maintenance_subscriptions').update({
        status: 'canceled',
        mercado_pago_status: 'canceled',
        checkout_url: null,
        cancelled_at: now,
        deleted_at: now,
        updated_at: now
      }).eq('id', subscriptionId);
      if (deleteError) throw deleteError;
      return jsonResponse(request, { ok: true, deleted: true, remote_cancelled: true });
    }

    if (actionAlreadyApplied) {
      const synced = await syncPreapproval(subscription.mercado_pago_preapproval_id);
      return jsonResponse(request, { ok: true, status: synced.status, already_applied: true });
    }

    await mercadoPagoFetch(`/preapproval/${encodeURIComponent(subscription.mercado_pago_preapproval_id)}`, {
      method: 'PUT',
      body: JSON.stringify({ status: statusByAction[action] })
    });
    await syncPreapproval(subscription.mercado_pago_preapproval_id);
    return jsonResponse(request, { ok: true, status: statusByAction[action] });
  } catch (error) {
    console.error(error);
    const status = Number(error?.status) === 403 ? 403 : 500;
    return jsonResponse(request, { error: error instanceof Error ? error.message : 'No pudimos actualizar la suscripción.' }, status);
  }
});
