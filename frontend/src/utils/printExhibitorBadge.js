/* ─────────────────────────────────────────────────────────────────
   printExhibitorBadge.js  –  Exhibitor badge printer
   Supports:
     • Local exhibitors: prints company name only
     • International exhibitors: prints company name + employee name below
     • Bulk print: accepts array, opens one iframe per badge (queued)
     • Auto-scaling: font size adapts so text doesn't overflow
     • Configurable layout from Settings exhibitor config
──────────────────────────────────────────────────────────────── */

/** Resolve exhibitor sub-layout from the saved badge_layout object based on type. */
const resolveExhibitorLayout = (rawLayout, type) => {
  const defaultsLocal = {
    pageWidth: 10.5, pageHeight: 14.8,
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    fontSize: 28,
    company_ar: { y: 4.5, x: '', show: true },
    company_en: { y: 6.5, x: '', show: true },
    barcode: { y: 11.5, x: '', show: true, widthFactor: 1.8, height: 50 },
    qrCode: { y: 15.5, x: '', show: false, size: 30, template: '{id}' }
  };

  const defaultsIntl = {
    pageWidth: 10.5, pageHeight: 14.8,
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    fontSize: 28,
    company_en: { y: 5.5, x: '', show: true },
    employee: { y: 8.5, x: '', show: true },
    barcode: { y: 11.5, x: '', show: true, widthFactor: 1.8, height: 50 },
    qrCode: { y: 15.5, x: '', show: false, size: 30, template: '{id}' }
  };

  if (!rawLayout) return type === 'international' ? defaultsIntl : defaultsLocal;

  if (type === 'international') {
    const layout = rawLayout.exhibitorIntl || rawLayout.exhibitor || {};
    return {
      ...defaultsIntl, ...layout,
      margins: { ...defaultsIntl.margins, ...(layout.margins || {}) },
      company_en: { ...defaultsIntl.company_en, ...(layout.company_en || layout.company || {}) },
      employee: { ...defaultsIntl.employee, ...(layout.employee || layout.name || {}) },
      barcode: { ...defaultsIntl.barcode, ...(layout.barcode || {}) },
      qrCode: { ...defaultsIntl.qrCode, ...(layout.qrCode || {}) },
    };
  } else {
    const layout = rawLayout.exhibitorLocal || rawLayout.exhibitor || {};
    return {
      ...defaultsLocal, ...layout,
      margins: { ...defaultsLocal.margins, ...(layout.margins || {}) },
      company_ar: { ...defaultsLocal.company_ar, ...(layout.company_ar || layout.company || {}) },
      company_en: { ...defaultsLocal.company_en, ...(layout.company_en || layout.company || {}) },
      barcode: { ...defaultsLocal.barcode, ...(layout.barcode || {}) },
      qrCode: { ...defaultsLocal.qrCode, ...(layout.qrCode || {}) },
    };
  }
};

/** Helper: position style string (kept for barcode/qrcode if needed) */
const getStyleX = (val, L) => {
  const margins = L.margins || { left: 0, right: 0 };
  if (!val || val.toString().toLowerCase() === 'auto' || isNaN(parseFloat(val))) {
    const printableW = Number(L.pageWidth) - Number(margins.left || 0) - Number(margins.right || 0);
    return `width: ${printableW}cm; left: ${margins.left || 0}cm; text-align: center;`;
  }
  return `left: ${val}cm; width: fit-content; text-align: left;`;
};

/**
 * Calculate auto-scaled font size that prevents text overflow.
 * @param {string} text        The text to render
 * @param {number} printableW  Printable width in cm
 * @param {number} maxFontPt   Max font size in pt
 */
const autoFontSize = (text, printableW, maxFontPt, minFontPt = 22) => {
  if (!text || text.length === 0) return maxFontPt;
  // If text is long, we'll allow it to wrap to 2 lines.
  // So we calculate font size as if we have double the width.
  const effectiveW = text.length > 20 ? printableW * 1.8 : printableW;
  const avgCharWidthPt = 0.5; 
  const maxFontForText = effectiveW / (text.length * avgCharWidthPt * 0.0353);
  return Math.max(minFontPt, Math.min(maxFontPt, Math.floor(maxFontForText)));
};

/**
 * Generate HTML string for a single exhibitor badge.
 */
