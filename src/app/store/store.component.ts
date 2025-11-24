import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../service/cart.service';
import { AuthService } from '../service/auth.service';
import { UnifiedCheckoutComponent } from '../unified-checkout/unified-checkout.component';

// Interfaces para el store
interface StoreProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  featured?: boolean;
}

interface CartItem {
  product: StoreProduct;
  quantity: number;
}

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
}

@Component({
  selector: 'app-store',
  standalone: true,
  imports: [CommonModule, FormsModule, UnifiedCheckoutComponent],
  templateUrl: './store.component.html',
  styleUrl: './store.component.css',
})
export class StoreComponent implements OnInit {
  // Servicios
  private cartService = inject(CartService);
  private authService = inject(AuthService);

  // Estado de autenticación
  isAuthenticated = false;
  mensaje: string = '';

  // Propiedades para unified checkout
  showCheckoutModal = false;

  // Estado del componente (para compatibilidad local)
  products: StoreProduct[] = [];
  filteredProducts: StoreProduct[] = [];
  cart: CartItem[] = [];
  showCart = false;
  showCheckout = false;
  isProcessing = false;

  // Filtros y búsqueda
  selectedCategory = 'all';
  searchTerm = '';
  categories = [
    'all',
    'ropa',
    'accesorios',
    'coleccionables',
    'posters',
    'libros',
  ];

  // Información del cliente
  customerInfo: CustomerInfo = {
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
  };

  // Método de pago
  paymentMethod = 'credit-card';
  cardNumber = '';
  cardExpiry = '';
  cardCvv = '';
  cardName = '';

  // Cantidades temporales por producto (antes de agregar al carrito)
  productQuantities: { [key: number]: number } = {};

  ngOnInit() {
    this.loadProducts();
    this.loadCart();
    // Verificar autenticación
    this.authService.isAuthenticated$.subscribe((data) => {
      this.isAuthenticated = data.isAuthenticated;
    });
  }

  loadProducts() {
    // Catálogo de productos del store
    this.products = [
      {
        id: 1,
        name: 'Remera CinemaLand American Style',
        description: 'Remera estilo americano CinemaLand',
        price: 35000,
        image: 'assets/images/remera.png',
        category: 'ropa',
        stock: 25,
        featured: true,
      },
      {
        id: 2,
        name: 'Gorra Snapback CinemaLand',
        description: 'Gorra ajustable con bordado premium de CinemaLand',
        price: 28000,
        image: 'assets/images/gorra.png',
        category: 'accesorios',
        stock: 15,
      },
      {
        id: 3,
        name: 'Funko Pop Cinema Character',
        description:
          'Figura coleccionable exclusiva de Oscar, la mascota de CinemaLand',
        price: 42000,
        image: 'assets/images/funko-oscar.png',
        category: 'coleccionables',
        stock: 12,
        featured: true,
      },
      {
        id: 4,
        name: 'Poster de Oscar de CinemaLand',
        description: 'Poster de edición limitada de Oscar - Tamaño A2',
        price: 18000,
        image: 'assets/images/poster.png',
        category: 'posters',
        stock: 30,
      },
      {
        id: 5,
        name: 'Hoodie Cinemaland Premium',
        description: 'Buzo con capucha premium, calidad superior',
        price: 65000,
        image: 'assets/images/buzo.png',
        category: 'ropa',
        stock: 18,
        featured: true,
      },
      {
        id: 6,
        name: 'Taza Térmica CinemaLand',
        description: 'Taza térmica de acero inoxidable con diseño exclusivo',
        price: 22000,
        image: 'assets/images/taza.png',
        category: 'accesorios',
        stock: 40,
      },
      {
        id: 7,
        name: 'Libro CinemaLand: Historia del Cine',
        description: 'Edición especial con fotos exclusivas y entrevistas',
        price: 52000,
        image: 'assets/images/libro.png',
        category: 'libros',
        stock: 20,
      },
      {
        id: 8,
        name: 'Collar Oscar de CinemaLand',
        description: 'Collar con dije de la mascota oficial Oscar',
        price: 19000,
        image: 'assets/images/collar.png',
        category: 'accesorios',
        stock: 35,
      },
      {
        id: 9,
        name: 'Cuadro Arte Cinematográfico',
        description: 'Cuadro enmarcado con arte original inspirado en el cine',
        price: 89000,
        image: 'assets/images/cuadro.png',
        category: 'coleccionables',
        stock: 8,
      },
      {
        id: 10,
        name: 'Set de Pins Coleccionables',
        description: 'Set de 6 pins metálicos de géneros cinematográficos',
        price: 15000,
        image: 'assets/images/pins.png',
        category: 'coleccionables',
        stock: 50,
      },
    ];

    this.filteredProducts = [...this.products];
  }

