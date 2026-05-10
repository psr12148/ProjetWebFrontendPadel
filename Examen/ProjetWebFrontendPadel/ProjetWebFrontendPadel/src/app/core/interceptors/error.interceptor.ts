import {HttpErrorResponse, HttpInterceptorFn} from '@angular/common/http';
import {inject} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import {catchError, throwError} from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {

  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      switch (error.status) {
        case 403:
          snackBar.open('Accès refusé', 'Fermer', { duration: 4000 });
          break;
        case 422:
          // BusinessException (règles métier) - géré dans chaque composant
          break;
        case 500:
          snackBar.open('Erreur serveur - Veuillez réessayer.', 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          break;
      }
      return throwError(() => error);
    }),
  );
}
