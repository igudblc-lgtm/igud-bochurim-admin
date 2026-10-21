(function (global) {
  'use strict';

  var U = global.IgudUtils;

  function buildNotifications(state) {
    var weeks = state.weeks;
    var idx = state.currentWeekIndex;
    var notes = [];
    var weekWords = ['', 'שבוע', 'שבועיים', '3 שבועות', '4 שבועות', '5 שבועות', '6 שבועות', '7 שבועות', '8 שבועות'];

    for (var i = idx + 1; i < Math.min(weeks.length, idx + 9); i++) {
      var w = weeks[i];
      var diff = i - idx;
      var when = diff === 1 ? 'בעוד שבוע' : 'בעוד ' + weekWords[diff];
      var eventDate = new Date();
      eventDate.setDate(eventDate.getDate() + diff * 7);

      if (w.type === 'special') {
        notes.push({ when: when, color: 'purple', date: eventDate, title: 'ליל שישי חוויתי — פרשת ' + w.parsha, text: 'ליל שישי חוויתי בפרשת ' + w.parsha + ' — יש להתחיל הכנות מיוחדות ולתלות מודעות מראש.' });
      } else if (w.type === 'guest') {
        notes.push({ when: when, color: 'gold', date: eventDate, title: 'משפיע אורח — ' + w.mashpia, text: 'משפיע אורח: ' + w.mashpia + ' (פרשת ' + w.parsha + ') — יש לתלות מודעות ולתאם לוגיסטיקה.' });
      } else if (w.type === 'unity') {
        notes.push({ when: when, color: 'green', date: eventDate, title: 'שבת התאחדות — פרשת ' + w.parsha, text: 'שבת התאחדות בפרשת ' + w.parsha + ' — יש לשריין קמפוס ולתאם מראש.' });
      }
      if (i > idx && weeks[i].monthIndex !== weeks[i - 1].monthIndex) {
        notes.push({ when: when, color: 'blue', date: eventDate, title: 'ראש חודש ' + w.monthName, text: 'ראש חודש ' + w.monthName + ' — יש לשלוח את חוברת הלימוד לדפוס.' });
      }
    }
    return notes.slice(0, 5);
  }

  function computeKpis(state, branchId) {
    var idx = state.currentWeekIndex;
    var lastWeek = state.weeks[idx - 1] || state.weeks[idx];

    var students = branchId ? state.students.filter(function (s) { return s.branchId === branchId; }) : state.students;

    var participants;
    if (branchId) {
      var log = state.eveningLogs[U.branchLogKey(branchId, lastWeek.id)];
      participants = log ? log.participantsCount : '—';
    } else {
      var sum = 0;
      var found = false;
      state.branches.forEach(function (b) {
        var l = state.eveningLogs[U.branchLogKey(b.id, lastWeek.id)];
        if (l) { sum += l.participantsCount; found = true; }
      });
      participants = found ? sum : '—';
    }

    var totalStudents = students.length;
    var learnedCount = students.filter(function (s) {
      var entry = s.attendance.filter(function (a) { return a.weekId === lastWeek.id; })[0];
      return entry && entry.learned;
    }).length;
    var learnedPct = totalStudents ? Math.round((learnedCount / totalStudents) * 100) : 0;

    var needAttention = students.filter(function (s) { return s.consecutiveAbsences >= 2; }).length;

    return { participants: participants, learnedPct: learnedPct, needAttention: needAttention, lastWeekLabel: lastWeek.parsha, studentCount: totalStudents };
  }

  function render(container) {
    var state = global.IgudStore.getState();
    var week = state.weeks[state.currentWeekIndex];
    var typeMeta = U.typeMeta(week.type);
    var notifications = buildNotifications(state);
    var session = global.IgudAuth.getSession();
    var kpis = computeKpis(state, global.IgudAuth.isAdmin() ? null : session.branchId);

    container.innerHTML =
      '<div class="page-head">' +
        '<h1 class="page-title">תא הטייס השבועי</h1>' +
        '<p class="page-sub">מבט מהיר על ליל שישי הקרוב, התראות ציר הזמן והמדדים השבועיים</p>' +
      '</div>' +

      '<div class="hero-card">' +
        '<div class="hero-top">' +
          '<div>' +
            '<div class="hero-eyebrow">ליל שישי הקרוב · פרשת ' + U.escapeHtml(week.parsha) + '</div>' +
            '<div class="hero-parsha">' + U.escapeHtml(week.maamar) + '</div>' +
            '<div class="hero-date">' + U.weekHebrewDateLabel(week) + '</div>' +
          '</div>' +
          '<span class="hero-badge badge-' + typeMeta.color + '">' + typeMeta.label + '</span>' +
        '</div>' +
        '<div class="hero-details">' +
          '<div><div class="hero-detail-label">מאמר נלמד</div><div class="hero-detail-value">' + U.escapeHtml(week.maamar) + '</div></div>' +
          '<div><div class="hero-detail-label">משפיע אורח</div><div class="hero-detail-value">' + (week.mashpia ? U.escapeHtml(week.mashpia) : '—') + '</div></div>' +
          '<div><div class="hero-detail-label">פרנס ליל שישי</div><div class="hero-detail-value">' + (week.farnas ? U.escapeHtml(week.farnas) : 'טרם שובץ') + '</div></div>' +
        '</div>' +
      '</div>' +

      '<div class="quick-actions">' +
        '<button class="btn btn-primary" id="qa-booklet">שלוף חוברת החודש לדפוס</button>' +
        '<button class="btn btn-gold" id="qa-poster">הפק מודעות השבוע</button>' +
        '<button class="btn btn-outline" id="qa-attendance">דיווח נוכחות מהיר</button>' +
      '</div>' +

      '<div class="card card-pad timeline-box">' +
        '<div class="timeline-title">📍 התראות ציר זמן חכמות</div>' +
        '<div id="timeline-list"></div>' +
      '</div>' +

      '<div class="kpi-row">' +
        '<div class="card kpi-card"><div class="kpi-label">משתתפים בשבוע שעבר</div><div class="kpi-value">' + kpis.participants + '</div><div class="kpi-sub">פרשת ' + U.escapeHtml(kpis.lastWeekLabel) + '</div></div>' +
        '<div class="card kpi-card"><div class="kpi-label">אחוז שסיימו את המאמר</div><div class="kpi-value">' + kpis.learnedPct + '%</div><div class="kpi-sub">מתוך ' + kpis.studentCount + ' בחורים</div></div>' +
        '<div class="card kpi-card"><div class="kpi-label">דורשים תשומת לב</div><div class="kpi-value">' + kpis.needAttention + '</div><div class="kpi-sub">החסירו פעמיים ברצף או יותר</div></div>' +
      '</div>';

    var timelineList = container.querySelector('#timeline-list');
    if (!notifications.length) {
      timelineList.innerHTML = '<div class="timeline-item"><div class="timeline-text">אין התראות קרובות כרגע.</div></div>';
    } else {
      notifications.forEach(function (n) {
        var mailBtn = U.el('button', { class: 'timeline-action-btn', title: 'שליחת תזכורת במייל' }, ['✉️']);
        var icsBtn = U.el('button', { class: 'timeline-action-btn', title: 'הוספה ליומן/משימות' }, ['📅']);
        mailBtn.addEventListener('click', function () {
          window.location.href = U.buildMailtoUrl('תזכורת: ' + n.title, n.text + '\n\nנשלח ממערכת הניהול — איגוד בחורים.');
        });
        icsBtn.addEventListener('click', function () {
          U.downloadIcsEvent(n.title, n.text, n.date);
        });

        var row = U.el('div', { class: 'timeline-item' }, [
          U.el('div', { class: 'timeline-dot dot-' + n.color }),
          U.el('div', { class: 'timeline-body' }, [
            U.el('div', { class: 'timeline-text', html: '<strong>' + n.when + ':</strong> ' + U.escapeHtml(n.text) })
          ]),
          U.el('div', { class: 'timeline-actions' }, [mailBtn, icsBtn])
        ]);
        timelineList.appendChild(row);
      });
    }

    container.querySelector('#qa-booklet').addEventListener('click', function () {
      global.Igud.printBooklet(week.monthIndex);
    });
    container.querySelector('#qa-poster').addEventListener('click', function () {
      global.Igud.navigate('print', { scrollTo: 'poster-section' });
    });
    container.querySelector('#qa-attendance').addEventListener('click', function () {
      global.Igud.navigate('operator', { scrollTo: 'evening-form' });
    });
  }

  global.Igud.screens.dashboard = { render: render, title: 'תא הטייס השבועי' };
})(window);
