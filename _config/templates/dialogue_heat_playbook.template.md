# Dialogue Heat & Tension Playbook

## When this applies
The author notes that a dialogue exchange feels flat, informational, overly polite, or lacking narrative friction. Common triggers:
- *"This conversation is too polite; make it tenser."*
- *"Heat up this dialogue exchange between [Character A] and [Character B]."*
- *"The characters are just exchanging exposition; make them fight or conceal something."*
- *"Add subtext and status play to this scene."*

## What good output looks like
- **No On-the-Nose Dialogue:** Characters must not say exactly what they mean or feel.
- **Asymmetric Conflict:** Dialogue friction stems from conflicting underlying desires, concealed information, or status dominance transactions.
- **Two Distinct Intensities:** Provide two alternative rewrites:
  1. *Subtle / Smoldering:* Chilled restraint, passive-aggressive civility, unspoken resentment.
  2. *Acute / High-Friction:* Direct challenge, sharp status cuts, overt evasion or aggressive deflection.
- **Integrated Micro-Actions:** Ground the speech in physical blocking and micro-actions rather than empty dialogue tags (avoid "he said angrily").

## Context
Execute the mechanical context packer:
```bash
node scripts/pack-dialogue-heat.js [chapter_or_snippet] [character_names...]
# or:
node scripts/soundboard.js pack heat [chapter_or_snippet] [character_names...]
```
Use the output (`ACTIVE SCENE DRAFT EXCERPT`, `SPEAKER CHARACTER PROFILES`, `AUTHENTICITY GUIDELINES`) to establish each speaker's voice, status, and secrets.

## Process
1. **Diagnose the Flatness Mode:**
   - *Issue A: Information Dump.* Characters are reciting facts both already know.
   - *Issue B: Cooperative Agreement.* Characters agree too quickly without extracting a price.
   - *Issue C: Symmetrical Status.* Neither character asserts authority, vulnerability, or defiance.
2. **Apply the Conflict Lever:**
   - **Mode 1 (Subtext & Double Meanings):** The topic under discussion is a proxy for something dangerous (e.g. arguing about a cracked teacup instead of a broken marriage).
   - **Mode 2 (Status Play & Dominance):** One character claims conversational dominance (interrupting, occupying physical space, demanding repetition) while the other resists or subverts it.
   - **Mode 3 (Avoidance & Deflection):** One character desperately pivots away from a core question, changing the subject or attacking the interrogator's motive.
3. **Draft Alternative Rewrites:**
   - Generate two polished dialogue blocks demonstrating different heat levels, integrating behavioral tics and physical business.

## Output format

```markdown
### 🎯 Dialogue Diagnosis
- **Underlying Conflict:** [What are the characters actually fighting over underneath the words?]
- **Chosen Tension Mode:** [Subtext / Status Play / Avoidance]

---

### 🔥 Rewrite Alternative 1: Smoldering / Cold Friction (Restrained)
> [Drafted dialogue block with embedded micro-actions and subtextual tension...]

*Mechanics applied: [Brief bullet on how silence, deflection, or physical business carries the subtext]*

---

### 🔥 Rewrite Alternative 2: Acute Friction / Status Clash (High Intensity)
> [Drafted dialogue block with sharp cuts, overt interruptions, or status maneuvers...]

*Mechanics applied: [Brief bullet on status shifts and conversational dominance]*

---

*Which intensity level fits the pacing of this chapter better, or should we blend them?*
```
