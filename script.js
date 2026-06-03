const C = document.getElementById("mainCanvas");
const ctx = C.getContext("2d");
ctx.imageSmoothingEnabled = false;

let hoverTile = null;
let mouseX = 0;
let mouseY = 0;
const BOARD_X = 16,
  BOARD_Y = 16,
  CELL = 58,
  COLS = 10,
  ROWS = 10;
const BOARD_W = CELL * COLS,
  BOARD_H = CELL * ROWS;
const OLD_GOLD = "#cfb53b",
  YOUNG_GOLD = "#f5d76e",
  PIXEL_SZ = 4;

const SFX = {
  click: new Audio("public/assets/audio/click.wav"),
  dice: new Audio("public/assets/audio/dice.wav"),
  step: new Audio("public/assets/audio/step.wav"),
  ladder: new Audio("public/assets/audio/upgrade.wav"),
  snake: new Audio("public/assets/audio/bug.wav"),
  win: new Audio("public/assets/audio/win.wav"),
};

SFX.click.volume = 0.3;
SFX.step.volume = 0.15;
SFX.dice.volume = 0.4;

function playSfx(sound) {
  if (!sound) return;
  sound.currentTime = 0;
  sound.play().catch(() => {});
}

let lastStepSound = 0;
function playStep() {
  const now = performance.now();
  
  if(now - lastStepSound < 80) return;

  lastStepSound = now;
  playSfx(SFX.step);
}

function makeCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function makeDiceSheet() {
  const sheet = makeCanvas(192, 32);
  const g = sheet.getContext("2d");
  g.imageSmoothingEnabled = false;
  const faces = [
    [[16, 16]],
    [
      [8, 8],
      [24, 24],
    ],
    [
      [8, 8],
      [16, 16],
      [24, 24],
    ],
    [
      [8, 8],
      [8, 24],
      [24, 8],
      [24, 24],
    ],
    [
      [8, 8],
      [8, 24],
      [16, 16],
      [24, 8],
      [24, 24],
    ],
    [
      [8, 8],
      [8, 16],
      [8, 24],
      [24, 8],
      [24, 16],
      [24, 24],
    ],
  ];
  for (let f = 0; f < 6; f++) {
    const ox = f * 32;
    g.fillStyle = "#f0e8c8";
    g.fillRect(ox, 0, 30, 30);
    g.strokeStyle = "#7a6520";
    g.lineWidth = 2;
    g.strokeRect(ox + 1, 1, 28, 28);
    g.fillStyle = "#c8b87a";
    [
      [ox, 0],
      [ox + 28, 0],
      [ox, 28],
      [ox + 28, 28],
    ].forEach(([x, y]) => {
      g.fillRect(x, y, 2, 2);
    });
    g.fillStyle = "#1a1a2e";
    faces[f].forEach(([dx, dy]) => {
      g.fillRect(ox + dx - 3, dy - 3, 6, 6);
      g.fillStyle = "#2a2a3e";
      g.fillRect(ox + dx - 2, dy - 2, 4, 4);
      g.fillStyle = "#1a1a2e";
    });
  }
  return sheet;
}

function makeCharSheet(palette) {
  const sheet = makeCanvas(192, 24);
  const g = sheet.getContext("2d");
  g.imageSmoothingEnabled = false;
  const [pc, sc, hc, sc2] = palette;
  function drawChar(ox, frame) {
    const bobs = frame === 1 ? 1 : 0;
    const armAngle = frame === 2;
    // rambut
    g.fillStyle = hc;
    g.fillRect(ox + 4, 1 + bobs, 16, 4);
    // muka
    g.fillStyle = sc;
    g.fillRect(ox + 5, 5 + bobs, 14, 10);
    // mata
    g.fillStyle = "#1a1a2e";
    g.fillRect(ox + 8, 7 + bobs, 3, 3);
    g.fillRect(ox + 13, 7 + bobs, 3, 3);
    // mulut
    g.fillStyle = "#8b4513";
    g.fillRect(ox + 9, 12 + bobs, 6, 2);
    // badan
    g.fillStyle = pc;
    g.fillRect(ox + 4, 15 + bobs, 16, 7);
    // laptop atau peralatan
    g.fillStyle = sc2;
    if (!armAngle) {
      g.fillRect(ox + 2, 17 + bobs, 8, 5);
    } else {
      g.fillRect(ox + 2, 13 + bobs, 8, 4);
    }
    // kaki
    g.fillStyle = "#2a2a4a";
    g.fillRect(ox + 5, 22, 5, 2);
    g.fillRect(ox + 12, 22, 5, 2);
    if (frame === 1) {
      g.fillRect(ox + 5, 21, 5, 3);
    }
  }
  for (let f = 0; f < 3; f++) drawChar(f * 64, f);
  return sheet;
}

