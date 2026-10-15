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
