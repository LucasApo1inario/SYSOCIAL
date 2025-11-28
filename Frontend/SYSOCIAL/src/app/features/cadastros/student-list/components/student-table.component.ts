import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentSummary } from '../../enrollment/interfaces/enrollment.model';

@Component({
  selector: 'app-student-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      
      <!-- Tabela -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-gray-600">
          <thead class="bg-gray-50 text-xs uppercase font-bold text-gray-500 border-b border-gray-200">
            <tr>
              <th class="px-6 py-4">Nome / CPF</th>
              <th class="px-6 py-4">Idade / Sexo</th>
              <th class="px-6 py-4 w-1/3">Cursos / Turmas</th>
              <th class="px-6 py-4 text-center">Turnos</th>
              <th class="px-6 py-4 text-center">Status</th>
              <th class="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr *ngFor="let student of students" class="hover:bg-gray-50 transition-colors">
              
              <!-- Nome e CPF -->
              <td class="px-6 py-4 align-top">
                <p class="font-bold text-gray-900">{{ student.fullName }}</p>
                <p class="text-xs text-gray-400">{{ student.cpf }}</p>
                <p class="text-[10px] text-gray-400 mt-0.5">{{ student.school }}</p>
              </td>

              <!-- Idade e Sexo -->
              <td class="px-6 py-4 align-top">
                <p>{{ student.age }} anos</p>
                <span class="text-xs px-2 py-0.5 rounded-full font-semibold" 
                      [class.bg-blue-100]="student.gender === 'M'" [class.text-blue-700]="student.gender === 'M'"
                      [class.bg-pink-100]="student.gender === 'F'" [class.text-pink-700]="student.gender === 'F'">
                  {{ student.gender === 'M' ? 'Masculino' : 'Feminino' }}
                </span>
              </td>

              <!-- Cursos -->
              <td class="px-6 py-4 align-top">
                <div class="flex flex-col gap-2">
                  <div *ngFor="let course of student.courses | slice:0:2; let i = index" class="flex items-center text-xs h-5">
                    <span class="font-bold text-gray-700 mr-1">• {{ course }}</span>
                    <span class="text-gray-400 border-l border-gray-300 pl-1 ml-1">{{ student.classes[i] }}</span>
                  </div>
                  <div *ngIf="student.courses.length > 2">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                      +{{ student.courses.length - 2 }} outros...
                    </span>
                  </div>
                </div>
              </td>

              <!-- Turnos -->
              <td class="px-6 py-4 text-center align-top">
                <div class="flex flex-col gap-2 items-center">
                  <div *ngFor="let shift of student.shifts | slice:0:2" class="h-5 flex items-center">
                    <span class="capitalize text-gray-700 bg-gray-100 px-2 py-0.5 rounded text-xs font-medium border border-gray-200">
                      {{ shift }}
                    </span>
                  </div>
                </div>
              </td>

              <!-- Status -->
              <td class="px-6 py-4 text-center align-top">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                      [class.bg-green-100]="student.status === 'ATIVO'" [class.text-green-700]="student.status === 'ATIVO'"
                      [class.bg-red-100]="student.status === 'INATIVO'" [class.text-red-700]="student.status === 'INATIVO'">
                  <span class="w-1.5 h-1.5 rounded-full" [class.bg-green-500]="student.status === 'ATIVO'" [class.bg-red-500]="student.status === 'INATIVO'"></span>
                  {{ student.status }}
                </span>
              </td>

              <!-- AÇÕES ATUALIZADAS -->
              <td class="px-6 py-4 text-right align-top">
                <div class="flex flex-col items-end gap-2">
                  <button (click)="edit.emit(student.id)" class="text-blue-600 hover:text-blue-800 font-bold text-xs hover:underline flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                    Editar
                  </button>
                  
                  <button (click)="cancel.emit(student.id)" class="text-red-500 hover:text-red-700 font-bold text-xs hover:underline flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Cancelar matrícula
                  </button>
                </div>
              </td>
            </tr>

            <tr *ngIf="students.length === 0">
              <td colspan="6" class="px-6 py-12 text-center text-gray-400 italic">
                Nenhum aluno encontrado.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Rodapé Paginação -->
      <div class="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <div class="text-sm text-gray-500">
          Mostrando <span class="font-bold text-gray-900">{{ getStartItemIndex() }}</span> a <span class="font-bold text-gray-900">{{ getEndItemIndex() }}</span> de <span class="font-bold text-gray-900">{{ total }}</span> resultados
        </div>
        <div class="flex items-center gap-2">
          <button [disabled]="currentPage === 1" (click)="pageChange.emit(currentPage - 1)" class="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600">Anterior</button>
          <span class="text-sm font-medium text-gray-700 px-2">Página {{ currentPage }}</span>
          <button [disabled]="getEndItemIndex() >= total" (click)="pageChange.emit(currentPage + 1)" class="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600">Próximo</button>
        </div>
      </div>

    </div>
  `
})
export class StudentTableComponent {
  @Input() students: StudentSummary[] = [];
  @Input() total: number = 0;
  @Input() currentPage: number = 1;
  @Input() pageSize: number = 10;

  @Output() edit = new EventEmitter<number>();
  @Output() cancel = new EventEmitter<number>(); // Alterado de details para cancel
  @Output() pageChange = new EventEmitter<number>();

  getStartItemIndex(): number {
    if (this.total === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  getEndItemIndex(): number {
    const end = this.currentPage * this.pageSize;
    return end > this.total ? this.total : end;
  }
}