const CHARS = [
  {
    name: "Rizky",
    role: "Back-end Dev",
    color: "#e74c3c",
    pal: ["#2c3e50", "#e74c3c", "#8B4513", "#fde3c0"],
    skill: "SERVER BOOST: Tangga +2 sq",
    skillFn: (p) => {
      p.ladderBonus = 2;
      showMsg("🔧 Rizky: Server Boost! Tangga naik +2!");
    },
  },
  {
    name: "Edward",
    role: "Competitive Prog",
    color: "#f39c12",
    pal: ["#1a1a2e", "#f39c12", "#222", "#fde3c0"],
    skill: "OPTIMIZE: Re-roll sekali",
    skillFn: (p) => {
      p.canReroll = true;
      showMsg("⚡ Edward: Optimize! Re-roll tersedia!");
    },
  },
  {
    name: "Natasya",
    role: "Front-end Dev",
    color: "#3498db",
    pal: ["#e74c3c", "#3498db", "#8B2252", "#fde3c0"],
    skill: "CSS SHIELD: Skip ular sekali",
    skillFn: (p) => {
      p.snakeShield = true;
      showMsg("🛡️ Natasya: CSS Shield! Ular berikutnya di-skip!");
    },
  },
  {
    name: "Amanda",
    role: "AI Engineer",
    color: "#9b59b6",
    pal: ["#9b59b6", "#4a0080", "#333", "#fde3c0"],
    skill: "ML PREDICT: Lihat dadu sebelum roll",
    skillFn: (p) => {
      p.canPredict = true;
      const n = Math.ceil(Math.random() * 6);
      showMsg("🤖 Amanda: ML Predict! Dadu berikutnya: " + n);
      p.predictedRoll = n;
    },
  },
];

const diceSheet = makeDiceSheet();
const charSheets = CHARS.map((ch) => makeCharSheet(ch.pal));
let finalChallengeActive = false;
const playerSprites = [];
const SPRITE_W = 16;
const SPRITE_H = 32;
const DIR = {
  LEFT: 0,
  DOWN: 1,
  UP: 2,
  RIGHT: 3,
};
const ICONS = {};
function loadSprite(path) {
  const img = new Image();
  img.src = path;
  return img;
}

playerSprites.push(loadSprite("public/assets/characters/rizky.png"));
playerSprites.push(loadSprite("public/assets/characters/edward.png"));
playerSprites.push(loadSprite("public/assets/characters/natasya.png"));
playerSprites.push(loadSprite("public/assets/characters/amanda.png"));

const SNAKES = {
  99: {
    to: 77,
    icon: "public/assets/board/system_crash.png",
    title: "System Crash",
  },
  94: {
    to: 75,
    icon: "public/assets/board/missing_semicolon.png",
    title: "Missing Semicolon",
  },
  92: {
    to: 72,
    icon: "public/assets/board/typo_error.png",
    title: "Typo Error",
  },
  88: {
    to: 68,
    icon: "public/assets/board/api_timeout.png",
    title: "API Timeout",
  },
  64: {
    to: 29,
    icon: "public/assets/board/production_bug.png",
    title: "Production Bug",
  },
  62: {
    to: 39,
    icon: "public/assets/board/merge_conflict.png",
    title: "Merge Conflict",
  },
  53: {
    to: 23,
    icon: "public/assets/board/fatal_exception.png",
    title: "Fatal Exception",
  },
  17: {
    to: 3,
    icon: "public/assets/board/null_pointer.png",
    title: "Null Pointer",
  },
};
Object.values(SNAKES).forEach(
  (item) => (ICONS[item.icon] = loadSprite(item.icon)),
);
const LADDERS = {
  4: {
    to: 14,
    icon: "public/assets/board/refactor_code.png",
    title: "Refactor Code",
  },
  9: { to: 30, icon: "public/assets/board/reuseble.png", title: "Reuseble" },
  20: {
    to: 38,
    icon: "public/assets/board/api_integration.png",
    title: "API Integration",
  },
  28: {
    to: 43,
    icon: "public/assets/board/hp_optimization.png",
    title: "HP Optimization",
  },
  40: {
    to: 59,
    icon: "public/assets/board/optimized_query.png",
    title: "Optimized Query",
  },
  51: {
    to: 67,
    icon: "public/assets/board/code_formatting.png",
    title: "Code Formatting",
  },
  63: { to: 81, icon: "public/assets/board/bug_fix.png", title: "Bug Fix" },
  71: {
    to: 91,
    icon: "public/assets/board/unit_testing.png",
    title: "Unit Testing",
  },
};
Object.values(LADDERS).forEach(
  (item) => (ICONS[item.icon] = loadSprite(item.icon)),
);
const CHALLENGE_TILES = new Set([
  5, 15, 20, 25, 30, 35, 40, 45, 50, 55, 65, 75, 85, 90, 95,
]);
const EVENT_TILES = new Set([11, 23, 35, 46, 58, 70, 73, 80, 82, 93, 97]);
const BOOST_TILES = new Set([13, 26, 42, 55, 66, 77]);
const FINAL_CHALLENGES = [
  {
    q: "Apa fungsi Git dalam pengembangan software?",
    opts: ["Version Control", "Database", "Compiler", "Framework"],
    ans: 0,
  },
  {
    q: "HTTP Status 404 berarti?",
    opts: ["Success", "Unauthorized", "Not Found", "Server Error"],
    ans: 2,
  },
  {
    q: "Framework JavaScript untuk SPA?",
    opts: ["React", "MySQL", "Linux", "Docker"],
    ans: 0,
  },
  {
    q: "Perintah Git untuk upload commit?",
    opts: ["git clone", "git push", "git init", "git fetch"],
    ans: 1,
  },
];

function tileToXY(tile) {
  // tile 1 = bottom-left, 100 = top-left zig-zag
  if (tile < 1 || tile > 100) return null;
  const idx = tile - 1;
  const row = Math.floor(idx / 10); // 0=bottom, 9=top
  const col = idx % 10;
  const screenRow = 9 - row;
  const screenCol = row % 2 === 0 ? col : 9 - col;
  return {
    x: BOARD_X + screenCol * CELL + CELL / 2,
    y: BOARD_Y + screenRow * CELL + CELL / 2,
  };
}

