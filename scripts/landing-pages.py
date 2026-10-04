"""Writes the Tiaro landing pages (espadna.com/tiaro-app/: en, fa/, ar/) into web/tiaro-app/.
espadna.com/tiaro-app* is a Worker route to this site (see web/README.md). Run after editing: python3 scripts/landing-pages.py
"""
import html, pathlib
OUT = pathlib.Path(__file__).resolve().parent.parent / 'web' / 'tiaro-app'
SITE = 'https://espadna.com/tiaro-app'
GAME = 'https://tiaro.espadna.com'
L = {
 'fa': dict(path='fa/', dir='rtl', locale='fa_IR', label='فارسی', shots='fa', game_lang='fa',
   name='تیارو', title='تیارو | پازل منطقی روزانه، رایگان',
   desc='تیارو: هر روز یک پازل منطقی تازه. در هر ردیف، ستون و ناحیه‌ی رنگی یک تاج بگذار. رایگان، بدون ثبت‌نام، همین حالا در مرورگر.',
   tag='هر روز یک پازل منطقی تازه 👑',
   play='▶ همین حالا بازی کن', play_sub='رایگان، بدون نصب، در مرورگر',
   stores=[('کافه بازار', 'به‌زودی')],
   shots_title='نگاهی به بازی',
   feats=[('📅','هر روز یک پازل تازه'),('🧠','بدون حدس؛ فقط منطق'),('💡','راهنمایی که یاد می‌دهد'),('🌙','حالت تیره و تقویم شمسی')],
   how='قانون بازی', rules=['در هر <b>ردیف</b> دقیقاً یک تاج بگذار.','در هر <b>ستون</b> دقیقاً یک تاج بگذار.','در هر <b>ناحیه‌ی رنگی</b> دقیقاً یک تاج بگذار.','تاج‌ها هیچ‌وقت به هم نمی‌چسبند، <b>حتی مورب</b>.'],
   faq_title='سؤال‌های رایج',
   faq=[('رایگان است؟','بله. نسخه‌ی وب کاملاً رایگان و بدون تبلیغ است. نسخه‌ی موبایل رایگان است و تبلیغ دارد، ولی هیچ‌وقت وسط پازل تبلیغ نمی‌بینی.'),
        ('ثبت‌نام لازم دارد؟','نه. حساب کاربری ندارد و پیشرفتت فقط روی دستگاه خودت ذخیره می‌شود.'),
        ('اگر گیر کنم چه؟','راهنمای تیارو اول نشان می‌دهد کجا را نگاه کنی، بعد دلیلش را توضیح می‌دهد و در آخر اگر بخواهی حرکت را انجام می‌دهد.'),
        ('چه زبان‌هایی دارد؟','فارسی، انگلیسی و عربی. از تنظیمات بازی می‌شود زبان را عوض کرد.')],
   home='اسپادنا', privacy='حریم خصوصی', privacy_url=GAME+'/privacy-fa', terms='شرایط استفاده', support='پشتیبانی', ldlang='fa'),
 'en': dict(path='', dir='ltr', locale='en_US', label='English', shots='en', game_lang='en',
   name='Tiaro', title='Tiaro | Daily logic puzzle, free',
   desc='Tiaro: a new logic puzzle every day. Place one crown in every row, column and color region. Free, no sign-up, play now in your browser.',
   tag='A new logic puzzle every day 👑',
   play='▶ Play now', play_sub='Free, no install, right in your browser',
   stores=[('App Store','Coming soon'),('Google Play','Coming soon')],
   shots_title='A look inside',
   feats=[('📅','A fresh puzzle every day'),('🧠','No guessing, pure logic'),('💡','Hints that teach'),('🌙','Dark mode & color-blind patterns')],
   how='How to play', rules=['Place exactly one crown in every <b>row</b>.','Place exactly one crown in every <b>column</b>.','Place exactly one crown in every <b>color region</b>.','Crowns never touch, <b>not even diagonally</b>.'],
   faq_title='FAQ',
   faq=[('Is it free?','Yes. The web version is completely free and ad-free. The mobile app is free with ads, and you never see an ad in the middle of a puzzle.'),
        ('Do I need an account?','No. There is no sign-up; your progress stays on your own device.'),
        ('What if I get stuck?','Tiaro’s hints first show you where to look, then explain why, and can make the move for you.'),
        ('Which languages?','English, Arabic and Persian. Switch in the game’s Settings.')],
   home='Espadna', privacy='Privacy', privacy_url=GAME+'/privacy', terms='Terms', support='Support', ldlang='en'),
 'ar': dict(path='ar/', dir='rtl', locale='ar_AR', label='العربية', shots='ar', game_lang='ar',
   name='تيارو', title='تيارو | لغز منطقي يومي مجاني',
   desc='تيارو: لغز منطقي جديد كل يوم. ضع تاجًا واحدًا في كل صف وعمود ومنطقة ملوّنة. مجاني ودون تسجيل، العب الآن في المتصفح.',
   tag='لغز منطقي جديد كل يوم 👑',
   play='▶ العب الآن', play_sub='مجانًا ودون تثبيت، في المتصفح مباشرة',
   stores=[('App Store','قريبًا'),('Google Play','قريبًا')],
   shots_title='لمحة عن اللعبة',
   feats=[('📅','لغز جديد كل يوم'),('🧠','دون تخمين، منطق فقط'),('💡','تلميحات تعلّمك الحل'),('🌙','وضع داكن وأنماط لعمى الألوان')],
   how='طريقة اللعب', rules=['ضع تاجًا واحدًا بالضبط في كل <b>صف</b>.','ضع تاجًا واحدًا بالضبط في كل <b>عمود</b>.','ضع تاجًا واحدًا بالضبط في كل <b>منطقة ملوّنة</b>.','التيجان لا تتلامس أبدًا، <b>ولا حتى قطريًا</b>.'],
   faq_title='أسئلة شائعة',
   faq=[('هل اللعبة مجانية؟','نعم. نسخة الويب مجانية بالكامل ودون إعلانات. تطبيق الجوال مجاني مع إعلانات، ولن ترى إعلانًا في منتصف اللغز أبدًا.'),
        ('هل أحتاج إلى حساب؟','لا. لا يوجد تسجيل، ويبقى تقدّمك على جهازك فقط.'),
        ('ماذا لو علقت؟','تلميحات تيارو تريك أولًا أين تنظر، ثم تشرح السبب، ويمكنها تنفيذ الخطوة عنك.'),
        ('ما اللغات المتوفرة؟','العربية والإنجليزية والفارسية. يمكنك تغيير اللغة من إعدادات اللعبة.')],
   home='إسبادنا', privacy='الخصوصية', privacy_url=GAME+'/privacy', terms='الشروط', support='الدعم', ldlang='ar'),
}
CUR = ' aria-current="page"'
CROWN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.2 17.5 2 7.2l5.4 4.1L12 4.2l4.6 7.1L22 7.2l-1.2 10.3Z" fill="#C9A227"/><rect x="3.2" y="18.6" width="17.6" height="2.2" rx="1" fill="#C9A227"/></svg>'
CSS = """
  @font-face { font-family: Vazirmatn; font-weight: 400 900; font-display: swap; src: url(/tiaro-app/Vazirmatn-Bold.ttf) format("truetype"); }
  :root { --bg:#FAF7F0; --surface:#FFFFFF; --muted:#F1ECE2; --ink:#1F1B16; --text2:#6B645A; --gold:#C9A227; --goldText:#8A6D0B; --border:#E4DDD0;
          --t1:#B9DFA0; --t2:#A8CBF0; --t3:#F5C08A; --t4:#C9B6E6; }
  @media (prefers-color-scheme: dark) { :root { --bg:#1C1A17; --surface:#26231F; --muted:#302C27; --ink:#F3EEE6; --text2:#A69E92; --gold:#E0BD4A; --goldText:#E0BD4A; --border:#3A352F; } }
  * { box-sizing: border-box; }
  html { -webkit-text-size-adjust: 100%; background: var(--bg); }
  body { margin: 0; background: var(--bg); color: var(--ink); line-height: 1.7; font: 17px/1.7 __FONT__; }
  main { max-width: 760px; margin: 0 auto; padding: 16px 16px 48px; }
  nav.top { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; }
  nav.top a.home { color: var(--text2); text-decoration: none; font-weight: 700; font-size: 15px; }
  .langs { display: flex; gap: 6px; }
  .langs a { color: var(--text2); text-decoration: none; font-weight: 700; font-size: 14px; border: 1.5px solid var(--border); border-radius: 999px; padding: 2px 12px; }
  .langs a[aria-current] { background: var(--ink); color: var(--bg); border-color: var(--ink); }
  .hero { text-align: center; padding: 28px 0 8px; }
  .hero img { width: 112px; height: 112px; border-radius: 26px; box-shadow: 0 10px 30px rgba(31,27,22,.18); }
  h1 { display: flex; justify-content: center; align-items: center; gap: 10px; margin: 18px 0 0; font: 700 clamp(44px, 12vw, 64px)/1.2 __TITLEFONT__; }
  h1 svg { width: .8em; height: .8em; }
  .tag { margin: 6px 0 26px; font-size: 20px; color: var(--text2); font-weight: 600; }
  .play { display: block; max-width: 420px; margin: 0 auto; padding: 16px 24px; border-radius: 18px; background: var(--ink); color: var(--bg); text-decoration: none; font-size: 24px; font-weight: 800; }
  .play small { display: block; font-size: 14px; font-weight: 600; opacity: .75; }
  .play:hover { opacity: .92; }
  .stores { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; margin: 14px auto 0; max-width: 420px; }
  .store { flex: 1; min-width: 140px; padding: 10px 14px; border-radius: 14px; background: var(--muted); color: var(--ink); text-decoration: none; font-weight: 700; font-size: 16px; text-align: center; }
  .store small { display: block; color: var(--text2); font-weight: 600; font-size: 12px; }
  h2 { font-size: 24px; margin: 44px 0 14px; }
  .shots { display: flex; gap: 12px; overflow-x: auto; padding: 4px 2px 12px; scroll-snap-type: x mandatory; }
  .shots img { flex: 0 0 auto; width: 200px; height: auto; aspect-ratio: 9/16; border-radius: 18px; border: 1px solid var(--border); scroll-snap-align: start; background: var(--muted); }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-top: 36px; }
  .feat { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: 16px; text-align: center; }
  .feat b { display: block; font-size: 30px; line-height: 1.4; }
  .feat span { font-weight: 700; font-size: 16px; }
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: 8px 20px; }
  .rules { display: grid; gap: 4px; padding: 10px 0; margin: 0; list-style: none; }
  .rules li { display: flex; gap: 12px; align-items: baseline; }
  .rules li::before { content: ""; flex: 0 0 12px; height: 12px; border-radius: 3px; background: var(--t1); transform: translateY(1px); }
  .rules li:nth-child(2)::before { background: var(--t2); } .rules li:nth-child(3)::before { background: var(--t3); } .rules li:nth-child(4)::before { background: var(--t4); }
  details { border-bottom: 1px solid var(--border); padding: 12px 0; }
  details:last-child { border-bottom: 0; }
  summary { cursor: pointer; font-weight: 700; }
  details p { margin: 8px 0 0; color: var(--text2); }
  footer { text-align: center; color: var(--text2); font-size: 14px; margin-top: 48px; }
  footer a { color: var(--text2); }
"""
def page(k):
    c = L[k]; e = html.escape
    fa_font = 'Vazirmatn, Tahoma, "Segoe UI", sans-serif'
    font = fa_font if c['dir'] == 'rtl' else '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    titlefont = fa_font if c['dir'] == 'rtl' else 'Georgia, "Times New Roman", serif'
    css = CSS.replace('__FONT__', font).replace('__TITLEFONT__', titlefont)
    url = f"{SITE}/{c['path']}"
    alts = ''.join(f'\n<link rel="alternate" hreflang="{x}" href="{SITE}/{L[x]["path"]}">' for x in L)
    langs = ''.join(f'<a href="/tiaro-app/{L[x]["path"]}" hreflang="{x}" lang="{x}"{CUR if x == k else ""}>{L[x]["label"]}</a>' for x in L)
    stores = ''.join(f'<span class="store">{e(n)}<small>{e(s)}</small></span>' for n, s in c['stores'])
    shots = ''.join(f'<img src="/tiaro-app/{c["shots"]}-{i}.webp" alt="" width="432" height="768" loading="lazy">' for i in range(1, 5))
    feats = ''.join(f'<div class="feat"><b>{i}</b><span>{e(t)}</span></div>' for i, t in c['feats'])
    rules = ''.join(f'<li><span>{r}</span></li>' for r in c['rules'])
    faq = ''.join(f'<details><summary>{e(q)}</summary><p>{e(a)}</p></details>' for q, a in c['faq'])
    home = '/' + c['path']
    game = f"{GAME}/?lang={c['game_lang']}"
    return f"""<!DOCTYPE html>
<html lang="{k}" dir="{c['dir']}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(c['title'])}</title>
<meta name="description" content="{e(c['desc'])}">
<meta name="theme-color" content="#FAF7F0">
<link rel="canonical" href="{url}">{alts}
<link rel="icon" type="image/png" href="/tiaro-app/favicon.png">
<link rel="apple-touch-icon" href="/tiaro-app/icon.png">
<meta property="og:type" content="website">
<meta property="og:locale" content="{c['locale']}">
<meta property="og:site_name" content="{e(c['name'])}">
<meta property="og:title" content="{e(c['title'])}">
<meta property="og:description" content="{e(c['desc'])}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}/og.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="{SITE}/og.png">
<script type="application/ld+json">{{"@context":"https://schema.org","@type":"VideoGame","name":"{e(c['name'])}","description":"{e(c['desc'])}","inLanguage":"{c['ldlang']}","genre":["Puzzle","Logic"],"gamePlatform":["Web browser","Android","iOS"],"url":"{url}","image":"{SITE}/og.png","publisher":{{"@type":"Organization","name":"Espadna","url":"https://espadna.com/"}},"offers":{{"@type":"Offer","price":"0","priceCurrency":"USD"}}}}</script>
<style>{css}</style>
</head>
<body>
<main>
  <nav class="top"><a class="home" href="{home}">{e(c['home'])}</a><div class="langs">{langs}</div></nav>
  <section class="hero">
    <img src="/tiaro-app/icon.png" alt="" width="112" height="112">
    <h1>{CROWN}{e(c['name'])}</h1>
    <p class="tag">{e(c['tag'])}</p>
    <a class="play" href="{game}">{e(c['play'])}<small>{e(c['play_sub'])}</small></a>
    <div class="stores">{stores}</div>
  </section>
  <section class="grid">{feats}</section>
  <h2>{e(c['shots_title'])}</h2>
  <div class="shots">{shots}</div>
  <h2>{e(c['how'])}</h2>
  <div class="card"><ul class="rules">{rules}</ul></div>
  <h2>{e(c['faq_title'])}</h2>
  <div class="card">{faq}</div>
  <footer>
    <a href="{home}">{e(c['home'])}</a> · <a href="{c['privacy_url']}">{e(c['privacy'])}</a> · <a href="{GAME}/terms">{e(c['terms'])}</a> · <a href="mailto:tiaro.support@gmail.com">{e(c['support'])}</a>
  </footer>
</main>
</body>
</html>
"""
for k in L:
    p = OUT / L[k]['path'] / 'index.html'; p.parent.mkdir(parents=True, exist_ok=True); p.write_text(page(k), encoding='utf-8')
print('ok')
