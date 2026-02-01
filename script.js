// ---------- helpers ----------
function $(id){ return document.getElementById(id); }

function show(screenId){
  const screens = document.querySelectorAll(".screen");
  screens.forEach(s => s.classList.remove("active"));
  $(screenId).classList.add("active");
}

function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

// ---------- screens ----------
const startBtn = $("startBtn");
const skipHeartsBtn = $("skipHeartsBtn");
const yesBtn = $("yesBtn");
const noBtn = $("noBtn");
const replayBtn = $("replayBtn");

const heartZone = $("heartZone");
const progressFill = $("progressFill");
const countText = $("countText");

let heartsCollected = 0;
const HEART_GOAL = 7;

// ---------- intro ----------
startBtn.addEventListener("click", () => {
  setupHearts();
  show("screen-hearts");
});

// ---------- hearts mini-game ----------
function randomHeartPosition(){
  const pad = 14;
  const rect = heartZone.getBoundingClientRect();
  const x = Math.random() * (rect.width - pad*2 - 44) + pad;
  const y = Math.random() * (rect.height - pad*2 - 44) + pad;
  return { x, y };
}

function addHeart(){
  const el = document.createElement("div");
  el.className = "floating-heart";
  el.textContent = "💗";

  const {x, y} = randomHeartPosition();
  el.style.left = `${x}px`;
  el.style.top  = `${y}px`;
  el.style.animationDelay = `${Math.random() * 1.2}s`;

  el.addEventListener("click", () => {
    el.style.transform = "scale(0.92)";
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 120);

    heartsCollected++;
    countText.textContent = String(heartsCollected);
    progressFill.style.width = `${(heartsCollected / HEART_GOAL) * 100}%`;

    if (heartsCollected >= HEART_GOAL){
      setTimeout(() => show("screen-ask"), 250);
    } else {
      // spawn another heart so there are always some to tap
      addHeart();
      if (Math.random() > 0.55) addHeart();
    }
  });

  heartZone.appendChild(el);
}

function setupHearts(){
  heartsCollected = 0;
  countText.textContent = "0";
  progressFill.style.width = "0%";
  heartZone.innerHTML = "";

  // start with a few hearts
  for (let i=0; i<4; i++) addHeart();
}

skipHeartsBtn.addEventListener("click", () => show("screen-ask"));

// ---------- ask screen ----------
function moveNoButton(){
  // keep it within the card area; move relative to button row
  const row = $("buttonRow");
  const rect = row.getBoundingClientRect();

  const maxX = rect.width - noBtn.offsetWidth;
  const maxY = rect.height - noBtn.offsetHeight;

  // place absolute so it can dodge around
  noBtn.style.position = "absolute";
  noBtn.style.left = `${clamp(Math.random() * maxX, 0, maxX)}px`;
  noBtn.style.top  = `${clamp(Math.random() * maxY, 0, maxY)}px`;
}

noBtn.addEventListener("mouseenter", moveNoButton);
noBtn.addEventListener("touchstart", (e) => { e.preventDefault(); moveNoButton(); }, {passive:false});

yesBtn.addEventListener("click", () => {
  show("screen-yay");
  startConfetti();
});

// ---------- yay screen confetti ----------
const canvas = $("confetti");
const ctx = canvas.getContext("2d");
let confettiPieces = [];
let confettiTimer = null;

function resizeCanvas(){
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(canvas.clientWidth * dpr);
  canvas.height = Math.floor(canvas.clientHeight * dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
}

window.addEventListener("resize", () => {
  if ($("screen-yay").classList.contains("active")) resizeCanvas();
});

function makeConfettiPiece(){
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  return {
    x: Math.random()*w,
    y: -10,
    r: 4 + Math.random()*4,
    vx: -1.5 + Math.random()*3,
    vy: 2.5 + Math.random()*4,
    rot: Math.random()*Math.PI,
    vrot: -0.1 + Math.random()*0.2,
    // simple palette from theme (no hard-coded named colors needed, but we use a few nice hexes)
    c: ["#ff4d8d", "#a78bfa", "#ffd1e6", "#111827", "#ffffff"][Math.floor(Math.random()*5)]
  };
}

function startConfetti(){
  resizeCanvas();
  confettiPieces = Array.from({length: 120}, makeConfettiPiece);

  const start = performance.now();
  const durationMs = 2600;

  function tick(now){
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    ctx.clearRect(0,0,w,h);

    confettiPieces.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vrot;
      p.vy *= 0.995;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.r, -p.r, p.r*2.2, p.r*2.2);
      ctx.restore();
    });

    confettiPieces = confettiPieces.filter(p => p.y < h + 20);

    // keep generating a bit while running
    if (now - start < durationMs){
      if (Math.random() > 0.6) confettiPieces.push(makeConfettiPiece());
      requestAnimationFrame(tick);
    }
  }

  requestAnimationFrame(tick);
}

replayBtn.addEventListener("click", () => {
  // reset no button position behavior
  noBtn.style.position = "";
  noBtn.style.left = "";
  noBtn.style.top = "";
  show("screen-intro");
});
