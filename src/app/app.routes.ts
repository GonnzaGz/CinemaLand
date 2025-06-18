import { Routes } from '@angular/router';
import { SeleccionAsientosComponent } from './seleccion-asientos/seleccion-asientos.component';
import { PelirandomComponent } from './pelirandom/pelirandom.component';
import { CompraEntradasComponent } from './compra-entradas/compra-entradas.component';
import { PelisearchComponent } from './pelisearch/pelisearch.component';
import { Error404Component } from './error404/error404.component';
import { NosotrosComponent } from './nosotros/nosotros.component';
import { LoginComponent } from './login/login.component';

export const routes: Routes = [
  { path: '', component: CompraEntradasComponent },

  { path: 'pelirandom', component: PelirandomComponent },

  { path: 'seleccion-asientos/:id', component: SeleccionAsientosComponent }, // Usamos :id para obtener el parámetro

  { path: 'pelissearch/:id', component: PelisearchComponent },

  { path: 'error404', component: Error404Component },

  { path: 'nosotros', component: NosotrosComponent },

  { path: 'login', component: LoginComponent },

  { path: '**', redirectTo: 'error404', pathMatch: 'full' },
];