function tileRect(tile) {
  const idx = tile - 1;
  const row = Math.floor(idx / 10);
  const col = idx % 10;
  const screenRow = 9 - row;
  const screenCol = row % 2 === 0 ? col : 9 - col;
  return {
    x: BOARD_X + screenCol * CELL,
    y: BOARD_Y + screenRow * CELL,
    w: CELL,
    h: CELL,
  };
}

let gameState = "start";
let players = [];
let currentPlayer = 0;
let turnCount = 1;
let rolledDice = 0;
let animating = false;
let animPos = [];
let animTimer = 0;
let animTarget = 0;
let currentDiceFace = 0;
let selectedChar = -1;
let pendingSkillTile = null;

const QUIZ_POOL = [
  {
    q: "Apa kompleksitas waktu dari Binary Search?",
    opts: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
    ans: 1,
  },
  {
    q: "Bahasa apa yang digunakan di Node.js?",
    opts: ["Python", "Java", "JavaScript", "Ruby"],
    ans: 2,
  },
  {
    q: "HTTP method untuk membuat resource baru?",
    opts: ["GET", "DELETE", "PUT", "POST"],
    ans: 3,
  },
  {
    q: "Apa kepanjangan dari API?",
    opts: [
      "App Program Interface",
      "Application Programming Interface",
      "App Protocol Interface",
      "None",
    ],
    ans: 1,
  },
  {
    q: "CSS: flex-direction untuk kolom?",
    opts: ["row", "column", "wrap", "block"],
    ans: 1,
  },
  {
    q: "Git command untuk simpan perubahan?",
    opts: ["git push", "git pull", "git commit", "git merge"],
    ans: 2,
  },
  { q: "Array index dimulai dari?", opts: ["1", "0", "-1", "2"], ans: 1 },
  {
    q: "SQL perintah untuk mengambil data?",
    opts: ["INSERT", "UPDATE", "DELETE", "SELECT"],
    ans: 3,
  },
  {
    q: "Apa itu README.md?",
    opts: ["Database", "Dokumentasi Project", "Config file", "Log file"],
    ans: 1,
  },
  {
    q: "Apa itu Bug dalam pemrograman?",
    opts: ["Fitur baru", "Error/Kesalahan kode", "Library", "Framework"],
    ans: 1,
  },
  {
    q: "Frontend framework buatan Google?",
    opts: ["React", "Vue", "Angular", "Svelte"],
    ans: 2,
  },
  {
    q: "Apa singkatan dari URL?",
    opts: [
      "Universal Resource Locator",
      "Uniform Resource Locator",
      "Unique Resource Link",
      "None",
    ],
    ans: 1,
  },
];

const EVENT_POOL = [
  {
    t: "Kopi habis! Konsentrasimu menurun.",
    effect: (p, done) => {
      moveBack(p, 3, done);
      showMsg("Event: Kopi habis! Mundur 3 kotak.");
    },
  },
  {
    t: "Ide brilian datang! Sprint coding!",
    effect: (p, done) => {
      moveForward(p, 3, done);
      showMsg("Event: Ide brilian! Maju 3 kotak!");
    },
  },
  {
    t: "Bug ditemukan oleh reviewer!",
    effect: (p, done) => {
      moveBack(p, 2, done);
      showMsg("Event: Bug ketemu! Mundur 2 kotak.");
    },
  },
  {
    t: "Mentoring dari senior dev!",
    effect: (p, done) => {
      moveForward(p, 2, done);
      showMsg("Event: Mentoring! Maju 2 kotak!");
    },
  },
  {
    t: "Laptop freeze! Skip satu giliran.",
    effect: (p, done) => {
      p.skipTurn = true;
      playSfx(SFX.snake);
      showMsg("Event: Laptop freeze! Skip 1 giliran.");
      setTimeout(() => done(), 1000);
    },
  },
  {
    t: "Deploy berhasil! Bonus giliran!",
    effect: (p, done) => {
      p.bonusTurn = true;
      playSfx(SFX.win);
      showMsg("Event: Deploy sukses! Bonus giliran!");
      setTimeout(done, 1000);
    },
  },
  {
    t: "WiFi putus! Kehilangan progress.",
    effect: (p, done) => {
      moveBack(p, 4, done);
      showMsg("Event: WiFi putus! Mundur 4 kotak.");
    },
  },
  {
    t: "Memenangkan mini challenge!",
    effect: (p, done) => {
      p.skillCharge = (p.skillCharge || 0) + 1;
      playSfx(SFX.win);
      showMsg("Event: Menang challenge! Skill charge +1!");
      setTimeout(() => done(), 1000);
    },
  },
];

function moveBack(p, n, callback) {
  const targetTile = Math.max(1, p.pos - n);
  p.direction = DIR.DOWN;
  animateMoveToTile(p, targetTile, 700, () => {
    p.pos = targetTile;
    playSfx(SFX.snake);
    callback?.();
  });
}

function moveForward(p, n, callback) {
  const targetTile = Math.min(100, p.pos + n);
  p.direction = DIR.UP;
  animateMoveToTile(p, targetTile, 700, () => {
    p.pos = targetTile;
    playSfx(SFX.ladder);
    callback?.();
  });
}

