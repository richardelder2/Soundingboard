# Soundingboard v2.0.0 Release Notes
**Release Date:** September 15, 2026  
**Codename:** *The Sovereign Author*  
**Compatibility:** Node.js $\ge$ 18.0.0 (Zero external runtime dependencies)

---

## Welcome to Soundingboard 2.0

Soundingboard 2.0 is a complete architectural and philosophical reimagining of the novel engineering console. 

Most writing tools and AI assistants suffer from two fatal flaws: they try to force novelists into rigid, linear conveyor belts, and they treat AI as a "ghostwriter" that flattens prose, homogenizes voice, and executes black-box rewrites.

**Soundingboard 2.0 inverts this relationship completely.**

> **The author is the novelist. The system bends to the author, never the author to the system.**  
> **The human author always holds the red pen. The AI never unilaterally rewrites author prose.**

Whether you draft in **Obsidian**, **Scrivener**, **Microsoft Word**, **iA Writer**, or raw markdown, Soundingboard serves as your **Executive Novel Assistant, Master Librarian, Continuity Sentry, and Diagnostic Partner**—protecting your voice, guarding your continuity, and organizing your manuscript at your pace.

---

## Major Highlights & New Features

### 1. The Writer's Room & Inviolable Immunity Shield (`writers_room/`)
- **Creative Sandbox:** A dedicated space partitioned into `writers_room/notes/`, `writers_room/beats/`, `writers_room/drafts/`, and `writers_room/inputs/`.
- **The Immunity Shield:** Automated linters, diagnostic scans, continuity checkers, and test runners **strictly ignore** `writers_room/`. You can brainstorm half-formed ideas, jot bullet fragments, and draft messy first takes without automated nag screens or red ink.
- **On-Demand Assistance:** Linters and diagnostics only inspect raw drafts when you explicitly invoke them by file path.

### 2. Scene-Atomic Architecture & Flexible Chapter Playlists
- **The Scene as Dramatic Quantum:** All graduated scenes live in a flat, unified pool (`manuscript/scenes/sc-XXXX.md`). You can write your climax first, jump to an argument in Act II, or draft standalone vignettes.
- **Floating & Unassigned Scenes:** Scenes do not require immediate chapter assignment. Unassigned scenes remain fully indexed, audited, and valid in your story model.
- **Chapter Assembly Playlists (`manuscript/chapters/ch-XX.md`):** Chapters are decoupled from file hierarchies. A chapter is a flexible playlist referencing scenes in reading order, complete with an authored `break_rationale`.
- **Lossless Derived Caching:** `manuscript.json` is a purely derived cache rebuilt losslessly via `node scripts/soundingboard.js reindex`. Markdown files remain the sole ground truth.

### 3. Multi-Pathway Frontmatter Assistance & Scene Graduation (Playbook #19)
- **Zero Frontmatter Overhead:** Drafting in the Writer's Room requires zero YAML.
- **Three Graduation Pathways:** When you are ready to graduate a draft to the manuscript pool:
  - **Path 1 (AI Inference):** The assistant reads your draft and proposes POV, location, value shifts, and five commandments for your approval.
  - **Path 2 (Author Scaffold):** The assistant injects a clean frontmatter template with in-world suggestions from your bible and threads commented inline.
  - **Path 3 (Conversational Discovery):** The assistant interviews you in chat about the turning point and dramatic stakes, then generates the block.
- **CLI Graduation:** Run `node scripts/soundingboard.js graduate <draft-path>` to automatically assign a canonical `sc-XXXX` ID, index the scene, and harvest new proper nouns into `canon.md`.

### 4. The Bracket Method & The Linter Bracket Workflow (Playbooks #18 & #20)
- **Elimination of Black-Box Rewrites:** The assistant will **never** perform silent or wholesale rewrites of your prose to clear a linter warning or satisfy an audit.
- **The Bracket Workflow:** Stylistic diagnostics, AI tell scans, and rhythm variance checks quarantine suggestions in bracketed annotations (`[AI-TELL: ...]`, `[CADENCE: ...]`) alongside your verbatim prose, providing 3 clear choices:
  1. *Cut* the friction.
  2. *Rephrase* using 2–3 voice-preserving options.
  3. *Keep* as intentional author voice.

