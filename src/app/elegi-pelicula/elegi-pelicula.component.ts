import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ApipeliculasService } from '../service/apipeliculas.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../service/auth.service';
import { FavoritosService } from '../service/favoritos.service';
import { MovieDetailsComponent } from '../movie-details/movie-details.component';

@Component({
  selector: 'app-elegi-pelicula',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './elegi-pelicula.component.html',
  styleUrl: './elegi-pelicula.component.css',
})
export class ElegiPeliculaComponent implements OnInit, OnDestroy {
  peliculas: any[] = [];
  peliculasMostradas: number = 30;
  mostrarTodasLasPeliculas: boolean = false;
  isAuthenticated: boolean = true;
  peliculasfavoritas: any[] = [];

  // Propiedades para filtros
  filtroFormato: string = 'todos';
  filtroIdioma: string = 'todos';
  filtroEdad: string = 'todos';

  private apipeliculasservice = inject(ApipeliculasService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private favoritosService = inject(FavoritosService);

  ngOnInit() {
    this.cargarPeliculasEnCartelera();
    this.cargarFavoritos();
  }

  ngOnDestroy() {
    // Cleanup si es necesario
  }

  cargarPeliculasEnCartelera() {
    // Cargar películas recientes de múltiples categorías para tener más variedad
    const categorias = ['28', '35', '18', '27', '10749', '53', '12', '16']; // Acción, Comedia, Drama, Terror, Romance, Thriller, Aventura, Animación
    let todasLasPeliculas: any[] = [];
    let categoriasCompletadas = 0;

    // Función para procesar todas las películas cuando se completen todas las categorías
    const procesarPeliculas = () => {
      if (categoriasCompletadas === categorias.length) {
        // Eliminar duplicados basado en ID
        const peliculasUnicas = todasLasPeliculas.filter(
          (pelicula: any, index: number, self: any[]) =>
            index === self.findIndex((p: any) => p.id === pelicula.id)
        );

        // Filtrar solo películas y agregarles propiedades necesarias
        this.peliculas = peliculasUnicas
          .filter((pelicula: any) => {
            // Filtrar solo películas (no TV shows) si tiene media_type
            if (pelicula.media_type === 'tv') return false;

            // Debe tener título e imagen y rating válido
            return (
              pelicula.title &&
              pelicula.poster_path &&
              pelicula.vote_average > 0
            );
          })
          .map((pelicula: any) => ({
            ...pelicula,
            clasificacionEdad: this.getClasificacionEdadSimulada(pelicula.id),
            esDestacada: true,
          }))
          .sort((a: any, b: any) => {
            // Ordenar por múltiples criterios de calidad
            // 1. Primero por popularidad (popularity)
            if (b.popularity !== a.popularity) {
              return b.popularity - a.popularity;
            }
            // 2. Luego por rating (vote_average)
            if (b.vote_average !== a.vote_average) {
              return b.vote_average - a.vote_average;
            }
            // 3. Finalmente por número de votos (vote_count)
            return b.vote_count - a.vote_count;
          })
          .slice(0, 60); // Limitamos a 60 películas de mejor calidad

        console.log('Películas cargadas:', this.peliculas.length);
        console.log('Primera película:', this.peliculas[0]);
      }
    };

    // Cargar películas populares primero como base
    this.apipeliculasservice.getPopularMovies().subscribe({
      next: (data) => {
        todasLasPeliculas = [...(data.results || [])];

        // Luego cargar estrenos por categorías
        categorias.forEach((categoria) => {
          this.apipeliculasservice
            .getEstrenosPorCategoria(categoria)
            .subscribe({
              next: (data) => {
                todasLasPeliculas = [
                  ...todasLasPeliculas,
                  ...(data.results || []),
                ];
                categoriasCompletadas++;
                procesarPeliculas();
              },
              error: (error) => {
                console.error(`Error al cargar categoría ${categoria}:`, error);
                categoriasCompletadas++;
                procesarPeliculas();
              },
            });
        });
      },
      error: (error) => {
        console.error('Error al cargar películas populares:', error);
        // Si falla, al menos intentar cargar algunas categorías
        categorias.forEach((categoria) => {
          this.apipeliculasservice
            .getEstrenosPorCategoria(categoria)
            .subscribe({
              next: (data) => {
                todasLasPeliculas = [
                  ...todasLasPeliculas,
                  ...(data.results || []),
                ];
                categoriasCompletadas++;
                procesarPeliculas();
              },
              error: (error) => {
                console.error(`Error al cargar categoría ${categoria}:`, error);
                categoriasCompletadas++;
                procesarPeliculas();
              },
            });
        });
      },
    });
  }

  cargarFavoritos() {
    // Cargar favoritos desde localStorage
    try {
      const favoritosGuardados = localStorage.getItem('peliculasFavoritas');
      this.peliculasfavoritas = favoritosGuardados
        ? JSON.parse(favoritosGuardados)
        : [];
    } catch (error) {
      console.error('Error al cargar favoritos:', error);
      this.peliculasfavoritas = [];
    }
  }

  guardarFavoritos() {
    try {
      localStorage.setItem(
        'peliculasFavoritas',
        JSON.stringify(this.peliculasfavoritas)
      );
    } catch (error) {
      console.error('Error al guardar favoritos:', error);
    }
  }

  getClasificacionEdadSimulada(movieId: number): string {
    const clasificaciones = ['ATP', '+13', '+16', '+18'];
    return clasificaciones[movieId % 4];
  }

  esFavorita(peliculaId: number): boolean {
    return this.peliculasfavoritas.some((fav) => fav.id === peliculaId);
  }

  toggleFavorito(pelicula: any, event: Event) {
    event.stopPropagation();

    if (this.esFavorita(pelicula.id)) {
      // Eliminar de favoritos
      this.peliculasfavoritas = this.peliculasfavoritas.filter(
        (fav) => fav.id !== pelicula.id
      );
    } else {
      // Agregar a favoritos
      this.peliculasfavoritas.push(pelicula);
    }

    this.guardarFavoritos();
  }

  verDetalles(peliculaId: number) {
    this.router.navigate(['/movie-details', peliculaId]);
  }

  comprarEntradas(peliculaId: number) {
    this.router.navigate(['/seleccion-asientos', peliculaId]);
  }

  // Métodos para filtros
  setFiltroFormato(formato: string) {
    this.filtroFormato = formato;
    this.resetearVista();
  }

  setFiltroIdioma(idioma: string) {
    this.filtroIdioma = idioma;
    this.resetearVista();
  }

  setFiltroEdad(edad: string) {
    this.filtroEdad = edad;
    this.resetearVista();
  }

  resetearVista() {
    this.mostrarTodasLasPeliculas = false;
    // Opcional: scroll hacia arriba cuando se cambia un filtro
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  limpiarFiltros() {
    this.filtroFormato = 'todos';
    this.filtroIdioma = 'todos';
    this.filtroEdad = 'todos';
    this.resetearVista();
  }

  get filtrosAplicados(): boolean {
    return (
      this.filtroFormato !== 'todos' ||
      this.filtroIdioma !== 'todos' ||
      this.filtroEdad !== 'todos'
    );
  }

  get textoFiltrosAplicados(): string {
    const filtros = [];
    if (this.filtroFormato !== 'todos')
      filtros.push(`Formato: ${this.filtroFormato}`);
    if (this.filtroIdioma !== 'todos')
      filtros.push(`Idioma: ${this.filtroIdioma}`);
    if (this.filtroEdad !== 'todos') filtros.push(`Edad: ${this.filtroEdad}`);
    return filtros.join(', ');
  }

  get peliculasFiltradas() {
    let peliculasFiltradas = [...this.peliculas];

    // Aplicar filtros por formato
    if (this.filtroFormato !== 'todos') {
      peliculasFiltradas = peliculasFiltradas.filter((pelicula: any) => {
        // Simular diferentes formatos basado en el ID de la película
        const formatos =
          pelicula.id % 4 === 0
            ? ['2D', '3D']
            : pelicula.id % 3 === 0
            ? ['2D', 'IMAX']
            : pelicula.id % 5 === 0
            ? ['3D', 'IMAX']
            : ['2D'];
        return formatos.includes(this.filtroFormato);
      });
    }

    // Aplicar filtros por idioma
    if (this.filtroIdioma !== 'todos') {
      peliculasFiltradas = peliculasFiltradas.filter((pelicula: any) => {
        // Simular diferentes idiomas basado en el ID de la película
        const idiomas =
          pelicula.id % 5 === 0
            ? ['español', 'subtitulado']
            : pelicula.id % 3 === 0
            ? ['ingles', 'subtitulado']
            : pelicula.id % 2 === 0
            ? ['español']
            : ['subtitulado'];
        return idiomas.includes(this.filtroIdioma);
      });
    }

    // Aplicar filtros por edad
    if (this.filtroEdad !== 'todos') {
      peliculasFiltradas = peliculasFiltradas.filter((pelicula: any) => {
        return pelicula.clasificacionEdad === this.filtroEdad;
      });
    }

    // Mostrar solo las primeras películas si no se ha expandido
    if (!this.mostrarTodasLasPeliculas) {
      return peliculasFiltradas.slice(0, this.peliculasMostradas);
    }

    return peliculasFiltradas;
  }

  verMasPeliculas() {
    this.mostrarTodasLasPeliculas = !this.mostrarTodasLasPeliculas;
  }
}
