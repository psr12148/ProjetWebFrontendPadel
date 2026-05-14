import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardStats } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {

  private readonly http   = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/v1/dashboard';

  /**
   * Récupère les statistiques du dashboard.
   * Si une date est fournie, retourne les stats de la SEMAINE contenant cette date.
   * Sinon, retourne les stats de la semaine en cours.
   */
  getStats(dateReference?: string): Observable<DashboardStats> {
    let params = new HttpParams();
    if (dateReference) {
      params = params.set('date', dateReference);
    }
    return this.http.get<DashboardStats>(`${this.apiUrl}/stats`, { params });
  }
}
