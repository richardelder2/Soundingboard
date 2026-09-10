# Causal Plot Calculus (Therefore / But) Playbook

## When this applies
The author is reviewing or refining a chapter beatsheet, outline, or plot progression that feels episodic, coincidental, or flat. Common triggers:
- *"Check the causality in Chapter [N] beats."*
- *"Do a 'Therefore / But' pass on this beatsheet."*
- *"The plot feels like 'and then, and then'; make it more causal."*
- *"Audit the sequential connections between these scene beats."*

## What good output looks like
- **Elimination of Episodic 'And Then':** Disallow purely sequential storytelling where events happen alongside each other without causing each other.
- **Strict Causal Binary:** Every transition between adjacent beats must be governed by either:
  1. **THEREFORE (Consequence):** Beat B is the direct, logical, or emotional reaction/fallout of Beat A.
  2. **BUT (Obstacle / Reversal):** Beat B interrupts, complicates, opposes, or turns against the trajectory of Beat A.
- **Single-Sentence Causal Rewrites:** Provide sharp, actionable rewritten beats establishing the causal pivot cleanly.

## Context
Execute the mechanical context packer:
```bash
node scripts/pack-causality.js <chapter_number_or_beatsheet_path>
# or:
node scripts/soundingboard.js pack causality <chapter_number_or_beatsheet_path>
```
Use the output (`FULL BEATSHEET FILE`, `SEQUENTIAL BEAT PAIRS FOR AUDIT`) to review each transition point.

## Process
1. **Examine Each Transition Pair (Beat N ➔ Beat N+1):**
   - Does Beat N+1 happen *because* of Beat N, or does it merely happen *next*?
2. **Diagnose Weak Links:**
   - Flag any transition that relies on external coincidence or unrelated parallel action.
3. **Propose Causal Links:**
   - If consequence: Rewrite Beat N+1 using a *Therefore* structure (a choice made in Beat N causes a new problem).
   - If obstacle/reversal: Rewrite Beat N+1 using a *But* structure (an unexpected complication turns the victory or worsens the failure).
4. **Present Proposed Updates:**
   - Offer the author a side-by-side comparison of the original versus causally linked beats.

## Output format

```markdown
# Causal Calculus Audit: [Beatsheet Name]

### 🔗 Transition Analysis & Rewrites

#### Transition 1: Beat 1 ➔ Beat 2
- **Beat 1:** "[Original Beat 1 text]"
- **Original Beat 2:** "[Original Beat 2 text]"
- **Current Link:** [Weak "And Then" / Episodic / Coincidental]
- **Recommended Causal Mode:** [THEREFORE (Consequence) / BUT (Obstacle/Turn)]
- **Proposed Causal Rewrite for Beat 2:**
  > "[Single punchy sentence establishing the direct causal link...]"

#### Transition 2: Beat 2 ➔ Beat 3
- **Beat 2:** "[Beat 2 text]"
- **Original Beat 3:** "[Original Beat 3 text]"
- **Recommended Causal Mode:** [THEREFORE / BUT]
- **Proposed Causal Rewrite for Beat 3:**
  > "[Single punchy sentence establishing the causal link...]"

---

*Would you like to apply these causal rewrites directly to your beatsheet file?*
```
