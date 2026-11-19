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
      {
        path: 'recipes',
        title: 'My recipes · crumbtrail',
        loadComponent: () => import('./recipes/library/library').then((m) => m.Library),
      },
      {
        path: 'recipes/new',
        title: 'New recipe · crumbtrail',
        data: { hideTabBar: true },
        loadComponent: () => import('./recipes/recipe-form/recipe-form').then((m) => m.RecipeForm),
      },
      {
        path: 'recipes/:id',
        title: 'Recipe · crumbtrail',
        loadComponent: () => import('./recipes/recipe-view/recipe-view').then((m) => m.RecipeView),
      },
      {
        path: 'recipes/:id/edit',
        title: 'Edit recipe · crumbtrail',
        data: { hideTabBar: true },
        loadComponent: () => import('./recipes/recipe-form/recipe-form').then((m) => m.RecipeForm),
      },
      {
        path: 'recipes/:id/journal/new',
        title: 'New journal entry · crumbtrail',
        data: { hideTabBar: true },
        loadComponent: () =>
          import('./journals/journal-form/journal-form').then((m) => m.JournalForm),
      },
      {
        path: 'recipes/:id/journal/:entryId/edit',
        title: 'Edit journal entry · crumbtrail',
        data: { hideTabBar: true },
        loadComponent: () =>
          import('./journals/journal-form/journal-form').then((m) => m.JournalForm),
      },
      {
        path: 'journal',
        title: 'Journal · crumbtrail',
        loadComponent: () =>
          import('./journals/journal-picker/journal-picker').then((m) => m.JournalPicker),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
