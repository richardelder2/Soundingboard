---
type: TropePackIndex
name: Trope & Setting Modifier Pack Registry
description: Selector and registry for modular sub-genre and micro-trope modifier packs. Pluggable into any master blueprint or genre bible to achieve 200+ commercial micro-genre permutations.
last_modified: 2026-09-11
---

# Modular Trope & Setting Modifier Packs

In Soundingboard's 3-tier modular architecture, authors do not need 200 separate copy-pasted files. Instead, any **Master Blueprint** in `setup/` can be dynamically customized using these pluggable **Trope & Setting Modifier Packs**.

Each pack provides:
1. **Commercial Keywords & Blurb Tropes:** Reader promises for marketing and categorization.
2. **Atmospheric & Sensory Dial Kit:** In-world jargon, tactile details, and workplace/setting constraints.
3. **Obligatory Set-Piece Scenes:** Signature beats that readers of that micro-niche expect on-page.
4. **Authenticity Traps & Pitfalls:** Common clichés or procedural inaccuracies to avoid.

---

## The Trope Pack Registry

| Trope Pack File | Commercial Micro-Niche | Compatible Master Blueprints | Flagship Tropes & Milestones |
|---|---|---|---|
| [sports_romance_pack.md](sports_romance_pack.md) | Sports Romance (Hockey, F1, NFL, Gym) | Sports Romance, Contemporary Rom-Com | Athletic grind, travel proximity, ice/track set-pieces, championship game declaration. |
| [billionaire_dynasty_pack.md](billionaire_dynasty_pack.md) | Billionaire & Dynastic Wealth | Romance, Rom-Com, Domestic Thriller | Private jets, non-disclosure agreements, boardroom coups, lavish charity galas. |
| [paranormal_shifter_pack.md](paranormal_shifter_pack.md) | Paranormal Shifter Romance & Fantasy | Urban Fantasy, Romantasy, Dark Romance | Pack hierarchy, mating runs, scent recognition, rival alpha challenges. |
| [courtroom_legal_pack.md](courtroom_legal_pack.md) | Courtroom & Legal Investigation | Legal Thriller, Noir Detective, Domestic Thriller | Motions in limine, smoking-gun chain of custody, witness cross-examination, jury deliberations. |
| [space_fleet_naval_pack.md](space_fleet_naval_pack.md) | Space Fleet & Starship Operations | Space Opera, Progression Military SF | Bridge command protocols, vector burns, torpedo point-defense, boarding actions. |
| [cyberpunk_street_pack.md](cyberpunk_street_pack.md) | Cyberpunk & High-Tech Low-Life | Cyberpunk Dystopia, Heist Caper, Noir Detective | Neural decking, street ripperdocs, Black ICE counter-intrusion, megacorp extraction. |
| [small_town_holiday_pack.md](small_town_holiday_pack.md) | Small-Town Holiday & Festival Romance | Contemporary Rom-Com, Cozy Fantasy, Cozy Mystery | Snowbound cabins, gingerbread competitions, high school sweethearts, tree lighting ceremony. |

---

## How to Apply a Trope Pack (Stage 01 Triage)

During Stage 01 Path A onboarding:
1. The agent asks for the author's core concept, genre, and comp titles.
2. The agent pairs the **Master Blueprint** (e.g., `romcom_contemporary_blueprint.md`) with a **Trope Pack** (e.g., `small_town_holiday_pack.md` or `sports_romance_pack.md`).
3. The specific obligatory scenes, vocabulary items, and setting constraints from the Trope Pack are automatically injected into `stages/01_onboarding/output/bible/genre_bible.md` and the `structure_plan.md` obligatory-scene ledger.