### 5. Root Author Preferences Profile (`preferences.md`)
- A centralized profile at workspace root establishing your working rhythm:
  - `working_mode`: `solo` (100% human prose; AI is Librarian/Sentry), `hybrid` (collaborative beat brainstorms), or `agentic` (explicit on-demand drafting).
  - `primary_editor`: `obsidian`, `word`, `scrivener`, `ia_writer`, or `any`.
  - `ai_prose_generation`: `"never"` (default for solo), `"on_demand"`, or `"collaborative"`.
  - `editorial_style`: `"bracket_options"`, `"coaching_notes"`, or `"minimalist"`.
  - `tell_tolerance`: `strict`, `moderate`, or `permissive`.

### 6. Sub-500ms Diagnostics & Narrative Authenticity Engine
- **Scene-Scoped Scans (`soundingboard audit`):** Analyzes scenes in milliseconds for lexical tell density (normalized per 1,000 words), sentence rhythm variance (preventing monotone pacing), and emotional mode progression.
- **Chapter-Scoped Audits (`soundingboard chapter-audit`):** Evaluates multi-scene cadence shifts and tests the efficacy of chapter breaks against the authored `break_rationale`.
- **Commandments Advisory Audit (`soundingboard commandments`):** Advises on Shawn Coyne's 5 Commandments of Storytelling (Inciting Incident, Progressive Complication, Crisis Question, Climax, Resolution).
- **Voice Anchors:** Enforces same-POV voice anchor resolution so scene tone matches established character perspectives.

### 7. Thread Diagnostics & Interactive Lane Visualizer
- **Subplot Health (`soundingboard threads`):** Tracks character arcs, mystery spines, and relationship subplots.
- **Orphan Guard:** Detects and flags scenes that lack narrative thread linkage.
- **Dormancy Tracker:** Monitors cumulative word counts between thread appearances to eliminate forgotten subplots.
- **Visualizer (Terminal + HTML):** Generates instant ASCII thread timelines in the terminal and a zero-dependency, interactive HTML dashboard (`thread_lanes.html`) with SVG trajectory lanes and multi-thread braid points.

### 8. Cascading Canon 2.0 & Decision Queues (`soundingboard canon`)
- **Epistemic Provenance Tracking:** Links world facts to the exact scene that establishes them.
- **Spoiler Threshold Guard:** Suppresses future lore when drafting or auditing earlier scenes.
- **Three Epistemic Gap Queues:**
  - *Orphaned Facts Queue:* Identifies canon entries whose establishing scene was cut.
  - *Unbound Entities Queue:* Detects recurring proper nouns in prose not yet recorded in canon.
  - *Unverified Queue:* Tracks draft-harvested entities pending author verification.

### 9. Multi-Tier Manuscript Publishing Compiler (`soundingboard compile`)
- **Flexible Assembler:** Compiles chapter playlists and flat scenes into clean, publication-grade output.
- **Configurable Scene Dividers:** Supports customizable break glyphs (`--break="***"`, `--break=blank`, `--break=line`, `--break="~ ~ ~"`).
- **Multi-Format Export:** Emits semantic, typographically styled HTML out of the box, with automated EPUB and Microsoft Word (`.docx`) exports via Pandoc.
- **Fail-Loud Verification:** Instantly halts with descriptive errors if a referenced scene is missing from disk.

### 10. Soundingboard Model Health Console & Doctor
- **Health Console (`soundingboard status`):** Real-time telemetry dashboard covering chapter inventories, missing rationales, null value shifts, provisional voice anchors, and diagnostic SHA-256 staleness.
- **Concierge Auto-Healing (`soundingboard doctor --fix`):** Verifies Node environment, path tracking, directory structures, and git health backstage.
- **Cold-Start Briefing (`soundingboard brief`):** Dense context packet providing immediate orientation for AI craft partners without context bloat.

