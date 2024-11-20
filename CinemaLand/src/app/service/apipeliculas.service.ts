import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApipeliculasService {

  //#region Variables
  private apiKey = '86f029bc865aa2c075d4f8ef858dd233';  // Asegúrate de que tu API Key esté correcta
  private apiUrl = 'https://api.themoviedb.org/3';
  //#endregion

  constructor(private http: HttpClient) { }

  //#region getPopularMovies
  getPopularMovies(): Observable<any> {
    return this.http.get(`${this.apiUrl}/movie/popular?language=es-ar&page=1&api_key=${this.apiKey}`);
  }
  //#endregion

  //#region getDetalleMovie
  getDetalleMovie(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/movie/${id}?language=es-ar&api_key=${this.apiKey}`);
  }
  //#endregion

  getbusquedamultiple(query: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/search/multi?query=${query}&language=es-ar&api_key=${this.apiKey}`);
  }

  getcategorias(): Observable<any> {
    return this.http.get(`${this.apiUrl}/genre/movie/list?language=es-ar&api_key=${this.apiKey}`);
  }

  getbusquedaporcategoria(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/discover/movie?with_genres=${id}&language=es-ar&api_key=${this.apiKey}`);
  }
}

