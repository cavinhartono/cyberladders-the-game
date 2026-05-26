const C = document.getElementById("mainCanvas");
const ctx = C.getContext("2d");
ctx.imageSmoothingEnabled = false;

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

const playerSprites = [];
const SPRITE_W = 16;
const SPRITE_H = 32;
const DIR = {
  LEFT: 0,
  DOWN: 1,
  UP: 2,
  RIGHT: 3,
};

function loadSprite(path) {
  const img = new Image();
  img.src = path;
  return img;
}

playerSprites.push(loadSprite("public/assets/rizky.png"));
playerSprites.push(loadSprite("public/assets/edward.png"));
playerSprites.push(loadSprite("public/assets/natasya.png"));
playerSprites.push(loadSprite("public/assets/amanda.png"));

const SNAKES = {
  98: 78,
  95: 75,
  87: 24,
  64: 60,
  54: 19,
  36: 6,
  32: 10,
};
const LADDERS = {
  4: 14,
  9: 31,
  20: 38,
  28: 84,
  40: 59,
  51: 67,
  63: 81,
  71: 91,
};
const BUG_TILES = new Set(Object.keys(SNAKES).map(Number));
const UPGRADE_TILES = new Set(Object.keys(LADDERS).map(Number));
const CHALLENGE_TILES = new Set([7, 15, 22, 33, 45, 57, 68, 79, 88]);
const EVENT_TILES = new Set([11, 23, 35, 46, 58, 70, 82, 93]);
const BOOST_TILES = new Set([13, 26, 42, 55, 66, 77, 89]);

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
    t: "☕ Kopi habis! Konsentrasimu menurun.",
    effect: (p) => {
      moveBack(p, 3);
      showMsg("Event: Kopi habis! Mundur 3 kotak.");
    },
  },
  {
    t: "💡 Ide brilian datang! Sprint coding!",
    effect: (p) => {
      moveForward(p, 3);
      showMsg("Event: Ide brilian! Maju 3 kotak!");
    },
  },
  {
    t: "🐛 Bug ditemukan oleh reviewer!",
    effect: (p) => {
      moveBack(p, 2);
      showMsg("Event: Bug ketemu! Mundur 2 kotak.");
    },
  },
  {
    t: "🤝 Mentoring dari senior dev!",
    effect: (p) => {
      moveForward(p, 2);
      showMsg("Event: Mentoring! Maju 2 kotak!");
    },
  },
  {
    t: "💻 Laptop freeze! Skip satu giliran.",
    effect: (p) => {
      p.skipTurn = true;
      showMsg("Event: Laptop freeze! Skip 1 giliran.");
    },
  },
  {
    t: "🚀 Deploy berhasil! Bonus giliran!",
    effect: (p) => {
      p.bonusTurn = true;
      showMsg("Event: Deploy sukses! Bonus giliran!");
    },
  },
  {
    t: "📶 WiFi putus! Kehilangan progress.",
    effect: (p) => {
      moveBack(p, 4);
      showMsg("Event: WiFi putus! Mundur 4 kotak.");
    },
  },
  {
    t: "🏆 Memenangkan mini challenge!",
    effect: (p) => {
      p.skillCharge = (p.skillCharge || 0) + 1;
      showMsg("Event: Menang challenge! Skill charge +1!");
    },
  },
];

function moveBack(p, n) {
  p.pos = Math.max(1, p.pos - n);
  checkLandEffects(p, false);
}

