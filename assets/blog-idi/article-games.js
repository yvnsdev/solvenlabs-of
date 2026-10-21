// Each article keeps its quiz and has a second scored game; polls do not count.
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const result = '<p data-activity-result role="status" aria-live="polite"></p>';
const actions = '<div class="reading-actions"><button type="submit">Comprobar</button><button type="reset">Reintentar</button></div>';

function crossword(entries, size) {
  const cells = new Map();
  entries.forEach(([word, clue, row, col, vertical], i) => {
    [...word].forEach((letter, n) => {
      const r = row + (vertical ? n : 0), c = col + (vertical ? 0 : n), key = r * size + c;
      const existing = cells.get(key);
      if (existing && existing.letter !== letter) throw new Error('Invalid crossword intersection');
      cells.set(key, { letter, number: n === 0 ? i + 1 : existing?.number, r, c });
    });
  });
  return `<form class="reading-activity" data-crossword><span class="reading-activity__eyebrow">Crucigrama</span><h2>Conecta los conceptos de la postulación</h2><p>Completa una letra por casilla, sin tildes. Las palabras se cruzan.</p><ol class="reading-clues">${entries.map(([,clue,,,vertical],i)=>`<li>${i+1}. ${vertical?'Vertical':'Horizontal'}: ${escape(clue)}</li>`).join('')}</ol><div class="crossword-grid" style="grid-template-columns:repeat(${size},minmax(0,1fr))">${Array.from({length:size*size},(_,i)=>{
    const cell=cells.get(i);
    return cell?`<label class="crossword-cell"><span aria-hidden="true">${cell.number||''}</span><input aria-label="Fila ${cell.r+1}, columna ${cell.c+1}${cell.number?', inicio de palabra '+cell.number:''}" data-letter="${cell.letter}" maxlength="1" autocomplete="off" autocapitalize="characters" spellcheck="false"></label>`:'<span class="crossword-block" aria-hidden="true"></span>';
  }).join('')}</div>${actions}${result}<details><summary>Ver soluciones</summary><p>${entries.map(([word],i)=>`${i+1}. ${word}`).join(' · ')}</p></details></form>`;
}

function wordsearch() {
  const words=[{word:'AUTOR',clue:'Persona que crea una obra.'},{word:'REGISTRO',clue:'Deja constancia de versiones y contribuciones.'},{word:'ACUERDO',clue:'Aclara compromisos entre las partes.'}];
  const size=9, alphabet='ABCDEFGHIJLMNOPRSTUV';
  const board=Array.from({length:size*size},(_,i)=>alphabet[(i*7+Math.floor(i/size)*3)%alphabet.length]);
  words.forEach(({word},i)=>[...word].forEach((letter,n)=>{board[i===0?size+n:i===1?n*size+8:7*size+n]=letter;}));
  return `<section class="reading-activity" data-wordsearch data-size="9" data-words="${escape(JSON.stringify(words))}"><span class="reading-activity__eyebrow">Sopa de letras</span><h2>Encuentra las piezas de un proyecto documentado</h2><p>Selecciona la primera y la última letra de cada palabra. Busca en horizontal o vertical; pulsa Escape para cancelar.</p><ol class="reading-clues">${words.map(w=>`<li data-word="${w.word}">${w.clue}</li>`).join('')}</ol><div class="wordsearch-grid" style="grid-template-columns:repeat(9,minmax(0,1fr))">${board.map((letter,i)=>`<button type="button" data-cell="${i}" aria-pressed="false" aria-label="Fila ${Math.floor(i/size)+1}, columna ${i%size+1}: ${letter}">${letter}</button>`).join('')}</div><div class="reading-actions"><button type="button" data-reset-game>Reiniciar tablero</button></div>${result}</section>`;
}

