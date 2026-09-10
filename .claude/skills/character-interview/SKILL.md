---
name: character-interview
description: Interrogate characters to discover voice, dialect, and speech rules in a Soundboard workspace. Use whenever the author asks to interview a character, test character dialogue, or build a voice profile.
---

# Character Voice Interview Playbook Skill

When testing or discovering character voice:
1. **Never invoke `interview_wizard.js`.**
2. Assemble mechanical context:
   ```bash
   node scripts/pack-interview.js <character_name>
   ```
3. Execute the contract natively per `_config/templates/character_interview_playbook.template.md`.
4. Roleplay directly with the author for 3–4 interactive rounds staying strictly in character voice and status.
5. Synthesize a structured Stylistic Voice Profile (Sentence Architecture, Vocabulary/Dialect, Mannerisms/Tics) and offer to save it to the character sheet.
