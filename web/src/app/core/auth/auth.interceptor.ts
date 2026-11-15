import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { API_BASE } from '../api';
import { AUTH_CALL, AuthService } from './auth.service';

/**
 * Adds the access token to API calls. On a 401, refreshes once (shared with any other
 * request that hit a 401 at the same time) and retries the call once. If the session is
 * over, goes to the login screen.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(AUTH_CALL) || !req.url.startsWith(API_BASE)) return next(req);

  const auth = inject(AuthService);
  const router = inject(Router);
  const sentToken = auth.accessToken();

  return next(withToken(req, sentToken)).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse) || err.status !== 401 || !sentToken) {
        return throwError(() => err);
      }
      return from(auth.tokenAfterUnauthorized(sentToken)).pipe(
        switchMap((token) => {
          if (!token) {
            void router.navigate(['/login']);
            return throwError(() => err);
          }
          return next(withToken(req, token));
        }),
      );
    }),
  );
};

function withToken(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  return token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
}
