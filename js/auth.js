(function (global) {
  'use strict';

  var SESSION_KEY = 'igud-session-v1';

  function defaultSession() {
    return { role: 'admin', branchId: null, branchName: null };
  }

  function loadSession() {
    try {
      var raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.role) return parsed;
      }
    } catch (e) {
      console.warn('igud-auth: failed to parse session', e);
    }
    return defaultSession();
  }

  var session = loadSession();

  function saveSession() {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (e) {
      console.warn('igud-auth: failed to save session', e);
    }
  }

  function getSession() {
    return session;
  }

  function isAdmin() {
    return session.role === 'admin';
  }

  function currentBranchId() {
    return session.branchId;
  }

  function getAdminCode() {
    var state = global.IgudStore.getState();
    return (state.security && state.security.adminCode) || '770';
  }

  function checkAdminCode(code) {
    return code === getAdminCode();
  }

  function loginWithCode(code) {
    if (checkAdminCode(code)) {
      session = { role: 'admin', branchId: null, branchName: null };
      saveSession();
      return { ok: true, role: 'admin' };
    }
    var state = global.IgudStore.getState();
    var branch = (state.branches || []).filter(function (b) {
      return b.code && b.code === code && b.active;
    })[0];
    if (branch) {
      session = { role: 'coordinator', branchId: branch.id, branchName: branch.name };
      saveSession();
      return { ok: true, role: 'coordinator', branch: branch };
    }
    return { ok: false };
  }

  function logout() {
    session = defaultSession();
    saveSession();
  }

  global.IgudAuth = {
    getSession: getSession,
    isAdmin: isAdmin,
    currentBranchId: currentBranchId,
    checkAdminCode: checkAdminCode,
    loginWithCode: loginWithCode,
    logout: logout
  };
})(window);