function drawBoard() {
  ctx.fillStyle = "#0a0a1a";
  ctx.fillRect(0, 0, 960, 640);

  ctx.shadowColor = "#cfb53b";
  ctx.shadowBlur = 20;
  ctx.fillStyle = "#0d1428";
  ctx.fillRect(BOARD_X - 2, BOARD_Y - 2, BOARD_W + 4, BOARD_H + 4);
  ctx.shadowBlur = 0;

  for (let tile = 1; tile <= 100; tile++) {
    const r = tileRect(tile);
    let bg =
      (Math.floor((tile - 1) / 10) + ((tile - 1) % 10)) % 2 === 0
        ? OLD_GOLD
        : YOUNG_GOLD;

    if (SNAKES[tile]) bg = "#ff6b6b";
    else if (LADDERS[tile]) bg = "#6bffb8";
    else if (CHALLENGE_TILES.has(tile)) bg = "#6bb5ff";
    else if (EVENT_TILES.has(tile)) bg = "#d4a0ff";
    else if (BOOST_TILES.has(tile)) bg = "#ffe06b";

    ctx.fillStyle = bg;
    ctx.fillRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);

    ctx.fillStyle = "rgba(0,0,0,0.06)";
    for (let py = 0; py < r.h - 2; py += PIXEL_SZ * 2) {
      for (
        let px = (py / PIXEL_SZ) % 2 === 0 ? 0 : PIXEL_SZ;
        px < r.w - 2;
        px += PIXEL_SZ * 2
      ) {
        ctx.fillRect(r.x + 1 + px, r.y + 1 + py, PIXEL_SZ, PIXEL_SZ);
      }
    }

    ctx.strokeStyle = "#7a6520";
    ctx.lineWidth = 1;
    ctx.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);

    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.font = 'bold 7px "Press Start 2P"';
    ctx.textAlign = "center";
    ctx.fillText(tile, r.x + r.w / 2, r.y + 10);

    if (SNAKES[tile]) {
      const bug = SNAKES[tile];
      const img = ICONS[bug.icon];

      if (img && img.complete && img.naturalWidth) {
        ctx.drawImage(img, r.x + 16, r.y + 14, 28, 28);
      }
    } else if (LADDERS[tile]) {
      const up = LADDERS[tile];
      const img = ICONS[up.icon];
      if (img && img.complete && img.naturalWidth) {
        ctx.drawImage(img, r.x + 16, r.y + 14, 28, 28);
      }
    } else if (CHALLENGE_TILES.has(tile)) {
      ctx.font = "10px serif";
      ctx.fillText("❓", r.x + r.w / 2, r.y + r.h / 2 + 4);
    } else if (EVENT_TILES.has(tile)) {
      ctx.font = "10px serif";
      ctx.fillText("🎲", r.x + r.w / 2, r.y + r.h / 2 + 4);
    } else if (BOOST_TILES.has(tile)) {
      ctx.font = "10px serif";
      ctx.fillText("⚡", r.x + r.w / 2, r.y + r.h / 2 + 4);
    }
  }
}

function drawDice(face) {
  if (face < 1 || face > 6) return;
  const sx = (face - 1) * 32;
  const dx = 870,
    dy = 160;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(diceSheet, sx, 0, 32, 32, dx, dy, 64, 64);
}

