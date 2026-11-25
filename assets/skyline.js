/* Animated ASCII header: a file tree and the world it describes. Drawn on <canvas class="skyline">. */
const W = 128, H = 36, SPLIT = 36, GROUND = 34;
const cv = document.querySelector("canvas.skyline");
if (cv) {
const ctx = cv.getContext("2d");
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
let C = {};
const loadColors = () => C = { ink: css("--color-ink"), ink2: css("--color-ink-2"), ink3: css("--color-ink-3"), acc: css("--color-accent") };

// ---------- deterministic randomness ----------
const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) ^ 0x5bd1e995; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };

// ---------- static layer ----------
const S = Array.from({ length: H }, () => Array.from({ length: W }, () => null));   // [ch, color, alpha]
const put = (r, c, ch, col = "ink3", a = 1) => { if (r >= 0 && r < H && c >= 0 && c < W && ch !== " ") S[r][c] = [ch, col, a]; };
const art = (rows, top, left, col, a) => rows.forEach((row, i) => [...row].forEach((ch, j) => put(top + i, left + j, ch, col, a)));

// the tree
const listing = [
  "city/", "├── districts/", "│   ├── north.json", "│   ├── east.json", "│   ├── south.json", "│   ├── west.json",
  "│   └── center.json", "├── reservoir.json", "├── grid/", "│   ├── plant.json", "│   └── battery.json", "├── parks/",
  "│   ├── ridge.json", "│   ├── valley.json", "│   └── marsh.json", "├── policies.json", "└── weather.csv"];
const rowOf = i => GROUND - (listing.length - 1 - i) * 2;   // the last file sits on the city's floor
const nameEnd = {};
listing.forEach((s, i) => {
  const r = rowOf(i), chars = [...s];
  chars.forEach((ch, c) => put(r, 2 + c, ch, /[│├└─]/.test(ch) ? "ink3" : "ink2"));
  const lead = s.match(/^[│ ]*/)[0];
  [...lead].forEach((ch, c) => { if (ch === "│") put(r - 1, 2 + c, "│", "ink3"); });
  if (/^[├]/.test(s) && i < listing.length - 1) put(r + 1, 2, "│", "ink3");
  nameEnd[i] = 2 + chars.length;
  for (let c = nameEnd[i] + 1; c < SPLIT; c++) put(r, c, "·", "ink3", 0.35);
});
for (let r = 2; r < rowOf(16); r++) if (!S[r][2]) put(r, 2, "│", "ink3");
for (let r = rowOf(1) + 1; r < rowOf(6); r++) if (!S[r][6]) put(r, 6, "│", "ink3");
for (let r = rowOf(8) + 1; r < rowOf(10); r++) if (!S[r][6]) put(r, 6, "│", "ink3");
for (let r = rowOf(11) + 1; r < rowOf(14); r++) if (!S[r][6]) put(r, 6, "│", "ink3");

// ground
for (let c = 39; c < W; c++) put(GROUND + 1, c, hash(c, 1) > 0.5 ? "‾" : "-", "ink3", 0.35);

// weather mast with a cloud
const WEATHER = ["  .--.   ", " (    ). ", "(___.___)", "         ", "         ", "    |    ", "   -+-   ", "    |    ", "    |    ", "   /|\\   "];
const WX = 40, WT = GROUND - WEATHER.length + 1;
art(WEATHER, WT, WX, "ink2", 0.8);
// town hall
const HALL = ["    |    ", "   _|_   ", "  /   \\  ", " /_____\\ ", " | | | | ", " | | | | ", "_|_|_|_|_"];
const HX = 50, HT = GROUND - HALL.length + 1;
art(HALL, HT, HX, "ink2", 0.8);
// forest
const trees = [{ c: 64, n: 3 }, { c: 69, n: 4 }, { c: 74, n: 3 }, { c: 60, n: 2 }];
const leaves = [];
trees.forEach(t => {
  for (let i = 0; i < t.n; i++) {
    const r = GROUND - t.n + i, w = 2 * i + 1;
    for (let j = 0; j < w; j++) {
      const c = t.c - i + j, ch = i === 0 ? "^" : j === 0 ? "/" : j === w - 1 ? "\\" : "^";
      if (ch === "^") leaves.push([r, c]); else put(r, c, ch, "ink2", 0.75);
    }
  }
  put(GROUND, t.c, "|", "ink3");
});
// power plant
const PLANT = ["   ||  ||   ", "   ||  ||   ", " __||__||__ ", "|  _    _  |", "| |_|  |_| |", "|__________|"];
const PX = 78, PT = GROUND - PLANT.length + 1;
art(PLANT, PT, PX, "ink2", 0.8);
const chimneys = [PX + 4, PX + 8];
// reservoir with hills behind
const RES = ["      /\\          ", "     /  \\    /\\   ", "    /    \\__/  \\  ", "                 |", "                 |", "_________________|"];
const RX = 92, RT = GROUND - RES.length + 1;
art(RES, RT, RX, "ink3", 0.8);
// city
const buildings = [{ x: 110, w: 5, h: 9 }, { x: 114, w: 5, h: 14 }, { x: 118, w: 5, h: 11 }, { x: 122, w: 5, h: 7 }];
const windows = [];
buildings.forEach(b => {
  const top = GROUND - b.h + 1;
  for (let c = b.x + 1; c < b.x + b.w - 1; c++) put(top, c, "_", "ink2", 0.85);
  for (let r = top + 1; r <= GROUND; r++) { put(r, b.x, "|", "ink2", 0.85); put(r, b.x + b.w - 1, "|", "ink2", 0.85); }
  for (let r = top + 2; r < GROUND; r++) for (let c = b.x + 1; c < b.x + b.w - 1; c += 2) windows.push([r, c, hash(r, c), 0.04 + hash(c, r) * 0.08]);
  for (let c = b.x; c < b.x + b.w; c++) put(GROUND, c, "_", "ink2", 0.85);
});
const tallest = buildings[1], ANT = GROUND - tallest.h;
put(ANT, tallest.x + 2, "|", "ink2", 0.85);

