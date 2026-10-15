// Contenido editorial I+D+i y actividades del blog.
export const BLOG_POSTS = [
  {
    id: 'datos-investigacion',
    slug: 'automatizar-procesos-pyme-sin-complicar-operacion',
    title: 'Tu investigación merece algo mejor que final_final_ahora_si.xlsx',
    excerpt: 'Ordena tus planillas y conoce el origen de tus datos. Aprende con ejemplos, preguntas y una sopa de letras.',
    category: 'Datos de investigación',
    tags: ['Datos de investigación', 'Investigación e innovación', 'universidades', 'prototipos'],
    author_name: 'Equipo Solven Labs',
    published_at: '2026-09-24T12:00:00-03:00',
    updated_at: '2026-10-08T12:00:00-03:00',
    featured: false,
    cover_image: '/assets/blog-idi/datos-investigacion-cover.svg',
    cover_alt: 'Ilustración de archivos de planillas desordenados que se convierten en un recorrido con origen y cambios registrados',
    seo_title: 'Tu investigación merece algo mejor que final_final_ahora_si.xlsx | Solven Labs',
    seo_description: 'Ordena tus planillas y conoce el origen de tus datos. Aprende con ejemplos, preguntas y una sopa de letras.',
    content: `
<div class="reading-intro"><span>Guías para crear e investigar</span><p>Lectura + 3 preguntas + una actividad. Los ejemplos de equipos y proyectos son situaciones ilustrativas.</p></div><section class="editorial-section editorial-section--intro"><h2>El misterio de la columna que cambió de nombre</h2><p>Son las seis de la tarde. El gráfico ya está listo, pero alguien pregunta de dónde salió ese número. Hay cuatro planillas, dos carpetas compartidas y una columna llamada «valor_nuevo». Nadie recuerda cuál alimentó el informe. El problema no es que falte un dashboard bonito: falta una historia que permita volver desde el resultado hasta el origen.</p><p>En un proyecto universitario, una tesis o una iniciativa ciudadana, organizar los datos es parte del trabajo científico y técnico. Aquí usaremos tres palabras: <strong>fuente</strong>, el origen de la información; <strong>versión</strong>, el estado identificable de un archivo; y <strong>regla</strong>, el criterio explícito para transformarlo. Guárdalas: aparecerán en el juego.</p></section><figure class="editorial-media"><img src="/assets/blog-idi/datos-ruta.svg" alt="El viaje de un dato: Fuente, Conserva el archivo original.; Transformación, Registra reglas y versiones.; Resultado, Explica de dónde sale cada indicador." loading="lazy" decoding="async" width="1200" height="680"><figcaption>Trazabilidad: poder reconstruir el camino, no solo mostrar el resultado.</figcaption></figure><section class="editorial-section editorial-section--text"><h2>Antes del dashboard: una pequeña arqueología</h2><p>Imagina que un equipo estudia el uso de espacios de una biblioteca. Una persona registra horarios en minutos y otra en horas. Si juntan todo sin revisar unidades, obtendrán un promedio muy convincente… y equivocado. Un diccionario de datos evita esa sorpresa: define cada variable, unidad, formato y significado de los valores vacíos.</p><p>También conviene preguntar qué representa cada fila. ¿Una visita, una persona o una reserva? Dos filas parecidas no son necesariamente un duplicado. Borrarlas sin criterio puede eliminar observaciones válidas. Acuerden la regla con quien conoce el fenómeno antes de automatizarla.</p></section><section class="editorial-section editorial-section--text"><h2>La receta que otro equipo puede repetir</h2><ol><li><strong>Conserva el original:</strong> trabaja sobre una copia y registra cuándo llegó.</li><li><strong>Define reglas:</strong> cómo tratar fechas, unidades, duplicados y valores faltantes.</li><li><strong>Separa etapas:</strong> datos recibidos, datos procesados y resultados.</li><li><strong>Versiona:</strong> usa nombres o herramientas que permitan identificar cada estado.</li><li><strong>Comprueba:</strong> cuenta filas antes y después; revisa ejemplos de cambios.</li></ol><p>No hace falta comenzar con una infraestructura gigante. Una estructura de carpetas clara, un pequeño script y un registro de decisiones pueden ser un primer avance. La herramienta se elige según el volumen y el equipo, no por lo impresionante de su nombre.</p></section><figure class="editorial-media"><img src="/assets/blog-idi/datos-control.svg" alt="No todo vacío significa cero: Significado, ¿No se midió o el resultado fue cero?; Unidad, ¿Horas, minutos o segundos?; Identidad, ¿Una persona o varias observaciones?" loading="lazy" decoding="async" width="1200" height="680"><figcaption>Estas comprobaciones deben ocurrir antes de calcular indicadores.</figcaption></figure><section class="editorial-section editorial-section--text"><h2>Lo que le pediríamos a una solución de datos</h2><p>Una entrega útil puede incluir un inventario de fuentes, reglas de limpieza, un diccionario de variables, un flujo reproducible y visualizaciones relacionadas con las preguntas del proyecto. «Un panel con diez gráficos» no explica si alguien podrá actualizarlo el próximo semestre.</p><p>Haz una prueba sencilla: pide a otra persona del equipo que ejecute el proceso usando la guía, sin instrucciones por chat. Anota dónde se detiene. Esa lista es una excelente próxima tarea. Y antes de compartir archivos, confirma quién puede acceder a ellos y evita publicar información identificable que no sea necesaria para el objetivo.</p><p>El objetivo no es que nunca haya errores. Es poder detectarlos, explicar cómo se corrigieron y repetir el análisis sin invocar al autor original como si fuera soporte de emergencia.</p></section><form class="reading-activity" data-reading-quiz><span class="reading-activity__eyebrow">Repasa lo aprendido</span><h2>¿Te quedaste con lo importante?</h2><p>Tres decisiones, sin cronómetro. Puedes volver al texto y reintentar.</p><fieldset data-answer="1" data-explanation="Las unidades y la unidad de observación determinan si los datos se pueden combinar."><legend>1. ¿Qué revisar antes de combinar dos planillas?</legend><label class="reading-option"><input type="radio" name="datos-investigacion-0" value="0" required><span>El color de las pestañas</span></label><label class="reading-option"><input type="radio" name="datos-investigacion-0" value="1" required><span>Las unidades y qué representa cada fila</span></label><label class="reading-option"><input type="radio" name="datos-investigacion-0" value="2" required><span>El nombre del dashboard</span></label><p data-question-feedback class="reading-feedback"></p></fieldset><fieldset data-answer="0" data-explanation="Conservar el origen permite reconstruir el análisis."><legend>2. ¿Qué haces con el archivo original?</legend><label class="reading-option"><input type="radio" name="datos-investigacion-1" value="0" required><span>Lo conservas y transformas una copia</span></label><label class="reading-option"><input type="radio" name="datos-investigacion-1" value="1" required><span>Lo reemplazas por el informe</span></label><label class="reading-option"><input type="radio" name="datos-investigacion-1" value="2" required><span>Lo borras al terminar el gráfico</span></label><p data-question-feedback class="reading-feedback"></p></fieldset><fieldset data-answer="2" data-explanation="Una ejecución independiente descubre pasos que quedaron implícitos."><legend>3. ¿Cómo pruebas que la guía sirve?</legend><label class="reading-option"><input type="radio" name="datos-investigacion-2" value="0" required><span>Contando páginas</span></label><label class="reading-option"><input type="radio" name="datos-investigacion-2" value="1" required><span>Agregando más gráficos</span></label><label class="reading-option"><input type="radio" name="datos-investigacion-2" value="2" required><span>Pidiendo a otra persona que repita el proceso</span></label><p data-question-feedback class="reading-feedback"></p></fieldset><div class="reading-actions"><button type="submit">Comprobar respuestas</button><button type="reset">Reintentar</button></div><p data-activity-result role="status" aria-live="polite"></p><noscript>Activa JavaScript para comprobar tus respuestas.</noscript></form><section class="reading-activity" data-wordsearch data-size="9" data-words="[{&quot;word&quot;: &quot;FUENTE&quot;, &quot;clue&quot;: &quot;Origen de la información (6 letras)&quot;}, {&quot;word&quot;: &quot;VERSION&quot;, &quot;clue&quot;: &quot;Estado identificable de un archivo (7 letras)&quot;}, {&quot;word&quot;: &quot;REGLA&quot;, &quot;clue&quot;: &quot;Criterio explícito para transformar datos (5 letras)&quot;}]"><span class="reading-activity__eyebrow">Sopa de letras</span><h2>Tres conceptos escondidos</h2><p>Resuelve las pistas con lo leído. Pulsa la primera y la última letra; también puedes usar Tab y Enter. Busca en horizontal, vertical o diagonal, sin tildes.</p><ul class="reading-clues"><li data-word="FUENTE">Origen de la información (6 letras)</li><li data-word="VERSION">Estado identificable de un archivo (7 letras)</li><li data-word="REGLA">Criterio explícito para transformar datos (5 letras)</li></ul><div class="wordsearch-grid" role="group" aria-label="Sopa de letras de nueve filas"><button type="button" data-cell aria-pressed="false" aria-label="Fila 1, columna 1: F">F</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 1, columna 2: U">U</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 1, columna 3: E">E</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 1, columna 4: N">N</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 1, columna 5: T">T</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 1, columna 6: E">E</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 1, columna 7: B">B</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 1, columna 8: L">L</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 1, columna 9: L">L</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 2, columna 1: S">S</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 2, columna 2: P">P</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 2, columna 3: H">H</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 2, columna 4: B">B</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 2, columna 5: E">E</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 2, columna 6: C">C</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 2, columna 7: V">V</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 2, columna 8: H">H</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 2, columna 9: V">V</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 3, columna 1: K">K</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 3, columna 2: U">U</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 3, columna 3: D">D</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 3, columna 4: E">E</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 3, columna 5: H">H</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 3, columna 6: D">D</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 3, columna 7: H">H</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 3, columna 8: T">T</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 3, columna 9: E">E</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 4, columna 1: R">R</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 4, columna 2: E">E</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 4, columna 3: U">U</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 4, columna 4: L">L</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 4, columna 5: R">R</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 4, columna 6: K">K</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 4, columna 7: E">E</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 4, columna 8: I">I</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 4, columna 9: R">R</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 5, columna 1: R">R</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 5, columna 2: E">E</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 5, columna 3: D">D</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 5, columna 4: S">S</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 5, columna 5: R">R</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 5, columna 6: B">B</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 5, columna 7: K">K</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 5, columna 8: H">H</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 5, columna 9: S">S</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 6, columna 1: G">G</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 6, columna 2: L">L</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 6, columna 3: G">G</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 6, columna 4: V">V</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 6, columna 5: P">P</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 6, columna 6: B">B</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 6, columna 7: B">B</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 6, columna 8: H">H</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 6, columna 9: I">I</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 7, columna 1: J">J</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 7, columna 2: M">M</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 7, columna 3: N">N</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 7, columna 4: L">L</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 7, columna 5: F">F</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 7, columna 6: J">J</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 7, columna 7: B">B</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 7, columna 8: A">A</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 7, columna 9: O">O</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 8, columna 1: I">I</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 8, columna 2: M">M</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 8, columna 3: N">N</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 8, columna 4: B">B</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 8, columna 5: A">A</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 8, columna 6: F">F</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 8, columna 7: I">I</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 8, columna 8: C">C</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 8, columna 9: N">N</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 9, columna 1: I">I</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 9, columna 2: S">S</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 9, columna 3: F">F</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 9, columna 4: A">A</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 9, columna 5: F">F</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 9, columna 6: K">K</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 9, columna 7: E">E</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 9, columna 8: N">N</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 9, columna 9: V">V</button></div><button type="button" data-reset-game>Reiniciar tablero</button><p data-activity-result role="status" aria-live="polite"></p><details><summary>Ver soluciones</summary><p>FUENTE, VERSION, REGLA</p></details></section><section class="reading-activity reading-activity--poll" data-reading-poll><span class="reading-activity__eyebrow">Encuesta personal</span><h2>¿En qué punto estás tú?</h2><p>Elige tu situación y recibe una sugerencia. Tu elección se guarda solo en este navegador; no contamos votos ni enviamos respuestas.</p><div class="reading-poll-options"><button type="button" data-poll-choice aria-pressed="false" data-advice="Comienza con un inventario: archivo, responsable, unidad y fecha.">Tengo planillas dispersas</button><button type="button" data-poll-choice aria-pressed="false" data-advice="Comprueba que cada indicador tenga una definición y una fuente identificable.">Ya tengo un dashboard</button><button type="button" data-poll-choice aria-pressed="false" data-advice="Documenta primero las reglas; después conviértelas en un flujo reproducible.">Necesito automatizar</button></div><p data-activity-result role="status" aria-live="polite"></p></section><section class="editorial-section editorial-section--closing"><h2>Tu siguiente paso, en una frase</h2><p>Completa esto: «Quiero ayudar a ___ a resolver ___ y sabré que avancé cuando ___». En Solven Labs acompañamos a universidades, estudiantes y personas en el creación de prototipos, aplicaciones, análisis de datos y conexión de herramientas de sus proyectos de investigación e innovación.</p><a class="reading-contact" href="/contacto">Conversemos sobre tu proyecto →</a></section>
`
  },
  {
    id: 'realidad-prototipo',
    slug: 'software-a-medida-o-herramienta-lista',
    title: 'Del PowerPoint al prototipo: lo que el cronograma no te cuenta',
    excerpt: 'Qué construir, qué necesitas y cómo probarlo: una guía para poner tu proyecto en marcha.',
    category: 'Desarrollo y prototipos',
    tags: ['Desarrollo y prototipos', 'Investigación e innovación', 'universidades', 'prototipos'],
    author_name: 'Equipo Solven Labs',
    published_at: '2026-09-10T12:00:00-03:00',
    updated_at: '2026-10-08T12:00:00-03:00',
    featured: false,
    cover_image: '/assets/blog-idi/realidad-prototipo-cover.svg',
    cover_alt: 'Ilustración del camino entre una presentación y un prototipo, con accesos y pruebas intermedias',
    seo_title: 'Del PowerPoint al prototipo: lo que el cronograma no te cuenta | Solven Labs',
    seo_description: 'Qué construir, qué necesitas y cómo probarlo: una guía para poner tu proyecto en marcha.',
    content: `
<div class="reading-intro"><span>Guías para crear e investigar</span><p>Lectura + 3 preguntas + una actividad. Los ejemplos de equipos y proyectos son situaciones ilustrativas.</p></div><section class="editorial-section editorial-section--intro"><h2>La demo funciona. Siempre que nadie toque ese botón</h2><p>En la presentación todo fluye. En la primera prueba, una persona usa un apellido largo, otra pierde conexión y alguien pregunta cómo recuperar una contraseña. Bienvenidos al momento en que una idea conoce al mundo real. No significa que el proyecto haya fracasado; significa que comenzaron las preguntas útiles.</p><p>Un prototipo es una herramienta para aprender y comprobar decisiones. No necesita tener todo lo que tendrá la solución final, pero sí debe permitir probar aquello que prometió. Si quieres evaluar un flujo de reservas, quizá necesitas reservar, cancelar y ver disponibilidad. Una animación impecable del logo puede esperar.</p></section><figure class="editorial-media"><img src="/assets/blog-idi/prototipo-alcance.svg" alt="Una pregunta antes de cien funciones: Hipótesis, ¿Qué crees que mejorará?; Función esencial, ¿Qué permite comprobarlo?; Criterio, ¿Qué resultado aceptarás?" loading="lazy" decoding="async" width="1200" height="680"><figcaption>Prototipar consiste en elegir qué aprender primero.</figcaption></figure><section class="editorial-section editorial-section--text"><h2>El enemigo silencioso: las dependencias</h2><p>Piensa en un prototipo universitario que debe consultar un sistema institucional. El desarrollo depende de credenciales, documentación y permisos. Si nadie los gestiona, sumar programadores no resuelve la espera. Una dependencia es algo que debe ocurrir para que otra tarea avance.</p><p>En la planificación, cada dependencia necesita una persona responsable y una fecha de revisión. Mientras llega el acceso, el equipo puede probar con datos ficticios claramente identificados. Esa simulación ayuda a avanzar, pero no equivale a una integración validada con el sistema real.</p></section><section class="editorial-section editorial-section--text"><h2>Tres conversaciones que ahorran el «yo pensé que incluía eso»</h2><p><strong>Alcance:</strong> qué escenarios se implementan y cuáles quedan para después. <strong>Entrega:</strong> qué recibirá el equipo, además de un enlace. <strong>Aceptación:</strong> qué pruebas mostrarán que lo acordado funciona. Son conversaciones distintas; ninguna se reemplaza con «que sea fácil de usar».</p><p>Si aparece una idea nueva, registra su impacto antes de incorporarla: ¿cambia el plazo, el esfuerzo o la pregunta que se estaba validando? Una lista de pendientes permite conservar la idea sin convertir cada reunión en una ampliación automática del proyecto.</p></section><figure class="editorial-media"><img src="/assets/blog-idi/prototipo-realidad.svg" alt="La entrega tiene más de una pieza: Uso, Escenarios probados y límites conocidos.; Continuidad, Código, accesos y documentación acordados.; Siguiente paso, Hallazgos y prioridades de evolución." loading="lazy" decoding="async" width="1200" height="680"><figcaption>Una entrega revisable facilita que el conocimiento permanezca en el equipo.</figcaption></figure><section class="editorial-section editorial-section--text"><h2>Mini historia: el botón que no había que construir</h2><p>Un equipo quiere una plataforma para reclutar participantes. Su primera lista incluye mensajería, perfiles, agenda y certificados. Al conversar con quienes la usarán, descubre que la dificultad principal es entender los requisitos de participación. Un formulario claro y una revisión guiada pueden probar esa parte antes de construir el resto.</p><p>Este ejemplo es hipotético, pero la decisión es transferible: empieza por la incertidumbre con mayor impacto. No confundas cantidad de funciones con cantidad de aprendizaje. Un prototipo pequeño que permite descartar una mala suposición puede ser más útil que una plataforma grande construida sobre ella.</p></section><section class="editorial-section editorial-section--text"><h2>El día después también existe</h2><p>Antes de cerrar, definan quién administrará la solución, dónde se alojará y cómo reportar incidencias. Desarrollo y operación son trabajos diferentes: pueden tener costos y responsables distintos. También conviene acordar qué ocurrirá si cambian las personas del equipo.</p><p>El éxito de una primera etapa puede ser continuar, cambiar de dirección o detenerse con una explicación fundada. La decisión debe apoyarse en pruebas y hallazgos, no únicamente en el entusiasmo del lanzamiento. El cronograma empieza a servir cuando también muestra esas decisiones.</p></section><form class="reading-activity" data-reading-quiz><span class="reading-activity__eyebrow">Repasa lo aprendido</span><h2>¿Te quedaste con lo importante?</h2><p>Tres decisiones, sin cronómetro. Puedes volver al texto y reintentar.</p><fieldset data-answer="1" data-explanation="El prototipo se construye alrededor de una pregunta comprobable."><legend>1. ¿Qué debe permitir un prototipo?</legend><label class="reading-option"><input type="radio" name="realidad-prototipo-0" value="0" required><span>Todas las funciones del producto final</span></label><label class="reading-option"><input type="radio" name="realidad-prototipo-0" value="1" required><span>Comprobar la hipótesis acordada</span></label><label class="reading-option"><input type="radio" name="realidad-prototipo-0" value="2" required><span>Reemplazar toda la documentación</span></label><p data-question-feedback class="reading-feedback"></p></fieldset><fieldset data-answer="0" data-explanation="Los accesos y permisos condicionan el avance de la integración."><legend>2. Falta una credencial institucional. ¿Qué es?</legend><label class="reading-option"><input type="radio" name="realidad-prototipo-1" value="0" required><span>Una dependencia que debe gestionarse</span></label><label class="reading-option"><input type="radio" name="realidad-prototipo-1" value="1" required><span>Un detalle visual</span></label><label class="reading-option"><input type="radio" name="realidad-prototipo-1" value="2" required><span>Una prueba de que hace falta otro logo</span></label><p data-question-feedback class="reading-feedback"></p></fieldset><fieldset data-answer="2" data-explanation="Una simulación permite avanzar, pero su alcance debe quedar explícito."><legend>3. ¿Los datos ficticios validan una integración real?</legend><label class="reading-option"><input type="radio" name="realidad-prototipo-2" value="0" required><span>Sí, si la demo se ve bien</span></label><label class="reading-option"><input type="radio" name="realidad-prototipo-2" value="1" required><span>Sí, siempre</span></label><label class="reading-option"><input type="radio" name="realidad-prototipo-2" value="2" required><span>No; falta probar con el sistema real</span></label><p data-question-feedback class="reading-feedback"></p></fieldset><div class="reading-actions"><button type="submit">Comprobar respuestas</button><button type="reset">Reintentar</button></div><p data-activity-result role="status" aria-live="polite"></p><noscript>Activa JavaScript para comprobar tus respuestas.</noscript></form><section class="reading-activity reading-activity--poll" data-reading-poll><span class="reading-activity__eyebrow">Encuesta personal</span><h2>¿En qué punto estás tú?</h2><p>Elige tu situación y recibe una sugerencia. Tu elección se guarda solo en este navegador; no contamos votos ni enviamos respuestas.</p><div class="reading-poll-options"><button type="button" data-poll-choice aria-pressed="false" data-advice="Escribe la hipótesis y una prueba pequeña antes de listar funcionalidades.">Estoy definiendo la idea</button><button type="button" data-poll-choice aria-pressed="false" data-advice="Revisa las dependencias: accesos, datos, validadores y decisiones pendientes.">Ya estamos construyendo</button><button type="button" data-poll-choice aria-pressed="false" data-advice="Comprueba la documentación, los responsables y las pruebas de aceptación.">Estamos por entregar</button></div><p data-activity-result role="status" aria-live="polite"></p></section><section class="editorial-section editorial-section--closing"><h2>Tu siguiente paso, en una frase</h2><p>Completa esto: «Quiero ayudar a ___ a resolver ___ y sabré que avancé cuando ___». En Solven Labs acompañamos a universidades, estudiantes y personas en el creación de prototipos, aplicaciones, análisis de datos y conexión de herramientas de sus proyectos de investigación e innovación.</p><a class="reading-contact" href="/contacto">Conversemos sobre tu proyecto →</a></section>
`
  },
  {
    id: 'ia-investigacion',
    slug: 'inteligencia-artificial-en-la-empresa-con-resultados',
    title: 'Ponerle IA no cuenta como hipótesis: cómo probar si aporta',
    excerpt: 'Una guía para evaluar IA en investigación sin confundir una respuesta convincente con evidencia, con ejercicios de lectura.',
    category: 'IA aplicada',
    tags: ['IA aplicada', 'Investigación e innovación', 'universidades', 'prototipos'],
    author_name: 'Equipo Solven Labs',
    published_at: '2026-08-27T12:00:00-03:00',
    updated_at: '2026-10-08T12:00:00-03:00',
    featured: false,
    cover_image: '/assets/blog-idi/ia-investigacion-cover.svg',
    cover_alt: 'Ilustración de una respuesta de IA examinada con lupa para verificar fuentes, criterios y revisión',
    seo_title: 'Ponerle IA no cuenta como hipótesis: cómo probar si aporta | Solven Labs',
    seo_description: 'Una guía para evaluar IA en investigación sin confundir una respuesta convincente con evidencia, con ejercicios de lectura.',
    content: `
<div class="reading-intro"><span>Guías para crear e investigar</span><p>Lectura + 3 preguntas + una actividad. Los ejemplos de equipos y proyectos son situaciones ilustrativas.</p></div><section class="editorial-section editorial-section--intro"><h2>El asistente respondió perfecto. O eso parecía</h2><p>Un equipo le pide a un asistente que encuentre una conclusión en sus documentos. La respuesta suena segura y tiene una redacción impecable. Al abrir la fuente, descubren que la conclusión no estaba allí. La fluidez del texto no es una medida suficiente de calidad.</p><p>Para un piloto de investigación, empieza por una tarea concreta: recuperar fragmentos relevantes, clasificar documentos o preparar un borrador que alguien revisará. «Usar inteligencia artificial» describe una herramienta. La hipótesis debería explicar qué mejora esperas, para quién y cómo la comprobarás.</p></section><figure class="editorial-media"><img src="/assets/blog-idi/ia-comparar.svg" alt="La pregunta es: ¿mejora la tarea?: Referencia, Mide cómo se hace hoy.; Prueba, Usa casos representativos.; Decisión, Compara calidad, tiempo y errores." loading="lazy" decoding="async" width="1200" height="680"><figcaption>El punto de referencia evita evaluar un piloto solo por impresión.</figcaption></figure><section class="editorial-section editorial-section--text"><h2>El conjunto de evaluación: tus casos de prueba favoritos</h2><p>Reúne ejemplos del trabajo real y define qué considerarías una respuesta aceptable. Incluye casos fáciles, ambiguos y situaciones donde falta información. Para un buscador documental, pedir que indique el fragmento utilizado permite comprobar si la respuesta está respaldada.</p><p>Reserva algunos casos para la evaluación final. Si ajustas la solución mirando siempre los mismos ejemplos, puedes terminar optimizando para ese pequeño grupo. Que funcione en tres demostraciones seleccionadas no demuestra que funcione igual con documentos nuevos.</p></section><section class="editorial-section editorial-section--text"><h2>Un tablero de evaluación que no necesita fuegos artificiales</h2><ul><li><strong>Calidad:</strong> ¿resuelve correctamente la tarea según los criterios acordados?</li><li><strong>Errores:</strong> ¿qué se equivoca y qué consecuencias tendría usarlo sin revisar?</li><li><strong>Tiempo:</strong> ¿incluiste los minutos que toma corregir la salida?</li><li><strong>Costo:</strong> ¿consideraste uso del modelo, infraestructura y mantenimiento?</li><li><strong>Revisión:</strong> ¿quién decide si el resultado se utiliza?</li></ul><p>Las métricas dependen de la tarea. Una herramienta para ordenar archivos no se evalúa como una que apoya decisiones sobre personas. Define con el equipo qué errores son tolerables y en qué escenarios la herramienta debe pedir ayuda.</p></section><figure class="editorial-media"><img src="/assets/blog-idi/ia-supervision.svg" alt="Tres salidas posibles, no solo responder: Responder, Existe información suficiente y verificable.; Pedir contexto, Faltan datos para completar la tarea.; Escalar, Una persona debe revisar la decisión." loading="lazy" decoding="async" width="1200" height="680"><figcaption>La supervisión debe tener responsables y un lugar concreto en el flujo.</figcaption></figure><section class="editorial-section editorial-section--text"><h2>La carpeta entera no es un dataset listo</h2><p>Antes de conectar documentos, revisa formatos, permisos y contenido sensible. Haz el primer ensayo con información autorizada y una muestra adecuada a la pregunta. Documenta qué archivos entraron, qué versión de la configuración usaste y qué limitaciones encontraste.</p><p>Imagina una prueba para clasificar resúmenes de proyectos. Si casi todos los ejemplos son del mismo departamento, el resultado puede no representar otros contextos. En vez de prometer «sirve para toda la universidad», describe dónde se probó y qué falta evaluar.</p></section><section class="editorial-section editorial-section--text"><h2>La conclusión menos vistosa puede ser la más útil</h2><p>Después de comparar, puede que un buscador tradicional resuelva la tarea con menor complejidad. También puede que la IA ayude en una parte y empeore otra. Ambas conclusiones son útiles si se apoyan en un procedimiento reproducible.</p><p>Un piloto serio entrega más que un chat: casos de prueba, criterios, resultados, límites y una recomendación de continuidad. Si el equipo sabe cuándo confiar, cuándo revisar y cuándo detener el flujo, habrá ganado algo más valioso que una demo sorprendente.</p></section><form class="reading-activity" data-reading-quiz><span class="reading-activity__eyebrow">Repasa lo aprendido</span><h2>¿Te quedaste con lo importante?</h2><p>Tres decisiones, sin cronómetro. Puedes volver al texto y reintentar.</p><fieldset data-answer="2" data-explanation="La forma de escribir no demuestra que el contenido esté respaldado."><legend>1. ¿Qué vale más que una respuesta muy fluida?</legend><label class="reading-option"><input type="radio" name="ia-investigacion-0" value="0" required><span>Un tono más seguro</span></label><label class="reading-option"><input type="radio" name="ia-investigacion-0" value="1" required><span>Una respuesta más larga</span></label><label class="reading-option"><input type="radio" name="ia-investigacion-0" value="2" required><span>Comprobarla con criterios y fuentes</span></label><p data-question-feedback class="reading-feedback"></p></fieldset><fieldset data-answer="0" data-explanation="Separar casos ayuda a evaluar cómo responde ante ejemplos nuevos."><legend>2. ¿Por qué reservar casos de evaluación?</legend><label class="reading-option"><input type="radio" name="ia-investigacion-1" value="0" required><span>Para comprobar ejemplos no usados en los ajustes</span></label><label class="reading-option"><input type="radio" name="ia-investigacion-1" value="1" required><span>Para esconder resultados</span></label><label class="reading-option"><input type="radio" name="ia-investigacion-1" value="2" required><span>Para evitar revisar errores</span></label><p data-question-feedback class="reading-feedback"></p></fieldset><fieldset data-answer="1" data-explanation="Corregir salidas también consume tiempo del equipo."><legend>3. ¿Qué tiempo debes medir?</legend><label class="reading-option"><input type="radio" name="ia-investigacion-2" value="0" required><span>Solo la espera del modelo</span></label><label class="reading-option"><input type="radio" name="ia-investigacion-2" value="1" required><span>La tarea completa, incluida la corrección</span></label><label class="reading-option"><input type="radio" name="ia-investigacion-2" value="2" required><span>El tiempo de diseñar el logo</span></label><p data-question-feedback class="reading-feedback"></p></fieldset><div class="reading-actions"><button type="submit">Comprobar respuestas</button><button type="reset">Reintentar</button></div><p data-activity-result role="status" aria-live="polite"></p><noscript>Activa JavaScript para comprobar tus respuestas.</noscript></form><section class="reading-activity reading-activity--poll" data-reading-poll><span class="reading-activity__eyebrow">Encuesta personal</span><h2>¿En qué punto estás tú?</h2><p>Elige tu situación y recibe una sugerencia. Tu elección se guarda solo en este navegador; no contamos votos ni enviamos respuestas.</p><div class="reading-poll-options"><button type="button" data-poll-choice aria-pressed="false" data-advice="Reescríbela como una tarea y un criterio de mejora antes de elegir herramientas.">Tengo una idea con IA</button><button type="button" data-poll-choice aria-pressed="false" data-advice="Prepara casos nuevos, ambiguos y con información insuficiente.">Ya tengo una demo</button><button type="button" data-poll-choice aria-pressed="false" data-advice="Define supervisión, costos de uso y cómo se reportan errores.">Quiero integrarla</button></div><p data-activity-result role="status" aria-live="polite"></p></section><section class="editorial-section editorial-section--closing"><h2>Tu siguiente paso, en una frase</h2><p>Completa esto: «Quiero ayudar a ___ a resolver ___ y sabré que avancé cuando ___». En Solven Labs acompañamos a universidades, estudiantes y personas en el creación de prototipos, aplicaciones, análisis de datos y conexión de herramientas de sus proyectos de investigación e innovación.</p><a class="reading-contact" href="/contacto">Conversemos sobre tu proyecto →</a></section>
`
  },
  {
    id: 'mitos-fondos',
    slug: 'mitos-fondos-concursables-proyectos-idi',
    title: 'Fondos concursables: cinco mitos que tu proyecto no necesita',
    excerpt: 'Una idea buena no reemplaza las bases. Desarmamos mitos de financiamiento con fuentes oficiales, quiz y sopa de letras.',
    category: 'Fondos concursables',
    tags: ['Fondos concursables', 'Investigación e innovación', 'universidades', 'prototipos'],
    author_name: 'Equipo Solven Labs',
    published_at: '2026-10-08T12:00:00-03:00',
    updated_at: '2026-10-08T12:00:00-03:00',
    featured: true,
    cover_image: '/assets/blog-idi/mitos-fondos-cover.svg',
    cover_alt: 'Ilustración de mitos tachados junto a una lista de elegibilidad, objetivos y aportes',
    seo_title: 'Fondos concursables: cinco mitos que tu proyecto no necesita | Solven Labs',
    seo_description: 'Una idea buena no reemplaza las bases. Desarmamos mitos de financiamiento con fuentes oficiales, quiz y sopa de letras.',
    content: `
<div class="reading-intro"><span>Guías para crear e investigar</span><p>Lectura + 3 preguntas + una actividad. Los ejemplos de equipos y proyectos son situaciones ilustrativas.</p></div><section class="editorial-section editorial-section--intro"><h2>Mito 1: «Si la idea es buena, cualquier fondo sirve»</h2><p>Es tentador empezar por el monto más grande. Pero una convocatoria es una combinación de objetivo, postulantes, actividades y resultados esperados. Una propuesta puede ser interesante y no encajar en ese instrumento. Elegir el fondo se parece más a buscar una pieza compatible que a comprar un boleto de suerte.</p><p>Haz una ficha antes de escribir: quién postula, qué problema aborda el instrumento y en qué etapa debe estar el proyecto. Si una respuesta es «no sé», toca revisar las <strong>bases</strong>: el documento que establece las reglas del concurso. No uses un resumen de redes sociales como reemplazo.</p></section><figure class="editorial-media"><img src="/assets/blog-idi/fondos-encaje.svg" alt="El fondo correcto empieza por el encaje: Quién, Comprueba la entidad o persona elegible.; Para qué, Relaciona el objetivo con tu proyecto.; Cómo, Revisa gastos, aportes y entregables." loading="lazy" decoding="async" width="1200" height="680"><figcaption>Una ficha de convocatoria ayuda a detectar incompatibilidades temprano.</figcaption></figure><section class="editorial-section editorial-section--text"><h2>Mito 2: «Como soy estudiante, postulo igual que una universidad»</h2><p>No necesariamente. En la orientación de ANID para IDeA de Investigación Tecnológica 2026, las entidades beneficiarias son personas jurídicas nacionales sin fines de lucro que cumplen condiciones de investigación y desarrollo; no equivale a una postulación individual de cualquier estudiante. Si trabajas dentro de una universidad, conversa con la unidad que gestiona proyectos y transferencia.</p><p>La ficha de Semilla Inicia de Corfo, por su parte, contempla personas naturales y determinadas personas jurídicas. Son instrumentos con propósitos y requisitos diferentes. Estos ejemplos muestran por qué hay que comprobar el perfil de la convocatoria concreta, no asumir elegibilidad por el nombre del fondo.</p><p class="reading-source">Fuentes: <a href="https://ayuda.anid.gob.cl/hc/es/articles/4405839350932-Entidades-Beneficiarias-Concurso-de-Investigaci%C3%B3n-Tecnol%C3%B3gica-IDeA-2026">ANID: entidades beneficiarias IDeA 2026</a> y <a href="https://www.corfo.gob.cl/sites/cpp/programa/semilla-inicia/">Corfo: Semilla Inicia</a>. Consulta editorial: 8 de octubre de 2026. Revisa las bases del llamado específico; esto no anuncia convocatorias abiertas.</p></section><section class="editorial-section editorial-section--text"><h2>Mito 3: «Financiado significa que no necesito poner nada»</h2><p>La ficha de Semilla Inicia describe cofinanciamiento para validación técnica y comercial. Esa palabra merece una pausa: el instrumento puede financiar una parte del proyecto, no necesariamente cada gasto o todo su costo. Los aportes, categorías y condiciones deben revisarse en las bases correspondientes.</p><p>Prepara un <strong>aporte</strong> cuando el instrumento lo exija y distingue el costo total de la parte solicitada. Como ejercicio de planificación, piensa también cuándo necesitarás pagar cada actividad y qué documentos permitirán respaldarla. No todos los gastos de una buena idea son automáticamente financiables.</p></section><figure class="editorial-media"><img src="/assets/blog-idi/fondos-presupuesto.svg" alt="Un presupuesto cuenta una historia: Actividad, ¿Qué vas a hacer?; Recurso, ¿Qué necesitas para hacerlo?; Evidencia, ¿Cómo mostrarás el resultado?" loading="lazy" decoding="async" width="1200" height="680"><figcaption>Esquema de planificación, no una lista de gastos autorizados para todos los fondos.</figcaption></figure><section class="editorial-section editorial-section--text"><h2>Mito 4: «Adjudicar es la línea de llegada»</h2><p>Obtener financiamiento no construye por sí solo una plataforma ni organiza a un equipo. Después vienen decisiones, compras, desarrollo, pruebas y seguimiento según las condiciones del proyecto. Un <strong>hito</strong> es un punto de revisión con un resultado verificable: por ejemplo, una prueba realizada y documentada, no solo «avanzamos bastante».</p><p>En tu planificación, relaciona cada hito con un responsable y una evidencia. Así puedes distinguir una tarea terminada de una promesa. Un calendario lleno de reuniones puede esconder que aún no hay nadie encargado de validar el prototipo.</p></section><section class="editorial-section editorial-section--text"><h2>Mito 5: «Un socio tecnológico garantiza que voy a ganar»</h2><p>Nadie debería convertir una propuesta técnica en una promesa de adjudicación. Un equipo tecnológico puede ayudar a definir entregables, esfuerzo, dependencias y pruebas. Eso aporta claridad al proyecto; la selección sigue dependiendo del proceso del concurso.</p><p>Antes de pedir una cotización, lleva una página con el problema, usuarios, resultados esperados y restricciones. Pregunta qué incluye la implementación y qué costos de operación quedarán después. El mejor momento para descubrir una dependencia importante es antes de comprometer el plan.</p><p>Tu misión final: abre las bases y marca elegibilidad, etapas, gastos, aportes y obligaciones. Si algo es ambiguo, usa los canales oficiales de consulta. El mito pierde fuerza cuando aparece una pregunta bien formulada.</p></section><form class="reading-activity" data-reading-quiz><span class="reading-activity__eyebrow">Repasa lo aprendido</span><h2>¿Te quedaste con lo importante?</h2><p>Tres decisiones, sin cronómetro. Puedes volver al texto y reintentar.</p><fieldset data-answer="0" data-explanation="Una buena idea necesita encajar con las condiciones del instrumento."><legend>1. ¿Qué revisas primero al elegir un fondo?</legend><label class="reading-option"><input type="radio" name="mitos-fondos-0" value="0" required><span>La elegibilidad y el objetivo de la convocatoria</span></label><label class="reading-option"><input type="radio" name="mitos-fondos-0" value="1" required><span>Solo el monto</span></label><label class="reading-option"><input type="radio" name="mitos-fondos-0" value="2" required><span>El diseño del formulario</span></label><p data-question-feedback class="reading-feedback"></p></fieldset><fieldset data-answer="1" data-explanation="Hay que distinguir costo total, financiamiento solicitado y aportes."><legend>2. ¿Qué significa que un instrumento cofinancie?</legend><label class="reading-option"><input type="radio" name="mitos-fondos-1" value="0" required><span>Que cualquier gasto está cubierto</span></label><label class="reading-option"><input type="radio" name="mitos-fondos-1" value="1" required><span>Que puede cubrir una parte según sus reglas</span></label><label class="reading-option"><input type="radio" name="mitos-fondos-1" value="2" required><span>Que nunca existen aportes</span></label><p data-question-feedback class="reading-feedback"></p></fieldset><fieldset data-answer="2" data-explanation="La decisión corresponde al proceso de selección del concurso."><legend>3. ¿Un socio tecnológico garantiza adjudicación?</legend><label class="reading-option"><input type="radio" name="mitos-fondos-2" value="0" required><span>Sí, con un prototipo bonito</span></label><label class="reading-option"><input type="radio" name="mitos-fondos-2" value="1" required><span>Sí, si lo promete</span></label><label class="reading-option"><input type="radio" name="mitos-fondos-2" value="2" required><span>No; puede aportar una propuesta técnica clara</span></label><p data-question-feedback class="reading-feedback"></p></fieldset><div class="reading-actions"><button type="submit">Comprobar respuestas</button><button type="reset">Reintentar</button></div><p data-activity-result role="status" aria-live="polite"></p><noscript>Activa JavaScript para comprobar tus respuestas.</noscript></form><section class="reading-activity" data-wordsearch data-size="9" data-words="[{&quot;word&quot;: &quot;BASES&quot;, &quot;clue&quot;: &quot;Documento con las reglas del concurso (5 letras)&quot;}, {&quot;word&quot;: &quot;APORTE&quot;, &quot;clue&quot;: &quot;Contribución que puede exigir el instrumento (6 letras)&quot;}, {&quot;word&quot;: &quot;HITO&quot;, &quot;clue&quot;: &quot;Punto de revisión verificable (4 letras)&quot;}]"><span class="reading-activity__eyebrow">Sopa de letras</span><h2>Tres conceptos escondidos</h2><p>Resuelve las pistas con lo leído. Pulsa la primera y la última letra; también puedes usar Tab y Enter. Busca en horizontal, vertical o diagonal, sin tildes.</p><ul class="reading-clues"><li data-word="BASES">Documento con las reglas del concurso (5 letras)</li><li data-word="APORTE">Contribución que puede exigir el instrumento (6 letras)</li><li data-word="HITO">Punto de revisión verificable (4 letras)</li></ul><div class="wordsearch-grid" role="group" aria-label="Sopa de letras de nueve filas"><button type="button" data-cell aria-pressed="false" aria-label="Fila 1, columna 1: B">B</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 1, columna 2: A">A</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 1, columna 3: S">S</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 1, columna 4: E">E</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 1, columna 5: S">S</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 1, columna 6: M">M</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 1, columna 7: F">F</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 1, columna 8: C">C</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 1, columna 9: I">I</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 2, columna 1: K">K</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 2, columna 2: G">G</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 2, columna 3: R">R</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 2, columna 4: J">J</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 2, columna 5: C">C</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 2, columna 6: S">S</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 2, columna 7: S">S</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 2, columna 8: G">G</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 2, columna 9: A">A</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 3, columna 1: K">K</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 3, columna 2: L">L</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 3, columna 3: I">I</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 3, columna 4: J">J</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 3, columna 5: I">I</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 3, columna 6: V">V</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 3, columna 7: C">C</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 3, columna 8: I">I</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 3, columna 9: P">P</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 4, columna 1: H">H</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 4, columna 2: P">P</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 4, columna 3: S">S</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 4, columna 4: C">C</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 4, columna 5: H">H</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 4, columna 6: L">L</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 4, columna 7: U">U</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 4, columna 8: H">H</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 4, columna 9: O">O</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 5, columna 1: E">E</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 5, columna 2: I">I</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 5, columna 3: D">D</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 5, columna 4: B">B</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 5, columna 5: P">P</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 5, columna 6: H">H</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 5, columna 7: M">M</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 5, columna 8: B">B</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 5, columna 9: R">R</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 6, columna 1: C">C</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 6, columna 2: I">I</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 6, columna 3: T">T</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 6, columna 4: C">C</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 6, columna 5: F">F</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 6, columna 6: I">I</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 6, columna 7: V">V</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 6, columna 8: J">J</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 6, columna 9: T">T</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 7, columna 1: H">H</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 7, columna 2: V">V</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 7, columna 3: A">A</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 7, columna 4: O">O</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 7, columna 5: A">A</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 7, columna 6: B">B</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 7, columna 7: V">V</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 7, columna 8: L">L</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 7, columna 9: E">E</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 8, columna 1: M">M</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 8, columna 2: S">S</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 8, columna 3: G">G</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 8, columna 4: L">L</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 8, columna 5: U">U</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 8, columna 6: I">I</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 8, columna 7: I">I</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 8, columna 8: D">D</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 8, columna 9: V">V</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 9, columna 1: N">N</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 9, columna 2: T">T</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 9, columna 3: F">F</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 9, columna 4: A">A</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 9, columna 5: A">A</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 9, columna 6: G">G</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 9, columna 7: N">N</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 9, columna 8: D">D</button><button type="button" data-cell aria-pressed="false" aria-label="Fila 9, columna 9: J">J</button></div><button type="button" data-reset-game>Reiniciar tablero</button><p data-activity-result role="status" aria-live="polite"></p><details><summary>Ver soluciones</summary><p>BASES, APORTE, HITO</p></details></section><section class="reading-activity reading-activity--poll" data-reading-poll><span class="reading-activity__eyebrow">Encuesta personal</span><h2>¿En qué punto estás tú?</h2><p>Elige tu situación y recibe una sugerencia. Tu elección se guarda solo en este navegador; no contamos votos ni enviamos respuestas.</p><div class="reading-poll-options"><button type="button" data-poll-choice aria-pressed="false" data-advice="Prepara una ficha comparando objetivo, elegibilidad y etapa del proyecto.">Busco un fondo</button><button type="button" data-poll-choice aria-pressed="false" data-advice="Une cada entregable con su costo, dependencia y forma de validación.">Estoy postulando</button><button type="button" data-poll-choice aria-pressed="false" data-advice="Convierte el plan en hitos verificables y confirma los responsables.">Ya tengo financiamiento</button></div><p data-activity-result role="status" aria-live="polite"></p></section><section class="editorial-section editorial-section--closing"><h2>Tu siguiente paso, en una frase</h2><p>Completa esto: «Quiero ayudar a ___ a resolver ___ y sabré que avancé cuando ___». En Solven Labs acompañamos a universidades, estudiantes y personas en el creación de prototipos, aplicaciones, análisis de datos y conexión de herramientas de sus proyectos de investigación e innovación.</p><a class="reading-contact" href="/contacto">Conversemos sobre tu proyecto →</a></section>
`
  },
  {
    id: 'tesis-piloto',
    slug: 'de-tesis-a-piloto-universidad',
    title: 'Tu tesis no tiene por qué jubilarse en un PDF',
    excerpt: 'Cómo llevar tu investigación a una primera prueba con usuarios. Incluye ejemplos y un mini crucigrama.',
    category: 'De la investigación a la práctica',
    tags: ['De la investigación a la práctica', 'Investigación e innovación', 'universidades', 'prototipos'],
    author_name: 'Equipo Solven Labs',
    published_at: '2026-10-08T12:00:00-03:00',
    updated_at: '2026-10-08T12:00:00-03:00',
    featured: false,
    cover_image: '/assets/blog-idi/tesis-piloto-cover.svg',
    cover_alt: 'Ilustración de una tesis que se transforma en un cohete hacia usuarios, pruebas y evidencia',
    seo_title: 'Tu tesis no tiene por qué jubilarse en un PDF | Solven Labs',
    seo_description: 'Cómo llevar tu investigación a una primera prueba con usuarios. Incluye ejemplos y un mini crucigrama.',
    content: `
<div class="reading-intro"><span>Guías para crear e investigar</span><p>Lectura + 3 preguntas + una actividad. Los ejemplos de equipos y proyectos son situaciones ilustrativas.</p></div><section class="editorial-section editorial-section--intro"><h2>El PDF está listo. ¿Y ahora qué?</h2><p>Terminaste la defensa, sobreviviste a las correcciones y por fin puedes cerrar veinte pestañas. Pero la pregunta que originó la tesis sigue ahí: ¿podría esto ayudar a alguien fuera de la sala? El siguiente paso no siempre es fundar una empresa. Puede ser una herramienta para un laboratorio, una metodología usable o un piloto con una organización.</p><p>Investigar busca responder preguntas; desarrollar materializa una solución; innovar implica introducir una mejora en un contexto de uso. En la práctica se retroalimentan: una prueba puede abrir una nueva pregunta. No necesitas fingir que tu idea ya tiene todas las respuestas para comenzar a explorar su aplicación.</p></section><figure class="editorial-media"><img src="/assets/blog-idi/tesis-puente.svg" alt="Del conocimiento al uso: Hallazgo, ¿Qué aprendiste en la investigación?; Aplicación, ¿Quién podría usar ese conocimiento?; Piloto, ¿Cómo lo probarás de forma acotada?" loading="lazy" decoding="async" width="1200" height="680"><figcaption>Un piloto no tiene que ser una empresa: puede ser una prueba útil dentro de una institución.</figcaption></figure><section class="editorial-section editorial-section--text"><h2>Busca una persona antes de buscar otra función</h2><p>Supón que investigaste cómo organizar solicitudes de apoyo estudiantil. Antes de proponer una aplicación completa, conversa con quien recibe esas solicitudes y observa su trabajo. Pregunta cuándo se pierde información, qué decisiones se repiten y qué herramientas ya utiliza.</p><p>Evita preguntar únicamente «¿te gustaría mi app?». Es fácil recibir un sí amable. Una pregunta sobre una situación reciente permite entender la tarea: «Cuéntame la última vez que una solicitud quedó sin seguimiento». No conviertas una entrevista exploratoria en una prueba estadística; úsala para mejorar la siguiente pregunta y delimitar el piloto.</p></section><section class="editorial-section editorial-section--text"><h2>Tres piezas que caben en una hoja</h2><p><strong>Datos:</strong> qué información recoge y transforma el proyecto, de dónde viene y quién puede usarla. <strong>Hito:</strong> un punto de revisión con un resultado verificable. <strong>Piloto:</strong> una prueba acotada con usuarios y condiciones reales. Esas tres palabras son las respuestas conceptuales del crucigrama de abajo.</p><p>Una hoja inicial puede describir el problema, participante responsable, tarea que se probará, duración propuesta y evidencia que se recogerá. No pongas un número porque suena ambicioso: explica por qué esa prueba permite aprender algo y cuáles serán sus límites.</p></section><figure class="editorial-media"><img src="/assets/blog-idi/tesis-entrega.svg" alt="Una entrega que no depende de tu memoria: Uso, Guía para ejecutar la tarea.; Técnica, Código, versiones y configuración.; Continuidad, Responsable y próximo hito." loading="lazy" decoding="async" width="1200" height="680"><figcaption>La transferencia comienza cuando otra persona puede entender y usar lo entregado.</figcaption></figure><section class="editorial-section editorial-section--text"><h2>Habla temprano con tu universidad</h2><p>Si el trabajo usa recursos, datos o acuerdos institucionales, coordina con tu profesor guía y las unidades pertinentes antes de compartirlo o comprometer una implementación. Pregunta por permisos, condiciones de uso y cómo se gestionan las contribuciones de las personas involucradas. No supongas que todas las universidades tienen el mismo procedimiento.</p><p>Un socio técnico puede construir una interfaz, conectar fuentes o poner la herramienta en funcionamiento. El equipo académico conserva un rol clave al definir la pregunta y evaluar los resultados. Acordar esas responsabilidades evita que alguien interprete «hacer una plataforma» como «resolver toda la investigación».</p></section><section class="editorial-section editorial-section--text"><h2>Qué llevar a la primera conversación técnica</h2><ul><li>Una explicación breve del problema y de quién lo vive.</li><li>Lo que ya probaste y lo que todavía no sabes.</li><li>Ejemplos de información que puedas compartir.</li><li>Una descripción del escenario que quieres probar.</li><li>Las fechas, recursos y condiciones que limitan la primera etapa.</li></ul><p>No hace falta llegar con una especificación perfecta. Hace falta distinguir hechos de suposiciones. Si el piloto no confirma tu idea, registra qué cambió y por qué. También eso puede convertirse en conocimiento valioso para la siguiente persona que intente resolver el problema.</p><p>El PDF sigue siendo importante. Simplemente no tiene que ser el último lugar donde viva tu trabajo.</p></section><form class="reading-activity" data-reading-quiz><span class="reading-activity__eyebrow">Repasa lo aprendido</span><h2>¿Te quedaste con lo importante?</h2><p>Tres decisiones, sin cronómetro. Puedes volver al texto y reintentar.</p><fieldset data-answer="1" data-explanation="Una experiencia concreta ayuda a entender la tarea y sus dificultades."><legend>1. ¿Qué conviene preguntar a un posible usuario?</legend><label class="reading-option"><input type="radio" name="tesis-piloto-0" value="0" required><span>Si le gusta el color del logo</span></label><label class="reading-option"><input type="radio" name="tesis-piloto-0" value="1" required><span>Por una situación reciente relacionada con el problema</span></label><label class="reading-option"><input type="radio" name="tesis-piloto-0" value="2" required><span>Si promete usar cualquier versión</span></label><p data-question-feedback class="reading-feedback"></p></fieldset><fieldset data-answer="0" data-explanation="El hito necesita evidencia del avance, no solo actividad."><legend>2. ¿Qué es un hito?</legend><label class="reading-option"><input type="radio" name="tesis-piloto-1" value="0" required><span>Un punto de revisión con resultado verificable</span></label><label class="reading-option"><input type="radio" name="tesis-piloto-1" value="1" required><span>Cualquier reunión</span></label><label class="reading-option"><input type="radio" name="tesis-piloto-1" value="2" required><span>Una lista de deseos</span></label><p data-question-feedback class="reading-feedback"></p></fieldset><fieldset data-answer="2" data-explanation="Otra persona debe poder comprender y continuar el trabajo."><legend>3. ¿Qué facilita la transferencia?</legend><label class="reading-option"><input type="radio" name="tesis-piloto-2" value="0" required><span>Guardar los accesos solo en tu computador</span></label><label class="reading-option"><input type="radio" name="tesis-piloto-2" value="1" required><span>Entregar únicamente capturas</span></label><label class="reading-option"><input type="radio" name="tesis-piloto-2" value="2" required><span>Guías, configuración y responsables claros</span></label><p data-question-feedback class="reading-feedback"></p></fieldset><div class="reading-actions"><button type="submit">Comprobar respuestas</button><button type="reset">Reintentar</button></div><p data-activity-result role="status" aria-live="polite"></p><noscript>Activa JavaScript para comprobar tus respuestas.</noscript></form><form class="reading-activity" data-crossword><span class="reading-activity__eyebrow">Mini crucigrama</span><h2>La tesis sale del papel</h2><p>Una letra por casilla, sin tildes. Usa Tab para avanzar; las palabras se cruzan.</p><ol class="reading-clues"><li>Vertical, fila 1, columna 5 (5 letras): información que recoge y transforma tu proyecto.</li><li>Horizontal, fila 3, columna 3 (4 letras): punto de revisión con un resultado verificable.</li><li>Horizontal, fila 4, columna 2 (6 letras): prueba acotada con usuarios y condiciones reales.</li></ol><div class="crossword-grid" role="group" aria-label="Crucigrama de cinco filas y siete columnas"><span class="crossword-block" aria-hidden="true"></span><span class="crossword-block" aria-hidden="true"></span><span class="crossword-block" aria-hidden="true"></span><span class="crossword-block" aria-hidden="true"></span><label class="crossword-cell"><span aria-hidden="true">1</span><input aria-label="Fila 1, columna 5, inicio de palabra 1" data-letter="D" maxlength="1" autocomplete="off" autocapitalize="characters" spellcheck="false"></label><span class="crossword-block" aria-hidden="true"></span><span class="crossword-block" aria-hidden="true"></span><span class="crossword-block" aria-hidden="true"></span><span class="crossword-block" aria-hidden="true"></span><span class="crossword-block" aria-hidden="true"></span><span class="crossword-block" aria-hidden="true"></span><label class="crossword-cell"><span aria-hidden="true"></span><input aria-label="Fila 2, columna 5" data-letter="A" maxlength="1" autocomplete="off" autocapitalize="characters" spellcheck="false"></label><span class="crossword-block" aria-hidden="true"></span><span class="crossword-block" aria-hidden="true"></span><span class="crossword-block" aria-hidden="true"></span><span class="crossword-block" aria-hidden="true"></span><label class="crossword-cell"><span aria-hidden="true">2</span><input aria-label="Fila 3, columna 3, inicio de palabra 2" data-letter="H" maxlength="1" autocomplete="off" autocapitalize="characters" spellcheck="false"></label><label class="crossword-cell"><span aria-hidden="true"></span><input aria-label="Fila 3, columna 4" data-letter="I" maxlength="1" autocomplete="off" autocapitalize="characters" spellcheck="false"></label><label class="crossword-cell"><span aria-hidden="true"></span><input aria-label="Fila 3, columna 5" data-letter="T" maxlength="1" autocomplete="off" autocapitalize="characters" spellcheck="false"></label><label class="crossword-cell"><span aria-hidden="true"></span><input aria-label="Fila 3, columna 6" data-letter="O" maxlength="1" autocomplete="off" autocapitalize="characters" spellcheck="false"></label><span class="crossword-block" aria-hidden="true"></span><span class="crossword-block" aria-hidden="true"></span><label class="crossword-cell"><span aria-hidden="true">3</span><input aria-label="Fila 4, columna 2, inicio de palabra 3" data-letter="P" maxlength="1" autocomplete="off" autocapitalize="characters" spellcheck="false"></label><label class="crossword-cell"><span aria-hidden="true"></span><input aria-label="Fila 4, columna 3" data-letter="I" maxlength="1" autocomplete="off" autocapitalize="characters" spellcheck="false"></label><label class="crossword-cell"><span aria-hidden="true"></span><input aria-label="Fila 4, columna 4" data-letter="L" maxlength="1" autocomplete="off" autocapitalize="characters" spellcheck="false"></label><label class="crossword-cell"><span aria-hidden="true"></span><input aria-label="Fila 4, columna 5" data-letter="O" maxlength="1" autocomplete="off" autocapitalize="characters" spellcheck="false"></label><label class="crossword-cell"><span aria-hidden="true"></span><input aria-label="Fila 4, columna 6" data-letter="T" maxlength="1" autocomplete="off" autocapitalize="characters" spellcheck="false"></label><label class="crossword-cell"><span aria-hidden="true"></span><input aria-label="Fila 4, columna 7" data-letter="O" maxlength="1" autocomplete="off" autocapitalize="characters" spellcheck="false"></label><span class="crossword-block" aria-hidden="true"></span><span class="crossword-block" aria-hidden="true"></span><span class="crossword-block" aria-hidden="true"></span><span class="crossword-block" aria-hidden="true"></span><label class="crossword-cell"><span aria-hidden="true"></span><input aria-label="Fila 5, columna 5" data-letter="S" maxlength="1" autocomplete="off" autocapitalize="characters" spellcheck="false"></label><span class="crossword-block" aria-hidden="true"></span><span class="crossword-block" aria-hidden="true"></span></div><div class="reading-actions"><button type="submit">Comprobar crucigrama</button><button type="reset">Borrar letras</button></div><p data-activity-result role="status" aria-live="polite"></p><details><summary>Ver soluciones</summary><p>1. DATOS · 2. HITO · 3. PILOTO.</p></details></form><section class="reading-activity reading-activity--poll" data-reading-poll><span class="reading-activity__eyebrow">Encuesta personal</span><h2>¿En qué punto estás tú?</h2><p>Elige tu situación y recibe una sugerencia. Tu elección se guarda solo en este navegador; no contamos votos ni enviamos respuestas.</p><div class="reading-poll-options"><button type="button" data-poll-choice aria-pressed="false" data-advice="Registra qué parte podría tener un usuario y qué falta comprobar.">Estoy haciendo mi tesis</button><button type="button" data-poll-choice aria-pressed="false" data-advice="Prepara una hoja con hallazgos, posible aplicación y límites de un piloto.">Ya la terminé</button><button type="button" data-poll-choice aria-pressed="false" data-advice="Identifiquen quién validará resultados y quién sostendrá la solución.">Soy parte de un equipo académico</button></div><p data-activity-result role="status" aria-live="polite"></p></section><section class="editorial-section editorial-section--closing"><h2>Tu siguiente paso, en una frase</h2><p>Completa esto: «Quiero ayudar a ___ a resolver ___ y sabré que avancé cuando ___». En Solven Labs acompañamos a universidades, estudiantes y personas en el creación de prototipos, aplicaciones, análisis de datos y conexión de herramientas de sus proyectos de investigación e innovación.</p><a class="reading-contact" href="/contacto">Conversemos sobre tu proyecto →</a></section>
`
  },
];

