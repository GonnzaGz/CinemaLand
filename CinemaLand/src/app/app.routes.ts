import { Routes } from '@angular/router';
import { SeleccionAsientosComponent } from './seleccion-asientos/seleccion-asientos.component';

export const appRoutes: Routes = [
  { path: 'seleccion-asientos/:id', component: SeleccionAsientosComponent }, // Usamos :id para obtener el parámetro
  { path: '', redirectTo: '/home', pathMatch: 'full' }
];
