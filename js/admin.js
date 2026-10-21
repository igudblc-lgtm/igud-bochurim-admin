(function (global) {
  'use strict';

  var U = global.IgudUtils;

  function openPasscodeConfirm(message, onSuccess) {
    global.Igud.openModal('אימות מנהל', function (body, close) {
      body.innerHTML =
        '<div class="form-group">' +
          '<div class="field-label">' + U.escapeHtml(message) + '</div>' +
          '<input id="pc-code" type="password" class="form-control" placeholder="קוד מנהל" inputmode="numeric">' +
          '<div id="pc-error" style="color:var(--red-600);font-size:12.5px;margin-top:8px;display:none;">קוד שגוי, נסו שוב.</div>' +
        '</div>' +
        '<div class="modal-footer">' +
          '<button class="btn btn-outline" id="pc-cancel">ביטול</button>' +
          '<button class="btn btn-primary" id="pc-confirm">אישור</button>' +
        '</div>';

      var input = body.querySelector('#pc-code');
      var errorBox = body.querySelector('#pc-error');

      function trySubmit() {
        if (global.IgudAuth.checkAdminCode(input.value.trim())) {
          close();
          onSuccess();
        } else {
          errorBox.style.display = 'block';
        }
      }

      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') trySubmit();
      });
      body.querySelector('#pc-cancel').addEventListener('click', close);
      body.querySelector('#pc-confirm').addEventListener('click', trySubmit);
      input.focus();
    });
  }

  function renderBranches(container, state) {
    var box = U.el('div', { class: 'card card-pad' });
    box.appendChild(U.el('div', { class: 'section-title' }, ['ניהול סניפים וקודי גישה']));
    box.appendChild(U.el('div', { class: 'field-label' }, ['קוד המנהל הראשי (770 כברירת מחדל) פותח גישה מלאה. כל סניף מקבל קוד בן 4 ספרות המוגבל לנתוני הסניף שלו בלבד.']));

    var list = U.el('div', {});
    state.branches.forEach(function (branch) {
      var row = U.el('div', { class: 'branch-row' + (branch.active ? '' : ' inactive') });
      row.appendChild(U.el('div', { class: 'branch-name' }, [branch.name + (branch.id === global.IgudData.MAIN_BRANCH_ID ? ' (סניף ראשי)' : '')]));
      row.appendChild(U.el('div', { class: 'branch-code' }, [branch.code ? ('קוד: ' + branch.code) : 'ללא קוד נפרד']));

      var actions = U.el('div', { class: 'branch-actions' });
      if (branch.id !== global.IgudData.MAIN_BRANCH_ID || branch.code) {
        var genBtn = U.el('button', { class: 'btn btn-outline btn-sm' }, [branch.code ? 'קוד חדש' : 'יצירת קוד']);
        genBtn.addEventListener('click', function () {
          branch.code = U.randomCode4();
          global.IgudStore.persist();
          global.Igud.rerender();
        });
        actions.appendChild(genBtn);
      }
      if (branch.id !== global.IgudData.MAIN_BRANCH_ID) {
        var toggleBtn = U.el('button', { class: 'btn btn-outline btn-sm' }, [branch.active ? 'השבתה' : 'הפעלה']);
        toggleBtn.addEventListener('click', function () {
          branch.active = !branch.active;
          global.IgudStore.persist();
          global.Igud.rerender();
        });
        actions.appendChild(toggleBtn);
      }
      row.appendChild(actions);
      list.appendChild(row);
    });
    box.appendChild(list);

    var addRow = U.el('div', { class: 'branch-add-row' });
    var nameInput = U.el('input', { type: 'text', class: 'form-control', placeholder: 'שם הסניף החדש' });
    var addBtn = U.el('button', { class: 'btn btn-primary btn-sm' }, ['הוספת סניף']);
    addBtn.addEventListener('click', function () {
      var name = nameInput.value.trim();
      if (!name) { window.alert('נא להזין שם לסניף.'); return; }
      state.branches.push({ id: 'b-' + Date.now(), name: name, code: U.randomCode4(), active: true });
      global.IgudStore.persist();
      global.Igud.rerender();
    });
    addRow.appendChild(nameInput);
    addRow.appendChild(addBtn);
    box.appendChild(addRow);

    container.appendChild(box);
  }

  function renderBackup(container, state) {
    var box = U.el('div', { class: 'card card-pad' });
    box.appendChild(U.el('div', { class: 'section-title' }, ['גיבוי ושחזור נתונים']));

    var exportBtn = U.el('button', { class: 'btn btn-primary btn-sm' }, ['ייצוא גיבוי מלא (JSON)']);
    exportBtn.addEventListener('click', function () {
      var ts = new Date().toISOString().slice(0, 10);
      U.downloadJson('igud-bochurim-גיבוי-' + ts + '.json', state);
    });

    var restoreInput = U.el('input', { type: 'file', accept: '.json', style: 'display:none;' });
    var restoreBtn = U.el('button', { class: 'btn btn-outline btn-sm' }, ['שחזור מגיבוי (JSON)']);
    restoreBtn.addEventListener('click', function () { restoreInput.click(); });
    restoreInput.addEventListener('change', function () {
      var file = restoreInput.files[0];
      if (!file) return;
      U.readFileAsText(file).then(function (text) {
        var parsed;
        try {
          parsed = JSON.parse(text);
        } catch (e) {
          window.alert('קובץ לא תקין — אינו JSON תקני.');
          return;
        }
        if (!parsed || !parsed.weeks || !Array.isArray(parsed.weeks)) {
          window.alert('קובץ הגיבוי אינו בפורמט הנכון.');
          return;
        }
        if (window.confirm('שחזור מגיבוי ידרוס את כל הנתונים הנוכחיים. להמשיך?')) {
          global.IgudStore.setState(parsed);
          global.Igud.rerender();
          window.alert('השחזור הושלם בהצלחה.');
        }
      }).catch(function () {
        window.alert('שגיאה בקריאת הקובץ.');
      });
      restoreInput.value = '';
    });

    box.appendChild(U.el('div', { class: 'admin-btn-row' }, [exportBtn, restoreBtn, restoreInput]));
    container.appendChild(box);
  }

  function renderCloud(container, state) {
    var box = U.el('div', { class: 'card card-pad' });
    box.appendChild(U.el('div', { class: 'section-title' }, ['חיבור לענן (Firebase)']));

    var configured = global.IgudCloud && global.IgudCloud.isConfigured();
    box.appendChild(U.el('div', {
      class: 'badge ' + (configured ? 'badge-green' : 'badge-yellow')
    }, [configured ? 'מחובר ל-Firebase' : 'טרם חובר — ערכו את js/firebase-config.js']));

    var syncBtn = U.el('button', { class: 'btn btn-gold btn-sm', style: 'margin-top:12px;' }, ['סנכרן נתונים מקומיים לענן (Firebase)']);
    var statusLine = U.el('div', { class: 'field-label', style: 'margin-top:10px;' }, ['']);

    syncBtn.addEventListener('click', function () {
      if (!configured) {
        window.alert('יש להגדיר קודם את חיבור Firebase בקובץ js/firebase-config.js.');
        return;
      }
      syncBtn.disabled = true;
      statusLine.textContent = 'מעלה קבצי חוברות מצורפים לאחסון הענן...';

      (async function () {
        var current = global.IgudStore.getState();
        for (var i = 0; i < current.booklets.length; i++) {
          var booklet = current.booklets[i];
          if (booklet.fileDataUrl && booklet.fileDataUrl.indexOf('data:') === 0) {
            try {
              var blob = U.dataUrlToBlob(booklet.fileDataUrl);
              var path = 'booklets/' + booklet.id + '-' + (booklet.fileName || 'file.pdf');
              booklet.fileDataUrl = await global.IgudCloud.uploadFile(path, blob);
            } catch (e) {
              console.warn('sync upload failed', e);
            }
          }
        }
        statusLine.textContent = 'מסנכרן נתונים ל-Firestore...';
        try {
          await global.IgudCloud.pushState(current);
          global.IgudStore.persist({ skipCloudPush: true });
          statusLine.textContent = 'הסנכרון הושלם בהצלחה! הנתונים זמינים כעת מכל מכשיר מחובר.';
        } catch (e) {
          statusLine.textContent = 'שגיאה בסנכרון: ' + e.message;
        }
        syncBtn.disabled = false;
      })();
    });

    box.appendChild(syncBtn);
    box.appendChild(statusLine);
    container.appendChild(box);
  }

  function renderDangerZone(container) {
    var box = U.el('div', { class: 'card card-pad danger-zone' });
    box.appendChild(U.el('div', { class: 'section-title' }, ['אזור מסוכן']));
    var resetBtn = U.el('button', { class: 'btn btn-danger-outline btn-sm' }, ['איפוס נתוני דמו']);
    resetBtn.addEventListener('click', function () {
      openPasscodeConfirm('לביצוע איפוס נתונים יש להזין את קוד המנהל.', function () {
        if (window.confirm('לאפס את כל הנתונים חזרה לדמו ההתחלתי? פעולה זו תמחק שינויים שנעשו.')) {
          global.IgudStore.resetToDemo();
          global.Igud.rerender();
        }
      });
    });
    box.appendChild(resetBtn);
    container.appendChild(box);
  }

  function render(container) {
    var state = global.IgudStore.getState();
    if (!global.IgudAuth.isAdmin()) {
      container.innerHTML =
        '<div class="page-head"><h1 class="page-title">ניהול מערכת</h1></div>' +
        '<div class="card card-pad">אין לך הרשאה לצפות במסך זה.</div>';
      return;
    }

    container.innerHTML =
      '<div class="page-head">' +
        '<h1 class="page-title">ניהול מערכת</h1>' +
        '<p class="page-sub">סניפים וקודי גישה, גיבוי ושחזור, חיבור לענן ואיפוס נתונים — למנהל המערכת בלבד</p>' +
      '</div>';

    renderBranches(container, state);
    renderBackup(container, state);
    renderCloud(container, state);
    renderDangerZone(container);
  }

  global.Igud.screens.admin = { render: render, title: 'ניהול מערכת' };
})(window);
