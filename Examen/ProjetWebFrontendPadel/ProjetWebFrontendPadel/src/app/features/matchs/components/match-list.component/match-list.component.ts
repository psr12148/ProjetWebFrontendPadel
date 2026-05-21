import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatchService } from '../../services/match-service';
import { SiteService } from '../../../sites/services/site-service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Match, StatutMatch, TypeMatch } from '../../models/match.model';
import { Site } from '../../../sites/models/site.model';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../../../core/services/auth-service';
import { MatDatepickerModule } from '@angular/material/datepicker';

type VueMatch = 'mes-matchs' | 'publics' | 'terrain';

@Component({
  selector: 'app-match-list.component',
  imports: [
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatChipsModule,
    MatDatepickerModule,
    DatePipe,
  ],
  templateUrl: './match-list.component.html',
  styleUrl: './match-list.component.css',
})
export class MatchListComponent implements OnInit {
  readonly router = inject(Router);
  readonly authSvc = inject(AuthService);
  private route    = inject(ActivatedRoute);
  private matchSvc = inject(MatchService)
  private siteSvc = inject(SiteService);
  private snackBar = inject(MatSnackBar);

  matches = signal<Match[]>([]);
  sites = signal<Site[]>([]);
  loading = signal(false);
  vue     = signal<VueMatch>('mes-matchs');

  // Filtres
  siteIdFiltre: number | null = null;
  terrainIdFiltre: number | null = null;

  // Le datepicker Material travaille avec un objet Date
  dateFiltre = new Date();

  colonnes = ['dateHeure', 'lieu', 'type', 'joueurs', 'statut', 'actions'];

  ngOnInit(): void {
    this.siteSvc.findAll().subscribe(s => this.sites.set(s));

    // Vérifie les queryParams pour pré-sélectionner un terrain (workflow)
    const terrainId = this.route.snapshot.queryParams['terrainId'];
    const siteId    = this.route.snapshot.queryParams['siteId'];

    if (terrainId) {
      this.terrainIdFiltre = +terrainId;
      this.siteIdFiltre    = siteId ? +siteId : null;
      this.vue.set('terrain');  // vue spéciale "matchs d'un terrain"
    }

    this.load();
  }

  setVue(vue: VueMatch): void {
    this.vue.set(vue);
    // Quand on change de vue manuellement, on retire le filtre terrain
    if (vue !== 'terrain') {
      this.terrainIdFiltre = null;
    }
    this.load();
  }

  onFiltreChange(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);

    const obs$ = this.choisirObservable();

    obs$.subscribe({
      next: (matches) => {
        // Filtrage côté client par terrainId si nécessaire
        // (le backend n'a pas d'endpoint findByTerrain dédié, mais
        // la propriété terrainId est présente dans Match)
        const filtres = this.terrainIdFiltre
          ? matches.filter(m => m.terrainId === this.terrainIdFiltre)
          : matches;
        this.matches.set(filtres);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  /**
   * Choisit l'endpoint backend selon la vue active et les filtres.
   */
  private choisirObservable() {
    const membreId = this.authSvc.getMembreId();
    const dateStr = this.formatDateIso(this.dateFiltre);

    // Vue "terrain" : matchs d'un terrain précis (via siteId + filtrage local)
    if (this.vue() === 'terrain' && this.siteIdFiltre) {
      return this.matchSvc.findBySiteAndDate(this.siteIdFiltre, dateStr);
    }

    // Vue "publics disponibles"
    if (this.vue() === 'publics') {
      return this.matchSvc.findPublicsDisponibles();
    }

    // Vue "mes matchs" avec filtre site/date
    if (this.siteIdFiltre) {
      return this.matchSvc.findBySiteAndDate(this.siteIdFiltre, dateStr);
    }

    // Vue "mes matchs" sans filtre → mes matchs uniquement
    if (membreId) {
      return this.matchSvc.findByMembre(membreId);
    }

    // Fallback (membre non connecté — ne devrait pas arriver)
    return this.matchSvc.findPublicsDisponibles();
  }

  /**
   * Convertit une Date en "YYYY-MM-DD" en préservant l'heure locale
   * (évite le décalage UTC de toISOString()).
   */
  private formatDateIso(date: Date): string {
    const yyyy = date.getFullYear();
    const mm   = String(date.getMonth() + 1).padStart(2, '0');
    const dd   = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  onNouveauMatch(): void {
    const queryParams: { siteId?: number; terrainId?: number } = {};

    if (this.terrainIdFiltre) {
      queryParams.terrainId = this.terrainIdFiltre;
    }
    if (this.siteIdFiltre) {
      queryParams.siteId = this.siteIdFiltre;
    }

    this.router.navigate(['/matchs/nouveau'], { queryParams });
  }

  onRejoindre(match: Match): void {
    const membreId = this.authSvc.getMembreId();
    if (!membreId) {
      this.snackBar.open('Vous devez être connecté', 'Fermer', { duration: 3000 });
      return;
    }

    this.matchSvc.rejoindreMatchPublic(match.id, membreId).subscribe({
      next: () => {
        this.snackBar.open('Vous avez rejoint le match !', 'Fermer', { duration: 3000 });
        this.router.navigate(['/matchs', match.id]);
      },
      error: (err) => {
        const msg = err.error?.message ?? 'Impossible de rejoindre ce match';
        this.snackBar.open(msg, 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
      },
    });
  }

  // --- Helpers d'affichage ---

  typeBadgeClass(type: TypeMatch): string {
    return type === 'PRIVE' ? 'badge-prive' : 'badge-public';
  }

  statutBadgeClass(statut: StatutMatch): string {
    return {
      EN_ATTENTE: 'badge-en-attente',
      CONFIRME:   'badge-confirme',
      ANNULE:     'badge-annule',
    }[statut] ?? '';
  }

  statutLabel(statut: StatutMatch): string {
    return {
      EN_ATTENTE: 'En attente',
      CONFIRME:   'Confirmé',
      ANNULE:     'Annulé',
    }[statut] ?? statut;
  }

  joueurIconClass(match: Match, position: number): string {
    const confirmes = match.nombreJoueursConfirmes;
    const inscrits  = 4 - match.placesDisponibles;
    if (position <= confirmes) return 'text-green-500';
    if (position <= inscrits)  return 'text-yellow-500';
    return 'text-gray-200';
  }


}
