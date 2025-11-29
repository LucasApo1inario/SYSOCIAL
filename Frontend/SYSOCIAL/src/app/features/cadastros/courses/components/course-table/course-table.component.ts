import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Course } from '../../interfaces/course.interface';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardTableComponent, ZardTableHeaderComponent, ZardTableBodyComponent, ZardTableRowComponent, ZardTableHeadComponent, ZardTableCellComponent } from '@shared/components/table/table.component';
import { ZardBadgeComponent } from '@shared/components/badge/badge.component';

@Component({
  selector: 'app-course-table',
  standalone: true,
  imports: [
    ZardTableComponent,
    ZardTableHeaderComponent,
    ZardTableBodyComponent,
    ZardTableRowComponent,
    ZardTableHeadComponent,
    ZardTableCellComponent,
    ZardBadgeComponent,
    ZardButtonComponent,
  ],
  templateUrl: './course-table.component.html',
})
export class CourseTableComponent {
  @Input() courses: Course[] = [];
  @Output() edit = new EventEmitter<Course>();
  @Output() delete = new EventEmitter<Course>();

  trackById(index: number, course: Course): number {
    return course.id;
  }

  onEdit(course: Course) {
    this.edit.emit(course);
  }

  onDelete(course: Course) {
    this.delete.emit(course);
  }

  getBadgeType(ativo: boolean): 'default' | 'destructive' {
    return ativo ? 'default' : 'destructive';
  }
}
