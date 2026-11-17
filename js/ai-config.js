// כתובת השרת המאובטח שמחולל שאלות באמצעות AI, ו"סוד" פשוט לזיהוי בקשות מהאתר שלנו בלבד.
// כל עוד AI_WORKER_URL הוא null, כפתור "חולל שאלות עם AI" באתר יישאר כבוי.
// לאחר פריסת ה-worker (ראו ai-worker/README.md), יש למלא כאן את הכתובת שהתקבלה מ-wrangler deploy.
window.IGUD_AI_CONFIG = {
  workerUrl: null, // לדוגמה: 'https://igud-bochurim-ai.<your-subdomain>.workers.dev'
  appSecret: null  // אותו ערך בדיוק שהוגדר ב-worker עם: wrangler secret put APP_SECRET
};
