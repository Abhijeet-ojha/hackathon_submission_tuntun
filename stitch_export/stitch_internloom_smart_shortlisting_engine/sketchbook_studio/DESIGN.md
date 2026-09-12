---
name: Sketchbook Studio
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e4e2e1'
  on-surface: '#1b1c1c'
  on-surface-variant: '#424750'
  inverse-surface: '#303030'
  inverse-on-surface: '#f3f0f0'
  outline: '#737782'
  outline-variant: '#c3c6d2'
  surface-tint: '#2e5ea2'
  primary: '#074588'
  on-primary: '#ffffff'
  primary-container: '#2d5da1'
  on-primary-container: '#c4d7ff'
  inverse-primary: '#a9c7ff'
  secondary: '#b71422'
  on-secondary: '#ffffff'
  secondary-container: '#db3237'
  on-secondary-container: '#fffbff'
  tertiary: '#636037'
  on-tertiary: '#ffffff'
  tertiary-container: '#b1ad7d'
  on-tertiary-container: '#43411b'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#a9c7ff'
  on-primary-fixed: '#001b3d'
  on-primary-fixed-variant: '#0a4689'
  secondary-fixed: '#ffdad7'
  secondary-fixed-dim: '#ffb3ae'
  on-secondary-fixed: '#410004'
  on-secondary-fixed-variant: '#930014'
  tertiary-fixed: '#eae4b1'
  tertiary-fixed-dim: '#cdc897'
  on-tertiary-fixed: '#1e1c00'
  on-tertiary-fixed-variant: '#4b4822'
  background: '#fcf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e1'
typography:
  display-lg:
    fontFamily: Epilogue
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-xl:
    fontFamily: Epilogue
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Epilogue
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
  headline-md:
    fontFamily: Epilogue
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Karla
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 26px
  body-md:
    fontFamily: Karla
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Karla
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Karla
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 18px
    letterSpacing: 0.02em
  label-md:
    fontFamily: Karla
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.03em
  label-sm:
    fontFamily: Karla
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-sm: 0.75rem
  gutter-lg: 2rem
  margin: 1.5rem
  margin-mobile: 1rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system delivers a tactile, physical desk environment for early-career recruiting and shortlisting. By rejecting sterile, corporate ATS conventions, the aesthetic replaces automated coldness with the intimacy of a mentor's working notebook. It feels hands-on, deliberate, and deeply human.

The design movement is **Tactile Sketchbook Collage**:
- **Textures & Metaphors**: Physical paper stocks, ruled margins, washi-tape tabs, ballpoint scribbles, and paperclip fasteners.
- **Tone**: Analytical yet warm, candid, creative, and craft-driven.
- **Personality**: Grounded, playful, observant, and discerning. It treats candidates as portfolios and human stories rather than database entries.

## Colors

The color palette reflects an analog desk setup: archival stationery, drafting pens, revision markers, and adhesive notes.

- **Primary (`#2d5da1` - Ballpoint Blue)**: Core actions, selected states, key interactive labels, and primary ink annotations.
- **Secondary (`#ff4d4d` - Marker Red)**: Rejections, flags, urgent bookmarks, high-priority score highlights, and energetic markup circles.
- **Tertiary (`#fff9c4` - Post-It Yellow)**: Contextual tooltips, quick notes, callout cards, and review highlights.
- **Neutral (`#2d2d2d` - Pencil Black)**: Structural line art, irregular strokes, iconography, and high-legibility body text.
- **Canvas Base (`#fdfbf7` - Notebook Paper)**: Warm, off-white foundation covered with an ultra-subtle dot grid pattern (`#e2ddd5`, 16px repeat).
- **Surface Accent (`#e5e0d8` - Muted Old Paper)**: Card backing, disabled regions, drop-zones, and divider cards.

## Typography

Typography balances handcrafted character with high-throughput candidate scanning:

- **Headings (Epilogue)**: Imparts structural, punchy authority with slightly quirky grotesque details. It captures an editorial, notebook-journal header quality without compromising visual hierarchy.
- **Body & Data (Karla)**: Irregular grotesque proportions that harmonize with the hand-drawn ethos while remaining exceptionally crisp and legible for resumes, tags, evaluation matrices, and fine-print criteria.
- **Decorative Accents**: Underlines, asterisks, circling marks, and brackets should be rendered as SVG sketches to simulate manual annotations over the type.

