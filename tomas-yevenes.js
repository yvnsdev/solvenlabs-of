document.getElementById('year').textContent = new Date().getFullYear();

const filters = document.querySelector('.project-filters');
const cards = [...document.querySelectorAll('.work-card')];
const count = document.querySelector('.project-count');
const track = document.querySelector('#project-results');
const catalogPrev = document.querySelector('[data-catalog-prev]');
const catalogNext = document.querySelector('[data-catalog-next]');
const catalogPosition = document.querySelector('[data-catalog-position]');
document.querySelector('.catalog-navigation').hidden = false;
function syncCatalog() {
  const visible = cards.filter(card => !card.hidden);
  const bounds = track.getBoundingClientRect();
  const shown = visible.filter(card => {
    const rect = card.getBoundingClientRect();
    return rect.right > bounds.left + 20 && rect.left < bounds.right - 20;
  });
  catalogPosition.textContent = shown.length ? (visible.indexOf(shown[0]) + 1) + '–' + (visible.indexOf(shown.at(-1)) + 1) + ' / ' + visible.length : '0 / 0';
  catalogPrev.disabled = track.scrollLeft < 2;
  catalogNext.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
}
function moveCatalog(direction) {
  track.scrollBy({ left: direction * track.clientWidth, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
}
catalogPrev.addEventListener('click', () => moveCatalog(-1));
catalogNext.addEventListener('click', () => moveCatalog(1));
track.addEventListener('scroll', syncCatalog, { passive: true });
window.addEventListener('resize', syncCatalog);
track.addEventListener('keydown', event => {
  if (event.target !== track || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  event.preventDefault();
  moveCatalog(event.key === 'ArrowLeft' ? -1 : 1);
});
requestAnimationFrame(syncCatalog);
const searchLabel = document.querySelector('.project-search');
const search = searchLabel.querySelector('input');
searchLabel.hidden = false;
let activeFilter = 'all';
const normalize = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
function updateProjects() {
  const query = normalize(search.value.trim());
  cards.forEach((card) => {
    card.hidden = !(activeFilter === 'all' || card.dataset.category === activeFilter) || !normalize(card.textContent).includes(query);
  });
  const visible = cards.filter((card) => !card.hidden).length;
  track.scrollLeft = 0;
  requestAnimationFrame(syncCatalog);
  count.textContent = visible ? visible + (visible === 1 ? ' proyecto' : ' proyectos') : 'Sin resultados. Prueba otro nombre o categoría.';
}
search.addEventListener('input', updateProjects);
filters.hidden = false;
filters.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-filter]');
  if (!button) return;
  filters.querySelectorAll('button').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
  activeFilter = button.dataset.filter;
  updateProjects();
});
const printButton = document.querySelector('.print-cv');
const careerTabs = [...document.querySelectorAll('[data-career-year]')];
const careerPanels = [...document.querySelectorAll('.career-panel')];
const careerPrevious = document.querySelector('[data-career-prev]');
const careerNext = document.querySelector('[data-career-next]');
let careerIndex = 0;
function activateCareer(index, focus = false) {
  careerIndex = Math.max(0, Math.min(index, careerTabs.length - 1));
  careerTabs.forEach((tab, i) => {
    tab.setAttribute('aria-selected', String(i === careerIndex));
    tab.tabIndex = i === careerIndex ? 0 : -1;
    careerPanels[i].hidden = i !== careerIndex;
    careerPanels[i].setAttribute('role', 'tabpanel');
    careerPanels[i].setAttribute('aria-labelledby', tab.id);
    careerPanels[i].tabIndex = 0;
  });
  careerPrevious.disabled = careerIndex === 0;
  careerNext.disabled = careerIndex === careerTabs.length - 1;
  document.querySelector('[data-career-position]').textContent = (careerIndex + 1) + ' de ' + careerTabs.length;
  if (focus) careerTabs[careerIndex].focus({ preventScroll: true });
}
document.querySelector('.career-steps').hidden = false;
document.querySelector('.career-controls').hidden = false;
careerTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateCareer(index));
  tab.addEventListener('keydown', (event) => {
    let next = index;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % careerTabs.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index + careerTabs.length - 1) % careerTabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = careerTabs.length - 1;
    else return;
    event.preventDefault();
    activateCareer(next, true);
  });
});
careerPrevious.addEventListener('click', () => activateCareer(careerIndex - 1));
careerNext.addEventListener('click', () => activateCareer(careerIndex + 1));
activateCareer(0);
printButton.hidden = false;
printButton.addEventListener('click', () => window.print());

const lightbox = document.querySelector('.project-lightbox');
const lightboxImage = lightbox.querySelector('.lightbox-image');
let gallery = [];
let galleryIndex = 0;
function renderProject() {
  const card = gallery[galleryIndex];
  const title = card.querySelector('h3').textContent;
  lightbox.querySelector('h2').textContent = title;
  lightboxImage.src = card.querySelector('[data-image]').dataset.image;
  lightboxImage.alt = 'Captura ampliada de ' + title;
  lightbox.querySelector('[data-gallery-count]').textContent = (galleryIndex + 1) + ' / ' + gallery.length;
  const context = lightbox.querySelector('.lightbox-context');
  context.replaceChildren(card.querySelector('dl').cloneNode(true));
  lightbox.scrollTop = 0;
}
document.querySelectorAll('.work-card__cover').forEach((button) => {
  button.addEventListener('click', () => {
    gallery = cards.filter((card) => !card.hidden);
    galleryIndex = gallery.indexOf(button.closest('.work-card'));
    renderProject();
    lightbox.showModal();
  });
});
function moveProject(direction) {
  galleryIndex = (galleryIndex + direction + gallery.length) % gallery.length;
  renderProject();
}
lightbox.querySelector('[data-gallery-prev]').addEventListener('click', () => moveProject(-1));
lightbox.querySelector('[data-gallery-next]').addEventListener('click', () => moveProject(1));
lightbox.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    moveProject(event.key === 'ArrowLeft' ? -1 : 1);
  }
});
lightbox.querySelector('.lightbox-close').addEventListener('click', () => lightbox.close());
lightbox.addEventListener('click', (event) => {
  if (event.target !== lightbox) return;
  const bounds = lightbox.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) lightbox.close();
});

// Content stays visible without JavaScript and when reduced motion is preferred.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.06 });
  document.querySelectorAll('.career-item, .certificate-card, .award-list article, .section__heading').forEach((element) => {
    element.classList.add('reveal-soft');
    observer.observe(element);
  });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) document.querySelectorAll('.reveal-soft').forEach((element) => element.classList.add('is-visible'));
  });
}
