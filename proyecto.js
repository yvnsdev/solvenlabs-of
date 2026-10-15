// Background animation
(() => {
  'use strict';
  const debounce = (fn, delay) => { let timer; return () => { clearTimeout(timer); timer = setTimeout(fn, delay); }; };
  const initNetworkCanvas = () => {
    const canvas = document.getElementById('network-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const particles = [];
    let particleCount = 80;
    let connectionDistance = 150;
    const mouseRadius = 200;
    let animationId;
    let mouse = { x: null, y: null };

    // Obtener configuración según tamaño de pantalla
    const getParticleConfig = () => {
      const width = window.innerWidth;
      if (width <= 480) {
        return { count: 35, distance: 110 };
      } else if (width <= 640) {
        return { count: 45, distance: 125 };
      } else if (width <= 768) {
        return { count: 60, distance: 135 };
      } else {
        return { count: 80, distance: 150 };
      }
    };

    // Configurar tamaño del canvas
    const resizeCanvas = () => {
      const hero = canvas.parentElement;
      canvas.width = hero.offsetWidth;
      canvas.height = hero.offsetHeight;
      
      // Actualizar configuración según tamaño
      const config = getParticleConfig();
      particleCount = config.count;
      connectionDistance = config.distance;
    };

    // Clase Particle
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.8;
        this.vy = (Math.random() - 0.5) * 0.8;
        this.radius = Math.random() * 2 + 1;
        this.baseRadius = this.radius;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(76, 124, 175, 0.9)';
        ctx.fill();
      }

      update() {
        // Movimiento
        this.x += this.vx;
        this.y += this.vy;

        // Rebote en bordes
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

        // Interacción con el mouse
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < mouseRadius) {
            const force = (mouseRadius - distance) / mouseRadius;
            this.x -= dx * force * 0.02;
            this.y -= dy * force * 0.02;
            this.radius = this.baseRadius + force * 2;
          } else {
            this.radius = this.baseRadius;
          }
        }

        this.draw();
      }
    }

    // Crear partículas
    const createParticles = () => {
      particles.length = 0;
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    };

    // Dibujar conexiones
    const drawConnections = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            const opacity = (1 - distance / connectionDistance) * 0.6;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(76, 124, 175, ${opacity})`;
            ctx.lineWidth = 1.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    };

    // Loop de animación
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(particle => particle.update());
      drawConnections();
      
      animationId = requestAnimationFrame(animate);
    };

    // Event listeners
    window.addEventListener('resize', debounce(() => {
      resizeCanvas();
      createParticles();
    }, 200));

    canvas.parentElement.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });

    canvas.parentElement.addEventListener('mouseleave', () => {
      mouse.x = null;
      mouse.y = null;
    });

    // Iniciar
    resizeCanvas();
    createParticles();
    animate();
  };

  initNetworkCanvas();
})();

;
// Project portal
(() => {
  const url = new URL(window.location.href);
  const hasPrivateQuery = ['token', 'maintenance_rut', 'maintenance_payment', 'maintenance_bills']
    .some(key => url.searchParams.has(key));
  const hasPrivatePath = /^\/(?:project|proyecto)\/.+/.test(url.pathname);
  if (hasPrivateQuery || hasPrivatePath) {
    document.querySelector('meta[name="robots"]')?.setAttribute('content', 'noindex, nofollow');
  }
})();
;
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.112.4';

const SUPABASE_URL = 'https://oxyhuxnkhogmuholomis.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Hc5VQX3uTZ_K9BiQ9kf0rA_ri3wYpjS';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});

/* ── helpers ── */
const $ = id => document.getElementById(id);
const show = id => $(id).classList.remove('hidden');
const hide = id => $(id).classList.add('hidden');
let currentProjectData = null;
let currentProjectToken = null;
let projectDialogTrigger = null;
let ticketDialogTrigger = null;

const TICKET_STATUS = {
  pending: { label: 'Pendiente', className: 'pending' },
  in_progress: { label: 'En progreso', className: 'in_progress' },
  review: { label: 'En revisión', className: 'review' },
  done: { label: 'Resuelto', className: 'done' },
};

function setView(name) {
  ['view-intro','view-loading','view-error','view-project'].forEach(v => hide(v));
  show('view-' + name);
  const projectDialog = $('view-project');
  if (projectDialog) projectDialog.setAttribute('aria-hidden', name === 'project' ? 'false' : 'true');
  const fab = $('ticket-fab');
  const modal = $('ticket-modal');
  if (fab) fab.hidden = name !== 'project';
  if (modal && name !== 'project') modal.hidden = true;
  document.body.style.overflow = name === 'project' ? 'hidden' : '';
  if (name === 'project') setTimeout(() => $('project-modal-close')?.focus(), 50);
}

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function fmtDate(d) {
  if (!d) return '—';
  try {
    // Append T00:00:00 so the string is parsed as local time, not UTC.
    // Without this, "2026-01-26" becomes UTC midnight → shows as the
    // previous day in UTC-3 (Chile).
    const safe = /^\d{4}-\d{2}-\d{2}$/.test(d) ? d + 'T00:00:00' : d;
    return new Date(safe).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return d; }
}

function fmtNum(n) {
  if (!n) return '$0';
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n).replace(/\s/g, '');
}

function fmtRelative(d) {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `hace ${days} día${days > 1 ? 's' : ''}`;
  return new Date(d).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
}

function normalizePortalFinanceStatus(status) {
  const raw = String(status || '').trim().toLowerCase();
  if (['paid', 'pagado', 'pagada', 'cobrado', 'cobrada'].includes(raw)) return 'pagado';
  if (['emitida', 'emitido', 'issued'].includes(raw)) return 'emitida';
  if (['registered', 'registrado', 'registrada'].includes(raw)) return 'registrado';
  if (['anulado', 'anulada', 'cancelled', 'canceled'].includes(raw)) return 'anulado';
  if (['overdue', 'vencido', 'vencida', 'payment_mismatch'].includes(raw)) return 'vencido';
  if (['pendiente', 'pending'].includes(raw)) return 'pendiente';
  return raw || 'registrado';
}

function normalizePortalRut(value) {
  return String(value || '').replace(/[.\-\s]/g, '').toLowerCase();
}

function formatPortalRut(value) {
  const clean = normalizePortalRut(value).replace(/[^0-9k]/g, '').slice(0, 9);
  if (!clean) return '';
  if (clean.length === 1) return clean.toUpperCase();
  const body = clean.slice(0, -1);
  return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${clean.slice(-1).toUpperCase()}`;
}

