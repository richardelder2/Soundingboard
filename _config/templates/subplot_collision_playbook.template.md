# Subplot Collision & Crisis Reversal Playbook

## When this applies
The author is writing or planning a major turning point (Act 2B, Midpoint, or Act 2 Climax) and needs narrative propulsion, irreversible stakes, or an authentic crisis point. Common triggers:
- *"The plot feels too predictable; crash two storylines together."*
- *"I need a major crisis or turning point for the midpoint/climax."*
- *"How can my subplot create a Best Bad Choice for the protagonist?"*
- *"Make the secondary problem ruin the primary plan."*

## What good output looks like
- **The Core Turning Point Principle:** Great fiction avoids clean, single-track complications where the hero fights one enemy at a time. The most devastating, human crises occur when **Subplot B crashes directly into Main Plot A**, forcing an impossible prioritization.
- **Three Collision Archetypes:**
  1. *The Resource Drain:* A sudden flare-up in the secondary thread burns the exact currency, weapon, favor, or time needed to execute the main plot's objective.
  2. *The Secret Breach / Alliance Shatter:* An investigation or indiscretion in the subplot exposes a hidden lie, destroying trust or blowing cover in the main quest.
  3. *The Irreconcilable Simultaneous Deadline:* The protagonist is presented with two catastrophic emergencies at the same hour—protecting one guarantees the failure of the other.
- **Enforces Moral Ambivalence:** Per Layer 1 of our authenticity directive, the protagonist must make a choice that leaves an ethical stain, a pyrrhic cost, or a consequence the reader can debate.

## Context
Execute the mechanical context packer:
```bash
node scripts/pack-subplot-collision.js <chapter_number>
# or:
node scripts/soundboard.js pack subplot-collision <chapter_number>
```
Use the output (`TARGET CHAPTER BEATS`, `ACTIVE SECONDARY THREADS`, `ACTIVE SCENE DRAFT EXCERPT`, `CRISIS & MORAL AMBIVALENCE GUIDELINES`) to find intersecting pressure points.

## Process
1. **Identify the Intersecting Threads:**
   - Primary Plot Objective (e.g. Infiltrate the governor's estate tonight).
   - Secondary Subplot Pressure (e.g. The creditor discovers the protagonist's hideout; the estranged sibling is arrested).
2. **Select the Collision Archetype:**
   - Choose whether the collision causes a Resource Drain, an Alliance Breach, or a Simultaneous Deadline.
3. **Stage the Crisis ("Best Bad Choice"):**
   - Frame the dilemma so there is no painless third option. Both paths demand sacrifice.
4. **Draft the Collision Beat & Turning Point:**
   - Formulate the exact moment of collision and draft 2–3 prose lines of active turning point.

## Output format

```markdown
# 💥 Subplot Collision Architecture: Chapter [XX]

### 🎯 Collision Coordinates
- **Primary Main Plot Goal:** [What the protagonist was trying to achieve]
- **Colliding Subplot (Thread ID):** [T-XX: Thread Title & Immediate Secondary Crisis]
- **Collision Archetype:** [Resource Drain / Secret Breach / Irreconcilable Deadline]

---

### ⚡ The Collision Event: How They Crash Together
[1–2 paragraphs detailing the exact mechanics of the disruption: how the secondary emergency detonates inside the primary mission.]

---

### ⚖️ The Best Bad Choice Dilemma
- **Option 1 (Prioritize Main Plot):** [Achieve primary goal, but suffer catastrophic loss in the subplot]
- **Option 2 (Protect Subplot):** [Save the secondary relationship/resource, but blow the main mission]
- **Moral Ambivalence / Irreversible Cost:** [What permanently breaks or can never be retrieved after this choice?]

---

### ✍️ Drafted Collision Turning Point Beat
> "[2–3 sentences of active prose capturing the exact moment the collision shatters the plan...]"

---

*How would you like the protagonist to decide, or would you like to explore an alternative collision archetype?*
```
