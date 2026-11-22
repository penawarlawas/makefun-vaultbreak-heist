export const TILE = 40;
export const COLS = 24;
export const ROWS = 15;
export const WIDTH = COLS * TILE;
export const HEIGHT = ROWS * TILE;

export const PLAYER = {
  radius: 10,
  speed: 160,
  carrySpeed: 100,
};

export const GUARD = {
  radius: 11,
  speed: 60,
  chaseSpeed: 140,
  visionRange: 220,
  visionHalfAngle: Math.PI / 3,
  turnRate: 1.4,
  alertGain: 50,
  alertDecay: 18,
  catchRadius: 16,
};

export const CAMERA = {
  radius: 8,
  range: 200,
  sweepSpeed: 0.9,
  halfAngle: Math.PI / 4,
};

export const ALARM = {
  max: 100,
  decay: 12,
};

const RAW = [
  "########################",
  "#.....G.........C......#",
  "#..##..........##..C...#",
  "#..##..........##......#",
  "#......####............#",
  "#......#..#............#",
  "#......####............#",
  "#..........G.....G.....#",
  "#..............####....#",
  "#..............#..#....#",
  "#..##..........####....#",
  "#....G.................#",
  "#...............C......#",
  "#..............L.......#",
  "#######..E..############",
];

export function parseLevel() {
  const walls = [];
  const guards = [];
  const cameras = [];
  let entry = { x: WIDTH / 2, y: HEIGHT - TILE / 2 };
  let loot = { x: WIDTH - TILE * 2, y: TILE * 2 };

  for (let row = 0; row < ROWS; row++) {
    const line = RAW[row];
    for (let col = 0; col < COLS; col++) {
      const ch = line[col];
      const x = col * TILE;
      const y = row * TILE;
      if (ch === "#") {
        walls.push({ x, y, w: TILE, h: TILE });
      } else if (ch === "E") {
        entry = { x: x + TILE / 2, y: y + TILE / 2 };
      } else if (ch === "L") {
        loot = { x: x + TILE / 2, y: y + TILE / 2 };
      } else if (ch === "G") {
        guards.push({ x: x + TILE / 2, y: y + TILE / 2, angle: -Math.PI / 2 });
      } else if (ch === "C") {
        // Cameras sweep around a fixed base angle, so the sweep needs a
        // starting angle and a half-range or the renderer gets NaN.
        const baseAngle = row > ROWS / 2 ? -Math.PI / 2 : Math.PI / 2;
        cameras.push({
          x: x + TILE / 2,
          y: y + TILE / 2,
          angle: baseAngle,
          baseAngle,
          sweep: 0,
          sweepRange: Math.PI / 2,
          sweepDir: 1,
        });
      }
    }
  }

  // Guard and camera sight comes from the GUARD/CAMERA tuning, not from the
  // glyph, so the renderer can draw the same cone the simulation tests.
  return { walls, guards, cameras, entry, loot };
}

export function blocked(walls, x, y, radius) {
  for (const w of walls) {
    const closestX = Math.max(w.x, Math.min(x, w.x + w.w));
    const closestY = Math.max(w.y, Math.min(y, w.y + w.h));
    const dx = x - closestX;
    const dy = y - closestY;
    if (dx * dx + dy * dy < radius * radius) return true;
  }
  return false;
}

export function segmentBlocked(walls, ax, ay, bx, by) {
  const steps = Math.ceil(Math.hypot(bx - ax, by - ay) / (TILE / 4));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = ax + (bx - ax) * t;
    const y = ay + (by - ay) * t;
    if (blocked(walls, x, y, 1)) return true;
  }
  return false;
}

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Layout gives the player: a bottom entry with a wide central corridor,
// side nooks and interior wall cover to hide behind, patrolled corridors
// to cross, and a loot corner in the top-right guarded by cameras.
