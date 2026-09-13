# Soundingboard 2.0 — Implementation Brief

**Companion to:** `soundingboard-v2-prd.md` (Scene Resolution)
**Audience:** the coding agent (Antigravity, Claude Code, Codex, Gemini CLI)
**Repo:** `richardelder2/Soundingboard` @ `main`, package `v1.2.0`
**Status:** ready to execute P0 after §3 decisions are made

---

## 0. How to use this document

The PRD explains *why*. This brief tells you *what to change, in what order, and how to know you're done*.

**Read order:**
1. This document, sections 1–3, in full. Do not start work until §3 is resolved.
2. `soundingboard-v2-prd.md` — the reasoning. Cited by section number throughout.
3. `AGENTS.md` — the standing contract. It still governs. Nothing here overrides it.
4. `CONTRIBUTING.md` — architectural invariants and PR checklist.

**Standing rules for this work:**

- **One task at a time.** Each task in §4 has an ID, a file list, and acceptance criteria. Complete and verify one before opening the next.
- **Every phase leaves `main` shippable.** `npm test` passes at the end of every task, not just every phase.
- **Never auto-apply a migration.** Propose, show, wait. This is the top risk in the PRD (§13) and the one failure that cannot be undone.
- **Do not add runtime dependencies.** `"dependencies": {}` stays empty. `devDependencies` may be added (see P0-07).
- **Stop and ask** whenever a task would require guessing at a schema decision. §6 lists the decisions that belong to the author, not to you.
- **Report coverage.** When you finish a task, state what you did *not* verify, not just what passed. This is the same principle the PRD applies to diagnostics (§6), applied to your own work.

---

## 1. Verified repository facts

The PRD's Assumptions section says "correct anything wrong here before implementing." This is that correction, verified against the checkout.

| PRD assumption | Reality |
|---|---|
| `scripts/` holds a zero-dependency Node CLI (Node ≥ 18) | **Confirmed.** `"type": "module"`, `"dependencies": {}`, `"engines": { "node": ">=18" }` |
| — | CLI is **~11,165 lines across ~50 files**, not one file. Entry: `scripts/soundingboard.js`. `scripts/saga.js` is a compat shim that imports it. |
| — | `bin` maps three names: `soundingboard`, `sb`, `saga`. Inactive on a plain clone (no `npm install`), so all docs must use `node scripts/soundingboard.js …`. |
| `canon.md` is the single-source canon ledger, project-scoped | **Confirmed.** Lives at `stages/02_planning/output/canon.md`. Template at `_config/templates/canon.template.md`. |
| `manuscript.json` is the production ledger, keys off chapters | **Confirmed.** Template at `_config/templates/manuscript.template.json`. Keys off a `chapters[]` array with `{id, title, pov, escalation, entities, beat_file, draft_file, status, target_words, last_audit}`. |
| Stage contracts live in `stages/`, surfaced through `AGENTS.md` | **Confirmed.** `stages/01_onboarding` … `stages/05_publishing`, each with `CONTEXT.md`. |
| Stage 02 emits chapter beat sheets | **Confirmed.** `stages/02_planning/output/beats/chNN.md` |
| Stage 03 emits chapter drafts | **Confirmed.** `stages/03_drafting/output/chapters/chNN.md` |
| Hashing uses `node:crypto` | Not yet used anywhere. New in P0. |

**Additional facts the PRD does not account for:**

- **`doctor` already exists.** `scripts/doctor.js` (437 lines) checks Node ≥ 18, git binary, git repo status, and pandoc, with per-platform install commands and a `--fix` path. `AGENTS.md` rule 6 already instructs the agent to run it backstage. → **PRD §14 open question 5 is closed.** Do not build a second one; extend this one (P3-02).
- **Only one external binary is assumed:** `git` (26 `execSync` call sites). `pandoc` is optional, publishing-only.
- **Craft module count is wrong everywhere.** `_config/okf_craft/` holds **121 `.md` files**, of which **118 are craft cards** (excluding `index.md`, `CONTEXT.md`, `SPECIFICATION.md`). README, the repo badge, and PRD §10 all say 114. §10's "114 small edits" is really **118**.
- **`scripts/` contains two PowerShell files** (`claude-vanilla.ps1`, `claude-openrouter.ps1`) and no shell scripts. Any new preflight must not assume a POSIX shell.

---

## 2. The two findings that change the plan

These were not visible from the README and both land in P0.

