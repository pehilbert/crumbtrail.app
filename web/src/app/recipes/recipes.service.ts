import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE } from '../core/api';
import { RecipeSummary, RecipeSummaryDto, toRecipeSummary } from './recipe';

@Injectable({ providedIn: 'root' })
export class RecipesService {
  private readonly http = inject(HttpClient);

  /** The signed-in user's recipes, newest first. */
  listMine(): Observable<RecipeSummary[]> {
    return this.http
      .get<RecipeSummaryDto[]>(`${API_BASE}/recipes/me`)
      .pipe(map((recipes) => recipes.map(toRecipeSummary)));
  }
}
