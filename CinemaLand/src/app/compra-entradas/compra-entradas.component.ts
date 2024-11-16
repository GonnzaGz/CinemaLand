import { Component, inject } from '@angular/core';
import { ApipeliculasService } from '../service/apipeliculas.service';  // Ajusta la ruta según sea necesario
import { CommonModule } from '@angular/common'; // Importa CommonModule

@Component({
  selector: 'app-compra-entradas',
  standalone: true,
  imports: [CommonModule],  // Agrega CommonModule aquí en una línea separada
  templateUrl: './compra-entradas.component.html',
  styleUrls: ['./compra-entradas.component.css']
})
export class CompraEntradasComponent {

  peliculas: any[] = [];          // Array de películas populares
  detallesPelicula: any = null;   // Detalles de la película seleccionada
  peliculaSeleccionada: number | null = null;

  // Inyectamos el servicio para acceder a las funciones de la API
  private apiMovieService = inject(ApipeliculasService);

  constructor() {
    this.obtenerPeliculasPopulares();
  }

  // Función para obtener las películas populares
  obtenerPeliculasPopulares() {
    this.apiMovieService.getPopularMovies().subscribe((data: any) => {
      this.peliculas = data.results;  // Guardamos las películas en el array
    });
  }

  // Función para ver los detalles de la película seleccionada
  verDetalles(id: number) {
    this.apiMovieService.getDetalleMovie(id.toString()).subscribe((data: any) => {
      this.detallesPelicula = data;  // Guardamos los detalles de la película
      this.peliculaSeleccionada = id;  // Guardamos el ID de la película seleccionada
    });
  }

  // Función para simular la compra de entradas
  comprarEntradas() {
    if (this.peliculaSeleccionada) {
      alert(`Compra de entradas para la película ${this.detallesPelicula.title} realizada con éxito!`);
    } else {
      alert('Por favor, selecciona una película para comprar entradas.');
    }
  }
}
