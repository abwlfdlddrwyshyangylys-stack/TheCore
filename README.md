# هسته — THE CORE

داشبورد زنده (static living dashboard) برای سیستم ایجنت‌های **THE CORE**.
Persian / RTL · dark neon 2049 aesthetic · بدون سرور، فقط فایل استاتیک.

## اجرا

```bash
cd TheCore
python3 -m http.server 8091
# → http://localhost:8091
```

روی GitHub Pages هم کافی است ریشه همین پوشه را منتشر کنید؛ همه‌ی مسیرها نسبی‌اند.

## ساختار فایل‌ها

| فایل | توضیح |
|---|---|
| `index.html` | ساختار صفحه: هدر (عنوان «هسته — THE CORE» + ساعت زنده تهران)، گرید ایجنت‌ها، بورد ماموریت‌ها، فوتر منشور |
| `css/style.css` | تم نئونی تیره، RTL، اسکن‌لاین استاتیک، مدیا کوئری `prefers-reduced-motion` |
| `js/main.js` | fetch داده‌ها با cache-bust، رندر کارت‌ها/ماموریت‌ها، ساعت تهران، FX بوم سبک |
| `status/agents.json` | کپی از `/data/.hermes/core/status/agents.json` (کپی‌ست، اصلی‌ها دست‌نخورده) |
| `status/board.json` | کپی از `/data/.hermes/core/status/board.json` |
| `fonts/*.woff2` | فونت‌های خودمیزبان Shabnam / Orbitron / Noto Kufi Arabic (بدون CDN) |

## داده در زمان اجرا

`js/main.js` دو فایل را client-side می‌گیرد (هیچ بک‌اندی در کار نیست):

```js
fetch('./status/agents.json?t=' + Date.now(), { cache: 'no-store' })
fetch('./status/board.json?t='   + Date.now(), { cache: 'no-store' })
```

- هر ۱۵ ثانیه خودکار + دکمه‌ی «بازخوانی داده» → با cache-busting.
- «آخرین به‌روزرسانی» = فیلد `updated` در JSON + زمان دریافت (نسبی).
- رنگ‌ها: ایجنت `online=سبز` / `booting=کهربایی` / `offline=قرمز`؛
  ماموریت `todo=کهربایی` / `in_progress=فیروزه‌ای` / `done=سبز` / `blocked=قرمز`.
- `evidence` به‌صورت لیست لینک‌های قابل کلیک رندر می‌شود (لینک‌های http در تب جدید با `noopener`).

## عملکرد / دسترس‌پذیری

- بدون `backdrop-filter` و بدون blur همیشه‌روشن؛ گرادیان‌ها استاتیک.
- Canvas FX: حداکثر ۴۲ ذره، سقف ۳۰fps، توقف کامل وقتی تب مخفی است، DPR سقف ۱.۵.
- `prefers-reduced-motion: reduce` → حلقه‌ی FX اجرا نمی‌شود (یک فریم ثابت) و انیمیشن‌ها خاموش.
- رندر با DOM (نه innerHTML)؛ لینک‌های خارجی فقط `http/https`.

## به‌روزرسانی داده

فایل‌های `status/*.json` را از منبع اصلی کپی کنید (بدون دست زدن به اصلی‌ها):

```bash
cp /data/.hermes/core/status/{agents,board}.json status/
```
