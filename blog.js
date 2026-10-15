import { BLOG_POSTS } from './blog-posts.js?v=6.0.1';
import { initReadingActivities } from './blog-activities.js?v=1';

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
