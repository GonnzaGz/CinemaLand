import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApipeliculasService } from '../service/apipeliculas.service';
import { Pelicula } from './pelicula.interface';

@Component({
  selector: 'app-pelisearch',
  standalone: true,
  imports: [],
  templateUrl: './pelisearch.component.html',
  styleUrl: './pelisearch.component.css'
})
export class PelisearchComponent implements OnInit{

  peliculas: Pelicula[] = [];

  constructor(private _route: ActivatedRoute,
              private apiMovieService: ApipeliculasService
  ) { }

  ngOnInit(): void {
      this._route.params.subscribe(params => {
        
        this.apiMovieService.getbusquedamultiple(params['id']).subscribe({
          next:(data: any) => {
            console.log(data);
            this.peliculas = data.results;
          },error: (error) => {
            console.log(error);
          }
        })
      })
  }



}
