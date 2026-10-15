const MAX_ATTENDEES = 50;
const MAX_SERIES_EVENTS = 100;
const DEFAULT_TIMEZONE = 'America/Santiago';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class ApiError extends Error {
  constructor(status, code, details = null) {
    super(code);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function env(name, fallback = '') {
  return globalThis.Deno?.env?.get(name) || fallback;
}

function corsOrigin(request) {
  const requested = String(request.headers.get('Origin') || '').replace(/\/$/, '');
  const allowed = [
    env('CALENDAR_ALLOWED_ORIGINS'),
    env('MAIL_ALLOWED_ORIGINS'),
    env('MAIL_ALLOWED_ORIGIN'),
    'https://solvenlabs.cl,https://www.solvenlabs.cl'
  ].filter(Boolean).join(',')
    .split(',').map(value => value.trim().replace(/\/$/, '')).filter(Boolean);
  return allowed.includes(requested) ? requested : (!requested ? (allowed[0] || '') : '');
}

function response(request, body, status = 200) {
  const origin = corsOrigin(request);
  const headers = { 'Content-Type': 'application/json; charset=utf-8', Vary: 'Origin' };
  if (origin) headers['Access-Control-Allow-Origin'] = origin;
  return new Response(JSON.stringify(body), { status, headers });
}

function serviceHeaders(prefer = '') {
  const key = env('SUPABASE_SERVICE_ROLE_KEY');
  const headers = { apikey: key, 'Content-Type': 'application/json' };
  if (/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key)) headers.Authorization = `Bearer ${key}`;
  if (prefer) headers.Prefer = prefer;
  return headers;
}

async function rest(path, { method = 'GET', body, prefer = '', userToken = '' } = {}) {
  const url = new URL(`/rest/v1/${path}`, env('SUPABASE_URL'));
  const headers = userToken
    ? { apikey: env('SUPABASE_ANON_KEY'), Authorization: `Bearer ${userToken}`, 'Content-Type': 'application/json' }
    : serviceHeaders(prefer);
  if (prefer) headers.Prefer = prefer;
  const result = await fetch(url, { method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  let data = null;
  try { data = await result.json(); } catch (_) {}
  if (!result.ok) throw new ApiError(result.status, 'database_error', data?.code || null);
  return data;
}

async function authenticatedUser(request) {
  const authorization = String(request.headers.get('Authorization') || '');
  const match = authorization.match(/^Bearer ([^\s]+)$/);
  if (!match) throw new ApiError(401, 'invalid_session');
  const result = await fetch(new URL('/auth/v1/user', env('SUPABASE_URL')), {
    headers: { apikey: env('SUPABASE_ANON_KEY'), Authorization: authorization, Accept: 'application/json' }
  });
  if (!result.ok) throw new ApiError(401, 'invalid_session');
  const user = await result.json();
  if (!/^[0-9a-f-]{36}$/i.test(String(user?.id || ''))) throw new ApiError(401, 'invalid_session');
  return { id: user.id, token: match[1], email: String(user.email || '').toLowerCase() };
}

function cleanText(value, max, required = false) {
  const text = String(value || '').trim();
  if ((required && !text) || text.length > max || text.includes('\u0000')) throw new ApiError(400, 'invalid_event');
  return text || null;
}

function normalizeAttendees(value) {
  if (value == null) return [];
  if (!Array.isArray(value) || value.length > MAX_ATTENDEES) throw new ApiError(400, 'invalid_attendees');
  const seen = new Set();
  return value.map(item => {
    const source = typeof item === 'string' ? { email: item } : item;
    const email = String(source?.email || '').trim().toLowerCase();
    const name = cleanText(source?.name, 160);
    if (!EMAIL_RE.test(email) || email.length > 254 || seen.has(email)) throw new ApiError(400, 'invalid_attendees');
    seen.add(email);
    return { email, name };
  });
}

function normalizeEvent(input, userId) {
  const date = String(input?.event_date || '');
  const start = input?.start_time ? String(input.start_time).slice(0, 5) : null;
  const end = input?.end_time ? String(input.end_time).slice(0, 5) : null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Boolean(start) !== Boolean(end)
      || (start && (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end) || end <= start))) {
    throw new ApiError(400, 'invalid_event_time');
  }
  const timezone = String(input?.timezone || DEFAULT_TIMEZONE);
  try { new Intl.DateTimeFormat('en', { timeZone: timezone }).format(); } catch (_) { throw new ApiError(400, 'invalid_timezone'); }
  let meetLink = cleanText(input?.meet_link, 1000);
  if (input?.add_meet && !meetLink) meetLink = `https://meet.jit.si/ntek-${crypto.randomUUID()}`;
  if (meetLink) {
    let url;
    try { url = new URL(meetLink); } catch (_) { throw new ApiError(400, 'invalid_meet_link'); }
    if (url.protocol !== 'https:') throw new ApiError(400, 'invalid_meet_link');
    meetLink = url.toString();
  }
  return {
    title: cleanText(input?.title, 200, true),
    description: cleanText(input?.description, 10000),
    event_date: date,
    start_time: start,
    end_time: end,
    event_type: ['meeting', 'deadline', 'demo', 'kickoff', 'other'].includes(input?.event_type) ? input.event_type : 'meeting',
    location: cleanText(input?.location, 500),
    meeting_notes: cleanText(input?.meeting_notes, 20000),
    timezone,
    meet_link: meetLink,
    created_by: userId
  };
}

function html(value) {
  return String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function icsText(value) {
  return String(value || '').replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

function icsParam(value) {
  return '"' + String(value || '').replace(/[\r\n"]/g, '') + '"';
}

function foldIcsLine(line) {
  const chunks = [];
  let current = '';
  let bytes = 0;
  for (const char of String(line)) {
    const size = new TextEncoder().encode(char).length;
    const limit = chunks.length ? 74 : 75;
    if (bytes + size > limit && current) { chunks.push(current); current = ''; bytes = 0; }
    current += char;
    bytes += size;
  }
  chunks.push(current);
  return chunks.join('\r\n ');
}

function utcStamp(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function zonedDateToUtc(date, time, timeZone) {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const target = Date.UTC(year, month - 1, day, hour, minute);
  let guess = target;
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  });
  for (let pass = 0; pass < 2; pass += 1) {
    const parts = Object.fromEntries(formatter.formatToParts(new Date(guess)).map(part => [part.type, part.value]));
    const represented = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
    guess -= represented - target;
  }
  return new Date(guess);
}

function nextDate(date) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString().slice(0, 10).replace(/-/g, '');
}

function buildIcs(event, attendees, mailbox, method) {
  const cancelled = method === 'CANCEL';
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Solven Labs//Solven Labs Calendar//ES',
    'CALSCALE:GREGORIAN', `METHOD:${method}`, 'BEGIN:VEVENT',
    `UID:${icsText(event.ical_uid)}`, `DTSTAMP:${utcStamp(new Date())}`,
    `SEQUENCE:${Number(event.ical_sequence) || 0}`
  ];
  if (event.start_time && event.end_time) {
    lines.push(`DTSTART:${utcStamp(zonedDateToUtc(event.event_date, event.start_time.slice(0, 5), event.timezone))}`);
    lines.push(`DTEND:${utcStamp(zonedDateToUtc(event.event_date, event.end_time.slice(0, 5), event.timezone))}`);
  } else {
    lines.push(`DTSTART;VALUE=DATE:${event.event_date.replace(/-/g, '')}`);
    lines.push(`DTEND;VALUE=DATE:${nextDate(event.event_date)}`);
  }
  lines.push(`SUMMARY:${icsText(event.title)}`);
  if (event.description) lines.push(`DESCRIPTION:${icsText(event.description)}`);
  if (event.location) lines.push(`LOCATION:${icsText(event.location)}`);
  if (event.meet_link) lines.push(`URL:${icsText(event.meet_link)}`);
  lines.push(`ORGANIZER;CN=${icsParam(mailbox.display_name || 'Solven Labs')}:mailto:${mailbox.address}`);
  const partStatus = { pending: 'NEEDS-ACTION', accepted: 'ACCEPTED', tentative: 'TENTATIVE', declined: 'DECLINED' };
  attendees.forEach(attendee => lines.push(
    `ATTENDEE${attendee.name ? `;CN=${icsParam(attendee.name)}` : ''};CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=${partStatus[attendee.status] || 'NEEDS-ACTION'};RSVP=TRUE:mailto:${attendee.email}`
  ));
  lines.push(`STATUS:${cancelled ? 'CANCELLED' : 'CONFIRMED'}`, 'TRANSP:OPAQUE', 'END:VEVENT', 'END:VCALENDAR');
  return lines.map(foldIcsLine).join('\r\n') + '\r\n';
}

function buildSeriesIcs(events, attendees, mailbox, method) {
  const eventBlocks = events.map(event => {
    const single = buildIcs(event, attendees, mailbox, method);
    return single.match(/BEGIN:VEVENT\r\n[\s\S]*?END:VEVENT\r\n/)?.[0] || '';
  }).join('');
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Solven Labs//Solven Labs Calendar//ES', 'CALSCALE:GREGORIAN', `METHOD:${method}`]
    .map(foldIcsLine).join('\r\n') + `\r\n${eventBlocks}END:VCALENDAR\r\n`;
}

function formatEventDate(event) {
  const date = new Intl.DateTimeFormat('es-CL', { dateStyle: 'full', timeZone: 'UTC' })
    .format(new Date(`${event.event_date}T12:00:00Z`));
  return event.start_time ? `${date}, ${event.start_time.slice(0, 5)}–${event.end_time.slice(0, 5)}` : date;
}

function buildMail(event, mailbox, method) {
  const cancelled = method === 'CANCEL';
  const heading = cancelled ? `Evento cancelado: ${event.title}` : `Invitación: ${event.title}`;
  const facts = [formatEventDate(event), `Zona horaria: ${event.timezone}`];
  if (event.location) facts.push(`Ubicación: ${event.location}`);
  const text = [heading, '', ...facts, `Organiza: ${mailbox.display_name || mailbox.address} <${mailbox.address}>`];
  if (event.description) text.push('', event.description);
  if (event.meet_link) text.push('', `Solven Labs Meet: ${event.meet_link}`);
  const action = event.meet_link && !cancelled
    ? `<a href="${html(event.meet_link)}" style="display:inline-block;margin-top:18px;padding:12px 20px;border-radius:10px;background:#163c65;color:#fff;text-decoration:none;font-weight:700">Unirse a la reunión</a>` : '';
  const bodyHtml = `<!doctype html><html><body style="margin:0;background:#f2f7f9;font-family:Arial,sans-serif;color:#172535"><div style="max-width:620px;margin:28px auto;background:#fff;border:1px solid #d6e5ea;border-radius:18px;overflow:hidden"><div style="padding:22px 28px;background:#172a3f;color:#fff;font-size:20px;font-weight:700">Solven Labs Calendar</div><div style="padding:28px"><h1 style="font-size:24px;margin:0 0 18px">${html(heading)}</h1><p style="line-height:1.7;margin:0">${facts.map(html).join('<br>')}<br>Organiza: ${html(mailbox.display_name || mailbox.address)} &lt;${html(mailbox.address)}&gt;</p>${event.description ? `<p style="line-height:1.7;color:#3c5774">${html(event.description).replace(/\n/g, '<br>')}</p>` : ''}${action}</div></div></body></html>`;
  return { subject: cancelled ? `[Cancelado] ${event.title}` : event.title, text: text.join('\n'), html: bodyHtml };
}

function buildSeriesMail(events, mailbox, method) {
  const first = events[0];
  const last = events[events.length - 1];
  const cancelled = method === 'CANCEL';
  const heading = `${cancelled ? 'Serie cancelada' : 'Invitación recurrente'}: ${first.title}`;
  const range = `${formatEventDate(first)} — ${formatEventDate(last)}`;
  const text = [heading, '', `${events.length} eventos`, range, `Zona horaria: ${first.timezone}`, `Organiza: ${mailbox.display_name || mailbox.address} <${mailbox.address}>`];
  if (first.description) text.push('', first.description);
  if (first.meet_link) text.push('', `Solven Labs Meet: ${first.meet_link}`);
  const action = first.meet_link && !cancelled ? `<a href="${html(first.meet_link)}" style="display:inline-block;margin-top:18px;padding:12px 20px;border-radius:10px;background:#163c65;color:#fff;text-decoration:none;font-weight:700">Unirse a la reunión</a>` : '';
  const bodyHtml = `<!doctype html><html><body style="margin:0;background:#f2f7f9;font-family:Arial,sans-serif;color:#172535"><div style="max-width:620px;margin:28px auto;background:#fff;border:1px solid #d6e5ea;border-radius:18px;overflow:hidden"><div style="padding:22px 28px;background:#172a3f;color:#fff;font-size:20px;font-weight:700">Solven Labs Calendar</div><div style="padding:28px"><h1 style="font-size:24px;margin:0 0 18px">${html(heading)}</h1><p style="line-height:1.7;margin:0"><strong>${events.length} eventos</strong><br>${html(range)}<br>Zona horaria: ${html(first.timezone)}<br>Organiza: ${html(mailbox.display_name || mailbox.address)} &lt;${html(mailbox.address)}&gt;</p>${first.description ? `<p style="line-height:1.7;color:#3c5774">${html(first.description).replace(/\n/g, '<br>')}</p>` : ''}${action}</div></div></body></html>`;
  return { subject: heading, text: text.join('\n'), html: bodyHtml };
}

function base64Utf8(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  return btoa(binary);
}

async function derivedUuid(requestId, label) {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${requestId}:${label}`))).slice(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function sendInvitation(user, requestId, label, mailbox, event, attendees, method) {
  if (!attendees.length) return;
  const workerUrl = new URL('/api/mail/send', env('MAIL_WORKER_URL'));
  const ics = buildIcs(event, attendees, mailbox, method);
  const mail = buildMail(event, mailbox, method);
  const result = await fetch(workerUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${user.token}`, Origin: env('MAIL_ALLOWED_ORIGIN', 'https://solvenlabs.cl'),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      request_id: await derivedUuid(requestId, label), mailbox_id: mailbox.id,
      to: attendees.map(item => item.email), cc: [], bcc: [],
      subject: mail.subject, body_text: mail.text, body_html: mail.html,
      attachments: [{
        filename: method === 'CANCEL' ? 'cancelacion.ics' : 'invite.ics',
        content: base64Utf8(ics), size: new TextEncoder().encode(ics).length,
        content_type: `text/calendar; charset=UTF-8; method=${method}`
      }]
    })
  });
  let data = null;
  try { data = await result.json(); } catch (_) {}
  if (!result.ok || data?.error) throw new ApiError(502, 'mail_delivery_failed', data?.error || null);
}

