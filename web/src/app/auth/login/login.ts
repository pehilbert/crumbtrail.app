import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { errorMessage } from '../../core/api';
import { safeReturnUrl } from '../../core/auth/auth.guards';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly form = inject(NonNullableFormBuilder).group({
    login: ['', Validators.required],
    password: ['', Validators.required],
  });
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected async submit(): Promise<void> {
    if (this.submitting()) return;
    const { login, password } = this.form.getRawValue();
    if (!login.trim() || !password) {
      this.error.set('Enter your email or username and your password.');
      return;
    }

    this.submitting.set(true);
    this.error.set(null);
    try {
      await this.auth.login({ login: login.trim(), password });
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      await this.router.navigateByUrl(safeReturnUrl(returnUrl));
    } catch (err) {
      this.error.set(
        errorMessage(err, {
          400: 'Enter your email or username and your password.',
          401: 'That doesn’t match an account. Check your details and try again.',
        }),
      );
      this.form.controls.password.reset();
    } finally {
      this.submitting.set(false);
    }
  }
}
