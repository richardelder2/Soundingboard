# Getting Unstuck Playbook

## When this applies
The author expresses writer's block, uncertainty about what happens next, or states that a scene feels slow, flat, or trapped. Common triggers:
- *"I'm stuck on Chapter 3."*
- *"I don't know where to take this scene next."*
- *"This interaction feels sluggish and isn't going anywhere."*
- *"I need a twist or something unexpected to break the deadlock."*

## What good output looks like
- **Diagnose before prescribing:** Identify the specific narrative failure mode (pacing drag, spatial/geographical stagnation, lack of emotional friction, or predictability) before generating ideas.
- **Zero empty cheerleading:** Never provide generic encouragement ("You're doing great! Try brainstorming!"). Offer concrete structural solutions grounded in craft theory.
- **High-viscosity narrative forks:** Provide exactly 3 distinct, divergent creative moves (Option A, Option B, Option C), each complete with:
  1. A evocative title.
  2. The dramatic logic / mechanism.
  3. 2–3 drafted opening prose lines demonstrating active sensory immersion and avoiding AI tells.

## Context
Execute the mechanical context packer:
```bash
node scripts/pack-unstuck.js [chapter_number]
# or:
node scripts/soundboard.js pack unstuck [chapter_number]
```
Use the resulting context block (`ACTIVE CHAPTER DRAFT TAIL`, `SCENE BEATSHEET`, `PROJECT CANON`, `STRUCTURE PLAN`) as your working memory. Do not manually re-read the entire workspace.

## Process
1. **Identify the Roadblock Category:**
   - **Type 1 (Pacing):** Scene has lost propulsion; characters are deliberating or talking without escalating stakes. (Solution: shorten sentence cadence, introduce immediate physical deadline or irreversible choice).
   - **Type 2 (Geography/Transition):** Characters are physically stuck in a room/holding pattern. (Solution: sensory pivot, environmental disruption, forced relocation).
   - **Type 3 (Conflict/Friction):** Characters are too agreeable or polite. (Solution: status play, expose a hidden secret, trigger an asymmetric misunderstanding).
   - **Type 4 (Surprise/Complication):** Scene is unfolding predictably according to plan. (Solution: external complication, system malfunction, third-party intrusion, contradictory discovery).
2. **Cross-Check Canon & Structure Plan:**
   - Ensure none of the proposed directions violate hard facts in `canon.md`.
   - Align with the obligatory scenes and authenticity dials declared in `structure_plan.md`.
3. **Formulate 3 Narrative Forks:**
   - **Option A (Internal / Psychological Escalation):** A character breaks character-level consensus or reveals an uncomfortable truth.
   - **Option B (External / Environmental Pressure):** Physical space, weather, tech failure, or an arriving antagonist alters the immediate problem.
   - **Option C (Lateral / Reversal):** An unexpected discovery or misdirection that flips the underlying assumption of the scene.
4. **Draft Prose Exemplars:** Write 2–3 lines of prose showing how the scene re-engages, following `_config/narrative_authenticity.md` (no generic body cliches like "shivers down spines" or "air grew thick").

## Output format
Present the diagnosis and forks to the author:

```markdown
### 🔍 Diagnosis: [Roadblock Category, e.g. Pacing Drag / Polite Stalemate]
[1–2 sentences pinpointing why the current draft excerpt lost momentum]

---

### 🔀 Three Narrative Forks Forward:

#### Option A: [Evocative Title, e.g. The Asymmetric Accusation]
- **Mechanism:** [How this breaks the stalemate using character motivation]
- **Prose Sample:**
  > "[2–3 sentences of drafted active prose showing the immediate entry point...]"

#### Option B: [Evocative Title, e.g. Structural Pressure / Environmental Fault]
- **Mechanism:** [The physical complication or intrusion]
- **Prose Sample:**
  > "[2–3 sentences of drafted active prose...]"

#### Option C: [Evocative Title, e.g. The Best Bad Choice Reversal]
- **Mechanism:** [The turn or unexpected disclosure]
- **Prose Sample:**
  > "[2–3 sentences of drafted active prose...]"

---

*Which direction resonates with where you want to take the scene, or would you like to blend elements of two?*
```
