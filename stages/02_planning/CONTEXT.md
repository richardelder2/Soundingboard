---
type: StageContract
stage_id: "02_planning"
name: Scene Architecture & Narrative Structures
inputs:
  - stages/01_onboarding/output/preferences.json
  - stages/01_onboarding/output/bible/
  - stages/01_onboarding/output/bible/genre_bible.md
  - stages/01_onboarding/output/characters/
  - _config/okf_craft/CONTEXT.md
  - _config/narrative_authenticity.md
outputs:
  - stages/02_planning/output/foolscap.md
  - stages/02_planning/output/outline.md
  - stages/02_planning/output/structure_plan.md
  - stages/02_planning/output/character_arcs.md
  - stages/02_planning/output/trackers/
  - stages/02_planning/output/threads.md
  - stages/02_planning/output/canon.md
  - stages/02_planning/output/voice_exemplars.md
  - manuscript.json
templates:
  - _config/templates/CONTEXT.md
  - _config/templates/foolscap.template.md
  - _config/templates/structure_plan.template.md
  - _config/templates/scene_card.template.md
  - _config/templates/manuscript.template.json
---

# Stage 02: Planning Scene Architecture

## Process
1. **Foolscap first** — fill `foolscap.template.md` → `output/foolscap.md`: whole book on one page (genres, trope stack, engine, controlling idea, 3 movements × 5 commandments, promised scenes). Later artifacts must agree.
2. **Outline expansion** — expand foolscap into structural scene sequence in `output/outline.md`, following genre bible (`output/bible/genre_bible.md`).
3. **Trope Delivery & Continuity Trackers** — schedule reader contract in `output/structure_plan.md`:
   - Instantiate universal tracker (`tracker_lore_debt.md`) and genre tracker into `output/trackers/`.
   - Build **obligatory-scene ledger** in `structure_plan.md`: every trope milestone → scheduled scene ID (`sc-NNNN`).
4. **Thread Architecture** — instantiate `output/threads.md`: initialize `th-01: Main Story (Spine)` and subplots (`th-02`, etc.) with polarity spectrums and dormancy thresholds.
5. **Character Arc Pass** — write `output/character_arcs.md`: assign cast arc types, schedule 9 arc milestones per character mapped to scenes, cross-wire into scene cards.
6. **Structural Authenticity Pass** — apply Layer 1 of `_config/narrative_authenticity.md` to `structure_plan.md`: subplot map, nonlinearity plan, resolution variety, moral ambivalence scenes, intertextual anchors, escalation contour, and loose-end ledger.
7. **Scene card authoring** — create atomic scene cards in `manuscript/ch-XX/sc-YYYY.md` from `scene_card.template.md`: 5 commandments (reserve "beat" strictly for Coyne micro-beats during evaluation), viscosity, structural dials, obligatory milestones, and threads.
8. **Chapter assembly & break rationale** — group scenes into `manuscript/ch-XX/chapter.md` from `chapter.template.md`. Author mandatory `break_rationale` (hook, reveal withholding, POV pivot). Absence is a completeness failure.
9. **Initialize production ledger and living reference docs**: `manuscript.json`, `output/canon.md`, `output/voice_exemplars.md`.

## Verification
- `foolscap.md` exists, fits one page, and agrees with outline.
- `structure_plan.md` exists with obligatory-scene ledger mapped to scene IDs.
- `character_arcs.md` exists with ensemble map and milestone schedules.
- `threads.md` exists with `th-01` spine and subplots.
- `manuscript/` tree contains valid `sc-YYYY.md` scene cards and `chapter.md` files with human-authored `break_rationale`.
- `manuscript.json` indexes all scenes with `unit_type: "scene"`.
- `canon.md` and `voice_exemplars.md` seeded.
