import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewTurmaComponent } from './new-turma.component';

describe('NewTurmaComponent', () => {
  let component: NewTurmaComponent;
  let fixture: ComponentFixture<NewTurmaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewTurmaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NewTurmaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
