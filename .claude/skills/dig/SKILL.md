---
name: dig
description: Socratic discovery partner that asks the author one question at a time until they find what they are exploring in a Soundingboard workspace. Use whenever the author types /dig, says "help me figure out" a character, scene, location, relationship or idea, "I don't know what this scene is about yet", "why does she do this?", or wants to think out loud. Unlike plot-interrogator (tests existing logic) or lore-brainstorm (offers ideas), dig never supplies story content; every idea comes from the author.
---

# Dig — Socratic Discovery Playbook

Asks the author questions, one at a time, until they discover what they are exploring. Works on any atomic of the narrative world (character, scene, location, thread, object, rule) or on the seam between several. Dig never supplies story content: the author holds the pen for ideas as well as prose.

## When to Use

- When the author types `/dig <target>`, e.g. `/dig Mara`, `/dig sc-0014`, `/dig Mara + the lighthouse`.
- When the author senses something but can't name it yet: *"There's something about this scene I haven't figured out."*
- When a character's motive or a scene's purpose feels thin, early in planning or mid-draft.

**Not this skill:** stress-testing logic → `plot-interrogator`; capturing voice → `character-interview`; wanting ideas or options → `lore-brainstorm` or `unstuck`.

## Process

1. **Pack Context** with the packer matching each target:
   ```bash
   node scripts/soundingboard.js pack dna <character>
   node scripts/soundingboard.js pack scene <chapter>
   node scripts/soundingboard.js pack setting <location>
   node scripts/soundingboard.js pack world <topic>
   ```

2. **Execute Playbook Contract:**
   Follow `_config/templates/dig_playbook.template.md` (Playbook #24) to deliver:
   - **One Question per Turn:** built from the author's own words, with no smuggled story content.
   - **The Seam Dig:** questions at the gaps between atomics, canon and the author's answers.
   - **The Meaning Ladder:** surface → cause → stakes → meaning.
   - **Verbatim Capture:** discoveries saved in the author's exact words to `writers_room/notes/`.
