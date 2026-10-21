(function (global) {
  'use strict';

  var U = global.IgudUtils;

  function openWeekModal(week) {
    var editable = global.IgudAuth.isAdmin();
    global.Igud.openModal('שבוע ' + week.weekInMonth + ' · ' + week.monthName + ' · פרשת ' + week.parsha, function (body, close) {
      var typeOptions = ['regular', 'guest', 'special', 'unity'].map(function (t) {
        var meta = U.typeMeta(t);
        return '<option value="' + t + '"' + (week.type === t ? ' selected' : '') + '>' + meta.label + '</option>';
      }).join('');
      var dis = editable ? '' : ' disabled';

      body.innerHTML =
        (!editable ? '<div class="readonly-note">לצפייה בלבד — עריכת מפת הדרכים דורשת הרשאת מנהל.</div>' : '') +
        '<div class="form-group">' +
          '<label class="field-label">סוג המפגש</label>' +
          '<select id="m-type" class="form-control"' + dis + '>' + typeOptions + '</select>' +
        '</div>' +
        '<div class="form-row">' +
          '<div class="form-group">' +
            '<label class="field-label">משפיע אורח (אם רלוונטי)</label>' +
            '<input id="m-mashpia" class="form-control" value="' + U.escapeHtml(week.mashpia) + '"' + dis + '>' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="field-label">פרנס ליל שישי</label>' +
            '<input id="m-farnas" class="form-control" value="' + U.escapeHtml(week.farnas) + '"' + dis + '>' +
          '</div>' +
        '</div>' +
        '<div class="form-row">' +
          '<div class="form-group">' +
            '<label class="field-label">מאמר נלמד (ד"ה)</label>' +
            '<input id="m-maamar" class="form-control" value="' + U.escapeHtml(week.maamar) + '"' + dis + '>' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="field-label">מקור המאמר</label>' +
            '<input id="m-maamar-source" class="form-control" value="' + U.escapeHtml(week.maamarSource || '') + '"' + dis + '>' +
          '</div>' +
        '</div>' +
        '<button class="btn btn-outline btn-sm" id="m-coverpage" type="button" style="margin-bottom:14px;">הפקת דף שער למאמר</button>' +
        '<div class="form-group">' +
          '<label class="field-label">הערות</label>' +
          '<textarea id="m-notes" class="form-control" rows="2"' + dis + '>' + U.escapeHtml(week.notes) + '</textarea>' +
        '</div>' +
        '<div class="modal-footer">' +
          '<button class="btn btn-outline" id="m-cancel">סגירה</button>' +
          (editable ? '<button class="btn btn-primary" id="m-save">שמירה</button>' : '') +
        '</div>';

      body.querySelector('#m-coverpage').addEventListener('click', function () {
        if (editable) {
          week.maamar = body.querySelector('#m-maamar').value.trim();
          week.maamarSource = body.querySelector('#m-maamar-source').value.trim();
        }
        global.Igud.printCoverPage(week.id);
      });

      body.querySelector('#m-cancel').addEventListener('click', close);
      var saveBtn = body.querySelector('#m-save');
      if (saveBtn) {
        saveBtn.addEventListener('click', function () {
          week.type = body.querySelector('#m-type').value;
          week.mashpia = body.querySelector('#m-mashpia').value.trim();
          week.farnas = body.querySelector('#m-farnas').value.trim();
          week.maamar = body.querySelector('#m-maamar').value.trim();
          week.maamarSource = body.querySelector('#m-maamar-source').value.trim();
          week.notes = body.querySelector('#m-notes').value.trim();
          global.IgudStore.persist();
          close();
          global.Igud.rerender();
        });
      }
    });
  }

  function render(container) {
    var state = global.IgudStore.getState();

    container.innerHTML =
      '<div class="page-head">' +
        '<div class="page-head-row">' +
          '<div>' +
            '<h1 class="page-title">מפת דרכים שנתית</h1>' +
            '<p class="page-sub">ציר הזמן השנתי של "א חסידישע ליל שישי" — מאלול ועד אב</p>' +
          '</div>' +
          '<button class="btn btn-outline btn-sm" id="syllabus-btn">הפקת סילבוס לתלמידים</button>' +
        '</div>' +
      '</div>' +
      '<div class="roadmap-banner">' +
        '<div><div class="roadmap-banner-label">מטרת המסגרת</div><div class="roadmap-banner-text">' + U.escapeHtml(state.goals.purpose) + '</div></div>' +
        '<div><div class="roadmap-banner-label">יעד הלימוד השנתי</div><div class="roadmap-banner-text">' + U.escapeHtml(state.goals.annualTarget) + '</div></div>' +
      '</div>' +
      '<div class="legend-row">' +
        ['regular', 'guest', 'special', 'unity'].map(function (t) {
          var meta = U.typeMeta(t);
          return '<div class="legend-item"><span class="legend-dot dot-' + meta.color + '"></span>' + meta.label + '</div>';
        }).join('') +
      '</div>' +
      '<div class="month-jump-row" id="month-jump-row"></div>' +
      '<div id="months-container"></div>';

    container.querySelector('#syllabus-btn').addEventListener('click', function () {
      global.Igud.printSyllabus();
    });

    var jumpRow = container.querySelector('#month-jump-row');
    var monthsContainer = container.querySelector('#months-container');
    var currentMonthIndex = state.weeks[state.currentWeekIndex].monthIndex;

    global.IgudData.HEBREW_MONTHS.forEach(function (monthName, monthIndex) {
      var monthWeeks = state.weeks.filter(function (w) { return w.monthIndex === monthIndex; });
      if (!monthWeeks.length) return;

      var jumpBtn = U.el('button', { class: 'month-jump-chip' + (monthIndex === currentMonthIndex ? ' active' : '') }, [monthName]);
      jumpBtn.addEventListener('click', function () {
        document.getElementById('month-' + monthIndex).scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      jumpRow.appendChild(jumpBtn);

      var section = U.el('div', { class: 'month-section', id: 'month-' + monthIndex });
      var heading = U.el('div', { class: 'month-heading' }, [monthName + (monthIndex === currentMonthIndex ? ' · החודש הנוכחי' : '')]);
      section.appendChild(heading);

      var grid = U.el('div', { class: 'week-grid' });
      monthWeeks.forEach(function (week) {
        var meta = U.typeMeta(week.type);
        var card = U.el('div', { class: 'week-card type-' + week.type }, [
          U.el('div', { class: 'week-card-parsha' }, ['פרשת ' + week.parsha]),
          U.el('div', { class: 'week-card-meta' }, [meta.label])
        ]);
        if (week.id === state.weeks[state.currentWeekIndex].id) {
          card.style.outline = '2px solid #c9a44c';
        }
        var extraText = week.mashpia ? ('משפיע: ' + week.mashpia) : (week.farnas ? ('פרנס: ' + week.farnas) : '');
        if (extraText) card.appendChild(U.el('div', { class: 'week-card-extra' }, [extraText]));
        card.addEventListener('click', function () { openWeekModal(week); });
        grid.appendChild(card);
      });
      section.appendChild(grid);
      monthsContainer.appendChild(section);
    });
  }

  global.Igud.screens.roadmap = { render: render, title: 'מפת דרכים שנתית' };
})(window);