## Layout & Spacing

The layout is structured around an intentional collage grid:

- **Desktop (12 Columns)**: Fluid system with `margin-desktop` (3rem) and `gutter` (1.25rem). Panels mimic distinct desk sheets: candidate pipeline, active dossier, and rubric scorecard.
- **Tablet (8 Columns)**: Collapsible sidebar dossiers; content reflows with `gutter-sm` (0.75rem).
- **Mobile (4 Columns)**: Single-column stack with sticky navigation resembling index tabs at the bottom.
- **Collage Overlaps**: Elements can offset their alignment by subtle tilt rotations (-1deg to 1.5deg) and negative z-index overlaps of 4px to 8px to break rigid grid boundaries.

## Elevation & Depth

Elevation is rendered strictly through physical paper layers, zero-blur hard offset shadows, and structural outlines:

- **Borders**: All cards, inputs, and buttons utilize a solid 2px stroke in `#2d2d2d`. Border paths feature slight SVG jitter or asymmetrical corner radii to evoke hand-cut cardstock.
- **Flat Offset Shadows**: No ambient or Gaussian blurs are used anywhere.
  - **Level 1 (Base Cards / Inputs)**: `2px 2px 0px #2d2d2d`
  - **Level 2 (Interactive Cards / Floating Chips)**: `4px 4px 0px #2d2d2d`
  - **Level 3 (Modals / Overlays / Active Drags)**: `6px 6px 0px #2d2d2d`
- **Tonal Stacking**: Modals and drawers feature a semi-transparent textured backdrop `#2d2d2d15` overlaid on the warm dot grid.

## Shapes

The shape system adopts a deliberate "hand-cut paper" logic:

- **Border Radius**: Subtly softened corners (`0.25rem` to `0.5rem`) paired with uneven diagonal radii (e.g., `3px 6px 4px 7px`) create an authentic sketchbook silhouette.
- **Torn & Skewed Edges**: Header containers and tab stops utilize zig-zag perforated bottom borders (`polygon()` masks) to evoke tear-off sheets.
- **Adhesive Accents**: Semi-translucent rectangles (`#ffffff88` or pastel yellow) with 45-degree corner clippings function as masking tape anchors over card headers.

## Components

### Buttons
- **Primary**: Solid `#2d5da1` fill, crisp white `#fdfbf7` text, 2px `#2d2d2d` border, and `4px 4px 0px #2d2d2d` hard shadow. On press: translates `2px 2px` with shadow reduced to `2px 2px`.
- **Secondary (Correction Red)**: Solid `#ff4d4d` fill with high-contrast text for high-impact actions (e.g., "Shortlist Now").
- **Tertiary / Scribble Button**: Transparent background, thick hand-drawn double-underline border, neutral text.

### Candidate Cards
- Rendered on `#fdfbf7` or `#fff9c4` (for starred prospects) with an offset 2px border and a faux masking-tape strip centered on the top edge.
- Quick metrics (Match %, Years Exp) appear as stamped badges with circular border lines and a tilted angle (-3deg).

### Chips & Tags
- Pill-shaped cards (`roundedness: 1`) with `#e5e0d8` fill, 1.5px pencil-black border, and handwritten-style labels.
- Selected chips shift to `#2d5da1` with inverted text and a 2px offset drop-shadow.

### Inputs & Text Areas
- Unfilled notebook style: light horizontal ruled lines (`#e2ddd5`) across the input surface, or an offset container with an inset pencil border.
- Focus state: Outline darkens to `#2d5da1` with a faint yellow-marker halo (`0 0 0 3px #fff9c4`).

### Checkboxes & Radios
- Hand-drawn square/circle glyphs. Checked state displays a hand-scribbled "X" or checkmark in `#ff4d4d` or `#2d5da1`.

### Shortlisting Pipeline & Rubric Table
- Columns resemble stapled manila folders. Dragged cards rotate +2deg and cast a Level 3 hard shadow (`6px 6px 0px #2d2d2d`).
- Rubric criteria ratings render as hand-drawn score rings or pencil hash-marks.