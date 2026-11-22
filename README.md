# Vaultbreak

A small top-down heist game: cross a guarded floor, take the case, and get back
to the entry before the alarm fills.

- `game/index.html` opens the game directly in a desktop browser — plain ES
  modules, canvas 2D, no build step and no network requests.
- `?shot=start`, `?shot=play` and `?shot=end` render the three deterministic
  scenes used for the screenshots.
- `main.ts` assembles the entry dossier: `node main.ts` writes `dossier.json`,
  the game files and the screenshots to `MAKEFUN_OUTPUT_DIR`.
- `screenshots/` holds the three captured frames.

Controls: WASD or arrow keys to move, `R` to restart after a win or a loss.

Guards and cameras both raise the alarm while they can see the thief, and the
alarm only drains slowly once sight is broken, so the safe route is rarely the
short one.
