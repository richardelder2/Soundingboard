---
name: stage-scene
description: Plan scene staging, physical blocking, value shifts, and opening hooks in a Soundingboard workspace. Use whenever the author asks to stage a scene, set up chapter beats, or write opening hooks.
---

# Scene Staging Playbook Skill

When setting up or planning a scene or chapter:
1. **Never invoke `stage_scene_wizard.js`.**
2. Assemble mechanical context:
   ```bash
   node scripts/pack-stage-scene.js <chapter_number>
   ```
3. Execute the contract natively per `_config/templates/stage_scene_playbook.template.md`.
4. Establish the Inciting Incident, character desires, and emotional/dramatic value shift.
5. Provide 3 concrete sensory anchors, 3 distinct opening hook variations (Action, Introspection, Atmosphere), and a 5-commandment beat structure.
