(function (global) {
  'use strict';

  var STORAGE_KEY = 'igud-bochurim-leil-shishi-v1';
  var D = global.IgudData;

  function buildStudents(weeks) {
    var rnd = D.seedRandom(7);
    var currentIdx = D.CURRENT_WEEK_INDEX;
    var historyWeeks = weeks.slice(Math.max(0, currentIdx - 9), currentIdx + 1);

    return D.STUDENT_NAMES.map(function (name, i) {
      var shiur = D.SHIURIM[i % D.SHIURIM.length];
      var reliability = 0.55 + rnd() * 0.42; // per-student base attendance rate
      var attendance = historyWeeks.map(function (w) {
        var present = rnd() < reliability;
        var learned = present && rnd() < 0.85;
        return { weekId: w.id, present: present, learned: learned };
      });

      var consecutiveAbsences = 0;
      for (var k = attendance.length - 1; k >= 0; k--) {
        if (!attendance[k].present) {
          consecutiveAbsences += 1;
        } else {
          break;
        }
      }

      var presentCount = attendance.filter(function (a) { return a.present; }).length;
      var attendancePct = Math.round((presentCount / attendance.length) * 100);
      var articlesCompleted = attendance.filter(function (a) { return a.learned; }).length;

      var status = 'green';
      if (consecutiveAbsences >= 3) status = 'red';
      else if (consecutiveAbsences === 2 || attendancePct < 70) status = 'yellow';

      return {
        id: 's-' + i,
        name: name,
        shiur: shiur,
        attendance: attendance,
        attendancePct: attendancePct,
        articlesCompleted: articlesCompleted,
        consecutiveAbsences: consecutiveAbsences,
        status: status
      };
    });
  }

  function buildEveningLogs(weeks) {
    var rnd = D.seedRandom(99);
    var logs = {};
    weeks.slice(Math.max(0, D.CURRENT_WEEK_INDEX - 5), D.CURRENT_WEEK_INDEX).forEach(function (w) {
      logs[w.id] = {
        rating: 3 + Math.round(rnd() * 2),
        notes: '',
        participantsCount: 14 + Math.floor(rnd() * 8)
      };
    });
    return logs;
  }

  function freshState() {
    var weeks = D.buildWeeks();
    return {
      frameworks: [
        { id: 'leil-shishi', name: 'א חסידישע ליל שישי', active: true },
        { id: 'coming-soon', name: 'מסגרת נוספת (בקרוב)', active: false }
      ],
      activeFramework: 'leil-shishi',
      goals: {
        purpose: 'להעניק לכל בחור מסגרת חמה של לימוד חסידות, התוועדות וחיבור אישי בכל ליל שישי לאורך השנה.',
        annualTarget: 'סיום לימוד עיוני של 40 מאמרי חסידות נבחרים, עם דגש על יישום מעשי בעבודת השבוע.'
      },
      weeks: weeks,
      booklets: D.buildBooklets(),
      students: buildStudents(weeks),
      eveningLogs: buildEveningLogs(weeks),
      currentWeekIndex: D.CURRENT_WEEK_INDEX
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.weeks && parsed.weeks.length) return parsed;
      }
    } catch (e) {
      console.warn('igud-store: failed to parse saved state, reseeding', e);
    }
    var fresh = freshState();
    save(fresh);
    return fresh;
  }

  function save(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('igud-store: failed to save state', e);
    }
  }

  var state = load();

  function getState() {
    return state;
  }

  function persist() {
    save(state);
  }

  function resetToDemo() {
    state = freshState();
    save(state);
  }

  global.IgudStore = {
    getState: getState,
    persist: persist,
    resetToDemo: resetToDemo
  };
})(window);