function normalizePortalSearch(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function portalRowDate(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? String(value).slice(0, 10) : date.toISOString().slice(0, 10);
}

function portalDteName(tipo) {
  return ({
    '33': 'Factura',
    '34': 'Factura exenta',
    '39': 'Boleta',
    '110': 'Factura de compra'
  }[String(tipo || '')] || 'Documento');
}

function portalFinanceStatusMeta(status) {
  const normalized = normalizePortalFinanceStatus(status);
  return ({
    pagado: { label: 'Pagada', className: 'paid' },
    emitida: { label: 'Emitida', className: 'pending' },
    pendiente: { label: 'Pendiente', className: 'pending' },
    registrado: { label: 'Registrado', className: 'vigente' },
    vencido: { label: 'Vencida', className: 'overdue' },
    anulado: { label: 'Anulado', className: 'overdue' }
  }[normalized] || { label: normalized.charAt(0).toUpperCase() + normalized.slice(1), className: 'pending' });
}

function showPortalToast(message, type = 'success') {
  const container = $('portal-toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `portal-toast portal-toast--${type}`;
  toast.innerHTML = `
    <i class="portal-toast__icon" data-lucide="${type === 'success' ? 'check-circle-2' : type === 'warning' ? 'alert-triangle' : 'alert-circle'}"></i>
    <div class="portal-toast__text"></div>
  `;
  toast.querySelector('.portal-toast__text').textContent = message;
  container.appendChild(toast);
  if (window.lucide?.createIcons) window.lucide.createIcons();
  setTimeout(() => toast.remove(), 3200);
}

function getTicketStatusMeta(status) {
  return TICKET_STATUS[String(status || 'pending').toLowerCase()] || TICKET_STATUS.pending;
}

function renderTicketHistory(project) {
  const tickets = project?.tickets || [];
  const summaryEl = $('proj-ticket-summary');
  const listEl = $('proj-tickets');
  const counts = tickets.reduce((accumulator, ticket) => {
    const key = String(ticket.status || 'pending').toLowerCase();
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});

  if (summaryEl) {
    summaryEl.innerHTML = `
      <div class="ticket-summary-card"><div class="ticket-summary-card__label">Total tickets</div><div class="ticket-summary-card__value">${tickets.length}</div></div>
      <div class="ticket-summary-card"><div class="ticket-summary-card__label">Pendientes</div><div class="ticket-summary-card__value">${counts.pending || 0}</div></div>
      <div class="ticket-summary-card"><div class="ticket-summary-card__label">En progreso</div><div class="ticket-summary-card__value">${counts.in_progress || 0}</div></div>
      <div class="ticket-summary-card"><div class="ticket-summary-card__label">Resueltos</div><div class="ticket-summary-card__value">${counts.done || 0}</div></div>
    `;
  }

  if (!listEl) return;
  if (!tickets.length) {
    listEl.innerHTML = '<div class="timeline-empty">Sin tickets registrados aún.</div>';
    return;
  }

  listEl.innerHTML = tickets.map(ticket => {
    const meta = getTicketStatusMeta(ticket.status);
    const dueText = ticket.due_date ? ` · Vence ${fmtDate(ticket.due_date)}` : '';
    const description = ticket.description || 'Sin descripción adicional';
    return `
      <div class="ticket-item">
        <div class="ticket-item__body">
          <div class="ticket-item__title">${escHtml(ticket.title || 'Ticket')}</div>
          <div class="ticket-item__desc">${escHtml(description)}</div>
          <div class="ticket-item__meta"><span>${fmtRelative(ticket.created_at || ticket.updated_at)}</span><span>·</span><span>${escHtml(ticket.priority || 'medium')}</span>${ticket.category ? `<span>·</span><span>${escHtml(ticket.category)}</span>` : ''}${dueText ? `<span>${escHtml(dueText)}</span>` : ''}</div>
        </div>
        <span class="ticket-status ticket-status--${meta.className}">${meta.label}</span>
      </div>
    `;
  }).join('');
}

function openTicketModal() {
  const modal = $('ticket-modal');
  if (!modal || !currentProjectData) return;
  $('ticket-title').value = '';
  $('ticket-category').value = 'Soporte';
  $('ticket-priority').value = 'medium';
  $('ticket-due').value = '';
  $('ticket-description').value = '';
  ticketDialogTrigger = document.activeElement;
  modal.hidden = false;
  if (window.lucide?.createIcons) window.lucide.createIcons();
  setTimeout(() => $('ticket-title')?.focus(), 50);
}

function closeTicketModal() {
  const modal = $('ticket-modal');
  if (modal) modal.hidden = true;
  if (ticketDialogTrigger instanceof HTMLElement) ticketDialogTrigger.focus();
}

async function submitTicketFromPortal(event) {
  event.preventDefault();
  if (!currentProjectData?.id) return;

  const title = $('ticket-title')?.value.trim();
  const category = $('ticket-category')?.value || 'Soporte';
  const priority = $('ticket-priority')?.value || 'medium';
  const dueDate = $('ticket-due')?.value || null;
  const description = $('ticket-description')?.value.trim();

  if (!title || !description) {
    showPortalToast('Completa título y descripción', 'warning');
    return;
  }

  const { error } = await supabase.from('orders').insert({
    title,
    description,
    category,
    priority,
    due_date: dueDate,
    status: 'pending',
    project_id: currentProjectData.id,
  });

  if (error) {
    showPortalToast(`No se pudo crear el ticket: ${error.message}`, 'error');
    return;
  }

  showPortalToast('Ticket creado correctamente', 'success');
  closeTicketModal();
  if (currentProjectToken) await loadByToken(currentProjectToken);
}

function bindTicketUi() {
  $('ticket-fab')?.addEventListener('click', openTicketModal);
  $('ticket-modal-close')?.addEventListener('click', closeTicketModal);
  $('ticket-cancel')?.addEventListener('click', closeTicketModal);
  $('ticket-modal')?.addEventListener('click', event => {
    if (event.target?.dataset?.ticketClose === 'true') closeTicketModal();
  });
  $('ticket-form')?.addEventListener('submit', submitTicketFromPortal);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !$('ticket-modal')?.hidden) {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeTicketModal();
    }
  });
}

