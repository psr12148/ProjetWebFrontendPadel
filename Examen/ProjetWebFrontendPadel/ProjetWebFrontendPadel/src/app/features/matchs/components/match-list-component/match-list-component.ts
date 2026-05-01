import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
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

@Component({
  selector: 'app-match-list-component',
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
    DatePipe,
  ],
  templateUrl: './match-list-component.html',
  styleUrl: './match-list-component.css',
})
export class MatchListComponent implements OnInit {

  readonly router = inject(Router);
  private matchSvc = inject(MatchService)
  private siteSvc = inject(SiteService);
  private snackBar = inject(MatSnackBar);

  matches = signal<Match[]>([]);
  sites = signal<Site[]>([]);
  loading = signal(false);
  vue = signal<'mes-matchs' | 'publics'>('mes-matchs');

  siteIdFiltre: number | null = null;
  dateFiltre = new Date().toISOString().slice(0, 10);

  // TODO : remplacer par l'id du membre connecté (depuis AuthService)
  private membreId = 1;

  colonnes = ['dateHeure', 'lieu', 'type', 'joueurs', 'statut', 'actions'];

  ngOnInit(): void {
    this.siteSvc.findAll().subscribe(s => this.sites.set(s));
    this.load();
  }

  setVue(vue: 'mes-matchs' | 'publics'): void {
    this.vue.set(vue);
    this.load();
  }

  onFiltreChange(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);

    const obs$ = this.vue() === 'publics'
      ? this.matchSvc.findPublicsDisponibles()
      : this.siteIdFiltre
        ? this.matchSvc.findBySiteAndDate(this.siteIdFiltre, this.dateFiltre)
        : this.matchSvc.findByMembre(this.membreId);

    obs$.subscribe({
      next: (matches) => {
        this.matches.set(matches);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onRejoindre(match: Match): void {
    this.matchSvc.rejoindreMatchPublic(match.id, this.membreId).subscribe({
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
