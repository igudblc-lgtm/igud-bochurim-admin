(function (global) {
  'use strict';

  var HEBREW_MONTHS = ['אלול', 'תשרי', 'חשון', 'כסלו', 'טבת', 'שבט', 'אדר', 'ניסן', 'אייר', 'סיון', 'תמוז', 'אב'];

  var MONTH_PARSHIOT = [
    ['ראה', 'שופטים', 'כי תצא', 'כי תבוא', 'נצבים-וילך'],
    ['האזינו', 'בראשית', 'נח'],
    ['לך לך', 'וירא', 'חיי שרה', 'תולדות'],
    ['ויצא', 'וישלח', 'וישב', 'מקץ', 'ויגש'],
    ['ויחי', 'שמות', 'וארא', 'בא'],
    ['בשלח', 'יתרו', 'משפטים', 'תרומה'],
    ['תצוה', 'כי תשא', 'ויקהל-פקודי'],
    ['ויקרא', 'צו', 'שמיני', 'תזריע-מצורע'],
    ['אחרי-קדושים', 'אמור', 'בהר-בחוקותי', 'במדבר'],
    ['נשא', 'בהעלותך', 'שלח', 'קרח'],
    ['חקת', 'בלק', 'פנחס', 'מטות-מסעי'],
    ['דברים', 'ואתחנן', 'עקב', 'עקב']
  ];

  var MAAMARIM = [
    'באתי לגני', 'פדה בשלום', 'לכל תכלה', 'אני לדודי ודודי לי', 'ועשו לי מקדש',
    'כי תהיה לאיש', 'תקעו בחודש שופר', 'אתה בחרתנו', 'פתח אליהו', 'וככה תאכלו אותו',
    'היוצר אור ובורא חושך', 'החלצו מאתכם אנשים', 'ראשי אלפי ישראל', 'מים רבים',
    'עד הגל הזה', 'ואברהם זקן', 'שובה ישראל', 'לב טהור ברא לי אלקים', 'אשרינו מה טוב חלקנו',
    'וידעת היום', 'כימי צאתך מארץ מצרים', 'ישמח משה'
  ];

  var REBBEIM = [
    'אדמו"ר הזקן בעל התניא זיע"א',
    'אדמו"ר האמצעי זיע"א',
    'אדמו"ר הצמח צדק זיע"א',
    'אדמו"ר מוהר"ש זיע"א',
    'אדמו"ר מוהרש"ב זיע"א',
    'אדמו"ר מוהריי"צ זיע"א',
    'כ"ק אדמו"ר זי"ע'
  ];

  var MASHPIIM = [
    'הרב מנחם זאב גרינברג', 'הרב יוסף יצחק לרר', 'הרב שלום דובער וולף',
    'הרב ברוך שלום קפלן', 'הרב לוי יצחק רז', 'הרב ישראל יודל רוזנפלד',
    'הרב דוד נחמן טננבוים', 'הרב אברהם מרדכי ליברוב', 'הרב שניאור זלמן הכהן גרליק'
  ];

  var FARNASIM = [
    'משפחת שיחיו גולדברג', 'משפחת שיחיו קורנפלד', 'ר\' יעקב שיחיה פרידמן',
    'משפחת שיחיו עשורי', 'ר\' מנחם מענדל שיחיה כ"ץ', 'משפחת שיחיו וורמן',
    'קרן הנצחה ע"ש הרה"ח ר\' שמואל ע"ה', 'משפחת שיחיו הלפרין'
  ];

  var STUDENT_NAMES = [
    'מנחם מענדל פרידמן', 'שניאור זלמן העלער', 'יוסף יצחק גרין', 'לוי יצחק קוגן',
    'ישראל נח כ"ץ', 'דוד משה וילהלם', 'שלום דובער רוזנבלום', 'אברהם מרדכי שעגל',
    'מרדכי חיים גולדשטיין', 'מנחם מענדל לרמן', 'יהודה לייב אשכנזי', 'אהרן דב קפלן',
    'חיים שניאור זלמן קלמנסון', 'משה יצחק הכהן', 'בערל שיחי אייזנבך', 'נחום זאב גרונר',
    'יצחק מאיר דייטש', 'שמואל אבא פרלוב', 'שלמה זלמן אוחנה', 'אליהו גורארי',
    'זושא רייצס', 'מנחם מענדל שם-טוב'
  ];

  var SHIURIM = ['שיעור א׳ - בוגרים', 'שיעור ב׳ - אמצעי', 'שיעור ג׳ - צעירים'];

  function seedRandom(seed) {
    var s = seed;
    return function () {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  function pick(arr, rnd) {
    return arr[Math.floor(rnd() * arr.length)];
  }

  function buildWeeks() {
    var rnd = seedRandom(42);
    var weeks = [];
    var maamarCursor = 0;
    var specialBudget = 3; // ליל שישי חוויתי
    var unityBudget = 2;   // שבת התאחדות
    var guestBudget = 7;   // משפיע אורח
    var weekCounter = 0;

    HEBREW_MONTHS.forEach(function (monthName, monthIndex) {
      var parshiot = MONTH_PARSHIOT[monthIndex];
      parshiot.forEach(function (parsha, weekInMonth) {
        weekCounter += 1;
        var type = 'regular';
        var roll = rnd();
        if (specialBudget > 0 && roll < 0.08) {
          type = 'special';
          specialBudget -= 1;
        } else if (unityBudget > 0 && roll > 0.93) {
          type = 'unity';
          unityBudget -= 1;
        } else if (guestBudget > 0 && roll > 0.72 && roll <= 0.93) {
          type = 'guest';
          guestBudget -= 1;
        }

        var maamar = MAAMARIM[maamarCursor % MAAMARIM.length];
        var maamarSource = REBBEIM[maamarCursor % REBBEIM.length];
        maamarCursor += 1;

        var week = {
          id: 'w-' + String(weekCounter).padStart(2, '0'),
          monthIndex: monthIndex,
          monthName: monthName,
          weekInMonth: weekInMonth + 1,
          parsha: parsha,
          type: type,
          maamar: maamar,
          maamarSource: maamarSource,
          mashpia: type === 'guest' ? pick(MASHPIIM, rnd) : '',
          farnas: rnd() > 0.35 ? pick(FARNASIM, rnd) : '',
          tasks: [
            { id: 't1', category: 'purchase', label: 'כיבוד וכוסות', done: false },
            { id: 't2', category: 'purchase', label: 'שתייה חמה (קפה/תה)', done: false },
            { id: 't3', category: 'print', label: 'חוברת לימוד חודשית', done: false },
            { id: 't4', category: 'print', label: 'מודעת השבוע ללוח המודעות', done: false },
            { id: 't5', category: 'coordination', label: 'אישור הגעת משפיע/פרנס', done: false }
          ],
          notes: ''
        };
        weeks.push(week);
      });
    });

    return weeks;
  }

  function buildBooklets() {
    return HEBREW_MONTHS.map(function (monthName, idx) {
      var statuses = ['מוכן לחלוקה', 'נשלח לדפוס', 'בעריכה'];
      return {
        id: 'b-' + idx,
        monthName: monthName,
        status: idx < 2 ? 'מוכן לחלוקה' : (idx === 2 ? 'נשלח לדפוס' : (idx === 3 ? 'בעריכה' : 'טרם הוחל')),
        reviewQuestions: 'מהו היסוד המרכזי שלמדנו החודש במאמר? כיצד ניתן ליישם זאת הלכה למעשה בסדר היום?',
        fileName: null,
        fileDataUrl: null,
        corePdfName: null,
        corePdfDataUrl: null,
        driveLink: null,
        driveFileId: null
      };
    });
  }

  var DEDICATION_OPTIONS = ['לזכות', 'לע"נ', 'לרגל'];

  var QUESTION_TEMPLATES = [
    {
      id: 'general',
      label: 'שאלון כללי לעיון וחזרה',
      text: 'מהו היסוד המרכזי שלמדנו החודש במאמר?\nכיצד ניתן ליישם זאת הלכה למעשה בעבודת השבוע?\nאיזו נקודה במאמר הייתה הכי מחדשת עבורך?'
    },
    {
      id: 'rosh-chodesh',
      label: 'שאלון לקראת ראש חודש',
      text: 'מהי הנקודה המרכזית העולה מהמאמר ביחס לחודש הקרוב?\nכיצד ניתן לקשר בין המאמר לעבודת התפילה של החודש?\nמהי נקודה אחת מהמאמר שהכי נגעה בליבך החודש?'
    },
    {
      id: 'unity-shabbos',
      label: 'שאלון לקראת שבת התאחדות',
      text: 'מהי המסקנה המעשית העולה מהמאמר עבור התאחדות והתחברות הבחורים?\nכיצד ניתן להמשיך את ההתעוררות מההתוועדות לאורך השבוע?\nמה אתה לוקח אישית מהמאמר השבוע?'
    }
  ];

  var POSTER_TEMPLATES = [
    { id: 'p-farnas', name: 'מודעת "פרנס ליל שישי"', fields: ['שם הפרנס', 'תאריך'], accent: 'gold', dedication: true },
    { id: 'p-mazal', name: 'מודעת "מזל טוב"', fields: ['שם הבחור/המשפחה', 'לרגל'], accent: 'navy', dedication: false },
    { id: 'p-special', name: 'מודעת "התוועדות מיוחדת"', fields: ['כותרת האירוע', 'תאריך ושעה'], accent: 'purple', dedication: true }
  ];

  var CURRENT_WEEK_INDEX = 9; // first week of חשון, ~ reference "today"
  var MAIN_BRANCH_ID = 'main';

  global.IgudData = {
    HEBREW_MONTHS: HEBREW_MONTHS,
    STUDENT_NAMES: STUDENT_NAMES,
    SHIURIM: SHIURIM,
    POSTER_TEMPLATES: POSTER_TEMPLATES,
    CURRENT_WEEK_INDEX: CURRENT_WEEK_INDEX,
    MAIN_BRANCH_ID: MAIN_BRANCH_ID,
    DEDICATION_OPTIONS: DEDICATION_OPTIONS,
    QUESTION_TEMPLATES: QUESTION_TEMPLATES,
    buildWeeks: buildWeeks,
    buildBooklets: buildBooklets,
    seedRandom: seedRandom,
    pick: pick
  };
})(window);
