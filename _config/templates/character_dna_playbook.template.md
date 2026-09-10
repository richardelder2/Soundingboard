# Character DNA & Persona Mashup Playbook

## When this applies
The author wants to create, brainstorm, or deepen a character by combining traits from famous fictional characters, historical figures, or real-world people ("X meets Y", "character DNA", archetype cross-breeding). Common triggers:
- *"I have an idea for a character who is like [Character A] meets [Character B]."*
- *"Help me build this character's DNA based on [Famous Figure]."*
- *"What combination of famous characters could inspire my mentor/antagonist?"*
- *"I want to base this character on [Real Person], but adapt them into my fantasy/sci-fi world."*

## What good output looks like
- **The Core Anti-AI Principle (Incongruity & Friction):**
  AI characters are flat and smooth—every personality trait fits together neatly. Real human characters are amalgams of *conflicting* influences. A great character DNA profile deliberately pairs traits that fight each other.
- **Three-Donor Register Deconstruction:**
  Never copy a character wholesale. Instead, harvest 3 distinct behavioral registers:
  1. *Donor 1: The Cadence & Temperament Donor (Voice & Status):* How they speak, their conversational tempo, their status posture, their defense against intimacy.
  2. *Donor 2: The Psychological Wound & Lie Donor (The Engine):* What past trauma taught them to believe a lie about the world, and what external goal they chase to protect themselves.
  3. *Donor 3: The Somatic & Real-World Quirk Donor (The Flesh):* A peculiar physical habit, nervous tic, or eccentric behavior stolen from a real-world person or historical figure.
- **The Incongruity Engine (The Contradiction):**
  Directly populates line 19 of `character.template.md` (`Contradiction: the trait that doesn't fit the type`).
- **Setting Transmutation:**
  Strips modern cultural references and clothes the composite in the novel's specific worldbuilding, technology level, and vocabulary (from `world_bible.md` and `tell_allowlist.md`).
- **Introduction Mode Planned:**
  Plans an active, in-motion introduction (in-action, in-dialogue) and bans static physical-description dumps.

## Context
Execute the mechanical context packer:
```bash
node scripts/pack-character-dna.js [character_name]
# or:
node scripts/soundingboard.js pack dna [character_name]
```
Use the output (`TARGET CHARACTER SCHEMA`, `WORLD BIBLE`, `GENRE TROPE STACK`, `IN-WORLD VOCABULARY`, `CURRENT CAST ROSTER`) to ground the character in your universe and ensure no voice/role overlap with existing cast members.

## Process
1. **Interview the Reference Pool (The Donors):**
   - Ask the author for their 2–3 reference points (fictional characters, public figures, or people they know).
   - Clarify which register each donor provides:
     - *Voice Donor:* Who gives them their speech rhythm?
     - *Wound Donor:* Who gives them their emotional flaw or baggage?
     - *Quirk Donor:* What physical habit or peculiar contradiction are we stealing?
2. **Locate the Internal Friction (The Contradiction):**
   - Identify where Donor 1 and Donor 2 create an irreconcilable internal paradox (e.g. an aristocratic pedant who panics when their hands get dirty, but who secretly craves street brawls).
3. **World Transmutation Pass:**
   - Translate external references into the in-world equivalent:
     - Replace modern professions with in-world castes or guilds.
     - Replace modern slang with in-world vocabulary from `tell_allowlist.md`.
4. **Synthesize Canonical Character Artifact:**
   - Format into the exact structure of `_config/templates/character.template.md`.
   - Offer to write directly to `stages/01_onboarding/output/characters/<name>.md`.

## Output format

```markdown
# Character DNA Synthesis: [Character Name]

### 🧬 The Genetic Donor Blueprint
- **Cadence & Temperament Donor:** [Famous Character / Person A] ➔ *Borrowed Register:* [e.g. Rapid-fire cynical wit, defensive sarcasm]
- **Wound & Moral Lie Donor:** [Famous Character / Person B] ➔ *Borrowed Register:* [e.g. Terrified of being abandoned, hoards leverage]
- **Somatic & Quirk Donor:** [Real Person / Character C] ➔ *Borrowed Register:* [e.g. Constantly picks at dry paint on knuckles, never turns back to doors]

---

### ⚡ The Incongruity Engine (The Contradiction)
- **The Paradox:** [Where the two halves fight inside their head]
- **On-Page Manifestation:** [A concrete behavior demonstrating this contradiction without explanation]

---

### 📄 Canonical Character Profile Sheet (`character.md`)

```markdown
---
type: CharacterProfile
name: "[Authoritative Name]"
role: [protagonist | antagonist | love interest | mentor | foil | ally]
arc_type: [positive change | flat | disillusionment | corruption | static]
status: Seeded
last_modified: [YYYY-MM-DD]
---

# [Character Name]

## Engine
- **Want (external, concrete):** [What they pursue on the page]
- **Need (internal, unrecognized):** [What would actually heal or mature them]
- **Wound:** [The specific event that taught them their false worldview]
- **The lie they believe:** [The defensive belief installed by the wound]
- **The truth (arc destination):** [The reality they must accept or perish]
- **Competence:** [What they are genuinely masterclass at — shown in action]
- **Contradiction:** [The specific trait that breaks the archetype stereotype]

## Surface
- **Introduction mode:** [in-action | in-dialogue — strictly NO static appearance dumps]
- **Introduction Scene Concept:** [1–2 sentences showing them mid-motion]
- **What others get wrong about them:** [The false first impression they cultivate]
- **Physical facts:** [Only 2–3 visceral, relevant physical markers for canon.md]

## Voice (feeds voice_exemplars.md)
- **Register:** [Cadence, rhythm, favored grammatical structure, words they forbid themselves from using]
- **Sample Lines:**
  > "[Sample line 1 showing status and cadence]"
  > "[Sample line 2 demonstrating subtext and the lie]"

## Relationships
| With | Dynamic | Latent Friction / Asymmetric Stakes |
|---|---|---|
| [Cast Member 1] | [e.g. Indispensable yet grating] | [Underlying secret or leverage] |
```

---

*Would you like to adjust any of these donor traits before we write this character sheet directly to `stages/01_onboarding/output/characters/[name].md`?*
```
