import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserPaginationComponent } from './user-pagination.component';

describe('UserPaginationComponent', () => {
  let component: UserPaginationComponent;
  let fixture: ComponentFixture<UserPaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserPaginationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserPaginationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
