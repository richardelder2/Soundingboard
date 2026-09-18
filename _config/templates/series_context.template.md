---
type: ICMCategoryContract
tier: Multi-Book Series Layer (Tier 2)
schema_version: "2.0"
governed_path: "series/"
target_context_tokens: "2,000-4,000"
---

# Series ICM Semantic Contract (`series/CONTEXT.md`)

This contract governs the **Multi-Book Series / Overarching Arc Tier** of the workspace under the **Interpretable Context Methodology (ICM)**. It coordinates cross-volume continuity, multi-book character arcs, and overarching subplot threads across distinct manuscript volumes or major narrative acts.

> **ICM Core Invariant:**
> A series container groups multiple books or major chronological acts that share a single overarching narrative question (e.g. defeating a dark empire, surviving a generational voyage). Each book maintains its own local manuscript in `stages/` or sibling folders, while inheriting series-wide truths from `series/`.

---

## Series Container Architecture

```
series/
├── CONTEXT.md                 # This contract (Series scope & escalation invariants)
├── series_bible.md            # Master narrative question, thematic arc & series stakes
├── series_canon.md            # Cross-book verified facts, deaths & permanent state changes
└── trackers/                  # Multi-book progression trackers
    ├── subplots_series.md     # Arcs spanning multiple volumes (e.g. the 7 Horcruxes)
    ├── character_debts.md     # Emotional, relational, and blood debts across books
    └── faction_shifts.md      # Geopolitical power migrations between volumes
```

---

## Series Schemas & Invariants

### 1. The Series Bible (`series/series_bible.md`)
- **Job:** Define the macro-dramatic spine of the saga.
- **Key Sections:**
  - *The Master Dramatic Question:* What single unresolved conflict ties all volumes together?
  - *Volume Ledger:* The role each book plays in the overarching arc (e.g., Book 1: Discovery & Flight; Book 2: Guerilla Resistance; Book 3: Decisive Confrontation).
  - *Escalation Invariant:* Stakes must escalate in scope or intimacy across volumes; they cannot reset back to zero.

### 2. Series Canon (`series/series_canon.md`)
- **Job:** The immutable cross-volume fact registry.
- **Key Sections:**
  - *Permanent State Changes:* Character deaths, severed limbs, oaths sworn, titles gained.
  - *Artifact / Relic Registry:* Current location and possession of critical items.
  - *World State Delta:* Cities burned, treaties signed, monarchs deposed.
- **Resolution Rule:** Individual books cannot rewrite `series_canon.md` facts without an explicit authorial retcon flagged as `[author retcon]`.

### 3. Cross-Volume Trackers (`series/trackers/`)
- **Job:** Track lingering debts, unresolved promises, and relational tension across books.
- **Retrieval Trigger:** Consulted when planning the outline of a new volume (Stage 02) or when closing out book resolutions (Stage 04/05).
