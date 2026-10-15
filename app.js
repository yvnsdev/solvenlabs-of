/**
 * Solven Labs - JavaScript Principal
 * Landing Page Corporativa
 * Funcionalidades: Navegación, Animaciones, Modales, Filtros, etc.
 */

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

(function() {
  'use strict';

  document.documentElement.classList.add('js');

  // ==========================================================================
  // CONFIGURACIÓN Y ESTADO
  // ==========================================================================
  
  const state = {
    mobileMenuOpen: false,
    currentTestimonial: 0
  };

  // ==========================================================================
  // UTILIDADES
  // ==========================================================================

  /**
   * Selecciona un elemento del DOM
   */
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];

  /**
   * Debounce para optimizar eventos frecuentes
   */
  const debounce = (fn, delay) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  };

  /**
   * Formatea números con separadores de miles
   */
  const formatNumber = (num) => {
    return new Intl.NumberFormat('es-CL').format(num);
  };

  const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const trackSiteEvent = (name, detail = {}) => {
    const event = {
      name,
      path: window.location.pathname,
      detail,
      createdAt: new Date().toISOString()
    };

    try {
      const current = JSON.parse(localStorage.getItem('ntek_events') || '[]');
      current.push(event);
      localStorage.setItem('ntek_events', JSON.stringify(current.slice(-100)));
    } catch (error) {
      // La medicion local nunca debe bloquear la experiencia.
    }

    window.dispatchEvent(new CustomEvent('ntek:track', { detail: event }));
  };

  const initConversionTracking = () => {
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[href]');
      if (!link) return;

      const href = link.getAttribute('href') || '';
      if (href.includes('wa.me')) {
        trackSiteEvent('whatsapp_click', { href, placement: link.dataset.leadCta || 'general', label: link.textContent.trim().slice(0, 80) });
      } else if (href.startsWith('mailto:')) {
        trackSiteEvent('email_click', { href });
      } else if (href.includes('#contacto')) {
        trackSiteEvent('contact_cta_click', { href, label: link.textContent.trim().slice(0, 80) });
      }
    });
  };

  const initAuditWidget = () => {
    const widget = document.querySelector('[data-audit-widget]');
    if (!widget) return;

    const checks = [...widget.querySelectorAll('[data-audit-check]')];
    const score = widget.querySelector('[data-audit-score]');
    const title = widget.querySelector('[data-audit-title]');
    const copy = widget.querySelector('[data-audit-copy]');

    const states = [
      {
        min: 0,
        title: 'Partamos por lo esencial',
        copy: 'Tu prioridad deberia ser presencia web confiable, Google Business, dominio, correo y canales de contacto claros.'
      },
      {
        min: 3,
        title: 'Ya hay base, falta convertir mejor',
        copy: 'Conviene mejorar mensajes, formularios, WhatsApp, medicion y paginas de servicio para transformar visitas en consultas.'
      },
      {
        min: 5,
        title: 'Buen punto para automatizar',
        copy: 'Ya tienes una base digital. El siguiente salto esta en ordenar datos, automatizar seguimiento y conectar herramientas.'
      },
      {
        min: 7,
        title: 'Listo para escalar con estrategia',
        copy: 'Tu base esta fuerte. Ahora conviene trabajar crecimiento, integraciones, analitica y mejoras continuas.'
      }
    ];

    const update = () => {
      const total = checks.filter(item => item.checked).length;
      const current = states.reduce((selected, item) => total >= item.min ? item : selected, states[0]);
      if (score) score.textContent = `${total}/${checks.length}`;
      if (title) title.textContent = current.title;
      if (copy) copy.textContent = current.copy;
      trackSiteEvent('audit_update', { score: total, total: checks.length });
    };

    checks.forEach(check => check.addEventListener('change', update));
    update();
  };

  // Optimizar Lucide - debounceado para evitar múltiples renders
  let lucideTimeout;
  const updateLucideIcons = () => {
    clearTimeout(lucideTimeout);
    lucideTimeout = setTimeout(() => {
      if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
      }
    }, 16);
  };

  const iconSvgs = {
    check: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>',
    arrowRight: '<svg class="icon btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"></path><path d="m13 5 7 7-7 7"></path></svg>',
    calendar: '<svg class="icon btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M8 3v4"></path><path d="M16 3v4"></path><path d="M3 11h18"></path></svg>'
  };

  const siteContentState = {
    apiBase: 'https://oxyhuxnkhogmuholomis.supabase.co/rest/v1',
    anonKey: 'sb_publishable_Hc5VQX3uTZ_K9BiQ9kf0rA_ri3wYpjS',
    content: {}
  };

  /**
   * Muestra una notificación tipo toast con estilo de modal / confirm del dashboard
   */
  const showToast = (message, type = 'info') => {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const icons = {
      success: 'check-circle',
      error: 'x-circle',
      warning: 'alert-triangle',
      info: 'info',
    };

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
      <i data-lucide="${icons[type]}"></i>
      <span class="toast__text">${message}</span>
      <button type="button" class="toast__close" title="Cerrar">✕</button>
    `;

    const closeBtn = toast.querySelector('.toast__close');
    closeBtn.addEventListener('click', () => toast.remove());

    container.appendChild(toast);
    updateLucideIcons();

    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(30px)';
        toast.style.transition = '0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }
    }, 4200);
  };

  /**
   * Anima un contador numérico
   */
  const animateCounter = (element, target, duration = 2000) => {
    const start = 0;
    const startTime = performance.now();
    
    const update = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (target - start) * easeOut);
      
      element.textContent = formatNumber(current);
      
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };
    
    requestAnimationFrame(update);
  };

  // ==========================================================================
  // ANIMACIÓN DE RED (NETWORK CANVAS)
  // ==========================================================================

  // ==========================================================================
  // ANIMACIÓN DE RED PARA SECCIÓN EQUIPO
  // ==========================================================================

  const initTeamNetworkCanvas = () => {
    const canvas = document.getElementById('team-network-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const particles = [];
    let particleCount = 80;
    let connectionDistance = 150;
    let animationId;

    // Obtener configuración según tamaño de pantalla
    const getParticleConfig = () => {
      const width = window.innerWidth;
      if (width <= 480) {
        return { count: 40, distance: 110 };
      } else if (width <= 768) {
        return { count: 55, distance: 130 };
      } else {
        return { count: 80, distance: 150 };
      }
    };

    // Configurar tamaño del canvas
    const resizeCanvas = () => {
      const section = canvas.parentElement;
      canvas.width = section.offsetWidth;
      canvas.height = section.offsetHeight;
      
      const config = getParticleConfig();
      particleCount = config.count;
      connectionDistance = config.distance;
    };

    // Clase Particle
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.6;
        this.vy = (Math.random() - 0.5) * 0.6;
        this.radius = Math.random() * 2.5 + 1;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(76, 124, 175, 0.9)';
        ctx.fill();
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

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

    // Iniciar
    resizeCanvas();
    createParticles();
    animate();
  };

  // ==========================================================================
  // NAVEGACIÓN (SPA routing + links)
  // ==========================================================================
  
  // Mapa de rutas a secciones (ruta -> id de sección)
  const SECTION_ROUTES = {
    inicio: '/',
    servicios: '/servicios',
    equipo: '/equipo',
    proceso: '/como-trabajamos',
    casos: '/proyectos',
    tecnologias: '/tecnologias',
    simulador: '/diagnostico-digital',
    testimonios: '/testimonios',
    garantias: '/garantias',
    faq: '/preguntas-frecuentes',
    contacto: '/contacto'
  };

  const ROUTES = Object.fromEntries(
    Object.entries(SECTION_ROUTES).map(([sectionId, path]) => [path, sectionId])
  );

  Object.assign(ROUTES, {
    '/index.html': 'inicio',
    '/nosotros': 'servicios',
    '/servicios-puntuales': 'servicios',
    '/servicios/soporte-infraestructura': 'servicios',
    '/proceso': 'proceso',
    '/casos': 'casos',
    '/planes': 'servicios',
    '/pricing': 'servicios',
    '/simulador': 'simulador',
    '/faq': 'faq'
  });

  const SECTION_TITLES = {
    inicio: 'Solven Labs | Soluciones con inteligencia artificial',
    servicios: 'Qué hacemos por tu proyecto | Solven Labs',
    equipo: 'Equipo de ingeniería e investigación | Solven Labs',
    proceso: 'Cómo trabajamos | Solven Labs',
    casos: 'Proyectos de desarrollo tecnológico | Solven Labs',
    tecnologias: 'Herramientas que usamos | Solven Labs',
    simulador: 'Encuentra el próximo paso de tu proyecto | Solven Labs',
    testimonios: 'Instituciones y colaboración | Solven Labs',
    garantias: 'Garantías | Solven Labs',
    faq: 'Preguntas frecuentes | Solven Labs',
    contacto: 'Contacto | Solven Labs'
  };

  const SECTION_DESCRIPTIONS = {
    inicio: 'Somos una EBCT apoyada por ANID. Desarrollamos soluciones con IA, vinculados al ecosistema HealthTech y a proyectos de emprendimiento.',
    servicios: 'Desarrollamos inteligencia artificial, software a medida e integración de datos para organizaciones y emprendimientos.',
    equipo: 'Conoce a Tomás Yévenes y a las doctoras Carola Figueroa, Daniela Mennickent y Lara Monteiro: software, IA e investigación biomédica.',
    proceso: 'Acordamos qué necesitas, construimos por etapas y probamos el resultado contigo.',
    casos: 'Conoce los proyectos y plataformas desarrollados por Solven Labs y su aplicación en organizaciones, educación y salud.',
    tecnologias: 'Conoce las herramientas que usamos para crear aplicaciones, analizar datos y mantener tus sistemas funcionando.',
    simulador: 'Cuéntanos en qué etapa está tu proyecto y descubre cómo podemos ayudarte a avanzar.',
    testimonios: 'Instituciones de salud, investigación y emprendimiento vinculadas a nuestros proyectos HealthTech.',
    garantias: 'Conoce qué incluye tu proyecto, cuándo lo entregamos y cómo te apoyamos después.',
    faq: 'Resuelve tus dudas sobre nuestros servicios, plazos y forma de trabajar con equipos de salud.',
    contacto: 'Conversa con Solven Labs sobre tu proyecto de IA, software o emprendimiento tecnológico.'
  };

  let publicRoutingReady = false;

  const sectionToPath = (id) => {
    if (SECTION_ROUTES[id]) return SECTION_ROUTES[id];
    return `/#${id}`;
  };

  const pathToSection = (path) => {
    const clean = path.replace(/\/+$/, '') || '/';
    return ROUTES[clean] || null;
  };

  const scrollToSectionId = (id, smooth = true) => {
    const target = document.getElementById(id);
    if (!target) {
      if (id === 'inicio') {
        window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
      }
      return;
    }
    const offsetTop = target.getBoundingClientRect().top + window.pageYOffset - 88;
    window.scrollTo({ top: offsetTop, behavior: smooth ? 'smooth' : 'auto' });
  };

  const updateCanonical = (path) => {
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = window.location.origin + (path === '/' ? '/' : path);
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', window.location.origin + (path === '/' ? '/' : path));
  };

  const updateSectionMetadata = (sectionId, path = sectionToPath(sectionId)) => {
    const title = SECTION_TITLES[sectionId] || SECTION_TITLES.inicio;
    const description = SECTION_DESCRIPTIONS[sectionId] || SECTION_DESCRIPTIONS.inicio;
    document.title = title;
    ['meta[property="og:title"]', 'meta[name="twitter:title"]'].forEach((selector) => {
      document.querySelector(selector)?.setAttribute('content', title);
    });
    ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]'].forEach((selector) => {
      document.querySelector(selector)?.setAttribute('content', description);
    });
    updateCanonical(path);
  };

  const navigateTo = (path, { replace = false, smooth = true } = {}) => {
    const sectionId = pathToSection(path);
    const isNotFound = !sectionId;
    const finalPath = isNotFound ? '/404-not-found' : sectionToPath(sectionId);

    // Para evitar /servicios etc en URL, cuando es sección conocida mantenemos la base "/"
    if (sectionId) {
      if (replace) history.replaceState({ section: sectionId }, '', finalPath);
      else history.pushState({ section: sectionId }, '', finalPath);
      updateSectionMetadata(sectionId, finalPath);
      scrollToSectionId(sectionId, smooth);
      updateActiveLink(sectionId);
      return;
    }

    if (finalPath !== window.location.pathname) {
      if (replace) history.replaceState({}, '', finalPath);
      else history.pushState({}, '', finalPath);
    }

    updateCanonical(finalPath);

    const targetId = sectionId || 'notfound';
    const notfoundSection = document.getElementById('notfound');

    if (isNotFound) {
      document.title = '404 · Página no encontrada | Solven Labs';
      if (notfoundSection) notfoundSection.style.display = 'block';
    } else {
      updateSectionMetadata('inicio');
      if (notfoundSection) notfoundSection.style.display = 'none';
    }

    scrollToSectionId(targetId, smooth);
    updateActiveLink('notfound');
  };

  window.addEventListener('popstate', () => {
    navigateTo(window.location.pathname, { replace: true, smooth: false });
  });

  const initNavbar = () => {
    const navbar = $('.navbar');
    const mobileToggle = $('.navbar__mobile-toggle');
    const mobileMenu = $('.mobile-menu');
    const mobileLinks = $$('.mobile-menu__link, .mobile-menu__cta a');
    const navLinks = $$('.navbar__link, .navbar__dropdown-item, .mobile-menu__link, .mobile-menu__cta a');
    
    // Scroll effect para navbar
    const handleScroll = () => {
      if (window.scrollY > 50) {
        if (navbar) navbar.classList.add('scrolled');
      } else {
        if (navbar) navbar.classList.remove('scrolled');
      }
      
      // Actualizar link activo basado en la sección visible
      updateActiveLink();
    };
    
    window.addEventListener('scroll', debounce(handleScroll, 10));
    handleScroll();
    
    // Toggle menú móvil
    if (mobileToggle && mobileMenu) {
      const syncMobileMenu = () => {
        mobileMenu.classList.toggle('open', state.mobileMenuOpen);
        mobileMenu.setAttribute('aria-hidden', String(!state.mobileMenuOpen));
        mobileToggle.setAttribute('aria-expanded', String(state.mobileMenuOpen));
        mobileToggle.setAttribute('aria-label', state.mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú');
        document.body.classList.toggle('modal-open', state.mobileMenuOpen);

        const menuIcon = mobileToggle.querySelector('.icon');
        if (menuIcon) {
          menuIcon.setAttribute('data-lucide', state.mobileMenuOpen ? 'x' : 'menu');
          lucide.createIcons();
        }
      };

      mobileToggle.addEventListener('click', () => {
        state.mobileMenuOpen = !state.mobileMenuOpen;
        syncMobileMenu();
      });

      document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape' || !state.mobileMenuOpen) return;
        state.mobileMenuOpen = false;
        syncMobileMenu();
        mobileToggle.focus();
      });
      
      // Cerrar al hacer click en un link
      mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
          state.mobileMenuOpen = false;
          syncMobileMenu();
        });
      });
    }

    // Dropdowns de navbar — abrir/cerrar por click y cerrar al hacer clic afuera
    $$('.navbar__dropdown-toggle').forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const dropdown = toggle.closest('.navbar__dropdown');
        const isOpen = dropdown.classList.contains('open');
        // Cerrar todos los demás
        $$('.navbar__dropdown').forEach(d => {
          const toggleButton = d.querySelector('.navbar__dropdown-toggle');
          d.classList.remove('open');
          if (toggleButton) toggleButton.setAttribute('aria-expanded', 'false');
        });
        // Abrir/cerrar el actual
        if (!isOpen) {
          dropdown.classList.add('open');
          toggle.setAttribute('aria-expanded', 'true');
        }
      });
    });

    // Cerrar dropdowns al hacer clic en un item del menú desplegable
    $$('.navbar__dropdown-item').forEach(item => {
      item.addEventListener('click', () => {
        $$('.navbar__dropdown').forEach(d => {
          const toggleButton = d.querySelector('.navbar__dropdown-toggle');
          d.classList.remove('open');
          if (toggleButton) toggleButton.setAttribute('aria-expanded', 'false');
        });
      });
    });

    // Cerrar dropdowns al hacer clic fuera
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.navbar__dropdown')) {
        $$('.navbar__dropdown').forEach(d => {
          const toggleButton = d.querySelector('.navbar__dropdown-toggle');
          d.classList.remove('open');
          if (toggleButton) toggleButton.setAttribute('aria-expanded', 'false');
        });
      }
    });

    // Cerrar dropdowns con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        $$('.navbar__dropdown').forEach(d => {
          const toggleButton = d.querySelector('.navbar__dropdown-toggle');
          d.classList.remove('open');
          if (toggleButton) toggleButton.setAttribute('aria-expanded', 'false');
        });
      }
    });

    // Manejo de clicks en navegación: soporta rutas reales (/servicios) y anclas (#servicios)
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href') || '';

        // Ruta interna estilo "/servicios" — usar History API
        if (href.startsWith('/')) {
          const url = new URL(href, location.origin);
          const isHtmlPage = url.pathname.endsWith('.html');
          const isStandalonePage = url.pathname === '/blog/' || url.pathname.startsWith('/blog/');
          if (url.origin === location.origin && !isHtmlPage && !isStandalonePage) {
            e.preventDefault();
            navigateTo(url.pathname);

            // Cerrar menú móvil si está abierto
            state.mobileMenuOpen = false;
            if (mobileMenu) mobileMenu.classList.remove('open');
            document.body.classList.remove('modal-open');
          }
          return;
        }

        // Compatibilidad con enlaces antiguos tipo "#id".
        if (href.startsWith('#')) {
          e.preventDefault();
          const id = href.slice(1);
          if (document.getElementById(id)) {
            navigateTo(sectionToPath(id));
          }

          // Cerrar menú móvil si está abierto
          state.mobileMenuOpen = false;
          if (mobileMenu) mobileMenu.classList.remove('open');
          document.body.classList.remove('modal-open');
        }
      });
    });

    // Manejo de links del footer con anclas internas
    const footerLinks = $$('.footer__link[href^="#"]');
    footerLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href') || '';
        if (href === '#') return;

        const id = href.slice(1);
        const target = document.getElementById(id);
        if (!target) return;

        e.preventDefault();
        navigateTo(sectionToPath(id));
      });
    });

    $$('.js-scroll-contact').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(sectionToPath('contacto'));
      });
    });

    $$('.js-scroll-services').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(sectionToPath('servicios'));
      });
    });
  };

  /**
   * Actualiza el link activo basado en la sección visible
   */
  const updateActiveLink = (forcedSectionId = null) => {
    const sections = $$('section[id]');
    const scrollPos = window.scrollY + 150;
    let activeId = forcedSectionId || 'inicio';

    if (!forcedSectionId) {
      sections.forEach(section => {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        const id = section.getAttribute('id');

        if (scrollPos >= top && scrollPos < top + height) {
          activeId = id;
        }
      });
    }
    
    $$('.navbar__link, .mobile-menu__link, .footer__link').forEach(link => {
      link.classList.remove('active');
      const href = link.getAttribute('href') || '';
      let normalized = href;
      if (href.startsWith('#')) normalized = sectionToPath(href.slice(1));
      if (normalized === window.location.pathname || normalized === sectionToPath(activeId)) {
        link.classList.add('active');
      }
    });

    if (publicRoutingReady && SECTION_ROUTES[activeId] && window.location.pathname !== '/404-not-found') {
      const activePath = sectionToPath(activeId);
      if (window.location.pathname !== activePath) {
        history.replaceState({ section: activeId }, '', activePath);
      }
      updateSectionMetadata(activeId, activePath);
    }
  };

  // ==========================================================================
  // ANIMACIONES SCROLL REVEAL
  // ==========================================================================

  const prepareHomeRevealElements = () => {
    const revealGroups = [
      { selector: '.hero__badge, .section__badge', variant: 'fade-down' },
      { selector: '.hero__promise, .hero__subtitle, .section__subtitle, .hero__ctas, .hero__metrics, .hero__more', variant: 'fade-up' },
      { selector: '.hero__title', variant: 'hero-title' },
      { selector: '.section__header', variant: 'fade-up' },
      { selector: '.company-story__content, .contact__info, .faq__intro', variant: 'fade-right' },
      { selector: '.company-story__visual, .contact__form, .faq__chatbot', variant: 'fade-left' },
      { selector: '.service-card, .pricing-card, .guarantee-card, .tool-card', variant: 'card' },
      { selector: '.case-card, .usecase-card, .testimonial-card', variant: 'quote' },
      { selector: '.ntek-agenda__calendar, .case-card__image, .logos__viewport, .technologies__visual', variant: 'media' },
      { selector: '.process-step, .guarantees__meta, .process__cta, .pricing__cyber-banner, .pricing__disclaimer, .ntek-comparison__table-wrap', variant: 'scale-in' }
    ];

    revealGroups.forEach(({ selector, variant }) => {
      $$(selector).forEach((element, index) => {
        element.classList.add('reveal');
        element.dataset.reveal = element.dataset.reveal || variant;
        if (!Array.from(element.classList).some(className => className.startsWith('reveal--delay-'))) {
          const delay = index % 4;
          if (delay) element.classList.add(`reveal--delay-${delay}`);
        }
      });
    });
  };

  const initScrollReveal = () => {
    const reveals = $$('.reveal');
    
    if (!reveals.length) return;

    if (!('IntersectionObserver' in window)) {
      reveals.forEach(el => el.classList.add('revealed'));
      return;
    }
    
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          // Opcional: dejar de observar después de revelar
          // observer.unobserve(entry.target);
        }
      });
    }, observerOptions);
    
    reveals.forEach(el => observer.observe(el));
  };

  // ==========================================================================
  // FILTROS DE PORTAFOLIO
  // ==========================================================================

  const initPortfolioFilters = () => {
    const filters = $$('.portfolio__filter');
    const cards = $$('.case-card');
    
    if (!filters.length || !cards.length) return;
    
    filters.forEach(filter => {
      filter.addEventListener('click', () => {
        const category = filter.dataset.filter;

        // Actualizar estado de filtros
        filters.forEach(f => f.classList.remove('active'));
        filter.classList.add('active');

        // Filtrar cards
        cards.forEach(card => {
          const cardCategory = (card.dataset.category || '').toLowerCase();
          const cardCategories = cardCategory.split(/\s*,\s*|\s+/).filter(Boolean);

          if (category === 'all' || cardCategories.includes(category)) {
            card.classList.remove('hidden');
            card.style.animation = 'fadeIn 0.3s ease';
          } else {
            card.classList.add('hidden');
          }
        });
      });
    });
  };

  const initPortfolioCarousel = () => {
    const carousel = document.querySelector('.portfolio__carousel');
    const track = carousel ? carousel.querySelector('.portfolio__grid') : null;

    if (!carousel || !track) return;

    // El contenido puede recargarse desde el dashboard: evita intervalos duplicados.
    if (typeof carousel._portfolioAutoplayCleanup === 'function') {
      carousel._portfolioAutoplayCleanup();
    }

    let autoplayTimer = null;
    let filterResetFrame = null;
    let currentCardIndex = 0;
    let animationFrame = null;
    const autoplayDelay = 5000;
    const previousButton = carousel.querySelector('[data-portfolio-prev]');
    const nextButton = carousel.querySelector('[data-portfolio-next]');
    let interacting = false;

    const updateControls = () => {
      const disabled = getPositions().length < 2;
      if (previousButton) previousButton.disabled = disabled;
      if (nextButton) nextButton.disabled = disabled;
    };

    const getVisibleCards = () => Array.from(track.querySelectorAll('.case-card:not(.hidden)'));
    const getMaxScrollLeft = () => Math.max(0, track.scrollWidth - track.clientWidth);

    // Clamp and deduplicate the last stops when several cards fit in the viewport.
    const getPositions = () => {
      const cards = getVisibleCards();
      const maxScrollLeft = getMaxScrollLeft();
      const positions = [];
      cards.forEach(card => {
        const position = Math.min(Math.max(0, card.offsetLeft - cards[0].offsetLeft), maxScrollLeft);
        if (!positions.length || position - positions[positions.length - 1] > 1) positions.push(position);
      });
      return positions;
    };

    const moveTo = (target, animate = false) => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = null;
      if (!animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        track.scrollLeft = target;
        return;
      }
      const origin = track.scrollLeft;
      let startedAt = null;
      const step = timestamp => {
        if (startedAt === null) startedAt = timestamp;
        const progress = Math.min((timestamp - startedAt) / 550, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        track.scrollLeft = origin + (target - origin) * eased;
        animationFrame = progress < 1 ? window.requestAnimationFrame(step) : null;
      };
      animationFrame = window.requestAnimationFrame(step);
    };

    const advanceCarousel = () => {
      if (document.hidden || interacting || animationFrame !== null) return;
      const positions = getPositions();
      if (positions.length < 2) return;
      currentCardIndex = (currentCardIndex + 1) % positions.length;
      moveTo(positions[currentCardIndex], true);
    };

    const startAutoplay = () => {
      window.clearInterval(autoplayTimer);
      autoplayTimer = window.setInterval(advanceCarousel, autoplayDelay);
    };

    const syncPosition = () => {
      const positions = getPositions();
      currentCardIndex = positions.reduce((nearest, position, index) =>
        Math.abs(position - track.scrollLeft) < Math.abs(positions[nearest] - track.scrollLeft) ? index : nearest, 0);
    };
    const manualStep = direction => {
      const positions = getPositions();
      if (positions.length < 2) return;
      // Preserve the intended destination when buttons are pressed rapidly.
      if (animationFrame === null) syncPosition();
      currentCardIndex = (currentCardIndex + direction + positions.length) % positions.length;
      moveTo(positions[currentCardIndex], true);
      startAutoplay();
    };
    const handlePrevious = () => manualStep(-1);
    const handleNext = () => manualStep(1);
    const handleKeydown = event => {
      if (event.target !== track || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      manualStep(event.key === 'ArrowLeft' ? -1 : 1);
    };
    const interruptAnimation = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = null;
      syncPosition();
      startAutoplay();
    };
    const handlePointerDown = () => {
      interacting = true;
      interruptAnimation();
    };
    const handlePointerUp = () => {
      if (!interacting) return;
      interacting = false;
      syncPosition();
      startAutoplay();
    };
    const handleScroll = () => {
      if (animationFrame !== null) return;
      syncPosition();
      startAutoplay();
    };
    previousButton?.addEventListener('click', handlePrevious);
    nextButton?.addEventListener('click', handleNext);
    track.addEventListener('keydown', handleKeydown);
    track.addEventListener('pointerdown', handlePointerDown, { passive: true });
    track.addEventListener('wheel', interruptAnimation, { passive: true });
    track.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    const resetAfterFilter = () => {
      window.cancelAnimationFrame(filterResetFrame);
      filterResetFrame = window.requestAnimationFrame(() => {
        currentCardIndex = 0;
        moveTo(0);
        updateControls();
        startAutoplay();
      });
    };

    const filterObserver = new MutationObserver((mutations) => {
      const filterChanged = mutations.some((mutation) => {
        if (!(mutation.target instanceof Element) || !mutation.target.classList.contains('case-card')) return false;
        const hadHiddenClass = (` ${mutation.oldValue || ''} `).includes(' hidden ');
        return hadHiddenClass !== mutation.target.classList.contains('hidden');
      });

      if (filterChanged) resetAfterFilter();
    });

    filterObserver.observe(track, {
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
      attributeOldValue: true
    });

    const handleVisibilityChange = () => {
      if (document.hidden) {
        window.clearInterval(autoplayTimer);
        const positions = getPositions();
        moveTo(positions[currentCardIndex] || 0);
      } else {
        startAutoplay();
      }
    };

    const handleResize = () => {
      updateControls();
      const positions = getPositions();
      if (!positions.length) return;
      currentCardIndex = Math.min(currentCardIndex, positions.length - 1);
      moveTo(positions[currentCardIndex]);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('resize', handleResize, { passive: true });
    moveTo(0);
    updateControls();
    startAutoplay();

    carousel._portfolioAutoplayCleanup = () => {
      window.clearInterval(autoplayTimer);
      window.cancelAnimationFrame(filterResetFrame);
      window.cancelAnimationFrame(animationFrame);
      filterObserver.disconnect();
      previousButton?.removeEventListener('click', handlePrevious);
      nextButton?.removeEventListener('click', handleNext);
      track.removeEventListener('keydown', handleKeydown);
      track.removeEventListener('pointerdown', handlePointerDown);
      track.removeEventListener('wheel', interruptAnimation);
      track.removeEventListener('scroll', handleScroll);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
    };
  };

  // ==========================================================================
  // MODALES
  // ==========================================================================

  const initModals = () => {
    // Triggers para abrir modales
    const modalTriggers = $$('[data-modal]');
    const modals = $$('.modal');
    const closeButtons = $$('.modal__close, [data-modal-close]');
    
    const openModal = (modalId) => {
      const modal = $(`#${modalId}`);
      if (modal) {
        modal.classList.remove('closing');
        modal.classList.add('open');
        document.body.classList.add('modal-open');
        // Focus trap
        const firstFocusable = modal.querySelector('button, [href], input, select, textarea');
        if (firstFocusable) firstFocusable.focus();
      }
    };
    
    const closeModal = (modal) => {
      if (!modal || modal.classList.contains('closing')) return;
      modal.classList.add('closing');
      setTimeout(() => {
        modal.classList.remove('open', 'closing');
        if (!$('.modal.open') && !$('.team-modal.active')) {
          document.body.classList.remove('modal-open');
        }
      }, 160);
    };
    
    const closeAllModals = () => {
      modals.forEach(modal => closeModal(modal));
    };
    
    // Event listeners
    modalTriggers.forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        const modalId = trigger.dataset.modal;
        openModal(modalId);
      });
    });
    
    closeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.modal');
        if (modal) closeModal(modal);
      });
    });
    
    // Cerrar al hacer click en backdrop
    modals.forEach(modal => {
      const backdrop = modal.querySelector('.modal__backdrop');
      if (backdrop) backdrop.addEventListener('click', () => closeModal(modal));
    });
    
    // Cerrar con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAllModals();
    });

    // Permite abrir una política directamente desde enlaces del blog o externos.
    const hashModal = window.location.hash.replace(/^#/, '');
    if (hashModal && document.getElementById(hashModal)?.classList.contains('modal')) {
      openModal(hashModal);
    }

  };


  // ==========================================================================
  // CARRUSEL DE TESTIMONIOS
  // ==========================================================================

  const initTestimonialsCarousel = () => {
    const track = $('.testimonials__track');
    const cards = [...track?.querySelectorAll(':scope > .testimonial-card') || []];
    
    if (!track || !cards.length) return;
    
    const slides = [];
    for (let index = 0; index < cards.length; index += 2) {
      const slide = document.createElement('div');
      slide.className = 'testimonial-slide';
      slide.append(cards[index]);
      if (cards[index + 1]) slide.append(cards[index + 1]);
      track.appendChild(slide);
      slides.push(slide);
    }

    const nav = track.parentElement?.querySelector('.testimonials__nav');
    if (nav) nav.remove();

    const totalSlides = slides.length;
    
    const goToSlide = (index) => {
      state.currentTestimonial = index;
      track.style.transform = `translateX(-${index * 100}%)`;
    };
    
    // Rotación automática sin controles manuales.
    window.setInterval(() => {
      const next = (state.currentTestimonial + 1) % totalSlides;
      goToSlide(next);
    }, 5000);
    
    
    // Touch/swipe support básico
  };

  // ==========================================================================
  // FAQ ACCORDION
  // ==========================================================================

  const initFAQ = () => {
    const items = $$('.faq-item');
    
    items.forEach(item => {
      const question = item.querySelector('.faq-item__question');
      
      if (!question) return;

      question.addEventListener('click', () => {
        const isExpanded = item.getAttribute('aria-expanded') === 'true';
        
        // Cerrar todos los demás (comportamiento accordion)
        items.forEach(i => {
          if (i !== item) {
            i.setAttribute('aria-expanded', 'false');
          }
        });
        
        // Toggle el actual
        item.setAttribute('aria-expanded', !isExpanded);
      });
    });
  };



  // ==========================================================================
  // VALIDACIÓN DE FORMULARIO
  // ==========================================================================

  const initContactForm = () => {
    const form = $('#contact-form');
    if (!form) return;
    const successDialog = form.querySelector('.contact-success');
    let submitting = false;
    let previousOverflow = '';
    successDialog?.querySelectorAll('[data-contact-success-close]').forEach(button => {
      button.addEventListener('click', () => successDialog.close());
    });
    successDialog?.addEventListener('close', () => {
      document.body.style.overflow = previousOverflow;
      form.querySelector('.form__submit')?.focus({ preventScroll: true });
    });
    
    const validators = {
      nombre: (value) => {
        if (!value.trim()) return 'Cuéntanos tu nombre';
        if (value.length < 2) return 'Escribe al menos 2 caracteres';
        return null;
      },
      email: (value) => {
        if (!value.trim()) return 'Cuéntanos a qué correo responderte';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Revisa que el correo esté bien escrito';
        return null;
      },
      empresa: (value) => {
        if (!value.trim()) return 'Cuéntanos el nombre de tu institución o equipo';
        return null;
      },
      telefono: (value) => {
        if (!value.trim()) return 'Déjanos un número para contactarte';
        const digits = value.replace(/\D/g, '');
        if (digits.length < 8 || digits.length > 15) return 'Revisa que el número esté completo';
        return null;
      },
      servicio: (value) => {
        if (!value) return 'Elige lo que más se acerca a tu objetivo';
        return null;
      },
      mensaje: (value) => {
        if (!value.trim()) return 'Cuéntanos brevemente qué quieres lograr';
        if (value.length < 10) return 'Danos un poco más de contexto para poder orientarte';
        return null;
      }
    };
    
    const validateField = (field) => {
      const name = field.id || field.name;
      const value = field.value;
      if ((name === 'empresa' || name === 'mensaje') && !value.trim()) return true;
      const validator = validators[name];
      const group = field.closest('.form__group');
      const errorEl = group ? group.querySelector('.form__error') : null;
      
      if (validator) {
        const error = validator(value);
        
        if (error) {
          field.classList.add('error');
          if (group) group.classList.add('has-error');
          if (errorEl) errorEl.textContent = error;
          return false;
        } else {
          field.classList.remove('error');
          if (group) group.classList.remove('has-error');
          if (errorEl) errorEl.textContent = '';
          return true;
        }
      }
      
      return true;
    };
    
    // Validar en blur
    const fields = form.querySelectorAll('.form__input, .form__select, .form__textarea');
    fields.forEach(field => {
      field.addEventListener('blur', () => validateField(field));
      field.addEventListener('input', () => {
        if (field.classList.contains('error')) {
          validateField(field);
        }
      });
    });
    
    // Submit
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (submitting) return;

      const turnstileResponse = form.querySelector('[name="cf-turnstile-response"]');
      const turnstileError = form.querySelector('.form__turnstile-error');
      if (!turnstileResponse || !turnstileResponse.value) {
        if (turnstileError) turnstileError.textContent = 'Confirma que eres una persona antes de enviar.';
        return;
      }
      if (turnstileError) turnstileError.textContent = '';
      
      let isValid = true;
      fields.forEach(field => {
        if (!validateField(field)) {
          isValid = false;
        }
      });
      
      if (isValid) {
        const submitBtn = form.querySelector('.form__submit');
        const originalBtnText = submitBtn.innerHTML;
        
        // Mostrar estado de carga
        submitting = true;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i data-lucide="loader-2" class="icon btn__icon" style="animation: spin 1s linear infinite;"></i> Enviando tu mensaje...';
        lucide.createIcons();
        
        try {
          const formData = new FormData(form);
          const query = new URLSearchParams(window.location.search);
          const attribution = Object.fromEntries(
            ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'gclid', 'fbclid']
              .filter(key => query.get(key))
              .map(key => [key, query.get(key)])
          );
          const messagePayload = {
            name: document.getElementById('nombre')?.value.trim() || '',
            email: document.getElementById('email')?.value.trim() || '',
            company: document.getElementById('empresa')?.value.trim() || '',
            phone: document.getElementById('telefono')?.value.trim() || '',
            service: document.getElementById('servicio')?.selectedOptions?.[0]?.textContent?.trim() || document.getElementById('servicio')?.value || '',
            budget: document.getElementById('presupuesto')?.selectedOptions?.[0]?.textContent?.trim() || document.getElementById('presupuesto')?.value || '',
            message: document.getElementById('mensaje')?.value.trim() || 'Solicitud de diagnóstico sin detalle adicional.',
            status: 'new',
            source: attribution.utm_source || 'sitio_web',
            metadata: {
              ...attribution,
              landing_path: window.location.pathname,
              referrer: document.referrer || 'directo'
            }
          };

          let savedInDashboard = false;
          try {
            await siteSupabaseFetch('/site_messages', {
              method: 'POST',
              body: JSON.stringify(messagePayload),
              headers: {
                Prefer: 'return=minimal'
              }
            });
            savedInDashboard = true;
          } catch (messageError) {
            console.warn('No se pudo guardar el mensaje en dashboard:', messageError.message || messageError);
          }

          let response = { ok: false };
          try {
            response = await fetch(form.action, {
              method: 'POST',
              body: formData,
              headers: {
                'Accept': 'application/json'
              }
            });
          } catch (emailError) {
            console.warn('No se pudo enviar FormSubmit:', emailError.message || emailError);
          }

          if (response.ok || savedInDashboard) {
            trackSiteEvent('contact_form_submit', {
              source: messagePayload.source,
              service: messagePayload.service,
              savedInDashboard,
              sentByEmail: response.ok
            });
            if (successDialog) {
              successDialog.querySelector('.contact-success__email').textContent = `Te responderemos a ${messagePayload.email}`;
              previousOverflow = document.body.style.overflow;
              successDialog.showModal();
              document.body.style.overflow = 'hidden';
              trackSiteEvent('thank_you_view', { source: 'contact_modal' });
            } else {
              showToast('Solicitud recibida. Te contactaremos para continuar.', 'success');
            }
            form.reset();
            if (window.turnstile) window.turnstile.reset(form.querySelector('.cf-turnstile'));
          } else {
            throw new Error('Error al enviar');
          }
        } catch (error) {
          showToast('No pudimos enviar tu mensaje. Intenta nuevamente o conversemos por WhatsApp.', 'error');
          console.error('Error:', error);
        } finally {
          submitting = false;
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
          lucide.createIcons();
        }
      }
    });
  };

  // ==========================================================================
  // CONTENIDO EDITABLE DESDE DASHBOARD
  // ==========================================================================

  const siteSupabaseFetch = async (path, options = {}) => {
    const response = await fetch(`${siteContentState.apiBase}${path}`, {
      ...options,
      headers: {
        apikey: siteContentState.anonKey,
        Authorization: `Bearer ${siteContentState.anonKey}`,
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });

    if (!response.ok) {
      const message = await response.text().catch(() => response.statusText);
      throw new Error(message || `Supabase HTTP ${response.status}`);
    }

    if (response.status === 204) return null;
    
    // Manejar respuestas vacías
    const contentLength = response.headers.get('content-length');
    if (contentLength === '0' || response.status === 201) return null;
    
    const text = await response.text();
    if (!text) return null;
    
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
    }
  };

  // Plantillas locales para campañas puntuales. No se cargan ni se configuran
  // desde el dashboard: se personalizan directamente aquí cuando se soliciten.
  const PUBLIC_OVERLAY_TEMPLATES = {
    countdowns: [
      {
        title: 'Campaña Solven Labs',
        eyebrow: 'Próxima campaña',
        start_at: '2026-12-31T23:59:59-03:00',
        link_label: 'Ver más',
        link_url: '#contacto',
        restore_label: 'Campaña',
        ended_label: 'Finalizada',
        position: 'bottom-left',
        active: false,
        hide_when_ended: true
      }
    ],
    popups: [
      {
        eyebrow: 'Solven Labs',
        title: 'Plantilla de aviso',
        subtitle: 'Contenido personalizado para una campaña puntual',
        details: 'Mensaje principal\nBeneficio destacado\nLlamado a la acción',
        note: '',
        image_url: '',
        image_alt: 'Aviso Solven Labs',
        cta: 'Conversemos',
        cta_url: '#contacto',
        position: 'center',
        style: 'light',
        delay_ms: 900,
        active: false
      }
    ]
  };

  // Campaign templates are opt-in; inactive placeholders must never render.
  const isSiteItemVisible = item => item.active === true || item.active === 'true';

  const loadSiteContent = async () => {
    try {
      const data = await siteSupabaseFetch('/site_content?select=section,content&is_active=eq.true', {
        headers: { Accept: 'application/json' },
        cache: 'no-store'
      });
      const rows = data || [];
      siteContentState.content = rows.reduce((acc, item) => {
        const section = String(item.section || '').toLowerCase();
        acc[section] = item.content || {};
        return acc;
      }, {});
      // Las claves actuales siempre prevalecen sobre filas antiguas, sin depender
      // del orden en que Supabase entregue los registros.
    } catch (err) {
      console.warn('Contenido editable no disponible. Se mantiene contenido estático:', err.message || err);
      siteContentState.content = {};
    }
  };



  const applyEditableContact = () => {
    const contact = Object.fromEntries(Object.entries(siteContentState.content.contact || {}).map(([key, value]) => [key, typeof value === 'string' ? value.replace(/NTEK/g, 'Solven Labs').replace(/contacto@ntek\.cl/g, 'tomas@solvenlabs.cl').replace(/ntek\.cl/g, 'solvenlabs.cl') : value]));
    const form = document.getElementById('contact-form');
    if (!form) return;
    const subject = form.querySelector('input[name="_subject"]');
    const autoresponse = form.querySelector('input[name="_autoresponse"]');
    const successText = form.querySelector('.form__success-text');
    if (contact.subject && subject) subject.value = contact.subject;
    if (contact.autoresponse && autoresponse) autoresponse.value = contact.autoresponse;
    if (contact.success_message && successText) successText.textContent = contact.success_message;
  };

  const showEntryPopups = () => {
    const popups = PUBLIC_OVERLAY_TEMPLATES.popups.filter(item => item && isSiteItemVisible(item));
    if (!popups.length) return;

    popups.forEach((popup, index) => {
      window.setTimeout(() => {
        const wrapper = document.createElement('div');
        const image = popup.image_url || popup.image || '';
        const details = String(popup.details || popup.bullets || '')
          .split('\n')
          .map(item => item.trim())
          .filter(Boolean);
        const position = ['top', 'bottom', 'left', 'right'].includes(String(popup.position || '').toLowerCase())
          ? String(popup.position).toLowerCase()
          : 'center';
        const style = ['success', 'dark', 'light'].includes(String(popup.style || popup.variant || '').toLowerCase())
          ? String(popup.style || popup.variant).toLowerCase()
          : 'light';
        const popupInfoItems = [
          { icon: 'calendar-days', label: 'Fecha', value: popup.date || popup.event_date },
          { icon: 'clock', label: 'Hora', value: popup.time || popup.event_time },
          { icon: 'user-round', label: 'Relator', value: popup.speaker || popup.presenter || popup.host },
          { icon: 'users', label: 'Dirigido a', value: popup.audience || popup.target || popup.directed_to }
        ].filter(item => item.value);
        const primaryCtaText = popup.cta || 'Ver más';
        const primaryCtaUrl = String(popup.cta_url || '');
        const externalPrimaryCta = primaryCtaUrl.startsWith('http');
        wrapper.className = `site-popup site-popup--${position} site-popup--${style}`;
        wrapper.innerHTML = `
          <div class="site-popup__backdrop"></div>
          <div class="site-popup__panel" role="dialog" aria-modal="true" aria-label="${escapeHtml(popup.title || 'Aviso')}">
            <button type="button" class="site-popup__close" aria-label="Cerrar"><i data-lucide="x"></i></button>
            ${image ? `<img class="site-popup__image" src="${escapeHtml(image)}" alt="${escapeHtml(popup.image_alt || popup.title || 'Aviso Solven Labs')}" loading="lazy">` : ''}
            <div class="site-popup__body">
              <span class="site-popup__eyebrow">${escapeHtml(popup.eyebrow || 'Solven Labs')}</span>
              <h3 class="site-popup__title">${escapeHtml(popup.title || 'Tenemos novedades')}</h3>
              ${popup.subtitle ? `<p class="site-popup__subtitle">${escapeHtml(popup.subtitle)}</p>` : ''}
              ${primaryCtaUrl ? `
                <div class="site-popup__actions site-popup__actions--top">
                  <a href="${escapeHtml(primaryCtaUrl)}" class="btn btn--primary btn--lg" ${externalPrimaryCta ? 'target="_blank" rel="noopener"' : ''}>${escapeHtml(primaryCtaText)}</a>
                </div>
              ` : ''}
              ${popupInfoItems.length ? `
                <div class="site-popup__info">
                  ${popupInfoItems.map(item => `
                    <div class="site-popup__info-item">
                      <i data-lucide="${item.icon}" class="icon icon--xs"></i>
                      <div>
                        <span>${escapeHtml(item.label)}</span>
                        <strong>${escapeHtml(item.value)}</strong>
                      </div>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
              ${details.length ? `<ul class="site-popup__list">${details.map(item => `<li><i data-lucide="check" class="icon icon--xs"></i>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}
              ${popup.note ? `<p class="site-popup__note">${escapeHtml(popup.note)}</p>` : ''}
            </div>
          </div>
        `;
        const close = () => {
          wrapper.classList.add('closing');
          window.setTimeout(() => wrapper.remove(), 260);
        };
        wrapper.querySelector('.site-popup__backdrop')?.addEventListener('click', close);
        wrapper.querySelector('.site-popup__close')?.addEventListener('click', close);
        wrapper.querySelectorAll('.site-popup__actions--top a').forEach(link => {
          link.addEventListener('click', () => {
            close();
          });
        });
        document.body.appendChild(wrapper);
        window.requestAnimationFrame(() => wrapper.classList.add('show'));
        if (window.lucide) window.lucide.createIcons();
      }, Number(popup.delay_ms ?? (index * 600 + 700)));
    });
  };

  const getActiveSiteCountdowns = () => PUBLIC_OVERLAY_TEMPLATES.countdowns
    .filter(item => item && isSiteItemVisible(item) && (item.start_at || item.target_date || item.date));

  const renderEditableCountdowns = () => {
    document.querySelectorAll('[data-webinar-countdown]').forEach(item => item.remove());
    const countdowns = getActiveSiteCountdowns();
    if (!countdowns.length) return;

    countdowns.slice(0, 1).forEach(item => {
      const countdown = document.createElement('aside');
      const position = String(item.position || 'bottom-left').toLowerCase();
      countdown.className = `webinar-countdown webinar-countdown--${position}`;
      countdown.dataset.webinarCountdown = '';
      countdown.dataset.webinarStart = item.start_at || item.target_date || item.date;
      countdown.dataset.webinarEndedLabel = item.ended_label || 'En vivo';
      countdown.dataset.webinarHideEnded = String(item.hide_when_ended === true || item.hide_when_ended === 'true');
      countdown.setAttribute('aria-label', item.aria_label || `Tiempo restante para ${item.title || 'el evento Solven Labs'}`);
      countdown.innerHTML = `
        <button type="button" class="webinar-countdown__restore" aria-label="Mostrar contador" data-webinar-restore><i data-lucide="chevron-right" class="icon icon--sm"></i><span>${escapeHtml(item.restore_label || item.title || 'Evento')}</span></button>
        <div class="webinar-countdown__header">
          <span class="webinar-countdown__eyebrow"><i data-lucide="timer" class="icon icon--xs"></i>${escapeHtml(item.eyebrow || item.label || item.title || 'Proximo evento')}</span>
          <div class="webinar-countdown__header-actions">
        <a href="${escapeHtml(item.link_url || item.url || '#contacto')}" class="webinar-countdown__link">${escapeHtml(item.link_label || item.cta || 'Ver más')}</a>
            <button type="button" class="webinar-countdown__minimize" aria-label="Minimizar contador" data-webinar-minimize><i data-lucide="chevron-left" class="icon icon--sm"></i></button>
          </div>
        </div>
        <div class="webinar-countdown__timer" role="timer" aria-live="polite"><span class="webinar-countdown__unit"><strong data-webinar-days>00</strong><small>Dias</small></span><span class="webinar-countdown__unit"><strong data-webinar-hours>00</strong><small>Hrs</small></span><span class="webinar-countdown__unit"><strong data-webinar-minutes>00</strong><small>Min</small></span><span class="webinar-countdown__unit"><strong data-webinar-seconds>00</strong><small>Seg</small></span></div>
      `;
      document.body.appendChild(countdown);
    });
  };

  const initEditableSiteContent = async () => {
    renderEditableCountdowns();
    await loadSiteContent();

    applyEditableContact();
    renderEditableCountdowns();
    initWebinarCountdown();
    showEntryPopups();
    if (window.lucide) window.lucide.createIcons();
  };

  // ==========================================================================
  // NEWSLETTER
  // ==========================================================================

  const initNewsletter = () => {
    const form = $('.footer__newsletter');
    if (!form) return;

    const input = form.querySelector('.footer__newsletter-input');
    const btn = form.querySelector('.footer__newsletter-btn');
    const success = form.parentElement ? form.parentElement.querySelector('.footer__newsletter-success') : null;

    if (!btn) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = input ? input.value.trim() : '';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!email || !emailRegex.test(email)) {
        if (input) input.classList.add('error');
        setTimeout(() => {
          if (input) input.classList.remove('error');
        }, 2000);
        return;
      }

      btn.disabled = true;
      const originalText = btn.innerText;
      btn.innerText = 'Enviando...';

      try {
        const formData = new FormData(form);
        // si el formulario requiere envío a un endpoint, se usa fetch.
        const response = await fetch(form.action, {
          method: 'POST',
          body: formData,
          headers: {
            Accept: 'application/json'
          }
        });

        if (!response.ok) throw new Error('Error al suscribirse');

        form.style.display = 'none';
        if (success) {
          success.classList.add('show');
          success.textContent = '¡Gracias por suscribirte! Revisa tu email.';
        }

        setTimeout(() => {
          if (input) input.value = '';
          form.style.display = 'flex';
          if (success) success.classList.remove('show');
        }, 5000);
      } catch (error) {
        console.error('Newsletter error:', error);
        if (success) {
          success.textContent = 'No se pudo suscribir. Intenta nuevamente.';
          success.classList.add('show');
        }
        setTimeout(() => {
          if (success) success.classList.remove('show');
        }, 5000);
      } finally {
        btn.disabled = false;
        btn.innerText = originalText;
      }
    });
  };

  // ==========================================================================
  // SERVICE CARD MODALES
  // ==========================================================================

  const initVisitCheckout = () => {
    const modal = $('#visit-checkout-modal');
    if (!modal) return;

    const serviceName = modal.querySelector('[data-visit-service-name]');
    const form = modal.querySelector('[data-visit-booking-form]');
    const dateInput = modal.querySelector('[data-visit-date]');
    const timeInput = modal.querySelector('[data-visit-time]');
    const errorBox = modal.querySelector('[data-visit-error]');
    const createButton = modal.querySelector('[data-visit-create]');
    const paymentLink = modal.querySelector('[data-visit-payment]');
    const paymentCopy = modal.querySelector('[data-visit-payment-copy]');
    const scheduleStep = modal.querySelector('[data-visit-step="schedule"]');
    const paymentStep = modal.querySelector('[data-visit-step="payment"]');
    const confirmStep = modal.querySelector('[data-visit-step="confirm"]');
    const statusBadge = modal.querySelector('[data-visit-status]');
    const statusCopy = modal.querySelector('[data-visit-status-copy]');
    const freeMeetingButton = modal.querySelector('[data-visit-free-meeting]');
    const functionsBase = siteContentState.apiBase.replace('/rest/v1', '/functions/v1');
    const reservationStorageKey = 'ntek_visit_reservation';
    try {
      const legacyReservation = localStorage.getItem(reservationStorageKey);
      if (legacyReservation && !sessionStorage.getItem(reservationStorageKey)) {
        sessionStorage.setItem(reservationStorageKey, legacyReservation);
      }
      localStorage.removeItem(reservationStorageKey);
    } catch (_) {}
    let selectedService = 'Visita técnica Solven Labs';
    let activeReservation = null;
    let statusTimer = null;
    let visitAvailabilityRequest = 0;
    const visitSlots = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
    const paymentResultModal = document.getElementById('payment-result-modal');
    const paymentResultPanel = paymentResultModal?.querySelector('.payment-result-modal__panel');
    const paymentResultImage = paymentResultModal?.querySelector('[data-payment-result-image]');
    const paymentResultBadge = paymentResultModal?.querySelector('[data-payment-result-badge]');
    const paymentResultTitle = paymentResultModal?.querySelector('[data-payment-result-title]');
    const paymentResultMessage = paymentResultModal?.querySelector('[data-payment-result-message]');

    const paymentResultContent = {
      success: {
        image: 'assets/solvi.svg', badge: 'Pago aprobado', title: '¡Tu pago fue validado con éxito!',
        message: 'Todo salió bien. Tu visita quedó confirmada y ya fue incorporada al calendario de Solven Labs.'
      },
      error: {
        image: 'assets/solvi.svg', badge: 'Pago no aprobado', title: 'No pudimos aprobar tu pago',
        message: 'La reserva no fue confirmada. Puedes cerrar este mensaje y volver a intentarlo con el medio de pago.'
      },
      pending: {
        image: 'assets/solvi.svg', badge: 'Validando pago', title: 'Estamos confirmando tu pago',
        message: 'El medio de pago respondió, pero aún estamos validando el resultado final. Esto puede tomar unos segundos.'
      }
    };

    const showPaymentResult = (state, message = '') => {
      if (!paymentResultModal) return;
      const content = paymentResultContent[state] || paymentResultContent.pending;
      paymentResultModal.classList.toggle('is-error', state === 'error');
      paymentResultModal.classList.toggle('is-pending', state === 'pending');
      if (paymentResultImage) { paymentResultImage.src = content.image; paymentResultImage.alt = `Solvi · ${content.badge}`; }
      if (paymentResultBadge) paymentResultBadge.textContent = content.badge;
      if (paymentResultTitle) paymentResultTitle.textContent = content.title;
      if (paymentResultMessage) paymentResultMessage.textContent = message || content.message;
      paymentResultModal.hidden = false;
      paymentResultPanel?.focus();
      updateLucideIcons();
    };

    const closePaymentResult = () => { if (paymentResultModal) paymentResultModal.hidden = true; };
    paymentResultModal?.querySelectorAll('[data-payment-result-close]').forEach(button => button.addEventListener('click', closePaymentResult));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && paymentResultModal && !paymentResultModal.hidden) {
        event.preventDefault();
        event.stopImmediatePropagation();
        closePaymentResult();
      }
    });

    const setEnabled = (link, enabled) => {
      if (!link) return;
      link.classList.toggle('is-disabled', !enabled);
      link.setAttribute('aria-disabled', String(!enabled));
      link.tabIndex = enabled ? 0 : -1;
    };

    const getChileDate = (offsetDays = 0) => {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit'
      }).formatToParts(new Date());
      const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
      const date = new Date(Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day) + offsetDays));
      return date.toISOString().slice(0, 10);
    };

    const showBookingError = message => {
      if (!errorBox) return;
      errorBox.textContent = message || '';
      errorBox.hidden = !message;
    };

    const setButtonLoading = (loading) => {
      if (!createButton) return;
      if (!createButton.dataset.defaultText) createButton.dataset.defaultText = createButton.innerHTML;
      createButton.disabled = loading;
      createButton.innerHTML = loading
        ? '<span class="visit-booking-form__spinner" aria-hidden="true"></span> Comprobando disponibilidad…'
        : createButton.dataset.defaultText;
    };

    const callBookingFunction = async (name, payload) => {
      const response = await fetch(`${functionsBase}/${name}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: siteContentState.anonKey,
          Authorization: `Bearer ${siteContentState.anonKey}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'No pudimos procesar la reserva. Intenta nuevamente.');
      return data;
    };

    const resetCheckout = () => {
      window.clearTimeout(statusTimer);
      [scheduleStep, paymentStep, confirmStep].forEach(step => step?.classList.remove('is-complete'));
      scheduleStep?.classList.remove('is-locked');
      paymentStep?.classList.add('is-locked');
      confirmStep?.classList.add('is-locked');
      setEnabled(paymentLink, false);
      if (paymentLink) paymentLink.href = '#';
      if (paymentCopy) paymentCopy.textContent = 'Primero elige tu horario. Luego tendrás 20 minutos para completar el pago seguro.';
      if (statusCopy) statusCopy.textContent = 'Esperaremos la confirmación segura del pago. Solo entonces aparecerá la visita en nuestro calendario.';
      if (statusBadge) {
        statusBadge.className = 'visit-checkout__manual-status';
        statusBadge.innerHTML = '<i data-lucide="lock-keyhole" class="icon icon--sm"></i> Aún sin confirmar';
      }
      form?.reset();
      if (dateInput) {
        dateInput.min = getChileDate();
        dateInput.max = getChileDate(90);
      }
      if (timeInput) {
        timeInput.innerHTML = '<option value="">Primero elige una fecha</option>';
        timeInput.disabled = true;
      }
      showBookingError('');
      activeReservation = null;
      updateLucideIcons();
    };

    const openCheckout = (name, shouldReset = true) => {
      selectedService = name || 'Visita técnica Solven Labs';
      if (serviceName) serviceName.textContent = selectedService;
      if (shouldReset) resetCheckout();
      modal.classList.remove('closing');
      modal.classList.add('open');
      document.body.classList.add('modal-open');
      window.setTimeout(() => (shouldReset ? dateInput : statusBadge)?.focus?.(), 50);
    };

    $$('[data-visit-checkout]').forEach(button => {
      button.addEventListener('click', () => openCheckout(button.dataset.visitService));
    });

    freeMeetingButton?.addEventListener('click', () => {
      modal.classList.remove('open');
      document.dispatchEvent(new CustomEvent('ntek:open-free-booking'));
    });

    document.addEventListener('ntek:open-visit-checkout', event => {
      openCheckout(event.detail?.service);
    });

    dateInput?.addEventListener('change', async () => {
      if (!dateInput.value) return;
      const weekday = new Date(`${dateInput.value}T12:00:00`).getDay();
      if (weekday === 0) {
        dateInput.value = '';
        if (timeInput) {
          timeInput.innerHTML = '<option value="">Primero elige una fecha</option>';
          timeInput.disabled = true;
        }
        showBookingError('Los domingos descansamos. Elige un día entre lunes y sábado.');
        return;
      }

      showBookingError('');
      const selectedDate = dateInput.value;
      const requestId = ++visitAvailabilityRequest;
      if (timeInput) {
        timeInput.innerHTML = '<option value="">Consultando disponibilidad...</option>';
        timeInput.disabled = true;
      }
      try {
        const result = await callBookingFunction('booking-availability', { date: selectedDate, duration_minutes: 60 });
        if (requestId !== visitAvailabilityRequest || dateInput.value !== selectedDate || !timeInput) return;
        const occupied = new Set(result.occupied || []);
        const availableCount = visitSlots.filter(slot => !occupied.has(slot)).length;
        timeInput.innerHTML = `<option value="">Selecciona un horario</option>${visitSlots.map(slot => (
          `<option value="${slot}" ${occupied.has(slot) ? 'disabled' : ''}>${slot}${occupied.has(slot) ? ' · No disponible' : ''}</option>`
        )).join('')}`;
        timeInput.disabled = availableCount === 0;
        if (!availableCount) showBookingError('No quedan horarios disponibles ese día. Prueba con otra fecha.');
      } catch (error) {
        if (requestId !== visitAvailabilityRequest || !timeInput) return;
        timeInput.innerHTML = '<option value="">No se pudo cargar</option>';
        timeInput.disabled = true;
        showBookingError(error.message);
      }
    });

    form?.addEventListener('submit', async event => {
      event.preventDefault();
      showBookingError('');
      if (!form.reportValidity()) return;

      const fields = new FormData(form);
      const visitDate = String(fields.get('visit_date') || '');
      const weekday = new Date(`${visitDate}T12:00:00`).getDay();
      if (weekday === 0) {
        showBookingError('Elige un día entre lunes y sábado.');
        return;
      }

      setButtonLoading(true);
      try {
        const result = await callBookingFunction('create-visit-reservation', {
          service_name: selectedService,
          visit_date: visitDate,
          visit_time: String(fields.get('visit_time') || ''),
          customer_name: String(fields.get('customer_name') || '').trim(),
          customer_email: String(fields.get('customer_email') || '').trim(),
          customer_phone: String(fields.get('customer_phone') || '').trim()
        });

        activeReservation = {
          id: result.reservation_id,
          service: selectedService,
          date: visitDate,
          time: String(fields.get('visit_time') || ''),
          payment_url: result.payment_url,
          expires_at: result.expires_at
        };
        sessionStorage.setItem(reservationStorageKey, JSON.stringify(activeReservation));
        scheduleStep?.classList.add('is-complete');
        paymentStep?.classList.remove('is-locked');
        if (paymentLink) paymentLink.href = result.payment_url;
        setEnabled(paymentLink, true);
        if (paymentCopy) paymentCopy.textContent = `Apartamos el ${visitDate} a las ${activeReservation.time} durante 20 minutos. Completa el pago para confirmarlo.`;
        paymentLink?.focus();
      } catch (error) {
        showBookingError(error.message);
      } finally {
        setButtonLoading(false);
        updateLucideIcons();
      }
    });

    paymentLink?.addEventListener('click', event => {
      if (paymentLink.classList.contains('is-disabled') || !activeReservation) {
        event.preventDefault();
      }
    });

    const paintReservationStatus = reservation => {
      if (!reservation) return false;
      const status = reservation.status;
      scheduleStep?.classList.add('is-complete');
      paymentStep?.classList.remove('is-locked');
      confirmStep?.classList.remove('is-locked');

      if (status === 'approved') {
        paymentStep?.classList.add('is-complete');
        confirmStep?.classList.add('is-complete');
        setEnabled(paymentLink, false);
        if (statusBadge) {
          statusBadge.className = 'visit-checkout__manual-status is-approved';
          statusBadge.innerHTML = '<i data-lucide="badge-check" class="icon icon--sm"></i> Pago aprobado · visita confirmada';
        }
        if (statusCopy) statusCopy.textContent = `Listo: tu visita quedó guardada para el ${reservation.visit_date} a las ${reservation.visit_time}. Ya aparece en el calendario de Solven Labs.`;
        sessionStorage.removeItem(reservationStorageKey);
        showPaymentResult('success', `Tu visita quedó confirmada para el ${reservation.visit_date} a las ${reservation.visit_time}. Ya aparece en el calendario de Solven Labs.`);
        updateLucideIcons();
        return true;
      }

      if (['rejected', 'cancelled', 'expired', 'payment_mismatch', 'needs_review'].includes(status)) {
        if (statusBadge) {
          statusBadge.className = 'visit-checkout__manual-status is-rejected';
          statusBadge.innerHTML = '<i data-lucide="circle-x" class="icon icon--sm"></i> El pago no pudo validarse';
        }
        if (statusCopy) statusCopy.textContent = status === 'needs_review'
          ? 'El pago requiere revisión porque el horario dejó de estar disponible. Escríbenos y lo resolveremos contigo.'
          : 'No guardamos ninguna cita. Puedes volver al paso de pago e intentarlo nuevamente.';
        setEnabled(paymentLink, Boolean(activeReservation?.payment_url));
        showPaymentResult('error', status === 'needs_review'
          ? 'El pago requiere revisión porque el horario dejó de estar disponible. Escríbenos y lo resolveremos contigo.'
          : 'El medio de pago no aprobó la operación y no guardamos ninguna cita. Puedes volver a intentarlo.');
        updateLucideIcons();
        return true;
      }

      if (statusBadge) {
        statusBadge.className = 'visit-checkout__manual-status is-pending';
        statusBadge.innerHTML = '<span class="visit-booking-form__spinner" aria-hidden="true"></span> Validando el pago…';
      }
      if (statusCopy) statusCopy.textContent = 'Estamos consultando el pago. No cerremos esta ventana todavía.';
      updateLucideIcons();
      return false;
    };

    const pollReservationStatus = async (reservationId, paymentId = '', attempt = 0) => {
      try {
        const result = await callBookingFunction('visit-reservation-status', {
          reservation_id: reservationId,
          payment_id: attempt === 0 ? paymentId : ''
        });
        if (paintReservationStatus(result.reservation)) return;
        if (attempt >= 20) {
          showPaymentResult('pending', 'La validación está tardando más de lo habitual. Puedes cerrar este mensaje; actualizaremos la reserva automáticamente cuando se confirme el pago.');
          return;
        }
      } catch (error) {
        if (attempt >= 20) {
          if (statusCopy) statusCopy.textContent = 'La validación está tardando más de lo habitual. Puedes cerrar esta ventana; la reserva aparecerá automáticamente cuando se confirme el pago.';
          showPaymentResult('pending', 'La validación está tardando más de lo habitual. Puedes cerrar este mensaje; actualizaremos la reserva automáticamente cuando se confirme el pago.');
          return;
        }
      }
      statusTimer = window.setTimeout(() => pollReservationStatus(reservationId, '', attempt + 1), 2500);
    };

    const resumePaymentReturn = () => {
      const params = new URLSearchParams(window.location.search);
      const returnState = params.get('visit_payment');
      const reservationId = params.get('reservation_id');
      const returnedPaymentId = params.get('payment_id') || params.get('collection_id') || '';
      if (!returnState || !reservationId) return;

      try {
        activeReservation = JSON.parse(sessionStorage.getItem(reservationStorageKey) || 'null');
      } catch (_) {
        activeReservation = null;
      }
      activeReservation = { ...(activeReservation || {}), id: reservationId };
      openCheckout(activeReservation.service || 'Visita técnica Solven Labs', false);
      scheduleStep?.classList.add('is-complete');
      paymentStep?.classList.remove('is-locked');
      confirmStep?.classList.remove('is-locked');

      if (returnState === 'failure') {
        paintReservationStatus({ status: 'rejected' });
      } else {
        paintReservationStatus({ status: 'pending' });
        showPaymentResult('pending');
        pollReservationStatus(reservationId, returnedPaymentId);
      }

      params.delete('visit_payment');
      params.delete('reservation_id');
      params.delete('payment_id');
      params.delete('collection_id');
      params.delete('collection_status');
      params.delete('payment_type');
      params.delete('merchant_order_id');
      params.delete('preference_id');
      params.delete('site_id');
      params.delete('processing_mode');
      params.delete('merchant_account_id');
      const cleanQuery = params.toString();
      history.replaceState({}, '', `${window.location.pathname}${cleanQuery ? `?${cleanQuery}` : ''}${window.location.hash}`);
    };

    if (dateInput) {
      dateInput.min = getChileDate();
      dateInput.max = getChileDate(90);
    }
    resumePaymentReturn();
  };

  const initFreeConsultationBooking = () => {
    const modal = document.getElementById('free-consultation-modal');
    if (!modal) return;

    const form = modal.querySelector('[data-free-consultation-form]');
    const dateInput = modal.querySelector('[data-free-booking-date]');
    const timeSelect = modal.querySelector('[data-free-booking-time]');
    const availabilityCopy = modal.querySelector('[data-free-availability]');
    const errorBox = modal.querySelector('[data-free-booking-error]');
    const submitButton = modal.querySelector('[data-free-booking-submit]');
    const successBox = modal.querySelector('[data-free-booking-success]');
    const successCopy = modal.querySelector('[data-free-booking-success-copy]');
    const functionsBase = siteContentState.apiBase.replace('/rest/v1', '/functions/v1');
    const slots = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
    let availabilityRequest = 0;

    const getChileDate = (offsetDays = 0) => {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit'
      }).formatToParts(new Date());
      const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
      const date = new Date(Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day) + offsetDays));
      return date.toISOString().slice(0, 10);
    };

    const callBookingFunction = async (name, payload) => {
      const response = await fetch(`${functionsBase}/${name}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: siteContentState.anonKey,
          Authorization: `Bearer ${siteContentState.anonKey}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'No pudimos procesar la agenda. Intenta nuevamente.');
      return data;
    };

    const showError = message => {
      if (!errorBox) return;
      errorBox.textContent = message || '';
      errorBox.hidden = !message;
    };

    const renderSlots = (occupied = [], prompt = 'Selecciona un horario') => {
      const unavailable = new Set(occupied);
      const availableCount = slots.filter(slot => !unavailable.has(slot)).length;
      timeSelect.innerHTML = `<option value="">${prompt}</option>${slots.map(slot => (
        `<option value="${slot}" ${unavailable.has(slot) ? 'disabled' : ''}>${slot}${unavailable.has(slot) ? ' · No disponible' : ''}</option>`
      )).join('')}`;
      timeSelect.disabled = availableCount === 0;
      return availableCount;
    };

    const resetForm = () => {
      form?.reset();
      form.hidden = false;
      successBox.hidden = true;
      dateInput.min = getChileDate();
      dateInput.max = getChileDate(90);
      timeSelect.innerHTML = '<option value="">Primero elige una fecha</option>';
      timeSelect.disabled = true;
      if (availabilityCopy) availabilityCopy.textContent = '';
      showError('');
    };

    const openBooking = () => {
      resetForm();
      modal.classList.remove('closing');
      modal.classList.add('open');
      document.body.classList.add('modal-open');
      window.setTimeout(() => dateInput.focus(), 50);
    };

    document.addEventListener('click', event => {
      if (event.defaultPrevented) return;
      const trigger = event.target.closest('[data-free-booking]');
      if (!trigger) return;
      event.preventDefault();
      trigger.closest('.modal')?.classList.remove('open');
      openBooking();
    });

    document.addEventListener('ntek:open-free-booking', openBooking);

    dateInput?.addEventListener('change', async () => {
      showError('');
      const selectedDate = dateInput.value;
      const weekday = selectedDate ? new Date(`${selectedDate}T12:00:00`).getDay() : -1;
      if (!selectedDate) return;
      if (weekday === 0) {
        dateInput.value = '';
        timeSelect.innerHTML = '<option value="">Primero elige una fecha</option>';
        timeSelect.disabled = true;
        if (availabilityCopy) availabilityCopy.textContent = '';
        showError('Los domingos descansamos. Elige un día entre lunes y sábado.');
        return;
      }

      const requestId = ++availabilityRequest;
      timeSelect.innerHTML = '<option value="">Consultando disponibilidad…</option>';
      timeSelect.disabled = true;
      if (availabilityCopy) availabilityCopy.textContent = 'Revisando el calendario compartido…';
      try {
        const result = await callBookingFunction('booking-availability', { date: selectedDate, duration_minutes: 30 });
        if (requestId !== availabilityRequest || dateInput.value !== selectedDate) return;
        const availableCount = renderSlots(result.occupied || []);
        if (availabilityCopy) availabilityCopy.textContent = availableCount
          ? `${availableCount} horario${availableCount === 1 ? '' : 's'} disponible${availableCount === 1 ? '' : 's'}.`
          : 'No quedan horarios ese día. Prueba con otra fecha.';
      } catch (error) {
        if (requestId !== availabilityRequest) return;
        timeSelect.innerHTML = '<option value="">No se pudo cargar</option>';
        timeSelect.disabled = true;
        if (availabilityCopy) availabilityCopy.textContent = '';
        showError(error.message);
      }
    });

    form?.addEventListener('submit', async event => {
      event.preventDefault();
      showError('');
      if (!form.reportValidity()) return;
      const fields = new FormData(form);
      const originalHtml = submitButton.innerHTML;
      submitButton.disabled = true;
      submitButton.innerHTML = '<span class="visit-booking-form__spinner" aria-hidden="true"></span> Confirmando horario…';
      try {
        const result = await callBookingFunction('create-free-consultation', {
          booking_date: String(fields.get('booking_date') || ''),
          booking_time: String(fields.get('booking_time') || ''),
          customer_name: String(fields.get('customer_name') || '').trim(),
          customer_email: String(fields.get('customer_email') || '').trim(),
          customer_phone: String(fields.get('customer_phone') || '').trim(),
          company: String(fields.get('company') || '').trim(),
          topic: String(fields.get('topic') || '').trim()
        });
        form.hidden = true;
        successBox.hidden = false;
        if (successCopy) successCopy.textContent = `Te esperamos el ${result.booking_date} a las ${result.booking_time}. El horario ya quedó reservado en nuestro calendario.`;
        successBox.focus();
      } catch (error) {
        showError(error.message);
        if (/horario/i.test(error.message)) dateInput.dispatchEvent(new Event('change'));
      } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = originalHtml;
        updateLucideIcons();
      }
    });

    dateInput.min = getChileDate();
    dateInput.max = getChileDate(90);
    const params = new URLSearchParams(window.location.search);
    if (params.get('agenda') === '1') {
      openBooking();
      params.delete('agenda');
      const cleanQuery = params.toString();
      history.replaceState({}, '', `${window.location.pathname}${cleanQuery ? `?${cleanQuery}` : ''}${window.location.hash}`);
    }
  };


  const initServiceModals = () => {
    const serviceCards = [...new Set([
      ...$$('.service-card__link'),
      ...$$('.pricing__service-cta'),
      ...$$('[data-service-modal]')
    ])];
    const modal = $('#service-modal');
    const modalTitle = modal ? (modal.querySelector('.service-modal__title-text') || modal.querySelector('.modal__title')) : null;
    const modalBody = modal ? modal.querySelector('.modal__body') : null;
    
    const serviceDetails = {
      'dev-web': {
        title: 'Aplicaciones a medida',
        hideServicePrice: true,
        content: `
          <p class="service-modal__intro">Creamos aplicaciones para registrar información, coordinar equipos y resolver procesos específicos de tu organización.</p>

          <div class="service-modal__section">
            <h4><i data-lucide="layout" class="icon icon--sm"></i> Soluciones que podemos construir</h4>
            <div class="service-modal__tags">
              <span class="tag">Sistema especializado</span>
              <span class="tag">Aplicación web</span>
              <span class="tag">Plataforma web</span>
              <span class="tag">Panel de resultados</span>
              <span class="tag">Base de datos</span>
              <span class="tag">Portal de usuarios</span>
            </div>
          </div>

          <div class="service-modal__section">
            <h4><i data-lucide="package" class="icon icon--sm"></i> Qué considera el desarrollo</h4>
            <ul class="service-modal__checklist">
              <li><i data-lucide="check-circle" class="icon"></i> Revisión de lo que necesitas y qué incluirá el proyecto</li>
              <li><i data-lucide="check-circle" class="icon"></i> Pantallas, funciones y organización de los datos</li>
              <li><i data-lucide="check-circle" class="icon"></i> Integraciones con fuentes, APIs o herramientas existentes</li>
              <li><i data-lucide="check-circle" class="icon"></i> Pruebas, guías y capacitación del equipo</li>
            </ul>
          </div>

          <div class="service-modal__section">
            <h4><i data-lucide="clock" class="icon icon--sm"></i> Tiempo de entrega</h4>
            <p>Entre 4 y 12 semanas. Trabajamos por etapas para que veas el avance en todo momento.</p>
          </div>

          <div class="service-modal__section service-modal__section--plans">
            <h4><i data-lucide="shield" class="icon icon--sm"></i> Planes de mantención</h4>
            <div class="plans-table-wrap"><table class="plans-table">
              <thead><tr>
                <th>Beneficio</th>
                <th class="plans-table__col--basic">Plan esencial</th>
                <th class="plans-table__col--full">Plan crecimiento</th>
              </tr></thead>
              <tbody>
                <tr><td>Hosting + monitoreo de uptime</td><td class="plans-table__col--basic"><i data-lucide="check" class="icon icon--sm plans-ok"></i></td><td class="plans-table__col--full"><i data-lucide="check" class="icon icon--sm plans-ok"></i></td></tr>
                <tr><td>Actualizaciones de texto e imágenes</td><td class="plans-table__col--basic">Hasta 30&nbsp;min/mes</td><td class="plans-table__col--full">Hasta 2&nbsp;h/mes</td></tr>
                <tr><td>Backups + seguridad básica</td><td class="plans-table__col--basic"><i data-lucide="check" class="icon icon--sm plans-ok"></i></td><td class="plans-table__col--full"><i data-lucide="check" class="icon icon--sm plans-ok"></i></td></tr>
                <tr><td>Soporte WhatsApp horario hábil</td><td class="plans-table__col--basic"><i data-lucide="check" class="icon icon--sm plans-ok"></i></td><td class="plans-table__col--full"><i data-lucide="check" class="icon icon--sm plans-ok"></i></td></tr>
                <tr><td>Optimización de velocidad</td><td class="plans-table__col--basic"><i data-lucide="minus" class="icon icon--sm plans-no"></i></td><td class="plans-table__col--full"><i data-lucide="check" class="icon icon--sm plans-ok"></i></td></tr>
                <tr><td>Ajustes de conversión (CTA, formularios)</td><td class="plans-table__col--basic"><i data-lucide="minus" class="icon icon--sm plans-no"></i></td><td class="plans-table__col--full"><i data-lucide="check" class="icon icon--sm plans-ok"></i></td></tr>
                <tr><td>Reporte mensual de visitas y leads</td><td class="plans-table__col--basic"><i data-lucide="minus" class="icon icon--sm plans-no"></i></td><td class="plans-table__col--full"><i data-lucide="check" class="icon icon--sm plans-ok"></i></td></tr>
              </tbody>
            </table></div>
          </div>
        `,
        pricingMin: 'Presupuesto personalizado',
        maintenance: 'Plan opcional según necesidad',
        externalCosts: 'Dominio o licencias especiales se cotizan aparte',
        delivery: '3–5 semanas',
        features: ['Desarrollo a medida', 'Arquitectura y datos', 'Documentación técnica', 'Soporte inicial']
      },

      ecommerce: {
        title: 'Tiendas Shopify y ecommerce a medida',
        hideServicePrice: true,
        content: `
          <p class="service-modal__intro">Puedes comenzar rápido con Shopify o construir una tienda nativa propia cuando el negocio necesita reglas, experiencia e integraciones más específicas.</p>
          <div class="service-modal__section service-modal__section--plans">
            <h4><i data-lucide="layers-3" class="icon icon--sm"></i> Dos formas de implementar</h4>
            <div class="plans-table-wrap"><table class="plans-table">
              <thead><tr><th>Alternativa</th><th>Enfoque</th><th>Conviene cuando</th></tr></thead>
              <tbody>
                <tr><td><strong>Shopify</strong></td><td>Implementación ágil</td><td>Necesitas vender pronto con una plataforma administrable</td></tr>
                <tr><td><strong>Ecommerce nativo</strong></td><td>Desarrollo personalizado</td><td>Requieres diseño propio, reglas especiales o integraciones avanzadas</td></tr>
              </tbody>
            </table></div>
          </div>
          <div class="service-modal__section">
            <h4><i data-lucide="shopping-cart" class="icon icon--sm"></i> Qué incluye</h4>
            <ul class="service-modal__checklist">
              <li><i data-lucide="check-circle" class="icon"></i> Catálogo, fichas de producto, carrito y proceso de compra</li>
              <li><i data-lucide="check-circle" class="icon"></i> Integración con un medio de pago y configuración de despacho o retiro</li>
              <li><i data-lucide="check-circle" class="icon"></i> Correos de pedido, analítica y conexión con tus canales de contacto</li>
              <li><i data-lucide="check-circle" class="icon"></i> Carga inicial acordada y capacitación para administrar ventas</li>
            </ul>
          </div>
          <div class="service-modal__section">
            <h4><i data-lucide="layers" class="icon icon--sm"></i> Opciones para crecer</h4>
            <p>Podemos sumar facturación, inventario, transportistas, recuperación de carritos, campañas o integraciones con sistemas internos después de validar el flujo base.</p>
          </div>
        `,
        pricingMin: 'Presupuesto personalizado',
        maintenance: 'Plan opcional según plataforma',
        externalCosts: 'Plan de Shopify, comisiones, dominio y apps se informan aparte',
        delivery: 'Shopify 3–5 semanas · nativa 5–8 semanas',
        features: ['Shopify o desarrollo propio', 'Catálogo y carrito', 'Pagos y despacho', 'Capacitación']
      },

      cybersecurity: {
        title: 'Servidores y seguridad',
        content: `
          <p class="service-modal__intro">Preparamos los servidores, permisos y respaldos para que tu herramienta funcione y tu equipo pueda usarla.</p>

          <div class="service-modal__section">
            <h4><i data-lucide="shield" class="icon icon--sm"></i> ¿Qué incluye?</h4>
            <ul class="service-modal__checklist">
              <li><i data-lucide="check-circle" class="icon"></i>Arquitectura de software y selección de infraestructura</li>
              <li><i data-lucide="check-circle" class="icon"></i>Instalación de aplicaciones, respaldos y revisión del funcionamiento</li>
              <li><i data-lucide="check-circle" class="icon"></i>Revisión de accesos, permisos y seguridad básica</li>
              <li><i data-lucide="check-circle" class="icon"></i>Documentación técnica y plan de continuidad</li>
            </ul>
          </div>

          <div class="service-modal__section">
            <h4><i data-lucide="package" class="icon icon--sm"></i> Resultado entregado</h4>
            <p>Recibes una base técnica documentada, con decisiones explícitas y recomendaciones para mantener y evolucionar la solución.</p>
          </div>

          <div class="service-modal__section">
            <h4><i data-lucide="clock" class="icon icon--sm"></i> Tiempo de entrega</h4>
            <p>Informe completo en 1–2 semanas. Si detectamos urgencias críticas, te contactamos de inmediato para tomar medidas.</p>
          </div>
        `,
        pricingMin: 'Lo definimos contigo',
        features: ['Revisión de seguridad', 'Informe de vulnerabilidades', 'Acciones correctivas', 'Soporte recomendado']
      },

      'dev-mobile': {
        title: 'Aplicaciones móviles conectadas al negocio',
        content: `
          <p class="service-modal__intro">Cuando el celular es clave para clientes o equipos internos, diseñamos aplicaciones que forman parte de tu ecosistema digital y se conectan con pagos, datos, notificaciones o sistemas existentes.</p>

          <div class="service-modal__section">
            <h4><i data-lucide="smartphone" class="icon icon--sm"></i> Tipos de aplicación</h4>
            <div class="service-modal__tags">
              <span class="tag">App para clientes</span>
              <span class="tag">App de gestión interna</span>
              <span class="tag">E-commerce móvil</span>
              <span class="tag">App con notificaciones</span>
              <span class="tag">iPhone & Android</span>
              <span class="tag">Publicación en tiendas</span>
            </div>
          </div>

          <div class="service-modal__section">
            <h4><i data-lucide="package" class="icon icon--sm"></i> Lo que recibes</h4>
            <ul class="service-modal__checklist">
              <li><i data-lucide="check-circle" class="icon"></i> Aplicación lista para publicar en App Store y Google Play</li>
              <li><i data-lucide="check-circle" class="icon"></i> Diseño atractivo y fácil de navegar desde el celular</li>
              <li><i data-lucide="check-circle" class="icon"></i> Conexión con tu sitio web, pagos u otros servicios</li>
              <li><i data-lucide="check-circle" class="icon"></i> Soporte y actualizaciones después del lanzamiento</li>
            </ul>
          </div>

          <div class="service-modal__section">
            <h4><i data-lucide="clock" class="icon icon--sm"></i> Tiempo de entrega</h4>
            <p>Entre 6 y 16 semanas según las funciones que necesites. Te mostramos avances en cada etapa para que siempre sepas cómo va tu proyecto.</p>
          </div>
        `,
        pricingMin: 'Lo definimos contigo',
        features: ['iPhone & Android', 'Publicación en tiendas', 'Diseño a medida', 'Soporte incluido']
      },

      'research-data': {
        title: 'Datos y paneles de resultados',
        hideServicePrice: true,
        content: `
          <p class="service-modal__intro">Organizamos tus datos, conectamos sistemas y creamos paneles para consultar indicadores y comparar resultados.</p>
          <div class="service-modal__section">
            <h4><i data-lucide="database" class="icon icon--sm"></i> Qué podemos integrar</h4>
            <ul class="service-modal__checklist">
              <li><i data-lucide="check-circle" class="icon"></i> Limpieza, procesamiento y organización de fuentes de datos</li>
              <li><i data-lucide="check-circle" class="icon"></i> Pasos que se pueden repetir para revisar la calidad y el origen de los datos</li>
              <li><i data-lucide="check-circle" class="icon"></i> Paneles y gráficos para consultar resultados</li>
              <li><i data-lucide="check-circle" class="icon"></i> Guías y capacitación para tu equipo</li>
            </ul>
          </div>
          <div class="service-modal__section">
            <h4><i data-lucide="scan-search" class="icon icon--sm"></i> Punto de partida</h4>
            <p>Revisamos tus fuentes, preguntas de análisis y requisitos de acceso para definir los entregables y sus criterios de validación.</p>
          </div>
        `,
        pricingMin: 'Según alcance del proyecto',
        features: ['Datos con origen conocido', 'Procesos que puedes repetir', 'Visualización', 'Entrega y capacitación']
      },

      dev: {
        title: 'Pilotos de IA en salud ideas',
        content: `
          <p class="service-modal__intro">Construimos una primera versión de tu idea para probar cómo funciona antes de desarrollar la solución completa.</p>

          <div class="service-modal__section">
            <h4><i data-lucide="code-2" class="icon icon--sm"></i> Componentes de la solución</h4>
            <div class="service-modal__tags">
              <span class="tag">React</span>
              <span class="tag">Node.js</span>
              <span class="tag">React Native / Flutter</span>
              <span class="tag">PostgreSQL</span>
              <span class="tag">AWS / Supabase</span>
              <span class="tag">Figma</span>
            </div>
          </div>

          <div class="service-modal__section">
            <h4><i data-lucide="package" class="icon icon--sm"></i> Entregables clave</h4>
            <ul class="service-modal__checklist">
              <li><i data-lucide="check-circle" class="icon"></i> Prototipo de alta fidelidad y especificaciones funcionales</li>
              <li><i data-lucide="check-circle" class="icon"></i> Desarrollo frontend y backend con pruebas automatizadas</li>
              <li><i data-lucide="check-circle" class="icon"></i> Pruebas automáticas y puesta en funcionamiento</li>
              <li><i data-lucide="check-circle" class="icon"></i> Guías de uso y capacitación del equipo</li>
            </ul>
          </div>

          <div class="service-modal__section">
            <h4><i data-lucide="clock" class="icon icon--sm"></i> Alcance típico</h4>
            <p>6–16 semanas (según alcance y complejidad). Entregas por hitos y revisión continua.</p>
          </div>
        `,
        pricingMin: 'Lo definimos contigo',
        features: ['Solución web + mobile', 'Preparado para crecer', 'Entrega por etapas', 'Soporte inicial']
      },

      aiAutomation: {
        title: 'Inteligencia artificial aplicada',
        hideServicePrice: true,
        content: `
          <p class="service-modal__intro">Usamos inteligencia artificial para analizar datos, imágenes o textos. Probamos los resultados contigo antes de incorporarla a tu herramienta.</p>

          <div class="service-modal__section">
            <h4><i data-lucide="sparkles" class="icon icon--sm"></i> Qué podemos hacer</h4>
            <div class="service-modal__tags">
              <span class="tag">Machine learning</span>
              <span class="tag">IA generativa</span>
              <span class="tag">Visión computacional</span>
              <span class="tag">Procesamiento de lenguaje</span>
              <span class="tag">Análisis de datos</span>
              <span class="tag">Integración de modelos</span>
              <span class="tag">Automatización de flujos</span>
              <span class="tag">Clasificación de documentos</span>
            </div>
          </div>

          <div class="service-modal__section">
            <h4><i data-lucide="package" class="icon icon--sm"></i> Lo que recibes</h4>
            <ul class="service-modal__checklist">
              <li><i data-lucide="check-circle" class="icon"></i> Revisión del problema, los datos disponibles y los criterios de validación</li>
              <li><i data-lucide="check-circle" class="icon"></i> Piloto funcional antes de escalar la solución</li>
              <li><i data-lucide="check-circle" class="icon"></i> Integración del modelo con la plataforma o flujo del proyecto</li>
              <li><i data-lucide="check-circle" class="icon"></i> Documentación para comprender el alcance y las limitaciones</li>
            </ul>
          </div>

          <div class="service-modal__section">
            <h4><i data-lucide="clock" class="icon icon--sm"></i> Tiempo de entrega</h4>
            <p>Entre 2 y 6 semanas según los flujos a automatizar. Empezamos por lo más sencillo y avanzamos a tu ritmo.</p>
          </div>

          <div class="service-modal__section service-modal__section--plans">
            <h4><i data-lucide="shield" class="icon icon--sm"></i> Planes de mantención</h4>
            <div class="plans-table-wrap"><table class="plans-table">
              <thead><tr>
                <th>Beneficio</th>
                <th class="plans-table__col--basic">Plan monitoreo</th>
                <th class="plans-table__col--full">Plan evolución</th>
              </tr></thead>
              <tbody>
                <tr><td>Monitoreo de flujos activos</td><td class="plans-table__col--basic">1–2 flujos</td><td class="plans-table__col--full">Todos</td></tr>
                <tr><td>Fixes menores / ajustes</td><td class="plans-table__col--basic">Hasta 1 h/mes</td><td class="plans-table__col--full">Hasta 4 h/mes</td></tr>
                <tr><td>Revisión mensual de errores/logs</td><td class="plans-table__col--basic"><i data-lucide="check" class="icon icon--sm plans-ok"></i></td><td class="plans-table__col--full"><i data-lucide="check" class="icon icon--sm plans-ok"></i></td></tr>
                <tr><td>Soporte horario hábil</td><td class="plans-table__col--basic"><i data-lucide="check" class="icon icon--sm plans-ok"></i></td><td class="plans-table__col--full"><i data-lucide="check" class="icon icon--sm plans-ok"></i></td></tr>
                <tr><td>1 mejora o mini-flujo nuevo/mes</td><td class="plans-table__col--basic"><i data-lucide="minus" class="icon icon--sm plans-no"></i></td><td class="plans-table__col--full"><i data-lucide="check" class="icon icon--sm plans-ok"></i></td></tr>
                <tr><td>Optimización de mensajes y plantillas</td><td class="plans-table__col--basic"><i data-lucide="minus" class="icon icon--sm plans-no"></i></td><td class="plans-table__col--full"><i data-lucide="check" class="icon icon--sm plans-ok"></i></td></tr>
                <tr><td>Reporte: ahorro de tiempo + conversiones</td><td class="plans-table__col--basic"><i data-lucide="minus" class="icon icon--sm plans-no"></i></td><td class="plans-table__col--full"><i data-lucide="check" class="icon icon--sm plans-ok"></i></td></tr>
              </tbody>
            </table></div>
          </div>
        `,
        pricingMin: 'Presupuesto personalizado',
        maintenance: 'Plan opcional según los flujos',
        externalCosts: 'Consumo de IA, APIs o licencias se informa por separado',
        delivery: '2–6 semanas',
        features: ['Modelos aplicados', 'Automatización', 'Análisis de datos', 'Documentación técnica']
      },

      asesoria: {
        title: 'Asesoría Estratégica y Capacitación',
        content: `
          <p class="service-modal__intro">Consultoría práctica para alinear tecnología, procesos y negocio: diagnóstico, roadmap y programas de formación orientados a resultados.</p>

          <div class="service-modal__section">
            <h4><i data-lucide="book-open" class="icon icon--sm"></i> Modalidades</h4>
            <div class="service-modal__tags">
              <span class="tag">Diagnóstico</span>
              <span class="tag">Roadmap</span>
              <span class="tag">Workshops</span>
              <span class="tag">Mentoría</span>
            </div>
          </div>

          <div class="service-modal__section">
            <h4><i data-lucide="package" class="icon icon--sm"></i> Entregables</h4>
            <ul class="service-modal__checklist">
              <li><i data-lucide="check-circle" class="icon"></i> Informe ejecutivo y roadmap priorizado</li>
              <li><i data-lucide="check-circle" class="icon"></i> Workshops prácticos y material didáctico</li>
              <li><i data-lucide="check-circle" class="icon"></i> Mentoring continuo y métricas de adopción</li>
              <li><i data-lucide="check-circle" class="icon"></i> Plan de implementación y KPI targets</li>
            </ul>
          </div>

          <div class="service-modal__section">
            <h4><i data-lucide="clock" class="icon icon--sm"></i> Duración</h4>
            <p>Programas desde 1 hasta 12 semanas; modalidades adaptables según nivel organizacional.</p>
          </div>
        `,
        pricingMin: 'Lo definimos contigo',
        features: ['Diagnóstico & roadmap', 'Workshops prácticos', 'Mentoría', 'KPIs']
      },

      diagnostico: {
        title: 'Diagnóstico de transformación digital',
        content: `
          <p class="service-modal__intro">Antes de invertir en una web, automatización o sistema, revisamos cómo funciona tu empresa hoy y definimos una ruta digital clara: qué ordenar primero, qué conectar y qué automatizar después.</p>

          <div class="service-modal__section">
            <h4><i data-lucide="compass" class="icon icon--sm"></i> Que revisamos</h4>
            <div class="service-modal__tags">
              <span class="tag">Presencia online</span>
              <span class="tag">Flujo de ventas</span>
              <span class="tag">WhatsApp y formularios</span>
              <span class="tag">Google y redes</span>
              <span class="tag">Procesos repetitivos</span>
              <span class="tag">Prioridades TI</span>
            </div>
          </div>

          <div class="service-modal__section">
            <h4><i data-lucide="clipboard-check" class="icon icon--sm"></i> Lo que recibes</h4>
            <ul class="service-modal__checklist">
              <li><i data-lucide="check-circle" class="icon"></i> Diagnostico claro de oportunidades, riesgos y tareas urgentes</li>
              <li><i data-lucide="check-circle" class="icon"></i> Roadmap simple: que hacer primero, que dejar para despues y por que</li>
              <li><i data-lucide="check-circle" class="icon"></i> Recomendaciones de herramientas, costos y esfuerzo estimado</li>
              <li><i data-lucide="check-circle" class="icon"></i> Propuesta de siguiente paso si decides ejecutar con Solven Labs</li>
            </ul>
          </div>

          <div class="service-modal__section">
            <h4><i data-lucide="clock" class="icon icon--sm"></i> Formato</h4>
            <p>Sesion inicial, revision de activos digitales y resumen accionable. Es ideal para partir ordenados antes de construir o automatizar.</p>
          </div>
        `,
        pricingMin: 'Sin costo',
        maintenance: 'No aplica',
        externalCosts: 'Sin licencias ni cobros posteriores',
        delivery: 'Reunión de 30 minutos',
        features: ['Revision integral', 'Roadmap priorizado', 'Acciones concretas', 'Acompanamiento inicial']
      },

      soporte: {
        title: 'Continuidad y mejora digital',
        content: `
          <p class="service-modal__intro">La transformación digital no termina al publicar. Acompañamos tu operación para que los canales, sistemas, respaldos, métricas y mejoras sigan alineados con lo que tu empresa necesita cada mes.</p>

          <div class="service-modal__section">
            <h4><i data-lucide="shield-check" class="icon icon--sm"></i> Que cubre</h4>
            <div class="service-modal__tags">
              <span class="tag">Mantencion web</span>
              <span class="tag">Backups</span>
              <span class="tag">Seguridad basica</span>
              <span class="tag">Mejoras menores</span>
              <span class="tag">Metricas</span>
              <span class="tag">Soporte remoto</span>
            </div>
          </div>

          <div class="service-modal__section">
            <h4><i data-lucide="package" class="icon icon--sm"></i> Lo que recibes</h4>
            <ul class="service-modal__checklist">
              <li><i data-lucide="check-circle" class="icon"></i> Revision periodica de funcionamiento, enlaces, formularios y carga</li>
              <li><i data-lucide="check-circle" class="icon"></i> Ajustes de contenido, botones, secciones o integraciones simples</li>
              <li><i data-lucide="check-circle" class="icon"></i> Respaldos, monitoreo y recomendaciones de seguridad basica</li>
              <li><i data-lucide="check-circle" class="icon"></i> Soporte cercano cuando algo falla o necesitas evolucionar la solucion</li>
            </ul>
          </div>

          <div class="service-modal__section">
            <h4><i data-lucide="repeat" class="icon icon--sm"></i> Modalidades</h4>
            <div class="plans-table-wrap"><table class="plans-table">
              <thead><tr><th>Beneficio</th><th class="plans-table__col--basic">Esencial<br><span class="plans-table__price">$39.900/mes</span></th><th class="plans-table__col--full">Crecimiento<br><span class="plans-table__price">$69.900/mes</span></th></tr></thead>
              <tbody>
                <tr><td>Hosting, monitoreo y respaldos</td><td class="plans-table__col--basic">Incluido</td><td class="plans-table__col--full">Incluido</td></tr>
                <tr><td>Ajustes de contenido</td><td class="plans-table__col--basic">Hasta 30 min/mes</td><td class="plans-table__col--full">Hasta 90 min/mes</td></tr>
                <tr><td>Mejoras de conversión y reporte</td><td class="plans-table__col--basic">Revisión trimestral</td><td class="plans-table__col--full">Revisión mensual</td></tr>
                <tr><td>Soporte</td><td class="plans-table__col--basic">Horario hábil</td><td class="plans-table__col--full">Prioritario</td></tr>
              </tbody>
            </table></div>
            <p class="service-modal__ref-note">Sin permanencia forzada. Trabajos mayores, nuevas secciones o licencias se cotizan antes de ejecutarlos.</p>
          </div>
        `,
        pricingMin: 'Desde $39.900/mes',
        maintenance: 'Cobro mensual, sin permanencia forzada',
        externalCosts: 'Licencias o trabajos mayores se autorizan aparte',
        delivery: 'Activación en 2–3 días hábiles',
        features: ['Mantencion mensual', 'Soporte remoto', 'Seguridad y respaldos', 'Mejoras continuas']
      },

      'servicios-tecnicos': {
        title: 'Servicios técnicos',
        hideServicePrice: true,
        reservationDeposit: '$5.000',
        content: `
          <p class="service-modal__intro">Resolvemos necesidades técnicas puntuales para hogares, oficinas y negocios. Primero entendemos el problema, revisamos lo necesario y confirmamos el alcance antes de intervenir.</p>

          <div class="service-modal__section">
            <h4><i data-lucide="layout-grid" class="icon icon--sm"></i> Todo lo que podemos revisar</h4>
            <div class="service-modal__technical-grid">
              <article class="service-modal__technical-item">
                <span class="service-modal__technical-icon"><i data-lucide="wifi" class="icon"></i></span>
                <div><h5>Redes y WiFi</h5><p>Instalación y mejora de redes cableadas o inalámbricas, routers, switches, access points, cobertura y seguridad básica.</p></div>
              </article>
              <article class="service-modal__technical-item">
                <span class="service-modal__technical-icon"><i data-lucide="video" class="icon"></i></span>
                <div><h5>Cámaras de seguridad</h5><p>Montaje y configuración de cámaras IP, DVR o NVR, visualización remota, grabación y revisión de zonas ciegas.</p></div>
              </article>
              <article class="service-modal__technical-item">
                <span class="service-modal__technical-icon"><i data-lucide="monitor" class="icon"></i></span>
                <div><h5>Computadores y consolas</h5><p>Diagnóstico, limpieza interna, temperatura, pasta térmica, formateo, optimización, respaldos y mejoras de hardware.</p></div>
              </article>
              <article class="service-modal__technical-item">
                <span class="service-modal__technical-icon"><i data-lucide="server" class="icon"></i></span>
                <div><h5>Servidores y servicios web</h5><p>Revisión de hosting, dominios, DNS, certificados SSL, correo, respaldos, monitoreo y documentación de accesos.</p></div>
              </article>
              <article class="service-modal__technical-item">
                <span class="service-modal__technical-icon"><i data-lucide="headset" class="icon"></i></span>
                <div><h5>Soporte TI para empresas</h5><p>Ayuda remota o presencial con equipos, cuentas, correos, impresoras, usuarios, permisos y continuidad operativa.</p></div>
              </article>
            </div>
          </div>

          <div class="service-modal__section">
            <h4><i data-lucide="clipboard-check" class="icon icon--sm"></i> Cómo funciona</h4>
            <ol class="service-modal__steps">
              <li><span>1</span><div><strong>Reserva el horario</strong><p>El abono de $5.000 asegura la visita y se descuenta del servicio final.</p></div></li>
              <li><span>2</span><div><strong>Revisamos tu caso</strong><p>Diagnosticamos la necesidad, el estado de los equipos y los materiales que puedan hacer falta.</p></div></li>
              <li><span>3</span><div><strong>Confirmamos antes de trabajar</strong><p>Te explicamos el alcance y la cotización. Avanzamos únicamente con tu aprobación.</p></div></li>
            </ol>
          </div>

          <div class="service-modal__section">
            <h4><i data-lucide="shield-check" class="icon icon--sm"></i> Siempre tendrás claridad</h4>
            <ul class="service-modal__checklist">
              <li><i data-lucide="check-circle" class="icon"></i> Diagnóstico explicado en lenguaje simple</li>
              <li><i data-lucide="check-circle" class="icon"></i> Cotización aprobada antes de intervenir</li>
              <li><i data-lucide="check-circle" class="icon"></i> Repuestos y materiales informados por separado</li>
              <li><i data-lucide="check-circle" class="icon"></i> Boleta o factura disponible</li>
            </ul>
          </div>
        `,
        pricingMin: '$5.000',
        maintenance: 'Según el servicio requerido',
        externalCosts: 'Materiales y repuestos se cotizan antes',
        delivery: 'Horario coordinado según disponibilidad',
        features: ['Redes y WiFi', 'Cámaras', 'Equipos y consolas', 'Servidores', 'Soporte TI']
      },

      redes: {
        title: 'Conectividad para la operación digital',
        content: `
          <p class="service-modal__intro">Una empresa digital depende de una red estable. Ordenamos la conectividad de oficinas, locales o espacios de trabajo para que sistemas, pagos, cámaras, atención y equipos funcionen sin interrupciones.</p>

          <div class="service-modal__section">
            <h4><i data-lucide="wifi" class="icon icon--sm"></i> Servicios incluidos</h4>
            <ul class="service-modal__checklist">
              <li><i data-lucide="check-circle" class="icon"></i> Instalacion de redes cableadas, WiFi, routers, switches y access points</li>
              <li><i data-lucide="check-circle" class="icon"></i> Revision de cobertura, puntos muertos y saturacion de senal</li>
              <li><i data-lucide="check-circle" class="icon"></i> Ordenamiento de cableado y configuracion basica de seguridad</li>
              <li><i data-lucide="check-circle" class="icon"></i> Recomendacion de equipos segun tamano del espacio y cantidad de usuarios</li>
            </ul>
          </div>

          <div class="service-modal__section">
            <h4><i data-lucide="list-checks" class="icon icon--sm"></i> Trabajos frecuentes</h4>
            <div class="plans-table-wrap">
              <table class="plans-table">
                <thead>
                  <tr>
                    <th>Servicio</th>
                    <th>Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Red WiFi estable</td><td>Cobertura, nombre de red, claves y acceso para invitados</td></tr>
                  <tr><td>Puntos de red</td><td>Cableado, conectores y ordenamiento para puestos o salas</td></tr>
                  <tr><td>Router y access point</td><td>Configuracion inicial, seguridad basica y pruebas de alcance</td></tr>
                  <tr><td>Diagnostico de cobertura</td><td>Revision de zonas lentas, interferencias y equipos recomendados</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="service-modal__section">
            <h4><i data-lucide="map-pin" class="icon icon--sm"></i> Ideal para</h4>
            <p>Oficinas pequenas, locales comerciales, casas con mala cobertura, salas de atencion y negocios que dependen de una conexion estable.</p>
          </div>
        `,
        pricingMin: 'Desde $39.900',
        maintenance: 'Mantención opcional',
        externalCosts: 'Routers, cableado y equipos se cotizan aparte',
        delivery: 'Visita coordinada según disponibilidad',
        features: ['WiFi estable', 'Red cableada', 'Equipos configurados', 'Diagnostico de cobertura']
      },

      camaras: {
        title: 'Videovigilancia conectada a tu operación',
        content: `
          <p class="service-modal__intro">Integramos cámaras y monitoreo como parte de la continuidad operativa de tu empresa: control de espacios, acceso remoto, registro de eventos y configuración segura desde celular o computador.</p>

          <div class="service-modal__section">
            <h4><i data-lucide="video" class="icon icon--sm"></i> Que hacemos</h4>
            <ul class="service-modal__checklist">
              <li><i data-lucide="check-circle" class="icon"></i> Instalacion de camaras IP o sistemas DVR/NVR segun necesidad</li>
              <li><i data-lucide="check-circle" class="icon"></i> Configuracion de visualizacion remota desde celular</li>
              <li><i data-lucide="check-circle" class="icon"></i> Orientacion de puntos de grabacion para cubrir zonas importantes</li>
              <li><i data-lucide="check-circle" class="icon"></i> Pruebas de grabacion, acceso y funcionamiento antes de entregar</li>
            </ul>
          </div>

          <div class="service-modal__section">
            <h4><i data-lucide="list-checks" class="icon icon--sm"></i> Trabajos frecuentes</h4>
            <div class="plans-table-wrap">
              <table class="plans-table">
                <thead>
                  <tr>
                    <th>Servicio</th>
                    <th>Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Instalacion de camaras</td><td>Montaje, orientacion y prueba de imagen por zona</td></tr>
                  <tr><td>Acceso remoto</td><td>Configuracion para ver desde celular o computador</td></tr>
                  <tr><td>DVR / NVR</td><td>Revision de grabacion, disco, usuarios y horarios</td></tr>
                  <tr><td>Mejora de cobertura</td><td>Reubicacion o recomendacion de puntos para reducir zonas ciegas</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="service-modal__section">
            <h4><i data-lucide="shield" class="icon icon--sm"></i> Resultado</h4>
            <p>Un sistema de videovigilancia operativo, probado y explicado para que sepas revisar eventos, grabaciones y accesos.</p>
          </div>
        `,
        pricingMin: 'Desde $49.900',
        maintenance: 'Mantención opcional',
        externalCosts: 'Cámaras, grabador, disco y cableado no incluidos',
        delivery: 'Visita y plazo según cantidad de puntos',
        features: ['Instalacion', 'Visualizacion remota', 'Grabacion', 'Configuracion segura']
      },

      servidores: {
        title: 'Infraestructura digital y continuidad',
        content: `
          <p class="service-modal__intro">Cuidamos la base técnica de tu transformación digital: servidores, servicios web, dominios, DNS, correos, certificados y respaldos para evitar caídas, pérdidas de datos o configuraciones inseguras.</p>

          <div class="service-modal__section">
            <h4><i data-lucide="server" class="icon icon--sm"></i> Alcance frecuente</h4>
            <ul class="service-modal__checklist">
              <li><i data-lucide="check-circle" class="icon"></i> Revision de hosting, dominios, DNS, certificados SSL y correo</li>
              <li><i data-lucide="check-circle" class="icon"></i> Configuracion de servicios web, respaldos y monitoreo basico</li>
              <li><i data-lucide="check-circle" class="icon"></i> Ordenamiento de accesos, credenciales y documentacion tecnica</li>
              <li><i data-lucide="check-circle" class="icon"></i> Recomendaciones para mejorar continuidad, seguridad y rendimiento</li>
            </ul>
          </div>

          <div class="service-modal__section">
            <h4><i data-lucide="list-checks" class="icon icon--sm"></i> Trabajos frecuentes</h4>
            <div class="plans-table-wrap">
              <table class="plans-table">
                <thead>
                  <tr>
                    <th>Servicio</th>
                    <th>Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Hosting y dominio</td><td>Revision de panel, renovaciones, DNS y certificados SSL</td></tr>
                  <tr><td>Respaldos</td><td>Configuracion o revision de copias para sitios y archivos clave</td></tr>
                  <tr><td>Correo corporativo</td><td>Configuracion de cuentas, registros SPF/DKIM y entregabilidad basica</td></tr>
                  <tr><td>Monitoreo basico</td><td>Chequeos de disponibilidad, rendimiento y alertas iniciales</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="service-modal__section">
            <h4><i data-lucide="cloud" class="icon icon--sm"></i> Modalidad</h4>
            <p>Atención por evento o mantención recurrente para negocios que necesitan continuidad sin contratar un área TI interna.</p>
          </div>
        `,
        pricingMin: 'Desde $39.900',
        maintenance: 'Plan recurrente opcional',
        externalCosts: 'Hosting, dominios y licencias se pagan aparte',
        delivery: 'Diagnóstico inicial en 1–2 días hábiles',
        features: ['DNS y dominios', 'Backups', 'SSL y hosting', 'Monitoreo basico']
      },

      empresas: {
        title: 'Soporte TI para continuidad digital',
        content: `
          <p class="service-modal__intro">Ayudamos a empresas que necesitan continuidad tecnológica sin tener un área TI interna: soporte a equipos, cuentas, correos, redes y herramientas para que la operación digital no se detenga.</p>

          <div class="service-modal__section">
            <h4><i data-lucide="headset" class="icon icon--sm"></i> En que ayudamos</h4>
            <ul class="service-modal__checklist">
              <li><i data-lucide="check-circle" class="icon"></i> Soporte a computadores, correos, impresoras, redes y herramientas de trabajo</li>
              <li><i data-lucide="check-circle" class="icon"></i> Configuracion de cuentas, accesos y estaciones nuevas</li>
              <li><i data-lucide="check-circle" class="icon"></i> Resolucion de incidencias por hora, visita o pack mensual</li>
              <li><i data-lucide="check-circle" class="icon"></i> Recomendaciones para ordenar la operacion tecnologica del negocio</li>
            </ul>
          </div>

          <div class="service-modal__section">
            <h4><i data-lucide="list-checks" class="icon icon--sm"></i> Trabajos frecuentes</h4>
            <div class="plans-table-wrap">
              <table class="plans-table">
                <thead>
                  <tr>
                    <th>Servicio</th>
                    <th>Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Soporte remoto</td><td>Asistencia para correo, software, accesos y errores diarios</td></tr>
                  <tr><td>Visita tecnica</td><td>Revision presencial de equipos, red, impresoras o estaciones</td></tr>
                  <tr><td>Configuracion de usuarios</td><td>Cuentas, permisos, correos y equipo listo para trabajar</td></tr>
                  <tr><td>Orden TI</td><td>Inventario basico, prioridades y recomendaciones para evitar fallas repetidas</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="service-modal__section">
            <h4><i data-lucide="calendar-check" class="icon icon--sm"></i> Como se contrata</h4>
            <p>Puede ser atencion puntual, bolsa de horas o soporte mensual. Ajustamos el formato segun urgencia, cantidad de equipos y frecuencia de incidencias.</p>
          </div>
        `,
        pricingMin: 'Remoto desde $19.900',
        maintenance: 'Bolsas de horas o plan mensual disponibles',
        externalCosts: 'Repuestos, licencias y traslados se cotizan aparte',
        delivery: 'Atención según prioridad y disponibilidad',
        features: ['Soporte remoto', 'Visitas tecnicas', 'Bolsa de horas', 'Orden TI']
      },

      personalizado: {
        title: 'Soluciones digitales a medida',
        content: `
          <p class="service-modal__intro">Si las herramientas disponibles no resuelven lo que necesitas, creamos una aplicación a medida. Podemos empezar con una primera versión para probarla.</p>

          <div class="service-modal__section">
            <h4><i data-lucide="sliders" class="icon icon--sm"></i> Enfoque de trabajo</h4>
            <div class="service-modal__tags">
              <span class="tag">Validación</span>
              <span class="tag">Mejoras por etapas</span>
              <span class="tag">Integración</span>
              <span class="tag">Soporte</span>
            </div>
          </div>

          <div class="service-modal__section">
            <h4><i data-lucide="package" class="icon icon--sm"></i> Entregables</h4>
            <ul class="service-modal__checklist">
              <li><i data-lucide="check-circle" class="icon"></i> Pruebas de tu idea y diseño de una primera versión</li>
              <li><i data-lucide="check-circle" class="icon"></i> Mejoras por etapas con entregas por hitos</li>
              <li><i data-lucide="check-circle" class="icon"></i> Integraciones, pruebas y documentación</li>
              <li><i data-lucide="check-circle" class="icon"></i> Plan de evolución y soporte post‑lanzamiento</li>
            </ul>
          </div>

          <div class="service-modal__section">
            <h4><i data-lucide="clock" class="icon icon--sm"></i> Tiempo estimado</h4>
            <p>Plazos según alcance; planificación por hitos con entregas parciales.</p>
          </div>
        `,
        pricingMin: 'Lo definimos contigo',
        features: ['Primera versión', 'Mejoras por etapas', 'Integraciones', 'Soporte']
      },

      'seo-local': {
        title: 'SEO y campañas para crecer',
        hideServicePrice: true,
        content: `
          <p class="service-modal__intro">Combinamos SEO, contenido, medición y campañas para atraer tráfico con intención y convertirlo en consultas, reservas o ventas.</p>

          <div class="service-modal__section">
            <h4><i data-lucide="search" class="icon icon--sm"></i> ¿Qué incluye?</h4>
            <div class="service-modal__tags">
              <span class="tag">SEO local</span>
              <span class="tag">Google Mi Negocio</span>
              <span class="tag">Búsquedas locales</span>
              <span class="tag">Redes sociales</span>
              <span class="tag">Reseñas y reputación online</span>
              <span class="tag">Optimización de contenido</span>
              <span class="tag">Google Ads y campañas sociales</span>
              <span class="tag">Analítica y conversiones</span>
            </div>
          </div>

          <div class="service-modal__section">
            <h4><i data-lucide="package" class="icon icon--sm"></i> Lo que recibes</h4>
            <ul class="service-modal__checklist">
              <li><i data-lucide="check-circle" class="icon"></i> Configuración y optimización de Google Mi Negocio</li>
              <li><i data-lucide="check-circle" class="icon"></i> Tu negocio posicionado en búsquedas locales de tu zona</li>
              <li><i data-lucide="check-circle" class="icon"></i> Perfil de redes sociales optimizado y coherente con tu marca</li>
              <li><i data-lucide="check-circle" class="icon"></i> Estrategia clara para conseguir más reseñas y mejorar tu reputación</li>
            </ul>
          </div>

          <div class="service-modal__section">
            <h4><i data-lucide="clock" class="icon icon--sm"></i> Tiempo de entrega</h4>
            <p>2–4 semanas para el setup inicial. Los resultados en Google mejoran progresivamente en 2–3 meses.</p>
          </div>

          <div class="service-modal__section service-modal__section--plans">
            <h4><i data-lucide="shield" class="icon icon--sm"></i> Planes de mantención <small>(mínimo 3 meses)</small></h4>
            <div class="plans-table-wrap"><table class="plans-table">
              <thead><tr>
                <th>Beneficio</th>
                <th class="plans-table__col--basic">SEO local<br><span class="plans-table__price">Según objetivos</span></th>
                <th class="plans-table__col--full">SEO + campañas<br><span class="plans-table__price">Crecimiento</span></th>
              </tr></thead>
              <tbody>
                <tr><td>Google Business (publicaciones)</td><td class="plans-table__col--basic">1–2/mes</td><td class="plans-table__col--full">2–4/mes</td></tr>
                <tr><td>Ajuste on-page mensual</td><td class="plans-table__col--basic">1</td><td class="plans-table__col--full">1 + extras</td></tr>
                <tr><td>Reporte posiciones + llamadas</td><td class="plans-table__col--basic"><i data-lucide="check" class="icon icon--sm plans-ok"></i></td><td class="plans-table__col--full"><i data-lucide="check" class="icon icon--sm plans-ok"></i></td></tr>
                <tr><td>Contenidos SEO (FAQ, servicios por comuna)</td><td class="plans-table__col--basic"><i data-lucide="minus" class="icon icon--sm plans-no"></i></td><td class="plans-table__col--full">2–4/mes</td></tr>
                <tr><td>Link building / citaciones locales</td><td class="plans-table__col--basic"><i data-lucide="minus" class="icon icon--sm plans-no"></i></td><td class="plans-table__col--full"><i data-lucide="check" class="icon icon--sm plans-ok"></i></td></tr>
                <tr><td>Tracking GA4 + Search Console + eventos</td><td class="plans-table__col--basic"><i data-lucide="minus" class="icon icon--sm plans-no"></i></td><td class="plans-table__col--full"><i data-lucide="check" class="icon icon--sm plans-ok"></i></td></tr>
              </tbody>
            </table></div>
          </div>
        `,
        pricingMin: 'Evaluación inicial sin costo',
        maintenance: 'Plan mensual definido según objetivos y canales',
        externalCosts: 'Inversión publicitaria y herramientas se aprueban por separado',
        delivery: 'Diagnóstico y propuesta en 3–5 días hábiles',
        features: ['SEO técnico y local', 'Contenido', 'Campañas digitales', 'Medición de conversiones']
      },

      'whatsapp-integration': {
        title: 'Conexión de sistemas y tareas automáticas',
        hideServicePrice: true,
        content: `
          <p class="service-modal__intro">Conectamos tus herramientas para compartir datos y hacer tareas automáticas, como enviar avisos o actualizar registros.</p>

          <div class="service-modal__section service-modal__section--plans">
            <h4><i data-lucide="layers-3" class="icon icon--sm"></i> Niveles de integración</h4>
            <div class="plans-table-wrap"><table class="plans-table">
              <thead><tr><th>Plan</th><th>Modalidad</th><th>Alcance base</th></tr></thead>
              <tbody>
                <tr><td>Simple</td><td>Esencial</td><td>1 flujo entre 2 aplicaciones, pruebas y documentación</td></tr>
                <tr><td>Conectada</td><td>Intermedia</td><td>Hasta 3 aplicaciones y 3 flujos con validaciones y alertas</td></tr>
                <tr><td>Operacional</td><td>Avanzada</td><td>Varias tareas conectadas, registro de cambios y ayuda para empezar</td></tr>
              </tbody>
            </table></div>
            <p class="service-modal__ref-note">Las licencias, consumos de API y planes oficiales de terceros no están incluidos. Los confirmamos antes de implementar.</p>
          </div>

          <div class="service-modal__section">
            <h4><i data-lucide="message-circle" class="icon icon--sm"></i> Qué podemos integrar</h4>
            <ul class="service-modal__checklist">
              <li><i data-lucide="check-circle" class="icon"></i> Plataformas, repositorios y fuentes de datos</li>
              <li><i data-lucide="check-circle" class="icon"></i> APIs, notificaciones y servicios institucionales</li>
              <li><i data-lucide="check-circle" class="icon"></i> Procesos de carga, validación y transformación de información</li>
              <li><i data-lucide="check-circle" class="icon"></i> Pruebas y documentación de cada flujo integrado</li>
            </ul>
          </div>

          <div class="service-modal__section">
            <h4><i data-lucide="zap" class="icon icon--sm"></i> Para quién es</h4>
            <p>Proyectos que necesitan conectar herramientas, reunir datos o ahorrar tareas repetitivas.</p>
          </div>

          <div class="service-modal__section">
            <h4><i data-lucide="clock" class="icon icon--sm"></i> Tiempo de entrega</h4>
            <p>El plazo se define según la cantidad de sistemas, la disponibilidad de APIs y las reglas que debe implementar cada flujo.</p>
          </div>

          <div class="service-modal__section">
            <h4><i data-lucide="shield" class="icon icon--sm"></i> Por qué conviene</h4>
            <p>Una integración bien documentada evita duplicar datos, reduce errores manuales y facilita la evolución de la solución.</p>
          </div>
        `,
        pricingMin: 'Presupuesto personalizado',
        maintenance: 'Continuidad opcional',
        externalCosts: 'APIs, WhatsApp oficial o licencias no incluidas',
        delivery: 'Según alcance e integraciones',
        features: ['APIs', 'Fuentes de datos', 'Automatización', 'Validación y pruebas']
      },

      'pc-tecnico': {
        title: 'Equipos operativos para trabajar sin fricción',
        content: `
          <p class="service-modal__intro">La digitalización también depende de equipos confiables. Revisamos, optimizamos y mantenemos notebooks, PCs y consolas para evitar lentitud, temperatura, fallas de arranque o pérdida de información.</p>

          <div class="service-modal__benefit-card" data-benefit-card hidden>
            <div class="service-modal__benefit-card-head">
              <span>Beneficio</span>
              <button type="button" class="service-modal__benefit-close" data-benefit-close aria-label="Cerrar beneficio">x</button>
            </div>
            <p class="service-modal__benefit-card-text" data-benefit-card-text aria-live="polite"></p>
          </div>

          <div class="service-modal__section">
            <h4><i data-lucide="monitor" class="icon icon--sm"></i> Servicios orientativos</h4>
            <div class="plans-table-wrap">
              <table class="plans-table">
                <thead>
                  <tr>
                    <th>Servicio</th>
                    <th>Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Diagnóstico y revisión</td>
                    <td>
                      <div class="service-modal__detail-line">
                        <span class="service-modal__detail-text">Detectamos fallas en computadores y consolas</span>
                        <button type="button" class="service-modal__row-help-btn" data-benefit-text="Te ayuda a saber exactamente qué falla tiene el equipo o consola antes de pagar por una reparación mayor.">?</button>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>Limpieza interna y ventilación</td>
                    <td>
                      <div class="service-modal__detail-line">
                        <span class="service-modal__detail-text">Remoción de polvo, revisión de ventiladores y flujo de aire</span>
                        <button type="button" class="service-modal__row-help-btn" data-benefit-text="Reduce temperatura, ruido y riesgo de fallas por calor, alargando la vida útil del computador o consola.">?</button>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>Cambio de pasta térmica</td>
                    <td>
                      <div class="service-modal__detail-line">
                        <span class="service-modal__detail-text">Mantención térmica para notebooks, PCs y consolas compatibles</span>
                        <button type="button" class="service-modal__row-help-btn" data-benefit-text="Ayuda cuando el equipo sube mucho de temperatura, hace demasiado ruido o se apaga durante el uso.">?</button>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>Formateo e instalación de Windows</td>
                    <td>
                      <div class="service-modal__detail-line">
                        <span class="service-modal__detail-text">Instalación limpia, drivers y configuración básica</span>
                        <button type="button" class="service-modal__row-help-btn" data-benefit-text="Sirve para dejar el equipo estable y ordenado cuando arrastra errores, lentitud o software dañado.">?</button>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>Optimización de rendimiento</td>
                    <td>
                      <div class="service-modal__detail-line">
                        <span class="service-modal__detail-text">Arranque, limpieza de software y ajustes de sistema</span>
                        <button type="button" class="service-modal__row-help-btn" data-benefit-text="Mejora la velocidad diaria del computador sin tener que cambiar el equipo todavía.">?</button>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>Mejoras de hardware</td>
                    <td>
                      <div class="service-modal__detail-line">
                        <span class="service-modal__detail-text">SSD, RAM u otros componentes según compatibilidad</span>
                        <button type="button" class="service-modal__row-help-btn" data-benefit-text="Sirve cuando conviene mejorar el equipo actual antes de cambiarlo completo.">?</button>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>Mantención de consolas</td>
                    <td>
                      <div class="service-modal__detail-line">
                        <span class="service-modal__detail-text">Limpieza, temperatura, almacenamiento y revisión general</span>
                        <button type="button" class="service-modal__row-help-btn" data-benefit-text="Ideal para consolas con ruido excesivo, calentamiento, apagados o mantención pendiente.">?</button>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>Respaldo y recuperación básica</td>
                    <td>
                      <div class="service-modal__detail-line">
                        <span class="service-modal__detail-text">Resguardamos archivos antes de intervenir el equipo</span>
                        <button type="button" class="service-modal__row-help-btn" data-benefit-text="Protege tus documentos, fotos y trabajos antes de hacer cambios más delicados.">?</button>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>Soporte remoto</td>
                    <td>
                      <div class="service-modal__detail-line">
                        <span class="service-modal__detail-text">Ayuda rápida para problemas menores o configuración</span>
                        <button type="button" class="service-modal__row-help-btn" data-benefit-text="Resuelve problemas simples sin esperar visita presencial, ideal para ahorrar tiempo y moverse más rápido.">?</button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p class="service-modal__ref-note">* Valores referenciales. Pueden aumentar o disminuir según el alcance, el estado del equipo y los repuestos necesarios.</p>
          </div>

          <div class="service-modal__section">
            <h4><i data-lucide="package" class="icon icon--sm"></i> Lo que recibes</h4>
            <ul class="service-modal__checklist">
              <li><i data-lucide="check-circle" class="icon"></i> Diagnóstico claro antes de avanzar con cualquier reparación</li>
              <li><i data-lucide="check-circle" class="icon"></i> Recomendación honesta si conviene reparar, ampliar o cambiar componentes</li>
              <li><i data-lucide="check-circle" class="icon"></i> Limpieza, optimización, respaldo o mantención térmica cuando aplique</li>
              <li><i data-lucide="check-circle" class="icon"></i> Atención presencial o por soporte remoto según el caso</li>
            </ul>
          </div>

          <div class="service-modal__section">
            <h4><i data-lucide="clock" class="icon icon--sm"></i> Tiempo de entrega</h4>
            <p>Diagnóstico el mismo día o dentro de 24 horas hábiles. La reparación depende del tipo de falla y la disponibilidad de repuestos.</p>
          </div>
        `,
        pricingMin: 'Diagnóstico $19.900',
        maintenance: 'Soporte posterior opcional',
        externalCosts: 'Repuestos y licencias se cotizan antes de instalarlos',
        delivery: 'Diagnóstico el mismo día o en 24 horas hábiles',
        features: ['Diagnóstico', 'Limpieza', 'Consolas', 'Soporte remoto']
      }
    };

    const solutionFormats = {
      dev: {
        scopeTitle: 'Del concepto al prototipo que puedes probar',
        includes: ['Definimos qué quieres comprobar, quién lo usará y las funciones necesarias.', 'Diseñamos las pantallas y construimos una primera versión.', 'Probamos situaciones reales y registramos los resultados.', 'Entrega de código, guía de uso y recomendaciones para la siguiente versión.'],
        needs: 'Una descripción de la idea, el problema que quieres resolver y quién probará el prototipo. Si tienes una metodología o resultados previos, los usamos como punto de partida.',
        investment: 'Según lo que ya tienes y lo que falta construir.',
        delivery: 'Etapas de diseño, desarrollo y pruebas',
        continuity: 'Mejoras después de las primeras pruebas',
        terms: ['Objetivo y funciones de la prueba acordados', 'Definimos cómo revisar el resultado antes de empezar', 'Propiedad y entrega del código definidas en la propuesta', 'Nuevas funciones cotizadas como una siguiente etapa'],
        numbers: [['3', 'Etapas: diseñar, construir y validar'], ['1', 'Pregunta principal por prueba'], ['1', 'Plan de mejoras al terminar']],
        cta: 'Solicitar propuesta de prototipo',
        request: 'Conversemos sobre tu idea y cómo ponerla a prueba.',
        examples: ['Prueba de concepto', 'Primera versión funcional', 'Prototipo funcional', 'Piloto tecnológico'],
        benefits: [['Validar la idea', 'Una primera versión para comprobar tu idea.'], ['Avanzar por etapas', 'Revisamos cada avance antes de seguir.'], ['Probar con usuarios', 'Acordamos qué probar y cómo revisar el resultado.'], ['Entregar el proyecto', 'Código y guías para seguir mejorándolo.']],
        external: 'Equipos, sensores o licencias según el prototipo'
      },
      'dev-web': {
        scopeTitle: 'Una plataforma preparada para tu operación',
        includes: ['Definimos las tareas y quién puede ver o cambiar cada dato.', 'Diseñamos las pantallas, organizamos los datos y creamos las funciones acordadas.', 'Conectamos las herramientas y probamos formularios y tareas principales.', 'Puesta en funcionamiento, guías y capacitación del equipo.'],
        needs: 'Los procesos que quieres digitalizar, tipos de usuarios y herramientas actuales. Revisamos también si hay datos que migrar o sistemas que conectar.',
        investment: 'Según funciones, permisos, herramientas conectadas y datos que hay que trasladar.',
        delivery: 'Entregas por partes y revisión contigo',
        continuity: 'Ayuda y mejoras de las funciones',
        terms: ['Funciones y permisos detallados en la propuesta', 'Acordamos qué datos trasladar antes de empezar', 'Acordamos dónde funcionará y quién tendrá acceso', 'Soporte posterior con alcance independiente'],
        numbers: [['3', 'Partes: pantallas, funciones y datos'], ['1', 'Lista de usuarios y permisos'], ['1', 'Guía de administración y uso']],
        cta: 'Cotizar mi plataforma',
        request: 'Cuéntanos qué proceso necesita su propia plataforma.',
        examples: ['Portal para equipos de trabajo', 'Sistema de seguimiento', 'Plataforma colaborativa', 'Panel de seguimiento'],
        benefits: [['Centralizar el trabajo', 'Procesos, usuarios y datos en una misma plataforma.'], ['Adaptar la operación', 'Funciones creadas para lo que tu equipo necesita.'], ['Conectar herramientas', 'Integraciones con los sistemas y fuentes acordados.'], ['Facilitar la continuidad', 'Pruebas, guías y capacitación del equipo.']],
        external: 'Hosting, dominio y licencias de terceros'
      },
      aiAutomation: {
        scopeTitle: 'IA evaluada para tu contexto',
        includes: ['Revisamos la tarea, los datos disponibles y cómo protegerlos.', 'Elegimos cómo resolver la tarea y probamos con datos similares a los reales.', 'Evaluación con casos de prueba, revisión de errores y supervisión humana.', 'Conectamos la herramienta y explicamos sus límites, costos y uso.'],
        needs: 'La tarea que quieres apoyar, ejemplos de entradas y resultados esperados, y datos que tengas autorización para utilizar. Acordamos cómo evaluar la calidad antes de elegir un modelo.',
        investment: 'Según preparación de datos, evaluación e integración del modelo.',
        delivery: 'Primero revisamos si se puede hacer; luego probamos y conectamos',
        continuity: 'Evaluación y ajustes del modelo',
        terms: ['Uso y tratamiento de datos acordados', 'Definimos desde el inicio cómo medir los resultados', 'El uso de servicios de inteligencia artificial se cobra por separado', 'Límites y revisión humana documentados'],
        numbers: [['3', 'Pasos: evaluar, probar e integrar'], ['1', 'Conjunto de casos de evaluación'], ['1', 'Informe de resultados y límites']],
        cta: 'Evaluar mi caso de IA',
        request: 'Revisemos qué tarea puede beneficiarse de IA y cómo medirlo.',
        examples: ['Asistente documental', 'Clasificación de documentos', 'Búsqueda por significado', 'Análisis con IA'],
        benefits: [['Evaluar la viabilidad', 'Revisión de datos y del caso de uso antes de implementar.'], ['Medir el aporte', 'Criterios de evaluación definidos para el problema.'], ['Mantener supervisión', 'Puntos de revisión humana en el flujo de trabajo.'], ['Entender los límites', 'Documentación de resultados, restricciones y recomendaciones.']],
        external: 'Uso de servicios de inteligencia artificial, conexiones y servidores'
      },
      'research-data': {
        scopeTitle: 'Datos ordenados y resultados claros',
        includes: ['Inventario de fuentes, formatos, variables y permisos de uso.', 'Limpieza de duplicados, valores faltantes y reglas de calidad acordadas.', 'Pasos para preparar los datos y una guía de lo que significa cada campo.', 'Panel con los resultados que necesita tu equipo y una guía para actualizarlo.'],
        needs: 'Una muestra de los datos, sus formatos, preguntas de análisis y frecuencia de actualización. Identificamos información sensible y condiciones de acceso antes de procesarla.',
        investment: 'Según volumen, calidad de las fuentes e indicadores requeridos.',
        delivery: 'Revisión de fuentes antes de estimar el procesamiento',
        continuity: 'Actualización de fuentes e indicadores',
        terms: ['Fuentes y permisos de uso identificados', 'Reglas de limpieza validadas con el equipo', 'Indicadores y fórmulas documentados', 'Accesos y entrega de los datos acordados'],
        numbers: [['3', 'Pasos: reunir, ordenar y mostrar los datos'], ['1', 'Guía de los datos'], ['1', 'Guía para repetir el análisis']],
        cta: 'Revisar mis fuentes de datos',
        request: 'Cuéntanos qué datos tienes y qué necesitas entender.',
        examples: ['Panel de indicadores', 'Preparación automática de datos', 'Indicadores de proyecto', 'Explorador de resultados'],
        benefits: [['Mejorar la calidad', 'Reglas de limpieza y validación para las fuentes acordadas.'], ['Conocer el origen', 'Registro de los cambios desde el dato original hasta el resultado.'], ['Repetir el análisis', 'Procesos que puedes repetir que el equipo puede volver a ejecutar.'], ['Explorar resultados', 'Visualizaciones alineadas con las preguntas de tu equipo.']],
        external: 'Almacenamiento, servidores y programas para mostrar resultados'
      },
      'whatsapp-integration': {
        scopeTitle: 'Herramientas conectadas, con revisión de errores',
        includes: ['Definimos qué herramientas conectar y qué información compartirán.', 'Conectamos las herramientas usando los accesos autorizados.', 'Validaciones, control de duplicados y manejo de errores según cada flujo.', 'Probamos el proceso completo y dejamos registros y guías.'],
        needs: 'Los sistemas que quieres conectar, documentación de sus APIs y un ejemplo del flujo actual. Confirmamos permisos, límites de consumo y disponibilidad de un entorno de pruebas.',
        investment: 'Según sistemas conectados, reglas y cantidad de flujos.',
        delivery: 'El plazo depende de los accesos y las conexiones disponibles',
        continuity: 'Revisión y ajustes cuando cambien las conexiones',
        terms: ['Origen, destino y datos de cada flujo definidos', 'Accesos y restricciones de terceros verificados', 'Frecuencias y manejo de errores acordados', 'Cambios de APIs evaluados dentro del soporte'],
        numbers: [['2', 'Extremos definidos: origen y destino'], ['1', 'Mapa de intercambio de datos'], ['3', 'Pruebas: éxito, error y duplicación']],
        cta: 'Cotizar una integración',
        request: 'Dinos qué herramientas deben conversar y qué tarea quieres automatizar.',
        examples: ['Sincronización de sistemas', 'Carga de datos', 'Notificaciones', 'Conexiones con sistemas de tu institución'],
        benefits: [['Reducir tareas manuales', 'Flujos automáticos entre las herramientas del proyecto.'], ['Evitar duplicaciones', 'Validaciones y reglas para intercambiar información.'], ['Detectar incidencias', 'Registros y alertas según los flujos acordados.'], ['Facilitar nuevos enlaces', 'Documentación de APIs, dependencias y configuraciones.']],
        external: 'Planes de terceros, licencias y consumos de API'
      },
      cybersecurity: {
        scopeTitle: 'Todo listo para poner tu herramienta en uso',
        includes: ['Revisamos los servidores y cuándo necesita estar disponible tu herramienta.', 'Preparamos la instalación y configuración acordadas.', 'Revisamos permisos, protección de contraseñas y copias de seguridad.', 'Monitoreo acordado, prueba de recuperación y manual de operación.'],
        needs: 'Necesitamos saber dónde funciona tu herramienta y qué servicios son esenciales. Acordamos los accesos y horarios de trabajo antes de hacer cambios.',
        investment: 'Según los servidores, servicios y horarios de funcionamiento necesarios.',
        delivery: 'Instalación por etapas y en horarios acordados',
        continuity: 'Operación y monitoreo opcionales',
        terms: ['Ambientes y recursos incluidos identificados', 'Accesos autorizados antes de intervenir', 'Respaldos y objetivos de recuperación acordados', 'Auditorías especializadas se cotizan por separado'],
        numbers: [['3', 'Partes: instalación, accesos y funcionamiento'], ['1', 'Procedimiento de recuperación'], ['1', 'Manual de operación y accesos']],
        cta: 'Evaluar mi infraestructura',
        request: 'Revisemos dónde funcionará tu herramienta y cómo mantenerla disponible.',
        examples: ['Instalación en servidores en línea', 'Instalación de aplicaciones', 'Control de accesos', 'Respaldos y monitoreo'],
        benefits: [['Organizar los sistemas', 'Configuración según el uso y tamaño del proyecto.'], ['Controlar accesos', 'Permisos y configuración de seguridad básica revisados.'], ['Preparar la recuperación', 'Copias de seguridad y pasos de recuperación acordados.'], ['Sostener la operación', 'Revisión del funcionamiento y guía para administrar la herramienta.']],
        external: 'Servidores en línea, almacenamiento y licencias'
      }
    };

    serviceDetails.aiAutomation.title = 'Inteligencia artificial aplicada';
    serviceDetails['dev-web'].title = 'Software a medida';
    serviceDetails['research-data'].title = 'Datos e integración';
    solutionFormats['research-data'].includes.push('Integración de sistemas mediante APIs autorizadas, con trazabilidad y control de errores.');
    solutionFormats['research-data'].examples = ['Indicadores de salud', 'Integración de sistemas', 'Preparación de datos', 'Automatización de reportes'];

    // Reuse the same components while keeping the scope specific to each solution.
    Object.entries(solutionFormats).forEach(([key, format]) => {
      const details = serviceDetails[key];
      const source = document.createElement('div');
      source.innerHTML = details.content;
      const intro = source.querySelector('.service-modal__intro').outerHTML;
      const checklist = `<ul class="service-modal__checklist">${format.includes.map(item => `<li><i data-lucide="check-circle" class="icon"></i>${item}</li>`).join('')}</ul>`;
      details.hideServicePrice = false;
      details.pricingMin = 'Cotización a medida';
      details.delivery = format.delivery;
      details.maintenance = format.continuity;
      details.investmentNote = format.investment;
      details.externalCosts = format.external;
      details.features = format.benefits.map(([benefit]) => benefit);
      details.content = `${intro}
        <section class="service-modal__section service-modal__scope">
          <h4><i data-lucide="package" class="icon icon--sm"></i> ${format.scopeTitle}</h4>${checklist}
        </section>
        <section class="service-modal__section service-modal__examples">
          <h4><i data-lucide="layers" class="icon icon--sm"></i> Ejemplos de aplicación</h4>
          <div class="service-modal__tags">${format.examples.map(example => `<span class="tag">${example}</span>`).join('')}</div>
          <div class="service-modal__requirements"><h5>Qué necesitamos para comenzar</h5><p>${format.needs}</p></div>
        </section>
        <section class="service-modal__section service-modal__benefits">
          <h4><i data-lucide="list-checks" class="icon icon--sm"></i> Beneficios para tu proyecto</h4>
          <div class="plans-table-wrap"><table class="plans-table">
            <thead><tr><th scope="col">Beneficio</th><th scope="col">Cómo lo abordamos</th></tr></thead>
            <tbody>${format.benefits.map(([benefit, detail]) => `<tr><th scope="row">${benefit}</th><td>${detail}</td></tr>`).join('')}</tbody>
          </table></div>
        </section>`;
    });

    const renderServiceCommercialSummary = (details) => details.hideServicePrice ? '' : `
      <section class="service-modal__commercial" aria-label="Resumen comercial">
        <div class="service-modal__commercial-head">
          <span><i data-lucide="badge-dollar-sign" class="icon icon--sm"></i> Inversión inicial</span>
          <strong>${details.delivery || 'Plazo confirmado con el alcance'}</strong>
        </div>
        <div class="service-modal__commercial-grid">
          <article class="service-modal__commercial-card service-modal__commercial-card--primary">
            <span>Implementación o servicio</span>
            <strong>${details.pricingMin || 'A cotizar'}</strong>
            <small>${details.investmentNote || 'El alcance final se confirma antes de comenzar.'}</small>
          </article>
          <article class="service-modal__commercial-card">
            <span>Apoyo después de la entrega</span>
            <strong>${details.maintenance || 'Opcional'}</strong>
            <small>Se contrata por separado cuando corresponde.</small>
          </article>
          <article class="service-modal__commercial-card">
            <span>Costos externos</span>
            <strong>${details.externalCosts || 'Informados por separado'}</strong>
            <small>Sin licencias, materiales ni cobros ocultos.</small>
          </article>
        </div>
      </section>`;
    
    serviceCards.forEach(card => {
      card.addEventListener('click', (e) => {
        // Determine source: mapped service (data-service) or simple pricing CTA
        const serviceType = card.dataset.service;
        const cardPriceAttr = card.dataset.price;
        const cardServiceTitle = card.dataset.serviceTitle || null;
        const isCatalogService = !!card.closest('.service-card--catalog, .pricing__service-card, .innovation-capability');
        const serviceAction = card.dataset.serviceAction || 'consultation';

        if (!serviceType && !cardPriceAttr && !cardServiceTitle) {
          return;
        }

        e.preventDefault();
        let typeLabel = '';

        let details = serviceDetails[serviceType];

        // If no mapped details, build enriched details from the originating card.
        if (!details) {
          const closestCard = card.closest('.pricing__service-card') || card.closest('.service-card');
          const titleElement = closestCard ? closestCard.querySelector('.pricing__service-card-title, .service-card__title') : null;
          const descElement = closestCard ? closestCard.querySelector('.pricing__service-card-desc, .service-card__desc') : null;
          const typeLabelElement = closestCard ? closestCard.querySelector('.pricing__service-type') : null;
          const title = cardServiceTitle || (titleElement && titleElement.textContent ? titleElement.textContent.trim() : '') || 'Servicio';
          const descText = descElement && descElement.textContent ? descElement.textContent.trim() : '';
          const descHTML = descElement ? descElement.innerHTML : '';
          const typeLabelRaw = typeLabelElement && typeLabelElement.textContent ? typeLabelElement.textContent.trim() : '';
          typeLabel = typeLabelRaw.replace('/', '').trim();
          const rawPrice = cardPriceAttr ? parseInt(cardPriceAttr, 10) : null;
          const priceElement = closestCard ? closestCard.querySelector('.pricing__service-price strong, .service-card__price strong') : null;
          const priceLabel = rawPrice !== null ? `CLP $${formatNumber(rawPrice)}${typeLabel ? ` /${typeLabel}` : ''}`
                                      : (priceElement && priceElement.textContent ? priceElement.textContent : 'A cotizar');

          // Extra descriptive sections per specific service
          const extras = {
            'Diagnóstico Express': `
              <div class="service-modal__section">
                <h4><i data-lucide="search" class="icon icon--sm"></i> ¿Qué incluye la sesión?</h4>
                <ul class="service-modal__list">
                  <li>Revisión de tu sitio web, redes y presencia en Google</li>
                  <li>Identificación de los 3 problemas que más te están costando clientes</li>
                  <li>Hoja de ruta priorizada con acciones concretas que puedes hacer hoy</li>
                  <li>Grabación de la sesión + resumen escrito enviado por email</li>
                </ul>
              </div>
              <div class="service-modal__section">
                <h4><i data-lucide="zap" class="icon icon--sm"></i> ¿Para quién es?</h4>
                <p>Ideal si sientes que tu negocio <strong>ya tiene presencia digital pero no convierte</strong>, o si quieres saber por dónde partir antes de invertir en un proyecto mayor.</p>
              </div>
              <div class="service-modal__section">
                <h4><i data-lucide="clock" class="icon icon--sm"></i> Duración y formato</h4>
                <p>45 minutos por videollamada o coordinación desde nuestra oficina central en Concepción. Recibes el informe en 24 horas hábiles.</p>
              </div>`,

            'Integración simple': `
              <div class="service-modal__section">
                <h4><i data-lucide="plug" class="icon icon--sm"></i> Ejemplos de integraciones</h4>
                <ul class="service-modal__list">
                  <li>Formulario de contacto → WhatsApp Business (notificación instantánea)</li>
                  <li>Reservas online → Google Calendar + email automático al cliente</li>
                  <li>Formulario de cotización → Google Sheets o Notion</li>
                  <li>Pagos online con tarjeta en tu sitio actual</li>
                </ul>
              </div>
              <div class="service-modal__section">
                <h4><i data-lucide="calendar-check" class="icon icon--sm"></i> Entrega garantizada</h4>
                <p>Funcionando en <strong>3 a 5 días hábiles</strong>. Incluye pruebas, documentación y una sesión de revisión contigo antes de activar.</p>
              </div>
              <div class="service-modal__section">
                <h4><i data-lucide="shield-check" class="icon icon--sm"></i> Sin compromisos a largo plazo</h4>
                <p>Pago único por integración. Si el alcance crece, cotizamos por separado — sin sorpresas.</p>
              </div>`,

            'Soporte Remoto Pyme': `
              <div class="service-modal__section">
                <h4><i data-lucide="headphones" class="icon icon--sm"></i> ¿Qué puedes resolver con este servicio?</h4>
                <ul class="service-modal__list">
                  <li>Algo dejó de funcionar en tu sitio y no sabes por qué</li>
                  <li>Necesitas agregar o cambiar algo rápido (texto, imagen, sección)</li>
                  <li>Quieres entender cómo usar tu propio sistema o administrador</li>
                  <li>Tienes una duda técnica y necesitas una respuesta en el momento</li>
                </ul>
              </div>
              <div class="service-modal__section">
                <h4><i data-lucide="clock" class="icon icon--sm"></i> Cómo funciona</h4>
                <p>Agendas tu bloque horario, nos conectamos por videollamada y resolvemos en vivo. Si la tarea no requiere la hora completa, igual se cobra la hora mínima.</p>
              </div>
              <div class="service-modal__section">
                <h4><i data-lucide="layers" class="icon icon--sm"></i> Pack de horas disponible</h4>
                <p>Si necesitas soporte recurrente, tenemos pack de <strong>horas de soporte</strong>. Ideal para negocios que necesitan ayuda constante sin contratar un plan mensual.</p>
              </div>`,

            'Bugfix y ajuste web': `
              <div class="service-modal__section">
                <h4><i data-lucide="wrench" class="icon icon--sm"></i> ¿Qué tipos de problemas resolvemos?</h4>
                <ul class="service-modal__list">
                  <li>El formulario de contacto no envía o llega con errores</li>
                  <li>El sitio se ve mal en celular o en algún navegador</li>
                  <li>Botones o links rotos que ahuyentan clientes</li>
                  <li>Carga lenta o errores 404 que dañan tu SEO</li>
                  <li>Ajustes de estilo, colores o tipografías</li>
                </ul>
              </div>
              <div class="service-modal__section">
                <h4><i data-lucide="zap" class="icon icon--sm"></i> Respuesta rápida</h4>
                <p>Comenzamos dentro de las <strong>24 horas hábiles</strong> de confirmado el pago. La mayoría de los bugfixes quedan resueltos el mismo día.</p>
              </div>
              <div class="service-modal__section">
                <h4><i data-lucide="info" class="icon icon--sm"></i> Si el trabajo es mayor</h4>
                <p>Si al revisar el problema descubrimos que requiere más de 1 hora, te avisamos antes de continuar. Sin costos sorpresa.</p>
              </div>`,
          };

          const content = `
            ${extras[title] ? '' : `<p class="service-modal__intro">${descHTML || descText}</p>`}
            ${extras[title] || ''}
          `;

          details = {
            title,
            content,
            pricingMin: priceLabel,
            maintenance: 'Soporte posterior opcional',
            externalCosts: 'Licencias o servicios de terceros se cotizan aparte',
            delivery: title === 'Bugfix y ajuste web' ? 'Inicio en 24 horas hábiles' : 'Plazo según alcance',
            features: []
          };
        }

        if (details && modal && modalTitle) {
          modal.classList.toggle('service-modal--solution', !!solutionFormats[serviceType]);
          const solution = solutionFormats[serviceType];
          const numbers = solution ? solution.numbers : [['24–48h', 'Respuesta inicial'], ['1', 'Ruta de trabajo clara'], ['100%', 'Ajustado al alcance']];
          modal.querySelectorAll('.service-modal__kpi').forEach((item, index) => {
            item.querySelector('.service-modal__kpi-value').textContent = numbers[index][0];
            item.querySelector('.service-modal__kpi-label').textContent = numbers[index][1];
          });
          modalTitle.textContent = details.title;

          // Actualizar contenido descriptivo
          const descContainer = modal.querySelector('.service-modal__description');
          if (descContainer) {
            descContainer.innerHTML = renderServiceCommercialSummary(details) + details.content;
            const benefitCard = descContainer.querySelector('[data-benefit-card]');
            const benefitCardText = descContainer.querySelector('[data-benefit-card-text]');
            const benefitClose = descContainer.querySelector('[data-benefit-close]');
            const benefitButtons = descContainer.querySelectorAll('[data-benefit-text]');

            if (benefitCard && benefitCardText) {
              const hideBenefitCard = () => {
                benefitCard.hidden = true;
                benefitCard.classList.remove('is-visible');
                benefitCard.style.left = '';
                benefitCard.style.top = '';
                benefitCard.style.right = '';
                benefitCard.style.bottom = '';
                benefitCard.style.visibility = '';
                benefitCard.dataset.side = '';
              };

              const positionBenefitCard = (triggerButton) => {
                const modalContent = modal.querySelector('.service-modal__content');
                if (!modalContent) return;

                const triggerRect = triggerButton.getBoundingClientRect();
                const cardRect = benefitCard.getBoundingClientRect();
                const gap = 12;
                const viewportPadding = 16;
                const belowSpace = window.innerHeight - triggerRect.bottom;
                const aboveSpace = triggerRect.top;
                const openBelow = belowSpace > cardRect.height + 20 || belowSpace > aboveSpace;

                let left = triggerRect.right + gap;
                let side = 'right';

                if (left + cardRect.width > window.innerWidth - viewportPadding) {
                  left = triggerRect.left - gap - cardRect.width;
                  side = 'left';
                }

                if (window.innerWidth <= 640) {
                  left = viewportPadding;
                  side = 'bottom';
                }

                let top = openBelow
                  ? triggerRect.bottom + gap
                  : triggerRect.top - cardRect.height - gap;

                if (window.innerWidth <= 640) {
                  top = Math.min(triggerRect.bottom + gap, window.innerHeight - cardRect.height - viewportPadding);
                }

                top = Math.max(viewportPadding, Math.min(top, window.innerHeight - cardRect.height - viewportPadding));
                left = Math.max(viewportPadding, Math.min(left, window.innerWidth - cardRect.width - viewportPadding));

                benefitCard.dataset.side = side;
                benefitCard.style.left = `${left}px`;
                benefitCard.style.top = `${top}px`;
                benefitCard.style.visibility = 'visible';
              };

              benefitButtons.forEach((button) => {
                button.addEventListener('click', () => {
                  benefitCardText.textContent = button.dataset.benefitText || '';
                  benefitCard.hidden = false;
                  benefitCard.classList.add('is-visible');
                  benefitCard.style.visibility = 'hidden';

                  requestAnimationFrame(() => positionBenefitCard(button));
                });
              });

              if (benefitClose) {
                benefitClose.addEventListener('click', hideBenefitCard);
              }
            }
            if (window.lucide && typeof lucide.createIcons === 'function') lucide.createIcons();
          }

          const priceAmount = modal.querySelector('.service-modal__price-amount');
          if (priceAmount) {
            if (details.reservationDeposit) {
              priceAmount.textContent = details.reservationDeposit;
              const priceTextEl = modal.querySelector('.service-modal__price-text');
              if (priceTextEl) {
                priceTextEl.textContent = 'Reserva abonable íntegramente al servicio final';
              }
            } else if (details.hideServicePrice) {
              priceAmount.textContent = 'Primera reunión sin costo';
              const priceTextEl = modal.querySelector('.service-modal__price-text');
              if (priceTextEl) {
                priceTextEl.textContent = 'Cuéntanos tu idea y te preparamos un presupuesto sin compromiso';
              }
            } else if (isCatalogService) {
              priceAmount.textContent = details.pricingMin;
              const priceTextEl = modal.querySelector('.service-modal__price-text');
              if (priceTextEl) {
                const tlabel = typeLabel ? `Precio por ${typeLabel}` : '';
                const isReferencePrice = String(details.pricingMin || '').toLowerCase().startsWith('desde');
                priceTextEl.textContent = solution ? solution.request : isReferencePrice
                  ? `Valor base referencial · ${details.delivery || 'plazo según alcance'}`
                  : (tlabel || details.delivery || 'Alcance confirmado antes de comenzar');
              }
            } else {
              // Los servicios integrales comienzan con una conversación, no con una tarifa cerrada.
              priceAmount.textContent = 'Hablemos de tu proyecto';
              const priceTextEl = modal.querySelector('.service-modal__price-text');
              if (priceTextEl) {
                priceTextEl.textContent = 'Cuéntanos qué quieres lograr y te orientamos con una ruta clara, sin compromiso.';
              }
            }
          }

          const priceBadge = modal.querySelector('.service-modal__price-badge');
          if (priceBadge) {
            const badgeLabel = details.reservationDeposit
              ? 'Reserva tu visita técnica'
              : details.hideServicePrice
                ? 'Presupuesto gratis'
              : (serviceType === 'diagnostico' ? 'Orientación inicial sin costo' : 'Precio y alcance claros');
            priceBadge.innerHTML = `${iconSvgs.check}<span>${badgeLabel}</span>`;
          }

          // Actualizar features si existen
          const featuresList = modal.querySelector('.service-modal__features');
          if (featuresList) {
            if (details.features && details.features.length) {
              featuresList.innerHTML = details.features
                .map(feature => `
                  <li class="service-modal__feature">
                    ${iconSvgs.check}
                    <span>${feature}</span>
                  </li>
                `)
                .join('');
            } else {
              featuresList.innerHTML = '';
            }
          }

          // Open modal
          modal.classList.add('open');
          modal.classList.toggle('service-modal--catalog', isCatalogService);
          modal.classList.toggle('service-modal--contact', !isCatalogService);
          document.body.classList.add('modal-open');

          // Modal installment select removed — no longer needed

          // Deshabilitar botón de solicitud para Ciberseguridad
          const ctaBtn = modal.querySelector('[data-service-modal-cta]');
          const meetingBtn = modal.querySelector('[data-service-modal-meeting]');
          const meetingNote = modal.querySelector('[data-service-modal-meeting-note]');
          if (meetingBtn) {
            const showMeetingButton = isCatalogService && serviceAction === 'visit' && serviceType !== 'security' && !details.reservationDeposit;
            meetingBtn.style.display = showMeetingButton ? 'inline-flex' : 'none';
            if (meetingNote) meetingNote.style.display = showMeetingButton ? 'block' : 'none';
            meetingBtn.onclick = showMeetingButton ? (event) => {
              event.preventDefault();
              modal.classList.remove('open', 'service-modal--catalog');
              document.dispatchEvent(new CustomEvent('ntek:open-free-booking'));
            } : null;
          }
          if (ctaBtn) {
            // Remover listeners previos
            ctaBtn.onclick = null;

            if (serviceType === 'security') {
              ctaBtn.textContent = 'Próximamente';
              ctaBtn.disabled = true;
              ctaBtn.style.opacity = '0.6';
              ctaBtn.style.cursor = 'not-allowed';
              ctaBtn.style.pointerEvents = 'none';
            } else if (isCatalogService && serviceAction === 'visit') {
              ctaBtn.innerHTML = `Reservar visita técnica ${iconSvgs.calendar}`;
              ctaBtn.href = '#';
              ctaBtn.removeAttribute('target');
              ctaBtn.removeAttribute('rel');
              ctaBtn.removeAttribute('data-modal-close');
              ctaBtn.onclick = (event) => {
                event.preventDefault();
                modal.classList.remove('open', 'service-modal--catalog');
                document.dispatchEvent(new CustomEvent('ntek:open-visit-checkout', {
                  detail: { service: details.title }
                }));
              };
              ctaBtn.disabled = false;
              ctaBtn.style.opacity = '1';
              ctaBtn.style.cursor = 'pointer';
              ctaBtn.style.pointerEvents = 'auto';
            } else {
              ctaBtn.textContent = solution ? `${solution.cta} ` : serviceType === 'diagnostico' ? 'Agendar diagnóstico sin costo ' : 'Solicitar presupuesto gratis ';
              ctaBtn.innerHTML += iconSvgs.arrowRight;
              ctaBtn.href = '#agenda-sin-costo';
              ctaBtn.removeAttribute('target');
              ctaBtn.removeAttribute('data-modal-close');
              ctaBtn.onclick = (event) => {
                event.preventDefault();
                modal.classList.remove('open', 'service-modal--catalog');
                document.dispatchEvent(new CustomEvent('ntek:open-free-booking'));
              };
              ctaBtn.disabled = false;
              ctaBtn.style.opacity = '1';
              ctaBtn.style.cursor = 'pointer';
              ctaBtn.style.pointerEvents = 'auto';
            }

            const ctaNote = modal.querySelector('.service-modal__cta-note');
            if (ctaNote) {
              ctaNote.textContent = serviceAction === 'visit'
                ? 'Coordinamos la visita y el horario · $5.000 se abona al servicio final'
                : 'Revisamos el alcance antes de cualquier pago · Sin compromiso';
            }

            const serviceNote = modal.querySelector('.service-modal__note');
            if (serviceNote) {
              serviceNote.textContent = details.externalCosts || 'Los costos externos se informan y autorizan por separado.';
            }

            const guaranteesTitle = modal.querySelector('.service-modal__guarantees .service-modal__sidebar-title');
            const guaranteesList = modal.querySelector('.service-modal__guarantee-list');
            if (guaranteesTitle && guaranteesList) {
              guaranteesTitle.textContent = 'Contratación clara';
              guaranteesList.innerHTML = solution
                ? solution.terms.map(term => `<li>${iconSvgs.check}<span>${term}</span></li>`).join('')
                : serviceAction === 'visit'
                ? `
                  <li>${iconSvgs.check}<span>Reserva abonable al servicio: $5.000</span></li>
                  <li>${iconSvgs.check}<span>Valor final confirmado antes de trabajar</span></li>
                  <li>${iconSvgs.check}<span>Materiales y repuestos cotizados aparte</span></li>
                  <li>${iconSvgs.check}<span>Boleta o factura disponible</span></li>
                `
                : `
                  <li>${iconSvgs.check}<span>Alcance claro antes de pagar</span></li>
                  <li>${iconSvgs.check}<span>Implementación y continuidad separadas</span></li>
                  <li>${iconSvgs.check}<span>Costos externos informados por adelantado</span></li>
                  <li>${iconSvgs.check}<span>Boleta o factura disponible</span></li>
                `;
            }
          }
        }
      });
    });
  };

  // ==========================================================================
  // LOGOS CAROUSEL
  // ==========================================================================
  const initCarousel = (selector, direction = 'ltr') => {
    const track = document.querySelector(selector);
    if (!track) return;

    const viewport = track.closest('.logos__viewport');
    const pauseButton = track.closest('.logos')?.querySelector('[data-logos-pause]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let paused = reducedMotion.matches;
    let hovered = false;
    let lastTime = null;
    const updatePause = () => {
      if (!pauseButton) return;
      pauseButton.textContent = paused ? 'Reanudar carrusel' : 'Pausar carrusel';
      pauseButton.setAttribute('aria-pressed', String(paused));
    };
    pauseButton?.addEventListener('click', () => { paused = !paused; updatePause(); });
    viewport?.addEventListener('pointerenter', () => { hovered = true; });
    viewport?.addEventListener('pointerleave', () => { hovered = false; });
    reducedMotion.addEventListener('change', event => { paused = event.matches; updatePause(); });
    updatePause();

    // disable any CSS animation
    track.style.animation = 'none';

    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    
    // Para carruseles inversos, calcular el ancho total del primer set
    let offset = 0;
    if (direction === 'rtl') {
      const totalItems = track.children.length;
      const halfItems = totalItems / 2;
      let totalWidth = 0;
      for (let i = 0; i < halfItems; i++) {
        totalWidth += track.children[i].offsetWidth + gap;
      }
      offset = -totalWidth;
    }
    
    const step = time => {
      const speed = lastTime === null ? 0 : Math.min(time - lastTime, 50) * .03;
      lastTime = time;
      if (paused || hovered || document.hidden) { requestAnimationFrame(step); return; }
      if (direction === 'ltr') {
        // Left to right (original behavior)
        offset -= speed;
        const first = track.firstElementChild;
        if (first) {
          const firstWidth = first.offsetWidth + gap;
          if (offset <= -firstWidth) {
            track.appendChild(first);
            offset += firstWidth;
          }
        }
      } else {
        // Right to left (reverse)
        offset += speed;
        const last = track.lastElementChild;
        if (last) {
          const lastWidth = last.offsetWidth + gap;
          if (offset >= 0) {
            track.insertBefore(last, track.firstElementChild);
            offset -= lastWidth;
          }
        }
      }
      track.style.transform = `translateX(${offset}px)`;
      requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  };

  // ==========================================================================
  // CASE STUDY MODALES
  // ==========================================================================

  const initCaseModals = () => {
    const caseCards = $$('.case-card');
    const modal = $('#case-modal');
    
    const caseData = {
      "sitme": {
            "category": "HealthTech · IA y salud femenina",
            "title": "SITME · Tamizaje y seguimiento de endometriosis",
            "industry": "Salud / Ginecología",
            "problem": "Los síntomas y antecedentes necesitan una evaluación estructurada y continuidad para orientar el proceso de atención.",
            "solution": "SITME reúne tamizaje, priorización y seguimiento en una ficha ginecológica universal. El proyecto avanza a pilotos de validación con equipos de salud.",
            "result": "FONDEF VIU 2026 adjudicado · 3.er lugar en EVIC",
            "pageLink": "https://sitme.cl/",
            "images": [
                  "assets/sitme.png",
                  "assets/sitme2.png",
                  "assets/sitme3.png"
            ]
      },
      "san-fabian": {
            "category": "HealthTech · Urgencias",
            "title": "Sistema de priorización de urgencias",
            "industry": "Salud / Gestión hospitalaria",
            "problem": "El equipo de urgencias necesita organizar pacientes y coordinar prioridades, camas y turnos.",
            "solution": "Una plataforma de priorización digital, seguimiento y alertas para apoyar la coordinación del equipo clínico.",
            "result": "Información de pacientes y prioridades en un flujo de trabajo compartido",
            "images": [
                  "assets/sicpu.png",
                  "assets/sicpu2.png",
                  "assets/sicpu3.png"
            ]
      }
};

    caseCards.forEach(card => {
      card.addEventListener('click', (event) => {
        if (event.target.closest('a')) return;
        const caseId = card.dataset.case;
        const data = caseData[caseId];
        
        if (!data) return;
        
        // Actualizar contenido del modal
        const categoryBadge = modal.querySelector('.case-modal__category-badge');
        const categoryElements = modal.querySelectorAll('[data-category]');
        const problemEl = modal.querySelector('[data-problem]');
        const solutionEl = modal.querySelector('[data-solution]');
        const resultEl = modal.querySelector('[data-result]');
        const industryEl = modal.querySelector('[data-industry]');
        const titleEl = modal.querySelector('.case-modal__title');
        
        // Actualizar todos los elementos de categoría
        categoryElements.forEach(el => {
          el.textContent = data.category;
        });
        
        problemEl.textContent = data.problem;
        solutionEl.textContent = data.solution;
        resultEl.textContent = data.result;
        industryEl.textContent = data.industry;
        titleEl.textContent = data.title;
        

        // Actualizar badge de categoría con color correcto
        categoryBadge.className = 'case-modal__category-badge';
        
        // Cargar imágenes en el carrusel
        const gallery = modal.querySelector('.case-modal__carousel');
        gallery.hidden = !data.images?.length;
        if (data.images?.length) initCarousel(data.images, data.imageFit);
        modal.querySelector('.case-modal__body').scrollTop = 0;
        
        // Abrir modal
        modal.classList.add('open');
        document.body.classList.add('modal-open');
      });
    });
    
    // Función para inicializar el carrusel
    const initCarousel = (images, imageFit = 'contain') => {
      const track = modal.querySelector('[data-carousel-track]');
      const dotsContainer = modal.querySelector('[data-carousel-dots]');
      const prevBtn = modal.querySelector('[data-carousel-prev]');
      const nextBtn = modal.querySelector('[data-carousel-next]');
      
      let currentSlide = 0;
      
      // Limpiar carrusel anterior
      track.innerHTML = '';
      dotsContainer.innerHTML = '';
      
      // Crear slides
      images.forEach((imageSrc, index) => {
        const slide = document.createElement('div');
        slide.className = 'case-modal__carousel-slide';
        const fitClass = imageFit === 'contain' ? ' case-modal__carousel-image--contain' : '';
        slide.innerHTML = `<img src="${imageSrc}" alt="Imagen del proyecto ${index + 1}" class="case-modal__carousel-image${fitClass}" data-image-index="${index}">`;
        track.appendChild(slide);
        
        // Añadir evento click a la imagen para abrir lightbox
        const img = slide.querySelector('.case-modal__carousel-image');
        img.alt = `${modal.querySelector('.case-modal__title').textContent} — vista ${index + 1}`;
        img.tabIndex = index === 0 ? 0 : -1;
        img.setAttribute('role', 'button');
        img.setAttribute('aria-label', `Ampliar ${img.alt}`);
        img.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openLightbox(images, index);
          }
        });
        img.addEventListener('click', () => {
          openLightbox(images, index);
        });
        
        // Crear dot
        const dot = document.createElement('button');
        dot.className = `case-modal__carousel-dot ${index === 0 ? 'active' : ''}`;
        dot.setAttribute('aria-label', `Ir a imagen ${index + 1}`);
        dot.addEventListener('click', () => goToSlide(index));
        dotsContainer.appendChild(dot);
      });
      
      const updateCarousel = () => {
        track.style.transform = `translateX(-${currentSlide * 100}%)`;
        modal.querySelector('[data-carousel-counter]').textContent = `${currentSlide + 1} / ${images.length}`;
        track.querySelectorAll('img').forEach((img, index) => {
          img.tabIndex = index === currentSlide ? 0 : -1;
          img.closest('.case-modal__carousel-slide').setAttribute('aria-hidden', String(index !== currentSlide));
        });
        
        // Actualizar dots
        const dots = dotsContainer.querySelectorAll('.case-modal__carousel-dot');
        dots.forEach((dot, index) => {
          dot.classList.toggle('active', index === currentSlide);
          dot.setAttribute('aria-current', index === currentSlide ? 'true' : 'false');
        });
        
        // Actualizar botones
        prevBtn.style.display = images.length > 1 ? 'flex' : 'none';
        nextBtn.style.display = images.length > 1 ? 'flex' : 'none';
        dotsContainer.style.display = images.length > 1 ? 'flex' : 'none';
      };
      
      const goToSlide = (index) => {
        currentSlide = index;
        updateCarousel();
      };
      
      const nextSlide = () => {
        currentSlide = (currentSlide + 1) % images.length;
        updateCarousel();
      };
      
      const prevSlide = () => {
        currentSlide = (currentSlide - 1 + images.length) % images.length;
        updateCarousel();
      };
      
      prevBtn.onclick = prevSlide;
      nextBtn.onclick = nextSlide;
      
      updateCarousel();
    };
    
    // Función para abrir el lightbox
    const openLightbox = (images, startIndex = 0) => {
      const lightbox = $('#image-lightbox');
      const lightboxImage = lightbox.querySelector('[data-lightbox-image]');
      const counter = lightbox.querySelector('[data-lightbox-counter]');
      const prevBtn = lightbox.querySelector('[data-lightbox-prev]');
      const nextBtn = lightbox.querySelector('[data-lightbox-next]');
      const closeBtn = lightbox.querySelector('.lightbox__close');
      const backdrop = lightbox.querySelector('.lightbox__backdrop');
      
      let currentIndex = startIndex;
      
      const updateLightbox = () => {
        lightboxImage.src = images[currentIndex];
        lightboxImage.alt = `Imagen del proyecto ${currentIndex + 1}`;
        counter.textContent = `${currentIndex + 1} / ${images.length}`;
        
        // Ocultar botones si solo hay una imagen
        if (images.length <= 1) {
          prevBtn.style.display = 'none';
          nextBtn.style.display = 'none';
        } else {
          prevBtn.style.display = 'flex';
          nextBtn.style.display = 'flex';
        }
        
        // Reinicializar lucide icons para los nuevos elementos
        if (window.lucide) {
          lucide.createIcons();
        }
      };
      
      const nextImage = () => {
        currentIndex = (currentIndex + 1) % images.length;
        updateLightbox();
      };
      
      const prevImage = () => {
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        updateLightbox();
      };
      
      const closeLightbox = () => {
        lightbox.classList.remove('open');
        document.body.style.overflow = '';
      };
      
      // Event listeners
      const handlePrev = () => prevImage();
      const handleNext = () => nextImage();
      const handleClose = () => closeLightbox();
      const handleBackdropClick = () => closeLightbox();
      const handleKeydown = (e) => {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') prevImage();
        if (e.key === 'ArrowRight') nextImage();
      };
      
      // Remover listeners anteriores si existen
      prevBtn.replaceWith(prevBtn.cloneNode(true));
      nextBtn.replaceWith(nextBtn.cloneNode(true));
      closeBtn.replaceWith(closeBtn.cloneNode(true));
      backdrop.replaceWith(backdrop.cloneNode(true));
      
      // Volver a obtener referencias después de reemplazar
      const newPrevBtn = lightbox.querySelector('[data-lightbox-prev]');
      const newNextBtn = lightbox.querySelector('[data-lightbox-next]');
      const newCloseBtn = lightbox.querySelector('.lightbox__close');
      const newBackdrop = lightbox.querySelector('.lightbox__backdrop');
      
      // Añadir nuevos listeners
      newPrevBtn.addEventListener('click', handlePrev);
      newNextBtn.addEventListener('click', handleNext);
      newCloseBtn.addEventListener('click', handleClose);
      newBackdrop.addEventListener('click', handleBackdropClick);
      document.addEventListener('keydown', handleKeydown);
      
      // Remover listener de teclado al cerrar
      const originalClose = closeLightbox;
      const closeLightboxWrapper = () => {
        document.removeEventListener('keydown', handleKeydown);
        originalClose();
      };
      
      newCloseBtn.onclick = closeLightboxWrapper;
      newBackdrop.onclick = closeLightboxWrapper;
      
      // Abrir lightbox
      updateLightbox();
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    };
    
    // Cerrar modal
    const modalClose = modal ? modal.querySelector('.modal__close') : null;
    const modalBackdrop = modal ? modal.querySelector('.modal__backdrop') : null;
    const modalCloseBtn = modal ? modal.querySelector('[data-modal-close]') : null;
    
    const closeModal = () => {
      if (modal) modal.classList.remove('open');
      document.body.classList.remove('modal-open');
    };
    
    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  };

  // ==========================================================================
  // MODALES DEL EQUIPO
  // ==========================================================================

  const initTeamModals = () => {
    const teamButtons = $$('.team-member-btn');
    let lastTrigger = null;

    // Enhance the existing profiles so their full content remains available in HTML.
    $$('.team-modal').forEach(modal => {
      const body = modal.querySelector('.team-modal__body');
      if (!body || modal.dataset.profileReady) return;
      modal.dataset.profileReady = 'true';
      const sections = [...body.children];
      const profileIdentity = {
        'modal-carola': { field: 'Inteligencia artificial', lead: 'IA y ciencia de datos para conectar investigación y aplicaciones.' },
        'modal-daniela': { field: 'Bioquímica e IA', lead: 'Aprendizaje automático para estudiar desafíos de salud reproductiva.' },
        'modal-lara': { field: 'Biomedicina', lead: 'Biomarcadores y biología reproductiva para investigar la endometriosis.' },
        'modal-tomas': { field: 'Tecnología para la salud', lead: 'Crea herramientas que acercan la investigación a la atención de salud.' }
      }[modal.id];
      const identity = modal.querySelector('.team-modal__header');
      if (profileIdentity) {
        const field = document.createElement('span');
        field.className = 'profile-field';
        field.textContent = profileIdentity.field;
        identity.prepend(field);
        const overview = sections[0];
        const biography = document.createElement('details');
        biography.className = 'profile-biography';
        const summary = document.createElement('summary');
        summary.textContent = 'Leer perfil completo';
        biography.append(summary);
        overview.querySelectorAll('.team-modal__text').forEach(text => biography.append(text));
        const lead = document.createElement('p');
        lead.className = 'profile-lead';
        lead.textContent = profileIdentity.lead;
        overview.append(lead, biography);
        overview.classList.add('profile-overview');
      }
      const tabs = document.createElement('div');
      tabs.className = 'profile-tabs';
      tabs.setAttribute('role', 'tablist');
      tabs.setAttribute('aria-label', 'Explorar perfil');
      const panels = document.createElement('div');
      panels.className = 'profile-panels';
      const groups = [
        { label: 'Resumen', sections: sections.filter(section => !section.querySelector('.research-card')) },
        { label: 'Proyectos y publicaciones', sections: sections.filter(section => section.querySelector('.research-card') && !section.querySelector('[data-lucide="award"]')) },
        { label: 'Reconocimientos', sections: sections.filter(section => section.querySelector('[data-lucide="award"]')) }
      ].filter(group => group.sections.length);
      const activate = (index, focus = false) => {
        [...tabs.children].forEach((tab, position) => {
          const selected = index === position;
          tab.setAttribute('aria-selected', String(selected));
          tab.tabIndex = selected ? 0 : -1;
          panels.children[position].hidden = !selected;
        });
        body.scrollTop = 0;
        if (focus) {
          tabs.children[index].focus({ preventScroll: true });
          tabs.scrollIntoView({ block: 'nearest', behavior: 'instant' });
        }
      };
      groups.forEach((group, index) => {
        const tab = document.createElement('button');
        tab.type = 'button';
        tab.id = `${modal.id}-tab-${index}`;
        tab.textContent = group.label;
        tab.setAttribute('role', 'tab');
        tab.setAttribute('aria-controls', `${modal.id}-panel-${index}`);
        const panel = document.createElement('div');
        panel.id = `${modal.id}-panel-${index}`;
        panel.className = 'profile-panel';
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', tab.id);
        panel.tabIndex = 0;
        if (index === 0) panel.classList.add('profile-panel--overview');
        group.sections.forEach(section => panel.append(section));
        tabs.append(tab);
        panels.append(panel);
        tab.addEventListener('click', () => activate(index));
        tab.addEventListener('keydown', event => {
          let next = index;
          if (event.key === 'ArrowRight') next = (index + 1) % groups.length;
          else if (event.key === 'ArrowLeft') next = (index - 1 + groups.length) % groups.length;
          else if (event.key === 'Home') next = 0;
          else if (event.key === 'End') next = groups.length - 1;
          else return;
          event.preventDefault();
          activate(next, true);
        });
      });
      body.replaceChildren(tabs, panels);
      const shortTitles = {
        'Artificial Intelligence for Drone Forensics: A Systematic Review of Techniques, Challenges, and Research Roadmap': 'Inteligencia artificial para investigar incidentes con drones',
        'A systematic review of artificial intelligence techniques for violence detection in audio': 'Detección de violencia en audio con inteligencia artificial'
      };
      body.querySelectorAll('.research-card').forEach((card, index) => {
        const title = card.querySelector('.research-card__title');
        const label = card.querySelector('.research-card__label');
        if (!title) return;
        const details = document.createElement('details');
        details.className = 'profile-work';
        const summary = document.createElement('summary');
        const number = document.createElement('span');
        number.className = 'profile-work__number';
        number.textContent = String(index + 1).padStart(2, '0');
        number.setAttribute('aria-hidden', 'true');
        const heading = document.createElement('span');
        heading.className = 'profile-work__heading';
        if (label) heading.append(label);
        const originalTitle = title.textContent.trim();
        const name = document.createElement('span');
        name.className = 'profile-work__title';
        name.textContent = shortTitles[originalTitle] || originalTitle;
        heading.append(name);
        const hint = document.createElement('span');
        hint.className = 'profile-work__hint';
        hint.setAttribute('aria-hidden', 'true');
        hint.textContent = '+';
        summary.append(number, heading, hint);
        details.append(summary);
        const content = document.createElement('div');
        content.className = 'profile-work__content';
        if (!shortTitles[originalTitle]) title.remove();
        while (card.firstChild) content.append(card.firstChild);
        details.append(content);
        card.replaceWith(details);
      });
      const header = modal.querySelector('.team-modal__header-info');
      const count = panels.children[1]?.querySelectorAll('.profile-work').length || 0;
      [...tabs.children].forEach((tab, index) => {
        const total = panels.children[index].querySelectorAll('.profile-work').length;
        if (!total) return;
        const badge = document.createElement('span');
        badge.className = 'profile-tab-count';
        badge.textContent = String(total);
        badge.setAttribute('aria-hidden', 'true');
        tab.append(badge);
      });
      const footer = document.createElement('div');
      footer.className = 'profile-footer';
      const caption = document.createElement('span');
      caption.textContent = 'Conoce al equipo';
      footer.append(caption);
      teamButtons.forEach(trigger => {
        const targetId = `modal-${trigger.dataset.member}`;
        const target = document.getElementById(targetId);
        if (!target) return;
        const link = document.createElement('button');
        link.type = 'button';
        const fullName = target.querySelector('.team-modal__name').textContent.trim();
        link.textContent = fullName.replace(/^Dra\.\s*/, '').split(' ')[0];
        link.setAttribute('aria-label', `Ver perfil de ${fullName}`);
        if (target === modal) {
          link.disabled = true;
          link.setAttribute('aria-current', 'true');
        }
        link.addEventListener('click', () => {
          modal.classList.remove('active', 'closing');
          trigger.click();
        });
        footer.append(link);
      });
      modal.querySelector('.team-modal__content').append(footer);
      const explore = document.createElement('button');
      explore.type = 'button';
      explore.className = 'profile-explore';
      explore.textContent = `Explorar su trabajo (${count}) →`;
      explore.addEventListener('click', () => activate(1, true));
      if (groups.length > 1) header.append(explore);
      modal.addEventListener('profile:reset', () => {
        activate(0);
        modal.querySelectorAll('.profile-work').forEach(details => { details.open = false; });
        modal.querySelectorAll('.profile-biography').forEach(details => { details.open = false; });
      });
      activate(0);
    });
    
    teamButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const memberId = button.dataset.member;
        const modal = $(`#modal-${memberId}`);
        
        if (modal) {
          lastTrigger = button;
          modal.dispatchEvent(new Event('profile:reset'));
          modal.classList.remove('closing');
          modal.classList.add('active');
          document.body.classList.add('modal-open');
          modal.querySelector('.team-modal__scroll').scrollTop = 0;
          modal.querySelector('.team-modal__close').focus({ preventScroll: true });
        }
      });
    });
    
    // Cerrar modales
    const closeButtons = $$('.team-modal__close');
    const overlays = $$('.team-modal__overlay');
    
    const closeModal = (modal) => {
      if (!modal || modal.classList.contains('closing')) return;
      modal.classList.add('closing');
      setTimeout(() => {
        modal.classList.remove('active', 'closing');
        if (!$('.modal.open') && !$('.team-modal.active')) {
          document.body.classList.remove('modal-open');
          lastTrigger?.focus({ preventScroll: true });
        }
      }, 160);
    };
    
    closeButtons.forEach(button => {
      button.addEventListener('click', () => {
        const modal = button.closest('.team-modal');
        closeModal(modal);
      });
    });
    
    overlays.forEach(overlay => {
      overlay.addEventListener('click', () => {
        const modal = overlay.closest('.team-modal');
        closeModal(modal);
      });
    });
    
    // Keep keyboard navigation inside the active profile.
    document.addEventListener('keydown', (e) => {
      const activeModal = $('.team-modal.active');
      if (!activeModal) return;
      if (e.key === 'Tab') {
        const focusable = [...activeModal.querySelectorAll('a[href], button:not([disabled]), summary, [tabindex="0"]')]
          .filter(element => element.tabIndex >= 0 && element.getClientRects().length && !element.closest('[hidden]'));
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && (document.activeElement === first || !activeModal.contains(document.activeElement))) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && (document.activeElement === last || !activeModal.contains(document.activeElement))) {
          e.preventDefault();
          first?.focus();
        }
      }
      if (e.key === 'Escape') {
        if (activeModal) {
          closeModal(activeModal);
        }
      }
    });
  };

  // ==========================================================================
  // COUNTERS ANIMADOS
  // ==========================================================================

  const initCounters = () => {
    const counters = $$('[data-counter]');
    
    if (!counters.length) return;
    
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.5
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = parseInt(entry.target.dataset.counter, 10);
          animateCounter(entry.target, target);
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);
    
    counters.forEach(counter => observer.observe(counter));
  };

  const initWebinarCountdown = () => {
    const countdown = $('[data-webinar-countdown]');
    if (!countdown) return;

    const startDate = new Date(countdown.dataset.webinarStart);
    if (Number.isNaN(startDate.getTime())) return;

    const daysEl = $('[data-webinar-days]', countdown);
    const hoursEl = $('[data-webinar-hours]', countdown);
    const minutesEl = $('[data-webinar-minutes]', countdown);
    const secondsEl = $('[data-webinar-seconds]', countdown);
    const timerEl = $('.webinar-countdown__timer', countdown);
    const eventLink = $('.webinar-countdown__link', countdown);
    const minimizeButton = $('[data-webinar-minimize]', countdown);
    const restoreButton = $('[data-webinar-restore]', countdown);
    const padTime = (value) => String(value).padStart(2, '0');
    const animationDuration = 280;

    if (minimizeButton) {
      minimizeButton.addEventListener('click', () => {
        if (countdown.classList.contains('is-minimized') || countdown.classList.contains('is-minimizing')) return;

        countdown.classList.add('is-minimizing');
        window.setTimeout(() => {
          countdown.classList.remove('is-minimizing');
          countdown.classList.add('is-minimized');
          restoreButton?.focus();
        }, animationDuration);
      });
    }

    if (restoreButton) {
      restoreButton.addEventListener('click', () => {
        countdown.classList.remove('is-minimized');
        countdown.classList.add('is-restoring');
        window.setTimeout(() => {
          countdown.classList.remove('is-restoring');
          minimizeButton?.focus();
        }, animationDuration);
      });
    }

    if (eventLink) {
      eventLink.addEventListener('click', (event) => {
        const rawHref = eventLink.getAttribute('href')?.trim();
        if (!rawHref) {
          event.preventDefault();
          return;
        }

        let destination;
        try {
          destination = new URL(rawHref, window.location.href);
        } catch {
          return;
        }

        const isCurrentPageAnchor = destination.origin === window.location.origin
          && destination.pathname.replace(/\/index\.html$/, '/') === window.location.pathname.replace(/\/index\.html$/, '/')
          && destination.hash;
        const isHomeAnchor = destination.origin === window.location.origin
          && ['/', '/index.html'].includes(destination.pathname)
          && destination.hash;

        if (!isCurrentPageAnchor && !isHomeAnchor) return;

        const sectionId = decodeURIComponent(destination.hash.slice(1));
        if (!document.getElementById(sectionId)) return;

        event.preventDefault();
        navigateTo(sectionToPath(sectionId));
      });
    }

    const updateCountdown = () => {
      const remaining = startDate.getTime() - Date.now();

      if (remaining <= 0) {
        const endedLabel = countdown.dataset.webinarEndedLabel || 'En vivo';
        countdown.classList.add('is-ended');
        if (countdown.dataset.webinarHideEnded === 'true') {
          countdown.remove();
          clearInterval(intervalId);
          return;
        }
        if (daysEl) daysEl.textContent = endedLabel;
        if (timerEl) timerEl.setAttribute('aria-label', endedLabel);
        clearInterval(intervalId);
        return;
      }

      const totalSeconds = Math.floor(remaining / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      if (daysEl) daysEl.textContent = padTime(days);
      if (hoursEl) hoursEl.textContent = padTime(hours);
      if (minutesEl) minutesEl.textContent = padTime(minutes);
      if (secondsEl) secondsEl.textContent = padTime(seconds);
      if (timerEl) {
        timerEl.setAttribute(
          'aria-label',
          `Quedan ${days} días, ${hours} horas, ${minutes} minutos y ${seconds} segundos para el webinar Solven Labs`
        );
      }
    };

    const intervalId = setInterval(updateCountdown, 1000);
    updateCountdown();
  };

  // ==========================================================================
  // INICIALIZACIÓN
  // ==========================================================================

  // ===== FAQ CHATBOT =====
  function initChatbot() {
    const messagesContainer = document.getElementById('chatbot-messages');
    const input = document.getElementById('chatbot-input');
    const sendButton = document.getElementById('chatbot-send');
    const suggestionsContainer = document.getElementById('chatbot-suggestions');
    const changeQuestionsButton = document.getElementById('chatbot-change-questions');
    const suggestionsPerPage = 4;
    let suggestionsPage = 0;
    
    if (!messagesContainer) return;
    
    // Normaliza texto: minúsculas, sin acentos, sin puntuación
    function normalize(str) {
      return str.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ').trim();
    }

    // Respuestas predefinidas: cada entrada tiene keywords[] y una respuesta
    const responses = [
      // 👋 Saludo
      { keys: ['hola', 'buenas', 'buenos dias', 'buenas tardes', 'buenas noches', 'hey', 'saludos'],
        resp: '👋 ¡Hola! Soy Solvi, asistente de Solven Labs. ¿En qué te puedo ayudar?' },

      // 🏢 Qué hacen / quiénes son
      { keys: ['que hacen', 'que ofrecen', 'que son', 'quienes son', 'a que se dedican', 'cuales son sus servicios', 'servicios'],
        resp: '🏢 Somos una EBCT apoyada por ANID. Desarrollamos soluciones con IA, vinculados al ecosistema HealthTech y a proyectos de emprendimiento. Te ayudamos desde la idea hasta poner la herramienta en uso.' },

      { keys: ['salud', 'healthtech', 'clinica', 'hospital', 'investigacion', 'investigador', 'universidad', 'academico', 'docente', 'centro de investigacion', 'laboratorio'],
        resp: '🔬 Trabajamos con equipos de salud, centros clínicos y organizaciones HealthTech. Tú conoces el contexto; nosotros desarrollamos y evaluamos la solución de IA contigo.' },

      { keys: ['idi', 'i d i', 'fondo', 'postulacion', 'proyecto financiado', 'transferencia tecnologica'],
        resp: '🧪 Te ayudamos a definir qué tecnología necesita tu proyecto y cuánto puede costar para incluirlo en tu postulación. También podemos construirla y enseñar a tu equipo a usarla.' },

      { keys: ['prototipo', 'mvp', 'poc', 'prueba de concepto', 'validacion tecnologica'],
        resp: '🧩 Sí. Creamos una primera versión para probar tu idea y ver qué funciona antes de construir la herramienta completa.' },

      // 📱 App móvil
      { keys: ['app movil', 'app', 'aplicacion movil', 'aplicacion', 'ios', 'android', 'flutter'],
        resp: '📱 Desarrollamos aplicaciones cuando el contexto y los usuarios lo requieren. Primero evaluamos si conviene una app nativa, una aplicación web o una plataforma adaptable para evitar complejidad innecesaria.' },

      // 🤖 IA
      { keys: ['inteligencia artificial', 'ia', 'machine learning', 'automatizacion inteligente', 'openai', 'gpt'],
        resp: '🤖 Usamos inteligencia artificial para analizar imágenes, audio, textos y otros datos. Primero revisamos tu tarea y probamos si los resultados son útiles para tu proyecto.' },

      // ⏱️ Tiempos
      { keys: ['cuanto tiempo', 'tiempo', 'plazo', 'cuando estaria', 'cuanto demora', 'demora'],
        resp: '⏱️ Una primera versión puede tomar semanas; una plataforma completa, varios meses. Al conocer tu proyecto, acordamos las etapas y fechas de entrega.' },

      // Paquetes y cotización
      { keys: ['precio', 'costo', 'cuanto cuesta', 'cuanto vale', 'tarifa', 'cobran', 'vale'],
        resp: 'El precio depende de lo que haya que construir y conectar. Podemos estimar el costo para tu postulación a fondos y acordar pagos por etapas.' },

      // Paquetes y diferencias
      { keys: ['diferencia paquetes', 'paquetes', 'paquete presencia digital', 'paquete impulso comercial', 'paquete operacion inteligente', 'diferencia planes', 'planes', 'plan esencial', 'plan crecimiento', 'plan negocio', 'que paquete necesito', 'que plan necesito', 'mejor paquete', 'mejor plan'],
        resp: '📊 Preparamos una propuesta según lo que necesitas y tu presupuesto. Puede ser una primera versión para probar o una herramienta lista para usar.' },

      // 🔧 Mantención / soporte
      { keys: ['no se que necesito', 'no tengo claro', 'por donde parto', 'por donde empezar', 'que me conviene', 'diagnostico'],
        resp: 'Partimos con diagnostico. Revisamos tu situacion actual y ordenamos prioridades por impacto, costo y urgencia. No necesitas llegar con una solucion definida.' },

      { keys: ['pagar por etapas', 'pago por etapas', 'cuotas', 'pagar en partes', 'por hitos'],
        resp: 'Sí. Podemos dividir el trabajo y los pagos en etapas. Acordamos qué recibirás y cuándo, según tu presupuesto y las fechas del proyecto.' },

      { keys: ['despues del lanzamiento', 'post lanzamiento', 'despues de entregar', 'despues que pasa', 'seguimiento'],
        resp: 'Despues del lanzamiento incluimos capacitacion, garantia de correcciones y opciones de mantencion mensual para mejoras, seguridad y soporte.' },

      { keys: ['pedir cambios', 'cambios durante', 'cambiar alcance', 'ajustes', 'modificaciones'],
        resp: 'Puedes pedir cambios. Si son ajustes dentro del alcance, se integran; si aparece una nueva necesidad, la cotizamos aparte antes de avanzar.' },

      { keys: ['mantencion', 'mantenimiento', 'soporte', 'actualizacion', 'plan mensual'],
        resp: 'La mantención se trabaja dentro del acompañamiento mensual de cada paquete o se cotiza según alcance. Incluye actualización, soporte, monitoreo y mejoras continuas.' },

      // 🌐 Página web
      { keys: ['pagina web', 'sitio web', 'web', 'landing', 'pagina', 'diseño web'],
        resp: 'Creamos aplicaciones web para registrar datos, organizar tareas y ver resultados. Definimos las funciones y los permisos de cada usuario contigo.' },
      // 🛒 E-commerce / tienda
      { keys: ['tienda online', 'ecommerce', 'tienda', 'vender online', 'carrito', 'shopify'],
        resp: '🛒 Nuestro foco es desarrollar soluciones con IA y software a medida. Evaluamos cada proyecto según su desafío, sus datos y su etapa de desarrollo.' },

      // 🔎 SEO / Google
      { keys: ['seo', 'google', 'posicionamiento', 'aparecer en google', 'busqueda', 'google maps', 'maps'],
        resp: '🔎 Podemos ayudar a que una plataforma sea fácil de encontrar y recorrer. Nuestro trabajo principal es crear herramientas para proyectos de IA y software para salud.' },

      // 💬 Chatbot / WhatsApp / automatización
      { keys: ['chatbot', 'bot', 'whatsapp', 'automatizacion', 'respuesta automatica', 'agendamiento automatico'],
        resp: 'La automatización puede conectar datos, notificaciones, documentos, modelos y sistemas externos. Diseñamos los flujos según las reglas del proyecto y dejamos pruebas y documentación.' },

      // 🔑 Propiedad del proyecto
      { keys: ['a mi nombre', 'dueno', 'dueño', 'propiedad', 'codigo', 'acceso', 'repositorio', 'me lo entregan'],
        resp: '🔑 El proyecto es 100% tuyo. Código, hosting, dominios y documentación. Sin dependencias.' },

      // 🔌 Integraciones
      { keys: ['integracion', 'integraciones', 'conectan nuestras herramientas', 'conectar herramientas', 'webpay', 'mercadopago', 'mercado pago', 'flow', 'api', 'erp', 'crm', 'sistema externo'],
        resp: '🔌 Conectamos tus herramientas para compartir datos. Primero revisamos los accesos, la seguridad y los posibles costos de los servicios que usas.' },

      // ☁️ Hosting / dominio
      { keys: ['hosting', 'dominio', 'servidor', 'correo corporativo', 'alojamiento', 'dejan la herramienta funcionando'],
        resp: '☁️ Nos encargamos del hosting, dominio, correos y seguridad. Todo incluido o por separado.' },

      // 👥 Equipo
      { keys: ['equipo', 'quienes trabajan', 'quien atiende', 'desarrolladores', 'tomas', 'carola', 'daniela', 'lara'],
        resp: '👥 El equipo reúne a Tomás Yévenes y a las doctoras Carola Figueroa, Daniela Mennickent y Lara Monteiro. Combinamos software, inteligencia artificial, bioquímica y salud reproductiva.' },

      // 📍 Cobertura
      { keys: ['chillan', 'ñuble', 'nuble', 'santiago', 'region', 'regiones', 'todo chile', 'presencial', 'remoto'],
        resp: '📍 Tenemos oficina central en Concepción y trabajamos con equipos de todo Chile. Podemos coordinarnos por videollamada y realizar sesiones presenciales cuando el proyecto lo requiera.' },

      // ✅ Garantía
      { keys: ['garantia', 'que pasa si falla', 'errores', 'bugs'],
        resp: '✅ 90 días de garantía para errores. Respuesta crítica en menos de 24h. Si falla, lo arreglamos sin costo.' },

      // 📆 Agendar / reunión
      { keys: ['agendar', 'agenda', 'reunion', 'cita', 'llamada', 'videollamada', 'reunirse', 'como los contacto'],
        resp: '📅 Puedes agendar una reunión gratuita de 30 min aquí: <a href="#agenda-sin-costo" data-free-booking style="color:inherit;text-decoration:underline">ver horarios disponibles</a> — La reunión puede ser por videollamada o coordinación desde nuestra oficina central en Concepción.' },

      // 📞 Contacto
      { keys: ['contacto', 'email', 'telefono', 'numero', 'escribirles', 'escribir'],
        resp: '📞 Escríbenos por WhatsApp al +56 9 7702 9753 o por email a tomas@solvenlabs.cl. Respondemos en menos de 24 horas hábiles.' },

      // 🗺️ Proceso
      { keys: ['proceso', 'como trabajan', 'etapas', 'pasos', 'como es trabajar con ustedes'],
        resp: '🗺️ Conversamos sobre tu idea, acordamos qué construir, te mostramos avances, probamos contigo y dejamos la herramienta lista para usar.' },

      // 💳 Forma de pago
      { keys: ['forma de pago', 'como pagan', 'pago', 'cuotas', 'abono', 'factura'],
        resp: '💳 3 hitos: pago al inicio, al avance y contra entrega. Transferencia bancaria. Boleta o factura.' },

      // 🧭 Rediseño / migración
      { keys: ['redisenar', 'rediseñar', 'mejorar mi web', 'migrar', 'migracion', 'sitio existente', 'ya tengo web'],
        resp: '🧭 Sí, podemos rediseñar, migrar o mejorar una web existente. Revisamos lo que ya tienes, definimos prioridades y proponemos una ruta clara.' },

      // 🖼️ Contenido
      { keys: ['contenido', 'textos', 'fotos', 'imagenes', 'copy', 'redaccion', 'logo', 'marca'],
        resp: '🖼️ Podemos trabajar con tu contenido actual o ayudarte a estructurar textos, imágenes y llamados a la acción. Si faltan fotos o marca, te sugerimos alternativas simples.' },

      // 🔐 Seguridad / respaldo
      { keys: ['seguridad', 'backup', 'respaldo', 'ssl', 'certificado', 'proteccion', 'datos'],
        resp: '🔐 Definimos quién puede acceder a los datos, preparamos copias de seguridad y revisamos el funcionamiento. Las medidas se acuerdan según tu proyecto.' },

      // 📈 Métricas
      { keys: ['metricas', 'analytics', 'estadisticas', 'visitas', 'conversiones', 'resultados'],
        resp: '📈 Creamos paneles con gráficos y cifras para consultar datos, ver cómo se usa tu herramienta y mostrar resultados.' },

      // 🎓 Capacitación
      { keys: ['capacitan', 'capacitacion', 'ensenan', 'enseñan', 'administrar', 'panel', 'editar contenido'],
        resp: '🎓 Si el proyecto incluye panel o contenido editable, te mostramos cómo usarlo y dejamos una explicación práctica para que no dependas de nosotros para cada cambio menor.' },

      // Spin-offs y proyectos emergentes
      { keys: ['spin off', 'spinoff', 'startup universitaria', 'emprendimiento universitario'],
        resp: '🏪 Trabajamos con organizaciones y emprendimientos que necesitan convertir una idea en una solución de IA o software lista para evaluar y utilizar.' },

      // ⚡ Urgente
      { keys: ['urgente', 'rapido', 'inmediato', 'lo antes posible'],
        resp: '⚡ Podemos evaluar priorizar tu proyecto según disponibilidad. Escríbenos por WhatsApp para una respuesta más rápida: +56 9 7702 9753.' },
    ];

    const suggestedQuestions = [
      '¿Ayudan a postular a fondos de investigación?',
      '¿Desarrollan prototipos funcionales?',
      '¿Cómo trabajan?',
      '¿Trabajan con IA y datos?',
      '¿Cómo agendo una reunión?',
      '¿Cómo estiman un proyecto?',
      '¿Atienden fuera de Concepción?',
      '¿Pueden mejorar una primera versión?',
      '¿Conectan nuestras herramientas y datos?',
      '¿El código queda para el proyecto?',
      '¿Dejan la herramienta funcionando?',
      '¿Documentan la solución?',
      '¿Crean paneles de resultados?',
      '¿Nos enseñan a usar la herramienta?',
      '¿Pueden comenzar durante la ejecución?',
      '¿Tienen garantía?'
    ];

    function addMessage(content, isUser = false) {
      const messageDiv = document.createElement('div');
      messageDiv.className = `chatbot__message ${isUser ? 'chatbot__message--user' : 'chatbot__message--bot'}`;
      
      const avatar = document.createElement('div');
      avatar.className = `chatbot__avatar${isUser ? '' : ' chatbot__avatar--solvi'}`;
      avatar.innerHTML = isUser
        ? `<i data-lucide="user" class="icon icon--xs"></i>`
        : `<img src="assets/Mascota%20rob%C3%B3tica%20con%20chat%20hologr%C3%A1fico.png" alt="Solvi">`;
      
      const contentDiv = document.createElement('div');
      contentDiv.className = 'chatbot__content';
      contentDiv.innerHTML = `<p>${content}</p>`;
      
      messageDiv.appendChild(avatar);
      messageDiv.appendChild(contentDiv);
      
      messagesContainer.appendChild(messageDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      
      // Reinitializar iconos de Lucide
      if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
      }
    }
    
    function getBotResponse(userInput) {
      const input = normalize(userInput);
      
      for (const entry of responses) {
        if (entry.keys.some(key => input.includes(normalize(key)))) {
          return entry.resp;
        }
      }
      
      // Respuesta por defecto
      return '🤔 No estoy seguro cómo ayudarte con eso. Escríbenos por WhatsApp al <strong>+56 9 7702 9753</strong> o <a href="#agenda-sin-costo" data-free-booking style="color:inherit;text-decoration:underline">agenda una reunión gratis</a>. ¿Algo más?';
    }
    
    function sendMessage(messageText) {
      const message = messageText ? messageText.trim() : (input ? input.value.trim() : '');
      if (!message) return;
      
      // Agregar mensaje del usuario
      addMessage(message, true);
      if (input) input.value = '';
      
      // Simular typing delay
      if (sendButton) sendButton.disabled = true;
      setTimeout(() => {
        const response = getBotResponse(message);
        addMessage(response);
        if (sendButton) sendButton.disabled = false;
      }, 1000);
    }
    
    // Event listeners
    if (sendButton) {
      sendButton.addEventListener('click', () => sendMessage());
    }
    
    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          sendMessage();
        }
      });
    }
    
    function createSuggestionButton(question) {
      const suggestion = document.createElement('button');
      suggestion.type = 'button';
      suggestion.className = 'chatbot__suggestion';
      suggestion.dataset.question = question;
      suggestion.textContent = question;
      suggestion.addEventListener('click', () => {
        const question = suggestion.dataset.question;
        sendMessage(question);
      });
      return suggestion;
    }

    function renderSuggestions() {
      if (!suggestionsContainer) return;

      const start = suggestionsPage * suggestionsPerPage;
      const questions = suggestedQuestions.slice(start, start + suggestionsPerPage);
      const visibleQuestions = questions.length ? questions : suggestedQuestions.slice(0, suggestionsPerPage);

      suggestionsContainer.querySelectorAll('.chatbot__suggestion').forEach(suggestion => {
        suggestion.remove();
      });

      visibleQuestions.forEach(question => {
        suggestionsContainer.insertBefore(createSuggestionButton(question), changeQuestionsButton);
      });

      if (changeQuestionsButton && typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
      }
    }

    if (changeQuestionsButton) {
      changeQuestionsButton.addEventListener('click', () => {
        suggestionsPage = (suggestionsPage + 1) % Math.ceil(suggestedQuestions.length / suggestionsPerPage);
        renderSuggestions();
      });
    }

    renderSuggestions();
  }

  function initSolviFloat() {
    const container = document.querySelector('[data-solvi-float]');
    if (!container) return;

    const trigger = container.querySelector('[data-solvi-trigger]');
    const panel = container.querySelector('.solvi-float__panel');
    const closeButton = container.querySelector('[data-solvi-close]');
    const chatLink = container.querySelector('[data-solvi-chat]');
    const prompt = container.querySelector('[data-solvi-prompt]');
    const promptText = container.querySelector('[data-solvi-prompt-text]');
    if (!trigger || !panel) return;

    const promptMessages = [
      '¿Necesitas ayuda?',
      'También estamos en WhatsApp.',
      'Puedo ayudarte con tu proyecto.',
      '¿Necesitan construir un prototipo?',
      'Pregúntame cómo podemos ayudarte.',
      '¿Tu equipo necesita una solución con IA?',
      'Te ayudo a estimar tu proyecto.',
      'Conversemos sobre Inteligencia artificial aplicada.',
      '¿Qué metodología necesitan digitalizar?',
      'Puedo orientarte sobre alcance y etapas.',
      '¿Trabajan con datos o IA?',
      'Te ayudo a elegir por dónde empezar.',
      '¿El proyecto está en formulación?',
      'Puedes hablar con una persona por WhatsApp.',
      'Cuéntame qué necesitan materializar.'
    ];
    let promptIndex = 0;

    const setOpen = (isOpen) => {
      panel.hidden = !isOpen;
      trigger.setAttribute('aria-expanded', String(isOpen));
      if (prompt && isOpen) prompt.hidden = true;
    };

    trigger.addEventListener('click', () => {
      setOpen(panel.hidden);
    });

    if (prompt) {
      prompt.addEventListener('click', () => {
        setOpen(true);
      });
    }

    if (closeButton) {
      closeButton.addEventListener('click', () => {
        setOpen(false);
        trigger.focus();
      });
    }

    if (chatLink) {
      chatLink.addEventListener('click', (event) => {
        event.preventDefault();
        setOpen(false);
        navigateTo(sectionToPath('faq'));

        const chatbot = document.querySelector('.faq__chatbot');
        if (chatbot) {
          chatbot.setAttribute('tabindex', '-1');
          setTimeout(() => chatbot.focus({ preventScroll: true }), 500);
        }
      });
    }

    document.addEventListener('pointerdown', (event) => {
      if (!panel.hidden && !container.contains(event.target)) {
        setOpen(false);
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !panel.hidden) {
        setOpen(false);
        trigger.focus();
      }
    });

    const rotatePrompt = () => {
      if (prompt && promptText && panel.hidden) {
        promptText.textContent = promptMessages[promptIndex];
        promptIndex = (promptIndex + 1) % promptMessages.length;
        prompt.hidden = false;
      }

      window.setTimeout(() => {
        if (prompt) prompt.hidden = true;
        window.setTimeout(rotatePrompt, 15000);
      }, 15000);
    };

    setOpen(false);
    window.setTimeout(rotatePrompt, 15000);
  }

  const initProjectStatusLookups = () => {
    document.querySelectorAll('[data-project-status-lookup]').forEach((lookup) => {
      if (lookup.dataset.bound === 'true') return;
      lookup.dataset.bound = 'true';

      lookup.querySelector('[data-project-code-submit]')?.addEventListener('click', () => consultarProyecto(lookup));
      lookup.querySelector('[data-project-code-input]')?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') consultarProyecto(lookup);
      });
    });
  };

  const initHeroRotator = () => {
    const rotator = document.querySelector('[data-hero-rotator]');
    const text = rotator?.querySelector('[data-hero-rotator-text]');
    if (!rotator || !text) return;

    const phrases = (rotator.dataset.phrases || '')
      .split('|')
      .map(phrase => phrase.trim())
      .filter(Boolean);

    if (phrases.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let index = 0;

    window.setInterval(() => {
      index = (index + 1) % phrases.length;
      rotator.classList.add('is-changing');

      window.setTimeout(() => {
        text.textContent = phrases[index];
        rotator.classList.remove('is-changing');
      }, 260);
    }, 2300);
  };

  const initProjectCtaRotator = () => {
    const ctas = [...document.querySelectorAll('[data-project-cta]')];
    if (!ctas.length) return;
    const texts = ctas.map(cta => cta.querySelector('[data-project-cta-text]')).filter(Boolean);
    if (!texts.length) return;

    const labels = (ctas[0].dataset.labels || '')
      .split('|')
      .map(label => label.trim())
      .filter(Boolean);

    if (labels.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      texts.forEach(text => { text.textContent = 'Estado y facturación'; });
      return;
    }

    let index = 0;
    window.setInterval(() => {
      index = (index + 1) % labels.length;
      ctas.forEach(cta => cta.classList.add('is-changing'));
      window.setTimeout(() => {
        texts.forEach(text => { text.textContent = labels[index]; });
        ctas.forEach(cta => cta.classList.remove('is-changing'));
      }, 220);
    }, 3200);
  };

  const initHomeSectionLayout = () => {
    // Estas secciones se retiraron del recorrido principal para mantener la home enfocada.
    ['agenda', 'comparador'].forEach(id => document.getElementById(id)?.remove());
    document.querySelector('.webinar-countdown')?.remove();
    document.querySelectorAll('.project-status-lookup').forEach(lookup => {
      if (!lookup.closest('#proceso')) lookup.remove();
    });

    // Proceso + garantías: el respaldo forma parte del recorrido, no es otra sección apilada.
    const processContainer = document.querySelector('#proceso > .container');
    const guaranteesSection = document.getElementById('garantias');
    const guaranteesContainer = guaranteesSection?.querySelector(':scope > .container');
    if (processContainer && guaranteesSection && guaranteesContainer) {
      const processLookup = processContainer.querySelector('.project-status-lookup');
      const duplicateLookup = guaranteesContainer.querySelector('.project-status-lookup');
      duplicateLookup?.remove();
      processLookup?.remove();

      const timeline = processContainer.querySelector('.process__timeline');
      const guaranteesMeta = guaranteesContainer.querySelector('.guarantees__meta');
      const integratedLayout = document.createElement('div');
      const assurancePanel = document.createElement('aside');

      integratedLayout.className = 'process-trust-layout';
      assurancePanel.className = 'process-assurance reveal';
      assurancePanel.setAttribute('aria-label', 'Respaldo incluido en nuestro proceso');
      assurancePanel.innerHTML = `
        <span class="process-assurance__eyebrow">
          <i data-lucide="shield-check" class="icon icon--sm"></i>
          Respaldo incluido
        </span>
        <h3>Avanzas con tranquilidad</h3>
        <p>Cada etapa incluye acuerdos claros, propiedad sobre lo construido y apoyo cuando tu solución ya está funcionando.</p>
      `;

      if (timeline) integratedLayout.appendChild(timeline);
      if (guaranteesMeta) assurancePanel.appendChild(guaranteesMeta);
      integratedLayout.appendChild(assurancePanel);
      processContainer.appendChild(integratedLayout);
      if (processLookup) processContainer.appendChild(processLookup);
      guaranteesSection.remove();
    }

    // La tecnología respalda la propuesta, pero aparece después de las decisiones comerciales.
    const technologiesSection = document.getElementById('tecnologias');
    const faqSection = document.getElementById('faq');
    if (technologiesSection && faqSection) faqSection.before(technologiesSection);

    // Recorrido comercial: oferta, evidencia, forma de trabajo, equipo y herramientas de decisión.
    const homeMain = document.querySelector('main');
    const contactSection = document.getElementById('contacto');
    const preferredSectionOrder = [
      'servicios',
      'casos',
      'testimonios',
      'proceso',
      'equipo',
      'simulador',
      'tecnologias',
      'faq'
    ];
    if (homeMain && contactSection) {
      preferredSectionOrder.forEach(id => {
        const section = document.getElementById(id);
        if (section) homeMain.insertBefore(section, contactSection);
      });
    }
  };

  const init = () => {
    initHomeSectionLayout();
    // Core features

    initTeamNetworkCanvas();
    initConversionTracking();
    initAuditWidget();
    initHeroRotator();
    initProjectCtaRotator();
    initNavbar();
    prepareHomeRevealElements();
    initScrollReveal();
    
    // Interactive components
    initPortfolioFilters();
    initPortfolioCarousel();
    initModals();
    initTestimonialsCarousel();
    initFAQ();
    initContactForm();
    initNewsletter();
    initFreeConsultationBooking();
    initVisitCheckout();
    initServiceModals();
    initCaseModals();
    initTeamModals();
    initCarousel('.logos__track');
    initCarousel('.tech-track');
    initCarousel('.tech-track--reverse', 'rtl');
    initCounters();
    initChatbot();
    initSolviFloat();
    initTools();
    initEditableSiteContent();
    initProjectStatusLookups();

    // Manejo de ruta inicial (incluye alias antiguos como /nosotros y /servicios-puntuales).
    (function handleInitialRoute() {
      const initialPath = window.location.pathname;
      const hash = location.hash ? location.hash.slice(1) : '';
      publicRoutingReady = true;
      // Convertir enlaces antiguos con hash a su slug canónico.
      if (hash && document.getElementById(hash)) {
        navigateTo(sectionToPath(hash), { replace: true, smooth: false });
        return;
      }

      const sectionFromPath = pathToSection(initialPath);
      if (sectionFromPath) {
        navigateTo(initialPath, { replace: true, smooth: false });
        return;
      }

      navigateTo(initialPath, { replace: true, smooth: false });
    })();
    
    console.log('🚀 Solven Labs - Landing page inicializada');
  };

  // ==========================================================================
  // HERRAMIENTAS INTERACTIVAS
  // ==========================================================================

  const initTools = () => {
    initCalculator();
    initConfigurator();
  };

  // ==========================================================================
  // CALCULADORA DE PRECIOS
  // ==========================================================================

  const initCalculator = () => {
    const calculator = $('.calculator');
    if (!calculator) return;

    // Base prices for each project type
    const basePrices = {
      'web': 149990,
      'app': 349990,
      'platform': 299990,
      'ai': 169990
    };

    // Complexity multipliers
    const complexityMultipliers = {
      1: 1,      // Básico
      2: 1.3,    // Intermedio  
      3: 1.7,    // Avanzado
      4: 2.2     // A medida
    };

    // Urgency multipliers
    const urgencyMultipliers = {
      'standard': 1,
      'fast': 1.3,
      'express': 1.5
    };

    // Timeline estimates
    const timelines = {
      'web': { standard: '6-8 semanas', fast: '4-6 semanas', express: '2-4 semanas' },
      'app': { standard: '8-12 semanas', fast: '6-10 semanas', express: '4-8 semanas' },
      'platform': { standard: '10-16 semanas', fast: '8-12 semanas', express: '6-10 semanas' },
      'ai': { standard: '8-16 semanas', fast: '6-12 semanas', express: '4-10 semanas' }
    };

    const complexityLabels = {
      1: 'Básico',
      2: 'Intermedio',
      3: 'Avanzado', 
      4: 'A medida'
    };

    let currentConfig = {
      projectType: null,
      complexity: 2,
      features: [],
      urgency: 'standard'
    };

    // DOM Elements
    const projectTypeRadios = $$('input[name="project-type"]');
    const complexitySlider = $('#complexity');
    const complexityValue = $('#complexity-value');
    const featureCheckboxes = $$('input[name="features"]');
    const urgencyRadios = $$('input[name="urgency"]');
    const basePriceEl = $('#base-price');
    const complexityPriceEl = $('#complexity-price');
    const featuresPriceEl = $('#features-price');
    const urgencyPriceEl = $('#urgency-price');
    const totalPriceEl = $('#total-price');
    const estimatedTimeEl = $('#estimated-time');
    const quoteButton = $('#quote-button');
    const resetButton = $('#reset-calculator');

    // Event Listeners
    projectTypeRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        if (radio.checked) {
          currentConfig.projectType = radio.value;
          updateCalculation();
        }
      });
    });

    if (complexitySlider) {
      complexitySlider.addEventListener('input', (e) => {
        currentConfig.complexity = parseInt(e.target.value);
        if (complexityValue) {
          complexityValue.textContent = complexityLabels[currentConfig.complexity];
        }
        updateCalculation();
      });
    }

    featureCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          currentConfig.features.push({
            value: checkbox.value,
            price: parseInt(checkbox.dataset.price)
          });
        } else {
          currentConfig.features = currentConfig.features.filter(
            feature => feature.value !== checkbox.value
          );
        }
        updateCalculation();
      });
    });

    urgencyRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        if (radio.checked) {
          currentConfig.urgency = radio.value;
          updateCalculation();
        }
      });
    });

    if (resetButton) {
      resetButton.addEventListener('click', () => {
        resetCalculator();
      });
    }

    if (quoteButton) {
      quoteButton.addEventListener('click', () => {
        sendQuoteRequest();
      });
    }

    function updateCalculation() {
      if (!currentConfig.projectType) {
        resetDisplay();
        return;
      }

      const basePrice = basePrices[currentConfig.projectType] || 0;
      const complexityMultiplier = complexityMultipliers[currentConfig.complexity] || 1;
      const urgencyMultiplier = urgencyMultipliers[currentConfig.urgency] || 1;

      // Calculate internal scope weight
      const basePriceWithComplexity = basePrice * complexityMultiplier;
      const featuresPrice = currentConfig.features.reduce((sum, feature) => sum + feature.price, 0);
      const subtotal = basePriceWithComplexity + featuresPrice;
      const urgencyIncrease = subtotal * (urgencyMultiplier - 1);
      const totalPrice = subtotal * urgencyMultiplier;

      // Update display without exposing prices outside the plan cards.
      if (basePriceEl) basePriceEl.textContent = 'Lo definimos contigo';
      if (complexityPriceEl) complexityPriceEl.textContent = 'Según alcance';
      if (featuresPriceEl) featuresPriceEl.textContent = 'Según módulos';
      if (urgencyPriceEl) urgencyPriceEl.textContent = 'Según prioridad';
      if (totalPriceEl) totalPriceEl.textContent = 'Lo definimos contigo';

      // Update timeline
      const timelineData = timelines[currentConfig.projectType];
      if (timelineData && estimatedTimeEl) {
        estimatedTimeEl.textContent = timelineData[currentConfig.urgency] || 'A definir';
      }

      // Enable quote button
      if (quoteButton) {
        quoteButton.disabled = false;
      }
    }

    function resetDisplay() {
      if (basePriceEl) basePriceEl.textContent = 'Lo definimos contigo';
      if (complexityPriceEl) complexityPriceEl.textContent = '-';
      if (featuresPriceEl) featuresPriceEl.textContent = '-';
      if (urgencyPriceEl) urgencyPriceEl.textContent = '-';
      if (totalPriceEl) totalPriceEl.textContent = 'Lo definimos contigo';
      if (estimatedTimeEl) estimatedTimeEl.textContent = '-';
      if (quoteButton) quoteButton.disabled = true;
    }

    function resetCalculator() {
      // Reset form
      projectTypeRadios.forEach(radio => radio.checked = false);
      featureCheckboxes.forEach(checkbox => checkbox.checked = false);
      urgencyRadios.forEach(radio => radio.checked = false);
      
      // Reset standard urgency
      const standardRadio = $('input[name="urgency"][value="standard"]');
      if (standardRadio) standardRadio.checked = true;
      
      // Reset complexity slider
      if (complexitySlider) {
        complexitySlider.value = 2;
        if (complexityValue) complexityValue.textContent = 'Intermedio';
      }

      // Reset config
      currentConfig = {
        projectType: null,
        complexity: 2,
        features: [],
        urgency: 'standard'
      };

      resetDisplay();
    }

    function sendQuoteRequest() {
      const projectTypes = {
        'web': 'Desarrollo Web',
        'app': 'App Móvil',
        'platform': 'Plataforma',
        'ai': 'IA & Automatización'
      };

      const message = `🧮 *Cotización desde Calculadora*

📱 *Tipo:* ${projectTypes[currentConfig.projectType]}
⚙️ *Complejidad:* ${complexityLabels[currentConfig.complexity]}
✨ *Funcionalidades:* ${currentConfig.features.length > 0 ? currentConfig.features.map(f => f.value).join(', ') : 'Ninguna'}
⏰ *Urgencia:* ${currentConfig.urgency}
*Cotización:* Según alcance y módulos requeridos
📅 *Tiempo estimado:* ${estimatedTimeEl ? estimatedTimeEl.textContent : 'N/A'}

¡Hola! Me interesa recibir una propuesta detallada para este proyecto.`;

      const whatsappUrl = `https://wa.me/56977029753?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }

    // Initialize
    resetDisplay();
    if (complexityValue) {
      complexityValue.textContent = complexityLabels[currentConfig.complexity];
    }
  };

  // ==========================================================================
  // CONFIGURADOR DE PROYECTOS
  // ==========================================================================

  const initConfigurator = () => {
    window.NtekAdvisor?.init(document.querySelector('[data-project-advisor]'));
  };

  // Ejecutar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

// Consulta de estado de proyecto desde bloques de seguimiento
function consultarProyecto(source) {
  const lookup = source?.closest?.('[data-project-status-lookup]') || source;
  const input = lookup?.querySelector?.('[data-project-code-input]')
    || document.querySelector('[data-project-code-input]');
  const codigo = input ? input.value.trim() : '';
  if (!codigo) {
    if (!input) return;
    input.classList.add('project-status-lookup__input--error');
    input.placeholder = 'Ingresa un código válido';
    setTimeout(() => {
      input.classList.remove('project-status-lookup__input--error');
      input.placeholder = 'Ej: a3f8bc12';
    }, 2000);
    return;
  }
  const token = encodeURIComponent(codigo.toUpperCase());
  window.location.href = `/proyecto?token=${token}`;
}
