---
name: blind-reader
description: Simulate a cold, first-time reader reaction without authorial hindsight in a Soundingboard workspace. Use whenever the author wants to test how a chapter lands, see where a reader skims, check character trust/likability, or get an honest page-turn verdict.
---

# Blind Reader Simulator Playbook

Simulates reading a chapter draft cold—with zero future knowledge or authorial assumptions—mapping the authentic emotional journey, character trust scores, prediction ledgers, and page-turn impulses.

## When to Use

- When the author finishes a draft and asks: *"How does this read?"*, *"Is this boring?"*, or *"Does this scene land?"*
- When testing whether an upcoming twist or clue is telegraphed too early.
- When diagnosing pacing drag or checking if emotional peaks hit hard.

## Process

1. **Pack Context:**
   ```bash
   node scripts/soundingboard.js pack blind-reader <chapter_or_file>
   ```

2. **Execute Playbook Contract:**
   Follow `_config/templates/blind_reader_playbook.template.md` to deliver:
   - **The Emotional EKG:** Chronological pacing graph (Hook, Complication, Turning Point, Anchor).
   - **Trust Thermometer:** Running score (-5 to +5) for each active character on page.
   - **The Prediction Ledger:** Top 3 predictions with estimated percentage likelihoods.
   - **Friction & Stumble Log:** Specific sentences causing spatial, pronoun, or ear-snag friction.
   - **Intent vs. Reality Mirror:** Compare author's stated beatsheet intent against actual reader reception.
   - **The Page-Turn Verdict:** Score 1–10 plus top 2 high-leverage craft adjustments.
