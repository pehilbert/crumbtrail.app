import { Routes } from '@angular/router';
import { HOME_URL, signedInGuard, signedOutGuard } from './core/auth/auth.guards';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Log in · crumbtrail',
    canActivate: [signedOutGuard],
    loadComponent: () => import('./auth/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    title: 'Create account · crumbtrail',
    canActivate: [signedOutGuard],
    loadComponent: () => import('./auth/register/register').then((m) => m.Register),
  },
  {
    path: '',
    canActivate: [signedInGuard],
    canActivateChild: [signedInGuard],
    loadComponent: () => import('./shell/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: HOME_URL.slice(1) },
      {
        path: 'profile',
        title: 'Profile · crumbtrail',
        loadComponent: () => import('./profile/profile/profile').then((m) => m.Profile),
      },
      {
        path: 'profile/edit',
        title: 'Edit profile · crumbtrail',
        data: { hideTabBar: true },
        loadComponent: () =>
          import('./profile/edit-profile/edit-profile').then((m) => m.EditProfile),
      },
      // Not built yet.
      {
        path: 'recipes',
        title: 'My recipes · crumbtrail',
        data: { title: 'My recipes' },
        loadComponent: () => import('./shell/coming-soon').then((m) => m.ComingSoon),
      },
      {
        path: 'recipes/new',
        title: 'New recipe · crumbtrail',
        data: { title: 'New recipe' },
        loadComponent: () => import('./shell/coming-soon').then((m) => m.ComingSoon),
      },
      {
        path: 'journal',
        title: 'Journal · crumbtrail',
        data: { title: 'Journal' },
        loadComponent: () => import('./shell/coming-soon').then((m) => m.ComingSoon),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
