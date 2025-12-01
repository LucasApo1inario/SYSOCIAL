import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AttendanceService } from '../services/attendance.service';
import { AttendanceFilterComponent } from '../components/attendance-filter.component';
import { AttendanceTableComponent } from '../components/attendance-table.component';
import { ClassOption, CourseOption, AttendanceGrid, AttendanceFilter, StudentAttendance } from '../interfaces/attendance.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-attendance-manager-page',
  standalone: true,
  imports: [CommonModule, AttendanceFilterComponent, AttendanceTableComponent],
  template: `
    <div class="max-w-screen-2xl mx-auto p-6 pb-20">
      
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Gestão de Frequência (Supervisor)</h1>
          <p class="text-sm text-gray-500">Visualize, edite e justifique faltas.</p>
        </div>
        
        <!-- Botão Exportar CSV -->
        <button (click)="exportToCSV()" [disabled]="!gridData" 
                class="text-sm text-[#246A73] font-bold hover:underline flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          Exportar Relatório CSV
        </button>
      </div>

      <!-- Filtros -->
      <app-attendance-filter 
        [courses]="courses" 
        [classes]="classes"
        (courseChange)="onCourseChange($event)"
        (filterChange)="loadData($event)">
      </app-attendance-filter>

      <!-- Loading -->
      <div *ngIf="isLoading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-[#246A73]"></div>
      </div>

      <!-- Tabela -->
      <app-attendance-table 
        *ngIf="!isLoading"
        [gridData]="gridData"
        (statusChange)="onStatusChange($event)">
      </app-attendance-table>

      <!-- Botão Salvar -->
      <div class="mt-8 flex justify-end" *ngIf="gridData && gridData.students.length > 0">
        <button (click)="saveAll()" [disabled]="isSaving || changedDates.size === 0" 
                class="bg-[#246A73] text-white px-8 py-3 rounded-lg shadow-md font-bold hover:bg-opacity-90 transition-all flex items-center gap-2 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed">
          <span *ngIf="isSaving">Salvando...</span>
          <span *ngIf="!isSaving">Salvar Alterações</span>
        </button>
      </div>
    </div>
  `
})
export class AttendanceManagerPage implements OnInit {
  private service = inject(AttendanceService);

  @ViewChild(AttendanceFilterComponent) filterComponent!: AttendanceFilterComponent;

  courses: CourseOption[] = [];
  classes: ClassOption[] = [];
  gridData: AttendanceGrid | null = null;
  isLoading = false;
  isSaving = false;
  currentFilter: AttendanceFilter | null = null;
  
  currentProfessorName: string = 'Não Identificado';

  changedDates: Set<string> = new Set();

  ngOnInit() {
    this.service.getCourses().subscribe(data => {
      this.courses = data;
      if (this.courses.length > 0) {
        setTimeout(() => {
          if (this.filterComponent && this.filterComponent.form) {
             this.filterComponent.form.patchValue({ courseId: this.courses[0].id });
             this.onCourseChange(this.courses[0].id);
          }
        });
      }
    });
  }

  onCourseChange(courseId: number) {
    this.service.getClasses(courseId).subscribe(data => {
      this.classes = data;
      this.gridData = null; 
    });
  }

  loadData(filter: AttendanceFilter) {
    if (!filter.classId) return;
    
    const selectedClass = this.classes.find(c => c.id === filter.classId);
    const range = selectedClass ? { start: selectedClass.startDate, end: selectedClass.endDate } : undefined;

    this.currentFilter = filter;
    this.isLoading = true;
    this.gridData = null; 
    
    this.service.getAttendanceMatrix(filter.classId, filter.month, filter.year, range).subscribe({
      next: (data) => {
        if (!data.dates) data.dates = [];
        this.gridData = data;
        
        this.findProfessorName();

        this.changedDates.clear();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('[Manager] Erro:', err);
        this.isLoading = false;
        alert('Erro ao carregar dados. Verifique o console.');
      }
    });
  }

  private findProfessorName() {
    this.currentProfessorName = 'Não Identificado'; 
  }

