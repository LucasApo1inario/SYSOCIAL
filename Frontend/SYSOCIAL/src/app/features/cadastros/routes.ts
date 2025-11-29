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
    path: 'student-list',
    component: StudentListPage
  },
  {
    path: 'enrollment/:id', 
    component: EnrollmentPage 
  },
  {
    path: 'enrollment',
    component: EnrollmentPage
  },
] as Routes;
