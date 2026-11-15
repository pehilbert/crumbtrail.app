import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE } from '../api';
import { PrivateProfile, PrivateProfileDto, ProfileUpdate, toPrivateProfile } from './user';

/**
 * Changes to the signed-in user's account. Registration and loading the current user belong
 * to `AuthService`.
 */
@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);

  update(id: string, changes: ProfileUpdate): Observable<PrivateProfile> {
    return this.http
      .patch<PrivateProfileDto>(`${API_BASE}/users/${encodeURIComponent(id)}`, changes)
      .pipe(map(toPrivateProfile));
  }

  /** Soft-deletes the account. The API ends every session and clears the refresh cookie. */
  deactivate(id: string): Observable<void> {
    return this.http
      .delete(`${API_BASE}/users/${encodeURIComponent(id)}`, { withCredentials: true })
      .pipe(map(() => undefined));
  }
}
