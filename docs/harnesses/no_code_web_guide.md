# No-Code & Web Chat — Author Quick-Start Guide

**Harness Type:** Browser Web Chat (ChatGPT, Claude.ai, Gemini Advanced)  
**Best For:** Creative writers who do not use code editors, terminals, or CLI software.

You do not need to be a software developer or know how to use a terminal to get the full power of Soundingboard's narrative architecture. You can run the entire pipeline directly in standard browser chat interfaces.

---

## 1. How the No-Code Pipeline Works

Soundingboard packages entire stage instructions, rules, and context into clean, single-file **Stage Packets**. 

Whenever you want to move to the next stage of your book, you can generate a single self-contained context packet:

```bash
# Example: Generate complete context packet for Stage 01 (Onboarding)
node scripts/soundingboard.js run-stage 01

# Example: Generate complete context packet for Chapter 4 Drafting
node scripts/soundingboard.js pack-chapter 4
```

Copy the terminal output and paste it as the opening prompt in **Claude.ai**, **ChatGPT**, or **Gemini Advanced**.

---

## 2. Using the Stage 01 Web Onboarding Prompt

If you are starting completely fresh and do not have Soundingboard installed locally at all, copy and paste this starter prompt into your browser:

```markdown
I am writing a commercial novel and using the Soundingboard Novel Engineering system. 
You are acting as my Creative Writing Concierge and Executive Novel Assistant.

Follow these ground rules:
1. Do not give me generic advice or technical commands. Guide me proactively.
2. We begin with Story & Genre Discovery (Triage): Ask me about my core story concept, genre, tone/vibe, and comp titles first.
3. Once we agree on the genre, adopt the corresponding specialist coach persona and ask me the onboarding questions ONE AT A TIME.
4. Keep the pace conversational, encouraging, and collaborative. Conclude every turn with the next concrete step.

Let's begin! What is your first question for me?
```

---

## 3. Saving Your Work into the Soundingboard Vault

When the web chat generates artifacts (your World Bible, Outline, or Chapter Drafts):
1. Create or save the text files into their corresponding folders:
   - World Bible: `stages/01_onboarding/output/bible/world_bible.md`
   - Chapter Drafts: `stages/03_drafting/output/chapters/ch01.md`
   - Raw Drafts / Notes: Simply drop them into the `inputs/drafts/` or `inputs/notes/` folders!
2. Whenever you want to audit or check continuity, run:
   ```bash
   node scripts/soundingboard.js status
   node scripts/soundingboard.js audit
   ```
   Soundingboard will automatically detect your new chapters and update your manuscript ledger.