// Local reading activities. No answers or votes are sent to a server.
export const normalizeAnswer = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();

export function initReadingActivities(root, slug) {
  root.querySelectorAll('[data-reading-quiz]').forEach(form => {
    form.addEventListener('submit', event => {
      event.preventDefault();
      const questions = [...form.querySelectorAll('fieldset')];
      let correct = 0;
      questions.forEach(question => {
        const selected = question.querySelector('input:checked');
        const ok = selected?.value === question.dataset.answer;
        if (ok) correct++;
        question.querySelector('[data-question-feedback]').textContent = `${ok ? '¡Bien leído!' : 'Repasa esta idea:'} ${question.dataset.explanation}`;
        question.classList.toggle('is-correct', ok);
      });
      form.querySelector('[data-activity-result]').textContent = `${correct} de ${questions.length} respuestas correctas. ${correct === questions.length ? '¡Lectura desbloqueada!' : 'Puedes cambiar tus respuestas y volver a comprobar.'}`;
    });
    form.addEventListener('reset', () => {
      form.querySelectorAll('[data-question-feedback], [data-activity-result]').forEach(node => node.textContent = '');
      form.querySelectorAll('.is-correct').forEach(node => node.classList.remove('is-correct'));
    });
  });

  root.querySelectorAll('[data-reading-poll]').forEach(poll => {
    const key = `ntek-reading:${slug}:poll`;
    const buttons = [...poll.querySelectorAll('[data-poll-choice]')];
    const choose = (index, persist) => {
      const selected = buttons[index];
      if (!selected) return;
      buttons.forEach(button => button.setAttribute('aria-pressed', String(button === selected)));
      poll.querySelector('[data-activity-result]').textContent = selected.dataset.advice;
      if (persist) { try { localStorage.setItem(key, String(index)); } catch (_) { /* Private browsing still works. */ } }
    };
    buttons.forEach((button, index) => button.addEventListener('click', () => choose(index, true)));
    try { const saved = localStorage.getItem(key); if (saved !== null) choose(Number(saved), false); } catch (_) { /* Optional persistence. */ }
  });

  root.querySelectorAll('[data-wordsearch]').forEach(game => {
    const words = JSON.parse(game.dataset.words);
    const cells = [...game.querySelectorAll('[data-cell]')];
    const found = new Set();
    let start = null;
    const result = game.querySelector('[data-activity-result]');
    cells.forEach((cell, index) => cell.addEventListener('click', () => {
      if (start === null) {
        start = index;
        cell.classList.add('is-selected');
        cell.setAttribute('aria-pressed', 'true');
        result.textContent = 'Ahora selecciona la última letra de la palabra.';
        return;
      }
      const size = Number(game.dataset.size);
      const r1 = Math.floor(start / size), c1 = start % size;
      const r2 = Math.floor(index / size), c2 = index % size;
      const dr = r2 - r1, dc = c2 - c1;
      const path = [];
      if (dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc)) {
        for (let n = 0; n <= Math.max(Math.abs(dr), Math.abs(dc)); n++) path.push((r1 + Math.sign(dr) * n) * size + c1 + Math.sign(dc) * n);
      }
      const candidate = path.map(i => cells[i].textContent).join('');
      const word = words.find(item => item.word === candidate || item.word === [...candidate].reverse().join(''));
      cells[start].classList.remove('is-selected');
      cells[start].setAttribute('aria-pressed', 'false');
      start = null;
      if (word) {
        found.add(word.word);
        path.forEach(i => cells[i].classList.add('is-found'));
        game.querySelector(`[data-word="${word.word}"]`).textContent = `✓ ${word.clue}: ${word.word}`;
        result.textContent = `${found.size} de ${words.length} conceptos encontrados. ${found.size === words.length ? '¡Misión completa!' : 'Busca el siguiente.'}`;
      } else result.textContent = 'Esa selección no corresponde a una pista. Prueba otra línea horizontal, vertical o diagonal.';
    }));
    game.querySelector('[data-reset-game]').addEventListener('click', () => {
      start = null;
      found.clear();
      cells.forEach(cell => { cell.classList.remove('is-found', 'is-selected'); cell.setAttribute('aria-pressed', 'false'); });
      words.forEach(word => game.querySelector(`[data-word="${word.word}"]`).textContent = word.clue);
      result.textContent = 'Tablero reiniciado.';
    });
  });

  root.querySelectorAll('[data-crossword]').forEach(form => {
    const cells = [...form.querySelectorAll('[data-letter]')];
    cells.forEach(input => input.addEventListener('input', () => { input.value = normalizeAnswer(input.value).replace(/[^A-Z]/g, '').slice(-1); input.removeAttribute('aria-invalid'); }));
    form.addEventListener('submit', event => {
      event.preventDefault();
      let correct = 0;
      cells.forEach(input => {
        const ok = input.value === input.dataset.letter;
        input.setAttribute('aria-invalid', String(!ok));
        if (ok) correct++;
      });
      form.querySelector('[data-activity-result]').textContent = correct === cells.length ? '¡Completado! Datos, hito y piloto: tres piezas para llevar tu tesis a la práctica.' : `${correct} de ${cells.length} casillas correctas. Revisa las marcadas; las palabras comparten letras.`;
    });
    form.addEventListener('reset', () => { cells.forEach(input => input.removeAttribute('aria-invalid')); form.querySelector('[data-activity-result]').textContent = ''; });
  });
}