### 2.1 There is no frontmatter parser — there are six, and none can read the 2.0 schema

Frontmatter handling is currently duplicated ad hoc across the codebase:

| File | Function |
|---|---|
| `scripts/compile_manuscript.js` | `stripFrontmatter` |
| `scripts/continuity_scan.js` | `stripFrontmatter` |
| `scripts/manuscript_report.js` | `stripFrontmatter`, `parseFrontmatter` |
| `scripts/narrative_audit.js` | `stripFrontmatter` |
| `scripts/soundingboard.js` | `parseFrontmatterList` |

The only real parser, `manuscript_report.js:parseFrontmatter`, splits lines on the first colon and strips matching quotes. Against the PRD §5.2 / §5.3 schema it fails on **four of the required constructs**:

- `commandments:` — a nested map with five sub-keys. Returns `""` and then five bogus top-level keys.
- `scenes: [sc-0042, sc-0043]` — returns the literal string `"[sc-0042, sc-0043]"`, not an array. Same for `craft_modules` and `threads`.
- `break_rationale: >` — a folded scalar. Returns `">"`, then parses the wrapped continuation lines as garbage or drops them.
- It calls `.toLowerCase()` on every key, silently.

The PRD makes frontmatter **the source of truth for every scene in the book** (§5.1). Shipping that on top of a parser that mis-reads folded scalars is precisely the §13 top risk arriving through a side door. **P0-01 is therefore the first task, and nothing else starts until it is done and tested.**

### 2.2 `schema_version` is already `2.0.0` and means something else

`_config/templates/manuscript.template.json` ships `"schema_version": "2.0.0"` today, on package version 1.2.0. PRD §12 says to version the schema "from day one so later releases have something to branch on" — but the value it wants to write is already in use for an unrelated meaning.

**Migration detection cannot key off `schema_version` as-is.** Resolve this in §3 before writing the migration gate (P0-06).

---

## 3. Decisions required before P0 starts

Do not guess these. Ask, and record the answer in this file.

1. **Schema versioning scheme.** Given 2.1, how does `manuscript.json` distinguish an unmigrated 1.x project from a scene-model project? Options: bump to `3.0.0` and accept the version numbers diverge from the product; add a separate `model: "scene" | "chapter"` field; key off the existing `unit_type` field, which already holds `"chapter"`. The third is the least invasive and the field already exists.

2. **YAML subset.** The PRD does not say which YAML the parser must accept. Recommended: define an explicit documented subset — scalars, quoted scalars, folded (`>`) and literal (`|`) block scalars, flow sequences (`[a, b]`), one level of nested map, `null` — and **reject loudly** on anything outside it rather than best-effort guessing. Confirm the subset before P0-01.

3. **PRD §14 questions 1–4** remain open and block specific tasks: Q1 (controlled vocabulary for `value_in`/`value_out`) blocks nothing in 2.0 but is cheaper to decide now; Q2 (`pov` single vs array) **blocks P1-03**, anchor resolution; Q3 (commandment audit automatic vs opt-in) blocks P2-03; Q4 (frontmatter bloat vs sidecar) blocks P0-02 and contradicts §5.1 if answered "sidecar" — treat it as settled in favour of frontmatter unless the author says otherwise.

---

## 4. Work breakdown

Each task: **ID · what · files · acceptance.** Acceptance criteria are written to be checkable by running something, not by reading.

### P0 — Storage and migration
*Nothing writer-facing changes. The repo is inert but safe at the end of this phase.*

**SB2-P0-01 · One frontmatter module**
Create `scripts/frontmatter.js` exporting `parse(text)`, `stringify(obj)`, `strip(text)`, and `split(text) → {data, body}`. Implements exactly the §3.2 subset. Throws a typed error naming the file, line, and construct on anything outside it. Replace all six existing implementations with imports from it; delete the duplicates.
*Files:* new `scripts/frontmatter.js`; edit `compile_manuscript.js`, `continuity_scan.js`, `manuscript_report.js`, `narrative_audit.js`, `soundingboard.js`; new `tests/frontmatter.test.js`.
*Acceptance:* round-trips the exact §5.2 scene example and §5.3 chapter example byte-for-byte through `parse` → `stringify`. Rejects, with a named error, a folded scalar containing a tab; an unclosed flow sequence; two levels of map nesting. `grep -c "stripFrontmatter" scripts/*.js` returns 0 outside `frontmatter.js`. `npm test` passes.

