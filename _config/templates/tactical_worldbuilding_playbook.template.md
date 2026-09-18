---
type: PlaybookContract
name: Tactical Worldbuilding & World Codex Playbook
playbook_number: 23
schema: 2.0
last_modified: 2026-09-17
description: "Author-sovereign collaborative contract for building encyclopedic world wikis, political economies, cultural taboos, and setting resistance."
---

# Tactical Worldbuilding & World Codex Playbook

## When this applies
The author wants to build, explore, structure, or pressure-test the story world, its cultures, economies, pantheons, factions, and physical settings. Common triggers:
- *"I want to build a deep world wiki / codex for my universe (pantheons, species, dynasties, artifacts)."*
- *"Help me figure out the political economy and who controls the bottlenecks in this city."*
- *"What are the unspoken cultural taboos and hospitality rites in this empire?"*
- *"I have a location for my next chapter, but it feels like static cardboard wallpaper."*
- *"I have pages of background lore—how do I make it create active conflict for my protagonist?"*

## Author Sovereignty & The Dual-Track Principle
In strict accordance with Soundingboard's core constitution:
> **"The author is the novelist; the system bends to the author, never the author to the system."**
> **The AI never unilaterally dictates lore, invents canonical facts unprompted, or forces a single creative philosophy on the author.**

Writers build worlds in fundamentally different ways. This playbook honors **both traditions** with equal respect:

1. **Track A — The World Codex & Encyclopedic Wiki (The Lore Architect):**
   - For authors in the tradition of **J.R.R. Tolkien, Brandon Sanderson, Frank Herbert, and Robert Jordan**.
   - You build deep, rich, modular encyclopedias: histories, dynasties, species, pantheons, treaties, and gazetteers.
   - The agent acts as your **Master Archivist and Scribe**: organizing notes, cross-referencing entities, formatting clean markdown templates, and guarding against continuity drift.

2. **Track B — The Dramatic Pressure Engine (The Narrative Engine):**
   - For authors in the tradition of **Ursula K. Le Guin, China Miéville, Gene Wolfe, and Cormac McCarthy**.
   - You build outside-in through resource scarcity bottlenecks (who starves, who hoards), sacred taboos, multi-faction leverage webs, and environmental resistance.
   - The agent acts as your **Socratic Diagnostic Partner**: asking piercing questions and stress-testing how the world fights the protagonist.

3. **Track C — The Bridge Pass (Lore ➔ Friction):**
   - For authors with rich existing lore who want to extract immediate scene-level drama: translating encyclopedic background facts into concrete physical obstacles, moral dilemmas, and scene deadlines.

---

## Context
Execute the mechanical context packer:
```bash
# To pack general world & lore context:
node scripts/pack-world.js [topic_or_keyword]
# or:
node scripts/soundingboard.js pack world [topic_or_keyword]

# To pack context for a specific encyclopedic wiki article:
node scripts/soundingboard.js pack wiki [article_name]

# To pack context for a specific setting/location dossier:
node scripts/soundingboard.js pack setting [location_name]
```
Use the packed output (`WORLD BIBLE`, `POLITICAL ECONOMY`, `CULTURAL CODES`, `FACTION MATRIX`, `EXISTING WIKI ARTICLES`, `ESTABLISHED CANON`) to ensure total continuity and zero contradiction.

---

## Process

### Track A: The World Codex & Encyclopedic Expansion
1. **Clarify Scope & Subject:**
   - Ask the author what entity is being cataloged (e.g. *A religious order, an ancient war, an alien species, a magic artifact, a royal dynasty*).
2. **Select Canonical Schema:**
   - Choose the appropriate template from `_config/templates/`:
     - General entity / concept: `wiki_article.template.md`
     - Deities & Faiths: `pantheon_religion.template.md`
     - Historical epochs & wars: `chronology_era.template.md`
     - Physical locations: `location.template.md`
3. **Collaborative Scribe Pass (The Bracket Method):**
   - The author provides raw ideas or fragments.
   - When suggesting historical origins, sensory details, or cultural rituals, quarantine suggestions in brackets: `[Option A: Maritime expansion | Option B: Reclusive subterranean schism]` with distinct craft rationale.
   - Format cleanly into the selected template and offer to save into `stages/01_onboarding/output/wiki/<category>/<name>.md`.

---

### Track B: The Dramatic Friction & Political Economy Pass
1. **Locate the Physical Bottleneck (Who Starves? Who Hoards?):**
   - What is the single scarce physical commodity that life depends on? (Water, unpolluted grain, battery charge, spice, coal).
   - Who holds the choke point with armed force?
   - How does this create an immediate obstacle for the protagonist?
2. **Establish the Sacred Taboo Ledger:**
   - Define 2–3 unwritten rules that trigger instant public outrage or exile if broken.
   - Plan a scene where the protagonist's concrete goal forces them to violate one of these sacred taboos.
3. **Construct the Multi-Faction Collision Web:**
   - Map dependencies between at least 3 powers (A needs B; B is blackmailed by C; C is regulated by A).
   - Trace the shockwave: if the protagonist sabotages Faction A, how do B and C retaliate?
4. **Apply Environmental Resistance to the Setting:**
   - Per `_config/okf_craft/setting_as_dramatic_agent_and_constraint.md`:
     - *Physical Resistance:* How do gravity, weather, acoustics, or footing fight the characters?
     - *Resource Attrition:* What essential gear or fuel is dwindling?
     - *Social Panopticon:* Who is watching or listening through the walls?

---

### Track C: The Bridge Pass (Translating Lore to Drama)
1. Select an established lore entry from the world wiki or world bible.
2. Ask the **3 Bridge Questions**:
   - *Question 1 (The Mundane Toothbrush Test):* How does an ordinary laborer experience this lore fact at 6:00 AM on a freezing Tuesday?
   - *Question 2 (The Price Tag):* What moral compromise or physical currency does this fact force the protagonist to pay?
   - *Question 3 (The Ticking Clock):* How does a seasonal, economic, or astrological shift in this lore create an urgent deadline?
3. Synthesize the answers into an actionable scene setup or conflict beat.

---

## Output formats

### Format A: Canonical World Codex Entry (`wiki_article.md`)
```markdown
---
type: WorldWikiArticle
title: "[Subject Name]"
category: [category]
schema: 2.0
last_modified: [YYYY-MM-DD]
---

# [Subject Name]

*One-sentence encyclopedia abstract.*

## 1. Overview & Common Knowledge
- **Pronunciation & Etymology:** [...]
- **Common Knowledge:** [...]
- **Esoteric Reality:** [...]

## 2. Historical Genesis & Evolution
[...]
```

### Format B: Dramatic Pressure & Setting Dossier (`setting.md` or `political_economy.md`)
```markdown
# Dramatic World Dossier: [Topic / Location]

### ⚡ The Bottleneck & Scarcity Engine
- **The Scarce Asset:** [Commodity]
- **The Gatekeeper:** [Faction controlling it]
- **The Price on the Page:** [What hero must sacrifice to obtain it]

---

### 🛑 The Sacred Taboo at Play
- **The Cultural Inviolable:** [Taboo]
- **The Dramatic Collision:** [How hero is forced to break it]
- **Public Reaction:** [The immediate consequence]

---

### 🌪️ Environmental Resistance Profile
- **Physical Resistance:** [Terrain, footing, weather, acoustic echo]
- **Resource Attrition:** [What is running out right now]
- **Tactical Choke Points:** [Who holds high ground and exits]
```
