# Lore & Worldbuilding Brainstorm Playbook

## When this applies
The author wants to develop, deepen, or brainstorm new worldbuilding lore, subplots, or systemic rules. Common triggers:
- *"I need to brainstorm how the magic system or tech works in this district."*
- *"Let's develop a secret faction or guild backstory."*
- *"I want to flesh out a hidden motivation or historical secret for a character."*
- *"Help me brainstorm lore that creates immediate scene conflict."*

## What good output looks like
- **Show, Don't Lecture:** Every lore element must be designed with an immediate dramatic hook or sensory consequence. Never produce pure encyclopedia filler.
- **Tied to Conflict:** Lore must exert mechanical or emotional pressure on the protagonist.
- **Structured Lore Card:** Includes:
  1. A vivid, concise Lore Summary.
  2. Hidden Secrets & Subtext (what the world believes vs. what is actually true).
  3. 3 concrete Drafting Prompts (active scene beats demonstrating this lore through character interaction rather than exposition dumps).
- **Adheres to Authenticity:** Strictly complies with `_config/narrative_authenticity.md` (no faux-profound AI phrases, no generic fantasy/sci-fi tropes).

## Context
Execute the mechanical context packer:
```bash
node scripts/pack-brainstorm.js [topic_or_keyword]
# or:
node scripts/soundboard.js pack brainstorm [topic_or_keyword]
```
Use the output (`WORLD BIBLE`, `GENRE BIBLE & TROPE STACK`, `IN-WORLD TERMINOLOGY`, `CAST OVERVIEW`) as your creative constraints.

## Process
1. **Clarify the Core Tension:**
   - What is the rough premise or element?
   - What is the aesthetic tone (e.g., clinical and bureaucratic, gritty and decaying, aristocratic and decadent)?
   - How does this element restrict, endanger, or tempt the protagonist?
2. **Design Secrets & Asymmetric Information:**
   - Establish what public propaganda/folklore says about this element versus the dangerous reality known only to a few.
3. **Generate Active Demonstration Beats:**
   - Formulate 3 distinct scene beats where a character interacts with this lore physically:
     - Beat 1: Sensory encounter (sight, smell, sound, physical malfunction).
     - Beat 2: Social/Status consequence (a law broken, an etiquette breached, a taboo tested).
     - Beat 3: Crisis point (a character forced to rely on this volatile lore element under pressure).

## Output format
Present the lore card to the author:

```markdown
# Brainstorm Card: [Title of Lore Element / Secret]

## 📜 Lore Summary
[2–3 vivid, visceral paragraphs detailing the element, its physical manifestations, and its systemic logic.]

## 🗝️ Secrets & Subtext
- **Public Belief:** [What ordinary people or institutions in-world assume]
- **The Hidden Truth:** [The underlying flaw, suppressed history, or dark cost]
- **Dramatic Vulnerability:** [How this can be weaponized against the characters]

## 🎬 Active Drafting Prompts (Zero-Exposition Demonstration)
1. **The Sensory Shock:** [A concrete scene beat where the protagonist encounters this element through physical details without explanation]
2. **The Status Transaction:** [A beat where two characters negotiate or conflict over access, contraband, or knowledge of this element]
3. **The Mechanical Cost:** [A beat where using or encountering this element inflicts an immediate physical or psychological toll]

---

*Would you like to refine any of these details, or should we save this directly to your world bible?*
```
