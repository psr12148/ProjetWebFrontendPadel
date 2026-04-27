import {inject, Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {Terrain, TerrainRequest} from '../models/terrain.model';
import {HttpClient, HttpParams} from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class TerrainService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/v1/terrains';

  findBySite(siteId: number): Observable<Terrain[]> {
    const params = new HttpParams().set('siteId', siteId);
    return this.http.get<Terrain[]>(this.apiUrl, { params });
  }

  findById(id: number): Observable<Terrain> {
    return this.http.get<Terrain>(`${this.apiUrl}/${id}`);
  }

  findDisponibles(siteId: number, dateHeure: string): Observable<Terrain[]> {
    const params = new HttpParams()
      .set('siteId', siteId)
      .set('dateHeure', dateHeure);
    return this.http.get<Terrain[]>(`${this.apiUrl}/disponibles`, { params });
  }

  create(request: TerrainRequest): Observable<Terrain> {
    return this.http.post<Terrain>(this.apiUrl, request);
  }

  update(id: number, request: TerrainRequest): Observable<Terrain> {
    return this.http.put<Terrain>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

}
