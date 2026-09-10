# Subplot Braiding & Thread Freshening Playbook

## When this applies
The author is preparing to stage or draft a chapter and needs to keep secondary storylines alive, or the audit indicates that a subplot has gone dormant ($\ge 3$ chapters without mention). Common triggers:
- *"I need to weave my subplots into Chapter [N]."*
- *"Which subplots am I neglecting right now?"*
- *"Help me add a secondary thread into this scene without hijacking the main plot."*
- *"Freshen up the B-story before it gets forgotten."*

## What good output looks like
- **Thread Dormancy Discipline:** Subplots must not vanish for large stretches of a book only to reappear at the end. Any thread dormant for $\ge 3$ chapters must receive screen time.
- **Three Non-Intrusive Braiding Levels:**
  1. *Level 1 (Environmental & Physical Texture):* The subplot exists in the physical space of the scene without interrupting dialogue (e.g. an apprentice working on a broken gear in the corner; a character limping or hiding a letter; an unpaid bill lying on the desk).
  2. *Level 2 (Conversational Undercurrent & Subtext):* A secondary concern colors a character's tone, patience, or vocabulary during an unrelated main-plot discussion.
  3. *Level 3 (Tactical Scene Complication):* The secondary thread directly creates a physical micro-obstacle or ticking clock in the middle of the main plot's objective.
- **Zero Narrative Hijacking:** A braid must enrich the scene, not derail its primary value shift.

## Context
Execute the mechanical context packer:
```bash
node scripts/pack-subplot-braid.js <chapter_number>
# or:
node scripts/soundboard.js pack subplot-braid <chapter_number>
```
Use the output (`ACTIVE THREADS LEDGER`, `THREAD DORMANCY & STARVATION ANALYSIS`, `TARGET CHAPTER BEATS`, `PRECEDING CHAPTER EXCERPT`) to identify which thread is most starved for attention.

## Process
1. **Identify Starved / Due Threads:**
   - Check the packer's Dormancy Audit. Identify any thread with dormancy $\ge 2$ chapters.
2. **Select the Non-Intrusive Braiding Level:**
   - If the main scene is high-intensity action/crisis ➔ use **Level 1 (Environmental Texture)** so momentum isn't slowed.
   - If the main scene is negotiation/planning ➔ use **Level 2 (Conversational Undercurrent)**.
   - If the main scene needs more friction ➔ use **Level 3 (Tactical Complication)**.
3. **Draft Braiding Beats:**
   - Formulate 2 concrete ways to weave this thread into the active beatsheet or draft.
4. **Update Thread Status:**
   - Note the update to be recorded in `threads.md` ("Latest Development: ch [N]").

## Output format

```markdown
### 🧵 Subplot Braiding Audit: Chapter [XX]

#### ⚠️ Dormancy Alert
- **Starved Thread:** [Thread ID & Title, e.g., T-02: The Creditor's Leverage]
- **Dormancy Count:** [X] chapters since last development (Ch [Y])
- **Risk:** High risk of reader abandonment or sudden end-of-book clumping.

---

### 🪢 Recommended Braiding Options

#### Option 1: Level 1 (Environmental / Background Texture)
- **Placement in Scene:** [Beat 1 opening / Beat 3 crisis]
- **Mechanism:** [How the physical detail or setting anchor represents the subplot]
- **Prose Sample:**
  > "[1–2 sentences showing the physical manifestation in the background...]"

#### Option 2: Level 2 (Conversational Undercurrent / Dialogue Friction)
- **Dialogue Exchange:** [Between Character A and Character B]
- **Subtext:** [How the subplot worry affects their patience, trust, or status]
- **Prose Sample:**
  > "[2–3 lines of dialogue showing the unresolved subplot bleeding through...]"

#### Option 3: Level 3 (Tactical Micro-Obstacle)
- **The Complication:** [How the subplot forces an immediate physical delay or choice]
- **Consequence:** [A minor complication that tests the characters before the main beat]

---

### 📝 Ledger Update for `threads.md`
- Update Thread `[T-XX]`: Change `Latest Development` from `ch [Y]` to `ch [XX]`.

*Which braiding option would you like to incorporate into the Chapter [XX] beats?*
```
