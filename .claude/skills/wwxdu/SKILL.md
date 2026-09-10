---
name: wwxdu
description: Stress-test characters by dropping them into extreme or unexpected scenarios in a Soundboard workspace. Use whenever the author asks "what would X do if...", asks to drop-test a character, or test moral limits under pressure.
---

# WWXDU ("What Would X Do Unexpectedly") Playbook Skill

When stress-testing a character under pressure:
1. **Never invoke `wwxdu_wizard.js`.**
2. Assemble mechanical context:
   ```bash
   node scripts/pack-wwxdu.js <character_name>
   ```
3. Execute the contract natively per `_config/templates/wwxdu_playbook.template.md`.
4. Run 3–4 interactive rounds of scenario roleplay forcing difficult tactical and moral choices.
5. Compile a Scenario Logcard: Immediate Reaction & Reflex, Unexpected Decisions & Moral Pivots, and High-Impact Dialogue Hooks suitable for the novel.
