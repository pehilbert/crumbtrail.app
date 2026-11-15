# Crumbtrail frontend

The Angular frontend for Crumbtrail, a recipe-keeping and journaling app. The API is a separate NestJS repo: https://github.com/pehilbert/crumbtrail.api.

## Read first

- **[docs/frontend.md](docs/frontend.md): the stack, the auth design, rendering, mobile plans, and the reasons behind each.** Follow it, and update it in the same change when a decision changes.
- [docs/README.md](docs/README.md): an index of the docs and the API conventions the app relies on.
- [docs/api/](docs/api/): a read-only copy of the API's docs. The prose in `docs/api/endpoints/` is the contract. `docs/api/openapi.json` is generated from the API's code and may lag behind the prose (at the copied commit, it doesn't include refresh or logout).
  - Don't edit these files here. Copy them again from the API repo, and update the commit noted in `docs/README.md`.
- **The design system:** read its brand book (`project/README.md`) and `project/tokens.json` with the Artifact tool: https://claude.ai/artifact/9yyZYzKubNX9ECiBMi2XQ4
- **The mockups:** one `.dc.html` file per screen under `project/`, on https://claude.ai/artifact/KYmJ9fXsZsbyqEZCo9PCxh. Read a screen before building it.

## Repo layout

- `web/`: the Angular app. Run all npm and `ng` commands from `web/`.
- `docs/`: design docs.

## How to work on a feature

1. Read `docs/frontend.md`, the relevant API endpoint docs, and the mockup for the screen.
2. Raise questions or suggested design changes with the user before writing code.
3. Branch off `main` (`feature/<name>`). Don't commit until the user has reviewed the work.

## Commands (run in `web/`)

- `npm start`: the dev server at http://localhost:4200. The API runs separately at http://localhost:3000; `/api` should be proxied to it (the proxy isn't set up yet).
- `npm test`: unit tests with Vitest (`*.spec.ts`, next to the source file).
- `npm run build`: a production build in `dist/`.
- `npx prettier --write .`: formatting (100 columns, single quotes; see `.prettierrc`).

## Code conventions

- **Angular 22 defaults:** standalone components, signals for state, zoneless change detection, built-in control flow (`@if`, `@for`), and `inject()` instead of constructor injection.
- **Folders by feature:** `src/app/<feature>/` (auth, recipes, journals, profile). Shared UI goes in `src/app/ui/` as `ct-` components, and app-wide services in `src/app/core/`.
- **API calls:** only from services, never from components. All routes are under `/api/v1`. Type requests and responses to match the API docs. IDs are GUID strings, and dates are ISO strings converted at the edge.
- **Auth:**
  - The access token stays in memory only. Never put it in `localStorage`, `sessionStorage` or a cookie.
  - The auth calls use `withCredentials: true`.
  - Components ask `AuthService` for the current user or token, and never touch `TokenStore` directly.
- **Security:** never use `bypassSecurityTrust*`, and never bind user text to `[innerHTML]`.
- **Browser globals:** wrap `window`, `document`, `localStorage` and `navigator` in a service. This keeps SSR and Capacitor easy to add later.
- **Styles:** plain CSS. Use tokens (`var(--butter)`, `var(--space-4)`), never hex values. Shared component classes use the `ct-` prefix. Nothing may depend on hover, and tap targets are at least `var(--tap-target)` (44px).
- **Accessibility:**
  - Text contrast at least 4.5:1.
  - Real `<button>`, `<a>` and `<label>` elements.
  - `aria-label` on icon-only buttons, and `aria-hidden` on decorative SVG.
  - The focus ring is 3px `tomato` with a 2px offset.
- **Voice:** follow the design system's rules: sentence case, friendly and short, lowercase tags, no emoji in the UI.

## Status

Update this section as work lands.

- **Current phase:** Phase 0 (MVP).
- **Done:**
  - The Angular 22 project is scaffolded in `web/` (CSS, Vitest, no SSR, zoneless). Design and stack decisions are in `docs/frontend.md`.
  - API docs are copied from crumbtrail.api's `feature/auth-refresh` branch at commit `b73fe90`.
  - The dev-server proxy, the styles (`tokens.css`, `base.css`, `components.css` from the design system's `bundle.css`), and the fonts.
  - Auth: `AuthService` with the web `TokenStore`, the refresh interceptor, and the route guards.
  - The app shell (mobile tab bar, desktop top bar). Recipes, New recipe and Journal are "coming soon" placeholders; login lands on `/profile` until the library exists (`HOME_URL` in `core/auth/auth.guards.ts`).
  - Screens: log in, register, profile, edit profile (including deactivate account, with an inline confirm).
- **Next:** the recipe library, recipe view, new recipe and new journal entry screens. When the recipe view exists, link the profile's "Recently made" cards to it and point `HOME_URL` at the library.
- **Waiting on the API:** native-client refresh tokens (crumbtrail.api issue #4). It only matters for the mobile port.
- **Deferred:** Capacitor and mobile, SSR for shared recipe links (Phase 1), Playwright end-to-end tests, and a decision on a hosted identity provider (start of Phase 1).
