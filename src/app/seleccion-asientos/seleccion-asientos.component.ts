import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApipeliculasService } from '../service/apipeliculas.service';
import { FormsModule } from '@angular/forms';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { BackendService } from '../service/backend.service';
import {
  CartService,
  CustomerInfo,
  PaymentInfo,
  Order,
} from '../service/cart.service';
import { UnifiedCheckoutComponent } from '../unified-checkout/unified-checkout.component';

@Component({
  selector: 'app-seleccion-asientos',
  standalone: true,
  imports: [CommonModule, FormsModule, UnifiedCheckoutComponent], // Add UnifiedCheckoutComponent here
  templateUrl: './seleccion-asientos.component.html',
  styleUrls: ['./seleccion-asientos.component.css'],
})
export class SeleccionAsientosComponent implements OnInit {
  movieId: string | undefined;
  movieDetails: any;
  precioTotal: number = 0;
  precioSubtotal: number = 0;
  compraConfirmada: boolean = false; // Cambiar a verdadero una vez que la compra esté confirmada
  esEstreno: boolean = false;

  // Propiedades para descuentos sociales
  tieneDescuentoSocial: boolean = false;
  tieneDescuentoPeliRandom: boolean = false;
  descuentoPorcentaje: number = 0;
  descuentoPorcentajePeliRandom: number = 0;
  descuentoPorcentajeTotal: number = 0;
  montoDescuento: number = 0;
  montoDescuentoPeliRandom: number = 0;
  montoDescuentoTotal: number = 0;
  tipoDescuento: string = '';

  // Filas de asientos - 10 filas (A-J) x 15 asientos cada una
  fila1 = this.generarAsientos('A', 15, 5000);
  fila2 = this.generarAsientos('B', 15, 5000);
  fila3 = this.generarAsientos('C', 15, 5000);

  // Almacena asientos seleccionados
  asientosSeleccionados: any = [];

  // Sucursales y opciones de pago
  sucursales: any = [];
  sucursalSeleccionada: string | null = null;
  modoPago: string | null = null;
  horarioSeleccionado: string = ''; // Cambiado de array a string
  diaCompra: string = new Date().toLocaleDateString(); // Fecha actual de la compra
  horaCompra: string = new Date().toLocaleTimeString(); // Hora de la compra
  sucursalCompletaHorarios: any = [];
  horariosPorSucursal: any = [];
  asientosFiltrados: any = [];
  filasAsientos: any[][] = [];

  // QR code
  qrCodeDataUrl: string = ''; // URL del código QR

  // Checkout system properties
  currentStep: number = 1; // 1: Cine, 2: Horario/Asientos, 3: Pago, 4: Confirmación
  isProcessing: boolean = false;

  // Customer and payment info
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

  // Payment method auxiliary properties
  paymentMethod: 'credit-card' | 'mercado-pago' | 'cash-pickup' = 'credit-card';
  cardName: string = '';
  cardNumber: string = '';
  cardExpiry: string = '';
  cardCvv: string = '';
  termsAccepted: boolean = false;

  // Unified checkout properties
  showCheckoutModal: boolean = false;
  allowPickupPayment: boolean = true; // Permitir pago en mostrador

  private apiMovieService = inject(ApipeliculasService);
  private router = inject(Router); // Inyectamos Router para la redirección

