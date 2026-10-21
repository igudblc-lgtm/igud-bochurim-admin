(function (global) {
  'use strict';

  var U = global.IgudUtils;

  function printCoverPage(weekId) {
    var state = global.IgudStore.getState();
    var week = U.byId(state.weeks, weekId);
    if (!week) return;

    var printRoot = document.getElementById('print-root');
    printRoot.innerHTML =
      '<div style="direction:rtl;font-family:Heebo,Arial,sans-serif;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:16px;padding:50px;">' +
        '<div style="font-size:22px;font-weight:700;">קובץ לימוד</div>' +
        '<div style="font-size:17px;color:#555;">א חסידישע ליל שישי</div>' +
        '<div style="font-size:15px;color:#777;margin-bottom:14px;">הכנה לליל שישי באור החסידות</div>' +
        '<div style="width:60px;height:2px;background:#c9a44c;"></div>' +
        '<div style="font-size:20px;font-weight:700;margin-top:10px;">מאמר ד"ה ' + U.escapeHtml(week.maamar) + '</div>' +
        '<div style="font-size:15px;color:#555;">ל' + U.escapeHtml(week.maamarSource || '') + '</div>' +
        '<div style="width:60px;height:2px;background:#c9a44c;margin-top:14px;"></div>' +
        '<div style="font-size:15px;color:#333;margin-top:10px;">פרשת ' + U.escapeHtml(week.parsha) + ' · חודש ' + U.escapeHtml(week.monthName) + ' ה\'תשפ"ז</div>' +
      '</div>';

    window.print();
  }

  global.Igud.printCoverPage = printCoverPage;
})(window);
