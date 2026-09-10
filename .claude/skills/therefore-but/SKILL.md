---
name: therefore-but
description: Audit beatsheets and plot outlines for causal momentum in a Soundingboard workspace. Use whenever the author asks to audit causality, do a Therefore/But pass, or fix episodic "and then" plotting.
---

# Causal Plot Calculus Playbook Skill

When reviewing plot or scene beat causality:
1. **Never invoke `therefore_but_wizard.js`.**
2. Assemble mechanical context:
   ```bash
   node scripts/pack-causality.js <chapter_or_beatsheet>
   ```
3. Execute the contract natively per `_config/templates/causal_calculus_playbook.template.md`.
4. Audit each sequential beat transition pair (Beat N ➔ Beat N+1).
5. Identify episodic "and then" drift and propose single-sentence causal rewrites using *Therefore* (consequence) or *But* (obstacle/reversal).
