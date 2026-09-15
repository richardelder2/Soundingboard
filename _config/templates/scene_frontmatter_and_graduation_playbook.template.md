# Scene Frontmatter Assistance & Graduation Playbook (Playbook #19)

## When this applies
The author is working on a scene draft—either directly in `writers_room/drafts/`, via an external file in `writers_room/inputs/`, or in an unassigned scene file—and wants to:
1. **Infuse Frontmatter (Pre- or Mid-Draft):** Add or update YAML frontmatter without disrupting creative momentum.
2. **Scaffold with Options:** Receive a commented YAML block offering available characters, locations, and open threads.
3. **Graduate a Scene:** Transition an approved draft from the Writer's Room into the canonical manuscript scene pool (`manuscript/scenes/sc-XXXX.md`).

---

## The 3 Frontmatter Assistance Pathways (Anytime, Anywhere)

The author may invoke frontmatter assistance at any point during planning, drafting, or polishing:

### Pathway 1: AI Analysis & Proposal (From Existing Prose)
- The author says: *"Read my scene in `writers_room/drafts/dock_fight.md` and propose the scene card frontmatter."*
- The agent analyzes the draft and infers:
  - **POV:** Primary focalizing character.
  - **Location:** Physical staging environment.
  - **Value Shift:** Emotional/dramatic starting and ending values (`value_in` ➔ `value_out`).
  - **Five Commandments:** Inciting incident, progressive complication, crisis, climax, resolution.
  - **Threads:** Active story threads touched (`th-01`, `th-02`).
- **CRITICAL:** The agent surfaces the proposed block in chat for author approval. It NEVER silently alters the file or leaves frontmatter empty.

### Pathway 2: Scaffold with In-World Options (Author Writes)
- The author says: *"Give me the frontmatter template for this next scene so I can fill it in."*
- The agent inspects `canon.md` and `threads.md` and inserts a clean, commented YAML header:
  ```yaml
  ---
  pov: "Elena Rostova" # Options: Elena Rostova, Captain Vane, Kaelen
  location: "Lower Archives" # In-world suggestion based on last scene
  threads: [th-01] # Active threads: th-01 (Cipher Mystery), th-02 (Guild Politics)
  value_in: "Curiosity (+1)"
  value_out: "Danger (-2)"
  commandments:
    inciting_incident: ""
    progressive_complication: ""
    crisis: ""
    climax: ""
    resolution: ""
  ---
  ```

### Pathway 3: Conversational Interview (Volleying the Turn)
- The author says: *"I know what happens in this scene, but I'm not sure about the value turn. Let's talk it through."*
- The agent acts as an encouraging craft coach:
  - *"What does your protagonist want when they enter the room?"*
  - *"What unexpected obstacle forces them into a dilemma?"*
- Once agreed, the agent writes the synthesized frontmatter directly to the file.

---

## The Scene Graduation Ceremony

When a draft in `writers_room/drafts/` reaches a state where the author considers it an official part of the story:

1. **Verify Frontmatter Completeness:**
   - Ensure `pov`, `location`, `value_in`, `value_out`, and `threads` are present and author-approved.
2. **Allocate Canonical Scene ID:**
   - Allocate the next monotonic ID (`sc-XXXX`) via `allocateSceneId()`.
3. **Move to Flat Scene Pool:**
   - Save the finalized file as `manuscript/scenes/sc-XXXX.md`.
   - The scene does NOT need a chapter assignment yet! It is a valid, indexed, and audited floating scene.
4. **Continuity & Index Update:**
   - Run `node scripts/soundingboard.js reindex` behind the scenes.
   - Harvest newly established proper nouns into `canon.md` tagged `[unverified sc-XXXX]`.
5. **Debrief the Author:**
   - Report the graduation warmly in chat: *"Scene successfully graduated as `sc-0004` (Elena's discovery in the archives, 1,420 words). It's indexed, audited, and ready in your scene pool. Whenever you're ready, we can assign it to a chapter playlist, or keep drafting your next scene."*
