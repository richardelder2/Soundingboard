# Soundingboard Git Playbook: Creative History & Author Version Control

> **The Fundamental Rule:**  
> **Soundingboard files contain the meaning. Git records the evolution.**

---

## 1. Why Git Belongs in a Novelist's Studio

Traditional novel writing software often traps an author in a binary trap: either you use a proprietary "black box" database that hides your text, or you save hundreds of manual copies (`Novel_v2_final_FINAL_really.docx`).

Soundingboard uses a **file-first architecture**. Every scene you write lives as an open, readable Markdown file (`manuscript/scenes/sc-0017.md`). Every chapter is a clean playlist of scenes (`manuscript/chapters/ch-02.md`). Every world rule lives in `canon.md`, and your rough notes and braindumps live in `writers_room/`.

Because everything is in plain files:
- **Your work is yours forever.** No tool lock-in.
- **Git serves as a transparent historical film over your workspace.** It captures every draft, revision, bracket decision, and structural experiment.
- **Git is not a competing database or source of truth.** The files contain all the meaning. Git merely records how those files change over time.

---

## 2. The Core Philosophy: The Author Owns the Work

When working with an AI assistant in harnesses such as **Google Antigravity** or **Claude Code**, Git must never become an editorial gatekeeper.

Soundingboard and your AI assistant may:
- Inspect repository status and identify uncommitted creative changes.
- Summarize what changed in plain, craft-centered language.
- Suggest commits at meaningful moments, explaining *why* a checkpoint is helpful.
- Propose thoughtful commit messages.
- Create local commits **only when you authorize them**.
- Push to an authorized remote repository **only when you authorize it**.
- Help you branch, explore "what-if" story forks, and compare creative experiments.

**What the AI and Git must NEVER do:**
- Silently rewrite your prose.
- Silently commit or push behind your back without your explicit instruction.
- Turn Git into a gatekeeper that refuses to save your work because of an AI critique.
- Conflate an editorial opinion with objective truth.

---

## 3. Stable Scene Identity: Structure vs. Artifact

In Soundingboard 2.0, **scenes have permanent, stable identities**:
- Scenes live in `manuscript/scenes/sc-XXXX.md`.
- Chapters live in `manuscript/chapters/ch-XX.md` as assembly playlists with authored break rationales.

```
manuscript/
├── scenes/
│   ├── sc-0016.md
│   ├── sc-0017.md   <-- Permanent Scene ID & YAML Context
│   └── sc-0018.md
└── chapters/
    ├── ch-01.md     <-- Playlist: [sc-0016]
    └── ch-02.md     <-- Playlist: [sc-0017, sc-0018]
```

### What Happens When You Move a Scene?
Suppose you decide that **SC-0017** (a tense interrogation in a warehouse) should not happen in Chapter 2, but should instead be delayed until Chapter 5 to heighten suspense.

1. You edit `manuscript/chapters/ch-02.md` to remove `sc-0017`.
2. You edit `manuscript/chapters/ch-05.md` to add `sc-0017`.
3. You run `soundingboard reindex`.

**SC-0017 does NOT become a new scene.**
Its file (`manuscript/scenes/sc-0017.md`) remains completely intact:
- Its scene ID (`sc-0017`) remains unchanged.
- Its intended dramatic purpose and POV remain attached.
- Its Story Grid 5 Commandments and value shifts remain attached.
- Its authorial notes, brackets, and voice anchors remain attached.

When you view Git history, Git records a clean, accurate representation: the chapter playlists were updated, but the creative artifact itself retained its unbroken identity.

---

## 4. Observation, Interpretation, and Author Decision

Soundingboard maintains a strict conceptual distinction between three layers of reality:

```
┌────────────────────────────────────────────────────────┐
│ 1. DETERMINISTIC FINDING (Mechanical Tool Observation) │
│    "4 consecutive sentences have identical lengths."   │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ 2. AGENT INTERPRETATION (Hypothesis & Craft Advice)   │
│    "Could indicate character obsession, or could be    │
│     monotonous. Consider varying sentence length."     │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ 3. AUTHOR DECISION (Creative Sovereign Red Pen)       │
│    "PRESERVE: The obsessive repetition is intentional."│
└────────────────────────────────────────────────────────┘
```

