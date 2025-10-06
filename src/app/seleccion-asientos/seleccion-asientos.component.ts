import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApipeliculasService } from '../service/apipeliculas.service';
import { FormsModule } from '@angular/forms';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { BackendService } from '../service/backend.service';

@Component({
  selector: 'app-seleccion-asientos',
  standalone: true,
  imports: [CommonModule, FormsModule], // Add FormsModule here
  templateUrl: './seleccion-asientos.component.html',
  styleUrls: ['./seleccion-asientos.component.css'],
})
export class SeleccionAsientosComponent implements OnInit {
  movieId: string | undefined;
  movieDetails: any;
  precioTotal: number = 0;
  compraConfirmada: boolean = false; // Cambiar a verdadero una vez que la compra esté confirmada
  esEstreno: boolean = false;

  // Filas de asientos
  fila1 = this.generarAsientos('A', 5, 5000);
  fila2 = this.generarAsientos('B', 5, 5000);
  fila3 = this.generarAsientos('C', 5, 5000);

  // Almacena asientos seleccionados
  asientosSeleccionados: any = [];

  // Sucursales y opciones de pago
  sucursales: any = [];
  sucursalSeleccionada: string | null = null;
  modoPago: string | null = null;
  horarioSeleccionado: any = []; // Nuevo campo para horario
  diaCompra: string = new Date().toLocaleDateString(); // Fecha actual de la compra
  horaCompra: string = new Date().toLocaleTimeString(); // Hora de la compra
  sucursalCompletaHorarios: any = [];
  horariosPorSucursal: any = [];
  asientosFiltrados: any = [];
  filasAsientos: any[][] = [];

  // QR code
  qrCodeDataUrl: string = ''; // URL del código QR

  private apiMovieService = inject(ApipeliculasService);
  private router = inject(Router); // Inyectamos Router para la redirección

  constructor(
    private route: ActivatedRoute,
    private backendService: BackendService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.movieId = params.get('id') as string;
      if (this.movieId) {
        this.obtenerDetallesDePelicula(this.movieId);
      }
    });
    this.generaSucursal();
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
  }

  actualizarPrecios(): void {
    this.precioTotal = this.asientosSeleccionados.reduce(
      (total: any, asiento: any) => total + 10000,
      0
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
    });
  }

  generarFilas() {
    const chunkSize = 15;
    this.filasAsientos = [];
    for (let i = 0; i < this.asientosFiltrados.length; i += chunkSize) {
      this.filasAsientos.push(this.asientosFiltrados.slice(i, i + chunkSize));
    }
  }
  onHorarioChange(e: any) {
    this.asientosFiltrados = this.sucursalCompletaHorarios.filter(
      (item: any) => item.HORARIO === e
    );
    this.generarFilas();
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
}
