// Génère les visuels Facebook (paysage) et Instagram (carré 1080) des publications GJM AUTO.
// Charte : fond anthracite, bandes jaunes « chantier », logo GJM AUTO sur carte blanche, police Archivo.
// Usage : node tools/make-social.js <spec.json> <dossier-sortie>
// spec.json = [{ "slug": "2026-12-14-batterie", "kick": "Froid = batterie",
//               "title": "BATTERIE<br><b>PRÊTE POUR L'HIVER ?</b>",      // version Facebook (2 lignes)
//               "titleIg": "BATTERIE<br><b>PRÊTE POUR<br>L'HIVER ?</b>", // version Instagram (lignes plus courtes, optionnel)
//               "lines": ["...", "...", "..."] }]                         // 3 puces courtes
// Sortie : <slug>-fb.jpg (1470x775 @1.5) et <slug>-ig.jpg (1080x1080)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const [, , specPath, outDir] = process.argv;
if (!specPath || !outDir) { console.error('Usage: node tools/make-social.js <spec.json> <dossier-sortie>'); process.exit(1); }
const root = path.join(__dirname, '..');
const b64 = f => fs.readFileSync(path.join(root, f)).toString('base64');
const LOGO = 'data:image/png;base64,' + b64('brand/logo-gjm-auto.png');
const FONT = 'data:font/woff2;base64,' + b64('brand/fonts/archivo-latin-wdth-normal.woff2');
const Y = '#f5b800', D = '#121517';
const base = `@font-face{font-family:Archivo;src:url(${FONT}) format('woff2');font-weight:100 900;font-stretch:62% 125%}
html,body{margin:0;overflow:hidden;background:${D};font-family:Archivo,sans-serif;color:#f4f4f1}
.stripe{position:absolute;left:0;right:0;height:16px;background:repeating-linear-gradient(-45deg,${Y} 0 22px,${D} 22px 44px)}
.top{top:0}.bot{bottom:0}
.card{background:#fff;border-radius:26px;box-shadow:0 12px 40px rgba(0,0,0,.55)}.card img{display:block}
.kick{display:inline-block;background:${Y};color:${D};font-weight:900;font-stretch:80%;letter-spacing:2px;border-radius:6px;text-transform:uppercase}
h1{margin:0;font-weight:900;font-stretch:72%;line-height:.96}h1 b{color:${Y};font-weight:900}
ul{margin:0;padding:0;list-style:none;display:flex;flex-direction:column}
li{font-weight:600;color:#dfe2e4;display:flex;align-items:center}li:before{content:'';background:${Y};border-radius:3px}
.foot{position:absolute;display:flex;justify-content:space-between;font-weight:800;font-stretch:85%}.foot i{font-style:normal;color:${Y}}`;
const foot = `<div class='foot'><span><i>📍</i> Saint-Seurin-sur-l'Isle</span><span><i>☎</i> 05 57 41 07 87</span><span><i>●</i> gjmauto.fr</span></div>`;
const li = l => l.map(x => `<li>${x}</li>`).join('');
const fb = s => `<html><head><meta charset='utf-8'><style>${base}
body{width:1470px;height:775px;background:radial-gradient(ellipse at 72% 45%,#252b2f 0%,${D} 62%)}
.wrap{position:absolute;left:70px;right:70px;top:16px;bottom:16px;display:flex;align-items:center;gap:60px}
.card{padding:16px 22px}.card img{height:270px}.txt{display:flex;flex-direction:column;gap:18px}
.kick{align-self:flex-start;font-size:24px;padding:7px 14px}h1{font-size:76px}ul{gap:10px;margin-top:4px}
li{font-size:27px;gap:14px}li:before{flex:0 0 14px;height:14px}.foot{left:70px;right:70px;bottom:40px;font-size:24px}
</style></head><body><div class='stripe top'></div><div class='wrap'><div class='card'><img src='${LOGO}'></div>
<div class='txt'><span class='kick'>${s.kick}</span><h1>${s.title}</h1><ul>${li(s.lines)}</ul></div></div>${foot}<div class='stripe bot'></div></body></html>`;
const ig = s => `<html><head><meta charset='utf-8'><style>${base}
body{width:775px;height:775px;background:radial-gradient(ellipse at 50% 55%,#252b2f 0%,${D} 70%)}
.stripe{height:14px}.wrap{position:absolute;left:40px;right:40px;top:40px;bottom:84px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;text-align:center}
.card{padding:12px 20px;border-radius:22px}.card img{height:170px}.kick{font-size:20px;padding:6px 12px}h1{font-size:56px;line-height:.98}
ul{gap:9px;align-items:flex-start}li{font-size:21px;gap:12px;text-align:left}li:before{flex:0 0 12px;height:12px}
.foot{left:28px;right:28px;bottom:30px;font-size:18px}
</style></head><body><div class='stripe top'></div><div class='wrap'><div class='card'><img src='${LOGO}'></div>
<span class='kick'>${s.kick}</span><h1>${s.titleIg || s.title}</h1><ul>${li(s.lines)}</ul></div>${foot}<div class='stripe bot'></div></body></html>`;
(async () => {
  const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
  fs.mkdirSync(outDir, { recursive: true });
  const b = await chromium.launch();
  for (const s of spec) {
    for (const [kind, html, vw, vh, dpr] of [['fb', fb(s), 1470, 775, 1.5], ['ig', ig(s), 775, 775, 1080 / 775]]) {
      const p = await b.newPage({ viewport: { width: vw, height: vh }, deviceScaleFactor: dpr });
      await p.setContent(html, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
      const out = path.join(outDir, `${s.slug}-${kind}.jpg`);
      await p.screenshot({ path: out, type: 'jpeg', quality: 88 }); await p.close(); console.log('OK ' + out);
    }
  }
  await b.close();
})();