1. **Deterministic Finding:** A zero-opinion tool calculation (e.g. word count, sentence length standard deviation, or unreferenced proper noun).
2. **Agent Interpretation:** The AI's creative hypothesis about what that finding might mean.
3. **Author Decision:** What you, the novelist, decide to do about it.

Your prose remains verbatim unless you choose to change it. When you make a decision, that decision is recorded in the file (often in a bracket note or `tell_allowlist.md`), and Git permanently records your choice.

---

## 5. Integrating The Bracket Method into Git History

When you request editorial feedback (Playbook #18 or #20), Soundingboard uses **The Bracket Method**:

All AI observations and suggestions are quarantined in margin brackets `[like this]`:
```markdown
Elena pushed open the brass gate [AI-TELL: Cliché sensory action. Option A: Cut. Option B: Replace with cold iron texture. Option C: Keep as author voice.].
```

Every bracket workflow preserves the full provenance:
1. **What was found:** The specific passage flagged.
2. **Supporting tool:** The deterministic diagnostic or linter rule.
3. **Agent interpretation:** Why the passage was flagged.
4. **Area of consideration:** `[CUT]`, `[PRESERVE]`, `[REORDER]`, `[STRUCTURAL NOTE]`, or `[DRAFT SUGGESTION]`.
5. **Author decision:** Your explicit resolution (`CUT`, `PRESERVE`, or `REPHRASE`).
6. **Author rationale:** Any creative reason you choose to note.

When you finish resolving brackets in a scene, you can ask your assistant to commit the result:
```bash
node scripts/soundingboard.js git checkpoint "revision: resolve editorial brackets in sc-0017"
```
Because the brackets existed in the file, Git history captures the exact conversation and your resolution, giving you an immutable record of your editorial choices.

---

## 6. Technical Integrity vs. Creative Uncertainty

Soundingboard draws a bright, uncrossable line between two types of issues:

| Category | Definition | Impact on Git / Commits |
|---|---|---|
| **Technical Integrity** | Syntactic or structural corruption that breaks tools, compilers, or indexes (e.g. malformed YAML frontmatter, duplicate scene IDs, broken chapter playlist references). | **Blocks / Warns:** Protects your project from data corruption before saving. |
| **Creative Uncertainty** | Narrative critique or subjective craft findings (e.g. "Protagonist motivation seems weak," "AI tell ratio is high," "Pacing drops in Act II"). | **Zero Block:** NEVER prevents you from committing or pushing. You are the author. |

If an automated tool says, *"The protagonist's motivation appears inconsistent,"* that is a creative discussion for your chat, **never an error that stops you from committing or pushing**.

---

## 7. Author Git Modes

You can configure how proactive your AI assistant should be by editing `preferences.md` at the root of your project:

```yaml
---
git_mode: "gentle"         # gentle | quiet | guided | automatic
git_remote_push: "ask"     # ask | manual | automatic
---
```

### The Four Assistance Modes

1. **Quiet:**
   - The assistant **never** proactively suggests commits.
   - It only commits or checks status when you explicitly say: *"Commit my work"* or *"Create a checkpoint."*
2. **Gentle (Default):**
   - The assistant monitors meaningful creative milestones (finishing a scene, completing a major revision pass, resolving brackets, reorganizing chapters, or finishing a long session).
   - When a milestone occurs, it gently suggests saving a checkpoint and explains **why**.
3. **Guided:**
   - When a milestone occurs, the assistant suggests a checkpoint and provides a complete creative summary (how many scenes revised, how many words shifted, which brackets resolved, and which canon entries updated).
4. **Automatic:**
   - Automatically creates local checkpoint commits at author-configured milestone events. Remote pushes remain separately controlled.

### Remote Push Settings
Remote pushes are kept strictly separate from local commits:
- `ask` (Default): The agent always summarizes outgoing commits and asks for your confirmation before pushing to GitHub or your remote server.
- `manual`: The agent never pushes; you handle pushing yourself.
- `automatic`: Automatically pushes local commits to your remote.

---

## 8. Commit Types & Meaningful Milestones

Your Git history is not a PR showcase for a publisher; it is the real, working memory of your creative process. Soundingboard encourages preserving the messy, authentic evolution of your draft.

| Commit Type | Format | When to Use | Example |
|---|---|---|---|
| **Checkpoint** | `checkpoint: <summary>` | Peace of mind snapshot at the end of a writing block or mid-draft. | `checkpoint: late night drafting on dock escape` |
| **Scene Milestone** | `scene(<sc-id>): <action>` | First draft of a scene completed, or major prose rewrite. | `scene(sc-0017): complete first draft` |
| **Editorial Milestone** | `revision: <scope>` | Resolving brackets, tightening rhythm, or addressing a diagnostic. | `revision: resolve Swain MRU brackets in sc-0003` |
| **Structural Experiment** | `experiment: <hypothesis>` | Testing an alternate chapter order or character arc fork. | `experiment: alternate Act II scene order without Tam` |
| **Project Milestone** | `milestone: <event>` | Major structural achievements (Act I finished, full draft complete). | `milestone: complete Act I scene pool and playlists` |

> [!TIP]
> A messy checkpoint is always better than lost words. Never hesitate to commit unfinished, rough prose.

---

## 9. The Agent Workflows in Action

### A. Suggesting a Commit (Gentle Mode)
When you finish a writing sprint, your assistant might say:

> *"Since your last checkpoint, you've drafted SC-0018, resolved 3 brackets in SC-0017, and added a new location to `canon.md`. This looks like a great point to preserve your progress.*  
> *Would you like me to commit these changes as `scene(sc-0018): complete first draft of dock escape`?"*

You can simply reply:
- **"Yes, commit."**
- **"Show me what changed first."**
- **"Commit, but call it: `checkpoint: rough dock escape`."**
- **"Not yet, let's keep writing."**

### B. Suggesting a Push
When you finish your writing session, the assistant might say:

> *"Ready to push to remote repository.*  
> *• Target: origin/main*  
> *• Local commits: 3 unpushed commits (SC-0017 revision, SC-0018 draft, Act I reorder)*  
> *Would you like me to push these commits to your remote backup?"*

---

## 10. Creative Branch Experiments

Sometimes you want to try a risky creative choice without messing up your manuscript:
- What if the detective doesn't survive Chapter 4?
- What if we tell Act II in reverse chronological order?
- What if Elena accepts the villain's offer?

With Git, you can create an experimental branch:

```bash
# Create a branch for your experiment
git checkout -b experiment/elena-accepts-offer
```

You can now rewrite scenes, delete chapters, or rearrange playlists with complete psychological safety.

To compare your experiment with your primary draft:
```bash
node scripts/soundingboard.js git compare main
```
The tool will show you which scenes and chapters differ.

> [!IMPORTANT]
> **The Rule of Merging:**  
> Git can show you where the text differs, but Git cannot tell you which story is better. Only you can decide whether the experiment belongs in the canonical book. Merging is an authorial decision, never an automated routine.

---

## 11. Traveling in Time: Recovery Without Fear

If you ever decide that a revision took a wrong turn, or you want to see how a scene read three weeks ago:

- **Inspect history:**
  ```bash
  git log --oneline manuscript/scenes/sc-0017.md
  ```
- **View an earlier version:**
  ```bash
  git show <commit-hash>:manuscript/scenes/sc-0017.md
  ```
- **Restore an earlier version of a single scene:**
  ```bash
  git checkout <commit-hash> -- manuscript/scenes/sc-0017.md
  node scripts/soundingboard.js reindex
  ```

Because your project is file-first, recovering an earlier scene never corrupts your project index. Running `soundingboard reindex` automatically synchronizes `manuscript.json` with the restored file.

---

## 12. CLI Quick Reference

| Command | What It Does |
|---|---|
| `node scripts/soundingboard.js git status` | Summarizes creative changes (scenes revised, moved, brackets, canon). |
| `node scripts/soundingboard.js git checkpoint [msg]` | Creates a local commit after validating technical integrity. |
| `node scripts/soundingboard.js git verify` | Verifies YAML frontmatter, scene IDs, and playlist references. |
| `node scripts/soundingboard.js git push-check` | Displays unpushed commits and configured remote repository. |
| `node scripts/soundingboard.js git push` | Pushes approved local commits to the remote repository. |
| `node scripts/soundingboard.js git compare <branch>` | Compares structural differences between experimental branches. |
| `node scripts/soundingboard.js pack git` | Assembles a complete context pack for creative history (Playbook #21). |
