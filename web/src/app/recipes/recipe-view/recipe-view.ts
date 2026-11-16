import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { noteClass } from '../../journals/journal';
import { formatAmount, formatMinutes, formatShortDate, plural } from '../format';
import { Recipe, tileClass, tileColor } from '../recipe';
import { RecipesService } from '../recipes.service';

type State =
  | { status: 'loading' }
  | { status: 'ready'; recipe: Recipe }
  | { status: 'missing' }
  | { status: 'error' };

@Component({
  selector: 'app-recipe-view',
  imports: [RouterLink],
  templateUrl: './recipe-view.html',
  styleUrl: './recipe-view.css',
})
export class RecipeView {
  private readonly recipes = inject(RecipesService);
  private readonly auth = inject(AuthService);

  /** From the route's `:id`. */
  readonly id = input.required<string>();

  protected readonly state = toSignal(
    toObservable(this.id).pipe(
      switchMap((id) =>
        this.recipes.get(id).pipe(
          map((recipe): State => ({ status: 'ready', recipe })),
          catchError((err) =>
            of<State>({
              status:
                err instanceof HttpErrorResponse && (err.status === 404 || err.status === 400)
                  ? 'missing'
                  : 'error',
            }),
          ),
          startWith<State>({ status: 'loading' }),
        ),
      ),
    ),
    { initialValue: { status: 'loading' } as State },
  );

  protected readonly recipe = computed(() => {
    const state = this.state();
    return state.status === 'ready' ? state.recipe : null;
  });

  protected readonly isAuthor = computed(
    () => !!this.recipe() && this.recipe()!.author.id === this.auth.user()?.id,
  );

  protected readonly tileClass = tileClass;
  protected readonly tileColor = tileColor;
  protected readonly noteClass = noteClass;
  protected readonly formatAmount = formatAmount;
  protected readonly formatMinutes = formatMinutes;
  protected readonly formatDate = (date: Date) => formatShortDate(date);
  protected readonly plural = plural;
}
