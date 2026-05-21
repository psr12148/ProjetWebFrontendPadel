import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatchService } from '../../services/match-service';
import { SiteService } from '../../../sites/services/site-service';
import { TerrainService } from '../../../terrains/services/terrain-service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Site } from '../../../sites/models/site.model';
import { CreneauDisponible, Terrain } from '../../../terrains/models/terrain.model';
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
import { MatDatepickerModule } from '@angular/material/datepicker';

@Component({
  selector: 'app-match-form.component',
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
    MatDatepickerModule,
  ],
  templateUrl: './match-form.component.html',
  styleUrl: './match-form.component.css',
})
export class MatchFormComponent implements OnInit{
  readonly router  = inject(Router);
  private route = inject(ActivatedRoute)
  private fb       = inject(FormBuilder);
  private matchSvc  = inject(MatchService);
  private siteSvc   = inject(SiteService);
  private terrainSvc = inject(TerrainService);
  private authSvc    = inject(AuthService)
  private snackBar  = inject(MatSnackBar);

  submitting = signal(false);
  sites      = signal<Site[]>([]);
  terrains   = signal<Terrain[]>([]);
  creneaux         = signal<CreneauDisponible[]>([]);
  creneauxLoading  = signal(false);

  /** Date minimum sélectionnable : aujourd'hui */
  readonly dateMin = new Date();

  form = this.fb.group({
    siteId:    [null as number | null, Validators.required],
    terrainId: [null as number | null, Validators.required],
    date:       [null as Date | null, Validators.required],
    heureDebut: ['', Validators.required],
    typeMatch: ['PUBLIC' as TypeMatch, Validators.required],
  });

  ngOnInit(): void {
    this.siteSvc.findAll().subscribe((sites) => {
      this.sites.set(sites);

      // Pré-remplissage depuis les queryParams
      const siteIdParam    = this.route.snapshot.queryParams['siteId'];
      const terrainIdParam = this.route.snapshot.queryParams['terrainId'];

      if (siteIdParam) {
        const siteId = +siteIdParam;
        this.form.get('siteId')!.setValue(siteId);

        // Charger les terrains du site, puis pré-sélectionner si terrainId fourni
        this.terrainSvc.findBySite(siteId).subscribe(terrains => {
          this.terrains.set(terrains);

          if (terrainIdParam) {
            const terrainId = +terrainIdParam;
            // Vérifie que le terrain appartient bien au site
            const terrainValide = terrains.some(t => t.id === terrainId);
            if (terrainValide) {
              this.form.get('terrainId')!.setValue(terrainId);
            }
          }
        });
      }
    });
  }

  onSiteChange(siteId: number): void {
    this.form.get('terrainId')!.reset(null);
    this.form.get('heureDebut')!.reset('');
    this.terrains.set([]);
    this.creneaux.set([]);
    this.terrainSvc.findBySite(siteId).subscribe(t => this.terrains.set(t));
  }

  onTerrainChange(_terrainId: number): void {
    // Si une date est déjà choisie, on recharge les créneaux pour ce nouveau terrain
    this.form.get('heureDebut')!.reset('');
    this.chargerCreneaux();
  }

  onDateChange(): void {
    // Quand la date change, on recharge les créneaux disponibles
    this.form.get('heureDebut')!.reset('');
    this.chargerCreneaux();
  }

  /**
   * Charge les créneaux disponibles pour le terrain et la date sélectionnés.
   * Ne fait rien si l'un des deux n'est pas encore choisi.
   */
  private chargerCreneaux(): void {
    const terrainId = this.form.get('terrainId')!.value;
    const date      = this.form.get('date')!.value;

    if (!terrainId || !date) {
      this.creneaux.set([]);
      return;
    }

    this.creneauxLoading.set(true);
    const dateStr = this.formatDateIso(date);

    this.terrainSvc.findCreneauxDisponibles(terrainId, dateStr).subscribe({
      next: (cs) => {
        this.creneaux.set(cs);
        this.creneauxLoading.set(false);
      },
      error: () => {
        this.creneaux.set([]);
        this.creneauxLoading.set(false);
      },
    });
  }

  typeCardClass(type: TypeMatch): string {
    const selected = this.form.get('typeMatch')?.value === type;
    return selected
      ? (type === 'PRIVE'
        ? 'border-purple-400 bg-purple-50'
        : 'border-blue-400 bg-blue-50')
      : 'border-gray-200 bg-white hover:border-gray-300';
  }

  /** Affiche "08:00" à partir de "08:00:00" */
  formatHeure(heure: string): string {
    return heure.substring(0, 5);
  }

  /** Convertit Date → "YYYY-MM-DD" (heure locale, pas UTC) */
  private formatDateIso(date: Date): string {
    const yyyy = date.getFullYear();
    const mm   = String(date.getMonth() + 1).padStart(2, '0');
    const dd   = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  /** Concatène date (Date) + heure ("HH:mm:ss") → "YYYY-MM-DDTHH:mm:ss" */
  private buildDateHeure(date: Date, heure: string): string {
    return `${this.formatDateIso(date)}T${heure}`;
  }


  // --- Soumission ---

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

    // Combine date + heure choisies en string LocalDateTime
    const dateHeure = this.buildDateHeure(
      this.form.value.date!,
      this.form.value.heureDebut!
    );

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
