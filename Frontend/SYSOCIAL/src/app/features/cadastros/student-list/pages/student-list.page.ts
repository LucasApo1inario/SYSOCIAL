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
    StudentTableComponent,
  ],
  template: `
    <div class="min-h-screen bg-gray-50 py-10 px-4 font-sans flex justify-center items-start">
      <div class="w-full max-w-6xl">
        
        <div class="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Gestão de Alunos</h1>
            <p class="text-gray-500 mt-1">Consulte e gerencie os alunos matriculados</p>
          </div>
          
          <button (click)="goToNewEnrollment()" class="bg-[#246A73] text-white px-6 py-3 rounded-lg font-bold hover:bg-opacity-90 transition-all shadow-lg shadow-teal-900/20 flex items-center gap-2 transform hover:-translate-y-0.5">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            Nova Matrícula
          </button>
        </div>

        <!-- Passamos os filtros iniciais para restaurar o formulário -->
        <app-student-filter 
          [initialFilters]="currentFilters" 
          (search)="onSearch($event)">
        </app-student-filter>

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
  
  currentFilters: StudentFilter = { status: 'ATIVO' };

  ngOnInit() {
    // Tenta recuperar estado salvo do serviço
    const savedState = this.service.listState;

    if (savedState) {
      // Se tiver estado, restaura
      this.currentFilters = savedState.filters;
      this.currentPage = savedState.page;
      this.loadStudents(this.currentFilters, false); // false = não reseta página
    } else {
      // Se não, carrega padrão
      this.loadStudents({ status: 'ATIVO' }, true);
    }
  }

  onSearch(filters: StudentFilter) {
    this.currentFilters = filters;
    this.loadStudents(filters, true); // Nova busca = página 1
  }

  loadStudents(filters: StudentFilter, resetPage: boolean) {
    this.isLoading = true;
    
    this.service.searchStudents(filters).subscribe({
      next: (data) => {
        this.allFilteredStudents = data;
        this.totalStudents = data.length;
        
        if (resetPage) {
          this.currentPage = 1;
        }

        // Atualiza o estado no serviço para persistência
        this.saveState();
        
        this.updatePaginatedList();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao buscar alunos', err);
        this.isLoading = false;
      }
    });
  }

  onPageChange(newPage: number) {
    this.currentPage = newPage;
    this.updatePaginatedList();
    this.saveState(); // Salva a nova página no serviço
  }

  updatePaginatedList() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedStudents = this.allFilteredStudents.slice(start, end);
  }

  saveState() {
    this.service.listState = {
      filters: this.currentFilters,
      page: this.currentPage
    };
  }

  goToNewEnrollment() {
    this.router.navigate(['/cadastros/enrollment']); 
  }

  onEdit(id: number) {
    this.router.navigate(['/cadastros/enrollment', id]);
  }

  onCancel(id: number) {
    if (confirm('Tem certeza que deseja cancelar a matrícula?')) {
      this.isLoading = true; 
      this.service.cancelEnrollment(id).subscribe({
        next: () => {
          alert('Matrícula cancelada com sucesso!');
          this.loadStudents(this.currentFilters, false); // Recarrega mantendo página
        },
        error: (err) => {
          console.error(err);
          alert('Erro ao cancelar matrícula.');
          this.isLoading = false;
        }
      });
    }
  }
}