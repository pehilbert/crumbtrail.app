import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  ElementRef,
  Injector,
  OnInit,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { errorMessage } from '../../core/api';
import { AuthService } from '../../core/auth/auth.service';
import { formatShortDate } from '../../recipes/format';
import { Recipe, tileColor } from '../../recipes/recipe';
import { RecipesService } from '../../recipes/recipes.service';
import { JournalEntry } from '../journal';
import { JournalsService, MAX_ENTRY_LENGTH } from '../journals.service';

type LoadState = 'loading' | 'ready' | 'missing' | 'forbidden' | 'error';

/** Writing a new journal entry for a recipe, or editing or deleting one. */
@Component({
  selector: 'app-journal-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './journal-form.html',
  styleUrl: './journal-form.css',
})
export class JournalForm implements OnInit {
  private readonly recipes = inject(RecipesService);
  private readonly journals = inject(JournalsService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly keepButton = viewChild<ElementRef<HTMLButtonElement>>('keepButton');
  private readonly deleteButton = viewChild<ElementRef<HTMLButtonElement>>('deleteButton');
  private readonly note = viewChild<ElementRef<HTMLTextAreaElement>>('note');

  /** The recipe, from the route's `:id`. */
  readonly id = input.required<string>();
  /** The entry being edited, from `:entryId`; absent when writing a new one. */
  readonly entryId = input<string>();

  protected readonly maxLength = MAX_ENTRY_LENGTH;
  protected readonly loadState = signal<LoadState>('loading');
  protected readonly recipe = signal<Recipe | null>(null);
  protected readonly entry = signal<JournalEntry | null>(null);
  protected readonly editing = computed(() => !!this.entryId());
  protected readonly swatch = computed(() => tileColor(this.id()));
  protected readonly when = computed(() => {
    const entry = this.entry();
    return entry ? formatShortDate(entry.postedAt) : 'today';
  });

  protected readonly content = inject(NonNullableFormBuilder).control('');
  protected readonly submitted = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly confirmingDelete = signal(false);
  protected readonly deleting = signal(false);
  protected readonly deleteError = signal<string | null>(null);

  ngOnInit(): void {
    void this.load();
  }

  protected contentError(): string | null {
    if (!this.submitted()) return null;
    return this.content.value.trim() ? null : 'Write a little something first.';
  }

  /** A plain form (no form group), so stop the browser's own submit and save here. */
  protected onSubmit(event: Event): void {
    event.preventDefault();
    void this.save();
  }

  private async save(): Promise<void> {
    if (this.saving() || this.deleting()) return;
    this.submitted.set(true);
    this.error.set(null);
    if (this.contentError()) {
      this.note()?.nativeElement.focus();
      return;
    }

    const content = this.content.value.trim();
    const entry = this.entry();
    this.saving.set(true);
    try {
      if (!entry) {
        await firstValueFrom(this.journals.create(this.id(), content));
      } else if (content !== entry.content) {
        await firstValueFrom(this.journals.update(entry.id, content));
      }
      await this.router.navigate(['/recipes', this.id()], { replaceUrl: true });
    } catch (err) {
      this.error.set(
        errorMessage(err, {
          403: 'You can only write in the journal of your own recipes.',
          404: entry
            ? 'This entry or its recipe was deleted.'
            : 'This recipe was deleted, so it can’t take notes.',
        }),
      );
    } finally {
      this.saving.set(false);
    }
  }

  private async load(): Promise<void> {
    try {
      const recipe = await firstValueFrom(this.recipes.get(this.id()));
      if (recipe.author.id !== this.auth.user()?.id) {
        this.loadState.set('forbidden');
        return;
      }
      const entryId = this.entryId();
      const entry = entryId ? recipe.journals.find((e) => e.id === entryId) : null;
      if (entryId && !entry) {
        this.loadState.set('missing');
        return;
      }
      this.recipe.set(recipe);
      this.entry.set(entry ?? null);
      this.content.setValue(entry?.content ?? '');
      this.loadState.set('ready');
      afterNextRender(() => this.note()?.nativeElement.focus(), { injector: this.injector });
    } catch (err) {
      const missing =
        err instanceof HttpErrorResponse && (err.status === 404 || err.status === 400);
      this.loadState.set(missing ? 'missing' : 'error');
    }
  }

  // Deleting

  protected askToDelete(): void {
    this.deleteError.set(null);
    this.confirmingDelete.set(true);
    afterNextRender(() => this.keepButton()?.nativeElement.focus(), { injector: this.injector });
  }

  protected keepEntry(): void {
    this.confirmingDelete.set(false);
    afterNextRender(() => this.deleteButton()?.nativeElement.focus(), {
      injector: this.injector,
    });
  }

  protected async deleteEntry(): Promise<void> {
    const entry = this.entry();
    if (!entry || this.deleting() || this.saving()) return;
    this.deleting.set(true);
    this.deleteError.set(null);
    try {
      await firstValueFrom(this.journals.delete(entry.id));
      await this.router.navigate(['/recipes', this.id()], { replaceUrl: true });
    } catch (err) {
      this.deleteError.set(errorMessage(err, { 404: 'This entry was already deleted.' }));
      this.deleting.set(false);
    }
  }
}
