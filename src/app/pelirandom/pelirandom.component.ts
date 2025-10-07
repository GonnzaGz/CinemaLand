import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { Pelicula } from '../pelisearch/pelicula.interface';
import { ApipeliculasService } from '../service/apipeliculas.service';
import { Categoria } from './categorias.interface';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-pelirandom',
  standalone: true,
  imports: [RouterLink, CommonModule, DatePipe, DecimalPipe],
  templateUrl: './pelirandom.component.html',
  styleUrl: './pelirandom.component.css',
})
export class PelirandomComponent implements OnInit {
  peliculas: Pelicula[] = [];
  categorias: Categoria[] = [];
  idcategorias: number[] = [];

  activeIndex = 0;
  intervalId: any;
  loading = false;

  constructor(
    private apiMovieService: ApipeliculasService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.apiMovieService.getcategorias().subscribe((data) => {
      this.categorias = data.genres;
    });

    // Función invisible que activa descuento del 15% por usar PeliRandom
    this.activarDescuentoPeliRandom();
  }

  // Función invisible para activar descuento PeliRandom
  private activarDescuentoPeliRandom(): void {
    localStorage.setItem(
      'descuentoPeliRandom',
      JSON.stringify({
        activo: true,
        porcentaje: 15,
        fecha: new Date().toISOString(),
      })
    );
    console.log('Descuento PeliRandom activado: 15%');
  }

  onCheckboxChange(event: Event, item: any): void {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement.checked) {
      this.idcategorias.push(item.id);
    } else {
      const index = this.idcategorias.indexOf(item.id);
      if (index > -1) this.idcategorias.splice(index, 1);
    }
  }

  toggleCategory(item: any): void {
    const index = this.idcategorias.indexOf(item.id);
    if (index > -1) {
      this.idcategorias.splice(index, 1);
    } else {
      this.idcategorias.push(item.id);
    }
  }

  Randompeli() {
    if (this.idcategorias.length === 0) {
      this.peliculas = [];
      return;
    }

    this.loading = true;
    this.peliculas = [];
    this.stopRoulette();

    let cargasPendientes = this.idcategorias.length;

    this.idcategorias.forEach((element) => {
      this.apiMovieService
        .getEstrenosPorCategoria(element.toString())
        .subscribe((data) => {
          const pelisEstreno = data.results.slice(0, 5);
          this.peliculas.push(...pelisEstreno);
          cargasPendientes--;

          if (cargasPendientes === 0) {
            this.loading = false;
            if (this.peliculas.length > 0) {
              const spinDuration = 5000;
              const spinSpeed = 100;

              this.intervalId = setInterval(() => {
                this.activeIndex =
                  (this.activeIndex + 1) % this.peliculas.length;
              }, spinSpeed);

              setTimeout(() => {
                this.stopRoulette();
                this.activeIndex = Math.floor(
                  Math.random() * this.peliculas.length
                );
              }, spinDuration);
            }
          }
        });
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  stopRoulette() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  irAComprarEntradas(id: number): void {
    this.router.navigate(['/seleccion-asientos', id]).then(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}
