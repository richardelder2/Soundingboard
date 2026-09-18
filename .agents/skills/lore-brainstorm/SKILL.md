---
name: lore-brainstorm
description: Brainstorm worldbuilding, sci-fi/magic systems, factions, and character secrets in a Soundingboard workspace. Use whenever the author asks to brainstorm lore, worldbuilding, or subplot elements.
---

# Lore & Worldbuilding Brainstorm Playbook Skill

When brainstorming lore or worldbuilding:
1. **Never invoke `brainstorm_wizard.js`.**
2. Assemble mechanical context:
   ```bash
   node scripts/pack-brainstorm.js [topic_or_keyword]
   ```
3. Execute the contract natively per `_config/templates/lore_brainstorm_playbook.template.md`.
4. Anchor lore directly in character conflict and sensory consequences rather than pure exposition.
5. Deliver a structured Brainstorm Card: Lore Summary, Secrets & Subtext, and 3 active Drafting Prompts (demonstrating the lore actively in scenes).