const SITE_URL = 'https://solvenlabs.cl';
const POSTS_PER_PAGE = 9;
const state = {
  publicPosts: [...BLOG_POSTS].sort((a, b) => new Date(b.published_at) - new Date(a.published_at)),
  publicCategory: 'all',
  publicSearch: '',
  page: 1
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const stripHtml = (html = '') => { const node = document.createElement('div'); node.innerHTML = html; return (node.textContent || '').trim(); };
const formatDate = value => new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value));
const formatShortDate = value => new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
const readingTime = content => `${Math.max(1, Math.ceil(stripHtml(content).split(/\s+/).filter(Boolean).length / 210))} min de lectura`;
const postUrl = post => `/blog/${encodeURIComponent(post.slug)}/`;
const absolutePostUrl = post => `${SITE_URL}${postUrl(post)}`;

function slugify(value = '') {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '') || 'articulo';
}

function getRequestedSlug() {
  const querySlug = new URLSearchParams(location.search).get('slug');
  if (querySlug) return querySlug;
  const parts = location.pathname.split('/').filter(Boolean);
  return parts[0] === 'blog' && parts[1] && parts[1] !== 'index.html' ? decodeURIComponent(parts[1]) : null;
}

function toast(message) {
  const region = $('#toast-region');
  if (!region) return;
  const element = document.createElement('div');
  element.className = 'toast';
  element.textContent = message;
  region.append(element);
  setTimeout(() => element.remove(), 3200);
}

