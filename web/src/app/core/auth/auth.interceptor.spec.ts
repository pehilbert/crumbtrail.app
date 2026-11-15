import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';
import { TokenStore, WebTokenStore } from './token-store';

const ME = {
  id: 'u1',
  username: 'samcooks',
  firstName: 'Sam',
  lastName: 'Rivera',
  pronouns: null,
  joinDate: '2026-11-14T12:00:00.000Z',
  email: 'sam@example.com',
};
const UNAUTHORIZED = { status: 401, statusText: 'Unauthorized' };

const flushMicrotasks = () => new Promise((resolve) => setTimeout(resolve));

describe('authInterceptor', () => {
  let client: HttpClient;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: TokenStore, useClass: WebTokenStore },
      ],
    });
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);

    // Sign in with token-1.
    const started = TestBed.inject(AuthService).start();
    await flushMicrotasks();
    http.expectOne('/api/v1/auth/refresh').flush({ id: 'u1', accessToken: 'token-1' });
    await flushMicrotasks();
    http.expectOne('/api/v1/users/me').flush(ME);
    await started;
  });

  afterEach(() => http.verify());

  it('sends the access token to the API', async () => {
    const response = firstValueFrom(client.get('/api/v1/recipes/me'));
    const req = http.expectOne('/api/v1/recipes/me');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-1');
    req.flush([]);
    expect(await response).toEqual([]);
  });

  it('does not send the token to other hosts', () => {
    client.get('https://example.com/data').subscribe();
    const req = http.expectOne('https://example.com/data');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('refreshes once for concurrent 401s, then retries each request', async () => {
    const a = firstValueFrom(client.get('/api/v1/recipes/me'));
    const b = firstValueFrom(client.get('/api/v1/users/me'));
    http.expectOne('/api/v1/recipes/me').flush(null, UNAUTHORIZED);
    http.expectOne('/api/v1/users/me').flush(null, UNAUTHORIZED);
    await flushMicrotasks();

    // One refresh. The user is already loaded, so no profile fetch follows.
    http.expectOne('/api/v1/auth/refresh').flush({ id: 'u1', accessToken: 'token-2' });
    await flushMicrotasks();

    const retryA = http.expectOne('/api/v1/recipes/me');
    const retryB = http.expectOne('/api/v1/users/me');
    expect(retryA.request.headers.get('Authorization')).toBe('Bearer token-2');
    expect(retryB.request.headers.get('Authorization')).toBe('Bearer token-2');
    retryA.flush([]);
    retryB.flush(ME);
    expect(await a).toEqual([]);
    expect(await b).toEqual(ME);
  });

  it('goes to the login screen when the session is over', async () => {
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const response = firstValueFrom(client.get('/api/v1/recipes/me'));
    http.expectOne('/api/v1/recipes/me').flush(null, UNAUTHORIZED);
    await flushMicrotasks();
    http.expectOne('/api/v1/auth/refresh').flush(null, UNAUTHORIZED);

    await expect(response).rejects.toMatchObject({ status: 401 });
    expect(navigate).toHaveBeenCalledWith(['/login']);
    expect(TestBed.inject(AuthService).status()).toBe('signed-out');
  });

  it('retries only once', async () => {
    const response = firstValueFrom(client.get('/api/v1/recipes/me'));
    http.expectOne('/api/v1/recipes/me').flush(null, UNAUTHORIZED);
    await flushMicrotasks();
    http.expectOne('/api/v1/auth/refresh').flush({ id: 'u1', accessToken: 'token-2' });
    await flushMicrotasks();
    http.expectOne('/api/v1/recipes/me').flush(null, UNAUTHORIZED);

    await expect(response).rejects.toMatchObject({ status: 401 });
  });
});
