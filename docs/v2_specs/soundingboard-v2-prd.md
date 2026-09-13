# PRD: Soundingboard 2.0 — Scene Resolution

**Status:** Draft for review
**Supersedes:** the earlier scene-level PRD, which stored scene state in `manuscript.json` and bundled threads into one release
**Scope:** breaking schema change, Stage 03 anchor fix, Stage 04 split, coverage reporting, migration

---

## Assumptions

Drafted from the public README and repository layout. Correct anything wrong here before implementing.

- `manuscript.json` is the production ledger and currently keys off chapters.
- `canon.md` is the single-source canon ledger, project-scoped.
- `scripts/` holds a zero-dependency Node CLI (Node ≥ 18).
- Stage 02 emits chapter beat sheets; Stage 03 emits chapter drafts; Stage 04 runs a combined diagnostic sweep.
- Stage contracts live in `stages/`, surfaced through `AGENTS.md`, with `CLAUDE.md` and `GEMINI.md` as harness entry points.

---

## 1. Problem

Soundingboard's craft library operates at scene resolution while its pipeline operates at chapter resolution. The modules in `_config/okf_craft/` are overwhelmingly scene-scoped — Coyne's Five Commandments describe one scene's shape, Truby's value shifts resolve per scene, Swain's MRUs are sub-scene. The pipeline consuming them tracks chapters.

Three costs follow:

**Imprecise diagnostics.** A scene-scoped finding has to be located inside a chapter-scoped window. The agent reports a defect "somewhere in Chapter 7" when the craft module it applied describes a defect in one specific scene.

**An anchor that injects drift.** The trailing-500-words anchor follows sequence, not POV. When a chapter opens in a different POV than the previous one closed in, the anchor calibrates the new voice against the wrong voice. The mechanism built to prevent drift causes it.

**Context carrying dead weight.** Chapter-scoped packets load canon, craft modules, and prose sufficient for a whole chapter when most operations need a fraction. This is what ICM's layered-loading principle exists to solve, and the current granularity prevents applying it.

Chapters also vary enormously by convention — a thriller chapter may be one scene, a literary chapter four. Treating a 900-word unit and a 5,000-word unit as the same kind of thing costs precision everywhere.

## 2. Goal

Make **scene** the atomic unit. Make **chapter** an assembly layer: an ordered list of scenes plus an authored rationale for the break.

Store scene state **in the scene file**. `manuscript.json` becomes a derived index that can be deleted and rebuilt.

## 3. Non-Goals

- **Threads, acts, and multi-line story architecture.** Deferred to 2.2. The schema must not preclude them (§5.4); the release must not contain them.
- **Canon provenance and the canon decision queue.** Deferred to 2.1 (§15).

- **Any visualization.** The thread lane view is 2.2 (§16.4); the braided narrative chart is later still (§16.6). Neither belongs in a release whose job is a safe schema migration.
- **Decomposing drafting below the scene.** A scene drafts in one pass. Sub-scene chunking adds re-entry points where voice drift enters.
- **Stored `sequence` level.** Derive it if threads arrive. It has the least evidence of pulling its weight.
- **New runtime dependencies.** The zero-dependency invariant holds. Hashing uses `node:crypto`.
- **Forcing scene vocabulary on writers.** Writers who think in chapters keep speaking in chapters.
- **Replacing the five rooms.** They remain the front door (§7).

## 4. Success Criteria

| Criterion | Measure |
|---|---|
| Files are the truth | Deleting `manuscript.json` and rebuilding from the tree is lossless |
| Findings are locatable | Every continuity and AI-tell finding carries a scene ID |
| Anchors follow voice | Drafting anchors to the most recent prior scene in the same POV |
| Coverage is honest | Every diagnostic reports what it could not examine, alongside findings |
| Migration is lossless | An existing project migrates with no prose altered, reversibly |
| Breaks are authored | Every chapter break carries a human-written rationale |
| Threads stay possible | 2.2 requires no second migration of the scene schema |

---

## 5. Data Model

### 5.1 Storage principle

**The markdown file is the record. The index is a cache.**

Scene state lives in the scene file's YAML frontmatter. `manuscript.json` is rebuilt by scanning the manuscript tree and holds nothing that isn't derivable from it.