const generateExhibitorBadgeHtml = (exhibitor, empName, rawLayout) => {
  const L = resolveExhibitorLayout(rawLayout, exhibitor.type);
  const margins     = L.margins || { top: 0, bottom: 0, left: 0, right: 0 };
  const printableW  = Number(L.pageWidth) - Number(margins.left || 0) - Number(margins.right || 0);
  const printableH  = Number(L.pageHeight) - Number(margins.top || 0) - Number(margins.bottom || 0);
  const baseFontPt  = Number(L.fontSize) || 28;

  const companyAr = exhibitor.company_name_ar || '';
  const companyEn = exhibitor.company_name_en || '';

  let htmlBody  = '';
  
  // Create a printable text area container
  let textHtml = '';

  if (exhibitor.type === 'international') {
    const companyFontSize = autoFontSize(companyEn, printableW, baseFontPt, 18);
    if (L.company_en?.show && companyEn) {
      textHtml += `<div class="company-name" style="font-size: ${companyFontSize}pt;">${companyEn}</div>`;
    }
    if (empName && L.employee?.show) {
      const nameFontSize = autoFontSize(empName, printableW, Math.floor(baseFontPt * 0.75), 14);
      textHtml += `<div class="emp-name" style="font-size: ${nameFontSize}pt;">${empName}</div>`;
    }
  } else {
    let sharedFontSize = baseFontPt;
    if (L.company_ar?.show && companyAr && L.company_en?.show && companyEn) {
      const arSize = autoFontSize(companyAr, printableW, baseFontPt, 22);
      const enSize = autoFontSize(companyEn, printableW, baseFontPt, 22);
      sharedFontSize = Math.min(arSize, enSize);
    }

    if (L.company_ar?.show && companyAr) {
      const arFontSize = (L.company_en?.show && companyEn) ? sharedFontSize : autoFontSize(companyAr, printableW, baseFontPt, 18);
      textHtml += `<div class="company-name" style="font-size: ${arFontSize}pt;" dir="rtl">${companyAr}</div>`;
    }
    if (L.company_en?.show && companyEn) {
      const enFontSize = (L.company_ar?.show && companyAr) ? sharedFontSize : autoFontSize(companyEn, printableW, baseFontPt, 18);
      textHtml += `<div class="company-name" style="font-size: ${enFontSize}pt;">${companyEn}</div>`;
    }
  }
  
  if (textHtml) {
    htmlBody += `<div class="printable-text-area" style="top: ${margins.top || 0}cm; left: ${margins.left || 0}cm; width: ${printableW}cm; height: ${printableH}cm;">${textHtml}</div>`;
  }

  return { html: `<div class="badge-page" style="width: ${L.pageWidth}cm; height: ${L.pageHeight}cm;">${htmlBody}</div>`, L, margins };
};

/**
 * Print collected badges in a single iframe.
 */
const executePrint = (pagesData) => {
  if (pagesData.length === 0) return;

  const iframe = document.createElement('iframe');
  Object.assign(iframe.style, {
    position: 'fixed', right: '-10000px', top: '-10000px',
    width: '1px', height: '1px', opacity: '0', pointerEvents: 'none'
  });
  document.body.appendChild(iframe);

  const firstL = pagesData[0].L;
  const pagesHtml = pagesData.map(p => p.html).join('');

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
  <style>
    @page { size: ${firstL.pageWidth}cm ${firstL.pageHeight}cm; margin: 0; }
    body { font-family: 'Arial', 'Tahoma', sans-serif; margin: 0; padding: 0; background: #fff; }
    .badge-page { position: relative; page-break-after: always; overflow: hidden; }
    .badge-page:last-child { page-break-after: avoid; }
    .printable-text-area { position: absolute; display: flex; flex-direction: column; justify-content: flex-start; align-items: center; gap: 0.5cm; }
    .company-name { font-weight: 900; overflow: hidden; line-height: 1.2; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; white-space: pre-wrap; width: 100%; }
    .emp-name     { font-weight: 700; overflow: hidden; white-space: nowrap; text-align: center; width: 100%; }
  </style>
  <script>
    function checkReady() {
      setTimeout(() => { window.print(); }, 800);
    }
    window.onload = checkReady;
  </script>
  </head>
  <body>
    ${pagesHtml}
  </body></html>`);
  doc.close();
  setTimeout(() => {
    if (document.body.contains(iframe)) document.body.removeChild(iframe);
  }, 12000);
};

export const printExhibitorBadge = (exhibitor, rawLayout = null) => {
  const pages = [];
  if (exhibitor.type === 'international') {
    const employees = exhibitor.employees || [];
    if (employees.length === 0) {
      pages.push(generateExhibitorBadgeHtml(exhibitor, null, rawLayout));
    } else {
      employees.forEach(emp => {
        pages.push(generateExhibitorBadgeHtml(exhibitor, emp.name, rawLayout));
      });
    }
  } else {
    const count = exhibitor.number_of_badges || 1;
    for (let i = 0; i < count; i++) {
      pages.push(generateExhibitorBadgeHtml(exhibitor, null, rawLayout));
    }
  }
  executePrint(pages);
};

export const bulkPrintExhibitorBadges = (exhibitors, rawLayout = null) => {
  const pages = [];
  for (const exhibitor of exhibitors) {
    if (exhibitor.type === 'international') {
      const employees = exhibitor.employees || [];
      if (employees.length === 0) {
        pages.push(generateExhibitorBadgeHtml(exhibitor, null, rawLayout));
      } else {
        for (const emp of employees) {
          pages.push(generateExhibitorBadgeHtml(exhibitor, emp.name, rawLayout));
        }
      }
    } else {
      const count = exhibitor.number_of_badges || 1;
      for (let i = 0; i < count; i++) {
        pages.push(generateExhibitorBadgeHtml(exhibitor, null, rawLayout));
      }
    }
  }
  executePrint(pages);
};
