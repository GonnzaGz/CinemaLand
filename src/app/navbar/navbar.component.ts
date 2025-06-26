import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { CommonModule } from '@angular/common';
import { ApipeliculasService } from '../service/apipeliculas.service';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent {
  isAuthenticated$!: any;
  userData$!: any;
  searchTerm = '';
  user!: any;
  isAuthenticated!: any;

  constructor(
    private apiMovieService: ApipeliculasService,
    private router: Router,
    private authService: AuthService
  ) {
    this.isAuthenticated$ = this.authService.isAuthenticated$;
    this.userData$ = this.authService.userData$;

    this.authService.isAuthenticated$.subscribe((data) => {
      console.log('auth', data);
      this.isAuthenticated = data.isAuthenticated;
    });
    this.authService.userData$.subscribe((data) => {
      this.user = data;
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
}
