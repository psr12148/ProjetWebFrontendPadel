import { Routes } from '@angular/router';

export const MEMBRES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/membre-list-component/membre-list-component')
        .then(m => m.MembreListComponent),
  },
  {
    path: 'nouveau',
    loadComponent: () =>
      import('./components/membre-form-component/membre-form-component')
        .then(m => m.MembreFormComponent),
  },
  {
    path: ':id/modifier',
    loadComponent: () =>
      import('./components/membre-form-component/membre-form-component')
        .then(m => m.MembreFormComponent),
  },
];
