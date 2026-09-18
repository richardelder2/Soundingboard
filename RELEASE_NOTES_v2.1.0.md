# Soundingboard v2.1.0 Release Notes
**Release Date:** September 17, 2026  
**Codename:** *The Cosmos & The Sovereign Author*  
**Compatibility:** Node.js $\ge$ 18.0.0 (Zero external runtime dependencies)

---

## Welcome to Soundingboard 2.1.0

Soundingboard 2.1.0 builds directly on the foundations of 2.0, introducing **Scale-Adaptive Complexity ("From Napkin to Universe")**, deep **Tactical Onomastics**, a codified **Git Creative History Layer (Playbook #21)**, and expanding the craft library to **127 standardized Open Knowledge Format (OKF) modules**.

This release solidifies the core philosophy:
> **The author is the novelist; the system bends to the author, never the author to the system.**  
> **The human author always holds the red pen. The AI never unilaterally rewrites author prose.**

---

## What's New in v2.1.0

### 1. Scale-Adaptive Complexity ("From Napkin to Universe")
*Abstraction is a complexity valve, not a publishing contract.* A standalone epic needs deep cosmological scaffolding even without sequels; a lean novella needs minimal ceremony. Soundingboard 2.1.0 introduces four progressive, non-prescriptive tiers:
- **Tier 0 (The Napkin):** The `writers_room/` sanctuary (`notes/`, `beats/`, `drafts/`, `inputs/`). Protected by an **Immunity Shield** that blocks background audits and CI, with on-demand tool invitation.
- **Tier 1 (The Atomic Story):** Standalone novel production in `stages/` and `manuscript/` with local `canon.md` and `threads.md` (< 4,000 tokens).
- **Tier 2 (The Institutional Canvas):** Multi-volume continuity in `series/` (`series_canon.md`, romance heat ladder, cross-book lore debt).
- **Tier 3 (The Cosmos Universe Canvas):** Deep worldbuilding in `world/` governed by `world/CONTEXT.md` across 6 ICM semantic domains:
  - `cosmology/` — Metaphysics, magic systems, deities, ontological laws.
  - `chronology/` — Deep epochal timelines, calendar mechanics, historical eras.
  - `geography/` — Topography, climates, trade routes, settlement networks.
  - `cultures/` — Social structures, languages, castes, taboos, rituals.
  - `economy/` — Currencies, production chains, resource scarcity, contraband.
  - `factions/` — Political webs, dynastic houses, sworn guilds, insurgencies.
- **Dynamic Context Isolation:** Scene packs retrieve *only* the specific domain triggered by the active scene card (< 6,000 tokens total), never dumping the entire cosmos into prompt memory.

### 2. The Five Foundational Principles of Authorial Sovereignty
1. **Authorial Truth is Absolute:** An explicit author statement overrules all inferences, schemas, and prior drafts.
2. **Explicit Uncertainty > Premature Precision:** Ambiguities are quarantined as open choices `[Option A | Option B]`; never plugged with synthetic hallucinations.
3. **Inference is Never Canon:** Inferred facts remain tagged `[unverified]` until explicitly affirmed by the author.
4. **Dramatic Consequences are Invitations:** Ripple effects and frictions are presented as creative prompts, never mandatory constraints.
5. **Intentional Exceptions are Valid:** Facts tagged `[author exception]` represent deliberate narrative sovereignty (miracles, anomalies, rule-breaks) and are never flagged as defects.

### 3. Tactical Onomastics & Naming Engine (Playbook #22, `soundingboard name`)
- Eliminates "token-ether naming" (smooth, repetitive AI naming defaults like *Lyra, Elara, Kaelen, Silas*).
- Grounded in phonetic acoustic geometry (**Bouba/Kiki principle**), caste stratification, linguistic erosion, and toponymic sediment.
- CLI generator:
  ```bash
  node scripts/soundingboard.js name --culture=nordic --target=character --caste=labor
  node scripts/soundingboard.js name --culture=courtly --target=house
  ```

### 4. Tactical Worldbuilding & World Codex (Playbook #23)
- Fast-path narrative mechanics vs. deep structural codex.
- Assembles deterministic context packs for lore exploration via `node scripts/soundingboard.js pack world [topic]`.

### 5. Creative History & Git as Evolution Layer (Playbook #21)
- *Soundingboard files contain the meaning. Git records the evolution.*
- Git sits as an open, non-proprietary historical layer over the file-first workspace.
- **Author Sovereignty:** Checkpoint commits and pushes are created **only when authorized by the author**.
- **Separation of Concerns:** Technical integrity (malformed syntax, broken links) prevents repo corruption, while creative uncertainty (pacing, tells, character motivations) never blocks commits or pushes.
- CLI commands: `soundingboard git status`, `checkpoint`, `verify`, and `push-check`.

### 6. Expanded Genre Continuity Trackers & Multi-Tier Threads
- **Legal Thriller / Procedural:** Forensic chain of custody, witness impeachment, and statutory motions (`tracker_investigation_evidence.template.md`).
- **Epic Fantasy / Space Opera:** Multi-faction power shifts, diplomatic leverage, and defection logs (`tracker_faction_influence.template.md`).
- **Heist / Tactical Op:** 5-phase synchronized clock, security blueprints, and double-bluff architecture (`tracker_heist_phases.template.md`).
- **Multi-Tier Subplot Threads:** Narrative threads now support cascading scopes: Book-Local, Series-Level, and World-Level.

### 7. 127 Standardized OKF Craft Modules
- Expanded from 118 to **127 fully validated craft cards** in `_config/okf_craft/`.
- New modules include:
  - `scale_adaptive_architecture_and_authorial_sovereignty.md` (Card #120)
  - `tactical_onomastics_and_world_naming_systems.md`
  - `structural_blueprint_rosetta_stone.md` (Cross-framework translation table)
  - `syntactic_cadence_dialects_and_authorial_cadence.md` (Hemingway staccato, Faulkner periods, McCarthy polysyndeton)
  - `dynastic_succession_and_contested_lineage_politics.md`
  - `sympathetic_institutional_antagonism_and_moral_justification.md`
  - `research_epistemic_status_and_uncertainty_management.md`
- 100% compliant with strict token budgets and OKF specification.

### 8. Architectural & CI Harmonization
- All documentation (`README.md`, `SOUNDINGBOARD_OVERVIEW.md`, `docs/architecture.md`, `docs/craft_encyclopedia.md`, `AGENTS.md`) unified under consistent terminology.
- CI workflow badge verified and pointed to `richardelder2/Soundingboard/actions`.
- Full test suite passing at **98/98 tests (100% pass rate)**.
