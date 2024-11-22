import { Component, inject, OnInit } from '@angular/core';
import { ApipeliculasService } from '../service/apipeliculas.service';  // Ajusta la ruta según sea necesario
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-compra-entradas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './compra-entradas.component.html',
  styleUrls: ['./compra-entradas.component.css']
})
export class CompraEntradasComponent implements OnInit {
  peliculas: any[] = [];
  detallesPelicula: any = null;
  peliculaSeleccionada: number | null = null;
  selectedMovieId: number | null = null;
  tokenrequest: string = '';
  peliculasfavoritas: any[] = [];

  private apiMovieService = inject(ApipeliculasService);
  private router = inject(Router);

  constructor() {
    this.obtenerPeliculasPopulares();
  }

  ngOnInit(): void {
    let idsession = localStorage.getItem('idsession');
    let idlist =localStorage.getItem('idlist')
    if (idsession && idlist) {
      this.listadefavoritos();
    } else {
        localStorage.clear();
        this.Crearlista()

    }
  }

  obtenerPeliculasPopulares() {
    this.apiMovieService.getPopularMovies().subscribe((data: any) => {
      this.peliculas = data.results;
    });
  }

  verDetalles(id: number) {
    this.apiMovieService.getDetalleMovie(id.toString()).subscribe((data: any) => {
      this.detallesPelicula = data;
      this.peliculaSeleccionada = id;
      this.selectedMovieId = id;

      setTimeout(() => {
        const detallesDiv = document.getElementById('detalles-pelicula');
        if (detallesDiv) {
          detallesDiv.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
    });
  }

  comprarEntradas() {
    if (this.selectedMovieId) {
      this.router.navigate(['/seleccion-asientos', this.selectedMovieId]);
    } else {
      console.error('No se ha seleccionado ninguna película');
    }
  }

  agregarAFavoritos(pelicula: any) {
    const idlista = localStorage.getItem('idlist');
    const idsession = localStorage.getItem('idsession');

    if(idlista && idsession){

      this.apiMovieService.postagregarpeliculalista(idlista, idsession, pelicula.id).subscribe({
        next: (data: any) =>{
          this.listadefavoritos();
          console.log('Película agregada a favoritos:', data)
        },
        error: (error) => console.error('Error al agregar a favoritos:', error)
      });


    }
  }




  eliminarDeFavoritos(idpelicula: string) {
    const idlista = localStorage.getItem('idlist');
    const idsession = localStorage.getItem('idsession');

    if (idlista && idsession) {
      this.apiMovieService.posteliminarpeliculalista(idlista, idsession, idpelicula).subscribe({
        next: (data: any) => {
          console.log('Película eliminada de favoritos:', data);
          this.listadefavoritos(); // Refresca la lista de favoritos
        },
        error: (error) => console.error('Error al eliminar de favoritos:', error)
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
          localStorage.removeItem('idlist'); // Opcional, si decides reiniciar los datos
          this.peliculasfavoritas = [];// Limpia la lista de favoritos en la UI
          this.Crearlista()
        },
        error: (error) => console.error('Error al eliminar la lista completa:', error)
      });
    } else {
      console.error('Falta el id de la lista o sesión en el almacenamiento local.');
    }
  }


  listadefavoritos() {
    const idlista = localStorage.getItem('idlist');
    if (idlista) {
      this.apiMovieService.getpeliculaslista(idlista).subscribe({
        next: (data: any) => {
          this.peliculasfavoritas = data.items;
        },
        error: (error) => console.log(error)
      });
    }
  }


  Crearlista(){
    this.apiMovieService.gettoken().subscribe({
      next: (data: any) => {
        this.tokenrequest = data.request_token;
        this.apiMovieService.postvalidate(this.tokenrequest).subscribe({
          next: (data: any) => {
            this.apiMovieService.postconvetir(this.tokenrequest).subscribe({
              next: (data: any) => {
                localStorage.setItem('idsession', data.session_id);
                this.apiMovieService.postcrearlista(data.session_id).subscribe({
                  next: (data: any) => {
                    localStorage.setItem('idlist', data.list_id);
                  },
                  error: (error) => console.log(error)
                });
              },
              error: (error) => console.log(error)
            });
          },
          error: (error) => console.log(error)
        });
      },
      error: (error) => console.log(error)
    });
  }
}
