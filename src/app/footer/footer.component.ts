import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DaltonismService, ColorblindMode } from '../service/daltonism.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
})
export class FooterComponent implements OnInit, OnDestroy {
  private daltonismService = inject(DaltonismService);

  isDaltonismActive: boolean = false;
  currentMode: ColorblindMode = {
    id: 'normal',
    name: 'Visión Normal',
    description: 'Sin filtros',
    icon: 'fas fa-eye',
  };
  showDaltonismMenu: boolean = false;
  colorblindModes: ColorblindMode[] = [];

  private subscriptions = new Subscription();

  ngOnInit() {
    this.colorblindModes = this.daltonismService.getColorblindModes();

    // Suscribirse a cambios del servicio
    this.subscriptions.add(
      this.daltonismService.isActive$.subscribe((active) => {
        this.isDaltonismActive = active;
      })
    );

    this.subscriptions.add(
      this.daltonismService.colorblindMode$.subscribe((mode) => {
        this.currentMode = this.daltonismService.getCurrentModeInfo();
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  // Toggle del modo daltonismo
  toggleDaltonismMode() {
    this.daltonismService.toggleDaltonismMode();
  }

  // Cambiar tipo específico de daltonismo
  selectColorblindMode(mode: ColorblindMode) {
    this.daltonismService.setColorblindMode(mode.id);
    this.daltonismService.setDaltonismActive(true);
    this.showDaltonismMenu = false;
  }

  // Toggle del menú
  toggleDaltonismMenu() {
    this.showDaltonismMenu = !this.showDaltonismMenu;
  }

  // Cerrar menú al hacer click fuera
  closeDaltonismMenu() {
    this.showDaltonismMenu = false;
  }
}