function drawPlayers() {
  players.forEach((p, i) => {
    const pos = tileToXY(p.pos);
    if (!pos) return;
    const offset = [
      [-10, -10],
      [10, -10],
      [-10, 10],
      [10, 10],
    ][i] || [0, 0];
    const frame =
      animating && currentPlayer === i ? Math.floor(Date.now() / 150) % 2 : 0;
    const sheet = charSheets[p.charIdx];

    ctx.beginPath();
    ctx.ellipse(
      pos.x + offset[0],
      pos.y + offset[1] + 10,
      10,
      4,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fill();

    ctx.imageSmoothingEnabled = false;
    const sprite = playerSprites[p.charIdx];
    const sx = p.direction * SPRITE_W;
    const sy = p.animFrame * SPRITE_H;

    ctx.drawImage(
      sprite,
      sx,
      sy,
      SPRITE_W,
      SPRITE_H,
      p.drawX + offset[0] - 16,
      p.drawY + offset[1] - 32,
      32,
      64,
    );

    ctx.fillStyle = CHARS[p.charIdx].color;
    ctx.fillRect(pos.x + offset[0] - 6, pos.y + offset[1] + 12, 12, 4);

    ctx.font = '5px "Press Start 2P"';
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText("P" + (i + 1), pos.x + offset[0], pos.y + offset[1] + 22);
  });
}

function drawSidebar() {
  const sx = BOARD_X + BOARD_W + 16;
  const sw = 960 - sx - 10;

  ctx.fillStyle = "#0d1428";
  ctx.strokeStyle = "#cfb53b";
  ctx.lineWidth = 1;
  ctx.strokeRect(sx, BOARD_Y, sw, BOARD_H);

  ctx.font = '7px "Press Start 2P"';
  ctx.fillStyle = OLD_GOLD;
  ctx.textAlign = "left";
  ctx.fillText("PLAYERS", sx + 8, BOARD_Y + 18);

  players.forEach((p, i) => {
    const oy = BOARD_Y + 30 + i * 110;
    const isActive = currentPlayer === i;
    ctx.fillStyle = isActive ? "#1a2a1a" : "#0d1428";
    ctx.fillRect(sx + 4, oy, sw - 8, 100);
    ctx.strokeStyle = isActive ? CHARS[p.charIdx].color : "#333";
    ctx.lineWidth = isActive ? 2 : 1;
    ctx.strokeRect(sx + 4, oy, sw - 8, 100);

    ctx.imageSmoothingEnabled = false;
    const frame = isActive ? Math.floor(Date.now() / 300) % 2 : 0;
    ctx.drawImage(
      charSheets[p.charIdx],
      frame * 64,
      0,
      24,
      24,
      sx + 8,
      oy + 8,
      32,
      32,
    );

    ctx.font = '6px "Press Start 2P"';
    ctx.fillStyle = CHARS[p.charIdx].color;
    ctx.fillText(CHARS[p.charIdx].name, sx + 46, oy + 18);
    ctx.fillStyle = "#aaa";
    ctx.font = '5px "Press Start 2P"';
    ctx.fillText(CHARS[p.charIdx].role, sx + 46, oy + 30);
    ctx.fillStyle = "#ffd700";
    ctx.fillText("POS: " + p.pos, sx + 46, oy + 44);

    let si = 0;
    if (p.snakeShield) {
      ctx.fillStyle = "#3498db";
      ctx.fillText("🛡SHIELD", sx + 8, oy + 60 + si * 14);
      si++;
    }
    if (p.canReroll) {
      ctx.fillStyle = "#f39c12";
      ctx.fillText("↺REROLL", sx + 8, oy + 60 + si * 14);
      si++;
    }
    if (p.skipTurn) {
      ctx.fillStyle = "#e74c3c";
      ctx.fillText("SKIP", sx + 8, oy + 60 + si * 14);
      si++;
    }
    if (p.bonusTurn) {
      ctx.fillStyle = "#2ecc71";
      ctx.fillText("★BONUS", sx + 8, oy + 60 + si * 14);
      si++;
    }

    ctx.fillStyle = "#1a1a3a";
    ctx.fillRect(sx + 8, oy + 74, sw - 20, 20);
    ctx.strokeStyle = CHARS[p.charIdx].color + "88";
    ctx.lineWidth = 1;
    ctx.strokeRect(sx + 8, oy + 74, sw - 20, 20);
    ctx.font = '5px "Press Start 2P"';
    ctx.fillStyle = CHARS[p.charIdx].color;
    ctx.fillText(
      "SKILL: " + CHARS[p.charIdx].skill.substring(0, 18),
      sx + 10,
      oy + 87,
    );
  });

  // Legend
  const ly = BOARD_Y + BOARD_H - 140;
  ctx.font = '6px "Press Start 2P"';
  ctx.fillStyle = OLD_GOLD;
  ctx.fillText("LEGEND", sx + 8, ly);
  const legend = [
    ["#ff6b6b", "BUG TILE (Ular)"],
    ["#6bffb8", "UPGRADE (Tangga)"],
    ["#6bb5ff", "CHALLENGE (Quiz)"],
    ["#d4a0ff", "RANDOM EVENT"],
    ["#ffe06b", "BOOST TILE"],
  ];
  legend.forEach(([c, l], i) => {
    ctx.fillStyle = c;
    ctx.fillRect(sx + 8, ly + 10 + i * 18, 12, 12);
    ctx.fillStyle = "#ccc";
    ctx.font = '5px "Press Start 2P"';
    ctx.fillText(l, sx + 24, ly + 20 + i * 18);
  });
}

function drawDiceArea() {
  const dx = 868,
    dy = 155;
  ctx.fillStyle = "#0d1428";
  ctx.strokeStyle = "#cfb53b";
  ctx.lineWidth = 1;
  ctx.strokeRect(dx - 6, dy - 4, 78, 78);
  ctx.font = '6px "Press Start 2P"';
  ctx.fillStyle = "#aaa";
  ctx.textAlign = "center";
  ctx.fillText("DADU", dx + 31, dy - 8);
  if (rolledDice > 0) {
    drawDice(rolledDice);
    ctx.fillStyle = "#ffd700";
    ctx.font = '9px "Press Start 2P"';
    ctx.fillText(rolledDice, dx + 31, dy + 84);
  }
}

function render() {
  if (gameState === "start") return;
  drawBoard();
  drawPlayers();
  drawTooltip();
  drawSidebar();
  drawDiceArea();
  requestAnimationFrame(render);
}

function showMsg(text, dur = 3000) {
  const el = document.getElementById("msgBox");
  el.textContent = text;
  el.style.display = "block";
  clearTimeout(el._t);
  el._t = setTimeout(() => (el.style.display = "none"), dur);
}

function updateTurnLabel() {
  document.getElementById("turnLabel").textContent = "TURN " + turnCount;
  const p = players[currentPlayer];
  document.getElementById("playerInfo").innerHTML =
    `P${currentPlayer + 1}: ${CHARS[p.charIdx].name}<br>POS: ${p.pos}`;
}

function rollDice() {
  if (animating || gameState !== "playing") return;

  const btn = document.getElementById("diceBtn");
  btn.disabled = true;
  playSfx(SFX.dice);

  const p = players[currentPlayer];

  let roll = p.predictedRoll || Math.ceil(Math.random() * 6);
  p.predictedRoll = null;
  rolledDice = 0;
  let frames = 0;
  const shake = setInterval(() => {
    rolledDice = Math.ceil(Math.random() * 6);
    frames++;
    if (frames > 8) {
      clearInterval(shake);
      rolledDice = roll;
      showMsg(`${CHARS[p.charIdx].name} melempar ${roll}!`);
      setTimeout(() => movePlayer(currentPlayer, roll), 400);
    }
  }, 80);
}

function updateDirection(player, targetTile) {
  const oldPos = tileToXY(player.pos);
  const newPos = tileToXY(targetTile);

  const dx = newPos.x - oldPos.x;
  const dy = newPos.y - oldPos.y;

  if (Math.abs(dx) > Math.abs(dy)) {
    player.direction = dx > 0 ? DIR.RIGHT : DIR.LEFT;
  } else {
    player.direction = dy > 0 ? DIR.DOWN : DIR.UP;
  }
}

function movePlayer(pidx, steps) {
  const p = players[pidx];
  animating = true;
  let moved = 0;

  function moveOneTile() {
    if (moved >= steps) {
      animating = false;
      p.animFrame = 0;
      landOnTile(pidx);
      return;
    }

    const nextTile = Math.min(100, p.pos + 1);
    updateDirection(p, nextTile);

    animateMoveToTile(p, nextTile, 180, () => {
      p.pos = nextTile;
      playStep();
      moved++;
      updateTurnLabel();

      if (p.pos >= 100) {
        winGame(pidx);
        return;
      }

      moveOneTile();
    });
  }

  moveOneTile();
}

function animateMoveToTile(player, targetTile, duration, callback) {
  const target = tileToXY(targetTile);

  const startX = player.drawX;
  const startY = player.drawY;

  const endX = target.x;
  const endY = target.y;

  const startTime = performance.now();

  function step(now) {
    let t = (now - startTime) / duration;

    if (t > 1) {
      t = 1;
    }

    player.drawX = startX + (endX - startX) * t;
    player.drawY = startY + (endY - startY) * t;
    player.animFrame = Math.floor((now / 120) % 3);

    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      player.drawX = endX;
      player.drawY = endY;
      player.animFrame = 0;

      callback?.();
    }
  }

  requestAnimationFrame(step);
}

