import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatchService } from '../../services/match-service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Match, Participation, StatutParticipation } from '../../models/match.model';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../../../core/services/auth-service';

@Component({
  selector: 'app-match-detail-component',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
    DatePipe,
  ],
  templateUrl: './match-detail-component.html',
  styleUrl: './match-detail-component.css',
})
export class MatchDetailComponent implements OnInit{

  @Input() id!: string;

  readonly router = inject(Router);
  private matchSvc = inject(MatchService);
  private authSvc  = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  match   = signal<Match | null>(null);
  loading = signal(false);

  /**
   * Getter qui récupère l'ID du membre connecté à la volée.
   * Évite de stocker une valeur potentiellement obsolète.
   */
  get membreConnecteId(): number | null {
    return this.authSvc.getMembreId();
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.matchSvc.findById(+this.id).subscribe({
      next: (m) => {
        this.match.set(m);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Match introuvable', 'Fermer', { duration: 3000 });
        this.loading.set(false);
        this.router.navigate(['/matchs']);
      },
    });
  }

  // --- Actions ---

  onPayer(participation: Participation): void {
    const membreId = this.membreConnecteId;
    if (!membreId) {
      this.snackBar.open('Vous devez être connecté', 'Fermer', { duration: 3000 });
      return;
    }

    const ref = this.dialog.open(ConfirmDialog, {
      width: '400px',
      data: {
        title:        'Confirmer le paiement',
        message:      `Payer ${participation.montantDu}€ pour ce match ?`,
        confirmLabel: `Payer ${participation.montantDu}€`,
      },
    });


    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.matchSvc.payerParticipation(+this.id, membreId).subscribe({
        next: () => {
          this.snackBar.open('Paiement confirmé !', 'Fermer', { duration: 3000 });
          this.load();
        },
        error: (err) => {
          const msg = err.error?.message ?? 'Erreur lors du paiement';
          this.snackBar.open(msg, 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar'],
          });
        },
      });
    });
  }

  onRejoindre(): void {
    const membreId = this.membreConnecteId;
    if (!membreId) {
      this.snackBar.open('Vous devez être connecté', 'Fermer', { duration: 3000 });
      return;
    }

    this.matchSvc.rejoindreMatchPublic(+this.id, membreId).subscribe({
      next: () => {
        this.snackBar.open('Vous avez rejoint le match !', 'Fermer', { duration: 3000 });
        this.load();
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

  // --- Helpers ---

  heureFin(): string {
    if (!this.match()) return '';
    const d = new Date(this.match()!.dateHeure);
    d.setMinutes(d.getMinutes() + 90);
    return d.toTimeString().slice(0, 5);
  }

  placesVides(): number[] {
    if (!this.match()) return [];
    return Array.from({ length: this.match()!.placesDisponibles }, (_, i) => i);
  }

  estOrganisateur(): boolean {
    return this.match()?.organisateurId === this.membreConnecteId;
  }

  estDejaInscrit(): boolean {
    return this.match()?.participations
      .some(p => p.membreId === this.membreConnecteId
        && p.statut !== 'LIBERE') ?? false;
  }

  typeBadgeClass(type: string): string {
    return type === 'PRIVE' ? 'badge-prive' : 'badge-public';
  }

  statutBadgeClass(statut: string): string {
    return {
      EN_ATTENTE: 'badge-en-attente',
      CONFIRME:   'badge-confirme',
      ANNULE:     'badge-annule',
    }[statut] ?? '';
  }

  statutLabel(statut: string): string {
    return {
      EN_ATTENTE: 'En attente',
      CONFIRME:   'Confirmé',
      ANNULE:     'Annulé',
    }[statut] ?? statut;
  }

  avatarColor(statut: StatutParticipation): string {
    return {
      CONFIRME:   '#4caf50',
      EN_ATTENTE: '#ff9800',
      LIBERE:     '#9e9e9e',
    }[statut] ?? '#9e9e9e';
  }

}
