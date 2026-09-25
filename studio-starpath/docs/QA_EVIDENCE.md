# P1 QA evidence (2026-09-25)

Test environment: headless Chromium + Playwright loading exact standalone HTML using page.set_content with a test-only localStorage shim. file:// and localhost browser automation navigation were blocked by the environment; actual release uses native browser localStorage.

Measured: 320×760, 390×844, 464×940, 800×900 and 1366×900 viewport renders all 49 tiles, title modal, no horizontal document overflow and zero observed uncaught JS errors. Korean and Japanese tested at 390px.

End-to-end: create named companion, tap for response, hint highlights next route cell, keyboard movement, undo, stage reset, solver-derived traversal for all 12 stages (alternating optional treat and direct delivery), modal completion, final ending, unlocked stage replay, 13+ memory journal entries, room decoration, Korean↔Japanese switch, sound toggle and saved completion reloading in a second 320px page. Zero observed uncaught page errors in this path.

Deterministic 7×7 levels were generated with distinct mandatory-seal/gate route vs optional-treat detour. Cost-aware Dijkstra search verifies a legal finish both with and without the treat under each stage's step budget. Level data is in the source ZIP.

NOT established: player fun, affection or return behavior; independent human testers; native Japanese/Korean editorial review; actual Android/iOS touch hardware; low-end performance; complete commercial legal review; app-store approval. These remain mandatory open gates. Do not present automatic playthroughs as proof of subjective human experience.