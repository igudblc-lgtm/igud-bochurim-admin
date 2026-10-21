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

  function findReadyForPrintBooklet(state) {
    var idx = state.currentWeekIndex;
    for (var i = idx + 1; i < Math.min(state.weeks.length, idx + 3); i++) {
      if (state.weeks[i].monthIndex !== state.weeks[i - 1].monthIndex) {
        var diff = i - idx;
        if (diff <= 1) {
          var monthIndex = state.weeks[i].monthIndex;
          var booklet = state.booklets[monthIndex];
          if (booklet && booklet.corePdfDataUrl) {
            return { monthIndex: monthIndex, booklet: booklet };
          }
        }
        break;
      }
    }
    return null;
  }

  function openPrintPreviewModal(monthIndex, booklet) {
    global.Igud.openModal('תצוגה מקדימה — חוברת ' + booklet.monthName, function (body, close) {
      body.innerHTML =
        '<div id="preview-status" class="field-label" style="margin-bottom:10px;">מכין תצוגה מקדימה...</div>' +
        '<div id="preview-frame-wrap" style="border:1px solid var(--border);border-radius:8px;overflow:hidden;height:420px;"></div>' +
        '<div class="modal-footer">' +
          '<button class="btn btn-outline" id="preview-edit-questions">עריכת שאלות</button>' +
          '<button class="btn btn-outline" id="preview-close">סגירה</button>' +
        '</div>';

      global.Igud.buildMergedBookletPdf(monthIndex).then(function (result) {
        body.querySelector('#preview-status').textContent = '';
        var frame = document.createElement('iframe');
        frame.src = result.url;
        frame.style.cssText = 'width:100%;height:100%;border:none;';
        body.querySelector('#preview-frame-wrap').appendChild(frame);
      }).catch(function (e) {
        body.querySelector('#preview-status').textContent = 'שגיאה ביצירת התצוגה: ' + e.message;
      });

      body.querySelector('#preview-close').addEventListener('click', close);
      body.querySelector('#preview-edit-questions').addEventListener('click', function () {
        close();
        global.Igud.editBookletQuestions(booklet);
      });
    });
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
    var isAdmin = global.IgudAuth.isAdmin();
    var kpis = computeKpis(state, isAdmin ? null : session.branchId);
    var readyToPrint = isAdmin ? findReadyForPrintBooklet(state) : null;

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
        '<div class="hero-pills">' +
          '<span class="hero-pill">📜 פרשת ' + U.escapeHtml(week.parsha) + '</span>' +
          '<span class="hero-pill">📅 ' + U.weekHebrewDateLabel(week) + '</span>' +
          '<span class="hero-pill">💡 ' + typeMeta.label + '</span>' +
        '</div>' +
        '<div class="hero-details">' +
          '<div><div class="hero-detail-label">מאמר נלמד</div><div class="hero-detail-value">' + U.escapeHtml(week.maamar) + '</div></div>' +
          '<div><div class="hero-detail-label">משפיע אורח</div><div class="hero-detail-value">' + (week.mashpia ? U.escapeHtml(week.mashpia) : '—') + '</div></div>' +
          '<div><div class="hero-detail-label">פרנס ליל שישי</div><div class="hero-detail-value">' + (week.farnas ? U.escapeHtml(week.farnas) : 'טרם שובץ') + '</div></div>' +
        '</div>' +
      '</div>' +

      '<div class="quick-actions">' +
        '<button class="btn btn-primary" id="qa-booklet">🖨️ שלוף חוברת החודש לדפוס</button>' +
        '<button class="btn btn-gold" id="qa-poster">🪧 הפק מודעות השבוע</button>' +
        '<button class="btn btn-outline" id="qa-attendance">✅ דיווח נוכחות מהיר</button>' +
      '</div>' +

      (readyToPrint
        ? '<div class="card card-pad ready-print-card">' +
            '<div class="ready-print-title">✅ מוכן לאישור דפוס</div>' +
            '<div class="ready-print-text">חוברת חודש ' + U.escapeHtml(readyToPrint.booklet.monthName) + ' מוכנה עם תאריכים מעודכנים לשנה זו</div>' +
            '<div class="ready-print-actions">' +
              '<button class="btn btn-outline btn-sm" id="rp-preview">👁️ תצוגה מקדימה ועדכון שאלות</button>' +
              '<button class="btn btn-primary btn-sm" id="rp-approve">✅ אשר והורד קובץ מאוחד לדפוס</button>' +
              '<button class="btn btn-gold btn-sm" id="rp-email">✉️ שלח הזמנה לבית הדפוס</button>' +
            '</div>' +
            '<div id="rp-status" class="field-label" style="margin-top:10px;"></div>' +
          '</div>'
        : '') +

      '<div class="card card-pad timeline-box">' +
        '<div class="timeline-title">📍 התראות ציר זמן חכמות</div>' +
        '<div id="timeline-list"></div>' +
      '</div>' +

      '<div class="kpi-row">' +
        '<div class="card kpi-card"><div class="kpi-icon icon-blue">👥</div><div class="kpi-label">משתתפים בשבוע שעבר</div><div class="kpi-value">' + kpis.participants + '</div><div class="kpi-sub">פרשת ' + U.escapeHtml(kpis.lastWeekLabel) + '</div></div>' +
        '<div class="card kpi-card"><div class="kpi-icon icon-green">📘</div><div class="kpi-label">אחוז שסיימו את המאמר</div><div class="kpi-value">' + kpis.learnedPct + '%</div><div class="kpi-sub">מתוך ' + kpis.studentCount + ' בחורים</div></div>' +
        '<div class="card kpi-card"><div class="kpi-icon icon-red">⚠️</div><div class="kpi-label">דורשים תשומת לב</div><div class="kpi-value">' + kpis.needAttention + '</div><div class="kpi-sub">החסירו פעמיים ברצף או יותר</div></div>' +
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

    if (readyToPrint) {
      var rpStatus = container.querySelector('#rp-status');
      container.querySelector('#rp-preview').addEventListener('click', function () {
        openPrintPreviewModal(readyToPrint.monthIndex, readyToPrint.booklet);
      });
      container.querySelector('#rp-approve').addEventListener('click', function () {
        rpStatus.textContent = 'מכין קובץ מאוחד להדפסה...';
        global.Igud.buildMergedBookletPdf(readyToPrint.monthIndex).then(function (result) {
          rpStatus.textContent = '';
          var link = document.createElement('a');
          link.href = result.url;
          link.download = 'חוברת-' + readyToPrint.booklet.monthName + '-מוכן-לדפוס.pdf';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }).catch(function (e) {
          rpStatus.textContent = 'שגיאה: ' + e.message;
        });
      });
      container.querySelector('#rp-email').addEventListener('click', function () {
        var specs = state.printSpecs;
        var subject = 'הזמנת הדפסה — חוברת ' + readyToPrint.booklet.monthName + ' · א חסידישע ליל שישי';
        var body =
          'שלום,\n\nמבקשים להדפיס את חוברת הלימוד לחודש ' + readyToPrint.booklet.monthName + '.\n\n' +
          'כמות עותקים: ' + specs.quantity + '\n' +
          'גודל נייר: ' + specs.paperSize + '\n' +
          'הנחיות: ' + specs.instructions + '\n\n' +
          'תודה רבה,\nאיגוד בחורים — א חסידישע ליל שישי';
        var mailto = U.buildMailtoUrl(subject, body);
        if (specs.printShopEmail) {
          mailto = mailto.replace('mailto:?', 'mailto:' + encodeURIComponent(specs.printShopEmail) + '?');
        }
        window.location.href = mailto;
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
