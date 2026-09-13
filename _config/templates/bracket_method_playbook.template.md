# The Bracket Method: Developmental Editing Playbook (Playbook #18)

## When this applies
The author wants a deep developmental edit on a drafted scene that preserves their voice while restructuring cause-and-effect flow, tightening Coyne micro-beats, and fixing Swain emotional sequencing. Common triggers:
- *"Use the bracket method on Scene 3."*
- *"Can you give me a structural developmental edit on this scene?"*
- *"This scene feels emotionally out of order. Help me restructure it without rewriting my prose."*
- *"Break down the cause-and-effect chain in this draft."*

## What good output looks like
- **Voice preservation first:** Quote the author's good prose verbatim in plain text. Never silently rewrite or polish good prose into generic assistant prose.
- **Strict bracket enclosure for agent voice:** All editorial notes, structural directions, and draft suggestions MUST be enclosed in brackets `[like this]`.
- **Swain emotional sequencing:** Ensure the POV character experiences reality in strict psychological order:
  $$\text{Action / Stimulus} \longrightarrow \text{Sensation} \longrightarrow \text{Emotion} \longrightarrow \text{Thought} \longrightarrow \text{Decision / Irrevocable Action}$$
- **The Bracket Taxonomy:** Use only the 5 approved bracket tags:
  1. `[PRESERVE]` — Acknowledge strong prose and state why it works.
  2. `[CUT]` — Identify redundant, pre-empted, or tell-heavy sentences.
  3. `[REORDER]` — Mark text that belongs elsewhere in the sequence.
  4. `[STRUCTURAL NOTE: ...]` — Explain narrative logic, beat gaps, or pacing mechanics.
  5. `[DRAFT SUGGESTION: ...]` — Provide a rough draft bridging missing beats in the author's voice, explicitly inviting the author to rewrite it in their own words.
- **Actionable rewrite checklist:** Conclude with a bulleted Summary of Structural Changes.

## Context
Execute the mechanical context packer:
```bash
node scripts/pack-bracket.js <scene_or_file>
# or:
node scripts/soundingboard.js pack bracket <scene_or_file>
```
Use the resulting context block (`ACTIVE SCENE DRAFT`, `SCENE CARD & COMMANDMENTS`, `VOICE ANCHOR`, `CANON FACTS`) as your working memory.

## Process
1. **Analyze Cause-and-Effect Flow:**
   - Map each micro-beat: Action $\rightarrow$ Reaction.
   - Check if the turning point is Action vs. Revelation.
   - Check if character feelings occur before the sensory trigger (e.g. feeling guilt before the accusation, or relief before the danger passes).
2. **Draft the Structural Overview:**
   - Summarize current flow vs. revised cause-and-effect order.
3. **Present Chronological Markup:**
   - Step through the revised scene flow chronologically.
   - Interleave the author's verbatim prose with bracket tags (`[PRESERVE]`, `[CUT]`, `[REORDER]`, `[STRUCTURAL NOTE: ...]`, `[DRAFT SUGGESTION: ...]`).
4. **Compile Summary of Structural Changes:**
   - Provide a concise checklist of decisions for the author's rewrite desk.

---

## Output format

```markdown
### 📐 Structural Overview: Cause-and-Effect Flow
- **Current Flow:** [Summary of current beat progression and where causality breaks]
- **Sequencing Diagnosis:** [Specific emotional or causal sequencing misalignment]
- **Revised Order:** [Bullet list of the revised beat sequence]

---

### 📝 Chronological Bracket Markup

[Drafted or preserved author prose...]
[PRESERVE: This opening physical detail immediately grounds the reader in visceral sensory texture.]

[CUT: Pre-empts the emotional impact of the discovery before the character has opened the envelope.]

[STRUCTURAL NOTE: Cause-and-effect requires Sensation before Cognition. Show her breath catch before she analyzes the seal.]

[DRAFT SUGGESTION: "Her knuckles whitened against the brass latch." (Draft suggestion — adapt into your own words)]

[Preserved author prose continuing...]

---

### ✅ Summary of Structural Changes
- **Cuts:** [List of cut sections]
- **Reorders:** [List of reordered beats]
- **Missing Beats Added:** [List of new bridging beats]
- **Key Decision for Author:** [Core choice for the rewrite pass]
```
