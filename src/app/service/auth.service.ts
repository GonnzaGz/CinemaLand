import { Injectable } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { map, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  isAuthenticated$: Observable<any>;
  userData$: Observable<any>;

  constructor(private oidcSecurityService: OidcSecurityService) {
    this.isAuthenticated$ = this.oidcSecurityService.isAuthenticated$;
    this.userData$ = this.oidcSecurityService.userData$.pipe(
      map((data: any) => data ?? {})
    );
  }

  login() {
    this.oidcSecurityService.authorize();
  }

  logout() {
    window.location.href = 'https://main.d1dbozfv7qh8jl.amplifyapp.com/';
    localStorage.clear();
    sessionStorage.clear();
  }
}
