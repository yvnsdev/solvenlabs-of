import { INTAKE_SECTIONS, INTAKE_TABLES, INTAKE_STATUSES, newIntake, normalizeIntake, validateIntake, formatIntakeDate, intakeFilename } from './requirement-intake-model.js?v=2';
import { buildIntakePDF } from './requirement-intake-pdf.js?v=2';

export function intakeErrorMessage(error) {
  if (['42P01', '42703', 'PGRST204', 'PGRST205'].includes(error?.code)) return 'Falta actualizar la base de datos de fichas. Aplica la migración de requirement_intakes en Supabase. Los datos ingresados se conservan.';
  if (error?.code === '42501') return 'Tu cuenta no tiene permiso para guardar fichas. Revisa el acceso a Requisitos de tu rol. Los datos ingresados se conservan.';
  if (error?.code === 'PGRST116') return 'Otra persona modificó esta ficha. Descarga tu PDF antes de actualizar la lista y revisar los cambios.';
  return 'No se pudo guardar la ficha. Revisa la conexión y vuelve a intentar. Los datos ingresados se conservan.';
}

export async function mountRequirements(root, { supabase, escapeHtml: esc, showToast, canWrite, getPdfAssets }) {
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
