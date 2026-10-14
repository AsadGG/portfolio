# Portfolio

The personal portfolio of Asad Ur Rahman, a full-stack software engineer. It is a single-page site covering intro, highlights, skills, experience and education. Each Project opens in a dialog with an image gallery. Behind the content, a WebGL scene shows a 3D gallery of Project thumbnails.

## Stack

- [TanStack Start](https://tanstack.com/start) in SPA mode, with [TanStack Router](https://tanstack.com/router) file-based routing
- React 19 with the React Compiler
- [TanStack DB](https://tanstack.com/db) and TanStack Query for content, fetched with [ky](https://github.com/sindresorhus/ky) and validated with [zod](https://zod.dev)
- [Tailwind CSS](https://tailwindcss.com) v4 and [shadcn/ui](https://ui.shadcn.com) on Base UI
- [React Three Fiber](https://r3f.docs.pmnd.rs) and drei for the background scene
- [Vite+](https://www.npmjs.com/package/vite-plus) (`vp`) for the dev server, build, lint, format, type checks and unit tests
- Playwright and axe-core for end-to-end and accessibility tests

## Getting started

Install dependencies with npm or pnpm. Vite+ is a project dependency, so no global CLI is needed.

```bash
npm install
npm run dev
```

The dev server runs at http://localhost:3000.

## Scripts

| Script                    | What it does                                                   |
| ------------------------- | -------------------------------------------------------------- |
| `npm run dev`             | Start the dev server on port 3000                              |
| `npm run build`           | Build the static site                                          |
| `npm run preview`         | Serve the production build locally                             |
| `npm test`                | Run unit tests in `tests/` once                                |
| `npm run test:watch`      | Run unit tests in watch mode                                   |
| `npm run test:e2e`        | Run Playwright tests in `e2e/` (starts the dev server for you) |
| `npm run lint`            | Lint with type-aware rules and type checking                   |
| `npm run format`          | Format the code                                                |
| `npm run check`           | Format, lint and type checks in one pass                       |
| `npm run images:cards`    | Regenerate card-sized Project thumbnails                       |
| `npm run generate-routes` | Regenerate `src/routeTree.gen.ts`                              |

A pre-commit hook runs `vp check --fix` on staged files.

## Content

The site's content is not in the code. It lives as JSON in [public/content/](public/content/), one file per entity:

| File                    | Holds                                              |
| ----------------------- | -------------------------------------------------- |
| `profile.json`          | Name, Headline, Intro and contact details          |
| `highlights.json`       | Career Highlights                                  |
| `skill-categories.json` | Skill Categories                                   |
| `skills.json`           | Skills and their categories                        |
| `engagements.json`      | Employments and Freelance work                     |
| `projects.json`         | Projects, their Parts, Images and Skills           |
| `education.json`        | The degree                                         |

Each file uses the same envelope a future API will return (`statusCode`, `message`, `data`). At runtime ky fetches the files and loads each one into its own TanStack DB collection, and zod validates them on the way in. Records refer to each other by id: a Project names its Engagement and Skills, and a Skill names its category. Live queries join them. The schemas are in [src/data/data-module.ts](src/data/data-module.ts), and the unit tests check that every reference resolves.

To change what the site shows, edit these files. Project images go under `public/content/images/<project>/`. After adding or changing them, run `npm run images:cards` to write small copies under `public/content/cards/` and record them as `cardSrc` in `projects.json`.

## Project layout

```
public/content/     JSON content, project images and card thumbnails
scripts/            Card thumbnail generator
src/routes/         Routes (the site is a single route, index.tsx)
src/components/     Section components, the project dialog and the 3D background
src/components/ui/  shadcn components
src/data/           Collections, schemas and per-section view hooks
tests/              Unit tests (Vitest via Vite+)
e2e/                Playwright tests
docs/adr/           Architecture decision records
```

## Documentation

- [GLOSSARY.md](GLOSSARY.md) defines the domain terms used in code and content (Engagement, Project, Part, Highlight and so on).
- [CODING_STANDARDS.md](CODING_STANDARDS.md) covers the styling and component rules: Tailwind before CSS, shadcn before raw HTML.
- [docs/adr/](docs/adr/) records why content is fetched as static JSON and why the site runs in SPA mode for static hosting on GitHub Pages.
