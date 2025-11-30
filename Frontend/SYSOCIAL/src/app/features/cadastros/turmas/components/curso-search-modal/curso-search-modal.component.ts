import { Component, Output, EventEmitter, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CoursesService } from '../../../courses/services/course.service';
import { Course } from '../../../courses/interfaces/course.interface';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardInputDirective } from '@shared/components/input/input.directive';
import {
  ZardTableComponent,
  ZardTableHeaderComponent,
  ZardTableBodyComponent,
  ZardTableRowComponent,
  ZardTableHeadComponent,
  ZardTableCellComponent
} from '@shared/components/table/table.component';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-curso-search-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ZardButtonComponent,
    ZardInputDirective,
    ZardTableComponent,
    ZardTableHeaderComponent,
    ZardTableBodyComponent,
    ZardTableRowComponent,
    ZardTableHeadComponent,
    ZardTableCellComponent,
  ],
  templateUrl: './curso-search-modal.component.html',
  styleUrl: './curso-search-modal.component.css'
})
export class CursoSearchModalComponent implements OnInit {
  @Output() select = new EventEmitter<Course>();
  @Output() close = new EventEmitter<void>();

  private coursesService = inject(CoursesService);

  courses = signal<Course[]>([]);
  filteredCourses = signal<Course[]>([]);
  loading = signal(false);
  searchQuery = signal('');

  ngOnInit() {
    this.loadCourses();
  }

  loadCourses() {
    this.loading.set(true);
    this.coursesService.getCourses().subscribe({
      next: (courses) => {
        this.courses.set(courses);
        this.filteredCourses.set(courses);
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

  onSearch(query: string) {
    this.searchQuery.set(query);
    const filtered = this.courses().filter(c =>
      c.nome.toLowerCase().includes(query.toLowerCase())
    );
    this.filteredCourses.set(filtered);
  }

  selectCourse(course: Course) {
    this.select.emit(course);
  }

  onClose() {
    this.close.emit();
  }

  trackById(index: number, course: Course): number {
    return course.id;
  }
}