// ---------- data routes: from each place up, then left along its folder row into the name ----------
const routes = [];
function route(i, x, fromRow, accent) {
  const r = rowOf(i), cells = [];
  for (let y = fromRow; y > r; y--) cells.push([y, x, "│"]);
  if (fromRow > r) cells.push([r, x, "╮"]);
  for (let c = x - (fromRow > r ? 1 : 0); c >= SPLIT; c--) cells.push([r, c, "─"]);
  for (let c = SPLIT - 1; c > nameEnd[i]; c--) cells.push([r, c, null]);     // ride the dotted leader into the name
  routes.push({ i, cells, accent, last: -1, pulse: -1e9, speed: accent ? 9 : 6 + hash(i, 3) * 3 });
  cells.forEach(([y, c, ch]) => { if (ch) put(y, c, ch, accent ? "acc" : "ink3", accent ? 0.35 : 0.22); });
}
route(16, WX + 2, GROUND - 1, false);                   // weather.csv  <- mast
route(15, HX, HT + 3, false);                           // policies.json <- town hall
route(11, 69, GROUND - 5, false);                       // parks/  <- forest
route(8, PX + 11, PT + 2, false);                       // grid/   <- power plant
route(7, RX + 6, RT - 1, false);                        // reservoir.json <- reservoir
route(1, tallest.x + 2, ANT - 2, true);                 // districts/ <- city

// stars, kept off the routes and the art
const taken = (r, c) => S[r][c] !== null;
const stars = [];
for (let r = 0; r < 24; r++) for (let c = 40; c < W; c++) if (!taken(r, c) && hash(c * 3, r * 7) > 0.965) stars.push([r, c, hash(r, c) > 0.8 ? "*" : hash(c, r) > 0.5 ? "·" : ".", hash(c, r * 2)]);

// ---------- drawing ----------
let cw = 10, ch = 18, fs = 16, X0 = 0;
function fit() {
  const dpr = devicePixelRatio || 1, avail = cv.parentElement.clientWidth;
  X0 = avail < 700 ? 38 : 0;                         // narrow screens: skyline only
  const cols = W - X0;
  fs = Math.min(avail / (cols * 0.6), (innerHeight * 0.5) / (H * 1.25)); cw = fs * 0.6; ch = fs * 1.25;   // never taller than half the screen
  cv.width = Math.round(cols * cw * dpr); cv.height = Math.round(H * ch * dpr);
  cv.style.width = cols * cw + "px"; cv.style.height = H * ch + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.font = `300 ${fs}px "JetBrains Mono", ui-monospace, Menlo, monospace`;
  ctx.textBaseline = "middle"; ctx.textAlign = "center";
}
const draw = (r, c, s, col, a) => { if (c < X0) return; ctx.globalAlpha = a; ctx.fillStyle = C[col] || col; ctx.fillText(s, (c - X0) * cw + cw / 2, r * ch + ch / 2); };

