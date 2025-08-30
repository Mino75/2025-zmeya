// Inject all styles via JS (per your microservice structure)
(() => {
  const css = `
  :root{
    --bg:#0c0f11;
    --panel:#12161a;
    --accent:#73ffa1;
    --accent-2:#59d0ff;
    --ink:#e9f0f4;
    --muted:#9fb0bc;
    --grid:#0f1317;
    --btn:#1a2026;
    --btn-ink:#e8f2f6;
    --shadow:0 10px 24px rgba(0,0,0,.35);
    --radius:16px;
  }
  *{box-sizing:border-box}
  html,body{height:100%}
  
  body{
    margin:0;
    overflow:hidden; /* keep the whole playfield in view */
    background: radial-gradient(1200px 800px at 10% -10%, #12202a 0%, transparent 35%),
                radial-gradient(800px 600px at 100% 10%, #1b242e 0%, transparent 30%), var(--bg);
    color:var(--ink);
    font:16px/1.4 system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, "Helvetica Neue", Arial, "Apple Color Emoji","Segoe UI Emoji";
  }

  .topbar{
    display:flex; align-items:center; justify-content:space-between;
    padding:10px clamp(12px, 4vw, 24px);
  }
  .title{margin:0; font-size:clamp(18px, 3.5vw, 28px); letter-spacing:.3px}
  .hud{display:flex; gap:12px; align-items:center; font-weight:600}
  .hud-group{display:flex; gap:6px; align-items:center; padding:.25rem .5rem; background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.06); border-radius:999px}
  .hide-sm{display:none}
  @media (min-width:720px){ .hide-sm{display:flex} }

  .main{
    height:calc(100vh - 56px);
    display:grid; grid-template-rows: 1fr auto; gap:8px;
    padding:0 clamp(12px, 4vw, 24px) 10px;
  }

  /* Desktop breathing room for header/HUD */
  @media (min-width:900px){
    .topbar{ padding-top:22px; }
    .main{ height:calc(100vh - 78px); padding-top:8px; }
    .hud-group{ font-size:1rem; }
  }

  .game-wrap{
    position:relative; margin:auto; width:100%; max-width:min(96vw, 640px);
    height: 74vh; max-height: 800px;
    background:linear-gradient(#0e1317, #0b0e10);
    border-radius:var(--radius); border:1px solid rgba(255,255,255,.06); box-shadow:var(--shadow); overflow:hidden;
  }
  canvas{width:100%; height:100%; display:block; background:
    linear-gradient(180deg, rgba(255,255,255,.015), rgba(0,0,0,.02)),
    repeating-linear-gradient(0deg, var(--grid) 0 2px, transparent 2px 48px),
    repeating-linear-gradient(90deg, var(--grid) 0 2px, transparent 2px 48px);
  }

  .overlay{
    position:absolute; inset:0; display:grid; place-items:center; text-align:center;
    padding:20px; pointer-events:none; color:#eaf7ff; text-shadow:0 2px 0 rgba(0,0,0,.4);
    font-weight:700; letter-spacing:.3px;
  }
  .overlay .card{
    pointer-events:auto; background:rgba(9,12,14,.7); backdrop-filter: blur(8px);
    border:1px solid rgba(255,255,255,.08); border-radius:14px; padding:16px 18px; box-shadow:var(--shadow);
  }
  .overlay h2{margin:.25rem 0; font-size:clamp(18px, 5vw, 26px)}
  .overlay p{margin:.25rem 0 .5rem; color:var(--muted); font-weight:500}
  .overlay .big{font-size:clamp(24px, 8vw, 42px)}

  .controls{
    position:absolute; inset:auto 10px 10px; display:grid; grid-template-rows:auto auto auto; gap:8px;
    justify-items:center; z-index:5; user-select:none;
  }
  .controls .mid-row{display:grid; grid-template-columns:auto auto auto; gap:8px; align-items:center}
  .btn{
    background:var(--btn); color:var(--btn-ink); border:1px solid rgba(255,255,255,.08);
    border-radius:12px; padding:10px 14px; font-size:20px; line-height:1; cursor:pointer;
    box-shadow: 0 6px 14px rgba(0,0,0,.28), inset 0 -2px 0 rgba(255,255,255,.06);
    touch-action: manipulation;
  }
  .btn:active{transform:translateY(1px)}
  .btn.primary{background:linear-gradient(180deg,#1f3231,#152524); border-color:#2b4f4a}
  .btn.ghost{background:transparent}
  .btn.action{font-size:18px}
  .panel{display:grid; gap:8px; margin:auto; max-width:min(96vw, 640px)}
  .row{display:flex; gap:10px}
  .tips{background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.06); border-radius:12px; padding:8px 10px}
  .tips summary{cursor:pointer}
  .tips ul{padding-left:18px; margin:.25rem 0}
  .footer{opacity:.6; text-align:center; padding:0 0 10px}

  .toasts{position:absolute; inset:0; pointer-events:none; overflow:hidden; z-index:6}
  .toast{
    position:absolute; transform:translate(-50%,-50%); padding:6px 10px; border-radius:10px;
    background:rgba(12,18,14,.75); border:1px solid rgba(255,255,255,.08); color:#d9ffe8;
    font-weight:700; filter:drop-shadow(0 6px 18px rgba(0,0,0,.35));
    animation: floatUp 1200ms ease-out forwards;
    white-space:nowrap;
  }
  @keyframes floatUp{
    0%{opacity:0; transform:translate(-50%,-10%) scale(.96)}
    12%{opacity:1}
    100%{opacity:0; transform:translate(-50%,-140%) scale(1.05)}
  }

/* Direction pad – crisp crosshair + knob */
#pad{
  position: fixed;
  left: 16px;
  bottom: max(16px, env(safe-area-inset-bottom));
  /* Use even dimensions to avoid half-pixel fuzz on DPR devices */
  width: 140px;
  height: 140px;
  border-radius: 16px;
  border: 2px solid var(--accent);
  /* Slightly more opaque so the canvas grid doesn’t show through too much */
  background: rgba(10,14,12,0.55);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  box-shadow: 0 8px 24px rgba(0,0,0,.35), inset 0 0 0 1px rgba(255,255,255,.06);
  touch-action: none; /* important for pointer/touch */
  z-index: 40;
  overflow: hidden; /* clip knob glow neatly */
}

/* Crisp crosshair using background gradients (no half-pixel transforms) */
#pad {
  background-image:
    linear-gradient(to right, rgba(255,255,255,.28), rgba(255,255,255,.28)),
    linear-gradient(to bottom, rgba(255,255,255,.28), rgba(255,255,255,.28)),
    radial-gradient(120px 120px at center, transparent 0, transparent 48%, rgba(255,255,255,.06) 48%, rgba(255,255,255,.06) 49%, transparent 49%);
  background-size: 2px 100%, 100% 2px, 100% 100%;
  background-position: 50% 0, 0 50%, 0 0;
  background-repeat: no-repeat;
}

/* The draggable “thumb/knob” */
#pad .knob{
  position: absolute;
  left: 50%;
  top: 50%;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle at 30% 30%, rgba(255,255,255,.18), rgba(255,255,255,.06));
  border: 2px solid var(--accent-2);
  box-shadow: 0 6px 18px rgba(0,0,0,.35), 0 0 10px rgba(89,208,255,.35);
  pointer-events: none; /* never intercept input */
  transition: transform 120ms ease; /* snap back to center on release */
}

#pad.active .knob{
  /* while dragging, movement is handled by JS (no transition) */
  transition: none;
}



  @media (min-width:900px){ .controls{display:none} }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
})();


