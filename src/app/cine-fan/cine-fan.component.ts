import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService, CartProduct, Order } from '../service/cart.service';
import { AuthService } from '../service/auth.service';
import { UnifiedCheckoutComponent } from '../unified-checkout/unified-checkout.component';

interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  description: string;
  benefits: string[];
}

@Component({
  selector: 'app-cine-fan',
  standalone: true,
  imports: [CommonModule, UnifiedCheckoutComponent],
  templateUrl: './cine-fan.component.html',
  styleUrl: './cine-fan.component.css',
})
export class CineFanComponent implements OnInit {
  showCheckoutModal = false;
  isAuthenticated = false;
  mensaje: string = '';

  // Planes de membresía disponibles
  membershipPlans: { [key: string]: MembershipPlan } = {
    black: {
      id: 'cine-fan-black',
      name: 'CINE FAN BLACK',
      price: 49990,
      description: '4 entradas mensuales con acceso VIP y máximos beneficios',
      benefits: [
        '4 entradas mensuales (2D, 3D, XD, COMFORT, IMAX)',
        '30% OFF en todos los combos',
        '60% OFF en entradas de lunes a viernes',
        'Acceso VIP y funciones especiales',
        'Regalo de bienvenida premium',
        'Estacionamiento gratuito',
      ],
    },
    plus: {
      id: 'cine-fan-plus',
      name: 'CINE FAN +',
      price: 29990,
      description: '2 entradas mensuales con excelentes beneficios',
      benefits: [
        '2 entradas mensuales (2D, 3D, XD, COMFORT)',
        '25% OFF en combos seleccionados',
        '50% OFF en entradas de lunes a viernes',
        'Regalo de bienvenida',
        'Suma y canjea puntos',
      ],
    },
    fan: {
      id: 'cine-fan',
      name: 'CINE FAN',
      price: 14990,
      description: '1 entrada mensual con beneficios básicos',
      benefits: [
        '1 entrada mensual (2D, 3D, XD, COMFORT)',
        '20% OFF en combos seleccionados',
        '30% OFF en entradas de lunes a viernes',
        'Regalo de bienvenida',
        'Beneficios en Cinemark Store',
      ],
    },
  };

  constructor(
    private cartService: CartService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.isAuthenticated$.subscribe((data) => {
      this.isAuthenticated = data.isAuthenticated;
    });
  }

  addToCart(planType: string): void {
    // Verificar autenticación
    if (!this.isAuthenticated) {
      this.mensaje = 'Debes iniciar sesión para suscribirte a un plan';
      setTimeout(() => {
        this.mensaje = '';
      }, 5000);
      return;
    }

    const plan = this.membershipPlans[planType];
    if (!plan) return;

    const cartProduct: CartProduct = {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      image: '/assets/images/membership-card.jpg',
      category: 'membership',
      type: planType,
      metadata: {
        benefits: plan.benefits,
        duration: '1 mes',
        autoRenew: true,
      },
    };

    this.cartService.addToCart(cartProduct, 1, {
      benefits: plan.benefits,
      planType: planType,
    });
    this.showNotification(`${plan.name} agregado al carrito`);
    this.showCheckoutModal = true;
  }

  showNotification(message: string): void {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: #28a745;
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      z-index: 10001;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
      animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }

  closeCheckoutModal(): void {
    this.showCheckoutModal = false;
  }

  onOrderCompleted(order: Order): void {
    console.log('Suscripción completada:', order);
    this.showCheckoutModal = false;

    // Aquí puedes agregar lógica adicional como:
    // - Enviar email de confirmación
    // - Activar la membresía
    // - Redirigir a página de éxito
    alert('¡Suscripción activada exitosamente!');
  }

  onOrderFailed(error: string): void {
    console.error('Error en suscripción:', error);
    alert('Error al procesar la suscripción. Por favor intenta nuevamente.');
  }
}
