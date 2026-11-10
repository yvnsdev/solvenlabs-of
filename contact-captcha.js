(() => {
  'use strict';

  const form = document.getElementById('contact-form');
  const container = form?.querySelector('.cf-turnstile');
  if (!container) return;
  const status = form.querySelector('.form__turnstile-error');
  const retry = form.querySelector('[data-captcha-retry]');
  let widgetId = null;
  let loading = null;
  let token = '';

  const report = (message, canRetry = false) => {
    status.textContent = message;
    retry.hidden = !canRetry;
  };

  const loadApi = () => {
    if (window.turnstile) return Promise.resolve();
    if (loading) return loading;
    loading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const timeout = setTimeout(() => finish(new Error('timeout')), 15000);
      const finish = error => {
        clearTimeout(timeout);
        script.onload = script.onerror = null;
        if (error) {
          script.remove();
          reject(error);
        } else resolve();
      };
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.onload = () => finish(window.turnstile ? null : new Error('unavailable'));
      script.onerror = () => finish(new Error('network'));
      document.head.appendChild(script);
    }).catch(error => {
      loading = null;
      throw error;
    });
    return loading;
  };

  const reset = () => {
    token = '';
    if (widgetId === null) return;
    try {
      window.turnstile.reset(widgetId);
    } catch {
      report('No pudimos renovar la verificación. Reintenta para continuar.', true);
    }
  };

  const start = async () => {
    report('Cargando verificación de seguridad…');
    try {
      await loadApi();
      if (widgetId !== null) {
        reset();
        return;
      }
      widgetId = window.turnstile.render(container, {
        sitekey: container.dataset.sitekey,
        theme: 'light',
        language: 'es',
        size: 'flexible',
        callback: value => {
          token = value;
          report('');
        },
        'error-callback': () => {
          token = '';
          report('No se pudo completar la verificación. Revisa tu conexión y reintenta.', true);
        },
        'expired-callback': () => {
          report('La verificación venció. Verificando nuevamente…');
          reset();
        },
        'timeout-callback': () => {
          token = '';
          report('La verificación agotó el tiempo. Reintenta para continuar.', true);
        }
      });
    } catch {
      report('No pudimos cargar la verificación. Revisa tu conexión o los bloqueadores del navegador y reintenta.', true);
    }
  };

  window.contactCaptcha = {
    isVerified: () => Boolean(token),
    reset,
    requireVerification: () => {
      if (!status.textContent) report('Completa la verificación de seguridad antes de enviar.', true);
      container.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };
  retry.addEventListener('click', start);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      start();
    });
    observer.observe(container);
  } else start();
})();
