import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatchFormComponent } from './match-form.component';
import { provideRouter, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatchService } from '../../services/match-service';
import { SiteService } from '../../../sites/services/site-service';
import { TerrainService } from '../../../terrains/services/terrain-service';
import { AuthService } from '../../../../core/services/auth-service'; // Ajouté
import { provideNativeDateAdapter } from '@angular/material/core'; // Ajouté
import { of } from 'rxjs';
import { vi, describe, beforeEach, it, expect } from 'vitest';

describe('MatchFormComponent', () => {
  let component: MatchFormComponent;
  let fixture: ComponentFixture<MatchFormComponent>;

  // Déclaration de nos "faux" services
  let siteServiceSpy: any;
  let terrainServiceSpy: any;
  let matchServiceSpy: any;
  let snackBarSpy: any;
  let authServiceSpy: any;

  // Le vrai Router, sur lequel on espionnera navigate()
  let router: Router;

  beforeEach(async () => {
    // INITIALISATION FAÇON VITEST (vi.fn())
    siteServiceSpy = {
      findAll: vi.fn().mockReturnValue(of([{ id: 1, nom: 'Padel Club' }]))
    };

    terrainServiceSpy = {
      findBySite: vi.fn().mockReturnValue(of([])),
      // chargerCreneaux() peut appeler cette méthode ; on la mock par sécurité
      findCreneauxDisponibles: vi.fn().mockReturnValue(of([])),
    };

    matchServiceSpy = {
      creerMatch: vi.fn()
    };

    snackBarSpy = {
      open: vi.fn()
    };

    // Création du mock pour AuthService
    authServiceSpy = {
      getMembreId: vi.fn().mockReturnValue(5) // On simule l'ID 5 pour l'organisateur
    };

    await TestBed.configureTestingModule({
      imports: [ MatchFormComponent ],
      providers: [
        provideRouter([]),
        provideNativeDateAdapter(), // Obligatoire pour tester un MatDatepicker
        { provide: SiteService, useValue: siteServiceSpy },
        { provide: TerrainService, useValue: terrainServiceSpy },
        { provide: MatchService, useValue: matchServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: AuthService, useValue: authServiceSpy } // Fourni au TestBed !
      ]
    }).compileComponents();

    // On récupère le vrai Router et on espionne juste sa méthode navigate
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(MatchFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // --- TEST 1 : La création du composant ---
  it('devrait créer le composant', () => {
    expect(component).toBeTruthy();
  });

  // --- TEST 2 : Le chargement initial (ngOnInit) ---
  it('devrait charger la liste des sites au démarrage', () => {
    expect(siteServiceSpy.findAll).toHaveBeenCalled();
    expect(component.sites().length).toBe(1);
    expect(component.sites()[0].nom).toBe('Padel Club');
  });

  // --- TEST 3 : Le changement de site ---
  it('devrait charger les terrains et réinitialiser terrainId quand le site change', () => {
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
    // Correction : on vérifie un contrôle spécifique, car form.touched n'est pas fiable sur un FormGroup
    expect(component.form.get('siteId')?.touched).toBe(true);
  });

  // --- TEST 5 : Le succès de la soumission ---
  it('devrait créer le match et rediriger si le formulaire est valide', () => {
    matchServiceSpy.creerMatch.mockReturnValue(of({ id: 5 }));

    component.form.patchValue({
      siteId: 1,
      terrainId: 10,
      date: new Date("2026-06-15"),
      heureDebut: '18:30:00', // Modifié pour matcher la concaténation de DateHeure
      typeMatch: 'PRIVE'
    });

    // Action
    component.onSubmit();

    // Vérification
    expect(matchServiceSpy.creerMatch).toHaveBeenCalled();
    // Vérification de la redirection
    expect(router.navigate).toHaveBeenCalledWith(['/matchs', 5]);
  });
});
