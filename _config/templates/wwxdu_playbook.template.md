# WWXDU ("What Would X Do Unexpectedly") Drop-Test Playbook

## When this applies
The author wants to stress-test a character's decision-making, explore surprising character choices under pressure, or uncover unpredictable behavior in crisis. Common triggers:
- *"What would [Character Name] do if [Scenario] happened?"*
- *"Run a WWXDU scenario drop-test with [Character Name]."*
- *"I want to test [Character Name]'s moral limits in an extreme situation."*
- *"Drop-test [Character Name] into an unexpected crisis to see how they react."*

## What good output looks like
- **Defy the Generic Default:** Characters under genuine stress should not react predictably or heroically. They should rely on survival instincts, defense mechanisms, idiosyncratic moral compromises, or surprising vulnerability.
- **Dynamic Roleplay (3–4 rounds):** Engage in an immediate, first-person interactive roleplay in character voice, reacting realistically to the shifting scenario beats.
- **Structured Scenario Logcard:** Once the scenario concludes, synthesize:
  1. *Immediate Reaction & Emotional Register:* How the character reacted before thinking.
  2. *Key Tactical Decisions:* What unexpected choices or compromises they made.
  3. *Dialogue Hooks:* 2–3 raw, authentic lines spoken during the scenario suitable for direct inclusion in the novel.

## Context
Execute the mechanical context packer:
```bash
node scripts/pack-wwxdu.js <character_name>
# or:
node scripts/soundingboard.js pack wwxdu <character_name>
```
Use the output (`TARGET CHARACTER SHEET`, `ESTABLISHED CANON FACTS`, `VOICE EXEMPLARS`) to anchor the character's relationships and capabilities.

## Process
1. **Initialize the Drop-Test Scenario:**
   - Define the high-stress premise (e.g. stranded in hostile territory, caught in a public betrayal, offered an irresistible bribe).
2. **Conduct 3–4 Rounds of Scenario Dialogue:**
   - Maintain rigorous in-character voice.
   - Force difficult choices on the character (physical stakes, moral dilemmas, status loss).
3. **Compile Scenario Logcard:**
   - Synthesize the narrative discoveries from the interaction.
   - Offer to append the logcard to `stages/01_onboarding/output/characters/<name>.md`.

## Output format

### Phase 1: In-Scenario Roleplay
```markdown
**[CHARACTER NAME]** [describing immediate physical reaction / spoken dialogue]:
"[1–3 sentences of urgent, authentic dialogue reflecting stress and tactical assessment.]"
```

### Phase 2: Post-Scenario Logcard
```markdown
## 🧪 Scenario Log: [Scenario Description]
*Character: [Character Name]*

### 1. Immediate Reaction & Reflex
- **Initial Affect:** [Panic / Cold Calculation / Defiant Sarcasm / Paralysis]
- **First Physical Instinct:** [What they reached for, looked at, or attempted to conceal]

### 2. Unexpected Decisions & Moral Pivot
- **Core Choice:** [The surprising decision the character made under pressure]
- **Cost Accepted:** [What they were willing to sacrifice or risk]
- **Plot Ramification:** [How this shifts their arc or creates downstream complications]

### 3. 🎯 High-Impact Dialogue Hooks
> 1. "[Memorable in-character quote from the exchange]"
> 2. "[Second quote showing voice and conflict]"

---

*Would you like to append this Scenario Log directly to `stages/01_onboarding/output/characters/[character].md`?*
```
