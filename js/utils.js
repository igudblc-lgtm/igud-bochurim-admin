(function (global) {
  'use strict';

  var TYPE_META = {
    regular: { label: 'ליל שישי רגיל', color: 'blue' },
    guest: { label: 'משפיע אורח', color: 'gold' },
    special: { label: 'ליל שישי חוויתי', color: 'purple' },
    unity: { label: 'שבת התאחדות', color: 'green' }
  };

  var STATUS_META = {
    green: { label: 'מתמיד', color: 'green' },
    yellow: { label: 'בתנודתיות', color: 'yellow' },
    red: { label: 'חשש נשירה', color: 'red' }
  };

  var GEMATRIA_UNITS = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
  var GEMATRIA_TENS = ['', 'י', 'כ', 'ל'];

  function hebrewDay(n) {
    if (n === 15) return 'ט"ו';
    if (n === 16) return 'ט"ז';
    var tens = Math.floor(n / 10);
    var units = n % 10;
    var str = GEMATRIA_TENS[tens] + GEMATRIA_UNITS[units];
    if (str.length === 1) return str + "'";
    return str.slice(0, -1) + '"' + str.slice(-1);
  }

  function weekHebrewDateLabel(week) {
    var approxDay = Math.min(29, week.weekInMonth * 7 - 2);
    return hebrewDay(approxDay) + ' ' + week.monthName + ' תשפ"ז';
  }

  function typeMeta(type) {
    return TYPE_META[type] || TYPE_META.regular;
  }

  function statusMeta(status) {
    return STATUS_META[status] || STATUS_META.green;
  }

  function byId(arr, id) {
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].id === id) return arr[i];
    }
    return null;
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (key) {
      if (key === 'class') node.className = attrs[key];
      else if (key === 'html') node.innerHTML = attrs[key];
      else if (key.indexOf('on') === 0 && typeof attrs[key] === 'function') {
        node.addEventListener(key.slice(2), attrs[key]);
      } else {
        node.setAttribute(key, attrs[key]);
      }
    });
    (children || []).forEach(function (child) {
      if (child == null) return;
      if (typeof child === 'string') node.appendChild(document.createTextNode(child));
      else node.appendChild(child);
    });
    return node;
  }

  function icsEscape(str) {
    return String(str == null ? '' : str)
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  }

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function downloadIcsEvent(summary, description, date) {
    var dateStr = '' + date.getFullYear() + pad2(date.getMonth() + 1) + pad2(date.getDate());
    var now = new Date();
    var stamp = now.getUTCFullYear() + pad2(now.getUTCMonth() + 1) + pad2(now.getUTCDate()) +
      'T' + pad2(now.getUTCHours()) + pad2(now.getUTCMinutes()) + pad2(now.getUTCSeconds()) + 'Z';
    var uid = 'igud-' + Date.now() + '@igud-bochurim';
    var lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Igud Bochurim//Leil Shishi//HE',
      'BEGIN:VEVENT',
      'UID:' + uid,
      'DTSTAMP:' + stamp,
      'DTSTART;VALUE=DATE:' + dateStr,
      'SUMMARY:' + icsEscape(summary),
      'DESCRIPTION:' + icsEscape(description),
      'END:VEVENT',
      'END:VCALENDAR'
    ];
    var blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'tazkir-igud-bochurim.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  function buildMailtoUrl(subject, body) {
    return 'mailto:?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  }

  function branchTaskKey(branchId, weekId, taskId) {
    return branchId + '__' + weekId + '__' + taskId;
  }

  function branchLogKey(branchId, weekId) {
    return branchId + '__' + weekId;
  }

  function randomCode4() {
    return String(Math.floor(1000 + Math.random() * 9000));
  }

  function downloadJson(filename, dataObj) {
    var blob = new Blob([JSON.stringify(dataObj, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  function readFileAsText(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  function dataUrlToBlob(dataUrl) {
    var parts = dataUrl.split(',');
    var mimeMatch = parts[0].match(/:(.*?);/);
    var mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    var binary = atob(parts[1]);
    var array = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
    return new Blob([array], { type: mime });
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  global.IgudUtils = {
    typeMeta: typeMeta,
    statusMeta: statusMeta,
    weekHebrewDateLabel: weekHebrewDateLabel,
    byId: byId,
    el: el,
    escapeHtml: escapeHtml,
    downloadIcsEvent: downloadIcsEvent,
    buildMailtoUrl: buildMailtoUrl,
    branchTaskKey: branchTaskKey,
    branchLogKey: branchLogKey,
    randomCode4: randomCode4,
    downloadJson: downloadJson,
    readFileAsText: readFileAsText,
    dataUrlToBlob: dataUrlToBlob
  };
})(window);
