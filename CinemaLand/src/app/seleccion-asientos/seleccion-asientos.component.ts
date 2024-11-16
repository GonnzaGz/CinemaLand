import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router'; // Importa ActivatedRoute para obtener parámetros de la URL
import { CommonModule } from '@angular/common'; // Importa CommonModule para usar *ngIf y otras directivas
import { ApipeliculasService } from '../service/apipeliculas.service'; // Asegúrate de importar el servicio

@Component({
  selector: 'app-seleccion-asientos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seleccion-asientos.component.html',
  styleUrls: ['./seleccion-asientos.component.css']
})
export class SeleccionAsientosComponent implements OnInit {
  movieId: string | undefined;
  movieDetails: any;
  asientosDisponibles: number[] = [1, 2, 3, 4, 5, 6, 7, 8]; // Ejemplo de asientos
  asientosSeleccionados: number[] = [];

  // Inyectamos el servicio para obtener los detalles de la película
  private apiMovieService = inject(ApipeliculasService);

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    // Suscribirse al parámetro 'id' de la URL
    this.route.paramMap.subscribe(params => {
      this.movieId = params.get('id') as string;
      
      // Verifica si movieId está definido antes de hacer la llamada al servicio
      if (this.movieId) {
        this.obtenerDetallesDePelicula(this.movieId); // Llamar a la función para obtener los detalles de la película
      }
    });
  }
  

  obtenerDetallesDePelicula(id: string): void {
    // Llama al servicio para obtener los detalles de la película por ID
    this.apiMovieService.getDetalleMovie(id).subscribe(
      (data: any) => {
        this.movieDetails = data;  // Guarda los detalles de la película
        console.log(this.movieDetails); // Verifica que los detalles se están obteniendo correctamente
      },
      (error) => {
        console.error('Error al obtener detalles de la película:', error);
      }
    );
  }
  

  confirmarCompra(): void {
    console.log('Asientos seleccionados:', this.asientosSeleccionados);
    // Aquí puedes enviar los asientos seleccionados al backend o realizar otra acción
  }
}
