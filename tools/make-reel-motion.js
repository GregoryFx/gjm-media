// Reel véhicule en motion design (1080x1920, 30 i/s) : titres animés, transitions en volet diagonal, prix qui défile.
// Rendu image par image (animation déterministe pilotée par t), encodage H.264 + piste audio optionnelle.
// Usage : node tools/make-reel-motion.js <spec.json> <sortie.mp4> [musique.mp3]
// spec = { photos:[intro, p1, p2, p3, p4, garantie], brand, model, version, badge, captions:[4 textes], warranty, price:"18 990", specs:[], extra }
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');
const [, , specPath, outPath, music] = process.argv;
if (!specPath || !outPath) { console.error('Usage: node tools/make-reel-motion.js <spec.json> <sortie.mp4> [musique.mp3]'); process.exit(1); }
const root = path.join(__dirname, '..');
const s = JSON.parse(fs.readFileSync(specPath, 'utf8'));
const b64 = f => fs.readFileSync(f).toString('base64');
const LOGO = 'data:image/png;base64,' + b64(path.join(root, 'brand/logo-gjm-auto.png'));
const FONT = 'data:font/woff2;base64,' + b64(path.join(root, 'brand/fonts/archivo-latin-wdth-normal.woff2'));
const FPS = 30, DUR = 16;
(async () => {
  const photos = [];
  for (const p of s.photos) photos.push('data:image/jpeg;base64,' + (/^https?:/.test(p) ? Buffer.from(await (await fetch(p)).arrayBuffer()).toString('base64') : b64(p)));
  const html = `<html><head><meta charset='utf-8'><style>
@font-face{font-family:Archivo;src:url(${FONT}) format('woff2');font-weight:100 900;font-stretch:62% 125%}
*{box-sizing:border-box}html,body{margin:0;width:1080px;height:1920px;overflow:hidden;background:#121517;font-family:Archivo,sans-serif;color:#f4f4f1}
.abs{position:absolute}.Y{color:#f5b800}
#bgstripes{left:-400px;top:-400px;width:2000px;height:2800px;opacity:.06;background:repeating-linear-gradient(-45deg,#f5b800 0 60px,transparent 60px 160px)}
.band{left:0;width:1080px;height:26px;background:repeating-linear-gradient(-45deg,#f5b800 0 34px,#121517 34px 68px);background-size:96px 26px}
#logo{left:60px;top:100px;background:#fff;border-radius:22px;padding:10px 16px;box-shadow:0 10px 30px rgba(0,0,0,.45);transform-origin:left top}#logo img{height:100px;display:block}
.ph{left:0;top:480px;width:1080px;height:608px;overflow:hidden}.ph img{width:100%;height:100%;object-fit:cover;display:block}
#wipe{left:-300px;top:0;width:1700px;height:1920px;background:#f5b800;transform:skewX(-14deg)}
.badge{background:#f5b800;color:#121517;font-weight:900;font-stretch:80%;font-size:42px;letter-spacing:1.5px;padding:12px 26px;border-radius:10px;text-transform:uppercase;white-space:nowrap}
.big{font-weight:900;font-stretch:70%;line-height:.92;text-transform:uppercase}
.chip{left:70px;top:1190px;display:flex;align-items:center;gap:26px}
.chip .bar{width:16px;height:120px;background:#f5b800;border-radius:6px}
.chip .t{font-weight:900;font-stretch:78%;font-size:76px;line-height:1.02;max-width:880px}
.count{right:70px;top:1110px;font-weight:800;font-stretch:85%;font-size:38px;color:#9aa0a5;letter-spacing:3px}
#logo,#intro,#ver,.chip,.count,#war,#outro{z-index:20}.band{z-index:15}
.pill{display:inline-block;border:3px solid rgba(245,184,0,.8);border-radius:999px;padding:10px 26px;font-size:42px;font-weight:700;margin:8px}
</style></head><body>
<div id='bgstripes' class='abs'></div>
<div id='band1' class='abs band' style='top:0'></div><div id='band2' class='abs band' style='bottom:0'></div>
${photos.map((p, i) => `<div id='ph${i}' class='abs ph'><img src='${p}'></div>`).join('')}
<div id='logo' class='abs'><img src='${LOGO}'></div>
<div id='intro' class='abs' style='left:70px;right:70px;top:1150px'>
  <div id='ibadge' class='abs badge' style='left:0;top:0'>${s.badge}</div>
  <div id='ibrand' class='abs Y' style='left:0;top:110px;font-weight:800;font-stretch:85%;font-size:48px;letter-spacing:6px'>${s.brand}</div>
  ${s.model.split(' ').map((w, i) => `<div class='abs big iw' style='left:0;top:${180 + i * 118}px;font-size:132px' data-i='${i}'>${w}</div>`).join('')}
</div>
<div id='ver' class='abs' style='left:70px;right:70px;top:1700px;font-size:40px;font-weight:600;color:#dfe2e4'>${s.version}</div>
${s.captions.map((c, i) => `<div id='cap${i}' class='abs chip'><div class='bar'></div><div class='t'>${c}</div></div><div id='cnt${i}' class='abs count'>0${i + 1} / 0${s.captions.length}</div>`).join('')}
<div id='war' class='abs' style='left:70px;right:70px;top:1180px;text-align:center'>
  <div class='Y' style='font-size:150px;line-height:1'>🛡</div><div class='big' style='font-size:92px;margin-top:10px'>Garantie<br><span class='Y'>constructeur</span></div>
  <div style='font-size:52px;font-weight:800;font-stretch:85%;margin-top:18px'>${s.warranty}</div></div>
<div id='outro' class='abs' style='left:60px;right:60px;top:330px;text-align:center'>
  <div class='Y' style='font-weight:800;font-stretch:85%;font-size:46px;letter-spacing:6px'>${s.brand}</div>
  <div class='big' style='font-size:116px;margin-top:6px'>${s.model}</div>
  <div style='font-size:42px;font-weight:700;color:#cfd3d6;letter-spacing:4px;margin-top:60px'>PRIX TTC</div>
  <div id='price' class='big Y' style='font-size:250px;font-stretch:72%'>0 €</div>
  <div id='pills' style='margin-top:24px'>${s.specs.map(x => `<span class='pill'>${x}</span>`).join('')}</div>
  <div id='oextra' style='font-size:38px;color:#dfe2e4;margin-top:26px'>${s.extra || ''}</div>
  <div id='obadge' class='badge' style='display:inline-block;margin-top:50px'>${s.badge}</div>
  <div id='ocontact' style='margin-top:56px'><div class='big' style='font-size:84px;font-stretch:78%'><span class='Y'>☎</span> 05 57 41 07 87</div>
  <div class='big' style='font-size:64px;font-stretch:78%;margin-top:10px;text-transform:none'><span class='Y'>●</span> gjmauto.fr</div>
  <div style='font-size:32px;color:#b9bec2;margin-top:22px'>GJM AUTO · 52 rue Alphonse Daudet · Saint-Seurin-sur-l'Isle<br>Annonce professionnelle</div></div>
</div>
<script>
const P=${JSON.stringify(s.price)}.replace(/\\D/g,'')*1;
const cl=(x,a=0,b=1)=>Math.min(b,Math.max(a,x)), E=x=>1-Math.pow(1-cl(x),3), EB=x=>{x=cl(x);const c=1.7;return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2)};
const $=id=>document.getElementById(id), seg=(t,a,b)=>cl((t-a)/(b-a));
const scenes=[[0.5,3.4],[3.4,5.3],[5.3,7.2],[7.2,9.1],[9.1,11.0],[11.0,13.0]]; // photo i visible
window.render=t=>{
  $('bgstripes').style.transform='translateY('+(-(t*60)%160)+'px)';
  $('band1').style.backgroundPosition=(t*120)+'px 0';$('band2').style.backgroundPosition=(-t*120)+'px 0';
  const lg=EB(seg(t,0.15,0.75));$('logo').style.transform='scale('+lg+')';$('logo').style.opacity=cl(t/0.2);
  // volet jaune d'ouverture
  scenes.forEach(([a,b],i)=>{const el=$('ph'+i);if(!el)return;const inn=E(seg(t,a,a+0.55)),out=seg(t,b-0.01,b+0.5);
    const vis=t>=a&&t<b+0.5;el.style.display=vis?'block':'none';
    const L=130*(1-inn);el.style.clipPath='polygon('+L+'% 0,100% 0,100% 100%,'+(L-30)+'% 100%)';
    el.style.zIndex=i;const z=1.04+0.08*seg(t,a,b+0.5);el.querySelector('img').style.transform='scale('+z+') translateX('+((i%2?1:-1)*20*seg(t,a,b))+'px)';});
  // intro
  const io=1-seg(t,3.1,3.5);
  $('ibadge').style.transform='translateY('+(-60*(1-EB(seg(t,0.9,1.4))))+'px)';$('ibadge').style.opacity=seg(t,0.9,1.1)*io;
  $('ibrand').style.opacity=seg(t,1.1,1.4)*io;$('ibrand').style.transform='translateX('+(-80*(1-E(seg(t,1.1,1.6))))+'px)';
  document.querySelectorAll('.iw').forEach(e=>{const i=+e.dataset.i,a=1.2+i*0.18;e.style.opacity=seg(t,a,a+0.2)*io;e.style.transform='translateY('+(90*(1-E(seg(t,a,a+0.5))))+'px)';});
  $('ver').style.opacity=seg(t,1.9,2.3)*io;
  // légendes
  ${JSON.stringify(s.captions)}.forEach((_,i)=>{const [a,b]=scenes[i+1];const k=E(seg(t,a+0.25,a+0.8))*(1-seg(t,b-0.25,b));
    $('cap'+i).style.opacity=k;$('cap'+i).style.transform='translateX('+(-120*(1-E(seg(t,a+0.25,a+0.8))))+'px)';$('cnt'+i).style.opacity=k;});
  // garantie
  const [ga,gb]=scenes[5];const g=EB(seg(t,ga+0.3,ga+0.9))*(1-seg(t,gb-0.2,gb+0.2));$('war').style.opacity=cl(g);$('war').style.transform='scale('+(0.6+0.4*g)+')';
  // fin : photos masquées, prix qui défile
  const o=seg(t,13.0,13.4);$('outro').style.opacity=o;$('outro').style.transform='translateY('+(60*(1-E(o)))+'px)';
  const pv=Math.round(P*E(seg(t,13.2,14.4))/10)*10;$('price').textContent=(t>=14.4?P:pv).toLocaleString('fr-FR').replace(/\\u202f|\\u00a0/g,' ')+' €';
  [...$('pills').children].forEach((e,i)=>{const a=14.0+i*0.12;e.style.opacity=seg(t,a,a+0.2);e.style.transform='scale('+(0.6+0.4*EB(seg(t,a,a+0.4)))+')';});
  $('oextra').style.opacity=seg(t,14.6,14.9);$('obadge').style.opacity=seg(t,14.7,15.0);
  $('ocontact').style.opacity=seg(t,14.9,15.2);$('ocontact').style.transform='translateY('+(40*(1-E(seg(t,14.9,15.4))))+'px)';
  document.body.style.background='#121517';
};
</script></body></html>`;
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await pg.setContent(html, { waitUntil: 'load' }); await pg.evaluate(() => document.fonts.ready);
  const args = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-'];
  if (music) args.push('-i', music); else args.push('-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo');
  args.push('-map', '0:v', '-map', '1:a', '-t', String(DUR), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19', '-pix_fmt', 'yuv420p',
    '-af', `afade=t=out:st=${DUR - 1.5}:d=1.5`, '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', outPath);
  const ff = spawn('ffmpeg', args, { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let f = 0; f < DUR * FPS; f++) {
    await pg.evaluate(t => window.render(t), f / FPS);
    const buf = await pg.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close();
  console.log('OK ' + outPath);
})();