function landOnTile(pidx) {
  const p = players[pidx];
  const tile = p.pos;

  if (SNAKES[tile] !== undefined) {
    playSfx(SFX.snake);
    if (p.snakeShield) {
      p.snakeShield = false;
      showMsg("🛡️ CSS Shield melindungi dari Bug! Tile " + tile);
      setTimeout(() => endTurn(pidx), 1000);
    } else {
      const snake = SNAKES[tile];
      const to = snake.to;
      showMsg(`${snake.title}! ` + tile + " → " + to, 2500);
      p.direction = DIR.DOWN;
      animateMoveToTile(p, to, 900, () => {
        p.pos = to;
        updateTurnLabel();
        endTurn(pidx);
      });
    }
  } else if (LADDERS[tile] !== undefined) {
    playSfx(SFX.ladder);
    const ladder = LADDERS[tile];
    const lb = p.ladderBonus || 0;
    const to = Math.min(100, ladder.to + lb);
    p.ladderBonus = 0;
    showMsg(`${ladder.title}! ` + tile + " → " + to + "!", 2500);
    p.direction = DIR.UP;
    animateMoveToTile(p, to, 400, () => {
      p.pos = to;
      updateTurnLabel();
      if (p.pos >= 100) {
        winGame(pidx);
        return;
      }
      endTurn(pidx);
    });
  } else if (CHALLENGE_TILES.has(tile)) {
    showChallenge(pidx);
  } else if (EVENT_TILES.has(tile)) {
    showEvent(pidx);
  } else if (BOOST_TILES.has(tile)) {
    showMsg("⚡ BOOST! Skill karakter aktif!");
    CHARS[p.charIdx].skillFn(p);
    setTimeout(() => endTurn(pidx), 1500);
  } else {
    endTurn(pidx);
  }
}

function showChallenge(pidx) {
  if (pidx !== 0) {
    cpuChallenge(pidx);
    return;
  }
  gameState = "quiz";
  const p = players[pidx];
  const q = QUIZ_POOL[Math.floor(Math.random() * QUIZ_POOL.length)];
  const modal = document.getElementById("quizModal");
  document.getElementById("quizQ").textContent = q.q;
  const optsEl = document.getElementById("quizOpts");
  optsEl.innerHTML = "";
  q.opts.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.className = "qBtn";
    btn.textContent = String.fromCharCode(65 + i) + ". " + opt;
    btn.onclick = () => {
      modal.style.display = "none";
      gameState = "playing";
      playSfx(SFX.click);
      if (i === q.ans) {
        showMsg("Betol! Maju 3 kotak!");
        const targetTile = Math.min(100, p.pos + 3);
        p.direction = DIR.UP;
        animateMoveToTile(p, targetTile, 400, () => {
          p.pos = targetTile;
          playSfx(SFX.win);
          updateTurnLabel();
          endTurn(pidx);
        });
      } else {
        showMsg("HAHAHA Salah! Mundur 2 kotak.");
        setTimeout(() => {
          const targetTile = Math.min(100, p.pos - 2);
          p.direction = DIR.DOWN;
          animateMoveToTile(p, targetTile, 900, () => {
            p.pos = targetTile;
            playSfx(SFX.snake);
            updateTurnLabel();
            endTurn(pidx);
          });
        }, 800);
      }
    };
    optsEl.appendChild(btn);
  });
  modal.style.display = "block";
}

