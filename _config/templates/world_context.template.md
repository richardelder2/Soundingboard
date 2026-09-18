---
type: ICMCategoryContract
tier: Cosmos Universe Layer (Tier 3)
schema_version: "2.0"
governed_path: "world/"
target_context_tokens: "2,000-6,000"
---

# World Universe ICM Semantic Contract (`world/CONTEXT.md`)

This contract governs the **Universe / Macro World Tier** of the workspace under the **Interpretable Context Methodology (ICM)**. It organizes cosmological and worldbuilding knowledge into **six distinct semantic domains** so that writing agents can dynamically pull only the precise slice of world context needed for a scene, avoiding token bloat and context degradation.

> **ICM Core Invariant:**
> Folder structure does the orchestration. One domain per folder. Every file is plain markdown with YAML frontmatter. The agent loads *only* the domain triggered by the immediate dramatic task (maintaining token discipline under 6,000 tokens).

---

## The 6 Canonical World Domains

```
world/
├── CONTEXT.md                 # This contract (Domain maps & retrieval triggers)
├── world_bible.md             # Invariant physics, magic axioms & cosmic constants
├── world_canon.md             # Ancient historical facts & era truths
├── cosmology/                 # Domain 1: Metaphysics, Magic Laws & Deities
├── chronology/                # Domain 2: Deep History, Eras & Cataclysms
├── geography/                 # Domain 3: Polities, Biomes, Gazetteers & Naming
├── cultures/                  # Domain 4: Taboos, Manners, Customs & Rites
├── economy/                   # Domain 5: Scarcity, Trade, Currency & Contraband
└── factions/                  # Domain 6: Empires, Guilds, Cabals & Tension Matrix
```

---

### Domain 1: Metaphysics & Natural Laws (`world/cosmology/`)
- **Folder Job:** Define the fundamental rules of reality, magic systems, technology limits, cosmological origins, and supernatural entities.
- **File Schema Signature:** `type: CosmologyLaw` | `pantheon_religion`
  - Required sections: *Axioms / Rules*, *Costs & Consequences*, *Unbreakable Limits*, *Author Exceptions*.
- **Dynamic Retrieval Trigger:** Load into active context **ONLY** when a scene explicitly features:
  - Magic spellcasting, channeling, or ritual performance.
  - Technological hard limits or anomalous artifacts.
  - Theological prayer, direct divine intervention, or clergy disputation.
- **Exclusion Rule:** Never load during mundane conversations, street fights, or local political dinners.

### Domain 2: Deep Chronology & Eras (`world/chronology/`)
- **Folder Job:** Catalog the timeline of deep time, catastrophic historical turning points, dynasties, and ancient wars.
- **File Schema Signature:** `type: ChronologyEra`
  - Required sections: *Dating System / Epoch*, *Major Epoch Boundaries*, *Foundational Cataclysms*, *Verified Historical Truths*.
- **Dynamic Retrieval Trigger:** Load into active context **ONLY** when characters:
  - Explore ancient ruins, tombs, or archaeological sites.
  - Debate historical precedents, treaty origins, or generational curses.
  - Make chronological references to past ages.
- **Exclusion Rule:** Do not load for immediate chapter timeline questions (which belong in local `timeline.md`).

### Domain 3: Polities, Geography & Toponymy (`world/geography/`)
- **Folder Job:** Map the physical layout of continents, sovereign territories, climate biomes, trade arteries, city gazetteers, and linguistic phonotactics.
- **File Schema Signature:** `type: GazetteerEntry` | `naming_system`
  - Required sections: *Terrain & Climate*, *Strategic Borders*, *Trade Arteries*, *Toponymic / Linguistic Roots*, *Defensive Chokepoints*.
  - Reference: `world/geography/naming_system.md` (phonotactics and naming rules).
- **Dynamic Retrieval Trigger:** Load into active context **ONLY** when:
  - Characters travel between regions or cross international borders.
  - A scene is set in a specific major city or wilderness biome.
  - New settlements, landmarks, or geographic features are being named.

### Domain 4: Cultures, Taboos & Daily Life (`world/cultures/`)
- **Folder Job:** Document lived sociology: sacred taboos, hospitality codes, class mannerisms, mourning/marriage rites, and non-verbal body language.
- **File Schema Signature:** `type: CulturalCode`
  - Required sections: *Sacred Taboos*, *Hospitality Invariants*, *Social Hierarchy Markers*, *Mourning / Life Rites*, *Living Idioms*.
- **Dynamic Retrieval Trigger:** Load into active context **ONLY** when:
  - Staging cross-cultural interaction, formal dinners, negotiations, or diplomatic summits.
  - A character risks committing a social or religious offense.
  - Establishing atmospheric sensory rituals (street greetings, street food, prayer gestures).

### Domain 5: Political Economy & Bottlenecks (`world/economy/`)
- **Folder Job:** Track physical resource scarcity (water, spice, grain, timber, rare metals, energy), monetary systems, taxation, debt contracts, and the black market.
- **File Schema Signature:** `type: PoliticalEconomy`
  - Required sections: *Vital Bottlenecks (Who controls, who starves)*, *Monetary / Currency Units*, *Debt & Labor Structures*, *Illicit / Contraband Markets*.
- **Dynamic Retrieval Trigger:** Load into active context **ONLY** when:
  - Plots involve mercantile trade, bribery, economic desperation, smuggling, or supply blockades.
  - Character motivation stems from debt, scarcity, or financial leverage.

### Domain 6: Factions & Power Webs (`world/factions/`)
- **Folder Job:** Maintain profiles of sovereign houses, military orders, secret cabals, trading guilds, and their dynamic tension matrix.
- **File Schema Signature:** `type: FactionMatrix` | `FactionDossier`
  - Required sections: *Stated Doctrine*, *Covert Agenda*, *Leverage Over Other Factions*, *Vulnerabilities & Internal Fissures*, *Asymmetric Pressure Points*.
- **Dynamic Retrieval Trigger:** Load into active context **ONLY** when:
  - Political intrigue, espionage, or warfare is the scene engine.
  - A character’s allegiance to a faction creates dramatic stakes or conflicting loyalty.

---

## Dynamic Retrieval Rules for Writing Agents

When an agent is assisting an author with planning or drafting:
1. **Analyze Dramatic Stance:** Identify the 1 or 2 specific domains touched by the scene's core conflict.
2. **Selective Pack:** Load *only* the matching files from that specific domain folder (e.g. `world/economy/` for a dock smuggling scene).
3. **Respect Local Canon Over World Canon:** Local manuscript facts (`stages/02_planning/output/canon.md`) take precedence for immediate character states. If a contradiction appears between local and world, present it gently as an authorial opportunity:
   `[Continuity Note: In world/cosmology/magic_rules.md, teleportation requires silver, but Scene 4 uses iron. Keep as [author exception] or align with world rule?]`
4. **Author Exceptions Are Invariant:** Any fact tagged with `[author exception]` is deliberate authorial sovereignty (a miracle, a unique artifact, an intentional rule-break). **Never** flag an author exception as a defect.
