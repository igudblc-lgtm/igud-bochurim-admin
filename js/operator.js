(function (global) {
  'use strict';

  var U = global.IgudUtils;
  var CATEGORY_META = {
    purchase: 'מה לקנות',
    print: 'מה להדפיס ולתלות',
    coordination: 'תיאום משפיע / פרנס'
  };

  function renderChecklist(container, week) {
    var card = U.el('div', { class: 'card card-pad' });
    card.appendChild(U.el('div', { class: 'section-title' }, ['צ\'ק-ליסט תפעולי — פרשת ' + week.parsha]));

    ['purchase', 'print', 'coordination'].forEach(function (cat) {
      var tasks = week.tasks.filter(function (t) { return t.category === cat; });
      if (!tasks.length) return;
      var group = U.el('div', { class: 'checklist-group' });
      group.appendChild(U.el('div', { class: 'checklist-group-title' }, [CATEGORY_META[cat]]));
      tasks.forEach(function (task) {
        var row = U.el('label', { class: 'checklist-item' + (task.done ? ' done' : '') }, [
          U.el('input', { type: 'checkbox' }),
          U.el('span', {}, [task.label])
        ]);
        var checkbox = row.querySelector('input');
        checkbox.checked = task.done;
        checkbox.addEventListener('change', function () {
          task.done = checkbox.checked;
          row.classList.toggle('done', task.done);
          global.IgudStore.persist();
        });
        group.appendChild(row);
      });
      card.appendChild(group);
    });

    container.appendChild(card);
  }

  function renderEveningForm(container, state, week) {
    var card = U.el('div', { class: 'card card-pad', id: 'evening-form' });
    card.appendChild(U.el('div', { class: 'section-title' }, ['טופס סיכום ערב']));

    var log = state.eveningLogs[week.id] || { rating: 0, notes: '', participantsCount: 0 };
    if (!state.eveningLogs[week.id]) state.eveningLogs[week.id] = log;

    card.appendChild(U.el('div', { class: 'field-label' }, ['עד כמה חומר הלימוד היה רלוונטי והבחורים התחברו אליו?']));
    var starRow = U.el('div', { class: 'star-row' });
    for (var i = 1; i <= 5; i++) {
      var star = U.el('button', { class: 'star-btn' + (i <= log.rating ? ' filled' : '') }, ['★']);
      (function (value, starEl) {
        starEl.addEventListener('click', function () {
          log.rating = value;
          global.IgudStore.persist();
          Array.prototype.forEach.call(starRow.children, function (child, idx2) {
            child.classList.toggle('filled', idx2 < value);
          });
        });
      })(i, star);
      starRow.appendChild(star);
    }
    card.appendChild(starRow);

    card.appendChild(U.el('div', { class: 'field-label' }, ['הערות חופשיות']));
    var notesArea = U.el('textarea', { class: 'form-control', rows: '3' }, [log.notes]);
    notesArea.addEventListener('input', function () {
      log.notes = notesArea.value;
      global.IgudStore.persist();
    });
    card.appendChild(notesArea);

    card.appendChild(U.el('div', { class: 'field-label', style: 'margin-top:16px;' }, ['סימון מהיר — נוכחות ולימוד המאמר']));
    var quickBox = U.el('div', { class: 'student-quickcheck' });

    state.students.forEach(function (student) {
      var entry = student.attendance.filter(function (a) { return a.weekId === week.id; })[0];
      if (!entry) {
        entry = { weekId: week.id, present: false, learned: false };
        student.attendance.push(entry);
      }
      var row = U.el('div', { class: 'quickcheck-row' });
      row.appendChild(U.el('div', {}, [student.name]));
      var toggles = U.el('div', { class: 'quickcheck-toggles' });

      var presentCb = U.el('input', { type: 'checkbox' });
      presentCb.checked = entry.present;
      var learnedCb = U.el('input', { type: 'checkbox' });
      learnedCb.checked = entry.learned;

      presentCb.addEventListener('change', function () {
        entry.present = presentCb.checked;
        if (!presentCb.checked) {
          entry.learned = false;
          learnedCb.checked = false;
        }
        recomputeStudentStatus(student);
        global.IgudStore.persist();
      });
      learnedCb.addEventListener('change', function () {
        entry.learned = learnedCb.checked;
        global.IgudStore.persist();
      });

      var presentLabel = U.el('label', {}, [presentCb, 'נכח']);
      var learnedLabel = U.el('label', {}, [learnedCb, 'למד את המאמר']);

      toggles.appendChild(presentLabel);
      toggles.appendChild(learnedLabel);
      row.appendChild(toggles);
      quickBox.appendChild(row);
    });

    card.appendChild(quickBox);
    container.appendChild(card);
  }

  function recomputeStudentStatus(student) {
    var history = student.attendance;
    var consecutiveAbsences = 0;
    for (var k = history.length - 1; k >= 0; k--) {
      if (!history[k].present) consecutiveAbsences += 1;
      else break;
    }
    var presentCount = history.filter(function (a) { return a.present; }).length;
    student.attendancePct = Math.round((presentCount / history.length) * 100);
    student.articlesCompleted = history.filter(function (a) { return a.learned; }).length;
    student.consecutiveAbsences = consecutiveAbsences;
    student.status = consecutiveAbsences >= 3 ? 'red' : (consecutiveAbsences === 2 || student.attendancePct < 70 ? 'yellow' : 'green');
  }

  function render(container) {
    var state = global.IgudStore.getState();
    var week = state.weeks[state.currentWeekIndex];

    container.innerHTML =
      '<div class="page-head">' +
        '<h1 class="page-title">אחראי ליל שישי</h1>' +
        '<p class="page-sub">צ\'ק-ליסט תפעולי וטופס סיכום לליל שישי הקרוב — פרשת ' + U.escapeHtml(week.parsha) + '</p>' +
      '</div>' +
      '<div class="operator-grid" id="operator-grid"></div>';

    var grid = container.querySelector('#operator-grid');
    renderChecklist(grid, week);
    renderEveningForm(grid, state, week);
  }

  global.Igud.screens.operator = { render: render, title: 'אחראי ליל שישי' };
})(window);
