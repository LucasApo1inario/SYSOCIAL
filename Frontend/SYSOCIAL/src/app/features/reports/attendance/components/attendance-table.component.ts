import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentAttendanceRow, AttendanceRecord, AttendanceGrid } from '../interfaces/attendance.model';

@Component({
  selector: 'app-attendance-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" *ngIf="gridData && gridData.students.length > 0; else emptyState">
      
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-bold">
              <th class="p-4 sticky left-0 bg-gray-50 z-10 border-r border-gray-200 min-w-[200px]">Nome do Aluno</th>
              
              <!-- Datas Dinâmicas -->
              <th *ngFor="let date of gridData.dates" class="p-2 text-center min-w-[60px] border-r border-gray-100">
                <div class="flex flex-col">
                  <span class="text-gray-900">{{ date | date:'dd/MM' }}</span>
                  <span class="text-[10px] font-normal text-gray-400">{{ date | date:'EEE' }}</span>
                </div>
              </th>
              
              <!-- Estatísticas -->
              <th class="p-2 text-center w-16 bg-gray-50 text-green-600 border-l border-gray-200">P</th>
              <th class="p-2 text-center w-16 bg-gray-50 text-red-500">F</th>
              <th class="p-2 text-center w-16 bg-gray-50 text-yellow-600">J</th>
            </tr>
          </thead>
          
          <tbody class="divide-y divide-gray-100">
            <tr *ngFor="let student of gridData.students" class="hover:bg-gray-50 transition-colors group">
              
              <!-- Nome -->
              <td class="p-4 sticky left-0 bg-white group-hover:bg-gray-50 z-10 border-r border-gray-200">
                <span class="font-bold text-gray-700 text-sm">{{ student.studentName }}</span>
              </td>

              <!-- Células de Chamada -->
              <td *ngFor="let date of gridData.dates" class="p-1 text-center border-r border-gray-100">
                <ng-container *ngIf="getRecord(student, date) as record">
                  
                  <!-- CASE 1: Justificada (Supervisor colocou obs) -->
                  <div *ngIf="isJustified(record)" 
                       class="w-full h-10 rounded bg-yellow-50 border border-yellow-200 flex items-center justify-center cursor-help group/tooltip relative"
                       title="Falta Justificada">
                     <span class="text-sm font-bold text-yellow-600">J</span>
                     <!-- Tooltip simples -->
                     <div class="absolute bottom-full mb-2 hidden group-hover/tooltip:block bg-gray-800 text-white text-xs p-2 rounded whitespace-nowrap z-50 shadow-lg">
                       Obs: {{ record.observation }}
                     </div>
                  </div>

                  <!-- CASE 2: Normal (P ou F) -->
                  <button *ngIf="!isJustified(record)"
                          (click)="togglePresence(student, date)"
                          class="w-full h-10 rounded transition-all flex items-center justify-center font-bold text-sm focus:outline-none focus:ring-2 focus:ring-offset-1"
                          [ngClass]="record.present ? 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-100' : 'bg-red-50 text-red-500 hover:bg-red-100 border border-red-100'">
                    {{ record.present ? 'P' : 'F' }}
                  </button>

                </ng-container>
              </td>

              <!-- Stats -->
              <td class="text-center font-bold text-sm text-green-600 border-l border-gray-200">{{ student.stats.presents }}</td>
              <td class="text-center font-bold text-sm text-red-500">{{ student.stats.absences }}</td>
              <td class="text-center font-bold text-sm text-yellow-600">{{ student.stats.justified }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <ng-template #emptyState>
      <div class="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 mt-6">
        <p class="text-gray-400 font-medium">Selecione um curso e turma para visualizar a chamada.</p>
      </div>
    </ng-template>
  `
})
export class AttendanceTableComponent {
  @Input() gridData: AttendanceGrid | null = null;
  @Output() statusChange = new EventEmitter<any>();

  getRecord(student: StudentAttendanceRow, date: string): AttendanceRecord | undefined {
    if (!student.attendance[date]) {
      // Cria um placeholder se não existir
      student.attendance[date] = { present: true, observation: '' };
    }
    return student.attendance[date];
  }

  isJustified(record: AttendanceRecord): boolean {
    return !record.present && !!record.observation && record.observation.trim() !== '';
  }

  togglePresence(student: StudentAttendanceRow, date: string) {
    const record = student.attendance[date];
    if (this.isJustified(record)) return;

    // Alterna P <-> F
    record.present = !record.present;

    // Recalcula stats visualmente
    this.updateStats(student);
  }

  updateStats(student: StudentAttendanceRow) {
    const records = Object.values(student.attendance);
    student.stats.presents = records.filter(r => r.present).length;
    student.stats.absences = records.filter(r => !r.present && !r.observation).length;
  }
}