const matching = {
  'software-a-medida-o-herramienta-lista': ['Ordena una prueba de prototipo', ['1. Primero','2. Después','3. Al cerrar'], [['Definir qué necesitas aprender','Una hipótesis orienta el alcance.'],['Probar la función esencial','La prueba debe responder a esa hipótesis.'],['Revisar evidencia y decidir','Los resultados orientan la siguiente iteración.']]],
  'inteligencia-artificial-en-la-empresa-con-resultados': ['Elige la salida adecuada de la IA', ['Hay información suficiente y verificable','Faltan antecedentes necesarios','La decisión requiere revisión humana'], [['Responder','La respuesta puede apoyarse en información verificable.'],['Pedir contexto','Solicitar los datos faltantes evita completar vacíos con suposiciones.'],['Escalar','La revisión humana corresponde cuando la decisión lo requiere.']]],
  'plan-piloto-demo-gratuita-primer-contacto': ['Relaciona cada situación con el siguiente paso', ['Todavía no conoces el proceso de la organización','El problema está claro y quieres mostrar un flujo','Acordaron probar en condiciones reales'], [['Conversación exploratoria','Primero necesitas entender su proceso.'],['Demo','Permite mostrar y recoger preguntas sobre un flujo.'],['Piloto acotado','Requiere alcance, responsables, duración y criterios de salida.']]]
};

function matchingGame(config) {
  const [title, prompts, answers]=config;
  return `<form class="reading-activity" data-matching-game><span class="reading-activity__eyebrow">Desafío de decisiones</span><h2>${escape(title)}</h2><p>Elige la opción que corresponde a cada situación y comprueba tus decisiones.</p>${prompts.map((prompt,i)=>`<label class="matching-question"><span>${i+1}. ${escape(prompt)}</span><select data-correct="${i}" aria-label="${escape(prompt)}" required><option value="">Selecciona una opción</option>${[2,0,1].map(n=>`<option value="${n}">${escape(answers[n][0])}</option>`).join('')}</select><span data-match-feedback></span></label>`).join('')}${actions}${result}</form>`;
}

export function ensureArticleGames(root, slug) {
  const count=root.querySelectorAll('[data-reading-quiz], [data-crossword], [data-wordsearch], [data-matching-game]').length;
  if(count>=2)return;
  let markup='';
  if(slug==='planilla-de-costos-por-que-no-pasas-a-defensa')markup=crossword([['COSTO','Valor de los recursos necesarios.',2,0,false],['APORTE','Contribución que ayuda a financiar el proyecto.',0,1,true],['TOPE','Límite máximo que debes revisar en las bases.',4,1,false]],6);
  else if(slug==='fondos-que-cierran-en-20-dias')markup=crossword([['BASES','Documento que define las reglas del concurso.',2,0,false],['PLAN','Organiza las actividades para llegar al cierre.',0,1,true],['SALDO','Diferencia restante después de descontar un monto.',2,2,true]],7);
  else if(slug==='proteger-proyecto-antes-de-crearlo')markup=wordsearch();
  else if(matching[slug])markup=matchingGame(matching[slug]);
  if(!markup)return;
  const closing=root.querySelector('.editorial-section--closing');
  if(closing)closing.insertAdjacentHTML('beforebegin',markup);else root.insertAdjacentHTML('beforeend',markup);
  const form=root.querySelector('[data-matching-game]');
  if(!form)return;
  const inputs=[...form.querySelectorAll('select')];
  const update=(label,value)=>{form.querySelector('[data-progress-label]').textContent=label;const meter=form.querySelector('progress');meter.max=inputs.length;meter.value=value;};
  form.addEventListener('change',()=>update('Elige una opción en cada situación',inputs.filter(input=>input.value!=='').length));
  form.addEventListener('submit',event=>{
    event.preventDefault();let score=0;
    inputs.forEach((input,i)=>{const correct=input.value===input.dataset.correct;if(correct)score++;input.setAttribute('aria-invalid',String(!correct));input.nextElementSibling.textContent=(correct?'Correcto. ':'Revisa tu elección. ')+matching[slug][2][i][1];});
    form.querySelector('[data-activity-result]').textContent=`${score} de ${inputs.length} decisiones correctas.${score===inputs.length?' ¡Desafío completado!':' Puedes cambiar tus respuestas y reintentar.'}`;
    update(`${score} de ${inputs.length} decisiones correctas`,score);
  });
  form.addEventListener('reset',()=>{inputs.forEach(input=>{input.removeAttribute('aria-invalid');input.nextElementSibling.textContent='';});form.querySelector('[data-activity-result]').textContent='';update('Listo para comenzar',0);});
}