This is the load-bearing decision of the release. It preserves the plain-files promise — a writer opens any file and understands it without the tooling. It makes migration recoverable, makes concurrent edits far less dangerous, keeps git diffs meaningful, and removes the class of bug where the ledger and the prose disagree. Prose and its metadata move together or not at all.

### 5.2 Scene file

```
manuscript/ch-07/sc-0043.md
```

```yaml
---
id: sc-0043
chapter: ch-07
pov: Maren
location: The salt works, night
value_in: Trust (+)
value_out: Betrayal (--)
commandments:
  inciting_incident: Maren finds the ledger has been altered
  progressive_complication: Tam's alibi collapses under her own notes
  crisis: Expose Tam or protect the crew
  climax: She burns the ledger
  resolution: Tam sees the smoke
voice_anchor: sc-0038
anchor_provisional: false
craft_modules: [okf-042, okf-091]
status: diagnosed
schema: 2.0
---

The salt works held the day's heat long after dark...
```

Notes on specific fields:

- `value_in` / `value_out` are the minimum viable encoding of a scene. A scene whose value doesn't shift has a structural problem, and requiring the field surfaces that at planning time rather than diagnosis time. Free text in 2.0; controlled vocabulary is a 2.2 question tied to thread value spectrums.
- `commandments` is authored at Stage 02 as intent, re-derived at Stage 04 from the prose. Divergence is itself a signal.
- `voice_anchor` is a resolved scene ID, not a computed offset. Storing it explicitly lets the resolution rule change without rewriting history, and lets a writer override by hand.
- `anchor_provisional` marks a scene drafted out of order, where no prior same-POV scene existed and the Stage 01 voice sample was used instead. When the earlier scene later lands, this flags the scene for a voice re-read.
- `craft_modules` records what was loaded, making retrieval auditable.

### 5.3 Chapter file

```
manuscript/ch-07/chapter.md
```

```yaml
---
id: ch-07
number: 7
title: Salt and Ash
scenes: [sc-0042, sc-0043, sc-0044]
break_rationale: >
  Ends on Tam seeing the smoke. Withholds his reaction until Ch 9 so the
  reveal carries across the Fen interlude.
status: drafted
schema: 2.0
---
```

`break_rationale` is required and human-authored. Its absence is a Stage 02 completeness failure, not a warning.

Scene order comes from the `scenes` array, never from ID or filename. Moving a scene between chapters is an array edit plus a `chapter` field update.

### 5.4 Forward compatibility with threads

One optional field, unused in 2.0:

```yaml
threads: [th-01]     # absent means the single implicit thread
```

Migration writes nothing here. 2.0 tooling ignores it. 2.2 can populate it without a second schema migration of scene files. This costs nothing now and avoids the migration that would otherwise be needed later.

The reasoning behind it is worth recording even though the feature is deferred: the thing that varies across story architectures isn't nesting depth, it's how many value lines run in parallel. Acts belong to threads, not to the book, which is why they aren't in this release — adding book-level acts now would encode the single-protagonist assumption into the schema.

### 5.5 Scene IDs

Monotonic, stable, never renumbered: `sc-NNNN`. Canon references, diagnostic findings, and voice anchors all hold scene IDs, so renumbering would break them silently.

### 5.6 The derived index

`manuscript.json` holds the scan result plus a schema version. `scripts/reindex` rebuilds it. Every operation that writes a scene file updates the index; if they ever disagree, the file wins and the index is rebuilt without prompting.

### 5.7 Staleness

Derived records — diagnostic findings — carry a `computed_against` map of scene ID to content hash, using `node:crypto`. Hash content, not timestamps; timestamps lie under git checkouts.

**Hash direct inputs only.** A finding computed from one scene hashes that scene. Nothing hashes its children wholesale, which is what would turn a cosmetic edit into a cascade to the top of the tree.

**Stale means stale, not wrong.** A stale finding may still be correct. Report it as computed against an older version. Never auto-rerun — silent re-derivation breaks the arbiter principle the Revision Playbook rests on.

Full provenance for canon entries is 2.1. 2.0 hashes only scene prose against findings.

---

## 6. Stage Changes

### Stage 01 — Discovery Lounge

