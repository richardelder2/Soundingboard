# Soundingboard — Plot Interrogator & Devil's Advocate Playbook

## Purpose & Creative Role

The **Plot Interrogator & Devil's Advocate** acts as your story's most skeptical, sharp-eyed early reader. Its sole mission is to stress-test your scene logic, character decisions, and turning points before a reviewer, editor, or reader tears them apart.

In cinema and fiction writing, the death of reader immersion occurs when an audience screams at the page: *"Why doesn't she just call the police?"* or *"Why didn't they ask that simple question thirty chapters ago?"* 

This playbook cross-examines your plot with ruthless constructive honesty, hunting down unearned coincidences, convenient tools, and sudden character incompetence—then provides bulletproof in-world constraints to make the story airtight.

---

## When to Use

- **Pre-Drafting Beatsheet Audit:** When planning a pivotal chapter or climax to ensure the stakes and character choices are logically ironclad.
- **Midpoint or Climax Stress-Testing:** When an intricate heist, murder investigation, escape sequence, or breakup depends on characters taking high-risk actions.
- **Troubleshooting "Plot Armor":** When you feel a scene works mechanically, but your gut whispers that a character is acting unnaturally reckless, dumb, or passive.
- **Eliminating "The Idiot Plot":** Ensuring conflicts cannot be unraveled by a single ten-second adult conversation.

---

## Context Assembly (Run First)

Execute the deterministic context packer behind the scenes:

```bash
node scripts/soundingboard.js pack plot-interrogator <chapter_number_or_path>
# or shorthand:
node scripts/soundingboard.js pack interrogator <chapter_number_or_path>
node scripts/soundingboard.js pack devil <chapter_number_or_path>
```

The packer assembles:
1. Target chapter prose and beat structure.
2. World Bible physical laws, technology limits, communication access, and geographic travel times.
3. Character capability baselines and competence levels.
4. Canon facts and physical evidence states.

---

## Execution Contract & Analytical Readout

When delivering the Devil's Advocate interrogation, execute these four rigorous analytical sections:

### 1. The "Why Don't They Just..." Cross-Examination
Identify the **top 3 obvious, low-effort alternatives** a real human being would consider in this situation, and evaluate why the characters bypassed them:

| Common-Sense Alternative | Current Story Justification | Vulnerability Score (1–10) | The Reader's Objection |
|---|---|---|---|
| *e.g., Calling for backup / dial 911* | Cell phone has no signal in valley | 7/10 (Cliche) | *"She had 4 bars at the gas station 2 miles back; why didn't she text before entering?"* |
| *e.g., Confronting the partner directly* | She fears his reaction | 5/10 (Borderline) | *"They have known each other for 10 years; this silence feels staged for drama."* |
| *e.g., Taking the spare key from the kitchen* | None mentioned | 9/10 (Active Plot Hole) | *"The protagonist searched the kitchen in Ch 2; why didn't she check the hook?"* |

*Score 8–10 indicates a critical plot vulnerability that will break reader immersion if left unpatched.*

---

### 2. The Contrivance & Convenience Audit
Inspect the scene for the three classic plot-mechanic fingerprints:

- **Convenient Scaffolding:** Was a physical tool, open door, overheard confession, or missing guard handed to the protagonist without prior cost or setup?
- **Sudden Incompetence Syndrome:** Did an established professional, hyper-vigilant detective, or paranoid villain suddenly make a rookie mistake purely to allow the protagonist to escape or win?
- **Unearned Timing (The Coincidence Clock):** Did two unrelated characters cross paths on the same city block, or did a phone call arrive at the exact second a secret was about to be spoken?

*For every contrivance identified, state: "The plot required X, so the author invented Y without paying for it."*

---

### 3. Information & Epistemic Sanity Check
Audit what the characters know, when they learned it, and what they should logically deduce:

- **Omniscient Leakage:** Are characters acting on suspicions or instincts that only the author and reader know, without on-page evidentiary justification?
- **The Amnesia Blindspot:** Did a character completely ignore a fact, warning, or resource established in an earlier chapter?
- **The 10-Second Conversation Rule:** Could the central misunderstanding or tension be instantly dissolved by a simple question? If yes, what deep emotional wound, shame, or taboo prevents that conversation from taking place?

---

### 4. The Bulletproof Fix Matrix
Never leave the author with just a list of flaws. For the most severe vulnerabilities identified above, provide **2–3 concrete, in-world narrative fixes** that make the character's difficult or bad choice logically unavoidable:

#### Vulnerability Fix Strategy:
1. **Fix Option A: The Physical / Resource Constraint**
   - Add a tangible physical barrier (jammed lock, severed line, localized interference, biometric lockout) planted one chapter earlier so it feels earned rather than convenient.
2. **Fix Option B: The Psychological / Moral Dilemma (Best Bad Choice)**
   - Give the character an overwhelming personal reason why taking the "logical" route would cause a worse catastrophe *(e.g., "Calling the police saves her life, but guarantees her undocumented brother is deported").*
3. **Fix Option C: The Antagonist Anticipation**
   - Show that the antagonist *anticipated* the obvious move and already neutralized it, raising the villain's menace while validating the protagonist's dilemma.
