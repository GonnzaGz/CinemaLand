import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router'; // Necesario para el enrutamiento
import { provideHttpClient } from '@angular/common/http'; // Importa el proveedor de HttpClient
import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app.routes'; // Importamos las rutas

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(appRoutes), // Proporcionamos las rutas en la aplicación
    provideHttpClient() // Proveedor para HttpClient
  ]
})
  .catch((err) => console.error(err));
