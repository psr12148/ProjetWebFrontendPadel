import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth-service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-login.component',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {

  private fb = inject(FormBuilder);
  private authSvc = inject(AuthService);
  private router = inject(Router);
  private snack = inject(MatSnackBar);

  loading = signal(false);
  loginError = signal<string | null>(null);
  showPassword = signal(false);

  form = this.fb.group({
    email : ['', [Validators.required, Validators.email]],
    motDePasse : ['', Validators.required]
  });

  onSubmit(): void {
    if (this.form.invalid) {this.form.markAllAsTouched(); return;}

    this.loading.set(true);
    this.loginError.set(null);

    this.authSvc.login({
      email: this.form.value.email!,
      motDePasse: this.form.value.motDePasse!
    }).subscribe({
      next: (user) => {
        this.loading.set(false);
        this.snack.open(`Bienvenue ${user.prenom} !`, 'Fermer', { duration: 3000 });
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.loginError.set(err.error?.message ?? 'Email ou mot de passe incorrect');
      }
    });
  }


}
