# Ein Tsofia Pro - Institutional Edition

מערכת ניתוח פדגוגי חכם עם אמה (Gemini 2.0 Flash)

## 🚀 התקנה והפעלה מקומית

### שלב 1: התקנת Dependencies
```bash
cd ein-tsofia-pro
npm install
```

### שלב 2: הפעלת השרת המקומי
```bash
npm run dev
```

המערכת תרוץ ב: **http://localhost:3001** (או 3000)

---

## 🔑 פרטי כניסה

- **שם משתמש**: `anat`
- **סיסמה**: `anat9`

---

## 📋 מבנה המערכת

### עמודים:
1. **כניסה (`/`)** - אימות פשוט עם הסכמה לתנאי שימוש
2. **העלאה** - גרירת סרטון ועליה לניתוח
3. **עיבוד** - מסך התקדמות עם סטטוס דינמי
4. **דוח** - תצוגה מלאה של הדוח + צ'אט עם אמה

### קומפוננטות:
- `KindergartenResultsView.tsx` - תצוגת הדוח המלא
- `EmmaChatComponent.tsx` - צ'אט אינטראקטיבי עם אמה

### ספריות:
- `lib/firebase.ts` - חיבור ל-Firebase
- `lib/gemini.ts` - אינטגרציה עם Gemini 2.0 Flash + פרומפט אמה

---

## 🧠 הפרומפט של אמה

הפרומפט מוגדר ב-`src/lib/gemini.ts` בקובץ קבוע בשם `EMMA_PROMPT`.

כדי **לשנות את הפרומפט**:
1. פתח את `src/lib/gemini.ts`
2. מצא את המשתנה `const EMMA_PROMPT = ...`
3. ערוך את הטקסט
4. שמור - השינוי יחול מיידית בניתוח הבא

---

## 🎨 עיצוב

העיצוב **זהה** לפרויקט המקורי:
- ✅ פס עליון עם לוגו
- ✅ צבעים: ורוד, סגול, כחול
- ✅ אייקונים ואנימציות
- ✅ כל הסקשנים (ציונים, סיכום, ביקורת משאבים, המלצות)

---

## 🔧 פתרון בעיות

### המערכת לא עולה?
```bash
# בדוק שכל ה-dependencies מותקנים:
npm install

# בדוק שקובץ .env.local קיים
```

### שגיאות Gemini/Firebase?
וודא שקובץ `.env.local` מכיל את כל המפתחות:
```
NEXT_PUBLIC_GEMINI_API_KEY=...
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

---

## 📦 פריסה לעולם (Production)

### Vercel (מומלץ):
```bash
npm install -g vercel
vercel
```

### Build ידני:
```bash
npm run build
npm start
```

---

## 💡 טיפים

- הסרטונים נשמרים זמנית ב-Firebase Storage
- הדוחות נשמרים ב-Firestore
- ניתן לחזור לניתוח ישן דרך Firebase Console

---

היה מוכן! 🚀
