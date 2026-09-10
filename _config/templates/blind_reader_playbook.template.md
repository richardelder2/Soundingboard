# Soundingboard — Blind Reader Simulator Playbook

## Purpose & Creative Role

The **Blind Reader Simulator** solves the single greatest handicap of the novel author: **the curse of omniscience**. Because you know the backstory, the true culprit, and the emotional climax, you cannot experience your own pages cold.

This playbook simulates a discerning, highly engaged first-time reader encountering your chapter without hindsight. It strips away authorial assumptions and maps the authentic reader journey: where attention locked in, where the eye started skimming, who the reader suspects, what they predict will happen next, and whether they would turn the page past midnight.

---

## When to Use

- **Post-Draft Reality Check:** You've finished a chapter draft and want to know: *"Does this scene actually land, or does it only work because I know what's in my head?"*
- **Pacing & Drag Diagnosis:** You suspect the middle of a chapter is sagging, but can't pinpoint the exact paragraph where reader momentum drops.
- **Twist Calibration:** You want to test whether an upcoming plot twist is telegraphed too early or if subtle breadcrumbs are actually landing.
- **Character Likability / Alignment Test:** You want to verify whether a character reads as delightfully sharp or accidentally obnoxious.

---

## Context Assembly (Run First)

Execute the deterministic context packer behind the scenes:

```bash
node scripts/soundingboard.js pack blind-reader <chapter_number_or_path>
# or shorthand:
node scripts/soundingboard.js pack reader <chapter_number_or_path>
```

The packer assembles:
1. The full chapter draft text.
2. The preceding chapter's exit anchor (~350 words) for emotional entry momentum.
3. The author's stated scene intent and value shifts from the beatsheet.
4. **Strict Epistemic Isolation:** Deliberately excludes downstream chapters, future reveals, and unearned secrets.

---

## Execution Contract & Analytical Readout

When delivering the Blind Reader simulation, execute these six structured sections:

### 1. The Emotional EKG (Chronological Pacing Graph)
Track the reader's attention and emotional pulse paragraph by paragraph across four distinct movement beats:

| Scene Beat | Reader State | Pacing Velocity | The Reader's Internal Monologue |
|---|---|---|---|
| **Opening Hook (First 15%)** | *e.g., Hooked / Intrigued / Disoriented* | Fast / Medium / Dragging | What the reader is picturing and feeling immediately upon entering. |
| **Complication (15%–50%)** | *e.g., Leaning In / Drifting / Alert* | Fast / Medium / Dragging | Where tension builds or where the eye begins scanning for dialogue tags. |
| **Climax / Turning Point (50%–85%)** | *e.g., Shocked / Gut-Punched / Skeptical* | Fast / Medium / Dragging | The exact sentence where the scene pivoted, and the physiological reaction. |
| **Closing Anchor (Final 15%)** | *e.g., Breathless / Satisfied / Flat* | Fast / Medium / Dragging | The residual emotional resonance left in the reader's chest. |

*Highlight the exact paragraph where the reader felt the sharpest surge of emotion, and the exact paragraph where attention flagged.*

---

### 2. Trust & Suspicion Thermometer
For each active or referenced character in the scene, score their perceived trustworthiness from the reader's perspective:

* **Scale:** `-5 (Certain Betrayer / Hostile Antagonist)` to `+5 (Unconditional Ally / Deeply Rooted In)`
* **The Diagnostic Card for Each Character:**
  - **Score:** `[-5 to +5]`
  - **Emotional Tone:** *(e.g., "Charismatic but calculating", "Fragile and defensive")*
  - **Textual Evidence:** Quote 1–2 lines of dialogue, action, or micro-body language that formed this judgment.
  - **Author Alignment Check:** Does this match the author's intent for this character at this point in the story?

---

### 3. The Prediction Ledger (The Anti-Telegraph Test)
State the **Top 3 predictions** a first-time reader would make immediately upon finishing this chapter:

1. **Prediction 1 (The Obvious Path):** *[Likelihood: X%]* — What the surface clues suggest will happen in the next 1–2 chapters.
2. **Prediction 2 (The Suspicion / Twist Path):** *[Likelihood: Y%]* — The subtle alternate theory the reader is secretly considering.
3. **Prediction 3 (The Wildcard Worry):** *[Likelihood: Z%]* — The fear the reader has for a character they care about.

*Author Advisory: If a planned surprise twist already appears as Prediction 1 with >75% likelihood, the clues are currently too heavy and need camouflage. If the planned twist appears completely off the radar (0%), check if necessary foreshadowing has been planted.*

---

### 4. Friction & Stumble Log (The Micro-Snags)
Identify specific moments where cognitive friction took the reader out of the fictional dream:

- **Spatial & Blocking Fog:** Moments where characters moved through physical space in a confusing or impossible way *(e.g., "Wait, wasn't she standing by the window? When did she sit at the desk?").*
- **Pronoun Ambiguity:** Lines where multiple characters of the same gender caused a half-second pause to identify who spoke or moved.
- **Ear-Snags & Rhythmic Bumps:** Sentences that forced a mental re-read.

---

### 5. Intent vs. Reality Mirror
Compare the author's stated scene intent (from the beatsheet) against the blind reader's actual experience:

- **Intended Emotional Target:** *(e.g., "The reader should feel devastated by Elena's confession.")*
- **Actual Reader Takeaway:** *(e.g., "Elena comes across more evasive than heartbroken; the reader felt frustrated by her secrecy rather than sympathetic.")*
- **The Gap Analysis:** The exact narrative missing link between the author's goal and the reader's reception.

---

### 6. The Page-Turn Verdict
Deliver the unvarnished, affectionate, but brutally honest reader verdict:

- **Page-Turn Score (1 to 10):**
  - *1–4:* Book closed. Going to sleep.
  - *5–7:* Willing to keep reading, but not burning with urgency.
  - *8–10:* Cannot put the book down. Bleary-eyed 2:00 AM page-turn impulse.
- **The Reader's Parting Words:** A 2-sentence candid comment from the reader to the author.
- **Top 2 High-Leverage Adjustments:** Propose 2 surgical, actionable craft choices that will sharpen emotional resonance or eliminate pacing drag without requiring a full chapter rewrite.
