(function (global) {
  'use strict';

  var U = global.IgudUtils;
  var STATUS_OPTIONS = ['בעריכה', 'נשלח לדפוס', 'מוכן לחלוקה', 'טרם הוחל'];

  function printBooklet(monthIndex) {
    var state = global.IgudStore.getState();
    var booklet = state.booklets[monthIndex];
    var monthWeeks = state.weeks.filter(function (w) { return w.monthIndex === monthIndex; });
    var specs = state.printSpecs || {};
    var printRoot = document.getElementById('print-root');

    var weeksHtml = monthWeeks.map(function (w) {
      return '<div style="margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid #ccc;">' +
        '<strong>פרשת ' + U.escapeHtml(w.parsha) + '</strong> — ' + U.escapeHtml(w.maamar) +
        (w.mashpia ? ' · משפיע: ' + U.escapeHtml(w.mashpia) : '') +
      '</div>';
    }).join('');

    var creditPageHtml = specs.publisherName
      ? '<div style="page-break-before:always;height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;direction:rtl;font-family:Heebo,Arial,sans-serif;">' +
          '<div style="font-size:16px;line-height:1.9;color:#555;">חומרי הלימוד באדיבות המו"ל<br>' +
            '<span style="font-size:20px;font-weight:700;color:#16213a;">' + U.escapeHtml(specs.publisherName) + '</span>' +
          '</div>' +
        '</div>'
      : '';

    printRoot.innerHTML =
      '<div style="direction:rtl;font-family:Heebo,Arial,sans-serif;padding:30px;">' +
        '<div style="text-align:center;"><img src="' + global.IGUD_LOGO_DATA_URL + '" style="max-width:200px;height:auto;margin-bottom:10px;"></div>' +
        '<h1 style="text-align:center;">חוברת לימוד חודשית — ' + U.escapeHtml(booklet.monthName) + '</h1>' +
        '<h3 style="text-align:center;color:#555;">א חסידישע ליל שישי</h3>' +
        (specs.scheduleInfo ? '<div style="font-size:12.5px;color:#555;text-align:center;background:#f7f3ea;border-radius:8px;padding:10px 14px;margin:14px 0;">' + U.escapeHtml(specs.scheduleInfo) + '</div>' : '') +
        '<hr>' +
        '<h3>מאמרים ומפגשים</h3>' +
        weeksHtml +
        '<h3>שאלות לעיון וחזרה</h3>' +
        '<p style="white-space:pre-line;line-height:1.8;">' + U.escapeHtml(booklet.reviewQuestions) + '</p>' +
      '</div>' +
      creditPageHtml;

    window.print();
  }

  function openOrDownloadBooklet(idx) {
    var state = global.IgudStore.getState();
    var booklet = state.booklets[idx];
    if (booklet.driveFileId) {
      window.open(U.driveOpenUrl(booklet.driveFileId), '_blank');
    } else {
      printBooklet(idx);
    }
  }

  function editQuestionsModal(booklet) {
    var state = global.IgudStore.getState();
    var monthWeeks = state.weeks.filter(function (w) { return w.monthName === booklet.monthName; });

    global.Igud.openModal('עריכת שאלות — ' + booklet.monthName, function (body, close) {
      var templateOptions = '<option value="">טען משאלון כללי מוכן…</option>' +
        global.IgudData.QUESTION_TEMPLATES.map(function (tpl) {
          return '<option value="' + tpl.id + '">' + U.escapeHtml(tpl.label) + '</option>';
        }).join('');

      var maamarOptions = '<option value="">הוספת שאלון אמיתי לפי מאמר שנלמד החודש…</option>' +
        monthWeeks.map(function (w) {
          return '<option value="' + U.escapeHtml(w.maamar) + '">' + U.escapeHtml('ד"ה ' + w.maamar + ' (פרשת ' + w.parsha + ')') + '</option>';
        }).join('');

      body.innerHTML =
        '<div class="form-group">' +
          '<label class="field-label">שאלון כללי (רשות — ניתן לערוך לאחר הטעינה)</label>' +
          '<select id="q-template" class="form-control">' + templateOptions + '</select>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="field-label">שאלון אמיתי לפי מאמר (מבוסס על סגנון השאלונים שלכם בפועל)</label>' +
          '<select id="q-maamar" class="form-control">' + maamarOptions + '</select>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="field-label">שאלות מיקוד וחזרה לחודש ' + U.escapeHtml(booklet.monthName) + '</label>' +
          '<textarea id="q-text" class="form-control" rows="7">' + U.escapeHtml(booklet.reviewQuestions) + '</textarea>' +
        '</div>' +
        '<div class="modal-footer">' +
          '<button class="btn btn-outline" id="q-regenerate">חידוש אוטומטי מכל מאמרי החודש</button>' +
          '<button class="btn btn-outline" id="q-cancel">ביטול</button>' +
          '<button class="btn btn-primary" id="q-save">שמירה</button>' +
        '</div>';

      var textarea = body.querySelector('#q-text');
      body.querySelector('#q-template').addEventListener('change', function (e) {
        var chosen = global.IgudData.QUESTION_TEMPLATES.filter(function (t) { return t.id === e.target.value; })[0];
        if (chosen) textarea.value = chosen.text;
        e.target.value = '';
      });
      body.querySelector('#q-maamar').addEventListener('change', function (e) {
        var maamar = e.target.value;
        if (!maamar) return;
        var week = monthWeeks.filter(function (w) { return w.maamar === maamar; })[0];
        var qs = global.IgudData.MAAMAR_QUESTIONNAIRES[maamar] || '';
        var block = 'מאמר ד"ה ' + maamar + (week ? (' (פרשת ' + week.parsha + ')') : '') + ':\n' + qs;
        textarea.value = textarea.value ? (textarea.value + '\n\n' + block) : block;
        e.target.value = '';
      });
      body.querySelector('#q-regenerate').addEventListener('click', function () {
        textarea.value = monthWeeks.map(function (w) {
          var qs = global.IgudData.MAAMAR_QUESTIONNAIRES[w.maamar] || '';
          return 'מאמר ד"ה ' + w.maamar + ' (פרשת ' + w.parsha + '):\n' + qs;
        }).join('\n\n');
      });

      body.querySelector('#q-cancel').addEventListener('click', close);
      body.querySelector('#q-save').addEventListener('click', function () {
        booklet.reviewQuestions = textarea.value.trim();
        global.IgudStore.persist();
        close();
        global.Igud.rerender();
      });
    });
  }

  function driveLinkModal(booklet, monthIndex) {
    global.Igud.openModal('קישור ל-Google Drive — ' + booklet.monthName, function (body, close) {
      body.innerHTML =
        '<div class="form-group">' +
          '<div class="field-label">' +
            'הדביקו כאן קישור שיתוף רגיל מ-Google Drive לחוברת המקורית (PDF). המערכת תזהה את הקובץ אוטומטית ותשתמש בו לפתיחה/הורדה, ותנסה למזג אותו עם עמוד השער והשאלות המעודכנים.' +
          '</div>' +
          '<input id="drive-link-input" type="text" class="form-control" placeholder="https://drive.google.com/file/d/..." value="' + U.escapeHtml(booklet.driveLink || '') + '">' +
          '<div id="drive-status" style="margin-top:10px;"></div>' +
        '</div>' +
        '<div class="modal-footer">' +
          '<button class="btn btn-outline" id="drive-cancel">ביטול</button>' +
          '<button class="btn btn-primary" id="drive-save">שמירה</button>' +
        '</div>';

      var input = body.querySelector('#drive-link-input');
      var statusBox = body.querySelector('#drive-status');

      function refreshStatus() {
        statusBox.innerHTML = '';
        if (booklet.driveFileId) {
          statusBox.appendChild(U.el('span', { class: 'badge badge-green' }, ['🔗 מקושר ל-Drive']));
        } else {
          statusBox.appendChild(U.el('span', { class: 'badge badge-yellow' }, ['טרם קושר קובץ']));
        }
      }
      refreshStatus();

      body.querySelector('#drive-cancel').addEventListener('click', close);
      body.querySelector('#drive-save').addEventListener('click', function () {
        var raw = input.value.trim();
        if (!raw) {
          booklet.driveLink = null;
          booklet.driveFileId = null;
        } else {
          var fileId = U.parseDriveFileId(raw);
          if (!fileId) {
            window.alert('לא זוהה קישור Drive תקין. ודאו שהעתקתם קישור שיתוף מלא (לדוגמה: https://drive.google.com/file/d/XXXX/view).');
            return;
          }
          booklet.driveLink = raw;
          booklet.driveFileId = fileId;
        }
        global.IgudStore.persist();
        close();
        global.Igud.rerender();
      });
    });
  }

  function renderBooklets(container, state) {
    var isAdmin = global.IgudAuth.isAdmin();
    var box = U.el('div', { class: 'card card-pad' });
    box.appendChild(U.el('div', { class: 'section-title' }, ['חוברות לימוד חודשיות']));

    state.booklets.forEach(function (booklet, idx) {
      var row = U.el('div', { class: 'booklet-row' });
      row.appendChild(U.el('div', { class: 'booklet-month' }, [booklet.monthName]));

      if (!isAdmin) {
        row.appendChild(U.el('span', { class: 'badge badge-blue' }, [booklet.status]));
      }

      var select = U.el('select', { class: 'filter-select' });
      var completeBtn = U.el('button', {
        class: 'btn btn-sm complete-btn' + (booklet.status === 'מוכן לחלוקה' ? ' is-done' : ''),
        title: 'סמן את החוברת כהושלמה ומוכנה לחלוקה'
      }, ['✓ הושלם']);

      if (isAdmin) {
        STATUS_OPTIONS.forEach(function (opt) {
          var o = U.el('option', { value: opt }, [opt]);
          if (opt === booklet.status) o.setAttribute('selected', 'selected');
          select.appendChild(o);
        });
        select.style.cssText = 'padding:6px 10px;border-radius:8px;border:1px solid var(--border);font-size:12.5px;';
        select.addEventListener('change', function () {
          booklet.status = select.value;
          global.IgudStore.persist();
          completeBtn.classList.toggle('is-done', booklet.status === 'מוכן לחלוקה');
        });
        row.appendChild(select);

        completeBtn.addEventListener('click', function () {
          booklet.status = 'מוכן לחלוקה';
          select.value = booklet.status;
          completeBtn.classList.add('is-done');
          global.IgudStore.persist();
        });
        row.appendChild(completeBtn);

        var editBtn = U.el('button', { class: 'btn btn-outline btn-sm' }, ['עריכת שאלות']);
        editBtn.addEventListener('click', function () { editQuestionsModal(booklet); });
        row.appendChild(editBtn);

        var driveBtn = U.el('button', { class: 'btn btn-outline btn-sm' + (booklet.driveFileId ? ' has-core' : '') }, [booklet.driveFileId ? '🔗 Drive ✓' : '🔗 קישור ל-Drive']);
        driveBtn.addEventListener('click', function () { driveLinkModal(booklet, idx); });
        row.appendChild(driveBtn);
      } else if (booklet.driveFileId) {
        row.appendChild(U.el('span', { class: 'badge badge-green' }, ['🔗 מקושר ל-Drive']));
      }

      var dlBtn = U.el('button', { class: 'btn btn-primary btn-sm' }, ['הדפסה / הורדה']);
      dlBtn.addEventListener('click', function () { openOrDownloadBooklet(idx); });
      row.appendChild(dlBtn);

      box.appendChild(row);
    });

    var storageNote = U.el('div', { class: 'storage-note' }, [
      'קבצי החוברות המקוריים (PDF גדולים) מקושרים ישירות מ-Google Drive שלכם — ללא העלאה או אחסון כפול. רק נתוני המערכת (לוח שנה, נוכחות, שאלות) נשמרים/מסונכרנים בענן.'
    ]);
    box.appendChild(storageNote);

    container.appendChild(box);
  }

  function renderPosters(container) {
    var section = U.el('div', { id: 'poster-section' });
    section.appendChild(U.el('div', { class: 'section-title', style: 'margin-top:26px;' }, ['מחולל מודעות מהיר']));
    var grid = U.el('div', { class: 'poster-grid' });

    global.IgudData.POSTER_TEMPLATES.forEach(function (tpl) {
      var card = U.el('div', { class: 'card poster-card' });
      var preview = U.el('div', { class: 'poster-preview accent-' + tpl.accent });
      var photoBox = U.el('div', { class: 'poster-preview-photo', style: 'display:none;' });
      var logoImg = U.el('img', { src: global.IGUD_LOGO_DATA_URL, alt: 'איגוד בחורים לומדי חסידות', class: 'poster-logo' });
      var titleLine = U.el('div', { class: 'poster-preview-title' }, ['א חסידישע ליל שישי']);
      var mainLine = U.el('div', { class: 'poster-preview-main' }, [tpl.name]);
      var subLine = U.el('div', { class: 'poster-preview-sub' }, ['']);
      var dedicationLine = U.el('div', { class: 'poster-preview-dedication' }, ['']);
      preview.appendChild(photoBox);
      preview.appendChild(logoImg);
      preview.appendChild(titleLine);
      preview.appendChild(mainLine);
      preview.appendChild(subLine);
      preview.appendChild(dedicationLine);
      card.appendChild(preview);

      var posterImageDataUrl = null;
      var photoWrap = U.el('div', { class: 'poster-field' });
      photoWrap.appendChild(U.el('label', {}, ['תמונה (רשות)']));
      var photoRow = U.el('div', { class: 'photo-attach-row' });
      var photoInput = U.el('input', { type: 'file', accept: 'image/*', style: 'display:none;' });
      var photoAddBtn = U.el('button', { class: 'btn btn-outline btn-sm', type: 'button' }, ['הוספת תמונה']);
      var photoChip = U.el('span', { class: 'file-chip' });

      function refreshPhotoChip() {
        photoChip.innerHTML = '';
        photoBox.innerHTML = '';
        if (posterImageDataUrl) {
          photoBox.style.display = 'block';
          photoBox.appendChild(U.el('img', { src: posterImageDataUrl, alt: '' }));
          var removeBtn = U.el('button', { class: 'file-chip-remove', title: 'הסרת התמונה' }, ['×']);
          removeBtn.addEventListener('click', function () {
            posterImageDataUrl = null;
            photoInput.value = '';
            refreshPhotoChip();
          });
          photoChip.appendChild(U.el('span', { class: 'file-chip-name' }, ['🖼️ תמונה מצורפת']));
          photoChip.appendChild(removeBtn);
        } else {
          photoBox.style.display = 'none';
        }
      }
      photoAddBtn.addEventListener('click', function () { photoInput.click(); });
      photoInput.addEventListener('change', function () {
        var file = photoInput.files[0];
        if (!file) return;
        if (file.size > 15 * 1024 * 1024) {
          window.alert('התמונה גדולה מדי. נא לבחור תמונה קטנה יותר.');
          photoInput.value = '';
          return;
        }
        U.compressImageFile(file).then(function (compressedDataUrl) {
          posterImageDataUrl = compressedDataUrl;
          refreshPhotoChip();
        }).catch(function () {
          window.alert('שגיאה בעיבוד התמונה. נסו קובץ אחר.');
        });
      });
      photoRow.appendChild(photoAddBtn);
      photoRow.appendChild(photoChip);
      photoRow.appendChild(photoInput);
      photoWrap.appendChild(photoRow);
      card.appendChild(photoWrap);

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
        var accentHex = { gold: '#c9a44c', navy: '#1e3a8a', purple: '#7c3aed' }[tpl.accent] || '#c9a44c';
        var printRoot = document.getElementById('print-root');
        printRoot.innerHTML =
          '<div style="height:100vh;box-sizing:border-box;padding:22px;">' +
            '<div style="height:100%;box-sizing:border-box;border:2.5px solid ' + accentHex + ';border-radius:6px;padding:10px;">' +
              '<div style="height:100%;box-sizing:border-box;border:1px solid ' + accentHex + ';border-radius:3px;opacity:1;' +
                'direction:rtl;font-family:Heebo,Arial,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:18px;padding:40px;">' +
                '<img src="' + global.IGUD_LOGO_DATA_URL + '" style="max-width:260px;height:auto;">' +
                (posterImageDataUrl ? '<img src="' + posterImageDataUrl + '" style="max-width:320px;max-height:320px;border-radius:14px;object-fit:cover;">' : '') +
                '<div style="font-size:20px;letter-spacing:2px;color:#555;">א חסידישע ליל שישי</div>' +
                '<div style="font-size:40px;font-weight:800;">' + U.escapeHtml(tpl.name) + '</div>' +
                '<div style="font-size:26px;color:#333;">' + U.escapeHtml(subLine.textContent) + '</div>' +
                (dedicationLine.textContent ? '<div style="font-size:19px;color:#555;font-style:italic;border-top:1px dashed #bbb;padding-top:14px;">' + U.escapeHtml(dedicationLine.textContent) + '</div>' : '') +
              '</div>' +
            '</div>' +
          '</div>';
        window.print();
      });
      card.appendChild(printPosterBtn);
      grid.appendChild(card);
    });

    section.appendChild(grid);
    container.appendChild(section);
  }

  function renderSearch(container, state) {
    var box = U.el('div', { class: 'card card-pad search-card' });
    box.appendChild(U.el('div', { class: 'section-title' }, ['חיפוש חומר לימוד']));
    box.appendChild(U.el('div', { class: 'field-label' }, ['חיפוש לפי חודש, מאמר, פרשה או משפיע — לדוגמה "אייר" או "פדה בשלום"']));
    var input = U.el('input', { type: 'text', class: 'form-control', placeholder: 'מה לומדים בחודש אייר?' });
    var resultsBox = U.el('div', { class: 'search-results' });
    box.appendChild(input);
    box.appendChild(resultsBox);

    function render_results(query) {
      resultsBox.innerHTML = '';
      var q = query.trim();
      if (!q) return;

      var matches = state.weeks.filter(function (w) {
        return w.monthName.indexOf(q) > -1 ||
          w.maamar.indexOf(q) > -1 ||
          w.parsha.indexOf(q) > -1 ||
          (w.mashpia && w.mashpia.indexOf(q) > -1);
      });

      if (!matches.length) {
        resultsBox.appendChild(U.el('div', { class: 'search-empty' }, ['לא נמצאו תוצאות עבור "' + q + '"']));
        return;
      }

      var byMonth = {};
      matches.forEach(function (w) {
        (byMonth[w.monthIndex] = byMonth[w.monthIndex] || []).push(w);
      });

      Object.keys(byMonth).sort(function (a, b) { return a - b; }).forEach(function (key) {
        var monthIndex = Number(key);
        var weeksForMonth = byMonth[monthIndex];
        var booklet = state.booklets[monthIndex];

        var row = U.el('div', { class: 'search-result-row' });
        row.appendChild(U.el('div', { class: 'search-result-month' }, [weeksForMonth[0].monthName + ' · ' + booklet.status]));

        var list = U.el('div', { class: 'search-result-weeks' });
        weeksForMonth.forEach(function (w) {
          list.appendChild(U.el('div', { class: 'search-result-week' }, [
            'פרשת ' + w.parsha + ' — ' + w.maamar + (w.mashpia ? ' (משפיע: ' + w.mashpia + ')' : '')
          ]));
        });
        row.appendChild(list);

        var actions = U.el('div', { class: 'search-result-actions' });
        var openBtn = U.el('button', { class: 'btn btn-primary btn-sm' }, [booklet.fileDataUrl ? 'פתיחת החוברת המצורפת' : 'הפקת חוברת']);
        openBtn.addEventListener('click', function () { openOrDownloadBooklet(monthIndex); });
        var jumpBtn = U.el('button', { class: 'btn btn-outline btn-sm' }, ['צפייה במפת דרכים']);
        jumpBtn.addEventListener('click', function () { global.Igud.navigate('roadmap', { scrollTo: 'month-' + monthIndex }); });
        actions.appendChild(openBtn);
        actions.appendChild(jumpBtn);
        row.appendChild(actions);

        resultsBox.appendChild(row);
      });
    }

    input.addEventListener('input', function () { render_results(input.value); });
    container.appendChild(box);
  }

  function render(container) {
    var state = global.IgudStore.getState();
    container.innerHTML =
      '<div class="page-head">' +
        '<h1 class="page-title">מרכז חוברות ומודעות</h1>' +
        '<p class="page-sub">ניהול חוברות הלימוד החודשיות והפקת מודעות תלייה</p>' +
      '</div>';
    renderSearch(container, state);
    renderBooklets(container, state);
    renderPosters(container);
  }

  global.Igud.screens.print = { render: render, title: 'מרכז חוברות ומודעות' };
  global.Igud.printBooklet = printBooklet;
  global.Igud.editBookletQuestions = editQuestionsModal;
})(window);
