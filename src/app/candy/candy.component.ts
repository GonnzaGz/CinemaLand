import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../service/cart.service';
import { UnifiedCheckoutComponent } from '../unified-checkout/unified-checkout.component';
import jsPDF from 'jspdf';
import * as QRCode from 'qrcode';

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

@Component({
  selector: 'app-candy',
  standalone: true,
  imports: [CommonModule, FormsModule, UnifiedCheckoutComponent],
  templateUrl: './candy.component.html',
  styleUrl: './candy.component.css',
})
export class CandyComponent implements OnInit {
  // Productos disponibles
  products: Product[] = [
    {
      id: 1,
      name: 'Combo Dulce Grande',
      price: 2800,
      image: 'assets/images/combo-dulce.jpg',
      category: 'combos',
      description: 'Pochoclos grandes + 2 gaseosas + dulces',
    },
    {
      id: 2,
      name: 'Pochoclos Caramelo',
      price: 1500,
      image: 'assets/images/popcorn-caramel.jpg',
      category: 'pochoclos',
      description: 'Pochoclos con caramelo salado',
    },
    {
      id: 3,
      name: 'Nachos Supremos',
      price: 2200,
      image: 'assets/images/nachos.jpg',
      category: 'combos',
      description: 'Nachos con queso y jalapeños',
    },
    {
      id: 4,
      name: 'Gaseosa 500ml',
      price: 800,
      image: 'assets/images/soda.jpg',
      category: 'bebidas',
      description: 'Gaseosa fría de 500ml',
    },
    {
      id: 5,
      name: 'Combo Pareja',
      price: 3500,
      image: 'assets/images/combo-pareja.jpg',
      category: 'combos',
      description: 'Para compartir: pochoclos XL + 2 gaseosas + dulces',
    },
    {
      id: 6,
      name: 'Box Dulces Mixto',
      price: 1200,
      image: 'assets/images/candy-box.jpg',
      category: 'dulces',
      description: 'Variedad de dulces premium',
    },
  ];

  // Servicios
  private cartService = inject(CartService);

  // Propiedades para unified checkout
  showCheckoutModal = false;

  // Estado del carrito local (para compatibilidad con productos de candy)
  cart: CartItem[] = [];
  selectedCategory: string = 'todos';
  promoCode: string = '';
  customerName: string = '';
  customerEmail: string = '';
  showCheckout: boolean = false;

  // Códigos promocionales
  promoCodes = {
    CINE20: 0.2,
    DULCE15: 0.15,
    PROMO10: 0.1,
  };

  appliedDiscount: number = 0;

  ngOnInit() {
    this.loadCartFromStorage();
    // Limpiar carrito del CartService al inicializar para evitar conflictos
    // this.cartService.clearCart(); // Descomenta si necesitas limpiar
  }

  // Filtrar productos por categoría
  get filteredProducts(): Product[] {
    if (this.selectedCategory === 'todos') {
      return this.products;
    }
    return this.products.filter(
      (product) => product.category === this.selectedCategory
    );
  }

  // Agregar producto al carrito
  addToCart(product: Product, quantity: number = 1) {
    // Agregar al carrito local para compatibilidad
    const existingItem = this.cart.find(
      (item) => item.product.id === product.id
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.cart.push({ product, quantity });
    }

    // También agregar al CartService para unified-checkout
    this.cartService.addToCart(
      {
        id: product.id.toString(),
        name: product.name,
        description: product.description,
        price: product.price,
        image: product.image || 'assets/images/default-product.jpg',
        category: 'candy',
        type: 'snack',
      },
      quantity
    );

    this.saveCartToStorage();
    console.log('Producto agregado al carrito:', product.name); // Debug
  }

  // Remover del carrito
  removeFromCart(productId: number) {
    this.cart = this.cart.filter((item) => item.product.id !== productId);
    this.saveCartToStorage();
  }

  // Actualizar cantidad
  updateQuantity(productId: number, quantity: number) {
    const item = this.cart.find((item) => item.product.id === productId);
    if (item) {
      item.quantity = Math.max(1, quantity);
      this.saveCartToStorage();
    }
  }

  // Aplicar código promocional
  applyPromoCode() {
    const code = this.promoCode.toUpperCase();
    if (this.promoCodes[code as keyof typeof this.promoCodes]) {
      this.appliedDiscount =
        this.promoCodes[code as keyof typeof this.promoCodes];
      alert(`¡Código aplicado! Descuento del ${this.appliedDiscount * 100}%`);
    } else {
      alert('Código promocional inválido');
    }
  }

  // Calcular subtotal
  get subtotal(): number {
    return this.cart.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
  }

  // Calcular descuento
  get discountAmount(): number {
    return this.subtotal * this.appliedDiscount;
  }

  // Calcular total
  get total(): number {
    return this.subtotal - this.discountAmount;
  }

  // Contar items en carrito
  get cartItemCount(): number {
    return this.cart.reduce((total, item) => total + item.quantity, 0);
  }

  // Proceder al checkout con unified-checkout
  proceedToCheckout() {
    if (this.cart.length === 0) {
      alert('Tu carrito está vacío');
      return;
    }
    this.showCheckoutModal = true;
  }

