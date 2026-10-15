(() => {
  'use strict';
  const questions = [
    { id: 'goal', title: '¿Qué desafío quieres resolver?', hint: 'Elige la necesidad más importante. Podemos sumar otras después.', options: [
      ['prototype', 'Probar una idea', 'Crear algo pequeño para ver si funciona.'],
      ['app', 'Crear una aplicación', 'Registrar información y organizar el trabajo.'],
      ['ai', 'Analizar con inteligencia artificial', 'Trabajar con imágenes, audio, textos u otros datos.'],
      ['data', 'Entender mis datos', 'Ordenar información y consultar resultados.'],
      ['connect', 'Conectar herramientas', 'Compartir datos y evitar tareas repetidas.'],
      ['improve', 'Mejorar algo que ya existe', 'Corregir problemas o sumar funciones.']
    ] },
    { id: 'stage', title: '¿Con qué cuentas hoy?', hint: 'Esto nos ayuda a elegir un punto de partida realista.', options: [
      ['idea', 'Una idea o un problema', 'Todavía no tenemos una herramienta para probar.'],
      ['trial', 'Una primera versión', 'Ya podemos mostrar algo, pero falta probarlo o mejorarlo.'],
      ['live', 'Una herramienta en uso', 'Hay personas que ya trabajan con ella.']
    ] },
    { id: 'resources', title: '¿Tienes información para empezar?', hint: 'Pueden ser planillas, imágenes, documentos o accesos a tus herramientas.', options: [
      ['none', 'Todavía no', 'Necesitamos definir qué reunir.'],
      ['sample', 'Tenemos algunos ejemplos', 'Podemos preparar una muestra para revisar.'],
      ['ready', 'Está organizada y podemos usarla', 'Tenemos información y permiso para trabajar con ella.'],
      ['permission', 'Faltan permisos o accesos', 'Primero debemos resolver quién puede usarla.']
    ] },
    { id: 'users', title: '¿Quién usará la solución?', hint: 'Pensar en las personas ayuda a definir las funciones y las pruebas.', options: [
      ['self', 'Yo o un equipo pequeño', 'Podemos probar y decidir directamente.'],
      ['institution', 'Varias áreas de una organización de salud', 'Hay distintas tareas y responsables.'],
      ['public', 'Personas fuera de mi equipo', 'Por ejemplo, profesionales de salud, pacientes o participantes de un estudio.']
    ] },
    { id: 'timing', title: '¿Cuándo necesitas un primer avance?', hint: 'Una fecha cercana puede requerir una primera entrega más pequeña.', options: [
      ['month', 'Durante este mes', 'Necesitamos priorizar lo esencial.'],
      ['quarter', 'En los próximos tres meses', 'Podemos organizar el trabajo por etapas.'],
      ['flexible', 'Aún no hay fecha', 'Primero queremos definir bien el proyecto.']
    ] },
    { id: 'funding', title: '¿Cómo están pensando financiarlo?', hint: 'No necesitas indicar montos. Esto ayuda a preparar el siguiente paso.', options: [
      ['secured', 'Ya tenemos presupuesto', 'Necesitamos definir qué incluir y pedir una propuesta.'],
      ['application', 'Estamos postulando a un fondo', 'Necesitamos describir el trabajo y estimar sus costos.'],
      ['exploring', 'Estamos viendo opciones', 'Queremos saber qué conviene hacer primero.']
    ] }
  ];
  const routes = {
    prototype: { title: 'Prueba tu idea con una primera versión', first: 'Elige una sola pregunta que quieras comprobar.', deliverable: 'Un prototipo pequeño y un registro de lo que funcionó y lo que falta mejorar.', tasks: ['Definir la tarea principal', 'Construir una versión para probar', 'Probar con usuarios y registrar resultados'], prepare: 'Un ejemplo del problema y una persona que pueda probar la idea.', success: 'La persona puede completar la tarea elegida y el equipo registra qué aprendió.' },
    app: { title: 'Crea una aplicación centrada en una tarea', first: 'Describe la tarea que hoy cuesta más tiempo o provoca errores.', deliverable: 'Una aplicación con las funciones esenciales, permisos de acceso y una guía de uso.', tasks: ['Dibujar las pantallas y acordar funciones', 'Construir el recorrido principal', 'Probar con el equipo antes de ponerla en uso'], prepare: 'Un ejemplo del registro o tarea actual y la lista de personas que lo usan.', success: 'Los usuarios completan el recorrido principal sin perder información.' },
    ai: { title: 'Comprueba si la inteligencia artificial ayuda', first: 'Define qué resultado esperas y con qué lo vas a comparar.', deliverable: 'Una prueba con datos de ejemplo y un informe de resultados, errores y límites.', tasks: ['Preparar ejemplos y resultados esperados', 'Probar una solución y compararla con el método actual', 'Revisar errores antes de conectarla a una aplicación'], prepare: 'Ejemplos que tengas permiso para usar y una persona que pueda revisar las respuestas.', success: 'La prueba mejora el criterio acordado frente al método actual y sus errores son revisados por una persona.' },
    data: { title: 'Ordena tus datos y convierte preguntas en resultados', first: 'Elige tres preguntas que necesitas responder con tus datos.', deliverable: 'Datos organizados, un panel de resultados y una guía para actualizarlo.', tasks: ['Revisar fuentes y corregir datos incompletos', 'Acordar cálculos e indicadores', 'Crear un panel y comprobar sus resultados'], prepare: 'Una muestra de las planillas o fuentes, con una explicación de cada dato.', success: 'Los resultados del panel coinciden con una revisión manual de la muestra.' },
    connect: { title: 'Automatiza una tarea entre tus herramientas', first: 'Anota qué información copias hoy de un sistema a otro.', deliverable: 'Una conexión probada, con registro de errores y una guía para mantenerla.', tasks: ['Confirmar accesos y opciones de conexión', 'Automatizar una tarea repetida', 'Probar errores, duplicados y avisos'], prepare: 'Los nombres de las herramientas y un ejemplo del proceso completo.', success: 'La información llega al destino correcto sin duplicarse y los fallos quedan registrados.' },
    improve: { title: 'Mejora tu herramienta empezando por lo urgente', first: 'Elige el problema que más afecta a quienes la usan.', deliverable: 'Una revisión de la herramienta, mejoras priorizadas y una primera corrección probada.', tasks: ['Revisar el problema y preparar un respaldo', 'Aplicar la mejora más importante', 'Probar que las tareas existentes sigan funcionando'], prepare: 'Acceso autorizado a la herramienta y un ejemplo concreto del problema.', success: 'El problema elegido queda resuelto y las funciones existentes siguen funcionando.' }
  };
  const branches = {
    prototype: { id: 'prototypeTest', title: '¿Qué necesitas comprobar primero?', hint: 'Probar si algo se puede construir es distinto de probar si alguien lo necesita.', options: [
      ['technical', 'Si la idea puede funcionar', 'Primero necesitamos una prueba técnica.'], ['useful', 'Si le sirve a las personas', 'Queremos probar una tarea con posibles usuarios.'], ['present', 'Cómo mostrar la idea', 'Necesitamos una demostración para explicar el proyecto.']
    ] },
    app: { id: 'appTask', title: '¿Qué tarea debe resolver la aplicación primero?', hint: 'Empezaremos por una tarea completa, no por una lista larga de funciones.', options: [
      ['records', 'Registrar y consultar información', 'Fichas, formularios o seguimiento de casos.'], ['coordination', 'Organizar el trabajo del equipo', 'Tareas, revisiones y responsables.'], ['selfservice', 'Permitir que las personas hagan una gestión', 'Solicitudes, reservas o consultas sin intermediarios.']
    ] },
    ai: { id: 'aiInput', title: '¿Con qué trabajaría la inteligencia artificial?', hint: 'El tipo de información cambia los ejemplos y las pruebas que necesitamos.', options: [
      ['images', 'Imágenes o audio', 'Reconocer señales, sonidos o elementos en imágenes.'], ['text', 'Textos y documentos', 'Buscar información, clasificar o preparar respuestas.'], ['numbers', 'Planillas y registros', 'Encontrar patrones o estimar un resultado.']
    ] },
    data: { id: 'dataProblem', title: '¿Qué te dificulta trabajar con tus datos?', hint: 'Antes de crear un panel, veamos qué impide obtener respuestas.', options: [
      ['scattered', 'Están repartidos o desordenados', 'Hay varias planillas, duplicados o datos incompletos.'], ['meaning', 'Están ordenados, pero cuesta entenderlos', 'Necesitamos comparar resultados y responder preguntas.'], ['repeated', 'Actualizar los informes toma mucho tiempo', 'Repetimos los mismos pasos cada vez.']
    ] },
    connect: { id: 'connectionTask', title: '¿Qué tarea repites entre herramientas?', hint: 'Elegir un intercambio concreto permite probar una conexión útil.', options: [
      ['copy', 'Copiar información', 'Pasar registros de un sistema a otro.'], ['notify', 'Enviar avisos o recordatorios', 'Avisar cuando cambia un dato o se cumple una fecha.'], ['approval', 'Pedir revisiones o aprobaciones', 'Mover solicitudes entre personas y herramientas.']
    ] },
    improve: { id: 'improvement', title: '¿Qué está pasando con tu herramienta?', hint: 'Si hay un fallo, conviene resolverlo antes de sumar funciones.', options: [
      ['broken', 'Falla o interrumpe el trabajo', 'Necesitamos entender y corregir un problema.'], ['slow', 'Es lenta o cuesta usarla', 'Las tareas demoran o las personas se confunden.'], ['new', 'Le faltan funciones', 'Necesitamos ampliar lo que ya puede hacer.']
    ] },
    continuity: { id: 'continuity', title: '¿Se puede detener la herramienta para hacer cambios?', hint: 'Ya hay personas usándola. Esto define cómo preparar las pruebas y la puesta en uso.', options: [
      ['window', 'Sí, en un horario acordado', 'Podemos coordinar una pausa.'], ['always', 'No, debe seguir disponible', 'Necesitamos probar los cambios por separado.'], ['unknown', 'Tenemos que confirmarlo', 'Debemos conversar con quienes la usan.']
    ] },
    source: { id: 'source', title: '¿De dónde podría salir la información que falta?', hint: 'Sin ejemplos todavía podemos definir el proyecto; esta respuesta ayuda a preparar la primera prueba.', options: [
      ['collect', 'Podemos reunirla nosotros', 'Tenemos acceso a situaciones o personas del proyecto.'], ['partner', 'La tiene otra organización', 'Debemos coordinar su entrega y permiso de uso.'], ['unknown', 'Todavía no sabemos', 'Necesitamos identificar qué reunir y cómo hacerlo.']
    ] },
    permission: { id: 'permissionOwner', title: '¿Saben quién puede autorizar el acceso?', hint: 'Como faltan permisos, resolver esto evita empezar con información que no se puede usar.', options: [
      ['known', 'Sí, sabemos a quién pedirlo', 'Podemos coordinar la autorización.'], ['unknown', 'No está claro todavía', 'Necesitamos identificar a la persona responsable.']
    ] },
    reviewer: { id: 'reviewer', title: '¿Quién podría revisar si la IA responde bien?', hint: 'Tener datos no basta: necesitamos comparar respuestas y revisar errores.', options: [
      ['expert', 'Una persona que conoce el tema', 'Puede revisar ejemplos y detectar errores.'], ['reference', 'Tenemos resultados correctos para comparar', 'Podemos medir la prueba con esos ejemplos.'], ['none', 'Todavía no lo hemos definido', 'Debemos acordar cómo evaluar antes de confiar en los resultados.']
    ] },
    testers: { id: 'testers', title: '¿Pueden probar con personas fuera del equipo?', hint: 'Como la herramienta será para otras personas, sus comentarios ayudan a evitar suposiciones.', options: [
      ['yes', 'Sí, tenemos personas disponibles', 'Podemos preparar una primera prueba.'], ['no', 'Aún debemos encontrarlas', 'Necesitamos coordinar participantes antes de validar el uso.']
    ] },
    fund: { id: 'fundDeadline', title: '¿En qué punto está la postulación?', hint: 'Podemos orientar el trabajo a preparar la propuesta o a empezar a construir.', options: [
      ['closing', 'El fondo cierra pronto', 'Primero necesitamos describir el trabajo y sus costos.'], ['planning', 'Estamos preparando la propuesta', 'Podemos definir las etapas y revisar las bases.'], ['submitted', 'Ya postulamos y esperamos el resultado', 'Queremos preparar lo necesario sin comprometer gastos todavía.']
    ] }
  };
  const allQuestions = [...questions, ...Object.values(branches)];
  const label = (id, value) => allQuestions.find(q => q.id === id)?.options.find(o => o[0] === value)?.[1] || '';
  function getQuestions(answers = {}) {
    const [goal, stage, resources, users, timing, funding] = questions;
    const path = [goal];
    if (branches[answers.goal]) path.push(branches[answers.goal]);
    path.push(answers.goal === 'improve' ? { ...stage, title: '¿La herramienta ya está en uso?', options: stage.options.filter(o => o[0] !== 'idea') } : stage);
    if (answers.stage === 'live') path.push(branches.continuity);
    path.push(resources);
    if (answers.resources === 'none') path.push(branches.source);
    if (answers.resources === 'permission') path.push(branches.permission);
    if (answers.goal === 'ai' && ['sample', 'ready'].includes(answers.resources)) path.push(branches.reviewer);
    path.push(users);
    if (answers.users === 'public') path.push(branches.testers);
    path.push(timing, funding);
    if (answers.funding === 'application') path.push(branches.fund);
    return path;
  }
  function answerQuestion(answers, id, value) {
    const path = getQuestions(answers);
    const index = path.findIndex(q => q.id === id);
    if (index < 0 || !path[index].options.some(o => o[0] === value)) throw new Error('Respuesta no válida para esta pregunta.');
    if (answers[id] === value) return { ...answers };
    // A changed answer starts a fresh downstream path: no invisible, stale answers.
    return { ...Object.fromEntries(path.slice(0, index).filter(q => answers[q.id]).map(q => [q.id, answers[q.id]])), [id]: value };
  }
  function buildPlan(answers) {
    if (!getQuestions(answers).every(q => q.options.some(o => o[0] === answers[q.id]))) throw new Error('Faltan respuestas válidas.');
    const route = { ...routes[answers.goal], tasks: [...routes[answers.goal].tasks] };
    const preparation = [route.prepare];
    const blockers = [];
    const reasons = [`Tu prioridad es: ${label('goal', answers.goal).toLowerCase()}.`];
    const detail = branches[answers.goal];
    reasons.push(`Por eso enfocamos la primera entrega en: ${label(detail.id, answers[detail.id]).toLowerCase()}.`);
    const focus = {
      prototypeTest: {
        technical: ['Comprobar una función técnica con ejemplos pequeños', 'Una prueba técnica y un registro de resultados, antes de desarrollar la aplicación completa.'],
        useful: ['Preparar una tarea para probar con posibles usuarios', 'Un prototipo para observar si las personas pueden completar la tarea y qué necesitan mejorar.'],
        present: ['Elegir el recorrido que mejor explica la idea', 'Una demostración del recorrido principal, señalando qué está simulado y qué ya funciona.']
      },
      appTask: {
        records: ['Definir los campos de una ficha y quién puede consultarla', 'Un registro que permita crear, consultar y actualizar una ficha con permisos definidos.'],
        coordination: ['Definir una tarea, su responsable y sus estados', 'Un recorrido de asignación, revisión y cierre de tareas.'],
        selfservice: ['Elegir una gestión que una persona pueda completar sola', 'Un recorrido de solicitud y confirmación con instrucciones claras.']
      },
      aiInput: {
        images: ['Reunir imágenes o audios con ejemplos de lo que se quiere reconocer', 'Una prueba de análisis de imágenes o audio, con resultados y errores revisados.'],
        text: ['Preparar documentos y preguntas con respuestas que se puedan verificar', 'Una prueba sobre documentos, con ejemplos de respuestas correctas, errores y fuentes.'],
        numbers: ['Definir qué resultado se quiere estimar y revisar los registros disponibles', 'Una comparación entre el método actual y una prueba con datos separados para evaluarla.']
      },
      dataProblem: {
        scattered: ['Reunir una muestra de las fuentes y detectar registros repetidos', 'Una base ordenada y una guía de limpieza antes de diseñar un panel.'],
        meaning: ['Elegir las preguntas que el panel debe responder', 'Un panel pequeño con indicadores revisados junto al equipo.'],
        repeated: ['Anotar los pasos que se repiten al preparar un informe', 'Un informe que se pueda actualizar siguiendo un proceso repetible.']
      },
      connectionTask: {
        copy: ['Definir qué registro viaja de una herramienta a otra', 'Una conexión para trasladar un tipo de registro, con control de duplicados.'],
        notify: ['Definir qué cambio activa el aviso y quién debe recibirlo', 'Un aviso automático probado, con registro de envío y errores.'],
        approval: ['Definir quién revisa una solicitud y cómo se conoce su estado', 'Un recorrido de revisión con responsables y registro de decisiones.']
      },
      improvement: {
        broken: ['Reproducir el fallo sin arriesgar la información actual', 'Una corrección probada, con respaldo y una forma de volver a la versión anterior.'],
        slow: ['Observar y medir la tarea que hoy tarda o confunde', 'Una mejora de esa tarea, comparada con su funcionamiento actual.'],
        new: ['Elegir la función nueva más necesaria', 'Una función nueva probada junto a las funciones que ya existen.']
      }
    }[detail.id][answers[detail.id]];
    route.first = focus[0]; route.tasks[0] = focus[0]; route.deliverable = focus[1];
    if (answers.resources === 'permission') {
      blockers.push('Antes de usar datos o conectar sistemas, confirma los permisos y consigue accesos autorizados.');
      preparation.push('Quién autoriza el uso de los datos y el acceso a cada herramienta.');
    } else if (answers.resources === 'none') {
      blockers.push('Primero hay que reunir ejemplos. Podemos definir el trabajo, pero todavía no comprobar resultados con datos reales.');
      preparation.push('Una lista de la información que existe y de lo que falta reunir.');
    } else if (answers.resources === 'sample') {
      preparation.push('Una muestra de casos frecuentes y casos difíciles, sin datos personales innecesarios.');
    } else {
      reasons.push('Ya tienes información organizada y permiso para usarla: podemos comenzar por revisarla.');
    }
    if (answers.stage === 'live') {
      preparation.push('Un respaldo y un horario para hacer pruebas sin interrumpir el trabajo.');
      reasons.push('Como hay una herramienta en uso, conviene revisar primero lo que ya funciona.');
    } else if (answers.stage === 'trial') {
      preparation.push('Una demostración de la primera versión y los comentarios de quienes la probaron.');
      reasons.push('La primera versión permite aprovechar lo avanzado y decidir qué mejorar.');
    } else if (answers.goal === 'improve') {
      blockers.push('Elegiste mejorar una herramienta, pero indicaste que solo tienes una idea. Confirma si existe una versión; si no, comienza definiendo un prototipo.');
    }
    if (answers.users === 'institution') preparation.push('Una persona responsable por área y los permisos que necesita cada grupo.');
    else if (answers.users === 'public') preparation.push('Personas disponibles para probar y una revisión de accesibilidad y manejo de datos personales.');
    else preparation.push('Una persona del equipo que revise avances y pruebe la primera entrega.');
    const timing = answers.timing === 'month' ? 'Para este mes, acuerda una sola tarea o prueba. La disponibilidad y el trabajo necesario deben revisarse antes de comprometer una fecha.' : answers.timing === 'quarter' ? 'Divide el trabajo en entregas pequeñas con fechas de revisión. El plazo final depende de las funciones, los datos y los accesos.' : 'Primero define la primera entrega y lo que necesitas reunir; luego podrás acordar fechas realistas.';
    const funding = answers.funding === 'application' ? 'Prepara una descripción del trabajo, entregas y costos para tu postulación. Incluye servicios externos y soporte si el fondo los permite.' : answers.funding === 'secured' ? 'Pide una propuesta con funciones incluidas, fechas de revisión y costos de servidores, licencias y soporte por separado.' : 'Empieza por una revisión y una primera prueba pequeña. Con esos resultados podrás decidir cuánto invertir después.';
    if (answers.funding === 'application') preparation.push('Las bases del fondo, fecha de cierre y condiciones de gasto.');
    if (answers.continuity === 'always') {
      blockers.push('La herramienta debe seguir disponible: prepara un lugar separado para probar y un plan para volver atrás si algo falla.');
      preparation.push('Una copia de prueba y responsables para revisar la puesta en uso.');
    } else if (answers.continuity === 'unknown') preparation.push('Confirmar con los usuarios si existe un horario para hacer cambios.');
    else if (answers.continuity === 'window') preparation.push('El horario de pausa acordado con quienes usan la herramienta.');
    if (answers.source === 'partner') preparation.push('Contacto de la organización que tiene los datos y condiciones para compartirlos.');
    else if (answers.source === 'collect') preparation.push('Un plan pequeño para recoger los primeros ejemplos y registrar su origen.');
    else if (answers.source === 'unknown') preparation.push('Una conversación para identificar qué datos hacen falta antes de construir.');
    if (answers.permissionOwner === 'unknown') blockers.unshift('Identifica quién puede autorizar el uso de la información antes de pedir o compartir datos.');
    else if (answers.permissionOwner === 'known') preparation.push('La autorización de la persona responsable y los usos que permite.');
    if (answers.reviewer === 'none') blockers.push('Define quién revisará los resultados de la inteligencia artificial y qué se considerará correcto.');
    else if (answers.reviewer === 'expert') preparation.push('Disponibilidad de la persona que revisará respuestas y errores de la IA.');
    else if (answers.reviewer === 'reference') preparation.push('Resultados de referencia reservados para evaluar la prueba.');
    if (answers.testers === 'no') preparation.push('Contactar participantes antes de afirmar que la herramienta es fácil de usar.');
    else if (answers.testers === 'yes') preparation.push('Coordinar una sesión breve con las personas disponibles para probar.');
    if (answers.fundDeadline === 'closing') {
      blockers.unshift('Prioriza la descripción del trabajo y sus costos para la postulación antes de comprometer el desarrollo.');
      route.deliverable = 'Una descripción de la primera etapa, sus entregas y costos por revisar contra las bases del fondo.';
      route.tasks = ['Revisar bases y fecha de cierre', 'Definir la primera etapa y sus costos', 'Preparar la descripción técnica para postular'];
    } else if (answers.fundDeadline === 'submitted') preparation.push('Una lista de preparativos que se pueden hacer sin comprometer gastos mientras llega el resultado.');
    else if (answers.fundDeadline === 'planning') preparation.push('Un borrador del objetivo y las entregas que se presentarán al fondo.');
    const first = blockers.length ? blockers[0] : route.first;
    return { ...route, first, reasons, preparation, blockers, timing, funding };
  }
  function summaryText(answers, plan, prepared = new Set()) {
    return ['MI PROYECTO · Solven Labs', ...getQuestions(answers).map(q => `${q.title} ${label(q.id, answers[q.id])}`), '', plan.title, `Primer paso: ${plan.first}`, `Primera entrega sugerida: ${plan.deliverable}`, '', 'Ruta de trabajo:', ...plan.tasks.map((task, i) => `${i + 1}. ${task}`), '', 'Qué preparar ([x] listo, [ ] pendiente):', ...plan.preparation.map(item => `- [${prepared.has(item) ? 'x' : ' '}] ${item}`), '', 'Qué revisar antes de empezar:', ...(plan.blockers.length ? plan.blockers : ['Confirmar funciones, permisos y responsables en la primera revisión.']), '', `Cómo comprobar el resultado: ${plan.success}`, `Fechas: ${plan.timing}`, `Presupuesto: ${plan.funding}`, '', 'Orientación inicial según tus respuestas. No es una cotización ni un plazo comprometido.'].join('\n');
  }
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  function init(root) {
    if (!root || root.dataset.advisorReady) return;
    root.dataset.advisorReady = 'true';
    let step = 0;
    let answers = {};
    const prepared = new Set();
    const dialog = document.createElement('dialog');
    dialog.className = 'advisor-dialog';
    dialog.setAttribute('aria-labelledby', 'advisor-plan-title');
    document.body.append(dialog);
    let previousOverflow = '';
    const closeResult = () => { if (dialog.open) dialog.close(); };
    dialog.addEventListener('close', () => {
      document.documentElement.style.overflow = previousOverflow;
      root.querySelector('[data-reopen]')?.focus({ preventScroll: true });
    });
    dialog.addEventListener('keydown', event => {
      if (event.key === 'Escape') event.stopPropagation();
    });
    let backdropStart = false;
    dialog.addEventListener('pointerdown', event => { backdropStart = event.target === dialog; });
    dialog.addEventListener('click', event => {
      if (backdropStart && event.target === dialog) {
        const rect = dialog.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeResult();
      }
      backdropStart = false;
    });
    const focusHeading = () => {
      const heading = root.querySelector('[data-advisor-heading]');
      heading?.focus({ preventScroll: true });
      heading?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    };
    function render(focus = true) {
      const path = getQuestions(answers);
      const q = path[step];
      const previous = path[step - 1];
      root.innerHTML = `<div class="advisor-layout"><aside class="advisor-sidebar"><span class="advisor-eyebrow">TU PROYECTO, PASO A PASO</span><h3>De una idea a un plan para empezar.</h3><p>Las preguntas cambian según lo que nos cuentas. Estas son tus respuestas más recientes:</p><ol class="advisor-steps">${path.slice(0, step).slice(-3).map(item => `<li><span>✓</span>${escape(label(item.id, answers[item.id]))}</li>`).join('')}</ol><small>No pedimos datos de contacto. Tus respuestas se mantienen solo mientras esta página esté abierta.</small></aside><div class="advisor-main"><div class="advisor-progress"><span>Pregunta ${step + 1}</span><span>Tu camino se adapta</span></div><progress max="${path.length}" value="${step + 1}" aria-label="Progreso del orientador"></progress>${previous ? `<div class="advisor-context"><small>Nos contaste</small><strong>${escape(label(previous.id, answers[previous.id]))}</strong></div>` : ''}<h3 tabindex="-1" data-advisor-heading>${q.title}</h3><p class="advisor-hint">${q.hint}</p><div class="advisor-options" role="group" aria-label="${q.title}">${q.options.map(([value, title, hint]) => `<button type="button" class="advisor-option" data-choice="${value}" aria-pressed="${answers[q.id] === value}"><span class="advisor-option__mark" aria-hidden="true"></span><span><strong>${title}</strong><small>${hint}</small></span></button>`).join('')}</div><div class="advisor-navigation"><button type="button" class="btn btn--outline" data-back ${step === 0 ? 'disabled' : ''}>← Anterior</button><button type="button" class="btn btn--primary" data-next ${answers[q.id] ? '' : 'disabled'}>${step === path.length - 1 ? 'Ver mi plan' : 'Continuar'} →</button></div><p class="advisor-hint advisor-hint--small">Selecciona una opción para continuar. Si cambias una respuesta, revisaremos las siguientes.</p></div></div>`;
      root.querySelectorAll('[data-choice]').forEach(button => button.addEventListener('click', () => {
        const value = button.dataset.choice;
        answers = answerQuestion(answers, q.id, value);
        prepared.clear();
        render(false);
        root.querySelector(`[data-choice="${value}"]`)?.focus({ preventScroll: true });
      }));
      root.querySelector('[data-back]').addEventListener('click', () => { if (step > 0) { step--; render(); } });
      root.querySelector('[data-next]').addEventListener('click', () => {
        if (!answers[q.id]) return;
        if (step < getQuestions(answers).length - 1) { step++; render(); } else showResult();
      });
      if (focus) focusHeading();
    }
    function showResult() {
      const plan = buildPlan(answers);
      let summary = summaryText(answers, plan, prepared);
      const list = items => `<ul>${items.map(item => `<li>${escape(item)}</li>`).join('')}</ul>`;
      const shareUrl = () => `https://wa.me/56977029753?text=${encodeURIComponent('Hola Solven Labs, quiero conversar sobre este plan:\n\n' + summary)}`;
      root.innerHTML = `<div class="advisor-ready"><div><span class="advisor-eyebrow">TU PLAN ESTÁ LISTO</span><h3>${escape(plan.title)}</h3><p>Vuelve a revisarlo, marca lo que ya tienes o ajusta tus respuestas.</p></div><button type="button" class="btn btn--primary" data-reopen>Ver mi plan ↗</button></div>`;
      root.querySelector('[data-reopen]').addEventListener('click', showResult);
      dialog.innerHTML = `
        <div class="advisor-dialog__shell">
          <div class="advisor-dialog__toolbar"><span>Solven Labs <span aria-hidden="true">/</span> Tu próximo paso</span><button type="button" class="advisor-dialog__close" data-close aria-label="Cerrar plan">×</button></div>
          <header class="advisor-dialog__hero"><span class="advisor-eyebrow">UN PLAN A PARTIR DE TUS RESPUESTAS</span><h2 id="advisor-plan-title" tabindex="-1">${escape(plan.title)}</h2><p>Empieza por lo importante. El resto lo puedes preparar por etapas.</p></header>
          <div class="advisor-dialog__tabs" role="tablist" aria-label="Explorar tu plan">
            <button type="button" role="tab" id="advisor-tab-plan" aria-controls="advisor-panel-plan" aria-selected="true" tabindex="0">Tu plan</button>
            <button type="button" role="tab" id="advisor-tab-prepare" aria-controls="advisor-panel-prepare" aria-selected="false" tabindex="-1">Qué preparar <span aria-hidden="true">${plan.preparation.length}</span></button>
            <button type="button" role="tab" id="advisor-tab-answers" aria-controls="advisor-panel-answers" aria-selected="false" tabindex="-1">Tus respuestas</button>
          </div>
          <div class="advisor-dialog__scroll">
            <section class="advisor-dialog__panel" id="advisor-panel-plan" role="tabpanel" aria-labelledby="advisor-tab-plan" tabindex="0">
              <div class="advisor-plan-grid">
                <section class="advisor-block advisor-block--first"><span class="advisor-eyebrow">01 · HAZ ESTO PRIMERO</span><h3>${escape(plan.first)}</h3></section>
                <section class="advisor-block advisor-plan-delivery"><span class="advisor-eyebrow">02 · QUÉ BUSCAMOS LOGRAR</span><h3>Una primera entrega concreta</h3><p>${escape(plan.deliverable)}</p></section>
              </div>
              <section class="advisor-plan-route"><h3>Tu ruta de trabajo</h3><ol>${plan.tasks.map((task, index) => `<li><span aria-hidden="true">${String(index + 1).padStart(2, '0')}</span><p>${escape(task)}</p></li>`).join('')}</ol></section>
              <section class="advisor-plan-success"><span aria-hidden="true">✓</span><div><h3>Cómo comprobar el resultado</h3><p>${escape(plan.success)}</p></div></section>
              <details class="advisor-plan-details"><summary>Por qué esta ruta encaja contigo</summary>${list(plan.reasons)}</details>
              <details class="advisor-plan-details"><summary>Fechas y presupuesto</summary><div class="advisor-plan-grid"><div><h4>Cuándo avanzar</h4><p>${escape(plan.timing)}</p></div><div><h4>Cómo financiarlo</h4><p>${escape(plan.funding)}</p></div></div></details>
              ${plan.blockers.length ? `<button type="button" class="advisor-plan-alert" data-open-preparation><span aria-hidden="true">!</span><span><strong>${plan.blockers.length === 1 ? 'Hay un punto que revisar antes de construir' : `Hay ${plan.blockers.length} puntos que revisar antes de construir`}</strong><small>Ver lo que falta resolver →</small></span></button>` : ''}
            </section>
            <section class="advisor-dialog__panel" id="advisor-panel-prepare" role="tabpanel" aria-labelledby="advisor-tab-prepare" tabindex="0" hidden>
              <div class="advisor-panel-heading"><div><span class="advisor-eyebrow">PASO A PASO</span><h3>Prepara la primera conversación</h3><p>Marca lo que ya tienes. Se incluirá en el resumen que guardes o compartas.</p></div><span class="advisor-prepared-count" role="status" aria-live="polite"></span></div>
              ${plan.blockers.length ? `<section class="advisor-block advisor-block--attention"><h4>Resuelve esto primero</h4>${list(plan.blockers)}</section>` : ''}
              <div class="advisor-checklist">${plan.preparation.map(item => `<label><input type="checkbox"><span>${escape(item)}</span></label>`).join('')}</div>
            </section>
            <section class="advisor-dialog__panel" id="advisor-panel-answers" role="tabpanel" aria-labelledby="advisor-tab-answers" tabindex="0" hidden>
              <div class="advisor-panel-heading"><div><span class="advisor-eyebrow">LO QUE NOS CONTASTE</span><h3>Tu proyecto, hasta aquí</h3><p>Pulsa una respuesta para cambiarla. Después revisaremos las preguntas que dependen de ella.</p></div></div>
              <div class="advisor-answer-strip">${getQuestions(answers).map((q, index) => `<button type="button" data-edit="${index}" aria-label="Cambiar respuesta: ${escape(q.title)}"><small>${escape(q.title)}</small><strong>${escape(label(q.id, answers[q.id]))}</strong><span aria-hidden="true"> ↗</span></button>`).join('')}</div>
              <button type="button" class="advisor-reset" data-restart>Empezar de nuevo</button>
            </section>
            <textarea class="advisor-copy-fallback" aria-label="Resumen para copiar manualmente" readonly hidden></textarea>
          </div>
          <footer class="advisor-dialog__footer">
            <div class="advisor-dialog__actions"><a class="btn btn--primary" data-share href="${shareUrl()}" target="_blank" rel="noopener noreferrer">Conversar sobre mi plan ↗</a><button type="button" class="btn btn--outline" data-download>Descargar</button><button type="button" class="btn btn--outline" data-copy>Copiar resumen</button></div>
            <p class="advisor-status" role="status" aria-live="polite"></p><p class="advisor-disclaimer">Orientación inicial. Costos y fechas se confirman al revisar tu proyecto.</p>
          </footer>
        </div>`;
      const tabs = [...dialog.querySelectorAll('[role="tab"]')];
      const panels = [...dialog.querySelectorAll('[role="tabpanel"]')];
      const activateTab = (index, focus = false) => {
        tabs.forEach((tab, i) => { tab.setAttribute('aria-selected', String(i === index)); tab.tabIndex = i === index ? 0 : -1; panels[i].hidden = i !== index; });
        dialog.querySelector('.advisor-dialog__scroll').scrollTop = 0;
        if (focus) tabs[index].focus({ preventScroll: true });
      };
      tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => activateTab(index));
        tab.addEventListener('keydown', event => {
          const next = { ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index - 1 + tabs.length) % tabs.length, Home: 0, End: tabs.length - 1 }[event.key];
          if (next === undefined) return;
          event.preventDefault(); activateTab(next, true);
        });
      });
      dialog.querySelector('[data-close]').addEventListener('click', closeResult);
      dialog.querySelector('[data-open-preparation]')?.addEventListener('click', () => activateTab(1, true));
      dialog.querySelectorAll('[data-edit]').forEach(button => button.addEventListener('click', () => { closeResult(); step = Number(button.dataset.edit); render(); }));
      const updatePreparedCount = () => { dialog.querySelector('.advisor-prepared-count').textContent = `${plan.preparation.filter(item => prepared.has(item)).length} de ${plan.preparation.length} listos`; };
      dialog.querySelectorAll('.advisor-checklist input').forEach((checkbox, index) => {
        const item = plan.preparation[index];
        checkbox.checked = prepared.has(item);
        checkbox.addEventListener('change', () => {
          if (checkbox.checked) prepared.add(item); else prepared.delete(item);
          summary = summaryText(answers, plan, prepared);
          dialog.querySelector('[data-share]').href = shareUrl();
          const field = dialog.querySelector('.advisor-copy-fallback');
          if (!field.hidden) field.value = summary;
          updatePreparedCount();
        });
      });
      updatePreparedCount();
      dialog.querySelector('[data-restart]').addEventListener('click', () => { closeResult(); answers = {}; prepared.clear(); step = 0; render(); });
      const status = dialog.querySelector('.advisor-status');
      dialog.querySelector('[data-copy]').addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(summary);
          if (dialog.open && dialog.contains(status)) status.textContent = 'Resumen copiado. Incluye tu lista de preparativos.';
        } catch {
          if (!dialog.open || !dialog.contains(status)) return;
          const field = dialog.querySelector('.advisor-copy-fallback');
          field.hidden = false; field.value = summary; field.focus(); field.select();
          status.textContent = 'Seleccionamos el resumen para que puedas copiarlo manualmente.';
        }
      });
      dialog.querySelector('[data-download]').addEventListener('click', () => {
        const url = URL.createObjectURL(new Blob(['\uFEFF' + summary], { type: 'text/plain;charset=utf-8' }));
        const link = document.createElement('a'); link.href = url; link.download = 'mi-plan-ntek.txt';
        document.body.append(link); link.click(); link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        status.textContent = 'Resumen preparado para descargar.';
      });
      previousOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = 'hidden';
      dialog.showModal();
      dialog.querySelector('#advisor-plan-title').focus({ preventScroll: true });
    }
    render(false);
  }
  window.NtekAdvisor = { init, buildPlan, summaryText, questions, getQuestions, answerQuestion };
})();
