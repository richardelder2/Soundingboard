# Git & Creative History Playbook (Playbook #21)

## When this applies
This playbook governs how the AI concierge collaborates with the author using Git across the creative lifecycle:
- When substantial writing or drafting has occurred.
- When a scene draft is completed (`sc-XXXX.md`).
- When a scene undergoes major prose revision.
- When multiple editorial brackets have been resolved.
- When narrative canon or lore entries are established or updated.
- When chapter playlists or scene orders are restructured.
- Before embarking on a risky creative experiment or branching out.
- Before running project-level migrations or updates.
- At the close of a creative writing session.
- When the author asks to checkpoint, commit, push, or inspect history.

---

## Foundational Principle: Files Hold Meaning, Git Records Evolution

> **"Soundingboard files contain the meaning. Git records the evolution."**

1. **The Author Holds the Steering Wheel:**
   - The author owns the creative work.
   - Commits and pushes are made **only when the author says to** or authorizes.
   - The agent never silently commits, silently pushes, or rewrites history without explicit author direction.
2. **File-First Architecture is Authoritative:**
   - Git is a historical lens over the workspace files, **not** a secondary database or competing source of truth.
   - Context lives directly in scene YAML frontmatter (`id`, `pov`, `value_in`/`value_out`, `commandments`, `threads`). Because context travels in the file, Git records its evolution automatically.
   - Scene identities (`sc-XXXX`) are atomic and permanent. Moving a scene from Chapter 8 to Chapter 11 modifies the playlist array in `manuscript/chapters/ch-XX.md`—it does **not** create a new scene.
3. **Tripartite Separation:**
   - **Deterministic Finding:** What a tool observes (e.g., 4 consecutive sentences of identical length).
   - **Agent Interpretation:** What that finding might mean (e.g., intentional rhythmic fixation vs. unintended monotony).
   - **Author Decision:** What the novelist chooses to do (e.g., `PRESERVE`, `CUT`, `REPHRASE`).
   - The manuscript stays verbatim unless the author explicitly edits it. Git records the progression of these files without conflating tool findings with author decisions.
4. **Separation of Technical Integrity from Creative Uncertainty:**
   - **Technical Integrity (Hard Gates):** Malformed YAML frontmatter, duplicate required scene IDs, or missing referenced scenes in playlists corrupt tools and compilers. These appropriately warn or block commits.
   - **Creative Uncertainty (Zero Gates):** Pacing issues, character motivation questions, rhythm monotony, or unresolved subplots are creative matters. They **never** block commits or pushes.
5. **Git Preserves the Messy History:**
   - Git is not an artificial publishing trophy case. It preserves experiments, false starts, rejected AI suggestions, and exploratory drafts.

---

## Context Assembly

Assemble the deterministic Git context pack:
```bash
node scripts/soundingboard.js pack git [base_ref]
```
This packs author Git preferences, repo branch status, creative diff analysis, technical integrity status, recent commits, and protocol instructions.

---

## Author Git Assistance Modes

Configured in `preferences.md` (`git_mode`):

| Mode | Behavior |
|---|---|
| **Quiet** | Zero proactive reminders. The agent never suggests committing or pushing unless explicitly commanded. |
| **Gentle** *(Default)* | The agent suggests checkpoints at natural creative milestones, explaining *why* preserving this moment is valuable. |
| **Guided** | The agent suggests checkpoints and provides a structured summary of changed scenes, moved scenes, brackets, and canon entries. |
| **Automatic** | Local checkpoint commits occur automatically at configured milestone events. Remote pushes remain separately gated. |

Remote push behavior is separately configured via `git_remote_push`: `ask` (default) | `manual` | `automatic`.

---

## Commit Taxonomy

The agent suggests concise, meaningful commit messages using this taxonomy:

1. **`checkpoint: <summary>`**
   - Preserves working state at the end of a session or mid-draft for peace of mind.
   - Example: `checkpoint: evening writing session on dock confrontation`
2. **`scene(<sc-id>): <action>`**
   - Creative milestone for scene draft completion or major overhaul.
   - Example: `scene(sc-0017): complete first draft of warehouse interrogation`
3. **`revision: <scope>`**
   - Editorial milestone when resolving brackets or addressing diagnostic findings.
   - Example: `revision: resolve Swain emotional sequence brackets in sc-0003`
4. **`experiment: <hypothesis>`**
   - Structural or narrative exploration, often on an experimental branch.
   - Example: `experiment: alternate Act II chapter playlist without Tam interlude`
5. **`milestone: <event>`**
   - Major macro achievements (Act complete, full draft finished, canon overhaul).
   - Example: `milestone: complete Act I scene pool and chapter playlists`

---

## The Commit & Push Protocols

### 1. The Commit Proposal Protocol

When a milestone is reached (in `gentle` or `guided` mode), the agent presents a warm, low-pressure proposal:

```text
Since your last checkpoint:
  • 1 scene revised: sc-0017 (prose expanded, value shift completed)
  • 3 editorial brackets resolved
  • 1 canon entry established: "Elena's Cipher Ring"

This looks like a great moment to preserve your current progress.
Suggested commit: revision: resolve sc-0017 editorial findings

Would you like me to:
  [1] Commit with this message
  [2] Review the diff details
  [3] Commit with a custom message
  [4] Keep writing without committing
```

### 2. The Push Proposal Protocol

Remote pushes are never executed silently without explicit configuration:

```text
Ready to push to remote repository.

  • Branch: main
  • Commits ready to push: 2 local commit(s)
  • Changes represented: sc-0017 completed, Chapter 2 playlist updated
  • Remote: origin (git@github.com:author/novel.git)

Would you like me to push these commits now?
```

### 3. Creative Branch Experiments

For narrative forks or structural overhauls:
1. Create branch: `git checkout -b experiment/alternate-ending`
2. Reorder scenes or test new beats freely.
3. Compare: `node scripts/soundingboard.js git compare main`
4. **The Rule of Merging:** Git detects textual differences; only the human author decides which creative direction is true. Merging is never an AI judgment.
