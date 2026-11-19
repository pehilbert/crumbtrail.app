import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { formatMinutes, plural } from '../format';
import { RecipeSummary, tileClass } from '../recipe';
import { RecipesService } from '../recipes.service';

/** How many of the most-used tags get a filter chip. */
const TAG_FILTERS = 6;

@Component({
  selector: 'app-library',
  imports: [RouterLink],
  templateUrl: './library.html',
  styleUrl: './library.css',
})
export class Library {
  private readonly auth = inject(AuthService);

  /** `undefined` while loading, `null` if the recipes couldn't be loaded. */
  protected readonly recipes = toSignal(
    inject(RecipesService)
      .listMine()
      .pipe(catchError(() => of(null))),
  );

  protected readonly greeting = greeting(new Date().getHours());
  protected readonly firstName = computed(() => this.auth.user()?.firstName ?? '');

  protected readonly query = signal('');
  protected readonly tag = signal<string | null>(null);

  /** The most-used tags, most used first. */
  protected readonly tags = computed(() => {
    const counts = new Map<string, number>();
    for (const recipe of this.recipes() ?? []) {
      for (const tag of recipe.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    return [...counts]
      .sort(([a, countA], [b, countB]) => countB - countA || a.localeCompare(b))
      .slice(0, TAG_FILTERS)
      .map(([tag]) => tag);
  });

  protected readonly shown = computed(() => {
    const tag = this.tag();
    const words = this.query().toLowerCase().split(/\s+/).filter(Boolean);
    return (this.recipes() ?? []).filter(
      (recipe) =>
        (!tag || recipe.tags.includes(tag)) &&
        words.every((word) => searchText(recipe).includes(word)),
    );
  });

  protected readonly tileClass = tileClass;
  protected readonly formatMinutes = formatMinutes;
  protected readonly plural = plural;

  protected search(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }
}

function greeting(hour: number): string {
  if (hour >= 5 && hour < 12) return 'good morning';
  if (hour >= 12 && hour < 17) return 'good afternoon';
  return 'good evening';
}

/** What search matches against: the title, description, tags and ingredient names. */
const searchCache = new WeakMap<RecipeSummary, string>();
function searchText(recipe: RecipeSummary): string {
  let text = searchCache.get(recipe);
  if (text === undefined) {
    text = [
      recipe.title,
      recipe.description ?? '',
      ...recipe.tags,
      ...recipe.ingredients.map((i) => i.ingredient),
    ]
      .join(' ')
      .toLowerCase();
    searchCache.set(recipe, text);
  }
  return text;
}