function moveForward(p, n) {
  p.pos = Math.min(100, p.pos + n);
  checkLandEffects(p, false);
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

    if (BUG_TILES.has(tile)) bg = "#ff6b6b";
    else if (UPGRADE_TILES.has(tile)) bg = "#6bffb8";
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

    if (BUG_TILES.has(tile)) {
      ctx.font = "10px serif";
      ctx.fillText("🐛", r.x + r.w / 2, r.y + r.h / 2 + 4);
    } else if (UPGRADE_TILES.has(tile)) {
      ctx.font = "10px serif";
      ctx.fillText("🪜", r.x + r.w / 2, r.y + r.h / 2 + 4);
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

  ctx.lineCap = "round";
  Object.entries(SNAKES).forEach(([head, tail]) => {
    const h = tileToXY(+head),
      t = tileToXY(+tail);
    if (!h || !t) return;
    ctx.beginPath();
    const mx = (h.x + t.x) / 2 + 20,
      my = (h.y + t.y) / 2;
    ctx.moveTo(h.x, h.y);
    ctx.quadraticCurveTo(mx, my, t.x, t.y);
    ctx.strokeStyle = "#ff3333";
    ctx.lineWidth = 4;
    ctx.setLineDash([]);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(h.x, h.y, 7, 0, Math.PI * 2);
    ctx.fillStyle = "#cc0000";
    ctx.fill();
    ctx.fillStyle = "#ff6666";
    ctx.fillRect(h.x - 2, h.y - 2, 4, 4);
    ctx.beginPath();
    ctx.arc(t.x, t.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#ff3333";
    ctx.fill();
  });

  Object.entries(LADDERS).forEach(([bottom, top]) => {
    const b = tileToXY(+bottom),
      tp = tileToXY(+top);
    if (!b || !tp) return;
    ctx.beginPath();
    ctx.moveTo(b.x - 6, b.y);
    ctx.lineTo(tp.x - 6, tp.y);
    ctx.strokeStyle = "#00cc66";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(b.x + 6, b.y);
    ctx.lineTo(tp.x + 6, tp.y);
    ctx.stroke();
    const steps = 6;
    for (let i = 0; i <= steps; i++) {
      const t2 = i / steps;
      const rx = b.x + (tp.x - b.x) * t2;
      const ry = b.y + (tp.y - b.y) * t2;
      ctx.beginPath();
      ctx.moveTo(rx - 8, ry);
      ctx.lineTo(rx + 8, ry);
      ctx.strokeStyle = "#33ff99";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(tp.x, tp.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#00cc66";
    ctx.fill();
  });
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
      ctx.fillText("💤SKIP", sx + 8, oy + 60 + si * 14);
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
  const p = players[currentPlayer];

  if (p.skipTurn) {
    p.skipTurn = false;
    showMsg("💤 " + CHARS[p.charIdx].name + " skip giliran!");
    nextTurn();
    return;
  }

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
      showMsg(`🎲 ${CHARS[p.charIdx].name} melempar ${roll}!`);
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

    const target = tileToXY(nextTile);

    animateWalk(p, target.x, target.y, () => {
      p.pos = nextTile;

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

function animateWalk(player, targetX, targetY, onFinish) {
  const duration = 250;

  const startX = player.drawX;
  const startY = player.drawY;

  const startTime = performance.now();

  function step(now) {
    let t = (now - startTime) / duration;

    if (t > 1) {
      t = 1;
    }

    player.drawX = startX + (targetX - startX) * t;

    player.drawY = startY + (targetY - startY) * t;

    player.animFrame = Math.floor((now / 120) % 3);

    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      player.drawX = targetX;
      player.drawY = targetY;

      onFinish();
    }
  }

  requestAnimationFrame(step);
}

function landOnTile(pidx) {
  const p = players[pidx];
  const tile = p.pos;

  if (SNAKES[tile] !== undefined) {
    if (p.snakeShield) {
      p.snakeShield = false;
      showMsg("🛡️ CSS Shield melindungi dari Bug! Tile " + tile);
      setTimeout(() => endTurn(pidx), 1000);
    } else {
      const to = SNAKES[tile];
      showMsg("🐛 BUG! Ular dari " + tile + " → " + to, 2500);
      setTimeout(() => {
        p.pos = to;
        updateTurnLabel();
        setTimeout(() => endTurn(pidx), 800);
      }, 1200);
    }
  } else if (LADDERS[tile] !== undefined) {
    const lb = p.ladderBonus || 0;
    const to = Math.min(100, LADDERS[tile] + lb);
    p.ladderBonus = 0;
    showMsg("🪜 UPGRADE! Tangga dari " + tile + " → " + to + "!", 2500);
    setTimeout(() => {
      p.pos = to;
      updateTurnLabel();
      if (p.pos >= 100) {
        winGame(pidx);
        return;
      }
      setTimeout(() => endTurn(pidx), 800);
    }, 1200);
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
      if (i === q.ans) {
        showMsg("✅ Benar! Maju 3 kotak!");
        setTimeout(() => {
          p.pos = Math.min(100, p.pos + 3);
          updateTurnLabel();
          endTurn(pidx);
        }, 800);
      } else {
        showMsg("❌ Salah! Mundur 2 kotak.");
        setTimeout(() => {
          p.pos = Math.max(1, p.pos - 2);
          updateTurnLabel();
          endTurn(pidx);
        }, 800);
      }
    };
    optsEl.appendChild(btn);
  });
  modal.style.display = "block";
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
    ev.effect(players[pidx]);
    updateTurnLabel();
    setTimeout(() => endTurn(pidx), 600);
  };
}

function endTurn(pidx) {
  const p = players[pidx];
  if (p.pos >= 100) {
    winGame(pidx);
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
  currentPlayer = (currentPlayer + 1) % players.length;
  turnCount++;
  updateTurnLabel();
  setTimeout(() => {
    document.getElementById("diceBtn").disabled = false;
  }, 400);
}

function winGame(pidx) {
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
          showMsg(`🤖 CPU ${CHARS[players[1].charIdx].name} melempar ${roll}!`);
          setTimeout(() => movePlayer(1, roll), 600);
        }
      }, 1000);
    }
  }, 500);
}

document.getElementById("diceBtn").addEventListener("click", rollDice);
document.getElementById("diceBtn").style.display = "none";
buildStartScreen();

ctx.fillStyle = "#0a0a1a";
ctx.fillRect(0, 0, 960, 640);
ctx.fillStyle = OLD_GOLD;
ctx.font = '14px "Press Start 2P"';
ctx.textAlign = "center";
ctx.fillText("HACKATHON: CLIMB TO MASTERY", 480, 320);
