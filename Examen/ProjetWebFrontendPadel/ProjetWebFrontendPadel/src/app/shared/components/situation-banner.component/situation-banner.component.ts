import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth-service';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MembreService } from '../../../features/membres/services/membre-service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-situation-banner',
  imports: [
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    DecimalPipe,
    DatePipe
  ],
  templateUrl: './situation-banner.component.html',
  styleUrl: './situation-banner.component.css',
})
export class SituationBannerComponent implements OnInit {
  private authSvc = inject(AuthService);
  private membreSvc = inject(MembreService);
  private snack = inject(MatSnackBar);

  // L'utilisateur courant (signal réactif déjà exposé par AuthService)
  private user = this.authSvc.currentUser;

  paiementEnCours = signal(false);

  solde = computed(() => this.user()?.soldeImpaye ?? 0);
  penaliteJusquA = computed(() => this.user()?.penaliteJusquA ?? null);

  // Pas de bannière pour les admins (ils n'ont ni solde ni pénalité métier)
  aSolde = computed(() =>
    !this.user()?.admin && this.solde() > 0
  );

  penaliteActive = computed(() => {
    if (this.user()?.admin) return false;
    const dateStr = this.penaliteJusquA();
    if (!dateStr) return false;
    // Pénalité active si la date de fin est aujourd'hui ou dans le futur
    const fin = new Date(dateStr);
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);
    return fin >= aujourdhui;
  });

  ngOnInit(): void {
    // Rafraîchit la situation depuis le backend au chargement.
    // Indispensable : le localStorage peut être périmé si le scheduler
    // a modifié le solde/la pénalité pendant que l'utilisateur était absent.
    if (this.authSvc.isAuthenticated()) {
      this.authSvc.me().subscribe({
        error: () => { /* en cas d'erreur, on garde les données du localStorage */ }
      });
    }
  }

  onPayerSolde(): void {
    const membreId = this.authSvc.getMembreId();
    if (membreId == null) return;

    this.paiementEnCours.set(true);

    this.membreSvc.payerSolde(membreId).subscribe({
      next: (res) => {
        this.snack.open(
          `Solde de ${res.montantRegle}€ réglé. Vous pouvez réserver à nouveau !`,
          'Fermer',
          { duration: 4000 }
        );
        // Rafraîchit la situation : me() met à jour currentUser
        // -> la bannière disparaît automatiquement (signals).
        this.authSvc.me().subscribe({
          next: () => this.paiementEnCours.set(false),
          error: () => this.paiementEnCours.set(false),
        });
      },
      error: (err) => {
        this.paiementEnCours.set(false);
        const msg = err.error?.message ?? 'Erreur lors du paiement du solde';
        this.snack.open(msg, 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
      },
    });
  }
}
