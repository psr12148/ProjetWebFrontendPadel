import { Component, inject, OnInit, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MembreService } from '../../services/membre-service';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { MembreSearchResponse } from '../../models/membre.model';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/**
 * Données passées au dialog par le composant parent.
 * - participantsExistants : IDs des membres déjà inscrits (pour les filtrer de la liste)
 */
export interface InviterJoueurDialogData {
  participantsExistants: number[];
}

@Component({
  selector: 'app-inviter-joueur-dialog.component',
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './inviter-joueur-dialog.component.html',
  styleUrl: './inviter-joueur-dialog.component.css',
})
export class InviterJoueurDialogComponent implements OnInit {

  private dialogRef    = inject(MatDialogRef<InviterJoueurDialogComponent>);
  private data         = inject<InviterJoueurDialogData>(MAT_DIALOG_DATA);
  private membreSvc    = inject(MembreService);

  recherche            = '';
  membres              = signal<MembreSearchResponse[]>([]);
  loading              = signal(false);
  rechercheEffectuee   = signal(false);

  private recherche$ = new Subject<string>();

  ngOnInit(): void {
    // Recherche initiale (chargement de tous les membres au démarrage)
    this.rechercher('');

    // Pipeline de recherche avec debounce
    this.recherche$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => {
        this.loading.set(true);
        return this.membreSvc.searchForInvitation(q);
      })
    ).subscribe({
      next: (res) => {
        this.membres.set(this.filtrerExistants(res));
        this.rechercheEffectuee.set(true);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  /** Déclenché à chaque frappe clavier */
  onRechercheChange(q: string): void {
    this.recherche$.next(q);
  }

  /** Premier chargement direct (sans debounce) */
  private rechercher(q: string): void {
    this.loading.set(true);
    this.membreSvc.searchForInvitation(q).subscribe({
      next: (res) => {
        this.membres.set(this.filtrerExistants(res));
        this.rechercheEffectuee.set(true);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  /**
   * Retire les membres déjà inscrits au match de la liste affichée
   * pour éviter de proposer un joueur qui est déjà dedans.
   */
  private filtrerExistants(membres: MembreSearchResponse[]): MembreSearchResponse[] {
    const existants = new Set(this.data.participantsExistants);
    return membres.filter(m => !existants.has(m.id));
  }

  /** L'utilisateur a cliqué sur un membre → ferme le dialog avec ce membre */
  choisir(membre: MembreSearchResponse): void {
    this.dialogRef.close(membre);
  }

  annuler(): void {
    this.dialogRef.close();
  }


}
