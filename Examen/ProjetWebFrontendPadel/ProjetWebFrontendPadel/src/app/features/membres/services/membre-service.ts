import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Membre, MembreRequest, MembreSearchResponse, TypeMembre } from '../models/membre.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MembreService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/v1/membres';

  findAll(params?: { search?: string; type?: TypeMembre; siteId?: number }): Observable<Membre[]> {
    let httpParams = new HttpParams();
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.type)   httpParams = httpParams.set('type',   params.type);
    if (params?.siteId) httpParams = httpParams.set('siteId', params.siteId);
    return this.http.get<Membre[]>(this.apiUrl, { params: httpParams });
  }

  findById(id: number): Observable<Membre> {
    return this.http.get<Membre>(`${this.apiUrl}/${id}`);
  }

  findAvecSoldeImpaye(): Observable<Membre[]> {
    return this.http.get<Membre[]>(`${this.apiUrl}/soldes-impayes`);
  }

  searchForInvitation(q: string = ''): Observable<MembreSearchResponse[]> {
    const params = new HttpParams().set('q', q);
    return this.http.get<MembreSearchResponse[]>(
      `${this.apiUrl}/search-invitation`,
      { params }
    );
  }

  create(request: MembreRequest): Observable<Membre> {
    return this.http.post<Membre>(this.apiUrl, request);
  }

  update(id: number, request: MembreRequest): Observable<Membre> {
    return this.http.put<Membre>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Règle le solde impayé du membre (paiement direct).
   * Retourne le montant réglé.
   */
  payerSolde(membreId: number): Observable<{ message: string; montantRegle: number }> {
    return this.http.post<{ message: string; montantRegle: number }>(
      `${this.apiUrl}/${membreId}/payer-solde`,
      {}
    );
  }

}
