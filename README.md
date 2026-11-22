[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/penawarlawas/makefun-vaultbreak-heist/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/penawarlawas/makefun-vaultbreak-heist/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

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

Controls: WASD or arrow keys to move, `Space` or a click to throw a noisemaker
at the pointer, `R` to restart after a win or a loss.

Guards and cameras both raise the alarm while they can see the thief, and the
alarm only drains slowly once sight is broken, so the safe route is rarely the
short one. Three noisemakers pull nearby guards to where they land, which is the
only way past a cone that never leaves its post.
