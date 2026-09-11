# Soundingboard Engine Architecture & Technical Specification

## Architectural Overview

Soundingboard is an agent-native, token-disciplined novel engineering studio built upon the **Interpretable Context Methodology (ICM)**. It coordinates multi-agent or agent-author pairs across five stages governed by explicit markdown contracts, a central production ledger (`manuscript.json`), and deterministic zero-dependency CLI tooling.

```
                  ┌─────────────────────────────────────┐
                  │          _config/ Layer 3           │
                  │   Rules, Templates, 114 Craft Cards  │
                  └──────────────────┬──────────────────┘
                                     │ Context
                                     ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   STAGE 01   │ ──> │   STAGE 02   │ ──> │   STAGE 03   │ ──> │   STAGE 04   │ ──> │   STAGE 05   │
│  Onboarding  │     │   Planning   │     │   Drafting   │     │ Diagnostics  │     │  Publishing  │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                 ▲                    │
                                                 └──── Revision ──────┘
```

---

## 1. The 5-Stage Contract State Machine

Every stage folder contains a canonical `CONTEXT.md` defining:
- `inputs:` Exact prerequisite files required before execution.
- `outputs:` Target artifacts produced upon stage completion.
- `templates:` Skeleton conventions from `_config/templates/`.
- `process:` Numbered, deterministic author/agent procedures.

| Stage | Contract Path | Primary Outputs | Gating Invariant |
|---|---|---|---|
| **01 · Onboarding** | `stages/01_onboarding/CONTEXT.md` | `world_bible.md`, `characters/`, `genre_bible.md`, `tell_allowlist.md` | In-world terminology allowlisted; obligatory tropes identified. |
| **02 · Planning** | `stages/02_planning/CONTEXT.md` | `foolscap.md`, `structure_plan.md`, `beats/`, `manuscript.json` | Obligatory scene ledger scheduled; Swain pacing formulas set. |
| **03 · Drafting** | `stages/03_drafting/CONTEXT.md` | `chapters/chXX.md`, `canon.md` (unverified facts) | Chapter kit packed with trailing voice anchor; facts tagged. |
| **04 · Diagnostics** | `stages/04_diagnostics_edits/CONTEXT.md` | `reports/chXX_audit.md`, `revision_playbook.md` | Passes all 4 quality gates; canon conflicts reconciled. |
| **05 · Publishing** | `stages/05_publishing/CONTEXT.md` | `manuscript.html`, `manuscript.epub` | Compiler refuses any chapter without 4/4 passing audit attestations. |

---

## 2. Core State Ledgers

### `manuscript.json` (The Master Production Ledger)
Created at Stage 02 and maintained in the project root, `manuscript.json` records single-source-of-truth progress across the book:
```json
{
  "schema_version": "2.0.0",
  "book": {
    "title": "The Obsidian Threshold",
    "genre": "Epic Fantasy / Grimdark",
    "target_words": 85000
  },
  "chapters": [
    {
      "number": 1,
      "title": "The Ash Gate",
      "target_words": 3500,
      "actual_words": 3620,
      "pov": "Kaelen Vance",
      "status": "passed",
      "last_audit": {
        "verdict": "pass",
        "tell_density": 0.22,
        "cadence_variance": 7.4
      }
    }
  ]
}
```

### `stages/03_drafting/output/canon.md`
The immutable ground truth of narrative facts:
- Entities are recorded in structured markdown tables (Characters, Factions, Locations, World Rules).
- New facts added during drafting are flagged `[unverified chN]`.
- When Chapter N clears Stage 04 diagnostics, unverified tags are permanently confirmed.
- Rule of Contradiction: **The draft always loses to canon.** To alter canon, an explicit amendment must be logged with a retrofit list.

---

## 3. The Chapter Production Loop

1. **Kit Assembly (`soundingboard pack-chapter <N>`):**
   - Assembles beats, relevant canon entities, active story threads, and the voice kit (exemplars + trailing 500 words from Chapter $N-1$).
   - Enforces strict token ceilings ($\le 6,000$ tokens total) to maximize reasoning bandwidth for active prose generation.
2. **Drafting (Stage 03):**
   - Author-First (Solo) or Co-Writing (Agent-Drafted) pathway.
   - Appends newly coined facts tagged `[unverified chN]` to `canon.md`.
3. **Editorial Audit & HITL Revision Playbook (Stage 04):**
   - Runs `soundingboard audit` (prose tells, cadence variance) and `soundingboard continuity` (proper-noun consistency).
   - **Playbook Generation:** If mechanical or craft diagnostics flag issues, the agent creates `stages/04_diagnostics_edits/output/playbooks/revision_playbook_ch[X].md` based on `_config/templates/revision_playbook.template.md`.
   - **State Transition:** `manuscript.json` marks the chapter as `audited` (or `playbook_active`).
   - **Author Decision Gate:** The agent presents 2–3 creative strategies per finding (e.g., Cut vs. Dramatize vs. Subtext) with author write-in support. Under no circumstances may an agent perform an autonomous rewrite.
   - **Targeted Revision & Re-Audit:** The agent executes edits solely per the author's approved playbook choices, then re-runs diagnostics. Once all gates clear, status advances to `passed` and unverified canon tags are confirmed.
