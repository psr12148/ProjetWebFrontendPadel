import { Component, inject, OnInit, signal } from '@angular/core';
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

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.dashboardSvc.getStats().subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  debutSemaine(): Date {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  finSemaine(): Date {
    const d = this.debutSemaine();
    d.setDate(d.getDate() + 6);
    return d;
  }

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
