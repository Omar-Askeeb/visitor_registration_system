/* ─────────────────────────────────────────────────────────────────
   printBadge.js  –  Visitor badge printer
   Accepts the full layout object (nested: { visitor: {...}, exhibitor: {...} })
   OR the legacy flat layout for backwards compatibility.
   Supports:
     • Auto-scaling font size so text never overflows the badge width
     • Configurable margins (top/bottom/left/right)
     • Visitor + Exhibitor badge types (via layoutType param)
──────────────────────────────────────────────────────────────── */

/** Resolve visitor sub-layout from the saved object (or legacy flat obj). */
const resolveVisitorLayout = (rawLayout) => {
  if (!rawLayout) {
    return {
      pageWidth: 10.5, pageHeight: 14.8,
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      fontSize: 16,
      name:    { y: 6.5,  x: '', show: true },
      barcode: { y: 9.5,  x: '', show: true, widthFactor: 1.8, height: 50 },
      qrCode:  { y: 13.5, x: '', show: false, size: 30, template: '{onlineRegID}' },
    };
  }
  // Legacy flat layout
  if (rawLayout.pageWidth !== undefined && !rawLayout.visitor) {
    return {
      pageWidth:  rawLayout.pageWidth  || 10.5,
      pageHeight: rawLayout.pageHeight || 14.8,
      margins:    { top: 0, bottom: 0, left: 0, right: 0 },
      fontSize:   rawLayout.fontSize || 16,
      name:    { ...{ y: 6.5,  x: '', show: true  }, ...(rawLayout.name    || {}) },
      barcode: { ...{ y: 9.5,  x: '', show: true,  widthFactor: 1.8, height: 50 }, ...(rawLayout.barcode || {}) },
      qrCode:  { ...{ y: 13.5, x: '', show: false, size: 30, template: '{onlineRegID}' }, ...(rawLayout.qrCode || {}) },
    };
  }
  return rawLayout.visitor || rawLayout;
};

/** Helper: position style string */
const getStyleX = (val) => {
  if (!val || val.toString().toLowerCase() === 'auto' || isNaN(parseFloat(val))) {
    return 'width: 100%; left: 0; text-align: center;';
  }
  return `left: ${val}cm; width: fit-content; text-align: left;`;
};

/** Build QR content string from template */
const resolveQrText = (template, form, visitorName, badgeID, isTest) => {
  const varMap = {
    '{name}':        visitorName,
    '{badgeid}':     badgeID || '',
    '{onlineregid}': form.onlineRegID || '',
    '{formid}':      form.formID || form.formId || '',
    '{middlename}':  form.middleName || form.midleName || '',
    '{surname}':     form.surName || '',
    '{phone1}':      form.phone1 || '',
    '{phone2}':      form.phone2 || '',
    '{email}':       form.email  || '',
  };
  let text = template || '{onlineRegID}';
  const tags = text.match(/\{[^}]+\}/g) || [];
  let valid = true;
  for (const tag of tags) {
    const val = varMap[tag.toLowerCase()];
    if (!isTest && (!val || String(val).trim() === '')) { valid = false; break; }
    text = text.replace(tag, val || tag);
  }
  return valid ? text : null;
};

/**
 * Open a silent print iframe for a visitor badge.
 *
 * @param {object}  form         Visitor object (visitorName, surName, badgeID, onlineRegID…)
 * @param {string}  badgeID      Badge barcode value
 * @param {string}  eventName    (unused, kept for API compat)
 * @param {boolean} printBarcode Whether to include barcode
 * @param {object}  rawLayout    Full layout object from event.badge_layout
 * @param {boolean} isTest       Skip missing-field validation for QR
 */
