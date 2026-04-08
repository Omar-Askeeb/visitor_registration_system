/* ─────── Print badge silently using hidden iframe ─────── */
export const openPrintWindow = (form, badgeID, eventName, printBarcode = true) => {
  const name = [form.visitorName, form.surName].filter(Boolean).join('  ');
  
  // Create hidden iframe
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  document.body.appendChild(iframe);

  let barcodeScript = '';
  let barcodeHtml = '';
  let bodyOnload = 'window.print()';
  
  if (printBarcode && badgeID) {
    barcodeScript = '<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3/dist/JsBarcode.all.min.js"><\/script>';
    barcodeHtml = `<svg id="bc"></svg>`;
    bodyOnload = `JsBarcode('#bc','${badgeID}',{format:'CODE128',displayValue:true,width:1.8,height:50,lineColor:'#000'});setTimeout(()=>{window.print();},400)`;
  }

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
  ${barcodeScript}
  <style>
    @page { size: 21cm 27cm; margin: 0; }
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #fff; }
    .badge-container { position: relative; width: 21cm; height: 27cm; box-sizing: border-box; }
    .content { position: absolute; top: 6.5cm; left: 1cm; right: 1cm; height: 4cm; text-align: center; }
    .visitor-name { font-size: 16pt; font-weight: bold; margin-top: 10px; direction: rtl; }
    .ev { font-size: 10pt; text-transform: uppercase; letter-spacing: 2px; color: #64748b; margin-bottom: 8px; display: none; }
  </style></head>
  <body onload="${bodyOnload}">
  <div class="badge-container">
    <div class="content">
      ${barcodeHtml}
      <div class="visitor-name">${name}</div>
    </div>
  </div></body></html>`);
  doc.close();

  // Cleanup iframe after print dialog is handled
  setTimeout(() => {
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
  }, 10000);
};
