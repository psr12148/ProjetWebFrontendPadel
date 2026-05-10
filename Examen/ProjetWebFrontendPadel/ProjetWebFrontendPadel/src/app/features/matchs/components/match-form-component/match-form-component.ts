import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatchService } from '../../services/match-service';
import { SiteService } from '../../../sites/services/site-service';
import { TerrainService } from '../../../terrains/services/terrain-service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Site } from '../../../sites/models/site.model';
import { Terrain } from '../../../terrains/models/terrain.model';
import { MatchRequest, TypeMatch } from '../../models/match.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatRadioModule } from '@angular/material/radio';
import { AuthService } from '../../../../core/services/auth-service';

@Component({
  selector: 'app-match-form-component',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatRadioModule,
  ],
  templateUrl: './match-form-component.html',
  styleUrl: './match-form-component.css',
})
export class MatchFormComponent implements OnInit {

  readonly router  = inject(Router);
  private fb       = inject(FormBuilder);
  private matchSvc  = inject(MatchService);
  private siteSvc   = inject(SiteService);
  private terrainSvc = inject(TerrainService);
  private authSvc    = inject(AuthService)
  private snackBar  = inject(MatSnackBar);

  submitting = signal(false);
  sites      = signal<Site[]>([]);
  terrains   = signal<Terrain[]>([]);


  form = this.fb.group({
    siteId:    [null as number | null, Validators.required],
    terrainId: [null as number | null, Validators.required],
    dateHeure: ['', Validators.required],
    typeMatch: ['PUBLIC' as TypeMatch, Validators.required],
  });

  ngOnInit(): void {
    this.siteSvc.findAll().subscribe(sites => this.sites.set(sites));
  }

  onSiteChange(siteId: number): void {
    this.form.get('terrainId')!.reset(null);
    this.terrains.set([]);
    this.terrainSvc.findBySite(siteId).subscribe(t => this.terrains.set(t));
  }

  typeCardClass(type: TypeMatch): string {
    const selected = this.form.get('typeMatch')?.value === type;
    return selected
      ? (type === 'PRIVE'
        ? 'border-purple-400 bg-purple-50'
        : 'border-blue-400 bg-blue-50')
      : 'border-gray-200 bg-white hover:border-gray-300';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const organisateurId = this.authSvc.getMembreId();
    if (!organisateurId) {
      this.snackBar.open('Vous devez être connecté pour créer un match', 'Fermer', {
        duration: 4000,
        panelClass: ['error-snackbar'],
      });
      return;
    }

    this.submitting.set(true);

    let dateHeure = this.form.value.dateHeure!;
    // L'input HTML retourne "2026-05-21T09:00", on ajoute ":00" pour les secondes
    if (dateHeure.length === 16) {
      dateHeure += ':00';
    }

    const request: MatchRequest = {
      terrainId: this.form.value.terrainId!,
      dateHeure,
      typeMatch: this.form.value.typeMatch!,
    };

    this.matchSvc.creerMatch(organisateurId, request).subscribe({
      next: (match) => {
        this.snackBar.open('Match créé avec succès !', 'Fermer', { duration: 3000 });
        this.router.navigate(['/matchs', match.id]);
      },
      error: (err) => {
        this.submitting.set(false);
        const msg = err.error?.message ?? 'Une erreur est survenue';
        this.snackBar.open(msg, 'Fermer', {
          duration: 6000,
          panelClass: ['error-snackbar'],
        });
      },
    });
  }
}
