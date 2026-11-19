import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE } from '../core/api';
import {
  Recipe,
  RecipeDto,
  RecipeInput,
  RecipeSummary,
  RecipeSummaryDto,
  RecipeUpdate,
  toRecipe,
  toRecipeSummary,
} from './recipe';

@Injectable({ providedIn: 'root' })
export class RecipesService {
  private readonly http = inject(HttpClient);

  /** The signed-in user's recipes, newest first. */
  listMine(): Observable<RecipeSummary[]> {
    return this.http
      .get<RecipeSummaryDto[]>(`${API_BASE}/recipes/me`)
      .pipe(map((recipes) => recipes.map(toRecipeSummary)));
  }

  /** One recipe with its journal entries. 404 if it doesn't exist or was deleted. */
  get(id: string): Observable<Recipe> {
    return this.http.get<RecipeDto>(recipeUrl(id)).pipe(map(toRecipe));
  }

  create(recipe: RecipeInput): Observable<Recipe> {
    return this.http.post<RecipeDto>(`${API_BASE}/recipes`, recipe).pipe(map(toRecipe));
  }

  update(id: string, changes: RecipeUpdate): Observable<Recipe> {
    return this.http.patch<RecipeDto>(recipeUrl(id), changes).pipe(map(toRecipe));
  }

  /** Deletes a recipe. The API archives it, and it then acts as if it doesn't exist. */
  archive(id: string): Observable<void> {
    return this.http.delete(recipeUrl(id)).pipe(map(() => undefined));
  }
}

function recipeUrl(id: string): string {
  return `${API_BASE}/recipes/${encodeURIComponent(id)}`;
}
