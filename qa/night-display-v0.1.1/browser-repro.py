#!/usr/bin/env python3
"""Read-only browser reproduction harness for Night Display B v0.1.1.

This file is QA support, NOT part of the game. It neither edits the source nor
certifies independent QA by itself. An actual operator must run and inspect it.
Pin the HTML to the v0.1.1 Git blob SHA below before collecting any results.

Usage:
  python -m pip install playwright
  python -m playwright install chromium
  python qa/night-display-v0.1.1/browser-repro.py \
    --html night-display/play.html --out /tmp/night-display-browser-evidence
"""
import argparse
import hashlib
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

SOURCE_COMMIT = "de06b31462a2e42a44612937806346f429742122"
PLAY_GIT_BLOB = "7bd9fc5a3298f5dddb4ef0c8e91298d9e91a55a4"
CASES = (
    ("MCK", "R1", (1,)),
    ("CMK", "R1", (0,)),
    ("CBK", "R2", (1,)),
    ("BCK", "R2", (0,)),
    ("MBK", "R3", (2,)),
    ("MKB", "R3", (1,)),
    ("MCB", "H", (1,)),
    ("BCM", "H", (1,)),
    ("MKC", "R0", ()),
)
VIEWPORTS = ((320, 640), (360, 800))


def git_blob_sha(data):
    payload = b"blob " + str(len(data)).encode("ascii") + b"\0" + data
    return hashlib.sha1(payload).hexdigest()


def snapshot(page):
    return page.evaluate("""() => {
      const state = window.__KAI_QA__.state;
      const rect = selector => {
        const e = document.querySelector(selector);
        if (!e) return null;
        const r = e.getBoundingClientRect();
        return {x:r.x, y:r.y, left:r.left, right:r.right,
                top:r.top, bottom:r.bottom, width:r.width, height:r.height};
      };
      const overlap = (a,b) => a && b
        ? Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left)) *
          Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)) : null;
      const arm=rect('#arm'), plate=rect('.doorplate'),
            visitor=rect('#visitor'), guest=rect('#hidden-guest');
      const residue=document.querySelector('#residue');
      const get = selector => document.querySelector(selector);
      return {
        phase:state.phase, beat:state.animationStep, slots:state.slots,
        slotSnapshot:state.slotSnapshot, reactionId:state.result?.reactionId ?? null,
        visibleClueSlots:state.result?.visibleClueSlots ?? [],
        residualChange:state.result?.residualChange ?? null,
        screenClueSlots:[...document.querySelectorAll('.slot.clue')]
          .map(e=>Number(e.dataset.slot)),
        message:get('#message-detail')?.textContent,
        visitorOpacity:getComputedStyle(get('#visitor')).opacity,
        guestOpacity:getComputedStyle(get('#hidden-guest')).opacity,
        dustOpacity:getComputedStyle(get('.doorplate'),'::after').opacity,
        doorholeOpacity:getComputedStyle(get('#doorhole')).opacity,
        residueActive:residue.classList.contains('active'),
        residueLeft:getComputedStyle(residue).left,
        arm,plate,visitor,guest,
        armPlateOverlap:overlap(arm,plate),
        guestVisitorOverlap:overlap(guest,visitor),
        viewport:{width:innerWidth,height:innerHeight},
        horizontalOverflow:document.documentElement.scrollWidth>innerWidth,
        events:window.__KAI_QA__.events
      };
    }""")


def capture(page, folder, case, stage):
    measured = snapshot(page)
    page.screenshot(path=str(folder / f"{case}-{stage}.png"), full_page=True)
    return measured


def wait_state(page, phase, step=None):
    page.wait_for_function(
        """({phase,step}) => !!window.__KAI_QA__ &&
           window.__KAI_QA__.state.phase === phase &&
           (step === null || window.__KAI_QA__.state.animationStep === step)""",
        arg={"phase": phase, "step": step}, timeout=8500,
    )


