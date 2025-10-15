import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import chroma from 'chroma-js';

export interface ColorblindMode {
  id: string;
  name: string;
  description: string;
  icon: string;
}

@Injectable({
  providedIn: 'root',
})
export class DaltonismService {
  private colorblindModeSubject = new BehaviorSubject<string>('normal');
  public colorblindMode$ = this.colorblindModeSubject.asObservable();

  private isActiveSubject = new BehaviorSubject<boolean>(false);
  public isActive$ = this.isActiveSubject.asObservable();

  // Tipos de daltonismo simulado
  private colorblindModes: ColorblindMode[] = [
    {
      id: 'normal',
      name: 'Visión Normal',
      description: 'Sin filtros de color',
      icon: 'fas fa-eye',
    },
    {
      id: 'protanopia',
      name: 'Protanopia',
      description: 'Dificultad para ver el rojo',
      icon: 'fas fa-adjust',
    },
    {
      id: 'deuteranopia',
      name: 'Deuteranopia',
      description: 'Dificultad para ver el verde',
      icon: 'fas fa-low-vision',
    },
    {
      id: 'tritanopia',
      name: 'Tritanopia',
      description: 'Dificultad para ver el azul',
      icon: 'fas fa-eye-slash',
    },
    {
      id: 'achromatopsia',
      name: 'Acromatopsia',
      description: 'Visión en escala de grises',
      icon: 'fas fa-circle',
    },
    {
      id: 'high-contrast',
      name: 'Alto Contraste',
      description: 'Colores de alto contraste',
      icon: 'fas fa-contrast',
    },
  ];

  constructor() {
    // Cargar configuración guardada
    this.loadSavedSettings();
  }

  // Obtener todos los modos disponibles
  getColorblindModes(): ColorblindMode[] {
    return this.colorblindModes;
  }

  // Activar/desactivar modo daltonismo
  toggleDaltonismMode(): void {
    const isCurrentlyActive = this.isActiveSubject.value;
    this.setDaltonismActive(!isCurrentlyActive);
  }

  // Establecer si el modo está activo
  setDaltonismActive(active: boolean): void {
    this.isActiveSubject.next(active);
    this.saveSetting('daltonismActive', active.toString());
    this.applyColorblindMode();
  }

  // Cambiar tipo de daltonismo
  setColorblindMode(mode: string): void {
    this.colorblindModeSubject.next(mode);
    this.saveSetting('colorblindMode', mode);
    this.applyColorblindMode();
  }

  // Aplicar filtros CSS para simular daltonismo
  private applyColorblindMode(): void {
    const isActive = this.isActiveSubject.value;
    const mode = this.colorblindModeSubject.value;

    // Remover filtros existentes
    this.removeColorblindFilters();

    if (isActive && mode !== 'normal') {
      this.addColorblindFilter(mode);
    }
  }

  // Agregar filtro CSS
  private addColorblindFilter(mode: string): void {
    const body = document.body;
    let filterValue = '';

    switch (mode) {
      case 'protanopia':
        // Simular protanopia (ceguera al rojo)
        filterValue =
          'sepia(100%) saturate(0%) hue-rotate(90deg) brightness(1.2)';
        break;
      case 'deuteranopia':
        // Simular deuteranopia (ceguera al verde)
        filterValue =
          'sepia(50%) saturate(0.8) hue-rotate(180deg) brightness(1.1)';
        break;
      case 'tritanopia':
        // Simular tritanopia (ceguera al azul)
        filterValue =
          'sepia(80%) saturate(1.2) hue-rotate(270deg) brightness(1.1)';
        break;
      case 'achromatopsia':
        // Simular acromatopsia (escala de grises)
        filterValue = 'grayscale(100%) contrast(1.2)';
        break;
      case 'high-contrast':
        // Alto contraste
        filterValue = 'contrast(200%) saturate(150%) brightness(1.1)';
        break;
    }

    if (filterValue) {
      body.style.filter = filterValue;
      body.classList.add('daltonism-mode-active');
      body.setAttribute('data-colorblind-mode', mode);
    }
  }

  // Remover filtros de daltonismo
  private removeColorblindFilters(): void {
    const body = document.body;
    body.style.filter = '';
    body.classList.remove('daltonism-mode-active');
    body.removeAttribute('data-colorblind-mode');
  }

