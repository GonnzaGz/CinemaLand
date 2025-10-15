import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService, CartProduct, Order } from '../service/cart.service';
import { UnifiedCheckoutComponent } from '../unified-checkout/unified-checkout.component';

interface GiftPackage {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
}

@Component({
  selector: 'app-regala-cine',
  standalone: true,
  imports: [CommonModule, UnifiedCheckoutComponent],
  templateUrl: './regala-cine.component.html',
  styleUrl: './regala-cine.component.css',
})
export class RegalaCineComponent implements OnInit {
  showCheckoutModal = false;

  // Paquetes de regalo disponibles
  giftPackages: { [key: string]: GiftPackage } = {
    basica: {
      id: 'gift-basica',
      name: 'Experiencia Básica',
      price: 3500,
      description: '2 entradas + combo básico',
      features: [
        '2 entradas para cualquier función',
        '1 combo básico (pochoclos + bebida)',
        'Válido por 6 meses',
        'Voucher digital personalizado',
      ],
    },
    premium: {
      id: 'gift-premium',
      name: 'Experiencia Premium',
      price: 6500,
      description: '4 entradas premium + combo deluxe',
      features: [
        '4 entradas premium (incluye IMAX/XD)',
        'Combo premium + snacks especiales',
        'Butacas comfort disponibles',
        'Merchandising exclusivo',
        'Válido por 1 año',
      ],
    },
    familiar: {
      id: 'gift-familiar',
      name: 'Experiencia Familiar',
      price: 9500,
      description: '6 entradas + combo familiar XXL',
      features: [
        '6 entradas para toda la familia',
        'Combo familiar XXL',
        'Acceso a sala de juegos',
        '20% descuento en próximas compras',
        'Válido por 1 año',
        'Invitaciones a estrenos especiales',
      ],
    },
    anual: {
      id: 'gift-anual',
      name: 'Membresía Anual',
      price: 15000,
      description: 'Acceso ilimitado por 1 año',
      features: [
        'Entradas ilimitadas durante 1 año',
        'Descuentos en confitería',
        'Acceso prioritario a estrenos',
        'Sala VIP incluida',
        'Estacionamiento gratuito',
        'Renovación automática con descuento',
      ],
    },
    romantico: {
      id: 'gift-romantico',
      name: 'Paquete Romántico',
      price: 8500,
      description: '2 entradas VIP + cena romántica',
      features: [
        '2 entradas VIP',
        'Butacas premium de pareja',
        'Cena romántica incluida',
        'Copa de champagne',
        'Válido por 6 meses',
      ],
    },
    cumpleanos: {
      id: 'gift-cumpleanos',
      name: 'Fiesta de Cumpleaños',
      price: 12000,
      description: 'Sala privada + decoración + torta',
      features: [
        'Sala privada para hasta 15 personas',
        'Decoración temática',
        'Torta de cumpleaños',
        'Combo de confitería para todos',
        'Proyección de película a elección',
        'Fotografías del evento',
      ],
    },
  };

  constructor(private cartService: CartService) {}

  ngOnInit(): void {}

  addToCart(packageType: string): void {
    const giftPackage = this.giftPackages[packageType];
    if (!giftPackage) return;

    const cartProduct: CartProduct = {
      id: giftPackage.id,
      name: giftPackage.name,
      description: giftPackage.description,
      price: giftPackage.price,
      image: '/assets/images/gift-card.jpg',
      category: 'gift',
      type: packageType,
      metadata: {
        features: giftPackage.features,
        isGift: true,
        validityMonths: packageType === 'basica' ? 6 : 12,
      },
    };

    this.cartService.addToCart(cartProduct, 1, {
      features: giftPackage.features,
      packageType: packageType,
      isGiftPurchase: true,
    });
    this.showCheckoutModal = true;
  }

  closeCheckoutModal(): void {
    this.showCheckoutModal = false;
  }

  onOrderCompleted(order: Order): void {
    console.log('Regalo completado:', order);
    this.showCheckoutModal = false;

    // Aquí puedes agregar lógica adicional como:
    // - Generar certificado de regalo
    // - Enviar email al destinatario
    // - Crear código de regalo
    alert(
      '¡Regalo procesado exitosamente! Se enviará la información por email.'
    );
  }

  onOrderFailed(error: string): void {
    console.error('Error en regalo:', error);
    alert('Error al procesar el regalo. Por favor intenta nuevamente.');
  }
}
