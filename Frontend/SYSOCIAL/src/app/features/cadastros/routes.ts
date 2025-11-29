import { Routes } from '@angular/router';
import { CoursesListComponent } from './courses/pages/courses-list/courses-list.component';
import { NewCourseComponent } from './courses/pages/new-course/new-course.component';
import { EditCourseComponent } from './courses/pages/edit-course/edit-course.component';
import { TurmasListComponent } from './turmas/pages/turmas-list/turmas-list.component';
import { NewTurmaComponent } from './turmas/pages/new-turma/new-turma.component';
import { EditTurmaComponent } from './turmas/pages/edit-turma/edit-turma.component';
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
    path: 'edit-course/:id',
    component: EditCourseComponent
  },
  {
    path: 'turmas',
    component: TurmasListComponent,
  },
  {
    path: 'new-turma',
    component: NewTurmaComponent
  },
  {
    path: 'edit-turma/:id',
    component: EditTurmaComponent
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
  {
    path: 'student-list',
    component: StudentListPage
  }
] as Routes;
