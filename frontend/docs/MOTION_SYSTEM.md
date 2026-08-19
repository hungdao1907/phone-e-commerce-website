# Motion System

## Motion Philosophy

Motion is an important part of this project.

Animation should make the interface feel:

- premium
- responsive
- spatial
- intentional
- polished

Motion must support visual hierarchy and interaction.

Do not animate elements only because animation is possible.

---

## Motion Intensity

There are three motion levels.

### Level 1 — Functional

Used for:

- buttons
- links
- hover states
- focus states
- dropdowns

Movement should be subtle.

### Level 2 — Presentation

Used for:

- section reveals
- ProductCard interactions
- image transitions
- staggered content

Movement can be more noticeable but should remain controlled.

### Level 3 — Immersive

Reserved for:

- Hero 3D
- iPhone 3D viewer
- WaveGallery
- future major storytelling sections

Do not use Level 3 motion for ordinary commerce UI.

---

## Core Motion Patterns

The project should reuse a small set of motion patterns.

### 1. Section Reveal

Use for major content entering the viewport.

Typical starting state:

- opacity: 0
- translateY: 24px to 40px

Final state:

- opacity: 1
- translateY: 0

Typical duration:

300ms to 600ms

Avoid very long entrance animations.

---

### 2. Stagger Reveal

Use when multiple related items appear together.

Examples:

- ProductCards
- category cards
- feature items

Typical delay between items:

60ms to 120ms

Stagger should communicate sequence, not slow down the user.

---

### 3. Card Focus

Used mainly in curated or featured sections.

Possible behavior:

Active card:
- scale around 1.02 to 1.05
- slight translateY upward
- stronger depth/shadow

Surrounding cards:
- slightly reduced scale
- slightly reduced opacity
- optional small blur in special featured contexts

Do not use strong group blur in large product catalogs.

---

### 4. Image Depth

Product images may move independently from their card.

Typical hover behavior:

- scale: 1.03 to 1.07
- translateY: -2px to -8px

Movement should remain small.

Do not distort the image.

---

### 5. CTA Motion

CTA interactions should be subtle.

Examples:

Arrow:

`translateX(0) → translateX(4px)`

Button:

small scale or background transition

Avoid bouncing CTA elements.

---

### 6. Menu Motion

Mega-menu and navigation motion should be quick and precise.

Use:

- opacity
- translateY
- subtle backdrop transitions

Avoid oversized movement.

Menu interaction should never feel slower than navigation intent.

---

## 3D Motion

3D motion is reserved for specific experiences.

Current important experiences:

- Hero Spline scene
- iPhone GLB viewer
- WaveGallery perspective

Do not add 3D tilt to every component.

When 3D card tilt is used:

- keep maximum rotation approximately 4° to 8°
- reset smoothly
- disable or simplify on touch devices

---

## Hover Timing

Typical hover transition:

200ms to 400ms

More complex card interactions:

300ms to 500ms

Avoid slow hover interactions above approximately 600ms unless intentionally cinematic.

---

## Easing

Prefer smooth easing.

Examples conceptually:

- ease-out for entrances
- ease-in-out for state transitions
- spring only when the interaction benefits from physical feedback

Avoid excessive spring/bounce effects.

---

## Scroll Animation

Scroll-based animation may be used for:

- section reveals
- storytelling
- image sequencing
- selected featured experiences

Do not make normal reading depend on scroll animation.

Content must remain understandable without animation.

---

## Continuous Animation

Continuous loops should be rare.

Allowed examples:

- brand marquee
- subtle existing visual atmosphere
- 3D auto-rotation where already appropriate

Avoid adding continuous motion to:

- ProductCards
- buttons
- pricing
- filters
- cart items
- text blocks

Continuous motion increases distraction and rendering cost.

---

## ProductCard Motion

Default ProductCard:

- subtle hover lift
- image depth
- shadow transition

Featured ProductCard may use stronger interaction such as:

- group de-emphasis
- stagger entrance
- focused card scale
- small blur on surrounding cards

Full catalog ProductCard should remain calmer.

---

## Mobile / Touch

Do not rely on hover.

On touch devices:

- remove pointer tilt
- remove hover-only information
- use simple press feedback when helpful
- keep cards fully visible

Motion should never block content access.

---

## Reduced Motion

Respect:

`prefers-reduced-motion`

When reduced motion is enabled:

- remove large entrance translations
- disable decorative 3D tilt
- stop unnecessary continuous animation where practical
- preserve usability
- preserve content hierarchy

Do not hide content because motion is disabled.

---

## Performance

Prefer GPU-friendly properties:

- transform
- opacity

Avoid continuously animating:

- width
- height
- top
- left
- large blur values

Avoid React state updates on every pointer move when a CSS or MotionValue solution is available.

Avoid layout thrashing.

---

## Motion Consistency

Before adding a new animation, ask:

1. Does an existing motion pattern already solve this?
2. Does this interaction need movement?
3. Is the motion level appropriate for the component?
4. Does it compete with Hero, WaveGallery or 3D experiences?
5. Does it work on mobile?
6. Does it respect reduced motion?

Prefer reuse over inventing a new animation style.

---

## Homepage Motion Rhythm

Recommended intensity:

Hero:
Level 3

BrandMarquee:
Level 2, lightweight continuous motion

FeaturedProducts:
Level 2

WaveGallery:
Level 3

Footer:
Level 1 or mostly static

This creates a rhythm:

immersive
→ calm transition
→ interactive commerce
→ immersive
→ calm ending

---

## Anti-Patterns

Avoid:

- bounce everywhere
- large rotations
- random parallax
- excessive blur
- excessive scale
- long delays
- slow navigation
- infinite card animations
- animation on every text element
- multiple unrelated motion styles in one section
- motion that causes layout shift