async function sendSeriesInvitation(user, requestId, mailbox, events, attendees, method, label = 'series') {
  if (!attendees.length) return;
  const workerUrl = new URL('/api/mail/send', env('MAIL_WORKER_URL'));
  const ics = buildSeriesIcs(events, attendees, mailbox, method);
  const mail = buildSeriesMail(events, mailbox, method);
  const result = await fetch(workerUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${user.token}`, Origin: env('MAIL_ALLOWED_ORIGIN', 'https://solvenlabs.cl'), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      request_id: await derivedUuid(requestId, label), mailbox_id: mailbox.id,
      to: attendees.map(item => item.email), cc: [], bcc: [],
      subject: mail.subject, body_text: mail.text, body_html: mail.html,
      attachments: [{ filename: method === 'CANCEL' ? 'cancelacion-serie.ics' : 'serie.ics', content: base64Utf8(ics), size: new TextEncoder().encode(ics).length, content_type: `text/calendar; charset=UTF-8; method=${method}` }]
    })
  });
  let data = null;
  try { data = await result.json(); } catch (_) {}
  if (!result.ok || data?.error) throw new ApiError(502, 'mail_delivery_failed', data?.error || null);
}

async function getEvent(eventId, ownerId) {
  const rows = await rest(`events?select=*&id=eq.${encodeURIComponent(eventId)}&created_by=eq.${ownerId}&limit=1`);
  if (!rows?.[0]) throw new ApiError(404, 'event_not_found');
  return rows[0];
}

async function getAttendees(eventId) {
  return await rest(`event_attendees?select=id,email,name,status&event_id=eq.${encodeURIComponent(eventId)}&order=created_at.asc`) || [];
}

async function getMailbox(mailboxId, user) {
  const rows = await rest(`mailboxes?select=id,address,display_name,active&id=eq.${encodeURIComponent(mailboxId)}&active=eq.true&limit=1`, { userToken: user.token });
  if (!rows?.[0]) throw new ApiError(403, 'mailbox_not_available');
  return rows[0];
}

async function replaceAttendees(eventId, oldAttendees, attendees) {
  const desired = new Map(attendees.map(item => [item.email, item]));
  const existing = new Map(oldAttendees.map(item => [item.email, item]));
  const removed = oldAttendees.filter(item => !desired.has(item.email));
  if (removed.length) await rest(`event_attendees?event_id=eq.${eventId}&email=in.(${removed.map(item => `"${item.email.replace(/"/g, '')}"`).join(',')})`, { method: 'DELETE' });
  const rows = attendees.map(item => ({ event_id: eventId, ...item, status: existing.get(item.email)?.status || 'pending' }));
  if (rows.length) await rest('event_attendees?on_conflict=event_id,email', { method: 'POST', body: rows, prefer: 'resolution=merge-duplicates,return=minimal' });
  return await getAttendees(eventId);
}

async function processRequest(request) {
  if (!env('SUPABASE_URL') || !env('SUPABASE_ANON_KEY') || !env('SUPABASE_SERVICE_ROLE_KEY') || !env('MAIL_WORKER_URL')) {
    throw new ApiError(503, 'calendar_not_configured');
  }
  const user = await authenticatedUser(request);
  const payload = await request.json().catch(() => { throw new ApiError(400, 'invalid_json'); });
  const action = String(payload?.action || '');
  const requestId = String(payload?.request_id || '');
  if (!['create', 'create_series', 'update', 'update_series', 'cancel', 'cancel_series'].includes(action) || !/^[0-9a-f-]{36}$/i.test(requestId)) throw new ApiError(400, 'invalid_request');
  const requestPath = `calendar_invitation_requests?request_id=eq.${requestId}&owner_id=eq.${user.id}`;
  const previous = (await rest(`${requestPath}&select=*&limit=1`))?.[0];
  if (previous?.status === 'sent') return { ...previous.result, duplicate: true };
  if (previous?.status === 'processing') throw new ApiError(409, 'request_already_processing');
  let plan = previous?.result?.plan || null;
  if (previous && !plan) throw new ApiError(409, 'request_requires_review');
  if (previous) {
    const claimed = await rest(`${requestPath}&status=eq.failed`, {
      method: 'PATCH', body: { status: 'processing', updated_at: new Date().toISOString() }, prefer: 'return=representation'
    });
    if (!claimed?.length) throw new ApiError(409, 'request_already_processing');
  } else {
    await rest('calendar_invitation_requests', {
      method: 'POST', body: { request_id: requestId, owner_id: user.id, action: action.replace('_series', '') }, prefer: 'return=minimal'
    });
  }
  try {
    if (!plan) {
      const creating = action.startsWith('create');
      const cancelling = action.startsWith('cancel');
      const series = action.endsWith('_series');
      const anchor = creating ? null : await getEvent(payload.event_id, user.id);
      if (series && !creating && !anchor.recurrence_group_id) throw new ApiError(400, 'invalid_series');
      const existing = creating ? [] : series
        ? await rest(`events?select=*&recurrence_group_id=eq.${anchor.recurrence_group_id}&created_by=eq.${user.id}&order=event_date.asc,start_time.asc`)
        : [anchor];
      const existingById = new Map(existing.map(item => [item.id, item]));
      const oldGuests = new Map();
      for (const item of existing) oldGuests.set(item.id, await getAttendees(item.id));
      const mailbox = await getMailbox(anchor?.organizer_mailbox_id || payload.mailbox_id, user);
      if (anchor?.organizer_mailbox_id && payload.mailbox_id && payload.mailbox_id !== anchor.organizer_mailbox_id) throw new ApiError(400, 'organizer_cannot_change');
      const attendees = cancelling ? [] : normalizeAttendees(payload.attendees);
      const inputs = cancelling ? [] : series ? payload.events : [payload.event];
      if (!Array.isArray(inputs) || (!cancelling && !inputs.length) || inputs.length > MAX_SERIES_EVENTS) throw new ApiError(400, 'invalid_series');
      const groupId = series ? anchor?.recurrence_group_id || String(inputs[0]?.recurrence_group_id || '') : null;
      if (series && !/^[0-9a-f-]{36}$/i.test(groupId)) throw new ApiError(400, 'invalid_series');
      const seen = new Set();
      const dates = new Set();
      const saved = [];
      for (const [index, input] of inputs.entries()) {
        const normalized = normalizeEvent(input, user.id);
        const old = creating ? null : series ? existingById.get(input.id) : anchor;
        if ((!creating && input?.id && !old) || (old && seen.has(old.id)) || (series && dates.has(normalized.event_date))) throw new ApiError(400, 'invalid_series');
        if (creating && series && input.recurrence_group_id !== groupId) throw new ApiError(400, 'invalid_series');
        dates.add(normalized.event_date);
        if (old) seen.add(old.id);
        const id = old?.id || await derivedUuid(requestId, `event-${index}`);
        saved.push({ ...normalized, id, organizer_mailbox_id: mailbox.id,
          ical_uid: old?.ical_uid || `${id}@calendar.solvenlabs.cl`, ical_sequence: old ? Number(old.ical_sequence || 0) + 1 : 0,
          ...(series ? { recurrence_group_id: groupId, recurrence_rule: input.recurrence_rule || null, recurrence_sequence: index } : {})
        });
      }
      const removed = existing.filter(item => !seen.has(item.id));
      plan = { saved, attendees, deliveries: [], removed: removed.map(item => item.id), groupId, cancelling, series, result: {
        ok: true, event_id: saved[0]?.id || anchor?.id,
        ...(series ? { recurrence_group_id: groupId, event_count: saved.length, events_deleted: removed.length } : {})
      } };
      // Keep each occurrence's own recipients and organizer, including exceptions.
      for (const old of existing) {
        const guests = oldGuests.get(old.id);
        const updated = saved.find(item => item.id === old.id);
        const recipients = updated ? guests.filter(guest => !attendees.some(item => item.email === guest.email)) : guests;
        if (recipients.length) {
          const organizer = old.organizer_mailbox_id && old.organizer_mailbox_id !== mailbox.id ? await getMailbox(old.organizer_mailbox_id, user) : mailbox;
          plan.deliveries.push({ label: `cancel-${old.id}`, mailbox: organizer, events: [{ ...old, ical_sequence: Number(old.ical_sequence || 0) + 1 }], attendees: recipients, method: 'CANCEL' });
        }
      }
      if (saved.length && attendees.length) plan.deliveries.push({ label: 'request', mailbox, events: saved, attendees, method: 'REQUEST' });
      const grouped = new Map();
      for (const delivery of plan.deliveries) {
        const key = JSON.stringify([delivery.mailbox.id, delivery.method, delivery.attendees.map(item => item.email).sort()]);
        if (grouped.has(key)) grouped.get(key).events.push(...delivery.events);
        else grouped.set(key, delivery);
      }
      plan.deliveries = [...grouped.values()];
      // Persist the exact operation before changing events. Retries reuse IDs, sequences,
      // recipients and worker idempotency keys even after a partial delivery.
      await rest(requestPath, { method: 'PATCH', body: { result: { plan } } });
    }
    for (const item of plan.saved) {
      await rest('events?on_conflict=id', { method: 'POST', body: item, prefer: 'resolution=merge-duplicates,return=minimal', userToken: user.token });
    }
    for (const delivery of plan.deliveries) {
      if (delivery.sent) continue;
      await getMailbox(delivery.mailbox.id, user);
      if (delivery.events.length === 1) await sendInvitation(user, requestId, delivery.label, delivery.mailbox, delivery.events[0], delivery.attendees, delivery.method);
      else await sendSeriesInvitation(user, requestId, delivery.mailbox, delivery.events, delivery.attendees, delivery.method, delivery.label);
      delivery.sent = true;
      await rest(requestPath, { method: 'PATCH', body: { result: { plan } } });
    }
    for (const item of plan.saved) await replaceAttendees(item.id, await getAttendees(item.id), plan.attendees);
    if (plan.cancelling && plan.series) {
      await rest('rpc/delete_calendar_event_series', { method: 'POST', body: { p_recurrence_group_id: plan.groupId }, userToken: user.token });
    } else {
      for (const id of plan.removed) {
        // A retry after deletion must not fail simply because the event is gone.
        const rows = await rest(`events?select=id&id=eq.${id}&created_by=eq.${user.id}`);
        if (rows?.length) await rest('rpc/delete_calendar_event', { method: 'POST', body: { p_event_id: id }, userToken: user.token });
      }
    }
    await rest(requestPath, { method: 'PATCH', body: { status: 'sent', result: plan.result, updated_at: new Date().toISOString() } });
    return plan.result;
  } catch (error) {
    if (plan) await rest(requestPath, { method: 'PATCH', body: { status: 'failed', result: { plan, error: error?.code || 'calendar_failed' }, updated_at: new Date().toISOString() } }).catch(() => {});
    else await rest(requestPath, { method: 'DELETE' }).catch(() => {});
    throw error;
  }
}

if (globalThis.Deno?.serve) Deno.serve(async request => {
  if (request.method === 'OPTIONS') {
    const origin = corsOrigin(request);
    return new Response(null, { status: 204, headers: {
      ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}),
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS', Vary: 'Origin'
    } });
  }
  if (request.method !== 'POST') return response(request, { error: 'not_found' }, 404);
  try { return response(request, await processRequest(request)); }
  catch (error) {
    console.error('ntek_calendar_invitation_failed', { code: error?.code || 'calendar_failed', details: error?.details || null });
    return response(request, { error: error?.code || 'calendar_failed', ...(error?.code === 'mail_delivery_failed' ? { details: error.details } : {}) }, error instanceof ApiError ? error.status : 500);
  }
});
