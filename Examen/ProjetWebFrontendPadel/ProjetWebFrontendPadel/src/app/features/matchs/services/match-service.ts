import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Match, MatchRequest, Participation, ParticipationRequest } from '../models/match.model';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class MatchService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/v1/matchs';

  findById(id: number): Observable<Match> {
    return this.http.get<Match>(`${this.apiUrl}/${id}`);
  }

  findBySiteAndDate(siteId: number, date: string): Observable<Match[]> {
    const params = new HttpParams().set('date', date);
    return this.http.get<Match[]>(`${this.apiUrl}/site/${siteId}`, { params });
  }

  findPublicsDisponibles(): Observable<Match[]> {
    return this.http.get<Match[]>(`${this.apiUrl}/publics`);
  }

  findByMembre(membreId: number): Observable<Match[]> {
    return this.http.get<Match[]>(`${this.apiUrl}/membre/${membreId}`);
  }

  findAllForAdmin(date: string, siteId?: number | null): Observable<Match[]> {
    let params = new HttpParams().set('date', date);
    if (siteId !== null && siteId !== undefined) {
      params = params.set('siteId', siteId);
    }
    return this.http.get<Match[]>(`${this.apiUrl}/admin/semaine`, { params });
  }

  creerMatch(organisateurId: number, request: MatchRequest): Observable<Match> {
    return this.http.post<Match>(
      `${this.apiUrl}/organisateur/${organisateurId}`, request);
  }

  rejoindreMatchPublic(matchId: number, membreId: number): Observable<Participation> {
    return this.http.post<Participation>(
      `${this.apiUrl}/${matchId}/rejoindre/${membreId}`, {});
  }

  ajouterJoueurPrive(
    matchId: number,
    organisateurId: number,
    request: ParticipationRequest): Observable<Participation> {
    return this.http.post<Participation>(
      `${this.apiUrl}/${matchId}/joueurs/organisateur/${organisateurId}`, request);
  }

  payerParticipation(matchId: number, membreId: number): Observable<Participation> {
    return this.http.post<Participation>(
      `${this.apiUrl}/${matchId}/payer/${membreId}`, {});
  }

}
