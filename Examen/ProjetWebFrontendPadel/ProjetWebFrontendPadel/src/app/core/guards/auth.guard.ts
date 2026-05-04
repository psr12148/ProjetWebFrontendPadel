import {CanActivateFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import { AuthService } from '../services/auth-service';
import { catchError, map, of } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Token valide en mémoire → accès direct
  if (authService.hasValidToken()) return true;

  // Sinon tente de récupérer le profil via le token stocké
  return authService.me().pipe(
    map(() => true),
    catchError(() => of(router.createUrlTree(['/auth/login']))),
  );
}
