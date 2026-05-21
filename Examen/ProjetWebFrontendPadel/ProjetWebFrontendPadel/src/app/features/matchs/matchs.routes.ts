import { Routes } from '@angular/router';

export const MATCHS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/match-list.component/match-list.component')
        .then(m => m.MatchListComponent),
  },
  {
    path: 'nouveau',
    loadComponent: () =>
      import('./components/match-form.component/match-form.component')
        .then(m => m.MatchFormComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/match-detail.component/match-detail.component')
        .then(m => m.MatchDetailComponent),
  },
];

