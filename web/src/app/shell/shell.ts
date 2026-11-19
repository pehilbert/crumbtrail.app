import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ActivatedRouteSnapshot,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter, map, startWith } from 'rxjs';

/**
 * The signed-in layout: a top bar on desktop and a floating tab bar on mobile. Routes with
 * `data: { hideTabBar: true }` (full-screen forms) hide the tab bar.
 */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell {
  private readonly router = inject(Router);

  private readonly navigated = this.router.events.pipe(
    filter((event) => event instanceof NavigationEnd),
    startWith(null),
  );

  protected readonly hideTabBar = toSignal(
    this.navigated.pipe(
      map(() => deepestData(this.router.routerState.snapshot.root)['hideTabBar'] === true),
    ),
    { initialValue: false },
  );

  /**
   * "My recipes" stays current inside a recipe, as in the mockups, but not on New recipe, which
   * has its own button. `page` on the library itself, `true` within it.
   */
  protected readonly recipesCurrent = toSignal(
    this.navigated.pipe(map(() => recipesCurrent(this.router.url))),
    { initialValue: null },
  );
}

export function recipesCurrent(url: string): 'page' | 'true' | null {
  const path = url.split(/[?#]/)[0];
  if (path === '/recipes') return 'page';
  return path.startsWith('/recipes/') && path !== '/recipes/new' ? 'true' : null;
}

function deepestData(route: ActivatedRouteSnapshot): Record<string, unknown> {
  while (route.firstChild) route = route.firstChild;
  return route.data;
}
