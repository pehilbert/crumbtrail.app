import { Component, input } from '@angular/core';

/** A stand-in for screens that aren't built yet. The route supplies the title. */
@Component({
  selector: 'app-coming-soon',
  template: `
    <div class="screen">
      <p class="aside">coming soon</p>
      <h1 class="title">{{ title() }}</h1>
      <p class="body">This part of crumbtrail is still in the oven. Check back soon.</p>
    </div>
  `,
  styles: `
    .screen {
      max-width: 1280px;
      margin: 0 auto;
      padding: var(--space-10) var(--space-5) 120px;
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }
    .aside {
      font: italic 500 18px/1.4 var(--font-display);
      color: var(--cocoa-muted);
    }
    .title {
      font: 700 34px/1.05 var(--font-display);
      letter-spacing: -0.5px;
    }
    .body {
      color: var(--cocoa-muted);
    }
    @media (min-width: 768px) {
      .screen {
        padding: 48px var(--space-8) 80px;
      }
      .title {
        font-size: clamp(40px, 5vw, 64px);
      }
    }
  `,
})
export class ComingSoon {
  /** Bound from the route's data. */
  readonly title = input('Coming soon');
}
