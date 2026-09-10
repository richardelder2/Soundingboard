---
name: subplot-resolution
description: Audit thread resolution timing, eliminate ending clumping, and enforce the Loose-End Ledger in a Soundboard workspace. Use whenever the author asks to audit subplot endings or check resolution variety.
---

# Subplot Resolution Variety Playbook Skill

When auditing or planning narrative resolutions in Act 3 / Stage 04:
1. Assemble mechanical context and scan for clumping:
   ```bash
   node scripts/pack-subplot-resolution.js [scope]
   ```
2. Execute the contract natively per `_config/templates/subplot_resolution_playbook.template.md`.
3. Stagger resolution timing to clear space before the main climax.
4. Enforce the Resolution Variety Matrix (ration protagonist-choice to $\le 50\%$; assign external, pyrrhic, or secondary-character resolutions).
5. Designate intentional unresolved loose ends for the Loose-End Ledger.
