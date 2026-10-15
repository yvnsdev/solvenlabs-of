/* Indicadores independientes de las animaciones y la inicialización de app.js. */
(() => {
  'use strict';
  const initialize = () => {
    const container = document.querySelector('[data-site-kpis]');
    if (!container) return;
    const status = document.querySelector('[data-site-kpi-status]');
    const endpoint = 'https://oxyhuxnkhogmuholomis.supabase.co/rest/v1/rpc/get_public_site_kpis';
    const apiKey = 'sb_publishable_Hc5VQX3uTZ_K9BiQ9kf0rA_ri3wYpjS';
    let pending = false;

    const refresh = async () => {
      if (pending) return;
      pending = true;
      container.setAttribute('aria-busy', 'true');
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { apikey: apiKey, 'Content-Type': 'application/json' },
          body: '{}',
          cache: 'no-store',
          signal: controller.signal
        });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const payload = await response.json();
        const metrics = Array.isArray(payload) ? payload[0] : payload;
        const year = Number(new Intl.DateTimeFormat('en', {
          year: 'numeric', timeZone: 'America/Santiago'
        }).format(new Date()));
        const keys = ['founded_year', 'specialists', 'organizations', 'completed_projects'];
        if (!metrics || keys.some(key =>
          !Number.isSafeInteger(metrics[key]) || metrics[key] < 0
        ) || metrics.founded_year < 1900 || metrics.founded_year > year) {
          throw new Error('Respuesta de indicadores inválida');
        }
        const values = {
          years_active: year - metrics.founded_year,
          specialists: metrics.specialists,
          organizations: metrics.organizations,
          completed_projects: metrics.completed_projects
        };
        Object.entries(values).forEach(([key, value]) => {
          const element = container.querySelector('[data-site-kpi="' + key + '"]');
          if (element) element.textContent = new Intl.NumberFormat('es-CL').format(value);
        });
        if (status) status.textContent = 'Indicadores actualizados desde los registros de Solven Labs.';
      } catch (error) {
        container.querySelectorAll('[data-site-kpi]').forEach(element => {
          element.textContent = '—';
        });
        if (status) status.textContent = 'No pudimos actualizar los indicadores. Reintentaremos automáticamente.';
        console.warn('KPI públicos:', error.message);
      } finally {
        clearTimeout(timeout);
        pending = false;
        container.setAttribute('aria-busy', 'false');
      }
    };
    refresh();
    window.setInterval(() => {
      if (!document.hidden) refresh();
    }, 60000);
    window.addEventListener('online', refresh);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) refresh();
    });
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
