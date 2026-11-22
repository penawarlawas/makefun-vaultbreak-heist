import { TILE, WIDTH, HEIGHT, ROWS, COLS, GUARD, CAMERA } from "./level.js";

const COLORS = {
  floorA: "#1a1c24",
  floorB: "#1f222d",
  grid: "#2a2e3a",
  wall: "#2d333b",
  wallTop: "#4a5568",
  entry: "#38bdf8",
  loot: "#facc15",
  lootGlow: "rgba(250, 204, 21, 0.35)",
  thief: "#3b82f6",
  guard: "#ef4444",
  guardAlert: "#f97316",
  camera: "#a855f7",
  coneGuard: "rgba(239, 68, 68, 0.34)",
  coneGuardAlert: "rgba(249, 115, 22, 0.46)",
  coneCamera: "rgba(168, 85, 247, 0.30)",
  panel: "rgba(15, 23, 42, 0.82)",
  panelBorder: "#334155",
  text: "#e2e8f0",
  textDim: "#94a3b8",
  alarmGreen: "#22c55e",
  alarmGold: "#eab308",
  alarmRed: "#ef4444",
  noise: "#f472b6",
};

const PANEL = {
  pad: 10,
  line: 18,
  font: "14px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  small: "12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
};

function drawFloor(ctx) {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      ctx.fillStyle = (row + col) % 2 === 0 ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(col * TILE, row * TILE, TILE, TILE);
    }
  }
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= WIDTH; x += TILE) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, HEIGHT);
  }
  for (let y = 0; y <= HEIGHT; y += TILE) {
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
  }
  ctx.stroke();
}

