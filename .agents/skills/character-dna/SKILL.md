---
name: character-dna
description: Forge complex, multi-layered characters by deconstructing and combining traits from famous fictional characters, historical figures, or real-world personas in a Soundingboard workspace. Use whenever the author wants to design a character using "X meets Y", famous archetypes, or real-person inspirations.
---

# Character DNA Playbook Skill

When creating or fleshing out a character from a composite of other characters or people:
1. Assemble mechanical context:
   ```bash
   node scripts/pack-character-dna.js [character_name]
   ```
2. Execute the contract natively per `_config/templates/character_dna_playbook.template.md`.
3. Harvest 3 distinct donor registers:
   - Donor 1: Cadence & Status (speech rhythm, tempo, dialogue posture).
   - Donor 2: Psychological Wound & Moral Lie (internal engine, trauma defense).
   - Donor 3: Somatic / Real-Person Quirk (eccentric physical habit, non-verbal tell).
4. Engineer the internal **contradiction** where Donor 1 and Donor 2 clash (anti-AI friction).
5. Transmute modern/external references into the novel's world rules and vocabulary.
6. Synthesize the complete character profile directly into `stages/01_onboarding/output/characters/<name>.md`.
