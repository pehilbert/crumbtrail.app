import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { catchError, firstValueFrom, of } from 'rxjs';
import { errorMessage } from '../../core/api';
import { AuthService } from '../../core/auth/auth.service';
import { UsersService } from '../../core/users/users.service';
import { tileClass } from '../../recipes/recipe';
import { RecipesService } from '../../recipes/recipes.service';

@Component({
  selector: 'app-profile',
  imports: [RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  private readonly auth = inject(AuthService);
  private readonly users = inject(UsersService);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly keepButton = viewChild<ElementRef<HTMLButtonElement>>('keepButton');
  private readonly deactivateButton = viewChild<ElementRef<HTMLButtonElement>>('deactivateButton');

  protected readonly user = this.auth.user;

  /** `undefined` while loading, `null` if the recipes couldn't be loaded. */
  protected readonly recipes = toSignal(
    inject(RecipesService)
      .listMine()
      .pipe(catchError(() => of(null))),
  );
  protected readonly recent = computed(() => this.recipes()?.slice(0, 3) ?? []);
  protected readonly recipeCount = computed(() => this.recipes()?.length);

  protected readonly joined = computed(() => {
    const date = this.user()?.joinDate;
    if (!date) return '';
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    return `${month} ’${String(date.getFullYear()).slice(-2)}`;
  });

  protected readonly confirmingDeactivate = signal(false);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly tileClass = tileClass;

  protected async logOut(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    await this.auth.logout();
    await this.router.navigate(['/login']);
  }

  protected askToDeactivate(): void {
    this.error.set(null);
    this.confirmingDeactivate.set(true);
    afterNextRender(() => this.keepButton()?.nativeElement.focus(), { injector: this.injector });
  }

  protected keepAccount(): void {
    this.confirmingDeactivate.set(false);
    afterNextRender(() => this.deactivateButton()?.nativeElement.focus(), {
      injector: this.injector,
    });
  }

  protected async deactivate(): Promise<void> {
    const user = this.user();
    if (!user || this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    try {
      await firstValueFrom(this.users.deactivate(user.id));
      await this.auth.forgetSession();
      await this.router.navigate(['/login']);
    } catch (err) {
      this.error.set(errorMessage(err));
      this.busy.set(false);
    }
  }
}
