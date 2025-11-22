import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NewCourseComponent } from './new-course.component';

describe('NewCourseComponent', () => {
  let component: NewCourseComponent;
  let fixture: ComponentFixture<NewCourseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewCourseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewCourseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
