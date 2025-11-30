import { Component, computed, inject, OnInit, Signal, signal, WritableSignal } from '@angular/core';
import { Course } from '../../interfaces/course.interface';
import { CoursesService } from '../../services/course.service';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { CourseTableComponent } from '../../components/course-table/course-table.component';
import { CoursePaginationComponent } from '../../components/course-pagination/course-pagination.component';
import { ZardInputDirective } from '@shared/components/input/input.directive';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { toast } from 'ngx-sonner';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-courses-list',
  imports: [
    CommonModule,
    ZardButtonComponent,
    ZardInputDirective,
    CourseTableComponent,
    FormsModule,
    CoursePaginationComponent
  ],
  templateUrl: './courses-list.component.html',
  styleUrl: './courses-list.component.css'
})
export class CoursesListComponent implements OnInit {
  private router = inject(Router);
  private courseService = inject(CoursesService);

  searchQuery = signal('');
  courses: WritableSignal<Course[]> = signal([]);
  loading = signal(false);

  displayedCourses = computed(() =>
    this.courses()
      .filter(c =>
        c.nome.toLowerCase().includes(this.searchQuery().toLowerCase())
      )
      .sort((a, b) => a.id - b.id)
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

  ngOnInit() {
    this.checkScreen();
    window.addEventListener('resize', () => this.checkScreen());
    this.loadCourses();
  }

  /**
   * Carrega a lista de cursos da API
   */
  loadCourses() {
    this.loading.set(true);
    this.courseService.getCourses().subscribe({
      next: (courses) => {
        this.courses.set(courses);
        this.loading.set(false);
      },
      error: (err: any) => {
        this.loading.set(false);
        const errorMsg = err?.error?.message || 'Erro ao carregar cursos.';
        toast.error(errorMsg, {
          duration: 5000,
          position: 'bottom-center',
        });
      }
    });
  }

  /**
   * Navega para página de criação de novo curso
   */
  addCourse() {
    this.router.navigate(['cadastros/new-course']);
  }

  /**
   * Navega para página de edição do curso
   */
  editCourse(course: Course) {
    this.router.navigate(['cadastros/edit-course', course.id]);
  }

  /**
   * Deleta um curso
   */
  deleteCourse(course: Course) {
    if (!confirm(`Tem certeza que deseja deletar o curso "${course.nome}"?`)) {
      return;
    }

    this.courseService.deleteCourse(course.id).subscribe({
      next: () => {
        toast.success('Curso deletado com sucesso!', {
          duration: 4000,
          position: 'bottom-center',
        });
        this.loadCourses();
      },
      error: (err: any) => {
        const errorMsg = err?.error?.message || 'Erro ao deletar curso.';
        toast.error(errorMsg, {
          duration: 5000,
          position: 'bottom-center',
        });
      }
    });
  }

  get search(): string {
    return this.searchQuery();
  }

  set search(value: string) {
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }
}
