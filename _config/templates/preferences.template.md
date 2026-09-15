---
author_name: "[author or pen name]"
working_mode: "solo"             # solo | hybrid | generative
primary_editor: "obsidian"       # obsidian | scrivener | word | vscode | ia_writer | other
ai_prose_generation: "never"     # never | upon_request | collaborative
editorial_style: "bracket"       # bracket (margin notes) | summary_memo
tell_tolerance: "advisory"       # advisory | strict | relaxed
git_mode: "gentle"               # gentle | quiet | guided | automatic
git_remote_push: "ask"           # ask | manual | automatic
target_words: 90000
form: "novel"                    # novel | novella | novelette | short_story | series | world
---

# Author Preferences & Studio Settings

This file governs how your AI editorial partner collaborates with you. Edit these fields anytime to match your creative flow.

---

## 1. Collaboration Profile & Boundaries

- **Working Mode:** `solo` (Default)
  - **Solo Mode:** You write 100% of the words. The AI serves as your Master Librarian, Continuity Sentry, and Developmental Editor. The AI *never* touches a sentence unless asked.
  - **Hybrid Mode:** You and the AI volley beats, bounce brainstorming ideas, or bloom sensory details together using The Bracket Method.
  - **Generative Mode:** The AI assists in drafting scenes from your beat sheets *only upon your explicit request*.
- **Prose Boundary:** The AI must NEVER silently or unilaterally rewrite your prose to satisfy a metric or error count. All editorial suggestions and diagnostics must be quarantined in brackets `[like this]` where you hold the red pen.
- **Diagnostic Tolerance:** `advisory`
  - Findings (AI-tells, passive voice, metronomic cadence, thread gaps) are presented as collaborative choices, not machine errors. You can dismiss or adopt them freely.
- **Git Assistance Mode:** `gentle` (Default: `gentle` | `quiet` | `guided` | `automatic`)
  - **The Golden Rule:** *Soundingboard files contain the meaning. Git records the evolution.*
  - **Quiet:** No proactive Git reminders. The agent only commits when you explicitly tell it to.
  - **Gentle (Default):** The agent suggests preserving a checkpoint at meaningful creative milestones (scene draft finished, major revision, chapter restructuring, end of session) and explains why.
  - **Guided:** Suggests checkpoints and provides a full creative change summary (scenes revised, brackets resolved, canon changes).
  - **Automatic:** Creates local checkpoint commits automatically at milestone events per your preferences.
  - *Authority:* Commits are always created under your direction. The agent never acts as an editorial gatekeeper.
- **Remote Push Control:** `ask` (Default: `ask` | `manual` | `automatic`)
  - **Ask (Default):** Always prompts with a summary (branch, commit count, changes) and waits for your confirmation before pushing.
  - **Manual:** The agent never suggests pushing; you push manually from your terminal or git client.
  - **Automatic:** Automatically pushes local commits to your configured upstream repository. Local commits and remote pushes remain conceptually separate.

---

## 2. Story Profile & Concept

- **Title:** [working title]
- **Core Concept / Logline:** [one or two sentences describing the protagonist, inciting incident, and stakes]
- **Genre & Chassis:** [e.g., Cyberpunk Dystopia, Cozy Mystery, Progression Fantasy, Romantasy]
- **Trope Stack:** [Dynamic] + [Situation] + [Flavor]
- **POV Structure:** [e.g., Third Person Limited (Single POV), Multi-POV Alternating, First Person Retrospective]
