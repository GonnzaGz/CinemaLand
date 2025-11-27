import { Component, inject } from '@angular/core';
import {
  Router,
  RouterOutlet,
  NavigationEnd,
  NavigationStart,
} from '@angular/router';
import { NavbarComponent } from './navbar/navbar.component';
import { FooterComponent } from './footer/footer.component';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  private readonly oidcSecurityService = inject(OidcSecurityService);
  private readonly router = inject(Router);
  title = 'CinemaLand';

  ngOnInit(): void {
    this.oidcSecurityService
      .checkAuth()
      .subscribe(({ isAuthenticated, userData }) => {
        console.log('¿Autenticado?', isAuthenticated);
        console.log('Usuario:', userData);
      });

    // Scroll al inicio en cada navegación (incluso si es la misma ruta)
    this.router.events
      .pipe(
        filter(
          (event) =>
            event instanceof NavigationStart || event instanceof NavigationEnd
        )
      )
      .subscribe((event) => {
        if (event instanceof NavigationEnd) {
          // Scroll inmediato
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

          // Scroll con timeout por si hay animaciones
          setTimeout(() => {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
          }, 0);
        }
      });
  }
}
