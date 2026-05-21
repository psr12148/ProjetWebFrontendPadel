import {Component, inject, Input, OnInit, signal} from '@angular/core';
import {AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {SiteService} from '../../services/site-service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {SiteRequest} from '../../models/site.model';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatDividerModule} from '@angular/material/divider';

// Validator : heure fermeture > ouverture ET plage >= 105 min
function horairesValidator(control: AbstractControl): ValidationErrors | null {
  const ouverture = control.get('heureOuverture')?.value as string;
  const fermeture = control.get('heureFermeture')?.value as string;

  if (!ouverture || !fermeture) return null;

  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const duree = toMin(fermeture) - toMin(ouverture);
  if (duree <= 0) return { horairesInvalides: true };
  if (duree < 105) return { plageTropCourte: true };

  return null;
}

@Component({
  selector: 'app-site-form-component',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './site-form-component.html',
  styleUrl: './site-form-component.css',
})
export class SiteFormComponent implements OnInit{
  @Input() id?: string;

  readonly router  = inject(Router);
  private fb       = inject(FormBuilder);
  private siteService = inject(SiteService);
  private snackBar = inject(MatSnackBar);

  submitting     = signal(false);
  isEditMode     = signal(false);
  nombreCreneaux = signal(8);

  form = this.fb.group({
    nom:             ['', [Validators.required, Validators.maxLength(100)]],
    adresse:         ['', [Validators.required]],
    nbTerrains:      [1, [Validators.required, Validators.min(1), Validators.max(50)]],
    anneeApplicable: [new Date().getFullYear(), [Validators.required, Validators.min(2024)]],
    horaires: this.fb.group({
        heureOuverture: ['08:00', [Validators.required]],
        heureFermeture: ['22:00', [Validators.required]],
      },
      { validators: horairesValidator })
  });

  ngOnInit(): void {
    // Recalcul temps réel des créneaux
    this.form.get('horaires')!.valueChanges.subscribe(v => {
      if (!v.heureOuverture || !v.heureFermeture) {
        this.nombreCreneaux.set(0);
        return;
      }
      const toMin = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
      };
      const duree = toMin(v.heureFermeture) - toMin(v.heureOuverture);
      this.nombreCreneaux.set(duree > 0 ? Math.floor(duree / 105) : 0);
    });

    // Mode édition : pré-remplissage du formulaire
    if (this.id) {
      this.isEditMode.set(true);
      this.siteService.findById(+this.id).subscribe({
        next: (site) => {
          this.form.patchValue({
            nom:             site.nom,
            adresse:         site.adresse,
            nbTerrains:      site.nbTerrains,
            anneeApplicable: site.anneeApplicable,
            horaires: {
              // Les heures arrivent du backend au format "HH:mm:ss" → on tronque à "HH:mm"
              // car <input type="time"> n'accepte que ce format
              heureOuverture: site.heureOuverture.substring(0, 5),
              heureFermeture: site.heureFermeture.substring(0, 5),
            },
          });
        },
        error: () => {
          this.snackBar.open('Site introuvable', 'Fermer', { duration: 3000 });
          this.router.navigate(['/sites']);
        },
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    const h = this.form.get('horaires')!.value;
    const request: SiteRequest = {
      nom:             this.form.value.nom!,
      adresse:         this.form.value.adresse!,
      nbTerrains:      this.form.value.nbTerrains!,
      anneeApplicable: this.form.value.anneeApplicable!,
      heureOuverture:  h.heureOuverture!,
      heureFermeture:  h.heureFermeture!
    };

    const action$ = this.isEditMode()
      ? this.siteService.update(+this.id!, request)
      : this.siteService.create(request);

    action$.subscribe({
      next: () => {
        const msg = this.isEditMode() ? 'Site mis à jour' : 'Site créé avec succès';
        this.snackBar.open(msg, 'Fermer', { duration: 3000 });
        this.router.navigate(['/sites']);
      },
      error: (err) => {
        this.submitting.set(false);
        const msg = err.error?.message ?? 'Une erreur est survenue';
        this.snackBar.open(msg, 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }
}
