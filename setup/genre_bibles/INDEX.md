---
type: GenreBibleIndex
name: Genre Bible & Trope Stack Registry
description: Selector and usage contract for the genre series-bible templates. Consumed in Stage 01 (trope discovery) and Stage 02 (beat mapping).
last_modified: 2026-09-11
---

# Genre Bibles — Trope Stack Registry

Each bible is a fill-in series template for a commercial genre cluster: a flagship **trope stack** (the reader promise that goes in the blurb's first 40 words), a chapter-level **beat sheet** with obligatory scenes, and **continuity trackers**. Tropes are chosen here at *discovery*, scheduled at *planning*, and audited at *diagnostics*.

## The Master Bible Registry (12 Core Chassis)

| Bible | Flagship Stack | Structure | Length / Chapters |
|---|---|---|---|
| [cozy_cottagecore_folksy.md](cozy_cottagecore_folksy.md) | Inherited Shop + Hedge Witch + Shop Cat (variant: Burnt-Out Professional cozy fantasy) | Rotating-protagonist village series | ~70k / 28 ch |
| [crime_noir_heist.md](crime_noir_heist.md) | A: One Last Job + 5-Phase Heist + Double-Bluff · B: Disgraced PI + City Hall Rot + Femme Fatale | A: Standalone caper · B: Ongoing noir series | A: ~80k / 32 ch · B: ~75k / 30 ch |
| [fantasy_epic_polyphonic.md](fantasy_epic_polyphonic.md) | 4-POV Continental War + Hard Magic Rule + The Sanderlanche Convergence | Multi-book epic fantasy series | ~140k / 52 ch |
| [fantasy_scifi_horror.md](fantasy_scifi_horror.md) | A: Magic Academy + Bonded Beast · B: Progression + Military SF · C: Folk Horror + Dual Timeline | A: trilogy+ · B: open series · C: standalone | 80–140k |
| [horror_gothic_supernatural.md](horror_gothic_supernatural.md) | Malevolent Manor + Ancestral Curse + Psychological Descent + The Pyre | Contained atmospheric standalone | ~75k / 30 ch |
| [romance_regency_society.md](romance_regency_society.md) | Rake Duke + Wallflower Spinster + Fake Courtship + Grand Ballroom Declaration | Standalone or interconnected Season series | ~80k / 32 ch |
| [romance_romantasy_dark.md](romance_romantasy_dark.md) | Enemies to Lovers + Forced Proximity + He Falls First (dark variant: Fated Mates + Touch Her and Die) | 3–5 book series, same couple | ~100k / 38 ch |
| [romcom_summer_reads.md](romcom_summer_reads.md) | Small Town Return + Grumpy/Sunshine + Save-the-Shop (variant: Vacation Fling + Boss Reveal) | Interconnected standalones, town = brand | ~80k / 32 ch |
| [scifi_space_opera_cyberpunk.md](scifi_space_opera_cyberpunk.md) | A: Dynastic Star Fleet + Gravity Well Ambush · B: Low-Life Decker + Corporate AI Extraction | A: Multi-book space opera · B: Gritty cyberpunk thriller | A: ~110k / 44 ch · B: ~85k / 34 ch |
| [thriller_cozy_mystery.md](thriller_cozy_mystery.md) | A: Perfect-Life Lie + Gaslight Engine + Techno-Paranoia · B: Hook Occupation + Festival Murder + Pet Deputy | A: Standalone pen-name · B: 15-book cozy series | A: ~85k / 45 ch · B: ~62k / 26 ch |
| [thriller_legal_espionage.md](thriller_legal_espionage.md) | A: Underdog Defense + Suppressed Evidence + Jury Clock · B: Burned Operative + Nuclear MacGuffin + Mole | A: Standalone legal thriller · B: High-octane action series | A: ~85k / 36 ch · B: ~90k / 40 ch |
| [upmarket_historical_saga.md](upmarket_historical_saga.md) | A: Moral Dilemma + Curated Community Secret · B: Family Dynasty + Macro-Historical Crucible | A: Book club standalone · B: Generational family epic | A: ~85k / 32 ch · B: ~95k / 38 ch |

---

## How the Pipeline Consumes These

**Stage 01 — Trope Discovery:** After the questionnaire, select the genre bible with the author and fill its SERIES BIBLE section together (every `[FIELD]`). Save the filled copy to `stages/01_onboarding/output/bible/genre_bible.md` and record the chosen trope stack in `preferences.json`.

**Stage 02 — Beat Mapping:** The bible's beat sheet is the outline's chassis. Build the **obligatory-scene ledger** in `structure_plan.md`: every obligatory beat the stack promises (the one-bed beat, the bonding, the proof-object scene, the grovel, the cat's approval, the suppression motion, the heist breach) → scheduled chapter → delivered ✓/✗.

**Stage 04 — Trope Delivery Audit:** Verify every ledger entry was delivered on page, at roughly the beat sheet's position, at full strength.

---

## Tropes vs. The Authenticity Directive

`_config/narrative_authenticity.md` dictates that human fiction subverts convention and resists tidy plots, while the genre bibles dictate delivering the obligatory scenes on schedule. **Both are true at different altitudes:**
- **The trope stack is a reader contract — never subvert it.** The HEA, the fair-play reveal, the cat's survival, the acquittal, the heist payout are the product.
- **The authenticity rules govern the telling between and inside the beats.** Connective tissue, character flaws, nonlinear time, and unstated themes live around the ledgered scenes.