Minimal. Add two questions: the writer's default scene-to-chapter convention, and whether POV is a useful anchor key (it isn't for omniscient or shifting-close-third, where anchoring falls back to sequence order).

### Stage 02 — Storyboard Wall

**Rename beat sheets to scene cards.** There is a live vocabulary collision: Stage 02's "beats" are Save the Cat macro beats — Catalyst, Midpoint, All Is Lost — while Coyne's beats are action/reaction pairs inside a scene, two orders of magnitude smaller. The Rosetta Stone trains the agent to treat framework vocabularies as interchangeable, which makes this actively dangerous rather than merely confusing. Reserve "beat" for the Coyne sense in craft modules and Stage 04 output; Stage 02 emits scene cards.

Beats are never stored. They're derived at diagnosis, reported, discarded. An 1,800-word scene holds 20–30 of them; authoring those would be outlining at a granularity that strangles drafting.

**Chapter assembly becomes an explicit step.** After scene cards exist, the writer groups them and states the break rationale — presented as a craft decision (end on a hook, withhold a reveal, pivot POV), never as a word-count calculation.

**Obligatory scene coverage maps to scene IDs**, so gaps show as unmapped obligations.

### Stage 03 — Writing Desk

Packet is rescoped to the scene:

- The scene card
- Canon entries matching the scene's named entities, not the full ledger
- Voice anchor prose, resolved by POV
- Craft modules selected from the scene's value shift and commandment gaps, not a standing bundle

**Anchor resolution:** walk back for the most recent drafted scene sharing this POV. If none exists, use the Stage 01 voice sample and set `anchor_provisional: true`. If the project declared POV unusable as a key, fall back to sequence order.

### Stage 04 — Editorial Desk

Splits by context seam. This is where the migration pays for itself.

**Scene-scoped:**
- *Continuity* — canon plus one scene. No craft modules, no cadence logic.
- *AI-tell scan* — scene prose plus the In-World Allowlist. No canon.
- *Commandment audit* — commandments derived from prose against Stage 02 intent.

**Chapter-scoped:**
- *Cadence and rhythm* — must stay chapter-scoped. Monotony is a pattern across a stretch; per-scene analysis misses that four scenes share one rhythm.
- *Break efficacy* — does the chapter end where `break_rationale` claims.

**Coverage reporting is part of every pass.** Each diagnostic reports what it could not examine: scenes skipped, null value shifts, undrafted scenes in a chapter under review. A clean result that silently skipped six scenes manufactures trust it hasn't earned, and a writer can't arbitrate what they weren't told went unexamined. This is the cheapest item in the release and the only one that protects the writer from the tool.

**Revision Playbook** is unchanged in kind. Findings carry scene IDs; forks are presented per scene.

### Stage 05 — Printing Press

Compile assembles scenes → chapters → manuscript → HTML/EPUB.

- Scene-break rendering is a project setting: blank line, centered glyph, or none.
- Fail loudly on a chapter referencing a missing or undrafted scene. Never silently omit.

---

## 7. Interface: rooms over operations

The engine is scoped operations over a persistent model. The interface stays five rooms.

The waterfall framing is wrong — you learn what your book is by drafting it, and a revelation in chapter 12 can change the premise from Stage 01. But the rooms are good wayfinding, and a novelist who wants to be told what to do next needs a path. So the rooms become **recommended routes** through the operation set rather than gates that lock. Non-linear entry is always legal.

Lead the README with rooms. Document scoped operations in `architecture.md`.

**The production console changes job.** It stops reporting progress through stages and starts reporting model health: scenes undrafted, scenes with null value shifts, chapters missing break rationale, findings stale against edited prose, scenes drafted against provisional anchors. That's what makes non-linear work safe, and it's the same surface doing a strictly more useful job.

---

## 8. Migration

**The migration script is the release.** If it mangles a manuscript, nothing else matters.

`scripts/migrate-to-scenes` — one-shot, idempotent, reversible:

1. **Back up unconditionally** to `manuscript.pre-scene/`. Not a flag, not a prompt.
2. **Propose splits** from existing break markers (`***`, `#`, repeated blank lines) and POV or location shifts. Propose only; never auto-apply.
3. **Confirm interactively.** Accept, adjust, or decline per chapter. A declined chapter becomes a single-scene chapter — a first-class outcome, not a failure.
4. **Write scene files** with frontmatter. Fields not derivable from prose are written `null` and counted.
5. **Backfill anchors** by POV where known.
6. **Reindex** and report: scenes created, fields left null, chapters without break rationale.