function initSiteChrome() {
  const navbar = $('.navbar');
  const mobileToggle = $('.navbar__mobile-toggle');
  const mobileMenu = $('.mobile-menu');
  const closeMobile = () => {
    mobileMenu?.classList.remove('open');
    mobileMenu?.setAttribute('aria-hidden', 'true');
    mobileToggle?.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('modal-open');
  };

  mobileToggle?.addEventListener('click', () => {
    const open = !mobileMenu.classList.contains('open');
    mobileMenu.classList.toggle('open', open);
    mobileMenu.setAttribute('aria-hidden', String(!open));
    mobileToggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('modal-open', open);
    const icon = $('.icon', mobileToggle);
    if (icon) icon.setAttribute('data-lucide', open ? 'x' : 'menu');
    window.lucide?.createIcons();
  });
  $$('.mobile-menu__link').forEach(link => link.addEventListener('click', closeMobile));

  $$('.navbar__dropdown-toggle').forEach(toggle => toggle.addEventListener('click', event => {
    event.stopPropagation();
    const dropdown = toggle.closest('.navbar__dropdown');
    const open = !dropdown.classList.contains('open');
    $$('.navbar__dropdown').forEach(item => {
      item.classList.remove('open');
      $('.navbar__dropdown-toggle', item)?.setAttribute('aria-expanded', 'false');
    });
    dropdown.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
  }));
  document.addEventListener('click', event => {
    if (!event.target.closest('.navbar__dropdown')) {
      $$('.navbar__dropdown').forEach(item => {
        item.classList.remove('open');
        $('.navbar__dropdown-toggle', item)?.setAttribute('aria-expanded', 'false');
      });
    }
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMobile(); });
  window.addEventListener('scroll', () => navbar?.classList.toggle('scrolled', scrollY > 50), { passive: true });
  window.lucide?.createIcons();
}

