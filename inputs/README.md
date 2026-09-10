# Author Inputs Vault (`inputs/`)

This directory is the author's dedicated drop-zone for raw, unedited materials. 

## Structure
- `inputs/drafts/` — Raw chapter scenes, rough drafts, `.docx` files, Scrivener exports, or audio transcripts.
- `inputs/notes/` — Brain dumps, worldbuilding scraps, character ideas, and research links.

## Immutable Preservation Rule
Files placed here or referenced during ingestion are **sacred and append-only**. Automated tools, diagnostics, and AI agents will **never** overwrite, truncate, or delete files inside `inputs/`. 

When you run `soundingboard ingest <file>` (or pass a file/path to the agent), Soundingboard will:
1. Preserve an immutable snapshot in `inputs/drafts/`
2. Standardize and format a working chapter into `stages/03_drafting/output/chapters/`
3. Link provenance metadata back to your raw file
4. Automatically harvest character and world facts into `canon.md`
5. Provide an immediate Sounding Board Debrief of what emerged on the page.
