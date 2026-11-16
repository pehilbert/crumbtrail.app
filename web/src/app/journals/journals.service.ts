import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE } from '../core/api';
import { JournalEntry, JournalEntryDto, toJournalEntry } from './journal';

/** Journal entries. Reading a recipe's entries comes with the recipe (`RecipesService.get`). */
@Injectable({ providedIn: 'root' })
export class JournalsService {
  private readonly http = inject(HttpClient);

  create(recipeId: string, content: string): Observable<JournalEntry> {
    return this.http
      .post<JournalEntryDto>(`${API_BASE}/recipes/${encodeURIComponent(recipeId)}/journals`, {
        content,
      })
      .pipe(map(toJournalEntry));
  }

  update(id: string, content: string): Observable<JournalEntry> {
    return this.http.patch<JournalEntryDto>(entryUrl(id), { content }).pipe(map(toJournalEntry));
  }

  /** Deletes an entry for good (the API hard-deletes it). */
  delete(id: string): Observable<void> {
    return this.http.delete(entryUrl(id)).pipe(map(() => undefined));
  }
}

function entryUrl(id: string): string {
  return `${API_BASE}/journals/${encodeURIComponent(id)}`;
}

/** The API's limit on an entry's length (docs/api/endpoints/journals.txt). */
export const MAX_ENTRY_LENGTH = 10000;