function initBlogNetworkCanvas() {
  const canvas = $('#blog-network-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const hero = canvas.closest('.hero');
  const context = canvas.getContext('2d');
  const particles = [];
  const mouse = { x: null, y: null };
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let width = 0;
  let height = 0;
  let connectionDistance = 150;
  let animationFrame = 0;
  let resizeTimer = 0;

  class Particle {
    constructor() { this.reset(true); }
    reset(randomPosition = false) {
      this.x = randomPosition ? Math.random() * width : 0;
      this.y = Math.random() * height;
      this.vx = (Math.random() - .5) * .8;
      this.vy = (Math.random() - .5) * .8;
      this.baseRadius = Math.random() * 1.7 + .8;
      this.radius = this.baseRadius;
    }
    update() {
      if (!reducedMotion) { this.x += this.vx; this.y += this.vy; }
      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;
      if (mouse.x !== null) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 200) {
          const force = (200 - distance) / 200;
          this.x -= dx * force * .018;
          this.y -= dy * force * .018;
          this.radius = this.baseRadius + force * 2;
        } else this.radius = this.baseRadius;
      }
      context.beginPath();
      context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      context.fillStyle = 'rgba(76,124,175,.9)';
      context.fill();
    }
  }

  const resize = () => {
    const rect = hero.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1, 2);
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const count = width <= 480 ? 34 : width <= 768 ? 52 : 80;
    connectionDistance = width <= 480 ? 110 : width <= 768 ? 135 : 150;
    particles.length = 0;
    for (let index = 0; index < count; index += 1) particles.push(new Particle());
  };
  const draw = () => {
    context.clearRect(0, 0, width, height);
    particles.forEach(particle => particle.update());
    for (let first = 0; first < particles.length; first += 1) {
      for (let second = first + 1; second < particles.length; second += 1) {
        const distance = Math.hypot(particles[first].x - particles[second].x, particles[first].y - particles[second].y);
        if (distance >= connectionDistance) continue;
        context.beginPath();
        context.strokeStyle = `rgba(76,124,175,${(1 - distance / connectionDistance) * .6})`;
        context.lineWidth = 1.25;
        context.moveTo(particles[first].x, particles[first].y);
        context.lineTo(particles[second].x, particles[second].y);
        context.stroke();
      }
    }
    if (!reducedMotion && !document.hidden) animationFrame = requestAnimationFrame(draw);
  };
  hero.addEventListener('mousemove', event => { const rect = hero.getBoundingClientRect(); mouse.x = event.clientX - rect.left; mouse.y = event.clientY - rect.top; });
  hero.addEventListener('mouseleave', () => { mouse.x = null; mouse.y = null; });
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { cancelAnimationFrame(animationFrame); resize(); draw(); }, 180); });
  resize();
  draw();
}