**SB2-P0-02 · Scene and chapter record types**
JSDoc `@typedef` for `SceneRecord` and `ChapterRecord` transcribed from §5.2 and §5.3, including the reserved `threads` field from §5.4. Nullable fields typed as nullable — `value_in`, `value_out`, `voice_anchor`, and every `commandments` sub-key. `status` and other closed sets typed as literal unions.
*Files:* new `scripts/types.js` (typedefs only, no runtime code).
*Acceptance:* `npm run typecheck` (see P0-07) reports zero errors and flags an unguarded read of `scene.value_in` as an error.

**SB2-P0-03 · Scene ID allocation**
Monotonic `sc-NNNN`, never renumbered (§5.5). Allocation is centralised in one function that reads the current high-water mark from the tree, not from `manuscript.json`.
*Acceptance:* allocating across an empty tree, a tree with gaps, and a tree with a deleted highest ID never reissues an ID. Test covers all three.

**SB2-P0-04 · Reindex**
`scripts/reindex` rebuilds `manuscript.json` by scanning `manuscript/`. Holds nothing not derivable from the tree (§5.6).
*Acceptance:* on a fixture project, `rm manuscript.json && reindex` produces a file byte-identical to the original. This is PRD §4 criterion 1 and is the single most important test in P0.

**SB2-P0-05 · Hashing and staleness**
`computed_against` maps of scene ID → content hash using `node:crypto`. Hash **direct inputs only** — never children wholesale (§5.7). Stale is reported, never auto-rerun.
*Acceptance:* editing one scene marks exactly the findings computed from that scene stale, and no others. A cosmetic edit to one scene does not mark its chapter or any sibling stale.

**SB2-P0-06 · Concurrency guard and migration gate**
Every scene write verifies the content hash and **refuses** rather than clobbers (§9). Contracts detect an unmigrated project via the §3.1 decision and direct the agent to migrate first; no dual-model support (§8).
*Acceptance:* a write against a stale hash exits non-zero with a message naming the file, and the file on disk is unchanged. Running any scene-scoped command on an unmigrated fixture prints the migrate-first message and exits without writing.

**SB2-P0-07 · Type checking as a devDependency**
Add `typescript` to `devDependencies` only. Add `tsconfig.json` with `allowJs`, `checkJs`, `noEmit`, `strict`. Add `"typecheck": "tsc --noEmit"` to scripts and to CI. Files stay `.js`; no build step; `"dependencies"` stays `{}`.
*Acceptance:* `npm run typecheck` passes. A fresh `git clone` with no `npm install` still runs `node scripts/soundingboard.js status` successfully — verify this explicitly, it is the whole point.

**SB2-P0-08 · Runtime preflight**
Two parts. (a) A thin version shim: the CLI entry reads `process.versions.node`, prints a plain-English message and exits if < 18, **then** dynamically imports the rest. ESM static imports hoist, so this cannot live in `soundingboard.js` above its imports — it needs its own file. (b) Add `node --version` as step zero of `AGENTS.md` rule 6, before the `doctor --fix` call, because `doctor` cannot run when Node is absent.
*Acceptance:* running the entry under a simulated old version prints the friendly message, not a stack trace. `AGENTS.md` rule 6 names the check.

**SB2-P0-09 · The migration script**
`scripts/migrate-to-scenes`, following §8 exactly: unconditional backup to `manuscript.pre-scene/`; propose splits from break markers and POV/location shifts; interactive per-chapter confirm with accept/adjust/decline; write scene files with null-counted fields; backfill anchors by POV; reindex and report. Low confidence defaults to no split. Warn if mean scene length < ~800 words.
*Acceptance:* on a fixture manuscript, **no prose byte changes** — verified by diffing concatenated scene bodies against the original chapter files. Running it twice is a no-op. Declining every chapter yields single-scene chapters and a valid project. The backup exists before any write.

**SB2-P0-10 · Keep 1.x alive**
Branch `1.x` from the last pre-migration commit (§8). Document it in the README.

### P1 — Stages 02 and 03
*The anchor fix lands here. Useful without P2.*

