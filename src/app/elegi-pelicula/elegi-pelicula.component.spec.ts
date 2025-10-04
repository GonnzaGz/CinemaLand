import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ElegiPeliculaComponent } from './elegi-pelicula.component';

describe('ElegiPeliculaComponent', () => {
  let component: ElegiPeliculaComponent;
  let fixture: ComponentFixture<ElegiPeliculaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ElegiPeliculaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ElegiPeliculaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
