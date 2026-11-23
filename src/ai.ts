/* Photo of a handwritten list -> items, via Firebase AI Logic (Gemini Developer API, free tier).
   App Check (reCAPTCHA Enterprise / Fraud Defense key registered for yuvalbigel-p.github.io) is
   enforced on AI Logic, so calls only work from the live site. Loaded lazily to keep startup light. */
import { app } from './sync';

const SITE_KEY = '6LdcES8uAAAAAKFk6fJhaqzfNjMp75SEEdg9yJ95';
export const MODEL = 'gemini-3.5-flash-lite';

const PROMPT = `זו תמונה של רשימת קניות בכתב יד. הרשימה תמיד בעברית.
כל שורה בתמונה היא פריט נפרד.
כתב היד לפעמים לא ברור: כשאות או מילה מתפרשות בכמה דרכים (למשל ל/ק, ר/ד, ו/ז), בחר במוצר המכולת או הסופר הנפוץ והסביר ביותר.
החזר את הפריטים לפי הסדר, כל פריט כפי שנכתב (בלי מספור ובלי סימנים).
אם בשורה כתובה כמות (למשל "2 חלב" או "חלב x2"), החזר אותה בשדה qty ואת שם הפריט בלי המספר. אחרת qty = 1.
התעלם מכותרות, תאריכים, שורות מחוקות, וכיתובים כמו בס״ד / ב״ה / בס"ד בראש הדף - הם אינם פריטים. אם אין רשימה בתמונה, החזר רשימה ריקה.`;

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

/** Downscale to keep uploads small (handwriting stays legible at ~1600px). */
async function toJpeg(file: File): Promise<{ data: string; mimeType: string }> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
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