  // Obtener colores accesibles para UI específica
  getAccessibleColors(): { [key: string]: string } {
    const mode = this.colorblindModeSubject.value;
    const isActive = this.isActiveSubject.value;

    if (!isActive || mode === 'normal') {
      return {
        primary: '#d4af37',
        secondary: '#4a90e2',
        success: '#4caf50',
        warning: '#ff9800',
        danger: '#f44336',
        info: '#2196f3',
      };
    }

    // Colores accesibles para diferentes tipos de daltonismo
    switch (mode) {
      case 'protanopia':
      case 'deuteranopia':
        return {
          primary: '#0066cc', // Azul fuerte
          secondary: '#ffcc00', // Amarillo
          success: '#009900', // Verde oscuro
          warning: '#ff6600', // Naranja
          danger: '#000000', // Negro para contraste
          info: '#006699', // Azul oscuro
        };
      case 'tritanopia':
        return {
          primary: '#cc0066', // Magenta
          secondary: '#990000', // Rojo oscuro
          success: '#006600', // Verde muy oscuro
          warning: '#ff3300', // Rojo-naranja
          danger: '#000000', // Negro
          info: '#660099', // Púrpura
        };
      case 'achromatopsia':
        return {
          primary: '#444444', // Gris oscuro
          secondary: '#888888', // Gris medio
          success: '#222222', // Casi negro
          warning: '#666666', // Gris
          danger: '#000000', // Negro
          info: '#333333', // Gris muy oscuro
        };
      case 'high-contrast':
        return {
          primary: '#000000', // Negro
          secondary: '#ffffff', // Blanco
          success: '#00ff00', // Verde brillante
          warning: '#ffff00', // Amarillo brillante
          danger: '#ff0000', // Rojo brillante
          info: '#0000ff', // Azul brillante
        };
      default:
        return {
          primary: '#d4af37',
          secondary: '#4a90e2',
          success: '#4caf50',
          warning: '#ff9800',
          danger: '#f44336',
          info: '#2196f3',
        };
    }
  }

  // Verificar si un color es accesible
  isColorAccessible(
    color: string,
    backgroundColor: string = '#ffffff'
  ): boolean {
    try {
      const colorContrast = chroma.contrast(
        chroma(color),
        chroma(backgroundColor)
      );
      return colorContrast >= 4.5; // WCAG AA standard
    } catch (error) {
      console.warn('Error checking color accessibility:', error);
      return true;
    }
  }

  // Obtener color alternativo accesible
  getAccessibleAlternative(
    color: string,
    backgroundColor: string = '#ffffff'
  ): string {
    if (this.isColorAccessible(color, backgroundColor)) {
      return color;
    }

    const mode = this.colorblindModeSubject.value;
    const accessibleColors = this.getAccessibleColors();

    // Encontrar el color más cercano en la paleta accesible
    const colorHue = chroma(color).get('hsl.h') || 0;

    if (colorHue >= 0 && colorHue < 60) return accessibleColors['warning'];
    if (colorHue >= 60 && colorHue < 120) return accessibleColors['success'];
    if (colorHue >= 120 && colorHue < 240) return accessibleColors['info'];
    if (colorHue >= 240 && colorHue < 300) return accessibleColors['primary'];

    return accessibleColors['secondary'];
  }

  // Guardar configuración
  private saveSetting(key: string, value: string): void {
    try {
      localStorage.setItem(`daltonism_${key}`, value);
    } catch (error) {
      console.warn('Error saving daltonism setting:', error);
    }
  }

  // Cargar configuración guardada
  private loadSavedSettings(): void {
    try {
      const savedActive = localStorage.getItem('daltonism_daltonismActive');
      const savedMode = localStorage.getItem('daltonism_colorblindMode');

      if (savedActive !== null) {
        this.isActiveSubject.next(savedActive === 'true');
      }

      if (savedMode) {
        this.colorblindModeSubject.next(savedMode);
      }

      // Aplicar configuración cargada
      if (this.isActiveSubject.value) {
        this.applyColorblindMode();
      }
    } catch (error) {
      console.warn('Error loading daltonism settings:', error);
    }
  }

  // Resetear a configuración por defecto
  resetToDefault(): void {
    this.setColorblindMode('normal');
    this.setDaltonismActive(false);
  }

  // Obtener información del modo actual
  getCurrentModeInfo(): ColorblindMode {
    const currentMode = this.colorblindModeSubject.value;
    return (
      this.colorblindModes.find((mode) => mode.id === currentMode) ||
      this.colorblindModes[0]
    );
  }
}
