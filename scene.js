/* Fidelity Hub — scena 3D: carte fedeltà, telefono, notifica push, premio */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const FH = (window.FH = window.FH || { progress: 0, total: 5.2 });
const root = document.documentElement;
const canvas = document.querySelector(".story__canvas");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

const webgl = () => { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; } };

/* ---------------- utilità ---------------- */
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const seg = (T, a, b) => ease(clamp01((T - a) / (b - a)));
const lerp = (a, b, t) => a + (b - a) * t;
const DISPLAY = '"Bricolage Grotesque", Arial, sans-serif';
const BODY = 'Figtree, Arial, sans-serif';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function tint(img, color) {
  const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
  const x = c.getContext("2d"); x.drawImage(img, 0, 0); x.globalCompositeOperation = "source-in"; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
  return c;
}
const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
function track(ctx, px) { if ("letterSpacing" in ctx) ctx.letterSpacing = px + "px"; }

/* ---------------- dati delle carte ---------------- */
const CARDS = [
  { key: "aurora", name: "Caffè Aurora", ic: "A", bg: "#FD6B11", fg: "#FFFFFF", acc: "#FFFFFF", accFg: "#FD6B11", edge: "#E05A06", unit: "TIMBRI", on: 7, tot: 10, reward: "Caffè omaggio" },
  { key: "gino", name: "Pizzeria Da Gino", ic: "G", bg: "#161618", fg: "#FFFFFF", acc: "#FD6B11", accFg: "#161618", edge: "#0B0B0C", unit: "PIZZE", on: 4, tot: 8, reward: "Margherita omaggio" },
  { key: "capelli", name: "Studio Capelli", ic: "S", bg: "#F1E6DA", fg: "#161618", acc: "#161618", accFg: "#F1E6DA", edge: "#D9CBBB", unit: "TAGLI", on: 3, tot: 5, reward: "Piega omaggio" },
  { key: "fit", name: "Fit Lab", ic: "F", bg: "#1F3A2E", fg: "#FFFFFF", acc: "#C9F27A", accFg: "#1F3A2E", edge: "#152A20", unit: "INGRESSI", on: 9, tot: 10, reward: "Ingresso amico" },
];

function drawQR(ctx, x, y, size, seed) {
  ctx.fillStyle = "#FFFFFF"; rr(ctx, x, y, size, size, 22); ctx.fill();
  const N = 25, pad = 16, cell = (size - pad * 2) / N;
  let s = seed; const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  ctx.fillStyle = "#161618";
  const inF = (i, j) => (i < 8 && j < 8) || (i > N - 9 && j < 8) || (i < 8 && j > N - 9);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (!inF(i, j) && rnd() > 0.5) ctx.fillRect(x + pad + i * cell, y + pad + j * cell, cell + 0.4, cell + 0.4);
  const finder = (i, j) => {
    const fx = x + pad + i * cell, fy = y + pad + j * cell;
    ctx.fillRect(fx, fy, cell * 7, cell * 7); ctx.fillStyle = "#FFFFFF"; ctx.fillRect(fx + cell, fy + cell, cell * 5, cell * 5);
    ctx.fillStyle = "#161618"; ctx.fillRect(fx + cell * 2, fy + cell * 2, cell * 3, cell * 3);
  };
  finder(0, 0); finder(N - 7, 0); finder(0, N - 7);
}

