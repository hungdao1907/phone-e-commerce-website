# Project: Phone E-commerce Frontend

## Project Goal

Build a premium, modern e-commerce frontend for phones, laptops and accessories.

Current priority is frontend UI/UX only.

Backend, database, authentication, inventory, admin logic and payment integration will be implemented later.

## Current Stack

- React 19
- TypeScript
- Vite
- React Router DOM
- Tailwind CSS 4
- Zustand
- TanStack React Query
- Three.js
- React Three Fiber
- Drei
- Spline
- Lucide React

## Current Architecture

Important existing areas:

- `src/pages`
- `src/components/layout`
- `src/components/sections`
- `src/data`
- `src/store`

Existing routes:

- `/`
- `/iphone`

The existing iPhone 3D experience is important and must be preserved unless explicitly requested.

## Frontend Priorities

Prioritize:

1. visual quality
2. layout
3. responsive behavior
4. interaction
5. animation
6. accessibility
7. clean reusable components

Do not prioritize backend architecture yet.

## Design Direction

The UI should feel:

- premium
- clean
- modern
- spacious
- product-focused
- visually creative
- motion-rich but not chaotic

Avoid generic AI-generated SaaS styling.

Avoid:

- excessive gradients
- excessive glassmorphism
- random neon glow
- excessive rounded cards
- unnecessary dashboard-like styling
- excessive animation
- inconsistent visual languages

Use strong visual hierarchy.

## Motion Direction

Animation is an important part of this project.

Prefer:

- smooth section reveals
- staggered elements
- subtle card interactions
- image depth
- scroll-based storytelling where appropriate
- premium transitions
- transform and opacity based animations

Avoid:

- excessive bouncing
- spinning
- aggressive scaling
- constant infinite animation without purpose
- distracting motion

Respect reduced-motion preferences where practical.

## React Rules

- Use functional components.
- Use TypeScript.
- Avoid `any`.
- Keep components focused.
- Reuse components instead of duplicating markup.
- Avoid unnecessary `useEffect`.
- Avoid unnecessary global state.
- Do not introduce abstractions without a clear benefit.

## Styling Rules

- Use Tailwind CSS as the primary styling approach.
- Follow existing project conventions.
- Keep mobile responsiveness in mind.
- Avoid adding a new styling library without explicit approval.
- Avoid large global CSS changes for a local component task.

## Data Rules

For now:

- use mock frontend data
- do not design backend/database schemas unless requested
- do not create fake APIs
- do not add backend dependencies

Product UI should remain easy to connect to a backend later.

## Existing Feature Protection

Unless explicitly requested, do not modify:

- `IphonePage.tsx`
- the existing 3D viewer
- GLB model files
- Hero behavior
- WaveGallery behavior
- GlobalNav behavior
- unrelated homepage sections

Do not refactor unrelated files as part of a small UI task.

## Dependency Rules

Before installing a package:

1. check whether an existing dependency already solves the problem
2. prefer the current stack
3. do not install a package for a trivial utility
4. ask only if introducing the dependency would meaningfully affect architecture

## Workflow

Before editing:

1. inspect relevant existing files
2. understand the current component/data flow
3. keep the task scope narrow

For small well-defined tasks, implement directly.

For architecture-changing tasks, produce a short plan before implementation.

After editing:

1. run `npm run lint`
2. run `npm run build` when appropriate
3. fix errors caused by the changes
4. review the diff for unrelated modifications

## Git

Current development branch:

`Minh`

Do not:

- switch branches
- commit automatically
- run `git add .`
- reset history
- modify Git configuration

unless explicitly asked.

## Final Response

After a coding task, summarize:

- files created
- files modified
- what changed
- validation performed
- remaining relevant issues

Keep the report concise.