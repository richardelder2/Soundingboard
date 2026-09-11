# Google Antigravity — Author & Agent Quick-Start Guide

**Harness Type:** Dual-Pane IDE & Agent Canvas  
**Config Pointers:** `GEMINI.md`, App Data rules & skills (`agy-customizations`, `soundingboard-studio`)

Google Antigravity is a multimodal agentic coding and creative environment designed by Google Deepmind. It integrates a live code/text editor with an interactive agent canvas, planning mode, generative UI rendering, and subagent team orchestration.

---

## 1. The Dual-Pane Interface

* **Left Pane (The Canvas):** The active file editor where your outline (`outline.md`), world bible (`world_bible.md`), and chapter prose (`ch01.md`) are displayed with syntax highlighting and diff reviews.
* **Right Pane (The Chat & Console):** Where you interact with your Creative Writing Concierge. The agent runs mechanical tools backstage and presents narrative guidance, beat proposals, and audit verdicts.

---

## 2. Navigating Planning Mode

Antigravity features an active **Planning Mode** to prevent rogue or unintended large-scale workspace edits.

* **When Planning Mode Triggers:** When asking for major story changes (e.g., restructuring an entire act, redesigning character arcs, or setting up a new multi-book series), Antigravity will generate an `implementation_plan.md` artifact.
* **The Approval Modal:** An interactive modal with a **"Proceed"** button will appear in your chat window. You can:
  1. Click **Proceed** to authorize the agent to execute the plan.
  2. Write comments directly on specific lines of the plan in the artifact viewer to adjust story direction before work begins.

---

## 3. Generative UI & Visual Consoles

Antigravity natively supports rendering rich, interactive HTML/SVG widgets inline in chat:
* **Visual Timelines:** View story chronologies, countdown clocks, and multi-POV timelines as interactive visual gantt charts.
* **Relationship Graphs:** Explore character factions, loyalties, and secrets on a dynamic, clickable canvas.
* **Audiobook Waveforms:** Inspect sentence breath cadences and acoustic velocity graphs directly inside your conversation.

---

## 4. Subagent Delegation for Novelists

Antigravity can spawn specialized background subagents using `invoke_subagent`:
* **Research Subagents:** If you need deep historical research (e.g. Victorian poison laws, 12th-century cathedral architecture, or quantum drive physics), Antigravity can dispatch a background research subagent to search the web and compile notes while you continue drafting in the main chat.
* **Parallel Audit Subagents:** While you are writing Chapter 5, a background subagent can perform the mechanical audit on Chapter 4 without interrupting your train of thought.
