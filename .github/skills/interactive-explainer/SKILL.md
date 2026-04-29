---
name: interactive-explainer
description: >
  Generates single-file, zero-dependency interactive HTML explainers in the style of
  Nicky Case. Use when a user wants to learn about or explain a concept through an
  explorable, hands-on mini-page with draggable elements, sliders, toggles, and
  step-by-step narrative. Produces one self-contained .html file with inline CSS and JS.
metadata:
  version: "1.0.0"
  author: "IT.Commercial.Copilot"
---

# interactive-explainer: Nicky Case–Style Interactive Explainers

Build single-file, zero-dependency interactive HTML pages that teach a concept through play, in the spirit of [Nicky Case's Explorable Explanations](https://ncase.me/).

## Core Responsibilities

1. **Concept Distillation** — Break the requested topic into a clear narrative arc with 3–7 sections.
2. **Interactive Generation** — Produce a single `.html` file containing all markup, styles, and scripts inline.
3. **Visual Restraint** — Use minimal color (near-monochrome + one accent). Focus on content and communication over decoration.
4. **Zero Dependencies** — No CDN links, no npm packages, no frameworks. Pure HTML + CSS + JS.

---

## Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Show, don't tell** | Every concept gets an interactive widget — slider, toggle, drag, or animation — not just prose. |
| **Progressive disclosure** | Start simple. Each section builds on the last. Don't front-load complexity. |
| **Minimal palette** | Use `#222` for text, `#fafafa` for background, and **one** accent color (default `#1a73e8`). Keep it calm. |
| **Readable typography** | System font stack, 18–20 px body, 1.6 line-height, max-width 640 px centered. |
| **Responsive** | Works on phones. Use relative units. No horizontal scroll. |
| **Accessible** | Semantic HTML, visible focus rings, `aria-label` on interactive controls, respects `prefers-reduced-motion`. |
| **Self-contained** | Everything in one file. A teacher should be able to email it as an attachment and it just works. |

---

## Workflow

### Phase 1: Topic Analysis

1. Identify the core concept the user wants to explain.
2. Ask clarifying questions **only if** the topic is genuinely ambiguous. Otherwise, proceed.
3. Outline 3–7 sections forming a narrative arc:
   - **Hook** — Why should I care?
   - **Core model** — The simplest version of the idea.
   - **Interactive exploration** — Let the reader play with the model.
   - **Nuance / edge cases** — What changes when you push the parameters?
   - **Takeaway** — What should the reader remember?

### Phase 2: Interactive Design

For each section, choose an appropriate interaction pattern:

| Pattern | Good For | Example |
|---------|----------|---------|
| **Slider** | Continuous parameters (rate, size, probability) | Drag to change infection rate |
| **Toggle / checkbox** | Binary states, feature flags | Turn herd immunity on/off |
| **Drag-and-drop** | Spatial reasoning, sorting | Arrange nodes in a graph |
| **Step-through** | Sequential processes | Click "Next" to advance a simulation tick |
| **Canvas animation** | Particle systems, cellular automata, flocking | Dots moving on screen |
| **Inline reactive text** | Showing how a formula changes | "If rate = **{r}**, then output = **{r × 10}**" |
| **Hover / tap reveal** | Definitions, footnotes | Hover for a tooltip explanation |

Keep interactions **purposeful** — each one should answer a question or test an intuition.

### Phase 3: Code Generation

Generate a single HTML file with this structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Explainer: {Topic}</title>
  <style>
    /* All styles inline — minimal, near-monochrome + one accent */
  </style>
</head>
<body>
  <main>
    <!-- Narrative sections with embedded interactive elements -->
  </main>
  <script>
    /* All JavaScript inline — no external dependencies */
  </script>
</body>
</html>
```

**Mandatory rules:**

- NO `<link>` or `<script src="...">` tags. Everything inline.
- NO external fonts. Use the system font stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`.
- CSS: minimize color usage. Default palette:
  - Background: `#fafafa`
  - Text: `#222`
  - Accent: `#1a73e8` (or user-specified)
  - Muted: `#666`
  - Borders: `#ddd`
- Interactive elements must have clear affordances (cursor: pointer, visible borders, labels).
- Animations should respect `prefers-reduced-motion: reduce`.
- Use `<canvas>` for simulations, plain DOM for sliders/toggles/text.
- Use semantic elements: `<section>`, `<figure>`, `<figcaption>`, `<label>`, `<details>`.

### Phase 4: Review & Polish

Before delivering:

1. **Narrative check** — Does the explainer tell a coherent story from hook to takeaway?
2. **Interaction check** — Does every interactive element have a visible label and clear purpose?
3. **Accessibility check** — Are all controls keyboard-navigable? Do animations respect reduced-motion?
4. **Mobile check** — Will it work at 375 px wide? No fixed-width elements.
5. **Color check** — No more than 3 colors total (bg, text, accent). No gradients, no shadows for decoration.

---

## Interaction Patterns — Code Reference

### Slider with Reactive Text

```html
<label for="rate">Rate: <strong id="rate-val">5</strong></label>
<input type="range" id="rate" min="1" max="20" value="5">
<p>At this rate, the result is <strong id="result">50</strong>.</p>
<script>
  const rateEl = document.getElementById('rate');
  const rateVal = document.getElementById('rate-val');
  const result = document.getElementById('result');
  rateEl.addEventListener('input', () => {
    const r = Number(rateEl.value);
    rateVal.textContent = r;
    result.textContent = r * 10;
  });
</script>
```

### Canvas Simulation Skeleton

```html
<canvas id="sim" width="600" height="400" role="img" aria-label="Simulation of {concept}"></canvas>
<script>
  const canvas = document.getElementById('sim');
  const ctx = canvas.getContext('2d');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // ... draw entities ...
    if (!prefersReducedMotion) requestAnimationFrame(draw);
  }
  draw();
</script>
```

### Toggle with State

```html
<label><input type="checkbox" id="toggle"> Enable feature</label>
<script>
  document.getElementById('toggle').addEventListener('change', (e) => {
    const enabled = e.target.checked;
    // update simulation or display
  });
</script>
```

---

## Anti-Patterns (DO NOT)

| Anti-Pattern | Why |
|--------------|-----|
| External CDN links | Breaks the zero-dependency rule; won't work offline |
| Heavy color palettes, gradients, box-shadows | Distracts from content; violates minimal color principle |
| Walls of text without interaction | This is an *interactive* explainer, not a blog post |
| Unexplained controls | Every slider/button needs a label explaining what it changes |
| Autoplay animations with no pause | Accessibility violation; respect `prefers-reduced-motion` |
| Framework-specific code (React, Vue, etc.) | Must be vanilla JS for zero-dependency |
| Multiple files | Output must be a **single** `.html` file |

---

## Scoring (100 points)

| Category | Points | Criteria |
|----------|--------|----------|
| **Narrative Arc** | 20 | Clear hook → model → explore → nuance → takeaway structure |
| **Interactivity** | 25 | Every core concept has a hands-on element; interactions are purposeful |
| **Visual Restraint** | 15 | Minimal color palette; clean typography; no decorative clutter |
| **Accessibility** | 15 | Keyboard navigable; labels on controls; reduced-motion respected |
| **Code Quality** | 15 | Clean vanilla JS; no dependencies; semantic HTML; well-structured |
| **Responsiveness** | 10 | Works at 375 px; no horizontal scroll; touch-friendly controls |

**Thresholds**: 80+ Deploy | 60–79 Review | <60 Revise

---

## Notes

- Default output filename: `explainer-{topic-slug}.html`
- If the user asks for multiple related explainers, generate separate files — don't combine into one mega-page.
- When the topic is code/programming, include runnable code snippets inside the explainer where appropriate.
- For math-heavy topics, render equations as styled HTML (sup/sub) or simple SVG — no MathJax/KaTeX CDN.
