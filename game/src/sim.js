import { WIDTH, HEIGHT, TILE, PLAYER, GUARD, CAMERA, ALARM, parseLevel, blocked, segmentBlocked, angleDiff } from "./level.js";

export const NOISEMAKER = { count: 3, radius: 240, duration: 2.5 };

export function createState(seed = Date.now()) {
  const level = parseLevel();
  return {
    level,
    thief: { x: level.entry.x, y: level.entry.y },
    hasLoot: false,
    alarm: 0,
    caught: false,
    won: false,
    seed,
    rng: mulberry32(seed),
    seenTimer: 0,
    noisemakers: NOISEMAKER.count,
    pings: [],
  };
}

export function throwNoisemaker(state, x, y) {
  if (state.noisemakers <= 0) return false;
  state.noisemakers -= 1;
  state.pings.push({
    x: Math.max(0, Math.min(WIDTH, x)),
    y: Math.max(0, Math.min(HEIGHT, y)),
    time: NOISEMAKER.duration,
  });
  return true;
}

export function step(state, input, dt) {
  if (state.caught || state.won) return;
  moveThief(state, input, dt);
  updateLoot(state);
  for (const p of state.pings) p.time -= dt;
  state.pings = state.pings.filter((p) => p.time > 0);
  updateGuards(state, dt);
  updateCameras(state, dt);
  updateAlarm(state, dt);
  checkCatch(state);
  checkWin(state);
}

function moveThief(state, input, dt) {
  let dx = 0;
  let dy = 0;
  if (input.left) dx -= 1;
  if (input.right) dx += 1;
  if (input.up) dy -= 1;
  if (input.down) dy += 1;
  if (dx === 0 && dy === 0) return;
  const len = Math.hypot(dx, dy);
  dx /= len;
  dy /= len;
  const speed = state.hasLoot ? PLAYER.carrySpeed : PLAYER.speed;
  const nextX = state.thief.x + dx * speed * dt;
  const nextY = state.thief.y + dy * speed * dt;
  if (!blocked(state.level.walls, nextX, state.thief.y, PLAYER.radius)) {
    state.thief.x = nextX;
  }
  if (!blocked(state.level.walls, state.thief.x, nextY, PLAYER.radius)) {
    state.thief.y = nextY;
  }
  state.thief.x = Math.max(PLAYER.radius, Math.min(WIDTH - PLAYER.radius, state.thief.x));
  state.thief.y = Math.max(PLAYER.radius, Math.min(HEIGHT - PLAYER.radius, state.thief.y));
}

function updateLoot(state) {
  if (state.hasLoot) return;
  const loot = state.level.loot;
  const dist = Math.hypot(state.thief.x - loot.x, state.thief.y - loot.y);
  if (dist < 26) state.hasLoot = true;
}

function updateGuards(state, dt) {
  let seen = false;
  for (const g of state.level.guards) {
    const distraction = state.pings.find((p) => Math.hypot(g.x - p.x, g.y - p.y) < NOISEMAKER.radius);
    const chasing = g.alert > 45;
    pickGuardMove(state, g, dt, distraction || (chasing ? state.thief : g.target));
    const toThief = Math.atan2(state.thief.y - g.y, state.thief.x - g.x);
    const dist = Math.hypot(state.thief.x - g.x, state.thief.y - g.y);
    const inCone = dist < GUARD.visionRange && Math.abs(angleDiff(toThief, g.angle)) < GUARD.visionHalfAngle;
    const visible = inCone && !segmentBlocked(state.level.walls, g.x, g.y, state.thief.x, state.thief.y);
    if (visible) {
      g.alert = Math.min(100, g.alert + GUARD.alertGain * dt);
      seen = true;
    } else {
      g.alert = Math.max(0, g.alert - GUARD.alertDecay * dt);
    }
    if (chasing) {
      g.angle = approachAngle(g.angle, toThief, GUARD.turnRate * 2 * dt);
    }
  }
  if (seen) state.seenTimer = 0.3;
}