  loadCart() {
    const savedCart = localStorage.getItem('cinemaland-store-cart');
    if (savedCart) {
      this.cart = JSON.parse(savedCart);
    }
  }

  saveCart() {
    localStorage.setItem('cinemaland-store-cart', JSON.stringify(this.cart));
  }

  filterProducts() {
    this.filteredProducts = this.products.filter((product) => {
      const matchesCategory =
        this.selectedCategory === 'all' ||
        product.category === this.selectedCategory;
      const matchesSearch =
        product.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        product.description
          .toLowerCase()
          .includes(this.searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }

  addToCart(product: StoreProduct) {
    // Verificar autenticación
    if (!this.isAuthenticated) {
      this.mensaje = 'Debes iniciar sesión para agregar productos al carrito';
      setTimeout(() => {
        this.mensaje = '';
      }, 5000);
      return;
    }

    const quantity = this.productQuantities[product.id] || 1;
    const existingItem = this.cart.find(
      (item) => item.product.id === product.id
    );

    if (existingItem) {
      if (existingItem.quantity + quantity <= product.stock) {
        existingItem.quantity += quantity;
      } else {
        alert('No hay más stock disponible de este producto');
        return;
      }
    } else {
      if (quantity <= product.stock) {
        this.cart.push({ product, quantity });
      } else {
        alert('No hay suficiente stock disponible');
        return;
      }
    }

    // También agregar al CartService para unified-checkout
    this.cartService.addToCart(
      {
        id: product.id.toString(),
        name: product.name,
        description: product.description,
        price: product.price,
        image: product.image,
        category: 'store',
      },
      quantity
    );

    // Resetear cantidad temporal
    this.productQuantities[product.id] = 1;

    this.saveCart();
    this.showNotification(`${product.name} agregado al carrito`);
  }

  removeFromCart(productId: number) {
    this.cart = this.cart.filter((item) => item.product.id !== productId);

    // También remover del CartService
    // Buscar el item correcto en el CartService
    const cartItems = this.cartService.getCart();
    const itemToRemove = cartItems.find(
      (item: any) =>
        item.product.category === 'store' &&
        item.product.id === productId.toString()
    );

    if (itemToRemove) {
      this.cartService.removeFromCart(itemToRemove.id);
    }

    this.saveCart();
    this.showNotification('Producto eliminado del carrito');
  }

  updateQuantity(productId: number, quantity: number) {
    const item = this.cart.find((item) => item.product.id === productId);
    if (item) {
      if (quantity <= 0) {
        this.removeFromCart(productId);
      } else if (quantity <= item.product.stock) {
        item.quantity = quantity;

        // También actualizar en CartService
        const cartItems = this.cartService.getCart();
        const serviceItem = cartItems.find(
          (cartItem: any) =>
            cartItem.product.category === 'store' &&
            cartItem.product.id === productId.toString()
        );

        if (serviceItem) {
          this.cartService.updateQuantity(serviceItem.id, quantity);
        }

        this.saveCart();
      } else {
        alert('Cantidad solicitada supera el stock disponible');
      }
    }
  }

  getCartTotal(): number {
    // Priorizar CartService si tiene productos, sino usar carrito local
    const cartServiceTotal = this.cartService.getCartTotal();
    return cartServiceTotal > 0
      ? cartServiceTotal
      : this.cart.reduce(
          (total, item) => total + item.product.price * item.quantity,
          0
        );
  }

  getCartItemCount(): number {
    // Priorizar CartService si tiene productos, sino usar carrito local
    const cartServiceCount = this.cartService.getCartItemCount();
    return cartServiceCount > 0
      ? cartServiceCount
      : this.cart.reduce((count, item) => count + item.quantity, 0);
  }

  // Métodos específicos para el carrito local (para el floating cart)
  getLocalCartTotal(): number {
    return this.cart.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
  }

  getLocalCartItemCount(): number {
    return this.cart.reduce((count, item) => count + item.quantity, 0);
  }

  toggleCart() {
    this.showCart = !this.showCart;
  }

  startCheckout() {
    if (this.cart.length === 0 && this.cartService.getCartItemCount() === 0) {
      alert('El carrito está vacío');
      return;
    }
    this.showCart = false;
    // Usar unified-checkout en lugar del checkout interno
    this.openUnifiedCheckout();
  }

  cancelCheckout() {
    this.showCheckout = false;
    this.resetCustomerInfo();
  }

  resetCustomerInfo() {
    this.customerInfo = {
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      postalCode: '',
    };
    this.paymentMethod = 'credit-card';
    this.cardNumber = '';
    this.cardExpiry = '';
    this.cardCvv = '';
    this.cardName = '';
  }

  formatCardNumber(event: any) {
    let value = event.target.value.replace(/\s/g, '').replace(/[^0-9]/g, '');
    let formattedValue = value.replace(/(.{4})/g, '$1 ').trim();
    this.cardNumber = formattedValue;
    event.target.value = formattedValue;
  }

  formatCardExpiry(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    this.cardExpiry = value;
    event.target.value = value;
  }

  isFormValid(): boolean {
    const customerValid = !!(
      this.customerInfo.name &&
      this.customerInfo.email &&
      this.customerInfo.phone &&
      this.customerInfo.address
    );

    if (this.paymentMethod === 'credit-card') {
      const cardValid = !!(
        this.cardName &&
        this.cardNumber.length >= 19 &&
        this.cardExpiry.length === 5 &&
        this.cardCvv.length >= 3
      );
      return customerValid && cardValid;
    }

    return customerValid;
  }

  async processOrder() {
    if (!this.isFormValid()) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    this.isProcessing = true;

    try {
      // Simular procesamiento de pago
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Generar PDF de compra
      await this.generatePurchaseReceipt();

      // Limpiar carrito
      this.cart = [];
      this.saveCart();

      // Cerrar checkout
      this.showCheckout = false;
      this.resetCustomerInfo();

      alert(
        '¡Compra realizada exitosamente! Se ha enviado el comprobante a tu email.'
      );
    } catch (error) {
      console.error('Error procesando la compra:', error);
      alert('Error al procesar la compra. Por favor intente nuevamente.');
    } finally {
      this.isProcessing = false;
    }
  }

  async generatePurchaseReceipt() {
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
      pdf.text('🎬 CINEMALAND STORE', pageWidth / 2, 25, { align: 'center' });

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
      yPos += 8;
      pdf.text(`Email: ${this.customerInfo.email}`, 20, yPos);
      yPos += 8;
      pdf.text(`Teléfono: ${this.customerInfo.phone}`, 20, yPos);
      yPos += 8;
      pdf.text(
        `Dirección: ${this.customerInfo.address}, ${this.customerInfo.city}`,
        20,
        yPos
      );

      // Línea separadora
      yPos += 15;
      pdf.setDrawColor(200, 200, 200);
      pdf.line(20, yPos, pageWidth - 20, yPos);

      // Productos comprados
      yPos += 15;
      pdf.setFont('helvetica', 'bold');
      pdf.text('PRODUCTOS COMPRADOS:', 20, yPos);

      yPos += 15;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Producto', 20, yPos);
      pdf.text('Cant.', 120, yPos);
      pdf.text('Precio Unit.', 140, yPos);
      pdf.text('Total', 170, yPos);

      yPos += 5;
      pdf.setDrawColor(0, 0, 0);
      pdf.line(20, yPos, pageWidth - 20, yPos);

      // Lista de productos
      yPos += 10;
      pdf.setFont('helvetica', 'normal');
      this.cart.forEach((item) => {
        pdf.text(item.product.name, 20, yPos);
        pdf.text(item.quantity.toString(), 120, yPos);
        pdf.text(`$${item.product.price.toLocaleString('es-AR')}`, 140, yPos);
        pdf.text(
          `$${(item.product.price * item.quantity).toLocaleString('es-AR')}`,
          170,
          yPos
        );
        yPos += 8;
      });

      // Total
      yPos += 10;
      pdf.setDrawColor(0, 0, 0);
      pdf.line(130, yPos, pageWidth - 20, yPos);
      yPos += 10;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text(
        `TOTAL: $${this.getCartTotal().toLocaleString('es-AR')}`,
        170,
        yPos,
        { align: 'right' }
      );

      // Información adicional
      yPos += 25;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(
        `Fecha de compra: ${new Date().toLocaleDateString('es-AR')}`,
        20,
        yPos
      );
      yPos += 6;
      pdf.text(
        `Método de pago: ${
          this.paymentMethod === 'credit-card'
            ? 'Tarjeta de Crédito'
            : 'Mercado Pago'
        }`,
        20,
        yPos
      );
      yPos += 6;
      pdf.text(
        'Número de orden: ' +
          Math.random().toString(36).substr(2, 9).toUpperCase(),
        20,
        yPos
      );

      // Generar código QR
      const qrData = `CINEMALAND STORE - Compra: ${Math.random()
        .toString(36)
        .substr(2, 9)
        .toUpperCase()} - Total: $${this.getCartTotal()}`;
      const qrCodeDataURL = await QRCode.toDataURL(qrData, { width: 100 });

      // Agregar QR al PDF
      pdf.addImage(qrCodeDataURL, 'PNG', pageWidth - 60, yPos - 25, 40, 40);

      // Pie de página
      yPos += 40;
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(
        '¡Gracias por tu compra en Cinemaland Store!',
        pageWidth / 2,
        yPos,
        { align: 'center' }
      );
      pdf.text(
        'Conserva este comprobante para cualquier consulta.',
        pageWidth / 2,
        yPos + 5,
        { align: 'center' }
      );

      // Descargar PDF
      pdf.save(`cinemaland-store-compra-${Date.now()}.pdf`);
    } catch (error) {
      console.error('Error generando el PDF:', error);
      throw error;
    }
  }

  showNotification(message: string) {
    // Simple notification - podrías mejorar esto con un servicio de notificaciones
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #28a745;
      color: white;
      padding: 1rem;
      border-radius: 5px;
      z-index: 10001;
      animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  // Actualizar cantidad temporal (antes de agregar al carrito)
  updateProductQuantity(productId: number, quantity: number) {
    this.productQuantities[productId] = Math.max(1, quantity);
  }

  // Obtener cantidad temporal del producto
  getProductQuantity(productId: number): number {
    return this.productQuantities[productId] || 1;
  }

  getCategoryDisplayName(category: string): string {
    const categoryNames: { [key: string]: string } = {
      all: 'Todas las Categorías',
      ropa: 'Ropa',
      accesorios: 'Accesorios',
      coleccionables: 'Coleccionables',
      posters: 'Posters',
      libros: 'Libros',
    };
    return categoryNames[category] || category;
  }

  // Métodos para unified-checkout
  openUnifiedCheckout() {
    if (this.cart.length === 0) {
      alert('Tu carrito está vacío');
      return;
    }
    this.showCheckoutModal = true;
  }

  closeCheckoutModal() {
    this.showCheckoutModal = false;
  }

  onOrderCompleted(order: any) {
    // Limpiar carrito después de la compra exitosa
    this.cart = [];
    this.showCheckoutModal = false;
    this.saveCart();

    alert('¡Compra realizada con éxito!');
  }

  onOrderFailed(error: any) {
    console.error('Error en la compra:', error);
    alert('Error al procesar la compra. Por favor intenta nuevamente.');
  }
}
