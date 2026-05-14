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

@Component({
  selector: 'app-dashboard.component',
  imports: [
    DecimalPipe,
    DatePipe,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDividerModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {

  readonly router      = inject(Router);
  private dashboardSvc = inject(DashboardService);

  stats   = signal<DashboardStats | null>(null);
  loading = signal(false);

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

}