### 11. OKF Craft Card Knowledge Base
- **118 Standardized Craft Modules:** Comprehensive craft wisdom spanning Story Grid, Save the Cat!, Truby, and Sanderson.
- **Structural Scopes:** Categorized into `scene`, `chapter`, `manuscript`, and `sentence` scopes.
- **Instant Search:** `soundingboard craft search <query> [--scope=...] [--genre=...]`.

### 12. Git Playbook & Creative History (`soundingboard git`, Playbook #21)
- **The Sovereign Author Rule:** *Soundingboard files contain the meaning. Git records the evolution.*
- **Git as a Transparent Historical Layer:** Git is an open historical record over your file-first workspace, never a competing database.
- **Author Ownership & Control:** Commits and pushes occur **only when the author says to** or authorizes. The AI never commits or pushes behind your back.
- **Author Git Modes (`preferences.md`):** Choose between `gentle` (default, milestone suggestions with rationale), `quiet` (no prompts), `guided` (full diff summaries), and `automatic`. Remote pushes are separately controlled (`ask` by default).
- **Separation of Technical Integrity from Creative Uncertainty:** Malformed YAML, duplicate scene IDs, and broken references warn/block to protect the workspace, while creative critiques (pacing, AI tells, motivations) **never** block commits or pushes.
- **Stable Scene Identity:** Moving scenes between chapters alters playlist arrays in `manuscript/chapters/ch-XX.md`; scene files (`manuscript/scenes/sc-XXXX.md`) and their YAML context remain unbroken.
- **Context Packer & Tooling:** Dedicated commands for status (`soundingboard git status`), integrity check (`soundingboard git verify`), checkpoints (`soundingboard git checkpoint`), remote checks (`soundingboard git push-check`), branch experiment comparisons (`soundingboard git compare`), and context packing (`soundingboard pack git`).

---

## Zero Runtime Dependencies

Soundingboard 2.0 maintains a strict **zero runtime dependency** standard (`dependencies: {}` in `package.json`). Everything runs purely on native Node.js 18+ built-ins (`fs`, `path`, `crypto`, `child_process`).

---

## Quick Reference CLI Cheatsheet

| Task | Command |
|---|---|
| Initialize workspace | `node scripts/soundingboard.js init [dir] [--form]` |
| Model Health console | `node scripts/soundingboard.js status` |
| Fast context brief | `node scripts/soundingboard.js brief` |
| Creative history & Git | `node scripts/soundingboard.js git status` |
| Rebuild index cache | `node scripts/soundingboard.js reindex` |
| Graduate a draft | `node scripts/soundingboard.js graduate <file>` |
| Scan scene for AI tells | `node scripts/soundingboard.js audit [file]` |
| Audit chapter cadence | `node scripts/soundingboard.js chapter-audit [ch]` |
| Audit 5 commandments | `node scripts/soundingboard.js commandments [sc|ch]` |
| Check thread subplots | `node scripts/soundingboard.js threads [--view]` |
| Query canon & queues | `node scripts/soundingboard.js canon query "<q>"` / `check` |
| Compile manuscript | `node scripts/soundingboard.js compile [--epub] [--docx]` |
| Environment health | `node scripts/soundingboard.js doctor [--fix]` |
| Search craft cards | `node scripts/soundingboard.js craft search "<query>"` |

---

## Upgrade Guide from 1.x

Upgrading from Soundingboard 1.x is automatic and non-destructive:
1. **Existing Projects:** Legacy chapter directories (`manuscript/ch-01/sc-0001.md`) continue to be indexed and compiled seamlessly.
2. **Opt-In Flat Pool:** To migrate to the 2.0 playlist model, simply run `node scripts/soundingboard.js reindex`.
3. **Preferences:** Create or seed a root `preferences.md` file to configure your working mode.
