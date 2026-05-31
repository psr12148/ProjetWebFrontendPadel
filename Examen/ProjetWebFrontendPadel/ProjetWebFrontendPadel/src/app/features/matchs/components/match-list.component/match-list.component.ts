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

type VueMatch = 'mes-matchs' | 'publics' | 'terrain' | 'dashboard-filtre';

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

  // Filtres venant du dashboard (query params)
  statutFiltre:  StatutMatch | null = null;
  typeFiltre:    TypeMatch   | null = null;
  semaineFiltre: string | null = null;   // "YYYY-MM-DD" (lundi de la semaine)

  // Le datepicker Material travaille avec un objet Date
  dateFiltre = new Date();

  colonnes = ['dateHeure', 'lieu', 'type', 'joueurs', 'statut', 'actions'];

  /** Libellé affiché au-dessus de la liste quand on vient du dashboard */
  get libelleFiltreActif(): string | null {
    if (this.vue() !== 'dashboard-filtre') return null;
    const parts: string[] = [];
    if (this.typeFiltre)   parts.push(this.typeFiltre === 'PRIVE' ? 'Privés' : 'Publics');
    if (this.statutFiltre) parts.push(this.statutLabel(this.statutFiltre).toLowerCase());
    return 'Matchs ' + parts.join(' — ');
  }

  ngOnInit(): void {
    this.siteSvc.findAll().subscribe(s => this.sites.set(s));

    const qp = this.route.snapshot.queryParams;

    // --- Cas 1 : pré-sélection terrain (workflow existant) ---
    const terrainId = qp['terrainId'];
    const siteId    = qp['siteId'];

    if (terrainId) {
      this.terrainIdFiltre = +terrainId;
      this.siteIdFiltre    = siteId ? +siteId : null;
      this.vue.set('terrain');
      this.load();
      return;
    }

    // --- Cas 2 : pré-filtre depuis le dashboard (statut / type / semaine) ---
    const statut  = qp['statut']  as StatutMatch | undefined;
    const type    = qp['type']    as TypeMatch   | undefined;
    const semaine = qp['semaine'] as string | undefined;

    if (statut || type || semaine) {
      this.statutFiltre  = statut  ?? null;
      this.typeFiltre    = type    ?? null;
      this.semaineFiltre = semaine ?? this.formatDateIso(new Date());
      this.vue.set('dashboard-filtre');
      this.load();
      return;
    }

    // --- Cas 3 : vue par défaut ---
    this.load();
  }

  setVue(vue: VueMatch): void {
    this.vue.set(vue);
    // Quand on change de vue manuellement, on retire le filtre terrain
    if (vue !== 'terrain') {
      this.terrainIdFiltre = null;
    }
    // Quitter la vue dashboard-filtre supprime les filtres associés
    if (vue !== 'dashboard-filtre') {
      this.statutFiltre  = null;
      this.typeFiltre    = null;
      this.semaineFiltre = null;
    }
    this.load();
  }

  /**
   * Retire les filtres actifs venant du dashboard et revient à la vue par défaut.
   */
  effacerFiltresDashboard(): void {
    this.statutFiltre  = null;
    this.typeFiltre    = null;
    this.semaineFiltre = null;
    // Nettoie aussi l'URL pour ne pas re-déclencher au prochain rechargement
    this.router.navigate(['/matchs'], { replaceUrl: true });
    this.vue.set('mes-matchs');
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
        let filtres = matches;

        // Filtrage local par terrainId (workflow "vue terrain")
        if (this.terrainIdFiltre) {
          filtres = filtres.filter(m => m.terrainId === this.terrainIdFiltre);
        }

        // Filtrage local par statut / type (vue dashboard-filtre)
        if (this.statutFiltre) {
          filtres = filtres.filter(m => m.statut === this.statutFiltre);
        }
        if (this.typeFiltre) {
          filtres = filtres.filter(m => m.typeMatch === this.typeFiltre);
        }

        this.matches.set(filtres);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  /**
   * Choisit l'endpoint backend selon la vue active.
   */
  private choisirObservable() {
    const membreId = this.authSvc.getMembreId();
    const dateStr  = this.formatDateIso(this.dateFiltre);

    // Vue "dashboard-filtre" : on récupère TOUS les matchs de la semaine
    // (endpoint admin), puis on filtre localement par statut/type.
    if (this.vue() === 'dashboard-filtre') {
      const dateRef = this.semaineFiltre ?? dateStr;
      return this.matchSvc.findAllForAdmin(dateRef, null);
    }

    // Vue "terrain" : matchs d'un terrain précis (filtrage local sur terrainId)
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
