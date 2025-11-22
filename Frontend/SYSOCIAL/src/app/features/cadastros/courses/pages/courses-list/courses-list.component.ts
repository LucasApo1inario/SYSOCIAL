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
      c.nome.toLowerCase().includes(this.searchQuery().toLowerCase()) ||
      c.instrutor.toLowerCase().includes(this.searchQuery().toLowerCase())
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
      { id: '1', nome: 'Desenvolvimento Web com Angular', modalidade: 'Online', cargaHoraria: 80, dataInicio: '2025-01-15', status: 'Ativo', instrutor: 'João Silva' },
      { id: '2', nome: 'Python para Iniciantes', modalidade: 'Presencial', cargaHoraria: 40, dataInicio: '2025-01-20', status: 'Ativo', instrutor: 'Maria Santos' },
      { id: '3', nome: 'Design Thinking', modalidade: 'Híbrido', cargaHoraria: 60, dataInicio: '2025-02-01', status: 'Ativo', instrutor: 'Carlos Oliveira' },
      { id: '4', nome: 'Marketing Digital', modalidade: 'Online', cargaHoraria: 50, dataInicio: '2025-02-10', status: 'Ativo', instrutor: 'Ana Costa' },
      { id: '5', nome: 'Gestão de Projetos', modalidade: 'Presencial', cargaHoraria: 120, dataInicio: '2024-12-01', status: 'Inativo', instrutor: 'Pedro Lima' },
      { id: '6', nome: 'Excel Avançado', modalidade: 'Online', cargaHoraria: 30, dataInicio: '2025-01-25', status: 'Ativo', instrutor: 'Beatriz Souza' },
      { id: '7', nome: 'Empreendedorismo Social', modalidade: 'Híbrido', cargaHoraria: 70, dataInicio: '2025-02-15', status: 'Ativo', instrutor: 'Lucas Martins' },
      { id: '8', nome: 'Fotografia Básica', modalidade: 'Presencial', cargaHoraria: 40, dataInicio: '2025-01-30', status: 'Ativo', instrutor: 'Fernanda Alves' },
      { id: '9', nome: 'Inglês para Negócios', modalidade: 'Online', cargaHoraria: 90, dataInicio: '2025-02-05', status: 'Ativo', instrutor: 'Roberto Ferreira' },
      { id: '10', nome: 'Redação e Oratória', modalidade: 'Presencial', cargaHoraria: 45, dataInicio: '2024-11-15', status: 'Inativo', instrutor: 'Juliana Rocha' },
      { id: '11', nome: 'React Native', modalidade: 'Online', cargaHoraria: 100, dataInicio: '2025-02-20', status: 'Ativo', instrutor: 'Diego Nascimento' },
      { id: '12', nome: 'UX/UI Design', modalidade: 'Híbrido', cargaHoraria: 85, dataInicio: '2025-01-28', status: 'Ativo', instrutor: 'Patrícia Gomes' },
      { id: '13', nome: 'Contabilidade Básica', modalidade: 'Presencial', cargaHoraria: 60, dataInicio: '2025-02-12', status: 'Ativo', instrutor: 'Gustavo Pinto' },
      { id: '14', nome: 'Finanças Pessoais', modalidade: 'Online', cargaHoraria: 25, dataInicio: '2025-01-22', status: 'Ativo', instrutor: 'Camila Dias' },
      { id: '15', nome: 'Java Avançado', modalidade: 'Online', cargaHoraria: 110, dataInicio: '2024-12-10', status: 'Inativo', instrutor: 'Rafael Cardoso' },
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
