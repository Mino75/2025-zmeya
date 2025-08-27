/* zmeya fixes:
   - Removed template literals to avoid invisible-char issues
   - Decor >= 7–10 items
   - Round snake head
   - Boss 2×, decor 3×, viewport-fit canvas
*/
(function () {
  // Data
  var LANGS = ["mg","fr","cn","jp","ru"];
  var INSECTS = [
    {emoji:"🐌", names:{en:"snail",fr:"escargot",cn:"蜗牛",jp:"カタツムリ",ru:"улитка",mg:"sokina"}},
    {emoji:"🦋", names:{en:"butterfly",fr:"papillon",cn:"蝴蝶",jp:"チョウ",ru:"бабочка",mg:"lolo"}},
    {emoji:"🐛", names:{en:"caterpillar",fr:"chenille",cn:"毛毛虫",jp:"いもむし",ru:"гусеница",mg:"kankana"}},
    {emoji:"🐜", names:{en:"ant",fr:"fourmi",cn:"蚂蚁",jp:"アリ",ru:"муравей",mg:"vitsika"}},
    {emoji:"🐝", names:{en:"bee",fr:"abeille",cn:"蜜蜂",jp:"ハチ",ru:"пчела",mg:"tantely"}},
    {emoji:"🪲", names:{en:"beetle",fr:"scarabée",cn:"甲虫",jp:"甲虫",ru:"жук",mg:"voangory"}},
    {emoji:"🐞", names:{en:"ladybug",fr:"coccinelle",cn:"瓢虫",jp:"テントウムシ",ru:"божья коровка",mg:"voangory mena"}},
    {emoji:"🦗", names:{en:"cricket",fr:"grillon",cn:"蟋蟀",jp:"コオロギ",ru:"сверчок",mg:"valala"}},
    {emoji:"🪳", names:{en:"cockroach",fr:"cafard",cn:"蟑螂",jp:"ゴキブリ",ru:"тараканы",mg:"kadradraka"}},
    {emoji:"🕷️", names:{en:"spider",fr:"araignée",cn:"蜘蛛",jp:"クモ",ru:"паук",mg:"hala"}},
    {emoji:"🦂", names:{en:"scorpion",fr:"scorpion",cn:"蝎子",jp:"サソリ",ru:"скорпион",mg:"sokorpiona"}},
    {emoji:"🦟", names:{en:"mosquito",fr:"moustique",cn:"蚊子",jp:"カ",ru:"комар",mg:"moka"}},
    {emoji:"🪰", names:{en:"housefly",fr:"mouche",cn:"苍蝇",jp:"ハエ",ru:"муха",mg:"lolo vola"}},
    {emoji:"🪱", names:{en:"earthworm",fr:"ver de terre",cn:"蚯蚓",jp:"ミミズ",ru:"дождевой червь",mg:"olitra"}}
  ];
  var BOSSES = [
    {emoji:"🐊", names:{en:"crocodile",fr:"crocodile",cn:"鳄鱼",jp:"ワニ",ru:"крокодил",mg:"voay"}},
    {emoji:"🐅", names:{en:"tiger",fr:"tigre",cn:"老虎",jp:"トラ",ru:"тигр",mg:"tigra"}},
    {emoji:"🐘", names:{en:"elephant",fr:"éléphant",cn:"大象",jp:"ゾウ",ru:"слон",mg:"elefanta"}},
    {emoji:"🦖", names:{en:"T-Rex",fr:"tyrannosaure",cn:"霸王龙",jp:"ティラノサウルス",ru:"тираннозавр",mg:"tiranosoro"}}
  ];
  var DECOR = ["🌸","💮","🪷","🏵️"];

  // Config
  var GROWTH_PER_BUG = 2, START_SPEED_MS = 180, MIN_SPEED_MS = 70, SPEEDUP_PER_EAT = 6;
  var MAX_BUGS = 4, BUG_TTL_SEC = 10, GRID_MIN = 12;
  var LEVELS = [
    {n:1,boss:null,intro:"Warm-up. Eat 10 bugs to advance.",eatGoal:10},
    {n:2,boss:BOSSES[0],intro:"Boss appears! Entangle it by blocking its four sides.",eatGoal:0},
    {n:3,boss:BOSSES[1],intro:"Watch the stripes… entangle again!",eatGoal:0},
    {n:4,boss:BOSSES[2],intro:"Big feet, bigger circle.",eatGoal:0},
    {n:5,boss:BOSSES[3],intro:"Final boss. Lasso the dino!",eatGoal:0}
  ];

  // DOM
  var $ = function (s) { return document.querySelector(s); };
  var canvas = $("#game"), ctx = canvas.getContext("2d");
  var overlay = $("#overlay"), toasts = $("#toasts");
  var scoreEl = $("#score"), bestEl = $("#best"), speedEl = $("#speed"), levelEl = $("#level");
  var startBtn = $("#startBtn"), pauseTopBtn = $("#pauseTop"), pauseBtn = $("#pauseBtn");
  var dirBtns = document.querySelectorAll(".btn.dir");

  // State
  var grid = { cols: 24, rows: 36, size: 16 };
  var snake = [], dir = {x:1,y:0}, nextDir = {x:1,y:0}, growth = 0;
  var bugs = [], decor = [];
  var score = 0, best = Number(localStorage.getItem("zmeyaHighScoreV1") || 0);
  var speedMs = START_SPEED_MS, loop = null, running = false, paused = false, lastTickAt = 0, eatenCount = 0;
  var level = 1, boss = null, bossPos = null, bossAlive = false;

  // Fit canvas to element (avoid page scroll; CSS sets height)
  function fitCanvas() {
    var rect = canvas.getBoundingClientRect();
    var dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var target = 26;
    var cols = Math.max(GRID_MIN, Math.floor(rect.width / target));
    var rows = Math.max(GRID_MIN, Math.floor(rect.height / target));
    var size = Math.floor(Math.min(rect.width / cols, rect.height / rows));
    grid = { cols: cols, rows: rows, size: size };
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
  }

  // Utils
  function randInt(n){ return Math.floor(Math.random()*n); }
  function pick(a){ return a[randInt(a.length)]; }
  function clamp(n,a,b){ return Math.max(a, Math.min(b, n)); }
  function nowSec(){ return Date.now()/1000; }
  function wrapX(x){ return (x + grid.cols) % grid.cols; }
  function wrapY(y){ return (y + grid.rows) % grid.rows; }
  function vibrate(ms){ if (navigator.vibrate) navigator.vibrate(ms); }

  function emptyCell(avoidBoss){
    if (avoidBoss === void 0) avoidBoss = true;
    var t=0;
    while(t++<1000){
      var x = randInt(grid.cols), y = randInt(grid.rows);
      var onSnake = snake.some(function(s){ return s.x===x && s.y===y; });
      var onBug = bugs.some(function(b){ return b.x===x && b.y===y; });
      var onBoss = avoidBoss && bossAlive && bossPos && bossPos.x===x && bossPos.y===y;
      if(!onSnake && !onBug && !onBoss) return {x:x,y:y};
    }
    return {x:Math.floor(grid.cols/2), y:Math.floor(grid.rows/2)};
  }

  function showCard(title, desc, cta){
    overlay.innerHTML =
      '<div class="card"><h2>' + title + '</h2><p>' + desc + '</p><p><em>' + (cta||'') + '</em></p></div>';
  }
  function clearCard(){ overlay.innerHTML = ""; }

  function flashToast(text, xPct, yPct){
    var el = document.createElement("div");
    el.className = "toast";
    el.textContent = text;
    var left = (xPct != null ? xPct : clamp(Math.random()*100, 8, 92));
    var top = (yPct != null ? yPct : clamp(Math.random()*100, 12, 88));
    el.style.left = left + "%";
    el.style.top = top + "%";
    toasts.appendChild(el);
    setTimeout(function(){ el.remove(); }, 1300);
  }
  function randomLangName(entry){
    var lang = pick(LANGS);
    return entry.names[lang] || entry.names.en;
  }

  // Decor (ensure >= 7..10 items)
  function seedDecor(){
    decor = [];
    var base = Math.floor((grid.cols * grid.rows) / 120);
    var minWanted = 7 + randInt(4); // 7..10
    var count = Math.max(minWanted, base);
    for (var i=0;i<count;i++){
      var pos = emptyCell(false);
      decor.push({x:pos.x, y:pos.y, emoji: pick(DECOR), alpha: 0.2 + Math.random()*0.35});
    }
  }

  // Bugs
  var nextSpawnAt = 0;
  function maybeSpawnBug(){
    var t = nowSec();
    if (t >= nextSpawnAt && bugs.length < MAX_BUGS){
      var pos = emptyCell();
      var entry = pick(INSECTS);
      bugs.push({x:pos.x, y:pos.y, entry:entry, expiresAt: t + BUG_TTL_SEC});
      nextSpawnAt = t + (0.8 + Math.random()*1.4);
    }
    bugs = bugs.filter(function(b){ return b.expiresAt > t; });
  }

  // Boss
  function spawnBossIfNeeded(){
    var plan = LEVELS[level-1];
    if (!plan || !plan.boss) return;
    boss = plan.boss;
    bossPos = emptyCell(false);
    bossAlive = true;
  }
  function bossEntangled(){
    if (!bossAlive) return false;
    var x=bossPos.x, y=bossPos.y;
    function has(cx,cy){ return snake.some(function(s){ return s.x===wrapX(cx) && s.y===wrapY(cy); }); }
    return has(x-1,y) && has(x+1,y) && has(x,y-1) && has(x,y+1);
  }
  function defeatBoss(){
    bossAlive = false;
    score += 150;
    flashToast(randomLangName(boss));
    advanceLevel();
  }

  // Levels
  function startLevel(n){
    level = n;
    levelEl.textContent = level + "/5";
    eatenCount = 0;
    bossAlive = false; boss = null; bossPos = null;
    var plan = LEVELS[level-1];
    if (plan && plan.boss) spawnBossIfNeeded();
    showCard("Level " + level, (plan && plan.intro) ? plan.intro : "", "Tap Start to play");
  }
  function advanceLevel(){
    if (level >= 5){
      stop();
      best = Math.max(best, score);
      localStorage.setItem("zmeyaHighScoreV1", String(best));
      updateHUD();
      showCard("You win! 🎉", "Final Score: <span class=\"big\">" + score + "</span>", "Start to play again");
      return;
    }
    startLevel(level+1);
  }

  // Lifecycle
  function reset(){
    score = 0; speedMs = START_SPEED_MS; bugs = []; growth = 0;
    dir = {x:1,y:0}; nextDir = {x:1,y:0};
    var cx = Math.floor(grid.cols/2), cy = Math.floor(grid.rows/2);
    snake = [{x:cx,y:cy},{x:cx-1,y:cy},{x:cx-2,y:cy}];
    seedDecor(); startLevel(1); updateHUD(); paused = false;
  }
  function start(){ if (running) stop(); running=true; paused=false; clearCard(); lastTickAt=performance.now(); scheduleLoop(); }
  function stop(){ running=false; if(loop) cancelAnimationFrame(loop); loop=null; }
  function pauseToggle(){ if(!running) return; paused=!paused; if(paused) showCard("Paused","⏯ to resume"); else clearCard(); }

  // Loop
  function scheduleLoop(){
    function step(t){
      if (!running) return;
      if (!paused && t - lastTickAt >= speedMs){ tick(); lastTickAt = t; }
      loop = requestAnimationFrame(step);
    }
    loop = requestAnimationFrame(step);
  }

  function setDir(x,y){ nextDir = {x:x, y:y}; }

  function tick(){
    maybeSpawnBug();
    dir = nextDir;
    var head = snake[0];
    var nx = wrapX(head.x + dir.x), ny = wrapY(head.y + dir.y);

    // Tail-eating death only
    var tail = snake[snake.length-1];
    if (nx === tail.x && ny === tail.y){ return gameOver("Tail eaten!"); }

    // Boss cannot be eaten
    if (bossAlive && bossPos && nx===bossPos.x && ny===bossPos.y){ return gameOver("Boss bite!"); }

    snake.unshift({x:nx, y:ny});

    // Eat bug?
    var eatenIdx = bugs.findIndex(function(b){ return b.x===nx && b.y===ny; });
    if (eatenIdx >= 0){
      var eaten = bugs.splice(eatenIdx, 1)[0];
      growth += GROWTH_PER_BUG; score += 10; eatenCount++;
      speedMs = Math.max(MIN_SPEED_MS, speedMs - SPEEDUP_PER_EAT); updateHUD(true); vibrate(20);
      flashToast(randomLangName(eaten.entry));
      var plan = LEVELS[level-1];
      if (plan && plan.eatGoal && eatenCount >= plan.eatGoal) advanceLevel();
    }

    if (growth > 0) growth--; else snake.pop();

    if (bossAlive && bossEntangled()) defeatBoss();

    draw();
  }

  function gameOver(reason){
    stop();
    best = Math.max(best, score);
    localStorage.setItem("zmeyaHighScoreV1", String(best));
    updateHUD();
    showCard("Game Over 💀", String(reason), "Tap Start / Restart");
    try { vibrate(80); } catch(e) {}
  }

  // Drawing
  function clear(){ ctx.clearRect(0,0,canvas.width,canvas.height); }
  function draw(){
    clear();
    var s = grid.size;
    var foodFont = Math.floor(s * 0.9);
    var decorFont = Math.floor(foodFont * 3);
    var bossFont = Math.floor(foodFont * 2);

    // decor
    ctx.save();
    ctx.globalAlpha = 1; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = String(decorFont) + "px system-ui, Apple Color Emoji, Segoe UI Emoji";
    for (var i=0;i<decor.length;i++){
      var d = decor[i];
      var dcx = d.x * s + s/2, dcy = d.y * s + s/2;
      ctx.globalAlpha = d.alpha;
      ctx.fillText(d.emoji, dcx, dcy);
    }
    ctx.restore();
    ctx.globalAlpha = 1;

    // bugs
    ctx.save();
    ctx.font = String(foodFont) + "px system-ui, Apple Color Emoji, Segoe UI Emoji";
    for (var j=0;j<bugs.length;j++){
      var b = bugs[j];
      var bx = b.x * s + s/2, by = b.y * s + s/2;
      ctx.globalAlpha = Math.min(1, Math.max(0.35, (b.expiresAt - nowSec())/BUG_TTL_SEC + 0.2));
      ctx.fillText(b.entry.emoji, bx, by);
    }
    ctx.restore();
    ctx.globalAlpha = 1;

    // boss
    if (bossAlive && bossPos){
      ctx.save();
      ctx.font = String(bossFont) + "px system-ui, Apple Color Emoji, Segoe UI Emoji";
      var cx = bossPos.x * s + s/2, cy = bossPos.y * s + s/2;
      ctx.shadowColor = "#0aff73"; ctx.shadowBlur = 16;
      ctx.fillText(boss.emoji, cx, cy);
      ctx.restore();
    }

    // snake: head circle, body rounded
    for (var k=snake.length-1;k>=0;k--){
      var seg = snake[k], x = seg.x*s, y = seg.y*s, r = Math.max(4, Math.floor(s*0.28));
      if (k === 0){
        // head circle
        var hcX = x + s/2, hcY = y + s/2;
        ctx.fillStyle = "#73ffa1";
        ctx.beginPath(); ctx.arc(hcX, hcY, (s/2)-1, 0, Math.PI*2); ctx.fill();
        if (s >= 18){
          ctx.fillStyle = "#0b1a14";
          var rr = Math.max(1.5, s*0.05);
          ctx.beginPath(); ctx.arc(hcX - s*0.2, hcY - s*0.15, rr, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(hcX + s*0.2, hcY - s*0.15, rr, 0, Math.PI*2); ctx.fill();
        }
      } else {
        ctx.fillStyle = "rgba(115,255,161,0.9)";
        roundRect(ctx, x+1, y+1, s-2, s-2, r); ctx.fill();
      }
    }
  }
  function roundRect(c,x,y,w,h,r){
    c.beginPath();
    c.moveTo(x+r,y);
    c.arcTo(x+w,y,x+w,y+h,r);
    c.arcTo(x+w,y+h,x,y+h,r);
    c.arcTo(x,y+h,x,y,r);
    c.arcTo(x,y,x+w,y,r);
    c.closePath();
  }

  // HUD / input
  function updateHUD(speedChanged){
    if (speedChanged === void 0) speedChanged = false;
    scoreEl.textContent = String(score);
    bestEl.textContent = String(best);
    speedEl.textContent = (START_SPEED_MS / speedMs).toFixed(1) + "x";
    if (speedChanged) speedEl.animate([{opacity:.3},{opacity:1}],{duration:150});
    levelEl.textContent = level + "/5";
  }
  function bindControls(){
    dirBtns.forEach(function(btn){
      var d = btn.dataset.dir;
      function h(e){
        e.preventDefault();
        if (d==="up") setDir(0,-1);
        if (d==="down") setDir(0,1);
        if (d==="left") setDir(-1,0);
        if (d==="right") setDir(1,0);
      }
      btn.addEventListener("touchstart",h,{passive:false});
      btn.addEventListener("pointerdown",h);
    });
    startBtn.addEventListener("click", function(){ reset(); start(); });
    pauseTopBtn.addEventListener("click", function(){ pauseToggle(); });
    pauseBtn.addEventListener("click", function(){ pauseToggle(); });

    window.addEventListener("keydown", function(e){
      var k = e.key.toLowerCase();
      if (k==="arrowup"||k==="w") setDir(0,-1);
      else if (k==="arrowdown"||k==="s") setDir(0,1);
      else if (k==="arrowleft"||k==="a") setDir(-1,0);
      else if (k==="arrowright"||k==="d") setDir(1,0);
      else if (k===" "||k==="enter"){ if(!running){ reset(); start(); } else pauseToggle(); }
    });

    // Swipe
    var touchStart = null, SWIPE_MIN = 18;
    function onTouchStart(e){ var t=e.changedTouches?e.changedTouches[0]:e; touchStart={x:t.clientX,y:t.clientY}; }
    function onTouchEnd(e){
      if(!touchStart) return;
      var t=e.changedTouches?e.changedTouches[0]:e;
      var dx=t.clientX-touchStart.x, dy=t.clientY-touchStart.y;
      if(Math.abs(dx)<SWIPE_MIN && Math.abs(dy)<SWIPE_MIN) return;
      if(Math.abs(dx)>Math.abs(dy)) setDir(Math.sign(dx),0); else setDir(0,Math.sign(dy));
      touchStart=null;
    }
    canvas.addEventListener("touchstart", onTouchStart, {passive:true});
    canvas.addEventListener("touchend", onTouchEnd, {passive:true});
  }

  // Init
  function init(){ bestEl.textContent = String(best); fitCanvas(); reset(); bindControls(); draw(); }
  window.addEventListener("resize", function(){
    var prev = grid;
    fitCanvas();
    snake = snake.map(function(seg){
      return {
        x: Math.min(grid.cols-1, Math.round(seg.x*grid.cols/prev.cols)),
        y: Math.min(grid.rows-1, Math.round(seg.y*grid.rows/prev.rows))
      };
    });
    seedDecor();
    draw();
  });
  setInterval(function(){ if (running && !paused) maybeSpawnBug(); }, 250);
  init();
})();