  constructor(
    private route: ActivatedRoute,
    private backendService: BackendService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.movieId = params.get('id') as string;
      if (this.movieId) {
        this.obtenerDetallesDePelicula(this.movieId);
      }
    });

    // Verificar si viene de PeliRandom mediante queryParams
    this.route.queryParams.subscribe((params) => {
      const fromPeliRandom = params['fromPeliRandom'];
      console.log('QueryParams recibidos:', params);
      console.log('fromPeliRandom:', fromPeliRandom);

      if (fromPeliRandom === 'true') {
        console.log(
          '✅ Detectado que viene de PeliRandom - Aplicando descuento'
        );
        this.cargarDescuentoPeliRandom();
      } else {
        console.log('❌ No viene de PeliRandom - Sin descuento');
      }
    });

    this.generaSucursal();
    this.cargarDescuentoSocial();

    // Inicializar checkout system
    this.initializeCheckout();
  }

  // Inicializar sistema de checkout
  initializeCheckout(): void {
    // Sincronizar método de pago inicial
    this.onPaymentMethodChange();
  }

  // Getter para debuggear la condición de visibilidad
  get puedeSeleccionarAsientos(): boolean {
    const resultado = !!(
      this.sucursalSeleccionada &&
      this.horarioSeleccionado &&
      this.horarioSeleccionado.length > 0
    );
    console.log('Puede seleccionar asientos:', resultado, {
      sucursal: this.sucursalSeleccionada,
      horario: this.horarioSeleccionado,
      horarioLength: this.horarioSeleccionado?.length,
    });
    return resultado;
  }

  obtenerDetallesDePelicula(id: string): void {
    this.apiMovieService.getDetalleMovie(id).subscribe(
      (data: any) => {
        this.movieDetails = {
          ...data,
          imageUrl: `https://image.tmdb.org/t/p/w500${data.poster_path}`, // Construye la URL de la imagen
        };
        this.esEstreno = this.apiMovieService.esEstreno(
          this.movieDetails.release_date
        );
      },
      (error) =>
        console.error('Error al obtener detalles de la película:', error)
    );
  }

  generaSucursal(): void {
    this.backendService.getSucursal().subscribe(
      (datos: any) => {
        console.log('Sucursales obtenidos del backend:', datos);
        this.sucursales = datos;
      },
      (error) => {
        console.error('Error al obtener sucursales del backend:', error);
      }
    );
  }

  generarAsientos(fila: string, cantidad: number, precio: number): any[] {
    return Array.from({ length: cantidad }, (_, index) => ({
      id: `${fila}${index + 1}`,
      nombre: `${fila}${index + 1}`,
      precio: precio,
    }));
  }

  seleccionarAsiento(asiento: any): void {
    if (this.asientosSeleccionados.includes(asiento)) {
      // Si ya está seleccionado, lo quitamos
      this.asientosSeleccionados = this.asientosSeleccionados.filter(
        (a: any) => a.id !== asiento.id
      );
    } else {
      // Si no está seleccionado, lo agregamos
      this.asientosSeleccionados.push(asiento);
    }
    this.actualizarPrecios();

    // Si hay asientos seleccionados y estamos en el paso 2, abrir checkout
    if (this.asientosSeleccionados.length > 0 && this.currentStep === 2) {
      // Pequeño delay para que el usuario vea la selección
      setTimeout(() => {
        this.goToCheckout();
      }, 500);
    }
  }

  actualizarPrecios(): void {
    this.precioSubtotal = this.asientosSeleccionados.reduce(
      (total: any, asiento: any) => total + 10000,
      0
    );

    this.aplicarDescuentos();
  }

  cargarDescuentoSocial(): void {
    const descuentoData = localStorage.getItem('descuentoSocial');
    if (descuentoData) {
      try {
        const descuento = JSON.parse(descuentoData);
        if (descuento.activo) {
          this.tieneDescuentoSocial = true;
          this.descuentoPorcentaje = descuento.porcentaje;
          this.tipoDescuento =
            descuento.tipo === 'discapacidad'
              ? 'Certificado de Discapacidad'
              : 'Vulnerabilidad Social';

          console.log('Descuento social cargado:', descuento);
        }
      } catch (error) {
        console.error('Error al cargar descuento social:', error);
      }
    }
  }

  cargarDescuentoPeliRandom(): void {
    console.log('🔍 Intentando cargar descuento PeliRandom...');
    const descuentoData = localStorage.getItem('descuentoPeliRandom');
    console.log('Datos en localStorage:', descuentoData);

    if (descuentoData) {
      try {
        const descuento = JSON.parse(descuentoData);
        console.log('Descuento parseado:', descuento);

        if (descuento.activo) {
          this.tieneDescuentoPeliRandom = true;
          this.descuentoPorcentajePeliRandom = descuento.porcentaje;

          console.log('✅ Descuento PeliRandom cargado exitosamente:', {
            porcentaje: descuento.porcentaje,
            activo: descuento.activo,
          });

          // Recalcular precios si ya hay asientos seleccionados
          if (this.asientosSeleccionados.length > 0) {
            console.log('🔄 Recalculando precios con descuento PeliRandom...');
            this.actualizarPrecios();
          }
        } else {
          console.log('❌ Descuento PeliRandom no está activo');
        }
      } catch (error) {
        console.error('❌ Error al cargar descuento PeliRandom:', error);
      }
    } else {
      console.log('❌ No se encontró descuento PeliRandom en localStorage');
    }
  }

  aplicarDescuentos(): void {
    // Resetear valores
    this.montoDescuento = 0;
    this.montoDescuentoPeliRandom = 0;
    this.montoDescuentoTotal = 0;
    this.descuentoPorcentajeTotal = 0;

    // Calcular descuento social
    if (this.tieneDescuentoSocial && this.descuentoPorcentaje > 0) {
      this.montoDescuento =
        (this.precioSubtotal * this.descuentoPorcentaje) / 100;
      this.descuentoPorcentajeTotal += this.descuentoPorcentaje;
    }

    // Calcular descuento PeliRandom
    if (
      this.tieneDescuentoPeliRandom &&
      this.descuentoPorcentajePeliRandom > 0
    ) {
      this.montoDescuentoPeliRandom =
        (this.precioSubtotal * this.descuentoPorcentajePeliRandom) / 100;
      this.descuentoPorcentajeTotal += this.descuentoPorcentajePeliRandom;
      console.log('💰 Aplicando descuento PeliRandom:', {
        porcentaje: this.descuentoPorcentajePeliRandom,
        monto: this.montoDescuentoPeliRandom,
        subtotal: this.precioSubtotal,
      });
    } else {
      console.log('❌ No se aplica descuento PeliRandom:', {
        tieneDescuento: this.tieneDescuentoPeliRandom,
        porcentaje: this.descuentoPorcentajePeliRandom,
      });
    }

    // Sumar todos los descuentos
    this.montoDescuentoTotal =
      this.montoDescuento + this.montoDescuentoPeliRandom;
    this.precioTotal = this.precioSubtotal - this.montoDescuentoTotal;

    console.log(`Descuentos aplicados:`);
    console.log(
      `- Social: ${this.descuentoPorcentaje}% = -$${this.montoDescuento}`
    );
    console.log(
      `- PeliRandom: ${this.descuentoPorcentajePeliRandom}% = -$${this.montoDescuentoPeliRandom}`
    );
    console.log(
      `- Total: ${this.descuentoPorcentajeTotal}% = -$${this.montoDescuentoTotal}`
    );
  }

  onPagoChange(): void {
    // Aquí puedes implementar cualquier lógica adicional cuando se cambie el modo de pago
    console.log('Modo de pago seleccionado:', this.modoPago);
  }

  async onSucursalChange(e: any): Promise<void> {
    console.log(e);
    this.backendService.getSucursalCompleta(e).subscribe((response: any) => {
      this.sucursalCompletaHorarios = response;

      this.horariosPorSucursal = Array.from(
        new Set(this.sucursalCompletaHorarios.map((item: any) => item.HORARIO))
      );

      // Avanzar automáticamente al paso 2 (horario/asientos)
      if (this.sucursalSeleccionada) {
        this.goToStep(2);
      }
    });
  }

  generarFilas() {
    this.filasAsientos = [];

    // Siempre generar estructura estándar de cine: 10 filas (A-J) x 15 asientos (1-15)
    this.generarEstructuraCine();
  }

  // Generar estructura estándar de cine: 10 filas (A-J) x 15 asientos (1-15)
  generarEstructuraCine() {
    this.filasAsientos = []; // Limpiar array primero
    const letras = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const asientosPorFila = 15;

    letras.forEach((letra) => {
      const fila: any[] = [];
      for (let i = 1; i <= asientosPorFila; i++) {
        fila.push({
          ASIENTO: `${letra}${i}`,
          nombre: `${letra}${i}`,
          ocupado: false,
          precio: 10000,
        });
      }
      this.filasAsientos.push(fila);
    });

    console.log('Estructura estándar de cine generada: 10 filas x 15 asientos');
    console.log('Total de filas:', this.filasAsientos.length);
    console.log('Asientos por fila:', this.filasAsientos[0]?.length);
  }
  onHorarioChange(e: any) {
    console.log('Horario seleccionado:', e);
    console.log('Datos completos de sucursal:', this.sucursalCompletaHorarios);

    this.asientosFiltrados = this.sucursalCompletaHorarios.filter(
      (item: any) => item.HORARIO === e
    );

    console.log('Asientos filtrados:', this.asientosFiltrados);
    console.log(
      'Cantidad de asientos filtrados:',
      this.asientosFiltrados.length
    );

    this.generarFilas();

    console.log('Filas generadas:', this.filasAsientos);
  }

  async confirmarCompra(): Promise<void> {
    console.log('Confirmando compra...');
    console.log('Asientos seleccionados:', this.asientosSeleccionados);
    console.log('Total a pagar:', this.precioTotal);

    try {
      // Generar el QR y esperar a que termine
      await this.generarQR();
      console.log('QR generado con éxito');

      // Crear el PDF
      this.generarPDF();

      // Mostrar el mensaje de agradecimiento
      this.compraConfirmada = true;
    } catch (error) {
      console.error('Error al generar el QR:', error);
    }
  }

  async generarQR(): Promise<void> {
    const asientos = this.asientosSeleccionados
      .map((a: any) => a.ASIENTO)
      .join(', ');
    console.log(asientos);
    const qrData = `Película: ${this.movieDetails?.title}\nSucursal: ${this.sucursalSeleccionada}\nHorario: ${this.horarioSeleccionado}\nAsientos: ${asientos}\nTotal: ${this.precioTotal} ARS`;

    try {
      this.qrCodeDataUrl = await QRCode.toDataURL(qrData);
      console.log('QR generado con éxito:', this.qrCodeDataUrl);
    } catch (err) {
      console.error('Error generando el QR:', err);
      throw new Error('Error generando el QR');
    }
  }

  generarPDF(): void {
    const doc = new jsPDF();
    const asientos = this.asientosSeleccionados
      .map((a: any) => a.ASIENTO)
      .join(', ');

    doc.setFontSize(20);
    doc.text('Compra Confirmada', 20, 20);

    doc.setFontSize(12);
    doc.text(`Película: ${this.movieDetails?.title}`, 20, 40);
    doc.text(`Sucursal: ${this.sucursalSeleccionada}`, 20, 50);
    doc.text(`Horario: ${this.horarioSeleccionado}`, 20, 60);
    doc.text(`Asientos seleccionados: ${asientos}`, 20, 70);
    doc.text(`Total a pagar: ${this.precioTotal} ARS`, 20, 80);

    // Insertar el código QR
    if (this.qrCodeDataUrl) {
      doc.addImage(this.qrCodeDataUrl, 'PNG', 20, 90, 50, 50);
    }

    doc.save('confirmacion_compra.pdf');
  }

  redirigirAPaginaPrincipal(): void {
    this.router.navigate(['/']); // Redirigir a la página principal
  }

  goBack(): void {
    this.router.navigate(['/']); // Volver al catálogo de películas
  }

  // ============= CHECKOUT SYSTEM METHODS =============

  // Navegación de pasos
  goToStep(step: number): void {
    console.log(
      'goToStep() llamado con step:',
      step,
      'desde currentStep:',
      this.currentStep
    );

    if (step === 2 && !this.sucursalSeleccionada) {
      console.log(
        'Bloqueado: no se puede ir al paso 2 sin seleccionar sucursal'
      );
      return;
    }
    if (
      step === 3 &&
      (!this.sucursalSeleccionada ||
        !this.horarioSeleccionado ||
        this.asientosSeleccionados.length === 0)
    ) {
      console.log(
        'Bloqueado: no se puede ir al paso 3 sin completar selección de asientos'
      );
      return;
    }
    if (
      step === 4 &&
      (!this.isCustomerInfoValid() || !this.isPaymentInfoValid())
    ) {
      console.log('Bloqueado: no se puede ir al paso 4 sin información válida');
      return;
    }

    console.log('Avanzando al paso:', step);
    this.currentStep = step;
  }

  nextStep(): void {
    console.log('nextStep() llamado. currentStep:', this.currentStep);
    if (this.currentStep < 4) {
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
      this.customerInfo.name?.trim() &&
      this.customerInfo.email?.trim() &&
      this.customerInfo.phone?.trim() &&
      this.customerInfo.documentType?.trim() &&
      this.customerInfo.documentNumber?.trim()
    );

    console.log('Validando información del cliente:', {
      name: this.customerInfo.name,
      email: this.customerInfo.email,
      phone: this.customerInfo.phone,
      documentType: this.customerInfo.documentType,
      documentNumber: this.customerInfo.documentNumber,
      isValid: isValid,
    });

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
      return isValid;
    }

    console.log('Método de pago no reconocido o no válido');
    return false;
  }

  canProceed(): boolean {
    switch (this.currentStep) {
      case 1: // Selección de cine
        return !!this.sucursalSeleccionada;
      case 2: // Selección de horario y asientos
        return !!(
          this.sucursalSeleccionada &&
          this.horarioSeleccionado &&
          this.asientosSeleccionados.length > 0
        );
      case 3: // Información del cliente y pago
        return this.isCustomerInfoValid() && this.isPaymentInfoValid();
      default:
        return false;
    }
  }

  canConfirm(): boolean {
    return this.isPaymentInfoValid() && this.termsAccepted;
  }

  // Gestión de métodos de pago
  onPaymentMethodChange(): void {
    console.log(
      'onPaymentMethodChange() llamado. paymentMethod:',
      this.paymentMethod
    );
    this.paymentInfo.method = this.paymentMethod;
    console.log('paymentInfo.method actualizado a:', this.paymentInfo.method);
  }

  onCardNameChange(): void {
    this.paymentInfo.cardName = this.cardName;
  }

  onCardNumberChange(): void {
    this.paymentInfo.cardNumber = this.cardNumber;
  }

  onCardExpiryChange(): void {
    this.paymentInfo.cardExpiry = this.cardExpiry;
  }

  onCardCvvChange(): void {
    this.paymentInfo.cardCvv = this.cardCvv;
  }

  getPaymentMethodDisplayName(method: string): string {
    switch (method) {
      case 'credit-card':
        return 'Tarjeta de Crédito/Débito';
      case 'mercado-pago':
        return 'Mercado Pago';
      case 'cash-pickup':
        return 'Pago en el Local';
      default:
        return 'Método desconocido';
    }
  }

  // Proceso de compra final
  async processOrder(): Promise<void> {
    if (!this.canConfirm()) {
      console.log('No se puede procesar la orden - validaciones fallidas');
      return;
    }

    this.isProcessing = true;

    try {
      // Crear el item del carrito basado en la selección de asientos
      const asientos = this.asientosSeleccionados
        .map((a: any) => a.ASIENTO)
        .join(', ');

      const ticketItem = {
        id: `ticket-${this.movieId}-${Date.now()}`,
        product: {
          id: this.movieId || '',
          name: `${this.movieDetails?.title} - ${asientos}`,
          description: `Sucursal: ${this.sucursalSeleccionada} | Horario: ${this.horarioSeleccionado}`,
          price: this.precioTotal,
          image: this.movieDetails?.poster_path
            ? `https://image.tmdb.org/t/p/w300/${this.movieDetails.poster_path}`
            : '',
          category: 'movie-ticket' as const,
          type: 'cinema-ticket',
          metadata: {
            movieId: this.movieId,
            cinema: this.sucursalSeleccionada,
            schedule: this.horarioSeleccionado,
            seats: asientos,
            discounts: {
              social: this.tieneDescuentoSocial,
              peliRandom: this.tieneDescuentoPeliRandom,
              totalDiscount: this.montoDescuentoTotal,
            },
          },
        },
        quantity: this.asientosSeleccionados.length,
        addedAt: new Date(),
        specificData: {
          cinema: this.sucursalSeleccionada,
          schedule: this.horarioSeleccionado,
          seats: this.asientosSeleccionados,
          discounts: this.montoDescuentoTotal,
        },
      };

      // Crear la orden directamente
      const order: Order = {
        id: `ORD-${Date.now()}`,
        items: [ticketItem],
        customerInfo: this.customerInfo,
        paymentInfo: this.paymentInfo,
        total: this.precioTotal,
        subtotal: this.precioSubtotal,
        discount: this.montoDescuentoTotal,
        status: 'confirmed',
        createdAt: new Date(),
        pickupLocation:
          this.paymentInfo.method === 'cash-pickup'
            ? this.sucursalSeleccionada || undefined
            : undefined,
      };

      // Generar PDF con QR
      await this.generatePurchaseReceipt(order);

      // Marcar compra como confirmada
      this.compraConfirmada = true;
      this.isProcessing = false;

      console.log('Orden procesada exitosamente:', order);
    } catch (error) {
      this.isProcessing = false;
      console.error('Error procesando la orden:', error);
    }
  }

  // Generar PDF con QR - Reemplaza el método anterior
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
      pdf.text('ENTRADA DE CINE', pageWidth / 2, 55, { align: 'center' });

      // Datos del cliente
      let yPos = 75;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DATOS DEL CLIENTE:', 20, yPos);

      yPos += 10;
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Nombre: ${order.customerInfo.name}`, 20, yPos);
      yPos += 7;
      pdf.text(`Email: ${order.customerInfo.email}`, 20, yPos);
      yPos += 7;
      pdf.text(`Teléfono: ${order.customerInfo.phone}`, 20, yPos);
      yPos += 7;
      pdf.text(
        `${order.customerInfo.documentType}: ${order.customerInfo.documentNumber}`,
        20,
        yPos
      );

      // Información de la película
      yPos += 20;
      pdf.setFont('helvetica', 'bold');
      pdf.text('DETALLES DE LA FUNCIÓN:', 20, yPos);

      yPos += 10;
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Película: ${this.movieDetails?.title}`, 20, yPos);
      yPos += 7;
      pdf.text(`Sucursal: ${this.sucursalSeleccionada}`, 20, yPos);
      yPos += 7;
      pdf.text(`Horario: ${this.horarioSeleccionado}`, 20, yPos);
      yPos += 7;

      const asientos = this.asientosSeleccionados
        .map((a: any) => a.ASIENTO)
        .join(', ');
      pdf.text(`Asientos: ${asientos}`, 20, yPos);
      yPos += 7;
      pdf.text(
        `Fecha de compra: ${new Date().toLocaleDateString('es-ES')}`,
        20,
        yPos
      );

      // Información de precios
      yPos += 20;
      pdf.setFont('helvetica', 'bold');
      pdf.text('DETALLES DEL PAGO:', 20, yPos);

      yPos += 10;
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Subtotal: $${this.precioSubtotal.toFixed(2)} ARS`, 20, yPos);

      if (this.montoDescuentoTotal > 0) {
        yPos += 7;
        let descuentoTexto = 'Descuentos aplicados: ';
        if (this.tieneDescuentoSocial) descuentoTexto += 'Social ';
        if (this.tieneDescuentoPeliRandom) descuentoTexto += 'PeliRandom ';
        pdf.text(descuentoTexto, 20, yPos);
        yPos += 7;
        pdf.text(
          `Descuento: -$${this.montoDescuentoTotal.toFixed(2)} ARS`,
          20,
          yPos
        );
      }

      yPos += 10;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text(`TOTAL: $${this.precioTotal.toFixed(2)} ARS`, 20, yPos);

      // Generar QR con información de la orden
      const qrData = `Orden: ${order.id}\nPelícula: ${
        this.movieDetails?.title
      }\nCine: ${this.sucursalSeleccionada}\nHorario: ${
        this.horarioSeleccionado
      }\nAsientos: ${asientos}\nTotal: $${this.precioTotal.toFixed(2)} ARS`;

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
      pdf.save(`Entrada-Cinemaland-${order.id}.pdf`);

      console.log('PDF de entrada generado con éxito para la orden:', order.id);
    } catch (error) {
      console.error('Error generando el PDF de la entrada:', error);
    }
  }

  // ============= UNIFIED CHECKOUT INTEGRATION =============

  // Método para preparar y abrir el checkout modal
  openCheckoutModal(): void {
    // Preparar el carrito con los asientos seleccionados
    this.cartService.clearCart(); // Limpiar carrito anterior

    // Crear el item del carrito basado en la selección de asientos
    const asientos = this.asientosSeleccionados
      .map((a: any) => a.ASIENTO)
      .join(', ');

    const ticketProduct = {
      id: this.movieId || '',
      name: `${this.movieDetails?.title} - ${asientos}`,
      description: `Sucursal: ${this.sucursalSeleccionada} | Horario: ${this.horarioSeleccionado}`,
      price: this.precioTotal / this.asientosSeleccionados.length, // Precio por entrada
      image: this.movieDetails?.poster_path
        ? `https://image.tmdb.org/t/p/w300/${this.movieDetails.poster_path}`
        : '',
      category: 'movie-ticket' as const,
      type: 'cinema-ticket',
      metadata: {
        movieId: this.movieId,
        cinema: this.sucursalSeleccionada,
        schedule: this.horarioSeleccionado,
        seats: asientos,
        discounts: {
          social: this.tieneDescuentoSocial,
          peliRandom: this.tieneDescuentoPeliRandom,
          totalDiscount: this.montoDescuentoTotal,
        },
      },
    };

    const specificData = {
      cinema: this.sucursalSeleccionada,
      schedule: this.horarioSeleccionado,
      seats: this.asientosSeleccionados,
      discounts: this.montoDescuentoTotal,
    };

    // Agregar al carrito
    this.cartService.addToCart(
      ticketProduct,
      this.asientosSeleccionados.length,
      specificData
    );

    // Aplicar descuentos si corresponde
    if (this.tieneDescuentoSocial) {
      // Aplicar descuento social
      this.cartService.applyPromoCode('SOCIAL');
    }

    if (this.tieneDescuentoPeliRandom) {
      // Aplicar descuento PeliRandom
      this.cartService.applyPromoCode('PELIRANDOM');
    }

    // Abrir el modal
    this.showCheckoutModal = true;
  }

  // Método para cerrar el checkout modal
  closeCheckoutModal(): void {
    this.showCheckoutModal = false;
  }

  // Método para manejar orden completada
  onOrderCompleted(order: Order): void {
    console.log('Orden completada:', order);
    this.compraConfirmada = true;
    this.showCheckoutModal = false;

    // Generar PDF automáticamente
    this.generatePurchaseReceipt(order);
  }

  // Método para manejar orden fallida
  onOrderFailed(error: string): void {
    console.error('Error en la orden:', error);
    alert('Error al procesar la compra: ' + error);
  }

  // Actualizar el método para avanzar al paso 3 y abrir checkout
  goToCheckout(): void {
    this.currentStep = 3;
    this.openCheckoutModal();
  }
}
