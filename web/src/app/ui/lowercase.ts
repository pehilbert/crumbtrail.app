import { Directive, ElementRef, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * Lowercases an input's value as the user types, keeping the caret where it was. Use it on
 * fields the API stores in lowercase, such as usernames.
 */
@Directive({
  selector: 'input[ctLowercase]',
  host: { '(input)': 'lowercase()' },
})
export class Lowercase {
  private readonly input = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  private readonly control = inject(NgControl, { self: true });

  protected lowercase(): void {
    const value = this.input.value;
    const lower = value.toLowerCase();
    if (lower === value) return;
    const { selectionStart, selectionEnd } = this.input;
    this.control.control?.setValue(lower);
    this.input.value = lower;
    this.input.setSelectionRange(selectionStart, selectionEnd);
  }
}
