import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

// Interfaces unificadas para todos los productos
export interface CartProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'movie-ticket' | 'candy' | 'store' | 'membership' | 'gift';
  type?: string; // Para diferenciar entre diferentes tipos de productos
  metadata?: any; // Para información específica como sala, asientos, etc.
}

export interface CartItem {
  id: string;
  product: CartProduct;
  quantity: number;
  addedAt: Date;
  specificData?: any; // Para datos específicos como fecha de función, asientos, etc.
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  postalCode?: string;
  documentType?: string;
  documentNumber?: string;
}

export interface PaymentInfo {
  method: 'credit-card' | 'mercado-pago' | 'cash-pickup';
  cardName?: string;
  cardNumber?: string;
  cardExpiry?: string;
  cardCvv?: string;
  billingAddress?: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  customerInfo: CustomerInfo;
  paymentInfo: PaymentInfo;
  total: number;
  subtotal: number;
  discount: number;
  promoCode?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: Date;
  pickupLocation?: string; // Para pago en mostrador
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly STORAGE_KEY = 'cinemaland_cart';
  private readonly CUSTOMER_KEY = 'cinemaland_customer';
  private readonly PAYMENT_KEY = 'cinemaland_payment';

  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  private customerInfoSubject = new BehaviorSubject<CustomerInfo | null>(null);
  private paymentInfoSubject = new BehaviorSubject<PaymentInfo | null>(null);

  public cart$ = this.cartSubject.asObservable();
  public customerInfo$ = this.customerInfoSubject.asObservable();
  public paymentInfo$ = this.paymentInfoSubject.asObservable();

  constructor() {
    this.loadFromStorage();
  }

  // Métodos del carrito
  addToCart(
    product: CartProduct,
    quantity: number = 1,
    specificData?: any
  ): void {
    const currentCart = this.cartSubject.value;
    const itemId = this.generateItemId(product, specificData);

    const existingItemIndex = currentCart.findIndex(
      (item) => item.id === itemId
    );

    if (existingItemIndex > -1) {
      // Si el item ya existe, incrementar cantidad
      currentCart[existingItemIndex].quantity += quantity;
    } else {
      // Agregar nuevo item
      const newItem: CartItem = {
        id: itemId,
        product,
        quantity,
        addedAt: new Date(),
        specificData,
      };
      currentCart.push(newItem);
    }

    this.updateCart(currentCart);
  }

  updateQuantity(itemId: string, quantity: number): void {
    const currentCart = this.cartSubject.value;
    const itemIndex = currentCart.findIndex((item) => item.id === itemId);

    if (itemIndex > -1) {
      if (quantity <= 0) {
        this.removeFromCart(itemId);
      } else {
        currentCart[itemIndex].quantity = quantity;
        this.updateCart(currentCart);
      }
    }
  }

  removeFromCart(itemId: string): void {
    const currentCart = this.cartSubject.value;
    const updatedCart = currentCart.filter((item) => item.id !== itemId);
    this.updateCart(updatedCart);
  }

  clearCart(): void {
    this.updateCart([]);
  }

  getCart(): CartItem[] {
    return this.cartSubject.value;
  }

  getCartItemCount(): number {
    return this.cartSubject.value.reduce(
      (total, item) => total + item.quantity,
      0
    );
  }

  getCartTotal(): number {
    return this.cartSubject.value.reduce((total, item) => {
      return total + item.product.price * item.quantity;
    }, 0);
  }

  getCartByCategory(category: string): CartItem[] {
    return this.cartSubject.value.filter(
      (item) => item.product.category === category
    );
  }

  // Métodos de información del cliente
  updateCustomerInfo(customerInfo: CustomerInfo): void {
    this.customerInfoSubject.next(customerInfo);
    sessionStorage.setItem(this.CUSTOMER_KEY, JSON.stringify(customerInfo));
  }

  getCustomerInfo(): CustomerInfo | null {
    return this.customerInfoSubject.value;
  }

  clearCustomerInfo(): void {
    this.customerInfoSubject.next(null);
    sessionStorage.removeItem(this.CUSTOMER_KEY);
  }

  // Métodos de información de pago
  updatePaymentInfo(paymentInfo: PaymentInfo): void {
    this.paymentInfoSubject.next(paymentInfo);
    sessionStorage.setItem(this.PAYMENT_KEY, JSON.stringify(paymentInfo));
  }

  getPaymentInfo(): PaymentInfo | null {
    return this.paymentInfoSubject.value;
  }

  clearPaymentInfo(): void {
    this.paymentInfoSubject.next(null);
    sessionStorage.removeItem(this.PAYMENT_KEY);
  }

