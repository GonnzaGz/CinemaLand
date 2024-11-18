import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PelirandomComponent } from './pelirandom.component';

describe('PelirandomComponent', () => {
  let component: PelirandomComponent;
  let fixture: ComponentFixture<PelirandomComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PelirandomComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PelirandomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
