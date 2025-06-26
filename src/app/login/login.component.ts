import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  private readonly oidcSecurityService = inject(OidcSecurityService);

  showLogin = true;
  showPassword = {
    login: false,
    register: false,
  };

  isAuthenticated = false;
  userData$ = this.oidcSecurityService.userData$;

  toggleForms() {
    this.showLogin = !this.showLogin;
  }

  togglePassword(formType: 'login' | 'register') {
    this.showPassword[formType] = !this.showPassword[formType];
  }

  ngOnInit(): void {
    this.oidcSecurityService.isAuthenticated$.subscribe(
      ({ isAuthenticated }) => {
        this.isAuthenticated = isAuthenticated;
        console.log('authenticated:', isAuthenticated);
      }
    );

    this.oidcSecurityService.userData$.subscribe((userData) => {
      console.log(userData);
    });
  }

  login() {
    this.oidcSecurityService.authorize();
  }

  logout(): void {
    if (window.sessionStorage) {
      window.sessionStorage.clear();
    }

    const logoutUrl =
      'https://us-east-18vlqioyla.auth.us-east-1.amazoncognito.com/logout' +
      '?client_id=56dbcjgui1jmvmqvuhmvnu206v' +
      '&logout_uri=' +
      encodeURIComponent(window.location.origin);

    window.location.href = logoutUrl;
  }

  comprarEntradas(): void {
    if (!this.isAuthenticated) {
      alert('Debes iniciar sesión para comprar entradas');
      return;
    }

    alert('Redirigiendo a la compra de entradas...');
  }
}
