import {Component, inject, OnInit, signal} from '@angular/core';
import {MatTableModule} from '@angular/material/table';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatSelectModule} from '@angular/material/select';
import {MatFormFieldModule} from '@angular/material/form-field';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {SiteService} from '../../../sites/services/site-service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatDialog} from '@angular/material/dialog';
import {TerrainService} from '../../services/terrain-service';
import {Terrain} from '../../models/terrain.model';
import {Site} from '../../../sites/models/site.model';
import {ConfirmDialog} from '../../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-terrain-list-component',
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule
  ],
  templateUrl: './terrain-list-component.html',
  styleUrl: './terrain-list-component.css',
})
export class TerrainListComponent implements OnInit{
  readonly router = inject(Router);
  private route = inject(ActivatedRoute);
  private terrainSvc = inject(TerrainService);
  private siteSvc = inject(SiteService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  terrains = signal<Terrain[]>([]);
  sites = signal<Site[]>([]);
  siteIdSelectionne = signal<number | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  colonnes = ['numero', 'nomAffichage', 'site', 'actions'];

  ngOnInit(): void {
    // Charge la liste des sites pour le filtre
    this.siteSvc.findAll().subscribe(sites => {
      this.sites.set(sites);
      // Pré-selectionne le site passé en queryParam (depuis la page Sites)
      const siteId = this.route.snapshot.queryParams['siteId'];
      if (siteId) {
        this.siteIdSelectionne.set(+siteId);
        this.loadTerrains();
      } else if (sites.length > 0) {
        this.siteIdSelectionne.set(sites[0].id);
        this.loadTerrains();
      }
    })
  }

  onSiteChange(siteId: number): void {
    this.siteIdSelectionne.set(siteId)
    this.loadTerrains();
  }

  loadTerrains(): void {
    const siteId = this.siteIdSelectionne();
    if (!siteId) return;

    this.loading.set(true);
    this.error.set(null);

    this.terrainSvc.findBySite(siteId).subscribe({
      next: terrains => {
        this.terrains.set(terrains);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger les terrains');
        this.loading.set(false);
      }
    });
  }

  onEdit(terrain: Terrain): void {
    this.router.navigate(['/terrains', terrain.id, 'modifier']);
  }

  onDelete(terrain: Terrain): void {
    const ref = this.dialog.open(ConfirmDialog, {
      width: '400px',
      data: {
        title: 'Supprimer le terrain',
        message: `Supprimer "${terrain.nomAffichage}" ? Cette action est irréversible.`,
        confirmLabel: 'Supprimer'
      },
    });

    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.terrainSvc.delete(terrain.id).subscribe({
        next: () => {
          this.terrains.update(list => list.filter(t => t.id !== terrain.id));
          this.snackBar.open(`"${terrain.nomAffichage}" supprimé`, 'Fermer', {
            duration: 3000,
          });
        },
        error: (err) => {
          const msg = err.error?.message ?? 'Erreur lors de la suppression';
          this.snackBar.open(msg, 'Fermer', {
            duration: 4000,
            panelClass: ['error-snackbar'],
          });
        }
      });
    });
  }


}
