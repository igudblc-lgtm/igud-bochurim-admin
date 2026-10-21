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
    escapeHtml: escapeHtml
  };
})(window);
