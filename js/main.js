(function (global) {
  'use strict';

  var contentRoot = document.getElementById('content-root');
  var modalRoot = document.getElementById('modal-root');
  var currentRoute = 'dashboard';

  function renderNav() {
    var isAdmin = global.IgudAuth.isAdmin();
    document.querySelectorAll('.nav-item').forEach(function (btn) {
      var route = btn.getAttribute('data-route');
      btn.classList.toggle('active', route === currentRoute);
      if (btn.hasAttribute('data-admin-only')) {
        btn.style.display = isAdmin ? '' : 'none';
      }
    });
  }

  function navigate(route, opts) {
    opts = opts || {};
    if (!global.Igud.screens[route]) route = 'dashboard';
    if (route === 'admin' && !global.IgudAuth.isAdmin()) route = 'dashboard';
    currentRoute = route;
    renderNav();
    contentRoot.innerHTML = '';
    global.Igud.screens[route].render(contentRoot);
    window.scrollTo(0, 0);
    if (opts.scrollTo) {
      var scrollToTarget = function () {
        requestAnimationFrame(function () {
          var target = document.getElementById(opts.scrollTo);
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      };
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(scrollToTarget);
      } else {
        setTimeout(scrollToTarget, 50);
      }
    }
  }

  function rerender() {
    renderRoleBlock();
    navigate(currentRoute);
  }

  function closeModal() {
    modalRoot.innerHTML = '';
  }

  function openModal(title, renderBody) {
    modalRoot.innerHTML = '';
    var overlay = global.IgudUtils.el('div', { class: 'modal-overlay' });
    var box = global.IgudUtils.el('div', { class: 'modal-box' });
    var head = global.IgudUtils.el('div', { class: 'modal-head' }, [
      global.IgudUtils.el('div', { class: 'modal-title' }, [title]),
      global.IgudUtils.el('button', { class: 'modal-close' }, ['×'])
    ]);
    var body = global.IgudUtils.el('div', { class: 'modal-body' });
    box.appendChild(head);
    box.appendChild(body);
    overlay.appendChild(box);
    modalRoot.appendChild(overlay);

    head.querySelector('.modal-close').addEventListener('click', closeModal);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal();
    });

    renderBody(body, closeModal);
  }

  function initFrameworkSelect() {
    var state = global.IgudStore.getState();
    var select = document.getElementById('framework-select');
    state.frameworks.forEach(function (fw) {
      var opt = document.createElement('option');
      opt.value = fw.id;
      opt.textContent = fw.name;
      if (!fw.active) opt.disabled = true;
      if (fw.id === state.activeFramework) opt.selected = true;
      select.appendChild(opt);
    });
  }

  function initNav() {
    document.querySelectorAll('.nav-item').forEach(function (btn) {
      btn.addEventListener('click', function () {
        navigate(btn.getAttribute('data-route'));
      });
    });
  }

  function openLoginModal() {
    openModal('התחברות למערכת', function (body, close) {
      body.innerHTML =
        '<div class="form-group">' +
          '<div class="field-label">הזינו קוד גישה — קוד מנהל ראשי או קוד סניף בן 4 ספרות</div>' +
          '<input id="login-code" type="password" class="form-control" placeholder="קוד גישה" inputmode="numeric">' +
          '<div id="login-error" style="color:var(--red-600);font-size:12.5px;margin-top:8px;display:none;">קוד לא נמצא, נסו שוב.</div>' +
        '</div>' +
        '<div class="modal-footer">' +
          '<button class="btn btn-outline" id="login-cancel">ביטול</button>' +
          '<button class="btn btn-primary" id="login-confirm">כניסה</button>' +
        '</div>';

      var input = body.querySelector('#login-code');
      var errorBox = body.querySelector('#login-error');

      function trySubmit() {
        var result = global.IgudAuth.loginWithCode(input.value.trim());
        if (result.ok) {
          close();
          rerender();
        } else {
          errorBox.style.display = 'block';
        }
      }

      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') trySubmit();
      });
      body.querySelector('#login-cancel').addEventListener('click', close);
      body.querySelector('#login-confirm').addEventListener('click', trySubmit);
      input.focus();
    });
  }

  function renderRoleBlock() {
    var el = document.getElementById('role-block');
    if (!el) return;
    var session = global.IgudAuth.getSession();
    el.innerHTML = '';
    var label = session.role === 'admin'
      ? 'מחובר כמנהל מערכת'
      : 'רכז סניף: ' + global.IgudUtils.escapeHtml(session.branchName || '');
    el.appendChild(global.IgudUtils.el('div', { class: 'role-label' }, [label]));
    var switchBtn = global.IgudUtils.el('button', { class: 'role-switch-btn' }, ['החלפת משתמש / קוד גישה']);
    switchBtn.addEventListener('click', openLoginModal);
    el.appendChild(switchBtn);
  }

  function initCloudSync() {
    if (!global.IgudCloud || !global.IgudCloud.isConfigured()) return;
    global.IgudCloud.init();
    global.IgudCloud.subscribeState(function (remoteState) {
      global.IgudStore.setState(remoteState, { skipCloudPush: true });
      rerender();
    });
  }

  global.Igud.navigate = navigate;
  global.Igud.rerender = rerender;
  global.Igud.openModal = openModal;
  global.Igud.closeModal = closeModal;

  document.addEventListener('DOMContentLoaded', function () {
    initFrameworkSelect();
    initNav();
    renderRoleBlock();
    renderNav();
    navigate('dashboard');
    initCloudSync();
  });
})(window);
