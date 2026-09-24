# LITTLE NIGHT GARDEN — Autonomous game production state
Date: 2026-09-25
Folder: chat-game-test/little-night-garden/

## User intent
Deliver an actually playable polished, revisable mobile-friendly cute and charming game where players grow attached to one original character. Autonomously decide genre, art, mechanics, economy, narrative, testing and packaging. Do not interrupt for creative approvals, compare design options in chat, or substitute progress reports for implementation. Deliver the full playable game; the human only decides what to change after playing.

## Game concept
Title: 달콩이의 작은 밤정원 (Little Night Garden). A cozy night garden companion raising and tiny starlight delivery story in seven authored nights, with endless gentle gardening afterward. Portrait-first mobile HTML5 single file, touch and keyboard input, independent of backend. Choose one of three stylized creatures, rename it, grow plants, give flowers, meet its small request, gather fireflies, place decorations, exchange nightly starlight for the next story memory, and finish by returning the lost star home.

## Creative constraints
Original coded SVG creatures, original SVG night scene with cottage and moon and hills, restrained lavender/night-sky/cream palette, cute rounded UI, readable 320px wide. No generic hyperrealistic game art. Do not punish absences: no offline decay, streaks, forced waiting, or guilt. No gambling, monetization, analytics or user accounts. Modern Safari/Chrome; audio synthesized and toggleable. All save data local with JSON export/import.

## Gameplay contracts
- 3 pets: moru / ip / byeol. Name up to 12 characters; bond grows through active play.
- 4 plant stages per garden plot: empty -> planted -> watered -> sung-to / bloomed -> harvested / empty. No currency cost to plant, so resource soft-lock is impossible.
- 4 flower types unlocked at nights 1/1/3/5: moon (star 2,glow 3,petal 1); cotton (1,4,2); berry (2,3,2); lampflower (3,2,1). Flower growth requires 4 taps including planting.
- 4 plots, fourth opens on night 2.
- Mail thresholds night1–2:5 shards; nights3–7:6; 8+:7. Excess shards carry forward.
- One optional nightly request for a specific unlocked flower, +3 glimmer and +2 bond the first time it is harvested.
- Firefly walk: 15 seconds, tap four fireflies. Each capture yields 2 glimmer; a partial or timed-out attempt still yields at least one glimmer. First four-firefly success per night also yields one shard and +2 bond; replay remains possible for glimmer.
- Flower gift: 3 petals, +3 bond. One free pet greeting bond per night, further taps remain responsive.
- Decorations (permanent): 8/11/16/19/24/30 glimmer; buying each gives +2 bond.
- Bond milestone memories at 8/20/35/55; mailbox +2 bond each night.
- 7 nights each with authored story text and unique postcard. Three occasional player narrative choices personalize memory. Completion offers an ending and unlocks endless nights (recurring epilogue).
- localStorage auto-save, in-game reset with confirmation, JSON export/import. Mouse/touch and 1-4/G/W/M/Escape keyboard controls.

## QA as of 2026-09-25
Complete scripted route passed in Chromium at widths 320,390,768,1366: pet creation/name/touch, all flower stages, repeat until mailbox available, seven letters and ending, story branch choices, garden decoration, 4/4 firefly success, memory scrapbook, reload of saved state, sound toggle. No JS page errors or horizontal overflow on those widths. Browser security prevented automated file:// or localhost navigation, so exact HTML was loaded with Playwright set_content and a localStorage shim only inside the harness. Normal release continues to use browser localStorage.

## Artifacts
Standalone release: /mnt/data/달콩이의_작은_밤정원.html
Editable zip: /mnt/data/달콩이의_작은_밤정원_소스.zip
Canonical HTML: /mnt/data/little-night-garden/index.html
Test suite: /mnt/data/little-night-garden/qa_fast.py
Browser captures: /mnt/data/little-night-garden/mobile-garden.png and mobile-ending.png.

These /mnt/data paths refer to the originating ChatGPT conversation sandbox, NOT GitHub files or permanent internet links. This GitHub file preserves all creative/system decisions and QA context for continuation. The game source is present in the downloadable ZIP. To claim it has been pushed to GitHub, actually commit the complete source in this folder first.
