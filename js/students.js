(function (global) {
  'use strict';

  var U = global.IgudUtils;

  function render(container) {
    var state = global.IgudStore.getState();

    container.innerHTML =
      '<div class="page-head">' +
        '<h1 class="page-title">מצב הבחורים</h1>' +
        '<p class="page-sub">מעקב נוכחות, התקדמות בלימוד וחיווי רמזור לכל בחורי המסגרת</p>' +
      '</div>' +
      '<div class="filter-row">' +
        '<select id="filter-status">' +
          '<option value="">כל הסטטוסים</option>' +
          '<option value="green">מתמיד</option>' +
          '<option value="yellow">בתנודתיות</option>' +
          '<option value="red">חשש נשירה</option>' +
        '</select>' +
        '<select id="filter-shiur">' +
          '<option value="">כל השיעורים</option>' +
          global.IgudData.SHIURIM.map(function (s) { return '<option value="' + U.escapeHtml(s) + '">' + U.escapeHtml(s) + '</option>'; }).join('') +
        '</select>' +
      '</div>' +
      '<div class="card card-pad">' +
        '<table class="students-table">' +
          '<thead><tr>' +
            '<th>שם</th><th>שיעור</th><th>אחוז נוכחות</th><th>מאמרים שהושלמו</th><th>סטטוס</th>' +
          '</tr></thead>' +
          '<tbody id="students-tbody"></tbody>' +
        '</table>' +
      '</div>';

    var tbody = container.querySelector('#students-tbody');
    var statusFilter = container.querySelector('#filter-status');
    var shiurFilter = container.querySelector('#filter-shiur');

    function draw() {
      var statusVal = statusFilter.value;
      var shiurVal = shiurFilter.value;
      tbody.innerHTML = '';
      state.students
        .filter(function (s) { return !statusVal || s.status === statusVal; })
        .filter(function (s) { return !shiurVal || s.shiur === shiurVal; })
        .sort(function (a, b) {
          var order = { red: 0, yellow: 1, green: 2 };
          return order[a.status] - order[b.status];
        })
        .forEach(function (student) {
          var meta = U.statusMeta(student.status);
          var tr = U.el('tr', {}, [
            U.el('td', {}, [student.name]),
            U.el('td', {}, [student.shiur]),
            U.el('td', {}, [student.attendancePct + '%']),
            U.el('td', {}, [String(student.articlesCompleted)]),
            U.el('td', {}, [
              U.el('span', { class: 'badge badge-' + meta.color }, [
                U.el('span', { class: 'status-dot dot-' + meta.color }),
                meta.label
              ])
            ])
          ]);
          tbody.appendChild(tr);
        });
      if (!tbody.children.length) {
        tbody.appendChild(U.el('tr', {}, [U.el('td', { colspan: '5', style: 'text-align:center;color:var(--text-400);padding:24px;' }, ['לא נמצאו בחורים התואמים את הסינון'])]));
      }
    }

    statusFilter.addEventListener('change', draw);
    shiurFilter.addEventListener('change', draw);
    draw();
  }

  global.Igud.screens.students = { render: render, title: 'מצב הבחורים' };
})(window);