function drawPass(d, imgs, complete = false) {
  const W = 640, H = 896, pad = 46;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const x = c.getContext("2d");
  x.fillStyle = d.bg; x.fillRect(0, 0, W, H);
  const g = x.createLinearGradient(0, 0, W * 0.8, H * 0.6); g.addColorStop(0, "rgba(255,255,255,.16)"); g.addColorStop(0.5, "rgba(255,255,255,0)");
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  // intestazione
  x.globalAlpha = 0.2; x.fillStyle = d.fg; x.beginPath(); x.arc(pad + 30, 84, 32, 0, Math.PI * 2); x.fill(); x.globalAlpha = 1;
  x.fillStyle = d.fg; x.textAlign = "center"; x.textBaseline = "middle"; x.font = `800 32px ${DISPLAY}`; x.fillText(d.ic, pad + 30, 86);
  x.textAlign = "left"; x.font = `800 ${d.name.length > 14 ? 30 : 34}px ${DISPLAY}`; track(x, -0.5); x.fillText(d.name, pad + 76, 86); track(x, 0);
  const on = complete ? d.tot : d.on;
  x.textAlign = "right"; x.globalAlpha = 0.75; x.font = `700 16px ${BODY}`; track(x, 2); x.fillText(d.unit, W - pad, 64); track(x, 0); x.globalAlpha = 1;
  x.font = `800 38px ${DISPLAY}`; x.fillText(`${on}/${d.tot}`, W - pad, 104);
  // timbri
  x.globalAlpha = 0.25; x.fillStyle = d.fg; x.fillRect(pad, 150, W - pad * 2, 2); x.globalAlpha = 1;
  const cols = d.tot <= 5 ? d.tot : 5, rows = Math.ceil(d.tot / cols), cw = (W - pad * 2) / 5, r = 34;
  const top = rows === 1 ? 220 : 186;
  for (let k = 0; k < d.tot; k++) {
    const col = k % cols, row = Math.floor(k / cols);
    const cx = pad + cw * (col + 0.5) + ((5 - cols) * cw) / 2, cy = top + row * 92 + r;
    x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2);
    if (k < on) {
      x.fillStyle = d.acc; x.fill();
      x.strokeStyle = d.accFg; x.lineWidth = 7; x.lineCap = "round"; x.lineJoin = "round";
      x.beginPath(); x.moveTo(cx - 13, cy + 1); x.lineTo(cx - 3, cy + 11); x.lineTo(cx + 15, cy - 10); x.stroke();
    } else { x.globalAlpha = 0.45; x.strokeStyle = d.fg; x.lineWidth = 4; x.stroke(); x.globalAlpha = 1; }
  }
  x.globalAlpha = 0.25; x.fillStyle = d.fg; x.fillRect(pad, 390, W - pad * 2, 2); x.globalAlpha = 1;
  // campi
  x.textAlign = "left"; x.fillStyle = d.fg;
  if (complete) {
    x.fillStyle = d.acc; rr(x, pad, 420, W - pad * 2, 96, 48); x.fill();
    x.fillStyle = d.accFg; x.textAlign = "center"; x.font = `800 30px ${DISPLAY}`; x.fillText(`Premio pronto · ${d.reward}`, W / 2, 470);
  } else {
    x.globalAlpha = 0.75; x.font = `700 16px ${BODY}`; track(x, 2); x.fillText("PREMIO", pad, 432); x.textAlign = "right"; x.fillText("CLIENTE", W - pad, 432); track(x, 0); x.globalAlpha = 1;
    x.font = `700 28px ${BODY}`; x.textAlign = "left"; x.fillText(d.reward, pad, 474); x.textAlign = "right"; x.fillText("Giulia R.", W - pad, 474);
  }
  drawQR(x, W / 2 - 104, 572, 208, d.key.length * 97 + 13);
  const wm = imgs.wm[d.fg]; const ww = 132, wh = ww * (wm.height / wm.width);
  x.globalAlpha = 0.6; x.drawImage(wm, W / 2 - ww / 2, 818, ww, wh); x.globalAlpha = 1;
  return c;
}
function drawBack(d, imgs) {
  const W = 640, H = 896, c = document.createElement("canvas"); c.width = W; c.height = H;
  const x = c.getContext("2d"); x.fillStyle = d.bg; x.fillRect(0, 0, W, H);
  const inf = imgs.inf[d.fg]; const iw = 380, ih = iw * (inf.height / inf.width);
  x.globalAlpha = 0.14; x.drawImage(inf, W / 2 - iw / 2, H / 2 - ih / 2, iw, ih);
  const wm = imgs.wm[d.fg]; const ww = 220, wh = ww * (wm.height / wm.width);
  x.globalAlpha = 0.7; x.drawImage(wm, W / 2 - ww / 2, H - 120, ww, wh); x.globalAlpha = 1;
  return c;
}
function statusBar(x, W, col) {
  x.fillStyle = col; x.textAlign = "center"; x.textBaseline = "middle"; x.font = `700 31px ${BODY}`; x.fillText("9:41", 118, 56);
  // segnale
  [0, 1, 2, 3].forEach((i) => { x.globalAlpha = 1; rr(x, W - 214 + i * 13, 64 - 8 - i * 5, 9, 8 + i * 5, 2.5); x.fill(); });
  // wi-fi
  x.strokeStyle = col; x.lineCap = "round"; x.lineWidth = 5;
  [24, 15].forEach((r) => { x.beginPath(); x.arc(W - 140, 70, r, Math.PI * 1.25, Math.PI * 1.75); x.stroke(); });
  x.beginPath(); x.arc(W - 140, 68, 4, 0, Math.PI * 2); x.fill();
  // batteria
  x.lineWidth = 2.5; x.globalAlpha = 0.45; rr(x, W - 108, 44, 52, 25, 8); x.stroke(); x.globalAlpha = 1;
  rr(x, W - 104, 48, 38, 17, 5); x.fill(); x.globalAlpha = 0.45; rr(x, W - 53, 52, 4, 9, 2); x.fill(); x.globalAlpha = 1;
}
function drawScreen(c, mode, imgs) {
  const W = c.width, H = c.height, x = c.getContext("2d");
  x.clearRect(0, 0, W, H);
  if (mode === "lock") {
    x.fillStyle = "#121214"; x.fillRect(0, 0, W, H);
    let g = x.createRadialGradient(W * 0.5, H * 1.05, 10, W * 0.5, H * 1.05, H * 0.75);
    g.addColorStop(0, "rgba(253,107,17,1)"); g.addColorStop(0.42, "rgba(253,107,17,.38)"); g.addColorStop(1, "rgba(253,107,17,0)");
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    g = x.createRadialGradient(W * 0.95, H * 0.05, 10, W * 0.95, H * 0.05, H * 0.55); g.addColorStop(0, "rgba(255,170,110,.28)"); g.addColorStop(1, "rgba(255,170,110,0)");
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    statusBar(x, W, "#FFFFFF");
    x.fillStyle = "rgba(255,255,255,.9)"; x.textAlign = "center"; x.textBaseline = "alphabetic"; x.font = `600 31px ${BODY}`; x.fillText("martedì 10 novembre", W / 2, 214);
    x.fillStyle = "#FFFFFF"; x.font = `700 206px ${DISPLAY}`; track(x, -4); x.fillText("9:41", W / 2, 410); track(x, 0);
    // torcia e fotocamera
    [[118, "torch"], [W - 118, "cam"]].forEach(([cx, k]) => {
      const cy = H - 150; x.fillStyle = "rgba(255,255,255,.18)"; x.beginPath(); x.arc(cx, cy, 50, 0, Math.PI * 2); x.fill();
      x.strokeStyle = "#FFFFFF"; x.fillStyle = "#FFFFFF"; x.lineWidth = 4; x.lineJoin = "round";
      if (k === "torch") { rr(x, cx - 10, cy - 6, 20, 30, 4); x.stroke(); x.beginPath(); x.moveTo(cx - 14, cy - 22); x.lineTo(cx + 14, cy - 22); x.lineTo(cx + 10, cy - 6); x.lineTo(cx - 10, cy - 6); x.closePath(); x.stroke(); }
      else { rr(x, cx - 22, cy - 14, 44, 32, 7); x.stroke(); x.beginPath(); x.arc(cx, cy + 2, 9, 0, Math.PI * 2); x.stroke(); rr(x, cx - 8, cy - 20, 16, 7, 2); x.fill(); }
    });
    x.fillStyle = "rgba(255,255,255,.9)"; rr(x, W / 2 - 104, H - 30, 208, 10, 5); x.fill();
  } else {
    x.fillStyle = "#000000"; x.fillRect(0, 0, W, H);
    statusBar(x, W, "#FFFFFF");
    x.font = `800 70px ${DISPLAY}`; x.fillStyle = "#FFFFFF"; x.textAlign = "left"; x.textBaseline = "alphabetic"; track(x, -1.5); x.fillText("Wallet", 42, 236); track(x, 0);
    // pulsanti tondi: + e altro
    [[W - 150, "+"], [W - 70, "..."]].forEach(([cx, k]) => {
      x.fillStyle = "#1F1F22"; x.beginPath(); x.arc(cx, 212, 32, 0, Math.PI * 2); x.fill();
      x.fillStyle = "#FFFFFF"; x.strokeStyle = "#FFFFFF"; x.lineWidth = 5; x.lineCap = "round";
      if (k === "+") { x.beginPath(); x.moveTo(cx, 198); x.lineTo(cx, 226); x.moveTo(cx - 14, 212); x.lineTo(cx + 14, 212); x.stroke(); }
      else [-11, 0, 11].forEach((d) => { x.beginPath(); x.arc(cx + d, 212, 4, 0, Math.PI * 2); x.fill(); });
    });
    x.fillStyle = "rgba(255,255,255,.9)"; rr(x, W / 2 - 104, H - 30, 208, 10, 5); x.fill();
  }
}
function drawNotif(imgs) {
  const W = 980, H = 330, m = 40, c = document.createElement("canvas"); c.width = W; c.height = H;
  const x = c.getContext("2d");
  x.shadowColor = "rgba(0,0,0,.35)"; x.shadowBlur = 36; x.shadowOffsetY = 12;
  x.fillStyle = "rgba(250,248,246,.97)"; rr(x, m, m, W - m * 2, H - m * 2, 54); x.fill();
  x.shadowColor = "transparent";
  x.fillStyle = "#FD6B11"; rr(x, m + 34, m + 70, 110, 110, 28); x.fill();
  const inf = imgs.inf["#FFFFFF"]; const iw = 82, ih = iw * (inf.height / inf.width); x.drawImage(inf, m + 34 + 55 - iw / 2, m + 125 - ih / 2, iw, ih);
  x.fillStyle = "#161618"; x.textAlign = "left"; x.textBaseline = "alphabetic"; x.font = `800 36px ${DISPLAY}`; x.fillText("Caffè Aurora", m + 172, m + 96);
  x.fillStyle = "#8A847E"; x.textAlign = "right"; x.font = `600 27px ${BODY}`; x.fillText("ora", W - m - 36, m + 94);
  x.fillStyle = "#2B2B2E"; x.textAlign = "left"; x.font = `500 30px ${BODY}`;
  x.fillText("Solo oggi: colazione 2×1 fino alle 11.", m + 172, m + 146); x.fillText("Mostra la carta in cassa.", m + 172, m + 188);
  return c;
}