def perform(page, case, reaction, clues, folder):
    page.locator("#reset").click()
    wait_state(page, "PLACE")
    for slot, item in enumerate(case):
        page.locator(f'#tray [data-item="{item}"]').click()
        page.locator(f'#shelf [data-slot="{slot}"]').click()
    wait_state(page, "READY")
    page.locator("#primary").click()
    wait_state(page, "REACT", "CUE")
    cue = capture(page, folder, case, "01-cue")
    wait_state(page, "REACT", "GAZE")
    gaze = capture(page, folder, case, "02-gaze")
    wait_state(page, "REACT", "ACTION")
    # Allow the .38-second hand movement / .45-second dust wipe to reach its
    # end while still inside the 575ms ACTION beat. Not an exact frame capture.
    page.wait_for_timeout(475)
    action = capture(page, folder, case, "03-action")
    wait_state(page, "RESULT")
    result = capture(page, folder, case, "04-result")
    mandatory = {
        "correct_reaction": result["reactionId"] == reaction,
        "slots_preserved": result["slots"] == list(case)
            and result["slotSnapshot"] == list(case),
        "cue_slots": cue["screenClueSlots"] == list(clues),
        "no_horizontal_overflow": not any(
            x["horizontalOverflow"] for x in (cue,gaze,action,result)),
    }
    # These are machine-observable geometry/state checks, NOT evidence that a
    # human understood the silent story or could comfortably tap real hardware.
    if reaction == "R3":
        mandatory["hand_touches_existing_plate"] = action["armPlateOverlap"] > 0
        mandatory["plate_mark_in_result"] = float(result["doorholeOpacity"]) > .8
    if reaction == "H":
        mandatory["paper_guest_unoccluded_bbox"] = result["guestVisitorOverlap"] == 0
    if reaction == "R0":
        mandatory["visitor_stays_departed"] = float(result["visitorOpacity"]) < .05
    return {
        "case":case, "expected_reaction":reaction, "expected_clues":list(clues),
        "mandatory":mandatory,
        "observations": {
            "cue":cue,"gaze":gaze,"action":action,"result":result,
            # SUN-STATIC-01/02/03: record before proposing visual changes.
            "r2_ripple_during_action": action["residueActive"] if reaction=="R2" else None,
            "r0_gaze_measured_shift": gaze["visitor"]["x"]-cue["visitor"]["x"]
                if reaction=="R0" else None,
        }
    }


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--html",type=Path,required=True,help="Exact v0.1.1 play.html")
    parser.add_argument("--out",type=Path,required=True,help="Evidence folder, not git source")
    parser.add_argument("--chromium",type=str,default=None,
                        help="Optional existing Chromium executable path")
    args=parser.parse_args()
    html=args.html.resolve()
    data=html.read_bytes()
    source_blob=git_blob_sha(data)
    if source_blob != PLAY_GIT_BLOB:
        raise SystemExit(f"WRONG HTML VERSION: blob {source_blob}; expected {PLAY_GIT_BLOB}")
    args.out.mkdir(parents=True,exist_ok=True)
    report={"source_commit":SOURCE_COMMIT,"source_play_blob":source_blob,
            "source_html":str(html),"results":[],"runtime":"Chromium via Playwright"}
    with sync_playwright() as playwright:
        opts={"headless":True}
        if args.chromium: opts["executable_path"]=args.chromium
        browser=playwright.chromium.launch(**opts)
        try:
            for width,height in VIEWPORTS:
                context=browser.new_context(viewport={"width":width,"height":height},
                                            is_mobile=True,has_touch=True,
                                            reduced_motion="no-preference")
                page=context.new_page()
                errors=[]
                page.on("pageerror", lambda error: errors.append(str(error)))
                try:
                    page.goto(html.as_uri(),wait_until="load")
                    page.wait_for_function("!!window.__KAI_QA__",timeout=8000)
                    for case,reaction,clues in CASES:
                        folder=args.out / f"{width}x{height}" / case
                        folder.mkdir(parents=True,exist_ok=True)
                        result=perform(page,case,reaction,clues,folder)
                        result["viewport"]=f"{width}x{height}"
                        result["page_errors"]=list(errors)
                        report["results"].append(result)
                finally:
                    context.close()
        finally:
            browser.close()
    dest=args.out/"browser-report.json"
    dest.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
    failures=[(r["viewport"],r["case"],key) for r in report["results"]
              for key,passed in r["mandatory"].items() if not passed]
    errors=[(r["viewport"],r["case"],r["page_errors"]) for r in report["results"]
            if r["page_errors"]]
    print(json.dumps({"target":SOURCE_COMMIT,"screenshots":len(report["results"])*4,
                      "cases":len(report["results"]),"failures":failures,
                      "js_errors":errors,"report":str(dest)},ensure_ascii=False))
    if failures or errors: raise SystemExit(1)


if __name__=="__main__":
    main()
