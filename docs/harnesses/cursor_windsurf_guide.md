# Cursor & Windsurf — Author & Agent Quick-Start Guide

**Harness Type:** AI-Powered Visual IDEs  
**Config Pointers:** `.cursorrules`, `.windsurfrules`, `.github/copilot-instructions.md`

Cursor and Windsurf are powerful modern development environments tailored for visual side-by-side editing. They are popular with writers who like to see their file tree, outline, and active chapter side-by-side on large screens.

---

## 1. The Critical Rule: Preventing Destructive Chapter Rewrites

### The Hazard
AI code editors like Cursor Composer and Windsurf Cascade love to perform full-file replacements. If you ask: *"Make the conversation between Marcus and Elena punchier,"* the editor might attempt to rewrite all 4,000 words of the chapter file, introducing hallucinations, deleting carefully crafted paragraphs, or resetting character voice.

### The Guardrail: The Snippet-Only Directive
Our `.cursorrules` and `.windsurfrules` explicitly forbid full-file overwrites. They enforce:
1. **Targeted Diffs:** The agent must only replace the specific paragraph or dialogue exchange being modified.
2. **HitL Revision Playbooks:** For developmental edits, the agent must output a proposed snippet in chat with before/after comparisons before touching the markdown file.

---

## 2. Key Shortcuts & Workflows

### In Cursor
* `Cmd + L` (Mac) / `Ctrl + L` (Windows): Opens the Chat sidebar. Use this for brainstorming, running questionnaires, or planning scene beats.
* `Cmd + K` (Mac) / `Ctrl + K` (Windows): Inline Edit. Highlight a specific sentence or paragraph and instruct: *"Tighten cadence and remove throat-clearing."*
* `Cmd + I` (Mac) / `Ctrl + I` (Windows): Opens Composer for multi-file operations (e.g. updating `canon.md` after drafting Chapter 3).

### In Windsurf
* `Cmd + I` (Mac) / `Ctrl + I` (Windows): Opens Cascade. Use Cascade to run stage packets and chapter audits.
* Side-by-side review: Always inspect the green/red diff review before accepting changes to chapter prose.

---

## 3. Running Soundingboard CLI Tools Inside Cursor / Windsurf

You do not need to leave the editor to run diagnostics. Simply open the built-in terminal (``Ctrl + ` ``) or instruct the AI assistant:

```bash
# Check current chapter status
node scripts/soundingboard.js status

# Scan current chapter for AI tells and cadence
node scripts/soundingboard.js audit stages/03_drafting/output/chapters/ch01.md

# Verify names and proper noun continuity
node scripts/soundingboard.js continuity
```
