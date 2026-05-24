import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../../core/services/auth-service';
import { MatSnackBar } from '@angular/material/snack-bar';

// Validator : vérifie que motDePasse === confirmation
function motsDePasseIdentiques(control: AbstractControl): ValidationErrors | null {
  const mdp     = control.get('motDePasse')?.value;
  const confirm = control.get('confirmation')?.value;
  if (!mdp || !confirm) return null;
  return mdp === confirm ? null : { motsDePasseDifferents: true };
}

@Component({
  selector: 'app-register.component',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {

  private fb      = inject(FormBuilder);
  private authSvc = inject(AuthService);
  private router  = inject(Router);
  private snack   = inject(MatSnackBar);

  loading        = signal(false);
  registerError  = signal<string | null>(null);
  showPassword   = signal(false);

  form = this.fb.group({
    prenom:       ['', [Validators.required, Validators.maxLength(100)]],
    nom:          ['', [Validators.required, Validators.maxLength(100)]],
    email:        ['', [Validators.required, Validators.email]],
    motDePasse:   ['', [Validators.required, Validators.minLength(8)]],
    confirmation: ['', [Validators.required]],
  }, { validators: motsDePasseIdentiques });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.registerError.set(null);

    this.authSvc.register({
      prenom:     this.form.value.prenom!,
      nom:        this.form.value.nom!,
      email:      this.form.value.email!,
      motDePasse: this.form.value.motDePasse!,
    }).subscribe({
      next: (user) => {
        this.loading.set(false);
        this.snack.open(
          `Bienvenue ${user.prenom} ! Votre matricule : ${user.matricule}`,
          'Fermer',
          { duration: 5000 }
        );
        // Nouvel inscrit = membre LIBRE → redirigé vers /sites (workflow réservation)
        this.router.navigate(['/sites']);
      },
      error: (err) => {
        this.loading.set(false);
        this.registerError.set(
          err.error?.message ?? 'Une erreur est survenue lors de l\'inscription'
        );
      },
    });
  }

}
