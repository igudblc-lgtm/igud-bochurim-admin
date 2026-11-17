(function (global) {
  'use strict';

  function isConfigured() {
    return !!(global.IGUD_AI_CONFIG && global.IGUD_AI_CONFIG.workerUrl);
  }

  function generateQuestions(maamarName, maamarText) {
    if (!isConfigured()) {
      return Promise.reject(new Error('AI לא מוגדר עדיין. יש להגדיר את js/ai-config.js.'));
    }
    var cfg = global.IGUD_AI_CONFIG;
    return fetch(cfg.workerUrl, {
      method: 'POST',
      headers: Object.assign(
        { 'Content-Type': 'application/json' },
        cfg.appSecret ? { 'X-App-Secret': cfg.appSecret } : {}
      ),
      body: JSON.stringify({ maamarName: maamarName, maamarText: maamarText || '' })
    }).then(function (res) {
      if (!res.ok) {
        return res.json().catch(function () { return {}; }).then(function (err) {
          throw new Error((err && err.error) || ('שגיאת שרת (' + res.status + ')'));
        });
      }
      return res.json();
    }).then(function (data) {
      if (!data || !data.questions) throw new Error('תגובה ריקה מהשרת.');
      return data.questions;
    });
  }

  global.IgudAI = {
    isConfigured: isConfigured,
    generateQuestions: generateQuestions
  };
})(window);
