import {CanActivateFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import { AuthService } from '../services/auth-service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Token valide en mémoire → accès direct
  if (authService.hasValidToken()) return true;

  // Token absent ou expiré → login
  return router.createUrlTree(['/auth/login']);
}