function cpuChallenge(pidx) {
  const p = players[pidx];
  const q = QUIZ_POOL[Math.floor(Math.random() * QUIZ_POOL.length)];

  showMsg(CHARS[p.charIdx].name + " sedang menjawab challenge...");

  setTimeout(() => {
    const successRate = 0.65;
    const correct = Math.random() < successRate;

    if (correct) {
      showMsg(CHARS[p.charIdx].name + " menjawab BENAR!");
      const target = Math.min(100, p.pos + 3);
      p.direction = DIR.UP;
      animateMoveToTile(p, target, 400, () => {
        p.pos = target;
        playSfx(SFX.win);
        updateTurnLabel();
        endTurn(pidx);
      });
    } else {
      showMsg(CHARS[p.charIdx].name + " menjawab SALAH!");
      const target = Math.max(1, p.pos - 2);
      p.direction = DIR.DOWN;
      animateMoveToTile(p, target, 600, () => {
        p.pos = target;
        playSfx(SFX.snake);
        updateTurnLabel();
        endTurn(pidx);
      });
    }
  }, 1500);
}

function showEvent(pidx) {
  gameState = "event";
  const ev = EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)];
  document.getElementById("evtText").textContent = ev.t;
  const modal = document.getElementById("eventModal");
  modal.style.display = "block";
  document.getElementById("evtOkBtn").onclick = () => {
    modal.style.display = "none";
    gameState = "playing";

    const finish = () => {
      updateTurnLabel();
      endTurn(pidx);
    };

    ev.effect(players[pidx], finish);
  };
}

function showFinalChallenge(pidx) {
  if (finalChallengeActive) return;
  finalChallengeActive = true;
  const p = players[pidx];

  if (pidx !== 0) {
    showMsg(CHARS[p.charIdx].name + " menghadapi Final Interview...");
    setTimeout(() => {
      const success = Math.random() < 0.6;

      if (success) {
        showMsg("Interview Lulus!");
        finalChallengeActive = false;
        setTimeout(() => winGame(pidx), 1000);
      } else {
        showMsg("Interview Gagal. Mundur 5 kotak.");
        p.pos = Math.max(1, p.pos - 5);
        updateTurnLabel();
        finalChallengeActive = false;
        setTimeout(() => endTurn(pidx), 1200);
      }
    }, 1500);

    return;
  }

  const q = FINAL_CHALLENGES[Math.floor(Math.random() * FINAL_CHALLENGES.length)];
  const modal = document.getElementById("quizModal");

  document.getElementById("quizQ").textContent = "FINAL INTERVIEW\n\n" + q.q;
  const optsEl = document.getElementById("quizOpts");
  optsEl.innerHTML = "";
  q.opts.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.className = "qBtn";
    btn.textContent = String.fromCharCode(65 + i) + ". " + opt;
    btn.onclick = () => {
      playSfx(SFX.click);
      modal.style.display = "none";

      if (i === q.ans) {
        showMsg("Interview Lulus!");
        finalChallengeActive = false;
        setTimeout(() => winGame(pidx), 1000);
      } else {
        showMsg("Interview Gagal. Mundur 5 kotak.");
        p.pos = Math.max(1, p.pos - 5);
        updateTurnLabel();
        finalChallengeActive = false;
        setTimeout(() => endTurn(pidx), 1200);
      }
    };

    optsEl.appendChild(btn);
  });

  modal.style.display = "block";
}

function endTurn(pidx) {
  const p = players[pidx];
  if (p.pos >= 90 && p.pos < 100) {
    if (Math.random() < 0.25) {
      showMsg("🔥 Production Issue! Mundur 2 kotak.");
      p.pos = Math.max(1, p.pos - 2);
      updateTurnLabel();
    }
  }
  if (p.pos >= 100) {
    winGame(pidx);
    showFinalChallenge(pidx);
    return;
  }
  if (p.bonusTurn) {
    p.bonusTurn = false;
    showMsg("★ BONUS GILIRAN untuk " + CHARS[p.charIdx].name + "!");
    setTimeout(() => {
      document.getElementById("diceBtn").disabled = false;
    }, 1000);
    return;
  }
  nextTurn();
}

function nextTurn() {
  animating = false;
  currentPlayer = (currentPlayer + 1) % players.length;
  turnCount++;

  updateTurnLabel();
  document.getElementById("diceBtn").disabled = true;

  const p = players[currentPlayer];
  if (p.skipTurn) {
    p.skipTurn = false;
    showMsg(CHARS[p.charIdx].name + " melewati giliran!");
    setTimeout(nextTurn, 1000);
    return;
  }
  document.getElementById("diceBtn").disabled = false;
}

function winGame(pidx) {
  playSfx(SFX.win);
  gameState = "win";
  const p = players[pidx];
  document.getElementById("winScreen").style.display = "flex";
  document.getElementById("winMsg").textContent =
    CHARS[p.charIdx].name +
    " (" +
    CHARS[p.charIdx].role +
    ") menang dalam " +
    turnCount +
    " giliran!";
}

