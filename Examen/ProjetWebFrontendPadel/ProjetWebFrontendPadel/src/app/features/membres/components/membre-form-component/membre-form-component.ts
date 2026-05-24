import { Component, inject, Input, OnInit, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { Router } from '@angular/router';
import { MembreService } from '../../services/membre-service';
import { SiteService } from '../../../sites/services/site-service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Site } from '../../../sites/models/site.model';
import { MembreRequest, TypeMembre } from '../../models/membre.model';

// --- Validator : cohérence matricule / type ---
function matriculeTypeValidator(control: AbstractControl): ValidationErrors | null {
  const matricule = control.get('matricule')?.value as string;
  const type      = control.get('typeMembre')?.value as TypeMembre;
  if (!matricule || !type) return null;

  const prefix = matricule.charAt(0);
  const attendu = { GLOBAL: 'G', SITE: 'S', LIBRE: 'L' }[type];

  return prefix !== attendu
    ? { matriculeTypeIncoherent: { attendu, recu: prefix } }
    : null;
}

@Component({
  selector: 'app-membre-form-component',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './membre-form-component.html',
  styleUrl: './membre-form-component.css',
})
export class MembreFormComponent implements OnInit{
  @Input() id?: string;

  readonly router = inject(Router);
  private fb = inject(FormBuilder);
  private membreSvc = inject(MembreService)
  private siteSvc = inject(SiteService);
  private snackBar = inject(MatSnackBar);

  submitting = signal(false);
  isEditMode = signal(false);
  sites      = signal<Site[]>([]);

  form = this.fb.group({
    prenom:     ['', [Validators.required, Validators.maxLength(100)]],
    nom:        ['', [Validators.required, Validators.maxLength(100)]],
    email:      ['', [Validators.required, Validators.email]],
    typeMembre: ['GLOBAL' as TypeMembre, Validators.required],
    matricule:  ['', [Validators.required, Validators.pattern(/^[GSL]\d{4,6}$/)]],
    siteId:     [null as number | null],
    motDePasse: ['', [Validators.minLength(8)]],
  }, { validators: matriculeTypeValidator });

  ngOnInit(): void {
    // Charge les sites pour le select conditionnel
    this.siteSvc.findAll().subscribe(sites => this.sites.set(sites));

    // Validation siteId requise si type SITE
    this.form.get('typeMembre')!.valueChanges.subscribe(type => {
      const siteCtrl = this.form.get('siteId')!;
      if (type === 'SITE') {
        siteCtrl.setValidators(Validators.required);
      } else {
        siteCtrl.clearValidators();
        siteCtrl.setValue(null);
      }
      siteCtrl.updateValueAndValidity();
    });

    // Mode édition
    if (this.id) {
      this.isEditMode.set(true);
      // Mot de passe non obligatoire en édition
      this.form.get('motDePasse')!.clearValidators();
      this.form.get('motDePasse')!.updateValueAndValidity();

      this.membreSvc.findById(+this.id).subscribe(membre => {
        this.form.patchValue({
          prenom:     membre.prenom,
          nom:        membre.nom,
          email:      membre.email,
          typeMembre: membre.typeMembre,
          matricule:  membre.matricule,
          siteId:     membre.siteId ?? null,
        });
      });
    } else {
      this.form.get('motDePasse')!.addValidators(Validators.required);
      this.form.get('motDePasse')!.updateValueAndValidity();
    }
  }

  onTypeChange(): void {
    // Reset le matricule pour forcer la saisie du bon préfixe
    this.form.get('matricule')!.reset('');
  }

  matriculePlaceholder(): string {
    return {
      GLOBAL: 'Ex : G0001',
      SITE:   'Ex : S00001',
      LIBRE:  'Ex : L00001',
    }[this.form.get('typeMembre')?.value as TypeMembre] ?? 'Matricule';
  }

  delaiLabel(): string {
    return {
        GLOBAL: '3 semaines avant le match',
        SITE:   '2 semaines avant le match',
        LIBRE:  '5 jours avant le match',
      }[this.form.get('typeMembre')?.value as TypeMembre]
      ?? 'Sélectionnez un type';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    const v = this.form.value;


    const request: MembreRequest = {
      prenom:     v.prenom!,
      nom:        v.nom!,
      email:      v.email!,
      typeMembre: v.typeMembre!,
      matricule:  v.matricule!,
      siteId:     v.siteId ?? undefined,
    };

    const mdp = v.motDePasse?.trim();
    if (mdp && mdp.length > 0) {
      request.motDePasse = mdp;
    }

    const action$ = this.isEditMode()
      ? this.membreSvc.update(+this.id!, request)
      : this.membreSvc.create(request);

    action$.subscribe({
      next: () => {
        const msg = this.isEditMode() ? 'Membre mis à jour' : 'Membre créé avec succès';
        this.snackBar.open(msg, 'Fermer', { duration: 3000 });
        this.router.navigate(['/membres']);
      },
      error: (err) => {
        this.submitting.set(false);
        const msg = err.error?.message ?? 'Une erreur est survenue';
        this.snackBar.open(msg, 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
      },
    });
  }


}
