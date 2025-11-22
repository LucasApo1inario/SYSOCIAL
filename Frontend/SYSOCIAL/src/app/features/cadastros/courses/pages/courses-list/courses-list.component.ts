import { Component, computed, inject, Signal, signal, WritableSignal } from '@angular/core';
import { Course } from '../../interfaces/course.interface';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { CourseTableComponent } from '../../components/course-table/course-table.component';
import { CoursePaginationComponent } from '../../components/course-pagination/course-pagination.component';
import { ZardInputDirective } from '@shared/components/input/input.directive';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-courses-list',
  imports: [ZardButtonComponent, ZardInputDirective, CourseTableComponent, FormsModule, CoursePaginationComponent],
  templateUrl: './courses-list.component.html',
  styleUrl: './courses-list.component.css'
})
export class CoursesListComponent {
  private router = inject(Router);

  searchQuery = signal('');
  courses: WritableSignal<Course[]> = signal([]);

  displayedCourses = computed(() =>
    this.courses().filter(c =>
      c.nome.toLowerCase().includes(this.searchQuery().toLowerCase()) 
    )
  );

  pageSize = signal(7);
  currentPage = signal(1);
  isMobile = signal(false);

  private checkScreen() {
    this.isMobile.set(window.innerWidth < 768);
    this.pageSize.set(this.isMobile() ? 5 : 7);
  }

  totalPages = computed(() =>
    Math.ceil(this.displayedCourses().length / this.pageSize())
  );

  pagedCourses = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.displayedCourses().slice(start, start + this.pageSize());
  });

  constructor() {
    this.checkScreen();
    window.addEventListener('resize', () => this.checkScreen());

    this.courses.set([
      { id: '1',  nome: 'Desenvolvimento Web com Angular', status: 'Ativo', vagas: 30 },
      { id: '2',  nome: 'Python para Iniciantes',          status: 'Ativo', vagas: 25 },
      { id: '3',  nome: 'Design Thinking',                 status: 'Ativo', vagas: 20 },
      { id: '4',  nome: 'Marketing Digital',               status: 'Ativo', vagas: 40 },
      { id: '5',  nome: 'Gestão de Projetos',              status: 'Inativo', vagas: 0 },
      { id: '6',  nome: 'Excel Avançado',                  status: 'Ativo', vagas: 35 },
      { id: '7',  nome: 'Empreendedorismo Social',         status: 'Ativo', vagas: 15 },
      { id: '8',  nome: 'Fotografia Básica',               status: 'Ativo', vagas: 18 },
      { id: '9',  nome: 'Inglês para Negócios',            status: 'Ativo', vagas: 22 },
      { id: '10', nome: 'Redação e Oratória',              status: 'Inativo', vagas: 0 },
      { id: '11', nome: 'React Native',                    status: 'Ativo', vagas: 28 },
      { id: '12', nome: 'UX/UI Design',                    status: 'Ativo', vagas: 30 },
      { id: '13', nome: 'Contabilidade Básica',            status: 'Ativo', vagas: 25 },
      { id: '14', nome: 'Finanças Pessoais',               status: 'Ativo', vagas: 32 },
      { id: '15', nome: 'Java Avançado',                   status: 'Inativo', vagas: 0 },
    ]);
  }


  addCourse() {
    this.router.navigate(['cadastros/new-course']);
  }

  editCourse(course: Course) {
    console.log('Editar', course);
  }

  deleteCourse(course: Course) {
    this.courses.set(this.courses().filter(c => c.id !== course.id));
  }

  get search(): string {
    return this.searchQuery();
  }

  set search(value: string) {
    this.searchQuery.set(value);
  }
}