  // Métodos para unified-checkout
  closeCheckoutModal() {
    this.showCheckoutModal = false;
  }

  onOrderCompleted(order: any) {
    // Limpiar carrito después de la compra exitosa
    this.cart = [];
    this.appliedDiscount = 0;
    this.promoCode = '';
    this.showCheckoutModal = false;
    this.saveCartToStorage();

    alert('¡Compra realizada con éxito!');
  }

  onOrderFailed(error: any) {
    console.error('Error en la compra:', error);
    alert('Error al procesar la compra. Por favor intenta nuevamente.');
  }

  // Finalizar compra y generar PDF (método legacy - ya no se usa con unified-checkout)
  async finalizePurchase() {
    if (!this.customerName || !this.customerEmail) {
      alert('Por favor completa todos los campos');
      return;
    }

    try {
      await this.generatePDF();

      // Limpiar carrito después de la compra
      this.cart = [];
      this.appliedDiscount = 0;
      this.promoCode = '';
      this.customerName = '';
      this.customerEmail = '';
      this.showCheckout = false;
      this.saveCartToStorage();

      alert('¡Compra realizada con éxito! El ticket se ha descargado.');
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el ticket. Intenta nuevamente.');
    }
  }

  // Generar PDF con QR
  async generatePDF() {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = 30;

    // Header
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CINEMALAND - CANDY STORE', pageWidth / 2, yPosition, {
      align: 'center',
    });

    yPosition += 10;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Ticket de Compra', pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 20;

    // Información del cliente
    pdf.setFontSize(10);
    pdf.text(`Cliente: ${this.customerName}`, margin, yPosition);
    yPosition += 8;
    pdf.text(`Email: ${this.customerEmail}`, margin, yPosition);
    yPosition += 8;
    pdf.text(
      `Fecha: ${new Date().toLocaleDateString('es-AR')}`,
      margin,
      yPosition
    );
    yPosition += 8;
    pdf.text(
      `Hora: ${new Date().toLocaleTimeString('es-AR')}`,
      margin,
      yPosition
    );
    yPosition += 15;

    // Línea separadora
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Items del carrito
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PRODUCTOS', margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    this.cart.forEach((item) => {
      const productLine = `${item.quantity}x ${item.product.name}`;
      const priceLine = `$${(item.product.price * item.quantity).toLocaleString(
        'es-AR'
      )}`;

      pdf.text(productLine, margin, yPosition);
      pdf.text(priceLine, pageWidth - margin - 40, yPosition);
      yPosition += 8;

      if (item.product.description) {
        pdf.setFontSize(8);
        pdf.setTextColor(100);
        pdf.text(`  ${item.product.description}`, margin + 5, yPosition);
        pdf.setTextColor(0);
        pdf.setFontSize(10);
        yPosition += 6;
      }
      yPosition += 2;
    });

    yPosition += 10;
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Totales
    pdf.setFont('helvetica', 'normal');
    pdf.text(
      `Subtotal: $${this.subtotal.toLocaleString('es-AR')}`,
      margin,
      yPosition
    );
    yPosition += 8;

    if (this.appliedDiscount > 0) {
      pdf.text(
        `Descuento (${
          this.appliedDiscount * 100
        }%): -$${this.discountAmount.toLocaleString('es-AR')}`,
        margin,
        yPosition
      );
      yPosition += 8;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text(
      `TOTAL: $${this.total.toLocaleString('es-AR')}`,
      margin,
      yPosition
    );
    yPosition += 20;

    // Generar QR Code
    const qrData = `CINEMALAND-CANDY|${Date.now()}|${this.customerEmail}|${
      this.total
    }`;
    try {
      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        width: 100,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      pdf.addImage(qrCodeDataURL, 'PNG', pageWidth / 2 - 25, yPosition, 50, 50);
      yPosition += 60;

      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(
        'Escanea este código QR para validar tu compra',
        pageWidth / 2,
        yPosition,
        { align: 'center' }
      );
    } catch (error) {
      console.error('Error generando QR:', error);
    }

    // Footer
    yPosition += 20;
    pdf.setFontSize(8);
    pdf.text('Gracias por elegir CinemaLand', pageWidth / 2, yPosition, {
      align: 'center',
    });
    pdf.text(
      '¡Disfruta tu experiencia cinematográfica!',
      pageWidth / 2,
      yPosition + 8,
      { align: 'center' }
    );

    // Descargar PDF
    const fileName = `CinemaLand-Candy-${Date.now()}.pdf`;
    pdf.save(fileName);
  }

  // Guardar carrito en localStorage
  private saveCartToStorage() {
    localStorage.setItem('candyCart', JSON.stringify(this.cart));
  }

  // Cargar carrito desde localStorage
  private loadCartFromStorage() {
    const savedCart = localStorage.getItem('candyCart');
    if (savedCart) {
      this.cart = JSON.parse(savedCart);
    }
  }

  // Cancelar checkout
  cancelCheckout() {
    this.showCheckout = false;
  }

  // Cambiar categoría
  selectCategory(category: string) {
    this.selectedCategory = category;
  }

  // Obtener cantidad de producto en carrito
  getProductQuantity(productId: number): number {
    const item = this.cart.find((item) => item.product.id === productId);
    return item ? item.quantity : 0;
  }
}
