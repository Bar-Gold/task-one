# כרטיס ביקור דיגיטלי — בר גולדשטיין

אתר אישי המשמש ככרטיס ביקור דיגיטלי מקצועי, שנבנה כמטלה 1 בקורס פיתוח אתרים.

**🔗 [האתר החי](https://bar-gold.github.io/task-one/)** · **[הקוד](https://github.com/Bar-Gold/task-one)**

---

## ⚠️ אין JavaScript באתר

האתר כולו — כולל **המעבר בין מצב כהה למצב בהיר** — ממומש ב־HTML ו־CSS בלבד, כנדרש במטלה.

ענף `main` — זה שמתפרסם ב־GitHub Pages וזה שרואים כאן — **אינו מכיל אף קובץ JavaScript**. כלי הבדיקה יושבים בענף נפרד בשם [`tooling`](https://github.com/Bar-Gold/task-one/tree/tooling), כדי שלא יתערבבו עם קוד האתר.

---

## מבנה הפרויקט

```
├── index.html              העמוד כולו — RTL, תגיות סמנטיות, ללא עיצוב פנימי
├── README.md               הקובץ הזה
├── css/
│   ├── reset.css           איפוס בסיסי
│   ├── tokens.css          מערכת העיצוב: צבעים, טיפוגרפיה, מרווחים + שתי ערכות נושא
│   └── style.css           פריסה ורכיבים
└── assets/
    ├── profile.jpg         תמונת פרופיל, 800×800
    ├── profile-large.jpg   אותה תמונה ב-1200×1200, עבור srcset
    ├── favicon.svg
    └── fonts/
        ├── fonts.css       הגדרות @font-face
        ├── plex-*.woff2    IBM Plex Sans Hebrew (עברית + לטינית, 4 משקלים)
        ├── mono-latin.woff2  JetBrains Mono (משתנה, 400–700)
        └── OFL.txt         רישיון הגופנים — SIL Open Font License 1.1
```

(כלי הבדיקה נמצאים בענף `tooling` בלבד.)

---

## איך המעבר בין מצבי תצוגה עובד — ללא JavaScript

מצב התצוגה נקבע בשני שלבים:

1. **העדפת מערכת ההפעלה קובעת את ברירת המחדל** — דרך `@media (prefers-color-scheme: dark)`.
2. **הכפתור בכותרת הופך את ברירת המחדל.**

```html
<input type="checkbox" id="theme-toggle" class="theme-switch__input">
<div class="page"> … כל תוכן העמוד … </div>
```

```css
:root                          { /* ערכת צבעים בהירה */ }
@media (prefers-color-scheme: dark) {
  :root                        { /* ערכת צבעים כהה   */ }
}

#theme-toggle:checked ~ .page  { /* כהה — הופך ברירת מחדל בהירה */ }
@media (prefers-color-scheme: dark) {
  #theme-toggle:checked ~ .page{ /* בהיר — הופך ברירת מחדל כהה  */ }
}
```

תיבת הסימון יושבת מחוץ ל־`.page` כדי שסלקטור אחים פשוט (`~`) יוכל למפות מחדש את כל משתני הצבע. זו הסיבה שהמנגנון עובד גם בדפדפנים שאינם תומכים ב־`:has()`. התיבה מוסתרת ויזואלית אך נשארת ניתנת למיקוד, כך שאפשר להגיע אליה ב־Tab ולהפעיל אותה ברווח.

---

## החלטות תכנוניות

- **תכונות לוגיות** (`inline-start` / `inline-end`) במקום `left` / `right` — זה מה שמשקף את כל הפריסה ל־RTL בלי גיליון סגנונות שני.
- **קטעים באנגלית בתוך טקסט עברי** מסומנים ב־`dir="ltr"` כדי שסדר התווים לא יתערבב. המפריד בשורת התפקיד **מצויר כאלמנט ולא מוקלד כתו** — תו מפריד בין קטע LTR לקטע RTL נוחת בצד הלא נכון של השורה.
- **גופנים מאוחסנים מקומית** ולא נטענים מ־CDN, כדי שהעמוד ייראה זהה גם כשפותחים אותו מקובץ ה־ZIP ללא חיבור לאינטרנט.
- **תמונת הפרופיל** נשמרה כשהסיבוב "צרוב" בפיקסלים ומטא־נתוני ה־EXIF הוסרו. המקור נשא `EXIF orientation 5`, שדפדפנים מכבדים אך כלים רבים מתעלמים ממנו.
- **כל רשת פריסה** משתמשת ב־`minmax(min(Nrem, 100%), 1fr)` כך שאף עמודה לא יכולה להיות רחבה מהמכל שלה — הסיבה הנפוצה לגלילה אופקית ברוחב 320px.

---

## בדיקות

הבדיקות נמצאות בענף `tooling`, יחד עם עותק של האתר:

```bash
git checkout tooling
cd tools
npm install
npm test
```

68 בדיקות, מסודרות לפי דרישות המטלה:

| קובץ | מה נבדק |
| --- | --- |
| `requirements.test.js` | כל אחת משבע דרישות התוכן, וכן RTL, רספונסיביות, סמנטיקה ו־CSS חיצוני |
| `constraints.test.js` | אפס JavaScript, אפס עיצוב פנימי, אפס משאבים חיצוניים, ורצפת נגישות |
| `contrast.test.js` | יחסי ניגודיות WCAG AA לכל צמד צבעים בשתי ערכות הנושא |
| `validators.test.js` | `html-validate` ו־`stylelint` |

בדיקות נוספות זמינות בנפרד:

```bash
npm run lint:html    # html-validate
npm run lint:css     # stylelint
npm run zip          # בונה מחדש את קובץ ההגשה
```

לאחר עריכת תוכן ב־`main`, מסנכרנים את ענף הבדיקות כך — מעתיקים רק את קבצי
האתר, בלי לגעת ב־`tools/`:

```bash
git checkout tooling
git checkout main -- index.html css assets README.md
cd tools && npm test
```

---

## תמיכה בדפדפנים

נבדק ב־Chrome ברוחבי 320, 390, 768 ו־1440 פיקסלים, בשתי ערכות הנושא. `document.scrollWidth` אינו עולה על `clientWidth` באף רוחב.

---

## קרדיטים

- גופנים: [IBM Plex Sans Hebrew](https://github.com/IBM/plex) ו־[JetBrains Mono](https://github.com/JetBrains/JetBrainsMono), שניהם ברישיון SIL Open Font License 1.1 (ראו `assets/fonts/OFL.txt`).
- אייקונים: SVG מוטבע, נכתב ידנית.
