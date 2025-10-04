import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CineFanComponent } from './cine-fan.component';

describe('CineFanComponent', () => {
  let component: CineFanComponent;
  let fixture: ComponentFixture<CineFanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CineFanComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CineFanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
