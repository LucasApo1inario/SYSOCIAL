import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CoursePaginationComponent } from './course-pagination.component';

describe('CoursePaginationComponent', () => {
  let component: CoursePaginationComponent;
  let fixture: ComponentFixture<CoursePaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoursePaginationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CoursePaginationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
