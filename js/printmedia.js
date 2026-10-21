(function (global) {
  'use strict';

  var U = global.IgudUtils;
  var STATUS_OPTIONS = ['בעריכה', 'נשלח לדפוס', 'מוכן לחלוקה', 'טרם הוחל'];

  function printBooklet(monthIndex) {
    var state = global.IgudStore.getState();
    var booklet = state.booklets[monthIndex];
    var monthWeeks = state.weeks.filter(function (w) { return w.monthIndex === monthIndex; });
    var printRoot = document.getElementById('print-root');

    var weeksHtml = monthWeeks.map(function (w) {
      return '<div style="margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid #ccc;">' +
        '<strong>פרשת ' + U.escapeHtml(w.parsha) + '</strong> — ' + U.escapeHtml(w.maamar) +
        (w.mashpia ? ' · משפיע: ' + U.escapeHtml(w.mashpia) : '') +
      '</div>';
    }).join('');

    printRoot.innerHTML =
      '<div style="direction:rtl;font-family:Heebo,Arial,sans-serif;padding:30px;">' +
        '<h1 style="text-align:center;">חוברת לימוד חודשית — ' + U.escapeHtml(booklet.monthName) + '</h1>' +
        '<h3 style="text-align:center;color:#555;">א חסידישע ליל שישי</h3>' +
        '<hr>' +
        '<h3>מאמרים ומפגשים</h3>' +
        weeksHtml +
        '<h3>שאלות לעיון וחזרה</h3>' +
        '<p>' + U.escapeHtml(booklet.reviewQuestions) + '</p>' +
      '</div>';

    window.print();
  }

  function editQuestionsModal(booklet) {
    global.Igud.openModal('עריכת שאלות — ' + booklet.monthName, function (body, close) {
      body.innerHTML =
        '<div class="form-group">' +
          '<label class="field-label">שאלות מיקוד וחזרה לחודש ' + U.escapeHtml(booklet.monthName) + '</label>' +
          '<textarea id="q-text" class="form-control" rows="5">' + U.escapeHtml(booklet.reviewQuestions) + '</textarea>' +
        '</div>' +
        '<div class="modal-footer">' +
          '<button class="btn btn-outline" id="q-cancel">ביטול</button>' +
          '<button class="btn btn-primary" id="q-save">שמירה</button>' +
        '</div>';
      body.querySelector('#q-cancel').addEventListener('click', close);
      body.querySelector('#q-save').addEventListener('click', function () {
        booklet.reviewQuestions = body.querySelector('#q-text').value.trim();
        global.IgudStore.persist();
        close();
        global.Igud.rerender();
      });
    });
  }

  function renderBooklets(container, state) {
    var box = U.el('div', { class: 'card card-pad' });
    box.appendChild(U.el('div', { class: 'section-title' }, ['חוברות לימוד חודשיות']));

    state.booklets.forEach(function (booklet, idx) {
      var row = U.el('div', { class: 'booklet-row' });
      row.appendChild(U.el('div', { class: 'booklet-month' }, [booklet.monthName]));

      var select = U.el('select', { class: 'filter-select' });
      STATUS_OPTIONS.forEach(function (opt) {
        var o = U.el('option', { value: opt }, [opt]);
        if (opt === booklet.status) o.setAttribute('selected', 'selected');
        select.appendChild(o);
      });
      select.style.cssText = 'padding:6px 10px;border-radius:8px;border:1px solid var(--border);font-size:12.5px;';
      select.addEventListener('change', function () {
        booklet.status = select.value;
        global.IgudStore.persist();
      });
      row.appendChild(select);

      var editBtn = U.el('button', { class: 'btn btn-outline btn-sm' }, ['עריכת שאלות']);
      editBtn.addEventListener('click', function () { editQuestionsModal(booklet); });
      row.appendChild(editBtn);

      var dlBtn = U.el('button', { class: 'btn btn-primary btn-sm' }, ['הדפסה / הורדה']);
      dlBtn.addEventListener('click', function () { printBooklet(idx); });
      row.appendChild(dlBtn);

      box.appendChild(row);
    });

    container.appendChild(box);
  }

  function renderPosters(container) {
    var section = U.el('div', { id: 'poster-section' });
    section.appendChild(U.el('div', { class: 'section-title', style: 'margin-top:26px;' }, ['מחולל מודעות מהיר']));
    var grid = U.el('div', { class: 'poster-grid' });

    global.IgudData.POSTER_TEMPLATES.forEach(function (tpl) {
      var card = U.el('div', { class: 'card poster-card' });
      var preview = U.el('div', { class: 'poster-preview accent-' + tpl.accent });
      var titleLine = U.el('div', { class: 'poster-preview-title' }, ['איגוד בחורים · ליל שישי']);
      var mainLine = U.el('div', { class: 'poster-preview-main' }, [tpl.name]);
      var subLine = U.el('div', { class: 'poster-preview-sub' }, ['']);
      var dedicationLine = U.el('div', { class: 'poster-preview-dedication' }, ['']);
      preview.appendChild(titleLine);
      preview.appendChild(mainLine);
      preview.appendChild(subLine);
      preview.appendChild(dedicationLine);
      card.appendChild(preview);

      var inputs = [];
      tpl.fields.forEach(function (fieldLabel) {
        var wrap = U.el('div', { class: 'poster-field' });
        wrap.appendChild(U.el('label', {}, [fieldLabel]));
        var input = U.el('input', { type: 'text', placeholder: fieldLabel });
        input.addEventListener('input', function () {
          subLine.textContent = inputs.map(function (i) { return i.value; }).filter(Boolean).join(' · ');
        });
        inputs.push(input);
        wrap.appendChild(input);
        card.appendChild(wrap);
      });

      var dedicationSelect = null;
      var dedicationInput = null;
      if (tpl.dedication) {
        var dedWrap = U.el('div', { class: 'poster-field' });
        dedWrap.appendChild(U.el('label', {}, ['הקדשה (רשות)']));
        var dedRow = U.el('div', { class: 'dedication-row' });
        dedicationSelect = U.el('select', { class: 'dedication-select' });
        dedicationSelect.appendChild(U.el('option', { value: '' }, ['ללא הקדשה']));
        global.IgudData.DEDICATION_OPTIONS.forEach(function (opt) {
          dedicationSelect.appendChild(U.el('option', { value: opt }, [opt]));
        });
        dedicationInput = U.el('input', { type: 'text', placeholder: 'שם / פרטי ההקדשה' });

        var updateDedication = function () {
          var text = dedicationSelect.value && dedicationInput.value.trim()
            ? dedicationSelect.value + ' ' + dedicationInput.value.trim()
            : '';
          dedicationLine.textContent = text;
        };
        dedicationSelect.addEventListener('change', updateDedication);
        dedicationInput.addEventListener('input', updateDedication);

        dedRow.appendChild(dedicationSelect);
        dedRow.appendChild(dedicationInput);
        dedWrap.appendChild(dedRow);
        card.appendChild(dedWrap);
      }

      var printPosterBtn = U.el('button', { class: 'btn btn-gold', style: 'width:100%;justify-content:center;' }, ['הדפסת מודעה']);
      printPosterBtn.addEventListener('click', function () {
        var printRoot = document.getElementById('print-root');
        printRoot.innerHTML =
          '<div style="direction:rtl;font-family:Heebo,Arial,sans-serif;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:18px;padding:40px;">' +
            '<div style="font-size:20px;letter-spacing:2px;color:#555;">איגוד בחורים · ליל שישי</div>' +
            '<div style="font-size:40px;font-weight:800;">' + U.escapeHtml(tpl.name) + '</div>' +
            '<div style="font-size:26px;color:#333;">' + U.escapeHtml(subLine.textContent) + '</div>' +
            (dedicationLine.textContent ? '<div style="font-size:19px;color:#555;font-style:italic;border-top:1px dashed #bbb;padding-top:14px;">' + U.escapeHtml(dedicationLine.textContent) + '</div>' : '') +
          '</div>';
        window.print();
      });
      card.appendChild(printPosterBtn);
      grid.appendChild(card);
    });

    section.appendChild(grid);
    container.appendChild(section);
  }

  function render(container) {
    var state = global.IgudStore.getState();
    container.innerHTML =
      '<div class="page-head">' +
        '<h1 class="page-title">מרכז חוברות ומודעות</h1>' +
        '<p class="page-sub">ניהול חוברות הלימוד החודשיות והפקת מודעות תלייה</p>' +
      '</div>';
    renderBooklets(container, state);
    renderPosters(container);
  }

  global.Igud.screens.print = { render: render, title: 'מרכז חוברות ומודעות' };
  global.Igud.printBooklet = printBooklet;
})(window);
