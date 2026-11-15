import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { errorMessage } from '../../core/api';
import { AuthService } from '../../core/auth/auth.service';
import { ProfileUpdate } from '../../core/users/user';
import { UsersService } from '../../core/users/users.service';
import {
  USERNAME_HINT,
  nameValidators,
  usernameError,
  usernameValidator,
} from '../../core/users/validators';
import { Lowercase } from '../../ui/lowercase';
import { PronounPicker } from '../../ui/pronoun-picker/pronoun-picker';

type Field = 'firstName' | 'lastName' | 'username';

@Component({
  selector: 'app-edit-profile',
  imports: [ReactiveFormsModule, RouterLink, PronounPicker, Lowercase],
  templateUrl: './edit-profile.html',
  styleUrl: './edit-profile.css',
})
export class EditProfile {
  private readonly auth = inject(AuthService);
  private readonly users = inject(UsersService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  /** The signed-in guard guarantees a user on this route. */
  protected readonly user = this.auth.user()!;

  protected readonly form = this.fb.group({
    firstName: [this.user.firstName, nameValidators],
    lastName: [this.user.lastName, nameValidators],
    username: [this.user.username, usernameValidator(this.user.username)],
    pronouns: this.fb.control<string | null>(this.user.pronouns),
  });
  protected readonly submitted = signal(false);
  protected readonly saving = signal(false);
  protected readonly usernameHint = USERNAME_HINT;
  protected readonly error = signal<string | null>(null);

  protected fieldError(field: Field): string | null {
    const control = this.form.controls[field];
    if (!control.invalid || !(control.touched || this.submitted())) return null;
    if (control.hasError('taken')) return 'That username is taken. Try another one.';
    if (field === 'username') return usernameError(control);
    return field === 'firstName'
      ? 'Add your first name (up to 50 characters).'
      : 'Add your last name (up to 50 characters).';
  }

  protected async save(): Promise<void> {
    if (this.saving()) return;
    this.submitted.set(true);
    this.error.set(null);
    if (this.form.invalid) {
      this.error.set('A few things need fixing first.');
      return;
    }

    const changes = this.changes();
    if (Object.keys(changes).length === 0) {
      await this.router.navigate(['/profile']);
      return;
    }

    this.saving.set(true);
    try {
      const updated = await firstValueFrom(this.users.update(this.user.id, changes));
      this.auth.setUser(updated);
      await this.router.navigate(['/profile']);
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 409) {
        this.form.controls.username.setErrors({ taken: true });
        this.error.set('A few things need fixing first.');
      } else {
        this.error.set(errorMessage(err));
      }
    } finally {
      this.saving.set(false);
    }
  }

  /** Only the fields that changed: the API leaves omitted fields alone. */
  private changes(): ProfileUpdate {
    const value = this.form.getRawValue();
    const changes: ProfileUpdate = {};
    const firstName = value.firstName.trim();
    const lastName = value.lastName.trim();
    const username = value.username.trim();
    if (firstName !== this.user.firstName) changes.firstName = firstName;
    if (lastName !== this.user.lastName) changes.lastName = lastName;
    if (username !== this.user.username) changes.username = username;
    if (value.pronouns !== this.user.pronouns) changes.pronouns = value.pronouns;
    return changes;
  }
}
