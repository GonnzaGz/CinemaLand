import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApipeliculasService } from '../service/apipeliculas.service';
import { AuthService } from '../service/auth.service';
import { FavoritosService } from '../service/favoritos.service';

@Component({
  selector: 'app-movie-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './movie-details.component.html',
  styleUrls: ['./movie-details.component.css'],
})
export class MovieDetailsComponent implements OnInit {
  movie: any = null;
  movieId: string | null = null;
  isAuthenticated: boolean = false;
  isAuthenticated$: any;
  peliculasfavoritas: any[] = [];
  mensaje: string = '';
  loading: boolean = true;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiMovieService = inject(ApipeliculasService);
  private authService = inject(AuthService);
  private favoritosService = inject(FavoritosService);

  // Mapeo de géneros
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

  ngOnInit() {
    // Obtener el ID de la película desde la URL
    this.movieId = this.route.snapshot.paramMap.get('id');

    if (this.movieId) {
      this.loadMovieDetails();
    } else {
      this.router.navigate(['/compra-entradas']);
    }

    // Verificar autenticación
    this.isAuthenticated$ = this.authService.isAuthenticated$;

    this.authService.isAuthenticated$.subscribe((data) => {
      this.isAuthenticated = data.isAuthenticated;

      // Cargar favoritos si está autenticado
      if (this.isAuthenticated) {
        this.loadFavorites();
      }
    });
  }

  loadMovieDetails() {
    if (!this.movieId) return;

    this.loading = true;
    this.apiMovieService.getDetalleMovie(this.movieId).subscribe({
      next: (data: any) => {
        this.movie = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar detalles de la película:', error);
        this.loading = false;
        this.router.navigate(['/compra-entradas']);
      },
    });
  }

  loadFavorites() {
    const idlista = localStorage.getItem('idlist');
    if (idlista) {
      this.apiMovieService.getpeliculaslista(idlista).subscribe({
        next: (data: any) => {
          this.peliculasfavoritas = data.items || [];
        },
        error: (error) => console.log('Error al cargar favoritos:', error),
      });
    }
  }

  comprarEntradas() {
    if (this.isAuthenticated) {
      if (this.movie?.id) {
        this.router.navigate(['/seleccion-asientos', this.movie.id]);
      }
    } else {
      this.mensaje = 'Debes iniciar sesión para comprar entradas.';
      setTimeout(() => {
        this.mensaje = '';
      }, 5000);
    }
  }

  toggleFavorito() {
    if (!this.movie || !this.movie.id) return;

    const yaEsFavorita = this.esFavorito(this.movie.id);
    if (yaEsFavorita) {
      this.eliminarDeFavoritos(this.movie.id);
    } else {
      this.agregarAFavoritos(this.movie);
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
            this.loadFavorites();
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
            this.loadFavorites();
          },
          error: (error) =>
            console.error('Error al eliminar de favoritos:', error),
        });
    }
  }

  esFavorito(peliculaId: number): boolean {
    if (!peliculaId || !this.peliculasfavoritas) {
      return false;
    }
    return this.peliculasfavoritas.some((p) => p.id === peliculaId);
  }

  getMovieGenres(genreIds: number[]): string {
    if (!genreIds || genreIds.length === 0) {
      return 'Sin clasificar';
    }

    const genres = genreIds
      .slice(0, 3)
      .map((id) => this.genreMap[id] || 'Desconocido')
      .filter((genre) => genre !== 'Desconocido');

    return genres.length > 0 ? genres.join(', ') : 'Sin clasificar';
  }

  getMovieYear(releaseDate: string): string {
    if (!releaseDate) return 'N/A';
    return new Date(releaseDate).getFullYear().toString();
  }

  getMovieDuration(): string {
    // Por ahora retornamos un valor fijo, pero se puede obtener de la API
    return this.movie?.runtime ? `${this.movie.runtime} min` : '120 min';
  }

  isNewRelease(releaseDate: string): boolean {
    if (!releaseDate) return false;

    const today = new Date();
    const movieDate = new Date(releaseDate);
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);

    return movieDate >= oneMonthAgo;
  }

  goBack() {
    this.router.navigate(['/compra-entradas']);
  }

  watchTrailer() {
    // Aquí se puede implementar la funcionalidad del trailer
    console.log('Ver trailer de:', this.movie?.title);
  }
}
