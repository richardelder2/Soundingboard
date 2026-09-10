# Scene Staging & Beat Planning Playbook

## When this applies
The author is preparing to draft a new scene/chapter and needs to stage the physical blocking, establish value shifts, select sensory anchors, or create opening hooks. Common triggers:
- *"Let's stage Chapter [N]."*
- *"I need to set up the scene beats for the next chapter."*
- *"Help me block out where characters stand and what happens in this scene."*
- *"Give me some opening hook ideas for Chapter [N]."*

## What good output looks like
- **Clear Value Shift:** Every scene must execute a measurable emotional or dramatic value shift (e.g. Hopeful ➔ Betrayed, Safe ➔ Trapped, Ignorant ➔ Complicit).
- **Physical Blocking & Staging:** Characters do not float in conversational vacuums; they interact with objects, sightlines, doorways, and barriers.
- **Three Distinct Opening Hook Variations:**
  1. *Action / In Media Res:* Starts in the middle of physical movement, immediate hazard, or tactile friction.
  2. *Introspective / Interiority:* Starts with a character's sharp perception, calculation, or internal doubt.
  3. *Atmosphere / Environmental Register:* Starts with sensory pressure, acoustics, or setting hostility.
- **5-Commandment Structural Integrity:** Grounded in the Story Grid / SAGA scene architecture (Inciting Incident, Progressive Complication, Crisis, Climax, Resolution).

## Context
Execute the mechanical context packer:
```bash
node scripts/pack-stage-scene.js <chapter_number>
# or:
node scripts/soundingboard.js pack scene <chapter_number>
```
Use the output (`STRUCTURE PLAN REQUIREMENTS`, `PRECEDING CHAPTER ENDING`, `CURRENT BEAT FILE`, `SCENE BEAT STANDARD TEMPLATE`) to maintain continuity.

## Process
1. **Establish Core Coordinates:**
   - What is the Inciting Incident that disrupts the scene's opening state?
   - Who is in the room and what are their mutually incompatible desires?
   - What is the starting vs. ending value state?
2. **Select Visceral Sensory Anchors:**
   - 3 specific tactile, auditory, or visual anchors tied directly to the setting.
3. **Craft 3 Opening Hook Variations:**
   - Write 2–3 prose sentences for Action, Introspection, and Atmosphere hooks.
4. **Draft 5-Beat Story Grid Framework:**
   - Beat 1: Inciting Incident
   - Beat 2: Progressive Complication
   - Beat 3: Crisis (Best bad choice or irreconcilable goods)
   - Beat 4: Climax (Action taken)
   - Beat 5: Resolution (New status quo)

## Output format

```markdown
# Chapter [XX] Scene Staging & Setup

## 🎯 Core Scene Objectives
- **Inciting Incident:** [The event that forces action]
- **Characters Present & Desires:** [Who is here and what do they want right now?]
- **Value Shift:** [Starting State] ➔ [Ending State] (e.g. Complacent ➔ Ambushed)

## 🏛️ Setting & Physical Blocking
- **Space & Atmosphere:** [Dimensions, light, obstacles, sound]
- **Physical Business:** [Objects characters handle, positions in the room]

## ⚓ Three Sensory Anchors
1. **Tactile/Haptic:** [e.g. Splintered armrest, slick grease on floorboards]
2. **Auditory/Acoustic:** [e.g. Low hum of cooling coils, muffled footsteps overhead]
3. **Visual/Lighting:** [e.g. Sallow streetlamp filtering through blinds]

## 🎣 Three Opening Hook Variations
- **Hook 1 (Action / In Media Res):**
  > "[2–3 sentences of active prose starting mid-motion...]"
- **Hook 2 (Introspective / Character):**
  > "[2–3 sentences starting with immediate character calculation...]"
- **Hook 3 (Atmosphere / Setting):**
  > "[2–3 sentences establishing immediate environmental pressure...]"

## 📝 5-Beat Narrative Framework
- [ ] **Beat 1 (Inciting Incident):** [Details...]
- [ ] **Beat 2 (Progressive Complication):** [Details...]
- [ ] **Beat 3 (Crisis):** [Best bad choice decision point...]
- [ ] **Beat 4 (Climax):** [Action executed...]
- [ ] **Beat 5 (Resolution):** [New reality established...]

---

*Would you like to write this setup directly into your chapter beatsheet file?*
```
