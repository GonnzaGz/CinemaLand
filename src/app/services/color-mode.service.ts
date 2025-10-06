import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ColorModeService {
  private renderer: Renderer2;
  private key = 'colorBlindMode';
  private isColorBlind = false;

  constructor(private rendererFactory: RendererFactory2) {
    this.renderer = this.rendererFactory.createRenderer(null, null);

    // 👇 Inicializar estado desde localStorage
    const saved = localStorage.getItem(this.key);
    this.isColorBlind = saved === 'true';
    this.applyBodyClass();
  }

  toggleColorBlindMode(): void {
    this.isColorBlind = !this.isColorBlind;
    localStorage.setItem(this.key, this.isColorBlind.toString());
    this.applyBodyClass();
  }

  isColorBlindMode(): boolean {
    return this.isColorBlind;
  }

  private applyBodyClass(): void {
    if (this.isColorBlind) {
      this.renderer.addClass(document.body, 'color-blind-mode');
    } else {
      this.renderer.removeClass(document.body, 'color-blind-mode');
    }
  }
}
