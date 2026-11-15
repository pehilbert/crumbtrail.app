# Docs

Reference material for building the Crumbtrail frontend.

**Start with [frontend.md](frontend.md)**, which covers the stack, the auth design, rendering, mobile plans and styles, with the reasons behind each.

## API (`api/`)

A copy of the design docs from [crumbtrail.api](https://github.com/pehilbert/crumbtrail.api). The API repo is the source of truth; these copies are here so they can be read offline and next to the code.

- **Copied from:** branch `feature/auth-refresh`, commit `b73fe90` (2026-11-15).
- **Don't edit these files here.** Change the docs in the API repo, then copy them over again.

| File | What it covers |
|---|---|
| [api/high_level_design.md](api/high_level_design.md) | Feature phases. Phase 0 (MVP) is the current one. |
| [api/endpoints/](api/endpoints/) | The endpoint contracts in prose, including behavior the spec can't express. |
| [api/model/](api/model/) | The data models. |
| [api/openapi.json](api/openapi.json) | The OpenAPI 3 spec, generated from the API's code. |

**The prose is the contract.** At this commit, `openapi.json` includes refresh, logout and the refresh cookie, but the prose in [api/endpoints/](api/endpoints/) still wins where they differ.

### API conventions the frontend relies on

- All routes are under `/api/v1`. IDs are GUID strings and timestamps are ISO 8601 strings.
- Errors use Nest's shape: `{ statusCode, message: string | string[], error }`.
- **Access token:** a 15-minute JWT returned in the response body by login, registration and refresh. Send it as `Authorization: Bearer <token>` and keep it in memory only.
- **Refresh token:** the `crumbtrail_refresh` cookie, which is `HttpOnly`, `SameSite=Strict` and `Path=/api/v1/auth`. Calls to the auth endpoints must use `withCredentials: true`.
- **On a 401:** call `POST /auth/refresh` once, then retry the original request. If the refresh also returns 401, the session is over and the user goes to the login screen. Concurrent refreshes within 10 seconds are allowed, but the app should still make only one refresh call at a time.
- The app's origin must be listed in the API's `CORS_ORIGINS`. Besides CORS, the API rejects state-changing requests (403) from browser origins not on that list. The default, `http://localhost:4200`, covers the dev server.

## Design

These live as artifacts on claude.ai, not in this repo:

- [Crumbtrail Design System](https://claude.ai/artifact/9yyZYzKubNX9ECiBMi2XQ4): the "Butter & Crumb" tokens, type, components and voice.
- [Crumbtrail — Aesthetic Proof of Concepts](https://claude.ai/artifact/KYmJ9fXsZsbyqEZCo9PCxh): mockups for every Phase 0 screen on mobile and desktop.
