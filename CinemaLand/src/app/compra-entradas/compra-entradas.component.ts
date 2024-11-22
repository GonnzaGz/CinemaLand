import { Component, inject, OnInit } from '@angular/core'; // Importa las herramientas necesarias para crear el componente, inyectar dependencias y manejar el ciclo de vida de Angular.
import { ApipeliculasService } from '../service/apipeliculas.service'; // Importa el servicio que se conecta a la API de películas.
import { CommonModule } from '@angular/common'; // Importa el módulo común de Angular, que incluye directivas básicas como *ngFor y *ngIf.
import { Router } from '@angular/router'; // Importa el servicio de enrutamiento para navegar entre páginas.

// Decorador para configurar el componente
@Component({
  selector: 'app-compra-entradas', // Define el selector HTML que representa este componente.
  standalone: true, // Indica que este componente puede funcionar por sí solo.
  imports: [CommonModule], // Especifica los módulos que este componente necesita para funcionar.
  templateUrl: './compra-entradas.component.html', // Enlaza el archivo HTML que define la vista del componente.
  styleUrls: ['./compra-entradas.component.css'] // Enlaza el archivo CSS que define los estilos del componente.
})
export class CompraEntradasComponent implements OnInit { // Define la clase del componente y su implementación de la interfaz `OnInit`.

  peliculas: any[] = []; // Almacena la lista de películas populares obtenidas de la API.
  detallesPelicula: any = null; // Almacena los detalles de la película seleccionada.
  peliculaSeleccionada: number | null = null; // Guarda el ID de la película actualmente seleccionada.
  selectedMovieId: number | null = null; // Alternativa para guardar el ID de la película seleccionada.
  favoritos: any[] = []; // Almacena la lista de películas marcadas como favoritas por el usuario.

  tokenrequest: string = ""; // Almacena un token temporal usado en las peticiones a la API.

  private apiMovieService = inject(ApipeliculasService); // Inyecta el servicio de películas para usar sus métodos.
  private router = inject(Router); // Inyecta el servicio de enrutamiento para navegar entre páginas.

  constructor() {
    this.obtenerPeliculasPopulares(); // Llama al método para obtener las películas populares al construir el componente.
  }

  ngOnInit(): void { // Hook que se ejecuta cuando el componente está inicializado.
    let id = localStorage.getItem("id"); // Recupera el ID de sesión almacenado en localStorage.

    if (id) {
      console.log("ID almacenado:", id); // Si existe un ID, lo muestra en la consola.
    } else {
      this.apiMovieService.gettoken().subscribe({ // Si no existe un ID, obtiene un token de la API.
        next: (data: any) => {
          this.tokenrequest = data.request_token; // Almacena el token temporal recibido de la API.
          this.apiMovieService.postvalidate(this.tokenrequest).subscribe({ // Valida el token con otra llamada a la API.
            next: (data: any) => {
              this.apiMovieService.postconvetir(this.tokenrequest).subscribe({ // Convierte el token en una sesión.
                next: (data: any) => {
                  localStorage.setItem("id", data.session_id); // Almacena el ID de la sesión en localStorage.
                  this.apiMovieService.postcrearlista(data.session_id).subscribe({ // Crea una lista asociada a la sesión.
                    next: (data: any) => {
                      localStorage.setItem("idlist", data.id); // Almacena el ID de la lista en localStorage.
                    },
                    error: (error) => {
                      console.log(error); // Maneja errores durante la creación de la lista.
                    }
                  });
                },
                error: (error) => {
                  console.log(error); // Maneja errores durante la conversión del token.
                }
              });
            },
            error: (error) => {
              console.log(error); // Maneja errores durante la validación del token.
            }
          });
        },
        error: (error) => {
          console.log(error); // Maneja errores durante la obtención del token.
        }
      });
    }
  }

  obtenerPeliculasPopulares() { // Método para obtener las películas populares desde la API.
    this.apiMovieService.getPopularMovies().subscribe((data: any) => {
      this.peliculas = data.results; // Almacena los resultados obtenidos en la lista `peliculas`.
    });
  }

  verDetalles(id: number) { // Método para obtener y mostrar los detalles de una película específica.
    this.apiMovieService.getDetalleMovie(id.toString()).subscribe((data: any) => {
      this.detallesPelicula = data; // Almacena los detalles de la película seleccionada.
      this.peliculaSeleccionada = id; // Actualiza el ID de la película seleccionada.
      this.selectedMovieId = id; // También lo almacena en la variable `selectedMovieId`.

      setTimeout(() => { // Retraso para realizar un desplazamiento suave hacia la sección de detalles.
        const detallesDiv = document.getElementById('detalles-pelicula'); // Obtiene la referencia al contenedor de detalles.
        if (detallesDiv) {
          detallesDiv.scrollIntoView({ behavior: 'smooth' }); // Desplaza suavemente hacia el contenedor.
        }
      }, 500); // Retraso de 500 ms para asegurar que el contenedor esté listo.
    });
  }

  agregarAFavoritos(pelicula: any) { // Método para añadir una película a la lista de favoritos.
    const yaEstaEnFavoritos = this.favoritos.some(fav => fav.id === pelicula.id); // Verifica si la película ya está en favoritos.
    if (!yaEstaEnFavoritos) {
      this.favoritos.push(pelicula); // Si no está, la añade a la lista.
      console.log(`Película agregada a favoritos: ${pelicula.title}`); // Muestra un mensaje en la consola.
    } else {
      console.log(`La película ya está en favoritos: ${pelicula.title}`); // Informa si ya estaba en favoritos.
    }
  }

  eliminarDeFavoritos(id: number) { // Método para eliminar una película de la lista de favoritos.
    const pelicula = this.favoritos.find(pelicula => pelicula.id === id); // Busca la película en la lista por su ID.
    if (pelicula) {
      this.favoritos = this.favoritos.filter(pelicula => pelicula.id !== id); // Filtra la lista para eliminarla.
      console.log(`Película eliminada de favoritos: ${pelicula.title}`); // Muestra un mensaje en la consola.
    }
  }

  limpiarFavoritos() { // Método para vaciar completamente la lista de favoritos.
    this.favoritos = []; // Resetea la lista de favoritos.
    console.log('Todos los favoritos han sido eliminados'); // Muestra un mensaje en la consola.
  }

  comprarEntradas() { // Método para navegar a la página de selección de asientos.
    if (this.selectedMovieId) {
      this.router.navigate(['/seleccion-asientos', this.selectedMovieId]); // Navega pasando el ID de la película seleccionada.
    } else {
      console.error('No se ha seleccionado ninguna película'); // Muestra un error si no hay película seleccionada.
    }
  }
}
