import { Component, inject, OnInit } from '@angular/core';
import { ApipeliculasService } from '../service/apipeliculas.service';  // Ajusta la ruta según sea necesario
import { CommonModule } from '@angular/common'; // Importa CommonModule
import { Router } from '@angular/router'; // Asegúrate de importar Router

@Component({
  selector: 'app-compra-entradas',
  standalone: true,
  imports: [CommonModule],  // Agrega CommonModule aquí en una línea separada
  templateUrl: './compra-entradas.component.html',
  styleUrls: ['./compra-entradas.component.css']
})
export class CompraEntradasComponent implements OnInit {

  peliculas: any[] = [];          // Array de películas populares
  detallesPelicula: any = null;   // Detalles de la película seleccionada
  peliculaSeleccionada: number | null = null;
  selectedMovieId: number | null = null; // Agregamos este campo para almacenar la película seleccionada

  tokenrequest:string ="";

  // Inyectamos el servicio para acceder a las funciones de la API
  private apiMovieService = inject(ApipeliculasService);
  private router = inject(Router);  // Inyectamos Router correctamente

  constructor() {
    this.obtenerPeliculasPopulares();
  }

  ngOnInit(): void {
    let id = localStorage.getItem("id");
    
    if (id) {
      console.log("ID almacenado:", id);
    }else{
      this.apiMovieService.gettoken().subscribe({
        next: (data: any) => {
          this.tokenrequest = data.request_token;
          console.log(data.request_token);
        
          this.apiMovieService.postvalidate(this.tokenrequest).subscribe({
            next:(data: any) => {
              this.apiMovieService.postconvetir(this.tokenrequest).subscribe({
                next:(data: any) => {
                  console.log(data);
                  localStorage.setItem("id", data.session_id);
                  this.apiMovieService.postcrearlista(data.session_id).subscribe({
                    next:(data: any) => {
                      console.log('lista')
                      console.log(data);localStorage.setItem("idlist", data.id);
            
                    },error: (error) => {
                      console.log(error);
                    }
                  })

                },error: (error) => {
                  console.log(error);
                }
              })
            },error: (error) => {
              console.log(error);
            }
          })
        },error: (error) => {
          console.log(error);
        }
      })
    }
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
    this.selectedMovieId = id;  // Aseguramos que selectedMovieId tenga el id correcto
    
    // Espera a que el DOM se actualice antes de hacer el desplazamiento
    setTimeout(() => {
      const detallesDiv = document.getElementById('detalles-pelicula');
      console.log('Detalles div:', detallesDiv);
      if (detallesDiv) {
        detallesDiv.scrollIntoView({ behavior: 'smooth' });
      }
    }, 500);  // Ajusta el tiempo si es necesario
  });
}

  
  

  // Función para simular la compra de entradas
  comprarEntradas() {
    console.log("Comprar entradas!!");
    // Verificamos si hay una película seleccionada antes de redirigir
    if (this.selectedMovieId) {
      console.log("Primer IF!!");
      console.log(this.selectedMovieId);
      // Redirige a la página de selección de asientos pasando el id de la película
      this.router.navigate(['/seleccion-asientos', this.selectedMovieId]);
    } else {
      console.log("Segundo IF!!");
      console.error('No se ha seleccionado ninguna película');
    }
  }

}
