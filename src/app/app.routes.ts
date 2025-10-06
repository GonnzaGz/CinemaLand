import { Routes } from '@angular/router';
import { SeleccionAsientosComponent } from './seleccion-asientos/seleccion-asientos.component';
import { PelirandomComponent } from './pelirandom/pelirandom.component';
import { CompraEntradasComponent } from './compra-entradas/compra-entradas.component';
import { PelisearchComponent } from './pelisearch/pelisearch.component';
import { Error404Component } from './error404/error404.component';
import { NosotrosComponent } from './nosotros/nosotros.component';
import { LoginComponent } from './login/login.component';
import { CandyComponent } from './candy/candy.component';
import { CineFanComponent } from './cine-fan/cine-fan.component';
import { RegalaCineComponent } from './regala-cine/regala-cine.component';
import { StoreComponent } from './store/store.component';
import { ElegiPeliculaComponent } from './elegi-pelicula/elegi-pelicula.component';
import { MovieDetailsComponent } from './movie-details/movie-details.component';

export const routes: Routes = [
  { path: '', component: CompraEntradasComponent },

  { path: 'movie-details/:id', component: MovieDetailsComponent },

  { path: 'candy', component: CandyComponent },

  { path: 'cine-fan', component: CineFanComponent },

  { path: 'regala-cine', component: RegalaCineComponent },

  { path: 'store', component: StoreComponent },

  { path: 'elegi-pelicula', component: ElegiPeliculaComponent },

  { path: 'pelirandom', component: PelirandomComponent },

  { path: 'seleccion-asientos/:id', component: SeleccionAsientosComponent }, // Usamos :id para obtener el parámetro

  { path: 'pelissearch/:id', component: PelisearchComponent },

  { path: 'error404', component: Error404Component },

  { path: 'nosotros', component: NosotrosComponent },

  { path: 'login', component: LoginComponent },

  { path: '**', redirectTo: 'error404', pathMatch: 'full' },
];
