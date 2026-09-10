# Sensory Expansion & Setting Viscosity Playbook

## When this applies
The author or diagnostic review indicates that a passage is visually abstract, generic, or suffering from "white room syndrome." Common triggers:
- *"This scene feels floaty and needs sensory grounding."*
- *"Bloom the sensory details in this description."*
- *"Add texture, sound, or temperature to this setting."*
- *"The environment feels generic; make it more viscous and tactile."*

## What good output looks like
- **Zero Passive Perception Filters:** Eliminate filter words ("he saw", "she heard", "they felt the chill"). Describe the sensory phenomenon directly acting on the physical world ("frost rimmed the copper latch").
- **Targeted Sensation Budget:** Per `_config/narrative_authenticity.md`, do not spray all senses simultaneously. Focus deeply on 1–2 specific physical registers earned by the moment.
- **Sensory Registers:**
  1. *Scent & Taste (Olfactory/Gustatory):* Burned ozone, damp lime, bitter chicory, oxidized iron.
  2. *Sound & Acoustics (Auditory):* Resonant echoes, muffling velvet, gravel grind, rhythmic piston clatter.
  3. *Tactile & Temperature (Thermal/Haptic):* Gritty stone, clammy wool, grease-filmed glass, biting draft.
  4. *Visceral Sight & Shadows (Visual/Kinetic):* Jagged silhouettes, yellowed tungsten, peeling lacquer, geometric angles.
- **Two Rewritten Options:**
  - *Option 1 (Subtle & Integrated):* Economical sensory anchors woven seamlessly into character movement.
  - *Option 2 (Viscous & Descriptive):* Rich, immersive atmospheric immersion establishing a vivid sense of place.

## Context
Execute the mechanical context packer:
```bash
node scripts/pack-sensory-bloom.js [location_or_chapter]
# or:
node scripts/soundingboard.js pack bloom [location_or_chapter]
```
Use the output (`PROJECT SENSORY LEXICON`, `IN-WORLD TERMINOLOGY`, `SETTING SHEET`, `RECENT SCENE CONTEXT`, `AUTHENTICITY SENSATION RULES`) to pull approved sensory words.

## Process
1. **Identify the Sensory Deficit:**
   - What register is absent? (Often auditory, haptic, or olfactory textures).
2. **Consult In-World Sensory Lexicon:**
   - Draw from the specific materials, scents, and textures native to this setting.
3. **Draft Alternative Expansions:**
   - Rewrite the passage to make the environment actively push back against the protagonist's body and senses.

## Output format

```markdown
### 🌿 Sensory Diagnosis & Target Register
- **Setting Anchor:** [Location Name / Room / Environment]
- **Target Sensory Focus:** [e.g. Tactile & Temperature / Sound & Acoustics]
- **Eliminated Tells:** [e.g. Removed "he felt the room was cold" and "she noticed the dark shadows"]

---

### ✍️ Alternative 1: Subtle Sensory Grounding (Lean & Active)
> [2–3 sentences integrating tactile or auditory anchors directly into character motion...]

---

### ✍️ Alternative 2: Viscous Atmospheric Immersion (Rich & Evocative)
> [1–2 expanded paragraphs creating dense physical texture and environmental viscosity...]

---

*Which level of sensory density best matches the escalation contour of this scene?*
```
