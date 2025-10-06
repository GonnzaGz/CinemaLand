import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApipeliculasService {
  //#region Variables
  private apiKey = '86f029bc865aa2c075d4f8ef858dd233';
  private apiUrl = 'https://api.themoviedb.org/3';
  //#endregion

  // 🔹 Nuevo: estado del modo daltonismo
  private colorBlindModeSubject = new BehaviorSubject<boolean>(false);
  colorBlindMode$ = this.colorBlindModeSubject.asObservable();

  constructor(private http: HttpClient) {
    // Si el usuario ya tenía el modo activado, lo aplicamos
    const savedMode = localStorage.getItem('colorBlindMode');
    if (savedMode === 'true') {
      this.enableColorBlindMode();
    }
  }

  //#region ===================== PETICIONES API =====================

  getPopularMovies(): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/movie/popular?language=es-ar&page=1&api_key=${this.apiKey}`
    );
  }

  getDetalleMovie(id: string): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/movie/${id}?language=es-ar&api_key=${this.apiKey}`
    );
  }

  getbusquedamultiple(query: string): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/search/multi?query=${query}&language=es-ar&api_key=${this.apiKey}`
    );
  }

  getcategorias(): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/genre/movie/list?language=es-ar&api_key=${this.apiKey}`
    );
  }

  getbusquedaporcategoria(id: string): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/discover/movie?with_genres=${id}&language=es-ar&api_key=${this.apiKey}`
    );
  }

  gettoken(): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/authentication/token/new?api_key=${this.apiKey}`
    );
  }

  postvalidate(token: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/authentication/token/validate_with_login?api_key=${this.apiKey}`,
      {
        username: 'Desarrollotest1',
        password: 'desarrollofront',
        request_token: token,
      }
    );
  }

  postconvetir(token: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/authentication/session/new?api_key=${this.apiKey}`,
      { request_token: token }
    );
  }

  postcrearlista(token: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/list?api_key=${this.apiKey}&session_id=${token}`,
      { name: 'My Favorito', description: 'My Favorito', language: 'es' }
    );
  }

  postagregarpeliculalista(
    idlista: string,
    idsession: string,
    idpelicula: string
  ): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/list/${idlista}/add_item?api_key=${this.apiKey}&session_id=${idsession}`,
      { media_id: Number(idpelicula) }
    );
  }

  getpeliculaslista(idlista: string): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/list/${idlista}?api_key=${this.apiKey}`
    );
  }

  deletelistacompleta(idlista: string, idsession: string): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/list/${idlista}?api_key=${this.apiKey}&session_id=${idsession}`
    );
  }

  posteliminarpeliculalista(
    idlista: string,
    idsession: string,
    idpelicula: string
  ): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/list/${idlista}/remove_item?api_key=${this.apiKey}&session_id=${idsession}`,
      { media_id: idpelicula }
    );
  }

  esEstreno(fechaLanzamiento: string): boolean {
    const fecha = new Date(fechaLanzamiento);
    const hoy = new Date();
    const diferenciaEnDias =
      (hoy.getTime() - fecha.getTime()) / (1000 * 3600 * 24);
    return diferenciaEnDias <= 60;
  }

  getEstrenosPorCategoria(idCategoria: string): Observable<any> {
    const hoy = new Date().toISOString().split('T')[0];
    const haceDosMeses = new Date();
    haceDosMeses.setMonth(haceDosMeses.getMonth() - 2);
    const fechaInicio = haceDosMeses.toISOString().split('T')[0];

    return this.http.get(
      `${this.apiUrl}/discover/movie?api_key=${this.apiKey}&with_genres=${idCategoria}&sort_by=release_date.desc&primary_release_date.gte=${fechaInicio}&primary_release_date.lte=${hoy}`
    );
  }

  //#endregion ======================================================

  //#region ===================== MODO DALTONISMO =====================

  toggleColorBlindMode() {
    const newMode = !this.colorBlindModeSubject.value;
    this.colorBlindModeSubject.next(newMode);
    localStorage.setItem('colorBlindMode', String(newMode));

    if (newMode) {
      document.body.classList.add('color-blind-mode');
    } else {
      document.body.classList.remove('color-blind-mode');
    }
  }

  enableColorBlindMode() {
    this.colorBlindModeSubject.next(true);
    localStorage.setItem('colorBlindMode', 'true');
    document.body.classList.add('color-blind-mode');
  }

  disableColorBlindMode() {
    this.colorBlindModeSubject.next(false);
    localStorage.setItem('colorBlindMode', 'false');
    document.body.classList.remove('color-blind-mode');
  }

  get isColorBlindMode(): boolean {
    return this.colorBlindModeSubject.value;
  }

  //#endregion ======================================================
}
