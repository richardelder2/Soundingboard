---
name: dialogue-heat
description: Intensify flat, polite, or expository dialogue in a Soundboard workspace. Use whenever the author asks to heat up dialogue, inject subtext, add status play, or create conversational friction.
---

# Dialogue Heat Playbook Skill

When dialogue feels flat or lacks tension:
1. **Never invoke `dialogue_heat_wizard.js`.**
2. Assemble mechanical context:
   ```bash
   node scripts/pack-dialogue-heat.js [chapter_or_snippet] [character_names...]
   ```
3. Execute the contract natively per `_config/templates/dialogue_heat_playbook.template.md`.
4. Apply the chosen tension mode (Subtext, Status Play, or Avoidance).
5. Produce 2 rewritten alternatives:
   - Alternative 1: Smoldering / Cold Friction (Restrained subtext).
   - Alternative 2: Acute Friction / Status Clash (High-intensity cuts and dominance play).
