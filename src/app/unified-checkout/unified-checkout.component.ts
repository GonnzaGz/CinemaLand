import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CartService,
  CartItem,
  CustomerInfo,
  PaymentInfo,
  Order,
} from '../service/cart.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-unified-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './unified-checkout.component.html',
  styleUrl: './unified-checkout.component.css',
})
export class UnifiedCheckoutComponent implements OnInit, OnDestroy {
  @Input() showModal: boolean = false;
  @Input() allowPickupPayment: boolean = true; // Para habilitar pago en mostrador
  @Output() closeModal = new EventEmitter<void>();
  @Output() orderCompleted = new EventEmitter<Order>();
  @Output() orderFailed = new EventEmitter<string>();

  cartItems: CartItem[] = [];
  customerInfo: CustomerInfo = {
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    documentType: 'DNI',
    documentNumber: '',
  };

  paymentInfo: PaymentInfo = {
    method: 'credit-card',
    cardName: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    billingAddress: '',
  };

  promoCode: string = '';
  appliedPromo: { success: boolean; discount: number; message: string } | null =
    null;

  currentStep: number = 1; // 1: Datos, 2: Pago, 3: Confirmación
  isProcessing: boolean = false;
  termsAccepted: boolean = false;

  // Propiedades auxiliares para el template
  paymentMethod: 'credit-card' | 'mercado-pago' | 'cash-pickup' = 'credit-card';
  cardName: string = '';
  cardNumber: string = '';
  cardExpiry: string = '';
  cardCvv: string = '';

  private subscriptions: Subscription[] = [];

  constructor(private cartService: CartService) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  private loadData(): void {
    // Cargar carrito
    this.subscriptions.push(
      this.cartService.cart$.subscribe((items) => {
        this.cartItems = items;
      })
    );

    // Cargar información del cliente guardada
    const savedCustomerInfo = this.cartService.getCustomerInfo();
    if (savedCustomerInfo) {
      this.customerInfo = { ...savedCustomerInfo };
    }

    // Cargar información de pago guardada
    const savedPaymentInfo = this.cartService.getPaymentInfo();
    if (savedPaymentInfo) {
      this.paymentInfo = { ...savedPaymentInfo };
      // Sincronizar propiedades auxiliares
      this.paymentMethod = this.paymentInfo.method;
      this.cardName = this.paymentInfo.cardName || '';
      this.cardNumber = this.paymentInfo.cardNumber || '';
      this.cardExpiry = this.paymentInfo.cardExpiry || '';
      this.cardCvv = this.paymentInfo.cardCvv || '';
    }
  }

  // Gestión de pasos
  goToStep(step: number): void {
    if (step === 2 && !this.isCustomerInfoValid()) {
      return;
    }
    if (step === 3 && !this.isPaymentInfoValid()) {
      return;
    }
    this.currentStep = step;
  }

