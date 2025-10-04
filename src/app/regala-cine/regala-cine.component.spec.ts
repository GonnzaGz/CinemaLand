import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegalaCineComponent } from './regala-cine.component';

describe('RegalaCineComponent', () => {
  let component: RegalaCineComponent;
  let fixture: ComponentFixture<RegalaCineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegalaCineComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegalaCineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
