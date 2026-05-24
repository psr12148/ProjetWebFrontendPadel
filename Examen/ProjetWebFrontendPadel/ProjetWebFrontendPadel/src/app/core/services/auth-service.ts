import { inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import { AuthResponse, LoginRequest, RegisterRequest } from '../models/auth.model';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = 'http://localhost:8080/api/v1/auth';

  private readonly TOKEN_KEY = 'padel_token';
  private readonly USER_KEY  = 'padel_user';

  // Signals réactifs
  currentUser = signal<AuthResponse | null>(this.loadUserFromStorage());
  isLoggedIn  = signal<boolean>(this.hasValidToken());
  isAdmin     = signal<boolean>(this.loadUserFromStorage()?.admin ?? false);


  // --- Auth ---

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request).pipe(
      tap(response => this.stockerSession(response)),
    );
  }

  /**
   * Auto-inscription d'un nouveau membre LIBRE.
   * Le backend renvoie directement un token → l'utilisateur est connecté
   * immédiatement après l'inscription (même traitement que login).
   */
  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, request).pipe(
      tap(response => this.stockerSession(response)),
    );
  }

  /**
   * Stocke la session (token + user) et met à jour les signals.
   * Factorisé car login() et register() font exactement la même chose.
   */
  private stockerSession(response: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(response));
    this.currentUser.set(response);
    this.isLoggedIn.set(true);
    this.isAdmin.set(response.admin);
  }


  /**
   * Déconnexion locale (vide le storage et redirige vers login).
   *
   * IMPORTANT — pas d'appel HTTP au backend pour /logout :
   * - Le backend JWT est stateless, il n'a pas de session à invalider
   * - Si on appelle /logout avec un token expiré → 401 → boucle infinie
   *   via auth.interceptor qui rappelle logout()
   *
   * Si vous voulez vraiment notifier le backend (ex. blacklist de tokens),
   * faites-le UNIQUEMENT si le token est encore valide.
   */
  logout(): void {
    // Tentative de logout côté backend UNIQUEMENT si le token est encore valide
    // (évite la boucle 401 → logout → 401 → ...)
    if (this.hasValidToken()) {
      this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
        error: () => { /* on ignore l'erreur, le logout local suffit */ }
      });
    }

    // Logout local — toujours exécuté
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

  /**
   * Vérifie qu'un token JWT est présent ET non expiré.
   *
   * Décodage base64-URL (les JWT utilisent '-' et '_' au lieu de '+' et '/').
   */
  hasValidToken(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;

      // Conversion base64-URL → base64 standard avant atob
      const payloadBase64 = parts[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      // Padding manquant éventuel
      const padding = '='.repeat((4 - payloadBase64.length % 4) % 4);
      const payload = JSON.parse(atob(payloadBase64 + padding));

      // exp en secondes → ms ; vérifie que le token n'est pas expiré
      return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now();
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
