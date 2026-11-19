import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';
import { TokenStore, WebTokenStore } from './token-store';

const ME = {
  id: 'u1',
  username: 'samcooks',
  firstName: 'Sam',
  lastName: 'Rivera',
  pronouns: 'they/them',
  joinDate: '2026-11-14T12:00:00.000Z',
  email: 'sam@example.com',
};

/** Lets pending promise callbacks run, so the next request has been sent. */
const flushMicrotasks = () => new Promise((resolve) => setTimeout(resolve));

describe('AuthService', () => {
  let auth: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: TokenStore, useClass: WebTokenStore },
      ],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function answerRefresh(token = 'token-1') {
    await flushMicrotasks();
    const req = http.expectOne('/api/v1/auth/refresh');
    expect(req.request.withCredentials).toBe(true);
    req.flush({ id: 'u1', accessToken: token });
    await flushMicrotasks();
  }

  async function answerMe() {
    const req = http.expectOne('/api/v1/users/me');
    req.flush(ME);
    await flushMicrotasks();
    return req;
  }

  it('starts signed out when the refresh cookie is rejected', async () => {
    const started = auth.start();
    await flushMicrotasks();
    http
      .expectOne('/api/v1/auth/refresh')
      .flush(
        { statusCode: 401, message: 'Unauthorized' },
        { status: 401, statusText: 'Unauthorized' },
      );
    await started;

    expect(auth.status()).toBe('signed-out');
    expect(auth.accessToken()).toBeNull();
  });

  it('starts signed in, with the user loaded, when the refresh succeeds', async () => {
    const started = auth.start();
    await answerRefresh();
    const me = await answerMe();
    await started;

    expect(me.request.headers.get('Authorization')).toBe('Bearer token-1');
    expect(auth.isSignedIn()).toBe(true);
    expect(auth.user()?.username).toBe('samcooks');
    expect(auth.user()?.joinDate).toEqual(new Date(ME.joinDate));
  });

  it('starts signed out when the API cannot be reached', async () => {
    const started = auth.start();
    await flushMicrotasks();
    http.expectOne('/api/v1/auth/refresh').error(new ProgressEvent('error'));
    await started;

    expect(auth.status()).toBe('signed-out');
  });

  it('shares one refresh between concurrent callers', async () => {
    const first = auth.refresh();
    const second = auth.refresh();
    await answerRefresh('token-2');
    await answerMe();

    expect(await first).toBe('token-2');
    expect(await second).toBe('token-2');
  });

  it('logs in with credentials and loads the user', async () => {
    const loggedIn = auth.login({ login: 'samcooks', password: 'password123' });
    const req = http.expectOne('/api/v1/auth/login');
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({ id: 'u1', accessToken: 'token-1' });
    await flushMicrotasks();
    await answerMe();
    await loggedIn;

    expect(auth.accessToken()).toBe('token-1');
    expect(auth.user()?.email).toBe('sam@example.com');
  });

  it('clears the session on logout, even if the call fails', async () => {
    const started = auth.start();
    await answerRefresh();
    await answerMe();
    await started;

    const loggedOut = auth.logout();
    await flushMicrotasks();
    const req = http.expectOne('/api/v1/auth/logout');
    expect(req.request.withCredentials).toBe(true);
    req.error(new ProgressEvent('error'));
    await loggedOut;

    expect(auth.status()).toBe('signed-out');
    expect(auth.accessToken()).toBeNull();
    expect(auth.user()).toBeNull();
  });
});