export const openPrintWindow = (form, badgeID, eventName, printBarcode = true, rawLayout = null, isTest = false) => {
  const L = resolveVisitorLayout(rawLayout);
  
  // Dynamically construct name based on settings
  const nameParts = [];
  if (L.name?.includeFirst !== false) nameParts.push(form.visitorName);
  if (L.name?.includeMiddle) nameParts.push(form.midleName || form.middleName);
  if (L.name?.includeLast !== false) nameParts.push(form.surName);
  
  const visitorName = nameParts.filter(Boolean).join('  ');
  const baseFontSize = Number(L.fontSize) || 16;

  // Use margins from settings
  const margins = L.margins || { top: 0, bottom: 0, left: 0, right: 0 };

  // Printable width is full page width
  const printableW = Number(L.pageWidth);

  // Auto-scale font size: cap it so text doesn't overflow
  // Rule: 1 pt ≈ 0.0353 cm.  Max chars per line × charWidth ≈ printableW
  // We cap at baseFontSize but shrink if name is long.
  const avgCharWidthPt = 0.55;  // approximate character width as fraction of font pt
  const maxFontForName = printableW / (visitorName.length * avgCharWidthPt * 0.0353);
  const nameFontSize = Math.min(baseFontSize, Math.floor(maxFontForName));

  const iframe = document.createElement('iframe');
  Object.assign(iframe.style, {
    position: 'fixed', right: '-10000px', top: '-10000px',
    width: '1px', height: '1px', opacity: '0', pointerEvents: 'none'
  });
  document.body.appendChild(iframe);

  let scripts   = '<script src="/js/JsBarcode.all.min.js"><\/script>';
  let initCode  = '';
  let htmlBody  = '';

  // 1. Name
  if (L.name?.show) {
    htmlBody += `<div class="visitor-name" style="top: ${L.name.y}cm; ${getStyleX(L.name.x)} font-size: ${nameFontSize}pt;">${visitorName}</div>`;
  }

  // 2. Barcode
  if (printBarcode && badgeID && L.barcode?.show) {
    htmlBody += `<div class="barcode-wrapper" style="top: ${L.barcode.y}cm; ${getStyleX(L.barcode.x)}"><svg id="bc"></svg></div>`;
    initCode += `try {
      JsBarcode('#bc', ${JSON.stringify(badgeID)}, {
        format:'CODE128', displayValue:true,
        width:${L.barcode.widthFactor || 1.8},
        height:${L.barcode.height || 50},
        lineColor:'#000', fontSize: 14
      });
    } catch(e){ console.warn('Barcode failed'); }\n`;
  }

  // 3. QR Code
  if (L.qrCode?.show) {
    scripts += '<script src="/js/qrcode.min.js"><\/script>';
    const qrText = resolveQrText(L.qrCode.template, form, visitorName, badgeID, isTest);
    if (qrText) {
      const qrSizePx = (L.qrCode.size || 30) * 3.78;
      htmlBody += `<div id="qrcode" style="top: ${L.qrCode.y}cm; ${getStyleX(L.qrCode.x)}"><div class="qr-inner" style="width:${L.qrCode.size}mm; height:${L.qrCode.size}mm; margin:0 auto;"></div></div>`;
      initCode += `try {
        new QRCode(document.querySelector('#qrcode .qr-inner'), {
          text: ${JSON.stringify(qrText)},
          width: ${qrSizePx}, height: ${qrSizePx},
          colorDark:'#000', colorLight:'#fff',
          correctLevel: QRCode.CorrectLevel.H
        });
      } catch(e){ console.warn('QR failed'); }\n`;
    }
  }

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
  ${scripts}
  <style>
    @page {
      size: ${L.pageWidth}cm ${L.pageHeight}cm;
      margin: 0;
    }
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #fff; overflow: hidden; }
    .badge-container {
      position: relative;
      width: ${L.pageWidth}cm;
      height: ${L.pageHeight}cm;
    }
    .visitor-name { position: absolute; font-weight: 900; direction: rtl; overflow: hidden; white-space: nowrap; }
    .barcode-wrapper { position: absolute; }
    .barcode-wrapper svg { margin: 0 auto; display: block; }
    #qrcode { position: absolute; }
    #qrcode img { display: block; }
  </style>
  <script>
    function checkReady() {
      const hasBC = document.getElementById('bc');
      const hasQR = document.getElementById('qrcode');
      const bcReady = !hasBC || typeof JsBarcode === 'function';
      const qrReady = !hasQR || typeof QRCode === 'function';
      if (bcReady && qrReady) {
        try { ${initCode} } catch(e) { console.error('Init failed', e); }
        setTimeout(() => { window.print(); }, 800);
      } else { setTimeout(checkReady, 50); }
    }
    window.onload = checkReady;
  <\/script>
  </head>
  <body>
    <div class="badge-container">
      ${htmlBody}
    </div>
  </body></html>`);
  doc.close();

  setTimeout(() => {
    if (document.body.contains(iframe)) document.body.removeChild(iframe);
  }, 10000);
};