  // Métodos de descuentos y promociones
  applyPromoCode(code: string): {
    success: boolean;
    discount: number;
    message: string;
  } {
    const promoCodes: { [key: string]: number } = {
      CINE20: 0.2,
      DULCE15: 0.15,
      PROMO10: 0.1,
      ESTUDIANTE: 0.25,
      JUBILADO: 0.3,
    };

    if (promoCodes[code.toUpperCase()]) {
      return {
        success: true,
        discount: promoCodes[code.toUpperCase()],
        message: `Código aplicado! ${
          promoCodes[code.toUpperCase()] * 100
        }% de descuento`,
      };
    }

    return {
      success: false,
      discount: 0,
      message: 'Código promocional inválido',
    };
  }

  // Métodos de órden
  createOrder(promoCode?: string): Order {
    const cart = this.getCart();
    const customerInfo = this.getCustomerInfo();
    const paymentInfo = this.getPaymentInfo();

    if (!customerInfo || !paymentInfo) {
      throw new Error('Información del cliente o pago faltante');
    }

    const subtotal = this.getCartTotal();
    let discount = 0;

    if (promoCode) {
      const promoResult = this.applyPromoCode(promoCode);
      if (promoResult.success) {
        discount = subtotal * promoResult.discount;
      }
    }

    const total = subtotal - discount;

    const order: Order = {
      id: this.generateOrderId(),
      items: [...cart],
      customerInfo: { ...customerInfo },
      paymentInfo: { ...paymentInfo },
      subtotal,
      discount,
      total,
      promoCode,
      status: 'pending',
      createdAt: new Date(),
      pickupLocation:
        paymentInfo.method === 'cash-pickup' ? 'Sucursal Centro' : undefined,
    };

    return order;
  }

  processOrder(
    order: Order
  ): Observable<{ success: boolean; orderId: string; message: string }> {
    return new Observable((observer) => {
      // Simular procesamiento de pago
      setTimeout(() => {
        // Aquí iría la lógica real de procesamiento de pago
        const success = Math.random() > 0.1; // 90% de éxito simulado

        if (success) {
          order.status = 'confirmed';
          this.clearCart();

          observer.next({
            success: true,
            orderId: order.id,
            message: 'Orden procesada exitosamente',
          });
        } else {
          observer.next({
            success: false,
            orderId: order.id,
            message: 'Error al procesar el pago. Intente nuevamente.',
          });
        }

        observer.complete();
      }, 2000);
    });
  }

  // Métodos privados
  private updateCart(cart: CartItem[]): void {
    this.cartSubject.next(cart);
    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(cart));
  }

  private loadFromStorage(): void {
    // Cargar carrito
    const cartData = sessionStorage.getItem(this.STORAGE_KEY);
    if (cartData) {
      try {
        const cart = JSON.parse(cartData);
        this.cartSubject.next(cart);
      } catch (error) {
        console.error('Error loading cart from storage:', error);
      }
    }

    // Cargar información del cliente
    const customerData = sessionStorage.getItem(this.CUSTOMER_KEY);
    if (customerData) {
      try {
        const customerInfo = JSON.parse(customerData);
        this.customerInfoSubject.next(customerInfo);
      } catch (error) {
        console.error('Error loading customer info from storage:', error);
      }
    }

    // Cargar información de pago
    const paymentData = sessionStorage.getItem(this.PAYMENT_KEY);
    if (paymentData) {
      try {
        const paymentInfo = JSON.parse(paymentData);
        this.paymentInfoSubject.next(paymentInfo);
      } catch (error) {
        console.error('Error loading payment info from storage:', error);
      }
    }
  }

  private generateItemId(product: CartProduct, specificData?: any): string {
    // Generar ID único basado en producto y datos específicos
    const baseId = `${product.category}_${product.id}`;
    if (specificData) {
      const dataHash = JSON.stringify(specificData);
      return `${baseId}_${btoa(dataHash).slice(0, 8)}`;
    }
    return baseId;
  }

  private generateOrderId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    return `CL${timestamp}${random}`.toUpperCase();
  }

  // Métodos de utilidad
  isCartEmpty(): boolean {
    return this.cartSubject.value.length === 0;
  }

  hasProductInCart(productId: string, category: string): boolean {
    return this.cartSubject.value.some(
      (item) =>
        item.product.id === productId && item.product.category === category
    );
  }

  getItemsByCategory(category: string): CartItem[] {
    return this.cartSubject.value.filter(
      (item) => item.product.category === category
    );
  }
}