function pickGuardMove(state, g, dt, target) {
  if (!g.target || Math.hypot(g.x - g.target.x, g.y - g.target.y) < 8) {
    g.target = randomReachablePoint(state, g);
  }
  // A guard with no target yet, or a caller passing none, walks to its own.
  if (!target) target = g.target;
  const desired = Math.atan2(target.y - g.y, target.x - g.x);
  g.angle = approachAngle(g.angle, desired, GUARD.turnRate * dt);
  const speed = target === state.thief ? GUARD.chaseSpeed : GUARD.speed;
  const nx = g.x + Math.cos(g.angle) * speed * dt;
  const ny = g.y + Math.sin(g.angle) * speed * dt;
  if (!blocked(state.level.walls, nx, g.y, GUARD.radius)) g.x = nx;
  if (!blocked(state.level.walls, g.x, ny, GUARD.radius)) g.y = ny;
}

function randomReachablePoint(state, g) {
  for (let i = 0; i < 20; i++) {
    const x = TILE / 2 + state.rng() * (WIDTH - TILE);
    const y = TILE / 2 + state.rng() * (HEIGHT - TILE);
    if (!blocked(state.level.walls, x, y, GUARD.radius)) return { x, y };
  }
  return { x: g.x, y: g.y };
}

function updateCameras(state, dt) {
  let seen = false;
  for (const c of state.level.cameras) {
    c.sweep += CAMERA.sweepSpeed * dt * (c.sweepDir || 1);
    if (c.sweep > c.sweepRange / 2) {
      c.sweep = c.sweepRange / 2;
      c.sweepDir = -1;
    } else if (c.sweep < -c.sweepRange / 2) {
      c.sweep = -c.sweepRange / 2;
      c.sweepDir = 1;
    }
    c.angle = c.baseAngle + c.sweep;
    const toThief = Math.atan2(state.thief.y - c.y, state.thief.x - c.x);
    const dist = Math.hypot(state.thief.x - c.x, state.thief.y - c.y);
    const inCone = dist < CAMERA.range && Math.abs(angleDiff(toThief, c.angle)) < CAMERA.halfAngle;
    const visible = inCone && !segmentBlocked(state.level.walls, c.x, c.y, state.thief.x, state.thief.y);
    if (visible) seen = true;
  }
  if (seen) state.seenTimer = 0.3;
}

function updateAlarm(state, dt) {
  if (state.seenTimer > 0) {
    state.seenTimer -= dt;
    state.alarm = Math.min(ALARM.max, state.alarm + ALARM.decay * dt * 2);
  } else {
    state.alarm = Math.max(0, state.alarm - ALARM.decay * dt);
  }
  if (state.alarm >= ALARM.max) {
    state.caught = true;
  }
}

function checkCatch(state) {
  for (const g of state.level.guards) {
    const dist = Math.hypot(state.thief.x - g.x, state.thief.y - g.y);
    if (dist < GUARD.catchRadius) {
      state.caught = true;
      return;
    }
  }
}

function checkWin(state) {
  if (!state.hasLoot) return;
  const dist = Math.hypot(state.thief.x - state.level.entry.x, state.thief.y - state.level.entry.y);
  if (dist < 26) state.won = true;
}

function approachAngle(current, target, rate) {
  const diff = angleDiff(target, current);
  if (Math.abs(diff) <= rate) return target;
  return current + Math.sign(diff) * rate;
}

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function boot(canvas) {
  const ctx = canvas.getContext("2d");
  const state = createState();
  const input = { left: false, right: false, up: false, down: false };

  window.addEventListener("keydown", (e) => setKey(input, e.key, true));
  window.addEventListener("keyup", (e) => setKey(input, e.key, false));

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(state, input, dt);
    import("./render.js").then(({ render }) => render(ctx, state));
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return state;
}

function setKey(input, key, value) {
  if (key === "ArrowLeft" || key === "a" || key === "A") input.left = value;
  if (key === "ArrowRight" || key === "d" || key === "D") input.right = value;
  if (key === "ArrowUp" || key === "w" || key === "W") input.up = value;
  if (key === "ArrowDown" || key === "s" || key === "S") input.down = value;
}
