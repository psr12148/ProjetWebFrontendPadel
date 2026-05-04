import { inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import { AuthResponse, LoginRequest } from '../models/auth.model';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = 'http://localhost:8080/api/auth';

  private readonly TOKEN_KEY = 'padel_token';
  private readonly USER_KEY  = 'padel_user';

  // Signals réactifs
  currentUser = signal<AuthResponse | null>(this.loadUserFromStorage());
  isLoggedIn  = signal<boolean>(this.hasValidToken());
  isAdmin     = signal<boolean>(this.loadUserFromStorage()?.admin ?? false);


  // --- Auth ---

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request).pipe(
      tap(response => {
        localStorage.setItem(this.TOKEN_KEY, response.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(response));
        this.currentUser.set(response);
        this.isLoggedIn.set(true);
        this.isAdmin.set(response.admin);
      }),
    );
  }

  logout(): void {
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe();
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.isLoggedIn.set(false);
    this.isAdmin.set(false);
    this.router.navigate(['/auth/login']);
  }

  me(): Observable<AuthResponse> {
    return this.http.get<AuthResponse>(`${this.apiUrl}/me`).pipe(
      tap(user => {
        this.currentUser.set(user);
        this.isLoggedIn.set(true);
        this.isAdmin.set(user.admin);
      }),
    );
  }

  isAuthenticated(): boolean {
    return this.hasValidToken();
  }


  // --- Helpers ---

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getMembreId(): number | null {
    return this.currentUser()?.membreId ?? null;
  }

  hasValidToken(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  private loadUserFromStorage(): AuthResponse | null {
    const raw = localStorage.getItem(this.USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }
}
