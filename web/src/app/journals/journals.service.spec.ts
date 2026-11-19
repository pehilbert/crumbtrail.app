import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { JournalsService } from './journals.service';

const ENTRY = {
  id: 'j1',
  recipeId: 'r1',
  content: 'Chilled overnight.',
  postedAt: '2026-11-14T12:00:00.000Z',
  editedAt: null,
};

describe('JournalsService', () => {
  let journals: JournalsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    journals = TestBed.inject(JournalsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('posts a new entry to its recipe and converts the dates', async () => {
    const created = firstValueFrom(journals.create('r1', 'Chilled overnight.'));
    const req = http.expectOne('/api/v1/recipes/r1/journals');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ content: 'Chilled overnight.' });
    req.flush(ENTRY);
    expect((await created).postedAt).toEqual(new Date(ENTRY.postedAt));
  });

  it('patches and deletes an entry by its own id', async () => {
    const updated = firstValueFrom(journals.update('j1', 'Less sugar.'));
    const patch = http.expectOne('/api/v1/journals/j1');
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toEqual({ content: 'Less sugar.' });
    patch.flush({ ...ENTRY, content: 'Less sugar.' });
    expect((await updated).content).toBe('Less sugar.');

    const deleted = firstValueFrom(journals.delete('j1'));
    const del = http.expectOne('/api/v1/journals/j1');
    expect(del.request.method).toBe('DELETE');
    del.flush(null, { status: 204, statusText: 'No Content' });
    await deleted;
  });
});
