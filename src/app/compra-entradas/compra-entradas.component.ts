import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ApipeliculasService } from '../service/apipeliculas.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../service/auth.service';
import { FavoritosService } from '../service/favoritos.service';
import { CartService, CartProduct } from '../service/cart.service';
import { UnifiedCheckoutComponent } from '../unified-checkout/unified-checkout.component';

@Component({
  selector: 'app-compra-entradas',
  standalone: true,
  imports: [CommonModule, UnifiedCheckoutComponent],
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
  isAuthenticated: boolean = false;
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
  filtroEdad: string = 'todos';
  peliculasMostradas: number = 10;
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
  isCarouselTransitioning: boolean = false;

  // Propiedades para el nuevo sistema de checkout unificado
  showUnifiedCheckout: boolean = false;
  selectedTickets: any = null; // Para almacenar la información de las entradas seleccionadas

  // Getter para la película actual
  get currentMovie() {
    return this.featuredMovies[this.currentSlide] || null;
  }

  private apiMovieService = inject(ApipeliculasService);
  private router = inject(Router);
  private favoritosService = inject(FavoritosService);
  private cartService = inject(CartService);

  constructor(private authService: AuthService) {
    this.obtenerPeliculasPopulares();
    this.isAuthenticated$ = this.authService.isAuthenticated$;
  }

  ngOnInit(): void {
    // Suscribirse al estado de autenticación
    this.authService.isAuthenticated$.subscribe((data) => {
      console.log('=== SUSCRIPCIÓN isAuthenticated$ ===');
      console.log('Data recibida:', data);
      this.isAuthenticated = data.isAuthenticated || false;
      console.log('isAuthenticated asignado:', this.isAuthenticated);
    });

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

    // Inicializar carousel con un pequeño delay
    setTimeout(() => {
      this.startCarousel();
    }, 1000);

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
          // Tomar suficientes películas para garantizar 25 disponibles
          const todasLasPeliculas = data.results.slice(0, 50);

          // Priorizar películas en cartelera (últimos 2 meses + próximos estrenos)
          const peliculasEnCartelera = todasLasPeliculas.filter(
            (pelicula: any) => this.estaEnCartelera(pelicula.release_date)
          );

          // Tomar las 25 mejores películas combinando cartelera y populares
          const peliculasDestacadas: any[] = [];

          // Primero agregar películas en cartelera con buen rating
          const carteleraDestacadas = peliculasEnCartelera
            .filter((pelicula: any) => pelicula.vote_average >= 7.0)
            .map((pelicula: any) => ({
              ...pelicula,
              esDestacada: true,
              clasificacionEdad: this.getClasificacionEdadSimulada(pelicula.id),
            }));
          peliculasDestacadas.push(...carteleraDestacadas);

          // Luego agregar otras películas en cartelera
          if (peliculasDestacadas.length < 25) {
            const carteleraRestantes = peliculasEnCartelera
              .filter((pelicula: any) => pelicula.vote_average < 7.0)
              .sort((a: any, b: any) => b.vote_average - a.vote_average)
              .slice(0, 25 - peliculasDestacadas.length)
              .map((pelicula: any) => ({
                ...pelicula,
                esDestacada: true,
                clasificacionEdad: this.getClasificacionEdadSimulada(
                  pelicula.id
                ),
              }));
            peliculasDestacadas.push(...carteleraRestantes);
          }

          // Finalmente, completar con las mejores películas sin restricción de fecha
          if (peliculasDestacadas.length < 25) {
            const peliculasRestantes = todasLasPeliculas
              .filter(
                (pelicula: any) =>
                  !peliculasDestacadas.find(
                    (dest: any) => dest.id === pelicula.id
                  )
              )
              .sort((a: any, b: any) => b.vote_average - a.vote_average)
              .slice(0, 25 - peliculasDestacadas.length)
              .map((pelicula: any) => ({
                ...pelicula,
                esDestacada: true,
                clasificacionEdad: this.getClasificacionEdadSimulada(
                  pelicula.id
                ),
              }));
            peliculasDestacadas.push(...peliculasRestantes);
          }

          // Garantizar exactamente 25 películas
          this.estrenos = peliculasDestacadas.slice(0, 25);
          console.log(
            '🎬 PELÍCULAS CARGADAS - Total garantizado:',
            this.estrenos.length
          );

          // Las películas populares serán las que no son destacadas
          this.peliculasViejas = todasLasPeliculas
            .filter(
              (pelicula: any) =>
                !peliculasDestacadas.find(
                  (dest: any) => dest.id === pelicula.id
                )
            )
            .slice(0, 10);

          // Configurar películas destacadas para el hero (tomar las top 5)
          this.setupFeaturedMovies(peliculasDestacadas.slice(0, 5));
          console.log(
            'Películas cargadas correctamente:',
            'Total destacadas:',
            this.estrenos.length,
            'Películas en cartelera disponibles:',
            peliculasEnCartelera.length,
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
    // Navegar a la página de detalles
    this.router.navigate(['/movie-details', id]);
  }

  comprarEntradas(movie?: any, ticketInfo?: any) {
    console.log('Comprar entradas - Autenticado:', this.isAuthenticated);

    if (!this.isAuthenticated) {
      console.log('Usuario no autenticado, mostrando mensaje');
      this.mensaje = 'Debes iniciar sesión para comprar entradas.';
      setTimeout(() => {
        this.mensaje = '';
      }, 5000);
      return;
    }

    if (movie && ticketInfo) {
      // Nueva lógica con carrito unificado
      const ticketProduct: CartProduct = {
        id: `movie_${movie.id}_${Date.now()}`,
        name: `${movie.title}`,
        description: `Entrada para ${movie.title}`,
        price: ticketInfo.price || 25000,
        image: movie.poster_path
          ? `https://image.tmdb.org/t/p/w500/${movie.poster_path}`
          : 'assets/images/default-movie-poster.png',
        category: 'movie-ticket',
        type: ticketInfo.type || 'standard',
        metadata: {
          movieId: movie.id,
          title: movie.title,
          rating: movie.vote_average,
          duration: ticketInfo.duration || '120 min',
          genre: this.getMovieGenres(movie.genre_ids),
        },
      };

      const specificData = {
        date: ticketInfo.date,
        time: ticketInfo.time,
        cinema: ticketInfo.cinema || 'CinemaLand Centro',
        room: ticketInfo.room || 'Sala 1',
        seats: ticketInfo.seats || [],
        format: ticketInfo.format || '2D',
        language: ticketInfo.language || 'Español',
      };

      this.cartService.addToCart(
        ticketProduct,
        ticketInfo.quantity || 1,
        specificData
      );
      this.selectedTickets = {
        movie,
        ticketInfo,
        product: ticketProduct,
        specificData,
      };
      this.showUnifiedCheckout = true;
    } else {
      // Lógica anterior para compatibilidad
      if (this.selectedMovieId) {
        this.router.navigate(['/seleccion-asientos', this.selectedMovieId]);
      } else {
        console.error('No se ha seleccionado ninguna película');
      }
    }
  }

  // Método específico para comprar entradas desde las tarjetas
  comprarEntradasPelicula(movieId: number) {
    console.log(
      'Comprar entradas película - Autenticado:',
      this.isAuthenticated
    );

    if (!this.isAuthenticated) {
      console.log('Usuario no autenticado, mostrando mensaje');
      this.mensaje = 'Debes iniciar sesión para comprar entradas.';
      setTimeout(() => {
        this.mensaje = '';
      }, 5000);
      return;
    }

    // Buscar la película por ID
    const movie =
      this.estrenos.find((p) => p.id === movieId) ||
      this.peliculasViejas.find((p) => p.id === movieId);

    if (movie) {
      this.compraRapida(movie);
    } else {
      // Fallback al sistema anterior
      this.router.navigate(['/seleccion-asientos', movieId]);
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

  setFiltroEdad(edad: string) {
    this.filtroEdad = edad;
    this.resetearVista();
  }

  getClasificacionEdadSimulada(id: number): string {
    // Simular clasificación de edad basada en el ID de la película
    const clasificaciones = ['ATP', '+13', '+16', '+18'];
    return clasificaciones[id % clasificaciones.length];
  }

  estaEnCartelera(fechaEstreno: string): boolean {
    if (!fechaEstreno) return false;

    const fechaHoy = new Date();
    const fechaPelicula = new Date(fechaEstreno);
    const doseMesesAtras = new Date();
    doseMesesAtras.setMonth(fechaHoy.getMonth() - 2);

    // La película está en cartelera si fue estrenadaha hace máximo 2 meses
    // o si es un estreno futuro (hasta 1 mes en el futuro)
    const unMesAdelante = new Date();
    unMesAdelante.setMonth(fechaHoy.getMonth() + 1);

    return fechaPelicula >= doseMesesAtras && fechaPelicula <= unMesAdelante;
  }

  getTipoPelicula(fechaEstreno: string): string {
    if (!fechaEstreno) return 'CARTELERA';

    const fechaHoy = new Date();
    const fechaPelicula = new Date(fechaEstreno);
    const unMesAtras = new Date();
    unMesAtras.setMonth(fechaHoy.getMonth() - 1);

    // Si la película salió hace menos de 1 mes, es "ESTRENO"
    if (fechaPelicula >= unMesAtras) {
      return 'ESTRENO';
    }

    // Si está en cartelera pero no es estreno reciente
    if (this.estaEnCartelera(fechaEstreno)) {
      return 'CARTELERA';
    }

    return 'DESTACADA';
  }

  getEstrenosFiltrados(): any[] {
    let peliculasFiltradas = [...this.estrenos];
    console.log('Películas antes del filtrado:', peliculasFiltradas.length);

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
      console.log(
        'Películas después del filtro formato:',
        peliculasFiltradas.length
      );
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
      console.log(
        'Películas después del filtro idioma:',
        peliculasFiltradas.length
      );
    }

    if (this.filtroEdad !== 'todos') {
      peliculasFiltradas = peliculasFiltradas.filter((pelicula) => {
        return pelicula.clasificacionEdad === this.filtroEdad;
      });
      console.log(
        'Películas después del filtro edad:',
        peliculasFiltradas.length
      );
    }

    console.log('Películas finales filtradas:', peliculasFiltradas.length);
    return peliculasFiltradas;
  }

  verMasPeliculas() {
    this.peliculasMostradas = 25; // Mostrar 25 películas destacadas
    this.mostrarTodasLasPeliculas = true;
  }

  resetearVista() {
    this.mostrarTodasLasPeliculas = false;
    this.peliculasMostradas = 10;
  }

  // Métodos para el carousel "Disfruta CinemaLand"
  nextCarouselSlide() {
    if (this.isCarouselTransitioning) return;

    this.isCarouselTransitioning = true;
    this.currentCarouselSlide =
      (this.currentCarouselSlide + 1) % this.carouselSlides.length;
    console.log('Next carousel slide:', this.currentCarouselSlide);

    setTimeout(() => {
      this.isCarouselTransitioning = false;
    }, 600);
  }

  previousCarouselSlide() {
    if (this.isCarouselTransitioning) return;

    this.isCarouselTransitioning = true;
    this.currentCarouselSlide =
      this.currentCarouselSlide === 0
        ? this.carouselSlides.length - 1
        : this.currentCarouselSlide - 1;
    console.log('Previous carousel slide:', this.currentCarouselSlide);

    setTimeout(() => {
      this.isCarouselTransitioning = false;
    }, 600);
  }

  goToCarouselSlide(index: number) {
    if (this.isCarouselTransitioning) return;

    this.isCarouselTransitioning = true;

    if (index >= 0 && index < this.carouselSlides.length) {
      this.currentCarouselSlide = index;
      console.log('Go to carousel slide:', this.currentCarouselSlide);
    }

    setTimeout(() => {
      this.isCarouselTransitioning = false;
    }, 600);
  }

  startCarousel() {
    this.stopCarousel();

    if (this.carouselSlides.length > 1) {
      this.carouselInterval = setInterval(() => {
        if (!this.isCarouselTransitioning) {
          this.nextCarouselSlide();
        }
      }, 5000);
    }
  }

  stopCarousel() {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }
  }

  irAPeliRandom() {
    this.router.navigate(['/pelirandom']);
  }

  // Mapeo de IDs de géneros de TMDB a nombres en español
  private genreMap: { [key: number]: string } = {
    28: 'Acción',
    12: 'Aventura',
    16: 'Animación',
    35: 'Comedia',
    80: 'Crimen',
    99: 'Documental',
    18: 'Drama',
    10751: 'Familiar',
    14: 'Fantasía',
    36: 'Historia',
    27: 'Terror',
    10402: 'Música',
    9648: 'Misterio',
    10749: 'Romance',
    878: 'Ciencia Ficción',
    10770: 'Película de TV',
    53: 'Thriller',
    10752: 'Guerra',
    37: 'Western',
  };

  // Función para obtener géneros de una película
  getMovieGenres(genreIds: number[]): string {
    if (!genreIds || genreIds.length === 0) {
      return 'Sin clasificar';
    }

    const genres = genreIds
      .slice(0, 2) // Máximo 2 géneros para evitar textos muy largos
      .map((id) => this.genreMap[id] || 'Desconocido')
      .filter((genre) => genre !== 'Desconocido');

    return genres.length > 0 ? genres.join(', ') : 'Sin clasificar';
  }

  getMovieGenresArray(genreIds: number[]): string[] {
    if (!genreIds || genreIds.length === 0) {
      return ['Sin clasificar'];
    }

    const genres = genreIds
      .slice(0, 1) // Solo 1 género
      .map((id) => this.genreMap[id] || 'Desconocido')
      .filter((genre) => genre !== 'Desconocido');

    return genres.length > 0 ? genres : ['Sin clasificar'];
  }

  // Método simplificado para compra rápida desde el botón "Comprar Entradas"
  compraRapida(movie: any): void {
    const ticketInfo = {
      price: 25000,
      quantity: 1,
      type: 'standard',
      date: this.getNextShowDate(),
      time: '20:00',
      cinema: 'CinemaLand Centro',
      room: 'Sala 1',
      format: '2D',
      language: 'Español',
      seats: ['F8'], // Asiento por defecto
    };

    this.comprarEntradas(movie, ticketInfo);
  }

  // Método para obtener la próxima fecha de función (hoy o mañana)
  private getNextShowDate(): string {
    const today = new Date();
    const hour = today.getHours();

    // Si es después de las 22:00, mostrar funciones del día siguiente
    if (hour >= 22) {
      today.setDate(today.getDate() + 1);
    }

    return today.toISOString().split('T')[0];
  }

  // Métodos para manejar el checkout unificado
  onCheckoutClosed(): void {
    this.showUnifiedCheckout = false;
    this.selectedTickets = null;
  }

  onOrderCompleted(order: any): void {
    console.log('Orden completada:', order);

    // Mostrar mensaje de éxito
    alert(`¡Compra exitosa! Tu número de orden es: ${order.id}`);

    // Limpiar datos temporales
    this.selectedTickets = null;
    this.showUnifiedCheckout = false;

    // Opcional: redirigir a una página de confirmación
    // this.router.navigate(['/order-confirmation', order.id]);
  }

  onOrderFailed(errorMessage: string): void {
    console.error('Error en la orden:', errorMessage);
    alert(`Error al procesar la compra: ${errorMessage}`);
  }

  // Método para obtener el número total de items en el carrito
  getCartItemCount(): number {
    return this.cartService.getCartItemCount();
  }

  // Método para obtener el total del carrito
  getCartTotal(): number {
    return this.cartService.getCartTotal();
  }

  ngOnDestroy() {
    this.stopSlideshow();
    this.stopCarousel();
  }

  comprarEntradasRapida(peliculaId: number) {
    console.log('=== COMPRAR ENTRADAS RÁPIDA ===');
    console.log('Película ID:', peliculaId);
    console.log('isAuthenticated:', this.isAuthenticated);
    console.log('Mensaje actual:', this.mensaje);

    if (!this.isAuthenticated) {
      console.log('❌ Usuario NO autenticado - Mostrando mensaje');
      this.mensaje = 'Debes iniciar sesión para comprar entradas.';
      console.log('Mensaje asignado:', this.mensaje);
      setTimeout(() => {
        console.log('⏰ Timeout - Limpiando mensaje');
        this.mensaje = '';
      }, 5000);
      return;
    }

    console.log('✅ Usuario autenticado - Navegando a selección de asientos');
    this.router.navigate(['/seleccion-asientos', peliculaId]);
  }
}
