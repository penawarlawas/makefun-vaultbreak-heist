import { createState, step, throwNoisemaker } from "./sim.js";
import { render } from "./render.js";
import { WIDTH, HEIGHT, ALARM } from "./level.js";

const FIXED_DT = 1 / 60;

export function main() {
  const canvas = document.getElementById("screen");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  const params = new URLSearchParams(location.search);
  const shot = params.get("shot");

  if (shot === "start") {
    runStartShot(ctx);
    return;
  }
  if (shot === "play") {
    runPlayShot(ctx);
    return;
  }
  if (shot === "end") {
    runEndShot(ctx);
    return;
  }

  runGame(canvas, ctx);
}

function runGame(canvas, ctx) {
  let state = createState();
  const input = { left: false, right: false, up: false, down: false };
  const pointer = { x: state.thief.x, y: state.thief.y, has: false };

  const throwAtPointer = () => {
    if (state.caught || state.won) return;
    let x = pointer.x;
    let y = pointer.y;
    if (!pointer.has) {
      let dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      let dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
      if (dx === 0 && dy === 0) { dx = 1; dy = 0; }
      const len = Math.hypot(dx, dy);
      x = state.thief.x + (dx / len) * 120;
      y = state.thief.y + (dy / len) * 120;
    }
    throwNoisemaker(state, x, y);
  };

  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.key === " ") {
      e.preventDefault();
      throwAtPointer();
    }
    setKey(input, e.key, true);
    if ((state.caught || state.won) && (e.key === "r" || e.key === "R")) {
      state = createState();
    }
  });
  window.addEventListener("keyup", (e) => setKey(input, e.key, false));

  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = (e.clientX - rect.left) * (WIDTH / rect.width);
    pointer.y = (e.clientY - rect.top) * (HEIGHT / rect.height);
    pointer.has = true;
  });
  canvas.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    const rect = canvas.getBoundingClientRect();
    pointer.x = (e.clientX - rect.left) * (WIDTH / rect.width);
    pointer.y = (e.clientY - rect.top) * (HEIGHT / rect.height);
    pointer.has = true;
    throwAtPointer();
  });

  let accumulator = 0;
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    accumulator += dt;
    while (accumulator >= FIXED_DT) {
      step(state, input, FIXED_DT);
      accumulator -= FIXED_DT;
    }
    render(ctx, state);
    drawOverlay(ctx, state);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function drawOverlay(ctx, state) {
  if (!state.caught && !state.won) return;
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = state.won ? "#22c55e" : "#ef4444";
  ctx.font = "bold 48px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(state.won ? "ESCAPED" : "ALARM TRIPPED", WIDTH / 2, HEIGHT / 2 - 20);
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "16px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
  ctx.fillText("Press R to restart", WIDTH / 2, HEIGHT / 2 + 24);
}

function runStartShot(ctx) {
  patchRandom(12345);
  const state = createState(12345);
  render(ctx, state);
  window.__shotReady = true;
}

function runPlayShot(ctx) {
  patchRandom(67890);
  const state = createState(67890);
  const frames = Math.round(7.5 / FIXED_DT);
  for (let i = 0; i < frames; i++) {
    const input = autopilot(state);
    step(state, input, FIXED_DT);
    if (state.caught || state.won) break;
  }
  render(ctx, state);
  window.__shotReady = true;
}

function runEndShot(ctx) {
  patchRandom(11111);
  const state = createState(11111);
  state.hasLoot = true;
  // Drive the alarm to its limit so the end scene is the loss state, not a win.
  state.alarm = ALARM.max;
  state.caught = true;
  step(state, { left: false, right: false, up: false, down: false }, FIXED_DT);
  render(ctx, state);
  drawOverlay(ctx, state);
  window.__shotReady = true;
}

function autopilot(state) {
  const target = state.hasLoot ? state.level.entry : state.level.loot;
  let dx = target.x - state.thief.x;
  let dy = target.y - state.thief.y;
  const len = Math.hypot(dx, dy);
  if (len > 0) {
    dx /= len;
    dy /= len;
  }

  for (const g of state.level.guards) {
    const d = Math.hypot(state.thief.x - g.x, state.thief.y - g.y);
    if (d < 90) {
      const awayX = state.thief.x - g.x;
      const awayY = state.thief.y - g.y;
      const awayLen = Math.hypot(awayX, awayY);
      if (awayLen > 0) {
        dx += (awayX / awayLen) * 1.6;
        dy += (awayY / awayLen) * 1.6;
      }
    }
  }

  const n = Math.hypot(dx, dy);
  if (n > 0) {
    dx /= n;
    dy /= n;
  }
  return {
    left: dx < -0.35,
    right: dx > 0.35,
    up: dy < -0.35,
    down: dy > 0.35,
  };
}

function setKey(input, key, value) {
  if (key === "ArrowLeft" || key === "a" || key === "A") input.left = value;
  if (key === "ArrowRight" || key === "d" || key === "D") input.right = value;
  if (key === "ArrowUp" || key === "w" || key === "W") input.up = value;
  if (key === "ArrowDown" || key === "s" || key === "S") input.down = value;
}

function patchRandom(seed) {
  let a = seed >>> 0;
  Math.random = function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

main();