  nextStep(): void {
    console.log(
      'nextStep called, currentStep:',
      this.currentStep,
      'canProceed:',
      this.canProceed()
    );
    if (this.currentStep < 3) {
      this.goToStep(this.currentStep + 1);
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  // Validaciones
  isCustomerInfoValid(): boolean {
    return !!(
      this.customerInfo.name.trim() &&
      this.customerInfo.email.trim() &&
      this.customerInfo.phone.trim() &&
      this.customerInfo.documentNumber?.trim()
    );
  }

  isPaymentInfoValid(): boolean {
    if (this.paymentInfo.method === 'cash-pickup') {
      return true;
    }

    if (this.paymentInfo.method === 'mercado-pago') {
      return true;
    }

    if (this.paymentInfo.method === 'credit-card') {
      return !!(
        this.paymentInfo.cardName?.trim() &&
        this.paymentInfo.cardNumber?.trim() &&
        this.paymentInfo.cardExpiry?.trim() &&
        this.paymentInfo.cardCvv?.trim()
      );
    }

    return false;
  }

  // Gestión de datos del cliente
  saveCustomerInfo(): void {
    if (this.isCustomerInfoValid()) {
      this.cartService.updateCustomerInfo(this.customerInfo);
      this.nextStep();
    }
  }

  // Gestión de pago
  onPaymentMethodChange(): void {
    this.paymentInfo.method = this.paymentMethod;
    this.cartService.updatePaymentInfo(this.paymentInfo);
  }

  onCardNameChange(): void {
    this.paymentInfo.cardName = this.cardName;
    this.cartService.updatePaymentInfo(this.paymentInfo);
  }

  onCardNumberChange(): void {
    this.paymentInfo.cardNumber = this.cardNumber;
    this.cartService.updatePaymentInfo(this.paymentInfo);
  }

  onCardExpiryChange(): void {
    this.paymentInfo.cardExpiry = this.cardExpiry;
    this.cartService.updatePaymentInfo(this.paymentInfo);
  }

  onCardCvvChange(): void {
    this.paymentInfo.cardCvv = this.cardCvv;
    this.cartService.updatePaymentInfo(this.paymentInfo);
  }

  formatCardNumber(event: any): void {
    let value = event.target.value.replace(/\s/g, '');
    value = value.replace(/(.{4})/g, '$1 ').trim();
    this.paymentInfo.cardNumber = value;
    event.target.value = value;
  }

  formatCardExpiry(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    this.paymentInfo.cardExpiry = value;
    event.target.value = value;
  }

  // Promociones
  applyPromoCode(): void {
    if (this.promoCode.trim()) {
      this.appliedPromo = this.cartService.applyPromoCode(
        this.promoCode.trim()
      );
    }
  }

  removePromoCode(): void {
    this.promoCode = '';
    this.appliedPromo = null;
  }

  // Cálculos
  getSubtotal(): number {
    return this.cartService.getCartTotal();
  }

  getDiscount(): number {
    if (this.appliedPromo?.success) {
      return this.getSubtotal() * this.appliedPromo.discount;
    }
    return 0;
  }

  getTotal(): number {
    return this.getSubtotal() - this.getDiscount();
  }

  getTotalItems(): number {
    return this.cartService.getCartItemCount();
  }

  // Procesar orden
  processOrder(): void {
    if (!this.isCustomerInfoValid() || !this.isPaymentInfoValid()) {
      return;
    }

    this.isProcessing = true;

    try {
      // Guardar información final
      this.cartService.updateCustomerInfo(this.customerInfo);
      this.cartService.updatePaymentInfo(this.paymentInfo);

      // Crear orden
      const order = this.cartService.createOrder(
        this.appliedPromo?.success ? this.promoCode : undefined
      );

      // Procesar orden
      this.subscriptions.push(
        this.cartService.processOrder(order).subscribe({
          next: (result) => {
            this.isProcessing = false;
            if (result.success) {
              this.orderCompleted.emit(order);
              this.closeCheckout();
            } else {
              this.orderFailed.emit(result.message);
            }
          },
          error: (error) => {
            this.isProcessing = false;
            this.orderFailed.emit('Error inesperado. Intente nuevamente.');
            console.error('Order processing error:', error);
          },
        })
      );
    } catch (error) {
      this.isProcessing = false;
      this.orderFailed.emit('Error al crear la orden. Verifique sus datos.');
      console.error('Order creation error:', error);
    }
  }

  // Método para verificar si los términos están aceptados
  isTermsAccepted(): boolean {
    const termsElement = document.getElementById(
      'termsAccepted'
    ) as HTMLInputElement;
    return termsElement ? termsElement.checked : false;
  }

  // Métodos para validar avance de pasos
  canProceed(): boolean {
    return this.isCustomerInfoValid();
  }

  canConfirm(): boolean {
    return this.isPaymentInfoValid() && this.termsAccepted;
  }

  // Control del modal
  closeCheckout(): void {
    this.currentStep = 1;
    this.promoCode = '';
    this.appliedPromo = null;
    this.closeModal.emit();
  }

  onOverlayClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.closeCheckout();
    }
  }

  // Utilidades
  getCategoryDisplayName(category: string): string {
    const categoryNames: { [key: string]: string } = {
      'movie-ticket': 'Entrada de Cine',
      candy: 'Confitería',
      store: 'Tienda',
      membership: 'Membresía',
      gift: 'Regalo',
    };
    return categoryNames[category] || category;
  }

  getPaymentMethodDisplayName(method: string): string {
    const methodNames: { [key: string]: string } = {
      'credit-card': 'Tarjeta de Crédito/Débito',
      'mercado-pago': 'Mercado Pago',
      'cash-pickup': 'Pago en Mostrador',
    };
    return methodNames[method] || method;
  }

  // Editar carrito
  updateItemQuantity(itemId: string, quantity: number): void {
    this.cartService.updateQuantity(itemId, quantity);
  }

  removeItem(itemId: string): void {
    this.cartService.removeFromCart(itemId);
  }
}
