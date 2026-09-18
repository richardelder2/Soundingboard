# Soundingboard — Harness Conformance Profile (v2.2 LTS)

Soundingboard is designed around a single architectural principle:
> **The contract and the record live in the repository; harnesses are thin adapters.**

Harnesses and developer tools evolve rapidly. Rather than publishing fragile, per-harness guides that go stale, Soundingboard defines one **Conformance Profile** specifying the exact capabilities an agent harness must satisfy to host a Soundingboard novel studio.

---

## 1. The Six Conformance Requirements

A harness conforms to Soundingboard when it meets the following six operational criteria:

| # | Requirement | Specification | Why Soundingboard Needs It |
|---|---|---|---|
| **1** | **File Read/Write** | Full access to read, create, and modify text files in the project directory. | The book's entire state (scenes, canon, bibles, outlines) is stored in plain Markdown and JSON files. |
| **2** | **Shell / Node Execution** | Ability to execute Node.js ($\ge$ 18.0) scripts (`node scripts/soundingboard.js ...`). | The zero-dependency CLI handles deterministic context packing, linting, graduation, and diagnostics backstage. |
| **3** | **Contract Auto-Loading** | Auto-loads `AGENTS.md` (or a repository rule pointing to it) in every turn. | The author-agent boundaries, craft rules, and mode guidelines must govern every generation. |
| **4** | **Prose Edit Interception** | Supports lifecycle hooks or extensions that inspect file write tools before execution (`PreToolUse`). | Mechanically enforces the **Red Pen Invariant** (`scripts/redpen.js`), preventing unauthorized prose rewrites. |
| **5** | **Context Hygiene** | Handles long context windows without silently compressing or dropping active canon. | Novels are large projects; the agent must respect the $\le 6,000$ token context budget per scene pack. |
| **6** | **Conversation Export** | Passes session transcript logs or paths on session termination (`Stop` hook). | Feeds the **Conversation Provenance Engine** (`scripts/capture.js`), securing an unalterable authorship record. |

---

## 2. The Context Tax: Eliminating Idle Overhead

In agentic writing, **idle token overhead reduces model performance and crowds out story context**. The largest contributor to context bloat is unused Model Context Protocol (MCP) servers and IDE developer tools.

### MCP Optimization Recommendations:
- **Browser Automation MCPs (Puppeteer/Playwright):** Disable unless actively conducting historical research. A single browser tool description costs 13,000–18,000 tokens per prompt.
- **Language Server Protocol (LSP) / Linters:** Disable ESLint, Pyright, or Rust-Analyzer tool mounts in novel workspaces. Manuscripts are prose, not software code.
- **Git Auto-Commit Daemon:** Ensure background git watchers do not run automated commits without explicit author authorization (Playbook #21).

---

## 3. Harness Conformance Tiers

Soundingboard supports two tiers of conforming harnesses:

### Author Tier (Visual & IDE)
- **Google Antigravity:** Reference author harness. Ships in-repo `.agents/` configuration (`rules/`, `skills/`, `hooks.json`). Full dual-pane editing, planning mode, generative UI, and automatic provenance capture on `Stop`.
- **Cursor & Windsurf:** Visual editors with split-pane markdown editing, inline diffs, and rules configured via `.cursorrules` / `.windsurfrules`.

### Power-User Tier (Terminal & Headless)
- **Claude Code:** Terminal CLI configured via `CLAUDE.md`, `.claude/skills/`, and hooks.
- **Pi:** Minimal terminal coding agent using four core tools (`read`, `write`, `edit`, `bash`) with `.pi/extensions/red-pen.ts`.
- **Hermes:** Conversational terminal/messaging partner with cron diagnostic schedules.

---

## 4. The 5-Minute Smoke Test

Every release of Soundingboard includes an automated smoke test fixture (`tests/test_smoke.js`) verifying that any conforming harness environment:
1. Executes `soundingboard status` cleanly.
2. Intercepts and blocks an unauthorized prose modification in `solo` mode.
3. Automatically permits a bracket-only diagnostic suggestion in `hybrid` mode.
4. Detects and prompts on destructive chained shell commands.
5. Assembles Socratic discovery packets via `pack dig [target]`.
6. Normalizes and indexes session transcripts into `conversations/INDEX.md`.
