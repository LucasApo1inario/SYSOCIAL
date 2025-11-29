import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TurmasListComponent } from './turmas-list.component';

describe('TurmasListComponent', () => {
  let component: TurmasListComponent;
  let fixture: ComponentFixture<TurmasListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TurmasListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TurmasListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
