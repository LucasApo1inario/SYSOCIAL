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
        
        <!-- Cabeçalho -->
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

        <!-- Componente de Filtro -->
        <app-student-filter (search)="onSearch($event)"></app-student-filter>

        <!-- Loading State -->
        <div *ngIf="isLoading" class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-[#246A73]"></div>
        </div>

        <!-- Componente de Tabela -->
        <app-student-table 
          *ngIf="!isLoading"
          [students]="students" 
          (edit)="onEdit($event)" 
          (details)="onDetails($event)">
        </app-student-table>

      </div>
    </div>
  `
})
export class StudentListPage implements OnInit {
  private service = inject(EnrollmentService);
  private router = inject(Router);

  students: StudentSummary[] = [];
  isLoading = false;

  ngOnInit() {
    // Carrega lista inicial sem filtros
    this.loadStudents({});
  }

  onSearch(filters: StudentFilter) {
    this.loadStudents(filters);
  }

  loadStudents(filters: StudentFilter) {
    this.isLoading = true;
    this.service.searchStudents(filters).subscribe({
      next: (data) => {
        this.students = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao buscar alunos', err);
        this.isLoading = false;
      }
    });
  }

  goToNewEnrollment() {
    // Ajuste a rota conforme seu arquivo de rotas (app.routes.ts)
    this.router.navigate(['/enrollment']); 
  }

  onEdit(id: number) {
    console.log('Editar aluno ID:', id);
    // this.router.navigate(['/enrollment/edit', id]);
  }

  onDetails(id: number) {
    console.log('Ver detalhes ID:', id);
  }
}