  onStatusChange(event: {studentId: number, date: string, present: string | undefined}) {
    this.changedDates.add(event.date);

    if (event.present === 'F') {
        setTimeout(() => {
            const justify = confirm('Deseja justificar esta falta?');
            if (justify) {
                const obs = prompt('Digite a justificativa:');
                if (obs && obs.trim().length > 0) {
                    this.applyJustification(event.studentId, event.date, obs);
                }
            }
        }, 100);
    }
  }

  private applyJustification(studentId: number, date: string, observation: string) {
    if (!this.gridData) return;

    const student = this.gridData.students.find(s => s.studentId === studentId);
    if (student && student.attendance[date]) {
        student.attendance[date].status = 'FJ';
        student.attendance[date].observation = observation;
    }
  }

  saveAll() {
    if (!this.gridData || !this.gridData.dateIdMap) return;
    if (this.changedDates.size === 0) {
        alert('Nenhuma alteração para salvar.');
        return;
    }

    this.isSaving = true;

    const requests = Array.from(this.changedDates).map(date => {
        const callId = this.gridData!.dateIdMap[date];
        
        if (!callId) {
            console.warn(`[Save] ID de chamada não encontrado para ${date}`);
            return null;
        }

        return this.service.saveAttendanceForCall(
            callId, 
            this.gridData!.students,
            date
        );
    }).filter(req => req !== null);

    if (requests.length === 0) {
        this.isSaving = false;
        alert('Erro técnico: IDs das chamadas não encontrados.');
        return;
    }

    forkJoin(requests).subscribe({
        next: () => {
            this.isSaving = false;
            alert('Alterações salvas com sucesso!');
            this.changedDates.clear();
            this.loadData(this.currentFilter!);
        },
        error: (err) => {
            console.error('Erro ao salvar:', err);
            this.isSaving = false;
            let msg = 'Erro ao salvar.';
            if (err.error && err.error.details) msg += ` ${err.error.details}`;
            alert(msg);
        }
    });
  }

  exportToCSV() {
    if (!this.gridData || !this.currentFilter) return;

    const course = this.courses.find(c => c.id === this.currentFilter!.courseId);
    const turma = this.classes.find(t => t.id === this.currentFilter!.classId);
    const monthName = this.filterComponent.months[this.currentFilter.month];
    const year = this.currentFilter.year;

    let csvContent = '\uFEFF'; 
    csvContent += `Relatório de Frequência\n`;
    csvContent += `Curso;${course?.name || 'N/A'}\n`;
    csvContent += `Turma;${turma?.name || 'N/A'}\n`;
    csvContent += `Professor;${this.currentProfessorName}\n`; 
    csvContent += `Período;${monthName}/${year}\n\n`;

    const datesHeaders = this.gridData.dates.map(d => {
        const [y, m, day] = d.split('-');
        return `${day}/${m}`;
    });
    
    const headerRow = ['Aluno', ...datesHeaders, 'Presenças', 'Faltas', 'Justif.', 'Freq %'];
    csvContent += headerRow.join(';') + '\n';

    this.gridData.students.forEach(student => {
        const row = [student.studentName];

        this.gridData!.dates.forEach(date => {
            const record = student.attendance[date];
            let status = '-';
            if (record) {
                if (record.status === 'FJ' && record.observation) {
                    status = `FJ (${record.observation})`;
                } else {
                    status = record.status === '___EMPTY___' ? '-' : record.status;
                }
            }
            row.push(status);
        });

        const freq = this.calculateFrequency(student);
        row.push(student.stats.presents.toString());
        row.push(student.stats.absences.toString());
        row.push(student.stats.justified.toString());
        row.push(`${freq}%`);

        csvContent += row.join(';') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const fileName = `Frequencia_${turma?.name || 'Turma'}_${monthName}_${year}.csv`;
    
    if ((navigator as any).msSaveBlob) { 
        (navigator as any).msSaveBlob(blob, fileName);
    } else {
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  }

  private calculateFrequency(student: StudentAttendance): number {
    const totalClassDays = this.gridData?.dates.length || 0;
    if (totalClassDays === 0) return 100;
    
    const records = Object.values(student.attendance);
    const recordedDays = records.length;
    
    if (recordedDays === 0) return 100; 

    const presents = records.filter(r => r && (r.status === 'P' || r.status === 'FJ')).length;
    return Math.round((presents / recordedDays) * 100);
  }
}