function setView(view) {
  ['blog-list-view', 'article-view'].forEach(id => { const element = $(`#${id}`); if (element) element.hidden = id !== view; });
}

function visualTemplate(post, className = 'post-card__image') {
  if (post.cover_image?.includes('/blog-idi/')) return `<div class="${className} blog-visual blog-visual--infographic"><img src="${escapeHtml(post.cover_image)}" alt="${escapeHtml(post.cover_alt || '')}" loading="lazy" decoding="async"></div>`;
  const visual = post.visual || { theme: 'automation', icon: 'sparkles', label: post.category };
  const isArticleHero = className.includes('article-hero-visual');
  const image = post.cover_image
    ? `<img class="blog-visual__image" src="${escapeHtml(post.cover_image)}" alt="${isArticleHero ? escapeHtml(post.cover_alt || '') : ''}" decoding="async" ${isArticleHero ? 'fetchpriority="high"' : 'loading="lazy"'}>`
    : '';
  return `<div class="${className} blog-visual blog-visual--${escapeHtml(visual.theme)}">${image}<span class="blog-visual__shade" aria-hidden="true"></span><span class="blog-visual__grid" aria-hidden="true"></span><span class="blog-visual__icon"><i data-lucide="${escapeHtml(visual.icon)}"></i></span><strong>${escapeHtml(visual.label)}</strong><small>${escapeHtml(post.category)}</small></div>`;
}