**Minimum viable scene heuristic.** A scene should contain a value shift; a fragment that doesn't is part of an adjacent scene. Warn if average scene length falls below ~800 words — over-splitting makes per-scene overhead exceed what it saves, which would make the release a net loss.

**Low confidence defaults to no split.**

**No dual-model support.** Supporting migrated and unmigrated projects simultaneously doubles branching in every contract and is the main avoidable source of agent confusion. Detect `schema` in `manuscript.json`; if unmigrated, contracts direct the agent to migrate first.

**Keep 1.x alive on a branch.** A novelist mid-draft should never be forced to migrate.

---

## 9. Concurrency

Non-linear work means a writer may edit a scene in their editor while an agent diagnoses it. Operations verify the content hash at write time and **refuse** rather than clobber. Frontmatter-first storage limits the blast radius: a conflict affects one scene file, not the whole ledger.

---

## 10. Contract and Documentation Changes

| File | Change |
|---|---|
| `AGENTS.md` | Scene as atomic unit; frontmatter is truth; anchor rule; migration gate; coverage requirement |
| `CLAUDE.md` / `GEMINI.md` | Reduce to thin pointers at `AGENTS.md` rather than parallel copies that drift |
| `CONTEXT.md` | Scene / chapter / manuscript layering |
| `stages/02` | Scene cards, chapter assembly, beat vocabulary fix |
| `stages/03` | Scene packet, POV anchor rule, provisional anchors |
| `stages/04` | Pass split, coverage reporting |
| `stages/05` | Assembly, scene-break rendering, fail-loud |
| `docs/architecture.md` | Frontmatter schema, derived index, scoped operations, CLI reference |
| `docs/methodology.md` | Why scene is the ICM-correct boundary; why drafting isn't decomposed further; narrative vs presentation structure |
| `README.md` | Substantial rewrite — rooms stay, the pipeline framing goes |
| `_config/okf_craft/` | Scope metadata (`scene` / `chapter` / `manuscript`) on every module |

The craft module scope metadata is the item most likely to be underestimated: it's 114 small edits, and it's what makes scene-scoped retrieval real rather than aspirational.

---

## 11. Phasing

**P0 — Storage and migration.** Frontmatter schema, scene and chapter files, ID scheme, reindex, migration script, concurrency guard, tests. Nothing writer-facing changes.

**P1 — Stages 02 and 03.** Scene cards, chapter assembly, scene packets, POV anchor resolution. Highest value; the anchor fix lands here.

**P2 — Stage 04.** Pass split, commandment audit, break efficacy, coverage reporting, scene-ID findings.

**P3 — Stage 05, console, docs.** Compile assembly, model-health console, craft scope metadata, README rewrite.

Each phase leaves the repo shippable. P0 is inert but safe; P1 is useful without P2.

---

## 12. Release Plan

**2.0.0 — scenes.** Sections 1–11 and 13–14 of this document. Breaking: data model, stage contracts, agent vocabulary.

**2.1 — canon.** Section 15.

**2.2 — threads.** Section 16.

Three smaller migrations are more honest than one migration that is simultaneously the riskiest and least-tested thing in the repo. Version the schema in frontmatter and in `manuscript.json` from day one so later releases have something to branch on.

### Entry gates

Ship velocity is not the constraint here; migration safety is. Each release has a gate that must be true before starting the next, because every one of these adds fields to files that already hold someone's novel.

**Before starting 2.1:** a real manuscript has been migrated to 2.0 and drafted against for long enough to trust the anchor resolution and the coverage reporting. Canon provenance is only worth building on a scene model that has survived contact with actual work.

**Before starting 2.2:** at least one project exists where a single thread is visibly the wrong model — a subplot you lost track of, or a second POV line whose arc you could not see. Building the thread engine before that point means guessing at what thread health should report. The 2.2 schema field in §5.4 exists precisely so this wait costs nothing.

If 2.2 arrives within days rather than months, the thing most likely to be skipped is the 2.0 gate, and the failure is quiet: thread diagnostics computed over scenes whose value shifts were never filled in during migration. Section 16.5 makes that an explicit precondition rather than an assumption.

