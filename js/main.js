(function (global) {
  'use strict';

  var contentRoot = document.getElementById('content-root');
  var modalRoot = document.getElementById('modal-root');
  var currentRoute = 'dashboard';

  function renderNav() {
    document.querySelectorAll('.nav-item').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-route') === currentRoute);
    });
  }

  function navigate(route, opts) {
    opts = opts || {};
    if (!global.Igud.screens[route]) route = 'dashboard';
    currentRoute = route;
    renderNav();
    contentRoot.innerHTML = '';
    global.Igud.screens[route].render(contentRoot);
    window.scrollTo(0, 0);
    if (opts.scrollTo) {
      var target = document.getElementById(opts.scrollTo);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function rerender() {
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

  function initResetButton() {
    document.getElementById('reset-demo-btn').addEventListener('click', function () {
      if (window.confirm('לאפס את כל הנתונים חזרה לדמו ההתחלתי? פעולה זו תמחק שינויים שנעשו.')) {
        global.IgudStore.resetToDemo();
        rerender();
      }
    });
  }

  global.Igud.navigate = navigate;
  global.Igud.rerender = rerender;
  global.Igud.openModal = openModal;
  global.Igud.closeModal = closeModal;

  document.addEventListener('DOMContentLoaded', function () {
    initFrameworkSelect();
    initNav();
    initResetButton();
    navigate('dashboard');
  });
})(window);
