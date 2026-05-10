import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [

  // Redirection racine
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },

  // Auth — accessible sans être connecté
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },

  // Shell principal (sidenav + toolbar) — protégé par authGuard
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/shell.component/shell.component').then(m => m.ShellComponent),
    children: [

      // Dashboard — admin uniquement
      // Note : la route reste accessible mais retourne 403 pour les non-admins.
      // Le menu "Dashboard" est déjà caché aux non-admins via adminOnly: true.
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component/dashboard.component').then(m => m.DashboardComponent),
      },

      // Sites — accessibles en LECTURE à tous les membres connectés
      // Les actions write (POST/PUT/DELETE) sont protégées côté backend par
      // SecurityConfig (hasRole("ADMIN")).
      {
        path: 'sites',
        loadChildren: () =>
          import('./features/sites/sites.routes').then(m => m.SITES_ROUTES),
      },

      // Terrains — accessibles en LECTURE à tous les membres connectés
      // Les actions write sont protégées côté backend.
      {
        path: 'terrains',
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
      import('./shared/components/not-found.component/not-found.component').then(m => m.NotFoundComponent),
  }



];
