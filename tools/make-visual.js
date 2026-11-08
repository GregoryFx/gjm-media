// Génère un visuel 1200x900 JPG pour une publication Google d'Auto Service 974.
// Usage : node tools/make-visual.js <icone> "<Titre>" "<Sous-titre>" <fichier-sortie.jpg> ["<Surtitre>"]
// Icônes : wheel, oil, snow, wrench, battery, brake, gauge, gear, car, sun, check
const { chromium } = require('playwright');
const [,, icon, title, subtitle, out, kicker = 'Conseil entretien'] = process.argv;
if (!icon || !title || !subtitle || !out) { console.error('Usage: node tools/make-visual.js <icone> "<Titre>" "<Sous-titre>" <sortie.jpg> ["<Surtitre>"]'); process.exit(1); }
const O = '#d9673a', C = '#f3ece2', D = '#1f1d1b';
const rad = a => a * Math.PI / 180;
const ray = (n, r1, r2, w, col) => Array.from({ length: n }, (_, i) => i * 360 / n).map(a =>
  `<line x1="${100 + r1 * Math.cos(rad(a))}" y1="${100 + r1 * Math.sin(rad(a))}" x2="${100 + r2 * Math.cos(rad(a))}" y2="${100 + r2 * Math.sin(rad(a))}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`).join('');
const ICONS = {
  wheel: `<circle cx="100" cy="100" r="88" fill="${D}" stroke="${O}" stroke-width="6"/><circle cx="100" cy="100" r="60" fill="none" stroke="${C}" stroke-width="5"/>${ray(5, 0, 55, 10, C)}<circle cx="100" cy="100" r="16" fill="${O}"/>${ray(24, 80, 88, 5, '#3a3632')}`,
  oil: `<path d="M100 18 C100 18 40 92 40 128 a60 60 0 0 0 120 0 C160 92 100 18 100 18Z" fill="${O}"/><path d="M72 128 a28 28 0 0 0 28 28" fill="none" stroke="${C}" stroke-width="9" stroke-linecap="round"/>`,
  snow: `<g stroke="${C}" stroke-width="9" stroke-linecap="round">${[0, 60, 120].map(a => `<g transform="rotate(${a} 100 100)"><line x1="100" y1="15" x2="100" y2="185"/><line x1="100" y1="45" x2="82" y2="28"/><line x1="100" y1="45" x2="118" y2="28"/><line x1="100" y1="155" x2="82" y2="172"/><line x1="100" y1="155" x2="118" y2="172"/></g>`).join('')}</g><circle cx="100" cy="100" r="14" fill="${O}"/>`,
  wrench: `<g transform="rotate(-45 100 100)"><rect x="88" y="60" width="24" height="120" rx="12" fill="${C}"/><circle cx="100" cy="50" r="34" fill="${O}"/><rect x="88" y="14" width="24" height="40" fill="#2a2622"/></g>`,
  battery: `<rect x="30" y="60" width="140" height="100" rx="12" fill="${D}" stroke="${C}" stroke-width="8"/><rect x="50" y="44" width="26" height="16" fill="${C}"/><rect x="124" y="44" width="26" height="16" fill="${C}"/><path d="M106 76 L80 116 H100 L92 146 L122 102 H102 Z" fill="${O}"/>`,
  brake: `<circle cx="100" cy="100" r="80" fill="${D}" stroke="${C}" stroke-width="8"/><circle cx="100" cy="100" r="24" fill="none" stroke="${C}" stroke-width="8"/>${ray(10, 40, 66, 6, '#5a524a')}<path d="M150 40 A80 80 0 0 1 180 100 L156 100 A56 56 0 0 0 136 58 Z" fill="${O}"/>`,
  gauge: `<path d="M30 140 A70 70 0 1 1 170 140" fill="none" stroke="${C}" stroke-width="10" stroke-linecap="round"/>${ray(9, 54, 64, 5, '#8a8076').replace(/<line/g, '<line transform="rotate(0)"')}<line x1="100" y1="130" x2="140" y2="72" stroke="${O}" stroke-width="9" stroke-linecap="round"/><circle cx="100" cy="130" r="12" fill="${O}"/>`,
  gear: `<g fill="${C}">${Array.from({ length: 8 }, (_, i) => `<rect x="90" y="14" width="20" height="30" rx="4" transform="rotate(${i * 45} 100 100)"/>`).join('')}</g><circle cx="100" cy="100" r="60" fill="${C}"/><circle cx="100" cy="100" r="26" fill="${O}"/>`,
  car: `<path d="M24 128 L36 92 Q42 76 60 74 L140 74 Q158 76 164 92 L176 128 Z" fill="${C}"/><rect x="18" y="122" width="164" height="30" rx="10" fill="${C}"/><path d="M56 90 L66 82 L134 82 L144 90 Z" fill="#2a2622"/><circle cx="58" cy="152" r="18" fill="${D}" stroke="${O}" stroke-width="7"/><circle cx="142" cy="152" r="18" fill="${D}" stroke="${O}" stroke-width="7"/>`,
  sun: `${ray(12, 62, 86, 9, C)}<circle cx="100" cy="100" r="46" fill="${O}"/>`,
  check: `<circle cx="100" cy="100" r="80" fill="none" stroke="${C}" stroke-width="10"/><path d="M62 102 L90 130 L142 74" fill="none" stroke="${O}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>`,
};
if (!ICONS[icon]) { console.error('Icône inconnue. Choix : ' + Object.keys(ICONS).join(', ')); process.exit(1); }
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const html = `<html><head><style>
body{margin:0;width:1200px;height:900px;background:#2a2622;font-family:'DejaVu Sans',sans-serif;color:${C};display:flex;overflow:hidden}
.l{width:560px;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 50%,#3a332d,#2a2622 70%)}
.r{flex:1;padding:90px 80px 70px 20px;display:flex;flex-direction:column;justify-content:center}
.k{color:${O};font-size:26px;letter-spacing:4px;text-transform:uppercase;font-weight:bold}
h1{font-size:72px;line-height:1.05;margin:22px 0 26px}p{font-size:32px;line-height:1.35;color:#d8cfc3;margin:0}
.f{position:absolute;bottom:52px;left:600px;font-size:24px;color:#b5ab9e}.f b{color:${C}}
.bar{position:absolute;left:0;top:0;width:12px;height:900px;background:${O}}
</style></head><body><div class="bar"></div><div class="l"><svg viewBox="0 0 200 200" width="300" height="300">${ICONS[icon]}</svg></div>
<div class="r"><div class="k">${esc(kicker)}</div><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div>
<div class="f"><b>Auto Service 974</b> · Saint-Seurin-sur-l’Isle</div></body></html>`;
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 900 } });
  await p.setContent(html); await p.screenshot({ path: out, type: 'jpeg', quality: 90 }); await b.close(); console.log('OK ' + out); })();