/* ---------------- scena ---------------- */
async function init() {
  const fontsReady = Promise.all([`800 40px ${DISPLAY}`, `700 30px ${BODY}`, `600 30px ${BODY}`, `500 30px ${BODY}`].map((f) => document.fonts.load(f)));
  await Promise.race([fontsReady, new Promise((r) => setTimeout(r, 2500))]);
  const [wmImg, infImg] = await Promise.all([loadImg("assets/wordmark-white.png"), loadImg("assets/infinity-white.png")]);
  const imgs = { wm: {}, inf: {} };
  ["#FFFFFF", "#161618"].forEach((col) => { imgs.wm[col] = tint(wmImg, col); imgs.inf[col] = tint(infImg, col); });

  // telefoni e tablet in verticale: testo sopra, scena sotto (come in style.css)
  const mobileQ = () => matchMedia("(max-width: 760px), (max-width: 1100px) and (orientation: portrait)").matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.02;
  let dprCap = mobileQ() ? 1.6 : 2;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 60);
  camera.position.set(0, 0, 10);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.75;
  const key = new THREE.DirectionalLight(0xfff1e6, 1.5); key.position.set(4, 6, 7); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffb27a, 0.8); rim.position.set(-6, 2, -3); scene.add(rim);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xffe2cc, 0.35));

  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const tex = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso; return t; };

  const world = new THREE.Group(); scene.add(world);
  const rig = new THREE.Group(); world.add(rig);

  /* forme arrotondate */
  const rshape = (w, h, r) => {
    const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0); s.lineTo(x + w, y + h - r); s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2);
    s.lineTo(x + r, y + h); s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI); s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5);
    return s;
  };
  const face = (w, h, r, seg = 16) => {
    const g = new THREE.ShapeGeometry(rshape(w, h, r), seg), p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + w / 2) / w, (p.getY(i) + h / 2) / h);
    return g;
  };
  const slab = (w, h, r, depth, bevel, seg = 5) => {
    const g = new THREE.ExtrudeGeometry(rshape(w - bevel * 2, h - bevel * 2, Math.max(0.001, r - bevel)), { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: seg, curveSegments: 24 });
    g.center(); g.computeVertexNormals(); return g;
  };

  /* iPhone: cornice in titanio, vetro, Dynamic Island, tasti */
  const phone = new THREE.Group(); rig.add(phone);
  const PW = 1.0, PH = 2.06, PR = 0.17, PD = 0.086, PB = 0.016;
  const PZ = PD / 2 + PB; // faccia anteriore
  const titanium = new THREE.MeshPhysicalMaterial({ color: 0x8f877d, metalness: 1, roughness: 0.2, clearcoat: 0.35, clearcoatRoughness: 0.25, envMapIntensity: 1.4 });
  phone.add(new THREE.Mesh(slab(PW, PH, PR, PD, PB, 6), titanium));
  // fascia lucida sul bordo (lo smusso del titanio)
  const front = new THREE.Mesh(face(PW - 0.022, PH - 0.022, PR - 0.011, 24), new THREE.MeshPhysicalMaterial({ color: 0x020203, roughness: 0.04, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.6 }));
  front.position.z = PZ + 0.0006; phone.add(front);
  const back = new THREE.Mesh(face(PW - 0.022, PH - 0.022, PR - 0.011, 24), new THREE.MeshPhysicalMaterial({ color: 0x2a2a2e, roughness: 0.55, metalness: 0.1, clearcoat: 0.4 }));
  back.rotation.y = Math.PI; back.position.z = -PZ - 0.0006; phone.add(back);
  const cam = new THREE.Mesh(slab(0.4, 0.4, 0.1, 0.012, 0.006, 3), new THREE.MeshPhysicalMaterial({ color: 0x2f2f33, roughness: 0.3, metalness: 0.4, clearcoat: 1 }));
  cam.position.set(-0.25, 0.77, -PZ - 0.012); phone.add(cam);
  const SW = 0.93, SH = 1.99, SR = 0.145;
  const screenCanvas = document.createElement("canvas"); screenCanvas.width = 660; screenCanvas.height = Math.round(660 * SH / SW);
  const screenTex = tex(screenCanvas);
  const screen = new THREE.Mesh(face(SW, SH, SR, 24), new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }));
  screen.position.z = PZ + 0.0012; phone.add(screen);
  // riflesso del vetro
  const gl = document.createElement("canvas"); gl.width = 256; gl.height = 512;
  { const x = gl.getContext("2d"), g = x.createLinearGradient(0, 0, 256, 512);
    g.addColorStop(0, "rgba(255,255,255,.22)"); g.addColorStop(0.32, "rgba(255,255,255,.05)"); g.addColorStop(0.33, "rgba(255,255,255,0)"); g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g; x.fillRect(0, 0, 256, 512); }
  const glare = new THREE.Mesh(face(SW, SH, SR, 24), new THREE.MeshBasicMaterial({ map: tex(gl), transparent: true, depthWrite: false, toneMapped: false }));
  glare.position.z = PZ + 0.0024; glare.renderOrder = 40; phone.add(glare);
  const island = new THREE.Mesh(face(0.255, 0.074, 0.037, 12), new THREE.MeshBasicMaterial({ color: 0x000000 }));
  island.position.set(0, SH / 2 - 0.075, PZ + 0.0018); phone.add(island);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.016, 20), new THREE.MeshPhysicalMaterial({ color: 0x0b0f1a, roughness: 0.1, clearcoat: 1 }));
  lens.position.set(0.075, SH / 2 - 0.075, PZ + 0.002); phone.add(lens);
  // tasti: Azione, volume +, volume −, accensione
  const pill = (h) => { const g = new THREE.CapsuleGeometry(0.011, h, 6, 12); g.scale(1, 1, 1.9); return g; };
  [[-1, 0.6, 0.06], [-1, 0.43, 0.13], [-1, 0.25, 0.13], [1, 0.4, 0.2]].forEach(([side, y, h]) => {
    const b = new THREE.Mesh(pill(h), titanium); b.position.set(side * (PW / 2 + 0.004), y, 0); phone.add(b);
  });
  // linee delle antenne
  const band = new THREE.MeshStandardMaterial({ color: 0x1a1a1d, roughness: 0.6 });
  [[-1, 0.86], [1, 0.86], [-1, -0.86], [1, -0.86]].forEach(([side, y]) => { const a = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.012, PD + PB), band); a.position.set(side * (PW / 2 + 0.0005), y, 0); phone.add(a); });
  let screenMode = ""; const setScreen = (m) => { if (m === screenMode) return; screenMode = m; drawScreen(screenCanvas, m, imgs); screenTex.needsUpdate = true; };
  setScreen("wallet");

  /* ombra morbida sullo sfondo */
  const sh = document.createElement("canvas"); sh.width = sh.height = 256;
  { const x = sh.getContext("2d"), g = x.createRadialGradient(128, 128, 10, 128, 128, 126); g.addColorStop(0, "rgba(90,40,10,.55)"); g.addColorStop(0.55, "rgba(90,40,10,.18)"); g.addColorStop(1, "rgba(90,40,10,0)"); x.fillStyle = g; x.fillRect(0, 0, 256, 256); }
  const shadowMat = new THREE.MeshBasicMaterial({ map: tex(sh), transparent: true, depthWrite: false, toneMapped: false });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), shadowMat); shadow.position.z = -1.4; shadow.renderOrder = -1; rig.add(shadow);

  /* carte: tessere sagomate con angoli arrotondati */
  const CW = 1, CH = 1.4, CR = 0.085, CD = 0.012, CB = 0.004, CZ = CD / 2 + CB;
  const cardBody = slab(CW, CH, CR, CD, CB, 3), cardFace = face(CW, CH, CR, 20);
  const cards = CARDS.map((d) => {
    const front = new THREE.MeshPhysicalMaterial({ map: tex(drawPass(d, imgs)), roughness: 0.38, clearcoat: 1, clearcoatRoughness: 0.12, transparent: true });
    const back = new THREE.MeshPhysicalMaterial({ map: tex(drawBack(d, imgs)), roughness: 0.42, clearcoat: 0.9, clearcoatRoughness: 0.18, transparent: true });
    const side = new THREE.MeshPhysicalMaterial({ color: d.edge, roughness: 0.35, clearcoat: 0.6, transparent: true });
    const mesh = new THREE.Group();
    const b = new THREE.Mesh(cardBody, side), f = new THREE.Mesh(cardFace, front), r = new THREE.Mesh(cardFace, back);
    f.position.z = CZ + 0.0005; r.rotation.y = Math.PI; r.position.z = -CZ - 0.0005;
    mesh.add(b, f, r); rig.add(mesh);
    return { d, mesh, parts: [b, f, r], front, mats: [front, back, side] };
  });
  const aurora = cards[0];
  const completeTex = tex(drawPass(CARDS[0], imgs, true)), normalTex = aurora.front.map;

  /* notifica */
  const notifCanvas = drawNotif(imgs);
  const notif = new THREE.Mesh(new THREE.PlaneGeometry(0.98, 0.33), new THREE.MeshBasicMaterial({ map: tex(notifCanvas), transparent: true, toneMapped: false, depthWrite: false }));
  phone.add(notif);

  /* coriandoli */
  const NC = 150;
  const conf = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.04, 0.07), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false }), NC);
  conf.frustumCulled = false; rig.add(conf);
  const palette = [0xfd6b11, 0xff9a52, 0x161618, 0xffffff, 0xffd2b0].map((c) => new THREE.Color(c));
  const cp = Array.from({ length: NC }, (_, i) => ({ p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Euler(), w: new THREE.Vector3(), s: 0 }));
  cp.forEach((c, i) => conf.setColorAt(i, palette[i % palette.length]));
  let confT = -1;
  const burst = (origin) => {
    confT = 0;
    cp.forEach((c) => {
      c.p.copy(origin).add(new THREE.Vector3((Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3, 0));
      const a = Math.random() * Math.PI * 2, sp = 1.4 + Math.random() * 2.2;
      c.v.set(Math.cos(a) * sp * 0.6, Math.abs(Math.sin(a)) * sp * 0.8 + 1.4, (Math.random() - 0.2) * 1.6);
      c.r.set(Math.random() * 6, Math.random() * 6, Math.random() * 6); c.w.set(Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 10 - 5);
      c.s = 0.7 + Math.random() * 0.8;
    });
  };
  const dummy = new THREE.Object3D();
  const updConf = (dt) => {
    if (confT < 0) { conf.visible = false; return; }
    confT += dt; conf.visible = true;
    cp.forEach((c, i) => {
      c.v.y -= 4.2 * dt; c.v.multiplyScalar(1 - 0.9 * dt); c.p.addScaledVector(c.v, dt);
      c.r.x += c.w.x * dt; c.r.y += c.w.y * dt; c.r.z += c.w.z * dt;
      dummy.position.copy(c.p); dummy.rotation.copy(c.r); dummy.scale.setScalar(c.s * clamp01(3.2 - confT)); dummy.updateMatrix(); conf.setMatrixAt(i, dummy.matrix);
    });
    conf.instanceMatrix.needsUpdate = true;
    if (confT > 3.4) confT = -1;
  };

  /* posizioni: apertura (libere) e nel Wallet (slot) */
  const FREE = [
    { p: [0.2, -0.08, 0.6], r: [-0.12, -0.42, 0.07], s: 1.26 },
    { p: [-0.7, 0.42, -0.3], r: [0.1, -0.5, 0.2], s: 1.08 },
    { p: [0.92, 0.6, -0.75], r: [0.14, -0.22, -0.17], s: 1.02 },
    { p: [-0.42, -0.62, -0.95], r: [-0.12, -0.3, -0.24], s: 1.0 },
  ];
  const SLOT_K = [3, 0, 1, 2]; // aurora davanti in basso, poi gino, capelli, fit dall'alto
  const slotLocal = (k, sink) => ({ p: new THREE.Vector3(0, 0.03 - k * 0.17 - sink * 0.1, 0.075 + k * 0.018 - sink * 0.05), s: 0.76 - sink * 0.04 });
  const vA = new THREE.Vector3(), vB = new THREE.Vector3(), qA = new THREE.Quaternion(), qB = new THREE.Quaternion(), eul = new THREE.Euler(), mtx = new THREE.Matrix4(), sclV = new THREE.Vector3();

  /* layout responsivo */
  let mobile = mobileQ(), fitA = null, fitB = null;
  const layout = () => {
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    mobile = mobileQ();
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, dprCap));
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z, halfW = halfH * camera.aspect;
    if (mobile) {
      // su telefono la scena occupa solo lo spazio libero sotto al testo
      const steps = [...document.querySelectorAll(".story__steps .step")];
      const bottom = (list) => Math.max(0, ...list.map((el) => el.offsetTop + el.offsetHeight));
      const fit = (top) => {
        const y0 = top + 34, y1 = h - 34, rh = Math.max(h * 0.22, y1 - y0);
        const sc = Math.min((rh / h) * 2 * halfH / 2.5, (halfW * 1.84) / 2.4);
        return { s: sc, y: halfH - ((y0 + y1) / 2 / h) * 2 * halfH };
      };
      fitA = fit(bottom(steps.slice(0, 1))); fitB = fit(bottom(steps.slice(1)));
      world.position.x = 0;
    } else {
      // su schermi larghi la scena occupa lo spazio libero a destra del testo
      const hero = document.querySelector(".story__steps .step");
      const x0 = (hero ? hero.offsetLeft + hero.offsetWidth : w * 0.45) + 32, x1 = w - 64, y0 = 90, y1 = h - 70;
      const sc = Math.min(((y1 - y0) / h) * 2 * halfH / 2.4, ((x1 - x0) / w) * 2 * halfW / 2.5);
      fitA = fitB = null;
      world.scale.setScalar(sc);
      world.position.set(((x0 + x1) / w - 1) * halfW, halfH - ((y0 + y1) / h) * halfH, 0);
    }
  };
  layout(); addEventListener("resize", layout);
  if (document.fonts) document.fonts.ready.then(layout);

  /* puntatore */
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  addEventListener("pointermove", (e) => { mouse.x = e.clientX / innerWidth - 0.5; mouse.y = e.clientY / innerHeight - 0.5; }, { passive: true });

  /* ciclo */
  let visible = true, Tsm = 0, last = performance.now(), t = 0, lastReward = 0, slow = 0;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: "100px" }).observe(canvas);

  const frame = (now) => {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) { last = now; return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    // protezione prestazioni
    if (dt > 0.045) { if ((slow += dt) > 2.5 && dprCap > 1) { dprCap = 1; layout(); } } else slow = Math.max(0, slow - dt * 0.5);

    const Tt = FH.progress * FH.total;
    Tsm = reduce ? Tt : Tsm + (Tt - Tsm) * Math.min(1, dt * 5);
    const T = Tsm;

    // parametri della storia
    const phoneIn = seg(T, 0.45, 1.35);
    const sink = seg(T, 2.0, 2.35) * (1 - seg(T, 3.7, 4.05));
    const nIn = seg(T, 2.3, 2.8), nPop = seg(T, 2.75, 3.25), nOut = seg(T, 3.45, 3.8);
    const reward = seg(T, 3.85, 4.9);
    const fly = [seg(T, 1.05, 1.7), seg(T, 0.95, 1.6), seg(T, 0.85, 1.5), seg(T, 0.75, 1.4)];

    mouse.sx += (mouse.x - mouse.sx) * Math.min(1, dt * 3); mouse.sy += (mouse.y - mouse.sy) * Math.min(1, dt * 3);
    rig.rotation.y = reduce ? 0 : mouse.sx * 0.28; rig.rotation.x = reduce ? 0 : mouse.sy * 0.14;
    if (mobile && fitA) {
      world.scale.setScalar(lerp(fitA.s, fitB.s, phoneIn));
      world.position.y = lerp(fitA.y, fitB.y, phoneIn);
    }

    // telefono
    phone.position.set(0, lerp(-3.4, 0, phoneIn) + (reduce ? 0 : Math.sin(t * 0.9) * 0.025 * phoneIn), 0);
    const rotY = lerp(-0.7, -0.3, phoneIn) + 0.2 * seg(T, 2.0, 2.8) - 0.12 * nPop + 0.12 * nOut - 0.25 * seg(T, 3.8, 4.6);
    phone.rotation.set(0.04 + 0.04 * Math.sin(t * 0.5) * (reduce ? 0 : 1), rotY, lerp(0.12, 0.03, phoneIn));
    phone.visible = phoneIn > 0.001;
    phone.updateMatrix();
    shadow.position.set(lerp(0.15, phone.position.x + 0.28, phoneIn), lerp(-0.1, phone.position.y - 0.32, phoneIn), -1.4);
    shadow.scale.set(lerp(3.4, 2.1, phoneIn), lerp(3.2, 3.4, phoneIn), 1);
    shadowMat.opacity = 0.55;
    setScreen(sink > 0.55 && reward < 0.02 ? "lock" : "wallet");

    // carte
    cards.forEach((c, i) => {
      const f = FREE[i], k = SLOT_K[i], a = fly[i];
      const bob = reduce ? 0 : Math.sin(t * 0.8 + i * 1.7) * 0.06 * (1 - a);
      vA.set(f.p[0], f.p[1] + bob, f.p[2]);
      eul.set(f.r[0] + (reduce ? 0 : Math.sin(t * 0.6 + i) * 0.04 * (1 - a)), f.r[1], f.r[2]); qA.setFromEuler(eul);
      let sl = slotLocal(k, i === 0 ? sink * (1 - reward) : sink), op = 1 - (i === 0 ? sink * (1 - seg(T, 3.7, 3.95)) : sink) * 0.999;
      let spin = 0, slotP = sl.p.clone(), slotS = sl.s;
      if (i === 0 && reward > 0) {
        // il premio esce dal telefono e gira su sé stesso
        slotP.lerp(new THREE.Vector3(0.05, 0.1, 0.95), Math.sin(Math.min(1, reward * 1.25) * Math.PI / 2));
        slotS = lerp(sl.s, 0.98, clamp01(reward * 1.4));
        spin = reward * Math.PI * 2;
        op = 1;
      }
      mtx.compose(slotP, new THREE.Quaternion().setFromEuler(new THREE.Euler(0, spin, 0)), sclV.setScalar(slotS));
      mtx.premultiply(phone.matrix);
      mtx.decompose(vB, qB, sclV);
      const arc = Math.sin(a * Math.PI) * 0.55;
      c.mesh.position.lerpVectors(vA, vB, a); c.mesh.position.z += arc;
      c.mesh.quaternion.slerpQuaternions(qA, qB, a);
      c.mesh.scale.setScalar(lerp(f.s, sclV.x, a));
      c.mats.forEach((m) => (m.opacity = op));
      c.mesh.visible = op > 0.01;
      c.parts.forEach((p) => (p.renderOrder = 10 + k));
    });
    const showComplete = reward > 0.5;
    if ((aurora.front.map === completeTex) !== showComplete) { aurora.front.map = showComplete ? completeTex : normalTex; aurora.front.needsUpdate = true; }
    if (reward > 0.72 && lastReward <= 0.72 && !reduce) burst(aurora.mesh.position.clone());
    if (reward < 0.5) confT = -1;
    lastReward = reward;
    updConf(dt);

    // notifica
    const ny = lerp(0.62, -0.02, nIn) + 0.5 * nOut, nz = 0.075 + nPop * (1 - nOut) * 0.85;
    notif.position.set(0, ny, nz);
    notif.rotation.set(-0.06 * nPop * (1 - nOut), (0.32 * nPop - 0.12) * (1 - nOut) * nPop, 0);
    notif.scale.setScalar(1 + nPop * (1 - nOut) * 0.32);
    notif.material.opacity = nIn * (1 - nOut);
    notif.visible = notif.material.opacity > 0.01;
    notif.renderOrder = 30;

    renderer.render(scene, camera);
  };
  requestAnimationFrame(frame);
  root.classList.add("has3d");
}

if (!canvas || !webgl()) root.classList.add("no3d");
else init().catch((e) => { console.error(e); root.classList.add("no3d"); });
