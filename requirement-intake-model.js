export const INTAKE_STATUSES = ['En levantamiento', 'En revisión', 'Validada'];
export const INTAKE_SECTIONS = [
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
export const INTAKE_TABLES = {
  roles: { title: 'Matriz de roles y permisos', columns: [['role', 'Usuario / rol'], ['permissions', 'Participación y permisos esperados'], ['source', 'Origen']], help: 'Describe las responsabilidades de cada perfil y la fuente de esta definición.', add: 'Agregar rol' },
  features: { title: '4.2. Funcionalidades solicitadas', columns: [['name', 'Funcionalidad solicitada'], ['description', 'Descripción preliminar'], ['source', 'Origen']], help: 'Registra una capacidad por fila. Explica quién la necesita, qué debe permitir hacer y qué resultado se espera. En origen, identifica la reunión, documento o confirmación pendiente.', note: 'Las funcionalidades registradas son preliminares y estarán sujetas a análisis y posterior validación.', add: 'Agregar funcionalidad' },
  pending: { title: '6.2. Dudas o información pendiente', columns: [['question', 'Consulta o información pendiente'], ['owner', 'Responsable de responder']], help: 'Convierte cada duda en una consulta concreta y asigna a la persona que puede responderla.', add: 'Agregar pendiente' }
};
export function todayInChile(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const value = type => parts.find(part => part.type === type).value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}
export function newIntake(project = {}) {
  return { version: '1.0', status: INTAKE_STATUSES[0], meeting_date: todayInChile(), project_name: project.name || '', client_name: project.clients?.name || '', roles: [{ role: '', permissions: '', source: '' }], features: [{ name: '', description: '', source: '' }], pending: [{ question: '', owner: '' }] };
}
export function normalizeIntake(raw = {}) {
  const data = {};
  for (const key of ['version', 'status', ...INTAKE_SECTIONS.flatMap(section => [...section.fields, ...(section.afterFields || [])].map(field => field[0]))]) data[key] = String(raw[key] ?? '').trim();
  for (const [key, table] of Object.entries(INTAKE_TABLES)) {
    data[key] = (Array.isArray(raw[key]) ? raw[key] : []).map(row => Object.fromEntries(table.columns.map(([column]) => [column, String(row?.[column] ?? '').trim()])));
  }
  return data;
}
export function validateIntake(data) {
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
export function formatIntakeDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  return match ? `${match[3]}-${match[2]}-${match[1]}` : 'Por definir';
}
export function intakeFilename(data) {
  const name = (data.project_name || 'proyecto').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-|-$/g, '').slice(0, 65) || 'proyecto';
  return `SolvenLabs-Ficha-${name}-${(data.version || '1.0').replace(/[^a-zA-Z0-9.-]/g, '-')}.pdf`;
}
