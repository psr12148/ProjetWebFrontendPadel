import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatchListComponent } from './match-list.component';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { MatchService } from '../../services/match-service';
import { SiteService } from '../../../sites/services/site-service';
import { AuthService } from '../../../../core/services/auth-service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Match } from '../../models/match.model';

describe('MatchListComponent', () => {
  let component: MatchListComponent;
  let fixture: ComponentFixture<MatchListComponent>;

  let matchServiceSpy: any;
  let siteServiceSpy: any;
  let authServiceSpy: any;
  let snackBarSpy: any;
  let router: Router;

  // queryParams simulés ; on les modifie avant createComponent selon le test
  let queryParams: Record<string, string> = {};

  function setup(): void {
    fixture = TestBed.createComponent(MatchListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();  // déclenche ngOnInit
  }

  beforeEach(async () => {

    queryParams = {};

    siteServiceSpy = {
      findAll: vi.fn().mockReturnValue(of([{ id: 1, nom: 'Padel Club EPHEC' }])),
    };

    matchServiceSpy = {
      findByMembre: vi.fn().mockReturnValue(of([])),
      findBySiteAndDate: vi.fn().mockReturnValue(of([])),
      findPublicsDisponibles: vi.fn().mockReturnValue(of([])),
      rejoindreMatchPublic: vi.fn().mockReturnValue(of({})),
    };

    authServiceSpy = {
      getMembreId: vi.fn().mockReturnValue(2),
    };

    snackBarSpy = {
      open: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [MatchListComponent],
      providers: [
        provideRouter([]),
        provideNativeDateAdapter(),
        { provide: MatchService, useValue: matchServiceSpy },
        { provide: SiteService, useValue: siteServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: new Proxy({}, {
                get: (_t, prop: string) => queryParams[prop],
              }),
            },
          },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    /*
    fixture = TestBed.createComponent(MatchListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
     */
  });

  // --- TEST 1 : création + chargement initial ---
  it('devrait créer le composant et charger les sites au démarrage', () => {
    setup();
    expect(component).toBeTruthy();
    expect(siteServiceSpy.findAll).toHaveBeenCalled();
    expect(component.sites().length).toBe(1);
  });

  // --- TEST 2 : sans queryParams -> vue "mes-matchs" -> findByMembre ---
  it('devrait charger les matchs du membre quand il n\'y a pas de filtre', () => {
    setup();
    expect(component.vue()).toBe('mes-matchs');
    expect(authServiceSpy.getMembreId).toHaveBeenCalled();
    expect(matchServiceSpy.findByMembre).toHaveBeenCalledWith(2);
  });

  // --- TEST 3 : queryParams terrainId -> passe en vue "terrain" ---
  it('devrait passer en vue "terrain" quand un terrainId est dans l\'URL', () => {
    queryParams = { terrainId: '5', siteId: '1' };
    setup();

    expect(component.vue()).toBe('terrain');
    expect(component.terrainIdFiltre).toBe(5);
    expect(component.siteIdFiltre).toBe(1);
    expect(matchServiceSpy.findBySiteAndDate).toHaveBeenCalled();
  });

  // --- TEST 4 : filtrage local par terrainId ---
  it('devrait filtrer les matchs par terrainId cote client', () => {
    queryParams = { terrainId: '5', siteId: '1' };
    matchServiceSpy.findBySiteAndDate.mockReturnValue(of([
      { id: 1, terrainId: 5 } as Match,
      { id: 2, terrainId: 9 } as Match,
    ]));
    setup();

    expect(component.matches().length).toBe(1);
    expect(component.matches()[0].id).toBe(1);
  });

  // --- TEST 5 : onNouveauMatch transmet les bons queryParams ---
  it('onNouveauMatch doit naviguer en transmettant siteId et terrainId', () => {
    queryParams = { terrainId: '5', siteId: '1' };
    setup();

    component.onNouveauMatch();

    expect(router.navigate).toHaveBeenCalledWith(
      ['/matchs/nouveau'],
      { queryParams: { terrainId: 5, siteId: 1 } }
    );
  });

  // --- TEST 6 : onRejoindre appelle le service et navigue ---
  it('onRejoindre doit rejoindre le match puis naviguer vers son detail', () => {
    setup();
    const match = { id: 42 } as Match;

    component.onRejoindre(match);

    expect(matchServiceSpy.rejoindreMatchPublic).toHaveBeenCalledWith(42, 2);
    expect(router.navigate).toHaveBeenCalledWith(['/matchs', 42]);
  });

  // --- TEST 7 : helper statutLabel ---
  it('statutLabel doit traduire les statuts en francais', () => {
    setup();
    expect(component.statutLabel('EN_ATTENTE')).toBe('En attente');
    expect(component.statutLabel('CONFIRME')).toBe('Confirmé');
    expect(component.statutLabel('ANNULE')).toBe('Annulé');
  });

});
