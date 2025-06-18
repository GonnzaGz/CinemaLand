import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // 👈 ¡Importá esto!

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule], // 👈 Necesario para *ngIf
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  showLogin = true;
  showPassword = {
    login: false,
    register: false,
  };

  toggleForms() {
    this.showLogin = !this.showLogin;
  }

  togglePassword(formType: 'login' | 'register') {
    this.showPassword[formType] = !this.showPassword[formType];
  }
}
