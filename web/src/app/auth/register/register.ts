import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { apiMessages, errorMessage } from '../../core/api';
import { HOME_URL } from '../../core/auth/auth.guards';
import { AuthService } from '../../core/auth/auth.service';
import { PronounPicker } from '../../ui/pronoun-picker/pronoun-picker';
import {
  USERNAME_HINT,
  matches,
  nameValidators,
  usernameError,
  usernameValidators,
} from '../../core/users/validators';
import { Lowercase } from '../../ui/lowercase';

type Field = 'firstName' | 'lastName' | 'username' | 'email' | 'password' | 'confirmPassword';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, PronounPicker, Lowercase],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly form = this.fb.group({
    firstName: ['', nameValidators],
    lastName: ['', nameValidators],
    pronouns: this.fb.control<string | null>(null),
    username: ['', usernameValidators],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
    confirmPassword: ['', [Validators.required, matches('password')]],
  });
  protected readonly usernameHint = USERNAME_HINT;
  protected readonly submitted = signal(false);
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  constructor() {
    // Re-check the confirmation when the password changes.
    this.form.controls.password.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.form.controls.confirmPassword.updateValueAndValidity());
  }

  /** The message to show under a field, once the user has left it or tried to submit. */
  protected fieldError(field: Field): string | null {
    const control = this.form.controls[field];
    if (!control.invalid || !(control.touched || this.submitted())) return null;
    if (control.hasError('taken')) {
      return field === 'email'
        ? 'That email already has an account. Try logging in instead.'
        : 'That username is taken. Try another one.';
    }
    switch (field) {
      case 'firstName':
        return 'Add your first name (up to 50 characters).';
      case 'lastName':
        return 'Add your last name (up to 50 characters).';
      case 'username':
        return usernameError(control);
      case 'email':
        return 'Enter an email like you@example.com.';
      case 'password':
        return control.hasError('maxlength')
          ? 'Passwords can be up to 128 characters.'
          : 'Use at least 8 characters.';
      case 'confirmPassword':
        return control.hasError('mismatch')
          ? 'Those passwords don’t match.'
          : 'Type your password again.';
    }
  }

  protected async submit(): Promise<void> {
    if (this.submitting()) return;
    this.submitted.set(true);
    this.error.set(null);
    if (this.form.invalid) {
      this.error.set('A few things need fixing first.');
      return;
    }

    const value = this.form.getRawValue();
    this.submitting.set(true);
    try {
      await this.auth.register({
        firstName: value.firstName.trim(),
        lastName: value.lastName.trim(),
        pronouns: value.pronouns,
        username: value.username.trim(),
        email: value.email.trim(),
        password: value.password,
      });
      await this.router.navigateByUrl(HOME_URL);
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 409) {
        const message = apiMessages(err).join(' ').toLowerCase();
        const control: AbstractControl = message.includes('email')
          ? this.form.controls.email
          : this.form.controls.username;
        control.setErrors({ taken: true });
        this.error.set('A few things need fixing first.');
      } else {
        this.error.set(errorMessage(err));
      }
    } finally {
      this.submitting.set(false);
    }
  }
}
