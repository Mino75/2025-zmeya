'use strict';

/*
 ZMEYA — Emoji Snake (Verbose Edition)
 ------------------------------------
 Fully cleaned version: pad-only controls, no arrow cluster.
*/

(function ZmeyaVerboseIIFE() {
  // -----------------------------
  // Section: Static Data
  // -----------------------------

  const LANGS = ["mg", "fr", "cn", "jp", "ru"];

  const INSECTS = [
    { emoji: "🐌", names: { en: "snail", fr: "escargot", cn: "蜗牛", jp: "カタツムリ", ru: "улитка", mg: "sokina" } },
    { emoji: "🦋", names: { en: "butterfly", fr: "papillon", cn: "蝴蝶", jp: "チョウ", ru: "бабочка", mg: "lolo" } },
    { emoji: "🐛", names: { en: "caterpillar", fr: "chenille", cn: "毛毛虫", jp: "いもむし", ru: "гусеница", mg: "kankana" } },
    { emoji: "🐜", names: { en: "ant", fr: "fourmi", cn: "蚂蚁", jp: "アリ", ru: "муравей", mg: "vitsika" } },
    { emoji: "🐝", names: { en: "bee", fr: "abeille", cn: "蜜蜂", jp: "ハチ", ru: "пчела", mg: "tantely" } },
    { emoji: "🪲", names: { en: "beetle", fr: "scarabée", cn: "甲虫", jp: "甲虫", ru: "жук", mg: "voangory" } },
    { emoji: "🐞", names: { en: "ladybug", fr: "coccinelle", cn: "瓢虫", jp: "テントウムシ", ru: "божья коровка", mg: "voangory mena" } },
    { emoji: "🦗", names: { en: "cricket", fr: "grillon", cn: "蟋蟀", jp: "コオロギ", ru: "сверчок", mg: "valala" } },
    { emoji: "🪳", names: { en: "cockroach", fr: "cafard", cn: "蟑螂", jp: "ゴキブリ", ru: "тараканы", mg: "kadradraka" } },
    { emoji: "🕷️", names: { en: "spider", fr: "araignée", cn: "蜘蛛", jp: "クモ", ru: "паук", mg: "hala" } },
    { emoji: "🦂", names: { en: "scorpion", fr: "scorpion", cn: "蝎子", jp: "サソリ", ru: "скорпион", mg: "sokorpiona" } },
    { emoji: "🦟", names: { en: "mosquito", fr: "moustique", cn: "蚊子", jp: "カ", ru: "комар", mg: "moka" } },
    { emoji: "🪰", names: { en: "housefly", fr: "mouche", cn: "苍蝇", jp: "ハエ", ru: "муха", mg: "lolo vola" } },
    { emoji: "🪱", names: { en: "earthworm", fr: "ver de terre", cn: "蚯蚓", jp: "ミミズ", ru: "дождевой червь", mg: "olitra" } },
  ];

  const BOSSES = [
    { emoji: "🐊", names: { en: "crocodile", fr: "crocodile", cn: "鳄鱼", jp: "ワニ", ru: "крокодил", mg: "voay" } },
    { emoji: "🐅", names: { en: "tiger", fr: "tigre", cn: "老虎", jp: "トラ", ru: "тигр", mg: "tigra" } },
    { emoji: "🐘", names: { en: "elephant", fr: "éléphant", cn: "大象", jp: "ゾウ", ru: "слон", mg: "elefanta" } },
    { emoji: "🦖", names: { en: "T-Rex", fr: "tyrannosaure", cn: "霸王龙", jp: "ティラノサウルス", ru: "тираннозавр", mg: "tiranosoro" } },
  ];

  const DECOR = ["🌸", "💮", "🪷", "🏵️", "🌾", "🌻", "🌼", "🌷"];

  // -----------------------------
  // Section: Tunable Config
  // -----------------------------

  const GROWTH_PER_BUG = 2;
  const START_SPEED_MS = 180;
  const MIN_SPEED_MS = 70;
  const SPEEDUP_PER_EAT = 6;

  const MAX_BUGS = 6;
  const BUG_TTL_SEC = 15;
  const GRID_MIN = 12;

  const LEVELS = [
    { n: 1, boss: null,      intro: "Warm-up. Eat 10 bugs to advance.",             eatGoal: 10 },
    { n: 2, boss: BOSSES[0], intro: "Boss appears! Entangle it by blocking its four sides.", eatGoal: 0 },
    { n: 3, boss: BOSSES[1], intro: "Watch the stripes… entangle again!",            eatGoal: 0 },
    { n: 4, boss: BOSSES[2], intro: "Big feet, bigger circle.",                      eatGoal: 0 },
    { n: 5, boss: BOSSES[3], intro: "Final boss. Lasso the dino!",                   eatGoal: 0 },
  ];

  // -----------------------------
  // Section: DOM Handles
  // -----------------------------

  const $ = (sel) => document.querySelector(sel);

  const canvas = $("#game");
  const ctx = canvas.getContext("2d");

  const overlayEl = $("#overlay");
  const toastsEl = $("#toasts");
  const scoreEl = $("#score");
  const bestEl  = $("#best");
  const speedEl = $("#speed");
  const levelEl = $("#level");

  const startBtn    = $("#startBtn");
  const pauseTopBtn = $("#pauseTop");
  const padEl       = $("#pad"); // NEW: the only on-screen control

  // -----------------------------
  // Section: Mutable Game State
  // -----------------------------

  let grid = { cols: 24, rows: 36, size: 16 };
  let snake = [];
  let dir = { x: 1, y: 0 };
  let nextDir = { x: 1, y: 0 };
  let growthOwed = 0;
  let bugs = [];
  let decor = [];
  let score = 0;
  let best = Number(localStorage.getItem("zmeyaHighScoreV1") || 0);
  let speedMs = START_SPEED_MS;

  let rafHandle = null;
  let running = false;
  let paused = false;
  let lastTickAt = 0;

  let eatenThisLevel = 0;
  let level = 1;

  let boss = null;
  let bossCell = null;
  let bossAlive = false;

  let nextBugSpawnAtSec = 0;

  // -----------------------------
  // Section: Canvas Sizing & Grid
  // -----------------------------

  function fitCanvasToElement() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const targetCellPx = 26;
    const cols = Math.max(GRID_MIN, Math.floor(rect.width / targetCellPx));
    const rows = Math.max(GRID_MIN, Math.floor(rect.height / targetCellPx));
    const size = Math.floor(Math.min(rect.width / cols, rect.height / rows));
    grid = { cols, rows, size };
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
  }

  // -----------------------------
  // Section: Small Utilities
  // -----------------------------

  const randInt = (n) => Math.floor(Math.random() * n);
  const pick = (arr) => arr[randInt(arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const nowSec = () => Date.now() / 1000;
  const wrapX = (x) => (x + grid.cols) % grid.cols;
  const wrapY = (y) => (y + grid.rows) % grid.rows;
  const vibrate = (ms) => { if (navigator.vibrate) navigator.vibrate(ms); };

  function pickEmptyCell(avoidBoss = true) {
    let attempts = 0;
    while (attempts++ < 1000) {
      const x = randInt(grid.cols);
      const y = randInt(grid.rows);
      const hitsSnake = snake.some((s) => s.x === x && s.y === y);
      const hitsBug = bugs.some((b) => b.x === x && b.y === y);
      const hitsBoss = avoidBoss && bossAlive && bossCell && bossCell.x === x && bossCell.y === y;
      if (!hitsSnake && !hitsBug && !hitsBoss) return { x, y };
    }
    return { x: Math.floor(grid.cols / 2), y: Math.floor(grid.rows / 2) };
  }

  // overlay + toasts
  function showCard(title, desc, cta = "") {
    overlayEl.innerHTML =
      '<div class="card"><h2>' + title + '</h2><p>' + desc + '</p><p><em>' + cta + '</em></p></div>';
  }
  function clearCard() { overlayEl.innerHTML = ""; }

  function flashToast(text, xPct = null, yPct = null) {
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = text;
    const left = xPct != null ? xPct : clamp(Math.random() * 100, 8, 92);
    const top  = yPct != null ? yPct : clamp(Math.random() * 100, 12, 88);
    el.style.left = left + "%";
    el.style.top = top + "%";
    toastsEl.appendChild(el);
    setTimeout(() => el.remove(), 1300);
  }
  function randomLangName(entry) {
    const lang = pick(LANGS);
    return entry.names[lang] || entry.names.en;
  }

  // -----------------------------
  // Section: Decor
  // -----------------------------

  function seedDecor() {
    decor = [];
    const baseByArea = Math.floor((grid.cols * grid.rows) / 120);
    const minWanted = 15 + randInt(7);
    const count = Math.max(minWanted, baseByArea);

    // ≥ 3 cells apart
    const okDistance = (x, y) => decor.every((d) => {
      const dx = d.x - x, dy = d.y - y;
      return (dx * dx + dy * dy) >= 9;
    });

    for (let i = 0; i < count; i++) {
      let pos = null, tries = 0;
      while (tries++ < 500) {
        const c = pickEmptyCell(false);
        if (okDistance(c.x, c.y)) { pos = c; break; }
      }
      if (!pos) pos = pickEmptyCell(false);
      decor.push({ x: pos.x, y: pos.y, emoji: pick(DECOR), alpha: 0.2 + Math.random() * 0.35 });
    }
  }

  // -----------------------------
  // Section: Bugs (Edibles)
  // -----------------------------

  function maybeSpawnBug() {
    const t = nowSec();
    if (t >= nextBugSpawnAtSec && bugs.length < MAX_BUGS) {
      const pos = pickEmptyCell(true);
      const entry = pick(INSECTS);
      bugs.push({ x: pos.x, y: pos.y, entry, expiresAt: t + BUG_TTL_SEC });
      nextBugSpawnAtSec = t + (0.8 + Math.random() * 1.4);
    }
    bugs = bugs.filter((b) => b.expiresAt > t);
  }

  // -----------------------------
  // Section: Boss Handling
  // -----------------------------

  function pickEmptyCellWithMargin(margin) {
    let attempts = 0;
    while (attempts++ < 1000) {
      const x = margin + randInt(Math.max(1, grid.cols - margin * 2));
      const y = margin + randInt(Math.max(1, grid.rows - margin * 2));
      const hitsSnake = snake.some((s) => s.x === x && s.y === y);
      const hitsBug   = bugs.some((b) => b.x === x && b.y === y);
      const hitsBoss  = bossAlive && bossCell && bossCell.x === x && bossCell.y === y;
      if (!hitsSnake && !hitsBug && !hitsBoss) return { x, y };
    }
    return {
      x: clamp(Math.floor(grid.cols / 2), margin, grid.cols - 1 - margin),
      y: clamp(Math.floor(grid.rows / 2), margin, grid.rows - 1 - margin),
    };
  }

  function spawnBossIfNeeded() {
    const plan = LEVELS[level - 1];
    if (!plan || !plan.boss) return;
    boss = plan.boss;
    bossCell = pickEmptyCellWithMargin(4); // ≥4 from edges
    bossAlive = true;
  }

// Boss is entangled if on each orthogonal side (L/R/U/D)
// there is at least one snake segment at distance 1 or 2.
// Toroidal wrapping still applies.
function isBossEntangled() {
  if (!bossAlive || !bossCell) return false;

  const x = bossCell.x, y = bossCell.y;
  const hasAt = (cx, cy) => snake.some(s => s.x === wrapX(cx) && s.y === wrapY(cy));

  // side is blocked if distance 1 OR 2 in that direction has a snake segment
  const blocked = (dx, dy) => (
    hasAt(x + dx, y + dy) || hasAt(x + 2*dx, y + 2*dy)
  );

  return (
    blocked(-1, 0) &&  // left
    blocked( 1, 0) &&  // right
    blocked( 0,-1) &&  // up
    blocked( 0, 1)     // down
  );
}


  function defeatBoss() {
    bossAlive = false;
    score += 150;
    flashToast(randomLangName(boss));
    advanceLevel();
  }

  // -----------------------------
  // Section: Level Flow
  // -----------------------------

  function startLevel(n){
    level = n;
    levelEl.textContent = level + "/5";
    eatenThisLevel = 0;
    bossAlive = false; boss = null; bossCell = null;
    const plan = LEVELS[level-1];
    if (plan && plan.boss) spawnBossIfNeeded();

    showCard("Level " + level, (plan && plan.intro) ? plan.intro : "", "");
    setTimeout(() => { if (!paused) clearCard(); }, 1200);
  }

  function advanceLevel() {
    if (level >= 5) {
      stopGameLoop();
      best = Math.max(best, score);
      localStorage.setItem("zmeyaHighScoreV1", String(best));
      updateHUD();
      showCard("You win! 🎉", 'Final Score: <span class="big">' + score + "</span>", "Start to play again");
      return;
    }
    startLevel(level + 1);
  }

  // -----------------------------
  // Section: Game Lifecycle
  // -----------------------------

  function resetGame() {
    score = 0;
    speedMs = START_SPEED_MS;
    bugs = [];
    growthOwed = 0;
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };

    const cx = Math.floor(grid.cols / 2);
    const cy = Math.floor(grid.rows / 2);
    snake = [{ x: cx, y: cy }, { x: cx - 1, y: cy }, { x: cx - 2, y: cy }];

    seedDecor();
    startLevel(1);
    updateHUD();
    paused = false;
  }

  function startGame() {
    if (running) stopGameLoop();
    running = true;
    paused = false;
    clearCard();
    lastTickAt = performance.now();
    scheduleLoop();
  }

  function stopGameLoop() {
    running = false;
    if (rafHandle) cancelAnimationFrame(rafHandle);
    rafHandle = null;
  }

  function togglePause() {
    if (!running) return;
    paused = !paused;
    if (paused) showCard("Paused", "⏯ to resume"); else clearCard();
  }

  // -----------------------------
  // Section: Main Loop
  // -----------------------------

  function scheduleLoop() {
    function step(t) {
      if (!running) return;
      if (!paused && t - lastTickAt >= speedMs) {
        tick();
        lastTickAt = t;
      }
      rafHandle = requestAnimationFrame(step);
    }
    rafHandle = requestAnimationFrame(step);
  }

  function setDirection(x, y) { nextDir = { x, y }; }

  function tick() {
    maybeSpawnBug();

    dir = nextDir;

    const head = snake[0];
    const nx = wrapX(head.x + dir.x);
    const ny = wrapY(head.y + dir.y);

    const tail = snake[snake.length - 1];
    if (nx === tail.x && ny === tail.y) return gameOver("Tail eaten!");

    if (bossAlive && bossCell && nx === bossCell.x && ny === bossCell.y) {
      return gameOver("Boss bite!");
    }

    snake.unshift({ x: nx, y: ny });

    const eatenIdx = bugs.findIndex((b) => b.x === nx && b.y === ny);
    if (eatenIdx >= 0) {
      const eaten = bugs.splice(eatenIdx, 1)[0];
      growthOwed += GROWTH_PER_BUG;
      score += 10;
      eatenThisLevel++;

      speedMs = Math.max(MIN_SPEED_MS, speedMs - SPEEDUP_PER_EAT);
      updateHUD(true);
      vibrate(20);
      flashToast(randomLangName(eaten.entry));

      const plan = LEVELS[level - 1];
      if (plan && plan.eatGoal && eatenThisLevel >= plan.eatGoal) advanceLevel();
    }

    if (growthOwed > 0) growthOwed--; else snake.pop();

    if (bossAlive && isBossEntangled()) defeatBoss();

    drawFrame();
  }

  function gameOver(reason) {
    stopGameLoop();
    best = Math.max(best, score);
    localStorage.setItem("zmeyaHighScoreV1", String(best));
    updateHUD();
    showCard("Game Over 💀", String(reason), "Tap Start / Restart");
    try { vibrate(80); } catch (_) {}
  }

  // -----------------------------
  // Section: Rendering
  // -----------------------------

  function clearCanvas() { ctx.clearRect(0, 0, canvas.width, canvas.height); }

  function drawFrame() {
    clearCanvas();

    const s = grid.size;
    const bugFontPx = Math.floor(s * 0.9);
    const decorFontPx = Math.floor(bugFontPx * 3);
    const bossFontPx = Math.floor(bugFontPx * 2);

    // decor
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = String(decorFontPx) + "px system-ui, Apple Color Emoji, Segoe UI Emoji";
    for (let i = 0; i < decor.length; i++) {
      const d = decor[i];
      const dcx = d.x * s + s / 2;
      const dcy = d.y * s + s / 2;
      ctx.globalAlpha = d.alpha;
      ctx.fillText(d.emoji, dcx, dcy);
    }
    ctx.restore();
    ctx.globalAlpha = 1;

    // bugs
    ctx.save();
    ctx.font = String(bugFontPx) + "px system-ui, Apple Color Emoji, Segoe UI Emoji";
    for (let j = 0; j < bugs.length; j++) {
      const b = bugs[j];
      const bx = b.x * s + s / 2;
      const by = b.y * s + s / 2;
      const lifeFrac = (b.expiresAt - nowSec()) / BUG_TTL_SEC + 0.2;
      ctx.globalAlpha = Math.min(1, Math.max(0.35, lifeFrac));
      ctx.fillText(b.entry.emoji, bx, by);
    }
    ctx.restore();
    ctx.globalAlpha = 1;

    // boss
    if (bossAlive && bossCell) {
      ctx.save();
      ctx.font = String(bossFontPx) + "px system-ui, Apple Color Emoji, Segoe UI Emoji";
      const cx = bossCell.x * s + s / 2;
      const cy = bossCell.y * s + s / 2;
      ctx.shadowColor = "#0aff73";
      ctx.shadowBlur = 16;
      ctx.fillText(boss.emoji, cx, cy);
      ctx.restore();
    }

    // snake
    for (let k = snake.length - 1; k >= 0; k--) {
      const seg = snake[k];
      const x = seg.x * s;
      const y = seg.y * s;
      const radius = Math.max(4, Math.floor(s * 0.28));

      if (k === 0) {
        // head
        const hx = x + s / 2;
        const hy = y + s / 2;
        ctx.fillStyle = "#73ffa1";
        ctx.beginPath();
        ctx.arc(hx, hy, s / 2 - 1, 0, Math.PI * 2);
        ctx.fill();
        if (s >= 18) {
          ctx.fillStyle = "#0b1a14";
          const eyeR = Math.max(1.5, s * 0.05);
          ctx.beginPath(); ctx.arc(hx - s * 0.2, hy - s * 0.15, eyeR, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(hx + s * 0.2, hy - s * 0.15, eyeR, 0, Math.PI * 2); ctx.fill();
        }
      } else if (k === snake.length - 1 && snake.length > 1) {
        // tail triangle pointing away from previous segment
        const prev = snake[k - 1];
        const dx = Math.sign(prev.x - seg.x);
        const dy = Math.sign(prev.y - seg.y);
        const cx = x + s / 2;
        const cy = y + s / 2;
        const tipLen = Math.max(6, Math.floor(s * 0.4));
        ctx.fillStyle = "rgba(115,255,161,0.9)";
        ctx.beginPath();
        if (Math.abs(dx) > Math.abs(dy)) {
          const dir = dx >= 0 ? 1 : -1;
          ctx.moveTo(cx - dir * tipLen / 2, cy - s / 2 + 2);
          ctx.lineTo(cx - dir * tipLen / 2, cy + s / 2 - 2);
          ctx.lineTo(cx + dir * tipLen / 2, cy);
        } else {
          const dir = dy >= 0 ? 1 : -1;
          ctx.moveTo(cx - s / 2 + 2, cy - dir * tipLen / 2);
          ctx.lineTo(cx + s / 2 - 2, cy - dir * tipLen / 2);
          ctx.lineTo(cx, cy + dir * tipLen / 2);
        }
        ctx.closePath();
        ctx.fill();
      } else {
        // body
        ctx.fillStyle = "rgba(115,255,161,0.9)";
        roundRect(ctx, x + 1, y + 1, s - 2, s - 2, radius);
        ctx.fill();
      }
    }
  }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y,     x + w, y + h, r);
    c.arcTo(x + w, y + h, x,     y + h, r);
    c.arcTo(x,     y + h, x,     y,     r);
    c.arcTo(x,     y,     x + w, y,     r);
    c.closePath();
  }

  // -----------------------------
  // Section: HUD + Input Binding
  // -----------------------------

  function updateHUD(speedChanged = false) {
    scoreEl.textContent = String(score);
    bestEl.textContent = String(best);
    speedEl.textContent = (START_SPEED_MS / speedMs).toFixed(1) + "x";
    if (speedChanged) speedEl.animate([{ opacity: 0.3 }, { opacity: 1 }], { duration: 150 });
    levelEl.textContent = level + "/5";
  }

function bindControls() {
  // Labels
  if (startBtn) startBtn.textContent = "▶️ Start";
  if (pauseTopBtn) pauseTopBtn.textContent = "⏹️ Pause";

  // --- Pad-only input (with knob) ---
  const padEl = document.querySelector('#pad');
  if (padEl) {
    // Ensure knob exists
    let knob = padEl.querySelector('.knob');
    if (!knob) {
      knob = document.createElement('div');
      knob.className = 'knob';
      padEl.appendChild(knob);
    }

    let active = false;

    // Max knob travel (px) from center
    const MAX_TRAVEL = 36;

    const setKnob = (dx, dy) => {
      // Clamp distance to MAX_TRAVEL
      const len = Math.hypot(dx, dy) || 1;
      const scale = Math.min(1, MAX_TRAVEL / len);
      const kx = dx * scale;
      const ky = dy * scale;
      knob.style.transform = `translate(calc(-50% + ${kx}px), calc(-50% + ${ky}px))`;
    };

    const chooseDirFromVector = (dx, dy) => {
      if (Math.abs(dx) > Math.abs(dy)) setDirection(Math.sign(dx), 0);
      else setDirection(0, Math.sign(dy));
    };

    const start = (clientX, clientY) => {
      active = true;
      padEl.classList.add('active');
      const r = padEl.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      setKnob(dx, dy);
      chooseDirFromVector(dx, dy);
    };

    const move = (clientX, clientY) => {
      if (!active) return;
      const r = padEl.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      setKnob(dx, dy);
      chooseDirFromVector(dx, dy);
    };

    const end = () => {
      if (!active) return;
      active = false;
      padEl.classList.remove('active');
      knob.style.transform = 'translate(-50%, -50%)'; // snap back to center
    };

    // Touch
    padEl.addEventListener('touchstart', (e) => {
      const t = e.changedTouches[0];
      start(t.clientX, t.clientY);
    }, { passive: true });

    padEl.addEventListener('touchmove', (e) => {
      const t = e.changedTouches[0];
      move(t.clientX, t.clientY);
    }, { passive: true });

    padEl.addEventListener('touchend', end, { passive: true });
    padEl.addEventListener('touchcancel', end, { passive: true });

    // Mouse / Pen
    padEl.addEventListener('pointerdown', (e) => start(e.clientX, e.clientY));
    padEl.addEventListener('pointermove', (e) => move(e.clientX, e.clientY));
    padEl.addEventListener('pointerup', end);
    padEl.addEventListener('pointerleave', end);
  } else {
    console.warn('#pad not found — add <div id="pad"><div class="knob"></div></div> inside .game-wrap');
  }

  // Start & Pause
  if (startBtn) startBtn.addEventListener("click", () => { resetGame(); startGame(); });
  if (pauseTopBtn) pauseTopBtn.addEventListener("click", () => { togglePause(); });

  // Keyboard + canvas swipe (keep)
  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (k === "arrowup" || k === "w") setDirection(0, -1);
    else if (k === "arrowdown" || k === "s") setDirection(0, 1);
    else if (k === "arrowleft" || k === "a") setDirection(-1, 0);
    else if (k === "arrowright" || k === "d") setDirection(1, 0);
    else if (k === " " || k === "enter") {
      if (!running) { resetGame(); startGame(); } else { togglePause(); }
    }
  });

  let touchStart = null, SWIPE_MIN = 18;
  function onTouchStart(e){ const t=e.changedTouches?e.changedTouches[0]:e; touchStart={x:t.clientX,y:t.clientY}; }
  function onTouchEnd(e){
    if(!touchStart) return;
    const t=e.changedTouches?e.changedTouches[0]:e;
    const dx=t.clientX-touchStart.x, dy=t.clientY-touchStart.y;
    if(Math.abs(dx)<SWIPE_MIN && Math.abs(dy)<SWIPE_MIN) return;
    if(Math.abs(dx)>Math.abs(dy)) setDirection(Math.sign(dx),0); else setDirection(0,Math.sign(dy));
    touchStart=null;
  }
  canvas.addEventListener("touchstart", onTouchStart, {passive:true});
  canvas.addEventListener("touchend", onTouchEnd, {passive:true});
}

  // -----------------------------
  // Section: Initialization & Resize
  // -----------------------------

  function init() {
    bestEl.textContent = String(best);
    fitCanvasToElement();
    resetGame();
    bindControls();
    drawFrame();
    startGame();
  }

  window.addEventListener("resize", () => {
    const prev = grid;
    fitCanvasToElement();
    snake = snake.map((seg) => ({
      x: Math.min(grid.cols - 1, Math.round((seg.x * grid.cols) / prev.cols)),
      y: Math.min(grid.rows - 1, Math.round((seg.y * grid.rows) / prev.rows)),
    }));
    seedDecor();
    drawFrame();
  });

  setInterval(() => { if (running && !paused) maybeSpawnBug(); }, 250);

  init();
})();
