# שרת ה-AI (ai-worker)

שרת קטן ומאובטח שמחולל שאלות לעיון למאמרי חסידות, בלחיצת כפתור באתר ("עריכת שאלות" בכל חוברת). רץ על Cloudflare Workers — בלי כרטיס אשראי, ובלי חשיפת מפתח ה-API בדפדפן.

## למה צריך שרת נפרד
כפתור "AI" באתר לא יכול לקרוא ישירות ל-Anthropic מהדפדפן, כי זה יחשוף את מפתח ה-API של הארגון לכל מי שיפתח את קוד הדף — ואז כל אחד יוכל להשתמש בו (ולחייב את החשבון). השרת הזה מחזיק את המפתח בצד, ומעביר בקשות בשם האתר בלבד.

## פריסה (פעם אחת)
1. התקנת הכלים: `npm install -g wrangler` (דורש Node.js מותקן).
2. התחברות לחשבון Cloudflare (חינמי, בלי כרטיס אשראי): `wrangler login` — ייפתח דפדפן להתחברות/הרשמה.
3. בתוך תיקיית `ai-worker`:
   - `wrangler secret put ANTHROPIC_API_KEY` — יבקש להדביק את מפתח ה-API מ-console.anthropic.com.
   - `wrangler secret put APP_SECRET` — אפשר להדביק כאן כל מחרוזת אקראית (סיסמה פנימית, לא קריטית, רק מונעת שימוש מקרי מבחוץ).
   - `wrangler deploy`
4. הפקודה האחרונה תדפיס כתובת כמו `https://igud-bochurim-ai.<your-subdomain>.workers.dev` — זו הכתובת שצריך להכניס ל-`js/ai-config.js` (וגם ל-`appSecret`, עם אותה מחרוזת שנבחרה בשלב 3).

## עדכון לאחר הפריסה
ב-`js/ai-config.js`:
```js
window.IGUD_AI_CONFIG = {
  workerUrl: 'https://igud-bochurim-ai.XXXX.workers.dev',
  appSecret: 'המחרוזת שבחרתם למעלה'
};
```
לאחר מכן `git commit` + `git push` כרגיל — ה-worker עצמו לא עובר ב-git push של האתר, הוא רץ בנפרד ב-Cloudflare.

## עלות
- Cloudflare Workers: חינמי עד נפח שימוש גבוה בהרבה ממה שהארגון הזה צריך.
- Anthropic API: תשלום לפי שימוש (כמה אגורות בודדות לכל חילול שאלות). יש להגדיר אמצעי תשלום בחשבון ה-Anthropic בלבד — זה הדבר היחיד בכל הארכיטקטורה הזו שבאמת עולה כסף.
