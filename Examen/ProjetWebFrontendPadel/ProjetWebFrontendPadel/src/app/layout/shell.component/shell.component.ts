import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../core/services/auth-service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-shell.component',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
})
export class ShellComponent {

  readonly authSvc = inject(AuthService);
  private breakpointObserver = inject(BreakpointObserver);

  sidenavOpen = signal(false);
  isMobile = signal(false);

  navItems = signal([
    { label: 'Dashboard',  icon: 'dashboard',     route: '/dashboard',  adminOnly: true  },
    { label: 'Matchs',     icon: 'sports_tennis', route: '/matchs',     adminOnly: false },
    { label: 'Sites',      icon: 'location_city', route: '/sites',      adminOnly: false  },
    { label: 'Terrains',   icon: 'grid_view',     route: '/terrains',   adminOnly: false  },
    { label: 'Membres',    icon: 'group',         route: '/membres',    adminOnly: true  },
  ]);

  constructor() {
    this.breakpointObserver
      .observe([Breakpoints.Handset])
      .subscribe(r => this.isMobile.set(r.matches));
  }
}
