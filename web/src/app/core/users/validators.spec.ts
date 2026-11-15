import { FormControl, FormGroup } from '@angular/forms';
import { matches, usernameValidator, usernameValidators } from './validators';

describe('username validators', () => {
  const valid = (value: string) => new FormControl(value, usernameValidators).valid;

  it('accepts lowercase letters, numbers, _ and .', () => {
    expect(valid('sam_cooks.2')).toBe(true);
  });

  it('rejects uppercase, @, and the wrong length', () => {
    for (const value of ['SamCooks', '@sam', 'ab', 'a'.repeat(31), '']) {
      expect(valid(value)).toBe(false);
    }
  });

  it('lets an existing username through until it is changed', () => {
    const control = new FormControl('SamCooks', usernameValidator('SamCooks'));
    expect(control.valid).toBe(true);
    control.setValue('SamCooks2');
    expect(control.valid).toBe(false);
  });
});

describe('matches', () => {
  it('flags a confirmation that differs from the password', () => {
    const form = new FormGroup({
      password: new FormControl('password123'),
      confirm: new FormControl('', matches('password')),
    });
    form.controls.confirm.setValue('password124');
    expect(form.controls.confirm.hasError('mismatch')).toBe(true);
    form.controls.confirm.setValue('password123');
    expect(form.controls.confirm.valid).toBe(true);
  });
});