function buildStartScreen() {
  const grid = document.getElementById("charGrid");
  grid.innerHTML = "";
  CHARS.forEach((ch, i) => {
    const card = document.createElement("div");
    card.className = "charCard";
    const cv = document.createElement("canvas");
    cv.width = 72;
    cv.height = 24;
    cv.style.imageRendering = "pixelated";
    const cg = cv.getContext("2d");
    cg.imageSmoothingEnabled = false;
    cg.drawImage(charSheets[i], 0, 0, 24, 24, 0, 0, 24, 24);
    cg.drawImage(charSheets[i], 64, 0, 24, 24, 24, 0, 24, 24);
    cg.drawImage(charSheets[i], 128, 0, 24, 24, 48, 0, 24, 24);
    card.appendChild(cv);
    card.innerHTML += `<b style="color:${ch.color}">${ch.name}</b><br>${ch.role}<br><span style="color:#6bb5ff;font-size:5px">${ch.skill}</span>`;
    card.onclick = () => {
      document
        .querySelectorAll(".charCard")
        .forEach((c) => c.classList.remove("selected"));
      card.classList.add("selected");
      selectedChar = i;
      document.getElementById("startBtn").style.display = "block";
    };
    grid.appendChild(card);
  });
}

function startGame() {
  playSfx(SFX.click);
  if (selectedChar < 0) return;
  document.getElementById("startScreen").style.display = "none";
  gameState = "playing";

  const cpuChar = (selectedChar + 1 + Math.floor(Math.random() * 3)) % 4;
  players = [
    {
      pos: 1,
      charIdx: selectedChar,
      direction: DIR.DOWN,
      animationFrame: 0,
      snakeShield: false,
      canReroll: false,
      skipTurn: false,
      bonusTurn: false,
      ladderBonus: 0,
      predictedRoll: null,
    },
    {
      pos: 1,
      charIdx: cpuChar,
      direction: 1,
      animationFrame: 0,
      snakeShield: false,
      canReroll: false,
      skipTurn: false,
      bonusTurn: false,
      ladderBonus: 0,
      predictedRoll: null,
    },
  ];
  players.forEach((p) => {
    const startPos = tileToXY(1);

    p.drawX = startPos.x;
    p.drawY = startPos.y;
  });
  currentPlayer = 0;
  turnCount = 1;
  updateTurnLabel();
  document.getElementById("diceBtn").disabled = false;
  document.getElementById("diceBtn").style.display = "block";
  requestAnimationFrame(render);
  showMsg(
    "Game dimulai! P1: " +
      CHARS[selectedChar].name +
      " vs CPU: " +
      CHARS[cpuChar].name,
    3000,
  );

  // KHUSUS CPU MAIN SENDIRI
  setInterval(() => {
    if (
      gameState === "playing" &&
      currentPlayer === 1 &&
      !animating &&
      !document.getElementById("diceBtn").disabled
    ) {
      document.getElementById("diceBtn").disabled = true;
      setTimeout(() => {
        if (currentPlayer === 1 && gameState === "playing") {
          const roll = Math.ceil(Math.random() * 6);
          rolledDice = roll;
          showMsg(`CPU ${CHARS[players[1].charIdx].name} melempar ${roll}!`);
          setTimeout(() => movePlayer(1, roll), 600);
        }
      }, 1000);
    }
  }, 500);
}

C.addEventListener("mousemove", (e) => {
  const rect = C.getBoundingClientRect();

  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;

  hoverTile = null;

  for (let tile = 1; tile <= 100; tile++) {
    const r = tileRect(tile);
    if (
      mouseX >= r.x &&
      mouseX <= r.x + r.w &&
      mouseY >= r.y &&
      mouseY <= r.y + r.h
    ) {
      hoverTile = tile;
      break;
    }
  }
});

function drawTooltip() {
  if (!hoverTile) return;
  let text = null;
  if (SNAKES[hoverTile]) {
    const s = SNAKES[hoverTile];
    text = s.title;
  } else if (LADDERS[hoverTile]) {
    const l = LADDERS[hoverTile];
    text = l.title;
  } else if (CHALLENGE_TILES.has(hoverTile)) {
    text = "❓ Challenge Tile";
  } else if (EVENT_TILES.has(hoverTile)) {
    text = "🎲 Random Event";
  } else if (BOOST_TILES.has(hoverTile)) {
    text = "⚡ Skill Boost";
  }

  if (!text) return;

  const lines = text.split("\n");
  const w = 220;
  const h = 18 + lines.length * 16;
  let x = mouseX + 15;
  let y = mouseY - 10;

  if (x + w > C.width) x = C.width - w - 5;

  if (y + h > C.height) y = C.height - h - 5;

  ctx.fillStyle = "rgba(0,0,0,0.85)";
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = "#FFD700";
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "8px 'Press Start 2P'";
  ctx.textAlign = "left";

  lines.forEach((line, i) => ctx.fillText(line, x + 10, y + 18 + i * 16));
}

document.getElementById("startBtn").addEventListener("click", startGame);
document.getElementById("diceBtn").addEventListener("click", rollDice);

const isInputField = (el) => ["INPUT", "TEXTAREA"].includes(el.tagName);
const canRollDice = () => {
  const diceBtn = document.getElementById("diceBtn");
  return gameState === "playing" && !animating && !diceBtn?.disabled;
};

document.addEventListener("keydown", (e) => {
  if (e.code !== "Space" || isInputField(document.activeElement)) return;
  e.preventDefault();
  if (canRollDice()) {
    playSfx(SFX.click);
    rollDice();
  }
});
document.getElementById("diceBtn").style.display = "none";
buildStartScreen();

ctx.fillStyle = "#0a0a1a";
ctx.fillRect(0, 0, 960, 640);
ctx.fillStyle = OLD_GOLD;
ctx.font = '14px "Press Start 2P"';
ctx.textAlign = "center";
ctx.fillText("HACKATHON: CLIMB TO MASTERY", 480, 320);
