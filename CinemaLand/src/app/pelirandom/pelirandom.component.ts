import { Component, OnInit } from '@angular/core';
import { Pelicula } from '../pelisearch/pelicula.interface';
import { ApipeliculasService } from '../service/apipeliculas.service';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Categoria } from './caterorias.interface';

@Component({
  selector: 'app-pelirandom',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './pelirandom.component.html',
  styleUrl: './pelirandom.component.css'
})
export class PelirandomComponent implements OnInit{

  peliculas:Pelicula [] = [];
  activeIndex = 0; 
  intervalId: any;
  categorias:Categoria [] = [];

  

  constructor( private apiMovieService: ApipeliculasService,private _fb:FormBuilder) {
    
    
  }

  ngOnInit(): void {

    this.apiMovieService.getcategorias().subscribe(data => {
      this.categorias = data.genres
    })

    

    this.apiMovieService.getPopularMovies().subscribe(data => {
          
      console.log(data.results[0]);
      //this.peliculas = data.results;
      for (let i =0 ; i<5; i++){
        
          this.peliculas.push( data.results[i])
      } 
      
    })
  }

  Randompeli() {
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

