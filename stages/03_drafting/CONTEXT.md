---
type: StageContract
stage_id: "03_drafting"
name: Sensory Drafting
inputs:
  - stages/02_planning/output/beats/
  - stages/02_planning/output/structure_plan.md
  - stages/02_planning/output/character_arcs.md
  - stages/02_planning/output/canon.md
  - stages/02_planning/output/voice_exemplars.md
  - manuscript.json
  - _config/voice.md
  - _config/narrative_authenticity.md
outputs:
  - stages/03_drafting/output/chapters/
---

# Stage 03: Drafting Prose

## Process
1. **Load the chapter kit** for the target chapter (the next `status: planned` entry in `manuscript.json`, unless the user names one):
   - Its beat sheet from `stages/02_planning/output/beats/` and its `structure_plan.md` entries (escalation value, anachrony, subplot touchpoints, ledgered obligatory scenes).
   - Its **arc beats** from `character_arcs.md`: which characters' interior beats land in this chapter and what each must show. Arc beats surface through choice, behavior, and image — never through the narrator naming the lie, the truth, or the lesson.
   - **Canon** (`stages/02_planning/output/canon.md`): every fact drafted must agree with it — names/spellings, world rules, object states, numbers, timeline, who-knows-what.
   - **Voice kit** (anti-drift, mandatory): `voice_exemplars.md` PLUS the final ~500 words of the previous chapter's draft. Calibrate to these before writing a word; they are targets, not text to copy.
2. **Execute the Drafting Pathway**:
   - **Path A (Agent-Drafted):** Generate active, sensory prose following the beats, the style guide (`_config/voice.md`), and **Layer 2 (prose rules) of `_config/narrative_authenticity.md`**. In particular:
      - Rotate emotion modes: explicit label / behavioral cue / embodied sensation. Embodied carries at most ~2 of 5 emotion beats; plainly naming a feeling is allowed and encouraged.
      - Sensory budget: one or two senses per scene, chosen by POV relevance; smell only when it earns its place.
      - Introduce characters in action or dialogue, not external description.
      - Setting stays mostly indifferent to mood — no reflexive pathetic fallacy.
      - Prefer dialogue over narration when either would work; let characters interrupt and talk past each other.
      - The narrator never states the theme or the lesson.
      - Vary sentence and paragraph length aggressively; ration triads and em-dashes.
      - Apply Layer 3 fingerprint counters (escalation contour, register shifts between chapters, no unplanned epilogue).
   - **Path B (Author-Drafted / Workspace Custodian / Discovery Ingest):** If the author writes the prose directly (in their editor of choice, Obsidian, Word, or Scrivener):
      - The author drops raw files into `inputs/drafts/` or provides an external path.
      - Ingestion runs via `node scripts/soundingboard.js ingest <file|dir>` (or agent-driven custodian ingestion).
      - **Immutable Archiving:** External files are automatically snapshotted into `inputs/drafts/`. Raw inputs are never overwritten or deleted.
      - **Frontmatter & Provenance:** Chapters are formatted into `stages/03_drafting/output/chapters/chXX.md` with `source_raw_file`, `source_hash`, `ingested_at`, and `word_count`.
      - **Silent Bookkeeper:** Discovered proper nouns and figures are automatically appended to `stages/02_planning/output/canon.md` tagged `[unverified chN]`.
      - **Voice Anchor:** If `voice_exemplars.md` is empty, a representative paragraph from the author's prose is sampled into `stages/02_planning/output/voice_exemplars.md`.
      - **Sounding Board Debrief:** The agent reflects what emerged on the page (value shifts, open promises, character presence) without interrupting the author's flow.
3. **Fact Harvesting & Bookkeeping** (required before the chapter counts as drafted):
   - **Fact Harvesting:** Read the final draft (from either Path A or Path B). Identify any new hard facts established (names, numbers, physical attributes, timeline dates, object states). Append these to `canon.md` tagged `[unverified chN]`.
   - **Ledger Update:** Count the chapter's words, update the word counts and metadata, and set the chapter's `status` to `drafted` (or `imported`) in `manuscript.json`.
4. **Self-check**: Run `node scripts/saga.js audit` on the new chapter. If Path A, resolve red flags automatically. If Path B, compile the audit findings and present them gently to the author as editorial feedback.
