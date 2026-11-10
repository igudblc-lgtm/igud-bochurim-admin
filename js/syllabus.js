(function (global) {
  'use strict';

  var U = global.IgudUtils;

  function countBy(weeks, type) {
    return weeks.filter(function (w) { return w.type === type; }).length;
  }

  function printSyllabus() {
    var state = global.IgudStore.getState();
    var weeks = state.weeks;
    var guestCount = countBy(weeks, 'guest');
    var specialCount = countBy(weeks, 'special');
    var unityCount = countBy(weeks, 'unity');
    var maamarCount = weeks.reduce(function (set, w) { set[w.maamar] = true; return set; }, {});
    var distinctMaamarim = Object.keys(maamarCount).length;

    var printRoot = document.getElementById('print-root');
    printRoot.innerHTML =
      '<div style="direction:rtl;font-family:Heebo,Arial,sans-serif;padding:46px;max-width:760px;margin:0 auto;line-height:1.75;color:#16213a;">' +

        '<div style="text-align:center;margin-bottom:34px;">' +
          '<img src="' + global.IGUD_LOGO_DATA_URL + '" style="max-width:200px;height:auto;margin-bottom:10px;">' +
          '<h1 style="font-size:30px;margin:6px 0 4px;">א חסידישע ליל שישי</h1>' +
          '<div style="font-size:15px;color:#52607a;">סילבוס ותוכנית לימוד שנתית — תשפ"ז</div>' +
        '</div>' +

        '<p style="font-size:15px;">ליל שישי הוא הרגע בשבוע שבו העולם נעצר לרגע — ואנחנו נפגשים, לא כדי "לסיים עוד שיעור", אלא כדי לחיות משהו. ' +
        'מסגרת <strong>"א חסידישע ליל שישי"</strong> נבנתה כדי לתת לכל בחור באיגוד עוגן קבוע של לימוד חסידות לעומק, התוועדות אמיתית וחיבור אישי — מדי שבוע, לאורך כל השנה, מאלול ועד אב.</p>' +

        '<h2 style="font-size:19px;border-bottom:2px solid #c9a44c;padding-bottom:6px;margin-top:30px;">מה מחכה לך השנה</h2>' +
        '<ul style="font-size:14.5px;padding-right:20px;">' +
          '<li>' + distinctMaamarim + ' מאמרי חסידות נבחרים, נלמדים בעיון ובהעמקה</li>' +
          '<li>' + guestCount + ' לילות עם משפיעים אורחים מהשורה הראשונה</li>' +
          '<li>' + specialCount + ' לילות שישי חוויתיים במיוחד, ברוח ובתוכן</li>' +
          '<li>' + unityCount + ' שבתות התאחדות לאורך השנה</li>' +
        '</ul>' +

        '<h2 style="font-size:19px;border-bottom:2px solid #c9a44c;padding-bottom:6px;margin-top:30px;">איך בנוי כל ליל שישי</h2>' +
        '<p style="font-size:14.5px;">כל שבוע נפתח במאמר חסידות, ממשיך בשאלות לעיון וחזרה המחדדות את הנקודה המעשית, ונחתם בהתוועדות עם חברים ולעיתים עם משפיע אורח. חוברת לימוד חודשית מרכזת את כל התוכן כדי שתוכל לחזור אליו בכל עת.</p>' +

        '<h2 style="font-size:19px;border-bottom:2px solid #c9a44c;padding-bottom:6px;margin-top:30px;">המטרה שלנו</h2>' +
        '<p style="font-size:14.5px;"><strong>מטרת המסגרת:</strong> ' + U.escapeHtml(state.goals.purpose) + '</p>' +
        '<p style="font-size:14.5px;"><strong>יעד הלימוד השנתי:</strong> ' + U.escapeHtml(state.goals.annualTarget) + '</p>' +

        '<div style="text-align:center;margin-top:40px;font-size:15px;font-weight:700;color:#0b2340;">מצפים לראותך בליל שישי הקרוב.</div>' +
      '</div>';

    window.print();
  }

  global.Igud.printSyllabus = printSyllabus;
})(window);
