---
type: PlaybookContract
name: Tactical Naming & World Onomastics Playbook
playbook_number: 22
schema: 2.0
last_modified: 2026-09-17
description: "Author-agent collaborative contract for engineering character, location, and world names grounded in phonotactics, caste friction, and speech erosion."
---

# Tactical Naming & World Onomastics Playbook

## When this applies
The author wants to name a character, faction, city, geographic feature, or entire realm, or establish constitutional naming rules for their story world. Common triggers:
- *"I need a name for my protagonist, but everything sounds like generic fantasy slop."*
- *"Help me figure out how names work in this empire/culture."*
- *"What should this fortress/district/river be called?"*
- *"I have a character concept, but their name doesn't feel like it belongs in the world."*
- *"Can we audit my current cast names to make sure they don't blur together?"*

## What good output looks like
- **The Core Anti-AI Principle (Sociolinguistic Sediment):**
  AI models pluck generic, frictionless, euphonic names from token space (*Lyra, Elara, Kaelen, Silas, Rowan, Aiden, Shadowblade, Thorne, Vance*). Authentic names are sociolinguistic artifacts—they carry class markers, regional slurs, living erosion, and historical substrate.
- **Acoustic Geometry (Bouba vs. Kiki):**
  Names are engineered with deliberate acoustic texture (harsh plosive stops for flinty soldiers vs. flowing liquids for ancient landholders).
- **The 4-Point Cast Collision Defense:**
  No two major characters share the same initial letter, syllable count, or ending cadence.
- **Toponymic Living Erosion for Places:**
  Settlement and landform names are eroded historical descriptions (*Oxen-ford ➔ Oxford, Hollow-well ➔ Holl*), never purple compound poetry (*Whispering Woods*).
- **The Living Breath Test:**
  Every proposed name passes three vocal tests: the Panic/Combat Shout, the Contempt Nickname, and the Intimate Whisper.

## Context
Execute the mechanical context packer:
```bash
node scripts/pack-naming.js [character_or_topic]
# or:
node scripts/soundingboard.js pack naming [character_or_topic]
```
Use the packed output (`TARGET NAMING SYSTEM`, `CURRENT CAST ROSTER & ACOUSTIC MATRIX`, `ESTABLISHED CANON FACTS`, `WORLD BIBLE CONTEXT`, `ANTI-AI DENYLIST`) to ensure total continuity and zero role/phoneme overlap.

You can also run the generator backstage to harvest grounded candidates:
```bash
node scripts/soundingboard.js name --culture=norse --caste=noble --count=5
node scripts/soundingboard.js name --target=place --genre=grimdark --count=5
```

## Process

1. **Step 1: Determine Sociolinguistic Position & Linguistic Substrate**
   - What caste or faction does the entity belong to?
     - *Aristocracy:* Polysyllabic, archaic, ancestral hoarding with estate markers (`de`, `von`, `of`).
     - *Guild / Tech:* Vocational or institutional designator (`-smith`, `-wright`, serials).
     - *Commoners:* Blunt monosyllables, living patronymics (`-son`, `-dottir`), or land features.
     - *Outcasts / Denied:* Street monikers, defect tags, or single syllables.
   - What are the world's phonotactic laws (harsh plosives vs. soft liquids)?

2. **Step 2: Generate Rarity Candidates (Discard the First 3 Defaults)**
   - Per `_config/narrative_authenticity.md` §Rarity, the first idea produced by an LLM is, by definition, the statistical center of synthetic trope space.
   - Generate candidate options using historical census rolls, parish registries, or the Soundingboard naming lexicon. Discard obvious cliches (*Lyra, Kaelen, Silas*).

3. **Step 3: Run the Cast Collision Matrix**
   - Check the candidate against existing cast in `canon.md` and `stages/01_onboarding/output/characters/`.
   - Verify:
     - Different initial letter?
     - Different syllable count?
     - Different terminal vowel/consonant coda?

4. **Step 4: The Living Breath Stress Test**
   - Conduct 3 vocal trials in chat:
     1. *The Combat / Panic Shout:* When shouted across gunfire or a storm, does it cut through? (e.g. *"Hal! Drop!"*)
     2. *The Contempt Nickname:* What dismissive moniker do rivals use behind their back? (e.g. *"Little Hal"*, *"Tor-boy"*)
     3. *The Intimate Whisper:* What diminutive or softening do lovers/family use? (e.g. *"Siri"*)

5. **Step 5: Author Decision & Canon Registration**
   - Present 3 distinct, high-friction candidates with their onomastic rationale.
   - Once the author selects their preferred name, register it in `canon.md` and offer to update the character profile or world bible.

---

## Output format

```markdown
# Tactical Onomastic Dossier: [Entity / Character Name]

### 🏛️ Sociolinguistic & Phonotactic Position
- **Target Caste / Class:** [Aristocrat | Guild Artisan | Commoner | Outcast | Toponym]
- **Acoustic Profile:** [Kiki sharp-plosive | Bouba soft-liquid | Sibilant-fricative]
- **Substrate Root:** [Culture, historical era, or world-logic phonology]

---

### 🛡️ Cast Collision Matrix Check
| Candidate | Initials | Syllables | Terminal Sound | Collides With Existing Cast? |
|---|---|---|---|---|
| [Option 1] | [e.g. H] | [2] | [-var (liquid)] | No (nearest: Gideon [G, 3, -on]) |
| [Option 2] | [e.g. D] | [1] | [-un (nasal)] | No (nearest: Constance [C, 2, -ns]) |
| [Option 3] | [e.g. V] | [3] | [-ius (sibilant)]| No (nearest: Malachai [M, 3, -ai]) |

---

### 🗣️ The Living Breath Stress Test
- **Candidate Selected:** [Name]
  - **The Panic Shout:** *"[Shortened command or shout on page]"*
  - **The Contempt Nickname:** *"[Weaponized slur or dismissal used by rivals]"*
  - **The Intimate Diminutive:** *"[Affectionate family / lover contraction]"*
  - **Living Speech Erosion:** *[How the full formal title erodes into everyday slang]*

---

### 📋 Canon Registration Block
```markdown
| Entity | Category | Canonical Facts & World Constraints | Source | Verified |
|---|---|---|---|---|
| [Name] | Character | [Brief onomastic fact, caste, meaning, and acoustic register] | stages/01_onboarding | Yes |
```
```
