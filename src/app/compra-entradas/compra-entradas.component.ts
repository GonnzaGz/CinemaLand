import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ApipeliculasService } from '../service/apipeliculas.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../service/auth.service';
import { FavoritosService } from '../service/favoritos.service';

@Component({
  selector: 'app-compra-entradas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './compra-entradas.component.html',
  styleUrls: ['./compra-entradas.component.css'],
})
export class CompraEntradasComponent implements OnInit, OnDestroy {
  peliculas: any[] = [];
  detallesPelicula: any = null;
  peliculaSeleccionada: number | null = null;
  selectedMovieId: number | null = null;
  tokenrequest: string = '';
  peliculasfavoritas: any[] = [];
  estrenos: any[] = [];
  peliculasViejas: any[] = [];
  isAuthenticated$!: any;
  isAuthenticated: boolean = true;
  mensaje: string = '';
  favoritosAbierto: boolean = false; // Estado para controlar el panel de favoritos

  // Nuevas propiedades para el Hero Section
  featuredMovies: any[] = [];
  currentSlide: number = 0;
  slideInterval: any;
  isTransitioning: boolean = false;

  // Propiedades para filtros y "Ver más"
  filtroFormato: string = 'todos';
  filtroIdioma: string = 'todos';
  filtroAccesible: boolean = false;
  filtroFamiliar: boolean = false;
  peliculasMostradas: number = 6;
  mostrarTodasLasPeliculas: boolean = false;

  // Propiedades para el carousel "Disfruta CinemaLand"
  currentCarouselSlide: number = 0;
  carouselSlides: any[] = [
    { id: 1, type: 'ofertas' },
    { id: 2, type: 'social' },
    { id: 3, type: 'accesibilidad' },
    { id: 4, type: 'peli-random' },
  ];
  carouselInterval: any;

  // Getter para la película actual
  get currentMovie() {
    return this.featuredMovies[this.currentSlide] || null;
  }

  private apiMovieService = inject(ApipeliculasService);
  private router = inject(Router);
  private favoritosService = inject(FavoritosService);

  constructor(private authService: AuthService) {
    this.obtenerPeliculasPopulares();

    this.isAuthenticated$ = this.authService.isAuthenticated$;

    this.authService.isAuthenticated$.subscribe((data) => {
      this.isAuthenticated = data.isAuthenticated;
    });
  }

  ngOnInit(): void {
    const idsession = localStorage.getItem('idsession');
    const idlist = localStorage.getItem('idlist');
    /*const lastSelectedMovieId = localStorage.getItem('selectedMovieId');*/

    // Suscribirse al estado del panel de favoritos
    this.favoritosService.favoritosAbierto$.subscribe(
      (estado) => (this.favoritosAbierto = estado)
    );

    if (idsession && idlist) {
      this.listadefavoritos();
    } else {
      localStorage.clear();
      this.Crearlista();
    }

    // Inicializar carousel
    this.startCarousel();

    /*if (lastSelectedMovieId) {
      const id = parseInt(lastSelectedMovieId, 10);
      if (!isNaN(id)) {
        this.verDetalles(id);
      }
    }*/
  }

  obtenerPeliculasPopulares() {
    console.log('Iniciando carga de películas...');
    this.apiMovieService.getPopularMovies().subscribe({
      next: (data: any) => {
        console.log('Películas recibidas:', data);
        if (data && data.results) {
          // Asegurar que tenemos al menos 20 películas para dividir
          const todasLasPeliculas = data.results.slice(0, 20);

          // Tomar las primeras 10 para "En Cartelera"
          this.estrenos = todasLasPeliculas.slice(0, 10);

          // Tomar las siguientes 10 para "Películas Populares"
          this.peliculasViejas = todasLasPeliculas.slice(10, 20);

          // Configurar películas destacadas para el hero
          this.setupFeaturedMovies(data.results);
          console.log(
            'Estrenos:',
            this.estrenos.length,
            'Películas populares:',
            this.peliculasViejas.length
          );
        }
      },
      error: (error) => {
        console.error('Error al cargar películas:', error);
      },
    });
  }

  // Nuevos métodos para el Hero Section
  setupFeaturedMovies(movies: any[]) {
    if (movies && movies.length > 0) {
      this.featuredMovies = movies.slice(0, 5); // Top 5 películas para el slider
      this.currentSlide = 0; // Inicializar en el primer slide
      console.log('Featured movies set:', this.featuredMovies.length);

      // Precargar todas las imágenes
      this.preloadImages();
      this.startSlideshow();
    }
  }

  preloadImages() {
    this.featuredMovies.forEach((movie) => {
      if (movie.backdrop_path) {
        const img = new Image();
        img.src = `https://image.tmdb.org/t/p/original/${movie.backdrop_path}`;
      }
      if (movie.poster_path) {
        const img = new Image();
        img.src = `https://image.tmdb.org/t/p/w500/${movie.poster_path}`;
      }
    });
  }

  startSlideshow() {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }

    if (this.featuredMovies.length > 1) {
      this.slideInterval = setInterval(() => {
        if (!this.isTransitioning) {
          this.nextSlide();
        }
      }, 6000); // Cambiar slide cada 6 segundos
    }
  }

  stopSlideshow() {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
  }

  goToSlide(index: number) {
    if (this.featuredMovies.length > index && !this.isTransitioning) {
      this.isTransitioning = true;
      this.currentSlide = index;

      // Pequeño delay para permitir que el DOM se actualice
      setTimeout(() => {
        this.isTransitioning = false;
      }, 100);

      this.stopSlideshow();
      this.startSlideshow();
    }
  }

  nextSlide() {
    if (this.featuredMovies.length > 0 && !this.isTransitioning) {
      this.isTransitioning = true;
      this.currentSlide = (this.currentSlide + 1) % this.featuredMovies.length;

      setTimeout(() => {
        this.isTransitioning = false;
      }, 100);
    }
  }

  previousSlide() {
    if (this.featuredMovies.length > 0 && !this.isTransitioning) {
      this.isTransitioning = true;
      this.currentSlide =
        this.currentSlide === 0
          ? this.featuredMovies.length - 1
          : this.currentSlide - 1;

      setTimeout(() => {
        this.isTransitioning = false;
      }, 100);

      this.stopSlideshow();
      this.startSlideshow();
    }
  }

  watchTrailer() {
    // Por ahora mostrar alert, después se puede integrar con YouTube API
    alert('Función de trailer disponible próximamente');
  }

  onImageLoad() {
    console.log('Imagen cargada correctamente');
  }

  onImageError() {
    console.error('Error al cargar imagen del hero');
  }

  verDetalles(id: number) {
    this.apiMovieService
      .getDetalleMovie(id.toString())
      .subscribe((data: any) => {
        this.detallesPelicula = data;
        this.peliculaSeleccionada = id;
        this.selectedMovieId = id;

        localStorage.setItem('selectedMovieId', id.toString());

        setTimeout(() => {
          const detallesDiv = document.getElementById('detalles-pelicula');
          if (detallesDiv) {
            detallesDiv.scrollIntoView({ behavior: 'smooth' });
          }
        }, 500);
      });
  }

  comprarEntradas() {
    console.log(this.isAuthenticated);
    if (this.isAuthenticated) {
      if (this.selectedMovieId) {
        this.router.navigate(['/seleccion-asientos', this.selectedMovieId]);
      } else {
        console.error('No se ha seleccionado ninguna película');
      }
    } else {
      this.mensaje = 'Debes iniciar sesión para comprar entradas.';
    }
  }

  // Método específico para comprar entradas desde las tarjetas
  comprarEntradasPelicula(movieId: number) {
    console.log(this.isAuthenticated);
    if (this.isAuthenticated) {
      this.router.navigate(['/seleccion-asientos', movieId]);
    } else {
      this.mensaje = 'Debes iniciar sesión para comprar entradas.';
      setTimeout(() => {
        this.mensaje = '';
      }, 5000);
    }
  }

  agregarAFavoritos(pelicula: any) {
    const idlista = localStorage.getItem('idlist');
    const idsession = localStorage.getItem('idsession');

    if (idlista && idsession) {
      this.apiMovieService
        .postagregarpeliculalista(idlista, idsession, pelicula.id)
        .subscribe({
          next: (data: any) => {
            this.listadefavoritos();
            console.log('Película agregada a favoritos:', data);
          },
          error: (error) =>
            console.error('Error al agregar a favoritos:', error),
        });
    }
  }

  eliminarDeFavoritos(idpelicula: string) {
    const idlista = localStorage.getItem('idlist');
    const idsession = localStorage.getItem('idsession');

    if (idlista && idsession) {
      this.apiMovieService
        .posteliminarpeliculalista(idlista, idsession, idpelicula)
        .subscribe({
          next: (data: any) => {
            console.log('Película eliminada de favoritos:', data);
            this.listadefavoritos();
          },
          error: (error) =>
            console.error('Error al eliminar de favoritos:', error),
        });
    }
  }

  Borrarlistacompleta() {
    const idlista = localStorage.getItem('idlist');
    const idsession = localStorage.getItem('idsession');

    if (idlista && idsession) {
      this.apiMovieService.deletelistacompleta(idlista, idsession).subscribe({
        next: (data: any) => {
          console.log('Lista completa eliminada:', data);
          localStorage.removeItem('idlist');
          this.peliculasfavoritas = [];
          this.Crearlista();
        },
        error: (error) =>
          console.error('Error al eliminar la lista completa:', error),
      });
    } else {
      console.error(
        'Falta el id de la lista o sesión en el almacenamiento local.'
      );
    }
  }

  listadefavoritos() {
    const idlista = localStorage.getItem('idlist');
    if (idlista) {
      this.apiMovieService.getpeliculaslista(idlista).subscribe({
        next: (data: any) => {
          this.peliculasfavoritas = data.items;
        },
        error: (error) => console.log(error),
      });
    }
  }

  Crearlista() {
    this.apiMovieService.gettoken().subscribe({
      next: (data: any) => {
        this.tokenrequest = data.request_token;
        this.apiMovieService.postvalidate(this.tokenrequest).subscribe({
          next: () => {
            this.apiMovieService.postconvetir(this.tokenrequest).subscribe({
              next: (data: any) => {
                localStorage.setItem('idsession', data.session_id);
                this.apiMovieService.postcrearlista(data.session_id).subscribe({
                  next: (data: any) => {
                    localStorage.setItem('idlist', data.list_id);
                  },
                  error: (error) => console.log(error),
                });
              },
              error: (error) => console.log(error),
            });
          },
          error: (error) => console.log(error),
        });
      },
      error: (error) => console.log(error),
    });
  }

  toggleFavorito(pelicula: any) {
    if (!pelicula || !pelicula.id) {
      console.error('Película inválida para toggle favorito');
      return;
    }

    const yaEsFavorita = this.esFavorito(pelicula.id);
    if (yaEsFavorita) {
      this.eliminarDeFavoritos(pelicula.id);
    } else {
      this.agregarAFavoritos(pelicula);
    }
  }

  esFavorito(peliculaId: number): boolean {
    if (!peliculaId || !this.peliculasfavoritas) {
      return false;
    }
    return this.peliculasfavoritas.some((p) => p.id === peliculaId);
  }

  get esEstreno(): boolean {
    return this.apiMovieService.esEstreno(this.detallesPelicula?.release_date);
  }

  cerrarDetalles() {
    this.detallesPelicula = null;
    this.peliculaSeleccionada = null;
    this.selectedMovieId = null;
    localStorage.removeItem('selectedMovieId');
  }

  toggleFavoritos() {
    this.favoritosService.toggleFavoritos();
  }

  // Métodos para filtros y "Ver más"
  setFiltroFormato(formato: string) {
    this.filtroFormato = formato;
    this.resetearVista();
  }

  setFiltroIdioma(idioma: string) {
    this.filtroIdioma = idioma;
    this.resetearVista();
  }

  toggleFiltroAccesible() {
    this.filtroAccesible = !this.filtroAccesible;
    this.resetearVista();
  }

  toggleFiltroFamiliar() {
    this.filtroFamiliar = !this.filtroFamiliar;
    this.resetearVista();
  }

  getEstrenosFiltrados(): any[] {
    let peliculasFiltradas = [...this.estrenos];

    // Por ahora simulamos que todas las películas tienen diferentes formatos/idiomas
    // En una implementación real, estas propiedades vendrían de la API
    if (this.filtroFormato !== 'todos') {
      peliculasFiltradas = peliculasFiltradas.filter((pelicula) => {
        // Simular diferentes formatos basado en el ID
        const formatos =
          pelicula.id % 4 === 0
            ? ['2D', '3D']
            : pelicula.id % 3 === 0
            ? ['2D', 'IMAX']
            : ['2D'];
        return formatos.includes(this.filtroFormato);
      });
    }

    if (this.filtroIdioma !== 'todos') {
      peliculasFiltradas = peliculasFiltradas.filter((pelicula) => {
        // Simular diferentes idiomas basado en el ID
        const idiomas =
          pelicula.id % 5 === 0
            ? ['español', 'subtitulado']
            : pelicula.id % 2 === 0
            ? ['ingles']
            : ['español'];
        return idiomas.includes(this.filtroIdioma);
      });
    }

    if (this.filtroAccesible) {
      peliculasFiltradas = peliculasFiltradas.filter((pelicula) => {
        // Simular accesibilidad basado en el ID
        return pelicula.id % 3 === 0;
      });
    }

    if (this.filtroFamiliar) {
      peliculasFiltradas = peliculasFiltradas.filter((pelicula) => {
        // Simular contenido familiar basado en la calificación
        return pelicula.vote_average >= 7.0;
      });
    }

    return peliculasFiltradas;
  }

  verMasPeliculas() {
    this.mostrarTodasLasPeliculas = true;
  }

  resetearVista() {
    this.mostrarTodasLasPeliculas = false;
    this.peliculasMostradas = 6;
  }

  // Métodos para el carousel "Disfruta CinemaLand"
  nextCarouselSlide() {
    this.currentCarouselSlide =
      (this.currentCarouselSlide + 1) % this.carouselSlides.length;
  }

  previousCarouselSlide() {
    this.currentCarouselSlide =
      this.currentCarouselSlide === 0
        ? this.carouselSlides.length - 1
        : this.currentCarouselSlide - 1;
  }

  goToCarouselSlide(index: number) {
    this.currentCarouselSlide = index;
  }

  startCarousel() {
    this.carouselInterval = setInterval(() => {
      this.nextCarouselSlide();
    }, 5000); // Cambia slide cada 5 segundos
  }

  stopCarousel() {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }
  }

  irAPeliRandom() {
    this.router.navigate(['/pelirandom']);
  }

  ngOnDestroy() {
    this.stopSlideshow();
    this.stopCarousel();
  }
}