function closeProjectModal() {
  setView('intro');
  if (window.location.search) {
    history.replaceState({}, '', '/proyecto');
  }
  if (projectDialogTrigger instanceof HTMLElement) projectDialogTrigger.focus();
}

/* ── status config ── */
const STATUSES = {
  proposal:       { label: 'Propuesta',      badge: 'proposal',  icon: 'file-text' },
  in_development: { label: 'En Desarrollo',   badge: 'active',    icon: 'code-2' },
  review:         { label: 'En Revisión',     badge: 'review',    icon: 'eye' },
  completed:      { label: 'Completado',      badge: 'completed', icon: 'check-circle-2' },
  paused:         { label: 'En Pausa',        badge: 'paused',    icon: 'pause-circle' },
};

const STEPS = [
  { key: 'proposal',       label: 'Propuesta',    icon: 'file-text'       },
  { key: 'in_development', label: 'Desarrollo',   icon: 'code-2'          },
  { key: 'review',         label: 'Revisión',     icon: 'eye'             },
  { key: 'completed',      label: 'Completado',   icon: 'check-circle-2'  },
];

const UPDATE_ICONS = {
  milestone: 'flag',
  update:    'bell',
  delivery:  'package',
  issue:     'alert-triangle',
  note:      'message-square',
};

const UPDATE_LABELS = {
  milestone: 'Hito',
  update: 'Actualización',
  delivery: 'Entrega',
  issue: 'Incidencia',
  note: 'Nota',
};

