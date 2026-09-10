# Character Voice Finder Interview Playbook

## When this applies
The author wants to interrogate a character, test dialogue cadences, or discover a character's distinct voice, dialect, and speech habits. Common triggers:
- *"I want to interview [Character Name] to hear how they talk."*
- *"Let's do a voice test with [Character Name]."*
- *"I need to establish [Character Name]'s linguistic rules and speech mannerisms."*

## What good output looks like
- **Unwavering Character Register:** During the interview, stay completely in character. Never slip into meta-assistant speech. Adopt the character's vocabulary, status posture, defense mechanisms, and world view.
- **Natural Dialogue Length:** Keep in-character responses punchy and human (1–3 sentences per turn), leaving room for the author to interrogate.
- **Actionable Voice Rules:** Conclude with a concrete Stylistic Voice Profile covering:
  1. Sentence Structure (clipped vs. meandering, hypotactic vs. paratactic, formal vs. colloquial).
  2. Vocabulary & Dialect (favored idioms, technical jargon, regional registers, taboo words).
  3. Behavioral Mannerisms (physical tics, speech rhythms, interruptions, pauses).

## Context
Execute the mechanical context packer:
```bash
node scripts/pack-interview.js <character_name>
# or:
node scripts/soundingboard.js pack interview <character_name>
```
Use the output (`TARGET CHARACTER SHEET`, `VOICE EXEMPLARS & STYLE GUIDE`, `CHARACTER ARC MAP`) to calibrate the character's psychological disposition and dialect.

## Process
1. **Interactive In-Character Roleplay (3–4 rounds):**
   - Respond directly to the author's statements/questions in the character's authentic voice.
   - Maintain appropriate status tension (e.g. evasive, hostile, deferential, sarcastic).
   - Let speech quirks, colloquialisms, and emotional undercurrents appear organically in responses.
2. **Linguistic & Stylistic Extraction:**
   - Once the interview rounds conclude (or when the author indicates they are satisfied), analyze the exchange for linguistic patterns.
3. **Synthesize Stylistic Voice Profile:**
   - Formalize the character's speech rules into a structured markdown profile card.
   - Offer to append the profile card directly to the character's markdown sheet in `stages/01_onboarding/output/characters/<name>.md`.

## Output format

### Phase 1: During Interview
Speak strictly in-character:
```markdown
**[CHARACTER NAME]**: "[1–3 sentences of dialogue in character voice, reflecting immediate attitude and physical tension.]"
```

### Phase 2: Post-Interview Voice Card
```markdown
## 🗣️ Stylistic Voice Profile: [Character Name]

### 1. Sentence Architecture & Rhythm
- **Cadence:** [e.g. Short, staccato clauses; avoids conjunctions; speaks in imperative fragments.]
- **Pacing:** [e.g. Pauses before difficult admissions; speaks rapidly when challenged on status.]
- **Grammar & Register:** [e.g. Working-class vernacular with occasional sharp technical precision.]

### 2. Vocabulary & Dialect Rules
- **Signature Lexicon:** [3–5 characteristic words, expressions, or colloquialisms]
- **Avoided / Forbidden Language:** [Types of words this character would never use, e.g. flowery adjectives, apologies]
- **Subtextual Crutch:** [Phrases used to deflect, dismiss, or mask vulnerability]

### 3. Physical Cues & Speech Mannerisms
- **Accompanying Tics:** [Physical actions performed while speaking, e.g. cleans glasses, checks exits, fidgets with coins]
- **Interruption Behavior:** [Does the character wait, speak over others, or retreat into silence?]

---

*Shall I append this Voice Profile directly to `stages/01_onboarding/output/characters/[character].md` and update your voice guide?*
```
