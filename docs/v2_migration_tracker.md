# Soundingboard 2.0.0 — Cross-Conversation Master Migration Tracker

**Location:** `docs/v2_migration_tracker.md`  
**Purpose:** Permanent coordination ledger for Soundingboard 2.0.0 development. Any agent (Antigravity, Claude Code, Gemini CLI, etc.) in any conversation session must consult this file first to resume implementation without context loss.  
**Companion Specs (Archived in repo):**
- PRD: [`docs/v2_specs/soundingboard-v2-prd.md`](file:///c:/Users/richa/soundingboard/docs/v2_specs/soundingboard-v2-prd.md)
- Implementation Brief: [`docs/v2_specs/soundingboard-v2-implementation-brief.md`](file:///c:/Users/richa/soundingboard/docs/v2_specs/soundingboard-v2-implementation-brief.md)
- The Bracket Method: [`docs/v2_specs/bracket_method.md`](file:///c:/Users/richa/soundingboard/docs/v2_specs/bracket_method.md)

---

## 0. Instructions for Incoming Agents (Cold Start Protocol)

When resuming this migration in a new conversation:
1. **Read this file** (`docs/v2_migration_tracker.md`) to understand the current phase and progress.
2. **Verify current repo integrity**: Run `node tests/run_tests.js`. Ensure all existing automated tests pass before touching code.
3. **Check the active phase**: Locate the first task marked `[ ]` (Pending) or `[/]` (In Progress).
4. **Execute strictly one task at a time**: Follow the acceptance criteria in this document.
5. **Verify task acceptance**: Run tests and linting (`npm test`, `npm run typecheck`, etc.).
6. **Update this ledger**: Check off the completed task (`[x]`), log your session in the Session Progress Log at the bottom, and commit changes if git is clean.
7. **Report coverage honestly**: Always report what you tested and what was left unexamined.

---

## 1. Locked Architectural Invariants & Decisions

These decisions have been author-approved and must NOT be altered or second-guessed:

1. **Atomic Resolution:** The **scene** is the atomic narrative unit. Markdown frontmatter is the single source of truth (`manuscript/ch-XX/sc-YYYY.md`). `manuscript.json` is a derived index/cache that can be deleted and rebuilt at any time via `scripts/reindex.js`.
2. **Presentation Layer:** The **chapter** is a presentation assembly (`manuscript/ch-XX/chapter.md`) holding an ordered list of scene IDs and a mandatory, human-authored `break_rationale`.
3. **Thread Storage (Option A):** Lives at [`stages/02_planning/output/threads.md`](file:///c:/Users/richa/soundingboard/stages/02_planning/output/threads.md). Scenes link to threads via `threads: [th-01, ...]`.
4. **Migration Spine Default:** When migrating 1.x projects, the migration engine automatically assigns all existing scenes to `th-01: Main Story (Spine)` in `threads.md` to guarantee 100% thread coverage out of the box.
5. **Chapter Decomposition & Interactive Break Finder:**
   - Scene splits are detected automatically via break markers (`***`, `#`, `---`, 2+ blank lines).
   - If markers are absent or confidence is low, the engine **surfaces the chapter directly to the author** with paragraph summaries to interactively place breaks or explicitly confirm a single continuous scene.
   - Concatenation check: scene bodies must match original chapter prose byte-for-byte.
6. **The Coyne Beat as Atomic Evaluative Quantum:**
   - While the **Scene** is the atomic unit for storage and drafting (preventing outlining paralysis), Shawn Coyne's **Beat** (the action/reaction pair and Swain MRU) is the **atomic unit for diagnostic evaluation**.
   - **Stage 02 Evaluation:** Evaluates scene cards for kinetic beat potential (opposing tactics, clear dilemma, Action vs. Revelation turning point).
   - **Stage 04 Evaluation:** Audits drafted scenes at the beat level to identify stagnant dialogue, missing value shifts, and broken stimulus-reaction chains.
   - **The Bracket Method Bridge:** The Bracket Method operates directly on Coyne micro-beats to reorder and tighten cause-and-effect flow.
7. **The Bracket Method:** Added as a core creative playbook (`_config/templates/bracket_method_playbook.template.md`), CLI packer (`node scripts/soundingboard.js pack bracket <scene>`), and OKF craft card. Preserves author prose verbatim with structured bracket tags (`[PRESERVE]`, `[CUT]`, `[REORDER]`, `[STRUCTURAL NOTE: ...]`, `[DRAFT SUGGESTION: ...]`) and Swain emotional sequencing.
8. **Canon 2.0:** Provenance tracking (`established_in`, `computed_against`), epistemic status (`established`, `believed`, `contested`, `ambiguous`), and `reader_known_as_of` to prevent mystery spoiler leaks during early drafting.
9. **Commandment Audits:** Semantic extraction of commandments from draft prose compared against Stage 02 scene card intent. Findings are **purely advisory** in the Revision Playbook (author decides discovery vs. structural drift).
10. **Runtime Dependencies:** Zero runtime dependencies (`"dependencies": {}` remains strictly empty). Node $\ge 18$ built-ins only. `typescript` is strictly a `devDependency` for JSDoc type checking (`npm run typecheck`).

---

## 2. Master Implementation Checklist

### Phase 0: Universal Storage, Parser & Migration Engine
*Goal: Zero writer-facing changes yet. Engine becomes robust, typed, and capable of handling scenes, threads, and decomposition.*

- [x] **SB2-P0-01: Universal Frontmatter Module (`scripts/frontmatter.js`)**
  - Exports `parse(text)`, `stringify(data, body)`, `strip(text)`, `split(text)`.
  - Supports scalars, quoted scalars, folded block scalars (`>`), literal scalars (`|`), flow sequences (`[a, b]`), one-level nested maps (`commandments:`), and `null`.
  - Throws typed, descriptive syntax errors with line numbers on unsupported YAML.
  - Replaces all 6 ad-hoc implementations across `compile_manuscript.js`, `continuity_scan.js`, `manuscript_report.js`, `narrative_audit.js`, and `soundingboard.js`.
  - *Acceptance:* `node tests/frontmatter.test.js` passes; round-trips PRD §5.2 scene & §5.3 chapter byte-for-byte; `grep -c "stripFrontmatter" scripts/*.js` equals 0 outside `frontmatter.js`.

- [x] **SB2-P0-02: JSDoc Record Types (`scripts/types.js`)**
  - Type definitions for `SceneRecord`, `ChapterRecord`, `ThreadRecord`, `CanonEntry`, and `ManuscriptIndex`.
  - Nullable fields typed as nullable (`value_in`, `value_out`, `voice_anchor`, `commandments` subkeys).
  - *Acceptance:* Referenced across scripts without type errors.

- [x] **SB2-P0-03: Monotonic ID Allocator (`scripts/id_allocator.js`)**
  - Centralized monotonic ID allocation: `sc-NNNN` (scanning `manuscript/` tree high-water mark), `th-NN` (`threads.md`), `e-NNNN` (`canon.md`). Never reissues or renumbers IDs.
  - *Acceptance:* Allocator handles empty trees, trees with gaps, and deleted highest IDs correctly.

- [x] **SB2-P0-04: Derived Reindexer (`scripts/reindex.js`)**
  - Scans `manuscript/` tree and regenerates `manuscript.json` purely from file frontmatter.
  - *Acceptance:* On fixture project: `rm manuscript.json && node scripts/soundingboard.js reindex` restores byte-identical file.

- [x] **SB2-P0-05: Hashing & Staleness Engine (`scripts/hash_staleness.js`)**
  - Direct SHA-256 content hashing via `node:crypto` for scene prose.
  - `computed_against` maps scene IDs to hashes. Marks diagnostic findings stale on edits without auto-rerunning.
  - *Acceptance:* Cosmetic edit to one scene marks only that scene's findings stale; never sibling scenes or parent chapter.

- [x] **SB2-P0-06: Concurrency Guard & Migration Gate**
  - Scene writes verify content hash before writing and refuse stale writes.
  - Commands check `unit_type` / schema in `manuscript.json`; if 1.x chapter model, directs agent to migrate first.
  - *Acceptance:* Write against stale hash exits non-zero without clobbering disk. Unmigrated fixture prompts migration.

- [x] **SB2-P0-07: TypeScript DevDependency & Typecheck Command**
  - Add `typescript` to `devDependencies`. Add `tsconfig.json` (`allowJs: true`, `checkJs: true`, `noEmit: true`, `strict: true`).
  - Add `"typecheck": "tsc --noEmit"` to package scripts.
  - *Acceptance:* `npm run typecheck` passes cleanly with zero errors. Fresh clone with no `npm install` still runs CLI smoothly.

- [x] **SB2-P0-08: Runtime Node >= 18 Preflight**
  - Preflight version check in CLI entry that exits with a friendly message if Node < 18 before dynamic ESM imports.
  - *Acceptance:* Simulated old Node version displays clear upgrade guidance without stack traces.

- [x] **SB2-P0-09: Chapter Decomposition & Migration Tool (`scripts/migrate_to_scenes.js`)**
  - Unconditional backup to `manuscript.pre-scene/`.
  - Heuristic break detection + Author-Guided Break Finder for unmarked chapters.
  - Generates `manuscript/ch-XX/sc-YYYY.md`, `manuscript/ch-XX/chapter.md`, `threads.md` (with spine `th-01`), and upgraded `canon.md`.
  - Byte-for-byte concatenation parity test against original chapter prose.
  - Reindexes and reports null fields and unwritten break rationales.
  - *Acceptance:* On fixture manuscript, 0 bytes altered in concatenated prose; backup exists prior to any writes.

- [x] **SB2-P0-10: 1.x Git Maintenance Branch**
  - Tag/branch `1.x` from pre-migration state for authors who want to stay on 1.x.

---

### Phase 1: Planning, Blueprints & Drafting Desk
*Goal: Creative desk unlocks scene-level planning, thread braiding, POV-anchoring, and The Bracket Method.*

- [x] **SB2-P1-01: Scene Card & Template Overhaul**
  - Replace `scene_beat.template.md` with `scene_card.template.md` (PRD §5.2).
  - Add `chapter.template.md` with mandatory `break_rationale` (PRD §5.3).
  - Update `threads.template.md` with acts, value spectrum, dormancy threshold, and spine flag.
  - Update `canon.template.md` with provenance, epistemic status, and `reader_known_as_of`.
  - Update `manuscript.template.json` to `unit_type: "scene"`.
  - *Acceptance:* All templates parse cleanly with `scripts/frontmatter.js`. (Verified by `tests/template_parse.test.js`)

- [x] **SB2-P1-02: Chapter Assembly & Break Rationale Enforcement**
  - Stage 02 enforces chapter grouping and `break_rationale`. Absence is a Stage 02 completeness failure, not a warning.
  - *Acceptance:* Reindex or audit flags any chapter missing `break_rationale` as incomplete. (Verified by `tests/break_rationale.test.js`)

- [x] **SB2-P1-03: Scene-Scoped Drafting Packet (`pack-scene`)**
  - Builds trimmed drafting kit ($\le 6,000$ tokens): scene card, matched canon entities (respecting `reader_known_as_of`), voice anchor, and targeted craft cards.
  - *Acceptance:* `node scripts/soundingboard.js pack scene <sc-id>` outputs complete packet within token budget. (Verified by `tests/pack_scene.test.js`)

- [x] **SB2-P1-04: Same-POV Anchor Resolution Engine**
  - Resolves voice anchor by walking back for the most recent drafted scene sharing the **same POV**.
  - Falls back to Stage 01 voice sample with `anchor_provisional: true` if none exists. Falls back to sequence order if POV is flagged shifting.
  - *Acceptance:* Regression test: chapter opening in POV B after chapter closing in POV A anchors to earlier POV B scene, not POV A trailing words. (Verified by `tests/anchor_resolver.test.js`)

- [x] **SB2-P1-05: Obligatory Scene Ledger Mapping to Scene IDs**
  - Obligatory trope scenes in `structure_plan.md` map to `sc-NNNN` rather than chapter numbers.
  - *Acceptance:* Stage 02 validation verifies all obligatory beats have assigned scene IDs. (Verified by `tests/structure_validator.test.js`)

- [x] **SB2-P1-06: Blueprints & Ingest Pipeline Updates**
  - Update 28 blueprints in `setup/` for scene density and POV structure in Stage 6.
  - Update `scripts/ingest.js` to support ongoing scene decomposition for files dropped into `inputs/drafts/`.
  - *Acceptance:* Ingesting a multi-scene file creates clean `sc-NNNN.md` scene files and `chapter.md`. (Verified by `tests/ingest_scenes.test.js`)

- [x] **SB2-P1-07: The Bracket Method Playbook & Tooling**
  - Create `_config/templates/bracket_method_playbook.template.md`.
  - Create `_config/okf_craft/the_bracket_method_developmental_editing.md`.
  - Implement `node scripts/soundingboard.js pack bracket <scene_or_file>`.
  - *Acceptance:* Running `pack bracket` outputs scene context with structural cause-and-effect outline and bracket taxonomy template. (Verified by `tests/bracket_method.test.js` & `okf-lint`)

---

### Phase 2: Diagnostics, Thread Sentry & Canon 2.0
*Goal: Audits split cleanly along context seams; subplots and canon gain real-time health checks.*

- [x] **SB2-P2-01: Scene-Scoped Audits**
  - Scopes continuity scan (`scripts/continuity_scan.js`) to canon + 1 scene (no craft modules, no cadence).
  - Scopes AI-tell scan (`scripts/narrative_audit.js`) to scene prose + in-world allowlist (no canon).
  - *Acceptance:* Scene audit runs in $< 500$ms with findings tagged with specific `scene_id`. (Verified by `tests/scene_audit.test.js`)

- [x] **SB2-P2-02: Chapter-Scoped Audits**
  - Cadence and rhythm analysis evaluates multi-scene variance across chapter (`scripts/chapter_audit.js`).
  - Break efficacy audit compares chapter ending against authored `break_rationale`.
  - *Acceptance:* Audit reports cadence variance across scenes and validates break delivery. (Verified by `tests/chapter_audit.test.js`)

- [x] **SB2-P2-03: Commandment Advisory Audit**
  - Evaluates derived scene commandments against Stage 02 scene card intent (`scripts/commandment_audit.js`).
  - Surfaces divergences as advisory creative options in Revision Playbook.
  - *Acceptance:* Audit outputs side-by-side comparison without failing machine gate. (Verified by `tests/commandment_audit.test.js`)

- [x] **SB2-P2-04: Honest Coverage Reporting on Every Pass**
  - Every diagnostic pass reports: scenes examined, scenes skipped, null value shifts, and undrafted scenes (`scripts/coverage_reporter.js`).
  - *Acceptance:* Test fixture with 4 drafted scenes and 2 undrafted scenes explicitly reports both counts in audit output. (Verified by `tests/scene_audit.test.js` & `tests/chapter_audit.test.js`)

- [x] **SB2-P2-05: Thread Diagnostics Suite (`scripts/threads.js`)**
  - Polarity turn detection (warns if thread value polarity never shifts).
  - Dormancy Sentry: flags subplots silent for $> N$ words (word-count based).
  - Orphan Guard: hard error on any scene bound to zero threads.
  - ASCII Thread Lane View: terminal visualization of thread trajectories and braid points.
  - *Acceptance:* Dormancy warning triggers when word count gap exceeds threshold. Orphaned scene triggers non-zero exit. (Verified by `tests/threads.test.js`)

- [x] **SB2-P2-06: Canon 2.0 & Decision Queues (`scripts/canon.js`)**
  - Provenance validation: checks that `established_in` scenes still exist.
  - Gap queues: surfaces Unbound, Orphaned, and Absent facts with HITL decision menus.
  - Spoiler guard: suppresses facts where `reader_known_as_of > current_scene`.
  - *Acceptance:* Facts marked `reader_known_as_of: sc-0030` are omitted from continuity checks on `sc-0010`. (Verified by `tests/canon.test.js`)

---

### Phase 3: Publishing, Visualizations & Studio Console
*Goal: Publishing compiler, Thread Lane Visualizer, craft card metadata, and documentation.*

- [x] **SB2-P3-01: Multi-Tier Manuscript Compiler (`scripts/compile_manuscript.js`)**
  - Compiles scenes $\rightarrow$ chapters $\rightarrow$ HTML/EPUB.
  - Configurable scene break glyphs (`***`, blank line, none).
  - Fail-loud verification: halts immediately if any scene in a chapter is missing or undrafted.
  - *Acceptance:* Missing scene throws clear compilation error; full manuscript compiles byte-clean HTML. (Verified by `tests/compile_manuscript.test.js`)

- [x] **SB2-P3-02: Thread Lane Visualizer (`scripts/thread_visualizer.js`)**
  - Terminal ASCII chart for instant chat feedback.
  - Standalone zero-dependency HTML lane view with polarity trajectories and word-count X-axis.
  - *Acceptance:* `node scripts/soundingboard.js threads --view` generates valid ASCII and HTML views. (Verified by `tests/thread_visualizer.test.js`)

- [ ] **SB2-P3-03: Scope Metadata on 119 OKF Craft Cards**
  - Add `scope: scene | chapter | manuscript` frontmatter to all craft cards in `_config/okf_craft/`.
  - *Acceptance:* `node scripts/soundingboard.js okf-lint` passes and verifies `scope` on all cards.

- [ ] **SB2-P3-04: Model Health Console & Doctor Extensions**
  - Extend `scripts/doctor.js` and `soundingboard status` to report model health (stale hashes, null value shifts, unwritten break rationales, thread dormancy).
  - *Acceptance:* `node scripts/soundingboard.js status` outputs comprehensive 2.0 health metrics.

- [ ] **SB2-P3-05: Documentation & Canonical Agent Instructions**
  - Update `AGENTS.md` with 2.0 atomic scene principles, Playbook #18 (The Bracket Method), and derived index rules.
  - Reduce `CLAUDE.md` and `GEMINI.md` to thin pointers.
  - Rewrite `README.md`, `docs/architecture.md`, and `docs/methodology.md`.
  - Reconcile command references to use `node scripts/soundingboard.js ...`.
  - *Acceptance:* Zero broken links; all automated documentation checks pass.

---

## 3. Session Progress Log

| Date | Agent / Session | Phase & Tasks Executed | Verification / Outcome | Next Step |
|---|---|---|---|---|
| 2026-09-13 | Antigravity (Initial Architecture) | V2 Specs preservation, architectural alignment, master tracker initialization | All 3 specs saved to `docs/v2_specs/`; 88/88 existing tests passing | Ready to begin Phase 0 |
| 2026-09-13 | Antigravity (Phase 0 Execution) | Phase 0 completed (SB2-P0-01 through SB2-P0-10): frontmatter parser, JSDoc types, typecheck, monotonic ID allocator, derived reindex, SHA-256 staleness, concurrency guard, Node >= 18 preflight, migration tool, 1.x branch | 88/88 main tests pass; 7 new test suites pass; 0 typescript errors | Ready to begin Phase 1 (`SB2-P1-01`) |
| 2026-09-13 | Antigravity (Phase 1 Execution) | Phase 1 completed (SB2-P1-01 through SB2-P1-07): scene card & templates overhaul, chapter break rationale validation, pack-scene drafting kit, same-POV voice anchor resolution engine, obligatory scene ledger validator, 27 questionnaire blueprints updated, ongoing ingest decomposition, The Bracket Method playbook, craft card & CLI packer | 88/88 main tests pass; 8/8 Phase 1 suites pass; okf-lint 0 errors; 0 typescript errors | Ready to begin Phase 2 (`SB2-P2-01`) |
| 2026-09-13 | Antigravity (Phase 2 Option A Execution) | Phase 2 Option A completed (SB2-P2-01, SB2-P2-02, SB2-P2-04): scene-scoped audits (< 500ms AI-tell scan + scene continuity against canon), chapter-scoped audits (multi-scene cadence variability + break efficacy verification against authored rationale), honest coverage reporting (examined, skipped, undrafted, null value shifts), and CLI wiring | 88/88 main tests pass; 14/14 scene audit tests pass; 20/20 chapter audit tests pass; okf-lint 0 errors; 0 typescript errors | Ready for Commandment Advisory Audit (`SB2-P2-03`) or Thread Sentry & Canon 2.0 (`SB2-P2-05`, `SB2-P2-06`) |
| 2026-09-13 | Antigravity (Commandment Advisory Audit) | Completed SB2-P2-03 (Commandment Advisory Audit): evaluated Shawn Coyne's 5 Commandments from scene prose against Stage 02 frontmatter intent, side-by-side comparison, advisory options in Revision Playbook without failing machine gates, CLI wiring (`soundingboard commandments`), and test suite | 91/91 main tests pass; 21/21 commandment audit tests pass; 0 typescript errors; okf-lint 0 errors | Ready for Thread Diagnostics Suite (`SB2-P2-05`) and Canon 2.0 (`SB2-P2-06`) |
| 2026-09-13 | Antigravity (Thread Diagnostics Suite) | Completed SB2-P2-05 (Thread Diagnostics Suite): polarity turn detection, word-count-based Dormancy Sentry, hard Orphan Guard on unbound scenes, ASCII Thread Lane View, CLI integration (`soundingboard threads`), and test suite | 92/92 main tests pass; 37/37 thread diagnostic tests pass; 0 typescript errors; okf-lint 0 errors | Ready for Canon 2.0 & Epistemic Decision Queues (`SB2-P2-06`) |
| 2026-09-13 | Antigravity (Canon 2.0 & Phase 2 Complete) | Completed SB2-P2-06 (Canon 2.0 & Decision Queues): provenance validation (`established_in`), Reader Spoiler Guard (`reader_known_as_of`), 3 epistemic gap decision queues (Orphaned, Unbound, Absent), CLI integration (`soundingboard canon check/query/queues`), and test suite. Phase 2 is 100% complete. | 93/93 main tests pass; 8/8 canon tests pass; 0 typescript errors; okf-lint 0 errors | Phase 2 Complete; Ready for Phase 3 (`SB2-P3-01`) |
| 2026-09-13 | Antigravity (Multi-Tier Compiler) | Completed SB2-P3-01 (Multi-Tier Manuscript Compiler): multi-tier resolution (2.0 atomic scenes -> chapters -> HTML/EPUB/DOCX + 1.x legacy fallback), configurable scene break glyphs (`***`, blank, none, custom), fail-loud missing scene verification, gate enforcement, CLI integration, and test suite. | 94/94 main tests pass; 7/7 compiler tests pass; 0 typescript errors; okf-lint 0 errors | Ready for Thread Lane Visualizer (`SB2-P3-02`) |
| 2026-09-14 | Antigravity (Thread Lane Visualizer) | Completed SB2-P3-02 (Thread Lane Visualizer): dual renderers (instant ASCII terminal chart + self-contained zero-CDN interactive SVG/HTML visualizer), cumulative word count X-axis, vertical polarity (+1/0/-1), multi-thread braid point stars, unrecorded shift coverage marks, dormancy gap highlights, CLI integration (`soundingboard threads --view`), and test suite. | 95/95 main tests pass; 7/7 visualizer tests pass; 0 typescript errors; okf-lint 0 errors | Ready for Scope Metadata on 118 OKF Craft Cards (`SB2-P3-03`) |

---


