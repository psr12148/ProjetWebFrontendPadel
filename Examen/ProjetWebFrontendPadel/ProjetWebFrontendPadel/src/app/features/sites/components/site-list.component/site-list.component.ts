import {Component, inject, OnInit, signal} from '@angular/core';
import {Router} from '@angular/router';
import {SiteService} from '../../services/site-service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatDialog} from '@angular/material/dialog';
import {Site} from '../../models/site.model';
import {ConfirmDialog} from '../../../../shared/components/confirm-dialog/confirm-dialog';
import {MatTableModule} from '@angular/material/table';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatChipsModule} from '@angular/material/chips';
import { AuthService } from '../../../../core/services/auth-service';

@Component({
  selector: 'app-site-list.component',
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  templateUrl: './site-list.component.html',
  styleUrl: './site-list.component.css',
})
export class SiteListComponent implements OnInit{

  readonly router = inject(Router);
  readonly authSvc   = inject(AuthService);
  private siteService = inject(SiteService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  sites = signal<Site[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  colonnes = [
    'nom', 'adresse', 'nbTerrains', 'horaires', 'creneaux', 'annee', 'actions'
  ];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.siteService.findAll(). subscribe({
      next: (sites) => {
        this.sites.set(sites);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger les sites.');
        this.loading.set(false);
      },
    });
  }

  /**
   * Lance le workflow de réservation pour ce site :
   * navigue vers /terrains avec le siteId en queryParam.
   * La page Terrains pré-sélectionnera ce site (déjà géré dans son ngOnInit).
   */
  onReserver(site: Site): void {
    this.router.navigate(['/terrains'], {
      queryParams: { siteId: site.id }
    });
  }

  onEdit(site: Site): void {
    this.router.navigate(['/sites', site.id, 'modifier'] );
  }

  onDelete(site: Site): void {
    const ref = this.dialog.open(ConfirmDialog, {
      width: '400px',
      data: {
        title: 'Supprimer le site',
        message: `Supprimer "${site.nom}" ? Cette action est irréversible.`,
        confirmLabel: 'Supprimer',
      }
    });

    ref.afterClosed().subscribe(confirmed => {
      if(!confirmed) return;
      this.siteService.delete(site.id).subscribe({
        next: () => {
          this.sites.update(list => list.filter(s => s.id !== site.id));
          this.snackBar.open(`"${site.nom}" supprimé`, 'Fermer', { duration: 3000 });
        },
        error: () => {
          this.snackBar.open('Erreur lors de la suppression', 'Fermer', {
            duration: 4000,
            panelClass: ['error-snackbar']
          });
        }
      });
    });
  }

}
