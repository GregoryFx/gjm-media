// Génère la couverture (1re image du carrousel) d'une annonce véhicule GJM AUTO, au format 16:9 (rendu 1280x720),
// même format que les photos Starterre pour que le carrousel Instagram reste homogène.
// Usage : node tools/make-vo.js <spec.json> <dossier-sortie>
// spec.json = [{ "slug": "c4-145-blanc-408464", "photo": "chemin/ou/url.jpg",
//   "brand": "CITROËN", "model": "C4 Hybride 145 e-DCS6", "version": "Plus · Blanc Okénite / toit noir",
//   "specs": ["05/2025", "17 787 km", "Hybride", "Automatique"], "price": "18 990 €",
//   "badge": "Disponible sur commande", "extra": "Garantie constructeur jusqu'en mai 2027" }]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const [, , specPath, outDir] = process.argv;
if (!specPath || !outDir) { console.error('Usage: node tools/make-vo.js <spec.json> <dossier-sortie>'); process.exit(1); }
const root = path.join(__dirname, '..');
const b64 = f => fs.readFileSync(f).toString('base64');
const LOGO = 'data:image/png;base64,' + b64(path.join(root, 'brand/logo-gjm-auto.png'));
const FONT = 'data:font/woff2;base64,' + b64(path.join(root, 'brand/fonts/archivo-latin-wdth-normal.woff2'));
const Y = '#f5b800', D = '#121517';
const photoSrc = p => /^https?:/.test(p) ? p : 'data:image/jpeg;base64,' + b64(p);
const html = s => `<html><head><meta charset='utf-8'><style>
@font-face{font-family:Archivo;src:url(${FONT}) format('woff2');font-weight:100 900;font-stretch:62% 125%}
html,body{margin:0;width:1920px;height:1080px;overflow:hidden;background:${D};font-family:Archivo,sans-serif;color:#f4f4f1}
.ph{position:absolute;left:0;top:0;width:1920px;height:1080px;object-fit:cover}
.shade{position:absolute;left:0;right:0;bottom:0;height:560px;background:linear-gradient(to top,rgba(18,21,23,.97) 0,rgba(18,21,23,.92) 62%,rgba(18,21,23,0) 100%)}
.stripe{position:absolute;left:0;right:0;bottom:0;height:20px;background:repeating-linear-gradient(-45deg,${Y} 0 28px,${D} 28px 56px)}
.logo{position:absolute;top:44px;left:52px;background:#fff;border-radius:22px;padding:12px 18px;box-shadow:0 10px 30px rgba(0,0,0,.35)}.logo img{height:120px;display:block}
.badge{position:absolute;top:58px;right:56px;background:${Y};color:${D};font-weight:900;font-stretch:80%;font-size:38px;letter-spacing:1.5px;padding:12px 24px;border-radius:10px;text-transform:uppercase}
.info{position:absolute;left:72px;right:72px;bottom:70px;display:flex;align-items:flex-end;justify-content:space-between;gap:40px}
.brand{font-weight:800;font-stretch:85%;font-size:40px;letter-spacing:4px;color:${Y}}
h1{margin:4px 0 6px;font-weight:900;font-stretch:72%;font-size:96px;line-height:.95}
.ver{font-size:36px;font-weight:600;color:#cfd3d6}
.specs{display:flex;gap:14px;margin-top:22px;flex-wrap:wrap}.specs span{border:2px solid rgba(245,184,0,.7);border-radius:999px;padding:8px 20px;font-size:30px;font-weight:700}
.extra{margin-top:16px;font-size:28px;color:#cfd3d6}
.price{text-align:right;white-space:nowrap}.price small{display:block;font-size:30px;font-weight:700;color:#cfd3d6;letter-spacing:2px}
.price b{font-weight:900;font-stretch:75%;font-size:130px;color:${Y};line-height:1}
.price em{display:block;font-style:normal;font-size:26px;color:#cfd3d6;margin-top:6px}
</style></head><body><img class='ph' src='${photoSrc(s.photo)}'><div class='shade'></div>
<div class='logo'><img src='${LOGO}'></div><div class='badge'>${s.badge}</div>
<div class='info'><div><div class='brand'>${s.brand}</div><h1>${s.model}</h1><div class='ver'>${s.version}</div>
<div class='specs'>${s.specs.map(x => `<span>${x}</span>`).join('')}</div>${s.extra ? `<div class='extra'>${s.extra}</div>` : ''}</div>
<div class='price'><small>PRIX TTC</small><b>${s.price}</b><em>GJM AUTO · Saint-Seurin-sur-l'Isle</em></div></div><div class='stripe'></div></body></html>`;
(async () => {
  const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
  fs.mkdirSync(outDir, { recursive: true });
  const b = await chromium.launch();
  for (const s of spec) {
    const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 / 3 });
    await p.setContent(html(s), { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
    const out = path.join(outDir, `${s.slug}-cover.jpg`);
    await p.screenshot({ path: out, type: 'jpeg', quality: 88 }); await p.close(); console.log('OK ' + out);
  }
  await b.close();
})();
