import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { plural } from '../../recipes/format';
import { tileClass } from '../../recipes/recipe';
import { RecipesService } from '../../recipes/recipes.service';

/**
 * The Journal tab: pick the recipe you made to write about it. The API has no list of all of a
 * user's entries yet, so this starts from the recipes.
 */
@Component({
  selector: 'app-journal-picker',
  imports: [RouterLink],
  templateUrl: './journal-picker.html',
  styleUrl: './journal-picker.css',
})
export class JournalPicker {
  /** `undefined` while loading, `null` if the recipes couldn't be loaded. */
  protected readonly recipes = toSignal(
    inject(RecipesService)
      .listMine()
      .pipe(catchError(() => of(null))),
  );

  protected readonly tileClass = tileClass;
  protected readonly plural = plural;
}
