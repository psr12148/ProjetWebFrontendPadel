import {Routes} from '@angular/router';

export const TERRAINS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/terrain-list-component/terrain-list-component')
        .then(m => m.TerrainListComponent),
  },
  {
    path: 'nouveau',
    loadComponent: () =>
      import('./components/terrain-form-component/terrain-form-component')
        .then(m => m.TerrainFormComponent),
  },
  {
    path: ':id/modifier',
    loadComponent: () =>
      import('./components/terrain-form-component/terrain-form-component')
        .then(m => m.TerrainFormComponent),
  }
];
