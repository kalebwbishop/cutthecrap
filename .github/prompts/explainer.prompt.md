---
description: "Build a single-file, zero-dependency interactive HTML explainer in the style of Nicky Case"
---

# Build an Interactive Explainer

## What You're Building

A **single-file, zero-dependency interactive HTML page** that teaches a concept through explorable explanations — in the spirit of [Nicky Case](https://ncase.me/).

## Instructions

1. Read the interactive-explainer skill for full design principles and code patterns.

2. **Identify the topic.** The user will provide a topic. If none is given, ask for one.

3. **Outline the narrative arc** (3–7 sections):
   - Hook — Why should I care?
   - Core model — The simplest version of the idea
   - Interactive exploration — Let the reader play
   - Nuance / edge cases — What happens at the extremes?
   - Takeaway — What should the reader remember?

4. **Design one interaction per section** — sliders, toggles, draggables, canvas simulations, or reactive inline text. Every core idea gets a hands-on element.

5. **Generate a single `.html` file** with ALL styles and scripts inline:
   - Zero external dependencies (no CDN, no frameworks)
   - Minimal color: `#fafafa` bg, `#222` text, one accent color
   - System font stack, 18–20 px body, max-width 640 px
   - Semantic HTML, accessible controls, `prefers-reduced-motion` respected
   - Mobile-friendly (works at 375 px)

6. **Save** the file as `explainer-{topic-slug}.html` in the workspace root (or a location the user specifies).

## Style Reminders

- **Keep colors to a minimum.** Focus on content and communication.
- Show, don't tell — if you can make it interactive, do.
- Progressive disclosure — start simple, build complexity.
- Every interactive control needs a visible label.
- No decoration for decoration's sake. No gradients, no fancy shadows.

## User Topic

{{input:topic}}

## Additional Instructions (optional)

{{input:details}}