function drawEntry(ctx, entry) {
  ctx.strokeStyle = COLORS.entry;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.arc(entry.x, entry.y, 16, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = COLORS.text;
  ctx.font = "bold 11px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("EXIT", entry.x, entry.y);
}

function drawLoot(ctx, state) {
  if (state.hasLoot) return;
  const { x, y } = state.level.loot;
  const w = 24;
  const h = 16;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = COLORS.lootGlow;
  ctx.beginPath();
  ctx.arc(0, 0, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.loot;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, 4);
  ctx.fill();
  ctx.strokeStyle = "#fde047";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#451a03";
  ctx.fillRect(-2, -h / 2, 4, h);
  ctx.restore();
}

function drawCone(ctx, x, y, angle, range, halfAngle, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fill();
}

function drawCamera(ctx, cam) {
  drawCone(ctx, cam.x, cam.y, cam.angle, cam.range ?? CAMERA.range, cam.halfAngle ?? CAMERA.halfAngle, COLORS.coneCamera);
  ctx.fillStyle = COLORS.camera;
  ctx.beginPath();
  ctx.arc(cam.x, cam.y, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.text;
  ctx.beginPath();
  ctx.arc(cam.x, cam.y, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawGuard(ctx, guard, alertRatio) {
  const color = alertRatio > 0.3 ? COLORS.guardAlert : COLORS.guard;
  drawCone(ctx, guard.x, guard.y, guard.angle, guard.visionRange ?? GUARD.visionRange, guard.visionHalfAngle ?? GUARD.visionHalfAngle, alertRatio > 0.3 ? COLORS.coneGuardAlert : COLORS.coneGuard);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#7f1d1d";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = COLORS.text;
  ctx.beginPath();
  ctx.arc(guard.x + Math.cos(guard.angle) * 5, guard.y + Math.sin(guard.angle) * 5, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawPings(ctx, state) {
  for (const p of state.pings) {
    const life = p.time / 2.5;
    const radius = (1 - life) * 240;
    ctx.strokeStyle = `rgba(244, 114, 182, ${life * 0.7})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = COLORS.noise;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.text;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawWalls(ctx, walls) {
  for (const w of walls) {
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = COLORS.wallTop;
    ctx.fillRect(w.x, w.y, w.w, 4);
    ctx.strokeStyle = "#1f2937";
    ctx.lineWidth = 1;
    ctx.strokeRect(w.x + 0.5, w.y + 0.5, w.w - 1, w.h - 1);
  }
}

function drawThief(ctx, state) {
  const { x, y } = state.thief;
  ctx.fillStyle = COLORS.thief;
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#1e3a8a";
  ctx.lineWidth = 2;
  ctx.stroke();
  if (state.hasLoot) {
    ctx.fillStyle = COLORS.loatGlow;
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.loot;
    ctx.fillRect(x - 6, y - 10, 12, 8);
    ctx.strokeStyle = "#fde047";
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 6, y - 10, 12, 8);
  }
}

function drawTopLeftPanel(ctx, state) {
  const lines = [
    "VAULTBREAK",
    state.hasLoot ? "Escape to EXIT with the loot." : "Reach LOOT without being seen.",
    "NOISEMAKERS: " + state.noisemakers,
  ];
  // Size the panel to the widest line so the objective never spills out.
  ctx.font = PANEL.font;
  const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
  const w = Math.max(210, Math.ceil(widest) + PANEL.pad * 2 + 4);
  const h = PANEL.pad * 2 + lines.length * PANEL.line;
  drawPanel(ctx, 12, 12, w, h);
  ctx.fillStyle = COLORS.text;
  ctx.font = "bold 14px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(lines[0], 12 + PANEL.pad, 12 + PANEL.pad);
  ctx.fillStyle = COLORS.textDim;
  ctx.font = PANEL.font;
  ctx.fillText(lines[1], 12 + PANEL.pad, 12 + PANEL.pad + PANEL.line);
  ctx.fillStyle = COLORS.noise;
  ctx.fillText(lines[2], 12 + PANEL.pad, 12 + PANEL.pad + PANEL.line * 2);
}

function drawAlarmPanel(ctx, state) {
  const pct = Math.min(100, Math.max(0, Math.round(state.alarm)));
  const w = 160;
  const h = 56;
  const x = WIDTH - w - 12;
  const y = 12;
  drawPanel(ctx, x, y, w, h);
  ctx.fillStyle = COLORS.text;
  ctx.font = "bold 12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("ALARM", x + PANEL.pad, y + PANEL.pad);
  ctx.textAlign = "right";
  ctx.fillText(pct + "%", x + w - PANEL.pad, y + PANEL.pad);
  const barX = x + PANEL.pad;
  const barY = y + PANEL.pad + 20;
  const barW = w - PANEL.pad * 2;
  const barH = 10;
  ctx.fillStyle = "#334155";
  ctx.fillRect(barX, barY, barW, barH);
  const fill = (pct / 100) * barW;
  ctx.fillStyle = pct < 33 ? COLORS.alarmGreen : pct < 66 ? COLORS.alarmGold : COLORS.alarmRed;
  ctx.fillRect(barX, barY, fill, barH);
}

function drawLegend(ctx) {
  const items = [
    { label: "THIEF", color: COLORS.thief },
    { label: "GUARD", color: COLORS.guard },
    { label: "CAMERA", color: COLORS.camera },
    { label: "LOOT", color: COLORS.loot },
    { label: "EXIT", color: COLORS.entry },
  ];
  const w = 120;
  const h = PANEL.pad * 2 + items.length * PANEL.line;
  const x = 12;
  const y = HEIGHT - h - 12;
  drawPanel(ctx, x, y, w, h);
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.font = PANEL.small;
  items.forEach((item, i) => {
    const iy = y + PANEL.pad + i * PANEL.line;
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.arc(x + PANEL.pad + 5, iy + 5, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.text;
    ctx.fillText(item.label, x + PANEL.pad + 14, iy);
  });
}

function drawPanel(ctx, x, y, w, h) {
  ctx.fillStyle = COLORS.panel;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 6);
  ctx.fill();
  ctx.strokeStyle = COLORS.panelBorder;
  ctx.lineWidth = 1;
  ctx.stroke();
}

export function render(ctx, state) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawFloor(ctx);
  drawEntry(ctx, state.level.entry);
  drawLoot(ctx, state);
  for (const cam of state.level.cameras) drawCamera(ctx, cam);
  for (const g of state.level.guards) drawGuard(ctx, g, state.alarm / 100);
  drawWalls(ctx, state.level.walls);
  drawPings(ctx, state);
  drawThief(ctx, state);
  drawTopLeftPanel(ctx, state);
  drawAlarmPanel(ctx, state);
  drawLegend(ctx);
}
