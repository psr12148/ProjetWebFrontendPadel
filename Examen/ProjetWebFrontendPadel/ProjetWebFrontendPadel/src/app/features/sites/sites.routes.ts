import {Routes} from '@angular/router';

export const SITES_ROUTES : Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/site-list.component/site-list.component')
        .then(m => m.SiteListComponent),
  },
  {
    path: 'nouveau',
    loadComponent: () =>
      import('./components/site-form-component/site-form-component')
        .then(m => m.SiteFormComponent),
  },
  {
    path: ':id/modifier',
    loadComponent: () =>
      import('./components/site-form-component/site-form-component')
        .then(m => m.SiteFormComponent),
  }
  ]
