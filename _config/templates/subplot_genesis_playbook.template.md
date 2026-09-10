# Subplot Genesis & Anti-Default Architecture Playbook

## When this applies
The author is in Stage 02 planning, outlining, or early drafting, and needs to develop secondary storylines to break narrative monomania and single-track plotting. Common triggers:
- *"I need to develop subplots for this novel."*
- *"Help me architect secondary threads that don't feel like copies of the main plot."*
- *"Add B-stories and C-stories to break single-track AI plotting."*
- *"Design subplots to ground the characters in everyday reality."*

## What good output looks like
- **The Core Authenticity Requirement (Layer 1):** A novel must carry at least two subplots; a novella at least one. At least **one subplot must be thematically loose or contrasting** (not every storyline exists to serve the main theme).
- **Three Required Subplot Typologies:**
  1. *Type A: The Contrasting / Mundane Subplot (The Anti-AI Anchor):* A practical, logistical, financial, or domestic irritation that has nothing to do with saving the world or the main romance (e.g. debt to an unforgiving dockmaster, failing air scrubbers, sibling rivalry over an inheritance, a persistent minor illness).
  2. *Type B: The Thematic Counter-Weight:* Explores the story's controlling idea from the opposite perspective (e.g. if the main plot explores the glory of duty, the subplot explores the silent grief of those abandoned by dutiful people).
  3. *Type C: The Autonomous Foil:* A secondary character pursuing their own goal with its own stakes that periodically cross the protagonist's path.
- **Anti-Default Rule (§10):** For each subplot candidate, reject the first cliché that comes to mind (e.g. standard sidekick love triangle, predictable traitor reveal) and propose statistically rarer, human alternatives.
- **Concrete Scheduling:** Each subplot must declare:
  - Thread ID & Short Name
  - Introduction Chapter
  - Key Development Milestone Chapters
  - Target Resolution Chapter & Ending Mode

## Context
Execute the mechanical context packer:
```bash
node scripts/pack-subplot-genesis.js [focus_or_theme]
# or:
node scripts/soundboard.js pack subplot-genesis [focus_or_theme]
```
Use the output (`FOOLSCAP`, `MACRO OUTLINE SPINE`, `EXISTING NARRATIVE THREADS LEDGER`, `CAST PROFILES`, `MANDATORY SUBPLOT RULES`) as your baseline.

## Process
1. **Analyze Main Plot Monomania:**
   - What is the single-track spine of the story?
   - What mundane aspects of living are being ignored by the characters because of the main crisis?
2. **Draft Candidates Across the 3 Typologies:**
   - Generate Candidate 1: The Contrasting / Mundane problem (life continuing in the background).
   - Generate Candidate 2: The Thematic Counter-Weight.
   - Generate Candidate 3: The Autonomous Foil.
3. **Execute Anti-Default Discard:**
   - Check if any candidate falls into generic genre tropes (e.g. "secret crush on best friend" in fantasy, or "rival detective wants my badge" in crime). Discard the generic default and replace with a grounded human friction point.
4. **Schedule Across the Manuscript:**
   - Assign Introduction, Development, and Target Resolution points in `threads.md`.

## Output format

```markdown
# Subplot Architecture Plan

### 🧬 Monomania Analysis & Contrasting Strategy
- **Main Plot Spine:** [Brief recap of primary quest/conflict]
- **Thematic Core:** [The central controlling idea]
- **Thematic Blindspot:** [What everyday or counter-balancing reality is missing?]

---

### 🧵 Three Architected Subplots

#### Subplot 1 (The Mundane / Anti-AI Anchor): [Title, e.g., The Creditor's Leverage]
- **Typology:** Contrasting / Mundane
- **Engine & Stakes:** [A practical, unheroic problem creating persistent background friction]
- **Anchor Character(s):** [Who drives or complicates this thread?]
- **Anti-Default Choice:** Discarded standard [generic trope]; selected [grounded human complication].
- **Milestones:** Introduced in Ch [X] ➔ Escalated in Ch [Y] ➔ Target Resolution in Ch [Z].

#### Subplot 2 (The Thematic Counter-Weight): [Title, e.g., The Cost of Retribution]
- **Typology:** Thematic Counter-Weight
- **Engine & Stakes:** [How this explores the opposite side of the controlling idea]
- **Anchor Character(s):** [Secondary character carrying this arc]
- **Milestones:** Introduced in Ch [X] ➔ Climax in Ch [Y] ➔ Target Resolution in Ch [Z].

#### Subplot 3 (The Autonomous Foil): [Title, e.g., The Smuggler's Secret Cargo]
- **Typology:** Autonomous Foil
- **Engine & Stakes:** [An independent goal that periodically interferes with the main quest]
- **Anchor Character(s):** [Character Name]
- **Milestones:** Introduced in Ch [X] ➔ Collision in Ch [Y] ➔ Target Resolution in Ch [Z].

---

### 📋 Proposed Ledger Entries for `threads.md`
```markdown
| Thread ID | Description | Type | Introduced | Latest Development | Target Resolution | Status |
|---|---|---|---|---|---|---|
| T-02 | [The Creditor's Leverage] | mundane | ch 2 | ch 2 | ch 11 | open |
| T-03 | [The Cost of Retribution] | thematic | ch 4 | ch 4 | ch 16 | open |
| T-04 | [The Smuggler's Secret Cargo] | foil | ch 3 | ch 3 | ch 14 | open |
```

---

*Would you like to adjust any of these subplots before we record them into your thread ledger?*
```
