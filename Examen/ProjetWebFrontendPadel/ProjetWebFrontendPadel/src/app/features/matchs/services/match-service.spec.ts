import { TestBed } from '@angular/core/testing';

import { MatchService } from './match-service';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { Match, MatchRequest } from '../models/match.model';

describe('MatchService', () => {
  let service: MatchService;
  let httpMock: HttpTestingController;

  const apiUrl = 'http://localhost:8080/api/v1/matchs';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MatchService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(MatchService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  // Vérifie qu'aucune requête inattendue n'est restée en attente
  afterEach(() => {
    httpMock.verify();
  });

  // --- TEST 1 : findById ---
  it('findById doit appeler GET /matchs/{id}', () => {
    const fakeMatch = { id: 3, terrainNom: 'Central' } as Match;

    service.findById(3).subscribe(match => {
      expect(match.id).toBe(3);
    });

    const req = httpMock.expectOne(`${apiUrl}/3`);
    expect(req.request.method).toBe('GET');
    req.flush(fakeMatch);
  });

  // --- TEST 2 : findBySiteAndDate (avec query param date) ---
  it('findBySiteAndDate doit appeler GET /matchs/site/{siteId} avec le param date', () => {
    service.findBySiteAndDate(1, '2026-05-21').subscribe(matchs => {
      expect(matchs.length).toBe(0);
    });

    const req = httpMock.expectOne(
      r => r.url === `${apiUrl}/site/1` && r.params.get('date') === '2026-05-21'
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  // --- TEST 3 : findAllForAdmin (param siteId optionnel) ---
  it('findAllForAdmin doit inclure siteId dans les params quand il est fourni', () => {
    service.findAllForAdmin('2026-05-21', 2).subscribe();

    const req = httpMock.expectOne(
      r => r.url === `${apiUrl}/admin/semaine`
        && r.params.get('date') === '2026-05-21'
        && r.params.get('siteId') === '2'
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  // --- TEST 4 : findAllForAdmin SANS siteId (param absent) ---
  it('findAllForAdmin ne doit PAS inclure siteId quand il est null', () => {
    service.findAllForAdmin('2026-05-21', null).subscribe();

    const req = httpMock.expectOne(
      r => r.url === `${apiUrl}/admin/semaine` && !r.params.has('siteId')
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  // --- TEST 5 : creerMatch (POST + body) ---
  it('creerMatch doit envoyer un POST avec le body de la requête', () => {
    const request: MatchRequest = {
      terrainId: 1,
      dateHeure: '2026-05-21T14:00:00',
      typeMatch: 'PUBLIC',
    };
    const created = { id: 9 } as Match;

    service.creerMatch(5, request).subscribe(match => {
      expect(match.id).toBe(9);
    });

    const req = httpMock.expectOne(`${apiUrl}/organisateur/5`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(created);
  });

  // --- TEST 6 : payerParticipation (POST sur la bonne URL) ---
  it('payerParticipation doit appeler POST /matchs/{id}/payer/{membreId}', () => {
    service.payerParticipation(7, 5).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/7/payer/5`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

});
