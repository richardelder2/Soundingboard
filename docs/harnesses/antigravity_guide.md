# Google Antigravity — Author & Agent Quick-Start Guide (v2.2 LTS)

**Harness Type:** Dual-Pane IDE & Agent Canvas  
**In-Repo Configuration:** `.agents/` (`rules/`, `skills/`, `hooks.json`), `GEMINI.md`, `AGENTS.md`

Google Antigravity is a multimodal agentic coding and creative environment designed by Google Deepmind. In Soundingboard v2.2, Antigravity functions as a tier-1 reference author harness: **100% of the studio setup is contained directly in the repository**.

---

## 1. Zero-Friction Setup (Under 2 Minutes)

Because Soundingboard v2.2 ships with in-repo `.agents/` configuration, you no longer need to manually install global skills or rules:

1. **Open Workspace:** Open the Soundingboard project root in Antigravity.
2. **Trust the Folder:** When prompted, click **Trust Folder** to enable repository lifecycle hooks.
3. **Security Preset:** Select **Default** or **Strict** (never Turbo).
   - Review Policy: *Request Review* on external modifications.
   - Terminal: Auto-allows `node scripts/soundingboard.js`.
   - Browser Access: Disabled unless doing historical research.
4. **Start Writing:** All rules, skills, slash commands, and Red Pen safety hooks are instantly active.

---

## 2. In-Repo Skills as First-Class Slash Commands

In Antigravity, all skills in `.agents/skills/` automatically mount as slash commands in the chat box:

| Command | Purpose |
|---|---|
| `/dig [target]` | Socratic discovery partner (Playbook #24) — asks one question at a time with zero smuggled ideas. |
| `/unstuck [chapter]` | Creative troubleshooting when facing plot blocks or writer's fatigue. |
| `/dialogue-heat [chars]` | Escalates transactional subtext and emotional stakes in conversations. |
| `/sensory-bloom [loc]` | Expands sensory grounding and atmosphere across 5 sensory registers. |
| `/stage-scene [ch]` | Choreographs micro-scene objectives, obstacles, and entry vectors. |
| `/character-interview [char]` | Explores character psychology and voice through guided dialogue. |
| `/plot-interrogator [file]` | Adversarial stress-testing of causal logic and fair-play clues. |
| `/blind-reader [scene]` | Simulates first-time reader reactions and cognitive load. |

To resynchronize skills between `.claude/` and `.agents/`, run backstage:
```bash
node scripts/soundingboard.js sync-skills
```

---

## 3. Mechanical Red Pen Enforcement

In Soundingboard, **the human author always holds the red pen**. In v2.2, this is not just a prompt instruction—it is mechanically enforced by Antigravity lifecycle hooks (`.agents/hooks.json`):

- **PreToolUse Interception:** Every file edit (`write_to_file`, `replace_file_content`) and shell command (`run_command`) is evaluated by `scripts/redpen.js`.
- **The Bracket Invariant:** The engine strips all `[...]` bracket tags from both the existing text and the proposed edit. If the author's original words are unchanged, the edit is recognized as a diagnostic recommendation. If words were altered or deleted outside brackets, the edit is intercepted.
- **Mode Calibration (`preferences.md`):**
  - **Solo Mode:** All edits to protected paths (`manuscript/`, `writers_room/`) prompt for author approval (`ask`).
  - **Hybrid Mode:** Bracket-only suggestions pass automatically (`allow`); word changes prompt for approval (`ask`).
  - **Generative Mode:** Bracket edits and new draft files pass automatically (`allow`); changes to existing author prose prompt for approval (`ask`).

---

## 4. Conversation Provenance & Session Capture

Every creative session with Antigravity is recorded in the project's `conversations/` directory:

- **Automatic Capture:** When your session finishes or pauses, Antigravity's `Stop` lifecycle hook triggers `soundingboard capture` backstage.
- **High-Contrast Markdown Styling:**
  - **Author:** Flush-left `### ✍️ Author · HH:MM` in high-contrast clean prose.
  - **Agent:** Indented blockquote `> ### 🤖 Concierge · HH:MM`.
  - **Red Pen Audits:** Compact docked badges `> 🛡️ **Red Pen Event:** ...`.
- **Publisher & Copyright Ready:** Transcripts are scrubbed of API keys, model thinking chains, and token slop, creating a pristine authorship record ready for publishers, contests, or copyright offices.

---

## 5. Dual-Pane Creative Workflow

- **Left Pane (The Canvas):** The active file editor where scenes (`manuscript/scenes/sc-0001.md`), outlines (`structure_plan.md`), and notes (`writers_room/notes/`) are displayed with live diff reviews.
- **Right Pane (The Chat & Console):** Where you interact with your Creative Concierge. The agent runs mechanical tools backstage and presents narrative guidance in warm, craft-oriented dialogue.

---

## 6. Subagent Delegation for Novelists

Antigravity can spawn specialized background subagents using `invoke_subagent`:
- **Historical / Worldbuilding Research:** Dispatch background subagents to search archives or draft encyclopedic lore while you continue drafting in the main chat.
- **Parallel Diagnostics:** Run cadence audits or continuity checks on prior chapters in the background without interrupting your current creative flow.
