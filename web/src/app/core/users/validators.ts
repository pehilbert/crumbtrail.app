import { AbstractControl, ValidatorFn, Validators } from '@angular/forms';
import { USERNAME_PATTERN } from './user';

/** Rejects values that are empty once trimmed. */
const notBlank: ValidatorFn = (control) =>
  typeof control.value === 'string' && control.value.trim() === '' ? { required: true } : null;

/** First and last names: 1-50 characters. */
export const nameValidators: ValidatorFn[] = [
  Validators.required,
  notBlank,
  Validators.maxLength(50),
];

/** Usernames: 3-30 lowercase letters, digits, "_" and "." only. */
export const usernameValidators: ValidatorFn[] = [
  Validators.required,
  Validators.pattern(USERNAME_PATTERN),
];

/**
 * The username rules, except that `saved` (the user's current username) always passes, so a
 * username saved before the lowercase rule doesn't block saving other fields.
 */
export function usernameValidator(saved: string): ValidatorFn {
  const check = Validators.compose(usernameValidators)!;
  return (control) => (control.value === saved ? null : check(control));
}

/** The hint under a username field. */
export const USERNAME_HINT = '3–30 characters: lowercase letters, numbers, _ and . only.';

/** The message for an invalid username. */
export function usernameError(control: AbstractControl): string {
  const value = String(control.value ?? '');
  if (value.length === 0) return 'Pick a username.';
  if (value.includes('@')) return 'Leave out the @. It’s added for you.';
  if (value.length < 3 || value.length > 30) return 'Use 3–30 characters.';
  return 'Use only lowercase letters, numbers, _ and .';
}

/** Passes when the value matches the sibling control named `otherName`. */
export function matches(otherName: string): ValidatorFn {
  return (control) => {
    const other = control.parent?.get(otherName);
    if (!other || !control.value) return null;
    return control.value === other.value ? null : { mismatch: true };
  };
}
