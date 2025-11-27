import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentSummary } from '../../enrollment/interfaces/enrollment.model';

@Component({
  selector: 'app-student-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      
      <!-- Tabela Responsiva -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-gray-600">
          <thead class="bg-gray-50 text-xs uppercase font-bold text-gray-500 border-b border-gray-200">
            <tr>
              <th class="px-6 py-4">Nome / CPF</th>
              <th class="px-6 py-4">Idade / Sexo</th>
              <th class="px-6 py-4">Curso / Turma</th>
              <th class="px-6 py-4 text-center">Turno</th>
              <th class="px-6 py-4 text-center">Status</th>
              <th class="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr *ngFor="let student of students" class="hover:bg-gray-50 transition-colors">
              
              <!-- Nome e CPF -->
              <td class="px-6 py-4">
                <p class="font-bold text-gray-900">{{ student.fullName }}</p>
                <p class="text-xs text-gray-400">{{ student.cpf }}</p>
              </td>

              <!-- Idade e Sexo -->
              <td class="px-6 py-4">
                <p>{{ student.age }} anos</p>
                <span class="text-xs px-2 py-0.5 rounded-full font-semibold" 
                      [class.bg-blue-100]="student.gender === 'M'" [class.text-blue-700]="student.gender === 'M'"
                      [class.bg-pink-100]="student.gender === 'F'" [class.text-pink-700]="student.gender === 'F'">
                  {{ student.gender === 'M' ? 'Masculino' : 'Feminino' }}
                </span>
              </td>

              <!-- Curso -->
              <td class="px-6 py-4">
                <p class="font-medium text-gray-800">{{ student.courseName }}</p>
                <p class="text-xs text-gray-500">{{ student.className }}</p>
              </td>

              <!-- Turno -->
              <td class="px-6 py-4 text-center">
                <span class="capitalize text-gray-700 bg-gray-100 px-2 py-1 rounded text-xs font-medium border border-gray-200">
                  {{ student.shift }}
                </span>
              </td>

              <!-- Status -->
              <td class="px-6 py-4 text-center">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                      [class.bg-green-100]="student.status === 'ATIVO'" [class.text-green-700]="student.status === 'ATIVO'"
                      [class.bg-red-100]="student.status === 'INATIVO'" [class.text-red-700]="student.status === 'INATIVO'">
                  <span class="w-1.5 h-1.5 rounded-full" [class.bg-green-500]="student.status === 'ATIVO'" [class.bg-red-500]="student.status === 'INATIVO'"></span>
                  {{ student.status }}
                </span>
              </td>

              <!-- Ações -->
              <td class="px-6 py-4 text-right">
                <button (click)="edit.emit(student.id)" class="text-blue-600 hover:text-blue-800 font-medium text-xs hover:underline mr-3">Editar</button>
                <button (click)="details.emit(student.id)" class="text-gray-500 hover:text-gray-700 font-medium text-xs hover:underline">Detalhes</button>
              </td>
            </tr>

            <!-- Estado Vazio -->
            <tr *ngIf="students.length === 0">
              <td colspan="6" class="px-6 py-12 text-center text-gray-400 italic">
                Nenhum aluno encontrado com os filtros selecionados.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class StudentTableComponent {
  @Input() students: StudentSummary[] = [];
  @Output() edit = new EventEmitter<number>();
  @Output() details = new EventEmitter<number>();
}