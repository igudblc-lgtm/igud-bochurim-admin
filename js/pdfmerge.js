(function (global) {
  'use strict';

  var U = global.IgudUtils;
  var A4_PX_W = 794;
  var A4_PX_H = 1123;
  var A4_PT_W = 595.28;
  var A4_PT_H = 841.89;

  function buildWrapperHtml(booklet, monthWeeks) {
    var rowsHtml = monthWeeks.map(function (w) {
      return '<tr>' +
        '<td style="padding:6px 10px;border-bottom:1px solid #ddd;font-weight:700;">פרשת ' + U.escapeHtml(w.parsha) + '</td>' +
        '<td style="padding:6px 10px;border-bottom:1px solid #ddd;">' + U.escapeHtml(w.maamar) + '</td>' +
        '<td style="padding:6px 10px;border-bottom:1px solid #ddd;color:#666;">' + (w.mashpia ? U.escapeHtml(w.mashpia) : '') + '</td>' +
      '</tr>';
    }).join('');

    return (
      '<div dir="rtl" lang="he" style="width:' + A4_PX_W + 'px;height:' + A4_PX_H + 'px;box-sizing:border-box;' +
        'font-family:Heebo,Arial,sans-serif;padding:60px 56px;background:#ffffff;color:#16213a;">' +
        '<div style="text-align:center;border-bottom:3px solid #c9a44c;padding-bottom:18px;margin-bottom:26px;">' +
          '<div style="font-size:13px;letter-spacing:2px;color:#b3883a;font-weight:700;">איגוד בחורים · א חסידישע ליל שישי</div>' +
          '<div style="font-size:30px;font-weight:800;margin-top:8px;">חוברת לימוד חודשית — ' + U.escapeHtml(booklet.monthName) + '</div>' +
          '<div style="font-size:14px;color:#52607a;margin-top:6px;">מהדורה מעודכנת לשנה זו · הופק אוטומטית</div>' +
        '</div>' +
        '<div style="font-size:16px;font-weight:700;margin-bottom:10px;">מאמרים ומפגשי החודש</div>' +
        '<table style="width:100%;border-collapse:collapse;font-size:13.5px;margin-bottom:28px;">' +
          '<thead><tr>' +
            '<th style="text-align:right;padding:6px 10px;border-bottom:2px solid #16213a;">פרשה</th>' +
            '<th style="text-align:right;padding:6px 10px;border-bottom:2px solid #16213a;">מאמר</th>' +
            '<th style="text-align:right;padding:6px 10px;border-bottom:2px solid #16213a;">משפיע אורח</th>' +
          '</tr></thead>' +
          '<tbody>' + rowsHtml + '</tbody>' +
        '</table>' +
        '<div style="font-size:16px;font-weight:700;margin-bottom:10px;">שאלות לעיון וחזרה</div>' +
        '<div style="font-size:14px;line-height:1.9;white-space:pre-line;">' + U.escapeHtml(booklet.reviewQuestions) + '</div>' +
      '</div>'
    );
  }

  function renderHtmlToCanvas(html) {
    var holder = document.createElement('div');
    holder.style.position = 'fixed';
    holder.style.top = '-10000px';
    holder.style.left = '0';
    holder.innerHTML = html;
    document.body.appendChild(holder);

    var fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    return fontsReady.then(function () {
      return global.html2canvas(holder.firstChild, { scale: 2, useCORS: true });
    }).then(function (canvas) {
      document.body.removeChild(holder);
      return canvas;
    }).catch(function (e) {
      document.body.removeChild(holder);
      throw e;
    });
  }

  function dataUrlToUint8Array(dataUrl) {
    var blob = U.dataUrlToBlob(dataUrl);
    return blob.arrayBuffer().then(function (buf) { return new Uint8Array(buf); });
  }

  function fetchAsUint8Array(urlOrDataUrl) {
    if (urlOrDataUrl.indexOf('data:') === 0) return dataUrlToUint8Array(urlOrDataUrl);
    return fetch(urlOrDataUrl).then(function (res) { return res.arrayBuffer(); }).then(function (buf) { return new Uint8Array(buf); });
  }

  function addCanvasPage(pdfDoc, canvas) {
    var pngDataUrl = canvas.toDataURL('image/png');
    return dataUrlToUint8Array(pngDataUrl).then(function (bytes) {
      return pdfDoc.embedPng(bytes);
    }).then(function (pngImage) {
      var page = pdfDoc.addPage([A4_PT_W, A4_PT_H]);
      page.drawImage(pngImage, { x: 0, y: 0, width: A4_PT_W, height: A4_PT_H });
    });
  }

  async function buildMergedBookletPdf(monthIndex) {
    var state = global.IgudStore.getState();
    var booklet = state.booklets[monthIndex];
    var monthWeeks = state.weeks.filter(function (w) { return w.monthIndex === monthIndex; });

    var wrapperHtml = buildWrapperHtml(booklet, monthWeeks);
    var canvas = await renderHtmlToCanvas(wrapperHtml);

    var PDFDocument = global.PDFLib.PDFDocument;
    var outDoc = await PDFDocument.create();
    await addCanvasPage(outDoc, canvas);

    if (booklet.corePdfDataUrl) {
      try {
        var coreBytes = await fetchAsUint8Array(booklet.corePdfDataUrl);
        var coreDoc = await PDFDocument.load(coreBytes);
        var copiedPages = await outDoc.copyPages(coreDoc, coreDoc.getPageIndices());
        copiedPages.forEach(function (p) { outDoc.addPage(p); });
      } catch (e) {
        console.warn('pdfmerge: failed to merge core PDF', e);
      }
    }

    var mergedBytes = await outDoc.save();
    var blob = new Blob([mergedBytes], { type: 'application/pdf' });
    return { blob: blob, url: URL.createObjectURL(blob) };
  }

  global.Igud.buildMergedBookletPdf = buildMergedBookletPdf;
})(window);
