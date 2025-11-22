import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ZardPaginationModule } from '@shared/components/pagination/pagination.module';

@Component({
  selector: 'app-course-pagination',
  standalone: true,
  imports: [ZardPaginationModule],
  templateUrl: './course-pagination.component.html',
})
export class CoursePaginationComponent {
  @Input() totalPages = 1;
  @Input() currentPage = 1;
  @Output() pageChange = new EventEmitter<number>();

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number) {
    this.pageChange.emit(page);
  }

  goToPrevious() {
    if (this.currentPage > 1) {
      this.pageChange.emit(this.currentPage - 1);
    }
  }

  goToNext() {
    if (this.currentPage < this.totalPages) {
      this.pageChange.emit(this.currentPage + 1);
    }
  }
}
