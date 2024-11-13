import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApipeliculasService {

  //#region Variables
  /**
   *  @variable apiKey - API Key de TMDb
   *  @variable apiUrl - URL de la API
   *  @description Son las key para poder comunicarse con la api
   */
  //private apiKey = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4NmYwMjliYzg2NWFhMmMwNzVkNGY4ZWY4NThkZDIzMyIsInN1YiI6IjY2MmJlNDY0MjBlNmE1MDEyODkyNDQ4NyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.1v5LBE79hbwrukhumVU2zbtX9DX-1CDIDeSwv3yW5F0'; // Reemplaza con tu API Key de TMDb
  private apiKey= '86f029bc865aa2c075d4f8ef858dd233';
  private apiUrl = 'https://api.themoviedb.org/3';
  //#endregion

  constructor(private http: HttpClient) { }

  //#region getPopularMovies
  /**
   * @function getPopularMovies
   * @descripcion Obtener pelis populares pasando la direcion de la api y la apikey para poder comunicarme con la api y me
   * devulve las peliculas populares
   * @returns: Observable <any>
   */
  getPopularMovies(): Observable<any> {
    return this.http.get(`${this.apiUrl}/movie/popular?language=es-ar&page=1&api_key=${this.apiKey}`);
  }
  //#endregion

  //#region getDetalleMovie
  /**
   * @function getDetalleMovie
   * @param id
   * @descripcion Obtener informacion de una pelicula segun id de la la pelicula
   * @returns: Observable <any>
   */
  getDetalleMovie(id:string): Observable<any> {
    return this.http.get(`${this.apiUrl}/movie/${id}?language=es-ar&api_key=${this.apiKey}`);
  }
  //#endregion
}
