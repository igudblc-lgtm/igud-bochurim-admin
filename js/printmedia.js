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
        '<p style="white-space:pre-line;line-height:1.8;">' + U.escapeHtml(booklet.reviewQuestions) + '</p>' +
      '</div>';

    window.print();
  }

  function openOrDownloadBooklet(idx) {
    var state = global.IgudStore.getState();
    var booklet = state.booklets[idx];
    if (booklet.fileDataUrl && booklet.fileDataUrl.indexOf('data:') === 0) {
      var link = document.createElement('a');
      link.href = booklet.fileDataUrl;
      link.download = booklet.fileName || (booklet.monthName + '.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (booklet.fileDataUrl) {
      window.open(booklet.fileDataUrl, '_blank');
    } else {
      printBooklet(idx);
    }
  }

  function editQuestionsModal(booklet) {
    global.Igud.openModal('עריכת שאלות — ' + booklet.monthName, function (body, close) {
      var templateOptions = '<option value="">טען משאלון מוכן…</option>' +
        global.IgudData.QUESTION_TEMPLATES.map(function (tpl) {
          return '<option value="' + tpl.id + '">' + U.escapeHtml(tpl.label) + '</option>';
        }).join('');

      body.innerHTML =
        '<div class="form-group">' +
          '<label class="field-label">שאלון מוכן (רשות — ניתן לערוך לאחר הטעינה)</label>' +
          '<select id="q-template" class="form-control">' + templateOptions + '</select>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="field-label">שאלות מיקוד וחזרה לחודש ' + U.escapeHtml(booklet.monthName) + '</label>' +
          '<textarea id="q-text" class="form-control" rows="5">' + U.escapeHtml(booklet.reviewQuestions) + '</textarea>' +
        '</div>' +
        '<div class="modal-footer">' +
          '<button class="btn btn-outline" id="q-cancel">ביטול</button>' +
          '<button class="btn btn-primary" id="q-save">שמירה</button>' +
        '</div>';

      var textarea = body.querySelector('#q-text');
      body.querySelector('#q-template').addEventListener('change', function (e) {
        var chosen = global.IgudData.QUESTION_TEMPLATES.filter(function (t) { return t.id === e.target.value; })[0];
        if (chosen) textarea.value = chosen.text;
        e.target.value = '';
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

  function coreContentModal(booklet, monthIndex) {
    global.Igud.openModal('תוכן קבוע — ' + booklet.monthName, function (body, close) {
      body.innerHTML =
        '<div class="form-group">' +
          '<div class="field-label">' +
            'העמודים הקבועים של המאמר עצמו (PDF) — תוכן זה "יזכר" ויחובר אוטומטית בכל שנה לעמוד השער והשאלות המעודכנים.' +
          '</div>' +
          '<div id="core-status" style="margin:8px 0 14px;"></div>' +
          '<input id="core-file" type="file" accept=".pdf" style="display:none;">' +
          '<div class="admin-btn-row">' +
            '<button class="btn btn-outline btn-sm" id="core-attach">' + (booklet.corePdfName ? 'החלפת קובץ' : 'צירוף קובץ PDF') + '</button>' +
            (booklet.corePdfName ? '<button class="btn btn-danger-outline btn-sm" id="core-remove">הסרה</button>' : '') +
            '<button class="btn btn-gold btn-sm" id="core-preview">תצוגה מקדימה של הקובץ המאוחד</button>' +
          '</div>' +
          '<div id="core-preview-status" class="field-label" style="margin-top:10px;"></div>' +
        '</div>' +
        '<div class="modal-footer">' +
          '<button class="btn btn-outline" id="core-close">סגירה</button>' +
        '</div>';

      var statusBox = body.querySelector('#core-status');
      function refreshStatus() {
        statusBox.innerHTML = '';
        statusBox.appendChild(U.el('span', { class: 'badge ' + (booklet.corePdfName ? 'badge-green' : 'badge-yellow') }, [
          booklet.corePdfName ? ('📄 ' + booklet.corePdfName) : 'עדיין לא צורף תוכן קבוע'
        ]));
      }
      refreshStatus();

      var fileInput = body.querySelector('#core-file');
      body.querySelector('#core-attach').addEventListener('click', function () { fileInput.click(); });
      fileInput.addEventListener('change', function () {
        var file = fileInput.files[0];
        if (!file) return;

        function finish(url) {
          booklet.corePdfName = file.name;
          booklet.corePdfDataUrl = url;
          global.IgudStore.persist();
          refreshStatus();
          fileInput.value = '';
          close();
          global.Igud.rerender();
        }

        if (global.IgudCloud && global.IgudCloud.isConfigured()) {
          global.IgudCloud.init();
          global.IgudCloud.uploadFile('booklets-core/' + booklet.id + '-' + file.name, file).then(finish).catch(function (e) {
            window.alert('העלאה לענן נכשלה: ' + e.message);
          });
          return;
        }

        if (file.size > 8 * 1024 * 1024) {
          window.alert('הקובץ גדול מדי לאחסון מקומי (מקסימום 8MB). חברו קודם את Firebase לקבצים גדולים יותר.');
          fileInput.value = '';
          return;
        }
        var reader = new FileReader();
        reader.onload = function () { finish(reader.result); };
        reader.readAsDataURL(file);
      });

      var removeBtn = body.querySelector('#core-remove');
      if (removeBtn) {
        removeBtn.addEventListener('click', function () {
          booklet.corePdfName = null;
          booklet.corePdfDataUrl = null;
          global.IgudStore.persist();
          close();
          global.Igud.rerender();
        });
      }

      var previewStatus = body.querySelector('#core-preview-status');
      body.querySelector('#core-preview').addEventListener('click', function () {
        var previewTab = window.open('', '_blank');
        if (previewTab) previewTab.document.write('<p style="font-family:sans-serif;padding:20px;">מכין תצוגה מקדימה...</p>');
        previewStatus.textContent = 'מכין תצוגה מקדימה...';
        global.Igud.buildMergedBookletPdf(monthIndex).then(function (result) {
          previewStatus.textContent = '';
          if (previewTab) previewTab.location.href = result.url;
          else window.alert('הדפדפן חסם את פתיחת החלון. אפשרו חלונות קופצים לאתר זה ונסו שוב.');
        }).catch(function (e) {
          previewStatus.textContent = 'שגיאה ביצירת הקובץ: ' + e.message;
          if (previewTab) previewTab.close();
        });
      });

      body.querySelector('#core-close').addEventListener('click', close);
    });
  }

  var MAX_FILE_BYTES = 3 * 1024 * 1024;

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

        var coreBtn = U.el('button', { class: 'btn btn-outline btn-sm' + (booklet.corePdfDataUrl ? ' has-core' : '') }, [booklet.corePdfDataUrl ? '📄 תוכן קבוע ✓' : '📄 תוכן קבוע']);
        coreBtn.addEventListener('click', function () { coreContentModal(booklet, idx); });
        row.appendChild(coreBtn);
      }

      var actionsCell = U.el('div', { class: 'booklet-file-cell' });

      var fileChip = U.el('span', { class: 'file-chip' });
      var fileInput = U.el('input', { type: 'file', accept: '.pdf,.doc,.docx', style: 'display:none;' });

      function refreshFileChip() {
        fileChip.innerHTML = '';
        if (booklet.fileName) {
          fileChip.appendChild(U.el('span', { class: 'file-chip-name' }, ['📎 ' + booklet.fileName]));
          if (isAdmin) {
            var removeBtn = U.el('button', { class: 'file-chip-remove', title: 'הסרת הקובץ המצורף' }, ['×']);
            removeBtn.addEventListener('click', function () {
              booklet.fileName = null;
              booklet.fileDataUrl = null;
              global.IgudStore.persist();
              refreshFileChip();
            });
            fileChip.appendChild(removeBtn);
          }
        }
      }
      refreshFileChip();

      var attachBtn = U.el('button', { class: 'btn btn-outline btn-sm' }, ['צירוף קובץ']);
      attachBtn.addEventListener('click', function () { fileInput.click(); });
      fileInput.addEventListener('change', function () {
        var file = fileInput.files[0];
        if (!file) return;

        if (global.IgudCloud && global.IgudCloud.isConfigured()) {
          if (file.size > 20 * 1024 * 1024) {
            window.alert('הקובץ גדול מדי (מקסימום 20MB).');
            fileInput.value = '';
            return;
          }
          booklet.fileName = file.name;
          global.IgudCloud.init();
          global.IgudCloud.uploadFile('booklets/' + booklet.id + '-' + file.name, file).then(function (url) {
            booklet.fileDataUrl = url;
            global.IgudStore.persist();
            refreshFileChip();
            fileInput.value = '';
          }).catch(function (e) {
            window.alert('העלאה לענן נכשלה: ' + e.message);
            fileInput.value = '';
          });
          return;
        }

        if (file.size > MAX_FILE_BYTES) {
          window.alert('הקובץ גדול מדי לאחסון מקומי (מקסימום 3MB). לחוברות גדולות יותר יש צורך בשרת/אחסון ענן — ניתן בינתיים להמשיך עם ההדפסה האוטומטית.');
          fileInput.value = '';
          return;
        }
        var reader = new FileReader();
        reader.onload = function () {
          booklet.fileName = file.name;
          booklet.fileDataUrl = reader.result;
          global.IgudStore.persist();
          refreshFileChip();
          fileInput.value = '';
        };
        reader.readAsDataURL(file);
      });

      if (isAdmin) {
        actionsCell.appendChild(attachBtn);
        actionsCell.appendChild(fileInput);
      }
      actionsCell.appendChild(fileChip);
      row.appendChild(actionsCell);

      var dlBtn = U.el('button', { class: 'btn btn-primary btn-sm' }, ['הדפסה / הורדה']);
      dlBtn.addEventListener('click', function () { openOrDownloadBooklet(idx); });
      row.appendChild(dlBtn);

      box.appendChild(row);
    });

    var cloudOn = global.IgudCloud && global.IgudCloud.isConfigured();
    var storageNote = U.el('div', { class: 'storage-note' }, [
      cloudOn
        ? 'קבצים מצורפים נשמרים באחסון הענן (Firebase Storage) וזמינים מכל מכשיר מחובר.'
        : 'קבצים מצורפים נשמרים מקומית בדפדפן (localStorage) ומוגבלים ל-3MB לקובץ. לאחסון קבוע וגדול יותר יש לחבר את Firebase (ראו מסך "ניהול מערכת").'
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
      var titleLine = U.el('div', { class: 'poster-preview-title' }, ['איגוד בחורים · ליל שישי']);
      var mainLine = U.el('div', { class: 'poster-preview-main' }, [tpl.name]);
      var subLine = U.el('div', { class: 'poster-preview-sub' }, ['']);
      var dedicationLine = U.el('div', { class: 'poster-preview-dedication' }, ['']);
      preview.appendChild(photoBox);
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
        if (file.size > 3 * 1024 * 1024) {
          window.alert('התמונה גדולה מדי (מקסימום 3MB). נא לבחור תמונה קטנה יותר.');
          photoInput.value = '';
          return;
        }
        var reader = new FileReader();
        reader.onload = function () {
          posterImageDataUrl = reader.result;
          refreshPhotoChip();
        };
        reader.readAsDataURL(file);
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
        var printRoot = document.getElementById('print-root');
        printRoot.innerHTML =
          '<div style="direction:rtl;font-family:Heebo,Arial,sans-serif;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:18px;padding:40px;">' +
            (posterImageDataUrl ? '<img src="' + posterImageDataUrl + '" style="max-width:320px;max-height:320px;border-radius:14px;object-fit:cover;">' : '') +
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
