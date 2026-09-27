# هسته — THE CORE

داشبورد زنده (static living dashboard) برای سیستم ایجنت‌های **THE CORE**.
ویترین (Showcase) + داشبورد (Dashboard) در دو تب · دوزبانه EN/FA با سوییچر (پیش‌فرض انگلیسی) · مشکی خالص + اکنت طلایی، بدون سرور، فقط فایل استاتیک.

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
| `index.html` | دو نما: ویترین (هیرو + سه باکس قابلیت + دکمهٔ ورود به داشبورد) و داشبورد (گرید ایجنت‌ها + بورد ماموریت‌ها)، هدر با تب‌ها/سوییچر زبان/ساعت تهران، فوتر منشور |
| `css/style.css` | تم مشکی خالص + گرادیان متحرک لطیف (aurora) + اکنت طلایی، تایپوگرافی سریف انگلیسی/وزیر فارسی، مدیا کوئری `prefers-reduced-motion` |
| `js/main.js` | i18n دوزبانه (EN/FA + راست‌به‌چپ/چپ‌به‌راست)، جابه‌جایی تب‌ها، fetch داده‌ها با cache-bust، رندر کارت‌ها/ماموریت‌ها، ساعت تهران، FX بوم سبک |
| `status/agents.json` | کپی از `/data/.hermes/core/status/agents.json` (کپی‌ست، اصلی‌ها دست‌نخورده) |
| `status/board.json` | کپی از `/data/.hermes/core/status/board.json` |
| `fonts/*.woff2` | فونت‌های خودمیزبان Playfair Display (سریف انگلیسی) + Vazirmatn (فارسی) (بدون CDN) |

## داده در زمان اجرا

`js/main.js` دو فایل را client-side می‌گیرد (هیچ بک‌اندی در کار نیست):

```js
fetch('./status/agents.json?t=' + Date.now(), { cache: 'no-store' })
fetch('./status/board.json?t='   + Date.now(), { cache: 'no-store' })
```

- هر ۱۵ ثانیه خودکار + دکمهٔ «Refresh data / بازخوانی داده» → با cache-busting.
- «آخرین به‌روزرسانی» = فیلد `updated` در JSON + زمان دریافت (نسبی).
- رنگ‌ها: ایجنت `online=سبز` / `booting=طلایی` / `offline=خاکستری`؛
  ماموریت `todo=خاکستری` / `in_progress=طلایی` / `done=سبز` / `blocked=قرمز`.
- `evidence` به‌صورت لیست لینک‌های قابل کلیک رندر می‌شود (لینک‌های http در تب جدید با `noopener`).

## عملکرد / دسترس‌پذیری

- `backdrop-filter` فقط روی هدر چسبان (ناحیهٔ کوچک)؛ گرادیان‌های aurora با `transform` متحرک‌اند.
- Canvas FX: حداکثر ۳۴ ذره طلایی، سقف ۳۰fps، توقف کامل وقتی تب مخفی است، DPR سقف ۱.۵.
- `prefers-reduced-motion: reduce` → حلقه‌ی FX اجرا نمی‌شود (یک فریم ثابت) و انیمیشن‌ها خاموش.
- رندر با DOM (نه innerHTML)؛ لینک‌های خارجی فقط `http/https`.

## به‌روزرسانی داده

فایل‌های `status/*.json` را از منبع اصلی کپی کنید (بدون دست زدن به اصلی‌ها):

```bash
cp /data/.hermes/core/status/{agents,board}.json status/
```
