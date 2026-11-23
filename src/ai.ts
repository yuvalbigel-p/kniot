/* Photo of a handwritten list -> items, via Firebase AI Logic (Gemini Developer API, free tier).
   App Check (reCAPTCHA Enterprise / Fraud Defense key registered for yuvalbigel-p.github.io) is
   enforced on AI Logic, so calls only work from the live site. Loaded lazily to keep startup light. */
import { app } from './sync';

const SITE_KEY = '6LdcES8uAAAAAKFk6fJhaqzfNjMp75SEEdg9yJ95';
export const MODEL = 'gemini-3.6-flash';

const PROMPT = `זו תמונה של רשימת קניות בכתב יד, בעברית. כל שורה היא פריט נפרד.
המשימה: תמלול מדויק בלבד.
- העתק כל שורה אות באות, בדיוק כפי שנכתבה. אל תנחש, אל תשלים ואל תחליף מילה במילה אחרת, גם אם נראה לך שהתכוונו למשהו אחר.
- אל תוסיף פריטים שלא כתובים, ואל תשמיט שורות.
- אם מספר כתוב בשורה (למשל "2 חלב" או "חלב x2"), שים אותו ב-qty והשאר את שם הפריט בלי המספר. אחרת qty = 1.
- דלג על כיתובים כמו בס״ד / ב״ה בראש הדף, על תאריכים ועל שורות מחוקות.
- אם אין רשימה בתמונה, החזר רשימה ריקה.`;

export interface ScannedItem { name: string; qty: number }

let ready: Promise<(img: { data: string; mimeType: string }) => Promise<ScannedItem[]>> | null = null;

function init() {
  return (ready ??= (async () => {
    const [{ initializeAppCheck, ReCaptchaEnterpriseProvider }, ai] = await Promise.all([import('firebase/app-check'), import('firebase/ai')]);
    initializeAppCheck(app, { provider: new ReCaptchaEnterpriseProvider(SITE_KEY), isTokenAutoRefreshEnabled: true });
    const { getAI, getGenerativeModel, GoogleAIBackend, Schema } = ai;
    const model = getGenerativeModel(getAI(app, { backend: new GoogleAIBackend() }), {
      model: MODEL,
      generationConfig: {
        temperature: 0,
        responseMimeType: 'application/json',
        responseSchema: Schema.array({ items: Schema.object({ properties: { name: Schema.string(), qty: Schema.integer() } }) }),
      },
    });
    return async (img) => {
      const r = await model.generateContent([PROMPT, { type: 'inlineData', inlineData: img }]);
      const parsed: unknown = JSON.parse(r.response.text());
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((x) => ({ name: String(x?.name ?? '').trim(), qty: Math.max(1, Math.min(99, Math.round(Number(x?.qty) || 1))) }))
        .filter((x) => x.name);
    };
  })());
}

/** Downscale to keep uploads small (handwriting stays legible at ~2048px). */
async function toJpeg(file: File): Promise<{ data: string; mimeType: string }> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 2048 / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
  const url = c.toDataURL('image/jpeg', 0.85);
  return { data: url.slice(url.indexOf(',') + 1), mimeType: 'image/jpeg' };
}

export async function scanList(file: File): Promise<ScannedItem[]> {
  const [run, img] = await Promise.all([init(), toJpeg(file)]);
  return run(img);
}
