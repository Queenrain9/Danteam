# 달콩이의 작은 밤정원 · Little Night Garden

2026-09-25 · Self-contained offline mobile-friendly HTML5 original game.

## Creative direction / source of truth

The user's goal is a cute, charming mobile game centered on attachment to a little character. All development decisions (concept, aesthetic, gameplay, QA and packaging) are made autonomously; no intermediate approval cycles. Final goal is a polished, revisable game suitable for further commercial preparation, not a proof-of-concept or an AI evaluation exercise.

## Game

A hand-drawn-looking SVG/CSS companion garden. Choose and name one of three buddies; plant, water, sing and harvest four types of moonlit flowers; care for your buddy (never punish time away); meet its daily small request; play a firefly tapping mini-game; collect starlight, decorate the garden with six permanent items and send letters through a seven-night authored storyline with three optional personal choices. Completing the arc unlocks endless nights. Auto-save, backup/import JSON, synthesized audio toggle, keyboard and touch controls, responsive portrait mobile layout. No server or external assets/dependencies.

## QA

Chromium 320, 390, 768 and 1366 px: no horizontal overflow or uncaught JS errors. Programmatic full seven-night end-to-end run: choose pet / rename / pet touch / plant-growth-harvest / daily requests / night progression / story choices / ending / decoration purchase / four-firefly mini-game / memories / save reload / mute toggle all passed. The browser automation environment blocks local file navigation, so the identical standalone HTML source was loaded with Playwright set_content and a localStorage API shim for the automated checks. Ordinary browser localStorage is used in the release file.

## Deliverable

`달콩이의_작은_밤정원.html` is the single-file, offline game execution artifact delivered through ChatGPT. The full source is included in the downloadable project ZIP. The HTML source is expected to be stored in this folder too when a GitHub-compatible upload is available. Do not claim the HTML was uploaded before the actual GitHub file write succeeds.

## Notes

Development is isolated to `chat-game-test/little-night-garden/` in this repo; no unrelated games were modified. The prototype intentionally avoids monetization, realtime punishment, third-party content, network accounts, gambling, or dependencies. Prioritize portable local editing and user feedback after the complete playable build.
