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

    // Asegurar sincronización inicial
    this.onPaymentMethodChange();
  }

  // Gestión de pasos
  goToStep(step: number): void {
    console.log(
      'goToStep() llamado con step:',
      step,
      'desde currentStep:',
      this.currentStep
    );
    console.log('isCustomerInfoValid():', this.isCustomerInfoValid());
    console.log('isPaymentInfoValid():', this.isPaymentInfoValid());

    if (step === 2 && !this.isCustomerInfoValid()) {
      console.log(
        'Bloqueado: no se puede ir al paso 2 sin datos válidos del cliente'
      );
      return;
    }
    if (step === 3 && !this.isPaymentInfoValid()) {
      console.log(
        'Bloqueado: no se puede ir al paso 3 sin información de pago válida'
      );
      return;
    }
    console.log('Avanzando al paso:', step);
    this.currentStep = step;
  }

  nextStep(): void {
    console.log(
      'nextStep() llamado. currentStep:',
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
    const isValid = !!(
      this.customerInfo.name.trim() &&
      this.customerInfo.email.trim() &&
      this.customerInfo.phone.trim() &&
      this.customerInfo.documentNumber?.trim()
    );

    // Debug temporal
    if (!isValid) {
      console.log('Customer info validation failed:', {
        name: this.customerInfo.name,
        email: this.customerInfo.email,
        phone: this.customerInfo.phone,
        documentNumber: this.customerInfo.documentNumber,
      });
    }

    return isValid;
  }

  isPaymentInfoValid(): boolean {
    console.log(
      'Validando pago. Método seleccionado:',
      this.paymentInfo.method
    );
    console.log('Información de pago completa:', this.paymentInfo);

    if (this.paymentInfo.method === 'cash-pickup') {
      console.log('Método cash-pickup válido');
      return true;
    }

    if (this.paymentInfo.method === 'mercado-pago') {
      console.log('Método mercado-pago válido');
      return true;
    }

    if (this.paymentInfo.method === 'credit-card') {
      const isValid = !!(
        this.paymentInfo.cardName?.trim() &&
        this.paymentInfo.cardNumber?.trim() &&
        this.paymentInfo.cardExpiry?.trim() &&
        this.paymentInfo.cardCvv?.trim()
      );
      console.log('Método credit-card. Validación:', isValid);
      console.log('Datos tarjeta:', {
        cardName: this.paymentInfo.cardName,
        cardNumber: this.paymentInfo.cardNumber,
        cardExpiry: this.paymentInfo.cardExpiry,
        cardCvv: this.paymentInfo.cardCvv,
      });
      return isValid;
    }

    console.log('Método de pago no reconocido o no válido');
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
    console.log(
      'onPaymentMethodChange() llamado. paymentMethod:',
      this.paymentMethod
    );
    this.paymentInfo.method = this.paymentMethod;
    console.log('paymentInfo.method actualizado a:', this.paymentInfo.method);
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
              // Generar PDF con QR antes de emitir la orden completada
              this.generatePurchaseReceipt(order);
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
    // Validación basada en el paso actual
    switch (this.currentStep) {
      case 1: // Paso 1: Datos del cliente
        return this.isCustomerInfoValid();
      case 2: // Paso 2: Información de pago
        return this.isPaymentInfoValid();
      default:
        return false;
    }
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

  // Generar PDF con QR
  async generatePurchaseReceipt(order: Order): Promise<void> {
    try {
      // Importar jsPDF y QRCode
      const { jsPDF } = await import('jspdf');
      const QRCode = await import('qrcode');

      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();

      // Header del PDF
      pdf.setFillColor(26, 26, 46);
      pdf.rect(0, 0, pageWidth, 40, 'F');

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('🎬 CINEMALAND', pageWidth / 2, 25, { align: 'center' });

      // Información de la compra
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('COMPROBANTE DE COMPRA', pageWidth / 2, 55, { align: 'center' });

      // Datos del cliente
      let yPos = 75;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DATOS DEL CLIENTE:', 20, yPos);

      yPos += 10;
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Nombre: ${this.customerInfo.name}`, 20, yPos);
      yPos += 7;
      pdf.text(`Email: ${this.customerInfo.email}`, 20, yPos);
      yPos += 7;
      pdf.text(`Teléfono: ${this.customerInfo.phone}`, 20, yPos);
      yPos += 7;
      pdf.text(
        `${this.customerInfo.documentType}: ${this.customerInfo.documentNumber}`,
        20,
        yPos
      );

      // Información de la orden
      yPos += 20;
      pdf.setFont('helvetica', 'bold');
      pdf.text('DETALLES DE LA ORDEN:', 20, yPos);

      yPos += 10;
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Número de Orden: ${order.id}`, 20, yPos);
      yPos += 7;
      pdf.text(
        `Fecha: ${new Date(order.createdAt).toLocaleDateString('es-ES')}`,
        20,
        yPos
      );
      yPos += 7;
      pdf.text(
        `Método de Pago: ${this.getPaymentMethodDisplayName(
          this.paymentInfo.method
        )}`,
        20,
        yPos
      );

      // Items de la compra
      yPos += 20;
      pdf.setFont('helvetica', 'bold');
      pdf.text('ITEMS COMPRADOS:', 20, yPos);

      yPos += 10;
      pdf.setFont('helvetica', 'normal');
      order.items.forEach((item) => {
        pdf.text(
          `• ${item.product.name} x${item.quantity} - $${(
            item.product.price * item.quantity
          ).toFixed(2)}`,
          25,
          yPos
        );
        yPos += 7;
      });

      // Total
      yPos += 10;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text(`TOTAL: $${order.total.toFixed(2)} ARS`, 20, yPos);

      // Generar QR con información de la orden
      const qrData = `Orden: ${order.id}\nCliente: ${
        this.customerInfo.name
      }\nTotal: $${order.total.toFixed(2)} ARS\nFecha: ${new Date(
        order.createdAt
      ).toLocaleDateString('es-ES')}`;

      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 150,
        margin: 2,
      });

      // Agregar QR al PDF
      const qrSize = 50;
      const qrX = pageWidth - qrSize - 20;
      const qrY = 75;

      pdf.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

      // Texto del QR
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Código QR', qrX + qrSize / 2, qrY + qrSize + 10, {
        align: 'center',
      });
      pdf.text('de verificación', qrX + qrSize / 2, qrY + qrSize + 15, {
        align: 'center',
      });

      // Guardar el PDF
      pdf.save(`Comprobante-Cinemaland-${order.id}.pdf`);

      console.log(
        'PDF de comprobante generado con éxito para la orden:',
        order.id
      );
    } catch (error) {
      console.error('Error generando el PDF del comprobante:', error);
    }
  }
}
