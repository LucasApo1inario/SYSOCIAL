import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TurmaTableComponent } from './turma-table.component';

describe('TurmaTableComponent', () => {
  let component: TurmaTableComponent;
  let fixture: ComponentFixture<TurmaTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TurmaTableComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TurmaTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
