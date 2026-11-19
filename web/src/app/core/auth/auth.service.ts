import { HttpClient, HttpContext, HttpContextToken, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE } from '../api';
import { PrivateProfile, PrivateProfileDto, toPrivateProfile } from '../users/user';
import { AuthResponse, LoginRequest, RegisterRequest } from './auth.models';
import { TokenStore } from './token-store';

/** Marks the auth calls, so the interceptor neither adds a token nor tries to refresh them. */
export const AUTH_CALL = new HttpContextToken<boolean>(() => false);

export type AuthStatus = 'checking' | 'signed-in' | 'signed-out';

/**
 * Owns the session: the in-memory access token, the signed-in user, and the login, register,
 * refresh and logout calls. Components ask this service for the user; nothing else touches
 * `TokenStore`.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(TokenStore);

  /** Memory only: never written to storage or cookies. */
  private readonly token = signal<string | null>(null);
  private readonly currentUser = signal<PrivateProfile | null>(null);
  private readonly currentStatus = signal<AuthStatus>('checking');
  private refreshing: Promise<string | null> | null = null;
  private resolveReady!: () => void;

  readonly accessToken = this.token.asReadonly();
  readonly user = this.currentUser.asReadonly();
  readonly status = this.currentStatus.asReadonly();
  readonly isSignedIn = computed(() => this.currentStatus() === 'signed-in');

  /** Resolves once the startup session check has finished. Route guards wait for it. */
  readonly ready = new Promise<void>((resolve) => (this.resolveReady = resolve));

  /** Runs once at startup: a successful refresh means the user is still signed in. */
  async start(): Promise<void> {
    try {
      await this.refresh();
    } catch {
      // The API couldn't be reached or refused for another reason: treat it as signed out.
      if (this.currentStatus() === 'checking') this.endSession();
    } finally {
      this.resolveReady();
    }
  }

  async login(request: LoginRequest): Promise<void> {
    const response = await firstValueFrom(
      this.http.post<AuthResponse>(`${API_BASE}/auth/login`, request, this.authOptions()),
    );
    await this.startSession(response);
  }

  async register(request: RegisterRequest): Promise<void> {
    const response = await firstValueFrom(
      this.http.post<AuthResponse>(`${API_BASE}/users`, request, this.authOptions()),
    );
    await this.startSession(response);
  }

  /** Ends the session on the API (best effort), then forgets it here. */
  async logout(): Promise<void> {
    try {
      const body = await this.store.refreshBody();
      await firstValueFrom(this.http.post(`${API_BASE}/auth/logout`, body, this.authOptions()));
    } catch {
      // Logout is idempotent on the API; the local session ends either way.
    }
    await this.store.clear();
    this.endSession();
  }

  /**
   * Gets a new access token. Only one refresh runs at a time; concurrent callers share it.
   * Resolves to `null` when the session is over (the API returned 401).
   */
  refresh(): Promise<string | null> {
    this.refreshing ??= this.doRefresh().finally(() => (this.refreshing = null));
    return this.refreshing;
  }

  /**
   * The token to retry with after a request that was sent with `sentToken` got a 401. If
   * another refresh already replaced that token, the new one is used without refreshing again.
   */
  tokenAfterUnauthorized(sentToken: string | null): Promise<string | null> {
    const current = this.token();
    if (current && current !== sentToken) return Promise.resolve(current);
    return this.refresh();
  }

  /** Forgets the session locally, for when the API has already ended it (deactivation). */
  async forgetSession(): Promise<void> {
    await this.store.clear();
    this.endSession();
  }

  /** Replaces the cached user after a profile update. */
  setUser(user: PrivateProfile): void {
    this.currentUser.set(user);
  }

  private async doRefresh(): Promise<string | null> {
    try {
      const body = await this.store.refreshBody();
      const response = await firstValueFrom(
        this.http.post<AuthResponse>(`${API_BASE}/auth/refresh`, body, this.authOptions()),
      );
      await this.startSession(response);
      return response.accessToken;
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        await this.store.clear();
        this.endSession();
        return null;
      }
      throw err;
    }
  }

  private async startSession(response: AuthResponse): Promise<void> {
    await this.store.save(response);
    try {
      if (this.currentUser()?.id !== response.id) {
        this.currentUser.set(await this.fetchMe(response.accessToken));
      }
    } catch (err) {
      this.endSession();
      throw err;
    }
    this.token.set(response.accessToken);
    this.currentStatus.set('signed-in');
  }

  /**
   * Loads the profile with a token that was just issued. This skips the interceptor: a 401
   * here must not start another refresh, because this may be running inside one.
   */
  private async fetchMe(accessToken: string): Promise<PrivateProfile> {
    const dto = await firstValueFrom(
      this.http.get<PrivateProfileDto>(`${API_BASE}/users/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        context: new HttpContext().set(AUTH_CALL, true),
      }),
    );
    return toPrivateProfile(dto);
  }

  private endSession(): void {
    this.token.set(null);
    this.currentUser.set(null);
    this.currentStatus.set('signed-out');
  }

  private authOptions() {
    return {
      withCredentials: this.store.withCredentials,
      context: new HttpContext().set(AUTH_CALL, true),
    };
  }
}
