# קניות

אפליקציית ווב בעברית (RTL) לניהול מלאי הבית ורשימת קניות: מגדירים **מה צריך**, סופרים **מה יש**, והחוסרים הופכים ל**רשימת קניות**.

- React + Vite + TypeScript, PWA עם עבודה אופליין, בלי שרת ובלי חשבונות.
- הנתונים נשמרים ב־localStorage בכל טלפון. רק ״מה צריך״ משותף, באמצעות קישור.
- לוגיקה טהורה ב־`src/logic` עם בדיקות (`npm test`).

## פיתוח

```sh
npm install
npm run dev
npm test
npm run build
```

הפריסה ל־GitHub Pages אוטומטית בכל push ל־`main` (`.github/workflows/deploy.yml`). `base` של Vite הוא `/kniot/`.
האייקונים נוצרים מ־`public/icon.svg` בעזרת `node scripts/icons.mjs`.
