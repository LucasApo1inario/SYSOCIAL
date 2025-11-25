import { Routes } from '@angular/router';
import { CoursesListComponent } from './courses/pages/courses-list/courses-list.component';
import { NewCourseComponent } from './courses/pages/new-course/new-course.component';
import { EnrollmentComponent } from './enrollment/enrollment.component';

export default [
  {
    path: 'courses',            
    component: CoursesListComponent,
  },
  {
    path: 'new-course',
    component: NewCourseComponent
  },
  {
    path: 'enrollment',
    component: EnrollmentComponent
  }
] as Routes;
