import { INTAKE_SECTIONS, INTAKE_TABLES, formatIntakeDate } from './requirement-intake-model.js?v=2';

// Vector text, measured wrapping and page breaks keep long answers selectable
// and readable; no screenshot of the dashboard is embedded in the document.
export function buildIntakePDF(data, { jsPDF, logoDataURL, company = {} }) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const left = 19, width = 172, bottom = 273, lineHeight = 4.8;
  const blue = [0, 87, 230], ink = [10, 26, 46], muted = [82, 100, 122];
  let y = 0;
  const font = (style = 'normal', size = 10, color = ink) => { pdf.setFont('helvetica', style); pdf.setFontSize(size); pdf.setTextColor(...color); };
  const lines = (text, w = width) => pdf.splitTextToSize(String(text || 'Por definir').replace(/\t/g, '    '), w);
  function page() {
    pdf.setFillColor(...blue); pdf.rect(0, 0, 210, 3, 'F');
    if (logoDataURL) {
      const image = pdf.getImageProperties(logoDataURL);
      const w = Math.min(43, 16 * image.width / image.height);
      pdf.addImage(logoDataURL, 'PNG', left, 10, w, w * image.height / image.width);
    } else { font('bold', 24, blue); pdf.text('Solven Labs', left, 23); }
    font('bold', 9, blue); pdf.text('LEVANTAMIENTO DE REQUERIMIENTOS', 191, 16, { align: 'right' });
    font('normal', 8, muted); pdf.text(lines(`Versión ${data.version}  |  ${data.status}`, 130), 191, 22, { align: 'right' });
    pdf.setDrawColor(214, 226, 244); pdf.line(left, 31, 191, 31);
    y = 40;
  }
  function ensure(height) { if (y + height > bottom) { pdf.addPage(); page(); } }
  function paragraph(text, { style = 'normal', size = 10, color = ink, gap = 4 } = {}) {
    font(style, size, color);
    const wrapped = lines(text);
    const step = Math.max(lineHeight, size * 0.44);
    for (const line of wrapped) { ensure(step); font(style, size, color); pdf.text(line, left, y); y += step; }
    y += gap;
  }
  function heading(title) {
    ensure(24);
    pdf.setFillColor(235, 244, 255); pdf.roundedRect(left, y - 4, width, 10, 1.5, 1.5, 'F');
    font('bold', 11, blue); pdf.text(title, left + 3, y + 2); y += 14;
  }
  function field(label, value) {
    ensure(17); paragraph(label, { style: 'bold', size: 9, gap: 1 }); paragraph(value);
  }
  function table(key) {
    const definition = INTAKE_TABLES[key];
    ensure(28); paragraph(definition.title, { style: 'bold', size: 10 });
    const widths = key === 'pending' ? [12, 108, 52] : [12, 40, 94, 26];
    const labels = ['N.º', ...definition.columns.map(([, label]) => label)];
    function tableHeader() {
      ensure(16); pdf.setFillColor(235, 244, 255); pdf.rect(left, y - 4, width, 12, 'F');
      font('bold', 8, blue);
      let x = left;
      labels.forEach((label, index) => { pdf.text(lines(label, widths[index] - 4), x + 2, y); x += widths[index]; });
      y += 13;
    }
    tableHeader();
    const rows = (data[key] || []).filter(row => definition.columns.some(([column]) => row[column]?.trim()));
    if (!rows.length) rows.push(Object.fromEntries(definition.columns.map(([column]) => [column, 'Por definir'])));
    rows.forEach((row, index) => {
      font('normal', 9);
      const cells = [String(index + 1), ...definition.columns.map(([column]) => row[column] || 'Por definir')].map((text, i) => lines(text, widths[i] - 4));
      const count = Math.max(...cells.map(cell => cell.length));
      for (let line = 0; line < count; line++) {
        if (y + lineHeight > bottom) { pdf.addPage(); page(); tableHeader(); }
        font('normal', 9);
        let x = left;
        cells.forEach((cell, i) => { if (cell[line]) pdf.text(cell[line], x + 2, y); x += widths[i]; });
        y += lineHeight;
      }
      pdf.setDrawColor(214, 226, 244); pdf.line(left, y - 2, left + width, y - 2); y += 4;
    });
    y += 3;
    if (definition.note) paragraph(definition.note, { size: 9, color: muted });
  }
  page();
  paragraph('Ficha de Levantamiento de Requerimientos', { style: 'bold', size: 18, gap: 7 });
  for (const [index, section] of INTAKE_SECTIONS.entries()) {
    heading(`${index + 1}. ${section.title}`);
    for (const [key, label, type] of section.fields) field(label, type === 'date' ? formatIntakeDate(data[key]) : data[key]);
    for (const key of (section.tables || [section.table]).filter(Boolean)) table(key);
    for (const [key, label, type] of section.afterFields || []) field(label, type === 'date' ? formatIntakeDate(data[key]) : data[key]);
  }
  ensure(16); paragraph('Fin de la ficha de levantamiento.', { size: 9, color: muted });
  const pages = pdf.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    pdf.setPage(p); pdf.setDrawColor(214, 226, 244); pdf.line(left, 282, 191, 282);
    font('normal', 8, muted);
    pdf.text(`${company.website || 'www.solvenlabs.cl'}  |  ${company.email || 'tomas@solvenlabs.cl'}`, left, 288);
    pdf.text(`Página ${p} de ${pages}`, 191, 288, { align: 'right' });
  }
  pdf.setProperties({ title: `Ficha de levantamiento - ${data.project_name}`, subject: `Cliente: ${data.client_name}`, author: 'Solven Labs', creator: 'Solven Labs Panel de Gestión' });
  return pdf;
}
