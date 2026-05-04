import {HttpErrorResponse, HttpInterceptorFn} from '@angular/common/http';
import {inject} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import {catchError, throwError} from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {

  const snakBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      switch (error.status) {
        case 403:
          snakBar.open('Accès refusé', 'Fermer', { duration: 4000 });
          break;
        case 422:
          // BusinessException (règles métier) - géré dans chaque composant
          break;
        case 500:
          snakBar.open('Erreur serveur - Veuillez réessayer.', 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          break;
      }
      return throwError(() => error);
    }),
  );
}
