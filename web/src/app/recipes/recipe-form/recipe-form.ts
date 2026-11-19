import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
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
  WritableSignal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { errorMessage } from '../../core/api';
import { AuthService } from '../../core/auth/auth.service';
import { formatAmount, parseQuantity, plural } from '../format';
import { Ingredient, Recipe, RecipeInput, RecipeUpdate } from '../recipe';
import { RecipesService } from '../recipes.service';
import {
  LIMITS,
  OTHER_UNIT,
  UNIT_OPTIONS,
  chosenUnit,
  splitTags,
  timeError,
  toMinutes,
} from './recipe-form.rules';

/** A list item with a key that stays the same while it's moved, so focus and DOM follow it. */
interface Keyed<T> {
  key: number;
  value: T;
}

type LoadState = 'new' | 'loading' | 'ready' | 'missing' | 'forbidden' | 'error';

@Component({
  selector: 'app-recipe-form',
  imports: [ReactiveFormsModule, RouterLink, CdkDropList, CdkDrag, CdkDragHandle],
  templateUrl: './recipe-form.html',
  styleUrl: './recipe-form.css',
})
export class RecipeForm implements OnInit {
  private readonly recipes = inject(RecipesService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly keepButton = viewChild<ElementRef<HTMLButtonElement>>('keepButton');
  private readonly deleteButton = viewChild<ElementRef<HTMLButtonElement>>('deleteButton');

  /** From the route's `:id` on the edit route; absent on the new-recipe route. */
  readonly id = input<string>();

  protected readonly limits = LIMITS;
  protected readonly unitOptions = UNIT_OPTIONS;
  protected readonly otherUnit = OTHER_UNIT;
  protected readonly formatAmount = formatAmount;
  protected readonly plural = plural;

  protected readonly loadState = signal<LoadState>('new');
  private original: Recipe | null = null;
  protected readonly editing = computed(() => this.loadState() !== 'new');
  protected readonly closeLink = computed(() => {
    const id = this.id();
    return id ? ['/recipes', id] : ['/recipes'];
  });

  protected readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(LIMITS.title)]],
    description: ['', Validators.maxLength(LIMITS.description)],
    hours: [''],
    minutes: [''],
  });

  /** "05" reads as an example only while hours are empty; with hours set, minutes may be 0. */
  private readonly hours = toSignal(this.form.controls.hours.valueChanges, { initialValue: '' });
  protected readonly minutesPlaceholder = computed(() => (this.hours().trim() ? '0' : '05'));

  protected readonly tags = signal<string[]>([]);
  protected readonly tagDraft = signal('');
  protected readonly tagError = signal<string | null>(null);

  protected readonly ingredients = signal<Keyed<Ingredient>[]>([]);
  protected readonly ingredientDraft = this.fb.group({
    quantity: [''],
    /** A unit from the dropdown, `OTHER_UNIT` for a typed one, or empty for none. */
    unitChoice: [''],
    unit: [''],
    ingredient: [''],
    adjective: [''],
  });
  protected readonly ingredientError = signal<string | null>(null);
  private readonly unitChoice = toSignal(this.ingredientDraft.controls.unitChoice.valueChanges, {
    initialValue: '',
  });
  protected readonly typingUnit = computed(() => this.unitChoice() === OTHER_UNIT);

  protected readonly steps = signal<Keyed<string>[]>([]);
  protected readonly stepDraft = this.fb.control('');

  private nextKey = 0;

  /** Read out after a keyboard move, so screen reader users hear where the item went. */
  protected readonly announcement = signal('');

  protected readonly submitted = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly confirmingDelete = signal(false);
  protected readonly deleting = signal(false);
  protected readonly deleteError = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.id();
    if (id) void this.load(id);
  }

  // Field errors, shown once the field is touched or the form was submitted.

  protected titleError(): string | null {
    const control = this.form.controls.title;
    if (!(control.touched || this.submitted())) return null;
    return control.value.trim() && control.valid
      ? null
      : `Give your recipe a name (up to ${LIMITS.title} characters).`;
  }

  protected timeError(): string | null {
    const { hours, minutes } = this.form.controls;
    if (!(hours.touched || minutes.touched || this.submitted())) return null;
    return timeError(hours.value, minutes.value);
  }

  protected ingredientsError(): string | null {
    return this.submitted() && this.ingredients().length === 0
      ? 'Add at least one ingredient.'
      : null;
  }

  protected stepsError(): string | null {
    return this.submitted() && this.steps().every((step) => !step.value.trim())
      ? 'Add at least one step.'
      : null;
  }

  // Tags

  protected onTagInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // A comma ends a tag, including in pasted text.
    if (input.value.includes(',')) {
      this.addTags(input.value);
    } else {
      this.tagDraft.set(input.value);
    }
  }

  protected onTagKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.finishTag();
    } else if (event.key === 'Backspace' && !this.tagDraft() && this.tags().length) {
      this.tags.update((tags) => tags.slice(0, -1));
    }
  }

  /** Turns whatever is in the tag field into a tag (on Enter, leaving the field, or saving). */
  protected finishTag(): void {
    if (this.tagDraft().trim()) this.addTags(`${this.tagDraft()},`);
  }

  private addTags(text: string): void {
    const { tags, rest, error } = splitTags(text, this.tags());
    this.tags.set(tags);
    this.tagDraft.set(rest);
    this.tagError.set(error);
    // Update the field now, not on the next render, so fast typing can't land on the old text.
    const input = this.host.querySelector<HTMLInputElement>('#rf-tag');
    if (input) input.value = rest;
  }

  protected removeTag(tag: string): void {
    this.tags.update((tags) => tags.filter((t) => t !== tag));
    this.tagError.set(null);
    this.host.querySelector<HTMLInputElement>('#rf-tag')?.focus();
  }

  // Ingredients

  /** Adds the drafted ingredient. Returns false (with an error shown) if it isn't valid. */
  protected addIngredient(): boolean {
    const draft = this.ingredientDraft.getRawValue();
    const name = draft.ingredient.trim();
    const quantity = parseQuantity(draft.quantity);
    let error: string | null = null;
    if (!name) error = 'Name the ingredient first.';
    else if (Number.isNaN(quantity)) error = 'Write the amount as a number, like 2, 1.5 or 1½.';
    else if (this.ingredients().length >= LIMITS.ingredients)
      error = `A recipe can have up to ${LIMITS.ingredients} ingredients.`;
    this.ingredientError.set(error);
    if (error) return false;

    this.ingredients.update((list) => [
      ...list,
      {
        key: this.nextKey++,
        value: {
          quantity,
          unit: chosenUnit(draft.unitChoice, draft.unit),
          ingredient: name,
          adjective: draft.adjective.trim() || null,
        },
      },
    ]);
    this.ingredientDraft.reset();
    this.host.querySelector<HTMLInputElement>('#rf-qty')?.focus();
    return true;
  }

  protected onUnitChange(): void {
    if (!this.typingUnit()) return;
    afterNextRender(() => this.host.querySelector<HTMLInputElement>('#rf-unit-other')?.focus(), {
      injector: this.injector,
    });
  }

  protected onIngredientEnter(event: Event): void {
    event.preventDefault();
    this.addIngredient();
  }

  protected removeIngredient(key: number): void {
    this.ingredients.update((list) => list.filter((item) => item.key !== key));
  }

  protected hasIngredientDraft(): boolean {
    return Object.values(this.ingredientDraft.getRawValue()).some((value) => value.trim());
  }

  // Steps

  protected addStep(): void {
    const text = this.stepDraft.value.trim();
    if (!text || this.steps().length >= LIMITS.steps) return;
    this.steps.update((list) => [...list, { key: this.nextKey++, value: text }]);
    this.stepDraft.reset();
    this.host.querySelector<HTMLTextAreaElement>('#rf-step')?.focus();
  }

  protected editStep(key: number, event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.steps.update((list) => list.map((step) => (step.key === key ? { key, value } : step)));
  }

  protected removeStep(key: number): void {
    this.steps.update((list) => list.filter((item) => item.key !== key));
  }

  // Reordering, by dragging the handle or with the arrow keys on it.

  protected dropIngredient(event: CdkDragDrop<unknown>): void {
    this.ingredients.update((list) => moved(list, event.previousIndex, event.currentIndex));
  }

  protected dropStep(event: CdkDragDrop<unknown>): void {
    this.steps.update((list) => moved(list, event.previousIndex, event.currentIndex));
  }

  protected moveIngredient(event: Event, index: number, by: number): void {
    this.moveWithKeys(
      event,
      this.ingredients,
      index,
      by,
      'rf-ing-handle',
      (item) => item.value.ingredient,
    );
  }

  protected moveStep(event: Event, index: number, by: number): void {
    this.moveWithKeys(event, this.steps, index, by, 'rf-step-handle', (_, at) => `Step ${at}`);
  }

  private moveWithKeys<T>(
    event: Event,
    list: WritableSignal<Keyed<T>[]>,
    index: number,
    by: number,
    handlePrefix: string,
    name: (item: Keyed<T>, oldPosition: number) => string,
  ): void {
    event.preventDefault();
    const items = list();
    const to = index + by;
    if (to < 0 || to >= items.length) return;
    const item = items[index];
    list.set(moved(items, index, to));
    this.announcement.set(
      `Moved ${name(item, index + 1)} to position ${to + 1} of ${items.length}.`,
    );
    // Moving the row re-inserts it, which drops focus; put it back on the handle.
    afterNextRender(
      () => this.host.querySelector<HTMLElement>(`#${handlePrefix}-${item.key}`)?.focus(),
      { injector: this.injector },
    );
  }

  // Saving

  protected async save(): Promise<void> {
    if (this.saving() || this.deleting()) return;
    this.submitted.set(true);
    this.form.markAllAsTouched();
    this.error.set(null);

    // Keep what was typed into the add boxes but not added yet.
    if (this.hasIngredientDraft() && !this.addIngredient()) {
      this.error.set('Finish or clear the ingredient you started.');
      return;
    }
    if (this.stepDraft.value.trim()) this.addStep();
    this.finishTag();

    if (this.titleError() || this.timeError() || this.ingredientsError() || this.stepsError()) {
      this.error.set('A few things need fixing first.');
      return;
    }

    const recipe = this.value();
    this.saving.set(true);
    try {
      const saved = this.original
        ? await this.saveChanges(this.original, recipe)
        : await firstValueFrom(this.recipes.create(recipe));
      await this.router.navigate(['/recipes', saved.id], { replaceUrl: true });
    } catch (err) {
      this.error.set(
        errorMessage(err, {
          403: 'You can only edit your own recipes.',
          404: 'This recipe was deleted, so it can’t be saved.',
        }),
      );
    } finally {
      this.saving.set(false);
    }
  }

  /** PATCH only what changed; with no changes, there's nothing to send. */
  private async saveChanges(original: Recipe, recipe: RecipeInput): Promise<{ id: string }> {
    const changes: RecipeUpdate = {};
    for (const field of Object.keys(recipe) as (keyof RecipeInput)[]) {
      if (JSON.stringify(recipe[field]) !== JSON.stringify(original[field])) {
        Object.assign(changes, { [field]: recipe[field] });
      }
    }
    if (Object.keys(changes).length === 0) return original;
    return firstValueFrom(this.recipes.update(original.id, changes));
  }

  private value(): RecipeInput {
    const form = this.form.getRawValue();
    return {
      title: form.title.trim(),
      description: form.description.trim() || null,
      tags: this.tags(),
      timeEstimateMinutes: toMinutes(form.hours, form.minutes),
      ingredients: this.ingredients().map((item) => item.value),
      steps: this.steps()
        .map((step) => step.value.trim())
        .filter(Boolean),
    };
  }

  // Loading a recipe to edit

  private async load(id: string): Promise<void> {
    this.loadState.set('loading');
    try {
      const recipe = await firstValueFrom(this.recipes.get(id));
      if (recipe.author.id !== this.auth.user()?.id) {
        this.loadState.set('forbidden');
        return;
      }
      this.original = recipe;
      this.fill(recipe);
      this.loadState.set('ready');
    } catch (err) {
      const missing =
        err instanceof HttpErrorResponse && (err.status === 404 || err.status === 400);
      this.loadState.set(missing ? 'missing' : 'error');
    }
  }

  private fill(recipe: Recipe): void {
    const minutes = recipe.timeEstimateMinutes;
    this.form.setValue({
      title: recipe.title,
      description: recipe.description ?? '',
      hours: minutes ? String(Math.floor(minutes / 60) || '') : '',
      minutes: minutes ? String(minutes % 60 || '') : '',
    });
    this.tags.set([...recipe.tags]);
    this.ingredients.set(recipe.ingredients.map((value) => ({ key: this.nextKey++, value })));
    this.steps.set(recipe.steps.map((value) => ({ key: this.nextKey++, value })));
  }

  // Deleting

  protected askToDelete(): void {
    this.deleteError.set(null);
    this.confirmingDelete.set(true);
    afterNextRender(() => this.keepButton()?.nativeElement.focus(), { injector: this.injector });
  }

  protected keepRecipe(): void {
    this.confirmingDelete.set(false);
    afterNextRender(() => this.deleteButton()?.nativeElement.focus(), {
      injector: this.injector,
    });
  }

  protected async deleteRecipe(): Promise<void> {
    const original = this.original;
    if (!original || this.deleting() || this.saving()) return;
    this.deleting.set(true);
    this.deleteError.set(null);
    try {
      await firstValueFrom(this.recipes.archive(original.id));
      await this.router.navigate(['/recipes'], { replaceUrl: true });
    } catch (err) {
      this.deleteError.set(errorMessage(err, { 404: 'This recipe was already deleted.' }));
      this.deleting.set(false);
    }
  }
}

function moved<T>(list: T[], from: number, to: number): T[] {
  const copy = [...list];
  moveItemInArray(copy, from, to);
  return copy;
}
