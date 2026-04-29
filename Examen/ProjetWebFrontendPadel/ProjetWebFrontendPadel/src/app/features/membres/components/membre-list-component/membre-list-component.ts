import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MembreService } from '../../services/membre-service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Membre, TypeMembre } from '../../models/membre.model';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-membre-list-component',
  imports: [
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    DecimalPipe,
  ],
  templateUrl: './membre-list-component.html',
  styleUrl: './membre-list-component.css',
})
export class MembreListComponent implements OnInit {
  readonly router = inject(Router);
  private membreSvc = inject(MembreService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  membres = signal<Membre[]>([]);
  loading = signal(false);
  searchQuery = '';
  typeFiltre: TypeMembre | null = null;

  private search$ = new Subject<string>();

  colonnes = ['matricule', 'nom', 'type', 'site', 'statut', 'actions'];

  ngOnInit(): void {
    // S'abonner aux changements de la barre de recherche avec un délai de 300ms
    this.search$.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => this.load());

    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.membreSvc
      .findAll({
        search: this.searchQuery || undefined,
        type: this.typeFiltre || undefined,
      })
      .subscribe({
        next: (membres) => {
          this.membres.set(membres);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onSearch(query: string): void {
    this.search$.next(query);
  }

  onTypeChange(_: TypeMembre | null): void {
    this.load();
  }

  hasFilters(): boolean {
    return !!this.searchQuery || !!this.typeFiltre;
  }

  resetFiltres(): void {
    this.searchQuery = '';
    this.typeFiltre = null;
    this.load();
  }

  typeBadgeClass(type: TypeMembre): string {
    return {
      GLOBAL:
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800',
      SITE: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800',
      LIBRE:
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800',
    }[type];
  }

  onEdit(membre: Membre): void {
    this.router.navigate(['/membres', membre.id, 'modifier']);
  }

  onDelete(membre: Membre): void {
    const ref = this.dialog.open(ConfirmDialog, {
      width: '400px',
      data: {
        title: 'Supprimer le membre',
        message: `Supprimer ${membre.prenom} ${membre.nom} (${membre.matricule}) ?`,
        confirmLabel: 'Supprimer',
      },
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.membreSvc.delete(membre.id).subscribe({
        next: () => {
          this.membres.update((list) => list.filter((m) => m.id !== membre.id));
          this.snackBar.open('Membre supprimé', 'Fermer', { duration: 3000 });
        },
        error: (err) => {
          const msg = err.error?.message ?? 'Erreur lors de la suppression';
          this.snackBar.open(msg, 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar'],
          });
        },
      });
    });
  }
}
