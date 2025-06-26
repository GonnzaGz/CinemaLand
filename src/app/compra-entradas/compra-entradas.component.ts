import { Component, inject, OnInit } from '@angular/core';
import { ApipeliculasService } from '../service/apipeliculas.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-compra-entradas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './compra-entradas.component.html',
  styleUrls: ['./compra-entradas.component.css'],
})
export class CompraEntradasComponent implements OnInit {
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
  private apiMovieService = inject(ApipeliculasService);
  private router = inject(Router);

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

    if (idsession && idlist) {
      this.listadefavoritos();
    } else {
      localStorage.clear();
      this.Crearlista();
    }

    /*if (lastSelectedMovieId) {
      const id = parseInt(lastSelectedMovieId, 10);
      if (!isNaN(id)) {
        this.verDetalles(id);
      }
    }*/
  }

  obtenerPeliculasPopulares() {
    this.apiMovieService.getPopularMovies().subscribe((data: any) => {
      this.estrenos = data.results.filter((pelicula: any) =>
        this.apiMovieService.esEstreno(pelicula.release_date)
      );

      this.peliculasViejas = data.results.filter(
        (pelicula: any) =>
          !this.apiMovieService.esEstreno(pelicula.release_date)
      );
    });
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
    const yaEsFavorita = this.esFavorito(pelicula.id);
    if (yaEsFavorita) {
      this.eliminarDeFavoritos(pelicula.id);
    } else {
      this.agregarAFavoritos(pelicula);
    }
  }

  esFavorito(peliculaId: number): boolean {
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
}
