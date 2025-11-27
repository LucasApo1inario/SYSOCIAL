import { Routes } from '@angular/router';
import { CoursesListComponent } from './courses/pages/courses-list/courses-list.component';
import { NewCourseComponent } from './courses/pages/new-course/new-course.component';
import { EnrollmentPage } from './enrollment/pages/enrollment.page';
import { StudentListPage } from './student-list/pages/student-list.page'

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
    component: EnrollmentPage
  },
  {
    path: 'student-list',
    component: StudentListPage
  }
] as Routes;
