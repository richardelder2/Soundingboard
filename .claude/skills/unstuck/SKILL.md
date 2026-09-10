---
name: unstuck
description: Overcome writer's block, pacing drag, or scene deadlocks in a Soundingboard workspace. Use whenever the author says they are stuck, blocked, don't know what happens next, or asks for narrative forks forward.
---

# Getting Unstuck Playbook Skill

When the author is stuck or blocked on a chapter or scene:
1. **Never invoke `unstuck_wizard.js`.**
2. Assemble mechanical context:
   ```bash
   node scripts/pack-unstuck.js [chapter_number]
   ```
3. Execute the contract natively per `_config/templates/unstuck_playbook.template.md`.
4. Diagnose the specific roadblock (Pacing, Geography, Conflict, or Surprise).
5. Deliver exactly 3 distinct narrative forks (Option A, Option B, Option C), each with an evocative title, mechanism, and 2–3 lines of sample active prose.