---

## 13. Risks

**Migration mangles a manuscript.** Mitigated by unconditional backup, propose-don't-apply, and low-confidence-no-split. This is the risk that matters most.

**Scene proliferation.** Aggressive splitting yields hundreds of 400-word scenes where per-scene overhead exceeds the savings. Mitigated by the value-shift heuristic and the average-length warning.

**Null fields normalize incompleteness.** Migrated projects carry many null commandments. If nothing surfaces them they stay null and the audit never runs. The console reports the count.

**Writers who don't think in scenes.** Keep scene structure mostly invisible in Stages 01 and 03 for them. The agent maintains records; the writer talks in chapters. Same translation job the Rosetta Stone already does.

**Maintainability.** 114 craft modules, scoped operations, staleness tracking, and three harness contracts is a lot of surface for one maintainer. Every phase should leave something a stranger could read and follow. Reducing `CLAUDE.md` and `GEMINI.md` to pointers is a small step in the right direction.

---

## 14. Open Questions

1. Should `value_in` / `value_out` use a controlled vocabulary from Story Grid value spectrums, or free text? Controlled enables automated polarity checking; free text is friendlier at storyboard. Deferrable to 2.2, where thread value lines force the question.
2. For deliberately multi-POV scenes, is `pov` a single value or an array? This determines whether anchor resolution needs a primary-POV concept.
3. Should the commandment audit run automatically or opt-in? It's the pass most likely to generate findings a writer disagrees with, since divergence from plan is often intentional.
4. Does frontmatter bloat hurt the reading experience enough to warrant a sidecar file per scene? Sidecars decouple prose from metadata, which is the thing §5.1 exists to prevent — but 25 lines of YAML above every scene is real friction in an editor.
5. Should `scripts/` grow a `doctor` command that reports model health outside a stage session, or does the console cover it?

---

# Part II — Deferred releases

The sections below are not 2.0 scope. They are recorded here so the reasoning survives, and so the 2.0 schema does not foreclose them.

---

## 15. Release 2.1 — Canon

### 15.1 Problem

Canon is project-scoped and flat. It records facts but not where they came from, which produces three failures once drafting goes non-linear:

- A continuity check cannot tell whether a canon entry is still supported by any surviving scene.
- Editing one canon entry invalidates every diagnostic in the book, or none — there is no way to be precise.
- Facts asserted in prose but never recorded stay invisible until they contradict something.

### 15.2 Provenance

Each canon entry records the scenes that established it and the hash of each at the time:

```yaml
- id: e-0044
  fact: Maren has a younger sister, unnamed
  established_in: [sc-0043]
  computed_against: {sc-0043: "a91f…"}
  status: established
  reader_known_as_of: sc-0061
  confirmed: 2026-09-20
```

Operations record the specific entries they consumed, not the file they read. Editing an unrelated entry then invalidates nothing. This is what makes staleness reporting usable rather than noise.

### 15.3 Epistemic status

A single `fact` field cannot express what novels routinely need. Entries carry a status:

- `established` — true in the story world
- `believed` — a character holds it; may be false. Requires a `believed_by` field
- `contested` — characters disagree, and the disagreement is the point
- `ambiguous` — deliberately unspecified by the author

`ambiguous` is load-bearing. Without a way to mark an absence as intentional, the gap queue keeps resurfacing it and the writer learns to dismiss the whole queue. One noisy check discredits every check beside it.

### 15.4 Reader-known-as-of

A mystery has facts true in the story that must stay hidden from the reader until a specific scene. Without this field, a continuity check against unrestricted canon will surface the chapter-30 reveal while diagnosing chapter 8 — technically correct, practically a spoiler injected into the writer's own draft, and worse, a correction that would push the prose toward giving the game away.

`reader_known_as_of` holds the scene ID at which the fact becomes available to the reader. Diagnostics scoped to a scene earlier than that treat the fact as unknown. Cheap now; painful to retrofit, because retrofitting means auditing every existing entry by hand.

### 15.5 The three gap types

Different kinds of missing canon want different handling. Collapsing them into one queue is what makes such queues unusable.

