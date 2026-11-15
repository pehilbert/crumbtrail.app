import {
  Component,
  ElementRef,
  afterNextRender,
  computed,
  forwardRef,
  inject,
  Injector,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

type Word = 'he' | 'she' | 'they';

const SETS: { word: Word; full: string }[] = [
  { word: 'he', full: 'he/him' },
  { word: 'she', full: 'she/her' },
  { word: 'they', full: 'they/them' },
];

/** The API's limit on the pronouns string. */
export const PRONOUNS_MAX_LENGTH = 30;

/**
 * Toggle chips for he/him, she/her and they/them that can be combined, plus "Write my own".
 * The value is the single pronouns string the API stores, or `null` for none.
 *
 * - One chip saves the full set ("she/her").
 * - Two or more save the first word of each, in the order they were tapped ("she/they").
 * - "Write my own" turns the chips off and shows a text input.
 */
@Component({
  selector: 'ct-pronoun-picker',
  templateUrl: './pronoun-picker.html',
  styleUrl: './pronoun-picker.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PronounPicker),
      multi: true,
    },
  ],
})
export class PronounPicker implements ControlValueAccessor {
  /** Prefix for element ids, so two pickers can share a page. */
  readonly idPrefix = input('pronouns');

  private readonly injector = inject(Injector);
  private readonly ownInput = viewChild<ElementRef<HTMLInputElement>>('ownInput');

  protected readonly sets = SETS;
  protected readonly maxLength = PRONOUNS_MAX_LENGTH;
  protected readonly picked = signal<Word[]>([]);
  protected readonly writingOwn = signal(false);
  protected readonly ownText = signal('');
  protected readonly disabled = signal(false);

  readonly value = computed<string | null>(() => {
    if (this.writingOwn()) return this.ownText().trim() || null;
    const picked = this.picked();
    if (picked.length === 0) return null;
    if (picked.length === 1) return SETS.find((s) => s.word === picked[0])!.full;
    return picked.join('/');
  });

  private onChange: (value: string | null) => void = () => {};
  protected onTouched: () => void = () => {};

  protected isPicked(word: Word): boolean {
    return !this.writingOwn() && this.picked().includes(word);
  }

  protected toggle(word: Word): void {
    const picked = this.picked();
    this.picked.set(picked.includes(word) ? picked.filter((w) => w !== word) : [...picked, word]);
    this.writingOwn.set(false);
    this.emit();
  }

  protected toggleOwn(): void {
    const on = !this.writingOwn();
    this.writingOwn.set(on);
    this.picked.set([]);
    this.emit();
    if (on) {
      afterNextRender(() => this.ownInput()?.nativeElement.focus(), { injector: this.injector });
    }
  }

  protected setOwnText(text: string): void {
    this.ownText.set(text);
    this.emit();
  }

  writeValue(value: string | null): void {
    const saved = value?.trim() ?? '';
    this.writingOwn.set(false);
    this.picked.set([]);
    this.ownText.set('');
    if (!saved) return;

    const fullSet = SETS.find((s) => s.full === saved);
    if (fullSet) {
      this.picked.set([fullSet.word]);
      return;
    }
    const words = saved.split('/');
    const known = new Set(SETS.map((s) => s.word as string));
    if (
      words.length > 1 &&
      new Set(words).size === words.length &&
      words.every((w) => known.has(w))
    ) {
      this.picked.set(words as Word[]);
      return;
    }
    this.writingOwn.set(true);
    this.ownText.set(saved);
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
  }

  private emit(): void {
    this.onChange(this.value());
    this.onTouched();
  }
}
