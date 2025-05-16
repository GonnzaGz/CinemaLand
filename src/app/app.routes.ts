import { Routes } from '@angular/router';
import { SeleccionAsientosComponent } from './seleccion-asientos/seleccion-asientos.component';
import { PelirandomComponent } from './pelirandom/pelirandom.component';
import { CompraEntradasComponent } from './compra-entradas/compra-entradas.component';
import { PelisearchComponent } from './pelisearch/pelisearch.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home',pathMatch: 'full'},

  { path: 'home', component: CompraEntradasComponent },
  
  { path:'pelirandom', component: PelirandomComponent},

  { path: 'seleccion-asientos/:id', component: SeleccionAsientosComponent }, // Usamos :id para obtener el parámetro

  { path: 'pelissearch/:id', component: PelisearchComponent },

  {path: '**', redirectTo: '/home', pathMatch: 'full'},
  
];
