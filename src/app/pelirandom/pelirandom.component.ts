import { Component, OnInit } from '@angular/core';
import { Pelicula } from '../pelisearch/pelicula.interface';
import { ApipeliculasService } from '../service/apipeliculas.service';
import { Categoria } from './caterorias.interface';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-pelirandom',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './pelirandom.component.html',
  styleUrl: './pelirandom.component.css'
})
export class PelirandomComponent implements OnInit{

  peliculas:Pelicula [] = [];
  categorias:Categoria [] = [];
  idcategorias:string [] = [];

  activeIndex = 0; 
  intervalId: any;

  

  constructor( private apiMovieService: ApipeliculasService) {}

  ngOnInit(): void {
    this.apiMovieService.getcategorias().subscribe(data => {
      this.categorias = data.genres
    })
  }

  onCheckboxChange(event: Event, item: any): void {
    const inputElement = event.target as HTMLInputElement;
    const isChecked = inputElement.checked;
    if (isChecked) {
      this.idcategorias.push(item.id);
    } else {
      this.idcategorias.splice(this.idcategorias.indexOf(item.id),1);
    }
    
  }

  Randompeli() {
    console.log(this.idcategorias);

    this.peliculas = [];
    
    //obtnego pelculas segun las categorias
    this.idcategorias.forEach(element => {
        this.apiMovieService.getbusquedaporcategoria(element).subscribe(data => {
          for(let i = 0; i < 5; i++) {
            this.peliculas.push(data.results[i]);

          }
        })
    });
    
    

    let spinDuration = 5000; 
    let spinSpeed = 100; 

    this.stopRoulette(); 
    
    
    this.intervalId = setInterval(() => {
      // Cambia al siguiente índice
      this.activeIndex = (this.activeIndex + 1) % this.peliculas.length;
      
    }, spinSpeed);

    // Detener el carrusel después del tiempo especificado
    setTimeout(() => {
      this.stopRoulette();
      // Lógica adicional si deseas elegir una imagen aleatoria al final
      this.activeIndex = Math.floor(Math.random() * this.peliculas.length);
    }, spinDuration);
  }

  stopRoulette() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

