import { Injectable } from '@angular/core';
import { AuthResponse } from './auth.models';

/**
 * Hides how the refresh token is kept. Only `AuthService` uses it.
 *
 * The web build relies on the API's httpOnly cookie, so JavaScript never holds the refresh
 * token. A native store (Keychain/Keystore) comes with the Capacitor port; see
 * docs/frontend.md#mobile-later.
 */
export abstract class TokenStore {
  /** Whether the auth calls must send cookies. */
  abstract readonly withCredentials: boolean;

  /** Called with every login, registration and refresh response. */
  abstract save(response: AuthResponse): Promise<void>;

  /** The request body for refresh and logout, or `null` when the token travels as a cookie. */
  abstract refreshBody(): Promise<object | null>;

  /** Forgets the refresh token (after logout or a failed refresh). */
  abstract clear(): Promise<void>;
}

/** The web store: the browser keeps the refresh token in the `crumbtrail_refresh` cookie. */
@Injectable()
export class WebTokenStore extends TokenStore {
  readonly withCredentials = true;

  async save(): Promise<void> {
    // The API set the cookie; there is nothing for JavaScript to keep.
  }

  async refreshBody(): Promise<object | null> {
    return null;
  }

  async clear(): Promise<void> {
    // The API clears the cookie on logout and on a failed refresh.
  }
}
