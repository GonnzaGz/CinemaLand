import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PelisearchComponent } from './pelisearch.component';

describe('PelisearchComponent', () => {
  let component: PelisearchComponent;
  let fixture: ComponentFixture<PelisearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PelisearchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PelisearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