**Orphaned** — every scene that established the entry has been cut. Provenance answers this directly. Surface immediately at the moment of the cut, because that is when the writer has the context to decide. Scope: provenance.

**Unbound** — prose asserts something canon never recorded. The common case. The continuity pass already scans named entities; the same scan flags entities with no entry. Batch into a review queue; never interrupt drafting. A single session generates dozens of these and an interrupt per fact makes the studio unusable. Scope: scene.

**Absent** — canon says nothing, and nothing yet needs it. The trap. The unwritten portion of any world is unbounded, so a system that reports every unspecified detail produces infinite findings. Only surface when something demanded it: a scene card references it, or two scenes give conflicting implicit answers. Absence becomes a finding when it is load-bearing, never on its own. Scope: thread (which is why this pass is thin until 2.2).

### 15.6 The decision queue

Same principle as the Revision Playbook: the agent proposes, the author decides. Never auto-commit an inferred fact — a ledger filling with the model's guesses about what it meant is a ledger that has quietly stopped being a single source of truth.

Forks are shaped per gap type, not from a generic template.

*Unbound:*
1. Record as stated
2. Record corrected — the draft may be where the error is, not the ledger
3. Mark deliberately ambiguous
4. Revise the prose to match existing canon
5. Custom

Option 4 matters. A queue whose only affordance is expanding the ledger will expand the ledger even when the right fix was the sentence.

*Orphaned:*
1. Keep — established elsewhere
2. Drop
3. Hold pending — the scene may return
4. Custom

`pending` must be a real state that resurfaces, not a deferral that vanishes. Forcing a decision at the moment of a cut is bad timing and will produce bad decisions.

*Absent:*
1. Specify now
2. Out of scope for this book
3. Custom

**Batch presentation with a bulk path.** Canon decisions accumulate across a session rather than arriving singly. Fifteen sequential forks after a drafting session is a chore, and chores get skipped.

**Every decision records provenance:** confirmed by the author, on this date, from this scene. That is what makes `ambiguous` durable instead of a flag someone later mistakes for an oversight.

The custom write-in does more work here than in the prose playbook. Prose findings have a bounded option space; a canon fact can need a nuance no menu anticipates, which is the observation that produced §15.3.

### 15.7 Migration

Additive. Existing entries get `status: established`, empty provenance, and null `reader_known_as_of`. A `canon bind` command offers to attach entries to scenes by entity match, proposing and never auto-applying. Unbound legacy entries remain valid; they simply cannot participate in orphan detection.

---

## 16. Release 2.2 — Threads

### 16.1 Problem

2.0 assumes one implicit story line. That is correct for a single protagonist with subplots told from their POV, which is most novels and probably your own. It cannot express an ensemble where several value lines run co-equal, or a braided novel where lines never converge.

The thing that varies across story architectures is not nesting depth. It is **how many value lines run in parallel**. Generalizing by adding levels produces a schema that can represent anything and help with nothing.

### 16.2 Model

A **thread** is a value line with its own arc, its own act structure, and its own health.

```yaml
# threads.md frontmatter, or per-thread files
- id: th-01
  name: Maren and the ledger
  spine: true
  value: Trust / Betrayal
  acts:
    - {id: act-1, scenes_from: sc-0001, scenes_to: sc-0018}
```

**Acts attach to threads, not to the book.** This is the part 2.0 cannot express and the reason acts are absent from it. In an ensemble each thread has its own act structure and they deliberately do not align; the misalignment is the craft. Adding book-level acts in 2.0 would have encoded the single-protagonist assumption into the schema.

**One thread may be flagged `spine`** — Coyne's global story among the lines. A single-protagonist book has exactly one thread, flagged spine, and everything collapses back to the 2.0 behaviour.

**Scene-to-thread is many-to-many.** The `threads` array reserved in §5.4 becomes live. A scene advancing two lines at once is the braid point, and forcing it to pick one loses the thing most worth tracking.

**Sequence stays underived.** It is the level with the least evidence of pulling its weight. If it is ever needed, derive it from act structure rather than storing it.

### 16.3 Thread-scoped diagnostics

A new pass scope, and the reason the release exists:

