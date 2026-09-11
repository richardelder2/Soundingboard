# Claude Code — Author & Agent Quick-Start Guide

**Harness Type:** Terminal-first autonomous CLI  
**Config Pointers:** `CLAUDE.md`, `.claude/settings.local.json`, `.claude/skills/`

Claude Code is an exceptionally fast, highly capable autonomous terminal agent. Because it operates in a raw shell environment, authors benefit from knowing its shortcuts, memory management, and how to avoid the "compacting trap."

---

## 1. Quick-Start Commands

Run Claude Code from the root of your Soundingboard novel workspace:

```bash
# Standard Anthropic Authentication
claude

# Or run via Soundingboard launcher scripts
powershell -File ./scripts/claude-vanilla.ps1      # Anthropic API
powershell -File ./scripts/claude-openrouter.ps1   # OpenRouter / Local Edge
```

---

## 2. Essential Slash Commands for Authors

Inside the Claude Code session:
* `/compact`: Summarizes conversation history to save tokens. *(See Section 3 for safety rules!)*
* `/cost`: Displays real-time API token usage and total session expense.
* `/pr`: Generates a pull request of newly drafted or edited chapters.
* `/help`: Displays CLI options and keybindings.

---

## 3. The Compacting Trap & How to Survive It

### The Problem
During a long 10,000-word drafting session across multiple chapters, Claude Code's context window will fill up. When Claude runs an automatic `/compact`, **it compresses conversation memory into a high-level summary**, which often loses subtle chapter beats, unverified canon facts, and tone nuances.

### The Solution: The Cold Resume Protocol
Whenever Claude Code compacts, or if you restart a session after days away, never try to manually explain what you were doing. Simply tell Claude:

> *"Run soundingboard brief and tell me what chapter we are drafting."*

Claude will automatically execute `node scripts/soundingboard.js brief` backstage, instantly re-anchoring itself to:
1. The exact production status of every chapter from `manuscript.json`.
2. The active word count targets.
3. The latest established facts in `canon.md`.

---

## 4. Bounding Autonomous Execution

Claude Code can execute commands and edit files autonomously. To maintain creative control:
* **The Single-Chapter Rule:** When drafting or auditing, instruct Claude to work on **one chapter at a time** (e.g., *"Draft the beats for Chapter 4, then pause for my feedback"*).
* **Never Auto-Approve Bulk Prose Changes:** If Claude suggests rewriting multiple chapters at once, ask it to output a **Revision Playbook** (`_config/templates/revision_playbook.template.md`) first so you can review the 2–3 creative options before text is overwritten.
* **Auto-Healing Backstage:** Claude will automatically run `soundingboard doctor --fix` if any Git or environment settings are misaligned. Let it heal behind the scenes without interrupting your writing flow.
