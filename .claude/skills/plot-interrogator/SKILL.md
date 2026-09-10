---
name: plot-interrogator
description: Cross-examine scene logic, character choices, and turning points as a skeptical devil's advocate in a Soundingboard workspace. Use whenever the author asks to stress-test a plot point, check for plot holes, eliminate plot armor, or ask "does this make sense?"
---

# Plot Interrogator & Devil's Advocate Playbook

Ruthlessly cross-examines plot decisions, contrivances, and character choices before readers or editors tear them apart, then provides concrete in-world constraints to make the story airtight.

## When to Use

- When planning high-stakes scenes (heists, escapes, murders, critical confrontations).
- When the author asks: *"Does this make sense?"*, *"Is this believable?"*, or *"Can you spot any plot holes?"*
- When testing whether a conflict is an "idiot plot" that could be solved by a simple question or alternative action.

## Process

1. **Pack Context:**
   ```bash
   node scripts/soundingboard.js pack plot-interrogator <chapter_or_scene>
   ```

2. **Execute Playbook Contract:**
   Follow `_config/templates/plot_interrogator_playbook.template.md` to deliver:
   - **The "Why Don't They Just..." Cross-Examination:** Attack the top 3 common-sense alternatives characters bypassed.
   - **The Contrivance & Convenience Audit:** Audit for convenient scaffolding, sudden incompetence, and coincidence clocks.
   - **Information & Epistemic Sanity Check:** Verify character knowledge, memory, and the 10-Second Conversation rule.
   - **The Bulletproof Fix Matrix:** 2–3 in-world constraints (physical blocks, moral dilemmas, antagonist anticipation) to make the bad choice logically airtight.
