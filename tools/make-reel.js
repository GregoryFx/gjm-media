// Génère un Reel vertical (1080x1920, 30 i/s, MP4 H.264) pour une annonce véhicule GJM AUTO.
// Photos Starterre (16:9) en zoom lent sur fond flou, textes à la charte (logo, jaune #f5b800, Archivo), fin avec prix et contact.
// Usage : node tools/make-reel.js <spec.json> <sortie.mp4>
// spec = { "photos": ["url-ou-chemin", ...],          // 1re = intro, suivantes = une scène chacune
//          "brand": "CITROËN", "model": "C4 Hybride 145", "version": "Plus · e-DCS6 automatique",
//          "badge": "Disponible sur commande", "captions": ["…", "…"],   // une légende par photo après l'intro
//          "price": "18 990 €", "specs": ["05/2025","17 787 km","Hybride","Auto"], "extra": "Garantie constructeur jusqu'en mai 2027" }
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');
const [, , specPath, outPath] = process.argv;
if (!specPath || !outPath) { console.error('Usage: node tools/make-reel.js <spec.json> <sortie.mp4>'); process.exit(1); }
const root = path.join(__dirname, '..');
const s = JSON.parse(fs.readFileSync(specPath, 'utf8'));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'reel-'));
const b64 = f => fs.readFileSync(f).toString('base64');
const LOGO = 'data:image/png;base64,' + b64(path.join(root, 'brand/logo-gjm-auto.png'));
const FONT = 'data:font/woff2;base64,' + b64(path.join(root, 'brand/fonts/archivo-latin-wdth-normal.woff2'));
const Y = '#f5b800', D = '#121517', FPS = 30, XF = 0.4;
const css = `@font-face{font-family:Archivo;src:url(${FONT}) format('woff2');font-weight:100 900;font-stretch:62% 125%}
html,body{margin:0;width:1080px;height:1920px;background:transparent;font-family:Archivo,sans-serif;color:#f4f4f1;overflow:hidden}
.logo{position:absolute;top:110px;left:60px;background:#fff;border-radius:20px;padding:10px 16px;box-shadow:0 8px 24px rgba(0,0,0,.4)}.logo img{height:96px;display:block}
.stripe{position:absolute;left:0;right:0;bottom:0;height:22px;background:repeating-linear-gradient(-45deg,${Y} 0 30px,${D} 30px 60px)}
.badge{display:inline-block;background:${Y};color:${D};font-weight:900;font-stretch:80%;font-size:40px;letter-spacing:1.5px;padding:12px 24px;border-radius:10px;text-transform:uppercase}
.zone{position:absolute;left:70px;right:70px;top:1130px;text-align:center}
.brand{font-weight:800;font-stretch:85%;font-size:44px;letter-spacing:5px;color:${Y};margin-top:34px}
h1{margin:6px 0 10px;font-weight:900;font-stretch:72%;font-size:118px;line-height:.95}
.ver{font-size:40px;font-weight:600;color:#dfe2e4}
.cap{display:inline-block;background:rgba(18,21,23,.88);border:3px solid ${Y};border-radius:18px;padding:22px 34px;font-size:52px;font-weight:800;font-stretch:85%;line-height:1.15}
.price small{display:block;font-size:40px;font-weight:700;color:#cfd3d6;letter-spacing:3px}
.price b{font-weight:900;font-stretch:75%;font-size:190px;color:${Y};line-height:1}
.specs{display:flex;flex-wrap:wrap;justify-content:center;gap:16px;margin:30px 0 22px}.specs span{border:3px solid rgba(245,184,0,.75);border-radius:999px;padding:10px 26px;font-size:40px;font-weight:700}
.extra{font-size:36px;color:#dfe2e4;margin-bottom:40px}
.contact{font-size:58px;font-weight:900;font-stretch:80%}.contact i{font-style:normal;color:${Y}}
.small{font-size:32px;color:#b9bec2;margin-top:18px}`;
const page = inner => `<html><head><meta charset='utf-8'><style>${css}</style></head><body><div class='logo'><img src='${LOGO}'></div>${inner}<div class='stripe'></div></body></html>`;
const overlays = [
  page(`<div class='zone'><span class='badge'>${s.badge}</span><div class='brand'>${s.brand}</div><h1>${s.model}</h1><div class='ver'>${s.version}</div></div>`),
  ...s.captions.map(c => page(`<div class='zone' style='top:1180px'><span class='cap'>${c}</span></div>`)),
  page(`<div class='zone' style='top:560px'><div class='brand' style='margin:0'>${s.brand}</div><h1 style='font-size:96px'>${s.model}</h1>
   <div class='price' style='margin-top:40px'><small>PRIX TTC</small><b>${s.price}</b></div>
   <div class='specs'>${s.specs.map(x => `<span>${x}</span>`).join('')}</div><div class='extra'>${s.extra || ''}</div>
   <span class='badge'>${s.badge}</span><div class='contact' style='margin-top:50px'><i>☎</i> 05 57 41 07 87</div>
   <div class='contact' style='font-size:50px;margin-top:10px'><i>●</i> gjmauto.fr</div><div class='small'>GJM AUTO · 52 rue Alphonse Daudet · Saint-Seurin-sur-l'Isle<br>Annonce professionnelle</div></div>`),
];
const sh = (args) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' });
(async () => {
  // 1. photos en local
  const photos = [];
  for (const [i, p] of s.photos.entries()) {
    const f = path.join(tmp, `p${i}.jpg`);
    if (/^https?:/.test(p)) fs.writeFileSync(f, Buffer.from(await (await fetch(p)).arrayBuffer())); else fs.copyFileSync(p, f);
    photos.push(f);
  }
  // 2. calques texte
  const b = await chromium.launch();
  for (const [i, h] of overlays.entries()) {
    const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
    await pg.setContent(h, { waitUntil: 'load' }); await pg.evaluate(() => document.fonts.ready);
    await pg.screenshot({ path: path.join(tmp, `o${i}.png`), omitBackground: true }); await pg.close();
  }
  await b.close();
  // 3. une séquence par scène : fond flou + photo en zoom lent (Ken Burns) + calque
  const scenes = [{ photo: photos[0], dur: 3.0 }, ...s.captions.map((_, i) => ({ photo: photos[i + 1], dur: 2.3 })), { photo: photos[0], dur: 4.0, outro: true }];
  const clips = scenes.map((sc, i) => {
    const out = path.join(tmp, `c${i}.mp4`), n = Math.round(sc.dur * FPS);
    const z = i % 2 ? `1.10-0.10*on/${n}` : `1+0.10*on/${n}`;
    const fc = sc.outro
      ? `[0]scale=-2:1920,crop=1080:1920,gblur=sigma=40,eq=brightness=-0.42,format=yuv420p,fps=${FPS}[bg];[bg][1]overlay=0:0,trim=duration=${sc.dur}[v]`
      : `[0]split[a][b];[a]scale=-2:1920,crop=1080:1920,gblur=sigma=40,eq=brightness=-0.35[bg];` +
        `[b]scale=2160:-2,zoompan=z='${z}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${n}:s=1080x608:fps=${FPS}[fg];` +
        `[bg]fps=${FPS}[bg2];[bg2][fg]overlay=0:470:shortest=1[m];[m][1]overlay=0:0,format=yuv420p,trim=duration=${sc.dur}[v]`;
    sh(['-loop', '1', '-t', String(sc.dur), '-i', sc.photo, '-loop', '1', '-t', String(sc.dur), '-i', path.join(tmp, `o${i}.png`),
      '-filter_complex', fc, '-map', '[v]', '-r', String(FPS), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', out]);
    return { out, dur: sc.dur };
  });
  // 4. enchaînement en fondu
  const inputs = clips.flatMap(c => ['-i', c.out]);
  let fc = '', last = '[0:v]', t = clips[0].dur;
  clips.slice(1).forEach((c, k) => { const lbl = `[x${k}]`; fc += `${last}[${k + 1}:v]xfade=transition=fade:duration=${XF}:offset=${(t - XF).toFixed(2)}${lbl};`; last = lbl; t += c.dur - XF; });
  // piste audio silencieuse (certaines plateformes exigent une piste son ; la musique s'ajoute côté Instagram)
  sh([...inputs, '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo', '-filter_complex', fc.replace(/;$/, ''), '-map', last, '-map', `${clips.length}:a`,
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', outPath]);
  console.log(`OK ${outPath} (${t.toFixed(1)} s)`);
})();
