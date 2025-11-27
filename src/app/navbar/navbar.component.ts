import { Component, inject, HostListener } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { CommonModule } from '@angular/common';
import { ApipeliculasService } from '../service/apipeliculas.service';
import { AuthService } from '../service/auth.service';
import { FavoritosService } from '../service/favoritos.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, FormsModule, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent {
  isAuthenticated$!: any;
  userData$!: any;
  searchTerm = '';
  userData: any = {};
  isAuthenticated!: any;
  favoritosAbierto: boolean = false;
  favoritosCount: number = 0;
  mobileMenuOpen: boolean = false;
  userMenuOpen: boolean = false;
  private favoritosService = inject(FavoritosService);

  constructor(
    private apiMovieService: ApipeliculasService,
    private router: Router,
    private authService: AuthService
  ) {
    this.isAuthenticated$ = this.authService.isAuthenticated$;
    this.userData$ = this.authService.userData$;

    // Suscribirse al estado del panel de favoritos
    this.favoritosService.favoritosAbierto$.subscribe(
      (estado) => (this.favoritosAbierto = estado)
    );

    this.authService.isAuthenticated$.subscribe((data) => {
      console.log('auth', data);
      this.isAuthenticated = data.isAuthenticated;
    });
    this.authService.userData$.subscribe((data) => {
      console.log('userData completo:', data);
      // Extraer los datos del objeto userData si existe
      this.userData = data?.userData || data || {};
      console.log('userData extraído:', this.userData);
    });
  }
  onSearch() {
    this.apiMovieService.getbusquedamultiple(this.searchTerm).subscribe({
      next: (data: any) => {
        if (data.results.length === 0) {
          alert('No se encontraron resultados para la búsqueda');
        } else {
          this.router.navigate(['/pelissearch', this.searchTerm]);
          this.searchTerm = '';
        }
      },
      error: (error) => {
        console.error(error);
      },
    });
  }

  login() {
    this.authService.login();
  }

  logout(): void {
    this.authService.logout();
  }

  comprarEntradas() {
    // if (!this.isAuthenticated) {
    //   alert('Debes iniciar sesión para comprar entradas.');
    //   this.login();
    //   return;
    // }
    // this.router.navigate(['']);
  }

  irAlPerfil() {
    this.router.navigate(['/login']);
  }

  toggleFavoritos() {
    this.favoritosService.toggleFavoritos();
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  toggleUserMenu() {
    this.userMenuOpen = !this.userMenuOpen;
  }

  // Cerrar menús al hacer clic fuera
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const userMenuContainer = target.closest('.user-menu-container');

    if (!userMenuContainer && this.userMenuOpen) {
      this.userMenuOpen = false;
    }
  }

  onSearchKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.onSearch();
    }
  }

  // Cerrar menús al hacer clic fuera
  closeMenus() {
    this.mobileMenuOpen = false;
    this.userMenuOpen = false;
  }

  // Navegar y hacer scroll al inicio
  navigateTo(route: string) {
    const currentUrl = this.router.url.split('?')[0]; // Obtener URL sin query params
    const targetRoute = route === '' ? '/' : '/' + route;

    // Si estamos en la misma ruta, forzar recarga
    if (currentUrl === targetRoute || (currentUrl === '/' && route === '')) {
      // Navegar temporalmente a una ruta dummy y volver
      this.router
        .navigateByUrl('/dummy-route-' + Date.now(), {
          skipLocationChange: true,
        })
        .then(() => {
          this.router.navigate([route]).then(() => {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            setTimeout(() => {
              window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
              document.documentElement.scrollTop = 0;
              document.body.scrollTop = 0;
            }, 0);
          });
        });
    } else {
      // Navegación normal a ruta diferente
      this.router.navigate([route]).then(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      });
    }
    this.closeMenus();
  }
}
