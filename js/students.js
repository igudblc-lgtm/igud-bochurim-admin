(function (global) {
  'use strict';

  var U = global.IgudUtils;

  function render(container) {
    var state = global.IgudStore.getState();
    var isAdmin = global.IgudAuth.isAdmin();
    var session = global.IgudAuth.getSession();
    var activeBranches = state.branches.filter(function (b) { return b.active; });

    container.innerHTML =
      '<div class="page-head">' +
        '<h1 class="page-title">מצב הבחורים</h1>' +
        '<p class="page-sub">מעקב נוכחות, התקדמות בלימוד וחיווי רמזור ל' + (isAdmin ? 'כל בחורי המסגרת' : 'בחורי הסניף שלך') + '</p>' +
      '</div>' +
      (!isAdmin ? '<div class="branch-badge">סניף: ' + U.escapeHtml(session.branchName || '') + '</div>' : '') +
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
        (isAdmin && activeBranches.length > 1
          ? '<select id="filter-branch"><option value="">כל הסניפים</option>' +
            activeBranches.map(function (b) { return '<option value="' + b.id + '">' + U.escapeHtml(b.name) + '</option>'; }).join('') +
            '</select>'
          : '') +
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
    var branchFilter = container.querySelector('#filter-branch');

    function draw() {
      var statusVal = statusFilter.value;
      var shiurVal = shiurFilter.value;
      var branchVal = branchFilter ? branchFilter.value : (isAdmin ? '' : session.branchId);
      tbody.innerHTML = '';
      state.students
        .filter(function (s) { return !branchVal || s.branchId === branchVal; })
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
    if (branchFilter) branchFilter.addEventListener('change', draw);
    draw();
  }

  global.Igud.screens.students = { render: render, title: 'מצב הבחורים' };
})(window);
