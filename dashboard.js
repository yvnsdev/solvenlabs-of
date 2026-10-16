// intakeModel
const intakeModel = (() => {

const INTAKE_STATUSES = ['En levantamiento', 'En revisión', 'Validada'];
const INTAKE_SECTIONS = [
  { id: 'general', title: 'Información general', intro: 'Identifica el proyecto y a las personas que participan en el levantamiento.', fields: [
    ['project_name', 'Nombre del proyecto', 'text', 'Usa un nombre que permita reconocer esta iniciativa.'],
    ['client_name', 'Nombre del cliente', 'text', 'Indica la empresa o persona para quien se construirá la solución.'],
    ['meeting_date', 'Fecha de reunión', 'date', 'Fecha en que se recopiló esta información.'],
    ['ntek_owner', 'Responsable Solven Labs', 'text', 'Persona de Solven Labs que conduce y da seguimiento al levantamiento.'],
    ['initiative_type', 'Tipo de iniciativa', 'text', 'Indica el tipo de producto o servicio que se propone.'],
    ['initial_market', 'Mercado inicial', 'text', 'Define el territorio o segmento al que se dirige la primera etapa.'],
    ['scope_status', 'Estado del alcance', 'text', 'Indica si el alcance es preliminar, está en revisión o ya fue acordado.'],
    ['participants', 'Participantes', 'textarea', 'Incluye nombre, cargo y organización de quienes participaron.']
  ] },
  { id: 'need', title: 'Descripción de la necesidad', intro: 'Primero describe cómo se trabaja hoy; a partir de ese contexto, identifica qué necesita cambiar.', fields: [
    ['current_situation', '2.1. Situación actual', 'textarea', '¿Cómo se realiza hoy el proceso? Describe los pasos, personas y herramientas, por ejemplo Excel, correo o WhatsApp.'],
    ['identified_need', '2.2. Problema o necesidad identificada', 'textarea', 'A partir de la situación actual, ¿qué dificultades aparecen y a quién afectan? Explica errores, demoras o información que falta.']
  ] },
  { id: 'objective', title: 'Objetivo del proyecto', intro: 'Relaciona el problema identificado con el resultado que el cliente espera conseguir.', fields: [
    ['main_objective', 'Objetivo principal', 'textarea', '¿Qué debe mejorar gracias al software? Describe el resultado esperado y, si se conoce, cómo se comprobará.'],
    ['expected_results', 'Resultados esperados', 'textarea', 'Describe los resultados observables que permitirán evaluar el proyecto.']
  ] },
  { id: 'users', title: 'Usuarios y funcionalidades solicitadas', intro: 'Define quién utilizará el sistema y qué necesita hacer para alcanzar el objetivo.', fields: [
    ['system_users', '4.1. Usuarios del sistema', 'textarea', 'Identifica los tipos de usuario, sus tareas y diferencias de acceso. Por ejemplo: cliente, operador y administrador.']
  ], tables: ['roles', 'features'] },
  { id: 'constraints', title: 'Condiciones y restricciones', intro: 'Con las funcionalidades descritas, registra los límites y condiciones que podrían influir en la solución.', fields: [
    ['expected_deadline', 'Plazo esperado', 'textarea', 'Indica una fecha o plazo y si existe algún hito que lo condicione.'],
    ['reference_budget', 'Presupuesto referencial (si existe)', 'textarea', 'Indica monto, moneda y si considera impuestos. Si no está definido, puedes señalarlo aquí.'],
    ['integrations', 'Sistemas o servicios con los que debe integrarse', 'textarea', 'Nombra los sistemas externos, qué información se intercambia y quién puede dar acceso.'],
    ['other_constraints', 'Otras condiciones o restricciones', 'textarea', 'Incluye seguridad, dispositivos, conectividad, rendimiento, normativa u otras condiciones relevantes.']
  ] },
  { id: 'pending', title: 'Observaciones y asuntos pendientes', intro: 'Cierra la reunión registrando el contexto adicional y las respuestas que faltan para continuar.', fields: [
    ['general_observations', '6.1. Observaciones generales', 'textarea', 'Registra acuerdos, prioridades, supuestos o información adicional relevante obtenida durante la reunión.']
  ], table: 'pending', afterFields: [
    ['validation_next_step', '6.3. Próximo paso de validación', 'textarea', 'Define qué se debe revisar, con quién y cuál será el siguiente acuerdo.'],
    ['reviewed_sources', 'Fuentes revisadas', 'textarea', 'Identifica reuniones, documentos y versiones usados como referencia.']
  ] }
];
const INTAKE_TABLES = {
  roles: { title: 'Matriz de roles y permisos', columns: [['role', 'Usuario / rol'], ['permissions', 'Participación y permisos esperados'], ['source', 'Origen']], help: 'Describe las responsabilidades de cada perfil y la fuente de esta definición.', add: 'Agregar rol' },
  features: { title: '4.2. Funcionalidades solicitadas', columns: [['name', 'Funcionalidad solicitada'], ['description', 'Descripción preliminar'], ['source', 'Origen']], help: 'Registra una capacidad por fila. Explica quién la necesita, qué debe permitir hacer y qué resultado se espera. En origen, identifica la reunión, documento o confirmación pendiente.', note: 'Las funcionalidades registradas son preliminares y estarán sujetas a análisis y posterior validación.', add: 'Agregar funcionalidad' },
  pending: { title: '6.2. Dudas o información pendiente', columns: [['question', 'Consulta o información pendiente'], ['owner', 'Responsable de responder']], help: 'Convierte cada duda en una consulta concreta y asigna a la persona que puede responderla.', add: 'Agregar pendiente' }
};
function todayInChile(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const value = type => parts.find(part => part.type === type).value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}
function newIntake(project = {}) {
  return { version: '1.0', status: INTAKE_STATUSES[0], meeting_date: todayInChile(), project_name: project.name || '', client_name: project.clients?.name || '', roles: [{ role: '', permissions: '', source: '' }], features: [{ name: '', description: '', source: '' }], pending: [{ question: '', owner: '' }] };
}
function normalizeIntake(raw = {}) {
  const data = {};
  for (const key of ['version', 'status', ...INTAKE_SECTIONS.flatMap(section => [...section.fields, ...(section.afterFields || [])].map(field => field[0]))]) data[key] = String(raw[key] ?? '').trim();
  for (const [key, table] of Object.entries(INTAKE_TABLES)) {
    data[key] = (Array.isArray(raw[key]) ? raw[key] : []).map(row => Object.fromEntries(table.columns.map(([column]) => [column, String(row?.[column] ?? '').trim()])));
  }
  return data;
}
function validateIntake(data) {
  if (!data.project_name || !data.client_name) return 'Completa el nombre del proyecto y del cliente.';
  if (!data.version || data.version.length > 40) return 'Indica una versión de hasta 40 caracteres.';
  if (!INTAKE_STATUSES.includes(data.status)) return 'Selecciona un estado válido.';
  if (data.meeting_date && (!/^\d{4}-\d{2}-\d{2}$/.test(data.meeting_date) || Number.isNaN(Date.parse(`${data.meeting_date}T12:00:00Z`)) || new Date(`${data.meeting_date}T12:00:00Z`).toISOString().slice(0, 10) !== data.meeting_date)) return 'Revisa la fecha de reunión.';
  for (const section of INTAKE_SECTIONS) for (const [key, label, type] of [...section.fields, ...(section.afterFields || [])]) if (data[key].length > (type === 'text' ? 300 : 12000)) return `El campo «${label}» supera el largo permitido.`;
  for (const [key, table] of Object.entries(INTAKE_TABLES)) {
    if (data[key].length > 100) return 'Puedes ingresar hasta 100 filas por tabla.';
    if (data[key].some(row => table.columns.some(([column]) => row[column].length > 4000))) return 'Cada celda de las tablas admite hasta 4.000 caracteres.';
  }
  return '';
}
function formatIntakeDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  return match ? `${match[3]}-${match[2]}-${match[1]}` : 'Por definir';
}
function intakeFilename(data) {
  const name = (data.project_name || 'proyecto').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-|-$/g, '').slice(0, 65) || 'proyecto';
  return `SolvenLabs-Ficha-${name}-${(data.version || '1.0').replace(/[^a-zA-Z0-9.-]/g, '-')}.pdf`;
}

return { INTAKE_STATUSES, INTAKE_SECTIONS, INTAKE_TABLES, todayInChile, newIntake, normalizeIntake, validateIntake, formatIntakeDate, intakeFilename };
})();
// intakePdf
const intakePdf = (() => {
const { INTAKE_SECTIONS, INTAKE_TABLES, formatIntakeDate } = intakeModel;

// Vector text, measured wrapping and page breaks keep long answers selectable
// and readable; no screenshot of the dashboard is embedded in the document.
function buildIntakePDF(data, { jsPDF, logoDataURL, company = {} }) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const left = 19, width = 172, bottom = 273, lineHeight = 4.8;
  const blue = [0, 87, 230], ink = [10, 26, 46], muted = [82, 100, 122];
  let y = 0;
  const font = (style = 'normal', size = 10, color = ink) => { pdf.setFont('helvetica', style); pdf.setFontSize(size); pdf.setTextColor(...color); };
  const lines = (text, w = width) => pdf.splitTextToSize(String(text || 'Por definir').replace(/\t/g, '    '), w);
  function page() {
    pdf.setFillColor(...blue); pdf.rect(0, 0, 210, 3, 'F');
    if (logoDataURL) {
      const image = pdf.getImageProperties(logoDataURL);
      const w = Math.min(43, 16 * image.width / image.height);
      pdf.addImage(logoDataURL, 'PNG', left, 10, w, w * image.height / image.width);
    } else { font('bold', 24, blue); pdf.text('Solven Labs', left, 23); }
    font('bold', 9, blue); pdf.text('LEVANTAMIENTO DE REQUERIMIENTOS', 191, 16, { align: 'right' });
    font('normal', 8, muted); pdf.text(lines(`Versión ${data.version}  |  ${data.status}`, 130), 191, 22, { align: 'right' });
    pdf.setDrawColor(214, 226, 244); pdf.line(left, 31, 191, 31);
    y = 40;
  }
  function ensure(height) { if (y + height > bottom) { pdf.addPage(); page(); } }
  function paragraph(text, { style = 'normal', size = 10, color = ink, gap = 4 } = {}) {
    font(style, size, color);
    const wrapped = lines(text);
    const step = Math.max(lineHeight, size * 0.44);
    for (const line of wrapped) { ensure(step); font(style, size, color); pdf.text(line, left, y); y += step; }
    y += gap;
  }
  function heading(title) {
    ensure(24);
    pdf.setFillColor(235, 244, 255); pdf.roundedRect(left, y - 4, width, 10, 1.5, 1.5, 'F');
    font('bold', 11, blue); pdf.text(title, left + 3, y + 2); y += 14;
  }
  function field(label, value) {
    ensure(17); paragraph(label, { style: 'bold', size: 9, gap: 1 }); paragraph(value);
  }
  function table(key) {
    const definition = INTAKE_TABLES[key];
    ensure(28); paragraph(definition.title, { style: 'bold', size: 10 });
    const widths = key === 'pending' ? [12, 108, 52] : [12, 40, 94, 26];
    const labels = ['N.º', ...definition.columns.map(([, label]) => label)];
    function tableHeader() {
      ensure(16); pdf.setFillColor(235, 244, 255); pdf.rect(left, y - 4, width, 12, 'F');
      font('bold', 8, blue);
      let x = left;
      labels.forEach((label, index) => { pdf.text(lines(label, widths[index] - 4), x + 2, y); x += widths[index]; });
      y += 13;
    }
    tableHeader();
    const rows = (data[key] || []).filter(row => definition.columns.some(([column]) => row[column]?.trim()));
    if (!rows.length) rows.push(Object.fromEntries(definition.columns.map(([column]) => [column, 'Por definir'])));
    rows.forEach((row, index) => {
      font('normal', 9);
      const cells = [String(index + 1), ...definition.columns.map(([column]) => row[column] || 'Por definir')].map((text, i) => lines(text, widths[i] - 4));
      const count = Math.max(...cells.map(cell => cell.length));
      for (let line = 0; line < count; line++) {
        if (y + lineHeight > bottom) { pdf.addPage(); page(); tableHeader(); }
        font('normal', 9);
        let x = left;
        cells.forEach((cell, i) => { if (cell[line]) pdf.text(cell[line], x + 2, y); x += widths[i]; });
        y += lineHeight;
      }
      pdf.setDrawColor(214, 226, 244); pdf.line(left, y - 2, left + width, y - 2); y += 4;
    });
    y += 3;
    if (definition.note) paragraph(definition.note, { size: 9, color: muted });
  }
  page();
  paragraph('Ficha de Levantamiento de Requerimientos', { style: 'bold', size: 18, gap: 7 });
  for (const [index, section] of INTAKE_SECTIONS.entries()) {
    heading(`${index + 1}. ${section.title}`);
    for (const [key, label, type] of section.fields) field(label, type === 'date' ? formatIntakeDate(data[key]) : data[key]);
    for (const key of (section.tables || [section.table]).filter(Boolean)) table(key);
    for (const [key, label, type] of section.afterFields || []) field(label, type === 'date' ? formatIntakeDate(data[key]) : data[key]);
  }
  ensure(16); paragraph('Fin de la ficha de levantamiento.', { size: 9, color: muted });
  const pages = pdf.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    pdf.setPage(p); pdf.setDrawColor(214, 226, 244); pdf.line(left, 282, 191, 282);
    font('normal', 8, muted);
    pdf.text(`${company.website || 'www.solvenlabs.cl'}  |  ${company.email || 'tomas@solvenlabs.cl'}`, left, 288);
    pdf.text(`Página ${p} de ${pages}`, 191, 288, { align: 'right' });
  }
  pdf.setProperties({ title: `Ficha de levantamiento - ${data.project_name}`, subject: `Cliente: ${data.client_name}`, author: 'Solven Labs', creator: 'Solven Labs Panel de Gestión' });
  return pdf;
}

return { buildIntakePDF };
})();
// intakeUi
const intakeUi = (() => {
const { INTAKE_SECTIONS, INTAKE_TABLES, INTAKE_STATUSES, newIntake, normalizeIntake, validateIntake, formatIntakeDate, intakeFilename } = intakeModel;
const { buildIntakePDF } = intakePdf;

function intakeErrorMessage(error) {
  if (['42P01', '42703', 'PGRST204', 'PGRST205'].includes(error?.code)) return 'Falta actualizar la base de datos de fichas. Aplica la migración de requirement_intakes en Supabase. Los datos ingresados se conservan.';
  if (error?.code === '42501') return 'Tu cuenta no tiene permiso para guardar fichas. Revisa el acceso a Requisitos de tu rol. Los datos ingresados se conservan.';
  if (error?.code === 'PGRST116') return 'Otra persona modificó esta ficha. Descarga tu PDF antes de actualizar la lista y revisar los cambios.';
  return 'No se pudo guardar la ficha. Revisa la conexión y vuelve a intentar. Los datos ingresados se conservan.';
}

async function mountRequirements(root, { supabase, escapeHtml: esc, showToast, canWrite, getPdfAssets }) {
  if (root.dataset.mounted && root.dataset.canWrite === String(canWrite)) return;
  const previous = root.intakeDraft?.();
  root.intakeDispose?.();
  root.dataset.mounted = 'true';
  root.dataset.canWrite = String(canWrite);
  let data = previous?.data || newIntake();
  let projectId = previous?.projectId || '';
  let current = previous?.current || null;
  let dirty = previous?.dirty || false;
  let projects = [], records = [], working = false, pdfBusy = false;
  const beforeUnload = event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } };
  window.addEventListener('beforeunload', beforeUnload);
  root.intakeDispose = () => window.removeEventListener('beforeunload', beforeUnload);
  const label = record => `${record.data?.project_name || 'Ficha sin nombre'} · ${record.data?.client_name || 'Cliente por definir'} · ${formatIntakeDate(record.data?.meeting_date)} · v${record.data?.version || '1.0'}`;

  function capture() {
    const form = root.querySelector('#intake-form');
    if (!form) return;
    const values = new FormData(form);
    for (const key of ['version', 'status', ...INTAKE_SECTIONS.flatMap(section => [...section.fields, ...(section.afterFields || [])].map(field => field[0]))]) data[key] = String(values.get(key) ?? data[key] ?? '');
    projectId = String(values.get('project_id') ?? projectId);
    for (const [key, table] of Object.entries(INTAKE_TABLES)) data[key] = [...form.querySelectorAll(`[data-row="${key}"]`)].map(row => Object.fromEntries(table.columns.map(([column]) => [column, row.querySelector(`[data-column="${column}"]`).value])));
  }
  root.intakeDraft = () => { capture(); return { data, projectId, current, dirty }; };
  const hasContent = row => Object.values(row).some(value => String(value).trim());
  function progress() {
    const completed = section => [...section.fields, ...(section.afterFields || [])].some(([key]) => key !== 'meeting_date' && String(data[key] || '').trim()) || (section.tables || [section.table]).filter(Boolean).some(key => data[key]?.some(hasContent));
    const done = INTAKE_SECTIONS.filter(completed).length;
    root.querySelector('#intake-progress').textContent = `${done} de ${INTAKE_SECTIONS.length} secciones con información`;
    root.querySelector('#intake-progress-bar').value = done;
    root.querySelectorAll('[data-section]').forEach(button => {
      const filled = completed(INTAKE_SECTIONS.find(section => section.id === button.dataset.section));
      button.classList.toggle('is-filled', filled);
    });
    root.querySelector('#intake-save-status').textContent = working ? 'Guardando…' : dirty ? 'Cambios sin guardar' : current ? 'Ficha guardada' : 'Nueva ficha';
  }
  function field([key, title, type, help]) {
    const required = ['project_name', 'client_name'].includes(key);
    const attrs = `id="intake-${key}" name="${key}" aria-describedby="help-${key}" ${required ? 'required' : ''}`;
    return `<div class="intake-field ${type === 'textarea' ? 'intake-field--wide' : ''}"><label for="intake-${key}">${esc(title)}${required ? ' *' : ''}</label>${type === 'textarea' ? `<textarea ${attrs} rows="4" maxlength="12000">${esc(data[key] || '')}</textarea>` : `<input ${attrs} type="${type}" ${type === 'text' ? 'maxlength="300"' : ''} value="${esc(data[key] || '')}">`}<p class="intake-hint" id="help-${key}">${esc(help)}</p></div>`;
  }
  function table(key) {
    const definition = INTAKE_TABLES[key];
    return `<div class="intake-repeat intake-repeat--${key}" data-table="${key}"><h3>${definition.title}</h3><p class="intake-hint">${definition.help}</p><div class="intake-rows">${(data[key] || []).map((row, index) => `<div class="intake-row" data-row="${key}" data-index="${index}"><span class="intake-row-number">${index + 1}</span>${definition.columns.map(([column, title]) => `<div class="intake-field"><label for="${key}-${index}-${column}">${title}</label><textarea id="${key}-${index}-${column}" data-column="${column}" rows="3" maxlength="4000">${esc(row[column] || '')}</textarea></div>`).join('')}<button type="button" class="btn-dash btn-dash--secondary intake-remove" data-remove="${key}" data-index="${index}" aria-label="Eliminar fila ${index + 1} de ${definition.title}">Eliminar</button></div>`).join('')}</div><button type="button" data-add="${key}" class="btn-dash btn-dash--secondary">+ ${definition.add}</button>${definition.note ? `<p class="intake-note">${definition.note}</p>` : ''}</div>`;
  }
  function render() {
    root.innerHTML = `<div class="intake-app">
      <div class="dash-card intake-picker"><div class="dash-card__body">
        <div class="intake-field"><label for="intake-select">Fichas guardadas</label><select id="intake-select" ${working ? 'disabled' : ''}><option value="">Nueva ficha</option>${records.map(record => `<option value="${esc(record.id)}" ${current?.id === record.id ? 'selected' : ''}>${esc(label(record))}</option>`).join('')}</select></div>
        <button type="button" id="intake-new" class="btn-dash btn-dash--secondary" ${!canWrite || working ? 'disabled' : ''}>Nueva ficha</button>
        <button type="button" id="intake-refresh" class="btn-dash btn-dash--secondary" ${working ? 'disabled' : ''}>Actualizar lista</button>
      </div></div>
      <div class="intake-workspace"><aside class="intake-index" aria-label="Secciones de la ficha"><span class="intake-eyebrow">LA REUNIÓN, PASO A PASO</span>${INTAKE_SECTIONS.map((section, index) => `<button type="button" data-section="${section.id}"><span>${index + 1}</span>${section.title}</button>`).join('')}<div class="intake-progress-panel"><span class="intake-eyebrow">AVANCE DE LA FICHA</span><p id="intake-progress" class="intake-hint"></p><progress id="intake-progress-bar" max="${INTAKE_SECTIONS.length}" value="0" aria-labelledby="intake-progress"></progress><p class="intake-hint">Registra lo conocido y deja las dudas en pendientes.</p></div></aside>
      <form id="intake-form"><fieldset ${!canWrite || working ? 'disabled' : ''}>
        <section class="dash-card intake-cover"><div class="dash-card__body"><img src="/assets/logo%20extended%20chopped.png" alt="Solven Labs" width="160" height="47"><div><span class="intake-eyebrow">Solven Labs / GESTIÓN DE PROYECTOS</span><h2>Ficha de Levantamiento de Requerimientos</h2><p>Completa la ficha junto al cliente. Las ayudas te orientan durante la reunión; el PDF contiene la información registrada.</p></div><div class="intake-meta"><div class="intake-field"><label for="intake-version">Versión *</label><input id="intake-version" name="version" maxlength="40" required value="${esc(data.version || '1.0')}"></div><div class="intake-field"><label for="intake-status">Estado</label><select id="intake-status" name="status">${INTAKE_STATUSES.map(status => `<option ${data.status === status ? 'selected' : ''}>${status}</option>`).join('')}</select></div></div></div></section>
        ${INTAKE_SECTIONS.map((section, index) => `<section class="dash-card intake-section" tabindex="-1" id="intake-section-${section.id}"><div class="dash-card__body"><div class="intake-section-heading"><span>${index + 1}</span><h2>${section.title}</h2></div><p class="intake-bridge">${section.intro}</p>${index === 0 ? `<div class="intake-field"><label for="intake-project">Vincular a un proyecto del panel</label><select id="intake-project" name="project_id"><option value="">Sin proyecto asignado</option>${projects.map(project => `<option value="${esc(project.id)}" ${projectId === project.id ? 'selected' : ''}>${esc(project.name)}</option>`).join('')}${projectId && !projects.some(project => project.id === projectId) ? `<option value="${esc(projectId)}" selected>Proyecto vinculado no disponible</option>` : ''}</select><p class="intake-hint">Puedes levantar la necesidad antes de crear el proyecto. Los campos con * son necesarios para guardar o generar el PDF.</p></div>` : ''}<div class="intake-fields">${section.fields.map(field).join('')}</div>${(section.tables || [section.table]).filter(Boolean).map(table).join('')}${section.afterFields ? `<div class="intake-fields intake-closing-fields">${section.afterFields.map(field).join('')}</div>` : ''}</div></section>`).join('')}
      </fieldset><div class="dash-card intake-finish"><div class="dash-card__body"><div><h2>Finalizar la ficha</h2><p id="intake-save-status" role="status"></p><p class="intake-hint">El PDF incluye los datos actuales del formulario. Los campos vacíos se muestran como «Por definir».</p></div><div class="intake-final-actions"><button type="submit" class="btn-dash btn-dash--secondary" ${!canWrite || working ? 'disabled' : ''}>Guardar ficha</button><button type="button" id="intake-pdf" class="btn-dash btn-dash--primary" ${working || pdfBusy ? 'disabled' : ''}>${pdfBusy ? 'Generando PDF…' : 'Generar PDF para el cliente'}</button></div></div></div></form></div></div>`;
    progress();
    root.querySelector('#intake-form').addEventListener('input', () => { capture(); dirty = true; progress(); });
    root.querySelector('#intake-form').addEventListener('change', event => {
      capture();
      if (event.target.name === 'project_id') {
        const project = projects.find(item => item.id === projectId);
        for (const [key, value] of [['project_name', project?.name], ['client_name', project?.clients?.name]]) {
          if (!data[key]?.trim() && value) { data[key] = value; root.querySelector(`[name="${key}"]`).value = value; }
        }
      }
      dirty = true; progress();
    });
    root.querySelector('#intake-form').addEventListener('submit', save);
    root.querySelector('#intake-select').addEventListener('change', event => {
      if (!allowDiscard()) { event.target.value = current?.id || ''; return; }
      choose(records.find(record => record.id === event.target.value));
    });
    root.querySelector('#intake-new').addEventListener('click', () => { if (allowDiscard()) choose(); });
    root.querySelector('#intake-refresh').addEventListener('click', async () => { if (allowDiscard()) await load(true); });
    root.querySelector('#intake-pdf').addEventListener('click', exportPDF);
    root.querySelectorAll('[data-section]').forEach(button => button.addEventListener('click', () => {
      root.querySelectorAll('[data-section]').forEach(item => item.removeAttribute('aria-current'));
      button.setAttribute('aria-current', 'step');
      const section = root.querySelector(`#intake-section-${button.dataset.section}`);
      section.focus({ preventScroll: true });
      section.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    }));
    root.querySelectorAll('[data-add]').forEach(button => button.addEventListener('click', () => {
      if (!canWrite || working) return;
      capture(); const key = button.dataset.add;
      if (data[key].length >= 100) return showToast('Puedes agregar hasta 100 filas por tabla.', 'warning');
      data[key].push(Object.fromEntries(INTAKE_TABLES[key].columns.map(([column]) => [column, '']))); dirty = true; render();
      root.querySelector(`[data-row="${key}"][data-index="${data[key].length - 1}"] textarea`).focus();
    }));
    root.querySelectorAll('[data-remove]').forEach(button => button.addEventListener('click', () => {
      if (!canWrite || working) return;
      capture(); const key = button.dataset.remove, index = Number(button.dataset.index);
      if (hasContent(data[key][index]) && !window.confirm('¿Eliminar esta fila de la ficha?')) return;
      data[key].splice(index, 1); dirty = true; render(); root.querySelector(`[data-add="${key}"]`).focus();
    }));
  }
  function allowDiscard() {
    if (working || pdfBusy) return false;
    return !dirty || window.confirm('Hay cambios sin guardar. ¿Descartarlos y continuar?');
  }
  function choose(record, project = null) {
    current = record || null; data = record ? normalizeIntake(record.data) : newIntake(project || {});
    projectId = record?.project_id || project?.id || ''; dirty = false; render();
  }
  async function load(refreshCurrent = false) {
    working = true; render();
    const results = await Promise.allSettled([
      supabase.from('projects').select('id, name, clients(name)').order('name'),
      supabase.from('requirement_intakes').select('*').order('updated_at', { ascending: false })
    ]);
    working = false;
    const [projectResult, recordResult] = results;
    if (projectResult.status === 'fulfilled' && !projectResult.value.error) projects = projectResult.value.data || [];
    else showToast('No se pudieron cargar los proyectos. Puedes completar una ficha sin asignación.', 'warning');
    if (recordResult.status === 'fulfilled' && !recordResult.value.error) {
      records = recordResult.value.data || [];
      if (refreshCurrent && current) {
        const updated = records.find(record => record.id === current.id);
        if (updated) { choose(updated); return; }
        showToast('La ficha ya no está disponible. Se conserva tu copia para descargarla.', 'warning');
      }
    } else showToast('No se pudieron cargar las fichas guardadas. Verifica la conexión, los permisos y la migración de fichas. Puedes completar el formulario y descargar el PDF.', 'warning');
    render();
  }
  async function save(event) {
    event.preventDefault(); if (!canWrite || working) return;
    capture(); const normalized = normalizeIntake(data), error = validateIntake(normalized);
    if (error) return showToast(error, 'warning');
    const payload = { project_id: projectId || null, data: normalized };
    dirty = true;
    working = true; render();
    try {
      const query = current
        ? supabase.from('requirement_intakes').update(payload).eq('id', current.id).eq('updated_at', current.updated_at)
        : supabase.from('requirement_intakes').insert(payload);
      const { data: saved, error: saveError } = await query.select().single();
      if (saveError) throw saveError;
      current = saved; data = normalizeIntake(saved.data); dirty = false;
      records = [saved, ...records.filter(record => record.id !== saved.id)];
      showToast('Ficha guardada.', 'success');
    } catch (error) { showToast(intakeErrorMessage(error), 'error'); }
    finally { working = false; render(); }
  }
  async function exportPDF() {
    if (working || pdfBusy) return;
    capture(); const snapshot = normalizeIntake(data), error = validateIntake(snapshot);
    if (error) { root.querySelector('#intake-form').reportValidity(); return showToast(error, 'warning'); }
    pdfBusy = true;
    const button = root.querySelector('#intake-pdf'); button.disabled = true; button.textContent = 'Generando PDF…';
    try {
      const assets = await getPdfAssets();
      buildIntakePDF(snapshot, assets).save(intakeFilename(snapshot));
      showToast('PDF generado con los datos de la ficha.', 'success');
    } catch (error) { showToast('No se pudo generar el PDF. Revisa la conexión y vuelve a intentar; la ficha se conserva.', 'error'); }
    finally { pdfBusy = false; const currentButton = root.querySelector('#intake-pdf'); currentButton.disabled = working; currentButton.textContent = 'Generar PDF para el cliente'; }
  }
  root.selectRequirementProject = async id => {
    if (!allowDiscard()) return false;
    const record = records.find(item => item.project_id === id), project = projects.find(item => item.id === id);
    if (!project && !record) { showToast('El proyecto no está disponible.', 'warning'); return false; }
    choose(record, project); return true;
  };
  render(); await load();
}

return { intakeErrorMessage, mountRequirements };
})();
// documentAssets
const documentAssets = (() => {

const PDF_SCRIPT_ID = 'jspdf-runtime';
const PDF_SCRIPT_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
const PDF_SCRIPT_INTEGRITY = 'sha384-JcnsjUPPylna1s1fvi1u12X5qjY5OL56iySh75FdtrwhO/SWXgMjoVqcKyIIWOLk';
const COMPANY = Object.freeze({
  name: 'Servicios Informaticos Yevenes & CIA LTDA', rut: '78.352.809-6',
  giro: 'Actividades de consultoria informatica y de gestion de instalaciones informatica',
  address: 'Colo-Colo 379 Of. 706, Concepción, Chile', city: 'Concepción', region: 'Región del Biobío',
  phone: '+56 9 7702 9753', email: 'tomas@solvenlabs.cl', website: 'www.solvenlabs.cl'
});
let runtimePromise = null;
const logoCache = new Map();

function getCompanyInfo() { return { ...COMPANY }; }

function loadPdfRuntime() {
  if (window.jspdf?.jsPDF) return Promise.resolve(window.jspdf);
  if (runtimePromise) return runtimePromise;
  runtimePromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = PDF_SCRIPT_ID;
    script.src = PDF_SCRIPT_URL;
    script.integrity = PDF_SCRIPT_INTEGRITY;
    script.crossOrigin = 'anonymous';
    script.referrerPolicy = 'no-referrer';
    const fail = () => { clearTimeout(timeout); script.remove(); reject(new Error('No se pudo cargar la biblioteca PDF.')); };
    const timeout = setTimeout(fail, 20000);
    script.addEventListener('load', () => {
      if (!window.jspdf?.jsPDF) { fail(); return; }
      clearTimeout(timeout); resolve(window.jspdf);
    }, { once: true });
    script.addEventListener('error', fail, { once: true });
    document.head.appendChild(script);
  }).catch(error => { runtimePromise = null; throw error; });
  return runtimePromise;
}

function loadImageDataURL(url) {
  if (!logoCache.has(url)) {
    const promise = fetch(url).then(response => {
      if (!response.ok) throw new Error('No se pudo cargar el logo Solven Labs.');
      return response.blob();
    }).then(blob => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    })).catch(error => { logoCache.delete(url); throw error; });
    logoCache.set(url, promise);
  }
  return logoCache.get(url);
}

function loadLogoDataURL() {
  // Commercial documents already use the compact mark; preserve their layout.
  return loadImageDataURL('/assets/favicon%20chopped.png').catch(() => null);
}

async function getIntakePdfAssets() {
  const [runtime, logoDataURL] = await Promise.all([loadPdfRuntime(), loadImageDataURL('/assets/logo%20extended%20chopped.png')]);
  return { jsPDF: runtime.jsPDF, logoDataURL, company: getCompanyInfo() };
}

return { getCompanyInfo, loadPdfRuntime, loadLogoDataURL, getIntakePdfAssets };
})();

const { mountRequirements } = intakeUi;
const { getCompanyInfo, loadPdfRuntime, loadLogoDataURL, getIntakePdfAssets } = documentAssets;
// @ts-nocheck
/* ==========================================================================
   Solven Labs Dashboard — JavaScript (Supabase Integration)
   ========================================================================== */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.112.4'
import DOMPurify from 'https://esm.sh/dompurify@3.2.6'

const fallbackParams = new URLSearchParams(window.location.search);
let storedFallbackRoute = null;
try {
  storedFallbackRoute = window.sessionStorage.getItem('ntek:spa-route');
  window.sessionStorage.removeItem('ntek:spa-route');
} catch (_) {
  // El parámetro de la URL funciona aunque sessionStorage esté bloqueado.
}
const fallbackRoute = storedFallbackRoute || fallbackParams.get('spaFallback');
if (fallbackRoute && /^\/(?!\/)/.test(fallbackRoute)) {
  window.history.replaceState({}, '', fallbackRoute);
}

const supabaseUrl = 'https://goqovtiffajnslsyuwbg.supabase.co'
const supabaseKey = 'sb_publishable_YOvjyW8D7ZhQT05pojpNSg_Fh42OLKt'
const mailWorkerUrl = String(document.querySelector('meta[name="ntek-mail-worker-url"]')?.content || '').replace(/\/$/, '')
const mailSendEndpoint = (() => {
  try {
    if (!mailWorkerUrl || /REEMPLAZAR|SUBDOMINIO|PLACEHOLDER/i.test(mailWorkerUrl)) return null;
    const base = new URL(mailWorkerUrl);
    if (base.protocol !== 'https:' || base.username || base.password) return null;
    base.pathname = '/api/mail/send';
    base.search = '';
    base.hash = '';
    return base.toString();
  } catch (_) {
    return null;
  }
})()
const mailReadEndpoint = (() => {
  try {
    if (!mailWorkerUrl || /REEMPLAZAR|SUBDOMINIO|PLACEHOLDER/i.test(mailWorkerUrl)) return null;
    const base = new URL(mailWorkerUrl);
    if (base.protocol !== 'https:' || base.username || base.password) return null;
    base.pathname = '/api/mail/read';
    base.search = '';
    base.hash = '';
    return base.toString();
  } catch (_) {
    return null;
  }
})()
const tabSessionStorage = {
  getItem(key) { try { return window.sessionStorage.getItem(key); } catch (_) { return null; } },
  setItem(key, value) { try { window.sessionStorage.setItem(key, value); } catch (_) {} },
  removeItem(key) { try { window.sessionStorage.removeItem(key); } catch (_) {} }
};
const SUPABASE_AUTH_STORAGE_KEY = 'sb-goqovtiffajnslsyuwbg-auth-token';
try {
  const legacyAuthSession = window.localStorage.getItem(SUPABASE_AUTH_STORAGE_KEY);
  if (legacyAuthSession && !tabSessionStorage.getItem(SUPABASE_AUTH_STORAGE_KEY)) {
    tabSessionStorage.setItem(SUPABASE_AUTH_STORAGE_KEY, legacyAuthSession);
  }
  window.localStorage.removeItem(SUPABASE_AUTH_STORAGE_KEY);
  window.localStorage.removeItem('ntek_user');
  for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
    const key = window.localStorage.key(index);
    if (!key?.startsWith('ntek_task_comments_')) continue;
    const value = window.localStorage.getItem(key);
    if (value && !tabSessionStorage.getItem(key)) tabSessionStorage.setItem(key, value);
    window.localStorage.removeItem(key);
  }
} catch (_) {
  // Auth remains usable in memory if browser storage is unavailable.
}
// Keep auth tokens scoped to the current browser tab. Supabase otherwise uses
// localStorage, where long-lived access/refresh tokens are exposed to every
// script running on the origin and remain after the browser is closed.
let toastSequence = 0;

function restMutationFeedback(method, status, detail = '') {
  if (status >= 200 && status < 300) {
    if (status === 202) {
      showToast('La solicitud fue recibida y continúa procesándose', 'info', 3200, { source: 'rest' });
      return;
    }
    const messages = {
      POST: 'Operación guardada correctamente',
      PUT: 'Cambios guardados correctamente',
      PATCH: 'Cambios guardados correctamente',
      DELETE: 'Registro eliminado correctamente'
    };
    showToast(messages[method] || 'Operación completada correctamente', 'success', 3200, { source: 'rest' });
    return;
  }
  const isWarning = [400, 401, 403, 409, 422, 429].includes(status);
  const fallback = status === 401
    ? 'Tu sesión ya no es válida'
    : status === 403
      ? 'No tienes permiso para realizar esta acción'
      : status === 409
        ? 'La operación entra en conflicto con un registro existente'
        : status === 429
          ? 'Se alcanzó el límite temporal de solicitudes'
          : 'No se pudo completar la operación';
  showToast(detail || fallback, isWarning ? 'warning' : 'error', 5200, { source: 'rest' });
}

async function dashboardApiFetch(input, init = {}) {
  const method = String(init.method || input?.method || 'GET').toUpperCase();
  const requestUrl = String(typeof input === 'string' || input instanceof URL ? input : input?.url || '');
  const isRestMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
    && requestUrl.startsWith(`${supabaseUrl}/rest/v1/`)
    && !requestUrl.includes('/rest/v1/activity_log');
  const initialToastSequence = toastSequence;

  try {
    const response = await window.fetch(input, init);
    if (isRestMutation) {
      const responseCopy = response.clone();
      window.setTimeout(async () => {
        if (toastSequence !== initialToastSequence) return;
        let detail = '';
        if (!response.ok) {
          const payload = await responseCopy.json().catch(() => null);
          detail = String(payload?.message || payload?.error_description || payload?.error || '').slice(0, 180);
        }
        restMutationFeedback(method, response.status, detail);
      }, 900);
    }
    return response;
  } catch (error) {
    if (isRestMutation) {
      window.setTimeout(() => {
        if (toastSequence === initialToastSequence) {
          showToast('No fue posible conectar con el servidor', 'error', 5200, { source: 'rest' });
        }
      }, 900);
    }
    throw error;
  }
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  global: { fetch: dashboardApiFetch },
  auth: {
    storage: tabSessionStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})
const recoveryHashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
const recoveryLinkError = recoveryHashParams.get('error_description');
let passwordRecoveryRequested = window.location.hash.includes('type=recovery')
  || new URLSearchParams(window.location.search).get('recovery') === '1';

supabase.auth.onAuthStateChange((event) => {
  if (event !== 'PASSWORD_RECOVERY') return;
  passwordRecoveryRequested = true;
  if (document.readyState !== 'loading') showPasswordRecoveryForm();
});

function showToast(message, type = 'info', duration = 3200, options = {}) {
  const container = document.getElementById('toast-container');
  if (!container) {
    console.warn('Toast container not found:', message);
    return null;
  }

  const normalizedType = ['success', 'error', 'warning', 'info'].includes(type) ? type : 'info';
  const normalizedMessage = String(message || 'Operación completada');
  const source = options?.source === 'rest' ? 'rest' : 'app';
  if (source === 'app') {
    container.querySelectorAll('.toast[data-source="rest"]').forEach(item => item.remove());
  }
  const duplicate = Array.from(container.querySelectorAll('.toast:not(.toast--leaving)'))
    .find(item => item.dataset.type === normalizedType && item.dataset.message === normalizedMessage);
  if (duplicate) {
    toastSequence += 1;
    duplicate.animate?.([{ transform: 'translateY(0)' }, { transform: 'translateY(-3px)' }, { transform: 'translateY(0)' }], { duration: 180 });
    return duplicate;
  }
  const labels = { success: 'Éxito', error: 'Error', warning: 'Advertencia', info: 'Información' };
  const icons = { success: 'check-circle', error: 'alert-circle', warning: 'alert-triangle', info: 'info' };
  const toast = document.createElement('div');
  toast.className = `toast toast--${normalizedType}`;
  toast.dataset.type = normalizedType;
  toast.dataset.message = normalizedMessage;
  toast.dataset.source = source;
  toast.setAttribute('role', ['error', 'warning'].includes(normalizedType) ? 'alert' : 'status');
  toast.innerHTML = `
    <i data-lucide="${icons[normalizedType]}" class="toast__icon"></i>
    <div class="toast__content">
      <strong class="toast__label">${labels[normalizedType]}</strong>
      <span class="toast__text"></span>
    </div>
    <button type="button" class="toast__close" aria-label="Cerrar notificación">&times;</button>
  `;

  toast.querySelector('.toast__text').textContent = normalizedMessage;
  const dismiss = () => {
    if (!toast.isConnected || toast.classList.contains('toast--leaving')) return;
    toast.classList.add('toast--leaving');
    window.setTimeout(() => toast.remove(), 180);
  };
  toast.querySelector('.toast__close').addEventListener('click', dismiss);
  const visibleToasts = container.querySelectorAll('.toast');
  if (visibleToasts.length >= 4) visibleToasts[0].remove();
  container.appendChild(toast);
  toastSequence += 1;

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons({ attrs: { 'stroke-width': 2 } });
  }

  window.setTimeout(dismiss, duration);

  return toast;
}

window.showToast = showToast;

function updateAppViewportHeight() {
  const viewportHeight = window.visualViewport?.height || window.innerHeight || 0;
  if (viewportHeight) {
    document.documentElement.style.setProperty('--app-vh', `${viewportHeight * 0.01}px`);
  }
}

updateAppViewportHeight();
window.addEventListener('resize', updateAppViewportHeight, { passive: true });
window.addEventListener('orientationchange', updateAppViewportHeight);

const DASHBOARD_PAGES = [
  { id: 'overview', label: 'Inicio', group: 'Principal' },
  { id: 'projects', label: 'Proyectos', group: 'Principal' },
  { id: 'tasks', label: 'Tareas', group: 'Principal' },
  { id: 'messages', label: 'Mensajes', group: 'Operación' },
  { id: 'calendar', label: 'Calendar', group: 'Gestión' },
  { id: 'relations', label: 'Relaciones', group: 'Gestión' },
  { id: 'quotes', label: 'Cotizaciones', group: 'Gestión' },
  { id: 'requirements', label: 'Levantamiento', group: 'Gestión' },
  { id: 'orders', label: 'Tickets', group: 'Operación' },
  { id: 'service-orders', label: 'Órdenes', group: 'Operación' },
  { id: 'bookings', label: 'Reservas', group: 'Operación' },
  { id: 'sii', label: 'Finanzas', group: 'Finanzas' },
  { id: 'receipts', label: 'Boletas', group: 'Finanzas' },
  { id: 'maintenance', label: 'Facturación', group: 'Finanzas' },
  { id: 'analytics', label: 'Analíticas', group: 'Reportes' },
  { id: 'reports', label: 'Reportes', group: 'Reportes' },
  { id: 'team', label: 'Equipo', group: 'Sistema' },
  { id: 'practices', label: 'Bitácora', group: 'Personas' },
  { id: 'practitioner-profile', label: 'Perfil practicante', group: 'Personas' },
  { id: 'settings', label: 'Configuración', group: 'Sistema' }
];

const DASHBOARD_PAGE_SLUGS = {
  overview: '',
  projects: 'proyectos',
  tasks: 'tareas',
  messages: 'mensajes',
  relations: 'relaciones',
  quotes: 'cotizaciones',
  requirements: 'requisitos',
  calendar: 'calendar',
  orders: 'tickets',
  'service-orders': 'ordenes-servicio',
  bookings: 'reservas',
  sii: 'finanzas',
  receipts: 'boletas',
  maintenance: 'facturacion',
  analytics: 'analiticas',
  reports: 'reportes',
  practices: 'bitacora',
  'practitioner-profile': 'perfil-practicante',
  team: 'equipo',
  settings: 'configuracion'
};

const DASHBOARD_SLUG_PAGES = Object.fromEntries(
  Object.entries(DASHBOARD_PAGE_SLUGS).map(([pageId, slug]) => [slug, pageId])
);
DASHBOARD_SLUG_PAGES.calendario = 'calendar'; // compatibilidad con enlaces anteriores

function dashboardPagePath(pageId) {
  const slug = DASHBOARD_PAGE_SLUGS[pageId];
  return slug ? `/dashboard/${slug}` : '/dashboard';
}

function dashboardPageFromLocation() {
  const cleanPath = window.location.pathname.replace(/\/+$/, '') || '/';
  if (cleanPath === '/dashboard' || cleanPath === '/dashboard.html') return 'overview';
  if (!cleanPath.startsWith('/dashboard/')) return null;
  const slug = decodeURIComponent(cleanPath.slice('/dashboard/'.length));
  return DASHBOARD_SLUG_PAGES[slug] || null;
}

function updateDashboardPageMetadata(pageId) {
  const page = DASHBOARD_PAGES.find(item => item.id === pageId);
  document.title = `${page?.label || 'Dashboard'} | Solven Labs`;
}

function syncPageHeaderEyebrows(pageId) {
  const eyebrowSelectors = '.mail-eyebrow';
  const pageElement = document.getElementById(`page-${pageId}`);
  const legacyPageGroups = { invoices: 'Finanzas', payments: 'Finanzas', taxes: 'Finanzas', expenses: 'Finanzas' };

  pageElement?.querySelectorAll(eyebrowSelectors).forEach((eyebrow) => {
    const ownerPageId = eyebrow.closest('.dash-page')?.id.replace(/^page-/, '') || pageId;
    const groupName = DASHBOARD_PAGES.find(item => item.id === ownerPageId)?.group || legacyPageGroups[ownerPageId] || 'Panel';
    const iconMarkup = eyebrow.querySelector('svg, i')?.outerHTML || '';
    eyebrow.innerHTML = `${iconMarkup} ${groupName}`;
  });
}

const DASHBOARD_ACTIONS = [
  { id: 'btn-export-report', label: 'Exportar reportes', group: 'Reportes' },
  { id: 'btn-export-relations', label: 'Exportar relaciones', group: 'Relaciones' },
  { id: 'btn-add-client', label: 'Gestionar clientes', group: 'Relaciones' },
  { id: 'btn-add-provider', label: 'Gestionar proveedores', group: 'Relaciones' },
  { id: 'btn-add-project', label: 'Gestionar proyectos', group: 'Proyectos' },
  { id: 'btn-add-task', label: 'Gestionar tareas', group: 'Tareas' },
  { id: 'btn-add-order', label: 'Gestionar tickets', group: 'Tickets' },
  { id: 'btn-add-service-order', label: 'Gestionar órdenes de servicio', group: 'Órdenes' },
  { id: 'btn-add-event', label: 'Gestionar eventos', group: 'Calendar' },
  { id: 'btn-site-refresh-messages', label: 'Gestionar mensajes', group: 'Mensajes' },
  { id: 'btn-add-mp-subscription', label: 'Activar mantención facturada', group: 'Facturación' },
  { id: 'dashboard-receipt-print', label: 'Emitir e imprimir boletas', group: 'Boletas' },
  { id: 'btn-export-cotizaciones', label: 'Exportar cotizaciones', group: 'Finanzas' },
  { id: 'btn-nueva-cotizacion', label: 'Gestionar cotizaciones', group: 'Finanzas' },
  { id: 'btn-export-payments', label: 'Exportar pagos', group: 'Finanzas' },
  { id: 'btn-add-payment', label: 'Gestionar pagos', group: 'Finanzas' },
  { id: 'btn-export-expenses', label: 'Exportar gastos', group: 'Finanzas' },
  { id: 'btn-add-expense', label: 'Gestionar gastos', group: 'Finanzas' },
  { id: 'btn-export-presii', label: 'Exportar documentos Pre-SII', group: 'SII' },
  { id: 'btn-nueva-presii', label: 'Gestionar documentos Pre-SII', group: 'SII' },
  { id: 'btn-export-sii', label: 'Exportar movimientos SII', group: 'SII' },
  { id: 'btn-sii-factura-venta', label: 'Factura de venta SII', group: 'SII' },
  { id: 'btn-sii-factura-compra', label: 'Factura de compra SII', group: 'SII' },
  { id: 'btn-sii-honorarios', label: 'Honorarios SII', group: 'SII' },
  { id: 'btn-sii-gasto', label: 'Gasto SII', group: 'SII' },
  { id: 'btn-sii-ingreso', label: 'Ingreso SII', group: 'SII' },
  { id: 'btn-export-f29', label: 'Exportar F29', group: 'Impuestos' },
  { id: 'btn-export-f22', label: 'Exportar F22', group: 'Impuestos' },
  { id: 'btn-add-practice-log', label: 'Crear entradas de bitácora', group: 'Prácticas' },
];

function cloneRoleDefinitions(source) {
  return JSON.parse(JSON.stringify(source));
}

const defaultRoleDefinitions = {
  administracion: {
    name: 'Administración',
    description: 'Acceso completo al dashboard y a las acciones de gestión.',
    is_system: true,
    pages: DASHBOARD_PAGES.map(page => page.id),
    buttons: DASHBOARD_ACTIONS.map(action => action.id)
  },
  contabilidad: {
    name: 'Contabilidad',
    description: 'Acceso centrado en finanzas, impuestos, reportes y analíticas.',
    is_system: true,
    pages: ['sii', 'receipts', 'quotes', 'maintenance', 'analytics', 'reports', 'settings'],
    buttons: ['btn-export-presii', 'btn-add-mp-subscription']
  },
  team: {
    name: 'Miembro',
    description: 'Acceso operativo a proyectos, tareas, relaciones, tickets y calendario.',
    is_system: true,
    pages: ['overview', 'projects', 'tasks', 'messages', 'sii', 'receipts', 'relations', 'calendar', 'orders', 'service-orders', 'settings'],
    buttons: ['btn-add-project', 'btn-add-service-order']
  },
  practicante: {
    name: 'Practicante',
    description: 'Acceso exclusivo a su bitácora y a su perfil de práctica.',
    is_system: true,
    pages: ['practices', 'practitioner-profile', 'calendar'],
    buttons: ['btn-add-practice-log']
  }
};

let rolePermissions = cloneRoleDefinitions(defaultRoleDefinitions);
let dashboardRoles = Object.entries(defaultRoleDefinitions).map(([slug, role]) => ({ slug, ...role }));
let dashboardRoutingReady = false;

function getCurrentRole() {
  return (currentProfile && currentProfile.role) ? String(currentProfile.role).toLowerCase() : 'team';
}


function canManageRoles() {
  return ['administracion', 'admin'].includes(getCurrentRole());
}

function isAdministrativeRole(role) {
  const normalizedRole = String(role || '').trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return ['administracion', 'admin', 'administrator', 'administrador'].includes(normalizedRole);
}

function getRolePermissionSet(role = getCurrentRole()) {
  const normalizedRole = String(role || '').toLowerCase();
  if (rolePermissions[normalizedRole]) return rolePermissions[normalizedRole];
  if (normalizedRole === 'admin') return rolePermissions.administracion || rolePermissions.team;
  return rolePermissions.team;
}

function escapeCssIdentifier(value) {
  if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(value);
  return String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
}

function isPageAllowed(pageId) {
  if (pageId === 'contracts') return false;
  if (pageId === 'bookings' && isAdministrativeRole(getCurrentRole())) return true;
  const allowed = getRolePermissionSet();
  return allowed.pages.includes(pageId);
}

function isButtonAllowed(btnId) {
  const allowed = getRolePermissionSet();
  return allowed.buttons.includes(btnId);
}

function getRoleLabel(slug) {
  const role = dashboardRoles.find(item => item.slug === slug) || rolePermissions[slug];
  return role?.name || (slug ? String(slug).charAt(0).toUpperCase() + String(slug).slice(1) : 'Usuario');
}

function getDefaultAllowedPage() {
  const allowed = getRolePermissionSet();
  return allowed.pages?.find(page => isPageAllowed(page)) || 'overview';
}

function getActivePageId() {
  return document.querySelector('.dash-page.active')?.id?.replace(/^page-/, '') || null;
}

function updateCurrentUserChrome() {
  const userName = document.getElementById('user-name');
  const userRole = document.getElementById('user-role');
  const userAvatar = document.getElementById('user-avatar');
  if (userName) userName.textContent = currentProfile?.full_name || currentProfile?.email || 'Usuario';
  if (userRole) userRole.textContent = getRoleLabel(currentProfile?.role);
  if (userAvatar) {
    if (currentProfile?.avatar_url) {
      userAvatar.innerHTML = `<img src="${escapeHtml(assetUrl(currentProfile.avatar_url))}" alt="${escapeHtml(currentProfile?.full_name || 'Usuario')}" style="width:40px;height:40px;border-radius:8px;object-fit:cover;border:2px solid var(--dash-accent);">`;
    } else {
      userAvatar.innerHTML = '<i data-lucide="user"></i>';
    }
    if (typeof lucide !== 'undefined') setTimeout(() => lucide.createIcons(), 50);
  }
}

function normalizeRoleSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_ -]/g, '')
    .replace(/\s+/g, '_')
    .replace(/-+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function normalizePermissionArray(values, allowedIds) {
  const allowedSet = new Set(allowedIds);
  return Array.from(new Set((values || []).filter(value => allowedSet.has(value))));
}

function buildRolePayloadFromForm(prefix = 'role') {
  const roleName = document.getElementById(`${prefix}-name`)?.value.trim() || '';
  const slugInput = document.getElementById(`${prefix}-slug`)?.value.trim() || roleName;
  const slug = normalizeRoleSlug(slugInput);
  const description = document.getElementById(`${prefix}-description`)?.value.trim() || null;
  const pages = Array.from(document.querySelectorAll(`[data-role-page="${prefix}"]:checked`)).map(input => input.value);
  const buttons = Array.from(document.querySelectorAll(`[data-role-action="${prefix}"]:checked`)).map(input => input.value);
  return {
    slug,
    name: roleName,
    description,
    pages: normalizePermissionArray(pages, DASHBOARD_PAGES.map(page => page.id)),
    buttons: normalizePermissionArray(buttons, DASHBOARD_ACTIONS.map(action => action.id))
  };
}

function getRoleOptionsHtml(selectedRole = '') {
  return dashboardRoles
    .map(role => `<option value="${escapeHtml(role.slug)}" ${role.slug === selectedRole ? 'selected' : ''}>${escapeHtml(getRoleLabel(role.slug))}</option>`)
    .join('');
}

async function loadDashboardRoles() {
  try {
    const { data, error } = await db.roles.getAll();
    if (error) throw error;
    if (!Array.isArray(data) || data.length === 0) return;

    const mergedRoles = [...data];
    Object.entries(defaultRoleDefinitions).forEach(([slug, definition]) => {
      if (!mergedRoles.some(role => role.slug === slug)) mergedRoles.push({ slug, ...definition });
    });

    dashboardRoles = mergedRoles.map(role => {
      const validPageIds = new Set(DASHBOARD_PAGES.map(page => page.id));
      const validActionIds = new Set(DASHBOARD_ACTIONS.map(action => action.id));
      const dbPages = Array.isArray(role.pages) ? role.pages.filter(pageId => validPageIds.has(pageId)) : [];
      const dbButtons = Array.isArray(role.buttons) ? role.buttons.filter(buttonId => validActionIds.has(buttonId)) : [];
      const administrativeRole = isAdministrativeRole(role.slug);
      return {
        slug: role.slug,
        name: role.name,
        description: role.description || '',
        pages: administrativeRole ? DASHBOARD_PAGES.map(page => page.id) : dbPages,
        buttons: administrativeRole ? DASHBOARD_ACTIONS.map(action => action.id) : dbButtons,
        is_system: Boolean(role.is_system)
      };
    });

    rolePermissions = dashboardRoles.reduce((acc, role) => {
      acc[role.slug] = {
        name: role.name,
        description: role.description,
        pages: role.pages || [],
        buttons: role.buttons || [],
        is_system: role.is_system
      };
      return acc;
    }, {});
  } catch (err) {
    console.warn('No se pudieron cargar roles dinámicos. Usando roles locales:', err);
    rolePermissions = cloneRoleDefinitions(defaultRoleDefinitions);
    dashboardRoles = Object.entries(defaultRoleDefinitions).map(([slug, role]) => ({ slug, ...role }));
  }
}

async function auditLog(description, activityType = 'general', entityId = null, entityName = null) {
  try {
    const { error } = await db.activity.log({
      user_id: currentProfile?.id || null,
      user_name: currentProfile?.full_name || currentProfile?.email || null,
      activity_type: activityType,
      description,
      entity_id: entityId,
      entity_name: entityName
    });
    if (error) throw error;
  } catch (err) {
    console.warn('Error escribiendo registro de auditoría:', err);
  }
}

function applyRoleRestrictions() {
  const allowed = getRolePermissionSet();
  const isAdmin = isAdministrativeRole(getCurrentRole());

  // Para administración estas vistas representan gestión de varias personas,
  // no la bitácora o el perfil personal de quien inició sesión.
  const practiceLabels = isAdmin
    ? { logs: 'Bitácoras', profiles: 'Practicantes' }
    : { logs: 'Bitácora', profiles: 'Perfil practicante' };
  document.querySelectorAll('[data-practice-nav-label]').forEach(label => {
    label.textContent = practiceLabels[label.dataset.practiceNavLabel] || label.textContent;
  });
  const practicesTitle = document.getElementById('practices-page-title');
  if (practicesTitle) practicesTitle.textContent = practiceLabels.logs;
  const practitionerProfileTitle = document.getElementById('practitioner-profile-title');
  if (practitionerProfileTitle) practitionerProfileTitle.textContent = isAdmin ? 'Practicantes' : 'Perfil del practicante';

  // Sidebar nav
  document.querySelectorAll('.sidebar__link[data-page]').forEach(link => {
    const pageId = link.dataset.page;
    if (!allowed.pages.includes(pageId)) {
      link.style.display = 'none';
    } else {
      link.style.display = '';
    }
  });

  // Collapse/hide groups with no pages
  document.querySelectorAll('.sidebar__group').forEach(group => {
    const items = Array.from(group.querySelectorAll('.sidebar__link'));
    const visible = items.some(item => item.style.display !== 'none');
    group.style.display = visible ? '' : 'none';
  });

  // Hide section labels/containers with no links visible
  document.querySelectorAll('.sidebar__section').forEach(section => {
    const links = Array.from(section.querySelectorAll('.sidebar__link')); // includes top-level and nested
    const visibleLinks = links.filter(link => link.style.display !== 'none');
    section.style.display = visibleLinks.length > 0 ? '' : 'none';
  });

  // Hide pages no autorizadas
  document.querySelectorAll('.dash-page').forEach(page => {
    const pageId = page.id.replace(/^page-/, '');
    page.style.display = allowed.pages.includes(pageId) ? '' : 'none';
  });

  // Button-level access
  DASHBOARD_ACTIONS.map(action => action.id).forEach(btnId => {
    const escapedId = escapeCssIdentifier(btnId);
    document.querySelectorAll(`#${escapedId}, [data-permission-action="${escapedId}"]`).forEach(element => {
      element.style.display = isButtonAllowed(btnId) ? '' : 'none';
    });
  });

  const rolesCard = document.getElementById('settings-roles-card');
  if (rolesCard) rolesCard.style.display = canManageRoles() ? '' : 'none';

  // Inhabilitar días afecta la disponibilidad pública y es exclusivo de administración.
  const blockDayButton = document.getElementById('btn-add-block');
  if (blockDayButton) blockDayButton.style.display = isAdministrativeRole(getCurrentRole()) ? '' : 'none';

  const addTeamMemberButton = document.getElementById('btn-add-team-member');
  if (addTeamMemberButton) addTeamMemberButton.style.display = isAdministrativeRole(getCurrentRole()) ? '' : 'none';

  const addEmployeeButton = document.getElementById('btn-add-employee');
  if (addEmployeeButton) addEmployeeButton.style.display = isAdministrativeRole(getCurrentRole()) ? '' : 'none';

  const activePageId = getActivePageId();
  if (dashboardRoutingReady && activePageId && !allowed.pages.includes(activePageId)) {
    const defaultPage = getDefaultAllowedPage();
    navigateTo(defaultPage, true);
  }
}

async function refreshCurrentAccess({ showNotice = false } = {}) {
  await loadDashboardRoles();
  updateCurrentUserChrome();
  renderRolesTable();
  applyRoleRestrictions();
  if (showNotice) showToast('Tus permisos fueron actualizados', 'info');
}

async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) console.error('Error getting session:', error);
  return session;
}

async function viewProject(id) {
  // bind dynamic add button for subtasks in edit modal
  (function bindEditSubtaskAdder() {
    const container = document.getElementById('edit-order-subtasks');
    if (!container) return;
    let counter = 1;
    container.addEventListener('click', (e) => {
      if (e.target && e.target.id && e.target.id.startsWith('btn-edit-subtask-add')) {
        const idx = counter++;
        const row = document.createElement('div');
        row.style.display = 'flex'; row.style.gap = '8px';
        row.innerHTML = `<input type="text" class="modal-form__input" id="edit-subtask-title-${idx}" placeholder="Título subtarea"><input type="date" class="modal-form__input" id="edit-subtask-due-${idx}" style="width:150px;"><button type="button" class="btn-dash btn-dash--secondary" id="btn-edit-subtask-add-${idx}">Añadir</button>`;
        container.appendChild(row);
      }
    });
  })();
  const { data: p, error } = await db.projects.getById(id);
  if (error || !p) { showToast('Proyecto no encontrado', 'error'); return; }

  // Determine client display name (support nested relation `clients` or scalar `client_name`, fallback to fetching client)
  let clientRecord = p.clients || null;
  let clientDisplay = p.client_name || (clientRecord && (clientRecord.company || clientRecord.name)) || '-';
  let clientRut = p.client_rut || '';
  if (p.client_id && (!clientRecord || clientDisplay === '-' || !clientRut)) {
    const { data: clientData } = await db.clients.getById(p.client_id);
    if (clientData) {
      clientRecord = clientData;
      if (clientDisplay === '-') clientDisplay = clientData.company || clientData.name || '-';
      if (!clientRut) clientRut = clientData.rut || '';
    }
  }
  const clientName = clientDisplay !== '-' ? clientDisplay : '';

  // Cotizaciones se filtran por cliente; las finanzas se consolidan desde
  // todas las fuentes disponibles.
  let cotQuery = supabase.from('cotizaciones').select('*').order('created_at', { ascending: false }).limit(6);
  let ticketsQuery = supabase.from('orders').select('id,title,description,status,priority,due_date,created_at,updated_at').eq('project_id', id).order('created_at', { ascending: false }).limit(20);
  if (clientRut && clientName) {
    cotQuery = cotQuery.or(`rut_receptor.eq.${clientRut},cliente.ilike.%${clientName}%`);
  } else if (clientRut) {
    cotQuery = cotQuery.eq('rut_receptor', clientRut);
  } else if (clientName) {
    cotQuery = cotQuery.ilike('cliente', `%${clientName}%`);
  } else {
    cotQuery = cotQuery.eq('rut_receptor', '__none__');
  }

  const [
    { data: tasks },
    financePresii,
    financePayments,
    { data: financeExpenses },
    { data: financeIncome },
    { data: cotizacionesForProject },
    { data: ticketsForProject }
  ] = await Promise.all([
    supabase.from('tasks').select('*').eq('project_id', id).order('due_date', { ascending: true }).limit(10),
    getPresiiDocs(),
    getPagos(),
    supabase.from('expenses').select('*').order('created_at', { ascending: false }),
    supabase.from('fin_ingresos').select('*').order('created_at', { ascending: false }),
    cotQuery,
    ticketsQuery
  ]);

  // fetch project members (join to team_members)
  const { data: projMembers } = await supabase.from('project_members').select('team_member_id, team_members(full_name, avatar_url)').eq('project_id', id);
  const membersList = (projMembers || []).map(pm => pm.team_members ? { id: pm.team_member_id, name: pm.team_members.full_name, avatar: pm.team_members.avatar_url } : null).filter(Boolean);

  const techs = (p.technologies || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
  const tasksCount = (tasks && tasks.length) ? tasks.length : 0;
  const tasksPreview = (tasks && tasks.length > 0) ? tasks.slice(0, 3) : [];
  const tasksHtml = (tasksCount === 0) ? '<div style="color:var(--dash-text-secondary);padding:8px;">Sin tareas</div>' : tasksPreview.map(t => `
    <div class="item"><div style="max-width:70%;"><div style="font-weight:600;">${escapeHtml(t.title || t.name || 'Tarea')}</div><div style="font-size:12px;color:var(--dash-text-secondary);">${t.completed ? 'Completada' : (t.due_date ? formatDateShort(t.due_date) : 'Sin fecha')}</div></div><div style="font-weight:700;">${t.completed ? '✓' : ''}</div></div>
  `).join('') + (tasksCount > 3 ? `<div style="padding:8px;color:var(--dash-text-secondary);font-size:0.9rem;"><a href="#" onclick="navigateTo('tasks');return false;">Ver todas las tareas (${tasksCount})</a></div>` : '');

  const normalizeFinancialKey = value => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  const normalizeClientName = value => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(token => !['spa', 'ltda', 'limitada', 'sa', 'eirl'].includes(token))
    .join('');
  const clientRutKey = normalizeFinancialKey(clientRut);
  const clientIdentityKeys = [...new Set([
    clientName,
    clientRecord?.name,
    clientRecord?.company
  ].map(normalizeClientName).filter(key => key.length >= 4))];
  const matchesClientRut = (...values) =>
    !!clientRutKey && values.some(value => normalizeFinancialKey(value) === clientRutKey);
  const matchesClientIdentity = (...values) =>
    values.map(normalizeClientName).filter(Boolean)
      .some(value => clientIdentityKeys.includes(value));
  const containsClientIdentity = (...values) =>
    values.map(normalizeFinancialKey).filter(Boolean).some(value =>
      (!!clientRutKey && value.includes(clientRutKey)) ||
      clientIdentityKeys.some(key => value.includes(key))
    );
  const isAssociatedFinance = (item, { ruts = [], identities = [], references = [] } = {}) =>
    String(item?.project_id || '') === String(id) ||
    (p.client_id && String(item?.client_id || '') === String(p.client_id)) ||
    matchesClientRut(...ruts) ||
    matchesClientIdentity(...identities) ||
    containsClientIdentity(...references);
  const financialMovements = [];
  const addMovement = ({ source, id: movementId, title, date, status, amount, outgoing = false }) => {
    const numericAmount = Math.abs(Number(amount) || 0);
    if (!numericAmount) return;
    financialMovements.push({
      key: `${source}-${movementId || financialMovements.length}`,
      source,
      title: title || source,
      date: date || '',
      status: status || '',
      amount: numericAmount,
      outgoing
    });
  };

  (financePresii || []).forEach(item => {
    const operation = String(item.operacion || (String(item.tipo_dte || '') === '110' ? 'compra' : 'venta')).toLowerCase();
    const relevantRut = operation === 'compra'
      ? (item.emi_rut || item.rut_receptor)
      : (item.rut_receptor || item.emi_rut);
    const relevantName = operation === 'compra'
      ? (item.emi_name || item.razon_social)
      : (item.razon_social || item.emi_name);
    if (!isAssociatedFinance(item, {
      ruts: [relevantRut],
      identities: [relevantName],
      references: [item.observaciones]
    })) return;
    const totals = calcTotalsFromItems(item.items || [], item.exento || false);
    addMovement({
      source: operation === 'compra' ? 'Compra' : 'Venta',
      id: item.id,
      title: `${dteName(item.tipo_dte)} #${String(item.folio || '').padStart(6, '0')}`,
      date: item.fecha || item.created_at,
      status: normalizeSiiPaidStatus(item.estado || 'borrador'),
      amount: Number(item.total) || totals.total,
      outgoing: operation === 'compra'
    });
  });

  (financePayments || []).filter(item => String(item.tipo || '').toLowerCase() === 'honorarios').forEach(item => {
    if (!isAssociatedFinance(item, {
      ruts: [item.rut],
      identities: [item.nombre, item.empresa, item.origen],
      references: [item.cargo, item.descripcion, item.referencia]
    })) return;
    const operation = getPagoOperation(item);
    addMovement({
      source: operation === 'venta' ? 'Honorario venta' : 'Honorario compra',
      id: item.id,
      title: item.cargo || item.descripcion || 'Boleta de honorarios',
      date: item.fecha || item.created_at,
      status: normalizeSiiPaidStatus(item.status || 'registrado'),
      amount: Number(item.neto || item.bruto || item.amount || 0),
      outgoing: operation === 'compra'
    });
  });

  (financeExpenses || []).forEach(item => {
    if (!isAssociatedFinance(item, {
      ruts: [item.rut, item.vendor_rut],
      identities: [item.vendor, item.empresa, item.origen, item.cliente],
      references: [item.description, item.notes, item.receipt_number]
    })) return;
    addMovement({
      source: 'Gasto',
      id: item.id,
      title: item.description || item.vendor || 'Gasto por compra',
      date: item.date_incurred || item.created_at,
      status: normalizeSiiPaidStatus(item.status || 'pendiente'),
      amount: item.amount,
      outgoing: true
    });
  });

  (financeIncome || []).filter(item => isAssociatedFinance(item, {
    ruts: [item.rut, item.rut_cliente],
    identities: [item.cliente, item.empresa, item.origen, item.nombre],
    references: [item.concepto, item.referencia, item.observaciones]
  })).forEach(item => {
    addMovement({
      source: 'Ingreso',
      id: item.id,
      title: item.concepto || item.referencia || 'Ingreso',
      date: item.fecha || item.created_at,
      status: item.estado,
      amount: item.monto
    });
  });

  financialMovements.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  const financeHtmlProject = financialMovements.length ? financialMovements.map(item => `
    <div class="item">
      <div style="min-width:0;">
        <div style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(item.title)}</div>
        <div style="font-size:12px;color:var(--dash-text-secondary);">${escapeHtml(item.source)}${item.date ? ` · ${escapeHtml(formatDateShort(item.date))}` : ''}${item.status ? ` · ${escapeHtml(item.status)}` : ''}</div>
      </div>
      <div style="font-weight:700;white-space:nowrap;${item.outgoing ? 'color:#dc2626;' : ''}">${item.outgoing ? '−' : ''}${formatCurrencyShort(item.amount)}</div>
    </div>`).join('') : '<div style="color:var(--dash-text-secondary);padding:8px 0;">Sin montos financieros asociados</div>';

  const cotizacionesHtmlProject = (cotizacionesForProject && cotizacionesForProject.length > 0) ? cotizacionesForProject.map(c => {
    const { total } = calcTotalsFromItems(c.items || [], c.exento || false);
    const badge = c.estado === 'aceptada' ? 'color:#165aa3;' : c.estado === 'rechazada' ? 'color:#dc2626;' : 'color:var(--dash-text-secondary);';
    return `<div class="item"><div><div style="font-weight:600;">COT-${escapeHtml(String(c.folio || '').padStart(6, '0'))}</div><div style="font-size:12px;"><span style="${badge}">${escapeHtml(c.estado || 'vigente')}</span>${c.fecha ? ' · ' + c.fecha : ''}</div></div><div style="font-weight:700;">${formatCurrencyShort(total)}</div></div>`;
  }).join('') : '<div style="color:var(--dash-text-secondary);padding:8px 0;">Sin cotizaciones asociadas</div>';

  const ticketStatusMeta = (status) => ({
    pending: { label: 'Pendiente', badge: 'pending' },
    in_progress: { label: 'En progreso', badge: 'active' },
    review: { label: 'En revisión', badge: 'review' },
    done: { label: 'Resuelto', badge: 'completed' }
  }[String(status || 'pending').toLowerCase()] || { label: 'Pendiente', badge: 'pending' });

  const ticketsHtmlProject = (ticketsForProject && ticketsForProject.length > 0)
    ? ticketsForProject.map(ticket => {
      const meta = ticketStatusMeta(ticket.status);
      return `
        <div class="item">
          <div class="item__content">
            <div class="item__title">${escapeHtml(ticket.title || 'Ticket')}</div>
            <div class="item__subtitle">
              ${ticket.category ? `${escapeHtml(ticket.category)} · ` : ''}
              ${ticket.due_date ? `Vence ${formatDateShort(ticket.due_date)} · ` : ''}
              ${ticket.created_at ? `Creado ${timeAgo(ticket.created_at)}` : 'Sin fecha'}
            </div>
            <span class="status-badge status-badge--${meta.badge}" style="margin-top:6px;">${meta.label}</span>
          </div>
          <div class="item__value">${escapeHtml(ticket.priority || 'medium')}</div>
        </div>`;
    }).join('')
    : '<div style="color:var(--dash-text-secondary);padding:8px 0;">Sin tickets asociados</div>';

  const content = `
    <div class="project-detail-layout">
      <div>
        <h3 style="margin:0 0 6px;">${escapeHtml(p.name)}</h3>
        <div style="color:var(--dash-text-secondary);margin-bottom:8px;">Cliente: ${escapeHtml(clientDisplay)}</div>
        <div style="margin-bottom:12px;">${escapeHtml(p.description || '')}</div>
        ${isPageAllowed('requirements') ? `<div class="project-detail-actions"><button type="button" class="btn-dash btn-dash--secondary" onclick="openProjectRequirements('${p.id}')"><i data-lucide="list-checks"></i> Ver ficha de levantamiento</button></div>` : ''}
        <div style="margin-bottom:12px;display:flex;gap:8px;flex-wrap:wrap;">${techs}</div>
        <div class="project-detail-stats">
          <div class="client-stat"><div class="label">Progreso</div><div class="value">${p.progress || 0}%</div></div>
          <div class="client-stat"><div class="label">Estado</div><div class="value">${statusLabel(p.status)}</div></div>
        </div>
        <div class="project-detail-panel" style="margin-top:18px;">
          <h4 style="margin:0 0 8px;">Tareas próximas <span style="color:var(--dash-text-secondary);font-weight:600;font-size:0.9rem;">(${tasksCount})</span></h4>
          <div class="client-list">${tasksHtml}</div>
        </div>
        <div class="project-detail-panel" style="margin-top:12px;">
          <h4 style="margin:0 0 8px;">Cotizaciones</h4>
          <div class="client-list">${cotizacionesHtmlProject}</div>
        </div>
      </div>
      <div>
        <div style="background:var(--dash-bg-secondary);padding:16px;border-radius:14px;margin-bottom:16px;">
          <div style="display:flex;justify-content:space-between;font-size:0.9rem;color:var(--dash-text-secondary);"><span>Inicio</span><span>${p.start_date ? formatDateShort(p.start_date) : '-'}</span></div>
          <div style="display:flex;justify-content:space-between;font-size:0.9rem;color:var(--dash-text-secondary);margin-top:10px;"><span>Entrega estimada</span><span>${p.estimated_end_date ? formatDateShort(p.estimated_end_date) : '-'}</span></div>
          <div style="display:flex;justify-content:space-between;font-size:0.9rem;color:var(--dash-text-secondary);margin-top:10px;align-items:center;"><span>Miembros</span><span style="font-weight:700;">${p.member_count || membersList.length || 0}</span></div>
          ${membersList.length ? `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;">${membersList.map(m => `<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:999px;background:var(--dash-surface);"><img src="${assetUrl(m.avatar) || '/assets/perfil.jpg'}" alt="" style="width:28px;height:28px;border-radius:50%;object-fit:cover;border:1px solid rgba(0,0,0,0.08);"><div style="font-size:0.92rem;color:var(--dash-text-secondary);">${escapeHtml(m.name)}</div></div>`).join('')}</div>` : ''}
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div style="font-weight:700;">Finanzas asociadas</div>
          <div class="modal-actions">
            <button class="btn-icon" title="Editar proyecto" onclick="editProject('${p.id}')"><i data-lucide="pencil" style="width:14px;height:14px;"></i></button>
            <button class="btn-icon" title="Portal del cliente" onclick="manageProjectPortal('${p.id}')"><i data-lucide="link" style="width:14px;height:14px;"></i></button>
          </div>
        </div>
        <div style="font-size:0.82rem;font-weight:600;color:var(--dash-text-secondary);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Movimientos identificados (${financialMovements.length})</div>
        <div class="client-list" style="margin-bottom:10px;">${financeHtmlProject}</div>
        <div style="font-size:0.82rem;font-weight:600;color:var(--dash-text-secondary);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Tickets / Historial</div>
        <div class="client-list" style="margin-bottom:12px;">${ticketsHtmlProject}</div>

      </div>
    </div>
  `;

  openModal(`${escapeHtml(p.name)}`, content, null, null, true);
  const modalContentEl = document.querySelector('.dash-modal__content');
  if (modalContentEl) modalContentEl.classList.add('dash-modal__content--fullscreen');
  if (typeof lucide !== "undefined") setTimeout(() => lucide.createIcons(), 50);
}

// Quick factura pre-SII from project
async function quickCreateInvoiceForProject(projectId) {
  const { data: p } = await db.projects.getById(projectId);
  const prefill = p ? { razon_social: p.client_name || '', rut_receptor: p.client_rut || '', project_id: projectId, project_name: p.name || '' } : {};
  if (!document.getElementById('page-invoices').classList.contains('active')) navigateTo('facturas');
  setTimeout(() => openPresiiModal(null, prefill), 150);
}

async function getUser() {
  const session = await getSession();
  if (!session) return null;
  return session.user;
}

async function getUserProfile() {
  const user = await getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  return data;
}

async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  return { data, error };
}

async function signUp(email, password, metadata = {}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata // { full_name, role, company }
    }
  });
  return { data, error };
}

function generateTemporaryPassword(length = 12) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#';
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, byte => alphabet[byte % alphabet.length]).join('');
}

async function signOut() {
  await auditLog('Cierre de sesión', 'general');
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
  }
  return !error;
}

// ========== DB HELPERS ==========

const db = {
  // ---------- Clients ----------
  clients: {
    async getAll() {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });
      return { data, error };
    },
    async getById(id) {
      const { data, error } = await supabase.from('clients').select('*').eq('id', id).single();
      return { data, error };
    },
    async create(client) {
      const { data, error } = await supabase.from('clients').insert(client).select().single();
      if (!error) invalidateModalEntitySearchCache('client');
      return { data, error };
    },
    async update(id, updates) {
      const { data, error } = await supabase.from('clients').update(updates).eq('id', id).select().single();
      if (!error) invalidateModalEntitySearchCache('client');
      return { data, error };
    },
    async delete(id) {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (!error) invalidateModalEntitySearchCache('client');
      return { error };
    },
    async search(query) {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .or(`name.ilike.%${query}%,company.ilike.%${query}%,email.ilike.%${query}%`)
        .order('name');
      return { data, error };
    }
  },

  // ---------- Projects ----------
  projects: {
    async getAll() {
      const { data, error } = await supabase
        .from('projects_with_details')
        .select('*')
        .order('created_at', { ascending: false });
      return { data, error };
    },
    async getById(id) {
      const { data, error } = await supabase.from('projects').select('*, clients(name, company)').eq('id', id).single();
      return { data, error };
    },
    async create(project) {
      const { data, error } = await supabase.from('projects').insert(project).select().single();
      if (!error) invalidateModalEntitySearchCache('project');
      return { data, error };
    },
    async update(id, updates) {
      const { data, error } = await supabase.from('projects').update(updates).eq('id', id).select().single();
      if (!error) invalidateModalEntitySearchCache('project');
      return { data, error };
    },
    async delete(id) {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (!error) invalidateModalEntitySearchCache('project');
      return { error };
    }
  },

  // ---------- Tasks ----------
  tasks: {
    async getAll() {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, projects(name)')
        .order('completed', { ascending: true })
        .order('due_date', { ascending: true });
      return { data, error };
    },
    async getById(id) {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single();
      return { data, error };
    },
    async create(task) {
      const { data, error } = await supabase.from('tasks').insert(task).select().single();
      return { data, error };
    },
    async update(id, updates) {
      const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select().single();
      return { data, error };
    },
    async toggle(id, completed) {
      const updates = { completed, completed_at: completed ? new Date().toISOString() : null };
      return await this.update(id, updates);
    },
    async delete(id) {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      return { error };
    }
  },

  // ---------- Orders (Kanban) ----------
  orders: {
    async getAll() {
      const { data, error } = await supabase
        .from('orders')
        .select('*, team_members(full_name, avatar_url), projects(name)')
        .order('sort_order');
      return { data, error };
    },
    async create(order) {
      const { data, error } = await supabase.from('orders').insert(order).select().single();
      return { data, error };
    },
    async updateStatus(id, status) {
      const { data, error } = await supabase.from('orders').update({ status }).eq('id', id).select().single();
      return { data, error };
    },
    async update(id, updates) {
      const { data, error } = await supabase.from('orders').update(updates).eq('id', id).select().single();
      return { data, error };
    },
    async delete(id) {
      const { error } = await supabase.from('orders').delete().eq('id', id);
      return { error };
    }
  },

  // ---------- Órdenes de servicio técnico ----------
  serviceOrders: {
    async getAll() {
      const { data, error } = await supabase
        .from('service_orders')
        .select('*')
        .order('service_date', { ascending: false })
        .order('created_at', { ascending: false });
      return { data, error };
    },
    async create(order) {
      const { data, error } = await supabase.from('service_orders').insert(order).select().single();
      return { data, error };
    },
    async update(id, updates) {
      const { data, error } = await supabase.from('service_orders').update(updates).eq('id', id).select().single();
      return { data, error };
    },
    async delete(id) {
      const { error } = await supabase.from('service_orders').delete().eq('id', id);
      return { error };
    }
  },

  // ---------- Facturación / Servicios ----------
  facturacion: {
    async getAll() {
      const { data, error } = await supabase
        .from('facturacion_items')
        .select('*, projects(name)')
        .order('due_date', { ascending: true });
      return { data, error };
    },
    async getById(id) {
      const { data, error } = await supabase.from('facturacion_items').select('*').eq('id', id).single();
      return { data, error };
    },
    async create(item) {
      const { data, error } = await supabase.from('facturacion_items').insert(item).select().single();
      return { data, error };
    },
    async update(id, updates) {
      const { data, error } = await supabase.from('facturacion_items').update(updates).eq('id', id).select().single();
      return { data, error };
    },
    async delete(id) {
      const { error } = await supabase.from('facturacion_items').delete().eq('id', id);
      return { error };
    }
  },

  // ---------- Order Subtasks ----------
  orderSubtasks: {
    async getByOrderId(orderId) {
      const { data, error } = await supabase
        .from('order_subtasks')
        .select('*')
        .eq('order_id', orderId)
        .order('sort_order', { ascending: true });
      return { data, error };
    },
    async create(item) {
      const { data, error } = await supabase.from('order_subtasks').insert(item).select().single();
      return { data, error };
    },
    async update(id, updates) {
      const { data, error } = await supabase.from('order_subtasks').update(updates).eq('id', id).select().single();
      return { data, error };
    },
    async delete(id) {
      const { error } = await supabase.from('order_subtasks').delete().eq('id', id);
      return { error };
    }
  },

  // ---------- Documents ----------
  documents: {
    async getAll() {
      const { data, error } = await supabase
        .from('documents_with_uploader')
        .select('*');
      return { data, error };
    },
    async create(doc) {
      const { data, error } = await supabase.from('documents').insert(doc).select().single();
      return { data, error };
    },
    async delete(id) {
      // Primero obtener la ruta del archivo
      const { data: doc } = await supabase.from('documents').select('file_path').eq('id', id).single();
      if (doc?.file_path) {
        await supabase.storage.from('documents').remove([doc.file_path]);
      }
      const { error } = await supabase.from('documents').delete().eq('id', id);
      return { error };
    },
    async getFolderCounts() {
      const { data, error } = await supabase
        .from('documents')
        .select('folder');
      if (error) return { data: {}, error };
      const counts = {};
      (data || []).forEach(d => {
        counts[d.folder] = (counts[d.folder] || 0) + 1;
      });
      return { data: counts, error: null };
    }
  },

  // ---------- Events ----------
  events: {
    async getAll() {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date')
        .order('start_time');
      return { data, error };
    },
    async getById(id) {
      const { data, error } = await supabase
        .from('events')
        .select('*, event_attendees(id,email,name,status,created_at)')
        .eq('id', id)
        .single();
      return { data, error };
    },
    async getByRecurrenceGroup(recurrenceGroupId) {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('recurrence_group_id', recurrenceGroupId)
        .order('event_date')
        .order('start_time');
      return { data, error };
    },
    async getByDate(date) {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('event_date', date)
        .order('start_time');
      return { data, error };
    },
    async getByMonth(year, month) {
      const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const endDate = new Date(year, month + 1, 0);
      const endStr = `${year}-${String(month + 1).padStart(2, '0')}-${endDate.getDate()}`;
      const { data, error } = await supabase
        .from('events')
        .select('event_date')
        .gte('event_date', startDate)
        .lte('event_date', endStr);
      return { data, error };
    },
    async create(event) {
      const { data, error } = await supabase.from('events').insert(event).select().single();
      return { data, error };
    },
    async createMany(events) {
      const { data, error } = await supabase.from('events').insert(events).select();
      return { data, error };
    },
    async createBlock(block) {
      if (!isAdministrativeRole(getCurrentRole())) {
        return { data: null, error: new Error('Esta acción es exclusiva de administración.') };
      }
      const { data, error } = await supabase.rpc('create_calendar_block', {
        p_title: block.title,
        p_description: block.description,
        p_event_date: block.event_date,
        p_start_time: block.start_time,
        p_end_time: block.end_time
      });
      if (!error && !data?.ok) {
        const message = data?.status === 'invalid_interval'
          ? 'El intervalo de horario no es válido.'
          : 'No se pudo inhabilitar el día.';
        return { data, error: new Error(message) };
      }
      return { data, error };
    },
    async update(id, updates) {
      const { data, error } = await supabase.from('events').update(updates).eq('id', id).select().single();
      return { data, error };
    },
    async delete(id) {
      // Las visitas pagadas también están vinculadas a visit_reservations.
      // El RPC cancela esa reserva y elimina el evento en una sola transacción,
      // evitando dejar el horario bloqueado por una reserva approved huérfana.
      const { data, error } = await supabase.rpc('delete_calendar_event', { p_event_id: id });
      if (!error && !data?.event_deleted) {
        return { data, error: new Error('El evento ya no existe o no pudo eliminarse.') };
      }
      return { data, error };
    },
    async deleteSeries(recurrenceGroupId) {
      const { data, error } = await supabase.rpc('delete_calendar_event_series', { p_recurrence_group_id: recurrenceGroupId });
      if (!error && !(Number(data?.events_deleted) > 0)) {
        return { data, error: new Error('La serie ya no existe o no pudo eliminarse.') };
      }
      return { data, error };
    }
  },

  // ---------- Team ----------
  team: {
    async getAll() {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('full_name');
      return { data, error };
    },
    async getById(id) {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('id', id)
        .single();
      return { data, error };
    },
  },

  // ---------- Providers ----------
  providers: {
    async getAll() {
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .order('created_at', { ascending: false });
      return { data, error };
    },
    async getById(id) {
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('id', id)
        .single();
      return { data, error };
    },
    async create(provider) {
      const { data, error } = await supabase.from('providers').insert(provider).select().single();
      if (!error) invalidateModalEntitySearchCache('provider');
      return { data, error };
    },
    async update(id, updates) {
      const { data, error } = await supabase.from('providers').update(updates).eq('id', id).select().single();
      if (!error) invalidateModalEntitySearchCache('provider');
      return { data, error };
    },
    async delete(id) {
      const { error } = await supabase.from('providers').delete().eq('id', id);
      if (!error) invalidateModalEntitySearchCache('provider');
      return { error };
    },
    async search(query) {
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .or(`name.ilike.%${query}%,company.ilike.%${query}%,email.ilike.%${query}%`)
        .order('name');
      return { data, error };
    }
  },

  // ---------- Activity ----------
  activity: {
    async getRecent(limit = 10) {
      const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(safeLimit);
      return { data, error };
    },
    async log(entry) {
      const description = String(entry?.description || '').trim();
      const nonSignificantActivity = /^(navegó|visitó|abrió|visualizó|consultó)\b/i;
      if (!description || nonSignificantActivity.test(description)) return { data: null, error: null, skipped: true };
      const allowedActivityTypes = ['project', 'invoice', 'client', 'provider', 'document', 'deploy', 'general', 'task', 'order', 'team'];
      const normalized = {
        ...entry,
        user_id: entry.user_id || currentProfile?.id || null,
        user_name: entry.user_name || currentProfile?.full_name || currentProfile?.email || null,
        activity_type: allowedActivityTypes.includes(entry.activity_type) ? entry.activity_type : 'general',
        description
      };
      const { error } = await supabase.from('activity_log').insert(normalized);
      return { data: null, error };
    }
  },

  // ---------- KPIs ----------
  kpis: {
    async get() {
      const { data, error } = await supabase.from('dashboard_kpis').select('*').single();
      return { data, error };
    },
    async getMonthlyRevenue(monthsBack = 6) {
      const { data, error } = await supabase.rpc('get_monthly_revenue', { months_back: monthsBack });
      return { data, error };
    }
  },

  // ---------- Profiles ----------
  profiles: {
    async getAll() {
      const { data, error } = await supabase.from('profiles').select('*').order('full_name');
      return { data, error };
    },
    async get(id) {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
      return { data, error };
    },
    async update(id, updates) {
      const { data, error } = await supabase.from('profiles').update(updates).eq('id', id).select().single();
      return { data, error };
    }
  },

  // ---------- Prácticas ----------
  practices: {
    async getLogs({ userId = null, includeAll = false } = {}) {
      let query = supabase
        .from('internship_logs')
        .select('*, practitioner:profiles!internship_logs_profile_id_fkey(id,full_name,email,avatar_url,phone,position)')
        .is('deleted_at', null)
        .order('log_date', { ascending: false })
        .order('created_at', { ascending: false });
      if (!includeAll && userId) query = query.eq('profile_id', userId);
      const { data, error } = await query;
      return { data, error };
    },
    async createLog(entry) {
      const { data, error } = await supabase.from('internship_logs').insert(entry).select().single();
      return { data, error };
    },
    async updateLog(id, updates) {
      const { data, error } = await supabase.from('internship_logs').update(updates).eq('id', id).select().single();
      return { data, error };
    },
    async getProfiles({ userId = null, includeAll = false } = {}) {
      let query = supabase
        .from('internship_profiles')
        .select('*, profile:profiles!internship_profiles_profile_id_fkey(id,full_name,email,phone,position,avatar_url,created_at)')
        .order('start_date', { ascending: false });
      if (!includeAll && userId) query = query.eq('profile_id', userId);
      const { data, error } = await query;
      return { data, error };
    },
    async upsertProfile(profile) {
      const { data, error } = await supabase.from('internship_profiles').upsert(profile, { onConflict: 'profile_id' }).select().single();
      return { data, error };
    }
  },

  // ---------- Dashboard Roles ----------
  roles: {
    async getAll() {
      const { data, error } = await supabase
        .from('dashboard_roles')
        .select('*')
        .order('is_system', { ascending: false })
        .order('name');
      return { data, error };
    },
    async get(slug) {
      const { data, error } = await supabase
        .from('dashboard_roles')
        .select('*')
        .eq('slug', slug)
        .single();
      return { data, error };
    },
    async upsert(role) {
      const { data, error } = await supabase
        .from('dashboard_roles')
        .upsert(role, { onConflict: 'slug' })
        .select()
        .single();
      return { data, error };
    },
    async update(slug, updates) {
      const { data, error } = await supabase
        .from('dashboard_roles')
        .update(updates)
        .eq('slug', slug)
        .select()
        .single();
      return { data, error };
    },
    async delete(slug) {
      const { error } = await supabase.from('dashboard_roles').delete().eq('slug', slug);
      return { error };
    }
  },

  // ---------- Public Contact Messages ----------
  siteMessages: {
    async getAll() {
      const { data, error } = await supabase
        .from('site_messages')
        .select('*')
        .order('created_at', { ascending: false });
      return { data, error };
    },
    async updateStatus(id, status) {
      const { data, error } = await supabase
        .from('site_messages')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      return { data, error };
    },
    async delete(id) {
      const { error } = await supabase.from('site_messages').delete().eq('id', id);
      return { error };
    }
  },

  // ---------- Solven Labs Mail ----------
  mail: {
    async getMailboxes() {
      const { data, error } = await supabase
        .from('mailboxes')
        .select('id,address,display_name')
        .eq('active', true)
        .order('address');
      return { data, error };
    },
    async getAll() {
      const messages = [];
      const pageSize = 500;
      for (let offset = 0; ; offset += pageSize) {
        const { data, error } = await supabase
          .from('mail_messages')
          .select('id,mailbox_id,message_id,from_address,from_name,reply_to_address,reply_to_name,to_address,to_addresses,cc_addresses,bcc_addresses,subject,body_text,body_html,headers,received_at,sent_at,is_read,read_at,direction,delivery_status,in_reply_to,message_references')
          .order('received_at', { ascending: false })
          .order('id')
          .range(offset, offset + pageSize - 1);
        if (error) return { data: null, error };
        messages.push(...(data || []));
        if (!data || data.length < pageSize) return { data: messages, error: null };
      }
    },
    async setRead(id, isRead) {
      return updateNtekMailReadState(id, isRead);
    },
    async delete(id) {
      const { error } = await supabase.from('mail_messages').delete().eq('id', id);
      return { error };
    }
  },

  // ---------- Storage ----------
  storage: {
    async uploadFile(bucket, path, file) {
      const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });
      return { data, error };
    },
    getPublicUrl(bucket, path) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl;
    },
    async deleteFile(bucket, path) {
      const { error } = await supabase.storage.from(bucket).remove([path]);
      return { error };
    }
  }
};

let currentProfile = null;
let currentClientType = 'client';
let accessRealtimeChannel = null;

function setClientType(type) {
  currentClientType = type;
}

function initAccessRealtime() {
  if (!currentProfile?.id || accessRealtimeChannel) return;

  accessRealtimeChannel = supabase
    .channel('dashboard-access-control')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'dashboard_roles' }, async () => {
      await refreshCurrentAccess({ showNotice: false });
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${currentProfile.id}` }, async payload => {
      const previousRole = currentProfile?.role;
      currentProfile = { ...currentProfile, ...(payload.new || {}) };
      await refreshCurrentAccess({ showNotice: previousRole !== currentProfile.role });
    })
    .subscribe(status => {
      if (status === 'CHANNEL_ERROR') {
        console.warn('No se pudo suscribir a cambios de permisos en tiempo real.');
      }
    });
}

async function removeLegacyNotificationServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations().catch(() => []);
  await Promise.all(registrations
    .filter(registration => registration.active?.scriptURL?.endsWith('/notification-sw.js'))
    .map(async registration => {
      const subscription = await registration.pushManager?.getSubscription().catch(() => null);
      await subscription?.unsubscribe().catch(() => {});
      await registration.unregister().catch(() => {});
    }));
}
const SYSTEM_STATUS_PHRASES = {
  200: 'OK',
  201: 'Created',
  204: 'No Content',
  301: 'Moved Permanently',
  302: 'Found',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  408: 'Request Timeout',
  426: 'Upgrade Required',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout'
};

function systemStatusCodeLevel(code) {
  if (code >= 500) return 'error';
  if (code >= 400) return 'warning';
  return 'ok';
}

function systemStatusCodeText(code) {
  return `${code} ${SYSTEM_STATUS_PHRASES[code] || (code < 400 ? 'OK' : 'Error')}`;
}

function systemStatusWithTimeout(promise, timeoutMs = 7000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => {
        const error = new Error('Tiempo de espera agotado');
        error.status = 504;
        reject(error);
      }, timeoutMs);
    })
  ]);
}

async function checkDashboardInfrastructure() {
  const siteStarted = performance.now();
  const siteController = new AbortController();
  const siteTimeout = window.setTimeout(() => siteController.abort(), 7000);

  const sitePromise = fetch(`${window.location.origin}/`, {
    method: 'HEAD',
    cache: 'no-store',
    credentials: 'same-origin',
    signal: siteController.signal
  }).finally(() => window.clearTimeout(siteTimeout));

  const dbStarted = performance.now();
  const databasePromise = systemStatusWithTimeout(
    supabase.from('projects').select('id').limit(1),
    7000
  );

  const authStarted = performance.now();
  const authPromise = systemStatusWithTimeout(supabase.auth.getUser(), 7000);

  const storageStarted = performance.now();
  const storagePromise = systemStatusWithTimeout(
    supabase.storage.from('documents').list('', { limit: 1 }),
    7000
  );

  const nicStarted = performance.now();
  const nicPromise = systemStatusWithTimeout(
    fetch('https://www.nic.cl/', { method: 'HEAD', mode: 'no-cors', cache: 'no-store' }),
    7000
  );

  const edgeStarted = performance.now();
  const edgePromise = systemStatusWithTimeout(
    fetch(`${supabaseUrl}/functions/v1/booking-availability`, {
      method: 'OPTIONS',
      cache: 'no-store',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`
      }
    }),
    7000
  );

  const [siteResult, databaseResult, authResult, storageResult, nicResult, edgeResult] = await Promise.allSettled([
    sitePromise,
    databasePromise,
    authPromise,
    storagePromise,
    nicPromise,
    edgePromise
  ]);

  let siteResponse = null;
  let siteCode = 503;
  let siteDetail = 'No fue posible conectar con el dominio';
  if (siteResult.status === 'fulfilled') {
    siteResponse = siteResult.value;
    siteCode = siteResponse.status || 200;
    siteDetail = `${window.location.hostname} · ${Math.round(performance.now() - siteStarted)} ms`;
  } else if (siteResult.reason?.name === 'AbortError') {
    siteCode = 504;
    siteDetail = 'El dominio superó 7 segundos';
  }

  const responseHeaders = siteResponse?.headers;
  const renderId = responseHeaders?.get('rndr-id');
  const cloudflareRay = responseHeaders?.get('cf-ray');
  const cloudflareCache = responseHeaders?.get('cf-cache-status');
  const serverHeader = responseHeaders?.get('server') || '';
  const renderDetected = Boolean(renderId);
  const cloudflareDetected = Boolean(cloudflareRay || cloudflareCache || /cloudflare/i.test(serverHeader));

  const databaseResponse = databaseResult.status === 'fulfilled' ? databaseResult.value : null;
  const databaseCode = databaseResult.status === 'fulfilled'
    ? (databaseResponse?.error ? Number(databaseResponse.status || databaseResponse.error?.status || 503) : Number(databaseResponse?.status || 200))
    : Number(databaseResult.reason?.status || 503);

  const authResponse = authResult.status === 'fulfilled' ? authResult.value : null;
  const authCode = authResult.status === 'fulfilled'
    ? (authResponse?.error ? Number(authResponse.error?.status || 503) : 200)
    : Number(authResult.reason?.status || 503);

  const storageResponse = storageResult.status === 'fulfilled' ? storageResult.value : null;
  const storageError = storageResponse?.error;
  const storageCode = storageResult.status === 'fulfilled'
    ? (storageError ? Number(storageError.statusCode || storageError.status || 503) : 200)
    : Number(storageResult.reason?.status || 503);

  const nicResponse = nicResult.status === 'fulfilled' ? nicResult.value : null;
  const nicCode = nicResult.status === 'fulfilled'
    ? (nicResponse?.type === 'opaque' ? 200 : Number(nicResponse?.status || 200))
    : Number(nicResult.reason?.status || 503);

  const edgeResponse = edgeResult.status === 'fulfilled' ? edgeResult.value : null;
  const edgeCode = edgeResult.status === 'fulfilled'
    ? Number(edgeResponse?.status || 200)
    : Number(edgeResult.reason?.status || 503);

  const results = [
    {
      name: 'Dominio',
      code: siteCode,
      detail: siteDetail
    },
    {
      name: 'Render',
      code: renderDetected ? 200 : 404,
      detail: renderDetected ? `Cabecera rndr-id detectada` : 'Proveedor no detectado en cabeceras'
    },
    {
      name: 'Cloudflare',
      code: cloudflareDetected ? 200 : 404,
      detail: cloudflareDetected ? `Red activa${cloudflareRay ? ` · ${cloudflareRay}` : ''}` : 'Proxy no detectado en cabeceras'
    },
    {
      name: 'NIC Chile',
      code: nicCode,
      detail: nicCode < 400
        ? `Servicio alcanzable · ${Math.round(performance.now() - nicStarted)} ms`
        : (nicResult.reason?.message || 'Servicio de dominios no disponible')
    },
    {
      name: 'Supabase',
      code: databaseCode,
      detail: databaseCode < 400
        ? `Consulta de lectura · ${Math.round(performance.now() - dbStarted)} ms`
        : (databaseResponse?.error?.message || databaseResult.reason?.message || 'Consulta no disponible')
    },
    {
      name: 'Auth (Supabase)',
      code: authCode,
      detail: authCode < 400
        ? `Usuario validado · ${Math.round(performance.now() - authStarted)} ms`
        : (authResponse?.error?.message || authResult.reason?.message || 'Servicio no disponible')
    },
    {
      name: 'Storage (Supabase)',
      code: storageCode,
      detail: storageCode < 400
        ? `Bucket documents accesible · ${Math.round(performance.now() - storageStarted)} ms`
        : (storageError?.message || storageResult.reason?.message || 'Bucket no disponible')
    },
    {
      name: 'Edge Functions (Supabase)',
      code: edgeCode,
      detail: edgeCode < 400
        ? `booking-availability responde · ${Math.round(performance.now() - edgeStarted)} ms`
        : `booking-availability · ${edgeResult.status === 'fulfilled' ? systemStatusCodeText(edgeCode) : (edgeResult.reason?.message || 'Función no disponible')}`
    }
  ];
  return results;
}

function initSystemStatusWidget() {
  const widget = document.getElementById('system-status-widget');
  const trigger = document.getElementById('system-status-trigger');
  const panel = document.getElementById('system-status-panel');
  const refresh = document.getElementById('system-status-refresh');
  const list = document.getElementById('system-status-list');
  const summary = document.getElementById('system-status-summary');
  const checked = document.getElementById('system-status-checked');
  if (!widget || !trigger || !panel || !refresh || !list || !summary || !checked) return;

  widget.hidden = false;
  widget.dataset.state = 'idle';
  let checkInProgress = false;
  let lastCheckedAt = 0;

  const renderResults = results => {
    list.innerHTML = results.map(item => {
      const level = systemStatusCodeLevel(item.code);
      return `
        <div class="system-status-item">
          <div class="system-status-item__name">
            <strong>${escapeHtml(item.name)}</strong>
            <span title="${escapeHtml(item.detail)}">${escapeHtml(item.detail)}</span>
          </div>
          <span class="system-status-code system-status-code--${level}">${systemStatusCodeText(item.code)}</span>
        </div>`;
    }).join('');

    const errors = results.filter(item => systemStatusCodeLevel(item.code) === 'error').length;
    const warnings = results.filter(item => systemStatusCodeLevel(item.code) === 'warning').length;
    widget.dataset.state = errors ? 'error' : warnings ? 'warning' : 'ok';
    summary.textContent = errors
      ? `${errors} servicio${errors === 1 ? '' : 's'} con error`
      : warnings
        ? `${warnings} comprobación${warnings === 1 ? '' : 'es'} con aviso`
        : 'Todos los servicios responden';
    trigger.setAttribute('aria-label', errors
      ? `Estado del sistema: ${errors} servicio${errors === 1 ? '' : 's'} con error`
      : warnings
        ? `Estado del sistema: ${warnings} aviso${warnings === 1 ? '' : 's'}`
        : 'Estado del sistema: todos los servicios responden');
    lastCheckedAt = Date.now();
    checked.textContent = `Comprobado ${new Date().toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'medium' })}`;
  };

  const runChecks = async () => {
    if (checkInProgress) return;
    checkInProgress = true;
    if (!lastCheckedAt) widget.dataset.state = 'loading';
    refresh.classList.add('is-loading');
    refresh.disabled = true;
    summary.textContent = 'Comprobando en vivo...';
    list.innerHTML = `
      <div class="system-status-item">
        <div class="system-status-item__name"><strong>Ejecutando comprobaciones</strong><span>Dominio, hosting y servicios de Supabase</span></div>
        <span class="system-status-code system-status-code--warning">...</span>
      </div>`;
    try {
      renderResults(await checkDashboardInfrastructure());
    } catch (error) {
      widget.dataset.state = 'error';
      summary.textContent = 'No se pudo completar la comprobación';
      list.innerHTML = `<div class="system-status-item"><div class="system-status-item__name"><strong>Error general</strong><span>${escapeHtml(error?.message || 'Error desconocido')}</span></div><span class="system-status-code system-status-code--error">500 Internal Server Error</span></div>`;
      trigger.setAttribute('aria-label', 'Estado del sistema: error de comprobación');
      lastCheckedAt = Date.now();
      checked.textContent = `Error comprobado ${new Date().toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'medium' })}`;
    } finally {
      checkInProgress = false;
      refresh.classList.remove('is-loading');
      refresh.disabled = false;
    }
  };

  const setOpen = open => {
    panel.hidden = !open;
    trigger.setAttribute('aria-expanded', String(open));
    if (open && Date.now() - lastCheckedAt > 30000) runChecks();
  };

  trigger.addEventListener('click', () => setOpen(panel.hidden));
  refresh.addEventListener('click', runChecks);
  document.addEventListener('click', event => {
    if (!panel.hidden && !widget.contains(event.target)) setOpen(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) setOpen(false);
  });

  // El indicador se comprueba al cargar y se mantiene actualizado sin abrir el panel.
  runChecks();
  window.setInterval(() => {
    if (document.visibilityState === 'visible') runChecks();
  }, 60000);
  window.addEventListener('online', runChecks);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && Date.now() - lastCheckedAt > 60000) runChecks();
  });

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // ---------- Auth Check ----------
  const session = await getSession();
  const loginPage = document.getElementById('login-page');
  const dashboardContainer = document.getElementById('dashboard-container');

  if (passwordRecoveryRequested) {
    if (recoveryLinkError) {
      loginPage.style.display = 'flex';
      dashboardContainer.style.display = 'none';
      initLoginPage();
      showAuthView('forgot');
      showLoginAlert('error', 'El enlace expiró o ya fue utilizado. Solicita uno nuevo.');
      return;
    }
    showPasswordRecoveryForm();
    return;
  }

  if (!session) {
    // Show login page
    loginPage.style.display = 'flex';
    dashboardContainer.style.display = 'none';
    initLoginPage();
    return;
  }

  // Show dashboard
  loginPage.style.display = 'none';
  dashboardContainer.style.display = 'block';
  const requestedRoutePage = dashboardPageFromLocation();

  // Get user profile
  currentProfile = await getUserProfile();
  await loadDashboardRoles();
  removeLegacyNotificationServiceWorker().catch(() => {});
  initAccessRealtime();

  // Aplicar restricciones según rol (visual y acceso)
  applyRoleRestrictions();

  // Set user info in sidebar
  updateCurrentUserChrome();

  // ---------- Init Modules ----------
  initSidebar();
  initNavigation();
  initModalSystem();
  initSearch();
  initTableDragScroll();
  initLogout();
  initSystemStatusWidget();

  const clientTypeSelect = document.getElementById('client-type-select');
  if (clientTypeSelect) {
    clientTypeSelect.addEventListener('change', (e) => {
      setClientType(e.target.value);
    });
  }

  // Load global dynamic data (sidebar badges)
  await updateSidebarBadges();
  const candidatePage = requestedRoutePage;
  const initialPage = candidatePage && isPageAllowed(candidatePage) ? candidatePage : getDefaultAllowedPage();
  history.replaceState({ page: initialPage }, '', dashboardPagePath(initialPage));
  dashboardRoutingReady = true;
  await navigateTo(initialPage, true);

  // Handle browser back/forward
  window.addEventListener('popstate', async (e) => {
    const page = (e.state && e.state.page) || dashboardPageFromLocation() || getDefaultAllowedPage();
    await navigateTo(page, true);
  });
});

// ==========================================================================
// LOGIN PAGE
// ==========================================================================
function initLoginPage() {
  // Toggle password
  document.querySelectorAll('.form-field__toggle-pass').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.parentElement.querySelector('input');
      if (!input) return;
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      // Lucide reemplaza <i> con <svg>, buscar ambos
      const icon = btn.querySelector('i') || btn.querySelector('svg');
      if (icon) {
        icon.setAttribute('data-lucide', isPassword ? 'eye-off' : 'eye');
        if (typeof lucide !== 'undefined') lucide.createIcons({ nodes: [icon] });
      }
    });
  });

  const forgotPasswordBtn = document.getElementById('forgot-password-btn');
  forgotPasswordBtn?.addEventListener('click', () => {
    const loginEmail = document.getElementById('login-email')?.value.trim() || '';
    const forgotEmail = document.getElementById('forgot-email');
    if (forgotEmail) forgotEmail.value = loginEmail;
    showAuthView('forgot');
  });

  document.querySelectorAll('[data-auth-back-login]').forEach(button => {
    button.addEventListener('click', () => showAuthView('login'));
  });

  const forgotForm = document.getElementById('form-forgot-password');
  forgotForm?.addEventListener('submit', async event => {
    event.preventDefault();
    const emailInput = document.getElementById('forgot-email');
    const email = emailInput?.value.trim() || '';
    if (!email || !emailInput.checkValidity()) {
      showLoginAlert('error', 'Ingresa un correo electrónico válido');
      emailInput?.focus();
      return;
    }
    const submitButton = forgotForm.querySelector('.login__submit');
    const error = await sendPasswordRecoveryEmail(email, submitButton);
    if (error) {
      showLoginAlert('error', 'No pudimos enviar el correo. Espera un momento e intenta nuevamente.');
      return;
    }
    showAuthView('sent', email);
  });

  document.getElementById('recovery-resend-btn')?.addEventListener('click', async event => {
    const button = event.currentTarget;
    const email = button.dataset.email || document.getElementById('forgot-email')?.value.trim();
    if (!email) return showAuthView('forgot');
    const error = await sendPasswordRecoveryEmail(email, button);
    if (error) {
      showLoginAlert('error', 'No pudimos reenviar el correo. Intenta más tarde.');
      return;
    }
    showLoginAlert('success', 'Correo reenviado. Revisa también tu carpeta de spam.');
    button.disabled = true;
    setTimeout(() => { button.disabled = false; }, 30000);
  });

  // Login form
  document.getElementById('form-login').addEventListener('submit', async function (e) {
    e.preventDefault();
    const btn = this.querySelector('.login__submit');
    btn.classList.add('loading');
    btn.disabled = true;
    hideLoginAlert();

    const emailInput = this.querySelector('[type="email"]');
    // El tipo cambia a "text" cuando la contraseña está visible, por eso
    // identificamos el campo mediante su nombre estable.
    const passwordInput = this.querySelector('[name="password"]');

    if (!emailInput || !passwordInput) {
      showLoginAlert('error', 'Error: formulario incompleto');
      btn.classList.remove('loading');
      btn.disabled = false;
      return;
    }

    const email = emailInput.value;
    const password = passwordInput.value;

    try {
      const { data, error } = await signIn(email, password);

      if (error) {
        let msg = 'Error al iniciar sesión';
        if (error.message.includes('Invalid login')) {
          msg = 'Email o contraseña incorrectos';
        } else if (error.message.includes('Email not confirmed')) {
          msg = 'Debes confirmar tu email antes de ingresar';
        } else {
          msg = error.message;
        }
        showLoginAlert('error', msg);
      } else {
        await db.activity.log({
          user_id: data.user.id,
          user_name: data.user.email || email,
          activity_type: 'general',
          description: 'Inicio de sesión'
        });
        showLoginAlert('success', 'Sesión iniciada. Cargando...');
        setTimeout(() => window.location.reload(), 500);
      }
    } catch (err) {
      showLoginAlert('error', 'Error de conexión. Intenta nuevamente.');
    } finally {
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  });
}

function showAuthView(view, email = '') {
  const screens = {
    login: document.getElementById('form-login'),
    forgot: document.getElementById('form-forgot-password'),
    sent: document.getElementById('recovery-email-sent'),
    recovery: document.getElementById('form-password-recovery'),
  };
  Object.values(screens).forEach(screen => {
    if (!screen) return;
    screen.hidden = true;
    screen.classList.remove('active');
    screen.style.display = 'none';
  });

  const target = screens[view];
  if (!target) return;
  target.hidden = false;
  target.style.display = 'flex';
  if (target.tagName === 'FORM') target.classList.add('active');

  const copy = {
    login: ['Panel de Administración', 'Acceso exclusivo para administradores'],
    forgot: ['Recuperar contraseña', 'Ingresa el correo asociado a tu cuenta Solven Labs'],
    sent: ['Correo de recuperación enviado', 'Sigue el enlace del correo para continuar'],
    recovery: ['Crear nueva contraseña', 'Elige una contraseña segura para tu cuenta'],
  };
  const title = document.querySelector('.login__title');
  const subtitle = document.querySelector('.login__subtitle');
  if (title) title.textContent = copy[view][0];
  if (subtitle) subtitle.textContent = copy[view][1];
  hideLoginAlert();

  if (view === 'sent') {
    const emailLabel = document.getElementById('recovery-sent-email');
    const resendButton = document.getElementById('recovery-resend-btn');
    if (emailLabel) emailLabel.textContent = email;
    if (resendButton) resendButton.dataset.email = email;
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
  const focusTarget = target.querySelector('input, button');
  setTimeout(() => focusTarget?.focus(), 20);
}

async function sendPasswordRecoveryEmail(email, button) {
  if (button) {
    button.disabled = true;
    button.classList.add('loading');
  }
  try {
    const redirectUrl = new URL('/login', window.location.origin);
    redirectUrl.searchParams.set('recovery', '1');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl.toString(),
    });
    return error;
  } catch (error) {
    return error;
  } finally {
    if (button) {
      button.disabled = false;
      button.classList.remove('loading');
    }
  }
}

function showPasswordRecoveryForm() {
  const loginPage = document.getElementById('login-page');
  const dashboardContainer = document.getElementById('dashboard-container');
  const recoveryForm = document.getElementById('form-password-recovery');
  if (!loginPage || !recoveryForm) return;

  loginPage.style.display = 'flex';
  if (dashboardContainer) dashboardContainer.style.display = 'none';
  showAuthView('recovery');
  document.getElementById('recovery-password')?.focus();

  if (recoveryForm.dataset.bound) return;
  recoveryForm.dataset.bound = 'true';
  recoveryForm.addEventListener('submit', async event => {
    event.preventDefault();
    const password = document.getElementById('recovery-password')?.value || '';
    const confirmation = document.getElementById('recovery-password-confirm')?.value || '';
    if (password.length < 8) {
      showLoginAlert('error', 'La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (password !== confirmation) {
      showLoginAlert('error', 'Las contraseñas no coinciden');
      return;
    }
    const submitButton = recoveryForm.querySelector('.login__submit');
    submitButton.disabled = true;
    submitButton.classList.add('loading');
    let error = null;
    try {
      ({ error } = await supabase.auth.updateUser({ password }));
    } catch (requestError) {
      error = requestError;
    } finally {
      submitButton.disabled = false;
      submitButton.classList.remove('loading');
    }
    if (error) {
      showLoginAlert('error', 'No pudimos actualizar la contraseña. Solicita un nuevo enlace.');
      return;
    }
    showLoginAlert('success', 'Contraseña actualizada. Entrando al panel…');
    history.replaceState({}, '', '/dashboard');
    setTimeout(() => window.location.reload(), 800);
  });
}

function showLoginAlert(type, message) {
  const alert = document.getElementById('login-alert');
  alert.className = 'login__alert login__alert--' + type + ' show';
  document.getElementById('login-alert-text').textContent = message;
}

function hideLoginAlert() {
  document.getElementById('login-alert').classList.remove('show');
}

// ==========================================================================
// SIDEBAR
// ==========================================================================
function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');

  // Ensure sidebar is never collapsed
  sidebar.classList.remove('collapsed');
  localStorage.removeItem('ntek_sidebar_collapsed');

  // Create backdrop element for mobile
  let backdrop = document.getElementById('sidebar-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'sidebar-backdrop';
    backdrop.id = 'sidebar-backdrop';
    sidebar.parentNode.insertBefore(backdrop, sidebar.nextSibling);
  }

  const openSidebar = () => {
    sidebar.classList.add('mobile-open');
    backdrop.classList.add('show');
    document.body.style.overflow = 'hidden';
  };

  const closeSidebar = () => {
    sidebar.classList.remove('mobile-open');
    backdrop.classList.remove('show');
    document.body.style.overflow = '';
  };

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (sidebar.classList.contains('mobile-open')) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });
  }

  backdrop.addEventListener('click', closeSidebar);

  // Close sidebar when clicking a nav link on mobile
  document.querySelectorAll('.sidebar__link').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 1024) {
        closeSidebar();
      }
    });
  });

  // ---------- User menu dropdown ----------
  const userMenuBtn = document.querySelector('.sidebar__user-menu');
  const userDropdown = document.getElementById('sidebar-user-dropdown');
  if (userMenuBtn && userDropdown) {
    function openUserDropdown() {
      userDropdown.classList.add('show');
      userDropdown.style.display = 'flex';
      userMenuBtn.setAttribute('aria-expanded', 'true');
      userMenuBtn.setAttribute('aria-label', 'Cerrar menú de usuario');
      const icon = userMenuBtn.querySelector('i');
      if (icon) icon.setAttribute('data-lucide', 'chevron-down');
      if (typeof lucide !== 'undefined') setTimeout(() => lucide.createIcons(), 50);
    }

    function closeUserDropdown() {
      userDropdown.classList.remove('show');
      userDropdown.style.display = 'none';
      userMenuBtn.setAttribute('aria-expanded', 'false');
      userMenuBtn.setAttribute('aria-label', 'Abrir menú de usuario');
      const icon = userMenuBtn.querySelector('i');
      if (icon) icon.setAttribute('data-lucide', 'chevron-up');
      if (typeof lucide !== 'undefined') setTimeout(() => lucide.createIcons(), 50);
    }

    // El menú se abre exclusivamente al hacer clic en la flecha.
    userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.contains('show') ? closeUserDropdown() : openUserDropdown();
    });

    userDropdown.addEventListener('click', (e) => {
      e.stopPropagation();
      if (e.target.closest('a')) closeUserDropdown();
    });

    // close on outside click
    document.addEventListener('click', () => {
      if (userDropdown.classList.contains('show')) closeUserDropdown();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && userDropdown.classList.contains('show')) {
        closeUserDropdown();
        userMenuBtn.focus();
      }
    });

    // menu actions
    const profileView = document.getElementById('profile-view');
    const profileSettings = document.getElementById('profile-settings');
    const profileLogout = document.getElementById('profile-logout');

    if (profileView) profileView.addEventListener('click', async (ev) => {
      ev.preventDefault();
      await loadDashboardRoles();
      const p = currentProfile || {};
      const canEditOwnProfile = isAdministrativeRole(getCurrentRole());

      const content = `
        <form id="profile-form" style="display:flex;gap:12px;align-items:flex-start;flex-direction:column;">
          <div style="display:flex;gap:12px;align-items:center;">
            <div id="profile-avatar-wrap" style="width:72px;height:72px;border-radius:8px;overflow:hidden;flex-shrink:0;background:var(--dash-surface-2);display:flex;align-items:center;justify-content:center;">
              ${p.avatar_url ? `<img id="profile-avatar-preview" src="${escapeHtml(assetUrl(p.avatar_url))}" style="width:72px;height:72px;object-fit:cover;">` : `<div id="profile-avatar-preview" style="width:72px;height:72px;display:flex;align-items:center;justify-content:center;font-weight:700;">${escapeHtml((p.full_name || p.email || '').split(' ').map(s => s[0]).join('').substring(0, 2).toUpperCase())}</div>`}
            </div>
            <div style="flex:1;">
              <label style="display:block;font-weight:600;margin-bottom:6px;">Nombre completo</label>
              <input id="profile-full_name" type="text" value="${escapeHtml(p.full_name || '')}" style="width:100%;padding:8px;border-radius:6px;border:1px solid var(--dash-border);">
              <label style="display:block;font-weight:600;margin:10px 0 6px;">Correo</label>
              <input id="profile-email" type="email" value="${escapeHtml(p.email || '')}" readonly style="width:100%;padding:8px;border-radius:6px;border:1px solid var(--dash-border);background:var(--dash-surface-2);">
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;width:100%">
            <div>
              <label style="display:block;font-weight:600;margin-bottom:6px;">Empresa</label>
              <input id="profile-company" type="text" value="${escapeHtml(p.company || '')}" style="width:100%;padding:8px;border-radius:6px;border:1px solid var(--dash-border);">
            </div>
            <div>
              <label style="display:block;font-weight:600;margin-bottom:6px;">Teléfono</label>
              <input id="profile-phone" type="text" value="${escapeHtml(p.phone || '')}" style="width:100%;padding:8px;border-radius:6px;border:1px solid var(--dash-border);">
            </div>
            <div>
              <label style="display:block;font-weight:600;margin-bottom:6px;">Cargo</label>
              <input id="profile-position" type="text" value="${escapeHtml(p.position || '')}" style="width:100%;padding:8px;border-radius:6px;border:1px solid var(--dash-border);">
            </div>
            <div>
              <label style="display:block;font-weight:600;margin-bottom:6px;">Rol</label>
              <select id="profile-role" style="width:100%;padding:8px;border-radius:6px;border:1px solid var(--dash-border);">
                ${getRoleOptionsHtml(p.role)}
              </select>
            </div>
          </div>

          <div style="display:flex;gap:12px;align-items:center;width:100%;">
            <label style="font-weight:600;">Avatar</label>
            <input id="profile-avatar-file" type="file" accept="image/*">
            <span style="color:var(--dash-text-secondary);font-size:0.9rem;">(png/jpg)</span>
          </div>
        </form>
      `;

      // Open modal with a Save button
      openModal('Perfil', content, 'Guardar', async () => {
        if (!isAdministrativeRole(getCurrentRole())) {
          showToast('Solo administración puede modificar perfiles', 'warning');
          return;
        }
        const form = document.getElementById('profile-form');
        if (!form) return;
        const updates = {
          full_name: document.getElementById('profile-full_name')?.value || null,
          company: document.getElementById('profile-company')?.value || null,
          phone: document.getElementById('profile-phone')?.value || null,
          position: document.getElementById('profile-position')?.value || null,
          role: document.getElementById('profile-role')?.value || null
        };

        // Handle avatar upload if a file was chosen
        const fileInput = document.getElementById('profile-avatar-file');
        if (fileInput && fileInput.files && fileInput.files.length > 0) {
          const file = fileInput.files[0];
          try {
            const path = `profiles/${currentProfile.id}/${Date.now()}_${file.name}`;
            const { data: upData, error: upErr } = await db.storage.uploadFile('avatars', path, file);
            if (upErr) throw upErr;
            const publicUrl = db.storage.getPublicUrl('avatars', path);
            updates.avatar_url = publicUrl;
          } catch (err) {
            console.error('Error uploading avatar:', err);
            showToast && showToast('Error subiendo avatar', 'error');
            return;
          }
        }

        try {
          const { data, error } = await db.profiles.update(currentProfile.id, updates);
          if (error) {
            console.error('Error updating profile:', error);
            showToast && showToast('Error guardando perfil', 'error');
            return;
          }
          // Update currentProfile and sidebar UI
          currentProfile = data;
          const userNameEl = document.getElementById('user-name');
          const userRoleEl = document.getElementById('user-role');
          const userAvatarEl = document.getElementById('user-avatar');
          if (userNameEl) userNameEl.textContent = currentProfile.full_name || currentProfile.email;
          if (userRoleEl) userRoleEl.textContent = getRoleLabel(currentProfile.role);
          if (userAvatarEl) {
            if (currentProfile.avatar_url) {
              userAvatarEl.innerHTML = `<img src="${escapeHtml(assetUrl(currentProfile.avatar_url))}" alt="${escapeHtml(currentProfile.full_name || 'Usuario')}" style="width:40px;height:40px;border-radius:8px;object-fit:cover;border:2px solid var(--dash-accent);">`;
            } else {
              userAvatarEl.innerHTML = '<i data-lucide="user"></i>';
            }
            if (typeof lucide !== 'undefined') setTimeout(() => lucide.createIcons(), 50);
          }
          applyRoleRestrictions();
          showToast && showToast('Perfil guardado', 'success');
          closeModal();
        } catch (err) {
          console.error('Error saving profile:', err);
          showToast && showToast('Error guardando perfil', 'error');
        }
      }, !canEditOwnProfile);

      if (!canEditOwnProfile) {
        document.querySelectorAll('#profile-form input, #profile-form select, #profile-form textarea')
          .forEach(field => { field.disabled = true; });
      }

      // close dropdown
      closeUserDropdown();
    });

    if (profileSettings) profileSettings.addEventListener('click', (ev) => {
      ev.preventDefault();
      closeUserDropdown();
      navigateTo('settings');
    });

    if (profileLogout) profileLogout.addEventListener('click', async (ev) => {
      ev.preventDefault();
      closeUserDropdown();
      await signOut();
      window.location.href = '/login';
    });
  }
}

// ==========================================================================
// PAGE NAVIGATION
// ==========================================================================
function initNavigation() {
  const links = document.querySelectorAll('.sidebar__link[data-page]');

  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const pageId = link.dataset.page;
      navigateTo(pageId);
    });
  });
}

async function navigateTo(pageId, skipPush = false) {
  const links = document.querySelectorAll('.sidebar__link[data-page]');
  const pages = document.querySelectorAll('.dash-page');
  const breadcrumb = document.getElementById('page-breadcrumb');
  const breadcrumbGroup = document.getElementById('page-breadcrumb-group');
  const sidebar = document.getElementById('sidebar');

  const pageAliases = {
    clients: 'relations',
    providers: 'relations',
    facturas: 'invoices',
    cotizaciones: 'quotes'
  };
  pageId = pageAliases[pageId] || pageId;

  // Verificar permisos de rol
  if (!isPageAllowed(pageId)) {
    showToast('No tienes permiso para ver esta sección', 'warning');
    pageId = getDefaultAllowedPage();
  }

  links.forEach(l => l.classList.remove('active'));
  const activeLink = document.querySelector(`.sidebar__link[data-page="${pageId}"]`);
  if (activeLink) {
    activeLink.classList.add('active');
    // Auto-expand parent group if collapsed
    const parentGroup = activeLink.closest('.sidebar__group');
    if (parentGroup) parentGroup.classList.remove('sidebar__group--collapsed');
  }

  pages.forEach(p => p.classList.remove('active'));
  const activePage = document.getElementById(`page-${pageId}`);
  if (activePage) activePage.classList.add('active');

  const pageNames = {
    overview: 'Inicio', projects: 'Proyectos', tasks: 'Tareas', sii: 'Finanzas',
    relations: 'Relaciones', clients: 'Relaciones', providers: 'Relaciones', invoices: 'Facturas', receipts: 'Boletas',
    orders: 'Pedidos', calendar: 'Calendar',
    analytics: 'Analíticas', reports: 'Reportes', team: 'Equipo',
    settings: 'Configuración', practices: practiceIsAdmin() ? 'Bitácoras' : 'Bitácora',
    'practitioner-profile': practiceIsAdmin() ? 'Practicantes' : 'Perfil del practicante',
    quotes: 'Cotizaciones',
    maintenance: 'Facturación',
    orders: 'Tickets',
    'service-orders': 'Órdenes',
    bookings: 'Reservas',
    messages: 'Mensajes',
    payments: 'Pagos',
    taxes: 'F22 - F29',
    expenses: 'Gastos'
  };
  const pageDefinition = DASHBOARD_PAGES.find(page => page.id === pageId);
  if (breadcrumbGroup) breadcrumbGroup.textContent = pageDefinition?.group || 'Panel';
  if (breadcrumb) breadcrumb.textContent = pageNames[pageId] || pageDefinition?.label || pageId;

  syncPageHeaderEyebrows(pageId);
  updateDashboardPageMetadata(pageId);
  const pagePath = dashboardPagePath(pageId);
  if (skipPush) {
    if (window.location.pathname !== pagePath) {
      history.replaceState({ page: pageId }, '', pagePath);
    }
  } else if (window.location.pathname !== pagePath) {
    history.pushState({ page: pageId }, '', pagePath);
  }

  if (window.innerWidth <= 1024) {
    sidebar.classList.remove('mobile-open');
  }

  await loadPageData(pageId);

  if (typeof lucide !== 'undefined') {
    setTimeout(() => lucide.createIcons(), 50);
  }
}

// ==========================================================================
// PAGE DATA LOADER
// ==========================================================================
async function loadPageData(pageId) {
  try {
    switch (pageId) {
      case 'overview': await loadOverview(); break;
      case 'sii': await loadSiiUnified(); break;
      case 'relations': await loadRelations(); break;
      case 'clients': await loadRelations(); break;
      case 'providers': await loadRelations(); break;
      case 'projects': await loadProjects(); break;
      case 'invoices': await renderPresii(); break;
      case 'receipts': initDashboardReceipts(); break;
      case 'tasks': await loadTasks(); break;
      case 'orders': await loadOrders(); break;
      case 'service-orders': await loadServiceOrders(); break;
      case 'bookings': await loadBookings(); break;
      case 'calendar': await loadCalendar(); break;
      case 'messages': await loadSiteMessages(); initSiteMessagesPage(); break;
      case 'team': await loadTeam(); break;
      case 'practices': await loadPractices(); break;
      case 'practitioner-profile': await loadPractices(); break;
      case 'settings': await loadSettings(); break;
      case 'analytics': await loadAnalytics(); break;
      case 'reports': await loadReports(); break;
      case 'quotes': await renderCotizaciones(); break;
      case 'requirements': await mountRequirements(document.getElementById('requirements-app'), { supabase, escapeHtml, showToast, canWrite: isPageAllowed('requirements'), getPdfAssets: getIntakePdfAssets }); break;
      case 'payments': await renderPayments(); break;
      case 'taxes': await renderTaxForms(); break;
      case 'expenses': await loadExpenses(); break;
      case 'maintenance': await loadMaintenance(); break;
    }
  } catch (err) {
    console.error(`Error loading ${pageId}:`, err);
    showToast('Error al cargar datos', 'error');
  }
}

// ==========================================================================
// PRÁCTICAS
// ==========================================================================
const practicesState = { logs: [], profiles: [], people: [], initialized: false };

function practiceIsAdmin() {
  return isAdministrativeRole(getCurrentRole());
}

function practiceHours(startTime, endTime) {
  if (!startTime || !endTime) return 0;
  const [startH, startM] = startTime.slice(0, 5).split(':').map(Number);
  const [endH, endM] = endTime.slice(0, 5).split(':').map(Number);
  return Math.max(0, ((endH * 60 + endM) - (startH * 60 + startM)) / 60);
}

function formatPracticeHours(value) {
  return `${Number(value || 0).toLocaleString('es-CL', { maximumFractionDigits: 1 })} h`;
}

function formatPracticeDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`));
}

function practiceStatusBadge(status) {
  const labels = { ingresado: 'Ingresado', autorizado: 'Autorizado', validado: 'Validado', rechazado: 'Observado' };
  return `<span class="practice-status practice-status--${escapeHtml(status || 'ingresado')}">${labels[status] || 'Ingresado'}</span>`;
}

function initPracticesUi() {
  if (practicesState.initialized) return;
  practicesState.initialized = true;
  document.querySelectorAll('[data-practices-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.practicesTab;
      document.querySelectorAll('[data-practices-tab]').forEach(item => {
        const active = item === tab;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-selected', String(active));
      });
      document.querySelectorAll('.practices-panel').forEach(panel => {
        const active = panel.id === `practices-panel-${target}`;
        panel.classList.toggle('is-active', active);
        panel.hidden = !active;
      });
    });
  });

  dashboardReceiptApplyAccess();

  document.getElementById('btn-add-practice-log')?.addEventListener('click', () => window.openPracticeLogModal());
  document.getElementById('practices-search')?.addEventListener('input', renderPracticeLogs);
  document.getElementById('practices-user-filter')?.addEventListener('change', () => {
    renderPracticeLogs();
    renderPracticeStats();
  });
  document.getElementById('practices-status-filter')?.addEventListener('change', renderPracticeLogs);
}

async function loadPractices() {
  initPracticesUi();
  const isAdmin = practiceIsAdmin();
  document.getElementById('practices-admin-toolbar').hidden = !isAdmin;
  document.getElementById('practices-page-subtitle').textContent = isAdmin
    ? 'Gestión total de bitácoras, validaciones y perfiles históricos'
    : 'Tu bitácora y perfil de práctica';
  const profileSubtitle = document.getElementById('practitioner-profile-subtitle');
  if (profileSubtitle) profileSubtitle.textContent = isAdmin
    ? 'Historial y gestión de todos los practicantes'
    : 'Tus datos académicos, objetivos y progreso de práctica';

  const [logsResult, profilesResult, peopleResult] = await Promise.all([
    db.practices.getLogs({ userId: currentProfile?.id, includeAll: isAdmin }),
    db.practices.getProfiles({ userId: currentProfile?.id, includeAll: isAdmin }),
    isAdmin ? supabase.from('profiles').select('id,full_name,email,phone,position,avatar_url,role,created_at').eq('role', 'practicante').order('full_name') : Promise.resolve({ data: [currentProfile], error: null })
  ]);
  if (logsResult.error || profilesResult.error || peopleResult.error) {
    console.error('Error cargando prácticas:', logsResult.error || profilesResult.error || peopleResult.error);
    showToast('No se pudo cargar la sección de prácticas. Revisa que el esquema esté actualizado.', 'error');
  }
  practicesState.logs = logsResult.data || [];
  practicesState.profiles = profilesResult.data || [];
  const historicalPeople = practicesState.profiles.map(item => item.profile).filter(Boolean);
  practicesState.people = [...(peopleResult.data || []), ...historicalPeople].filter((person, index, all) => person?.id && all.findIndex(item => item?.id === person.id) === index);
  renderPracticeFilters();
  renderPracticeStats();
  renderPracticeLogs();
  renderPracticeProfiles();
  updatePracticesBadge();
}

function renderPracticeFilters() {
  const select = document.getElementById('practices-user-filter');
  if (!select || !practiceIsAdmin()) return;
  const selected = select.value;
  select.innerHTML = '<option value="all">Todos los practicantes</option>' + practicesState.people
    .map(person => `<option value="${escapeHtml(person.id)}">${escapeHtml(person.full_name || person.email)}</option>`).join('');
  if ([...select.options].some(option => option.value === selected)) select.value = selected;
}

function getFilteredPracticeLogs() {
  const search = (document.getElementById('practices-search')?.value || '').trim().toLowerCase();
  const personId = document.getElementById('practices-user-filter')?.value || 'all';
  const status = document.getElementById('practices-status-filter')?.value || 'all';
  return practicesState.logs.filter(log => {
    const haystack = [log.activity, log.learning, log.practitioner?.full_name, log.practitioner?.email].filter(Boolean).join(' ').toLowerCase();
    return (!search || haystack.includes(search)) && (personId === 'all' || log.profile_id === personId) && (status === 'all' || log.status === status);
  });
}

function renderPracticeStats() {
  const logs = practicesState.logs;
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60000;
  const monday = new Date(now);
  const weekday = (now.getDay() + 6) % 7;
  monday.setDate(now.getDate() - weekday);
  const mondayKey = new Date(monday.getTime() - timezoneOffset).toISOString().slice(0, 10);
  const totalHours = logs.reduce((sum, log) => sum + Number(log.hours || practiceHours(log.start_time, log.end_time)), 0);
  const weekHours = logs.filter(log => log.log_date >= mondayKey).reduce((sum, log) => sum + Number(log.hours || practiceHours(log.start_time, log.end_time)), 0);
  const pending = logs.filter(log => log.status === 'ingresado').length;
  const selectedPractitionerId = document.getElementById('practices-user-filter')?.value || 'all';
  const selectedTotalHours = logs
    .filter(log => log.profile_id === selectedPractitionerId)
    .reduce((sum, log) => sum + Number(log.hours || practiceHours(log.start_time, log.end_time)), 0);
  const goal = Number(practicesState.profiles.find(item => item.profile_id === currentProfile?.id)?.weekly_hours_goal || 20);
  const items = practiceIsAdmin()
    ? [['clock-3', 'Horas registradas', selectedPractitionerId !== 'all' ? formatPracticeHours(selectedTotalHours) : '—', selectedPractitionerId === 'all' ? 'Selecciona un practicante' : ''], ['hourglass', 'Por autorizar', pending], ['users', 'Practicantes históricos', practicesState.people.length]]
    : [['clock-3', 'Horas totales', formatPracticeHours(totalHours)], ['target', `Meta semanal (${goal} h)`, `${Math.min(100, Math.round((weekHours / Math.max(goal, 1)) * 100))}%`], ['badge-check', 'Entradas validadas', logs.filter(log => ['autorizado', 'validado'].includes(log.status)).length]];
  const container = document.getElementById('practices-stats');
  if (container) container.innerHTML = items.map(item => `<div class="practice-stat"><i data-lucide="${item[0]}"></i><div><span>${item[1]}</span><strong>${item[2]}</strong>${item[3] ? `<small>${item[3]}</small>` : ''}</div></div>`).join('');
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function renderPracticeLogs() {
  const body = document.getElementById('practices-log-body');
  if (!body) return;
  const isAdmin = practiceIsAdmin();
  const logs = getFilteredPracticeLogs();
  if (!logs.length) {
    body.innerHTML = '<tr><td colspan="7" class="practices-empty">No hay entradas para mostrar.</td></tr>';
    return;
  }
  body.innerHTML = logs.map(log => {
    const hours = Number(log.hours || practiceHours(log.start_time, log.end_time));
    const safeEvidenceUrl = /^https?:\/\//i.test(log.evidence_url || '') ? log.evidence_url : '';
    const evidence = safeEvidenceUrl ? `<a class="practice-evidence" href="${escapeHtml(safeEvidenceUrl)}" target="_blank" rel="noopener"><i data-lucide="external-link"></i> Evidencia</a>` : '';
    const actions = isAdmin
      ? `<div class="practice-actions"><button type="button" title="Autorizar" onclick="window.setPracticeLogStatus('${log.id}','autorizado')"><i data-lucide="check"></i></button><button type="button" title="Validar" onclick="window.setPracticeLogStatus('${log.id}','validado')"><i data-lucide="badge-check"></i></button><button type="button" title="Editar" onclick="window.openPracticeLogModal('${log.id}')"><i data-lucide="pencil"></i></button><button type="button" class="is-danger" title="Archivar" onclick="window.archivePracticeLog('${log.id}')"><i data-lucide="archive"></i></button></div>`
      : (log.status === 'ingresado' ? `<div class="practice-actions"><button type="button" title="Editar" onclick="window.openPracticeLogModal('${log.id}')"><i data-lucide="pencil"></i></button></div>` : '<span class="practice-locked"><i data-lucide="lock"></i> Cerrada</span>');
    return `<tr><td>${formatPracticeDate(log.log_date)}</td><td><strong>${escapeHtml(log.practitioner?.full_name || currentProfile?.full_name || '—')}</strong></td><td><div class="practice-activity"><strong>${escapeHtml(log.activity)}</strong>${log.learning ? `<small>${escapeHtml(log.learning)}</small>` : ''}${evidence}</div></td><td>${escapeHtml((log.start_time || '').slice(0, 5))} – ${escapeHtml((log.end_time || '').slice(0, 5))}</td><td><strong>${formatPracticeHours(hours)}</strong></td><td>${practiceStatusBadge(log.status)}</td><td>${actions}</td></tr>`;
  }).join('');
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function renderPracticeProfiles() {
  const container = document.getElementById('practices-profile-content');
  if (!container) return;
  const isAdmin = practiceIsAdmin();
  const people = isAdmin ? practicesState.people : [currentProfile].filter(Boolean);
  if (!people.length) {
    container.innerHTML = '<div class="dash-card"><div class="dash-card__body practices-empty">No hay perfiles de practicantes registrados.</div></div>';
    return;
  }
  container.innerHTML = `<div class="practice-profile-grid">${people.map(person => {
    const internship = practicesState.profiles.find(item => item.profile_id === person.id) || {};
    const initials = (person.full_name || person.email || 'P').split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
    const logs = practicesState.logs.filter(log => log.profile_id === person.id);
    const total = logs.reduce((sum, log) => sum + Number(log.hours || practiceHours(log.start_time, log.end_time)), 0);
    const totalGoal = Number(internship.total_hours_goal || 0);
    const progress = totalGoal > 0 ? Math.min(100, Math.round((total / totalGoal) * 100)) : 0;
    const hoursBalance = totalGoal > 0 ? Math.max(0, totalGoal - total) : 0;
    return `<article class="dash-card practice-profile-card"><div class="dash-card__body"><div class="practice-profile-card__head">${person.avatar_url ? `<img src="${escapeHtml(assetUrl(person.avatar_url))}" alt="">` : `<span>${escapeHtml(initials)}</span>`}<div><h3>${escapeHtml(person.full_name || 'Practicante')}</h3><p>${escapeHtml(person.email || '')}</p></div>${isAdmin ? `<button type="button" class="btn-dash btn-dash--secondary" onclick="window.openPracticeProfileModal('${person.id}')"><i data-lucide="settings-2"></i> Gestionar</button>` : ''}</div><div class="practice-hours-summary"><div class="practice-hours-summary__head"><div><span>Progreso de horas</span><strong>${formatPracticeHours(total).replace(' h', '')} <small>/ ${totalGoal > 0 ? formatPracticeHours(totalGoal) : 'Por configurar'}</small></strong></div>${totalGoal > 0 ? `<b>${progress}%</b>` : ''}</div><div class="practice-hours-summary__track" role="progressbar" aria-label="Progreso de horas de práctica" aria-valuemin="0" ${totalGoal > 0 ? `aria-valuenow="${progress}" aria-valuemax="100"` : ''}><span style="width:${progress}%"></span></div><p>${totalGoal > 0 ? `${formatPracticeHours(hoursBalance)} pendientes para completar la práctica` : 'Define las horas totales desde Gestionar para calcular el avance.'}</p></div><dl class="practice-profile-details"><div><dt>Institución</dt><dd>${escapeHtml(internship.institution || 'Sin informar')}</dd></div><div><dt>Carrera</dt><dd>${escapeHtml(internship.program || 'Sin informar')}</dd></div><div><dt>Supervisor</dt><dd>${escapeHtml(internship.supervisor_name || 'Sin asignar')}</dd></div><div><dt>Periodo</dt><dd>${formatPracticeDate(internship.start_date)} – ${formatPracticeDate(internship.end_date)}</dd></div><div><dt>Meta semanal</dt><dd>${formatPracticeHours(internship.weekly_hours_goal || 20)}</dd></div><div><dt>Horas exigidas</dt><dd>${totalGoal > 0 ? formatPracticeHours(totalGoal) : 'Por configurar'}</dd></div></dl>${internship.objectives ? `<div class="practice-objectives"><strong>Objetivos</strong><p>${escapeHtml(internship.objectives)}</p></div>` : ''}</div></article>`;
  }).join('')}</div>`;
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function updatePracticesBadge() {
  const badge = document.getElementById('badge-practices');
  if (!badge) return;
  const count = practiceIsAdmin() ? practicesState.logs.filter(log => log.status === 'ingresado').length : practicesState.logs.filter(log => log.status === 'ingresado').length;
  badge.textContent = String(count);
  badge.style.display = count ? '' : 'none';
}

window.openPracticeLogModal = function (logId = null) {
  const existing = practicesState.logs.find(log => log.id === logId);
  if (existing && !practiceIsAdmin() && existing.status !== 'ingresado') return showToast('Una entrada autorizada ya no puede editarse', 'warning');
  const isAdmin = practiceIsAdmin();
  const today = new Date().toISOString().slice(0, 10);
  const peopleOptions = practicesState.people.map(person => `<option value="${escapeHtml(person.id)}" ${existing?.profile_id === person.id ? 'selected' : ''}>${escapeHtml(person.full_name || person.email)}</option>`).join('');
  openModal(existing ? 'Editar entrada de bitácora' : 'Nueva entrada de bitácora', `<form id="practice-log-form" class="practice-modal-form">${isAdmin ? `<label>Practicante<select class="modal-form__input" id="practice-log-user" required><option value="">Seleccionar</option>${peopleOptions}</select></label>` : ''}<div class="practice-form-row"><label>Fecha<input class="modal-form__input" type="date" id="practice-log-date" value="${escapeHtml(existing?.log_date || today)}" max="${today}" required></label><label>Inicio<input class="modal-form__input" type="time" id="practice-log-start" value="${escapeHtml((existing?.start_time || '09:00').slice(0, 5))}" required></label><label>Término<input class="modal-form__input" type="time" id="practice-log-end" value="${escapeHtml((existing?.end_time || '18:00').slice(0, 5))}" required></label></div><label>Actividad realizada<textarea class="modal-form__textarea" id="practice-log-activity" rows="3" maxlength="1000" required>${escapeHtml(existing?.activity || '')}</textarea></label><label>Aprendizaje o resultado <span>(opcional)</span><textarea class="modal-form__textarea" id="practice-log-learning" rows="2" maxlength="1000">${escapeHtml(existing?.learning || '')}</textarea></label><label>Enlace de evidencia <span>(opcional)</span><input class="modal-form__input" type="url" id="practice-log-evidence" placeholder="https://..." value="${escapeHtml(existing?.evidence_url || '')}"></label>${isAdmin && existing ? `<label>Observación del supervisor<textarea class="modal-form__textarea" id="practice-log-review" rows="2">${escapeHtml(existing?.review_note || '')}</textarea></label>` : ''}</form>`, existing ? 'Guardar cambios' : 'Registrar entrada', async () => {
    const form = document.getElementById('practice-log-form');
    if (!form?.reportValidity()) return;
    const start = document.getElementById('practice-log-start').value;
    const end = document.getElementById('practice-log-end').value;
    const hours = practiceHours(start, end);
    if (hours <= 0 || hours > 16) return showToast('Revisa el horario: debe registrar entre 0 y 16 horas', 'warning');
    const evidenceUrl = document.getElementById('practice-log-evidence').value.trim();
    if (evidenceUrl && !/^https?:\/\//i.test(evidenceUrl)) return showToast('El enlace de evidencia debe comenzar con http:// o https://', 'warning');
    const payload = { profile_id: isAdmin ? document.getElementById('practice-log-user').value : currentProfile.id, log_date: document.getElementById('practice-log-date').value, start_time: start, end_time: end, hours, activity: document.getElementById('practice-log-activity').value.trim(), learning: document.getElementById('practice-log-learning').value.trim() || null, evidence_url: evidenceUrl || null };
    if (isAdmin && existing) payload.review_note = document.getElementById('practice-log-review').value.trim() || null;
    if (!payload.profile_id) return showToast('Selecciona un practicante', 'warning');
    const result = existing ? await db.practices.updateLog(existing.id, payload) : await db.practices.createLog(payload);
    if (result.error) return showToast(`No se pudo guardar: ${result.error.message}`, 'error');
    await auditLog(`${existing ? 'Actualizó' : 'Creó'} una entrada de bitácora de práctica`, 'general', result.data?.id || existing?.id, payload.activity);
    closeModal(); showToast('Entrada guardada correctamente', 'success'); await loadPractices();
  });
};

window.setPracticeLogStatus = async function (id, status) {
  if (!practiceIsAdmin() || !['autorizado', 'validado', 'rechazado'].includes(status)) return;
  const updates = { status, reviewed_by: currentProfile.id, reviewed_at: new Date().toISOString() };
  const noteField = document.getElementById('practice-log-review');
  if (noteField) updates.review_note = noteField.value.trim() || null;
  const { error } = await db.practices.updateLog(id, updates);
  if (error) return showToast(`No se pudo actualizar: ${error.message}`, 'error');
  await auditLog(`Marcó una bitácora de práctica como ${status}`, 'general', id, 'Bitácora de práctica');
  showToast(`Entrada ${status === 'validado' ? 'validada' : 'autorizada'}`, 'success');
  await loadPractices();
};

window.archivePracticeLog = async function (id) {
  if (!practiceIsAdmin() || !window.confirm('¿Archivar esta entrada? Podrá recuperarse directamente desde la base de datos.')) return;
  const { error } = await db.practices.updateLog(id, { deleted_at: new Date().toISOString(), deleted_by: currentProfile.id });
  if (error) return showToast(`No se pudo archivar: ${error.message}`, 'error');
  await auditLog('Archivó una entrada de bitácora de práctica', 'general', id, 'Bitácora de práctica');
  showToast('Entrada archivada', 'success'); await loadPractices();
};

window.openPracticeProfileModal = function (profileId) {
  if (!practiceIsAdmin()) {
    showToast('Solo administración puede modificar perfiles de práctica', 'warning');
    return;
  }
  const person = practicesState.people.find(item => item.id === profileId);
  if (!person) return;
  const existing = practicesState.profiles.find(item => item.profile_id === profileId) || {};
  openModal('Perfil de práctica', `<form id="practice-profile-form" class="practice-modal-form"><label>Institución<input class="modal-form__input" id="practice-profile-institution" value="${escapeHtml(existing.institution || '')}" required></label><label>Carrera o programa<input class="modal-form__input" id="practice-profile-program" value="${escapeHtml(existing.program || '')}" required></label><div class="practice-form-row practice-form-row--profile"><label>Inicio<input class="modal-form__input" type="date" id="practice-profile-start" value="${escapeHtml(existing.start_date || '')}"></label><label>Término<input class="modal-form__input" type="date" id="practice-profile-end" value="${escapeHtml(existing.end_date || '')}"></label><label>Meta semanal (horas)<input class="modal-form__input" type="number" min="1" max="60" step="0.5" id="practice-profile-goal" value="${escapeHtml(existing.weekly_hours_goal || 20)}"></label><label>Horas totales a cumplir<input class="modal-form__input" type="number" min="1" max="5000" step="0.5" id="practice-profile-total-goal" value="${escapeHtml(existing.total_hours_goal || '')}" placeholder="Ej. 360"></label></div><label>Supervisor<input class="modal-form__input" id="practice-profile-supervisor" value="${escapeHtml(existing.supervisor_name || '')}" ${practiceIsAdmin() ? '' : 'readonly'}></label><label>Objetivos de la práctica<textarea class="modal-form__textarea" id="practice-profile-objectives" rows="3">${escapeHtml(existing.objectives || '')}</textarea></label></form>`, 'Guardar perfil', async () => {
    const form = document.getElementById('practice-profile-form'); if (!form?.reportValidity()) return;
    const totalHoursGoal = document.getElementById('practice-profile-total-goal').value;
    const payload = { profile_id: profileId, institution: document.getElementById('practice-profile-institution').value.trim(), program: document.getElementById('practice-profile-program').value.trim(), start_date: document.getElementById('practice-profile-start').value || null, end_date: document.getElementById('practice-profile-end').value || null, weekly_hours_goal: Number(document.getElementById('practice-profile-goal').value || 20), total_hours_goal: totalHoursGoal ? Number(totalHoursGoal) : null, supervisor_name: document.getElementById('practice-profile-supervisor').value.trim() || null, objectives: document.getElementById('practice-profile-objectives').value.trim() || null, updated_by: currentProfile.id };
    const { error } = await db.practices.upsertProfile(payload);
    if (error) return showToast(`No se pudo guardar: ${error.message}`, 'error');
    await auditLog('Actualizó un perfil de práctica', 'general', profileId, person.full_name || person.email);
    closeModal(); showToast('Perfil de práctica actualizado', 'success'); await loadPractices();
  });
};

// ==========================================================================
// OVERVIEW
// ==========================================================================
async function renderRevenueChart(period = 'Últimos 6 meses') {
  const container = document.getElementById('revenue-bars');
  const legend = document.getElementById('revenue-chart-legend');
  if (!container) return;

  const segmentMeta = {
    sale: { label: 'Factura venta', color: '#2563eb', direction: 'income' },
    honorariosSale: { label: 'Boleta honorarios · Venta', color: '#7c3aed', direction: 'income' },
    income: { label: 'Ingreso externo', color: '#165aa3', direction: 'income' },
    purchase: { label: 'Factura compra', color: '#d97706', direction: 'expense' },
    honorariosPurchase: { label: 'Boleta honorarios · Compra', color: '#7c3aed', direction: 'expense' },
    expense: { label: 'Gasto', color: '#dc2626', direction: 'expense' }
  };

  const now = new Date();
  const periodOptions = {
    'Últimos 6 meses': 5,
    'Este año': 11,
    'Último año': 23
  };
  const monthsCount = periodOptions[period] ?? 5;

  const [incomeRes, presiiDocs, payments, expensesRes] = await Promise.all([
    supabase.from('fin_ingresos').select('monto,fecha,estado'),
    getPresiiDocs(),
    getPagos(),
    supabase.from('expenses').select('amount,status,date_incurred,created_at')
  ]);

  const monthLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const monthMap = {};
  for (let i = monthsCount; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap[key] = {
      label: `${monthLabels[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
      ing: 0,
      gas: 0,
      segments: Object.fromEntries(Object.keys(segmentMeta).map(segment => [segment, 0]))
    };
  }

  const financeRows = [];

  (incomeRes.data || []).forEach(income => {
    financeRows.push({
      source: 'income',
      kind: 'income',
      segment: 'income',
      date: getSiiRowDate(income.fecha),
      amount: Number(income.monto || 0),
      status: normalizeSiiPaidStatus(income.estado || 'registrado')
    });
  });

  (presiiDocs || []).forEach(doc => {
    const operation = (doc.operacion || ((doc.tipo_dte || '').toString() === '110' ? 'compra' : 'venta')).toString().toLowerCase();
    if (!['venta', 'compra'].includes(operation)) return;
    const { total } = calcTotalsFromItems(doc.items || [], doc.exento || false);
    financeRows.push({
      source: 'presii',
      kind: operation === 'compra' ? 'purchase' : 'sale',
      operation,
      segment: operation === 'compra' ? 'purchase' : 'sale',
      date: getSiiRowDate(doc.fecha || doc.created_at),
      amount: total,
      status: normalizeSiiPaidStatus(doc.estado || 'borrador')
    });
  });

  (expensesRes.data || []).forEach(expense => {
    financeRows.push({
      source: 'expenses',
      kind: 'expense',
      segment: 'expense',
      date: getSiiRowDate(expense.date_incurred || expense.created_at),
      amount: Number(expense.amount || 0),
      status: normalizeSiiPaidStatus(expense.status || 'pendiente')
    });
  });

  (payments || []).forEach(payment => {
    if (String(payment.tipo || '').toLowerCase() !== 'honorarios' || payment.skip_analytics) return;
    const operation = getPagoOperation(payment);
    financeRows.push({
      source: 'honorarios',
      kind: 'honorarios',
      operation,
      segment: operation === 'venta' ? 'honorariosSale' : 'honorariosPurchase',
      date: getSiiRowDate(payment.fecha || payment.created_at),
      amount: Number(payment.neto || payment.bruto || payment.amount || 0),
      status: normalizeSiiPaidStatus(payment.status || (payment.skip_analytics ? 'pendiente' : 'registrado'))
    });
  });

  financeRows.forEach(row => {
    if (!row.date) return;
    const key = row.date.slice(0, 7);
    if (!monthMap[key]) return;
    if (!isSiiPaidStatus(row.status)) return;
    const totals = calculateFinanceKpis([row]);
    monthMap[key].ing += totals.ingresos;
    monthMap[key].gas += totals.egresos;
    if (row.segment && monthMap[key].segments[row.segment] != null) {
      monthMap[key].segments[row.segment] += Number(row.amount) || 0;
    }
  });

  const keys = Object.keys(monthMap);
  const maxVal = Math.max(...keys.map(k => Math.max(monthMap[k].ing, monthMap[k].gas)), 1);

  const renderStack = (month, direction, total, height) => {
    const segments = Object.entries(segmentMeta)
      .filter(([key, meta]) => meta.direction === direction && month.segments[key] > 0)
      .map(([key, meta]) => {
        const amount = month.segments[key];
        const share = total > 0 ? (amount / total) * 100 : 0;
        return `<span class="chart-bar-stack__segment" style="height:${share}%;background:${meta.color};" data-tooltip="${escapeHtml(meta.label)} · ${escapeHtml(formatCurrency(amount))}&#10;Total: ${escapeHtml(formatCurrency(total))}" aria-label="${escapeHtml(meta.label)}: ${escapeHtml(formatCurrency(amount))}. Total: ${escapeHtml(formatCurrency(total))}"></span>`;
      }).join('');
    return `<div class="chart-bar-stack chart-bar-stack--${direction}" style="height:${height}%;${total ? '' : 'background:#e5e7eb;'}" title="${direction === 'income' ? 'Ingresos' : 'Egresos'}: ${escapeHtml(formatCurrency(total))}">${segments}</div>`;
  };

  container.innerHTML = keys.map(k => {
    const m = monthMap[k];
    const pctI = m.ing > 0 ? Math.max(Math.round(m.ing / maxVal * 100), 2) : 2;
    const pctG = m.gas > 0 ? Math.max(Math.round(m.gas / maxVal * 100), 2) : 2;
    return `
      <div class="chart-bar-group" data-label="${m.label}">
        <div class="chart-bar-double">
          ${renderStack(m, 'income', m.ing, pctI)}
          ${renderStack(m, 'expense', m.gas, pctG)}
        </div>
      </div>`;
  }).join('');

  if (legend) {
    const usedSegments = new Set(keys.flatMap(key => Object.entries(monthMap[key].segments).filter(([, amount]) => amount > 0).map(([segment]) => segment)));
    const categoryLegend = Object.entries(segmentMeta)
      .filter(([key]) => usedSegments.has(key))
      .map(([, meta]) => `<span class="revenue-chart-legend__item"><span class="revenue-chart-legend__swatch" style="background:${meta.color}"></span>${escapeHtml(meta.label)}</span>`)
      .join('');
    legend.innerHTML = `<span class="revenue-chart-legend__item"><strong>Izquierda:</strong> ingresos</span><span class="revenue-chart-legend__item"><strong>Derecha:</strong> egresos</span>${categoryLegend}`;
  }
}

async function loadOverview() {
  // Fetch real-time data from tables
  const [projectsRes, clientsRes, tasksRes, financeIncomeRes, financePayments] = await Promise.all([
    supabase.from('projects').select('id, status'),
    supabase.from('clients').select('id, status'),
    supabase.from('tasks').select('id, completed'),
    supabase.from('fin_ingresos').select('monto,fecha,estado'),
    getPagos()
  ]);

  // Calculate KPIs from actual data
  const projects = projectsRes.data || [];
  const clients = clientsRes.data || [];
  const tasks = tasksRes.data || [];

  const activeProjects = projects.filter(p => p.status === 'in_development').length;
  const activeClients = clients.filter(c => c.status === 'active').length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;

  // Annual income from Finanzas only. Do not mix in quotes, Pre-SII docs or accounting drafts.
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const nextYearStart = new Date(now.getFullYear() + 1, 0, 1);
  const annualExternalIncome = (financeIncomeRes.data || [])
    .filter(item => {
      const status = normalizeSiiPaidStatus(item.estado || '');
      const incomeDate = parseDate(item.fecha);
      return incomeDate && !Number.isNaN(incomeDate.getTime()) && incomeDate >= yearStart && incomeDate < nextYearStart && status === 'pagado';
    })
    .reduce((sum, item) => sum + (Number(item.monto) || 0), 0);
  const annualHonorariosSales = (financePayments || [])
    .filter(payment => {
      if (String(payment.tipo || '').toLowerCase() !== 'honorarios') return false;
      if (getPagoOperation(payment) !== 'venta' || payment.skip_analytics) return false;
      const paymentDate = parseDate(payment.fecha);
      if (!paymentDate || Number.isNaN(paymentDate.getTime()) || paymentDate < yearStart || paymentDate >= nextYearStart) return false;
      return isSiiPaidStatus(payment.status);
    })
    .reduce((sum, payment) => sum + Math.max(0, Number(payment.neto ?? payment.bruto ?? payment.amount ?? 0) || 0), 0);
  const annualBilling = annualExternalIncome + annualHonorariosSales;

  // Update KPI values
  const vals = document.querySelectorAll('#page-overview .kpi-card .kpi-card__value');
  if (vals[0]) vals[0].textContent = activeProjects;
  if (vals[1]) vals[1].textContent = formatCurrency(annualBilling);
  if (vals[2]) vals[2].textContent = activeClients;
  if (vals[3]) vals[3].textContent = `${completedTasks}/${totalTasks}`;

  // KPI trend text
  const pctTasks = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0;
  const changeProjects = document.getElementById('kpi-change-projects');
  const changeBilling = document.getElementById('kpi-change-billing');
  const changeClients = document.getElementById('kpi-change-clients');
  const changeTasks = document.getElementById('kpi-change-tasks');
  if (changeProjects) { changeProjects.className = 'kpi-card__change'; changeProjects.textContent = `${activeProjects} activos`; }
  if (changeBilling) {
    changeBilling.className = 'kpi-card__change';
    changeBilling.textContent = annualHonorariosSales > 0
      ? `Total ${now.getFullYear()} · incluye ${formatCurrencyShort(annualHonorariosSales)} en boletas de venta`
      : `Total ${now.getFullYear()}`;
  }
  if (changeClients) { changeClients.className = 'kpi-card__change'; changeClients.textContent = `${activeClients} activos`; }
  if (changeTasks) { changeTasks.className = 'kpi-card__change'; changeTasks.textContent = `${pctTasks}% completado`; }

  // Activity list
  const { data: activities } = await db.activity.getRecent(5);
  const actList = document.getElementById('activity-list');
  if (actList) {
    if (activities && activities.length > 0) {
      actList.innerHTML = activities.map(a => `
        <div class="activity-item">
          <div class="activity-item__icon activity-item__icon--${a.activity_type}">
            <i data-lucide="${getActivityIcon(a.activity_type)}" style="width:16px;height:16px;"></i>
          </div>
          <div class="activity-item__content">
            <p><strong>${escapeHtml(a.user_name || 'Sistema')}</strong> ${escapeHtml(a.description)}${a.entity_name ? ` <em>${escapeHtml(a.entity_name)}</em>` : ''}</p>
            <span class="activity-item__time">${timeAgo(a.created_at)}</span>
          </div>
        </div>
      `).join('');
    } else {
      actList.innerHTML = '<p style="color:var(--dash-text-secondary);padding:1rem;">Sin actividad reciente</p>';
    }
    if (typeof lucide !== "undefined") setTimeout(() => lucide.createIcons(), 50);
  }

  // Bind view all activity button (one-time)
  const viewAllActivityBtn = document.getElementById('btn-view-all-activity');
  if (viewAllActivityBtn && !viewAllActivityBtn.dataset.bound) {
    viewAllActivityBtn.dataset.bound = 'true';
    viewAllActivityBtn.addEventListener('click', openActivityLogModal);
  }

  // Revenue chart — ingresos vs egresos según periodo
  const revenueSelector = document.getElementById('revenue-period');
  const selectedPeriod = revenueSelector?.value || 'Últimos 6 meses';
  await renderRevenueChart(selectedPeriod);

  if (revenueSelector && !revenueSelector.dataset.boundRevenueChart) {
    revenueSelector.dataset.boundRevenueChart = 'true';
    revenueSelector.addEventListener('change', () => renderRevenueChart(revenueSelector.value));
  }

  // Donut chart — project status distribution
  const { data: projectsByStatus } = await supabase.from('projects').select('status');
  const donutContainer = document.getElementById('donut-chart-container');
  if (donutContainer && projectsByStatus) {
    const statusMap = { in_development: { label: 'En desarrollo', color: '#2e547d' }, completed: { label: 'Completados', color: '#668fbb' }, review: { label: 'En revisión', color: '#E65100' }, proposal: { label: 'Propuesta', color: '#424242' }, paused: { label: 'Pausado', color: '#888' } };
    const counts = {};
    projectsByStatus.forEach(p => { counts[p.status] = (counts[p.status] || 0) + 1; });
    const total = projectsByStatus.length;
    const totalEl = donutContainer.querySelector('.donut-chart__total');
    if (totalEl) totalEl.textContent = total;

    if (total > 0) {
      const svg = donutContainer.querySelector('.donut-svg');
      // Clear existing segments
      svg.innerHTML = `<circle cx="18" cy="18" r="15.91549430918954" fill="none" stroke="#e0e0e0" stroke-width="3"></circle>`;
      let offset = 25;
      Object.entries(counts).forEach(([status, count]) => {
        const pct = (count / total) * 100;
        const info = statusMap[status] || { label: status, color: '#888' };
        svg.innerHTML += `<circle cx="18" cy="18" r="15.91549430918954" fill="none" stroke="${info.color}" stroke-width="3" stroke-dasharray="${pct} ${100 - pct}" stroke-dashoffset="${offset}" class="donut-segment"></circle>`;
        offset -= pct;
      });

      const legend = document.getElementById('donut-legend');
      if (legend) {
        legend.innerHTML = Object.entries(counts).map(([status, count]) => {
          const info = statusMap[status] || { label: status, color: '#888' };
          return `<div class="donut-legend-item"><span class="donut-legend-color" style="background:${info.color};"></span><span>${info.label}</span><strong>${count}</strong></div>`;
        }).join('');
      }
    }
  }

  // Upcoming deadlines — presii docs with fecha_vencimiento + upcoming events
  const upcomingList = document.getElementById('upcoming-list');
  if (upcomingList) {
    const deadlines = [];
    const UPMONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const todayStr = new Date().toISOString().split('T')[0];
    const upcomingPresii = (await getPresiiDocs())
      .filter(d => d.fecha_vencimiento && d.fecha_vencimiento >= todayStr && isSiiIssuedStatus(d.estado))
      .sort((a, b) => a.fecha_vencimiento.localeCompare(b.fecha_vencimiento))
      .slice(0, 4);
    upcomingPresii.forEach(doc => {
      const dDate = parseDate(doc.fecha_vencimiento);
      const { total } = calcTotalsFromItems(doc.items || [], doc.exento || false);
      const isUrgent = (new Date(doc.fecha_vencimiento) - new Date()) < 3 * 86400000;
      const operacion = (doc.operacion || ((doc.tipo_dte || '').toString() === '110' ? 'compra' : 'venta')).toLowerCase();
      const displayName = operacion === 'compra' ? (doc.emi_name || '') : (doc.razon_social || '');
      deadlines.push(`
        <div class="upcoming-item ${isUrgent ? 'upcoming-item--urgent' : ''}">
          <div class="upcoming-item__date"><span class="upcoming-item__day">${String(dDate.getDate()).padStart(2, '0')}</span><span class="upcoming-item__month">${UPMONTHS[dDate.getMonth()]}</span></div>
          <div class="upcoming-item__content"><p class="upcoming-item__title">${escapeHtml(doc.folio || '')} — ${escapeHtml(displayName)}</p><span class="upcoming-item__amount">${formatCurrencyShort(total)}</span></div>
          <span class="upcoming-item__status upcoming-item__status--${isUrgent ? 'urgent' : 'pending'}">${isUrgent ? 'Urgente' : 'Pendiente'}</span>
        </div>
      `);
    });
    const { data: upcomingEvents } = await supabase.from('events').select('*').gte('event_date', new Date().toISOString().split('T')[0]).order('event_date', { ascending: true }).limit(3);
    if (upcomingEvents) {
      upcomingEvents.forEach(ev => {
        const d = parseDate(ev.event_date);
        deadlines.push(`
          <div class="upcoming-item">
            <div class="upcoming-item__date"><span class="upcoming-item__day">${String(d.getDate()).padStart(2, '0')}</span><span class="upcoming-item__month">${UPMONTHS[d.getMonth()]}</span></div>
            <div class="upcoming-item__content"><p class="upcoming-item__title">${escapeHtml(ev.title)}</p><span class="upcoming-item__amount">${ev.start_time ? ev.start_time.slice(0, 5) : ''} ${ev.end_time ? '- ' + ev.end_time.slice(0, 5) : ''}</span></div>
            <span class="upcoming-item__status upcoming-item__status--scheduled">Agendada</span>
          </div>
        `);
      });
    }
    upcomingList.innerHTML = deadlines.length > 0 ? deadlines.join('') : '<p style="color:var(--dash-text-secondary);padding:1rem;">Sin vencimientos próximos</p>';
  }

  const exportBtn = document.getElementById('btn-export-report');
  if (exportBtn && !exportBtn.dataset.bound) {
    exportBtn.dataset.bound = 'true';
    exportBtn.addEventListener('click', async () => {
      exportBtn.disabled = true;
      exportBtn.textContent = 'Generando...';
      try {
        const [projectsRes, clientsRes, tasksRes] = await Promise.all([
          supabase.from('projects').select('id,name,status,progress,client_name,estimated_end_date'),
          supabase.from('clients').select('id,name,company,status'),
          supabase.from('tasks').select('id,title,completed,due_date,priority,projects(name)')
        ]);
        const allDocs = [...(await getPresiiDocs()), ...(await getCotizaciones())];
        await openReportWindow('financial', { projects: projectsRes.data || [], clients: clientsRes.data || [], tasks: tasksRes.data || [], team: [], orders: [], allDocs, now: new Date() });
      } finally {
        exportBtn.disabled = false;
        exportBtn.textContent = 'Exportar Reporte';
      }
    });
  }
}

// ==========================================================================
// CLIENTS
// ==========================================================================
const relationRelationshipLabels = {
  owner: 'Dueño',
  manager: 'Gerente',
  legal_rep: 'Representante Legal',
  collaborator: 'Colaborador de la Empresa',
  other: 'Otro'
};

let relationRows = [];

function normalizeRelationKey(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function isRelationNameMatch(firstName, secondName) {
  const firstKey = normalizeRelationKey(firstName);
  const secondKey = normalizeRelationKey(secondName);
  if (firstKey && firstKey === secondKey) return true;
  const firstWords = firstKey.split(' ').filter(Boolean);
  const secondWords = secondKey.split(' ').filter(Boolean);
  if (firstWords.length < 2 || secondWords.length < 2) return false;
  const shorter = firstWords.length <= secondWords.length ? firstWords : secondWords;
  const longer = new Set(firstWords.length <= secondWords.length ? secondWords : firstWords);
  return shorter.every(word => longer.has(word));
}

function getRelationMappedAmount(byRut, byName, rut, names = []) {
  const rutKey = normalizeRut(rut || '');
  if (rutKey && Object.prototype.hasOwnProperty.call(byRut, rutKey)) return byRut[rutKey];
  for (const name of names) {
    const nameKey = normalizeRelationKey(name);
    if (nameKey && Object.prototype.hasOwnProperty.call(byName, nameKey)) return byName[nameKey];

    // Las fichas internas suelen usar un nombre abreviado mientras Finanzas
    // conserva el nombre legal completo. Solo aceptamos una coincidencia
    // parcial cuando todas las palabras coinciden y el resultado es único.
    const nameWords = nameKey.split(' ').filter(Boolean);
    if (nameWords.length < 2) continue;
    const partialMatches = Object.entries(byName).filter(([candidateKey]) => isRelationNameMatch(nameKey, candidateKey));
    if (partialMatches.length === 1) return partialMatches[0][1];
  }
  return null;
}


function getRelationTypeLabel(type) {
  if (type === 'provider') return 'Proveedor';
  if (type === 'employee') return 'Empleado';
  return 'Cliente';
}

function getRelationRelationshipLabel(value) {
  if (!value) return '-';
  return relationRelationshipLabels[value] || value;
}

function getEmployeeAvailabilityLabel(value) {
  return ({
    available: 'Disponible',
    busy: 'Ocupado',
    away: 'Ausente',
    offline: 'Offline'
  }[value] || (value ? String(value) : ''));
}

function getRelationFilters() {
  return {
    search: document.getElementById('relations-search')?.value.trim().toLowerCase() || '',
    type: document.getElementById('relations-type-filter')?.value || 'all',
    status: document.getElementById('relations-status-filter')?.value || 'all',
    sort: document.getElementById('relations-sort-filter')?.value || 'name'
  };
}

function getFilteredRelationRows(items = relationRows) {
  const filters = getRelationFilters();
  return (items || []).filter(item => {
    if (item.entity_type === 'employee') return false;
    if (filters.type !== 'all' && item.entity_type !== filters.type) return false;
    if (filters.status !== 'all' && String(item.status || '') !== filters.status) return false;
    if (!filters.search) return true;
    return item.searchText.includes(filters.search);
  }).sort((a, b) => {
    switch (filters.sort) {
      case 'company':
        return (a.sortCompany || '').localeCompare(b.sortCompany || '', 'es', { sensitivity: 'base' });
      case 'type':
        return getRelationTypeLabel(a.entity_type).localeCompare(getRelationTypeLabel(b.entity_type), 'es', { sensitivity: 'base' }) || (a.sortName || '').localeCompare(b.sortName || '', 'es', { sensitivity: 'base' });
      case 'amount':
        return (Number(b.total_billed || 0) - Number(a.total_billed || 0)) || (a.sortName || '').localeCompare(b.sortName || '', 'es', { sensitivity: 'base' });
      case 'name':
      default:
        return (a.sortName || '').localeCompare(b.sortName || '', 'es', { sensitivity: 'base' });
    }
  });
}

function initRelationsToolbar() {
  const searchInput = document.getElementById('relations-search');
  if (searchInput && !searchInput.dataset.bound) {
    searchInput.dataset.bound = 'true';
    let debounceTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(() => renderRelationsRows(), 180);
    });
  }

  ['relations-type-filter', 'relations-status-filter', 'relations-sort-filter'].forEach(filterId => {
    const filterEl = document.getElementById(filterId);
    if (filterEl && !filterEl.dataset.bound) {
      filterEl.dataset.bound = 'true';
      filterEl.addEventListener('change', () => renderRelationsRows());
    }
  });

  const exportBtn = document.getElementById('btn-export-relations');
  if (exportBtn && !exportBtn.dataset.bound) {
    exportBtn.dataset.bound = 'true';
    exportBtn.addEventListener('click', exportRelationsCsv);
  }

  initAddClientModal();
  initAddEmployeeButton();
}

function renderRelationsRows(items = relationRows) {
  const tbody = document.getElementById('relations-tbody');
  if (!tbody) return;

  const rows = getFilteredRelationRows(items);
  if (rows.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center;color:var(--dash-text-secondary);padding:2rem;">
          No hay relaciones que coincidan con los filtros.
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = rows.map(item => {
    const initials = (item.name || item.company || '').split(' ').map(part => part[0]).join('').substring(0, 2).toUpperCase();
    const typeIcon = item.entity_type === 'provider' ? 'user-x' : item.entity_type === 'employee' ? 'users' : 'user-check';
    const detailPrimary = item.detailPrimary || '-';
    const detailSecondary = item.detailSecondary || '';
    const contactPrimary = item.contactPrimary || '-';
    const contactSecondary = item.contactSecondary || '';
    const viewAction = item.entity_type === 'employee'
      ? `viewTeamMember(${JSON.stringify(item.id)})`
      : `viewClient(${JSON.stringify(item.id)}, ${JSON.stringify(item.entity_type)})`;
    const editAction = item.entity_type === 'employee'
      ? `editTeamMember(${JSON.stringify(item.id)})`
      : `editClient(${JSON.stringify(item.id)}, ${JSON.stringify(item.entity_type)})`;
    const deleteAction = item.entity_type === 'employee'
      ? `deleteTeamMember(${JSON.stringify(item.id)}, ${JSON.stringify(item.name || '')})`
      : `deleteClient(${JSON.stringify(item.id)}, ${JSON.stringify(item.name || '')}, ${JSON.stringify(item.entity_type)})`;
    const manageActionId = item.entity_type === 'provider' ? 'btn-add-provider' : item.entity_type === 'employee' ? 'btn-add-employee' : 'btn-add-client';
    const canManageRelation = item.entity_type === 'employee'
      ? isAdministrativeRole(getCurrentRole())
      : isButtonAllowed(manageActionId);

    return `
      <tr data-id="${item.id}" data-type="${item.entity_type}">
        <td><span class="relation-type-badge relation-type-badge--${item.entity_type}">${getRelationTypeLabel(item.entity_type)}</span></td>
        <td><div class="table-user"><div class="table-user__avatar">${item.avatar_url ? `<img src="${assetUrl(item.avatar_url)}" alt="">` : `<i data-lucide="${typeIcon}" style="width:18px;height:18px;"></i>`}</div><span>${escapeHtml(item.name || initials || '-')}</span></div></td>
        <td>${escapeHtml(item.company || '-')}</td>
        <td><div class="relation-contact"><span>${escapeHtml(contactPrimary)}</span>${contactSecondary ? `<span class="relation-contact__muted">${escapeHtml(contactSecondary)}</span>` : ''}</div></td>
        <td><div class="relation-detail"><span class="relation-detail__primary">${escapeHtml(detailPrimary)}</span>${detailSecondary ? `<span class="relation-detail__secondary">${escapeHtml(detailSecondary)}</span>` : ''}</div></td>
        <td><span class="status-badge status-badge--${item.status}">${statusLabel(item.status)}</span></td>
        <td><div class="table-actions">
          <button class="table-action-btn" title="Ver" onclick='${viewAction}'><i data-lucide="eye" style="width:15px;height:15px;"></i></button>
          ${canManageRelation ? `<button class="table-action-btn" title="Editar" onclick='${editAction}'><i data-lucide="pencil" style="width:15px;height:15px;"></i></button>
          <button class="table-action-btn table-action-btn--danger" title="Eliminar" onclick='${deleteAction}'><i data-lucide="trash-2" style="width:15px;height:15px;"></i></button>` : ''}
        </div></td>
      </tr>
    `;
  }).join('');

  if (typeof lucide !== 'undefined') setTimeout(() => lucide.createIcons(), 50);
}

async function loadRelations() {
  const titleEl = document.querySelector('#page-relations .dash-page__title');
  const subtitleEl = document.querySelector('#page-relations .dash-page__subtitle');
  if (titleEl) titleEl.textContent = 'Relaciones';
  if (subtitleEl) subtitleEl.textContent = 'Gestiona clientes y proveedores en una sola vista';

  const [clientsRes, providersRes, employeesRes, profilesRes, presiiAllRes, projRes, quotesRes, paymentsRes, expensesRes, incomesRes] = await Promise.all([
    db.clients.getAll(),
    db.providers.getAll(),
    db.team.getAll(),
    db.profiles.getAll(),
    supabase.from('facturas_presii').select('rut_receptor,emi_rut,razon_social,emi_name,items,exento,operacion,tipo_dte,fecha,created_at'),
    supabase.from('projects').select('client_id'),
    supabase.from('cotizaciones').select('*'),
    supabase.from('pagos').select('*'),
    supabase.from('expenses').select('*'),
    supabase.from('fin_ingresos').select('*')
  ]);

  if (clientsRes.error || providersRes.error) {
    showToast('Error al cargar relaciones', 'error');
    return;
  }

  const allPresii = presiiAllRes.data || [];
  const projects = projRes.data || [];
  const clients = clientsRes.data || [];
  const providers = providersRes.data || [];
  const employees = employeesRes.data || [];
  const profiles = profilesRes.data || [];
  const profilesById = new Map(profiles.filter(profile => profile.id).map(profile => [profile.id, profile]));
  const profilesByEmail = new Map(profiles
    .filter(profile => profile.email)
    .map(profile => [String(profile.email).trim().toLowerCase(), profile]));
  const getEmployeeProfile = employee => (
    profilesById.get(employee.profile_id) ||
    profilesByEmail.get(String(employee.email || '').trim().toLowerCase()) ||
    null
  );
  const visibleEmployees = employees.filter(employee => {
    const linkedProfile = getEmployeeProfile(employee);
    return !isAdministrativeRole(linkedProfile?.role);
  });

  const accountedByRut = {};
  const accountedByName = {};
  const quotedByRut = {};
  const quotedByName = {};
  const actualRevenueRecords = [];

  const addRelationAmount = (byRut, byName, amount, rut = '', names = []) => {
    const numericAmount = Number(amount || 0);
    if (!numericAmount) return;
    const rutKey = normalizeRut(rut || '');
    if (rutKey) byRut[rutKey] = (byRut[rutKey] || 0) + numericAmount;
    [...new Set(names.map(normalizeRelationKey).filter(Boolean))].forEach(nameKey => {
      byName[nameKey] = (byName[nameKey] || 0) + numericAmount;
    });
  };

  allPresii.forEach(doc => {
    const operacion = (doc.operacion || ((doc.tipo_dte || '').toString() === '110' ? 'compra' : 'venta')).toString().toLowerCase();
    const { total } = calcTotalsFromItems(doc.items || [], doc.exento || false);
    const relevantRut = operacion === 'compra' ? (doc.emi_rut || doc.rut_receptor) : (doc.rut_receptor || doc.emi_rut);
    const relevantName = operacion === 'compra' ? (doc.emi_name || doc.razon_social) : (doc.razon_social || doc.emi_name);
    addRelationAmount(accountedByRut, accountedByName, operacion === 'compra' ? -total : total, relevantRut, [relevantName]);
    if (operacion === 'venta') {
      actualRevenueRecords.push({
        amount: total,
        rut: relevantRut || '',
        names: [relevantName],
        date: getSiiRowDate(doc.fecha || doc.created_at)
      });
    }
  });

  (paymentsRes.data || []).forEach(payment => {
    if (payment.skip_analytics) return;
    const amount = Number(payment.neto || payment.bruto || payment.amount || 0);
    const operation = getPagoOperation(payment);
    addRelationAmount(accountedByRut, accountedByName, operation === 'venta' ? amount : -amount, payment.rut, [payment.nombre]);
    if (operation === 'venta') {
      actualRevenueRecords.push({ amount, rut: payment.rut || '', names: [payment.nombre], date: getSiiRowDate(payment.fecha || payment.created_at) });
    }
  });

  (expensesRes.data || []).forEach(expense => {
    addRelationAmount(accountedByRut, accountedByName, -Number(expense.amount || 0), '', [expense.vendor]);
  });

  (incomesRes.data || []).forEach(income => {
    const amount = Number(income.monto || 0);
    const names = [income.cliente, income.origen];
    addRelationAmount(accountedByRut, accountedByName, amount, '', names);
    actualRevenueRecords.push({ amount, rut: '', names, date: getSiiRowDate(income.fecha || income.created_at) });
  });

  const matchedRevenueRecords = new Set();
  (quotesRes.data || []).forEach(quote => {
    const status = String(quote.estado || '').trim().toLowerCase();
    // Una cotización aceptada ya genera su ingreso en Finanzas. No se suma
    // nuevamente aquí para evitar duplicar el monto en "Facturado".
    if ([
      'aceptada', 'aceptado', 'accepted',
      'anulada', 'anulado',
      'cancelada', 'cancelado',
      'rechazada', 'rechazado',
      'facturada', 'facturado',
      'convertida', 'convertido',
      'emitida', 'emitido'
    ].includes(status)) return;
    const { total } = calcTotalsFromItems(quote.items || [], quote.exento || false);
    const quoteRut = normalizeRut(quote.rut_receptor || '');
    const quoteNames = [quote.cliente, quote.razon_social].filter(Boolean);
    const quoteDate = getSiiRowDate(quote.fecha || quote.created_at);
    const convertedRecordIndex = actualRevenueRecords.findIndex((record, index) => {
      if (matchedRevenueRecords.has(index)) return false;
      const recordRut = normalizeRut(record.rut || '');
      const sameParty = quoteRut && recordRut
        ? quoteRut === recordRut
        : quoteNames.some(quoteName => (record.names || []).some(recordName => isRelationNameMatch(quoteName, recordName)));
      if (!sameParty) return false;
      const tolerance = Math.max(1, Math.round(Math.abs(total) * 0.001));
      if (Math.abs(Number(record.amount || 0) - total) > tolerance) return false;
      return !quoteDate || !record.date || record.date >= quoteDate;
    });
    if (convertedRecordIndex >= 0) {
      matchedRevenueRecords.add(convertedRecordIndex);
      return;
    }
    addRelationAmount(quotedByRut, quotedByName, total, quote.rut_receptor, [quote.cliente, quote.razon_social]);
  });

  const projMap = {};
  projects.forEach(project => {
    if (!project.client_id) return;
    projMap[project.client_id] = (projMap[project.client_id] || 0) + 1;
  });

  relationRows = [
    ...clients.map(client => {
      const clientRut = normalizeRut(client.rut || '');
      const accountedAmount = getRelationMappedAmount(accountedByRut, accountedByName, clientRut, [client.name, client.company]);
      const quotedAmount = getRelationMappedAmount(quotedByRut, quotedByName, clientRut, [client.name, client.company]) || 0;
      return {
        ...client,
        entity_type: 'client',
        project_count: projMap[client.id] || 0,
        total_billed: (accountedAmount != null ? accountedAmount : Number(client.total_billed || 0)) + quotedAmount,
        quoted_amount: quotedAmount,
        has_quote: quotedAmount > 0,
        detailPrimary: getRelationRelationshipLabel(client.relationship),
        detailSecondary: [client.region, client.city].filter(Boolean).join(' / ') || client.address || '',
        contactPrimary: client.email || '-',
        contactSecondary: [client.phone, client.rut].filter(Boolean).join(' · ') || '',
        sortName: (client.name || '').toLowerCase(),
        sortCompany: (client.company || '').toLowerCase(),
        searchText: [client.name, client.company, client.email, client.phone, client.rut, client.address, client.region, client.city, getRelationRelationshipLabel(client.relationship)].filter(Boolean).join(' ').toLowerCase()
      };
    }),
    ...providers.map(provider => {
      const providerRut = normalizeRut(provider.rut || '');
      const accountedAmount = getRelationMappedAmount(accountedByRut, accountedByName, providerRut, [provider.name, provider.company]);
      const quotedAmount = getRelationMappedAmount(quotedByRut, quotedByName, providerRut, [provider.name, provider.company]) || 0;
      const accountDetails = [provider.bank, formatAccountType(provider.account_type)].filter(Boolean).join(' · ');
      return {
        ...provider,
        entity_type: 'provider',
        project_count: 0,
        total_billed: (accountedAmount != null ? accountedAmount : -Math.abs(Number(provider.total_billed || 0))) + quotedAmount,
        quoted_amount: quotedAmount,
        has_quote: quotedAmount > 0,
        detailPrimary: accountDetails || 'Sin datos bancarios',
        detailSecondary: provider.account_number || provider.payment_account || '',
        contactPrimary: provider.email || '-',
        contactSecondary: [provider.phone, provider.rut].filter(Boolean).join(' · ') || '',
        sortName: (provider.name || '').toLowerCase(),
        sortCompany: (provider.company || '').toLowerCase(),
        searchText: [provider.name, provider.company, provider.email, provider.phone, provider.rut, provider.bank, provider.account_type, provider.account_number, provider.payment_account].filter(Boolean).join(' ').toLowerCase()
      };
    }),
    ...visibleEmployees.map(employee => {
      const employeeProfile = getEmployeeProfile(employee);
      const employeeRut = employee.rut || employee.tax_id || employeeProfile?.rut || employeeProfile?.tax_id || '';
      const employeeName = employee.full_name || employee.name || '';
      const employeeNames = [employeeName, employeeProfile?.full_name, employeeProfile?.name];
      const accountedAmount = getRelationMappedAmount(accountedByRut, accountedByName, employeeRut, employeeNames);
      const quotedAmount = getRelationMappedAmount(quotedByRut, quotedByName, employeeRut, employeeNames) || 0;
      return {
        ...employee,
        name: employeeName,
        entity_type: 'employee',
        project_count: 0,
        total_billed: Number(accountedAmount || 0) + quotedAmount,
        quoted_amount: quotedAmount,
        has_quote: quotedAmount > 0,
        company: employee.role_title || employee.position || 'Equipo interno',
        detailPrimary: employee.role_title || employee.position || 'Empleado',
        detailSecondary: [getEmployeeAvailabilityLabel(employee.availability), employee.weekly_hours ? `${employee.weekly_hours} h/sem` : ''].filter(Boolean).join(' · '),
        contactPrimary: employee.email || employee.phone || '-',
        contactSecondary: employee.email && employee.phone ? employee.phone : '',
        status: employee.status || 'active',
        sortName: (employee.full_name || '').toLowerCase(),
        sortCompany: (employee.role_title || employee.position || '').toLowerCase(),
        searchText: [employee.full_name, employee.email, employee.phone, employee.role_title, employee.position, employee.availability].filter(Boolean).join(' ').toLowerCase()
      };
    })
  ];

  initRelationsToolbar();
  renderRelationsRows();
}


let siiUnifiedRows = [];


function getSiiTypeLabel(kind) {
  return ({
    sale: 'Venta',
    purchase: 'Compra',
    honorarios: 'Boleta',
    expense: 'Gasto',
    income: 'Ingreso'
  }[kind] || kind || '-');
}

function getSiiTypeTone(kind) {
  return ({
    sale: 'sale',
    purchase: 'purchase',
    honorarios: 'honorarios',
    expense: 'expense',
    income: 'income'
  }[kind] || 'draft');
}

function getSiiStatusMeta(status, source, row = {}) {
  const raw = String(status || '').trim().toLowerCase();
  const isNoContabilizar = source === 'honorarios' && row.skipAnalytics;

  if (isNoContabilizar) {
    return { label: 'No contabilizar', badge: 'inactive' };
  }

  if (source === 'presii' && isSiiInvoiceOverdue({
    estado: raw,
    fecha_vencimiento: row.dueDate || row.fecha_vencimiento
  })) {
    return { label: 'Vencida', badge: 'overdue' };
  }

  const map = {
    draft: { label: 'Borrador', badge: 'draft' },
    borrador: { label: 'Borrador', badge: 'draft' },
    issued: { label: 'Emitida', badge: 'pending' },
    emitido: { label: 'Emitida', badge: 'pending' },
    emitida: { label: 'Emitida', badge: 'pending' },
    submitted: { label: 'Enviado', badge: 'review' },
    enviado: { label: 'Enviado', badge: 'review' },
    pending: { label: 'Pendiente', badge: 'pending' },
    pendiente: { label: 'Pendiente', badge: 'pending' },
    approved: { label: 'Aprobado', badge: 'active' },
    aprobado: { label: 'Aprobado', badge: 'active' },
    paid: { label: 'Pagado', badge: 'paid' },
    pagado: { label: 'Pagado', badge: 'paid' },
    pagada: { label: 'Pagado', badge: 'paid' },
    registered: { label: 'Registrado', badge: 'registered' },
    registrado: { label: 'Registrado', badge: 'registered' },
    cobrado: { label: 'Cobrado', badge: 'paid' },
    rejected: { label: 'Rechazado', badge: 'overdue' },
    rechazado: { label: 'Rechazado', badge: 'overdue' },
    anulado: { label: 'Anulado', badge: 'inactive' },
    cancelled: { label: 'Anulado', badge: 'inactive' },
    review: { label: 'En revisión', badge: 'review' },
    activo: { label: 'Activo', badge: 'active' },
    active: { label: 'Activo', badge: 'active' }
  };

  if (map[raw]) return map[raw];
  if (source === 'income') return { label: 'Registrado', badge: 'active' };
  if (source === 'honorarios') return { label: 'Registrado', badge: 'active' };
  if (source === 'expenses') return { label: 'Pendiente', badge: 'pending' };
  return { label: 'Registrado', badge: 'active' };
}

function normalizeSiiPaidStatus(status) {
  const raw = String(status || '').trim().toLowerCase();
  if (['paid', 'pagado', 'pagada'].includes(raw)) return 'pagado';
  return raw;
}

function normalizeSiiPagoOperation(operation) {
  return String(operation || '').trim().toLowerCase() === 'venta' ? 'venta' : 'compra';
}

const PAGO_OPERATION_MARKER = /\s*\[\[op=(compra|venta)\]\]\s*$/i;

function getPagoOperationFromDescription(description) {
  const match = String(description || '').match(PAGO_OPERATION_MARKER);
  return match ? normalizeSiiPagoOperation(match[1]) : '';
}

function stripPagoOperationFromDescription(description) {
  return String(description || '').replace(PAGO_OPERATION_MARKER, '').trim();
}

function getPagoOperation(doc) {
  // El marcador conserva la operación correcta en registros creados antes de
  // que la columna `operacion` existiera y recibiera "compra" por defecto.
  return normalizeSiiPagoOperation(getPagoOperationFromDescription(doc?.descripcion) || doc?.operacion || 'compra');
}

function getPagoDescription(doc) {
  return stripPagoOperationFromDescription(doc?.descripcion || '');
}

function buildPagoDescription(description, operacion) {
  const cleanDescription = stripPagoOperationFromDescription(description || '');
  const normalizedOperation = normalizeSiiPagoOperation(operacion || 'compra');
  return cleanDescription ? `${cleanDescription} [[op=${normalizedOperation}]]` : `[[op=${normalizedOperation}]]`;
}

function isSiiPaidStatus(status) {
  return normalizeSiiPaidStatus(status) === 'pagado';
}

function isSiiIssuedStatus(status) {
  return ['emitida', 'emitido', 'issued'].includes(String(status || '').trim().toLowerCase());
}

function isSiiInvoiceOverdue(doc) {
  if (!isSiiIssuedStatus(doc?.estado) || !doc?.fecha_vencimiento) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(`${String(doc.fecha_vencimiento).slice(0, 10)}T00:00:00`);
  return !Number.isNaN(dueDate.valueOf()) && dueDate < today;
}

function isCountableSiiInvoice(doc) {
  const operation = (doc?.operacion || ((doc?.tipo_dte || '').toString() === '110' ? 'compra' : 'venta')).toString().toLowerCase();
  return ['compra', 'venta'].includes(operation) && isSiiPaidStatus(doc?.estado);
}

function getSiiFiscalMeta(row) {
  if (row.kind === 'income') {
    return { label: '', value: 'No aplica', tone: 'empty' };
  }

  if (row.kind === 'expense') {
    if (row.isExempt) return { label: 'IVA', value: 'Exento', tone: 'empty' };
    return { label: 'IVA', value: formatCurrency(row.fiscalAmount || 0), tone: 'tax' };
  }

  if (row.kind === 'honorarios') {
    if (row.fiscalAmount == null) return { label: 'Retención', value: '$0', tone: 'empty' };
    return { label: 'Retención', value: formatCurrency(row.fiscalAmount), tone: 'retention' };
  }

  if (row.isExempt) {
    return { label: 'IVA', value: 'Exento', tone: 'empty' };
  }

  return { label: 'IVA', value: formatCurrency(row.fiscalAmount || 0), tone: 'tax' };
}

function getSiiRowDate(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? String(value).slice(0, 10) : date.toISOString().slice(0, 10);
}

function getSiiFilters() {
  const currentMonth = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  })();
  return {
    search: document.getElementById('sii-search')?.value.trim().toLowerCase() || '',
    source: document.getElementById('sii-filter-source')?.value || 'all',
    type: document.getElementById('sii-filter-type')?.value || 'all',
    status: document.getElementById('sii-filter-status')?.value || 'all',
    month: document.getElementById('sii-filter-mes')?.value || currentMonth
  };
}

function getFilteredSiiRows(items = siiUnifiedRows) {
  const filters = getSiiFilters();
  return (items || []).filter(item => {
    if (filters.source !== 'all' && item.source !== filters.source) return false;
    if (filters.type !== 'all' && item.kind !== filters.type) return false;
    if (filters.status !== 'all' && normalizeSiiPaidStatus(item.status) !== normalizeSiiPaidStatus(filters.status)) return false;
    if (filters.month && item.date && !item.date.startsWith(filters.month)) return false;
    if (!filters.search) return true;
    return item.searchText.includes(filters.search);
  }).sort((a, b) => (b.sortDate || '').localeCompare(a.sortDate || ''));
}

function isFinanceIncomeRow(row) {
  return ['sale', 'income'].includes(row?.kind)
    || (row?.source === 'honorarios' && row?.operation === 'venta');
}

function isFinanceExpenseRow(row) {
  return ['purchase', 'expense'].includes(row?.kind)
    || (row?.source === 'honorarios' && row?.operation !== 'venta');
}

function calculateFinanceKpis(items = []) {
  const countedRows = (items || []).filter(row => isSiiPaidStatus(row.status));
  const ingresos = countedRows.reduce(
    (sum, row) => sum + (isFinanceIncomeRow(row) ? (Number(row.amount) || 0) : 0),
    0
  );
  const egresos = countedRows.reduce(
    (sum, row) => sum + (isFinanceExpenseRow(row) ? (Number(row.amount) || 0) : 0),
    0
  );
  const retenciones = countedRows.reduce(
    (sum, row) => sum + (row.source === 'honorarios' ? (Number(row.fiscalAmount) || 0) : 0),
    0
  );
  const retencionesEgreso = countedRows.reduce(
    (sum, row) => sum + (row.source === 'honorarios' && row.operation !== 'venta' ? (Number(row.fiscalAmount) || 0) : 0),
    0
  );
  const ivaDebito = countedRows.reduce(
    (sum, row) => sum + (row.source === 'presii' && row.kind === 'sale' ? (Number(row.fiscalAmount) || 0) : 0),
    0
  );
  const ivaCredito = countedRows.reduce(
    (sum, row) => sum + (row.source === 'presii' && row.kind === 'purchase' ? (Number(row.fiscalAmount) || 0) : 0),
    0
  );

  return {
    ingresos,
    egresos,
    retenciones,
    neto: ingresos - egresos - retencionesEgreso,
    ivaBalance: ivaCredito - ivaDebito
  };
}

function updateSiiKpis(items = siiUnifiedRows) {
  const rows = getFilteredSiiRows(items);
  const { ingresos, egresos, retenciones, neto, ivaBalance } = calculateFinanceKpis(rows);

  const retencionesEl = document.getElementById('sii-kpi-retenciones');
  const ingresosEl = document.getElementById('sii-kpi-ingresos');
  const egresosEl = document.getElementById('sii-kpi-egresos');
  const ivaEl = document.getElementById('sii-kpi-iva');
  const netoEl = document.getElementById('sii-kpi-neto');
  if (retencionesEl) retencionesEl.textContent = formatCurrency(retenciones);
  if (ingresosEl) ingresosEl.textContent = formatCurrency(ingresos);
  if (egresosEl) egresosEl.textContent = formatCurrency(egresos);
  if (ivaEl) {
    ivaEl.textContent = ivaBalance > 0
      ? `A favor ${formatCurrency(ivaBalance)}`
      : ivaBalance < 0
        ? `A pagar ${formatCurrency(Math.abs(ivaBalance))}`
        : '$0';
    ivaEl.style.color = ivaBalance > 0
      ? 'var(--dash-success)'
      : ivaBalance < 0
        ? 'var(--dash-danger)'
        : 'var(--dash-text)';
  }
  if (netoEl) netoEl.textContent = formatCurrency(neto);
}

function renderSiiRows(items = siiUnifiedRows) {
  const tbody = document.getElementById('sii-tbody');
  if (!tbody) return;

  const rows = getFilteredSiiRows(items);
  updateSiiKpis(items);
  if (!rows.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center;color:var(--dash-text-secondary);padding:2rem;">
          No hay documentos SII que coincidan con los filtros.
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = rows.map(item => {
    const canManage = item.source === 'presii'
      ? isButtonAllowed('btn-nueva-presii')
      : item.source === 'honorarios'
        ? isButtonAllowed('btn-add-payment') || isButtonAllowed('btn-sii-honorarios')
        : item.source === 'expenses'
          ? isButtonAllowed('btn-add-expense') || isButtonAllowed('btn-sii-gasto')
          : isButtonAllowed('btn-sii-ingreso');
    const fiscalMeta = getSiiFiscalMeta(item);
    const statusMeta = getSiiStatusMeta(item.status, item.source, item);
    const rowActions = (() => {
      if (item.source === 'presii') {
        return `${canManage ? `<button class="table-action-btn" title="Ver detalle" onclick='viewPresiiFinance(${JSON.stringify(item.id)})'><i data-lucide="eye" style="width:15px;height:15px;"></i></button><button class="table-action-btn" title="Editar" onclick='openPresiiModal(${JSON.stringify(item.id)})'><i data-lucide="pencil" style="width:15px;height:15px;"></i></button><button class="table-action-btn table-action-btn--danger" title="Eliminar" onclick='deletePresii(${JSON.stringify(item.id)})'><i data-lucide="trash-2" style="width:15px;height:15px;"></i></button>` : `<button class="table-action-btn" title="Ver detalle" onclick='viewPresiiFinance(${JSON.stringify(item.id)})'><i data-lucide="eye" style="width:15px;height:15px;"></i></button>`}`;
      }
      if (item.source === 'honorarios') {
        return `${canManage ? `<button class="table-action-btn" title="Ver detalle" onclick='viewPayment(${JSON.stringify(item.id)})'><i data-lucide="eye" style="width:15px;height:15px;"></i></button><button class="table-action-btn" title="Editar" onclick='openPaymentModal(${JSON.stringify(item.id)}, "honorarios")'><i data-lucide="pencil" style="width:15px;height:15px;"></i></button><button class="table-action-btn table-action-btn--danger" title="Eliminar" onclick='deletePago(${JSON.stringify(item.id)})'><i data-lucide="trash-2" style="width:15px;height:15px;"></i></button>` : `<button class="table-action-btn" title="Ver detalle" onclick='viewPayment(${JSON.stringify(item.id)})'><i data-lucide="eye" style="width:15px;height:15px;"></i></button>`}`;
      }
      if (item.source === 'expenses') {
        return `${canManage ? `<button class="table-action-btn" title="Ver detalle" onclick='viewExpense(${JSON.stringify(item.id)})'><i data-lucide="eye" style="width:15px;height:15px;"></i></button><button class="table-action-btn" title="Editar" onclick='editExpense(${JSON.stringify(item.id)})'><i data-lucide="pencil" style="width:15px;height:15px;"></i></button><button class="table-action-btn table-action-btn--danger" title="Eliminar" onclick='deleteExpenseConfirm(${JSON.stringify(item.id)})'><i data-lucide="trash-2" style="width:15px;height:15px;"></i></button>` : `<button class="table-action-btn" title="Ver detalle" onclick='viewExpense(${JSON.stringify(item.id)})'><i data-lucide="eye" style="width:15px;height:15px;"></i></button>`}`;
      }
      return `${canManage ? `<button class="table-action-btn" title="Ver detalle" onclick='viewSiiIncome(${JSON.stringify(item.id)})'><i data-lucide="eye" style="width:15px;height:15px;"></i></button><button class="table-action-btn" title="Editar" onclick='openSiiIncomeModal(${JSON.stringify(item.id)})'><i data-lucide="pencil" style="width:15px;height:15px;"></i></button><button class="table-action-btn table-action-btn--danger" title="Eliminar" onclick='deleteSiiIncome(${JSON.stringify(item.id)})'><i data-lucide="trash-2" style="width:15px;height:15px;"></i></button>` : `<button class="table-action-btn" title="Ver detalle" onclick='viewSiiIncome(${JSON.stringify(item.id)})'><i data-lucide="eye" style="width:15px;height:15px;"></i></button>`}`;
    })();

    return `
      <tr>
        <td><span class="sii-badge sii-badge--${getSiiTypeTone(item.kind)}">${escapeHtml(getSiiTypeLabel(item.kind))}</span></td>
        <td><div class="sii-table-cell sii-table-cell--detail"><span class="sii-table-cell__main">${escapeHtml(item.detail || '-')}</span><span class="sii-table-cell__sub">${escapeHtml(item.secondary || '')}</span></div></td>
        <td><div class="sii-table-cell sii-table-cell--counterparty"><span class="sii-table-cell__main">${escapeHtml(item.counterparty || '-')}</span><span class="sii-table-cell__sub">${escapeHtml(item.counterpartySecondary || '')}</span></div></td>
        <td>${escapeHtml(item.date || '-')}</td>
        <td><strong>${formatCurrency(item.amount || 0)}</strong></td>
        <td><div class="sii-fiscal-cell sii-fiscal-cell--${fiscalMeta.tone}">${fiscalMeta.label ? `<span class="sii-fiscal-cell__label">${escapeHtml(fiscalMeta.label)}</span>` : ''}<span class="sii-fiscal-cell__value">${escapeHtml(fiscalMeta.value)}</span></div></td>
        <td><span class="status-badge sii-status-badge status-badge--${statusMeta.badge}">${escapeHtml(statusMeta.label)}</span></td>
        <td><div class="table-actions">${rowActions}</div></td>
      </tr>
    `;
  }).join('');

  if (typeof lucide !== 'undefined') setTimeout(() => lucide.createIcons(), 50);
}

async function viewPresiiFinance(id) {
  const docs = await getPresiiDocs();
  const doc = (docs || []).find(d => d.id === id);
  if (!doc) {
    showToast('Factura no encontrada', 'error');
    return;
  }

  const operacion = (doc.operacion || ((doc.tipo_dte || '').toString() === '110' ? 'compra' : 'venta')).toString().toLowerCase();
  const { neto, iva, total } = calcTotalsFromItems(doc.items || [], !!doc.exento);
  const statusMeta = getSiiStatusMeta(doc.estado || 'borrador', 'presii', {
    skipAnalytics: false,
    fecha_vencimiento: doc.fecha_vencimiento || ''
  });
  const itemsHtml = (doc.items || []).length
    ? (doc.items || []).map(it => `
        <tr>
          <td style="white-space:normal;">${escapeHtml(it.desc || '-')}</td>
          <td style="text-align:right;">${Number(it.qty || 0)}</td>
          <td style="text-align:right;">${formatCurrency(it.unit_price || 0)}</td>
          <td style="text-align:right;">${Number(it.discount_pct || 0)}%</td>
          <td style="text-align:right;font-weight:700;">${formatCurrency(calcItemTotal(it))}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="5" style="text-align:center;color:var(--dash-text-secondary);padding:14px;">Sin ítems registrados</td></tr>';

  const body = `
    <div style="display:grid;gap:16px;max-height:72vh;overflow-y:auto;padding-right:4px;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
        <div>
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <h3 style="margin:0;">${escapeHtml(dteName(doc.tipo_dte) || 'Factura')}</h3>
            <span class="sii-badge sii-badge--${getSiiTypeTone(operacion === 'compra' ? 'purchase' : 'sale')}">${escapeHtml(getSiiTypeLabel(operacion === 'compra' ? 'purchase' : 'sale'))}</span>
            <span class="status-badge sii-status-badge status-badge--${statusMeta.badge}">${escapeHtml(statusMeta.label)}</span>
          </div>
          <div style="margin-top:4px;color:var(--dash-text-secondary);">Folio ${escapeHtml(String(doc.folio || '-').padStart(6, '0'))} · ${escapeHtml(operacion === 'compra' ? 'Factura de compra' : 'Factura de venta')}</div>
        </div>
        ${isButtonAllowed('btn-nueva-presii') ? `<button class="btn-dash btn-dash--secondary btn-dash--sm" onclick="closeModal(); openPresiiModal('${doc.id}')"><i data-lucide="pencil" style="width:13px;height:13px;"></i> Editar</button>` : ''}
      </div>

      <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;">
        <div style="background:var(--dash-surface-2);border:1px solid var(--dash-border);border-radius:10px;padding:12px;">
          <div style="font-size:0.75rem;color:var(--dash-text-muted);text-transform:uppercase;letter-spacing:0.05em;">Fecha</div>
          <div style="font-weight:700;margin-top:4px;">${escapeHtml(doc.fecha || '-')}</div>
        </div>
        <div style="background:var(--dash-surface-2);border:1px solid var(--dash-border);border-radius:10px;padding:12px;">
          <div style="font-size:0.75rem;color:var(--dash-text-muted);text-transform:uppercase;letter-spacing:0.05em;">Contraparte</div>
          <div style="font-weight:700;margin-top:4px;white-space:normal;">${escapeHtml(operacion === 'compra' ? (doc.emi_name || doc.razon_social || '-') : (doc.razon_social || doc.emi_name || '-'))}</div>
        </div>
        <div style="background:var(--dash-surface-2);border:1px solid var(--dash-border);border-radius:10px;padding:12px;">
          <div style="font-size:0.75rem;color:var(--dash-text-muted);text-transform:uppercase;letter-spacing:0.05em;">RUT</div>
          <div style="font-weight:700;margin-top:4px;font-family:monospace;">${escapeHtml(operacion === 'compra' ? (doc.emi_rut || '-') : (doc.rut_receptor || '-'))}</div>
        </div>
        <div style="background:var(--dash-surface-2);border:1px solid var(--dash-border);border-radius:10px;padding:12px;">
          <div style="font-size:0.75rem;color:var(--dash-text-muted);text-transform:uppercase;letter-spacing:0.05em;">Período</div>
          <div style="font-weight:700;margin-top:4px;">${escapeHtml(doc.periodo || '-')}</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;">
        <div style="background:#fff;border:1px solid var(--dash-border);border-radius:10px;padding:12px;">
          <div style="font-size:0.75rem;color:var(--dash-text-muted);text-transform:uppercase;letter-spacing:0.05em;">Neto</div>
          <div style="font-weight:800;font-size:1.05rem;margin-top:4px;">${formatCurrency(neto)}</div>
        </div>
        <div style="background:#fff;border:1px solid var(--dash-border);border-radius:10px;padding:12px;">
          <div style="font-size:0.75rem;color:var(--dash-text-muted);text-transform:uppercase;letter-spacing:0.05em;">IVA</div>
          <div style="font-weight:800;font-size:1.05rem;margin-top:4px;">${doc.exento ? 'Exento' : formatCurrency(iva)}</div>
        </div>
        <div style="background:#fff;border:1px solid var(--dash-border);border-radius:10px;padding:12px;">
          <div style="font-size:0.75rem;color:var(--dash-text-muted);text-transform:uppercase;letter-spacing:0.05em;">Total</div>
          <div style="font-weight:800;font-size:1.05rem;margin-top:4px;">${formatCurrency(total)}</div>
        </div>
      </div>

      <div>
        <div style="font-size:0.82rem;font-weight:700;color:var(--dash-text-secondary);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">Detalle de ítems</div>
        <div style="overflow-x:auto;border:1px solid var(--dash-border);border-radius:10px;">
          <table class="dash-table" style="min-width:820px;">
            <thead>
              <tr>
                <th>Descripción</th>
                <th style="text-align:right;">Cantidad</th>
                <th style="text-align:right;">Precio</th>
                <th style="text-align:right;">Desc.</th>
                <th style="text-align:right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;">
        <div style="background:var(--dash-surface-2);border:1px solid var(--dash-border);border-radius:10px;padding:12px;">
          <div style="font-size:0.75rem;color:var(--dash-text-muted);text-transform:uppercase;letter-spacing:0.05em;">Emisor</div>
          <div style="font-weight:700;margin-top:4px;white-space:normal;">${escapeHtml(doc.emi_name || '-')}</div>
          <div style="color:var(--dash-text-secondary);margin-top:2px;">${escapeHtml(doc.emi_rut || '-')}</div>
        </div>
        <div style="background:var(--dash-surface-2);border:1px solid var(--dash-border);border-radius:10px;padding:12px;">
          <div style="font-size:0.75rem;color:var(--dash-text-muted);text-transform:uppercase;letter-spacing:0.05em;">Receptor</div>
          <div style="font-weight:700;margin-top:4px;white-space:normal;">${escapeHtml(doc.razon_social || '-')}</div>
          <div style="color:var(--dash-text-secondary);margin-top:2px;">${escapeHtml(doc.rut_receptor || '-')}</div>
        </div>
      </div>
    </div>
  `;

  openModal('Detalle de Factura', body, null, null, true);
  if (typeof lucide !== 'undefined') setTimeout(() => lucide.createIcons(), 50);
}

function initSiiToolbar() {
  const searchInput = document.getElementById('sii-search');
  if (searchInput && !searchInput.dataset.bound) {
    searchInput.dataset.bound = 'true';
    let timer;
    searchInput.addEventListener('input', () => {
      clearTimeout(timer);
      timer = window.setTimeout(() => renderSiiRows(), 160);
    });
  }

  ['sii-filter-source', 'sii-filter-type', 'sii-filter-status', 'sii-filter-mes'].forEach(filterId => {
    const filterEl = document.getElementById(filterId);
    if (filterEl && !filterEl.dataset.bound) {
      filterEl.dataset.bound = 'true';
      filterEl.addEventListener('change', () => renderSiiRows());
    }
  });

  const exportBtn = document.getElementById('btn-export-sii');
  if (exportBtn && !exportBtn.dataset.bound) {
    exportBtn.dataset.bound = 'true';
    exportBtn.addEventListener('click', exportSiiCsv);
  }

  const btnVenta = document.getElementById('btn-sii-factura-venta');
  if (btnVenta && !btnVenta.dataset.bound) {
    btnVenta.dataset.bound = 'true';
    btnVenta.addEventListener('click', () => openPresiiModal(null, { tipo_dte: '33', operacion: 'venta' }));
  }

  const btnCompra = document.getElementById('btn-sii-factura-compra');
  if (btnCompra && !btnCompra.dataset.bound) {
    btnCompra.dataset.bound = 'true';
    btnCompra.addEventListener('click', () => openPresiiModal(null, { tipo_dte: '110', operacion: 'compra' }));
  }

  const btnHonorarios = document.getElementById('btn-sii-honorarios');
  if (btnHonorarios && !btnHonorarios.dataset.bound) {
    btnHonorarios.dataset.bound = 'true';
    btnHonorarios.addEventListener('click', () => openPaymentModal(null, 'honorarios'));
  }

  const btnGasto = document.getElementById('btn-sii-gasto');
  if (btnGasto && !btnGasto.dataset.bound) {
    btnGasto.dataset.bound = 'true';
    btnGasto.addEventListener('click', () => addExpense());
  }

  const btnIngreso = document.getElementById('btn-sii-ingreso');
  if (btnIngreso && !btnIngreso.dataset.bound) {
    btnIngreso.dataset.bound = 'true';
    btnIngreso.addEventListener('click', () => openSiiIncomeModal());
  }
}

async function refreshUnifiedSiiIfVisible() {
  const page = document.getElementById('page-sii');
  if (page && page.classList.contains('active')) {
    await loadSiiUnified();
  }
}

async function loadSiiUnified() {
  const titleEl = document.querySelector('#page-sii .dash-page__title');
  const subtitleEl = document.querySelector('#page-sii .dash-page__subtitle');
  if (titleEl) titleEl.textContent = 'Finanzas';
  if (subtitleEl) subtitleEl.textContent = 'Facturas, boletas, compras e ingresos en una sola vista';

  const now = new Date();
  const monthEl = document.getElementById('sii-filter-mes');
  if (monthEl && !monthEl.dataset.initialized) {
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const opts = [];
    for (let i = 0; i < 13; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('es-CL', { month: 'long', year: 'numeric' });
      opts.push(`<option value="${value}" ${value === currentMonth ? 'selected' : ''}>${label.charAt(0).toUpperCase() + label.slice(1)}</option>`);
    }
    monthEl.innerHTML = opts.join('');
    monthEl.value = currentMonth;
    monthEl.dataset.initialized = 'true';
  }

  const [presiiDocs, pagos, expensesRes, incomesRes] = await Promise.all([
    getPresiiDocs(),
    getPagos(),
    supabase.from('expenses').select('id,date_incurred,category,description,amount,vendor,project_id,status,receipt_number,notes,payment_method,paid_at,created_at,updated_at,iva_amount,iva_percentage,discount_amount').order('date_incurred', { ascending: false }),
    supabase.from('fin_ingresos').select('id,fecha,concepto,cliente,origen,categoria,metodo_pago,referencia,observaciones,estado,monto').order('fecha', { ascending: false })
  ]);

  const { data: projects } = await supabase.from('projects').select('id,name');
  const projectMap = {};
  (projects || []).forEach(project => { projectMap[project.id] = project.name; });

  const rows = [];

  (presiiDocs || []).forEach(doc => {
    const operacion = (doc.operacion || ((doc.tipo_dte || '').toString() === '110' ? 'compra' : 'venta')).toString().toLowerCase();
    if (!['venta', 'compra'].includes(operacion)) return;
    const { neto, iva, total } = calcTotalsFromItems(doc.items || [], doc.exento || false);
    const counterparty = operacion === 'compra' ? (doc.emi_name || doc.razon_social || '-') : (doc.razon_social || doc.emi_name || '-');
    rows.push({
      id: doc.id,
      source: 'presii',
      kind: operacion === 'compra' ? 'purchase' : 'sale',
      date: getSiiRowDate(doc.fecha || doc.created_at),
      sortDate: getSiiRowDate(doc.fecha || doc.created_at),
      amount: total,
      fiscalAmount: iva,
      isExempt: !!doc.exento,
      status: normalizeSiiPaidStatus(doc.estado || 'borrador'),
      dueDate: doc.fecha_vencimiento || '',
      detail: `${dteName(doc.tipo_dte)} #${String(doc.folio || '').padStart(6, '0')}`,
      secondary: operacion === 'compra' ? 'Factura de compra' : 'Factura de venta',
      counterparty,
      counterpartySecondary: operacion === 'compra' ? (doc.emi_rut || '') : (doc.rut_receptor || ''),
      searchText: [doc.folio, doc.tipo_dte, doc.razon_social, doc.emi_name, doc.rut_receptor, doc.emi_rut, doc.estado, operacion, neto, iva, total].filter(Boolean).join(' ').toLowerCase()
    });
  });

  (pagos || []).forEach(payment => {
    if ((payment.tipo || '').toLowerCase() !== 'honorarios') return;
    const operation = getPagoOperation(payment);
    rows.push({
      id: payment.id,
      source: 'honorarios',
      kind: 'honorarios',
      operation,
      date: getSiiRowDate(payment.fecha),
      sortDate: getSiiRowDate(payment.fecha),
      amount: Number(payment.neto || payment.bruto || payment.amount || 0),
      fiscalAmount: payment.descuentos != null ? Number(payment.descuentos) : Math.max(0, Number(payment.bruto || 0) - Number(payment.neto || 0)),
      skipAnalytics: !!payment.skip_analytics,
      status: normalizeSiiPaidStatus(payment.status || (payment.skip_analytics ? 'pendiente' : 'registrado')),
      detail: payment.cargo || payment.descripcion || 'Boleta de honorarios',
      secondary: `${operation === 'venta' ? 'Venta' : 'Compra'} · Bruto: ${formatCurrencyShort(payment.bruto || 0)} · Neto: ${formatCurrencyShort(payment.neto || 0)}`,
      counterparty: payment.nombre || '-',
      counterpartySecondary: payment.rut || '',
      searchText: [payment.nombre, payment.rut, payment.cargo, payment.descripcion, payment.fecha, payment.tipo, payment.operacion, payment.bruto, payment.neto, payment.descuentos].filter(Boolean).join(' ').toLowerCase()
    });
  });

  if (expensesRes.error) {
    console.error('expenses:', expensesRes.error);
  }
  (expensesRes.data || []).forEach(exp => {
    const expenseTax = getStoredExpenseBreakdown(exp);
    rows.push({
      id: exp.id,
      source: 'expenses',
      kind: 'expense',
      date: getSiiRowDate(exp.date_incurred || exp.created_at),
      sortDate: getSiiRowDate(exp.date_incurred || exp.created_at),
      amount: Number(exp.amount || 0),
      fiscalAmount: expenseTax.iva,
      isExempt: expenseTax.taxRate === 0,
      status: normalizeSiiPaidStatus(exp.status || 'pendiente'),
      detail: exp.description || 'Gasto por compra',
      secondary: [exp.category, exp.receipt_number, expenseTax.taxRate === 0 ? 'Exento de IVA' : `IVA ${expenseTax.taxRate}%`].filter(Boolean).join(' · '),
      counterparty: exp.vendor || '-',
      counterpartySecondary: exp.project_id ? (projectMap[exp.project_id] || '') : '',
      searchText: [exp.description, exp.vendor, exp.receipt_number, exp.category, exp.payment_method, exp.notes, exp.status, exp.iva_amount, exp.discount_amount].filter(Boolean).join(' ').toLowerCase()
    });
  });

  (incomesRes.data || []).forEach(income => {
    rows.push({
      id: income.id,
      source: 'income',
      kind: 'income',
      date: getSiiRowDate(income.fecha),
      sortDate: getSiiRowDate(income.fecha),
      amount: Number(income.monto || 0),
      fiscalAmount: 0,
      status: normalizeSiiPaidStatus(income.estado || 'registrado'),
      detail: income.concepto || 'Ingreso externo',
      secondary: [income.categoria, income.metodo_pago, income.referencia].filter(Boolean).join(' · ') || 'Ingreso externo',
      counterparty: income.cliente || income.origen || '-',
      counterpartySecondary: income.origen && income.origen !== income.cliente ? income.origen : '',
      searchText: [income.concepto, income.cliente, income.origen, income.categoria, income.metodo_pago, income.referencia, income.observaciones, income.estado, income.monto, income.fecha].filter(Boolean).join(' ').toLowerCase()
    });
  });

  siiUnifiedRows = rows;
  initSiiToolbar();
  renderSiiRows(rows);
}

async function exportSiiCsv() {
  const rows = getFilteredSiiRows();
  const headers = ['Tipo', 'Detalle', 'Contraparte', 'Fecha', 'Monto', 'IVA / Retención', 'Estado'];
  const csv = [headers, ...rows.map(row => {
    const fiscalMeta = getSiiFiscalMeta(row);
    const statusMeta = getSiiStatusMeta(row.status, row.source, row);
    return [getSiiTypeLabel(row.kind), row.detail || '', row.counterparty || '', row.date || '', row.amount || 0, `${fiscalMeta.label} ${fiscalMeta.value}`.trim(), statusMeta.label];
  })]
    .map(values => values.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const filename = `sii_${new Date().toISOString().slice(0, 10)}.csv`;
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

window.viewPresiiFinance = viewPresiiFinance;

async function openSiiIncomeModal(id = null) {
  const { data: item } = id ? await supabase.from('fin_ingresos').select('*').eq('id', id).single() : { data: null };
  const today = new Date().toISOString().slice(0, 10);
  openModal(item ? 'Editar Ingreso Externo' : 'Nuevo Ingreso Externo', `
    <div class="modal-form__row">
      <div class="modal-form__group"><label class="modal-form__label">Fecha</label><input type="date" class="modal-form__input" id="sii-income-fecha" value="${escapeHtml(item?.fecha || today)}"></div>
      <div class="modal-form__group"><label class="modal-form__label">Monto (CLP)</label><input type="number" class="modal-form__input" id="sii-income-monto" value="${escapeHtml(item?.monto || '')}" min="0" placeholder="0"></div>
    </div>
    <div class="modal-form__row">
      <div class="modal-form__group">
        <label class="modal-form__label">Estado</label>
        <select class="modal-form__input" id="sii-income-estado">
          ${[['registrado', 'Registrado'], ['pendiente', 'Pendiente'], ['pagado', 'Pagado'], ['anulado', 'Anulado']].map(([value, label]) => `<option value="${value}" ${normalizeSiiPaidStatus(item?.estado || 'registrado') === value ? 'selected' : ''}>${label}</option>`).join('')}
        </select>
      </div>
      <div class="modal-form__group">
        <label class="modal-form__label">Categoría</label>
        <select class="modal-form__input" id="sii-income-categoria">
          ${[['servicio', 'Servicio'], ['aporte', 'Aporte'], ['reembolso', 'Reembolso'], ['venta', 'Venta puntual'], ['otro', 'Otro']].map(([value, label]) => `<option value="${value}" ${String(item?.categoria || 'servicio') === value ? 'selected' : ''}>${label}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="modal-form__group"><label class="modal-form__label">Concepto</label><input type="text" class="modal-form__input" id="sii-income-concepto" value="${escapeHtml(item?.concepto || '')}" placeholder="Ej: Servicio externo, aporte, reembolso..."></div>
    <div class="modal-form__row">
      <div class="modal-form__group"><label class="modal-form__label">Cliente / Contraparte</label><input type="text" class="modal-form__input" id="sii-income-cliente" value="${escapeHtml(item?.cliente || '')}" placeholder="Nombre del cliente o pagador"></div>
      <div class="modal-form__group"><label class="modal-form__label">Origen</label><input type="text" class="modal-form__input" id="sii-income-origen" value="${escapeHtml(item?.origen || '')}" placeholder="Empresa, persona o fuente del ingreso"></div>
    </div>
    <div class="modal-form__row">
      <div class="modal-form__group">
        <label class="modal-form__label">Método de pago</label>
        <select class="modal-form__input" id="sii-income-metodo">
          ${[['transferencia', 'Transferencia'], ['efectivo', 'Efectivo'], ['tarjeta', 'Tarjeta'], ['cheque', 'Cheque'], ['otro', 'Otro']].map(([value, label]) => `<option value="${value}" ${String(item?.metodo_pago || '') === value ? 'selected' : ''}>${label}</option>`).join('')}
        </select>
      </div>
      <div class="modal-form__group"><label class="modal-form__label">Referencia / folio</label><input type="text" class="modal-form__input" id="sii-income-referencia" value="${escapeHtml(item?.referencia || '')}" placeholder="Número de transferencia, folio, comprobante..."></div>
    </div>
    <div class="modal-form__group"><label class="modal-form__label">Observaciones</label><textarea class="modal-form__input" id="sii-income-observaciones" rows="3" placeholder="Notas adicionales, condiciones, respaldo...">${escapeHtml(item?.observaciones || '')}</textarea></div>
  `, 'Guardar', async () => {
    const fecha = document.getElementById('sii-income-fecha').value;
    const concepto = document.getElementById('sii-income-concepto').value.trim();
    const cliente = document.getElementById('sii-income-cliente').value.trim();
    const origen = document.getElementById('sii-income-origen').value.trim();
    const categoria = document.getElementById('sii-income-categoria').value;
    const metodoPago = document.getElementById('sii-income-metodo').value;
    const referencia = document.getElementById('sii-income-referencia').value.trim();
    const observaciones = document.getElementById('sii-income-observaciones').value.trim();
    const estado = normalizeSiiPaidStatus(document.getElementById('sii-income-estado').value);
    const monto = document.getElementById('sii-income-monto').value;
    if (!concepto || !monto) { showToast('Completa concepto y monto', 'error'); return; }

    const payload = {
      fecha,
      concepto,
      cliente,
      origen,
      categoria,
      metodo_pago: metodoPago,
      referencia,
      observaciones,
      estado,
      monto: Math.round(parseFloat(monto) || 0)
    };
    const { error } = item
      ? await supabase.from('fin_ingresos').update(payload).eq('id', id)
      : await supabase.from('fin_ingresos').insert(payload);

    if (error) { showToast('Error: ' + error.message, 'error'); return; }
    closeModal();
    showToast(item ? 'Ingreso actualizado' : 'Ingreso registrado', 'success');
    await loadSiiUnified();
  });
}

async function viewSiiIncome(id) {
  const { data: item, error } = await supabase.from('fin_ingresos').select('*').eq('id', id).single();
  if (error || !item) { showToast('Ingreso no encontrado', 'error'); return; }

  const statusMeta = getSiiStatusMeta(normalizeSiiPaidStatus(item.estado || 'registrado'), 'income');

  openModal('Detalle de Ingreso Externo', `
    <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;">
      <div style="background:var(--dash-surface-2);border:1px solid var(--dash-border);border-radius:10px;padding:12px;">
        <div style="font-size:0.8rem;color:var(--dash-text-secondary);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px;">Fecha</div>
        <div style="font-weight:700;">${escapeHtml(item.fecha || '-')}</div>
      </div>
      <div style="background:var(--dash-surface-2);border:1px solid var(--dash-border);border-radius:10px;padding:12px;">
        <div style="font-size:0.8rem;color:var(--dash-text-secondary);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px;">Monto</div>
        <div style="font-weight:700;">${formatCurrency(item.monto || 0)}</div>
      </div>
      <div style="background:var(--dash-surface-2);border:1px solid var(--dash-border);border-radius:10px;padding:12px;">
        <div style="font-size:0.8rem;color:var(--dash-text-secondary);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px;">Estado</div>
        <div><span class="status-badge sii-status-badge status-badge--${statusMeta.badge}">${escapeHtml(statusMeta.label)}</span></div>
      </div>
      <div style="background:var(--dash-surface-2);border:1px solid var(--dash-border);border-radius:10px;padding:12px;">
        <div style="font-size:0.8rem;color:var(--dash-text-secondary);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px;">Categoría</div>
        <div style="font-weight:700;">${escapeHtml(item.categoria || 'Servicio')}</div>
      </div>
      <div style="background:var(--dash-surface-2);border:1px solid var(--dash-border);border-radius:10px;padding:12px;">
        <div style="font-size:0.8rem;color:var(--dash-text-secondary);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px;">Cliente / Contraparte</div>
        <div style="font-weight:700;">${escapeHtml(item.cliente || '-')}</div>
      </div>
      <div style="background:var(--dash-surface-2);border:1px solid var(--dash-border);border-radius:10px;padding:12px;">
        <div style="font-size:0.8rem;color:var(--dash-text-secondary);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px;">Origen</div>
        <div style="font-weight:700;">${escapeHtml(item.origen || '-')}</div>
      </div>
      <div style="background:var(--dash-surface-2);border:1px solid var(--dash-border);border-radius:10px;padding:12px;">
        <div style="font-size:0.8rem;color:var(--dash-text-secondary);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px;">Método de pago</div>
        <div style="font-weight:700;">${escapeHtml(item.metodo_pago || '-')}</div>
      </div>
      <div style="grid-column:span 2;background:var(--dash-surface-2);border:1px solid var(--dash-border);border-radius:10px;padding:12px;">
        <div style="font-size:0.8rem;color:var(--dash-text-secondary);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px;">Concepto</div>
        <div style="font-weight:700;">${escapeHtml(item.concepto || '-')}</div>
      </div>
      <div style="grid-column:span 2;background:var(--dash-surface-2);border:1px solid var(--dash-border);border-radius:10px;padding:12px;">
        <div style="font-size:0.8rem;color:var(--dash-text-secondary);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px;">Referencia / Folio</div>
        <div style="font-weight:700;">${escapeHtml(item.referencia || '-')}</div>
      </div>
      <div style="grid-column:span 2;background:var(--dash-surface-2);border:1px solid var(--dash-border);border-radius:10px;padding:12px;">
        <div style="font-size:0.8rem;color:var(--dash-text-secondary);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px;">Observaciones</div>
        <div style="font-weight:700;white-space:pre-wrap;">${escapeHtml(item.observaciones || '-')}</div>
      </div>
    </div>
  `, item ? 'Editar' : null, async () => openSiiIncomeModal(id), true);
}

function deleteSiiIncome(id) {
  openModal('Eliminar Ingreso Externo', '<p>¿Estás seguro de eliminar este ingreso externo?</p>', 'Eliminar', async () => {
    const { error } = await supabase.from('fin_ingresos').delete().eq('id', id);
    if (error) { showToast('Error: ' + error.message, 'error'); return; }
    closeModal();
    showToast('Ingreso eliminado', 'success');
    await loadSiiUnified();
  });
}


async function openActivityLogModal() {
  try {
    const { data: activities, error } = await db.activity.getRecent(100);
    if (error) {
      showToast('Error al cargar actividad', 'error');
      return;
    }

    if (!activities || activities.length === 0) {
      openModal('Actividad completa', '<p style="color:var(--dash-text-secondary);padding:1rem;">No hay registros de actividad.</p>', null, null, true);
      return;
    }

    const grouped = activities.reduce((acc, a) => {
      const d = new Date(a.created_at);
      const day = d.toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' });
      if (!acc[day]) acc[day] = [];
      acc[day].push(a);
      return acc;
    }, {});

    const renderActivityLog = (logItems) => {
      const groupedByDay = logItems.reduce((acc, a) => {
        const d = new Date(a.created_at);
        const day = d.toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' });
        if (!acc[day]) acc[day] = [];
        acc[day].push(a);
        return acc;
      }, {});

      if (!Object.keys(groupedByDay).length) {
        return '<p style="color:var(--dash-text-secondary);padding:1rem;">No hay registros que coincidan con el filtro.</p>';
      }

      return Object.keys(groupedByDay).sort((a, b) => new Date(b) - new Date(a)).map(day => {
        const rows = groupedByDay[day].map(a => {
          const when = new Date(a.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
          const activityBadgeColor = a.activity_type === 'error' ? '#f8d7da' : a.activity_type === 'warning' ? '#fff3cd' : '#d1e1e7';
          const activityTextColor = a.activity_type === 'error' ? '#842029' : a.activity_type === 'warning' ? '#664d03' : '#0f2f51';
          const activityBadge = `<span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;background:${activityBadgeColor};color:${activityTextColor};margin-left:8px;">${escapeHtml(a.activity_type.toString().toUpperCase())}</span>`;
          return `<div style="margin-bottom:8px;padding:10px;border-radius:10px;border:1px solid var(--dash-border);background:var(--dash-bg);box-shadow:0 1px 6px rgba(0,0,0,.08);">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;">
              <div style="flex:1;min-width:0;">
                <p style="margin:0 0 6px;font-weight:600;color:var(--dash-heading);">${escapeHtml(a.user_name || 'Sistema')}${activityBadge}</p>
                <p style="margin:0;color:var(--dash-text);font-size:0.93rem;line-height:1.4;">${escapeHtml(a.description)}${a.entity_name ? ` <em style="color:var(--dash-text-secondary);">(${escapeHtml(a.entity_name)})</em>` : ''}</p>
              </div>
              <div style="min-width:90px;text-align:right;"><span style="color:var(--dash-text-secondary);font-size:0.8rem;">${when}</span></div>
            </div>
          </div>`;
        }).join('');

        return `<section style="margin-bottom:16px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <h4 style="margin:0;font-size:1rem;color:var(--dash-heading);">${day}</h4>
            <span style="font-size:0.8rem;color:var(--dash-text-secondary);">${groupedByDay[day].length} registro${groupedByDay[day].length === 1 ? '' : 's'}</span>
          </div>
          ${rows}
        </section>`;
      }).join('');
    };

    const modalContent = `
      <div style="margin-bottom:12px;display:flex;gap:8px;flex-wrap:wrap;">
        <input id="activity-search" type="text" placeholder="Buscar por usuario, descripción o entidad" style="flex:1;min-width:220px;padding:8px;border-radius:8px;border:1px solid var(--dash-border);" />
        <select id="activity-type-filter" style="padding:8px;border-radius:8px;border:1px solid var(--dash-border);">
          <option value="">Todos los tipos</option>
          <option value="general">General</option>
          <option value="project">Proyecto</option>
          <option value="task">Tarea</option>
          <option value="client">Cliente</option>
          <option value="provider">Proveedor</option>
          <option value="invoice">Factura</option>
          <option value="order">Pedido</option>
          <option value="team">Equipo</option>
        </select>
        <select id="activity-days-filter" style="padding:8px;border-radius:8px;border:1px solid var(--dash-border);">
          <option value="7">Últimos 7 días</option>
          <option value="14">Últimos 14 días</option>
        </select>
      </div>
      <div id="activity-log-container" style="max-height:56vh;overflow:auto;padding-right:4px;">${renderActivityLog(activities)}</div>
    `;

    openModal('Actividad completa', modalContent, null, null, true);

    const filterAndRender = () => {
      const searchTerm = document.getElementById('activity-search').value.trim().toLowerCase();
      const typeFilter = document.getElementById('activity-type-filter').value;
      const daysFilter = Number(document.getElementById('activity-days-filter').value);
      const now = new Date();

      const filtered = activities.filter(a => {
        const date = new Date(a.created_at);
        if (daysFilter > 0 && (now - date) > daysFilter * 24 * 60 * 60 * 1000) return false;
        if (typeFilter && a.activity_type !== typeFilter) return false;
        if (!searchTerm) return true;
        const haystack = `${a.user_name || ''} ${a.description || ''} ${a.entity_name || ''}`.toLowerCase();
        return haystack.includes(searchTerm);
      });

      const container = document.getElementById('activity-log-container');
      if (container) container.innerHTML = renderActivityLog(filtered);
    };

    document.getElementById('activity-search').addEventListener('input', filterAndRender);
    document.getElementById('activity-type-filter').addEventListener('change', filterAndRender);
    document.getElementById('activity-days-filter').addEventListener('change', filterAndRender);

  } catch (err) {
    console.error('Error al abrir modal de actividad:', err);
    showToast('Error al abrir actividad completa', 'error');
  }
}


async function exportRelationsCsv() {
  const rows = getFilteredRelationRows();
  const headers = ['Tipo', 'Nombre', 'Empresa', 'Email', 'Detalle', 'Estado', 'Facturado'];
  const csvRows = rows.map(item => [
    getRelationTypeLabel(item.entity_type),
    item.name || '',
    item.company || '',
    item.contactPrimary || '',
    [item.detailPrimary, item.detailSecondary].filter(Boolean).join(' · '),
    item.status || '',
    item.total_billed != null ? item.total_billed : ''
  ]);
  const csv = [headers, ...csvRows].map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
  const filename = `relaciones_${new Date().toISOString().slice(0,10)}.csv`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (navigator.msSaveBlob) {
    navigator.msSaveBlob(blob, filename);
  } else {
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Mostrar detalles completos del cliente en un modal
async function viewClient(id, type = 'client') {
  const isProvider = type === 'provider';
  currentClientType = isProvider ? 'provider' : 'client';
  const { data: c, error } = isProvider ? await db.providers.getById(id) : await db.clients.getById(id);
  if (error || !c) { showToast((isProvider ? 'Proveedor' : 'Cliente') + ' no encontrado', 'error'); return; }

  if (isProvider) {
    const initials = (c.name || c.company || '').split(' ').map(s => s[0]).join('').substring(0, 2).toUpperCase();
    const providerRut = normalizeRut(c.rut || '');
    const providerPaymentAccount = c.payment_account || c.account_number || '-';

    let providerTotalBilled = Number(c.total_billed || 0);
    if (providerRut) {
      const providerDocs = await getPresiiDocs();
      const computedTotal = (providerDocs || []).reduce((sum, doc) => {
        const docRut = normalizeRut(doc.emi_rut || doc.rut_receptor || '');
        if (docRut !== providerRut) return sum;

        const operacion = (doc.operacion || ((doc.tipo_dte || '').toString() === '110' ? 'compra' : 'venta')).toString().toLowerCase();
        if (operacion !== 'compra') return sum;

        const itemTotal = calcTotalsFromItems(doc.items || [], doc.exento || false).total || 0;
        const docTotal = itemTotal > 0 ? itemTotal : (parseFloat(doc.total) || 0);
        return sum + docTotal;
      }, 0);

      providerTotalBilled = computedTotal > 0 ? computedTotal : providerTotalBilled;
    }

    const content = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
        <div style="flex:1;display:flex;gap:12px;align-items:flex-start;">
          <div class="client-avatar">${c.avatar_url ? `<img src="${assetUrl(c.avatar_url)}" alt="" style="width:100%;height:100%;border-radius:12px;object-fit:cover;">` : initials}</div>
          <div class="client-details">
            <h3 style="margin:0 0 6px;">${escapeHtml(c.name)}</h3>
            <div style="color:var(--dash-text-secondary);margin-bottom:8px;">${escapeHtml(c.company || '')}</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div>
                <div><strong>Email:</strong> ${escapeHtml(c.email || '-')}</div>
                <div><strong>Teléfono:</strong> ${escapeHtml(c.phone || '-')}</div>
                <div><strong>RUT:</strong> ${escapeHtml(c.rut || '-')}</div>
              </div>
              <div>
                <div><strong>Dirección:</strong> ${escapeHtml(c.address || '-')}</div>
                <div><strong>Región / Ciudad:</strong> ${escapeHtml(c.region || '-')} / ${escapeHtml(c.city || '-')}</div>
                <div style="margin-top:6px;"><strong>Estado:</strong> <span class="status-badge status-badge--${c.status}">${statusLabel(c.status)}</span></div>
              </div>
            </div>
            <div class="client-stats">
              <div class="client-stat"><div class="label">Total facturado</div><div class="value">${formatCurrency(providerTotalBilled || 0)}</div></div>
              <div class="client-stat"><div class="label">Tipo cuenta</div><div class="value">${escapeHtml(formatAccountType(c.account_type))}</div></div>
            </div>
          </div>
        </div>
        <div style="width:340px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <div style="font-weight:600;">Datos de pago</div>
            <div class="modal-actions">
              <button class="btn-icon" title="Editar proveedor" onclick='editClient(${JSON.stringify(c.id)}, "provider")'><i data-lucide="pencil" style="width:14px;height:14px;"></i></button>
            </div>
          </div>
          <div class="client-list">
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--dash-border);"><div>Banco</div><div style="font-weight:600;">${escapeHtml(c.bank || '-')}</div></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--dash-border);"><div>Tipo de cuenta</div><div style="font-weight:600;">${escapeHtml(formatAccountType(c.account_type))}</div></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;gap:12px;"><div>Cuenta para pagos</div><div style="font-weight:600;text-align:right;word-break:break-word;">${escapeHtml(providerPaymentAccount)}</div></div>
          </div>
        </div>
      </div>
    `;

    openModal(`${escapeHtml(c.company || c.name)}`, content, null, null, true);
    const modalContentEl = document.querySelector('.dash-modal__content');
    if (modalContentEl) modalContentEl.classList.add('dash-modal__content--fullscreen');
    if (typeof lucide !== 'undefined') setTimeout(() => lucide.createIcons(), 50);
    return;
  }

  const clientName = c.company || c.name || '';
  const clientRut = c.rut || '';

  let invoicesHtml = '<div style="color:var(--dash-text-secondary);padding:8px 0;">No aplica para proveedores</div>';
  let cotizacionesHtml = '<div style="color:var(--dash-text-secondary);padding:8px 0;">No aplica para proveedores</div>';
  let projects = [];
  let totalBilledLive = 0;
  let clientPresii = [];
  let clientCotizaciones = [];

  let presiiQuery = supabase.from('facturas_presii').select('*').order('created_at', { ascending: false }).limit(8);
  let cotQuery = supabase.from('cotizaciones').select('*').order('created_at', { ascending: false }).limit(8);

  if (clientRut && clientName) {
    presiiQuery = presiiQuery.or(`rut_receptor.eq.${clientRut},razon_social.ilike.%${clientName}%`);
    cotQuery = cotQuery.or(`rut_receptor.eq.${clientRut},cliente.ilike.%${clientName}%`);
  } else if (clientRut) {
    presiiQuery = presiiQuery.eq('rut_receptor', clientRut);
    cotQuery = cotQuery.eq('rut_receptor', clientRut);
  } else if (clientName) {
    presiiQuery = presiiQuery.ilike('razon_social', `%${clientName}%`);
    cotQuery = cotQuery.ilike('cliente', `%${clientName}%`);
  } else {
    presiiQuery = presiiQuery.eq('rut_receptor', '__none__');
    cotQuery = cotQuery.eq('rut_receptor', '__none__');
  }

  const [{ data: clientPresiiData }, { data: clientCotizacionesData }, { data: projectsData }] = await Promise.all([
    presiiQuery,
    cotQuery,
    supabase.from('projects').select('*').eq('client_id', id).order('created_at', { ascending: false })
  ]);

  clientPresii = clientPresiiData || [];
  clientCotizaciones = clientCotizacionesData || [];
  projects = projectsData || [];

  invoicesHtml = (clientPresii && clientPresii.length > 0) ? clientPresii.map(f => {
    const { total } = calcTotalsFromItems(f.items || [], f.exento || false);
    return `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--dash-border);">
    <div>
      <div style="font-weight:600;">FAC-${escapeHtml(String(f.folio || '').padStart(6, '0'))}</div>
      <div style="font-size:12px;color:var(--dash-text-secondary);">${f.fecha || ''} — ${f.estado || ''}</div>
    </div>
    <div style="font-weight:700;">${formatCurrencyShort(total)}</div>
  </div>`;
  }).join('') : '<div style="color:var(--dash-text-secondary);padding:8px 0;">Sin facturas pre-SII</div>';

  const cotizacionesHtmlContent = (clientCotizaciones && clientCotizaciones.length > 0) ? clientCotizaciones.map(cot => {
    const { total } = calcTotalsFromItems(cot.items || [], cot.exento || false);
    const badgeColor = cot.estado === 'aceptada' ? '#165aa3' : cot.estado === 'rechazada' ? '#dc2626' : 'var(--dash-text-secondary)';
    return `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--dash-border);">
    <div>
      <div style="font-weight:600;">COT-${escapeHtml(String(cot.folio || '').padStart(6, '0'))}</div>
      <div style="font-size:12px;"><span style="color:${badgeColor};">${escapeHtml(cot.estado || 'vigente')}</span>${cot.fecha ? ' · ' + cot.fecha : ''}</div>
    </div>
    <div style="font-weight:700;">${formatCurrencyShort(total)}</div>
  </div>`;
  }).join('') : '<div style="color:var(--dash-text-secondary);padding:8px 0;">Sin cotizaciones</div>';

  const totalBilledLiveValue = (clientPresii || []).reduce((sum, f) => {
    const { total } = calcTotalsFromItems(f.items || [], f.exento || false);
    return sum + total;
  }, 0);

  const projectsHtml = (projects && projects.length > 0) ? projects.map(p => `
  <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--dash-border);">
    <div>
      <div style="font-weight:600;">${escapeHtml(p.name)}</div>
      <div style="font-size:12px;color:var(--dash-text-secondary);">${statusLabel(p.status)} — ${p.estimated_end_date ? formatDateShort(p.estimated_end_date) : 'Sin fecha'}</div>
    </div>
    <div style="font-weight:600;">${p.progress || 0}%</div>
  </div>
`).join('') : '<div style="color:var(--dash-text-secondary);padding:1rem;">Sin proyectos</div>';

  const initials = (c.name || c.company || '').split(' ').map(s => s[0]).join('').substring(0, 2).toUpperCase();

  // compute live aggregates from fetched data
  const projectsCountLive = (projects || []).length;
  const content = `
  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
    <div style="flex:1;display:flex;gap:12px;align-items:flex-start;">
      <div class="client-avatar">${c.avatar_url ? `<img src="${assetUrl(c.avatar_url)}" alt="" style="width:100%;height:100%;border-radius:12px;object-fit:cover;">` : initials}</div>
      <div class="client-details">
        <h3 style="margin:0 0 6px;">${escapeHtml(c.name)}</h3>
        <div style="color:var(--dash-text-secondary);margin-bottom:8px;">${escapeHtml(c.company || '')}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div>
            <div><strong>Email:</strong> ${escapeHtml(c.email || '-')}</div>
            <div><strong>Teléfono:</strong> ${escapeHtml(c.phone || '-')}</div>
            <div><strong>RUT:</strong> ${escapeHtml(c.rut || '-')}</div>
          </div>
          <div>
            <div><strong>Dirección:</strong> ${escapeHtml(c.address || '-')}</div>
            <div><strong>Región / Ciudad:</strong> ${escapeHtml(c.region || '-')} / ${escapeHtml(c.city || '-')}</div>
            <div style="margin-top:6px;"><strong>Estado:</strong> <span class="status-badge status-badge--${c.status}">${statusLabel(c.status)}</span></div>
          </div>
        </div>
        <div class="client-stats">
          <div class="client-stat"><div class="label">Total facturado</div><div class="value">${formatCurrencyShort(totalBilledLiveValue)}</div></div>
          <div class="client-stat"><div class="label">Proyectos</div><div class="value">${projectsCountLive}</div></div>
        </div>
      </div>
    </div>
    <div style="width:340px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <div style="font-weight:600;">Documentos Pre-SII</div>
        <div class="modal-actions">
          <button class="btn-icon" title="Editar cliente" onclick='editClient(${JSON.stringify(c.id)}, "client")'><i data-lucide="pencil" style="width:14px;height:14px;"></i></button>
          <button class="btn-icon" title="Crear factura rápida" onclick="quickCreateInvoiceForClient('${c.id}')"><i data-lucide="file-plus" style="width:14px;height:14px;"></i></button>
        </div>
      </div>
      <div style="font-size:0.82rem;font-weight:600;color:var(--dash-text-secondary);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Facturas Pre-SII</div>
      <div class="client-list" style="margin-bottom:10px;">${invoicesHtml}</div>
      <div style="font-size:0.82rem;font-weight:600;color:var(--dash-text-secondary);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Cotizaciones</div>
      <div class="client-list">${cotizacionesHtmlContent}</div>
    </div>
  </div>

  <hr style="border:none;border-top:1px solid var(--dash-border);margin:16px 0;">

  <div>
    <h4 style="margin:0 0 8px;">Proyectos asociados</h4>
    <div class="client-list">${projectsHtml}</div>
  </div>
`;

  openModal(`${escapeHtml(c.company || c.name)}`, content, null, null, true);
  const modalContentEl = document.querySelector('.dash-modal__content');
  if (modalContentEl) modalContentEl.classList.add('dash-modal__content--fullscreen');
  if (typeof lucide !== "undefined") setTimeout(() => lucide.createIcons(), 50);
}

// Quick factura pre-SII from client
async function quickCreateInvoiceForClient(clientId) {
  const { data: c } = await db.clients.getById(clientId);
  const prefill = c ? { razon_social: c.company || c.name || '', rut_receptor: c.rut || '', giro_receptor: c.giro || '', direccion_receptor: c.address || '', ciudad_receptor: c.city || '' } : {};
  navigateTo('cotizaciones');
  setTimeout(() => openPresiiModal(null, prefill), 150);
}


// Regiones y ciudades de Chile
const regionesChile = {
  'Arica y Parinacota': ['Arica', 'Camarones', 'Putre', 'General Lagos'],
  'Tarapacá': ['Iquique', 'Alto Hospicio', 'Pozo Almonte', 'Camiña', 'Colchane', 'Huara', 'Pica'],
  'Antofagasta': ['Antofagasta', 'Mejillones', 'Sierra Gorda', 'Taltal', 'Calama', 'Ollagüe', 'San Pedro de Atacama', 'Tocopilla', 'María Elena'],
  'Atacama': ['Copiapó', 'Caldera', 'Tierra Amarilla', 'Chañaral', 'Diego de Almagro', 'Vallenar', 'Alto del Carmen', 'Freirina', 'Huasco'],
  'Coquimbo': ['La Serena', 'Coquimbo', 'Andacollo', 'La Higuera', 'Paiguano', 'Vicuña', 'Illapel', 'Canela', 'Los Vilos', 'Salamanca', 'Ovalle', 'Combarbalá', 'Monte Patria', 'Punitaqui', 'Río Hurtado'],
  'Valparaíso': ['Valparaíso', 'Casablanca', 'Concón', 'Juan Fernández', 'Puchuncaví', 'Quintero', 'Viña del Mar', 'Isla de Pascua', 'Los Andes', 'Calle Larga', 'Rinconada', 'San Esteban', 'La Ligua', 'Cabildo', 'Papudo', 'Petorca', 'Zapallar', 'Quillota', 'Calera', 'Hijuelas', 'La Cruz', 'Nogales', 'San Antonio', 'Algarrobo', 'Cartagena', 'El Quisco', 'El Tabo', 'Santo Domingo', 'San Felipe', 'Catemu', 'Llaillay', 'Panquehue', 'Putaendo', 'Santa María', 'Quilpué', 'Limache', 'Olmué', 'Villa Alemana'],
  'Metropolitana': ['Santiago', 'Cerrillos', 'Cerro Navia', 'Conchalí', 'El Bosque', 'Estación Central', 'Huechuraba', 'Independencia', 'La Cisterna', 'La Florida', 'La Granja', 'La Pintana', 'La Reina', 'Las Condes', 'Lo Barnechea', 'Lo Espejo', 'Lo Prado', 'Macul', 'Maipú', 'Ñuñoa', 'Pedro Aguirre Cerda', 'Peñalolén', 'Providencia', 'Pudahuel', 'Quilicura', 'Quinta Normal', 'Recoleta', 'Renca', 'San Joaquín', 'San Miguel', 'San Ramón', 'Vitacura', 'Puente Alto', 'Pirque', 'San José de Maipo', 'Colina', 'Lampa', 'Tiltil', 'San Bernardo', 'Buin', 'Calera de Tango', 'Paine', 'Melipilla', 'Alhué', 'Curacaví', 'María Pinto', 'San Pedro', 'Talagante', 'El Monte', 'Isla de Maipo', 'Padre Hurtado', 'Peñaflor'],
  'O\'Higgins': ['Rancagua', 'Codegua', 'Coinco', 'Coltauco', 'Doñihue', 'Graneros', 'Las Cabras', 'Machalí', 'Malloa', 'Mostazal', 'Olivar', 'Peumo', 'Pichidegua', 'Quinta de Tilcoco', 'Rengo', 'Requínoa', 'San Vicente', 'Pichilemu', 'La Estrella', 'Litueche', 'Marchihue', 'Navidad', 'Paredones', 'San Fernando', 'Chépica', 'Chimbarongo', 'Lolol', 'Nancagua', 'Palmilla', 'Peralillo', 'Placilla', 'Pumanque', 'Santa Cruz'],
  'Maule': ['Talca', 'Constitución', 'Curepto', 'Empedrado', 'Maule', 'Pelarco', 'Pencahue', 'Río Claro', 'San Clemente', 'San Rafael', 'Cauquenes', 'Chanco', 'Pelluhue', 'Curicó', 'Hualañé', 'Licantén', 'Molina', 'Rauco', 'Romeral', 'Sagrada Familia', 'Teno', 'Vichuquén', 'Linares', 'Colbún', 'Longaví', 'Parral', 'Retiro', 'San Javier', 'Villa Alegre', 'Yerbas Buenas'],
  'Ñuble': ['Chillán', 'Bulnes', 'Chillán Viejo', 'El Carmen', 'Pemuco', 'Pinto', 'Quillón', 'San Ignacio', 'Yungay', 'Quirihue', 'Cobquecura', 'Coelemu', 'Ninhue', 'Portezuelo', 'Ranquil', 'Treguaco', 'San Carlos', 'Coihueco', 'Ñiquén', 'San Fabián', 'San Nicolás'],
  'Biobío': ['Concepción', 'Coronel', 'Chiguayante', 'Florida', 'Hualqui', 'Lota', 'Penco', 'San Pedro de la Paz', 'Santa Juana', 'Talcahuano', 'Tomé', 'Hualpén', 'Lebu', 'Arauco', 'Cañete', 'Contulmo', 'Curanilahue', 'Los Álamos', 'Tirúa', 'Los Ángeles', 'Antuco', 'Cabrero', 'Laja', 'Mulchén', 'Nacimiento', 'Negrete', 'Quilaco', 'Quilleco', 'San Rosendo', 'Santa Bárbara', 'Tucapel', 'Yumbel', 'Alto Biobío'],
  'Araucanía': ['Temuco', 'Carahue', 'Cunco', 'Curarrehue', 'Freire', 'Galvarino', 'Gorbea', 'Lautaro', 'Loncoche', 'Melipeuco', 'Nueva Imperial', 'Padre Las Casas', 'Perquenco', 'Pitrufquén', 'Pucón', 'Saavedra', 'Teodoro Schmidt', 'Toltén', 'Vilcún', 'Villarrica', 'Cholchol', 'Angol', 'Collipulli', 'Curacautín', 'Ercilla', 'Lonquimay', 'Los Sauces', 'Lumaco', 'Purén', 'Renaico', 'Traiguén', 'Victoria'],
  'Los Ríos': ['Valdivia', 'Corral', 'Lanco', 'Los Lagos', 'Máfil', 'Mariquina', 'Paillaco', 'Panguipulli', 'La Unión', 'Futrono', 'Lago Ranco', 'Río Bueno'],
  'Los Lagos': ['Puerto Montt', 'Calbuco', 'Cochamó', 'Fresia', 'Frutillar', 'Los Muermos', 'Llanquihue', 'Maullín', 'Puerto Varas', 'Castro', 'Ancud', 'Chonchi', 'Curaco de Vélez', 'Dalcahue', 'Puqueldón', 'Queilén', 'Quellón', 'Quemchi', 'Quinchao', 'Osorno', 'Puerto Octay', 'Purranque', 'Puyehue', 'Río Negro', 'San Juan de la Costa', 'San Pablo', 'Chaitén', 'Futaleufú', 'Hualaihué', 'Palena'],
  'Aysén': ['Coyhaique', 'Lago Verde', 'Aysén', 'Cisnes', 'Guaitecas', 'Cochrane', 'O\'Higgins', 'Tortel', 'Chile Chico', 'Río Ibáñez'],
  'Magallanes': ['Punta Arenas', 'Laguna Blanca', 'Río Verde', 'San Gregorio', 'Cabo de Hornos', 'Antártica', 'Porvenir', 'Primavera', 'Timaukel', 'Natales', 'Torres del Paine']
};

function getRegionesOptions() {
  return Object.keys(regionesChile).map(r => `<option value="${r}">${r}</option>`).join('');
}

function normalizeRut(rut = '') {
  return (rut || '').toString().replace(/[\.\-\s]/g, '').toLowerCase();
}

function formatRut(rut = '') {
  const clean = normalizeRut(rut).replace(/[^0-9k]/g, '').slice(0, 9);
  if (!clean) return '';
  if (clean.length === 1) return clean.toUpperCase();
  const body = clean.slice(0, -1);
  const verifier = clean.slice(-1).toUpperCase();
  return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${verifier}`;
}

function formatRutOrNull(rut = '') {
  const formatted = formatRut(rut);
  return formatted || null;
}

const RUT_INPUT_IDS = new Set([
  'new-client-rut', 'edit-client-rut',
  'new-maintenance-customer-rut', 'edit-maintenance-customer-rut',
  'payment-rut', 'rec-rut', 'emi-rut',
  'ep-rut', 'ef-rut', 'ea-rut',
  'cp-rut', 'fin-rut', 'anx-rut',
  'so-client-rut'
]);

document.addEventListener('input', event => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || !RUT_INPUT_IDS.has(input.id)) return;
  input.value = formatRut(input.value);
});

function getCiudadesOptions(region) {
  if (!region || !regionesChile[region]) return '<option value="">Seleccione región primero</option>';
  return regionesChile[region].map(c => `<option value="${c}">${c}</option>`).join('');
}

function getChileanBanksOptions(selected = '') {
  const banks = [
    'Banco de Chile', 'Banco Santander', 'Banco Estado', 'Banco Bci/Mach', 'Banco Itaú', 'Banco Falabella', 'Banco Ripley', 'Banco Security', 'Banco Bice', 'Scotiabank',
    'Mercado Pago', 'Tenpo', 'Transbank / Webpay'
  ];
  return banks.map(b => `<option value="${b}" ${selected === b ? 'selected' : ''}>${b}</option>`).join('');
}

function formatAccountType(value) {
  if (!value) return '-';
  // Aplica mayusculas de palabras, manteniendo barra y acentos
  return value.toString().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}


function getProviderAccountTypeOptions(selected = '') {
  const options = [
    { value: 'Cuenta Vista/RUT', label: 'Cuenta Vista / RUT' },
    { value: 'Corriente', label: 'Corriente' },
    { value: 'Chequera Electrónica', label: 'Chequera Electrónica' },
    { value: 'Otro', label: 'Otro' }
  ];
  return options.map(({ value, label }) => `<option value="${escapeHtml(value)}" ${selected === value ? 'selected' : ''}>${escapeHtml(label)}</option>`).join('');
}


function initAddClientModal() {
  const buttons = [
    document.getElementById('btn-add-client'),
    document.getElementById('btn-add-provider')
  ];

  buttons.forEach(btn => {
    if (!btn || btn.dataset.bound) return;
    btn.dataset.bound = 'true';

    btn.addEventListener('click', async () => {
      const relationType = btn.dataset.relationType === 'provider' || btn.id === 'btn-add-provider' ? 'provider' : 'client';
      const isProvider = relationType === 'provider';
      const requiredAction = isProvider ? 'btn-add-provider' : 'btn-add-client';
      if (!isButtonAllowed(requiredAction)) return showToast('No tienes permiso para gestionar esta relación', 'warning');
      currentClientType = isProvider ? 'provider' : 'client';

      openModal(isProvider ? 'Nuevo Proveedor' : 'Nuevo Cliente', `
        <div class="modal-form__group"><label class="modal-form__label">Nombre completo</label><input type="text" class="modal-form__input" id="new-client-name" placeholder="Nombre del contacto" required></div>
        ${isProvider ? `
          <div class="modal-form__row">
            <div class="modal-form__group" style="flex:1"><label class="modal-form__label">Tipo de cuenta</label><select class="modal-form__select" id="new-provider-account-type"><option value="">Seleccionar...</option><option value="Cuenta Vista/RUT">Cuenta Vista/RUT</option><option value="Corriente">Corriente</option><option value="Chequera Electrónica">Chequera Electrónica</option><option value="Otro">Otro</option></select></div>
            <div class="modal-form__group" style="flex:1"><label class="modal-form__label">Banco</label><select class="modal-form__select" id="new-provider-bank"><option value="">Seleccionar banco</option>${getChileanBanksOptions()}</select></div>
          </div>
          <div class="modal-form__group"><label class="modal-form__label">Número de cuenta</label><input type="text" class="modal-form__input" id="new-provider-account-number" placeholder="123456789" ></div>
        ` : '<div class="modal-form__group"><label class="modal-form__label">Relación con la empresa</label><select class="modal-form__select" id="new-client-relationship"><option value="">Seleccionar...</option><option value="owner">Dueño</option><option value="manager">Gerente</option><option value="legal_rep">Representante Legal</option><option value="collaborator">Colaborador de la Empresa</option><option value="other">Otro</option></select></div>'}
        <div class="modal-form__group"><label class="modal-form__label">Empresa</label><input type="text" class="modal-form__input" id="new-client-company" placeholder="Nombre de la empresa" required></div>
        <div class="modal-form__group"><label class="modal-form__label">RUT Empresa</label><input type="text" class="modal-form__input" id="new-client-rut" placeholder="12.345.678-9"></div>
        <div class="modal-form__row">
          <div class="modal-form__group"><label class="modal-form__label">Email</label><input type="email" class="modal-form__input" id="new-client-email" placeholder="email@empresa.cl"></div>
          <div class="modal-form__group"><label class="modal-form__label">Teléfono</label><input type="tel" class="modal-form__input" id="new-client-phone" placeholder="+56 9 xxxx xxxx"></div>
        </div>
        <div class="modal-form__group"><label class="modal-form__label">Dirección</label><input type="text" class="modal-form__input" id="new-client-address" placeholder="Dirección de la empresa"></div>
        <div class="modal-form__row">
          <div class="modal-form__group"><label class="modal-form__label">Región</label><select class="modal-form__select" id="new-client-region"><option value="">Seleccione región</option>${getRegionesOptions()}</select></div>
          <div class="modal-form__group"><label class="modal-form__label">Ciudad</label><select class="modal-form__select" id="new-client-city" disabled><option value="">Seleccione región primero</option></select></div>
        </div>
        <div class="modal-form__group"><label class="modal-form__label">Estado</label><select class="modal-form__select" id="new-client-status"><option value="active">Activo</option><option value="prospect">Prospecto</option><option value="inactive">Inactivo</option></select></div>
      `, async () => {
        const name = document.getElementById('new-client-name').value.trim();
        const company = document.getElementById('new-client-company').value.trim();
        if (!name || !company) { showToast('Nombre y empresa son obligatorios', 'error'); return; }

        const accountType = isProvider ? document.getElementById('new-provider-account-type')?.value : null;
        const bank = isProvider ? document.getElementById('new-provider-bank')?.value : null;
        const accountNumber = isProvider ? document.getElementById('new-provider-account-number')?.value.trim() || null : null;

        const payload = {
          name,
          company,
          rut: formatRutOrNull(document.getElementById('new-client-rut').value),
          email: document.getElementById('new-client-email').value.trim() || null,
          phone: document.getElementById('new-client-phone').value.trim() || null,
          address: document.getElementById('new-client-address').value.trim() || null,
          region: document.getElementById('new-client-region').value || null,
          city: document.getElementById('new-client-city').value || null,
          status: document.getElementById('new-client-status').value,
          payment_account: isProvider ? accountNumber : null,
          account_type: isProvider ? accountType : null,
          bank: isProvider ? bank : null,
          account_number: isProvider ? accountNumber : null
        };

        if (!isProvider) {
          payload.relationship = document.getElementById('new-client-relationship').value || null;
        }

        const { data, error } = isProvider ? await db.providers.create(payload) : await db.clients.create(payload);
        if (error) {
          showToast('Error: ' + error.message, 'error');
        } else {
          showToast(isProvider ? `Proveedor "${name}" creado` : `Cliente "${name}" creado`, 'success');
          closeModal();
          await loadRelations();
          if (document.getElementById('page-overview')) await loadOverview();
          db.activity.log({ user_name: currentProfile?.full_name, activity_type: isProvider ? 'provider' : 'client', description: `creó nuevo ${isProvider ? 'proveedor' : 'cliente'}`, entity_name: name });
        }
      });

      const regionSelect = document.getElementById('new-client-region');
      const citySelect = document.getElementById('new-client-city');
      regionSelect.addEventListener('change', (e) => {
        const selectedRegion = e.target.value;
        if (selectedRegion) {
          citySelect.disabled = false;
          citySelect.innerHTML = '<option value="">Seleccione ciudad</option>' + getCiudadesOptions(selectedRegion);
        } else {
          citySelect.disabled = true;
          citySelect.innerHTML = '<option value="">Seleccione región primero</option>';
        }
      });
    });
  });
}

async function editClient(id, type = 'client') {
  const isProvider = type === 'provider';
  const requiredAction = isProvider ? 'btn-add-provider' : 'btn-add-client';
  if (!isButtonAllowed(requiredAction)) return showToast('No tienes permiso para gestionar esta relación', 'warning');
  currentClientType = isProvider ? 'provider' : 'client';
  const { data: c } = isProvider ? await db.providers.getById(id) : await db.clients.getById(id);
  if (!c) { showToast('Error al cargar ' + (isProvider ? 'proveedor' : 'cliente'), 'error'); return; }

  const regionOptions = Object.keys(regionesChile).map(r =>
    `<option value="${r}" ${c.region === r ? 'selected' : ''}>${r}</option>`
  ).join('');

  const cityOptions = c.region ? getCiudadesOptions(c.region) : '<option value="">Seleccione región primero</option>';
  const selectedCityOptions = c.region && c.city ? cityOptions.replace(`value="${c.city}"`, `value="${c.city}" selected`) : cityOptions;

  openModal(isProvider ? 'Editar Proveedor' : 'Editar Cliente', `
    <div class="modal-form__group"><label class="modal-form__label">Nombre</label><input type="text" class="modal-form__input" id="edit-client-name" value="${escapeHtml(c.name)}"></div>
    <div class="modal-form__group"><label class="modal-form__label">Empresa</label><input type="text" class="modal-form__input" id="edit-client-company" value="${escapeHtml(c.company)}"></div>
    <div class="modal-form__group"><label class="modal-form__label">RUT Empresa</label><input type="text" class="modal-form__input" id="edit-client-rut" value="${escapeHtml(c.rut || '')}"></div>
    <div class="modal-form__row">
      <div class="modal-form__group"><label class="modal-form__label">Email</label><input type="email" class="modal-form__input" id="edit-client-email" value="${escapeHtml(c.email || '')}"></div>
      <div class="modal-form__group"><label class="modal-form__label">Teléfono</label><input type="tel" class="modal-form__input" id="edit-client-phone" value="${escapeHtml(c.phone || '')}"></div>
    </div>
    <div class="modal-form__group"><label class="modal-form__label">Dirección</label><input type="text" class="modal-form__input" id="edit-client-address" value="${escapeHtml(c.address || '')}"></div>
    <div class="modal-form__row">
      <div class="modal-form__group"><label class="modal-form__label">Región</label><select class="modal-form__select" id="edit-client-region"><option value="">Seleccione región</option>${regionOptions}</select></div>
      <div class="modal-form__group"><label class="modal-form__label">Ciudad</label><select class="modal-form__select" id="edit-client-city" ${!c.region ? 'disabled' : ''}><option value="">Seleccione ciudad</option>${selectedCityOptions}</select></div>
    </div>
    ${isProvider ? `
      <div class="modal-form__row">
        <div class="modal-form__group" style="flex:1"><label class="modal-form__label">Tipo de cuenta</label><select class="modal-form__select" id="edit-client-account-type"><option value="">Seleccionar...</option>${getProviderAccountTypeOptions(c.account_type || '')}</select></div>
        <div class="modal-form__group" style="flex:1"><label class="modal-form__label">Banco</label><select class="modal-form__select" id="edit-client-bank"><option value="">Seleccionar banco</option>${getChileanBanksOptions(c.bank || '')}</select></div>
      </div>
      <div class="modal-form__group"><label class="modal-form__label">Número de cuenta</label><input type="text" class="modal-form__input" id="edit-client-account-number" value="${escapeHtml(c.account_number || c.payment_account || '')}" placeholder="123456789"></div>
    ` : `<div class="modal-form__group"><label class="modal-form__label">Relación con la empresa</label><select class="modal-form__select" id="edit-client-relationship"><option value="">Seleccionar...</option><option value="owner" ${c.relationship === 'owner' ? 'selected' : ''}>Dueño</option><option value="manager" ${c.relationship === 'manager' ? 'selected' : ''}>Gerente</option><option value="legal_rep" ${c.relationship === 'legal_rep' ? 'selected' : ''}>Representante Legal</option><option value="collaborator" ${c.relationship === 'collaborator' ? 'selected' : ''}>Colaborador de la Empresa</option><option value="other" ${c.relationship === 'other' ? 'selected' : ''}>Otro</option></select></div>`}
    <div class="modal-form__group"><label class="modal-form__label">Estado</label><select class="modal-form__select" id="edit-client-status">
      <option value="active" ${c.status === 'active' ? 'selected' : ''}>Activo</option>
      <option value="prospect" ${c.status === 'prospect' ? 'selected' : ''}>Prospecto</option>
      <option value="inactive" ${c.status === 'inactive' ? 'selected' : ''}>Inactivo</option>
    </select></div>
  `, async () => {
    const updatedData = {
      name: document.getElementById('edit-client-name').value.trim(),
      company: document.getElementById('edit-client-company').value.trim(),
      rut: formatRutOrNull(document.getElementById('edit-client-rut').value),
      email: document.getElementById('edit-client-email').value.trim() || null,
      phone: document.getElementById('edit-client-phone').value.trim() || null,
      address: document.getElementById('edit-client-address').value.trim() || null,
      region: document.getElementById('edit-client-region').value || null,
      city: document.getElementById('edit-client-city').value || null,
      status: document.getElementById('edit-client-status').value
    };
    if (isProvider) {
      updatedData.account_type = document.getElementById('edit-client-account-type')?.value || null;
      updatedData.bank = document.getElementById('edit-client-bank')?.value || null;
      updatedData.account_number = document.getElementById('edit-client-account-number')?.value.trim() || null;
      updatedData.payment_account = updatedData.account_number;
    } else {
      updatedData.relationship = document.getElementById('edit-client-relationship')?.value || null;
    }

    const { error } = isProvider ? await db.providers.update(id, updatedData) : await db.clients.update(id, updatedData);
    if (error) showToast('Error: ' + error.message, 'error');
    else {
      showToast(isProvider ? 'Proveedor actualizado' : 'Cliente actualizado', 'success');
      void auditLog(`actualizó ${isProvider ? 'proveedor' : 'cliente'}`, isProvider ? 'provider' : 'client', id, updatedData.name);
      closeModal();
      await loadRelations();
      if (document.getElementById('page-overview')) await loadOverview();
    }
  });

  // Listener para filtrar ciudades por región en edición
  const regionSelect = document.getElementById('edit-client-region');
  const citySelect = document.getElementById('edit-client-city');
  regionSelect.addEventListener('change', (e) => {
    const selectedRegion = e.target.value;
    if (selectedRegion) {
      citySelect.disabled = false;
      citySelect.innerHTML = '<option value="">Seleccione ciudad</option>' + getCiudadesOptions(selectedRegion);
    } else {
      citySelect.disabled = true;
      citySelect.innerHTML = '<option value="">Seleccione región primero</option>';
    }
  });
}

function deleteClient(id, name, type = 'client') {
  const isProvider = type === 'provider';
  const requiredAction = isProvider ? 'btn-add-provider' : 'btn-add-client';
  if (!isButtonAllowed(requiredAction)) return showToast('No tienes permiso para gestionar esta relación', 'warning');
  currentClientType = isProvider ? 'provider' : 'client';
  openModal(isProvider ? 'Eliminar Proveedor' : 'Eliminar Cliente', `<p>¿Estás seguro de eliminar a <strong>${escapeHtml(name)}</strong>? Esta acción no se puede deshacer.</p>`, 'Eliminar', async () => {
    const { error } = isProvider ? await db.providers.delete(id) : await db.clients.delete(id);
    if (error) { showToast('Error: ' + error.message, 'error'); return; }
    closeModal();
    showToast(`"${name}" eliminado`, 'success');
    await loadRelations();
    if (document.getElementById('page-overview')) await loadOverview();
    db.activity.log({ user_name: currentProfile?.full_name, activity_type: isProvider ? 'provider' : 'client', description: `eliminó ${isProvider ? 'proveedor' : 'cliente'}`, entity_name: name });
  });
}

// Estos estados no deben ser editables manualmente desde el formulario.
// Se espera que se calculen o actualicen a partir de consultas/monitoreo de la página.


async function probeProjectWebsiteStatus(url) {
  if (!url || !String(url).trim()) return null;
  const checkedAt = new Date().toISOString();
  const startedAt = performance.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const configuredUrl = new URL(String(url).trim(), window.location.href);
    const websiteUrl = `${configuredUrl.origin}/`;
    const sameOrigin = configuredUrl.origin === window.location.origin;
    const response = await fetch(websiteUrl, {
      method: 'HEAD',
      mode: sameOrigin ? 'cors' : 'no-cors',
      cache: 'no-store',
      redirect: 'follow',
      signal: controller.signal
    });
    const responseTime = Math.round(performance.now() - startedAt);
    const reachable = response.type === 'opaque' || response.status < 500;

    return {
      domain_status: reachable ? 'online' : 'offline',
      frontend_status: reachable ? 'operativo' : 'error',
      backend_status: 'no aplica',
      supabase_database_status: 'no aplica',
      supabase_auth_status: 'no aplica',
      supabase_storage_status: 'no aplica',
      ssl_status: 'no aplica',
      health_checked_at: checkedAt,
      health_response_ms: responseTime,
      health_http_status: response.type === 'opaque' ? null : response.status,
      health_error: reachable ? null : `El sitio respondió HTTP ${response.status}`
    };
  } catch (err) {
    const reason = err?.name === 'AbortError'
      ? 'El sitio superó el tiempo máximo de 10 segundos'
      : 'No fue posible conectar con el sitio web';
    return {
      domain_status: 'offline',
      frontend_status: 'error',
      backend_status: 'no aplica',
      supabase_database_status: 'no aplica',
      supabase_auth_status: 'no aplica',
      supabase_storage_status: 'no aplica',
      ssl_status: 'no aplica',
      health_checked_at: checkedAt,
      health_response_ms: Math.round(performance.now() - startedAt),
      health_http_status: null,
      health_error: reason
    };
  } finally {
    clearTimeout(timeoutId);
  }
}


async function refreshProjectHealth(id) {
  const { data: project, error } = await db.projects.getById(id);
  if (error || !project?.health_check_url) {
    showToast('Configura primero la URL pública del sitio', 'error');
    return;
  }
  showToast('Comprobando sitio web...', 'info');
  const snapshot = await probeProjectWebsiteStatus(project.health_check_url);
  if (!snapshot) return;
  showToast(snapshot.health_error ? 'El sitio no está respondiendo correctamente' : 'El sitio está en línea', snapshot.health_error ? 'warning' : 'success');
  await viewProject(id, { healthSnapshot: snapshot });
  await loadProjects();
}
window.refreshProjectHealth = refreshProjectHealth;

// ==========================================================================
// PROJECTS
// ==========================================================================
window.openProjectRequirements = async function (projectId) {
  if (!isPageAllowed('requirements')) {
    showToast('No tienes permiso para ver requisitos.', 'warning');
    return;
  }
  try {
    const root = document.getElementById('requirements-app');
    await mountRequirements(root, { supabase, escapeHtml, showToast, canWrite: true, getPdfAssets: getIntakePdfAssets });
    if (!await root.selectRequirementProject(projectId)) return;
    closeModal();
    await navigateTo('requirements');
  } catch (_) {
    showToast('No se pudieron abrir los requisitos del proyecto.', 'error');
  }
};

async function loadProjects() {
  const { data: projects, error } = await db.projects.getAll();
  if (error) { showToast('Error al cargar proyectos', 'error'); return; }

  const grid = document.getElementById('projects-grid');
  if (!grid) return;

  const sm = { proposal: ['Propuesta', 'proposal'], in_development: ['En desarrollo', 'development'], review: ['En revisión', 'review'], completed: ['Completado', 'completed'], paused: ['Pausado', 'inactive'] };
  const canManageProjects = isButtonAllowed('btn-add-project');

  grid.innerHTML = (projects || []).map(p => {
    const [label, badge] = sm[p.status] || [p.status, ''];
    const techs = (p.technologies || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
    const fillCls = p.status === 'completed' ? 'progress-bar__fill--completed' : p.status === 'review' ? 'progress-bar__fill--review' : '';
    return `
      <div class="project-card" data-id="${p.id}">
        <div class="project-card__header">
          <div class="project-card__logo">${p.logo_url ? `<img src="${assetUrl(p.logo_url)}" alt="">` : `<i data-lucide="folder-kanban" style="width:20px;height:20px;"></i>`}</div>
          <span class="status-badge status-badge--${badge}">${label}</span>
        </div>
        <h3 class="project-card__title">${escapeHtml(p.name)}</h3>
        <p class="project-card__client">${escapeHtml(p.client_name || (p.clients && (p.clients.company || p.clients.name)) || '-')}</p>
        <div class="project-card__progress">
          <div class="project-card__progress-header"><span>Progreso</span><span>${p.progress}%</span></div>
          <div class="progress-bar"><div class="progress-bar__fill ${fillCls}" style="width:${p.progress}%;"></div></div>
        </div>
        <div class="project-card__meta">
          <span><i data-lucide="calendar" style="width:14px;height:14px;"></i> ${p.estimated_end_date ? formatDateShort(p.estimated_end_date) : 'Pendiente'}</span>
          <span><i data-lucide="users" style="width:14px;height:14px;"></i> ${p.member_count || 0}</span>
        </div>
        <div class="project-card__tags">${techs}</div>
        <div class="project-card__actions">
          ${isPageAllowed('requirements') ? `<button type="button" class="btn-dash btn-dash--secondary btn-dash--sm" onclick="openProjectRequirements('${p.id}')"><i data-lucide="list-checks" style="width:14px;height:14px;"></i> Levantamiento</button>` : ''}
          <button class="btn-dash btn-dash--secondary btn-dash--sm" title="Ver" onclick="viewProject('${p.id}')"><i data-lucide="eye" style="width:14px;height:14px;"></i></button>
          ${canManageProjects ? `<button class="btn-dash btn-dash--secondary btn-dash--sm" onclick="editProject('${p.id}')"><i data-lucide="pencil" style="width:14px;height:14px;"></i></button>
          <button class="btn-dash btn-dash--secondary btn-dash--sm" title="Portal cliente" onclick="manageProjectPortal('${p.id}')"><i data-lucide="link" style="width:14px;height:14px;"></i></button>
          <button class="btn-dash btn-dash--danger btn-dash--sm" onclick="deleteProject('${p.id}','${escapeHtml(p.name)}')"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button>` : ''}
        </div>
      </div>`;
  }).join('');

  if (typeof lucide !== "undefined") setTimeout(() => lucide.createIcons(), 50);

  // Kanban / Cards view toggle for Projects
  const allProjects = projects || [];
  const kanbanEl = document.getElementById('projects-kanban');
  const projGroups = {
    proposal: { title: 'Propuesta', color: '#888', items: [] },
    in_development: { title: 'En desarrollo', color: '#2e547d', items: [] },
    review: { title: 'En revisión', color: '#E65100', items: [] },
    completed: { title: 'Completado', color: '#668fbb', items: [] },
    paused: { title: 'Pausado', color: '#546e7a', items: [] }
  };
  allProjects.forEach(p => { if (projGroups[p.status]) projGroups[p.status].items.push(p); });
  if (kanbanEl) {
    kanbanEl.innerHTML = `<div class="kanban">` + Object.entries(projGroups).map(([status, g]) => `
      <div class="kanban__column" data-status="${status}">
        <div class="kanban__column-header">
          <span class="kanban__column-dot" style="background:${g.color};"></span>
          <h3>${g.title}</h3>
          <span class="kanban__column-count">${g.items.length}</span>
        </div>
        <div class="kanban__cards">
          ${g.items.map(p => `
            <div class="kanban__card" data-id="${p.id}">
              <div class="kanban__card-header">
                <span class="tag">${escapeHtml(p.client_name || (p.clients && p.clients.company) || '-')}</span>
              </div>
              <h4 class="kanban__card-title">${escapeHtml(p.name)}</h4>
              <div class="progress-bar" style="margin:6px 0;"><div class="progress-bar__fill" style="width:${p.progress || 0}%;"></div></div>
              <div class="kanban__card-footer">
                <span class="kanban__card-date">${p.estimated_end_date ? formatDateShort(p.estimated_end_date) : 'Sin fecha'}</span>
                <span>${p.progress || 0}%</span>
              </div>
              <div class="kanban__card-footer" style="margin-top:6px;">
                ${isPageAllowed('requirements') ? `<button type="button" class="btn-dash btn-dash--secondary btn-dash--sm" onclick="openProjectRequirements('${p.id}')">Levantamiento</button>` : ''}
                ${canManageProjects ? `<button class="table-action-btn" onclick="editProject('${p.id}')"><i data-lucide="pencil" style="width:13px;height:13px;"></i></button>` : ''}
                <button class="table-action-btn" onclick="viewProject('${p.id}')"><i data-lucide="eye" style="width:13px;height:13px;"></i></button>
              </div>
            </div>`).join('')}
        </div>
      </div>`).join('') + `</div>`;
    if (typeof lucide !== "undefined") setTimeout(() => lucide.createIcons(), 100);
  }

  const btnCards = document.getElementById('proj-view-cards');
  const btnKanban = document.getElementById('proj-view-kanban');
  if (btnCards && btnKanban && grid && kanbanEl) {
    const updateProjView = (view) => {
      const isKanban = view === 'kanban';
      btnCards.setAttribute('aria-pressed', String(!isKanban));
      btnKanban.setAttribute('aria-pressed', String(isKanban));
      if (view === 'kanban') {
        grid.style.display = 'none';
        kanbanEl.style.display = '';
        btnCards.classList.remove('view-toggle__btn--active');
        btnKanban.classList.add('view-toggle__btn--active');
      } else {
        grid.style.display = '';
        kanbanEl.style.display = 'none';
        btnCards.classList.add('view-toggle__btn--active');
        btnKanban.classList.remove('view-toggle__btn--active');
      }
    };
    if (!btnCards.dataset.bound) {
      btnCards.dataset.bound = 'true';
      btnCards.addEventListener('click', () => updateProjView('cards'));
      btnKanban.addEventListener('click', () => updateProjView('kanban'));
    }
    // default: cards active
    btnCards.classList.add('view-toggle__btn--active');
  }

  initAddProjectModal();
}

function initAddProjectModal() {
  const btn = document.getElementById('btn-add-project');
  if (!btn || btn.dataset.bound) return;
  btn.dataset.bound = 'true';
  btn.addEventListener('click', async () => {
    // load team members for selection
    const { data: members } = await db.team.getAll();
    openModal('Nuevo Proyecto', `
      <div class="modal-form__group"><label class="modal-form__label">Nombre</label><input type="text" class="modal-form__input" id="new-proj-name" placeholder="Nombre del proyecto"></div>
      ${renderEntitySearchPicker({
        rootId: 'new-proj-client-picker',
        type: 'client',
        label: 'Cliente / contacto',
        placeholder: 'Escribe un nombre o busca cliente registrado',
        helperText: 'Puedes escribir un nombre libre. Solo selecciona un cliente si quieres vincularlo a Relaciones.'
      })}
      <div class="modal-form__row">
        <div class="modal-form__group"><label class="modal-form__label">Inicio</label><input type="date" class="modal-form__input" id="new-proj-start"></div>
        <div class="modal-form__group"><label class="modal-form__label">Entrega estimada</label><input type="date" class="modal-form__input" id="new-proj-end"></div>
      </div>
      <div class="modal-form__group"><label class="modal-form__label">Tecnologías (coma)</label><input type="text" class="modal-form__input" id="new-proj-tech" placeholder="React, Node.js..."></div>
      <div class="modal-form__group"><label class="modal-form__label">Descripción</label><textarea class="modal-form__textarea" id="new-proj-desc"></textarea></div>
      <div class="modal-form__group"><label class="modal-form__label">Miembros</label>
        <div class="multiselect" id="new-proj-members">
          <button type="button" class="multiselect__toggle"><span class="multiselect__labels">Seleccionar miembros</span> <span class="multiselect__count">0</span></button>
          <div class="multiselect__dropdown" style="display:none;">
            <input type="text" class="multiselect__search" placeholder="Buscar...">
            <div class="multiselect__list">
              ${members.map(m => `<label class="multiselect__item"><input type="checkbox" value="${m.id}" data-name="${escapeHtml(m.full_name)}"> ${escapeHtml(m.full_name)}</label>`).join('')}
            </div>
            <div style="display:flex;gap:8px;padding:8px;border-top:1px solid var(--dash-border);">
              <button type="button" class="multiselect__select-all btn-dash btn-dash--secondary btn-dash--sm">Seleccionar todo</button>
              <button type="button" class="multiselect__clear btn-dash btn-dash--secondary btn-dash--sm">Limpiar</button>
            </div>
          </div>
        </div>
      </div>
    `, async () => {
      const name = document.getElementById('new-proj-name').value.trim();
      if (!name) { showToast('Nombre obligatorio', 'error'); return; }
      const clientId = document.getElementById('new-proj-client-picker-value')?.value || null;
      const clientName = document.getElementById('new-proj-client-picker-input')?.value.trim() || null;
      const tech = document.getElementById('new-proj-tech').value.trim();
      const payload = {
        name,
        client_id: clientId,
        client_name: clientName,
        start_date: document.getElementById('new-proj-start').value || null,
        estimated_end_date: document.getElementById('new-proj-end').value || null,
        technologies: tech ? tech.split(',').map(t => t.trim()).filter(Boolean) : [],
        description: document.getElementById('new-proj-desc').value.trim() || null,
        status: 'proposal',
        progress: 0
      };
      const { data, error } = await db.projects.create(payload);
      if (error) showToast('Error: ' + error.message, 'error');
      else {
        // attach selected members to project via project_members
        try {
          const container = document.getElementById('new-proj-members');
          if (container) {
            const checked = container.querySelectorAll('input[type="checkbox"]:checked');
            if (checked.length) {
              const inserts = Array.from(checked).map(o => ({ project_id: data.id, team_member_id: o.value }));
              await supabase.from('project_members').insert(inserts);
            }
          }
        } catch (pmErr) {
          console.warn('Error attaching project members:', pmErr);
        }
        // Auto-create "Proyecto creado" update in client portal
        await supabase.from('project_updates').insert({
          project_id: data.id,
          title: 'Proyecto creado',
          description: `El proyecto "${name}" ha sido creado y está en proceso de inicio.`,
          type: 'milestone',
          visible_to_client: true,
        });
        showToast(`Proyecto "${name}" creado`, 'success'); closeModal(); await loadProjects();
        if (document.getElementById('page-overview')) await loadOverview();
        db.activity.log({ user_name: currentProfile?.full_name, activity_type: 'project', description: 'creó nuevo proyecto', entity_name: name });
      }
    });
  });
  // initialize multiselect UI
  setTimeout(() => {
    try {
      initMemberMultiSelectById('new-proj-members');
      const wrap = document.getElementById('new-proj-members');
      if (wrap) {
        wrap.querySelector('.multiselect__select-all')?.addEventListener('click', () => { wrap.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = true; cb.dispatchEvent(new Event('change')); }); });
        wrap.querySelector('.multiselect__clear')?.addEventListener('click', () => { wrap.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = false; cb.dispatchEvent(new Event('change')); }); });
      }
    } catch (e) { /* noop */ }
  }, 50);
}

// ==========================================================================
// INVOICES (migrado a facturas_presii — funciones legacy eliminadas)
// ==========================================================================

async function viewInvoice(id) { showToast('Use la sección SII para ver facturas', 'info'); }
async function editInvoice(id) { showToast('Use la sección SII para editar facturas', 'info'); }

async function loadMaintenance() {
  const [
    { data: projects = [], error: projectsErr },
    { data: subscriptions = [], error: subscriptionsErr },
    { data: maintenanceBills = [], error: maintenanceBillsErr }
  ] = await Promise.all([
    db.projects.getAll(),
    supabase.from('maintenance_billing_plans')
      .select('id,project_id,plan_code,plan_name,amount,currency,customer_name,customer_rut,customer_email,customer_phone,status,billing_day,next_issue_date,created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    supabase.from('maintenance_bills')
      .select('id,billing_plan_id,status,due_at,period_start,amount')
      .order('due_at', { ascending: true })
  ]);
  if (projectsErr) {
    console.error('Error cargando facturación:', projectsErr);
    showToast('Error al cargar facturación', 'error');
    return;
  }
  if (subscriptionsErr) console.warn('No se pudieron cargar las suscripciones de Mercado Pago:', subscriptionsErr);
  if (maintenanceBillsErr) console.warn('No se pudieron cargar los cobros de mantención:', maintenanceBillsErr);

  const projectMap = Object.fromEntries((projects || []).map(p => [p.id, p]));
  const activePlans = (subscriptions || [])
    .filter(plan => String(plan.status || '').toLowerCase() === 'active');
  const activePlanIds = new Set(activePlans.map(plan => plan.id));
  const relevantBillByPlan = new Map();
  (maintenanceBills || []).forEach(bill => {
    const status = String(bill.status || '').toLowerCase();
    if (!activePlanIds.has(bill.billing_plan_id) || !['pending', 'overdue', 'payment_mismatch'].includes(status)) return;
    const current = relevantBillByPlan.get(bill.billing_plan_id);
    const billDate = String(bill.period_start || bill.due_at || '');
    const currentDate = String(current?.period_start || current?.due_at || '');
    if (!current || billDate > currentDate) relevantBillByPlan.set(bill.billing_plan_id, bill);
  });
  const activeBills = [...relevantBillByPlan.values()];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueBills = activeBills.filter(bill => String(bill.status || '').toLowerCase() === 'overdue' || (bill.due_at && parseDate(bill.due_at) < today));
  const upcomingPlans = activePlans.filter(plan => plan.next_issue_date && isDueSoon(plan.next_issue_date, 7));
  const monthlyActiveAmount = activePlans.reduce((sum, plan) => sum + (Number(plan.amount) || 0), 0);

  window._maintenanceProjectMap = projectMap;
  window._maintenanceProjects = projects || [];
  window._maintenanceSubscriptions = subscriptions || [];
  window._maintenanceBills = maintenanceBills || [];

  const setText = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
  setText('maintenance-kpi-active', activePlans.length);
  setText('maintenance-kpi-due', formatCurrency(monthlyActiveAmount));
  setText('maintenance-kpi-upcoming', upcomingPlans.length);
  setText('maintenance-kpi-overdue', overdueBills.length);

  const upcomingEl = document.getElementById('maintenance-upcoming-list');
  if (upcomingEl) {
    upcomingEl.querySelector('#maintenance-upcoming-placeholder').innerHTML = upcomingPlans.length > 0
      ? upcomingPlans.map(plan => {
          const projectName = escapeHtml(projectMap[plan.project_id]?.name || plan.customer_name || 'Sin proyecto');
          return `<div class="item" style="display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid rgba(0,0,0,0.06);"><div><strong>${escapeHtml(plan.plan_name || 'Mantención mensual')}</strong><br><small style="color:var(--dash-text-secondary);">${projectName} · Próxima factura programada</small></div><div style="text-align:right;min-width:110px;"><span style="font-weight:700;">${formatCurrency(plan.amount)}</span><br><small style="color:${isDueSoon(plan.next_issue_date, 3) ? '#d97706' : '#4b5563'};">${formatDateShort(plan.next_issue_date)}</small></div></div>`;
        }).join('')
      : '<p style="color:var(--dash-text-secondary);padding:1rem;">Sin facturas programadas para los próximos 7 días</p>';
  }

  renderManualMaintenancePlans(subscriptions || [], subscriptionsErr);
}


function getManualMaintenanceStatusMeta(plan) {
  const planStatus = String(plan.status || 'active').toLowerCase();
  if (planStatus === 'cancelled') return { label: 'Cancelada', badge: 'overdue' };
  if (planStatus === 'paused') return { label: 'Pausada', badge: 'inactive' };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextIssueDate = parseDate(plan.next_issue_date);
  if (nextIssueDate && nextIssueDate < today) return { label: 'Vencida', badge: 'overdue' };
  if (plan.next_issue_date && isDueSoon(plan.next_issue_date, 7)) return { label: 'Próxima a vencer', badge: 'upcoming' };
  return { label: 'Activa', badge: 'active' };
}

function renderManualMaintenancePlans(plans, loadError = null) {
  const tbody = document.getElementById('maintenance-subscriptions-tbody');
  if (!tbody) return;
  if (loadError) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#b45309;padding:1.5rem;">La facturación mensual aún no está instalada en Supabase.</td></tr>'; return; }
  if (!plans.length) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--dash-text-secondary);padding:1.5rem;">Todavía no hay mantenciones mensuales.</td></tr>'; return; }
  tbody.innerHTML = plans.map(plan => {
    const status = String(plan.status || 'active').toLowerCase();
    const state = getManualMaintenanceStatusMeta(plan);
    const actions = 'Solo consulta';
    return `<tr><td><strong>${escapeHtml(plan.customer_name || 'Sin nombre')}</strong><br><small>${escapeHtml(plan.customer_email || '')}</small></td><td>${escapeHtml(plan.plan_name || '-')}</td><td><strong>${formatCurrency(plan.amount || 0)}</strong></td><td><span class="status-badge status-badge--${state.badge}">${state.label}</span></td><td>${plan.next_issue_date ? formatDateShort(plan.next_issue_date) : '-'}</td><td>${escapeHtml(plan.customer_rut || '-')}</td><td><div class="table-actions">${actions}</div></td></tr>`;
  }).join('');
  if (typeof lucide !== 'undefined') setTimeout(() => lucide.createIcons(), 30);
}

function renderMaintenanceModalForm({ prefix, item = {}, projectLabel = '' }) {
  const projectPickerId = `${prefix}-maintenance-project-picker`;
  return `
      <div class="modal-form__group"><label class="modal-form__label">Número de factura / referencia</label><input type="text" class="modal-form__input" id="${prefix}-maintenance-invoice-number" placeholder="INV-2026-001" value="${escapeHtml(item.invoice_number || '')}"></div>
      <div class="modal-form__group"><label class="modal-form__label">Título</label><input type="text" class="modal-form__input" id="${prefix}-maintenance-title" value="${escapeHtml(item.title || '')}"></div>
      <div class="modal-form__row">
        <div class="modal-form__group"><label class="modal-form__label">Cliente</label><input type="text" class="modal-form__input" id="${prefix}-maintenance-customer-name" placeholder="Nombre del cliente" value="${escapeHtml(item.customer_name || '')}"></div>
        <div class="modal-form__group"><label class="modal-form__label">RUT cliente</label><input type="text" class="modal-form__input" id="${prefix}-maintenance-customer-rut" placeholder="RUT" value="${escapeHtml(item.customer_rut || '')}"></div>
      </div>
      ${renderEntitySearchPicker({
        rootId: projectPickerId,
        type: 'project',
        label: 'Proyecto asociado',
        placeholder: 'Buscar proyecto por nombre o cliente',
        selectedId: item.project_id || '',
        selectedLabel: projectLabel || '',
        helperText: 'Opcional. Puedes registrar el cobro solo con cliente libre, sin proyecto ni cliente en Relaciones.',
        onSelect: (record) => {
          const customerName = document.getElementById(`${prefix}-maintenance-customer-name`);
          const customerRut = document.getElementById(`${prefix}-maintenance-customer-rut`);
          if (customerName && !customerName.value) {
            customerName.value = record.client_name || record.client_company || record.client || '';
          }
          if (customerRut && !customerRut.value) {
            customerRut.value = record.client_rut || record.rut || '';
          }
        }
      })}
      <div class="modal-form__row">
        <div class="modal-form__group"><label class="modal-form__label">Tipo</label><select class="modal-form__select" id="${prefix}-maintenance-type"><option value="mantenimiento" ${item.type === 'mantenimiento' ? 'selected' : ''}>Mantenimiento</option><option value="suscripcion" ${item.type === 'suscripcion' ? 'selected' : ''}>Suscripción</option><option value="facturacion" ${item.type === 'facturacion' ? 'selected' : ''}>Facturación</option></select></div>
        <div class="modal-form__group"><label class="modal-form__label">Ciclo</label><select class="modal-form__select" id="${prefix}-maintenance-cycle"><option value="one_time" ${(!item.billing_cycle || item.billing_cycle === 'one_time') ? 'selected' : ''}>Único</option><option value="monthly" ${item.billing_cycle === 'monthly' ? 'selected' : ''}>Mensual</option><option value="quarterly" ${item.billing_cycle === 'quarterly' ? 'selected' : ''}>Trimestral</option><option value="annual" ${item.billing_cycle === 'annual' ? 'selected' : ''}>Anual</option></select></div>
      </div>
      <div class="modal-form__row">
        <div class="modal-form__group"><label class="modal-form__label">Estado</label><select class="modal-form__select" id="${prefix}-maintenance-status"><option value="pending" ${item.status === 'pending' || !item.status ? 'selected' : ''}>Pendiente</option><option value="paid" ${item.status === 'paid' ? 'selected' : ''}>Pagado</option><option value="overdue" ${item.status === 'overdue' ? 'selected' : ''}>Vencido</option></select></div>
        <div class="modal-form__group"><label class="modal-form__label">Condiciones de pago</label><input type="text" class="modal-form__input" id="${prefix}-maintenance-payment-terms" placeholder="30 días, contado, etc." value="${escapeHtml(item.payment_terms || '')}"></div>
      </div>
      <div class="modal-form__row"><div class="modal-form__group"><label class="modal-form__label">Monto</label><input type="number" class="modal-form__input" id="${prefix}-maintenance-amount" min="0" value="${item.amount != null ? Number(item.amount) : 0}"></div><div class="modal-form__group"><label class="modal-form__label">Fecha de vencimiento</label><input type="date" class="modal-form__input" id="${prefix}-maintenance-due" value="${item.due_date || ''}"></div></div>
      <div class="modal-form__row"><div class="modal-form__group"><label class="modal-form__label">Fecha de renovación</label><input type="date" class="modal-form__input" id="${prefix}-maintenance-renewal" value="${item.renewal_date || ''}"></div><div class="modal-form__group"></div></div>
      <div class="modal-form__group"><label class="modal-form__label">Notas</label><textarea class="modal-form__textarea" id="${prefix}-maintenance-notes" rows="3">${escapeHtml(item.notes || '')}</textarea></div>
  `;
}


window.editMaintenanceItem = async function editMaintenanceItem(id) {
  if (!isButtonAllowed('btn-add-mp-subscription')) return showToast('No tienes permiso para gestionar mantenimiento', 'warning');
  const { data: item, error } = await db.facturacion.getById(id);
  if (error || !item) {
    showToast('No se encontró el registro', 'error');
    return;
  }

  const projects = window._maintenanceProjects || [];
  const projectMap = window._maintenanceProjectMap || Object.fromEntries((projects || []).map(p => [p.id, p]));
  const projectLabel = projectMap[item.project_id]?.name || '';

  openModal('Editar registro de facturación', renderMaintenanceModalForm({ prefix: 'edit', item, projectLabel }), 'Guardar cambios', async () => {
    const invoiceNumber = document.getElementById('edit-maintenance-invoice-number')?.value.trim() || null;
    const title = document.getElementById('edit-maintenance-title')?.value.trim();
    const customerName = document.getElementById('edit-maintenance-customer-name')?.value.trim() || null;
    const customerRut = formatRutOrNull(document.getElementById('edit-maintenance-customer-rut')?.value);
    const projectId = document.getElementById('edit-maintenance-project-picker-value')?.value || null;
    const type = document.getElementById('edit-maintenance-type')?.value || 'mantenimiento';
    const cycle = document.getElementById('edit-maintenance-cycle')?.value || 'one_time';
    const status = document.getElementById('edit-maintenance-status')?.value || 'pending';
    const amount = Number(document.getElementById('edit-maintenance-amount')?.value || 0);
    const due_date = document.getElementById('edit-maintenance-due')?.value || null;
    const renewalDate = document.getElementById('edit-maintenance-renewal')?.value || null;
    const paymentTerms = document.getElementById('edit-maintenance-payment-terms')?.value.trim() || null;
    const notes = document.getElementById('edit-maintenance-notes')?.value.trim() || null;
    if (!title || !amount) { showToast('Completa título y monto', 'error'); return; }

    const { error: updateError } = await db.facturacion.update(id, {
      invoice_number: invoiceNumber,
      title,
      customer_name: customerName,
      customer_rut: customerRut,
      project_id: projectId,
      type,
      billing_cycle: cycle,
      payment_terms: paymentTerms,
      renewal_date: renewalDate || null,
      amount: Math.round(amount),
      due_date: due_date || null,
      status,
      notes
    });

    if (updateError) {
      showToast('Error actualizando registro: ' + updateError.message, 'error');
      return;
    }

    closeModal();
    await loadMaintenance();
    showToast('Registro actualizado', 'success');
  });
};

window.toggleMaintenancePaid = async function toggleMaintenancePaid(id) {
  if (!isButtonAllowed('btn-add-mp-subscription')) return showToast('No tienes permiso para gestionar mantenimiento', 'warning');
  const { data: item, error: itemErr } = await db.facturacion.getById(id);
  if (itemErr || !item) {
    showToast('No se encontró el registro', 'error');
    return;
  }
  const newStatus = item.status === 'paid' ? 'pending' : 'paid';
  const { error } = await db.facturacion.update(id, { status: newStatus });
  if (error) {
    showToast('Error actualizando estado: ' + error.message, 'error');
    return;
  }
  await loadMaintenance();
};

window.deleteMaintenanceItem = async function deleteMaintenanceItem(id) {
  if (!isButtonAllowed('btn-add-mp-subscription')) return showToast('No tienes permiso para gestionar mantenimiento', 'warning');
  const { error } = await db.facturacion.delete(id);
  if (error) {
    showToast('Error eliminando registro: ' + error.message, 'error');
    return;
  }
  await loadMaintenance();
};

window.deleteMaintenanceConfirm = function deleteMaintenanceConfirm(id) {
  if (!isButtonAllowed('btn-add-mp-subscription')) return showToast('No tienes permiso para gestionar mantenimiento', 'warning');
  openModal('Eliminar registro de facturación', '<p>¿Estás seguro de eliminar este registro? Esta acción no se puede deshacer.</p>', 'Eliminar', async () => {
    closeModal();
    await deleteMaintenanceItem(id);
  });
};

// ==========================================================================
// TASKS
// ==========================================================================
async function loadTasks() {
  const { data: tasks, error } = await db.tasks.getAll();
  if (error) { showToast('Error al cargar tareas', 'error'); return; }

  const list = document.getElementById('task-list');
  if (!list) return;
  const pm = { high: 'Alta', medium: 'Media', low: 'Baja' };
  const canManageTasks = isButtonAllowed('btn-add-task');

  list.innerHTML = (tasks || []).map(t => {
    const due = t.completed
      ? `<i data-lucide="check" style="width:12px;height:12px;color:#668fbb;"></i> Completado`
      : t.due_date ? `<i data-lucide="calendar" style="width:12px;height:12px;"></i> ${formatDateShort(t.due_date)}` : '';
    return `
      <div class="task-item" data-id="${t.id}">
        <input type="checkbox" class="task-item__check" ${t.completed ? 'checked' : ''} ${canManageTasks ? '' : 'disabled'} onchange="toggleTask('${t.id}',this.checked)">
        <div class="task-item__content ${t.completed ? 'task-item__content--done' : ''}">
          <span class="task-item__title">${escapeHtml(t.title)}</span>
          <div class="task-item__meta">
            ${t.category ? `<span class="tag">${escapeHtml(t.category)}</span>` : ''}
            <span class="task-item__due">${due}</span>
          </div>
        </div>
        ${!t.completed ? `<span class="kanban__card-priority kanban__card-priority--${t.priority}">${pm[t.priority] || t.priority}</span>` : ''}
        ${canManageTasks ? `<div class="task-item__actions">
          <button class="table-action-btn" title="Editar" onclick="editTask('${t.id}')">
            <i data-lucide="pencil" style="width:15px;height:15px;"></i>
          </button>
          <button class="table-action-btn table-action-btn--danger" title="Eliminar" onclick="deleteTask('${t.id}','${escapeHtml(t.title)}')">
            <i data-lucide="trash-2" style="width:15px;height:15px;"></i>
          </button>
        </div>` : ''}
      </div>`;
  }).join('');

  if (typeof lucide !== "undefined") setTimeout(() => lucide.createIcons(), 50);
  initAddTaskModal();

  // Calendar / List view toggle
  const btnList = document.getElementById('task-view-list');
  const btnCal = document.getElementById('task-view-cal');
  const listCard = document.getElementById('task-list-card');
  const calView = document.getElementById('task-calendar-view');

  if (btnList && btnCal && listCard && calView) {
    // Initialize calendar state on first load
    if (!window._taskCalState) window._taskCalState = { year: new Date().getFullYear(), month: new Date().getMonth() };

    const renderCalendar = (ts) => {
      const { year, month } = window._taskCalState;
      const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const monthEl = document.getElementById('task-cal-month');
      if (monthEl) monthEl.textContent = `${monthNames[month]} ${year}`;
      const grid = document.getElementById('task-cal-grid');
      if (!grid) return;
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const today = new Date();
      const dayLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const headers = dayLabels.map(d => `<div style="text-align:center;font-size:0.65rem;font-weight:600;text-transform:uppercase;letter-spacing:0.07em;color:var(--dash-text-muted);padding:4px 0;">${d}</div>`).join('');
      let cells = '';
      // empty prefix cells
      for (let i = 0; i < firstDay; i++) cells += `<div class="task-cal-day task-cal-day--other"></div>`;
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const isToday = (today.getFullYear() === year && today.getMonth() === month && today.getDate() === d);
        const dayTasks = (ts || []).filter(t => (t.due_date || '').startsWith(dateStr));
        const chips = dayTasks.map(t => {
          const cls = t.completed ? 'task-cal-chip--done' : `task-cal-chip--${t.priority || 'medium'}`;
          return `<span class="task-cal-chip ${cls}" onclick="editTask('${t.id}')" title="${escapeHtml(t.title)}">${escapeHtml(t.title)}</span>`;
        }).join('');
        cells += `<div class="task-cal-day${isToday ? ' task-cal-day--today' : ''}"><div class="task-cal-day__num">${d}</div>${chips}</div>`;
      }
      grid.innerHTML = headers + cells;
      grid.style.gridTemplateColumns = 'repeat(7,1fr)';
      if (typeof lucide !== "undefined") setTimeout(() => lucide.createIcons(), 50);
    };

    const switchView = (view) => {
      const isCalendar = view === 'cal';
      btnList.setAttribute('aria-pressed', String(!isCalendar));
      btnCal.setAttribute('aria-pressed', String(isCalendar));
      if (view === 'cal') {
        listCard.style.display = 'none';
        calView.style.display = '';
        btnList.classList.remove('view-toggle__btn--active');
        btnCal.classList.add('view-toggle__btn--active');
        renderCalendar(tasks);
      } else {
        calView.style.display = 'none';
        listCard.style.display = '';
        btnCal.classList.remove('view-toggle__btn--active');
        btnList.classList.add('view-toggle__btn--active');
      }
    };

    if (!btnList.dataset.bound) {
      btnList.dataset.bound = 'true';
      btnList.addEventListener('click', () => switchView('list'));
      btnCal.addEventListener('click', () => switchView('cal'));
      document.getElementById('task-cal-prev')?.addEventListener('click', () => {
        window._taskCalState.month--;
        if (window._taskCalState.month < 0) { window._taskCalState.month = 11; window._taskCalState.year--; }
        renderCalendar(tasks);
      });
      document.getElementById('task-cal-next')?.addEventListener('click', () => {
        window._taskCalState.month++;
        if (window._taskCalState.month > 11) { window._taskCalState.month = 0; window._taskCalState.year++; }
        renderCalendar(tasks);
      });
    }
    // keep list view default active
    btnList.classList.add('view-toggle__btn--active');
    btnCal.classList.remove('view-toggle__btn--active');
  }
}

async function toggleTask(id, completed) {
  if (!isButtonAllowed('btn-add-task')) return showToast('No tienes permiso para gestionar tareas', 'warning');
  const { data: task } = await db.tasks.getById(id);
  const { error } = await db.tasks.toggle(id, completed);
  if (error) showToast('Error al actualizar tarea', 'error');
  else {
    showToast(completed ? 'Tarea completada' : 'Tarea reabierta', 'success');
    await loadTasks();
    if (document.getElementById('page-overview')) await loadOverview();
    db.activity.log({ user_name: currentProfile?.full_name, activity_type: 'task', description: completed ? 'completó tarea' : 'reabrio tarea', entity_name: task?.title || '' });
  }
}

function initAddTaskModal() {
  const btn = document.getElementById('btn-add-task');
  if (!btn || btn.dataset.bound) return;
  btn.dataset.bound = 'true';
  btn.addEventListener('click', async () => {
    openModal('Nueva Tarea', `
      <div class="modal-form__group"><label class="modal-form__label">Título</label><input type="text" class="modal-form__input" id="new-task-title" placeholder="Descripción de la tarea"></div>
      <div class="modal-form__row">
        ${renderEntitySearchPicker({
          rootId: 'new-task-project-picker',
          type: 'project',
          label: 'Proyecto',
          placeholder: 'Buscar proyecto por nombre o cliente',
          helperText: 'Selecciona un proyecto existente para asociar la tarea.'
        })}
        <div class="modal-form__group"><label class="modal-form__label">Prioridad</label><select class="modal-form__select" id="new-task-priority"><option value="medium">Media</option><option value="high">Alta</option><option value="low">Baja</option></select></div>
      </div>
      <div class="modal-form__group"><label class="modal-form__label">Fecha límite</label><input type="date" class="modal-form__input" id="new-task-due"></div>
      <div class="modal-form__group"><label class="modal-form__label">Categoría</label><input type="text" class="modal-form__input" id="new-task-category" placeholder="Code Review, Deploy, Diseño..."></div>
    `, async () => {
      const title = document.getElementById('new-task-title').value.trim();
      if (!title) { showToast('Título obligatorio', 'error'); return; }
      const { error } = await db.tasks.create({
        title, project_id: document.getElementById('new-task-project-picker-value')?.value || null,
        priority: document.getElementById('new-task-priority').value,
        due_date: document.getElementById('new-task-due').value || null,
        category: document.getElementById('new-task-category').value.trim() || null
      });
      if (error) showToast('Error: ' + error.message, 'error');
      else {
        showToast('Tarea creada', 'success');
        closeModal();
        await loadTasks();
        if (document.getElementById('page-overview')) await loadOverview();
        db.activity.log({ user_name: currentProfile?.full_name, activity_type: 'task', description: 'creó nueva tarea', entity_name: title });
      }
    });
  });
}

async function editTask(id) {
  if (!isButtonAllowed('btn-add-task')) return showToast('No tienes permiso para gestionar tareas', 'warning');
  const { data: task, error } = await db.tasks.getById(id);
  if (error || !task) { showToast('Error al cargar tarea', 'error'); return; }

  const { data: projects } = await db.projects.getAll();
  const taskProject = (projects || []).find(p => p.id === task.project_id);

  openModal('Editar Tarea', `
    <div class="modal-form__group">
      <label class="modal-form__label">Título</label>
      <input type="text" class="modal-form__input" id="edit-task-title" value="${escapeHtml(task.title)}" placeholder="Descripción de la tarea">
    </div>
    <div class="modal-form__row">
      ${renderEntitySearchPicker({
        rootId: 'edit-task-project-picker',
        type: 'project',
        label: 'Proyecto',
        placeholder: 'Buscar proyecto por nombre o cliente',
        selectedId: task.project_id || '',
        selectedLabel: taskProject?.name || '',
        helperText: 'Selecciona un proyecto existente para reasignar la tarea.'
      })}
      <div class="modal-form__group">
        <label class="modal-form__label">Prioridad</label>
        <select class="modal-form__select" id="edit-task-priority">
          <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Baja</option>
          <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Media</option>
          <option value="high" ${task.priority === 'high' ? 'selected' : ''}>Alta</option>
        </select>
      </div>
    </div>
    <div class="modal-form__group">
      <label class="modal-form__label">Fecha límite</label>
      <input type="date" class="modal-form__input" id="edit-task-due" value="${task.due_date || ''}">
    </div>
    <div class="modal-form__group">
      <label class="modal-form__label">Categoría</label>
      <input type="text" class="modal-form__input" id="edit-task-category" value="${escapeHtml(task.category || '')}" placeholder="Code Review, Deploy, Diseño...">
    </div>
    <div class="modal-form__group">
      <label class="modal-form__label" style="display:flex;align-items:center;gap:8px;">
        <input type="checkbox" id="edit-task-completed" ${task.completed ? 'checked' : ''}>
        <span>Marcar como completada</span>
      </label>
    </div>
    <div class="task-comments" id="task-comments-section" style="margin-top:20px;border-top:1px solid var(--dash-border);padding-top:16px;">
      <div style="font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--dash-text-secondary);margin-bottom:12px;">Comentarios</div>
      <div id="task-comments-list" class="task-comments"></div>
      <div class="task-comment-input-wrap">
        <textarea class="task-comment-input" id="task-comment-input" rows="2" placeholder="Escribe un comentario..."></textarea>
        <button class="btn-dash btn-dash--primary btn-dash--sm" id="btn-add-task-comment" style="align-self:flex-end;">Enviar</button>
      </div>
    </div>
  `, 'Guardar Cambios', async () => {
    const title = document.getElementById('edit-task-title').value.trim();
    if (!title) { showToast('Título obligatorio', 'error'); return; }

    const { error } = await db.tasks.update(id, {
      title,
      project_id: document.getElementById('edit-task-project-picker-value')?.value || null,
      priority: document.getElementById('edit-task-priority').value,
      due_date: document.getElementById('edit-task-due').value || null,
      category: document.getElementById('edit-task-category').value.trim() || null,
      completed: document.getElementById('edit-task-completed').checked
    });

    if (error) showToast('Error: ' + error.message, 'error');
    else {
      showToast('Tarea actualizada', 'success');
      void auditLog('actualizó tarea', 'task', id, title);
      closeModal();
      await loadTasks();
      if (document.getElementById('page-overview')) await loadOverview();
    }
  });

  // Temporary task comments are scoped to the current tab; they may contain
  // internal information and must not persist in localStorage.
  setTimeout(() => {
    const commentsKey = `ntek_task_comments_${id}`;
    const commentsList = document.getElementById('task-comments-list');
    const commentInput = document.getElementById('task-comment-input');
    const addBtn = document.getElementById('btn-add-task-comment');
    if (!commentsList || !addBtn) return;
    try {
      const legacyComments = localStorage.getItem(commentsKey);
      if (legacyComments && !sessionStorage.getItem(commentsKey)) {
        sessionStorage.setItem(commentsKey, legacyComments);
      }
      localStorage.removeItem(commentsKey);
    } catch (_) {}
    const renderComments = () => {
      const comments = JSON.parse(sessionStorage.getItem(commentsKey) || '[]');
      if (comments.length === 0) {
        commentsList.innerHTML = '<p style="font-size:0.78rem;color:var(--dash-text-muted);">Sin comentarios aún.</p>';
        return;
      }
      commentsList.innerHTML = comments.map(c => `
        <div class="task-comment">
          <div class="task-comment__avatar">${(c.author || 'U').charAt(0).toUpperCase()}</div>
          <div class="task-comment__body">
            <div class="task-comment__meta"><strong>${escapeHtml(c.author || 'Usuario')}</strong> · ${c.time}</div>
            <div class="task-comment__text">${escapeHtml(c.text)}</div>
          </div>
        </div>`).join('');
    };
    renderComments();
    addBtn.addEventListener('click', () => {
      const text = commentInput.value.trim();
      if (!text) return;
      const comments = JSON.parse(sessionStorage.getItem(commentsKey) || '[]');
      comments.push({ text, author: window.currentProfile?.full_name || 'Usuario', time: new Date().toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' }) });
      sessionStorage.setItem(commentsKey, JSON.stringify(comments));
      commentInput.value = '';
      renderComments();
    });
    commentInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addBtn.click(); }
    });
  }, 80);
}

function deleteTask(id, title) {
  if (!isButtonAllowed('btn-add-task')) return showToast('No tienes permiso para gestionar tareas', 'warning');
  openModal('Eliminar Tarea', `<p>¿Estás seguro de eliminar la tarea <strong>${escapeHtml(title)}</strong>? Esta acción no se puede deshacer.</p>`, 'Eliminar', async () => {
    const { error } = await db.tasks.delete(id);
    if (error) { showToast('Error: ' + error.message, 'error'); return; }
    closeModal();
    showToast(`Tarea "${title}" eliminada`, 'success');
    await loadTasks();
    if (document.getElementById('page-overview')) await loadOverview();
    db.activity.log({ user_name: currentProfile?.full_name, activity_type: 'task', description: 'eliminó tarea', entity_name: title });
  });
}

// ==========================================================================
// ORDERS (Kanban)
// ==========================================================================
async function loadOrders() {
  const canManageOrders = isButtonAllowed('btn-add-order');
  const [
    { data: orders, error },
    { data: orderSubtasks = [], error: subtasksError }
  ] = await Promise.all([
    db.orders.getAll(),
    supabase.from('order_subtasks').select('id,order_id,completed')
  ]);
  if (error) { showToast('Error al cargar pedidos', 'error'); return; }
  if (subtasksError) console.warn('No se pudo cargar el resumen de subtareas:', subtasksError);
  window._ordersCache = orders || [];

  const subtasksByOrder = (orderSubtasks || []).reduce((groups, subtask) => {
    if (!groups[subtask.order_id]) groups[subtask.order_id] = [];
    groups[subtask.order_id].push(subtask);
    return groups;
  }, {});

  const groups = {
    pending: { title: 'Por hacer', color: '#888', items: [] },
    in_progress: { title: 'En progreso', color: '#2e547d', items: [] },
    review: { title: 'En revisión', color: '#E65100', items: [] },
    done: { title: 'Completado', color: '#668fbb', items: [] }
  };
  (orders || []).forEach(o => { if (groups[o.status]) groups[o.status].items.push(o); });

  const pm = { high: 'Alta', medium: 'Media', low: 'Baja' };
  const board = document.getElementById('kanban-board');
  if (!board) return;

  board.innerHTML = Object.entries(groups).map(([status, g]) => `
    <div class="kanban__column" data-status="${status}">
      <div class="kanban__column-header">
        <span class="kanban__column-dot" style="background:${g.color};"></span>
        <h3>${g.title}</h3>
        <span class="kanban__column-count">${g.items.length}</span>
      </div>
      <div class="kanban__cards">
        ${g.items.map(o => {
    const done = status === 'done';
    const av = o.team_members?.avatar_url;
    const assignee = o.team_members?.full_name || 'Sin asignar';
    const projectName = o.projects?.name || 'Sin proyecto';
    const subtasks = subtasksByOrder[o.id] || [];
    const completedSubtasks = subtasks.filter(subtask => subtask.completed).length;
    const subtaskLabel = subtasks.length
      ? `${completedSubtasks}/${subtasks.length} subtareas`
      : 'Sin subtareas';
    const dueDate = o.due_date ? parseDate(o.due_date) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateState = !done && dueDate && dueDate < today
      ? 'kanban__card-date--overdue'
      : !done && o.due_date && isDueSoon(o.due_date, 3)
        ? 'kanban__card-date--soon'
        : '';
    const moveOptions = Object.entries(groups)
      .filter(([s]) => s !== status)
      .map(([s, gr]) => `<button class="kanban-action-btn" onclick="moveOrder('${o.id}','${s}')"><span class="kanban__column-dot" style="background:${gr.color};width:8px;height:8px;display:inline-block;border-radius:50;margin-right:6px;"></span> ${gr.title}</button>`)
      .join('');
    return `
            <div class="kanban__card ${done ? 'kanban__card--done' : ''}" data-id="${o.id}" draggable="${canManageOrders}">
              <div class="kanban__card-header">
                <span class="tag">${escapeHtml(o.category || '')}</span>
                <div style="display:flex;align-items:center;gap:4px;">
                  ${!done ? `<span class="kanban__card-priority kanban__card-priority--${o.priority}">${pm[o.priority] || o.priority}</span>` : ''}
                  ${canManageOrders ? `<div class="kanban-menu" style="position:relative;">
                    <button class="table-action-btn" onclick="toggleKanbanMenu(this)" title="Acciones" style="padding:2px;"><i data-lucide="more-vertical" style="width:14px;height:14px;"></i></button>
                    <div class="kanban-menu__dropdown" style="display:none;position:fixed;background:var(--dash-bg);border:1px solid var(--dash-border);border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,0.15);z-index:1000;min-width:170px;padding:4px;">
                      <div style="padding:4px 10px;font-size:11px;font-weight:600;color:var(--dash-text-secondary);text-transform:uppercase;letter-spacing:0.5px;">Mover a</div>
                      ${moveOptions}
                      <div style="border-top:1px solid var(--dash-border);margin:4px 0;"></div>
                      <button class="kanban-action-btn" onclick="viewOrderSubtasks('${o.id}')"><i data-lucide="list" style="width:14px;height:14px;"></i> Subtareas</button>
                      <button class="kanban-action-btn" onclick="editOrder('${o.id}')"><i data-lucide="pencil" style="width:14px;height:14px;"></i> Editar</button>
                      <button class="kanban-action-btn kanban-action-btn--danger" onclick="deleteOrderConfirm('${o.id}')"><i data-lucide="trash-2" style="width:14px;height:14px;"></i> Eliminar</button>
                    </div>
                  </div>` : ''}
                </div>
              </div>
              <h4 class="kanban__card-title">${escapeHtml(o.title)}</h4>
              <div class="kanban__card-details">
                <span title="Proyecto"><i data-lucide="folder-kanban"></i>${escapeHtml(projectName)}</span>
                <span title="Responsable">${av ? `<img src="${escapeHtml(av)}" alt="" class="kanban__card-avatar">` : '<i data-lucide="user"></i>'}${escapeHtml(assignee)}</span>
                <span title="Subtareas"><i data-lucide="list-checks"></i>${subtaskLabel}</span>
              </div>
              <div class="kanban__card-footer">
                <span class="kanban__card-date ${dateState}">${done ? `<i data-lucide="check"></i> Completado` : o.due_date ? `<i data-lucide="calendar"></i> Vence ${formatDateShort(o.due_date)}` : '<i data-lucide="calendar-off"></i> Sin fecha límite'}</span>
              </div>
            </div>`;
  }).join('')}
      </div>
    </div>
  `).join('');

  if (typeof lucide !== "undefined") setTimeout(() => lucide.createIcons(), 50);

  // Cerrar menús al hacer clic fuera
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.kanban-menu')) {
      document.querySelectorAll('.kanban-menu__dropdown').forEach(d => d.style.display = 'none');
    }
  });

  initAddOrderModal();
}

// Funciones globales para kanban
window.toggleKanbanMenu = function (btn) {
  const dropdown = btn.nextElementSibling;
  const isOpen = dropdown.style.display !== 'none';
  document.querySelectorAll('.kanban-menu__dropdown').forEach(d => d.style.display = 'none');
  if (!isOpen) {
    const rect = btn.getBoundingClientRect();
    dropdown.style.top = (rect.bottom + 4) + 'px';
    dropdown.style.left = Math.max(8, rect.right - 170) + 'px';
    dropdown.style.display = 'block';
  }
}

window.moveOrder = async function (id, newStatus) {
  if (!isButtonAllowed('btn-add-order')) return showToast('No tienes permiso para gestionar tickets', 'warning');
  const statusLabels = { pending: 'Por hacer', in_progress: 'En progreso', review: 'En revisión', done: 'Completado' };
  const { error } = await db.orders.updateStatus(id, newStatus);
  if (error) showToast('Error: ' + error.message, 'error');
  else {
    showToast(`Ticket movido a "${statusLabels[newStatus]}"`, 'success');
    void auditLog(`cambió estado de ticket a ${statusLabels[newStatus]}`, 'order', id, 'Ticket');
    await loadOrders();
  }
}

window.editOrder = async function editOrder(id) {
  if (!isButtonAllowed('btn-add-order')) return showToast('No tienes permiso para gestionar tickets', 'warning');
  let order = (window._ordersCache || []).find(x => x.id === id);
  if (!order) {
    const { data } = await db.orders.getAll();
    window._ordersCache = data || [];
    order = (window._ordersCache || []).find(x => x.id === id);
  }
  if (!order) { showToast('Ticket no encontrado', 'error'); return; }

  const { data: members } = await db.team.getAll();
  const memberOptions = (members || []).map(m => `<option value="${m.id}" ${order.assigned_to === m.id ? 'selected' : ''}>${escapeHtml(m.full_name)}</option>`).join('');

  const { data: existingSubtasks } = await db.orderSubtasks.getByOrderId(id);
  const existingSubtasksHtml = (existingSubtasks || []).map(s => `
    <div class="modal-subtask">
      <div class="modal-subtask__left"><input type="checkbox" ${s.completed ? 'checked' : ''} disabled></div>
      <div class="modal-subtask__body">
        <div class="modal-subtask__title">${escapeHtml(s.title)}</div>
        <div class="modal-subtask__meta">${s.due_date ? formatDateShort(s.due_date) : ''}</div>
      </div>
    </div>
  `).join('') || '<div style="color:var(--dash-text-secondary);">No hay subtareas</div>';

  openModal('Editar Ticket', `
    <div class="modal-form__group"><label class="modal-form__label">Título</label><input type="text" class="modal-form__input" id="edit-order-title" value="${escapeHtml(order.title)}"></div>
    <div class="modal-form__group"><label class="modal-form__label">Descripción</label><textarea class="modal-form__textarea" id="edit-order-desc">${escapeHtml(order.description || '')}</textarea></div>
    ${renderEntitySearchPicker({
      rootId: 'edit-order-project-picker',
      type: 'project',
      label: 'Proyecto asociado (opcional)',
      placeholder: 'Buscar proyecto por nombre o cliente',
      selectedId: order.project_id || '',
      selectedLabel: order.projects?.name || '',
      helperText: 'Puedes asignar, cambiar o quitar el proyecto asociado al ticket.'
    })}
    <div class="modal-form__row">
      <div class="modal-form__group"><label class="modal-form__label">Categoría</label><select class="modal-form__select" id="edit-order-cat"><option ${order.category === 'Frontend' ? 'selected' : ''}>Frontend</option><option ${order.category === 'Backend' ? 'selected' : ''}>Backend</option><option ${order.category === 'Diseño' ? 'selected' : ''}>Diseño</option><option ${order.category === 'Mobile' ? 'selected' : ''}>Mobile</option><option ${order.category === 'DevOps' ? 'selected' : ''}>DevOps</option><option ${order.category === 'IA' ? 'selected' : ''}>IA</option><option ${order.category === 'Testing' ? 'selected' : ''}>Testing</option></select></div>
      <div class="modal-form__group"><label class="modal-form__label">Prioridad</label><select class="modal-form__select" id="edit-order-priority"><option value="low" ${order.priority === 'low' ? 'selected' : ''}>Baja</option><option value="medium" ${order.priority === 'medium' ? 'selected' : ''}>Media</option><option value="high" ${order.priority === 'high' ? 'selected' : ''}>Alta</option></select></div>
    </div>
    <div class="modal-form__row">
      <div class="modal-form__group"><label class="modal-form__label">Estado</label><select class="modal-form__select" id="edit-order-status"><option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Por hacer</option><option value="in_progress" ${order.status === 'in_progress' ? 'selected' : ''}>En progreso</option><option value="review" ${order.status === 'review' ? 'selected' : ''}>En revisión</option><option value="done" ${order.status === 'done' ? 'selected' : ''}>Completado</option></select></div>
      <div class="modal-form__group"><label class="modal-form__label">Asignar a</label><select class="modal-form__select" id="edit-order-assignee"><option value="">Sin asignar</option>${memberOptions}</select></div>
    </div>
    <div class="modal-form__group"><label class="modal-form__label">Fecha límite</label><input type="date" class="modal-form__input" id="edit-order-due" value="${order.due_date?.split('T')[0] || ''}"></div>
    <div class="modal-form__group" style="margin-top:8px;">
      <label class="modal-form__label">Subtareas</label>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;">
        <button id="btn-admin-subtasks" class="btn-dash btn-dash--secondary" type="button" onclick="viewOrderSubtasks('${order.id}')">Administrar subtareas (${(existingSubtasks || []).length})</button>
      </div>
      <div id="edit-order-subtasks" style="display:flex;flex-direction:column;gap:8px;">
        ${existingSubtasksHtml}
      </div>
    </div>
  `, async () => {
    const title = document.getElementById('edit-order-title').value.trim();
    if (!title) { showToast('Título obligatorio', 'error'); return; }
    const { error } = await db.orders.update(id, {
      title,
      description: document.getElementById('edit-order-desc').value.trim() || null,
      category: document.getElementById('edit-order-cat').value,
      priority: document.getElementById('edit-order-priority').value,
      status: document.getElementById('edit-order-status').value,
      assigned_to: document.getElementById('edit-order-assignee').value || null,
      project_id: document.getElementById('edit-order-project-picker-value')?.value || null,
      due_date: document.getElementById('edit-order-due').value || null
    });
    if (error) showToast('Error: ' + error.message, 'error');
    else {
      showToast('Ticket actualizado', 'success');
      void auditLog('actualizó ticket', 'order', id, title);
      closeModal();
      await loadOrders();
    }
  });
};

window.deleteOrderConfirm = function (id) {
  if (!isButtonAllowed('btn-add-order')) return showToast('No tienes permiso para gestionar tickets', 'warning');
  openModal('Eliminar Ticket', '<p>¿Estás seguro de eliminar este ticket? Esta acción no se puede deshacer.</p>', 'Eliminar', async () => {
    closeModal();
    await deleteOrder(id);
  });
}

async function deleteOrder(id) {
  if (!isButtonAllowed('btn-add-order')) return showToast('No tienes permiso para gestionar tickets', 'warning');
  try {
    // First remove any subtasks linked to this order to avoid FK constraint errors
    const { data: subtasks, error: subtErr } = await db.orderSubtasks.getByOrderId(id);
    if (subtErr) {
      showToast('Error comprobando subtareas: ' + subtErr.message, 'error');
      return;
    }
    if (subtasks && subtasks.length) {
      for (const s of subtasks) {
        const { error: de } = await db.orderSubtasks.delete(s.id);
        if (de) {
          showToast('Error eliminando subtarea: ' + de.message, 'error');
          return;
        }
      }
    }

    const { error } = await db.orders.delete(id);
    if (error) showToast('Error al eliminar: ' + error.message, 'error');
    else { showToast('Ticket eliminado', 'success'); await loadOrders(); db.activity.log({ user_name: currentProfile?.full_name, activity_type: 'order', description: 'eliminó ticket', entity_name: '' }); }
  } catch (err) {
    console.error('Error eliminando ticket y subtareas:', err);
    showToast('Error eliminando ticket', 'error');
  }
}

function initAddOrderModal() {
  const btn = document.getElementById('btn-add-order');
  if (!btn || btn.dataset.bound) return;
  btn.dataset.bound = 'true';
  btn.addEventListener('click', async () => {
    const { data: members } = await db.team.getAll();
    const mo = (members || []).map(m => `<option value="${m.id}">${escapeHtml(m.full_name)}</option>`).join('');
    openModal('Nuevo Ticket', `
      <div class="modal-form__group"><label class="modal-form__label">Título</label><input type="text" class="modal-form__input" id="new-order-title" placeholder="Nombre del ticket"></div>
      <div class="modal-form__group"><label class="modal-form__label">Descripción</label><textarea class="modal-form__textarea" id="new-order-desc"></textarea></div>
      ${renderEntitySearchPicker({
        rootId: 'new-order-project-picker',
        type: 'project',
        label: 'Proyecto asociado (opcional)',
        placeholder: 'Buscar proyecto por nombre o cliente',
        helperText: 'Déjalo vacío si el ticket no corresponde a un proyecto específico.'
      })}
      <div class="modal-form__group">
        <label class="modal-form__label">Subtareas</label>
        <div id="new-order-subtasks" style="display:flex;flex-direction:column;gap:8px;">
          <div style="display:flex;gap:8px;">
            <input type="text" class="modal-form__input" id="new-subtask-title-0" placeholder="Título subtarea">
            <input type="date" class="modal-form__input" id="new-subtask-due-0" style="width:150px;">
            <button type="button" class="btn-dash btn-dash--secondary" id="btn-new-subtask-add-0">Añadir</button>
          </div>
        </div>
      </div>
      <div class="modal-form__row">
        <div class="modal-form__group"><label class="modal-form__label">Categoría</label><select class="modal-form__select" id="new-order-cat"><option>Frontend</option><option>Backend</option><option>Diseño</option><option>Mobile</option><option>DevOps</option><option>IA</option><option>Testing</option></select></div>
        <div class="modal-form__group"><label class="modal-form__label">Prioridad</label><select class="modal-form__select" id="new-order-priority"><option value="medium">Media</option><option value="high">Alta</option><option value="low">Baja</option></select></div>
      </div>
      <div class="modal-form__group"><label class="modal-form__label">Asignar a</label><select class="modal-form__select" id="new-order-assignee"><option value="">Sin asignar</option>${mo}</select></div>
      <div class="modal-form__group"><label class="modal-form__label">Fecha límite</label><input type="date" class="modal-form__input" id="new-order-due"></div>
    `, async () => {
      const title = document.getElementById('new-order-title').value.trim();
      if (!title) { showToast('Título obligatorio', 'error'); return; }
      const { data: created, error } = await db.orders.create({
        title, description: document.getElementById('new-order-desc').value.trim() || null,
        category: document.getElementById('new-order-cat').value,
        priority: document.getElementById('new-order-priority').value,
        assigned_to: document.getElementById('new-order-assignee').value || null,
        project_id: document.getElementById('new-order-project-picker-value')?.value || null,
        due_date: document.getElementById('new-order-due').value || null, status: 'pending'
      });
      if (error) { showToast('Error: ' + error.message, 'error'); return; }

      // Create subtasks if any
      try {
        const container = document.getElementById('new-order-subtasks');
        if (container) {
          const inputs = Array.from(container.querySelectorAll('input')).filter(i => i.id && i.id.startsWith('new-subtask-title'));
          for (const inp of inputs) {
            const idx = inp.id.split('-').pop();
            const stTitle = inp.value.trim();
            const stDueEl = document.getElementById(`new-subtask-due-${idx}`);
            const stDue = stDueEl ? stDueEl.value || null : null;
            if (stTitle) {
              await db.orderSubtasks.create({ order_id: created.id, title: stTitle, due_date: stDue, completed: false });
            }
          }
        }
      } catch (err) {
        console.error('Error creando subtareas:', err);
      }

      showToast(`Ticket "${title}" creado`, 'success'); closeModal(); await loadOrders();
      db.activity.log({ user_name: currentProfile?.full_name, activity_type: 'order', description: 'creó nuevo ticket', entity_name: title });
    });
    // bind dynamic add button for subtasks
    (function bindSubtaskAdder() {
      const container = document.getElementById('new-order-subtasks');
      let counter = 1;
      container.addEventListener('click', (e) => {
        if (e.target && e.target.id && e.target.id.startsWith('btn-new-subtask-add')) {
          const idx = counter++;
          const row = document.createElement('div');
          row.style.display = 'flex'; row.style.gap = '8px';
          row.innerHTML = `<input type="text" class="modal-form__input" id="new-subtask-title-${idx}" placeholder="Título subtarea"><input type="date" class="modal-form__input" id="new-subtask-due-${idx}" style="width:150px;"><button type="button" class="btn-dash btn-dash--secondary" id="btn-new-subtask-add-${idx}">Añadir</button>`;
          container.appendChild(row);
        }
      });
    })();
  });
}

// ===================== Order Subtasks (modal + CRUD) =====================
async function viewOrderSubtasks(orderId) {
  const { data: orders } = await db.orders.getAll();
  const order = (orders || []).find(o => o.id === orderId);
  if (!order) { showToast('Ticket no encontrado', 'error'); return; }

  const { data: subtasks } = await db.orderSubtasks.getByOrderId(orderId);

  const tasksHtml = (subtasks || []).map(s => `
    <div class="subtask-item" data-id="${s.id}" style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--dash-border);">
      <div style="display:flex;align-items:center;gap:10px;min-width:0;flex:1;">
        <input type="checkbox" ${s.completed ? 'checked' : ''} onchange="toggleOrderSubtask('${s.id}','${orderId}', this.checked)">
        <div style="min-width:0;overflow:hidden;"><div style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(s.title)}</div><div style="font-size:12px;color:var(--dash-text-secondary);">${s.due_date ? formatDateShort(s.due_date) : ''}</div></div>
      </div>
      <div style="display:flex;gap:6px;margin-left:8px;">
        <button class="table-action-btn" title="Editar" onclick="editOrderSubtask('${s.id}','${orderId}')"><i data-lucide="pencil" style="width:14px;height:14px;"></i></button>
        <button class="table-action-btn table-action-btn--danger" title="Eliminar" onclick="deleteOrderSubtaskConfirm('${s.id}','${orderId}')"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button>
      </div>
    </div>
  `).join('') || '<div style="color:var(--dash-text-secondary);padding:12px;">No hay subtareas</div>';

  const content = `
    <div style="display:flex;flex-direction:column;gap:12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div><div style="font-weight:700;">${escapeHtml(order.title)}</div><div style="font-size:12px;color:var(--dash-text-secondary);">${escapeHtml(order.category || '')}</div></div>
        <div style="font-size:12px;color:var(--dash-text-secondary);">Prioridad: ${escapeHtml(order.priority || '')}</div>
      </div>
      <div id="order-subtasks-list">${tasksHtml}</div>
      <div style="display:flex;gap:8px;align-items:center;padding-top:6px;border-top:1px solid var(--dash-border);">
        <input id="new-subtask-title" class="modal-form__input" placeholder="Nueva subtarea..." style="flex:1;">
        <input id="new-subtask-due" type="date" class="modal-form__input" style="width:150px;">
        <button class="btn-dash btn-dash--primary" id="btn-add-subtask">Añadir</button>
      </div>
    </div>
  `;

  openModal(`Subtareas — ${escapeHtml(order.title)}`, content, null, null, true);
  if (typeof lucide !== "undefined") setTimeout(() => lucide.createIcons(), 50);

  // Bind add-subtask button inside manage modal
  const addBtn = document.getElementById('btn-add-subtask');
  if (addBtn) {
    addBtn.addEventListener('click', async () => {
      const titleEl = document.getElementById('new-subtask-title');
      const dueEl = document.getElementById('new-subtask-due');
      const title = titleEl?.value.trim();
      const due = dueEl?.value || null;
      if (!title) { showToast('Título de subtarea obligatorio', 'error'); return; }
      const { data, error } = await db.orderSubtasks.create({ order_id: orderId, title, due_date: due, completed: false });
      if (error) { showToast('Error creando subtarea: ' + error.message, 'error'); return; }
      showToast('Subtarea creada', 'success');
      if (titleEl) titleEl.value = '';
      if (dueEl) dueEl.value = '';
      const listEl = document.getElementById('order-subtasks-list');
      if (listEl) {
        const { data: updated } = await db.orderSubtasks.getByOrderId(orderId);
        listEl.innerHTML = (updated || []).map(s => `
          <div class="subtask-item" data-id="${s.id}" style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--dash-border);">
            <div style="display:flex;align-items:center;gap:10px;min-width:0;flex:1;">
              <input type="checkbox" ${s.completed ? 'checked' : ''} onchange="toggleOrderSubtask('${s.id}','${orderId}', this.checked)">
              <div style="min-width:0;overflow:hidden;"><div style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(s.title)}</div><div style="font-size:12px;color:var(--dash-text-secondary);">${s.due_date ? formatDateShort(s.due_date) : ''}</div></div>
            </div>
            <div style="display:flex;gap:6px;margin-left:8px;">
              <button class="table-action-btn" title="Editar" onclick="editOrderSubtask('${s.id}','${orderId}')"><i data-lucide="pencil" style="width:14px;height:14px;"></i></button>
              <button class="table-action-btn table-action-btn--danger" title="Eliminar" onclick="deleteOrderSubtaskConfirm('${s.id}','${orderId}')"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button>
            </div>
          </div>
        `).join(''); if (typeof lucide !== "undefined") setTimeout(() => lucide.createIcons(), 50);
      }
    });
  }
}

// Expose modal opener to global scope so inline `onclick` handlers work from HTML
window.viewOrderSubtasks = viewOrderSubtasks;

window.toggleOrderSubtask = async function (id, orderId, checked) {
  if (!isButtonAllowed('btn-add-order')) return showToast('No tienes permiso para gestionar tickets', 'warning');
  const { data, error } = await db.orderSubtasks.update(id, { completed: !!checked });
  if (error) showToast('Error actualizando subtarea', 'error');
  else {
    const listEl = document.getElementById('order-subtasks-list');
    if (listEl) {
      const { data: updated } = await db.orderSubtasks.getByOrderId(orderId);
      listEl.innerHTML = (updated || []).map(s => `
        <div class="subtask-item" data-id="${s.id}" style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--dash-border);">
          <div style="display:flex;align-items:center;gap:10px;min-width:0;flex:1;">
            <input type="checkbox" ${s.completed ? 'checked' : ''} onchange="toggleOrderSubtask('${s.id}','${orderId}', this.checked)">
            <div style="min-width:0;overflow:hidden;"><div style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(s.title)}</div><div style="font-size:12px;color:var(--dash-text-secondary);">${s.due_date ? formatDateShort(s.due_date) : ''}</div></div>
          </div>
          <div style="display:flex;gap:6px;margin-left:8px;">
            <button class="table-action-btn" title="Editar" onclick="editOrderSubtask('${s.id}','${orderId}')"><i data-lucide="pencil" style="width:14px;height:14px;"></i></button>
            <button class="table-action-btn table-action-btn--danger" title="Eliminar" onclick="deleteOrderSubtaskConfirm('${s.id}','${orderId}')"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button>
          </div>
        </div>
      `).join(''); if (typeof lucide !== "undefined") setTimeout(() => lucide.createIcons(), 50);
    }
  }
};

window.editOrderSubtask = async function (id, orderId) {
  if (!isButtonAllowed('btn-add-order')) return showToast('No tienes permiso para gestionar tickets', 'warning');
  const { data: s } = await supabase.from('order_subtasks').select('*').eq('id', id).single();
  if (!s) { showToast('Subtarea no encontrada', 'error'); return; }
  openModal('Editar Subtarea', `
    <div class="modal-form__group"><label class="modal-form__label">Título</label><input type="text" class="modal-form__input" id="edit-subtask-title" value="${escapeHtml(s.title)}"></div>
    <div class="modal-form__group"><label class="modal-form__label">Fecha límite</label><input type="date" class="modal-form__input" id="edit-subtask-due" value="${s.due_date ? s.due_date.split('T')[0] : ''}"></div>
  `, async () => {
    const title = document.getElementById('edit-subtask-title').value.trim();
    const due = document.getElementById('edit-subtask-due').value || null;
    if (!title) { showToast('Título obligatorio', 'error'); return; }
    const { data, error } = await db.orderSubtasks.update(id, { title, due_date: due });
    if (error) showToast('Error: ' + error.message, 'error');
    else {
      showToast('Subtarea actualizada', 'success'); closeModal(); const listEl = document.getElementById('order-subtasks-list'); if (listEl) {
        const { data: updated } = await db.orderSubtasks.getByOrderId(orderId); listEl.innerHTML = (updated || []).map(s => `
        <div class="subtask-item" data-id="${s.id}" style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--dash-border);">
          <div style="display:flex;align-items:center;gap:10px;min-width:0;flex:1;">
            <input type="checkbox" ${s.completed ? 'checked' : ''} onchange="toggleOrderSubtask('${s.id}','${orderId}', this.checked)">
            <div style="min-width:0;overflow:hidden;"><div style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(s.title)}</div><div style="font-size:12px;color:var(--dash-text-secondary);">${s.due_date ? formatDateShort(s.due_date) : ''}</div></div>
          </div>
          <div style="display:flex;gap:6px;margin-left:8px;">
            <button class="table-action-btn" title="Editar" onclick="editOrderSubtask('${s.id}','${orderId}')"><i data-lucide="pencil" style="width:14px;height:14px;"></i></button>
            <button class="table-action-btn table-action-btn--danger" title="Eliminar" onclick="deleteOrderSubtaskConfirm('${s.id}','${orderId}')"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button>
          </div>
        </div>
      `).join(''); if (typeof lucide !== "undefined") setTimeout(() => lucide.createIcons(), 50);
      }
    }
  });
};

window.deleteOrderSubtaskConfirm = function (id, orderId) {
  if (!isButtonAllowed('btn-add-order')) return showToast('No tienes permiso para gestionar tickets', 'warning');
  openModal('Eliminar Subtarea', '<p>¿Estás seguro de eliminar esta subtarea? Esta acción no se puede deshacer.</p>', 'Eliminar', async () => {
    closeModal();
    await deleteOrderSubtask(id, orderId);
  });
};

async function deleteOrderSubtask(id, orderId) {
  if (!isButtonAllowed('btn-add-order')) return showToast('No tienes permiso para gestionar tickets', 'warning');
  const { error } = await db.orderSubtasks.delete(id);
  if (error) showToast('Error eliminando subtarea', 'error');
  else {
    showToast('Subtarea eliminada', 'success'); const listEl = document.getElementById('order-subtasks-list'); if (listEl) {
      const { data: updated } = await db.orderSubtasks.getByOrderId(orderId); listEl.innerHTML = (updated || []).map(s => `
        <div class="subtask-item" data-id="${s.id}" style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--dash-border);">
          <div style="display:flex;align-items:center;gap:10px;min-width:0;flex:1;">
            <input type="checkbox" ${s.completed ? 'checked' : ''} onchange="toggleOrderSubtask('${s.id}','${orderId}', this.checked)">
            <div style="min-width:0;overflow:hidden;"><div style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(s.title)}</div><div style="font-size:12px;color:var(--dash-text-secondary);">${s.due_date ? formatDateShort(s.due_date) : ''}</div></div>
          </div>
          <div style="display:flex;gap:6px;margin-left:8px;">
            <button class="table-action-btn" title="Editar" onclick="editOrderSubtask('${s.id}','${orderId}')"><i data-lucide="pencil" style="width:14px;height:14px;"></i></button>
            <button class="table-action-btn table-action-btn--danger" title="Eliminar" onclick="deleteOrderSubtaskConfirm('${s.id}','${orderId}')"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button>
          </div>
        </div>
      `).join(''); if (typeof lucide !== "undefined") setTimeout(() => lucide.createIcons(), 50);
    }
  }
}

// ==========================================================================
// CALENDAR
// ==========================================================================
async function loadCalendar() {
  const monthEl = document.getElementById('cal-month');
  const gridEl = document.getElementById('cal-grid');
  const prevBtn = document.getElementById('cal-prev');
  const nextBtn = document.getElementById('cal-next');
  const eventsList = document.getElementById('cal-events');
  const canManageEvents = isButtonAllowed('btn-add-event');
  if (!gridEl) return;
  if (!window._calDate) window._calDate = new Date();
  const cd = window._calDate;

  async function render() {
    const y = cd.getFullYear(), m = cd.getMonth();
    const mn = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    monthEl.textContent = `${mn[m]} ${y}`;
    const { data: me } = await db.events.getByMonth(y, m);
    const evDays = new Set((me || []).map(e => parseInt(e.event_date.split('-')[2])));
    const fd = new Date(y, m, 1), ld = new Date(y, m + 1, 0);
    const sd = (fd.getDay() + 6) % 7, dim = ld.getDate(), dipm = new Date(y, m, 0).getDate();
    const today = new Date();
    gridEl.innerHTML = '';
    for (let i = sd - 1; i >= 0; i--) { const d = document.createElement('button'); d.className = 'cal-day cal-day--other'; d.textContent = dipm - i; gridEl.appendChild(d); }
    for (let d = 1; d <= dim; d++) {
      const btn = document.createElement('button'); btn.className = 'cal-day'; btn.textContent = d;
      if (d === today.getDate() && m === today.getMonth() && y === today.getFullYear()) btn.classList.add('cal-day--today');
      if (evDays.has(d)) btn.classList.add('cal-day--event');
      btn.addEventListener('click', () => {
        window._calSelectedDate = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        loadDayEvents(window._calSelectedDate);
      });
      gridEl.appendChild(btn);
    }
    const rem = 42 - gridEl.children.length;
    for (let i = 1; i <= rem; i++) { const d = document.createElement('button'); d.className = 'cal-day cal-day--other'; d.textContent = i; gridEl.appendChild(d); }
    const tStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const monthPrefix = `${y}-${String(m + 1).padStart(2, '0')}-`;
    const selectedDate = window._calSelectedDate?.startsWith(monthPrefix)
      ? window._calSelectedDate
      : (tStr.startsWith(monthPrefix) ? tStr : `${monthPrefix}01`);
    await loadDayEvents(selectedDate);
  }

  async function loadDayEvents(dateStr) {
    if (!eventsList) return;
    const { data: events } = await db.events.getByDate(dateStr);
    if (!events || !events.length) { eventsList.innerHTML = '<p style="color:#888;padding:12px;">Sin eventos</p>'; return; }
    const tc = { meeting: 'meeting', deadline: 'deadline', demo: 'demo', kickoff: 'kickoff', other: 'meeting' };
    eventsList.innerHTML = events.map(e => `
      <div class="cal-event cal-event--${e.blocks_bookings ? 'blocked' : (tc[e.event_type] || 'meeting')}">
        <div class="cal-event__time">${e.blocks_bookings ? 'Todo el día' : `${e.start_time ? e.start_time.slice(0, 5) : ''}${e.end_time ? ' - ' + e.end_time.slice(0, 5) : ''}`}</div>
        <div class="cal-event__content">
          <h4>${e.blocks_bookings ? '<i data-lucide="calendar-off" style="width:13px;height:13px;"></i> ' : ''}${escapeHtml(e.title)}</h4>
          <p>${escapeHtml(e.description || '')}</p>
          ${getEventRecurrenceLabel(e) ? `<span class="event-recurrence-badge"><i data-lucide="repeat-2"></i> ${escapeHtml(getEventRecurrenceLabel(e))}</span>` : ''}
          ${e.meet_link ? `<a href="${escapeHtml(e.meet_link)}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:4px;font-size:0.78rem;color:var(--dash-primary);text-decoration:none;margin-top:4px;"><i data-lucide="video" style="width:11px;height:11px;"></i> Solven Labs Meet</a>` : ''}
        </div>
        <div class="cal-event__actions" style="flex-direction:column;align-items:flex-start;gap:6px;">
          <div style="font-size:0.68rem;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--dash-text-secondary);">Acciones</div>
          <div style="display:flex;gap:4px;">
            <button class="table-action-btn" title="Ver" onclick="viewEvent('${e.id}')">
              <i data-lucide="eye" style="width:14px;height:14px;"></i>
            </button>
            ${!canManageEvents || e.blocks_bookings || e.created_by !== currentProfile?.id ? '' : `<button class="table-action-btn" title="Editar" onclick="editEvent('${e.id}')">
              <i data-lucide="pencil" style="width:14px;height:14px;"></i>
            </button>`}
            ${((e.blocks_bookings || e.created_by == null) ? !isAdministrativeRole(getCurrentRole()) : (!canManageEvents || e.created_by !== currentProfile?.id)) ? '' : `<button class="table-action-btn table-action-btn--danger" title="Eliminar" onclick="deleteEvent('${e.id}','${escapeHtml(e.title)}')">
              <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
            </button>`}
          </div>
        </div>
      </div>
    `).join('');
    if (typeof lucide !== "undefined") setTimeout(() => lucide.createIcons(), 50);
  }

  if (prevBtn && !prevBtn.dataset.bound) { prevBtn.dataset.bound = 'true'; prevBtn.addEventListener('click', () => { cd.setMonth(cd.getMonth() - 1); render(); }); }
  if (nextBtn && !nextBtn.dataset.bound) { nextBtn.dataset.bound = 'true'; nextBtn.addEventListener('click', () => { cd.setMonth(cd.getMonth() + 1); render(); }); }
  await render();
  initAddEventModal();
  initAddBlockModal();
}

function initAddBlockModal() {
  const btn = document.getElementById('btn-add-block');
  if (!btn || btn.dataset.bound || !isAdministrativeRole(getCurrentRole())) return;
  btn.dataset.bound = 'true';
  btn.addEventListener('click', () => {
    if (!isAdministrativeRole(getCurrentRole())) return showToast('Esta acción es exclusiva de administración', 'warning');
    const today = getLocalDateKey(new Date());
    openModal('Inhabilitar día', `
      <p class="calendar-block-help">El día completo dejará de aparecer disponible tanto para visitas técnicas como para conversaciones iniciales.</p>
      <p class="calendar-block-warning"><strong>Importante:</strong> se eliminarán todos los eventos de la fecha y se cancelarán las reservas vinculadas. Esta acción no procesa reembolsos ni envía avisos de cancelación.</p>
      <div class="modal-form__group"><label class="modal-form__label">Motivo</label><input type="text" class="modal-form__input" id="new-block-title" value="Día sin atención" maxlength="120" placeholder="Ej: Feriado o cierre interno"></div>
      <div class="modal-form__group"><label class="modal-form__label">Fecha</label><input type="date" class="modal-form__input" id="new-block-date" value="${today}" min="${today}"></div>
      <div class="modal-form__group"><label class="modal-form__label">Nota (opcional)</label><textarea class="modal-form__textarea" id="new-block-desc" placeholder="Detalle interno del día sin atención"></textarea></div>
    `, 'Inhabilitar día', async () => {
      const title = document.getElementById('new-block-title').value.trim() || 'Día sin atención';
      const eventDate = document.getElementById('new-block-date').value;
      if (!eventDate) {
        showToast('Selecciona la fecha que deseas inhabilitar', 'error');
        return;
      }
      const { data, error } = await db.events.createBlock({
        title,
        description: document.getElementById('new-block-desc').value.trim() || null,
        event_date: eventDate,
        start_time: '00:00:00',
        end_time: '23:59:59'
      });
      if (error) {
        showToast(error.message || 'No se pudo bloquear el horario', 'error');
        return;
      }
      const affected = Number(data?.events_deleted || 0);
      showToast(affected
        ? `Día ${eventDate} inhabilitado · ${affected} evento${affected === 1 ? '' : 's'} anulado${affected === 1 ? '' : 's'}`
        : `Día ${eventDate} inhabilitado`, 'success');
      closeModal();
      window._calSelectedDate = eventDate;
      if (!window._calDate) window._calDate = new Date(`${eventDate}T12:00:00`);
      else window._calDate.setTime(new Date(`${eventDate}T12:00:00`).getTime());
      await loadCalendar();
    });
  });
}

const CALENDAR_WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const CALENDAR_MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function parseCalendarDateKey(value) {
  const [year, month, day] = String(value || '').split('-').map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day, 12);
  return Number.isNaN(date.getTime()) ? null : date;
}

function calendarDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function addCalendarYears(dateKey, years) {
  const date = parseCalendarDateKey(dateKey);
  if (!date) return '';
  const originalMonth = date.getMonth();
  date.setFullYear(date.getFullYear() + years);
  if (date.getMonth() !== originalMonth) date.setDate(0);
  return calendarDateKey(date);
}

function getMonthlyWeekLabel(date) {
  const position = Math.ceil(date.getDate() / 7);
  const positions = ['primer', 'segundo', 'tercer', 'cuarto', 'quinto'];
  return `${positions[position - 1]} ${CALENDAR_WEEKDAYS[date.getDay()]}`;
}

function updateEventRecurrenceLabels() {
  const dateInput = document.getElementById('new-event-date');
  const repeatSelect = document.getElementById('new-event-repeat');
  if (!dateInput || !repeatSelect) return;
  const date = parseCalendarDateKey(dateInput.value);
  if (!date) return;
  const labels = {
    weekly: `Cada semana, el ${CALENDAR_WEEKDAYS[date.getDay()]}`,
    monthly_weekday: `Todos los meses, el ${getMonthlyWeekLabel(date)}`,
    yearly: `Anualmente, el ${date.getDate()} de ${CALENDAR_MONTHS[date.getMonth()]}`
  };
  Object.entries(labels).forEach(([value, label]) => {
    const option = repeatSelect.querySelector(`option[value="${value}"]`);
    if (option) option.textContent = label;
  });
}

function updateEventRecurrenceControls() {
  const repeatSelect = document.getElementById('new-event-repeat');
  const endWrap = document.getElementById('new-event-repeat-end-wrap');
  const customWrap = document.getElementById('new-event-repeat-custom');
  const weeklyWrap = document.getElementById('new-event-repeat-weekdays');
  const frequency = document.getElementById('new-event-repeat-frequency');
  if (!repeatSelect) return;
  const repeats = repeatSelect.value !== 'none';
  if (endWrap) endWrap.hidden = !repeats;
  if (customWrap) customWrap.hidden = repeatSelect.value !== 'custom';
  if (weeklyWrap) weeklyWrap.hidden = repeatSelect.value !== 'custom' || frequency?.value !== 'weekly';
}

function initEventRecurrenceControls() {
  const dateInput = document.getElementById('new-event-date');
  const repeatSelect = document.getElementById('new-event-repeat');
  const untilInput = document.getElementById('new-event-repeat-until');
  const frequency = document.getElementById('new-event-repeat-frequency');
  if (!dateInput || !repeatSelect || !untilInput) return;
  const syncDate = () => {
    updateEventRecurrenceLabels();
    untilInput.min = dateInput.value;
    if (!untilInput.value || untilInput.value < dateInput.value) untilInput.value = addCalendarYears(dateInput.value, 1);
    const startDate = parseCalendarDateKey(dateInput.value);
    const weekdayInputs = document.querySelectorAll('[name="new-event-repeat-weekday"]');
    if (!document.querySelector('[name="new-event-repeat-weekday"]:checked')) {
      weekdayInputs.forEach(input => { input.checked = Number(input.value) === startDate?.getDay(); });
    }
  };
  dateInput.addEventListener('change', syncDate);
  repeatSelect.addEventListener('change', updateEventRecurrenceControls);
  frequency?.addEventListener('change', updateEventRecurrenceControls);
  syncDate();
  updateEventRecurrenceControls();
}

function getEventRecurrenceRule() {
  const repeat = document.getElementById('new-event-repeat')?.value || 'none';
  if (repeat === 'none') return null;
  if (repeat !== 'custom') return { frequency: repeat, interval: 1 };
  const frequency = document.getElementById('new-event-repeat-frequency')?.value || 'weekly';
  const interval = Math.max(1, Math.min(99, Number(document.getElementById('new-event-repeat-interval')?.value) || 1));
  const weekdays = frequency === 'weekly'
    ? Array.from(document.querySelectorAll('[name="new-event-repeat-weekday"]:checked')).map(input => Number(input.value))
    : [];
  return { frequency, interval, weekdays };
}

function buildRecurringEventDates(startKey, untilKey, rule) {
  if (!rule) return [startKey];
  const start = parseCalendarDateKey(startKey);
  const until = parseCalendarDateKey(untilKey);
  if (!start || !until || until < start) throw new Error('La fecha de término de la repetición no es válida.');
  if (rule.frequency === 'weekly' && Array.isArray(rule.weekdays) && !rule.weekdays.length) throw new Error('Selecciona al menos un día de la semana.');

  const dates = [];
  const startDay = start.getDate();
  const startMonth = start.getMonth();
  const startWeekday = start.getDay();
  const startWeekPosition = Math.ceil(startDay / 7);
  const startWeekAnchor = new Date(start);
  startWeekAnchor.setDate(startWeekAnchor.getDate() - ((startWeekday + 6) % 7));
  const interval = Math.max(1, Number(rule.interval) || 1);
  const cursor = new Date(start);
  while (cursor <= until) {
    const diffDays = Math.round((cursor - start) / 86400000);
    const diffMonths = (cursor.getFullYear() - start.getFullYear()) * 12 + cursor.getMonth() - startMonth;
    let matches = diffDays === 0;
    switch (rule.frequency) {
      case 'daily': matches = diffDays % interval === 0; break;
      case 'weekdays': matches = cursor.getDay() >= 1 && cursor.getDay() <= 5; break;
      case 'weekly': {
        const selectedDays = rule.weekdays?.length ? rule.weekdays : [startWeekday];
        const cursorWeekAnchor = new Date(cursor);
        cursorWeekAnchor.setDate(cursorWeekAnchor.getDate() - ((cursor.getDay() + 6) % 7));
        const diffWeeks = Math.round((cursorWeekAnchor - startWeekAnchor) / 604800000);
        matches = diffWeeks % interval === 0 && selectedDays.includes(cursor.getDay());
        break;
      }
      case 'monthly_weekday':
        matches = diffMonths % interval === 0 && cursor.getDay() === startWeekday && Math.ceil(cursor.getDate() / 7) === startWeekPosition;
        break;
      case 'monthly': matches = diffMonths % interval === 0 && cursor.getDate() === startDay; break;
      case 'yearly': matches = (cursor.getFullYear() - start.getFullYear()) % interval === 0 && cursor.getMonth() === startMonth && cursor.getDate() === startDay; break;
    }
    if (matches) dates.push(calendarDateKey(cursor));
    if (dates.length > 500) throw new Error('La serie supera 500 eventos. Usa una fecha de término más cercana.');
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

function createRecurrenceGroupId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
    const value = Math.random() * 16 | 0;
    return (char === 'x' ? value : (value & 3 | 8)).toString(16);
  });
}

function getEventRecurrenceLabel(event) {
  const rule = event?.recurrence_rule;
  if (!rule) return '';
  const interval = Math.max(1, Number(rule.interval) || 1);
  const labels = {
    daily: interval === 1 ? 'Todos los días' : `Cada ${interval} días`,
    weekdays: 'Todos los días hábiles',
    weekly: interval === 1 ? 'Semanalmente' : `Cada ${interval} semanas`,
    monthly_weekday: interval === 1 ? 'Mensualmente' : `Cada ${interval} meses`,
    monthly: interval === 1 ? 'Mensualmente' : `Cada ${interval} meses`,
    yearly: interval === 1 ? 'Anualmente' : `Cada ${interval} años`
  };
  return labels[rule.frequency] || '';
}

function createNtekMeetUrl() {
  const token = globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : Array.from(globalThis.crypto.getRandomValues(new Uint8Array(24)), byte => byte.toString(16).padStart(2, '0')).join('');
  return `https://meet.jit.si/ntek-${token}`;
}

function calendarInviteError(error) {
  const code = error?.calendarCode || error?.context?.body?.error || error?.message || '';
  if (/failed to send a request|functionsfetcherror|fetch failed/i.test(String(code))) {
    return 'No se pudo conectar con el servicio de invitaciones. Actualiza la página y, si continúa, verifica el despliegue de Calendar.';
  }
  const messages = {
    invalid_session: 'Tu sesión expiró. Vuelve a iniciar sesión.',
    request_already_processing: 'El envío sigue en proceso. Espera antes de reintentar.',
    request_requires_review: 'Este envío anterior quedó incompleto. Revisa el evento antes de volver a intentarlo.',
    organizer_cannot_change: 'Las actualizaciones deben enviarse desde la casilla organizadora original.',
    invalid_attendees: 'Revisa los correos de los invitados (máximo 50).',
    invalid_series: 'La serie con invitados debe contener entre 1 y 100 eventos válidos.',
    invalid_event_time: 'La fecha u horario del evento no es válido.',
    mailbox_not_available: 'Selecciona una casilla activa de Solven Labs Mail.',
    mail_delivery_failed: 'No se completó la notificación. Reintenta desde este mismo formulario para continuar el envío sin duplicar el evento.',
    event_not_found: 'Solo el organizador puede modificar o cancelar este evento.',
    calendar_not_configured: 'Falta configurar la integración de Calendario en Supabase.'
  };
  return messages[code] || `No se pudo procesar la invitación${code ? `: ${code}` : ''}`;
}

async function invokeCalendarInvitations(payload) {
  try {
    const session = await getSession();
    if (!session?.access_token) return { error: { calendarCode: 'invalid_session' } };
    const { data, error } = await supabase.functions.invoke('calendar-invitations', {
      body: payload, headers: { Authorization: `Bearer ${session.access_token}` }
    });
    if (error?.context instanceof Response) {
      try {
        const body = await error.context.clone().json();
        error.calendarCode = body?.error || '';
        error.calendarDetails = body?.details || '';
      } catch (_) {}
    }
    return { data, error: error || (data?.error ? { calendarCode: data.error } : null) };
  } catch (error) { return { error }; }
}

function calendarGuestEditor(prefix, attendees = []) {
  return `
    <div class="modal-form__group calendar-guests" data-calendar-guests="${prefix}">
      <label class="modal-form__label">Invitados</label>
      <div class="calendar-guests__entry">
        <input type="email" class="modal-form__input" id="${prefix}-guest-email" maxlength="254" placeholder="correo@ejemplo.com" autocomplete="email">
        <button type="button" class="btn-dash btn-dash--secondary" id="${prefix}-guest-add"><i data-lucide="plus"></i> Añadir</button>
      </div>
      <div class="calendar-guests__chips" id="${prefix}-guest-list">
        ${attendees.map(item => `<span class="calendar-guest-chip" data-email="${escapeHtml(item.email)}" data-name="${escapeHtml(item.name || '')}"><span>${escapeHtml(item.name ? `${item.name} <${item.email}>` : item.email)}</span>${item.status && item.status !== 'pending' ? `<small>${escapeHtml(item.status)}</small>` : ''}<button type="button" aria-label="Quitar ${escapeHtml(item.email)}"><i data-lucide="x"></i></button></span>`).join('')}
      </div>
      <small class="event-recurrence-help">Hasta 50 correos. Las invitaciones se envían mediante Solven Labs Mail.</small>
    </div>`;
}

function bindCalendarGuestEditor(prefix) {
  const input = document.getElementById(`${prefix}-guest-email`);
  const list = document.getElementById(`${prefix}-guest-list`);
  const add = () => {
    const email = String(input?.value || '').trim().toLowerCase();
    if (!input?.checkValidity() || !email) return input?.reportValidity();
    if (list.querySelectorAll('.calendar-guest-chip').length >= 50) return showToast('Puedes invitar hasta 50 personas', 'warning');
    if (Array.from(list.querySelectorAll('.calendar-guest-chip')).some(chip => chip.dataset.email === email)) return showToast('Ese correo ya está en la lista', 'info');
    const chip = document.createElement('span');
    chip.className = 'calendar-guest-chip';
    chip.dataset.email = email;
    chip.innerHTML = `<span>${escapeHtml(email)}</span><button type="button" aria-label="Quitar ${escapeHtml(email)}"><i data-lucide="x"></i></button>`;
    list.appendChild(chip);
    input.value = '';
    if (typeof lucide !== 'undefined') lucide.createIcons();
  };
  document.getElementById(`${prefix}-guest-add`)?.addEventListener('click', add);
  input?.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); add(); } });
  list?.addEventListener('click', event => event.target.closest('button')?.closest('.calendar-guest-chip')?.remove());
}

function calendarGuests(prefix) {
  const input = document.getElementById(`${prefix}-guest-email`);
  if (input?.value.trim()) {
    document.getElementById(`${prefix}-guest-add`)?.click();
    if (input.value.trim()) return null;
  }
  return Array.from(document.querySelectorAll(`#${prefix}-guest-list .calendar-guest-chip`))
    .map(chip => ({ email: chip.dataset.email, name: chip.dataset.name || null }));
}

function calendarMailboxField(prefix, mailboxes, selectedId = '') {
  if (!mailboxes.length) return '<p class="calendar-mailbox-warning"><i data-lucide="circle-alert"></i> No tienes una casilla activa en Solven Labs Mail. Puedes guardar eventos sin invitados.</p>';
  return `<div class="modal-form__group"><label class="modal-form__label">Enviar invitaciones desde</label><select class="modal-form__select" id="${prefix}-mailbox" ${selectedId ? 'disabled' : ''}>${mailboxes.map(mailbox => `<option value="${escapeHtml(mailbox.id)}" ${mailbox.id === selectedId ? 'selected' : ''}>${escapeHtml(mailbox.display_name ? `${mailbox.display_name} <${mailbox.address}>` : mailbox.address)}</option>`).join('')}</select></div>`;
}

function bindNtekMeetToggle(prefix) {
  const checkbox = document.getElementById(`${prefix}-add-meet`);
  const field = document.getElementById(`${prefix}-meet`);
  const preview = document.getElementById(`${prefix}-meet-preview`);
  const sync = () => {
    if (checkbox.checked && !field.value) field.value = createNtekMeetUrl();
    if (!checkbox.checked) field.value = '';
    preview.hidden = !field.value;
    preview.textContent = field.value ? `Solven Labs Meet\n${field.value}` : '';
  };
  checkbox?.addEventListener('change', sync);
  sync();
}

function initAddEventModal() {
  const btn = document.getElementById('btn-add-event');
  if (!btn || btn.dataset.bound) return;
  btn.dataset.bound = 'true';
  btn.addEventListener('click', async () => {
    const { data: mailboxes } = await db.mail.getMailboxes();
    const invitationRequestId = createRecurrenceGroupId();
    openModal('Nuevo Evento', `
      <div class="modal-form__group"><label class="modal-form__label">Título</label><input type="text" class="modal-form__input" id="new-event-title" placeholder="Nombre del evento"></div>
      <div class="modal-form__row">
        <div class="modal-form__group"><label class="modal-form__label">Fecha</label><input type="date" class="modal-form__input" id="new-event-date" value="${getLocalDateKey(new Date())}"></div>
        <div class="modal-form__group"><label class="modal-form__label">Hora inicio</label><input type="time" class="modal-form__input" id="new-event-time"></div>
      </div>
      <div class="modal-form__row">
        <div class="modal-form__group"><label class="modal-form__label">Hora término</label><input type="time" class="modal-form__input" id="new-event-end"></div>
        <div class="modal-form__group"><label class="modal-form__label">Tipo</label><select class="modal-form__select" id="new-event-type"><option value="meeting">Reunión</option><option value="deadline">Entrega</option><option value="demo">Demo</option><option value="kickoff">Kickoff</option><option value="other">Otro</option></select></div>
      </div>
      <div class="modal-form__group">
        <label class="modal-form__label"><i data-lucide="repeat-2" style="width:13px;height:13px;vertical-align:-2px;"></i> Repetir</label>
        <select class="modal-form__select" id="new-event-repeat">
          <option value="none">No se repite</option>
          <option value="daily">Todos los días</option>
          <option value="weekly">Cada semana</option>
          <option value="monthly_weekday">Todos los meses</option>
          <option value="yearly">Anualmente</option>
          <option value="weekdays">Todos los días hábiles (de lunes a viernes)</option>
          <option value="custom">Personalizado...</option>
        </select>
      </div>
      <div id="new-event-repeat-custom" class="event-recurrence-panel" hidden>
        <div class="event-recurrence-every">
          <span>Cada</span>
          <input type="number" class="modal-form__input" id="new-event-repeat-interval" value="1" min="1" max="99" aria-label="Intervalo de repetición">
          <select class="modal-form__select" id="new-event-repeat-frequency">
            <option value="daily">día(s)</option><option value="weekly" selected>semana(s)</option><option value="monthly">mes(es)</option><option value="yearly">año(s)</option>
          </select>
        </div>
        <fieldset id="new-event-repeat-weekdays" class="event-recurrence-weekdays">
          <legend>Se repite el</legend>
          ${[['1','L'],['2','M'],['3','X'],['4','J'],['5','V'],['6','S'],['0','D']].map(([value, label]) => `<label><input type="checkbox" name="new-event-repeat-weekday" value="${value}"><span>${label}</span></label>`).join('')}
        </fieldset>
      </div>
      <div class="modal-form__group" id="new-event-repeat-end-wrap" hidden>
        <label class="modal-form__label">Repetir hasta</label>
        <input type="date" class="modal-form__input" id="new-event-repeat-until">
        <small class="event-recurrence-help">Se crearán las ocurrencias hasta esta fecha (máximo 500).</small>
      </div>
      <p class="calendar-block-help">Si indicas un horario, ese intervalo no se ofrecerá para visitas técnicas ni conversaciones iniciales.</p>
      <div class="modal-form__group"><label class="modal-form__label">Descripción</label><textarea class="modal-form__textarea" id="new-event-desc"></textarea></div>
      <div class="modal-form__group"><label class="modal-form__label">Ubicación <small>(opcional)</small></label><input type="text" class="modal-form__input" id="new-event-location" maxlength="500" placeholder="Oficina, dirección o sala"></div>
      ${calendarGuestEditor('new-event')}
      ${calendarMailboxField('new-event', mailboxes || [])}
      <label class="calendar-meet-toggle"><input type="checkbox" id="new-event-add-meet"><span><i data-lucide="video"></i> Añadir videollamada Solven Labs Meet</span></label>
      <input type="hidden" id="new-event-meet">
      <div class="calendar-meet-preview" id="new-event-meet-preview" hidden></div>
    `, async () => {
      const title = document.getElementById('new-event-title').value.trim();
      if (!title) { showToast('Título obligatorio', 'error'); return; }
      const startTime = document.getElementById('new-event-time').value;
      const endTime = document.getElementById('new-event-end').value;
      if (Boolean(startTime) !== Boolean(endTime)) {
        showToast('Indica tanto la hora de inicio como la hora de término', 'error');
        return;
      }
      if (startTime && endTime <= startTime) {
        showToast('La hora de término debe ser posterior a la hora de inicio', 'error');
        return;
      }
      const eventDate = document.getElementById('new-event-date').value;
      const recurrenceRule = getEventRecurrenceRule();
      const attendees = calendarGuests('new-event');
      if (!attendees) return;
      let eventDates;
      try {
        eventDates = buildRecurringEventDates(eventDate, document.getElementById('new-event-repeat-until').value, recurrenceRule);
      } catch (recurrenceError) {
        showToast(recurrenceError.message, 'error');
        return;
      }
      if (recurrenceRule && attendees.length && eventDates.length > 100) {
        showToast('Las series con invitados admiten hasta 100 eventos. Acorta la fecha de término.', 'warning');
        return;
      }
      const recurrenceGroupId = recurrenceRule ? createRecurrenceGroupId() : null;
      const baseEvent = {
        title,
        start_time: startTime || null,
        end_time: endTime || null,
        event_type: document.getElementById('new-event-type').value,
        description: document.getElementById('new-event-desc').value.trim() || null,
        location: document.getElementById('new-event-location').value.trim() || null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Santiago',
        meet_link: document.getElementById('new-event-meet').value.trim() || null,
        created_by: (await getUser())?.id || null
      };
      const payload = eventDates.map((date, index) => ({
        ...baseEvent,
        event_date: date,
        recurrence_group_id: recurrenceGroupId,
        recurrence_rule: recurrenceRule ? { ...recurrenceRule, until: document.getElementById('new-event-repeat-until').value } : null,
        recurrence_sequence: recurrenceRule ? index : null
      }));
      let error = null;
      if (attendees.length) {
        const mailboxId = document.getElementById('new-event-mailbox')?.value || '';
        if (!mailboxId) { showToast('Necesitas una casilla activa de Solven Labs Mail para invitar personas', 'error'); return; }
        const invitation = await invokeCalendarInvitations({
          action: recurrenceRule ? 'create_series' : 'create', request_id: invitationRequestId, mailbox_id: mailboxId,
          ...(recurrenceRule ? { events: payload } : { event: payload[0] }), attendees
        });
        error = invitation.error;
      } else {
        ({ error } = recurrenceRule ? await db.events.createMany(payload) : await db.events.create(payload[0]));
      }
      if (error) showToast(attendees.length ? calendarInviteError(error) : 'Error: ' + error.message, 'error');
      else {
        showToast(recurrenceRule ? `Serie "${title}" creada (${eventDates.length} eventos)` : `Evento "${title}" creado`, 'success');
        closeModal();
        await loadCalendar();
      }
    });
    initEventRecurrenceControls();
    bindCalendarGuestEditor('new-event');
    bindNtekMeetToggle('new-event');
    if (typeof lucide !== 'undefined') setTimeout(() => lucide.createIcons(), 0);
  });
}

async function editEvent(id) {
  if (!isButtonAllowed('btn-add-event')) return showToast('No tienes permiso para gestionar eventos', 'warning');
  const { data: loadedEvent, error } = await db.events.getById(id);
  let event = loadedEvent;
  if (error || !event) { showToast('Error al cargar evento', 'error'); return; }
  if (event.blocks_bookings) {
    showToast('Para cambiar un bloqueo, elimínalo y crea uno nuevo', 'info');
    return;
  }

  if (event.created_by !== currentProfile?.id) return showToast('Solo el organizador puede editar este evento', 'warning');

  // Algunas series creadas por versiones anteriores guardaron los datos comunes
  // y los invitados solo en una de sus ocurrencias. Recuperamos la serie completa
  // para que el editor nunca aparezca parcialmente vacío.
  let recurrenceCount = 0;
  if (event.recurrence_group_id) {
    const { data: series } = await supabase
      .from('events')
      .select('id,title,description,event_type,location,timezone,meet_link,organizer_mailbox_id,recurrence_rule,meeting_notes,event_attendees(id,email,name,status,created_at)')
      .eq('recurrence_group_id', event.recurrence_group_id)
      .order('recurrence_sequence', { ascending: true, nullsFirst: true });
    recurrenceCount = series?.length || 0;
    const shared = (series || []).find(item => item.event_attendees?.length)
      || (series || []).find(item => item.organizer_mailbox_id || item.location || item.meet_link)
      || series?.[0];
    if (shared) {
      event = {
        ...event,
        description: event.description ?? shared.description,
        event_type: event.event_type || shared.event_type,
        location: event.location ?? shared.location,
        timezone: event.timezone || shared.timezone,
        meet_link: event.meet_link ?? shared.meet_link,
        organizer_mailbox_id: event.organizer_mailbox_id || shared.organizer_mailbox_id,
        recurrence_rule: event.recurrence_rule || shared.recurrence_rule,
        event_attendees: event.event_attendees?.length ? event.event_attendees : (shared.event_attendees || [])
      };
    }
  }

  // Consulta directa como respaldo si PostgREST no incluyó la relación anidada.
  if (!event.event_attendees?.length) {
    const { data: attendeeRows } = await supabase
      .from('event_attendees')
      .select('id,email,name,status,created_at')
      .eq('event_id', event.id)
      .order('created_at');
    if (attendeeRows?.length) event = { ...event, event_attendees: attendeeRows };
  }
  const { data: mailboxes } = await db.mail.getMailboxes();
  const invitationRequestId = createRecurrenceGroupId();

  openModal('Editar Evento', `
    ${event.recurrence_group_id ? `<p class="event-recurrence-help"><i data-lucide="repeat-2"></i> Evento recurrente${recurrenceCount ? ` · ${recurrenceCount} ocurrencias` : ''}${getEventRecurrenceLabel(event) ? ` · ${escapeHtml(getEventRecurrenceLabel(event))}` : ''}</p>` : ''}
    <div class="modal-form__group">
      <label class="modal-form__label">Título</label>
      <input type="text" class="modal-form__input" id="edit-event-title" value="${escapeHtml(event.title)}" placeholder="Nombre del evento">
    </div>
    <div class="modal-form__row">
      <div class="modal-form__group">
        <label class="modal-form__label">Fecha</label>
        <input type="date" class="modal-form__input" id="edit-event-date" value="${event.event_date}">
      </div>
      <div class="modal-form__group">
        <label class="modal-form__label">Hora inicio</label>
        <input type="time" class="modal-form__input" id="edit-event-start" value="${event.start_time || ''}">
      </div>
    </div>
    <div class="modal-form__row">
      <div class="modal-form__group">
        <label class="modal-form__label">Hora fin</label>
        <input type="time" class="modal-form__input" id="edit-event-end" value="${event.end_time || ''}">
      </div>
      <div class="modal-form__group">
        <label class="modal-form__label">Tipo</label>
        <select class="modal-form__select" id="edit-event-type">
          <option value="meeting" ${event.event_type === 'meeting' ? 'selected' : ''}>Reunión</option>
          <option value="deadline" ${event.event_type === 'deadline' ? 'selected' : ''}>Entrega</option>
          <option value="demo" ${event.event_type === 'demo' ? 'selected' : ''}>Demo</option>
          <option value="kickoff" ${event.event_type === 'kickoff' ? 'selected' : ''}>Kickoff</option>
          <option value="other" ${event.event_type === 'other' ? 'selected' : ''}>Otro</option>
        </select>
      </div>
    </div>
    <div class="modal-form__group">
      <label class="modal-form__label">Descripción</label>
      <textarea class="modal-form__textarea" id="edit-event-desc">${escapeHtml(event.description || '')}</textarea>
    </div>
    <div class="modal-form__group"><label class="modal-form__label">Ubicación <small>(opcional)</small></label><input type="text" class="modal-form__input" id="edit-event-location" maxlength="500" value="${escapeHtml(event.location || '')}" placeholder="Oficina, dirección o sala"></div>
    ${calendarGuestEditor('edit-event', event.event_attendees || [])}
    ${calendarMailboxField('edit-event', mailboxes || [], event.organizer_mailbox_id || '')}
    <label class="calendar-meet-toggle"><input type="checkbox" id="edit-event-add-meet" ${event.meet_link ? 'checked' : ''}><span><i data-lucide="video"></i> Añadir videollamada Solven Labs Meet</span></label>
    <input type="hidden" id="edit-event-meet" value="${escapeHtml(event.meet_link || '')}">
    <div class="calendar-meet-preview" id="edit-event-meet-preview" ${event.meet_link ? '' : 'hidden'}></div>
    <div class="modal-form__group">
      <label class="modal-form__label"><i data-lucide="notebook-pen" style="width:13px;height:13px;vertical-align:-2px;"></i> Notas de la reunión</label>
      <textarea class="modal-form__textarea" id="edit-event-notes" rows="5" placeholder="Resumen, acuerdos, puntos tratados...">${escapeHtml(event.meeting_notes || '')}</textarea>
    </div>
  `, 'Guardar Cambios', async () => {
    const title = document.getElementById('edit-event-title').value.trim();
    if (!title) { showToast('Título obligatorio', 'error'); return; }
    const startTime = document.getElementById('edit-event-start').value;
    const endTime = document.getElementById('edit-event-end').value;
    if (Boolean(startTime) !== Boolean(endTime)) {
      showToast('Indica tanto la hora de inicio como la hora de término', 'error');
      return;
    }
    if (startTime && endTime <= startTime) {
      showToast('La hora de término debe ser posterior a la hora de inicio', 'error');
      return;
    }

    const updates = {
      title,
      event_date: document.getElementById('edit-event-date').value,
      start_time: startTime || null,
      end_time: endTime || null,
      event_type: document.getElementById('edit-event-type').value,
      description: document.getElementById('edit-event-desc').value.trim() || null,
      location: document.getElementById('edit-event-location').value.trim() || null,
      timezone: event.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Santiago',
      meet_link: document.getElementById('edit-event-meet').value.trim() || null,
      meeting_notes: document.getElementById('edit-event-notes').value.trim() || null
    };

    const attendees = calendarGuests('edit-event');
    if (!attendees) return;
    const hasInvitations = attendees.length || (event.event_attendees || []).length;
    if (event.recurrence_group_id && hasInvitations) {
      const mailboxId = document.getElementById('edit-event-mailbox')?.value || '';
      if (!mailboxId) { showToast('Necesitas una casilla activa de Solven Labs Mail para notificar cambios', 'error'); return; }
      const recurrenceUntil = document.getElementById('edit-event-repeat-until')?.value || event.recurrence_rule?.until || event.event_date;
      confirmRecurringInvitationUpdate(event, updates, recurrenceUntil, attendees, mailboxId, invitationRequestId);
      return;
    }
    if (hasInvitations) {
      const mailboxId = document.getElementById('edit-event-mailbox')?.value || '';
      if (!mailboxId) { showToast('Necesitas una casilla activa de Solven Labs Mail para notificar cambios', 'error'); return; }
      const invitation = await invokeCalendarInvitations({
        action: 'update', request_id: invitationRequestId, event_id: event.id,
        mailbox_id: mailboxId, event: updates, attendees
      });
      if (invitation.error) { showToast(calendarInviteError(invitation.error), 'error'); return; }
      showToast('Evento actualizado e invitados notificados', 'success');
      closeModal();
      await loadCalendar();
      return;
    }

    if (event.recurrence_group_id) {
      const recurrenceUntil = document.getElementById('edit-event-repeat-until')?.value || event.recurrence_rule?.until || event.event_date;
      confirmRecurringEventUpdate(event, updates, recurrenceUntil);
      return;
    }

    await saveEventUpdate(event, updates, 'single');
  });
  bindCalendarGuestEditor('edit-event');
  bindNtekMeetToggle('edit-event');
  if (typeof lucide !== 'undefined') setTimeout(() => lucide.createIcons(), 0);
}

// Mostrar evento en modal (vista rápida)
function confirmRecurringEventUpdate(event, updates, recurrenceUntil) {
  openModal('Actualizar evento recurrente', `
    <p>Este evento forma parte de una serie. ¿Qué eventos quieres modificar?</p>
    <div class="event-recurrence-update-actions">
      <button type="button" class="btn-dash btn-dash--secondary" id="update-current-event">Solo este evento</button>
      <button type="button" class="btn-dash btn-dash--primary" id="update-series-events">Todos los eventos</button>
    </div>
  `, null, null, true);

  document.getElementById('update-current-event')?.addEventListener('click', () => saveEventUpdate(event, updates, 'single'));
  document.getElementById('update-series-events')?.addEventListener('click', () => saveEventUpdate(event, updates, 'series', recurrenceUntil));
  document.getElementById('update-current-event')?.focus();
}

function shiftCalendarDate(dateKey, days) {
  const date = parseCalendarDateKey(dateKey);
  if (!date) return dateKey;
  date.setDate(date.getDate() + days);
  return calendarDateKey(date);
}

async function saveEventUpdate(event, updates, scope, recurrenceUntil = '') {
  if (scope === 'single') {
    const { error } = await db.events.update(event.id, updates);
    if (error) {
      showToast('Error: ' + error.message, 'error');
      return;
    }
    showToast('Evento actualizado', 'success');
  } else {
    const { data: series, error: seriesError } = await db.events.getByRecurrenceGroup(event.recurrence_group_id);
    if (seriesError || !series?.length) {
      showToast('No se pudo cargar la serie de eventos', 'error');
      return;
    }

    const originalDate = parseCalendarDateKey(event.event_date);
    const newDate = parseCalendarDateKey(updates.event_date);
    const dateShift = originalDate && newDate ? Math.round((newDate - originalDate) / 86400000) : 0;
    const firstOccurrence = series[0];
    const shiftedStart = shiftCalendarDate(firstOccurrence.event_date, dateShift);
    const effectiveUntil = recurrenceUntil || shiftCalendarDate(firstOccurrence.recurrence_rule?.until || series.at(-1).event_date, dateShift);
    const recurrenceRule = firstOccurrence.recurrence_rule
      ? { ...firstOccurrence.recurrence_rule, until: effectiveUntil }
      : null;
    let desiredDates;
    try {
      desiredDates = buildRecurringEventDates(shiftedStart, effectiveUntil, recurrenceRule);
    } catch (recurrenceError) {
      showToast(recurrenceError.message, 'error');
      return;
    }

    const existingUpdates = series.slice(0, desiredDates.length).map((occurrence, index) => db.events.update(occurrence.id, {
      ...updates,
      event_date: desiredDates[index],
      recurrence_rule: recurrenceRule,
      recurrence_sequence: index
    }));
    const newOccurrences = desiredDates.slice(series.length).map((eventDate, offset) => ({
      title: updates.title,
      description: updates.description,
      event_date: eventDate,
      start_time: updates.start_time,
      end_time: updates.end_time,
      event_type: updates.event_type,
      project_id: firstOccurrence.project_id || null,
      created_by: firstOccurrence.created_by,
      meet_link: updates.meet_link,
      location: updates.location,
      timezone: updates.timezone,
      organizer_mailbox_id: firstOccurrence.organizer_mailbox_id || null,
      meeting_notes: null,
      blocks_bookings: false,
      recurrence_group_id: event.recurrence_group_id,
      recurrence_rule: recurrenceRule,
      recurrence_sequence: series.length + offset
    }));
    const removals = series.slice(desiredDates.length).map(occurrence => db.events.delete(occurrence.id));
    const results = await Promise.all([
      ...existingUpdates,
      ...(newOccurrences.length ? [db.events.createMany(newOccurrences)] : []),
      ...removals
    ]);
    const updateError = results.find(result => result.error)?.error;
    if (updateError) {
      showToast('Error al actualizar la serie: ' + updateError.message, 'error');
      return;
    }
    showToast(`Serie actualizada (${desiredDates.length} eventos hasta el ${effectiveUntil})`, 'success');
  }

  closeModal();
  await loadCalendar();
}

async function viewEvent(id) {
  const { data: event, error } = await db.events.getById(id);
  if (error || !event) { showToast('Evento no encontrado', 'error'); return; }
  const timeStr = event.start_time ? (event.start_time.slice(0, 5) + (event.end_time ? ' - ' + event.end_time.slice(0, 5) : '')) : '';
  const typeLabel = { meeting: 'Reunión', deadline: 'Entrega', demo: 'Demo', kickoff: 'Kickoff', other: 'Otro' }[event.event_type] || event.event_type;

  // Fetch creator profile if available
  let creatorDisplay = event.created_by || '-';
  if (event.created_by) {
    try {
      const { data: profile } = await db.profiles.get(event.created_by);
      if (profile) {
        creatorDisplay = profile.full_name || profile.email || event.created_by;
      }
    } catch (err) {
      // fallback to ID
    }
  }

  const createdAtStr = event.created_at ? timeAgo(event.created_at) : '-';
  const recurrenceLabel = getEventRecurrenceLabel(event);
  const attendees = event.event_attendees || [];
  const isOwner = event.created_by === currentProfile?.id;

  const content = `
    <div style="display:grid;grid-template-columns:1fr;gap:12px;">
      <div style="font-size:0.95rem;color:var(--dash-text-muted);">${escapeHtml(event.event_date)} ${timeStr ? '· ' + escapeHtml(timeStr) : ''}</div>
      <div style="font-weight:700;font-size:1.05rem;">${escapeHtml(event.title)}</div>
      <div style="color:var(--dash-text-secondary);">${escapeHtml(event.description || '')}</div>
      ${event.location ? `<div><strong>Ubicación:</strong> ${escapeHtml(event.location)}</div>` : ''}
      ${event.meet_link ? `<a href="${escapeHtml(event.meet_link)}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:8px;margin-top:4px;padding:10px 18px;background:var(--dash-primary);color:#fff;border-radius:8px;font-weight:600;font-size:0.92rem;text-decoration:none;"><i data-lucide="video" style="width:15px;height:15px;"></i> Unirse a la reunión</a>` : ''}
      ${attendees.length ? `<section class="calendar-event-guests"><strong>Invitados (${attendees.length})</strong><div>${attendees.map(attendee => `<span class="calendar-guest-chip"><span>${escapeHtml(attendee.name ? `${attendee.name} <${attendee.email}>` : attendee.email)}</span><small>${escapeHtml(attendee.status || 'pending')}</small></span>`).join('')}</div></section>` : ''}
      <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;">
        <div class="client-stat"><div class="label">Tipo</div><div class="value">${escapeHtml(typeLabel)}</div></div>
        ${recurrenceLabel ? `<div class="client-stat"><div class="label">Repetición</div><div class="value">${escapeHtml(recurrenceLabel)}</div></div>` : ''}
        ${event.meet_link ? `<div class="client-stat"><div class="label">Solven Labs Meet</div><div class="value" style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"><a href="${escapeHtml(event.meet_link)}" target="_blank" rel="noopener noreferrer" style="color:var(--dash-primary);">${escapeHtml(event.meet_link)}</a></div></div>` : ''}
        <div class="client-stat"><div class="label">Creado por</div><div class="value">${escapeHtml(creatorDisplay)}</div></div>
        <div class="client-stat"><div class="label">Creado</div><div class="value">${escapeHtml(createdAtStr)}</div></div>
      </div>
      ${isOwner ? `<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px;" class="modal-actions">
        <button class="btn-icon" title="Editar evento" onclick="editEvent('${event.id}')"><i data-lucide="pencil" style="width:14px;height:14px;"></i></button>
        <button class="btn-icon btn-icon--danger" title="Cancelar o eliminar evento" onclick="deleteEvent('${event.id}','${escapeHtml(event.title)}')"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button>
      </div>` : ''}
      <!-- Notas de la reunión -->
      <div style="border-top:1px solid var(--dash-border);margin-top:8px;padding-top:14px;">
        <div style="font-size:0.78rem;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--dash-text-secondary);margin-bottom:8px;display:flex;align-items:center;gap:6px;"><i data-lucide="notebook-pen" style="width:13px;height:13px;"></i> Notas de la reunión</div>
        <textarea id="event-meeting-notes" rows="6" ${isOwner ? '' : 'disabled'} style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid var(--dash-border);background:var(--dash-surface-2);color:var(--dash-text);font-size:0.9rem;resize:vertical;font-family:inherit;line-height:1.5;" placeholder="Resumen, acuerdos, puntos tratados...">${escapeHtml(event.meeting_notes || '')}</textarea>
        <div style="display:flex;justify-content:flex-end;margin-top:8px;">
          ${isOwner ? `<button class="btn-dash btn-dash--primary btn-dash--sm" onclick="saveEventNotes('${event.id}')" style="display:inline-flex;align-items:center;gap:6px;"><i data-lucide="save" style="width:13px;height:13px;"></i> Guardar notas</button>` : ''}
        </div>
      </div>
    </div>
  `;

  openModal(`${escapeHtml(event.title)}`, content, null, null, true);
  const modalContentEl = document.querySelector('.dash-modal__content');
  if (modalContentEl) modalContentEl.classList.add('dash-modal__content--fullscreen');
  if (typeof lucide !== "undefined") setTimeout(() => lucide.createIcons(), 50);
}

async function saveEventNotes(id) {
  if (!isButtonAllowed('btn-add-event')) return showToast('No tienes permiso para gestionar eventos', 'warning');
  const textarea = document.getElementById('event-meeting-notes');
  if (!textarea) return;
  const notes = textarea.value.trim() || null;
  const { error } = await db.events.update(id, { meeting_notes: notes });
  if (error) { showToast('Error al guardar notas: ' + error.message, 'error'); return; }
  showToast('Notas guardadas', 'success');
}

async function deleteEvent(id, title) {
  if (!isButtonAllowed('btn-add-event')) return showToast('No tienes permiso para gestionar eventos', 'warning');
  const { data: event, error: loadError } = await db.events.getById(id);
  if (loadError || !event) return showToast('No se pudo cargar el evento', 'error');
  if (event.recurrence_group_id) {
    const { data: series, error: seriesError } = await supabase.from('events')
      .select('organizer_mailbox_id,event_attendees(id)').eq('recurrence_group_id', event.recurrence_group_id);
    if (seriesError) return showToast('No se pudieron verificar las invitaciones de la serie', 'error');
    event.seriesHasInvitations = series?.some(item => item.organizer_mailbox_id || item.event_attendees?.length);
    event.seriesMailboxId = series?.find(item => item.organizer_mailbox_id)?.organizer_mailbox_id;
  }
  const canDeleteSystemEvent = event.created_by == null && isAdministrativeRole(getCurrentRole());
  if (event.created_by !== currentProfile?.id && !canDeleteSystemEvent) return showToast('Solo el organizador puede cancelar este evento', 'warning');
  const invitationRequestId = createRecurrenceGroupId();
  const isPaidVisit = /^Visita técnica\s*·/i.test(title);
  const paymentWarning = isPaidVisit
    ? '<p style="margin-top:10px;color:var(--dash-warning, #b45309);"><strong>Importante:</strong> se cancelará la reserva y se liberará el horario, pero el pago no se reembolsa automáticamente.</p>'
    : '';
  const invitationWarning = (event.event_attendees || []).length
    ? '<p class="calendar-block-help">Los invitados recibirán la cancelación y un archivo iCalendar actualizado.</p>'
    : '';

  if (event.recurrence_group_id) {
    openModal('Eliminar evento recurrente', `
      <p>Este evento forma parte de una serie. ¿Qué eventos quieres eliminar?</p>
      <div class="event-recurrence-update-actions">
        <button type="button" class="btn-dash btn-dash--secondary" id="delete-current-event">Solo este evento</button>
        <button type="button" class="btn-dash btn-dash--danger" id="delete-series-events">Todos los eventos</button>
      </div>
    `, null, null, true);
    document.getElementById('delete-current-event')?.addEventListener('click', () => confirmEventDeletion(event, title, 'single', invitationRequestId, invitationWarning, paymentWarning));
    document.getElementById('delete-series-events')?.addEventListener('click', () => confirmEventDeletion(event, title, 'series', invitationRequestId, invitationWarning, paymentWarning));
    document.getElementById('delete-current-event')?.focus();
    return;
  }

  confirmEventDeletion(event, title, 'single', invitationRequestId, invitationWarning, paymentWarning);
}

function confirmRecurringInvitationUpdate(event, updates, recurrenceUntil, attendees, mailboxId, requestId) {
  openModal('Actualizar evento recurrente', `
    <p>Este evento tiene invitados. ¿Qué alcance tendrá la actualización?</p>
    <div class="event-recurrence-update-actions">
      <button type="button" class="btn-dash btn-dash--secondary" id="update-current-invited-event">Solo este evento</button>
      <button type="button" class="btn-dash btn-dash--primary" id="update-invited-series">Toda la serie</button>
    </div>
    <p class="event-recurrence-help">Se enviará una sola actualización agrupada por persona.</p>
  `, null, null, true);

  document.getElementById('update-current-invited-event')?.addEventListener('click', async () => {
    const invitation = await invokeCalendarInvitations({
      action: 'update', request_id: requestId, event_id: event.id,
      mailbox_id: mailboxId, event: updates, attendees
    });
    if (invitation.error) return showToast(calendarInviteError(invitation.error), 'error');
    showToast('Evento actualizado e invitados notificados', 'success');
    closeModal();
    await loadCalendar();
  });
  document.getElementById('update-invited-series')?.addEventListener('click', async () => {
    const { data: series, error } = await db.events.getByRecurrenceGroup(event.recurrence_group_id);
    if (error || !series?.length) return showToast('No se pudo cargar la serie', 'error');
    const selectedIndex = series.findIndex(item => item.id === event.id);
    const dateShift = Math.round((parseCalendarDateKey(updates.event_date) - parseCalendarDateKey(event.event_date)) / 86400000) || 0;
    const first = series[0];
    const rule = { ...(first.recurrence_rule || event.recurrence_rule), until: recurrenceUntil };
    let dates;
    try { dates = buildRecurringEventDates(shiftCalendarDate(first.event_date, dateShift), recurrenceUntil, rule); }
    catch (recurrenceError) { return showToast(recurrenceError.message, 'error'); }
    const events = dates.map((date, index) => ({
      ...(series[index]?.id ? { id: series[index].id } : {}), ...updates,
      event_date: date, recurrence_group_id: event.recurrence_group_id,
      recurrence_rule: rule, recurrence_sequence: index,
      created_by: first.created_by
    }));
    const invitation = await invokeCalendarInvitations({
      action: 'update_series', request_id: requestId, event_id: event.id,
      mailbox_id: mailboxId, events, attendees
    });
    if (invitation.error) return showToast(calendarInviteError(invitation.error), 'error');
    showToast(`Serie actualizada (${dates.length} eventos) e invitados notificados`, 'success');
    closeModal();
    await loadCalendar();
  });
}

function confirmEventDeletion(event, title, scope, invitationRequestId, invitationWarning = '', paymentWarning = '') {
  const isSeries = scope === 'series';
  const explanation = isSeries
    ? `Se eliminarán <strong>todos los eventos</strong> de la serie <strong>${escapeHtml(title)}</strong>.`
    : `Se eliminará solamente el evento <strong>${escapeHtml(title)}</strong> de esta fecha.`;
  const seriesWarning = isSeries
    ? '<p class="calendar-block-help">La eliminación incluye todas las ocurrencias de la serie y no se puede deshacer.</p>'
    : '';
  openModal(isSeries ? 'Eliminar toda la serie' : 'Eliminar este evento', `<p>${explanation}</p>${seriesWarning}${isSeries ? '' : invitationWarning}${paymentWarning}`, isSeries ? 'Eliminar serie' : 'Eliminar evento', async () => {
    let error = null;
    let deletedCount = 1;
    if (isSeries) {
      if (event.organizer_mailbox_id || (event.event_attendees || []).length || event.seriesHasInvitations) {
        const invitation = await invokeCalendarInvitations({
          action: 'cancel_series', request_id: invitationRequestId, event_id: event.id,
          mailbox_id: event.organizer_mailbox_id || event.seriesMailboxId
        });
        error = invitation.error;
        deletedCount = Number(invitation.data?.events_deleted) || 0;
      } else {
        const result = await db.events.deleteSeries(event.recurrence_group_id);
        error = result.error;
        deletedCount = Number(result.data?.events_deleted) || 0;
      }
    } else if (event.organizer_mailbox_id || (event.event_attendees || []).length) {
      const invitation = await invokeCalendarInvitations({
        action: 'cancel', request_id: invitationRequestId, event_id: event.id,
        mailbox_id: event.organizer_mailbox_id
      });
      error = invitation.error;
    } else {
      ({ error } = await db.events.delete(event.id));
    }
    if (error) { showToast((event.organizer_mailbox_id || event.seriesHasInvitations || (event.event_attendees || []).length) ? calendarInviteError(error) : 'Error: ' + error.message, 'error'); return; }
    closeModal();
    showToast(isSeries ? `Serie eliminada (${deletedCount} eventos)` : `Evento "${title}" eliminado`, 'success');
    await loadCalendar();
  });
}

// ==========================================================================
// SIDEBAR BADGES (dynamic counts from DB)
// ==========================================================================
async function updateSidebarBadges() {
  try {
    const [projectsRes, tasksRes, invoicesRes, messagesRes, ordersRes, practicesRes] = await Promise.all([
      supabase.from('projects').select('id', { count: 'exact', head: true }).eq('status', 'in_development'),
      supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('completed', false),
      supabase.from('facturas_presii').select('id', { count: 'exact', head: true }).not('estado', 'in', '("Aceptada","Anulada")'),
      supabase.from('site_messages').select('id', { count: 'exact', head: true }).eq('status', 'new'),
      supabase.from('orders').select('id', { count: 'exact', head: true }).neq('status', 'done'),
      supabase.from('internship_logs').select('id', { count: 'exact', head: true }).eq('status', 'ingresado').is('deleted_at', null)
    ]);

    const badges = [
      { id: 'badge-projects', count: projectsRes.count || 0 },
      { id: 'badge-tasks', count: tasksRes.count || 0 },
      { id: 'badge-invoices', count: invoicesRes.count || 0 },
      { id: 'badge-messages', count: messagesRes.count || 0 },
      { id: 'badge-orders', count: ordersRes.count || 0 },
      { id: 'badge-practices', count: practicesRes.count || 0 }
    ];

    badges.forEach(({ id, count }) => {
      const el = document.getElementById(id);
      if (el) {
        if (count > 0) {
          el.textContent = count;
          el.style.display = '';
        } else {
          el.style.display = 'none';
        }
      }
    });
  } catch (err) {
    console.error('Error updating sidebar badges:', err);
  }
}

// ==========================================================================
// BUSINESS INTELLIGENCE DASHBOARDS
// ==========================================================================
const biState = { dataset: null, analytics: null, reports: null, loading: null };

function biDateKey(value) {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 10);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : getLocalDateKey(date);
}

function biMonthKey(value) { return biDateKey(value).slice(0, 7); }
function biSum(rows, field) { return rows.reduce((sum, row) => sum + (Number(typeof field === 'function' ? field(row) : row?.[field]) || 0), 0); }
function biCompactCurrency(value) { return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', notation: 'compact', maximumFractionDigits: 1 }).format(Number(value) || 0); }
function biCountBy(rows, getter) { return rows.reduce((result, row) => { const key = getter(row) || 'Sin definir'; result[key] = (result[key] || 0) + 1; return result; }, {}); }
function biStatusLabel(value) {
  return ({ in_development: 'En desarrollo', review: 'En revisión', completed: 'Completados', complete: 'Completados', done: 'Completados', proposal: 'Propuesta', paused: 'Pausados', active: 'Activos', inactive: 'Inactivos', prospect: 'Prospectos', emitida: 'Emitidos', emitido: 'Emitidos', pagada: 'Pagados', pagado: 'Pagados', vigente: 'Vigentes', aceptada: 'Aceptados', aceptado: 'Aceptados', rechazada: 'Rechazados', rechazado: 'Rechazados', vencida: 'Vencidos', vencido: 'Vencidos', borrador: 'Borradores', anulada: 'Anulados', anulado: 'Anulados' })[String(value || '').toLowerCase()] || String(value || 'Sin definir').replace(/_/g, ' ');
}

function biPreviousMonth(month) {
  const [year, monthIndex] = month.split('-').map(Number);
  const date = new Date(year, monthIndex - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function biChange(current, previous) {
  if (!previous && !current) return { value: 0, direction: 'flat' };
  if (!previous) return { value: 100, direction: 'up' };
  const value = Math.round(((current - previous) / Math.abs(previous)) * 100);
  return { value: Math.abs(value), direction: value > 0 ? 'up' : value < 0 ? 'down' : 'flat' };
}

async function loadBiDataset({ force = false } = {}) {
  if (biState.dataset && !force) return biState.dataset;
  if (biState.loading && !force) return biState.loading;
  biState.loading = (async () => {
    const [projectsRes, clientsRes, tasksRes, incomeRes, financeExpensesRes, expensesRes, teamRes, ordersRes, docs, quotes] = await Promise.all([
      supabase.from('projects').select('*, clients(name)').order('created_at', { ascending: true }),
      supabase.from('clients').select('*').order('created_at', { ascending: true }),
      supabase.from('tasks').select('*, projects(name)').order('created_at', { ascending: true }),
      supabase.from('fin_ingresos').select('*').order('fecha', { ascending: true }),
      supabase.from('fin_gastos').select('*').order('fecha', { ascending: true }),
      supabase.from('expenses').select('*').order('created_at', { ascending: true }),
      supabase.from('team_members').select('*').order('full_name'),
      supabase.from('orders').select('*, team_members(full_name)').order('created_at', { ascending: true }),
      getPresiiDocs(),
      getCotizaciones()
    ]);
    const validIncome = (incomeRes.data || []).filter(row => !['anulado', 'anulada', 'cancelado', 'cancelada'].includes(normalizeSiiPaidStatus(row.estado)));
    const financeExpenses = (financeExpensesRes.data || []).filter(row => !['anulado', 'anulada', 'cancelado', 'cancelada'].includes(normalizeSiiPaidStatus(row.estado)));
    const expenseRows = (expensesRes.data || []).filter(row => !['cancelled', 'cancelado', 'anulado'].includes(String(row.status || '').toLowerCase()));
    const income = validIncome.map(row => ({ date: biDateKey(row.fecha || row.created_at), amount: Number(row.monto || 0), detail: row.concepto || row.descripcion || row.glosa || row.observaciones || row.categoria || 'Ingreso', status: row.estado || 'registrado', source: row }));
    const expenses = [
      ...financeExpenses.map(row => ({ date: biDateKey(row.fecha || row.created_at), amount: Number(row.monto || 0), detail: row.concepto || row.descripcion || row.glosa || row.proveedor || row.categoria || 'Gasto', status: row.estado || 'registrado', source: row })),
      ...expenseRows.map(row => ({ date: biDateKey(row.date_incurred || row.created_at), amount: Number(row.amount || 0), detail: row.description || row.category || 'Gasto operativo', status: row.status || 'registrado', source: row }))
    ];
    const siiDocs = Array.isArray(docs) ? docs : [];
    const salesDocs = siiDocs.filter(doc => {
      const operation = String(doc.operacion || (String(doc.tipo_dte || '') === '110' ? 'compra' : 'venta')).toLowerCase();
      return operation === 'venta' && isCountableSiiInvoice(doc);
    });
    const dataset = { projects: projectsRes.data || [], clients: clientsRes.data || [], tasks: tasksRes.data || [], income, expenses, docs: siiDocs, salesDocs, quotes: Array.isArray(quotes) ? quotes : [], team: teamRes.data || [], orders: ordersRes.data || [] };
    biState.dataset = dataset;
    biState.loading = null;
    return dataset;
  })().catch(error => { biState.loading = null; throw error; });
  return biState.loading;
}

function biEmpty(message = 'No hay datos para este período') { return `<div class="bi-empty"><i data-lucide="chart-no-axes-column"></i><span>${escapeHtml(message)}</span></div>`; }

function biRenderBars(container, entries, { currency = false, colors = ['#0d4581', '#2e649d', '#5787bb', '#83b6c9', '#afcdd8', '#557ca5'] } = {}) {
  if (!container) return;
  const rows = Object.entries(entries).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...rows.map(([, value]) => value), 1);
  container.innerHTML = rows.length ? rows.map(([label, value], index) => `<div class="bi-bar"><div><span>${escapeHtml(biStatusLabel(label))}</span><strong>${currency ? biCompactCurrency(value) : Number(value).toLocaleString('es-CL')}</strong></div><div class="bi-bar__track"><span style="width:${Math.max(3, (value / max) * 100)}%;background:${colors[index % colors.length]}"></span></div></div>`).join('') : biEmpty();
}

function biRenderTrend(container, labels, series) {
  if (!container) return;
  const width = 820, height = 260, padX = 34, padY = 24;
  const values = series.flatMap(item => item.values);
  if (!values.length || values.every(value => !value)) { container.innerHTML = biEmpty(); return; }
  const max = Math.max(...values, 1);
  const x = index => padX + (labels.length <= 1 ? 0 : index * ((width - padX * 2) / (labels.length - 1)));
  const y = value => height - padY - (value / max) * (height - padY * 2);
  const grid = [0, .25, .5, .75, 1].map(step => `<line x1="${padX}" y1="${y(max * step)}" x2="${width - padX}" y2="${y(max * step)}"/><text x="${padX}" y="${y(max * step) - 5}">${biCompactCurrency(max * step)}</text>`).join('');
  const paths = series.map(item => {
    const points = item.values.map((value, index) => `${x(index)},${y(value)}`).join(' ');
    const dots = item.values.map((value, index) => `<circle cx="${x(index)}" cy="${y(value)}" r="3"><title>${escapeHtml(labels[index])}: ${formatCurrency(value)}</title></circle>`).join('');
    return `<g style="--series:${item.color}"><polyline points="${points}"/>${dots}</g>`;
  }).join('');
  const labelStep = Math.max(1, Math.ceil(labels.length / 8));
  const xLabels = labels.map((label, index) => index % labelStep === 0 || index === labels.length - 1 ? `<text class="bi-trend__x" x="${x(index)}" y="${height - 3}" text-anchor="middle">${escapeHtml(label)}</text>` : '').join('');
  container.innerHTML = `<svg class="bi-trend" viewBox="0 0 ${width} ${height}" role="img" aria-label="Gráfico de tendencia"><g class="bi-trend__grid">${grid}</g>${paths}${xLabels}</svg>`;
}

function biRenderDonut(container, income, expenses) {
  if (!container) return;
  const total = Math.max(0, income) + Math.max(0, expenses);
  const incomePct = total ? Math.round((Math.max(0, income) / total) * 100) : 0;
  const margin = income - expenses;
  container.innerHTML = `<div class="bi-donut-wrap"><div class="bi-donut" style="--donut-angle:${incomePct * 3.6}deg"><div><small>Resultado</small><strong class="${margin < 0 ? 'is-negative' : ''}">${biCompactCurrency(margin)}</strong></div></div><div class="bi-donut__legend"><div><i style="background:#0d4581"></i><span>Ingresos</span><strong>${formatCurrency(income)}</strong></div><div><i style="background:#f0a64a"></i><span>Gastos</span><strong>${formatCurrency(expenses)}</strong></div><div><i style="background:#d9e6eb"></i><span>Margen</span><strong>${income ? Math.round((margin / income) * 100) : 0}%</strong></div></div></div>`;
}

function biRenderRanking(container, rows) {
  if (!container) return;
  const max = Math.max(...rows.map(row => row.value), 1);
  container.innerHTML = rows.length ? rows.slice(0, 6).map((row, index) => `<div class="bi-rank"><b>${String(index + 1).padStart(2, '0')}</b><div><span>${escapeHtml(row.label)}</span><i><em style="width:${Math.max(5, (row.value / max) * 100)}%"></em></i></div><strong>${row.value}</strong></div>`).join('') : biEmpty('Sin clientes asociados');
}

function biKpiPreferences(scope, definitions) {
  try { const saved = JSON.parse(localStorage.getItem(`ntek-bi-${scope}-kpis`) || '[]'); return saved.length ? saved : definitions.map(item => item.key); }
  catch (_) { return definitions.map(item => item.key); }
}

function biOpenKpiCustomizer(scope, definitions, rerender) {
  const selected = new Set(biKpiPreferences(scope, definitions));
  openModal('Personalizar indicadores', `<div class="bi-kpi-picker"><p>Elige los indicadores que quieres mantener visibles en este tablero.</p>${definitions.map(item => `<label><input type="checkbox" value="${item.key}" ${selected.has(item.key) ? 'checked' : ''}><span><i data-lucide="${item.icon}"></i><strong>${escapeHtml(item.label)}</strong></span></label>`).join('')}</div>`, 'Guardar vista', () => {
    const values = [...document.querySelectorAll('.bi-kpi-picker input:checked')].map(input => input.value);
    if (!values.length) return showToast('Selecciona al menos un indicador', 'warning');
    localStorage.setItem(`ntek-bi-${scope}-kpis`, JSON.stringify(values));
    closeModal(); rerender(); showToast('Vista de indicadores actualizada', 'success');
  });
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function biRenderKpis(container, scope, definitions, compareEnabled = true) {
  if (!container) return;
  const visible = new Set(biKpiPreferences(scope, definitions));
  container.innerHTML = definitions.filter(item => visible.has(item.key)).map(item => {
    const change = biChange(item.value, item.previous);
    const directionIcon = change.direction === 'up' ? 'trending-up' : change.direction === 'down' ? 'trending-down' : 'minus';
    return `<article class="bi-kpi bi-kpi--${item.tone || 'green'}" data-bi-area="${item.area}" tabindex="0"><div class="bi-kpi__top"><span><i data-lucide="${item.icon}"></i></span><small>${escapeHtml(item.context || '')}</small></div><p>${escapeHtml(item.label)}</p><strong>${item.format === 'currency' ? biCompactCurrency(item.value) : `${Number(item.value || 0).toLocaleString('es-CL')}${item.suffix || ''}`}</strong>${compareEnabled ? `<div class="bi-kpi__change is-${change.direction}"><i data-lucide="${directionIcon}"></i>${change.value}% <span>vs. mes anterior</span></div>` : `<div class="bi-kpi__change"><span>${escapeHtml(item.note || 'Histórico acumulado')}</span></div>`}</article>`;
  }).join('');
}

function biSetLoading(scope, loading) {
  document.querySelector(`.bi-dashboard--${scope === 'analytics' ? 'monthly' : 'historical'}`)?.classList.toggle('is-loading', loading);
}

function biFilterByMonth(rows, month, getter) { return rows.filter(row => biMonthKey(getter(row)) === month); }

async function loadAnalytics(options = {}) {
  const monthInput = document.getElementById('analytics-month');
  if (!monthInput) return;
  const refreshButton = document.getElementById('analytics-refresh');
  if (!monthInput.value) monthInput.value = getLocalDateKey(new Date()).slice(0, 7);
  monthInput.max = getLocalDateKey(new Date()).slice(0, 7);
  if (!monthInput.dataset.bound) {
    monthInput.dataset.bound = 'true';
    monthInput.addEventListener('change', () => loadAnalytics());
    document.getElementById('analytics-area')?.addEventListener('change', () => renderAnalyticsBi());
    document.getElementById('analytics-compare')?.addEventListener('change', () => renderAnalyticsBi());
    document.getElementById('analytics-flow-metric')?.addEventListener('change', () => renderAnalyticsBi());
    document.getElementById('analytics-refresh')?.addEventListener('click', () => loadAnalytics({ force: true }));
    document.getElementById('analytics-customize')?.addEventListener('click', () => biOpenKpiCustomizer('analytics', biState.analytics?.kpis || [], renderAnalyticsBi));
  }
  if (refreshButton) { refreshButton.disabled = true; refreshButton.classList.add('is-loading'); }
  biSetLoading('analytics', true);
  try {
    const data = await loadBiDataset({ force: Boolean(options.force) });
    const month = monthInput.value;
    const previousMonth = biPreviousMonth(month);
    const current = {
      income: biFilterByMonth(data.income, month, row => row.date), expenses: biFilterByMonth(data.expenses, month, row => row.date),
      projects: biFilterByMonth(data.projects, month, row => row.created_at), clients: biFilterByMonth(data.clients, month, row => row.created_at),
      tasks: data.tasks.filter(row => [biMonthKey(row.created_at), biMonthKey(row.completed_at), biMonthKey(row.due_date)].includes(month)),
      quotes: biFilterByMonth(data.quotes, month, row => row.fecha || row.created_at), docs: biFilterByMonth(data.docs, month, row => row.fecha || row.created_at)
    };
    const previous = {
      income: biFilterByMonth(data.income, previousMonth, row => row.date), expenses: biFilterByMonth(data.expenses, previousMonth, row => row.date),
      projects: biFilterByMonth(data.projects, previousMonth, row => row.created_at), clients: biFilterByMonth(data.clients, previousMonth, row => row.created_at),
      tasks: data.tasks.filter(row => [biMonthKey(row.created_at), biMonthKey(row.completed_at), biMonthKey(row.due_date)].includes(previousMonth))
    };
    const income = biSum(current.income, 'amount'), expenses = biSum(current.expenses, 'amount');
    const previousIncome = biSum(previous.income, 'amount'), previousExpenses = biSum(previous.expenses, 'amount');
    const completed = current.tasks.filter(task => task.completed).length;
    const previousCompleted = previous.tasks.filter(task => task.completed).length;
    biState.analytics = { data, month, current, previous, income, expenses, kpis: [
      { key: 'income', label: 'Ingresos del mes', value: income, previous: previousIncome, format: 'currency', icon: 'arrow-down-left', area: 'finance', tone: 'green', context: 'Finanzas' },
      { key: 'expenses', label: 'Gastos del mes', value: expenses, previous: previousExpenses, format: 'currency', icon: 'arrow-up-right', area: 'finance', tone: 'orange', context: 'Finanzas' },
      { key: 'margin', label: 'Resultado mensual', value: income - expenses, previous: previousIncome - previousExpenses, format: 'currency', icon: 'badge-dollar-sign', area: 'finance', tone: income - expenses < 0 ? 'red' : 'blue', context: 'Margen real' },
      { key: 'projects', label: 'Proyectos creados', value: current.projects.length, previous: previous.projects.length, icon: 'folder-kanban', area: 'projects', tone: 'purple', context: 'Nuevos' },
      { key: 'clients', label: 'Clientes registrados', value: current.clients.length, previous: previous.clients.length, icon: 'user-round-plus', area: 'commercial', tone: 'cyan', context: 'Altas' },
      { key: 'tasks', label: 'Tareas completadas', value: completed, previous: previousCompleted, icon: 'circle-check-big', area: 'operations', tone: 'green', context: `${current.tasks.length} relacionadas` }
    ] };
    renderAnalyticsBi();
  } catch (error) {
    console.error('Error loading analytics BI:', error);
    showToast('No se pudieron cargar las analíticas', 'error');
  } finally {
    biSetLoading('analytics', false);
    if (refreshButton) { refreshButton.disabled = false; refreshButton.classList.remove('is-loading'); }
  }
}

function renderAnalyticsBi() {
  const state = biState.analytics;
  if (!state) return;
  const { data, month, current, income, expenses, kpis } = state;
  const compare = document.getElementById('analytics-compare')?.checked !== false;
  const monthDate = new Date(`${month}-01T12:00:00`);
  const periodName = new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' }).format(monthDate);
  const periodEl = document.getElementById('analytics-period-name'); if (periodEl) periodEl.textContent = periodName.charAt(0).toUpperCase() + periodName.slice(1);
  biRenderKpis(document.getElementById('analytics-bi-kpis'), 'analytics', kpis, compare);
  const days = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const labels = Array.from({ length: days }, (_, index) => String(index + 1));
  const dayValues = rows => labels.map(day => biSum(rows.filter(row => Number(row.date.slice(8, 10)) === Number(day)), 'amount'));
  const flowMetric = document.getElementById('analytics-flow-metric')?.value || 'both';
  const series = [];
  if (flowMetric !== 'expenses') series.push({ label: 'Ingresos', color: '#0d4581', values: dayValues(current.income) });
  if (flowMetric !== 'income') series.push({ label: 'Gastos', color: '#e9952f', values: dayValues(current.expenses) });
  biRenderTrend(document.getElementById('analytics-cashflow-chart'), labels, series);
  const legend = document.getElementById('analytics-cashflow-legend'); if (legend) legend.innerHTML = `<span><i style="background:#0d4581"></i>Ingresos ${formatCurrency(income)}</span><span><i style="background:#e9952f"></i>Gastos ${formatCurrency(expenses)}</span>`;
  biRenderDonut(document.getElementById('analytics-finance-donut'), income, expenses);
  const projectStatuses = biCountBy(current.projects, project => project.status || 'Sin definir');
  biRenderBars(document.getElementById('analytics-project-status'), projectStatuses);
  const quoteValid = current.quotes.filter(quote => !['anulada', 'anulado', 'cancelada', 'cancelado'].includes(String(quote.estado || '').toLowerCase()));
  const accepted = quoteValid.filter(quote => ['aceptada', 'aceptado', 'facturada'].includes(String(quote.estado || '').toLowerCase())).length;
  const billed = current.docs.filter(doc => ['emitida', 'emitido', 'pagada', 'pagado'].includes(String(doc.estado || '').toLowerCase())).length;
  const funnel = document.getElementById('analytics-funnel'); if (funnel) funnel.innerHTML = [{ label: 'Cotizaciones', value: quoteValid.length, color: '#769ec8' }, { label: 'Aceptadas', value: accepted, color: '#2d639d' }, { label: 'Documentadas', value: billed, color: '#0d3867' }].map((item, index, rows) => `<div style="--funnel-width:${Math.max(38, 100 - index * 19)}%;--funnel-color:${item.color}"><span>${item.label}</span><strong>${item.value}</strong><small>${index ? `${rows[index - 1].value ? Math.round((item.value / rows[index - 1].value) * 100) : 0}%` : '100%'}</small></div>`).join('');
  const today = getLocalDateKey(new Date());
  const taskDone = current.tasks.filter(task => task.completed).length;
  const taskOverdue = current.tasks.filter(task => !task.completed && task.due_date && biDateKey(task.due_date) < today).length;
  const taskPending = Math.max(0, current.tasks.length - taskDone - taskOverdue);
  const taskTotal = current.tasks.length || 1;
  const taskEl = document.getElementById('analytics-task-performance'); if (taskEl) taskEl.innerHTML = `<div class="bi-stack"><div><span style="width:${taskDone / taskTotal * 100}%;background:#0d4581"></span><span style="width:${taskPending / taskTotal * 100}%;background:#f0a64a"></span><span style="width:${taskOverdue / taskTotal * 100}%;background:#d14b4b"></span></div><ul><li><i style="background:#0d4581"></i><span>Completadas</span><strong>${taskDone}</strong></li><li><i style="background:#f0a64a"></i><span>Pendientes</span><strong>${taskPending}</strong></li><li><i style="background:#d14b4b"></i><span>Vencidas</span><strong>${taskOverdue}</strong></li></ul></div>`;
  const clientNames = Object.fromEntries(data.clients.map(client => [client.id, client.name || client.company || 'Sin nombre']));
  const clientCounts = biCountBy(current.projects, project => project.clients?.name || project.client_name || clientNames[project.client_id] || 'Sin cliente');
  biRenderRanking(document.getElementById('analytics-client-ranking'), Object.entries(clientCounts).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value })));
  const movements = [...current.income.map(row => ({ ...row, type: 'Ingreso' })), ...current.expenses.map(row => ({ ...row, type: 'Gasto' }))].sort((a, b) => b.date.localeCompare(a.date));
  const movementBody = document.getElementById('analytics-movements'); if (movementBody) movementBody.innerHTML = movements.length ? movements.slice(0, 12).map(row => `<tr><td>${escapeHtml(row.date || '—')}</td><td><span class="bi-type bi-type--${row.type === 'Ingreso' ? 'income' : 'expense'}">${row.type}</span></td><td>${escapeHtml(row.detail)}</td><td>${escapeHtml(biStatusLabel(row.status))}</td><td class="bi-table__number">${formatCurrency(row.amount)}</td></tr>`).join('') : `<tr><td colspan="5">${biEmpty('Sin movimientos en el mes seleccionado')}</td></tr>`;
  const movementCount = document.getElementById('analytics-movement-count'); if (movementCount) movementCount.textContent = `${movements.length} ${movements.length === 1 ? 'registro' : 'registros'}`;
  const area = document.getElementById('analytics-area')?.value || 'all';
  document.querySelectorAll('#page-analytics [data-bi-area]').forEach(item => { item.hidden = area !== 'all' && item.dataset.biArea !== area; });
  if (typeof lucide !== 'undefined') lucide.createIcons();
}


// ==========================================================================
// TEAM
// ==========================================================================
async function loadTeam() {
  const canEditTeam = isAdministrativeRole(getCurrentRole());
  const [{ data: profiles = [] }, { data: teamMembers = [] }] = await Promise.all([
    db.profiles.getAll(),
    db.team.getAll()
  ]);

  const merged = [];
  const usedTeamMemberIds = new Set();

  const normalizeKey = (...parts) => parts
    .filter(Boolean)
    .map(value => String(value).trim().toLowerCase())
    .join('|');

  (profiles || []).forEach(profile => {
    const linkedTeamMember = (teamMembers || []).find(member => member.profile_id === profile.id);
    if (linkedTeamMember?.id) usedTeamMemberIds.add(linkedTeamMember.id);
    merged.push({
      kind: 'profile',
      id: profile.id,
      full_name: profile.full_name,
      email: profile.email,
      role: profile.role,
      position: profile.position,
      avatar_url: profile.avatar_url,
      availability: linkedTeamMember?.availability || null,
      weekly_hours: linkedTeamMember?.weekly_hours ?? null,
      role_title: linkedTeamMember?.role_title || profile.position || profile.role,
      team_member_id: linkedTeamMember?.id || null,
      source_label: linkedTeamMember ? 'Auth + equipo' : 'Auth'
    });
  });

  (teamMembers || []).forEach(member => {
    if (member.id && usedTeamMemberIds.has(member.id)) return;
    const matchedProfile = (profiles || []).find(profile =>
      profile.id === member.profile_id ||
      (profile.email && member.email && profile.email.toLowerCase() === member.email.toLowerCase()) ||
      normalizeKey(profile.full_name, profile.position) === normalizeKey(member.full_name, member.role_title)
    );
    if (matchedProfile) return;
    merged.push({
      kind: 'team_member',
      id: member.id,
      full_name: member.full_name,
      email: member.email || '',
      role: member.role_title || 'team',
      position: member.role_title || '',
      avatar_url: member.avatar_url,
      availability: member.availability || null,
      weekly_hours: member.weekly_hours ?? null,
      role_title: member.role_title || '',
      team_member_id: member.id,
      source_label: 'Equipo'
    });
  });

  const grid = document.querySelector('.team-grid');
  if (!grid) return;

  grid.innerHTML = merged.map(u => {
    const roleValue = u.role || u.role_title || 'team';
    const roleHuman = u.kind === 'profile' ? getRoleLabel(roleValue) : roleValue;
    const editAction = u.kind === 'team_member' ? `editTeamMember('${u.id}')` : `editProfile('${u.id}')`;
    const canDeleteMember = canEditTeam
      && u.id !== currentProfile?.id
      && !isAdministrativeRole(roleValue);
    return `
      <div class="team-member-card">
        ${u.avatar_url ? `<img src="${assetUrl(u.avatar_url)}" alt="" class="team-member-card__avatar">` : `<div class="team-member-card__avatar" style="display:flex;align-items:center;justify-content:center;"><i data-lucide="user" style="width:32px;height:32px;"></i></div>`}
        <h3 class="team-member-card__name">${escapeHtml(u.full_name)}</h3>
        <p class="team-member-card__role">${escapeHtml(roleHuman)}</p>
        <p class="team-member-card__email" style="margin:4px 0;font-size:0.85rem;color:var(--dash-text-secondary);">${escapeHtml(u.email)}</p>
        <div class="team-member-card__stats" style="margin-top:8px;"><div><strong>${u.position ? escapeHtml(u.position) : 'Sin cargo'}</strong><span>Posición</span></div><div><strong>${u.source_label || 'Equipo'}</strong><span>Origen</span></div></div>
        ${canEditTeam ? `<div class="team-member-card__actions" style="margin-top:8px;display:flex;gap:8px;justify-content:center;">
          <button class="btn-dash btn-dash--secondary btn-dash--sm" onclick="${editAction}"><i data-lucide="pencil" style="width:14px;height:14px;"></i> Editar</button>
          ${canDeleteMember ? `<button class="btn-dash btn-dash--danger btn-dash--sm" type="button" data-delete-member-id="${escapeHtml(u.id)}" data-delete-member-kind="${escapeHtml(u.kind)}" data-delete-member-name="${escapeHtml(u.full_name || 'Miembro')}"><i data-lucide="trash-2" style="width:14px;height:14px;"></i> Eliminar</button>` : ''}
        </div>` : ''}
      </div>
    `;
  }).join('');

  grid.querySelectorAll('[data-delete-member-id]').forEach(button => {
    button.addEventListener('click', () => deleteTeamMember(
      button.dataset.deleteMemberId,
      button.dataset.deleteMemberName || 'Miembro',
      button.dataset.deleteMemberKind || 'team_member'
    ));
  });

  if (typeof lucide !== "undefined") setTimeout(() => lucide.createIcons(), 50);
  initAddTeamMemberButton();
}

window.editProfile = async function (profileId) {
  if (!isAdministrativeRole(getCurrentRole())) {
    showToast('Solo administración puede editar miembros del equipo', 'warning');
    return;
  }
  await loadDashboardRoles();
  const targetId = profileId || currentProfile?.id;
  if (!targetId) {
    showToast('Perfil no encontrado', 'error');
    return;
  }

  const { data: profile, error: profileError } = await db.profiles.get(targetId);
  if (profileError || !profile) {
    console.error('Error obteniendo perfil:', profileError);
    showToast('No se pudo cargar el perfil', 'error');
    return;
  }

  const content = `
    <form id="form-edit-profile">
      <div class="modal-form__group">
        <label class="modal-form__label">Nombre completo</label>
        <input type="text" class="modal-form__input" id="edit-profile-full_name" value="${escapeHtml(profile.full_name || '')}" required>
      </div>
      <div class="modal-form__group">
        <label class="modal-form__label">Email</label>
        <input type="email" class="modal-form__input" id="edit-profile-email" value="${escapeHtml(profile.email || '')}" readonly>
      </div>
      <div class="modal-form__group">
        <label class="modal-form__label">Teléfono</label>
        <input type="tel" class="modal-form__input" id="edit-profile-phone" value="${escapeHtml(profile.phone || '')}">
      </div>
      <div class="modal-form__group">
        <label class="modal-form__label">Cargo</label>
        <input type="text" class="modal-form__input" id="edit-profile-position" value="${escapeHtml(profile.position || '')}">
      </div>
      <div class="modal-form__group">
        <label class="modal-form__label">Rol</label>
        <select class="modal-form__input" id="edit-profile-role">${getRoleOptionsHtml(profile.role)}</select>
      </div>
    </form>
  `;

  openModal('Editar perfil', content, 'Guardar', async () => {
    const updates = {
      full_name: document.getElementById('edit-profile-full_name')?.value || profile.full_name,
      phone: document.getElementById('edit-profile-phone')?.value || null,
      position: document.getElementById('edit-profile-position')?.value || null,
      role: document.getElementById('edit-profile-role')?.value || profile.role
    };

    const validRoles = dashboardRoles.map(role => role.slug);
    if (!validRoles.includes(updates.role)) updates.role = 'team';

    const { data, error } = await db.profiles.update(targetId, updates);
    if (error) {
      console.error('Error updating profile:', error);
      showToast('Error actualizando perfil', 'error');
      return;
    }

    // Solo actualizamos context/session si editamos al usuario actual
    if (currentProfile && currentProfile.id === targetId) {
      currentProfile = data;
      const userNameEl = document.getElementById('user-name');
      const userRoleEl = document.getElementById('user-role');
      if (userNameEl) userNameEl.textContent = data.full_name || data.email;
      if (userRoleEl) userRoleEl.textContent = getRoleLabel(data.role);
      await applyRoleRestrictions();
    }

    showToast('Perfil actualizado', 'success');
    closeModal();
    await loadTeam();
  });
};

async function openNewTeamMemberModal(modalTitle = 'Nuevo Miembro del Equipo') {
  if (!isAdministrativeRole(getCurrentRole())) {
    showToast('Solo administración puede crear miembros del equipo', 'warning');
    return;
  }
  await loadDashboardRoles();
  const tempPassword = generateTemporaryPassword();
  const submitText = modalTitle.toLowerCase().includes('empleado') ? 'Crear Empleado' : 'Crear Miembro';
  openModal(modalTitle, `
      <form id="form-add-team-member">
        <div class="modal-form__group">
          <label class="modal-form__label">Nombre completo</label>
          <input type="text" class="modal-form__input" name="full_name" required>
        </div>
        <div class="modal-form__group">
          <label class="modal-form__label">Email</label>
          <input type="email" class="modal-form__input" name="email" required>
        </div>
        <div class="modal-form__group">
          <label class="modal-form__label">Clave temporal</label>
          <input type="text" class="modal-form__input" name="password" value="${escapeHtml(tempPassword)}" required>
        </div>
        <div class="modal-form__group">
          <label class="modal-form__label">Cargo/Rol</label>
          <input type="text" class="modal-form__input" name="role_title" required>
        </div>
        <div class="modal-form__group">
          <label class="modal-form__label">Rol de acceso al dashboard</label>
          <select class="modal-form__input" name="dashboard_role" required>
            ${getRoleOptionsHtml('team')}
          </select>
        </div>
        <div class="modal-form__group">
          <label class="modal-form__label">Teléfono</label>
          <input type="tel" class="modal-form__input" name="phone">
        </div>
        <div class="modal-form__group">
          <label class="modal-form__label">Horas semanales</label>
          <input type="number" class="modal-form__input" name="weekly_hours" min="0" max="60" value="40">
        </div>
        <div class="modal-form__group">
          <label class="modal-form__label">Disponibilidad</label>
          <select class="modal-form__input" name="availability">
            <option value="available">Disponible</option>
            <option value="busy">Ocupado</option>
            <option value="away">Ausente</option>
            <option value="offline">Offline</option>
          </select>
        </div>
      </form>
    `, submitText, async () => {
      const form = document.getElementById('form-add-team-member');
      const formData = new FormData(form);
      const fullName = String(formData.get('full_name') || '').trim();
      const email = String(formData.get('email') || '').trim();
      const password = String(formData.get('password') || '').trim();
      const roleTitle = String(formData.get('role_title') || '').trim();
      const dashboardRole = String(formData.get('dashboard_role') || 'team').trim();
      if (!fullName || !email || !password || !roleTitle) {
        showToast('Completa todos los campos requeridos', 'error');
        return;
      }
      if (!dashboardRoles.some(role => role.slug === dashboardRole)) {
        showToast('Selecciona un rol de acceso válido', 'error');
        return;
      }

      const member = {
        full_name: fullName,
        email,
        role_title: roleTitle,
        phone: formData.get('phone') || null,
        weekly_hours: parseInt(formData.get('weekly_hours')) || 40,
        availability: formData.get('availability')
      };

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, phone, position, avatar_url')
        .eq('email', email)
        .maybeSingle();

      let profileId = existingProfile?.id || null;
      if (!profileId) {
        const { data: authData, error: authError } = await signUp(email, password, {
          full_name: fullName,
          role: dashboardRole
        });
        if (authError) {
          showToast('Error creando acceso: ' + authError.message, 'error');
          return;
        }
        profileId = authData?.user?.id || null;
        if (!profileId) {
          showToast('No se pudo obtener el usuario creado en Auth', 'error');
          return;
        }
      } else {
        const { error: profileUpdateError } = await db.profiles.update(profileId, {
          full_name: fullName,
          phone: member.phone,
          position: roleTitle,
          role: dashboardRole
        });
        if (profileUpdateError) {
          showToast('Error actualizando perfil: ' + profileUpdateError.message, 'error');
          return;
        }
      }

      const { data: existingTeamMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('profile_id', profileId)
        .maybeSingle();

      const payload = {
        profile_id: profileId,
        full_name: member.full_name,
        email: member.email,
        role_title: member.role_title,
        phone: member.phone,
        weekly_hours: member.weekly_hours,
        availability: member.availability
      };

      let teamError = null;
      if (existingTeamMember?.id) {
        ({ error: teamError } = await supabase.from('team_members').update(payload).eq('id', existingTeamMember.id));
      } else {
        ({ error: teamError } = await supabase.from('team_members').insert(payload));
      }

      if (teamError) {
        showToast('Error guardando miembro del equipo: ' + teamError.message, 'error');
        return;
      }

      invalidateModalEntitySearchCache('employee');
      showToast('Miembro agregado y sincronizado con Auth', 'success');
      closeModal();
      await loadTeam();
      await loadRelations();
      if (document.getElementById('page-overview')) await loadOverview();
      db.activity.log({ user_name: currentProfile?.full_name, activity_type: 'team', description: 'agregó miembro al equipo', entity_name: member.full_name || '' });
    });
}

function initAddTeamMemberButton() {
  const btn = document.getElementById('btn-add-team-member');
  if (!btn || btn.dataset.bound || !isAdministrativeRole(getCurrentRole())) return;
  btn.dataset.bound = 'true';
  btn.addEventListener('click', () => openNewTeamMemberModal('Nuevo Miembro del Equipo'));
}

function initAddEmployeeButton() {
  const btn = document.getElementById('btn-add-employee');
  if (!btn || btn.dataset.bound || !isAdministrativeRole(getCurrentRole())) return;
  btn.dataset.bound = 'true';
  btn.addEventListener('click', () => openNewTeamMemberModal('Nuevo empleado'));
}

async function editTeamMember(id) {
  if (!isAdministrativeRole(getCurrentRole())) {
    showToast('Solo administración puede editar miembros del equipo', 'warning');
    return;
  }
  await loadDashboardRoles();
  const { data: member } = await db.team.getById(id);
  if (!member) return;
  let linkedProfile = null;
  if (member.profile_id) {
    const { data } = await db.profiles.get(member.profile_id);
    linkedProfile = data || null;
  }
  if (!linkedProfile && member.email) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', member.email)
      .maybeSingle();
    linkedProfile = data || null;
  }

  openModal('Editar Miembro', `
    <form id="form-edit-team-member">
      <div class="modal-form__group">
        <label class="modal-form__label">Nombre completo</label>
        <input type="text" class="modal-form__input" name="full_name" value="${escapeHtml(member.full_name)}" required>
      </div>
      <div class="modal-form__group">
        <label class="modal-form__label">Email</label>
        <input type="email" class="modal-form__input" name="email" value="${escapeHtml(member.email)}" required>
      </div>
      <div class="modal-form__group">
        <label class="modal-form__label">Cargo/Rol</label>
        <input type="text" class="modal-form__input" name="role_title" value="${escapeHtml(member.role_title)}" required>
      </div>
      ${linkedProfile ? `
        <div class="modal-form__group">
          <label class="modal-form__label">Rol de acceso al dashboard</label>
          <select class="modal-form__input" name="dashboard_role" required>
            ${getRoleOptionsHtml(linkedProfile.role || 'team')}
          </select>
        </div>
      ` : ''}
      <div class="modal-form__group">
        <label class="modal-form__label">Teléfono</label>
        <input type="tel" class="modal-form__input" name="phone" value="${escapeHtml(member.phone || '')}">
      </div>
      <div class="modal-form__group">
        <label class="modal-form__label">Horas semanales</label>
        <input type="number" class="modal-form__input" name="weekly_hours" min="0" max="60" value="${member.weekly_hours || 40}">
      </div>
      <div class="modal-form__group">
        <label class="modal-form__label">Disponibilidad</label>
        <select class="modal-form__input" name="availability">
          <option value="available" ${member.availability === 'available' ? 'selected' : ''}>Disponible</option>
          <option value="busy" ${member.availability === 'busy' ? 'selected' : ''}>Ocupado</option>
          <option value="away" ${member.availability === 'away' ? 'selected' : ''}>Ausente</option>
          <option value="offline" ${member.availability === 'offline' ? 'selected' : ''}>Offline</option>
        </select>
      </div>
    </form>
  `, 'Guardar Cambios', async () => {
    const form = document.getElementById('form-edit-team-member');
    const formData = new FormData(form);
    const updates = {
      full_name: formData.get('full_name'),
      email: formData.get('email'),
      role_title: formData.get('role_title'),
      phone: formData.get('phone') || null,
      weekly_hours: parseInt(formData.get('weekly_hours')) || 40,
      availability: formData.get('availability')
    };

    let dashboardRole = null;
    if (linkedProfile?.id) {
      dashboardRole = String(formData.get('dashboard_role') || linkedProfile.role || 'team').trim();
      if (!dashboardRoles.some(role => role.slug === dashboardRole)) {
        showToast('Selecciona un rol de acceso válido', 'error');
        return;
      }
    }

    const { error } = await supabase.from('team_members').update(updates).eq('id', id);
    if (error) {
      showToast('Error: ' + error.message, 'error');
      return;
    }

    if (linkedProfile?.id) {
      const { error: profileError } = await db.profiles.update(linkedProfile.id, {
        full_name: updates.full_name,
        phone: updates.phone,
        position: updates.role_title,
        role: dashboardRole
      });
      if (profileError) {
        showToast('Miembro actualizado, pero falló el rol de acceso: ' + profileError.message, 'warning');
        return;
      }
    }

    invalidateModalEntitySearchCache('employee');
    showToast('Miembro actualizado', 'success');
    void auditLog('actualizó miembro del equipo', 'team', id, updates.full_name);
    closeModal();
    await loadTeam();
    await loadRelations();
  });
}

async function viewTeamMember(id) {
  const { data: member, error } = await db.team.getById(id);
  if (error || !member) {
    showToast('Empleado no encontrado', 'error');
    return;
  }

  const initials = (member.full_name || '?').split(' ').map(s => s[0]).join('').substring(0, 2).toUpperCase();
  const availability = getEmployeeAvailabilityLabel(member.availability);
  const content = `
    <div style="display:flex;gap:18px;align-items:flex-start;flex-wrap:wrap;">
      <div style="width:88px;height:88px;border-radius:18px;background:var(--dash-surface);display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;color:var(--dash-primary);">
        ${escapeHtml(initials)}
      </div>
      <div style="flex:1;min-width:240px;">
        <h3 style="margin:0 0 6px;">${escapeHtml(member.full_name || '-')}</h3>
        <p style="margin:0 0 8px;color:var(--dash-text-secondary);">${escapeHtml(member.role_title || member.position || 'Empleado')}</p>
        <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;">
          <div><strong>Email</strong><div style="color:var(--dash-text-secondary);">${escapeHtml(member.email || '-')}</div></div>
          <div><strong>Teléfono</strong><div style="color:var(--dash-text-secondary);">${escapeHtml(member.phone || '-')}</div></div>
          <div><strong>Disponibilidad</strong><div style="color:var(--dash-text-secondary);">${escapeHtml(availability || '-')}</div></div>
          <div><strong>Horas semanales</strong><div style="color:var(--dash-text-secondary);">${member.weekly_hours != null ? escapeHtml(String(member.weekly_hours)) : '-'}</div></div>
        </div>
      </div>
    </div>
  `;

  openModal('Empleado', content, null, null, true);
  if (typeof lucide !== 'undefined') setTimeout(() => lucide.createIcons(), 50);
}

function deleteTeamMember() {
  showToast('La eliminación de cuentas se gestiona desde Supabase.', 'info');
}

async function editProject(id) {
  if (!isButtonAllowed('btn-add-project')) return showToast('No tienes permiso para gestionar proyectos', 'warning');
  const { data: project, error } = await db.projects.getById(id);
  if (error || !project) { showToast('Error al cargar proyecto', 'error'); return; }
  // load team members and current project members
  const { data: members } = await db.team.getAll();
  const { data: currentMembers } = await supabase.from('project_members').select('team_member_id').eq('project_id', id);
  const selectedIds = (currentMembers || []).map(m => m.team_member_id);
  const projectClientLabel = project.clients?.company || project.clients?.name || project.client_name || '';
  openModal('Editar Proyecto', `
    <form id="form-edit-project">
      <div class="modal-form__group">
        <label class="modal-form__label">Nombre del proyecto</label>
        <input type="text" class="modal-form__input" name="name" value="${escapeHtml(project.name)}" required>
      </div>
      ${renderEntitySearchPicker({
        rootId: 'edit-proj-client-picker',
        type: 'client',
        label: 'Cliente / contacto',
        placeholder: 'Escribe un nombre o busca cliente registrado',
        selectedId: project.client_id || '',
        selectedLabel: projectClientLabel,
        helperText: 'Puedes escribir un nombre libre. Solo selecciona un cliente si quieres vincularlo a Relaciones.'
      })}
      <div class="modal-form__group">
        <label class="modal-form__label">Descripción</label>
        <textarea class="modal-form__input" name="description" rows="3">${escapeHtml(project.description || '')}</textarea>
      </div>
      <div class="modal-form__group">
        <label class="modal-form__label">Estado</label>
        <select class="modal-form__input" name="status">
          <option value="proposal" ${project.status === 'proposal' ? 'selected' : ''}>Propuesta</option>
          <option value="in_development" ${project.status === 'in_development' ? 'selected' : ''}>En desarrollo</option>
          <option value="review" ${project.status === 'review' ? 'selected' : ''}>En revisión</option>
          <option value="completed" ${project.status === 'completed' ? 'selected' : ''}>Completado</option>
          <option value="paused" ${project.status === 'paused' ? 'selected' : ''}>Pausado</option>
        </select>
      </div>
      <div class="modal-form__group">
        <label class="modal-form__label">Progreso (%)</label>
        <input type="number" class="modal-form__input" name="progress" min="0" max="100" value="${project.progress || 0}">
      </div>
      <div class="modal-form__group">
        <label class="modal-form__label">Fecha estimada de finalización</label>
        <input type="date" class="modal-form__input" name="estimated_end_date" value="${project.estimated_end_date || ''}">
      </div>
      <div class="modal-form__group">
        <label class="modal-form__label">Tecnologías <span style="font-weight:400;color:var(--dash-text-secondary);">(separadas por coma)</span></label>
        <input type="text" class="modal-form__input" name="technologies" value="${escapeHtml((project.technologies || []).join(', '))}" placeholder="React, Node.js, Supabase...">
      </div>
      <div class="modal-form__group"><label class="modal-form__label">Miembros</label>
        <div class="multiselect" id="edit-proj-members">
          <button type="button" class="multiselect__toggle"><span class="multiselect__labels">Seleccionar miembros</span> <span class="multiselect__count">0</span></button>
          <div class="multiselect__dropdown" style="display:none;">
            <input type="text" class="multiselect__search" placeholder="Buscar...">
            <div class="multiselect__list">
              ${members.map(m => `<label class="multiselect__item"><input type="checkbox" value="${m.id}" data-name="${escapeHtml(m.full_name)}" ${selectedIds.includes(m.id) ? 'checked' : ''}> ${escapeHtml(m.full_name)}</label>`).join('')}
            </div>
            <div style="display:flex;gap:8px;padding:8px;border-top:1px solid var(--dash-border);">
              <button type="button" class="multiselect__select-all btn-dash btn-dash--secondary btn-dash--sm">Seleccionar todo</button>
              <button type="button" class="multiselect__clear btn-dash btn-dash--secondary btn-dash--sm">Limpiar</button>
            </div>
          </div>
        </div>
      </div>
    </form>
  `, 'Guardar Cambios', async () => {
    const form = document.getElementById('form-edit-project');
    const formData = new FormData(form);
    const clientId = document.getElementById('edit-proj-client-picker-value')?.value || null;
    const clientName = document.getElementById('edit-proj-client-picker-input')?.value.trim() || null;
    const updates = {
      name: formData.get('name'),
      client_id: clientId,
      client_name: clientName,
      description: formData.get('description'),
      status: formData.get('status'),
      progress: parseInt(formData.get('progress')) || 0,
      estimated_end_date: formData.get('estimated_end_date') || null,
      technologies: (formData.get('technologies') || '').split(',').map(t => t.trim()).filter(Boolean)
    };
    const { error } = await db.projects.update(id, updates);
    if (error) showToast('Error: ' + error.message, 'error');
    else {
      // update project_members: remove existing and insert selected
      try {
        await supabase.from('project_members').delete().eq('project_id', id);
        const container = document.getElementById('edit-proj-members');
        if (container) {
          const checked = container.querySelectorAll('input[type="checkbox"]:checked');
          if (checked.length) {
            const inserts = Array.from(checked).map(o => ({ project_id: id, team_member_id: o.value }));
            await supabase.from('project_members').insert(inserts);
          }
        }
      } catch (pmErr) {
        console.warn('Error updating project members:', pmErr);
      }
      showToast('Proyecto actualizado', 'success');
      void auditLog('actualizó proyecto', 'project', id, updates.name);
      closeModal();
      await loadProjects();
      if (document.getElementById('page-overview')) await loadOverview();
    }
  });
  // initialize multiselect UI
  setTimeout(() => {
    try {
      initMemberMultiSelectById('edit-proj-members', selectedIds || []);
      const wrap = document.getElementById('edit-proj-members');
      if (wrap) {
        wrap.querySelector('.multiselect__select-all')?.addEventListener('click', () => { wrap.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true); wrap.querySelectorAll('input[type="checkbox"]')[0]?.dispatchEvent(new Event('change')); });
        wrap.querySelector('.multiselect__clear')?.addEventListener('click', () => { wrap.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false); wrap.querySelectorAll('input[type="checkbox"]')[0]?.dispatchEvent(new Event('change')); });
      }
    } catch (e) { /* noop */ }
  }, 50);
}

function deleteProject(id, name) {
  if (!isButtonAllowed('btn-add-project')) return showToast('No tienes permiso para gestionar proyectos', 'warning');
  openModal('Eliminar Proyecto', `<p>¿Estás seguro de eliminar el proyecto <strong>${escapeHtml(name)}</strong>? Esta acción no se puede deshacer.</p>`, 'Eliminar', async () => {
    const { error } = await db.projects.delete(id);
    if (error) { showToast('Error: ' + error.message, 'error'); return; }
    closeModal();
    showToast(`Proyecto "${name}" eliminado`, 'success');
    await loadProjects();
    if (document.getElementById('page-overview')) await loadOverview();
    db.activity.log({ user_name: currentProfile?.full_name, activity_type: 'project', description: 'eliminó proyecto', entity_name: name });
  });
}

// ==========================================================================
// SETTINGS
// ==========================================================================
function renderRoleCheckboxes(items, selectedIds, attrName) {
  const selected = new Set(selectedIds || []);
  const groups = items.reduce((acc, item) => {
    const group = item.group || 'General';
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});

  return Object.entries(groups).map(([group, groupItems]) => `
    <div style="margin-bottom:10px;">
      <div style="font-size:0.68rem;font-weight:700;text-transform:uppercase;color:var(--dash-text-muted);padding:4px 8px;">${escapeHtml(group)}</div>
      ${groupItems.map(item => `
        <label class="role-permission-check">
          <input type="checkbox" value="${escapeHtml(item.id)}" data-${attrName}="role" ${selected.has(item.id) ? 'checked' : ''}>
          <span>${escapeHtml(item.label)}</span>
        </label>
      `).join('')}
    </div>
  `).join('');
}

function renderRoleForm(role = null) {
  const isEditing = Boolean(role);
  const slug = role?.slug || '';
  return `
    <form id="role-form">
      <div class="role-form-grid">
        <div class="modal-form__group">
          <label class="modal-form__label">Nombre del rol</label>
          <input type="text" class="modal-form__input" id="role-name" value="${escapeHtml(role?.name || '')}" placeholder="Ej: Comercial" required>
        </div>
        <div class="modal-form__group">
          <label class="modal-form__label">Identificador</label>
          <input type="text" class="modal-form__input" id="role-slug" value="${escapeHtml(slug)}" ${isEditing ? 'readonly' : ''} placeholder="comercial">
        </div>
        <div class="modal-form__group modal-form__group--full">
          <label class="modal-form__label">Descripción</label>
          <textarea class="modal-form__textarea" id="role-description" rows="2" placeholder="Qué tipo de acceso tendrá este rol">${escapeHtml(role?.description || '')}</textarea>
        </div>
      </div>
      <div class="role-permissions-editor">
        <div class="role-permission-panel">
          <div class="role-permission-panel__header">Secciones visibles</div>
          <div class="role-permission-panel__body">
            ${renderRoleCheckboxes(DASHBOARD_PAGES, role?.pages || [], 'role-page')}
          </div>
        </div>
        <div class="role-permission-panel">
          <div class="role-permission-panel__header">Acciones permitidas</div>
          <div class="role-permission-panel__body">
            ${renderRoleCheckboxes(DASHBOARD_ACTIONS, role?.buttons || [], 'role-action')}
          </div>
        </div>
      </div>
    </form>
  `;
}

function renderRolesTable() {
  const container = document.getElementById('roles-table');
  if (!container) return;
  const canManage = canManageRoles();

  if (!dashboardRoles.length) {
    container.innerHTML = '<p style="color:var(--dash-text-secondary);padding:1rem;">No hay roles creados.</p>';
    return;
  }

  container.innerHTML = `
    <div class="roles-table__header">
      <span>Rol</span>
      <span>Secciones</span>
      <span>Acciones</span>
      <span>Gestionar</span>
    </div>
    ${dashboardRoles.map(role => {
      const pages = (role.pages || []).map(id => DASHBOARD_PAGES.find(page => page.id === id)?.label).filter(Boolean);
      const actions = (role.buttons || []).map(id => DASHBOARD_ACTIONS.find(action => action.id === id)?.label).filter(Boolean);
      return `
        <div class="roles-table__row">
          <div class="roles-table__name">
            <strong>${escapeHtml(role.name || role.slug)}</strong>
            <span>${escapeHtml(role.description || role.slug)}${role.is_system ? ' · Sistema' : ''}</span>
          </div>
          <div class="roles-table__badges">
            <span class="role-permission-badge">${pages.length} secciones</span>
          </div>
          <div class="roles-table__meta">${escapeHtml(actions.slice(0, 3).join(', ') || 'Sin acciones')}</div>
          <div class="table-actions">
            ${canManage ? `<button class="table-action-btn" onclick="window.openRoleModal('${escapeHtml(role.slug)}')" title="Editar rol"><i data-lucide="pencil"></i></button>
            <button class="table-action-btn table-action-btn--danger" onclick="window.deleteRoleConfirm('${escapeHtml(role.slug)}')" title="Eliminar rol" ${role.is_system ? 'disabled' : ''}><i data-lucide="trash-2"></i></button>` : '<span class="roles-table__meta">Solo lectura</span>'}
          </div>
        </div>
      `;
    }).join('')}
  `;

  if (typeof lucide !== 'undefined') setTimeout(() => lucide.createIcons(), 50);
}

async function refreshRolePermissions() {
  await refreshCurrentAccess();
}

window.openRoleModal = function openRoleModal(slug = null) {
  if (!canManageRoles()) {
    showToast('No tienes permiso para gestionar roles', 'warning');
    return;
  }

  const role = slug ? dashboardRoles.find(item => item.slug === slug) : null;
  openModal(role ? 'Editar rol' : 'Nuevo rol', renderRoleForm(role), 'Guardar rol', async () => {
    const payload = buildRolePayloadFromForm('role');
    if (!payload.name || !payload.slug) {
      showToast('El rol necesita nombre e identificador', 'error');
      return;
    }
    if (!payload.pages.includes('settings')) payload.pages.push('settings');

    const existing = dashboardRoles.find(item => item.slug === payload.slug);
    if (!role && existing) {
      showToast('Ya existe un rol con ese identificador', 'error');
      return;
    }

    const finalPayload = {
      ...payload,
      is_system: role?.is_system || false
    };
    const { error } = await db.roles.upsert(finalPayload);
    if (error) {
      showToast('Error guardando rol: ' + error.message, 'error');
      return;
    }

    await auditLog(`${role ? 'Editó' : 'Creó'} rol ${payload.name}`, 'general', null, payload.slug);
    closeModal();
    await refreshRolePermissions();
    showToast('Rol guardado', 'success');
  });
};

window.deleteRoleConfirm = function deleteRoleConfirm(slug) {
  if (!canManageRoles()) {
    showToast('No tienes permiso para eliminar roles', 'warning');
    return;
  }

  const role = dashboardRoles.find(item => item.slug === slug);
  if (!role) return;
  if (role.is_system) {
    showToast('Los roles de sistema no se pueden eliminar', 'warning');
    return;
  }

  openModal('Eliminar rol', `<p>¿Estás seguro de eliminar el rol <strong>${escapeHtml(role.name)}</strong>? Los usuarios con este rol pasarán a Miembro.</p>`, 'Eliminar', async () => {
    const { data: assignedProfiles } = await supabase.from('profiles').select('id').eq('role', slug);
    if (assignedProfiles?.length) {
      await supabase.from('profiles').update({ role: 'team' }).eq('role', slug);
    }
    const { error } = await db.roles.delete(slug);
    if (error) {
      showToast('Error eliminando rol: ' + error.message, 'error');
      return;
    }
    closeModal();
    await refreshRolePermissions();
    showToast('Rol eliminado', 'success');
  });
};

async function loadSiteMessages() {
  const tbody = document.getElementById('site-messages-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--dash-text-secondary);padding:2rem;">Cargando mensajes...</td></tr>';
  try {
    const { data, error } = await db.siteMessages.getAll();
    if (error) throw error;
    const messages = data || [];
    if (!messages.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--dash-text-secondary);padding:2rem;">Aún no hay mensajes de contacto.</td></tr>';
      return;
    }
    const canManageMessages = isButtonAllowed('btn-site-refresh-messages');
    tbody.innerHTML = messages.map(message => `
      <tr>
        <td>${message.created_at ? new Date(message.created_at).toLocaleString('es-CL') : '-'}</td>
        <td><strong>${escapeHtml(message.name || '-')}</strong><br><small>${escapeHtml(message.company || '')}</small></td>
        <td>${escapeHtml(message.email || '-')}</td>
        <td>${escapeHtml(message.phone || '-')}</td>
        <td>${escapeHtml(message.service || '-')}<br><small>${escapeHtml(message.budget || '')}</small></td>
        <td><div class="site-message-preview" title="${escapeHtml(message.message || '')}">${escapeHtml(message.message || '')}</div></td>
        <td><span class="status-badge status-badge--${message.status === 'read' ? 'completed' : 'pending'}">${message.status === 'read' ? 'Leído' : 'Nuevo'}</span></td>
        <td><div class="table-actions">
          <button class="table-action-btn" title="Ver" onclick="viewSiteMessage('${message.id}')"><i data-lucide="eye" style="width:15px;height:15px;"></i></button>
          <button class="table-action-btn" title="Responder por WhatsApp" onclick="openWhatsAppLead('${message.id}')"><i data-lucide="message-circle" style="width:15px;height:15px;"></i></button>
          ${canManageMessages ? `<button class="table-action-btn" title="Marcar leído" onclick="markSiteMessageRead('${message.id}')"><i data-lucide="check" style="width:15px;height:15px;"></i></button>
          <button class="table-action-btn table-action-btn--danger" title="Eliminar" onclick="deleteSiteMessageConfirm('${message.id}')"><i data-lucide="trash-2" style="width:15px;height:15px;"></i></button>` : ''}
        </div></td>
      </tr>
    `).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--dash-danger);padding:2rem;">No se pudieron cargar mensajes. Revisa si existe la tabla site_messages.</td></tr>';
  }
}

function initSiteMessagesPage() {
  const refreshMessagesBtn = document.getElementById('btn-site-refresh-messages');
  if (refreshMessagesBtn && !refreshMessagesBtn.dataset.bound) {
    refreshMessagesBtn.dataset.bound = 'true';
    refreshMessagesBtn.addEventListener('click', loadSiteMessages);
  }
}

window.viewSiteMessage = async function viewSiteMessage(id) {
  const { data } = await db.siteMessages.getAll();
  const message = (data || []).find(item => item.id === id);
  if (!message) return;
  if (message.status === 'new') await db.siteMessages.updateStatus(id, 'read');
  const metadata = message.metadata && typeof message.metadata === 'object' ? message.metadata : {};
  const attribution = [
    metadata.utm_source && `Origen: ${metadata.utm_source}`,
    metadata.utm_medium && `Medio: ${metadata.utm_medium}`,
    metadata.utm_campaign && `Campaña: ${metadata.utm_campaign}`,
    metadata.referrer && `Referencia: ${metadata.referrer}`
  ].filter(Boolean).join(' · ');
  openModal('Mensaje de contacto', `
    <div style="display:grid;gap:12px;">
      <p><strong>Nombre:</strong> ${escapeHtml(message.name || '-')}</p>
      <p><strong>Email:</strong> ${escapeHtml(message.email || '-')}</p>
      <p><strong>Teléfono:</strong> ${escapeHtml(message.phone || '-')}</p>
      <p><strong>Empresa:</strong> ${escapeHtml(message.company || '-')}</p>
      <p><strong>Servicio:</strong> ${escapeHtml(message.service || '-')}</p>
      <p><strong>Inversión:</strong> ${escapeHtml(message.budget || '-')}</p>
      <p><strong>Mensaje:</strong></p>
      <p style="white-space:pre-wrap;color:var(--dash-text-secondary);">${escapeHtml(message.message || '')}</p>
      ${attribution ? `<p><strong>Atribución:</strong> ${escapeHtml(attribution)}</p>` : ''}
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px;">
        <button type="button" class="btn-dash btn-dash--primary" onclick="openWhatsAppLead('${message.id}')"><i data-lucide="message-circle"></i> Responder por WhatsApp</button>
        <button type="button" class="btn-dash btn-dash--secondary" onclick="copyLeadFollowUp('${message.id}')"><i data-lucide="copy"></i> Copiar seguimiento</button>
      </div>
    </div>
  `, null, null, true);
  await Promise.all([loadSiteMessages(), updateSidebarBadges()]);
};

window.markSiteMessageRead = async function markSiteMessageRead(id) {
  if (!isButtonAllowed('btn-site-refresh-messages')) return showToast('No tienes permiso para gestionar mensajes', 'warning');
  const { error } = await db.siteMessages.updateStatus(id, 'read');
  if (error) showToast('No se pudo actualizar el mensaje', 'error');
  else {
    showToast('Mensaje marcado como leído', 'success');
    await Promise.all([loadSiteMessages(), updateSidebarBadges()]);
  }
};

window.deleteSiteMessageConfirm = function deleteSiteMessageConfirm(id) {
  if (!isButtonAllowed('btn-site-refresh-messages')) return showToast('No tienes permiso para gestionar mensajes', 'warning');
  openModal('Eliminar mensaje', '<p>¿Eliminar este mensaje de contacto?</p>', 'Eliminar', async () => {
    const { error } = await db.siteMessages.delete(id);
    if (error) showToast('No se pudo eliminar el mensaje', 'error');
    else {
      closeModal();
      showToast('Mensaje eliminado', 'success');
      loadSiteMessages();
    }
  });
};

async function loadSettings() {
  if (!currentProfile) return;
  await loadDashboardRoles();
  renderRolesTable();

  const addRoleBtn = document.getElementById('btn-add-role');
  if (addRoleBtn) addRoleBtn.style.display = canManageRoles() ? '' : 'none';
  if (addRoleBtn && !addRoleBtn.dataset.bound) {
    addRoleBtn.dataset.bound = 'true';
    addRoleBtn.addEventListener('click', () => window.openRoleModal());
  }

  const inputs = document.querySelectorAll('#page-settings .settings-input');
  if (inputs[0]) inputs[0].value = currentProfile.full_name || '';
  if (inputs[1]) inputs[1].value = currentProfile.email || '';
  if (inputs[2]) inputs[2].value = currentProfile.phone || '';
  if (inputs[3]) inputs[3].value = currentProfile.position || (currentProfile.role === 'admin' ? 'Administrador' : 'Cliente');

  const saveBtn = document.getElementById('btn-save-settings-profile');
  const canEditProfileSettings = isAdministrativeRole(getCurrentRole());

  if (!canEditProfileSettings) {
    inputs.forEach(i => { i.disabled = true; i.classList.add('settings-input--readonly'); });
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.style.display = 'none';
      saveBtn.title = 'No tienes permiso para editar esta sección';
      saveBtn.classList.add('btn-dash--disabled');
    }
  } else {
    inputs.forEach(i => { i.disabled = false; i.classList.remove('settings-input--readonly'); });
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.style.display = '';
      saveBtn.title = '';
      saveBtn.classList.remove('btn-dash--disabled');
    }
    if (saveBtn && !saveBtn.dataset.bound) {
      saveBtn.dataset.bound = 'true';
      saveBtn.addEventListener('click', async () => {
        if (!isAdministrativeRole(getCurrentRole())) {
          showToast('Solo administración puede modificar perfiles', 'warning');
          return;
        }
        const { data, error } = await db.profiles.update(currentProfile.id, {
          full_name: inputs[0]?.value || currentProfile.full_name,
          phone: inputs[2]?.value || null,
          position: inputs[3]?.value || null
        });
        if (error) showToast('Error: ' + error.message, 'error');
        else {
          currentProfile = data;
          const un = document.getElementById('user-name');
          if (un) un.textContent = data.full_name;
          showToast('Configuración guardada', 'success');
        }
      });
    }
  }

  applyRoleRestrictions();
}

// ==========================================================================
// SEARCH
// ==========================================================================
let globalSearchCache = null;
let globalSearchCacheTime = 0;

function normalizeGlobalSearchText(value) {
  return String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

async function getGlobalSearchEntities() {
  const now = Date.now();
  if (globalSearchCache && now - globalSearchCacheTime < 30000) return globalSearchCache;
  const [projectsResult, clientsResult] = await Promise.all([
    isPageAllowed('projects') ? db.projects.getAll() : Promise.resolve({ data: [], error: null }),
    isPageAllowed('relations') ? db.clients.getAll() : Promise.resolve({ data: [], error: null })
  ]);
  globalSearchCache = {
    projects: projectsResult.error ? [] : (projectsResult.data || []),
    clients: clientsResult.error ? [] : (clientsResult.data || [])
  };
  globalSearchCacheTime = now;
  return globalSearchCache;
}

function initSearch() {
  const input = document.getElementById('global-search');
  const wrap = document.getElementById('global-search-wrap');
  const panel = document.getElementById('global-search-results');
  if (!input || !wrap || !panel) return;

  const pageAliases = {
    overview: 'inicio resumen panel dashboard', projects: 'proyecto proyectos', tasks: 'tarea tareas',
    relations: 'cliente clientes proveedor proveedores relacion relaciones', sii: 'sii finanzas factura facturas',
    quotes: 'cotizacion cotizaciones presupuesto', payments: 'pago pagos', taxes: 'impuesto impuestos f22 f29',
    expenses: 'gasto gastos', calendar: 'calendario agenda evento', orders: 'ticket tickets soporte',
    'service-orders': 'orden ordenes servicio', maintenance: 'facturacion mantenimiento mensualidad',
    requirements: 'requisitos requerimientos ficha levantamiento', analytics: 'analitica analiticas', reports: 'reporte reportes informe informes',
    team: 'equipo persona personas', settings: 'configuracion ajustes',
    messages: 'mensaje mensajes contacto'
  };
  let results = [];
  let activeIndex = -1;
  let requestId = 0;
  let debounceTimer = null;

  const close = () => {
    panel.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    results = [];
    activeIndex = -1;
  };

  const showState = message => {
    results = [];
    activeIndex = -1;
    panel.replaceChildren();
    const state = document.createElement('div');
    state.className = 'global-search-state';
    state.textContent = message;
    panel.appendChild(state);
    panel.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  };

  const setActive = index => {
    const options = Array.from(panel.querySelectorAll('.global-search-result'));
    if (!options.length) return;
    activeIndex = (index + options.length) % options.length;
    options.forEach((option, optionIndex) => {
      const isActive = optionIndex === activeIndex;
      option.classList.toggle('is-active', isActive);
      option.setAttribute('aria-selected', String(isActive));
    });
    const active = options[activeIndex];
    input.setAttribute('aria-activedescendant', active.id);
    active.scrollIntoView({ block: 'nearest' });
  };

  const openResult = async result => {
    close();
    input.value = '';
    if (result.type === 'page') return navigateTo(result.page);
    if (result.type === 'project') {
      await navigateTo('projects');
      return viewProject(result.id);
    }
    await navigateTo('relations');
    return viewClient(result.id, 'client');
  };

  const renderResults = items => {
    results = items;
    activeIndex = -1;
    panel.replaceChildren();
    if (!items.length) {
      showState('No encontramos proyectos, clientes ni secciones con ese nombre.');
      return;
    }
    items.forEach((result, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.id = `global-search-option-${index}`;
      button.className = 'global-search-result';
      button.setAttribute('role', 'option');
      button.setAttribute('aria-selected', 'false');
      const icon = document.createElement('span');
      icon.className = 'global-search-result__icon';
      icon.innerHTML = `<i data-lucide="${result.icon}"></i>`;
      const copy = document.createElement('span');
      copy.className = 'global-search-result__copy';
      const title = document.createElement('span');
      title.className = 'global-search-result__title';
      title.textContent = result.title;
      const meta = document.createElement('span');
      meta.className = 'global-search-result__meta';
      meta.textContent = result.meta;
      copy.append(title, meta);
      button.append(icon, copy);
      button.addEventListener('mouseenter', () => setActive(index));
      button.addEventListener('click', () => openResult(result));
      panel.appendChild(button);
    });
    panel.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  };

  const search = async rawQuery => {
    const query = normalizeGlobalSearchText(rawQuery);
    const currentRequest = ++requestId;
    if (!query) return close();
    showState('Buscando…');
    try {
      const entities = await getGlobalSearchEntities();
      if (currentRequest !== requestId || query !== normalizeGlobalSearchText(input.value)) return;
      const pageResults = DASHBOARD_PAGES
        .filter(page => isPageAllowed(page.id))
        .filter(page => normalizeGlobalSearchText(`${page.label} ${page.group} ${pageAliases[page.id] || ''}`).includes(query))
        .map(page => ({ type: 'page', page: page.id, title: page.label, meta: `Sección · ${page.group}`, icon: 'layout-dashboard' }));
      const projectResults = (isPageAllowed('projects') ? entities.projects : [])
        .filter(project => normalizeGlobalSearchText([project.name, project.client_name, project.clients?.name, project.clients?.company, ...(project.technologies || [])].filter(Boolean).join(' ')).includes(query))
        .map(project => ({ type: 'project', id: project.id, title: project.name || 'Proyecto sin nombre', meta: `Proyecto · ${project.client_name || project.clients?.company || project.clients?.name || 'Sin cliente'}`, icon: 'folder-kanban' }));
      const clientResults = (isPageAllowed('relations') ? entities.clients : [])
        .filter(client => normalizeGlobalSearchText([client.name, client.company, client.email, client.rut].filter(Boolean).join(' ')).includes(query))
        .map(client => ({ type: 'client', id: client.id, title: client.company || client.name || 'Cliente sin nombre', meta: `Cliente · ${client.company && client.name ? client.name : (client.email || 'Sin contacto')}`, icon: 'building-2' }));
      renderResults([...projectResults, ...clientResults, ...pageResults].slice(0, 10));
    } catch (error) {
      console.error('Error en la búsqueda global:', error);
      if (currentRequest === requestId) showState('No se pudo completar la búsqueda. Intenta nuevamente.');
    }
  };

  input.addEventListener('input', () => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => search(input.value), 180);
  });
  input.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive(activeIndex + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive(activeIndex - 1);
    } else if (event.key === 'Enter' && results.length) {
      event.preventDefault();
      openResult(results[activeIndex >= 0 ? activeIndex : 0]);
    } else if (event.key === 'Escape') {
      close();
    }
  });
  input.addEventListener('focus', () => { if (input.value.trim()) search(input.value); });
  document.addEventListener('click', event => { if (!wrap.contains(event.target)) close(); });
}

// ==========================================================================
// TABLE DRAG SCROLL
// ==========================================================================
function initTableDragScroll() {
  if (document.documentElement.dataset.tableDragScrollInitialized === 'true') return;
  document.documentElement.dataset.tableDragScrollInitialized = 'true';

  const interactiveSelector = 'a, button, input, select, textarea, label, summary, [role="button"], [contenteditable="true"]';
  let dragState = null;

  document.addEventListener('pointerdown', event => {
    if (event.button !== 0 || event.pointerType === 'touch') return;
    const scroller = event.target.closest?.('.table-responsive');
    if (!scroller || event.target.closest?.(interactiveSelector)) return;
    if (scroller.scrollWidth <= scroller.clientWidth + 1) return;

    dragState = {
      scroller,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: scroller.scrollLeft,
      moved: false
    };
    scroller.setPointerCapture?.(event.pointerId);
  });

  document.addEventListener('pointermove', event => {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    if (!dragState.moved && Math.abs(deltaX) < 5 && Math.abs(deltaY) < 5) return;

    dragState.moved = true;
    dragState.scroller.classList.add('is-dragging');
    dragState.scroller.scrollLeft = dragState.scrollLeft - deltaX;
    if (Math.abs(deltaX) > Math.abs(deltaY)) event.preventDefault();
  }, { passive: false });

  const stopDragging = event => {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    const { scroller, moved } = dragState;
    scroller.classList.remove('is-dragging');
    scroller.releasePointerCapture?.(event.pointerId);
    dragState = null;

    if (moved) {
      scroller.addEventListener('click', clickEvent => {
        clickEvent.preventDefault();
        clickEvent.stopPropagation();
      }, { capture: true, once: true });
    }
  };

  document.addEventListener('pointerup', stopDragging);
  document.addEventListener('pointercancel', stopDragging);
}

// ==========================================================================
// LOGOUT
// ==========================================================================
function initLogout() {
  const btn = document.getElementById('logout-btn');
  if (btn) {
    btn.addEventListener('click', async () => {
      await signOut();
      localStorage.removeItem('ntek_user');
      window.location.href = '/login';
    });
  }
}

// ==========================================================================
// MODAL SYSTEM
// ==========================================================================
function initModalSystem() {
  const modal = document.getElementById('dash-modal');
  const modalClose = document.getElementById('modal-close');
  const modalCancel = document.getElementById('modal-cancel');
  const backdrop = modal?.querySelector('.dash-modal__backdrop');
  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalCancel) modalCancel.addEventListener('click', closeModal);
  if (backdrop) backdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal?.classList.contains('show')) closeModal(); });
}

function openModal(title, bodyHtml, confirmTextOrCallback, onConfirmCb, hideFooter, hideCancel = false) {
  const modal = document.getElementById('dash-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const modalFooter = document.getElementById('modal-footer');
  const modalConfirm = document.getElementById('modal-confirm');
  if (!modal) return;
  modalTitle.textContent = title;
  modalBody.innerHTML = bodyHtml;
  modal.classList.add('show');
  window.setTimeout(() => initModalEntityPickers(), 0);

  // Support both openModal(title, html, callback) and openModal(title, html, btnText, callback)
  let onConfirm, confirmText;
  if (typeof confirmTextOrCallback === 'function') {
    onConfirm = confirmTextOrCallback;
    confirmText = 'Confirmar';
  } else {
    confirmText = confirmTextOrCallback || 'Confirmar';
    onConfirm = onConfirmCb;
  }

  // Hide footer if requested
  if (hideFooter) {
    modalFooter.style.display = 'none';
  } else {
    // Ensure footer and buttons are visible
    modalFooter.style.display = 'flex';
    modalFooter.style.visibility = 'visible';
    // Replace confirm button (clone to remove previous listeners) and ensure it's visible
    const nc = modalConfirm.cloneNode(true);
    nc.textContent = confirmText;
    if (modalConfirm && modalConfirm.parentNode) modalConfirm.parentNode.replaceChild(nc, modalConfirm);
    nc.id = 'modal-confirm';
    nc.style.display = '';
    if (onConfirm) nc.addEventListener('click', onConfirm);
    // Ensure cancel button is visible or hidden
    const cancelBtn = modalFooter.querySelector('#modal-cancel');
    if (cancelBtn) cancelBtn.style.display = hideCancel ? 'none' : '';
  }
}

function closeModal() {
  const modal = document.getElementById('dash-modal');
  if (!modal) return;
  modal.classList.remove('show');
  const modalContentEl = modal.querySelector('.dash-modal__content');
  if (modalContentEl) modalContentEl.classList.remove('dash-modal__content--fullscreen', 'service-order-modal');
}

const modalEntitySearchConfigs = {};
const modalEntitySearchCache = {};

function invalidateModalEntitySearchCache(...types) {
  const dependentCaches = {
    client: ['client', 'payment-party'],
    provider: ['provider', 'payment-party'],
    project: ['project'],
    employee: ['employee', 'payment-party']
  };

  if (!types.length) {
    Object.keys(modalEntitySearchCache).forEach(key => delete modalEntitySearchCache[key]);
    return;
  }

  types
    .flatMap(type => dependentCaches[type] || [type])
    .forEach(type => delete modalEntitySearchCache[type]);
}

function normalizeSearchableText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function getEntitySearchLabel(type, record) {
  if (!record) return '';
  switch (type) {
    case 'client':
      return record.company || record.name || '';
    case 'provider':
      return record.company || record.name || '';
    case 'project':
      return record.name || '';
    case 'employee':
      return record.empleado || record.full_name || record.name || '';
    default:
      return record.name || record.title || '';
  }
}

function getEntitySearchSubtext(type, record) {
  if (!record) return '';
  switch (type) {
    case 'client':
    case 'provider':
      return [record.rut, record.email, record.city || record.region].filter(Boolean).join(' · ');
    case 'project':
      return [record.client_name || record.client_company || record.client, record.status].filter(Boolean).join(' · ');
    case 'employee':
      return [record.rut, record.cargo || record.role_title, record.email].filter(Boolean).join(' · ');
    default:
      return [record.rut, record.email].filter(Boolean).join(' · ');
  }
}

function getEntitySearchText(type, record) {
  return normalizeSearchableText([
    getEntitySearchLabel(type, record),
    getEntitySearchSubtext(type, record),
    record?.rut,
    record?.email,
    record?.phone,
    record?.city,
    record?.region,
    record?.client_name,
    record?.client_company,
    record?.cargo,
    record?.role_title,
    record?.bank,
    record?.account_number
  ].filter(Boolean).join(' '));
}

async function loadEntitySearchItems(type) {
  if (modalEntitySearchCache[type]) return modalEntitySearchCache[type];

  let items = [];
  if (type === 'client') {
    const { data } = await db.clients.getAll();
    items = (data || []).map(record => ({ record, id: record.id, label: getEntitySearchLabel(type, record), subtext: getEntitySearchSubtext(type, record), searchText: getEntitySearchText(type, record) }));
  } else if (type === 'provider') {
    const { data } = await db.providers.getAll();
    items = (data || []).map(record => ({ record, id: record.id, label: getEntitySearchLabel(type, record), subtext: getEntitySearchSubtext(type, record), searchText: getEntitySearchText(type, record) }));
  } else if (type === 'project') {
    const { data } = await db.projects.getAll();
    items = (data || []).map(record => ({ record, id: record.id, label: getEntitySearchLabel(type, record), subtext: getEntitySearchSubtext(type, record), searchText: getEntitySearchText(type, record) }));
  } else if (type === 'employee') {
    const [{ data: contractPeople = [] }, { data: teamMembers = [] }] = await Promise.all([
      supabase
        .from('contratos_personal')
        .select('id, empleado, rut, email, telefono, cargo, bank, account_type, account_number, sueldo_bruto, sueldo_liquido')
        .order('empleado', { ascending: true }),
      db.team.getAll()
    ]);

    const seen = new Set();
    const contractItems = (contractPeople || []).map(record => {
      const label = getEntitySearchLabel(type, record);
      const key = normalizeSearchableText(`${label} ${record.rut || ''}`);
      if (!label || seen.has(key)) return null;
      seen.add(key);
      return {
        record,
        id: record.id,
        label: `${label} · Empleado`,
        subtext: getEntitySearchSubtext(type, record),
        searchText: getEntitySearchText(type, record)
      };
    }).filter(Boolean);

    const teamItems = (teamMembers || []).map(record => {
      const label = getEntitySearchLabel(type, record);
      const key = normalizeSearchableText(`${label} ${record.email || record.phone || ''}`);
      if (!label || seen.has(key)) return null;
      seen.add(key);
      return {
        record,
        id: record.id,
        label: `${label} · Empleado`,
        subtext: getEntitySearchSubtext(type, record),
        searchText: getEntitySearchText(type, record)
      };
    }).filter(Boolean);

    items = [...contractItems, ...teamItems];
  } else if (type === 'payment-party') {
    const [contractPeopleRes, providersRes, clientsRes] = await Promise.all([
      supabase
        .from('contratos_personal')
        .select('id, empleado, rut, email, telefono, cargo, bank, account_type, account_number, sueldo_bruto, sueldo_liquido')
        .order('empleado', { ascending: true }),
      db.providers.getAll(),
      db.clients.getAll()
    ]);

    const seen = new Set();
    const employeeItems = (contractPeopleRes.data || []).map(record => {
      const label = getEntitySearchLabel('employee', record);
      const key = normalizeSearchableText(`${label} ${record.rut || ''}`);
      if (!label || seen.has(key)) return null;
      seen.add(key);
      return {
        record: { ...record, entity_kind: 'employee' },
        id: record.id,
        label: `${label} · Empleado`,
        subtext: getEntitySearchSubtext('employee', record),
        searchText: getEntitySearchText('employee', record)
      };
    }).filter(Boolean);

    const providerItems = (providersRes.data || []).map(record => {
      const label = getEntitySearchLabel('provider', record);
      const key = normalizeSearchableText(`${label} ${record.rut || ''}`);
      if (!label || seen.has(key)) return null;
      seen.add(key);
      return {
        record: { ...record, entity_kind: 'provider' },
        id: record.id,
        label: `${label} · Proveedor`,
        subtext: getEntitySearchSubtext('provider', record),
        searchText: getEntitySearchText('provider', record)
      };
    }).filter(Boolean);

    const clientItems = (clientsRes.data || []).map(record => {
      const label = getEntitySearchLabel('client', record);
      const key = `client:${normalizeSearchableText(`${label} ${record.rut || ''}`)}`;
      if (!label || seen.has(key)) return null;
      seen.add(key);
      return {
        record: { ...record, entity_kind: 'client' },
        id: record.id,
        label: `${label} · Cliente`,
        subtext: getEntitySearchSubtext('client', record),
        searchText: getEntitySearchText('client', record)
      };
    }).filter(Boolean);

    items = [...employeeItems, ...providerItems, ...clientItems];
  }

  modalEntitySearchCache[type] = items;
  return items;
}

function renderEntitySearchPicker({ rootId, type, label, placeholder, selectedId = '', selectedLabel = '', helperText = '', inputClass = '', onSelect = null, onClear = null, itemFilter = null }) {
  modalEntitySearchConfigs[rootId] = {
    rootId,
    type,
    onSelect,
    onClear,
    itemFilter
  };

  return `
    <div class="modal-form__group entity-picker" id="${rootId}" data-entity-picker="true" data-entity-picker-type="${type}">
      <label class="modal-form__label">${label}</label>
      <div class="entity-picker__control">
        <input type="text" class="modal-form__input entity-picker__input ${inputClass}" id="${rootId}-input" value="${escapeHtml(selectedLabel)}" placeholder="${escapeHtml(placeholder)}" autocomplete="off">
        <button type="button" class="entity-picker__clear" aria-label="Limpiar búsqueda">×</button>
      </div>
      <input type="hidden" id="${rootId}-value" value="${escapeHtml(selectedId)}">
      <div class="entity-picker__results" id="${rootId}-results" hidden></div>
      ${helperText ? `<div class="entity-picker__helper">${helperText}</div>` : ''}
    </div>
  `;
}

function initModalEntityPickers() {
  document.querySelectorAll('[data-entity-picker="true"]').forEach(root => {
    if (root.dataset.bound === 'true') return;
    const input = root.querySelector('.entity-picker__input');
    const hidden = root.querySelector('input[type="hidden"]');
    const results = root.querySelector('.entity-picker__results');
    const clearBtn = root.querySelector('.entity-picker__clear');
    const config = modalEntitySearchConfigs[root.id];
    if (!input || !hidden || !results || !config) return;

    // Cada formulario nuevo parte desde datos actuales, incluso si el cambio
    // se produjo en otra sección o pestaña del dashboard.
    delete modalEntitySearchCache[config.type];
    root.dataset.bound = 'true';
    let debounceTimer = null;

    const filterItems = async () => {
      const cachedItems = await loadEntitySearchItems(config.type);
      const availableItems = typeof config.itemFilter === 'function'
        ? cachedItems.filter(item => config.itemFilter(item.record, item))
        : cachedItems;
      const query = normalizeSearchableText(input.value.trim());
      const filtered = query
        ? availableItems.filter(item => item.searchText.includes(query))
        : availableItems;
      const shown = filtered.slice(0, 8);

      if (!shown.length) {
        results.innerHTML = '<div class="entity-picker__empty">Sin resultados</div>';
        results.hidden = false;
        return;
      }

      results.innerHTML = shown.map((item, index) => `
        <button type="button" class="entity-picker__result" data-result-index="${index}">
          <strong>${escapeHtml(item.label)}</strong>
          ${item.subtext ? `<span>${escapeHtml(item.subtext)}</span>` : ''}
        </button>
      `).join('');
      results.hidden = false;

      results.querySelectorAll('.entity-picker__result').forEach(button => {
        button.addEventListener('click', () => {
          const chosen = shown[Number(button.dataset.resultIndex)];
          if (!chosen) return;
          hidden.value = chosen.id || '';
          input.value = chosen.label || '';
          results.hidden = true;
          config.onSelect?.(chosen.record, root, chosen);
        });
      });
    };

    const clearSelection = () => {
      hidden.value = '';
      input.value = '';
      results.hidden = true;
      config.onClear?.(root);
    };

    input.addEventListener('focus', () => {
      filterItems();
    });

    input.addEventListener('input', () => {
      hidden.value = '';
      clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(filterItems, 180);
    });

    input.addEventListener('blur', () => {
      window.setTimeout(() => { results.hidden = true; }, 160);
    });

    clearBtn?.addEventListener('click', clearSelection);

    root.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        results.hidden = true;
      }
    });
  });
}

// Small helper: initialize a custom member multiselect component
function initMemberMultiSelectById(id, preselected = []) {
  const root = document.getElementById(id);
  if (!root) return;
  const toggle = root.querySelector('.multiselect__toggle');
  const dropdown = root.querySelector('.multiselect__dropdown');
  const search = root.querySelector('.multiselect__search');
  const list = root.querySelector('.multiselect__list');
  const countEl = root.querySelector('.multiselect__count');

  const updateState = () => {
    const checked = root.querySelectorAll('input[type="checkbox"]:checked');
    countEl.textContent = checked.length;
    // show selected names inside toggle as chips (up to 3)
    const names = Array.from(checked).map(c => c.getAttribute('data-name') || c.parentNode.textContent.trim());
    const labelsEl = toggle.querySelector('.multiselect__labels');
    if (labelsEl) {
      if (names.length === 0) {
        labelsEl.innerHTML = 'Seleccionar miembros';
      } else if (names.length <= 3) {
        labelsEl.innerHTML = names.map(n => `<span class="multiselect__chip">${escapeHtml(n)}</span>`).join(' ');
      } else {
        labelsEl.innerHTML = names.slice(0, 3).map(n => `<span class="multiselect__chip">${escapeHtml(n)}</span>`).join(' ') + ` <span class="multiselect__chip">+${names.length - 3}</span>`;
      }
    }
  };

  // preselect
  Array.from(root.querySelectorAll('input[type="checkbox"]')).forEach(cb => {
    if (preselected && preselected.indexOf(cb.value) !== -1) cb.checked = true;
    cb.addEventListener('change', updateState);
  });
  updateState();

  // toggle dropdown
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const shown = dropdown.style.display === 'block';
    // close other multiselects
    document.querySelectorAll('.multiselect__dropdown').forEach(d => d.style.display = 'none');
    dropdown.style.display = shown ? 'none' : 'block';
  });

  // search filter
  if (search) search.addEventListener('input', () => {
    const q = (search.value || '').toLowerCase();
    Array.from(list.querySelectorAll('.multiselect__item')).forEach(lbl => {
      const text = lbl.textContent.toLowerCase();
      lbl.style.display = text.includes(q) ? '' : 'none';
    });
  });

  // click outside closes
  document.addEventListener('click', (e) => { if (!root.contains(e.target)) dropdown.style.display = 'none'; });
}

// ==========================================================================
// REPORTS
// ==========================================================================
async function loadReports(options = {}) {
  const granularity = document.getElementById('reports-granularity');
  if (!granularity) return;
  const refreshButton = document.getElementById('reports-refresh');
  if (!granularity.dataset.bound) {
    granularity.dataset.bound = 'true';
    granularity.addEventListener('change', renderReportsBi);
    document.getElementById('reports-project-filter')?.addEventListener('change', renderReportsBi);
    document.getElementById('reports-refresh')?.addEventListener('click', () => loadReports({ force: true }));
    document.getElementById('reports-customize')?.addEventListener('click', () => biOpenKpiCustomizer('reports', biState.reports?.kpis || [], renderReportsBi));
  }
  if (refreshButton) { refreshButton.disabled = true; refreshButton.classList.add('is-loading'); }
  biSetLoading('reports', true);
  try {
    const data = await loadBiDataset({ force: Boolean(options.force) });
    const income = biSum(data.income, 'amount');
    const expenses = biSum(data.expenses, 'amount');
    const completedTasks = data.tasks.filter(task => task.completed).length;
    const totalBilled = biSum(data.salesDocs, doc => getRecordAmount(doc));
    const activeProjects = data.projects.filter(project => ['in_development', 'review', 'active'].includes(String(project.status || '').toLowerCase())).length;
    biState.reports = { data, income, expenses, kpis: [
      { key: 'income', label: 'Ingresos históricos', value: income, format: 'currency', icon: 'landmark', area: 'finance', tone: 'green', note: `${data.income.length} movimientos` },
      { key: 'expenses', label: 'Gastos históricos', value: expenses, format: 'currency', icon: 'receipt-text', area: 'finance', tone: 'orange', note: `${data.expenses.length} movimientos` },
      { key: 'balance', label: 'Balance acumulado', value: income - expenses, format: 'currency', icon: 'scale', area: 'finance', tone: income - expenses < 0 ? 'red' : 'blue', note: income ? `${Math.round(((income - expenses) / income) * 100)}% de margen` : 'Sin ingresos' },
      { key: 'billed', label: 'Ventas documentadas', value: totalBilled, format: 'currency', icon: 'file-check-2', area: 'commercial', tone: 'cyan', note: `${data.salesDocs.length} documentos` },
      { key: 'projects', label: 'Proyectos históricos', value: data.projects.length, icon: 'folder-kanban', area: 'projects', tone: 'purple', note: `${activeProjects} activos` },
      { key: 'clients', label: 'Clientes históricos', value: data.clients.length, icon: 'users', area: 'commercial', tone: 'green', note: `${data.clients.filter(client => client.status === 'active').length} activos` },
      { key: 'tasks', label: 'Cumplimiento de tareas', value: data.tasks.length ? Math.round((completedTasks / data.tasks.length) * 100) : 0, suffix: '%', icon: 'badge-check', area: 'operations', tone: 'blue', note: `${completedTasks} de ${data.tasks.length} completadas` }
    ] };
    renderReportsBi();
    bindBiReportExports();
  } catch (error) {
    console.error('Error loading reports BI:', error);
    showToast('No se pudieron cargar los reportes', 'error');
  } finally {
    biSetLoading('reports', false);
    if (refreshButton) { refreshButton.disabled = false; refreshButton.classList.remove('is-loading'); }
  }
}

function biTimeGroup(dateValue, granularity) {
  const key = biDateKey(dateValue);
  if (!key) return '';
  const [year, month] = key.split('-').map(Number);
  if (granularity === 'year') return String(year);
  if (granularity === 'quarter') return `${year} · T${Math.ceil(month / 3)}`;
  return `${year}-${String(month).padStart(2, '0')}`;
}

function renderReportsBi() {
  const state = biState.reports;
  if (!state) return;
  const { data, income, expenses, kpis } = state;
  biRenderKpis(document.getElementById('reports-bi-kpis'), 'reports', kpis, false);
  const granularity = document.getElementById('reports-granularity')?.value || 'month';
  const incomeGroups = {}, expenseGroups = {};
  data.income.forEach(row => { const key = biTimeGroup(row.date, granularity); if (key) incomeGroups[key] = (incomeGroups[key] || 0) + row.amount; });
  data.expenses.forEach(row => { const key = biTimeGroup(row.date, granularity); if (key) expenseGroups[key] = (expenseGroups[key] || 0) + row.amount; });
  const labels = [...new Set([...Object.keys(incomeGroups), ...Object.keys(expenseGroups)])].sort();
  biRenderTrend(document.getElementById('reports-trend-chart'), labels, [
    { label: 'Ingresos', color: '#0d4581', values: labels.map(label => incomeGroups[label] || 0) },
    { label: 'Gastos', color: '#e9952f', values: labels.map(label => expenseGroups[label] || 0) }
  ]);
  const trendLegend = document.getElementById('reports-trend-legend'); if (trendLegend) trendLegend.innerHTML = `<span><i style="background:#0d4581"></i>Ingresos ${formatCurrency(income)}</span><span><i style="background:#e9952f"></i>Gastos ${formatCurrency(expenses)}</span><span><i style="background:#3b82f6"></i>${labels.length} períodos</span>`;
  biRenderDonut(document.getElementById('reports-finance-donut'), income, expenses);
  const projectFilter = document.getElementById('reports-project-filter')?.value || 'all';
  const projects = projectFilter === 'all' ? data.projects : data.projects.filter(project => project.status === projectFilter);
  biRenderBars(document.getElementById('reports-project-status'), biCountBy(projects, project => project.status || 'Sin definir'));
  biRenderBars(document.getElementById('reports-document-status'), biCountBy(data.docs, doc => doc.estado || 'Sin definir'));
  const clientNames = Object.fromEntries(data.clients.map(client => [client.id, client.name || client.company || 'Sin nombre']));
  const clientCounts = biCountBy(projects, project => project.clients?.name || project.client_name || clientNames[project.client_id] || 'Sin cliente');
  biRenderRanking(document.getElementById('reports-client-ranking'), Object.entries(clientCounts).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value })));
  const today = getLocalDateKey(new Date());
  const doneTasks = data.tasks.filter(task => task.completed).length;
  const overdueTasks = data.tasks.filter(task => !task.completed && task.due_date && biDateKey(task.due_date) < today).length;
  const finishedProjects = data.projects.filter(project => ['completed', 'complete', 'done', 'finalizado', 'finalizada'].includes(String(project.status || '').toLowerCase())).length;
  const taskRate = data.tasks.length ? Math.round((doneTasks / data.tasks.length) * 100) : 0;
  const projectRate = data.projects.length ? Math.round((finishedProjects / data.projects.length) * 100) : 0;
  const onTimeRate = data.tasks.length ? Math.max(0, Math.round(((data.tasks.length - overdueTasks) / data.tasks.length) * 100)) : 0;
  const health = document.getElementById('reports-health'); if (health) health.innerHTML = `<div class="bi-health"><div><span style="--value:${taskRate}"><b>${taskRate}%</b></span><p>Tareas completadas</p></div><div><span style="--value:${projectRate}"><b>${projectRate}%</b></span><p>Proyectos finalizados</p></div><div><span style="--value:${onTimeRate}"><b>${onTimeRate}%</b></span><p>Registros a tiempo</p></div></div>`;
  const allDates = [...data.income.map(row => row.date), ...data.expenses.map(row => row.date), ...data.projects.map(row => biDateKey(row.created_at)), ...data.clients.map(row => biDateKey(row.created_at))].filter(Boolean).sort();
  const range = document.getElementById('reports-data-range'); if (range) range.textContent = allDates.length ? `${allDates[0]} — ${allDates[allDates.length - 1]}` : 'Todos los registros';
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function bindBiReportExports() {
  if (!biState.reports) return;
  document.querySelectorAll('.bi-report-library [data-report]').forEach(button => {
    if (button.dataset.bound) return;
    button.dataset.bound = 'true';
    button.addEventListener('click', async () => {
      button.disabled = true;
      button.classList.add('is-loading');
      try {
        const data = biState.reports.data;
        await openReportWindow(button.dataset.report, { projects: data.projects, clients: data.clients, tasks: data.tasks, team: data.team, orders: data.orders, allDocs: [...data.docs, ...data.quotes], financialDocs: data.salesDocs, now: new Date() });
      } finally { button.disabled = false; button.classList.remove('is-loading'); }
    });
  });
}


async function openReportWindow(type, { projects, clients, tasks, team, orders, allDocs, financialDocs = allDocs, now }) {
  const reportDate = now.toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' });
  let title = '';
  let bodyHtml = '';

  const tableStyle = `border-collapse:collapse;width:100%;font-size:13px;`;
  const thStyle = `background:#1a1a2e;color:#fff;padding:8px 10px;text-align:left;`;
  const tdStyle = `padding:7px 10px;border-bottom:1px solid #e2e8f0;`;
  const tdAltStyle = `padding:7px 10px;border-bottom:1px solid #e2e8f0;background:#f8fafc;`;
  const badgeStyle = (color) => `display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;background:${color}22;color:${color};`;
  const statusColor = { in_development: '#2e547d', completed: '#668fbb', review: '#E65100', proposal: '#888', paused: '#999', active: '#2e547d', inactive: '#999', prospect: '#3b82f6' };
  const statusLabel = { in_development: 'En desarrollo', completed: 'Completado', review: 'En revisión', proposal: 'Propuesta', paused: 'Pausado', active: 'Activo', inactive: 'Inactivo', prospect: 'Prospecto' };
  const priorityColor = { high: '#ef4444', medium: '#f97316', low: '#2271c5' };
  const priorityLabel = { high: 'Alta', medium: 'Media', low: 'Baja' };

  if (type === 'financial') {
    title = 'Reporte Financiero';
    const reportDocs = financialDocs;
    const monthLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const byMonth = {};
    reportDocs.forEach(d => {
      const fecha = d.fecha || (d.created_at ? d.created_at.slice(0, 10) : null);
      if (!fecha) return;
      const key = fecha.slice(0, 7);
      if (!byMonth[key]) byMonth[key] = { docs: 0, total: 0 };
      byMonth[key].docs++;
      byMonth[key].total += getRecordAmount(d);
    });
    const byStatus = {};
    reportDocs.forEach(d => {
      const est = d.estado || 'borrador';
      if (!byStatus[est]) byStatus[est] = { docs: 0, total: 0 };
      byStatus[est].docs++;
      byStatus[est].total += getRecordAmount(d);
    });
    const totalBilled = reportDocs.reduce((sum, doc) => sum + getRecordAmount(doc), 0);
    const sortedMonths = Object.keys(byMonth).sort();
    const monthRows = sortedMonths.map((k, i) => {
      const [y, m] = k.split('-');
      const label = `${monthLabels[parseInt(m) - 1]} ${y}`;
      const td = i % 2 === 0 ? tdStyle : tdAltStyle;
      return `<tr><td style="${td}">${label}</td><td style="${td}">${byMonth[k].docs}</td><td style="${td};font-weight:600;">${formatCurrency(byMonth[k].total)}</td></tr>`;
    }).join('');
    const statusRows = Object.entries(byStatus).map(([est, v], i) => {
      const td = i % 2 === 0 ? tdStyle : tdAltStyle;
      return `<tr><td style="${td}">${est.charAt(0).toUpperCase() + est.slice(1)}</td><td style="${td}">${v.docs}</td><td style="${td};font-weight:600;">${formatCurrency(v.total)}</td></tr>`;
    }).join('');
    const docRows = reportDocs.slice(0, 50).map((d, i) => {
      const total = getRecordAmount(d);
      const td = i % 2 === 0 ? tdStyle : tdAltStyle;
      const folio = String(d.folio || d.numero || '-').padStart(6, '0');
      const tipo = d.tipo_doc || (d.tipo ? d.tipo : 'Documento');
      // For facturas_presii: show emi_name if compra, else razon_social (receptor)
      // For cotizaciones: show cliente
      const operacion = (d.operacion || '').toLowerCase();
      const displayName = operacion === 'compra' ? (d.emi_name || d.razon_social || d.cliente || '-') : (d.razon_social || d.cliente || '-');
      return `<tr><td style="${td}">${folio}</td><td style="${td}">${d.fecha || '-'}</td><td style="${td}">${escapeHtml(displayName)}</td><td style="${td}">${escapeHtml(tipo)}</td><td style="${td}">${escapeHtml(d.estado || '-')}</td><td style="${td};font-weight:600;text-align:right;">${formatCurrency(total)}</td></tr>`;
    }).join('');
    bodyHtml = `
      <div style="display:flex;gap:24px;margin-bottom:24px;">
        <div style="flex:1;background:#f0fafd;border-left:4px solid #2271c5;padding:16px 20px;border-radius:8px;"><div style="font-size:12px;color:#555;text-transform:uppercase;letter-spacing:.05em;">Ventas documentadas</div><div style="font-size:24px;font-weight:700;color:#154980;margin-top:4px;">${formatCurrency(totalBilled)}</div></div>
        <div style="flex:1;background:#eff6ff;border-left:4px solid #3b82f6;padding:16px 20px;border-radius:8px;"><div style="font-size:12px;color:#555;text-transform:uppercase;letter-spacing:.05em;">Documentos de venta</div><div style="font-size:24px;font-weight:700;color:#1d4ed8;margin-top:4px;">${reportDocs.length}</div></div>
        <div style="flex:1;background:#fefce8;border-left:4px solid #eab308;padding:16px 20px;border-radius:8px;"><div style="font-size:12px;color:#555;text-transform:uppercase;letter-spacing:.05em;">Meses con actividad</div><div style="font-size:24px;font-weight:700;color:#a16207;margin-top:4px;">${sortedMonths.length}</div></div>
      </div>
      <h3 style="margin:0 0 10px;font-size:15px;">Ventas documentadas por mes</h3>
      <table style="${tableStyle}margin-bottom:28px;"><thead><tr><th style="${thStyle}">Mes</th><th style="${thStyle}">Documentos</th><th style="${thStyle}">Total</th></tr></thead><tbody>${monthRows || '<tr><td colspan="3" style="padding:12px;color:#888;">Sin datos</td></tr>'}</tbody></table>
      <h3 style="margin:0 0 10px;font-size:15px;">Por estado</h3>
      <table style="${tableStyle}margin-bottom:28px;"><thead><tr><th style="${thStyle}">Estado</th><th style="${thStyle}">Cantidad</th><th style="${thStyle}">Total</th></tr></thead><tbody>${statusRows || '<tr><td colspan="3" style="padding:12px;color:#888;">Sin datos</td></tr>'}</tbody></table>
      <h3 style="margin:0 0 10px;font-size:15px;">Detalle de documentos</h3>
      <table style="${tableStyle}"><thead><tr><th style="${thStyle}">Folio</th><th style="${thStyle}">Fecha</th><th style="${thStyle}">Cliente</th><th style="${thStyle}">Tipo</th><th style="${thStyle}">Estado</th><th style="${thStyle}">Total</th></tr></thead><tbody>${docRows || '<tr><td colspan="6" style="padding:12px;color:#888;">Sin documentos</td></tr>'}</tbody></table>
    `;
  } else if (type === 'projects') {
    title = 'Estado de Proyectos';
    const statusCounts = {};
    projects.forEach(p => { statusCounts[p.status] = (statusCounts[p.status] || 0) + 1; });
    const avgProgress = projects.length ? Math.round(projects.reduce((s, p) => s + (p.progress || 0), 0) / projects.length) : 0;
    const statusSummary = Object.entries(statusCounts).map(([s, c]) => `<div style="flex:1;background:#f8fafc;border:1px solid #e2e8f0;padding:12px 16px;border-radius:8px;"><div style="font-size:12px;color:#555;">${statusLabel[s] || s}</div><div style="font-size:22px;font-weight:700;">${c}</div></div>`).join('');
    const rows = projects.map((p, i) => {
      const td = i % 2 === 0 ? tdStyle : tdAltStyle;
      const color = statusColor[p.status] || '#888';
      const badge = `<span style="${badgeStyle(color)}">${statusLabel[p.status] || p.status}</span>`;
      const techs = (p.technologies || []).slice(0, 3).join(', ');
      return `<tr>
        <td style="${td};font-weight:600;">${escapeHtml(p.name)}</td>
        <td style="${td}">${escapeHtml(p.client_name || '-')}</td>
        <td style="${td}">${badge}</td>
        <td style="${td}">
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="flex:1;height:6px;background:#e2e8f0;border-radius:3px;"><div style="width:${p.progress || 0}%;height:100%;background:${color};border-radius:3px;"></div></div>
            <span style="font-size:12px;font-weight:600;">${p.progress || 0}%</span>
          </div>
        </td>
        <td style="${td}">${p.start_date ? new Date(p.start_date).toLocaleDateString('es-CL') : '-'}</td>
        <td style="${td}">${p.estimated_end_date ? new Date(p.estimated_end_date).toLocaleDateString('es-CL') : '-'}</td>
        <td style="${td};font-size:12px;color:#666;">${escapeHtml(techs)}</td>
      </tr>`;
    }).join('');
    bodyHtml = `
      <div style="display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap;"><div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:14px 18px;border-radius:8px;"><div style="font-size:12px;color:#555;">Total proyectos</div><div style="font-size:24px;font-weight:700;color:#1d4ed8;">${projects.length}</div></div><div style="background:#f0fafd;border-left:4px solid #2271c5;padding:14px 18px;border-radius:8px;"><div style="font-size:12px;color:#555;">Progreso promedio</div><div style="font-size:24px;font-weight:700;color:#154980;">${avgProgress}%</div></div>${statusSummary}</div>
      <table style="${tableStyle}"><thead><tr><th style="${thStyle}">Proyecto</th><th style="${thStyle}">Cliente</th><th style="${thStyle}">Estado</th><th style="${thStyle};min-width:140px;">Progreso</th><th style="${thStyle}">Inicio</th><th style="${thStyle}">Entrega</th><th style="${thStyle}">Tecnologías</th></tr></thead><tbody>${rows || '<tr><td colspan="7" style="padding:12px;color:#888;">Sin proyectos</td></tr>'}</tbody></table>`;
  } else if (type === 'clients') {
    title = 'Reporte de Clientes';
    const byRegion = {};
    clients.forEach(c => { const r = c.region || 'Sin región'; byRegion[r] = (byRegion[r] || 0) + 1; });
    const regionRows = Object.entries(byRegion).sort((a, b) => b[1] - a[1]).map(([r, n], i) => { const td = i % 2 === 0 ? tdStyle : tdAltStyle; return `<tr><td style="${td}">${escapeHtml(r)}</td><td style="${td}">${n}</td></tr>`; }).join('');
    const rows = clients.map((c, i) => {
      const td = i % 2 === 0 ? tdStyle : tdAltStyle;
      const sts = c.status || 'active';
      const color = statusColor[sts] || '#888';
      const projCount = projects.filter(p => p.client_name === c.name || p.client_name === c.company).length;
      return `<tr><td style="${td};font-weight:600;">${escapeHtml(c.name)}</td><td style="${td}">${escapeHtml(c.company || '-')}</td><td style="${td}"><span style="${badgeStyle(color)}">${statusLabel[sts] || sts}</span></td><td style="${td}">${escapeHtml(c.region || '-')}</td><td style="${td};text-align:center;font-weight:600;">${projCount}</td></tr>`;
    }).join('');
    bodyHtml = `
      <div style="display:flex;gap:16px;margin-bottom:24px;">
        <div style="background:#f0fafd;border-left:4px solid #2271c5;padding:14px 18px;border-radius:8px;"><div style="font-size:12px;color:#555;">Total clientes</div><div style="font-size:24px;font-weight:700;color:#154980;">${clients.length}</div></div>
        <div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:14px 18px;border-radius:8px;"><div style="font-size:12px;color:#555;">Activos</div><div style="font-size:24px;font-weight:700;color:#1d4ed8;">${clients.filter(c => c.status === 'active').length}</div></div>
        <div style="background:#fefce8;border-left:4px solid #eab308;padding:14px 18px;border-radius:8px;"><div style="font-size:12px;color:#555;">Prospectos</div><div style="font-size:24px;font-weight:700;color:#a16207;">${clients.filter(c => c.status === 'prospect').length}</div></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;">
        <div><h3 style="margin:0 0 10px;font-size:15px;">Por región</h3><table style="${tableStyle}"><thead><tr><th style="${thStyle}">Región</th><th style="${thStyle}">Clientes</th></tr></thead><tbody>${regionRows || '<tr><td colspan="2" style="padding:8px;color:#888;">Sin datos</td></tr>'}</tbody></table></div>
      </div>
      <h3 style="margin:0 0 10px;font-size:15px;">Listado completo</h3>
      <table style="${tableStyle}"><thead><tr><th style="${thStyle}">Nombre</th><th style="${thStyle}">Empresa</th><th style="${thStyle}">Estado</th><th style="${thStyle}">Región</th><th style="${thStyle};text-align:center;">Proyectos</th></tr></thead><tbody>${rows || '<tr><td colspan="5" style="padding:12px;color:#888;">Sin clientes</td></tr>'}</tbody></table>`;
  } else if (type === 'tasks') {
    title = 'Reporte de Tareas';
    const done = tasks.filter(t => t.completed);
    const pending = tasks.filter(t => !t.completed);
    const overdue = pending.filter(t => t.due_date && new Date(t.due_date) < now);
    const byProject = {};
    tasks.forEach(t => { const pn = t.projects?.name || 'Sin proyecto'; if (!byProject[pn]) byProject[pn] = { total: 0, done: 0 }; byProject[pn].total++; if (t.completed) byProject[pn].done++; });
    const projRows = Object.entries(byProject).sort((a, b) => b[1].total - a[1].total).map(([pn, v], i) => { const td = i % 2 === 0 ? tdStyle : tdAltStyle; const pct = Math.round(v.done / v.total * 100); return `<tr><td style="${td};font-weight:600;">${escapeHtml(pn)}</td><td style="${td};text-align:center;">${v.total}</td><td style="${td};text-align:center;">${v.done}</td><td style="${td};text-align:center;">${v.total - v.done}</td><td style="${td}"><div style="display:flex;align-items:center;gap:8px;"><div style="flex:1;height:6px;background:#e2e8f0;border-radius:3px;"><div style="width:${pct}%;height:100%;background:#2271c5;border-radius:3px;"></div></div><span style="font-size:12px;font-weight:600;">${pct}%</span></div></td></tr>`; }).join('');
    const taskRows = tasks.map((t, i) => { const td = i % 2 === 0 ? tdStyle : tdAltStyle; const isOverdue = !t.completed && t.due_date && new Date(t.due_date) < now; const prio = t.priority || 'medium'; return `<tr><td style="${td};font-weight:600;">${escapeHtml(t.title)}</td><td style="${td}">${escapeHtml(t.projects?.name || '-')}</td><td style="${td}"><span style="${badgeStyle(priorityColor[prio])}">${priorityLabel[prio] || prio}</span></td><td style="${td}">${escapeHtml(t.category || '-')}</td><td style="${td}">${t.due_date ? new Date(t.due_date).toLocaleDateString('es-CL') : '-'}${isOverdue ? ' <span style="color:#ef4444;font-size:10px;font-weight:600;">VENCIDA</span>' : ''}</td><td style="${td}">${t.completed ? '<span style="color:#2271c5;font-weight:600;">✓ Completada</span>' : '<span style="color:#888;">Pendiente</span>'}</td></tr>`; }).join('');
    bodyHtml = `
      <div style="display:flex;gap:16px;margin-bottom:24px;">
        <div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:14px 18px;border-radius:8px;"><div style="font-size:12px;color:#555;">Total tareas</div><div style="font-size:24px;font-weight:700;color:#1d4ed8;">${tasks.length}</div></div>
        <div style="background:#f0fafd;border-left:4px solid #2271c5;padding:14px 18px;border-radius:8px;"><div style="font-size:12px;color:#555;">Completadas</div><div style="font-size:24px;font-weight:700;color:#154980;">${done.length}</div></div>
        <div style="background:#fefce8;border-left:4px solid #eab308;padding:14px 18px;border-radius:8px;"><div style="font-size:12px;color:#555;">Pendientes</div><div style="font-size:24px;font-weight:700;color:#a16207;">${pending.length}</div></div>
        <div style="background:#fef2f2;border-left:4px solid #ef4444;padding:14px 18px;border-radius:8px;"><div style="font-size:12px;color:#555;">Vencidas</div><div style="font-size:24px;font-weight:700;color:#dc2626;">${overdue.length}</div></div>
      </div>
      <h3 style="margin:0 0 10px;font-size:15px;">Por proyecto</h3>
      <table style="${tableStyle}margin-bottom:24px;"><thead><tr><th style="${thStyle}">Proyecto</th><th style="${thStyle};text-align:center;">Total</th><th style="${thStyle};text-align:center;">Completadas</th><th style="${thStyle};text-align:center;">Pendientes</th><th style="${thStyle};min-width:120px;">Avance</th></tr></thead><tbody>${projRows || '<tr><td colspan="5" style="padding:8px;color:#888;">Sin datos</td></tr>'}</tbody></table>
      <h3 style="margin:0 0 10px;font-size:15px;">Detalle de tareas</h3>
      <table style="${tableStyle}"><thead><tr><th style="${thStyle}">Tarea</th><th style="${thStyle}">Proyecto</th><th style="${thStyle}">Prioridad</th><th style="${thStyle}">Categoría</th><th style="${thStyle}">Fecha límite</th><th style="${thStyle}">Estado</th></tr></thead><tbody>${taskRows || '<tr><td colspan="6" style="padding:12px;color:#888;">Sin tareas</td></tr>'}</tbody></table>`;
  } else if (type === 'team') {
    title = 'Rendimiento del Equipo';
    const memberRows = team.map((m, i) => { const td = i % 2 === 0 ? tdStyle : tdAltStyle; const memberOrders = orders.filter(o => o.team_members?.full_name === m.full_name); const done = memberOrders.filter(o => o.status === 'done').length; const active = memberOrders.filter(o => o.status === 'in_progress').length; return `<tr><td style="${td};font-weight:600;">${escapeHtml(m.full_name)}</td><td style="${td}">${escapeHtml(m.role_title || '-')}</td><td style="${td}">${escapeHtml(m.email || '-')}</td><td style="${td}">${escapeHtml(m.availability || '-')}</td><td style="${td};text-align:center;">${memberOrders.length}</td><td style="${td};text-align:center;">${active}</td><td style="${td};text-align:center;font-weight:600;color:#2271c5;">${done}</td></tr>`; }).join('');
    const orderRows = orders.map((o, i) => { const td = i % 2 === 0 ? tdStyle : tdAltStyle; const statusC = { pending: '#888', in_progress: '#3b82f6', review: '#f97316', done: '#2271c5' }; const statusL = { pending: 'Pendiente', in_progress: 'En progreso', review: 'En revisión', done: 'Completado' }; const isOverdue = o.status !== 'done' && o.due_date && new Date(o.due_date) < now; return `<tr><td style="${td};font-weight:600;">${escapeHtml(o.title)}</td><td style="${td}"><span style="${badgeStyle(statusC[o.status] || '#888')}">${statusL[o.status] || o.status}</span></td><td style="${td}"><span style="${badgeStyle(priorityColor[o.priority] || '#888')}">${priorityLabel[o.priority] || o.priority || '-'}</span></td><td style="${td}">${escapeHtml(o.team_members?.full_name || 'Sin asignar')}</td><td style="${td}">${o.due_date ? new Date(o.due_date).toLocaleDateString('es-CL') : '-'}${isOverdue ? ' <span style="color:#ef4444;font-size:10px;font-weight:600;">VENCIDO</span>' : ''}</td></tr>`; }).join('');
    bodyHtml = `
      <div style="display:flex;gap:16px;margin-bottom:24px;">
        <div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:14px 18px;border-radius:8px;"><div style="font-size:12px;color:#555;">Miembros</div><div style="font-size:24px;font-weight:700;color:#1d4ed8;">${team.length}</div></div>
        <div style="background:#fefce8;border-left:4px solid #eab308;padding:14px 18px;border-radius:8px;"><div style="font-size:12px;color:#555;">Pedidos activos</div><div style="font-size:24px;font-weight:700;color:#a16207;">${orders.filter(o => o.status === 'in_progress').length}</div></div>
        <div style="background:#f0fafd;border-left:4px solid #2271c5;padding:14px 18px;border-radius:8px;"><div style="font-size:12px;color:#555;">Pedidos completados</div><div style="font-size:24px;font-weight:700;color:#154980;">${orders.filter(o => o.status === 'done').length}</div></div>
      </div>
      <h3 style="margin:0 0 10px;font-size:15px;">Equipo</h3>
      <table style="${tableStyle}margin-bottom:24px;"><thead><tr><th style="${thStyle}">Nombre</th><th style="${thStyle}">Rol</th><th style="${thStyle}">Email</th><th style="${thStyle}">Disponibilidad</th><th style="${thStyle};text-align:center;">Pedidos</th><th style="${thStyle};text-align:center;">Activos</th><th style="${thStyle};text-align:center;">Completados</th></tr></thead><tbody>${memberRows || '<tr><td colspan="7" style="padding:12px;color:#888;">Sin miembros</td></tr>'}</tbody></table>
      <h3 style="margin:0 0 10px;font-size:15px;">Pedidos (Kanban)</h3>
      <table style="${tableStyle}"><thead><tr><th style="${thStyle}">Pedido</th><th style="${thStyle}">Estado</th><th style="${thStyle}">Prioridad</th><th style="${thStyle}">Asignado a</th><th style="${thStyle}">Fecha límite</th></tr></thead><tbody>${orderRows || '<tr><td colspan="5" style="padding:12px;color:#888;">Sin pedidos</td></tr>'}</tbody></table>`;
  } else if (type === 'sla') {
    title = 'Reporte de SLAs';
    const projWithDates = projects.filter(p => p.estimated_end_date);
    const tasksWithDates = tasks.filter(t => t.due_date);
    const projRows = projWithDates.map((p, i) => { const td = i % 2 === 0 ? tdStyle : tdAltStyle; const late = p.status !== 'completed' && new Date(p.estimated_end_date) < now; const color = p.status === 'completed' ? '#2271c5' : late ? '#ef4444' : '#f97316'; const label = p.status === 'completed' ? 'Completado' : late ? 'Vencido' : 'En plazo'; return `<tr><td style="${td};font-weight:600;">${escapeHtml(p.name)}</td><td style="${td}">${escapeHtml(p.client_name || '-')}</td><td style="${td}">${new Date(p.estimated_end_date).toLocaleDateString('es-CL')}</td><td style="${td}">${p.progress || 0}%</td><td style="${td}"><span style="${badgeStyle(color)}">${label}</span></td></tr>`; }).join('');
    const taskRows = tasksWithDates.map((t, i) => { const td = i % 2 === 0 ? tdStyle : tdAltStyle; const late = !t.completed && new Date(t.due_date) < now; const color = t.completed ? '#2271c5' : late ? '#ef4444' : '#3b82f6'; const label = t.completed ? 'Completada' : late ? 'Vencida' : 'En plazo'; return `<tr><td style="${td};font-weight:600;">${escapeHtml(t.title)}</td><td style="${td}">${escapeHtml(t.projects?.name || '-')}</td><td style="${td}">${new Date(t.due_date).toLocaleDateString('es-CL')}</td><td style="${td}"><span style="${badgeStyle(color)}">${label}</span></td></tr>`; }).join('');
    const overdueP = projWithDates.filter(p => p.status !== 'completed' && new Date(p.estimated_end_date) < now).length;
    const okP = projWithDates.length - overdueP;
    const overdueT = tasksWithDates.filter(t => !t.completed && new Date(t.due_date) < now).length;
    const okT = tasksWithDates.length - overdueT;
    bodyHtml = `
      <div style="display:flex;gap:16px;margin-bottom:24px;">
        <div style="background:#f0fafd;border-left:4px solid #2271c5;padding:14px 18px;border-radius:8px;"><div style="font-size:12px;color:#555;">Proyectos a tiempo</div><div style="font-size:24px;font-weight:700;color:#154980;">${okP}</div></div>
        <div style="background:#fef2f2;border-left:4px solid #ef4444;padding:14px 18px;border-radius:8px;"><div style="font-size:12px;color:#555;">Proyectos vencidos</div><div style="font-size:24px;font-weight:700;color:#dc2626;">${overdueP}</div></div>
        <div style="background:#f0fafd;border-left:4px solid #2271c5;padding:14px 18px;border-radius:8px;"><div style="font-size:12px;color:#555;">Tareas a tiempo</div><div style="font-size:24px;font-weight:700;color:#154980;">${okT}</div></div>
        <div style="background:#fef2f2;border-left:4px solid #ef4444;padding:14px 18px;border-radius:8px;"><div style="font-size:12px;color:#555;">Tareas vencidas</div><div style="font-size:24px;font-weight:700;color:#dc2626;">${overdueT}</div></div>
      </div>
      <h3 style="margin:0 0 10px;font-size:15px;">Proyectos</h3>
      <table style="${tableStyle}margin-bottom:24px;"><thead><tr><th style="${thStyle}">Proyecto</th><th style="${thStyle}">Cliente</th><th style="${thStyle}">Fecha entrega</th><th style="${thStyle}">Progreso</th><th style="${thStyle}">Estado SLA</th></tr></thead><tbody>${projRows || '<tr><td colspan="5" style="padding:12px;color:#888;">Sin proyectos con fecha</td></tr>'}</tbody></table>
      <h3 style="margin:0 0 10px;font-size:15px;">Tareas</h3>
      <table style="${tableStyle}"><thead><tr><th style="${thStyle}">Tarea</th><th style="${thStyle}">Proyecto</th><th style="${thStyle}">Fecha límite</th><th style="${thStyle}">Estado SLA</th></tr></thead><tbody>${taskRows || '<tr><td colspan="4" style="padding:12px;color:#888;">Sin tareas con fecha</td></tr>'}</tbody></table>`;
  }

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>${title} — Solven Labs</title><style>*{margin:0;padding:0;box-sizing:border-box;} body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1a1a;background:#fff;padding:32px 40px;} .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:16px;border-bottom:2px solid #1a1a2e;} .header h1{font-size:22px;font-weight:700;} .header .meta{font-size:12px;color:#888;text-align:right;} .company{font-size:28px;font-weight:900;color:#1a1a2e;letter-spacing:-1px;} @media print{@page{margin:1.5cm;size:A4;} body{padding:0;} .no-print{display:none !important;} a{color:inherit;text-decoration:none;}}</style></head><body><div class="header"><div><div class="company">Solven Labs</div><h1>${title}</h1></div><div class="meta"><div>Generado el ${reportDate}</div><div style="margin-top:4px;">solvenlabs.cl</div></div></div>${bodyHtml}<div style="margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:11px;color:#aaa;text-align:center;">Reporte generado automáticamente por Solven Labs Panel de Gestión — solvenlabs.cl</div><script>window.onload=()=>{window.print();};<\/script></body></html>`;

  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) { showToast('Activa las ventanas emergentes para generar el PDF', 'warning'); return; }
  w.document.write(html);
  w.document.close();
}

// ==========================================================================
// HELPERS
// ==========================================================================
function escapeHtml(str) { if (!str) return ''; const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }

function copyTextToClipboard(text) {
  if (!text) return Promise.reject(new Error('Empty text'));
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    return navigator.clipboard.writeText(text);
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();

  try {
    document.execCommand('copy');
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  } finally {
    document.body.removeChild(textarea);
  }
}

window._copyModalField = async (fieldId, successMessage = 'Texto copiado') => {
  const field = document.getElementById(fieldId);
  const value = field?.value ?? field?.textContent ?? '';
  try {
    await copyTextToClipboard(value);
    showToast(successMessage, 'success');
  } catch {
    showToast('No se pudo copiar', 'error');
  }
};

// Normalise relative asset paths stored in Supabase (e.g. "assets/foo.png" → "/assets/foo.png")
function assetUrl(url) { if (!url) return url; return url.startsWith('http') || url.startsWith('/') ? url : '/' + url; }

function formatCurrency(amount) {
  if (!amount) return '$0';
  const n = parseInt(amount);
  return `$${n.toLocaleString('es-CL')}`;
}
function formatCurrencyShort(amount) { return amount ? `$${parseInt(amount).toLocaleString('es-CL')}` : '$0'; }


// convert a date string returned from the database into a JS Date using
// **local** time. The native Date constructor treats yyyy-mm-dd inputs as
// UTC which causes off-by-one-day shifts for users behind UTC; that's the
// bug the user reported (e.g. pick 21 → see 20). This helper ensures the
// date portion is interpreted in the local timezone. If the string includes
// a time component we fall back to the normal constructor so times are
// preserved.
function parseDate(s) {
  if (!s) return null;
  if (typeof s === 'string') {
    const dateOnly = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnly) {
      const y = +dateOnly[1], m = +dateOnly[2], d = +dateOnly[3];
      return new Date(y, m - 1, d);
    }
  }
  return new Date(s);
}

function formatDate(s) { if (!s) return '-'; const d = parseDate(s); const m = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']; return `${String(d.getDate()).padStart(2, '0')} ${m[d.getMonth()]} ${d.getFullYear()}`; }
function formatDateShort(s) { if (!s) return '-'; const d = parseDate(s); const m = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']; return `${d.getDate()} ${m[d.getMonth()]}`; }

function statusLabel(s) {
  return ({
    // Client statuses
    active: 'Activo',
    inactive: 'Inactivo',
    prospect: 'Prospecto',
    // Project statuses
    proposal: 'Propuesta',
    in_development: 'En desarrollo',
    review: 'En revisión',
    completed: 'Completado',
    paused: 'Pausado',
    // Order/task statuses
    pending: 'Por hacer',
    in_progress: 'En progreso',
    done: 'Completado'
  }[s] || s);
}
function timeAgo(s) { const diff = Math.floor((new Date() - new Date(s)) / 1000); if (diff < 60) return 'Ahora'; if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`; if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} horas`; if (diff < 604800) return `Hace ${Math.floor(diff / 86400)} días`; return formatDate(s); }
function getLocalDateKey(value) {
  const date = parseDate(value);
  if (!date || Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getActivityIcon(t) { return { project: 'folder-kanban', invoice: 'file-text', client: 'users', document: 'file', deploy: 'rocket', task: 'check-square', order: 'package', team: 'user-plus', general: 'activity' }[t] || 'activity'; }


// ==========================================================================
// COTIZACIONES & FACTURAS PRE-SII — Emisor de Documentos
// ==========================================================================

// ---- Storage helpers (Supabase) ----
async function getCotizaciones() {
  const { data } = await supabase.from('cotizaciones').select('*').order('created_at', { ascending: false });
  return data || [];
}
async function saveCotizacion(doc) {
  const { error } = await supabase.from('cotizaciones').upsert(doc);
  return error;
}
async function deleteCotizacionDB(id) {
  const { error } = await supabase.from('cotizaciones').delete().eq('id', id);
  return error;
}

// ---- Pagos (honorarios y contrato) ----
async function getPagos() {
  const { data } = await supabase.from('pagos').select('*').order('fecha', { ascending: false });
  return data || [];
}

async function syncProviderBillingFromPago(paymentDoc, previousDoc = null) {
  const currentIsPurchase = paymentDoc && getPagoOperation(paymentDoc) === 'compra';
  const previousIsPurchase = previousDoc && getPagoOperation(previousDoc) === 'compra';
  if (!currentIsPurchase && !previousIsPurchase) return;
  const currentRut = currentIsPurchase ? normalizeRut(paymentDoc?.rut || '') : '';
  const previousRut = previousIsPurchase ? normalizeRut(previousDoc?.rut || '') : '';
  const currentAmount = currentIsPurchase
    ? Math.max(0, Math.round(Number(paymentDoc?.neto ?? paymentDoc?.bruto ?? paymentDoc?.amount ?? 0) || 0))
    : 0;
  const previousAmount = previousIsPurchase
    ? Math.max(0, Math.round(Number(previousDoc?.neto ?? previousDoc?.bruto ?? previousDoc?.amount ?? 0) || 0))
    : 0;

  if (!currentRut && !previousRut) return;

  const { data: providers, error } = await supabase.from('providers').select('id,rut,total_billed');
  if (error) {
    console.warn('No se pudo sincronizar el total del proveedor:', error);
    return;
  }

  const providerByRut = (rut) => (providers || []).find(p => normalizeRut(p.rut || '') === rut);
  const currentProvider = currentRut ? providerByRut(currentRut) : null;
  const previousProvider = previousRut ? providerByRut(previousRut) : null;
  const nowIso = new Date().toISOString();

  if (previousProvider && currentProvider && previousProvider.id === currentProvider.id) {
    const delta = currentAmount - previousAmount;
    if (delta !== 0) {
      const nextTotal = Math.max(0, Math.round(Number(previousProvider.total_billed || 0) + delta));
      await supabase.from('providers').update({ total_billed: nextTotal, updated_at: nowIso }).eq('id', previousProvider.id);
    }
    return;
  }

  if (previousProvider && previousAmount > 0) {
    const nextTotal = Math.max(0, Math.round(Number(previousProvider.total_billed || 0) - previousAmount));
    await supabase.from('providers').update({ total_billed: nextTotal, updated_at: nowIso }).eq('id', previousProvider.id);
  }

  if (currentProvider && currentAmount > 0) {
    const nextTotal = Math.max(0, Math.round(Number(currentProvider.total_billed || 0) + currentAmount));
    await supabase.from('providers').update({ total_billed: nextTotal, updated_at: nowIso }).eq('id', currentProvider.id);
  }
}

async function savePago(doc) {
  let previousDoc = null;
  if (doc?.id) {
    const { data } = await supabase.from('pagos').select('*').eq('id', doc.id).maybeSingle();
    previousDoc = data || null;
  }

  const isHonorarios = (doc?.tipo || '').toLowerCase() === 'honorarios';
  const isDirecto = (doc?.tipo || '').toLowerCase() === 'directo';
  const operacion = isHonorarios ? getPagoOperation(doc) : (isDirecto ? 'compra' : null);
  const descripcion = isHonorarios ? getPagoDescription(doc) : (doc?.descripcion || '');
  const payload = {
    ...doc,
    descripcion,
    ...((isHonorarios || isDirecto) ? { operacion } : {})
  };

  const { error } = await supabase.from('pagos').upsert(payload);
  if (error) {
    const shouldRetryWithoutOperacion = String(error.message || error).toLowerCase().includes('operacion');
    if (!shouldRetryWithoutOperacion) return error;

    const fallbackPayload = {
      ...doc,
      descripcion: isHonorarios ? buildPagoDescription(descripcion, operacion) : descripcion
    };
    delete fallbackPayload.operacion;

    const { error: fallbackError } = await supabase.from('pagos').upsert(fallbackPayload);
    if (fallbackError) return fallbackError;

    await syncProviderBillingFromPago(fallbackPayload, previousDoc);
    return null;
  }

  await syncProviderBillingFromPago(payload, previousDoc);
  return null;
}
async function deletePagoDB(id) {
  const { data: previousDoc } = await supabase.from('pagos').select('*').eq('id', id).maybeSingle();
  const { error } = await supabase.from('pagos').delete().eq('id', id);
  if (!error && previousDoc) {
    await syncProviderBillingFromPago({ rut: '', neto: 0 }, previousDoc);
  }
  return error;
}

async function getPresiiDocs() {
  const { data } = await supabase.from('facturas_presii').select('*').order('created_at', { ascending: false });
  return data || [];
}
async function getFacturacionAccountingItems() {
  const { data } = await supabase
    .from('facturacion_items')
    .select('amount, created_at, due_date, status')
    .order('created_at', { ascending: false });
  return data || [];
}
function getAccountingEntryDate(item) {
  const raw = item?.created_at || item?.due_date || item?.fecha || '';
  if (!raw) return '';
  return String(raw).slice(0, 10);
}
function filterAccountingByMonth(items, mes) {
  if (!mes) return items;
  return items.filter(item => getAccountingEntryDate(item).startsWith(mes));
}
function isCountableAccountingItem(item) {
  const status = (item?.status || '').toString().toLowerCase();
  return !['cancelled', 'canceled', 'cancelado'].includes(status);
}
async function savePresiiDoc(doc) {
  const { error } = await supabase.from('facturas_presii').upsert(doc);
  return error;
}
async function deletePresiiDocDB(id) {
  const { error } = await supabase.from('facturas_presii').delete().eq('id', id);
  return error;
}

// ---- Company defaults ----


// ---- Folio auto ----
async function nextFolio(type) {
  const table = type === 'cot' ? 'cotizaciones' : 'facturas_presii';
  const { data } = await supabase.from(table).select('folio').order('folio', { ascending: false }).limit(1);
  return (parseInt(data?.[0]?.folio) || 0) + 1;
}

// ---- Number helpers ----
const IVA_RATE = 0.19;
function fmtNum(n) { return Math.round(n || 0).toLocaleString('es-CL'); }

// ── Month/Period filter helpers ──────────────────────────────────────────────
function filterByMonth(items, mes, field = 'fecha') {
  if (!mes) return items;
  return items.filter(i => {
    const val = i[field];
    if (!val) return false;
    const s = typeof val === 'string' ? val : (val instanceof Date ? val.toISOString().slice(0, 10) : String(val));
    return s.startsWith(mes);
  });
}


function calcItemTotal(it) {
  return Math.round((parseFloat(it.qty) || 0) * (parseFloat(it.unit_price) || 0) * (1 - (parseFloat(it.discount_pct) || 0) / 100));
}
function calcTotalsFromItems(items, exento) {
  const neto = items.reduce((s, it) => s + calcItemTotal(it), 0);
  const iva = exento ? 0 : Math.round(neto * IVA_RATE);
  return { neto, iva, total: neto + iva };
}

function getRecordAmount(record) {
  const directAmount = Number(record?.total ?? record?.amount ?? record?.neto ?? record?.bruto ?? 0);
  if (Number.isFinite(directAmount) && directAmount > 0) return directAmount;
  if (Array.isArray(record?.items)) return calcTotalsFromItems(record.items || [], record?.exento || false).total || 0;
  return 0;
}

// ---- Items table ----
let _docItemIdx = 0;

function updateDocTotals() {
  const tbody = document.getElementById('doc-items-tbody'); if (!tbody) return;
  const exento = document.getElementById('doc-exento')?.checked;
  let neto = 0;
  tbody.querySelectorAll('tr').forEach(row => {
    const qty = parseFloat(row.querySelector('.item-qty')?.value) || 0;
    const pu = parseFloat(row.querySelector('.item-up')?.value) || 0;
    const disc = parseFloat(row.querySelector('.item-disc')?.value) || 0;
    const t = Math.round(qty * pu * (1 - disc / 100));
    const cell = row.querySelector('.item-total-cell');
    if (cell) cell.textContent = fmtNum(t);
    neto += t;
  });
  const iva = exento ? 0 : Math.round(neto * IVA_RATE);
  const total = neto + iva;
  const $e = id => document.getElementById(id);
  if ($e('doc-neto')) $e('doc-neto').textContent = `$${fmtNum(neto)}`;
  if ($e('doc-iva')) $e('doc-iva').textContent = exento ? '$0 (Exento)' : `$${fmtNum(iva)}`;
  if ($e('doc-total')) $e('doc-total').textContent = `$${fmtNum(total)}`;
}
window.updateDocTotals = updateDocTotals;

function addItemRow(item = {}) {
  const tbody = document.getElementById('doc-items-tbody'); if (!tbody) return;
  const idx = ++_docItemIdx;
  const tr = document.createElement('tr'); tr.id = `item-row-${idx}`;
  tr.innerHTML = `
    <td><input type="text" class="item-desc" value="${escapeHtml(item.desc || '')}" placeholder="Descripción"></td>
    <td class="td-num"><input type="number" class="item-qty"  value="${item.qty || 1}"  min="0.01" step="any"  style="width:60px;text-align:right;"  oninput="updateDocTotals()"></td>
    <td class="td-num"><input type="number" class="item-up"   value="${item.unit_price || 0}" min="0" step="1"   style="width:90px;text-align:right;"  oninput="updateDocTotals()"></td>
    <td class="td-num"><input type="number" class="item-disc" value="${item.discount_pct || 0}" min="0" max="100" step="0.1" style="width:55px;text-align:right;" oninput="updateDocTotals()"></td>
    <td class="td-num item-total-cell" style="font-weight:600;">${fmtNum(calcItemTotal(item))}</td>
    <td><button type="button" class="doc-items__btn-remove" onclick="removeItemRow(${idx})"><i data-lucide="x" style="width:14px;height:14px;"></i></button></td>`;
  tbody.appendChild(tr);
  updateDocTotals();
  if (typeof lucide !== 'undefined') setTimeout(() => lucide.createIcons(), 50);
}
window.addItemRow = addItemRow;

function removeItemRow(idx) {
  const row = document.getElementById(`item-row-${idx}`); if (row) row.remove(); updateDocTotals();
}
window.removeItemRow = removeItemRow;

function collectItems() {
  const tbody = document.getElementById('doc-items-tbody'); if (!tbody) return [];
  return [...tbody.querySelectorAll('tr')].map(row => ({
    desc: row.querySelector('.item-desc')?.value.trim() || '',
    qty: parseFloat(row.querySelector('.item-qty')?.value) || 0,
    unit_price: parseFloat(row.querySelector('.item-up')?.value) || 0,
    discount_pct: parseFloat(row.querySelector('.item-disc')?.value) || 0,
  })).filter(it => it.desc || it.qty || it.unit_price);
}

// ---- Badge ----
function cotBadge(estado) {
  const map = { vigente: 'badge--vigente', aceptada: 'badge--aceptada', facturada: 'badge--aceptada', rechazada: 'badge--rechazada', vencida: 'badge--vencida' };
  const labels = { vigente: 'Vigente', aceptada: 'Aceptada', facturada: 'Facturada', rechazada: 'Rechazada', vencida: 'Vencida' };
  return `<span class="badge-cot ${map[estado] || 'badge--vencida'}">${labels[estado] || estado}</span>`;
}
function presiiBadge(estado, fechaVencimiento = '') {
  const effectiveStatus = isSiiInvoiceOverdue({ estado, fecha_vencimiento: fechaVencimiento }) ? 'vencida' : normalizeSiiPaidStatus(estado);
  const map = { borrador: 'badge--borrador', emitida: 'badge--emitida', vencida: 'badge--vencida', pagado: 'badge--pagada', anulada: 'badge--anulada' };
  const labels = { borrador: 'Borrador', emitida: 'Emitida', vencida: 'Vencida', pagado: 'Pagado', anulada: 'Anulada' };
  return `<span class="badge-presii ${map[effectiveStatus] || 'badge--borrador'}">${labels[effectiveStatus] || effectiveStatus}</span>`;
}
function dteName(tipo) {
  return ({
    33: 'Factura Elect. (33)',
    34: 'Factura No Afecta (34)',
    39: 'Boleta Elect. (39)',
    52: 'Recibo Honorarios (52)',
    61: 'Nota Crédito (61)',
    110: 'Factura Compra (110)',
    111: 'Nota Crédito Compra (111)',
    112: 'Nota Débito Compra (112)'
  })[tipo] || `DTE ${tipo}`;
}

// ---- Render Cotizaciones ----
async function renderCotizaciones() {
  const list = await getCotizaciones();
  const tbody = document.getElementById('cot-tbody');
  const search = (document.getElementById('cot-search')?.value || '').toLowerCase();
  const filter = document.getElementById('cot-filter-estado')?.value || '';
  const fMes = document.getElementById('cot-filter-mes')?.value || '';
  const canManage = isButtonAllowed('btn-nueva-cotizacion');

  // Month-filtered list for KPIs
  const listMes = filterByMonth(list, fMes);

  // KPIs (based on selected month)
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let vigentes = 0, montoTotal = 0;
  listMes.forEach(c => {
    const { total } = calcTotalsFromItems(c.items || [], c.exento);
    if (c.estado === 'vigente' || c.estado === 'aceptada') {
      montoTotal += total;
    }
    if (c.estado === 'vigente') {
      const exp = new Date(c.fecha || 0);
      exp.setDate(exp.getDate() + (parseInt(c.vigencia) || 30));
      if (exp >= today) vigentes++;
    }
  });
  const $e = id => document.getElementById(id);
  if ($e('cot-kpi-total')) $e('cot-kpi-total').textContent = listMes.length;
  if ($e('cot-kpi-vigentes')) $e('cot-kpi-vigentes').textContent = vigentes;
  if ($e('cot-kpi-monto')) $e('cot-kpi-monto').textContent = `$${fmtNum(montoTotal)}`;

  const filtered = listMes.filter(c => {
    const matchSearch = !search || c.cliente?.toLowerCase().includes(search) || String(c.folio).includes(search);
    const matchFilter = !filter || c.estado === filter;
    return matchSearch && matchFilter;
  });

  // Toolbar events — setup listeners only once to avoid duplicates
  if (!window._cotizacionesListenersSetup) {
    const searchEl = document.getElementById('cot-search');
    const filterEl = document.getElementById('cot-filter-estado');
    const mesEl = document.getElementById('cot-filter-mes');

    if (searchEl) { searchEl.addEventListener('input', renderCotizaciones); }
    if (filterEl) { filterEl.addEventListener('change', renderCotizaciones); }
    if (mesEl) { mesEl.addEventListener('change', renderCotizaciones); }

    const btnNew = document.getElementById('btn-nueva-cotizacion');
    if (btnNew) { btnNew.addEventListener('click', () => openCotizacionModal(null)); }
    const btnExport = document.getElementById('btn-export-cotizaciones');
    if (btnExport) { btnExport.addEventListener('click', exportCotizacionesCSV); }

    window._cotizacionesListenersSetup = true;
  }

  // Rebuild month options without resetting listeners
  const mesEl = document.getElementById('cot-filter-mes');
  if (mesEl && !mesEl.dataset.initialized) {
    const now = new Date();
    const opts = ['<option value="">Todos los períodos</option>'];
    for (let i = 0; i < 13; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('es-CL', { month: 'long', year: 'numeric' });
      opts.push(`<option value="${val}">${label.charAt(0).toUpperCase() + label.slice(1)}</option>`);
    }
    mesEl.innerHTML = opts.join('');
    mesEl.dataset.initialized = 'true';
  }

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:var(--dash-text-secondary);padding:2rem;">${listMes.length ? 'Sin resultados para los filtros aplicados' : 'No hay cotizaciones aún. Haz clic en «Nueva Cotización» para comenzar.'}</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(c => {
    const { neto, iva, total } = calcTotalsFromItems(c.items || [], c.exento);
    return `<tr>
      <td><strong style="font-family:monospace;">COT-${String(c.folio).padStart(6, '0')}</strong></td>
      <td>${escapeHtml(c.cliente || '-')}</td>
      <td>${c.fecha || '-'}</td>
      <td>${c.vigencia || 30} días</td>
      <td>$${fmtNum(neto)}</td>
      <td>$${fmtNum(iva)}</td>
      <td style="font-weight:700;">$${fmtNum(total)}</td>
      <td>${cotBadge(c.estado || 'vigente')}</td>
      <td>
        <div style="display:flex;gap:6px;align-items:center;">
          <button class="btn-dash btn-dash--secondary btn-dash--sm" onclick="generateCotizacionPDF('${c.id}')" title="Descargar PDF"><i data-lucide="file-down" style="width:13px;height:13px;"></i></button>
          ${canManage ? `<button class="btn-dash btn-dash--secondary btn-dash--sm" onclick="openCotizacionModal('${c.id}')" title="Editar"><i data-lucide="pencil" style="width:13px;height:13px;"></i></button><button class="btn-dash btn-dash--secondary btn-dash--sm" style="color:var(--dash-danger);" onclick="deleteCotizacion('${c.id}')" title="Eliminar"><i data-lucide="trash-2" style="width:13px;height:13px;"></i></button>` : ''}
        </div>
      </td>
    </tr>`;
  }).join('');

  if (typeof lucide !== 'undefined') setTimeout(() => lucide.createIcons(), 50);
}

// ---- Pagos y Nómina de Honorarios ----
// =====================================
// TRIBUTOS F22 / F29
// =====================================
async function renderTaxForms() {
  const years = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear - 5; y <= currentYear; y++) years.push(y);

  const yearSelect = document.getElementById('taxes-filter-year');
  const monthSelect = document.getElementById('taxes-filter-month');
  if (yearSelect) {
    yearSelect.innerHTML = years.map(y => `<option value="${y}"${y === currentYear ? ' selected' : ''}>${y}</option>`).join('');
  }
  if (monthSelect) {
    monthSelect.innerHTML = `<option value="">Todos</option>` +
      Array.from({ length: 12 }, (_, m) => {
        const monthName = new Date(0, m).toLocaleString('es-CL', { month: 'long' });
        const monthLabel = monthName.charAt(0).toUpperCase() + monthName.slice(1);
        return `<option value="${String(m + 1).padStart(2, '0')}">${monthLabel}</option>`;
      }).join('');
  }

  async function refresh() {
    const year = parseInt(yearSelect?.value) || currentYear;
    const month = monthSelect?.value || '';

    const presii = await getPresiiDocs();
    const facturacionAccounting = await getFacturacionAccountingItems();
    const pagos = await getPagos();

    const f22Docs = presii.filter(d => {
      const date = new Date(d.fecha || 0);
      return date.getFullYear() === year && ['venta', 'compra'].includes((d.operacion || '').toLowerCase());
    });
    const f29Docs = presii.filter(d => {
      const date = new Date(d.fecha || 0);
      if (!date || Number.isNaN(date.valueOf())) return false;
      if (date.getFullYear() !== year) return false;
      if (!month) return true;
      return String(date.getMonth() + 1).padStart(2, '0') === month;
    });

    const facturacionPeriod = filterAccountingByMonth(
      facturacionAccounting.filter(isCountableAccountingItem),
      month ? `${year}-${month}` : `${year}`
    );
    const totalIngresos = f22Docs.reduce((sum, d) => sum + (d.total || 0), 0) + facturacionPeriod.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const totalVentas = f22Docs.filter(d => (d.operacion || '').toLowerCase() === 'venta').reduce((sum, d) => sum + (d.total || 0), 0);
    const totalCompras = f22Docs.filter(d => (d.operacion || '').toLowerCase() === 'compra').reduce((sum, d) => sum + (d.total || 0), 0);

    const ivaDebito = f29Docs.reduce((sum, d) => {
      if ((d.operacion || '').toLowerCase() !== 'venta') return sum;
      const iva = (((d.total || 0) - (d.neto || 0)) || 0);
      return sum + iva;
    }, 0);
    const ivaCredito = f29Docs.reduce((sum, d) => {
      if ((d.operacion || '').toLowerCase() !== 'compra') return sum;
      const iva = (((d.total || 0) - (d.neto || 0)) || 0);
      return sum + iva;
    }, 0);
    const ivaPagar = Math.max(0, ivaDebito - ivaCredito);
    const saldoFavor = Math.max(0, ivaCredito - ivaDebito);
    const retenciones = pagos.filter(p => p.tipo === 'honorarios' && !p.skip_analytics).reduce((sum, p) => sum + (p.descuentos || 0), 0);

    if (document.getElementById('taxes-kpi-renta')) document.getElementById('taxes-kpi-renta').textContent = `$${fmtNum(totalIngresos)}`;
    if (document.getElementById('taxes-kpi-iva')) document.getElementById('taxes-kpi-iva').textContent = `$${fmtNum(ivaDebito)}`;
    if (document.getElementById('taxes-kpi-favor')) document.getElementById('taxes-kpi-favor').textContent = `$${fmtNum(saldoFavor)}`;
    if (document.getElementById('taxes-kpi-retenciones')) document.getElementById('taxes-kpi-retenciones').textContent = `$${fmtNum(retenciones)}`;

    const tbody = document.getElementById('taxes-tbody');
    if (!tbody) return;
    if (!f29Docs.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--dash-text-secondary);padding:2rem;">Sin datos para el periodo</td></tr>`;
      return;
    }

    tbody.innerHTML = f29Docs.map(d => {
      const date = new Date(d.fecha || 0);
      const exactDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const neto = d.neto || 0;
      const total = d.total || 0;
      const iva = ((total - neto) || 0);
      const operacion = (d.operacion || '').toLowerCase();
      const ventaNeto = operacion === 'venta' ? neto : 0;
      const compraNeto = operacion === 'compra' ? neto : 0;
      const ivaDeb = operacion === 'venta' ? iva : 0;
      const ivaCred = operacion === 'compra' ? iva : 0;
      return `<tr>
        <td>${exactDate}</td>
        <td>$${fmtNum(total)}</td>
        <td>${operacion === 'venta' ? '$' + fmtNum(ventaNeto) : '$0'}</td>
        <td>${operacion === 'compra' ? '$' + fmtNum(compraNeto) : '$0'}</td>
        <td>$${fmtNum(ivaDeb)}</td>
        <td>$${fmtNum(ivaCred)}</td>
        <td>$${fmtNum(Math.max(0, ivaDebito - ivaCredito))}</td>
      </tr>`;
    }).join('');
  }

  const refreshBtn = document.getElementById('btn-refresh-taxes');
  if (refreshBtn) { refreshBtn.addEventListener('click', refresh); }
  if (yearSelect) { yearSelect.addEventListener('change', refresh); }
  if (monthSelect) { monthSelect.addEventListener('change', refresh); }
  const f29Btn = document.getElementById('btn-export-f29');
  if (f29Btn) {
    f29Btn.addEventListener('click', async () => {
      const year = parseInt(yearSelect?.value) || currentYear;
      const month = monthSelect?.value || '';
      const data = await getPresiiDocs();
      const subset = data.filter(d => {
        const date = new Date(d.fecha || 0);
        if (date.getFullYear() !== year) return false;
        if (!month) return true;
        return String(date.getMonth() + 1).padStart(2, '0') === month;
      });
      const rows = [['Fecha', 'Tipo', 'Operación', 'Folio', 'RUT', 'Razon Social', 'Neto', 'IVA', 'Total', 'Estado']];
      subset.forEach(d => {
        const iva = ((d.total || 0) - (d.neto || 0)) || 0;
        const operacion = (d.operacion || '').toLowerCase();
        const displayRut = operacion === 'compra' ? (d.emi_rut || '') : (d.rut_receptor || '');
        const displayName = operacion === 'compra' ? (d.emi_name || '') : (d.razon_social || '');
        rows.push([d.fecha || '', d.tipo_dte || '', d.operacion || '', d.folio || '', displayRut, displayName, d.neto || 0, iva, d.total || 0, d.estado || '']);
      });
      const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `f29_${year}${month ? `_${month}` : ''}.csv`; a.click();
    });
  }
  const f22Btn = document.getElementById('btn-export-f22');
  if (f22Btn) {
    f22Btn.addEventListener('click', async () => {
      const year = parseInt(yearSelect?.value) || currentYear;
      const data = await getPresiiDocs();
      const subset = data.filter(d => new Date(d.fecha || 0).getFullYear() === year && ['venta', 'compra'].includes((d.operacion || '').toLowerCase()));
      const totalIngresos = subset.reduce((s, d) => s + (d.total || 0), 0);
      const totalVentas = subset.filter(d => (d.operacion || '').toLowerCase() === 'venta').reduce((s, d) => s + (d.total || 0), 0);
      const totalCompras = subset.filter(d => (d.operacion || '').toLowerCase() === 'compra').reduce((s, d) => s + (d.total || 0), 0);
      const totalIva = subset.reduce((s, d) => s + (((d.total || 0) - (d.neto || 0)) || 0), 0);
      const rows = [['Año', 'Ingresos', 'Ventas', 'Compras', 'IVA']];
      rows.push([year, totalIngresos, totalVentas, totalCompras, totalIva]);
      const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `f22_${year}.csv`; a.click();
    });
  }

  await refresh();
}

function getPagoTypeLabel(payment) {
  const tipo = String(payment?.tipo || '').toLowerCase();
  if (tipo === 'honorarios') {
    return `Boleta Honorarios · ${getPagoOperation(payment) === 'venta' ? 'Venta' : 'Compra'}`;
  }
  if (tipo === 'directo') return 'Pago directo / efectivo';
  return 'Pago Contrato';
}

async function renderPayments() {
  const list = await getPagos();
  const tbody = document.getElementById('payments-tbody');
  const search = (document.getElementById('payments-search')?.value || '').toLowerCase();
  const tipo = document.getElementById('payments-filter-tipo')?.value || '';
  const operationFilter = document.getElementById('payments-filter-operation')?.value || '';
  const year = document.getElementById('payments-filter-year')?.value || '';
  const fMes = document.getElementById('payments-filter-mes')?.value || '';
  const canManage = isButtonAllowed('btn-add-payment');

  // Filtrar por período: mes + año (fMes usa formato YYYY-MM), o año solo
  let listPeriodo = list;
  if (fMes) {
    listPeriodo = filterByMonth(list, fMes, 'fecha');
  } else if (year) {
    listPeriodo = list.filter(p => {
      if (!p.fecha) return false;
      const d = new Date(p.fecha);
      return !Number.isNaN(d.valueOf()) && String(d.getFullYear()) === year;
    });
  }

  // Calcular KPIs: Totales acumulados según periodo seleccionado
  const activePayments = listPeriodo.filter(p => !p.skip_analytics && isSiiPaidStatus(p.status));
  const paymentNet = p => Number(p.neto ?? p.bruto ?? 0) || 0;
  const totalIncome = activePayments
    .filter(p => String(p.tipo || '').toLowerCase() === 'honorarios' && getPagoOperation(p) === 'venta')
    .reduce((sum, p) => sum + paymentNet(p), 0);
  const totalExpenses = activePayments
    .filter(p => String(p.tipo || '').toLowerCase() !== 'honorarios' || getPagoOperation(p) === 'compra')
    .reduce((sum, p) => sum + paymentNet(p), 0);
  const totalRetenciones = activePayments.reduce((sum, p) => sum + (parseFloat(p.descuentos) || 0), 0);
  const netBalance = totalIncome - totalExpenses;

  // Actualizar KPI cards
  const kpiTotal = document.getElementById('payments-kpi-total');
  const kpiCantidad = document.getElementById('payments-kpi-cantidad');
  const kpiPendiente = document.getElementById('payments-kpi-pendiente');
  const kpiRetenciones = document.getElementById('payments-kpi-retenciones');

  if (kpiTotal) kpiTotal.textContent = formatCurrency(totalIncome);
  if (kpiCantidad) kpiCantidad.textContent = formatCurrency(totalExpenses);
  if (kpiPendiente) {
    kpiPendiente.textContent = formatCurrency(netBalance);
    kpiPendiente.style.color = netBalance < 0 ? '#C62828' : '#2e547d';
  }
  if (kpiRetenciones) kpiRetenciones.textContent = formatCurrency(totalRetenciones);

  let listMes = listPeriodo;

  const filtered = listMes.filter(p => {
    const matchSearch = !search || p.nombre?.toLowerCase().includes(search) || p.rut?.includes(search) || p.descripcion?.toLowerCase().includes(search);
    const matchTipo = !tipo || p.tipo === tipo;
    const operation = String(p.tipo || '').toLowerCase() === 'honorarios' ? getPagoOperation(p) : 'compra';
    const matchOperation = !operationFilter || operation === operationFilter;
    return matchSearch && matchTipo && matchOperation;
  });

  const sEl = document.getElementById('payments-search');
  const tEl = document.getElementById('payments-filter-tipo');
  const operationEl = document.getElementById('payments-filter-operation');
  const yearEl = document.getElementById('payments-filter-year');
  const mesEl = document.getElementById('payments-filter-mes');

  // Setup listeners only once to avoid duplicates
  if (!window._paymentsListenersSetup) {
    if (sEl) { sEl.addEventListener('input', renderPayments); }
    if (tEl) { tEl.addEventListener('change', renderPayments); }
    if (operationEl) { operationEl.addEventListener('change', renderPayments); }
    if (yearEl) { yearEl.addEventListener('change', renderPayments); }
    if (mesEl) { mesEl.addEventListener('change', renderPayments); }

    const btnNew = document.getElementById('btn-add-payment');
    if (btnNew) { btnNew.addEventListener('click', () => openPaymentModal(null)); }
    const btnExport = document.getElementById('btn-export-payments');
    if (btnExport) { btnExport.addEventListener('click', exportPaymentsCSV); }

    window._paymentsListenersSetup = true;
  }

  // Inicializar filtros de período sin resetear listeners
  if (yearEl && !yearEl.dataset.initialized) {
    const currentYear = new Date().getFullYear();
    let opts = ['<option value="">Todos los años</option>'];
    for (let y = currentYear; y >= currentYear - 5; y--) {
      opts.push(`<option value="${y}">${y}</option>`);
    }
    yearEl.innerHTML = opts.join('');
    yearEl.dataset.initialized = 'true';
  }

  if (mesEl && !mesEl.dataset.initialized) {
    const now = new Date();
    const opts = ['<option value="">Todos los períodos</option>'];
    for (let i = 0; i < 13; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('es-CL', { month: 'long', year: 'numeric' });
      opts.push(`<option value="${val}">${label.charAt(0).toUpperCase() + label.slice(1)}</option>`);
    }
    mesEl.innerHTML = opts.join('');
    mesEl.dataset.initialized = 'true';
  }

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;color:var(--dash-text-secondary);padding:2rem;">${listMes.length ? 'Sin resultados para los filtros aplicados' : 'No hay movimientos registrados. Usa "Nueva boleta / pago" para comenzar.'}</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(p => {
    return `<tr>
      <td>${p.fecha || '-'}</td>
      <td>${getPagoTypeLabel(p)}</td>
      <td>${escapeHtml(p.nombre || '-')}</td>
      <td style="font-family:monospace;">${p.rut || '-'}</td>
      <td>$${fmtNum(p.bruto || 0)}</td>
      <td>$${fmtNum(p.descuentos || 0)}</td>
      <td style="font-weight:700;">$${fmtNum(p.neto || 0)}</td>
      <td>${p.skip_analytics ? '<span style="color:#d97706;font-weight:600;">Sí</span>' : 'No'}</td>
      <td>${escapeHtml(getPagoDescription(p) || '-')}</td>
      <td>
        <div style="display:flex;gap:6px;align-items:center;">
          <button class="btn-dash btn-dash--secondary btn-dash--sm" onclick="viewPayment('${p.id}')" title="Ver"><i data-lucide="eye" style="width:13px;height:13px;"></i></button>
          ${canManage ? `<button class="btn-dash btn-dash--secondary btn-dash--sm" onclick="openPaymentModal('${p.id}')" title="Editar"><i data-lucide="pencil" style="width:13px;height:13px;"></i></button><button class="btn-dash btn-dash--secondary btn-dash--sm" style="color:var(--dash-danger);" onclick="deletePago('${p.id}')" title="Eliminar"><i data-lucide="trash-2" style="width:13px;height:13px;"></i></button>` : ''}
        </div>
      </td>
    </tr>`;
  }).join('');

  if (typeof lucide !== 'undefined') setTimeout(() => lucide.createIcons(), 50);
}

function togglePaymentSections() {
  const tipo = document.getElementById('payment-tipo')?.value || 'honorarios';
  const operacion = normalizeSiiPagoOperation(document.getElementById('payment-operacion')?.value || 'compra');
  const honors = document.getElementById('payment-honorarios-fields');
  const contract = document.getElementById('payment-contrato-fields');
  const operation = document.getElementById('payment-operacion-wrap');
  const amountTitle = document.getElementById('payment-amount-title');
  const discountLabel = document.getElementById('payment-discount-label');
  const rutLabel = document.getElementById('payment-rut-label');
  const nameLabel = document.getElementById('payment-name-label');
  const conceptLabel = document.getElementById('payment-concept-label');
  const heading = document.getElementById('payment-modal-heading');
  const partyPicker = document.getElementById('payment-employee-picker');
  const partyPickerLabel = partyPicker?.querySelector('.entity-picker__label, .modal-form__label');
  const partyPickerInput = document.getElementById('payment-employee-picker-input');
  if (honors) honors.style.display = tipo === 'honorarios' || tipo === 'directo' ? 'block' : 'none';
  if (contract) contract.style.display = tipo === 'contrato' ? 'grid' : 'none';
  if (operation) operation.style.display = tipo === 'honorarios' ? 'block' : 'none';
  if (amountTitle) amountTitle.textContent = tipo === 'directo'
    ? 'Pago directo sin documento'
    : operacion === 'venta' ? 'Honorarios por cobrar al cliente' : 'Honorarios por pagar';
  if (discountLabel) discountLabel.textContent = tipo === 'directo' ? 'Sin descuentos' : 'Retención 15.25%';
  if (rutLabel) rutLabel.textContent = tipo === 'directo' ? 'RUT (opcional)' : 'RUT';
  if (nameLabel) nameLabel.textContent = tipo === 'honorarios' && operacion === 'venta' ? 'Cliente' : 'Nombre';
  if (conceptLabel) conceptLabel.textContent = tipo === 'honorarios' && operacion === 'venta' ? 'Servicio / Concepto' : 'Cargo / Concepto';
  if (heading) heading.textContent = tipo === 'honorarios'
    ? `Boleta de honorarios · ${operacion === 'venta' ? 'Venta' : 'Compra'}`
    : tipo === 'contrato' ? 'Pago de contrato' : 'Pago directo';
  if (partyPickerLabel) partyPickerLabel.textContent = tipo === 'honorarios' && operacion === 'venta'
    ? 'Buscar cliente existente'
    : 'Buscar empleado o proveedor existente';
  if (partyPickerInput) partyPickerInput.placeholder = tipo === 'honorarios' && operacion === 'venta'
    ? 'Buscar por cliente, empresa, RUT o email'
    : 'Buscar por empleado, proveedor, RUT o cargo';
}

function updatePaymentTotals() {
  const tipo = document.getElementById('payment-tipo')?.value || 'honorarios';
  let bruto = 0, descuentos = 0, neto = 0;

  if (tipo === 'honorarios') {
    bruto = parseFloat(document.getElementById('payment-bruto')?.value) || 0;
    const brutoEl = document.getElementById('payment-bruto');
    if (brutoEl) brutoEl.removeAttribute('readonly');
    const retencion = Math.round(bruto * 0.1525);
    descuentos = retencion;
    const descEl = document.getElementById('payment-descuentos');
    if (descEl) {
      descEl.value = descuentos;
      descEl.setAttribute('readonly', 'true');
    }
    neto = Math.max(0, bruto - descuentos);
  } else if (tipo === 'directo') {
    bruto = parseFloat(document.getElementById('payment-bruto')?.value) || 0;
    descuentos = 0;
    const brutoEl = document.getElementById('payment-bruto');
    if (brutoEl) brutoEl.removeAttribute('readonly');
    const descEl = document.getElementById('payment-descuentos');
    if (descEl) {
      descEl.value = 0;
      descEl.setAttribute('readonly', 'true');
    }
    neto = Math.max(0, bruto);
  } else {
    const base = parseFloat(document.getElementById('payment-sueldo-base')?.value) || 0;
    const bono = parseFloat(document.getElementById('payment-bono')?.value) || 0;
    const gratificacion = parseFloat(document.getElementById('payment-gratificacion')?.value) || 0;
    const horasExtra = parseFloat(document.getElementById('payment-horas-extra')?.value) || 0;
    const cotAFP = parseFloat(document.getElementById('payment-cot-afp')?.value) || 0;
    const cotVolAFP = parseFloat(document.getElementById('payment-cot-vol-afp')?.value) || 0;
    const cotPactSalud = parseFloat(document.getElementById('payment-cot-pact-salud')?.value) || 0;
    const difPlan = parseFloat(document.getElementById('payment-dif-plan-salud')?.value) || 0;
    const seguroCes = parseFloat(document.getElementById('payment-seguro-cesantia')?.value) || 0;
    const impUnico = parseFloat(document.getElementById('payment-impuesto-unico')?.value) || 0;

    bruto = base + bono + gratificacion + horasExtra;
    descuentos = cotAFP + cotVolAFP + cotPactSalud + difPlan + seguroCes + impUnico;

    const brutoEl = document.getElementById('payment-bruto');
    if (brutoEl) { brutoEl.value = bruto; brutoEl.setAttribute('readonly', 'true'); }
    const descEl = document.getElementById('payment-descuentos');
    if (descEl) { descEl.value = descuentos; descEl.setAttribute('readonly', 'true'); }

    const totalHaberesEl = document.getElementById('payment-total-haberes');
    const totalDescEl = document.getElementById('payment-total-desc');
    if (totalHaberesEl) totalHaberesEl.textContent = `$${fmtNum(bruto)}`;
    if (totalDescEl) totalDescEl.textContent = `$${fmtNum(descuentos)}`;

    neto = Math.max(0, bruto - descuentos);
  }

  ['payment-neto-preview', 'payment-neto'].forEach(id => {
    const netoEl = document.getElementById(id);
    if (netoEl) netoEl.textContent = `$${fmtNum(neto)}`;
  });
}
window.updatePaymentTotals = updatePaymentTotals;

async function openPaymentModal(id, initialType = 'honorarios') {
  const list = await getPagos();
  const doc = id ? list.find(p => p.id === id) : null;
  const today = new Date().toISOString().slice(0, 10);
  const selectedType = doc?.tipo || initialType || 'honorarios';
  const selectedOperation = getPagoOperation(doc);
  const body = `
    <div style="max-height:72vh;overflow-y:auto;padding-right:4px;">
      <h3 id="payment-modal-heading" style="margin:0 0 12px;color:var(--dash-text-primary);">Boleta de honorarios</h3>
      ${renderEntitySearchPicker({
        rootId: 'payment-employee-picker',
        type: 'payment-party',
        label: 'Buscar contraparte existente',
        placeholder: 'Buscar empleado, proveedor o cliente',
        helperText: 'En compra puedes seleccionar personal o proveedores; en venta, un cliente.',
        itemFilter: (record) => {
          const operation = document.getElementById('payment-operacion')?.value || selectedOperation;
          return operation === 'venta' ? record.entity_kind === 'client' : record.entity_kind !== 'client';
        },
        onSelect: (record) => {
          const nombreInput = document.getElementById('payment-nombre');
          const rutInput = document.getElementById('payment-rut');
          const cargoInput = document.getElementById('payment-cargo');
          const sueldoBaseInput = document.getElementById('payment-sueldo-base');
          const isProviderRecord = record.entity_kind === 'provider';
          const isClientRecord = record.entity_kind === 'client';
          if (nombreInput) nombreInput.value = (isProviderRecord || isClientRecord)
            ? (record.company || record.name || '')
            : (record.empleado || record.full_name || record.name || '');
          if (rutInput && record.rut) rutInput.value = record.rut;
          if (cargoInput) cargoInput.value = isClientRecord
            ? (record.company ? `Servicios para ${record.company}` : 'Servicios profesionales')
            : isProviderRecord
              ? (record.giro || record.company || record.name || '')
              : (record.cargo || record.role_title || '');
          if (sueldoBaseInput && record.sueldo_bruto != null) sueldoBaseInput.value = record.sueldo_bruto;
          updatePaymentTotals();
        }
      })}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">
        <div>
          <label class="form-field__label">Fecha</label>
          <input type="date" class="modal-form__input" id="payment-fecha" value="${doc?.fecha || today}">
        </div>
        <div>
          <label class="form-field__label">Tipo de Pago</label>
          <select class="modal-form__input" id="payment-tipo">
            <option value="honorarios" ${selectedType === 'honorarios' ? 'selected' : ''}>Boleta Honorarios</option>
            <option value="contrato" ${selectedType === 'contrato' ? 'selected' : ''}>Pago Contrato</option>
            <option value="directo" ${selectedType === 'directo' ? 'selected' : ''}>Pago directo / efectivo (sin documento)</option>
          </select>
        </div>
        <div id="payment-operacion-wrap">
          <label class="form-field__label">Operación</label>
          <select class="modal-form__input" id="payment-operacion">
            <option value="compra" ${selectedOperation === 'compra' ? 'selected' : ''}>Compra · pago de sueldo/honorarios</option>
            <option value="venta" ${selectedOperation === 'venta' ? 'selected' : ''}>Venta · ingreso de cliente</option>
          </select>
          <div style="font-size:0.78rem;color:var(--dash-text-secondary);margin-top:4px;">Compra se registra como egreso y venta como ingreso.</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div>
          <label class="form-field__label" id="payment-name-label">Nombre</label>
          <input type="text" class="modal-form__input" id="payment-nombre" value="${escapeHtml(doc?.nombre || '')}">
        </div>
        <div>
          <label class="form-field__label" id="payment-rut-label">RUT</label>
          <input type="text" class="modal-form__input" id="payment-rut" value="${escapeHtml(doc?.rut || '')}">
        </div>
        <div style="grid-column:span 2;">
          <label class="form-field__label" id="payment-concept-label">Cargo / Concepto</label>
          <input type="text" class="modal-form__input" id="payment-cargo" value="${escapeHtml(doc?.cargo || '')}">
        </div>
      </div>

      <section id="payment-honorarios-fields" style="margin-top:16px;display:block;background:var(--dash-surface-2);padding:12px;border-radius:10px;border:1px solid var(--dash-border);">
        <h4 id="payment-amount-title" style="margin:0 0 10px;font-size:0.95rem;color:var(--dash-text-muted);">Honorarios</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
          <div>
            <label class="form-field__label">Monto Bruto</label>
            <input type="number" class="modal-form__input" id="payment-bruto" value="${doc?.bruto || 0}" min="0" step="1" oninput="updatePaymentTotals()">
          </div>
          <div>
            <label class="form-field__label" id="payment-discount-label">Retención 15.25%</label>
            <input type="number" class="modal-form__input" id="payment-descuentos" value="${doc?.descuentos || 0}" min="0" step="1" readonly>
          </div>
          <div>
            <label class="form-field__label">Monto Neto</label>
            <div id="payment-neto-preview" style="font-size:1.06rem;font-weight:700;padding:10px;background:#fff;border-radius:6px;border:1px solid var(--dash-border);">$${fmtNum((doc?.neto != null ? doc.neto : (doc?.bruto || 0) - (doc?.descuentos || 0)))}</div>
          </div>
        </div>
      </section>

      <section id="payment-contrato-fields" style="margin-top:16px;display:none;background:var(--dash-surface-2);padding:12px;border-radius:10px;border:1px solid var(--dash-border);">
        <h4 style="margin:0 0 10px;font-size:0.95rem;color:var(--dash-text-muted);">Contrato</h4>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
          <div><label class="form-field__label">Sueldo Base</label><input type="number" class="modal-form__input" id="payment-sueldo-base" value="${doc?.sueldo_base || 0}" min="0" step="1" oninput="updatePaymentTotals()"></div>
          <div><label class="form-field__label">Bono</label><input type="number" class="modal-form__input" id="payment-bono" value="${doc?.bono || 0}" min="0" step="1" oninput="updatePaymentTotals()"></div>
          <div><label class="form-field__label">Gratificación</label><input type="number" class="modal-form__input" id="payment-gratificacion" value="${doc?.gratificacion || 0}" min="0" step="1" oninput="updatePaymentTotals()"></div>
          <div><label class="form-field__label">Horas Extra</label><input type="number" class="modal-form__input" id="payment-horas-extra" value="${doc?.horas_extra || 0}" min="0" step="1" oninput="updatePaymentTotals()"></div>
          <div><label class="form-field__label">Cotización AFP</label><input type="number" class="modal-form__input" id="payment-cot-afp" value="${doc?.cot_afp || 0}" min="0" step="1" oninput="updatePaymentTotals()"></div>
          <div><label class="form-field__label">Cot. Vol. AFP</label><input type="number" class="modal-form__input" id="payment-cot-vol-afp" value="${doc?.cot_vol_afp || 0}" min="0" step="1" oninput="updatePaymentTotals()"></div>
          <div><label class="form-field__label">Cot. Pactada Salud</label><input type="number" class="modal-form__input" id="payment-cot-pact-salud" value="${doc?.cot_pact_salud || 0}" min="0" step="1" oninput="updatePaymentTotals()"></div>
          <div><label class="form-field__label">Dif. Plan Salud</label><input type="number" class="modal-form__input" id="payment-dif-plan-salud" value="${doc?.dif_plan_salud || 0}" min="0" step="1" oninput="updatePaymentTotals()"></div>
          <div><label class="form-field__label">Seguro Cesantía</label><input type="number" class="modal-form__input" id="payment-seguro-cesantia" value="${doc?.seguro_cesantia || 0}" min="0" step="1" oninput="updatePaymentTotals()"></div>
          <div><label class="form-field__label">Impuesto Único</label><input type="number" class="modal-form__input" id="payment-impuesto-unico" value="${doc?.impuesto_unico || 0}" min="0" step="1" oninput="updatePaymentTotals()"></div>
          <div style="grid-column: span 3; margin-top: 12px; display:flex;justify-content:space-between;gap:10px;">
            <div style="flex:1;background:#ffffff;border:1px solid var(--dash-border);border-radius:8px;padding:10px;text-align:center;">
              <div style="font-size:0.8rem;color:var(--dash-text-secondary);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Total Haberes</div>
              <div id="payment-total-haberes" style="font-size:1.05rem;font-weight:700;">$0</div>
            </div>
            <div style="flex:1;background:#ffffff;border:1px solid var(--dash-border);border-radius:8px;padding:10px;text-align:center;">
              <div style="font-size:0.8rem;color:var(--dash-text-secondary);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Total Descuentos</div>
              <div id="payment-total-desc" style="font-size:1.05rem;font-weight:700;">$0</div>
            </div>
          </div>
        </div>
      </section>

      <p style="margin:16px 0 6px;font-weight:700;">Monto Neto</p>
      <div id="payment-neto" style="font-size:1.25rem;font-weight:800;padding:10px;border-radius:7px;border:1px solid var(--dash-border);background:#fff;">$${fmtNum((doc?.neto != null ? doc.neto : (doc?.bruto || 0) - (doc?.descuentos || 0)))}</div>
      <div style="margin-top:16px;">
        <label class="form-field__label">Estado del pago</label>
        <select class="modal-form__input" id="payment-status">
          <option value="pendiente" ${(doc?.status || 'pendiente') === 'pendiente' ? 'selected' : ''}>Pendiente</option>
          <option value="pagado" ${doc?.status === 'pagado' ? 'selected' : ''}>Pagado</option>
          <option value="anulado" ${doc?.status === 'anulado' ? 'selected' : ''}>Anulado</option>
        </select>
      </div>
      <p class="doc-section-title" style="margin-top:18px;">Notas</p>
      <textarea class="modal-form__input" id="payment-descripcion" rows="4" style="resize:vertical;">${escapeHtml(doc?.descripcion || '')}</textarea>
    </div>`;

  openModal(doc ? 'Editar boleta o pago' : 'Nueva boleta o pago', body, 'Guardar', async () => {
    const fecha = document.getElementById('payment-fecha')?.value || today;
    const tipo = document.getElementById('payment-tipo')?.value || 'honorarios';
    const nombre = document.getElementById('payment-nombre')?.value.trim();
    const rut = formatRut(document.getElementById('payment-rut')?.value);
    const cargo = document.getElementById('payment-cargo')?.value.trim();
    const bruto = parseFloat(document.getElementById('payment-bruto')?.value) || 0;
    const descuentos = parseFloat(document.getElementById('payment-descuentos')?.value) || 0;
    const neto = Math.max(0, bruto - descuentos);
    const descripcion = document.getElementById('payment-descripcion')?.value.trim() || '';
    const status = document.getElementById('payment-status')?.value || (doc?.status || 'pendiente');
    const operacion = tipo === 'honorarios'
      ? normalizeSiiPagoOperation(document.getElementById('payment-operacion')?.value || doc?.operacion || 'compra')
      : tipo === 'directo' ? 'compra' : null;
    if (!nombre || (tipo !== 'directo' && !rut)) {
      showToast(tipo === 'directo' ? 'El nombre o concepto es obligatorio' : 'Nombre y RUT son obligatorios', 'warning');
      return;
    }

    const newDoc = {
      id: doc?.id || crypto.randomUUID(),
      fecha, tipo, operacion, nombre, rut, cargo,
      bruto, descuentos, neto, descripcion,
      status,
      sueldo_base: parseFloat(document.getElementById('payment-sueldo-base')?.value) || 0,
      bono: parseFloat(document.getElementById('payment-bono')?.value) || 0,
      gratificacion: parseFloat(document.getElementById('payment-gratificacion')?.value) || 0,
      horas_extra: parseFloat(document.getElementById('payment-horas-extra')?.value) || 0,
      cot_afp: parseFloat(document.getElementById('payment-cot-afp')?.value) || 0,
      cot_vol_afp: parseFloat(document.getElementById('payment-cot-vol-afp')?.value) || 0,
      cot_pact_salud: parseFloat(document.getElementById('payment-cot-pact-salud')?.value) || 0,
      dif_plan_salud: parseFloat(document.getElementById('payment-dif-plan-salud')?.value) || 0,
      seguro_cesantia: parseFloat(document.getElementById('payment-seguro-cesantia')?.value) || 0,
      impuesto_unico: parseFloat(document.getElementById('payment-impuesto-unico')?.value) || 0,
      descripcion,
      skip_analytics: doc?.skip_analytics || false,
      created_at: doc?.created_at || new Date().toISOString()
    };

    const err = await savePago(newDoc);
    if (err) { showToast('Error al guardar: ' + (err.message || err), 'error'); return; }
    closeModal();
    await renderPayments();
    await refreshUnifiedSiiIfVisible();
    showToast(doc ? 'Movimiento actualizado' : 'Movimiento registrado correctamente', 'success');
  });

  const clearPaymentParty = () => {
    ['payment-employee-picker-input', 'payment-employee-picker-value', 'payment-nombre', 'payment-rut', 'payment-cargo'].forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field) field.value = '';
    });
    const pickerResults = document.getElementById('payment-employee-picker-results');
    if (pickerResults) pickerResults.hidden = true;
  };

  const tipoSelect = document.getElementById('payment-tipo');
  if (tipoSelect) {
    tipoSelect.addEventListener('change', () => {
      clearPaymentParty();
      togglePaymentSections();
      updatePaymentTotals();
    });
  }
  const operationSelect = document.getElementById('payment-operacion');
  if (operationSelect) {
    operationSelect.addEventListener('change', () => {
      clearPaymentParty();
      togglePaymentSections();
      updatePaymentTotals();
    });
  }
  togglePaymentSections();
  updatePaymentTotals();

  setTimeout(() => {
    const mc = document.querySelector('.dash-modal__content');
    if (mc) mc.classList.add('dash-modal__content--fullscreen');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }, 60);
}
window.openPaymentModal = openPaymentModal;

async function viewPayment(id) {
  const list = await getPagos();
  const doc = list.find(p => p.id === id);
  if (!doc) { showToast('Pago no encontrado', 'error'); return; }

  const neto = doc.neto != null ? doc.neto : Math.max(0, (parseFloat(doc.bruto) || 0) - (parseFloat(doc.descuentos) || 0));
  const operationLabel = doc.tipo === 'honorarios' ? (getPagoOperation(doc) === 'venta' ? 'Venta' : 'Compra') : '';
  const body = `
    <div style="display:grid;grid-template-columns:1fr 320px;gap:16px;align-items:start;">
      <div>
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:12px;">
          <div>
            <h3 style="margin:0 0 4px;">${escapeHtml(doc.nombre || 'Pago')}</h3>
            <div style="color:var(--dash-text-secondary);">${escapeHtml(doc.cargo || 'Sin cargo/concepto')}</div>
          </div>
          ${isButtonAllowed('btn-add-payment') ? `<button class="btn-dash btn-dash--secondary btn-dash--sm" onclick="openPaymentModal('${doc.id}')"><i data-lucide="pencil" style="width:13px;height:13px;"></i> Editar</button>` : ''}
        </div>

        <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;">
          <div style="background:var(--dash-surface-2);border:1px solid var(--dash-border);border-radius:10px;padding:12px;">
            <div style="font-size:0.8rem;color:var(--dash-text-secondary);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px;">Fecha</div>
            <div style="font-weight:700;">${escapeHtml(doc.fecha || '-')}</div>
          </div>
          <div style="background:var(--dash-surface-2);border:1px solid var(--dash-border);border-radius:10px;padding:12px;">
            <div style="font-size:0.8rem;color:var(--dash-text-secondary);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px;">Tipo</div>
            <div style="font-weight:700;">${getPagoTypeLabel(doc)}</div>
          </div>
          ${doc.tipo === 'honorarios' ? `
          <div style="background:var(--dash-surface-2);border:1px solid var(--dash-border);border-radius:10px;padding:12px;">
            <div style="font-size:0.8rem;color:var(--dash-text-secondary);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px;">Operación</div>
            <div style="font-weight:700;">${operationLabel || 'Compra'}</div>
          </div>
          ` : ''}
          <div style="background:var(--dash-surface-2);border:1px solid var(--dash-border);border-radius:10px;padding:12px;">
            <div style="font-size:0.8rem;color:var(--dash-text-secondary);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px;">RUT</div>
            <div style="font-family:monospace;font-weight:700;">${escapeHtml(doc.rut || '-')}</div>
          </div>
          <div style="background:var(--dash-surface-2);border:1px solid var(--dash-border);border-radius:10px;padding:12px;">
            <div style="font-size:0.8rem;color:var(--dash-text-secondary);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px;">Estado del pago</div>
            <div style="font-weight:700;">${escapeHtml((doc.status || 'pendiente') === 'pagado' ? 'Pagado' : (doc.status || 'pendiente') === 'anulado' ? 'Anulado' : 'Pendiente')}</div>
          </div>
        </div>

        <div style="margin-top:14px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;">
          <div style="background:#fff;border:1px solid var(--dash-border);border-radius:10px;padding:12px;">
            <div style="font-size:0.8rem;color:var(--dash-text-secondary);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px;">Bruto</div>
            <div style="font-weight:800;font-size:1.05rem;">${formatCurrency(doc.bruto || 0)}</div>
          </div>
          <div style="background:#fff;border:1px solid var(--dash-border);border-radius:10px;padding:12px;">
            <div style="font-size:0.8rem;color:var(--dash-text-secondary);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px;">Descuentos</div>
            <div style="font-weight:800;font-size:1.05rem;">${formatCurrency(doc.descuentos || 0)}</div>
          </div>
          <div style="background:#fff;border:1px solid var(--dash-border);border-radius:10px;padding:12px;">
            <div style="font-size:0.8rem;color:var(--dash-text-secondary);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px;">Neto</div>
            <div style="font-weight:800;font-size:1.05rem;">${formatCurrency(neto)}</div>
          </div>
        </div>

        <div style="margin-top:14px;">
          <div style="font-size:0.82rem;font-weight:700;color:var(--dash-text-secondary);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Descripción</div>
          <div style="padding:12px;border:1px solid var(--dash-border);border-radius:10px;background:var(--dash-surface-2);min-height:72px;white-space:pre-wrap;">${escapeHtml(getPagoDescription(doc) || 'Sin descripción')}</div>
        </div>
      </div>

      <div>
        <div style="background:var(--dash-surface-2);border:1px solid var(--dash-border);border-radius:10px;padding:12px;">
          <div style="font-size:0.82rem;font-weight:700;color:var(--dash-text-secondary);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">Resumen</div>
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--dash-border);"><span>Nombre</span><strong>${escapeHtml(doc.nombre || '-')}</strong></div>
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--dash-border);"><span>Cargo</span><strong style="text-align:right;max-width:170px;">${escapeHtml(doc.cargo || '-')}</strong></div>
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--dash-border);"><span>Fecha</span><strong>${escapeHtml(doc.fecha || '-')}</strong></div>
          <div style="display:flex;justify-content:space-between;padding:8px 0;"><span>Tipo</span><strong>${getPagoTypeLabel(doc)}</strong></div>
        </div>
      </div>
    </div>
  `;

  openModal('Detalle de Pago', body, null, null, true);
  setTimeout(() => {
    const mc = document.querySelector('.dash-modal__content');
    if (mc) mc.classList.add('dash-modal__content--fullscreen');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }, 60);
}
window.viewPayment = viewPayment;

function deletePago(id) {
  openModal('Eliminar Pago', '<p>¿Seguro que deseas eliminar este pago?</p>', 'Eliminar', async () => {
    const err = await deletePagoDB(id);
    if (err) { showToast('Error al eliminar: ' + (err.message || err), 'error'); return; }
    closeModal(); await renderPayments(); showToast('Pago eliminado', 'success');
  });
}
window.deletePago = deletePago;

async function exportPaymentsCSV() {
  const list = await getPagos();
  const rows = [['Fecha', 'Tipo', 'Operación', 'Contraparte', 'RUT', 'Concepto', 'Bruto', 'Retención / descuentos', 'Neto', 'No contabilizar', 'Descripción']];
  list.forEach(p => rows.push([p.fecha || '', getPagoTypeLabel(p), String(p.tipo || '').toLowerCase() === 'honorarios' ? getPagoOperation(p) : 'compra', p.nombre || '', p.rut || '', p.cargo || '', p.bruto || 0, p.descuentos || 0, p.neto || 0, p.skip_analytics ? 'Sí' : 'No', getPagoDescription(p)]));
  const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = `pagos_${new Date().toLocaleDateString('es-CL').replace(/\//g, '-')}.csv`; a.click();
}

const QUOTE_CONDITION_PHRASES = [
  ['pago', 'Las condiciones de pago serán ', 'Condiciones de pago'],
  ['etapas', 'El proyecto se ejecutará en las etapas ', 'Etapas'],
  ['plazos', 'Los plazos de entrega serán ', 'Plazos de entrega'],
  ['entregables', 'Los entregables serán ', 'Entregables'],
  ['garantia', 'La garantía será de ', 'Garantías'],
  ['defectos', 'La corrección de defectos se realizará ', 'Corrección de defectos'],
  ['pruebas', 'Las pruebas unitarias incluirán ', 'Pruebas unitarias'],
  ['documentacion', 'La documentación técnica comprenderá ', 'Documentación técnica'],
  ['codigo', 'La entrega y propiedad del código se acordará como ', 'Entrega y propiedad del código'],
  ['seguridad', 'Las medidas de seguridad serán ', 'Seguridad'],
  ['transferencia', 'La transferencia tecnológica se realizará mediante ', 'Transferencia tecnológica']
];

function readQuoteConditions(observaciones = '') {
  const values = {};
  let remaining = observaciones.trim().replace(' y los entregables serán ', '. Los entregables serán ');
  if (remaining.startsWith('Condiciones de pago:')) {
    const extra = [];
    remaining.split(/\r?\n/).forEach(line => {
      const field = QUOTE_CONDITION_PHRASES.find(([, , label]) => line.startsWith(label + ':'));
      if (field) values[field[0]] = line.slice(field[2].length + 1).trim();
      else if (line.startsWith('Plazos y entregables:')) values.plazos = line.slice('Plazos y entregables:'.length).trim();
      else if (line.trim()) extra.push(line);
    });
    return { values, extra: extra.join('\n') };
  }
  // Reabrir el párrafo guardado en sus mismos campos sin nuevas columnas.
  if (remaining.startsWith(QUOTE_CONDITION_PHRASES[0][1])) {
    for (let i = 0; i < QUOTE_CONDITION_PHRASES.length; i++) {
      const [key, prefix] = QUOTE_CONDITION_PHRASES[i];
      if (!remaining.startsWith(prefix)) return { values: {}, extra: observaciones };
      remaining = remaining.slice(prefix.length);
      const separator = i < QUOTE_CONDITION_PHRASES.length - 1
        ? '. ' + QUOTE_CONDITION_PHRASES[i + 1][1] : '.\n\n';
      const end = remaining.indexOf(separator);
      if (end < 0 && i < QUOTE_CONDITION_PHRASES.length - 1) return { values: {}, extra: observaciones };
      const value = end < 0 ? remaining.replace(/\.$/, '') : remaining.slice(0, end);
      values[key] = /^_+$/.test(value) ? '' : value;
      remaining = end < 0 ? '' : remaining.slice(end + (i < QUOTE_CONDITION_PHRASES.length - 1 ? 2 : 3));
    }
    return { values, extra: remaining };
  }
  // Las observaciones libres anteriores se conservan para su edición.
  return { values, extra: observaciones };
}

function buildQuoteConditions(values, extra = '') {
  const paragraph = QUOTE_CONDITION_PHRASES.map(([key, prefix]) =>
    prefix + (String(values[key] || '').trim().replace(/\s+/g, ' ') || '____________') + '.'
  ).join(' ');
  return paragraph + (extra.trim() ? '\n\n' + extra.trim() : '');
}

// ---- Open Cotización Modal ----
async function openCotizacionModal(id) {
  _docItemIdx = 0;
  const list = await getCotizaciones();
  const doc = id ? list.find(c => c.id === id) : null;
  const company = getCompanyInfo();
  const today = new Date().toISOString().slice(0, 10);
  const exento = doc?.exento || false;
  const quoteConditions = readQuoteConditions(doc?.observaciones || '');

  const itemsHtml = (doc?.items || [{ desc: '', qty: 1, unit_price: 0, discount_pct: 0 }]).map(it => {
    const idx = ++_docItemIdx;
    return `<tr id="item-row-${idx}">
      <td><input type="text" class="item-desc" value="${escapeHtml(it.desc || '')}" placeholder="Descripción"></td>
      <td class="td-num"><input type="number" class="item-qty"  value="${it.qty || 1}"  min="0.01" step="any"  style="width:60px;text-align:right;"  oninput="updateDocTotals()"></td>
      <td class="td-num"><input type="number" class="item-up"   value="${it.unit_price || 0}" min="0" step="1"   style="width:90px;text-align:right;"  oninput="updateDocTotals()"></td>
      <td class="td-num"><input type="number" class="item-disc" value="${it.discount_pct || 0}" min="0" max="100" step="0.1" style="width:55px;text-align:right;" oninput="updateDocTotals()"></td>
      <td class="td-num item-total-cell" style="font-weight:600;">${fmtNum(calcItemTotal(it))}</td>
      <td><button type="button" class="doc-items__btn-remove" onclick="removeItemRow(${idx})"><i data-lucide="x" style="width:14px;height:14px;"></i></button></td>
    </tr>`;
  }).join('');

  const { neto, iva, total } = calcTotalsFromItems(doc?.items || [], exento);

  const body = `
    <div style="max-height:72vh;overflow-y:auto;padding-right:4px;">
      <p class="doc-section-title">Datos del Documento</p>
      <div class="doc-modal-grid">
        <div>
          <label class="form-field__label">N° Cotización</label>
          <input type="text" class="modal-form__input" id="cot-folio" value="${doc ? 'COT-' + String(doc.folio).padStart(6, '0') : '(Auto)'}" readonly style="background:var(--dash-surface-2);opacity:0.7;">
        </div>
        <div>
          <label class="form-field__label">Fecha Emisión</label>
          <input type="date" class="modal-form__input" id="cot-fecha" value="${doc?.fecha || today}">
        </div>
        <div>
          <label class="form-field__label">Validez (días)</label>
          <input type="number" class="modal-form__input" id="cot-vigencia" value="${doc?.vigencia || 30}" min="1">
        </div>
        <div>
          <label class="form-field__label">Estado</label>
          <select class="modal-form__input" id="cot-estado">
            <option value="vigente"   ${(doc?.estado || 'vigente') === 'vigente' ? 'selected' : ''}>Vigente</option>
            <option value="aceptada"  ${doc?.estado === 'aceptada' ? 'selected' : ''}>Aceptada</option>
            <option value="facturada" ${doc?.estado === 'facturada' ? 'selected' : ''}>Facturada</option>
            <option value="rechazada" ${doc?.estado === 'rechazada' ? 'selected' : ''}>Rechazada</option>
            <option value="vencida"   ${doc?.estado === 'vencida' ? 'selected' : ''}>Vencida</option>
          </select>
        </div>
      </div>

      <p class="doc-section-title">Emisor</p>
      <div class="doc-modal-grid">
        <div>
          <label class="form-field__label">Razón Social Emisor</label>
          <input type="text" class="modal-form__input" id="emi-name" value="${escapeHtml(company.name)}" readonly style="background:var(--dash-surface-2);opacity:0.65;cursor:default;">
        </div>
        <div>
          <label class="form-field__label">RUT Emisor</label>
          <input type="text" class="modal-form__input" id="emi-rut" value="${escapeHtml(company.rut)}" readonly style="background:var(--dash-surface-2);opacity:0.65;cursor:default;">
        </div>
        <div>
          <label class="form-field__label">Giro</label>
          <input type="text" class="modal-form__input" id="emi-giro" value="${escapeHtml(company.giro)}" readonly style="background:var(--dash-surface-2);opacity:0.65;cursor:default;">
        </div>
        <div>
          <label class="form-field__label">Dirección</label>
          <input type="text" class="modal-form__input" id="emi-address" value="${escapeHtml(company.address)}" readonly style="background:var(--dash-surface-2);opacity:0.65;cursor:default;">
        </div>
        <div>
          <label class="form-field__label">Contacto proveedor · Nombre</label>
          <input type="text" class="modal-form__input" id="cot-provider-contact-name" value="${escapeHtml(doc?.contacto_proveedor_nombre || '')}" placeholder="Nombre del contacto">
        </div>
        <div>
          <label class="form-field__label">Contacto proveedor · Teléfono</label>
          <input type="tel" class="modal-form__input" id="cot-provider-contact-phone" value="${escapeHtml(doc?.contacto_proveedor_telefono || company.phone || '')}" placeholder="+56 9 1234 5678">
        </div>
        <div>
          <label class="form-field__label">Contacto proveedor · Cargo</label>
          <input type="text" class="modal-form__input" id="cot-provider-contact-role" value="${escapeHtml(doc?.contacto_proveedor_cargo || '')}" placeholder="Ej.: Ejecutivo comercial">
        </div>
      </div>

      <p class="doc-section-title">Receptor (Cliente)</p>
      ${renderEntitySearchPicker({
        rootId: 'cot-client-picker',
        type: 'client',
        label: 'Buscar cliente existente',
        placeholder: 'Buscar cliente por nombre, empresa o RUT',
        helperText: 'Selecciona un cliente y se completarán razón social, RUT y contacto.',
        onSelect: (record) => {
          const setValue = (fieldId, value) => {
            const field = document.getElementById(fieldId);
            if (field && value != null) field.value = value;
          };
          setValue('rec-name', record.company || record.name || '');
          setValue('rec-rut', record.rut || '');
          setValue('rec-giro', record.giro || '');
          setValue('rec-dir', record.address || '');
          setValue('rec-ciudad', record.city || '');
          setValue('rec-email', record.email || '');
        }
      })}
      <div class="doc-modal-grid">
        <div>
          <label class="form-field__label">Razón Social</label>
          <input type="text" class="modal-form__input" id="rec-name" value="${escapeHtml(doc?.razon_social || '')}">
        </div>
        <div>
          <label class="form-field__label">RUT</label>
          <input type="text" class="modal-form__input" id="rec-rut" value="${escapeHtml(doc?.rut_receptor || '')}">
        </div>
        <div>
          <label class="form-field__label">Giro</label>
          <input type="text" class="modal-form__input" id="rec-giro" value="${escapeHtml(doc?.giro_receptor || '')}">
        </div>
        <div>
          <label class="form-field__label">Dirección</label>
          <input type="text" class="modal-form__input" id="rec-dir" value="${escapeHtml(doc?.direccion_receptor || '')}">
        </div>
        <div>
          <label class="form-field__label">Ciudad</label>
          <input type="text" class="modal-form__input" id="rec-ciudad" value="${escapeHtml(doc?.ciudad_receptor || '')}">
        </div>
        <div>
          <label class="form-field__label">Email</label>
          <input type="email" class="modal-form__input" id="rec-email" value="${escapeHtml(doc?.email_receptor || '')}">
        </div>
      </div>

      <p class="doc-section-title">Ítems / Servicios</p>
      <div class="doc-items-wrap">
        <table class="doc-items-table">
          <thead><tr><th>Descripción</th><th>Cant.</th><th>P. Unit. ($)</th><th>Desc. %</th><th>Total</th><th></th></tr></thead>
          <tbody id="doc-items-tbody">${itemsHtml}</tbody>
        </table>
        <div class="doc-items-footer">
          <button type="button" class="btn-add-item" onclick="addItemRow()"><i data-lucide="plus" style="width:13px;height:13px;"></i> Agregar ítem</button>
          <label style="font-size:0.8rem;display:flex;align-items:center;gap:6px;cursor:pointer;">
            <input type="checkbox" id="doc-exento" ${exento ? 'checked' : ''} onchange="updateDocTotals()"> Exento de IVA
          </label>
        </div>
      </div>

      <div class="doc-totals" style="margin-top:12px;">
        <div class="doc-totals__row"><span class="lbl">Precio neto:</span><span class="val" id="doc-neto">$${fmtNum(neto)}</span></div>
        <div class="doc-totals__row"><span class="lbl">Impuestos (IVA 19%):</span><span class="val" id="doc-iva">${exento ? '$0 (Exento)' : '$' + fmtNum(iva)}</span></div>
        <div class="doc-totals__divider"></div>
        <div class="doc-totals__row doc-totals__row--total"><span class="lbl">PRECIO TOTAL:</span><span class="val" id="doc-total">$${fmtNum(total)}</span></div>
      </div>

      <p class="doc-section-title">Observaciones / Condiciones comerciales y técnicas</p>
      <p id="cot-obs-help">Completa los espacios de este párrafo. El texto resultante aparecerá en el PDF.</p>
      <div id="cot-condition-fields" style="line-height:2.8;padding:12px;border:1px solid var(--dash-border);border-radius:8px;" aria-describedby="cot-obs-help">
        ${QUOTE_CONDITION_PHRASES.map(([key, prefix, label]) => `<span>${escapeHtml(prefix)}<input type="text" id="cot-condition-${key}" aria-label="${escapeHtml(label)}" value="${escapeHtml(quoteConditions.values[key] || '')}" placeholder="Completar aquí" style="display:inline-block;width:190px;max-width:100%;padding:4px 6px;border:0;border-bottom:1px solid var(--dash-primary);background:var(--dash-surface-2);color:inherit;font:inherit;line-height:1.5;">.</span>`).join(' ')}
      </div>
      <label class="form-field__label" for="cot-obs-extra">Observaciones adicionales / texto anterior</label>
      <textarea class="modal-form__input" id="cot-obs-extra" rows="3" style="resize:vertical;">${escapeHtml(quoteConditions.extra)}</textarea>
      <label class="form-field__label" for="cot-obs">Párrafo que se incluirá en el PDF</label>
      <textarea class="modal-form__input" id="cot-obs" rows="6" readonly style="resize:vertical;">${escapeHtml(buildQuoteConditions(quoteConditions.values, quoteConditions.extra))}</textarea>
    </div>`;

  openModal(doc ? 'Editar Cotización' : 'Nueva Cotización', body, 'Guardar', async () => {
    const items = collectItems();
    if (!items.length) { showToast('Agrega al menos un ítem', 'warning'); return; }
    // fullscreen applied below
    const exentoVal = document.getElementById('doc-exento')?.checked || false;
    const rec_name = document.getElementById('rec-name')?.value.trim();
    if (!rec_name) { showToast('Ingresa la razón social del cliente', 'warning'); return; }

    const newDoc = {
      id: doc?.id || crypto.randomUUID(),
      folio: doc?.folio || await nextFolio('cot'),
      fecha: document.getElementById('cot-fecha')?.value || today,
      vigencia: parseInt(document.getElementById('cot-vigencia')?.value) || 30,
      estado: document.getElementById('cot-estado')?.value || 'vigente',
      contacto_proveedor_nombre: document.getElementById('cot-provider-contact-name')?.value.trim(),
      contacto_proveedor_telefono: document.getElementById('cot-provider-contact-phone')?.value.trim(),
      contacto_proveedor_cargo: document.getElementById('cot-provider-contact-role')?.value.trim(),
      razon_social: rec_name,
      cliente: rec_name,
      rut_receptor: formatRut(document.getElementById('rec-rut')?.value),
      giro_receptor: document.getElementById('rec-giro')?.value.trim(),
      direccion_receptor: document.getElementById('rec-dir')?.value.trim(),
      ciudad_receptor: document.getElementById('rec-ciudad')?.value.trim(),
      email_receptor: document.getElementById('rec-email')?.value.trim(),
      exento: exentoVal,
      items,
      observaciones: document.getElementById('cot-obs')?.value.trim(),
      created_at: doc?.created_at || new Date().toISOString(),
      ...(() => { const t = calcTotalsFromItems(items, exentoVal); return { neto: t.neto, iva: t.iva, total: t.total }; })(),
    };

    const err = await saveCotizacion(newDoc);
    if (err) { showToast('Error al guardar: ' + err.message, 'error'); return; }
    closeModal();
    await renderCotizaciones();
    showToast(doc ? 'Cotización actualizada' : 'Cotización creada correctamente', 'success');
  });

  const updateQuoteParagraph = () => {
    const values = Object.fromEntries(QUOTE_CONDITION_PHRASES.map(([key]) =>
      [key, document.getElementById(`cot-condition-${key}`)?.value || '']));
    document.getElementById('cot-obs').value = buildQuoteConditions(values, document.getElementById('cot-obs-extra').value);
  };
  document.getElementById('cot-condition-fields')?.addEventListener('input', updateQuoteParagraph);
  document.getElementById('cot-obs-extra')?.addEventListener('input', updateQuoteParagraph);

  setTimeout(() => {
    lucide.createIcons();
    const mc = document.querySelector('.dash-modal__content');
    if (mc) mc.classList.add('dash-modal__content--fullscreen');
  }, 60);
}
window.openCotizacionModal = openCotizacionModal;

// ---- Delete Cotización ----
function deleteCotizacion(id) {
  openModal('Eliminar Cotización', '<p>¿Estás seguro de eliminar esta cotización? Esta acción no se puede deshacer.</p>', 'Eliminar', async () => {
    const err = await deleteCotizacionDB(id);
    if (err) { showToast('Error al eliminar: ' + err.message, 'error'); return; }
    closeModal(); await renderCotizaciones(); showToast('Cotización eliminada', 'success');
  });
}
window.deleteCotizacion = deleteCotizacion;

// ---- Export CSV Cotizaciones ----
async function exportCotizacionesCSV() {
  const list = await getCotizaciones();
  const rows = [['Folio', 'Cliente', 'RUT', 'Fecha', 'Vigencia', 'Neto', 'IVA', 'Total', 'Estado']];
  list.forEach(c => {
    const { neto, iva, total } = calcTotalsFromItems(c.items || [], c.exento);
    rows.push([`COT-${String(c.folio).padStart(6, '0')}`, c.cliente || '', c.rut_receptor || '', c.fecha || '', `${c.vigencia || 30} días`, neto, iva, total, c.estado || '']);
  });
  const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = `cotizaciones_${new Date().toLocaleDateString('es-CL').replace(/\//g, '-')}.csv`; a.click();
}

// ========== FACTURAS PRE-SII ==========

async function renderPresii() {
  const list = await getPresiiDocs();
  const tbody = document.getElementById('presii-tbody');
  const search = (document.getElementById('presii-search')?.value || '').toLowerCase();
  const fTipo = document.getElementById('presii-filter-tipo')?.value || '';
  const fOperacion = document.getElementById('presii-filter-operacion')?.value || '';
  let fMes = document.getElementById('presii-filter-mes')?.value || '';
  const canManage = isButtonAllowed('btn-nueva-presii');

  // Si al borrar queda vacío el mes seleccionado pero hay facturas en otros meses,
  // volvemos a mostrar todas para no dejar la tabla en blanco.
  let listMes = filterByMonth(list, fMes);
  // Solo facturas de venta y compra (excluye honorarios y notas de crédito u otros documentos).
  listMes = listMes.filter(d => {
    const op = ((d.operacion || '').toLowerCase() || (String(d.tipo_dte) === '110' ? 'compra' : 'venta'));
    return op === 'venta' || op === 'compra';
  });
  // no fallback to all months; if no matches, show mensaje de sin datos

  // KPIs (based on selected month)
  let porCobrar = 0, montoTotal = 0, contadorVenta = 0, contadorCompra = 0, contadorHonorarios = 0;
  listMes.forEach(d => {
    const { total } = calcTotalsFromItems(d.items || [], d.exento);
    montoTotal += total;
    const op = (d.operacion || 'venta').toLowerCase();
    if (op === 'venta') contadorVenta++;
    if (op === 'compra') contadorCompra++;
    if (op === 'honorarios') contadorHonorarios++;
    if (d.estado === 'emitida') porCobrar += total;
  });
  const $e = id => document.getElementById(id);
  if ($e('presii-kpi-total')) $e('presii-kpi-total').textContent = listMes.length;
  if ($e('presii-kpi-por-cobrar')) $e('presii-kpi-por-cobrar').textContent = `$${fmtNum(porCobrar)}`;
  if ($e('presii-kpi-monto')) $e('presii-kpi-monto').textContent = `$${fmtNum(montoTotal)}`;
  if ($e('presii-kpi-venta')) $e('presii-kpi-venta').textContent = `${contadorVenta} Ventas`;

  const filtered = listMes.filter(d => {
    const operacion = (d.operacion || ((d.tipo_dte || '').toString() === '110' ? 'compra' : 'venta')).toLowerCase();
    const searchName = operacion === 'compra' ? (d.emi_name || '') : (d.razon_social || '');
    const searchRut = operacion === 'compra' ? (d.emi_rut || '') : (d.rut_receptor || '');
    const matchSearch = !search || searchName?.toLowerCase().includes(search) || searchRut?.includes(search) || String(d.folio).includes(search);
    const matchTipo = !fTipo || String(d.tipo_dte) === fTipo;
    const docOper = (d.operacion || ((d.tipo_dte || '').toString() === '110' ? 'compra' : 'venta')).toLowerCase();
    const matchOperacion = !fOperacion || docOper === fOperacion.toLowerCase();
    return matchSearch && matchTipo && matchOperacion;
  });

  // Events — setup listeners only once to avoid duplicates
  if (!window._presiiListenersSetup) {
    const sEl = document.getElementById('presii-search');
    const tEl = document.getElementById('presii-filter-tipo');
    const oEl = document.getElementById('presii-filter-operacion');
    const mEl = document.getElementById('presii-filter-mes');

    if (sEl) { sEl.addEventListener('input', renderPresii); }
    if (tEl) { tEl.addEventListener('change', renderPresii); }
    if (oEl) { oEl.addEventListener('change', renderPresii); }
    if (mEl) { mEl.addEventListener('change', renderPresii); }

    const btnNew = document.getElementById('btn-nueva-presii');
    if (btnNew) { btnNew.addEventListener('click', () => openPresiiModal(null)); }
    const btnExp = document.getElementById('btn-export-presii');
    if (btnExp) { btnExp.addEventListener('click', exportPresiiCSV); }

    window._presiiListenersSetup = true;
  }

  // Rebuild month options without resetting listeners
  const mesEl = document.getElementById('presii-filter-mes');
  if (mesEl && !mesEl.dataset.initialized) {
    const now = new Date();
    const opts = ['<option value="">Todos los períodos</option>'];
    for (let i = 0; i < 13; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('es-CL', { month: 'long', year: 'numeric' });
      opts.push(`<option value="${val}">${label.charAt(0).toUpperCase() + label.slice(1)}</option>`);
    }
    mesEl.innerHTML = opts.join('');
    mesEl.dataset.initialized = 'true';
  }

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="11" style="text-align:center;color:var(--dash-text-secondary);padding:2rem;">${listMes.length ? 'Sin resultados para los filtros aplicados' : 'No hay facturas pre-SII. Haz clic en «Nueva Factura» para comenzar.'}</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(d => {
    const { neto, iva, total } = calcTotalsFromItems(d.items || [], d.exento);
    const operacion = (d.operacion || ((d.tipo_dte || '').toString() === '110' ? 'compra' : (d.tipo_dte || '').toString() === '52' ? 'honorarios' : 'venta')).toLowerCase();
    const displayName = operacion === 'compra' ? (d.emi_name || '-') : (d.razon_social || '-');
    const displayRut = operacion === 'compra' ? (d.emi_rut || '-') : (d.rut_receptor || '-');
    return `<tr>
      <td><strong style="font-family:monospace;">${String(d.folio).padStart(6, '0')}</strong></td>
      <td>${dteName(d.tipo_dte)}</td>
      <td>${escapeHtml((d.operacion || ((d.tipo_dte || '').toString() === '110' ? 'compra' : (d.tipo_dte || '').toString() === '52' ? 'honorarios' : 'venta')).toString().toUpperCase())}</td>
      <td>${escapeHtml(displayName)}</td>
      <td style="font-family:monospace;">${displayRut}</td>
      <td>${d.fecha || '-'}</td>
      <td>$${fmtNum(neto)}</td>
      <td>$${fmtNum(iva)}</td>
      <td style="font-weight:700;">$${fmtNum(total)}</td>
      <td style="text-align:center;white-space:nowrap;">
        <input type="checkbox" disabled ${d.sii_pdf_path ? 'checked' : ''} title="PDF subido" style="margin-right:6px;">
        <button class="btn-dash btn-dash--secondary btn-dash--sm" onclick="uploadPresiiPdf('${d.id}')" title="Subir PDF"><i data-lucide="upload" style="width:13px;height:13px;"></i></button>
      </td>
      <td>${presiiBadge(d.estado || 'borrador', d.fecha_vencimiento)}</td>
      <td>
        <div style="display:flex;gap:6px;align-items:center;">
          ${d.sii_pdf_path ? `<button class="btn-dash btn-dash--secondary btn-dash--sm" title="Ver PDF" onclick="window.open('${db.storage.getPublicUrl('documents', d.sii_pdf_path)}','_blank')"><i data-lucide="file-text" style="width:13px;height:13px;"></i></button>` : ''}
          ${canManage ? `<button class="btn-dash btn-dash--secondary btn-dash--sm" onclick="openPresiiModal('${d.id}')" title="Editar"><i data-lucide="pencil" style="width:13px;height:13px;"></i></button><button class="btn-dash btn-dash--secondary btn-dash--sm" style="color:var(--dash-danger);" onclick="deletePresii('${d.id}')" title="Eliminar"><i data-lucide="trash-2" style="width:13px;height:13px;"></i></button>` : ''}
        </div>
      </td>
    </tr>`;
  }).join('');

  if (typeof lucide !== 'undefined') setTimeout(() => lucide.createIcons(), 50);
}

// ---- Open Factura Pre-SII Modal ----
async function openPresiiModal(id, prefill = {}) {
  _docItemIdx = 0;
  const list = await getPresiiDocs();
  const doc = id ? list.find(d => d.id === id) : null;
  const company = getCompanyInfo();
  const today = new Date().toISOString().slice(0, 10);
  const exento = doc?.exento || false;
  const defaultTipoDte = doc?.tipo_dte || prefill.tipo_dte || '33';
  const defaultOperacion = doc?.operacion || prefill.operacion || 'venta';
  const selectedProjectId = doc?.project_id || prefill.project_id || '';
  const selectedProjectLabel = prefill.project_name || '';

  const itemsHtml = (doc?.items || [{ desc: '', qty: 1, unit_price: 0, discount_pct: 0 }]).map(it => {
    const idx = ++_docItemIdx;
    return `<tr id="item-row-${idx}">
      <td><input type="text" class="item-desc" value="${escapeHtml(it.desc || '')}" placeholder="Descripción"></td>
      <td class="td-num"><input type="number" class="item-qty"  value="${it.qty || 1}"  min="0.01" step="any"  style="width:60px;text-align:right;"  oninput="updateDocTotals()"></td>
      <td class="td-num"><input type="number" class="item-up"   value="${it.unit_price || 0}" min="0" step="1"   style="width:90px;text-align:right;"  oninput="updateDocTotals()"></td>
      <td class="td-num"><input type="number" class="item-disc" value="${it.discount_pct || 0}" min="0" max="100" step="0.1" style="width:55px;text-align:right;" oninput="updateDocTotals()"></td>
      <td class="td-num item-total-cell" style="font-weight:600;">${fmtNum(calcItemTotal(it))}</td>
      <td><button type="button" class="doc-items__btn-remove" onclick="removeItemRow(${idx})"><i data-lucide="x" style="width:14px;height:14px;"></i></button></td>
    </tr>`;
  }).join('');

  const { neto, iva, total } = calcTotalsFromItems(doc?.items || [], exento);

  const body = `
    <div style="max-height:72vh;overflow-y:auto;padding-right:4px;">
      <div class="presii-stamp"><strong>⚠ DOCUMENTO PRE-OFICIAL</strong>Este comprobante no reemplaza al DTE emitido y enviado al SII para timbraje digital.</div>

      <p class="doc-section-title">Tipo y Folio</p>
      <div class="doc-modal-grid doc-modal-grid--3">
        <div>
          <label class="form-field__label">Tipo de Documento (DTE)</label>
          <select class="modal-form__input" id="presii-tipo">
            <option value="33" ${defaultTipoDte === '33' ? 'selected' : ''}>Factura Electrónica (33)</option>
            <option value="34" ${defaultTipoDte === '34' ? 'selected' : ''}>Factura No Afecta (34)</option>
            <option value="39" ${defaultTipoDte === '39' ? 'selected' : ''}>Boleta Electrónica (39)</option>
            <option value="110" ${defaultTipoDte === '110' ? 'selected' : ''}>Factura Compra (110)</option>
          </select>
        </div>
        <div>
          <label class="form-field__label">Folio</label>
          <input type="text" class="modal-form__input" id="presii-folio" value="${doc ? String(doc.folio).padStart(6, '0') : '(Auto)'}" readonly style="background:var(--dash-surface-2);opacity:0.7;">
        </div>
        <div>
          <label class="form-field__label">Estado</label>
          <select class="modal-form__input" id="presii-estado">
            <option value="borrador" ${(doc?.estado || 'borrador') === 'borrador' ? 'selected' : ''}>Borrador</option>
            <option value="emitida"  ${doc?.estado === 'emitida' ? 'selected' : ''}>Emitida</option>
            <option value="pagado"   ${normalizeSiiPaidStatus(doc?.estado || '') === 'pagado' ? 'selected' : ''}>Pagado</option>
            <option value="anulada"  ${doc?.estado === 'anulada' ? 'selected' : ''}>Anulada</option>
          </select>
        </div>
        <div>
          <label class="form-field__label">Operación</label>
          <select class="modal-form__input" id="presii-operacion" ${prefill.operacion ? 'disabled' : ''}>
            <option value="venta" ${defaultOperacion === 'venta' ? 'selected' : ''}>Venta</option>
            <option value="compra" ${defaultOperacion === 'compra' ? 'selected' : ''}>Compra</option>
          </select>
        </div>
        <div>
          <label class="form-field__label">Fecha Emisión</label>
          <input type="date" class="modal-form__input" id="presii-fecha" value="${doc?.fecha || today}">
        </div>
        <div>
          <label class="form-field__label">Fecha Vencimiento</label>
          <input type="date" class="modal-form__input" id="presii-fvenc" value="${doc?.fecha_vencimiento || ''}">
        </div>
        <div>
          <label class="form-field__label">Período <small style="color:var(--dash-text-muted);">(ej: Marzo 2026)</small></label>
          <input type="text" class="modal-form__input" id="presii-periodo" value="${escapeHtml(doc?.periodo || '')}">
        </div>
      </div>

      <p class="doc-section-title">Proyecto asociado</p>
      ${renderEntitySearchPicker({
        rootId: 'presii-project-picker',
        type: 'project',
        label: 'Proyecto del cliente',
        placeholder: 'Buscar proyecto por nombre o cliente',
        selectedId: selectedProjectId,
        selectedLabel: selectedProjectLabel,
        helperText: 'Esto controla qué facturas ve el cliente en su portal. Si queda vacío, el portal usará el cliente como respaldo.'
      })}

      <p class="doc-section-title">Emisor</p>
      ${renderEntitySearchPicker({
        rootId: 'presii-provider-picker',
        type: 'provider',
        label: 'Buscar proveedor existente',
        placeholder: 'Buscar proveedor por nombre, empresa o RUT',
        helperText: 'Úsalo para recuperar los datos del emisor cuando el documento es de compra.',
        onSelect: (record) => {
          const setValue = (fieldId, value) => {
            const field = document.getElementById(fieldId);
            if (field && value != null) field.value = value;
          };
          setValue('emi-name', record.company || record.name || '');
          setValue('emi-rut', record.rut || '');
          setValue('emi-giro', record.giro || '');
          setValue('emi-address', record.address || '');
        }
      })}
      <div class="doc-modal-grid">
        <div>
          <label class="form-field__label">Razón Social</label>
          <input type="text" class="modal-form__input" id="emi-name" value="${escapeHtml(doc?.emi_name || (defaultOperacion === 'venta' ? 'Servicios Informaticos Yevenes & Compañia Limitada' : ''))}">
        </div>
        <div>
          <label class="form-field__label">RUT</label>
          <input type="text" class="modal-form__input" id="emi-rut" value="${escapeHtml(doc?.emi_rut || (defaultOperacion === 'venta' ? '78.352.809-6' : ''))}">
        </div>
        <div>
          <label class="form-field__label">Giro</label>
          <input type="text" class="modal-form__input" id="emi-giro" value="${escapeHtml(doc?.emi_giro || (defaultOperacion === 'venta' ? 'Actividades de consultoria informatica' : ''))}">
        </div>
        <div>
          <label class="form-field__label">Dirección</label>
          <input type="text" class="modal-form__input" id="emi-address" value="${escapeHtml(doc?.emi_address || (defaultOperacion === 'venta' ? 'Colo-Colo 379, Of 706, Ed. Amanecer' : ''))}">
        </div>
      </div>

      <p class="doc-section-title">Receptor</p>
      ${renderEntitySearchPicker({
        rootId: 'presii-client-picker',
        type: 'client',
        label: 'Buscar cliente existente',
        placeholder: 'Buscar cliente por nombre, empresa o RUT',
        helperText: 'Selecciona un cliente y se completarán los datos del receptor.',
        onSelect: (record) => {
          const setValue = (fieldId, value) => {
            const field = document.getElementById(fieldId);
            if (field && value != null) field.value = value;
          };
          setValue('rec-name', record.company || record.name || '');
          setValue('rec-rut', record.rut || '');
          setValue('rec-giro', record.giro || '');
          setValue('rec-dir', record.address || '');
          setValue('rec-ciudad', record.city || '');
        }
      })}
      <div class="doc-modal-grid">
        <div>
          <label class="form-field__label">Razón Social</label>
          <input type="text" class="modal-form__input" id="rec-name" value="${escapeHtml(doc?.razon_social || prefill.razon_social || (defaultOperacion === 'compra' ? 'Servicios Informaticos Yevenes & Compañia Limitada' : ''))}" required>
        </div>
        <div>
          <label class="form-field__label">RUT Receptor</label>
          <input type="text" class="modal-form__input" id="rec-rut" value="${escapeHtml(doc?.rut_receptor || prefill.rut_receptor || (defaultOperacion === 'compra' ? '78.352.809-6' : ''))}">
        </div>
        <div>
          <label class="form-field__label">Giro</label>
          <input type="text" class="modal-form__input" id="rec-giro" value="${escapeHtml(doc?.giro_receptor || prefill.giro_receptor || (defaultOperacion === 'compra' ? 'Actividades de consultoria informatica' : ''))}">
        </div>
        <div>
          <label class="form-field__label">Dirección</label>
          <input type="text" class="modal-form__input" id="rec-dir" value="${escapeHtml(doc?.direccion_receptor || prefill.direccion_receptor || (defaultOperacion === 'compra' ? 'Colo-Colo 379, Of 706, Ed. Amanecer' : ''))}">
        </div>
        <div>
          <label class="form-field__label">Ciudad</label>
          <input type="text" class="modal-form__input" id="rec-ciudad" value="${escapeHtml(doc?.ciudad_receptor || prefill.ciudad_receptor || (defaultOperacion === 'compra' ? 'Concepcion' : ''))}">
        </div>
        <div>
          <label class="form-field__label">Comuna</label>
          <input type="text" class="modal-form__input" id="rec-comuna" value="${escapeHtml(doc?.comuna_receptor || (defaultOperacion === 'compra' ? 'Concepcion' : ''))}">
        </div>
      </div>

      <p class="doc-section-title">Ítems / Servicios</p>
      <div class="doc-items-wrap">
        <table class="doc-items-table">
          <thead><tr><th>Descripción</th><th>Cant.</th><th>P. Unit. ($)</th><th>Desc. %</th><th>Total</th><th></th></tr></thead>
          <tbody id="doc-items-tbody">${itemsHtml}</tbody>
        </table>
        <div class="doc-items-footer">
          <button type="button" class="btn-add-item" onclick="addItemRow()"><i data-lucide="plus" style="width:13px;height:13px;"></i> Agregar ítem</button>
          <label style="font-size:0.8rem;display:flex;align-items:center;gap:6px;cursor:pointer;">
            <input type="checkbox" id="doc-exento" ${exento ? 'checked' : ''} onchange="updateDocTotals()"> Exento de IVA
          </label>
        </div>
      </div>

      <div class="doc-totals" style="margin-top:12px;">
        <div class="doc-totals__row"><span class="lbl">Neto:</span><span class="val" id="doc-neto">$${fmtNum(neto)}</span></div>
        <div class="doc-totals__row"><span class="lbl">IVA (19%):</span><span class="val" id="doc-iva">${exento ? '$0 (Exento)' : '$' + fmtNum(iva)}</span></div>
        <div class="doc-totals__divider"></div>
        <div class="doc-totals__row doc-totals__row--total"><span class="lbl">TOTAL:</span><span class="val" id="doc-total">$${fmtNum(total)}</span></div>
      </div>

      <p class="doc-section-title">Observaciones</p>
      <textarea class="modal-form__input" id="presii-obs" rows="3" style="resize:vertical;">${escapeHtml(doc?.observaciones || '')}</textarea>
    </div>`;

  openModal(doc ? 'Editar Factura Pre-SII' : 'Nueva Factura Pre-SII', body, 'Guardar', async () => {
    const items = collectItems();
    if (!items.length) { showToast('Agrega al menos un ítem', 'warning'); return; }
    const rec_name = document.getElementById('rec-name')?.value.trim();
    if (!rec_name) { showToast('Ingresa la razón social del receptor', 'warning'); return; }

    const exentoVal = document.getElementById('doc-exento')?.checked || false;
    const newDoc = {
      id: doc?.id || crypto.randomUUID(),
      folio: doc?.folio || await nextFolio('presii'),
      tipo_dte: document.getElementById('presii-tipo')?.value || '33',
      fecha: document.getElementById('presii-fecha')?.value || today,
      fecha_vencimiento: document.getElementById('presii-fvenc')?.value || '',
      periodo: document.getElementById('presii-periodo')?.value.trim() || '',
      estado: document.getElementById('presii-estado')?.value || 'borrador',
      operacion: document.getElementById('presii-operacion')?.value || 'venta',
      emi_name: document.getElementById('emi-name')?.value.trim() || '',
      emi_rut: formatRut(document.getElementById('emi-rut')?.value),
      emi_giro: document.getElementById('emi-giro')?.value.trim() || '',
      emi_address: document.getElementById('emi-address')?.value.trim() || '',
      razon_social: rec_name,
      rut_receptor: formatRut(document.getElementById('rec-rut')?.value),
      giro_receptor: document.getElementById('rec-giro')?.value.trim(),
      direccion_receptor: document.getElementById('rec-dir')?.value.trim(),
      ciudad_receptor: document.getElementById('rec-ciudad')?.value.trim(),
      comuna_receptor: document.getElementById('rec-comuna')?.value.trim(),
      exento: exentoVal,
      items,
      observaciones: document.getElementById('presii-obs')?.value.trim(),
      project_id: document.getElementById('presii-project-picker-value')?.value || null,
      sii_pdf_path: doc?.sii_pdf_path || null,
      sii_pdf_url: doc?.sii_pdf_url || null,
      created_at: doc?.created_at || new Date().toISOString(),
      ...(() => { const t = calcTotalsFromItems(items, exentoVal); return { neto: t.neto, iva: t.iva, total: t.total }; })(),
    };

    const err = await savePresiiDoc(newDoc);
    if (err) { showToast('Error al guardar: ' + err.message, 'error'); return; }
    closeModal(); await renderPresii();
    await refreshUnifiedSiiIfVisible();
    showToast(doc ? 'Factura actualizada' : 'Factura pre-SII creada correctamente', 'success');
    void auditLog(doc ? 'actualizó factura pre-SII' : 'creó factura pre-SII', 'invoice', newDoc.id, `FAC-${newDoc.folio}`);
  });

  setTimeout(() => {
    lucide.createIcons();
    const mc = document.querySelector('.dash-modal__content');
    if (mc) mc.classList.add('dash-modal__content--fullscreen');
  }, 60);
}

window.openPresiiModal = openPresiiModal;

function deletePresii(id) {
  openModal('Eliminar Factura', '<p>¿Estás seguro de eliminar esta factura pre-SII?</p>', 'Eliminar', async () => {
    const err = await deletePresiiDocDB(id);
    if (err) { showToast('Error al eliminar: ' + err.message, 'error'); return; }
    closeModal();
    await renderPresii();
    showToast('Factura eliminada', 'success');
    void auditLog('eliminó factura pre-SII', 'invoice', id, 'Factura pre-SII');
  });
}
window.deletePresii = deletePresii;

async function exportPresiiCSV() {
  const list = await getPresiiDocs();
  const rows = [['Folio', 'Tipo DTE', 'Razón Social', 'RUT', 'Fecha', 'Neto', 'IVA', 'Total', 'Estado']];
  list.forEach(d => {
    const { neto, iva, total } = calcTotalsFromItems(d.items || [], d.exento);
    const operacion = (d.operacion || ((d.tipo_dte || '').toString() === '110' ? 'compra' : 'venta')).toLowerCase();
    const displayName = operacion === 'compra' ? (d.emi_name || '') : (d.razon_social || '');
    const displayRut = operacion === 'compra' ? (d.emi_rut || '') : (d.rut_receptor || '');
    rows.push([String(d.folio).padStart(6, '0'), d.tipo_dte || '', displayName, displayRut, d.fecha || '', neto, iva, total, d.estado || '']);
  });
  const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = `facturas_presii_${new Date().toLocaleDateString('es-CL').replace(/\//g, '-')}.csv`; a.click();
}

// ==========================================================================
// PDF GENERATION
// ==========================================================================


async function buildDocPDF(docType, doc) {
  if (!window.jspdf) {
    try {
      await loadPdfRuntime();
    } catch (_) {
      showToast('No se pudo cargar la librería PDF', 'error');
      return null;
    }
  }
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // ── Page geometry ──────────────────────────────────────────────────────────
  const W = 210, H = 297;
  const ML = 22, MR = 15;   // ML bigger to leave room for rotated type label
  const CW = W - ML - MR;   // 173 mm content width

  // ── Palette ────────────────────────────────────────────────────────────────
  const C_BLK = [20, 35, 27];
  const C_MID = [92, 109, 99];
  const C_GRY = [142, 156, 147];
  const C_BRD = [214, 226, 244];
  const C_THD = [237, 246, 239];   // table header bg
  const C_ROW = [248, 252, 249];   // alternate row bg
  const C_RED = [185, 28, 28];
  const C_GREEN = [13, 129, 72];
  const C_GREEN_DARK = [11, 32, 21];
  const C_GREEN_SOFT = [229, 246, 234];
  const C_GREEN_PALE = [247, 251, 248];
  const C_NAVY = [20, 43, 30];

  const company = getCompanyInfo();
  const exento = doc.exento || false;
  const { neto, iva, total } = calcTotalsFromItems(doc.items || [], exento);
  const logoDataURL = await loadLogoDataURL();

  // ── Document meta ──────────────────────────────────────────────────────────
  const folioStr = docType === 'cotizacion'
    ? `COT-${String(doc.folio).padStart(4, '0')}`
    : String(doc.folio).padStart(4, '0');

  const docLabel = docType === 'cotizacion' ? 'Cotización' :
    doc.tipo_dte === '33' ? 'Factura' :
      doc.tipo_dte === '34' ? 'Factura N/A' :
        doc.tipo_dte === '39' ? 'Boleta' :
          doc.tipo_dte === '61' ? 'Nota Crédito' : 'Documento';

  // ── Helpers ────────────────────────────────────────────────────────────────
  const set = (style, size, color) => {
    pdf.setFont('helvetica', style);
    pdf.setFontSize(size);
    pdf.setTextColor(...color);
  };
  const hline = (yy, color = C_BRD, lw = 0.3) => {
    pdf.setDrawColor(...color); pdf.setLineWidth(lw);
    pdf.line(ML, yy, ML + CW, yy);
  };
  const formatPdfDate = (value) => {
    const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    return match ? `${match[3]}-${match[2]}-${match[1]}` : (value || '-');
  };
  const addDaysToDate = (value, days) => {
    const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    const base = match
      ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
      : new Date();
    base.setDate(base.getDate() + days);
    return `${String(base.getDate()).padStart(2, '0')}-${String(base.getMonth() + 1).padStart(2, '0')}-${base.getFullYear()}`;
  };
  const drawPageRail = () => {
    pdf.setFillColor(...C_GREEN_DARK);
    pdf.rect(0, 0, 10, H, 'F');
    pdf.setFillColor(...C_GREEN);
    pdf.rect(10, 0, 1.2, H, 'F');
    set('bold', 22, [255, 255, 255]);
    pdf.text(docLabel, 5.8, H / 2, { angle: 90, align: 'center' });
    set('bold', 8, [196, 244, 207]);
    pdf.text(folioStr, 5.8, H / 2 + 34, { angle: 90, align: 'center' });
  };

  // ════════════════════════════════════════════════════════════════════════════
  // 1. ROTATED DOCUMENT TYPE — left margin
  // ════════════════════════════════════════════════════════════════════════════
  drawPageRail();

  // ════════════════════════════════════════════════════════════════════════════
  // 2. HEADER — company name + Solven Labs logo
  // ════════════════════════════════════════════════════════════════════════════
  let y = 23;
  const providerContact = docType === 'cotizacion'
    ? [doc.contacto_proveedor_nombre, doc.contacto_proveedor_cargo, doc.contacto_proveedor_telefono].filter(Boolean).join(' · ')
    : '';
  const headerH = providerContact ? 39 : 34;

  pdf.setFillColor(...C_GREEN_PALE);
  pdf.setDrawColor(...C_BRD);
  pdf.roundedRect(ML, 10, CW, headerH, 3, 3, 'FD');
  pdf.setFillColor(...C_GREEN);
  pdf.roundedRect(ML, 10, 3, headerH, 1.5, 1.5, 'F');

  // Company name
  set('bold', 14, C_NAVY);
  pdf.text(company.name, ML + 7, y);

  if (docType === 'cotizacion') {
    set('bold', 6.8, C_GREEN_DARK);
    pdf.text('PROPUESTA COMERCIAL', ML + 7, y - 5);
  }

  // Solven Labs favicon — top right
  const logoW = 17, logoH = 17;
  const logoX = ML + CW - logoW - 6;
  if (logoDataURL) {
    pdf.addImage(logoDataURL, 'PNG', logoX, y - 7, logoW, logoH);
  }

  y += 6;
  set('normal', 8.5, C_MID);
  pdf.text(company.rut, ML + 7, y);
  y += 5;
  set('normal', 6.8, C_MID);
  pdf.text(`Giro: ${company.giro}`, ML + 7, y, { maxWidth: CW - 34 });
  y += 5;
  set('normal', 8, C_MID);
  pdf.text(`${company.address}, ${company.city}, Chile`, ML + 7, y);
  if (providerContact) {
    y += 5;
    set('normal', 7.5, C_MID);
    pdf.text(`Contacto proveedor: ${providerContact}`, ML + 7, y, { maxWidth: CW - 34 });
  }
  y = 10 + headerH + 8;

  // Separator
  hline(y, C_GREEN, 0.9);
  y += 7;

  // ════════════════════════════════════════════════════════════════════════════
  // 3. THREE-COLUMN INFO SECTION
  // ════════════════════════════════════════════════════════════════════════════
  const C1X = ML;
  const C3X = ML + CW * 0.55;
  const C3RX = ML + CW;
  const C3ValueX = C3RX - 4;
  const C1W = CW * 0.52;

  // Determine if it's a purchase or sale
  const operacionTipo = docType === 'presii' ? (doc.operacion || ((doc.tipo_dte || '').toString() === '110' ? 'compra' : 'venta')).toLowerCase() : 'venta';
  const isCompra = operacionTipo === 'compra';

  // Client and document metadata cards.
  const infoTop = y;
  const infoH = docType === 'cotizacion' ? 35 : 29;
  pdf.setFillColor(...C_GREEN_PALE);
  pdf.setDrawColor(...C_BRD);
  pdf.roundedRect(C1X, infoTop, C1W, infoH, 2, 2, 'FD');
  pdf.setFillColor(...C_GREEN_SOFT);
  pdf.roundedRect(C3X - 4, infoTop, C3RX - C3X + 4, infoH, 2, 2, 'F');

  set('bold', 7.5, C_GREEN_DARK);
  pdf.text(isCompra ? 'PROVEEDOR' : 'CLIENTE / FACTURAR A', C1X + 4, y + 5);
  pdf.text('DETALLE DEL DOCUMENTO', C3X, y + 5);
  y += 11;

  // Col 1 — Party info (bill to for sales, vendor for purchases)
  let ry1 = y;
  const LH = 4.0; // line height mm

  // Select appropriate data based on operación
  const displayName = isCompra ? (doc.emi_name || '-') : (doc.razon_social || '-');
  const displayRut = isCompra ? (doc.emi_rut || '-') : (doc.rut_receptor || '-');
  const displayGiro = isCompra ? (doc.emi_giro || '') : (doc.giro_receptor || '');
  const displayDir = isCompra ? (doc.emi_address || '') : (doc.direccion_receptor || '');

  // Company name — measure wrapping lines
  set('bold', 8.5, C_BLK);
  const nameLines = pdf.splitTextToSize(displayName, C1W);
  pdf.text(nameLines, C1X + 4, ry1);
  ry1 += nameLines.length * 4.5;

  set('normal', 8, C_MID);
  pdf.text(displayRut, C1X + 4, ry1);
  ry1 += LH;

  if (displayGiro) {
    const gLines = pdf.splitTextToSize(displayGiro, C1W);
    pdf.text(gLines, C1X + 4, ry1);
    ry1 += gLines.length * LH;
  }
  if (displayDir) {
    const dLines = pdf.splitTextToSize(displayDir, C1W);
    pdf.text(dLines, C1X + 4, ry1);
    ry1 += dLines.length * LH;
  }
  // Only show city/comuna for sales (receptor), not for purchase (emisor)
  const loc1 = !isCompra ? [doc.ciudad_receptor, doc.comuna_receptor].filter(Boolean).join(', ') : '';
  if (loc1) { pdf.text(loc1, C1X + 4, ry1, { maxWidth: C1W - 8 }); ry1 += LH; }

  // Col 3 — Date info (right-aligned values)
  const infoRows = [['Fecha', formatPdfDate(doc.fecha)], ['N° de pedido', folioStr]];
  if (docType === 'cotizacion') {
    const validityDays = Math.max(1, parseInt(doc.vigencia, 10) || 30);
    infoRows.push(['Validez', `${validityDays} días`]);
    infoRows.push(['Fecha vencimiento', addDaysToDate(doc.fecha, validityDays)]);
  } else {
    if (doc.fecha_vencimiento) infoRows.push(['Fecha vencimiento', doc.fecha_vencimiento]);
    if (doc.periodo) infoRows.push(['Período', doc.periodo]);
  }
  let ry3 = y;
  infoRows.forEach(([lbl, val]) => {
    set('bold', 8, C_BLK);
    pdf.text(lbl, C3X, ry3);
    set('normal', 8, C_MID);
    pdf.text(val, C3ValueX, ry3, { align: 'right' });
    ry3 += 6;
  });

  y = Math.max(infoTop + infoH, ry1, ry3) + 8;

  // ════════════════════════════════════════════════════════════════════════════
  // 4. ITEMS TABLE
  // ════════════════════════════════════════════════════════════════════════════
  // Cols: Cant.(14) | Descripción(flex) | Precio unitario(30) | Importe(28) = CW
  const descW = CW - 14 - 30 - 28;
  const tCols = [
    { h: 'Cant.', w: 14, x: ML, align: 'center' },
    { h: 'Descripción', w: descW, x: ML + 14, align: 'left' },
    { h: 'Precio unitario', w: 30, x: ML + 14 + descW, align: 'right' },
    { h: 'Importe', w: 28, x: ML + 14 + descW + 30, align: 'right' },
  ];

  const TH = 7;
  // Branded table header
  pdf.setFillColor(...C_GREEN_DARK);
  pdf.rect(ML, y, CW, TH, 'F');
  pdf.setDrawColor(...C_GREEN_DARK); pdf.setLineWidth(0.3);
  pdf.rect(ML, y, CW, TH, 'S');

  set('bold', 8, [255, 255, 255]);
  tCols.forEach(c => {
    const tx = c.align === 'right' ? c.x + c.w - 2 : c.align === 'center' ? c.x + c.w / 2 : c.x + 2;
    pdf.text(c.h, tx, y + 5, { align: c.align });
  });
  y += TH;

  const tableTopY = y;
  (doc.items || []).forEach((it, i) => {
    const RH = 7;
    const rowT = Math.round(
      (parseFloat(it.qty) || 0) *
      (parseFloat(it.unit_price) || 0) *
      (1 - (parseFloat(it.discount_pct) || 0) / 100)
    );
    if (i % 2 === 1) {
      pdf.setFillColor(...C_GREEN_PALE);
      pdf.rect(ML, y, CW, RH, 'F');
    }
    pdf.setDrawColor(...C_BRD); pdf.setLineWidth(0.2);
    pdf.line(ML, y + RH, ML + CW, y + RH);

    set('normal', 8.5, C_MID);
    pdf.text(fmtNum(it.qty), tCols[0].x + tCols[0].w / 2, y + 5, { align: 'center' });
    pdf.text(it.desc || '', tCols[1].x + 2, y + 5, { maxWidth: tCols[1].w - 4 });
    pdf.text(fmtNum(it.unit_price), tCols[2].x + tCols[2].w - 2, y + 5, { align: 'right' });
    set('normal', 8.5, C_BLK);
    pdf.text(fmtNum(rowT), tCols[3].x + tCols[3].w - 2, y + 5, { align: 'right' });
    y += RH;
  });

  // Table outer border
  pdf.setDrawColor(...C_BRD); pdf.setLineWidth(0.3);
  pdf.rect(ML, tableTopY - TH, CW, TH + (doc.items || []).length * 7, 'S');
  y += 7;

  // ════════════════════════════════════════════════════════════════════════════
  // 5. TOTALS
  // ════════════════════════════════════════════════════════════════════════════
  const totalBoxW = 72;
  const totalBoxH = 30;
  const totalBoxX = ML + CW - totalBoxW;
  const totalBoxY = y;
  const totRX = totalBoxX + totalBoxW - 5;
  const totLX = totalBoxX + 5;

  pdf.setFillColor(...C_GREEN_SOFT);
  pdf.setDrawColor(...C_GREEN);
  pdf.roundedRect(totalBoxX, totalBoxY, totalBoxW, totalBoxH, 2.5, 2.5, 'FD');
  y += 7;

  set('normal', 9, C_MID);
  pdf.text('Precio neto', totLX, y);
  pdf.text(fmtNum(neto), totRX, y, { align: 'right' });
  y += 6;

  set('normal', 9, C_MID);
  pdf.text(`Impuestos ${exento ? '(Exento)' : '(IVA 19%)'}`, totLX, y);
  pdf.text(fmtNum(iva), totRX, y, { align: 'right' });
  y += 7;

  // Total row — vertically centered and flush with the bottom of the card.
  const totalBandY = totalBoxY + 17;
  const totalBandH = totalBoxH - 17;
  const totalTextY = totalBandY + 8.5;
  pdf.setFillColor(...C_GREEN_DARK);
  pdf.roundedRect(totalBoxX, totalBandY, totalBoxW, totalBandH, 1.5, 1.5, 'F');
  set('bold', 13, [255, 255, 255]);
  pdf.text('Precio total', totLX, totalTextY);
  pdf.text(`$${fmtNum(total)}`, totRX, totalTextY, { align: 'right' });
  y = totalBoxY + totalBoxH + 10;

  // ════════════════════════════════════════════════════════════════════════════
  // 6. OBSERVATIONS
  // ════════════════════════════════════════════════════════════════════════════
  const FY = H - 48;
  if (doc.observaciones) {
    let obsFontSize = 7.2;
    let obsLineHeight = 3.7;
    set('normal', obsFontSize, C_MID);
    let obsLines = pdf.splitTextToSize(doc.observaciones, CW - 10);
    let obsH = Math.max(17, 11 + obsLines.length * obsLineHeight);
    if (y + obsH > FY - 4) {
      obsFontSize = 5.8;
      obsLineHeight = 3.1;
      set('normal', obsFontSize, C_MID);
      obsLines = pdf.splitTextToSize(doc.observaciones, CW - 10);
      obsH = Math.max(17, 11 + obsLines.length * obsLineHeight);
    }
    if (y + obsH > FY - 4) {
      pdf.addPage();
      drawPageRail();
      y = 18;
    }
    pdf.setFillColor(...C_GREEN_PALE);
    pdf.setDrawColor(...C_BRD);
    pdf.roundedRect(ML, y, CW, obsH, 2, 2, 'FD');
    set('bold', 7.5, C_GREEN_DARK);
    pdf.text('OBSERVACIONES', ML + 5, y + 6);
    y += 11;
    set('normal', obsFontSize, C_MID);
    obsLines.forEach(ln => { pdf.text(ln, ML + 5, y); y += obsLineHeight; });
    y += 7;
  }

  // Pre-SII inline warning
  if (docType === 'presii') {
    set('bold', 7, C_RED);
    pdf.text('DOCUMENTO PRE-OFICIAL — NO VÁLIDO COMO DTE ANTE EL SII. SOLO PARA USO INTERNO.', ML, y, { maxWidth: CW });
    y += 8;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 7. FOOTER — horizontal line + "Condiciones y forma de pago"
  // ════════════════════════════════════════════════════════════════════════════
  hline(FY, C_GREEN, 0.7);

  set('bold', 8.5, C_GREEN_DARK);
  pdf.text('Condiciones y forma de pago', ML, FY + 8);

  const quoteConditionsReference = doc.observaciones
    ? 'Las condiciones de pago, etapas, plazos, entregables y condiciones técnicas se detallan en el bloque de observaciones.'
    : 'Las condiciones comerciales y técnicas deberán acordarse antes de aceptar la cotización.';
  const payText = docType === 'cotizacion'
    ? `Esta cotización tiene una validez de ${doc.vigencia || 30} días desde la fecha de emisión. ${quoteConditionsReference} Los impuestos se muestran por separado en el resumen de precios.`
    : `El pago de la presente factura deberá realizarse en un plazo máximo de 30 días a partir de la fecha de emisión. Aceptamos pagos mediante transferencia bancaria, depósito y tarjetas de crédito. Por favor, incluir el número de factura en la referencia de pago. En caso de retraso se aplicará un interés moratorio del 1,5% mensual sobre el monto total adeudado.`;

  set('normal', 7.5, C_MID);
  pdf.text(payText, ML, FY + 15, { maxWidth: CW });

  // Generated-by note
  set('bold', 6.5, C_GREEN_DARK);
  pdf.text('Solven Labs  |  Tecnologia que impulsa tu negocio', ML, H - 8);
  set('italic', 6, [150, 150, 150]);
  pdf.text('Generado por Solven Labs Portal de Gestión', ML + CW, H - 8, { align: 'right' });

  return pdf;
}

async function generateCotizacionPDF(id) {
  const { data: docArr } = await supabase.from('cotizaciones').select('*').eq('id', id).limit(1);
  const doc = docArr?.[0];
  if (!doc) { showToast('Cotización no encontrada', 'error'); return; }
  const pdf = await buildDocPDF('cotizacion', doc);
  if (!pdf) return;
  pdf.save(`Cotizacion_COT-${String(doc.folio).padStart(6, '0')}_${doc.razon_social || 'cliente'}.pdf`);
  showToast('PDF generado correctamente', 'success');
}
window.generateCotizacionPDF = generateCotizacionPDF;

async function generatePresiiPDF(id) {
  const { data: docArr } = await supabase.from('facturas_presii').select('*').eq('id', id).limit(1);
  const doc = docArr?.[0];
  if (!doc) { showToast('Factura no encontrada', 'error'); return; }
  const pdf = await buildDocPDF('presii', doc);
  if (!pdf) return;
  const operacion = (doc.operacion || ((doc.tipo_dte || '').toString() === '110' ? 'compra' : 'venta')).toLowerCase();
  const displayName = operacion === 'compra' ? (doc.emi_name || 'emisor') : (doc.razon_social || 'receptor');
  pdf.save(`FacturaPreSII_${String(doc.folio).padStart(6, '0')}_${displayName}.pdf`);
  showToast('PDF generado correctamente', 'success');
}
window.generatePresiiPDF = generatePresiiPDF;

async function uploadPresiiPdf(id) {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'application/pdf';
  fileInput.style.display = 'none';

  document.body.appendChild(fileInput);

  const handleFile = async () => {
    const file = fileInput.files?.[0];
    if (!file) {
      document.body.removeChild(fileInput);
      return;
    }
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      showToast('Solo se permite PDF', 'warning');
      document.body.removeChild(fileInput);
      return;
    }

    const path = `facturas_sii/${id}/${Date.now()}_${file.name}`;
    const { error: upErr } = await db.storage.uploadFile('documents', path, file);
    if (upErr) {
      showToast('Error subiendo PDF: ' + upErr.message, 'error');
      document.body.removeChild(fileInput);
      return;
    }

    const publicUrl = db.storage.getPublicUrl('documents', path);
    const { error } = await supabase.from('facturas_presii').update({ sii_pdf_path: path, sii_pdf_url: publicUrl }).eq('id', id);
    if (error) {
      showToast('Error guardando referencia en la factura: ' + error.message, 'error');
      document.body.removeChild(fileInput);
      return;
    }

    showToast('PDF subido correctamente', 'success');

    const statusEl = document.getElementById('presii-pdf-status');
    if (statusEl) {
      statusEl.innerHTML = `<a href="${publicUrl}" target="_blank" rel="noopener" style="color:var(--dash-primary);text-decoration:underline;">Ver PDF</a>`;
    }

    const uploadedChk = document.getElementById('presii-uploaded-check');
    if (uploadedChk) {
      uploadedChk.checked = true;
    }

    document.body.removeChild(fileInput);
    await renderPresii();
  };

  fileInput.addEventListener('change', handleFile, { once: true });
  fileInput.click();
}
window.uploadPresiiPdf = uploadPresiiPdf;

// ==========================================================================
// PROJECT PORTAL — Portal de Estado para Clientes
// ==========================================================================

/** Render the list of updates inside the portal management modal */
async function renderPortalUpdatesList(projectId) {
  const listEl = document.getElementById('portal-updates-list');
  if (!listEl) return;
  const { data: updates, error } = await supabase
    .from('project_updates')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error || !updates || updates.length === 0) {
    listEl.innerHTML = '<div style="color:var(--dash-text-secondary);padding:10px 0;font-size:0.9rem;">Sin actualizaciones. Agrega la primera.</div>';
    return;
  }

  const typeLabels = { milestone: 'Hito', update: 'Actualización', delivery: 'Entrega', issue: 'Incidencia', note: 'Nota' };
  listEl.innerHTML = updates.map(u => `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:10px 12px;border:1px solid var(--dash-border);border-radius:8px;margin-bottom:8px;gap:10px;">
      <div style="flex:1;min-width:0;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
          <span style="font-size:0.75rem;font-weight:600;color:var(--dash-text-secondary);">${typeLabels[u.type] || u.type}</span>
          ${!u.visible_to_client ? '<span style="font-size:0.7rem;background:rgba(0,0,0,0.06);padding:2px 7px;border-radius:99px;">oculto</span>' : ''}
        </div>
        <div style="font-weight:600;font-size:0.9rem;">${escapeHtml(u.title)}</div>
        ${u.description ? `<div style="font-size:0.83rem;color:var(--dash-text-secondary);margin-top:3px;">${escapeHtml(u.description)}</div>` : ''}
        <div style="font-size:0.75rem;color:var(--dash-text-muted);margin-top:4px;">${formatDateShort(u.created_at)}</div>
      </div>
      <button class="btn-dash btn-dash--danger btn-dash--sm" title="Eliminar" onclick="deleteProjectUpdateConfirm('${u.id}','${projectId}')">
        <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
      </button>
    </div>
  `).join('');
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

/** Open the portal management modal */
async function manageProjectPortal(id) {
  if (!isButtonAllowed('btn-add-project')) return showToast('No tienes permiso para gestionar proyectos', 'warning');
  const { data: p, error } = await supabase
    .from('projects')
    .select('id, name, client_token, client_visible, client_notes')
    .eq('id', id)
    .single();

  if (error || !p) { showToast('Error al cargar portal', 'error'); return; }

  const token = p.client_token || '(sin código aún)';
  const portalUrl = `${window.location.origin}/proyecto?token=${encodeURIComponent(token)}`;
  const isVisible = p.client_visible !== false;

  const html = `
    <div style="display:flex;flex-direction:column;gap:20px;">

      <!-- Enlace del portal -->
      <div>
        <div style="font-size:0.78rem;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--dash-text-secondary);margin-bottom:8px;">Enlace para compartir</div>
        <div style="display:flex;gap:8px;align-items:center;">
          <input type="text" id="portal-link-input" value="${portalUrl}" readonly
            style="flex:1;min-width:0;padding:9px 12px;border:1px solid var(--dash-border);border-radius:8px;font-size:0.85rem;background:var(--dash-bg-secondary);color:var(--dash-text);font-family:monospace;">
          <button class="btn-dash btn-dash--secondary" onclick="(function(){const i=document.getElementById('portal-link-input');navigator.clipboard.writeText(i.value).then(()=>{showToast('Enlace copiado','success');}).catch(()=>{i.select();document.execCommand('copy');showToast('Enlace copiado','success');})})()">
            <i data-lucide="copy" style="width:14px;height:14px;"></i> Copiar
          </button>
          <a href="${portalUrl}" target="_blank" class="btn-dash btn-dash--secondary">
            <i data-lucide="external-link" style="width:14px;height:14px;"></i>
          </a>
        </div>
        <div style="font-size:0.78rem;color:var(--dash-text-muted);margin-top:6px;">Código: <strong>${token}</strong></div>
      </div>

      <!-- Configuración de visibilidad -->
      <div>
        <div style="font-size:0.78rem;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--dash-text-secondary);margin-bottom:8px;">Configuración</div>
        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;">
          <input type="checkbox" id="portal-visible" ${isVisible ? 'checked' : ''} style="width:16px;height:16px;accent-color:var(--dash-primary);">
          <span style="font-size:0.9rem;">Visible para el cliente</span>
        </label>
      </div>

      <!-- Nota para el cliente -->
      <div>
        <div style="font-size:0.78rem;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--dash-text-secondary);margin-bottom:8px;">Nota destacada para el cliente</div>
        <textarea id="portal-notes" rows="3" class="modal-form__textarea" placeholder="Ej: Estamos trabajando en el módulo de pagos. Entrega estimada 15 de abril.">${escapeHtml(p.client_notes || '')}</textarea>
        <div style="font-size:0.77rem;color:var(--dash-text-muted);margin-top:4px;">Esta nota aparece destacada en el portal del cliente.</div>
      </div>

      <!-- Actualizaciones -->
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <div style="font-size:0.78rem;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--dash-text-secondary);">Actualizaciones del portal</div>
          <button class="btn-dash btn-dash--primary btn-dash--sm" onclick="addProjectUpdate('${id}')">
            <i data-lucide="plus" style="width:14px;height:14px;"></i> Agregar
          </button>
        </div>
        <div id="portal-updates-list" style="max-height:280px;overflow-y:auto;">
          <div style="color:var(--dash-text-secondary);padding:10px 0;font-size:0.9rem;">Cargando...</div>
        </div>
      </div>

    </div>
  `;

  openModal(`Portal del Cliente — ${escapeHtml(p.name)}`, html, 'Guardar Configuración', async () => {
    const visible = document.getElementById('portal-visible')?.checked !== false;
    const notes = document.getElementById('portal-notes')?.value?.trim() || null;
    const { error: ue } = await supabase.from('projects').update({ client_visible: visible, client_notes: notes }).eq('id', id);
    if (ue) showToast('Error al guardar: ' + ue.message, 'error');
    else { showToast('Portal actualizado', 'success'); closeModal(); }
  });

  if (typeof lucide !== 'undefined') setTimeout(() => lucide.createIcons(), 50);

  // Async load updates
  setTimeout(() => renderPortalUpdatesList(id), 60);
}

/** Form to add a new project update */
async function addProjectUpdate(projectId) {
  if (!isButtonAllowed('btn-add-project')) return showToast('No tienes permiso para gestionar proyectos', 'warning');
  // Fetch project name for modal title
  const { data: p } = await supabase.from('projects').select('id, name').eq('id', projectId).single();
  const projName = p ? p.name : 'Proyecto';

  openModal(`Agregar Actualización — ${escapeHtml(projName)}`, `
    <div class="modal-form__group">
      <label class="modal-form__label">Tipo</label>
      <select class="modal-form__select" id="upd-type">
        <option value="update">Actualización</option>
        <option value="milestone">Hito alcanzado</option>
        <option value="delivery">Entrega</option>
        <option value="issue">Incidencia</option>
        <option value="note">Nota informativa</option>
      </select>
    </div>
    <div class="modal-form__group">
      <label class="modal-form__label">Título <span style="color:var(--dash-danger);">*</span></label>
      <input type="text" class="modal-form__input" id="upd-title" placeholder="Ej: Sprint 3 completado">
    </div>
    <div class="modal-form__group">
      <label class="modal-form__label">Descripción (opcional)</label>
      <textarea class="modal-form__textarea" id="upd-desc" rows="3" placeholder="Detalla qué ocurrió, qué se entregó o qué impacto tiene..."></textarea>
    </div>
    <div class="modal-form__group">
      <label style="display:flex;align-items:center;gap:10px;cursor:pointer;">
        <input type="checkbox" id="upd-visible" checked style="width:16px;height:16px;accent-color:var(--dash-primary);">
        <span style="font-size:0.9rem;">Visible para el cliente</span>
      </label>
    </div>
  `, 'Publicar Actualización', async () => {
    const title = document.getElementById('upd-title')?.value?.trim();
    if (!title) { showToast('El título es obligatorio', 'error'); return; }
    const payload = {
      project_id: projectId,
      title,
      description: document.getElementById('upd-desc')?.value?.trim() || null,
      type: document.getElementById('upd-type')?.value || 'update',
      visible_to_client: document.getElementById('upd-visible')?.checked !== false,
    };
    const { error } = await supabase.from('project_updates').insert(payload);
    if (error) { showToast('Error: ' + error.message, 'error'); return; }
    showToast('Actualización publicada', 'success');
    closeModal();
    // Reopen portal modal to show updated list
    setTimeout(() => manageProjectPortal(projectId), 150);
  });
}

/** Delete a project update and refresh the list */
window.deleteProjectUpdateConfirm = function deleteProjectUpdateConfirm(updateId, projectId) {
  if (!isButtonAllowed('btn-add-project')) return showToast('No tienes permiso para gestionar proyectos', 'warning');
  openModal('Eliminar actualización', '<p>¿Estás seguro de eliminar esta actualización? Esta acción no se puede deshacer.</p>', 'Eliminar', async () => {
    closeModal();
    await deleteProjectUpdate(updateId, projectId);
  });
};

async function deleteProjectUpdate(updateId, projectId) {
  if (!isButtonAllowed('btn-add-project')) return showToast('No tienes permiso para gestionar proyectos', 'warning');
  const { error } = await supabase.from('project_updates').delete().eq('id', updateId);
  if (error) { showToast('Error al eliminar: ' + error.message, 'error'); return; }
  showToast('Actualización eliminada', 'success');
  renderPortalUpdatesList(projectId);
}

// ==========================================================================
// EXPOSE GLOBAL FUNCTIONS (for inline onclick handlers)
// ==========================================================================
window.editClient = editClient;
window.deleteClient = deleteClient;
// ==========================================================================
// PLAN COMPARATOR
// ==========================================================================
window.selectPlan = function (plan) {
  showToast(`Paquete ${plan} seleccionado — te contactaremos pronto`, 'success');
};

window.toggleSidebarGroup = function (btn) {
  const group = btn.closest('.sidebar__group');
  if (!group) return;
  const isCollapsed = group.classList.toggle('sidebar__group--collapsed');
  btn.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
};

// ==========================================================================
// EXPENSES (Gastos Operacionales)
// ==========================================================================

// Helper para renderizar gráfico de gastos por categoría
function renderExpensesByCategory(expenses) {
  const byCategory = {};
  expenses.forEach(e => {
    if (!byCategory[e.category]) byCategory[e.category] = 0;
    byCategory[e.category] += e.amount;
  });

  return Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([cat, amount]) => {
    const pct = (amount / Math.max(...Object.values(byCategory))) * 100;
    return `
      <div style="display:flex;gap:12px;align-items:center;margin-bottom:12px;">
        <div style="min-width:100px;font-size:0.82rem;font-weight:500;color:var(--dash-text-secondary);">${cat || 'Sin categoría'}</div>
        <div style="flex:1;height:20px;background:rgba(0,0,0,0.05);border-radius:4px;overflow:hidden;">
          <div style="height:100%;background:linear-gradient(90deg,#42a5f5,#1e88e5);width:${pct}%;transition:width 0.3s;"></div>
        </div>
        <div style="min-width:70px;text-align:right;font-size:0.82rem;font-weight:600;color:var(--dash-text);">${formatCurrencyShort(amount)}</div>
      </div>
    `;
  }).join('');
}

function getExpenseTaxPercentage(expense = {}) {
  if (expense.iva_percentage == null || expense.iva_percentage === '') return 19;
  const storedRate = Number(expense.iva_percentage);
  return Number.isFinite(storedRate) && storedRate >= 0 ? storedRate : 19;
}

function calculateExpenseBreakdown(grossAmount, discountAmount = 0, ivaPercentage = 19) {
  const gross = Math.max(0, Math.round(Number(grossAmount) || 0));
  const discount = Math.min(gross, Math.max(0, Math.round(Number(discountAmount) || 0)));
  const total = gross - discount;
  const taxRate = Math.max(0, Number(ivaPercentage) || 0);
  const base = taxRate > 0 ? Math.round(total / (1 + (taxRate / 100))) : total;
  const iva = taxRate > 0 ? total - base : 0;
  return { gross, discount, total, base, iva, taxRate };
}

function getStoredExpenseBreakdown(expense = {}) {
  const total = Math.max(0, Math.round(Number(expense.amount) || 0));
  const discount = Math.max(0, Math.round(Number(expense.discount_amount) || 0));
  return calculateExpenseBreakdown(total + discount, discount, getExpenseTaxPercentage(expense));
}

function addExpense() {
  const html = `
    <form class="modal-form" id="expense-form-new">
      <div class="modal-form__group">
        <label class="modal-form__label">Descripción / Concepto *</label>
        <input type="text" class="modal-form__input" id="expense-desc" placeholder="Ej: Compra de materiales de oficina" required>
      </div>
      
      <div class="modal-form__row">
        <div class="modal-form__group">
          <label class="modal-form__label">Categoría *</label>
          <select class="modal-form__select" id="expense-category" required onchange="updateExpenseTotal()">
            <option value="">Selecciona categoría</option>
            <option value="salarios">Salarios</option>
            <option value="alquiler">Alquiler</option>
            <option value="servicios">Servicios (Internet, Luz, etc.)</option>
            <option value="software">Software y Suscripciones</option>
            <option value="hardware">Hardware y Equipos</option>
            <option value="viajes">Viajes</option>
            <option value="marketing">Marketing y Publicidad</option>
            <option value="legal">Legal y Asesoría</option>
            <option value="otro">Otro</option>
          </select>
        </div>
        
        <div class="modal-form__group">
          <label class="modal-form__label">Fecha del Gasto *</label>
          <input type="date" class="modal-form__input" id="expense-date" required value="${new Date().toISOString().slice(0, 10)}">
        </div>
      </div>

      <div class="modal-form__row">
        <div class="modal-form__group">
          <label class="modal-form__label">Monto antes de descuento *</label>
          <input type="number" class="modal-form__input" id="expense-amount" required min="0" placeholder="0" oninput="updateExpenseTotal()">
        </div>
        
        <div class="modal-form__group">
          <label class="modal-form__label">Descuento (CLP)</label>
          <input type="number" class="modal-form__input" id="expense-discount" min="0" placeholder="0" value="0" oninput="updateExpenseTotal()">
        </div>
      </div>

      <label style="display:flex;align-items:flex-start;gap:10px;padding:12px;border:1px solid var(--dash-border);border-radius:10px;background:var(--dash-surface-2);cursor:pointer;margin-bottom:16px;">
        <input type="checkbox" id="expense-tax-exempt" onchange="updateExpenseTotal()" style="margin-top:3px;">
        <span>
          <strong style="display:block;">Exento de IVA / sin documento tributario</strong>
          <small style="display:block;color:var(--dash-text-secondary);margin-top:2px;">Úsalo para transferencias a personas naturales u otros gastos que no generan crédito fiscal.</small>
        </span>
      </label>

      <div class="modal-form__row">
        <div class="modal-form__group">
          <label class="modal-form__label">Proveedor / Vendedor *</label>
          ${renderEntitySearchPicker({
            rootId: 'expense-vendor-picker',
            type: 'provider',
            label: 'Buscar proveedor existente',
            placeholder: 'Buscar proveedor por nombre, empresa o RUT',
            helperText: 'Selecciona un proveedor existente para completar el nombre del gasto.',
            onSelect: (record) => {
              const vendorInput = document.getElementById('expense-vendor');
              if (vendorInput) vendorInput.value = record.company || record.name || '';
            }
          })}
          <input type="text" class="modal-form__input" id="expense-vendor" placeholder="Ej: Amazon, Transbank" required>
        </div>
        
        <div class="modal-form__group">
          <label class="modal-form__label">Nº Comprobante / Factura</label>
          <input type="text" class="modal-form__input" id="expense-receipt-number" placeholder="Ej: FAC-2025-001">
        </div>
      </div>

      <div class="modal-form__row">
        <div class="modal-form__group">
          <label class="modal-form__label">Método de Pago</label>
          <select class="modal-form__select" id="expense-payment">
            <option value="transfer">Transferencia</option>
            <option value="debit">Débito</option>
            <option value="cash">Efectivo</option>
            <option value="credit_card">Tarjeta de Crédito</option>
            <option value="check">Cheque</option>
          </select>
        </div>
        
        <div class="modal-form__group">
          <label class="modal-form__label">Centro de Costo</label>
          <input type="text" class="modal-form__input" id="expense-cost-center" placeholder="Ej: Marketing, Operaciones">
        </div>
      </div>

      <div class="modal-form__group">
        <label class="modal-form__label">Notas / Detalles</label>
        <textarea class="modal-form__textarea" id="expense-notes" placeholder="Agregar observaciones o justificación del gasto..."></textarea>
      </div>

      <div class="modal-section" style="margin-top:24px;padding:16px;background:var(--dash-surface-2);border-radius:8px;">
        <div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-bottom:8px;">
          <span style="color:var(--dash-text-secondary);">Monto ingresado:</span>
          <span style="font-weight:600;" id="expense-total-input">$0</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-bottom:8px;">
          <span style="color:var(--dash-text-secondary);">Total Neto (sin IVA):</span>
          <span style="font-weight:600;" id="expense-base-amount">$0</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-bottom:8px;">
          <span style="color:var(--dash-text-secondary);" id="expense-iva-label">IVA 19%:</span>
          <span style="font-weight:600;" id="expense-iva-amount">$0</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-bottom:12px;">
          <span style="color:var(--dash-text-secondary);">- Descuento:</span>
          <span style="font-weight:600;" id="expense-summary-disc">$0</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:1rem;padding-top:12px;border-top:1px solid var(--dash-border);">
          <span style="font-weight:600;">TOTAL A PAGAR:</span>
          <span style="font-weight:700;color:var(--dash-primary);" id="expense-total">$0</span>
        </div>
      </div>
    </form>
  `;

  openModal('Registrar Nuevo Gasto', html, 'Guardar Gasto', async () => {
    const desc = document.getElementById('expense-desc').value?.trim();
    const amount = parseInt(document.getElementById('expense-amount').value) || 0;
    const category = document.getElementById('expense-category').value;
    const date = document.getElementById('expense-date').value;
    const vendor = document.getElementById('expense-vendor').value?.trim();
    const method = document.getElementById('expense-payment').value;
    const notes = document.getElementById('expense-notes').value?.trim();
    const discount = parseInt(document.getElementById('expense-discount').value) || 0;
    const receiptNumber = document.getElementById('expense-receipt-number').value?.trim();
    const costCenter = document.getElementById('expense-cost-center').value?.trim();
    const isTaxExempt = document.getElementById('expense-tax-exempt')?.checked || false;

    if (!desc || !amount || !category || !date || !vendor) {
      showToast('Completa los campos requeridos (*)', 'error');
      return;
    }

    const breakdown = calculateExpenseBreakdown(amount, discount, isTaxExempt ? 0 : 19);

    const { error } = await supabase.from('expenses').insert([{
      description: desc,
      amount: breakdown.total,
      category,
      date_incurred: date,
      vendor,
      payment_method: method,
      notes: notes || null,
      status: 'draft',
      receipt_number: receiptNumber || null,
      cost_center: costCenter || null,
      iva_percentage: breakdown.taxRate,
      iva_amount: breakdown.iva,
      discount_amount: breakdown.discount
    }]);

    if (error) {
      showToast('Error al guardar gasto: ' + error.message, 'error');
    } else {
      showToast('Gasto registrado correctamente', 'success');
      closeModal();
      loadExpenses();
      await refreshUnifiedSiiIfVisible();
    }
  });

  setTimeout(() => updateExpenseTotal(), 100);
}

async function viewExpense(id) {
  const canManage = isButtonAllowed('btn-add-expense');
  const { data: expense, error: fetchError } = await supabase
    .from('expenses')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !expense) {
    showToast('Error al cargar gasto', 'error');
    return;
  }

  let projectName = '—';
  if (expense.project_id) {
    const { data: linkedProject } = await supabase
      .from('projects')
      .select('name')
      .eq('id', expense.project_id)
      .single();
    projectName = linkedProject?.name || '—';
  }

  const paymentMethodTranslate = {
    transfer: 'Transferencia',
    debit: 'Débito',
    cash: 'Efectivo',
    credit_card: 'Tarjeta de Crédito',
    check: 'Cheque'
  };

  const statusColors = {
    draft: { bg: 'rgba(107,114,128,0.1)', text: '#6b7280', label: 'Borrador' },
    submitted: { bg: 'rgba(217,119,6,0.1)', text: '#d97706', label: 'Enviado' },
    approved: { bg: 'rgba(59,130,246,0.1)', text: '#3b82f6', label: 'Aprobado' },
    rejected: { bg: 'rgba(220,38,38,0.1)', text: '#dc2626', label: 'Rechazado' },
    paid: { bg: 'rgba(34,113,197,0.1)', text: '#2271c5', label: 'Pagado' }
  };
  const status = statusColors[expense.status] || statusColors.draft;
  const expenseBreakdown = getStoredExpenseBreakdown(expense);
  const isTaxExempt = expenseBreakdown.taxRate === 0;

  const html = `
    <div style="display:grid;grid-template-columns:1fr 320px;gap:16px;align-items:start;">
      <div>
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:12px;">
          <div>
            <h3 style="margin:0 0 4px;">${escapeHtml(expense.description || 'Gasto')}</h3>
            <div style="color:var(--dash-text-secondary);">${escapeHtml(expense.vendor || 'Sin proveedor')}</div>
          </div>
          ${canManage ? `<button class="btn-dash btn-dash--secondary btn-dash--sm" onclick="editExpense('${expense.id}')"><i data-lucide="pencil" style="width:13px;height:13px;"></i> Editar</button>` : ''}
        </div>

        <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;">
          <div style="background:var(--dash-surface-2);border:1px solid var(--dash-border);border-radius:10px;padding:12px;">
            <div style="font-size:0.8rem;color:var(--dash-text-secondary);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px;">Fecha</div>
            <div style="font-weight:700;">${escapeHtml(expense.date_incurred || '-')}</div>
          </div>
          <div style="background:var(--dash-surface-2);border:1px solid var(--dash-border);border-radius:10px;padding:12px;">
            <div style="font-size:0.8rem;color:var(--dash-text-secondary);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px;">Categoría</div>
            <div style="font-weight:700;">${escapeHtml(expense.category || '-')}</div>
          </div>
          <div style="background:var(--dash-surface-2);border:1px solid var(--dash-border);border-radius:10px;padding:12px;">
            <div style="font-size:0.8rem;color:var(--dash-text-secondary);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px;">Proveedor</div>
            <div style="font-weight:700;">${escapeHtml(expense.vendor || '-')}</div>
          </div>
          <div style="background:var(--dash-surface-2);border:1px solid var(--dash-border);border-radius:10px;padding:12px;">
            <div style="font-size:0.8rem;color:var(--dash-text-secondary);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px;">Estado</div>
            <div><span style="color:${status.text};background:${status.bg};padding:2px 8px;border-radius:4px;font-size:0.7rem;font-weight:600;">${status.label}</span></div>
          </div>
        </div>

        <div style="margin-top:14px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;">
          <div style="background:#fff;border:1px solid var(--dash-border);border-radius:10px;padding:12px;">
            <div style="font-size:0.8rem;color:var(--dash-text-secondary);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px;">Monto total</div>
            <div style="font-weight:800;font-size:1.05rem;">${formatCurrency(expenseBreakdown.gross)}</div>
          </div>
          <div style="background:#fff;border:1px solid var(--dash-border);border-radius:10px;padding:12px;">
            <div style="font-size:0.8rem;color:var(--dash-text-secondary);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px;">Descuento</div>
            <div style="font-weight:800;font-size:1.05rem;">${formatCurrency(expenseBreakdown.discount)}</div>
          </div>
          <div style="background:#fff;border:1px solid var(--dash-border);border-radius:10px;padding:12px;">
            <div style="font-size:0.8rem;color:var(--dash-text-secondary);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px;">Total a pagar</div>
            <div style="font-weight:800;font-size:1.05rem;">${formatCurrency(expenseBreakdown.total)}</div>
          </div>
        </div>

        <div style="margin-top:14px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;">
          <div style="background:var(--dash-surface-2);border:1px solid var(--dash-border);border-radius:10px;padding:12px;">
            <div style="font-size:0.8rem;color:var(--dash-text-secondary);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px;">Base sin IVA</div>
            <div style="font-weight:700;">${formatCurrency(expenseBreakdown.base)}</div>
          </div>
          <div style="background:var(--dash-surface-2);border:1px solid var(--dash-border);border-radius:10px;padding:12px;">
            <div style="font-size:0.8rem;color:var(--dash-text-secondary);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px;">${isTaxExempt ? 'IVA · Exento / sin documento' : `IVA ${expenseBreakdown.taxRate}%`}</div>
            <div style="font-weight:700;">${formatCurrency(expenseBreakdown.iva)}</div>
          </div>
          <div style="background:var(--dash-surface-2);border:1px solid var(--dash-border);border-radius:10px;padding:12px;">
            <div style="font-size:0.8rem;color:var(--dash-text-secondary);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px;">Método de pago</div>
            <div style="font-weight:700;">${escapeHtml(paymentMethodTranslate[expense.payment_method] || expense.payment_method || '—')}</div>
          </div>
        </div>

        <div style="margin-top:14px;">
          <div style="font-size:0.82rem;font-weight:700;color:var(--dash-text-secondary);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Notas</div>
          <div style="padding:12px;border:1px solid var(--dash-border);border-radius:10px;background:var(--dash-surface-2);min-height:72px;white-space:pre-wrap;">${escapeHtml(expense.notes || 'Sin notas')}</div>
        </div>
      </div>

      <div>
        <div style="background:var(--dash-surface-2);border:1px solid var(--dash-border);border-radius:10px;padding:12px;">
          <div style="font-size:0.82rem;font-weight:700;color:var(--dash-text-secondary);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">Resumen</div>
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--dash-border);"><span>Comprobante</span><strong>${escapeHtml(expense.receipt_number || '-')}</strong></div>
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--dash-border);"><span>Centro de costo</span><strong style="text-align:right;max-width:170px;">${escapeHtml(expense.cost_center || '-')}</strong></div>
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--dash-border);"><span>Proyecto</span><strong style="text-align:right;max-width:170px;">${escapeHtml(projectName)}</strong></div>
          <div style="display:flex;justify-content:space-between;padding:8px 0;"><span>Estado</span><strong>${status.label}</strong></div>
        </div>
      </div>
    </div>
  `;

  openModal('Detalle de Gasto', html, null, null, true);
  setTimeout(() => {
    const modalContent = document.querySelector('.dash-modal__content');
    if (modalContent) modalContent.classList.add('dash-modal__content--fullscreen');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }, 60);
}

async function editExpense(id) {
  const { data: expense, error: fetchError } = await supabase
    .from('expenses')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !expense) {
    showToast('Error al cargar gasto', 'error');
    return;
  }

  const { data: projects } = await supabase.from('projects').select('id, name');
  const expenseBreakdown = getStoredExpenseBreakdown(expense);
  const isTaxExempt = expenseBreakdown.taxRate === 0;

  const html = `
    <form class="modal-form" id="expense-form-edit">
      <div class="modal-form__group">
        <label class="modal-form__label">Descripción / Concepto *</label>
        <input type="text" class="modal-form__input" id="expense-desc" value="${escapeHtml(expense.description || '')}" required>
      </div>
      
      <div class="modal-form__row">
        <div class="modal-form__group">
          <label class="modal-form__label">Categoría *</label>
          <select class="modal-form__select" id="expense-category" required>
            <option value="salarios" ${expense.category === 'salarios' ? 'selected' : ''}>Salarios</option>
            <option value="alquiler" ${expense.category === 'alquiler' ? 'selected' : ''}>Alquiler</option>
            <option value="servicios" ${expense.category === 'servicios' ? 'selected' : ''}>Servicios</option>
            <option value="software" ${expense.category === 'software' ? 'selected' : ''}>Software</option>
            <option value="hardware" ${expense.category === 'hardware' ? 'selected' : ''}>Hardware</option>
            <option value="viajes" ${expense.category === 'viajes' ? 'selected' : ''}>Viajes</option>
            <option value="marketing" ${expense.category === 'marketing' ? 'selected' : ''}>Marketing</option>
            <option value="legal" ${expense.category === 'legal' ? 'selected' : ''}>Legal</option>
            <option value="otro" ${expense.category === 'otro' ? 'selected' : ''}>Otro</option>
          </select>
        </div>
        
        <div class="modal-form__group">
          <label class="modal-form__label">Fecha del Gasto *</label>
          <input type="date" class="modal-form__input" id="expense-date" value="${expense.date_incurred || ''}" required>
        </div>
      </div>

      <div class="modal-form__row">
        <div class="modal-form__group">
          <label class="modal-form__label">Monto antes de descuento *</label>
          <input type="number" class="modal-form__input" id="expense-amount" value="${expenseBreakdown.gross}" required min="0" oninput="updateExpenseTotal()">
        </div>
        
        <div class="modal-form__group">
          <label class="modal-form__label">Descuento (CLP)</label>
          <input type="number" class="modal-form__input" id="expense-discount" min="0" placeholder="0" value="${expense.discount_amount || 0}" oninput="updateExpenseTotal()">
        </div>
      </div>

      <label style="display:flex;align-items:flex-start;gap:10px;padding:12px;border:1px solid var(--dash-border);border-radius:10px;background:var(--dash-surface-2);cursor:pointer;margin-bottom:16px;">
        <input type="checkbox" id="expense-tax-exempt" ${isTaxExempt ? 'checked' : ''} onchange="updateExpenseTotal()" style="margin-top:3px;">
        <span>
          <strong style="display:block;">Exento de IVA / sin documento tributario</strong>
          <small style="display:block;color:var(--dash-text-secondary);margin-top:2px;">Úsalo para transferencias a personas naturales u otros gastos que no generan crédito fiscal.</small>
        </span>
      </label>

      <div class="modal-form__row">
        <div class="modal-form__group">
          <label class="modal-form__label">Proveedor / Vendedor *</label>
          ${renderEntitySearchPicker({
            rootId: 'expense-edit-vendor-picker',
            type: 'provider',
            label: 'Buscar proveedor existente',
            placeholder: 'Buscar proveedor por nombre, empresa o RUT',
            helperText: 'Selecciona un proveedor existente para completar el nombre del gasto.',
            onSelect: (record) => {
              const vendorInput = document.getElementById('expense-vendor');
              if (vendorInput) vendorInput.value = record.company || record.name || '';
            }
          })}
          <input type="text" class="modal-form__input" id="expense-vendor" value="${escapeHtml(expense.vendor || '')}" required>
        </div>
        
        <div class="modal-form__group">
          <label class="modal-form__label">Nº Comprobante / Factura</label>
          <input type="text" class="modal-form__input" id="expense-receipt-number" value="${escapeHtml(expense.receipt_number || '')}">
        </div>
      </div>

      <div class="modal-form__row">
        <div class="modal-form__group">
          <label class="modal-form__label">Método de Pago</label>
          <select class="modal-form__select" id="expense-payment">
            <option value="transfer" ${expense.payment_method === 'transfer' ? 'selected' : ''}>Transferencia</option>
            <option value="debit" ${expense.payment_method === 'debit' ? 'selected' : ''}>Débito</option>
            <option value="cash" ${expense.payment_method === 'cash' ? 'selected' : ''}>Efectivo</option>
            <option value="credit_card" ${expense.payment_method === 'credit_card' ? 'selected' : ''}>Tarjeta de Crédito</option>
            <option value="check" ${expense.payment_method === 'check' ? 'selected' : ''}>Cheque</option>
          </select>
        </div>
        
        <div class="modal-form__group">
          <label class="modal-form__label">Centro de Costo</label>
          <input type="text" class="modal-form__input" id="expense-cost-center" value="${escapeHtml(expense.cost_center || '')}">
        </div>
      </div>

      <div class="modal-form__group">
        <label class="modal-form__label">Estado *</label>
        <select class="modal-form__select" id="expense-status" required>
          <option value="draft" ${expense.status === 'draft' ? 'selected' : ''}>Borrador</option>
          <option value="submitted" ${expense.status === 'submitted' ? 'selected' : ''}>Enviado</option>
          <option value="approved" ${expense.status === 'approved' ? 'selected' : ''}>Aprobado</option>
          <option value="rejected" ${expense.status === 'rejected' ? 'selected' : ''}>Rechazado</option>
          <option value="paid" ${expense.status === 'paid' ? 'selected' : ''}>Pagado</option>
        </select>
      </div>

      <div class="modal-form__group">
        <label class="modal-form__label">Notas / Detalles</label>
        <textarea class="modal-form__textarea" id="expense-notes">${escapeHtml(expense.notes || '')}</textarea>
      </div>

      <div class="modal-section" style="margin-top:24px;padding:16px;background:var(--dash-surface-2);border-radius:8px;">
        <div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-bottom:8px;">
          <span style="color:var(--dash-text-secondary);">Monto ingresado:</span>
          <span style="font-weight:600;" id="expense-total-input">$0</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-bottom:8px;">
          <span style="color:var(--dash-text-secondary);">Total Neto (sin IVA):</span>
          <span style="font-weight:600;" id="expense-base-amount">$0</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-bottom:8px;">
          <span style="color:var(--dash-text-secondary);" id="expense-iva-label">IVA 19%:</span>
          <span style="font-weight:600;" id="expense-iva-amount">$0</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-bottom:12px;">
          <span style="color:var(--dash-text-secondary);">- Descuento:</span>
          <span style="font-weight:600;" id="expense-summary-disc">$0</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:1rem;padding-top:12px;border-top:1px solid var(--dash-border);">
          <span style="font-weight:600;">TOTAL A PAGAR:</span>
          <span style="font-weight:700;color:var(--dash-primary);" id="expense-total">$0</span>
        </div>
      </div>
    </form>
  `;

  openModal('Editar Gasto', html, 'Guardar Cambios', async () => {
    const desc = document.getElementById('expense-desc').value?.trim();
    const amount = parseInt(document.getElementById('expense-amount').value) || 0;
    const category = document.getElementById('expense-category').value;
    const date = document.getElementById('expense-date').value;
    const vendor = document.getElementById('expense-vendor').value?.trim();
    const costCenter = document.getElementById('expense-cost-center').value?.trim();
    const method = document.getElementById('expense-payment').value;
    const status = document.getElementById('expense-status').value;
    const notes = document.getElementById('expense-notes').value?.trim();
    const discount = parseInt(document.getElementById('expense-discount').value) || 0;
    const receiptNumber = document.getElementById('expense-receipt-number').value?.trim();
    const isTaxExemptValue = document.getElementById('expense-tax-exempt')?.checked || false;

    if (!desc || !amount || !category || !date || !vendor) {
      showToast('Completa los campos requeridos (*)', 'error');
      return;
    }

    const updatedBreakdown = calculateExpenseBreakdown(amount, discount, isTaxExemptValue ? 0 : 19);

    const { error } = await supabase
      .from('expenses')
      .update({
        description: desc,
        amount: updatedBreakdown.total,
        category,
        date_incurred: date,
        vendor,
        payment_method: method,
        status,
        notes: notes || null,
        receipt_number: receiptNumber || null,
        cost_center: costCenter || null,
        iva_percentage: updatedBreakdown.taxRate,
        iva_amount: updatedBreakdown.iva,
        discount_amount: updatedBreakdown.discount
      })
      .eq('id', id);

    if (error) {
      showToast('Error al guardar cambios: ' + error.message, 'error');
    } else {
      showToast('Gasto actualizado correctamente', 'success');
      closeModal();
      loadExpenses();
      await refreshUnifiedSiiIfVisible();
    }
  });

  setTimeout(() => updateExpenseTotal(), 100);
}

function updateExpenseTotal() {
  const amountInput = document.getElementById('expense-amount');
  const discountInput = document.getElementById('expense-discount');
  const taxExemptInput = document.getElementById('expense-tax-exempt');

  if (!amountInput) return;

  const amount = parseInt(amountInput.value) || 0;
  const discount = parseInt(discountInput?.value || 0);
  const breakdown = calculateExpenseBreakdown(amount, discount, taxExemptInput?.checked ? 0 : 19);

  if (document.getElementById('expense-total-input')) {
    document.getElementById('expense-total-input').textContent = formatCurrency(breakdown.gross);
  }
  if (document.getElementById('expense-base-amount')) {
    document.getElementById('expense-base-amount').textContent = formatCurrency(breakdown.base);
  }
  if (document.getElementById('expense-iva-amount')) {
    document.getElementById('expense-iva-amount').textContent = formatCurrency(breakdown.iva);
  }
  if (document.getElementById('expense-iva-label')) {
    document.getElementById('expense-iva-label').textContent = breakdown.taxRate === 0 ? 'IVA (exento):' : `IVA ${breakdown.taxRate}%:`;
  }
  if (document.getElementById('expense-summary-disc')) {
    document.getElementById('expense-summary-disc').textContent = formatCurrency(breakdown.discount);
  }
  if (document.getElementById('expense-total')) {
    document.getElementById('expense-total').textContent = formatCurrency(breakdown.total);
  }
}

window.deleteExpenseConfirm = function deleteExpenseConfirm(id) {
  openModal('Eliminar Gasto', '<p>¿Estás seguro de eliminar este gasto? Esta acción no se puede deshacer.</p>', 'Eliminar', async () => {
    closeModal();
    await deleteExpense(id);
  });
};

window.viewExpense = viewExpense;

async function deleteExpense(id) {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) {
    showToast('Error al eliminar gasto', 'error');
  } else {
    showToast('Gasto eliminado', 'success');
    loadExpenses();
    await refreshUnifiedSiiIfVisible();
  }
}

function exportExpenses(expenses) {
  const headers = ['Fecha', 'Descripción', 'Categoría', 'Monto', 'Proveedor', 'Método de Pago', 'Estado', 'Notas'];
  const rows = expenses.map(e => [
    e.date_incurred,
    e.description,
    e.category,
    e.amount,
    e.vendor,
    e.payment_method,
    e.status,
    e.notes
  ]);

  const csv = [headers, ...rows].map(r => r.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gastos-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}

async function loadExpenses() {
  const { data: expenses, error } = await supabase
    .from('expenses')
    .select(`
      id,
      date_incurred,
      category,
      description,
      amount,
      vendor,
      project_id,
      status,
      submitted_by,
      approved_by,
      receipt_filename,
      notes,
      payment_method,
      paid_at,
      created_at,
      updated_at
    `)
    .order('date_incurred', { ascending: false });

  if (error) {
    console.error('Error cargando gastos:', error);
    showToast('Error al cargar gastos: ' + (error.message || 'Error desconocido'), 'error');
    return;
  }

  if (!expenses) {
    console.warn('No se recibieron gastos de Supabase');
    return;
  }

  // Get Projects for filtering
  const { data: projects } = await supabase.from('projects').select('id, name');
  const projectMap = {};
  (projects || []).forEach(p => projectMap[p.id] = p.name);

  const searchText = (document.getElementById('expenses-search')?.value || '').toLowerCase();
  const filterCategory = '';
  let filterMonth = document.getElementById('expenses-filter-mes')?.value || '';
  const onlyNotReconciled = document.getElementById('expenses-filter-reconciled')?.checked || false;

  const monthSelect = document.getElementById('expenses-filter-mes');
  const tbodyEl = document.getElementById('expenses-tbody');
  const now = new Date();

  if (!filterMonth && monthSelect) {
    const currentMonthValue = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    monthSelect.value = currentMonthValue;
    filterMonth = currentMonthValue;
  }
  if (monthSelect && !monthSelect.dataset.initialized) {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    monthSelect.innerHTML = months.map((m, i) => {
      const val = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
      const selected = i === currentMonth ? ' selected' : '';
      return `<option value="${val}"${selected}>${m} ${currentYear}</option>`;
    }).join('');
    monthSelect.dataset.initialized = 'true';
  }

  const filteredExpenses = expenses.filter(exp => {
    const date = exp.date_incurred ? new Date(exp.date_incurred) : null;
    if (!date || Number.isNaN(date.valueOf())) return false;

    if (filterMonth && !exp.date_incurred.startsWith(filterMonth)) return false;
    if (filterCategory && exp.category !== filterCategory) return false;
    if (onlyNotReconciled && !['submitted', 'draft'].includes(exp.status)) return false;

    const textMatch = [exp.description, exp.vendor, exp.receipt_number, exp.cost_center]
      .filter(Boolean)
      .some(value => value.toLowerCase().includes(searchText));
    if (searchText && !textMatch) return false;

    return true;
  });

  const displayExpenses = filteredExpenses;

  if (displayExpenses.length === 0) {
    tbodyEl.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--dash-text-secondary);padding:2rem;">No hay gastos para los filtros seleccionados</td></tr>';
  } else {
    tbodyEl.innerHTML = displayExpenses.map(exp => {
      const categoryColors = {
        'salarios': '#ef4444',
        'alquiler': '#f97316',
        'servicios': '#06b6d4',
        'software': '#3b82f6',
        'hardware': '#8b5cf6',
        'viajes': '#ec4899',
        'marketing': '#f59e0b',
        'legal': '#1062b9',
        'otro': '#6b7280'
      };
      const categoryColor = categoryColors[exp.category] || '#6b7280';
      const paymentMethodTranslate = {
        'transfer': 'Transferencia',
        'debit': 'Débito',
        'cash': 'Efectivo',
        'credit_card': 'Tarjeta de Crédito',
        'check': 'Cheque'
      };
      const statusColors = {
        'draft': { bg: 'rgba(107,114,128,0.1)', text: '#6b7280', label: 'Borrador' },
        'submitted': { bg: 'rgba(217,119,6,0.1)', text: '#d97706', label: 'Enviado' },
        'approved': { bg: 'rgba(59,130,246,0.1)', text: '#3b82f6', label: 'Aprobado' },
        'rejected': { bg: 'rgba(220,38,38,0.1)', text: '#dc2626', label: 'Rechazado' },
        'paid': { bg: 'rgba(34,113,197,0.1)', text: '#2271c5', label: 'Pagado' }
      };
      const status = statusColors[exp.status] || statusColors.draft;
      const statusBadge = `<span style="color:${status.text};background:${status.bg};padding:2px 8px;border-radius:4px;font-size:0.7rem;font-weight:600;">${status.label}</span>`;
      return `
        <tr>
          <td>${formatDateShort(exp.date_incurred)}</td>
          <td>${escapeHtml(exp.description || '')}</td>
          <td><span style="color:${categoryColor};font-weight:600;">${exp.category ? exp.category.charAt(0).toUpperCase() + exp.category.slice(1) : '—'}</span></td>
          <td>${formatCurrency(exp.amount)}</td>
          <td>${escapeHtml(exp.vendor || '')}</td>
          <td>${exp.payment_method ? paymentMethodTranslate[exp.payment_method] || exp.payment_method : '—'}</td>
          <td>${exp.project_id ? escapeHtml(projectMap[exp.project_id] || '—') : '—'}</td>
          <td>${statusBadge}</td>
          <td><div class="table-actions">
            <button class="table-action-btn" onclick="viewExpense('${exp.id}')" title="Ver"><i data-lucide="eye" style="width:15px;height:15px;"></i></button>
            ${isButtonAllowed('btn-add-expense') ? `<button class="table-action-btn" onclick="editExpense('${exp.id}')" title="Editar"><i data-lucide="edit-2" style="width:15px;height:15px;"></i></button><button class="table-action-btn table-action-btn--danger" title="Eliminar" onclick="deleteExpenseConfirm('${exp.id}')"><i data-lucide="trash-2" style="width:15px;height:15px;"></i></button>` : ''}
          </div></td>
        </tr>
      `;
    }).join('');
  }

  // Update KPI cards
  const displayedMonthTotal = displayExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const expensesThisYearTotal = expenses
    .filter(e => {
      const d = new Date(e.date_incurred);
      return d && !Number.isNaN(d.valueOf()) && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, e) => s + (e.amount || 0), 0);
  const pending = displayExpenses.filter(e => e.status === 'submitted' || e.status === 'draft');
  const approved = displayExpenses.filter(e => e.status === 'approved' || e.status === 'paid');

  document.getElementById('expenses-kpi-month').textContent = formatCurrency(displayedMonthTotal);
  document.getElementById('expenses-kpi-year').textContent = formatCurrency(expensesThisYearTotal);
  document.getElementById('expenses-kpi-pending').textContent = pending.length;
  document.getElementById('expenses-kpi-reconciled').textContent = approved.length;

  // Charts: expenses by category and project
  renderExpensesByCategory(displayExpenses);
  renderExpensesByProject(displayExpenses, projectMap);

  // Event listeners
  if (!window._expensesListenersSetup) {
    document.getElementById('expenses-search')?.addEventListener('input', loadExpenses);
    document.getElementById('expenses-filter-mes')?.addEventListener('change', loadExpenses);
    document.getElementById('expenses-filter-reconciled')?.addEventListener('change', loadExpenses);
    document.getElementById('btn-add-expense')?.addEventListener('click', () => addExpense());
    document.getElementById('btn-export-expenses')?.addEventListener('click', () => exportExpenses(displayExpenses));
    window._expensesListenersSetup = true;
  }

  // Initialize icons for new HTML rows
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function renderExpensesByProject(expenses, projectMap) {
  const byProject = {};
  expenses.forEach(e => {
    const proj = e.project_id ? projectMap[e.project_id] : 'Sin proyecto';
    if (!byProject[proj]) byProject[proj] = 0;
    byProject[proj] += e.amount || 0;
  });

  const total = Object.values(byProject).reduce((s, v) => s + v, 0);
  const chartEl = document.getElementById('expenses-by-project');

  if (Object.keys(byProject).length === 0) {
    chartEl.innerHTML = '<p style="color:var(--dash-text-secondary);">Sin gastos para mostrar</p>';
    return;
  }

  chartEl.innerHTML = Object.entries(byProject).sort((a, b) => b[1] - a[1]).map(([proj, amount]) => {
    const pct = total > 0 ? (amount / total * 100) : 0;
    return `
      <div style="display:flex;gap:12px;align-items:center;margin-bottom:12px;">
        <div style="min-width:120px;font-size:0.82rem;font-weight:500;color:var(--dash-text-secondary);word-break:break-word;">${escapeHtml(proj)}</div>
        <div style="flex:1;height:24px;background:rgba(0,0,0,0.05);border-radius:4px;overflow:hidden;">
          <div style="height:100%;background:linear-gradient(90deg,#2e547d,#668fbb);width:${pct}%;transition:width 0.3s;"></div>
        </div>
        <div style="min-width:70px;text-align:right;font-size:0.82rem;font-weight:600;color:var(--dash-text);">${formatCurrencyShort(amount)}</div>
      </div>
    `;
  }).join('');
}


window.viewClient = viewClient;
window.editProject = editProject;
window.deleteProject = deleteProject;
window.viewProject = viewProject;
window.manageProjectPortal = manageProjectPortal;
window.addProjectUpdate = addProjectUpdate;
window.deleteProjectUpdate = deleteProjectUpdate;
window.viewTeamMember = viewTeamMember;
window.editTeamMember = editTeamMember;
window.deleteTeamMember = deleteTeamMember;
window.quickCreateInvoiceForClient = quickCreateInvoiceForClient;
window.quickCreateInvoiceForProject = quickCreateInvoiceForProject;
window.viewInvoice = viewInvoice;
window.editInvoice = editInvoice;
window.loadSiiUnified = loadSiiUnified;
window.openSiiIncomeModal = openSiiIncomeModal;
window.viewSiiIncome = viewSiiIncome;
window.deleteSiiIncome = deleteSiiIncome;
window.closeModal = closeModal;
window.addExpense = addExpense;
window.editExpense = editExpense;
window.deleteExpense = deleteExpense;
window.exportExpenses = exportExpenses;
window.updateExpenseTotal = updateExpenseTotal;
window.toggleTask = toggleTask;
window.editTask = editTask;
window.deleteTask = deleteTask;
window.editEvent = editEvent;
window.deleteEvent = deleteEvent;
window.viewEvent = viewEvent;
window.saveEventNotes = saveEventNotes;

// ==========================================================================
// ÓRDENES DE SERVICIO TÉCNICO
// ==========================================================================
const SERVICE_ORDER_STATUS = {
  received: 'Recibida',
  diagnosis: 'En diagnóstico',
  in_progress: 'En reparación',
  ready: 'Lista para entrega',
  delivered: 'Entregada',
  cancelled: 'Cancelada'
};

const SERVICE_ORDER_PAYMENT = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  card: 'Tarjeta',
  pending: 'Pendiente'
};

const SERVICE_ORDER_WARRANTY = 'Garantía mínima de 30 días hábiles desde el término del servicio o la entrega del equipo. Cubre desperfectos o daños atribuibles al trabajo realizado. No cubre fallas ajenas al servicio, golpes, líquidos, variaciones eléctricas, software malicioso ni intervenciones posteriores de terceros, salvo que el problema sea consecuencia del trabajo realizado. Estas condiciones no limitan los derechos de la Ley N.º 19.496.';
const SERVICE_ORDER_CONFORMITY = 'El cliente declara haber recibido información del diagnóstico, valores y condiciones; equipo probado cuando corresponda.';

function serviceOrderToday() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function serviceOrderNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

async function nextServiceOrderFolio() {
  const year = new Date().getFullYear();
  const { data } = await supabase
    .from('service_orders')
    .select('folio')
    .like('folio', `OS-${year}-%`)
    .order('folio', { ascending: false })
    .limit(1);
  const last = String(data?.[0]?.folio || '').split('-').pop();
  return `OS-${year}-${String((parseInt(last, 10) || 0) + 1).padStart(4, '0')}`;
}

async function loadServiceOrders() {
  const tbody = document.getElementById('service-orders-tbody');
  if (!tbody) return;

  const search = document.getElementById('service-order-search');
  const status = document.getElementById('service-order-filter-status');
  const payment = document.getElementById('service-order-filter-payment');
  [search, status, payment].forEach(control => {
    if (!control || control.dataset.initialized) return;
    control.addEventListener(control.tagName === 'INPUT' ? 'input' : 'change', renderServiceOrders);
    control.dataset.initialized = 'true';
  });

  const addButton = document.getElementById('btn-add-service-order');
  if (addButton && !addButton.dataset.initialized) {
    addButton.addEventListener('click', () => openServiceOrderForm());
    addButton.dataset.initialized = 'true';
  }

  const { data, error } = await db.serviceOrders.getAll();
  if (error) {
    console.error('Error cargando órdenes de servicio:', error);
    tbody.innerHTML = `<tr><td colspan="8" class="service-orders-empty">No se pudo cargar la sección. Ejecuta la migración de <strong>service_orders</strong> incluida en supabase-schema.sql.</td></tr>`;
    return;
  }

  window._serviceOrdersCache = data || [];
  renderServiceOrders();
}

function renderServiceOrders() {
  const allOrders = window._serviceOrdersCache || [];
  const query = String(document.getElementById('service-order-search')?.value || '').trim().toLowerCase();
  const status = document.getElementById('service-order-filter-status')?.value || '';
  const payment = document.getElementById('service-order-filter-payment')?.value || '';
  const canManageServiceOrders = isButtonAllowed('btn-add-service-order');

  const filtered = allOrders.filter(order => {
    const haystack = [order.folio, order.client_name, order.client_rut, order.client_phone, order.equipment_type, order.brand_model, order.serial_number, order.technician_name].join(' ').toLowerCase();
    const paymentMatches = !payment || (payment === 'pending' ? order.payment_method === 'pending' : order.payment_method !== 'pending');
    return (!query || haystack.includes(query)) && (!status || order.status === status) && paymentMatches;
  });

  const active = allOrders.filter(order => !['delivered', 'cancelled'].includes(order.status)).length;
  const total = allOrders.reduce((sum, order) => sum + serviceOrderNumber(order.total_amount), 0);
  const setText = (id, value) => { const node = document.getElementById(id); if (node) node.textContent = value; };
  setText('service-order-kpi-active', active);
  setText('service-order-kpi-diagnosis', allOrders.filter(order => order.status === 'diagnosis').length);
  setText('service-order-kpi-ready', allOrders.filter(order => order.status === 'ready').length);
  setText('service-order-kpi-total', formatCurrency(total));

  const tbody = document.getElementById('service-orders-tbody');
  if (!tbody) return;
  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="service-orders-empty">${allOrders.length ? 'No hay órdenes que coincidan con los filtros.' : 'Aún no hay órdenes de servicio. Crea la primera con “Nueva orden”.'}</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(order => {
    const paymentPending = order.payment_method === 'pending';
    const equipmentLabel = [order.equipment_type, order.brand_model].filter(Boolean).join(' · ');
    return `
      <tr>
        <td><strong>${escapeHtml(order.folio)}</strong><br><small>${order.service_date ? formatDateShort(order.service_date) : '—'}</small></td>
        <td><div class="service-order-client"><strong>${escapeHtml(order.client_name)}</strong><small>${escapeHtml(order.client_phone || order.client_rut || 'Sin contacto')}</small></div></td>
        <td><div class="service-order-equipment"><strong>${escapeHtml(equipmentLabel || 'Sin equipo')}</strong><small>${order.serial_number ? `Serie: ${escapeHtml(order.serial_number)}` : 'Sin identificación'}</small></div></td>
        <td>${escapeHtml(order.technician_name || '—')}</td>
        <td><span class="service-order-status service-order-status--${escapeHtml(order.status)}">${SERVICE_ORDER_STATUS[order.status] || escapeHtml(order.status)}</span></td>
        <td><span class="service-order-payment service-order-payment--${paymentPending ? 'pending' : 'paid'}">${SERVICE_ORDER_PAYMENT[order.payment_method] || '—'}</span></td>
        <td><strong>${formatCurrency(serviceOrderNumber(order.total_amount))}</strong></td>
        <td>
          <div class="dashboard-row-actions">
            <button class="btn-dash btn-dash--secondary btn-dash--sm" onclick="viewServiceOrder('${order.id}')" title="Ver detalle"><i data-lucide="eye"></i></button>
            ${canManageServiceOrders ? `<button class="btn-dash btn-dash--secondary btn-dash--sm" onclick="editServiceOrder('${order.id}')" title="Editar"><i data-lucide="pencil"></i></button>
            <button class="btn-dash btn-dash--secondary btn-dash--sm" onclick="deleteServiceOrder('${order.id}')" title="Eliminar"><i data-lucide="trash-2"></i></button>` : ''}
          </div>
        </td>
      </tr>`;
  }).join('');
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

const BOOKING_STATUS_LABELS = { confirmed: 'Confirmada', pending: 'Pendiente de pago', cancelled: 'Cancelada', rejected: 'Rechazada', expired: 'Expirada', needs_review: 'Revisar pago', payment_mismatch: 'Monto no coincide' };

function normalizeBooking(row, type) {
  const visit = type === 'visit';
  const rawStatus = String(row.status || (visit ? 'pending' : 'confirmed'));
  return {
    id: type + ':' + row.id, sourceId: row.id, type,
    date: visit ? row.visit_date : row.booking_date,
    time: visit ? row.visit_time : row.booking_time, endTime: row.end_time,
    name: row.customer_name, email: row.customer_email, phone: row.customer_phone,
    detail: visit ? row.service_name : (row.topic || row.company || 'Reunión inicial sin costo'),
    company: row.company || '', status: rawStatus === 'approved' ? 'confirmed' : rawStatus,
    eventId: row.event_id || null, createdAt: row.created_at || ''
  };
}

async function loadBookings() {
  const tbody = document.getElementById('bookings-tbody');
  if (!tbody) return;
  const controls = [document.getElementById('bookings-search'), document.getElementById('bookings-filter-type'), document.getElementById('bookings-filter-status')];
  controls.forEach(control => {
    if (!control || control.dataset.initialized) return;
    control.addEventListener(control.tagName === 'INPUT' ? 'input' : 'change', renderBookings);
    control.dataset.initialized = 'true';
  });
  const refresh = document.getElementById('bookings-refresh');
  if (refresh && !refresh.dataset.initialized) { refresh.addEventListener('click', loadBookings); refresh.dataset.initialized = 'true'; }
  const calendar = document.getElementById('bookings-open-calendar');
  if (calendar && !calendar.dataset.initialized) { calendar.addEventListener('click', () => navigateTo('calendar')); calendar.dataset.initialized = 'true'; }
  tbody.innerHTML = '<tr><td colspan="6" class="service-orders-empty">Cargando reservas...</td></tr>';
  const results = await Promise.all([
    supabase.from('visit_reservations').select('id,service_name,customer_name,customer_email,customer_phone,visit_date,visit_time,end_time,status,event_id,created_at').order('visit_date', { ascending: false }).order('visit_time', { ascending: false }),
    supabase.from('free_consultation_bookings').select('id,customer_name,customer_email,customer_phone,company,topic,booking_date,booking_time,end_time,status,event_id,created_at').order('booking_date', { ascending: false }).order('booking_time', { ascending: false })
  ]);
  const visits = results[0], consultations = results[1];
  if (visits.error || consultations.error) {
    console.error('Error cargando reservas:', visits.error || consultations.error);
    tbody.innerHTML = '<tr><td colspan="6" class="service-orders-empty">No se pudieron cargar las reservas. Verifica la migración de reservas.</td></tr>';
    return;
  }
  window._bookingsCache = (visits.data || []).map(row => normalizeBooking(row, 'visit')).concat((consultations.data || []).map(row => normalizeBooking(row, 'consultation'))).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  renderBookings();
}

function renderBookings() {
  const all = window._bookingsCache || [];
  const query = String(document.getElementById('bookings-search')?.value || '').trim().toLowerCase();
  const type = document.getElementById('bookings-filter-type')?.value || '';
  const statusFilter = document.getElementById('bookings-filter-status')?.value || '';
  const filtered = all.filter(item => (!query || [item.name, item.email, item.phone, item.detail, item.company].join(' ').toLowerCase().includes(query)) && (!type || item.type === type) && (!statusFilter || item.status === statusFilter));
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });
  const set = (id, value) => { const node = document.getElementById(id); if (node) node.textContent = value; };
  set('bookings-kpi-upcoming', all.filter(item => item.date >= today && item.status === 'confirmed').length);
  set('bookings-kpi-approved', all.filter(item => item.type === 'visit' && item.status === 'confirmed').length);
  set('bookings-kpi-consultations', all.filter(item => item.type === 'consultation' && item.status === 'confirmed').length);
  set('bookings-kpi-pending', all.filter(item => item.status === 'pending').length);
  const tbody = document.getElementById('bookings-tbody');
  if (!tbody) return;
  if (!filtered.length) { tbody.innerHTML = '<tr><td colspan="6" class="service-orders-empty">' + (all.length ? 'No hay reservas que coincidan con los filtros.' : 'Aún no hay reservas desde el sitio.') + '</td></tr>'; return; }
  tbody.innerHTML = filtered.map(item => {
    const label = BOOKING_STATUS_LABELS[item.status] || item.status;
    const kind = item.type === 'visit' ? 'Visita técnica' : 'Reunión inicial';
    const canManage = isAdministrativeRole(getCurrentRole());
    return '<tr><td><strong>' + escapeHtml(formatDateShort(item.date)) + '</strong><br><small>' + escapeHtml(String(item.time || '').slice(0, 5)) + (item.endTime ? ' – ' + escapeHtml(String(item.endTime).slice(0, 5)) : '') + '</small></td><td>' + kind + '</td><td><div class="service-order-client"><strong>' + escapeHtml(item.name) + '</strong><small>' + escapeHtml(item.email) + '</small></div></td><td>' + escapeHtml(item.detail) + '</td><td><span class="service-order-status">' + escapeHtml(label) + '</span></td><td><div class="dashboard-row-actions"><button class="btn-dash btn-dash--secondary btn-dash--sm" type="button" data-booking-detail="' + escapeHtml(item.id) + '" title="Ver detalle"><i data-lucide="eye"></i></button>' + (canManage && item.status !== 'confirmed' ? '<button class="btn-dash btn-dash--secondary btn-dash--sm" type="button" data-booking-confirm="' + escapeHtml(item.id) + '" title="Confirmar"><i data-lucide="circle-check"></i></button>' : '') + (canManage ? '<button class="btn-dash btn-dash--secondary btn-dash--sm" type="button" data-booking-reschedule="' + escapeHtml(item.id) + '" title="Reprogramar"><i data-lucide="calendar-clock"></i></button><button class="btn-dash btn-dash--secondary btn-dash--sm" type="button" data-booking-cancel="' + escapeHtml(item.id) + '" title="Cancelar"><i data-lucide="x-circle"></i></button><button class="btn-dash btn-dash--secondary btn-dash--sm" type="button" data-booking-delete="' + escapeHtml(item.id) + '" title="Eliminar"><i data-lucide="trash-2"></i></button>' : '') + '</div></td></tr>';
  }).join('');
  tbody.querySelectorAll('[data-booking-detail]').forEach(button => button.addEventListener('click', () => openBookingDetail(button.dataset.bookingDetail)));
  tbody.querySelectorAll('[data-booking-confirm]').forEach(button => button.addEventListener('click', () => manageBookingAction(button.dataset.bookingConfirm, 'confirm')));
  tbody.querySelectorAll('[data-booking-reschedule]').forEach(button => button.addEventListener('click', () => openBookingReschedule(button.dataset.bookingReschedule)));
  tbody.querySelectorAll('[data-booking-cancel]').forEach(button => button.addEventListener('click', () => manageBookingAction(button.dataset.bookingCancel, 'cancel')));
  tbody.querySelectorAll('[data-booking-delete]').forEach(button => button.addEventListener('click', () => manageBookingAction(button.dataset.bookingDelete, 'delete')));
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function openBookingDetail(id) {
  const item = (window._bookingsCache || []).find(row => row.id === id);
  if (!item) return;
  const canManage = isAdministrativeRole(getCurrentRole());
  const detail = '<section class="booking-detail"><p><strong>Cliente:</strong> ' + escapeHtml(item.name) + '</p><p><strong>Correo:</strong> <a href="mailto:' + escapeHtml(item.email) + '">' + escapeHtml(item.email) + '</a></p><p><strong>Teléfono:</strong> ' + escapeHtml(item.phone) + '</p>' + (item.company ? '<p><strong>Empresa:</strong> ' + escapeHtml(item.company) + '</p>' : '') + '<p><strong>Fecha:</strong> ' + escapeHtml(formatDateShort(item.date)) + ' · ' + escapeHtml(String(item.time || '').slice(0, 5)) + '</p><p><strong>Detalle:</strong> ' + escapeHtml(item.detail) + '</p><p><strong>Estado:</strong> ' + escapeHtml(BOOKING_STATUS_LABELS[item.status] || item.status) + '</p></section>';
  openModal(item.type === 'visit' ? 'Detalle de visita técnica' : 'Detalle de reunión inicial', detail, canManage ? 'Reprogramar' : 'Cerrar', async () => { if (canManage) openBookingReschedule(id); else closeModal(); }, false, !canManage);
}

async function manageBookingAction(id, action, schedule = null) {
  const item = (window._bookingsCache || []).find(row => row.id === id);
  if (!item) return;
  if (action === 'confirm' && !window.confirm('¿Confirmar manualmente la reserva de ' + item.name + '?')) return;
  if ((action === 'cancel' || action === 'delete') && !window.confirm((action === 'delete' ? '¿Eliminar definitivamente' : '¿Cancelar') + ' la reserva de ' + item.name + '?')) return;
  const payload = { p_source: item.type, p_booking_id: item.sourceId, p_action: action };
  if (schedule) { payload.p_date = schedule.date; payload.p_start_time = schedule.start; payload.p_end_time = schedule.end; }
  const { data, error } = await supabase.rpc('manage_public_booking', payload);
  if (error || !data?.ok) return showToast(data?.status === 'unavailable' ? 'Ese horario ya está ocupado.' : (error?.message || 'No se pudo actualizar la reserva.'), 'error');
  closeModal();
  showToast({ confirm: 'Reserva confirmada.', cancel: 'Reserva cancelada y horario liberado.', reschedule: 'Reserva reprogramada.', delete: 'Reserva eliminada.' }[action] || 'Reserva actualizada.', 'success');
  await loadBookings();
}

function openBookingReschedule(id) {
  const item = (window._bookingsCache || []).find(row => row.id === id);
  if (!item) return;
  const form = '<div class="modal-form__group"><label class="modal-form__label" for="booking-new-date">Nueva fecha</label><input class="modal-form__input" id="booking-new-date" type="date" value="' + escapeHtml(item.date) + '" required></div><div class="modal-form__group"><label class="modal-form__label" for="booking-new-start">Hora de inicio</label><input class="modal-form__input" id="booking-new-start" type="time" value="' + escapeHtml(String(item.time || '').slice(0, 5)) + '" required></div><div class="modal-form__group"><label class="modal-form__label" for="booking-new-end">Hora de término</label><input class="modal-form__input" id="booking-new-end" type="time" value="' + escapeHtml(String(item.endTime || '').slice(0, 5)) + '" required></div><p class="calendar-block-help">Se comprobará la disponibilidad antes de guardar el nuevo horario.</p>';
  openModal('Reprogramar reserva', form, 'Guardar horario', async () => {
    const date = document.getElementById('booking-new-date')?.value;
    const start = document.getElementById('booking-new-start')?.value;
    const end = document.getElementById('booking-new-end')?.value;
    if (!date || !start || !end || end <= start) return showToast('Indica un intervalo de horario válido.', 'warning');
    await manageBookingAction(id, 'reschedule', { date, start, end });
  });
}

function serviceOrderInput(id, label, value = '', type = 'text', attrs = '') {
  return `<div class="modal-form__group"><label class="modal-form__label" for="${id}">${label}</label><input class="modal-form__input" id="${id}" type="${type}" value="${escapeHtml(String(value ?? ''))}" ${attrs}></div>`;
}

function serviceOrderTextarea(id, label, value = '', placeholder = '') {
  return `<div class="modal-form__group service-order-form__wide"><label class="modal-form__label" for="${id}">${label}</label><textarea class="modal-form__textarea" id="${id}" rows="4" placeholder="${escapeHtml(placeholder)}">${escapeHtml(String(value ?? ''))}</textarea></div>`;
}

function serviceOrderFormHtml(order = {}, folio = '') {
  const checked = field => order[field] ? 'checked' : '';
  const selected = (field, value, fallback = '') => (order[field] || fallback) === value ? 'selected' : '';
  return `
    <div class="service-order-form">
      <section class="service-order-form__section">
        <h4><i data-lucide="file-text"></i> Identificación de la orden</h4>
        <div class="service-order-form__grid service-order-form__grid--3">
          ${serviceOrderInput('so-folio', 'Folio *', order.folio || folio, 'text', 'required')}
          ${serviceOrderInput('so-date', 'Fecha *', order.service_date || serviceOrderToday(), 'date', 'required')}
          <div class="modal-form__group"><label class="modal-form__label" for="so-status">Estado</label><select class="modal-form__select" id="so-status">${Object.entries(SERVICE_ORDER_STATUS).map(([value, label]) => `<option value="${value}" ${selected('status', value, 'received')}>${label}</option>`).join('')}</select></div>
        </div>
      </section>

      <section class="service-order-form__section">
        <h4><i data-lucide="user-cog"></i> Prestador o técnico</h4>
        <div class="service-order-form__grid service-order-form__grid--3">
          ${serviceOrderInput('so-provider', 'RUT / razón social', order.provider_rut_name || 'Servicios Informáticos Yevenes & CIA LTDA · 78.352.809-6')}
          ${serviceOrderInput('so-technician', 'Técnico *', order.technician_name || currentProfile?.full_name || '', 'text', 'required')}
          ${serviceOrderInput('so-technician-contact', 'Contacto', order.technician_contact || 'tomas@solvenlabs.cl · +56 9 7702 9753')}
        </div>
      </section>

      <section class="service-order-form__section">
        <h4><i data-lucide="user"></i> Datos del cliente</h4>
        <div class="service-order-form__grid">
          ${serviceOrderInput('so-client-name', 'Nombre / empresa *', order.client_name, 'text', 'required')}
          ${serviceOrderInput('so-client-rut', 'RUT', order.client_rut)}
          ${serviceOrderInput('so-client-phone', 'Teléfono', order.client_phone, 'tel')}
          ${serviceOrderInput('so-address', 'Dirección / lugar del servicio', order.service_address)}
        </div>
      </section>

      <section class="service-order-form__section">
        <h4><i data-lucide="monitor-cog"></i> Equipo y solicitud</h4>
        <div class="service-order-checks">
          <label><input type="checkbox" id="so-at-home" ${checked('service_at_home')}> Servicio a domicilio</label>
          <label><input type="checkbox" id="so-received" ${checked('equipment_received')}> Equipo recibido</label>
          <label><input type="checkbox" id="so-diagnosis-only" ${checked('diagnosis_only')}> Solo diagnóstico</label>
        </div>
        <div class="service-order-form__grid">
          ${serviceOrderInput('so-equipment', 'Equipo *', order.equipment_type, 'text', 'list="so-equipment-types" required')}
          <datalist id="so-equipment-types"><option value="Notebook"><option value="PC de escritorio"><option value="Impresora"><option value="Router"><option value="Consola"><option value="Cámara"><option value="Disco duro"></datalist>
          ${serviceOrderInput('so-brand-model', 'Marca / modelo', order.brand_model)}
          ${serviceOrderInput('so-serial', 'N.º de serie / identificación', order.serial_number)}
          ${serviceOrderInput('so-password', 'Clave entregada', order.access_password)}
          ${serviceOrderTextarea('so-failure', 'Falla informada por el cliente *', order.reported_failure, 'Describe los síntomas informados por el cliente.')}
        </div>
      </section>

      <section class="service-order-form__section">
        <h4><i data-lucide="stethoscope"></i> Diagnóstico y trabajo realizado</h4>
        ${serviceOrderTextarea('so-diagnosis-work', 'Diagnóstico y trabajo realizado', order.diagnosis_work, 'Diagnóstico, causa, pruebas, reparación, mantenimiento, configuraciones, programas instalados y resultado final.')}
      </section>

      <section class="service-order-form__section">
        <h4><i data-lucide="package-open"></i> Repuestos, materiales u observaciones</h4>
        ${serviceOrderTextarea('so-parts-observations', 'Repuestos, materiales u observaciones', order.parts_observations, 'Repuestos, cantidad, daños previos, accesorios recibidos, recomendaciones, pendientes y advertencias.')}
      </section>

      <section class="service-order-form__section">
        <h4><i data-lucide="circle-dollar-sign"></i> Valores</h4>
        <div class="service-order-value-row">${serviceOrderInput('so-labor-detail', 'Mano de obra · detalle / cantidad', order.labor_detail)}${serviceOrderInput('so-labor-amount', 'Valor ($)', order.labor_amount || 0, 'number', 'min="0" step="1" data-service-order-amount')}</div>
        <div class="service-order-value-row">${serviceOrderInput('so-materials-detail', 'Repuestos / materiales · detalle / cantidad', order.materials_detail)}${serviceOrderInput('so-materials-amount', 'Valor ($)', order.materials_amount || 0, 'number', 'min="0" step="1" data-service-order-amount')}</div>
        <div class="service-order-value-row">${serviceOrderInput('so-travel-detail', 'Visita / traslado · detalle / cantidad', order.travel_detail)}${serviceOrderInput('so-travel-amount', 'Valor ($)', order.travel_amount || 0, 'number', 'min="0" step="1" data-service-order-amount')}</div>
        <div class="service-order-total"><span>Total</span><strong id="so-total">${formatCurrency(serviceOrderNumber(order.total_amount))}</strong></div>
      </section>

      <section class="service-order-form__section">
        <h4><i data-lucide="credit-card"></i> Pago</h4>
        <div class="service-order-form__grid">
          <div class="modal-form__group"><label class="modal-form__label" for="so-payment">Forma de pago</label><select class="modal-form__select" id="so-payment">${Object.entries(SERVICE_ORDER_PAYMENT).map(([value, label]) => `<option value="${value}" ${selected('payment_method', value, 'pending')}>${label}</option>`).join('')}</select></div>
          ${serviceOrderInput('so-document-number', 'Boleta / factura N.º', order.document_number)}
        </div>
      </section>

      <section class="service-order-form__section">
        <h4><i data-lucide="shield-check"></i> Garantía del servicio</h4>
        <div class="service-order-fixed">${SERVICE_ORDER_WARRANTY}</div>
      </section>

      <section class="service-order-form__section">
        <h4><i data-lucide="signature"></i> Conformidad y recepción</h4>
        <div class="service-order-fixed" style="margin-bottom:12px;">${SERVICE_ORDER_CONFORMITY}</div>
        <div class="service-order-form__grid">
          ${serviceOrderInput('so-technician-signature', 'Nombre del técnico firmante', order.technician_signature_name || order.technician_name)}
          ${serviceOrderInput('so-client-signature', 'Nombre del cliente / recepción', order.client_signature_name)}
          <div class="service-order-form__wide service-order-checks"><label><input type="checkbox" id="so-conformity" ${checked('client_conformity')}> Cliente confirma recepción conforme</label></div>
        </div>
      </section>
    </div>`;
}

function updateServiceOrderTotal() {
  const total = ['so-labor-amount', 'so-materials-amount', 'so-travel-amount']
    .reduce((sum, id) => sum + serviceOrderNumber(document.getElementById(id)?.value), 0);
  const output = document.getElementById('so-total');
  if (output) output.textContent = formatCurrency(total);
  return total;
}

function collectServiceOrderForm() {
  const value = id => String(document.getElementById(id)?.value || '').trim();
  const required = [
    ['so-folio', 'folio'],
    ['so-date', 'fecha'],
    ['so-technician', 'técnico'],
    ['so-client-name', 'cliente'],
    ['so-equipment', 'equipo'],
    ['so-failure', 'falla informada']
  ];
  const missing = required.find(([id]) => !value(id));
  if (missing) {
    showToast(`Completa el campo ${missing[1]}`, 'warning');
    document.getElementById(missing[0])?.focus();
    return null;
  }
  return {
    folio: value('so-folio'),
    service_date: value('so-date'),
    status: value('so-status'),
    provider_rut_name: value('so-provider') || null,
    technician_name: value('so-technician'),
    technician_contact: value('so-technician-contact') || null,
    client_name: value('so-client-name'),
    client_rut: formatRutOrNull(value('so-client-rut')),
    client_phone: value('so-client-phone') || null,
    service_address: value('so-address') || null,
    service_at_home: Boolean(document.getElementById('so-at-home')?.checked),
    equipment_received: Boolean(document.getElementById('so-received')?.checked),
    diagnosis_only: Boolean(document.getElementById('so-diagnosis-only')?.checked),
    equipment_type: value('so-equipment'),
    brand_model: value('so-brand-model') || null,
    serial_number: value('so-serial') || null,
    access_password: value('so-password') || null,
    reported_failure: value('so-failure'),
    diagnosis_work: value('so-diagnosis-work') || null,
    parts_observations: value('so-parts-observations') || null,
    labor_detail: value('so-labor-detail') || null,
    labor_amount: serviceOrderNumber(value('so-labor-amount')),
    materials_detail: value('so-materials-detail') || null,
    materials_amount: serviceOrderNumber(value('so-materials-amount')),
    travel_detail: value('so-travel-detail') || null,
    travel_amount: serviceOrderNumber(value('so-travel-amount')),
    total_amount: updateServiceOrderTotal(),
    payment_method: value('so-payment'),
    document_number: value('so-document-number') || null,
    technician_signature_name: value('so-technician-signature') || null,
    client_signature_name: value('so-client-signature') || null,
    client_conformity: Boolean(document.getElementById('so-conformity')?.checked),
    updated_at: new Date().toISOString()
  };
}

async function openServiceOrderForm(order = null) {
  if (!isButtonAllowed('btn-add-service-order')) return showToast('No tienes permiso para gestionar órdenes de servicio', 'warning');
  const folio = order?.folio || await nextServiceOrderFolio();
  openModal(order ? `Editar orden ${order.folio}` : 'Nueva orden de servicio', serviceOrderFormHtml(order || {}, folio), order ? 'Guardar cambios' : 'Crear orden', async () => {
    const payload = collectServiceOrderForm();
    if (!payload) return;
    const result = order
      ? await db.serviceOrders.update(order.id, payload)
      : await db.serviceOrders.create({ ...payload, created_by: currentProfile?.id || null });
    if (result.error) {
      showToast(`No se pudo guardar la orden: ${result.error.message}`, 'error');
      return;
    }
    closeModal();
    showToast(order ? 'Orden actualizada' : `Orden ${payload.folio} creada`, 'success');
    await loadServiceOrders();
  });
  document.querySelector('#dash-modal .dash-modal__content')?.classList.add('service-order-modal');
  document.querySelectorAll('[data-service-order-amount]').forEach(input => input.addEventListener('input', updateServiceOrderTotal));
  updateServiceOrderTotal();
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.editServiceOrder = function editServiceOrder(id) {
  if (!isButtonAllowed('btn-add-service-order')) return showToast('No tienes permiso para gestionar órdenes de servicio', 'warning');
  const order = (window._serviceOrdersCache || []).find(item => item.id === id);
  if (!order) return showToast('Orden no encontrada', 'error');
  return openServiceOrderForm(order);
};

window.viewServiceOrder = function viewServiceOrder(id) {
  const order = (window._serviceOrdersCache || []).find(item => item.id === id);
  if (!order) return showToast('Orden no encontrada', 'error');
  const modes = [
    order.service_at_home && 'Servicio a domicilio',
    order.equipment_received && 'Equipo recibido',
    order.diagnosis_only && 'Solo diagnóstico'
  ].filter(Boolean).join(' · ') || 'Sin modalidad marcada';
  const payment = SERVICE_ORDER_PAYMENT[order.payment_method] || '—';
  openModal(`Orden ${order.folio}`, `
    <div class="service-order-detail">
      <div class="service-order-detail__header"><div><h3>${escapeHtml(order.client_name)}</h3><p>${escapeHtml([order.equipment_type, order.brand_model, order.serial_number].filter(Boolean).join(' · '))}</p></div><span class="service-order-status service-order-status--${escapeHtml(order.status)}">${SERVICE_ORDER_STATUS[order.status] || escapeHtml(order.status)}</span></div>
      <div class="service-order-detail__grid">
        <section class="service-order-detail__panel"><h4>Orden y técnico</h4><p><strong>Fecha:</strong> ${order.service_date ? formatDateShort(order.service_date) : '—'}</p><p><strong>Prestador:</strong> ${escapeHtml(order.provider_rut_name || '—')}</p><p><strong>Técnico:</strong> ${escapeHtml(order.technician_name || '—')}</p><p><strong>Contacto:</strong> ${escapeHtml(order.technician_contact || '—')}</p></section>
        <section class="service-order-detail__panel"><h4>Cliente</h4><p><strong>RUT:</strong> ${escapeHtml(order.client_rut || '—')}</p><p><strong>Teléfono:</strong> ${escapeHtml(order.client_phone || '—')}</p><p><strong>Lugar:</strong> ${escapeHtml(order.service_address || '—')}</p></section>
        <section class="service-order-detail__panel"><h4>Equipo y solicitud</h4><p><strong>Modalidad:</strong> ${escapeHtml(modes)}</p><p><strong>Clave entregada:</strong> ${escapeHtml(order.access_password || '—')}</p><p><strong>Falla informada:</strong><br>${escapeHtml(order.reported_failure || '—')}</p></section>
        <section class="service-order-detail__panel"><h4>Diagnóstico y trabajo realizado</h4><p>${escapeHtml(order.diagnosis_work || 'Sin registrar')}</p></section>
        <section class="service-order-detail__panel"><h4>Repuestos, materiales u observaciones</h4><p>${escapeHtml(order.parts_observations || 'Sin registrar')}</p></section>
        <section class="service-order-detail__panel"><h4>Valores y pago</h4><p><strong>Mano de obra:</strong> ${escapeHtml(order.labor_detail || '—')} · ${formatCurrency(serviceOrderNumber(order.labor_amount))}</p><p><strong>Repuestos:</strong> ${escapeHtml(order.materials_detail || '—')} · ${formatCurrency(serviceOrderNumber(order.materials_amount))}</p><p><strong>Visita:</strong> ${escapeHtml(order.travel_detail || '—')} · ${formatCurrency(serviceOrderNumber(order.travel_amount))}</p><p><strong>Total:</strong> ${formatCurrency(serviceOrderNumber(order.total_amount))}</p><p><strong>Pago:</strong> ${payment}${order.document_number ? ` · Doc. ${escapeHtml(order.document_number)}` : ''}</p></section>
      </div>
      <div class="service-order-fixed"><strong>Garantía:</strong> ${SERVICE_ORDER_WARRANTY}</div>
      <div class="service-order-fixed"><strong>Conformidad:</strong> ${SERVICE_ORDER_CONFORMITY}<br>${order.client_conformity ? `Recepción confirmada por ${escapeHtml(order.client_signature_name || order.client_name)}.` : 'Recepción conforme aún no confirmada.'}</div>
    </div>`, 'Cerrar', closeModal, false, true);
  document.querySelector('#dash-modal .dash-modal__content')?.classList.add('service-order-modal');
  if (typeof lucide !== 'undefined') lucide.createIcons();
};

window.deleteServiceOrder = function deleteServiceOrder(id) {
  if (!isButtonAllowed('btn-add-service-order')) return showToast('No tienes permiso para gestionar órdenes de servicio', 'warning');
  const order = (window._serviceOrdersCache || []).find(item => item.id === id);
  if (!order) return showToast('Orden no encontrada', 'error');
  openModal(`Eliminar orden ${order.folio}`, `<p>¿Seguro que quieres eliminar la orden de <strong>${escapeHtml(order.client_name)}</strong>? Esta acción no se puede deshacer.</p>`, 'Eliminar', async () => {
    const { error } = await db.serviceOrders.delete(id);
    if (error) return showToast(`No se pudo eliminar: ${error.message}`, 'error');
    closeModal();
    showToast('Orden eliminada', 'success');
    await loadServiceOrders();
  });
};

window.openWhatsAppLead = async function openWhatsAppLead(id) {
  const { data } = await db.siteMessages.getAll();
  const message = (data || []).find(item => item.id === id);
  if (!message?.phone) return showToast('Este lead no dejó un número de WhatsApp', 'warning');
  if (message.status === 'new') await db.siteMessages.updateStatus(id, 'read');
  let phone = String(message.phone).replace(/\D/g, '');
  if (phone.length === 9 && phone.startsWith('9')) phone = `56${phone}`;
  const firstName = String(message.name || '').trim().split(/\s+/)[0] || 'hola';
  const service = String(message.service || 'tu solicitud').trim();
  const copy = `Hola ${firstName}, soy parte del equipo Solven Labs. Recibimos tu solicitud sobre “${service}”. ¿Te parece si coordinamos una breve conversación para entender tu caso y orientarte con el mejor siguiente paso?`;
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(copy)}`, '_blank', 'noopener');
};

window.copyLeadFollowUp = async function copyLeadFollowUp(id) {
  const { data } = await db.siteMessages.getAll();
  const message = (data || []).find(item => item.id === id);
  if (!message) return;
  const firstName = String(message.name || '').trim().split(/\s+/)[0] || 'hola';
  const copy = `Hola ${firstName}, quería confirmar si aún buscas resolver ${String(message.service || 'tu necesidad digital').toLowerCase()}. Esta semana podemos revisar tu caso en una reunión breve sin costo y proponerte un siguiente paso claro. ¿Te acomoda?`;
  try {
    await navigator.clipboard.writeText(copy);
    showToast('Mensaje de seguimiento copiado', 'success');
  } catch (error) {
    showToast('No se pudo copiar el mensaje', 'error');
  }
};

// ============================================================================
// BOLETAS INTERNAS
// ============================================================================
let dashboardReceiptInitialized = false;
let dashboardReceiptSaved = null;
let dashboardReceiptSaving = false;
let dashboardReceiptHistory = [];
let dashboardReceiptHistoryLoading = false;
let dashboardReceiptHistoryError = '';

const dashboardReceiptMoney = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0
});

function dashboardReceiptFields() {
  return {
    type: document.getElementById('dashboard-receipt-type'),
    number: document.getElementById('dashboard-receipt-number'),
    date: document.getElementById('dashboard-receipt-date'),
    customerName: document.getElementById('dashboard-receipt-customer-name'),
    customerRut: document.getElementById('dashboard-receipt-customer-rut'),
    customerContact: document.getElementById('dashboard-receipt-customer-contact'),
    payment: document.getElementById('dashboard-receipt-payment'),
    received: document.getElementById('dashboard-receipt-received'),
    note: document.getElementById('dashboard-receipt-note'),
    footer: document.getElementById('dashboard-receipt-footer')
  };
}

function dashboardReceiptFormatMoney(value) {
  return dashboardReceiptMoney.format(Math.round(Number(value) || 0));
}

function dashboardReceiptNumber(input) {
  const value = Number.parseFloat(input?.value);
  return Number.isFinite(value) ? value : 0;
}

function dashboardReceiptLocalDate(date = new Date()) {
  const pad = value => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function dashboardReceiptDateLabel(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

function dashboardReceiptReference(number) {
  return `INT-${String(number).padStart(6, '0')}`;
}

function dashboardReceiptNormalizeSearch(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function dashboardReceiptSearchText(receipt) {
  const items = Array.isArray(receipt.items) ? receipt.items : [];
  return dashboardReceiptNormalizeSearch([
    receipt.receipt_number,
    dashboardReceiptReference(receipt.receipt_number),
    receipt.document_type,
    receipt.customer_name,
    receipt.customer_rut,
    receipt.customer_contact,
    receipt.payment_method,
    receipt.total_amount,
    receipt.net_amount,
    receipt.tax_amount,
    receipt.issued_at,
    dashboardReceiptHistoryDate(receipt),
    receipt.note,
    receipt.footer_note,
    ...items.flatMap(item => [item.description, item.quantity, item.price, item.total])
  ].join(' '));
}

function dashboardReceiptHistoryDate(receipt) {
  const value = receipt.issued_at || receipt.created_at;
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function dashboardReceiptRenderHistory() {
  const input = document.getElementById('dashboard-receipt-search');
  if (!input) return;
  input.setAttribute('aria-busy', dashboardReceiptHistoryLoading ? 'true' : 'false');
}

async function dashboardReceiptLoadHistory({ notify = false } = {}) {
  if (dashboardReceiptHistoryLoading) return;
  dashboardReceiptHistoryLoading = true;
  dashboardReceiptHistoryError = '';
  dashboardReceiptRenderHistory();
  try {
    const rows = [];
    const pageSize = 1000;
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await supabase
        .from('thermal_receipts')
        .select('*')
        .order('issued_at', { ascending: false })
        .range(from, from + pageSize - 1);
      if (error) throw error;
      rows.push(...(data || []));
      if (!data || data.length < pageSize) break;
    }
    dashboardReceiptHistory = rows;
    if (notify) showToast('Listado de boletas actualizado', 'success');
  } catch (error) {
    console.error('No se pudieron consultar las boletas:', error);
    const missingTable = error?.code === '42P01' || error?.code === 'PGRST205';
    dashboardReceiptHistoryError = missingTable
      ? 'Falta crear la tabla de boletas en Supabase.'
      : `No se pudieron cargar las boletas: ${error?.message || 'error de conexión'}`;
    if (notify) showToast('No se pudo actualizar el listado de boletas', 'error');
  } finally {
    dashboardReceiptHistoryLoading = false;
    dashboardReceiptRenderHistory();
  }
}

function dashboardReceiptFindMatches(value) {
  const query = dashboardReceiptNormalizeSearch(value);
  if (!query) return [];
  const terms = query.split(' ').filter(Boolean);
  const matches = dashboardReceiptHistory.filter(receipt => {
    const haystack = dashboardReceiptSearchText(receipt);
    return terms.every(term => haystack.includes(term));
  });
  const exact = matches.find(receipt => {
    const reference = dashboardReceiptNormalizeSearch(dashboardReceiptReference(receipt.receipt_number));
    const number = dashboardReceiptNormalizeSearch(receipt.receipt_number);
    return query === reference || query === number;
  });
  return exact ? [exact] : matches;
}

function dashboardReceiptOpenMatchSelector(matches) {
  const rows = matches.map(receipt => {
    const items = dashboardReceiptRecordItems(receipt);
    const detail = items.map(item => item.description).filter(Boolean).join(', ') || 'Sin detalle';
    const description = [receipt.customer_name || 'Cliente no informado', dashboardReceiptHistoryDate(receipt), detail].join(' · ');
    return `<button class="dashboard-receipt-match" type="button" data-receipt-match-id="${escapeHtml(receipt.id)}">
      <span class="dashboard-receipt-match__main"><strong>${escapeHtml(dashboardReceiptReference(receipt.receipt_number))}</strong><span>${escapeHtml(description)}</span></span>
      <span class="dashboard-receipt-match__amount">${escapeHtml(dashboardReceiptFormatMoney(receipt.total_amount))}</span>
    </button>`;
  }).join('');
  openModal(`${matches.length} boletas encontradas`, `<div class="dashboard-receipt-match-list">${rows}</div>`, null, null, true);
  document.querySelectorAll('[data-receipt-match-id]').forEach(button => {
    button.addEventListener('click', () => {
      const receipt = dashboardReceiptHistory.find(item => item.id === button.dataset.receiptMatchId);
      if (receipt) dashboardReceiptViewRecord(receipt);
    });
  });
}

function dashboardReceiptSearchHistory() {
  const input = document.getElementById('dashboard-receipt-search');
  if (!input) return;
  const value = input.value.trim();
  if (!value) {
    showToast('Escribe un folio o algún dato de la boleta', 'warning');
    input.focus();
    return;
  }
  if (dashboardReceiptHistoryLoading) {
    showToast('Las boletas todavía se están cargando', 'info');
    return;
  }
  if (dashboardReceiptHistoryError) {
    showToast(dashboardReceiptHistoryError, 'error');
    dashboardReceiptLoadHistory();
    return;
  }
  const matches = dashboardReceiptFindMatches(value);
  if (!matches.length) {
    showToast('No se encontró ninguna boleta', 'warning');
    return;
  }
  if (matches.length === 1) dashboardReceiptViewRecord(matches[0]);
  else dashboardReceiptOpenMatchSelector(matches);
}

function dashboardReceiptItems() {
  const container = document.getElementById('dashboard-receipt-items');
  if (!container) return [];
  return [...container.querySelectorAll('.dashboard-receipt-item-row')].map(row => {
    const description = row.querySelector('.dashboard-receipt-item-description').value.trim();
    const quantity = Math.max(0, dashboardReceiptNumber(row.querySelector('.dashboard-receipt-item-quantity')));
    const price = Math.max(0, dashboardReceiptNumber(row.querySelector('.dashboard-receipt-item-price')));
    const discount = Math.min(100, Math.max(0, dashboardReceiptNumber(row.querySelector('.dashboard-receipt-item-discount'))));
    const total = Math.round(quantity * price * (1 - discount / 100));
    row.querySelector('.dashboard-receipt-item-total').textContent = dashboardReceiptFormatMoney(total);
    return { description, quantity, price, discount, total };
  });
}

function dashboardReceiptAmounts(items = dashboardReceiptItems()) {
  const total = items.reduce((sum, item) => sum + item.total, 0);
  const fields = dashboardReceiptFields();
  const taxMode = fields.type.value === 'BOLETA EXENTA O NO AFECTA A IVA' ? 'exempt' : 'included';
  const net = taxMode === 'included' ? Math.round(total / 1.19) : total;
  const tax = taxMode === 'included' ? total - net : 0;
  return { taxMode, net, tax, total };
}

function dashboardReceiptSnapshot() {
  const fields = dashboardReceiptFields();
  const items = dashboardReceiptItems().filter(item => item.description || item.price || item.total);
  const { taxMode, net, tax, total } = dashboardReceiptAmounts(items);
  const cash = fields.payment.value === 'Efectivo';
  const received = cash ? Math.round(dashboardReceiptNumber(fields.received)) : null;
  const issuedDate = new Date(fields.date.value);
  return {
    document_type: fields.type.value,
    issued_at: Number.isNaN(issuedDate.getTime()) ? new Date().toISOString() : issuedDate.toISOString(),
    customer_name: fields.customerName.value.trim() || null,
    customer_rut: fields.customerRut.value.trim() || null,
    customer_contact: fields.customerContact.value.trim() || null,
    items,
    tax_mode: taxMode,
    net_amount: net,
    tax_amount: tax,
    total_amount: total,
    payment_method: fields.payment.value,
    amount_received: received,
    change_amount: cash ? Math.max(0, received - total) : null,
    note: fields.note.value.trim() || null,
    footer_note: fields.footer.value.trim() || null,
    paper_width: 58
  };
}

function dashboardReceiptFingerprint(snapshot = dashboardReceiptSnapshot()) {
  return JSON.stringify(snapshot);
}

function dashboardReceiptSetText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function dashboardReceiptRenderItems(items) {
  const container = document.getElementById('dashboard-preview-items');
  if (!container) return;
  container.replaceChildren();
  const printable = items.filter(item => item.description || item.price || item.total);
  if (!printable.length) {
    const empty = document.createElement('div');
    empty.className = 'dashboard-thermal-receipt__line';
    empty.style.textAlign = 'center';
    empty.textContent = 'Sin servicios añadidos';
    container.append(empty);
    return;
  }
  printable.forEach(item => {
    const line = document.createElement('div');
    line.className = 'dashboard-thermal-receipt__line';
    const main = document.createElement('div');
    main.className = 'dashboard-thermal-receipt__line-main';
    const description = document.createElement('span');
    description.textContent = item.description || 'Servicio';
    const total = document.createElement('span');
    total.textContent = dashboardReceiptFormatMoney(item.total);
    main.append(description, total);
    const detail = document.createElement('div');
    detail.className = 'dashboard-thermal-receipt__line-detail';
    const quantity = Number.isInteger(item.quantity)
      ? item.quantity
      : item.quantity.toLocaleString('es-CL', { maximumFractionDigits: 2 });
    const unit = document.createElement('span');
    unit.textContent = `${quantity} × ${dashboardReceiptFormatMoney(item.price)}`;
    const discount = document.createElement('span');
    discount.textContent = item.discount ? `Desc. ${item.discount.toLocaleString('es-CL', { maximumFractionDigits: 2 })}%` : '';
    detail.append(unit, discount);
    line.append(main, detail);
    container.append(line);
  });
}

function dashboardReceiptRender() {
  const fields = dashboardReceiptFields();
  if (!fields.type) return;
  const items = dashboardReceiptItems();
  const { taxMode, net, tax, total } = dashboardReceiptAmounts(items);
  dashboardReceiptSetText('dashboard-preview-title', fields.type.value);
  dashboardReceiptSetText('dashboard-preview-number', fields.number.value || 'SIN GUARDAR');
  dashboardReceiptSetText('dashboard-preview-date', dashboardReceiptDateLabel(fields.date.value));

  const customerSection = document.getElementById('dashboard-preview-customer');
  const customerName = fields.customerName.value.trim();
  const customerRut = fields.customerRut.value.trim();
  const customerContact = fields.customerContact.value.trim();
  customerSection.hidden = !(customerName || customerRut || customerContact);
  dashboardReceiptSetText('dashboard-preview-customer-name', customerName);
  dashboardReceiptSetText('dashboard-preview-customer-rut', customerRut ? `RUT: ${customerRut}` : '');
  dashboardReceiptSetText('dashboard-preview-customer-contact', customerContact);

  dashboardReceiptRenderItems(items);
  dashboardReceiptSetText('dashboard-preview-net', dashboardReceiptFormatMoney(net));
  dashboardReceiptSetText('dashboard-preview-tax', dashboardReceiptFormatMoney(tax));
  dashboardReceiptSetText('dashboard-preview-total', dashboardReceiptFormatMoney(total));
  dashboardReceiptSetText('dashboard-preview-payment', fields.payment.value);
  const taxRow = document.getElementById('dashboard-preview-tax-row');
  taxRow.hidden = taxMode === 'exempt';

  const cash = fields.payment.value === 'Efectivo';
  document.getElementById('dashboard-receipt-received-wrap').hidden = !cash;
  document.getElementById('dashboard-preview-received-row').hidden = !cash;
  document.getElementById('dashboard-preview-change-row').hidden = !cash;
  const received = dashboardReceiptNumber(fields.received);
  dashboardReceiptSetText('dashboard-preview-received', dashboardReceiptFormatMoney(received));
  dashboardReceiptSetText('dashboard-preview-change', dashboardReceiptFormatMoney(Math.max(0, received - total)));

  const note = fields.note.value.trim();
  document.getElementById('dashboard-preview-note-wrap').hidden = !note;
  dashboardReceiptSetText('dashboard-preview-note', note);
  dashboardReceiptSetText('dashboard-preview-footer', fields.footer.value.trim() || 'Gracias por preferir Equipo Solven Labs.');
}

function dashboardReceiptUpdateStatus() {
  const fields = dashboardReceiptFields();
  const status = document.getElementById('dashboard-receipt-status');
  const button = document.getElementById('dashboard-receipt-print');
  if (!fields.number || !status || !button) return;
  const canManageReceipts = isButtonAllowed('dashboard-receipt-print');
  status.classList.toggle('is-readonly', !canManageReceipts);
  if (!canManageReceipts) {
    status.classList.remove('is-dirty', 'is-saved');
    status.textContent = 'Solo lectura';
    return;
  }
  const matches = dashboardReceiptSaved
    && dashboardReceiptSaved.fingerprint === dashboardReceiptFingerprint();
  status.classList.toggle('is-saved', Boolean(matches));
  status.classList.toggle('is-dirty', !matches);
  status.textContent = matches
    ? `Guardada · ${dashboardReceiptSaved.reference}`
    : dashboardReceiptSaved
      ? 'Cambios sin guardar'
      : 'Sin guardar';
  fields.number.value = matches ? dashboardReceiptSaved.reference : '';
  if (!dashboardReceiptSaving) {
    button.querySelector('span').textContent = matches
      ? 'Reimprimir boleta'
      : dashboardReceiptSaved
        ? 'Guardar nueva e imprimir'
        : 'Guardar e imprimir';
  }
}

function dashboardReceiptHandleChange() {
  dashboardReceiptUpdateStatus();
  dashboardReceiptRender();
}

function dashboardReceiptApplyAccess() {
  const editor = document.querySelector('.dashboard-receipt-editor');
  if (!editor) return;
  const canManageReceipts = isButtonAllowed('dashboard-receipt-print');

  editor.classList.toggle('dashboard-receipt-editor--readonly', !canManageReceipts);
  editor.querySelectorAll('input, textarea').forEach(field => {
    field.readOnly = !canManageReceipts || field.id === 'dashboard-receipt-number';
    field.setAttribute('aria-readonly', field.readOnly ? 'true' : 'false');
  });
  editor.querySelectorAll('select').forEach(field => {
    field.disabled = !canManageReceipts;
  });
  editor.querySelectorAll('.dashboard-receipt-item-remove').forEach(button => {
    button.style.display = canManageReceipts ? '' : 'none';
    button.disabled = !canManageReceipts;
  });
  dashboardReceiptUpdateStatus();
}

function dashboardReceiptAddItem(initial = {}) {
  const container = document.getElementById('dashboard-receipt-items');
  const template = document.getElementById('dashboard-receipt-row-template');
  if (!container || !template) return null;
  const row = template.content.firstElementChild.cloneNode(true);
  row.querySelector('.dashboard-receipt-item-description').value = initial.description || '';
  row.querySelector('.dashboard-receipt-item-quantity').value = initial.quantity ?? 1;
  row.querySelector('.dashboard-receipt-item-price').value = initial.price ?? '';
  row.querySelector('.dashboard-receipt-item-discount').value = initial.discount ?? 0;
  row.addEventListener('input', dashboardReceiptHandleChange);
  row.querySelector('.dashboard-receipt-item-remove').addEventListener('click', () => {
    if (!isButtonAllowed('dashboard-receipt-print')) return showToast('No tienes permiso para modificar boletas', 'warning');
    const rows = container.querySelectorAll('.dashboard-receipt-item-row');
    if (rows.length === 1) {
      row.querySelector('.dashboard-receipt-item-description').value = '';
      row.querySelector('.dashboard-receipt-item-quantity').value = 1;
      row.querySelector('.dashboard-receipt-item-price').value = '';
      row.querySelector('.dashboard-receipt-item-discount').value = 0;
    } else {
      row.remove();
    }
    dashboardReceiptHandleChange();
  });
  container.append(row);
  dashboardReceiptApplyAccess();
  dashboardReceiptRender();
  if (typeof lucide !== 'undefined') lucide.createIcons();
  return row;
}

function dashboardReceiptReset(confirmReset = true) {
  if (confirmReset && !isButtonAllowed('dashboard-receipt-print')) return showToast('No tienes permiso para modificar boletas', 'warning');
  if (confirmReset && !window.confirm('Se borrarán los datos ingresados. ¿Deseas continuar?')) return;
  const fields = dashboardReceiptFields();
  const now = new Date();
  dashboardReceiptSaved = null;
  fields.type.value = 'BOLETA AFECTA A IVA';
  fields.number.value = '';
  fields.date.value = dashboardReceiptLocalDate(now);
  fields.customerName.value = '';
  fields.customerRut.value = '';
  fields.customerContact.value = '';
  fields.payment.value = 'Efectivo';
  fields.received.value = '';
  fields.note.value = '';
  fields.footer.value = 'Gracias por preferir Equipo Solven Labs.';
  document.getElementById('dashboard-receipt-items').replaceChildren();
  dashboardReceiptAddItem();
  const message = document.getElementById('dashboard-receipt-message');
  message.hidden = true;
  message.textContent = '';
  dashboardReceiptHandleChange();
  dashboardReceiptApplyAccess();
}

function dashboardReceiptValidate() {
  const valid = dashboardReceiptItems().filter(item => item.description && item.quantity > 0);
  const message = document.getElementById('dashboard-receipt-message');
  if (!valid.length) {
    message.textContent = 'Añade al menos un servicio con detalle y cantidad.';
    message.hidden = false;
    document.querySelector('.dashboard-receipt-item-description')?.focus();
    return false;
  }
  message.hidden = true;
  message.textContent = '';
  return true;
}

async function dashboardReceiptSaveIfNeeded() {
  const snapshot = dashboardReceiptSnapshot();
  const fingerprint = dashboardReceiptFingerprint(snapshot);
  if (dashboardReceiptSaved?.fingerprint === fingerprint) return dashboardReceiptSaved;
  const session = await getSession();
  if (!session?.user) throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.');
  const { data, error } = await supabase
    .from('thermal_receipts')
    .insert({ ...snapshot, created_by: session.user.id })
    .select('id, receipt_number, created_at')
    .single();
  if (error) throw error;
  const reference = dashboardReceiptReference(data.receipt_number);
  dashboardReceiptSaved = { ...data, reference, fingerprint };
  dashboardReceiptFields().number.value = reference;
  dashboardReceiptUpdateStatus();
  dashboardReceiptRender();
  return dashboardReceiptSaved;
}

function dashboardReceiptRecordItems(receipt) {
  return Array.isArray(receipt?.items) ? receipt.items : [];
}

function dashboardReceiptRecordMarkup(receipt) {
  const items = dashboardReceiptRecordItems(receipt);
  const customer = [
    receipt.customer_name ? `<span>${escapeHtml(receipt.customer_name)}</span>` : '',
    receipt.customer_rut ? `<span>RUT: ${escapeHtml(receipt.customer_rut)}</span>` : '',
    receipt.customer_contact ? `<span>${escapeHtml(receipt.customer_contact)}</span>` : ''
  ].filter(Boolean).join('');
  const itemLines = items.length ? items.map(item => {
    const quantity = Number(item.quantity) || 0;
    const discount = Number(item.discount) || 0;
    return `<div class="dashboard-thermal-receipt__line">
      <div class="dashboard-thermal-receipt__line-main"><span>${escapeHtml(item.description || 'Sin detalle')}</span><span>${escapeHtml(dashboardReceiptFormatMoney(item.total))}</span></div>
      <div class="dashboard-thermal-receipt__line-detail"><span>${escapeHtml(quantity.toLocaleString('es-CL', { maximumFractionDigits: 2 }))} × ${escapeHtml(dashboardReceiptFormatMoney(item.price))}</span><span>${discount ? `Desc. ${escapeHtml(discount.toLocaleString('es-CL', { maximumFractionDigits: 2 }))}%` : ''}</span></div>
    </div>`;
  }).join('') : '<div class="dashboard-thermal-receipt__line" style="text-align:center">Sin servicios añadidos</div>';
  const cash = receipt.payment_method === 'Efectivo';
  const exempt = receipt.tax_mode === 'exempt';
  return `<article class="dashboard-thermal-receipt">
    <header class="dashboard-thermal-receipt__header">
      <img src="/assets/logo%20extended%20chopped.png" alt="Logo Solven Labs">
      <strong>SERVICIOS INFORMÁTICOS YEVENES &amp; CIA LTDA</strong>
      <span>RUT 78.352.809-6</span>
      <span>Actividades de consultoría informática y de gestión de instalaciones informática</span>
      <span>Colo-Colo 379 Of. 706, Concepción</span>
      <span>+56 9 7702 9753 · tomas@solvenlabs.cl</span>
    </header>
    <div class="dashboard-thermal-receipt__rule"></div>
    <section class="dashboard-thermal-receipt__meta">
      <strong>${escapeHtml(receipt.document_type || 'BOLETA')}</strong>
      <div><span>N.º / REF.</span><b>${escapeHtml(dashboardReceiptReference(receipt.receipt_number))}</b></div>
      <div><span>FECHA</span><b>${escapeHtml(dashboardReceiptHistoryDate(receipt))}</b></div>
    </section>
    ${customer ? `<section class="dashboard-thermal-receipt__customer"><div class="dashboard-thermal-receipt__rule"></div><strong>CLIENTE</strong>${customer}</section>` : ''}
    <div class="dashboard-thermal-receipt__rule"></div>
    <section><div class="dashboard-thermal-receipt__items-head"><span>DETALLE</span><span>TOTAL</span></div>${itemLines}</section>
    <div class="dashboard-thermal-receipt__rule"></div>
    <section class="dashboard-thermal-receipt__totals">
      <div><span>NETO</span><b>${escapeHtml(dashboardReceiptFormatMoney(receipt.net_amount))}</b></div>
      ${exempt ? '' : `<div><span>IVA 19% INCL.</span><b>${escapeHtml(dashboardReceiptFormatMoney(receipt.tax_amount))}</b></div>`}
      <div class="dashboard-thermal-receipt__grand-total"><span>TOTAL</span><b>${escapeHtml(dashboardReceiptFormatMoney(receipt.total_amount))}</b></div>
      <div><span>FORMA DE PAGO</span><b>${escapeHtml(receipt.payment_method || '—')}</b></div>
      ${cash ? `<div><span>RECIBIDO</span><b>${escapeHtml(dashboardReceiptFormatMoney(receipt.amount_received))}</b></div><div><span>VUELTO</span><b>${escapeHtml(dashboardReceiptFormatMoney(receipt.change_amount))}</b></div>` : ''}
    </section>
    ${receipt.note ? `<section><div class="dashboard-thermal-receipt__rule"></div><p>${escapeHtml(receipt.note)}</p></section>` : ''}
    <footer class="dashboard-thermal-receipt__footer">
      <div class="dashboard-thermal-receipt__rule"></div>
      <strong>${escapeHtml(receipt.footer_note || 'Gracias por preferir Equipo Solven Labs.')}</strong>
      <span>www.solvenlabs.cl</span>
      <small>Comprobante interno no válido como documento tributario electrónico.</small>
    </footer>
  </article>`;
}

function dashboardReceiptPrintRecord(receipt) {
  if (!receipt) return;
  const printWindow = window.open('', '_blank', 'width=420,height=720');
  if (!printWindow) {
    showToast('El navegador bloqueó la ventana de impresión.', 'warning');
    return;
  }
  const reference = dashboardReceiptReference(receipt.receipt_number);
  printWindow.document.open();
  printWindow.document.write(`<!doctype html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Boleta ${escapeHtml(reference)}</title><style>
    @page{size:58mm auto;margin:0}*{box-sizing:border-box}html,body{width:58mm;min-width:0;margin:0;padding:0;background:#fff}.dashboard-thermal-receipt{width:58mm;padding:3mm;color:#000;background:#fff;font-family:"Courier New",Courier,monospace;font-size:9px;line-height:1.32;overflow-wrap:anywhere}.dashboard-thermal-receipt__header,.dashboard-thermal-receipt__footer,.dashboard-thermal-receipt__customer{display:flex;align-items:center;flex-direction:column;text-align:center}.dashboard-thermal-receipt__header img{display:block;width:38mm;max-width:82%;height:auto;margin:0 auto 1.5mm;object-fit:contain;filter:grayscale(1) contrast(1.7)}.dashboard-thermal-receipt__header strong{font-size:9px}.dashboard-thermal-receipt__header span{display:block;margin-top:1px}.dashboard-thermal-receipt__rule{width:100%;margin:2.5mm 0;border-top:1px dashed #000}.dashboard-thermal-receipt__meta>strong{display:block;margin-bottom:2mm;font-size:11px;text-align:center}.dashboard-thermal-receipt__meta div,.dashboard-thermal-receipt__totals>div{display:flex;justify-content:space-between;gap:2mm;margin-top:.8mm}.dashboard-thermal-receipt__meta b,.dashboard-thermal-receipt__totals b{text-align:right}.dashboard-thermal-receipt__customer strong{margin-bottom:1mm}.dashboard-thermal-receipt__items-head{display:grid;grid-template-columns:1fr auto;gap:2mm;margin-bottom:1.5mm;font-weight:700}.dashboard-thermal-receipt__line{margin:0 0 2mm}.dashboard-thermal-receipt__line-main{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:2mm;font-weight:700}.dashboard-thermal-receipt__line-detail{display:flex;justify-content:space-between;gap:2mm;color:#222;font-size:8px}.dashboard-thermal-receipt__grand-total{align-items:baseline;margin:2mm 0!important;padding:1.5mm 0;border-top:1px solid #000;border-bottom:1px solid #000;font-size:13px}p{margin:0;white-space:pre-wrap}.dashboard-thermal-receipt__footer strong{white-space:pre-wrap}.dashboard-thermal-receipt__footer span{margin-top:1mm}.dashboard-thermal-receipt__footer small{display:block;margin-top:2.5mm;font-size:7px;line-height:1.3}
  </style></head><body>${dashboardReceiptRecordMarkup(receipt)}<script>window.addEventListener('load',()=>setTimeout(()=>window.print(),120));<\/script></body></html>`);
  printWindow.document.close();
}

function dashboardReceiptViewRecord(receipt) {
  if (!receipt) return;
  const items = dashboardReceiptRecordItems(receipt);
  const rows = items.map(item => `<tr><td>${escapeHtml(item.description || 'Sin detalle')}</td><td>${escapeHtml((Number(item.quantity) || 0).toLocaleString('es-CL', { maximumFractionDigits: 2 }))}</td><td>${escapeHtml(dashboardReceiptFormatMoney(item.price))}</td><td>${escapeHtml(Number(item.discount) ? `${Number(item.discount).toLocaleString('es-CL', { maximumFractionDigits: 2 })}%` : '—')}</td><td><strong>${escapeHtml(dashboardReceiptFormatMoney(item.total))}</strong></td></tr>`).join('');
  const reference = dashboardReceiptReference(receipt.receipt_number);
  openModal(`Boleta ${reference}`, `<div class="dashboard-receipt-detail">
    <div class="dashboard-receipt-detail__summary">
      <div class="dashboard-receipt-detail__cell"><span>Fecha de emisión</span><strong>${escapeHtml(dashboardReceiptHistoryDate(receipt))}</strong></div>
      <div class="dashboard-receipt-detail__cell"><span>Cliente</span><strong>${escapeHtml(receipt.customer_name || 'No informado')}</strong></div>
      <div class="dashboard-receipt-detail__cell"><span>RUT</span><strong>${escapeHtml(receipt.customer_rut || 'No informado')}</strong></div>
      <div class="dashboard-receipt-detail__cell"><span>Contacto</span><strong>${escapeHtml(receipt.customer_contact || 'No informado')}</strong></div>
      <div class="dashboard-receipt-detail__cell"><span>Tipo</span><strong>${escapeHtml(receipt.document_type || '—')}</strong></div>
      <div class="dashboard-receipt-detail__cell"><span>Medio de pago</span><strong>${escapeHtml(receipt.payment_method || '—')}</strong></div>
    </div>
    <div class="table-wrapper"><table class="dashboard-receipt-detail__items"><thead><tr><th>Detalle</th><th>Cant.</th><th>Precio</th><th>Desc.</th><th>Total</th></tr></thead><tbody>${rows || '<tr><td colspan="5">Sin líneas</td></tr>'}</tbody></table></div>
    ${receipt.note ? `<div class="dashboard-receipt-detail__cell"><span>Nota</span><strong>${escapeHtml(receipt.note)}</strong></div>` : ''}
    <div class="dashboard-receipt-detail__total"><span>Total</span><strong>${escapeHtml(dashboardReceiptFormatMoney(receipt.total_amount))}</strong></div>
    ${isButtonAllowed('dashboard-receipt-print') ? `<div class="dashboard-receipt-detail__actions"><button class="btn-dash btn-dash--danger btn-dash--sm" id="dashboard-receipt-delete" type="button"><i data-lucide="trash-2"></i> Eliminar boleta</button></div>` : ''}
  </div>`, 'Reimprimir', () => dashboardReceiptPrintRecord(receipt), !isButtonAllowed('dashboard-receipt-print'));
  document.getElementById('dashboard-receipt-delete')?.addEventListener('click', () => dashboardReceiptConfirmDelete(receipt));
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function dashboardReceiptConfirmDelete(receipt) {
  if (!isButtonAllowed('dashboard-receipt-print')) return showToast('No tienes permiso para gestionar boletas', 'warning');
  if (!receipt) return;
  const reference = dashboardReceiptReference(receipt.receipt_number);
  openModal(`Eliminar boleta ${reference}`, `<p>Se eliminará permanentemente la boleta de <strong>${escapeHtml(receipt.customer_name || 'cliente no informado')}</strong> por <strong>${escapeHtml(dashboardReceiptFormatMoney(receipt.total_amount))}</strong>.</p><p style="margin-top:10px;color:var(--dash-danger);">Esta acción no se puede deshacer.</p>`, 'Eliminar definitivamente', async () => {
    const button = document.getElementById('modal-confirm');
    if (button) {
      button.disabled = true;
      button.textContent = 'Eliminando…';
    }
    const { error } = await supabase.from('thermal_receipts').delete().eq('id', receipt.id);
    if (error) {
      if (button) {
        button.disabled = false;
        button.textContent = 'Eliminar definitivamente';
      }
      showToast(`No se pudo eliminar: ${error.message}`, 'error');
      return;
    }
    dashboardReceiptHistory = dashboardReceiptHistory.filter(item => item.id !== receipt.id);
    if (dashboardReceiptSaved?.id === receipt.id) {
      dashboardReceiptSaved = null;
      dashboardReceiptUpdateStatus();
      dashboardReceiptRender();
    }
    const search = document.getElementById('dashboard-receipt-search');
    if (search) search.value = '';
    closeModal();
    showToast(`Boleta ${reference} eliminada`, 'success');
  });
}

function dashboardReceiptOpenPrintWindow(printWindow) {
  const receipt = document.getElementById('dashboard-receipt-preview');
  if (!printWindow || !receipt) return false;
  const markup = receipt.outerHTML;
  printWindow.document.open();
  printWindow.document.write(`<!doctype html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Boleta ${escapeHtml(dashboardReceiptSaved?.reference || '')}</title><style>
    @page{size:58mm auto;margin:0}*{box-sizing:border-box}html,body{width:58mm;min-width:0;margin:0;padding:0;background:#fff} [hidden]{display:none!important}
    .dashboard-thermal-receipt{width:58mm;min-height:0;padding:3mm;color:#000;background:#fff;font-family:"Courier New",Courier,monospace;font-size:9px;line-height:1.32;overflow-wrap:anywhere}
    .dashboard-thermal-receipt__header{display:flex;align-items:center;flex-direction:column;text-align:center}.dashboard-thermal-receipt__header img{display:block;width:38mm;max-width:82%;height:auto;margin:0 auto 1.5mm;object-fit:contain;filter:grayscale(1) contrast(1.7)}.dashboard-thermal-receipt__header strong{font-size:9px}.dashboard-thermal-receipt__header span{display:block;margin-top:1px}
    .dashboard-thermal-receipt__rule{margin:2.5mm 0;border-top:1px dashed #000}.dashboard-thermal-receipt__meta>strong{display:block;margin-bottom:2mm;font-size:11px;text-align:center}.dashboard-thermal-receipt__meta div,.dashboard-thermal-receipt__totals>div{display:flex;justify-content:space-between;gap:2mm;margin-top:.8mm}.dashboard-thermal-receipt__meta b,.dashboard-thermal-receipt__totals b{text-align:right}
    #dashboard-preview-customer{display:flex;flex-direction:column}#dashboard-preview-customer strong{margin-bottom:1mm}.dashboard-thermal-receipt__items-head{display:grid;grid-template-columns:1fr auto;gap:2mm;margin-bottom:1.5mm;font-weight:700}.dashboard-thermal-receipt__line{margin:0 0 2mm}.dashboard-thermal-receipt__line-main{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:2mm;font-weight:700}.dashboard-thermal-receipt__line-detail{display:flex;justify-content:space-between;gap:2mm;color:#222;font-size:8px}.dashboard-thermal-receipt__grand-total{align-items:baseline;margin:2mm 0!important;padding:1.5mm 0;border-top:1px solid #000;border-bottom:1px solid #000;font-size:13px}#dashboard-preview-note{margin:0;white-space:pre-wrap}.dashboard-thermal-receipt__footer{display:flex;align-items:center;flex-direction:column;text-align:center}.dashboard-thermal-receipt__footer strong{white-space:pre-wrap}.dashboard-thermal-receipt__footer span{margin-top:1mm}.dashboard-thermal-receipt__footer small{display:block;margin-top:2.5mm;font-size:7px;line-height:1.3}
  </style></head><body>${markup}<script>window.addEventListener('load',()=>setTimeout(()=>window.print(),120));<\/script></body></html>`);
  printWindow.document.close();
  return true;
}

async function dashboardReceiptSaveAndPrint() {
  if (!isButtonAllowed('dashboard-receipt-print')) return showToast('No tienes permiso para emitir boletas', 'warning');
  if (dashboardReceiptSaving || !dashboardReceiptValidate()) return;
  const printWindow = window.open('', '_blank', 'width=420,height=720');
  if (printWindow) {
    printWindow.document.write('<!doctype html><title>Preparando boleta</title><p style="font-family:sans-serif;padding:24px">Preparando boleta…</p>');
  }
  const button = document.getElementById('dashboard-receipt-print');
  const message = document.getElementById('dashboard-receipt-message');
  dashboardReceiptSaving = true;
  button.disabled = true;
  button.querySelector('span').textContent = 'Guardando…';
  try {
    await dashboardReceiptSaveIfNeeded();
    if (!dashboardReceiptOpenPrintWindow(printWindow)) {
      showToast('La boleta quedó guardada, pero el navegador bloqueó la ventana de impresión.', 'warning');
    } else {
      showToast(`Boleta ${dashboardReceiptSaved.reference} guardada`, 'success');
    }
    dashboardReceiptLoadHistory();
  } catch (error) {
    if (printWindow) printWindow.close();
    console.error('No se pudo guardar la boleta:', error);
    const missingTable = error?.code === '42P01' || error?.code === 'PGRST205';
    message.textContent = missingTable
      ? 'Falta crear la tabla de boletas en Supabase.'
      : `No se pudo guardar: ${error?.message || 'error de conexión'}`;
    message.hidden = false;
    showToast(message.textContent, 'error');
  } finally {
    dashboardReceiptSaving = false;
    button.disabled = false;
    dashboardReceiptUpdateStatus();
  }
}

function initDashboardReceipts() {
  if (dashboardReceiptInitialized) {
    dashboardReceiptHandleChange();
    return;
  }
  const fields = dashboardReceiptFields();
  if (!fields.type) return;
  dashboardReceiptInitialized = true;
  Object.values(fields).forEach(field => {
    field.addEventListener('input', dashboardReceiptHandleChange);
    field.addEventListener('change', dashboardReceiptHandleChange);
  });
  document.getElementById('dashboard-receipt-add-item').addEventListener('click', () => {
    if (!isButtonAllowed('dashboard-receipt-print')) return showToast('No tienes permiso para modificar boletas', 'warning');
    const row = dashboardReceiptAddItem();
    row?.querySelector('.dashboard-receipt-item-description')?.focus();
  });
  document.getElementById('dashboard-receipt-reset').addEventListener('click', () => dashboardReceiptReset(true));
  document.getElementById('dashboard-receipt-print').addEventListener('click', dashboardReceiptSaveAndPrint);
  document.getElementById('dashboard-receipt-search-form')?.addEventListener('submit', event => {
    event.preventDefault();
    dashboardReceiptSearchHistory();
  });
  dashboardReceiptReset(false);
  dashboardReceiptApplyAccess();
  dashboardReceiptLoadHistory();
}

// ==========================================================================
// Solven Labs MAIL
// ==========================================================================
const mailState = {
  messages: [],
  mailboxes: [],
  selectedId: null,
  query: '',
  initialized: false
};

function mailFormatDate(value, compact = false) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return 'Fecha desconocida';
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (compact && sameDay) return date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  if (compact) return date.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
  return date.toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' });
}

function mailSenderLabel(message) {
  return message.from_name || message.from_address || 'Remitente desconocido';
}

function mailListPartyLabel(message) {
  return message.direction === 'outgoing' ? (message.to_address || 'Destinatario desconocido') : mailSenderLabel(message);
}

function mailMessageDate(message) {
  return message.direction === 'outgoing' ? (message.sent_at || message.received_at) : message.received_at;
}

function mailInitials(message) {
  const value = mailListPartyLabel(message).trim();
  return value.split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase() || '?';
}

function mailPlainBody(message) {
  if (message.body_text?.trim()) return message.body_text.trim();
  if (!message.body_html) return 'Este correo no contiene cuerpo de texto.';
  const documentBody = new DOMParser().parseFromString(mailSanitizedHtml(message), 'text/html').body;
  return (documentBody?.textContent || '').replace(/\n{3,}/g, '\n\n').trim() || 'Este correo no contiene cuerpo de texto.';
}

function mailSanitizedHtml(message) {
  if (!message.body_html) return '';
  return DOMPurify.sanitize(message.body_html, {
    ALLOWED_TAGS: ['a', 'b', 'blockquote', 'br', 'code', 'div', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'li', 'ol', 'p', 'pre', 's', 'span', 'strong', 'table', 'tbody', 'td', 'th', 'thead', 'tr', 'u', 'ul'],
    ALLOWED_ATTR: ['colspan', 'href', 'rowspan', 'title'],
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false
  });
}

function mailThreads(messages = mailState.messages) {
  const pending = new Set(messages.map(message => message.id));
  const threads = [];
  for (const message of messages) {
    if (!pending.has(message.id)) continue;
    const thread = mailConversation(message, messages);
    thread.forEach(item => pending.delete(item.id));
    threads.push(thread);
  }
  return threads.sort((a, b) => {
    const aLatest = new Date(mailMessageDate(a[a.length - 1])).getTime() || 0;
    const bLatest = new Date(mailMessageDate(b[b.length - 1])).getTime() || 0;
    return bLatest - aLatest || a[0].id.localeCompare(b[0].id);
  });
}

function mailFilteredThreads() {
  const query = mailState.query.trim().toLocaleLowerCase('es-CL');
  const threads = mailThreads();
  if (!query) return threads;
  return threads.filter(thread => thread.some(message => [
    message.from_name,
    message.from_address,
    message.to_address,
    ...(message.to_addresses || []),
    ...(message.cc_addresses || []),
    message.subject,
    message.body_text
  ].some(value => String(value || '').toLocaleLowerCase('es-CL').includes(query))));
}

function renderMailList() {
  const list = document.getElementById('mail-list');
  const count = document.getElementById('mail-count');
  if (!list || !count) return;
  const threads = mailFilteredThreads();
  const unread = mailState.messages.filter(message => message.direction === 'incoming' && !message.is_read).length;
  count.textContent = `${threads.length} ${threads.length === 1 ? 'conversación' : 'conversaciones'}${unread ? ` · ${unread} sin leer` : ''}`;

  if (!threads.length) {
    const title = mailState.query ? 'Sin resultados' : 'Aún no hay conversaciones';
    const copy = mailState.query ? 'Prueba con otra búsqueda.' : 'Los correos enviados y recibidos aparecerán aquí agrupados por conversación.';
    list.innerHTML = `<div class="mail-state"><i data-lucide="${mailState.query ? 'search-x' : 'inbox'}"></i><strong>${title}</strong><p>${copy}</p></div>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  }

  list.innerHTML = threads.map(thread => {
    const first = thread[0];
    const latest = thread[thread.length - 1];
    const unreadThread = thread.some(message => message.direction === 'incoming' && !message.is_read);
    const activeThread = thread.some(message => message.id === mailState.selectedId);
    const preview = mailPlainBody(first).replace(/\s+/g, ' ').slice(0, 115);
    const messageCount = thread.length > 1 ? ` <span class="mail-item__thread-count">${thread.length}</span>` : '';
    return `<button class="mail-item${unreadThread ? ' is-unread' : ''}${activeThread ? ' is-active' : ''}" type="button" role="listitem" data-mail-id="${escapeHtml(first.id)}">
      <span class="mail-item__dot" aria-hidden="true"></span>
      <span class="mail-item__content">
        <span class="mail-item__top"><span class="mail-item__sender">${escapeHtml(mailListPartyLabel(first))}${messageCount}</span></span>
        <span class="mail-item__subject">${escapeHtml(first.subject || '(Sin asunto)')}</span>
        <span class="mail-item__preview">${escapeHtml(preview)}</span>
      </span>
      <time class="mail-item__date" datetime="${escapeHtml(mailMessageDate(latest) || '')}" title="Última actividad">${escapeHtml(mailFormatDate(mailMessageDate(latest), true))}</time>
    </button>`;
  }).join('');
}

function mailConversation(selected, messages = mailState.messages) {
  const identifiers = message => [message.message_id, message.in_reply_to,
    ...(Array.isArray(message.message_references) ? message.message_references : [])]
    .filter(value => typeof value === 'string' && value.trim()).map(value => value.trim());
  const related = new Set([selected.id]);
  const references = new Set(identifiers(selected));
  let changed;
  do {
    changed = false;
    for (const message of messages) {
      if (message.mailbox_id !== selected.mailbox_id || related.has(message.id)) continue;
      const ids = identifiers(message);
      if (!ids.some(id => references.has(id))) continue;
      related.add(message.id);
      ids.forEach(id => references.add(id));
      changed = true;
    }
  } while (changed);
  return messages.filter(message => related.has(message.id))
    .sort((a, b) => new Date(mailMessageDate(a)) - new Date(mailMessageDate(b)) || a.id.localeCompare(b.id));
}

function renderMailConversation(selected) {
  const container = document.getElementById('mail-conversation');
  if (!container) return;
  const conversation = mailConversation(selected);
  const messages = conversation.filter(message => message.id !== selected.id);
  if (!messages.length) {
    container.remove();
    return;
  }
  container.innerHTML = `<h3>Historial de conversación · ${conversation.length} ${conversation.length === 1 ? 'correo' : 'correos'}</h3>` + messages.map(message => {
    const outgoing = message.direction === 'outgoing';
    const status = outgoing ? (message.delivery_status === 'sent' ? 'Enviado' : message.delivery_status === 'failed' ? 'Falló el envío' : 'Procesando') : 'Recibido';
    return `<details class="mail-conversation__message">
      <summary><strong>${escapeHtml(status)} · ${escapeHtml(message.from_name || message.from_address || '')}</strong><time>${escapeHtml(mailFormatDate(mailMessageDate(message)))}</time></summary>
      <p>Para: ${escapeHtml((message.to_addresses || []).join(', ') || message.to_address || '')}</p>
      <div class="mail-message__body">${escapeHtml(mailPlainBody(message))}</div>
      <button type="button" class="btn-dash btn-dash--secondary btn-dash--sm" data-conversation-id="${escapeHtml(message.id)}">Abrir correo${outgoing ? '' : ' / responder'}</button>
    </details>`;
  }).join('');
  container.querySelectorAll('[data-conversation-id]').forEach(button => {
    button.addEventListener('click', () => selectMailMessage(button.dataset.conversationId));
  });
}

function renderMailDetail() {
  const detail = document.getElementById('mail-detail');
  if (!detail) return;
  const message = mailState.messages.find(item => item.id === mailState.selectedId);
  if (!message) {
    detail.innerHTML = '<div class="mail-detail__empty"><i data-lucide="mail-open"></i><h2>Selecciona un correo</h2><p>El contenido del mensaje aparecerá aquí.</p></div>';
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  }

  const hasHtmlBody = Boolean(message.body_html?.trim());
  const outgoing = message.direction === 'outgoing';
  const replyTo = !outgoing && message.reply_to_address
    ? `${message.reply_to_name ? `${message.reply_to_name} ` : ''}<${message.reply_to_address}>`
    : '';
  const sentTo = Array.isArray(message.to_addresses) && message.to_addresses.length
    ? message.to_addresses.join(', ')
    : (message.to_address || 'destinatario desconocido');
  const cc = Array.isArray(message.cc_addresses) ? message.cc_addresses.join(', ') : '';
  const bcc = outgoing && Array.isArray(message.bcc_addresses) ? message.bcc_addresses.join(', ') : '';
  detail.innerHTML = `<header class="mail-message__header">
      <h2 class="mail-message__subject">${escapeHtml(message.subject || '(Sin asunto)')}</h2>
      <div class="mail-message__meta">
        <span class="mail-message__avatar" aria-hidden="true">${escapeHtml(mailInitials(message))}</span>
        <span class="mail-message__addresses">
          <strong>${outgoing ? `Para: ${escapeHtml(sentTo)}` : `${escapeHtml(mailSenderLabel(message))}${message.from_name && message.from_address ? ` &lt;${escapeHtml(message.from_address)}&gt;` : ''}`}</strong>
          <span>${outgoing ? `Desde: ${escapeHtml(message.from_address || 'remitente desconocido')}` : `Para: ${escapeHtml(message.to_address || 'destinatario desconocido')}`}</span>
        </span>
        <time class="mail-message__date" datetime="${escapeHtml(mailMessageDate(message) || '')}">${escapeHtml(mailFormatDate(mailMessageDate(message)))}</time>
      </div>
      ${(replyTo || cc || bcc) ? `<div class="mail-message__facts">
        ${replyTo ? `<span><i data-lucide="reply"></i> Responder a: ${escapeHtml(replyTo)}</span>` : ''}
        ${cc ? `<span>CC: ${escapeHtml(cc)}</span>` : ''}
        ${bcc ? `<span>CCO: ${escapeHtml(bcc)}</span>` : ''}
      </div>` : ''}
    </header>
    <div class="mail-message__actions">
      ${outgoing ? `<span class="mail-delivery-status" data-status="${escapeHtml(message.delivery_status || '')}"><i data-lucide="${message.delivery_status === 'sent' ? 'circle-check' : message.delivery_status === 'failed' ? 'circle-alert' : 'clock-3'}"></i> ${message.delivery_status === 'sent' ? 'Enviado' : message.delivery_status === 'failed' ? 'Falló el envío' : 'Procesando'}</span>` : `<button class="btn-dash btn-dash--primary btn-dash--sm" id="mail-reply" type="button"><i data-lucide="reply"></i> Responder</button><button class="btn-dash btn-dash--secondary btn-dash--sm" id="mail-toggle-read" type="button"><i data-lucide="${message.is_read ? 'mail' : 'mail-open'}"></i> Marcar ${message.is_read ? 'no leído' : 'leído'}</button>`}
      <button class="btn-dash btn-dash--danger btn-dash--sm" id="mail-delete" type="button"><i data-lucide="trash-2"></i> Eliminar</button>
    </div>
    ${hasHtmlBody ? '<p class="mail-message__body--html-note">Vista de texto segura generada desde el HTML sanitizado.</p>' : ''}
    <div class="mail-message__body" id="mail-message-safe-body"></div>
    <section class="mail-conversation" id="mail-conversation" aria-label="Historial de conversación"></section>`;

  renderMailConversation(message);
  const safeBody = document.getElementById('mail-message-safe-body');
  if (safeBody) safeBody.textContent = mailPlainBody(message);

  document.getElementById('mail-reply')?.addEventListener('click', () => openMailComposer(message));
  document.getElementById('mail-toggle-read')?.addEventListener('click', () => toggleMailRead(message.id));
  document.getElementById('mail-delete')?.addEventListener('click', () => deleteMailMessage(message.id));
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

async function selectMailMessage(id) {
  const message = mailState.messages.find(item => item.id === id);
  if (!message) return;
  mailState.selectedId = id;
  renderMailList();
  renderMailDetail();
  if (message.direction === 'incoming' && !message.is_read) await toggleMailRead(id, true);
}

async function toggleMailRead(id, forceRead = null) {
  const message = mailState.messages.find(item => item.id === id);
  if (!message) return;
  const nextValue = typeof forceRead === 'boolean' ? forceRead : !message.is_read;
  const previous = { is_read: message.is_read, read_at: message.read_at };
  message.is_read = nextValue;
  message.read_at = nextValue ? new Date().toISOString() : null;
  renderMailList();
  renderMailDetail();
  const { error } = await db.mail.setRead(id, nextValue);
  if (error) {
    Object.assign(message, previous);
    renderMailList();
    renderMailDetail();
    showToast(mailApiErrorMessage(error), 'error');
    return;
  }
  updateSidebarBadges();
}

async function deleteMailMessage(id) {
  const message = mailState.messages.find(item => item.id === id);
  if (!message || !window.confirm(`¿Eliminar el correo “${message.subject || '(Sin asunto)'}”?`)) return;
  const { error } = await db.mail.delete(id);
  if (error) {
    showToast('No se pudo eliminar el correo', 'error');
    return;
  }
  mailState.messages = mailState.messages.filter(item => item.id !== id);
  mailState.selectedId = null;
  renderMailList();
  renderMailDetail();
  updateSidebarBadges();
  showToast('Correo eliminado', 'success');
}

function mailApiErrorMessage(code) {
  const messages = {
    attachment_expired: 'El adjunto venció y ya no está disponible para descargar.',
    attachment_unavailable: 'El contenido de este adjunto no está disponible.',
    invalid_session: 'Tu sesión expiró. Vuelve a iniciar sesión.',
    origin_not_allowed: 'El origen del dashboard no está autorizado en el Worker.',
    mail_access_denied: 'Tu rol no tiene acceso a la casilla compartida.',
    mailbox_not_available: 'La casilla compartida no está disponible.',
    invalid_recipient: 'Ingresa un destinatario válido.',
    too_many_recipients: 'Puedes incluir como máximo 50 destinatarios entre Para, CC y CCO.',
    duplicate_recipient: 'Una misma dirección no puede repetirse entre Para, CC y CCO.',
    invalid_subject: 'El asunto es obligatorio y admite hasta 300 caracteres.',
    invalid_body: 'El cuerpo es obligatorio y supera el límite permitido.',
    request_too_large: 'El mensaje y sus adjuntos superan el tamaño permitido.',
    send_rate_exceeded: 'Alcanzaste el límite temporal de envíos. Espera un minuto.',
    resend_auth_failed: 'Resend rechazó la API key. Revisa el Secret RESEND_API_KEY.',
    resend_permission_denied: 'Resend no autorizó ese remitente. Verifica solvenlabs.cl y los permisos de la API key.',
    resend_rejected: 'Resend rechazó el mensaje o alguno de sus destinatarios.',
    resend_rate_limited: 'Resend aplicó un límite temporal. Intenta nuevamente en unos minutos.',
    resend_unavailable: 'Resend no está disponible temporalmente.',
    resend_invalid_response: 'Resend respondió sin un identificador de envío válido.',
    supabase_secret_invalid: 'El Secret SUPABASE_SECRET_KEY del Worker no tiene permisos de servidor.',
    supabase_unavailable: 'El Worker no pudo comunicarse correctamente con Supabase.',
    mail_schema_outdated: 'Falta aplicar el SQL más reciente de Solven Labs Mail en Supabase.',
    mail_api_not_configured: 'Falta configurar la URL o los secretos del servicio de envío de Solven Labs Mail.',
    send_already_processed: 'Este envío ya está siendo procesado.',
    reply_message_not_found: 'El correo original ya no está disponible para responder.',
    message_not_found: 'El correo ya no está disponible.',
    mail_api_failed: 'No fue posible conectar con el Worker de Solven Labs Mail.'
  };
  return messages[code] || 'No se pudo enviar el correo.';
}

async function updateNtekMailReadState(messageId, isRead) {
  if (!mailReadEndpoint) return { error: 'mail_api_not_configured' };
  const session = await getSession();
  if (!session?.access_token) return { error: 'invalid_session' };
  try {
    const response = await fetch(mailReadEndpoint, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message_id: messageId, is_read: isRead })
    });
    const result = await response.json().catch(() => ({}));
    return response.ok
      ? { data: result.message }
      : { error: result.error || 'mail_api_failed', status: response.status };
  } catch (_) {
    return { error: 'mail_api_failed' };
  }
}

async function sendNtekMail(payload) {
  if (!mailSendEndpoint) {
    return { error: 'mail_api_not_configured' };
  }
  const session = await getSession();
  if (!session?.access_token) return { error: 'invalid_session' };
  try {
    const response = await fetch(mailSendEndpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));
    return response.ok ? { data: result } : { error: result.error || 'mail_api_failed', status: response.status };
  } catch (_) {
    return { error: 'mail_api_failed' };
  }
}

function parseMailRecipients(value) {
  return [...new Set(String(value || '').split(/[;,\n]/).map(item => item.trim().toLowerCase()).filter(Boolean))];
}

function openMailComposer(parent = null) {
  if (!mailState.mailboxes.length) {
    showToast('No tienes un buzón Solven Labs activo para enviar', 'warning');
    return;
  }
  const reply = Boolean(parent);
  const replyMailbox = reply ? mailState.mailboxes.find(mailbox => mailbox.id === parent.mailbox_id) : null;
  if (reply && !replyMailbox) {
    showToast('El buzón de este correo ya no está activo', 'error');
    return;
  }
  const mailboxes = replyMailbox ? [replyMailbox] : mailState.mailboxes;
  const recipient = reply ? (parent.reply_to_address || parent.from_address || '') : '';
  const originalSubject = String(parent?.subject || '').trim();
  const subject = reply && !/^re\s*:/i.test(originalSubject) ? `Re: ${originalSubject || '(Sin asunto)'}` : originalSubject;
  const mailboxOptions = mailboxes.map(mailbox => `<option value="${escapeHtml(mailbox.id)}">${escapeHtml(mailbox.display_name ? `${mailbox.display_name} <${mailbox.address}>` : mailbox.address)}</option>`).join('');
  const clientRequestId = crypto.randomUUID();

  openModal(reply ? 'Responder correo' : 'Redactar correo', `<form class="mail-compose-form" id="mail-compose-form">
    <label class="modal-form__group"><span class="modal-form__label">Enviar desde</span><select class="modal-form__select" id="mail-compose-mailbox" required>${mailboxOptions}</select></label>
    <label class="modal-form__group"><span class="modal-form__label">Para</span><input class="modal-form__input" id="mail-compose-to" type="text" inputmode="email" maxlength="4096" autocomplete="off" value="${escapeHtml(recipient)}" ${reply ? 'readonly' : ''} placeholder="correo@ejemplo.cl, otro@ejemplo.cl" required></label>
    <label class="modal-form__group"><span class="modal-form__label">CC <small>(opcional)</small></span><input class="modal-form__input" id="mail-compose-cc" type="text" inputmode="email" maxlength="4096" autocomplete="off" placeholder="copia@ejemplo.cl"></label>
    <label class="modal-form__group"><span class="modal-form__label">CCO <small>(opcional)</small></span><input class="modal-form__input" id="mail-compose-bcc" type="text" inputmode="email" maxlength="4096" autocomplete="off" placeholder="oculto@ejemplo.cl"></label>
    <label class="modal-form__group"><span class="modal-form__label">Asunto</span><input class="modal-form__input" id="mail-compose-subject" maxlength="300" value="${escapeHtml(subject)}" required></label>
    <label class="modal-form__group"><span class="modal-form__label">Mensaje</span><textarea class="modal-form__textarea" id="mail-compose-body" maxlength="102400" rows="10" required></textarea></label>
    <p class="mail-compose-hint">Separa múltiples direcciones con coma.</p>
  </form>`, reply ? 'Enviar respuesta' : 'Enviar correo', async () => {
    const form = document.getElementById('mail-compose-form');
    if (!form?.reportValidity()) return;
    const confirm = document.getElementById('modal-confirm');
    if (confirm) {
      confirm.disabled = true;
      confirm.textContent = 'Enviando…';
    }
    const result = await sendNtekMail({
      request_id: clientRequestId,
      mailbox_id: document.getElementById('mail-compose-mailbox')?.value || '',
      to: parseMailRecipients(document.getElementById('mail-compose-to')?.value),
      cc: parseMailRecipients(document.getElementById('mail-compose-cc')?.value),
      bcc: parseMailRecipients(document.getElementById('mail-compose-bcc')?.value),
      subject: document.getElementById('mail-compose-subject')?.value.trim() || '',
      body_text: document.getElementById('mail-compose-body')?.value.trim() || '',
      ...(reply ? { reply_to_message_id: parent.id } : {})
    });
    if (result.error) {
      showToast(mailApiErrorMessage(result.error), 'error');
      if (confirm) {
        confirm.disabled = false;
        confirm.textContent = reply ? 'Enviar respuesta' : 'Enviar correo';
      }
      return;
    }
    closeModal();
    showToast(reply ? 'Respuesta enviada' : 'Correo enviado', 'success');
    mailState.selectedId = result.data?.message_id || null;
    await loadMail({ preserveSelection: true });
  });
  window.setTimeout(() => document.getElementById(reply ? 'mail-compose-body' : 'mail-compose-to')?.focus(), 0);
}

function initMailPage() {
  if (mailState.initialized) return;
  mailState.initialized = true;
  document.getElementById('mail-list')?.addEventListener('click', event => {
    const item = event.target.closest('[data-mail-id]');
    if (item) selectMailMessage(item.dataset.mailId);
  });
  document.getElementById('mail-search')?.addEventListener('input', event => {
    mailState.query = event.target.value || '';
    renderMailList();
  });
  document.getElementById('mail-refresh')?.addEventListener('click', () => loadMail({ preserveSelection: true }));
  document.getElementById('mail-compose')?.addEventListener('click', () => openMailComposer());
}

async function loadMail({ preserveSelection = false } = {}) {
  initMailPage();
  const list = document.getElementById('mail-list');
  if (list && !preserveSelection) list.innerHTML = '<div class="mail-state"><span class="mail-state__spinner"></span><strong>Cargando bandeja…</strong></div>';
  const [{ data: messages, error }, { data: mailboxes, error: mailboxError }] = await Promise.all([
    db.mail.getAll(),
    db.mail.getMailboxes()
  ]);
  if (error || mailboxError) {
    const missingTable = [error, mailboxError].some(item => ['42P01', 'PGRST205'].includes(item?.code));
    if (list) list.innerHTML = `<div class="mail-state"><i data-lucide="triangle-alert"></i><strong>No se pudo abrir Mail</strong><p>${missingTable ? 'Aplica primero la migración SQL de Solven Labs Mail.' : 'Revisa la conexión e intenta nuevamente.'}</p></div>`;
    showToast('No se pudo cargar Solven Labs Mail', 'error');
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  }
  mailState.messages = messages || [];
  mailState.mailboxes = mailboxes || [];
  if (!preserveSelection || !mailState.messages.some(item => item.id === mailState.selectedId)) mailState.selectedId = null;
  const accountLabel = document.getElementById('mail-account-label');
  if (accountLabel) {
    accountLabel.textContent = mailState.mailboxes.length
      ? `Conversaciones enviadas y recibidas en ${mailState.mailboxes.map(item => item.address).join(', ')}.`
      : 'Aún no tienes una dirección Solven Labs asignada.';
  }
  renderMailList();
  renderMailDetail();
  updateSidebarBadges();
}
