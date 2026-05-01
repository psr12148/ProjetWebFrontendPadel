import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatchFormComponent } from './match-form-component';

import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatchService } from '../../services/match-service';
import { SiteService } from '../../../sites/services/site-service';
import { TerrainService } from '../../../terrains/services/terrain-service';
import { of } from 'rxjs';


describe('MatchFormComponent', () => {
  let component: MatchFormComponent;
  let fixture: ComponentFixture<MatchFormComponent>;

  // Déclaration de nos "faux" services
  let siteServiceSpy: any;
  let terrainServiceSpy: any;
  let matchServiceSpy: any;
  let routerSpy: any;
  let snackBarSpy: any;

  beforeEach(async () => {
    // 2. INITIALISATION FAÇON VITEST (vi.fn())
    siteServiceSpy = {
      // Comportement par défaut défini directement ici
      findAll: vi.fn().mockReturnValue(of([{ id: 1, nom: 'Padel Club' }]))
    };

    terrainServiceSpy = {
      findBySite: vi.fn()
    };

    matchServiceSpy = {
      creerMatch: vi.fn()
    };

    routerSpy = {
      navigate: vi.fn()
    };

    snackBarSpy = {
      open: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [
        MatchFormComponent,
      ],
      providers: [
        { provide: SiteService, useValue: siteServiceSpy },
        { provide: TerrainService, useValue: terrainServiceSpy },
        { provide: MatchService, useValue: matchServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MatchFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Déclenche le ngOnInit()
  });

  // --- TEST 1 : Vérification de la création ---
  it('devrait créer le composant', () => {
    expect(component).toBeTruthy();
  });

  // --- TEST 2 : Le chargement initial (ngOnInit) ---
  it('devrait charger les sites au démarrage', () => {
    expect(siteServiceSpy.findAll).toHaveBeenCalled();
    expect(component.sites().length).toBe(1);
  });

  // --- TEST 3 : La logique de changement de site ---
  it('devrait réinitialiser le terrain et charger la liste quand on change de site', () => {
    // 3. SYNTAXE VITEST : .mockReturnValue()
    terrainServiceSpy.findBySite.mockReturnValue(of([{ id: 10, numero: 1 }]));

    component.form.patchValue({ terrainId: 99 });

    // Action
    component.onSiteChange(1);

    // Vérification
    expect(component.form.get('terrainId')?.value).toBeNull();
    expect(terrainServiceSpy.findBySite).toHaveBeenCalledWith(1);
    expect(component.terrains().length).toBe(1);
  });

  // --- TEST 4 : La validation du formulaire ---
  it('ne devrait PAS appeler le service si le formulaire est invalide', () => {
    component.onSubmit();

    expect(matchServiceSpy.creerMatch).not.toHaveBeenCalled();
    expect(component.form.touched).toBe(true);
  });

  // --- TEST 5 : Le succès de la soumission ---
  it('devrait créer le match et rediriger si le formulaire est valide', () => {
    // SYNTAXE VITEST : .mockReturnValue()
    matchServiceSpy.creerMatch.mockReturnValue(of({ id: 5 }));

    // On remplit parfaitement le formulaire
    component.form.patchValue({
      siteId: 1,
      terrainId: 10,
      dateHeure: '2026-06-15T18:30',
      typeMatch: 'PRIVE'
    });

    // Action
    component.onSubmit();

    // Vérification
    expect(matchServiceSpy.creerMatch).toHaveBeenCalled();

    // 4. SYNTAXE VITEST : expect.any() au lieu de jasmine.any()
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Match créé avec succès !',
      'Fermer',
      expect.any(Object)
    );
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/matchs', 5]);
  });

});
