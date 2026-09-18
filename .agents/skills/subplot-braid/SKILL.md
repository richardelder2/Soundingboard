---
name: subplot-braid
description: Calculate thread dormancy and weave secondary storylines into upcoming chapter beats in a Soundingboard workspace. Use whenever the author asks to braid subplots, freshen a B-story, or check for neglected narrative threads.
---

# Subplot Braiding Playbook Skill

When integrating secondary threads into an upcoming chapter:
1. Assemble mechanical context and calculate dormancy:
   ```bash
   node scripts/pack-subplot-braid.js <chapter_number>
   ```
2. Execute the contract natively per `_config/templates/subplot_braid_playbook.template.md`.
3. Inspect thread starvation ($\ge 2$ chapters without mention).
4. Propose 3 non-intrusive braiding options:
   - Level 1: Environmental / Physical Setting Texture.
   - Level 2: Conversational Undercurrent / Dialogue Subtext.
   - Level 3: Tactical Micro-Obstacle in Scene.
5. Record thread progress in `threads.md`.
