// שרת קטן ומאובטח שמייצר שאלות לעיון למאמר חסידות, בסגנון הקבוע של "א חסידישע ליל שישי".
// מפתח ה-API של Anthropic נשמר כאן בלבד (כ-secret של Cloudflare), ולעולם לא נחשף בדפדפן.

const ALLOWED_ORIGINS = [
  'https://igudblc-lgtm.github.io',
  'http://localhost:5173'
];

const STYLE_EXAMPLES = [
  { title: 'באתי לגני', questions: 'מהו הקשר בין ה"גן" שבמאמר לבין המשכן והמקדש?\nמהי משמעות "דירה בתחתונים" כתכלית בריאת העולם?\nבמה מתבטאת חזרת השכינה "לגנה" בזמננו אנו?\nשאלת סיכום: באיזה תחום בחיי היומיום שלך אתה יכול "להכין דירה" לה\' השבוע?' },
  { title: 'פדה בשלום', questions: 'מהי המשמעות הפנימית של "פדה בשלום נפשי"?\nכיצד שונה פדיון "בשלום" מפדיון הבא מתוך מלחמה וניגוד?\nמה הקשר בין פדיון נפשי פרטי לגאולה כללית?\nשאלת סיכום: היכן בחייך אתה זקוק ל"פדיון בשלום" ולא במאבק?' },
  { title: 'היוצר אור ובורא חושך', questions: 'כיצד "אור וחושך" נבראים משורש אחד, לפי המאמר?\nמה הלקח מכך שהקב"ה "בורא" את החושך ולא רק "יוצר" את האור?\nשאלת סיכום: כיצד אתה הופך "חושך" אישי לכלי לגילוי אור?' },
  { title: 'שובה ישראל', questions: 'מדוע "שובה" ולא "חזור" או "שוב"?\nמה ההבדל בין תשובה מיראה לתשובה מאהבה?\nשאלת סיכום: לאן אתה מרגיש שאתה צריך "לשוב" השנה?' }
];

function buildSystemPrompt() {
  var examplesText = STYLE_EXAMPLES.map(function (ex) {
    return 'מאמר: "' + ex.title + '"\nשאלות:\n' + ex.questions;
  }).join('\n\n---\n\n');

  return (
    'אתה כותב שאלות לעיון על מאמרי חסידות, עבור חוברת הלימוד השבועית "א חסידישע ליל שישי" ' +
    'של ארגון איגוד בחורים לומדי חסידות. הקהל הוא בחורי ישיבה הלומדים את המאמר בחבורה בליל שישי.\n\n' +
    'סגנון קבוע שיש לשמור עליו בדייקנות, לפי הדוגמאות האמיתיות הבאות מחוברות קודמות:\n\n' +
    examplesText +
    '\n\n---\n\n' +
    'כללים:\n' +
    '1. כתוב בדיוק 3 שאלות תוכן על המאמר, ולאחריהן שורה רביעית שמתחילה במילים "שאלת סיכום: " ושואלת שאלה אישית/יישומית (לא שאלת תוכן).\n' +
    '2. כל שאלה בשורה נפרדת, ללא מספור וללא תבליטים.\n' +
    '3. עברית בלבד, רשמית-חמה, בגוף שני יחיד זכר ("אתה"), בדיוק כמו בדוגמאות.\n' +
    '4. שאלות התוכן מתייחסות לעומק הפנימי של המאמר (לא לעובדות יבשות), ומנוסחות בקיצור (שורה אחת לכל שאלה).\n' +
    '5. אל תוסיף כל טקסט נוסף - לא כותרת, לא הסבר, לא מספור, לא מירכאות סביב התשובה כולה. רק 4 השורות עצמן.'
  );
}

function corsHeaders(origin) {
  var allow = ALLOWED_ORIGINS.indexOf(origin) > -1 ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-App-Secret',
    'Content-Type': 'application/json; charset=utf-8'
  };
}

export default {
  async fetch(request, env) {
    var origin = request.headers.get('Origin') || '';
    var headers = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: headers });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'method not allowed' }), { status: 405, headers: headers });
    }

    if (env.APP_SECRET && request.headers.get('X-App-Secret') !== env.APP_SECRET) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: headers });
    }

    var body;
    try {
      body = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'invalid json' }), { status: 400, headers: headers });
    }

    var maamarName = (body && body.maamarName ? String(body.maamarName) : '').trim();
    var maamarText = (body && body.maamarText ? String(body.maamarText) : '').trim();

    if (!maamarName) {
      return new Response(JSON.stringify({ error: 'maamarName is required' }), { status: 400, headers: headers });
    }

    var userPrompt = 'שם המאמר: "' + maamarName + '"' +
      (maamarText ? ('\n\nתוכן המאמר (או תמצית ממנו):\n' + maamarText.slice(0, 12000)) : '\n\n(לא סופק תוכן המאמר - הסתמך על שמו ועל הידע הכללי שלך על מאמרי חסידות בשם זה, ואם אינך בטוח בתוכן המדויק, כתוב שאלות כלליות יותר שעדיין מתאימות לנושא העולה משמו.)') +
      '\n\nכתוב כעת 3 שאלות תוכן + שאלת סיכום אחת, לפי הסגנון וההנחיות.';

    var anthropicRes;
    try {
      anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-5-5',
          max_tokens: 500,
          system: buildSystemPrompt(),
          messages: [{ role: 'user', content: userPrompt }]
        })
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'network error calling anthropic' }), { status: 502, headers: headers });
    }

    if (!anthropicRes.ok) {
      var errText = await anthropicRes.text();
      return new Response(JSON.stringify({ error: 'anthropic error', detail: errText }), { status: 502, headers: headers });
    }

    var data = await anthropicRes.json();
    var text = (data && data.content && data.content[0] && data.content[0].text) ? data.content[0].text.trim() : '';

    if (!text) {
      return new Response(JSON.stringify({ error: 'empty response from model' }), { status: 502, headers: headers });
    }

    return new Response(JSON.stringify({ questions: text }), { status: 200, headers: headers });
  }
};
