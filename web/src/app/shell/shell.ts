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

  protected readonly hideTabBar = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null),
      map(() => deepestData(this.router.routerState.snapshot.root)['hideTabBar'] === true),
    ),
    { initialValue: false },
  );
}

function deepestData(route: ActivatedRouteSnapshot): Record<string, unknown> {
  while (route.firstChild) route = route.firstChild;
  return route.data;
}
