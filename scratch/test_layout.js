const rawLayout = {
  exhibitorLocal: {
    pageWidth: 21,
    pageHeight: 29,
    margins: { top: 4.5, bottom: 19, left: 6, right: 6 }
  }
};
const exhibitor = { type: 'local', company_name_en: 'Elnwris Company', company_name_ar: 'شركة النورس لاستيراد معدات تجهيز المطاعم والفنادق والمقاهي' };

const defaultsLocal = {
    pageWidth: 10.5, pageHeight: 14.8,
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    fontSize: 28,
    company_ar: { y: 4.5, x: '', show: true },
    company_en: { y: 6.5, x: '', show: true },
    barcode: { y: 11.5, x: '', show: true, widthFactor: 1.8, height: 50 },
    qrCode: { y: 15.5, x: '', show: false, size: 30, template: '{id}' }
  };

const layout = rawLayout.exhibitorLocal || rawLayout.exhibitor || {};
const L = {
    ...defaultsLocal, ...layout,
    margins: { ...defaultsLocal.margins, ...(layout.margins || {}) },
};

const margins     = L.margins || { top: 0, bottom: 0, left: 0, right: 0 };
const printableW  = Number(L.pageWidth) - Number(margins.left || 0) - Number(margins.right || 0);
const printableH  = Number(L.pageHeight) - Number(margins.top || 0) - Number(margins.bottom || 0);

console.log("margins", margins);
console.log("printableH", printableH);
console.log(`<div class="printable-text-area" style="top: ${margins.top || 0}cm; left: ${margins.left || 0}cm; width: ${printableW}cm; height: ${printableH}cm;">...</div>`);
