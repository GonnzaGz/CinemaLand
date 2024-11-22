import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApipeliculasService } from '../service/apipeliculas.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink,FormsModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  searchTerm = '';

  constructor(private apiMovieService: ApipeliculasService,private router: Router) {}

  onSearch() {
    this.apiMovieService.getbusquedamultiple(this.searchTerm).subscribe({
      next: (data: any) => {
        console.log(data.results.length);
        if(data.results.length == 0){
          alert("No se encontraron resultados para la busqueda");
        }
        else{
          this.router.navigate(['/pelissearch', this.searchTerm]);
          this.searchTerm = '';
        }
      },
      error: (error) => {
        console.error(error);
      }
    });

    
  }
}