/* ── render ── */
function renderProject(p) {
  currentProjectData = p;
  const status = p.status || 'proposal';
  const cfg = STATUSES[status] || STATUSES.proposal;

  // Header
  $('proj-name').textContent   = p.name || '—';
  const clientLabel = p.client_company ? `${p.client_company}` : (p.client_name || '—');
  $('proj-client').textContent = p.updated_at
    ? `${clientLabel} · Actualizado ${fmtRelative(p.updated_at)}`
    : clientLabel;
  $('proj-tags').innerHTML = (p.technologies || []).map(t => `<span class="tag">${escHtml(t)}</span>`).join('');

  // Status badge
  $('proj-status-badge').innerHTML = `<i data-lucide="${cfg.icon}"></i> ${cfg.label}`;
  $('proj-status-badge').className = `status-badge status-badge--${cfg.badge}`;

  // Progress
  const pct = p.progress || 0;

  const updates = p.updates || [];
  const latestUpdate = updates[0] || null;
  const quoteItems = p.cotizaciones || [];
  const ticketItems = p.tickets || [];
  const invoiceItems = p.facturas || [];
  const documentItems = p.documentos || [];
  const teamMembers = p.teamMembers || [];
  const latestInvoice = invoiceItems[0] || null;
  const latestDocument = documentItems[0] || null;
  const isInvoicePaid = item => ['pagada', 'pagado'].includes(String(item.estado || '').toLowerCase());
  const isInvoicePending = item => !isInvoicePaid(item) && String(item.estado || 'pendiente').toLowerCase() !== 'anulada';
  const pendingInvoices = invoiceItems.filter(isInvoicePending).length;
  const pendingInvoiceTotal = invoiceItems
    .filter(isInvoicePending)
    .reduce((sum, item) => sum + Number(item.total || 0), 0);
  const docsCount = documentItems.length;
  const pendingDueItems = invoiceItems
    .filter(item => isInvoicePending(item) && item.fecha_vencimiento)
    .sort((a, b) => new Date(a.fecha_vencimiento) - new Date(b.fecha_vencimiento));
  const nextDueItem = pendingDueItems[0] || null;
  const nextDueText = nextDueItem
    ? fmtDate(nextDueItem.fecha_vencimiento)
    : (p.estimated_end_date ? fmtDate(p.estimated_end_date) : (latestUpdate ? fmtRelative(latestUpdate.created_at) : 'Sin fecha definida'));
  const nextDueMeta = nextDueItem
    ? `Factura ${nextDueItem.folio || 'sin folio'} · ${fmtNum(nextDueItem.total || 0)}`
    : (p.estimated_end_date ? `Entrega estimada · ${fmtDate(p.estimated_end_date)}` : 'Sin vencimientos registrados');
  const teamNames = teamMembers.map(member => member.name).filter(Boolean);
  const teamPreview = teamNames.slice(0, 2).join(', ');
  const briefCards = [
    {
      label: 'Última actualización',
      value: latestUpdate ? latestUpdate.title : 'Sin actualizaciones',
      meta: latestUpdate
        ? `${fmtRelative(latestUpdate.created_at)} · ${UPDATE_LABELS[latestUpdate.type] || 'Actualización'}`
        : 'No hay avances visibles todavía'
    },
    {
      label: 'Próxima fecha crítica',
      value: nextDueText,
      meta: nextDueMeta
    },
    {
      label: 'Progreso real',
      value: `${pct}% completado`,
      meta: status === 'completed' ? 'Proyecto finalizado' : 'Seguimiento activo con avance visible'
    },
    {
      label: 'Último entregable',
      value: latestDocument ? latestDocument.file_name : 'Sin documentos',
      meta: latestDocument
        ? `${latestDocument.folder || 'otros'} · ${fmtRelative(latestDocument.created_at)}`
        : 'Todavía no se han subido archivos'
    }
  ];

  const briefGrid = $('proj-brief-grid');
  if (briefGrid) {
    briefGrid.innerHTML = briefCards.map(card => `
      <div class="brief-card">
        <div class="brief-card__label">${card.label}</div>
        <div class="brief-card__value">${escHtml(card.value)}</div>
        <div class="brief-card__meta">${escHtml(card.meta)}</div>
      </div>
    `).join('');
  }

  const briefText = $('proj-brief-text');
  if (briefText) {
    const summaryParts = [];
    const addUnique = (text) => {
      const normalized = String(text || '').trim();
      if (normalized && !summaryParts.includes(normalized)) summaryParts.push(normalized);
    };
    if (latestUpdate) addUnique(`Avance más reciente: ${latestUpdate.title} (${fmtRelative(latestUpdate.created_at)}).`);
    if (nextDueItem) addUnique(`Próximo vencimiento real: factura ${nextDueItem.folio || 'sin folio'} para ${fmtDate(nextDueItem.fecha_vencimiento)}.`);
    else if (p.estimated_end_date) addUnique(`La fecha estimada de entrega es ${fmtDate(p.estimated_end_date)}.`);
    if (latestDocument) addUnique(`Último entregable: ${latestDocument.file_name} en ${latestDocument.folder || 'otros'}.`);
    if (teamNames.length) addUnique(`Equipo asignado: ${teamPreview}${teamNames.length > 2 ? ` y ${teamNames.length - 2} más` : ''}.`);
    if (p.client_notes) addUnique(p.client_notes.endsWith('.') ? p.client_notes : `${p.client_notes}.`);
    if (summaryParts.length === 0) summaryParts.push('Aún no hay información destacada para mostrar.');
    briefText.textContent = summaryParts.join(' ');
  }

  $('proj-pct').textContent = `${pct}%`;
  const fill = $('proj-progress-fill');
  fill.style.width = '0%';
  fill.className = 'progress-bar__fill' + (
    status === 'completed' ? ' progress-bar__fill--completed' :
    status === 'review'    ? ' progress-bar__fill--review'    : ''
  );
  setTimeout(() => { fill.style.width = `${pct}%`; }, 100);

  // Stepper
  const stepperEl = $('proj-stepper');
  const currentIdx = status === 'paused' ? -1 : STEPS.findIndex(s => s.key === status);
  stepperEl.innerHTML = STEPS.map((step, i) => {
    let cls = '';
    if (status === 'paused' && STEPS[i].key === status) cls = 'stepper-step--paused';
    else if (status === 'paused') cls = 'stepper-step--future';
    else if (i < currentIdx)  cls = 'stepper-step--completed';
    else if (i === currentIdx) cls = 'stepper-step--active';
    else cls = 'stepper-step--future';
    /* For completed, all steps are completed */
    if (status === 'completed') cls = 'stepper-step--completed';
    return `
      <div class="stepper-step ${cls}">
        <div class="stepper-step__circle">
          ${i < currentIdx || status === 'completed'
            ? `<i data-lucide="check" style="width:16px;height:16px;"></i>`
            : status === 'paused' && step.key === 'in_development'
              ? `<i data-lucide="pause" style="width:16px;height:16px;"></i>`
              : `<i data-lucide="${step.icon}" style="width:16px;height:16px;"></i>`
          }
        </div>
        <div class="stepper-step__label">${step.label}</div>
      </div>
    `;
  }).join('');

  // Details
  const pctComplete = pct;
  const statusLabel = cfg.label;
  const detailItems = [
    { icon: 'calendar',       label: 'Inicio',                value: fmtDate(p.start_date),          show: !!p.start_date },
    { icon: 'calendar-check', label: 'Entrega estimada',      value: fmtDate(p.estimated_end_date),  show: !!p.estimated_end_date },
    { icon: 'activity',       label: 'Progreso',              value: `${pct}%`,                       show: true },
    { icon: 'layers',         label: 'Tecnologías',           value: (p.technologies||[]).join(', ') || '—', show: true },
    { icon: 'file-text',      label: 'Cotizaciones vigentes', value: (p.cotizacionesVigentes || 0) + '', show: !!p.cotizacionesVigentes },
    { icon: 'file-check',     label: 'Facturas pendientes',   value: (p.facturasPendientes || 0) + '', show: !!p.facturasPendientes },
  ];
  $('proj-details').innerHTML = detailItems.filter(d => d.show).map(d => `
    <div class="detail-card">
      <div class="detail-card__icon"><i data-lucide="${d.icon}"></i></div>
      <div>
        <div class="detail-card__label">${d.label}</div>
        <div class="detail-card__value">${escHtml(d.value)}</div>
      </div>
    </div>
  `).join('');

  // KPI section
  const startDate = p.start_date ? new Date(p.start_date) : null;
  const today = new Date();
  const activeDays = startDate ? Math.max(1, Math.ceil((today.getTime() - startDate.getTime()) / 86400000)) : 0;
  const activeLabel = activeDays > 0 ? `${activeDays} día${activeDays === 1 ? '' : 's'}` : 'Sin inicio';
  const pendingInvoicesLabel = pendingInvoices > 0 ? `${pendingInvoices} · ${fmtNum(pendingInvoiceTotal)}` : 'Al día';
  const docsLabel = docsCount > 0 ? `${docsCount} archivo${docsCount === 1 ? '' : 's'}` : 'Sin archivos';
  const quoteTotal = quoteItems.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const acceptedQuotes = quoteItems.filter(item => item.estado === 'aceptada').length;
  const currentQuoteState = quoteItems.length === 0
    ? 'Sin cotización'
    : acceptedQuotes > 0
      ? 'Aceptada'
      : quoteItems.some(item => item.estado === 'vigente')
        ? 'Vigente'
        : (quoteItems[0]?.estado ? String(quoteItems[0].estado).charAt(0).toUpperCase() + String(quoteItems[0].estado).slice(1) : 'Sin estado');

  $('proj-kpi-quote-value').textContent = quoteItems.length > 0 ? fmtNum(quoteTotal) : '—';
  $('proj-kpi-quote-state').textContent = currentQuoteState;
  $('proj-kpi-age').textContent = activeLabel;
  $('proj-kpi-invoices').textContent = pendingInvoicesLabel;
  $('proj-kpi-docs').textContent = docsLabel;
  $('proj-kpi-status').textContent = p.status === 'completed' ? 'Completado' : 'En curso';
  $('proj-kpi-card').style.display = 'block';

  // Description + notes
  const descCard = $('proj-desc-card');
  if (p.description || p.client_notes) {
    descCard.style.display = '';
    if (p.description) $('proj-desc').textContent = p.description;
    const notesEl = $('proj-notes');
    if (p.client_notes) { notesEl.textContent = p.client_notes; notesEl.style.display = ''; }
    else notesEl.style.display = 'none';
  } else descCard.style.display = 'none';

  // Timeline
  const timelineEl = $('proj-timeline');
  if (!updates.length) {
    timelineEl.innerHTML = '<div class="timeline-empty">Sin actualizaciones disponibles aún.</div>';
  } else {
    timelineEl.innerHTML = updates.map(u => {
      const icon = UPDATE_ICONS[u.type] || 'bell';
      return `
        <div class="timeline-item">
          <div class="timeline-item__dot timeline-item__dot--${escHtml(u.type || 'update')}">
            <i data-lucide="${icon}"></i>
          </div>
          <div class="timeline-item__body">
            <div class="timeline-item__title">${escHtml(u.title)}</div>
            ${u.description ? `<div class="timeline-item__desc">${escHtml(u.description)}</div>` : ''}
            <div class="timeline-item__date">${fmtRelative(u.created_at)}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  const ticketsCard = $('proj-tickets-card');
  if (ticketsCard) {
    ticketsCard.style.display = '';
    renderTicketHistory(p);
  }

  // Facturas
  const facturas = p.facturas || [];
  const invoicesCard = $('proj-invoices-card');
  const invoicesEl = $('proj-invoices');
  if (facturas.length > 0) {
    invoicesCard.style.display = '';

    // Resumen de facturas
    const totalFacturas = facturas.reduce((s, f) => s + (f.total || 0), 0);
    const pagadas = facturas.filter(isInvoicePaid).length;
    const pendientes = facturas.filter(isInvoicePending).length;

    const summaryEl = $('invoice-summary');
    summaryEl.innerHTML = `
      <div class="summary-box">
        <div class="summary-box__label">Pendientes de Pago</div>
        <div class="summary-box__value">${pendientes}</div>
      </div>
      <div class="summary-box">
        <div class="summary-box__label">Pagadas</div>
        <div class="summary-box__value">${pagadas}</div>
      </div>
      <div class="summary-box">
        <div class="summary-box__label">Total</div>
        <div class="summary-box__value" style="font-size:0.9rem;">${fmtNum(totalFacturas)}</div>
      </div>
    `;

    invoicesEl.innerHTML = facturas.map(f => {
      const statusMeta = portalFinanceStatusMeta(f.estado);
      const statoBadge = `<span class="item__status item__status--${statusMeta.className}">${statusMeta.label}</span>`;
      const tipoDTE = f.tipo_dte || 'Documento';

      return `
        <div class="item">
          <div class="item__content">
            <div class="item__title">${tipoDTE} #${escHtml(String(f.folio || '').padStart(6,'0'))}</div>
            <div class="item__subtitle">
              ${f.fecha || '—'} · ${f.periodo || ''} ${f.periodo ? '·' : ''}
              ${f.razon_social ? escHtml(f.razon_social) : '—'}
              ${f.source_label ? ` · ${escHtml(f.source_label)}` : ''}
            </div>
            <div>${statoBadge}</div>
          </div>
          <div class="item__value">${fmtNum(f.total || 0)}</div>
        </div>
      `;
    }).join('');
  } else {
    invoicesCard.style.display = 'none';
  }

  // Documentos Entregables
  const documentos = p.documentos || [];
  const deliverablesCard = $('proj-deliverables-card');
  const deliverablesEl = $('proj-deliverables');
  if (documentos.length > 0) {
    deliverablesCard.style.display = '';
    const folderIcons = {
      'contratos': 'file-signature',
      'propuestas': 'file-plus-2',
      'diseños': 'palette',
      'entregables': 'package',
      'facturas': 'file-text',
      'legal': 'shield-check',
      'otros': 'file'
    };
    deliverablesEl.innerHTML = documentos.map(d => {
      const icon = folderIcons[d.folder] || 'file';
      const sizeKB = Math.round((d.file_size || 0) / 1024);
      return `
        <div class="item">
          <div class="item__content">
            <div class="item__title"><i data-lucide="${icon}" style="width:14px;height:14px;display:inline;margin-right:6px;vertical-align:text-bottom;"></i>${escHtml(d.file_name)}</div>
            <div class="item__subtitle">${d.folder ? d.folder.charAt(0).toUpperCase() + d.folder.slice(1) : 'Otros'} · ${sizeKB} KB</div>
          </div>
          <div class="item__value">${fmtDate(d.created_at)}</div>
        </div>
      `;
    }).join('');
  } else {
    deliverablesCard.style.display = 'none';
  }

  lucide.createIcons();
}

/* ── fetch ── */
async function loadByToken(token) {
  const searchButton = $('search-btn');
  if (searchButton) {
    searchButton.disabled = true;
    searchButton.setAttribute('aria-busy', 'true');
  }
  setView('loading');
  try {
    currentProjectToken = token.trim().toLowerCase();
    const { data, error } = await supabase
      .from('projects')
      .select(`
        id, name, description, status, progress, technologies, updated_at,
        start_date, estimated_end_date, client_notes, client_visible, client_token,
        clients ( name, company, rut ),
        project_members ( team_member_id, team_members ( full_name, avatar_url ) ),
          project_updates ( id, title, description, type, visible_to_client, created_at ),
          orders ( id, title, description, status, priority, due_date, created_at, updated_at )
      `)
      .eq('client_token', token.trim().toLowerCase())
      .eq('client_visible', true)
      .single();

    if (error || !data) {
      setView('error');
      return;
    }

    /* Normalise nested relations */
    data.client_company = data.clients?.company || null;
    data.client_name    = data.clients?.name    || null;
    data.teamMembers = (data.project_members || [])
      .map(pm => pm.team_members ? {
        name: pm.team_members.full_name || 'Miembro',
        avatar_url: pm.team_members.avatar_url || null
      } : null)
      .filter(Boolean);

    /* Sort updates newest first, only client-visible ones */
    data.updates = (data.project_updates || [])
      .filter(u => u.visible_to_client !== false)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    data.tickets = (data.orders || [])
      .sort((a, b) => new Date(b.created_at || b.updated_at || 0) - new Date(a.created_at || a.updated_at || 0));

    const clientName = (data.client_name || '').trim();
    const clientCompany = (data.client_company || '').trim();
    const clientRut = (data.clients?.rut || '').trim();
    const quoteFilters = [];
    const invoiceFilters = [];

    if (clientName) {
      const safeClientName = clientName.replace(/,/g, ' ');
      quoteFilters.push(`cliente.ilike.%${safeClientName}%`);
    }
    if (clientCompany) {
      const safeClientCompany = clientCompany.replace(/,/g, ' ');
      quoteFilters.push(`razon_social.ilike.%${safeClientCompany}%`);
    }
    if (clientRut) {
      quoteFilters.push(`rut_receptor.eq.${clientRut}`);
      invoiceFilters.push(`rut_receptor.eq.${clientRut}`);
    }
    if (clientCompany) {
      const safeClientCompany = clientCompany.replace(/,/g, ' ');
      invoiceFilters.push(`razon_social.ilike.%${safeClientCompany}%`);
    }

    /* Fetch cotizaciones */
    let cotizacionesQuery = supabase
      .from('cotizaciones')
      .select('id, folio, fecha, fecha_vencimiento, estado, neto, iva, total, cliente, vigencia, exento, razon_social, observaciones')
      .order('fecha', { ascending: false })
      .limit(20);
    if (quoteFilters.length) {
      cotizacionesQuery = cotizacionesQuery.or(quoteFilters.join(','));
    }
    const { data: cotizaciones } = await cotizacionesQuery;
    data.cotizaciones = (cotizaciones || []).map(c => ({
      folio: c.folio || '—',
      fecha: c.fecha || '—',
      fecha_vencimiento: c.fecha_vencimiento || '—',
      estado: c.estado || 'vigente',
      neto: Number(c.neto || 0),
      iva: Number(c.iva || 0),
      total: Number(c.total || 0),
      cliente: c.cliente || '—',
      vigencia: c.vigencia || 30,
      exento: c.exento || false,
      razon_social: c.razon_social || '—',
      observaciones: c.observaciones || ''
    }));
    data.cotizacionesVigentes = (data.cotizaciones || []).filter(c => c.estado === 'vigente').length;

    /* Fetch facturas/recibos from the same finance sources used by dashboard Finanzas */
    const invoiceSelect = 'id, folio, tipo_dte, fecha, fecha_vencimiento, periodo, estado, neto, iva, total, razon_social, rut_receptor, exento, observaciones, sii_pdf_url, project_id, operacion, emi_name, emi_rut, created_at';
    const invoiceSelectLegacy = 'id, folio, tipo_dte, fecha, fecha_vencimiento, periodo, estado, neto, iva, total, razon_social, rut_receptor, exento, observaciones, sii_pdf_url, operacion, emi_name, emi_rut, created_at';
    const financeRows = [];
    let usedProjectScopedInvoices = false;

    const matchesPortalClient = (record, names = [], rut = '') => {
      const normalizedRut = normalizePortalRut(rut);
      if (normalizedRut && [record.rut_receptor, record.rut, record.counterpartyRut].some(value => normalizePortalRut(value) === normalizedRut)) return true;
      const searchable = normalizePortalSearch([
        record.razon_social,
        record.cliente,
        record.nombre,
        record.origen,
        record.counterparty
      ].filter(Boolean).join(' '));
      return names.some(name => {
        const normalizedName = normalizePortalSearch(name);
        return normalizedName && searchable.includes(normalizedName);
      });
    };

    const clientNames = [clientName, clientCompany].filter(Boolean);
    const clientRutNormalized = normalizePortalRut(clientRut);

    const projectInvoicesRes = await supabase
      .from('facturas_presii')
      .select(invoiceSelect)
      .eq('project_id', data.id)
      .order('fecha', { ascending: false })
      .limit(20);

    let presiiRows = [];
    if (!projectInvoicesRes.error && Array.isArray(projectInvoicesRes.data) && projectInvoicesRes.data.length) {
      presiiRows = projectInvoicesRes.data;
      usedProjectScopedInvoices = true;
    } else {
      let facturasQuery = supabase
        .from('facturas_presii')
        .select(projectInvoicesRes.error ? invoiceSelectLegacy : invoiceSelect)
        .order('fecha', { ascending: false })
        .limit(20);
      if (invoiceFilters.length) {
        facturasQuery = facturasQuery.or(invoiceFilters.join(','));
      }
      const { data: fallbackFacturas, error: fallbackError } = await facturasQuery;
      if (!fallbackError) presiiRows = fallbackFacturas || [];
    }

    (presiiRows || []).forEach(doc => {
      const operacion = String(doc.operacion || (String(doc.tipo_dte || '') === '110' ? 'compra' : 'venta')).toLowerCase();
      if (operacion !== 'venta') return;
      financeRows.push({
        id: doc.id || '',
        folio: doc.folio || '—',
        tipo_dte: portalDteName(doc.tipo_dte),
        fecha: portalRowDate(doc.fecha || doc.created_at) || '—',
        fecha_vencimiento: doc.fecha_vencimiento || '',
        periodo: doc.periodo || '',
        estado: normalizePortalFinanceStatus(doc.estado || 'borrador'),
        total: Number(doc.total || 0),
        razon_social: doc.razon_social || doc.emi_name || '—',
        rut_receptor: doc.rut_receptor || '',
        source: 'presii',
        source_label: 'SII Facturas',
        project_id: doc.project_id || null,
        sii_pdf_url: doc.sii_pdf_url || null
      });
    });

    const [pagosRes, incomesRes] = await Promise.all([
      supabase.from('pagos').select('id,fecha,tipo,operacion,nombre,rut,cargo,descripcion,status,neto,bruto,amount,skip_analytics').order('fecha', { ascending: false }).limit(100),
      supabase.from('fin_ingresos').select('id,fecha,concepto,cliente,origen,categoria,metodo_pago,referencia,observaciones,estado,monto').order('fecha', { ascending: false }).limit(100)
    ]);

    (pagosRes.data || []).forEach(payment => {
      if (String(payment.tipo || '').toLowerCase() !== 'honorarios') return;
      if (String(payment.operacion || 'compra').toLowerCase() !== 'venta') return;
      if (payment.skip_analytics) return;
      if (!matchesPortalClient(payment, clientNames, clientRutNormalized)) return;
      financeRows.push({
        id: payment.id || '',
        folio: payment.id ? String(payment.id).slice(0, 8) : '—',
        tipo_dte: 'Boleta',
        fecha: portalRowDate(payment.fecha) || '—',
        fecha_vencimiento: '',
        periodo: '',
        estado: normalizePortalFinanceStatus(payment.status || 'registrado'),
        total: Number(payment.neto || payment.bruto || payment.amount || 0),
        razon_social: payment.nombre || '—',
        rut_receptor: payment.rut || '',
        source: 'honorarios',
        source_label: 'Honorarios'
      });
    });

    (incomesRes.data || []).forEach(income => {
      if (!matchesPortalClient(income, clientNames, clientRutNormalized)) return;
      financeRows.push({
        id: income.id || '',
        folio: income.referencia || income.id?.slice(0, 8) || '—',
        tipo_dte: 'Ingreso',
        fecha: portalRowDate(income.fecha) || '—',
        fecha_vencimiento: '',
        periodo: income.categoria || '',
        estado: normalizePortalFinanceStatus(income.estado || 'registrado'),
        total: Number(income.monto || 0),
        razon_social: income.cliente || income.origen || '—',
        rut_receptor: '',
        source: 'income',
        source_label: 'Ingresos externos'
      });
    });

    const normalizedFacturas = financeRows
      .filter(row => Number(row.total || 0) > 0)
      .sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
    const seenFacturas = new Set();
    data.facturas = normalizedFacturas.filter(f => {
      const key = `${f.source || 'finance'}:${f.id || [f.tipo_dte, f.folio, f.fecha, f.periodo, f.total].join('|')}`;
      if (seenFacturas.has(key)) return false;
      seenFacturas.add(key);
      return true;
    });
    data.facturasPendientes = (data.facturas || []).filter(f => f.estado === 'pendiente').length;

    /* Fetch document deliverables */
    const { data: documentos } = await supabase
      .from('documents')
      .select('id, file_name, folder, file_size, created_at, download_url')
      .eq('project_id', data.id)
      .order('created_at', { ascending: false })
      .limit(40);
    data.documentos = (documentos || []).map(d => ({
      file_name: d.file_name || 'Documento',
      folder: d.folder || 'otros',
      file_size: Number(d.file_size || 0),
      created_at: d.created_at || null,
      download_url: d.download_url || null
    }));
    data.documentosCount = data.documentos.length;

    renderProject(data);
    setView('project');
  } catch (e) {
    console.error(e);
    setView('error');
  } finally {
    if (searchButton) {
      searchButton.disabled = false;
      searchButton.removeAttribute('aria-busy');
    }
  }
}

/* ── URL routing ── */
function getTokenFromUrl() {
  // First check sessionStorage (set by redirect from /project/{token})
  const sessionToken = sessionStorage.getItem('_ntek_project_token');
  if (sessionToken) {
    sessionStorage.removeItem('_ntek_project_token');
    return sessionToken;
  }

  // query param fallback: ?token=xxx
  return new URLSearchParams(window.location.search).get('token') || null;
}

/* ── search ── */
window.searchProject = function() {
  const token = document.getElementById('token-input').value.trim();
  if (!token) {
    document.getElementById('token-input').focus();
    return;
  }
  projectDialogTrigger = document.activeElement;
  currentProjectToken = token.toLowerCase();
  // Keep the project page URL clean (no dynamic deep route in browser bar)
  history.replaceState({}, '', '/proyecto');
  loadByToken(token);
};

document.getElementById('project-search-form').addEventListener('submit', event => {
  event.preventDefault();
  window.searchProject();
});

function refreshPortalIcons() {
  if (window.lucide?.createIcons) window.lucide.createIcons();
}

refreshPortalIcons();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', refreshPortalIcons, { once: true });
}
window.addEventListener('load', refreshPortalIcons, { once: true });

function normalizeProjectPath() {
  const p = window.location.pathname.replace(/\/+$/, '');
  const match = p.match(/^\/(?:project|proyecto)\/(.+)$/);
  if (!match) return null;
  const token = decodeURIComponent(match[1]);
  const normalizedUrl = new URL(window.location.href);
  normalizedUrl.pathname = '/proyecto';
  normalizedUrl.search = `?token=${encodeURIComponent(token)}`;
  history.replaceState({}, '', normalizedUrl.toString());
  return token;
}

const normalizedToken = normalizeProjectPath();
const initToken = normalizedToken || getTokenFromUrl();

if (initToken) {
  currentProjectToken = initToken;
  history.replaceState({}, '', '/proyecto');
  document.getElementById('token-input').value = initToken;
  loadByToken(initToken);
} else {
  setView('intro');
}

bindTicketUi();

$('project-modal-close')?.addEventListener('click', closeProjectModal);
$('view-project')?.addEventListener('click', event => {
  if (event.target === $('view-project')) closeProjectModal();
});
document.addEventListener('keydown', event => {
  const projectDialog = $('view-project');
  const ticketDialog = $('ticket-modal');
  const dialog = ticketDialog && !ticketDialog.hidden ? ticketDialog : projectDialog;
  if (!dialog || dialog.classList.contains('hidden')) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    if (dialog === ticketDialog) closeTicketModal();
    else closeProjectModal();
    return;
  }
  if (event.key !== 'Tab') return;
  const focusable = [...dialog.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
    .filter(element => !element.hidden && element.offsetParent !== null);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});
