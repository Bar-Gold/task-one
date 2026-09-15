# כרטיס ביקור דיגיטלי - בר גולדשטיין

אתר אישי בעמוד אחד, מטלה 1 בקורס פיתוח אתרים. כתוב ב-HTML וב-CSS בלבד, בלי JavaScript.

[האתר](https://bar-gold.github.io/task-one/) | [הקוד](https://github.com/Bar-Gold/task-one)

## מבנה

```
index.html
css/
  reset.css          איפוס
  tokens.css         צבעים, גופנים, מרווחים ושתי ערכות הנושא
  style.css          פריסה ורכיבים
assets/
  profile.jpg
  profile-large.jpg
  favicon.svg
  fonts/
```

## מצב בהיר ומצב כהה

ברירת המחדל נקבעת לפי הגדרת מערכת ההפעלה (`prefers-color-scheme`). הכפתור בכותרת הוא תיבת סימון מוסתרת, וכשהיא מסומנת, הסלקטור `#theme-toggle:checked ~ .page` מחליף את משתני הצבע של כל העמוד.

## בדיקות

כלי הבדיקה נמצאים בענף [`tooling`](https://github.com/Bar-Gold/task-one/tree/tooling), כדי שבענף `main` לא יהיה אף קובץ JavaScript.

```bash
git checkout tooling
cd tools
npm install
npm test
```

## גופנים

IBM Plex Sans Hebrew ו-JetBrains Mono, שניהם ברישיון SIL Open Font License 1.1 (`assets/fonts/OFL.txt`).