function cardTemplate(post) {
  return `<article class="post-card"><a href="${postUrl(post)}" aria-label="Leer ${escapeHtml(post.title)}">${visualTemplate(post)}</a><div class="post-card__body"><div class="post-meta"><span class="category-pill">${escapeHtml(post.category)}</span><span>${formatShortDate(post.published_at)}</span></div><h3><a href="${postUrl(post)}">${escapeHtml(post.title)}</a></h3><p>${escapeHtml(post.excerpt)}</p><div class="post-card__footer"><span class="post-meta">${readingTime(post.content)}</span><a class="read-link" href="${postUrl(post)}">Leer artículo →</a></div></div></article>`;
}

function renderFeatured() {
  const post = state.publicPosts.find(item => item.featured);
  const section = $('#featured-section');
  if (!post) { section.hidden = true; return; }
  section.hidden = false;
  $('#featured-post').innerHTML = `<article class="featured-card"><a class="featured-card__image" href="${postUrl(post)}">${visualTemplate(post, 'blog-visual blog-visual--featured')}</a><div class="featured-card__content"><div class="post-meta"><span class="category-pill">${escapeHtml(post.category)}</span><span>${formatDate(post.published_at)}</span></div><h3><a href="${postUrl(post)}">${escapeHtml(post.title)}</a></h3><p>${escapeHtml(post.excerpt)}</p><div class="post-meta"><span>${escapeHtml(post.author_name)}</span><span>•</span><span>${readingTime(post.content)}</span></div><div class="featured-card__action"><a class="button button--primary" href="${postUrl(post)}">Leer artículo</a></div></div></article>`;
}

