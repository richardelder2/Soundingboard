# Subplot Resolution Variety & Loose-End Audit Playbook

## When this applies
The author is in Act 3 planning or Stage 04 diagnostics/edits, reviewing how the manuscript's narrative threads and character arcs conclude. Common triggers:
- *"Audit the endings of my subplots."*
- *"Check if my thread resolutions are clumped together at the end."*
- *"Make sure my endings don't all feel like tidy, predictable AI wrap-ups."*
- *"Help me choose intentional loose ends for my Loose-End Ledger."*

## What good output looks like
- **The Core Anti-AI Rule (Resolution Variety):**
  - AI fiction resolves arcs through *protagonist choice* 69% of the time (vs. 46% in human fiction).
  - AI fiction defaults to *internal understanding / quiet acceptance* 47% of the time (vs. 27% in human fiction).
  - AI fiction clumps all resolutions into the final 1–2 chapters.
- **Staggered Resolution Timing:**
  - At least one secondary thread must resolve *before* the third act climax (e.g. at the end of Act 2 or early Act 3), clearing space for the main payoff.
  - Climax handles the primary obligatory scene.
  - Epilogue/Aftermath handles emotional settling, not plot exposition dumps.
- **Resolution Variety Matrix:** Ensure thread resolutions are distributed across diverse modes:
  1. *Protagonist Decisive Action:* Allowed, but rationed to $\le 50\%$ of tracked threads.
  2. *Secondary Character / Antagonist Agency:* Solved by someone else's choice or sacrifice.
  3. *External Fate / Environmental Force / Blind Luck:* Circumstances shift the ground.
  4. *Pyrrhic Settlement:* The thread closes, but the cost exceeds the prize.
  5. *The Intentional Loose End:* Per Layer 1 of our authenticity directive, leave at least **one loose end per act unresolved**. Real human lives carry unresolved mysteries, unanswered letters, and lingering tensions.

## Context
Execute the mechanical context packer:
```bash
node scripts/pack-subplot-resolution.js [act_or_chapter]
# or:
node scripts/soundboard.js pack subplot-resolution [act_or_chapter]
```
Use the output (`NARRATIVE THREAD LEDGER`, `RESOLUTION TIMING & CLUMPING AUDIT`, `STRUCTURE PLAN RESOLUTION VARIETY`, `MANUSCRIPT STATE`) to inspect the distribution of endings.

## Process
1. **Audit Resolution Distribution (Clumping Scan):**
   - Check if 3+ threads are scheduled to conclude in the same final chapter.
   - Redistribute earlier resolutions into Act 2B or Act 3 opening.
2. **Apply the Resolution Variety Matrix:**
   - Categorize each thread's proposed ending mode.
   - Ensure protagonist-choice does not monopolize all resolutions.
3. **Designate Intentional Loose Ends:**
   - Identify 1–2 minor subplots or background questions that remain unresolved.
   - Record them formally in `structure_plan.md` (Loose-End Ledger) so automated audits do not mistake them for drafting oversights.

## Output format

```markdown
# 🏁 Subplot Resolution & Loose-End Audit

### 📊 Resolution Timing & Clumping Diagnosis
- **Total Tracked Threads:** [Count]
- **Clumping Verdict:** [BALANCED / CLUMPED IN FINAL CHAPTERS]
- **Recommended Staggering:** [Move Thread T-XX to resolve in Ch [N] prior to main climax]

---

### 🎲 Resolution Variety Matrix
| Thread ID | Thread Description | Target Chapter | Resolution Mode | Authenticity Dial |
|---|---|---|---|---|
| T-01 | [Main Quest] | Ch [Final] | Protagonist Choice | Main Obligatory Beat |
| T-02 | [Subplot Title] | Ch [Earlier] | Secondary Character Agency | Non-Protagonist |
| T-03 | [Mundane Subplot] | Ch [Mid-Act 3] | External Fate / Bureaucracy | Environmental/Luck |
| T-04 | [Relational Friction] | Ch [Aftermath] | Pyrrhic / Unsettled | Non-Acceptance |
| T-05 | [Open Mystery] | UNRESOLVED | **Intentional Loose End** | Human Asymmetry |

---

### 📜 Loose-End Ledger Registration (for `structure_plan.md`)
- **Unresolved Thread:** [Thread ID: Description]
- **Rationale for Non-Resolution:** [Why leaving this open enriches the world's realism and avoids tidy AI closure]
- **Status:** Officially protected from revision cuts.

---

*Would you like to apply this staggered resolution matrix to your thread ledger and structure plan?*
```
