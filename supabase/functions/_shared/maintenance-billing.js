import { getAdminClient } from './visit-booking.js';
import { assertBillingAccess, maintenancePlans, mercadoPagoFetch } from './maintenance-subscriptions.js';

export { assertBillingAccess, maintenancePlans, mercadoPagoFetch };

export const normalizeRut = value => String(value || '').replace(/[^0-9k]/gi, '').toLowerCase();
export const formatRut = value => {
  const clean = normalizeRut(value).slice(0, 9);
  if (!clean) return '';
  if (clean.length === 1) return clean.toUpperCase();
  const body = clean.slice(0, -1);
  return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${clean.slice(-1).toUpperCase()}`;
};
export const validUuid = value => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const isoDate = date => date.toISOString().slice(0, 10);
export const chileDate = () => new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit'
}).format(new Date());
const addMonths = (dateString, count = 1) => {
  const [year, month, day] = String(dateString).split('-').map(Number);
  const value = new Date(Date.UTC(year, month - 1 + count, Math.min(day, 28)));
  return isoDate(value);
};

export const materializeDueBills = async (admin, plan) => {
  if (!plan || plan.status !== 'active' || plan.deleted_at) return [];
  const today = chileDate();
  let issueDate = String(plan.next_issue_date || '');
  const created = [];
  let guard = 0;
  while (issueDate && issueDate <= today && guard < 24) {
    guard += 1;
    const dueAt = isoDate(new Date(Date.parse(`${issueDate}T00:00:00Z`) + 10 * 86400000));
    const { data, error } = await admin.from('maintenance_bills').upsert({
      billing_plan_id: plan.id,
      project_id: plan.project_id,
      customer_rut: plan.customer_rut,
      period_start: issueDate,
      issued_at: issueDate,
      due_at: dueAt,
      amount: plan.amount,
      currency: plan.currency || 'CLP',
      status: 'pending'
    }, { onConflict: 'billing_plan_id,period_start', ignoreDuplicates: true }).select().maybeSingle();
    if (error) throw error;
    if (data) created.push(data);
    issueDate = addMonths(issueDate);
  }
  if (issueDate && issueDate !== plan.next_issue_date) {
    const { error } = await admin.from('maintenance_billing_plans')
      .update({ next_issue_date: issueDate, updated_at: new Date().toISOString() })
      .eq('id', plan.id);
    if (error) throw error;
  }
  return created;
};

export const getPortalProject = async (admin, token) => {
  const normalizedToken = String(token || '').trim().toLowerCase();
  if (normalizedToken.length < 8 || normalizedToken.length > 160) return null;
  const { data, error } = await admin.from('projects')
    .select('id,client_id,client_token,client_visible,clients(name,company,rut,email,phone)')
    .eq('client_token', normalizedToken).eq('client_visible', true).maybeSingle();
  if (error) throw error;
  return data || null;
};

export const syncManualMaintenancePayment = async paymentId => {
  const admin = getAdminClient();
  const payment = await mercadoPagoFetch(`/v1/payments/${encodeURIComponent(paymentId)}`);
  const reference = String(payment.external_reference || '');
  const rawIds = reference.startsWith('maintenance_bills:')
    ? reference.slice(18).split(',')
    : reference.startsWith('maintenance_bill:') ? [reference.slice(17)] : [];
  const billIds = [...new Set(rawIds.map(value => value.trim()).filter(Boolean))];
  if (!billIds.length || billIds.length > 6 || billIds.some(id => !validUuid(id))) {
    throw new Error('El pago no pertenece a una mantencion facturada Solven Labs.');
  }
  const { data: bills, error } = await admin.from('maintenance_bills').select('*').in('id', billIds);
  if (error || !bills || bills.length !== billIds.length) throw new Error('No encontramos todos los cobros de mantencion.');
  const status = String(payment.status || 'pending').toLowerCase();
  const expectedAmount = bills.reduce((sum, bill) => sum + Number(bill.amount || 0), 0);
  const currencies = [...new Set(bills.map(bill => String(bill.currency || 'CLP').toUpperCase()))];
  const amountMatches = Number(payment.transaction_amount || 0) === expectedAmount;
  const currencyMatches = currencies.length === 1 && String(payment.currency_id || '').toUpperCase() === currencies[0];
  const updates = {
    mercado_pago_payment_id: String(payment.id),
    mercado_pago_status: status,
    updated_at: new Date().toISOString()
  };
  if (status === 'approved' && amountMatches && currencyMatches) {
    updates.status = 'paid';
    updates.paid_at = payment.date_approved || new Date().toISOString();
  } else if (status === 'approved') {
    updates.status = 'payment_mismatch';
  }
  const { error: updateError } = await admin.from('maintenance_bills').update(updates).in('id', billIds);
  if (updateError) throw updateError;
  return { billIds, status: updates.status || bills[0].status };
};
