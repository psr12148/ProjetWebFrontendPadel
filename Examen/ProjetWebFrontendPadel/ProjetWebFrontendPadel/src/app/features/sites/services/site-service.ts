import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Site, SiteRequest} from '../models/site.model';

@Injectable({
  providedIn: 'root',
})
export class SiteService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/v1/sites';

  findAll(): Observable<Site[]> {
    return this.http.get<Site[]>(this.apiUrl);
  }

  findById(id: number): Observable<Site> {
    return this.http.get<Site>(`${this.apiUrl}/${id}`);
  }

  seach(query: string): Observable<Site[]> {
    const params = new HttpParams().set('search', query);
    return this.http.get<Site[]>(this.apiUrl, {params});
  }

  findSitesOuverts(date: string): Observable<Site[]> {
    const params = new HttpParams().set('date', date);
    return this.http.get<Site[]>(`${this.apiUrl}/ouverts`, {params});
  }

  create(request: SiteRequest): Observable<Site> {
    return this.http.post<Site>(this.apiUrl, request);
  }

  update(id: number, request: SiteRequest): Observable<Site> {
    return this.http.put<Site>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

}
