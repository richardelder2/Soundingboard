# Output Template & Continuity Tracker Router (Layer 3)

Per ICM §3.2, agents consult this index to instantiate schema skeletons per stage and genre rather than inlining every template into prompt memory.

---

## 1. Universal Planning Templates (Stage 02)

| Template | Output Path | Purpose |
|---|---|---|
| `foolscap.template.md` | `output/foolscap.md` | One-page narrative architecture. |
| `outline.template.md` | `output/outline.md` | Beat-sheet outline. |
| `structure_plan.template.md` | `output/structure_plan.md` | Scene ledger, subplots, escalation, dials. |
| `character_arcs.template.md` | `output/character_arcs.md` | Cast arcs and lie/truth schedules. |
| `scene_card.template.md` | `manuscript/scenes/sc-XXXX.md` | Atomic scene card with 5 commandments, dials. |
| `chapter.template.md` | `manuscript/chapters/ch-XX.md` | Chapter playlist assembly and break_rationale. |
| `manuscript.template.json` | `manuscript.json` | Production ledger (unit_type: scene). |
| `canon.template.md` | `output/canon.md` | Living fact registry with epistemic status. |
| `voice_exemplars.template.md` | `output/voice_exemplars.md` | Anti-drift voice exemplars. |
| `tracker_lore_debt.template.md` | `output/trackers/lore_debt.md` | Narrative questions and payoffs. |
| `threads.template.md` | `output/threads.md` | Subplot and thread ledger (Spine & Subplots). |

---

## 2. Genre-Conditional Continuity Trackers

Instantiate the tracker matching the active genre (from `preferences.json`):

| Genre / Mode | Tracker Template | Output Path | Focus |
|---|---|---|---|
| **Romance / Romantasy** | `tracker_romance_heat_ladder.template.md` | `stages/02_planning/output/trackers/heat_ladder.md` | 11-step intimacy ladder, grovel debt. |
| **Fantasy / Progression** | `tracker_power_escalation.template.md` | `stages/02_planning/output/trackers/power_escalation.md` | Advancement tiers, upgrades (4–6 ch). |
| **Mystery / Detective** | `tracker_fair_play_clues.template.md` | `stages/02_planning/output/trackers/fair_play_clues.md` | Planted clues, suspect & alibi grid. |
| **Legal / Procedural** | `tracker_investigation_evidence.template.md` | `stages/02_planning/output/trackers/investigation_evidence.md` | Chain of custody, witness impeachment. |
| **Epic Fantasy / Space Opera** | `tracker_faction_influence.template.md` | `stages/02_planning/output/trackers/faction_influence.md` | Faction power shifts, diplomatic leverage. |
| **Heist / Tactical Op** | `tracker_heist_phases.template.md` | `stages/02_planning/output/trackers/heist_phases.md` | Synchronized 5-phase clock, security plans. |
| **Universal** | *None* | *None* | Use core `tracker_lore_debt.md` only. |