function renderCategories() {
  const categories = [...new Set(state.publicPosts.map(post => post.category))].sort();
  $('#category-chips').innerHTML = ['all', ...categories].map(category => `<button class="chip${state.publicCategory === category ? ' active' : ''}" type="button" data-category="${escapeHtml(category)}">${category === 'all' ? 'Todos' : escapeHtml(category)}</button>`).join('');
}

function renderPublicGrid() {
  const term = state.publicSearch.toLowerCase();
  const filtered = state.publicPosts.filter(post => (state.publicCategory === 'all' || post.category === state.publicCategory) && (!term || `${post.title} ${post.excerpt} ${post.tags.join(' ')}`.toLowerCase().includes(term)));
  const pages = Math.max(1, Math.ceil(filtered.length / POSTS_PER_PAGE));
  state.page = Math.min(state.page, pages);
  const visible = filtered.slice((state.page - 1) * POSTS_PER_PAGE, state.page * POSTS_PER_PAGE);
  $('#posts-grid').innerHTML = visible.map(cardTemplate).join('');
  $('#public-empty').hidden = filtered.length !== 0;
  $('#posts-skeleton').hidden = true;
  $('#pagination').innerHTML = pages > 1 ? Array.from({ length: pages }, (_, index) => `<button type="button" data-page="${index + 1}" class="${state.page === index + 1 ? 'active' : ''}">${index + 1}</button>`).join('') : '';
  window.lucide?.createIcons();
}

function showBlogIndex() {
  setView('blog-list-view');
  const posts = state.publicPosts;
  const averageMinutes = posts.length ? Math.round(posts.reduce((total, post) => total + parseInt(readingTime(post.content), 10), 0) / posts.length) : 0;
  const stats = { articles: posts.length, topics: new Set(posts.map(post => post.category)).size, reading: `${averageMinutes} min` };
  Object.entries(stats).forEach(([key, value]) => {
    const element = $(`[data-blog-stat="${key}"]`);
    if (element) element.textContent = value;
  });
  renderFeatured();
  renderCategories();
  renderPublicGrid();
  window.lucide?.createIcons();
}

function setMeta(selector, content, attribute = 'content') {
  const element = $(selector);
  if (element && content) element.setAttribute(attribute, content);
}

function updateArticleSeo(post) {
  const title = post.seo_title || `${post.title} | Solven Labs`;
  const description = post.seo_description || post.excerpt;
  const url = absolutePostUrl(post);
  document.title = title;
  setMeta('meta[name="description"]', description);
  setMeta('link[rel="canonical"]', url, 'href');
  setMeta('meta[property="og:type"]', 'article');
  setMeta('meta[property="og:title"]', title);
  setMeta('meta[property="og:description"]', description);
  setMeta('meta[property="og:url"]', url);
  if (post.cover_image) setMeta('meta[property="og:image"]', `${SITE_URL}${post.cover_image}`);
  const jsonLd = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title, description, image: post.cover_image ? `${SITE_URL}${post.cover_image}` : undefined, datePublished: post.published_at, dateModified: post.updated_at, author: { '@type': 'Organization', name: post.author_name }, publisher: { '@type': 'Organization', name: 'Solven Labs', logo: { '@type': 'ImageObject', url: `${SITE_URL}/assets/logo%20extended%20chopped.png` } }, mainEntityOfPage: { '@type': 'WebPage', '@id': url }, url, articleSection: post.category, keywords: post.tags.join(', ') };
  $('#blog-jsonld').textContent = JSON.stringify(jsonLd);
}

function renderArticleOverview(container) {
  const headings = [...container.querySelectorAll('h2')];
  if (headings.length < 2) return;
  headings.forEach((heading, index) => { heading.id = `seccion-${index + 1}-${slugify(heading.textContent).slice(0, 36)}`; });
  const overview = document.createElement('aside');
  overview.className = 'editorial-index';
  overview.innerHTML = `<div><span class="eyebrow">Tu ruta de lectura</span><strong>En este artículo</strong></div><nav aria-label="Secciones del artículo">${headings.map((heading, index) => `<a href="#${heading.id}"><span>${String(index + 1).padStart(2, '0')}</span>${escapeHtml(heading.textContent)}</a>`).join('')}</nav>`;
  container.prepend(overview);
}

function showArticle(slug) {
  const post = state.publicPosts.find(item => item.slug === slug);
  if (!post) { location.replace('/404.html'); return; }
  setView('article-view');
  updateArticleSeo(post);
  $('#crumb-title').textContent = post.title;
  $('#article-category').textContent = post.category;
  $('#article-title').textContent = post.title;
  $('#article-excerpt').textContent = post.excerpt;
  $('#article-author').textContent = post.author_name;
  $('#article-date').textContent = formatDate(post.published_at);
  $('#article-date').dateTime = post.published_at;
  $('#article-reading').textContent = readingTime(post.content);
  $('#article-content').innerHTML = post.content;
  initReadingActivities($('#article-content'), post.slug);
  renderArticleOverview($('#article-content'));
  $('#article-cover-wrap').hidden = false;
  $('#article-cover-wrap').innerHTML = `<img id="article-cover" src="${escapeHtml(post.cover_image)}" alt="${escapeHtml(post.cover_alt)}" width="1200" height="680" fetchpriority="high"><figcaption>${escapeHtml(post.visual?.label || 'Guías para crear e investigar')} · ${escapeHtml(post.category)}</figcaption>`;
  $('#article-tags').innerHTML = post.tags.map(tag => `<span>#${escapeHtml(tag)}</span>`).join('');
  const related = state.publicPosts.filter(item => item.id !== post.id).slice(0, 2);
  $('#related-section').hidden = related.length === 0;
  $('#related-posts').innerHTML = related.map(cardTemplate).join('');
  $$('[data-share]').forEach(button => button.dataset.url = absolutePostUrl(post));
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.lucide?.createIcons();
}

function updateProgress() {
  const article = $('#article-view');
  if (!article || article.hidden) return;
  const maximum = article.offsetHeight - innerHeight;
  const value = maximum > 0 ? Math.min(100, Math.max(0, (scrollY - article.offsetTop) / maximum * 100)) : 0;
  $('#article-progress').style.width = `${value}%`;
}

function bindEvents() {
  $('#public-search')?.addEventListener('input', event => { state.publicSearch = event.target.value; state.page = 1; renderPublicGrid(); });
  $('#category-chips')?.addEventListener('click', event => { const button = event.target.closest('[data-category]'); if (!button) return; state.publicCategory = button.dataset.category; state.page = 1; renderCategories(); renderPublicGrid(); });
  $('#pagination')?.addEventListener('click', event => { const button = event.target.closest('[data-page]'); if (!button) return; state.page = Number(button.dataset.page); renderPublicGrid(); scrollTo({ top: $('#latest-title').offsetTop - 110, behavior: 'smooth' }); });
  $$('[data-share]').forEach(button => button.addEventListener('click', async () => {
    const url = button.dataset.url || location.href;
    const title = $('#article-title').textContent;
    const routes = { linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}` };
    if (button.dataset.share === 'copy') {
      try { await navigator.clipboard.writeText(url); toast('Enlace copiado.'); } catch (_) { toast('Copia el enlace desde la barra del navegador.'); }
    } else window.open(routes[button.dataset.share], '_blank', 'noopener,noreferrer');
  }));
}

function init() {
  initSiteChrome();
  bindEvents();
  const slug = getRequestedSlug();
  if (slug) showArticle(slug);
  else {
    showBlogIndex();
    requestAnimationFrame(initBlogNetworkCanvas);
  }
}

init();
