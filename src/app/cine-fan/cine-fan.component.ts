import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService, CartProduct, Order } from '../service/cart.service';
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

  // Planes de membresía disponibles
  membershipPlans: { [key: string]: MembershipPlan } = {
    black: {
      id: 'cine-fan-black',
      name: 'CINE FAN BLACK',
      price: 4999,
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
      price: 2999,
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
      price: 1499,
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

  constructor(private cartService: CartService) {}

  ngOnInit(): void {}

  addToCart(planType: string): void {
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
    this.showCheckoutModal = true;
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
