# כרטיס ביקור דיגיטלי - בר גולדשטיין

אתר אישי שנבנה כמטלה 1 בקורס פיתוח אתרים.

[האתר החי](https://bar-gold.github.io/task-one/) | [הקוד](https://github.com/Bar-Gold/task-one)

## בלי JavaScript

כל האתר, כולל המעבר בין מצב בהיר למצב כהה, כתוב ב-HTML ו-CSS בלבד.
בענף `main` אין אף קובץ JavaScript. כלי הבדיקה יושבים בענף נפרד בשם
[`tooling`](https://github.com/Bar-Gold/task-one/tree/tooling).

## מבנה

```
index.html
README.md
css/
  reset.css            איפוס בסיסי
  tokens.css           צבעים, גופנים, מרווחים, ושתי ערכות נושא
  style.css            פריסה ורכיבים
assets/
  profile.jpg          800x800
  profile-large.jpg    1200x1200, בשביל srcset
  favicon.svg
  fonts/               IBM Plex Sans Hebrew ו-JetBrains Mono
```

## איך המעבר בין מצבי התצוגה עובד

מערכת ההפעלה קובעת את ברירת המחדל, והכפתור בכותרת הופך אותה:

```css
:root { /* בהיר */ }
@media (prefers-color-scheme: dark) {
  :root { /* כהה */ }
}

#theme-toggle:checked ~ .page { /* כהה */ }
@media (prefers-color-scheme: dark) {
  #theme-toggle:checked ~ .page { /* בהיר */ }
}
```

תיבת הסימון יושבת מחוץ ל-`.page`, כדי שסלקטור אחים (`~`) יוכל להחליף את
משתני הצבע של כל העמוד. היא מוסתרת ויזואלית אבל עדיין אפשר להגיע אליה ב-Tab
ולהפעיל אותה ברווח.

## עוד כמה דברים בקוד

- הפריסה משתמשת ב-`inline-start` ו-`inline-end` במקום `left` ו-`right`,
  ככה הכל מתהפך נכון ל-RTL בלי גיליון סגנונות שני.
- מילים באנגלית בתוך טקסט עברי מסומנות ב-`dir="ltr"`, אחרת סדר התווים מתבלבל.
- הרשתות משתמשות ב-`minmax(min(Nrem, 100%), 1fr)` כדי שעמודה לא תוכל להיות
  רחבה מהמסך. בלי זה יש גלילה אופקית ב-320px.
- הגופנים שמורים בפרויקט ולא נטענים מ-CDN, ככה האתר נראה אותו דבר גם כשפותחים
  אותו מקובץ ה-ZIP בלי אינטרנט.

## בדיקות

```bash
git checkout tooling
cd tools
npm install
npm test
```

68 בדיקות: דרישות התוכן של המטלה, איסור השימוש ב-JavaScript, יחסי ניגודיות
בשתי ערכות הנושא, ו-`html-validate` יחד עם `stylelint`.

## גופנים

IBM Plex Sans Hebrew ו-JetBrains Mono, שניהם ברישיון SIL Open Font License 1.1.
הרישיון המלא נמצא ב-`assets/fonts/OFL.txt`.
