import { Routes } from '@angular/router';

export const routes: Routes = [

  // Redirection racine
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },

  // Auth (pas de guard - accessible sans être connecté)

  /*
    // Auth (pas de guard — accessible sans être connecté)
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },

  // Shell principal (layout avec sidenav) — protégé
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/shell/shell.component').then(m => m.ShellComponent),
    children: [

      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },

      // Gestion des sites (admin)
      {
        path: 'sites',
        canActivate: [adminGuard],
        loadChildren: () =>
          import('./features/sites/sites.routes').then(m => m.SITES_ROUTES),
      },

      // Gestion des terrains (admin)
      {
        path: 'terrains',
        canActivate: [adminGuard],
        loadChildren: () =>
          import('./features/terrains/terrains.routes').then(m => m.TERRAINS_ROUTES),
      },

      // Gestion des membres (admin)
      {
        path: 'membres',
        canActivate: [adminGuard],
        loadChildren: () =>
          import('./features/membres/membres.routes').then(m => m.MEMBRES_ROUTES),
      },

      // Réservations (tous les membres connectés)
      {
        path: 'reservations',
        loadChildren: () =>
          import('./features/reservations/reservations.routes').then(m => m.RESERVATIONS_ROUTES),
      },

      // Matchs (tous les membres connectés)
      {
        path: 'matchs',
        loadChildren: () =>
          import('./features/matchs/matchs.routes').then(m => m.MATCHS_ROUTES),
      },

    ],
  },

  // 404
  {
    path: '**',
    loadComponent: () =>
      import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent),
  },

  */

];
