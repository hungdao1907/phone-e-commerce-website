# Design System

## Project Direction

This project is a premium consumer technology e-commerce frontend.

The visual direction should feel:

- premium
- modern
- spacious
- editorial
- product-focused
- clean
- motion-rich but controlled

The website should not look like a generic SaaS dashboard or an AI-generated template.

---

## Design Principles

### 1. Product First

Products, imagery and typography should carry the visual hierarchy.

Avoid adding decorative elements that compete with the product.

### 2. Spacious Layout

Use generous spacing between major sections.

Do not make the interface unnecessarily dense.

### 3. Strong Hierarchy

Use clear differences between:

- eyebrow text
- section headings
- body copy
- metadata
- CTA labels

### 4. Controlled Accent Color

Green is the primary accent color.

Use it for:

- primary CTA
- active states
- small highlights
- selected controls
- subtle interaction feedback

Do not use green glow everywhere.

### 5. Immersive Moments

Only selected sections should feel highly immersive.

Examples:

- Hero
- 3D product showcase
- WaveGallery

Commerce UI such as ProductCard, filters and cart should remain calmer.

---

## Color System

### Background

Primary background:

`#F5F5F7`

White surface:

`#FFFFFF`

Dark immersive surface:

Use a very dark navy or forest tone when needed.

Avoid using many unrelated dark colors.

### Text

Primary text:

`#1D1D1F`

Secondary text:

`#6E6E73`

Muted text should remain readable.

### Accent

Primary accent:

Green currently used by the project.

Use the existing project green consistently unless the design system is intentionally changed later.

Do not introduce multiple competing accent colors.

---

## Color Balance

Target approximately:

- 80% neutral / light surfaces
- 15% dark immersive sections
- 5% accent color

This is a guideline, not a strict formula.

---

## Typography

Primary body font:

Inter

Display typography may use the existing Anton font when appropriate.

### Hierarchy

Large display headings:
- bold
- high contrast
- generous line-height control

Section headings:
- strong but smaller than hero text

Body:
- readable
- restrained line length

Metadata / eyebrow:
- smaller
- uppercase when appropriate
- increased letter spacing

Avoid using too many font sizes in a single section.

---

## Layout

Prefer centered containers.

Typical maximum content width:

`1280px` to `1440px`

Use responsive horizontal padding.

Suggested pattern:

- mobile: 16px
- tablet: 24px
- desktop: 32px or more when appropriate

Do not make every section full-width if content readability suffers.

---

## Section Structure

A typical content section should follow:

Eyebrow
→ Heading
→ Supporting text
→ Content
→ Optional CTA

Do not force this structure when the section does not need all elements.

---

## Spacing

Use consistent spacing rhythm.

Prefer a small set of spacing values instead of arbitrary values everywhere.

Major sections should have generous vertical separation.

Product cards and commerce UI should use tighter spacing than hero sections.

---

## Border Radius

Use rounded corners carefully.

Product cards:
- medium to large radius

Buttons:
- consistent radius

Do not apply large rounded corners to every container.

Avoid creating a "card inside card inside card" visual hierarchy.

---

## Shadows

Use shadows to communicate depth.

Prefer:

- soft
- wide
- low-opacity

Avoid:

- heavy black shadows
- neon shadows
- excessive floating effects

Immersive components may use stronger depth when justified.

---

## Product Cards

ProductCard should feel:

- clean
- premium
- image-first
- easy to scan

Priority:

1. product image
2. product name
3. product price
4. brand / metadata
5. supporting actions

Avoid overcrowding cards.

ProductCard should be reusable across:

- FeaturedProductsSection
- ProductsPage
- recommendations

Special interaction effects may be applied only in a specific presentation context.

---

## Product Images

Use:

- `object-contain`
- consistent image area
- generous whitespace

Do not crop important product hardware unless intentionally designed.

Keep image proportions stable across cards.

---

## Buttons

### Primary

Used for the main action.

Examples:

- Mua ngay
- Khám phá sản phẩm
- Thêm vào giỏ hàng

Primary actions may use the green accent.

### Secondary

Should be quieter.

Examples:

- Xem chi tiết
- Tìm hiểu thêm

Avoid multiple visually dominant CTA buttons inside the same small area.

---

## Navigation

Preserve the current mega-menu architecture.

Navigation should feel:

- minimal
- precise
- premium

Naming should be consistent.

Prefer:

- Laptop
- Tablet
- iPhone
- Smartphone
- Watch
- Hỗ trợ

Avoid inconsistent casing such as:

- LapTop
- TabLet
- SmartPhone

---

## Homepage Visual Rhythm

Preferred structure:

Hero
→ Brand transition / marquee
→ Featured commerce content
→ Immersive visual section
→ Footer

The page should alternate between:

calm
→ emphasis
→ calm
→ immersive

Avoid making every section visually intense.

---

## Accessibility

Always consider:

- readable contrast
- semantic interactive elements
- visible keyboard focus
- useful image alt text
- mobile touch targets
- reduced motion where relevant

---

## Anti-Patterns

Avoid:

- generic SaaS cards
- excessive glassmorphism
- excessive gradients
- random neon glow
- excessive pill-shaped UI
- unnecessary dashboards
- too many cards
- too many badges
- overly dense layouts
- inconsistent spacing
- decorative animation without purpose
- introducing new visual languages inside isolated sections

---

## Existing Elements To Preserve

Unless explicitly redesigning them:

- Spline hero experience
- iPhone 3D viewer
- WaveGallery perspective interaction
- current mega-menu architecture
- large editorial typography
- spacious homepage opening

Improve around these elements rather than replacing them automatically.