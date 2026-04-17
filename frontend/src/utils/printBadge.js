/* ─────── Print badge silently using hidden iframe ─────── */
export const openPrintWindow = (form, badgeID, eventName, printBarcode = true, layout = null, isTest = false) => {
  const visitorName = [form.visitorName, form.surName].filter(Boolean).join('  ');
  
  // Create hidden iframe
  const iframe = document.createElement('iframe');
  
  Object.assign(iframe.style, {
    position: 'fixed',
    right: '-10000px',
    top: '-10000px',
    width: '1px',
    height: '1px',
    opacity: '0',
    pointerEvents: 'none'
  });
  
  document.body.appendChild(iframe);

  // Default layout if none provided
  const L = layout || {
    pageWidth: 21,
    pageHeight: 27,
    name: { y: 6.5, x: '', show: true },
    barcode: { y: 9.5, x: '', show: true, widthFactor: 1.8, height: 50 },
    qrCode: { y: 13.5, x: '', show: false, size: 30, template: '{onlineRegID}' }
  };

  /** 
   * Enhanced positioning logic: 
   * If X is empty, use width 100% to ensure perfect centering.
   */
  const getStyleX = (val) => {
    if (!val || val.toString().toLowerCase() === 'auto' || isNaN(parseFloat(val))) {
      return 'width: 100%; left: 0; text-align: center;';
    }
    return `left: ${val}cm; width: fit-content; text-align: left;`;
  };

  let scripts = '<script src="/js/JsBarcode.all.min.js"><\/script>';
  let initCode = '';
  let htmlContent = '';

  // 1. Name
  if (L.name?.show) {
    htmlContent += `<div class="visitor-name" style="top: ${L.name.y}cm; ${getStyleX(L.name.x)}">${visitorName}</div>`;
  }

  // 2. Barcode
  if (printBarcode && badgeID && L.barcode?.show) {
    htmlContent += `<div class="barcode-wrapper" style="top: ${L.barcode.y}cm; ${getStyleX(L.barcode.x)}"><svg id="bc"></svg></div>`;
    initCode += `try { 
      JsBarcode('#bc',${JSON.stringify(badgeID)},{
        format:'CODE128',
        displayValue:true,
        width:${L.barcode.widthFactor || 1.8},
        height:${L.barcode.height || 50},
        lineColor:'#000',
        fontSize: 14
      }); 
    } catch(e){ console.warn('Barcode failed'); }\n`;
  }

  // 3. QR Code with conditional visibility
  if (L.qrCode?.show) {
    scripts += '<script src="/js/qrcode.min.js"><\/script>';
    
    // Var map for strict verification (lowercase keys)
    const varMap = {
      '{name}': visitorName,
      '{badgeid}': badgeID || '',
      '{onlineregid}': form.onlineRegID || '',
      '{formid}': form.formID || form.formId || '',
      '{middlename}': form.middleName || form.midleName || '',
      '{surname}': form.surName || '',
      '{phone1}': form.phone1 || '',
      '{phone2}': form.phone2 || '',
      '{email}': form.email || ''
    };

    let qrTemplate = L.qrCode.template || '{onlineRegID}';
    let qrText = qrTemplate;
    let allVarsPresent = true;

    // Strict validation: find all {tags} and ensure they aren't empty (skipped for tests)
    const foundTags = qrTemplate.match(/\{[^}]+\}/g) || [];
    for (const tag of foundTags) {
      const lowerTag = tag.toLowerCase();
      const val = varMap[lowerTag];
      if (!isTest && (!val || String(val).trim() === '')) {
        allVarsPresent = false;
        break;
      }
      // For tests, if value is empty, keep the tag name so the user knows it's there
      qrText = qrText.replace(tag, val || tag);
    }

    if (allVarsPresent && qrText && qrText !== 'null') {
      const qrSizePx = L.qrCode.size * 3.78; // mm to roughly px at 96dpi
      htmlContent += `<div id="qrcode" style="top: ${L.qrCode.y}cm; ${getStyleX(L.qrCode.x)};"><div class="qr-inner" style="width: ${L.qrCode.size}mm; height: ${L.qrCode.size}mm; margin: 0 auto;"></div></div>`;
      initCode += `try {
        new QRCode(document.querySelector("#qrcode .qr-inner"), {
          text: ${JSON.stringify(qrText)},
          width: ${qrSizePx},
          height: ${qrSizePx},
          colorDark : "#000000",
          colorLight : "#ffffff",
          correctLevel : QRCode.CorrectLevel.H
        });
      } catch(e){ console.warn('QR failed'); }\n`;
    }
  }

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
  ${scripts}
  <style>
    @page { size: ${L.pageWidth}cm ${L.pageHeight}cm; margin: 0; }
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #fff; overflow: hidden; }
    .badge-container { position: relative; width: ${L.pageWidth}cm; height: ${L.pageHeight}cm; }
    .visitor-name { position: absolute; font-size: 20pt; font-weight: 900; direction: rtl; }
    .barcode-wrapper { position: absolute; }
    .barcode-wrapper svg { margin: 0 auto; display: block; }
    #qrcode { position: absolute; }
    #qrcode img { display: block; }
  </style>
  <script>
    window.onload = function() {
      ${initCode}
      setTimeout(() => {
        window.print();
      }, 800);
    };
  </script>
  </head>
  <body>
    <div class="badge-container">
      ${htmlContent}
    </div>
  </body></html>`);
  doc.close();

  // Cleanup iframe after print dialog is handled
  setTimeout(() => {
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
  }, 10000);
};
