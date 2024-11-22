import { Component, inject, OnInit } from '@angular/core';
import { ApipeliculasService } from '../service/apipeliculas.service';
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
  favoritos: any[] = [];

  tokenrequest: string = "";

  private apiMovieService = inject(ApipeliculasService);
  private router = inject(Router);

  constructor() {
    this.obtenerPeliculasPopulares();
  }

  ngOnInit(): void {
    let id = localStorage.getItem("id");

    if (id) {
      console.log("ID almacenado:", id);
    } else {
      this.apiMovieService.gettoken().subscribe({
        next: (data: any) => {
          this.tokenrequest = data.request_token;
          this.apiMovieService.postvalidate(this.tokenrequest).subscribe({
            next: (data: any) => {
              this.apiMovieService.postconvetir(this.tokenrequest).subscribe({
                next: (data: any) => {
                  localStorage.setItem("id", data.session_id);
                  this.apiMovieService.postcrearlista(data.session_id).subscribe({
                    next: (data: any) => {
                      localStorage.setItem("idlist", data.id);
                    },
                    error: (error) => {
                      console.log(error);
                    }
                  });
                },
                error: (error) => {
                  console.log(error);
                }
              });
            },
            error: (error) => {
              console.log(error);
            }
          });
        },
        error: (error) => {
          console.log(error);
        }
      });
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

  agregarAFavoritos(pelicula: any) {
    const yaEstaEnFavoritos = this.favoritos.some(fav => fav.id === pelicula.id);
    if (!yaEstaEnFavoritos) {
      this.favoritos.push(pelicula);
      console.log(`Película agregada a favoritos: ${pelicula.title}`);
    } else {
      console.log(`La película ya está en favoritos: ${pelicula.title}`);
    }
  }

  eliminarDeFavoritos(id: number) {
    const pelicula = this.favoritos.find(pelicula => pelicula.id === id);
    if (pelicula) {
      this.favoritos = this.favoritos.filter(pelicula => pelicula.id !== id);
      console.log(`Película eliminada de favoritos: ${pelicula.title}`);
    }
  }

  limpiarFavoritos() {
    this.favoritos = [];
    console.log('Todos los favoritos han sido eliminados');
  }

  comprarEntradas() {
    if (this.selectedMovieId) {
      this.router.navigate(['/seleccion-asientos', this.selectedMovieId]);
    } else {
      console.error('No se ha seleccionado ninguna película');
    }
  }
}
