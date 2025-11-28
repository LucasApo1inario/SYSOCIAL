import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

import { EnrollmentService } from '../../enrollment/services/enrollment.service';
import { StudentSummary, StudentFilter } from '../../enrollment/interfaces/enrollment.model';
import { StudentFilterComponent } from '../components/student-filter.component';
import { StudentTableComponent } from '../components/student-table.component';

@Component({
  selector: 'app-student-list-page',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    StudentFilterComponent,
    StudentTableComponent
  ],
  template: `
    <div class="min-h-screen bg-gray-50 py-10 px-4 font-sans flex justify-center items-start">
      <div class="w-full max-w-6xl">
        
        <div class="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Gestão de Alunos</h1>
            <p class="text-gray-500 mt-1">Consulte e gerencie os alunos matriculados</p>
          </div>
          
          <button (click)="goToNewEnrollment()" class="bg-[#246A73] text-white px-6 py-3 rounded-lg font-bold hover:bg-opacity-90 transition-all shadow-lg shadow-teal-900/20 flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            Nova Matrícula
          </button>
        </div>

        <app-student-filter (search)="onSearch($event)"></app-student-filter>

        <div *ngIf="isLoading" class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-[#246A73]"></div>
        </div>

        <app-student-table 
          *ngIf="!isLoading"
          [students]="paginatedStudents" 
          [total]="totalStudents"
          [currentPage]="currentPage"
          [pageSize]="pageSize"
          (pageChange)="onPageChange($event)"
          (edit)="onEdit($event)" 
          (cancel)="onCancel($event)">
        </app-student-table>

      </div>
    </div>
  `
})
export class StudentListPage implements OnInit {
  private service = inject(EnrollmentService);
  private router = inject(Router);

  allFilteredStudents: StudentSummary[] = [];
  paginatedStudents: StudentSummary[] = [];
  
  totalStudents = 0;
  currentPage = 1;
  pageSize = 10;
  isLoading = false;

  ngOnInit() {
    this.loadStudents({ status: 'ATIVO' });
  }

  onSearch(filters: StudentFilter) {
    this.loadStudents(filters);
  }

  onPageChange(newPage: number) {
    this.currentPage = newPage;
    this.updatePaginatedList();
  }

  loadStudents(filters: StudentFilter) {
    this.isLoading = true;
    this.service.searchStudents(filters).subscribe({
      next: (data) => {
        this.allFilteredStudents = data;
        this.totalStudents = data.length;
        this.currentPage = 1;
        this.updatePaginatedList();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao buscar alunos', err);
        this.isLoading = false;
      }
    });
  }

  updatePaginatedList() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedStudents = this.allFilteredStudents.slice(start, end);
  }

  goToNewEnrollment() {
    this.router.navigate(['/enrollment']); 
  }

  onEdit(id: number) {
    console.log('Editar aluno ID:', id);
    // Ex: this.router.navigate(['/enrollment/edit', id]);
  }

  onCancel(id: number) {
    // Aqui faremos a lógica de cancelamento depois
    console.log('Cancelar matrícula ID:', id);
    // Exemplo de confirmação futura:
    // if(confirm('Tem certeza?')) { ... }
  }
}