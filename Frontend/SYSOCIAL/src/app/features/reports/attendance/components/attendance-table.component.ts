import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentAttendance, AttendanceRecord, AttendanceGrid } from '../interfaces/attendance.model';

@Component({
  selector: 'app-attendance-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- ESTADO 1: Tabela com Dados -->
    <div class="relative z-0 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" 
         *ngIf="gridData && gridData.students.length > 0">
      
      <!-- Navegação -->
      <div class="flex items-center justify-between bg-gray-50 px-4 py-2 border-b border-gray-200" *ngIf="gridData.dates.length > pageSize">
        <button (click)="prevPage()" [disabled]="currentPage === 0" class="p-1 text-gray-500 hover:text-gray-800 disabled:opacity-30 transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        
        <span class="text-xs font-bold text-gray-500 uppercase tracking-wide">
          Exibindo {{ getVisibleDates()[0] | date:'dd/MM' }} a {{ getVisibleDates()[getVisibleDates().length-1] | date:'dd/MM' }}
        </span>

        <button (click)="nextPage()" [disabled]="(currentPage + 1) * pageSize >= gridData.dates.length" class="p-1 text-gray-500 hover:text-gray-800 disabled:opacity-30 transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-bold">
              <th class="p-4 sticky left-0 bg-gray-50 z-10 border-r border-gray-200 min-w-[250px]">Nome do Aluno</th>
              <th *ngFor="let date of getVisibleDates()" class="p-2 text-center min-w-[80px] border-r border-gray-100">
                <div class="flex flex-col">
                  <span class="text-gray-900 text-sm">{{ date | date:'dd/MM' }}</span>
                  <span class="text-[10px] font-normal text-gray-400 uppercase">{{ date | date:'EEE' }}</span>
                </div>
              </th>
              <th class="p-4 text-center min-w-[100px] bg-gray-50 text-xs font-bold text-gray-500 uppercase border-l border-gray-200">
                Frequência
              </th>
            </tr>
          </thead>
          
          <tbody class="divide-y divide-gray-100">
            <tr *ngFor="let student of gridData.students" class="hover:bg-gray-50 transition-colors group">
              <td class="p-4 sticky left-0 bg-white group-hover:bg-gray-50 z-10 border-r border-gray-200">
                <span class="font-bold text-gray-700 text-sm">{{ student.studentName }}</span>
              </td>

              <td *ngFor="let date of getVisibleDates()" class="p-2 text-center border-r border-gray-100">
                <ng-container *ngIf="getRecord(student, date) as record">
                  
                  <div *ngIf="record.status === 'FJ'" 
                       class="w-10 h-10 mx-auto rounded bg-yellow-50 border border-yellow-200 flex items-center justify-center cursor-help group/tooltip relative"
                       title="Falta Justificada">
                     <span class="text-sm font-bold text-yellow-600">J</span>
                     <div class="absolute bottom-full mb-2 hidden group-hover/tooltip:block bg-gray-800 text-white text-xs p-2 rounded whitespace-nowrap z-50 shadow-lg">
                       Obs: {{ record.observation }}
                     </div>
                  </div>

                  <button *ngIf="record.status !== 'FJ'"
                          (click)="togglePresence(student, date)"
                          class="w-10 h-10 mx-auto rounded transition-all flex items-center justify-center font-bold text-sm focus:outline-none focus:ring-2 focus:ring-offset-1"
                          [ngClass]="getStatusClass(record.status)">
                    {{ getStatusLabel(record.status) }}
                  </button>

                </ng-container>
              </td>

              <td class="p-4 text-center border-l border-gray-200">
                <div class="flex items-center justify-center gap-1">
                  <span class="text-sm font-bold" [ngClass]="getFrequencyColor(calculateFrequency(student))">
                    {{ calculateFrequency(student) }}%
                  </span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div class="bg-green-500 h-1.5 rounded-full" [style.width.%]="calculateFrequency(student)" [ngClass]="getFrequencyBgColor(calculateFrequency(student))"></div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="bg-gray-50 px-6 py-4 border-t border-gray-200 flex flex-wrap gap-6 text-xs font-medium text-gray-600">
        <div class="flex items-center gap-2"><span class="w-3 h-3 rounded bg-green-100 border border-green-200 text-green-700 flex items-center justify-center text-[8px]">P</span> Presente</div>
        <div class="flex items-center gap-2"><span class="w-3 h-3 rounded bg-red-100 border border-red-200 text-red-700 flex items-center justify-center text-[8px]">F</span> Falta</div>
        <div class="flex items-center gap-2"><span class="w-3 h-3 rounded bg-yellow-100 border border-yellow-200 text-yellow-700 flex items-center justify-center text-[8px]">J</span> Falta Justificada</div>
        <div class="flex items-center gap-2"><span class="w-3 h-3 rounded bg-gray-100 border border-gray-200 text-gray-400 flex items-center justify-center text-[8px]">-</span> Não Preenchido</div>
      </div>
    </div>

    <!-- ESTADO 2: Dados Carregados mas SEM ALUNOS -->
    <div *ngIf="gridData && gridData.students.length === 0" 
         class="text-center py-20 bg-yellow-50 rounded-xl border-2 border-dashed border-yellow-200 mt-6">
      <div class="flex flex-col items-center gap-3">
        <svg class="w-12 h-12 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        <h3 class="text-lg font-bold text-yellow-800">Turma sem Alunos</h3>
        <p class="text-yellow-600 font-medium">Esta turma ainda não possui alunos matriculados ativos.</p>
        <p class="text-xs text-yellow-500">Cadastre alunos na turma para realizar a chamada.</p>
      </div>
    </div>

    <!-- ESTADO 3: Nada selecionado (Estado Inicial) -->
    <div *ngIf="!gridData" 
         class="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 mt-6">
      <p class="text-gray-400 font-medium">Selecione um curso e turma para visualizar a lista de chamada.</p>
    </div>
  `
})
export class AttendanceTableComponent implements OnChanges {
  @Input() gridData: AttendanceGrid | null = null;
  @Output() statusChange = new EventEmitter<any>();

  currentPage = 0;
  pageSize = 7; 

  ngOnChanges(changes: SimpleChanges) {
    if (changes['gridData']) {
      this.currentPage = 0;
    }
  }

  // --- Lógica de Paginação ---
  getVisibleDates(): string[] {
    if (!this.gridData || !this.gridData.dates) return [];
    const start = this.currentPage * this.pageSize;
    return this.gridData.dates.slice(start, start + this.pageSize);
  }

  nextPage() {
    if (this.gridData && (this.currentPage + 1) * this.pageSize < this.gridData.dates.length) {
      this.currentPage++;
    }
  }

  prevPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
    }
  }

  // --- Recuperação de Dados (Sem Mutação) ---
  getRecord(student: StudentAttendance, date: string): AttendanceRecord {
    if (!student.attendance) {
        student.attendance = {};
    }
    if (!student.attendance[date]) {
      return { status: '___EMPTY___', observation: '' } as AttendanceRecord;
    }
    return student.attendance[date];
  }

  // --- Helpers Visuais ---
  isEmpty(status: string): boolean {
    return status === '___EMPTY___';
  }
  
  getStatusLabel(status: string): string {
    if (this.isEmpty(status)) return '-';
    return status === 'FJ' ? 'J' : status;
  }

  getStatusClass(status: string): string {
    if (status === 'FJ') return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border border-yellow-200';
    if (this.isEmpty(status)) return 'bg-gray-100 text-gray-400 hover:bg-gray-200 border border-gray-200';
    
    if (status === 'P') return 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-100';
    if (status === 'F') return 'bg-red-50 text-red-500 hover:bg-red-100 border border-red-100';
    
    return '';
  }

  // --- Lógica de Clique (Alteração de Estado) ---
  togglePresence(student: StudentAttendance, date: string) {
    if (!student.attendance) student.attendance = {};

    let record = student.attendance[date];
    
    if (!record || record.status === '___EMPTY___') {
       student.attendance[date] = { status: 'P', observation: '' };
       this.emitChange(student, date, 'P');
       return;
    }
    
    if (record.status === 'FJ') return;

    if (record.status === 'P') {
      record.status = 'F';
      this.emitChange(student, date, 'F');
    } else if (record.status === 'F') {
      delete student.attendance[date];
      this.emitChange(student, date, undefined);
    } else {
        record.status = 'P';
        this.emitChange(student, date, 'P');
    }
  }

  emitChange(student: StudentAttendance, date: string, status: string | undefined) {
    this.statusChange.emit({
      studentId: student.studentId,
      date: date,
      present: status // Envia 'P', 'F' ou undefined
    });
  }

  // --- Cálculos ---
  calculateFrequency(student: StudentAttendance): number {
    const totalClassDays = this.gridData?.dates.length || 0;
    if (totalClassDays === 0) return 100;
    
    if (!student.attendance) return 100;

    const records = Object.values(student.attendance);
    const recordedDays = records.length;
    
    if (recordedDays === 0) return 100; 

    const presents = records.filter(r => r && (r.status === 'P' || r.status === 'FJ')).length;
    
    return Math.round((presents / recordedDays) * 100);
  }

  getFrequencyColor(freq: number): string {
    if (freq >= 85) return 'text-green-600';
    if (freq >= 75) return 'text-yellow-600';
    return 'text-red-600';
  }

  getFrequencyBgColor(freq: number): string {
    if (freq >= 85) return 'bg-green-500';
    if (freq >= 75) return 'bg-yellow-500';
    return 'bg-red-500';
  }
}