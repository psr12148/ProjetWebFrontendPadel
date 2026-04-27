import {Component, inject, Input, OnInit, signal} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatDividerModule} from '@angular/material/divider';
import {ActivatedRoute, Router} from '@angular/router';
import {TerrainService} from '../../services/terrain-service';
import {SiteService} from '../../../sites/services/site-service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Site} from '../../../sites/models/site.model';
import {TerrainRequest} from '../../models/terrain.model';

@Component({
  selector: 'app-terrain-form-component',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './terrain-form-component.html',
  styleUrl: './terrain-form-component.css',
})
export class TerrainFormComponent implements OnInit {
  @Input() id?: string;

  readonly router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private terrainSvc = inject(TerrainService)
  private siteSvc = inject(SiteService);
  private snackBar = inject(MatSnackBar);

  submitting = signal(false);
  isEditMode = signal(false);
  sites = signal<Site[]>([])

  form = this.fb.group({
    siteId: [null as number | null, Validators.required],
    numero: [1, [Validators.required, Validators.min(1)]],
    nom: ['', Validators.maxLength(50)]
  });

  ngOnInit(): void {
    // charge les sites pour le select
    this.siteSvc.findAll().subscribe(sites => {
      this.sites.set(sites);

      // Pré-selectionne le site passe en queryParam
      const siteId = this.route.snapshot.queryParams['siteId'];
      if (siteId) {
        this.form.get('siteId')?.setValue(+siteId);
      }
    });

    // Mode edition
    if (this.id) {
      this.isEditMode.set(true);
      this.terrainSvc.findById(+this.id).subscribe(terrain => {
        this.form.patchValue({
          siteId: terrain.siteId,
          numero: terrain.numero,
          nom: terrain.nom ?? '',
        });
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    const request: TerrainRequest = {
      siteId: this.form.value.siteId!,
      numero: this.form.value.numero!,
      nom: this.form.value.nom || undefined
    };

    const action$ = this.isEditMode()
      ? this.terrainSvc.update(+this.id!, request)
      : this.terrainSvc.create(request);

    action$.subscribe({
      next: (terrain) => {
        const msg = this.isEditMode()
          ?'Terrain mis à jour'
          :'Terrain créé avec succès'
        this.snackBar.open(msg, 'Fermer', { duration: 3000 });
        this.router.navigate(['/terrains'],
          { queryParams: { siteId: terrain.siteId } });
      },
      error: (err) => {
        this.submitting.set(false);
        const msg = err.error?.message ?? 'Une erreur est survenue';
        this.snackBar.open(msg, 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
      }
    });
  }
}
