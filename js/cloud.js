(function (global) {
  'use strict';

  var app = null;
  var db = null;
  var storageSvc = null;
  var unsubscribeFn = null;

  function isConfigured() {
    return !!(global.IGUD_FIREBASE_CONFIG && global.IGUD_FIREBASE_CONFIG.apiKey && typeof firebase !== 'undefined');
  }

  function init() {
    if (!isConfigured() || app) return app;
    try {
      app = firebase.initializeApp(global.IGUD_FIREBASE_CONFIG);
      db = firebase.firestore();
      storageSvc = firebase.storage();
    } catch (e) {
      console.warn('igud-cloud: init failed', e);
      app = null;
    }
    return app;
  }

  function stateDocRef() {
    if (!db) return null;
    return db.collection('igud').doc('state');
  }

  function pushState(state) {
    if (!isConfigured()) return Promise.resolve();
    init();
    var ref = stateDocRef();
    if (!ref) return Promise.resolve();
    return ref.set(state).catch(function (e) {
      console.warn('igud-cloud: push failed', e);
      throw e;
    });
  }

  function subscribeState(onRemoteUpdate) {
    if (!isConfigured()) return function () {};
    init();
    var ref = stateDocRef();
    if (!ref) return function () {};
    if (unsubscribeFn) unsubscribeFn();
    unsubscribeFn = ref.onSnapshot(function (snap) {
      if (snap.exists) onRemoteUpdate(snap.data());
    }, function (e) {
      console.warn('igud-cloud: snapshot error', e);
    });
    return unsubscribeFn;
  }

  function uploadFile(path, fileOrBlob) {
    if (!isConfigured()) return Promise.reject(new Error('חיבור הענן אינו מוגדר'));
    init();
    if (!storageSvc) return Promise.reject(new Error('שירות האחסון לא זמין'));
    var ref = storageSvc.ref().child(path);
    return ref.put(fileOrBlob).then(function (snapshot) {
      return snapshot.ref.getDownloadURL();
    });
  }

  global.IgudCloud = {
    isConfigured: isConfigured,
    init: init,
    pushState: pushState,
    subscribeState: subscribeState,
    uploadFile: uploadFile
  };
})(window);