- **Does the line turn?** A thread whose value polarity never shifts is a thread that is not a story.
- **Dormancy.** A thread silent for N words is the dropped-subplot failure from the README's amnesia list. Structurally invisible at both scene and chapter scope.
- **Resolution.** A thread that stops and never resolves.
- **Orphaned scenes.** A scene placed in a chapter but bound to no thread is draftable, compilable, and structurally invisible. This must be a loud validation error, not a null field — same class as the null commandment fields in §13, same fix.

Dormancy thresholds are measured in **words, not scenes**. Twelve short scenes and three long ones are very different gaps.

### 16.4 Thread lane view

The diagnostic visualization. One lane per thread, cumulative word count on the X axis, one mark per scene.

- **Vertical position within the lane encodes value polarity** — high for a positive turn, low for negative. Colour is redundant rather than load-bearing, which is what lets the same encoding degrade to ASCII in a terminal. The terminal version is the honest one for this project; the HTML is garnish.
- **Word count on the X axis**, matching §16.3.
- **A distinct mark for scenes with no recorded value shift.** The coverage principle applied visually: unknown must render as unknown, or the picture implies a completeness it does not have.
- **The gaps are the finding, not the marks.**
- Braid points marked, without drawing connectors across unrelated lanes.

Implementation cost is low — Stage 05 already emits HTML, so this is a static self-contained file from existing machinery. No CDN, no runtime dependencies.

**Caution:** a chart invites optimizing for the chart. Evenly distributed threads and tidy alternating polarity are not what a good book looks like; deliberate dormancy is a real technique. The view reports, it never scores.

### 16.5 Precondition

Thread diagnostics computed over scenes whose `value_in` / `value_out` were never filled in during migration will produce confident findings from absent data — the worst failure mode in this document, because it looks like success.

Before any thread pass runs, the null-value-shift count must be zero for the scenes in scope, or the pass must refuse and say so. This is the coverage principle from §6 applied at a new scope, and it is the specific thing most likely to be skipped if 2.2 is reached quickly.

### 16.6 Deferred: braided narrative chart

The reader-facing visualization — thread lines converging and separating, in the manner of the xkcd movie narrative charts.

**Deliberately not the diagnostic.** Convergence is legible in it, but dormancy and polarity — the two things worth diagnosing — become harder to read. It is the prettier chart and nearly all decoration.

**Its real home is Stage 05 and marketing.** As reader-facing material it describes a finished book, so the constraints invert: a dormant thread reads as intentional rather than as a finding. It wants smoothing, character names, chapter markers instead of word counts.

Same thread data, two renderers — one for diagnosis, one for presentation. That is the narrative-versus-presentation separation appearing a third time, after scene-vs-chapter and thread-vs-chapter.

**The practical reason to keep them apart:** the braid needs spline routing and collision avoidance between crossing lines, which is real layout work. The lane view is rectangles on a grid. Bundling them puts the expensive cosmetic one on the critical path of the diagnostic that is actually needed.

It is also good marketing for Soundingboard itself, not only for a novelist's back matter: a braid chart of a real book demonstrates that the system tracked something a document cannot, and requires no one to read the novel to find it interesting.

---

## 17. The recurring test

Three separate problems in this document resolved the same way, which is worth stating once as a test to apply to the next one.

**Narrative structure** — what the material does: scene → sequence → act → thread.
**Presentation structure** — how the reader encounters it: scene → chapter → manuscript.

Scene is the only node both share, which is what makes the separation tractable rather than two parallel trees kept in sync by hand.

Drafting order is neither. It is workflow state and belongs in status fields, not in the model.

Where this has already applied:

| Problem | Resolution |
|---|---|
| Scene vs chapter as the atomic unit | Scene is narrative, chapter is presentation |
| Chapter vs sequence | A chapter is not a sequence; hard-coding them as equal repeats the original error |
| Diagnostic vs published visualization | Lane view is narrative, braid chart is presentation |
| The POV anchor bug | The anchor followed presentation order because that was the only order the system had |

What it buys: reordering becomes safe. Moving a chapter changes presentation and leaves narrative untouched, so value shifts, act structure, and thread arcs survive intact — and the system can report what the reorder did to pacing without re-deriving the story's shape.

What it costs: two structures means two places to be incomplete. The failure mode is a scene placed in a chapter but orphaned from every thread — draftable, compilable, structurally invisible. Loud validation error, never a null field.
