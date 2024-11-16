import { Component } from '@angular/core';
import { CompraEntradasComponent } from './compra-entradas/compra-entradas.component';
import { RouterModule } from '@angular/router';  // Asegúrate de importar RouterModule


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true, // Hacemos este componente standalone
  imports: [CompraEntradasComponent, RouterModule], // Importamos el componente CompraEntradas
})
export class AppComponent {
  title = 'CinemaLand';
}
