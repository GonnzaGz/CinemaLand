import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  // Propiedades para descuentos sociales
  tieneDiscapacidad = false;
  esSectorVulnerable = false;
  archivoDiscapacidad: File | null = null;
  archivoVulnerabilidad: File | null = null;
  tieneDescuentoActivo = false;

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

        // Cargar descuentos guardados del localStorage
        if (isAuthenticated) {
          this.loadDiscountSettings();
        }
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

    // Limpiar descuentos al cerrar sesión
    this.clearDiscountSettings();

    // Redirección completa a Cognito logout
    const logoutUrl =
      'https://us-east-1_3HspZNy7e.auth.us-east-1.amazoncognito.com/logout' +
      '?client_id=1v91jckl7411lmtn3r1k0m664p' +
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

  // Gestión de descuentos
  onDiscountChange(): void {
    this.updateDiscountStatus();
    this.saveDiscountSettings();
  }

  onFileSelected(event: Event, type: 'discapacidad' | 'vulnerabilidad'): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0] || null;

    if (file) {
      // Validar tipo de archivo
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];

      if (!allowedTypes.includes(file.type)) {
        alert('Por favor, selecciona un archivo PDF, DOC o DOCX válido.');
        target.value = '';
        return;
      }

      // Validar tamaño (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert('El archivo no puede superar los 5MB.');
        target.value = '';
        return;
      }

      // Asignar archivo
      if (type === 'discapacidad') {
        this.archivoDiscapacidad = file;
      } else {
        this.archivoVulnerabilidad = file;
      }

      this.updateDiscountStatus();
      this.saveDiscountSettings();

      console.log(`Archivo ${type} cargado:`, file.name);
    }
  }

  private updateDiscountStatus(): void {
    // Verificar si tiene derecho a descuento
    const tieneDescuentoDiscapacidad =
      this.tieneDiscapacidad && this.archivoDiscapacidad !== null;
    const tieneDescuentoVulnerabilidad =
      this.esSectorVulnerable && this.archivoVulnerabilidad !== null;

    this.tieneDescuentoActivo =
      tieneDescuentoDiscapacidad || tieneDescuentoVulnerabilidad;

    // Guardar en localStorage para uso global
    localStorage.setItem(
      'descuentoSocial',
      JSON.stringify({
        activo: this.tieneDescuentoActivo,
        porcentaje: 15,
        tipo: tieneDescuentoDiscapacidad ? 'discapacidad' : 'vulnerabilidad',
        fecha: new Date().toISOString(),
      })
    );

    console.log('Estado descuento actualizado:', this.tieneDescuentoActivo);
  }

  private saveDiscountSettings(): void {
    const settings = {
      tieneDiscapacidad: this.tieneDiscapacidad,
      esSectorVulnerable: this.esSectorVulnerable,
      archivoDiscapacidad: this.archivoDiscapacidad
        ? {
            name: this.archivoDiscapacidad.name,
            size: this.archivoDiscapacidad.size,
            type: this.archivoDiscapacidad.type,
          }
        : null,
      archivoVulnerabilidad: this.archivoVulnerabilidad
        ? {
            name: this.archivoVulnerabilidad.name,
            size: this.archivoVulnerabilidad.size,
            type: this.archivoVulnerabilidad.type,
          }
        : null,
    };

    localStorage.setItem('configDescuentos', JSON.stringify(settings));
  }

  private loadDiscountSettings(): void {
    const saved = localStorage.getItem('configDescuentos');
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        this.tieneDiscapacidad = settings.tieneDiscapacidad || false;
        this.esSectorVulnerable = settings.esSectorVulnerable || false;

        // Simular archivos cargados (en una app real, se guardarían en el servidor)
        if (settings.archivoDiscapacidad) {
          this.archivoDiscapacidad = new File(
            [''],
            settings.archivoDiscapacidad.name,
            {
              type: settings.archivoDiscapacidad.type,
            }
          );
        }
        if (settings.archivoVulnerabilidad) {
          this.archivoVulnerabilidad = new File(
            [''],
            settings.archivoVulnerabilidad.name,
            {
              type: settings.archivoVulnerabilidad.type,
            }
          );
        }

        this.updateDiscountStatus();
      } catch (error) {
        console.error('Error cargando configuración de descuentos:', error);
      }
    }
  }

  private clearDiscountSettings(): void {
    this.tieneDiscapacidad = false;
    this.esSectorVulnerable = false;
    this.archivoDiscapacidad = null;
    this.archivoVulnerabilidad = null;
    this.tieneDescuentoActivo = false;

    localStorage.removeItem('configDescuentos');
    localStorage.removeItem('descuentoSocial');
  }
}