4. **Publishing Compilation (Stage 05):**
   - `soundingboard compile` scans `manuscript.json` and verification artifacts. If any chapter lacks verified clearance, the compilation halts.

---

## 4. Mechanical CLI Command Reference

All CLI commands run in zero-dependency Node.js ($\ge 18$). The canonical entry point is `scripts/soundingboard.js` (`scripts/saga.js` and `scripts/sb.js` are fully supported shims for backward compatibility):

| Command | Usage | Description |
|---|---|---|
| `soundingboard init` | `node scripts/soundingboard.js init [folder] [--form]` | Scaffold a clean workspace (forms: `novel`, `novella`, `short_story`, `series`). |
| `soundingboard status` | `node scripts/soundingboard.js status [--stage=N]` | Per-stage pipeline telemetry, chapter ledger, and word count progress. |
| `soundingboard brief` | `node scripts/soundingboard.js brief` | Dense single-line cold-start facts for agent context initialization (alias: `resume`). |
| `soundingboard run-stage` | `node scripts/soundingboard.js run-stage <id>` | Compile the stage packet (contract + declared inputs) as a single context block. |
| `soundingboard pack` | `node scripts/soundingboard.js pack <name> [args]` | Assemble deterministic context pack for creative playbooks (`unstuck`, `heat`, `bloom`, etc.). |
| `soundingboard pack-chapter` | `node scripts/soundingboard.js pack-chapter <N>` | Assemble token-disciplined drafting kit for Chapter N ($\le 6,000$ tokens). |
| `soundingboard craft` | `node scripts/soundingboard.js craft search <query>` | Search 114 OKF craft cards by symptom/concept (`--stage`, `--genre`, `--scope`, `--json`). |
| `soundingboard okf-lint` | `node scripts/soundingboard.js okf-lint` | Validate all craft cards against ICM standards and token limits (alias: `lint`). |
| `soundingboard okf-index` | `node scripts/soundingboard.js okf-index` | Rebuild static markdown catalogs (`index.md`) across OKF knowledge bundles. |
| `soundingboard audit` | `node scripts/soundingboard.js audit [path ...]` | Scan chapters for AI prose tells, cadence variance, emotion modes, and dialogue ratios. |
| `soundingboard continuity` | `node scripts/soundingboard.js continuity [dir]` | Proper-noun continuity scan (detects near-duplicates and orphaned names). |
| `soundingboard canon` | `node scripts/soundingboard.js canon query "<q>"` / `check` | Query established facts for an entity, or check for unverified canon tags. |
| `soundingboard timeline` | `node scripts/soundingboard.js timeline` | Verify story chronology and temporal anchors across chapter drafts. |
| `soundingboard threads` | `node scripts/soundingboard.js threads` | Inspect narrative threads, subplots, open promises, and loose-end ledger. |
| `soundingboard gate` | `node scripts/soundingboard.js gate <chapter>` | Machine-evaluate Stage 04 gate verdicts (scan, canon, rubric, ledger); sets `passed`. |
| `soundingboard manuscript-report` | `node scripts/soundingboard.js manuscript-report` | Whole-book diagnostic report: POV distribution, repeating 4-grams, and rhythm contour. |
| `soundingboard ingest` | `node scripts/soundingboard.js ingest <file\|dir>` | Ingest raw drafts with immutable archiving, provenance hash, and canon harvesting (alias: `import`). |
| `soundingboard check-update` | `node scripts/soundingboard.js check-update` | Check remote repository for new studio releases, craft cards, and tools. |
| `soundingboard update` | `node scripts/soundingboard.js update [--force]` | Safely pull upstream updates with auto-snapshot and conflict preservation. |
| `soundingboard doctor` | `node scripts/soundingboard.js doctor [--fix]` | Environment diagnostic and concierge auto-healing for workspace tools & configs. |
| `soundingboard compile` | `node scripts/soundingboard.js compile [--all]` | Compile verified passed chapters into `manuscript.html` (+ `.epub` via pandoc). |
| `soundingboard export` | `node scripts/soundingboard.js export [--format=...]` | Export compiled manuscript to `.html`, `.epub`, or `.docx`. |
| `soundingboard diag` | `node scripts/soundingboard.js diag [name] [args]` | Run diagnostic tools directly (rhythm, dialogue, tense, dread, lore, sensory, etc.). |
| `soundingboard wizard` | `node scripts/soundingboard.js wizard [name] [args]` | Interactive CLI wizards for terminal environments (`onboard`, `unstuck`, `heat`, etc.). |

---

## 5. Multi-Project & Series Architecture

Soundingboard workspaces are fully self-contained and cwd-relative. Parallel books cannot contaminate each other.

For multi-book series, a sibling `series/` folder acts as the shared cross-book layer:
```
my-series/
  series/               # Shared across all books (Read-mostly)
  │   ├── series_canon.md
  │   ├── romance_ladder.md
  │   └── lore_debt_ledger.md
  book-01/              # Standard Soundingboard workspace
  book-02/              # Standard Soundingboard workspace
```
Upon completion of Stage 04 for Book $N$, verified facts and cross-book trackers are promoted to `series/`, giving Book $N+1$ instant, zero-drift series memory.
