import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FavoritosService {
  private favoritosAbiertoSubject = new BehaviorSubject<boolean>(false);
  public favoritosAbierto$ = this.favoritosAbiertoSubject.asObservable();

  constructor() {}

  toggleFavoritos() {
    this.favoritosAbiertoSubject.next(!this.favoritosAbiertoSubject.value);
  }

  cerrarFavoritos() {
    this.favoritosAbiertoSubject.next(false);
  }

  abrirFavoritos() {
    this.favoritosAbiertoSubject.next(true);
  }

  get favoritosAbierto(): boolean {
    return this.favoritosAbiertoSubject.value;
  }
}
