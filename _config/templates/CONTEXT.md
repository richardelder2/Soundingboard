# Output Template & Continuity Tracker Router (Layer 3)

Per ICM §3.2, agents consult this index to instantiate schema skeletons per stage and genre rather than inlining every template into prompt memory.

---

## 1. Universal Planning Templates (Stage 02)

| Template | Output Path | Purpose |
|---|---|---|
| `foolscap.template.md` | `stages/02_planning/output/foolscap.md` | One-page narrative architecture. |
| `outline.template.md` | `stages/02_planning/output/outline.md` | Beat-sheet outline. |
| `structure_plan.template.md` | `stages/02_planning/output/structure_plan.md` | Scene ledger, subplots, escalation, dials. |
| `character_arcs.template.md` | `stages/02_planning/output/character_arcs.md` | Cast arcs and lie/truth schedules. |
| `scene_beat.template.md` | `stages/02_planning/output/beats/chNN.md` | Granular 5-commandments and scene dials. |
| `manuscript.template.json` | `manuscript.json` | Central production ledger. |
| `canon.template.md` | `stages/02_planning/output/canon.md` | Living fact registry. |
| `voice_exemplars.template.md` | `stages/02_planning/output/voice_exemplars.md` | Anti-drift voice exemplars. |
| `tracker_lore_debt.template.md` | `stages/02_planning/output/trackers/lore_debt.md` | Narrative questions and payoffs. |
| `threads.template.md` | `stages/02_planning/output/trackers/threads.md` | Subplot and thread ledger. |

---

## 2. Genre-Conditional Continuity Trackers

Instantiate the tracker matching the active genre (from `preferences.json`):

| Genre / Mode | Tracker Template | Output Path | Focus |
|---|---|---|---|
| **Romance / Romantasy** | `tracker_romance_heat_ladder.template.md` | `stages/02_planning/output/trackers/heat_ladder.md` | 11-step intimacy ladder, grovel debt. |
| **Fantasy / Progression / LitRPG** | `tracker_power_escalation.template.md` | `stages/02_planning/output/trackers/power_escalation.md` | Advancement tiers, upgrades (4–6 ch). |
| **Mystery / Detective / Thriller** | `tracker_fair_play_clues.template.md` | `stages/02_planning/output/trackers/fair_play_clues.md` | Planted clues, suspect & alibi grid. |
| **Legal Thriller / Procedural** | `tracker_investigation_evidence.template.md` | `stages/02_planning/output/trackers/investigation_evidence.md` | Forensic chain of custody, witness impeachment, statutory motions. |
| **Epic Fantasy / Space Opera / Grimdark** | `tracker_faction_influence.template.md` | `stages/02_planning/output/trackers/faction_influence.md` | Multi-faction power shifts, diplomatic leverage, defection logs. |
| **Heist / Caper / Tactical Op** | `tracker_heist_phases.template.md` | `stages/02_planning/output/trackers/heist_phases.md` | Synchronized 5-phase clock, security blueprints, double-bluff architecture. |
| **Unlisted / Universal** | *None* | *None* | Use core `tracker_lore_debt.md` only. |