function frame(now) {
  const t = now / 1000;
  ctx.clearRect(0, 0, cv.width, cv.height);
  // stars twinkle
  for (const [r, c, s, ph] of stars) draw(r, c, s, "ink3", 0.15 + 0.45 * (0.5 + 0.5 * Math.sin(t * (0.6 + ph) + ph * 40)));
  // a slow cloud drifting across the sky
  for (let k = 0; k < 2; k++) {
    const y = 6 + k * 7, x0 = 40 + ((-(t * (1.2 + k * 0.5)) + k * 37) % 88 + 88) % 88;
    ["  .--.", "(    )--.", "`-----'"].forEach((row, i) => [...row].forEach((s, j) => {
      const c = Math.round(x0 + j); if (s !== " " && c >= 40 && c < W && !taken(y + i, c)) draw(y + i, c, s, "ink3", 0.16);
    }));
  }
  // static layer, with labels pulsing when data arrives
  const pulse = {};
  for (const ro of routes) pulse[ro.i] = Math.max(0, 1 - (t - ro.pulse) / 0.9);
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    const v = S[r][c]; if (!v) continue;
    let [s, col, a] = v;
    const li = (r - rowOf(0)) / 2;
    if (c < SPLIT && Number.isInteger(li) && pulse[li] > 0 && c > 2 && c < nameEnd[li] && !/[│├└─]/.test(s)) {
      const p = pulse[li], acc = routes.find(x => x.i === li).accent;
      draw(r, c, s, acc ? "acc" : "ink", Math.min(1, a + p)); continue;
    }
    draw(r, c, s, col, a);
  }
  // rain under the cloud, now and then
  const raining = Math.sin(t * 0.25) > 0.1;
  if (raining) for (let i = 0; i < 6; i++) { const c = WX + 1 + i, r = WT + 3 + Math.floor((t * 6 + hash(i, 9) * 9) % 2); draw(r, c, "'", "ink3", 0.55); }
  // town hall flag
  draw(HT - 0, HX + 5, Math.floor(t * 2) % 2 ? ">" : "~", "ink2", 0.85);
  // leaves breathe
  for (const [r, c] of leaves) draw(r, c, "^", "ink2", 0.45 + 0.35 * (0.5 + 0.5 * Math.sin(t * 0.9 + c * 0.7 + r)));
  // smoke rises and fades
  chimneys.forEach((x, k) => {
    for (let p = 0; p < 5; p++) {
      const age = ((t * 0.7 + p / 5 + k * 0.37) % 1), r = PT - 1 - Math.floor(age * 6), c = x + Math.round(-age * 3 + Math.sin(t + p) * 0.5);
      draw(r, c, age < 0.3 ? "o" : age < 0.65 ? "O" : "(", "ink3", 0.6 * (1 - age));
    }
  });
  // plant windows hum
  [[PT + 4, PX + 3], [PT + 4, PX + 8]].forEach(([r, c], k) => draw(r, c, "_", "acc", 0.35 + 0.3 * Math.sin(t * 3 + k)));
  // water ripples
  for (let r = RT + 3; r < GROUND; r++) for (let c = RX; c < RX + 17; c++) {
    const v = Math.sin(c * 0.9 - t * 1.6 + r * 2);
    draw(r, c, v > 0.35 ? "~" : v > -0.4 ? "-" : " ", "ink3", 0.35 + 0.3 * v);
  }
  // city windows light up and go dark, each on its own slow cycle
  for (const [r, c, ph, f] of windows) {
    const on = 0.5 + 0.5 * Math.sin(t * f * 6.283 + ph * 40);
    const lit = Math.max(0, (on - 0.35) / 0.65);
    draw(r, c, "▪", "ink3", 0.18);
    if (lit > 0) draw(r, c, "▪", "acc", lit * 0.95);
  }
  draw(ANT - 1, tallest.x + 2, "*", "acc", 0.3 + 0.7 * (Math.sin(t * 2.2) > 0.6 ? 1 : 0));
  // data flowing from the places into the folders
  for (const ro of routes) {
    const n = ro.cells.length, gap = 11, k = Math.ceil(n / gap);
    const head0 = t * ro.speed;
    for (let j = 0; j < k; j++) {
      const pos = (head0 + j * gap) % n, idx = Math.floor(pos);
      for (let tr = 0; tr < 4; tr++) {
        const q = idx - tr; if (q < 0) break;
        const [r, c] = ro.cells[q];
        draw(r, c, tr === 0 ? "•" : "·", ro.accent ? "acc" : "ink2", tr === 0 ? 0.95 : 0.5 - tr * 0.12);
      }
      if (idx >= n - 1 && ro.last !== Math.floor((head0 + j * gap) / n) * 100 + j) { ro.last = Math.floor((head0 + j * gap) / n) * 100 + j; ro.pulse = t; }
    }
  }
  ctx.globalAlpha = 1;
}

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
let lastT = 0, visible = true, started = false;
function loop(now) { if (visible && now - lastT > 33) { frame(now); lastT = now; } requestAnimationFrame(loop); }
new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(cv);   // stop drawing when scrolled away
document.fonts.ready.then(() => { loadColors(); fit(); if (reduce) frame(4000); else if (!started) { started = true; requestAnimationFrame(loop); } });
addEventListener("resize", () => { fit(); if (reduce) frame(4000); });
new MutationObserver(() => { loadColors(); if (reduce) frame(4000); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
}
