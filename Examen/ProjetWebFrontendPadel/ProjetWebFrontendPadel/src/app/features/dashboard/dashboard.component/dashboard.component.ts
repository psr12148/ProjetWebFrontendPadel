import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DashboardService } from '../services/dashboard.service';
import { DashboardStats } from '../models/dashboard.model';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatchService } from '../../matchs/services/match-service';
import { SiteService } from '../../sites/services/site-service';
import { Match, StatutMatch, TypeMatch } from '../../matchs/models/match.model';
import { Site } from '../../sites/models/site.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-dashboard.component',
  imports: [
    DecimalPipe,
    DatePipe,
    FormsModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDividerModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTableModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {

  readonly router      = inject(Router);
  private dashboardSvc = inject(DashboardService);
  private matchSvc = inject(MatchService);
  private siteSvc = inject(SiteService);

  stats   = signal<DashboardStats | null>(null);
  loading = signal(false);

  // --- Section "Tous les matchs de la semaine" ---
  matchsSemaine        = signal<Match[]>([]);
  matchsSemaineLoading = signal(false);
  sites                = signal<Site[]>([]);
  siteIdFiltre: number | null = null;

  colonnesMatchs = ['dateHeure', 'lieu', 'organisateur', 'type', 'joueurs', 'statut', 'actions'];

  /**
   * Date de référence — utilisée pour calculer la semaine affichée.
   * Modifiable via les boutons ← / Aujourd'hui / →
   */
  dateReference = signal<Date>(new Date());

  /** Indique si on consulte la semaine courante (pour le bouton "Aujourd'hui") */
  estSemaineCourante = computed(() => {
    const ref = this.dateReference();
    const today = new Date();
    return this.lundiDe(ref).toDateString() === this.lundiDe(today).toDateString();
  });

  ngOnInit(): void {
    this.siteSvc.findAll().subscribe(s => this.sites.set(s));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    // Format YYYY-MM-DD attendu par le backend
    const dateStr = this.formatDateIso(this.dateReference());

    this.dashboardSvc.getStats(dateStr).subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    // Charge également la liste complète des matchs admin
    this.loadMatchsSemaine();
  }

  loadMatchsSemaine(): void {
    this.matchsSemaineLoading.set(true);
    const dateStr = this.formatDateIso(this.dateReference());

    this.matchSvc.findAllForAdmin(dateStr, this.siteIdFiltre).subscribe({
      next: (matchs) => {
        this.matchsSemaine.set(matchs);
        this.matchsSemaineLoading.set(false);
      },
      error: () => this.matchsSemaineLoading.set(false),
    });
  }

  onSiteFiltreChange(): void {
    this.loadMatchsSemaine();
  }


  // --- Navigation depuis les catégories cliquables ---
  naviguerVersMatchs(filtre: { statut?: StatutMatch; type?: TypeMatch }): void {
    const queryParams: Record<string, string> = {
      semaine: this.formatDateIso(this.debutSemaine()),
    };
    if (filtre.statut) queryParams['statut'] = filtre.statut;
    if (filtre.type)   queryParams['type']   = filtre.type;

    this.router.navigate(['/matchs'], { queryParams });
  }


  // --- Navigation entre semaines ---

  semainePrecedente(): void {
    const d = new Date(this.dateReference());
    d.setDate(d.getDate() - 7);
    this.dateReference.set(d);
    this.load();
  }

  semaineSuivante(): void {
    const d = new Date(this.dateReference());
    d.setDate(d.getDate() + 7);
    this.dateReference.set(d);
    this.load();
  }

  retourAujourdhui(): void {
    this.dateReference.set(new Date());
    this.load();
  }


  // --- Calcul des bornes de semaine pour l'affichage ---

  debutSemaine(): Date {
    return this.lundiDe(this.dateReference());
  }

  finSemaine(): Date {
    const d = this.lundiDe(this.dateReference());
    d.setDate(d.getDate() + 6);
    return d;
  }

  // --- Helpers ---

  /** Retourne le lundi de la semaine contenant la date donnée */
  private lundiDe(date: Date): Date {
    const d = new Date(date);
    const jour = d.getDay();
    const decalage = jour === 0 ? -6 : 1 - jour;  // dimanche → recule de 6, sinon ajuste au lundi
    d.setDate(d.getDate() + decalage);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /** Formate une Date en "YYYY-MM-DD" (sans timezone) */
  private formatDateIso(date: Date): string {
    const yyyy = date.getFullYear();
    const mm   = String(date.getMonth() + 1).padStart(2, '0');
    const dd   = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }


  // --- Couleurs des taux d'occupation ---

  tauxCouleur(taux: number): string {
    if (taux >= 75) return 'text-green-600';
    if (taux >= 40) return 'text-amber-600';
    return 'text-red-500';
  }

  tauxBarreCouleur(taux: number): string {
    if (taux >= 75) return 'bg-green-500';
    if (taux >= 40) return 'bg-amber-400';
    return 'bg-red-400';
  }

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
