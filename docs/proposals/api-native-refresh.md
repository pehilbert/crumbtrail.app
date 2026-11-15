Title: Support refresh tokens for native mobile clients

## Problem

The refresh token design on `feature/auth-refresh` sends the refresh token only in the `crumbtrail_refresh` cookie. That works for the web app, but not for the planned Capacitor mobile app:

- The app's page runs on `capacitor://localhost` (iOS) or `https://localhost` (Android). That isn't the same site as the API, so the browser won't send a `SameSite=Strict` cookie.
- Cookie behavior inside iOS WebViews is unreliable, and the OS cookie store isn't encrypted the way the Keychain or Android Keystore is.

Native clients need a way to get and present refresh tokens without cookies. This doesn't block the web app, but it's needed before the mobile port.

## Proposal

Keep the rotation, reuse detection, 10-second grace window and session model as they are. Native clients only receive and send the token differently.

1. **The client chooses delivery at login.** When `POST /auth/login` or `POST /users` (register) is sent with the header `X-Crumbtrail-Client: native`, the response body includes `refreshToken` and no cookie is set. Without the header, the behavior is unchanged.
2. **Store the delivery on the session.** Add `Delivery: "cookie" | "body"` to `RefreshToken` records, set at login and copied to each rotated token.
3. **Refresh and logout accept a body token for body sessions only.**
   - `POST /auth/refresh` and `POST /auth/logout` accept `{ "refreshToken": "..." }` in the body.
   - A token sent in the body must belong to a `body` session, and a cookie token must belong to a `cookie` session. A mismatch returns 401 and doesn't end the session.
   - For `body` sessions, the rotated token comes back in the response body.
4. **CORS:** add `capacitor://localhost` and `https://localhost` to `CORS_ORIGINS` in the deployed environments, since the native app's WebView sends those as its `Origin`. Allowing the custom header may also need CORS config.

### Why delivery is fixed per session

This rule is what keeps the web app's httpOnly cookie meaningful. If a cookie session could ask for its token in the body (for example, `/auth/refresh` with the native header), an XSS bug on the web app could swap the cookie for a readable long-lived refresh token and send it elsewhere. Fixing delivery at login means the only way to get a body token is to log in with the password.

## On the client (for context)

The app will keep the refresh token in the Keychain or Keystore through a secure storage plugin, and keep the access token in memory only. It will refresh when the app returns to the foreground, and on logout it will call `/auth/logout` with the token, then delete it from the device. The web build is unaffected.

## Done when

- [ ] `docs/model/refresh_token.txt`, `docs/endpoints/auth.txt` and `docs/endpoints/users.txt` describe the native flow and the per-session delivery rule.
- [ ] Login and register return `refreshToken` in the body with the native header and set no cookie.
- [ ] Refresh and logout work with a body token, and refresh rotates it in the body.
- [ ] e2e tests cover: the native login, refresh and logout flow; reuse of a spent body token ending the session; a body token sent as a cookie, and a cookie token sent in the body, both returning 401; and web cookie behavior unchanged.
- [ ] `docs/openapi.json` is regenerated with `npm run openapi` and includes the header and body fields.
- [ ] The Postman collection has a native-client variant of the auth requests.

## Open questions

- Is the header name `X-Crumbtrail-Client: native` right, or would a body field such as `"tokenDelivery": "body"` be better? Login and register use strict schemas, so a body field means adding it to both.
- Should native sessions have a different `REFRESH_TOKEN_EXPIRES_IN`? Mobile apps usually keep users signed in longer.
