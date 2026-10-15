const PDF_SCRIPT_ID = 'jspdf-runtime';
const PDF_SCRIPT_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
const PDF_SCRIPT_INTEGRITY = 'sha384-JcnsjUPPylna1s1fvi1u12X5qjY5OL56iySh75FdtrwhO/SWXgMjoVqcKyIIWOLk';
const COMPANY = Object.freeze({
  name: 'Servicios Informaticos Yevenes & CIA LTDA', rut: '78.352.809-6',
  giro: 'Actividades de consultoria informatica y de gestion de instalaciones informatica',
  address: 'Colo-Colo 379 Of. 706, Concepción, Chile', city: 'Concepción', region: 'Región del Biobío',
  phone: '+56 9 7702 9753', email: 'tomas@solvenlabs.cl', website: 'www.solvenlabs.cl'
});
let runtimePromise = null;
const logoCache = new Map();

export function getCompanyInfo() { return { ...COMPANY }; }

export function loadPdfRuntime() {
  if (window.jspdf?.jsPDF) return Promise.resolve(window.jspdf);
  if (runtimePromise) return runtimePromise;
  runtimePromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = PDF_SCRIPT_ID;
    script.src = PDF_SCRIPT_URL;
    script.integrity = PDF_SCRIPT_INTEGRITY;
    script.crossOrigin = 'anonymous';
    script.referrerPolicy = 'no-referrer';
    const fail = () => { clearTimeout(timeout); script.remove(); reject(new Error('No se pudo cargar la biblioteca PDF.')); };
    const timeout = setTimeout(fail, 20000);
    script.addEventListener('load', () => {
      if (!window.jspdf?.jsPDF) { fail(); return; }
      clearTimeout(timeout); resolve(window.jspdf);
    }, { once: true });
    script.addEventListener('error', fail, { once: true });
    document.head.appendChild(script);
  }).catch(error => { runtimePromise = null; throw error; });
  return runtimePromise;
}

function loadImageDataURL(url) {
  if (!logoCache.has(url)) {
    const promise = fetch(url).then(response => {
      if (!response.ok) throw new Error('No se pudo cargar el logo Solven Labs.');
      return response.blob();
    }).then(blob => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    })).catch(error => { logoCache.delete(url); throw error; });
    logoCache.set(url, promise);
  }
  return logoCache.get(url);
}

export function loadLogoDataURL() {
  // Commercial documents already use the compact mark; preserve their layout.
  return loadImageDataURL('/assets/favicon%20chopped.png').catch(() => null);
}

export async function getIntakePdfAssets() {
  const [runtime, logoDataURL] = await Promise.all([loadPdfRuntime(), loadImageDataURL('/assets/logo%20extended%20chopped.png')]);
  return { jsPDF: runtime.jsPDF, logoDataURL, company: getCompanyInfo() };
}