- **SB2-P1-01** · Rename beat sheets to **scene cards**; reserve "beat" for the Coyne sense (§6 Stage 02). Vocabulary change across `stages/02_planning/CONTEXT.md`, templates, and the Rosetta Stone. *Acceptance:* no file in `stages/02_planning/` uses "beat" in the Save the Cat sense.
- **SB2-P1-02** · Chapter assembly as an explicit step; `break_rationale` required, its absence a **completeness failure not a warning** (§5.3).
- **SB2-P1-03** · Scene-scoped drafting packet: scene card, entity-matched canon rows only, voice anchor prose, craft modules selected from value shift and commandment gaps (§6 Stage 03). *Blocked on §3.3 Q2.*
- **SB2-P1-04** · POV anchor resolution: walk back to the most recent drafted scene sharing this POV; else Stage 01 voice sample with `anchor_provisional: true`; else sequence order if the project declared POV unusable. *Acceptance:* a chapter opening in a different POV than the previous chapter closed in anchors to the correct earlier scene, not the trailing 500 words. This is the bug the release exists to fix — it needs a named regression test.
- **SB2-P1-05** · Obligatory scene coverage maps to scene IDs.

### P2 — Stage 04
- **SB2-P2-01** · Split scene-scoped passes: continuity (canon + one scene, no craft modules), AI-tell (scene prose + allowlist, no canon), commandment audit.
- **SB2-P2-02** · Keep chapter-scoped passes chapter-scoped: cadence and rhythm, break efficacy.
- **SB2-P2-03** · Commandment audit — derived from prose, compared against Stage 02 intent. *Blocked on §3.3 Q3.*
- **SB2-P2-04** · **Coverage reporting on every pass.** Scenes skipped, null value shifts, undrafted scenes in a chapter under review. *Acceptance:* a pass run over a fixture with six undrafted scenes reports six, in the output, every time. The PRD calls this the cheapest item in the release and the only one that protects the writer from the tool — treat a missing coverage line as a failing test, not a cosmetic gap.
- **SB2-P2-05** · All findings carry scene IDs; Revision Playbook forks presented per scene.

### P3 — Stage 05, console, docs
- **SB2-P3-01** · Compile assembles scenes → chapters → manuscript → HTML/EPUB. Scene-break rendering is a project setting. **Fail loudly** on a chapter referencing a missing or undrafted scene; never silently omit.
- **SB2-P3-02** · Production console changes job: reports model health, not stage progress (§7). Extend the existing `doctor` rather than building a parallel surface — decide which checks live where.
- **SB2-P3-03** · Craft module scope metadata (`scene` / `chapter` / `manuscript`) on **118** cards. The most underestimated item in the release (§10).
- **SB2-P3-04** · Contract and doc updates per the §10 table. Reduce `CLAUDE.md` and `GEMINI.md` to pointers.
- **SB2-P3-05** · Housekeeping carried forward, unrelated to scenes but overdue: reconcile the 114/118 count everywhere; fix the CI badge, which points at `richardelder2/saga-icm`; resolve `SOUNDBOARD_OVERVIEW.md` (wrong product name, fourth command form); make every documented command use `node scripts/soundingboard.js …` since `bin` names do not work on a plain clone.

---

## 5. Definition of done, per phase

A phase is done when all of the following are true:

- `npm test` and `npm run typecheck` pass on a clean clone with no `npm install`.
- Every new behaviour has a test that fails if the behaviour is removed.
- The PRD §4 success criteria touched by the phase are demonstrable by running a command, not by inspection.
- `docs/architecture.md` reflects the new surface. Documentation drift is how this repo already accumulated three product names.
- A written note of what was *not* covered.

---

## 6. What belongs to the author, not the agent

Never decide these unilaterally. Surface and wait.

- Any of the §3 decisions.
- Whether a proposed scene split is correct. Propose, never apply (§8).
- Whether a diagnostic finding is right. The agent proposes, the author decides — the arbiter principle the whole Revision Playbook rests on (§15.6).
- Whether to amend canon or revise the prose when they disagree.
- Anything that would write an inferred fact into `canon.md`.

---

## 7. Known traps

- **Auto-rerunning stale findings.** Silent re-derivation breaks the arbiter principle (§5.7). Report stale; never recompute unasked.
- **Null fields normalising.** Migrated projects carry many nulls. If nothing surfaces the count, they stay null forever and the audits never run (§13).
- **Over-splitting.** Hundreds of 400-word scenes makes per-scene overhead exceed the saving and turns the release into a net loss (§13).
- **Thread diagnostics over null value shifts.** Not a 2.0 concern, but §16.5 is the worst failure mode in the document *because it looks like success*. If anyone reaches for 2.2 early, the null-value-shift count must be zero first.
- **Treating `engines: ">=18"` as a check.** It only fires during `npm install`, which these users never run. P0-08 is the real check.
