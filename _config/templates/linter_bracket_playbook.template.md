# The Linter Bracket Workflow (Playbook #20)

## When this applies
The author requests an audit or diagnostic review on a scene draft (`audit`, `continuity`, `cadence`, `tells`), or an audit finding triggers during Stage 04:
- *"Audit the rhythm of Scene 3."*
- *"Check this draft for AI tells and clichés."*
- *"Can you run a continuity check on my new chapter?"*

---

## Foundational Principle: Zero Autonomous Rewriting

**The human author holds the red pen. The AI is an editorial diagnostician, never a unilateral rewriter.**

1. **Strict No-Overwrite Mandate:**
   - Running an audit or diagnostic NEVER autonomously edits, polishes, or overwrites author prose in `manuscript/` or `writers_room/`.
   - Never "fix" prose behind the scenes just to make a linter warning or gate pass.
2. **Quarantine in Brackets:**
   - All identified prose issues (repetitive sentence lengths, synthetic clichés, passive constructions, tell-words) are rendered in a **Bracketed Review Copy** or inline margin notes:
     ```markdown
     He let out a breath he didn't know he was holding [AI-TELL: Cliché synthetic idiom. Frequency: 1. Option A: Cut entirely; let his shoulders drop. Option B: Replace with physical tactile action. Option C: Keep as authorial voice.] as the lock clicked open.
     ```
3. **The 3-Choice HITL Menu:**
   - Every bracketed finding must offer the author three clear, collaborative options:
     - **Option A (Subtle/Cut):** Minimalist removal or tightening.
     - **Option B (Acute/Rephrase):** Specific sensory or physical replacement.
     - **Option C (Keep):** Author's stylistic choice. (If chosen, add to `tell_allowlist.md` so the scanner never flags it again).
4. **Writer's Room Immunity:**
   - Files in `writers_room/` are completely exempt from automated background scans, doctor checks, or health gate warnings.
   - Diagnostics only touch `writers_room/` when the author explicitly requests it by path.
