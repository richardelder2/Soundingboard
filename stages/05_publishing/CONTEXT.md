---
type: StageContract
stage_id: "05_publishing"
name: Serial Manuscript Compilation & eBook Rendering
inputs:
  - stages/03_drafting/output/chapters/  # gated by manuscript.json status
  - manuscript.json
outputs:
  - stages/05_publishing/output/manuscript.html
  - stages/05_publishing/output/manuscript.epub
  - stages/05_publishing/output/blurb_launch_kit.md
  - stages/05_publishing/output/query_letter.md
---

# Stage 05: Publishing Compiled Outputs & Marketing Launch Kit

## Process
1. Run `node scripts/soundingboard.js compile` (wraps `scripts/compile_manuscript.js`):
   - Compiles chapters in `manuscript.json` order into a single print-serif HTML file (title page, small-caps chapter heads, scene-break glyphs, justified indented paragraphs).
   - **Only chapters with `status: passed` are included** — the Stage 04 gate is enforced here. `--all` overrides for preview builds.
   - When `pandoc` is installed, also exports `manuscript.epub` with title/author metadata.
2. Review the compiled HTML for rendering issues (broken scene breaks, orphaned headings) before distributing the EPUB.
3. Optional: run further Pandoc conversions (docx for editors, pdf via a LaTeX engine) from the same HTML.
4. Generate the **Marketing & Commercial Launch Kit**:
   - Instantiate `_config/templates/blurb_launch_kit.template.md` to `stages/05_publishing/output/blurb_launch_kit.md` (featuring 1-line ad hooks, 50-word Amazon above-the-fold blurb, and 180-word 3-paragraph commercial back cover).
   - Instantiate `_config/templates/query_letter.template.md` to `stages/05_publishing/output/query_letter.md` (featuring the industry-standard 1-page query letter and 1-page comprehensive narrative synopsis).
